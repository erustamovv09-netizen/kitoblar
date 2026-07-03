"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import BookCard from '@/components/BookCard';
import { api, Book } from '@/app/lib/api';
import styles from './page.module.css';
import { notFound, useParams } from 'next/navigation';
import { motion, Variants } from 'framer-motion';

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
    }
  ],
  'biznes': [
    {
      id: 'b1',
      title: 'Atom odatlar (Atomic Habits)',
      author: 'Jeyms Klir',
      price: "65,000 so'm",
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=800&auto=format&fit=crop',
      category: 'Shaxsiy rivojlanish'
    },
    {
      id: 'b2',
      title: 'Boy ota, kambagʻal ota',
      author: 'Robert Kiyosaki',
      price: "70,000 so'm",
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?q=80&w=800&auto=format&fit=crop',
      category: 'Moliya'
    }
  ],
  'ilmiy': [
    {
      id: 'i1',
      title: 'Sapiens: Insoniyatning qisqacha tarixi',
      author: 'Yuval Nuh Harari',
      price: "85,000 so'm",
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=800&auto=format&fit=crop',
      category: 'Tarix'
    },
    {
      id: 'i2',
      title: 'Koinotning qisqacha tarixi',
      author: 'Stiven Hoking',
      price: "60,000 so'm",
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=800&auto=format&fit=crop',
      category: 'Ilmiy'
    }
  ]
};

const categoryNames = {
  'badiiy': 'Badiiy asarlar',
  'biznes': 'Biznes va Rivojlanish',
  'ilmiy': 'Ilmiy kitoblar'
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

export default function CategoryPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [dynamicBooks, setDynamicBooks] = useState<Book[]>([]);

  useEffect(() => {
    async function load() {
      const data = await api.getBooks();
      if (data && data.length > 0) {
        setDynamicBooks(data);
      }
    }
    load();
  }, []);
  
  if (!slug) return null;
  
  const categoryName = categoryNames[slug as keyof typeof categoryNames];
  if (!categoryName) {
    notFound();
  }

  // Filter helper to group backend categorizations
  const getSlugCategoryMatches = (bookCat: string, currentSlug: string) => {
    const cat = bookCat.toLowerCase();
    if (currentSlug === 'badiiy') return cat.includes('badiiy');
    if (currentSlug === 'biznes') return cat.includes('rivojlanish') || cat.includes('moliya') || cat.includes('biznes');
    if (currentSlug === 'ilmiy') return cat.includes('ilmiy') || cat.includes('tarix');
    return false;
  };

  const staticBooks = categoryBooks[slug as keyof typeof categoryBooks];
  const filteredDynamic = dynamicBooks.filter(b => getSlugCategoryMatches(b.category, slug));
  const books = filteredDynamic.length > 0 ? filteredDynamic : staticBooks;

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
