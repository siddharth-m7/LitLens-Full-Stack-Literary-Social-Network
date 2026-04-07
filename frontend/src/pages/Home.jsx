// src/pages/Home.jsx

import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const FEATURES = [
  {
    num: '01',
    title: 'Discover Books',
    desc: 'Browse a curated collection across genres. Filter by rating, genre, or sort by newest.',
    icon: (
      <svg className="w-5 h-5 text-[#8B7355]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    num: '02',
    title: 'Write Reviews',
    desc: 'Share your take with ratings, tags, pros and cons, and help other readers decide what to read next.',
    icon: (
      <svg className="w-5 h-5 text-[#8B7355]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  },
  {
    num: '03',
    title: 'Join the Community',
    desc: 'Follow readers, like reviews, build your reading list, and climb the leaderboard.',
    icon: (
      <svg className="w-5 h-5 text-[#8B7355]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
];

const STATS = [
  { value: '1,000+', label: 'Books' },
  { value: '5,000+', label: 'Reviews' },
  { value: '500+',   label: 'Readers' },
];

const BOOKS = [
  { h: 'h-40', w: 'w-10', bg: 'bg-[#C8B89A]' },
  { h: 'h-52', w: 'w-9',  bg: 'bg-[#8B7355]' },
  { h: 'h-44', w: 'w-11', bg: 'bg-[#A89070]' },
  { h: 'h-56', w: 'w-8',  bg: 'bg-[#6B5440]' },
  { h: 'h-36', w: 'w-10', bg: 'bg-[#B8A07A]' },
];

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="h-[calc(100vh-4rem)] bg-[#FAF6EE] flex flex-col overflow-hidden">

      {/* Hero */}
      <div className="flex-1 flex items-center max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="w-full flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

          {/* Left */}
          <div className="flex-1 max-w-2xl">

            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-7">
              Discover &amp;{' '}
              <span className="relative inline-block">
                <span className="relative z-10">Review</span>
                <span className="absolute bottom-1 left-0 w-full h-3 bg-[#E8D9BE] -z-0 rounded-sm"></span>
              </span>
              <br />Books.
            </h1>

            <p className="text-lg text-gray-500 leading-relaxed mb-10 max-w-lg">
              A community for readers. Find your next favorite book, share honest reviews,
              and see what fellow readers are saying.
            </p>

            {user ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center gap-2.5 bg-gray-900 text-white px-7 py-3 rounded-xl font-medium shadow-sm hover:bg-[#8B7355] hover:shadow-md active:scale-[0.98] transition-all duration-200"
              >
                Go to Dashboard
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/login"
                  className="border-2 border-gray-900 text-gray-900 px-7 py-3 rounded-xl font-medium hover:bg-gray-900 hover:text-white active:scale-[0.98] transition-all duration-200 text-center"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2.5 bg-gray-900 text-white px-7 py-3 rounded-xl font-medium shadow-sm hover:bg-[#8B7355] hover:shadow-md active:scale-[0.98] transition-all duration-200"
                >
                  Join Now
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            )}
          </div>

          {/* Right: Logo */}
          <div className="hidden lg:block flex-shrink-0 w-[26rem] h-[22rem] relative">
            {/* Soft glow blob */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#E8D9BE]/60 to-[#DDD3B8]/30 blur-2xl scale-110"></div>
            {/* Rotated card shadow */}
            <div className="absolute inset-0 bg-[#EDE5D0] rounded-3xl rotate-3 shadow-md opacity-70"></div>
            {/* Main card */}
            <div className="relative w-full h-full bg-gradient-to-br from-[#F5EFE3] to-[#EDE5D0] border border-[#DDD3B8] rounded-3xl overflow-hidden flex items-center justify-center shadow-lg">
              <img
                src="/img/litlens.jpeg"
                alt="LitLens"
                className="w-full h-full object-cover rounded-3xl"
              />
            </div>
          </div>

        </div>
      </div>

      {/* Stats strip */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="border-t border-[#E8E0CE] py-7 flex items-center justify-start gap-12">
          {STATS.map(({ value, label }, i) => (
            <div key={label} className="flex items-center gap-12">
              <div>
                <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
                <p className="text-xs text-[#A89070] uppercase tracking-widest mt-1">{label}</p>
              </div>
              {i < STATS.length - 1 && <div className="w-px h-8 bg-[#E8E0CE]"></div>}
            </div>
          ))}
        </div>
      </div>

      {/* Feature Cards */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-7 border-t border-[#E8E0CE]">
        <div className="grid md:grid-cols-3 gap-5">
          {FEATURES.map(({ num, title, desc, icon }) => (
            <div
              key={num}
              className="group bg-white border border-[#E8E0CE] rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-4"
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 bg-[#F5EFE3] border border-[#DDD3B8] rounded-xl flex items-center justify-center">
                  {icon}
                </div>
                <span className="text-xs font-bold text-[#C8B89A] tracking-widest">{num}</span>
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-1.5">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
