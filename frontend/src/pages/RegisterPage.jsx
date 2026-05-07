import React, { useState } from "react";
import { registerUser } from "../services/authApi";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage({ onNavigate }) {
    const { login } = useAuth();
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});
    const [role, setRole] = useState("FARMER");
    const [agronomistCode, setAgronomistCode] = useState("");

    const getPasswordStrength = () => {
        if (!password) return { level: 0, label: "", color: "" };
        let score = 0;
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        if (score <= 1) return { level: 1, label: "Weak", color: "#ef4444" };
        if (score === 2) return { level: 2, label: "Fair", color: "#f59e0b" };
        if (score === 3) return { level: 3, label: "Good", color: "#3b82f6" };
        if (score === 4) return { level: 4, label: "Strong", color: "#22c55e" };
        return { level: 5, label: "Very Strong", color: "var(--accent)" };
    };

    const validateForm = () => {
        const errors = {};
        if (!fullName || fullName.trim().length < 2) errors.fullName = "Name must be at least 2 characters";
        if (!email || !/\S+@\S+\.\S+/.test(email)) errors.email = "Invalid email format";
        if (!password || password.length < 8) errors.password = "Password must be at least 8 characters";
        else if (!/[A-Z]/.test(password)) errors.password = "Must contain at least 1 uppercase letter";
        else if (!/[0-9]/.test(password)) errors.password = "Must contain at least 1 number";
        if (password !== confirmPassword) errors.confirmPassword = "Passwords do not match";
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (!validateForm()) return;

        setIsLoading(true);
        try {
            const response = await registerUser(fullName, email, password, role, agronomistCode);
            if (response.token) {
                login(response);
                onNavigate("app");
            } else {
                setError(response.message || "Registration failed. Please try again.");
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const strength = getPasswordStrength();
    const passwordsMatch = confirmPassword && password === confirmPassword;
    const passwordsMismatch = confirmPassword && password !== confirmPassword;

    const inputStyle = (hasError) => `input-field ${hasError ? 'error' : ''}`;
    const labelStyle = {
        display: 'block', color: 'var(--text-muted)', fontSize: '12px',
        marginBottom: '6px', fontWeight: 600, letterSpacing: '0.5px',
    };

    return (
        <div className="auth-bg" style={{ padding: '20px' }}>
            <div className="auth-card fade-in" style={{ maxWidth: '460px' }}>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                    <div className="leaf-pulse" style={{ fontSize: '48px', marginBottom: '12px' }}>🌱</div>
                    <h1 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '6px' }}>
                        <span className="gradient-text">Join FarmSense AI</span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                        Create your free account
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

                {/* Registration Form */}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {/* Full Name */}
                    <div>
                        <label style={labelStyle}>FULL NAME</label>
                        <input type="text" value={fullName}
                            onChange={(e) => { setFullName(e.target.value); setFieldErrors(p => ({...p, fullName: undefined})); }}
                            required placeholder="Rajesh Kumar"
                            className={inputStyle(fieldErrors.fullName)} />
                        {fieldErrors.fullName && <p style={{ color: '#f87171', fontSize: '12px', marginTop: '4px' }}>{fieldErrors.fullName}</p>}
                    </div>

                    {/* Email */}
                    <div>
                        <label style={labelStyle}>EMAIL</label>
                        <input type="email" value={email}
                            onChange={(e) => { setEmail(e.target.value); setFieldErrors(p => ({...p, email: undefined})); }}
                            required placeholder="farmer@email.com"
                            className={inputStyle(fieldErrors.email)} />
                        {fieldErrors.email && <p style={{ color: '#f87171', fontSize: '12px', marginTop: '4px' }}>{fieldErrors.email}</p>}
                    </div>

                    {/* Password */}
                    <div style={{ position: 'relative' }}>
                        <label style={labelStyle}>PASSWORD</label>
                        <input
                            type={showPassword ? "text" : "password"} value={password}
                            onChange={(e) => setPassword(e.target.value)} required
                            placeholder="Min 8 characters"
                            className="input-field" style={{ paddingRight: '48px' }} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: 'absolute', right: '14px', top: '38px',
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: 'var(--text-muted)', fontSize: '18px',
                            }}>
                            {showPassword ? "🙈" : "👁️"}
                        </button>

                        {/* Password Strength Bar */}
                        {password && (
                            <div className="fade-in" style={{ marginTop: '8px' }}>
                                <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <div key={i} style={{
                                            height: '4px', flex: 1, borderRadius: '2px',
                                            transition: 'all 0.3s',
                                            background: i <= strength.level ? strength.color : 'var(--border)',
                                        }} />
                                    ))}
                                </div>
                                <p style={{ fontSize: '12px', fontWeight: 600, color: strength.color }}>
                                    {strength.label}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label style={labelStyle}>CONFIRM PASSWORD</label>
                        <input type="password" value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)} required
                            placeholder="Re-enter your password"
                            className="input-field"
                            style={{
                                borderColor: passwordsMismatch ? '#ef4444' : passwordsMatch ? '#22c55e' : undefined,
                            }} />
                        {passwordsMismatch && <p style={{ color: '#f87171', fontSize: '12px', marginTop: '4px' }}>Passwords don't match</p>}
                        {passwordsMatch && <p style={{ color: '#22c55e', fontSize: '12px', marginTop: '4px' }}>✓ Passwords match</p>}
                    </div>

                    {/* Role Selection */}
                    <div>
                        <label style={labelStyle}>ACCOUNT TYPE</label>
                        <select value={role} onChange={(e) => setRole(e.target.value)} className="input-field" style={{ cursor: 'pointer' }}>
                            <option value="FARMER">Farmer</option>
                            <option value="AGRONOMIST">Agronomist / Expert</option>
                        </select>
                    </div>

                    {/* Agronomist Code */}
                    {role === "AGRONOMIST" && (
                        <div className="fade-in">
                            <label style={labelStyle}>AGRONOMIST ACCESS CODE</label>
                            <input type="text" value={agronomistCode}
                                onChange={(e) => setAgronomistCode(e.target.value)}
                                required={role === "AGRONOMIST"} placeholder="Enter code (e.g. AGRI2026)"
                                className="input-field" />
                        </div>
                    )}

                    {/* Submit Button */}
                    <button type="submit" disabled={isLoading || !fullName || !email || password.length < 8 || password !== confirmPassword}
                        className="btn-primary" style={{ width: '100%', padding: '16px', fontSize: '16px', marginTop: '4px' }}>
                        {isLoading ? (
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <span className="loading-spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                                Creating account...
                            </span>
                        ) : (
                            "Create Account 🌾"
                        )}
                    </button>
                </form>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '24px 0 20px' }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                    <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 500 }}>OR</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                </div>

                {/* Login Link */}
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
                    Already have an account?{" "}
                    <button onClick={() => onNavigate("login")} style={{
                        background: 'none', border: 'none', color: 'var(--accent)',
                        fontWeight: 700, cursor: 'pointer', fontSize: '14px',
                    }}>
                        Login
                    </button>
                </p>

                {/* Back to Landing */}
                <button onClick={() => onNavigate("landing")} style={{
                    display: 'block', width: '100%', background: 'none', border: 'none',
                    color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer',
                    textAlign: 'center', marginTop: '16px',
                }}>
                    ← Back to Home
                </button>
            </div>
        </div>
    );
}
