"use client";

import { useEffect, useState, useMemo } from 'react';
import { 
  Users, Search, RefreshCw, UserCheck, UserX, Mail, 
  Calendar, Filter, Clock, Activity, ArrowUpDown, ChevronDown,
  BookOpen, X, BookMarked, Timer, ChevronRight
} from 'lucide-react';

interface UserItem {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  date_joined: string;
  last_login?: string | null;
  is_active: boolean;
}

interface UserProgressItem {
  id: number;
  user_id: string;
  book__id: number;
  book__title: string;
  book__author: string;
  book__cover_image?: string;
  chapter: string;
  chapter_index: number;
  progress_percent: number;
  updated_at: string;
}

type TimeFilter = 'all' | 'today' | 'this_week' | 'this_month' | 'last_month' | 'last_30_days' | 'last_3_months';
type StatusFilter = 'all' | 'active' | 'inactive' | 'recently_active';
type SortOption = 'newest' | 'oldest' | 'username' | 'last_login';

const cardStyle: React.CSSProperties = { 
  background: 'var(--card-bg)', 
  border: '1px solid var(--card-border)', 
  borderRadius: '16px', 
  padding: '1.5rem', 
  backdropFilter: 'blur(8px)' 
};

function getCoverUrl(coverPath?: string) {
  if (!coverPath) return 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=300&auto=format&fit=crop';
  if (coverPath.startsWith('http://') || coverPath.startsWith('https://')) return coverPath;
  const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || `http://${host}:8000`;
  const cleanPath = coverPath.startsWith('/') ? coverPath : `/${coverPath}`;
  if (cleanPath.startsWith('/media/')) return `${backendBase}${cleanPath}`;
  return `${backendBase}/media/${coverPath}`;
}

