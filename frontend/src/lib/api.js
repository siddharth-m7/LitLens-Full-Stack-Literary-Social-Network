import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || '/api/v1';

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const loginUser = (data) =>
  axios.post(`${BASE}/auth/login`, data).then(r => r.data);

export const registerUser = (data) =>
  axios.post(`${BASE}/auth/register`, data).then(r => r.data);

// ─── Books ────────────────────────────────────────────────────────────────────

export const fetchBooks = ({ page = 1, limit = 12, search, genre, minRating, sort } = {}) => {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (genre && genre !== 'All') params.set('genre', genre);
  if (minRating) params.set('minRating', minRating);
  if (sort) params.set('sort', sort);
  params.set('page', page);
  params.set('limit', limit);
  return axios.get(`${BASE}/books?${params}`).then(r => r.data);
};

export const fetchBook = (id) =>
  axios.get(`${BASE}/books/${id}`).then(r => r.data);

export const createBook = (data) =>
  axios.post(`${BASE}/books`, data, { headers: authHeaders() }).then(r => r.data);

export const updateBook = ({ id, ...data }) =>
  axios.put(`${BASE}/books/${id}`, data, { headers: authHeaders() }).then(r => r.data);

export const deleteBook = (id) =>
  axios.delete(`${BASE}/books/${id}`, { headers: authHeaders() }).then(r => r.data);

// Upload cover image file → returns { url }
export const uploadCoverFile = (file) => {
  const fd = new FormData();
  fd.append('file', file);
  return axios.post(`${BASE}/books/cover-upload`, fd, { headers: authHeaders() }).then(r => r.data);
};

// Upload cover from a remote URL → returns { url }
export const uploadCoverUrl = (imageUrl) =>
  axios.post(`${BASE}/books/cover-upload`, { imageUrl }, { headers: authHeaders() }).then(r => r.data);

// ─── Reviews ─────────────────────────────────────────────────────────────────

export const addReview = ({ bookId, ...data }) =>
  axios.post(`${BASE}/reviews/${bookId}`, data, { headers: authHeaders() }).then(r => r.data);

export const updateReview = ({ id, ...data }) =>
  axios.put(`${BASE}/reviews/${id}`, data, { headers: authHeaders() }).then(r => r.data);

export const deleteReview = (id) =>
  axios.delete(`${BASE}/reviews/${id}`, { headers: authHeaders() }).then(r => r.data);

// ─── Likes ────────────────────────────────────────────────────────────────────

export const fetchLikeStatus = (reviewId) => {
  const token = localStorage.getItem('token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  return axios.get(`${BASE}/reviews/${reviewId}/like/status`, { headers }).then(r => r.data);
};

export const toggleLike = (reviewId) =>
  axios.post(`${BASE}/reviews/${reviewId}/like`, {}, { headers: authHeaders() }).then(r => r.data);

// ─── Comments ─────────────────────────────────────────────────────────────────

export const fetchComments = (reviewId, { page = 1, limit = 5 } = {}) =>
  axios.get(`${BASE}/reviews/${reviewId}/comments?page=${page}&limit=${limit}`).then(r => r.data);

export const addComment = ({ reviewId, text, content }) =>
  axios.post(`${BASE}/reviews/${reviewId}/comments`, { text: text || content }, { headers: authHeaders() }).then(r => r.data);

export const deleteComment = (commentId) =>
  axios.delete(`${BASE}/comments/${commentId}`, { headers: authHeaders() }).then(r => r.data);

// ─── Favorites ────────────────────────────────────────────────────────────────

export const fetchFavorites = () =>
  axios.get(`${BASE}/favorites`, { headers: authHeaders() }).then(r => r.data);

export const fetchFavoriteStatus = (bookId) =>
  axios.get(`${BASE}/favorites/${bookId}/status`, { headers: authHeaders() }).then(r => r.data);

export const toggleFavorite = (bookId) =>
  axios.post(`${BASE}/favorites/${bookId}`, {}, { headers: authHeaders() }).then(r => r.data);

// ─── Reading List ─────────────────────────────────────────────────────────────

export const fetchReadingList = () =>
  axios.get(`${BASE}/reading-list`, { headers: authHeaders() }).then(r => r.data);

export const fetchReadingStatus = (bookId) =>
  axios.get(`${BASE}/reading-list/${bookId}/status`, { headers: authHeaders() }).then(r => r.data);

export const setReadingStatus = ({ bookId, status }) =>
  axios.post(`${BASE}/reading-list/${bookId}`, { status }, { headers: authHeaders() }).then(r => r.data);

export const removeFromReadingList = (bookId) =>
  axios.delete(`${BASE}/reading-list/${bookId}`, { headers: authHeaders() }).then(r => r.data);

// ─── Users ────────────────────────────────────────────────────────────────────

export const fetchProfile = () =>
  axios.get(`${BASE}/users/me`, { headers: authHeaders() }).then(r => r.data);

export const deleteAccount = () =>
  axios.delete(`${BASE}/users/me`, { headers: authHeaders() }).then(r => r.data);

export const fetchPublicProfile = (id) =>
  axios.get(`${BASE}/users/${id}`).then(r => r.data);

export const toggleFollow = (userId) =>
  axios.post(`${BASE}/follow/${userId}`, {}, { headers: authHeaders() }).then(r => r.data);

export const fetchFollowStatus = (userId) =>
  axios.get(`${BASE}/follow/${userId}/status`, { headers: authHeaders() }).then(r => r.data);

export const fetchFollowers = (userId) =>
  axios.get(`${BASE}/follow/${userId}/followers`).then(r => r.data);

export const fetchFollowing = (userId) =>
  axios.get(`${BASE}/follow/${userId}/following`).then(r => r.data);

export const fetchBookReviews = (bookId, { page = 1, limit = 5 } = {}) =>
  axios.get(`${BASE}/books/${bookId}/reviews?page=${page}&limit=${limit}`).then(r => r.data);

export const fetchUserReviews = (userId, { page = 1, limit = 5 } = {}) =>
  axios.get(`${BASE}/users/${userId}/reviews?page=${page}&limit=${limit}`).then(r => r.data);

export const fetchMyReviews = ({ page = 1, limit = 5 } = {}) =>
  axios.get(`${BASE}/reviews/my?page=${page}&limit=${limit}`, { headers: authHeaders() }).then(r => r.data);

// ─── Leaderboard ──────────────────────────────────────────────────────────────

export const fetchLeaderboard = ({ period = 'all_time' } = {}) =>
  axios.get(`${BASE}/leaderboard?period=${period}`).then(r => r.data);

// ─── Admin ────────────────────────────────────────────────────────────────────

export const fetchAdminUsers = () =>
  axios.get(`${BASE}/admin/users`, { headers: authHeaders() }).then(r => r.data);

export const banUser = (id) =>
  axios.patch(`${BASE}/admin/users/${id}/ban`, {}, { headers: authHeaders() }).then(r => r.data);

export const promoteUser = (id) =>
  axios.patch(`${BASE}/admin/users/${id}/promote`, {}, { headers: authHeaders() }).then(r => r.data);

export const fetchAnalytics = () =>
  axios.get(`${BASE}/admin/analytics`, { headers: authHeaders() }).then(r => r.data);
