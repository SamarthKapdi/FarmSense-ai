import React, { useState, useEffect } from 'react'

const FEATURES = [
  {
    icon: '🔬',
    title: 'AI Disease Detection',
    desc: 'Upload a photo of your crop leaf — our vision model identifies diseases with 95%+ accuracy in seconds.',
    tag: 'Core AI',
  },
  {
    icon: '💬',
    title: 'KrishiGPT Assistant',
    desc: 'Ask any farming question. Get expert advice — treatment plans, organic solutions, and prevention tips.',
    tag: 'Chat AI',
  },
  {
    icon: '🌦️',
    title: 'Smart Weather Alerts',
    desc: 'Real-time weather monitoring with intelligent disease risk alerts. Know when to spray before diseases strike.',
    tag: 'Intelligence',
  },
  {
    icon: '🌐',
    title: '6 Indian Languages',
    desc: 'Hindi, Tamil, Telugu, Marathi, Punjabi, English — get advice in your native language.',
    tag: 'Multilingual',
  },
  {
    icon: '📊',
    title: 'Farm Analytics',
    desc: 'Track your scan history, disease patterns, and crop health over time with interactive dashboards.',
    tag: 'Insights',
  },
  {
    icon: '🛡️',
    title: 'Treatment Plans',
    desc: 'Personalized 7-day treatment plans — organic, chemical, and preventive options with cost estimates.',
    tag: 'Actionable',
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
    desc: 'Our vision model processes the image and identifies the disease instantly',
  },
  {
    num: '03',
    icon: '💊',
    title: 'Get Treatment',
    desc: 'Receive instant treatment plans — organic, chemical, and preventive measures',
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
    location: 'Punjab, India',
    text: 'FarmSense AI detected wheat rust 2 weeks before it spread to my entire field. Saved my whole harvest!',
    avatar: '👨‍🌾',
    crop: 'Wheat',
  },
  {
    name: 'Lakshmi Devi',
    location: 'Tamil Nadu, India',
    text: 'The Hindi chatbot explained everything in simple words. Even my father understood the treatment plan.',
    avatar: '👩‍🌾',
    crop: 'Rice',
  },
  {
    name: 'Vikram Patel',
    location: 'Gujarat, India',
    text: 'Weather alerts warned me about blight risk. I sprayed preventively and saved ₹40,000 in crop loss.',
    avatar: '👨‍🌾',
    crop: 'Tomato',
  },
]

