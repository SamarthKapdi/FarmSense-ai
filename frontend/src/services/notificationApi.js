import { apiUrl, safeJson } from './baseUrl'

const headers = (token) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
})

export async function getNotifications(token) {
  const res = await fetch(apiUrl('/notifications'), { headers: headers(token) })
  if (!res.ok) return []
  const json = await safeJson(res)
  return json.data || []
}

export async function getUnreadNotifications(token) {
  const res = await fetch(apiUrl('/notifications/unread'), {
    headers: headers(token),
  })
  if (!res.ok) return { count: 0, notifications: [] }
  const json = await safeJson(res)
  return json.data || { count: 0, notifications: [] }
}

export async function markNotificationRead(token, id) {
  await fetch(apiUrl(`/notifications/${id}/read`), {
    method: 'POST',
    headers: headers(token),
  })
}

export async function markAllNotificationsRead(token) {
  await fetch(apiUrl('/notifications/read-all'), {
    method: 'POST',
    headers: headers(token),
  })
}
