import React, { useState, useEffect } from 'react'

const FEATURES = [
  {
    icon: '🔬',
    title: 'AI Disease Detection',
    desc: 'Upload a photo of your crop leaf — our Ollama vision model identifies diseases with 95%+ accuracy in seconds.',
    gradient: 'from-emerald-500 to-green-600',
  },
  {
    icon: '💬',
    title: 'KrishiGPT Assistant',
    desc: 'Ask any farming question. Get expert advice powered by advanced AI — treatment plans, organic solutions, and prevention tips.',
    gradient: 'from-teal-500 to-cyan-600',
  },
  {
    icon: '🌦️',
    title: 'Smart Weather Alerts',
    desc: 'Real-time weather monitoring with intelligent disease risk alerts. Know when to spray before diseases strike.',
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    icon: '🌐',
    title: '6 Indian Languages',
    desc: 'Hindi, Tamil, Telugu, Marathi, Punjabi, English — get advice in your native language for better understanding.',
    gradient: 'from-purple-500 to-pink-600',
  },
  {
    icon: '📊',
    title: 'Farm Analytics',
    desc: 'Track your scan history, disease patterns, and crop health over time with beautiful interactive dashboards.',
    gradient: 'from-orange-500 to-red-600',
  },
  {
    icon: '🛡️',
    title: 'Treatment Plans',
    desc: 'Get personalized 7-day treatment plans — organic, chemical, and preventive options with cost estimates.',
    gradient: 'from-green-500 to-emerald-600',
  },
]

const STEPS = [
  {
    num: '01',
    icon: '📸',
    title: 'Capture',
    desc: 'Take a clear photo of the affected crop leaf using your phone camera',
  },
  {
    num: '02',
    icon: '🧠',
    title: 'AI Analysis',
    desc: 'Our Ollama vision model processes the image and identifies the disease',
  },
  {
    num: '03',
    icon: '💊',
    title: 'Get Treatment',
    desc: 'Receive instant treatment plans — organic, chemical, and preventive measures',
  },
  {
    num: '04',
    icon: '📈',
    title: 'Track & Prevent',
    desc: 'Monitor your farm health with analytics and weather-based disease alerts',
  },
]

const STATS = [
  { value: '38+', label: 'Diseases Detected', icon: '🔬' },
  { value: '95%', label: 'AI Accuracy', icon: '🎯' },
  { value: '6', label: 'Languages', icon: '🌐' },
  { value: '140M+', label: 'Farmers to Serve', icon: '🌾' },
]

const TESTIMONIALS = [
  {
    name: 'Rajesh Kumar',
    location: 'Punjab',
    text: 'FarmSense AI detected wheat rust 2 weeks before it spread to my entire field. Saved my whole harvest!',
    avatar: '👨‍🌾',
  },
  {
    name: 'Lakshmi Devi',
    location: 'Tamil Nadu',
    text: 'The Hindi chatbot explained everything in simple words. Even my father understood the treatment plan.',
    avatar: '👩‍🌾',
  },
  {
    name: 'Vikram Patel',
    location: 'Gujarat',
    text: 'Weather alerts warned me about blight risk. I sprayed preventively and saved ₹40,000 in crop loss.',
    avatar: '👨‍🌾',
  },
]

