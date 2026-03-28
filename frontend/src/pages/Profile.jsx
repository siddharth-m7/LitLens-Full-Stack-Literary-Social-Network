import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import {
  fetchProfile,
  fetchFavorites,
  fetchReadingList,
  fetchFollowers,
  fetchFollowing,
  updateReview,
  deleteReview,
} from '../lib/api';
import { queryKeys } from '../lib/queryKeys';

const RL_LABELS = {
  want_to_read: 'Want to Read',
  reading: 'Currently Reading',
  finished: 'Finished',
};

const RL_COLORS = {
  want_to_read: 'bg-[#F0EAD6] text-gray-700',
  reading: 'bg-amber-100 text-amber-800',
  finished: 'bg-green-100 text-green-800',
};

async function fetchFullProfile() {
  const [profileData, favorites, readingList] = await Promise.all([
    fetchProfile(),
    fetchFavorites(),
    fetchReadingList(),
  ]);
  return { ...profileData, favorites, readingList };
}

export default function Profile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [form, setForm] = useState({ rating: '', comment: '' });
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [followModal, setFollowModal] = useState(null); // 'followers' | 'following' | null

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
    reviews = [],
    favorites = [],
    readingList = [],
  } = profileData ?? {};

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
      queryClient.invalidateQueries({ queryKey: queryKeys.profile() });
      toast.success('Review updated');
    },
    onError: () => toast.error('Failed to update review'),
  });

  const deleteReviewMutation = useMutation({
    mutationFn: deleteReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile() });
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

  return (
    <div className="min-h-screen bg-[#FAF6EE]">
      <div className="container mx-auto px-4 py-8 max-w-4xl">

        {/* Profile Header */}
        <div className="bg-white border border-[#E8E0CE] rounded-xl shadow-sm overflow-hidden mb-8">
          <div className="px-6 sm:px-8 py-8 border-b border-[#E8E0CE]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <div className="w-16 h-16 bg-[#F0EAD6] rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-bold text-gray-700">
                  {profileUser?.name?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-1">
                  {profileUser?.name}'s Profile
                </h1>
                <p className="text-gray-500 text-sm mb-2">{profileUser?.email}</p>
                <span className="bg-[#F0EAD6] text-gray-700 text-xs font-medium px-2.5 py-1 rounded-md">
                  {profileUser?.role}
                </span>
                {profileUser?.role === 'user' && (
                  <div className="flex items-center gap-4 mt-4">
                    <button
                      onClick={() => setFollowModal('followers')}
                      className="text-center hover:opacity-70 transition-opacity"
                    >
                      <div className="text-xl font-bold text-gray-900">{followerCount}</div>
                      <div className="text-gray-500 text-xs">Followers</div>
                    </button>
                    <div className="w-px h-8 bg-[#E8E0CE]" />
                    <button
                      onClick={() => setFollowModal('following')}
                      className="text-center hover:opacity-70 transition-opacity"
                    >
                      <div className="text-xl font-bold text-gray-900">{followingCount}</div>
                      <div className="text-gray-500 text-xs">Following</div>
                    </button>
                    <div className="w-px h-8 bg-[#E8E0CE]" />
                    <div className="text-center">
                      <div className="text-xl font-bold text-gray-900">{reviews.length}</div>
                      <div className="text-gray-500 text-xs">Reviews</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {profileUser?.role === 'admin' ? (
          /* Admin Section */
          <div className="bg-white border border-[#E8E0CE] rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 sm:px-8 py-6 border-b border-[#E8E0CE]">
              <h2 className="text-xl font-semibold text-gray-900">Admin Access</h2>
              <p className="text-gray-500 mt-1 text-sm">You have administrator privileges.</p>
            </div>
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
                <p className="text-gray-700 text-base leading-relaxed">
                  Use the dashboard to manage books and content.
                </p>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="bg-gray-900 text-white px-4 py-2.5 rounded-lg font-medium shadow-sm hover:bg-gray-800 hover:shadow-md active:scale-[0.98] transition-all duration-150"
                >
                  Go to Admin Dashboard
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">

          {/* Achievements Section */}
          <div className="bg-white border border-[#E8E0CE] rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 sm:px-8 py-5 border-b border-[#E8E0CE]">
              <h2 className="text-xl font-semibold text-gray-900">Achievements</h2>
              <p className="text-gray-500 text-sm mt-0.5">Badges earned and milestones reached</p>
            </div>
            <div className="p-6 sm:p-8 space-y-6">
              {/* Badges */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Badges</h3>
                {badges.length === 0 ? (
                  <p className="text-gray-400 text-sm italic">No badges yet — write more reviews to earn them!</p>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {badges.map(b => (
                      <div key={b.id} className="flex items-center gap-2 bg-[#F0EAD6] border border-[#E8E0CE] rounded-xl px-4 py-2.5">
                        <span className="text-xl">{b.emoji}</span>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{b.label}</p>
                          <p className="text-gray-500 text-xs">{b.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Milestones */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Milestones</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {milestones.map(m => (
                    <div
                      key={m.count}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center ${
                        m.unlocked
                          ? 'bg-[#F0EAD6] border-[#E8E0CE] text-gray-700'
                          : 'bg-white border-[#E8E0CE] text-gray-400'
                      }`}
                    >
                      <span className="text-2xl">{m.unlocked ? m.emoji : '🔒'}</span>
                      <p className="text-xs font-semibold">{m.label}</p>
                      <p className="text-xs">{m.count} review{m.count !== 1 ? 's' : ''}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* User Reviews Section */}
          <div className="bg-white border border-[#E8E0CE] rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 sm:px-8 py-5 border-b border-[#E8E0CE] flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Your Reviews</h2>
                <p className="text-gray-500 text-sm mt-0.5">Manage and edit your book reviews</p>
              </div>
              <span className="bg-[#F0EAD6] text-gray-700 text-xs font-medium px-2.5 py-1 rounded-md">
                {reviews.length}
              </span>
            </div>

            <div className="p-6 sm:p-8">
              {reviews.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">📚</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reviews Yet</h3>
                  <p className="text-gray-500 text-sm max-w-md mx-auto">
                    You haven't posted any reviews yet. Start exploring books and share your thoughts!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review._id} className="bg-white border border-[#E8E0CE] rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                      {editingReviewId === review._id ? (
                        /* Edit Form */
                        <div className="p-6">
                          <p className="text-sm font-medium text-gray-700 mb-4">
                            Editing review for "{review.book?.title || 'Untitled Book'}"
                          </p>
                          <form onSubmit={handleUpdate} className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Rating
                              </label>
                              <select
                                name="rating"
                                value={form.rating}
                                onChange={(e) =>
                                  setForm({ ...form, rating: e.target.value })
                                }
                                className="w-full px-3 py-2.5 border border-[#E8E0CE] rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors"
                                required
                              >
                                <option value="">Select a rating</option>
                                <option value="1">1 - Poor</option>
                                <option value="2">2 - Fair</option>
                                <option value="3">3 - Good</option>
                                <option value="4">4 - Very Good</option>
                                <option value="5">5 - Excellent</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Comment
                              </label>
                              <textarea
                                name="comment"
                                value={form.comment}
                                onChange={(e) =>
                                  setForm({ ...form, comment: e.target.value })
                                }
                                rows="4"
                                className="w-full px-3 py-2.5 border border-[#E8E0CE] rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors resize-none"
                                placeholder="Share your thoughts about this book..."
                                required
                              />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                              <button
                                type="submit"
                                disabled={updateReviewMutation.isPending}
                                className="flex-1 bg-gray-900 text-white px-4 py-2.5 rounded-lg font-medium shadow-sm hover:bg-gray-800 hover:shadow-md active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {updateReviewMutation.isPending ? 'Saving...' : 'Update Review'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingReviewId(null);
                                  setForm({ rating: '', comment: '' });
                                }}
                                className="border-2 border-gray-900 text-gray-900 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-900 hover:text-white active:scale-[0.98] transition-all duration-150"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        </div>
                      ) : (
                        /* Review Display */
                        <div className="p-6">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                            <div className="flex-1">
                              <h3 className="text-base font-semibold text-gray-900 mb-2">
                                {review.book?.title || 'Untitled Book'}
                              </h3>

                              <div className="flex items-center space-x-2 mb-3">
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <span key={i} className={`text-base ${i < review.rating ? 'text-amber-400' : 'text-amber-300 opacity-40'}`}>
                                      ★
                                    </span>
                                  ))}
                                </div>
                                <span className="text-sm font-semibold text-gray-700">
                                  {review.rating}/5
                                </span>
                              </div>

                              <p className="text-gray-700 text-sm leading-relaxed mb-3">
                                {review.comment}
                              </p>

                              {/* Tags */}
                              {review.tags?.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mb-3">
                                  {review.tags.map(tag => (
                                    <span key={tag} className="bg-[#F0EAD6] text-gray-700 text-xs font-medium px-2.5 py-1 rounded-md">{tag}</span>
                                  ))}
                                </div>
                              )}

                              {/* Pros */}
                              {review.pros?.length > 0 && (
                                <div className="mb-2">
                                  <p className="text-xs font-semibold text-gray-600 mb-1">Pros</p>
                                  <ul className="space-y-0.5">
                                    {review.pros.map((pro, i) => (
                                      <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                                        <span className="mt-0.5 flex-shrink-0 text-green-600">✓</span>{pro}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Cons */}
                              {review.cons?.length > 0 && (
                                <div className="mb-2">
                                  <p className="text-xs font-semibold text-gray-600 mb-1">Cons</p>
                                  <ul className="space-y-0.5">
                                    {review.cons.map((con, i) => (
                                      <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                                        <span className="mt-0.5 flex-shrink-0 text-red-500">✗</span>{con}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Review image */}
                              {review.imageUrl && (
                                <img
                                  src={review.imageUrl}
                                  alt="Review"
                                  className="mt-2 mb-3 rounded-lg max-h-40 object-cover border border-[#E8E0CE]"
                                  onError={e => { e.target.style.display = 'none'; }}
                                />
                              )}

                              <p className="text-xs text-gray-400 mt-2">
                                Posted on {new Date(review.createdAt).toLocaleDateString()}
                              </p>
                            </div>

                            <div className="flex sm:flex-col space-x-2 sm:space-x-0 sm:space-y-2">
                              <button
                                onClick={() => handleEdit(review)}
                                className="flex-1 sm:flex-none border-2 border-gray-900 text-gray-900 px-4 py-2.5 rounded-lg font-medium text-sm text-center hover:bg-gray-900 hover:text-white active:scale-[0.98] transition-all duration-150"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(review._id)}
                                disabled={deleteReviewMutation.isPending}
                                className="flex-1 sm:flex-none border border-red-200 bg-red-50 text-red-600 px-3 py-2 rounded-lg font-medium text-sm text-center hover:bg-red-100 hover:border-red-300 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Favorites Section */}
          <div className="bg-white border border-[#E8E0CE] rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 sm:px-8 py-5 border-b border-[#E8E0CE] flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">My Favorites</h2>
                <p className="text-gray-500 text-sm mt-0.5">Books you've marked as favorites</p>
              </div>
              <span className="bg-[#F0EAD6] text-gray-700 text-xs font-medium px-2.5 py-1 rounded-md">
                {favorites.filter(({ book }) => book != null).length}
              </span>
            </div>
            <div className="p-6 sm:p-8">
              {favorites.filter(({ book }) => book != null).length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">🤍</div>
                  <p className="text-gray-500 font-medium text-sm">No favorites yet</p>
                  <p className="text-gray-400 text-xs mt-1">Heart a book on its detail page to add it here</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {favorites.filter(({ book }) => book != null).map(({ _id, book }) => (
                    <Link
                      key={_id}
                      to={`/books/${book._id}`}
                      className="flex items-center gap-4 p-4 rounded-xl border border-[#E8E0CE] hover:shadow-md transition-shadow group"
                    >
                      {book.coverImage ? (
                        <img src={book.coverImage} alt={book.title} className="w-10 h-14 object-cover rounded-lg flex-shrink-0" onError={(e) => { e.target.style.display='none'; }} />
                      ) : (
                        <div className="w-10 h-14 bg-[#F0EAD6] rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-gray-500 text-lg">📖</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate text-sm">{book.title}</p>
                        <p className="text-xs text-gray-500 truncate">by {book.author}</p>
                        {book.genre && <span className="bg-[#F0EAD6] text-gray-700 text-xs font-medium px-2.5 py-1 rounded-md mt-1 inline-block">{book.genre}</span>}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Reading List Section */}
          <div className="bg-white border border-[#E8E0CE] rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 sm:px-8 py-5 border-b border-[#E8E0CE] flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">My Reading List</h2>
                <p className="text-gray-500 text-sm mt-0.5">Track your reading progress</p>
              </div>
              <span className="bg-[#F0EAD6] text-gray-700 text-xs font-medium px-2.5 py-1 rounded-md">
                {readingList.filter(({ book }) => book != null).length}
              </span>
            </div>
            <div className="p-6 sm:p-8">
              {readingList.filter(({ book }) => book != null).length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">📚</div>
                  <p className="text-gray-500 font-medium text-sm">Your reading list is empty</p>
                  <p className="text-gray-400 text-xs mt-1">Add books from their detail page</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {['want_to_read', 'reading', 'finished'].map((status) => {
                    const items = readingList.filter(e => e.status === status);
                    if (items.length === 0) return null;
                    return (
                      <div key={status}>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md mb-3 ${RL_COLORS[status]}`}>
                          {RL_LABELS[status]} ({items.length})
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {items.filter(({ book }) => book != null).map(({ _id, book }) => (
                            <Link
                              key={_id}
                              to={`/books/${book._id}`}
                              className="flex items-center gap-4 p-4 rounded-xl border border-[#E8E0CE] hover:shadow-md transition-shadow group"
                            >
                              {book.coverImage ? (
                                <img src={book.coverImage} alt={book.title} className="w-10 h-14 object-cover rounded-lg flex-shrink-0" onError={(e) => { e.target.style.display='none'; }} />
                              ) : (
                                <div className="w-10 h-14 bg-[#F0EAD6] rounded-lg flex items-center justify-center flex-shrink-0">
                                  <span className="text-gray-500 text-lg">📖</span>
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 truncate text-sm">{book.title}</p>
                                <p className="text-xs text-gray-500 truncate">by {book.author}</p>
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
        )}
      </div>

      {/* Followers / Following Modal */}
      {followModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setFollowModal(null)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

          {/* Panel */}
          <div
            className="relative bg-white border border-[#E8E0CE] rounded-2xl shadow-xl w-full max-w-sm max-h-[70vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E0CE]">
              <div>
                <h2 className="text-base font-semibold text-gray-900 capitalize">{followModal}</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {followModal === 'followers' ? `${followerCount} follower${followerCount !== 1 ? 's' : ''}` : `${followingCount} following`}
                </p>
              </div>
              <button
                onClick={() => setFollowModal(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-[#F0EAD6] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1 px-4 py-3">
              {(followModal === 'followers' ? loadingFollowers : loadingFollowing) ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-900 border-t-transparent" />
                </div>
              ) : (() => {
                const list = followModal === 'followers' ? followersList : followingList;
                const people = list.map(item =>
                  followModal === 'followers' ? item.follower : item.following
                ).filter(Boolean);

                if (people.length === 0) {
                  return (
                    <div className="text-center py-10">
                      <p className="text-gray-400 text-sm">
                        {followModal === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-1">
                    {people.map(person => (
                      <Link
                        key={person._id}
                        to={`/users/${person._id}`}
                        onClick={() => setFollowModal(null)}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[#F5EFE3] transition-colors group"
                      >
                        <div className="w-9 h-9 bg-[#F0EAD6] border border-[#DDD3B8] rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-semibold text-gray-700">
                            {person.name?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900 group-hover:text-gray-700">
                          {person.name}
                        </span>
                        <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-500 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
