import React, { useState } from "react";
import { loginWithPassword } from "../services/authApi";
import { useAuth } from "../context/AuthContext";

export default function LoginPage({ onNavigate }) {
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        try {
            const response = await loginWithPassword(email, password);
            if (response.token) {
                login(response);
                onNavigate("app");
            } else {
                setError(response.message || "Login failed. Please try again.");
            }
        } catch (err) {
            setError(err.message);
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

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email */}
                    <div>
                        <label className="block text-gray-400 text-xs mb-1.5 font-medium">
                            📧 Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="farmer@email.com"
                            className="w-full bg-darker border border-gray-700 rounded-xl px-4 py-3.5
                         text-white placeholder-gray-600 focus:outline-none
                         focus:border-accent transition-colors"
                        />
                    </div>

                    {/* Password */}
                    <div className="relative">
                        <label className="block text-gray-400 text-xs mb-1.5 font-medium">
                            🔒 Password
                        </label>
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Enter your password"
                            className="w-full bg-darker border border-gray-700 rounded-xl px-4 py-3.5
                         text-white placeholder-gray-600 focus:outline-none
                         focus:border-accent transition-colors pr-12"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-[34px] text-gray-400 hover:text-accent 
                         transition-colors text-lg"
                        >
                            {showPassword ? "🙈" : "👁️"}
                        </button>
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
            </div>
        </div>
    );
}
