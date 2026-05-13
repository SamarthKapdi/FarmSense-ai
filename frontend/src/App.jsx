import { useState, useEffect, useCallback } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import { LanguageProvider, useLanguage } from './context/LanguageContext'
import { ToastProvider, useToast } from './components/Toast'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import ActivityPage from './pages/ActivityPage'
import ProfilePage from './pages/ProfilePage'
import AdminDashboard from './pages/AdminDashboard'
import AgronomistPortal from './pages/AgronomistPortal'
import ImageUploader from './components/ImageUploader'
import ResultsDashboard from './components/ResultsDashboard'
import BatchResultsDashboard from './components/BatchResultsDashboard'
import KrishiGPTChat from './components/KrishiGPTChat'
import HistoryPage from './components/HistoryPage'
import WeatherWidget from './components/WeatherWidget'
import CropCalendar from './components/CropCalendar'
import MarketPrices from './components/MarketPrices'
import AnalyticsCharts from './components/AnalyticsCharts'
import OutbreakBanner from './components/OutbreakBanner'
import ErrorBoundary from './components/ErrorBoundary'
import useOnlineStatus from './hooks/useOnlineStatus'
import { checkHealth } from './services/api'
import {
  getUnreadNotifications,
  markAllNotificationsRead,
} from './services/notificationApi'
import { LANGUAGES } from './i18n'
import { API_BASE_URL } from './services/baseUrl'

