"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Users, Star, TrendingUp, PlusCircle, ArrowRight, Eye, Clock, Flame, CreditCard, ShoppingBag, Receipt, ExternalLink } from 'lucide-react';
import { api, Book, getApiBaseUrl, getStaticBookCover } from '../lib/api';
import { formatUzbekDateTime } from '../lib/date';

export default function AdminDashboard() {
  const [statsData, setStatsData] = useState<any>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersStats, setOrdersStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${getApiBaseUrl()}/admin/stats/`).then(res => res.json()).catch(() => null),
      api.getBooks().catch(() => []),
      fetch('/api/orders').then(res => res.json()).catch(() => null)
    ]).then(([stats, booksData, ordersRes]) => {
      if (stats) setStatsData(stats);
      setBooks(booksData || []);
      if (ordersRes?.orders) {
        setOrders(ordersRes.orders);
        setOrdersStats(ordersRes.stats);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const totalBooks = statsData?.total_books || 0;
  const avgRating = statsData?.avg_rating || '0.0';
  const totalUsers = statsData?.total_users || 0;
  const totalReviews = statsData?.total_reviews || 0;
  const totalRevenue = ordersStats?.totalRevenue || 0;
  const totalOrders = ordersStats?.totalOrders || orders.length;

  const stats = [
    { label: "To'lovlar tushumi", value: `${totalRevenue.toLocaleString('uz-UZ')} so'm`, icon: <CreditCard size={22} />, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    { label: "Xaridlar soni", value: totalOrders, icon: <ShoppingBag size={22} />, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    { label: 'Jami kitoblar', value: totalBooks, icon: <BookOpen size={22} />, color: 'var(--theme-color, var(--accent-blue))', bg: 'var(--theme-hover)' },
    { label: "Foydalanuvchilar", value: totalUsers, icon: <Users size={22} />, color: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
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
        <Link href="/admin/orders" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #059669, #10b981)',
          borderRadius: '16px', padding: '1.5rem', textDecoration: 'none', color: '#fff',
          transition: 'transform 0.2s, box-shadow 0.2s',
          boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)'
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '4px' }}>To&apos;lovlar va Buyurtmalar</div>
            <div style={{ fontSize: '0.82rem', opacity: 0.9 }}>Kim to&apos;ladi, nima uchun va manzillar</div>
          </div>
          <Receipt size={28} />
        </Link>
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

      {/* Grid: Recent Orders and Recent Books */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {/* Recent Orders / Payments */}
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '16px', padding: '1.5rem', backdropFilter: 'blur(8px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              <Receipt size={18} style={{ verticalAlign: 'middle', marginRight: '8px', color: '#10b981' }} />
              Oxirgi to&apos;lovlar va xaridlar
            </h2>
            <Link href="/admin/orders" style={{ fontSize: '0.85rem', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontWeight: 600 }}>
              Barchasini ko&apos;rish <ArrowRight size={16} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {loading ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Yuklanmoqda...</p>
            ) : orders.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic' }}>Hozircha to&apos;lovlar mavjud emas</p>
            ) : orders.slice(0, 5).map(order => (
              <div key={order.id} style={{
                display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.75rem',
                background: 'var(--search-bg)', borderRadius: '10px', border: '1px solid var(--border-color)'
              }}>
                {(() => {
                  const staticCov = getStaticBookCover(order.bookId, order.bookTitle);
                  const liveBook = books.find(b => String(b.id) === String(order.bookId));
                  const displayImg = staticCov 
                    || (liveBook?.image && !liveBook.image.includes('unsplash.com/photo-1544947950') && !liveBook.image.includes('onrender.com/media/book_covers/') ? liveBook.image : null)
                    || (order.bookImage && !order.bookImage.includes('unsplash.com/photo-1544947950') && !order.bookImage.includes('onrender.com/media/book_covers/') ? order.bookImage : null)
                    || liveBook?.image
                    || order.bookImage
                    || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=120&auto=format&fit=crop';
                  return (
                    <img
                      src={displayImg}
                      alt={order.bookTitle}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        const fallback = getStaticBookCover(order.bookId, order.bookTitle) || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=120&auto=format&fit=crop';
                        if (target.src !== fallback && !target.src.endsWith(fallback)) {
                          target.src = fallback;
                        }
                      }}
                      style={{ width: '38px', height: '52px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }}
                    />
                  );
                })()}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {order.userName}
                    </span>
                    <span style={{
                      fontSize: '0.65rem', fontWeight: 700, padding: '1px 5px', borderRadius: '4px',
                      background: order.format === 'paper' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                      color: order.format === 'paper' ? '#f59e0b' : '#a855f7'
                    }}>
                      {order.format === 'paper' ? "Qog'oz" : "Elektron"}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {order.bookTitle}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#10b981' }}>
                    {Number(order.price).toLocaleString('uz-UZ')}{" "}so&apos;m
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    {order.paymentMethod}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Books */}
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '16px', padding: '1.5rem', backdropFilter: 'blur(8px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              <Clock size={18} style={{ verticalAlign: 'middle', marginRight: '8px', color: 'var(--theme-color, var(--accent-blue))' }} />
              Oxirgi kitoblar
            </h2>
            <Link href="/admin/books" style={{ fontSize: '0.85rem', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontWeight: 600 }}>
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
                <div style={{ width: '38px', height: '52px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0, background: 'var(--border-color)' }}>
                  <img src={book.image} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.title}</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>{book.author} · {book.category}</div>
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  ★ {book.rating}
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-blue)', whiteSpace: 'nowrap' }}>{book.price}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
