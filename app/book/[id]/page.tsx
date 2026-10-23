"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock } from 'lucide-react';
import styles from './page.module.css';
import dynamic from 'next/dynamic';
const BookActions = dynamic(() => import('./BookActions').then((m) => m.default));
import { api } from '@/app/lib/api';
import ImageZoom from './ImageZoom';
import BookReviews from './BookReviews';
import type { Book } from '@/app/lib/api';

function DetailCountdown({ expiresAt }: { expiresAt: string }) {
  const [mounted, setMounted] = useState(false);
  const calc = () => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return null;
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { d, h, m, s };
  };

  const [left, setLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    setMounted(true);
    setLeft(calc());
    const t = setInterval(() => {
      setLeft(calc());
    }, 1000);
    return () => clearInterval(t);
  }, [expiresAt]);

  if (!mounted || !left) return null;

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      background: 'rgba(239, 68, 68, 0.12)',
      border: '1px solid rgba(239, 68, 68, 0.28)',
      color: '#f87171',
      fontSize: '0.82rem',
      fontWeight: 700,
      padding: '5px 12px',
      borderRadius: '99px',
    }}>
      <Clock size={14} style={{ color: '#ef4444' }} />
      <span>
        Qolgan vaqt: {left.d > 0 ? `${left.d}k ` : ''}
        {String(left.h).padStart(2, '0')}:{String(left.m).padStart(2, '0')}:{String(left.s).padStart(2, '0')}
      </span>
    </div>
  );
}

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
      // Load book details and recommended books via API
      try {
        const found = await api.getBook(id);
        setBook(found);
        if (found) {
          const recs = await api.getRecommendedBooks(found.id);
          setRecommended(recs || []);
        }
      } catch (err) {
        console.error('Failed to load book:', err);
      } finally {
        setLoading(false);
      }
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
          <Link href="/" style={{ color: 'var(--theme-color)' }}>← Bosh sahifaga qaytish</Link>
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

            {(() => {
              const numericPrice = Number(String(book.price || '').replace(/[^\d]/g, '')) || 0;
              const saleNum = Number(String((book as any).sale_price || (book as any).salePrice || '').replace(/[^\d]/g, '')) || 0;
              const expStr = (book as any).discount_expires_at || (book as any).discountExpiresAt;
              const isExpired = expStr ? new Date(expStr).getTime() < Date.now() : false;
              const hasDiscount = saleNum > 0 && numericPrice > 0 && saleNum < numericPrice && !isExpired;
              const discountPercent = hasDiscount ? Math.round((1 - saleNum / numericPrice) * 100) : 0;

              return (
                <>
                  <div className={styles.priceRow}>
                    {hasDiscount ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ef4444' }}>
                          {saleNum.toLocaleString('uz-UZ')} so&apos;m
                        </span>
                        <span style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', textDecoration: 'line-through', opacity: 0.8 }}>
                          {book.price}
                        </span>
                        <span style={{
                          background: 'linear-gradient(135deg, #ef4444, #f97316)',
                          color: '#fff',
                          padding: '4px 10px',
                          borderRadius: '99px',
                          fontSize: '0.8rem',
                          fontWeight: 700
                        }}>
                          -{discountPercent}% AKSIYA
                        </span>
                        <DetailCountdown expiresAt={expStr || new Date(Date.now() + 7 * 86400000).toISOString()} />
                      </div>
                    ) : (
                      <span className={styles.price}>{book.price}</span>
                    )}
                  </div>

                  {/* Format narxlari: Elektron va Qog'oz */}
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '12px', marginBottom: '8px' }}>
                    <div style={{
                      padding: '8px 12px',
                      borderRadius: '10px',
                      background: 'rgba(79, 142, 247, 0.1)',
                      border: '1px solid rgba(79, 142, 247, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.85rem'
                    }}>
                      <span>📱</span>
                      <span style={{ color: 'var(--text-secondary)' }}>Elektron{book.hasAudio ? ' + Audio' : ''}:</span>
                      <strong style={{ color: '#38bdf8' }}>{book.priceElectronic || (saleNum > 0 ? `${saleNum.toLocaleString('uz-UZ')} so'm` : book.price)}</strong>
                    </div>

                    <div style={{
                      padding: '8px 12px',
                      borderRadius: '10px',
                      background: 'rgba(155, 109, 255, 0.1)',
                      border: '1px solid rgba(155, 109, 255, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.85rem'
                    }}>
                      <span>📖</span>
                      <span style={{ color: 'var(--text-secondary)' }}>Qog&apos;oz kitob:</span>
                      <strong style={{ color: '#a78bfa' }}>{book.pricePaper || book.price}</strong>
                    </div>
                  </div>
                </>
              );
            })()}

            <BookActions book={book} recommended={recommended} />
          </div>
        </div>

        <BookReviews bookId={book.id} />
      </div>
    </main>
  );
}
