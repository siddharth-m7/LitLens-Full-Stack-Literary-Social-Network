import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState({});

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/users`, { headers });
      setUsers(res.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const setLoading1 = (id, key, val) =>
    setActionLoading(prev => ({ ...prev, [`${id}_${key}`]: val }));

  const handleBan = async (user) => {
    const action = user.banned ? 'unban' : 'ban';
    if (!window.confirm(`Are you sure you want to ${action} ${user.name}?`)) return;
    setLoading1(user._id, 'ban', true);
    try {
      const res = await axios.patch(
        `${import.meta.env.VITE_API_URL}/admin/users/${user._id}/ban`,
        {},
        { headers }
      );
      setUsers(prev => prev.map(u => u._id === user._id ? res.data : u));
    } catch (err) {
      console.error('Error toggling ban:', err);
    } finally {
      setLoading1(user._id, 'ban', false);
    }
  };

  const handlePromote = async (user) => {
    if (!window.confirm(`Promote ${user.name} to admin? This cannot be undone.`)) return;
    setLoading1(user._id, 'promote', true);
    try {
      const res = await axios.patch(
        `${import.meta.env.VITE_API_URL}/admin/users/${user._id}/promote`,
        {},
        { headers }
      );
      setUsers(prev => prev.map(u => u._id === user._id ? res.data : u));
    } catch (err) {
      console.error('Error promoting user:', err);
    } finally {
      setLoading1(user._id, 'promote', false);
    }
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-500 mt-1 text-sm">
                {loading ? 'Loading...' : `${users.length} registered users`}
              </p>
            </div>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full px-3 py-2.5 border border-[#E8E0CE] rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors sm:w-72"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-[#E8E0CE] rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-900 border-t-transparent mb-4"></div>
              <p className="text-gray-500 text-sm">Loading users...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">👤</div>
              <p className="text-gray-500">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E8E0CE] bg-[#FAF6EE]">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Joined</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user) => (
                    <tr key={user._id} className={`border-b border-[#E8E0CE] hover:bg-[#FAF6EE] transition-colors ${user.banned ? 'bg-red-50/30' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#F0EAD6] flex items-center justify-center text-gray-700 font-bold text-sm flex-shrink-0">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <Link to={`/users/${user._id}`} className="font-medium text-gray-900 hover:underline text-sm">
                            {user.name}
                          </Link>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`bg-[#F0EAD6] text-gray-700 text-xs font-medium px-2.5 py-1 rounded-md ${
                          user.role === 'admin' ? 'bg-amber-100 text-amber-800' : ''
                        }`}>
                          {user.role === 'admin' ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {user.banned ? (
                          <span className="bg-red-100 text-red-700 text-xs font-medium px-2.5 py-1 rounded-md">
                            Banned
                          </span>
                        ) : (
                          <span className="bg-green-100 text-green-700 text-xs font-medium px-2.5 py-1 rounded-md">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleBan(user)}
                            disabled={!!actionLoading[`${user._id}_ban`]}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 border ${
                              user.banned
                                ? 'border-green-300 text-green-700 hover:bg-green-50'
                                : 'border-red-300 text-red-600 hover:bg-red-50'
                            }`}
                          >
                            {actionLoading[`${user._id}_ban`] ? '...' : user.banned ? 'Unban' : 'Ban'}
                          </button>
                          {user.role !== 'admin' && (
                            <button
                              onClick={() => handlePromote(user)}
                              disabled={!!actionLoading[`${user._id}_promote`]}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#F0EAD6] text-gray-700 hover:bg-amber-100 transition-colors disabled:opacity-50 border border-[#E8E0CE]"
                            >
                              {actionLoading[`${user._id}_promote`] ? '...' : 'Promote'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
