import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'

import { apiUrl } from '../services/baseUrl'

const CROPS = [
  'Tomato',
  'Rice',
  'Wheat',
  'Corn',
  'Potato',
  'Cotton',
  'Sugarcane',
  'Soybean',
  'Onion',
  'Other',
]
const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिन्दी (Hindi)' },
  { code: 'mr', name: 'मराठी (Marathi)' },
  { code: 'ta', name: 'தமிழ் (Tamil)' },
  { code: 'te', name: 'తెలుగు (Telugu)' },
  { code: 'kn', name: 'ಕನ್ನಡ (Kannada)' },
]

export default function ProfilePage({ token }) {
  const { user } = useAuth()
  const toast = useToast()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fullName, setFullName] = useState('')
  const [preferredCrop, setPreferredCrop] = useState('Tomato')
  const [preferredLanguage, setPreferredLanguage] = useState('en')

  // Change password
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPw, setChangingPw] = useState(false)
  const [pwError, setPwError] = useState(null)

  // Stats
  const [stats, setStats] = useState(null)

  // PWA Install
  const [deferredPrompt, setDeferredPrompt] = useState(null)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () =>
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      )
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setDeferredPrompt(null)
    }
  }

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch(apiUrl('/user/profile'), {
          headers: { Authorization: `Bearer ${token}` },
        })
        const json = await res.json()
        const data = json.data || json
        setProfile(data)
        setFullName(data.fullName || '')
        setPreferredCrop(data.preferredCrop || 'Tomato')
        setPreferredLanguage(data.preferredLanguage || 'en')
      } catch {
        /* ignore */
      }

      try {
        const res = await fetch(apiUrl('/user/stats'), {
          headers: { Authorization: `Bearer ${token}` },
        })
        const json = await res.json()
        setStats(json.data || json)
      } catch {
        /* ignore */
      }
      setLoading(false)
    }
    loadProfile()
  }, [token])

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const res = await fetch(apiUrl('/user/profile'), {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fullName, preferredCrop, preferredLanguage }),
      })
      if (res.ok) {
        toast.success('Profile updated! ✅')
      } else {
        toast.error('Failed to update profile')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    setPwError(null)
    if (newPassword.length < 8) {
      setPwError('Min 8 characters')
      return
    }
    if (!/[A-Z]/.test(newPassword)) {
      setPwError('Must contain 1 uppercase')
      return
    }
    if (!/[0-9]/.test(newPassword)) {
      setPwError('Must contain 1 number')
      return
    }
    if (newPassword !== confirmPassword) {
      setPwError("Passwords don't match")
      return
    }

    setChangingPw(true)
    try {
      const res = await fetch(apiUrl('/user/change-password'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const json = await res.json()
      if (res.ok) {
        toast.success('Password changed! 🔒')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setPwError(json.message || 'Failed')
      }
    } catch {
      setPwError('Network error')
    } finally {
      setChangingPw(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 max-w-lg mx-auto">
        <div className="disease-card" style={{ padding: '20px' }}>
          <div className="skeleton" style={{ height: '200px' }} />
        </div>
      </div>
    )
  }

  const inputClass =
    'w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors text-sm'
  const labelClass = 'block text-gray-400 text-xs mb-1.5 font-medium'

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 fade-in">
      {/* Profile Header */}
      <div
        className="disease-card"
        style={{ padding: '20px', textAlign: 'center' }}
      >
        <div className="text-4xl mb-2">👤</div>
        <h2 className="text-lg font-bold text-[var(--text-primary)]">
          {profile?.fullName}
        </h2>
        <p className="text-gray-500 text-xs">{profile?.email}</p>
        <p className="text-gray-600 text-xs mt-1">
          Member since{' '}
          {profile?.memberSince
            ? new Date(profile.memberSince).toLocaleDateString()
            : '—'}
        </p>
        {stats && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              marginTop: '16px',
            }}
          >
            <div
              style={{
                background: 'rgba(82,183,136,0.05)',
                borderRadius: '10px',
                padding: '10px',
              }}
            >
              <div
                style={{
                  color: 'var(--accent)',
                  fontSize: '18px',
                  fontWeight: 800,
                }}
              >
                {stats.totalScans || 0}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>
                Scans
              </div>
            </div>
            <div
              style={{
                background: 'rgba(82,183,136,0.05)',
                borderRadius: '10px',
                padding: '10px',
              }}
            >
              <div
                style={{
                  color: 'var(--accent)',
                  fontSize: '18px',
                  fontWeight: 800,
                }}
              >
                {stats.totalChats || 0}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>
                Chats
              </div>
            </div>
            <div
              style={{
                background: 'rgba(82,183,136,0.05)',
                borderRadius: '10px',
                padding: '10px',
              }}
            >
              <div
                style={{
                  color: 'var(--accent)',
                  fontSize: '18px',
                  fontWeight: 800,
                }}
              >
                {stats.diseasesDetected || 0}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>
                Diseases
              </div>
            </div>
          </div>
        )}
        {deferredPrompt && (
          <button
            onClick={handleInstallClick}
            className="mt-4 w-full py-2 rounded-xl font-bold text-sm bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 transition-all"
          >
            📱 Install FarmSense AI App
          </button>
        )}
      </div>

      {/* Edit Profile */}
      <div className="disease-card" style={{ padding: '20px' }}>
        <h3
          style={{
            color: 'var(--text-primary)',
            fontWeight: 700,
            fontSize: '14px',
            marginBottom: '16px',
          }}
        >
          ✏️ Edit Profile
        </h3>
        <div className="space-y-3">
          <div>
            <label className={labelClass}>Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Preferred Crop</label>
            <select
              value={preferredCrop}
              onChange={(e) => setPreferredCrop(e.target.value)}
              className={inputClass}
            >
              {CROPS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Preferred Language</label>
            <select
              value={preferredLanguage}
              onChange={(e) => setPreferredLanguage(e.target.value)}
              className={inputClass}
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-primary to-accent text-dark
                            disabled:opacity-50 hover:shadow-lg hover:shadow-accent/20 active:scale-[0.98] transition-all text-sm"
          >
            {saving ? 'Saving...' : 'Save Changes ✅'}
          </button>
        </div>
      </div>

      {/* Change Password */}
      <div className="disease-card" style={{ padding: '20px' }}>
        <h3
          style={{
            color: 'var(--text-primary)',
            fontWeight: 700,
            fontSize: '14px',
            marginBottom: '16px',
          }}
        >
          🔒 Change Password
        </h3>
        {pwError && (
          <div className="bg-red-950/50 border border-red-800/50 rounded-xl p-2 mb-3">
            <p className="text-red-300 text-xs text-center">⚠️ {pwError}</p>
          </div>
        )}
        <div className="space-y-3">
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Current Password"
            className={inputClass}
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New Password (min 8, 1 uppercase, 1 number)"
            className={inputClass}
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm New Password"
            className={inputClass}
          />
          <button
            onClick={handleChangePassword}
            disabled={changingPw || !currentPassword || !newPassword}
            className="w-full py-3 rounded-xl font-bold text-sm border border-accent/30 text-accent
                            bg-accent/10 disabled:opacity-50 hover:bg-accent/20 active:scale-[0.98] transition-all"
          >
            {changingPw ? 'Changing...' : 'Change Password'}
          </button>
        </div>
      </div>
    </div>
  )
}
