"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, Share2, BookOpen, Headphones, Package, Star, X, Send, MessageCircle, Copy, Check } from 'lucide-react';
import styles from './page.module.css';

type Favorite = { id: string; title: string; author: string; price: string; rating: number; image: string; category: string };
type Book = {
    id: string;
    title: string;
    author: string;
    description: string;
    price: string;
    rating: number;
    image: string;
    category: string;
    hasAudio?: boolean;
    audioUrl?: string;
};

export default function BookActions({ book, recommended }: { book: Book; recommended: Book[] }) {
    const [isFav, setIsFav] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [toast, setToast] = useState('');
    const [shareOpen, setShareOpen] = useState(false);
    const [copied, setCopied] = useState(false);

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
                next = [{ 
                    id: book.id, 
                    title: book.title,
                    author: book.author,
                    price: book.price,
                    rating: book.rating,
                    image: (book as any).image || '',
                    category: book.category,
                }, ...list];
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

    function shareBook() {
        // If native share is supported and available, try it; otherwise open share modal
        const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
        if (navigator.share && window.location.protocol === 'https:') {
            navigator.share({
                title: book.title,
                text: `${book.title} — ${book.author}`,
                url: shareUrl,
            }).catch(() => {});
        } else {
            // Open direct share modal with Telegram, WhatsApp, Copy
            setShareOpen(true);
        }
    }

    async function handleCopyLink() {
        const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            const textArea = document.createElement("textarea");
            textArea.value = shareUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
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

    const desc = book?.description || '';
    const shortDesc = desc.slice(0, 280);

    return (
        <>
            {toast && <div className={styles.toast}>{toast}</div>}

            <div className={styles.description}>
                <h3>Kitob haqida</h3>
                <p className={expanded ? styles.descExpanded : styles.descCollapsed}>
                    {expanded ? desc : shortDesc}{desc.length > 280 && !expanded ? '...' : ''}
                </p>
                {desc.length > 280 && (
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
                <div className={styles.iconBtnsRow}>
                    <button className={styles.iconBtn} onClick={toggleFavorite} aria-label="Sevimlilar" title="Sevimlilarga qo'shish" style={{ color: isFav ? '#ef4444' : 'inherit', borderColor: isFav ? '#ef4444' : 'inherit' }}>
                        <Heart size={18} />
                    </button>
                    <button className={styles.iconBtn} onClick={shareBook} aria-label="Ulashish" title="Do'stlar bilan ulashish">
                        <Share2 size={18} />
                    </button>
                </div>
            </div>


            <div style={{ marginTop: '1rem' }}>
                <button onClick={handleOrderPhysical} className={styles.primaryBtn} style={{ backgroundColor: 'transparent', width: '100%', maxWidth: 'none', color: 'var(--text-secondary)', border: '1px dashed var(--search-border)', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                    <Package size={18} /> Qog'oz formatda buyurtma qilish
                </button>
            </div>

            {(recommended && recommended.length > 0) && (
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

            {/* Share Modal Dialog */}
            {shareOpen && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    backgroundColor: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
                }} onClick={() => setShareOpen(false)}>
                    <div style={{
                        background: 'var(--card-bg, #141720)',
                        border: '1px solid var(--card-border, rgba(255,255,255,0.1))',
                        borderRadius: '20px', padding: '1.75rem', width: '100%', maxWidth: '380px',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.5)', position: 'relative'
                    }} onClick={(e) => e.stopPropagation()}>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                Kitobni ulashish
                            </h3>
                            <button onClick={() => setShareOpen(false)} style={{
                                background: 'transparent', border: 'none', color: 'var(--text-secondary)',
                                cursor: 'pointer', padding: '4px'
                            }}>
                                <X size={20} />
                            </button>
                        </div>

                        <p style={{ margin: '0 0 1.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            <strong>{book.title}</strong> kitobini do&apos;stlaringiz bilan baham ko&apos;ring:
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                            {/* Telegram */}
                            <a
                                href={`https://t.me/share/url?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}&text=${encodeURIComponent(`📚 "${book.title}" — ${book.author}\n\nKitobni mutolaa qilish uchun havola:`)}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    padding: '12px', background: '#229ED9', color: '#fff', borderRadius: '12px',
                                    textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem'
                                }}
                            >
                                <Send size={18} /> Telegram
                            </a>

                            {/* WhatsApp */}
                            <a
                                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`📚 "${book.title}" — ${book.author}\n${typeof window !== 'undefined' ? window.location.href : ''}`)}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    padding: '12px', background: '#25D366', color: '#fff', borderRadius: '12px',
                                    textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem'
                                }}
                            >
                                <MessageCircle size={18} /> WhatsApp
                            </a>
                        </div>

                        {/* Copy link bar */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            background: 'var(--search-bg, #0d1117)', border: '1px solid var(--search-border, #30363d)',
                            borderRadius: '12px', padding: '8px 12px'
                        }}>
                            <span style={{
                                flex: 1, fontSize: '0.8rem', color: 'var(--text-secondary)',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                            }}>
                                {typeof window !== 'undefined' ? window.location.href : ''}
                            </span>
                            <button
                                onClick={handleCopyLink}
                                style={{
                                    background: copied ? '#10b981' : 'var(--theme-color, #2563eb)',
                                    color: '#fff', border: 'none', borderRadius: '8px',
                                    padding: '6px 12px', fontSize: '0.8rem', fontWeight: 600,
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                                }}
                            >
                                {copied ? <Check size={14} /> : <Copy size={14} />}
                                {copied ? 'Nusxalandi' : 'Nusxalash'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
