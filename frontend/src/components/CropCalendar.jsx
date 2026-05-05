import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api'

const CROPS = [
    "Rice", "Wheat", "Tomato", "Potato", "Cotton",
    "Maize", "Sugarcane", "Soybean", "Groundnut",
    "Onion", "Chili", "Mango",
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
    if (text.includes('sow') || text.includes('transplant') || text.includes('plant')) return MONTH_COLORS.sowing
    return MONTH_COLORS.growing
}

export default function CropCalendar() {
    const { token } = useAuth()
    const [selectedCrop, setSelectedCrop] = useState('Tomato')
    const [calendar, setCalendar] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const fetchCalendar = async (crop) => {
        setLoading(true)
        setError(null)
        try {
            const response = await fetch(`${BASE_URL}/farm/calendar/${encodeURIComponent(crop)}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            const json = await response.json()
            const data = json.data || json

            let calendarArray = []
            try {
                const raw = typeof data.calendar === 'string' ? data.calendar : JSON.stringify(data.calendar)
                // Try to extract JSON array from the response
                const match = raw.match(/\[[\s\S]*\]/)
                if (match) {
                    calendarArray = JSON.parse(match[0])
                }
            } catch {
                // If parsing fails, show raw text
                calendarArray = []
            }

            setCalendar({ crop: data.crop || crop, months: calendarArray, raw: data.calendar })
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
                <span className="gradient-text">Crop Calendar</span>
            </h2>

            {/* Crop Selector */}
            <div className="mb-4">
                <select
                    value={selectedCrop}
                    onChange={(e) => handleCropChange(e.target.value)}
                    className="w-full bg-darker border border-gray-700 rounded-xl px-4 py-3 
                        text-sm text-[var(--text-primary)] focus:outline-none focus:border-accent"
                >
                    {CROPS.map(crop => (
                        <option key={crop} value={crop} className="bg-darker">{crop}</option>
                    ))}
                </select>
            </div>

            {/* Generate Button */}
            <button
                onClick={() => fetchCalendar(selectedCrop)}
                disabled={loading}
                className={`w-full py-3.5 rounded-xl font-bold text-sm border transition-all duration-300 mb-4
                    ${loading
                        ? 'bg-darker border-gray-700 text-gray-500 cursor-wait'
                        : 'bg-primary/20 border-accent/40 text-accent hover:bg-primary/30 hover:border-accent active:scale-[0.98]'
                    }`}
            >
                {loading ? (
                    <div className="flex items-center justify-center gap-2">
                        <div className="loading-spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></div>
                        <span>Generating calendar...</span>
                    </div>
                ) : '📅 Generate Crop Calendar'}
            </button>

            {error && (
                <div className="bg-red-950/50 border border-red-800/50 rounded-xl p-3 text-center mb-4">
                    <span className="text-red-400 text-sm">⚠️ {error}</span>
                </div>
            )}

            {/* Calendar Display */}
            {calendar && calendar.months && calendar.months.length > 0 && (
                <div className="space-y-3">
                    {/* Legend */}
                    <div className="flex gap-4 text-xs text-gray-400 mb-2">
                        <span className="flex items-center gap-1">
                            <span className="w-3 h-3 rounded-full" style={{ background: MONTH_COLORS.sowing }}></span> Sowing
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-3 h-3 rounded-full" style={{ background: MONTH_COLORS.growing }}></span> Growing
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-3 h-3 rounded-full" style={{ background: MONTH_COLORS.harvesting }}></span> Harvest
                        </span>
                    </div>

                    {calendar.months.map((m, index) => (
                        <div key={index}
                            className="disease-card flex gap-3 items-start"
                            style={{ borderLeft: `4px solid ${getMonthColor(m.activities)}` }}>
                            <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm"
                                style={{ background: getMonthColor(m.activities) + '20', color: getMonthColor(m.activities) }}>
                                {(m.month || '').substring(0, 3)}
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-semibold text-[var(--text-primary)]">{m.month}</h4>
                                {Array.isArray(m.activities) && m.activities.length > 0 ? (
                                    <ul className="mt-1 space-y-0.5">
                                        {m.activities.map((act, i) => (
                                            <li key={i} className="text-xs text-gray-400 flex items-start gap-1.5">
                                                <span className="text-accent mt-0.5">•</span>
                                                <span>{act}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-xs text-gray-500 mt-1">No activities listed</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Raw fallback if parsing failed */}
            {calendar && (!calendar.months || calendar.months.length === 0) && calendar.raw && (
                <div className="disease-card">
                    <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">📋 Calendar for {calendar.crop}</h4>
                    <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{calendar.raw}</p>
                </div>
            )}
        </div>
    )
}
