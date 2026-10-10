"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Users, Star, TrendingUp, PlusCircle, ArrowRight, Eye, Clock, Flame } from 'lucide-react';
import { api, Book } from '../lib/api';

export default function AdminDashboard() {
  const [statsData, setStatsData] = useState<any>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    
    Promise.all([
      fetch('http://' + host + ':8000/api/admin/stats/').then(res => res.json()),
      api.getBooks()
    ]).then(([stats, booksData]) => {
      setStatsData(stats);
      setBooks(booksData || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const totalBooks = statsData?.total_books || 0;
  const avgRating = statsData?.avg_rating || '0.0';
  const totalUsers = statsData?.total_users || 0;
  const totalReviews = statsData?.total_reviews || 0;

  const stats = [
    { label: 'Jami kitoblar', value: totalBooks, icon: <BookOpen size={22} />, color: 'var(--theme-color, var(--accent-blue))', bg: 'var(--theme-hover)' },
    { label: "Foydalanuvchilar", value: totalUsers, icon: <Users size={22} />, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    { label: "O'rtacha reyting", value: avgRating, icon: <Star size={22} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    { label: 'Fikr va mulohazalar', value: totalReviews, icon: <TrendingUp size={22} />, color: '#9b6dff', bg: 'rgba(155,109,255,0.1)' },
  ];

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.4rem' }}>Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Kitoblar platformasini boshqaring</p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            background: 'var(--card-bg)', border: '1px solid var(--card-border)',
            borderRadius: '16px', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem',
            backdropFilter: 'blur(8px)'
          }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                {loading ? '—' : s.value}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <Link href="/admin/books/add" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--theme-color, var(--accent-blue))',
          borderRadius: '16px', padding: '1.5rem', textDecoration: 'none', color: '#fff',
          transition: 'transform 0.2s, box-shadow 0.2s',
          boxShadow: '0 4px 20px var(--theme-hover, rgba(79,142,247,0.3))'
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '4px' }}>Kitob qo&apos;shish</div>
            <div style={{ fontSize: '0.82rem', opacity: 0.8 }}>Yangi kitobni katalogga qo&apos;shing</div>
          </div>
          <PlusCircle size={28} />
        </Link>
        <Link href="/admin/books" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--card-bg)', border: '1px solid var(--card-border)',
          borderRadius: '16px', padding: '1.5rem', textDecoration: 'none', color: 'var(--text-primary)',
          backdropFilter: 'blur(8px)'
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '4px' }}>Kitoblar ro&apos;yxati</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Barcha kitoblarni ko&apos;rish va tahrirlash</div>
          </div>
          <Eye size={28} style={{ color: 'var(--text-secondary)' }} />
        </Link>
      </div>

      {/* Recent Books */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '16px', padding: '1.5rem', backdropFilter: 'blur(8px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
            <Clock size={18} style={{ verticalAlign: 'middle', marginRight: '8px', color: 'var(--theme-color, var(--accent-blue))' }} />
            Oxirgi kitoblar
          </h2>
          <Link href="/admin/books" style={{ fontSize: '0.85rem', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
            Barchasini ko&apos;rish <ArrowRight size={16} />
          </Link>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {loading ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Yuklanmoqda...</p>
          ) : books.slice(0, 5).map(book => (
            <div key={book.id} style={{
              display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem',
              background: 'var(--search-bg)', borderRadius: '10px', border: '1px solid var(--border-color)'
            }}>
              <div style={{ width: '40px', height: '54px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0, background: 'var(--border-color)' }}>
                <img src={book.image} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.title}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{book.author} · {book.category}</div>
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                ★ {book.rating}
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-blue)', whiteSpace: 'nowrap' }}>{book.price}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
