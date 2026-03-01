const BASE_URL = "http://localhost:8080/api/auth";

export const registerUser = async (fullName, email, password) => {
    const response = await fetch(`${BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password }),
    });
    const data = await response.json();
    if (!response.ok && !data.token) throw new Error(data.message || "Registration failed");
    return data;
};

export const loginWithPassword = async (email, password) => {
    const response = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (!response.ok && !data.token) throw new Error(data.message || "Login failed");
    return data;
};

export const getCurrentUser = async (token) => {
    const response = await fetch(`${BASE_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Not authenticated");
    return response.json();
};
