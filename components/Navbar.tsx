"use client";
import Link from 'next/link';
import { BookOpen, Search, Heart, User, Sun, Moon, Menu, X, LogOut, LogIn, BarChart2, ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Navbar.module.css';

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [favCount, setFavCount] = useState(0);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [accentColor, setAccentColor] = useState('#3b82f6');
  const [showDesktopCats, setShowDesktopCats] = useState(false);
  const [showMobileCats, setShowMobileCats] = useState(false);
  const router = useRouter();

  const categories = [
    { name: 'Badiiy asarlar', slug: 'badiiy' },
    { name: 'Biznes', slug: 'biznes' },
    { name: 'Ilmiy', slug: 'ilmiy' },
    { name: 'Tarixiy', slug: 'tarixiy' },
    { name: 'Detektiv', slug: 'detektiv' },
    { name: 'Bolalar adabiyoti', slug: 'bolalar-adabiyoti' },
    { name: 'Jahon adabiyoti', slug: 'jahon-adabiyoti' },
    { name: 'Shaxsiy rivojlanish', slug: 'shaxsiy-rivojlanish' },
    { name: 'Moliya', slug: 'moliya' },
    { name: 'Falsafa', slug: 'falsafa' },
    { name: 'Psixologiya', slug: 'psixologiya' }
  ];

  const getAccentGradient = (color: string) => {
    switch (color) {
      case 'purple': return 'linear-gradient(135deg, #8b5cf6, #c084fc)';
      case 'emerald': return 'linear-gradient(135deg, #10b981, #34d399)';
      case 'amber': return 'linear-gradient(135deg, #f59e0b, #fbbf24)';
      case 'blue': 
      default:
        return 'linear-gradient(135deg, #3b82f6, #8b5cf6)';
    }
  };
  const getAccentHex = (color: string) => {
    switch (color) {
      case 'purple': return 'var(--accent-purple)';
      case 'emerald': return 'var(--accent-emerald)';
      case 'amber': return '#f59e0b';
      case 'blue': 
      default: return 'var(--accent-blue)';
    }
  };
  
  const getAccentHover = (color: string) => {
    switch (color) {
      case 'purple': return 'rgba(155, 109, 255, 0.1)';
      case 'emerald': return 'rgba(16, 185, 129, 0.1)';
      case 'amber': return 'rgba(245, 158, 11, 0.1)';
      case 'blue': 
      default: return 'rgba(59, 130, 246, 0.1)';
    }
  };

  const accentGradient = getAccentGradient(accentColor);
  const themeColor = getAccentHex(accentColor);
  const themeHover = getAccentHover(accentColor);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setMobileOpen(false);
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  // Auth state
  useEffect(() => {
    function checkAuth() {
      try {
        const username = localStorage.getItem('username');
        const name = localStorage.getItem('name');
        const savedAccent = localStorage.getItem('account_accent');
        
        if (savedAccent) {
          setAccentColor(savedAccent);
        } else {
          setAccentColor('blue');
        }

        const root = document.documentElement;
        if (savedAccent === 'purple') {
          root.style.setProperty('--theme-color', 'var(--accent-purple)');
        } else if (savedAccent === 'emerald') {
          root.style.setProperty('--theme-color', 'var(--accent-emerald)');
        } else if (savedAccent === 'amber') {
          root.style.setProperty('--theme-color', '#f59e0b');
        } else {
          root.style.setProperty('--theme-color', 'var(--accent-blue)');
        }
        root.style.setProperty('--theme-hover', 'color-mix(in srgb, var(--theme-color) 15%, transparent)');
        
        if (username) {
          setIsLoggedIn(true);
          setUserName(name || username);
        } else {
          setIsLoggedIn(false);
          setUserName('');
        }
      } catch {
        setIsLoggedIn(false);
      }
    }
    checkAuth();
    window.addEventListener('auth-changed', checkAuth);
    window.addEventListener('storage', checkAuth);
    return () => {
      window.removeEventListener('auth-changed', checkAuth);
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  // Ping Activity
  useEffect(() => {
    if (isLoggedIn) {
      const username = localStorage.getItem('username');
      if (username) {
        const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
        fetch('http://' + host + ':8000/api/auth/ping/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username })
        }).catch(() => {});
      }
    }
  }, [isLoggedIn, router]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
    window.dispatchEvent(new Event('theme-changed'));
  };

  useEffect(() => {
    function readFavs() {
      try {
        const raw = localStorage.getItem('favorites');
        const list = raw ? JSON.parse(raw) : [];
        setFavCount(Array.isArray(list) ? list.length : 0);
      } catch {
        setFavCount(0);
      }
    }
    readFavs();
    window.addEventListener('storage', readFavs);
    window.addEventListener('fav-updated', readFavs as EventListener);
    return () => {
      window.removeEventListener('storage', readFavs);
      window.removeEventListener('fav-updated', readFavs as EventListener);
    };
  }, []);

  // Close menu on route change / outside click via Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <nav className={styles.navbar} style={{ '--hover-color': themeColor, '--hover-bg': themeHover } as React.CSSProperties}>
      <div className={styles.container}>
        {/* Logo */}
        <div className={styles.left}>
          <Link href="/" className={styles.logo} onClick={() => setMobileOpen(false)}>
            <BookOpen className={styles.logoIcon} size={24} />
            <span className={styles.logoText}>Kitoblar</span>
          </Link>
        </div>

        {/* Desktop search */}
        <div className={styles.center}>
          <form onSubmit={handleSearch} className={styles.searchWrapper}>
            <Search className={styles.searchIcon} size={18} />
            <input
              type="text"
              placeholder="Qidirish..."
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>

        {/* Desktop right */}
        <div className={styles.right}>
          <div className={styles.navLinks}>
            <Link href="/" className={styles.navLink}>Bosh sahifa</Link>
            <div 
              style={{ position: 'relative' }} 
              onMouseEnter={() => setShowDesktopCats(true)} 
              onMouseLeave={() => setShowDesktopCats(false)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} className={styles.navLink}>
                Kategoriyalar <ChevronDown size={14} style={{ transform: showDesktopCats ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }} />
              </div>
              {showDesktopCats && (
                <div style={{
                  position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                  paddingTop: '10px', zIndex: 50
                }}>
                  <div style={{
                    background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px',
                    padding: '0.5rem', display: 'flex', flexDirection: 'column', minWidth: '180px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
                  }}>
                  {categories.map(c => (
                    <Link key={c.slug} href={`/category/${c.slug}`} onClick={() => setShowDesktopCats(false)} style={{
                      padding: '8px 12px', color: 'var(--text-primary)', textDecoration: 'none',
                      fontSize: '0.85rem', fontWeight: 500, borderRadius: '6px', whiteSpace: 'nowrap',
                      transition: 'all 0.2s'
                    }} 
                    onMouseEnter={e => {
                      e.currentTarget.style.background = themeHover;
                      e.currentTarget.style.color = themeColor;
                    }} 
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }}>
                      {c.name}
                    </Link>
                  ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className={styles.actions}>
            <button
              onClick={toggleTheme}
              className={styles.actionBtn}
              aria-label="Mavzuni o'zgartirish"
              title={theme === 'dark' ? "Yorug' sahifa" : "Qorong'u sahifa"}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div style={{ position: 'relative' }}>
              <Link href="/favorites" className={styles.actionBtn} aria-label="Sevimlilar">
                <Heart size={20} />
              </Link>
              {favCount > 0 && <span className={styles.favBadge}>{favCount > 99 ? '99+' : favCount}</span>}
            </div>
            {isLoggedIn ? (
              <>
                <Link 
                  href="/account" 
                  className={styles.actionBtn} 
                  aria-label="Profil" 
                  title={userName}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%', background: accentGradient, color: '#fff', fontWeight: 800, fontSize: '0.95rem', textDecoration: 'none' }}
                >
                  {userName ? userName[0].toUpperCase() : <User size={20} />}
                </Link>
              </>
            ) : (
              <Link href="/login" className={styles.loginBtn} aria-label="Kirish">
                <LogIn size={16} />
                <span>Kirish</span>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile right actions (Theme, Profile, Menu) */}
        <div className={styles.mobileRightActions}>
          <button
            onClick={toggleTheme}
            className={styles.mobileActionHeaderBtn}
            aria-label="Mavzuni o'zgartirish"
            title={theme === 'dark' ? "Yorug' sahifa" : "Qorong'u sahifa"}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {isLoggedIn ? (
            <Link 
              href="/account" 
              className={styles.mobileActionHeaderBtn} 
              aria-label="Profil" 
              onClick={() => setMobileOpen(false)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%', background: accentGradient, color: '#fff', fontWeight: 800, fontSize: '0.95rem', textDecoration: 'none', border: 'none' }}
            >
              {userName ? userName[0].toUpperCase() : <User size={18} />}
            </Link>
          ) : (
            <Link href="/login" className={styles.mobileLoginBtn} onClick={() => setMobileOpen(false)}>
              <LogIn size={16} />
              <span>Kirish</span>
            </Link>
          )}
          <button
            className={styles.hamburger}
            onClick={() => setMobileOpen(v => !v)}
            aria-label={mobileOpen ? 'Menyuni yopish' : 'Menyuni ochish'}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className={styles.mobileDrawer}>
          {/* Nav links */}
          <div className={styles.mobileLinks}>
            <Link href="/" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Bosh sahifa</Link>
            <button 
              className={styles.mobileLink} 
              onClick={() => setShowMobileCats(!showMobileCats)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', background: 'none', border: 'none', color: 'inherit', font: 'inherit', cursor: 'pointer', textAlign: 'left' }}
            >
              Kategoriyalar <ChevronDown size={16} style={{ transform: showMobileCats ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }} />
            </button>
            {showMobileCats && (
              <div style={{ display: 'flex', flexDirection: 'column', paddingLeft: '1rem', marginTop: '-0.25rem', marginBottom: '0.25rem' }}>
                {categories.map(c => (
                  <Link key={c.slug} href={`/category/${c.slug}`} className={styles.mobileLink} onClick={() => setMobileOpen(false)} style={{
                    fontSize: '0.95rem', padding: '0.5rem 0'
                  }}>
                    {c.name}
                  </Link>
                ))}
              </div>
            )}
            <Link href="/search" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Barcha kitoblar</Link>
          </div>

          {/* Bottom actions */}
          <div className={styles.mobileActions}>
            <Link href="/favorites" className={styles.mobileActionLink} onClick={() => setMobileOpen(false)}>
              <Heart size={18} />
              <span>Sevimlilar {favCount > 0 && `(${favCount})`}</span>
            </Link>
            {isLoggedIn ? (
              <>
                <Link href="/account" className={styles.mobileActionLink} onClick={() => setMobileOpen(false)}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', background: accentGradient, color: '#fff', fontWeight: 800, fontSize: '0.75rem', marginRight: '4px' }}>
                    {userName ? userName[0].toUpperCase() : <User size={14} />}
                  </div>
                  <span>Profil</span>
                </Link>

              </>
            ) : (
              <Link href="/login" className={styles.mobileActionLink} onClick={() => setMobileOpen(false)}>
                <LogIn size={18} />
                <span>Kirish</span>
              </Link>
            )}
            <button onClick={() => { toggleTheme(); setMobileOpen(false); }} className={styles.mobileActionLink}>
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              <span>{theme === 'dark' ? "Yorug' mavzu" : "Qorong'u mavzu"}</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
