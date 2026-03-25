import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

export default function Leaderboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/leaderboard`)
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6EE] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-900 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  const { month, leaderboard = [] } = data || {};

  return (
    <div className="min-h-screen bg-[#FAF6EE]">
      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Top Reviewers</h1>
          <p className="text-gray-500">{month}</p>
        </div>

        {/* Leaderboard list */}
        {leaderboard.length === 0 ? (
          <div className="bg-white border border-[#E8E0CE] rounded-xl shadow-sm p-12 text-center">
            <div className="text-4xl mb-4">📚</div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">No reviews yet this month</h2>
            <p className="text-gray-500 text-sm">Be the first to write a review and claim the top spot!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((entry) => {
              const isTop3 = entry.rank <= 3;
              return (
                <div
                  key={entry.user._id}
                  className={`bg-white border rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow ${
                    isTop3 ? 'border-amber-300' : 'border-[#E8E0CE]'
                  }`}
                >
                  <div className="flex items-center gap-4 px-5 py-4">
                    {/* Rank */}
                    <div className="w-10 flex-shrink-0 text-center">
                      {entry.rank <= 3 ? (
                        <span className="text-2xl">{RANK_MEDALS[entry.rank - 1]}</span>
                      ) : (
                        <span className="text-base font-bold text-gray-400">#{entry.rank}</span>
                      )}
                    </div>

                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-[#F0EAD6] flex items-center justify-center flex-shrink-0">
                      <span className="text-gray-700 font-bold text-base">
                        {entry.user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* Name + badges */}
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/users/${entry.user._id}`}
                        className="font-semibold text-gray-900 hover:underline truncate block text-sm"
                      >
                        {entry.user.name}
                      </Link>
                      {entry.badges.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {entry.badges.map(b => (
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
                    </div>

                    {/* Review count */}
                    <div className="flex-shrink-0 text-right">
                      <div className="text-xl font-bold text-gray-900">{entry.reviewCount}</div>
                      <div className="text-xs text-gray-500">review{entry.reviewCount !== 1 ? 's' : ''}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer CTA */}
        <div className="mt-8 text-center">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm"
          >
            Browse Books &amp; Write Reviews
          </Link>
        </div>
      </div>
    </div>
  );
}
