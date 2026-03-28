import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import BookCard from '../components/BookCard';
import { fetchBooks, createBook, updateBook, deleteBook } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';

const GENRES = ['Fiction', 'Non-Fiction', 'Mystery', 'Science Fiction', 'Fantasy', 'Romance', 'Thriller', 'Biography', 'Self-Help', 'Historical Fiction', 'Horror', 'Poetry', 'Other'];

export default function AdminDashboard() {
  const queryClient = useQueryClient();

  const [form, setForm] = useState({ title: '', author: '', description: '', genre: '', coverImage: '', isbn: '' });
  const [isbnLoading, setIsbnLoading] = useState(false);
  const [isbnError, setIsbnError] = useState('');

  // Edit book state
  const [editingBook, setEditingBook] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', author: '', description: '', genre: '', coverImage: '', isbn: '' });
  const [editIsbnLoading, setEditIsbnLoading] = useState(false);
  const [editIsbnError, setEditIsbnError] = useState('');

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
      setForm(prev => ({
        ...prev,
        title: data.title || prev.title,
        author: data.authors?.[0]?.name || prev.author,
        description: (typeof data.notes === 'string' ? data.notes : data.excerpts?.[0]?.text) || prev.description,
        coverImage: data.cover?.medium || prev.coverImage,
      }));
    } catch (err) {
      setIsbnError('Lookup failed. Please check your connection and try again.');
    } finally {
      setIsbnLoading(false);
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
      setEditForm(prev => ({
        ...prev,
        title: data.title || prev.title,
        author: data.authors?.[0]?.name || prev.author,
        description: (typeof data.notes === 'string' ? data.notes : data.excerpts?.[0]?.text) || prev.description,
        coverImage: data.cover?.medium || prev.coverImage,
      }));
    } catch {
      setEditIsbnError('Lookup failed. Please check your connection.');
    } finally {
      setEditIsbnLoading(false);
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

  const inputCls = 'w-full px-3 py-2.5 border border-[#E8E0CE] rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors';

  return (
    <div className="min-h-screen bg-[#FAF6EE]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage your book collection and library settings</p>
        </div>

        {/* Admin Nav Links */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Link
            to="/admin/users"
            className="border border-[#E8E0CE] bg-white text-gray-700 px-4 py-2 rounded-lg hover:bg-[#F0EAD6] hover:border-[#D5CAAC] active:scale-[0.98] text-sm font-medium transition-all duration-150"
          >
            User Management
          </Link>
          <Link
            to="/admin/analytics"
            className="border border-[#E8E0CE] bg-white text-gray-700 px-4 py-2 rounded-lg hover:bg-[#F0EAD6] hover:border-[#D5CAAC] active:scale-[0.98] text-sm font-medium transition-all duration-150"
          >
            Analytics
          </Link>
          <Link
            to="/admin/bulk-import"
            className="border border-[#E8E0CE] bg-white text-gray-700 px-4 py-2 rounded-lg hover:bg-[#F0EAD6] hover:border-[#D5CAAC] active:scale-[0.98] text-sm font-medium transition-all duration-150"
          >
            Bulk Import
          </Link>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Add Book Form — left 1/3 */}
          <div className="xl:col-span-1">
            <div className="bg-white border border-[#E8E0CE] rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-[#E8E0CE]">
                <h2 className="text-lg font-semibold text-gray-900">Add New Book</h2>
                <p className="text-sm text-gray-500 mt-0.5">Fill in the details to add a book to the library</p>
              </div>

              <form onSubmit={handleAddBook} className="p-6 space-y-5">
                {/* ISBN Lookup */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    ISBN Lookup <span className="text-gray-400 font-normal">(auto-fill details)</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      name="isbn"
                      value={form.isbn}
                      onChange={handleChange}
                      placeholder="e.g. 9780743273565"
                      className="flex-1 px-3 py-2.5 border border-[#E8E0CE] rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleIsbnLookup}
                      disabled={isbnLoading || !form.isbn.trim()}
                      className="px-3 py-2.5 bg-gray-900 text-white rounded-lg font-medium shadow-sm hover:bg-gray-800 hover:shadow-md active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 disabled:shadow-none transition-all duration-150 text-sm whitespace-nowrap flex items-center gap-1.5"
                    >
                      {isbnLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      )}
                      {isbnLoading ? 'Looking up...' : 'Lookup'}
                    </button>
                  </div>
                  {isbnError && <p className="text-red-500 text-xs mt-1.5">{isbnError}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Book Title</label>
                  <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="Enter the book title"
                    className={inputCls}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Author Name</label>
                  <input
                    name="author"
                    value={form.author}
                    onChange={handleChange}
                    placeholder="Enter the author's name"
                    className={inputCls}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Write a brief description..."
                    rows="4"
                    className="w-full px-3 py-2.5 border border-[#E8E0CE] rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Genre</label>
                  <select
                    name="genre"
                    value={form.genre}
                    onChange={handleChange}
                    className={inputCls}
                  >
                    <option value="">Select a genre...</option>
                    {GENRES.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Cover Image URL</label>
                  <input
                    name="coverImage"
                    value={form.coverImage}
                    onChange={handleChange}
                    placeholder="https://covers.openlibrary.org/..."
                    className="w-full px-3 py-2.5 border border-[#E8E0CE] rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors text-sm"
                  />
                  {form.coverImage && (
                    <div className="mt-2 flex items-center gap-3">
                      <img
                        src={form.coverImage}
                        alt="Cover preview"
                        className="w-10 h-14 object-cover rounded-lg border border-[#E8E0CE]"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <span className="text-xs text-gray-500">Cover preview</span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={addMutation.isPending}
                  className="w-full bg-gray-900 text-white px-4 py-2.5 rounded-lg font-medium shadow-sm hover:bg-gray-800 hover:shadow-md active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 disabled:shadow-none transition-all duration-150 flex items-center justify-center gap-2"
                >
                  {addMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Adding Book...
                    </>
                  ) : (
                    'Add Book to Library'
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Book Collection — right 2/3 */}
          <div className="xl:col-span-2">
            <div className="bg-white border border-[#E8E0CE] rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-[#E8E0CE] flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Book Collection</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {isLoading ? 'Loading...' : `${books.length} ${books.length === 1 ? 'book' : 'books'} in your library`}
                  </p>
                </div>
                {!isLoading && (
                  <span className="bg-[#F0EAD6] text-gray-700 text-sm font-medium px-3 py-1 rounded-md">
                    {books.length} Total
                  </span>
                )}
              </div>

              <div className="p-6">
                {isLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-900 border-t-transparent" />
                  </div>
                ) : books.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-gray-500 font-medium text-lg mb-1">Your library is empty</p>
                    <p className="text-gray-400 text-sm">Add your first book using the form on the left.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {books.map((book) => (
                      <BookCard key={book._id} book={book} onDelete={handleDelete} onEdit={openEditModal} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        {books.length > 0 && (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white border border-[#E8E0CE] rounded-xl p-5 shadow-sm">
              <p className="text-sm text-gray-500 font-medium">Total Books</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{books.length}</p>
            </div>

            <div className="bg-white border border-[#E8E0CE] rounded-xl p-5 shadow-sm">
              <p className="text-sm text-gray-500 font-medium">Authors</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {new Set(books.map(book => book.author)).size}
              </p>
            </div>

            <div className="bg-white border border-[#E8E0CE] rounded-xl p-5 shadow-sm">
              <p className="text-sm text-gray-500 font-medium">Average Rating</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {(() => {
                  const rated = books.filter(b => b.averageRating != null);
                  return rated.length > 0
                    ? (rated.reduce((acc, b) => acc + b.averageRating, 0) / rated.length).toFixed(1)
                    : '—';
                })()}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Edit Book Modal */}
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
                  {GENRES.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Cover Image URL</label>
                <input name="coverImage" value={editForm.coverImage} onChange={handleEditChange}
                  placeholder="https://..."
                  className="w-full px-3 py-2.5 border border-[#E8E0CE] rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors text-sm" />
                {editForm.coverImage && (
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
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
