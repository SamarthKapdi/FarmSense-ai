import React, { createContext, useState, useContext, useCallback } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const login = useCallback((authResponse) => {
        setToken(authResponse.token);
        setUser({
            userId: authResponse.userId,
            email: authResponse.email,
            fullName: authResponse.fullName,
            role: authResponse.role,
            emailVerified: authResponse.emailVerified,
        });
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        setToken(null);
    }, []);

    const getToken = useCallback(() => token, [token]);

    const isAuthenticated = !!token && !!user;

    return (
        <AuthContext.Provider
            value={{ user, token, isAuthenticated, isLoading, setIsLoading, login, logout, getToken }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
