import React, { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import { useLanguage } from '../context/LanguageContext'
import { askKrishiGPT } from '../services/api'

const CROPS = [
  'Rice',
  'Wheat',
  'Tomato',
  'Potato',
  'Cotton',
  'Maize',
  'Sugarcane',
  'Soybean',
  'Groundnut',
  'Onion',
  'Chili',
  'Mango',
]

const LANG_LOCALE_MAP = {
  en: 'en-IN',
  hi: 'hi-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  mr: 'mr-IN',
  pa: 'pa-IN',
  gu: 'gu-IN',
  kn: 'kn-IN',
  bn: 'bn-IN',
  ml: 'ml-IN',
}

const QUICK_QUESTIONS = {
  en: [
    'What pesticide to use? 🧪',
    'Is it spreading? 🔴',
    'Organic solution? 🌿',
    'Cost of treatment? 💰',
    'When to spray? 📅',
  ],
  hi: [
    'कौन सा कीटनाशक इस्तेमाल करें? 🧪',
    'क्या यह फैल रहा है? 🔴',
    'जैविक उपचार? 🌿',
    'इलाज का खर्चा? 💰',
    'स्प्रे कब करें? 📅',
  ],
  mr: [
    'कोणते कीटकनाशक वापरावे? 🧪',
    'हा रोग पसरत आहे का? 🔴',
    'सेंद्रिय उपाय? 🌿',
    'उपचाराचा खर्च? 💰',
    'फवारणी कधी करावी? 📅',
  ],
  ta: [
    'என்ன பூச்சிக்கொல்லி பயன்படுத்தலாம்? 🧪',
    'இது பரவுகிறதா? 🔴',
    'இயற்கை தீர்வு? 🌿',
    'சிகிச்சை செலவு? 💰',
    'எப்போது தெளிக்க வேண்டும்? 📅',
  ],
  te: [
    'ఏ పురుగుమందు వాడాలి? 🧪',
    'ఇది వ్యాపిస్తోందా? 🔴',
    'సహజ పరిష్కారం? 🌿',
    'చికిత్స ఖర్చు? 💰',
    'ఎప్పుడు పిచికారీ చేయాలి? 📅',
  ],
  kn: [
    'ಯಾವ ಕೀಟನಾಶಕ ಬಳಸಬೇಕು? 🧪',
    'ಇದು ಹರಡುತ್ತಿದೆಯೇ? 🔴',
    'ಸಾವಯವ ಪರಿಹಾರ? 🌿',
    'ಚಿಕಿತ್ಸೆಯ ವೆಚ್ಚ? 💰',
    'ಯಾವಾಗ ಸಿಂಪಡಿಸಬೇಕು? 📅',
  ],
  gu: [
    'કઈ જંતુનાશક દવા વાપરવી? 🧪',
    'શું તે ફેલાઈ રહ્યો છે? 🔴',
    'જૈવિક ઉપાય? 🌿',
    'સારવારનો ખર્ચ? 💰',
    'ક્યારે છંટકાવ કરવો? 📅',
  ],
  pa: [
    'ਕਿਹੜਾ ਕੀਟਨਾਸ਼ਕ ਵਰਤਣਾ ਹੈ? 🧪',
    'ਕੀ ਇਹ ਫੈਲ ਰਿਹਾ ਹੈ? 🔴',
    'ਜੈਵਿਕ ਹੱਲ? 🌿',
    'ਇਲਾਜ ਦਾ ਖਰਚਾ? 💰',
    'ਕਦੋਂ ਸਪਰੇਅ ਕਰਨੀ ਹੈ? 📅',
  ],
  bn: [
    'কোন কীটনাশক ব্যবহার করব? 🧪',
    'এটি কি ছড়িয়ে পড়ছে? 🔴',
    'জৈব সমাধান? 🌿',
    'চিকিৎসার খরচ? 💰',
    'কখন স্প্রে করবেন? 📅',
  ],
  ml: [
    'ഏത് കീടനാശിനി ഉപയോഗിക്കണം? 🧪',
    'ഇത് പടരുകയാണോ? 🔴',
    'ജൈവ പരിഹാരം? 🌿',
    'ചികിത്സാ ചെലവ്? 💰',
    'എപ്പോഴാണ് സ്പ്രേ ചെയ്യേണ്ടത്? 📅',
  ],
}

const WELCOME_MESSAGES = {
  en: 'Namaskar! 🙏 I am KrishiGPT, your AI farming assistant. Ask me anything about crop diseases, treatments, or farming practices. I am here to help!',
  hi: 'नमस्कार! 🙏 मैं कृषिGPT हूं, आपका AI कृषि सहायक। फसल रोग, उपचार, या खेती के बारे में कुछ भी पूछें।',
  ta: 'வணக்கம்! 🙏 நான் கிருஷிGPT, உங்கள் AI விவசாய உதவியாளர்। பயிர் நோய்கள் பற்றி கேளுங்கள்!',
  te: 'నమస్కారం! 🙏 నేను కృషిGPT, మీ AI వ్యవసాయ సహాయకుడు। పంట వ్యాధుల గురించి అడగండి!',
  mr: 'नमस्कार! 🙏 मी कृषिGPT, तुमचा AI शेती सहाय्यक. पीक रोगांबद्दल काहीही विचारा!',
  pa: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ! 🙏 ਮੈਂ ਕ੍ਰਿਸ਼ੀGPT ਹਾਂ, ਤੁਹਾਡਾ AI ਖੇਤੀ ਸਹਾਇਕ। ਫਸਲ ਰੋਗਾਂ ਬਾਰੇ ਪੁੱਛੋ!',
  kn: 'ನಮಸ್ಕಾರ! 🙏 ನಾನು ಕೃಷಿGPT, ನಿಮ್ಮ AI ಕೃಷಿ ಸಹಾಯಕ. ಬೆಳೆ ರೋಗಗಳು ಮತ್ತು ಚಿಕಿತ್ಸೆಗಳ ಬಗ್ಗೆ ಕೇಳಿ!',
  gu: 'નમસ્કાર! 🙏 હું કૃષિGPT છું, તમારો AI કૃષિ સહાયક. પાકના રોગો અને ઉપચાર વિશે કંઈપણ પૂછો!',
  bn: 'নমস্কার! 🙏 আমি কৃষিGPT, আপনার AI কৃষি সহকারী। ফসল রোগ এবং চিকিৎসা সম্পর্কে যেকোনো প্রশ্ন করুন!',
  ml: 'നമസ്കാരം! 🙏 ഞാൻ കൃഷിGPT, നിങ്ങളുടെ AI കാർഷിക സഹായി. വിള രോഗങ്ങളെക്കുറിച്ചോ ചികിത്സയെക്കുറിച്ചോ ചോദിക്കൂ!',
}

// ── TTS Speaker Button ───────────────────────────────
function SpeakerButton({ text, language }) {
  const [isSpeaking, setIsSpeaking] = useState(false)

  const handleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      return
    }

    const synth = window.speechSynthesis
    if (!synth) return

    const utter = new SpeechSynthesisUtterance(text)
    const locale = LANG_LOCALE_MAP[language] || 'en-IN'
    utter.lang = locale

    const voices = synth.getVoices()
    const match = voices.find((v) => v.lang.startsWith(locale.split('-')[0]))
    if (match) utter.voice = match

    utter.onend = () => setIsSpeaking(false)
    utter.onerror = () => setIsSpeaking(false)

    synth.speak(utter)
    setIsSpeaking(true)
  }

  useEffect(() => {
    return () => window.speechSynthesis?.cancel()
  }, [])

  if (!window.speechSynthesis) return null

  return (
    <button
      onClick={handleSpeak}
      className={`p-1.5 rounded-full transition-all text-sm border ${
        isSpeaking
          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 animate-pulse'
          : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-secondary)] hover:border-emerald-500 hover:text-emerald-400'
      }`}
      title={isSpeaking ? 'Stop speaking' : 'Listen to response'}
    >
      {isSpeaking ? '⏹️' : '🔊'}
    </button>
  )
}

