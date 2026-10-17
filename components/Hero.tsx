"use client";
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { api, Book } from '@/app/lib/api';
import styles from './Hero.module.css';

const MAX_CHARS = 120;

export default function Hero() {
  const [heroBook, setHeroBook] = useState<Book | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('cached_hero_top_book');
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return null;
  });
  const [loading, setLoading] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('cached_hero_top_book');
        if (cached) return false;
      } catch {}
    }
    return true;
  });
  const [descExpanded, setDescExpanded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const books = await api.getBooks();
        if (books && books.length > 0) {
          // Hafta kitobi: is_weekly_top belgilangan kitob yoki birinchi haqiqiy backend kitobi
          const top = books.find(b => (b as any).is_weekly_top === true || (b as any).isWeeklyTop === true) || books[0];
          if (isMounted && top) {
            setHeroBook(top);
            setLoading(false);
            try {
              localStorage.setItem('cached_hero_top_book', JSON.stringify(top));
            } catch {}
            return;
          }
        }
      } catch (err) {
        console.error("Hero load error:", err);
      }

      if (isMounted) {
        setLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, []);

  // Backenddan haqiqiy kitob yuklanguncha chiroyli skeleton ko'rsatish (eski soxta kitob ko'rinmaydi)
  if (loading && !heroBook) {
    return (
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.content}>
            <div className="skeleton" style={{ width: '130px', height: '32px', borderRadius: '999px' }} />
            <div className="skeleton" style={{ width: '85%', height: '56px', borderRadius: '12px' }} />
            <div className="skeleton" style={{ width: '45%', height: '26px', borderRadius: '8px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
              <div className="skeleton" style={{ width: '100%', height: '16px', borderRadius: '6px' }} />
              <div className="skeleton" style={{ width: '92%', height: '16px', borderRadius: '6px' }} />
              <div className="skeleton" style={{ width: '75%', height: '16px', borderRadius: '6px' }} />
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '14px' }}>
              <div className="skeleton" style={{ width: '170px', height: '48px', borderRadius: '14px' }} />
              <div className="skeleton" style={{ width: '170px', height: '48px', borderRadius: '14px' }} />
            </div>
          </div>
          <div className={styles.imageWrapper} style={{ pointerEvents: 'none', display: 'flex', justifyContent: 'center' }}>
            <div className="skeleton" style={{ width: '320px', height: '440px', borderRadius: '24px' }} />
          </div>
        </div>
      </section>
    );
  }

  // Agar umuman kitob bo'lmasa, soxta e'lon chiqmasligi uchun hech narsa ko'rsatmaymiz
  if (!heroBook) {
    return null;
  }

  const bookTitle  = heroBook.title;
  const bookAuthor = `Muallif: ${heroBook.author}`;
  const bookDesc   = heroBook.description || '';
  const bookLink   = `/book/${heroBook.id}`;
  const bookImage  = heroBook.image;

  const isLong = bookDesc.length > MAX_CHARS;
  const shownDesc = isLong && !descExpanded
    ? bookDesc.slice(0, MAX_CHARS).trimEnd()
    : bookDesc;

  return (
    <section className={styles.hero}>
      <div className={styles.container}>
        <motion.div
          className={styles.content}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <motion.div
            className={styles.badge}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Hafta kitobi
          </motion.div>
          <motion.h1
            className={styles.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {bookTitle}
          </motion.h1>
          <motion.p
            className={styles.author}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {bookAuthor}
          </motion.p>

          {/* Tavsif — qisqartirilgan yoki to'liq */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <p className={styles.description} style={{ margin: 0 }}>
              {shownDesc}
              {isLong && !descExpanded && (
                <>
                  {'... '}
                  <button
                    onClick={() => setDescExpanded(true)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'rgba(255,255,255,0.6)', fontSize: 'inherit',
                      fontFamily: 'inherit', padding: 0, fontWeight: 700,
                      letterSpacing: '0.06em'
                    }}
                    aria-label="Ko'proq ko'rish"
                  >
                    •••
                  </button>
                </>
              )}
              {isLong && descExpanded && (
                <>
                  {' '}
                  <button
                    onClick={() => setDescExpanded(false)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'rgba(255,255,255,0.4)', fontSize: '0.8em',
                      fontFamily: 'inherit', padding: 0, fontWeight: 600,
                      textDecoration: 'underline', textUnderlineOffset: '2px'
                    }}
                    aria-label="Yopish"
                  >
                    yopish
                  </button>
                </>
              )}
            </p>
          </motion.div>

          <motion.div
            className={styles.buttons}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Link href={bookLink} className={styles.primaryBtn}>O&apos;qishni boshlash</Link>
            <Link href="/aksiyalar" className={styles.secondaryBtn}>
              <Flame size={18} style={{ color: '#f59e0b' }} />
              <span>Aksiyalar</span>
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          className={styles.imageWrapper}
          initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          whileHover={{ scale: 1.05, rotate: 2 }}
        >
          <Link href={bookLink} style={{ display: 'block', width: '100%' }}>
            <Image
              src={bookImage}
              alt={bookTitle}
              width={500}
              height={600}
              className={styles.image}
              priority
              loading="eager"
              unoptimized
            />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
