import React, { useState } from "react";

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';

export default function ForgotPasswordPage({ onNavigate }) {
    const [email, setEmail] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (!email || !/\S+@\S+\.\S+/.test(email)) {
            setError("Please enter a valid email address");
            return;
        }
        setIsLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const json = await res.json();
            if (res.ok) {
                setSubmitted(true);
            } else {
                setError(json.message || "Something went wrong");
            }
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-dark flex items-center justify-center px-5">
                <div className="w-full max-w-md text-center">
                    <div className="text-5xl mb-4">📧</div>
                    <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Check Your Email</h2>
                    <p className="text-gray-400 text-sm mb-6">
                        If an account exists for <strong className="text-accent">{email}</strong>,
                        a 6-digit reset code has been sent. Check your console logs (dev mode).
                    </p>
                    <button
                        onClick={() => onNavigate("reset-password")}
                        className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-primary to-accent text-dark
                            hover:shadow-lg hover:shadow-accent/20 active:scale-[0.98] transition-all"
                    >
                        Enter Reset Code →
                    </button>
                    <button
                        onClick={() => onNavigate("login")}
                        className="w-full text-center text-gray-600 text-xs mt-4 hover:text-gray-400 transition-colors"
                    >
                        ← Back to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark flex items-center justify-center px-5">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="text-5xl mb-3">🔐</div>
                    <h1 className="text-2xl font-extrabold">
                        <span className="gradient-text">Reset Password</span>
                    </h1>
                    <p className="text-gray-400 text-sm mt-2">
                        Enter your email and we'll send a reset code
                    </p>
                </div>

                {error && (
                    <div className="bg-red-950/50 border border-red-800/50 rounded-xl p-3 mb-5 fade-in">
                        <p className="text-red-300 text-sm text-center">⚠️ {error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-400 text-xs mb-1.5 font-medium">📧 Email</label>
                        <input
                            type="email" value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required placeholder="farmer@email.com"
                            className="w-full bg-darker border border-gray-700 rounded-xl px-4 py-3.5
                                text-[var(--text-primary)] placeholder-gray-600 focus:outline-none
                                focus:border-accent transition-colors"
                        />
                    </div>
                    <button type="submit" disabled={isLoading || !email}
                        className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r
                            from-primary to-accent text-dark disabled:opacity-50
                            hover:shadow-lg hover:shadow-accent/20 active:scale-[0.98] transition-all"
                    >
                        {isLoading ? "Sending..." : "Send Reset Code 📩"}
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
