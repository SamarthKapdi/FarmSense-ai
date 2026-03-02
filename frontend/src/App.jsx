import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ActivityPage from "./pages/ActivityPage";
import ImageUploader from "./components/ImageUploader";
import ResultsDashboard from "./components/ResultsDashboard";
import KrishiGPTChat from "./components/KrishiGPTChat";
import HistoryPage from "./components/HistoryPage";

function AppContent() {
    const { user, token, isAuthenticated, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [page, setPage] = useState("landing");
    const [language, setLanguage] = useState("en");
    const [activeTab, setActiveTab] = useState("detect");
    const [currentResult, setCurrentResult] = useState(null);
    const [showResults, setShowResults] = useState(false);

    const handleNavigate = (target) => {
        setPage(target);
        if (target === "app") {
            setActiveTab("detect");
            setShowResults(false);
            setCurrentResult(null);
        }
    };

    const handleResult = (result) => {
        setCurrentResult(result);
        setShowResults(true);
    };

    const handleBackToUpload = () => {
        setShowResults(false);
        setCurrentResult(null);
    };

    const handleLogout = () => {
        logout();
        setPage("landing");
    };

    // ── Public pages (not authenticated) ──
    if (!isAuthenticated) {
        if (page === "login") return <LoginPage onNavigate={handleNavigate} />;
        if (page === "register") return <RegisterPage onNavigate={handleNavigate} />;
        return <LandingPage onNavigate={handleNavigate} />;
    }

    // ── Authenticated: Main App ──
    const tabs = [
        { id: "detect", icon: "🌿", label: "Detect" },
        { id: "chat", icon: "💬", label: "KrishiGPT" },
        { id: "activity", icon: "📊", label: "Activity" },
        { id: "history", icon: "📋", label: "History" },
    ];

    return (
        <div className="min-h-screen bg-dark pb-24">
            {/* Top Header */}
            <div className="bg-darker/80 backdrop-blur-md border-b border-gray-800/50 px-4 py-3 
                      flex items-center justify-between sticky top-0 z-40">
                <h1 className="text-sm font-bold">
                    <span className="mr-1">🌾</span>
                    <span className="gradient-text">FarmSense AI</span>
                </h1>
                <div className="flex items-center gap-3">
                    <button
                        onClick={toggleTheme}
                        className="text-gray-400 hover:text-accent transition-colors p-1"
                        title="Toggle Theme"
                    >
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </button>
                    <span className="text-gray-500 text-xs hidden sm:inline border-l border-gray-700 pl-3">
                        {user?.fullName}
                    </span>
                    <button
                        onClick={handleLogout}
                        className="text-gray-500 hover:text-red-400 text-xs font-medium transition-colors ml-1"
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* Page Content */}
            {activeTab === "detect" && !showResults && (
                <ImageUploader
                    language={language}
                    farmerId={user?.userId}
                    token={token}
                    onResult={handleResult}
                    onLanguageChange={setLanguage}
                />
            )}

            {activeTab === "detect" && showResults && currentResult && (
                <ResultsDashboard
                    result={currentResult}
                    language={language}
                    farmerId={user?.userId}
                    token={token}
                    onBack={handleBackToUpload}
                />
            )}

            {activeTab === "chat" && (
                <KrishiGPTChat
                    language={language}
                    farmerId={user?.userId}
                    token={token}
                    onLanguageChange={setLanguage}
                />
            )}

            {activeTab === "activity" && <ActivityPage />}

            {activeTab === "history" && (
                <HistoryPage farmerId={user?.userId} language={language} token={token} />
            )}

            {/* Bottom Navigation */}
            <nav className="tab-bar">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            setActiveTab(tab.id);
                            if (tab.id === "detect") {
                                setShowResults(false);
                                setCurrentResult(null);
                            }
                        }}
                        className={`tab-item ${activeTab === tab.id ? "tab-item-active" : ""}`}
                    >
                        <span className="tab-icon">{tab.icon}</span>
                        <span>{tab.label}</span>
                    </button>
                ))}
            </nav>
        </div>
    );
}

export default function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </ThemeProvider>
    );
}
