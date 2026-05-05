const BASE_URL =
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api'

/**
 * Unwraps the ApiResponse wrapper: { success, message, data } → data
 */
const unwrap = (json) => {
  if (json.data !== undefined && json.success !== undefined) {
    return json.data
  }
  return json
}

export const registerUser = async (fullName, email, password) => {
  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName, email, password }),
  })
  const json = await response.json()
  if (!response.ok) throw new Error(json.message || 'Registration failed')
  return unwrap(json)
}

export const loginWithPassword = async (email, password) => {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const json = await response.json()
  // Support 401 but might be a valid error response
  if (!response.ok && response.status !== 401)
    throw new Error(json.message || 'Login failed')
  return unwrap(json)
}

export const verify2FA = async (userId, code) => {
  const response = await fetch(`${BASE_URL}/auth/verify-2fa`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, code }),
  })
  const json = await response.json()
  if (!response.ok) throw new Error(json.message || '2FA verification failed')
  return unwrap(json)
}

export const getCurrentUser = async (token) => {
  const response = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) throw new Error('Not authenticated')
  const json = await response.json()
  return unwrap(json)
}

export const refreshAccessToken = async (refreshToken) => {
  const response = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
  const json = await response.json()
  if (!response.ok) throw new Error(json.message || 'Token refresh failed')
  return unwrap(json)
}

export const forgotPassword = async (email) => {
  const response = await fetch(`${BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  return response.json()
}

export const resetPassword = async (email, code, newPassword) => {
  const response = await fetch(`${BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code, newPassword }),
  })
  return response.json()
}
