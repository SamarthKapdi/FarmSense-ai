import React, { useState, useRef, useEffect, useCallback } from "react";
import LanguageSelector from "./LanguageSelector";
import { askKrishiGPT } from "../services/api";

const CROPS = [
    "Rice", "Wheat", "Tomato", "Potato", "Cotton",
    "Maize", "Sugarcane", "Soybean", "Groundnut",
    "Onion", "Chili", "Mango",
];

const LANG_LOCALE_MAP = {
    en: "en-IN",
    hi: "hi-IN",
    ta: "ta-IN",
    te: "te-IN",
    mr: "mr-IN",
    pa: "pa-IN",
};

const QUICK_QUESTIONS = {
    en: [
        "What pesticide to use? 🧪",
        "Is it spreading? 🔴",
        "Organic solution? 🌿",
        "Cost of treatment? 💰",
        "When to spray? 📅",
    ],
    hi: [
        "कौन सा कीटनाशक इस्तेमाल करें? 🧪",
        "क्या यह फैल रहा है? 🔴",
        "जैविक उपचार? 🌿",
        "इलाज का खर्चा? 💰",
        "स्प्रे कब करें? 📅",
    ],
    ta: [
        "எந்த பூச்சிக்கொல்லி பயன்படுத்த? 🧪",
        "இது பரவுகிறதா? 🔴",
        "இயற்கை தீர்வு? 🌿",
        "சிகிச்சை செலவு? 💰",
        "எப்போது தெளிக்க? 📅",
    ],
    te: [
        "ఏ పురుగుమందు వాడాలి? 🧪",
        "ఇది వ్యాపిస్తోందా? 🔴",
        "సేంద్రీయ పరిష్కారం? 🌿",
        "చికిత్స ఖర్చు? 💰",
        "ఎప్పుడు స్ప్రే చేయాలి? 📅",
    ],
    mr: [
        "कोणते कीटकनाशक वापरावे? 🧪",
        "हे पसरत आहे का? 🔴",
        "सेंद्रिय उपाय? 🌿",
        "उपचार खर्च? 💰",
        "फवारणी कधी करावी? 📅",
    ],
    pa: [
        "ਕਿਹੜਾ ਕੀਟਨਾਸ਼ਕ ਵਰਤਣਾ? 🧪",
        "ਕੀ ਇਹ ਫੈਲ ਰਿਹਾ ਹੈ? 🔴",
        "ਜੈਵਿਕ ਹੱਲ? 🌿",
        "ਇਲਾਜ ਦਾ ਖਰਚਾ? 💰",
        "ਸਪਰੇਅ ਕਦੋਂ ਕਰਨੀ? 📅",
    ],
};

const WELCOME_MESSAGES = {
    en: "Namaskar! 🙏 I am KrishiGPT, your AI farming assistant. Ask me anything about crop diseases, treatments, or farming practices. I am here to help!",
    hi: "नमस्कार! 🙏 मैं कृषिGPT हूं, आपका AI कृषि सहायक। फसल रोग, उपचार, या खेती के बारे में कुछ भी पूछें।",
    ta: "வணக்கம்! 🙏 நான் கிருஷிGPT, உங்கள் AI விவசாய உதவியாளர்। பயிர் நோய்கள் பற்றி கேளுங்கள்!",
    te: "నమస్కారం! 🙏 నేను కృషిGPT, మీ AI వ్యవసాయ సహాయకుడు। పంట వ్యాధుల గురించి అడగండి!",
    mr: "नमस्कार! 🙏 मी कृषिGPT, तुमचा AI शेती सहाय्यक. पीक रोगांबद्दल काहीही विचारा!",
    pa: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! 🙏 ਮੈਂ ਕ੍ਰਿਸ਼ੀGPT ਹਾਂ, ਤੁਹਾਡਾ AI ਖੇਤੀ ਸਹਾਇਕ। ਫਸਲ ਰੋਗਾਂ ਬਾਰੇ ਪੁੱਛੋ!",
};

