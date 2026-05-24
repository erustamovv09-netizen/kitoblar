"use client";
import Link from 'next/link';
import { BookOpen, Search, Heart, User } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Navbar.module.css';

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <div className={styles.left}>
          <Link href="/" className={styles.logo}>
            <BookOpen className={styles.logoIcon} size={24} />
            <span className={styles.logoText}>Kitoblar</span>
          </Link>
        </div>

        <div className={styles.center}>
          <form onSubmit={handleSearch} className={styles.searchWrapper}>
            <Search className={styles.searchIcon} size={18} />
            <input
              type="text"
              placeholder="Kitob yoki muallif qidirish..."
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>

        <div className={styles.right}>
          <div className={styles.navLinks}>
            <Link href="/category/badiiy" className={styles.navLink}>Badiiy</Link>
            <Link href="/category/biznes" className={styles.navLink}>Biznes</Link>
            <Link href="/category/ilmiy" className={styles.navLink}>Ilmiy</Link>
          </div>
          <div className={styles.actions}>
            <Link href="/favorites" className={styles.actionBtn} aria-label="Sevimlilar">
              <Heart size={20} />
            </Link>
            <Link href="/account" className={styles.actionBtn} aria-label="Profil">
              <User size={20} />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
