"use client";
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { api, Book } from '@/app/lib/api';
import styles from './Hero.module.css';

export default function Hero() {
  const [heroBook, setHeroBook] = useState<Book | null>(null);

  useEffect(() => {
    async function load() {
      const books = await api.getBooks();
      if (books && books.length > 0) {
        // Find weekly top or fallback to first book
        const top = books.find(b => (b as any).is_weekly_top || (b as any).is_trending) || books[0];
        setHeroBook(top);
      }
    }
    load();
  }, []);

  const bookTitle = heroBook ? heroBook.title : "O'tkan kunlar";
  const bookAuthor = heroBook ? `Muallif: ${heroBook.author}` : "Muallif: Abdulla Qodiriy";
  const bookDesc = heroBook ? heroBook.description : "O'zbek adabiyotidagi birinchi roman. Asarda XIX asr o'rtalaridagi Toshkent va Qo'qon hayoti, muhabbat va xiyonat, qahramonlik va fojia tasvirlangan.";
  const bookLink = heroBook ? `/book/${heroBook.id}` : "/book/hero";
  const bookImage = heroBook ? heroBook.image : "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop";

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
          <motion.p
            className={styles.description}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            {bookDesc}
          </motion.p>
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
