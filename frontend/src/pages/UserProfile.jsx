import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Avatar, { genConfig } from 'react-nice-avatar';
import { useAuth } from '../contexts/AuthContext';
import { fetchPublicProfile, fetchUserReviews, toggleFollow, fetchFollowStatus } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import Pagination from '../components/Pagination';

const RL_LABELS = { want_to_read: 'Want to Read', reading: 'Currently Reading', finished: 'Finished' };
const RL_STYLES = {
  want_to_read: { bg: '#f3f4f6', color: '#374151', border: '#e5e5e5' },
  reading: { bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
  finished: { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
};

const getBookCoverGradient = (title = '') => {
  const gradients = [
    'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
    'linear-gradient(145deg, #312e81 0%, #1e1b4b 100%)',
    'linear-gradient(145deg, #134e4a 0%, #042f2e 100%)',
    'linear-gradient(145deg, #701a75 0%, #4a044e 100%)',
    'linear-gradient(145deg, #7c2d12 0%, #451a03 100%)',
    'linear-gradient(145deg, #1e3a8a 0%, #172554 100%)',
  ];
  const charCodeSum = (title || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return gradients[charCodeSum % gradients.length];
};

function BookCoverThumb({ src, title = '', width = '40px', height = '56px', size = 'normal' }) {
  const gradient = getBookCoverGradient(title);

  if (!src) {
    return (
      <div
        style={{
          width,
          height,
          background: gradient,
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          flexShrink: 0,
          boxShadow: '1px 2px 6px rgba(0,0,0,0.12)',
          border: '1px solid rgba(0,0,0,0.08)',
        }}
      >
        <span style={{ fontSize: size === 'small' ? '12px' : '16px' }}>📖</span>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width, height, flexShrink: 0 }}>
      <img
        src={src}
        alt={title}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius: '4px',
          border: '1px solid #e5e5e5',
          boxShadow: '1px 2px 6px rgba(0,0,0,0.08)',
          display: 'block',
        }}
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          if (e.currentTarget.nextElementSibling) {
            e.currentTarget.nextElementSibling.style.display = 'flex';
          }
        }}
      />
      <div
        style={{
          display: 'none',
          width: '100%',
          height: '100%',
          background: gradient,
          borderRadius: '4px',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          boxShadow: '1px 2px 6px rgba(0,0,0,0.12)',
          border: '1px solid rgba(0,0,0,0.08)',
        }}
      >
        <span style={{ fontSize: size === 'small' ? '12px' : '16px' }}>📖</span>
      </div>
    </div>
  );
}

