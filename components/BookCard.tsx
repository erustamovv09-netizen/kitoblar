"use client";
import Image from 'next/image';
import { Star, Heart, Headphones, Flame, Clock } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { api } from '@/app/lib/api';
import styles from './BookCard.module.css';

interface BookCardProps {
  id: string;
  title: string;
  author: string;
  price: string;
  rating: number;
  image: string;
  category: string;
  hasAudio?: boolean;
  sale_price?: number | null;
  salePrice?: string;
  discount_expires_at?: string | null;
  discountExpiresAt?: string | null;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop';

function CardCountdown({ expiresAt }: { expiresAt: string }) {
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
    <div className={styles.discountTimer} title="Chegirma tugashiga qolgan vaqt">
      <Clock size={11} className={styles.timerIcon} />
      <span>
        {left.d > 0 ? `${left.d}k ` : ''}
        {String(left.h).padStart(2, '0')}:{String(left.m).padStart(2, '0')}:{String(left.s).padStart(2, '0')}
      </span>
    </div>
  );
}

export default function BookCard({
  id,
  title,
  author,
  price,
  rating,
  image,
  category,
  hasAudio,
  sale_price,
  salePrice,
  discount_expires_at,
  discountExpiresAt,
}: BookCardProps) {
  const [isFav, setIsFav] = useState(false);
  const [imgSrc, setImgSrc] = useState(image || FALLBACK_IMAGE);
  const [currentRating, setCurrentRating] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`book_rating_${id}`);
        if (stored && !isNaN(Number(stored))) return Number(stored);
      } catch {}
    }
    return rating;
  });

  const numericPrice = Number(String(price || '').replace(/[^\d]/g, '')) || 0;
  const saleNum = Number(String(sale_price || salePrice || '').replace(/[^\d]/g, '')) || 0;
  
  const expStr = discount_expires_at || discountExpiresAt;
  const isExpired = expStr ? new Date(expStr).getTime() < Date.now() : false;
  
  const hasDiscount = saleNum > 0 && numericPrice > 0 && saleNum < numericPrice && !isExpired;
  const discountPercent = hasDiscount ? Math.round((1 - saleNum / numericPrice) * 100) : 0;

  useEffect(() => {
    setImgSrc(image || FALLBACK_IMAGE);
  }, [image]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('favorites');
      if (!raw) return;
      const favs: BookCardProps[] = JSON.parse(raw);
      setIsFav(favs.some(f => f.id === id));
    } catch (e) {
      console.error(e);
    }
  }, [id]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`book_rating_${id}`);
        if (stored && !isNaN(Number(stored))) {
          setCurrentRating(Number(stored));
        } else {
          api.getReviews(id).then(revs => {
            if (Array.isArray(revs) && revs.length > 0) {
              const avg = Math.round((revs.reduce((sum, r) => sum + r.rating, 0) / revs.length) * 10) / 10;
              setCurrentRating(avg);
              try {
                localStorage.setItem(`book_rating_${id}`, String(avg));
                localStorage.setItem(`book_reviews_count_${id}`, String(revs.length));
              } catch {}
            }
          }).catch(() => {});
        }
      } catch {}
    }

    const handleRatingUpdate = (e: any) => {
      try {
        if (e?.detail?.bookId && String(e.detail.bookId) !== String(id)) return;
        if (e?.detail?.avg) {
          setCurrentRating(Math.round(e.detail.avg * 10) / 10);
        } else if (typeof window !== 'undefined') {
          const stored = localStorage.getItem(`book_rating_${id}`);
          if (stored && !isNaN(Number(stored))) {
            setCurrentRating(Number(stored));
          }
        }
      } catch {}
    };

    window.addEventListener('reviews-updated', handleRatingUpdate);
    return () => window.removeEventListener('reviews-updated', handleRatingUpdate);
  }, [id, rating]);

  function toggleFavorite(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    try {
      const raw = localStorage.getItem('favorites');
      const favs: BookCardProps[] = raw ? JSON.parse(raw) : [];
      const exists = favs.some(f => f.id === id);
      let next: BookCardProps[];
      if (exists) {
        next = favs.filter(f => f.id !== id);
      } else {
        next = [{ id, title, author, price, rating, image, category }, ...favs];
      }
      localStorage.setItem('favorites', JSON.stringify(next));
      setIsFav(!exists);
    } catch (err) {
      console.error('Failed to toggle favorite', err);
    }
  }
  return (
    <Link href={`/book/${id}`} style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', textDecoration: 'none' }}>
      <motion.div
        className={styles.card}
        style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}
        whileHover={{
          scale: 1.03,
          y: -10,
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4)"
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <div className={styles.imageContainer}>
          <button
            className={styles.favBtn}
            onClick={toggleFavorite}
            aria-pressed={isFav}
            aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
            title={isFav ? 'Sevimlilardan olib tashlash' : 'Sevimlilarga qoʻshish'}
          >
            <Heart size={18} fill={isFav ? 'currentColor' : 'none'} />
          </button>
          <Image
            src={imgSrc}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            unoptimized
            className={styles.image}
            onError={() => setImgSrc(FALLBACK_IMAGE)}
          />
          {hasDiscount && (
            <div className={styles.discountBadge}>
              <Flame size={12} fill="#fff" />
              <span>-{discountPercent}%</span>
            </div>
          )}
          <div className={styles.badge}>{category}</div>
          {hasAudio && (
            <div className={styles.audioBadge} title="Audio format mavjud">
              <Headphones size={14} />
            </div>
          )}
        </div>
        <div className={styles.content}>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.author}>{author}</p>
          {hasDiscount && (
            <CardCountdown expiresAt={expStr || new Date(Date.now() + 7 * 86400000).toISOString()} />
          )}
          <div className={styles.footer}>
            <div className={styles.rating}>
              <Star className={styles.starIcon} size={16} fill="currentColor" />
              <span>{currentRating}</span>
            </div>
            {hasDiscount ? (
              <div className={styles.priceWrapper}>
                <span className={styles.oldPrice}>{price}</span>
                <span className={styles.salePrice}>{saleNum.toLocaleString('uz-UZ')} so&apos;m</span>
              </div>
            ) : (
              <div className={styles.price}>{price}</div>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
