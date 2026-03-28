export const queryKeys = {
  // Books
  books: (filters) => ['books', filters],
  book: (id) => ['book', id],

  // Reviews
  likeStatus: (reviewId) => ['likeStatus', reviewId],
  comments: (reviewId) => ['comments', reviewId],

  // Favorites & Reading List
  favoriteStatus: (bookId) => ['favoriteStatus', bookId],
  readingStatus: (bookId) => ['readingStatus', bookId],

  // Users
  profile: () => ['profile'],
  publicProfile: (id) => ['users', id],
  leaderboard: () => ['leaderboard'],

  // Admin
  adminUsers: () => ['admin', 'users'],
  analytics: () => ['admin', 'analytics'],

  // Follow
  followStatus: (userId) => ['followStatus', userId],
  followers: (userId) => ['followers', userId],
  following: (userId) => ['following', userId],
};
