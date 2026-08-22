import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import BookCard from '../components/BookCard';
import { fetchBooks, createBook, updateBook, deleteBook, uploadCoverFile, uploadCoverUrl } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';

const GENRES = ['Fiction', 'Non-Fiction', 'Mystery', 'Science Fiction', 'Fantasy', 'Romance', 'Thriller', 'Biography', 'Self-Help', 'Historical Fiction', 'Horror', 'Poetry', 'Other'];

export default function AdminDashboard() {
  const queryClient = useQueryClient();

  const [form, setForm] = useState({ title: '', author: '', description: '', genre: '', coverImage: '', isbn: '' });
  const [isbnLoading, setIsbnLoading] = useState(false);
  const [isbnError, setIsbnError] = useState('');
  const [coverUploading, setCoverUploading] = useState(false);
  const coverFileRef = useRef(null);

  // Edit book state
  const [editingBook, setEditingBook] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', author: '', description: '', genre: '', coverImage: '', isbn: '' });
  const [editIsbnLoading, setEditIsbnLoading] = useState(false);
  const [editIsbnError, setEditIsbnError] = useState('');
  const [editCoverUploading, setEditCoverUploading] = useState(false);
  const editCoverFileRef = useRef(null);

  const { data: booksData, isLoading } = useQuery({
    queryKey: queryKeys.books({ limit: 1000 }),
    queryFn: () => fetchBooks({ limit: 1000 }),
  });
  const books = booksData?.data ?? [];

  const addMutation = useMutation({
    mutationFn: createBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      setForm({ title: '', author: '', description: '', genre: '', coverImage: '', isbn: '' });
      setIsbnError('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBook,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['books'] }),
  });

  const updateMutation = useMutation({
    mutationFn: updateBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      closeEditModal();
    },
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleIsbnLookup = async () => {
    if (!form.isbn.trim()) return;
    setIsbnLoading(true);
    setIsbnError('');
    try {
      const res = await axios.get(
        `https://openlibrary.org/api/books?bibkeys=ISBN:${form.isbn.trim()}&format=json&jscmd=data`
      );
      const data = res.data[`ISBN:${form.isbn.trim()}`];
      if (!data) {
        setIsbnError('No book found for this ISBN. Try a different one.');
        return;
      }
      const rawCover = data.cover?.medium || '';
      setForm(prev => ({
        ...prev,
        title: data.title || prev.title,
        author: data.authors?.[0]?.name || prev.author,
        description: (typeof data.notes === 'string' ? data.notes : data.excerpts?.[0]?.text) || prev.description,
        coverImage: rawCover,
      }));
      // Auto-upload the cover to Cloudinary
      if (rawCover) {
        setCoverUploading(true);
        try {
          const { url } = await uploadCoverUrl(rawCover);
          setForm(prev => ({ ...prev, coverImage: url || prev.coverImage }));
        } catch {
          // keep the raw URL if Cloudinary upload fails
        } finally {
          setCoverUploading(false);
        }
      }
    } catch (err) {
      setIsbnError('Lookup failed. Please check your connection and try again.');
    } finally {
      setIsbnLoading(false);
    }
  };

  const handleCoverFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    try {
      const { url } = await uploadCoverFile(file);
      setForm(prev => ({ ...prev, coverImage: url || prev.coverImage }));
    } catch {
      setIsbnError('Cover upload failed. Please try again.');
    } finally {
      setCoverUploading(false);
      e.target.value = '';
    }
  };

  const handleAddBook = (e) => {
    e.preventDefault();
    addMutation.mutate(form);
  };

  const handleDelete = (id) => deleteMutation.mutate(id);

  const openEditModal = (book) => {
    setEditingBook(book);
    setEditForm({
      title: book.title || '',
      author: book.author || '',
      description: book.description || '',
      genre: book.genre || '',
      coverImage: book.coverImage || '',
      isbn: '',
    });
    setEditIsbnError('');
  };

  const closeEditModal = () => {
    setEditingBook(null);
    setEditIsbnError('');
  };

  const handleEditChange = (e) =>
    setEditForm({ ...editForm, [e.target.name]: e.target.value });

  const handleEditIsbnLookup = async () => {
    if (!editForm.isbn.trim()) return;
    setEditIsbnLoading(true);
    setEditIsbnError('');
    try {
      const res = await axios.get(
        `https://openlibrary.org/api/books?bibkeys=ISBN:${editForm.isbn.trim()}&format=json&jscmd=data`
      );
      const data = res.data[`ISBN:${editForm.isbn.trim()}`];
      if (!data) {
        setEditIsbnError('No book found for this ISBN.');
        return;
      }
      const rawCover = data.cover?.medium || '';
      setEditForm(prev => ({
        ...prev,
        title: data.title || prev.title,
        author: data.authors?.[0]?.name || prev.author,
        description: (typeof data.notes === 'string' ? data.notes : data.excerpts?.[0]?.text) || prev.description,
        coverImage: rawCover,
      }));
      if (rawCover) {
        setEditCoverUploading(true);
        try {
          const { url } = await uploadCoverUrl(rawCover);
          setEditForm(prev => ({ ...prev, coverImage: url || prev.coverImage }));
        } catch {
          // keep raw URL if upload fails
        } finally {
          setEditCoverUploading(false);
        }
      }
    } catch {
      setEditIsbnError('Lookup failed. Please check your connection.');
    } finally {
      setEditIsbnLoading(false);
    }
  };

  const handleEditCoverFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditCoverUploading(true);
    try {
      const { url } = await uploadCoverFile(file);
      setEditForm(prev => ({ ...prev, coverImage: url || prev.coverImage }));
    } catch {
      setEditIsbnError('Cover upload failed. Please try again.');
    } finally {
      setEditCoverUploading(false);
      e.target.value = '';
    }
  };

  const handleUpdateBook = (e) => {
    e.preventDefault();
    updateMutation.mutate({
      id: editingBook._id,
      title: editForm.title,
      author: editForm.author,
      description: editForm.description,
      genre: editForm.genre,
      coverImage: editForm.coverImage,
    });
  };

  const [activeTab, setActiveTab] = useState('books');

  const avgRating = (() => {
    const rated = books.filter(b => b.averageRating != null);
    return rated.length > 0
      ? (rated.reduce((acc, b) => acc + b.averageRating, 0) / rated.length).toFixed(1)
      : '—';
  })();

  const platformStats = [
    { label: 'Total Books', value: isLoading ? '—' : books.length, icon: '📚' },
    { label: 'Unique Authors', value: isLoading ? '—' : new Set(books.map(b => b.author)).size, icon: '✍️' },
    { label: 'Avg Rating', value: avgRating, icon: '⭐' },
    { label: 'Genres', value: isLoading ? '—' : new Set(books.filter(b => b.genre).map(b => b.genre)).size, icon: '🏷️' },
  ];

  const tabSt = (active) => ({
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    padding: '12px 4px',
    border: 'none',
    borderBottom: active ? '2px solid #0a0a0a' : '2px solid transparent',
    backgroundColor: 'transparent',
    color: active ? '#0a0a0a' : '#9ca3af',
    cursor: 'pointer',
    transition: 'all 0.15s',
    marginRight: '24px',
    fontFamily: "'Inter', sans-serif",
  });

  const inputSt = {
    width: '100%',
    padding: '9px 12px',
    border: '1px solid #e5e5e5',
    borderRadius: '4px',
    fontSize: '13px',
    color: '#0a0a0a',
    backgroundColor: '#ffffff',
    outline: 'none',
    fontFamily: "'Inter', sans-serif",
    boxSizing: 'border-box',
  };

  const inputCls = 'w-full px-3 py-2.5 border border-[#E8E0CE] rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors';

  return (
    <div style={{ backgroundColor: '#f8f8f8', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>

      {/* ── PLATFORM OPERATIONS HEADER ───────────────────────────── */}
      <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e5e5e5', padding: '32px 0 0' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem' }}>

          {/* Top row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', backgroundColor: '#fef2f2', color: '#ef4444', padding: '3px 10px', borderRadius: '3px', display: 'inline-block', marginBottom: '10px' }}>
                Admin Ops Center
              </span>
              <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 900, color: '#0a0a0a', letterSpacing: '-0.02em', lineHeight: 1.1, textTransform: 'uppercase' }}>
                Platform Operations
              </h1>
            </div>
            {/* Admin info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#0a0a0a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700 }}>A</div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#0a0a0a', lineHeight: 1.2 }}>Platform Admin</p>
                <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#ef4444' }}>Platform Manager</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderTop: '1px solid #e5e5e5' }}>
            <button style={tabSt(activeTab === 'books')} onClick={() => setActiveTab('books')}>
              📖 Book Management
            </button>
            <button style={tabSt(activeTab === 'analytics')} onClick={() => setActiveTab('analytics')}>
              📊 Analytics
            </button>
            <button style={tabSt(activeTab === 'links')} onClick={() => setActiveTab('links')}>
              🔗 Quick Links
            </button>
          </div>
        </div>
      </div>

      {/* ── BODY ─────────────────────────────────────────────────── */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 1.5rem' }}>

        {/* ── ANALYTICS TAB ──────────────────────────────────────── */}
        {activeTab === 'analytics' && (
          <div>
            {/* Platform Health header */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '6px', padding: '20px 24px', marginBottom: '20px' }}>
              <p style={{ fontSize: '15px', fontWeight: 700, color: '#0a0a0a', marginBottom: '4px' }}>Library Health</p>
              <p style={{ fontSize: '12px', color: '#9ca3af' }}>Real-time indicators of your book collection and platform activity.</p>
            </div>

            {/* Stats cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', backgroundColor: '#e5e5e5', border: '1px solid #e5e5e5', borderRadius: '6px', overflow: 'hidden', marginBottom: '20px' }} className="admin-stats-responsive">
              {platformStats.map(({ label, value, icon }) => (
                <div key={label} style={{ backgroundColor: '#ffffff', padding: '24px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: '12px' }}>{label}</p>
                    <p style={{ fontSize: '32px', fontWeight: 800, color: '#0a0a0a', letterSpacing: '-0.02em' }}>{value}</p>
                  </div>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#f3f3f3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>{icon}</div>
                </div>
              ))}
            </div>

            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '6px', padding: '32px', textAlign: 'center', color: '#9ca3af' }}>
              <p style={{ fontSize: '13px' }}>For detailed analytics, visit the dedicated Analytics page.</p>
              <Link to="/admin/analytics" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '12px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0a0a0a', textDecoration: 'none', borderBottom: '2px solid #0a0a0a', paddingBottom: '2px' }}>
                View Analytics →
              </Link>
            </div>
          </div>
        )}

        {/* ── QUICK LINKS TAB ──────────────────────────────────────── */}
        {activeTab === 'links' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }} className="admin-links-responsive">
            {[
              { to: '/admin/users', label: 'User Management', desc: 'Manage, ban, and promote platform users.', icon: '👥' },
              { to: '/admin/analytics', label: 'Analytics', desc: 'Deep-dive into platform metrics and trends.', icon: '📈' },
              { to: '/admin/bulk-import', label: 'Bulk Import', desc: 'Import hundreds of books via CSV or ISBN list.', icon: '📥' },
            ].map(({ to, label, desc, icon }) => (
              <Link key={to} to={to} style={{ textDecoration: 'none' }}>
                <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '6px', padding: '24px', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#0a0a0a'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e5e5'}>
                  <span style={{ fontSize: '24px', display: 'block', marginBottom: '12px' }}>{icon}</span>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#0a0a0a', marginBottom: '6px' }}>{label}</p>
                  <p style={{ fontSize: '12px', color: '#9ca3af', lineHeight: 1.5 }}>{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* ── BOOK MANAGEMENT TAB ────────────────────────────────── */}
        {activeTab === 'books' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }} className="admin-books-responsive">

            {/* Add Book Form */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e5e5' }}>
                <p style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0a0a0a', marginBottom: '2px' }}>Add New Book</p>
                <p style={{ fontSize: '12px', color: '#9ca3af' }}>Fill in the details or use ISBN lookup</p>
              </div>

              <form onSubmit={handleAddBook} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* ISBN Lookup */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280', marginBottom: '8px' }}>
                    ISBN Lookup <span style={{ color: '#9ca3af', textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>(auto-fill)</span>
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input name="isbn" value={form.isbn} onChange={handleChange} placeholder="e.g. 9780743273565" style={{ ...inputSt, flex: 1 }} />
                    <button type="button" onClick={handleIsbnLookup} disabled={isbnLoading || !form.isbn.trim()}
                      style={{ padding: '9px 14px', backgroundColor: '#0a0a0a', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', opacity: (isbnLoading || !form.isbn.trim()) ? 0.4 : 1, fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap' }}>
                      {isbnLoading ? '...' : 'Lookup'}
                    </button>
                  </div>
                  {isbnError && <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '6px' }}>{isbnError}</p>}
                </div>

                {[{ name: 'title', label: 'Book Title', placeholder: 'Enter the book title', req: true }, { name: 'author', label: 'Author', placeholder: "Author's name", req: true }].map(({ name, label, placeholder, req }) => (
                  <div key={name}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280', marginBottom: '8px' }}>{label}</label>
                    <input name={name} value={form[name]} onChange={handleChange} placeholder={placeholder} required={req} style={inputSt} />
                  </div>
                ))}

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280', marginBottom: '8px' }}>Description</label>
                  <textarea name="description" value={form.description} onChange={handleChange} placeholder="Write a brief description..." rows="3"
                    style={{ ...inputSt, resize: 'vertical', lineHeight: 1.6 }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280', marginBottom: '8px' }}>Genre</label>
                  <select name="genre" value={form.genre} onChange={handleChange} style={inputSt}>
                    <option value="">Select a genre...</option>
                    {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280', marginBottom: '8px' }}>
                    Cover Image
                    {form.coverImage?.includes('res.cloudinary.com') && <span style={{ marginLeft: '8px', fontSize: '10px', color: '#22c55e', fontWeight: 600, textTransform: 'none', letterSpacing: 0 }}>● Cloudinary</span>}
                  </label>
                  <input type="file" accept="image/*" ref={coverFileRef} onChange={handleCoverFileChange} className="hidden" />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input name="coverImage" value={form.coverImage} onChange={handleChange} placeholder="https://..." style={{ ...inputSt, flex: 1 }} />
                    <button type="button" onClick={() => coverFileRef.current?.click()} disabled={coverUploading}
                      style={{ padding: '9px 12px', border: '1px solid #e5e5e5', backgroundColor: '#f3f3f3', borderRadius: '4px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', opacity: coverUploading ? 0.4 : 1, fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap', color: '#374151' }}>
                      {coverUploading ? '...' : 'Upload'}
                    </button>
                  </div>
                  {coverUploading && <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '6px' }}>Uploading to Cloudinary…</p>}
                  {form.coverImage && !coverUploading && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                      <img src={form.coverImage} alt="Preview" style={{ width: '36px', height: '50px', objectFit: 'cover', borderRadius: '3px', border: '1px solid #e5e5e5' }} onError={e => e.target.style.display = 'none'} />
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>Cover preview</span>
                    </div>
                  )}
                </div>

                <button type="submit" disabled={addMutation.isPending}
                  style={{ padding: '11px 0', backgroundColor: '#0a0a0a', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', opacity: addMutation.isPending ? 0.5 : 1, fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {addMutation.isPending ? (
                    <><div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Adding...</>
                  ) : '+ Add Book to Library'}
                </button>
              </form>
            </div>

            {/* Book Collection */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e5e5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0a0a0a', marginBottom: '2px' }}>Book Collection</p>
                  <p style={{ fontSize: '12px', color: '#9ca3af' }}>{isLoading ? 'Loading...' : `${books.length} ${books.length === 1 ? 'book' : 'books'} in the library`}</p>
                </div>
                {!isLoading && (
                  <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', backgroundColor: '#f3f3f3', color: '#374151', padding: '4px 10px', borderRadius: '3px' }}>{books.length} Total</span>
                )}
              </div>

              <div style={{ padding: '24px' }}>
                {isLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
                    <div style={{ width: '28px', height: '28px', border: '2px solid #0a0a0a', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  </div>
                ) : books.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af' }}>
                    <p style={{ fontWeight: 600, color: '#0a0a0a', marginBottom: '8px' }}>Library is empty</p>
                    <p style={{ fontSize: '13px' }}>Add your first book using the form on the left.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }} className="book-cards-responsive">
                    {books.map(book => (
                      <BookCard key={book._id} book={book} onDelete={handleDelete} onEdit={openEditModal} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── EDIT BOOK MODAL ──────────────────────────────────────── */}
      {editingBook && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          onClick={closeEditModal}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-[#E8E0CE]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-[#E8E0CE] flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Edit Book</h2>
                <p className="text-sm text-gray-500 mt-0.5">Update the book details below</p>
              </div>
              <button
                onClick={closeEditModal}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 active:scale-[0.95] transition-all duration-150"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleUpdateBook} className="p-6 space-y-5">
              {/* ISBN Lookup */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  ISBN Lookup <span className="text-gray-400 font-normal">(auto-fill)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    name="isbn"
                    value={editForm.isbn}
                    onChange={handleEditChange}
                    placeholder="e.g. 9780743273565"
                    className="flex-1 px-3 py-2.5 border border-[#E8E0CE] rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleEditIsbnLookup}
                    disabled={editIsbnLoading || !editForm.isbn.trim()}
                    className="px-3 py-2.5 bg-gray-900 text-white rounded-lg font-medium shadow-sm hover:bg-gray-800 hover:shadow-md active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 disabled:shadow-none transition-all duration-150 text-sm whitespace-nowrap"
                  >
                    {editIsbnLoading ? '...' : 'Lookup'}
                  </button>
                </div>
                {editIsbnError && <p className="text-red-500 text-xs mt-1.5">{editIsbnError}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
                <input name="title" value={editForm.title} onChange={handleEditChange} required
                  className="w-full px-3 py-2.5 border border-[#E8E0CE] rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Author</label>
                <input name="author" value={editForm.author} onChange={handleEditChange} required
                  className="w-full px-3 py-2.5 border border-[#E8E0CE] rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea name="description" value={editForm.description} onChange={handleEditChange} rows="3"
                  className="w-full px-3 py-2.5 border border-[#E8E0CE] rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors resize-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Genre</label>
                <select name="genre" value={editForm.genre} onChange={handleEditChange}
                  className="w-full px-3 py-2.5 border border-[#E8E0CE] rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors">
                  <option value="">Select a genre...</option>
                  {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Cover Image
                  {editForm.coverImage?.includes('res.cloudinary.com') && (
                    <span className="ml-2 text-xs font-normal text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Cloudinary</span>
                  )}
                </label>
                <input type="file" accept="image/*" ref={editCoverFileRef} onChange={handleEditCoverFileChange} className="hidden" />
                <div className="flex gap-2">
                  <input name="coverImage" value={editForm.coverImage} onChange={handleEditChange}
                    placeholder="https://..."
                    className="flex-1 px-3 py-2.5 border border-[#E8E0CE] rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors text-sm" />
                  <button
                    type="button"
                    onClick={() => editCoverFileRef.current?.click()}
                    disabled={editCoverUploading}
                    className="px-3 py-2.5 border border-[#E8E0CE] bg-white text-gray-700 rounded-lg hover:bg-[#F0EAD6] disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm whitespace-nowrap"
                  >
                    {editCoverUploading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-transparent" />
                    ) : 'Upload'}
                  </button>
                </div>
                {editCoverUploading && <p className="text-xs text-gray-500 mt-1">Uploading to Cloudinary…</p>}
                {editForm.coverImage && !editCoverUploading && (
                  <div className="mt-2 flex items-center gap-3">
                    <img src={editForm.coverImage} alt="Preview"
                      className="w-10 h-14 object-cover rounded-lg border border-[#E8E0CE]"
                      onError={(e) => { e.target.style.display = 'none'; }} />
                    <span className="text-xs text-gray-500">Cover preview</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="flex-1 border-2 border-gray-900 text-gray-900 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-900 hover:text-white active:scale-[0.98] transition-all duration-150"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="flex-1 bg-gray-900 text-white px-4 py-2.5 rounded-lg font-medium shadow-sm hover:bg-gray-800 hover:shadow-md active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 disabled:shadow-none transition-all duration-150 flex items-center justify-center gap-2"
                >
                  {updateMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Saving...
                    </>
                  ) : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) {
          .admin-stats-responsive { grid-template-columns: repeat(2, 1fr) !important; }
          .admin-books-responsive { grid-template-columns: 1fr !important; }
          .admin-links-responsive { grid-template-columns: 1fr !important; }
          .book-cards-responsive { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
