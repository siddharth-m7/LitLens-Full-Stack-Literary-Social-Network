export const queryKeys = {
  // Books
  books: (filters) => ['books', filters],
  book: (id) => ['book', id],
  bookReviews: (bookId, page) => ['bookReviews', bookId, page],

  // Reviews
  myReviews: (page) => ['myReviews', page],
  userReviews: (userId, page) => ['userReviews', userId, page],
  likeStatus: (reviewId) => ['likeStatus', reviewId],
  comments: (reviewId, page) => ['comments', reviewId, page],

  // Favorites & Reading List
  favoriteStatus: (bookId) => ['favoriteStatus', bookId],
  readingStatus: (bookId) => ['readingStatus', bookId],

  // Users
  profile: () => ['profile'],
  publicProfile: (id) => ['users', id],
  leaderboard: (period = 'all_time') => ['leaderboard', period],

  // Admin
  adminUsers: () => ['admin', 'users'],
  analytics: () => ['admin', 'analytics'],

  // Follow
  followStatus: (userId) => ['followStatus', userId],
  followers: (userId) => ['followers', userId],
  following: (userId) => ['following', userId],
};