export default function LandingPage({ onNavigate }) {
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const [isVisible, setIsVisible] = useState({})

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % TESTIMONIALS.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }))
          }
        })
      },
      { threshold: 0.1 }
    )

    document
      .querySelectorAll('[data-animate]')
      .forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-dark relative overflow-hidden">
      {/* ── Animated Background Grid ─────────────────────────── */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          opacity: 0.03,
          backgroundImage: `radial-gradient(circle at 1px 1px, var(--accent) 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* ── Gradient Orbs ────────────────────────────────────── */}
      <div
        style={{
          position: 'fixed',
          top: '-20%',
          right: '-10%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(82,183,136,0.08) 0%, transparent 70%)',
          filter: 'blur(40px)',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: '-20%',
          left: '-10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(45,106,79,0.1) 0%, transparent 70%)',
          filter: 'blur(40px)',
          zIndex: 0,
        }}
      />

      {/* Floating Leaf Particles */}
      <div className="leaf-particles">
        {[...Array(8)].map((_, i) => (
          <span key={i} className={`leaf-particle leaf-particle-${i}`}>
            🍃
          </span>
        ))}
      </div>

      {/* ── Navigation Bar ───────────────────────────────────── */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'rgba(4,13,10,0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(82,183,136,0.1)',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '24px' }}>🌾</span>
          <span
            className="gradient-text"
            style={{ fontSize: '18px', fontWeight: 800 }}
          >
            FarmSense AI
          </span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => onNavigate('login')}
            style={{
              background: 'transparent',
              border: '1.5px solid var(--accent)',
              color: 'var(--accent)',
              padding: '8px 20px',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(82,183,136,0.1)'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent'
            }}
          >
            Login
          </button>
          <button
            onClick={() => onNavigate('register')}
            style={{
              background:
                'linear-gradient(135deg, var(--primary), var(--accent))',
              border: 'none',
              color: '#fff',
              padding: '8px 20px',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(82,183,136,0.3)',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-1px)'
              e.target.style.boxShadow = '0 6px 20px rgba(82,183,136,0.4)'
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = '0 4px 15px rgba(82,183,136,0.3)'
            }}
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════ */}
      {/* ── HERO SECTION ─────────────────────────────────────── */}
      {/* ══════════════════════════════════════════════════════ */}
      <section
        style={{
          position: 'relative',
          zIndex: 10,
          padding: '80px 24px 60px',
          textAlign: 'center',
          maxWidth: '800px',
          margin: '0 auto',
        }}
      >
        {/* Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(82,183,136,0.1)',
            border: '1px solid rgba(82,183,136,0.2)',
            padding: '6px 16px',
            borderRadius: '50px',
            marginBottom: '24px',
            fontSize: '13px',
            color: 'var(--accent)',
            fontWeight: 600,
          }}
        >
          <span style={{ animation: 'leafGlow 2s ease-in-out infinite' }}>
            🌾
          </span>
          Powered by Spring AI + Ollama Vision
        </div>

        <h1
          style={{
            fontSize: 'clamp(32px, 6vw, 56px)',
            fontWeight: 900,
            lineHeight: 1.1,
            marginBottom: '20px',
          }}
        >
          <span style={{ color: 'var(--text-primary)' }}>
            A Crop Doctor in{' '}
          </span>
          <br />
          <span className="gradient-text">Every Farmer's Pocket</span>
        </h1>

        <p
          style={{
            fontSize: '18px',
            color: 'var(--text-secondary)',
            maxWidth: '560px',
            margin: '0 auto 40px',
            lineHeight: 1.6,
          }}
        >
          AI-powered crop disease detection with real-time treatment plans,
          weather alerts, and expert advice — in 6 Indian languages. Free for
          every farmer.
        </p>

        {/* CTA Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: '48px',
          }}
        >
          <button
            onClick={() => onNavigate('register')}
            style={{
              background: 'linear-gradient(135deg, #2D6A4F, #52B788)',
              border: 'none',
              color: '#fff',
              padding: '16px 36px',
              borderRadius: '14px',
              fontWeight: 700,
              fontSize: '17px',
              cursor: 'pointer',
              boxShadow: '0 8px 30px rgba(82,183,136,0.35)',
              transition: 'all 0.3s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)'
              e.target.style.boxShadow = '0 12px 40px rgba(82,183,136,0.45)'
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = '0 8px 30px rgba(82,183,136,0.35)'
            }}
          >
            Start Detecting Free 🚀
          </button>
          <button
            onClick={() => {
              document
                .getElementById('features')
                ?.scrollIntoView({ behavior: 'smooth' })
            }}
            style={{
              background: 'rgba(82,183,136,0.08)',
              border: '2px solid rgba(82,183,136,0.3)',
              color: 'var(--accent)',
              padding: '16px 36px',
              borderRadius: '14px',
              fontWeight: 700,
              fontSize: '17px',
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(82,183,136,0.15)'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(82,183,136,0.08)'
            }}
          >
            See How It Works ↓
          </button>
        </div>

        {/* Stats Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px',
            maxWidth: '600px',
            margin: '0 auto',
          }}
        >
          {STATS.map((s) => (
            <div
              key={s.label}
              style={{
                background: 'rgba(82,183,136,0.05)',
                border: '1px solid rgba(82,183,136,0.1)',
                borderRadius: '16px',
                padding: '16px 8px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '20px', marginBottom: '4px' }}>
                {s.icon}
              </div>
              <div
                style={{
                  color: 'var(--accent)',
                  fontSize: '22px',
                  fontWeight: 800,
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '11px',
                  marginTop: '2px',
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ */}
      {/* ── FEATURES SECTION ─────────────────────────────────── */}
      {/* ══════════════════════════════════════════════════════ */}
      <section
        id="features"
        data-animate
        style={{
          position: 'relative',
          zIndex: 10,
          padding: '80px 24px',
          maxWidth: '1100px',
          margin: '0 auto',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div
            style={{
              color: 'var(--accent)',
              fontSize: '14px',
              fontWeight: 700,
              marginBottom: '8px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}
          >
            FEATURES
          </div>
          <h2
            style={{
              fontSize: '32px',
              fontWeight: 800,
              color: 'var(--text-primary)',
            }}
          >
            Everything a Farmer Needs
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px',
          }}
        >
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="disease-card fade-in"
              style={{
                animationDelay: `${i * 0.1}s`,
                padding: '28px',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '-30px',
                  right: '-30px',
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  background: `rgba(82,183,136,0.05)`,
                }}
              />
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>
                {f.icon}
              </div>
              <h3
                style={{
                  color: 'var(--text-primary)',
                  fontWeight: 700,
                  fontSize: '16px',
                  marginBottom: '8px',
                }}
              >
                {f.title}
              </h3>
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '13px',
                  lineHeight: 1.6,
                }}
              >
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ */}
      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      {/* ══════════════════════════════════════════════════════ */}
      <section
        data-animate
        style={{
          position: 'relative',
          zIndex: 10,
          padding: '80px 24px',
          maxWidth: '900px',
          margin: '0 auto',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div
            style={{
              color: 'var(--accent)',
              fontSize: '14px',
              fontWeight: 700,
              marginBottom: '8px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}
          >
            HOW IT WORKS
          </div>
          <h2
            style={{
              fontSize: '32px',
              fontWeight: 800,
              color: 'var(--text-primary)',
            }}
          >
            Detect Diseases in 4 Simple Steps
          </h2>
        </div>

        <div style={{ display: 'grid', gap: '0px' }}>
          {STEPS.map((step, i) => (
            <div
              key={i}
              style={{ display: 'flex', gap: '20px', alignItems: 'stretch' }}
            >
              {/* Timeline */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minWidth: '50px',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    flexShrink: 0,
                    background:
                      'linear-gradient(135deg, var(--primary), var(--accent))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '14px',
                    color: '#fff',
                  }}
                >
                  {step.num}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    style={{
                      width: '2px',
                      flex: 1,
                      minHeight: '30px',
                      background:
                        'linear-gradient(to bottom, var(--accent), transparent)',
                    }}
                  />
                )}
              </div>
              {/* Content */}
              <div
                className="disease-card"
                style={{ flex: 1, marginBottom: '0' }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '6px',
                  }}
                >
                  <span style={{ fontSize: '28px' }}>{step.icon}</span>
                  <h3
                    style={{
                      color: 'var(--text-primary)',
                      fontWeight: 700,
                      fontSize: '16px',
                    }}
                  >
                    {step.title}
                  </h3>
                </div>
                <p
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: '13px',
                    lineHeight: 1.6,
                  }}
                >
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ */}
      {/* ── TESTIMONIALS ─────────────────────────────────────── */}
      {/* ══════════════════════════════════════════════════════ */}
      <section
        data-animate
        style={{
          position: 'relative',
          zIndex: 10,
          padding: '80px 24px',
          maxWidth: '700px',
          margin: '0 auto',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div
            style={{
              color: 'var(--accent)',
              fontSize: '14px',
              fontWeight: 700,
              marginBottom: '8px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}
          >
            TESTIMONIALS
          </div>
          <h2
            style={{
              fontSize: '32px',
              fontWeight: 800,
              color: 'var(--text-primary)',
            }}
          >
            Trusted by Farmers
          </h2>
        </div>

        <div
          className="disease-card"
          style={{
            textAlign: 'center',
            padding: '36px',
            minHeight: '200px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>
            {TESTIMONIALS[activeTestimonial].avatar}
          </div>
          <p
            style={{
              color: 'var(--text-primary)',
              fontSize: '16px',
              lineHeight: 1.7,
              fontStyle: 'italic',
              marginBottom: '16px',
            }}
          >
            "{TESTIMONIALS[activeTestimonial].text}"
          </p>
          <div>
            <p
              style={{
                color: 'var(--accent)',
                fontWeight: 700,
                fontSize: '14px',
              }}
            >
              {TESTIMONIALS[activeTestimonial].name}
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
              {TESTIMONIALS[activeTestimonial].location}
            </p>
          </div>

          {/* Dots */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '20px',
            }}
          >
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveTestimonial(i)}
                style={{
                  width: i === activeTestimonial ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  background:
                    i === activeTestimonial
                      ? 'var(--accent)'
                      : 'rgba(82,183,136,0.3)',
                  transition: 'all 0.3s',
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ */}
      {/* ── FINAL CTA ───────────────────────────────────────── */}
      {/* ══════════════════════════════════════════════════════ */}
      <section
        style={{
          position: 'relative',
          zIndex: 10,
          padding: '80px 24px',
          textAlign: 'center',
          maxWidth: '700px',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            background:
              'linear-gradient(145deg, rgba(45,106,79,0.2), rgba(4,13,10,0.8))',
            border: '1px solid rgba(82,183,136,0.2)',
            borderRadius: '24px',
            padding: '48px 32px',
          }}
        >
          <h2
            style={{
              fontSize: '28px',
              fontWeight: 800,
              color: 'var(--text-primary)',
              marginBottom: '12px',
            }}
          >
            Ready to Protect Your Crops?
          </h2>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '15px',
              marginBottom: '32px',
            }}
          >
            Join thousands of farmers using AI to detect diseases early and save
            their harvest.
          </p>
          <button
            onClick={() => onNavigate('register')}
            style={{
              background: 'linear-gradient(135deg, #2D6A4F, #52B788)',
              border: 'none',
              color: '#fff',
              padding: '16px 48px',
              borderRadius: '14px',
              fontWeight: 700,
              fontSize: '17px',
              cursor: 'pointer',
              boxShadow: '0 8px 30px rgba(82,183,136,0.35)',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)'
            }}
          >
            Create Free Account 🌾
          </button>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ */}
      {/* ── FOOTER ──────────────────────────────────────────── */}
      {/* ══════════════════════════════════════════════════════ */}
      <footer
        style={{
          position: 'relative',
          zIndex: 10,
          borderTop: '1px solid rgba(82,183,136,0.1)',
          padding: '32px 24px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '24px',
            marginBottom: '16px',
            flexWrap: 'wrap',
          }}
        >
          {['Spring Boot', 'React', 'Spring AI', 'Ollama', 'PostgreSQL'].map(
            (tech) => (
              <span
                key={tech}
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '12px',
                  background: 'rgba(82,183,136,0.05)',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  border: '1px solid rgba(82,183,136,0.1)',
                }}
              >
                {tech}
              </span>
            )
          )}
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
          © 2026 FarmSense AI — Built with ❤️ for Indian Farmers 🇮🇳
        </p>
        <p
          style={{
            color: 'rgba(255,255,255,0.2)',
            fontSize: '11px',
            marginTop: '4px',
          }}
        >
          By{' '}
          <a
            href="https://github.com/SamarthKapdi"
            style={{ color: 'var(--accent)', textDecoration: 'none' }}
          >
            Samarth Kapdi
          </a>
        </p>
      </footer>
    </div>
  )
}
