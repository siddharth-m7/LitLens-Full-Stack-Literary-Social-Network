import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { fetchAdminUsers, banUser, promoteUser } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';

/* ── SVG Icons ─────────────────────────────────────────────────────────── */
const IconArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 5l-7 7 7 7" />
  </svg>
);
const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
  </svg>
);
const IconUsers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const IconShield = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const IconBan = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
  </svg>
);
const IconChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const IconUserCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><polyline points="17 11 19 13 23 9" />
  </svg>
);
const IconCalendar = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const IconMail = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
  </svg>
);

/* ── Avatar color hash ──────────────────────────────────────────────────── */
const AVATAR_PALETTES = [
  { bg: '#e0f2fe', color: '#0369a1' },
  { bg: '#fce7f3', color: '#be185d' },
  { bg: '#d1fae5', color: '#065f46' },
  { bg: '#fef3c7', color: '#92400e' },
  { bg: '#ede9fe', color: '#5b21b6' },
  { bg: '#fee2e2', color: '#991b1b' },
  { bg: '#ecfdf5', color: '#047857' },
  { bg: '#fff7ed', color: '#9a3412' },
];
function getAvatarPalette(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length];
}

/* ── Confirm Modal ──────────────────────────────────────────────────────── */
function ConfirmModal({ isOpen, title, message, confirmLabel, danger, onConfirm, onCancel }) {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }} onClick={onCancel} />
      <div style={{ position: 'relative', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', border: '1px solid #e5e5e5', padding: '28px', maxWidth: '400px', width: '100%' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0a0a0a', marginBottom: '8px' }}>{title}</h3>
        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '24px', lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{ padding: '9px 18px', border: '1px solid #e5e5e5', borderRadius: '8px', background: '#ffffff', color: '#374151', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{ padding: '9px 18px', border: 'none', borderRadius: '8px', background: danger ? '#dc2626' : '#0a0a0a', color: '#ffffff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────────────────── */
export default function UserManagement() {
  const [search, setSearch]     = useState('');
  const [roleFilter, setRoleFilter]   = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modal, setModal]       = useState(null);
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

  const handleConfirm = () => {
    if (!modal) return;
    if (modal.type === 'ban') banMutation.mutate(modal.user._id);
    if (modal.type === 'promote') promoteMutation.mutate(modal.user._id);
    setModal(null);
  };

  const filtered = useMemo(() => users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchStatus = statusFilter === 'all' || (statusFilter === 'banned' ? u.banned : !u.banned);
    return matchSearch && matchRole && matchStatus;
  }), [users, search, roleFilter, statusFilter]);

  const stats = useMemo(() => ({
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    banned: users.filter(u => u.banned).length,
    active: users.filter(u => !u.banned).length,
  }), [users]);

  /* styles */
  const S = {
    page: { minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: "'Inter', system-ui, sans-serif" },
    inner: { maxWidth: '1100px', margin: '0 auto', padding: '32px 20px' },
    backLink: { display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: '#6b7280', textDecoration: 'none', marginBottom: '24px', transition: 'color 0.15s' },
    heading: { fontSize: '24px', fontWeight: 900, color: '#0a0a0a', letterSpacing: '-0.02em' },
    subheading: { fontSize: '13px', color: '#9ca3af', marginTop: '4px', fontWeight: 500 },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', margin: '24px 0' },
    statCard: (accent) => ({
      backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '10px',
      padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }),
    statIcon: (bg) => ({
      width: '38px', height: '38px', borderRadius: '8px', backgroundColor: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }),
    statNum: { fontSize: '22px', fontWeight: 900, color: '#0a0a0a', lineHeight: 1 },
    statLabel: { fontSize: '11px', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '2px' },
    toolbar: { display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '16px' },
    searchWrap: { position: 'relative', flex: '1', minWidth: '200px', maxWidth: '340px' },
    searchIcon: { position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' },
    searchInput: { width: '100%', paddingLeft: '34px', paddingRight: '12px', paddingTop: '9px', paddingBottom: '9px', border: '1px solid #e5e5e5', borderRadius: '8px', fontSize: '13px', color: '#0a0a0a', background: '#ffffff', outline: 'none', boxSizing: 'border-box' },
    select: { padding: '9px 32px 9px 12px', border: '1px solid #e5e5e5', borderRadius: '8px', fontSize: '13px', color: '#374151', background: '#ffffff', outline: 'none', cursor: 'pointer', appearance: 'none', fontWeight: 600 },
    selectWrap: { position: 'relative', display: 'inline-flex', alignItems: 'center' },
    selectArrow: { position: 'absolute', right: '10px', pointerEvents: 'none', color: '#9ca3af' },
    tableWrap: { backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
    th: { padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e5e5' },
    td: { padding: '14px 20px', fontSize: '13px', color: '#374151', borderBottom: '1px solid #f3f4f6' },
  };

  return (
    <div style={S.page}>
      <div style={S.inner}>

        {/* Back */}
        <Link to="/dashboard" style={S.backLink}>
          <IconArrowLeft /> Back to Dashboard
        </Link>

        {/* Header */}
        <div>
          <h1 style={S.heading}>User Management</h1>
          <p style={S.subheading}>{isLoading ? 'Loading users…' : `${stats.total} registered users on the platform`}</p>
        </div>



        {/* Toolbar */}
        <div style={S.toolbar}>
          <div style={S.searchWrap}>
            <span style={S.searchIcon}><IconSearch /></span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name or email…"
              style={S.searchInput}
            />
          </div>

          <div style={S.selectWrap}>
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={S.select}>
              <option value="all">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <span style={S.selectArrow}><IconChevronDown /></span>
          </div>

          <div style={S.selectWrap}>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={S.select}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="banned">Banned</option>
            </select>
            <span style={S.selectArrow}><IconChevronDown /></span>
          </div>

          <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#9ca3af', fontWeight: 600 }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Table */}
        <div style={S.tableWrap}>
          {isLoading ? (
            <div>
              {[...Array(6)].map((_, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#f3f4f6', flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ height: '12px', background: '#f3f4f6', borderRadius: '4px', width: '140px' }} />
                    <div style={{ height: '11px', background: '#f9fafb', borderRadius: '4px', width: '200px' }} />
                  </div>
                  <div style={{ height: '24px', width: '56px', background: '#f3f4f6', borderRadius: '6px' }} />
                  <div style={{ height: '24px', width: '56px', background: '#f3f4f6', borderRadius: '6px' }} />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '64px 20px', textAlign: 'center' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: '#9ca3af' }}>
                <IconUsers />
              </div>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#6b7280' }}>No users found</p>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>Try adjusting your search or filters</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={S.th}>User</th>
                    <th style={S.th}>Email</th>
                    <th style={S.th}>Role</th>
                    <th style={S.th}>Status</th>
                    <th style={S.th}>Joined</th>
                    <th style={S.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user) => {
                    const pal = getAvatarPalette(user.name);
                    return (
                      <tr
                        key={user._id}
                        style={{ backgroundColor: user.banned ? '#fffbfb' : '#ffffff', transition: 'background-color 0.12s' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = user.banned ? '#fffbfb' : '#ffffff'}
                      >
                        {/* User */}
                        <td style={S.td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: pal.bg, color: pal.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px', flexShrink: 0, letterSpacing: '-0.02em' }}>
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <Link
                              to={`/users/${user._id}`}
                              style={{ fontWeight: 600, color: '#0a0a0a', textDecoration: 'none', fontSize: '13px' }}
                            >
                              {user.name}
                            </Link>
                          </div>
                        </td>

                        {/* Email */}
                        <td style={S.td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6b7280' }}>
                            <IconMail />
                            {user.email}
                          </div>
                        </td>

                        {/* Role */}
                        <td style={S.td}>
                          {user.role === 'admin' ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#fffbeb', color: '#92400e', fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', border: '1px solid #fde68a' }}>
                              <IconShield /> Admin
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#f3f4f6', color: '#374151', fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', border: '1px solid #e5e7eb' }}>
                              <IconUserCheck /> User
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td style={S.td}>
                          {user.banned ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', backgroundColor: '#fef2f2', color: '#dc2626', fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', border: '1px solid #fecaca' }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#dc2626', display: 'inline-block' }} />
                              Banned
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', backgroundColor: '#f0fdf4', color: '#16a34a', fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', border: '1px solid #bbf7d0' }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#16a34a', display: 'inline-block' }} />
                              Active
                            </span>
                          )}
                        </td>

                        {/* Joined */}
                        <td style={S.td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#9ca3af', fontSize: '12px' }}>
                            <IconCalendar />
                            {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        </td>

                        {/* Actions */}
                        <td style={S.td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              onClick={() => setModal({ type: 'ban', user })}
                              disabled={banMutation.isPending}
                              style={{
                                padding: '6px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                                border: user.banned ? '1px solid #fecaca' : '1px solid #e5e5e5',
                                backgroundColor: user.banned ? '#fef2f2' : '#ffffff',
                                color: user.banned ? '#dc2626' : '#374151',
                                transition: 'all 0.15s',
                              }}
                            >
                              {user.banned ? 'Unban' : 'Ban'}
                            </button>
                            {user.role !== 'admin' && (
                              <button
                                onClick={() => setModal({ type: 'promote', user })}
                                disabled={promoteMutation.isPending}
                                style={{ padding: '6px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', border: '1px solid #e5e5e5', backgroundColor: '#ffffff', color: '#374151', transition: 'all 0.15s' }}
                              >
                                Promote
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer count */}
        {!isLoading && filtered.length > 0 && (
          <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '12px', textAlign: 'right' }}>
            Showing {filtered.length} of {users.length} users
          </p>
        )}
      </div>

      <ConfirmModal
        isOpen={!!modal}
        danger={modal?.type === 'ban' && !modal?.user?.banned}
        title={modal?.type === 'ban'
          ? (modal.user?.banned ? `Unban ${modal.user?.name}?` : `Ban ${modal.user?.name}?`)
          : `Promote ${modal?.user?.name} to Admin?`}
        message={modal?.type === 'ban'
          ? (modal.user?.banned ? "This will restore the user's full platform access." : 'The user will immediately lose access to the platform.')
          : 'This will grant full admin privileges. This action cannot be undone.'}
        confirmLabel={modal?.type === 'ban' ? (modal.user?.banned ? 'Yes, Unban' : 'Yes, Ban') : 'Yes, Promote'}
        onConfirm={handleConfirm}
        onCancel={() => setModal(null)}
      />
    </div>
  );
}
