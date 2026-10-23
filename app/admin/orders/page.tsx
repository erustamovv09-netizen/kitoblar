"use client";

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  CreditCard, ShoppingBag, BookOpen, Smartphone, Package, 
  Truck, Calendar, Clock, Search, Filter, CheckCircle2, 
  AlertCircle, Phone, Mail, ExternalLink, Printer, Trash2, 
  RefreshCw, Send, Eye, X, ChevronDown, User, MapPin, Copy, Check 
} from 'lucide-react';
import { formatUzbekDateTime } from '../../lib/date';
import { api, Book, getStaticBookCover } from '../../lib/api';

interface OrderItem {
  id: string;
  receiptNumber: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  bookImage?: string;
  format: 'electronic' | 'paper';
  formatLabel: string;
  purpose: string;
  price: number;
  originalPrice?: number;
  paymentMethod: 'payme' | 'click' | 'uzum' | 'card';
  userName: string;
  userEmail?: string;
  userPhone: string;
  senderCardLast4?: string;
  receiptImage?: string;
  deliveryAddress?: string | null;
  region?: string | null;
  status: 'pending' | 'completed' | 'processing' | 'delivered' | 'cancelled';
  statusLabel?: string;
  createdAt: string;
  notes?: string;
}

interface StatsData {
  totalOrders: number;
  totalRevenue: number;
  pendingCount?: number;
  electronicCount: number;
  paperCount: number;
  completedCount: number;
  processingCount: number;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [formatFilter, setFormatFilter] = useState<'all' | 'electronic' | 'paper'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [copiedReceipt, setCopiedReceipt] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState('');

  const [books, setBooks] = useState<Book[]>([]);

