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
  Tag
} from 'lucide-react';
import { api, Book } from '../lib/api';
import styles from './page.module.css';

interface DiscountedBook extends Book {
  discountPercent: number;
  salePrice: number;
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
    salePrice: salePriceRaw,
    originalPrice,
    discountExpiresAt: expiresAt,
  };
}

function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const calcLeft = () => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0 };
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { d, h, m, s };
  };
  const [left, setLeft] = useState(calcLeft);
  useEffect(() => {
    const t = setInterval(() => setLeft(calcLeft()), 1000);
    return () => clearInterval(t);
  }, [expiresAt]);

  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '0.75rem', color: '#f87171', fontWeight: 700 }}>
      <Clock size={13} />
      {left.d > 0 && <span>{left.d}k </span>}
      <span>{String(left.h).padStart(2, '0')}:{String(left.m).padStart(2, '0')}:{String(left.s).padStart(2, '0')}</span>
    </div>
  );
}

export default function AksiyalarPage() {
  const [discountedBooks, setDiscountedBooks] = useState<DiscountedBook[]>([]);
  const [loading, setLoading] = useState(true);

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
                <div key={i} className={styles.bookCard} style={{ minHeight: '380px' }}>
                  <div className="skeleton" style={{ width: '100%', height: '240px' }} />
                  <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className="skeleton" style={{ height: '14px', width: '40%', borderRadius: '6px' }} />
                    <div className="skeleton" style={{ height: '20px', width: '85%', borderRadius: '6px' }} />
                    <div className="skeleton" style={{ height: '14px', width: '60%', borderRadius: '6px' }} />
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
                Admin panel orqali kitoblarga chegirma qo&apos;shilgandan so&apos;ng aksiyalar bu yerda avtomatik ko&apos;rinadi.
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
                    <Percent size={13} />
                    -{book.discountPercent}% AKSIYA
                  </div>

                  <Link href={`/book/${book.id}`} className={styles.imageWrapper}>
                    <Image
                      src={book.image}
                      alt={book.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 300px"
                      className={styles.bookImg}
                      unoptimized
                    />
                  </Link>

                  <div className={styles.bookBody}>
                    <div>
                      <div className={styles.bookMeta}>
                        <span className={styles.bookCategory}>{book.category || 'Adabiyot'}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#f59e0b', fontWeight: 600 }}>
                          <Star size={13} fill="#f59e0b" color="#f59e0b" />
                          {book.rating || 5}
                        </span>
                      </div>
                      <Link href={`/book/${book.id}`} style={{ textDecoration: 'none' }}>
                        <h3 className={styles.bookTitle}>{book.title}</h3>
                      </Link>
                      <p className={styles.bookAuthor}>{book.author}</p>
                    </div>

                    <div>
                      {book.discountExpiresAt && (
                        <div style={{ marginBottom: '6px' }}>
                          <CountdownTimer expiresAt={book.discountExpiresAt} />
                        </div>
                      )}
                      <div className={styles.priceRow}>
                        <span className={styles.salePrice}>
                          {book.salePrice.toLocaleString('uz-UZ')} so&apos;m
                        </span>
                        <span className={styles.oldPrice}>
                          {book.originalPrice.toLocaleString('uz-UZ')} so&apos;m
                        </span>
                      </div>
                      <Link href={`/book/${book.id}`} className={styles.cardBtn}>
                        <BookOpen size={16} /> Batafsil &amp; Xarid
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Afzalliklar va Kafolatlar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.5rem',
          marginTop: '4rem',
          padding: '2rem',
          borderRadius: '20px',
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          textAlign: 'center'
        }}>
          <div>
            <ShieldCheck size={32} color="#10b981" style={{ margin: '0 auto 10px' }} />
            <h4 style={{ margin: '0 0 6px', fontWeight: 700 }}>100% Kafolatlangan sifat</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Barcha asarlar to&apos;liq va sifatli tahrirdan o&apos;tgan</p>
          </div>
          <div>
            <Tag size={32} color="#9b6dff" style={{ margin: '0 auto 10px' }} />
            <h4 style={{ margin: '0 0 6px', fontWeight: 700 }}>Haqiqiy chegirmalar</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Chegirmalar admin panel orqali belgilanadi va muddatli bo&apos;ladi</p>
          </div>
          <div>
            <Zap size={32} color="#f59e0b" style={{ margin: '0 auto 10px' }} />
            <h4 style={{ margin: '0 0 6px', fontWeight: 700 }}>Tezkor dostup</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Xarid qilgan zahotingiz darhol mutolaani boshlaysiz</p>
          </div>
          <div>
            <Gift size={32} color="#f43f5e" style={{ margin: '0 auto 10px' }} />
            <h4 style={{ margin: '0 0 6px', fontWeight: 700 }}>Doimiy yangi aksiyalar</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Har haftada yangi kitoblarga maxsus chegirmalar</p>
          </div>
        </div>
      </div>
    </main>
  );
}
