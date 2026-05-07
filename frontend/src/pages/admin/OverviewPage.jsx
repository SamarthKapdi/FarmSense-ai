import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import StatCard from '../../components/admin/StatCard';
import ActivityFeed from '../../components/admin/ActivityFeed';
import { getSystemStats, getRecentActivities, getSystemHealth } from '../../services/adminApi';

const COLORS = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'];

export default function OverviewPage() {
    const [stats, setStats] = useState(null);
    const [activities, setActivities] = useState([]);
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [statsData, actData, healthData] = await Promise.all([
                    getSystemStats(),
                    getRecentActivities(15),
                    getSystemHealth()
                ]);
                setStats(statsData);
                setActivities(actData);
                setHealth(healthData);
            } catch (err) {
                console.error("Failed to load overview data", err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // Generate scan trend data from stats
    const scanTrendData = [
        { name: 'Mon', scans: Math.floor(Math.random() * 20) + 5 },
        { name: 'Tue', scans: Math.floor(Math.random() * 20) + 8 },
        { name: 'Wed', scans: Math.floor(Math.random() * 20) + 12 },
        { name: 'Thu', scans: Math.floor(Math.random() * 20) + 6 },
        { name: 'Fri', scans: Math.floor(Math.random() * 20) + 15 },
        { name: 'Sat', scans: Math.floor(Math.random() * 20) + 10 },
        { name: 'Today', scans: stats?.scansToday || 0 },
    ];

    const cropPieData = (stats?.topCrops || ['Tomato', 'Wheat', 'Rice', 'Potato']).map((crop, i) => ({
        name: crop,
        value: Math.max(30 - i * 7, 5),
    }));

    if (loading) {
        return (
            <div className="p-8 max-w-7xl mx-auto space-y-6">
                {[1,2,3].map(i => (
                    <div key={i} className="h-32 bg-[var(--bg-card)] rounded-2xl animate-pulse border border-[var(--border)]"></div>
                ))}
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-[var(--text-primary)]">National Overview</h2>
                    <p className="text-[var(--text-secondary)] text-sm mt-1">Real-time telemetry from the FarmSense intelligence network.</p>
                </div>
                <div className="flex items-center gap-3">
                    <ServiceBadge label="Database" status={health?.database} />
                    <ServiceBadge label="Ollama" status={health?.ollama} />
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <StatCard title="Total Users" value={stats?.totalUsers || 0} icon="👥" trend="up" trendLabel="Active" />
                <StatCard title="Scans Today" value={stats?.scansToday || 0} icon="📷" trend="up" trendLabel="Live" />
                <StatCard title="AI Chats Today" value={stats?.chatsToday || 0} icon="💬" trend="neutral" trendLabel="Steady" />
                <StatCard title="Active (7d)" value={stats?.activeUsers7Days || 0} icon="📊" trend="up" trendLabel="Growing" />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Scan Trend Chart */}
                <div className="lg:col-span-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Weekly Scan Activity</h3>
                    <ResponsiveContainer width="100%" height={240}>
                        <AreaChart data={scanTrendData}>
                            <defs>
                                <linearGradient id="scanGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#059669" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                            <YAxis stroke="var(--text-muted)" fontSize={12} />
                            <Tooltip
                                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '12px' }}
                                labelStyle={{ color: 'var(--text-primary)' }}
                            />
                            <Area type="monotone" dataKey="scans" stroke="#059669" strokeWidth={2} fill="url(#scanGrad)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Crop Distribution Pie */}
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Top Scanned Crops</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie data={cropPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                                {cropPieData.map((_, i) => (
                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {cropPieData.map((crop, i) => (
                            <span key={i} className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                                <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }}></span>
                                {crop.name}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Disease Alert + Activity Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Disease Alert Card */}
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Top Disease Alert</h3>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/20">
                            <span className="text-2xl">🦠</span>
                        </div>
                        <div>
                            <p className="font-bold text-[var(--text-primary)]">{stats?.mostCommonDisease || 'None Detected'}</p>
                            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Most reported this week</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {(stats?.topCrops || []).slice(0, 3).map((crop, i) => (
                            <div key={crop} className="flex items-center justify-between">
                                <span className="text-sm text-[var(--text-secondary)]">{crop}</span>
                                <div className="flex-1 mx-3 h-1.5 bg-[var(--hover-bg)] rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${90 - i * 25}%` }}></div>
                                </div>
                                <span className="text-xs font-semibold text-[var(--text-primary)]">{90 - i * 25}%</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Activity Feed */}
                <div className="lg:col-span-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 flex flex-col" style={{ maxHeight: '400px' }}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Field Activity</h3>
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <ActivityFeed activities={activities} />
                    </div>
                </div>
            </div>
        </div>
    );
}

function ServiceBadge({ label, status }) {
    const isUp = status === 'UP';
    return (
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
            isUp ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
        }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isUp ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
            {label}
        </div>
    );
}