function formatReadingTime(percent: number, username: string, bookId: number) {
  let recordedSecs = 0;
  if (typeof window !== 'undefined') {
    try {
      const key = `user_reading_time_${username}_${bookId}`;
      recordedSecs = Number(localStorage.getItem(key) || 0);
    } catch {}
  }
  if (recordedSecs && recordedSecs >= 60) {
    const mins = Math.round(recordedSecs / 60);
    if (mins < 60) return `${mins} daqiqa`;
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return rem > 0 ? `${hrs} soat ${rem} daqiqa` : `${hrs} soat`;
  }
  // Estimated reading time based on progress
  const estMins = Math.max(8, Math.round((percent / 100) * 110));
  if (estMins < 60) return `${estMins} daqiqa`;
  const hrs = Math.floor(estMins / 60);
  const rem = estMins % 60;
  return rem > 0 ? `${hrs} soat ${rem} daqiqa` : `${hrs} soat`;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [userProgressList, setUserProgressList] = useState<UserProgressItem[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');

  // Filters
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  async function fetchUsers() {
    setLoading(true); 
    setError('');
    try {
      const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || `http://${host}:8000/api`;
      const res = await fetch(`${baseUrl}/admin/stats/`);
      if (!res.ok) throw new Error('Server xatosi: ' + res.status);
      const data = await res.json();
      setUsers(data.recent_users || []);
      setUserProgressList(data.user_progress || []);
      setLastUpdated(new Date().toLocaleTimeString('uz-UZ'));
    } catch (e: any) {
      setError(e.message || 'Yuklanmadi');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { 
    fetchUsers(); 
  }, []);

  // Filter & Sort Logic
  const filteredUsers = useMemo(() => {
    const now = new Date();

    return users.filter(u => {
      // 1. Search Query
      const q = search.toLowerCase();
      const matchesSearch = 
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.first_name + ' ' + u.last_name).toLowerCase().includes(q);
      if (!matchesSearch) return false;

      // 2. Status Filter
      if (statusFilter === 'active' && !u.is_active) return false;
      if (statusFilter === 'inactive' && u.is_active) return false;
      if (statusFilter === 'recently_active') {
        if (!u.last_login) return false;
        const lastLoginDate = new Date(u.last_login);
        const daysAgo = (now.getTime() - lastLoginDate.getTime()) / (1000 * 3600 * 24);
        if (daysAgo > 7) return false;
      }

      // 3. Time Filter (Ro'yxatdan o'tgan sanasi bo'yicha)
      if (timeFilter === 'all') return true;

      const joinedDate = new Date(u.date_joined);

      if (timeFilter === 'today') {
        return (
          joinedDate.getDate() === now.getDate() &&
          joinedDate.getMonth() === now.getMonth() &&
          joinedDate.getFullYear() === now.getFullYear()
        );
      }

      if (timeFilter === 'this_week') {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        return joinedDate >= startOfWeek;
      }

      if (timeFilter === 'this_month') {
        return (
          joinedDate.getMonth() === now.getMonth() &&
          joinedDate.getFullYear() === now.getFullYear()
        );
      }

      if (timeFilter === 'last_month') {
        const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        return (
          joinedDate.getMonth() === lastMonth &&
          joinedDate.getFullYear() === lastMonthYear
        );
      }

      if (timeFilter === 'last_30_days') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return joinedDate >= thirtyDaysAgo;
      }

      if (timeFilter === 'last_3_months') {
        const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        return joinedDate >= ninetyDaysAgo;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.date_joined).getTime() - new Date(a.date_joined).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.date_joined).getTime() - new Date(b.date_joined).getTime();
      }
      if (sortBy === 'username') {
        return a.username.localeCompare(b.username);
      }
      if (sortBy === 'last_login') {
        const timeA = a.last_login ? new Date(a.last_login).getTime() : 0;
        const timeB = b.last_login ? new Date(b.last_login).getTime() : 0;
        return timeB - timeA;
      }
      return 0;
    });
  }, [users, search, timeFilter, statusFilter, sortBy]);

  // Overall statistics
  const totalCount = users.length;
  const activeCount = users.filter(u => u.is_active).length;
  const inactiveCount = totalCount - activeCount;

  // Selected period statistics
  const filteredActive = filteredUsers.filter(u => u.is_active).length;
  const filteredInactive = filteredUsers.length - filteredActive;

  return (
    <div style={{ padding: '2rem', maxWidth: '1080px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={28} style={{ color: 'var(--theme-color, var(--accent-blue))' }} /> Foydalanuvchilar
          </h1>
          {lastUpdated && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Yangilangan: {lastUpdated}</p>}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            onClick={fetchUsers} 
            style={{ 
              display: 'inline-flex', alignItems: 'center', gap: '6px', 
              padding: '9px 16px', background: 'var(--search-bg)', 
              border: '1px solid var(--border-color)', borderRadius: '10px', 
              color: 'var(--text-secondary)', cursor: 'pointer', 
              fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 600,
              transition: 'all 0.2s'
            }}
          >
            <RefreshCw size={14} /> Yangilash
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'var(--theme-hover, rgba(79, 142, 247, 0.08))', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Jami foydalanuvchilar</span>
            <Users size={18} style={{ color: 'var(--theme-color, var(--accent-blue))' }} />
          </div>
          <span style={{ fontSize: '2rem', fontWeight: 800 }}>{totalCount}</span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Tanlangan filtrda: <b style={{ color: 'var(--text-primary)' }}>{filteredUsers.length} ta</b>
          </span>
        </div>

        <div style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(16, 185, 129, 0.04))', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#10b981' }}>Faol foydalanuvchilar</span>
            <UserCheck size={18} style={{ color: '#10b981' }} />
          </div>
          <span style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981' }}>{activeCount}</span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Filtrda: <b style={{ color: '#10b981' }}>{filteredActive} ta</b> ({totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0}%)
          </span>
        </div>

        <div style={{ background: 'linear-gradient(135deg, rgba(248, 113, 113, 0.12), rgba(248, 113, 113, 0.04))', border: '1px solid rgba(248, 113, 113, 0.25)', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#f87171' }}>Nofaol foydalanuvchilar</span>
            <UserX size={18} style={{ color: '#f87171' }} />
          </div>
          <span style={{ fontSize: '2rem', fontWeight: 800, color: '#f87171' }}>{inactiveCount}</span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Filtrda: <b style={{ color: '#f87171' }}>{filteredInactive} ta</b>
          </span>
        </div>
      </div>

      {/* Main Filter & Content Card */}
      <div style={cardStyle}>
        {/* Filters Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
          {/* Top row of filters: Search + Select dropdowns */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '220px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                type="text"
                placeholder="Ism, username yoki email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px 10px 36px',
                  background: 'var(--search-bg)', border: '1px solid var(--search-border)',
                  borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.88rem',
                  fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Filter Dropdowns */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Time Filter Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--search-bg)', border: '1px solid var(--search-border)', borderRadius: '10px', padding: '0 8px' }}>
                <Calendar size={15} style={{ color: 'var(--theme-color, var(--accent-blue))' }} />
                <select
                  value={timeFilter}
                  onChange={e => setTimeFilter(e.target.value as TimeFilter)}
                  style={{
                    background: 'transparent', border: 'none', color: 'var(--text-primary)',
                    padding: '9px 4px', fontSize: '0.85rem', fontWeight: 600, outline: 'none',
                    cursor: 'pointer', fontFamily: 'inherit'
                  }}
                >
                  <option value="all">Barcha vaqt</option>
                  <option value="today">Bugun qo'shilganlar</option>
                  <option value="this_week">Shu hafta</option>
                  <option value="this_month">Shu oy</option>
                  <option value="last_month">O'tgan oy</option>
                  <option value="last_3_months">Oxirgi 3 oy</option>
                  <option value="last_30_days">Oxirgi 30 kun</option>
                </select>
              </div>

              {/* Status Filter Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--search-bg)', border: '1px solid var(--search-border)', borderRadius: '10px', padding: '0 8px' }}>
                <Activity size={15} style={{ color: '#10b981' }} />
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as StatusFilter)}
                  style={{
                    background: 'transparent', border: 'none', color: 'var(--text-primary)',
                    padding: '9px 4px', fontSize: '0.85rem', fontWeight: 600, outline: 'none',
                    cursor: 'pointer', fontFamily: 'inherit'
                  }}
                >
                  <option value="all">Barcha statuslar</option>
                  <option value="active">Faqat faollar</option>
                  <option value="inactive">Faqat nofaollar</option>
                  <option value="recently_active">Oxirgi 7 kunda faol</option>
                </select>
              </div>

              {/* Sort By Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--search-bg)', border: '1px solid var(--search-border)', borderRadius: '10px', padding: '0 8px' }}>
                <ArrowUpDown size={15} style={{ color: '#f59e0b' }} />
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as SortOption)}
                  style={{
                    background: 'transparent', border: 'none', color: 'var(--text-primary)',
                    padding: '9px 4px', fontSize: '0.85rem', fontWeight: 600, outline: 'none',
                    cursor: 'pointer', fontFamily: 'inherit'
                  }}
                >
                  <option value="newest">Eng yangi</option>
                  <option value="oldest">Eng avvalgi</option>
                  <option value="last_login">Oxirgi faollik</option>
                  <option value="username">Alifbo bo'yicha</option>
                </select>
              </div>
            </div>
          </div>

          {/* Quick Filter Badges for Fast Access */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginRight: '4px' }}>
              Tezkor:
            </span>
            {[
              { id: 'all', label: 'Barchasi' },
              { id: 'today', label: 'Bugun' },
              { id: 'this_week', label: 'Shu hafta' },
              { id: 'this_month', label: 'Shu oy' },
              { id: 'last_month', label: "O'tgan oy" },
              { id: 'last_3_months', label: '3 oylik' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTimeFilter(tab.id as TimeFilter)}
                style={{
                  padding: '4px 10px', borderRadius: '16px', fontSize: '0.78rem', fontWeight: 600,
                  cursor: 'pointer', border: '1px solid',
                  background: timeFilter === tab.id ? 'var(--theme-color, var(--accent-blue))' : 'var(--search-bg)',
                  borderColor: timeFilter === tab.id ? 'var(--theme-color, var(--accent-blue))' : 'var(--border-color)',
                  color: timeFilter === tab.id ? '#fff' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            ))}

            <div style={{ height: '14px', width: '1px', background: 'var(--border-color)', margin: '0 4px' }} />

            {[
              { id: 'all', label: 'Hammasi' },
              { id: 'active', label: '✓ Faollar' },
              { id: 'inactive', label: '✗ Nofaollar' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id as StatusFilter)}
                style={{
                  padding: '4px 10px', borderRadius: '16px', fontSize: '0.78rem', fontWeight: 600,
                  cursor: 'pointer', border: '1px solid',
                  background: statusFilter === tab.id ? 'rgba(16, 185, 129, 0.15)' : 'var(--search-bg)',
                  borderColor: statusFilter === tab.id ? '#10b981' : 'var(--border-color)',
                  color: statusFilter === tab.id ? '#10b981' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', color: '#f87171', marginBottom: '1rem' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-secondary)', padding: '2rem' }}>
            <div style={{ width: '22px', height: '22px', border: '2px solid var(--border-color)', borderTopColor: 'var(--theme-color, var(--accent-blue))', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            Foydalanuvchilar yuklanmoqda...
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
            <Users size={48} style={{ opacity: 0.25, marginBottom: '0.75rem' }} />
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Foydalanuvchi topilmadi</h4>
            <p style={{ fontSize: '0.85rem' }}>Tanlangan filtr yoki qidiruv so'rovi bo'yicha ma'lumot mavjud emas.</p>
            <button
              onClick={() => { setSearch(''); setTimeFilter('all'); setStatusFilter('all'); }}
              style={{
                marginTop: '1rem', padding: '6px 14px', borderRadius: '8px',
                background: 'var(--search-bg)', border: '1px solid var(--border-color)',
                color: 'var(--theme-color, var(--accent-blue))', fontSize: '0.82rem', fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Filtrlarni tozalash
            </button>
          </div>
        ) : (
          /* Users List */
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {filteredUsers.map(u => {
              const uName = (u.username || '').toLowerCase();
              const fName = (u.first_name || '').toLowerCase();
              const userBooks = userProgressList.filter(p => {
                const pUser = (p.user_id || '').toLowerCase();
                return pUser === uName || (fName && pUser === fName);
              });

              return (
                <div 
                  key={u.id} 
                  onClick={() => setSelectedUser(u)}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '1rem', 
                    padding: '1rem 1.25rem', background: 'var(--search-bg)', 
                    borderRadius: '12px', border: '1px solid var(--border-color)',
                    flexWrap: 'wrap', transition: 'all 0.2s', cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--theme-color, var(--accent-blue))';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {/* Avatar Icon */}
                  <div style={{ 
                    width: '42px', height: '42px', borderRadius: '50%', 
                    background: 'var(--theme-color, var(--accent-blue))', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    fontWeight: 800, fontSize: '1.05rem', color: '#fff', flexShrink: 0 
                  }}>
                    {(u.first_name || u.username || '?')[0].toUpperCase()}
                  </div>

                  {/* Name & Username */}
                  <div style={{ flex: '1 1 160px', minWidth: '130px' }}>
                    <p style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)', margin: 0 }}>
                      {[u.first_name, u.last_name].filter(Boolean).join(' ') || u.username}
                    </p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px', marginBottom: 0 }}>
                      @{u.username}
                    </p>
                  </div>

                  {/* Books Read Badge */}
                  <div style={{ minWidth: '130px' }}>
                    {userBooks.length > 0 ? (
                      <span style={{ 
                        display: 'inline-flex', alignItems: 'center', gap: '5px', 
                        fontSize: '0.78rem', padding: '3px 9px', borderRadius: '8px', 
                        background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.25)',
                        color: 'var(--accent-blue)', fontWeight: 600 
                      }}>
                        <BookOpen size={13} /> {userBooks.length} ta kitob o'qigan
                      </span>
                    ) : (
                      <span style={{ 
                        display: 'inline-flex', alignItems: 'center', gap: '5px', 
                        fontSize: '0.78rem', padding: '3px 9px', borderRadius: '8px', 
                        background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)' 
                      }}>
                        <BookOpen size={13} style={{ opacity: 0.6 }} /> Kitob o'qimagan
                      </span>
                    )}
                  </div>

                  {/* Email */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--text-secondary)', minWidth: '160px' }}>
                    <Mail size={14} style={{ opacity: 0.7 }} /> 
                    <span>{u.email || <span style={{ opacity: 0.45 }}>Kiritilmagan</span>}</span>
                  </div>

                  {/* Registered Date */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }} title="Ro'yxatdan o'tgan vaqti">
                    <Calendar size={14} style={{ opacity: 0.7 }} />
                    <span>{new Date(u.date_joined).toLocaleDateString('uz-UZ', { year: 'numeric', month: '2-digit', day: '2-digit' })}</span>
                  </div>

                  {/* Last Active Time */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }} title="Saytdagi oxirgi harakati">
                    <Clock size={14} style={{ opacity: 0.7 }} />
                    <span>
                      {u.last_login 
                        ? new Date(u.last_login).toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }) 
                        : <span style={{ opacity: 0.45 }}>Noma'lum</span>}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <span style={{ 
                    padding: '4px 12px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700, 
                    background: u.is_active ? 'rgba(16,185,129,0.15)' : 'rgba(248,113,113,0.15)', 
                    color: u.is_active ? '#10b981' : '#f87171', 
                    border: '1px solid ' + (u.is_active ? 'rgba(16,185,129,0.3)' : 'rgba(248,113,113,0.3)'),
                    marginLeft: 'auto'
                  }}>
                    {u.is_active ? 'Faol' : 'Nofaol'}
                  </span>

                  {/* Action arrow */}
                  <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}>
                    <ChevronRight size={16} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* User Reading Activity Modal */}
      {selectedUser && (() => {
        const uName = (selectedUser.username || '').toLowerCase();
        const fName = (selectedUser.first_name || '').toLowerCase();
        const userBooks = userProgressList.filter(p => {
          const pUser = (p.user_id || '').toLowerCase();
          return pUser === uName || (fName && pUser === fName);
        });

        const totalMins = userBooks.reduce((acc, b) => {
          let secs = 0;
          if (typeof window !== 'undefined') {
            try {
              secs = Number(localStorage.getItem(`user_reading_time_${selectedUser.username}_${b.book__id}`) || 0);
            } catch {}
          }
          if (secs >= 60) return acc + Math.round(secs / 60);
          return acc + Math.max(8, Math.round((b.progress_percent / 100) * 110));
        }, 0);

        const formattedTotalTime = totalMins < 60 ? `${totalMins} daqiqa` : `${Math.floor(totalMins / 60)} soat ${totalMins % 60} daqiqa`;

        // Calculate latest reading time
        const latestBook = userBooks[0];
        let latestReadTimeText = '';
        if (latestBook) {
          const lDate = new Date(latestBook.updated_at);
          if (!isNaN(lDate.getTime())) {
            const d = lDate.toLocaleDateString('uz-UZ', { timeZone: 'Asia/Tashkent', day: '2-digit', month: '2-digit', year: 'numeric' });
            const t = lDate.toLocaleTimeString('uz-UZ', { timeZone: 'Asia/Tashkent', hour: '2-digit', minute: '2-digit', hour12: false });
            latestReadTimeText = `${d}, soat ${t}`;
          }
        }

        return (
          <div 
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.25rem'
            }}
            onClick={() => setSelectedUser(null)}
          >
            <div 
              style={{
                width: '100%',
                maxWidth: '720px',
                maxHeight: '90vh',
                background: 'var(--card-bg, #121826)',
                border: '1px solid var(--card-border, rgba(255,255,255,0.12))',
                borderRadius: '20px',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.55)',
                color: 'var(--text-primary)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.08))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1.2rem',
                    color: '#fff',
                    flexShrink: 0
                  }}>
                    {(selectedUser.first_name || selectedUser.username || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                        {[selectedUser.first_name, selectedUser.last_name].filter(Boolean).join(' ') || selectedUser.username}
                      </h3>
                      <span style={{
                        fontSize: '0.72rem',
                        padding: '2px 8px',
                        borderRadius: '99px',
                        background: selectedUser.is_active ? 'rgba(16,185,129,0.15)' : 'rgba(248,113,113,0.15)',
                        color: selectedUser.is_active ? '#10b981' : '#f87171',
                        border: '1px solid ' + (selectedUser.is_active ? 'rgba(16,185,129,0.3)' : 'rgba(248,113,113,0.3)'),
                        fontWeight: 700
                      }}>
                        {selectedUser.is_active ? 'Faol foydalanuvchi' : 'Nofaol'}
                      </span>
                    </div>
                    <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      @{selectedUser.username} {selectedUser.email && `· ${selectedUser.email}`}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedUser(null)}
                  style={{
                    background: 'var(--search-bg, rgba(255,255,255,0.06))',
                    border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
                    borderRadius: '10px',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  title="Yopish"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Stats Bar */}
              <div style={{
                padding: '0.9rem 1.5rem',
                background: 'rgba(255, 255, 255, 0.02)',
                borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.06))',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '0.75rem'
              }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>O'qilgan kitoblar</span>
                  <p style={{ margin: '2px 0 0 0', fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-blue)' }}>
                    {userBooks.length} <span style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)' }}>ta</span>
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Jami mutolaa vaqti</span>
                  <p style={{ margin: '2px 0 0 0', fontSize: '1.2rem', fontWeight: 800, color: '#10b981' }}>
                    {userBooks.length > 0 ? formattedTotalTime : '0 daqiqa'}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Oxirgi mutolaa vaqti</span>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.88rem', fontWeight: 700, color: '#fbbf24' }}>
                    {latestReadTimeText || 'O\'qilmagan'}
                  </p>
                </div>
              </div>

              {/* Modal Content / Books List */}
              <div style={{
                padding: '1.25rem 1.5rem',
                overflowY: 'auto',
                flex: 1,
                display: 'grid',
                gap: '0.85rem'
              }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookOpen size={16} style={{ color: 'var(--accent-blue)' }} /> Mutolaa qilingan kitoblar va sarflangan vaqt
                </h4>

                {userBooks.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                    <BookOpen size={42} style={{ opacity: 0.25, marginBottom: '0.75rem' }} />
                    <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', margin: 0 }}>Hozircha kitob o'qimagan</p>
                    <p style={{ fontSize: '0.82rem', marginTop: '4px' }}>Bu foydalanuvchi hali saytda birorta ham kitobni mutolaa qilishni boshlamagan.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '0.85rem' }}>
                    {userBooks.map((b) => {
                      const timeText = formatReadingTime(b.progress_percent, selectedUser.username, b.book__id);
                      const updatedDate = new Date(b.updated_at);
                      const isValidDate = !isNaN(updatedDate.getTime());
                      
                      const dateFormatted = isValidDate
                        ? updatedDate.toLocaleDateString('uz-UZ', { 
                            timeZone: 'Asia/Tashkent', 
                            year: 'numeric', 
                            month: '2-digit', 
                            day: '2-digit' 
                          })
                        : 'Noma\'lum';

                      const timeFormatted = isValidDate
                        ? updatedDate.toLocaleTimeString('uz-UZ', { 
                            timeZone: 'Asia/Tashkent', 
                            hour: '2-digit', 
                            minute: '2-digit', 
                            second: '2-digit',
                            hour12: false 
                          })
                        : '';

                      const coverUrl = getCoverUrl(b.book__cover_image);

                      return (
                        <div 
                          key={b.id}
                          style={{
                            padding: '1rem',
                            background: 'var(--search-bg, rgba(255,255,255,0.03))',
                            borderRadius: '14px',
                            border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px'
                          }}
                        >
                          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                            {/* Book Cover */}
                            <div style={{
                              width: '54px',
                              height: '76px',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              flexShrink: 0,
                              background: '#1e293b',
                              position: 'relative',
                              boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                            }}>
                              <img 
                                src={coverUrl} 
                                alt={b.book__title} 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=300&auto=format&fit=crop';
                                }}
                              />
                            </div>

                            {/* Book Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                                <h5 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                  {b.book__title}
                                </h5>
                                <span style={{
                                  fontSize: '0.72rem',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  background: b.progress_percent >= 90 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                                  color: b.progress_percent >= 90 ? '#10b981' : '#3b82f6',
                                  fontWeight: 700
                                }}>
                                  {b.progress_percent >= 90 ? 'Tugatilgan ✓' : 'O\'qilmoqda'}
                                </span>
                              </div>

                              <p style={{ margin: '2px 0 5px 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                {b.book__author}
                              </p>

                              {/* Chapter info */}
                              {b.chapter && (
                                <p style={{ margin: '0 0 6px 0', fontSize: '0.75rem', color: '#93c5fd', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <BookMarked size={12} /> {b.chapter}
                                </p>
                              )}

                              {/* Progress bar */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '99px', overflow: 'hidden' }}>
                                  <div 
                                    style={{ 
                                      width: `${Math.min(100, Math.max(5, b.progress_percent))}%`, 
                                      height: '100%', 
                                      background: b.progress_percent >= 90 ? '#10b981' : 'var(--theme-color, var(--accent-blue))',
                                      borderRadius: '99px' 
                                    }} 
                                  />
                                </div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: b.progress_percent >= 90 ? '#10b981' : 'var(--theme-color, var(--accent-blue))' }}>
                                  {Math.round(b.progress_percent)}%
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Detailed Reading Time & Timestamp Information Cards */}
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                            gap: '8px',
                            paddingTop: '8px',
                            borderTop: '1px solid rgba(255,255,255,0.06)'
                          }}>
                            {/* Qancha vaqt o'qigani */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '8px 12px',
                              borderRadius: '10px',
                              background: 'rgba(16, 185, 129, 0.08)',
                              border: '1px solid rgba(16, 185, 129, 0.2)'
                            }}>
                              <Timer size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                              <div>
                                <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                                  Qancha vaqt o'qigan
                                </span>
                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10b981' }}>
                                  {timeText}
                                </span>
                              </div>
                            </div>

                            {/* Qachon o'qilgan (aniq sana va soati bilan) */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '8px 12px',
                              borderRadius: '10px',
                              background: 'rgba(59, 130, 246, 0.08)',
                              border: '1px solid rgba(59, 130, 246, 0.2)'
                            }}>
                              <Clock size={16} style={{ color: '#3b82f6', flexShrink: 0 }} />
                              <div>
                                <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                                  Qachon o'qilgan (soati bilan)
                                </span>
                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#93c5fd' }}>
                                  {dateFormatted} {timeFormatted && `· soat ${timeFormatted}`}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

