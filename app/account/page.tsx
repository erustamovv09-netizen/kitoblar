"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  User, 
  Mail, 
  Heart, 
  Trash2, 
  Edit3, 
  LogOut, 
  CheckCircle, 
  ArrowLeft, 
  Calendar, 
  BookOpen,
  Settings,
  AlertCircle,
  Clock,
  Sparkles,
  Bookmark,
  Check,
  Flame,
  Award,
  BookMarked,
  MessageSquare,
  Lock,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { booksDB } from '../lib/books';
import { api } from '../lib/api';
import styles from './page.module.css';

type Favorite = { id: string; title: string };
type BookStatus = 'reading' | 'planned' | 'completed';
type BookStatuses = { [bookId: string]: BookStatus };
type Quote = { id: string; bookId: string; bookTitle: string; text: string };
type Activity = { id: string; text: string; time: string; type: 'system' | 'user' | 'favorite' | 'goal' };

const emojiAvatars = ['📚', '💡', '🚀', '😎', '🧠', '🎨', '📖', '🌟', '🦄', '🧙‍♂️', '🌙', '⚡', '🎭', '🧩', '🦋'];

function initials(fullName: string): string {
    if (!fullName.trim()) return '?';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const accentColors = {
    blue: '#3b82f6',
    purple: '#8b5cf6',
    emerald: '#10b981',
    amber: '#f59e0b'
};

const dailyGoalsOptions = [15, 30, 45, 60]; // minutes

export default function AccountPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [bio, setBio] = useState('');
    const [editing, setEditing] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [joinDate, setJoinDate] = useState('');
    
    // Core profile features
    const [favorites, setFavorites] = useState<Favorite[]>([]);
    const [bookStatuses, setBookStatuses] = useState<BookStatuses>({});
    const [quotes, setQuotes] = useState<Quote[]>([]);
    
    // Accent and Avatar
    const [accent, setAccent] = useState<'blue' | 'purple' | 'emerald' | 'amber'>('blue');
    const [avatarEmoji, setAvatarEmoji] = useState('');
    const [showAvatarSelector, setShowAvatarSelector] = useState(false);
    
    // Reading Goal Tracker
    const [dailyGoal, setDailyGoal] = useState<number>(0);
    const [todayProgress, setTodayProgress] = useState<number>(0);
    const [streak, setStreak] = useState<number>(0);

    // Active Tab & Activity Timeline
    const [activeTab, setActiveTab] = useState<'profile' | 'favorites' | 'quotes' | 'history'>('profile');
    const [activityLog, setActivityLog] = useState<Activity[]>([]);

    // Form inputs for Quote
    const [quoteText, setQuoteText] = useState('');
    const [quoteBookId, setQuoteBookId] = useState('');

    const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
    const [books, setBooks] = useState<any[]>([]);
    const activeBooksList = books.length > 0 ? books : booksDB;
    const [successMessage, setSuccessMessage] = useState('');

    const nameRef = useRef<HTMLInputElement | null>(null);
    const emailRef = useRef<HTMLInputElement | null>(null);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Load data from LocalStorage on mount
    useEffect(() => {
        const storedName = localStorage.getItem('username');
        const storedEmail = localStorage.getItem('email');
        const storedBio = localStorage.getItem('user_bio');
        const rawFav = localStorage.getItem('favorites');
        const rawStatuses = localStorage.getItem('book_statuses');
        const rawQuotes = localStorage.getItem('book_quotes');
        
        const storedAccent = localStorage.getItem('account_accent');
        const storedAvatar = localStorage.getItem('account_avatar');
        let storedJoin = localStorage.getItem('join_date');
        
        const storedGoal = localStorage.getItem('daily_goal');
        const storedProgress = localStorage.getItem('today_progress');
        const storedStreak = localStorage.getItem('streak');

        if (storedName) {
            setName(storedName);
            setIsLoggedIn(true);
        }
        if (storedEmail) setEmail(storedEmail);
        if (storedBio) setBio(storedBio);
        
        if (storedAccent && storedAccent in accentColors) {
            setAccent(storedAccent as any);
        }
        if (storedAvatar) {
            setAvatarEmoji(storedAvatar);
        }

        // Set join date if not yet stored
        if (!storedJoin) {
            storedJoin = new Date().toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' });
            localStorage.setItem('join_date', storedJoin);
        }
        setJoinDate(storedJoin);

        if (storedGoal) setDailyGoal(Number(storedGoal));
        if (storedProgress) setTodayProgress(Number(storedProgress));
        if (storedStreak) setStreak(Number(storedStreak));

        // Parse lists
        try {
            const parsedFav = rawFav ? JSON.parse(rawFav) : [];
            setFavorites(Array.isArray(parsedFav) ? parsedFav : []);
        } catch { setFavorites([]); }

        try {
            const parsedStatuses = rawStatuses ? JSON.parse(rawStatuses) : {};
            setBookStatuses(parsedStatuses || {});
        } catch { setBookStatuses({}); }

        try {
            const parsedQuotes = rawQuotes ? JSON.parse(rawQuotes) : [];
            setQuotes(Array.isArray(parsedQuotes) ? parsedQuotes : []);
        } catch { setQuotes([]); }

        // Fetch activity logs from backend API
        api.getActivityLog().then(parsedActivity => {
            setActivityLog(parsedActivity);
        }).catch(() => {
            setActivityLog([
                { id: '1', text: 'Tizimda hisob muvaffaqiyatli faollashtirildi', time: '1 hafta oldin', type: 'system' }
            ]);
        });

        // Fetch books list from backend API
        api.getBooks().then(list => {
            if (list && list.length > 0) setBooks(list);
        }).catch(err => {
            console.error("Failed to load books for account page", err);
        });
    }, []);

    useEffect(() => {
        // autofocus name input when login form is visible
        if (!isLoggedIn && nameRef.current) {
            setTimeout(() => nameRef.current?.focus(), 150);
        }
        if (editing && nameRef.current) {
            setTimeout(() => nameRef.current?.focus(), 150);
        }
    }, [isLoggedIn, editing]);

    const isValid = name.trim().length >= 2 && emailRegex.test(email);

    // Dynamic Achievements evaluation
    const getAchievements = () => {
        return [
            { id: 'ac1', icon: '🎓', name: 'Birinchi qadam', desc: 'Hisob muvaffaqiyatli yaratildi', unlocked: true },
            { id: 'ac2', icon: '✉️', name: 'Aloqa', desc: 'Elektron pochta tasdiqlandi', unlocked: !!(email && emailRegex.test(email)) },
            { id: 'ac3', icon: '🎨', name: 'O\'ziga xoslik', desc: 'Profil uchun avatar tanlandi', unlocked: !!avatarEmoji },
            { id: 'ac4', icon: '📚', name: 'Kutubxonachi', desc: 'Kamida 3 ta kitob sevimlilarga qo\'shildi', unlocked: favorites.length >= 3 },
            { id: 'ac5', icon: '🔥', name: 'Mutolaachi', desc: 'Kunlik o\'qish maqsadi belgilandi', unlocked: dailyGoal > 0 },
            { id: 'ac6', icon: '🏆', name: 'Bilimdon', desc: 'Kamida 1 ta kitob o\'qib tugatildi', unlocked: Object.values(bookStatuses).includes('completed') },
            { id: 'ac7', icon: '📝', name: 'Iqtiboschi', desc: 'Birinchi iqtibos saqlandi', unlocked: quotes.length > 0 },
            { id: 'ac8', icon: '💬', name: 'Tahlilchi', desc: 'Bio/haqida ma\'lumot kiritildi', unlocked: bio.trim().length > 10 },
            { id: 'ac9', icon: '🌟', name: 'Supersevimli', desc: '5 dan ortiq kitob sevimlilarga qo\'shildi', unlocked: favorites.length >= 5 },
        ];
    };

    // Profile Completion Percentage
    const getCompletionPercentage = () => {
        let pct = 0;
        if (name.trim().length >= 2) pct += 30;
        if (email && emailRegex.test(email)) pct += 25;
        if (favorites.length > 0) pct += 15;
        if (avatarEmoji) pct += 15;
        if (bio.trim().length > 5) pct += 10;
        if (dailyGoal > 0) pct += 5;
        return pct;
    };

    // Calculate real numbers for dashboard stats
    const stats = {
        favorites: favorites.length,
        reading: Object.values(bookStatuses).filter(s => s === 'reading').length,
        completed: Object.values(bookStatuses).filter(s => s === 'completed').length
    };

    function logEvent(text: string, type: 'user' | 'favorite' | 'system' | 'goal') {
        const newEvent: Activity = {
            id: String(Date.now()),
            text,
            time: 'Hozir',
            type
        };
        setActivityLog(prev => [newEvent, ...prev]);
    }

    function saveProfile() {
        localStorage.setItem('username', name);
        localStorage.setItem('email', email);
        localStorage.setItem('user_bio', bio);
        setEditing(false);
        setIsLoggedIn(true);
        setSuccessMessage('Profil muvaffaqiyatli saqlandi ✓');
        logEvent('Profil sozlamalari yangilandi', 'user');
        setTimeout(() => setSuccessMessage(''), 3000);
    }

    function changeAccent(newAccent: 'blue' | 'purple' | 'emerald' | 'amber') {
        setAccent(newAccent);
        localStorage.setItem('account_accent', newAccent);
        logEvent(`Rangli mavzu o'zgartirildi (${newAccent})`, 'user');
        setSuccessMessage('Mavzu rangi yangilandi');
        setTimeout(() => setSuccessMessage(''), 2000);
    }

    function selectAvatar(emoji: string) {
        setAvatarEmoji(emoji);
        localStorage.setItem('account_avatar', emoji);
        setShowAvatarSelector(false);
        logEvent(`Shaxsiy avatar yangilandi: ${emoji}`, 'user');
        setSuccessMessage('Avatar o‘zgartirildi');
        setTimeout(() => setSuccessMessage(''), 2000);
    }

    function removeAvatarEmoji() {
        setAvatarEmoji('');
        localStorage.removeItem('account_avatar');
        setShowAvatarSelector(false);
        logEvent("Shaxsiy avatar olib tashlandi (ism bosh harflariga qaytarildi)", 'user');
        setSuccessMessage('Avatar olib tashlandi');
        setTimeout(() => setSuccessMessage(''), 2000);
    }

    // Goal Tracker interactions
    function handleGoalSelect(min: number) {
        setDailyGoal(min);
        localStorage.setItem('daily_goal', String(min));
        logEvent(`Kunlik mutolaa maqsadi belgilandi: ${min} daqiqa`, 'goal');
        setSuccessMessage(`Kunlik maqsad: ${min} daqiqa qilib belgilandi`);
        setTimeout(() => setSuccessMessage(''), 2500);
    }

    function logReadingTime(min: number) {
        const newProgress = todayProgress + min;
        setTodayProgress(newProgress);
        localStorage.setItem('today_progress', String(newProgress));
        
        let msg = `Bugun yana +${min} daqiqa mutolaa qilindi`;
        
        if (dailyGoal > 0 && todayProgress < dailyGoal && newProgress >= dailyGoal) {
            const newStreak = streak + 1;
            setStreak(newStreak);
            localStorage.setItem('streak', String(newStreak));
            msg += ` va kunlik maqsad bajarildi! 🔥 Kunlik zanjir: ${newStreak} kun!`;
            logEvent(`Kunlik mutolaa maqsadi bajarildi! Zanjir: ${newStreak} kun 🔥`, 'goal');
        } else {
            logEvent(`Mutolaa vaqti qayd etildi: +${min} daqiqa`, 'goal');
        }

        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(''), 3000);
    }

    function resetTodayProgress() {
        setTodayProgress(0);
        localStorage.setItem('today_progress', '0');
        setSuccessMessage('Bugungi o‘qilgan vaqt tozalandi');
        setTimeout(() => setSuccessMessage(''), 2000);
    }

    // Shelves Statuses
    function handleStatusChange(bookId: string, status: BookStatus) {
        const nextStatuses = { ...bookStatuses, [bookId]: status };
        setBookStatuses(nextStatuses);
        localStorage.setItem('book_statuses', JSON.stringify(nextStatuses));
        
        const book = activeBooksList.find(b => b.id === bookId);
        const title = book?.title || 'Kitob';
        
        let statusText = 'o‘qish rejalashtirildi';
        if (status === 'reading') statusText = 'o‘qish boshlandi';
        if (status === 'completed') statusText = 'to‘liq o‘qib tugatildi';

        logEvent(`"${title}" kitobi statusi o'zgartirildi: ${statusText}`, 'user');
        setSuccessMessage(`Kitob holati o‘zgartirildi`);
        setTimeout(() => setSuccessMessage(''), 2000);
    }

    // Quotes logic
    function handleAddQuote(e: React.FormEvent) {
        e.preventDefault();
        if (!quoteText.trim() || !quoteBookId) return;

        const book = activeBooksList.find(b => b.id === quoteBookId);
        const bookTitle = book?.title || 'Noma\'lum kitob';

        const newQuote: Quote = {
            id: String(Date.now()),
            bookId: quoteBookId,
            bookTitle,
            text: quoteText.trim()
        };

        const nextQuotes = [newQuote, ...quotes];
        setQuotes(nextQuotes);
        localStorage.setItem('book_quotes', JSON.stringify(nextQuotes));
        
        setQuoteText('');
        setQuoteBookId('');
        logEvent(`"${bookTitle}" kitobidan yangi iqtibos saqlandi`, 'user');
        setSuccessMessage('Iqtibos muvaffaqiyatli saqlandi');
        setTimeout(() => setSuccessMessage(''), 2500);
    }

    function removeQuote(id: string, title: string) {
        const nextQuotes = quotes.filter(q => q.id !== id);
        setQuotes(nextQuotes);
        localStorage.setItem('book_quotes', JSON.stringify(nextQuotes));
        logEvent(`"${title}" kitobidan olingan iqtibos o'chirildi`, 'user');
    }

    function validate() {
        const next: { name?: string; email?: string } = {};
        if (!name || name.trim().length < 2) next.name = 'Ism kamida 2 ta belgidan iborat bo‘lishi kerak';
        if (!email) next.email = 'Elektron pochta manzilini kiritish majburiydir';
        else if (!emailRegex.test(email)) next.email = 'Noto‘g‘ri elektron pochta manzili';
        setErrors(next);
        return Object.keys(next).length === 0;
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!validate()) return;
        saveProfile();
    }

    function logout() {
        localStorage.removeItem('username');
        localStorage.removeItem('email');
        localStorage.removeItem('user_bio');
        localStorage.removeItem('account_accent');
        localStorage.removeItem('account_avatar');
        localStorage.removeItem('join_date');
        localStorage.removeItem('daily_goal');
        localStorage.removeItem('today_progress');
        localStorage.removeItem('streak');
        localStorage.removeItem('book_statuses');
        localStorage.removeItem('book_quotes');
        
        setName('');
        setEmail('');
        setBio('');
        setJoinDate('');
        setAvatarEmoji('');
        setAccent('blue');
        setDailyGoal(0);
        setTodayProgress(0);
        setStreak(0);
        setBookStatuses({});
        setQuotes([]);
        setEditing(false);
        setIsLoggedIn(false);
        setActiveTab('profile');
        setActivityLog([]);
    }

    function addFavoriteDirect(id: string, title: string) {
        if (favorites.some(f => f.id === id)) return;
        const next = [...favorites, { id, title }];
        setFavorites(next);
        localStorage.setItem('favorites', JSON.stringify(next));
        logEvent(`"${title}" kitobi sevimlilarga qo'shildi`, 'favorite');
        setSuccessMessage('Kitob sevimlilarga qo‘shildi');
        setTimeout(() => setSuccessMessage(''), 2500);
        try { window.dispatchEvent(new CustomEvent('fav-updated')); } catch { }
    }

    function removeFavoriteDirect(id: string, title: string) {
        const next = favorites.filter((f) => f.id !== id);
        setFavorites(next);
        localStorage.setItem('favorites', JSON.stringify(next));
        logEvent(`"${title}" kitobi sevimlilardan o'chirildi`, 'favorite');
        try { window.dispatchEvent(new CustomEvent('fav-updated')); } catch { }
    }

    function clearFavorites() {
        setFavorites([]);
        localStorage.removeItem('favorites');
        logEvent('Barcha sevimli kitoblar o‘chirib tashlandi', 'favorite');
        try { window.dispatchEvent(new CustomEvent('fav-updated')); } catch { }
    }

    // Enrich favorites with full book info and status
    const enrichedFavorites = favorites.map(fav => {
        const fullBook = activeBooksList.find(b => b.id === fav.id || b.title.toLowerCase() === fav.title.toLowerCase());
        return {
            id: fav.id,
            title: fav.title,
            author: fullBook?.author || 'Noma\'lum muallif',
            image: fullBook?.image || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=200&auto=format&fit=crop',
            rating: fullBook?.rating || 0,
            price: fullBook?.price || 'Bepul',
            status: bookStatuses[fav.id] || 'planned'
        };
    });

    const recommendedBooks = activeBooksList
        .filter(book => !favorites.some(fav => fav.id === book.id))
        .slice(0, 4);

    // Reading goal progress percentage
    const goalProgress = dailyGoal > 0 ? Math.min(100, Math.round((todayProgress / dailyGoal) * 100)) : 0;

    return (
        <main className={styles.container} style={{ '--user-accent': accentColors[accent] } as React.CSSProperties}>
            
            {/* Success Toast Notification */}
            <AnimatePresence>
                {successMessage && (
                    <motion.div 
                        className={styles.toast}
                        initial={{ opacity: 0, y: -20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.9 }}
                    >
                        <CheckCircle size={18} />
                        <span>{successMessage}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {(!isLoggedIn) ? (
                /* Auth Screen */
                <motion.div 
                    className={styles.authContainer}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className={`${styles.glassCard} ${styles.authCard}`}>
                        <div className={styles.authIconWrapper}>
                            <User size={32} />
                        </div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Profilga kirish</h1>
                        <p className={styles.authSubtitle}>Kitoblarni sevimlilarga qo'shish va sozlamalarni saqlash uchun profilingizni yarating.</p>
                        
                        <form className={styles.form} onSubmit={handleSubmit}>
                            <div className={styles.field}>
                                <label className={styles.fieldTitle}>Ism</label>
                                <div className={styles.inputWrapper}>
                                    <User size={18} className={styles.inputIcon} />
                                    <input 
                                        ref={nameRef} 
                                        type="text" 
                                        value={name} 
                                        onChange={(e) => setName(e.target.value)} 
                                        placeholder="Ismingizni kiriting"
                                        className={styles.inputField}
                                        required
                                    />
                                </div>
                                {errors.name && (
                                    <span className={styles.errorText}>
                                        <AlertCircle size={14} /> {errors.name}
                                    </span>
                                )}
                            </div>

                            <div className={styles.field}>
                                <label className={styles.fieldTitle}>Email</label>
                                <div className={styles.inputWrapper}>
                                    <Mail size={18} className={styles.inputIcon} />
                                    <input 
                                        ref={emailRef} 
                                        value={email} 
                                        onChange={(e) => setEmail(e.target.value)} 
                                        type="email" 
                                        placeholder="example@mail.com"
                                        className={styles.inputField}
                                        required
                                    />
                                </div>
                                {errors.email && (
                                    <span className={styles.errorText}>
                                        <AlertCircle size={14} /> {errors.email}
                                    </span>
                                )}
                            </div>

                            <button 
                                type="submit" 
                                className={`${styles.btn} ${styles.btnPrimary}`} 
                                disabled={!isValid}
                                style={{ marginTop: '0.5rem', width: '100%' }}
                            >
                                Kirish / Saqlash
                            </button>
                        </form>
                    </div>
                </motion.div>
            ) : (
                /* Cabinet Dashboard Layout */
                <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <div className={styles.headerSection}>
                        <h1 className={styles.title}>Mening Kabinetim</h1>
                    </div>

                    <div className={styles.dashboard}>
                        {/* Profile & Settings Sidebar */}
                        <aside className={`${styles.glassCard} ${styles.sidebar}`}>
                            <div className={styles.avatarWrapper} onClick={() => setShowAvatarSelector(!showAvatarSelector)}>
                                <div className={styles.avatar} aria-hidden>
                                    {avatarEmoji || initials(name)}
                                </div>
                                <div className={styles.avatarOverlay}>
                                    <span>O'zgartirish</span>
                                </div>
                                <span className={styles.verifiedBadge} title="Tizim faoli">
                                    <CheckCircle size={14} />
                                </span>
                            </div>

                            {/* Avatar selector panel */}
                            <AnimatePresence>
                                {showAvatarSelector && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        style={{ width: '100%' }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '0 4px' }}>
                                            <span className={styles.accentTitle}>Avatar tanlang:</span>
                                            {avatarEmoji && (
                                                <button 
                                                    onClick={removeAvatarEmoji}
                                                    style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer' }}
                                                >
                                                    Olib tashlash
                                                </button>
                                            )}
                                        </div>
                                        <div className={styles.avatarGrid}>
                                            {emojiAvatars.map(emoji => (
                                                <button 
                                                    key={emoji} 
                                                    className={`${styles.avatarOption} ${avatarEmoji === emoji ? styles.avatarOptionActive : ''}`}
                                                    onClick={() => selectAvatar(emoji)}
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className={styles.profileInfo}>
                                <h2 className={styles.name}>{name || 'Foydalanuvchi'}</h2>
                                <p className={styles.email}>{email || 'Email kiritilmagan'}</p>
                                
                                <div className={styles.statsRow}>
                                    <div className={styles.statItem}>
                                        <span className={styles.statVal}>{favorites.length}</span>
                                        <span className={styles.statLabel}>Kitoblar</span>
                                    </div>
                                    <div className={styles.statItem}>
                                        <span className={styles.statVal}>{quotes.length}</span>
                                        <span className={styles.statLabel}>Iqtiboslar</span>
                                    </div>
                                    <div className={styles.statItem}>
                                        <span className={styles.statVal}>{stats.completed}</span>
                                        <span className={styles.statLabel}>Tugatilgan</span>
                                    </div>
                                </div>
                                {joinDate && (
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'center' }}>
                                        <Calendar size={13} />
                                        {joinDate} dan beri a'zo
                                    </p>
                                )}
                                {bio && (
                                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.5, textAlign: 'center', padding: '0 0.25rem' }}>
                                        "{bio}"
                                    </p>
                                )}
                            </div>

                            {/* Theme Customizer */}
                            <div className={styles.accentSelector}>
                                <span className={styles.accentTitle}>Mavzu rangi</span>
                                <div className={styles.accentDots}>
                                    {Object.keys(accentColors).map((col) => (
                                        <button
                                            key={col}
                                            className={`${styles.accentDot} ${accent === col ? styles.accentDotActive : ''}`}
                                            style={{ backgroundColor: accentColors[col as keyof typeof accentColors] }}
                                            onClick={() => changeAccent(col as any)}
                                            aria-label={`Mavzu rangi: ${col}`}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Achievements & Badges Widget */}
                            <div className={styles.achievementsPanel}>
                                <span className={styles.accentTitle} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Award size={14} style={{ color: 'var(--user-accent)' }} />
                                    Yutuqlar va Nishonlar
                                </span>
                                <div className={styles.badgeGrid}>
                                    {getAchievements().map(badge => (
                                        <div 
                                            key={badge.id} 
                                            className={`${styles.badgeItem} ${!badge.unlocked ? styles.badgeLocked : ''}`}
                                            title={`${badge.name}: ${badge.desc}`}
                                        >
                                            <span className={styles.badgeIcon}>{badge.icon}</span>
                                            <span className={styles.badgeName}>{badge.name}</span>
                                            {!badge.unlocked && <Lock size={10} className={styles.badgeLockedIcon} />}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.sidebarControls}>
                                <button 
                                    className={`${styles.btn} ${editing ? styles.btnSecondary : styles.btnPrimary} `} 
                                    onClick={() => setEditing((s) => !s)}
                                    style={{ width: '100%' }}
                                >
                                    <Edit3 size={16} />
                                    {editing ? 'Tahrirlashni yopish' : 'Profilni tahrirlash'}
                                </button>
                                <button className={`${styles.btn} ${styles.btnDanger}`} onClick={logout} style={{ width: '100%' }}>
                                    <LogOut size={16} />
                                    Chiqish
                                </button>
                            </div>
                        </aside>

                        {/* Content Section */}
                        <section className={styles.tabsContainer}>
                            
                            {/* Profile Completion indicator */}
                            <div className={styles.progressSection}>
                                <div className={styles.progressHeader}>
                                    <span className={styles.progressLabel}>Profilingiz to'ldirilganligi</span>
                                    <span className={styles.progressPercent}>{getCompletionPercentage()}%</span>
                                </div>
                                <div className={styles.progressBarOuter}>
                                    <div 
                                        className={styles.progressBarInner} 
                                        style={{ width: `${getCompletionPercentage()}%` }}
                                    />
                                </div>
                            </div>

                            {/* Daily Reading Goal Widget */}
                            <div className={styles.goalSection}>
                                <div className={styles.goalHeading}>
                                    <span className={styles.goalTitle}>
                                        <Flame size={18} style={{ color: '#f59e0b', display: 'inline-block' }} />
                                        Kunlik mutolaa maqsadi
                                    </span>
                                    {streak > 0 && (
                                        <span className={styles.streakBadge}>
                                            <Flame size={14} fill="#f59e0b" />
                                            {streak} kun!
                                        </span>
                                    )}
                                </div>

                                <div className={styles.goalSelector}>
                                    {dailyGoalsOptions.map(min => (
                                        <button
                                            key={min}
                                            className={`${styles.goalChip} ${dailyGoal === min ? styles.goalChipActive : ''}`}
                                            onClick={() => handleGoalSelect(min)}
                                        >
                                            {min} daq
                                        </button>
                                    ))}
                                </div>

                                {dailyGoal > 0 && (
                                    <>
                                        {/* Progress bar */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                <span>Bugungi progress</span>
                                                <span style={{ fontWeight: 700, color: goalProgress >= 100 ? '#10b981' : 'var(--text-primary)' }}>
                                                    {todayProgress}/{dailyGoal} daq ({goalProgress}%)
                                                </span>
                                            </div>
                                            <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                                                <div style={{ 
                                                    height: '100%', 
                                                    width: `${goalProgress}%`,
                                                    background: goalProgress >= 100 
                                                        ? 'linear-gradient(90deg, #10b981, #34d399)' 
                                                        : 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                                                    borderRadius: '999px',
                                                    transition: 'width 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
                                                }} />
                                            </div>
                                        </div>
                                        <div className={styles.goalTrackerRow}>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                {[15, 30].map(min => (
                                                    <button 
                                                        key={min}
                                                        className={styles.goalLogBtn}
                                                        onClick={() => logReadingTime(min)}
                                                    >
                                                        +{min} daq
                                                    </button>
                                                ))}
                                            </div>
                                            <button 
                                                className={styles.goalLogBtn}
                                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-secondary)' }}
                                                onClick={resetTodayProgress}
                                            >
                                                Tozalash
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Stats Widgets Grid */}
                            <div className={styles.statsGrid}>
                                <div className={styles.statCard}>
                                    <div className={styles.statCardIcon} style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                                        <Heart size={20} style={{ color: '#ef4444' }} />
                                    </div>
                                    <div className={styles.statCardInfo}>
                                        <span className={styles.statCardNum}>{stats.favorites} ta</span>
                                        <span className={styles.statCardText}>Sevimlilar</span>
                                    </div>
                                </div>
                                <div className={styles.statCard}>
                                    <div className={styles.statCardIcon} style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                                        <BookOpen size={20} />
                                    </div>
                                    <div className={styles.statCardInfo}>
                                        <span className={styles.statCardNum}>{stats.reading} ta</span>
                                        <span className={styles.statCardText}>O'qilmoqda</span>
                                    </div>
                                </div>
                                <div className={styles.statCard}>
                                    <div className={styles.statCardIcon} style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                                        <Check size={20} style={{ color: '#10b981' }} />
                                    </div>
                                    <div className={styles.statCardInfo}>
                                        <span className={styles.statCardNum}>{stats.completed} ta</span>
                                        <span className={styles.statCardText}>Tugallangan</span>
                                    </div>
                                </div>
                            </div>

                            {/* Tabs Headers */}
                            <div className={styles.tabsHeader}>
                                <button 
                                    className={`${styles.tabBtn} ${activeTab === 'profile' ? styles.activeTabBtn : ''}`}
                                    onClick={() => setActiveTab('profile')}
                                >
                                    <Settings size={16} />
                                    <span>Sozlamalar</span>
                                </button>
                                <button 
                                    className={`${styles.tabBtn} ${activeTab === 'favorites' ? styles.activeTabBtn : ''}`}
                                    onClick={() => setActiveTab('favorites')}
                                >
                                    <Heart size={16} />
                                    <span>Kitob javoni ({favorites.length})</span>
                                </button>
                                <button 
                                    className={`${styles.tabBtn} ${activeTab === 'quotes' ? styles.activeTabBtn : ''}`}
                                    onClick={() => setActiveTab('quotes')}
                                >
                                    <MessageSquare size={16} />
                                    <span>Iqtiboslar ({quotes.length})</span>
                                </button>
                                <button 
                                    className={`${styles.tabBtn} ${activeTab === 'history' ? styles.activeTabBtn : ''}`}
                                    onClick={() => setActiveTab('history')}
                                >
                                    <Clock size={16} />
                                    <span>Tarix</span>
                                </button>
                            </div>

                            {/* Tab Switcher Area */}
                            <AnimatePresence mode="wait">
                                
                                {/* SETTINGS TAB */}
                                {activeTab === 'profile' && (
                                    <motion.div 
                                        key="profile-tab"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className={styles.glassCard}
                                    >
                                        <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', fontWeight: 700 }}>Profil ma'lumotlari</h3>
                                        
                                        {!editing ? (
                                            <div style={{ display: 'grid', gap: '1rem' }}>
                                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                                    <span className={styles.fieldTitle}>Foydalanuvchi ismi</span>
                                                    <p style={{ fontSize: '1.1rem', marginTop: '4px', fontWeight: 600 }}>{name}</p>
                                                </div>
                                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                                    <span className={styles.fieldTitle}>Elektron pochta manzili</span>
                                                    <p style={{ fontSize: '1rem', marginTop: '4px', fontWeight: 500 }}>{email || <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Kiritilmagan</span>}</p>
                                                </div>
                                                {bio && (
                                                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                                        <span className={styles.fieldTitle}>Men haqimda</span>
                                                        <p style={{ fontSize: '0.95rem', marginTop: '4px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>{bio}</p>
                                                    </div>
                                                )}
                                                {joinDate && (
                                                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <Calendar size={16} style={{ color: 'var(--user-accent, var(--accent-blue))', flexShrink: 0 }} />
                                                        <div>
                                                            <span className={styles.fieldTitle}>A'zolik sanasi</span>
                                                            <p style={{ fontSize: '0.95rem', marginTop: '2px' }}>{joinDate}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <form className={styles.form} onSubmit={handleSubmit}>
                                                <div className={styles.formGrid}>
                                                    <div className={styles.field}>
                                                        <label className={styles.fieldTitle}>Ism</label>
                                                        <div className={styles.inputWrapper}>
                                                            <User size={18} className={styles.inputIcon} />
                                                            <input 
                                                                ref={nameRef} 
                                                                value={name} 
                                                                onChange={(e) => setName(e.target.value)} 
                                                                placeholder="Ismingiz"
                                                                className={styles.inputField}
                                                            />
                                                        </div>
                                                        {errors.name && <span className={styles.errorText}><AlertCircle size={14} /> {errors.name}</span>}
                                                    </div>
                                                    <div className={styles.field}>
                                                        <label className={styles.fieldTitle}>Email</label>
                                                        <div className={styles.inputWrapper}>
                                                            <Mail size={18} className={styles.inputIcon} />
                                                            <input 
                                                                ref={emailRef} 
                                                                value={email} 
                                                                onChange={(e) => setEmail(e.target.value)} 
                                                                type="email"
                                                                placeholder="example@mail.com" 
                                                                className={styles.inputField}
                                                            />
                                                        </div>
                                                        {errors.email && <span className={styles.errorText}><AlertCircle size={14} /> {errors.email}</span>}
                                                    </div>
                                                </div>
                                                <div className={styles.field}>
                                                    <label className={styles.fieldTitle}>Men haqimda (ixtiyoriy)</label>
                                                    <textarea
                                                        value={bio}
                                                        onChange={(e) => setBio(e.target.value)}
                                                        placeholder="Kitobsevarligi, qiziqishlari, sevimli janri..."
                                                        className={styles.textareaField}
                                                        rows={3}
                                                        maxLength={200}
                                                    />
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'right' }}>{bio.length}/200</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                                                    <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={!isValid}>Saqlash</button>
                                                    <button type="button" className={styles.btn} onClick={() => setEditing(false)}>Bekor qilish</button>
                                                </div>
                                            </form>
                                        )}
                                    </motion.div>
                                )}

                                {/* BOOKSHELF / FAVORITES TAB */}
                                {activeTab === 'favorites' && (
                                    <motion.div 
                                        key="favorites-tab"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className={styles.glassCard}
                                    >
                                        <div className={styles.favoritesHeader}>
                                            <h3>Kitob javonidagi asarlar</h3>
                                            {enrichedFavorites.length > 0 && (
                                                <button className={`${styles.btn} ${styles.btnDanger}`} onClick={clearFavorites}>
                                                    <Trash2 size={16} />
                                                    Hammasini tozalash
                                                </button>
                                            )}
                                        </div>

                                        {enrichedFavorites.length === 0 ? (
                                            <div className={styles.emptyState}>
                                                <BookOpen size={48} className={styles.emptyIcon} />
                                                <p>Sizning javoningiz bo'sh. Qidiruv bo'limidan foydalanib kitoblarni qo'shing.</p>
                                                <Link href="/search" className={`${styles.btn} ${styles.btnPrimary}`}>
                                                    Kitob izlash
                                                </Link>
                                            </div>
                                        ) : (
                                            <div className={styles.favList}>
                                                {enrichedFavorites.map((book) => (
                                                    <div key={book.id} className={styles.favItem}>
                                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', minWidth: 0, flex: 1 }}>
                                                            <div className={styles.favBookCover}>
                                                                <Image 
                                                                    src={book.image} 
                                                                    alt={book.title} 
                                                                    fill 
                                                                    sizes="48px"
                                                                    unoptimized
                                                                />
                                                            </div>
                                                            <div className={styles.favBookInfo}>
                                                                <Link href={`/book/${book.id}`} className={styles.favBookTitle}>
                                                                    {book.title}
                                                                </Link>
                                                                <div className={styles.favBookMeta}>
                                                                    <div className={styles.favRowInline}>
                                                                        <span>{book.author}</span>
                                                                        <span>•</span>
                                                                        <span className={styles.ratingBadge}>★ {book.rating.toFixed(1)}</span>
                                                                    </div>
                                                                    
                                                                    {/* Shelf status picker */}
                                                                    <div className={styles.statusWrapper}>
                                                                        <span style={{ fontSize: '0.7rem' }}>Status:</span>
                                                                        <select 
                                                                            value={book.status} 
                                                                            onChange={(e) => handleStatusChange(book.id, e.target.value as BookStatus)}
                                                                            className={styles.statusSelectMini}
                                                                        >
                                                                            <option value="planned">Rejalashtirilgan 📅</option>
                                                                            <option value="reading">O'qilyapti 📖</option>
                                                                            <option value="completed">Tugatilgan ✅</option>
                                                                        </select>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button 
                                                            className={`${styles.btn} ${styles.btnDanger}`} 
                                                            onClick={() => removeFavoriteDirect(book.id, book.title)} 
                                                            aria-label={`O'chirish ${book.title}`}
                                                            style={{ padding: '8px 12px' }}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {/* QUOTES TAB */}
                                {activeTab === 'quotes' && (
                                    <motion.div 
                                        key="quotes-tab"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className={styles.glassCard}
                                    >
                                        <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', fontWeight: 700 }}>Kitob iqtiboslari va Eslatmalar</h3>
                                        
                                        {/* Add Quote Form */}
                                        <form className={styles.quoteForm} onSubmit={handleAddQuote}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
                                                <div className={styles.field}>
                                                    <label className={styles.fieldTitle}>Kitobni tanlang</label>
                                                    <select 
                                                        value={quoteBookId} 
                                                        onChange={(e) => setQuoteBookId(e.target.value)}
                                                        className={styles.selectField}
                                                        required
                                                    >
                                                        <option value="">-- Kitobni tanlang --</option>
                                                         {activeBooksList.map(b => (
                                                             <option key={b.id} value={b.id}>{b.title} - {b.author}</option>
                                                         ))}
                                                    </select>
                                                </div>
                                                <div className={styles.field}>
                                                    <label className={styles.fieldTitle}>Iqtibos matni</label>
                                                    <textarea 
                                                        value={quoteText}
                                                        onChange={(e) => setQuoteText(e.target.value)}
                                                        placeholder="Sizga yoqqan ajoyib iqtibos yoki eslatma yozing..."
                                                        className={styles.textareaField}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <button 
                                                type="submit" 
                                                className={`${styles.btn} ${styles.btnPrimary}`}
                                                style={{ alignSelf: 'flex-start' }}
                                                disabled={!quoteText.trim() || !quoteBookId}
                                            >
                                                <Plus size={16} /> Iqtibos saqlash
                                            </button>
                                        </form>

                                        {quotes.length === 0 ? (
                                            <div className={styles.emptyState}>
                                                <MessageSquare size={48} className={styles.emptyIcon} />
                                                <p>Sizda hali iqtiboslar yo'q. Kitoblardan olingan dono fikrlarni shu yerda to'plab boring!</p>
                                            </div>
                                        ) : (
                                            <div className={styles.quotesList}>
                                                {quotes.map(q => (
                                                    <div key={q.id} className={styles.quoteCard}>
                                                        <p className={styles.quoteText}>{q.text}</p>
                                                        <div className={styles.quoteMeta}>
                                                            <span className={styles.quoteBook}>{q.bookTitle}</span>
                                                            <button 
                                                                className={`${styles.btn} ${styles.btnDanger}`}
                                                                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                                                onClick={() => removeQuote(q.id, q.bookTitle)}
                                                            >
                                                                O'chirish
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {/* TIMELINE TAB */}
                                {activeTab === 'history' && (
                                    <motion.div
                                        key="history-tab"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className={styles.glassCard}
                                    >
                                        <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', fontWeight: 700 }}>Faollik xronologiyasi</h3>
                                        <div className={styles.timeline}>
                                            {activityLog.map((log) => (
                                                <div key={log.id} className={styles.timelineItem}>
                                                    <span className={styles.timelineDot}>
                                                        {log.type === 'favorite' ? <Heart size={12} /> : log.type === 'goal' ? <Flame size={12} /> : log.type === 'system' ? <Bookmark size={12} /> : <User size={12} />}
                                                    </span>
                                                    <span className={styles.timelineTitle}>{log.text}</span>
                                                    <span className={styles.timelineTime}>{log.time}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                            </AnimatePresence>

                            {/* Recommendations Panel */}
                            {recommendedBooks.length > 0 && (
                                <div className={styles.glassCard} style={{ marginTop: '0.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, margin: 0 }}>
                                            <Sparkles size={18} style={{ color: 'var(--user-accent, var(--accent-blue))' }} />
                                            Sizga tavsiyalar
                                        </h3>
                                        <Link href="/search" style={{ fontSize: '0.82rem', color: 'var(--user-accent, var(--accent-blue))', fontWeight: 600 }}>Barchasini ko'rish →</Link>
                                    </div>
                                    <div className={styles.recGrid}>
                                        {recommendedBooks.map(book => (
                                            <div key={book.id} className={styles.recCard}>
                                                <div className={styles.recCover}>
                                                    <Image src={book.image} alt={book.title} fill sizes="44px" unoptimized />
                                                </div>
                                                <div className={styles.recInfo}>
                                                    <Link href={`/book/${book.id}`} className={styles.recTitle}>
                                                        {book.title}
                                                    </Link>
                                                    <span className={styles.recAuthor}>{book.author}</span>
                                                    <span style={{ fontSize: '0.72rem', color: '#fbbf24', marginTop: '2px', display: 'block' }}>★ {book.rating?.toFixed(1) ?? '—'}</span>
                                                </div>
                                                <button 
                                                    className={styles.recAddBtn}
                                                    onClick={() => addFavoriteDirect(book.id, book.title)}
                                                    title="Sevimlilarga qo'shish"
                                                >
                                                    <Heart size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </section>
                    </div>
                </motion.div>
            )}

            <div className={styles.back}>
                <Link href="/" className={styles.backLink}>
                    <ArrowLeft size={16} />
                    <span>Bosh sahifaga qaytish</span>
                </Link>
            </div>
        </main>
    );
}
