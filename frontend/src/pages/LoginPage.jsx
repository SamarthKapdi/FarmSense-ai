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
        <div className="auth-bg" style={{ padding: '20px' }}>
            <div className="auth-card fade-in">

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div className="leaf-pulse" style={{ fontSize: '48px', marginBottom: '12px' }}>🌾</div>
                    <h1 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '6px' }}>
                        <span className="gradient-text">Welcome Back</span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                        Login to your FarmSense AI account
                    </p>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="fade-in" style={{
                        background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                        borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: '20px',
                    }}>
                        <p style={{ color: '#f87171', fontSize: '13px', textAlign: 'center' }}>⚠️ {error}</p>
                    </div>
                )}

                {requires2FA ? (
                    <form onSubmit={handleVerify2FA} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                            <h2 style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: 700 }}>
                                Two-Factor Authentication
                            </h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '6px' }}>
                                Enter the 6-digit code from your authenticator app
                            </p>
                        </div>
                        <input
                            type="text"
                            value={twoFactorCode}
                            onChange={(e) => setTwoFactorCode(e.target.value)}
                            required maxLength="6"
                            placeholder="000000"
                            className="input-field"
                            style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '0.5em', fontWeight: 700 }}
                        />
                        <button type="submit" disabled={isLoading || twoFactorCode.length !== 6}
                            className="btn-primary" style={{ width: '100%', padding: '16px' }}>
                            {isLoading ? "Verifying..." : "Verify →"}
                        </button>
                        <button type="button"
                            onClick={() => { setRequires2FA(false); setTwoFactorCode(""); setTempUserId(null); }}
                            style={{
                                background: 'none', border: 'none', color: 'var(--text-muted)',
                                fontSize: '13px', cursor: 'pointer', textAlign: 'center',
                            }}>
                            ← Back to Login
                        </button>
                    </form>
                ) : (
                    <>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* Email */}
                            <div>
                                <label style={{
                                    display: 'block', color: 'var(--text-muted)', fontSize: '12px',
                                    marginBottom: '6px', fontWeight: 600, letterSpacing: '0.5px',
                                }}>
                                    EMAIL
                                </label>
                                <input
                                    type="email" value={email}
                                    onChange={(e) => { setEmail(e.target.value); setFieldErrors(p => ({...p, email: undefined})); }}
                                    required aria-label="Email address"
                                    placeholder="farmer@email.com"
                                    className={`input-field ${fieldErrors.email ? 'error' : ''}`}
                                />
                                {fieldErrors.email && (
                                    <p style={{ color: '#f87171', fontSize: '12px', marginTop: '4px' }}>{fieldErrors.email}</p>
                                )}
                            </div>

                            {/* Password */}
                            <div style={{ position: 'relative' }}>
                                <label style={{
                                    display: 'block', color: 'var(--text-muted)', fontSize: '12px',
                                    marginBottom: '6px', fontWeight: 600, letterSpacing: '0.5px',
                                }}>
                                    PASSWORD
                                </label>
                                <input
                                    type={showPassword ? "text" : "password"} value={password}
                                    onChange={(e) => { setPassword(e.target.value); setFieldErrors(p => ({...p, password: undefined})); }}
                                    required aria-label="Password"
                                    placeholder="Enter your password"
                                    className={`input-field ${fieldErrors.password ? 'error' : ''}`}
                                    style={{ paddingRight: '48px' }}
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    aria-label="Toggle password visibility"
                                    style={{
                                        position: 'absolute', right: '14px', top: '38px',
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: 'var(--text-muted)', fontSize: '18px',
                                        transition: 'color 0.2s',
                                    }}
                                    onMouseEnter={e => e.target.style.color = 'var(--accent)'}
                                    onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}>
                                    {showPassword ? "🙈" : "👁️"}
                                </button>
                                {fieldErrors.password && (
                                    <p style={{ color: '#f87171', fontSize: '12px', marginTop: '4px' }}>{fieldErrors.password}</p>
                                )}
                            </div>

                            {/* Submit Button */}
                            <button type="submit" disabled={isLoading || !email || !password}
                                className="btn-primary" style={{ width: '100%', padding: '16px', fontSize: '16px', marginTop: '4px' }}>
                                {isLoading ? (
                                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        <span className="loading-spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                                        Logging in...
                                    </span>
                                ) : (
                                    "Login →"
                                )}
                            </button>

                            {/* Forgot Password */}
                            <button type="button" onClick={() => onNavigate("forgot-password")}
                                style={{
                                    background: 'none', border: 'none', color: 'var(--text-muted)',
                                    fontSize: '13px', cursor: 'pointer', textAlign: 'center',
                                    transition: 'color 0.2s',
                                }}
                                onMouseEnter={e => e.target.style.color = 'var(--accent)'}
                                onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}>
                                Forgot Password?
                            </button>
                        </form>

                        {/* Divider */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '16px', margin: '24px 0 20px',
                        }}>
                            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                            <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 500 }}>OR</span>
                            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                        </div>

                        {/* Register Link */}
                        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
                            Don't have an account?{" "}
                            <button onClick={() => onNavigate("register")} style={{
                                background: 'none', border: 'none', color: 'var(--accent)',
                                fontWeight: 700, cursor: 'pointer', fontSize: '14px',
                            }}>
                                Register Free
                            </button>
                        </p>

                        {/* Back to Landing */}
                        <button onClick={() => onNavigate("landing")} style={{
                            display: 'block', width: '100%', background: 'none', border: 'none',
                            color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer',
                            textAlign: 'center', marginTop: '16px', transition: 'color 0.2s',
                        }}
                        onMouseEnter={e => e.target.style.color = 'var(--text-secondary)'}
                        onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}>
                            ← Back to Home
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
