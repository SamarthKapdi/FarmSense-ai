import React, { useState } from 'react';

export default function AdminLayout({ activeSection, setActiveSection, onLogout, children }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const sections = [
        { id: 'overview', icon: '📊', label: 'National Overview' },
        { id: 'surveillance', icon: '🦠', label: 'Disease Surveillance' },
        { id: 'users', icon: '👥', label: 'User Management' },
        { id: 'ai', icon: '🧠', label: 'AI Monitoring' },
        { id: 'infrastructure', icon: '⚡', label: 'System Infrastructure' },
        { id: 'config', icon: '⚙️', label: 'Platform Configuration' },
    ];

    return (
        <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] font-sans flex">
            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 w-72 bg-[var(--bg-card)] border-r border-[var(--border)] flex flex-col shadow-2xl z-50 transform transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
                            <span className="text-xl">🌾</span>
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-[var(--text-primary)]">FarmSense Central</h1>
                            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Operations Center</p>
                        </div>
                    </div>
                    <button className="lg:hidden p-2 text-[var(--text-muted)] hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>
                        ✕
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                    {sections.map(s => (
                        <button 
                            key={s.id}
                            onClick={() => { setActiveSection(s.id); setIsMobileMenuOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                                activeSection === s.id 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : 'text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            <span className="text-lg">{s.icon}</span>
                            <span className="text-sm font-medium">{s.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="p-6 border-t border-[var(--border)] space-y-4">
                    <div className="flex items-center gap-3 px-3 py-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-xs font-semibold text-emerald-400">System Healthy</span>
                    </div>
                    <button 
                        onClick={onLogout}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium rounded-xl border border-red-500/20 transition-all"
                    >
                        <span>🚪</span> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col min-w-0 lg:ml-72 min-h-screen">
                {/* Mobile Header */}
                <header className="lg:hidden bg-[var(--bg-card)] border-b border-[var(--border)] p-4 flex items-center gap-4 sticky top-0 z-30">
                    <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-[var(--text-secondary)] hover:text-white">
                        ☰
                    </button>
                    <h1 className="text-sm font-bold">FarmSense Central</h1>
                </header>

                <main className="flex-1 overflow-x-hidden">
                    {children}
                </main>
            </div>
        </div>
    );
}
