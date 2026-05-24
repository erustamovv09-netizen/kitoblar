"use client";
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import BookCard from './BookCard';
import styles from './TrendingBooks.module.css';

const books = [
  {
    id: '1',
    title: 'Atomic Habits',
    author: 'James Clear',
    price: "65,000 so'm",
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=800&auto=format&fit=crop',
    category: 'Shaxsiy rivojlanish',
  },
  {
    id: '2',
    title: 'Ikigai',
    author: 'Hector Garcia',
    price: "50,000 so'm",
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop',
    category: 'Falsafa',
  },
  {
    id: '3',
    title: 'Sapiens',
    author: 'Yuval Noah Harari',
    price: "85,000 so'm",
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=800&auto=format&fit=crop',
    category: 'Tarix',
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

export default function TrendingBooks() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Trenddagi kitoblar</h2>
          <Link href="/" className={styles.viewAll}>
            Barchasini ko'rish
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
          {books.map(book => (
            <motion.div key={book.id} variants={itemVariants}>
              <BookCard {...book} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
