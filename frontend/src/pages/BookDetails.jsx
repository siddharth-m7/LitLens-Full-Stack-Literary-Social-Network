import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
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
  // Comments { [reviewId]: { comments, hasNextPage, nextPage } }
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
    keepPreviousData: true,
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
      reviewsData.reviews.map(r =>
        fetchLikeStatus(r._id)
          .then(data => ({ id: r._id, ...data }))
          .catch(() => ({ id: r._id, liked: false, likeCount: 0 }))
      )
    ).then(results => {
      const map = {};
      results.forEach(({ id, liked, likeCount }) => { map[id] = { liked, likeCount }; });
      setLikeData(prev => ({ ...prev, ...map }));
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
      queryClient.setQueryData(queryKeys.favoriteStatus(id), old => ({ favorited: !old?.favorited }));
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
    mutationFn: (status) => status === null
      ? removeFromReadingList(id)
      : setReadingStatus({ bookId: id, status }),
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
    const payload = { rating: form.rating, comment: form.comment, tags: form.tags, pros: form.pros, cons: form.cons, imageUrl: form.imageUrl };
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
    // Optimistic update
    setLikeData(prev => {
      const cur = prev[reviewId] || { liked: false, likeCount: 0 };
      return { ...prev, [reviewId]: { liked: !cur.liked, likeCount: cur.liked ? cur.likeCount - 1 : cur.likeCount + 1 } };
    });
    try {
      const res = await toggleLike(reviewId);
      setLikeData(prev => ({ ...prev, [reviewId]: { liked: res.liked, likeCount: res.likeCount } }));
    } catch {
      // Revert on error
      setLikeData(prev => {
        const cur = prev[reviewId] || { liked: false, likeCount: 0 };
        return { ...prev, [reviewId]: { liked: !cur.liked, likeCount: cur.liked ? cur.likeCount - 1 : cur.likeCount + 1 } };
      });
    }
  };

  const handleToggleComments = async (reviewId) => {
    const nowExpanded = !expandedComments[reviewId];
    setExpandedComments(prev => ({ ...prev, [reviewId]: nowExpanded }));
    if (nowExpanded && !commentData[reviewId]) {
      try {
        const data = await fetchComments(reviewId, { page: 1, limit: 5 });
        setCommentData(prev => ({
          ...prev,
          [reviewId]: { comments: data.comments, hasNextPage: data.hasNextPage, nextPage: 2, totalCount: data.totalCount },
        }));
      } catch {
        setCommentData(prev => ({ ...prev, [reviewId]: { comments: [], hasNextPage: false, nextPage: 2, totalCount: 0 } }));
      }
    }
  };

  const handleLoadMoreComments = async (reviewId) => {
    const current = commentData[reviewId];
    setCommentLoadingMore(prev => ({ ...prev, [reviewId]: true }));
    try {
      const data = await fetchComments(reviewId, { page: current.nextPage, limit: 5 });
      setCommentData(prev => ({
        ...prev,
        [reviewId]: {
          comments: [...prev[reviewId].comments, ...data.comments],
          hasNextPage: data.hasNextPage,
          nextPage: current.nextPage + 1,
          totalCount: data.totalCount,
        },
      }));
    } catch {
      toast.error('Failed to load more comments');
    } finally {
      setCommentLoadingMore(prev => ({ ...prev, [reviewId]: false }));
    }
  };

  const handleAddComment = async (reviewId) => {
    const text = (commentInputs[reviewId] || '').trim();
    if (!text) return;
    setCommentLoading(prev => ({ ...prev, [reviewId]: true }));
    try {
      const data = await addComment({ reviewId, text });
      setCommentData(prev => ({
        ...prev,
        [reviewId]: {
          ...prev[reviewId],
          comments: [...(prev[reviewId]?.comments || []), data],
          totalCount: (prev[reviewId]?.totalCount || 0) + 1,
        },
      }));
      setCommentInputs(prev => ({ ...prev, [reviewId]: '' }));
    } catch {
      toast.error('Failed to post comment');
    } finally {
      setCommentLoading(prev => ({ ...prev, [reviewId]: false }));
    }
  };

  const handleDeleteComment = async (reviewId, commentId) => {
    try {
      await deleteComment(commentId);
      setCommentData(prev => ({
        ...prev,
        [reviewId]: {
          ...prev[reviewId],
          comments: prev[reviewId].comments.filter(c => c._id !== commentId),
          totalCount: Math.max(0, (prev[reviewId]?.totalCount || 1) - 1),
        },
      }));
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  const toggleTag = (tag) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag],
    }));
  };

  const addPro = () => {
    const val = form.prosInput.trim();
    if (!val) return;
    setForm(prev => ({ ...prev, pros: [...prev.pros, val], prosInput: '' }));
  };

  const removePro = (i) => setForm(prev => ({ ...prev, pros: prev.pros.filter((_, idx) => idx !== i) }));

  const addCon = () => {
    const val = form.consInput.trim();
    if (!val) return;
    setForm(prev => ({ ...prev, cons: [...prev.cons, val], consInput: '' }));
  };

  const removeCon = (i) => setForm(prev => ({ ...prev, cons: prev.cons.filter((_, idx) => idx !== i) }));

  const inputCls = 'w-full px-3 py-2.5 border border-[#E8E0CE] rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors';

  if (bookLoading) {
    return (
      <div className="min-h-screen bg-[#FAF6EE]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Book hero skeleton */}
          <div className="bg-white border border-[#E8E0CE] rounded-xl shadow-sm overflow-hidden mb-6 animate-pulse">
            <div className="p-6 sm:p-8">
              <div className="flex items-start gap-6">
                <div className="hidden sm:block w-24 h-36 bg-[#F0EAD6] rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-8 bg-[#E8E0CE] rounded w-3/4" />
                  <div className="h-4 bg-[#E8E0CE] rounded w-1/3" />
                  <div className="h-6 bg-[#E8E0CE] rounded w-24" />
                  <div className="h-4 bg-[#E8E0CE] rounded w-full mt-4" />
                  <div className="h-4 bg-[#E8E0CE] rounded w-5/6" />
                </div>
              </div>
            </div>
          </div>
          <div className="lg:grid lg:grid-cols-5 lg:gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white border border-[#E8E0CE] rounded-xl p-6 animate-pulse space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-10 bg-[#F0EAD6] rounded-lg" />
                ))}
              </div>
            </div>
            <div className="lg:col-span-3 mt-6 lg:mt-0">
              <div className="bg-white border border-[#E8E0CE] rounded-xl p-6 animate-pulse space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-[#E8E0CE] rounded w-20" />
                    <div className="h-16 bg-[#F0EAD6] rounded-lg" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-[#FAF6EE] flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">📚</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Book not found</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6EE]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Book Hero Card */}
        <div className="bg-white border border-[#E8E0CE] rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="p-6 sm:p-8">
            <div className="flex items-start gap-6">
              {book.coverImage && (
                <img
                  src={book.coverImage}
                  alt={book.title}
                  className="hidden sm:block w-24 h-36 object-cover rounded-lg border border-[#E8E0CE] flex-shrink-0"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 leading-tight">
                  {book.title}
                </h1>
                {book.author && (
                  <p className="text-gray-500 mb-3">by {book.author}</p>
                )}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {book.averageRating != null && (
                    <div className="flex items-center gap-1.5 bg-[#F0EAD6] px-3 py-1.5 rounded-lg">
                      <svg className="w-4 h-4 text-amber-400 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      <span className="text-sm font-semibold text-gray-900">{book.averageRating}</span>
                      <span className="text-sm text-gray-500">({book.reviewCount ?? 0} reviews)</span>
                    </div>
                  )}
                  {book.genre && (
                    <span className="bg-[#F0EAD6] text-gray-700 text-xs font-medium px-2.5 py-1 rounded-md">
                      {book.genre}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {book.description && (
              <p className="text-gray-600 leading-relaxed mt-2">{book.description}</p>
            )}
          </div>
        </div>

        {/* Two-column layout: left = actions + review form, right = reviews */}
        <div className="lg:grid lg:grid-cols-5 lg:gap-8 lg:items-start">

        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 lg:sticky lg:top-6 space-y-6 mb-6 lg:mb-0">

        {/* Favorite & Reading List Actions */}
        {user && (
          <div className="bg-white border border-[#E8E0CE] rounded-xl shadow-sm px-6 py-4 mb-6 flex flex-wrap items-center gap-3">
            <button
              onClick={handleToggleFavorite}
              disabled={favMutation.isPending}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium active:scale-[0.98] transition-all duration-150 ${
                isFavorited
                  ? 'border-2 border-red-400 bg-red-50 text-red-600 hover:bg-red-100'
                  : 'border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white'
              }`}
            >
              {favMutation.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
              ) : (
                <svg className="w-4 h-4" fill={isFavorited ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              )}
              {isFavorited ? 'Favorited' : 'Add to Favorites'}
            </button>

            <div className="relative" ref={rlDropdownRef}>
              <button
                onClick={() => setShowRlDropdown(!showRlDropdown)}
                disabled={rlMutation.isPending}
                className="flex items-center gap-2 border-2 border-gray-900 text-gray-900 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-900 hover:text-white active:scale-[0.98] transition-all duration-150"
              >
                {rlMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-900 border-t-transparent" />
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                )}
                {readingStatus ? RL_LABELS[readingStatus] : 'Add to Reading List'}
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showRlDropdown && (
                <div className="absolute left-0 top-full mt-1 w-52 bg-white rounded-xl shadow-lg border border-[#E8E0CE] z-20 overflow-hidden">
                  {[
                    { value: 'want_to_read', label: 'Want to Read' },
                    { value: 'reading',      label: 'Currently Reading' },
                    { value: 'finished',     label: 'Finished' },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => handleReadingListUpdate(value)}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[#F0EAD6] transition-colors ${
                        readingStatus === value ? 'bg-[#F0EAD6] text-gray-900 font-semibold' : 'text-gray-700'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                  {readingStatus && (
                    <>
                      <div className="border-t border-[#E8E0CE]" />
                      <button
                        onClick={() => handleReadingListUpdate(null)}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        Remove from List
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Review Form */}
        <div className="bg-white border border-[#E8E0CE] rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-5 border-b border-[#E8E0CE]">
            <h2 className="text-lg font-semibold text-gray-900">
              {editing ? 'Edit Your Review' : 'Share Your Thoughts'}
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Rating</label>
              <select
                name="rating"
                value={form.rating}
                onChange={handleChange}
                className={inputCls}
                required
              >
                <option value="">Select a rating</option>
                <option value="1">1 star — Poor</option>
                <option value="2">2 stars — Fair</option>
                <option value="3">3 stars — Good</option>
                <option value="4">4 stars — Very Good</option>
                <option value="5">5 stars — Excellent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Review</label>
              <textarea
                name="comment"
                value={form.comment}
                onChange={handleChange}
                rows="4"
                className="w-full px-3 py-2.5 border border-[#E8E0CE] rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors resize-none"
                placeholder="What did you think about this book? Share your insights..."
                required
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Tags <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {TAGS.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-md text-xs font-medium border transition-all duration-150 ${
                      form.tags.includes(tag)
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-600 border-[#E8E0CE] hover:bg-[#FAF6EE] hover:border-gray-400'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Pros */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Pros <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={form.prosInput}
                  onChange={e => setForm(prev => ({ ...prev, prosInput: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPro(); } }}
                  placeholder="Add a pro..."
                  className="flex-1 px-3 py-2.5 border border-[#E8E0CE] rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors text-sm"
                />
                <button
                  type="button"
                  onClick={addPro}
                  className="px-4 py-2.5 border-2 border-gray-900 text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-900 hover:text-white active:scale-[0.98] transition-all duration-150"
                >
                  + Add
                </button>
              </div>
              {form.pros.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.pros.map((pro, i) => (
                    <span key={i} className="flex items-center gap-1 bg-[#F0EAD6] text-gray-700 border border-[#E8E0CE] px-2.5 py-1 rounded-md text-xs font-medium">
                      + {pro}
                      <button type="button" onClick={() => removePro(i)} className="ml-0.5 text-gray-400 hover:text-gray-700 font-bold leading-none">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Cons */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Cons <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={form.consInput}
                  onChange={e => setForm(prev => ({ ...prev, consInput: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCon(); } }}
                  placeholder="Add a con..."
                  className="flex-1 px-3 py-2.5 border border-[#E8E0CE] rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors text-sm"
                />
                <button
                  type="button"
                  onClick={addCon}
                  className="px-4 py-2.5 border border-red-200 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 hover:border-red-300 active:scale-[0.98] transition-all duration-150"
                >
                  + Add
                </button>
              </div>
              {form.cons.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.cons.map((con, i) => (
                    <span key={i} className="flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-md text-xs font-medium">
                      — {con}
                      <button type="button" onClick={() => removeCon(i)} className="ml-0.5 text-red-400 hover:text-red-700 font-bold leading-none">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Review Image URL <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="url"
                name="imageUrl"
                value={form.imageUrl}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full px-3 py-2.5 border border-[#E8E0CE] rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors text-sm"
              />
              {form.imageUrl && (
                <img
                  src={form.imageUrl}
                  alt="Preview"
                  className="mt-2 h-24 rounded-lg object-cover border border-[#E8E0CE]"
                  onError={e => { e.target.style.display = 'none'; }}
                />
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button
                type="submit"
                disabled={addReviewMutation.isPending || updateReviewMutation.isPending}
                className="flex-1 bg-gray-900 text-white px-4 py-2.5 rounded-lg font-medium shadow-sm hover:bg-gray-800 hover:shadow-md active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {(addReviewMutation.isPending || updateReviewMutation.isPending) ? 'Saving...' : editing ? 'Update Review' : 'Submit Review'}
              </button>
              {editing && (
                <button
                  type="button"
                  onClick={() => {
                    setEditing(null);
                    setForm({ rating: '', comment: '', tags: [], pros: [], cons: [], imageUrl: '', prosInput: '', consInput: '' });
                  }}
                  className="sm:w-auto border-2 border-gray-900 text-gray-900 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-900 hover:text-white active:scale-[0.98] transition-all duration-150"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        </div> {/* end left column */}

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-3">

        {/* Reviews Section */}
        <div className="bg-white border border-[#E8E0CE] rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-[#E8E0CE] flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Reader Reviews
            </h2>
            <span className="bg-[#F0EAD6] text-gray-700 text-xs font-medium px-2.5 py-1 rounded-md">
              {reviewsData?.totalCount ?? book?.reviewCount ?? 0}
            </span>
          </div>

          <div className="p-6">
            {/* Sort controls */}
            {(reviewsData?.totalCount || 0) > 1 && (
              <div className="flex items-center gap-2 flex-wrap mb-5">
                <span className="text-sm text-gray-500">Sort:</span>
                {[
                  { value: 'newest',  label: 'Newest' },
                  { value: 'helpful', label: 'Most Helpful' },
                  { value: 'highest', label: 'Highest Rating' },
                  { value: 'lowest',  label: 'Lowest Rating' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setReviewSort(value)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
                      reviewSort === value
                        ? 'bg-gray-900 text-white'
                        : 'bg-white text-gray-500 border border-[#E8E0CE] hover:bg-[#F0EAD6] hover:text-gray-900'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {reviewsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-24 bg-[#F0EAD6] rounded-xl animate-pulse" />
                ))}
              </div>
            ) : !reviewsData?.reviews?.length ? (
              <div className="text-center py-10">
                <p className="text-gray-500 font-medium mb-1">No reviews yet</p>
                <p className="text-gray-400 text-sm">Be the first to share your thoughts about this book.</p>
              </div>
            ) : (() => {
              const sortedReviews = [...reviewsData.reviews].sort((a, b) => {
                if (reviewSort === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
                if (reviewSort === 'helpful') return (likeData[b._id]?.likeCount || 0) - (likeData[a._id]?.likeCount || 0);
                if (reviewSort === 'highest') return b.rating - a.rating;
                if (reviewSort === 'lowest') return a.rating - b.rating;
                return 0;
              });
              return (
                <div className="space-y-4">
                  {sortedReviews.map((r) => {
                    const like = likeData[r._id] || { liked: false, likeCount: 0 };
                    const commentsObj = commentData[r._id] || { comments: [], hasNextPage: false, nextPage: 2, totalCount: 0 };
                    const comments = commentsObj.comments;
                    const isExpanded = !!expandedComments[r._id];
                    const commentInput = commentInputs[r._id] || '';
                    const isSubmittingComment = !!commentLoading[r._id];

                    return (
                      <div key={r._id} className="bg-white border border-[#E8E0CE] rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                        <div className="p-5">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                            <div className="flex-1 min-w-0">
                              {/* Stars + rating */}
                              <div className="flex items-center gap-2 mb-2">
                                <div className="flex gap-0.5">
                                  {[...Array(5)].map((_, i) => (
                                    <svg key={i} className={`w-4 h-4 fill-current ${i < r.rating ? 'text-amber-400' : 'text-gray-200'}`} viewBox="0 0 20 20">
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                    </svg>
                                  ))}
                                </div>
                                <span className="text-sm font-semibold text-gray-900">{r.rating}/5</span>
                              </div>

                              {/* Review text */}
                              <p className="text-gray-700 text-sm leading-relaxed mb-3">{r.comment}</p>

                              {/* Tags */}
                              {r.tags?.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mb-3">
                                  {r.tags.map(tag => (
                                    <span key={tag} className="bg-[#F0EAD6] text-gray-700 text-xs font-medium px-2.5 py-1 rounded-md">{tag}</span>
                                  ))}
                                </div>
                              )}

                              {/* Pros */}
                              {r.pros?.length > 0 && (
                                <div className="mb-2">
                                  <p className="text-xs font-semibold text-gray-700 mb-1">Pros</p>
                                  <ul className="space-y-0.5">
                                    {r.pros.map((pro, i) => (
                                      <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                                        <span className="mt-0.5 flex-shrink-0 text-gray-400">+</span>{pro}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Cons */}
                              {r.cons?.length > 0 && (
                                <div className="mb-2">
                                  <p className="text-xs font-semibold text-gray-700 mb-1">Cons</p>
                                  <ul className="space-y-0.5">
                                    {r.cons.map((con, i) => (
                                      <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                                        <span className="mt-0.5 flex-shrink-0 text-gray-400">—</span>{con}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Review image */}
                              {r.imageUrl && (
                                <img
                                  src={r.imageUrl}
                                  alt="Review"
                                  className="mt-2 mb-3 rounded-lg max-h-48 object-cover border border-[#E8E0CE]"
                                  onError={e => { e.target.style.display = 'none'; }}
                                />
                              )}

                              {/* Reviewer info */}
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <div className="w-7 h-7 bg-[#F0EAD6] rounded-full flex items-center justify-center text-gray-700 text-xs font-semibold flex-shrink-0">
                                  {r.user?.name?.charAt(0).toUpperCase() ?? '?'}
                                </div>
                                {r.user ? (
                                  <Link
                                    to={`/users/${r.user._id}`}
                                    className="font-medium text-gray-700 hover:text-gray-900 transition-colors"
                                  >
                                    {r.user.name}
                                  </Link>
                                ) : (
                                  <span className="text-gray-400 italic">Deleted user</span>
                                )}
                              </div>
                            </div>

                            {/* Edit / Delete (own reviews) */}
                            {user?.id === r.user?._id && (
                              <div className="flex gap-2 sm:flex-col">
                                <button
                                  onClick={() => handleEdit(r)}
                                  className="border-2 border-gray-900 text-gray-900 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-900 hover:text-white active:scale-[0.98] transition-all duration-150"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteReview(r._id)}
                                  className="border border-red-200 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-100 hover:border-red-300 active:scale-[0.98] transition-all duration-150"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Like + Comment action row */}
                          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[#E8E0CE]">
                            {/* Like button */}
                            <button
                              onClick={() => handleToggleLike(r._id)}
                              disabled={!user}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 ${
                                like.liked
                                  ? 'bg-[#F0EAD6] text-gray-900 border-[#D5CAAC]'
                                  : 'bg-white text-gray-500 border-[#E8E0CE] hover:bg-[#F0EAD6] hover:text-gray-900 hover:border-[#D5CAAC]'
                              } ${!user ? 'cursor-default opacity-60' : ''}`}
                              title={user ? (like.liked ? 'Unlike' : 'Mark as helpful') : 'Login to like'}
                            >
                              <svg className="w-3.5 h-3.5" fill={like.liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                              </svg>
                              Helpful {like.likeCount > 0 && <span className="font-semibold">{like.likeCount}</span>}
                            </button>

                            {/* Comments toggle */}
                            <button
                              onClick={() => handleToggleComments(r._id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border bg-white text-gray-500 border-[#E8E0CE] hover:bg-[#F0EAD6] hover:text-gray-900 hover:border-[#D5CAAC] transition-all duration-150"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                              {isExpanded ? 'Hide' : 'Comments'}
                              {commentsObj.totalCount > 0 && <span className="font-semibold">{commentsObj.totalCount}</span>}
                            </button>
                          </div>
                        </div>

                        {/* Expandable Comments Section */}
                        {isExpanded && (
                          <div className="border-t border-[#E8E0CE] bg-[#FAF6EE] px-5 py-4">
                            {/* Comments list */}
                            {comments.length === 0 ? (
                              <p className="text-gray-400 text-sm italic mb-4">No comments yet. Be the first!</p>
                            ) : (
                              <div className="space-y-3 mb-4">
                                {comments.map(c => (
                                  <div key={c._id} className="flex items-start gap-3">
                                    <div className="w-7 h-7 rounded-full bg-[#F0EAD6] flex items-center justify-center text-gray-700 text-xs font-semibold flex-shrink-0">
                                      {c.user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 bg-white rounded-lg px-3 py-2 border border-[#E8E0CE] text-sm">
                                      <div className="flex items-center justify-between gap-2 mb-0.5">
                                        <Link to={`/users/${c.user._id}`} className="font-semibold text-gray-700 hover:text-gray-900 text-xs transition-colors">
                                          {c.user.name}
                                        </Link>
                                        <span className="text-gray-400 text-xs flex-shrink-0">
                                          {new Date(c.createdAt).toLocaleDateString()}
                                        </span>
                                      </div>
                                      <p className="text-gray-600 text-xs">{c.text}</p>
                                    </div>
                                    {user?.id === c.user._id && (
                                      <button
                                        onClick={() => handleDeleteComment(r._id, c._id)}
                                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 active:scale-[0.95] transition-all duration-150 flex-shrink-0"
                                        title="Delete comment"
                                      >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Load more comments */}
                            {commentsObj.hasNextPage && (
                              <button
                                onClick={() => handleLoadMoreComments(r._id)}
                                disabled={commentLoadingMore[r._id]}
                                className="text-xs text-gray-500 hover:text-gray-900 font-medium mb-4 flex items-center gap-1 disabled:opacity-50"
                              >
                                {commentLoadingMore[r._id] ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-gray-500 border-t-transparent" />
                                ) : '↓'} Load more comments
                              </button>
                            )}

                            {/* Comment input */}
                            {user ? (
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-[#F0EAD6] flex items-center justify-center text-gray-700 text-xs font-semibold flex-shrink-0">
                                  {user.name.charAt(0).toUpperCase()}
                                </div>
                                <input
                                  type="text"
                                  value={commentInput}
                                  onChange={e => setCommentInputs(prev => ({ ...prev, [r._id]: e.target.value }))}
                                  onKeyDown={e => { if (e.key === 'Enter') handleAddComment(r._id); }}
                                  placeholder="Add a comment..."
                                  className="flex-1 px-3 py-2 text-sm border border-[#E8E0CE] rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors"
                                />
                                <button
                                  onClick={() => handleAddComment(r._id)}
                                  disabled={!commentInput.trim() || isSubmittingComment}
                                  className="px-3 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium shadow-sm hover:bg-gray-800 hover:shadow-md active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 disabled:shadow-none transition-all duration-150"
                                >
                                  {isSubmittingComment ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                  ) : 'Post'}
                                </button>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-400">
                                <Link to="/login" className="text-gray-900 font-medium hover:underline">Log in</Link> to leave a comment.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <Pagination
                    page={reviewPage}
                    totalPages={reviewsData?.totalPages || 1}
                    onPrev={() => setReviewPage(p => p - 1)}
                    onNext={() => setReviewPage(p => p + 1)}
                  />
                </div>
              );
            })()}
          </div>
        </div>

        </div> {/* end right column */}
        </div> {/* end two-column grid */}

      </div>
    </div>
  );
}
