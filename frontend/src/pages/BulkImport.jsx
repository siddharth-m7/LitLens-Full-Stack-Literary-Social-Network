import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Papa from 'papaparse';
import { toast } from 'react-hot-toast';
import { createBook } from '../lib/api';

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

const ALL_COLS = ['title', 'author', 'description', 'genre', 'coverImage'];
const REQUIRED_COLS = ['title', 'author'];

function downloadTemplate() {
  const header = ALL_COLS.join(',');
  const example1 = '"The Great Gatsby","F. Scott Fitzgerald","A classic American novel about wealth and love.","Fiction","https://images.unsplash.com/photo-1544947950-fa07a98d237f"';
  const example2 = '"Atomic Habits","James Clear","An easy and proven way to build good habits.","Self-Help",""';
  const blob = new Blob([header + '\n' + example1 + '\n' + example2], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'litlens_books_template.csv';
  a.click();
  URL.revokeObjectURL(url);
  toast.success('Template downloaded!');
}

export default function BulkImport() {
  const [tab, setTab] = useState('csv'); // 'csv' | 'isbn'

  // --- CSV state ---
  const [csvRows, setCsvRows] = useState([]);
  const [csvError, setCsvError] = useState('');
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvProgress, setCsvProgress] = useState(0);
  const [csvResults, setCsvResults] = useState(null);
  const fileRef = useRef(null);

  // --- ISBN state ---
  const [isbnText, setIsbnText] = useState('');
  const [isbnResults, setIsbnResults] = useState([]);
  const [isbnLooking, setIsbnLooking] = useState(false);
  const [isbnSelected, setIsbnSelected] = useState({});
  const [isbnImporting, setIsbnImporting] = useState(false);
  const [isbnProgress, setIsbnProgress] = useState(0);
  const [isbnImportResults, setIsbnImportResults] = useState(null);

  // ===================== CSV HANDLERS =====================

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvError('');
    setCsvResults(null);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const cols = result.meta.fields?.map((f) => f.trim().toLowerCase()) ?? [];
        const missing = REQUIRED_COLS.filter((c) => !cols.includes(c));
        if (missing.length > 0) {
          setCsvError(`CSV is missing mandatory column(s): ${missing.join(', ')}`);
          setCsvRows([]);
          toast.error('Missing mandatory CSV columns');
          return;
        }
        const rows = result.data
          .map((row) => {
            const normalized = {};
            Object.keys(row).forEach((k) => {
              normalized[k.trim().toLowerCase()] = row[k];
            });
            return {
              title: normalized.title || '',
              author: normalized.author || '',
              description: normalized.description || '',
              genre: normalized.genre || '',
              coverImage: normalized.coverimage || normalized.coverImage || '',
            };
          })
          .filter((r) => r.title?.trim() && r.author?.trim());

        if (rows.length === 0) {
          setCsvError('No valid rows found. Ensure each book has at least a Title and Author.');
          setCsvRows([]);
          return;
        }
        setCsvRows(rows);
        toast.success(`Loaded ${rows.length} books from CSV`);
      },
      error: () => {
        setCsvError('Failed to parse CSV file. Please verify formatting.');
        toast.error('CSV parse error');
      },
    });
  };

  const updateCsvRow = (idx, field, value) => {
    setCsvRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  };

  const removeCsvRow = (idx) => {
    setCsvRows((prev) => prev.filter((_, i) => i !== idx));
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
        failed.push({
          row: i + 1,
          title: csvRows[i].title,
          error: err.response?.data?.message || 'Failed to save',
        });
      }
      setCsvProgress(Math.round(((i + 1) / csvRows.length) * 100));
    }

    setCsvResults({ added, failed });
    setCsvImporting(false);
    if (added > 0) {
      toast.success(`Successfully imported ${added} books!`);
      setCsvRows([]);
    }
    if (failed.length > 0) {
      toast.error(`${failed.length} books failed to import`);
    }
  };

  // ===================== ISBN HANDLERS =====================

  const handleIsbnLookup = async () => {
    const isbns = isbnText
      .split(/[\n,;]+/)
      .map((s) => s.trim().replace(/-/g, ''))
      .filter(Boolean);

    if (isbns.length === 0) {
      toast.error('Please enter at least one ISBN');
      return;
    }

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
            description:
              (typeof data.notes === 'string' ? data.notes : data.excerpts?.[0]?.text) || '',
            coverImage: data.cover?.large || data.cover?.medium || '',
            genre: '',
          });
        }
      } catch {
        results.push({ isbn, found: false, error: 'Network lookup error' });
      }
    }

    setIsbnResults(results);
    const sel = {};
    results.forEach((r, i) => {
      if (r.found) sel[i] = true;
    });
    setIsbnSelected(sel);
    setIsbnLooking(false);

    const foundCount = results.filter((r) => r.found).length;
    toast.success(`Found metadata for ${foundCount} of ${results.length} ISBNs`);
  };

  const updateIsbnRow = (idx, field, value) => {
    setIsbnResults((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  };

  const handleIsbnImport = async () => {
    const toImport = isbnResults.filter((r, i) => r.found && isbnSelected[i]);
    if (toImport.length === 0) return;
    setIsbnImporting(true);
    setIsbnProgress(0);
    setIsbnImportResults(null);

    let added = 0;
    const failed = [];

    for (let i = 0; i < toImport.length; i++) {
      const row = toImport[i];
      try {
        await createBook({
          title: row.title,
          author: row.author,
          description: row.description,
          genre: row.genre,
          coverImage: row.coverImage,
        });
        added++;
      } catch (err) {
        failed.push({
          title: row.title || row.isbn,
          error: err.response?.data?.message || 'Failed to save',
        });
      }
      setIsbnProgress(Math.round(((i + 1) / toImport.length) * 100));
    }

    setIsbnImportResults({ added, failed });
    setIsbnImporting(false);

    if (added > 0) {
      toast.success(`Successfully imported ${added} books!`);
      setIsbnResults([]);
      setIsbnText('');
      setIsbnSelected({});
    }
    if (failed.length > 0) {
      toast.error(`${failed.length} books failed to import`);
    }
  };

  const loadSampleIsbns = () => {
    setIsbnText('9780743273565\n9780061965111\n9780316769174\n9780451524935');
    toast.success('Sample ISBNs loaded');
  };

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', fontFamily: "'Inter', sans-serif", color: '#0a0a0a' }}>
      
      {/* ── HEADER BANNER ────────────────────────────────────────────── */}
      <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e5e5e5' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 1.5rem 0' }}>
          
          <Link
            to="/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#6b7280',
              textDecoration: 'none',
              marginBottom: '16px',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#0a0a0a')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
          >
            ← Back to Dashboard
          </Link>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
            <div>
              <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', backgroundColor: '#ecfdf5', color: '#059669', padding: '3px 10px', borderRadius: '4px', display: 'inline-block', marginBottom: '8px' }}>
                Batch Ingestion Engine
              </span>
              <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', color: '#0a0a0a', lineHeight: 1.15 }}>
                Bulk Book Ingestion
              </h1>
              <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px', maxWidth: '600px' }}>
                Quickly populate your platform library by uploading formatted CSV spreadsheets or resolving multi-line ISBN lists.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={downloadTemplate}
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: '#0a0a0a',
                  backgroundColor: '#ffffff',
                  border: '1px solid #d1d5db',
                  padding: '8px 14px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                📄 Sample CSV Template
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: '24px', borderTop: '1px solid #e5e5e5' }}>
            <button
              type="button"
              onClick={() => setTab('csv')}
              style={{
                padding: '14px 4px',
                fontSize: '12px',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: tab === 'csv' ? '#0a0a0a' : '#6b7280',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: tab === 'csv' ? '2.5px solid #0a0a0a' : '2.5px solid transparent',
                cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              📁 CSV File Ingestion
              {csvRows.length > 0 && (
                <span style={{ fontSize: '10px', backgroundColor: '#0a0a0a', color: '#fff', padding: '1px 6px', borderRadius: '10px' }}>
                  {csvRows.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setTab('isbn')}
              style={{
                padding: '14px 4px',
                fontSize: '12px',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: tab === 'isbn' ? '#0a0a0a' : '#6b7280',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: tab === 'isbn' ? '2.5px solid #0a0a0a' : '2.5px solid transparent',
                cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              ⚡ ISBN Batch Resolver (Open Library)
              {isbnResults.length > 0 && (
                <span style={{ fontSize: '10px', backgroundColor: '#0a0a0a', color: '#fff', padding: '1px 6px', borderRadius: '10px' }}>
                  {isbnResults.length}
                </span>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────── */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 1.5rem 64px' }}>

        {/* ═════════════════════ CSV TAB ═════════════════════ */}
        {tab === 'csv' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Upload Box */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '18px' }}>
                <div>
                  <h2 style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0a0a0a' }}>
                    Upload CSV Spreadsheet
                  </h2>
                  <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                    Accepted format: UTF-8 CSV with columns <code style={{ backgroundColor: '#f3f4f6', padding: '2px 4px', borderRadius: '3px' }}>title</code>, <code style={{ backgroundColor: '#f3f4f6', padding: '2px 4px', borderRadius: '3px' }}>author</code>, <code style={{ backgroundColor: '#f3f4f6', padding: '2px 4px', borderRadius: '3px' }}>description</code>, <code style={{ backgroundColor: '#f3f4f6', padding: '2px 4px', borderRadius: '3px' }}>genre</code>, <code style={{ backgroundColor: '#f3f4f6', padding: '2px 4px', borderRadius: '3px' }}>coverImage</code>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={downloadTemplate}
                  style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#4b5563', background: 'none', border: '1px solid #e5e5e5', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Download Template
                </button>
              </div>

              {/* Drag Drop Area */}
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '36px 20px',
                  border: '2px dashed #d1d5db',
                  borderRadius: '8px',
                  backgroundColor: '#fafafa',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0a0a0a'; e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.backgroundColor = '#fafafa'; }}
              >
                <input ref={fileRef} type="file" accept=".csv" onChange={handleFileChange} style={{ display: 'none' }} />
                <span style={{ fontSize: '32px', marginBottom: '10px' }}>📄</span>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#0a0a0a', marginBottom: '4px' }}>
                  Click to select CSV or drag &amp; drop file here
                </p>
                <p style={{ fontSize: '11px', color: '#9ca3af' }}>
                  Standard CSV up to 1,000 records per batch
                </p>
              </label>

              {csvError && (
                <div style={{ marginTop: '16px', padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '6px', color: '#dc2626', fontSize: '12px', fontWeight: 600 }}>
                  ⚠️ {csvError}
                </div>
              )}
            </div>

            {/* Preview & Edit Table */}
            {csvRows.length > 0 && (
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e5e5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fafafa' }}>
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0a0a0a' }}>
                      Ready For Ingestion ({csvRows.length} Books)
                    </h3>
                    <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                      Review and modify row fields inline before triggering creation.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCsvRows([])}
                    style={{ fontSize: '11px', fontWeight: 700, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Clear All Rows
                  </button>
                </div>

                <div style={{ overflowX: 'auto', maxHeight: '500px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                    <thead style={{ position: 'sticky', top: 0, backgroundColor: '#ffffff', zIndex: 10, borderBottom: '2px solid #e5e5e5' }}>
                      <tr>
                        <th style={{ padding: '10px 14px', width: '40px', color: '#9ca3af', fontWeight: 700 }}>#</th>
                        <th style={{ padding: '10px 14px', color: '#4b5563', fontWeight: 700, minWidth: '180px' }}>Title *</th>
                        <th style={{ padding: '10px 14px', color: '#4b5563', fontWeight: 700, minWidth: '150px' }}>Author *</th>
                        <th style={{ padding: '10px 14px', color: '#4b5563', fontWeight: 700, minWidth: '140px' }}>Genre</th>
                        <th style={{ padding: '10px 14px', color: '#4b5563', fontWeight: 700, minWidth: '180px' }}>Cover Image URL</th>
                        <th style={{ padding: '10px 14px', width: '50px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvRows.map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '8px 14px', color: '#9ca3af', fontWeight: 600 }}>{idx + 1}</td>
                          <td style={{ padding: '8px 14px' }}>
                            <input
                              value={row.title}
                              onChange={(e) => updateCsvRow(idx, 'title', e.target.value)}
                              style={{ width: '100%', padding: '6px 8px', border: '1px solid #e5e5e5', borderRadius: '4px', fontSize: '12px', outline: 'none' }}
                            />
                          </td>
                          <td style={{ padding: '8px 14px' }}>
                            <input
                              value={row.author}
                              onChange={(e) => updateCsvRow(idx, 'author', e.target.value)}
                              style={{ width: '100%', padding: '6px 8px', border: '1px solid #e5e5e5', borderRadius: '4px', fontSize: '12px', outline: 'none' }}
                            />
                          </td>
                          <td style={{ padding: '8px 14px' }}>
                            <select
                              value={row.genre}
                              onChange={(e) => updateCsvRow(idx, 'genre', e.target.value)}
                              style={{ width: '100%', padding: '6px 8px', border: '1px solid #e5e5e5', borderRadius: '4px', fontSize: '12px', outline: 'none', backgroundColor: '#fff' }}
                            >
                              <option value="">Select genre...</option>
                              {GENRES.map((g) => (
                                <option key={g} value={g}>{g}</option>
                              ))}
                            </select>
                          </td>
                          <td style={{ padding: '8px 14px' }}>
                            <input
                              value={row.coverImage}
                              onChange={(e) => updateCsvRow(idx, 'coverImage', e.target.value)}
                              placeholder="https://..."
                              style={{ width: '100%', padding: '6px 8px', border: '1px solid #e5e5e5', borderRadius: '4px', fontSize: '12px', outline: 'none' }}
                            />
                          </td>
                          <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => removeCsvRow(idx)}
                              style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}
                              title="Delete Row"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Progress bar */}
                {csvImporting && (
                  <div style={{ padding: '16px 24px', backgroundColor: '#fafafa', borderTop: '1px solid #e5e5e5' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: '#0a0a0a', marginBottom: '6px' }}>
                      <span>Ingesting records into catalog...</span>
                      <span>{csvProgress}%</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', backgroundColor: '#e5e5e5', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${csvProgress}%`, backgroundColor: '#0a0a0a', transition: 'width 0.2s' }} />
                    </div>
                  </div>
                )}

                {/* Footer Action */}
                <div style={{ padding: '16px 24px', backgroundColor: '#fafafa', borderTop: '1px solid #e5e5e5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>
                    Total to ingest: <strong>{csvRows.length} books</strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleCsvImport}
                    disabled={csvImporting || csvRows.length === 0}
                    style={{
                      padding: '10px 24px',
                      backgroundColor: '#0a0a0a',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      cursor: csvImporting ? 'not-allowed' : 'pointer',
                      opacity: csvImporting ? 0.6 : 1,
                    }}
                  >
                    {csvImporting ? `Importing... (${csvProgress}%)` : `Execute Import (${csvRows.length} Books)`}
                  </button>
                </div>
              </div>
            )}

            {/* Results Feedback */}
            {csvResults && (
              <div
                style={{
                  backgroundColor: csvResults.failed.length === 0 ? '#f0fdf4' : '#fffbeb',
                  border: `1px solid ${csvResults.failed.length === 0 ? '#bbf7d0' : '#fde68a'}`,
                  borderRadius: '8px',
                  padding: '20px 24px',
                }}
              >
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0a0a0a', marginBottom: '4px' }}>
                  Import Batch Completed
                </h3>
                <p style={{ fontSize: '13px', color: '#4b5563' }}>
                  Successfully published <strong style={{ color: '#16a34a' }}>{csvResults.added}</strong> books to the library.
                  {csvResults.failed.length > 0 && (
                    <span> (<span style={{ color: '#dc2626' }}>{csvResults.failed.length} failed</span>)</span>
                  )}
                </p>
                {csvResults.failed.length > 0 && (
                  <ul style={{ marginTop: '12px', paddingLeft: '20px', fontSize: '12px', color: '#dc2626' }}>
                    {csvResults.failed.map((f, i) => (
                      <li key={i}>
                        Row {f.row} "{f.title}": {f.error}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

          </div>
        )}

        {/* ═════════════════════ ISBN TAB ═════════════════════ */}
        {tab === 'isbn' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Input Box */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <h2 style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0a0a0a' }}>
                    Paste ISBN Numbers
                  </h2>
                  <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                    Enter standard 10 or 13-digit ISBNs (one per line or separated by commas).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={loadSampleIsbns}
                  style={{ fontSize: '11px', fontWeight: 700, color: '#2563eb', background: 'none', border: '1px solid #bfdbfe', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', backgroundColor: '#eff6ff' }}
                >
                  + Load 4 Sample ISBNs
                </button>
              </div>

              <textarea
                value={isbnText}
                onChange={(e) => setIsbnText(e.target.value)}
                rows={5}
                placeholder={`9780743273565\n9780061965111\n9780316769174\n9780451524935`}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '1px solid #e5e5e5',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  outline: 'none',
                  boxSizing: 'border-box',
                  lineHeight: 1.6,
                }}
              />

              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleIsbnLookup}
                  disabled={isbnLooking || !isbnText.trim()}
                  style={{
                    padding: '11px 24px',
                    backgroundColor: '#0a0a0a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    cursor: (isbnLooking || !isbnText.trim()) ? 'not-allowed' : 'pointer',
                    opacity: (isbnLooking || !isbnText.trim()) ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {isbnLooking ? (
                    <>
                      <div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                      Resolving ISBNs from Open Library...
                    </>
                  ) : (
                    '🔍 Fetch Book Metadata'
                  )}
                </button>
              </div>
            </div>

            {/* Lookup Results List */}
            {isbnResults.length > 0 && (
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e5e5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fafafa', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0a0a0a' }}>
                      Resolved ISBN Data ({isbnResults.filter((r) => r.found).length} Found)
                    </h3>
                    <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                      Check items to include in catalog ingestion and optionally assign genres.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', fontSize: '11px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const sel = {};
                        isbnResults.forEach((r, i) => { if (r.found) sel[i] = true; });
                        setIsbnSelected(sel);
                      }}
                      style={{ color: '#0a0a0a', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      Select All Found
                    </button>
                    <span style={{ color: '#d1d5db' }}>|</span>
                    <button
                      type="button"
                      onClick={() => setIsbnSelected({})}
                      style={{ color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {isbnResults.map((row, idx) => (
                    <div
                      key={idx}
                      style={{
                        border: `1px solid ${!row.found ? '#fecaca' : isbnSelected[idx] ? '#0a0a0a' : '#e5e5e5'}`,
                        backgroundColor: !row.found ? '#fef2f2' : '#ffffff',
                        borderRadius: '8px',
                        padding: '16px',
                        display: 'flex',
                        gap: '14px',
                        alignItems: 'flex-start',
                        transition: 'border-color 0.15s',
                      }}
                    >
                      {row.found ? (
                        <input
                          type="checkbox"
                          checked={!!isbnSelected[idx]}
                          onChange={(e) => setIsbnSelected((prev) => ({ ...prev, [idx]: e.target.checked }))}
                          style={{ marginTop: '4px', width: '16px', height: '16px', accentColor: '#0a0a0a' }}
                        />
                      ) : (
                        <span style={{ color: '#dc2626', fontSize: '14px', marginTop: '2px' }}>✕</span>
                      )}

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <span style={{ fontSize: '10px', fontFamily: 'monospace', fontWeight: 700, backgroundColor: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>
                            ISBN: {row.isbn}
                          </span>
                          {row.found ? (
                            <span style={{ fontSize: '10px', fontWeight: 800, color: '#16a34a', backgroundColor: '#dcfce7', padding: '2px 6px', borderRadius: '3px' }}>
                              Found
                            </span>
                          ) : (
                            <span style={{ fontSize: '10px', fontWeight: 800, color: '#dc2626', backgroundColor: '#fee2e2', padding: '2px 6px', borderRadius: '3px' }}>
                              Not in OpenLibrary
                            </span>
                          )}
                        </div>

                        {row.found && (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', marginBottom: '4px' }}>
                                Title
                              </label>
                              <input
                                value={row.title}
                                onChange={(e) => updateIsbnRow(idx, 'title', e.target.value)}
                                style={{ width: '100%', padding: '7px 10px', border: '1px solid #e5e5e5', borderRadius: '4px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', marginBottom: '4px' }}>
                                Author
                              </label>
                              <input
                                value={row.author}
                                onChange={(e) => updateIsbnRow(idx, 'author', e.target.value)}
                                style={{ width: '100%', padding: '7px 10px', border: '1px solid #e5e5e5', borderRadius: '4px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', marginBottom: '4px' }}>
                                Genre
                              </label>
                              <select
                                value={row.genre}
                                onChange={(e) => updateIsbnRow(idx, 'genre', e.target.value)}
                                style={{ width: '100%', padding: '7px 10px', border: '1px solid #e5e5e5', borderRadius: '4px', fontSize: '12px', outline: 'none', boxSizing: 'border-box', backgroundColor: '#fff' }}
                              >
                                <option value="">Select genre...</option>
                                {GENRES.map((g) => (
                                  <option key={g} value={g}>{g}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#6b7280', marginBottom: '4px' }}>
                                Cover Artwork URL
                              </label>
                              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                {row.coverImage && (
                                  <img
                                    src={row.coverImage}
                                    alt="Cover"
                                    style={{ width: '24px', height: '34px', objectFit: 'cover', borderRadius: '2px', border: '1px solid #e5e5e5' }}
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                  />
                                )}
                                <input
                                  value={row.coverImage}
                                  onChange={(e) => updateIsbnRow(idx, 'coverImage', e.target.value)}
                                  placeholder="Cover image URL..."
                                  style={{ flex: 1, padding: '7px 10px', border: '1px solid #e5e5e5', borderRadius: '4px', fontSize: '12px', outline: 'none' }}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Import Action */}
                {Object.values(isbnSelected).some(Boolean) && (
                  <div style={{ padding: '16px 24px', backgroundColor: '#fafafa', borderTop: '1px solid #e5e5e5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                      Selected for import:{' '}
                      <strong>{Object.values(isbnSelected).filter(Boolean).length} books</strong>
                    </span>
                    <button
                      type="button"
                      onClick={handleIsbnImport}
                      disabled={isbnImporting}
                      style={{
                        padding: '10px 24px',
                        backgroundColor: '#0a0a0a',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 800,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        cursor: isbnImporting ? 'not-allowed' : 'pointer',
                        opacity: isbnImporting ? 0.6 : 1,
                      }}
                    >
                      {isbnImporting ? 'Importing Books...' : `Import ${Object.values(isbnSelected).filter(Boolean).length} Selected Books`}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Results Feedback */}
            {isbnImportResults && (
              <div
                style={{
                  backgroundColor: isbnImportResults.failed.length === 0 ? '#f0fdf4' : '#fffbeb',
                  border: `1px solid ${isbnImportResults.failed.length === 0 ? '#bbf7d0' : '#fde68a'}`,
                  borderRadius: '8px',
                  padding: '20px 24px',
                }}
              >
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0a0a0a', marginBottom: '4px' }}>
                  ISBN Batch Import Completed
                </h3>
                <p style={{ fontSize: '13px', color: '#4b5563' }}>
                  Successfully published <strong style={{ color: '#16a34a' }}>{isbnImportResults.added}</strong> books to the library.
                  {isbnImportResults.failed.length > 0 && (
                    <span> (<span style={{ color: '#dc2626' }}>{isbnImportResults.failed.length} failed</span>)</span>
                  )}
                </p>
                {isbnImportResults.failed.length > 0 && (
                  <ul style={{ marginTop: '12px', paddingLeft: '20px', fontSize: '12px', color: '#dc2626' }}>
                    {isbnImportResults.failed.map((f, i) => (
                      <li key={i}>
                        "{f.title}": {f.error}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

          </div>
        )}

      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
