import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchAnalytics } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// ─── SVG VECTOR ICONS ────────────────────────────────────────────────────────

// Duotone-style book stack icon
const IconBook = ({ size = 22, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="13" height="16" rx="2" fill={color} fillOpacity="0.12" stroke={color} strokeWidth="1.6" />
    <rect x="7" y="5" width="13" height="16" rx="2" fill={color} fillOpacity="0.06" stroke={color} strokeWidth="1.6" />
    <line x1="6" y1="8" x2="13" y2="8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <line x1="6" y1="11" x2="11" y2="11" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// Filled speech-bubble with lines
const IconReviews = ({ size = 22, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2z" fill={color} fillOpacity="0.14" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
    <line x1="8" y1="9" x2="16" y2="9" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    <line x1="8" y1="13" x2="13" y2="13" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

// Solid person with ring halo
const IconUsers = ({ size = 22, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="8" r="3.5" fill={color} fillOpacity="0.18" stroke={color} strokeWidth="1.6" />
    <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke={color} strokeWidth="1.6" strokeLinecap="round" fill={color} fillOpacity="0.1" />
    <circle cx="19" cy="7" r="2" fill={color} fillOpacity="0.5" stroke={color} strokeWidth="1.3" />
    <path d="M22 12.5c-1-.7-2.2-1-3-1" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

// Filled star with inner accent
const IconStar = ({ size = 22, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
      fill={color} fillOpacity="0.22" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
    <polygon points="12 6 13.9 10.26 18.5 10.9 15.25 14.04 16.07 18.5 12 16.27 7.93 18.5 8.75 14.04 5.5 10.9 10.1 10.26 12 6"
      fill={color} fillOpacity="0.45" />
  </svg>
);

const IconTrending = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const IconTrophy = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.45 1-1 1H8c-.55 0-1 .45-1 1v1c0 .55.45 1 1 1h8c.55 0 1-.45 1-1v-1c0-.55-.45-1-1-1h-1c-.55 0-1-.45-1-1v-2.34" />
    <path d="M6 4h12a2 2 0 0 1 2 2v3a6 6 0 0 1-6 6h0a6 6 0 0 1-6-6V6a2 2 0 0 1 2-2z" />
  </svg>
);

const IconRefresh = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

const IconArrowLeft = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const IconSparkles = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" />
    <path d="M19 17v4" />
    <path d="M3 5h4" />
    <path d="M17 19h4" />
  </svg>
);

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

const CustomTooltip = ({ active, payload, label, unit = 'Reviews' }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ backgroundColor: '#0a0a0a', color: '#ffffff', padding: '10px 14px', borderRadius: '6px', fontSize: '11px', boxShadow: '0 4px 16px rgba(0,0,0,0.18)', border: '1px solid #262626' }}>
        <p style={{ fontWeight: 700, color: '#9ca3af', marginBottom: '2px', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.04em' }}>
          {new Date(label).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
        <p style={{ fontWeight: 800, fontSize: '14px', color: '#ffffff', marginTop: '2px' }}>
          {payload[0].value} <span style={{ fontSize: '11px', fontWeight: 500, color: '#d1d5db' }}>{unit}</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.analytics(),
    queryFn: fetchAnalytics,
    staleTime: 1000 * 60 * 5,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: queryKeys.analytics() });
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const totals = data?.totals || {};
  const reviewsPerDay = data?.reviewsPerDay || [];
  const signupsPerDay = data?.signupsPerDay || [];
  const topBooks = data?.topBooks || [];

  // Derived metrics
  const totalReviewsIn30Days = reviewsPerDay.reduce((acc, d) => acc + (d.count || 0), 0);
  const totalSignupsIn30Days = signupsPerDay.reduce((acc, d) => acc + (d.count || 0), 0);
  const avgReviewsPerUser = totals.users > 0 && totals.reviews > 0 ? (totals.reviews / totals.users).toFixed(1) : '0';
  const avgReviewsPerBook = totals.books > 0 && totals.reviews > 0 ? (totals.reviews / totals.books).toFixed(1) : '0';

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', fontFamily: "'Inter', sans-serif", color: '#0a0a0a' }}>
      
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e5e5e5' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 1.5rem 24px' }}>
          
          <Link
            to="/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#6b7280',
              textDecoration: 'none',
              marginBottom: '16px',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#0a0a0a')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
          >
            <IconArrowLeft size={13} color="#6b7280" />
            Back to Dashboard
          </Link>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '10px', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', backgroundColor: '#eff6ff', color: '#2563eb', padding: '3px 10px', borderRadius: '4px' }}>
                  <IconSparkles size={12} color="#2563eb" />
                  Platform Intelligence &amp; Telemetry
                </span>
                <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600 }}>
                  30-Day Rolling Window
                </span>
              </div>
              <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', color: '#0a0a0a', lineHeight: 1.15 }}>
                Platform Analytics &amp; Trends
              </h1>
              <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                Live aggregated telemetry, review velocity, readership signups, and top catalog engagement.
              </p>
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
              style={{
                padding: '9px 16px',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                backgroundColor: '#ffffff',
                color: '#0a0a0a',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                cursor: (isRefreshing || isLoading) ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.15s',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', transform: isRefreshing ? 'rotate(360deg)' : 'none', transition: 'transform 0.5s' }}>
                <IconRefresh size={14} color="#0a0a0a" />
              </span>
              {isRefreshing ? 'Syncing...' : 'Refresh Metrics'}
            </button>
          </div>

        </div>
      </div>

      {/* ── MAIN BODY ──────────────────────────────────────────────── */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 1.5rem 64px' }}>

        {isLoading ? (
          /* Loading Skeletons */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '24px', height: '110px' }} className="animate-pulse" />
              ))}
            </div>
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '24px', height: '320px' }} className="animate-pulse" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '24px', height: '300px' }} className="animate-pulse" />
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '24px', height: '300px' }} className="animate-pulse" />
            </div>
          </div>
        ) : isError ? (
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #fee2e2', borderRadius: '8px', padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              ⚠️
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#dc2626', marginBottom: '6px' }}>
              Failed to load platform analytics
            </h3>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
              Unable to aggregate platform telemetry from the database.
            </p>
            <button
              onClick={handleRefresh}
              style={{ padding: '8px 18px', backgroundColor: '#0a0a0a', color: '#ffffff', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
            >
              Retry
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* ── MAIN CHART: REVIEWS TIMELINE ────────────────────────── */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '24px 28px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2563eb' }}>
                    <IconTrending size={14} color="#2563eb" />
                    Activity Timeline
                  </span>
                  <h2 style={{ fontSize: '16px', fontWeight: 900, textTransform: 'uppercase', color: '#0a0a0a', marginTop: '2px' }}>
                    Daily Review Momentum (Last 30 Days)
                  </h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px', color: '#6b7280' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', backgroundColor: '#0a0a0a', borderRadius: '50%' }} />
                    Daily Submissions
                  </span>
                  <span style={{ fontWeight: 800, color: '#0a0a0a', backgroundColor: '#f3f4f6', padding: '3px 8px', borderRadius: '4px', fontSize: '11px' }}>
                    Total: {totalReviewsIn30Days} reviews
                  </span>
                </div>
              </div>

              {reviewsPerDay.every((d) => d.count === 0) ? (
                <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '13px' }}>
                  No review activity recorded in the last 30 days
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={reviewsPerDay} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="reviewGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0a0a0a" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#0a0a0a" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDate}
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      axisLine={{ stroke: '#e5e5e5' }}
                      tickLine={false}
                      interval={3}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip unit="Reviews" />} />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#0a0a0a"
                      strokeWidth={2.5}
                      fill="url(#reviewGrad)"
                      activeDot={{ r: 5, fill: '#0a0a0a', stroke: '#ffffff', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* ── 2-COLUMN LOWER CHARTS ────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
              
              {/* TOP BOOKS RANKING */}
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '24px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                    <div>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#d97706' }}>
                        <IconTrophy size={13} color="#d97706" />
                        Engagement Leaderboard
                      </span>
                      <h2 style={{ fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', color: '#0a0a0a', marginTop: '2px' }}>
                        Top 5 Most Reviewed Books
                      </h2>
                    </div>
                    <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IconTrophy size={16} color="#d97706" />
                    </div>
                  </div>

                  {topBooks.length === 0 ? (
                    <div style={{ padding: '40px 0', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
                      No reviews recorded yet for ranked titles.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {topBooks.map((book, i) => {
                        const rankColors = [
                          { bg: '#fef3c7', text: '#92400e', badge: '#d97706' },
                          { bg: '#f1f5f9', text: '#334155', badge: '#64748b' },
                          { bg: '#ffedd5', text: '#9a3412', badge: '#c2410c' },
                          { bg: '#f3f4f6', text: '#4b5563', badge: '#9ca3af' },
                          { bg: '#f3f4f6', text: '#4b5563', badge: '#9ca3af' },
                        ];
                        const rCol = rankColors[i] || rankColors[3];
                        const maxCount = topBooks[0]?.count || 1;
                        const barWidth = Math.max(10, Math.round((book.count / maxCount) * 100));
                        return (
                          <div key={i} style={{ border: '1px solid #f3f4f6', padding: '10px 14px', borderRadius: '6px', backgroundColor: '#fafafa' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                                <span style={{ fontSize: '11px', fontWeight: 800, backgroundColor: rCol.bg, color: rCol.text, padding: '2px 6px', borderRadius: '4px', minWidth: '18px', textAlign: 'center' }}>
                                  #{i + 1}
                                </span>
                                <span style={{ fontSize: '13px', fontWeight: 800, color: '#0a0a0a', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                  {book.title}
                                </span>
                              </div>
                              <span style={{ fontSize: '12px', fontWeight: 800, color: '#0a0a0a', marginLeft: '12px' }}>
                                {book.count} {book.count === 1 ? 'review' : 'reviews'}
                              </span>
                            </div>
                            <div style={{ width: '100%', height: '4px', backgroundColor: '#e5e7eb', borderRadius: '2px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${barWidth}%`, backgroundColor: rCol.badge, borderRadius: '2px' }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '14px', marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#6b7280' }}>Calculated across all historical reviews</span>
                  <Link to="/leaderboard" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0a0a0a', textDecoration: 'none' }}>
                    View Public Board →
                  </Link>
                </div>
              </div>

              {/* NEW READERS SIGNUPS */}
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '24px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                    <div>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7c3aed' }}>
                        <IconUsers size={13} color="#7c3aed" />
                        Growth Velocity
                      </span>
                      <h2 style={{ fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', color: '#0a0a0a', marginTop: '2px' }}>
                        New Reader Signups (30 Days)
                      </h2>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#7c3aed', backgroundColor: '#faf5ff', padding: '4px 10px', borderRadius: '4px', border: '1px solid #f3e8ff' }}>
                      +{totalSignupsIn30Days} Readers
                    </span>
                  </div>

                  {signupsPerDay.every((d) => d.count === 0) ? (
                    <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '13px' }}>
                      No new signups in the last 30 days
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={210}>
                      <AreaChart data={signupsPerDay} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                        <XAxis
                          dataKey="date"
                          tickFormatter={formatDate}
                          tick={{ fontSize: 11, fill: '#9ca3af' }}
                          axisLine={{ stroke: '#e5e5e5' }}
                          tickLine={false}
                          interval={4}
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={{ fontSize: 11, fill: '#9ca3af' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip content={<CustomTooltip unit="New Signups" />} />
                        <Area
                          type="monotone"
                          dataKey="count"
                          stroke="#7c3aed"
                          strokeWidth={2.5}
                          fill="url(#signupGrad)"
                          activeDot={{ r: 5, fill: '#7c3aed', stroke: '#ffffff', strokeWidth: 2 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Additional Platform Ratios Bar */}
                <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '14px', marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ backgroundColor: '#fafafa', padding: '10px 14px', borderRadius: '6px', border: '1px solid #f0f0f0' }}>
                    <p style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.04em' }}>Avg Reviews / User</p>
                    <p style={{ fontSize: '15px', fontWeight: 900, color: '#0a0a0a', marginTop: '2px' }}>{avgReviewsPerUser}</p>
                  </div>
                  <div style={{ backgroundColor: '#fafafa', padding: '10px 14px', borderRadius: '6px', border: '1px solid #f0f0f0' }}>
                    <p style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.04em' }}>Avg Reviews / Book</p>
                    <p style={{ fontSize: '15px', fontWeight: 900, color: '#0a0a0a', marginTop: '2px' }}>{avgReviewsPerBook}</p>
                  </div>
                </div>

              </div>

            </div>

            {/* ── 4 KPI SUMMARY CARDS ─────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>

              {/* Card 1: Books */}
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '22px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '130px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280', marginBottom: '6px' }}>Total Catalog Books</p>
                  <h3 style={{ fontSize: '30px', fontWeight: 900, color: '#0a0a0a', lineHeight: 1.1 }}>{totals.books ?? '—'}</h3>
                  <p style={{ fontSize: '11px', color: '#16a34a', marginTop: '6px', fontWeight: 600 }}>● Active inventory</p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '8px', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconBook size={22} color="#0a0a0a" />
                  </div>
                </div>
              </div>

              {/* Card 2: Reviews */}
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '22px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '130px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280', marginBottom: '6px' }}>Total Reviews</p>
                  <h3 style={{ fontSize: '30px', fontWeight: 900, color: '#0a0a0a', lineHeight: 1.1 }}>{totals.reviews ?? '—'}</h3>
                  <p style={{ fontSize: '11px', color: '#2563eb', marginTop: '6px', fontWeight: 600 }}>+{totalReviewsIn30Days} in last 30d</p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '8px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconReviews size={22} color="#2563eb" />
                  </div>
                </div>
              </div>

              {/* Card 3: Users */}
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '22px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '130px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280', marginBottom: '6px' }}>Registered Readers</p>
                  <h3 style={{ fontSize: '30px', fontWeight: 900, color: '#0a0a0a', lineHeight: 1.1 }}>{totals.users ?? '—'}</h3>
                  <p style={{ fontSize: '11px', color: '#7c3aed', marginTop: '6px', fontWeight: 600 }}>+{totalSignupsIn30Days} new this month</p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '8px', backgroundColor: '#faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconUsers size={22} color="#7c3aed" />
                  </div>
                </div>
              </div>

              {/* Card 4: Avg Rating */}
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '22px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '130px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280', marginBottom: '6px' }}>Platform Mean Rating</p>
                  <h3 style={{ fontSize: '30px', fontWeight: 900, color: '#0a0a0a', lineHeight: 1.1 }}>
                    {totals.avgRating != null ? totals.avgRating.toFixed(2) : '—'}
                  </h3>
                  <p style={{ fontSize: '11px', color: '#d97706', marginTop: '6px', fontWeight: 600 }}>Score out of 5.0</p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '8px', backgroundColor: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconStar size={22} color="#d97706" />
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
