"use client";

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import BookCard from '@/components/BookCard';
import styles from './page.module.css';
import { notFound, useParams } from 'next/navigation';
import { motion } from 'framer-motion';

const categoryBooks = {
  'badiiy': [
    {
      id: 'hero',
      title: "O'tkan kunlar",
      author: 'Abdulla Qodiriy',
      price: "45,000 so'm",
      rating: 5.0,
      image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop',
      category: 'Badiiy'
    }
  ],
  'biznes': [
    {
      id: '1',
      title: 'Atomic Habits',
      author: 'James Clear',
      price: "65,000 so'm",
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=800&auto=format&fit=crop',
      category: 'Shaxsiy rivojlanish'
    },
    {
      id: '2',
      title: 'Ikigai',
      author: 'Hector Garcia',
      price: "50,000 so'm",
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop',
      category: 'Falsafa'
    }
  ],
  'ilmiy': [
    {
      id: '3',
      title: 'Sapiens',
      author: 'Yuval Noah Harari',
      price: "85,000 so'm",
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=800&auto=format&fit=crop',
      category: 'Tarix'
    }
  ]
};

const categoryNames = {
  'badiiy': 'Badiiy asarlar',
  'biznes': 'Biznes va Rivojlanish',
  'ilmiy': 'Ilmiy kitoblar'
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

export default function CategoryPage() {
  const params = useParams();
  const slug = params?.slug as string;
  
  if (!slug) return null;
  
  const books = categoryBooks[slug as keyof typeof categoryBooks];
  const categoryName = categoryNames[slug as keyof typeof categoryNames];
  
  if (!books) {
    notFound();
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
          <Link href="/" className={styles.backButton}>
            <ArrowLeft size={20} />
            <span>Bosh sahifaga qaytish</span>
          </Link>
        </motion.div>
        
        <motion.h1 
          className={styles.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {categoryName}
        </motion.h1>
        <motion.p 
          className={styles.description}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Ushbu bo'limda eng yaxshi {categoryName.toLowerCase()}ni topishingiz mumkin.
        </motion.p>
        
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
      </div>
    </main>
  );
}
