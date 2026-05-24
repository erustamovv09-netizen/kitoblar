"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import BookCard from '@/components/BookCard';
import styles from './favorites.module.css';

type Book = {
    id: string;
    title: string;
    author: string;
    price: string;
    rating: number;
    image: string;
    category: string;
};

export default function FavoritesPage() {
    const [favorites, setFavorites] = useState<Book[]>([]);

    useEffect(() => {
        try {
            const raw = localStorage.getItem('favorites');
            if (raw) setFavorites(JSON.parse(raw));
        } catch (e) {
            console.error('Failed to load favorites', e);
        }
    }, []);

    return (
        <main style={{ padding: '2rem' }}>
            <h1>Sevimlilar</h1>
            {favorites.length === 0 ? (
                <div>
                    <p>Hozircha sevimlilar ro'yxatingiz bo'sh.</p>
                    <p>
                        Trenddagi kitoblarga qaytish: <Link href="/">Bosh sahifa</Link>
                    </p>
                </div>
            ) : (
                <div className={styles.grid}>
                    {favorites.map((b) => (
                        <div key={b.id} className={styles.cardWrapper}>
                            <BookCard {...b} />
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
}

