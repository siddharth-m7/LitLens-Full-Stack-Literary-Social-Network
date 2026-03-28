import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios'; // kept for Open Library external API only
import Papa from 'papaparse';
import { createBook } from '../lib/api';

const GENRES = ['Fiction', 'Non-Fiction', 'Mystery', 'Science Fiction', 'Fantasy', 'Romance', 'Thriller', 'Biography', 'Self-Help', 'Historical Fiction', 'Horror', 'Poetry', 'Other'];

const REQUIRED_COLS = ['title', 'author'];
const ALL_COLS = ['title', 'author', 'description', 'genre', 'coverImage'];

function downloadTemplate() {
  const header = ALL_COLS.join(',');
  const example = '"The Great Gatsby","F. Scott Fitzgerald","A story of the American Dream","Fiction",""';
  const blob = new Blob([header + '\n' + example], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'books_template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function BulkImport() {
  const [tab, setTab] = useState('csv');

  // --- CSV state ---
  const [csvRows, setCsvRows] = useState([]);
  const [csvError, setCsvError] = useState('');
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvProgress, setCsvProgress] = useState(0);
  const [csvResults, setCsvResults] = useState(null);
  const fileRef = useRef();

  // --- ISBN state ---
  const [isbnText, setIsbnText] = useState('');
  const [isbnResults, setIsbnResults] = useState([]);
  const [isbnLooking, setIsbnLooking] = useState(false);
  const [isbnSelected, setIsbnSelected] = useState({});
  const [isbnImporting, setIsbnImporting] = useState(false);
  const [isbnImportResults, setIsbnImportResults] = useState(null);

  // ===================== CSV =====================

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvError('');
    setCsvResults(null);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const cols = result.meta.fields?.map(f => f.trim().toLowerCase()) ?? [];
        const missing = REQUIRED_COLS.filter(c => !cols.includes(c));
        if (missing.length > 0) {
          setCsvError(`CSV is missing required column(s): ${missing.join(', ')}`);
          setCsvRows([]);
          return;
        }
        // Normalize column names
        const rows = result.data.map(row => {
          const normalized = {};
          Object.keys(row).forEach(k => { normalized[k.trim().toLowerCase()] = row[k]; });
          return {
            title: normalized.title || '',
            author: normalized.author || '',
            description: normalized.description || '',
            genre: normalized.genre || '',
            coverImage: normalized.coverimage || normalized.coverImage || '',
          };
        }).filter(r => r.title && r.author);
        if (rows.length === 0) {
          setCsvError('No valid rows found. Make sure each row has a title and author.');
          setCsvRows([]);
          return;
        }
        setCsvRows(rows);
      },
      error: () => setCsvError('Failed to parse CSV. Make sure the file is valid.'),
    });
  };

  const updateCsvRow = (idx, field, value) => {
    setCsvRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const removeCsvRow = (idx) => {
    setCsvRows(prev => prev.filter((_, i) => i !== idx));
  };

  const handleCsvImport = async () => {
    if (csvRows.length === 0) return;
    setCsvImporting(true);
    setCsvProgress(0);
    setCsvResults(null);
    let added = 0;
    const failed = [];
    for (let i = 0; i < csvRows.length; i++) {
      try {
        await createBook(csvRows[i]);
        added++;
      } catch (err) {
        failed.push({ row: i + 1, title: csvRows[i].title, error: err.response?.data?.message || 'Unknown error' });
      }
      setCsvProgress(Math.round(((i + 1) / csvRows.length) * 100));
    }
    setCsvResults({ added, failed });
    setCsvImporting(false);
    if (added > 0) setCsvRows([]);
  };

  // ===================== ISBN =====================

  const handleIsbnLookup = async () => {
    const isbns = isbnText
      .split(/[\n,]+/)
      .map(s => s.trim())
      .filter(Boolean);
    if (isbns.length === 0) return;
    setIsbnLooking(true);
    setIsbnResults([]);
    setIsbnSelected({});
    setIsbnImportResults(null);

    const results = [];
    for (const isbn of isbns) {
      try {
        const res = await axios.get(
          `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`
        );
        const data = res.data[`ISBN:${isbn}`];
        if (!data) {
          results.push({ isbn, found: false });
        } else {
          results.push({
            isbn,
            found: true,
            title: data.title || '',
            author: data.authors?.[0]?.name || '',
            description: (typeof data.notes === 'string' ? data.notes : data.excerpts?.[0]?.text) || '',
            coverImage: data.cover?.medium || '',
            genre: '',
          });
        }
      } catch {
        results.push({ isbn, found: false, error: 'Lookup failed' });
      }
    }
    setIsbnResults(results);
    // Pre-select all found books
    const sel = {};
    results.forEach((r, i) => { if (r.found) sel[i] = true; });
    setIsbnSelected(sel);
    setIsbnLooking(false);
  };

  const updateIsbnRow = (idx, field, value) => {
    setIsbnResults(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const handleIsbnImport = async () => {
    const toImport = isbnResults.filter((r, i) => r.found && isbnSelected[i]);
    if (toImport.length === 0) return;
    setIsbnImporting(true);
    setIsbnImportResults(null);
    let added = 0;
    const failed = [];
    for (const row of toImport) {
      try {
        await createBook({ title: row.title, author: row.author, description: row.description, genre: row.genre, coverImage: row.coverImage });
        added++;
      } catch (err) {
        failed.push({ title: row.title || row.isbn, error: err.response?.data?.message || 'Unknown error' });
      }
    }
    setIsbnImportResults({ added, failed });
    setIsbnImporting(false);
    if (added > 0) {
      setIsbnResults([]);
      setIsbnText('');
      setIsbnSelected({});
    }
  };

  // ===================== Render =====================

  return (
    <div className="min-h-screen bg-[#FAF6EE]">
      <div className="container mx-auto px-4 py-8 max-w-5xl">

        {/* Header */}
        <div className="mb-8">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium mb-4 transition-colors text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Bulk Book Import</h1>
          <p className="text-gray-500 mt-1 text-sm">Import multiple books at once via CSV upload or ISBN batch lookup</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-[#E8E0CE]">
          <button
            onClick={() => setTab('csv')}
            className={`px-4 pb-3 text-sm font-medium transition-all duration-150 border-b-2 ${tab === 'csv' ? 'font-semibold text-gray-900 border-gray-900' : 'text-gray-400 border-transparent hover:text-gray-700 hover:border-gray-300'}`}
          >
            CSV Upload
          </button>
          <button
            onClick={() => setTab('isbn')}
            className={`px-4 pb-3 text-sm font-medium transition-all duration-150 border-b-2 ${tab === 'isbn' ? 'font-semibold text-gray-900 border-gray-900' : 'text-gray-400 border-transparent hover:text-gray-700 hover:border-gray-300'}`}
          >
            ISBN Batch
          </button>
        </div>

        {/* ==================== CSV TAB ==================== */}
        {tab === 'csv' && (
          <div className="bg-white border border-[#E8E0CE] rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-[#E8E0CE]">
              <h2 className="text-xl font-semibold text-gray-900">CSV Upload</h2>
              <p className="text-gray-500 text-sm mt-0.5">Upload a CSV file with book details. Required columns: title, author</p>
            </div>
            <div className="p-6 space-y-5">
              {/* Download template + file input */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={downloadTemplate}
                  className="inline-flex items-center gap-2 border border-[#E8E0CE] bg-white text-gray-700 px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-[#F0EAD6] hover:border-[#D5CAAC] active:scale-[0.98] transition-all duration-150">
                  Download Template
                </button>
                <label className="flex-1 flex items-center gap-3 px-4 py-2.5 border border-dashed border-[#E8E0CE] rounded-lg cursor-pointer hover:border-gray-900 hover:bg-[#FAF6EE] transition-all">
                  <input ref={fileRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-sm text-gray-500">Click to upload CSV or drag &amp; drop</span>
                </label>
              </div>

              {csvError && (
                <p className="text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm">{csvError}</p>
              )}

              {/* Preview table */}
              {csvRows.length > 0 && (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 text-sm">{csvRows.length} books to import</h3>
                      <span className="text-xs text-gray-400">You can edit fields before importing</span>
                    </div>
                    <div className="overflow-x-auto border border-[#E8E0CE] rounded-xl">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[#E8E0CE] bg-[#FAF6EE]">
                            <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500">#</th>
                            <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500">Title *</th>
                            <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500">Author *</th>
                            <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500">Genre</th>
                            <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500">Cover URL</th>
                            <th className="px-3 py-2.5"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {csvRows.map((row, i) => (
                            <tr key={i} className="border-b border-[#E8E0CE] hover:bg-[#FAF6EE]">
                              <td className="px-3 py-2 text-gray-400 text-xs">{i + 1}</td>
                              <td className="px-3 py-2">
                                <input value={row.title} onChange={e => updateCsvRow(i, 'title', e.target.value)}
                                  className="w-full border border-[#E8E0CE] rounded-lg px-2 py-1.5 text-xs focus:border-gray-900 focus:outline-none" />
                              </td>
                              <td className="px-3 py-2">
                                <input value={row.author} onChange={e => updateCsvRow(i, 'author', e.target.value)}
                                  className="w-full border border-[#E8E0CE] rounded-lg px-2 py-1.5 text-xs focus:border-gray-900 focus:outline-none" />
                              </td>
                              <td className="px-3 py-2">
                                <select value={row.genre} onChange={e => updateCsvRow(i, 'genre', e.target.value)}
                                  className="border border-[#E8E0CE] rounded-lg px-2 py-1.5 text-xs focus:border-gray-900 focus:outline-none bg-white">
                                  <option value="">—</option>
                                  {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                              </td>
                              <td className="px-3 py-2">
                                <input value={row.coverImage} onChange={e => updateCsvRow(i, 'coverImage', e.target.value)}
                                  placeholder="https://..."
                                  className="w-32 border border-[#E8E0CE] rounded-lg px-2 py-1.5 text-xs focus:border-gray-900 focus:outline-none" />
                              </td>
                              <td className="px-3 py-2">
                                <button onClick={() => removeCsvRow(i)} className="text-red-400 hover:text-red-600 transition-colors">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Progress bar */}
                  {csvImporting && (
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Importing...</span>
                        <span>{csvProgress}%</span>
                      </div>
                      <div className="w-full bg-[#E8E0CE] rounded-full h-1.5">
                        <div className="bg-gray-900 h-1.5 rounded-full transition-all duration-300" style={{ width: `${csvProgress}%` }}></div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleCsvImport}
                    disabled={csvImporting || csvRows.length === 0}
                    className="w-full bg-gray-900 text-white px-4 py-2.5 rounded-lg font-medium shadow-sm hover:bg-gray-800 hover:shadow-md active:scale-[0.98] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 disabled:shadow-none"
                  >
                    {csvImporting ? `Importing... ${csvProgress}%` : `Import ${csvRows.length} Books`}
                  </button>
                </>
              )}

              {/* Results */}
              {csvResults && (
                <div className={`rounded-xl p-4 border text-sm ${csvResults.failed.length === 0 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                  <p className="font-semibold text-gray-900 mb-2">
                    Import complete: {csvResults.added} added{csvResults.failed.length > 0 ? `, ${csvResults.failed.length} failed` : ''}
                  </p>
                  {csvResults.failed.length > 0 && (
                    <ul className="text-red-600 space-y-1 text-xs">
                      {csvResults.failed.map((f, i) => (
                        <li key={i}>Row {f.row} "{f.title}": {f.error}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== ISBN TAB ==================== */}
        {tab === 'isbn' && (
          <div className="bg-white border border-[#E8E0CE] rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-[#E8E0CE]">
              <h2 className="text-xl font-semibold text-gray-900">ISBN Batch Lookup</h2>
              <p className="text-gray-500 text-sm mt-0.5">Enter ISBNs (one per line or comma-separated) and auto-fill book details from Open Library</p>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  ISBNs <span className="text-gray-400 font-normal">(one per line or comma-separated)</span>
                </label>
                <textarea
                  value={isbnText}
                  onChange={e => setIsbnText(e.target.value)}
                  rows={4}
                  placeholder={"9780743273565\n9780061965111\n9780316769174"}
                  className="w-full px-3 py-2.5 border border-[#E8E0CE] rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-colors resize-none font-mono text-sm"
                />
              </div>

              <button
                onClick={handleIsbnLookup}
                disabled={isbnLooking || !isbnText.trim()}
                className="w-full bg-gray-900 text-white px-4 py-2.5 rounded-lg font-medium shadow-sm hover:bg-gray-800 hover:shadow-md active:scale-[0.98] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 disabled:shadow-none flex items-center justify-center gap-2"
              >
                {isbnLooking ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Looking up ISBNs...
                  </>
                ) : 'Lookup All ISBNs'}
              </button>

              {/* Results table */}
              {isbnResults.length > 0 && (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 text-sm">
                        {isbnResults.filter(r => r.found).length} found / {isbnResults.filter(r => !r.found).length} not found
                      </h3>
                      <div className="flex gap-3 text-xs">
                        <button onClick={() => {
                          const sel = {};
                          isbnResults.forEach((r, i) => { if (r.found) sel[i] = true; });
                          setIsbnSelected(sel);
                        }} className="text-gray-700 hover:underline font-medium">Select all found</button>
                        <span className="text-gray-300">|</span>
                        <button onClick={() => setIsbnSelected({})} className="text-gray-500 hover:underline">Deselect all</button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {isbnResults.map((row, i) => (
                        <div key={i} className={`border rounded-xl p-4 transition-all ${
                          !row.found ? 'border-red-200 bg-red-50/30' :
                          isbnSelected[i] ? 'border-gray-900' : 'border-[#E8E0CE]'
                        }`}>
                          <div className="flex items-start gap-3">
                            {row.found && (
                              <input
                                type="checkbox"
                                checked={!!isbnSelected[i]}
                                onChange={e => setIsbnSelected(prev => ({ ...prev, [i]: e.target.checked }))}
                                className="mt-1 w-4 h-4 rounded accent-gray-900"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-mono text-gray-500 bg-[#F0EAD6] px-2 py-0.5 rounded">ISBN: {row.isbn}</span>
                                {row.found ? (
                                  <span className="bg-[#F0EAD6] text-gray-700 text-xs font-medium px-2.5 py-1 rounded-md">Found</span>
                                ) : (
                                  <span className="bg-red-100 text-red-600 text-xs font-medium px-2.5 py-1 rounded-md">Not found</span>
                                )}
                              </div>
                              {row.found && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <input value={row.title} onChange={e => updateIsbnRow(i, 'title', e.target.value)}
                                    placeholder="Title"
                                    className="border border-[#E8E0CE] rounded-lg px-3 py-2 text-sm focus:border-gray-900 focus:outline-none" />
                                  <input value={row.author} onChange={e => updateIsbnRow(i, 'author', e.target.value)}
                                    placeholder="Author"
                                    className="border border-[#E8E0CE] rounded-lg px-3 py-2 text-sm focus:border-gray-900 focus:outline-none" />
                                  <select value={row.genre} onChange={e => updateIsbnRow(i, 'genre', e.target.value)}
                                    className="border border-[#E8E0CE] rounded-lg px-3 py-2 text-sm focus:border-gray-900 focus:outline-none bg-white">
                                    <option value="">Select genre...</option>
                                    {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                                  </select>
                                  <div className="flex items-center gap-2">
                                    {row.coverImage && (
                                      <img src={row.coverImage} alt="cover" className="w-8 h-11 object-cover rounded-lg flex-shrink-0 border border-[#E8E0CE]"
                                        onError={e => { e.target.style.display = 'none'; }} />
                                    )}
                                    <input value={row.coverImage} onChange={e => updateIsbnRow(i, 'coverImage', e.target.value)}
                                      placeholder="Cover URL"
                                      className="flex-1 border border-[#E8E0CE] rounded-lg px-3 py-2 text-sm focus:border-gray-900 focus:outline-none" />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {Object.values(isbnSelected).some(Boolean) && (
                    <button
                      onClick={handleIsbnImport}
                      disabled={isbnImporting}
                      className="w-full bg-gray-900 text-white px-4 py-2.5 rounded-lg font-medium shadow-sm hover:bg-gray-800 hover:shadow-md active:scale-[0.98] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 disabled:shadow-none"
                    >
                      {isbnImporting
                        ? 'Importing...'
                        : `Import ${Object.values(isbnSelected).filter(Boolean).length} Selected Books`}
                    </button>
                  )}

                  {isbnImportResults && (
                    <div className={`rounded-xl p-4 border text-sm ${isbnImportResults.failed.length === 0 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                      <p className="font-semibold text-gray-900 mb-2">
                        Import complete: {isbnImportResults.added} added{isbnImportResults.failed.length > 0 ? `, ${isbnImportResults.failed.length} failed` : ''}
                      </p>
                      {isbnImportResults.failed.length > 0 && (
                        <ul className="text-red-600 space-y-1 text-xs">
                          {isbnImportResults.failed.map((f, i) => (
                            <li key={i}>"{f.title}": {f.error}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
