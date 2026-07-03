"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, Share2, BookOpen, Headphones, Package } from 'lucide-react';
import styles from './page.module.css';

type Favorite = { id: string; title: string };
type Book = {
    id: string;
    title: string;
    author: string;
    description: string;
    price: string;
    rating: number;
    hasAudio?: boolean;
    audioUrl?: string;
};

export default function BookActions({ book, recommended }: { book: Book; recommended: Book[] }) {
    const [isFav, setIsFav] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [toast, setToast] = useState('');

    useEffect(() => {
        try {
            const raw = localStorage.getItem('favorites');
            const list: Favorite[] = raw ? JSON.parse(raw) : [];
            setIsFav(list.some((f) => f.id === book.id));
        } catch {
            setIsFav(false);
        }
    }, [book.id]);

    useEffect(() => {
        // add a mount class to container for entrance animations
        const container = document.querySelector(`.${styles.container}`);
        if (container) {
            container.classList.add(styles.pageMounted || 'pageMounted');
        }
        return () => {
            if (container) container.classList.remove(styles.pageMounted || 'pageMounted');
        };
    }, []);

    function toggleFavorite() {
        try {
            const raw = localStorage.getItem('favorites');
            const list: Favorite[] = raw ? JSON.parse(raw) : [];
            let next: Favorite[];
            if (list.some((f) => f.id === book.id)) {
                next = list.filter((f) => f.id !== book.id);
                setIsFav(false);
                setToast('Sevimlilardan olindi');
            } else {
                next = [{ id: book.id, title: book.title }, ...list];
                setIsFav(true);
                setToast('Sevimlilarga qo\'shildi');
            }
            localStorage.setItem('favorites', JSON.stringify(next));
            // notify other parts of the app in the same tab
            try { window.dispatchEvent(new CustomEvent('fav-updated')); } catch { }
            setTimeout(() => setToast(''), 2000);
        } catch {
            setToast('Xatolik yuz berdi');
            setTimeout(() => setToast(''), 2000);
        }
    }

    async function shareBook() {
        if (navigator.share) {
            try {
                await navigator.share({ title: book.title, text: book.description });
            } catch { /* ignore */ }
        } else {
            // fallback: copy to clipboard
            try {
                await navigator.clipboard.writeText(window.location.href);
                setToast('Havola nusxalandi');
                setTimeout(() => setToast(''), 2000);
            } catch {
                setToast('Havola nusxalanmadi');
                setTimeout(() => setToast(''), 2000);
            }
        }
    }

    function handleBuy() {
        setToast('Sotib olish tugmasi bosildi — demo');
        setTimeout(() => setToast(''), 2000);
    }
    
    function handleOrderPhysical() {
        setToast("Qog'oz kitob buyurtma qilish — tez kunda");
        setTimeout(() => setToast(''), 2000);
    }

    const shortDesc = book.description.slice(0, 280);

    return (
        <>
            {toast && <div className={styles.toast}>{toast}</div>}

            <div className={styles.description}>
                <h3>Kitob haqida</h3>
                <p className={expanded ? styles.descExpanded : styles.descCollapsed}>
                    {expanded ? book.description : shortDesc}{book.description.length > 280 && !expanded ? '...' : ''}
                </p>
                {book.description.length > 280 && (
                    <button className={styles.linkBtn} onClick={() => setExpanded((s) => !s)}>
                        {expanded ? 'Kamroq ko‘rsatish' : 'Batafsil o‘qish'}
                    </button>
                )}
            </div>

            <div className={styles.actionButtons}>
                <Link href={`/book/${book.id}/read`} className={styles.primaryBtn} style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                    <BookOpen size={18} /> Mutolaa
                </Link>
                {book.hasAudio && (
                    <Link href={`/book/${book.id}/listen`} className={styles.primaryBtn} style={{ backgroundColor: '#8b5cf6', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                        <Headphones size={18} /> Eshitish
                    </Link>
                )}
                <button onClick={handleBuy} className={styles.primaryBtn} style={{ backgroundColor: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--search-border)', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                    Sotib olish
                </button>
                <button className={styles.iconBtn} onClick={toggleFavorite} aria-label="Sevimlilar" title="Sevimlilarga qo'shish" style={{ color: isFav ? '#ef4444' : 'inherit', borderColor: isFav ? '#ef4444' : 'inherit' }}>
                    <Heart size={18} />
                </button>
                <button className={styles.iconBtn} onClick={shareBook} aria-label="Ulashish" title="Do'stlar bilan ulashish">
                    <Share2 size={18} />
                </button>
            </div>
            
            <div style={{ marginTop: '1rem' }}>
                <button onClick={handleOrderPhysical} className={styles.primaryBtn} style={{ backgroundColor: 'transparent', width: '100%', maxWidth: 'none', color: 'var(--text-secondary)', border: '1px dashed var(--search-border)', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                    <Package size={18} /> Qog'oz formatda buyurtma qilish
                </button>
            </div>

            {recommended.length > 0 && (
                <div className={styles.recommended}>
                    <h4>Shu kabi kitoblar</h4>
                    <div className={styles.recoGrid}>
                        {recommended.map((r) => (
                            <Link key={r.id} href={`/book/${r.id}`} className={styles.recoCard}>
                                <div className={styles.recoThumb} style={{ backgroundImage: `url(${(r as any).image})` }} />
                                <div>
                                    <div className={styles.recoTitle}>{r.title}</div>
                                    <div className={styles.recoAuthor}>{r.author}</div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}
