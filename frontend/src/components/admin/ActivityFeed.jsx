import React from 'react';

export default function ActivityFeed({ activities = [] }) {
    if (!activities.length) return <p className="text-[var(--text-muted)] text-sm">No recent activities found.</p>;

    return (
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {activities.map((act, index) => {
                const date = new Date(act.createdAt);
                const timeStr = date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0');
                
                let icon = '📝';
                if (act.activityType === 'SCAN') icon = '📷';
                if (act.activityType === 'CHAT') icon = '💬';
                if (act.activityType === 'REGISTER') icon = '🌱';

                return (
                    <div key={act.id || index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-[var(--hover-bg)] border border-[var(--border)] flex items-center justify-center text-xs">
                                {icon}
                            </div>
                            {index !== activities.length - 1 && (
                                <div className="w-px flex-1 bg-[var(--border)] my-1"></div>
                            )}
                        </div>
                        <div className="flex-1 pb-4">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-xs font-semibold text-[var(--text-primary)]">{act.userEmail}</span>
                                <span className="text-[10px] text-[var(--text-muted)]">{timeStr}</span>
                            </div>
                            <p className="text-sm text-[var(--text-secondary)]">{act.description}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
