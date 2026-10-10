"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import styles from './page.module.css';
import dynamic from 'next/dynamic';
const BookActions = dynamic(() => import('./BookActions').then((m) => m.default));
import { api } from '@/app/lib/api';
import ImageZoom from './ImageZoom';
import BookReviews from './BookReviews';
import type { Book } from '@/app/lib/api';

export default function BookDetails() {
  const params = useParams();
  const id = params?.id as string;

  const [book, setBook] = useState<Book | null>(null);
  const [recommended, setRecommended] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    async function load() {
      setLoading(true);
      // 1. Check localStorage admin_books first (locally added books)
      try {
        const adminBooks: any[] = JSON.parse(localStorage.getItem('admin_books') || '[]');
        const localBook = adminBooks.find((b: any) => String(b.id) === String(id));
        if (localBook) {
          const mapped: Book = {
            id: String(localBook.id),
            title: localBook.title || '',
            author: localBook.author || '',
            price: localBook.price || "0 so'm",
            rating: Number(localBook.rating) || 0,
            image: localBook.image || localBook.imageUrl || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop',
            category: localBook.category || 'Badiiy',
            description: localBook.description || '',
            pages: Number(localBook.pages) || 0,
            language: localBook.language || "O'zbek tili",
            publishedYear: Number(localBook.publishedYear) || 2024,
            hasAudio: !!localBook.hasAudio,
            audioUrl: localBook.audioUrl || '',
          };
          setBook(mapped);
          setLoading(false);
          return;
        }
      } catch {}

      // 2. Fall back to API / booksDB
      const found = await api.getBook(id);
      setBook(found);
      if (found) {
        const recs = await api.getRecommendedBooks(found.id);
        setRecommended(recs);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <main className={styles.main}>
        <div className={styles.container} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid var(--theme-hover)', borderTopColor: 'var(--theme-color, var(--accent-blue))', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </main>
    );
  }

  if (!book) {
    return (
      <main className={styles.main}>
        <div className={styles.container} style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Kitob topilmadi</h2>
          <Link href="/" style={{ color: 'var(--accent-blue)' }}>← Bosh sahifaga qaytish</Link>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <Link href="/" className={styles.backButton}>
          <ArrowLeft size={20} />
          <span>Orqaga qaytish</span>
        </Link>

        <div className={styles.content}>
          <div className={styles.imageSection}>
            <div className={styles.imageWrapper}>
              <ImageZoom src={book.image} alt={book.title} />
            </div>
          </div>

          <div className={styles.infoSection}>
            <div className={styles.badge}>{book.category}</div>
            <h1 className={styles.title}>{book.title}</h1>
            <p className={styles.author}>{book.author}</p>

            <div className={styles.metaRow}>
              <div className={styles.rating}>
                <span className={styles.star}>★</span>
                <span>{book.rating}</span>
              </div>
              <div className={styles.divider}>•</div>
              <div className={styles.metaItem}>{book.pages} bet</div>
              <div className={styles.divider}>•</div>
              <div className={styles.metaItem}>{book.language}</div>
              <div className={styles.divider}>•</div>
              <div className={styles.metaItem}>{book.publishedYear}</div>
            </div>

            <div className={styles.priceRow}>
              <span className={styles.price}>{book.price}</span>
            </div>

            <BookActions book={book} recommended={recommended} />
          </div>
        </div>

        <BookReviews bookId={book.id} />
      </div>
    </main>
  );
}
