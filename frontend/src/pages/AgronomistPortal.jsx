import React, { useState, useEffect } from 'react';
import { getDiseaseTrends, getPendingVerifications, verifyDiagnosis, publishAdvisory, getAdvisories } from '../services/agronomistApi';

export default function AgronomistPortal({ onNavigate }) {
    const [activeTab, setActiveTab] = useState('verifications');
    const [trends, setTrends] = useState([]);
    const [verifications, setVerifications] = useState([]);
    const [advisories, setAdvisories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Advisory Form State
    const [advTitle, setAdvTitle] = useState('');
    const [advContent, setAdvContent] = useState('');
    const [advCrop, setAdvCrop] = useState('All');
    const [advRegion, setAdvRegion] = useState('');

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            if (activeTab === 'trends') {
                const data = await getDiseaseTrends();
                setTrends(data || []);
            } else if (activeTab === 'verifications') {
                const data = await getPendingVerifications();
                setVerifications(data || []);
            } else if (activeTab === 'advisories') {
                const data = await getAdvisories();
                setAdvisories(data || []);
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
            setAdvRegion('');
            alert('Advisory published successfully!');
            setActiveTab('advisories');
        } catch (err) {
            alert(err.message || 'Failed to publish advisory');
        }
    };

    if (loading && trends.length === 0 && verifications.length === 0 && advisories.length === 0) {
        return (
            <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const inputClass = "w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 transition-colors text-sm";

    return (
        <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] pb-12">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-[var(--bg-main)]/80 backdrop-blur-xl border-b border-[var(--border)] p-4">
                <div className="max-w-5xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🔬</span>
                        <h1 className="text-xl font-bold">Agronomist <span className="text-emerald-500">Portal</span></h1>
                    </div>
                    <button onClick={() => onNavigate('app')} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-sm px-3 py-1.5 rounded-lg border border-[var(--border)] hover:border-emerald-500">
                        Exit Portal
                    </button>
                </div>
            </header>

            <main className="max-w-5xl mx-auto p-4 mt-4 space-y-6">
                
                {/* Error Banner */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
                        <p className="text-red-400 text-sm">⚠️ {error}</p>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-2 bg-[var(--bg-elevated)] p-1 rounded-xl border border-[var(--border)] w-fit">
                    <TabButton active={activeTab === 'verifications'} onClick={() => setActiveTab('verifications')} icon="✅" label="Pending Verifications" />
                    <TabButton active={activeTab === 'trends'} onClick={() => setActiveTab('trends')} icon="📈" label="Disease Trends" />
                    <TabButton active={activeTab === 'publish'} onClick={() => setActiveTab('publish')} icon="📢" label="Publish Advisory" />
                    <TabButton active={activeTab === 'advisories'} onClick={() => setActiveTab('advisories')} icon="📜" label="Advisories" />
                </div>

                {/* Tab Content */}
                <div className="fade-in">
                    
                    {/* Verifications Tab */}
                    {activeTab === 'verifications' && (
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

                    {/* Trends Tab */}
                    {activeTab === 'trends' && (
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
                    {activeTab === 'publish' && (
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
                    {activeTab === 'advisories' && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold">Published Advisories</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {advisories.map(adv => (
                                    <div key={adv.id} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5 hover:border-emerald-500/20 transition-colors">
                                        <h3 className="text-[var(--text-primary)] font-bold mb-2">{adv.title}</h3>
                                        <p className="text-[var(--text-secondary)] text-sm mb-4 line-clamp-3">{adv.content}</p>
                                        <div className="flex gap-2 text-xs text-[var(--text-muted)]">
                                            <span className="bg-[var(--bg-elevated)] px-2 py-1 rounded border border-[var(--border)]">🌾 {adv.crop}</span>
                                            {adv.region && <span className="bg-[var(--bg-elevated)] px-2 py-1 rounded border border-[var(--border)]">📍 {adv.region}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {advisories.length === 0 && <p className="text-[var(--text-muted)] p-8 text-center bg-[var(--bg-card)] rounded-2xl border border-[var(--border)]">No advisories published yet.</p>}
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
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                active ? 'bg-emerald-600 text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)]'
            }`}
        >
            <span>{icon}</span> {label}
        </button>
    );
}
