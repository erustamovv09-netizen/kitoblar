"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';
import BookCard from '@/components/BookCard';
import { api, Book, getApiBaseUrl } from '@/app/lib/api';
import styles from './page.module.css';
import { useParams } from 'next/navigation';
import { motion, Variants } from 'framer-motion';

// Slug → Ko'rsatiladigan nom (navbar bilan to'liq mos)
const categoryNames: Record<string, string> = {
  'badiiy': 'Badiiy asarlar',
  'biznes': 'Biznes',
  'ilmiy': 'Ilmiy kitoblar',
  'tarixiy': 'Tarixiy kitoblar',
  'detektiv': 'Detektiv kitoblar',
  'bolalar-adabiyoti': 'Bolalar adabiyoti',
  'jahon-adabiyoti': 'Jahon adabiyoti',
  'shaxsiy-rivojlanish': 'Shaxsiy rivojlanish',
  'moliya': 'Moliya',
  'falsafa': 'Falsafa',
  'psixologiya': 'Psixologiya',
  // Qisqa sluglar uchun qo'llab-quvvatlash
  'bolalar': 'Bolalar adabiyoti',
  'jahon': 'Jahon adabiyoti',
  'shaxsiy': 'Shaxsiy rivojlanish',
};

// Kitob kategoriya nomi va slug mos kelishini tekshiradi
function matchesSlug(bookCat: string, slug: string): boolean {
  const cat = bookCat.toLowerCase().trim();
  switch (slug) {
    case 'badiiy':             return cat.includes('badiiy');
    case 'biznes':             return cat.includes('biznes');
    case 'ilmiy':              return cat.includes('ilmiy') || cat.includes('fan');
    case 'tarixiy':            return cat.includes('tarix');
    case 'detektiv':           return cat.includes('detektiv');
    case 'bolalar-adabiyoti':
    case 'bolalar':            return cat.includes('bolalar');
    case 'jahon-adabiyoti':
    case 'jahon':              return cat.includes('jahon');
    case 'shaxsiy-rivojlanish':
    case 'shaxsiy':            return cat.includes('shaxsiy') || cat.includes('rivojlanish');
    case 'moliya':             return cat.includes('moliya') || cat.includes('iqtisod');
    case 'falsafa':            return cat.includes('falsafa');
    case 'psixologiya':        return cat.includes('psixologiya');
    default:                   return cat.includes(slug.split('-')[0]);
  }
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
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
      try {
        const res = await fetch(`${getApiBaseUrl()}/books/?category=${slug}`, {
          signal: AbortSignal.timeout(3000)
        });
        if (res.ok) {
          const raw = await res.json();
          if (Array.isArray(raw) && raw.length > 0) {
            // Backend natijasini ishlatish
            const mapped = raw.map((b: any) => ({
              id: String(b.id),
              title: b.title,
              author: b.author,
              price: b.price && !String(b.price).includes("so'm")
                ? `${Number(b.price).toLocaleString('uz-UZ')} so'm`
                : b.price || "0 so'm",
              rating: Number(b.rating) || 0,
              image: b.cover_image || b.image || '',
              category: b.category_name || b.category || '',
              description: b.description || '',
              pages: Number(b.pages) || 0,
              language: b.language || "O'zbek tili",
              publishedYear: Number(b.year) || Number(b.publishedYear) || 2024,
              hasAudio: !!b.hasAudio,
              audioUrl: b.audioUrl || '',
            } as Book));
            setBooks(mapped);
            setLoading(false);
            return;
          }
        }
      } catch { /* Backend offline — pastdagi fallback ishlatiladi */ }

      // Fallback: barcha kitoblar olib, client-side filtrlash
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
              Ushbu bo&apos;limda hozircha kitoblar mavjud emas
            </p>
            <p style={{ fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              Tez kunda yangi kitoblar qo&apos;shiladi. Boshqa bo&apos;limlarni ko&apos;rib chiqishingiz mumkin.
            </p>
            <Link
              href="/search"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: 'var(--theme-color, var(--accent-blue))',
                color: '#fff',
                borderRadius: '10px',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              Barcha kitoblarni ko&apos;rish
            </Link>
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
