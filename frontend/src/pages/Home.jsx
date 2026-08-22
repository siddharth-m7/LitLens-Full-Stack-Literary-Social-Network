import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const FEATURES = [
  { num: '01', title: 'Discover Books', desc: 'Browse a curated collection across genres. Filter by rating, genre, or sort by newest.' },
  { num: '02', title: 'Write Reviews', desc: 'Share your take with ratings and help other readers decide what to read next.' },
  { num: '03', title: 'Follow Readers', desc: 'Connect with fellow readers, follow their activity, and grow your literary circle.' },
  { num: '04', title: 'Track Reading', desc: 'Organise books into Want to Read, Reading, and Finished lists.' },
  { num: '05', title: 'Earn Badges', desc: 'Get recognised as an Early Adopter, Book Worm, or Top Reviewer each month.' },
  { num: '06', title: 'Leaderboard', desc: 'Compete with other reviewers and climb the monthly leaderboard.' },
];

const STATS = [
  { value: '1,000+', label: 'Books Catalogued' },
  { value: '88%',    label: 'Reader Satisfaction' },
  { value: '5,000+', label: 'Reviews Written' },
  { value: '12',     label: 'Genres Covered' },
];

const TESTIMONIALS = [
  { quote: "LitLens completely changed how I track my reading. The community reviews are honest and detailed.", name: "Aisha K.", role: "Book Worm · 42 reviews", avatar: "A" },
  { quote: "I love being able to follow readers with similar tastes and see what they're reading right now.", name: "Marcus T.", role: "Top Reviewer · 89 reviews", avatar: "M" },
  { quote: "The badges and leaderboard keep me motivated to read more and write better reviews every month.", name: "Priya S.", role: "Early Adopter · 27 reviews", avatar: "P" },
];

