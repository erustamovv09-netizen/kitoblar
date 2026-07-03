"use client";
import Link from 'next/link';
import { BookOpen, Search, Heart, User, Sun, Moon, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Navbar.module.css';

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [favCount, setFavCount] = useState(0);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();

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
    <nav className={styles.navbar}>
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
            <Link href="/category/badiiy" className={styles.navLink}>Badiiy</Link>
            <Link href="/category/biznes" className={styles.navLink}>Biznes</Link>
            <Link href="/category/ilmiy" className={styles.navLink}>Ilmiy</Link>
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
            <Link href="/account" className={styles.actionBtn} aria-label="Profil">
              <User size={20} />
            </Link>
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
          <Link href="/account" className={styles.mobileActionHeaderBtn} aria-label="Profil" onClick={() => setMobileOpen(false)}>
            <User size={18} />
          </Link>
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
            <Link href="/category/badiiy" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Badiiy asarlar</Link>
            <Link href="/category/biznes" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Biznes</Link>
            <Link href="/category/ilmiy" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Ilmiy</Link>
            <Link href="/search" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Barcha kitoblar</Link>
          </div>

          {/* Bottom actions */}
          <div className={styles.mobileActions}>
            <Link href="/favorites" className={styles.mobileActionLink} onClick={() => setMobileOpen(false)}>
              <Heart size={18} />
              <span>Sevimlilar {favCount > 0 && `(${favCount})`}</span>
            </Link>
            <Link href="/account" className={styles.mobileActionLink} onClick={() => setMobileOpen(false)}>
              <User size={18} />
              <span>Profil</span>
            </Link>
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
