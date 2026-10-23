"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, LogOut, LayoutDashboard, Library, PlusCircle, BarChart2, Users, ChevronRight, Receipt } from 'lucide-react';

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'elshod123';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authed, setAuthed] = useState(false);
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [showMobileDashMenu, setShowMobileDashMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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
      setError("Parol noto'g'ri.");
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
            <BarChart2 size={28} style={{ color: 'var(--accent-purple)' }} />
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
            { href: '/admin/orders', icon: <Receipt size={18} />, label: "To'lovlar va Buyurtmalar" },
            { href: '/admin/books', icon: <Library size={18} />, label: 'Kitoblar' },
            { href: '/admin/books/add', icon: <PlusCircle size={18} />, label: "Kitob qo'shish" },
            { href: '/admin/analytics', icon: <BarChart2 size={18} />, label: 'Analitika' },
            { href: '/admin/users', icon: <Users size={18} />, label: 'Foydalanuvchilar' },
          ].map(item => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} style={{
                display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
                borderRadius: '10px', fontSize: '0.88rem', fontWeight: 600,
                color: isActive ? 'var(--theme-color, var(--accent-blue))' : 'var(--text-secondary)',
                background: isActive ? 'var(--theme-hover, rgba(59, 130, 246, 0.1))' : 'transparent',
                transition: 'all 0.2s', textDecoration: 'none'
              }}
                onMouseEnter={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = 'var(--search-bg)';
                    (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                    (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                  }
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div style={{ marginTop: 'auto' }}>
            <Link href="/" style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
              borderRadius: '10px', color: 'var(--text-secondary)', fontSize: '0.88rem',
              fontWeight: 600, textDecoration: 'none', marginBottom: '0.5rem'
            }}>
              <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} />
              <span>Saytga qaytish</span>
            </Link>
            <button onClick={() => setShowLogoutConfirm(true)} style={{
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
        <div style={{ position: 'relative' }}>
          {showMobileDashMenu && (
            <div style={{
              position: 'absolute', bottom: '100%', left: '-10px',
              marginBottom: '10px', background: 'var(--card-bg)', border: '1px solid var(--card-border)',
              borderRadius: '12px', padding: '0.4rem', display: 'flex', flexDirection: 'column', gap: '4px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)', minWidth: '130px'
            }}>
              <Link href="/admin/orders" onClick={() => setShowMobileDashMenu(false)} style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px',
                color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 600,
                borderRadius: '8px', background: 'var(--search-bg)'
              }}>
                <Receipt size={15} /> To&apos;lovlar
              </Link>
              <Link href="/admin/analytics" onClick={() => setShowMobileDashMenu(false)} style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px',
                color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 600,
                borderRadius: '8px', background: 'var(--search-bg)'
              }}>
                <BarChart2 size={15} /> Analitika
              </Link>
              <Link href="/admin/users" onClick={() => setShowMobileDashMenu(false)} style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px',
                color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 600,
                borderRadius: '8px', background: 'var(--search-bg)'
              }}>
                <Users size={15} /> Foydalanuvchilar
              </Link>
            </div>
          )}
          <button onClick={() => setShowMobileDashMenu(!showMobileDashMenu)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
            color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '0.65rem', fontWeight: 600, padding: '4px 8px', minWidth: '56px'
          }}>
            <LayoutDashboard size={22} />
            <span>Dashboard</span>
          </button>
        </div>
        {[
          { href: '/admin/books', icon: <Library size={22} />, label: 'Kitoblar' },
          { href: '/admin/books/add', icon: <PlusCircle size={22} />, label: "Qo'shish" },
          { href: '/', icon: <ChevronRight size={22} style={{ transform: 'rotate(180deg)' }} />, label: 'Sayt' },
        ].map(item => {
          const isActive = pathname === item.href && item.href !== '/';
          return (
            <Link key={item.href} href={item.href} onClick={() => setShowMobileDashMenu(false)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
              color: isActive ? 'var(--theme-color, var(--accent-blue))' : 'var(--text-secondary)', 
              background: isActive ? 'var(--theme-hover, rgba(59, 130, 246, 0.1))' : 'transparent',
              textDecoration: 'none', fontSize: '0.65rem', fontWeight: 600,
              padding: '6px 12px', borderRadius: '12px', minWidth: '60px'
            }}>
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button onClick={() => setShowLogoutConfirm(true)} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
          color: '#f87171', background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'inherit', fontSize: '0.65rem', fontWeight: 600, padding: '4px 8px', minWidth: '56px'
        }}>
          <LogOut size={22} />
          <span>Chiqish</span>
        </button>
      </nav>

      {/* Confirmation Modal */}
      {showLogoutConfirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div style={{
            background: 'var(--card-bg, #121826)',
            border: '1px solid var(--card-border, rgba(255, 255, 255, 0.12))',
            borderRadius: '20px', padding: '2rem 1.75rem', maxWidth: '380px', width: '100%',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)', textAlign: 'center',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '16px',
              background: 'rgba(239, 68, 68, 0.12)', color: '#f87171',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.25rem'
            }}>
              <LogOut size={28} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              Admin paneldan chiqish
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.75rem', lineHeight: 1.5 }}>
              Haqiqatan ham admin paneldan chiqmoqchimisiz?
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  padding: '11px 16px', borderRadius: '12px',
                  background: 'var(--search-bg, rgba(255,255,255,0.06))',
                  border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
                  color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem',
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s'
                }}
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  handleLogout();
                }}
                style={{
                  padding: '11px 16px', borderRadius: '12px',
                  background: '#ef4444', border: 'none',
                  color: '#fff', fontWeight: 700, fontSize: '0.9rem',
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                  boxShadow: '0 4px 15px rgba(239, 68, 68, 0.35)'
                }}
              >
                Ha, chiqish
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
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
