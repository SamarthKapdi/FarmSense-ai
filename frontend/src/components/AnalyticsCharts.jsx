import React, { useState, useEffect } from 'react'
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer, Legend
} from 'recharts'
import { useAuth } from '../context/AuthContext'

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api'

const COLORS = ['#52B788', '#F59E0B', '#EF4444', '#8B5CF6', '#3B82F6', '#EC4899', '#14B8A6', '#F97316']
const SEVERITY_COLORS = { mild: '#52B788', moderate: '#F59E0B', severe: '#EF4444' }

export default function AnalyticsCharts() {
    const { token } = useAuth()
    const [diseaseData, setDiseaseData] = useState([])
    const [monthlyData, setMonthlyData] = useState([])
    const [cropData, setCropData] = useState([])
    const [severityData, setSeverityData] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true)
            try {
                const headers = { Authorization: `Bearer ${token}` }
                const [d1, d2, d3, d4] = await Promise.all([
                    fetch(`${BASE_URL}/analytics/disease-breakdown`, { headers }).then(r => r.json()),
                    fetch(`${BASE_URL}/analytics/monthly-trends`, { headers }).then(r => r.json()),
                    fetch(`${BASE_URL}/analytics/crop-distribution`, { headers }).then(r => r.json()),
                    fetch(`${BASE_URL}/analytics/severity-summary`, { headers }).then(r => r.json()),
                ])
                setDiseaseData(d1.data || [])
                setMonthlyData((d2.data || []).map(m => ({
                    ...m,
                    label: `${['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m.month] || m.month} ${m.year}`
                })))
                setCropData(d3.data || [])
                setSeverityData(d4.data || null)
            } catch (err) {
                console.error('Analytics fetch error:', err)
            } finally {
                setLoading(false)
            }
        }
        if (token) fetchAll()
    }, [token])

    if (loading) {
        return (
            <div className="space-y-4 p-4">
                {[1, 2].map(i => <div key={i} className="skeleton h-48 rounded-2xl"></div>)}
            </div>
        )
    }

    const hasData = diseaseData.length > 0 || monthlyData.length > 0

    if (!hasData) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="text-5xl mb-3">📊</div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">No analytics yet</h3>
                <p className="text-gray-500 text-sm">Upload crop photos to start building your disease analytics</p>
            </div>
        )
    }

    const severityPieData = severityData ? [
        { name: 'Mild', value: severityData.mild, color: SEVERITY_COLORS.mild },
        { name: 'Moderate', value: severityData.moderate, color: SEVERITY_COLORS.moderate },
        { name: 'Severe', value: severityData.severe, color: SEVERITY_COLORS.severe },
    ].filter(d => d.value > 0) : []

    return (
        <div className="space-y-6 p-4 max-w-lg mx-auto">
            <h3 className="text-lg font-bold">
                <span className="mr-2">📊</span>
                <span className="gradient-text">Disease Analytics</span>
            </h3>

            {/* Disease Breakdown Pie */}
            {diseaseData.length > 0 && (
                <div className="disease-card">
                    <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">🦠 Disease Breakdown</h4>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie data={diseaseData} dataKey="count" nameKey="diseaseName"
                                cx="50%" cy="50%" outerRadius={70} label={({ diseaseName }) => diseaseName}>
                                {diseaseData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ background: '#040D0A', border: '1px solid rgba(82,183,136,0.3)', borderRadius: '8px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Monthly Trends Bar */}
            {monthlyData.length > 0 && (
                <div className="disease-card">
                    <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">📈 Monthly Scan Trends</h4>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={monthlyData}>
                            <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                            <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} allowDecimals={false} />
                            <Tooltip contentStyle={{ background: '#040D0A', border: '1px solid rgba(82,183,136,0.3)', borderRadius: '8px' }} />
                            <Bar dataKey="count" fill="#52B788" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Crop Distribution */}
            {cropData.length > 0 && (
                <div className="disease-card">
                    <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">🌾 Crop Distribution</h4>
                    <div className="space-y-2">
                        {cropData.map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <span className="text-sm text-gray-300 w-20">{item.cropName}</span>
                                <div className="flex-1 bg-darker rounded-full h-5 overflow-hidden">
                                    <div className="h-full rounded-full transition-all duration-700"
                                        style={{
                                            width: `${Math.max(10, (item.count / Math.max(...cropData.map(c => c.count))) * 100)}%`,
                                            background: COLORS[i % COLORS.length]
                                        }} />
                                </div>
                                <span className="text-xs text-gray-400 w-8 text-right">{item.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Severity Donut */}
            {severityPieData.length > 0 && (
                <div className="disease-card">
                    <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">⚠️ Severity Summary</h4>
                    <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                            <Pie data={severityPieData} dataKey="value" nameKey="name"
                                cx="50%" cy="50%" innerRadius={40} outerRadius={70} label>
                                {severityPieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                            </Pie>
                            <Tooltip contentStyle={{ background: '#040D0A', border: '1px solid rgba(82,183,136,0.3)', borderRadius: '8px' }} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    )
}