const s = {
  /* Layout */
  page: { backgroundColor: '#f8f8f8', minHeight: '100vh' },
  container: { maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem' },

  /* Hero */
  hero: { backgroundColor: '#ffffff', borderBottom: '1px solid #e5e5e5', padding: '96px 0 80px', overflow: 'hidden', position: 'relative' },
  heroDots: { position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(#e5e5e5 1px, transparent 1px), linear-gradient(90deg, #e5e5e5 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.5 },
  heroInner: { maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' },
  heroLabel: { display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6b7280', marginBottom: '24px' },
  heroLabelDot: { width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' },
  h1: { fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 900, color: '#0a0a0a', lineHeight: 1.08, letterSpacing: '-0.02em', marginBottom: '28px', textAlign: 'center' },
  heroHighlight: { color: '#d97706' },
  heroSub: { fontSize: '16px', color: '#6b7280', lineHeight: 1.75, maxWidth: '580px', margin: '0 auto 40px', textAlign: 'center' },
  heroCtas: { display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '56px' },
  btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#0a0a0a', color: '#ffffff', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '12px 24px', borderRadius: '4px', border: '1.5px solid #0a0a0a', cursor: 'pointer', textDecoration: 'none', transition: 'all 0.15s' },
  btnOutline: { display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: 'transparent', color: '#6b7280', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '12px 24px', borderRadius: '4px', border: '1.5px solid #e5e5e5', cursor: 'pointer', textDecoration: 'none', transition: 'all 0.15s' },

  /* Stats strip */
  statsStrip: { backgroundColor: '#ffffff', borderTop: '1px solid #e5e5e5', borderBottom: '1px solid #e5e5e5' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0' },
  statCell: { padding: '28px 24px', borderRight: '1px solid #e5e5e5', textAlign: 'center' },
  statValue: { fontSize: '28px', fontWeight: 800, color: '#0a0a0a', letterSpacing: '-0.02em', display: 'block', marginBottom: '4px' },
  statLabel: { fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca3af' },

  /* Features dark section */
  featuresDark: { backgroundColor: '#0a0a0a', padding: '80px 0' },
  sectionLabel: { fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#22c55e', marginBottom: '12px' },
  h2dark: { fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', marginBottom: '48px' },
  featuresGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', backgroundColor: '#1f1f1f' },
  featureCard: { backgroundColor: '#0a0a0a', padding: '32px 28px', borderRight: 'none', transition: 'background-color 0.15s', cursor: 'default' },
  featureNum: { fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', color: '#4b5563', marginBottom: '16px' },
  featureTitle: { fontSize: '15px', fontWeight: 700, color: '#ffffff', marginBottom: '10px' },
  featureDesc: { fontSize: '13px', color: '#6b7280', lineHeight: 1.65 },

  /* About section */
  aboutSection: { backgroundColor: '#ffffff', padding: '80px 0' },
  aboutGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'center' },
  h2light: { fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, color: '#0a0a0a', letterSpacing: '-0.02em', marginBottom: '20px' },
  aboutText: { fontSize: '14px', color: '#6b7280', lineHeight: 1.8, marginBottom: '16px' },
  aboutCard: { backgroundColor: '#f8f8f8', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' },
  aboutCardStat: { borderBottom: '1px solid #e5e5e5', paddingBottom: '20px' },
  aboutCardStatVal: { fontSize: '32px', fontWeight: 800, color: '#0a0a0a', display: 'block' },
  aboutCardStatLbl: { fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca3af' },

  /* Testimonials */
  testiSection: { backgroundColor: '#f8f8f8', padding: '80px 0' },
  testiGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' },
  testiCard: { backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '6px', padding: '28px 24px' },
  testiQuote: { fontSize: '14px', color: '#374151', lineHeight: 1.75, marginBottom: '20px', fontStyle: 'italic' },
  testiAvatar: { width: '34px', height: '34px', borderRadius: '50%', backgroundColor: '#0a0a0a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, flexShrink: 0 },
  testiName: { fontSize: '13px', fontWeight: 700, color: '#0a0a0a' },
  testiRole: { fontSize: '11px', color: '#9ca3af', letterSpacing: '0.04em' },

  /* CTA banner */
  ctaBanner: { backgroundColor: '#ffffff', borderTop: '1px solid #e5e5e5', padding: '80px 0', textAlign: 'center' },
  ctaLabel: { fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: '16px' },
  h2cta: { fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 900, color: '#0a0a0a', letterSpacing: '-0.02em', marginBottom: '16px' },
  ctaSub: { fontSize: '15px', color: '#6b7280', marginBottom: '40px' },
  ctaBtns: { display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' },
  btnCtaPrimary: { display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#0a0a0a', color: '#ffffff', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '14px 28px', borderRadius: '4px', border: 'none', cursor: 'pointer', textDecoration: 'none' },
  btnCtaSecondary: { display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: 'transparent', color: '#6b7280', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '14px 28px', borderRadius: '4px', border: '1px solid #e5e5e5', cursor: 'pointer', textDecoration: 'none' },
};

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={s.page}>

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section style={s.hero}>
        <div style={s.heroDots} />
        <div style={s.heroInner}>
          <div className={`fade-up ${mounted ? 'in' : ''}`} style={{ transitionDelay: '0ms' }}>
            <span style={s.heroLabel}>
              <span style={s.heroLabelDot} />
              LitLens · Literary Social Network
            </span>
          </div>

          <h1 className={`fade-up ${mounted ? 'in' : ''}`} style={{ ...s.h1, transitionDelay: '60ms' }}>
            Discover Books<br />
            that <span style={s.heroHighlight} className="gradient-text-amber">Transform</span><br />
            Your Reading Life.
          </h1>

          <p className={`fade-up ${mounted ? 'in' : ''}`} style={{ ...s.heroSub, transitionDelay: '130ms' }}>
            Your literary social network — find your next favorite book, share honest reviews, and connect with a community of passionate readers.
          </p>

          <div className={`fade-up ${mounted ? 'in' : ''}`} style={{ ...s.heroCtas, transitionDelay: '200ms' }}>
            {user ? (
              <button
                style={s.btnPrimary}
                onClick={() => navigate('/dashboard')}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#262626')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0a0a0a')}
              >
                Go to Dashboard →
              </button>
            ) : (
              <>
                <Link
                  to="/register"
                  style={s.btnPrimary}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#262626')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0a0a0a')}
                >
                  Get Started →
                </Link>
                <Link
                  to="/login"
                  style={s.btnOutline}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#0a0a0a';
                    e.currentTarget.style.color = '#0a0a0a';
                    e.currentTarget.style.backgroundColor = '#f3f3f3';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e5e5';
                    e.currentTarget.style.color = '#6b7280';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  Sign In
                </Link>
              </>
            )}
          </div>

          {/* Social proof */}
          <div className={`fade-up ${mounted ? 'in' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '14px', transitionDelay: '280ms' }}>
            <div style={{ display: 'flex' }}>
              {['A', 'M', 'P', 'R', 'S'].map((l, i) => (
                <div key={l} style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid #ffffff', backgroundColor: '#0a0a0a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, marginLeft: i === 0 ? 0 : '-8px', zIndex: 5 - i, position: 'relative' }}>{l}</div>
              ))}
            </div>
            <p style={{ fontSize: '12px', color: '#6b7280' }}>
              <span style={{ color: '#0a0a0a', fontWeight: 600 }}>500+ readers</span> already on LitLens
            </p>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ───────────────────────────────────────────── */}
      <section style={s.statsStrip}>
        <div style={{ ...s.statsGrid }} className="stats-responsive">
          {STATS.map(({ value, label }, i) => (
            <div key={label} style={{ ...s.statCell, borderRight: i < STATS.length - 1 ? '1px solid #e5e5e5' : 'none' }}>
              <span style={s.statValue}>{value}</span>
              <span style={s.statLabel}>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── MARQUEE ───────────────────────────────────────────────── */}
      <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e5e5e5', padding: '14px 0', overflow: 'hidden' }}>
        <div className="animate-marquee" style={{ display: 'flex', whiteSpace: 'nowrap', gap: '0' }}>
          {[...Array(2)].map((_, pass) => (
            <div key={pass} style={{ display: 'flex', alignItems: 'center', gap: '32px', paddingRight: '32px' }}>
              {['Discover Books', 'Write Reviews', 'Follow Readers', 'Earn Badges', 'Track Progress', 'Climb Leaderboard', 'Share Your Shelf', 'Find Your Genre'].map(t => (
                <span key={t} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9ca3af' }}>
                  <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#d1d5db', flexShrink: 0 }} />
                  {t}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES (dark) ───────────────────────────────────────── */}
      <section style={s.featuresDark}>
        <div style={s.container}>
          <p style={s.sectionLabel}>Everything you need</p>
          <h2 style={s.h2dark}>Built for modern readers</h2>

          <div style={s.featuresGrid} className="features-responsive">
            {FEATURES.map(({ num, title, desc }) => (
              <div key={num} style={s.featureCard}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#111'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#0a0a0a'}>
                <p style={s.featureNum}>{num}</p>
                <h3 style={s.featureTitle}>{title}</h3>
                <p style={s.featureDesc}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT ─────────────────────────────────────────────────── */}
      <section style={s.aboutSection}>
        <div style={s.container}>
          <div style={s.aboutGrid} className="about-responsive">
            <div>
              <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6b7280', marginBottom: '12px' }}>About Us</p>
              <h2 style={s.h2light}>
                A reading community<br />built for book lovers.
              </h2>
              <p style={s.aboutText}>
                LitLens brings together discovery, community, and personal tracking in one beautifully simple platform. Whether you read one book a year or a hundred, this is your home.
              </p>
              <p style={s.aboutText}>
                We believe reading is better together. Our social features let you follow friends, share discoveries, and build a reading identity that reflects who you truly are.
              </p>
              <Link to="/about" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0a0a0a', textDecoration: 'none', borderBottom: '2px solid #0a0a0a', paddingBottom: '2px', marginTop: '8px' }}>
                Learn More →
              </Link>
            </div>
            <div style={s.aboutCard}>
              {[{ val: '1,000+', lbl: 'Books in our library' }, { val: '5,000+', lbl: 'Community reviews' }, { val: '500+', lbl: 'Active readers' }].map(({ val, lbl }, i) => (
                <div key={lbl} style={{ ...(i < 2 ? s.aboutCardStat : {}), paddingBottom: i < 2 ? '20px' : 0 }}>
                  <span style={s.aboutCardStatVal}>{val}</span>
                  <span style={s.aboutCardStatLbl}>{lbl}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────────── */}
      <section style={s.testiSection}>
        <div style={s.container}>
          <p style={{ ...s.sectionLabel, color: '#9ca3af', marginBottom: '12px' }}>What people are saying</p>
          <h2 style={{ ...s.h2light, marginBottom: '40px' }}>Loved by the community</h2>
          <div style={s.testiGrid} className="testi-responsive">
            {TESTIMONIALS.map(({ quote, name, role, avatar }) => (
              <div key={name} style={s.testiCard}>
                {/* Stars */}
                <div style={{ display: 'flex', gap: '3px', marginBottom: '16px' }}>
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} width="14" height="14" fill="#f59e0b" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  ))}
                </div>
                <p style={s.testiQuote}>"{quote}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={s.testiAvatar}>{avatar}</div>
                  <div>
                    <p style={s.testiName}>{name}</p>
                    <p style={s.testiRole}>{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ────────────────────────────────────────────── */}
      <section style={s.ctaBanner}>
        <div style={{ ...s.container, textAlign: 'center' }}>
          <p style={s.ctaLabel}>Join the community</p>
          <h2 style={s.h2cta}>Ready to start reading?</h2>
          <p style={s.ctaSub}>Create a free account and become part of LitLens today.</p>
          <div style={s.ctaBtns}>
            {user ? (
              <button
                style={s.btnCtaPrimary}
                onClick={() => navigate('/dashboard')}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#262626')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0a0a0a')}
              >
                Go to Dashboard →
              </button>
            ) : (
              <>
                <Link
                  to="/register"
                  style={s.btnCtaPrimary}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#262626')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0a0a0a')}
                >
                  Create Your Account →
                </Link>
                <Link
                  to="/login"
                  style={s.btnCtaSecondary}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#0a0a0a';
                    e.currentTarget.style.color = '#0a0a0a';
                    e.currentTarget.style.backgroundColor = '#f3f3f3';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e5e5';
                    e.currentTarget.style.color = '#6b7280';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 768px) {
          .stats-responsive { grid-template-columns: repeat(2, 1fr) !important; }
          .features-responsive { grid-template-columns: 1fr !important; }
          .about-responsive { grid-template-columns: 1fr !important; }
          .testi-responsive { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
