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
    BarChart2,
    Bookmark,
    Check,
    Flame,
    Award,
    BookMarked,
    MessageSquare,
    Lock,
    Plus,
    Share2,
    Copy,
    Quote as QuoteIcon,
    ShoppingBag,
    Package,
    Truck,
    RefreshCw,
    CheckCircle2,
    ChevronRight,
    ChevronDown,
    ChevronUp,
    ExternalLink,
    Headphones
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { booksDB } from '../lib/books';
import { api, getStaticBookCover } from '../lib/api';
import styles from './page.module.css';
import { restoreUserSession, saveUserSession, clearUserSession } from '../lib/session';
import { syncUserFromCloud, pushDataToCloud } from '../lib/userSync';
import { formatUzbekDate, getTodayUzbekDate } from '../lib/date';

export interface OrderItemDisplay {
    id: string;
    receiptNumber: string;
    bookId: string;
    bookTitle: string;
    bookAuthor: string;
    bookImage?: string;
    format: 'electronic' | 'paper';
    price: number;
    paymentMethod: string;
    senderCardLast4?: string;
    deliveryAddress?: string | null;
    userPhone?: string;
    status: 'pending' | 'completed' | 'processing' | 'delivered' | 'cancelled';
    statusLabel?: string;
    createdAt: string;
}

type Favorite = { id: string; title: string };
type BookStatus = 'reading' | 'planned' | 'completed';
type BookStatuses = { [bookId: string]: BookStatus };
type Quote = {
    id: string;
    bookId: string;
    bookTitle: string;
    text: string;
    page?: string;
    date?: string;
    tag?: string;
};
type Activity = { id: string; text: string; time: string; type: 'system' | 'user' | 'favorite' | 'goal' };

const emojiAvatars = ['📚', '💡', '🚀', '😎', '🧠', '🎨', '📖', '🌟', '🦄', '🧙‍♂️', '🌙', '⚡', '🎭', '🧩', '🦋'];

