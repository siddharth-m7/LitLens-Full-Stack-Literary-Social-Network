import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import Avatar, { genConfig } from 'react-nice-avatar';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchBook, fetchBookReviews,
  fetchFavoriteStatus, toggleFavorite,
  fetchReadingStatus, setReadingStatus, removeFromReadingList,
  fetchLikeStatus, toggleLike,
  fetchComments, addComment, deleteComment,
  addReview, updateReview, deleteReview,
} from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import Pagination from '../components/Pagination';

const RL_LABELS = {
  want_to_read: 'Want to Read',
  reading: 'Currently Reading',
  finished: 'Finished',
};

const TAGS = [
  'Spoiler-Free', 'Contains Spoilers', 'Detailed Analysis', 'Quick Read',
  'Must Read', 'Slow Burn', 'Highly Recommended', 'Not For Everyone',
  'Beginner Friendly', 'Classic',
];

const EMPTY_FORM = { rating: '', comment: '', tags: [], pros: [], cons: [], imageUrl: '', prosInput: '', consInput: '' };

// Procedural book cover gradient generator for books without cover images
const getBookCoverGradient = (title = '') => {
  const gradients = [
    'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
    'linear-gradient(145deg, #312e81 0%, #1e1b4b 100%)',
    'linear-gradient(145deg, #134e4a 0%, #042f2e 100%)',
    'linear-gradient(145deg, #701a75 0%, #4a044e 100%)',
    'linear-gradient(145deg, #7c2d12 0%, #451a03 100%)',
    'linear-gradient(145deg, #1e3a8a 0%, #172554 100%)',
  ];
  const charCodeSum = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return gradients[charCodeSum % gradients.length];
};

