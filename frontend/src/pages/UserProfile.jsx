import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const RL_LABELS = { want_to_read: 'Want to Read', reading: 'Currently Reading', finished: 'Finished' };
const RL_COLORS = {
  want_to_read: 'bg-[#F0EAD6] text-gray-700',
  reading: 'bg-amber-100 text-amber-800',
  finished: 'bg-green-100 text-green-800',
};

export default function UserProfile() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const isOwnProfile = currentUser?.id === id;

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/users/${id}`);
        setProfile(res.data);
        setFollowerCount(res.data.followerCount);
        setFollowingCount(res.data.followingCount);
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchFollowStatus = async () => {
      if (!currentUser || isOwnProfile) return;
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/follow/${id}/status`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setIsFollowing(res.data.following);
      } catch (err) {
        console.error('Failed to load follow status:', err);
      }
    };

    fetchProfile();
    fetchFollowStatus();
  }, [id, currentUser, isOwnProfile]);

  const handleToggleFollow = async () => {
    if (!currentUser) { navigate('/login'); return; }
    setFollowLoading(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/follow/${id}`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setIsFollowing(res.data.following);
      setFollowerCount(c => res.data.following ? c + 1 : c - 1);
    } catch (err) {
      console.error('Follow toggle failed:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6EE] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-900 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#FAF6EE] flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">👤</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">User not found</h2>
          <Link to="/" className="text-gray-600 underline text-sm">Go home</Link>
        </div>
      </div>
    );
  }

  const { user, reviews, favorites, readingList, badges = [] } = profile;
  const rlCounts = readingList.reduce((acc, e) => { acc[e.status] = (acc[e.status] || 0) + 1; return acc; }, {});

  return (
    <div className="min-h-screen bg-[#FAF6EE]">
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">

        {/* Profile Header Card */}
        <div className="bg-white border border-[#E8E0CE] rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 sm:px-10 py-8 border-b border-[#E8E0CE]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-full bg-[#F0EAD6] flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-bold text-gray-700">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{user.name}</h1>
                <p className="text-gray-500 text-sm mb-3">
                  Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>

                {/* Badges */}
                {badges.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {badges.map(b => (
                      <span
                        key={b.id}
                        title={b.desc}
                        className="bg-[#F0EAD6] text-gray-700 text-xs font-medium px-2.5 py-1 rounded-md"
                      >
                        {b.emoji} {b.label}
                      </span>
                    ))}
                  </div>
                )}

                {/* Stats row */}
                <div className="flex flex-wrap items-center gap-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900">{followerCount}</div>
                    <div className="text-gray-500 text-xs">Followers</div>
                  </div>
                  <div className="w-px h-8 bg-[#E8E0CE]" />
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900">{followingCount}</div>
                    <div className="text-gray-500 text-xs">Following</div>
                  </div>
                  <div className="w-px h-8 bg-[#E8E0CE]" />
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900">{reviews.length}</div>
                    <div className="text-gray-500 text-xs">Reviews</div>
                  </div>
                </div>
              </div>

              {/* Follow / Edit button */}
              {currentUser && !isOwnProfile && (
                <button
                  onClick={handleToggleFollow}
                  disabled={followLoading}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors text-sm ${
                    isFollowing
                      ? 'border border-gray-900 text-gray-900 hover:bg-gray-100'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {followLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                  ) : isFollowing ? 'Following' : '+ Follow'}
                </button>
              )}
              {isOwnProfile && (
                <Link
                  to="/profile"
                  className="border border-gray-900 text-gray-900 px-4 py-2.5 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm"
                >
                  Edit Profile
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white border border-[#E8E0CE] rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 sm:px-8 py-5 border-b border-[#E8E0CE] flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Reviews</h2>
            <span className="bg-[#F0EAD6] text-gray-700 text-xs font-medium px-2.5 py-1 rounded-md">{reviews.length}</span>
          </div>
          <div className="p-6 sm:p-8">
            {reviews.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-4xl mb-3">📚</div>
                <p className="text-gray-500 text-sm">No reviews posted yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map(review => (
                  <Link
                    key={review._id}
                    to={`/books/${review.book?._id}`}
                    className="flex items-start gap-4 p-4 rounded-xl border border-[#E8E0CE] hover:shadow-md transition-shadow group"
                  >
                    {review.book?.coverImage ? (
                      <img src={review.book.coverImage} alt={review.book.title} className="w-10 h-14 object-cover rounded-lg flex-shrink-0" onError={e => { e.target.style.display = 'none'; }} />
                    ) : (
                      <div className="w-10 h-14 bg-[#F0EAD6] rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-gray-500 text-sm">📖</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate text-sm">{review.book?.title}</p>
                      <div className="flex items-center gap-1 my-1">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={`text-sm ${i < review.rating ? 'text-amber-400' : 'text-amber-300 opacity-40'}`}>★</span>
                        ))}
                        <span className="text-xs text-gray-500 ml-1">{review.rating}/5</span>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">{review.comment}</p>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">{new Date(review.createdAt).toLocaleDateString()}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Favorites Section */}
        <div className="bg-white border border-[#E8E0CE] rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 sm:px-8 py-5 border-b border-[#E8E0CE] flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Favorites</h2>
            <span className="bg-[#F0EAD6] text-gray-700 text-xs font-medium px-2.5 py-1 rounded-md">{favorites.length}</span>
          </div>
          <div className="p-6 sm:p-8">
            {favorites.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-4xl mb-3">🤍</div>
                <p className="text-gray-500 text-sm">No favorite books yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {favorites.map(({ _id, book }) => (
                  <Link key={_id} to={`/books/${book._id}`} className="group text-center">
                    {book.coverImage ? (
                      <img src={book.coverImage} alt={book.title} className="w-full h-28 object-cover rounded-xl border border-[#E8E0CE] mb-2 group-hover:shadow-md transition-shadow" onError={e => { e.target.style.display='none'; }} />
                    ) : (
                      <div className="w-full h-28 bg-[#F0EAD6] rounded-xl flex items-center justify-center mb-2">
                        <span className="text-3xl">📖</span>
                      </div>
                    )}
                    <p className="text-xs font-medium text-gray-700 line-clamp-2">{book.title}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Reading List Summary */}
        <div className="bg-white border border-[#E8E0CE] rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 sm:px-8 py-5 border-b border-[#E8E0CE] flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Reading List</h2>
            <span className="bg-[#F0EAD6] text-gray-700 text-xs font-medium px-2.5 py-1 rounded-md">{readingList.length}</span>
          </div>
          <div className="p-6 sm:p-8">
            {readingList.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-4xl mb-3">📚</div>
                <p className="text-gray-500 text-sm">Reading list is empty.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {['want_to_read', 'reading', 'finished'].map(status => {
                  const items = readingList.filter(e => e.status === status);
                  if (items.length === 0) return null;
                  return (
                    <div key={status}>
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md mb-3 ${RL_COLORS[status]}`}>
                        {RL_LABELS[status]} ({items.length})
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {items.map(({ _id, book }) => (
                          <Link key={_id} to={`/books/${book._id}`} className="flex items-center gap-3 p-3 rounded-xl border border-[#E8E0CE] hover:shadow-md transition-shadow group">
                            {book.coverImage ? (
                              <img src={book.coverImage} alt={book.title} className="w-8 h-11 object-cover rounded-lg flex-shrink-0" onError={e => { e.target.style.display='none'; }} />
                            ) : (
                              <div className="w-8 h-11 bg-[#F0EAD6] rounded-lg flex items-center justify-center flex-shrink-0">
                                <span className="text-sm">📖</span>
                              </div>
                            )}
                            <p className="text-xs font-medium text-gray-700 line-clamp-2">{book.title}</p>
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
  );
}
