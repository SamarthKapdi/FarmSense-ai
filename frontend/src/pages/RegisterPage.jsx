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

    const getPasswordStrength = () => {
        if (!password) return { level: 0, label: "", color: "" };
        let score = 0;
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        if (score <= 1) return { level: 1, label: "Weak", color: "bg-red-500" };
        if (score === 2) return { level: 2, label: "Fair", color: "bg-yellow-500" };
        if (score === 3) return { level: 3, label: "Good", color: "bg-blue-500" };
        if (score === 4) return { level: 4, label: "Strong", color: "bg-green-500" };
        return { level: 5, label: "Very Strong", color: "bg-accent" };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }

        setIsLoading(true);
        try {
            const response = await registerUser(fullName, email, password);
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

    return (
        <div className="min-h-screen bg-dark flex items-center justify-center px-5 py-8">
            <div className="w-full max-w-md">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="text-5xl mb-3 leaf-pulse">🌱</div>
                    <h1 className="text-2xl font-extrabold">
                        <span className="gradient-text">Join FarmSense AI</span>
                    </h1>
                    <p className="text-gray-400 text-sm mt-2">
                        Create your free account
                    </p>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="bg-red-950/50 border border-red-800/50 rounded-xl p-3 mb-5 fade-in">
                        <p className="text-red-300 text-sm text-center">⚠️ {error}</p>
                    </div>
                )}

                {/* Registration Form */}
                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Full Name */}
                    <div>
                        <label className="block text-gray-400 text-xs mb-1.5 font-medium">
                            👤 Full Name
                        </label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                            placeholder="Rajesh Kumar"
                            className="w-full bg-darker border border-gray-700 rounded-xl px-4 py-3.5
                         text-white placeholder-gray-600 focus:outline-none
                         focus:border-accent transition-colors"
                        />
                    </div>

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
                            placeholder="Min 8 characters"
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

                        {/* Password Strength Bar */}
                        {password && (
                            <div className="mt-2 fade-in">
                                <div className="flex gap-1 mb-1">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <div
                                            key={i}
                                            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= strength.level ? strength.color : "bg-gray-800"
                                                }`}
                                        />
                                    ))}
                                </div>
                                <p className={`text-xs font-medium ${strength.level <= 2 ? "text-red-400" :
                                        strength.level === 3 ? "text-blue-400" : "text-green-400"
                                    }`}>
                                    {strength.label}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-gray-400 text-xs mb-1.5 font-medium">
                            🔒 Confirm Password
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder="Re-enter your password"
                            className={`w-full bg-darker rounded-xl px-4 py-3.5 text-white 
                         placeholder-gray-600 focus:outline-none transition-colors border ${passwordsMismatch
                                    ? "border-red-500 focus:border-red-400"
                                    : passwordsMatch
                                        ? "border-green-500"
                                        : "border-gray-700 focus:border-accent"
                                }`}
                        />
                        {passwordsMismatch && (
                            <p className="text-red-400 text-xs mt-1">Passwords don't match</p>
                        )}
                        {passwordsMatch && (
                            <p className="text-green-400 text-xs mt-1">✓ Passwords match</p>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={
                            isLoading ||
                            !fullName ||
                            !email ||
                            password.length < 8 ||
                            password !== confirmPassword
                        }
                        className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r
                       from-primary to-accent text-dark disabled:opacity-50
                       hover:shadow-lg hover:shadow-accent/20 active:scale-[0.98]
                       transition-all mt-2"
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="loading-spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                                Creating account...
                            </span>
                        ) : (
                            "Create Account 🌾"
                        )}
                    </button>
                </form>

                {/* Login Link */}
                <p className="text-center text-gray-500 text-sm mt-6">
                    Already have an account?{" "}
                    <button
                        onClick={() => onNavigate("login")}
                        className="text-accent font-semibold hover:underline"
                    >
                        Login
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