// ── TTS Speaker Button ───────────────────────────────
function SpeakerButton({ text, language }) {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const utterRef = useRef(null);

    const handleSpeak = () => {
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }

        const synth = window.speechSynthesis;
        if (!synth) return;

        const utter = new SpeechSynthesisUtterance(text);
        const locale = LANG_LOCALE_MAP[language] || "en-IN";
        utter.lang = locale;

        // Try to find a matching voice
        const voices = synth.getVoices();
        const match = voices.find(v => v.lang.startsWith(locale.split("-")[0]));
        if (match) utter.voice = match;

        utter.onend = () => setIsSpeaking(false);
        utter.onerror = () => setIsSpeaking(false);
        utterRef.current = utter;

        synth.speak(utter);
        setIsSpeaking(true);
    };

    useEffect(() => {
        return () => window.speechSynthesis?.cancel();
    }, []);

    if (!window.speechSynthesis) return null;

    return (
        <button
            onClick={handleSpeak}
            className={`ml-1 p-1 rounded-full transition-all text-xs hover:bg-accent/20
                ${isSpeaking ? "text-accent animate-pulse" : "text-gray-500 hover:text-accent"}`}
            title={isSpeaking ? "Stop speaking" : "Read aloud"}
        >
            {isSpeaking ? "⏹️" : "🔉"}
        </button>
    );
}

