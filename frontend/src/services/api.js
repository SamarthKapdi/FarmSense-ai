const BASE_URL = "http://localhost:8080/api";

export const detectDisease = async (imageFile, crop, language, token) => {
    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("crop", crop);
    formData.append("language", language);

    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`${BASE_URL}/farm/detect`, {
        method: "POST",
        headers,
        body: formData,
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(err || "Detection failed");
    }
    return response.json();
};

export const askKrishiGPT = async (question, crop, language, token) => {
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`${BASE_URL}/chat/ask`, {
        method: "POST",
        headers,
        body: JSON.stringify({ question, crop, language }),
    });

    if (!response.ok) {
        throw new Error("Chat failed");
    }
    return response.json();
};

export const generatePlan = async (detectionResult, language, token) => {
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`${BASE_URL}/farm/treatment-plan`, {
        method: "POST",
        headers,
        body: JSON.stringify({ detectionResult, language }),
    });

    if (!response.ok) {
        throw new Error("Plan generation failed");
    }
    return response.json();
};

export const getHistory = async (token) => {
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`${BASE_URL}/farm/history/me`, { headers });
    if (!response.ok) {
        throw new Error("History fetch failed");
    }
    return response.json();
};

export const getStats = async (token) => {
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`${BASE_URL}/farm/stats/me`, { headers });
    if (!response.ok) {
        throw new Error("Stats fetch failed");
    }
    return response.json();
};
