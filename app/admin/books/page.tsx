"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlusCircle, Search, Star, Headphones, Trash2, Edit3, BookOpen } from 'lucide-react';
import { api, Book } from '../../lib/api';

export default function AdminBooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    api.getBooks().then(data => {
      setBooks(data || []);
      setLoading(false);
    });
  }, []);

  const filtered = books.filter(b =>
    b.title.toLowerCase().includes(query.toLowerCase()) ||
    b.author.toLowerCase().includes(query.toLowerCase()) ||
    b.category.toLowerCase().includes(query.toLowerCase())
  );

  async function handleDelete(id: string, title: string) {
    if (!confirm(`"${title}" kitobini o'chirishni tasdiqlaysizmi?\n\nBu amalni qaytarib bo'lmaydi!`)) return;
    setDeleting(id);
    const result = await api.deleteBook(id);
    setDeleting(null);
    if (result.success) {
      setBooks(prev => prev.filter(b => b.id !== id));
      setToastType('success');
      setToast(result.fromBackend
        ? "✓ Kitob backend'dan ham o'chirildi"
        : "✓ Kitob o'chirildi"
      );
    } else {
      setToastType('error');
      setToast("✗ O'chirishda xatolik yuz berdi");
    }
    setTimeout(() => setToast(''), 3500);
  }

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1rem', zIndex: 100,
          background: toastType === 'success' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
          border: `1px solid ${toastType === 'success' ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
          color: toastType === 'success' ? '#10b981' : '#f87171',
          padding: '12px 16px', borderRadius: '10px', fontWeight: 500, maxWidth: 'calc(100vw - 2rem)',
          fontSize: '0.9rem'
        }}>{toast}</div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(1.4rem, 5vw, 1.8rem)', fontWeight: 800, marginBottom: '0.25rem' }}>Kitoblar</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{books.length} ta kitob mavjud</p>
        </div>
        <Link href="/admin/books/add" style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '9px 16px', background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
          borderRadius: '10px', color: '#fff', fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none',
          boxShadow: '0 4px 15px rgba(79,142,247,0.25)', whiteSpace: 'nowrap'
        }}>
          <PlusCircle size={17} />
          Qo&apos;shish
        </Link>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
        <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
        <input
          type="text"
          placeholder="Qidirish..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{
            width: '100%', padding: '11px 14px 11px 42px',
            background: 'var(--search-bg)', border: '1px solid var(--search-border)',
            borderRadius: '12px', color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none'
          }}
        />
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Yuklanmoqda...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '16px' }}>
          <BookOpen size={40} style={{ margin: '0 auto 1rem', opacity: 0.4, display: 'block' }} />
          <p>Kitoblar topilmadi</p>
        </div>
      ) : (
        <>
          {/* Desktop Table — hidden on mobile */}
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '16px', overflow: 'hidden', overflowX: 'auto' }} className="desktop-table">
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--search-bg)' }}>
                  {['Kitob', 'Muallif', 'Kategoriya', 'Narxi', 'Reyting', 'Audio', 'Amallar'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((book, i) => (
                  <tr key={book.id} style={{
                    borderBottom: i < filtered.length - 1 ? '1px solid var(--border-color)' : 'none',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--search-bg)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '48px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0, background: 'var(--border-color)' }}>
                          <img src={book.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <span style={{ fontWeight: 600, fontSize: '0.88rem', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                          {book.title}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{book.author}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', background: 'rgba(155,109,255,0.12)', color: 'var(--accent-purple)', borderRadius: '99px', whiteSpace: 'nowrap' }}>
                        {book.category}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-blue)', whiteSpace: 'nowrap' }}>{book.price}</td>
                    <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#f59e0b', fontWeight: 700, whiteSpace: 'nowrap' }}>★ {book.rating}</td>
                    <td style={{ padding: '12px 16px' }}>
                      {book.hasAudio
                        ? <Headphones size={16} style={{ color: '#10b981' }} />
                        : <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>—</span>
                      }
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <Link href={`/admin/books/${book.id}/edit`} title="Tahrirlash" style={{ color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                          <Edit3 size={16} />
                        </Link>
                        <button
                          onClick={() => handleDelete(book.id, book.title)}
                          title="O'chirish"
                          disabled={deleting === book.id}
                          style={{ color: '#f87171', background: 'none', border: 'none', cursor: deleting === book.id ? 'not-allowed' : 'pointer', display: 'flex', opacity: deleting === book.id ? 0.5 : 1 }}
                        >
                          {deleting === book.id
                            ? <span style={{ width: '16px', height: '16px', border: '2px solid rgba(248,113,113,0.3)', borderTopColor: '#f87171', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                            : <Trash2 size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards — shown only on small screens */}
          <div className="mobile-cards" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filtered.map(book => (
              <div key={book.id} style={{
                background: 'var(--card-bg)', border: '1px solid var(--card-border)',
                borderRadius: '14px', padding: '12px', display: 'flex', gap: '12px', alignItems: 'flex-start'
              }}>
                {/* Rasm */}
                <div style={{ width: '52px', height: '70px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: 'var(--border-color)' }}>
                  <img src={book.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.title}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '6px' }}>{book.author}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 7px', background: 'rgba(155,109,255,0.12)', color: 'var(--accent-purple)', borderRadius: '99px' }}>
                      {book.category}
                    </span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-blue)' }}>{book.price}</span>
                    <span style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 700 }}>★ {book.rating}</span>
                    {book.hasAudio && <Headphones size={14} style={{ color: '#10b981' }} />}
                  </div>
                </div>
                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                  <Link href={`/admin/books/${book.id}/edit`} style={{
                    width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(79,142,247,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue)', textDecoration: 'none'
                  }}>
                    <Edit3 size={15} />
                  </Link>
                  <button
                    onClick={() => handleDelete(book.id, book.title)}
                    disabled={deleting === book.id}
                    style={{
                      width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(248,113,113,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171',
                      border: 'none', cursor: deleting === book.id ? 'not-allowed' : 'pointer', opacity: deleting === book.id ? 0.5 : 1
                    }}
                  >
                    {deleting === book.id
                      ? <span style={{ width: '14px', height: '14px', border: '2px solid rgba(248,113,113,0.3)', borderTopColor: '#f87171', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                      : <Trash2 size={15} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Responsive styles */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .desktop-table { display: block; }
        .mobile-cards { display: none; }
        @media (max-width: 640px) {
          .desktop-table { display: none; }
          .mobile-cards { display: flex; }
        }
      `}</style>
    </div>
  );
}
