import React from 'react';

export default function StatCard({ title, value, icon, trend, trendLabel }) {
    return (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5 shadow-sm hover:border-emerald-500/30 transition-all">
            <div className="flex justify-between items-start mb-4">
                <span className="text-[var(--text-secondary)] font-semibold text-xs uppercase tracking-wider">{title}</span>
                <span className="text-xl text-[var(--text-muted)]">{icon}</span>
            </div>
            <div className="flex items-end gap-3">
                <span className="text-3xl font-bold text-[var(--text-primary)]">{value}</span>
                {trend && (
                    <div className="mb-1 flex items-center gap-1">
                        <span className={`text-xs font-bold ${trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-blue-500'}`}>
                            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendLabel}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
