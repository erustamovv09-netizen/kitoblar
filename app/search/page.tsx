"use client";

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import BookCard from '@/components/BookCard';
import styles from '../category/[slug]/page.module.css';

const booksDB = [
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
  },
  {
    id: '3',
    title: 'Sapiens',
    author: 'Yuval Noah Harari',
    price: "85,000 so'm",
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=800&auto=format&fit=crop',
    category: 'Tarix'
  },
  {
    id: 'hero',
    title: "O'tkan kunlar",
    author: 'Abdulla Qodiriy',
    price: "45,000 so'm",
    rating: 5.0,
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop',
    category: 'Badiiy'
  }
];

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const results = booksDB.filter(book => 
    book.title.toLowerCase().includes(query.toLowerCase()) || 
    book.author.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <Link href="/" className={styles.backButton}>
        <ArrowLeft size={20} />
        <span>Bosh sahifaga qaytish</span>
      </Link>
      
      <h1 className={styles.title}>Izlash natijalari: "{query}"</h1>
      <p className={styles.description}>
        {results.length > 0 ? `${results.length} ta kitob topildi` : 'Hech qanday kitob topilmadi. Boshqa so\'z bilan izlab ko\'ring.'}
      </p>
      
      <div className={styles.grid}>
        {results.map(book => (
          <BookCard key={book.id} {...book} />
        ))}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <main className={styles.main}>
      <Suspense fallback={<div style={{ textAlign: 'center', padding: '5rem', color: 'white' }}>Yuklanmoqda...</div>}>
        <SearchContent />
      </Suspense>
    </main>
  );
}
