// src/pages/Home.jsx

import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FAF6EE]">

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-widest mb-4">
            Book Reviews &amp; Recommendations
          </p>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Discover &amp; Review<br />Books.
          </h1>
          <div className="w-16 h-px bg-gray-900 mb-6"></div>
          <p className="text-lg text-gray-500 leading-relaxed mb-10 max-w-lg">
            A community for readers. Find your next favorite book, share honest reviews,
            and see what fellow readers are saying.
          </p>

          {user ? (
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-gray-900 text-white px-6 py-2.5 rounded-lg font-medium shadow-sm hover:bg-gray-800 hover:shadow-md active:scale-[0.98] transition-all duration-150"
              >
                Go to Dashboard
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/login"
                className="border-2 border-gray-900 text-gray-900 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-900 hover:text-white active:scale-[0.98] transition-all duration-150 text-center"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-gray-900 text-white px-6 py-2.5 rounded-lg font-medium shadow-sm hover:bg-gray-800 hover:shadow-md active:scale-[0.98] transition-all duration-150 text-center"
              >
                Join Now
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-t border-[#E8E0CE]"></div>
      </div>

      {/* Feature Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-6">

          <div className="bg-white border border-[#E8E0CE] rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-[#F0EAD6] rounded-lg flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">Discover Books</h3>
            <p className="text-gray-500 text-sm leading-relaxed">Browse a curated collection across genres. Filter by rating, genre, or sort by newest.</p>
          </div>

          <div className="bg-white border border-[#E8E0CE] rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-[#F0EAD6] rounded-lg flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">Write Reviews</h3>
            <p className="text-gray-500 text-sm leading-relaxed">Share your take with ratings, tags, pros and cons, and help other readers decide what to read next.</p>
          </div>

          <div className="bg-white border border-[#E8E0CE] rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-[#F0EAD6] rounded-lg flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">Join the Community</h3>
            <p className="text-gray-500 text-sm leading-relaxed">Follow other readers, like reviews, build your reading list, and climb the leaderboard.</p>
          </div>

        </div>
      </div>

    </div>
  );
}
