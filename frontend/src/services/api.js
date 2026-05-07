const BASE_URL =
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api'

// ── Helper: build auth headers ───────────────────────────────────────────────
const authHeaders = (token, contentType) => {
  const headers = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (contentType) headers['Content-Type'] = contentType
  return headers
}

// ── Helper: unwrap ApiResponse ───────────────────────────────────────────────
const unwrap = async (response) => {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(
      body.message || body.error || `Request failed (${response.status})`
    )
  }
  const json = await response.json()
  // Support both wrapped { success, data } and raw responses
  if (json.data !== undefined) return json.data
  return json
}

// ── Disease Detection ────────────────────────────────────────────────────────
export const detectDisease = async (imageFile, crop, language, token) => {
  const formData = new FormData()
  formData.append('image', imageFile)
  formData.append('crop', crop)
  formData.append('language', language)

  const response = await fetch(`${BASE_URL}/farm/detect`, {
    method: 'POST',
    headers: authHeaders(token),
    body: formData,
  })
  return unwrap(response)
}

// ── KrishiGPT Chat ──────────────────────────────────────────────────────────
export const askKrishiGPT = async (question, crop, language, token, imageBase64) => {
  const response = await fetch(`${BASE_URL}/farm/ask`, {
    method: 'POST',
    headers: authHeaders(token, 'application/json'),
    body: JSON.stringify({ question, crop, language, imageBase64 }),
  })
  return unwrap(response)
}

// ── Treatment Plan ───────────────────────────────────────────────────────────
export const generatePlan = async (detectionResult, language, token) => {
  const response = await fetch(`${BASE_URL}/farm/treatment-plan`, {
    method: 'POST',
    headers: authHeaders(token, 'application/json'),
    body: JSON.stringify({ detectionResult, language }),
  })
  return unwrap(response)
}

// ── History & Stats ──────────────────────────────────────────────────────────
export const getHistory = async (token) => {
  const response = await fetch(`${BASE_URL}/farm/history/me`, {
    headers: authHeaders(token),
  })
  return unwrap(response)
}

export const getStats = async (token) => {
  const response = await fetch(`${BASE_URL}/farm/stats/me`, {
    headers: authHeaders(token),
  })
  return unwrap(response)
}

// ── Weather API ──────────────────────────────────────────────────────────────
export const getWeather = async (city = 'Mumbai') => {
  try {
    const response = await fetch(
      `${BASE_URL}/weather?city=${encodeURIComponent(city)}`
    )
    return unwrap(response)
  } catch (e) {
    return {
      city,
      temperature: '--',
      humidity: '--',
      description: 'Unavailable',
      alerts: [
        { level: 'INFO', message: 'Weather service offline', icon: 'ℹ️' },
      ],
      offline: true,
    }
  }
}

// ── Farm Profile CRUD ────────────────────────────────────────────────────────
export const getFarmProfiles = async (token) => {
  const response = await fetch(`${BASE_URL}/farm-profile`, {
    headers: authHeaders(token),
  })
  return unwrap(response)
}

export const createFarmProfile = async (profile, token) => {
  const response = await fetch(`${BASE_URL}/farm-profile`, {
    method: 'POST',
    headers: authHeaders(token, 'application/json'),
    body: JSON.stringify(profile),
  })
  return unwrap(response)
}

export const updateFarmProfile = async (id, profile, token) => {
  const response = await fetch(`${BASE_URL}/farm-profile/${id}`, {
    method: 'PUT',
    headers: authHeaders(token, 'application/json'),
    body: JSON.stringify(profile),
  })
  return unwrap(response)
}

export const deleteFarmProfile = async (id, token) => {
  const response = await fetch(`${BASE_URL}/farm-profile/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  return unwrap(response)
}

// ── Health Check ─────────────────────────────────────────────────────────────
export const checkHealth = async () => {
  try {
    const response = await fetch(`${BASE_URL}/farm/health`)
    return response.ok
  } catch {
    return false
  }
}

// ── Bookmarks ────────────────────────────────────────────────────────────────
export const toggleBookmark = async (reportId, token) => {
  const response = await fetch(`${BASE_URL}/farm/history/${reportId}/bookmark`, {
    method: 'PATCH',
    headers: authHeaders(token),
  })
  return unwrap(response)
}

export const getBookmarkedHistory = async (token) => {
  const response = await fetch(`${BASE_URL}/farm/history/bookmarked`, {
    headers: authHeaders(token),
  })
  return unwrap(response)
}

// ── PDF Export ────────────────────────────────────────────────────────────────
export const downloadReportPdf = async (reportId, token) => {
  const response = await fetch(`${BASE_URL}/farm/report/${reportId}/pdf`, {
    headers: authHeaders(token),
  })
  if (!response.ok) throw new Error('Failed to download report')
  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `FarmSense_Report_${reportId}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}