function initials(fullName: string): string {
    if (!fullName.trim()) return '?';
    return fullName.trim()[0].toUpperCase();
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
    const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'favorites' | 'quotes' | 'history'>('profile');
    const [activityLog, setActivityLog] = useState<Activity[]>([]);

    // Orders state (Buyurtmalarim)
    const [orders, setOrders] = useState<OrderItemDisplay[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'completed'>('all');
    const [ordersVisibleLimit, setOrdersVisibleLimit] = useState<number>(6);
    const [copiedReceipt, setCopiedReceipt] = useState<string | null>(null);
    const [orderRefreshing, setOrderRefreshing] = useState(false);

    // Form inputs for Quote
    const [quoteText, setQuoteText] = useState('');
    const [quoteBookId, setQuoteBookId] = useState('');
    const [quotePageNum, setQuotePageNum] = useState('');
    const [quoteTag, setQuoteTag] = useState('Dono fikr');
    const [quoteCopiedId, setQuoteCopiedId] = useState<string | null>(null);
    const [selectedBadge, setSelectedBadge] = useState<any | null>(null);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
    const [books, setBooks] = useState<any[]>(() => api.getInitialBooks());
    const activeBooksList = books.length > 0 ? books : booksDB;
    const [successMessage, setSuccessMessage] = useState('');

    const nameRef = useRef<HTMLInputElement | null>(null);
    const emailRef = useRef<HTMLInputElement | null>(null);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Load data from LocalStorage / Cookies on mount
    useEffect(() => {
        // Multi-tier session recovery (survives Safari ITP and cache wipe)
        const session = restoreUserSession();
        let storedName = session?.name || localStorage.getItem('name') || session?.username || localStorage.getItem('username');
        const storedEmail = session?.email || localStorage.getItem('email');
        const storedBio = localStorage.getItem('user_bio');

        // Check URL tab parameter immediately
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const tabParam = params.get('tab');
            if (tabParam === 'orders' || tabParam === 'buyurtmalar') {
                setActiveTab('orders');
            } else if (tabParam === 'favorites' || tabParam === 'quotes' || tabParam === 'history' || tabParam === 'profile') {
                setActiveTab(tabParam as any);
            }
        }

        // If user made a purchase or has orders, let them access account seamlessly
        if (!storedName) {
            try {
                const rawPending = localStorage.getItem('pending_orders');
                const pList = rawPending ? JSON.parse(rawPending) : [];
                if (pList.length > 0 && pList[0].userName) {
                    const fallbackName: string = pList[0].userName;
                    storedName = fallbackName;
                    localStorage.setItem('name', fallbackName);
                } else if (pList.length > 0) {
                    storedName = 'Kitobxon';
                    localStorage.setItem('name', 'Kitobxon');
                }
            } catch { }
        }
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

        // Sanitize or set join date (fixes Chrome M06 CLDR bug)
        const cleanJoin = storedJoin ? formatUzbekDate(storedJoin) : getTodayUzbekDate();
        if (!storedJoin || storedJoin !== cleanJoin) {
            localStorage.setItem('join_date', cleanJoin);
        }
        setJoinDate(cleanJoin);

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

        // Clean up any review entries from local activity log storage
        try {
            const rawAct = localStorage.getItem('activity_log');
            if (rawAct) {
                const parsed = JSON.parse(rawAct);
                if (Array.isArray(parsed)) {
                    const filtered = parsed.filter((item: any) =>
                        !item.text?.toLowerCase().includes('sharh') &&
                        !item.text?.toLowerCase().includes('ballik')
                    );
                    localStorage.setItem('activity_log', JSON.stringify(filtered));
                }
            }
        } catch { }

        // Fetch activity logs from backend API
        api.getActivityLog().then(parsedActivity => {
            const cleanActivity = (parsedActivity || []).filter(item =>
                !item.text?.toLowerCase().includes('sharh') &&
                !item.text?.toLowerCase().includes('ballik')
            );
            setActivityLog(cleanActivity);
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

        // Sync latest cloud data for this user across all devices
        syncUserFromCloud().then(() => {
            try {
                const rawFav = localStorage.getItem('favorites');
                if (rawFav) setFavorites(JSON.parse(rawFav));
                const rawStatuses = localStorage.getItem('book_statuses');
                if (rawStatuses) setBookStatuses(JSON.parse(rawStatuses));
                const rawQuotes = localStorage.getItem('book_quotes');
                if (rawQuotes) setQuotes(JSON.parse(rawQuotes));
            } catch {}
            loadOrders(true);
        });

        const handleFavUpdate = () => {
            try {
                const raw = localStorage.getItem('favorites');
                setFavorites(raw ? JSON.parse(raw) : []);
            } catch {}
        };
        window.addEventListener('fav-updated', handleFavUpdate);
        return () => {
            window.removeEventListener('fav-updated', handleFavUpdate);
        };
    }, []);

    // Helper to format date in Uzbek
    const formatOrderDate = (dateStr?: string) => {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            const months = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
            const day = d.getDate();
            const month = months[d.getMonth()];
            const year = d.getFullYear();
            const hours = String(d.getHours()).padStart(2, '0');
            const mins = String(d.getMinutes()).padStart(2, '0');
            return `${day}-${month}, ${year}, ${hours}:${mins}`;
        } catch {
            return dateStr;
        }
    };

    // Helper to format payment method
    const formatPaymentMethod = (method?: string) => {
        switch (method?.toLowerCase()) {
            case 'payme': return 'Payme';
            case 'click': return 'Click';
            case 'uzum': return 'Uzum Pay';
            case 'card': return 'Bank kartasi';
            default: return 'To\'lov tizimi';
        }
    };

    // Tab switcher with URL query sync
    const switchTab = (tab: 'profile' | 'orders' | 'favorites' | 'quotes' | 'history') => {
        setActiveTab(tab);
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('tab', tab);
            window.history.replaceState(null, '', url.toString());
        }
    };

    // Copy receipt number to clipboard
    const copyReceipt = (receipt: string) => {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(receipt);
            setCopiedReceipt(receipt);
            setTimeout(() => setCopiedReceipt(null), 2000);
        }
    };

    // Load and sync orders from localStorage and /api/orders
    const loadOrders = async (silent = false) => {
        if (!silent) setOrdersLoading(true);
        try {
            // 1. Local pending orders
            const rawPending = localStorage.getItem('pending_orders');
            const pendingList: any[] = rawPending ? JSON.parse(rawPending) : [];

            // 2. Local purchased books
            const rawPurchased = localStorage.getItem('purchased_books');
            const purchasedList: any[] = rawPurchased ? JSON.parse(rawPurchased) : [];

            // 3. Server orders
            let serverOrders: any[] = [];
            try {
                const res = await fetch('/api/orders').then(r => r.json());
                if (res && res.success && Array.isArray(res.orders)) {
                    serverOrders = res.orders;
                }
            } catch (e) {
                console.error('Failed to fetch server orders:', e);
            }

            // 4. Cross-check pending orders and user purchases with server updates
            let updatedPending = [...pendingList];
            let updatedPurchased = [...purchasedList];
            let hadChanges = false;

            const userName = (localStorage.getItem('username') || localStorage.getItem('name') || '').toLowerCase().trim();
            const userEmail = (localStorage.getItem('email') || '').toLowerCase().trim();
            const userPhoneDigits = (localStorage.getItem('user_phone') || '').replace(/\D/g, '').slice(-9);

            serverOrders.forEach((so: any) => {
                const soUser = (so.userName || '').toLowerCase().trim();
                const soEmail = (so.userEmail || '').toLowerCase().trim();
                const isUserOrder = (userName && soUser === userName) || (userEmail && soEmail === userEmail);

                const pIdx = updatedPending.findIndex(
                    p => (p.receiptNumber && p.receiptNumber.replace('#', '') === so.receiptNumber?.replace('#', '')) ||
                        String(p.bookId) === String(so.bookId)
                );
                if (pIdx !== -1) {
                    if (so.status === 'completed' || so.status === 'delivered') {
                        const existingPurchased = updatedPurchased.find(b => String(b.id) === String(so.bookId));
                        if (!existingPurchased) {
                            updatedPurchased.push({
                                id: String(so.bookId),
                                title: so.bookTitle,
                                author: so.bookAuthor,
                                format: so.format,
                                price: so.price,
                                receiptNumber: so.receiptNumber,
                                image: so.bookImage,
                                date: so.createdAt,
                            });
                            window.dispatchEvent(new CustomEvent('book-purchased', { detail: { bookId: so.bookId } }));
                        }
                        updatedPending.splice(pIdx, 1);
                        hadChanges = true;
                    } else if (so.status === 'cancelled') {
                        updatedPending[pIdx].status = 'cancelled';
                        hadChanges = true;
                    }
                } else if (isUserOrder && (so.status === 'completed' || so.status === 'delivered')) {
                    // Buyurtma boshqa qurilmadan (masalan noutbukdan) qilingan bo'lsa ham, ushbu qurilmaga (telefonga) darhol ruxsat berish
                    const existingPurchased = updatedPurchased.find(b => String(b.id) === String(so.bookId));
                    if (!existingPurchased) {
                        updatedPurchased.push({
                            id: String(so.bookId),
                            title: so.bookTitle,
                            author: so.bookAuthor,
                            format: so.format,
                            price: so.price,
                            receiptNumber: so.receiptNumber,
                            image: so.bookImage,
                            date: so.createdAt,
                        });
                        hadChanges = true;
                        window.dispatchEvent(new CustomEvent('book-purchased', { detail: { bookId: so.bookId } }));
                    }
                }
            });

            if (hadChanges) {
                localStorage.setItem('pending_orders', JSON.stringify(updatedPending));
                localStorage.setItem('purchased_books', JSON.stringify(updatedPurchased));
                pushDataToCloud({ purchasedBooks: updatedPurchased });
            }

            // 5. Gather relevant receipts
            const knownReceipts = new Set<string>();
            updatedPending.forEach(p => p.receiptNumber && knownReceipts.add(p.receiptNumber.replace('#', '')));
            updatedPurchased.forEach(p => p.receiptNumber && knownReceipts.add(p.receiptNumber.replace('#', '')));

            const matchedServerOrders: OrderItemDisplay[] = serverOrders.filter(so => {
                const rClean = (so.receiptNumber || '').replace('#', '');
                if (knownReceipts.has(rClean)) return true;
                const soUser = (so.userName || '').toLowerCase().trim();
                const soEmail = (so.userEmail || '').toLowerCase().trim();
                if (userName && soUser === userName) return true;
                if (userEmail && soEmail === userEmail) return true;
                if (userPhoneDigits && so.userPhone && so.userPhone.replace(/\D/g, '').includes(userPhoneDigits)) return true;
                return false;
            }).map(so => ({
                id: so.id || so.receiptNumber,
                receiptNumber: so.receiptNumber.startsWith('#') ? so.receiptNumber : `#${so.receiptNumber}`,
                bookId: String(so.bookId),
                bookTitle: so.bookTitle,
                bookAuthor: so.bookAuthor,
                bookImage: getStaticBookCover(so.bookId, so.bookTitle) || so.bookImage,
                format: so.format || 'electronic',
                price: Number(so.price) || 0,
                paymentMethod: so.paymentMethod || 'card',
                senderCardLast4: so.senderCardLast4,
                deliveryAddress: so.deliveryAddress,
                userPhone: so.userPhone,
                status: so.status || 'pending',
                statusLabel: so.statusLabel,
                createdAt: so.createdAt || new Date().toISOString(),
            }));

            const merged: OrderItemDisplay[] = [...matchedServerOrders];

            updatedPending.forEach(p => {
                const cleanR = (p.receiptNumber || '').replace('#', '');
                if (!merged.some(m => m.receiptNumber.replace('#', '') === cleanR)) {
                    merged.push({
                        id: p.id || `pending_${p.bookId}`,
                        receiptNumber: (p.receiptNumber && p.receiptNumber.startsWith('#')) ? p.receiptNumber : `#${p.receiptNumber || 'AKS-000000'}`,
                        bookId: String(p.bookId),
                        bookTitle: p.bookTitle,
                        bookAuthor: p.bookAuthor,
                        bookImage: getStaticBookCover(p.bookId, p.bookTitle) || p.image,
                        format: p.format || 'electronic',
                        price: Number(p.price) || 0,
                        paymentMethod: p.paymentMethod || 'card',
                        senderCardLast4: p.senderCardLast4,
                        status: p.status || 'pending',
                        createdAt: p.date || new Date().toISOString(),
                    });
                }
            });

            updatedPurchased.forEach(p => {
                const cleanR = (p.receiptNumber || '').replace('#', '');
                if (cleanR && !merged.some(m => m.receiptNumber.replace('#', '') === cleanR)) {
                    merged.push({
                        id: `purchased_${p.id}`,
                        receiptNumber: p.receiptNumber.startsWith('#') ? p.receiptNumber : `#${p.receiptNumber}`,
                        bookId: String(p.id),
                        bookTitle: p.title,
                        bookAuthor: p.author,
                        bookImage: getStaticBookCover(p.id, p.title) || p.image,
                        format: p.format || 'electronic',
                        price: Number(p.price) || 0,
                        paymentMethod: 'card',
                        status: 'completed',
                        statusLabel: "To'langan (Faol)",
                        createdAt: p.date || new Date().toISOString(),
                    });
                }
            });

            merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setOrders(merged);
        } catch (err) {
            console.error('Error loading orders:', err);
        } finally {
            setOrdersLoading(false);
            setOrderRefreshing(false);
        }
    };

    // Check single order status
    const checkSingleOrderStatus = async (order: OrderItemDisplay) => {
        setOrderRefreshing(true);
        try {
            const cleanReceipt = order.receiptNumber.replace('#', '');
            const res = await fetch(`/api/orders?receipt=${encodeURIComponent(cleanReceipt)}`).then(r => r.json());
            if (res && res.order) {
                const serverOrd = res.order;
                if (serverOrd.status === 'completed' || serverOrd.status === 'delivered') {
                    setOrders(prev => prev.map(o => o.receiptNumber === order.receiptNumber ? { ...o, status: 'completed' } : o));
                    const rawPurchased = localStorage.getItem('purchased_books');
                    const purchased = rawPurchased ? JSON.parse(rawPurchased) : [];
                    if (!purchased.some((p: any) => String(p.id) === String(order.bookId))) {
                        purchased.push({
                            id: String(order.bookId),
                            title: order.bookTitle,
                            author: order.bookAuthor,
                            format: order.format,
                            price: order.price,
                            receiptNumber: order.receiptNumber,
                            image: order.bookImage,
                            date: new Date().toISOString(),
                        });
                        localStorage.setItem('purchased_books', JSON.stringify(purchased));
                        window.dispatchEvent(new CustomEvent('book-purchased', { detail: { bookId: order.bookId } }));
                    }
                    const rawPending = localStorage.getItem('pending_orders');
                    if (rawPending) {
                        const pending = JSON.parse(rawPending).filter((p: any) => String(p.bookId) !== String(order.bookId));
                        localStorage.setItem('pending_orders', JSON.stringify(pending));
                    }
                    setSuccessMessage("To'lov tasdiqlandi! Kitob mutolaa uchun ochildi 🎉");
                    setTimeout(() => setSuccessMessage(''), 4000);
                } else if (serverOrd.status === 'cancelled') {
                    setOrders(prev => prev.map(o => o.receiptNumber === order.receiptNumber ? { ...o, status: 'cancelled' } : o));
                    setSuccessMessage("Buyurtma bekor qilingan");
                    setTimeout(() => setSuccessMessage(''), 3000);
                } else {
                    setSuccessMessage("To'lov hali tekshirilmoqda. Iltimos, biroz kuting ");
                    setTimeout(() => setSuccessMessage(''), 3500);
                }
            } else {
                setSuccessMessage("Buyurtma holati yangilandi");
                setTimeout(() => setSuccessMessage(''), 2500);
            }
        } catch (e) {
            console.error('Check status error:', e);
        } finally {
            setOrderRefreshing(false);
            loadOrders(true);
        }
    };

    // Manual refresh button
    const handleManualRefresh = () => {
        setOrderRefreshing(true);
        loadOrders(false);
        setSuccessMessage("Buyurtmalar yangilandi");
        setTimeout(() => setSuccessMessage(''), 2500);
    };

    // Listen to real-time events for instant updates
    useEffect(() => {
        loadOrders(true);

        const handleTabFromUrl = () => {
            const params = new URLSearchParams(window.location.search);
            const tabParam = params.get('tab');
            if (tabParam === 'orders' || tabParam === 'buyurtmalar') {
                setActiveTab('orders');
            }
        };

        const handleOrderSubmitted = () => {
            loadOrders(false);
            setActiveTab('orders');
        };

        const handleFocus = () => {
            loadOrders(true);
        };

        window.addEventListener('popstate', handleTabFromUrl);
        window.addEventListener('order-submitted', handleOrderSubmitted);
        window.addEventListener('book-purchased', handleOrderSubmitted);
        window.addEventListener('focus', handleFocus);

        return () => {
            window.removeEventListener('popstate', handleTabFromUrl);
            window.removeEventListener('order-submitted', handleOrderSubmitted);
            window.removeEventListener('book-purchased', handleOrderSubmitted);
            window.removeEventListener('focus', handleFocus);
        };
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
        const currentUsername = localStorage.getItem('username') || name;
        saveUserSession({
            username: currentUsername,
            name: name,
            email: email,
            join_date: joinDate,
        });
        localStorage.setItem('user_bio', bio);
        setEditing(false);
        setIsLoggedIn(true);
        pushDataToCloud({ profile: { name, email, bio, avatar: avatarEmoji, accent, dailyGoal } });
        setSuccessMessage('Profil muvaffaqiyatli saqlandi ✓');
        logEvent('Profil sozlamalari yangilandi', 'user');
        setTimeout(() => setSuccessMessage(''), 3000);
    }

    function changeAccent(newAccent: 'blue' | 'purple' | 'emerald' | 'amber') {
        setAccent(newAccent);
        localStorage.setItem('account_accent', newAccent);
        window.dispatchEvent(new Event('auth-changed'));
        pushDataToCloud({ profile: { accent: newAccent } });
        logEvent(`Rangli mavzu o'zgartirildi (${newAccent})`, 'user');
        setSuccessMessage('Mavzu rangi yangilandi');
        setTimeout(() => setSuccessMessage(''), 2000);
    }

    function selectAvatar(emoji: string) {
        setAvatarEmoji(emoji);
        localStorage.setItem('account_avatar', emoji);
        setShowAvatarSelector(false);
        pushDataToCloud({ profile: { avatar: emoji } });
        logEvent(`Shaxsiy avatar yangilandi: ${emoji}`, 'user');
        setSuccessMessage('Avatar o‘zgartirildi');
        setTimeout(() => setSuccessMessage(''), 2000);
    }

    function removeAvatarEmoji() {
        setAvatarEmoji('');
        localStorage.removeItem('account_avatar');
        setShowAvatarSelector(false);
        pushDataToCloud({ profile: { avatar: '' } });
        logEvent("Shaxsiy avatar olib tashlandi (ism bosh harflariga qaytarildi)", 'user');
        setSuccessMessage('Avatar olib tashlandi');
        setTimeout(() => setSuccessMessage(''), 2000);
    }

    // Goal Tracker interactions
    function handleGoalSelect(min: number) {
        setDailyGoal(min);
        localStorage.setItem('daily_goal', String(min));
        pushDataToCloud({ profile: { dailyGoal: min } });
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
        pushDataToCloud({ bookStatuses: nextStatuses });

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
            text: quoteText.trim(),
            page: quotePageNum.trim() || undefined,
            date: getTodayUzbekDate(),
            tag: quoteTag
        };

        const nextQuotes = [newQuote, ...quotes];
        setQuotes(nextQuotes);
        localStorage.setItem('book_quotes', JSON.stringify(nextQuotes));
        pushDataToCloud({ quotes: nextQuotes });

        setQuoteText('');
        setQuoteBookId('');
        setQuotePageNum('');
        logEvent(`"${bookTitle}" kitobidan yangi iqtibos saqlandi`, 'user');
        setSuccessMessage('Iqtibos muvaffaqiyatli saqlandi');
        setTimeout(() => setSuccessMessage(''), 2500);
    }

    function removeQuote(id: string, title: string) {
        const nextQuotes = quotes.filter(q => q.id !== id);
        setQuotes(nextQuotes);
        localStorage.setItem('book_quotes', JSON.stringify(nextQuotes));
        pushDataToCloud({ quotes: nextQuotes });
        logEvent(`"${title}" kitobidan olingan iqtibos o'chirildi`, 'user');
    }

    function copyQuote(q: Quote) {
        const pageInfo = q.page ? ` (${q.page}-bet)` : '';
        const textToCopy = `«${q.text}»\n\n— "${q.bookTitle}"${pageInfo}\nKitoblar Portali`;
        navigator.clipboard.writeText(textToCopy).then(() => {
            setQuoteCopiedId(q.id);
            setTimeout(() => setQuoteCopiedId(null), 2000);
        });
    }

    function shareQuote(q: Quote) {
        const pageInfo = q.page ? ` (${q.page}-bet)` : '';
        const text = `«${q.text}»\n\n— "${q.bookTitle}"${pageInfo}\nKitoblar Portali`;
        if (navigator.share && window.location.protocol === 'https:') {
            navigator.share({ title: `Iqtibos: ${q.bookTitle}`, text }).catch(() => { });
        } else {
            const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(window.location.origin)}&text=${encodeURIComponent(text)}`;
            window.open(tgUrl, '_blank');
        }
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
        clearUserSession();

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
        pushDataToCloud({ favorites: next });
    }

    function removeFavoriteDirect(id: string, title: string) {
        const next = favorites.filter((f) => f.id !== id);
        setFavorites(next);
        localStorage.setItem('favorites', JSON.stringify(next));
        logEvent(`"${title}" kitobi sevimlilardan o'chirildi`, 'favorite');
        try { window.dispatchEvent(new CustomEvent('fav-updated')); } catch { }
        pushDataToCloud({ favorites: next });
    }

    function clearFavorites() {
        setFavorites([]);
        localStorage.removeItem('favorites');
        logEvent('Barcha sevimli kitoblar o‘chirib tashlandi', 'favorite');
        try { window.dispatchEvent(new CustomEvent('fav-updated')); } catch { }
        pushDataToCloud({ favorites: [] });
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

    const weeklyBooks = activeBooksList.filter(book => Boolean(book.is_weekly_top || book.isWeeklyTop));
    const recommendedBooks = weeklyBooks.length > 0 ? weeklyBooks : activeBooksList.slice(0, 1);

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

                        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                            <Link href="/login" style={{
                                display: 'inline-block',
                                background: '#3b82f6',
                                color: 'white',
                                padding: '12px 24px',
                                borderRadius: '8px',
                                textDecoration: 'none',
                                fontWeight: 600
                            }}>
                                Tizimga Kirish
                            </Link>
                            <p style={{ marginTop: '1rem', color: '#94a3b8' }}>
                                Hisobingiz yo'qmi? <Link href="/register" style={{ color: '#3b82f6', textDecoration: 'underline' }}>Ro'yxatdan o'ting</Link>
                            </p>
                        </div>
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
                                        {formatUzbekDate(joinDate)}{" "}dan beri a&apos;zo
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
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                    <span className={styles.accentTitle} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Award size={14} style={{ color: 'var(--user-accent)' }} />
                                        Yutuqlar va Nishonlar
                                    </span>
                                    <span style={{ fontSize: '0.72rem', color: 'var(--user-accent)', fontWeight: 700 }}>
                                        {getAchievements().filter(b => b.unlocked).length} / {getAchievements().length}
                                    </span>
                                </div>
                                <div className={styles.badgeGrid}>
                                    {getAchievements().map(badge => (
                                        <div
                                            key={badge.id}
                                            className={`${styles.badgeItem} ${!badge.unlocked ? styles.badgeLocked : styles.badgeUnlockedActive}`}
                                            onClick={() => setSelectedBadge(badge)}
                                            role="button"
                                            tabIndex={0}
                                        >
                                            <span className={styles.badgeIcon}>{badge.icon}</span>
                                            <span className={styles.badgeName}>{badge.name}</span>
                                            {!badge.unlocked ? (
                                                <Lock size={10} className={styles.badgeLockedIcon} />
                                            ) : (
                                                <div style={{ position: 'absolute', top: '2px', right: '2px', width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.sidebarControls}>
                                <button
                                    className={`${styles.btn} ${editing ? styles.btnSecondary : styles.btnPrimary} `}
                                    onClick={() => {
                                        const next = !editing;
                                        setEditing(next);
                                        if (next) setActiveTab('profile');
                                    }}
                                    style={{ width: '100%' }}
                                >
                                    <Edit3 size={16} />
                                    {editing ? 'Tahrirlashni yopish' : 'Profilni tahrirlash'}
                                </button>
                                <button className={`${styles.btn} ${styles.btnDanger}`} onClick={() => setShowLogoutConfirm(true)} style={{ width: '100%' }}>
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
                                    onClick={() => switchTab('profile')}
                                >
                                    <Settings size={16} />
                                    <span>Sozlamalar</span>
                                </button>
                                <button
                                    className={`${styles.tabBtn} ${activeTab === 'orders' ? styles.activeTabBtn : ''}`}
                                    onClick={() => switchTab('orders')}
                                >
                                    <ShoppingBag size={16} />
                                    <span>Buyurtmalarim ({orders.length})</span>
                                </button>
                                <button
                                    className={`${styles.tabBtn} ${activeTab === 'favorites' ? styles.activeTabBtn : ''}`}
                                    onClick={() => switchTab('favorites')}
                                >
                                    <Heart size={16} />
                                    <span>Kitob javoni ({favorites.length})</span>
                                </button>
                                <button
                                    className={`${styles.tabBtn} ${activeTab === 'quotes' ? styles.activeTabBtn : ''}`}
                                    onClick={() => switchTab('quotes')}
                                >
                                    <MessageSquare size={16} />
                                    <span>Iqtiboslar ({quotes.length})</span>
                                </button>
                                <button
                                    className={`${styles.tabBtn} ${activeTab === 'history' ? styles.activeTabBtn : ''}`}
                                    onClick={() => switchTab('history')}
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
                                                            <p style={{ fontSize: '0.95rem', marginTop: '2px' }}>{formatUzbekDate(joinDate)}</p>
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
                                                                type="email"
                                                                placeholder="example@mail.com"
                                                                className={styles.inputField}
                                                                readOnly
                                                                disabled
                                                                style={{ opacity: 0.6, cursor: 'not-allowed' }}
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

                                {/* ORDERS TAB (BUYURTMALARIM) */}
                                {activeTab === 'orders' && (
                                    <motion.div
                                        key="orders-tab"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className={styles.ordersTabWrapper}
                                    >
                                        <div className={styles.glassCard} style={{ marginBottom: 0 }}>
                                            {/* Header Toolbar */}
                                            <div className={styles.ordersHeaderToolbar}>
                                                <div>
                                                    <h3 className={styles.ordersHeading}>Buyurtmalarim va Xaridlar</h3>
                                                    <p className={styles.ordersSubheading}>
                                                        Barcha to&apos;lovlar, cheklar va xarid qilingan kitoblaringiz ro&apos;yxati
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handleManualRefresh}
                                                    className={styles.refreshOrdersBtn}
                                                    disabled={orderRefreshing}
                                                    title="Buyurtmalar holatini tekshirish va yangilash"
                                                >
                                                    <RefreshCw size={14} className={orderRefreshing ? styles.spinAnim : ''} />
                                                    <span>{orderRefreshing ? 'Tekshirilmoqda...' : 'Holatni yangilash'}</span>
                                                </button>
                                            </div>

                                            {/* Filter Pills */}
                                            {orders.length > 0 && (
                                                <div className={styles.ordersFiltersRow} style={{ marginTop: '0.75rem', marginBottom: '1.25rem' }}>
                                                    <button 
                                                        type="button"
                                                        className={`${styles.filterPill} ${orderFilter === 'all' ? styles.activeFilterPill : ''}`}
                                                        onClick={() => { setOrderFilter('all'); setOrdersVisibleLimit(6); }}
                                                    >
                                                        Barchasi ({orders.length})
                                                    </button>
                                                    <button 
                                                        type="button"
                                                        className={`${styles.filterPill} ${orderFilter === 'pending' ? styles.activeFilterPill : ''}`}
                                                        onClick={() => { setOrderFilter('pending'); setOrdersVisibleLimit(6); }}
                                                    >
                                                        ⏳ Tekshirilmoqda ({orders.filter(o => o.status === 'pending').length})
                                                    </button>
                                                    <button 
                                                        type="button"
                                                        className={`${styles.filterPill} ${orderFilter === 'completed' ? styles.activeFilterPill : ''}`}
                                                        onClick={() => { setOrderFilter('completed'); setOrdersVisibleLimit(6); }}
                                                    >
                                                        ✅ Tasdiqlangan ({orders.filter(o => o.status === 'completed' || o.status === 'delivered').length})
                                                    </button>
                                                </div>
                                            )}

                                            {/* Orders Content */}
                                            {orders.length === 0 ? (
                                                <div className={styles.emptyOrdersCard}>
                                                    <div className={styles.emptyOrdersIcon}>
                                                        <ShoppingBag size={32} />
                                                    </div>
                                                    <h4 className={styles.emptyOrdersTitle}>Sizda hali buyurtmalar mavjud emas</h4>
                                                    <p className={styles.emptyOrdersText}>
                                                        Kitoblar katalogidan o&apos;zingizga yoqqan asarni tanlang va xarid qiling. Elektron kitoblar to&apos;lov tasdiqlangach darhol mutolaa uchun ochiladi.
                                                    </p>
                                                    <Link href="/search" className={styles.browseBooksBtn}>
                                                        <BookOpen size={16} /> Kitoblar katalogiga o&apos;tish
                                                    </Link>
                                                </div>
                                            ) : (
                                                (() => {
                                                    const filtered = orders.filter(o => {
                                                        if (orderFilter === 'pending') return o.status === 'pending';
                                                        if (orderFilter === 'completed') return o.status === 'completed' || o.status === 'delivered';
                                                        return true;
                                                    });

                                                    if (filtered.length === 0) {
                                                        return (
                                                            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                                                Bu filtr bo&apos;yicha hech qanday buyurtma topilmadi.
                                                            </div>
                                                        );
                                                    }

                                                    const visibleOrders = filtered.slice(0, ordersVisibleLimit);
                                                    const hasMore = filtered.length > ordersVisibleLimit;
                                                    const remainingCount = filtered.length - visibleOrders.length;
                                                    const nextBatch = Math.min(6, remainingCount);

                                                    return (
                                                        <>
                                                            <div className={styles.ordersList}>
                                                                {visibleOrders.map(order => {
                                                                const isCompleted = order.status === 'completed' || order.status === 'delivered';
                                                                const isPending = order.status === 'pending';
                                                                const isPaper = order.format === 'paper';

                                                                return (
                                                                    <div key={order.id} className={styles.orderCard}>
                                                                        {/* Card Header: Receipt & Status */}
                                                                        <div className={styles.orderCardHeader}>
                                                                            <div className={styles.receiptBadge}>
                                                                                <span className={styles.receiptTag}>Chek:</span>
                                                                                <strong>{order.receiptNumber}</strong>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => copyReceipt(order.receiptNumber)}
                                                                                    title="Chek raqamidan nusxa olish"
                                                                                    className={styles.copyReceiptBtn}
                                                                                >
                                                                                    {copiedReceipt === order.receiptNumber ? (
                                                                                        <Check size={13} className={styles.copySuccessIcon} />
                                                                                    ) : (
                                                                                        <Copy size={13} />
                                                                                    )}
                                                                                    {copiedReceipt === order.receiptNumber && (
                                                                                        <span className={styles.copyTooltip}>Nusxa olindi!</span>
                                                                                    )}
                                                                                </button>
                                                                            </div>

                                                                            <div className={styles.orderHeaderRight}>
                                                                                <span className={styles.orderDate}>
                                                                                    <Calendar size={13} />
                                                                                    {formatOrderDate(order.createdAt)}
                                                                                </span>
                                                                                {isPending && (
                                                                                    <div className={`${styles.statusBadge} ${styles.statusPending}`}>
                                                                                        <span className={styles.statusPulseDot}></span>
                                                                                        <Clock size={13} />
                                                                                        <span>To&apos;lov tekshirilmoqda</span>
                                                                                    </div>
                                                                                )}
                                                                                {isCompleted && (
                                                                                    <div className={`${styles.statusBadge} ${styles.statusCompleted}`}>
                                                                                        <CheckCircle2 size={13} />
                                                                                        <span>To&apos;langan (Faol)</span>
                                                                                    </div>
                                                                                )}
                                                                                {order.status === 'processing' && (
                                                                                    <div className={`${styles.statusBadge} ${styles.statusProcessing}`}>
                                                                                        <Truck size={13} />
                                                                                        <span>Yetkazilmoqda</span>
                                                                                    </div>
                                                                                )}
                                                                                {order.status === 'cancelled' && (
                                                                                    <div className={`${styles.statusBadge} ${styles.statusCancelled}`}>
                                                                                        <AlertCircle size={13} />
                                                                                        <span>Bekor qilingan</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        {/* Card Body */}
                                                                        <div className={styles.orderCardBody}>
                                                                            <div className={styles.orderCoverWrapper}>
                                                                                <Image
                                                                                    src={order.bookImage || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=600'}
                                                                                    alt={order.bookTitle}
                                                                                    fill
                                                                                    sizes="70px"
                                                                                    className={styles.orderCoverImg}
                                                                                    unoptimized
                                                                                />
                                                                            </div>

                                                                            <div className={styles.orderMainInfo}>
                                                                                <Link href={`/book/${order.bookId}`} className={styles.orderBookTitle}>
                                                                                    {order.bookTitle}
                                                                                </Link>
                                                                                <p className={styles.orderBookAuthor}>{order.bookAuthor}</p>

                                                                                <div className={styles.orderMetaTags}>
                                                                                    <span className={styles.orderMetaTag}>
                                                                                        {isPaper ? "📦 Bosma kitob (Yetkazish)" : "📱 Elektron kitob"}
                                                                                    </span>
                                                                                    <span className={styles.orderMetaTag}>
                                                                                        💳 {formatPaymentMethod(order.paymentMethod)} {order.senderCardLast4 ? `(*${order.senderCardLast4})` : ''}
                                                                                    </span>
                                                                                    {order.deliveryAddress && (
                                                                                        <span className={styles.orderMetaTag} title={order.deliveryAddress}>
                                                                                            📍 {order.deliveryAddress}
                                                                                        </span>
                                                                                    )}
                                                                                    {order.userPhone && isPaper && (
                                                                                        <span className={styles.orderMetaTag}>
                                                                                            📞 {order.userPhone}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            </div>

                                                                            <div className={styles.orderRightCol}>
                                                                                <div className={styles.orderPriceTag}>
                                                                                    {order.price.toLocaleString('uz-UZ')} so&apos;m
                                                                                </div>

                                                                                <div className={styles.orderActionButtons}>
                                                                                    {isCompleted ? (
                                                                                        <>
                                                                                            {!isPaper ? (
                                                                                                <Link href={`/book/${order.bookId}/read`} className={styles.orderReadBtn}>
                                                                                                    <BookOpen size={15} /> Mutolaa qilish
                                                                                                </Link>
                                                                                            ) : (
                                                                                                <div className={styles.orderReadBtn} style={{ background: '#0ea5e9' }}>
                                                                                                    <Truck size={15} /> Tez orada yetkaziladi
                                                                                                </div>
                                                                                            )}
                                                                                            <Link href={`/book/${order.bookId}`} className={styles.orderListenBtn}>
                                                                                                <Headphones size={15} /> Sahifaga o&apos;tish
                                                                                            </Link>
                                                                                        </>
                                                                                    ) : isPending ? (
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => checkSingleOrderStatus(order)}
                                                                                            className={styles.orderCheckStatusBtn}
                                                                                            title="To'lov holatini tekshirish"
                                                                                        >
                                                                                            <RefreshCw size={13} className={orderRefreshing ? styles.spinAnim : ''} />
                                                                                            <span>Holatni tekshirish</span>
                                                                                        </button>
                                                                                    ) : (
                                                                                        <span className={styles.orderCancelledText}>Buyurtma bekor qilingan</span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {/* Card Footer: Pending info banner */}
                                                                        {isPending && (
                                                                            <div className={styles.orderPendingNotice}>
                                                                                <Sparkles size={14} className={styles.noticeIcon} />
                                                                                <span>
                                                                                    To&apos;lovingiz admin tomonidan tekshirilmoqda . Tasdiqlangach bu yerda &quot;Mutolaa qilish&quot; tugmasi chiqadi.
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>

                                                                {/* Load More Pagination for Orders */}
                                                                {hasMore && (
                                                                    <div className={styles.loadMoreContainer}>
                                                                        <button 
                                                                            type="button" 
                                                                            onClick={() => setOrdersVisibleLimit(prev => prev + 6)}
                                                                            className={styles.loadMoreOrdersBtn}
                                                                            title="Keyingi 6 ta buyurtmani ko'rish"
                                                                        >
                                                                            <ChevronDown size={18} />
                                                                            <span>Yana ko&apos;rsatish (+{nextBatch} ta)</span>
                                                                        </button>
                                                                        <span className={styles.loadMoreCounter}>
                                                                            {visibleOrders.length} / {filtered.length} ta buyurtma ko&apos;rsatilmoqda
                                                                        </span>
                                                                    </div>
                                                                )}

                                                                {/* If user expanded beyond 6 and reached the end, allow collapsing back to 6 */}
                                                                {!hasMore && filtered.length > 6 && (
                                                                    <div className={styles.loadMoreContainer}>
                                                                        <button 
                                                                            type="button" 
                                                                            onClick={() => setOrdersVisibleLimit(6)}
                                                                            className={styles.collapseOrdersBtn}
                                                                            title="Boshlang'ich 6 tasiga qaytarish"
                                                                        >
                                                                            <ChevronUp size={16} />
                                                                            <span>Boshlang&apos;ich 6 tasini ko&apos;rsatish</span>
                                                                        </button>
                                                                        <span className={styles.loadMoreCounter}>
                                                                            Barcha {filtered.length} ta buyurtma to&apos;liq ko&apos;rsatildi
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </>
                                                        );
                                                    })()
                                            )}
                                        </div>
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
                                        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <QuoteIcon size={20} style={{ color: 'var(--user-accent, var(--accent-blue))' }} />
                                            Kitob iqtiboslari va Eslatmalar
                                        </h3>
                                        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                                            Mutolaa davomida qalbingizga yoqqan dono satrlar va shaxsiy fikrlaringizni shu yerda to'plang.
                                        </p>

                                        {/* Add Quote Form */}
                                        <form className={styles.quoteForm} onSubmit={handleAddQuote} style={{
                                            background: 'rgba(255, 255, 255, 0.02)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '16px',
                                            padding: '1.25rem',
                                            marginBottom: '2rem'
                                        }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
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
                                                    <label className={styles.fieldTitle}>Sahifa raqami (ixtiyoriy)</label>
                                                    <input
                                                        type="text"
                                                        value={quotePageNum}
                                                        onChange={(e) => setQuotePageNum(e.target.value)}
                                                        placeholder="Masalan: 45"
                                                        className={styles.textField}
                                                    />
                                                </div>

                                                <div className={styles.field}>
                                                    <label className={styles.fieldTitle}>Turi / Teg</label>
                                                    <select
                                                        value={quoteTag}
                                                        onChange={(e) => setQuoteTag(e.target.value)}
                                                        className={styles.selectField}
                                                    >
                                                        <option value="Dono fikr">💡 Dono fikr</option>
                                                        <option value="Shaxsiy eslatma">✍️ Shaxsiy eslatma</option>
                                                        <option value="Hayotiy saboq">🌟 Hayotiy saboq</option>
                                                        <option value="Motivatsiya">🔥 Motivatsiya</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className={styles.field} style={{ marginBottom: '1rem' }}>
                                                <label className={styles.fieldTitle}>Iqtibos matni</label>
                                                <textarea
                                                    value={quoteText}
                                                    onChange={(e) => setQuoteText(e.target.value)}
                                                    placeholder="Sizga yoqqan ajoyib iqtibos yoki eslatmani yozing..."
                                                    className={styles.textareaField}
                                                    rows={3}
                                                    required
                                                />
                                            </div>

                                            <button
                                                type="submit"
                                                className={`${styles.btn} ${styles.btnPrimary}`}
                                                disabled={!quoteText.trim() || !quoteBookId}
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                            >
                                                <Plus size={16} /> Iqtibosni saqlash
                                            </button>
                                        </form>

                                        {quotes.length === 0 ? (
                                            <div className={styles.emptyState}>
                                                <div style={{
                                                    width: '64px', height: '64px', borderRadius: '50%',
                                                    background: 'rgba(59, 130, 246, 0.1)', display: 'flex',
                                                    alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem',
                                                    color: 'var(--user-accent, var(--accent-blue))'
                                                }}>
                                                    <MessageSquare size={32} />
                                                </div>
                                                <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                                                    Sizda hali iqtiboslar yo&apos;q
                                                </p>
                                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                                                    Yuqoridagi shakl orqali sevimli kitoblaringizdan ajoyib fikrlarni saqlab boring!
                                                </p>
                                            </div>
                                        ) : (
                                            <div className={styles.quotesList}>
                                                {quotes.map(q => (
                                                    <div key={q.id} className={styles.quoteCard} style={{
                                                        background: 'var(--search-bg)',
                                                        border: '1px solid var(--border-color)',
                                                        borderRadius: '16px',
                                                        padding: '1.25rem',
                                                        position: 'relative'
                                                    }}>
                                                        {q.tag && (
                                                            <div style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '4px',
                                                                fontSize: '0.75rem',
                                                                fontWeight: 600,
                                                                color: 'var(--user-accent, var(--accent-blue))',
                                                                background: 'rgba(59, 130, 246, 0.1)',
                                                                padding: '2px 8px',
                                                                borderRadius: '6px',
                                                                marginBottom: '0.75rem'
                                                            }}>
                                                                {q.tag}
                                                            </div>
                                                        )}
                                                        <p className={styles.quoteText} style={{
                                                            fontSize: '1.05rem',
                                                            lineHeight: 1.6,
                                                            color: 'var(--text-primary)',
                                                            fontStyle: 'italic',
                                                            marginBottom: '1rem'
                                                        }}>
                                                            &ldquo;{q.text}&rdquo;
                                                        </p>
                                                        <div className={styles.quoteMeta} style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            flexWrap: 'wrap',
                                                            gap: '8px',
                                                            paddingTop: '0.75rem',
                                                            borderTop: '1px solid rgba(255, 255, 255, 0.05)'
                                                        }}>
                                                            <div>
                                                                <span className={styles.quoteBook} style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                                                    {q.bookTitle}
                                                                </span>
                                                                {q.page && (
                                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '6px' }}>
                                                                        • {q.page}-bet
                                                                    </span>
                                                                )}
                                                                {q.date && (
                                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '6px', opacity: 0.7 }}>
                                                                        ({q.date})
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <button
                                                                    onClick={() => copyQuote(q)}
                                                                    title="Nusxalash"
                                                                    style={{
                                                                        background: 'rgba(255, 255, 255, 0.05)',
                                                                        border: '1px solid var(--border-color)',
                                                                        color: quoteCopiedId === q.id ? '#10b981' : 'var(--text-secondary)',
                                                                        borderRadius: '8px',
                                                                        padding: '6px 10px',
                                                                        fontSize: '0.78rem',
                                                                        cursor: 'pointer',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '4px'
                                                                    }}
                                                                >
                                                                    {quoteCopiedId === q.id ? <Check size={14} /> : <Copy size={14} />}
                                                                    {quoteCopiedId === q.id ? 'Nusxalandi' : 'Nusxalash'}
                                                                </button>
                                                                <button
                                                                    onClick={() => shareQuote(q)}
                                                                    title="Telegram orqali ulashish"
                                                                    style={{
                                                                        background: 'rgba(34, 158, 217, 0.15)',
                                                                        border: '1px solid rgba(34, 158, 217, 0.3)',
                                                                        color: '#229ED9',
                                                                        borderRadius: '8px',
                                                                        padding: '6px 10px',
                                                                        fontSize: '0.78rem',
                                                                        cursor: 'pointer',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '4px'
                                                                    }}
                                                                >
                                                                    <Share2 size={14} /> Ulashish
                                                                </button>
                                                                <button
                                                                    className={`${styles.btn} ${styles.btnDanger}`}
                                                                    style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                                                                    onClick={() => removeQuote(q.id, q.bookTitle)}
                                                                    title="O'chirish"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
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

            {/* Badge Detail Interactive Modal */}
            {selectedBadge && (
                <div
                    style={{
                        position: 'fixed', inset: 0, zIndex: 9999,
                        backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
                    }}
                    onClick={() => setSelectedBadge(null)}
                >
                    <div
                        style={{
                            background: 'var(--card-bg, #141720)',
                            border: '1px solid var(--card-border, rgba(255,255,255,0.1))',
                            borderRadius: '24px', padding: '2rem 1.75rem', width: '100%', maxWidth: '340px',
                            textAlign: 'center', boxShadow: '0 25px 60px rgba(0,0,0,0.5)', position: 'relative'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{
                            width: '72px', height: '72px', borderRadius: '50%',
                            background: selectedBadge.unlocked ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.05)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 1rem', fontSize: '2.5rem',
                            border: `2px solid ${selectedBadge.unlocked ? '#10b981' : 'rgba(255,255,255,0.1)'}`
                        }}>
                            {selectedBadge.icon}
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                            {selectedBadge.name}
                        </h3>
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            fontSize: '0.78rem', fontWeight: 700, padding: '3px 10px', borderRadius: '99px',
                            marginBottom: '1rem',
                            background: selectedBadge.unlocked ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.12)',
                            color: selectedBadge.unlocked ? '#10b981' : '#f87171'
                        }}>
                            {selectedBadge.unlocked ? '✓ Qo\'lga kiritilgan' : '🔒 Qulflangan'}
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                            {selectedBadge.desc}
                        </p>
                        <button
                            onClick={() => setSelectedBadge(null)}
                            className={`${styles.btn} ${styles.btnPrimary}`}
                            style={{ width: '100%' }}
                        >
                            Tushunarli
                        </button>
                    </div>
                </div>
            )}

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
                }}>
                    <div style={{
                        background: 'var(--card-bg, #121826)',
                        border: '1px solid var(--card-border, rgba(255, 255, 255, 0.12))',
                        borderRadius: '20px', padding: '2rem 1.75rem', maxWidth: '380px', width: '100%',
                        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)', textAlign: 'center',
                        animation: 'fadeIn 0.2s ease-out'
                    }}>
                        <div style={{
                            width: '56px', height: '56px', borderRadius: '16px',
                            background: 'rgba(239, 68, 68, 0.12)', color: '#f87171',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 1.25rem'
                        }}>
                            <LogOut size={28} />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                            Hisobdan chiqish
                        </h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.75rem', lineHeight: 1.5 }}>
                            Haqiqatan ham hisobingizdan chiqmoqchimisiz?
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <button
                                type="button"
                                onClick={() => setShowLogoutConfirm(false)}
                                style={{
                                    padding: '11px 16px', borderRadius: '12px',
                                    background: 'var(--search-bg, rgba(255,255,255,0.06))',
                                    border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
                                    color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem',
                                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s'
                                }}
                            >
                                Bekor qilish
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowLogoutConfirm(false);
                                    logout();
                                }}
                                style={{
                                    padding: '11px 16px', borderRadius: '12px',
                                    background: '#ef4444', border: 'none',
                                    color: '#fff', fontWeight: 700, fontSize: '0.9rem',
                                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                                    boxShadow: '0 4px 15px rgba(239, 68, 68, 0.35)'
                                }}
                            >
                                Ha, chiqish
                            </button>
                        </div>
                    </div>
                </div>
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
