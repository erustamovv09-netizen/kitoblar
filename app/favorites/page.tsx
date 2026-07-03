"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, ArrowLeft, BookOpen, Trash2 } from 'lucide-react';
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
    const [loaded, setLoaded] = useState(false);

    function loadFavorites() {
        try {
            const raw = localStorage.getItem('favorites');
            if (raw) setFavorites(JSON.parse(raw));
            else setFavorites([]);
        } catch (e) {
            console.error('Failed to load favorites', e);
            setFavorites([]);
        }
        setLoaded(true);
    }

    useEffect(() => {
        loadFavorites();
        window.addEventListener('fav-updated', loadFavorites);
        window.addEventListener('storage', loadFavorites);
        return () => {
            window.removeEventListener('fav-updated', loadFavorites);
            window.removeEventListener('storage', loadFavorites);
        };
    }, []);

    function clearAll() {
        localStorage.removeItem('favorites');
        setFavorites([]);
        try { window.dispatchEvent(new CustomEvent('fav-updated')); } catch {}
    }

    if (!loaded) {
        return (
            <main className={styles.main}>
                <div className={styles.loading}>Yuklanmoqda...</div>
            </main>
        );
    }

    return (
        <main className={styles.main}>
            <div className={styles.container}>
                <Link href="/" className={styles.backButton}>
                    <ArrowLeft size={18} />
                    <span>Bosh sahifaga qaytish</span>
                </Link>

                <div className={styles.header}>
                    <div>
                        <div className={styles.badge}>
                            <Heart size={14} />
                            Sevimlilar
                        </div>
                        <h1 className={styles.title}>Mening kitob javonim</h1>
                        <p className={styles.subtitle}>
                            {favorites.length > 0
                                ? `${favorites.length} ta kitob saqlangan`
                                : "Hali hech qanday kitob qo'shilmagan"}
                        </p>
                    </div>
                    {favorites.length > 0 && (
                        <button className={styles.clearBtn} onClick={clearAll}>
                            <Trash2 size={16} />
                            Hammasini o&apos;chirish
                        </button>
                    )}
                </div>

                {favorites.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            <BookOpen size={48} />
                        </div>
                        <h2 className={styles.emptyTitle}>Javon bo&apos;sh</h2>
                        <p className={styles.emptyDesc}>
                            Yoqqan kitoblarni sevimlilarga qo&apos;shing va ular shu yerda saqlansin.
                        </p>
                        <Link href="/search" className={styles.browseBtn}>
                            Kitoblarni ko&apos;rish
                        </Link>
                    </div>
                ) : (
                    <div className={styles.grid}>
                        {favorites.map((b) => (
                            <BookCard key={b.id} {...b} />
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
