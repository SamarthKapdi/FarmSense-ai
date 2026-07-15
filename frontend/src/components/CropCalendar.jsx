import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { apiUrl } from '../services/baseUrl'

const CROPS = [
  'Rice',
  'Wheat',
  'Tomato',
  'Potato',
  'Cotton',
  'Maize',
  'Sugarcane',
  'Soybean',
  'Groundnut',
  'Onion',
  'Chili',
  'Mango',
]

const MONTH_COLORS = {
  sowing: '#52B788',
  growing: '#3B82F6',
  harvesting: '#F59E0B',
  default: '#6b7280',
}

function getMonthColor(activities) {
  if (!activities || !Array.isArray(activities)) return MONTH_COLORS.default
  const text = activities.join(' ').toLowerCase()
  if (text.includes('harvest')) return MONTH_COLORS.harvesting
  if (
    text.includes('sow') ||
    text.includes('transplant') ||
    text.includes('plant')
  )
    return MONTH_COLORS.sowing
  return MONTH_COLORS.growing
}

export default function CropCalendar() {
  const { token } = useAuth()
  const { language, t } = useLanguage()
  const [selectedCrop, setSelectedCrop] = useState('Tomato')
  const [calendar, setCalendar] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchCalendar = async (crop) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(
        apiUrl(`/farm/calendar/${encodeURIComponent(crop)}?lang=${encodeURIComponent(language)}`),
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      const json = await response.json()
      const data = json.data || json

      let calendarArray = []
      try {
        let raw = typeof data.calendar === 'string' ? data.calendar : JSON.stringify(data.calendar)
        // Remove markdown JSON code blocks if present
        raw = raw.replace(/```json/gi, '').replace(/```/g, '').trim()
        
        const start = raw.indexOf('[')
        const end = raw.lastIndexOf(']')
        if (start !== -1 && end !== -1 && end > start) {
          calendarArray = JSON.parse(raw.substring(start, end + 1))
        } else {
          // Attempt fallback parsing
          calendarArray = JSON.parse(raw)
        }
      } catch (e) {
        console.error("Calendar parsing failed:", e)
        // If parsing fails, show raw text
        calendarArray = []
      }

      setCalendar({
        crop: data.crop || crop,
        months: calendarArray,
        raw: data.calendar,
      })
    } catch (err) {
      setError('Failed to load calendar. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCropChange = (crop) => {
    setSelectedCrop(crop)
    setCalendar(null)
  }

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto fade-in">
      <h2 className="text-xl font-bold mb-5">
        <span className="mr-2">📅</span>
        <span className="gradient-text">{t('calendar.title')}</span>
      </h2>

      {/* Crop Selector */}
      <div className="mb-4">
        <select
          value={selectedCrop}
          onChange={(e) => handleCropChange(e.target.value)}
          className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-3 
                        text-sm text-[var(--text-primary)] focus:outline-none focus:border-accent"
        >
          {CROPS.map((crop) => (
            <option key={crop} value={crop} className="bg-[var(--bg-card)]">
              {crop}
            </option>
          ))}
        </select>
      </div>

      {/* Generate Button */}
      <button
        onClick={() => fetchCalendar(selectedCrop)}
        disabled={loading}
        className={`w-full py-3.5 rounded-xl font-bold text-sm border transition-all duration-300 mb-4
                    ${
                      loading
                        ? 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-muted)] cursor-wait'
                        : 'bg-primary/20 border-accent/40 text-accent hover:bg-primary/30 hover:border-accent active:scale-[0.98]'
                    }`}
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <div
              className="loading-spinner"
              style={{ width: 18, height: 18, borderWidth: 2 }}
            ></div>
            <span>{t('common.loading')}</span>
          </div>
        ) : (
          `📅 ${t('calendar.generate')}`
        )}
      </button>

      {error && (
        <div className="bg-red-950/50 border border-red-800/50 rounded-xl p-3 text-center mb-4">
          <span className="text-red-400 text-sm">⚠️ {error}</span>
        </div>
      )}

      {/* Calendar Display */}
      {calendar && calendar.months && calendar.months.length > 0 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
          {/* Legend */}
          <div className="flex gap-4 justify-center text-xs text-[var(--text-muted)] mb-4 bg-[var(--bg-elevated)] py-2 rounded-xl border border-[var(--border)]">
            <span className="flex items-center gap-1.5 font-medium">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: MONTH_COLORS.sowing }}
              ></span>{' '}
              {t('calendar.sowing')}
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: MONTH_COLORS.growing }}
              ></span>{' '}
              {t('calendar.irrigation')}
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: MONTH_COLORS.harvesting }}
              ></span>{' '}
              {t('calendar.harvest')}
            </span>
          </div>

          <div className="relative pl-6 border-l-2 border-[var(--border)] space-y-6">
            {calendar.months.map((m, index) => {
              const color = getMonthColor(m.activities)
              return (
                <div key={index} className="relative">
                  {/* Timeline dot */}
                  <div
                    className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-4 border-[var(--bg-main)]"
                    style={{ backgroundColor: color }}
                  ></div>

                  <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-4 transition-all hover:border-[var(--border-focus)]">
                    <div className="flex justify-between items-center mb-3">
                      <h4
                        className="text-sm font-bold text-[var(--text-primary)]"
                        style={{ color: color }}
                      >
                        {m.month}
                      </h4>
                    </div>

                    {Array.isArray(m.activities) && m.activities.length > 0 ? (
                      <ul className="space-y-1.5">
                        {m.activities.map((act, i) => (
                          <li
                            key={i}
                            className="text-xs text-[var(--text-secondary)] flex items-start gap-2"
                          >
                            <span
                              style={{ color: color }}
                              className="mt-0.5 text-[10px]"
                            >
                              ❖
                            </span>
                            <span className="leading-relaxed">{act}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-[var(--text-muted)] italic">
                        Resting period / No major activities
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Raw fallback if parsing failed */}
      {calendar &&
        (!calendar.months || calendar.months.length === 0) &&
        calendar.raw && (
          <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-4 animate-in fade-in">
            <h4 className="text-sm font-bold text-[var(--text-primary)] mb-3">
              📋 Plan for {calendar.crop}
            </h4>
            <p className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">
              {calendar.raw}
            </p>
          </div>
        )}
    </div>
  )
}
