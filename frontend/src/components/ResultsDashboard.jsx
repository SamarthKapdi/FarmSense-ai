import React from 'react'
import TreatmentTabs from './TreatmentTabs'

export default function ResultsDashboard({
  result,
  language,
  farmerId,
  token,
  onBack,
}) {
  const symptoms = Array.isArray(result.symptoms) ? result.symptoms : []

  const getSeverityClass = (severity) => {
    if (!severity) return 'severity-mild'
    const lower = severity.toLowerCase()
    if (lower.includes('severe')) return 'severity-severe'
    if (lower.includes('moderate')) return 'severity-moderate'
    return 'severity-mild'
  }

  const getConfidenceColor = (conf) => {
    if (conf >= 70) return '#52B788'
    if (conf >= 40) return '#F59E0B'
    return '#EF4444'
  }

  const circumference = 2 * Math.PI * 45
  const dashOffset =
    circumference - (circumference * (result.confidence || 0)) / 100

  const formatTime = (timestamp) => {
    if (!timestamp) return ''
    try {
      return new Date(timestamp).toLocaleString()
    } catch {
      return ''
    }
  }

  return (
    <div className="px-4 pt-5 pb-4 max-w-lg mx-auto fade-in">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-accent mb-4 
                   hover:text-muted transition-colors"
      >
        <span className="text-lg">←</span>
        <span className="text-sm font-medium">Back</span>
      </button>

      {/* Header */}
      <h2 className="text-xl font-bold mb-4">
        <span className="mr-2">🌾</span>
        <span className="gradient-text">FarmSense AI Results</span>
      </h2>

      {/* Healthy Banner */}
      {result.isHealthy && (
        <div
          className="bg-green-950/50 border border-green-700/50 
                        rounded-2xl p-4 mb-4 text-center fade-in"
        >
          <div className="text-4xl mb-2">✅</div>
          <p className="text-green-400 font-bold text-lg">
            Your crop is healthy!
          </p>
          <p className="text-green-600 text-sm mt-1">
            No disease symptoms detected
          </p>
        </div>
      )}

      {/* Urgent Banner */}
      {result.urgencyLevel === 'IMMEDIATE' && !result.isHealthy && (
        <div
          className="bg-red-950/60 border border-red-700/50 
                        rounded-2xl p-4 mb-4 text-center severity-severe fade-in"
          style={{ borderRadius: '16px' }}
        >
          <div className="text-2xl mb-1">🚨</div>
          <p className="text-red-300 font-bold">Immediate action required!</p>
        </div>
      )}

      {/* Card 1 — Disease Identity */}
      <div className="disease-card fade-in fade-in-delay-1">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-[var(--text-primary)] text-xl font-bold leading-tight">
              {result.diseaseName || 'Unknown Disease'}
            </h3>
            {result.cropName && (
              <span
                className="inline-block mt-2 bg-primary/60 text-[var(--text-primary)] 
                             text-xs px-3 py-1 rounded-full font-medium"
              >
                🌱 {result.cropName}
              </span>
            )}
          </div>
          <span className={getSeverityClass(result.severity)}>
            {result.severity || 'Unknown'}
          </span>
        </div>
        <p className="text-gray-500 text-xs">{formatTime(result.timestamp)}</p>
      </div>

      {/* Card 2 — Confidence Gauge */}
      <div className="disease-card fade-in fade-in-delay-2 flex items-center gap-6">
        <div className="relative flex-shrink-0">
          <svg width="110" height="110" className="confidence-ring">
            {/* Background circle */}
            <circle
              cx="55"
              cy="55"
              r="45"
              stroke="#1a3a2a"
              strokeWidth="8"
              fill="none"
            />
            {/* Foreground circle */}
            <circle
              cx="55"
              cy="55"
              r="45"
              stroke={getConfidenceColor(result.confidence)}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="confidence-ring-circle"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <span className="text-2xl font-extrabold text-[var(--text-primary)]">
                {result.confidence || 0}
              </span>
              <span className="text-xs text-gray-400 block">%</span>
            </div>
          </div>
        </div>
        <div>
          <p className="text-gray-400 text-sm mb-1">AI Confidence</p>
          <p className="text-[var(--text-primary)] font-semibold">
            {result.confidence >= 70
              ? 'High Confidence'
              : result.confidence >= 40
                ? 'Moderate Confidence'
                : 'Low Confidence'}
          </p>
          <span
            className={`inline-block mt-2 ${getSeverityClass(result.severity)}`}
          >
            {result.severity}
          </span>
        </div>
      </div>

      {/* Card 3 — Yield Loss Estimate */}
      {!result.isHealthy && (
        <div
          className="bg-red-950/30 border border-red-900/40 rounded-2xl 
                        p-5 mb-4 fade-in fade-in-delay-3"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-400 text-4xl font-extrabold">
                {result.yieldLossEstimate || 'N/A'}
              </p>
              <p className="text-red-300/60 text-sm mt-1">
                Estimated yield loss
              </p>
            </div>
            <div className="text-right">
              <p className="text-yellow-400 font-bold text-lg">
                {result.estimatedRecoveryCost || 'N/A'}
              </p>
              <p className="text-yellow-300/50 text-xs">Recovery cost</p>
            </div>
          </div>
        </div>
      )}

      {/* Card 4 — Symptoms */}
      {symptoms.length > 0 && (
        <div className="disease-card fade-in fade-in-delay-4">
          <h4 className="text-[var(--text-primary)] font-bold mb-3 flex items-center gap-2">
            <span>⚠️</span> Symptoms Detected
          </h4>
          <div className="space-y-3">
            {symptoms.map((symptom, index) => (
              <div key={index} className="flex items-start gap-3">
                <div
                  className="flex-shrink-0 w-7 h-7 bg-accent/20 
                              rounded-full flex items-center justify-center"
                >
                  <span className="text-accent text-xs font-bold">
                    {index + 1}
                  </span>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed pt-1">
                  {symptom}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Treatment Tabs */}
      <TreatmentTabs
        result={result}
        language={language}
        farmerId={farmerId}
        token={token}
      />
    </div>
  )
}
