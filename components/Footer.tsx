import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.brand}>
          <Link href="/" className={styles.logo}>
            <BookOpen className={styles.logoIcon} size={28} />
            <span className={styles.logoText}>Kitoblar</span>
          </Link>
          <p className={styles.description}>
            Eng sara kitoblar to&apos;plami va premium e-kutubxona. Mutolaa qiling, bilim oling va o&apos;z dunyoqarashingizni kengaytiring.
          </p>
        </div>

        <div className={styles.column}>
          <h3 className={styles.title}>Bo&apos;limlar</h3>
          <div className={styles.links}>
            <Link href="/" className={styles.link}>Bosh sahifa</Link>
            <Link href="/category/badiiy" className={styles.link}>Badiiy asarlar</Link>
            <Link href="/category/biznes" className={styles.link}>Biznes</Link>
            <Link href="/category/ilmiy" className={styles.link}>Ilmiy kitoblar</Link>
          </div>
        </div>

        <div className={styles.column}>
          <h3 className={styles.title}>Kompaniya</h3>
          <div className={styles.links}>
            <Link href="/about" className={styles.link}>Biz haqimizda</Link>
            <Link href="/contact" className={styles.link}>Aloqa</Link>
            <Link href="/terms" className={styles.link}>Foydalanish shartlari</Link>
            <Link href="/privacy" className={styles.link}>Maxfiylik siyosati</Link>
          </div>
        </div>

        <div className={styles.column}>
          <h3 className={styles.title}>Ijtimoiy tarmoqlar</h3>
          <div className={styles.links}>
            <a href="https://t.me/kitoblar" className={styles.link} target="_blank" rel="noreferrer">Telegram</a>
            <a href="https://instagram.com/kitoblar" className={styles.link} target="_blank" rel="noreferrer">Instagram</a>
            <a href="https://youtube.com/@kitoblar" className={styles.link} target="_blank" rel="noreferrer">YouTube</a>
          </div>
        </div>
      </div>

      <div className={styles.bottom}>
        <p>&copy; {new Date().getFullYear()} Kitoblar Portali. Barcha huquqlar himoyalangan.</p>
        <div className={styles.social}>
          {/* Telegram */}
          <a href="https://t.me/kitoblar" className={styles.socialLink} aria-label="Telegram" target="_blank" rel="noreferrer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
          </a>
          {/* Instagram */}
          <a href="https://instagram.com/kitoblar" className={styles.socialLink} aria-label="Instagram" target="_blank" rel="noreferrer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
          </a>
          {/* YouTube */}
          <a href="https://youtube.com/@kitoblar" className={styles.socialLink} aria-label="YouTube" target="_blank" rel="noreferrer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
