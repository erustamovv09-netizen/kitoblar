"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { motion, Variants } from 'framer-motion';
import BookCard from './BookCard';
import { api, Book } from '@/app/lib/api';
import styles from './TrendingBooks.module.css';

const books = [
  {
    id: '1',
    title: "O'tkan kunlar",
    author: 'Abdulla Qodiriy',
    price: "45,000 so'm",
    rating: 5.0,
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop',
    category: 'Badiiy',
  },
  {
    id: '2',
    title: 'Ikki eshik orasi',
    author: "O'tkir Hoshimov",
    price: "55,000 so'm",
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=800&auto=format&fit=crop',
    category: 'Badiiy',
  },
  {
    id: '3',
    title: 'Mehrobdan chayon',
    author: 'Abdulla Qodiriy',
    price: "40,000 so'm",
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?q=80&w=800&auto=format&fit=crop',
    category: 'Badiiy',
  },
  {
    id: '4',
    title: 'Shaytanat (1-kitob)',
    author: 'Tohir Malik',
    price: "60,000 so'm",
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=800&auto=format&fit=crop',
    category: 'Detektiv',
  },
  {
    id: '5',
    title: 'Sariq devni minib',
    author: "Xudoyberdi To'xtaboyev",
    price: "35,000 so'm",
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop',
    category: 'Bolalar adabiyoti',
  },
  {
    id: '6',
    title: 'Yulduzli tunlar',
    author: 'Pirimqul Qodirov',
    price: "50,000 so'm",
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=800&auto=format&fit=crop',
    category: 'Tarixiy',
  },
  {
    id: '7',
    title: 'Choliqushi',
    author: 'Rashod Nuri Guntekin',
    price: "45,000 so'm",
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?q=80&w=800&auto=format&fit=crop',
    category: 'Jahon adabiyoti',
  },
  {
    id: '8',
    title: 'Alximik',
    author: 'Paulo Koelo',
    price: "38,000 so'm",
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=800&auto=format&fit=crop',
    category: 'Jahon adabiyoti',
  },
];

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

  useEffect(() => {
    async function load() {
      const data = await api.getBooks();
      if (data && data.length > 0) {
        setTrending(data.slice(0, 8));
      }
    }
    load();
  }, []);

  const activeBooks = trending.length > 0 ? trending : books;

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
          {activeBooks.map(book => (
            <motion.div key={book.id} variants={itemVariants}>
              <BookCard {...book} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
