import { Link } from 'react-router-dom';
import Avatar, { genConfig } from 'react-nice-avatar';

const devAvatarConfig = genConfig({
  sex: 'man',
  faceColor: '#F9C9B6',
  earSize: 'small',
  eyeStyle: 'oval',
  noseStyle: 'short',
  mouthStyle: 'smile',
  shirtStyle: 'hoody',
  glassesStyle: 'round',
  hairColor: '#000',
  hairStyle: 'thick',
  hatStyle: 'none',
  shirtColor: '#0a0a0a',
  bgColor: '#f3f3f3',
});

const FEATURES = [
  {
    num: '01',
    title: 'Curated Discovery',
    desc: 'Filter books by genre, average reader rating, or publication recency with instant reactive debouncing.',
  },
  {
    num: '02',
    title: 'In-Depth Reviews',
    desc: 'Structured reviews with star ratings, pros & cons, custom tags, and image attachments.',
  },
  {
    num: '03',
    title: 'Social Circle',
    desc: 'Follow fellow bibliophiles, track reading activity in real-time, and discover mutual favorites.',
  },
  {
    num: '04',
    title: 'Reading Shelves',
    desc: 'Organize your library across Want to Read, Currently Reading, and Finished states.',
  },
  {
    num: '05',
    title: 'Achievement Badges',
    desc: 'Earn recognition badges including Early Adopter, Book Worm, and Top Monthly Reviewer.',
  },
  {
    num: '06',
    title: 'Multi-Period Leaderboard',
    desc: 'Compete for monthly, annual, and all-time rankings with community recognition.',
  },
];

const TECH_STACK = [
  { label: 'Client Framework', value: 'React 19 + Vite' },
  { label: 'Styling System', value: 'Tailwind CSS 4 + Modern CSS Variables' },
  { label: 'State Management', value: 'TanStack React Query v5' },
  { label: 'API Server', value: 'Node.js + Express 5' },
  { label: 'Database', value: 'MongoDB Atlas + Mongoose 8' },
  { label: 'Authentication', value: 'JWT + Role-Based Access Control (RBAC)' },
  { label: 'Image Hosting', value: 'Cloudinary Media API' },
  { label: 'Caching Tier', value: 'In-Memory Cache with TTL & Pattern Purging' },
];

const CP_STATS = [
  {
    platform: 'LeetCode',
    rank: 'Knight · 1966 Rating',
    highlight: 'Top 3% Globally · 500+ Solved',
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
  },
  {
    platform: 'CodeChef',
    rank: '4★ · 1806 Max Rating',
    highlight: 'Long Challenge Specialist',
    color: '#b45309',
    bg: '#fef3c7',
    border: '#fed7aa',
  },
  {
    platform: 'Codeforces',
    rank: 'Specialist · 1410 Rating',
    highlight: 'Active Contest Participant',
    color: '#2563eb',
    bg: '#eff6ff',
    border: '#bfdbfe',
  },
];

