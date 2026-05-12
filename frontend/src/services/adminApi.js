import { apiUrl, safeJson } from './baseUrl'
const BASE_URL = apiUrl('/admin')
const getAuthHeaders = () => {
  const token = localStorage.getItem('farmsense_token')
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

export const getAllUsers = async () => {
  const res = await fetch(`${BASE_URL}/users`, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Failed to fetch users')
  const json = await safeJson(res)
  return json.data
}

export const getSystemStats = async () => {
  const res = await fetch(`${BASE_URL}/stats`, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Failed to fetch stats')
  const json = await safeJson(res)
  return json.data
}

export const getSystemHealth = async () => {
  const res = await fetch(`${BASE_URL}/health`, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Failed to fetch system health')
  const json = await safeJson(res)
  return json.data
}

export const getRecentActivities = async (limit = 20) => {
  const res = await fetch(`${BASE_URL}/activities?limit=${limit}`, {
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch activities')
  const json = await safeJson(res)
  return json.data
}

export const updateConfig = async (key, value) => {
  const res = await fetch(`${BASE_URL}/config`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ configKey: key, configValue: value }),
  })
  if (!res.ok) throw new Error('Failed to update config')
  const json = await safeJson(res)
  return json.data
}

export const disableUser = async (userId) => {
  const res = await fetch(`${BASE_URL}/users/${userId}/disable`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to disable user')
  return true
}

export const enableUser = async (userId) => {
  const res = await fetch(`${BASE_URL}/users/${userId}/enable`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to enable user')
  return true
}

export const deleteUser = async (userId) => {
  const res = await fetch(`${BASE_URL}/users/${userId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Failed to delete user')
  return true
}
