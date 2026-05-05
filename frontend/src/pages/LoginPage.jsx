import React, { useState } from "react";
import { loginWithPassword, verify2FA } from "../services/authApi";
import { useAuth } from "../context/AuthContext";

export default function LoginPage({ onNavigate }) {
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});
    
    // 2FA state
    const [requires2FA, setRequires2FA] = useState(false);
    const [tempUserId, setTempUserId] = useState(null);
    const [twoFactorCode, setTwoFactorCode] = useState("");

    const validateForm = () => {
        const errors = {};
        if (!email) errors.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(email)) errors.email = "Invalid email format";
        if (!password) errors.password = "Password is required";
        else if (password.length < 8) errors.password = "Password must be at least 8 characters";
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (!validateForm()) return;
        setIsLoading(true);
        try {
            const response = await loginWithPassword(email, password);
            if (response.requiresTwoFactor) {
                setRequires2FA(true);
                setTempUserId(response.tempUserId);
            } else if (response.token) {
                login(response);
                onNavigate("app");
            } else {
                setError(response.message || "Login failed. Please try again.");
            }
        } catch (err) {
            // handle backend 401 error object returned in catch block 
            // but the api unwrap does throw if message present
            setError(err.message || "Invalid credentials");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerify2FA = async (e) => {
        e.preventDefault();
        setError(null);
        if (twoFactorCode.length !== 6) {
            setError("Code must be 6 digits");
            return;
        }
        setIsLoading(true);
        try {
            const response = await verify2FA(tempUserId, twoFactorCode);
            if (response.token) {
                login(response);
                onNavigate("app");
            } else {
                setError(response.message || "Verification failed");
            }
        } catch (err) {
            setError(err.message || "Invalid or expired code");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-dark flex items-center justify-center px-5">
            <div className="w-full max-w-md">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="text-5xl mb-3 leaf-pulse">🌾</div>
                    <h1 className="text-2xl font-extrabold">
                        <span className="gradient-text">Welcome Back</span>
                    </h1>
                    <p className="text-gray-400 text-sm mt-2">
                        Login to your FarmSense AI account
                    </p>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="bg-red-950/50 border border-red-800/50 rounded-xl p-3 mb-5 fade-in">
                        <p className="text-red-300 text-sm text-center">⚠️ {error}</p>
                    </div>
                )}

                {requires2FA ? (
                    <form onSubmit={handleVerify2FA} className="space-y-4 fade-in">
                        <div className="text-center mb-6">
                            <h2 className="text-xl font-bold text-[var(--text-primary)]">Two-Factor Authentication</h2>
                            <p className="text-gray-400 text-sm mt-2">
                                Enter the 6-digit code from your authenticator app
                            </p>
                        </div>
                        <div>
                            <input
                                type="text"
                                value={twoFactorCode}
                                onChange={(e) => setTwoFactorCode(e.target.value)}
                                required
                                maxLength="6"
                                placeholder="6-digit code"
                                className="w-full bg-darker border border-gray-700 rounded-xl px-4 py-3.5
                                text-center text-2xl tracking-[0.5em] text-[var(--text-primary)] placeholder-gray-600 focus:outline-none focus:border-accent
                                transition-colors"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading || twoFactorCode.length !== 6}
                            className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r
                            from-primary to-accent text-dark disabled:opacity-50
                            hover:shadow-lg hover:shadow-accent/20 active:scale-[0.98]
                            transition-all mt-2"
                        >
                            {isLoading ? "Verifying..." : "Verify"}
                        </button>
                        <button
                            type="button"
                            onClick={() => { setRequires2FA(false); setTwoFactorCode(""); setTempUserId(null); }}
                            className="w-full text-center text-gray-500 text-xs mt-4 hover:text-accent transition-colors"
                        >
                            Cancel
                        </button>
                    </form>
                ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-400 text-xs mb-1.5 font-medium">
                            📧 Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); setFieldErrors(p => ({...p, email: undefined})); }}
                            required
                            aria-label="Email address"
                            placeholder="farmer@email.com"
                            className={`w-full bg-darker border rounded-xl px-4 py-3.5
                         text-[var(--text-primary)] placeholder-gray-600 focus:outline-none
                         transition-colors ${fieldErrors.email ? 'border-red-500' : 'border-gray-700 focus:border-accent'}`}
                        />
                        {fieldErrors.email && <p className="text-red-400 text-xs mt-1">{fieldErrors.email}</p>}
                    </div>

                    <div className="relative">
                        <label className="block text-gray-400 text-xs mb-1.5 font-medium">
                            🔒 Password
                        </label>
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setFieldErrors(p => ({...p, password: undefined})); }}
                            required
                            aria-label="Password"
                            placeholder="Enter your password"
                            className={`w-full bg-darker border rounded-xl px-4 py-3.5
                         text-[var(--text-primary)] placeholder-gray-600 focus:outline-none
                         transition-colors pr-12 ${fieldErrors.password ? 'border-red-500' : 'border-gray-700 focus:border-accent'}`}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label="Toggle password visibility"
                            className="absolute right-3 top-[34px] text-gray-400 hover:text-accent 
                         transition-colors text-lg"
                        >
                            {showPassword ? "🙈" : "👁️"}
                        </button>
                        {fieldErrors.password && <p className="text-red-400 text-xs mt-1">{fieldErrors.password}</p>}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading || !email || !password}
                        className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r
                       from-primary to-accent text-dark disabled:opacity-50
                       hover:shadow-lg hover:shadow-accent/20 active:scale-[0.98]
                       transition-all mt-2"
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="loading-spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                                Logging in...
                            </span>
                        ) : (
                            "Login →"
                        )}
                    </button>

                    {/* Forgot Password */}
                    <button
                        type="button"
                        onClick={() => onNavigate("forgot-password")}
                        className="w-full text-center text-gray-500 text-xs mt-2 hover:text-accent transition-colors"
                    >
                        Forgot Password?
                    </button>
                </form>

                {/* Register Link */}
                <p className="text-center text-gray-500 text-sm mt-6">
                    Don't have an account?{" "}
                    <button
                        onClick={() => onNavigate("register")}
                        className="text-accent font-semibold hover:underline"
                    >
                        Register Free
                    </button>
                </p>

                {/* Back to Landing */}
                <button
                    onClick={() => onNavigate("landing")}
                    className="w-full text-center text-gray-600 text-xs mt-4 hover:text-gray-400 transition-colors"
                >
                    ← Back to Home
                </button>
                </div>)}
            </div>
        </div>
    );
}