export default function LandingPage({ onNavigate }) {
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % TESTIMONIALS.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-main)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* ── Ambient Background ─────────────────────────────── */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
        }}
      >
        {/* Dot grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.03,
            backgroundImage: `radial-gradient(circle at 1px 1px, var(--accent) 1px, transparent 0)`,
            backgroundSize: '48px 48px',
          }}
        />
        {/* Top-right orb */}
        <div
          style={{
            position: 'absolute',
            top: '-15%',
            right: '-10%',
            width: '700px',
            height: '700px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(5,150,105,0.1) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        {/* Bottom-left orb */}
        <div
          style={{
            position: 'absolute',
            bottom: '-20%',
            left: '-10%',
            width: '550px',
            height: '550px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(52,211,153,0.07) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
      </div>

      {/* Floating Leaf Particles */}
      <div className="leaf-particles">
        {[...Array(8)].map((_, i) => (
          <span key={i} className={`leaf-particle leaf-particle-${i}`}>
            🍃
          </span>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ── NAVIGATION BAR ──────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════ */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: scrolled ? 'var(--glass-bg)' : 'transparent',
          backdropFilter: scrolled ? 'blur(24px)' : 'none',
          borderBottom: scrolled
            ? '1px solid var(--border)'
            : '1px solid transparent',
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'all 0.4s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '28px' }}>🌾</span>
          <span
            className="gradient-text"
            style={{
              fontSize: '20px',
              fontWeight: 800,
              letterSpacing: '-0.5px',
            }}
          >
            FarmSense AI
          </span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={() => onNavigate('login')}
            className="btn-ghost"
            style={{ padding: '10px 24px', fontSize: '14px' }}
          >
            Login
          </button>
          <button
            onClick={() => onNavigate('register')}
            className="btn-primary"
            style={{ padding: '10px 24px', fontSize: '14px' }}
          >
            Get Started →
          </button>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ── HERO SECTION ──────────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section
        style={{
          position: 'relative',
          zIndex: 10,
          padding: '100px 24px 80px',
          textAlign: 'center',
          maxWidth: '820px',
          margin: '0 auto',
        }}
      >
        {/* Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--accent-muted)',
            border: '1px solid var(--border)',
            padding: '8px 20px',
            borderRadius: '9999px',
            marginBottom: '28px',
            fontSize: '13px',
            color: 'var(--accent)',
            fontWeight: 600,
          }}
        >
          <span className="leaf-pulse" style={{ fontSize: '16px' }}>
            🌾
          </span>
          Powered by Gemini Vision + Groq Chat
        </div>

        <h1
          style={{
            fontSize: 'clamp(36px, 6vw, 64px)',
            fontWeight: 900,
            lineHeight: 1.08,
            marginBottom: '24px',
            letterSpacing: '-1.5px',
          }}
        >
          <span style={{ color: 'var(--text-primary)' }}>AI-Powered Smart</span>
          <br />
          <span className="gradient-text">Farming Platform</span>
        </h1>

        <p
          style={{
            fontSize: '18px',
            color: 'var(--text-secondary)',
            maxWidth: '560px',
            margin: '0 auto 44px',
            lineHeight: 1.7,
            fontWeight: 400,
          }}
        >
          Detect crop diseases instantly, get treatment plans in your language,
          and protect your harvest with AI — free for every farmer.
        </p>

        {/* CTA Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: '56px',
          }}
        >
          <button
            onClick={() => onNavigate('register')}
            className="btn-primary"
            style={{ padding: '18px 40px', fontSize: '17px' }}
          >
            Start Detecting Free 🚀
          </button>
          <button
            onClick={() =>
              document
                .getElementById('features')
                ?.scrollIntoView({ behavior: 'smooth' })
            }
            className="btn-ghost"
            style={{ padding: '18px 40px', fontSize: '17px' }}
          >
            See How It Works ↓
          </button>
        </div>

        {/* Stats Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
            maxWidth: '640px',
            margin: '0 auto',
          }}
        >
          {STATS.map((s) => (
            <div
              key={s.label}
              className="card"
              style={{
                padding: '18px 8px',
                textAlign: 'center',
                cursor: 'default',
              }}
            >
              <div style={{ fontSize: '22px', marginBottom: '6px' }}>
                {s.icon}
              </div>
              <div
                style={{
                  color: 'var(--accent)',
                  fontSize: '24px',
                  fontWeight: 800,
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '11px',
                  marginTop: '2px',
                  fontWeight: 500,
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ── FEATURES SECTION ─────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section
        id="features"
        style={{
          position: 'relative',
          zIndex: 10,
          padding: '80px 24px',
          maxWidth: '1100px',
          margin: '0 auto',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <div className="section-label">FEATURES</div>
          <h2 className="section-heading">Everything a Farmer Needs</h2>
        </div>

        <div
          className="stagger-in"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px',
          }}
        >
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="card"
              style={{
                padding: '32px',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'default',
              }}
            >
              {/* Decorative circle */}
              <div
                style={{
                  position: 'absolute',
                  top: '-24px',
                  right: '-24px',
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  background: 'var(--accent-muted)',
                }}
              />
              <div
                style={{
                  display: 'inline-flex',
                  padding: '10px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--accent-muted)',
                  marginBottom: '16px',
                  fontSize: '28px',
                }}
              >
                {f.icon}
              </div>
              <div
                style={{
                  display: 'inline-block',
                  marginLeft: '12px',
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--accent-muted)',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--accent)',
                }}
              >
                {f.tag}
              </div>
              <h3
                style={{
                  color: 'var(--text-primary)',
                  fontWeight: 700,
                  fontSize: '17px',
                  marginBottom: '8px',
                  marginTop: '12px',
                }}
              >
                {f.title}
              </h3>
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '14px',
                  lineHeight: 1.7,
                }}
              >
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section
        style={{
          position: 'relative',
          zIndex: 10,
          padding: '80px 24px',
          maxWidth: '900px',
          margin: '0 auto',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <div className="section-label">HOW IT WORKS</div>
          <h2 className="section-heading">Three Simple Steps</h2>
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
                  minWidth: '56px',
                }}
              >
                <div
                  className="btn-primary"
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: 'var(--radius-lg)',
                    flexShrink: 0,
                    padding: 0,
                    fontSize: '15px',
                    boxShadow: 'var(--shadow-glow)',
                  }}
                >
                  {step.num}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    style={{
                      width: '2px',
                      flex: 1,
                      minHeight: '24px',
                      background:
                        'linear-gradient(to bottom, var(--accent), transparent)',
                    }}
                  />
                )}
              </div>
              {/* Content */}
              <div className="card" style={{ flex: 1, marginBottom: '0' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '8px',
                  }}
                >
                  <span style={{ fontSize: '28px' }}>{step.icon}</span>
                  <h3
                    style={{
                      color: 'var(--text-primary)',
                      fontWeight: 700,
                      fontSize: '17px',
                    }}
                  >
                    {step.title}
                  </h3>
                </div>
                <p
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: '14px',
                    lineHeight: 1.7,
                  }}
                >
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ── TESTIMONIALS ──────────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════ */}
      <section
        style={{
          position: 'relative',
          zIndex: 10,
          padding: '80px 24px',
          maxWidth: '700px',
          margin: '0 auto',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div className="section-label">TESTIMONIALS</div>
          <h2 className="section-heading">Trusted by Farmers</h2>
        </div>

        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '44px 36px',
            minHeight: '220px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>
            {TESTIMONIALS[activeTestimonial].avatar}
          </div>
          <p
            style={{
              color: 'var(--text-primary)',
              fontSize: '17px',
              lineHeight: 1.8,
              fontStyle: 'italic',
              marginBottom: '20px',
              fontWeight: 400,
            }}
          >
            "{TESTIMONIALS[activeTestimonial].text}"
          </p>
          <div>
            <p
              style={{
                color: 'var(--accent)',
                fontWeight: 700,
                fontSize: '15px',
              }}
            >
              {TESTIMONIALS[activeTestimonial].name}
            </p>
            <p
              style={{
                color: 'var(--text-muted)',
                fontSize: '13px',
                marginTop: '2px',
              }}
            >
              {TESTIMONIALS[activeTestimonial].location} •{' '}
              {TESTIMONIALS[activeTestimonial].crop} Farmer
            </p>
          </div>

          {/* Dots */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '24px',
            }}
          >
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveTestimonial(i)}
                style={{
                  width: i === activeTestimonial ? '28px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  background:
                    i === activeTestimonial
                      ? 'linear-gradient(90deg, var(--primary), var(--accent))'
                      : 'var(--border)',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ── FINAL CTA ─────────────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════ */}
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
              'linear-gradient(145deg, var(--accent-muted), var(--bg-card))',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-2xl)',
            padding: '56px 36px',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <h2
            style={{
              fontSize: '30px',
              fontWeight: 800,
              color: 'var(--text-primary)',
              marginBottom: '14px',
              letterSpacing: '-0.5px',
            }}
          >
            Ready to Protect Your Crops?
          </h2>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '16px',
              marginBottom: '36px',
              lineHeight: 1.7,
            }}
          >
            Join thousands of farmers using AI to detect diseases early and save
            their harvest.
          </p>
          <button
            onClick={() => onNavigate('register')}
            className="btn-primary"
            style={{ padding: '18px 48px', fontSize: '17px' }}
          >
            Create Free Account 🌾
          </button>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ── FOOTER ────────────────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════ */}
      <footer
        style={{
          position: 'relative',
          zIndex: 10,
          borderTop: '1px solid var(--border)',
          padding: '36px 24px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '20px',
            flexWrap: 'wrap',
          }}
        >
          {['Spring Boot', 'React', 'Gemini', 'Groq', 'PostgreSQL'].map(
            (tech) => (
              <span
                key={tech}
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '12px',
                  fontWeight: 500,
                  background: 'var(--accent-muted)',
                  padding: '5px 14px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border)',
                }}
              >
                {tech}
              </span>
            )
          )}
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
          © 2026 FarmSense AI — Built with ❤️ for Indian Farmers 🇮🇳
        </p>
        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: '11px',
            marginTop: '6px',
            opacity: 0.6,
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
