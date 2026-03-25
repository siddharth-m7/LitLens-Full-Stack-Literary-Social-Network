import { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const GENRES = ['Fiction', 'Non-Fiction', 'Mystery', 'Science Fiction', 'Fantasy', 'Romance', 'Thriller', 'Biography', 'Self-Help', 'Historical Fiction', 'Horror', 'Poetry', 'Other'];
const LIMIT = 12;

export default function UserDashboard() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Filter state
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [genre, setGenre] = useState('All');
  const [minRating, setMinRating] = useState('');
  const [sort, setSort] = useState('newest');

  const sentinelRef = useRef(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Core fetch function
  const fetchBooks = useCallback(async (pageNum, append) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (genre !== 'All') params.set('genre', genre);
      if (minRating) params.set('minRating', minRating);
      if (sort) params.set('sort', sort);
      params.set('page', pageNum);
      params.set('limit', LIMIT);

      const res = await axios.get(`${import.meta.env.VITE_API_URL}/books?${params.toString()}`);
      const { data, hasNextPage: nextPage, totalCount: count } = res.data;

      if (append) {
        setBooks(prev => [...prev, ...data]);
      } else {
        setBooks(data);
        setTotalCount(count);
      }
      setHasNextPage(nextPage);
      setPage(pageNum);
    } catch {
      setError('Failed to load books. Please try again later.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [debouncedSearch, genre, minRating, sort]);

  // Reset and fetch on filter change
  useEffect(() => {
    setPage(1);
    setHasNextPage(false);
    fetchBooks(1, false);
  }, [fetchBooks]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !loadingMore && !loading) {
          fetchBooks(page + 1, true);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, loadingMore, loading, page, fetchBooks]);

  const clearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setGenre('All');
    setMinRating('');
    setSort('newest');
  };

  const activeFilterCount = [
    debouncedSearch !== '',
    genre !== 'All',
    minRating !== '',
    sort !== 'newest',
  ].filter(Boolean).length;

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <svg key={i} className="w-4 h-4 text-amber-400 fill-current" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <svg key={i} className="w-4 h-4 text-amber-400" viewBox="0 0 20 20">
            <defs>
              <linearGradient id="half-star">
                <stop offset="50%" stopColor="currentColor" />
                <stop offset="50%" stopColor="rgb(209 213 219)" />
              </linearGradient>
            </defs>
            <path fill="url(#half-star)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        );
      } else {
        stars.push(
          <svg key={i} className="w-4 h-4 text-gray-300 fill-current" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        );
      }
    }
    return stars;
  };

  return (
    <div className="min-h-screen bg-[#FAF6EE]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Book Library</h1>
          <p className="text-gray-500 mt-1">Discover books and share your thoughts with fellow readers</p>
        </div>

        {/* Stats Bar */}
        <div className="bg-white border border-[#E8E0CE] rounded-xl shadow-sm p-5 mb-6">
          <div className="flex items-center gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">{loading ? '—' : totalCount}</div>
              <div className="text-sm text-gray-500 mt-0.5">Books Available</div>
            </div>
            <div className="w-px h-10 bg-[#E8E0CE]" />
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                {books.reduce((acc, book) => acc + (book.reviews?.length || 0), 0)}
              </div>
              <div className="text-sm text-gray-500 mt-0.5">Reviews Loaded</div>
            </div>
            <div className="w-px h-10 bg-[#E8E0CE]" />
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                {books.filter(book => book.averageRating >= 4).length}
              </div>
              <div className="text-sm text-gray-500 mt-0.5">Highly Rated</div>
            </div>
          </div>
        </div>

        {/* Search & Filter Panel */}
        <div className="bg-white border border-[#E8E0CE] rounded-xl p-5 shadow-sm mb-6">
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, author, or description..."
                className="w-full pl-10 pr-10 py-2.5 border border-[#E8E0CE] rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Filter Row */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              {/* Genre */}
              <div className="flex-1 min-w-0">
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#E8E0CE] rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors"
                >
                  <option value="All">All Genres</option>
                  {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              {/* Min Rating */}
              <div className="flex-1 min-w-0">
                <select
                  value={minRating}
                  onChange={(e) => setMinRating(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#E8E0CE] rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors"
                >
                  <option value="">Any Rating</option>
                  <option value="1">1+ Stars</option>
                  <option value="2">2+ Stars</option>
                  <option value="3">3+ Stars</option>
                  <option value="4">4+ Stars</option>
                  <option value="5">5 Stars</option>
                </select>
              </div>

              {/* Sort */}
              <div className="flex-1 min-w-0">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#E8E0CE] rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="highest_rated">Highest Rated</option>
                  <option value="lowest_rated">Lowest Rated</option>
                </select>
              </div>

              {/* Clear Filters */}
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm hover:bg-gray-100 transition-colors whitespace-nowrap"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear ({activeFilterCount})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Books Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-900 border-t-transparent" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <p className="text-gray-900 font-medium">{error}</p>
            <button
              onClick={() => fetchBooks(1, false)}
              className="bg-gray-900 text-white px-4 py-2.5 rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              Try Again
            </button>
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg font-medium mb-1">
              {activeFilterCount > 0 ? 'No books match your filters' : 'No books available yet'}
            </p>
            <p className="text-gray-400 text-sm mb-4">
              {activeFilterCount > 0 ? 'Try adjusting your search or filters.' : 'Check back later for new additions.'}
            </p>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="bg-gray-900 text-white px-4 py-2.5 rounded-lg hover:bg-gray-800 transition-colors font-medium"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {books.map((book) => (
                <Link to={`/books/${book._id}`} key={book._id} className="group">
                  <div className="bg-white border border-[#E8E0CE] rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
                    {/* Cover + Info row */}
                    <div className="flex gap-4 flex-1">
                      {/* Cover Image */}
                      <div className="flex-shrink-0">
                        {book.coverImage ? (
                          <img
                            src={book.coverImage}
                            alt={book.title}
                            className="w-14 h-20 object-cover rounded-lg border border-[#E8E0CE]"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-14 h-20 bg-[#F0EAD6] rounded-lg border border-[#E8E0CE] items-center justify-center ${book.coverImage ? 'hidden' : 'flex'}`}
                        >
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                      </div>

                      {/* Book Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h2 className="text-base font-semibold text-gray-900 line-clamp-2 leading-snug">
                            {book.title}
                          </h2>
                        </div>
                        <p className="text-sm text-gray-500 mb-2">by {book.author}</p>
                        {book.genre && (
                          <span className="inline-block bg-[#F0EAD6] text-gray-700 text-xs font-medium px-2.5 py-1 rounded-md">
                            {book.genre}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Rating row */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#E8E0CE]">
                      <div className="flex items-center gap-1.5">
                        {book.averageRating != null ? (
                          <>
                            <div className="flex items-center gap-0.5">
                              {renderStars(book.averageRating)}
                            </div>
                            <span className="text-sm font-medium text-gray-700">
                              {book.averageRating.toFixed(1)}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No ratings yet</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {book.reviews?.length || 0} {book.reviews?.length === 1 ? 'review' : 'reviews'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="py-8 flex justify-center">
              {loadingMore && (
                <div className="flex items-center gap-2.5 text-gray-500">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-900 border-t-transparent" />
                  <span className="text-sm">Loading more books...</span>
                </div>
              )}
              {!hasNextPage && books.length > 0 && !loadingMore && (
                <p className="text-gray-400 text-sm">
                  Showing all {totalCount} {totalCount === 1 ? 'book' : 'books'}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
