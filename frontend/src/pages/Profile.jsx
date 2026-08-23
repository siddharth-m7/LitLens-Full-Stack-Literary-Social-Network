import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import Avatar, { genConfig } from 'react-nice-avatar';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import {
  fetchProfile,
  fetchFavorites,
  fetchReadingList,
  fetchFollowers,
  fetchFollowing,
  fetchMyReviews,
  updateReview,
  deleteReview,
  deleteAccount,
} from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import Pagination from '../components/Pagination';

const RL_LABELS = {
  want_to_read: 'Want to Read',
  reading: 'Currently Reading',
  finished: 'Finished',
};

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

function BookCoverThumb({ src, title = '', width = '36px', height = '50px' }) {
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
        <span style={{ fontSize: '13px' }}>📖</span>
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
        <span style={{ fontSize: '13px' }}>📖</span>
      </div>
    </div>
  );
}

async function fetchFullProfile() {
  const [profileData, favorites, readingList] = await Promise.all([
    fetchProfile(),
    fetchFavorites(),
    fetchReadingList(),
  ]);
  return { ...profileData, favorites, readingList };
}

export default function Profile() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [form, setForm] = useState({ rating: '', comment: '' });
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [followModal, setFollowModal] = useState(null); // 'followers' | 'following' | null
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reviewPage, setReviewPage] = useState(1);

  const { data: profileData } = useQuery({
    queryKey: queryKeys.profile(),
    queryFn: user?.role === 'user' ? fetchFullProfile : fetchProfile,
    enabled: !!user,
  });

  const {
    _id: profileUserId,
    name: profileUserName,
    email: profileUserEmail,
    role: profileUserRole,
    badges = [],
    milestones = [],
    followerCount = 0,
    followingCount = 0,
    reviewCount: profileReviewCount = 0,
    favorites = [],
    readingList = [],
    createdAt: userCreatedAt,
  } = profileData ?? {};

  const { data: reviewsData } = useQuery({
    queryKey: queryKeys.myReviews(reviewPage),
    queryFn: () => fetchMyReviews({ page: reviewPage, limit: 5 }),
    enabled: !!user && profileUserRole === 'user',
  });

  const reviews = reviewsData?.reviews ?? [];

  const { data: followersList = [], isLoading: loadingFollowers } = useQuery({
    queryKey: queryKeys.followers(profileUserId),
    queryFn: () => fetchFollowers(profileUserId),
    enabled: !!profileUserId && followModal === 'followers',
  });

  const { data: followingList = [], isLoading: loadingFollowing } = useQuery({
    queryKey: queryKeys.following(profileUserId),
    queryFn: () => fetchFollowing(profileUserId),
    enabled: !!profileUserId && followModal === 'following',
  });

  const profileUser = profileData
    ? { name: profileUserName, email: profileUserEmail, role: profileUserRole }
    : {};

  const updateReviewMutation = useMutation({
    mutationFn: updateReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myReviews'] });
      toast.success('Review updated');
    },
    onError: () => toast.error('Failed to update review'),
  });

  const deleteAccountMutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      queryClient.clear();
      logout();
      navigate('/');
      toast.success('Account deleted');
    },
    onError: () => toast.error('Failed to delete account'),
  });

  const deleteReviewMutation = useMutation({
    mutationFn: deleteReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myReviews'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.profile() });
      setReviewPage(1);
      toast.success('Review deleted');
    },
    onError: () => toast.error('Failed to delete review'),
  });

  const handleDelete = (id) => {
    deleteReviewMutation.mutate(id);
  };

  const handleEdit = (review) => {
    setEditingReviewId(review._id);
    setForm({ rating: review.rating, comment: review.comment });
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    updateReviewMutation.mutate(
      { id: editingReviewId, ...form },
      {
        onSuccess: () => {
          setEditingReviewId(null);
          setForm({ rating: '', comment: '' });
        },
      }
    );
  };

  const memberYear = userCreatedAt ? new Date(userCreatedAt).getFullYear() : '2025';
  const avatarConfig = genConfig(profileUserName || 'profile-user');

  return (
    <div style={{ backgroundColor: '#f8f8f8', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>

      {/* ── HEADER BANNER ────────────────────────────────────────── */}
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

            {/* Avatar & User Details */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #0a0a0a', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
                <Avatar style={{ width: '100%', height: '100%' }} {...avatarConfig} />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                  <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#0a0a0a', letterSpacing: '-0.02em' }}>
                    {profileUser?.name || 'Reader Profile'}
                  </h1>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: profileUser?.role === 'admin' ? '#fef2f2' : '#f0fdf4',
                      color: profileUser?.role === 'admin' ? '#b91c1c' : '#15803d',
                      border: `1px solid ${profileUser?.role === 'admin' ? '#fecaca' : '#bbf7d0'}`,
                    }}
                  >
                    {profileUser?.role === 'admin' ? '🛡️ Admin' : '📖 Reader'}
                  </span>
                </div>

                <p style={{ fontSize: '13px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{profileUser?.email}</span>
                  <span>•</span>
                  <span>Member since {memberYear}</span>
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link
                to="/dashboard"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#0a0a0a',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '9px 16px',
                  borderRadius: '4px',
                  textDecoration: 'none',
                }}
              >
                Dashboard →
              </Link>
            </div>
          </div>

          {/* Followers / Reviews Stats Row */}
          {profileUser?.role === 'user' && (
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
              <button
                onClick={() => setFollowModal('followers')}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  padding: '4px 0',
                }}
              >
                <span style={{ fontSize: '20px', fontWeight: 900, color: '#0a0a0a', display: 'block' }}>
                  {followerCount}
                </span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Followers →
                </span>
              </button>

              <button
                onClick={() => setFollowModal('following')}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  padding: '4px 0',
                }}
              >
                <span style={{ fontSize: '20px', fontWeight: 900, color: '#0a0a0a', display: 'block' }}>
                  {followingCount}
                </span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Following →
                </span>
              </button>

              <div>
                <span style={{ fontSize: '20px', fontWeight: 900, color: '#0a0a0a', display: 'block' }}>
                  {profileReviewCount}
                </span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Reviews Authored
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MAIN CONTENT BODY ────────────────────────────────────── */}
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '36px 1.5rem 80px', display: 'flex', flexDirection: 'column', gap: '32px' }}>

        {profileUser?.role === 'admin' ? (
          /* Admin Access Box */
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0a0a0a', marginBottom: '4px' }}>Platform Administrator</h2>
              <p style={{ fontSize: '13px', color: '#6b7280' }}>You have elevated permissions to curate books, moderate reviews, and view system metrics.</p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              style={{ padding: '10px 20px', backgroundColor: '#0a0a0a', color: '#ffffff', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}
            >
              Open Admin Center →
            </button>
          </div>
        ) : (
          <>
            {/* ── ACHIEVEMENTS & MILESTONES ───────────────────────── */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '28px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <div>
                  <h2 style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0a0a0a' }}>
                    Badges &amp; Milestones
                  </h2>
                  <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                    Badges earned through consistent reading and community engagement.
                  </p>
                </div>
              </div>

              {/* Badges row */}
              <div style={{ marginBottom: '24px' }}>
                <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: '10px' }}>
                  Earned Badges
                </p>
                {badges.length === 0 ? (
                  <p style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic' }}>
                    No badges earned yet. Write reviews to unlock your first badge!
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {badges.map((b) => (
                      <div
                        key={b.id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          backgroundColor: '#f8f8f8',
                          border: '1px solid #e5e5e5',
                          borderRadius: '6px',
                          padding: '8px 12px',
                        }}
                      >
                        <span style={{ fontSize: '18px' }}>{b.emoji}</span>
                        <div>
                          <p style={{ fontSize: '12px', fontWeight: 700, color: '#0a0a0a', margin: 0 }}>{b.label}</p>
                          <p style={{ fontSize: '10px', color: '#6b7280', margin: 0 }}>{b.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Milestones grid */}
              <div>
                <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: '10px' }}>
                  Review Milestones
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }} className="milestone-grid">
                  {milestones.map((m) => (
                    <div
                      key={m.count}
                      style={{
                        backgroundColor: m.unlocked ? '#ffffff' : '#fafafa',
                        border: m.unlocked ? '1.5px solid #0a0a0a' : '1px solid #e5e5e5',
                        borderRadius: '6px',
                        padding: '14px 10px',
                        textAlign: 'center',
                        opacity: m.unlocked ? 1 : 0.6,
                      }}
                    >
                      <span style={{ fontSize: '20px', display: 'block', marginBottom: '4px' }}>
                        {m.unlocked ? m.emoji : '🔒'}
                      </span>
                      <p style={{ fontSize: '11px', fontWeight: 700, color: '#0a0a0a', marginBottom: '2px' }}>{m.label}</p>
                      <p style={{ fontSize: '10px', color: '#6b7280' }}>{m.count} {m.count === 1 ? 'review' : 'reviews'}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── MY REVIEWS SECTION ─────────────────────────────── */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #e5e5e5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0a0a0a' }}>
                    My Book Reviews
                  </h2>
                  <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                    Manage and edit the reviews you have posted.
                  </p>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 700, backgroundColor: '#f3f3f3', color: '#374151', padding: '3px 9px', borderRadius: '4px' }}>
                  {reviewsData?.totalCount ?? profileReviewCount} Total
                </span>
              </div>

              <div style={{ padding: '24px' }}>
                {reviews.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '36px 0' }}>
                    <div style={{ fontSize: '32px', marginBottom: '10px' }}>✍️</div>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#0a0a0a', marginBottom: '4px' }}>No Reviews Written Yet</p>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '18px' }}>Explore books in the library and share your ratings.</p>
                    <Link
                      to="/dashboard"
                      style={{ display: 'inline-flex', padding: '8px 16px', backgroundColor: '#0a0a0a', color: '#ffffff', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', borderRadius: '4px', textDecoration: 'none' }}
                    >
                      Browse Books →
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {reviews.map((review) => (
                      <div
                        key={review._id}
                        style={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5e5e5',
                          borderRadius: '6px',
                          padding: '20px',
                          transition: 'border-color 0.15s ease',
                        }}
                      >
                        {editingReviewId === review._id ? (
                          /* Edit Review Form */
                          <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <p style={{ fontSize: '13px', fontWeight: 700, color: '#0a0a0a' }}>
                              Editing review for "{review.book?.title || 'Untitled Book'}"
                            </p>

                            <div>
                              <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280', marginBottom: '4px' }}>
                                Rating
                              </label>
                              <select
                                name="rating"
                                value={form.rating}
                                onChange={(e) => setForm({ ...form, rating: e.target.value })}
                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e5e5', borderRadius: '4px', fontSize: '13px', outline: 'none' }}
                                required
                              >
                                <option value="">Select a rating</option>
                                <option value="5">⭐⭐⭐⭐⭐ (5/5) - Excellent</option>
                                <option value="4">⭐⭐⭐⭐ (4/5) - Very Good</option>
                                <option value="3">⭐⭐⭐ (3/5) - Good</option>
                                <option value="2">⭐⭐ (2/5) - Fair</option>
                                <option value="1">⭐ (1/5) - Poor</option>
                              </select>
                            </div>

                            <div>
                              <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280', marginBottom: '4px' }}>
                                Review Text
                              </label>
                              <textarea
                                name="comment"
                                value={form.comment}
                                onChange={(e) => setForm({ ...form, comment: e.target.value })}
                                rows="3"
                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e5e5', borderRadius: '4px', fontSize: '13px', outline: 'none', resize: 'vertical' }}
                                required
                              />
                            </div>

                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                type="submit"
                                disabled={updateReviewMutation.isPending}
                                style={{ padding: '8px 16px', backgroundColor: '#0a0a0a', color: '#ffffff', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}
                              >
                                {updateReviewMutation.isPending ? 'Saving...' : 'Update Review'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingReviewId(null);
                                  setForm({ rating: '', comment: '' });
                                }}
                                style={{ padding: '8px 16px', backgroundColor: 'transparent', color: '#0a0a0a', border: '1px solid #e5e5e5', borderRadius: '4px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        ) : (
                          /* Review View Mode */
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                            <div style={{ flex: 1, minWidth: '240px' }}>
                              <Link
                                to={`/books/${review.book?._id}`}
                                style={{ fontSize: '14px', fontWeight: 800, color: '#0a0a0a', textDecoration: 'none', marginBottom: '4px', display: 'inline-block' }}
                              >
                                {review.book?.title || 'Untitled Book'}
                              </Link>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '4px 0 8px' }}>
                                <span style={{ color: '#d97706', fontSize: '13px' }}>
                                  {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                                </span>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: '#0a0a0a' }}>
                                  {review.rating}/5
                                </span>
                              </div>

                              <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.6, marginBottom: '8px' }}>
                                {review.comment}
                              </p>

                              {review.imageUrl && (
                                <img
                                  src={review.imageUrl}
                                  alt="Review attachment"
                                  style={{ maxHeight: '120px', borderRadius: '4px', border: '1px solid #e5e5e5', marginBottom: '8px', objectFit: 'cover' }}
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                              )}

                              <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                                Posted on {new Date(review.createdAt).toLocaleDateString()}
                              </span>
                            </div>

                            {/* Action buttons */}
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                onClick={() => handleEdit(review)}
                                style={{ padding: '6px 12px', backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '4px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', color: '#0a0a0a' }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(review._id)}
                                disabled={deleteReviewMutation.isPending}
                                style={{ padding: '6px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', color: '#b91c1c' }}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
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

            {/* ── FAVORITES & READING LIST (2 COLUMNS) ────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="profile-shelves-grid">

              {/* Favorites Shelf */}
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e5e5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0a0a0a' }}>
                    ❤️ My Favorites
                  </h3>
                  <span style={{ fontSize: '10px', fontWeight: 700, backgroundColor: '#f3f3f3', padding: '2px 8px', borderRadius: '4px' }}>
                    {favorites.filter(({ book }) => book != null).length}
                  </span>
                </div>

                <div style={{ padding: '20px' }}>
                  {favorites.filter(({ book }) => book != null).length === 0 ? (
                    <p style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
                      No favorites added yet. Heart a book on its detail page!
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
                          <BookCoverThumb src={book.coverImage} title={book.title} width="34px" height="48px" />
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

              {/* Reading List Shelf */}
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e5e5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0a0a0a' }}>
                    📚 Reading Shelves
                  </h3>
                  <span style={{ fontSize: '10px', fontWeight: 700, backgroundColor: '#f3f3f3', padding: '2px 8px', borderRadius: '4px' }}>
                    {readingList.filter(({ book }) => book != null).length}
                  </span>
                </div>

                <div style={{ padding: '20px' }}>
                  {readingList.filter(({ book }) => book != null).length === 0 ? (
                    <p style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
                      Reading list is empty. Add books from any book page!
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
                                  <BookCoverThumb src={book.coverImage} title={book.title} width="30px" height="42px" />
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

            {/* ── DANGER ZONE (ACCOUNT SETTINGS) ─────────────────── */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #fee2e2', borderRadius: '8px', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 800, color: '#b91c1c', marginBottom: '2px' }}>Danger Zone</p>
                <p style={{ fontSize: '12px', color: '#6b7280' }}>Permanently delete your account, reviews, and reading lists.</p>
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                style={{ padding: '8px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#b91c1c', cursor: 'pointer' }}
              >
                Delete Account
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── FOLLOWERS / FOLLOWING MODAL ──────────────────────────── */}
      {followModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
          onClick={() => setFollowModal(null)}
        >
          <div
            style={{ width: '100%', maxWidth: '440px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e5e5', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e5e5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#0a0a0a' }}>
                {followModal === 'followers' ? 'Followers' : 'Following'}
              </h3>
              <button onClick={() => setFollowModal(null)} style={{ background: 'none', border: 'none', fontSize: '16px', color: '#9ca3af', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ maxHeight: '340px', overflowY: 'auto', padding: '16px' }}>
              {(followModal === 'followers' ? loadingFollowers : loadingFollowing) ? (
                <p style={{ textAlign: 'center', fontSize: '12px', color: '#9ca3af', padding: '20px 0' }}>Loading...</p>
              ) : (followModal === 'followers' ? followersList : followingList).length === 0 ? (
                <p style={{ textAlign: 'center', fontSize: '12px', color: '#9ca3af', padding: '20px 0' }}>No {followModal} found.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(followModal === 'followers' ? followersList : followingList).map((item) => {
                    const targetUser = (followModal === 'followers' ? item?.follower : item?.following) || item;
                    if (!targetUser) return null;
                    const targetId = targetUser._id || item._id;
                    const targetName = targetUser.name || 'Reader';
                    const targetEmail = targetUser.email || '';

                    return (
                      <Link
                        key={targetId}
                        to={`/users/${targetId}`}
                        onClick={() => setFollowModal(null)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '10px 12px',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          border: '1px solid #e5e5e5',
                          backgroundColor: '#ffffff',
                          transition: 'border-color 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#0a0a0a')}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e5e5e5')}
                      >
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '1px solid #e5e5e5' }}>
                          <Avatar style={{ width: '100%', height: '100%' }} {...genConfig(targetName)} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '13px', fontWeight: 800, color: '#0a0a0a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {targetName}
                          </p>
                          {targetEmail ? (
                            <p style={{ fontSize: '11px', color: '#6b7280', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {targetEmail}
                            </p>
                          ) : (
                            <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#15803d', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1px 6px', borderRadius: '3px', display: 'inline-block', marginTop: '2px' }}>
                              Reader
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#0a0a0a' }}>
                          View →
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE ACCOUNT MODAL ─────────────────────────────────── */}
      {showDeleteModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            style={{ width: '100%', maxWidth: '400px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e5e5', padding: '24px', textAlign: 'center' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚠️</div>
            <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#b91c1c', marginBottom: '6px' }}>Delete Account?</h3>
            <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.6, marginBottom: '20px' }}>
              This action is permanent and cannot be undone. All your written reviews, comments, and shelves will be wiped.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{ padding: '9px 18px', backgroundColor: '#f3f3f3', color: '#0a0a0a', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={() => deleteAccountMutation.mutate()}
                disabled={deleteAccountMutation.isPending}
                style={{ padding: '9px 18px', backgroundColor: '#b91c1c', color: '#ffffff', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}
              >
                {deleteAccountMutation.isPending ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .profile-shelves-grid {
            grid-template-columns: 1fr !important;
          }
          .milestone-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