export default function KrishiGPTChat({ language, farmerId, token, onLanguageChange }) {
    const [messages, setMessages] = useState([
        {
            role: "ai",
            text: WELCOME_MESSAGES[language] || WELCOME_MESSAGES.en,
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [selectedCrop, setSelectedCrop] = useState("Tomato");
    const messagesEndRef = useRef(null);

    // ── Voice Input State ─────────────────────────────────
    const [isListening, setIsListening] = useState(false);
    const [voiceError, setVoiceError] = useState(null);
    const recognitionRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        setMessages([
            {
                role: "ai",
                text: WELCOME_MESSAGES[language] || WELCOME_MESSAGES.en,
                timestamp: new Date(),
            },
        ]);
    }, [language]);

    const handleSend = useCallback(async (text) => {
        const messageText = text || input.trim();
        if (!messageText) return;

        const userMsg = {
            role: "user",
            text: messageText,
            timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await askKrishiGPT(
                messageText,
                selectedCrop,
                language,
                token
            );

            const aiMsg = {
                role: "ai",
                text: response.answer || "I could not process your question. Please try again.",
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, aiMsg]);
        } catch (err) {
            const errMsg = {
                role: "ai",
                text: "Sorry, I am having trouble connecting. Please check if the backend and Ollama are running, then try again.",
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errMsg]);
        } finally {
            setIsLoading(false);
        }
    }, [input, selectedCrop, language, token]);

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // ── Voice Input Logic ────────────────────────────────
    const startListening = useCallback(() => {
        setVoiceError(null);
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setVoiceError("Speech recognition not supported. Use Chrome.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = LANG_LOCALE_MAP[language] || "en-IN";
        recognition.interimResults = false;
        recognition.continuous = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            if (transcript) {
                setInput(transcript);
            }
            setIsListening(false);
        };

        recognition.onerror = (event) => {
            if (event.error === "no-speech") {
                setVoiceError("No speech detected. Try again.");
            } else if (event.error === "not-allowed") {
                setVoiceError("Microphone access denied.");
            } else {
                setVoiceError("Speech not recognized. Try again.");
            }
            setIsListening(false);
        };

        recognition.onend = () => setIsListening(false);

        recognitionRef.current = recognition;
        recognition.start();
        setIsListening(true);
    }, [language]);

    const stopListening = useCallback(() => {
        recognitionRef.current?.stop();
        setIsListening(false);
    }, []);

    const formatTime = (date) => {
        try {
            return new Date(date).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return "";
        }
    };

    const quickQuestions = QUICK_QUESTIONS[language] || QUICK_QUESTIONS.en;
    const hasSpeechRecognition = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

    return (
        <div className="flex flex-col h-screen max-w-lg mx-auto">
            {/* Top Bar */}
            <div className="px-4 pt-5 pb-3 border-b border-gray-800/50">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-bold">
                        <span className="mr-1">🌾</span>
                        <span className="gradient-text">KrishiGPT</span>
                    </h2>
                    <select
                        value={selectedCrop}
                        onChange={(e) => setSelectedCrop(e.target.value)}
                        className="bg-darker border border-gray-700 rounded-lg 
                       px-3 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none 
                       focus:border-accent"
                    >
                        {CROPS.map((crop) => (
                            <option key={crop} value={crop} className="bg-darker">
                                {crop}
                            </option>
                        ))}
                    </select>
                </div>
                <LanguageSelector
                    selectedLanguage={language}
                    onLanguageChange={onLanguageChange}
                />
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 pb-48 space-y-4">
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        {msg.role === "ai" && (
                            <div className="flex-shrink-0 w-8 h-8 bg-primary/40 
                            rounded-full flex items-center justify-center 
                            mr-2 mt-1">
                                <span className="text-sm">🌾</span>
                            </div>
                        )}
                        <div>
                            <div
                                className={
                                    msg.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"
                                }
                            >
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                    {msg.text}
                                </p>
                            </div>
                            <div className={`flex items-center gap-1 mt-1 ${msg.role === "user" ? "justify-end" : "justify-start ml-1"}`}>
                                <p className="text-xs text-gray-600">
                                    {formatTime(msg.timestamp)}
                                </p>
                                {/* TTS Speaker button on AI messages */}
                                {msg.role === "ai" && index > 0 && (
                                    <SpeakerButton text={msg.text} language={language} />
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {/* Typing Indicator */}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="flex-shrink-0 w-8 h-8 bg-primary/40 
                          rounded-full flex items-center justify-center 
                          mr-2 mt-1">
                            <span className="text-sm">🌾</span>
                        </div>
                        <div className="chat-bubble-ai">
                            <div className="dot-typing">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Bottom Input Area */}
            <div className="fixed bottom-16 left-0 right-0 bg-dark/95 
                      backdrop-blur-md border-t border-gray-800/50 
                      px-4 pt-3 pb-3 max-w-lg mx-auto">
                {/* Voice Error */}
                {voiceError && (
                    <div className="text-xs text-red-400 mb-2 flex items-center gap-1">
                        <span>⚠️</span> {voiceError}
                        <button onClick={() => setVoiceError(null)} className="ml-auto text-gray-500 hover:text-gray-300">✕</button>
                    </div>
                )}

                {/* Quick Questions */}
                <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar">
                    {quickQuestions.map((q, index) => (
                        <button
                            key={index}
                            onClick={() => handleSend(q)}
                            disabled={isLoading}
                            className="flex-shrink-0 bg-darker border border-gray-700 
                         rounded-full px-3 py-1.5 text-xs text-gray-300 
                         hover:border-accent hover:text-accent 
                         transition-colors disabled:opacity-50"
                        >
                            {q}
                        </button>
                    ))}
                </div>

                {/* Input Row */}
                <div className="flex gap-2">
                    {/* Mic Button */}
                    {hasSpeechRecognition && (
                        <button
                            onClick={isListening ? stopListening : startListening}
                            disabled={isLoading}
                            className={`px-3 rounded-xl transition-all flex items-center justify-center
                                ${isListening
                                    ? "bg-red-500/20 border border-red-500 text-red-400 animate-pulse"
                                    : "bg-darker border border-gray-700 text-gray-400 hover:border-accent hover:text-accent"
                                } disabled:opacity-50`}
                            title={isListening ? "Stop listening" : "Voice input"}
                        >
                            🎤
                        </button>
                    )}

                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={
                            language === "hi" ? "अपना सवाल लिखें..." :
                                language === "ta" ? "உங்கள் கேள்வியை எழுதுங்கள்..." :
                                    "Type your question..."
                        }
                        disabled={isLoading}
                        className="flex-1 bg-darker border border-gray-700 rounded-xl 
                       px-4 py-3 text-sm text-[var(--text-primary)] placeholder-gray-500
                       focus:outline-none focus:border-accent transition-colors
                       disabled:opacity-50"
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={!input.trim() || isLoading}
                        className={`
              px-5 rounded-xl font-bold text-lg transition-all
              ${input.trim() && !isLoading
                                ? "bg-accent text-dark hover:bg-muted active:scale-95"
                                : "bg-gray-800 text-gray-600 cursor-not-allowed"
                            }
            `}
                    >
                        ➤
                    </button>
                </div>

                {/* Voice info text */}
                {hasSpeechRecognition && (
                    <p className="text-[10px] text-gray-600 mt-1.5 text-center">
                        🎤 Voice input works best in Chrome
                    </p>
                )}
            </div>
        </div>
    );
}
