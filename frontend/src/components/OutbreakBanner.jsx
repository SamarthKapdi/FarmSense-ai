import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api'

export default function OutbreakBanner() {
    const { token } = useAuth()
    const [alerts, setAlerts] = useState([])
    const [dismissed, setDismissed] = useState(new Set())

    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const response = await fetch(`${BASE_URL}/alerts/active`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                const json = await response.json()
                setAlerts(json.data || [])
            } catch {
                // Silently fail — alerts are non-critical
            }
        }
        if (token) fetchAlerts()
    }, [token])

    const visibleAlerts = alerts.filter(a => !dismissed.has(a.id))

    if (visibleAlerts.length === 0) return null

    const getColor = (severity) => {
        switch (severity) {
            case 'HIGH': return { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', text: '#fca5a5', icon: '🔴' }
            case 'MEDIUM': return { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', text: '#fde68a', icon: '🟠' }
            default: return { bg: 'rgba(234,179,8,0.1)', border: 'rgba(234,179,8,0.3)', text: '#fef08a', icon: '🟡' }
        }
    }

    return (
        <div className="space-y-1">
            {visibleAlerts.map(alert => {
                const color = getColor(alert.severity)
                return (
                    <div key={alert.id}
                        style={{
                            background: color.bg,
                            borderBottom: `1px solid ${color.border}`,
                            padding: '8px 16px',
                            fontSize: '12px',
                            color: color.text,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}>
                        <span>{color.icon}</span>
                        <span className="flex-1">
                            <strong>{alert.disease}</strong> outbreak in {alert.region} — {alert.reportCount} reports in 48 hours
                        </span>
                        <button
                            onClick={() => setDismissed(prev => new Set([...prev, alert.id]))}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: color.text,
                                cursor: 'pointer',
                                padding: '2px 6px',
                                fontSize: '14px',
                            }}>✕</button>
                    </div>
                )
            })}
        </div>
    )
}
