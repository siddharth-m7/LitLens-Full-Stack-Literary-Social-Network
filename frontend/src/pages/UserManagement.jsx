import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { fetchAdminUsers, banUser, promoteUser } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';

function ConfirmModal({ isOpen, title, message, confirmLabel, confirmClass, onConfirm, onCancel }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl border border-[#E8E0CE] p-6 max-w-sm w-full">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 text-sm mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="border-2 border-gray-900 text-gray-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-900 hover:text-white active:scale-[0.98] transition-all duration-150"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-sm font-medium active:scale-[0.98] transition-all duration-150 ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UserManagement() {
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // { type: 'ban'|'promote', user }
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: queryKeys.adminUsers(),
    queryFn: fetchAdminUsers,
  });

  const banMutation = useMutation({
    mutationFn: banUser,
    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.adminUsers() });
      const prev = queryClient.getQueryData(queryKeys.adminUsers());
      queryClient.setQueryData(queryKeys.adminUsers(), old =>
        old.map(u => u._id === userId ? { ...u, banned: !u.banned } : u)
      );
      return { prev };
    },
    onError: (_, __, ctx) => {
      queryClient.setQueryData(queryKeys.adminUsers(), ctx.prev);
      toast.error('Failed to update ban status');
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.adminUsers(), old =>
        old.map(u => u._id === data._id ? data : u)
      );
      toast.success(data.banned ? 'User banned' : 'User unbanned');
    },
  });

  const promoteMutation = useMutation({
    mutationFn: promoteUser,
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.adminUsers(), old =>
        old.map(u => u._id === data._id ? data : u)
      );
      toast.success(`${data.name} promoted to admin`);
    },
    onError: () => toast.error('Failed to promote user'),
  });

  const handleBan = (user) => setModal({ type: 'ban', user });
  const handlePromote = (user) => setModal({ type: 'promote', user });

  const handleConfirm = () => {
    if (!modal) return;
    if (modal.type === 'ban') banMutation.mutate(modal.user._id);
    if (modal.type === 'promote') promoteMutation.mutate(modal.user._id);
    setModal(null);
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
                {isLoading ? 'Loading...' : `${users.length} registered users`}
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
          {isLoading ? (
            <div className="divide-y divide-[#E8E0CE]">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="px-6 py-4 flex items-center gap-4 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-[#F0EAD6]" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-[#E8E0CE] rounded w-32" />
                    <div className="h-3 bg-[#E8E0CE] rounded w-48" />
                  </div>
                  <div className="h-6 bg-[#E8E0CE] rounded w-14" />
                  <div className="h-6 bg-[#E8E0CE] rounded w-14" />
                </div>
              ))}
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
                            disabled={banMutation.isPending}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 border ${
                              user.banned
                                ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                                : 'border-[#E8E0CE] bg-white text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                            }`}
                          >
                            {user.banned ? 'Unban' : 'Ban'}
                          </button>
                          {user.role !== 'admin' && (
                            <button
                              onClick={() => handlePromote(user)}
                              disabled={promoteMutation.isPending}
                              className="border border-[#E8E0CE] bg-white text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-[#F0EAD6] hover:border-[#D5CAAC] active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                            >
                              Promote
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

      <ConfirmModal
        isOpen={!!modal}
        title={modal?.type === 'ban'
          ? (modal.user?.banned ? `Unban ${modal.user?.name}?` : `Ban ${modal.user?.name}?`)
          : `Promote ${modal?.user?.name}?`}
        message={modal?.type === 'ban'
          ? (modal.user?.banned ? "This will restore the user's access." : 'This user will lose access to the platform.')
          : 'This will grant admin privileges. This cannot be undone.'}
        confirmLabel={modal?.type === 'ban' ? (modal.user?.banned ? 'Unban' : 'Ban') : 'Promote'}
        confirmClass={modal?.type === 'ban'
          ? 'bg-red-600 text-white hover:bg-red-700'
          : 'bg-gray-900 text-white hover:bg-gray-800'}
        onConfirm={handleConfirm}
        onCancel={() => setModal(null)}
      />
    </div>
  );
}
