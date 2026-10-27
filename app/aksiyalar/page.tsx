"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Flame,
  Clock,
  Percent,
  BookOpen,
  ShieldCheck,
  Zap,
  Gift,
  Star,
  Tag,
  Eye,
  ShoppingBag,
  CheckCircle2
} from 'lucide-react';
import { api, Book } from '../lib/api';
import PurchaseModal from '@/components/PurchaseModal';
import styles from './page.module.css';

interface DiscountedBook extends Book {
  discountPercent: number;
  salePriceNum: number;
  originalPrice: number;
  discountExpiresAt?: string | null;
}

function parsePrice(priceStr: string): number {
  if (!priceStr) return 0;
  return Number(String(priceStr).replace(/[^\d]/g, '')) || 0;
}

function getDiscountInfo(book: Book): DiscountedBook | null {
  const originalPrice = parsePrice(book.price || '');
  const salePriceRaw = parsePrice((book as any).sale_price || (book as any).salePrice || '');

  if (!salePriceRaw || !originalPrice || salePriceRaw >= originalPrice) return null;

  const discountPercent = Math.round((1 - salePriceRaw / originalPrice) * 100);
  if (discountPercent < 1) return null;

  const expiresAt = (book as any).discount_expires_at || (book as any).discountExpiresAt || null;

  // If discount is expired — skip
  if (expiresAt) {
    const expDate = new Date(expiresAt);
    if (expDate < new Date()) return null;
  }

  return {
    ...book,
    discountPercent,
    salePriceNum: salePriceRaw,
    originalPrice,
    discountExpiresAt: expiresAt,
  };
}

function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [mounted, setMounted] = useState(false);
  const calcLeft = () => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0 };
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { d, h, m, s };
  };
  const [left, setLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);
  useEffect(() => {
    setMounted(true);
    setLeft(calcLeft());
    const t = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      setLeft(calcLeft());
    }, 1000);
    return () => clearInterval(t);
  }, [expiresAt]);

  if (!mounted || !left) return null;

  return (
    <div className={styles.timerBadge} title="Chegirma muddati tugashiga qolgan vaqt">
      <Clock size={11} className={styles.timerIcon} />
      <span>
        {left.d > 0 && `${left.d}k `}
        {String(left.h).padStart(2, '0')}:{String(left.m).padStart(2, '0')}:{String(left.s).padStart(2, '0')}
      </span>
    </div>
  );
}

function AksiyaBookRating({ bookId, initialRating }: { bookId: string | number; initialRating?: number }) {
  const [rating, setRating] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`book_rating_${bookId}`);
        if (stored && !isNaN(Number(stored))) return Number(stored);
      } catch { }
    }
    return initialRating || 5;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`book_rating_${bookId}`);
        if (stored && !isNaN(Number(stored))) {
          setRating(Number(stored));
        } else {
          // Mahalliy xotiradagi sharhlarni 0ms kechikish bilan o'qish (tarmoqni band qilmaydi)
          const rawRevs = localStorage.getItem(`reviews_${bookId}`);
          if (rawRevs) {
            const revs = JSON.parse(rawRevs);
            if (Array.isArray(revs) && revs.length > 0) {
              const avg = Math.round((revs.reduce((sum: number, r: any) => sum + Number(r.rating || 5), 0) / revs.length) * 10) / 10;
              setRating(avg);
              localStorage.setItem(`book_rating_${bookId}`, String(avg));
              localStorage.setItem(`book_reviews_count_${bookId}`, String(revs.length));
            }
          }
        }
      } catch { }
    }

    const handleRatingUpdate = (e: any) => {
      try {
        if (e?.detail?.bookId && String(e.detail.bookId) !== String(bookId)) return;
        if (e?.detail?.avg) {
          setRating(Math.round(e.detail.avg * 10) / 10);
        } else if (typeof window !== 'undefined') {
          const stored = localStorage.getItem(`book_rating_${bookId}`);
          if (stored && !isNaN(Number(stored))) {
            setRating(Number(stored));
          }
        }
      } catch { }
    };

    window.addEventListener('reviews-updated', handleRatingUpdate);
    return () => window.removeEventListener('reviews-updated', handleRatingUpdate);
  }, [bookId, initialRating]);

  return (
    <span className={styles.ratingBadge}>
      <Star size={12} fill="#f59e0b" color="#f59e0b" />
      <span>{rating}</span>
    </span>
  );
}

