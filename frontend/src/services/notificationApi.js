const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';

const headers = (token) => ({
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
});

export async function getNotifications(token) {
    const res = await fetch(`${BASE_URL}/notifications`, { headers: headers(token) });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
}

export async function getUnreadNotifications(token) {
    const res = await fetch(`${BASE_URL}/notifications/unread`, { headers: headers(token) });
    if (!res.ok) return { count: 0, notifications: [] };
    const json = await res.json();
    return json.data || { count: 0, notifications: [] };
}

export async function markNotificationRead(token, id) {
    await fetch(`${BASE_URL}/notifications/${id}/read`, {
        method: 'POST',
        headers: headers(token),
    });
}

export async function markAllNotificationsRead(token) {
    await fetch(`${BASE_URL}/notifications/read-all`, {
        method: 'POST',
        headers: headers(token),
    });
}
