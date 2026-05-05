import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api'

const STATES = [
    "Maharashtra", "Karnataka", "Tamil Nadu", "Andhra Pradesh", "Telangana",
    "Uttar Pradesh", "Madhya Pradesh", "Rajasthan", "Gujarat", "Punjab",
    "Haryana", "West Bengal", "Bihar", "Odisha", "Kerala"
]

const CROPS = [
    "Tomato", "Wheat", "Rice", "Potato", "Cotton", "Onion",
    "Maize", "Soybean", "Sugarcane", "Chili", "Groundnut", "Mango"
]

export default function MarketPrices() {
    const { token } = useAuth()
    const [selectedCrop, setSelectedCrop] = useState('Tomato')
    const [selectedState, setSelectedState] = useState('Maharashtra')
    const [prices, setPrices] = useState([])
    const [disclaimer, setDisclaimer] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const fetchPrices = async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await fetch(
                `${BASE_URL}/market/prices?crop=${encodeURIComponent(selectedCrop)}&state=${encodeURIComponent(selectedState)}`,
                { headers: { Authorization: `Bearer ${token}` } }
            )
            const json = await response.json()
            const data = json.data || json
            setPrices(data.prices || [])
            setDisclaimer(data.disclaimer || '')
        } catch (err) {
            setError('Failed to load prices')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (token) fetchPrices()
    }, [selectedCrop, selectedState, token])

    return (
        <div className="px-4 pt-6 pb-4 max-w-lg mx-auto fade-in">
            <h2 className="text-xl font-bold mb-5">
                <span className="mr-2">🏪</span>
                <span className="gradient-text">Mandi Prices</span>
            </h2>

            {/* Selectors */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <select
                    value={selectedCrop}
                    onChange={(e) => setSelectedCrop(e.target.value)}
                    className="bg-darker border border-gray-700 rounded-xl px-3 py-2.5 
                        text-sm text-[var(--text-primary)] focus:outline-none focus:border-accent"
                >
                    {CROPS.map(crop => (
                        <option key={crop} value={crop} className="bg-darker">{crop}</option>
                    ))}
                </select>
                <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="bg-darker border border-gray-700 rounded-xl px-3 py-2.5 
                        text-sm text-[var(--text-primary)] focus:outline-none focus:border-accent"
                >
                    {STATES.map(state => (
                        <option key={state} value={state} className="bg-darker">{state}</option>
                    ))}
                </select>
            </div>

            {/* Disclaimer */}
            {disclaimer && (
                <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg px-3 py-2 mb-4">
                    <p className="text-yellow-400 text-xs">⚠️ {disclaimer}</p>
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="flex justify-center py-8">
                    <div className="loading-spinner"></div>
                </div>
            )}

            {/* Error */}
            {error && !loading && (
                <div className="bg-red-950/50 border border-red-800/50 rounded-xl p-3 text-center">
                    <span className="text-red-400 text-sm">⚠️ {error}</span>
                </div>
            )}

            {/* Price Table */}
            {!loading && prices.length > 0 && (
                <div className="disease-card overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-800/50">
                                <th className="text-left text-gray-500 text-xs py-2 font-medium">Market</th>
                                <th className="text-right text-gray-500 text-xs py-2 font-medium">Min</th>
                                <th className="text-right text-gray-500 text-xs py-2 font-medium">Max</th>
                                <th className="text-right text-gray-500 text-xs py-2 font-medium">Modal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {prices.map((p, i) => (
                                <tr key={i} className="border-b border-gray-800/30 last:border-b-0">
                                    <td className="py-2.5 text-[var(--text-primary)] font-medium">{p.market}</td>
                                    <td className="py-2.5 text-right text-red-400 text-xs">{p.minPrice}</td>
                                    <td className="py-2.5 text-right text-green-400 text-xs">{p.maxPrice}</td>
                                    <td className="py-2.5 text-right text-accent font-semibold">{p.modalPrice}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <p className="text-gray-600 text-xs mt-3">Last updated: {prices[0]?.arrivalDate || 'Today'}</p>
                </div>
            )}

            {!loading && prices.length === 0 && !error && (
                <div className="flex flex-col items-center py-12 text-center">
                    <div className="text-5xl mb-3">🏪</div>
                    <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">No price data</h3>
                    <p className="text-gray-500 text-sm">Select a crop and state to view prices</p>
                </div>
            )}
        </div>
    )
}