function AppContent() {
  const { user, token, isAuthenticated, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const toast = useToast()
  const [page, setPage] = useState('landing')
  const { language, setLanguage, t } = useLanguage()
  const [activeTab, setActiveTab] = useState(
    user?.role === 'ROLE_ADMIN' ? 'admin' : 'detect'
  )
  const [currentResult, setCurrentResult] = useState(null)
  const [showResults, setShowResults] = useState(false)
  const [backendOnline, setBackendOnline] = useState(true)
  const [showMore, setShowMore] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const isOnline = useOnlineStatus()

  useEffect(() => {
    if (user?.role === 'ROLE_ADMIN' && activeTab !== 'admin') {
      setActiveTab('admin')
    }
  }, [user])

  useEffect(() => {
    checkHealth().then((ok) => {
      setBackendOnline(ok)
      if (!ok)
        toast.warning('Backend server is offline. Some features may not work.')
    })
  }, [])

  const fetchNotifications = useCallback(async () => {
    if (!token) return
    try {
      const data = await getUnreadNotifications(token)
      setUnreadCount(data.count || 0)
      setNotifications(data.notifications || [])
    } catch {
      /* ignore */
    }
  }, [token])

  // Connect to SSE for live updates with reconnect
  useEffect(() => {
    fetchNotifications()

    if (!token) return

    let retryDelay = 5000
    let eventSource = null
    let retryTimeout = null

    const connect = () => {
      const baseUrl = API_BASE_URL
      const streamUrl =
        user?.role === 'ROLE_ADMIN'
          ? `${baseUrl}/sse/broadcast`
          : `${baseUrl}/sse/stream`

      eventSource = new EventSource(`${streamUrl}?token=${token}`)

      eventSource.addEventListener('notification', (e) => {
        try {
          const newNotif = JSON.parse(e.data)
          setNotifications((prev) => [newNotif, ...prev])
          setUnreadCount((prev) => prev + 1)
          toast.info(`New Notification: ${newNotif.title}`)
        } catch { /* ignore malformed data */ }
      })

      eventSource.addEventListener('activity', (e) => {
        try {
          const activity = JSON.parse(e.data)
          if (activity.event === 'REPORT_VERIFIED') {
            toast.success(`Report Verified: ${activity.disease}`)
          }
        } catch { /* ignore */ }
      })

      eventSource.onopen = () => {
        retryDelay = 5000 // Reset on successful connection
      }

      eventSource.onerror = () => {
        eventSource.close()
        retryTimeout = setTimeout(() => {
          retryDelay = Math.min(retryDelay * 2, 30000) // Backoff, cap at 30s
          connect()
        }, retryDelay)
      }
    }

    connect()

    return () => {
      if (eventSource) eventSource.close()
      if (retryTimeout) clearTimeout(retryTimeout)
    }
  }, [token, user?.role, fetchNotifications, toast])

  const handleMarkAllRead = async () => {
    if (!token) return
    await markAllNotificationsRead(token)
    setUnreadCount(0)
    setNotifications([])
    setShowNotifications(false)
  }

  const handleNavigate = (target) => {
    setPage(target)
    if (target === 'app') {
      setActiveTab(user?.role === 'ROLE_ADMIN' ? 'admin' : 'detect')
      setShowResults(false)
      setCurrentResult(null)
    }
  }

  const handleResult = (result) => {
    setCurrentResult(result)
    setShowResults(true)
    if (result.isHealthy) {
      toast.success('Great news! Your crop looks healthy 🌿')
    } else {
      toast.warning(`Disease detected: ${result.diseaseName}`)
    }
  }

  const handleBackToUpload = () => {
    setShowResults(false)
    setCurrentResult(null)
  }

  const handleLogout = () => {
    logout()
    setPage('landing')
    toast.info('Logged out successfully')
  }

  // ── Public pages (not authenticated) ──
  if (!isAuthenticated) {
    if (page === 'login') return <LoginPage onNavigate={handleNavigate} />
    if (page === 'register') return <RegisterPage onNavigate={handleNavigate} />
    if (page === 'forgot-password')
      return <ForgotPasswordPage onNavigate={handleNavigate} />
    if (page === 'reset-password')
      return <ResetPasswordPage onNavigate={handleNavigate} />
    return <LandingPage onNavigate={handleNavigate} />
  }

  // ── Role-specific portals ──
  if (user?.role === 'ROLE_ADMIN') {
    return <AdminDashboard onNavigate={handleLogout} />
  }
  if (user?.role === 'ROLE_AGRONOMIST') {
    return <AgronomistPortal onNavigate={handleNavigate} />
  }

  // ── Bottom nav tabs (5 primary + more menu) ──
  const primaryTabs = [
    { id: 'detect', icon: '🌿', label: t('nav.scan') },
    { id: 'chat', icon: '💬', label: t('nav.chat') },
    { id: 'weather', icon: '🌦️', label: t('nav.weather') },
    { id: 'market', icon: '📊', label: t('nav.market') },
    { id: 'more', icon: '⋯', label: t('common.more') || 'More' },
  ]

  const moreTabs = [
    { id: 'calendar', icon: '📅', label: t('nav.calendar') },
    { id: 'activity', icon: '📋', label: t('nav.activity') },
    { id: 'analytics', icon: '📈', label: t('activity.analytics') },
    { id: 'history', icon: '🕐', label: t('nav.history') || 'History' },
    { id: 'profile', icon: '👤', label: t('nav.profile') },
  ]

  const handleTabClick = (tabId) => {
    if (tabId === 'more') {
      setShowMore(!showMore)
      return
    }
    setActiveTab(tabId)
    setShowMore(false)
    if (tabId === 'detect') {
      setShowResults(false)
      setCurrentResult(null)
    }
  }

  const timeAgo = (dateStr) => {
    if (!dateStr) return ''
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] pb-20 transition-colors duration-300">
      {/* ── Status Banners ── */}
      {!backendOnline && (
        <div className="bg-[var(--danger-bg)] border-b border-[var(--danger)]/20 px-5 py-2.5 text-center text-[13px] text-[var(--danger)] flex items-center justify-center gap-2.5">
          <span>⚠️</span>
          AI services are currently offline.
          <button
            onClick={() =>
              checkHealth().then((ok) => {
                setBackendOnline(ok)
                if (ok) toast.success('Backend is back online!')
              })
            }
            className="bg-[var(--danger-bg)] border border-[var(--danger)]/20 text-[var(--danger)] px-3 py-1 rounded-lg text-xs cursor-pointer font-semibold hover:bg-[var(--danger)]/20 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {!isOnline && (
        <div className="bg-[var(--warning-bg)] border-b border-[var(--warning)]/20 px-5 py-2.5 text-center text-[13px] text-[var(--warning)] flex items-center justify-center gap-2.5">
          <span>📡</span> You are offline. Some features may not work.
        </div>
      )}

      <OutbreakBanner />

      {/* ── Top Header ── */}
      <header className="sticky top-0 z-40 bg-[var(--glass-bg)] backdrop-blur-2xl border-b border-[var(--border)] px-4 py-3 transition-all duration-300">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="text-xl">🌾</span>
            <span className="gradient-text text-base font-extrabold tracking-tight">
              FarmSense AI
            </span>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative bg-[var(--accent-muted)] border border-[var(--border)] rounded-lg p-1.5 text-base cursor-pointer transition-all hover:border-[var(--border-focus)]"
                title="Notifications"
              >
                🔔
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-lg overflow-hidden z-50">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">
                      {t('notifications.title')}
                    </h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-emerald-500 hover:text-emerald-400 font-medium"
                      >
                        {t('notifications.mark_read')}
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <div className="text-3xl mb-2">🔕</div>
                        <p className="text-[var(--text-muted)] text-sm">
                          {t('notifications.no_notifications')}
                        </p>
                      </div>
                    ) : (
                      notifications.slice(0, 8).map((n) => (
                        <div
                          key={n.id}
                          className="px-4 py-3 border-b border-[var(--border)] hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-base flex-shrink-0">
                              {n.type === 'DISEASE_ALERT'
                                ? '🦠'
                                : n.type === 'WEATHER_ALERT'
                                  ? '⛈️'
                                  : n.type === 'ADVISORY'
                                    ? '📢'
                                    : n.type === 'VERIFICATION'
                                      ? '✅'
                                      : '🔔'}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-[var(--text-primary)] text-xs font-medium truncate">
                                {n.title}
                              </p>
                              {n.message && (
                                <p className="text-[var(--text-muted)] text-xs mt-0.5 truncate">
                                  {n.message}
                                </p>
                              )}
                              <p className="text-[var(--text-muted)] text-[10px] mt-1">
                                {timeAgo(n.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              title="Toggle Theme"
              className="bg-[var(--accent-muted)] border border-[var(--border)] rounded-lg p-1.5 text-base cursor-pointer transition-all hover:border-[var(--border-focus)] flex items-center"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            {/* Language */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-2 py-1.5 text-[var(--text-secondary)] text-xs font-semibold cursor-pointer outline-none focus:border-[var(--border-focus)] transition-colors"
            >
              {LANGUAGES.map((l) => (
                <option
                  key={l.code}
                  value={l.code}
                  className="bg-[var(--bg-card)]"
                >
                  {l.code.toUpperCase()}
                </option>
              ))}
            </select>

            {/* User + Logout */}
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-[var(--border)]">
              <span className="text-[var(--text-muted)] text-xs font-medium truncate max-w-[100px]">
                {user?.fullName}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="bg-transparent border border-[var(--border)] rounded-lg px-3 py-1.5 text-[var(--text-muted)] text-xs font-semibold cursor-pointer transition-all hover:border-red-500 hover:text-red-500"
            >
              {t('nav.logout')}
            </button>
          </div>
        </div>
      </header>

      {/* Click-away for dropdowns */}
      {(showNotifications || showMore) && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => {
            setShowNotifications(false)
            setShowMore(false)
          }}
        />
      )}

      {/* ── Page Content ── */}
      <main>
        {activeTab === 'detect' && !showResults && (
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

        {activeTab === 'detect' && showResults && currentResult && (
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

        {activeTab === 'chat' && (
          <ErrorBoundary name="KrishiGPT Chat">
            <KrishiGPTChat
              language={language}
              farmerId={user?.userId}
              token={token}
              onLanguageChange={setLanguage}
            />
          </ErrorBoundary>
        )}

        {activeTab === 'weather' && (
          <ErrorBoundary name="Weather">
            <WeatherWidget />
          </ErrorBoundary>
        )}
        {activeTab === 'calendar' && (
          <ErrorBoundary name="Crop Calendar">
            <CropCalendar />
          </ErrorBoundary>
        )}
        {activeTab === 'market' && (
          <ErrorBoundary name="Market Prices">
            <MarketPrices />
          </ErrorBoundary>
        )}
        {activeTab === 'activity' && (
          <ErrorBoundary name="Activity">
            <ActivityPage />
          </ErrorBoundary>
        )}
        {activeTab === 'analytics' && (
          <ErrorBoundary name="Analytics">
            <AnalyticsCharts />
          </ErrorBoundary>
        )}
        {activeTab === 'history' && (
          <ErrorBoundary name="Scan History">
            <HistoryPage
              farmerId={user?.userId}
              language={language}
              token={token}
            />
          </ErrorBoundary>
        )}
        {activeTab === 'profile' && (
          <ErrorBoundary name="Profile">
            <ProfilePage token={token} />
          </ErrorBoundary>
        )}
      </main>

      {/* ── More Menu Overlay ── */}
      {showMore && (
        <div className="fixed bottom-20 left-4 right-4 z-40 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-lg p-3 grid grid-cols-5 gap-2 animate-in fade-in slide-in-from-bottom-2">
          {moreTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-[10px] font-medium transition-all
                                ${
                                  activeTab === tab.id
                                    ? 'bg-emerald-500/10 text-emerald-500'
                                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)]'
                                }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Bottom Navigation (5 tabs) ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-card)] border-t border-[var(--border)] shadow-lg">
        <div className="flex justify-around items-stretch max-w-lg mx-auto">
          {primaryTabs.map((tab) => {
            const isActive =
              tab.id === 'more'
                ? moreTabs.some((m) => m.id === activeTab)
                : activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-semibold transition-all relative
                                    ${
                                      isActive
                                        ? 'text-emerald-500'
                                        : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                                    }`}
              >
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-emerald-500 rounded-full" />
                )}
                <span
                  className={`text-lg transition-transform ${isActive ? 'scale-110' : ''}`}
                >
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
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
  )
}