const SOCIAL_LINKS = [
  {
    label: 'Portfolio',
    href: 'https://siddharth-mishra.vercel.app/',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/siddharthm7/',
    icon: (
      <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
      </svg>
    ),
  },
  {
    label: 'GitHub',
    href: 'https://github.com/siddharth-m7',
    icon: (
      <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z" />
      </svg>
    ),
  },
  {
    label: 'Email',
    href: 'mailto:siddharth4386@gmail.com',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
];

export default function AboutPage() {
  return (
    <div style={{ backgroundColor: '#f8f8f8', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>

      {/* ── HERO BANNER ────────────────────────────────────────── */}
      <div
        style={{
          backgroundColor: '#ffffff',
          backgroundImage:
            'linear-gradient(#e5e5e5 1px, transparent 1px), linear-gradient(90deg, #e5e5e5 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          borderBottom: '1px solid #e5e5e5',
          padding: '64px 0 52px',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '860px', margin: '0 auto', padding: '0 1.5rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#6b7280',
              marginBottom: '12px',
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }} />
            Platform &amp; Architecture
          </div>

          <h1
            style={{
              fontSize: 'clamp(2.25rem, 5vw, 3.5rem)',
              fontWeight: 900,
              color: '#0a0a0a',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              marginBottom: '16px',
              textTransform: 'uppercase',
            }}
          >
            About <span className="gradient-text-amber" style={{ color: '#d97706' }}>LitLens</span>
          </h1>

          <p style={{ fontSize: '16px', color: '#6b7280', maxWidth: '580px', margin: '0 auto', lineHeight: 1.7 }}>
            A high-performance literary social network built for avid readers, book clubs, and critical reviewers.
          </p>
        </div>
      </div>

      {/* ── CONTENT CONTAINER ──────────────────────────────────── */}
      <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '48px 1.5rem 80px' }}>

        {/* ── SECTION 1: CORE CAPABILITIES ─────────────────────── */}
        <div style={{ marginBottom: '56px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#0a0a0a' }}>
                Platform Pillars
              </p>
              <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>
                Engineered for speed, social connection, and intuitive cataloging.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }} className="about-grid-3">
            {FEATURES.map((feat) => (
              <div
                key={feat.num}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e5e5',
                  borderRadius: '8px',
                  padding: '24px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  transition: 'border-color 0.15s ease, transform 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#0a0a0a';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e5e5';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#9ca3af', letterSpacing: '0.1em' }}>
                    {feat.num}
                  </span>
                  <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#d97706' }} />
                </div>
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0a0a0a' }}>{feat.title}</h3>
                <p style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.6 }}>{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── SECTION 2: TECH STACK MATRIX ──────────────────────── */}
        <div style={{ marginBottom: '56px' }}>
          <p style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#0a0a0a', marginBottom: '16px' }}>
            System Architecture &amp; Stack
          </p>

          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e5e5',
              borderRadius: '8px',
              overflow: 'hidden',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1px',
              backgroundColor: '#e5e5e5',
            }}
            className="about-grid-2"
          >
            {TECH_STACK.map((item) => (
              <div
                key={item.label}
                style={{
                  backgroundColor: '#ffffff',
                  padding: '16px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca3af' }}>
                  {item.label}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#0a0a0a' }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── SECTION 3: MEET THE DEVELOPER ─────────────────────── */}
        <div style={{ marginBottom: '48px' }}>
          <p style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#0a0a0a', marginBottom: '16px' }}>
            About the Creator
          </p>

          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e5e5',
              borderRadius: '8px',
              padding: '36px 32px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.02)',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '260px 1fr',
                gap: '36px',
                alignItems: 'start',
              }}
              className="about-dev-grid"
            >
              {/* Left Column: Avatar + Profile + Socials */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ width: '88px', height: '88px', borderRadius: '50%', overflow: 'hidden', border: '3px solid #0a0a0a', marginBottom: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
                  <Avatar style={{ width: '100%', height: '100%' }} {...devAvatarConfig} />
                </div>

                <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0a0a0a', letterSpacing: '-0.01em', marginBottom: '2px' }}>
                  Siddharth Mishra
                </h3>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#d97706', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Full Stack Engineer
                </p>
                <p style={{ fontSize: '11px', color: '#6b7280', marginBottom: '18px' }}>
                  IIIT Ranchi · ECE · 9.09 CGPA
                </p>

                {/* Social Connect Icons */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  {SOCIAL_LINKS.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      target={link.href.startsWith('mailto') ? undefined : '_blank'}
                      rel="noreferrer"
                      title={link.label}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '6px',
                        backgroundColor: '#f8f8f8',
                        border: '1px solid #e5e5e5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#0a0a0a',
                        textDecoration: 'none',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#0a0a0a';
                        e.currentTarget.style.backgroundColor = '#0a0a0a';
                        e.currentTarget.style.color = '#ffffff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#e5e5e5';
                        e.currentTarget.style.backgroundColor = '#f8f8f8';
                        e.currentTarget.style.color = '#0a0a0a';
                      }}
                    >
                      {link.icon}
                    </a>
                  ))}
                </div>
              </div>

              {/* Right Column: Bio & Achievements */}
              <div>
                <p style={{ fontSize: '14px', color: '#374151', lineHeight: 1.75, marginBottom: '14px' }}>
                  Specializes in building end-to-end web applications with a focus on intuitive user experience, distributed API architecture, and reliable cloud workflows. LitLens was built to showcase clean full-stack design patterns with robust search and community mechanics.
                </p>
                <p style={{ fontSize: '14px', color: '#374151', lineHeight: 1.75, marginBottom: '24px' }}>
                  Active competitive programmer with strong algorithms background, top rankings in global programming contests, and deep focus on writing clean, maintainable code.
                </p>

                {/* Competitive Programming Cards */}
                <div>
                  <p style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: '12px' }}>
                    Competitive Programming Track Record
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }} className="about-cp-grid">
                    {CP_STATS.map((item) => (
                      <div
                        key={item.platform}
                        style={{
                          backgroundColor: item.bg,
                          border: `1px solid ${item.border}`,
                          borderRadius: '6px',
                          padding: '12px 14px',
                        }}
                      >
                        <span style={{ fontSize: '11px', fontWeight: 800, color: item.color, display: 'block', marginBottom: '2px' }}>
                          {item.platform}
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#0a0a0a', display: 'block', marginBottom: '2px' }}>
                          {item.rank}
                        </span>
                        <span style={{ fontSize: '10px', color: '#6b7280', display: 'block' }}>
                          {item.highlight}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <style>{`
        @media (max-width: 860px) {
          .about-grid-3 {
            grid-template-columns: 1fr !important;
          }
          .about-grid-2 {
            grid-template-columns: 1fr !important;
          }
          .about-dev-grid {
            grid-template-columns: 1fr !important;
            text-align: center;
          }
          .about-cp-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
