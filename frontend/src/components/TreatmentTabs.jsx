import React, { useState } from "react";
import { generatePlan } from "../services/api";

const TABS = [
    { id: "organic", icon: "🌿", label: "Organic" },
    { id: "chemical", icon: "💊", label: "Chemical" },
    { id: "preventive", icon: "🛡️", label: "Preventive" },
];

export default function TreatmentTabs({ result, language, farmerId, token }) {
    const [activeTab, setActiveTab] = useState("organic");
    const [planLoading, setPlanLoading] = useState(false);
    const [treatmentPlan, setTreatmentPlan] = useState(null);
    const [showPlan, setShowPlan] = useState(false);
    const [expandedDay, setExpandedDay] = useState(null);

    const getListForTab = () => {
        switch (activeTab) {
            case "organic":
                return result.organicTreatment || [];
            case "chemical":
                return result.chemicalTreatment || [];
            case "preventive":
                return result.preventiveMeasures || [];
            default:
                return [];
        }
    };

    const handleGeneratePlan = async () => {
        setPlanLoading(true);
        try {
            const response = await generatePlan(result, language, token);
            setTreatmentPlan(response.plan || response);
            setShowPlan(true);
        } catch (err) {
            setTreatmentPlan(
                "Day 1: Inspect all plants and remove severely infected parts\n" +
                "Day 2: Apply neem oil 5ml per litre on all affected plants\n" +
                "Day 3: Improve drainage and air circulation in field\n" +
                "Day 4: Apply recommended fungicide as per dosage\n" +
                "Day 5: Monitor plants for improvement or spread\n" +
                "Day 6: Repeat neem oil spray on remaining infections\n" +
                "Day 7: Evaluate results and plan next spray schedule"
            );
            setShowPlan(true);
        } finally {
            setPlanLoading(false);
        }
    };

    const parsePlanDays = (planText) => {
        if (!planText) return [];
        const text = typeof planText === "string" ? planText : JSON.stringify(planText);
        const lines = text.split("\n").filter((line) => line.trim().length > 0);
        return lines.map((line) => {
            const match = line.match(/Day\s*(\d+)\s*[:.\-]\s*(.*)/i);
            if (match) {
                return { day: parseInt(match[1]), action: match[2].trim() };
            }
            return { day: 0, action: line.trim() };
        }).filter((item) => item.action.length > 0);
    };

    const items = getListForTab();
    const planDays = parsePlanDays(treatmentPlan);

    return (
        <div className="mt-2">
            {/* Tab Buttons */}
            <div className="flex gap-2 mb-4 bg-darker/50 rounded-xl p-1.5">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
              flex-1 py-2.5 rounded-lg text-sm font-semibold
              transition-all duration-300 flex items-center 
              justify-center gap-1.5
              ${activeTab === tab.id
                                ? "bg-gradient-to-r from-accent to-primary text-dark"
                                : "text-gray-400 hover:text-[var(--text-primary)]"
                            }
            `}
                    >
                        <span>{tab.icon}</span>
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Treatment List */}
            <div className="disease-card">
                {items.length > 0 ? (
                    <div className="space-y-0">
                        {items.map((item, index) => (
                            <div
                                key={index}
                                className="flex items-start gap-3 py-3 
                           border-b border-gray-800/50 last:border-b-0"
                            >
                                <div className="flex-shrink-0 w-7 h-7 bg-accent text-dark 
                              rounded-full flex items-center justify-center
                              font-bold text-xs mt-0.5">
                                    {index + 1}
                                </div>
                                <p className="text-gray-200 text-sm leading-relaxed">
                                    {item}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-center py-4">
                        No treatments available
                    </p>
                )}

                {/* Best Time to Treat */}
                {result.bestTimeToTreat && (
                    <div className="mt-4 pt-3 border-t border-gray-800/50">
                        <p className="text-xs text-gray-500 mb-1">🕐 Best time to treat</p>
                        <p className="text-accent text-sm font-medium">
                            {result.bestTimeToTreat}
                        </p>
                    </div>
                )}
            </div>

            {/* Generate Plan Button */}
            {!result.isHealthy && (
                <button
                    onClick={handleGeneratePlan}
                    disabled={planLoading}
                    className={`
            w-full mt-4 py-3.5 rounded-xl font-bold text-sm
            border transition-all duration-300
            ${planLoading
                            ? "bg-darker border-gray-700 text-gray-500 cursor-wait"
                            : "bg-primary/20 border-accent/40 text-accent hover:bg-primary/30 hover:border-accent active:scale-[0.98]"
                        }
          `}
                >
                    {planLoading ? (
                        <div className="flex items-center justify-center gap-2">
                            <div className="loading-spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></div>
                            <span>KrishiGPT is creating your plan...</span>
                        </div>
                    ) : (
                        "🤖 Generate 7-Day Treatment Plan"
                    )}
                </button>
            )}

            {/* Treatment Plan Display */}
            {showPlan && planDays.length > 0 && (
                <div className="mt-4 bg-darker/80 border border-green-900/40 
                        rounded-2xl p-4 fade-in">
                    <h4 className="text-[var(--text-primary)] font-bold mb-3 flex items-center gap-2">
                        <span>📋</span> 7-Day Treatment Plan
                    </h4>
                    <div className="space-y-2">
                        {planDays.map((item, index) => (
                            <div key={index}>
                                <button
                                    onClick={() =>
                                        setExpandedDay(expandedDay === index ? null : index)
                                    }
                                    className="w-full bg-primary/30 hover:bg-primary/40 
                             rounded-lg px-3 py-2.5 flex items-center 
                             justify-between transition-colors"
                                >
                                    <span className="text-accent font-semibold text-sm">
                                        {item.day > 0 ? `Day ${item.day}` : `Step ${index + 1}`}
                                    </span>
                                    <span className="text-gray-400 text-xs">
                                        {expandedDay === index ? "▲" : "▼"}
                                    </span>
                                </button>
                                {expandedDay === index && (
                                    <div className="px-3 py-2 text-gray-300 text-sm 
                                bg-darker/50 rounded-b-lg border-x 
                                border-b border-green-900/20 fade-in">
                                        {item.action}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
