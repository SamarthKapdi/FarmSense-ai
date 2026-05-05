import React, { useState, useEffect } from "react";
import { getWeather } from "../services/api";

const CITIES = ["Mumbai", "Delhi", "Pune", "Chennai", "Kolkata", "Jaipur", "Lucknow", "Hyderabad"];

export default function WeatherWidget() {
    const [weather, setWeather] = useState(null);
    const [city, setCity] = useState("Mumbai");
    const [customCity, setCustomCity] = useState("");
    const [loading, setLoading] = useState(true);
    const [geoStatus, setGeoStatus] = useState(""); // "" | "detecting" | "done" | "denied"

    // Try geolocation on mount
    useEffect(() => {
        if (navigator.geolocation) {
            setGeoStatus("detecting");
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    try {
                        const { latitude, longitude } = pos.coords;
                        const res = await fetch(
                            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
                        );
                        const data = await res.json();
                        const detected = data.city || data.locality || data.principalSubdivision || "Mumbai";
                        setCity(detected);
                        setGeoStatus("done");
                    } catch {
                        setGeoStatus("done");
                    }
                },
                () => { setGeoStatus("denied"); }, // Geolocation denied
                { timeout: 5000 }
            );
        }
    }, []);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        getWeather(city).then(data => {
            if (!cancelled) { setWeather(data); setLoading(false); }
        });
        return () => { cancelled = true; };
    }, [city]);

    const handleCustomCity = () => {
        if (customCity.trim()) {
            setCity(customCity.trim());
            setCustomCity("");
        }
    };

    if (loading) {
        return (
            <div className="disease-card" style={{ padding: '20px' }}>
                <div className="skeleton" style={{ height: '120px' }} />
                {geoStatus === "detecting" && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '11px', textAlign: 'center', marginTop: '8px' }}>
                        📍 Detecting your location...
                    </p>
                )}
            </div>
        );
    }

    if (!weather) return null;

    const alertColors = {
        HIGH: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', text: '#fca5a5' },
        MEDIUM: { bg: 'rgba(234,179,8,0.1)', border: 'rgba(234,179,8,0.3)', text: '#fde68a' },
        LOW: { bg: 'rgba(82,183,136,0.1)', border: 'rgba(82,183,136,0.3)', text: '#86efac' },
        OK: { bg: 'rgba(82,183,136,0.05)', border: 'rgba(82,183,136,0.2)', text: '#52B788' },
        INFO: { bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.3)', text: '#93c5fd' },
    };

    return (
        <div className="disease-card fade-in" style={{ padding: '20px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🌦️ Weather & Disease Alerts
                </h3>
                <select value={CITIES.includes(city) ? city : ""} onChange={e => { if (e.target.value) setCity(e.target.value); }}
                    style={{
                        background: 'rgba(82,183,136,0.1)', border: '1px solid rgba(82,183,136,0.2)',
                        color: 'var(--accent)', padding: '4px 10px', borderRadius: '8px',
                        fontSize: '12px', fontWeight: 600, cursor: 'pointer', outline: 'none',
                    }}>
                    {!CITIES.includes(city) && <option value="">{city}</option>}
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>

            {/* Custom City Input */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <input
                    type="text" value={customCity}
                    onChange={e => setCustomCity(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleCustomCity(); }}
                    placeholder="Enter any city..."
                    style={{
                        flex: 1, background: 'rgba(82,183,136,0.05)', border: '1px solid rgba(82,183,136,0.15)',
                        color: 'var(--text-primary)', padding: '6px 12px', borderRadius: '8px',
                        fontSize: '12px', outline: 'none',
                    }}
                />
                <button onClick={handleCustomCity}
                    style={{
                        background: 'rgba(82,183,136,0.15)', border: '1px solid rgba(82,183,136,0.3)',
                        color: 'var(--accent)', padding: '6px 12px', borderRadius: '8px',
                        fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                    }}>
                    📍 Search
                </button>
            </div>

            {/* Weather Info */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px',
            }}>
                <div style={{ textAlign: 'center', background: 'rgba(82,183,136,0.05)', borderRadius: '12px', padding: '12px' }}>
                    <div style={{ fontSize: '24px' }}>🌡️</div>
                    <div style={{ color: 'var(--accent)', fontSize: '20px', fontWeight: 800 }}>{weather.temperature}°C</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>Temperature</div>
                </div>
                <div style={{ textAlign: 'center', background: 'rgba(82,183,136,0.05)', borderRadius: '12px', padding: '12px' }}>
                    <div style={{ fontSize: '24px' }}>💧</div>
                    <div style={{ color: 'var(--accent)', fontSize: '20px', fontWeight: 800 }}>{weather.humidity}%</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>Humidity</div>
                </div>
                <div style={{ textAlign: 'center', background: 'rgba(82,183,136,0.05)', borderRadius: '12px', padding: '12px' }}>
                    <div style={{ fontSize: '24px' }}>💨</div>
                    <div style={{ color: 'var(--accent)', fontSize: '20px', fontWeight: 800 }}>{weather.windSpeed}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>Wind m/s</div>
                </div>
            </div>

            {/* Disease Risk Alerts */}
            <div style={{ display: 'grid', gap: '8px' }}>
                {(weather.alerts || []).map((alert, i) => {
                    const colors = alertColors[alert.level] || alertColors.INFO;
                    return (
                        <div key={i} style={{
                            background: colors.bg, border: `1px solid ${colors.border}`,
                            borderRadius: '10px', padding: '10px 14px',
                            display: 'flex', alignItems: 'flex-start', gap: '8px',
                        }}>
                            <span style={{ fontSize: '16px', flexShrink: 0 }}>{alert.icon}</span>
                            <div>
                                {alert.disease && alert.disease !== 'None' && alert.disease !== 'N/A' && (
                                    <span style={{ color: colors.text, fontWeight: 700, fontSize: '12px' }}>
                                        {alert.disease} Risk —{' '}
                                    </span>
                                )}
                                <span style={{ color: colors.text, fontSize: '12px' }}>{alert.message}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {weather.offline && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '8px', textAlign: 'center' }}>
                    ⚠️ Using fallback data — weather service offline
                </p>
            )}

            {geoStatus === "denied" && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '10px', marginTop: '8px', textAlign: 'center' }}>
                    💡 Allow location access for auto-detection
                </p>
            )}
        </div>
    );
}
