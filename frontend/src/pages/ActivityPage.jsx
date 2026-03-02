import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getUserStats, getRecentActivities, getScanHistory, getChatHistory } from "../services/userApi";

const ACTIVITY_ICONS = {
    SCAN: "📸", CHAT: "💬", LOGIN: "🔐", REGISTER: "🌱",
    VIEW_HISTORY: "📋", GENERATE_PLAN: "📝",
};

function timeAgo(dateStr) {
    if (!dateStr) return "";
    const now = new Date();
    const then = new Date(dateStr);
    const diff = Math.floor((now - then) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return then.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function ActivityPage() {
    const { user, token } = useAuth();
    const [activeTab, setActiveTab] = useState("dashboard");
    const [stats, setStats] = useState(null);
    const [activities, setActivities] = useState([]);
    const [scans, setScans] = useState([]);
    const [chats, setChats] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedScan, setExpandedScan] = useState(null);
    const [expandedChat, setExpandedChat] = useState(null);
    const [scanFilter, setScanFilter] = useState("");
    const [severityFilter, setSeverityFilter] = useState("All");

    useEffect(() => {
        loadData();
    }, [token]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [statsData, actData, scanData, chatData] = await Promise.all([
                getUserStats(token).catch(() => null),
                getRecentActivities(token).catch(() => []),
                getScanHistory(token).catch(() => []),
                getChatHistory(token).catch(() => []),
            ]);
            setStats(statsData);
            setActivities(actData || []);
            setScans(scanData || []);
            setChats(chatData || []);
        } catch (err) {
            console.error("Failed to load activity data:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const TABS = [
        { id: "dashboard", icon: "📊", label: "Dashboard" },
        { id: "scans", icon: "🔍", label: "Scans" },
        { id: "chats", icon: "💬", label: "Chats" },
        { id: "analytics", icon: "📈", label: "Analytics" },
    ];

    const filteredScans = scans.filter((s) => {
        if (scanFilter && !s.diseaseName?.toLowerCase().includes(scanFilter.toLowerCase())) return false;
        if (severityFilter !== "All" && s.severity !== severityFilter) return false;
        return true;
    });

    const getSeverityClass = (sev) => {
        if (!sev) return "severity-mild";
        const l = sev.toLowerCase();
        if (l.includes("severe")) return "severity-severe";
        if (l.includes("moderate")) return "severity-moderate";
        return "severity-mild";
    };

    // Analytics helpers
    const diseaseBreakdown = scans.reduce((acc, s) => {
        const name = s.diseaseName || "Unknown";
        acc[name] = (acc[name] || 0) + 1;
        return acc;
    }, {});
    const topDiseases = Object.entries(diseaseBreakdown)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    const maxDiseaseCount = topDiseases.length > 0 ? topDiseases[0][1] : 1;

    const cropBreakdown = scans.reduce((acc, s) => {
        const name = s.cropName || "Unknown";
        acc[name] = (acc[name] || 0) + 1;
        return acc;
    }, {});
    const topCrops = Object.entries(cropBreakdown).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const maxCropCount = topCrops.length > 0 ? topCrops[0][1] : 1;

    const langBreakdown = chats.reduce((acc, c) => {
        const lang = c.language || "en";
        acc[lang] = (acc[lang] || 0) + 1;
        return acc;
    }, {});

    const LANG_NAMES = {
        en: "English", hi: "Hindi", ta: "Tamil",
        te: "Telugu", mr: "Marathi", pa: "Punjabi",
    };

    if (isLoading) {
        return (
            <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
                <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="skeleton h-24 rounded-2xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="px-4 pt-5 pb-4 max-w-lg mx-auto fade-in">
            {/* Tab Bar */}
            <div className="flex gap-1 bg-darker/50 rounded-xl p-1 mb-5 overflow-x-auto no-scrollbar">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all 
                        flex items-center justify-center gap-1 min-w-[70px]
                        ${activeTab === tab.id
                                ? "bg-gradient-to-r from-accent to-primary text-dark"
                                : "text-gray-400 hover:text-[var(--text-primary)]"
                            }`}
                    >
                        <span>{tab.icon}</span>
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* ── TAB 1: Dashboard ── */}
            {activeTab === "dashboard" && (
                <div className="space-y-4 fade-in">
                    {/* Welcome Card */}
                    <div className="disease-card bg-gradient-to-br from-primary/30 to-darker">
                        <h3 className="text-[var(--text-primary)] text-lg font-bold">
                            Welcome back, {user?.fullName || "Farmer"}! 👨‍🌾
                        </h3>
                        <p className="text-gray-400 text-xs mt-1">
                            Member since {stats?.joinedDate ? new Date(stats.joinedDate).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : "recently"}
                        </p>
                        <p className="text-gray-500 text-xs mt-0.5">
                            Last active: {stats?.lastActive ? timeAgo(stats.lastActive) : "Just now"}
                        </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { icon: "📸", label: "Total Scans", value: stats?.totalScans || 0, color: "text-accent" },
                            { icon: "💬", label: "Total Chats", value: stats?.totalChats || 0, color: "text-blue-400" },
                            { icon: "🌿", label: "Diseases Found", value: stats?.uniqueDiseases || 0, color: "text-yellow-400" },
                            { icon: "📅", label: "Days Active", value: stats?.daysActive || 0, color: "text-purple-400" },
                        ].map((s) => (
                            <div key={s.label} className="disease-card text-center">
                                <div className="text-2xl mb-1">{s.icon}</div>
                                <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
                                <p className="text-gray-500 text-xs">{s.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Most Common Disease & Crop */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="disease-card">
                            <p className="text-gray-500 text-xs mb-1">🦠 Top Disease</p>
                            <p className="text-[var(--text-primary)] font-bold text-sm">{stats?.mostCommonDisease || "None"}</p>
                        </div>
                        <div className="disease-card">
                            <p className="text-gray-500 text-xs mb-1">🌱 Top Crop</p>
                            <p className="text-[var(--text-primary)] font-bold text-sm">{stats?.mostScannedCrop || "None"}</p>
                        </div>
                    </div>

                    {/* Recent Activity Feed */}
                    <div className="disease-card">
                        <h4 className="text-[var(--text-primary)] font-bold mb-3 text-sm">⚡ Recent Activity</h4>
                        {activities.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center py-4">No activity yet</p>
                        ) : (
                            <div className="space-y-3">
                                {activities.slice(0, 8).map((a, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <span className="text-lg flex-shrink-0">
                                            {ACTIVITY_ICONS[a.activityType] || "📌"}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-gray-200 text-xs truncate">{a.description}</p>
                                            <p className="text-gray-600 text-xs">{timeAgo(a.createdAt)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── TAB 2: Scan History ── */}
            {activeTab === "scans" && (
                <div className="space-y-3 fade-in">
                    <h3 className="text-[var(--text-primary)] font-bold text-sm">🔍 Scan History</h3>

                    {/* Filters */}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={scanFilter}
                            onChange={(e) => setScanFilter(e.target.value)}
                            placeholder="Search disease..."
                            className="flex-1 bg-darker border border-gray-700 rounded-lg px-3 py-2 
                         text-sm text-[var(--text-primary)] placeholder-gray-600 focus:outline-none focus:border-accent"
                        />
                        <select
                            value={severityFilter}
                            onChange={(e) => setSeverityFilter(e.target.value)}
                            className="bg-darker border border-gray-700 rounded-lg px-2 py-2 
                         text-sm text-[var(--text-primary)] focus:outline-none focus:border-accent"
                        >
                            <option value="All">All</option>
                            <option value="Mild">Mild</option>
                            <option value="Moderate">Moderate</option>
                            <option value="Severe">Severe</option>
                        </select>
                    </div>

                    {filteredScans.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-5xl mb-3 leaf-pulse">🌾</div>
                            <p className="text-gray-400 text-sm">No scans yet! Upload your first crop photo</p>
                        </div>
                    ) : (
                        filteredScans.map((scan, index) => (
                            <div key={scan.id || index} className="disease-card">
                                <button
                                    onClick={() => setExpandedScan(expandedScan === index ? null : index)}
                                    className="w-full text-left"
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h4 className="text-[var(--text-primary)] font-bold text-sm">{scan.diseaseName}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                {scan.cropName && (
                                                    <span className="bg-primary/40 text-accent text-xs px-2 py-0.5 rounded-full">
                                                        🌱 {scan.cropName}
                                                    </span>
                                                )}
                                                <span className="text-gray-500 text-xs">
                                                    {scan.createdAt ? new Date(scan.createdAt).toLocaleDateString("en-IN") : ""}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-accent text-xs font-semibold">{scan.confidence}%</span>
                                            <span className={getSeverityClass(scan.severity)}>{scan.severity}</span>
                                        </div>
                                    </div>
                                </button>
                                {expandedScan === index && (
                                    <div className="mt-3 pt-3 border-t border-gray-800/50 fade-in space-y-2">
                                        {scan.yieldLossEstimate && (
                                            <p className="text-gray-400 text-xs">📉 Yield Loss: <span className="text-red-400">{scan.yieldLossEstimate}</span></p>
                                        )}
                                        {scan.estimatedRecoveryCost && (
                                            <p className="text-gray-400 text-xs">💰 Recovery: <span className="text-yellow-400">{scan.estimatedRecoveryCost}</span></p>
                                        )}
                                        {scan.bestTimeToTreat && (
                                            <p className="text-gray-400 text-xs">🕐 Best Time: <span className="text-accent">{scan.bestTimeToTreat}</span></p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* ── TAB 3: Chat History ── */}
            {activeTab === "chats" && (
                <div className="space-y-3 fade-in">
                    <h3 className="text-[var(--text-primary)] font-bold text-sm">💬 Chat History</h3>

                    {chats.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-5xl mb-3">💬</div>
                            <p className="text-gray-400 text-sm">No chats yet! Ask KrishiGPT anything</p>
                        </div>
                    ) : (
                        chats.map((chat, index) => (
                            <div key={chat.id || index} className="disease-card">
                                <button
                                    onClick={() => setExpandedChat(expandedChat === index ? null : index)}
                                    className="w-full text-left"
                                >
                                    <p className="text-[var(--text-primary)] text-sm font-medium truncate">{chat.question}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        {chat.crop && (
                                            <span className="bg-primary/40 text-accent text-xs px-2 py-0.5 rounded-full">
                                                🌱 {chat.crop}
                                            </span>
                                        )}
                                        <span className="text-gray-500 text-xs">
                                            {chat.language ? LANG_NAMES[chat.language] || chat.language : ""} •{" "}
                                            {chat.createdAt ? timeAgo(chat.createdAt) : ""}
                                        </span>
                                    </div>
                                </button>
                                {expandedChat === index && (
                                    <div className="mt-3 pt-3 border-t border-gray-800/50 fade-in space-y-2">
                                        <div>
                                            <p className="text-gray-500 text-xs mb-1">❓ Question</p>
                                            <p className="text-gray-200 text-sm">{chat.question}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 text-xs mb-1">🤖 KrishiGPT Answer</p>
                                            <p className="text-gray-300 text-sm whitespace-pre-wrap bg-darker/50 rounded-lg p-3">
                                                {chat.answer}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* ── TAB 4: Analytics ── */}
            {activeTab === "analytics" && (
                <div className="space-y-5 fade-in">
                    <h3 className="text-[var(--text-primary)] font-bold text-sm">📈 Analytics</h3>

                    {scans.length === 0 && chats.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-5xl mb-3">📊</div>
                            <p className="text-gray-400 text-sm">Use the app more to see analytics!</p>
                        </div>
                    ) : (
                        <>
                            {/* Disease Breakdown */}
                            {topDiseases.length > 0 && (
                                <div className="disease-card">
                                    <h4 className="text-[var(--text-primary)] font-bold text-sm mb-3">🦠 Disease Breakdown</h4>
                                    <div className="space-y-2.5">
                                        {topDiseases.map(([name, count]) => (
                                            <div key={name}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-gray-300 text-xs">{name}</span>
                                                    <span className="text-accent text-xs font-bold">{count}</span>
                                                </div>
                                                <div className="h-2 bg-darker rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-accent to-primary rounded-full transition-all duration-700"
                                                        style={{ width: `${(count / maxDiseaseCount) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Crop Activity */}
                            {topCrops.length > 0 && (
                                <div className="disease-card">
                                    <h4 className="text-[var(--text-primary)] font-bold text-sm mb-3">🌾 Crop Activity</h4>
                                    <div className="space-y-2.5">
                                        {topCrops.map(([name, count]) => (
                                            <div key={name}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-gray-300 text-xs">{name}</span>
                                                    <span className="text-blue-400 text-xs font-bold">{count}</span>
                                                </div>
                                                <div className="h-2 bg-darker rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-700"
                                                        style={{ width: `${(count / maxCropCount) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Language Usage */}
                            {Object.keys(langBreakdown).length > 0 && (
                                <div className="disease-card">
                                    <h4 className="text-[var(--text-primary)] font-bold text-sm mb-3">🌐 Language Usage</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(langBreakdown).map(([code, count]) => (
                                            <span
                                                key={code}
                                                className="bg-primary/40 text-accent text-xs px-3 py-1.5 rounded-full font-medium"
                                            >
                                                {LANG_NAMES[code] || code}: {count}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
