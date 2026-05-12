import { apiUrl } from './baseUrl'

const authHeaders = (token) => ({
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
})

const unwrap = async (response) => {
  const text = await response.text();
  let json = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch (e) {
    json = { message: 'Invalid response from server' };
  }

  if (!response.ok) {
    throw new Error(
      json.message || json.error || `Request failed (${response.status})`
    )
  }

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
