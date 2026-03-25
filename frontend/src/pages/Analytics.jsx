import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

function KPICard({ label, value, icon }) {
  return (
    <div className="bg-white border border-[#E8E0CE] rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value ?? '—'}</p>
        </div>
        <div className="text-3xl opacity-70">{icon}</div>
      </div>
    </div>
  );
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/admin/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(res => setData(res.data))
      .catch(() => setError('Failed to load analytics. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF6EE]">
      <div className="container mx-auto px-4 py-8 max-w-6xl">

        {/* Header */}
        <div className="mb-8">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium mb-4 transition-colors text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-500 mt-1 text-sm">Platform statistics and insights</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-900 border-t-transparent mb-4"></div>
            <p className="text-gray-500 text-sm">Loading analytics...</p>
          </div>
        ) : error ? (
          <div className="bg-white border border-red-200 rounded-xl p-8 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <KPICard label="Total Books" value={data.totals.books} icon="📚" />
              <KPICard label="Total Reviews" value={data.totals.reviews} icon="⭐" />
              <KPICard label="Total Users" value={data.totals.users} icon="👥" />
              <KPICard
                label="Avg Rating"
                value={data.totals.avgRating != null ? data.totals.avgRating.toFixed(2) : null}
                icon="🏆"
              />
            </div>

            {/* Reviews over time */}
            <div className="bg-white border border-[#E8E0CE] rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Reviews — Last 30 Days</h2>
              {data.reviewsPerDay.every(d => d.count === 0) ? (
                <p className="text-center text-gray-400 py-8 text-sm">No reviews in the last 30 days</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={data.reviewsPerDay} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8E0CE" />
                    <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11 }} interval={4} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip labelFormatter={v => new Date(v).toLocaleDateString()} formatter={v => [v, 'Reviews']} />
                    <Line type="monotone" dataKey="count" stroke="#111111" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Top Books */}
              <div className="bg-white border border-[#E8E0CE] rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Top 5 Books by Reviews</h2>
                {data.topBooks.length === 0 ? (
                  <p className="text-center text-gray-400 py-8 text-sm">No data yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={data.topBooks} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8E0CE" />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                      <YAxis
                        type="category"
                        dataKey="title"
                        width={130}
                        tick={{ fontSize: 10 }}
                        tickFormatter={t => t.length > 18 ? t.slice(0, 17) + '…' : t}
                      />
                      <Tooltip formatter={v => [v, 'Reviews']} />
                      <Bar dataKey="count" fill="#111111" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* User signups */}
              <div className="bg-white border border-[#E8E0CE] rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">New Users — Last 30 Days</h2>
                {data.signupsPerDay.every(d => d.count === 0) ? (
                  <p className="text-center text-gray-400 py-8 text-sm">No signups in the last 30 days</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={data.signupsPerDay} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <defs>
                        <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#555555" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#555555" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8E0CE" />
                      <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11 }} interval={4} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip labelFormatter={v => new Date(v).toLocaleDateString()} formatter={v => [v, 'Signups']} />
                      <Area type="monotone" dataKey="count" stroke="#111111" strokeWidth={2} fill="url(#signupGrad)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