export default function BookDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);
  const [showRlDropdown, setShowRlDropdown] = useState(false);
  const rlDropdownRef = useRef(null);

  // Reviews pagination
  const [reviewPage, setReviewPage] = useState(1);
  // Likes { [reviewId]: { liked, likeCount } } — local optimistic state
  const [likeData, setLikeData] = useState({});
  // Comments { [reviewId]: { comments, hasNextPage, nextPage, totalCount } }
  const [commentData, setCommentData] = useState({});
  const [commentLoadingMore, setCommentLoadingMore] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [commentLoading, setCommentLoading] = useState({});
  const [reviewSort, setReviewSort] = useState('newest');

  // ── Data queries ──────────────────────────────────────────────────────────
  const { data: book, isLoading: bookLoading } = useQuery({
    queryKey: queryKeys.book(id),
    queryFn: () => fetchBook(id),
    enabled: !!id,
  });

  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: queryKeys.bookReviews(id, reviewPage),
    queryFn: () => fetchBookReviews(id, { page: reviewPage, limit: 5 }),
    enabled: !!id,
  });

  const { data: favData } = useQuery({
    queryKey: queryKeys.favoriteStatus(id),
    queryFn: () => fetchFavoriteStatus(id),
    enabled: !!user && !!id,
  });

  const { data: rlData } = useQuery({
    queryKey: queryKeys.readingStatus(id),
    queryFn: () => fetchReadingStatus(id),
    enabled: !!user && !!id,
  });

  const isFavorited = favData?.favorited ?? false;
  const readingStatus = rlData?.status ?? null;

  // Fetch like status for current page of reviews
  useEffect(() => {
    if (!reviewsData?.reviews?.length) return;
    Promise.all(
      reviewsData.reviews.map((r) =>
        fetchLikeStatus(r._id)
          .then((data) => ({ id: r._id, ...data }))
          .catch(() => ({ id: r._id, liked: false, likeCount: 0 }))
      )
    ).then((results) => {
      const map = {};
      results.forEach(({ id, liked, likeCount }) => {
        map[id] = { liked, likeCount };
      });
      setLikeData((prev) => ({ ...prev, ...map }));
    });
  }, [reviewsData]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (rlDropdownRef.current && !rlDropdownRef.current.contains(e.target)) {
        setShowRlDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const invalidateReviews = () => {
    queryClient.invalidateQueries({ queryKey: ['bookReviews', id] });
    queryClient.invalidateQueries({ queryKey: queryKeys.book(id) });
    setReviewPage(1);
  };

  const addReviewMutation = useMutation({
    mutationFn: addReview,
    onSuccess: () => {
      invalidateReviews();
      setForm(EMPTY_FORM);
      toast.success('Review submitted!');
    },
    onError: () => toast.error('Failed to submit review'),
  });

  const updateReviewMutation = useMutation({
    mutationFn: updateReview,
    onSuccess: () => {
      invalidateReviews();
      setEditing(null);
      setForm(EMPTY_FORM);
      toast.success('Review updated!');
    },
    onError: () => toast.error('Failed to update review'),
  });

  const deleteReviewMutation = useMutation({
    mutationFn: deleteReview,
    onSuccess: () => {
      invalidateReviews();
      toast.success('Review deleted');
    },
    onError: () => toast.error('Failed to delete review'),
  });

  const favMutation = useMutation({
    mutationFn: () => toggleFavorite(id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.favoriteStatus(id) });
      const prev = queryClient.getQueryData(queryKeys.favoriteStatus(id));
      queryClient.setQueryData(queryKeys.favoriteStatus(id), (old) => ({ favorited: !old?.favorited }));
      return { prev };
    },
    onError: (_, __, ctx) => {
      queryClient.setQueryData(queryKeys.favoriteStatus(id), ctx.prev);
      toast.error('Failed to update favorites');
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.favoriteStatus(id), { favorited: data.favorited });
      toast.success(data.favorited ? 'Added to favorites' : 'Removed from favorites');
    },
  });

  const rlMutation = useMutation({
    mutationFn: (status) =>
      status === null ? removeFromReadingList(id) : setReadingStatus({ bookId: id, status }),
    onMutate: async (status) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.readingStatus(id) });
      const prev = queryClient.getQueryData(queryKeys.readingStatus(id));
      queryClient.setQueryData(queryKeys.readingStatus(id), { status });
      return { prev };
    },
    onError: (_, __, ctx) => queryClient.setQueryData(queryKeys.readingStatus(id), ctx.prev),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile() });
    },
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      rating: Number(form.rating),
      comment: form.comment,
      tags: form.tags,
      pros: form.pros,
      cons: form.cons,
      imageUrl: form.imageUrl,
    };
    if (editing) {
      updateReviewMutation.mutate({ id: editing, ...payload });
    } else {
      addReviewMutation.mutate({ bookId: id, ...payload });
    }
  };

  const handleEdit = (review) => {
    setForm({
      rating: review.rating,
      comment: review.comment,
      tags: review.tags || [],
      pros: review.pros || [],
      cons: review.cons || [],
      imageUrl: review.imageUrl || '',
      prosInput: '',
      consInput: '',
    });
    setEditing(review._id);
    document.getElementById('review-form-box')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteReview = (reviewId) => deleteReviewMutation.mutate(reviewId);

  const handleToggleFavorite = () => {
    if (!user) return;
    favMutation.mutate();
  };

  const handleReadingListUpdate = (status) => {
    setShowRlDropdown(false);
    rlMutation.mutate(status);
  };

  const handleToggleLike = async (reviewId) => {
    if (!user) return;
    setLikeData((prev) => {
      const cur = prev[reviewId] || { liked: false, likeCount: 0 };
      return { ...prev, [reviewId]: { liked: !cur.liked, likeCount: cur.liked ? cur.likeCount - 1 : cur.likeCount + 1 } };
    });
    try {
      const res = await toggleLike(reviewId);
      setLikeData((prev) => ({ ...prev, [reviewId]: { liked: res.liked, likeCount: res.likeCount } }));
    } catch {
      setLikeData((prev) => {
        const cur = prev[reviewId] || { liked: false, likeCount: 0 };
        return { ...prev, [reviewId]: { liked: !cur.liked, likeCount: cur.liked ? cur.likeCount - 1 : cur.likeCount + 1 } };
      });
    }
  };

  const handleToggleComments = async (reviewId) => {
    const nowExpanded = !expandedComments[reviewId];
    setExpandedComments((prev) => ({ ...prev, [reviewId]: nowExpanded }));
    if (nowExpanded && !commentData[reviewId]) {
      try {
        const data = await fetchComments(reviewId, { page: 1, limit: 5 });
        setCommentData((prev) => ({
          ...prev,
          [reviewId]: { comments: data.comments, hasNextPage: data.hasNextPage, nextPage: 2, totalCount: data.totalCount },
        }));
      } catch {
        setCommentData((prev) => ({ ...prev, [reviewId]: { comments: [], hasNextPage: false, nextPage: 2, totalCount: 0 } }));
      }
    }
  };

  const handleLoadMoreComments = async (reviewId) => {
    const cur = commentData[reviewId];
    if (!cur || !cur.hasNextPage || commentLoadingMore[reviewId]) return;
    setCommentLoadingMore((prev) => ({ ...prev, [reviewId]: true }));
    try {
      const data = await fetchComments(reviewId, { page: cur.nextPage, limit: 5 });
      setCommentData((prev) => ({
        ...prev,
        [reviewId]: {
          comments: [...cur.comments, ...data.comments],
          hasNextPage: data.hasNextPage,
          nextPage: cur.nextPage + 1,
          totalCount: data.totalCount,
        },
      }));
    } catch {
      toast.error('Failed to load more comments');
    } finally {
      setCommentLoadingMore((prev) => ({ ...prev, [reviewId]: false }));
    }
  };

  const handleAddComment = async (e, reviewId) => {
    e.preventDefault();
    const content = (commentInputs[reviewId] || '').trim();
    if (!content) return;
    setCommentLoading((prev) => ({ ...prev, [reviewId]: true }));
    try {
      const newComment = await addComment({ reviewId, text: content });
      setCommentData((prev) => ({
        ...prev,
        [reviewId]: {
          ...(prev[reviewId] || { hasNextPage: false, nextPage: 2 }),
          comments: [newComment, ...(prev[reviewId]?.comments || [])],
          totalCount: (prev[reviewId]?.totalCount || 0) + 1,
        },
      }));
      setCommentInputs((prev) => ({ ...prev, [reviewId]: '' }));
      toast.success('Comment posted');
    } catch {
      toast.error('Failed to post comment');
    } finally {
      setCommentLoading((prev) => ({ ...prev, [reviewId]: false }));
    }
  };

  const handleDeleteComment = async (reviewId, commentId) => {
    try {
      await deleteComment(commentId);
      setCommentData((prev) => ({
        ...prev,
        [reviewId]: {
          ...prev[reviewId],
          comments: prev[reviewId].comments.filter((c) => c._id !== commentId),
          totalCount: Math.max(0, (prev[reviewId]?.totalCount || 1) - 1),
        },
      }));
      toast.success('Comment deleted');
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  const toggleTag = (tag) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
    }));
  };

  const addPro = () => {
    const val = form.prosInput.trim();
    if (!val) return;
    setForm((prev) => ({ ...prev, pros: [...prev.pros, val], prosInput: '' }));
  };

  const removePro = (i) => setForm((prev) => ({ ...prev, pros: prev.pros.filter((_, idx) => idx !== i) }));

  const addCon = () => {
    const val = form.consInput.trim();
    if (!val) return;
    setForm((prev) => ({ ...prev, cons: [...prev.cons, val], consInput: '' }));
  };

  const removeCon = (i) => setForm((prev) => ({ ...prev, cons: prev.cons.filter((_, idx) => idx !== i) }));

  if (bookLoading) {
    return (
      <div style={{ backgroundColor: '#f8f8f8', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '28px', height: '28px', border: '3px solid #0a0a0a', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ fontSize: '13px', color: '#6b7280' }}>Loading book details...</p>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div style={{ backgroundColor: '#f8f8f8', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '48px 36px', textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📚</div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0a0a0a', marginBottom: '6px' }}>Book Not Found</h2>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>The requested book does not exist in our library.</p>
          <Link
            to="/dashboard"
            style={{ display: 'inline-flex', padding: '8px 16px', backgroundColor: '#0a0a0a', color: '#ffffff', borderRadius: '4px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none' }}
          >
            ← Back to Library
          </Link>
        </div>
      </div>
    );
  }

  const rawReviews = reviewsData?.reviews ?? [];
  const sortedReviews = [...rawReviews].sort((a, b) => {
    if (reviewSort === 'highest') return b.rating - a.rating;
    if (reviewSort === 'lowest') return a.rating - b.rating;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return (
    <div style={{ backgroundColor: '#f8f8f8', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>

      {/* ── BREADCRUMB & BOOK HERO ─────────────────────────────── */}
      <div
        style={{
          backgroundColor: '#ffffff',
          backgroundImage:
            'linear-gradient(#e5e5e5 1px, transparent 1px), linear-gradient(90deg, #e5e5e5 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          borderBottom: '1px solid #e5e5e5',
          padding: '40px 0',
        }}
      >
        <div style={{ maxWidth: '1140px', margin: '0 auto', padding: '0 1.5rem' }}>

          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 600, color: '#9ca3af', marginBottom: '24px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            <Link to="/dashboard" style={{ color: '#6b7280', textDecoration: 'none' }}>Library</Link>
            <span>/</span>
            <span style={{ color: '#0a0a0a' }}>{book.genre || 'Book Details'}</span>
          </div>

          {/* Book Hero Card */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e5e5',
              borderRadius: '8px',
              padding: '32px',
              display: 'flex',
              gap: '32px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.02)',
              flexWrap: 'wrap',
            }}
          >
            {/* Book Cover */}
            <div
              style={{
                width: '136px',
                height: '196px',
                flexShrink: 0,
                borderRadius: '6px',
                overflow: 'hidden',
                border: '1px solid #e5e5e5',
                boxShadow: '3px 6px 18px rgba(0,0,0,0.14)',
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
                    background: getBookCoverGradient(book.title),
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '16px 12px',
                    boxSizing: 'border-box',
                    color: '#ffffff',
                    position: 'relative',
                  }}
                >
                  {/* Spine effect */}
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: 'rgba(255,255,255,0.15)', borderRight: '1px solid rgba(0,0,0,0.2)' }} />

                  {/* Header insignia */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.75 }}>
                      LitLens
                    </span>
                    <span style={{ fontSize: '10px', opacity: 0.6 }}>✦</span>
                  </div>

                  {/* Center Emblem */}
                  <div style={{ textAlign: 'center', margin: 'auto 0' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', fontSize: '18px' }}>
                      📖
                    </div>
                    <p style={{ fontSize: '11px', fontWeight: 800, lineHeight: 1.2, margin: 0, textShadow: '0 1px 4px rgba(0,0,0,0.4)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                      {book.title}
                    </p>
                  </div>

                  {/* Footer Author */}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '6px' }}>
                    <p style={{ fontSize: '9px', opacity: 0.8, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center' }}>
                      {book.author || 'Edition'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Book Meta */}
            <div style={{ flex: 1, minWidth: '280px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                {book.genre && (
                  <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 8px', backgroundColor: '#f3f3f3', border: '1px solid #e5e5e5', borderRadius: '4px', color: '#374151' }}>
                    {book.genre}
                  </span>
                )}
                {book.averageRating != null && (
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#d97706', backgroundColor: '#fffbeb', border: '1px solid #fde68a', padding: '2px 8px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    ⭐ {book.averageRating} ({book.reviewCount ?? 0} {book.reviewCount === 1 ? 'review' : 'reviews'})
                  </span>
                )}
              </div>

              <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 900, color: '#0a0a0a', letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: '6px' }}>
                {book.title}
              </h1>
              <p style={{ fontSize: '14px', color: '#6b7280', fontWeight: 600, marginBottom: '16px' }}>
                by <span style={{ color: '#0a0a0a' }}>{book.author || 'Unknown Author'}</span>
              </p>

              {book.description && (
                <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.7, maxWidth: '680px', marginBottom: '24px' }}>
                  {book.description}
                </p>
              )}

              {/* Action Buttons: Favorite & Reading List */}
              {user && (
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {/* Favorite Toggle */}
                  <button
                    onClick={handleToggleFavorite}
                    disabled={favMutation.isPending}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: isFavorited ? '#fef2f2' : '#ffffff',
                      color: isFavorited ? '#b91c1c' : '#0a0a0a',
                      border: `1.5px solid ${isFavorited ? '#fecaca' : '#0a0a0a'}`,
                      padding: '8px 16px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                    }}
                  >
                    <span>{isFavorited ? '❤️' : '🤍'}</span>
                    {isFavorited ? 'Favorited' : 'Add to Favorites'}
                  </button>

                  {/* Reading Status Dropdown */}
                  <div style={{ position: 'relative' }} ref={rlDropdownRef}>
                    <button
                      onClick={() => setShowRlDropdown(!showRlDropdown)}
                      disabled={rlMutation.isPending}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: '#0a0a0a',
                        color: '#ffffff',
                        border: '1.5px solid #0a0a0a',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                      }}
                    >
                      <span>📚</span>
                      {readingStatus ? RL_LABELS[readingStatus] : 'Add to Reading Shelf'}
                      <span style={{ fontSize: '8px', marginLeft: '2px' }}>▼</span>
                    </button>

                    {showRlDropdown && (
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: '100%',
                          marginTop: '4px',
                          width: '180px',
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5e5e5',
                          borderRadius: '6px',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                          zIndex: 20,
                          overflow: 'hidden',
                        }}
                      >
                        {['want_to_read', 'reading', 'finished'].map((status) => (
                          <button
                            key={status}
                            onClick={() => handleReadingListUpdate(status)}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '10px 14px',
                              fontSize: '11px',
                              fontWeight: 700,
                              letterSpacing: '0.04em',
                              border: 'none',
                              backgroundColor: readingStatus === status ? '#f3f3f3' : '#ffffff',
                              color: '#0a0a0a',
                              cursor: 'pointer',
                              display: 'block',
                            }}
                          >
                            {RL_LABELS[status]}
                          </button>
                        ))}
                        {readingStatus && (
                          <button
                            onClick={() => handleReadingListUpdate(null)}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '10px 14px',
                              fontSize: '11px',
                              fontWeight: 700,
                              color: '#b91c1c',
                              backgroundColor: '#fff',
                              border: 'none',
                              borderTop: '1px solid #f0f0f0',
                              cursor: 'pointer',
                            }}
                          >
                            Remove from Shelf
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── TWO-COLUMN CONTENT BODY ────────────────────────────── */}
      <div style={{ maxWidth: '1140px', margin: '0 auto', padding: '40px 1.5rem 80px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '380px 1fr',
            gap: '32px',
            alignItems: 'start',
          }}
          className="book-details-layout"
        >
          {/* ── LEFT COLUMN: WRITE / EDIT REVIEW ─────────────────── */}
          <div id="review-form-box">
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '24px', position: 'sticky', top: '24px' }}>
              <div style={{ borderBottom: '1px solid #e5e5e5', paddingBottom: '14px', marginBottom: '18px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#0a0a0a', margin: 0 }}>
                  {editing ? 'Update Your Review' : 'Share Your Thoughts'}
                </h3>
                <p style={{ fontSize: '11px', color: '#6b7280', margin: '2px 0 0' }}>
                  Share your honest rating and perspectives.
                </p>
              </div>

              {!user ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '14px' }}>Sign in to write a review for this book.</p>
                  <Link
                    to="/login"
                    style={{ display: 'inline-flex', padding: '8px 16px', backgroundColor: '#0a0a0a', color: '#ffffff', borderRadius: '4px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none' }}
                  >
                    Sign In →
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                  {/* Rating Selector */}
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280', marginBottom: '6px' }}>
                      Rating
                    </label>
                    <select
                      name="rating"
                      aria-label="Rating"
                      value={form.rating}
                      onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #e5e5e5', borderRadius: '4px', fontSize: '13px', backgroundColor: '#ffffff', color: '#0a0a0a', outline: 'none' }}
                      required
                    >
                      <option value="">Select a rating</option>
                      <option value="5">5 - Excellent (⭐⭐⭐⭐⭐)</option>
                      <option value="4">4 - Very Good (⭐⭐⭐⭐)</option>
                      <option value="3">3 - Good (⭐⭐⭐)</option>
                      <option value="2">2 - Fair (⭐⭐)</option>
                      <option value="1">1 - Poor (⭐)</option>
                    </select>
                  </div>

                  {/* Comment Textarea */}
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280', marginBottom: '6px' }}>
                      Review Comment
                    </label>
                    <textarea
                      name="comment"
                      value={form.comment}
                      onChange={handleChange}
                      placeholder="What did you think about this book? Share your thoughts..."
                      rows="4"
                      style={{ width: '100%', padding: '10px', border: '1px solid #e5e5e5', borderRadius: '4px', fontSize: '13px', outline: 'none', resize: 'vertical', fontFamily: "'Inter', sans-serif", boxSizing: 'border-box' }}
                      required
                    />
                  </div>

                  {/* Tags Multi-select */}
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280', marginBottom: '6px' }}>
                      Tags
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {TAGS.map((tag) => {
                        const selected = form.tags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleTag(tag)}
                            style={{
                              fontSize: '10px',
                              fontWeight: 600,
                              padding: '3px 8px',
                              borderRadius: '4px',
                              border: selected ? '1px solid #0a0a0a' : '1px solid #e5e5e5',
                              backgroundColor: selected ? '#0a0a0a' : '#ffffff',
                              color: selected ? '#ffffff' : '#4b5563',
                              cursor: 'pointer',
                            }}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pros Input */}
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280', marginBottom: '4px' }}>
                      Pros (Optional)
                    </label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input
                        type="text"
                        name="prosInput"
                        value={form.prosInput}
                        onChange={handleChange}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addPro(); } }}
                        placeholder="e.g. Beautiful prose"
                        style={{ flex: 1, padding: '7px 10px', border: '1px solid #e5e5e5', borderRadius: '4px', fontSize: '12px', outline: 'none' }}
                      />
                      <button
                        type="button"
                        onClick={addPro}
                        style={{ padding: '7px 12px', backgroundColor: '#f3f3f3', border: '1px solid #e5e5e5', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        + Add
                      </button>
                    </div>
                    {form.pros.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                        {form.pros.map((p, i) => (
                          <span key={i} style={{ fontSize: '10px', backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '2px 7px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            ✓ {p}
                            <button type="button" onClick={() => removePro(i)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#166534', fontSize: '10px' }}>✕</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Cons Input */}
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280', marginBottom: '4px' }}>
                      Cons (Optional)
                    </label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input
                        type="text"
                        name="consInput"
                        value={form.consInput}
                        onChange={handleChange}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCon(); } }}
                        placeholder="e.g. Slow pacing"
                        style={{ flex: 1, padding: '7px 10px', border: '1px solid #e5e5e5', borderRadius: '4px', fontSize: '12px', outline: 'none' }}
                      />
                      <button
                        type="button"
                        onClick={addCon}
                        style={{ padding: '7px 12px', backgroundColor: '#f3f3f3', border: '1px solid #e5e5e5', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        + Add
                      </button>
                    </div>
                    {form.cons.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                        {form.cons.map((c, i) => (
                          <span key={i} style={{ fontSize: '10px', backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', padding: '2px 7px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            ✗ {c}
                            <button type="button" onClick={() => removeCon(i)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#b91c1c', fontSize: '10px' }}>✕</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Image URL Input */}
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280', marginBottom: '4px' }}>
                      Image URL (Optional)
                    </label>
                    <input
                      type="url"
                      name="imageUrl"
                      value={form.imageUrl}
                      onChange={handleChange}
                      placeholder="https://..."
                      style={{ width: '100%', padding: '7px 10px', border: '1px solid #e5e5e5', borderRadius: '4px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  {/* Submit / Cancel Buttons */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <button
                      type="submit"
                      disabled={addReviewMutation.isPending || updateReviewMutation.isPending || !form.rating || !form.comment.trim()}
                      style={{
                        flex: 1,
                        padding: '10px 16px',
                        backgroundColor: '#0a0a0a',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                        opacity: !form.rating || !form.comment.trim() ? 0.5 : 1,
                      }}
                    >
                      {editing ? 'Update Review' : 'Submit Review'}
                    </button>
                    {editing && (
                      <button
                        type="button"
                        onClick={() => { setEditing(null); setForm(EMPTY_FORM); }}
                        style={{ padding: '10px 14px', backgroundColor: 'transparent', border: '1px solid #e5e5e5', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* ── RIGHT COLUMN: REVIEWS FEED & COMMENTS ───────────── */}
          <div>
            {/* Reviews Header & Sorter */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#0a0a0a', margin: 0 }}>
                  Community Reviews
                </h2>
                <span style={{ fontSize: '11px', color: '#6b7280' }}>
                  {reviewsData?.totalCount ?? book.reviewCount ?? 0} reviews published
                </span>
              </div>

              {/* Sort Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9ca3af' }}>Sort:</span>
                <select
                  value={reviewSort}
                  onChange={(e) => setReviewSort(e.target.value)}
                  style={{ padding: '6px 10px', border: '1px solid #e5e5e5', borderRadius: '4px', fontSize: '11px', fontWeight: 600, backgroundColor: '#ffffff', color: '#0a0a0a', outline: 'none' }}
                >
                  <option value="newest">Newest First</option>
                  <option value="highest">Highest Rating</option>
                  <option value="lowest">Lowest Rating</option>
                </select>
              </div>
            </div>

            {/* Reviews List */}
            {sortedReviews.length === 0 ? (
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '48px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: '36px', marginBottom: '10px' }}>📖</div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0a0a0a', marginBottom: '4px' }}>No Reviews Yet</h3>
                <p style={{ fontSize: '12px', color: '#6b7280' }}>Be the first reader to write a review for {book.title}!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {sortedReviews.map((review) => {
                  const isAuthor = user && (review.user?._id === user._id || review.user?._id === user.id || review.user === user._id);
                  const isAdmin = user?.role === 'admin';
                  const reviewerName = review.user?.name || 'Anonymous Reader';
                  const avatarConfig = genConfig(reviewerName);
                  const curLike = likeData[review._id] || { liked: false, likeCount: 0 };
                  const commentsInfo = commentData[review._id] || { comments: [], hasNextPage: false, totalCount: 0 };
                  const isExpanded = expandedComments[review._id];

                  return (
                    <div
                      key={review._id}
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e5e5',
                        borderRadius: '8px',
                        padding: '24px',
                        transition: 'border-color 0.15s ease',
                      }}
                    >
                      {/* Review Top Row: Author Meta + Rating */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', border: '1px solid #e5e5e5', flexShrink: 0 }}>
                            <Avatar style={{ width: '100%', height: '100%' }} {...avatarConfig} />
                          </div>
                          <div>
                            <Link
                              to={review.user?._id ? `/users/${review.user._id}` : '#'}
                              style={{ fontSize: '13px', fontWeight: 800, color: '#0a0a0a', textDecoration: 'none' }}
                            >
                              {reviewerName}
                            </Link>
                            <p style={{ fontSize: '10px', color: '#9ca3af', margin: '1px 0 0' }}>
                              {new Date(review.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ color: '#d97706', fontSize: '13px' }}>
                            {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                          </span>
                          <span style={{ fontSize: '12px', fontWeight: 800, color: '#0a0a0a' }}>
                            {review.rating}/5
                          </span>
                        </div>
                      </div>

                      {/* Comment text */}
                      <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.65, marginBottom: '12px' }}>
                        {review.comment}
                      </p>

                      {/* Tags */}
                      {review.tags?.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px' }}>
                          {review.tags.map((t) => (
                            <span key={t} style={{ fontSize: '10px', fontWeight: 600, color: '#4b5563', backgroundColor: '#f3f3f3', padding: '2px 7px', borderRadius: '3px' }}>
                              {t}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Pros & Cons */}
                      {(review.pros?.length > 0 || review.cons?.length > 0) && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px', backgroundColor: '#fafafa', padding: '10px 12px', borderRadius: '6px', border: '1px solid #f0f0f0' }}>
                          {review.pros?.length > 0 && (
                            <div>
                              <p style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#166534', margin: '0 0 4px' }}>Pros</p>
                              {review.pros.map((p, idx) => (
                                <p key={idx} style={{ fontSize: '11px', color: '#374151', margin: '2px 0' }}>✓ {p}</p>
                              ))}
                            </div>
                          )}
                          {review.cons?.length > 0 && (
                            <div>
                              <p style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#b91c1c', margin: '0 0 4px' }}>Cons</p>
                              {review.cons.map((c, idx) => (
                                <p key={idx} style={{ fontSize: '11px', color: '#374151', margin: '2px 0' }}>✗ {c}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Review Image */}
                      {review.imageUrl && (
                        <div style={{ marginBottom: '14px' }}>
                          <img
                            src={review.imageUrl}
                            alt="Review attachment"
                            style={{ maxHeight: '160px', borderRadius: '6px', border: '1px solid #e5e5e5', objectFit: 'cover' }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        </div>
                      )}

                      {/* Review Action Footer: Likes, Comments, Author Controls */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f0f0f0', paddingTop: '12px', marginTop: '12px', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {/* Like Button */}
                          <button
                            onClick={() => handleToggleLike(review._id)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '5px 10px',
                              borderRadius: '4px',
                              border: '1px solid #e5e5e5',
                              backgroundColor: curLike.liked ? '#fef2f2' : '#ffffff',
                              color: curLike.liked ? '#b91c1c' : '#374151',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            <span>{curLike.liked ? '❤️' : '🤍'}</span>
                            <span>{curLike.likeCount}</span>
                          </button>

                          {/* Comments Toggle */}
                          <button
                            onClick={() => handleToggleComments(review._id)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '5px 10px',
                              borderRadius: '4px',
                              border: '1px solid #e5e5e5',
                              backgroundColor: '#ffffff',
                              color: '#374151',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            <span>💬</span>
                            <span>{commentsInfo.totalCount || 0} Comments</span>
                          </button>
                        </div>

                        {/* Edit / Delete Controls (for author or admin) */}
                        {(isAuthor || isAdmin) && (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {isAuthor && (
                              <button
                                onClick={() => handleEdit(review)}
                                style={{ padding: '4px 10px', backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '4px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer', color: '#0a0a0a' }}
                              >
                                Edit
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteReview(review._id)}
                              disabled={deleteReviewMutation.isPending}
                              style={{ padding: '4px 10px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer', color: '#b91c1c' }}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>

                      {/* ── EXPANDABLE COMMENTS THREAD ─────────────────── */}
                      {isExpanded && (
                        <div style={{ marginTop: '16px', borderTop: '1px solid #f0f0f0', paddingTop: '16px' }}>
                          <p style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0a0a0a', marginBottom: '10px' }}>
                            Comments
                          </p>

                          {/* Add Comment Form */}
                          {user && (
                            <form onSubmit={(e) => handleAddComment(e, review._id)} style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                              <input
                                type="text"
                                value={commentInputs[review._id] || ''}
                                onChange={(e) => setCommentInputs({ ...commentInputs, [review._id]: e.target.value })}
                                placeholder="Add a thoughtful reply..."
                                style={{ flex: 1, padding: '7px 10px', border: '1px solid #e5e5e5', borderRadius: '4px', fontSize: '12px', outline: 'none' }}
                              />
                              <button
                                type="submit"
                                disabled={commentLoading[review._id] || !(commentInputs[review._id] || '').trim()}
                                style={{ padding: '7px 14px', backgroundColor: '#0a0a0a', color: '#ffffff', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer' }}
                              >
                                Reply
                              </button>
                            </form>
                          )}

                          {/* Comments List */}
                          {commentsInfo.comments.length === 0 ? (
                            <p style={{ fontSize: '11px', color: '#9ca3af', fontStyle: 'italic' }}>No comments yet.</p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {commentsInfo.comments.map((comment) => {
                                const isCommentAuthor = user && (comment.user?._id === user._id || comment.user === user._id);
                                return (
                                  <div key={comment._id} style={{ backgroundColor: '#fafafa', border: '1px solid #f0f0f0', borderRadius: '4px', padding: '10px 12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#0a0a0a' }}>
                                        {comment.user?.name || 'Reader'}
                                      </span>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ fontSize: '9px', color: '#9ca3af' }}>
                                          {new Date(comment.createdAt).toLocaleDateString()}
                                        </span>
                                        {(isCommentAuthor || isAdmin) && (
                                          <button
                                            onClick={() => handleDeleteComment(review._id, comment._id)}
                                            style={{ background: 'none', border: 'none', color: '#b91c1c', fontSize: '10px', cursor: 'pointer', padding: 0 }}
                                          >
                                            ✕
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                    <p style={{ fontSize: '12px', color: '#374151', margin: 0 }}>
                                      {comment.text || comment.content}
                                    </p>
                                  </div>
                                );
                              })}

                              {commentsInfo.hasNextPage && (
                                <button
                                  onClick={() => handleLoadMoreComments(review._id)}
                                  disabled={commentLoadingMore[review._id]}
                                  style={{ padding: '6px', fontSize: '10px', fontWeight: 700, color: '#6b7280', background: 'none', border: '1px solid #e5e5e5', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                  {commentLoadingMore[review._id] ? 'Loading...' : 'Load more comments'}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Pagination */}
                {(reviewsData?.totalPages || 0) > 1 && (
                  <div style={{ marginTop: '16px' }}>
                    <Pagination
                      page={reviewPage}
                      totalPages={reviewsData.totalPages}
                      onPrev={() => setReviewPage((p) => p - 1)}
                      onNext={() => setReviewPage((p) => p + 1)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .book-details-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
