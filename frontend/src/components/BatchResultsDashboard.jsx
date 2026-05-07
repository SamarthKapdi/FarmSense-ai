import React, { useState } from 'react'
import ResultsDashboard from './ResultsDashboard'

export default function BatchResultsDashboard({
  results,
  language,
  farmerId,
  token,
  onBack,
}) {
  const [expandedIndex, setExpandedIndex] = useState(null)

  if (expandedIndex !== null) {
    return (
      <ResultsDashboard 
        result={results[expandedIndex]} 
        language={language}
        farmerId={farmerId}
        token={token}
        onBack={() => setExpandedIndex(null)}
      />
    )
  }

  const getSeverityClass = (severity) => {
    if (!severity) return 'text-green-400'
    const lower = severity.toLowerCase()
    if (lower.includes('severe')) return 'text-red-400'
    if (lower.includes('moderate')) return 'text-yellow-400'
    return 'text-green-400'
  }

  return (
    <div className="px-4 pt-5 pb-4 max-w-lg mx-auto fade-in">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-accent mb-4 hover:text-muted transition-colors"
      >
        <span className="text-lg">←</span>
        <span className="text-sm font-medium">Back to Scan</span>
      </button>

      <h2 className="text-xl font-bold mb-4">
        <span className="mr-2">🌾</span>
        <span className="gradient-text">Batch Scan Results ({results.length})</span>
      </h2>

      <div className="space-y-4">
        {results.map((res, idx) => (
          <div 
            key={idx} 
            className="disease-card p-4 cursor-pointer hover:border-accent/50 transition-colors"
            onClick={() => setExpandedIndex(idx)}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg mb-1">{res.cropName || 'Crop'}</h3>
                {res.isHealthy ? (
                  <p className="text-green-400 font-medium text-sm">✅ Healthy</p>
                ) : (
                  <div>
                    <p className="text-red-400 font-medium text-sm">⚠️ {res.diseaseName}</p>
                    <p className={`text-xs mt-1 ${getSeverityClass(res.severity)}`}>
                      Severity: {res.severity}
                    </p>
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-accent font-bold">{res.confidence}%</div>
                <div className="text-[10px] text-gray-500 uppercase mt-1">Confidence</div>
              </div>
            </div>
            
            <button className="mt-3 w-full py-2 bg-[var(--bg-elevated)] rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:text-emerald-500 transition-colors">
              View Treatment Plan →
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
