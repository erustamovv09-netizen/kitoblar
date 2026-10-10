"use client";

import { useEffect, useState } from 'react';
import { BookOpen, Star, Users, TrendingUp, BarChart2, MessageSquare, BookMarked, RefreshCw } from 'lucide-react';

interface Stats {
  total_books: number;
  total_reviews: number;
  total_progress: number;
  total_users: number;
  avg_rating: number;
  new_books_week: number;
  categories: { category__name: string; count: number }[];
  top_books: { book__id: number; book__title: string; book__author: string; readers: number }[];
  recent_reviews: { id: number; user_name: string; rating: number; comment: string; created_at: string; book__title: string }[];
}

function StatCard({ label, value, sub, color, icon }: { label: string; value: string | number; sub: string; color: string; icon: React.ReactNode }) {
  return (
    <div style={{ background: `linear-gradient(135deg, ${color}22, ${color}11)`, border: `1px solid ${color}33`, borderRadius: '16px', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color }}>{icon}<span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' as const }}>{label}</span></div>
      <span style={{ fontSize: '2rem', fontWeight: 800 }}>{value}</span>
      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{sub}</span>
    </div>
  );
}

const cardStyle: React.CSSProperties = { background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '16px', padding: '1.5rem', backdropFilter: 'blur(8px)' };

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');

  async function fetchStats() {
    setLoading(true); setError('');
    try {
      const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || `http://${host}:8000/api`;
      const res = await fetch(`${baseUrl}/admin/stats/`);
      if (!res.ok) throw new Error('Server xatosi: ' + res.status);
      setStats(await res.json());
      setLastUpdated(new Date().toLocaleTimeString('uz-UZ'));
    } catch (e: any) {
      setError(e.message || 'Yuklanmadi');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchStats(); }, []);

  const maxCat = stats?.categories.reduce((m, c) => Math.max(m, c.count), 1) || 1;

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BarChart2 size={28} style={{ color: 'var(--accent-blue)' }} /> Analitika
          </h1>
          {lastUpdated && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Yangilangan: {lastUpdated}</p>}
        </div>
        <button onClick={fetchStats} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'var(--search-bg)', border: '1px solid var(--border-color)', borderRadius: '10px', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 600 }}>
          <RefreshCw size={14} /> Yangilash
        </button>
      </div>

      {error && <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', color: '#f87171', marginBottom: '1.5rem' }}>⚠️ {error}</div>}

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-secondary)', padding: '2rem' }}>
          <div style={{ width: '24px', height: '24px', border: '2px solid var(--border-color)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          Yuklanmoqda...
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {stats && !loading && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <StatCard label="Kitoblar" value={stats.total_books} sub={'+' + stats.new_books_week + ' bu hafta'} color="#4f8ef7" icon={<BookOpen size={18} />} />
            <StatCard label="Foydalanuvchilar" value={stats.total_users} sub="Jami royxatdan" color="#a78bfa" icon={<Users size={18} />} />
            <StatCard label="Ort. reyting" value={stats.avg_rating.toFixed(1)} sub="5 dan" color="#f59e0b" icon={<Star size={18} />} />
            <StatCard label="Oqish jarayoni" value={stats.total_progress} sub="Saqlangan" color="#10b981" icon={<BookMarked size={18} />} />
            <StatCard label="Sharhlar" value={stats.total_reviews} sub="Jami" color="#f87171" icon={<MessageSquare size={18} />} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={cardStyle}>
              <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={16} style={{ color: 'var(--theme-color, var(--accent-blue))' }} /> Kategoriyalar
              </h3>
              {stats.categories.length === 0
                ? <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Malumot yoq</p>
                : stats.categories.map((cat, i) => (
                  <div key={i} style={{ marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{cat.category__name || 'Nomalum'}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{cat.count} ta</span>
                    </div>
                    <div style={{ height: '6px', borderRadius: '99px', background: 'var(--search-bg)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: '99px', width: (cat.count / maxCat * 100) + '%', background: 'var(--theme-color, var(--accent-blue))' }} />
                    </div>
                  </div>
                ))}
            </div>

            <div style={cardStyle}>
              <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={16} style={{ color: 'var(--accent-purple)' }} /> Eng kop oqilgan
              </h3>
              {stats.top_books.length === 0
                ? <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Hali hech kim oqimagan</p>
                : stats.top_books.map((b, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', borderBottom: i < stats.top_books.length - 1 ? '1px solid var(--card-border)' : 'none' }}>
                    <span style={{ width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem', flexShrink: 0, background: i === 0 ? 'rgba(251,191,36,0.15)' : 'rgba(156,163,175,0.1)', color: i === 0 ? '#fbbf24' : 'var(--text-secondary)' }}>{i + 1}</span>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <p style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.book__title}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{b.book__author}</p>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 700, flexShrink: 0 }}>{b.readers} oq.</span>
                  </div>
                ))}
            </div>
          </div>

          <div style={cardStyle}>
            <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={16} style={{ color: '#f59e0b' }} /> Songgi sharhlar
            </h3>
            {stats.recent_reviews.length === 0
              ? <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Hali sharh yoq</p>
              : <div style={{ display: 'grid', gap: '0.75rem' }}>
                {stats.recent_reviews.map((r) => (
                  <div key={r.id} style={{ padding: '1rem', background: 'var(--search-bg)', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', flexWrap: 'wrap', gap: '4px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{r.user_name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{r.book__title}</span>
                        <span style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 700 }}>★ {r.rating}</span>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {r.comment.length > 120 ? r.comment.slice(0, 120) + '...' : r.comment}
                    </p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px', opacity: 0.6 }}>
                      {new Date(r.created_at).toLocaleDateString('uz-UZ')}
                    </p>
                  </div>
                ))}
              </div>}
          </div>
        </>
      )}
    </div>
  );
}
