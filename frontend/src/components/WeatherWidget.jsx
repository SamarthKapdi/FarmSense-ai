import React, { useState, useEffect, useRef } from "react";
import { getCurrentWeather, getHourlyForecast, getDailyForecast, getAirQuality, searchCity, reverseGeocode } from "../services/weatherApi";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Component to recenter map when coords change
function RecenterMap({ lat, lng }) {
    const map = useMap();
    useEffect(() => { map.setView([lat, lng], 10); }, [lat, lng, map]);
    return null;
}

import { useLanguage } from "../context/LanguageContext";

export default function WeatherWidget() {
    const { t } = useLanguage();
    // State
    const [coords, setCoords] = useState(() => {
        const saved = localStorage.getItem('farmsense_weather_location');
        return saved ? JSON.parse(saved) : { lat: 28.6139, lon: 77.2090 }; // Default: New Delhi
    });
    const [locationName, setLocationName] = useState("New Delhi");
    const [current, setCurrent] = useState(null);
    const [hourly, setHourly] = useState([]);
    const [daily, setDaily] = useState([]);
    const [aqi, setAqi] = useState(null);
    
    const [search, setSearch] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showSearch, setShowSearch] = useState(false);
    
    const searchRef = useRef(null);

    // Initial load & data fetching
    useEffect(() => {
        fetchAllData(coords.lat, coords.lon);
    }, [coords]);

    useEffect(() => {
        // Handle clicking outside search results
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setShowSearch(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchAllData = async (lat, lon) => {
        setLoading(true);
        setError(null);
        try {
            const [currentData, hourlyData, dailyData, aqiData, locData] = await Promise.all([
                getCurrentWeather(lat, lon),
                getHourlyForecast(lat, lon),
                getDailyForecast(lat, lon),
                getAirQuality(lat, lon),
                reverseGeocode(lat, lon)
            ]);
            
            setCurrent(currentData);
            setHourly(hourlyData);
            setDaily(dailyData);
            setAqi(aqiData);
            setLocationName(locData.name);
        } catch (err) {
            console.error(err);
            setError("Weather data temporarily unavailable");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (val) => {
        setSearch(val);
        if (val.length > 2) {
            try {
                const results = await searchCity(val);
                setSearchResults(results);
                setShowSearch(true);
            } catch (e) {
                console.error(e);
            }
        } else {
            setSearchResults([]);
            setShowSearch(false);
        }
    };

    const selectLocation = (loc) => {
        const newCoords = { lat: loc.latitude, lon: loc.longitude };
        setCoords(newCoords);
        setLocationName(loc.name);
        localStorage.setItem('farmsense_weather_location', JSON.stringify(newCoords));
        setSearch("");
        setShowSearch(false);
    };

    const useCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                const newCoords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
                setCoords(newCoords);
                localStorage.setItem('farmsense_weather_location', JSON.stringify(newCoords));
            }, (err) => {
                alert("Location access denied. Using default.");
            });
        }
    };

    // Helper for AQI colors
    const getAQIStyles = (cat) => {
        switch (cat) {
            case "Good": return "bg-green-500/20 text-green-400 border-green-500/30";
            case "Moderate": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
            case "Poor": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
            case "Unhealthy": return "bg-red-500/20 text-red-400 border-red-500/30";
            default: return "bg-purple-500/20 text-purple-400 border-purple-500/30";
        }
    };

    if (loading && !current) {
        return <div className="p-6 space-y-6 animate-pulse">
            <div className="h-40 bg-[var(--bg-card)] rounded-2xl"></div>
            <div className="h-32 bg-[var(--bg-card)] rounded-2xl"></div>
            <div className="h-64 bg-[var(--bg-card)] rounded-2xl"></div>
        </div>;
    }

    return (
        <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] p-4 md:p-8 space-y-6">
            
            {/* Top Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">📍</span>
                    <div>
                        <h1 className="text-xl font-bold text-emerald-400 leading-tight">{locationName}</h1>
                        <p className="text-xs text-emerald-600/70">{new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                    </div>
                </div>

                <div className="relative flex-1 max-w-md" ref={searchRef}>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder={t('weather.search')}
                            className="w-full bg-[var(--bg-card)] border-[var(--border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            value={search}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                        <button onClick={useCurrentLocation} className="bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 p-2.5 rounded-xl transition-all">
                            🎯
                        </button>
                    </div>

                    {showSearch && searchResults.length > 0 && (
                        <div className="absolute w-full mt-2 bg-[var(--bg-card)] border-[var(--border)] rounded-xl shadow-2xl z-50 overflow-hidden">
                            {searchResults.map((res, i) => (
                                <button
                                    key={i}
                                    onClick={() => selectLocation(res)}
                                    className="w-full text-left px-4 py-3 hover:bg-emerald-900/30 border-b border-emerald-900/20 last:border-0"
                                >
                                    <div className="font-medium text-sm">{res.name}</div>
                                    <div className="text-[10px] text-gray-500">{res.admin1}, {res.country}</div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

                {/* Interactive Map */}
                <div className="lg:col-span-3 bg-[var(--bg-card)] rounded-3xl overflow-hidden border border-[var(--border)] shadow-xl">
                    <div className="flex justify-between items-center p-6 pb-0">
                        <h3 className="font-bold text-lg text-emerald-500">📍 {t('weather.map')}</h3>
                        <span className="text-xs text-[var(--text-muted)]">{coords.lat.toFixed(4)}, {coords.lon.toFixed(4)}</span>
                    </div>
                    <div className="h-[300px] m-4 rounded-2xl overflow-hidden border border-[var(--border)]">
                        <MapContainer center={[coords.lat, coords.lon]} zoom={10} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <Marker position={[coords.lat, coords.lon]}>
                                <Popup>
                                    <strong>{locationName}</strong><br/>
                                    {current ? `${Math.round(current.temperature)}°C — ${current.weatherDescription}` : 'Loading...'}
                                </Popup>
                            </Marker>
                            <RecenterMap lat={coords.lat} lng={coords.lon} />
                        </MapContainer>
                    </div>
                </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-center">
                    <p className="text-red-400 text-sm">⚠️ {error}</p>
                    <button onClick={() => fetchAllData(coords.lat, coords.lon)} className="mt-2 text-xs font-bold text-red-300 underline underline-offset-4">{t('common.retry')}</button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Current Conditions Card */}
                <div className="lg:col-span-2 bg-[var(--bg-card)] rounded-3xl p-8 border border-emerald-900/30 shadow-xl overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-8 text-8xl opacity-10 group-hover:opacity-20 transition-all scale-110">
                        {current?.weatherIcon === 'sunny' ? '🌞' : 
                         current?.weatherIcon === 'rainy' ? '🌧️' : 
                         current?.weatherIcon === 'stormy' ? '⛈️' : '⛅'}
                    </div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-2">
                            <span className="text-5xl">{current?.weatherIcon === 'sunny' ? '🌞' : '⛅'}</span>
                            <div>
                                <span className="text-6xl md:text-8xl font-black text-white">{Math.round(current?.temperature)}°</span>
                                <span className="text-2xl text-emerald-400/50 font-bold ml-2">RealFeel® {Math.round(current?.feelsLike)}°</span>
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-emerald-400 mb-6">{current?.weatherDescription}</h2>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4 border-t border-emerald-900/20 pt-6">
                            <DetailItem icon="💨" label={t('weather.wind')} value={`${current?.windSpeed} km/h`} subValue={`Direction: ${current?.windDirection}°`} />
                            <DetailItem icon="💧" label={t('weather.humidity')} value={`${current?.humidity}%`} />
                            <DetailItem icon="☀️" label={t('weather.uv')} value={current?.uvIndex} />
                            <DetailItem icon="🌡️" label={t('weather.pressure')} value={`${current?.pressure} hPa`} />
                            <DetailItem icon="☁️" label={t('weather.cloud')} value={`${current?.cloudCover}%`} />
                            <DetailItem icon="☔" label={t('weather.precipitation')} value={`${current?.precipitation} mm`} />
                        </div>
                    </div>
                </div>

                {/* Air Quality Card */}
                <div className="bg-[var(--bg-card)] rounded-3xl p-8 border border-emerald-900/30 shadow-xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg text-emerald-400">{t('weather.aqi')}</h3>
                        <span className="text-2xl">🌫️</span>
                    </div>

                    <div className="flex flex-col items-center justify-center space-y-4">
                        <div className={`w-32 h-32 rounded-full border-4 flex flex-col items-center justify-center ${getAQIStyles(aqi?.category)}`}>
                            <span className="text-3xl font-black">{aqi?.aqi}</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider">AQI Index</span>
                        </div>
                        <div className="text-center">
                            <div className="text-xl font-bold mb-1">{aqi?.category}</div>
                            <p className="text-xs text-gray-400 leading-relaxed max-w-[200px]">{aqi?.healthRecommendation}</p>
                        </div>
                    </div>

                    <div className="mt-8 grid grid-cols-2 gap-4">
                        <AQIMetric label="PM2.5" value={aqi?.pm25} />
                        <AQIMetric label="PM10" value={aqi?.pm10} />
                        <AQIMetric label="Ozone" value={aqi?.ozone} />
                        <AQIMetric label="NO₂" value={aqi?.nitrogenDioxide} />
                    </div>
                </div>

                {/* Hourly Forecast */}
                <div className="lg:col-span-3 bg-[var(--bg-card)] rounded-3xl p-6 border border-emerald-900/30 shadow-xl overflow-hidden">
                    <div className="flex justify-between items-center mb-6 px-2">
                        <h3 className="font-bold text-lg text-emerald-400">{t('weather.hourly')}</h3>
                        <span className="text-xs text-emerald-600/50">Next 24 Hours</span>
                    </div>
                    
                    <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar">
                        {hourly.map((h, i) => (
                            <div key={i} className={`flex-shrink-0 w-24 p-4 rounded-2xl flex flex-col items-center gap-3 transition-all ${i === 0 ? 'bg-emerald-600/20 border border-emerald-500/30' : 'bg-emerald-900/10 border border-emerald-900/10'}`}>
                                <span className="text-[10px] font-bold text-gray-500">{new Date(h.time).getHours()}:00</span>
                                <span className="text-3xl">{h.weatherIcon === 'sunny' ? '🌞' : h.weatherIcon === 'rainy' ? '🌧️' : '⛅'}</span>
                                <span className="text-xl font-black">{Math.round(h.temperature)}°</span>
                                <div className="flex items-center gap-1">
                                    <span className="text-[9px]">💧</span>
                                    <span className="text-[9px] font-bold text-emerald-500">{h.precipitationProbability}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 10-Day Forecast */}
                <div className="lg:col-span-2 bg-[var(--bg-card)] rounded-3xl p-8 border border-emerald-900/30 shadow-xl">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="font-bold text-lg text-emerald-400">{t('weather.daily')}</h3>
                        <span className="text-2xl">📅</span>
                    </div>

                    <div className="space-y-4">
                        {daily.map((d, i) => (
                            <div key={i} className="group grid grid-cols-5 items-center p-4 hover:bg-emerald-900/10 rounded-2xl transition-all">
                                <span className="text-sm font-bold text-gray-400">{i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                <div className="flex items-center justify-center">
                                    <span className="text-2xl">{d.weatherIcon === 'sunny' ? '🌞' : d.weatherIcon === 'rainy' ? '🌧️' : '⛅'}</span>
                                </div>
                                <div className="col-span-1 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                        <span className="text-[9px]">💧</span>
                                        <span className="text-[9px] font-bold text-emerald-500">{d.precipitationProbability}%</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-center gap-4 col-span-2 text-right">
                                    <span className="text-lg font-black text-white">{Math.round(d.highTemp)}°</span>
                                    <span className="text-sm font-bold text-gray-500">{Math.round(d.lowTemp)}°</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sun & Moon Card */}
                <div className="bg-[var(--bg-card)] rounded-3xl p-8 border border-emerald-900/30 shadow-xl space-y-8">
                    <div>
                        <h3 className="font-bold text-lg text-emerald-400 mb-6">{t('weather.sun_moon')}</h3>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b border-emerald-900/20 pb-4">
                                <div className="flex items-center gap-4">
                                    <span className="text-2xl text-orange-400">🌅</span>
                                    <div>
                                        <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">{t('weather.sunrise')}</div>
                                        <div className="text-lg font-black">{daily[0]?.sunrise ? new Date(daily[0].sunrise).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-right">
                                    <div className="order-2 text-2xl text-orange-600">🌇</div>
                                    <div className="order-1">
                                        <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">{t('weather.sunset')}</div>
                                        <div className="text-lg font-black">{daily[0]?.sunset ? new Date(daily[0].sunset).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <span className="text-3xl">🌖</span>
                                    <div>
                                        <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Moon Phase</div>
                                        <div className="text-lg font-black">Waning Gibbous</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Disease Alert Snapshot */}
                    <div className="bg-emerald-600/10 border border-emerald-500/20 rounded-2xl p-4">
                         <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-2">Disease Risk Alert</h4>
                         {current?.alerts?.map((a, i) => (
                             <div key={i} className="flex gap-2 items-start mt-1">
                                 <span className="text-sm">{a.icon}</span>
                                 <p className="text-xs leading-relaxed text-emerald-200">{a.message}</p>
                             </div>
                         ))}
                    </div>
                </div>

            </div>

            <p className="text-[10px] text-center text-emerald-600/40 font-bold uppercase tracking-widest pt-8 pb-4">
                Powered by Open-Meteo & FarmSense Weather Engine • Last Updated: {new Date().toLocaleTimeString()}
            </p>

        </div>
    );
}

function DetailItem({ icon, label, value, subValue }) {
    return (
        <div className="flex items-center gap-3">
            <span className="text-2xl p-2 bg-emerald-600/10 rounded-xl">{icon}</span>
            <div>
                <div className="text-[10px] text-emerald-600/60 font-bold uppercase tracking-wider leading-none mb-1">{label}</div>
                <div className="text-sm font-black text-gray-200">{value}</div>
                {subValue && <div className="text-[9px] text-gray-500 font-bold">{subValue}</div>}
            </div>
        </div>
    );
}

function AQIMetric({ label, value }) {
    return (
        <div className="bg-emerald-900/20 p-3 rounded-2xl border border-emerald-900/10">
            <div className="text-[9px] text-emerald-600/60 font-black uppercase tracking-wider mb-1">{label}</div>
            <div className="text-sm font-bold">{value} <span className="text-[10px] text-gray-600 font-normal">µg/m³</span></div>
        </div>
    );
}
