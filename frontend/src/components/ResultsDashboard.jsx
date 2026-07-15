import React from 'react'
import TreatmentTabs from './TreatmentTabs'
import { useLanguage } from '../context/LanguageContext'

export default function ResultsDashboard({
  result,
  language,
  farmerId,
  token,
  onBack,
}) {
  const { t } = useLanguage()
  const symptoms = Array.isArray(result.symptoms) ? result.symptoms : []
  const envCauses = Array.isArray(result.environmentalCauses) ? result.environmentalCauses : []
  const diffDiag = Array.isArray(result.differentialDiagnosis) 
    ? result.differentialDiagnosis.filter(d => d && d.toUpperCase() !== 'N/A' && d.toUpperCase() !== 'NONE') 
    : []

  const getSeverityClass = (severity) => {
    if (!severity) return 'severity-mild'
    const lower = severity.toLowerCase()
    if (lower.includes('critical')) return 'severity-severe'
    if (lower.includes('severe')) return 'severity-severe'
    if (lower.includes('moderate')) return 'severity-moderate'
    return 'severity-mild'
  }

  const getUrgencyConfig = (level) => {
    switch (level) {
      case 'IMMEDIATE': return { color: '#ef4444', bg: 'rgba(239,68,68,0.15)', icon: '🚨', text: 'Immediate action required' }
      case 'HIGH': return { color: '#f97316', bg: 'rgba(249,115,22,0.15)', icon: '⚠️', text: 'High priority — act within 24 hours' }
      case 'MODERATE': return { color: '#eab308', bg: 'rgba(234,179,8,0.15)', icon: '📋', text: 'Moderate — schedule treatment this week' }
      case 'MONITOR': return { color: '#22c55e', bg: 'rgba(34,197,94,0.15)', icon: '👁️', text: 'Monitor closely over next 7 days' }
      default: return { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', icon: '✅', text: 'No action needed' }
    }
  }

  const getConfidenceColor = (conf) => {
    if (conf >= 70) return '#52B788'
    if (conf >= 40) return '#F59E0B'
    return '#EF4444'
  }

  const getSpreadColor = (risk) => {
    if (!risk) return '#94a3b8'
    const r = risk.toLowerCase()
    if (r.includes('very high')) return '#ef4444'
    if (r.includes('high')) return '#f97316'
    if (r.includes('moderate')) return '#eab308'
    return '#22c55e'
  }

  const circumference = 2 * Math.PI * 45
  const dashOffset = circumference - (circumference * (result.confidence || 0)) / 100

  const urgency = getUrgencyConfig(result.urgencyLevel)

  return (
    <div className="px-4 pt-5 pb-4 max-w-lg mx-auto fade-in">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[var(--accent)] mb-4 
                   hover:text-[var(--text-muted)] transition-colors"
      >
        <span className="text-lg">←</span>
        <span className="text-sm font-medium">{t('results.new_scan') || 'New Scan'}</span>
      </button>

      {/* ═══ HEALTHY BANNER ═══ */}
      {result.isHealthy && (
        <div className="bg-[rgba(34,197,94,0.08)] border border-[rgba(34,197,94,0.2)] 
                        rounded-2xl p-6 mb-4 text-center fade-in">
          <div className="text-5xl mb-3">✅</div>
          <p className="text-[var(--success)] font-bold text-xl">Your {result.cropName} is healthy!</p>
          <p className="text-[var(--text-muted)] text-sm mt-2">No disease symptoms detected</p>
        </div>
      )}

      {/* ═══ URGENCY BANNER ═══ */}
      {!result.isHealthy && result.urgencyLevel && result.urgencyLevel !== 'NONE' && (
        <div
          className="rounded-2xl p-4 mb-4 flex items-center gap-3 fade-in"
          style={{ background: urgency.bg, border: `1px solid ${urgency.color}30` }}
        >
          <span className="text-2xl">{urgency.icon}</span>
          <div>
            <p className="font-bold text-sm" style={{ color: urgency.color }}>{urgency.text}</p>
            {result.progressionSpeed && (
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Progression: {result.progressionSpeed}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ═══ DISEASE HERO CARD ═══ */}
      <div className="disease-card fade-in fade-in-delay-1">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="text-[var(--text-primary)] text-xl font-bold leading-tight">
              {result.diseaseName || 'Unknown'}
            </h3>
            {result.scientificName && result.scientificName !== 'N/A' && (
              <p className="text-[var(--text-muted)] text-xs italic mt-1">
                {result.scientificName}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {result.cropName && (
                <span className="inline-block bg-[var(--accent-muted)] text-[var(--accent)] 
                               text-xs px-3 py-1 rounded-full font-medium">
                  🌱 {result.cropName}
                </span>
              )}
              {result.spreadRisk && result.spreadRisk.toUpperCase() !== 'N/A' && result.spreadRisk.toUpperCase() !== 'NONE' && (
                <span
                  className="inline-block text-xs px-3 py-1 rounded-full font-medium"
                  style={{ background: getSpreadColor(result.spreadRisk) + '20', color: getSpreadColor(result.spreadRisk) }}
                >
                  📡 Spread: {result.spreadRisk}
                </span>
              )}
            </div>
          </div>
          {(!result.isHealthy && result.severity && result.severity.toUpperCase() !== 'N/A' && result.severity.toUpperCase() !== 'NONE') && (
            <span className={getSeverityClass(result.severity)}>
              {result.severity}
            </span>
          )}
        </div>
        {result.description && (
          <p className="text-[var(--text-secondary)] text-sm mt-3 leading-relaxed">
            {result.description}
          </p>
        )}
      </div>

      {/* ═══ CONFIDENCE + RECOVERABILITY ═══ */}
      <div className="disease-card fade-in fade-in-delay-2">
        <div className="flex items-center gap-5">
          {/* Confidence Ring */}
          <div className="relative flex-shrink-0">
            <svg width="100" height="100" className="confidence-ring">
              <circle cx="50" cy="50" r="45" stroke="rgba(148,163,184,0.1)" strokeWidth="7" fill="none" />
              <circle
                cx="50" cy="50" r="45"
                stroke={getConfidenceColor(result.confidence)}
                strokeWidth="7" fill="none" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={dashOffset}
                className="confidence-ring-circle"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <span className="text-2xl font-extrabold text-[var(--text-primary)]">
                  {result.confidence || 0}
                </span>
                <span className="text-xs text-[var(--text-muted)] block">%</span>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-[var(--text-muted)] text-xs mb-1">{t('disease.confidence') || 'AI Confidence'}</p>
            <p className="text-[var(--text-primary)] font-semibold text-sm">
              {result.confidence >= 70 ? (t('disease.high_confidence') || 'High Confidence') : result.confidence >= 40 ? (t('disease.mod_confidence') || 'Moderate Confidence') : (t('disease.low_confidence') || 'Low Confidence')}
            </p>
            {result.confidenceReasoning && (
              <p className="text-[var(--text-muted)] text-xs mt-2 leading-relaxed">
                {result.confidenceReasoning}
              </p>
            )}
            {result.recoverability && result.recoverability.toUpperCase() !== 'N/A' && result.recoverability.toUpperCase() !== 'NONE' && (
              <div className="mt-2 flex items-center gap-1.5">
                <span className="text-xs">🔄</span>
                <span className="text-xs text-[var(--text-secondary)]">
                  Recovery: {result.recoverability}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Image Quality Score */}
        {result.imageQualityScore !== undefined && result.imageQualityScore > 0 && (
          <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-start gap-3">
            <span className="text-xl">{result.imageQualityScore >= 70 ? '📸' : '🔍'}</span>
            <div>
              <p className="text-[var(--text-primary)] font-semibold text-xs">
                Image Quality: {result.imageQualityScore}%
              </p>
              {result.imageQualityReasoning && (
                <p className="text-[var(--text-muted)] text-[11px] mt-0.5 leading-relaxed">
                  {result.imageQualityReasoning}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ═══ YIELD + COST ═══ */}
      {!result.isHealthy && (
        <div className="grid grid-cols-2 gap-3 mb-4 fade-in fade-in-delay-3">
          <div className="bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.15)] rounded-xl p-4">
            <p className="text-[var(--danger)] text-2xl font-extrabold">
              {result.yieldLossEstimate || 'N/A'}
            </p>
            <p className="text-[var(--text-muted)] text-xs mt-1">{t('results.yield_loss') || 'Yield loss'}</p>
            {result.yieldLossReasoning && (
              <p className="text-[var(--text-muted)] text-[10px] mt-1.5 leading-relaxed">
                {result.yieldLossReasoning}
              </p>
            )}
          </div>
          <div className="bg-[rgba(234,179,8,0.06)] border border-[rgba(234,179,8,0.15)] rounded-xl p-4">
            <p className="text-[var(--warning)] text-lg font-bold">
              {result.estimatedRecoveryCost || 'N/A'}
            </p>
            <p className="text-[var(--text-muted)] text-xs mt-1">{t('results.recovery_cost') || 'Recovery cost'}</p>
            {result.bestTimeToTreat && (
              <p className="text-[var(--text-muted)] text-[10px] mt-1.5">
                🕐 {result.bestTimeToTreat}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ═══ SYMPTOMS ═══ */}
      {symptoms.length > 0 && (
        <div className="disease-card fade-in fade-in-delay-4">
          <h4 className="text-[var(--text-primary)] font-bold mb-3 flex items-center gap-2 text-sm">
            <span>🔍</span> {t('disease.symptoms') || 'Symptoms Identified'}
          </h4>
          <div className="space-y-2.5">
            {symptoms.map((symptom, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-[var(--accent-muted)] 
                              rounded-full flex items-center justify-center">
                  <span className="text-[var(--accent)] text-xs font-bold">{index + 1}</span>
                </div>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed pt-0.5">
                  {symptom}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ ENVIRONMENTAL CAUSES ═══ */}
      {envCauses.length > 0 && (
        <div className="disease-card fade-in">
          <h4 className="text-[var(--text-primary)] font-bold mb-3 flex items-center gap-2 text-sm">
            <span>🌍</span> {t('disease.env_factors') || 'Environmental Factors'}
          </h4>
          <div className="flex flex-wrap gap-2">
            {envCauses.map((cause, i) => (
              <span key={i} className="bg-[var(--bg-elevated)] text-[var(--text-secondary)] 
                                       text-xs px-3 py-1.5 rounded-full border border-[var(--border)]">
                {cause}
              </span>
            ))}
          </div>
          {/* Spread mechanism */}
          {result.spreadMechanism && (
            <div className="mt-3 pt-3 border-t border-[var(--border)]">
              <p className="text-xs text-[var(--text-muted)]">
                <span className="font-medium">Spread mechanism:</span> {result.spreadMechanism}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ═══ MONITORING & ENVIRONMENTAL ADVICE ═══ */}
      {!result.isHealthy && (result.monitoringAdvice || result.wateringAdvice || result.fertilizerAdvice || result.weatherImpact || result.soilImpact) && (
        <div className="disease-card fade-in">
          <h4 className="text-[var(--text-primary)] font-bold mb-3 flex items-center gap-2 text-sm">
            <span>📋</span> {t('disease.farm_mgmt') || 'Farm Management'}
          </h4>
          <div className="space-y-3">
            {result.monitoringAdvice && result.monitoringAdvice.toUpperCase() !== 'N/A' && result.monitoringAdvice.toUpperCase() !== 'NONE' && (
              <div className="flex items-start gap-2">
                <span className="text-sm flex-shrink-0">👁️</span>
                <div>
                  <p className="text-xs font-medium text-[var(--text-primary)]">Monitoring</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">{result.monitoringAdvice}</p>
                </div>
              </div>
            )}
            {result.wateringAdvice && result.wateringAdvice.toUpperCase() !== 'N/A' && result.wateringAdvice.toUpperCase() !== 'NONE' && (
              <div className="flex items-start gap-2">
                <span className="text-sm flex-shrink-0">💧</span>
                <div>
                  <p className="text-xs font-medium text-[var(--text-primary)]">Irrigation</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">{result.wateringAdvice}</p>
                </div>
              </div>
            )}
            {result.fertilizerAdvice && result.fertilizerAdvice.toUpperCase() !== 'N/A' && result.fertilizerAdvice.toUpperCase() !== 'NONE' && (
              <div className="flex items-start gap-2">
                <span className="text-sm flex-shrink-0">🧪</span>
                <div>
                  <p className="text-xs font-medium text-[var(--text-primary)]">Fertilizer</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">{result.fertilizerAdvice}</p>
                </div>
              </div>
            )}
            {result.weatherImpact && result.weatherImpact.toUpperCase() !== 'N/A' && result.weatherImpact.toUpperCase() !== 'NONE' && (
              <div className="flex items-start gap-2">
                <span className="text-sm flex-shrink-0">🌦️</span>
                <div>
                  <p className="text-xs font-medium text-[var(--text-primary)]">Weather Impact</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">{result.weatherImpact}</p>
                </div>
              </div>
            )}
            {result.soilImpact && result.soilImpact.toUpperCase() !== 'N/A' && result.soilImpact.toUpperCase() !== 'NONE' && (
              <div className="flex items-start gap-2">
                <span className="text-sm flex-shrink-0">🏔️</span>
                <div>
                  <p className="text-xs font-medium text-[var(--text-primary)]">Soil Impact</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">{result.soilImpact}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ DIFFERENTIAL DIAGNOSIS ═══ */}
      {diffDiag.length > 0 && (
        <div className="disease-card fade-in">
          <h4 className="text-[var(--text-primary)] font-bold mb-3 flex items-center gap-2 text-sm">
            <span>🔬</span> {t('disease.diff_diag') || 'Differential Diagnosis'}
          </h4>
          <p className="text-xs text-[var(--text-muted)] mb-2">
            Other conditions this could be confused with:
          </p>
          <div className="space-y-1.5">
            {diffDiag.map((alt, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]"></span>
                {alt}
              </div>
            ))}
          </div>
          {result.differentialDiagnosisReasoning && result.differentialDiagnosisReasoning.toUpperCase() !== 'N/A' && result.differentialDiagnosisReasoning.toUpperCase() !== 'NONE' && (
            <div className="mt-3 pt-3 border-t border-[var(--border)] bg-[var(--bg-elevated)] p-3 rounded-lg">
              <p className="text-[11px] font-medium text-[var(--text-primary)] mb-1">Why {result.diseaseName || 'this disease'}?</p>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed italic">
                {result.differentialDiagnosisReasoning}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ═══ TREATMENT TABS ═══ */}
      <TreatmentTabs result={result} language={language} farmerId={farmerId} token={token} />
    </div>
  )
}
