const BASE_URL =
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api'

const authHeaders = (token) => {
  const headers = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

export const getUserStats = async (token) => {
  const response = await fetch(`${BASE_URL}/user/stats`, {
    headers: authHeaders(token),
  })
  if (!response.ok) throw new Error('Failed to fetch stats')
  const body = await response.json()
  return body.data ?? body
}

export const getUserActivities = async (token, page = 0) => {
  const response = await fetch(`${BASE_URL}/user/activities?page=${page}`, {
    headers: authHeaders(token),
  })
  if (!response.ok) throw new Error('Failed to fetch activities')
  const body = await response.json()
  return body.data ?? body
}

export const getRecentActivities = async (token) => {
  const response = await fetch(`${BASE_URL}/user/activities/recent`, {
    headers: authHeaders(token),
  })
  if (!response.ok) throw new Error('Failed to fetch recent activities')
  const body = await response.json()
  return body.data ?? body
}

export const getChatHistory = async (token) => {
  const response = await fetch(`${BASE_URL}/user/chat-history`, {
    headers: authHeaders(token),
  })
  if (!response.ok) throw new Error('Failed to fetch chat history')
  const body = await response.json()
  return body.data ?? body
}

export const getScanHistory = async (token) => {
  const response = await fetch(`${BASE_URL}/user/scan-history`, {
    headers: authHeaders(token),
  })
  if (!response.ok) throw new Error('Failed to fetch scan history')
  const body = await response.json()
  return body.data ?? body
}

export const getUserProfile = async (token) => {
  const response = await fetch(`${BASE_URL}/user/profile`, {
    headers: authHeaders(token),
  })
  if (!response.ok) throw new Error('Failed to fetch profile')
  const body = await response.json()
  return body.data ?? body
}
