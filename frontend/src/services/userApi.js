const BASE_URL = "http://localhost:8080/api/user";

const authHeaders = (token) => ({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
});

export const getUserStats = async (token) => {
    const response = await fetch(`${BASE_URL}/stats`, {
        headers: authHeaders(token),
    });
    if (!response.ok) throw new Error("Failed to fetch stats");
    return response.json();
};

export const getUserActivities = async (token, page = 0) => {
    const response = await fetch(`${BASE_URL}/activities?page=${page}`, {
        headers: authHeaders(token),
    });
    if (!response.ok) throw new Error("Failed to fetch activities");
    return response.json();
};

export const getRecentActivities = async (token) => {
    const response = await fetch(`${BASE_URL}/activities/recent`, {
        headers: authHeaders(token),
    });
    if (!response.ok) throw new Error("Failed to fetch recent activities");
    return response.json();
};

export const getChatHistory = async (token) => {
    const response = await fetch(`${BASE_URL}/chat-history`, {
        headers: authHeaders(token),
    });
    if (!response.ok) throw new Error("Failed to fetch chat history");
    return response.json();
};

export const getScanHistory = async (token) => {
    const response = await fetch(`${BASE_URL}/scan-history`, {
        headers: authHeaders(token),
    });
    if (!response.ok) throw new Error("Failed to fetch scan history");
    return response.json();
};

export const getUserProfile = async (token) => {
    const response = await fetch(`${BASE_URL}/profile`, {
        headers: authHeaders(token),
    });
    if (!response.ok) throw new Error("Failed to fetch profile");
    return response.json();
};
