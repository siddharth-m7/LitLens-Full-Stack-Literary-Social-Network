// src/pages/Home.jsx

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const FEATURES = [
  {
    num: '01',
    title: 'Discover Books',
    desc: 'Browse a curated collection across genres. Filter by rating, genre, or sort by newest.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    num: '02',
    title: 'Write Reviews',
    desc: 'Share your take with ratings, tags, pros and cons, and help other readers decide what to read next.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  },
  {
    num: '03',
    title: 'Follow Readers',
    desc: 'Connect with fellow readers, follow their activity, and grow your literary circle.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    num: '04',
    title: 'Track Reading',
    desc: 'Organise books into Want to Read, Reading, and Finished lists to stay on top of your journey.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    num: '05',
    title: 'Earn Badges',
    desc: 'Get recognised as an Early Adopter, Book Worm, or Top Reviewer each month.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
  {
    num: '06',
    title: 'Leaderboard',
    desc: 'Compete with other reviewers and climb the monthly leaderboard for glory.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

const STATS = [
  { value: '1,000+', label: 'Books' },
  { value: '5,000+', label: 'Reviews' },
  { value: '500+',   label: 'Readers' },
  { value: '12',     label: 'Genres' },
];

const TESTIMONIALS = [
  {
    quote: "LitLens completely changed how I track my reading. The community reviews are honest and detailed.",
    name: "Aisha K.",
    role: "Book Worm · 42 reviews",
    avatar: "A",
  },
  {
    quote: "I love being able to follow readers with similar tastes and see what they're reading right now.",
    name: "Marcus T.",
    role: "Top Reviewer · 89 reviews",
    avatar: "M",
  },
  {
    quote: "The badges and leaderboard keep me motivated to read more and write better reviews every month.",
    name: "Priya S.",
    role: "Early Adopter · 27 reviews",
    avatar: "P",
  },
];

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50%       { transform: translateY(-14px) rotate(1.5deg); }
        }
        @keyframes float-bg {
          0%, 100% { transform: translateY(0px) rotate(-2deg); }
          50%       { transform: translateY(-8px) rotate(-1deg); }
        }
        @keyframes blob {
          0%, 100% { transform: scale(1) translate(0, 0); border-radius: 60% 40% 55% 45% / 50% 60% 40% 50%; }
          33%       { transform: scale(1.06) translate(12px, -10px); border-radius: 45% 55% 40% 60% / 60% 45% 55% 40%; }
          66%       { transform: scale(0.96) translate(-8px, 8px);  border-radius: 55% 45% 60% 40% / 40% 55% 45% 60%; }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .animate-float     { animation: float     5.5s ease-in-out infinite; }
        .animate-float-bg  { animation: float-bg  7s   ease-in-out infinite; }
        .animate-blob      { animation: blob      9s   ease-in-out infinite; }
        .animate-spin-slow { animation: spin-slow 18s  linear     infinite; }
        .animate-marquee   { animation: marquee   28s  linear     infinite; }

        .gradient-text {
          background: linear-gradient(120deg, #8B7355 0%, #C8A055 40%, #D4A855 60%, #8B7355 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3.5s linear infinite;
        }
        .title-gradient {
          background: linear-gradient(135deg, #1a1a1a 0%, #4a3728 50%, #8B7355 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .fade-up {
          opacity: 0;
          transform: translateY(22px);
          transition: opacity 0.65s ease, transform 0.65s ease;
        }
        .fade-up.in {
          opacity: 1;
          transform: translateY(0);
        }
        .card-glow:hover {
          box-shadow: 0 8px 32px rgba(139,115,85,0.18), 0 2px 8px rgba(139,115,85,0.10);
        }
        .testimonial-card:hover {
          box-shadow: 0 12px 40px rgba(139,115,85,0.15);
        }
      `}</style>

      <div className="bg-[#FAF6EE] min-h-screen">

        {/* ── HERO ─────────────────────────────────────────────── */}
        <div className="relative overflow-hidden">
          {/* Animated background blobs */}
          <div className="pointer-events-none absolute -top-16 -right-16 w-96 h-96 bg-[#E8D9BE]/50 animate-blob" style={{ animationDelay: '0s' }} />
          <div className="pointer-events-none absolute bottom-0 -left-20 w-72 h-72 bg-[#C8B89A]/30 animate-blob" style={{ animationDelay: '4s' }} />
          <div className="pointer-events-none absolute top-1/2 left-1/3 w-[36rem] h-[36rem] bg-[#F0E8D8]/20 animate-blob" style={{ animationDelay: '2s' }} />

          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-24 relative">
            <div className="flex flex-col lg:flex-row items-center gap-14 lg:gap-20">

              {/* Left */}
              <div className="flex-1 max-w-2xl">
                {/* App name */}
                <div
                  className={`fade-up ${mounted ? 'in' : ''} inline-flex items-center gap-2 bg-white border border-[#DDD3B8] shadow-sm rounded-full px-4 py-1.5 mb-6`}
                  style={{ transitionDelay: '0ms' }}
                >
                  <span className="w-2 h-2 rounded-full bg-[#8B7355] animate-pulse" />
                  <span className="text-xs font-semibold text-[#8B7355] uppercase tracking-widest">LitLens · Literary Social Network</span>
                </div>

                <h1
                  className={`fade-up ${mounted ? 'in' : ''} text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-7`}
                  style={{ transitionDelay: '80ms' }}
                >
                  <span className="title-gradient">Discover &amp;</span>{' '}
                  <span className="relative inline-block">
                    <span className="relative z-10 gradient-text">Review</span>
                    <span className="absolute bottom-1 left-0 w-full h-3 bg-[#E8D9BE] -z-0 rounded-sm" />
                  </span>
                  <br />
                  <span className="title-gradient">Books.</span>
                </h1>

                <p
                  className={`fade-up ${mounted ? 'in' : ''} text-xl text-gray-500 leading-relaxed mb-10 max-w-lg`}
                  style={{ transitionDelay: '160ms' }}
                >
                  Your literary social network. Find your next favorite book, share honest reviews,
                  and connect with a community of passionate readers.
                </p>

                <div className={`fade-up ${mounted ? 'in' : ''} flex flex-col sm:flex-row gap-3`} style={{ transitionDelay: '240ms' }}>
                  {user ? (
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="inline-flex items-center gap-2.5 bg-gray-900 text-white px-8 py-3.5 rounded-xl font-medium shadow-md hover:bg-[#8B7355] hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200"
                    >
                      Go to Dashboard
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </button>
                  ) : (
                    <>
                      <Link
                        to="/register"
                        className="inline-flex items-center justify-center gap-2.5 bg-gray-900 text-white px-8 py-3.5 rounded-xl font-medium shadow-md hover:bg-[#8B7355] hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200"
                      >
                        Get Started Free
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </Link>
                      <Link
                        to="/login"
                        className="inline-flex items-center justify-center border-2 border-gray-900 text-gray-900 px-8 py-3.5 rounded-xl font-medium hover:bg-gray-900 hover:text-white hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200"
                      >
                        Sign In
                      </Link>
                    </>
                  )}
                </div>

                {/* Social proof */}
                <div className={`fade-up ${mounted ? 'in' : ''} mt-10 flex items-center gap-4`} style={{ transitionDelay: '320ms' }}>
                  <div className="flex -space-x-2">
                    {['A','M','P','R','S'].map((l, i) => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-[#8B7355] flex items-center justify-center text-white text-xs font-bold" style={{ zIndex: 5 - i }}>
                        {l}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold text-gray-900">500+ readers</span> already on LitLens
                  </p>
                </div>
              </div>

              {/* Right: floating image card */}
              <div
                className={`fade-up ${mounted ? 'in' : ''} hidden lg:block flex-shrink-0 w-[26rem] h-[22rem] relative`}
                style={{ transitionDelay: '100ms' }}
              >
                <div className="absolute inset-0 m-auto w-[28rem] h-[24rem] -top-4 -left-4 rounded-3xl border-2 border-dashed border-[#DDD3B8]/60 animate-spin-slow" />
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#E8D9BE]/70 to-[#DDD3B8]/40 blur-2xl scale-110 animate-blob" />
                <div className="absolute inset-0 bg-[#EDE5D0] rounded-3xl rotate-6 shadow-lg opacity-60 animate-float-bg" />
                <div className="animate-float relative w-full h-full border border-[#DDD3B8] rounded-3xl overflow-hidden shadow-2xl">
                  <img src="/img/litlens.jpeg" alt="LitLens" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20 pointer-events-none" />
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ── MARQUEE STRIP ────────────────────────────────────── */}
        <div className="border-y border-[#E8E0CE] bg-white py-4 overflow-hidden">
          <div className="flex animate-marquee whitespace-nowrap">
            {[...Array(2)].map((_, pass) => (
              <div key={pass} className="flex items-center gap-10 px-5">
                {['Discover Books','Write Reviews','Follow Readers','Earn Badges','Track Progress','Climb Leaderboard','Share Your Shelf','Find Your Genre'].map((t) => (
                  <span key={t} className="flex items-center gap-3 text-sm font-medium text-[#A89070]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C8B89A] inline-block" />
                    {t}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ── STATS ────────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map(({ value, label }, i) => (
              <div
                key={label}
                className={`fade-up ${mounted ? 'in' : ''} bg-white border border-[#E8E0CE] rounded-2xl p-6 text-center shadow-sm`}
                style={{ transitionDelay: `${200 + i * 60}ms` }}
              >
                <p className="text-3xl font-bold text-gray-900 gradient-text mb-1">{value}</p>
                <p className="text-xs text-[#A89070] uppercase tracking-widest">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── FEATURES ─────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-20">
          {/* Section header */}
          <div className={`fade-up ${mounted ? 'in' : ''} text-center mb-12`} style={{ transitionDelay: '100ms' }}>
            <p className="text-xs font-semibold text-[#8B7355] uppercase tracking-widest mb-3">Everything you need</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Built for <span className="gradient-text">book lovers</span>
            </h2>
            <p className="text-gray-500 mt-4 max-w-xl mx-auto">
              LitLens brings together discovery, community, and personal tracking in one beautifully simple platform.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ num, title, desc, icon }, i) => (
              <div
                key={num}
                className={`fade-up ${mounted ? 'in' : ''} group bg-white border border-[#E8E0CE] rounded-2xl p-6 shadow-sm card-glow hover:-translate-y-1 hover:border-[#C8B89A] transition-all duration-300 flex flex-col gap-4 cursor-default`}
                style={{ transitionDelay: `${180 + i * 70}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 bg-[#F5EFE3] border border-[#DDD3B8] rounded-xl flex items-center justify-center text-[#8B7355] group-hover:bg-[#8B7355] group-hover:border-[#8B7355] group-hover:text-white transition-all duration-300">
                    {icon}
                  </div>
                  <span className="text-xs font-bold text-[#C8B89A] tracking-widest group-hover:text-[#8B7355] transition-colors duration-200">{num}</span>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1.5 group-hover:text-[#8B7355] transition-colors duration-200">{title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── TESTIMONIALS ─────────────────────────────────────── */}
        <div className="border-t border-[#E8E0CE] bg-white py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className={`fade-up ${mounted ? 'in' : ''} text-center mb-12`} style={{ transitionDelay: '100ms' }}>
              <p className="text-xs font-semibold text-[#8B7355] uppercase tracking-widest mb-3">What readers say</p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Loved by the <span className="gradient-text">community</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {TESTIMONIALS.map(({ quote, name, role, avatar }, i) => (
                <div
                  key={name}
                  className={`fade-up ${mounted ? 'in' : ''} testimonial-card bg-[#FAF6EE] border border-[#E8E0CE] rounded-2xl p-7 transition-all duration-300 flex flex-col gap-5`}
                  style={{ transitionDelay: `${200 + i * 100}ms` }}
                >
                  {/* Stars */}
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, s) => (
                      <svg key={s} className="w-4 h-4 text-[#C8A055]" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed flex-1">"{quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#8B7355] flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {avatar}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{name}</p>
                      <p className="text-xs text-[#A89070]">{role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── CTA BANNER ───────────────────────────────────────── */}
        <div className="relative overflow-hidden bg-gray-900 py-20 px-4 sm:px-6 lg:px-8">
          {/* Decorative blobs on dark bg */}
          <div className="pointer-events-none absolute -top-10 -right-10 w-64 h-64 bg-[#8B7355]/20 animate-blob rounded-full" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 w-56 h-56 bg-[#C8A055]/15 animate-blob rounded-full" style={{ animationDelay: '3s' }} />

          <div className="max-w-3xl mx-auto text-center relative">
            <p className="text-xs font-semibold text-[#C8B89A] uppercase tracking-widest mb-4">Join the community</p>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Start your literary<br />
              <span className="gradient-text">journey today</span>
            </h2>
            <p className="text-gray-400 text-lg mb-10 max-w-lg mx-auto">
              Create a free account and become part of LitLens — the literary social network built for readers.
            </p>
            {user ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center gap-2.5 bg-[#8B7355] text-white px-9 py-4 rounded-xl font-semibold shadow-lg hover:bg-[#7a6448] hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 text-lg"
              >
                Go to Dashboard
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            ) : (
              <Link
                to="/register"
                className="inline-flex items-center gap-2.5 bg-[#8B7355] text-white px-9 py-4 rounded-xl font-semibold shadow-lg hover:bg-[#7a6448] hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 text-lg"
              >
                Create Free Account
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            )}
          </div>
        </div>

      </div>
    </>
  );
}
