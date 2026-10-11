"use client";
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { api, Book } from '@/app/lib/api';
import styles from './Hero.module.css';

const MAX_CHARS = 120;

export default function Hero() {
  const [heroBook, setHeroBook] = useState<Book | null>(null);
  const [descExpanded, setDescExpanded] = useState(false);

  useEffect(() => {
    async function load() {
      // 1. First check admin_books in localStorage for an explicit weekly top pick
      try {
        const adminBooks = JSON.parse(localStorage.getItem('admin_books') || '[]');
        const adminWeekly = adminBooks.find((b: any) => b.is_weekly_top === true || b.isWeeklyTop === true);
        if (adminWeekly) {
          setHeroBook(adminWeekly);
          return;
        }
      } catch {}

      // 2. Fall back to API books — ONLY pick if explicitly flagged as weekly top!
      const books = await api.getBooks();
      if (books && books.length > 0) {
        const top = books.find(b => (b as any).is_weekly_top === true || (b as any).isWeeklyTop === true);
        if (top) {
          setHeroBook(top);
          return;
        }
      }

      // If no book has weekly top enabled, show default classic hero ("O'tkan kunlar")
      setHeroBook(null);
    }
    load();
  }, []);

  const bookTitle  = heroBook ? heroBook.title : "O'tkan kunlar";
  const bookAuthor = heroBook ? `Muallif: ${heroBook.author}` : "Muallif: Abdulla Qodiriy";
  const bookDesc   = heroBook ? heroBook.description : "O'zbek adabiyotidagi birinchi roman. Asarda XIX asr o'rtalaridagi Toshkent va Qo'qon hayoti, muhabbat va xiyonat, qahramonlik va fojia tasvirlangan.";
  const bookLink   = heroBook ? `/book/${heroBook.id}` : "/book/1";
  const bookImage  = heroBook ? heroBook.image : "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop";

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
            <Link href={bookLink} className={styles.secondaryBtn}>Batafsil ma&apos;lumot</Link>
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
