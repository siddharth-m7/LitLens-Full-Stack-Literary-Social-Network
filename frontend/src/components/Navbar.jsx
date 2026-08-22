import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Avatar, { genConfig } from 'react-nice-avatar';
import { useAuth } from '../contexts/AuthContext';
import { fetchProfile } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { data: profileUser = {} } = useQuery({
    queryKey: queryKeys.profile(),
    queryFn: fetchProfile,
    enabled: !!user,
  });

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const navLinks = [
    { to: '/', label: 'HOME' },
    ...(user ? [{ to: '/dashboard', label: 'DASHBOARD' }] : []),
    { to: '/about', label: 'ABOUT' },
    { to: '/leaderboard', label: 'LEADERBOARD' },
    ...(user ? [{ to: '/profile', label: 'PROFILE' }] : []),
  ];

  const isActive = (to) => location.pathname === to;

  return (
    <nav style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e5e5e5', position: 'sticky', top: 0, zIndex: 50 }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '56px' }}>

          {/* ── Logo (stacked two-line, MicroGig style) ──────────── */}
          <Link to="/" style={{ textDecoration: 'none', lineHeight: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/img/litlens.jpeg" alt="LitLens" style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover' }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: '15px', letterSpacing: '0.04em', color: '#0a0a0a', lineHeight: 1.1, textTransform: 'uppercase' }}>LitLens</div>
              <div style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '0.12em', color: '#6b7280', textTransform: 'uppercase', lineHeight: 1.1 }}>Reviews</div>
            </div>
          </Link>

          {/* ── Desktop nav links with / separators ─────────────── */}
          <div className="hidden md:flex" style={{ alignItems: 'center', gap: '0' }}>
            {navLinks.map((link, i) => (
              <div key={link.to} style={{ display: 'flex', alignItems: 'center' }}>
                {i > 0 && (
                  <span style={{ color: '#d1d5db', fontSize: '13px', margin: '0 6px', userSelect: 'none' }}>/</span>
                )}
                <Link
                  to={link.to}
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: isActive(link.to) ? '#0a0a0a' : '#6b7280',
                    textDecoration: 'none',
                    padding: '4px 2px',
                    borderBottom: isActive(link.to) ? '2px solid #0a0a0a' : '2px solid transparent',
                    transition: 'color 0.15s, border-color 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#0a0a0a'; }}
                  onMouseLeave={e => { if (!isActive(link.to)) e.currentTarget.style.color = '#6b7280'; }}
                >
                  {link.label}
                </Link>
              </div>
            ))}
          </div>

          {/* ── Desktop right actions ────────────────────────────── */}
          <div className="hidden md:flex" style={{ alignItems: 'center', gap: '12px' }}>
            {!user ? (
              <>
                <Link
                  to="/login"
                  style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280', textDecoration: 'none', padding: '6px 12px', border: '1px solid #e5e5e5', borderRadius: '4px', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#0a0a0a'; e.currentTarget.style.color = '#0a0a0a'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e5e5'; e.currentTarget.style.color = '#6b7280'; }}
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ffffff', textDecoration: 'none', padding: '6px 14px', backgroundColor: '#0a0a0a', borderRadius: '4px', border: '1px solid #0a0a0a', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#333'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#0a0a0a'; }}
                >
                  Register
                </Link>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Bell icon */}
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center', padding: '4px' }}>
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </button>

                {/* Avatar */}
                <Link to="/profile" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      border: '1.5px solid #0a0a0a',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                      cursor: 'pointer',
                      backgroundColor: '#f3f3f3',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Avatar style={{ width: '100%', height: '100%' }} {...genConfig(profileUser?.name || profileUser?.email || user?.name || 'reader')} />
                  </div>
                </Link>

                {/* Sign out */}
                <button
                  onClick={logout}
                  style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#0a0a0a'}
                  onMouseLeave={e => e.currentTarget.style.color = '#6b7280'}
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>

          {/* ── Mobile hamburger ─────────────────────────────────── */}
          <button
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0a0a0a', padding: '4px' }}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* ── Mobile menu ──────────────────────────────────────────── */}
        {isMobileMenuOpen && (
          <div style={{ borderTop: '1px solid #e5e5e5', paddingTop: '12px', paddingBottom: '16px', backgroundColor: '#ffffff' }}>
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={closeMobileMenu}
                style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: isActive(link.to) ? '#0a0a0a' : '#6b7280', textDecoration: 'none', padding: '10px 4px', borderBottom: '1px solid #f3f3f3' }}
              >
                {link.label}
              </Link>
            ))}
            <div style={{ paddingTop: '12px', display: 'flex', gap: '10px' }}>
              {!user ? (
                <>
                  <Link to="/login" onClick={closeMobileMenu} style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#0a0a0a', textDecoration: 'none', padding: '8px 14px', border: '1px solid #0a0a0a', borderRadius: '4px' }}>Log In</Link>
                  <Link to="/register" onClick={closeMobileMenu} style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fff', textDecoration: 'none', padding: '8px 14px', backgroundColor: '#0a0a0a', borderRadius: '4px' }}>Register</Link>
                </>
              ) : (
                <button onClick={() => { logout(); closeMobileMenu(); }} style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0' }}>
                  Sign Out
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
