import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import Avatar, { genConfig } from 'react-nice-avatar';
import { useAuth } from '../contexts/AuthContext';
import { loginUser } from '../lib/api';

const userAvatarConfig = genConfig({
  sex: 'woman',
  faceColor: '#F9C9B6',
  earSize: 'small',
  eyeStyle: 'smile',
  noseStyle: 'short',
  mouthStyle: 'smile',
  shirtStyle: 'hoody',
  glassesStyle: 'none',
  hairColor: '#000',
  hairStyle: 'womanLong',
  hatStyle: 'none',
  shirtColor: '#6BD9E9',
  bgColor: '#E0DDFF',
});

const adminAvatarConfig = genConfig({
  sex: 'man',
  faceColor: '#F9C9B6',
  earSize: 'small',
  eyeStyle: 'oval',
  noseStyle: 'short',
  mouthStyle: 'peace',
  shirtStyle: 'polo',
  glassesStyle: 'round',
  hairColor: '#506AF4',
  hairStyle: 'thick',
  hatStyle: 'none',
  shirtColor: '#9287FF',
  bgColor: '#FEF3C7',
});

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      login(data.token, data.refreshToken);
      navigate('/');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    loginMutation.mutate(form);
  };

  const inputSt = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e5e5e5',
    borderRadius: '4px',
    fontSize: '13px',
    color: '#0a0a0a',
    backgroundColor: '#ffffff',
    outline: 'none',
    fontFamily: "'Inter', sans-serif",
    boxSizing: 'border-box',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#ffffff',
        backgroundImage:
          'linear-gradient(#e5e5e5 1px, transparent 1px), linear-gradient(90deg, #e5e5e5 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 1.5rem',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* ── Brand Logo Header ─────────────────────────────────── */}
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
        <img src="/img/litlens.jpeg" alt="LitLens" style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #e5e5e5' }} />
        <div>
          <div style={{ fontWeight: 800, fontSize: '16px', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0a0a0a', lineHeight: 1.1 }}>LitLens</div>
          <div style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '0.12em', color: '#6b7280', textTransform: 'uppercase' }}>Reviews</div>
        </div>
      </Link>

      {/* ── Card Container ────────────────────────────────────── */}
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#ffffff',
          border: '1px solid #e5e5e5',
          borderRadius: '8px',
          padding: '36px 32px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6b7280', marginBottom: '8px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }} />
            Login
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#0a0a0a', letterSpacing: '-0.02em', marginBottom: '6px' }}>
            Welcome <span className="gradient-text-amber" style={{ color: '#d97706' }}>Back</span>
          </h1>
          <p style={{ fontSize: '13px', color: '#6b7280' }}>
            Sign in to access your reading list, reviews, and library.
          </p>
        </div>

        {/* ── Demo Accounts Section ────────────────────────────── */}
        <div style={{ marginBottom: '26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9ca3af' }}>
              Quick Demo Access
            </p>
            <span style={{ fontSize: '10px', fontWeight: 600, color: '#22c55e', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1px 7px', borderRadius: '10px', letterSpacing: '0.04em' }}>
              ● Ready
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* Demo User Card */}
            <button
              id="demo-user-btn"
              type="button"
              disabled={loginMutation.isPending}
              onClick={() => loginMutation.mutate({ email: 'demo@bookshelf.com', password: 'demo123' })}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '14px 14px',
                border: '1px solid #e5e5e5',
                borderRadius: '8px',
                backgroundColor: '#fbfbfb',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                opacity: loginMutation.isPending ? 0.5 : 1,
                fontFamily: "'Inter', sans-serif",
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#0a0a0a';
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e5e5';
                e.currentTarget.style.backgroundColor = '#fbfbfb';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Icon & Chip Row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '10px' }}>
                <Avatar style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid #e5e5e5' }} {...userAvatarConfig} />
                <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280', backgroundColor: '#ffffff', border: '1px solid #e5e5e5', padding: '2px 6px', borderRadius: '4px' }}>
                  Reader
                </span>
              </div>

              {/* Title & Email */}
              <div style={{ width: '100%' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  Demo User
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" style={{ color: '#9ca3af' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  demo@bookshelf.com
                </div>
              </div>
            </button>

            {/* Demo Admin Card */}
            <button
              id="demo-admin-btn"
              type="button"
              disabled={loginMutation.isPending}
              onClick={() => loginMutation.mutate({ email: 'admin@example.com', password: 'admin123' })}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '14px 14px',
                border: '1px solid #fed7aa',
                borderRadius: '8px',
                backgroundColor: '#fffaf5',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                opacity: loginMutation.isPending ? 0.5 : 1,
                fontFamily: "'Inter', sans-serif",
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#d97706';
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(217,119,6,0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#fed7aa';
                e.currentTarget.style.backgroundColor = '#fffaf5';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Icon & Chip Row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '10px' }}>
                <Avatar style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid #fde68a' }} {...adminAvatarConfig} />
                <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#b45309', backgroundColor: '#fef3c7', border: '1px solid #fde68a', padding: '2px 6px', borderRadius: '4px' }}>
                  Admin
                </span>
              </div>

              {/* Title & Email */}
              <div style={{ width: '100%' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  Demo Admin
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" style={{ color: '#d97706' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <div style={{ fontSize: '11px', color: '#b45309', marginTop: '2px', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  admin@example.com
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* ── Divider ─────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e5e5' }} />
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', whiteSpace: 'nowrap', letterSpacing: '0.06em' }}>
            or continue with credentials
          </span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e5e5' }} />
        </div>

        {/* ── Error Message ───────────────────────────────────── */}
        {loginMutation.error && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', padding: '10px 12px', marginBottom: '18px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <svg width="16" height="16" fill="#ef4444" viewBox="0 0 20 20" style={{ flexShrink: 0, marginTop: '1px' }}>
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p style={{ fontSize: '13px', color: '#b91c1c' }}>{loginMutation.error?.response?.data?.message || 'Login failed. Please check your credentials.'}</p>
          </div>
        )}

        {/* ── Form ────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label htmlFor="email" style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#374151', marginBottom: '6px' }}>
              Email Address
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              style={inputSt}
              onFocus={(e) => {
                e.target.style.borderColor = '#0a0a0a';
                e.target.style.boxShadow = '0 0 0 1px #0a0a0a';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e5e5';
                e.target.style.boxShadow = 'none';
              }}
              required
            />
          </div>

          <div>
            <label htmlFor="password" style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#374151', marginBottom: '6px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                style={{ ...inputSt, paddingRight: '40px' }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#0a0a0a';
                  e.target.style.boxShadow = '0 0 0 1px #0a0a0a';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e5e5';
                  e.target.style.boxShadow = 'none';
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center' }}
                aria-label="Toggle password visibility"
              >
                {showPassword ? (
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loginMutation.isPending}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#0a0a0a',
              color: '#ffffff',
              border: '1.5px solid #0a0a0a',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              opacity: loginMutation.isPending ? 0.5 : 1,
              fontFamily: "'Inter', sans-serif",
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '6px',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              if (!loginMutation.isPending) {
                e.currentTarget.style.backgroundColor = '#262626';
                e.currentTarget.style.borderColor = '#262626';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#0a0a0a';
              e.currentTarget.style.borderColor = '#0a0a0a';
            }}
          >
            {loginMutation.isPending ? (
              <>
                <div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                Signing In...
              </>
            ) : (
              'Sign In →'
            )}
          </button>
        </form>

        <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px', color: '#6b7280' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ fontWeight: 700, color: '#0a0a0a', textDecoration: 'none', borderBottom: '1px solid #0a0a0a' }}>
            Create one
          </Link>
        </p>
      </div>

      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <Link to="/" style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          ← Back to Home
        </Link>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