export default function KrishiGPTChat({
  language: propLanguage,
  farmerId,
  token,
  onLanguageChange,
}) {
  const { language: contextLanguage, t } = useLanguage()
  const language = propLanguage || contextLanguage || 'en'

  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: WELCOME_MESSAGES[language] || t('chat.welcome') || WELCOME_MESSAGES.en,
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCrop, setSelectedCrop] = useState('Tomato')
  const [selectedImage, setSelectedImage] = useState(null) // base64
  const [imageFile, setImageFile] = useState(null)
  const [autoTTS, setAutoTTS] = useState(false)

  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const recognitionRef = useRef(null)

  // ── Voice Input State ─────────────────────────────────
  const [isListening, setIsListening] = useState(false)
  const [voiceError, setVoiceError] = useState(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].role === 'ai') {
        return [
          {
            role: 'ai',
            text: WELCOME_MESSAGES[language] || t('chat.welcome') || WELCOME_MESSAGES.en,
            timestamp: new Date(),
          },
        ]
      }
      return prev
    })
  }, [language, t])

  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setSelectedImage(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSend = useCallback(
    async (text) => {
      const messageText = text || input.trim()
      if (!messageText && !selectedImage) return

      const userMsg = {
        role: 'user',
        text: messageText || (selectedImage ? t('disease.detected') : ''),
        image: selectedImage,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMsg])
      setInput('')
      setSelectedImage(null)
      setImageFile(null)
      setIsLoading(true)

      try {
        const response = await askKrishiGPT(
          messageText,
          selectedCrop,
          language,
          token,
          userMsg.image // send image as base64
        )

        const aiMsg = {
          role: 'ai',
          text:
            response.answer ||
            'I could not process your question. Please try again.',
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, aiMsg])

        if (autoTTS) {
          const utter = new SpeechSynthesisUtterance(aiMsg.text)
          utter.lang = LANG_LOCALE_MAP[language] || 'en-IN'
          window.speechSynthesis.speak(utter)
        }
      } catch (err) {
        const errMsg = {
          role: 'ai',
          text: t('common.error'),
          timestamp: new Date(),
          isError: true,
          retryText: messageText,
          retryImage: userMsg.image,
        }
        setMessages((prev) => [...prev, errMsg])
      } finally {
        setIsLoading(false)
      }
    },
    [input, selectedCrop, language, token, selectedImage, autoTTS]
  )

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ── Voice Input Logic ────────────────────────────────
  const startListening = useCallback(() => {
    setVoiceError(null)
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setVoiceError('Speech recognition not supported. Use Chrome.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = LANG_LOCALE_MAP[language] || 'en-IN'
    recognition.interimResults = true
    recognition.continuous = false

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0])
        .map((result) => result.transcript)
        .join('')
      setInput(transcript)
    }

    recognition.onerror = (event) => {
      console.error('STT Error', event.error)
      setIsListening(false)
      setVoiceError('Could not hear clearly. Try again.')
    }

    recognition.onend = () => setIsListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }, [language])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  const formatTime = (date) => {
    try {
      return new Date(date).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return ''
    }
  }

  const quickQuestions = QUICK_QUESTIONS[language] || QUICK_QUESTIONS.en

  return (
    <div
      className="flex flex-col bg-[var(--bg-main)]"
      style={{ height: 'calc(100vh - 120px)' }}
    >
      {/* Header Area */}
      <div className="px-4 py-4 border-b border-[var(--border)] bg-[var(--bg-main)] z-10 shadow-lg">
        <div className="flex items-center justify-between gap-4 max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30">
              <span className="text-xl">🌾</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-emerald-400 leading-none">
                {t('chat.title')}
              </h2>
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-1">
                {t('chat.subtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {CROPS.map((crop) => (
                <option key={crop} value={crop}>
                  {crop}
                </option>
              ))}
            </select>
            <button
              onClick={() => setAutoTTS(!autoTTS)}
              className={`p-2 rounded-xl border transition-all ${autoTTS ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-muted)]'}`}
              title="Auto-read AI responses"
            >
              {autoTTS ? '🔊' : '🔇'}
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 no-scrollbar bg-[var(--bg-main)]">
        <div className="max-w-2xl mx-auto space-y-6">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}
            >
              {msg.role === 'ai' && (
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 mb-1">
                  <span className="text-xs">🤖</span>
                </div>
              )}

              <div
                className={`max-w-[85%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                {msg.image && (
                  <img
                    src={msg.image}
                    alt="Uploaded"
                    className="w-48 h-48 object-cover rounded-2xl mb-2 border border-emerald-900/30 shadow-lg"
                  />
                )}

                <div
                  className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm
                                    ${
                                      msg.role === 'user'
                                        ? 'bg-emerald-600 text-white rounded-br-none'
                                        : 'bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border)] rounded-bl-none'
                                    }
                                `}
                >
                  {msg.role === 'ai' ? (
                    <div className="prose prose-sm prose-invert max-w-none prose-headings:text-emerald-400 prose-strong:text-emerald-300 prose-code:bg-[var(--bg-elevated)] prose-code:px-1 prose-code:rounded">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.text
                  )}
                </div>

                <div className="flex items-center gap-2 mt-1.5 px-1">
                  <span className="text-[10px] text-[var(--text-muted)] font-medium">
                    {formatTime(msg.timestamp)}
                  </span>
                  {msg.role === 'ai' && index > 0 && (
                    <SpeakerButton text={msg.text} language={language} />
                  )}
                  {msg.isError && msg.retryText && (
                    <button
                      onClick={() => handleSend(msg.retryText)}
                      className="text-[10px] text-[var(--accent)] font-medium hover:underline"
                    >
                      {t('common.retry')} ↻
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start items-end gap-2">
              <div className="w-8 h-8 rounded-full bg-[var(--accent-muted)] border border-[var(--accent)]/20 flex items-center justify-center flex-shrink-0 mb-1">
                <span className="text-xs">🤖</span>
              </div>
              <div className="bg-[var(--bg-card)] border border-[var(--border)] px-4 py-3 rounded-2xl rounded-bl-none shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                    <div className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                    <div className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                  </div>
                  <span className="text-xs text-[var(--text-muted)]">{t('chat.thinking')}</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Bottom Input Area */}
      <div className="p-4 bg-[var(--bg-main)] border-t border-[var(--border)] shadow-[0_-10px_20px_rgba(0,0,0,0.2)]">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Image Preview */}
          {selectedImage && (
            <div className="relative inline-block">
              <img
                src={selectedImage}
                alt="Preview"
                className="w-20 h-20 object-cover rounded-xl border-2 border-emerald-500"
              />
              <button
                onClick={() => {
                  setSelectedImage(null)
                  setImageFile(null)
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center shadow-lg"
              >
                ✕
              </button>
            </div>
          )}

          {/* Quick Suggestions */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {quickQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSend(q)}
                disabled={isLoading}
                className="flex-shrink-0 bg-[var(--bg-card)] border border-[var(--border)] rounded-full px-4 py-1.5 text-[10px] font-bold text-emerald-500 hover:bg-emerald-500/10 hover:border-emerald-500 transition-all disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Container */}
          <div className="flex items-center gap-2 bg-[#122a1b] border border-emerald-900/50 rounded-2xl p-1.5 focus-within:border-emerald-500/50 transition-all">
            <button
              onClick={() => fileInputRef.current.click()}
              className="p-2.5 rounded-xl hover:bg-[var(--accent-muted)] text-[var(--accent)]/60 hover:text-[var(--accent)] transition-all"
              title="Upload from gallery"
            >
              🖼️
            </button>
            <button
              onClick={() => {
                const camInput = document.createElement('input')
                camInput.type = 'file'
                camInput.accept = 'image/*'
                camInput.capture = 'environment'
                camInput.onchange = handleImageSelect
                camInput.click()
              }}
              className="p-2.5 rounded-xl hover:bg-[var(--accent-muted)] text-[var(--accent)]/60 hover:text-[var(--accent)] transition-all"
              title="Take photo"
            >
              📸
            </button>
            <input
              type="file"
              hidden
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageSelect}
            />

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('chat.placeholder')}
              disabled={isLoading}
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-emerald-50 placeholder-emerald-900/50 px-2"
            />

            <button
              onClick={isListening ? stopListening : startListening}
              disabled={isLoading}
              className={`p-2.5 rounded-xl transition-all ${isListening ? 'bg-red-500/20 text-red-500 animate-pulse' : 'hover:bg-emerald-500/10 text-emerald-500/70 hover:text-emerald-500'}`}
            >
              {isListening ? '⏹️' : '🎤'}
            </button>

            <button
              onClick={() => handleSend()}
              disabled={isLoading || (!input.trim() && !selectedImage)}
              className={`p-2.5 rounded-xl transition-all ${input.trim() || selectedImage ? 'bg-emerald-600 text-white shadow-lg active:scale-95' : 'text-emerald-900/50 cursor-not-allowed'}`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </button>
          </div>

          {voiceError && (
            <p className="text-[10px] text-center text-red-400 font-bold animate-fade-in">
              {voiceError}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
