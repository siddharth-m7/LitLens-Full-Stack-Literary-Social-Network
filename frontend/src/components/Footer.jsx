import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={{ backgroundColor: '#0a0a0a', color: '#fff', borderTop: '1px solid #1f1f1f' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '56px 1.5rem 32px' }}>

        {/* ── Top row ─────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '40px', marginBottom: '48px' }} className="footer-grid">

          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>📚</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '14px', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#ffffff', lineHeight: 1.1 }}>LitLens</div>
                <div style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '0.1em', color: '#6b7280', textTransform: 'uppercase' }}>Reviews</div>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: '#9ca3af', lineHeight: 1.7, maxWidth: '260px' }}>
              Your literary social network. Discover, review, and track books while connecting with passionate readers.
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <a href="https://github.com/siddharth-m7" target="_blank" rel="noopener noreferrer" style={{ color: '#6b7280', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
                onMouseLeave={e => e.currentTarget.style.color = '#6b7280'}>
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </a>
              <a href="https://linkedin.com/in/siddharthm7/" target="_blank" rel="noopener noreferrer" style={{ color: '#6b7280', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
                onMouseLeave={e => e.currentTarget.style.color = '#6b7280'}>
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
            </div>
          </div>

          {/* Platform links */}
          <div>
            <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b7280', marginBottom: '16px' }}>Platform</p>
            {[{ to: '/', label: 'Home' }, { to: '/dashboard', label: 'Dashboard' }, { to: '/leaderboard', label: 'Leaderboard' }, { to: '/about', label: 'About' }].map(l => (
              <Link key={l.to} to={l.to} style={{ display: 'block', fontSize: '13px', color: '#9ca3af', textDecoration: 'none', marginBottom: '10px', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
                onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}>
                {l.label}
              </Link>
            ))}
          </div>

          {/* Account links */}
          <div>
            <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b7280', marginBottom: '16px' }}>Account</p>
            {[{ to: '/login', label: 'Sign In' }, { to: '/register', label: 'Register' }, { to: '/profile', label: 'Profile' }].map(l => (
              <Link key={l.to} to={l.to} style={{ display: 'block', fontSize: '13px', color: '#9ca3af', textDecoration: 'none', marginBottom: '10px', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
                onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}>
                {l.label}
              </Link>
            ))}
          </div>

          {/* Legal */}
          <div>
            <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b7280', marginBottom: '16px' }}>Info</p>
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map(l => (
              <span key={l} style={{ display: 'block', fontSize: '13px', color: '#9ca3af', marginBottom: '10px', cursor: 'default' }}>{l}</span>
            ))}
          </div>
        </div>

        {/* ── Bottom bar ──────────────────────────────────────────── */}
        <div style={{ borderTop: '1px solid #1f1f1f', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <p style={{ fontSize: '12px', color: '#6b7280' }}>
            © {new Date().getFullYear()} LitLens. Made with care by <span style={{ color: '#9ca3af' }}>Siddharth Mishra</span>.
          </p>
          <p style={{ fontSize: '12px', color: '#4b5563', letterSpacing: '0.05em' }}>
            LITERARY SOCIAL NETWORK
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 480px) {
          .footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </footer>
  );
}
