import React, { useState, useRef } from "react";
import { detectDisease } from "../services/api";
import { useLanguage } from "../context/LanguageContext";

const CROPS = [
    "Rice", "Wheat", "Tomato", "Potato",
    "Cotton", "Maize", "Sugarcane", "Soybean",
    "Groundnut", "Onion", "Chili", "Mango",
];

export default function ImageUploader({ language, farmerId, token, onResult }) {
    const { t } = useLanguage();
    const [selectedImages, setSelectedImages] = useState([]);
    const [selectedCrop, setSelectedCrop] = useState("Tomato");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handleImageSelect = (e) => {
        const files = Array.from(e.target.files);
        const validFiles = files.filter(f => f.type.startsWith("image/") && f.size <= 10 * 1024 * 1024);
        if (files.some(f => f.size > 10 * 1024 * 1024)) {
            setError("Some images were ignored because they exceed 10MB");
        } else {
            setError(null);
        }
        
        if (validFiles.length > 0) {
            const newImages = validFiles.map(file => ({
                file,
                preview: URL.createObjectURL(file)
            }));
            setSelectedImages(prev => [...prev, ...newImages]);
        }
    };

    // Canvas-based image optimization: resize to max 1024px, compress to JPEG 0.8
    const optimizeImage = (file) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const MAX_DIM = 1024;
                let { width, height } = img;
                if (width > MAX_DIM || height > MAX_DIM) {
                    const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }
                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(
                    (blob) => resolve(new File([blob], file.name, { type: "image/jpeg" })),
                    "image/jpeg",
                    0.8
                );
            };
            img.src = URL.createObjectURL(file);
        });
    };

    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadPhase, setUploadPhase] = useState(""); // "optimizing" | "uploading" | ""

    const handleSubmit = async () => {
        if (selectedImages.length === 0) return;
        setIsLoading(true);
        setError(null);
        setUploadProgress(0);
        setUploadPhase("optimizing");

        try {
            const optimizedImages = await Promise.all(
                selectedImages.map(img => optimizeImage(img.file))
            );
            setUploadPhase("uploading");

            // XMLHttpRequest for progress events
            const result = await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                const BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';
                const endpoint = selectedImages.length > 1 ? `${BASE}/farm/detect-batch` : `${BASE}/farm/detect`;
                xhr.open('POST', endpoint);
                if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

                xhr.upload.onprogress = (e) => {
                    if (e.lengthComputable) {
                        setUploadProgress(Math.round((e.loaded / e.total) * 100));
                    }
                };
                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const json = JSON.parse(xhr.responseText);
                            resolve(json.data !== undefined ? json.data : json);
                        } catch { reject(new Error("Invalid server response")); }
                    } else {
                        try {
                            const json = JSON.parse(xhr.responseText);
                            reject(new Error(json.message || `Server error (${xhr.status})`));
                        } catch { reject(new Error(`Upload failed (${xhr.status})`)); }
                    }
                };
                xhr.onerror = () => reject(new Error("Network error — check your connection"));
                xhr.ontimeout = () => reject(new Error("Upload timed out"));
                xhr.timeout = 120000;

                const formData = new FormData();
                if (selectedImages.length > 1) {
                    optimizedImages.forEach(opt => formData.append('images', opt));
                } else {
                    formData.append('image', optimizedImages[0]);
                }
                formData.append('crop', selectedCrop);
                formData.append('language', language);
                xhr.send(formData);
            });

            setUploadProgress(100);
            onResult(result);
        } catch (err) {
            setError(err.message || "Detection failed. Please try again.");
        } finally {
            setIsLoading(false);
            setUploadPhase("");
            setUploadProgress(0);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const files = Array.from(e.dataTransfer.files);
        const validFiles = files.filter(f => f.type.startsWith("image/") && f.size <= 10 * 1024 * 1024);
        if (files.some(f => f.size > 10 * 1024 * 1024)) {
            setError("Some images were ignored because they exceed 10MB");
        } else {
            setError(null);
        }
        
        if (validFiles.length > 0) {
            const newImages = validFiles.map(file => ({
                file,
                preview: URL.createObjectURL(file)
            }));
            setSelectedImages(prev => [...prev, ...newImages]);
        }
    };

    return (
        <div className="px-4 pt-6 pb-4 max-w-lg mx-auto fade-in">
            {/* Header */}
            <div className="text-center mb-6">
                <h1 className="text-3xl font-extrabold mb-2">
                    <span className="mr-2">🌾</span>
                    <span className="gradient-text">{t("app.title")}</span>
                </h1>
                <p className="text-gray-400 text-sm">
                    {t("app.subtitle")}
                </p>
            </div>

            {/* Upload Zone */}
            <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`
          relative border-2 border-dashed rounded-2xl p-8
          text-center cursor-pointer transition-all duration-300
          mb-5 overflow-hidden min-h-[220px] flex items-center justify-center
          ${selectedImages.length > 0
                        ? "border-accent/50 bg-darker"
                        : "border-gray-600 hover:border-accent hover:bg-accent/5"
                    }
        `}
            >
                {selectedImages.length > 0 ? (
                    <div className="w-full">
                        <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-2 no-scrollbar">
                            {selectedImages.map((imgObj, idx) => (
                                <div key={idx} className="relative aspect-square">
                                    <img
                                        src={imgObj.preview}
                                        alt={`Selected crop ${idx + 1}`}
                                        className="rounded-xl w-full h-full object-cover border border-gray-700"
                                    />
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedImages(prev => prev.filter((_, i) => i !== idx));
                                        }}
                                        className="absolute top-1 right-1 bg-red-900/80 hover:bg-red-800 
                                     text-[var(--text-primary)] rounded-full w-6 h-6 flex items-center 
                                     justify-center text-xs transition-colors"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="mt-3 text-xs text-accent">
                            Tap here or drag more to add
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-3">
                        <div className="text-5xl leaf-pulse">📷</div>
                        <p className="text-gray-300 font-medium">
                            {t("upload.tap")}
                        </p>
                        <p className="text-gray-500 text-xs">
                            {t("upload.format")}
                        </p>
                    </div>
                )}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                />
            </div>

            {/* Crop Selector */}
            <div className="mb-5">
                <label className="block text-sm text-gray-400 mb-2 font-medium">
                    🌱 {t("upload.select_crop")}
                </label>
                <select
                    value={selectedCrop}
                    onChange={(e) => setSelectedCrop(e.target.value)}
                    className="w-full bg-darker border border-gray-700 rounded-xl 
                     px-4 py-3 text-[var(--text-primary)] focus:outline-none 
                     focus:border-accent transition-colors appearance-none
                     cursor-pointer"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2352B788' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 16px center',
                    }}
                >
                    {CROPS.map((crop) => (
                        <option key={crop} value={crop} className="bg-darker">
                            {crop}
                        </option>
                    ))}
                </select>
            </div>

            {/* Analyze Button */}
            <button
                onClick={handleSubmit}
                disabled={selectedImages.length === 0 || isLoading}
                className={`
          w-full py-4 rounded-xl font-bold text-lg transition-all duration-300
          ${selectedImages.length > 0 && !isLoading
                        ? "bg-gradient-to-r from-primary to-accent text-[var(--text-primary)] hover:shadow-lg hover:shadow-accent/20 active:scale-[0.98]"
                        : "bg-gray-800 text-gray-500 cursor-not-allowed"
                    }
        `}
            >
                {isLoading ? t("common.loading") : `🔬 ${t("upload.analyze")}`}
            </button>

            {/* Error Display */}
            {error && (
                <div className="mt-4 bg-red-950/50 border border-red-800/50 
                        rounded-xl p-4 fade-in">
                    <div className="flex items-center gap-2">
                        <span className="text-red-400">⚠️</span>
                        <p className="text-red-300 text-sm">{error}</p>
                    </div>
                </div>
            )}

            {/* Loading Overlay with Progress */}
            {isLoading && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm 
                        flex items-center justify-center z-50">
                    <div className="flex flex-col items-center gap-4 p-8 w-72">
                        <div className="text-6xl leaf-pulse">🌿</div>
                        <p className="text-accent font-semibold text-lg">
                            {uploadPhase === "optimizing" ? "Optimizing image..." :
                             uploadPhase === "uploading" ? `Uploading... ${uploadProgress}%` :
                             "AI analyzing your crop..."}
                        </p>
                        {/* Progress Bar */}
                        <div style={{
                            width: '100%', height: '8px', borderRadius: '8px',
                            background: 'rgba(255,255,255,0.1)', overflow: 'hidden',
                        }}>
                            <div style={{
                                width: uploadPhase === "optimizing" ? '10%' :
                                       uploadPhase === "uploading" ? `${uploadProgress}%` : '100%',
                                height: '100%', borderRadius: '8px',
                                background: 'linear-gradient(90deg, #2D6A4F, #52B788)',
                                transition: 'width 0.3s ease',
                            }} />
                        </div>
                        <p className="text-gray-400 text-xs">
                            {uploadPhase === "optimizing" ? "Compressing for faster upload" :
                             uploadPhase === "uploading" ? "Sending to AI server" :
                             "This may take a few seconds"}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