  // Fetch orders and catalog books
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const [res, catalogBooks] = await Promise.all([
        fetch('/api/orders').then(r => r.json()).catch(() => null),
        api.getBooks().catch(() => [])
      ]);
      if (res?.orders) {
        setOrders(res.orders || []);
        setStats(res.stats || null);
      }
      if (catalogBooks) {
        setBooks(catalogBooks);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getOrderImage = (order: OrderItem) => {
    // 1. Static authentic cover for known books
    const staticCov = getStaticBookCover(order.bookId, order.bookTitle);
    if (staticCov) {
      return staticCov;
    }
    // 2. Catalog book
    const liveBook = books.find(b => String(b.id) === String(order.bookId));
    if (liveBook?.image && !liveBook.image.includes('unsplash.com/photo-1544947950') && !liveBook.image.includes('onrender.com/media/book_covers/')) {
      return liveBook.image;
    }
    // 3. Stored book image in order
    if (order.bookImage && !order.bookImage.includes('unsplash.com/photo-1544947950') && !order.bookImage.includes('onrender.com/media/book_covers/')) {
      return order.bookImage;
    }
    return liveBook?.image || order.bookImage || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop';
  };

  // Update order status
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(prev => prev.map(o => o.id === orderId ? data.order : o));
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(data.order);
        }
        setActionSuccess("Buyurtma holati yangilandi!");
        setTimeout(() => setActionSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // Delete order
  const handleDeleteOrder = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders?id=${orderId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setOrders(prev => prev.filter(o => o.id !== orderId));
        setDeleteConfirmId(null);
        if (selectedOrder?.id === orderId) setSelectedOrder(null);
        setActionSuccess("Buyurtma o'chirildi!");
        setTimeout(() => setActionSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Failed to delete order:', err);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedReceipt(id);
    setTimeout(() => setCopiedReceipt(null), 2000);
  };

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesSearch = 
        (o.userName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.userPhone || '').includes(searchQuery) ||
        (o.bookTitle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.receiptNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.deliveryAddress || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFormat = formatFilter === 'all' || o.format === formatFilter;
      const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
      const matchesPayment = paymentFilter === 'all' || o.paymentMethod === paymentFilter;

      return matchesSearch && matchesFormat && matchesStatus && matchesPayment;
    });
  }, [orders, searchQuery, formatFilter, statusFilter, paymentFilter]);

  // Derived metrics
  const totalRev = stats?.totalRevenue ?? orders.reduce((s, o) => s + (o.status !== 'cancelled' ? o.price : 0), 0);
  const totalCount = stats?.totalOrders ?? orders.length;
  const electronicCount = stats?.electronicCount ?? orders.filter(o => o.format === 'electronic').length;
  const paperCount = stats?.paperCount ?? orders.filter(o => o.format === 'paper').length;

  return (
    <div style={{ paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>To&apos;lovlar va Buyurtmalar</h1>
            <span style={{
              background: 'rgba(16, 185, 129, 0.15)', color: '#10b981',
              padding: '3px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: '5px', border: '1px solid rgba(16, 185, 129, 0.25)'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
              Telegram xabarnomasi faol
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Kim, qaysi kitobga, qanday formatda va nima uchun to&apos;lov qilganini kuzatib boring
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={fetchOrders}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px',
              borderRadius: '12px', background: 'var(--card-bg)', border: '1px solid var(--card-border)',
              color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600,
              transition: 'all 0.2s', fontFamily: 'inherit'
            }}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            Yangilash
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div style={{
          marginBottom: '1.5rem', padding: '12px 18px', borderRadius: '12px',
          background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#34d399', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <CheckCircle2 size={18} />
          {actionSuccess}
        </div>
      )}

      {/* KPI Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.05))',
          border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '16px', padding: '1.5rem',
          display: 'flex', alignItems: 'center', gap: '1rem', backdropFilter: 'blur(8px)'
        }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CreditCard size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
              {totalRev.toLocaleString('uz-UZ')} <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#10b981' }}>so&apos;m</span>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '5px' }}>Jami to&apos;lovlar tushumi</div>
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.05))',
          border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: '16px', padding: '1.5rem',
          display: 'flex', alignItems: 'center', gap: '1rem', backdropFilter: 'blur(8px)'
        }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShoppingBag size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
              {totalCount} <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#3b82f6' }}>ta</span>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '5px' }}>Jami xaridlar soni</div>
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(147, 51, 234, 0.05))',
          border: '1px solid rgba(168, 85, 247, 0.25)', borderRadius: '16px', padding: '1.5rem',
          display: 'flex', alignItems: 'center', gap: '1rem', backdropFilter: 'blur(8px)'
        }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.2)', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Smartphone size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
              {electronicCount} <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#a855f7' }}>ta</span>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '5px' }}>Elektron (Mutolaa & Audio)</div>
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.05))',
          border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '16px', padding: '1.5rem',
          display: 'flex', alignItems: 'center', gap: '1rem', backdropFilter: 'blur(8px)'
        }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
              {paperCount} <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f59e0b' }}>ta</span>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '5px' }}>Qog&apos;oz kitob (Yetkazish)</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '16px',
        padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center',
        backdropFilter: 'blur(8px)'
      }}>
        {/* Search Input */}
        <div style={{ position: 'relative', flex: '1 1 280px', minWidth: '240px' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Mijoz ismi, telefon, kitob nomi yoki chek..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '11px 14px 11px 42px', borderRadius: '10px',
              background: 'var(--search-bg)', border: '1px solid var(--search-border)',
              color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'inherit'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px'
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Format Filter */}
        <div style={{ display: 'flex', gap: '6px', background: 'var(--search-bg)', padding: '4px', borderRadius: '10px', border: '1px solid var(--search-border)' }}>
          {[
            { id: 'all', label: 'Barchasi' },
            { id: 'electronic', label: '📱 Elektron' },
            { id: 'paper', label: "📦 Qog'oz" },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFormatFilter(f.id as any)}
              style={{
                padding: '7px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                fontSize: '0.82rem', fontWeight: 600, fontFamily: 'inherit',
                background: formatFilter === f.id ? 'var(--theme-color, var(--accent-blue))' : 'transparent',
                color: formatFilter === f.id ? '#fff' : 'var(--text-secondary)',
                transition: 'all 0.2s'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{
            padding: '10px 14px', borderRadius: '10px', background: 'var(--search-bg)',
            border: '1px solid var(--search-border)', color: 'var(--text-primary)',
            fontSize: '0.88rem', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer'
          }}
        >
          <option value="all">Barcha holatlar</option>
          <option value="pending">⏳ To&apos;lov kutilmoqda (Tasdiqlash)</option>
          <option value="completed">✅ To&apos;langan (Faol)</option>
          <option value="processing">🚚 Yetkazilmoqda (Kuryerda)</option>
          <option value="delivered">📦 Yetkazib berildi</option>
          <option value="cancelled">❌ Bekor qilingan</option>
        </select>

        {/* Payment Filter */}
        <select
          value={paymentFilter}
          onChange={e => setPaymentFilter(e.target.value)}
          style={{
            padding: '10px 14px', borderRadius: '10px', background: 'var(--search-bg)',
            border: '1px solid var(--search-border)', color: 'var(--text-primary)',
            fontSize: '0.88rem', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer'
          }}
        >
          <option value="all">Barcha to&apos;lov turlari</option>
          <option value="payme">Payme</option>
          <option value="click">Click</option>
          <option value="uzum">Uzum Bank</option>
          <option value="card">Plastik karta</option>
        </select>

        {(searchQuery || formatFilter !== 'all' || statusFilter !== 'all' || paymentFilter !== 'all') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setFormatFilter('all');
              setStatusFilter('all');
              setPaymentFilter('all');
            }}
            style={{
              padding: '8px 12px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', fontSize: '0.82rem',
              fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
            }}
          >
            Filtrni tozalash
          </button>
        )}
      </div>

      {/* Orders List Table */}
      {filteredOrders.length === 0 ? (
        <div style={{
          background: 'var(--card-bg)', border: '1px solid var(--card-border)',
          borderRadius: '16px', padding: '3.5rem 1.5rem', textAlign: 'center', backdropFilter: 'blur(8px)'
        }}>
          <ShoppingBag size={48} style={{ color: 'var(--text-secondary)', opacity: 0.5, marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            {orders.length === 0 ? "Hozircha yangi to'lovlar yo'q" : "Qidiruv bo'yicha to'lov topilmadi"}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '480px', margin: '0 auto', lineHeight: 1.6 }}>
            {orders.length === 0 
              ? "Foydalanuvchilar saytdagi kitoblarga (Elektron mutolaa yoki Qog'oz bosma nusxasi) to'lov qilishi bilanoq, ularning haqiqiy ismlari, telefon raqamlari, buyurtma qilgan kitobi va to'lov cheki darhol bu yerda aks etadi hamda Telegram botingizga xabar boradi."
              : "Qidiruv mezonlarini o'zgartirib yoki tozalab ko'ring."}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredOrders.map(order => {
            const isPaper = order.format === 'paper';
            return (
              <div
                key={order.id}
                style={{
                  background: 'var(--card-bg)', border: '1px solid var(--card-border)',
                  borderRadius: '16px', padding: '1.25rem 1.5rem', backdropFilter: 'blur(8px)',
                  transition: 'border-color 0.2s', position: 'relative'
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', alignItems: 'center' }}>
                  {/* Left Column: Book & Customer */}
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <img
                      src={getOrderImage(order)}
                      alt={order.bookTitle}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        const fallback = getStaticBookCover(order.bookId, order.bookTitle) || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=200&auto=format&fit=crop';
                        if (target.src !== fallback && !target.src.endsWith(fallback)) {
                          target.src = fallback;
                        }
                      }}
                      style={{
                        width: '56px', height: '80px', objectFit: 'cover', borderRadius: '8px',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.3)', flexShrink: 0
                      }}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{
                          fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px',
                          background: isPaper ? 'rgba(245, 158, 11, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                          color: isPaper ? '#f59e0b' : '#a855f7',
                          border: `1px solid ${isPaper ? 'rgba(245, 158, 11, 0.3)' : 'rgba(168, 85, 247, 0.3)'}`
                        }}>
                          {isPaper ? "📦 Qog'oz format (Bosma)" : "📱 Elektron kitob"}
                        </span>
                        <button
                          onClick={() => copyToClipboard(order.receiptNumber, order.id)}
                          title="Chek raqamidan nusxa olish"
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: copiedReceipt === order.id ? '#10b981' : 'var(--text-secondary)',
                            display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontFamily: 'inherit'
                          }}
                        >
                          {copiedReceipt === order.id ? <Check size={12} /> : <Copy size={12} />}
                          <code>{order.receiptNumber}</code>
                        </button>
                      </div>

                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '2px 0 4px 0', color: 'var(--text-primary)' }}>
                        <Link href={`/book/${order.bookId}`} target="_blank" style={{ color: 'inherit', textDecoration: 'none' }}>
                          {order.bookTitle} <ExternalLink size={13} style={{ display: 'inline', opacity: 0.6 }} />
                        </Link>
                      </h3>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        Muallif: <span style={{ color: 'var(--text-primary)' }}>{order.bookAuthor}</span>
                      </p>

                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', fontSize: '0.82rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-primary)', fontWeight: 600 }}>
                          <User size={13} style={{ color: 'var(--accent-blue)' }} /> {order.userName}
                        </span>
                        <a
                          href={`tel:${order.userPhone}`}
                          style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#10b981', textDecoration: 'none', fontWeight: 600 }}
                        >
                          <Phone size={13} /> {order.userPhone}
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Middle Column: Purpose and Delivery */}
                  <div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                      To&apos;lov maqsadi (Sababi):
                    </div>
                    <p style={{
                      fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.45,
                      background: 'var(--search-bg)', padding: '8px 12px', borderRadius: '8px',
                      border: '1px solid var(--search-border)', marginBottom: isPaper ? '8px' : '0'
                    }}>
                      {order.purpose}
                    </p>

                    {isPaper && order.deliveryAddress && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '0.82rem', color: '#f59e0b', marginTop: '6px' }}>
                        <MapPin size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span><strong>Yetkazish manzili:</strong> {order.deliveryAddress}</span>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Amount, Status & Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#10b981' }}>
                        {order.price.toLocaleString('uz-UZ')}{" "}so&apos;m
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', marginTop: '2px' }}>
                        <span style={{
                          fontSize: '0.7rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px',
                          background: 'rgba(255,255,255,0.08)', textTransform: 'uppercase', letterSpacing: '0.5px'
                        }}>
                          {order.paymentMethod}
                        </span>
                        {order.senderCardLast4 && (
                          <span style={{
                            fontSize: '0.7rem', fontWeight: 800, padding: '1px 6px', borderRadius: '4px',
                            background: 'rgba(16, 185, 129, 0.15)', color: '#10b981'
                          }}>
                            *{order.senderCardLast4}
                          </span>
                        )}
                        {order.receiptImage && (
                          <span style={{
                            fontSize: '0.7rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px',
                            background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6'
                          }}>
                            📸 Chek
                          </span>
                        )}
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {formatUzbekDateTime(order.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Status selector */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {order.status === 'pending' && (
                        <button
                          onClick={() => handleStatusChange(order.id, 'completed')}
                          title="To'lov kelganini tasdiqlash va kitobni ochish"
                          style={{
                            padding: '6px 12px', borderRadius: '8px', background: '#10b981',
                            border: 'none', color: '#fff', cursor: 'pointer',
                            fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px',
                            boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)', fontFamily: 'inherit'
                          }}
                        >
                          <CheckCircle2 size={14} /> To&apos;lovni tasdiqlash
                        </button>
                      )}

                      <select
                        value={order.status}
                        onChange={e => handleStatusChange(order.id, e.target.value)}
                        style={{
                          padding: '6px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700,
                          fontFamily: 'inherit', cursor: 'pointer', border: '1px solid transparent',
                          background: order.status === 'completed'
                            ? 'rgba(16, 185, 129, 0.15)'
                            : order.status === 'pending'
                            ? 'rgba(234, 179, 8, 0.2)'
                            : order.status === 'processing'
                            ? 'rgba(245, 158, 11, 0.15)'
                            : order.status === 'delivered'
                            ? 'rgba(59, 130, 246, 0.15)'
                            : 'rgba(239, 68, 68, 0.15)',
                          color: order.status === 'completed'
                            ? '#10b981'
                            : order.status === 'pending'
                            ? '#eab308'
                            : order.status === 'processing'
                            ? '#f59e0b'
                            : order.status === 'delivered'
                            ? '#3b82f6'
                            : '#f87171'
                        }}
                      >
                        <option value="pending">⏳ To&apos;lov kutilmoqda</option>
                        <option value="completed">✅ To&apos;langan (Faol)</option>
                        <option value="processing">🚚 Yetkazilmoqda</option>
                        <option value="delivered">📦 Yetkazib berildi</option>
                        <option value="cancelled">❌ Bekor qilindi</option>
                      </select>

                      {/* Detail View Button */}
                      <button
                        onClick={() => setSelectedOrder(order)}
                        title="Batafsil chek va ma'lumotlar"
                        style={{
                          padding: '6px 10px', borderRadius: '8px', background: 'var(--search-bg)',
                          border: '1px solid var(--search-border)', color: 'var(--text-primary)',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
                          fontSize: '0.8rem', fontWeight: 600, fontFamily: 'inherit'
                        }}
                      >
                        <Eye size={14} /> Batafsil
                      </button>

                      {/* Delete button */}
                      <button
                        onClick={() => setDeleteConfirmId(order.id)}
                        title="O'chirish"
                        style={{
                          padding: '6px 8px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171',
                          cursor: 'pointer', display: 'flex', alignItems: 'center'
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detailed Receipt Modal */}
      {selectedOrder && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div style={{
            background: 'var(--card-bg, #121826)',
            border: '1px solid var(--card-border, rgba(255, 255, 255, 0.15))',
            borderRadius: '20px', maxWidth: '540px', width: '100%',
            boxShadow: '0 25px 60px rgba(0,0,0,0.6)', maxHeight: '90vh', overflowY: 'auto',
            padding: '2rem', animation: 'fadeIn 0.2s ease-out'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  KITOBLAR PORTALI • RASMIY CHEK
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '4px 0 0 0' }}>
                  Buyurtma #{selectedOrder.receiptNumber}
                </h2>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{
                  background: 'none', border: 'none', color: 'var(--text-secondary)',
                  cursor: 'pointer', padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Receipt Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Book Info */}
              <div style={{ display: 'flex', gap: '1rem', background: 'var(--search-bg)', padding: '1rem', borderRadius: '12px' }}>
                <img
                  src={getOrderImage(selectedOrder)}
                  alt={selectedOrder.bookTitle}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    const fallback = getStaticBookCover(selectedOrder.bookId, selectedOrder.bookTitle) || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=200&auto=format&fit=crop';
                    if (target.src !== fallback && !target.src.endsWith(fallback)) {
                      target.src = fallback;
                    }
                  }}
                  style={{ width: '60px', height: '85px', objectFit: 'cover', borderRadius: '8px' }}
                />
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '2px' }}>{selectedOrder.bookTitle}</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Muallif: {selectedOrder.bookAuthor}</p>
                  <span style={{
                    fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px',
                    background: selectedOrder.format === 'paper' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(168, 85, 247, 0.2)',
                    color: selectedOrder.format === 'paper' ? '#f59e0b' : '#a855f7'
                  }}>
                    {selectedOrder.formatLabel}
                  </span>
                </div>
              </div>

              {/* Purpose Box */}
              <div style={{
                background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '12px', padding: '12px 16px'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', marginBottom: '4px' }}>
                  To&apos;lov maqsadi (Nima uchun to&apos;landi):
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>
                  {selectedOrder.purpose}
                </p>
              </div>

              {/* Customer Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: 'var(--search-bg)', padding: '10px 14px', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Mijoz F.I.SH</span>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', marginTop: '2px' }}>{selectedOrder.userName}</div>
                </div>
                <div style={{ background: 'var(--search-bg)', padding: '10px 14px', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Telefon raqami</span>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', marginTop: '2px', color: '#10b981' }}>
                    <a href={`tel:${selectedOrder.userPhone}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                      {selectedOrder.userPhone}
                    </a>
                  </div>
                </div>
              </div>

              {selectedOrder.userEmail && (
                <div style={{ background: 'var(--search-bg)', padding: '10px 14px', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Elektron pochta</span>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginTop: '2px' }}>{selectedOrder.userEmail}</div>
                </div>
              )}

              {/* Delivery Address if Paper */}
              {selectedOrder.format === 'paper' && (
                <div style={{
                  background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)',
                  borderRadius: '12px', padding: '12px 16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', marginBottom: '4px' }}>
                    <MapPin size={14} /> Yetkazib berish manzili:
                  </div>
                  <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)', margin: 0, fontWeight: 600 }}>
                    {selectedOrder.deliveryAddress || "Manzil ko'rsatilgan"}
                  </p>
                </div>
              )}

              {/* Payment Info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--border-color)', paddingTop: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>To&apos;lov tizimi:</span>
                  <div style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.95rem' }}>{selectedOrder.paymentMethod}</div>
                  {selectedOrder.senderCardLast4 && (
                    <div style={{ fontSize: '0.82rem', color: '#10b981', fontWeight: 700, marginTop: '2px' }}>
                      Karta: *{selectedOrder.senderCardLast4}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>To&apos;langan summa:</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10b981' }}>
                    {selectedOrder.price.toLocaleString('uz-UZ')}{" "}so&apos;m
                  </div>
                </div>
              </div>

              {selectedOrder.receiptImage && (
                <div style={{
                  background: 'var(--search-bg)', padding: '12px 14px', borderRadius: '12px',
                  border: '1px solid var(--search-border)'
                }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    📸 <span>Xaridor yuklagan to&apos;lov cheki rasmi:</span>
                  </div>
                  <a href={selectedOrder.receiptImage} target="_blank" rel="noopener noreferrer" title="Kattalashtirib ko'rish">
                    <img
                      src={selectedOrder.receiptImage}
                      alt="Chek skrinshoti"
                      style={{ maxHeight: '180px', maxWidth: '100%', objectFit: 'contain', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  </a>
                </div>
              )}

              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                Sana va vaqt: {formatUzbekDateTime(selectedOrder.createdAt)}
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '1.5rem' }}>
              {selectedOrder.status === 'pending' && (
                <button
                  onClick={() => handleStatusChange(selectedOrder.id, 'completed')}
                  style={{
                    width: '100%', padding: '12px', borderRadius: '10px',
                    background: '#10b981', color: '#fff', fontWeight: 800, fontSize: '0.92rem',
                    border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: '8px',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)', fontFamily: 'inherit'
                  }}
                >
                  <CheckCircle2 size={18} /> To&apos;lovni tasdiqlash (Kitobni xaridorga ochish)
                </button>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => window.print()}
                  style={{
                    flex: 1, padding: '11px', borderRadius: '10px', background: 'var(--search-bg)',
                    border: '1px solid var(--search-border)', color: 'var(--text-primary)',
                    fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', gap: '8px', fontFamily: 'inherit'
                  }}
                >
                  <Printer size={16} /> Chekni chop etish
                </button>
                <a
                  href={`tel:${selectedOrder.userPhone}`}
                  style={{
                    flex: 1, padding: '11px', borderRadius: '10px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#fff', fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                  }}
                >
                  <Phone size={16} /> Qo&apos;ng&apos;iroq qilish
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div style={{
            background: 'var(--card-bg, #121826)', border: '1px solid var(--card-border)',
            borderRadius: '20px', padding: '2rem', maxWidth: '380px', width: '100%', textAlign: 'center'
          }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(239, 68, 68, 0.15)',
              color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem'
            }}>
              <Trash2 size={26} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Buyurtmani o&apos;chirish</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Haqiqatan ham bu buyurtma yozuvini tizimdan o&apos;chirmoqchimisiz?
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                onClick={() => setDeleteConfirmId(null)}
                style={{
                  padding: '10px', borderRadius: '10px', background: 'var(--search-bg)',
                  border: '1px solid var(--search-border)', color: 'var(--text-primary)',
                  fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
                }}
              >
                Bekor qilish
              </button>
              <button
                onClick={() => handleDeleteOrder(deleteConfirmId)}
                style={{
                  padding: '10px', borderRadius: '10px', background: '#ef4444',
                  border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit'
                }}
              >
                O&apos;chirish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
