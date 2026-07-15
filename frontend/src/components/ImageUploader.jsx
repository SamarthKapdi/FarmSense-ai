import React, { useState, useRef, useCallback, useEffect } from 'react'
import { apiUrl, API_BASE_URL } from '../services/baseUrl'
import { useLanguage } from '../context/LanguageContext'

const CROPS = [
  'Rice', 'Wheat', 'Tomato', 'Potato', 'Cotton', 'Maize',
  'Sugarcane', 'Soybean', 'Groundnut', 'Onion', 'Chili', 'Mango',
]

export default function ImageUploader({ language, farmerId, token, onResult }) {
  const { t } = useLanguage()
  const [selectedImages, setSelectedImages] = useState([])
  const [selectedCrop, setSelectedCrop] = useState('Tomato')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadPhase, setUploadPhase] = useState('')
  const [captureMode, setCaptureMode] = useState('environment') // 'environment' or 'user'

  // Component unmount cleanup
  useEffect(() => {
    return () => {
      selectedImages.forEach(img => {
        if (img.preview) URL.revokeObjectURL(img.preview)
      })
    }
  }, [selectedImages])

  // ── Image selection handlers ──────────────────────────────
  const addImages = useCallback((files) => {
    const validFiles = Array.from(files).filter(
      (f) => f.type.startsWith('image/') && f.size <= 10 * 1024 * 1024
    )
    const oversized = Array.from(files).some((f) => f.size > 10 * 1024 * 1024)
    if (oversized) {
      setError('Some images were skipped (exceeds 10MB limit)')
    } else {
      setError(null)
    }
    if (validFiles.length > 0) {
      const newImages = validFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }))
      setSelectedImages((prev) => [...prev, ...newImages])
    }
  }, [])

  const handleFileSelect = (e) => addImages(e.target.files)
  const handleCameraCapture = (e) => addImages(e.target.files)

  const removeImage = useCallback((idx) => {
    setSelectedImages((prev) => {
      const removed = prev[idx]
      if (removed?.preview) URL.revokeObjectURL(removed.preview)
      return prev.filter((_, i) => i !== idx)
    })
  }, [])

  // ── Image optimization ────────────────────────────────────
  const optimizeImage = (file) => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const MAX_DIM = 1024
        let { width, height } = img
        if (width > MAX_DIM || height > MAX_DIM) {
          const ratio = Math.min(MAX_DIM / width, MAX_DIM / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => resolve(new File([blob], file.name, { type: 'image/jpeg' })),
          'image/jpeg',
          0.75
        )
        URL.revokeObjectURL(img.src)
      }
      img.onerror = () => {
        URL.revokeObjectURL(img.src)
        resolve(file) // Fallback: use original if optimization fails
      }
      img.src = URL.createObjectURL(file)
    })
  }

  // ── Submit ────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (selectedImages.length === 0) return
    setIsLoading(true)
    setError(null)
    setUploadProgress(0)
    setUploadPhase('optimizing')

    try {
      const optimizedImages = await Promise.all(
        selectedImages.map((img) => optimizeImage(img.file))
      )
      setUploadPhase('uploading')

      const result = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        const endpoint =
          selectedImages.length > 1
            ? apiUrl('/farm/detect-batch')
            : apiUrl('/farm/detect')

        xhr.open('POST', endpoint)
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100))
          }
        }
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const json = JSON.parse(xhr.responseText)
              resolve(json.data !== undefined ? json.data : json)
            } catch {
              reject(new Error('Invalid server response'))
            }
          } else if (xhr.status === 401) {
            reject(new Error('Session expired. Please log in again.'))
          } else {
            try {
              const json = JSON.parse(xhr.responseText)
              reject(new Error(json.message || `Analysis failed (${xhr.status})`))
            } catch {
              reject(new Error(`Analysis failed (${xhr.status})`))
            }
          }
        }
        xhr.onerror = () =>
          reject(new Error('Cannot reach AI server. Check your connection and try again.'))
        xhr.ontimeout = () =>
          reject(new Error('Analysis timed out. Try a smaller or clearer image.'))
        xhr.timeout = 300000

        const formData = new FormData()
        if (selectedImages.length > 1) {
          optimizedImages.forEach((opt) => formData.append('images', opt))
        } else {
          formData.append('image', optimizedImages[0])
        }
        formData.append('crop', selectedCrop)
        formData.append('language', language)
        xhr.send(formData)
      })

      setUploadProgress(100)
      // Clean up previews
      selectedImages.forEach((img) => {
        if (img.preview) URL.revokeObjectURL(img.preview)
      })
      setSelectedImages([])
      onResult(result)
    } catch (err) {
      setError(err.message || 'Detection failed. Please try again.')
    } finally {
      setIsLoading(false)
      setUploadPhase('')
      setUploadProgress(0)
    }
  }

  // ── Drag & Drop ───────────────────────────────────────────
  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }
  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }
  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    addImages(e.dataTransfer.files)
  }

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto fade-in">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-extrabold mb-2">
          <span className="mr-2">🌾</span>
          <span className="gradient-text">{t('app.title')}</span>
        </h1>
        <p className="text-[var(--text-muted)] text-sm">{t('app.subtitle')}</p>
      </div>

      {/* Upload Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-2xl p-6
          text-center cursor-pointer transition-all duration-300
          mb-4 overflow-hidden min-h-[200px] flex items-center justify-center
          ${isDragOver
            ? 'border-[var(--accent)] bg-[var(--accent-muted)] scale-[1.02]'
            : selectedImages.length > 0
              ? 'border-[var(--accent)]/30 bg-[var(--bg-elevated)]'
              : 'border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent-muted)]'
          }
        `}
      >
        {selectedImages.length > 0 ? (
          <div className="w-full">
            <div className="grid grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1 no-scrollbar">
              {selectedImages.map((imgObj, idx) => (
                <div key={idx} className="relative aspect-square">
                  <img
                    src={imgObj.preview}
                    alt={`Crop image ${idx + 1}`}
                    className="rounded-xl w-full h-full object-cover border border-[var(--border)]"
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); removeImage(idx) }}
                    className="absolute top-1 right-1 bg-[var(--danger)] hover:bg-red-600 
                               text-white rounded-full w-6 h-6 flex items-center 
                               justify-center text-xs transition-colors shadow-md"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-[var(--accent)]">
              Tap to add more • {selectedImages.length} image{selectedImages.length > 1 ? 's' : ''} selected
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="text-5xl leaf-pulse">📷</div>
            <p className="text-[var(--text-primary)] font-medium">{t('upload.tap')}</p>
            <p className="text-[var(--text-muted)] text-xs">{t('upload.format')}</p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Camera + Gallery Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="relative flex">
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-l-xl
                       bg-[var(--bg-elevated)] border border-[var(--border)] 
                       text-[var(--text-secondary)] text-sm font-medium
                       hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all"
          >
            <span>📸</span> {t('upload.camera') || 'Camera'}
          </button>
          <button
            onClick={() => setCaptureMode(prev => prev === 'environment' ? 'user' : 'environment')}
            className="px-3 py-3 rounded-r-xl border-t border-b border-r border-[var(--border)]
                       bg-[var(--bg-elevated)] text-[var(--text-secondary)] text-sm hover:text-[var(--accent)] transition-colors"
            title="Flip Camera"
          >
            🔄
          </button>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-2 py-3 rounded-xl
                     bg-[var(--bg-elevated)] border border-[var(--border)] 
                     text-[var(--text-secondary)] text-sm font-medium
                     hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all"
        >
          <span>🖼️</span> {t('upload.gallery') || 'Gallery'}
        </button>
      </div>
      {/* Hidden camera input — dynamically flips based on captureMode */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture={captureMode}
        onChange={handleCameraCapture}
        className="hidden"
      />

      {/* Crop Selector */}
      <div className="mb-4">
        <label className="block text-sm text-[var(--text-muted)] mb-2 font-medium">
          🌱 {t('upload.select_crop')}
        </label>
        <select
          value={selectedCrop}
          onChange={(e) => setSelectedCrop(e.target.value)}
          className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl 
                     px-4 py-3 text-[var(--text-primary)] focus:outline-none 
                     focus:border-[var(--accent)] transition-colors appearance-none cursor-pointer"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2352B788' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 16px center',
          }}
        >
          {CROPS.map((crop) => (
            <option key={crop} value={crop} className="bg-[var(--bg-card)]">
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
            ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white hover:shadow-lg hover:shadow-[var(--accent)]/20 active:scale-[0.98]'
            : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] cursor-not-allowed'
          }
        `}
      >
        {isLoading ? t('common.loading') : `🔬 ${t('upload.analyze')}`}
      </button>

      {/* Error Display */}
      {error && (
        <div className="mt-4 bg-[var(--danger-bg)] border border-[var(--danger)]/20 
                        rounded-xl p-4 fade-in">
          <div className="flex items-start gap-2">
            <span className="text-[var(--danger)] flex-shrink-0">⚠️</span>
            <div>
              <p className="text-[var(--danger)] text-sm">{error}</p>
              <button
                onClick={handleSubmit}
                className="text-xs text-[var(--accent)] font-medium mt-2 hover:underline"
              >
                {t('common.retry') || 'Try again'} →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay with Progress */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm 
                        flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-4 p-8 w-80">
            <div className="text-6xl leaf-pulse">🌿</div>
            <p className="text-[var(--accent)] font-semibold text-lg text-center">
              {uploadPhase === 'optimizing'
                ? (t('upload.optimizing') || 'Optimizing image...')
                : uploadPhase === 'uploading'
                  ? `${t('upload.uploading') || 'Uploading...'} ${uploadProgress}%`
                  : (t('upload.analyzing') || 'AI analyzing your crop...')}
            </p>
            {/* Progress Bar */}
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: uploadPhase === 'optimizing' ? '15%'
                    : uploadPhase === 'uploading' ? `${uploadProgress}%`
                    : '100%',
                  background: 'linear-gradient(90deg, var(--primary), var(--accent))',
                }}
              />
            </div>
            <p className="text-[var(--text-muted)] text-xs text-center">
              {uploadPhase === 'optimizing'
                ? (t('upload.preparing') || 'Preparing image for AI analysis')
                : uploadPhase === 'uploading'
                  ? (t('upload.sending') || 'Sending to FarmSense AI server')
                  : (t('upload.vision_analyzing') || 'Gemini Vision is analyzing disease patterns...')}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
