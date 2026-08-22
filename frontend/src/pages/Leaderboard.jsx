import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Avatar, { genConfig } from 'react-nice-avatar';
import { useAuth } from '../contexts/AuthContext';
import { fetchLeaderboard } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';

const PERIOD_TABS = [
  { id: 'all_time', label: 'All Time', icon: '⚡' },
  { id: 'monthly', label: 'This Month', icon: '🗓️' },
  { id: 'yearly', label: 'This Year', icon: '🏆' },
];

export default function Leaderboard() {
  const { user: currentUser } = useAuth();
  const [period, setPeriod] = useState('all_time');
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.leaderboard(period),
    queryFn: () => fetchLeaderboard({ period }),
    staleTime: 1000 * 60,
  });

  const {
    periodLabel,
    totalReviewsInPeriod = 0,
    totalReviewers = 0,
    leaderboard = [],
  } = data || {};

  const filteredLeaderboard = useMemo(() => {
    if (!search.trim()) return leaderboard;
    return leaderboard.filter((item) =>
      item.user?.name?.toLowerCase().includes(search.toLowerCase().trim())
    );
  }, [leaderboard, search]);

  const topThree = leaderboard.slice(0, 3);
  const myRankEntry = leaderboard.find(
    (entry) => entry.user?._id === currentUser?._id || entry.user?.name === currentUser?.name
  );

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
          padding: '56px 0 44px',
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
            Community Leaderboard
          </div>

          <h1
            style={{
              fontSize: 'clamp(2rem, 5vw, 3.25rem)',
              fontWeight: 900,
              color: '#0a0a0a',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              marginBottom: '12px',
              textTransform: 'uppercase',
            }}
          >
            Top <span className="gradient-text-amber" style={{ color: '#d97706' }}>Reviewers</span>
          </h1>

          <p style={{ fontSize: '15px', color: '#6b7280', maxWidth: '520px', margin: '0 auto 24px', lineHeight: 1.6 }}>
            Honoring our most prolific book critics and active community voices for {periodLabel || 'this period'}.
          </p>

          {/* ── Period Switcher Tabs ─────────────────────────────── */}
          <div
            style={{
              display: 'inline-flex',
              backgroundColor: '#f3f3f3',
              padding: '4px',
              borderRadius: '8px',
              border: '1px solid #e5e5e5',
              gap: '4px',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {PERIOD_TABS.map((tab) => {
              const active = period === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setPeriod(tab.id)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: active ? '#ffffff' : 'transparent',
                    color: active ? '#0a0a0a' : '#6b7280',
                    fontWeight: 700,
                    fontSize: '11px',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    boxShadow: active ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.15s ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT CONTAINER ─────────────────────────────── */}
      <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '36px 1.5rem 80px' }}>

        {/* ── STATS BAR ────────────────────────────────────────── */}
        {!isLoading && !isError && leaderboard.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1px',
              backgroundColor: '#e5e5e5',
              border: '1px solid #e5e5e5',
              borderRadius: '8px',
              overflow: 'hidden',
              marginBottom: '32px',
            }}
            className="leaderboard-stats-grid"
          >
            <div style={{ backgroundColor: '#ffffff', padding: '20px 24px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>
                Total Reviews in Period
              </span>
              <span style={{ fontSize: '24px', fontWeight: 900, color: '#0a0a0a' }}>
                {totalReviewsInPeriod}
              </span>
            </div>
            <div style={{ backgroundColor: '#ffffff', padding: '20px 24px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>
                Ranked Reviewers
              </span>
              <span style={{ fontSize: '24px', fontWeight: 900, color: '#0a0a0a' }}>
                {totalReviewers}
              </span>
            </div>
            <div style={{ backgroundColor: '#ffffff', padding: '20px 24px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>
                Top Contributor
              </span>
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#0a0a0a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                {topThree[0]?.user?.name || '—'}
              </span>
            </div>
          </div>
        )}

        {/* ── CURRENT USER RANK BANNER (IF LOGGED IN) ───────────── */}
        {currentUser && myRankEntry && (
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1.5px solid #0a0a0a',
              borderRadius: '8px',
              padding: '16px 20px',
              marginBottom: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#0a0a0a', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px' }}>
                #{myRankEntry.rank}
              </div>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 800, color: '#0a0a0a' }}>
                  Your Standing on the {periodLabel} Leaderboard
                </p>
                <p style={{ fontSize: '11px', color: '#6b7280' }}>
                  You have logged <span style={{ fontWeight: 700, color: '#0a0a0a' }}>{myRankEntry.reviewCount} reviews</span> in this timeframe.
                </p>
              </div>
            </div>
            <Link
              to="/dashboard"
              style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#0a0a0a',
                textDecoration: 'none',
                border: '1px solid #e5e5e5',
                padding: '6px 14px',
                borderRadius: '4px',
                backgroundColor: '#f8f8f8',
              }}
            >
              Write More Reviews →
            </Link>
          </div>
        )}

        {/* ── LOADING SKELETON ───────────────────────────────────── */}
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }} className="podium-grid">
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '32px', textAlign: 'center' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#f3f3f3', margin: '0 auto 12px' }} />
                  <div style={{ height: '16px', backgroundColor: '#f3f3f3', borderRadius: '4px', width: '60%', margin: '0 auto 8px' }} />
                  <div style={{ height: '12px', backgroundColor: '#f3f3f3', borderRadius: '4px', width: '40%', margin: '0 auto' }} />
                </div>
              ))}
            </div>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ height: '64px', backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '8px' }} />
            ))}
          </div>
        ) : isError ? (
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '48px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: '16px', fontWeight: 700, color: '#0a0a0a', marginBottom: '8px' }}>Unable to load leaderboard data</p>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>Please check your network connection and try again.</p>
            <button
              onClick={() => refetch()}
              style={{ padding: '10px 20px', backgroundColor: '#0a0a0a', color: '#ffffff', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}
            >
              Retry
            </button>
          </div>
        ) : leaderboard.length === 0 ? (
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '64px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>📚</div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0a0a0a', marginBottom: '6px' }}>
              No reviews logged for {periodLabel}
            </h2>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '24px', maxWidth: '380px', margin: '0 auto 24px', lineHeight: 1.6 }}>
              Be the first reader to share a book review and take the #1 spot on the leaderboard!
            </p>
            <Link
              to="/dashboard"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#0a0a0a', color: '#ffffff', padding: '12px 24px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none' }}
            >
              Browse Library & Write Review →
            </Link>
          </div>
        ) : (
          <div>
            {/* ── TOP 3 PODIUM (STAGE ARRANGEMENT: 2ND - 1ST - 3RD) ─── */}
            {topThree.length >= 2 && (
              <div style={{ marginBottom: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#0a0a0a' }}>
                    Podium Champions
                  </p>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', backgroundColor: '#f3f3f3', padding: '2px 8px', borderRadius: '4px' }}>
                    {periodLabel}
                  </span>
                </div>

                {/* Podium Stage Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '16px',
                    alignItems: 'flex-end',
                  }}
                  className="podium-stage-grid"
                >
                  {/* #2 Rank (Silver - Left) */}
                  {topThree[1] && (
                    <div
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '8px',
                        padding: '24px 18px',
                        textAlign: 'center',
                        position: 'relative',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                      }}
                    >
                      <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 800, color: '#475569', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', padding: '2px 7px', borderRadius: '4px' }}>
                          🥈 2ND
                        </span>
                      </div>
                      <div style={{ width: '56px', height: '56px', margin: '10px auto 12px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #cbd5e1' }}>
                        <Avatar style={{ width: '100%', height: '100%' }} {...genConfig(topThree[1].user?.name || 'user-2')} />
                      </div>
                      <Link to={`/users/${topThree[1].user._id}`} style={{ fontSize: '14px', fontWeight: 800, color: '#0a0a0a', textDecoration: 'none', display: 'block', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {topThree[1].user.name}
                      </Link>
                      <div style={{ margin: '8px 0 10px' }}>
                        <span style={{ fontSize: '24px', fontWeight: 900, color: '#0a0a0a' }}>{topThree[1].reviewCount}</span>
                        <span style={{ fontSize: '10px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginLeft: '4px' }}>reviews</span>
                      </div>
                    </div>
                  )}

                  {/* #1 Rank (Gold Champion - Center Elevated) */}
                  {topThree[0] && (
                    <div
                      style={{
                        backgroundColor: '#ffffff',
                        border: '2px solid #0a0a0a',
                        borderRadius: '8px',
                        padding: '32px 20px',
                        textAlign: 'center',
                        position: 'relative',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                        transform: 'translateY(-8px)',
                      }}
                    >
                      <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 800, color: '#92400e', backgroundColor: '#fef3c7', border: '1px solid #fde68a', padding: '3px 8px', borderRadius: '4px' }}>
                          👑 1ST PLACE
                        </span>
                      </div>
                      <div style={{ width: '68px', height: '68px', margin: '8px auto 14px', borderRadius: '50%', overflow: 'hidden', border: '3px solid #d97706', boxShadow: '0 0 12px rgba(217,119,6,0.25)' }}>
                        <Avatar style={{ width: '100%', height: '100%' }} {...genConfig(topThree[0].user?.name || 'user-1')} />
                      </div>
                      <Link to={`/users/${topThree[0].user._id}`} style={{ fontSize: '16px', fontWeight: 900, color: '#0a0a0a', textDecoration: 'none', display: 'block', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {topThree[0].user.name}
                      </Link>
                      <div style={{ margin: '8px 0 12px' }}>
                        <span style={{ fontSize: '28px', fontWeight: 900, color: '#0a0a0a' }}>{topThree[0].reviewCount}</span>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#d97706', textTransform: 'uppercase', marginLeft: '4px' }}>reviews</span>
                      </div>
                      {topThree[0].badges?.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center' }}>
                          {topThree[0].badges.map((b) => (
                            <span key={b.id} style={{ fontSize: '9px', fontWeight: 700, color: '#374151', backgroundColor: '#f3f3f3', padding: '2px 6px', borderRadius: '3px' }}>
                              {b.emoji} {b.label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* #3 Rank (Bronze - Right) */}
                  {topThree[2] && (
                    <div
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1.5px solid #fed7aa',
                        borderRadius: '8px',
                        padding: '24px 18px',
                        textAlign: 'center',
                        position: 'relative',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                      }}
                    >
                      <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 800, color: '#9a3412', backgroundColor: '#fff7ed', border: '1px solid #fed7aa', padding: '2px 7px', borderRadius: '4px' }}>
                          🥉 3RD
                        </span>
                      </div>
                      <div style={{ width: '56px', height: '56px', margin: '10px auto 12px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #fed7aa' }}>
                        <Avatar style={{ width: '100%', height: '100%' }} {...genConfig(topThree[2].user?.name || 'user-3')} />
                      </div>
                      <Link to={`/users/${topThree[2].user._id}`} style={{ fontSize: '14px', fontWeight: 800, color: '#0a0a0a', textDecoration: 'none', display: 'block', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {topThree[2].user.name}
                      </Link>
                      <div style={{ margin: '8px 0 10px' }}>
                        <span style={{ fontSize: '24px', fontWeight: 900, color: '#0a0a0a' }}>{topThree[2].reviewCount}</span>
                        <span style={{ fontSize: '10px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginLeft: '4px' }}>reviews</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── SEARCH & FULL RANKINGS LIST ────────────────────── */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '8px', overflow: 'hidden' }}>

              {/* Table Header & Search Bar */}
              <div
                style={{
                  padding: '16px 24px',
                  borderBottom: '1px solid #e5e5e5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#0a0a0a' }}>
                    Complete Rankings
                  </p>
                  <span style={{ fontSize: '11px', color: '#6b7280' }}>
                    Showing {filteredLeaderboard.length} of {leaderboard.length} reviewers
                  </span>
                </div>

                {/* Search Input */}
                <div style={{ position: 'relative', minWidth: '220px' }}>
                  <svg
                    style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search reviewer..."
                    style={{
                      width: '100%',
                      padding: '7px 12px 7px 32px',
                      border: '1px solid #e5e5e5',
                      borderRadius: '4px',
                      fontSize: '12px',
                      color: '#0a0a0a',
                      outline: 'none',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '12px' }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Rows List */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {filteredLeaderboard.map((entry, idx) => {
                  const isTop3 = entry.rank <= 3;
                  const isCurrentUser = entry.user?._id === currentUser?._id;
                  const avatarConfig = genConfig(entry.user?.name || `user-${idx}`);

                  return (
                    <div
                      key={entry.user._id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 24px',
                        borderBottom: idx < filteredLeaderboard.length - 1 ? '1px solid #f3f3f3' : 'none',
                        backgroundColor: isCurrentUser ? '#fbfcfe' : '#ffffff',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = isCurrentUser ? '#f1f5f9' : '#fafafa';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = isCurrentUser ? '#fbfcfe' : '#ffffff';
                      }}
                    >
                      {/* Left: Rank + Avatar + Name */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
                        {/* Rank Badge */}
                        <div style={{ width: '32px', textAlign: 'center', flexShrink: 0 }}>
                          {entry.rank === 1 ? (
                            <span style={{ fontSize: '18px' }}>🥇</span>
                          ) : entry.rank === 2 ? (
                            <span style={{ fontSize: '18px' }}>🥈</span>
                          ) : entry.rank === 3 ? (
                            <span style={{ fontSize: '18px' }}>🥉</span>
                          ) : (
                            <span style={{ fontSize: '12px', fontWeight: 800, color: '#9ca3af' }}>#{entry.rank}</span>
                          )}
                        </div>

                        {/* Nice Avatar */}
                        <div style={{ width: '38px', height: '38px', borderRadius: '50%', overflow: 'hidden', border: isTop3 ? '1.5px solid #d97706' : '1px solid #e5e5e5', flexShrink: 0 }}>
                          <Avatar style={{ width: '100%', height: '100%' }} {...avatarConfig} />
                        </div>

                        {/* User Meta */}
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Link
                              to={`/users/${entry.user._id}`}
                              style={{
                                fontSize: '13px',
                                fontWeight: 700,
                                color: '#0a0a0a',
                                textDecoration: 'none',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                            >
                              {entry.user.name}
                            </Link>
                            {isCurrentUser && (
                              <span style={{ fontSize: '9px', fontWeight: 700, color: '#2563eb', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', padding: '1px 5px', borderRadius: '3px' }}>
                                YOU
                              </span>
                            )}
                          </div>

                          {/* Badges List */}
                          {entry.badges?.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '3px' }}>
                              {entry.badges.map((b) => (
                                <span
                                  key={b.id}
                                  title={b.desc}
                                  style={{
                                    fontSize: '9px',
                                    fontWeight: 600,
                                    color: '#4b5563',
                                    backgroundColor: '#f3f3f3',
                                    padding: '1px 6px',
                                    borderRadius: '3px',
                                  }}
                                >
                                  {b.emoji} {b.label}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Review Metric */}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '16px', fontWeight: 900, color: '#0a0a0a' }}>
                          {entry.reviewCount}
                        </div>
                        <div style={{ fontSize: '10px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          {entry.reviewCount === 1 ? 'review' : 'reviews'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── FOOTER CTA ─────────────────────────────────────── */}
            <div style={{ marginTop: '36px', textAlign: 'center' }}>
              <Link
                to="/dashboard"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#0a0a0a',
                  color: '#ffffff',
                  padding: '12px 24px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#262626')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0a0a0a')}
              >
                Browse Books &amp; Write Reviews →
              </Link>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .podium-stage-grid {
            grid-template-columns: 1fr !important;
            align-items: stretch !important;
          }
          .podium-stage-grid > div {
            transform: none !important;
          }
          .leaderboard-stats-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
