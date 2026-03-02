import React from "react";

const FEATURES = [
    { icon: "🔍", title: "Instant Disease Detection", desc: "Upload a crop photo and get AI-powered diagnosis in seconds" },
    { icon: "💬", title: "KrishiGPT AI Assistant", desc: "Ask farming questions and get expert advice powered by LLaMA3" },
    { icon: "🌐", title: "6 Indian Languages", desc: "Hindi, Tamil, Telugu, Marathi, Punjabi, and English" },
];

const STEPS = [
    { num: "1", icon: "📸", title: "Upload Photo", desc: "Take or upload a photo of your crop leaf" },
    { num: "2", icon: "🤖", title: "AI Analyzes", desc: "Our AI identifies the disease in seconds" },
    { num: "3", icon: "💊", title: "Get Treatment", desc: "Receive organic and chemical treatment plans" },
];

export default function LandingPage({ onNavigate }) {
    return (
        <div className="min-h-screen bg-dark relative overflow-hidden">
            {/* Floating Leaf Particles */}
            <div className="leaf-particles">
                {[...Array(8)].map((_, i) => (
                    <span key={i} className={`leaf-particle leaf-particle-${i}`}>🍃</span>
                ))}
            </div>

            {/* Hero Section */}
            <section className="relative z-10 px-5 pt-16 pb-12 text-center max-w-lg mx-auto">
                <div className="text-6xl mb-4 leaf-pulse">🌾</div>
                <h1 className="text-4xl font-extrabold mb-3 leading-tight">
                    <span className="gradient-text">FarmSense AI</span>
                </h1>
                <p className="text-2xl font-bold text-[var(--text-primary)] mb-3 leading-snug">
                    A Crop Doctor in Every Farmer's Pocket
                </p>
                <p className="text-gray-400 text-sm mb-8 max-w-xs mx-auto">
                    AI-powered crop disease detection in 6 Indian languages. Free for every farmer.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
                    <button
                        onClick={() => onNavigate("register")}
                        className="bg-gradient-to-r from-primary to-accent text-dark py-4 px-8 
                       rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-accent/20 
                       active:scale-[0.98] transition-all"
                    >
                        Get Started Free 🚀
                    </button>
                    <button
                        onClick={() => onNavigate("login")}
                        className="bg-darker border-2 border-accent text-accent py-4 px-8 
                       rounded-xl font-bold text-lg hover:bg-accent/10 
                       active:scale-[0.98] transition-all"
                    >
                        Login →
                    </button>
                </div>

                {/* Stats Bar */}
                <div className="flex justify-center gap-6 text-center mb-12">
                    {[
                        { val: "15+", label: "Diseases" },
                        { val: "6", label: "Languages" },
                        { val: "140M+", label: "Farmers" },
                    ].map((s) => (
                        <div key={s.label}>
                            <p className="text-accent text-2xl font-extrabold">{s.val}</p>
                            <p className="text-gray-500 text-xs">{s.label}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Feature Cards */}
            <section className="relative z-10 px-5 pb-12 max-w-lg mx-auto">
                <h2 className="text-xl font-bold text-[var(--text-primary)] text-center mb-6">
                    Why Farmers Love FarmSense AI
                </h2>
                <div className="space-y-4">
                    {FEATURES.map((f, i) => (
                        <div
                            key={i}
                            className="disease-card flex items-start gap-4 fade-in"
                            style={{ animationDelay: `${i * 0.15}s` }}
                        >
                            <div className="text-3xl flex-shrink-0">{f.icon}</div>
                            <div>
                                <h3 className="text-[var(--text-primary)] font-bold text-sm">{f.title}</h3>
                                <p className="text-gray-400 text-xs mt-1">{f.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* How It Works */}
            <section className="relative z-10 px-5 pb-12 max-w-lg mx-auto">
                <h2 className="text-xl font-bold text-[var(--text-primary)] text-center mb-6">
                    How It Works
                </h2>
                <div className="space-y-1">
                    {STEPS.map((step, i) => (
                        <React.Fragment key={i}>
                            <div className="disease-card flex items-center gap-4">
                                <div className="w-10 h-10 bg-accent text-dark rounded-full 
                              flex items-center justify-center font-extrabold flex-shrink-0">
                                    {step.num}
                                </div>
                                <div className="text-3xl flex-shrink-0">{step.icon}</div>
                                <div>
                                    <h3 className="text-[var(--text-primary)] font-bold text-sm">{step.title}</h3>
                                    <p className="text-gray-400 text-xs">{step.desc}</p>
                                </div>
                            </div>
                            {i < STEPS.length - 1 && (
                                <div className="flex justify-center">
                                    <span className="text-accent text-2xl">↓</span>
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 border-t border-gray-800 py-6 text-center">
                <p className="text-gray-600 text-xs">
                    © 2026 FarmSense AI | Built with ❤️ for Indian Farmers 🇮🇳
                </p>
                <p className="text-gray-700 text-xs mt-1">
                    AMD Slingshot 2026
                </p>
            </footer>
        </div>
    );
}