export default function UserProfile() {
  const { id: userId } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isOwnProfile = currentUser?._id === userId || currentUser?.id === userId;
  const [reviewPage, setReviewPage] = useState(1);

  const { data: profileData, isLoading } = useQuery({
    queryKey: queryKeys.publicProfile(userId),
    queryFn: () => fetchPublicProfile(userId),
    enabled: !!userId,
  });

  const { data: reviewsData } = useQuery({
    queryKey: queryKeys.userReviews(userId, reviewPage),
    queryFn: () => fetchUserReviews(userId, { page: reviewPage, limit: 5 }),
    enabled: !!userId,
  });

  const { data: followData } = useQuery({
    queryKey: queryKeys.followStatus(userId),
    queryFn: () => fetchFollowStatus(userId),
    enabled: !!currentUser && !isOwnProfile && !!userId,
  });

  const isFollowing = followData?.following ?? false;

  const followMutation = useMutation({
    mutationFn: () => toggleFollow(userId),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.followStatus(userId), { following: data.following });
      queryClient.invalidateQueries({ queryKey: queryKeys.publicProfile(userId) });
    },
  });

  const handleToggleFollow = () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    followMutation.mutate();
  };

  if (isLoading) {
    return (
      <div style={{ backgroundColor: '#f8f8f8', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '28px', height: '28px', border: '3px solid #0a0a0a', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ fontSize: '13px', color: '#6b7280' }}>Loading reader profile...</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div style={{ backgroundColor: '#f8f8f8', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '48px 36px', textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>👤</div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0a0a0a', marginBottom: '6px' }}>Reader Not Found</h2>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>This reader profile does not exist or may have been deactivated.</p>
          <Link
            to="/"
            style={{ display: 'inline-flex', padding: '8px 16px', backgroundColor: '#0a0a0a', color: '#ffffff', borderRadius: '4px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none' }}
          >
            ← Return Home
          </Link>
        </div>
      </div>
    );
  }

  const { user, favorites = [], readingList = [], badges = [], followerCount = 0, followingCount = 0, reviewCount = 0 } = profileData;
  const reviews = reviewsData?.reviews ?? [];
  const avatarConfig = genConfig(user?.name || 'reader-user');
  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Recently';

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
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>

            {/* Avatar & Profile Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #0a0a0a', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
                <Avatar style={{ width: '100%', height: '100%' }} {...avatarConfig} />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                  <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#0a0a0a', letterSpacing: '-0.02em', margin: 0 }}>
                    {user.name}
                  </h1>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: user.role === 'admin' ? '#fef2f2' : '#f0fdf4',
                      color: user.role === 'admin' ? '#b91c1c' : '#15803d',
                      border: `1px solid ${user.role === 'admin' ? '#fecaca' : '#bbf7d0'}`,
                    }}
                  >
                    {user.role === 'admin' ? '🛡️ Admin' : '📖 Reader'}
                  </span>
                </div>

                <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
                  Joined LitLens in {joinedDate}
                </p>

                {/* Badges Pill Row */}
                {badges.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                    {badges.map((b) => (
                      <span
                        key={b.id}
                        title={b.desc}
                        style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          backgroundColor: '#f3f3f3',
                          border: '1px solid #e5e5e5',
                          color: '#374151',
                          padding: '2px 7px',
                          borderRadius: '4px',
                        }}
                      >
                        {b.emoji} {b.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Follow / Edit Button */}
            <div>
              {currentUser && !isOwnProfile && (
                <button
                  onClick={handleToggleFollow}
                  disabled={followMutation.isPending}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: isFollowing ? '#ffffff' : '#0a0a0a',
                    color: isFollowing ? '#0a0a0a' : '#ffffff',
                    border: '1.5px solid #0a0a0a',
                    padding: '9px 18px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {followMutation.isPending ? 'Updating...' : isFollowing ? 'Following ✓' : '+ Follow Reader'}
                </button>
              )}
              {isOwnProfile && (
                <Link
                  to="/profile"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#ffffff',
                    color: '#0a0a0a',
                    border: '1.5px solid #0a0a0a',
                    padding: '9px 18px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                  }}
                >
                  Edit Profile &amp; Settings →
                </Link>
              )}
            </div>
          </div>

          {/* Followers / Following / Reviews Metrics */}
          <div
            style={{
              marginTop: '28px',
              paddingTop: '20px',
              borderTop: '1px solid #e5e5e5',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
            }}
          >
            <div>
              <span style={{ fontSize: '20px', fontWeight: 900, color: '#0a0a0a', display: 'block' }}>
                {followerCount}
              </span>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Followers
              </span>
            </div>

            <div>
              <span style={{ fontSize: '20px', fontWeight: 900, color: '#0a0a0a', display: 'block' }}>
                {followingCount}
              </span>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Following
              </span>
            </div>

            <div>
              <span style={{ fontSize: '20px', fontWeight: 900, color: '#0a0a0a', display: 'block' }}>
                {reviewsData?.totalCount ?? reviewCount}
              </span>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Reviews Written
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ───────────────────────────────────────── */}
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '36px 1.5rem 80px', display: 'flex', flexDirection: 'column', gap: '32px' }}>

        {/* ── REVIEWS POSTED ─────────────────────────────────────── */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #e5e5e5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0a0a0a', margin: 0 }}>
                Reviews by {user.name}
              </h2>
              <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px', marginBottom: 0 }}>
                Perspectives and ratings shared by this reader.
              </p>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, backgroundColor: '#f3f3f3', color: '#374151', padding: '3px 9px', borderRadius: '4px' }}>
              {reviewsData?.totalCount ?? reviewCount} Total
            </span>
          </div>

          <div style={{ padding: '24px' }}>
            {reviews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 0' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>📚</div>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>No reviews posted yet by this reader.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {reviews.map((review) => (
                  <Link
                    key={review._id}
                    to={`/books/${review.book?._id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '16px',
                      padding: '16px',
                      border: '1px solid #e5e5e5',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      transition: 'border-color 0.15s ease',
                      backgroundColor: '#ffffff',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#0a0a0a')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e5e5e5')}
                  >
                    <BookCoverThumb
                      src={review.book?.coverImage}
                      title={review.book?.title}
                      width="44px"
                      height="62px"
                    />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '14px', fontWeight: 800, color: '#0a0a0a', margin: '0 0 2px' }}>
                        {review.book?.title || 'Untitled Book'}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '2px 0 6px' }}>
                        <span style={{ color: '#d97706', fontSize: '12px' }}>
                          {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#0a0a0a' }}>
                          {review.rating}/5
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: '#4b5563', lineHeight: 1.5, margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {review.comment}
                      </p>
                    </div>

                    <span style={{ fontSize: '11px', color: '#9ca3af', flexShrink: 0 }}>
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </Link>
                ))}
              </div>
            )}

            {(reviewsData?.totalPages || 0) > 1 && (
              <div style={{ marginTop: '20px' }}>
                <Pagination
                  page={reviewPage}
                  totalPages={reviewsData.totalPages}
                  onPrev={() => setReviewPage((p) => p - 1)}
                  onNext={() => setReviewPage((p) => p + 1)}
                />
              </div>
            )}
          </div>
        </div>

        {/* ── FAVORITES & READING LIST ───────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="public-profile-grid">

          {/* Favorites Shelf */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e5e5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0a0a0a', margin: 0 }}>
                ❤️ Favorites
              </h3>
              <span style={{ fontSize: '10px', fontWeight: 700, backgroundColor: '#f3f3f3', padding: '2px 8px', borderRadius: '4px' }}>
                {favorites.filter(({ book }) => book != null).length}
              </span>
            </div>

            <div style={{ padding: '20px' }}>
              {favorites.filter(({ book }) => book != null).length === 0 ? (
                <p style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic', textAlign: 'center', padding: '20px 0', margin: 0 }}>
                  No favorite books listed yet.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {favorites.filter(({ book }) => book != null).map(({ _id, book }) => (
                    <Link
                      key={_id}
                      to={`/books/${book._id}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px',
                        border: '1px solid #e5e5e5',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        transition: 'border-color 0.15s ease',
                        backgroundColor: '#ffffff',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#0a0a0a')}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e5e5e5')}
                    >
                      <BookCoverThumb
                        src={book.coverImage}
                        title={book.title}
                        width="36px"
                        height="50px"
                        size="small"
                      />
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: '13px', fontWeight: 700, color: '#0a0a0a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.title}</p>
                        <p style={{ fontSize: '11px', color: '#6b7280', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>by {book.author}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Reading Shelves */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e5e5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0a0a0a', margin: 0 }}>
                📚 Reading List
              </h3>
              <span style={{ fontSize: '10px', fontWeight: 700, backgroundColor: '#f3f3f3', padding: '2px 8px', borderRadius: '4px' }}>
                {readingList.filter(({ book }) => book != null).length}
              </span>
            </div>

            <div style={{ padding: '20px' }}>
              {readingList.filter(({ book }) => book != null).length === 0 ? (
                <p style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic', textAlign: 'center', padding: '20px 0', margin: 0 }}>
                  Reading list is empty.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {['want_to_read', 'reading', 'finished'].map((status) => {
                    const items = readingList.filter((e) => e.status === status && e.book != null);
                    if (items.length === 0) return null;
                    const statusStyle = RL_STYLES[status];

                    return (
                      <div key={status}>
                        <span
                          style={{
                            display: 'inline-block',
                            fontSize: '10px',
                            fontWeight: 700,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            padding: '2px 7px',
                            borderRadius: '4px',
                            backgroundColor: statusStyle.bg,
                            color: statusStyle.color,
                            border: `1px solid ${statusStyle.border}`,
                            marginBottom: '8px',
                          }}
                        >
                          {RL_LABELS[status]} ({items.length})
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {items.map(({ _id, book }) => (
                            <Link
                              key={_id}
                              to={`/books/${book._id}`}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '8px 10px',
                                border: '1px solid #f0f0f0',
                                borderRadius: '4px',
                                textDecoration: 'none',
                                backgroundColor: '#fafafa',
                              }}
                            >
                              <BookCoverThumb
                                src={book.coverImage}
                                title={book.title}
                                width="30px"
                                height="42px"
                                size="small"
                              />
                              <div style={{ minWidth: 0 }}>
                                <p style={{ fontSize: '12px', fontWeight: 700, color: '#0a0a0a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.title}</p>
                                <p style={{ fontSize: '10px', color: '#6b7280', margin: '1px 0 0' }}>by {book.author}</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .public-profile-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
