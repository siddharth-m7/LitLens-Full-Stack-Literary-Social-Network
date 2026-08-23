import { useState, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Avatar, { genConfig } from 'react-nice-avatar';
import { useAuth } from '../contexts/AuthContext';
import { fetchBooks, createBook, updateBook, deleteBook, uploadCoverFile, uploadCoverUrl, fetchAnalytics } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';

const GENRES = [
  'Fiction',
  'Non-Fiction',
  'Mystery',
  'Science Fiction',
  'Fantasy',
  'Romance',
  'Thriller',
  'Biography',
  'Self-Help',
  'Historical Fiction',
  'Horror',
  'Poetry',
  'Other',
];

const GENRE_COLORS = {
  Fiction: { bg: '#f3e8ff', color: '#6b21a8', border: '#e9d5ff' },
  'Non-Fiction': { bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd' },
  Mystery: { bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
  'Science Fiction': { bg: '#e0e7ff', color: '#3730a3', border: '#c7d2fe' },
  Fantasy: { bg: '#fae8ff', color: '#86198f', border: '#f5d0fe' },
  Romance: { bg: '#ffe4e6', color: '#9f1239', border: '#fecdd3' },
  Thriller: { bg: '#fee2e2', color: '#991b1b', border: '#fecaca' },
  Biography: { bg: '#f1f5f9', color: '#334155', border: '#e2e8f0' },
  'Self-Help': { bg: '#dcfce7', color: '#166534', border: '#bbf7d0' },
  'Historical Fiction': { bg: '#fef9c3', color: '#854d0e', border: '#fef08a' },
  Horror: { bg: '#f3f4f6', color: '#1f2937', border: '#e5e7eb' },
  Poetry: { bg: '#fdf2f8', color: '#9d174d', border: '#fce7f3' },
  Other: { bg: '#f3f4f6', color: '#4b5563', border: '#e5e7eb' },
};

const getBookCoverGradient = (title = '') => {
  const gradients = [
    'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    'linear-gradient(135deg, #312e81 0%, #1e1b4b 100%)',
    'linear-gradient(135deg, #134e4a 0%, #042f2e 100%)',
    'linear-gradient(135deg, #701a75 0%, #4a044e 100%)',
    'linear-gradient(135deg, #7c2d12 0%, #451a03 100%)',
    'linear-gradient(135deg, #1e3a8a 0%, #172554 100%)',
  ];
  const charCodeSum = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return gradients[charCodeSum % gradients.length];
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Active Tab
  const [activeTab, setActiveTab] = useState('books'); // 'books' | 'analytics' | 'tools'

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'title-asc' | 'title-desc' | 'rating-desc' | 'reviews-desc'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Create Book state
  const [form, setForm] = useState({
    title: '',
    author: '',
    description: '',
    genre: '',
    coverImage: '',
    isbn: '',
  });
  const [isbnLoading, setIsbnLoading] = useState(false);
  const [isbnError, setIsbnError] = useState('');
  const [coverUploading, setCoverUploading] = useState(false);
  const coverFileRef = useRef(null);

  // Edit Book state
  const [editingBook, setEditingBook] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    author: '',
    description: '',
    genre: '',
    coverImage: '',
    isbn: '',
  });
  const [editIsbnLoading, setEditIsbnLoading] = useState(false);
  const [editIsbnError, setEditIsbnError] = useState('');
  const [editCoverUploading, setEditCoverUploading] = useState(false);
  const editCoverFileRef = useRef(null);

  // Delete modal state
  const [deletingBook, setDeletingBook] = useState(null);

  // Fetch all books
  const { data: booksData, isLoading: booksLoading } = useQuery({
    queryKey: queryKeys.books({ limit: 1000 }),
    queryFn: () => fetchBooks({ limit: 1000 }),
  });
  const books = booksData?.data ?? [];

  // Fetch Analytics for quick stats
  const { data: analyticsData } = useQuery({
    queryKey: queryKeys.analytics(),
    queryFn: fetchAnalytics,
    staleTime: 1000 * 60 * 5,
  });

  // Mutations
  const addMutation = useMutation({
    mutationFn: createBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      setForm({ title: '', author: '', description: '', genre: '', coverImage: '', isbn: '' });
      setIsbnError('');
      toast.success('Book created and published to library!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create book');
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      closeEditModal();
      toast.success('Book details updated successfully!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update book');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      setDeletingBook(null);
      toast.success('Book removed from library');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete book');
    },
  });

  // Handlers for Add Form
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleIsbnLookup = async () => {
    const rawIsbn = form.isbn.trim().replace(/-/g, '');
    if (!rawIsbn) {
      setIsbnError('Please enter an ISBN number first.');
      return;
    }
    setIsbnLoading(true);
    setIsbnError('');
    try {
      const res = await axios.get(
        `https://openlibrary.org/api/books?bibkeys=ISBN:${rawIsbn}&format=json&jscmd=data`
      );
      const data = res.data[`ISBN:${rawIsbn}`];
      if (!data) {
        setIsbnError('No book found for this ISBN in Open Library.');
        return;
      }
      const rawCover = data.cover?.large || data.cover?.medium || '';
      const autoAuthor = data.authors?.[0]?.name || form.author;
      const autoTitle = data.title || form.title;
      const autoDesc = (typeof data.notes === 'string' ? data.notes : data.excerpts?.[0]?.text) || form.description;

      setForm((prev) => ({
        ...prev,
        title: autoTitle,
        author: autoAuthor,
        description: autoDesc,
        coverImage: rawCover || prev.coverImage,
      }));

      toast.success('Book details auto-filled from Open Library!');

      // Auto-upload cover to Cloudinary if available
      if (rawCover) {
        setCoverUploading(true);
        try {
          const { url } = await uploadCoverUrl(rawCover);
          if (url) {
            setForm((prev) => ({ ...prev, coverImage: url }));
          }
        } catch {
          // keep the raw URL
        } finally {
          setCoverUploading(false);
        }
      }
    } catch {
      setIsbnError('Lookup failed. Please check network and try again.');
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
      setForm((prev) => ({ ...prev, coverImage: url || prev.coverImage }));
      toast.success('Cover image uploaded!');
    } catch {
      setIsbnError('Cover upload failed. Please try again.');
      toast.error('Cover upload failed');
    } finally {
      setCoverUploading(false);
      e.target.value = '';
    }
  };

  const handleAddBook = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.author.trim()) {
      toast.error('Title and Author are required.');
      return;
    }
    addMutation.mutate(form);
  };

  // Handlers for Edit Modal
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
    const rawIsbn = editForm.isbn.trim().replace(/-/g, '');
    if (!rawIsbn) return;
    setEditIsbnLoading(true);
    setEditIsbnError('');
    try {
      const res = await axios.get(
        `https://openlibrary.org/api/books?bibkeys=ISBN:${rawIsbn}&format=json&jscmd=data`
      );
      const data = res.data[`ISBN:${rawIsbn}`];
      if (!data) {
        setEditIsbnError('No book found for this ISBN.');
        return;
      }
      const rawCover = data.cover?.large || data.cover?.medium || '';
      setEditForm((prev) => ({
        ...prev,
        title: data.title || prev.title,
        author: data.authors?.[0]?.name || prev.author,
        description: (typeof data.notes === 'string' ? data.notes : data.excerpts?.[0]?.text) || prev.description,
        coverImage: rawCover || prev.coverImage,
      }));
      toast.success('Fields auto-filled from Open Library!');
      if (rawCover) {
        setEditCoverUploading(true);
        try {
          const { url } = await uploadCoverUrl(rawCover);
          if (url) setEditForm((prev) => ({ ...prev, coverImage: url }));
        } catch {
          // fallback to raw cover
        } finally {
          setEditCoverUploading(false);
        }
      }
    } catch {
      setEditIsbnError('Lookup failed. Check connection.');
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
      setEditForm((prev) => ({ ...prev, coverImage: url || prev.coverImage }));
      toast.success('Cover image uploaded!');
    } catch {
      setEditIsbnError('Cover upload failed.');
      toast.error('Cover upload failed');
    } finally {
      setEditCoverUploading(false);
      e.target.value = '';
    }
  };

  const handleUpdateBook = (e) => {
    e.preventDefault();
    if (!editForm.title.trim() || !editForm.author.trim()) {
      toast.error('Title and Author are required');
      return;
    }
    updateMutation.mutate({
      id: editingBook._id,
      title: editForm.title,
      author: editForm.author,
      description: editForm.description,
      genre: editForm.genre,
      coverImage: editForm.coverImage,
    });
  };

  // Filtered and Sorted Books list
  const filteredBooks = useMemo(() => {
    let list = [...books];

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      list = list.filter(
        (b) =>
          b.title?.toLowerCase().includes(query) ||
          b.author?.toLowerCase().includes(query) ||
          b.genre?.toLowerCase().includes(query)
      );
    }

    if (selectedGenre !== 'All') {
      list = list.filter((b) => b.genre === selectedGenre);
    }

    if (sortBy === 'newest') {
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (sortBy === 'title-asc') {
      list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (sortBy === 'title-desc') {
      list.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
    } else if (sortBy === 'rating-desc') {
      list.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    } else if (sortBy === 'reviews-desc') {
      list.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
    }

    return list;
  }, [books, searchTerm, selectedGenre, sortBy]);

  // Derived Stats
  const avgRating = useMemo(() => {
    const rated = books.filter((b) => b.averageRating != null && b.averageRating > 0);
    return rated.length > 0
      ? (rated.reduce((acc, b) => acc + b.averageRating, 0) / rated.length).toFixed(1)
      : '—';
  }, [books]);

  const uniqueAuthorsCount = useMemo(() => {
    return new Set(books.map((b) => b.author?.trim()).filter(Boolean)).size;
  }, [books]);

  const uniqueGenresCount = useMemo(() => {
    return new Set(books.map((b) => b.genre?.trim()).filter(Boolean)).size;
  }, [books]);

  const totalReviewsCount = useMemo(() => {
    return books.reduce((acc, b) => acc + (b.reviewCount || 0), 0);
  }, [books]);

  const platformStats = [
    {
      label: 'Cataloged Books',
      value: booksLoading ? '—' : books.length,
      sub: `${filteredBooks.length} currently listed`,
      icon: '📚',
      highlight: '#0a0a0a',
    },
    {
      label: 'Active Authors',
      value: booksLoading ? '—' : uniqueAuthorsCount,
      sub: 'Across all genres',
      icon: '✍️',
      highlight: '#2563eb',
    },
    {
      label: 'Platform Rating',
      value: avgRating,
      sub: `${totalReviewsCount} reader reviews`,
      icon: '⭐',
      highlight: '#d97706',
    },
    {
      label: 'Covered Genres',
      value: booksLoading ? '—' : `${uniqueGenresCount} / ${GENRES.length}`,
      sub: 'Diverse categories',
      icon: '🏷️',
      highlight: '#7c3aed',
    },
  ];

  return (
    <div className="admin-dashboard-container" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', fontFamily: "'Inter', sans-serif", color: '#0a0a0a' }}>
      
      {/* ── TOP HERO / ADMIN BAR ─────────────────────────────────────── */}
      <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e5e5e5' }}>
        <div style={{ maxWidth: '1360px', margin: '0 auto', padding: '28px 1.5rem 0' }}>
          
          {/* Header Top Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '24px' }}>
            <div>
              <h1 style={{ fontSize: 'clamp(1.3rem, 2.5vw, 1.8rem)', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.2, color: '#0a0a0a' }}>
                Admin Dashboard
              </h1>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '3px', fontWeight: 500 }}>
                Welcome back, {user?.name || 'Administrator'}
              </p>
            </div>

            {/* Admin Profile & Quick Navigation Shortcuts */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', padding: '6px 14px', borderRadius: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', border: '1.5px solid #0a0a0a' }}>
                  <Avatar style={{ width: '100%', height: '100%' }} {...genConfig(user?.name || user?.email || 'admin')} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ fontSize: '12px', fontWeight: 800, color: '#0a0a0a', lineHeight: 1.1 }}>{user?.name || 'Administrator'}</p>
                  <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#dc2626', lineHeight: 1.2 }}>Platform Superuser</p>
                </div>
              </div>

              {/* Quick Action Pills */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <Link
                  to="/admin/bulk-import"
                  style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#0a0a0a', textDecoration: 'none', backgroundColor: '#ffffff', border: '1px solid #d1d5db', padding: '6px 12px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0a0a0a'; e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.backgroundColor = '#ffffff'; }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  Bulk Import
                </Link>
                <Link
                  to="/admin/users"
                  style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#0a0a0a', textDecoration: 'none', backgroundColor: '#ffffff', border: '1px solid #d1d5db', padding: '6px 12px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0a0a0a'; e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.backgroundColor = '#ffffff'; }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  Manage Users
                </Link>
                <Link
                  to="/admin/analytics"
                  style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#0a0a0a', textDecoration: 'none', backgroundColor: '#ffffff', border: '1px solid #d1d5db', padding: '6px 12px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0a0a0a'; e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.backgroundColor = '#ffffff'; }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                  Analytics
                </Link>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: '28px', borderTop: '1px solid #e5e5e5', overflowX: 'auto' }}>
            {[
              { id: 'books', label: 'Books', badge: books.length },
              { id: 'analytics', label: 'Metrics', badge: null },
              { id: 'tools', label: 'Operations', badge: null },
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '14px 4px',
                    fontSize: '12px',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: active ? '#0a0a0a' : '#6b7280',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderBottom: active ? '2.5px solid #0a0a0a' : '2.5px solid transparent',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.15s',
                    whiteSpace: 'nowrap',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {tab.label}
                  {tab.badge !== null && (
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        backgroundColor: active ? '#0a0a0a' : '#e5e7eb',
                        color: active ? '#ffffff' : '#4b5563',
                        padding: '1px 7px',
                        borderRadius: '10px',
                      }}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

        </div>
      </div>

      {/* ── MAIN CONTENT TABS ────────────────────────────────────────── */}
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 1.5rem 64px' }}>

        {/* ── TAB 1: CATALOG & BOOK MANAGEMENT ──────────────────────── */}
        {activeTab === 'books' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(360px, 420px) 1fr', gap: '32px', alignItems: 'start' }} className="admin-books-layout">
            
            {/* LEFT COLUMN: ADD NEW BOOK CARD */}
            <div>
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e5e5',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  position: 'sticky',
                  top: '76px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                }}
              >
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e5e5', backgroundColor: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#0a0a0a' }}>
                      Add New Book
                    </h2>
                    <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                      Auto-fill via ISBN or enter manual catalog data
                    </p>
                  </div>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </div>
                </div>

                <form onSubmit={handleAddBook} style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* ISBN Autofill Helper Box */}
                  <div style={{ backgroundColor: '#f9fafb', border: '1px dashed #d1d5db', borderRadius: '6px', padding: '12px' }}>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4b5563', marginBottom: '6px' }}>
                      ⚡ Fast ISBN Auto-Fill (Open Library)
                    </label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input
                        name="isbn"
                        value={form.isbn}
                        onChange={handleChange}
                        placeholder="e.g. 9780743273565"
                        style={{
                          flex: 1,
                          padding: '8px 10px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '12px',
                          color: '#0a0a0a',
                          backgroundColor: '#ffffff',
                          outline: 'none',
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleIsbnLookup}
                        disabled={isbnLoading || !form.isbn.trim()}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#0a0a0a',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: (isbnLoading || !form.isbn.trim()) ? 'not-allowed' : 'pointer',
                          opacity: (isbnLoading || !form.isbn.trim()) ? 0.5 : 1,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {isbnLoading ? 'Looking...' : 'Fetch'}
                      </button>
                    </div>
                    {isbnError && (
                      <p style={{ fontSize: '11px', color: '#dc2626', marginTop: '6px' }}>{isbnError}</p>
                    )}
                  </div>

                  {/* Title & Author */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#374151', marginBottom: '6px' }}>
                      Book Title <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      placeholder="e.g. The Great Gatsby"
                      required
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        border: '1px solid #e5e5e5',
                        borderRadius: '4px',
                        fontSize: '13px',
                        color: '#0a0a0a',
                        backgroundColor: '#ffffff',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#374151', marginBottom: '6px' }}>
                      Author <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      name="author"
                      value={form.author}
                      onChange={handleChange}
                      placeholder="e.g. F. Scott Fitzgerald"
                      required
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        border: '1px solid #e5e5e5',
                        borderRadius: '4px',
                        fontSize: '13px',
                        color: '#0a0a0a',
                        backgroundColor: '#ffffff',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {/* Genre */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#374151', marginBottom: '6px' }}>
                      Genre Classification
                    </label>
                    <select
                      name="genre"
                      value={form.genre}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        border: '1px solid #e5e5e5',
                        borderRadius: '4px',
                        fontSize: '13px',
                        color: '#0a0a0a',
                        backgroundColor: '#ffffff',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    >
                      <option value="">Select a genre...</option>
                      {GENRES.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Description */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#374151', marginBottom: '6px' }}>
                      Synopsis / Description
                    </label>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      placeholder="A short overview of the book's narrative or core ideas..."
                      rows="3"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        border: '1px solid #e5e5e5',
                        borderRadius: '4px',
                        fontSize: '13px',
                        color: '#0a0a0a',
                        backgroundColor: '#ffffff',
                        outline: 'none',
                        boxSizing: 'border-box',
                        resize: 'vertical',
                        lineHeight: 1.5,
                      }}
                    />
                  </div>

                  {/* Cover Image + Upload */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#374151' }}>
                        Cover Artwork
                      </label>
                      {form.coverImage && (
                        <button
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, coverImage: '' }))}
                          style={{ fontSize: '10px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <input
                      type="file"
                      accept="image/*"
                      ref={coverFileRef}
                      onChange={handleCoverFileChange}
                      style={{ display: 'none' }}
                    />

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input
                        name="coverImage"
                        value={form.coverImage}
                        onChange={handleChange}
                        placeholder="https://... image URL"
                        style={{
                          flex: 1,
                          padding: '9px 12px',
                          border: '1px solid #e5e5e5',
                          borderRadius: '4px',
                          fontSize: '12px',
                          color: '#0a0a0a',
                          backgroundColor: '#ffffff',
                          outline: 'none',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => coverFileRef.current?.click()}
                        disabled={coverUploading}
                        style={{
                          padding: '9px 12px',
                          border: '1px solid #d1d5db',
                          backgroundColor: '#f3f4f6',
                          color: '#374151',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: coverUploading ? 'not-allowed' : 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {coverUploading ? 'Uploading...' : '📁 Upload'}
                      </button>
                    </div>

                    {form.coverImage && (
                      <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f9fafb', padding: '8px', borderRadius: '4px', border: '1px solid #e5e5e5' }}>
                        <img
                          src={form.coverImage}
                          alt="Cover Preview"
                          style={{ width: '38px', height: '54px', objectFit: 'cover', borderRadius: '3px', border: '1px solid #e5e5e5' }}
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                        <div style={{ overflow: 'hidden' }}>
                          <p style={{ fontSize: '11px', fontWeight: 700, color: '#0a0a0a' }}>Cover Preview</p>
                          <p style={{ fontSize: '10px', color: '#6b7280', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                            {form.coverImage}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={addMutation.isPending}
                    style={{
                      marginTop: '8px',
                      padding: '12px 0',
                      backgroundColor: '#0a0a0a',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 800,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      cursor: addMutation.isPending ? 'not-allowed' : 'pointer',
                      opacity: addMutation.isPending ? 0.6 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }}
                  >
                    {addMutation.isPending ? (
                      <>
                        <div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                        Saving Book...
                      </>
                    ) : (
                      '+ Publish Book to Catalog'
                    )}
                  </button>

                </form>
              </div>
            </div>

            {/* RIGHT COLUMN: BOOK CATALOG BROWSER */}
            <div>
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e5e5',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                }}
              >
                {/* Catalog Header & Filters Toolbar */}
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e5e5' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                    <div>
                      <h2 style={{ fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#0a0a0a' }}>
                        Library Inventory &amp; Catalog
                      </h2>
                      <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                        {booksLoading
                          ? 'Loading library...'
                          : `Showing ${filteredBooks.length} of ${books.length} total titles`}
                      </p>
                    </div>

                    {/* View Switcher & Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ display: 'flex', border: '1px solid #d1d5db', borderRadius: '4px', overflow: 'hidden' }}>
                        <button
                          type="button"
                          onClick={() => setViewMode('grid')}
                          style={{
                            padding: '6px 10px',
                            fontSize: '11px',
                            fontWeight: 700,
                            border: 'none',
                            backgroundColor: viewMode === 'grid' ? '#0a0a0a' : '#ffffff',
                            color: viewMode === 'grid' ? '#ffffff' : '#6b7280',
                            cursor: 'pointer',
                          }}
                          title="Grid View"
                        >
                          Grid
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewMode('table')}
                          style={{
                            padding: '6px 10px',
                            fontSize: '11px',
                            fontWeight: 700,
                            border: 'none',
                            backgroundColor: viewMode === 'table' ? '#0a0a0a' : '#ffffff',
                            color: viewMode === 'table' ? '#ffffff' : '#6b7280',
                            cursor: 'pointer',
                          }}
                          title="Table List View"
                        >
                          Table
                        </button>
                      </div>

                      <Link
                        to="/admin/bulk-import"
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          color: '#0a0a0a',
                          textDecoration: 'none',
                          backgroundColor: '#f3f4f6',
                          padding: '7px 12px',
                          borderRadius: '4px',
                          border: '1px solid #e5e7eb',
                        }}
                      >
                        + Bulk Import
                      </Link>
                    </div>
                  </div>

                  {/* Filter & Search Bar */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '10px' }} className="catalog-toolbar-grid">
                    {/* Search Input */}
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search books by title, author, or keywords..."
                        style={{
                          width: '100%',
                          padding: '9px 12px 9px 34px',
                          border: '1px solid #e5e5e5',
                          borderRadius: '4px',
                          fontSize: '12px',
                          color: '#0a0a0a',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                      <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '14px' }}>
                        🔍
                      </span>
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Genre Filter */}
                    <select
                      value={selectedGenre}
                      onChange={(e) => setSelectedGenre(e.target.value)}
                      style={{
                        padding: '9px 12px',
                        border: '1px solid #e5e5e5',
                        borderRadius: '4px',
                        fontSize: '12px',
                        color: '#0a0a0a',
                        backgroundColor: '#ffffff',
                        outline: 'none',
                        minWidth: '130px',
                      }}
                    >
                      <option value="All">All Genres</option>
                      {GENRES.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>

                    {/* Sort Selector */}
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      style={{
                        padding: '9px 12px',
                        border: '1px solid #e5e5e5',
                        borderRadius: '4px',
                        fontSize: '12px',
                        color: '#0a0a0a',
                        backgroundColor: '#ffffff',
                        outline: 'none',
                        minWidth: '140px',
                      }}
                    >
                      <option value="newest">Sort: Newest Added</option>
                      <option value="title-asc">Title: A to Z</option>
                      <option value="title-desc">Title: Z to A</option>
                      <option value="rating-desc">Highest Rated</option>
                      <option value="reviews-desc">Most Reviews</option>
                    </select>
                  </div>
                </div>

                {/* Catalog Body (Grid or Table) */}
                <div style={{ padding: '24px' }}>
                  {booksLoading ? (
                    <div style={{ padding: '60px 0', textAlign: 'center' }}>
                      <div style={{ width: '32px', height: '32px', border: '2.5px solid #0a0a0a', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 14px' }} />
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280' }}>Loading book inventory...</p>
                    </div>
                  ) : filteredBooks.length === 0 ? (
                    <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                      <div style={{ fontSize: '36px', marginBottom: '12px' }}>📚</div>
                      <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0a0a0a', marginBottom: '4px' }}>
                        No books match your criteria
                      </h3>
                      <p style={{ fontSize: '13px', color: '#6b7280', maxWidth: '360px', margin: '0 auto 16px' }}>
                        Try adjusting your search terms or genre filter to locate titles.
                      </p>
                      {(searchTerm || selectedGenre !== 'All') && (
                        <button
                          onClick={() => { setSearchTerm(''); setSelectedGenre('All'); }}
                          style={{ padding: '8px 16px', backgroundColor: '#0a0a0a', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  ) : viewMode === 'grid' ? (
                    /* ── GRID VIEW ── */
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                      {filteredBooks.map((book) => {
                        const genreStyle = GENRE_COLORS[book.genre] || { bg: '#f3f4f6', color: '#4b5563', border: '#e5e7eb' };
                        return (
                          <div
                            key={book._id}
                            style={{
                              backgroundColor: '#ffffff',
                              border: '1px solid #e5e5e5',
                              borderRadius: '8px',
                              padding: '16px',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                              transition: 'border-color 0.15s, transform 0.15s',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0a0a0a'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e5e5'; }}
                          >
                            <div>
                              {/* Top row: Cover thumbnail + Title / Author */}
                              <div style={{ display: 'flex', gap: '14px', marginBottom: '12px' }}>
                                <div style={{ width: '56px', height: '80px', flexShrink: 0, borderRadius: '4px', overflow: 'hidden', border: '1px solid #e5e5e5', backgroundColor: '#f3f4f6' }}>
                                  {book.coverImage ? (
                                    <img
                                      src={book.coverImage}
                                      alt={book.title}
                                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                      onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
                                    />
                                  ) : null}
                                  <div
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      background: getBookCoverGradient(book.title),
                                      display: book.coverImage ? 'none' : 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      color: '#ffffff',
                                      fontSize: '11px',
                                      fontWeight: 800,
                                      padding: '4px',
                                      textAlign: 'center',
                                    }}
                                  >
                                    {book.title.slice(0, 2).toUpperCase()}
                                  </div>
                                </div>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <Link
                                    to={`/books/${book._id}`}
                                    style={{
                                      fontSize: '14px',
                                      fontWeight: 800,
                                      color: '#0a0a0a',
                                      textDecoration: 'none',
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical',
                                      overflow: 'hidden',
                                      lineHeight: 1.3,
                                      marginBottom: '4px',
                                    }}
                                  >
                                    {book.title}
                                  </Link>
                                  <p style={{ fontSize: '12px', color: '#6b7280', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', marginBottom: '6px' }}>
                                    {book.author}
                                  </p>
                                  {book.genre && (
                                    <span
                                      style={{
                                        fontSize: '10px',
                                        fontWeight: 700,
                                        letterSpacing: '0.04em',
                                        backgroundColor: genreStyle.bg,
                                        color: genreStyle.color,
                                        border: `1px solid ${genreStyle.border}`,
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        display: 'inline-block',
                                      }}
                                    >
                                      {book.genre}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Description Snippet */}
                              {book.description && (
                                <p
                                  style={{
                                    fontSize: '12px',
                                    color: '#6b7280',
                                    lineHeight: 1.45,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    marginBottom: '14px',
                                  }}
                                >
                                  {book.description}
                                </p>
                              )}
                            </div>

                            {/* Card Footer: Rating & Action Buttons */}
                            <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ color: '#f59e0b', fontSize: '13px' }}>★</span>
                                <span style={{ fontSize: '12px', fontWeight: 800, color: '#0a0a0a' }}>
                                  {book.averageRating ? book.averageRating.toFixed(1) : '—'}
                                </span>
                                <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                                  ({book.reviewCount || 0})
                                </span>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Link
                                  to={`/books/${book._id}`}
                                  style={{
                                    padding: '5px 8px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    color: '#4b5563',
                                    textDecoration: 'none',
                                    backgroundColor: '#f3f4f6',
                                    borderRadius: '4px',
                                  }}
                                  title="View Public Page"
                                >
                                  View
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => openEditModal(book)}
                                  style={{
                                    padding: '5px 10px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    color: '#0a0a0a',
                                    backgroundColor: '#ffffff',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                  }}
                                  title="Edit Book Details"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingBook(book)}
                                  style={{
                                    padding: '5px 8px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    color: '#dc2626',
                                    backgroundColor: '#fee2e2',
                                    border: '1px solid #fecaca',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                  }}
                                  title="Delete Book"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* ── TABLE VIEW ── */
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid #e5e5e5', backgroundColor: '#fafafa' }}>
                            <th style={{ padding: '12px 14px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6b7280' }}>Book</th>
                            <th style={{ padding: '12px 14px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6b7280' }}>Genre</th>
                            <th style={{ padding: '12px 14px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6b7280' }}>Rating</th>
                            <th style={{ padding: '12px 14px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6b7280' }}>Reviews</th>
                            <th style={{ padding: '12px 14px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6b7280', textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredBooks.map((book) => {
                            const genreStyle = GENRE_COLORS[book.genre] || { bg: '#f3f4f6', color: '#4b5563', border: '#e5e7eb' };
                            return (
                              <tr key={book._id} style={{ borderBottom: '1px solid #f3f4f6', transition: 'background-color 0.15s' }}>
                                <td style={{ padding: '12px 14px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '32px', height: '46px', flexShrink: 0, borderRadius: '3px', overflow: 'hidden', border: '1px solid #e5e5e5', backgroundColor: '#f3f4f6' }}>
                                      {book.coverImage ? (
                                        <img src={book.coverImage} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                      ) : null}
                                    </div>
                                    <div>
                                      <Link to={`/books/${book._id}`} style={{ fontWeight: 800, color: '#0a0a0a', textDecoration: 'none', fontSize: '13px', display: 'block' }}>
                                        {book.title}
                                      </Link>
                                      <span style={{ fontSize: '12px', color: '#6b7280' }}>{book.author}</span>
                                    </div>
                                  </div>
                                </td>
                                <td style={{ padding: '12px 14px' }}>
                                  {book.genre ? (
                                    <span style={{ fontSize: '10px', fontWeight: 700, backgroundColor: genreStyle.bg, color: genreStyle.color, border: `1px solid ${genreStyle.border}`, padding: '2px 8px', borderRadius: '4px' }}>
                                      {book.genre}
                                    </span>
                                  ) : '—'}
                                </td>
                                <td style={{ padding: '12px 14px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ color: '#f59e0b', fontSize: '12px' }}>★</span>
                                    <span style={{ fontWeight: 700, color: '#0a0a0a' }}>{book.averageRating ? book.averageRating.toFixed(1) : '—'}</span>
                                  </div>
                                </td>
                                <td style={{ padding: '12px 14px', color: '#6b7280' }}>
                                  {book.reviewCount || 0} reviews
                                </td>
                                <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                                  <div style={{ display: 'inline-flex', gap: '6px' }}>
                                    <button
                                      type="button"
                                      onClick={() => openEditModal(book)}
                                      style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 700, backgroundColor: '#ffffff', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeletingBook(book)}
                                      style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 700, backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                      Delete
                                    </button>
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

              </div>
            </div>

          </div>
        )}

        {/* ── TAB 2: ANALYTICS OVERVIEW TAB ─────────────────────────── */}
        {activeTab === 'analytics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Header Banner */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0a0a0a' }}>Platform Metrics</h2>
                <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>Live snapshot of users, reviews, and catalog health.</p>
              </div>
              <Link
                to="/admin/analytics"
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#0a0a0a',
                  color: '#ffffff',
                  textDecoration: 'none',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                Deep Analytics
              </Link>
            </div>

            {/* Quick Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '20px 24px' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: '6px' }}>Registered Users</p>
                <h3 style={{ fontSize: '30px', fontWeight: 900, color: '#0a0a0a' }}>
                  {analyticsData?.totalUsers ?? '—'}
                </h3>
              </div>

              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '20px 24px' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: '6px' }}>Total Reviews</p>
                <h3 style={{ fontSize: '30px', fontWeight: 900, color: '#0a0a0a' }}>
                  {analyticsData?.totalReviews ?? totalReviewsCount}
                </h3>
              </div>

              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '20px 24px' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: '6px' }}>Catalog Size</p>
                <h3 style={{ fontSize: '30px', fontWeight: 900, color: '#0a0a0a' }}>
                  {books.length} Books
                </h3>
              </div>
            </div>

            {/* Genre Distribution Summary Card */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '24px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0a0a0a', marginBottom: '16px' }}>
                Genre Distribution In Library
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                {GENRES.map((g) => {
                  const count = books.filter((b) => b.genre === g).length;
                  const percent = books.length > 0 ? ((count / books.length) * 100).toFixed(0) : 0;
                  const col = GENRE_COLORS[g] || { bg: '#f3f4f6', color: '#374151', border: '#e5e7eb' };
                  return (
                    <div
                      key={g}
                      style={{
                        border: '1px solid #e5e5e5',
                        borderRadius: '6px',
                        padding: '12px 14px',
                        backgroundColor: '#fafafa',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: col.color }}>{g}</span>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#0a0a0a' }}>{count}</span>
                      </div>
                      <div style={{ height: '4px', width: '100%', backgroundColor: '#e5e7eb', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${percent}%`, backgroundColor: col.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* ── TAB 3: TOOLS & QUICK OPERATIONS HUB ───────────────────── */}
        {activeTab === 'tools' && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', color: '#0a0a0a' }}>
                Administrative Operations &amp; Modules
              </h2>
              <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                Specialized tools for administrative governance, member moderation, and batch data processing.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              
              {/* Tool 1: User Management */}
              <Link to="/admin/users" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e5e5',
                    borderRadius: '8px',
                    padding: '28px',
                    height: '100%',
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'border-color 0.15s, transform 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0a0a0a'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e5e5'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <div>
                    <div style={{ fontSize: '32px', marginBottom: '14px' }}>👥</div>
                    <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2563eb', backgroundColor: '#eff6ff', padding: '3px 8px', borderRadius: '3px' }}>
                      Security &amp; Moderation
                    </span>
                    <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#0a0a0a', textTransform: 'uppercase', marginTop: '10px', marginBottom: '6px' }}>
                      User Management
                    </h3>
                    <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.5 }}>
                      Search registered users, view engagement history, toggle platform bans for policy violators, and promote new administrators.
                    </p>
                  </div>
                  <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#0a0a0a' }}>
                    Open User Manager →
                  </div>
                </div>
              </Link>

              {/* Tool 2: Bulk Import */}
              <Link to="/admin/bulk-import" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e5e5',
                    borderRadius: '8px',
                    padding: '28px',
                    height: '100%',
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'border-color 0.15s, transform 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0a0a0a'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e5e5'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <div>
                    <div style={{ fontSize: '32px', marginBottom: '14px' }}>📥</div>
                    <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#16a34a', backgroundColor: '#f0fdf4', padding: '3px 8px', borderRadius: '3px' }}>
                      Batch Ingestion
                    </span>
                    <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#0a0a0a', textTransform: 'uppercase', marginTop: '10px', marginBottom: '6px' }}>
                      Bulk Book Import
                    </h3>
                    <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.5 }}>
                      Quickly populate your catalog by uploading standardized CSV spreadsheets or pasting multi-line ISBN lists with automated cover syncing.
                    </p>
                  </div>
                  <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#0a0a0a' }}>
                    Launch Bulk Importer →
                  </div>
                </div>
              </Link>

              {/* Tool 3: Analytics */}
              <Link to="/admin/analytics" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e5e5',
                    borderRadius: '8px',
                    padding: '28px',
                    height: '100%',
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'border-color 0.15s, transform 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0a0a0a'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e5e5'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <div>
                    <div style={{ fontSize: '32px', marginBottom: '14px' }}>📈</div>
                    <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9333ea', backgroundColor: '#faf5ff', padding: '3px 8px', borderRadius: '3px' }}>
                      Insights &amp; Trends
                    </span>
                    <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#0a0a0a', textTransform: 'uppercase', marginTop: '10px', marginBottom: '6px' }}>
                      Deep Analytics &amp; Reports
                    </h3>
                    <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.5 }}>
                      Visualize review velocities over time, user registration trends, top rated literature, and review engagement charts.
                    </p>
                  </div>
                  <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#0a0a0a' }}>
                    View Deep Analytics →
                  </div>
                </div>
              </Link>

            </div>
          </div>
        )}

      </div>

      {/* ── EDIT BOOK MODAL ──────────────────────────────────────────── */}
      {editingBook && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(3px)',
          }}
          onClick={closeEditModal}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #e5e5e5',
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e5e5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#2563eb' }}>
                  Catalog Editor
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: 900, textTransform: 'uppercase', color: '#0a0a0a', marginTop: '2px' }}>
                  Edit Book Details
                </h3>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#9ca3af', padding: '4px' }}
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleUpdateBook} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* ISBN Helper */}
              <div style={{ backgroundColor: '#f9fafb', border: '1px dashed #d1d5db', borderRadius: '6px', padding: '10px 12px' }}>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4b5563', marginBottom: '4px' }}>
                  Fast Re-Fetch via ISBN
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    name="isbn"
                    value={editForm.isbn}
                    onChange={handleEditChange}
                    placeholder="Enter ISBN to auto-replace..."
                    style={{ flex: 1, padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px', outline: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={handleEditIsbnLookup}
                    disabled={editIsbnLoading || !editForm.isbn.trim()}
                    style={{ padding: '7px 12px', backgroundColor: '#0a0a0a', color: '#ffffff', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {editIsbnLoading ? '...' : 'Fetch'}
                  </button>
                </div>
                {editIsbnError && <p style={{ fontSize: '11px', color: '#dc2626', marginTop: '4px' }}>{editIsbnError}</p>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#374151', marginBottom: '6px' }}>
                  Title <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  name="title"
                  value={editForm.title}
                  onChange={handleEditChange}
                  required
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #e5e5e5', borderRadius: '4px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#374151', marginBottom: '6px' }}>
                  Author <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  name="author"
                  value={editForm.author}
                  onChange={handleEditChange}
                  required
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #e5e5e5', borderRadius: '4px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#374151', marginBottom: '6px' }}>
                  Genre
                </label>
                <select
                  name="genre"
                  value={editForm.genre}
                  onChange={handleEditChange}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #e5e5e5', borderRadius: '4px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', backgroundColor: '#fff' }}
                >
                  <option value="">Select a genre...</option>
                  {GENRES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#374151', marginBottom: '6px' }}>
                  Description
                </label>
                <textarea
                  name="description"
                  value={editForm.description}
                  onChange={handleEditChange}
                  rows="3"
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #e5e5e5', borderRadius: '4px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#374151', marginBottom: '6px' }}>
                  Cover Image URL
                </label>
                <input
                  type="file"
                  accept="image/*"
                  ref={editCoverFileRef}
                  onChange={handleEditCoverFileChange}
                  style={{ display: 'none' }}
                />
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    name="coverImage"
                    value={editForm.coverImage}
                    onChange={handleEditChange}
                    placeholder="https://..."
                    style={{ flex: 1, padding: '9px 12px', border: '1px solid #e5e5e5', borderRadius: '4px', fontSize: '12px', outline: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => editCoverFileRef.current?.click()}
                    disabled={editCoverUploading}
                    style={{ padding: '9px 12px', border: '1px solid #d1d5db', backgroundColor: '#f3f4f6', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {editCoverUploading ? '...' : 'Upload'}
                  </button>
                </div>
                {editForm.coverImage && (
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={editForm.coverImage} alt="Preview" style={{ width: '32px', height: '48px', objectFit: 'cover', borderRadius: '3px', border: '1px solid #e5e5e5' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    <span style={{ fontSize: '11px', color: '#6b7280' }}>Current cover artwork</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={closeEditModal}
                  style={{ flex: 1, padding: '11px 0', border: '1px solid #d1d5db', backgroundColor: '#ffffff', color: '#374151', borderRadius: '4px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  style={{ flex: 1, padding: '11px 0', backgroundColor: '#0a0a0a', color: '#ffffff', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', opacity: updateMutation.isPending ? 0.6 : 1 }}
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION MODAL ────────────────────────────────── */}
      {deletingBook && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 110,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(3px)',
          }}
          onClick={() => setDeletingBook(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #e5e5e5',
              width: '100%',
              maxWidth: '440px',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginBottom: '16px' }}>
              ⚠️
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 900, textTransform: 'uppercase', color: '#0a0a0a', marginBottom: '6px' }}>
              Delete Book from Library?
            </h3>
            <p style={{ fontSize: '13px', color: '#4b5563', lineHeight: 1.5, marginBottom: '14px' }}>
              Are you sure you want to permanently delete <strong style={{ color: '#0a0a0a' }}>"{deletingBook.title}"</strong> by {deletingBook.author}?
            </p>
            <p style={{ fontSize: '11px', color: '#dc2626', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', padding: '8px 10px', borderRadius: '4px', marginBottom: '20px' }}>
              This will remove the book and any associated reader reviews from the platform. This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setDeletingBook(null)}
                style={{ padding: '9px 16px', border: '1px solid #d1d5db', backgroundColor: '#ffffff', color: '#374151', borderRadius: '4px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(deletingBook._id)}
                disabled={deleteMutation.isPending}
                style={{ padding: '9px 18px', backgroundColor: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', opacity: deleteMutation.isPending ? 0.6 : 1 }}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── RESPONSIVE CSS ───────────────────────────────────────────── */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.1); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 960px) {
          .admin-books-layout {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 640px) {
          .catalog-toolbar-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

    </div>
  );
}
