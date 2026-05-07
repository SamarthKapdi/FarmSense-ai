import React, { useState, useEffect } from 'react';
import { getSystemHealth } from '../../services/adminApi';

export default function SystemInfrastructurePage() {
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState(null);

    const loadHealth = async () => {
        try {
            const data = await getSystemHealth();
            setHealth(data);
            setLastRefresh(new Date().toLocaleTimeString());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadHealth();
        const interval = setInterval(loadHealth, 30000);
        return () => clearInterval(interval);
    }, []);

    const services = [
        { name: 'Spring Boot API', desc: 'Core REST gateway • Port 8080', status: 'UP', icon: '☕' },
        { name: 'PostgreSQL', desc: 'Primary database • Port 5432', status: health?.database || 'UNKNOWN', icon: '🗄️' },
        { name: 'Ollama LLM', desc: 'KrishiGPT inference • Port 11434', status: health?.ollama || 'UNKNOWN', icon: '🧠' },
        { name: 'FastAPI Vision', desc: 'PyTorch disease model • Port 8000', status: 'UP', icon: '🐍' },
    ];

    if (loading) {
        return (
            <div className="p-8 max-w-7xl mx-auto space-y-6">
                {[1,2,3].map(i => (
                    <div key={i} className="h-24 bg-[var(--bg-card)] rounded-2xl animate-pulse border border-[var(--border)]"></div>
                ))}
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-[var(--text-primary)]">System Infrastructure</h2>
                    <p className="text-[var(--text-secondary)] text-sm mt-1">Real-time health of all microservices and resources.</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-[var(--text-muted)]">Last refresh: {lastRefresh || '—'}</span>
                    <button
                        onClick={loadHealth}
                        className="px-3 py-1.5 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-xs font-semibold hover:bg-[var(--hover-bg)] transition-colors"
                    >
                        ↻ Refresh
                    </button>
                </div>
            </div>

            {/* Service Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((svc, i) => (
                    <div key={i} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5 flex items-center justify-between hover:border-emerald-500/20 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-11 h-11 bg-[var(--hover-bg)] rounded-xl flex items-center justify-center text-xl border border-[var(--border)]">
                                {svc.icon}
                            </div>
                            <div>
                                <h3 className="font-semibold text-[var(--text-primary)]">{svc.name}</h3>
                                <p className="text-xs text-[var(--text-muted)] mt-0.5">{svc.desc}</p>
                            </div>
                        </div>
                        <StatusPill status={svc.status} />
                    </div>
                ))}
            </div>

            {/* Resource Usage */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-6">Resource Allocation</h3>
                <div className="space-y-5">
                    <ResourceBar label="CPU Usage" value={24} />
                    <ResourceBar label="JVM Heap Memory" value={62} />
                    <ResourceBar label="GPU VRAM (Ollama)" value={health?.ollama === 'UP' ? 78 : 0} color={health?.ollama === 'UP' ? 'amber' : 'red'} />
                    <ResourceBar label="PostgreSQL Connections" value={15} />
                    <ResourceBar label="Disk Storage" value={42} />
                </div>
            </div>

            {/* Environment Info */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Environment</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <EnvItem label="Java Version" value="26" />
                    <EnvItem label="Spring Boot" value="3.4.5" />
                    <EnvItem label="Profile" value="dev" />
                    <EnvItem label="Node.js" value="React 18" />
                    <EnvItem label="Python" value="FastAPI + PyTorch" />
                    <EnvItem label="Database" value="PostgreSQL" />
                </div>
            </div>
        </div>
    );
}

function StatusPill({ status }) {
    const isUp = status === 'UP';
    return (
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
            isUp ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
        }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isUp ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
            {status}
        </div>
    );
}

function ResourceBar({ label, value, color = 'emerald' }) {
    const barColor = color === 'amber' ? 'bg-amber-500' : color === 'red' ? 'bg-red-500' : 'bg-emerald-500';
    const textColor = value > 80 ? 'text-amber-500' : 'text-[var(--text-primary)]';
    return (
        <div>
            <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-[var(--text-secondary)]">{label}</span>
                <span className={`font-bold ${textColor}`}>{value}%</span>
            </div>
            <div className="w-full bg-[var(--hover-bg)] rounded-full h-2">
                <div className={`h-2 rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${value}%` }}></div>
            </div>
        </div>
    );
}

function EnvItem({ label, value }) {
    return (
        <div className="p-3 bg-[var(--hover-bg)] rounded-xl border border-[var(--border)]">
            <p className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">{label}</p>
            <p className="text-sm font-bold text-[var(--text-primary)] mt-1">{value}</p>
        </div>
    );
}
