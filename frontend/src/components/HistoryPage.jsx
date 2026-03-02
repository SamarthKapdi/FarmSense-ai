import React, { useState, useEffect } from "react";
import { getHistory } from "../services/api";

export default function HistoryPage({ farmerId, language, token }) {
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => {
        const fetchHistory = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await getHistory(token);
                setHistory(data || []);
            } catch (err) {
                setError("Failed to load scan history");
            } finally {
                setIsLoading(false);
            }
        };
        fetchHistory();
    }, [farmerId]);

    const getSeverityBorder = (severity) => {
        if (!severity) return "border-l-gray-600";
        const lower = severity.toLowerCase();
        if (lower.includes("severe")) return "border-l-red-500";
        if (lower.includes("moderate")) return "border-l-yellow-500";
        return "border-l-green-500";
    };

    const getSeverityClass = (severity) => {
        if (!severity) return "severity-mild";
        const lower = severity.toLowerCase();
        if (lower.includes("severe")) return "severity-severe";
        if (lower.includes("moderate")) return "severity-moderate";
        return "severity-mild";
    };

    const formatDate = (dateStr) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return "Unknown date";
        }
    };

    const parseJsonList = (jsonStr) => {
        if (!jsonStr) return [];
        try {
            const parsed = JSON.parse(jsonStr);
            return Array.isArray(parsed) ? parsed : [jsonStr];
        } catch {
            return [jsonStr];
        }
    };

    return (
        <div className="px-4 pt-6 pb-4 max-w-lg mx-auto fade-in">
            {/* Header */}
            <h2 className="text-xl font-bold mb-5">
                <span className="mr-2">📋</span>
                <span className="gradient-text">Scan History</span>
            </h2>

            {/* Loading Skeletons */}
            {isLoading && (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="skeleton h-24 rounded-2xl"></div>
                    ))}
                </div>
            )}

            {/* Error */}
            {error && !isLoading && (
                <div className="bg-red-950/50 border border-red-800/50 
                        rounded-xl p-4 text-center">
                    <span className="text-red-400">⚠️ {error}</span>
                </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && history.length === 0 && (
                <div className="flex flex-col items-center justify-center 
                        py-20 text-center">
                    <div className="text-6xl mb-4 leaf-pulse">🌾</div>
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                        No scans yet!
                    </h3>
                    <p className="text-gray-400 text-sm max-w-xs">
                        Upload your first crop photo to get started with AI-powered disease detection
                    </p>
                </div>
            )}

            {/* History Cards */}
            {!isLoading && history.length > 0 && (
                <div className="space-y-3">
                    {history.map((report) => (
                        <div
                            key={report.id}
                            className={`
                bg-darker/80 border border-gray-800/50 rounded-2xl 
                p-4 border-l-4 transition-all duration-300
                ${getSeverityBorder(report.severity)}
                ${expandedId === report.id ? "border-gray-700" : ""}
              `}
                        >
                            {/* Summary Row */}
                            <button
                                onClick={() =>
                                    setExpandedId(expandedId === report.id ? null : report.id)
                                }
                                className="w-full text-left"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                        <h4 className="text-[var(--text-primary)] font-bold text-sm">
                                            {report.diseaseName || "Unknown"}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            {report.cropName && (
                                                <span className="bg-primary/40 text-accent 
                                       text-xs px-2 py-0.5 rounded-full">
                                                    🌱 {report.cropName}
                                                </span>
                                            )}
                                            <span className="text-gray-500 text-xs">
                                                {formatDate(report.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={getSeverityClass(report.severity)}>
                                            {report.severity}
                                        </span>
                                        <span className="text-gray-500 text-xs">
                                            {expandedId === report.id ? "▲" : "▼"}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-accent text-xs font-semibold">
                                        {report.confidence}% confidence
                                    </span>
                                    {report.urgencyLevel && (
                                        <span className={`text-xs ${report.urgencyLevel === "IMMEDIATE"
                                            ? "text-red-400"
                                            : report.urgencyLevel === "WITHIN_WEEK"
                                                ? "text-yellow-400"
                                                : "text-green-400"
                                            }`}>
                                            ● {report.urgencyLevel}
                                        </span>
                                    )}
                                </div>
                            </button>

                            {/* Expanded Content */}
                            {expandedId === report.id && (
                                <div className="mt-3 pt-3 border-t border-gray-800/50 
                              fade-in space-y-3">
                                    {/* Yield Loss */}
                                    {report.yieldLossEstimate && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-500 text-xs">Yield Loss</span>
                                            <span className="text-red-400 text-sm font-semibold">
                                                {report.yieldLossEstimate}
                                            </span>
                                        </div>
                                    )}

                                    {/* Recovery Cost */}
                                    {report.estimatedRecoveryCost && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-500 text-xs">Recovery Cost</span>
                                            <span className="text-yellow-400 text-sm font-semibold">
                                                {report.estimatedRecoveryCost}
                                            </span>
                                        </div>
                                    )}

                                    {/* Organic Treatment Preview */}
                                    {report.organicTreatment && (
                                        <div>
                                            <p className="text-gray-500 text-xs mb-1">
                                                🌿 Top Organic Treatment
                                            </p>
                                            <p className="text-gray-300 text-sm">
                                                {parseJsonList(report.organicTreatment)[0] || "N/A"}
                                            </p>
                                        </div>
                                    )}

                                    {/* Best Time */}
                                    {report.bestTimeToTreat && (
                                        <div>
                                            <p className="text-gray-500 text-xs mb-1">
                                                🕐 Best Time to Treat
                                            </p>
                                            <p className="text-accent text-sm">
                                                {report.bestTimeToTreat}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
