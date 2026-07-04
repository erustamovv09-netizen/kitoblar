import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import styles from './page.module.css';
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';
const BookActions = dynamic(() => import('./BookActions').then((m) => m.default));
import { api } from '@/app/lib/api';
import ImageZoom from './ImageZoom';
import BookReviews from './BookReviews';

export default async function BookDetails({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const book = await api.getBook(resolvedParams.id);

  if (!book) {
    notFound();
  }

  const recommended = await api.getRecommendedBooks(book.id);

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
