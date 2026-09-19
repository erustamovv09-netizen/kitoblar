"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';
import BookCard from '@/components/BookCard';
import { api, Book } from '@/app/lib/api';
import styles from './page.module.css';
import { useParams } from 'next/navigation';
import { motion, Variants } from 'framer-motion';

// Kategoriya slug → chiroyli nom xaritasi
const categoryNames: Record<string, string> = {
  'badiiy': 'Badiiy asarlar',
  'biznes': 'Biznes va Rivojlanish',
  'ilmiy': 'Ilmiy kitoblar',
  'tarixiy': 'Tarixiy kitoblar',
  'detektiv': 'Detektiv kitoblar',
  'bolalar': 'Bolalar adabiyoti',
  'jahon': 'Jahon adabiyoti',
  'shaxsiy': 'Shaxsiy rivojlanish',
  'moliya': 'Moliya va Iqtisodiyot',
  'falsafa': 'Falsafa',
  'psixologiya': 'Psixologiya',
};

// Kategoriya slug bo'yicha kitoblar filtri
function matchesSlug(bookCat: string, slug: string): boolean {
  const cat = bookCat.toLowerCase();
  if (slug === 'badiiy') return cat.includes('badiiy');
  if (slug === 'biznes') return cat.includes('biznes') || cat.includes('rivojlanish') || cat.includes('shaxsiy');
  if (slug === 'ilmiy') return cat.includes('ilmiy') || cat.includes('fan');
  if (slug === 'tarixiy') return cat.includes('tarix');
  if (slug === 'detektiv') return cat.includes('detektiv');
  if (slug === 'bolalar') return cat.includes('bolalar');
  if (slug === 'jahon') return cat.includes('jahon');
  if (slug === 'shaxsiy') return cat.includes('shaxsiy');
  if (slug === 'moliya') return cat.includes('moliya') || cat.includes('iqtisod');
  if (slug === 'falsafa') return cat.includes('falsafa');
  if (slug === 'psixologiya') return cat.includes('psixologiya');
  return false;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

export default function CategoryPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  const categoryName = slug ? (categoryNames[slug] || slug) : '';

  useEffect(() => {
    if (!slug) return;
    async function load() {
      setLoading(true);
      const data = await api.getBooks();
      const filtered = (data || []).filter(b => matchesSlug(b.category, slug));
      setBooks(filtered);
      setLoading(false);
    }
    load();
  }, [slug]);

  if (!slug) return null;

  return (
    <main className={styles.main}>
      <section className={styles.heroSection}>
        <div className={styles.container}>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
            <Link href="/" className={styles.backButton}>
              <ArrowLeft size={18} />
              <span>Bosh sahifaga qaytish</span>
            </Link>
          </motion.div>

          <motion.div
            className={styles.heroBadge}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <BookOpen size={12} />
            Kategoriya
          </motion.div>

          <motion.h1
            className={styles.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            {categoryName}
          </motion.h1>
          <motion.p
            className={styles.description}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Ushbu bo&apos;limda eng yaxshi {categoryName.toLowerCase()}ni topishingiz mumkin.
          </motion.p>
          {!loading && (
            <motion.div
              className={styles.countBadge}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <BookOpen size={14} />
              {books.length} ta kitob
            </motion.div>
          )}
        </div>
      </section>

      <div className={styles.container}>
        {loading ? (
          <motion.div className={styles.grid} initial="hidden" animate="visible" variants={containerVariants}>
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div key={i} variants={itemVariants} style={{ borderRadius: '18px', overflow: 'hidden', border: '1px solid var(--card-border)', background: 'var(--card-bg)' }}>
                <div className="skeleton" style={{ aspectRatio: '3/4', width: '100%' }} />
                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div className="skeleton" style={{ height: '14px', width: '80%', borderRadius: '6px' }} />
                  <div className="skeleton" style={{ height: '12px', width: '55%', borderRadius: '6px' }} />
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : books.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-secondary)' }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
            <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Bu kategoriyada hali kitob yo&apos;q
            </p>
            <p style={{ fontSize: '0.9rem' }}>
              Admin panel orqali yangi kitoblar qo&apos;shing
            </p>
          </motion.div>
        ) : (
          <motion.div
            className={styles.grid}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {books.map(book => (
              <motion.div key={book.id} variants={itemVariants}>
                <BookCard {...book} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </main>
  );
}
