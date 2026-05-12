import { apiUrl } from './baseUrl'

const authHeaders = (token) => ({
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
})

const unwrap = async (response) => {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(
      body.message || body.error || `Request failed (${response.status})`
    )
  }

  const json = await response.json()
  return json.data !== undefined ? json.data : json
}

export const getUserStats = async (token) => {
  return unwrap(
    await fetch(apiUrl('/user/stats'), { headers: authHeaders(token) })
  )
}

export const getRecentActivities = async (token) => {
  return unwrap(
    await fetch(apiUrl('/user/activities/recent'), {
      headers: authHeaders(token),
    })
  )
}

export const getScanHistory = async (token) => {
  return unwrap(
    await fetch(apiUrl('/user/scan-history'), { headers: authHeaders(token) })
  )
}

export const getChatHistory = async (token) => {
  return unwrap(
    await fetch(apiUrl('/user/chat-history'), { headers: authHeaders(token) })
  )
}
