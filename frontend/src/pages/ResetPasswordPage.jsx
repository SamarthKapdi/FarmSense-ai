import React, { useState } from "react";

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';

export default function ResetPasswordPage({ onNavigate }) {
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});

    const validate = () => {
        const errors = {};
        if (!email || !/\S+@\S+\.\S+/.test(email)) errors.email = "Valid email required";
        if (!code || code.length !== 6) errors.code = "Enter 6-digit code";
        if (!newPassword || newPassword.length < 8) errors.newPassword = "Min 8 characters";
        else if (!/[A-Z]/.test(newPassword)) errors.newPassword = "Must contain 1 uppercase letter";
        else if (!/[0-9]/.test(newPassword)) errors.newPassword = "Must contain 1 number";
        if (newPassword !== confirmPassword) errors.confirmPassword = "Passwords don't match";
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (!validate()) return;
        setIsLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code, newPassword }),
            });
            const json = await res.json();
            if (res.ok) {
                setSuccess(true);
            } else {
                setError(json.message || "Reset failed");
            }
        } catch {
            setError("Network error");
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-dark flex items-center justify-center px-5">
                <div className="w-full max-w-md text-center">
                    <div className="text-5xl mb-4">✅</div>
                    <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Password Reset!</h2>
                    <p className="text-gray-400 text-sm mb-6">Your password has been updated. Please login.</p>
                    <button onClick={() => onNavigate("login")}
                        className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-primary to-accent text-dark
                            hover:shadow-lg hover:shadow-accent/20 active:scale-[0.98] transition-all">
                        Go to Login →
                    </button>
                </div>
            </div>
        );
    }

    const inputClass = (field) => `w-full bg-darker border rounded-xl px-4 py-3.5
        text-[var(--text-primary)] placeholder-gray-600 focus:outline-none transition-colors
        ${fieldErrors[field] ? 'border-red-500' : 'border-gray-700 focus:border-accent'}`;

    return (
        <div className="min-h-screen bg-dark flex items-center justify-center px-5">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="text-5xl mb-3">🔑</div>
                    <h1 className="text-2xl font-extrabold">
                        <span className="gradient-text">Enter Reset Code</span>
                    </h1>
                    <p className="text-gray-400 text-sm mt-2">Check your console logs for the 6-digit code</p>
                </div>

                {error && (
                    <div className="bg-red-950/50 border border-red-800/50 rounded-xl p-3 mb-5 fade-in">
                        <p className="text-red-300 text-sm text-center">⚠️ {error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-400 text-xs mb-1.5 font-medium">📧 Email</label>
                        <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setFieldErrors(p => ({...p, email: undefined})); }}
                            placeholder="farmer@email.com" className={inputClass('email')} />
                        {fieldErrors.email && <p className="text-red-400 text-xs mt-1">{fieldErrors.email}</p>}
                    </div>
                    <div>
                        <label className="block text-gray-400 text-xs mb-1.5 font-medium">🔢 Reset Code</label>
                        <input type="text" value={code} maxLength={6}
                            onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setFieldErrors(p => ({...p, code: undefined})); }}
                            placeholder="123456" className={inputClass('code')}
                            style={{ letterSpacing: '8px', textAlign: 'center', fontSize: '20px', fontWeight: 800 }} />
                        {fieldErrors.code && <p className="text-red-400 text-xs mt-1">{fieldErrors.code}</p>}
                    </div>
                    <div>
                        <label className="block text-gray-400 text-xs mb-1.5 font-medium">🔒 New Password</label>
                        <input type="password" value={newPassword}
                            onChange={(e) => { setNewPassword(e.target.value); setFieldErrors(p => ({...p, newPassword: undefined})); }}
                            placeholder="Min 8 chars, 1 uppercase, 1 number" className={inputClass('newPassword')} />
                        {fieldErrors.newPassword && <p className="text-red-400 text-xs mt-1">{fieldErrors.newPassword}</p>}
                    </div>
                    <div>
                        <label className="block text-gray-400 text-xs mb-1.5 font-medium">🔒 Confirm Password</label>
                        <input type="password" value={confirmPassword}
                            onChange={(e) => { setConfirmPassword(e.target.value); setFieldErrors(p => ({...p, confirmPassword: undefined})); }}
                            placeholder="Re-enter password" className={inputClass('confirmPassword')} />
                        {fieldErrors.confirmPassword && <p className="text-red-400 text-xs mt-1">{fieldErrors.confirmPassword}</p>}
                    </div>
                    <button type="submit" disabled={isLoading}
                        className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-primary to-accent text-dark
                            disabled:opacity-50 hover:shadow-lg hover:shadow-accent/20 active:scale-[0.98] transition-all mt-2">
                        {isLoading ? "Resetting..." : "Reset Password 🔐"}
                    </button>
                </form>
                <button onClick={() => onNavigate("login")}
                    className="w-full text-center text-gray-600 text-xs mt-4 hover:text-gray-400 transition-colors">
                    ← Back to Login
                </button>
            </div>
        </div>
    );
}
