import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDiseaseTrends, getPendingVerifications, verifyDiagnosis, publishAdvisory, getAdvisories, getFarmerStats, getActivityFeed } from '../services/agronomistApi';
import KrishiGPTChat from '../components/KrishiGPTChat';

const ACTIVITY_ICONS = {
    SCAN: '📸',
    CHAT: '💬',
    LOGIN: '🔐',
    REGISTER: '🌱',
    VERIFY_DIAGNOSIS: '✅',
    PUBLISH_ADVISORY: '📢',
    VIEW_HISTORY: '📋',
};

function timeAgo(dateStr) {
    if (!dateStr) return '';
    const now = new Date();
    const then = new Date(dateStr);
    const diff = Math.floor((now - then) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return then.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function AgronomistPortal({ onLogout }) {
    const { user, token } = useAuth();
    const [activeTab, setActiveTab] = useState('verifications');
    const [stats, setStats] = useState(null);
    const [trends, setTrends] = useState([]);
    const [verifications, setVerifications] = useState([]);
    const [advisories, setAdvisories] = useState([]);
    const [activities, setActivities] = useState([]);
    const [activityTypeFilter, setActivityTypeFilter] = useState('ALL');
    const [language, setLanguage] = useState('en');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Advisory Form State
    const [advTitle, setAdvTitle] = useState('');
    const [advContent, setAdvContent] = useState('');
    const [advCrop, setAdvCrop] = useState('All');
    const [advRegion, setAdvRegion] = useState('');

    useEffect(() => {
        loadStats();
    }, []);

    useEffect(() => {
        if (activeTab !== 'chat') {
            loadData();
        }
    }, [activeTab, activityTypeFilter]);

    const loadStats = async () => {
        try {
            const statsData = await getFarmerStats();
            setStats(statsData);
        } catch (err) {
            console.error('Failed to load farmer stats:', err);
        }
    };

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            if (activeTab === 'verifications') {
                const data = await getPendingVerifications();
                setVerifications(data || []);
            } else if (activeTab === 'trends') {
                const data = await getDiseaseTrends();
                setTrends(data || []);
            } else if (activeTab === 'advisories') {
                const data = await getAdvisories();
                setAdvisories(data || []);
            } else if (activeTab === 'activity') {
                const data = await getActivityFeed(activityTypeFilter, 50);
                setActivities(data || []);
            }
        } catch (err) {
            setError(err.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (reportId, correctDisease, notes) => {
        try {
            await verifyDiagnosis(reportId, correctDisease, notes);
            setVerifications(prev => prev.filter(v => v.id !== reportId));
            loadStats();
        } catch (err) {
            alert(err.message || "Failed to verify diagnosis");
        }
    };

    const handlePublishAdvisory = async (e) => {
        e.preventDefault();
        try {
            const validUntil = new Date();
            validUntil.setDate(validUntil.getDate() + 7); // Valid for 7 days
            await publishAdvisory({
                title: advTitle,
                content: advContent,
                crop: advCrop,
                region: advRegion,
                validUntil: validUntil.toISOString()
            });
            setAdvTitle('');
            setAdvContent('');
            setAdvCrop('All');
            setAdvRegion('');
            alert('Advisory published successfully!');
            setActiveTab('advisories');
            loadStats();
        } catch (err) {
            alert(err.message || 'Failed to publish advisory');
        }
    };

    const inputClass = "w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 transition-colors text-sm";

    return (
        <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] pb-12">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-[var(--bg-main)]/80 backdrop-blur-xl border-b border-[var(--border)] p-4">
                <div className="max-w-5xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🔬</span>
                        <div>
                            <h1 className="text-xl font-bold">Agronomist <span className="text-emerald-500">Portal</span></h1>
                            <p className="text-xs text-[var(--text-secondary)]">{user?.fullName || user?.email}</p>
                        </div>
                    </div>
                    <button onClick={onLogout} className="text-[var(--text-secondary)] hover:text-[var(--danger)] transition-colors text-sm px-3 py-1.5 rounded-lg border border-[var(--border)] hover:border-[var(--danger)] flex items-center gap-2">
                        <span>🚪</span> Logout
                    </button>
                </div>
            </header>

            <main className="max-w-5xl mx-auto p-4 mt-4 space-y-6">
                
                {/* Stats Header Cards */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 flex flex-col justify-between">
                            <span className="text-xs text-[var(--text-muted)] font-medium">Total Scans</span>
                            <div className="flex items-baseline justify-between mt-2">
                                <span className="text-2xl font-bold text-emerald-500">{stats.totalScans || 0}</span>
                                <span className="text-xs bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full">Platform</span>
                            </div>
                        </div>
                        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 flex flex-col justify-between">
                            <span className="text-xs text-[var(--text-muted)] font-medium">Scans Today</span>
                            <div className="flex items-baseline justify-between mt-2">
                                <span className="text-2xl font-bold text-blue-500">{stats.scansToday || 0}</span>
                                <span className="text-xs bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full">24h</span>
                            </div>
                        </div>
                        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 flex flex-col justify-between">
                            <span className="text-xs text-[var(--text-muted)] font-medium">Chats Today</span>
                            <div className="flex items-baseline justify-between mt-2">
                                <span className="text-2xl font-bold text-purple-500">{stats.chatsToday || 0}</span>
                                <span className="text-xs bg-purple-500/10 text-purple-500 px-2 py-0.5 rounded-full">AI Assistant</span>
                            </div>
                        </div>
                        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 flex flex-col justify-between">
                            <span className="text-xs text-[var(--text-muted)] font-medium">Active Farmers (7d)</span>
                            <div className="flex items-baseline justify-between mt-2">
                                <span className="text-2xl font-bold text-amber-500">{stats.activeFarmers7Days || 0}</span>
                                <span className="text-xs bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full">Weekly</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error Banner */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
                        <p className="text-red-400 text-sm">⚠️ {error}</p>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-2 bg-[var(--bg-elevated)] p-1 rounded-xl border border-[var(--border)] w-full sm:w-fit overflow-x-auto whitespace-nowrap">
                    <TabButton active={activeTab === 'verifications'} onClick={() => setActiveTab('verifications')} icon="✅" label="Pending Verifications" />
                    <TabButton active={activeTab === 'activity'} onClick={() => setActiveTab('activity')} icon="⚡" label="Unified Activity Feed" />
                    <TabButton active={activeTab === 'trends'} onClick={() => setActiveTab('trends')} icon="📈" label="Disease Trends" />
                    <TabButton active={activeTab === 'publish'} onClick={() => setActiveTab('publish')} icon="📢" label="Publish Advisory" />
                    <TabButton active={activeTab === 'advisories'} onClick={() => setActiveTab('advisories')} icon="📜" label="Advisories" />
                    <TabButton active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} icon="💬" label="KrishiGPT AI" />
                </div>

                {/* Tab Content */}
                <div className="fade-in">
                    {loading && activeTab !== 'chat' && (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}
                    
                    {/* Verifications Tab */}
                    {!loading && activeTab === 'verifications' && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold">Pending Verifications</h2>
                            {verifications.length === 0 ? (
                                <p className="text-[var(--text-muted)] p-8 text-center bg-[var(--bg-card)] rounded-2xl border border-[var(--border)]">No pending verifications. Great job!</p>
                            ) : (
                                verifications.map(v => (
                                    <div key={v.id} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5 flex flex-col md:flex-row gap-5 hover:border-emerald-500/20 transition-colors">
                                        <div className="flex-1">
                                            <p className="text-xs text-[var(--text-muted)] mb-1">{new Date(v.createdAt).toLocaleString()}</p>
                                            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">AI Diagnosis: <span className="text-emerald-500">{v.diseaseName}</span></h3>
                                            <p className="text-sm text-[var(--text-secondary)] mb-1">Crop: {v.cropName}</p>
                                            <p className="text-sm text-[var(--text-secondary)] mb-4">Confidence: {v.confidence}%</p>
                                            <div className="flex gap-3 mt-4">
                                                <button onClick={() => handleVerify(v.id, null, 'Looks accurate.')} className="px-4 py-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-lg text-sm font-semibold transition-colors border border-emerald-500/20">
                                                    ✓ Confirm Accurate
                                                </button>
                                                <button onClick={() => {
                                                    const correction = prompt("Enter correct disease name:");
                                                    if(correction) handleVerify(v.id, correction, 'Corrected by expert.');
                                                }} className="px-4 py-2 bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] rounded-lg text-sm font-semibold transition-colors border border-[var(--border)]">
                                                    ✎ Correct Diagnosis
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Unified Activity Feed Tab */}
                    {!loading && activeTab === 'activity' && (
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <h2 className="text-lg font-bold">Unified Activity Feed</h2>
                                    <p className="text-xs text-[var(--text-secondary)]">Real-time synchronized activities across farmers and agronomists</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="text-xs text-[var(--text-muted)] font-medium">Filter:</label>
                                    <select
                                        value={activityTypeFilter}
                                        onChange={e => setActivityTypeFilter(e.target.value)}
                                        className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
                                    >
                                        <option value="ALL">All Activities</option>
                                        <option value="SCAN">Scans (📸)</option>
                                        <option value="CHAT">Chats (💬)</option>
                                        <option value="VERIFY_DIAGNOSIS">Verifications (✅)</option>
                                        <option value="PUBLISH_ADVISORY">Advisories (📢)</option>
                                        <option value="LOGIN">Logins (🔐)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden">
                                {activities.length === 0 ? (
                                    <p className="text-[var(--text-muted)] p-8 text-center">No recent activities found.</p>
                                ) : (
                                    <div className="divide-y divide-[var(--border)]">
                                        {activities.map((act) => (
                                            <div key={act.id} className="p-4 hover:bg-[var(--hover-bg)] transition-colors flex items-start gap-3.5">
                                                <div className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center text-lg shrink-0">
                                                    {ACTIVITY_ICONS[act.activityType] || '📌'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2 mb-1">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <span className="font-semibold text-sm text-[var(--text-primary)] truncate">
                                                                {act.userName || act.userEmail || 'User'}
                                                            </span>
                                                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)]">
                                                                {act.activityType}
                                                            </span>
                                                        </div>
                                                        <span className="text-xs text-[var(--text-muted)] shrink-0">{timeAgo(act.createdAt)}</span>
                                                    </div>
                                                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{act.description}</p>
                                                    {act.metadata && (
                                                        <p className="text-xs text-emerald-500 font-mono mt-1 bg-emerald-500/5 px-2 py-1 rounded border border-emerald-500/10 inline-block">
                                                            {act.metadata}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Trends Tab */}
                    {!loading && activeTab === 'trends' && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold">Disease Trends (Last 30 Days)</h2>
                            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5">
                                <ul className="divide-y divide-[var(--border)]">
                                    {trends.map((t, idx) => (
                                        <li key={idx} className="py-3 flex justify-between items-center">
                                            <span className="text-[var(--text-primary)] font-medium">{t[0]}</span>
                                            <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/20">{t[1]} cases</span>
                                        </li>
                                    ))}
                                    {trends.length === 0 && <p className="text-[var(--text-muted)] text-center py-4">No data available.</p>}
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Publish Advisory Tab */}
                    {!loading && activeTab === 'publish' && (
                        <div className="space-y-4 max-w-2xl">
                            <h2 className="text-lg font-bold">Publish Crop Advisory</h2>
                            <form onSubmit={handlePublishAdvisory} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5 space-y-4">
                                <div>
                                    <label className="block text-[var(--text-muted)] text-xs mb-1.5 font-semibold">Title</label>
                                    <input type="text" required value={advTitle} onChange={e=>setAdvTitle(e.target.value)} className={inputClass} placeholder="e.g., Late Blight Warning for Tomatoes" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[var(--text-muted)] text-xs mb-1.5 font-semibold">Target Crop</label>
                                        <input type="text" value={advCrop} onChange={e=>setAdvCrop(e.target.value)} className={inputClass} placeholder="Tomato" />
                                    </div>
                                    <div>
                                        <label className="block text-[var(--text-muted)] text-xs mb-1.5 font-semibold">Region</label>
                                        <input type="text" value={advRegion} onChange={e=>setAdvRegion(e.target.value)} className={inputClass} placeholder="North India" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[var(--text-muted)] text-xs mb-1.5 font-semibold">Content</label>
                                    <textarea required rows={5} value={advContent} onChange={e=>setAdvContent(e.target.value)} className={`${inputClass} resize-none`} placeholder="Details about the advisory..." />
                                </div>
                                <button type="submit" className="w-full bg-emerald-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-emerald-700 transition-all">
                                    Publish Advisory
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Advisories List Tab */}
                    {!loading && activeTab === 'advisories' && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold">Published Advisories</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {advisories.map(adv => (
                                    <div key={adv.id} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5 hover:border-emerald-500/20 transition-colors flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start gap-2 mb-2">
                                                <h3 className="text-[var(--text-primary)] font-bold">{adv.title}</h3>
                                                <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                                                    {timeAgo(adv.createdAt)}
                                                </span>
                                            </div>
                                            <p className="text-[var(--text-secondary)] text-sm mb-4 leading-relaxed">{adv.content}</p>
                                        </div>
                                        <div className="pt-3 border-t border-[var(--border)] flex justify-between items-center text-xs text-[var(--text-muted)]">
                                            <div className="flex gap-2">
                                                <span className="bg-[var(--bg-elevated)] px-2 py-1 rounded border border-[var(--border)]">🌾 {adv.crop || 'All'}</span>
                                                {adv.region && <span className="bg-[var(--bg-elevated)] px-2 py-1 rounded border border-[var(--border)]">📍 {adv.region}</span>}
                                            </div>
                                            <span className="font-medium text-[var(--text-secondary)]">✍️ {adv.authorName || adv.authorId || 'Agronomist'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {advisories.length === 0 && <p className="text-[var(--text-muted)] p-8 text-center bg-[var(--bg-card)] rounded-2xl border border-[var(--border)]">No advisories published yet.</p>}
                        </div>
                    )}

                    {/* KrishiGPT AI Assistant Tab */}
                    {activeTab === 'chat' && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold">KrishiGPT AI Assistant</h2>
                            <KrishiGPTChat
                                language={language}
                                farmerId={user?.userId || user?.id}
                                token={token}
                                onLanguageChange={setLanguage}
                            />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

function TabButton({ active, onClick, icon, label }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0 whitespace-nowrap ${
                active ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)]'
            }`}
        >
            <span>{icon}</span> {label}
        </button>
    );
}
