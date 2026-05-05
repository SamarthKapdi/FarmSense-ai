import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import { ToastProvider, useToast } from "./components/Toast";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ActivityPage from "./pages/ActivityPage";
import ProfilePage from "./pages/ProfilePage";
import ImageUploader from "./components/ImageUploader";
import ResultsDashboard from "./components/ResultsDashboard";
import BatchResultsDashboard from "./components/BatchResultsDashboard";
import KrishiGPTChat from "./components/KrishiGPTChat";
import HistoryPage from "./components/HistoryPage";
import WeatherWidget from "./components/WeatherWidget";
import CropCalendar from "./components/CropCalendar";
import MarketPrices from "./components/MarketPrices";
import AnalyticsCharts from "./components/AnalyticsCharts";
import OutbreakBanner from "./components/OutbreakBanner";
import ErrorBoundary from "./components/ErrorBoundary";
import useOnlineStatus from "./hooks/useOnlineStatus";
import { checkHealth } from "./services/api";

function AppContent() {
    const { user, token, isAuthenticated, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const toast = useToast();
    const [page, setPage] = useState("landing");
    const { language, setLanguage, t } = useLanguage();
    const [activeTab, setActiveTab] = useState("detect");
    const [currentResult, setCurrentResult] = useState(null);
    const [showResults, setShowResults] = useState(false);
    const [backendOnline, setBackendOnline] = useState(true);
    const isOnline = useOnlineStatus();

    // Health check on mount
    useEffect(() => {
        checkHealth().then(ok => {
            setBackendOnline(ok);
            if (!ok) toast.warning("Backend server is offline. Some features may not work.");
        });
    }, []);

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
        if (result.isHealthy) {
            toast.success("Great news! Your crop looks healthy 🌿");
        } else {
            toast.warning(`Disease detected: ${result.diseaseName}`);
        }
    };

    const handleBackToUpload = () => {
        setShowResults(false);
        setCurrentResult(null);
    };

    const handleLogout = () => {
        logout();
        setPage("landing");
        toast.info("Logged out successfully");
    };

    // ── Public pages (not authenticated) ──
    if (!isAuthenticated) {
        if (page === "login") return <LoginPage onNavigate={handleNavigate} />;
        if (page === "register") return <RegisterPage onNavigate={handleNavigate} />;
        if (page === "forgot-password") return <ForgotPasswordPage onNavigate={handleNavigate} />;
        if (page === "reset-password") return <ResetPasswordPage onNavigate={handleNavigate} />;
        return <LandingPage onNavigate={handleNavigate} />;
    }

    // ── Authenticated: Main App ──
    const tabs = [
        { id: "detect", icon: "🌿", label: t("nav.detect") },
        { id: "chat", icon: "💬", label: t("nav.chat") },
        { id: "weather", icon: "🌦️", label: t("nav.weather") },
        { id: "calendar", icon: "📅", label: t("nav.calendar") },
        { id: "market", icon: "🏪", label: t("nav.market") },
        { id: "activity", icon: "📊", label: t("nav.activity") },
        { id: "analytics", icon: "📈", label: t("nav.analytics") },
        { id: "history", icon: "📋", label: t("nav.history") },
        { id: "profile", icon: "👤", label: t("nav.profile") },
    ];

    return (
        <div className="min-h-screen bg-dark pb-24">
            {/* Backend offline banner */}
            {!backendOnline && (
                <div style={{
                    background: 'rgba(239,68,68,0.1)', borderBottom: '1px solid rgba(239,68,68,0.3)',
                    padding: '8px 16px', textAlign: 'center', fontSize: '13px', color: '#fca5a5',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}>
                    <span>⚠️</span>
                    AI services are currently offline. Detection and chat may not work.
                    <button onClick={() => checkHealth().then(ok => { setBackendOnline(ok); if (ok) toast.success("Backend is back online!"); })}
                        style={{
                            background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)',
                            color: '#fca5a5', padding: '2px 10px', borderRadius: '6px',
                            fontSize: '11px', cursor: 'pointer', marginLeft: '8px',
                        }}>Retry</button>
                </div>
            )}

            {/* Offline banner */}
            {!isOnline && (
                <div style={{
                    background: 'rgba(245,158,11,0.1)', borderBottom: '1px solid rgba(245,158,11,0.3)',
                    padding: '8px 16px', textAlign: 'center', fontSize: '13px', color: '#fbbf24',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}>
                    <span>📡</span>
                    You are offline. Some features may not work.
                </div>
            )}

            {/* Outbreak Alerts */}
            <OutbreakBanner />

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
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="bg-transparent text-xs text-gray-400 focus:outline-none focus:text-accent cursor-pointer"
                    >
                        <option value="en">EN</option>
                        <option value="hi">HI</option>
                        <option value="mr">MR</option>
                        <option value="ta">TA</option>
                        <option value="te">TE</option>
                    </select>
                    <span className="text-gray-500 text-xs hidden sm:inline border-l border-gray-700 pl-3">
                        {user?.fullName}
                    </span>
                    <button
                        onClick={handleLogout}
                        className="text-gray-500 hover:text-red-400 text-xs font-medium transition-colors ml-1"
                    >
                        {t("auth.logout")}
                    </button>
                </div>
            </div>

            {/* Page Content */}
            {activeTab === "detect" && !showResults && (
                <ErrorBoundary name="Disease Detection">
                    <ImageUploader
                        language={language}
                        farmerId={user?.userId}
                        token={token}
                        onResult={handleResult}
                        onLanguageChange={setLanguage}
                    />
                </ErrorBoundary>
            )}

            {activeTab === "detect" && showResults && currentResult && (
                <ErrorBoundary name="Results Dashboard">
                    {Array.isArray(currentResult) ? (
                        <BatchResultsDashboard
                            results={currentResult}
                            language={language}
                            farmerId={user?.userId}
                            token={token}
                            onBack={handleBackToUpload}
                        />
                    ) : (
                        <ResultsDashboard
                            result={currentResult}
                            language={language}
                            farmerId={user?.userId}
                            token={token}
                            onBack={handleBackToUpload}
                        />
                    )}
                </ErrorBoundary>
            )}

            {activeTab === "chat" && (
                <ErrorBoundary name="KrishiGPT Chat">
                    <KrishiGPTChat
                        language={language}
                        farmerId={user?.userId}
                        token={token}
                        onLanguageChange={setLanguage}
                    />
                </ErrorBoundary>
            )}

            {activeTab === "weather" && (
                <ErrorBoundary name="Weather">
                    <div style={{ padding: '16px', maxWidth: '600px', margin: '0 auto' }}>
                        <WeatherWidget />
                    </div>
                </ErrorBoundary>
            )}

            {activeTab === "calendar" && <ErrorBoundary name="Crop Calendar"><CropCalendar /></ErrorBoundary>}

            {activeTab === "market" && <ErrorBoundary name="Market Prices"><MarketPrices /></ErrorBoundary>}

            {activeTab === "activity" && <ErrorBoundary name="Activity"><ActivityPage /></ErrorBoundary>}

            {activeTab === "analytics" && <ErrorBoundary name="Analytics"><AnalyticsCharts /></ErrorBoundary>}

            {activeTab === "history" && (
                <ErrorBoundary name="Scan History">
                    <HistoryPage farmerId={user?.userId} language={language} token={token} />
                </ErrorBoundary>
            )}

            {activeTab === "profile" && (
                <ErrorBoundary name="Profile">
                    <ProfilePage token={token} />
                </ErrorBoundary>
            )}

            {/* Bottom Navigation — Scrollable */}
            <nav className="tab-bar overflow-x-auto no-scrollbar">
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
                        className={`tab-item flex-shrink-0 ${activeTab === tab.id ? "tab-item-active" : ""}`}
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
            <LanguageProvider>
                <ToastProvider>
                    <AuthProvider>
                        <AppContent />
                    </AuthProvider>
                </ToastProvider>
            </LanguageProvider>
        </ThemeProvider>
    );
}
