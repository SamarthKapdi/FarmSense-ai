import React, { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useAuth } from '../context/AuthContext'
import { apiUrl } from '../services/baseUrl'

const STATES = [
  'Maharashtra',
  'Karnataka',
  'Tamil Nadu',
  'Andhra Pradesh',
  'Telangana',
  'Uttar Pradesh',
  'Madhya Pradesh',
  'Rajasthan',
  'Gujarat',
  'Punjab',
  'Haryana',
  'West Bengal',
  'Bihar',
  'Odisha',
  'Kerala',
]

const CROPS = [
  'Tomato',
  'Wheat',
  'Rice',
  'Potato',
  'Cotton',
  'Onion',
  'Maize',
  'Soybean',
  'Sugarcane',
  'Chili',
  'Groundnut',
  'Mango',
]

export default function MarketPrices() {
  const { token } = useAuth()
  const [selectedCrop, setSelectedCrop] = useState('Tomato')
  const [selectedState, setSelectedState] = useState('Maharashtra')
  const [prices, setPrices] = useState([])
  const [trend, setTrend] = useState([])
  const [source, setSource] = useState('')
  const [loading, setLoading] = useState(false)
  const [trendLoading, setTrendLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeView, setActiveView] = useState('table') // 'table' | 'chart'

  const fetchPrices = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(
        apiUrl(
          `/market/prices?crop=${encodeURIComponent(selectedCrop)}&state=${encodeURIComponent(selectedState)}`
        ),
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const json = await response.json()
      const data = json.data || json
      setPrices(data.prices || [])
      setSource(data.source || '')
    } catch (err) {
      setError('Failed to load prices')
    } finally {
      setLoading(false)
    }
  }

  const fetchTrend = async () => {
    setTrendLoading(true)
    try {
      const response = await fetch(
        apiUrl(
          `/market/trend?crop=${encodeURIComponent(selectedCrop)}&state=${encodeURIComponent(selectedState)}&days=30`
        ),
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const json = await response.json()
      setTrend(json.data || [])
    } catch (err) {
      console.error('Failed to load trend', err)
    } finally {
      setTrendLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      fetchPrices()
      fetchTrend()
    }
  }, [selectedCrop, selectedState, token])

  return (
    <div className="px-4 pt-6 pb-4 max-w-2xl mx-auto fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold">
          <span className="mr-2">🏪</span>
          <span className="gradient-text">Mandi Prices</span>
        </h2>
        <div className="flex gap-1 bg-[var(--bg-elevated)] rounded-lg p-0.5 border border-[var(--border)]">
          <button
            onClick={() => setActiveView('table')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              activeView === 'table'
                ? 'bg-emerald-600 text-white'
                : 'text-[var(--text-secondary)]'
            }`}
          >
            Table
          </button>
          <button
            onClick={() => setActiveView('chart')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              activeView === 'chart'
                ? 'bg-emerald-600 text-white'
                : 'text-[var(--text-secondary)]'
            }`}
          >
            Trend
          </button>
        </div>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <select
          value={selectedCrop}
          onChange={(e) => setSelectedCrop(e.target.value)}
          className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-3 py-2.5 
                        text-sm text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
        >
          {CROPS.map((crop) => (
            <option key={crop} value={crop} className="bg-[var(--bg-card)]">
              {crop}
            </option>
          ))}
        </select>
        <select
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
          className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-3 py-2.5 
                        text-sm text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
        >
          {STATES.map((state) => (
            <option key={state} value={state} className="bg-[var(--bg-card)]">
              {state}
            </option>
          ))}
        </select>
      </div>

      {/* Source info */}
      {source && (
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-3 py-2 mb-4">
          <p className="text-emerald-600 text-xs">ℹ️ {source}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
          <span className="text-red-400 text-sm">⚠️ {error}</span>
        </div>
      )}

      {/* Table View */}
      {!loading && activeView === 'table' && prices.length > 0 && (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-elevated)]">
                <th className="text-left text-[var(--text-muted)] text-xs py-3 px-4 font-semibold">
                  Market
                </th>
                <th className="text-right text-[var(--text-muted)] text-xs py-3 px-3 font-semibold">
                  Min
                </th>
                <th className="text-right text-[var(--text-muted)] text-xs py-3 px-3 font-semibold">
                  Max
                </th>
                <th className="text-right text-[var(--text-muted)] text-xs py-3 px-4 font-semibold">
                  Modal
                </th>
              </tr>
            </thead>
            <tbody>
              {prices.map((p, i) => (
                <tr
                  key={i}
                  className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--hover-bg)] transition-colors"
                >
                  <td className="py-3 px-4 text-[var(--text-primary)] font-medium">
                    {p.market}
                  </td>
                  <td className="py-3 px-3 text-right text-red-400 text-xs font-medium">
                    {p.minPrice}
                  </td>
                  <td className="py-3 px-3 text-right text-emerald-500 text-xs font-medium">
                    {p.maxPrice}
                  </td>
                  <td className="py-3 px-4 text-right text-[var(--text-primary)] font-bold">
                    {p.modalPrice}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2 border-t border-[var(--border)]">
            <p className="text-[var(--text-muted)] text-xs">
              Updated: {prices[0]?.arrivalDate || 'Today'} • Prices in ₹/quintal
            </p>
          </div>
        </div>
      )}

      {/* Chart View */}
      {!loading && activeView === 'chart' && (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
            {selectedCrop} — 30 Day Price Trend
          </h3>
          <p className="text-xs text-[var(--text-muted)] mb-4">
            {selectedState}
          </p>
          {trendLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trend}>
                <defs>
                  <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="date"
                  stroke="var(--text-muted)"
                  fontSize={10}
                  tickFormatter={(d) => d.substring(5)}
                />
                <YAxis
                  stroke="var(--text-muted)"
                  fontSize={10}
                  tickFormatter={(v) => `₹${v}`}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    fontSize: '12px',
                  }}
                  formatter={(val) => [`₹${val}/q`, 'Price']}
                  labelFormatter={(d) => `Date: ${d}`}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#059669"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-[var(--text-muted)] py-12">
              No trend data available
            </p>
          )}
        </div>
      )}

      {!loading && prices.length === 0 && !error && (
        <div className="flex flex-col items-center py-12 text-center">
          <div className="text-5xl mb-3">🏪</div>
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">
            No price data
          </h3>
          <p className="text-[var(--text-muted)] text-sm">
            Select a crop and state to view prices
          </p>
        </div>
      )}
    </div>
  )
}