function AksiyalarImage({ src, alt }: { src: string; alt: string }) {
  const FALLBACK = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop';
  const [img, setImg] = useState(src || FALLBACK);
  useEffect(() => {
    setImg(src || FALLBACK);
  }, [src]);

  return (
    <Image
      src={img}
      alt={alt}
      fill
      sizes="(max-width: 768px) 50vw, 300px"
      className={styles.bookImg}
      unoptimized
      onError={() => setImg(FALLBACK)}
    />
  );
}

export default function AksiyalarPage() {
  const [discountedBooks, setDiscountedBooks] = useState<DiscountedBook[]>(() => {
    const initial = api.getInitialBooks();
    return (initial || []).map(getDiscountInfo).filter(Boolean) as DiscountedBook[];
  });
  const [loading, setLoading] = useState(false);
  const [purchasedIds, setPurchasedIds] = useState<string[]>([]);
  const [selectedBookForPurchase, setSelectedBookForPurchase] = useState<DiscountedBook | null>(null);

  useEffect(() => {
    function readPurchases() {
      try {
        const raw = localStorage.getItem('purchased_books');
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            setPurchasedIds(list.map((p: any) => String(p.id)));
          }
        }
      } catch { }
    }
    readPurchases();
    window.addEventListener('book-purchased', readPurchases);
    window.addEventListener('storage', readPurchases);
    return () => {
      window.removeEventListener('book-purchased', readPurchases);
      window.removeEventListener('storage', readPurchases);
    };
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getBooks();
        const withDiscount: DiscountedBook[] = (data || [])
          .map(getDiscountInfo)
          .filter(Boolean) as DiscountedBook[];
        setDiscountedBooks(withDiscount);
      } catch (err) {
        console.error("Aksiyalar kitoblarini yuklashda xatolik:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <main className={styles.page}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <motion.div
          className={styles.heroContent}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className={styles.badge}>
            <Flame size={16} />
            Cheklangan vaqtdagi aksiyalar
          </div>
          <h1 className={styles.title}>
            Eng sara kitoblarga <br /> maxsus chegirmalar!
          </h1>
          <p className={styles.subtitle}>
            Admin tomonidan belgilangan haqiqiy chegirmalar. Chegirma muddati tugashidan oldin xarid qiling!
          </p>
        </motion.div>
      </section>

      <div className={styles.container}>
        {/* Aksiyadagi Kitoblar Katalogi */}
        <section>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionBadge}>Maxsus Narxlar</span>
            <h2 className={styles.sectionTitle}>Aksiya doirasidagi kitoblar</h2>
            <p className={styles.sectionSubtitle}>
              Hozirgi vaqtda chegirmaga ega kitoblar — chegirma adminda belgilanadi
            </p>
          </div>

          {loading ? (
            <div className={styles.booksGrid}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={styles.bookCard}>
                  <div className="skeleton" style={{ width: '100%', aspectRatio: '3 / 4' }} />
                  <div style={{ padding: '0.85rem 0.65rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div className="skeleton" style={{ height: '12px', width: '40%', borderRadius: '4px' }} />
                    <div className="skeleton" style={{ height: '16px', width: '85%', borderRadius: '4px' }} />
                    <div className="skeleton" style={{ height: '12px', width: '60%', borderRadius: '4px' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : discountedBooks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                textAlign: 'center',
                padding: '5rem 2rem',
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '20px'
              }}
            >
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏷️</div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Hozircha aktiv aksiya yo&apos;q
              </h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
                Admin kitoblarga chegirma qo&apos;shgandan so&apos;ng aksiyalar bu yerda avtomatik ko&apos;rinadi.
              </p>
              <Link
                href="/books"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '10px 22px', background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
                  borderRadius: '10px', color: '#fff', fontWeight: 700, textDecoration: 'none', fontSize: '0.92rem'
                }}
              >
                <BookOpen size={16} /> Barcha kitoblar
              </Link>
            </motion.div>
          ) : (
            <div className={styles.booksGrid}>
              {discountedBooks.map((book, index) => (
                <motion.div
                  key={book.id}
                  className={styles.bookCard}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: (index % 4) * 0.1 }}
                >
                  <div className={styles.discountRibbon}>
                    <Percent size={11} />
                    -{book.discountPercent}% AKSIYA
                  </div>

                  <Link href={`/book/${book.id}`} className={styles.imageWrapper}>
                    <AksiyalarImage src={book.image} alt={book.title} />
                  </Link>

                  <div className={styles.bookBody}>
                    <div>
                      <div className={styles.bookMeta}>
                        <span className={styles.bookCategory}>{book.category || 'Adabiyot'}</span>
                        <AksiyaBookRating bookId={book.id} initialRating={book.rating} />
                      </div>
                      <Link href={`/book/${book.id}`} style={{ textDecoration: 'none' }}>
                        <h3 className={styles.bookTitle}>{book.title}</h3>
                      </Link>
                      <p className={styles.bookAuthor}>{book.author}</p>
                    </div>

                    <div>
                      {book.discountExpiresAt && (
                        <div>
                          <CountdownTimer expiresAt={book.discountExpiresAt} />
                        </div>
                      )}
                      <div className={styles.priceRow}>
                        <span className={styles.salePrice}>
                          {book.salePriceNum.toLocaleString('uz-UZ')} so&apos;m
                        </span>
                        <span className={styles.oldPrice}>
                          {book.originalPrice.toLocaleString('uz-UZ')} so&apos;m
                        </span>
                      </div>
                      <div className={styles.cardActions}>
                        <Link href={`/book/${book.id}`} className={styles.detailsBtn}>
                          <Eye size={13} /> Batafsil
                        </Link>
                        {purchasedIds.includes(String(book.id)) ? (
                          <Link href={`/book/${book.id}/read`} className={styles.purchasedBtn}>
                            <CheckCircle2 size={13} /> O&apos;qish
                          </Link>
                        ) : (
                          <button
                            type="button"
                            className={styles.buyBtn}
                            onClick={() => setSelectedBookForPurchase(book)}
                          >
                            <ShoppingBag size={13} /> Xarid
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Afzalliklar va Kafolatlar */}
        <div className={styles.benefitsSection}>
          <div className={styles.benefitItem}>
            <ShieldCheck size={28} color="#10b981" className={styles.benefitIcon} />
            <h4 className={styles.benefitTitle}>100% Kafolatlangan sifat</h4>
            <p className={styles.benefitText}>Barcha asarlar to&apos;liq va sifatli tahrirdan o&apos;tgan</p>
          </div>
          <div className={styles.benefitItem}>
            <Tag size={28} color="#9b6dff" className={styles.benefitIcon} />
            <h4 className={styles.benefitTitle}>Haqiqiy chegirmalar</h4>
            <p className={styles.benefitText}>Chegirmalar admin panel orqali belgilanadi va muddatli bo&apos;ladi</p>
          </div>
          <div className={styles.benefitItem}>
            <Zap size={28} color="#f59e0b" className={styles.benefitIcon} />
            <h4 className={styles.benefitTitle}>Tezkor dostup</h4>
            <p className={styles.benefitText}>Xarid qilgan zahotingiz darhol mutolaani boshlaysiz</p>
          </div>
          <div className={styles.benefitItem}>
            <Gift size={28} color="#f43f5e" className={styles.benefitIcon} />
            <h4 className={styles.benefitTitle}>Doimiy yangi aksiyalar</h4>
            <p className={styles.benefitText}>Har haftada yangi kitoblarga maxsus chegirmalar</p>
          </div>
        </div>
      </div>

      {/* Interactive Purchase Modal */}
      <PurchaseModal
        isOpen={!!selectedBookForPurchase}
        onClose={() => setSelectedBookForPurchase(null)}
        book={selectedBookForPurchase}
        onSuccess={(bookId) => {
          setPurchasedIds((prev) => Array.from(new Set([...prev, String(bookId)])));
        }}
      />
    </main>
  );
}
