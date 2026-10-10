"use client";

import { useEffect, useState } from 'react';
import { Users, Search, RefreshCw, UserCheck, UserX, Mail, Calendar } from 'lucide-react';

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

const cardStyle: React.CSSProperties = { background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '16px', padding: '1.5rem', backdropFilter: 'blur(8px)' };

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');

  async function fetchUsers() {
    setLoading(true); setError('');
    try {
      const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      const res = await fetch('http://' + host + ':8000/api/admin/stats/');
      if (!res.ok) throw new Error('Server xatosi: ' + res.status);
      const data = await res.json();
      setUsers(data.recent_users || []);
      setLastUpdated(new Date().toLocaleTimeString('uz-UZ'));
    } catch (e: any) {
      setError(e.message || 'Yuklanmadi');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchUsers(); }, []);

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.first_name + ' ' + u.last_name).toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = users.filter(u => u.is_active).length;

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={28} style={{ color: 'var(--theme-color, var(--accent-blue))' }} /> Foydalanuvchilar
          </h1>
          {lastUpdated && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Yangilangan: {lastUpdated}</p>}
        </div>
        <button onClick={fetchUsers} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'var(--search-bg)', border: '1px solid var(--border-color)', borderRadius: '10px', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 600 }}>
          <RefreshCw size={14} /> Yangilash
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'var(--theme-hover)', border: '1px solid var(--theme-hover)', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--theme-color, var(--accent-blue))' }}><Users size={16} /><span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' as const }}>Jami</span></div>
          <span style={{ fontSize: '1.8rem', fontWeight: 800 }}>{users.length}</span>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #10b98122, #10b98111)', border: '1px solid #10b98133', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981' }}><UserCheck size={16} /><span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' as const }}>Faol</span></div>
          <span style={{ fontSize: '1.8rem', fontWeight: 800 }}>{activeCount}</span>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #f8717122, #f8717111)', border: '1px solid #f8717133', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171' }}><UserX size={16} /><span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' as const }}>Nofaol</span></div>
          <span style={{ fontSize: '1.8rem', fontWeight: 800 }}>{users.length - activeCount}</span>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ marginBottom: '1rem', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Ism, username yoki email bo'yicha qidirish..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 12px 10px 36px', background: 'var(--search-bg)', border: '1px solid var(--search-border)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.88rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const }}
          />
        </div>

        {error && <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', color: '#f87171', marginBottom: '1rem' }}>⚠️ {error}</div>}

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-secondary)', padding: '1.5rem' }}>
            <div style={{ width: '20px', height: '20px', border: '2px solid var(--border-color)', borderTopColor: 'var(--theme-color, var(--accent-blue))', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            Yuklanmoqda...
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
            <Users size={40} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
            <p>Foydalanuvchi topilmadi</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {filtered.map(u => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--search-bg)', borderRadius: '12px', flexWrap: 'wrap' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--theme-color, var(--accent-blue))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem', color: '#fff', flexShrink: 0 }}>
                  {(u.first_name || u.username || '?')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: '120px' }}>
                  <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                    {[u.first_name, u.last_name].filter(Boolean).join(' ') || u.username}
                  </p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>@{u.username}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <Mail size={13} /> {u.email || <span style={{ opacity: 0.5 }}>Kiritilmagan</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)' }} title="Ro'yxatdan o'tgan vaqti">
                  <span style={{opacity: 0.6}}>Ro'yxatdan o'tgan:</span> {new Date(u.date_joined).toLocaleDateString('uz-UZ', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)' }} title="Saytdagi oxirgi harakati">
                  <span style={{opacity: 0.6}}>Oxirgi faollik:</span> {u.last_login ? new Date(u.last_login).toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }) : <span style={{ opacity: 0.5 }}>Noma'lum</span>}
                </div>
                <span style={{ padding: '3px 10px', borderRadius: '99px', fontSize: '0.72rem', fontWeight: 700, background: u.is_active ? 'rgba(16,185,129,0.15)' : 'rgba(248,113,113,0.15)', color: u.is_active ? '#10b981' : '#f87171', border: '1px solid ' + (u.is_active ? 'rgba(16,185,129,0.3)' : 'rgba(248,113,113,0.3)') }}>
                  {u.is_active ? 'Faol' : 'Nofaol'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
