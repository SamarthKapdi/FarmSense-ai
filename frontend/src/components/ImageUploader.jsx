import React, { useState, useRef } from "react";
import LanguageSelector from "./LanguageSelector";
import { detectDisease } from "../services/api";

const CROPS = [
    "Rice", "Wheat", "Tomato", "Potato",
    "Cotton", "Maize", "Sugarcane", "Soybean",
    "Groundnut", "Onion", "Chili", "Mango",
];

const SUBTITLES = {
    en: "Upload crop photo for instant AI diagnosis",
    hi: "फसल की फोटो अपलोड करें तुरंत जांच के लिए",
    ta: "உடனடி நோய் கண்டறிதலுக்கு பயிர் புகைப்படம்",
    te: "తక్షణ రోగ నిర్ధారణకు పంట ఫోటో అప్లోడ్ చేయండి",
    mr: "त्वरित निदानासाठी पीक फोटो अपलोड करा",
    pa: "ਤੁਰੰਤ ਜਾਂਚ ਲਈ ਫਸਲ ਦੀ ਫੋਟੋ ਅਪਲੋਡ ਕਰੋ",
};

export default function ImageUploader({ language, farmerId, token, onResult, onLanguageChange }) {
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [selectedCrop, setSelectedCrop] = useState("Tomato");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                setError("Image size must be less than 10MB");
                return;
            }
            setSelectedImage(file);
            setImagePreview(URL.createObjectURL(file));
            setError(null);
        }
    };

    const handleSubmit = async () => {
        if (!selectedImage) return;
        setIsLoading(true);
        setError(null);

        try {
            const result = await detectDisease(selectedImage, selectedCrop, language, token);
            onResult(result);
        } catch (err) {
            setError(err.message || "Detection failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith("image/")) {
            setSelectedImage(file);
            setImagePreview(URL.createObjectURL(file));
            setError(null);
        }
    };

    return (
        <div className="px-4 pt-6 pb-4 max-w-lg mx-auto fade-in">
            {/* Language Selector */}
            <div className="mb-5">
                <LanguageSelector
                    selectedLanguage={language}
                    onLanguageChange={onLanguageChange}
                />
            </div>

            {/* Header */}
            <div className="text-center mb-6">
                <h1 className="text-3xl font-extrabold mb-2">
                    <span className="mr-2">🌾</span>
                    <span className="gradient-text">FarmSense AI</span>
                </h1>
                <p className="text-gray-400 text-sm">
                    {SUBTITLES[language] || SUBTITLES.en}
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
          ${imagePreview
                        ? "border-accent/50 bg-darker"
                        : "border-gray-600 hover:border-accent hover:bg-accent/5"
                    }
        `}
            >
                {imagePreview ? (
                    <div className="relative w-full">
                        <img
                            src={imagePreview}
                            alt="Selected crop"
                            className="rounded-xl max-h-64 mx-auto object-contain"
                        />
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedImage(null);
                                setImagePreview(null);
                            }}
                            className="absolute top-2 right-2 bg-red-900/80 hover:bg-red-800 
                         text-[var(--text-primary)] rounded-full w-8 h-8 flex items-center 
                         justify-center text-sm transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-3">
                        <div className="text-5xl leaf-pulse">📷</div>
                        <p className="text-gray-300 font-medium">
                            Tap to upload photo
                        </p>
                        <p className="text-gray-500 text-xs">
                            JPG, PNG up to 10MB
                        </p>
                    </div>
                )}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                />
            </div>

            {/* Crop Selector */}
            <div className="mb-5">
                <label className="block text-sm text-gray-400 mb-2 font-medium">
                    🌱 Select Crop
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
                disabled={!selectedImage || isLoading}
                className={`
          w-full py-4 rounded-xl font-bold text-lg transition-all duration-300
          ${selectedImage && !isLoading
                        ? "bg-gradient-to-r from-primary to-accent text-[var(--text-primary)] hover:shadow-lg hover:shadow-accent/20 active:scale-[0.98]"
                        : "bg-gray-800 text-gray-500 cursor-not-allowed"
                    }
        `}
            >
                {isLoading ? "Analyzing..." : "🔬 Analyze Crop"}
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

            {/* Loading Overlay */}
            {isLoading && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm 
                        flex items-center justify-center z-50">
                    <div className="flex flex-col items-center gap-4 p-8">
                        <div className="text-6xl leaf-pulse">🌿</div>
                        <div className="loading-spinner"></div>
                        <p className="text-accent font-semibold text-lg">
                            AI analyzing your crop...
                        </p>
                        <p className="text-gray-400 text-xs">
                            This may take a few seconds
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
