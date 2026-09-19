"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, BookOpen } from 'lucide-react';
import { motion, Variants } from 'framer-motion';
import BookCard from './BookCard';
import { api, Book } from '@/app/lib/api';
import styles from './TrendingBooks.module.css';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

export default function TrendingBooks() {
  const [trending, setTrending] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await api.getBooks();
      setTrending(data ? data.slice(0, 8) : []);
      setLoading(false);
    }
    load();
  }, []);

  // Yuklanayotganda skeleton ko'rsatish
  if (loading) {
    return (
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div>
              <div className={styles.badge}>🔥 Eng ko&apos;p o&apos;qilgan</div>
              <h2 className={styles.title}>Trenddagi kitoblar</h2>
            </div>
          </div>
          <div className={styles.grid}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ borderRadius: '18px', overflow: 'hidden', border: '1px solid var(--card-border)', background: 'var(--card-bg)' }}>
                <div className="skeleton" style={{ aspectRatio: '3/4', width: '100%' }} />
                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div className="skeleton" style={{ height: '14px', width: '80%', borderRadius: '6px' }} />
                  <div className="skeleton" style={{ height: '12px', width: '55%', borderRadius: '6px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Kitoblar bo'sh bo'lsa seksiyani yashirish
  if (trending.length === 0) {
    return null;
  }

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <div className={styles.badge}>🔥 Eng ko&apos;p o&apos;qilgan</div>
            <h2 className={styles.title}>Trenddagi kitoblar</h2>
          </div>
          <Link href="/search" className={styles.viewAll} aria-label="Barchasini ko'rish">
            Barchasini ko&apos;rish
            <ChevronRight size={18} />
          </Link>
        </div>

        <motion.div
          className={styles.grid}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {trending.map(book => (
            <motion.div key={book.id} variants={itemVariants}>
              <BookCard {...book} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
