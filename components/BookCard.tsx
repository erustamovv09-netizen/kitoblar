"use client";
import Image from 'next/image';
import { Star, Heart } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import styles from './BookCard.module.css';

interface BookCardProps {
  id: string;
  title: string;
  author: string;
  price: string;
  rating: number;
  image: string;
  category: string;
}

export default function BookCard({ id, title, author, price, rating, image, category }: BookCardProps) {
  const [isFav, setIsFav] = useState(false);

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
    <Link href={`/book/${id}`} style={{ display: 'block' }}>
      <motion.div
        className={styles.card}
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
            src={image}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            unoptimized
            className={styles.image}
          />
          <div className={styles.badge}>{category}</div>
        </div>
        <div className={styles.content}>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.author}>{author}</p>
          <div className={styles.footer}>
            <div className={styles.rating}>
              <Star className={styles.starIcon} size={16} fill="currentColor" />
              <span>{rating}</span>
            </div>
            <div className={styles.price}>{price}</div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
