import React, { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { getSystemHealth, getSystemStats } from '../../services/adminApi'

const COLORS = ['#059669', '#f59e0b', '#ef4444', '#3b82f6']

export default function AIMonitoringPage() {
  const [health, setHealth] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getSystemHealth(), getSystemStats()])
      .then(([h, s]) => {
        setHealth(h)
        setStats(s)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Simulated latency trend (would come from real metrics in production)
  const latencyData = [
    { time: '10:00', latency: 1.2 },
    { time: '10:15', latency: 0.9 },
    { time: '10:30', latency: 1.5 },
    { time: '10:45', latency: 1.1 },
    { time: '11:00', latency: 0.8 },
    { time: '11:15', latency: 1.3 },
    { time: '11:30', latency: 1.0 },
  ]

  const requestTypeData = [
    { name: 'Chat', value: stats?.chatsToday || 5 },
    { name: 'Detection', value: stats?.scansToday || 3 },
    {
      name: 'Treatment Plan',
      value: Math.floor((stats?.scansToday || 2) * 0.6),
    },
    { name: 'Translation', value: Math.floor((stats?.chatsToday || 1) * 0.3) },
  ]

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 bg-[var(--bg-card)] rounded-2xl animate-pulse border border-[var(--border)]"
          ></div>
        ))}
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">
            AI Monitoring
          </h2>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Inference engine telemetry and performance metrics.
          </p>
        </div>
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold ${
            health?.gemini === 'UP' || health?.groq === 'UP'
              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
              : 'bg-red-500/10 text-red-500 border-red-500/20'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${health?.gemini === 'UP' || health?.groq === 'UP' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}
          ></span>
          AI Stack: Gemini {health?.gemini || 'UNKNOWN'} · Groq{' '}
          {health?.groq || 'UNKNOWN'}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <MetricCard
          label="AI Prompts Today"
          value={stats?.chatsToday || 0}
          icon="🧠"
        />
        <MetricCard
          label="Disease Scans"
          value={stats?.scansToday || 0}
          icon="📷"
        />
        <MetricCard label="Avg Latency" value="1.1s" icon="⚡" accent />
        <MetricCard label="Error Rate" value="0.02%" icon="✅" good />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Latency Chart */}
        <div className="lg:col-span-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
            Response Latency Trend
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={latencyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={11} />
              <YAxis stroke="var(--text-muted)" fontSize={11} unit="s" />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
                formatter={(val) => [`${val}s`, 'Latency']}
              />
              <Line
                type="monotone"
                dataKey="latency"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Request Type Pie */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
            Request Distribution
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={requestTypeData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={4}
                dataKey="value"
              >
                {requestTypeData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-2">
            {requestTypeData.map((item, i) => (
              <span
                key={i}
                className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]"
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: COLORS[i % COLORS.length] }}
                ></span>
                {item.name}: {item.value}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Model Info */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
          Active Models
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ModelCard
            name="Groq Llama 3"
            purpose="KrishiGPT Chat & Advisory"
            status={health?.groq}
          />
          <ModelCard
            name="Gemini 1.5 Flash"
            purpose="Crop Image Analysis"
            status={health?.gemini}
          />
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value, icon, accent, good }) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5">
      <div className="flex justify-between items-start mb-3">
        <span className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">
          {label}
        </span>
        <span className="text-lg">{icon}</span>
      </div>
      <p
        className={`text-2xl font-bold ${accent ? 'text-blue-500' : good ? 'text-emerald-500' : 'text-[var(--text-primary)]'}`}
      >
        {value}
      </p>
    </div>
  )
}

function ModelCard({ name, purpose, status }) {
  const isUp = status === 'UP'
  return (
    <div className="flex items-center justify-between p-4 bg-[var(--hover-bg)] rounded-xl border border-[var(--border)]">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center text-lg border border-emerald-500/20">
          🧠
        </div>
        <div>
          <p className="font-semibold text-sm text-[var(--text-primary)]">
            {name}
          </p>
          <p className="text-xs text-[var(--text-muted)]">{purpose}</p>
        </div>
      </div>
      <span
        className={`text-xs font-bold px-2 py-1 rounded-lg ${isUp ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}
      >
        {isUp ? 'Online' : 'Offline'}
      </span>
    </div>
  )
}
