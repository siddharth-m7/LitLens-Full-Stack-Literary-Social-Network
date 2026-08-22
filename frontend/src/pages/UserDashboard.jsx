import { useEffect, useState, useRef } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import Avatar, { genConfig } from 'react-nice-avatar';
import { useAuth } from '../contexts/AuthContext';
import { fetchBooks, fetchProfile, fetchMyReviews, fetchReadingList, fetchFavorites } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';

const GENRES = ['Fiction', 'Non-Fiction', 'Mystery', 'Science Fiction', 'Fantasy', 'Romance', 'Thriller', 'Biography', 'Self-Help', 'Historical Fiction', 'Horror', 'Poetry', 'Other'];
const LIMIT = 12;

const GENRE_COLORS = {
  Fiction: { bg: '#f3e8ff', color: '#6b21a8', border: '#e9d5ff' },
  'Non-Fiction': { bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd' },
  Mystery: { bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
  'Science Fiction': { bg: '#e0e7ff', color: '#3730a3', border: '#c7d2fe' },
  Fantasy: { bg: '#fae8ff', color: '#86198f', border: '#f5d0fe' },
  Romance: { bg: '#ffe4e6', color: '#9f1239', border: '#fecdd3' },
  Thriller: { bg: '#fee2e2', color: '#991b1b', border: '#fecaca' },
  Biography: { bg: '#f1f5f9', color: '#334155', border: '#e2e8f0' },
  'Self-Help': { bg: '#dcfce7', color: '#166534', border: '#bbf7d0' },
  'Historical Fiction': { bg: '#fef9c3', color: '#854d0e', border: '#fef08a' },
  Horror: { bg: '#f3f4f6', color: '#1f2937', border: '#e5e7eb' },
  Poetry: { bg: '#fdf2f8', color: '#9d174d', border: '#fce7f3' },
  Other: { bg: '#f3f4f6', color: '#4b5563', border: '#e5e7eb' },
};

// Procedural book cover gradient generator for books without cover images
const getBookCoverGradient = (title = '') => {
  const gradients = [
    'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    'linear-gradient(135deg, #312e81 0%, #1e1b4b 100%)',
    'linear-gradient(135deg, #134e4a 0%, #042f2e 100%)',
    'linear-gradient(135deg, #701a75 0%, #4a044e 100%)',
    'linear-gradient(135deg, #7c2d12 0%, #451a03 100%)',
    'linear-gradient(135deg, #1e3a8a 0%, #172554 100%)',
  ];
  const charCodeSum = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return gradients[charCodeSum % gradients.length];
};

export default function UserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [genre, setGenre] = useState('All');
  const [minRating, setMinRating] = useState('');
  const [sort, setSort] = useState('newest');
  const sentinelRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Profile data for hero
  const { data: profileData = {} } = useQuery({
    queryKey: queryKeys.profile(),
    queryFn: fetchProfile,
    enabled: !!user,
  });

  // Stats queries
  const { data: myReviewsData } = useQuery({
    queryKey: ['myReviews', { page: 1, limit: 1 }],
    queryFn: () => fetchMyReviews({ page: 1, limit: 1 }),
    enabled: !!user,
  });

  const { data: readingListData } = useQuery({
    queryKey: ['readingList'],
    queryFn: fetchReadingList,
    enabled: !!user,
  });

  const { data: favoritesData } = useQuery({
    queryKey: ['favorites'],
    queryFn: fetchFavorites,
    enabled: !!user,
  });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch } = useInfiniteQuery({
    queryKey: queryKeys.books({ search: debouncedSearch, genre, minRating, sort }),
    queryFn: ({ pageParam = 1 }) => fetchBooks({ page: pageParam, limit: LIMIT, search: debouncedSearch, genre, minRating, sort }),
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.page + 1 : undefined),
    initialPageParam: 1,
  });

  const books = data?.pages.flatMap((p) => p.data) ?? [];
  const totalCount = data?.pages[0]?.totalCount ?? 0;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage && !isLoading) fetchNextPage();
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, isLoading, fetchNextPage]);

  const clearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setGenre('All');
    setMinRating('');
    setSort('newest');
  };

  const activeFilterCount = [debouncedSearch !== '', genre !== 'All', minRating !== '', sort !== 'newest'].filter(Boolean).length;

  const memberSince = profileData?.createdAt
    ? new Date(profileData.createdAt).getFullYear()
    : new Date().getFullYear();

  const finishedBooksCount = readingListData?.filter((b) => b.status === 'finished')?.length ?? 0;
  const authoredReviewsCount = myReviewsData?.totalCount ?? 0;
  const favCount = favoritesData?.length ?? 0;

  const avatarConfig = genConfig(profileData?.name || user?.name || 'reader-avatar');

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
          padding: '48px 0 36px',
        }}
      >
        <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px' }}>

            {/* Profile Identity */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '2px solid #0a0a0a',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  flexShrink: 0,
                  backgroundColor: '#f3f3f3',
                }}
              >
                <Avatar style={{ width: '100%', height: '100%' }} {...avatarConfig} />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                  <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#0a0a0a', letterSpacing: '-0.02em', margin: 0 }}>
                    {profileData?.name || user?.name || 'Reader'}
                  </h1>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: user?.role === 'admin' ? '#fef2f2' : '#f0fdf4',
                      color: user?.role === 'admin' ? '#b91c1c' : '#15803d',
                      border: `1px solid ${user?.role === 'admin' ? '#fecaca' : '#bbf7d0'}`,
                    }}
                  >
                    {user?.role === 'admin' ? '🛡️ Admin' : '📖 Reader'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#6b7280', flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Member since {memberSince}
                  </span>
                  <span>•</span>
                  <span>{profileData?.email || user?.email}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <Link
                to="/profile"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#0a0a0a',
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #0a0a0a',
                  borderRadius: '4px',
                  padding: '9px 18px',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#0a0a0a'; e.currentTarget.style.color = '#ffffff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.color = '#0a0a0a'; }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
                Profile &amp; Shelves
              </Link>

              <button
                onClick={() => document.getElementById('book-library')?.scrollIntoView({ behavior: 'smooth' })}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#ffffff',
                  backgroundColor: '#0a0a0a',
                  border: '1.5px solid #0a0a0a',
                  borderRadius: '4px',
                  padding: '9px 18px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#262626'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#0a0a0a'; }}
              >
                Explore Library ↓
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* ── MAIN DASHBOARD BODY ─────────────────────────────────── */}
      <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '36px 1.5rem 80px' }}>

        {/* ── SECTION: YOUR PROGRESS METRICS ─────────────────────── */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <p style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#0a0a0a', margin: 0 }}>
              Reading Statistics
            </p>
            <span style={{ fontSize: '11px', color: '#9ca3af' }}>Real-time reader telemetry</span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '16px',
            }}
            className="stats-grid-responsive"
          >
            {/* Stat 1: Books Read */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1.5px solid #e5e5e5',
                borderRadius: '8px',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              }}
            >
              <div>
                <p style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca3af', margin: '0 0 6px' }}>
                  Books Finished
                </p>
                <p style={{ fontSize: '28px', fontWeight: 900, color: '#0a0a0a', margin: 0, letterSpacing: '-0.03em' }}>
                  {finishedBooksCount}
                </p>
              </div>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                📚
              </div>
            </div>

            {/* Stat 2: Reviews Written */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1.5px solid #e5e5e5',
                borderRadius: '8px',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              }}
            >
              <div>
                <p style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca3af', margin: '0 0 6px' }}>
                  Reviews Written
                </p>
                <p style={{ fontSize: '28px', fontWeight: 900, color: '#0a0a0a', margin: 0, letterSpacing: '-0.03em' }}>
                  {authoredReviewsCount}
                </p>
              </div>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                ✍️
              </div>
            </div>

            {/* Stat 3: Community Rating */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1.5px solid #e5e5e5',
                borderRadius: '8px',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              }}
            >
              <div>
                <p style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca3af', margin: '0 0 6px' }}>
                  Library Catalog
                </p>
                <p style={{ fontSize: '28px', fontWeight: 900, color: '#0a0a0a', margin: 0, letterSpacing: '-0.03em' }}>
                  {totalCount}
                </p>
              </div>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#fefce8', border: '1px solid #fef08a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                ⭐
              </div>
            </div>

            {/* Stat 4: Favorites */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1.5px solid #e5e5e5',
                borderRadius: '8px',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              }}
            >
              <div>
                <p style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca3af', margin: '0 0 6px' }}>
                  Saved Favorites
                </p>
                <p style={{ fontSize: '28px', fontWeight: 900, color: '#0a0a0a', margin: 0, letterSpacing: '-0.03em' }}>
                  {favCount}
                </p>
              </div>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#fff1f2', border: '1px solid #fecdd3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                ❤️
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION: BOOK LIBRARY ───────────────────────────────── */}
        <div id="book-library">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <p style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#0a0a0a', margin: 0 }}>
              Curated Book Catalog
            </p>
            <span style={{ fontSize: '11px', color: '#6b7280' }}>
              Showing {books.length} of {totalCount} books
            </span>
          </div>

          {/* Filter Bar */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1.5px solid #e5e5e5',
              borderRadius: '8px',
              padding: '14px 18px',
              marginBottom: '24px',
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              alignItems: 'center',
              boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
            }}
          >
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
              <svg
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}
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
                placeholder="Search by title, author, keyword..."
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 34px',
                  border: '1px solid #e5e5e5',
                  borderRadius: '4px',
                  fontSize: '13px',
                  color: '#0a0a0a',
                  outline: 'none',
                  fontFamily: "'Inter', sans-serif",
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s ease',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#0a0a0a')}
                onBlur={(e) => (e.target.style.borderColor = '#e5e5e5')}
              />
            </div>

            {/* Genre Select */}
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              style={{
                padding: '9px 12px',
                border: '1px solid #e5e5e5',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#374151',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
                outline: 'none',
              }}
            >
              <option value="All">All Genres</option>
              {GENRES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>

            {/* Rating Select */}
            <select
              value={minRating}
              onChange={(e) => setMinRating(e.target.value)}
              style={{
                padding: '9px 12px',
                border: '1px solid #e5e5e5',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#374151',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
                outline: 'none',
              }}
            >
              <option value="">Any Rating</option>
              {[4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>{n}+ Stars</option>
              ))}
            </select>

            {/* Sort Select */}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              style={{
                padding: '9px 12px',
                border: '1px solid #e5e5e5',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#374151',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
                outline: 'none',
              }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest_rated">Highest Rated</option>
              <option value="lowest_rated">Lowest Rated</option>
            </select>

            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#b91c1c',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '4px',
                  padding: '9px 14px',
                  cursor: 'pointer',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                Reset ({activeFilterCount})
              </button>
            )}
          </div>

          {/* Book Cards Grid */}
          {isLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }} className="books-responsive">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse"
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1.5px solid #e5e5e5',
                    borderRadius: '8px',
                    padding: '20px',
                    height: '140px',
                    opacity: 0.6,
                    animation: 'pulse 1.5s infinite ease-in-out',
                  }}
                />
              ))}
            </div>
          ) : isError ? (
            <div style={{ backgroundColor: '#ffffff', border: '1.5px solid #e5e5e5', borderRadius: '8px', padding: '48px 24px', textAlign: 'center' }}>
              <p style={{ color: '#0a0a0a', marginBottom: '14px', fontWeight: 700 }}>Unable to load books from server.</p>
              <button
                onClick={() => refetch()}
                style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', backgroundColor: '#0a0a0a', color: '#fff', border: 'none', borderRadius: '4px', padding: '9px 18px', cursor: 'pointer' }}
              >
                Try Again
              </button>
            </div>
          ) : books.length === 0 ? (
            <div style={{ backgroundColor: '#ffffff', border: '1.5px solid #e5e5e5', borderRadius: '8px', padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', marginBottom: '10px' }}>🔍</div>
              <p style={{ fontWeight: 800, color: '#0a0a0a', marginBottom: '4px', fontSize: '15px' }}>
                {activeFilterCount > 0 ? 'No books match your filters' : 'No books in library'}
              </p>
              <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
                {activeFilterCount > 0 ? 'Try searching for a different title, author, or genre.' : 'Check back later for new additions.'}
              </p>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', backgroundColor: '#0a0a0a', color: '#fff', border: 'none', borderRadius: '4px', padding: '9px 18px', cursor: 'pointer' }}
                >
                  Clear All Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '20px',
                }}
                className="books-responsive"
              >
                {books.map((book) => {
                  const genreStyle = GENRE_COLORS[book.genre] || GENRE_COLORS.Other;
                  const coverBg = getBookCoverGradient(book.title);

                  return (
                    <Link
                      to={`/books/${book._id}`}
                      key={book._id}
                      style={{ textDecoration: 'none', display: 'flex' }}
                    >
                      <div
                        style={{
                          flex: 1,
                          backgroundColor: '#ffffff',
                          border: '1.5px solid #e5e5e5',
                          borderRadius: '8px',
                          padding: '20px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                          cursor: 'pointer',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#0a0a0a';
                          e.currentTarget.style.transform = 'translateY(-3px)';
                          e.currentTarget.style.boxShadow = '0 10px 24px -4px rgba(0,0,0,0.08)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#e5e5e5';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.03)';
                        }}
                      >
                        {/* Book Top: Cover + Info */}
                        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>

                          {/* Book 3D Cover */}
                          <div
                            style={{
                              flexShrink: 0,
                              width: '64px',
                              height: '92px',
                              borderRadius: '4px',
                              overflow: 'hidden',
                              border: '1px solid #e5e5e5',
                              boxShadow: '2px 3px 8px rgba(0,0,0,0.12)',
                              position: 'relative',
                              backgroundColor: '#1e293b',
                            }}
                          >
                            {book.coverImage ? (
                              <img
                                src={book.coverImage}
                                alt={book.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  background: coverBg,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#ffffff',
                                }}
                              >
                                <span style={{ fontSize: '18px' }}>📖</span>
                              </div>
                            )}
                          </div>

                          {/* Book Details */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p
                              style={{
                                fontSize: '14px',
                                fontWeight: 800,
                                color: '#0a0a0a',
                                marginBottom: '4px',
                                lineHeight: 1.3,
                                overflow: 'hidden',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                              }}
                            >
                              {book.title}
                            </p>
                            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              by {book.author || 'Unknown Author'}
                            </p>
                            {book.genre && (
                              <span
                                style={{
                                  display: 'inline-block',
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  letterSpacing: '0.06em',
                                  textTransform: 'uppercase',
                                  backgroundColor: genreStyle.bg,
                                  color: genreStyle.color,
                                  border: `1px solid ${genreStyle.border}`,
                                  padding: '2px 7px',
                                  borderRadius: '4px',
                                }}
                              >
                                {book.genre}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Rating Row & Review Count */}
                        <div
                          style={{
                            borderTop: '1px solid #f3f3f3',
                            paddingTop: '12px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            {book.averageRating != null ? (
                              <>
                                <span style={{ color: '#f59e0b', fontSize: '13px' }}>
                                  {'★'.repeat(Math.round(book.averageRating))}
                                  {'☆'.repeat(5 - Math.round(book.averageRating))}
                                </span>
                                <span style={{ fontSize: '12px', fontWeight: 800, color: '#0a0a0a' }}>
                                  {Number(book.averageRating).toFixed(1)}
                                </span>
                              </>
                            ) : (
                              <span style={{ fontSize: '11px', color: '#9ca3af', fontStyle: 'italic' }}>
                                No reviews yet
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 500 }}>
                            {book.reviewCount || 0} {book.reviewCount === 1 ? 'review' : 'reviews'}
                          </span>
                        </div>

                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Infinite Scroll Sentinel */}
              <div ref={sentinelRef} style={{ padding: '36px 0', display: 'flex', justifyContent: 'center' }}>
                {isFetchingNextPage && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#6b7280', fontSize: '13px' }}>
                    <div style={{ width: '18px', height: '18px', border: '2px solid #0a0a0a', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    Loading more books...
                  </div>
                )}
                {!hasNextPage && books.length > 0 && !isFetchingNextPage && (
                  <p style={{ fontSize: '12px', color: '#9ca3af', letterSpacing: '0.06em' }}>
                    Showing all {totalCount} {totalCount === 1 ? 'book' : 'books'}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 0.3; } }
        @media (max-width: 960px) {
          .stats-grid-responsive { grid-template-columns: repeat(2, 1fr) !important; }
          .books-responsive { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 640px) {
          .stats-grid-responsive { grid-template-columns: 1fr !important; }
          .books-responsive { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
