"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, LogOut, LayoutDashboard, Library, PlusCircle, BarChart3, ChevronRight } from 'lucide-react';

const ADMIN_PASSWORD = 'elshod123';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const ok = sessionStorage.getItem('admin_auth');
    if (ok === 'true') setAuthed(true);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pass === ADMIN_PASSWORD) {
      sessionStorage.setItem('admin_auth', 'true');
      setAuthed(true);
      setError('');
    } else {
      setError("Parol noto'g'ri. Maslahat: admin123");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_auth');
    setAuthed(false);
    router.push('/admin');
  };

  if (!authed) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-color)', padding: '1rem'
      }}>
        <div style={{
          width: '100%', maxWidth: '400px',
          background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
          borderRadius: '20px', padding: '2.5rem', boxShadow: 'var(--shadow-elevated)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem', justifyContent: 'center' }}>
            <BarChart3 size={28} style={{ color: 'var(--accent-purple)' }} />
            <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>Admin Panel</span>
          </div>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input
              type="password"
              placeholder="Admin paroli"
              value={pass}
              onChange={e => setPass(e.target.value)}
              style={{
                padding: '12px 16px', background: 'var(--search-bg)', border: '1px solid var(--search-border)',
                borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.95rem', width: '100%',
                fontFamily: 'inherit'
              }}
            />
            {error && <p style={{ color: '#f87171', fontSize: '0.85rem' }}>{error}</p>}
            <button type="submit" style={{
              padding: '12px', background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-blue))',
              border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 700, cursor: 'pointer',
              fontSize: '0.95rem', fontFamily: 'inherit'
            }}>Kirish</button>
          </form>

        </div>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)' }}>
        {/* Desktop Sidebar */}
        <aside className="admin-sidebar" style={{
          width: '220px', flexShrink: 0, background: 'var(--glass-bg)',
          borderRight: '1px solid var(--glass-border)', padding: '1.5rem 1rem',
          display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'sticky', top: 0, height: '100vh'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', padding: '0 0.5rem' }}>
            <BookOpen size={22} style={{ color: 'var(--accent-blue)' }} />
            <span style={{ fontWeight: 800, fontSize: '1rem' }}>Kitoblar</span>
            <span style={{
              marginLeft: 'auto', fontSize: '0.65rem', fontWeight: 700, padding: '2px 7px',
              background: 'rgba(155, 109, 255, 0.15)', color: 'var(--accent-purple)',
              borderRadius: '99px', border: '1px solid rgba(155, 109, 255, 0.25)'
            }}>ADMIN</span>
          </div>

          {[
            { href: '/admin', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
            { href: '/admin/books', icon: <Library size={18} />, label: 'Kitoblar' },
            { href: '/admin/books/add', icon: <PlusCircle size={18} />, label: "Kitob qo'shish" },
          ].map(item => (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
              borderRadius: '10px', color: 'var(--text-secondary)', fontSize: '0.88rem', fontWeight: 600,
              transition: 'all 0.2s', textDecoration: 'none'
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'var(--search-bg)';
              (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'transparent';
              (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
            }}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}

          <div style={{ marginTop: 'auto' }}>
            <Link href="/" style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
              borderRadius: '10px', color: 'var(--text-secondary)', fontSize: '0.88rem',
              fontWeight: 600, textDecoration: 'none', marginBottom: '0.5rem'
            }}>
              <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} />
              <span>Saytga qaytish</span>
            </Link>
            <button onClick={handleLogout} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
              borderRadius: '10px', color: '#f87171', fontSize: '0.88rem', fontWeight: 600,
              background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)',
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s'
            }}>
              <LogOut size={18} />
              <span>Chiqish</span>
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="admin-main" style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="admin-bottom-nav" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
        background: 'var(--glass-bg)', borderTop: '1px solid var(--glass-border)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        padding: '0.5rem 0 calc(0.5rem + env(safe-area-inset-bottom))'
      }}>
        {[
          { href: '/admin', icon: <LayoutDashboard size={22} />, label: 'Dashboard' },
          { href: '/admin/books', icon: <Library size={22} />, label: 'Kitoblar' },
          { href: '/admin/books/add', icon: <PlusCircle size={22} />, label: "Qo'shish" },
          { href: '/', icon: <ChevronRight size={22} style={{ transform: 'rotate(180deg)' }} />, label: 'Sayt' },
        ].map(item => (
          <Link key={item.href} href={item.href} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
            color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.65rem', fontWeight: 600,
            padding: '4px 8px', borderRadius: '10px', minWidth: '56px'
          }}>
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
        <button onClick={handleLogout} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
          color: '#f87171', background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'inherit', fontSize: '0.65rem', fontWeight: 600, padding: '4px 8px', minWidth: '56px'
        }}>
          <LogOut size={22} />
          <span>Chiqish</span>
        </button>
      </nav>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .admin-sidebar { display: flex; }
        .admin-bottom-nav { display: none; }
        .admin-main { padding-bottom: 1.5rem; }
        @media (max-width: 768px) {
          .admin-sidebar { display: none !important; }
          .admin-bottom-nav { display: flex !important; }
          .admin-main { padding: 1rem 0.875rem 5rem !important; }
        }
      `}</style>
    </>
  );
}
