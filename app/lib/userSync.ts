/**
 * app/lib/userSync.ts
 * Foydalanuvchi hisobiga tegishli barcha ma'lumotlarni (sevimlilar, xaridlar, profil, iqtiboslar)
 * turli qurilmalar (noutbuk, telefon, planshet) o'rtasida real vaqtda bulut orqali sinxronlash moduli.
 */

import { restoreUserSession } from './session';

export interface FavoriteItem {
  id: string;
  title: string;
  author: string;
  price: string;
  rating: number;
  image: string;
  category: string;
}

export interface PurchasedBookItem {
  id: string;
  title: string;
  author: string;
  format?: string;
  price?: number;
  receiptNumber?: string;
  image?: string;
  date?: string;
}

function getActiveUser(): { username: string; email: string } | null {
  if (typeof window === 'undefined') return null;
  const session = restoreUserSession();
  const username = session?.username || localStorage.getItem('username')?.trim() || localStorage.getItem('name')?.trim() || '';
  const email = session?.email || localStorage.getItem('email')?.trim() || '';
  if (!username && !email) return null;
  return { username, email };
}

let isSyncing = false;
let lastSyncTime = 0;

/**
 * Bulutdan foydalanuvchi ma'lumotlarini yuklash va mahalliy xotira (localStorage) bilan sinxronlash
 */
export async function syncUserFromCloud(
  overrideUsername?: string,
  options?: { mergeGuestFavorites?: boolean }
): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const now = Date.now();
  // Too frequent requests debounce (kamida 2 soniya oraliq)
  if (isSyncing || (now - lastSyncTime < 2000 && !overrideUsername)) {
    return false;
  }

  const user = getActiveUser();
  const username = overrideUsername || user?.username;
  const email = user?.email;

  if (!username && !email) return false;

  isSyncing = true;
  lastSyncTime = now;

  try {
    const params = new URLSearchParams();
    if (username) params.set('username', username);
    if (email) params.set('email', email);

    const res = await fetch(`/api/user/sync?${params.toString()}`);
    if (!res.ok) throw new Error('Sinxronlash so\'rovi xatosi');

    const result = await res.json();
    if (!result?.success || !result.data) return false;

    const cloudData = result.data;
    let localChanged = false;

    // 1. Sevimlilarni (Favorites) xavfsiz sinxronlash (Merge/Union)
    try {
      const rawFav = localStorage.getItem('favorites');
      const localFavs: FavoriteItem[] = rawFav ? JSON.parse(rawFav) : [];
      const cloudFavs: FavoriteItem[] = Array.isArray(cloudData.favorites) ? cloudData.favorites : [];

      // Yaqinda o'chirilgan sevimlilar ro'yxati (qayta tirilmasligi uchun)
      let deletedFavs: string[] = [];
      try {
        deletedFavs = JSON.parse(localStorage.getItem('deleted_favorites') || '[]');
      } catch {}

      // Mahalliy va bulut sevimlilarini birlashtiramiz (Merge/Union):
      // Foydalanuvchi hozirgina qo'shgan kitob hech qachon serverdagi eski kesh sababli o'chib ketmaydi!
      const mergedMap = new Map<string, FavoriteItem>();

      // 1. Avval bulutdagi kitoblarni qo'shamiz (agar yaqinda o'chirilmagan bo'lsa)
      cloudFavs.forEach(f => {
        if (f?.id && !deletedFavs.includes(String(f.id))) {
          mergedMap.set(String(f.id), f);
        }
      });

      // 2. So'ngra mahalliy sevimlilarni qo'shamiz (foydalanuvchi bosgan kitoblar ustuvor)
      localFavs.forEach(f => {
        if (f?.id && !deletedFavs.includes(String(f.id))) {
          mergedMap.set(String(f.id), f);
        }
      });

      const mergedList = Array.from(mergedMap.values());
      const mergedStr = JSON.stringify(mergedList);

      if (rawFav !== mergedStr) {
        localStorage.setItem('favorites', mergedStr);
        localChanged = true;
        try { window.dispatchEvent(new CustomEvent('fav-updated')); } catch {}
      }

      // Agar mahalliyda bulutdagidan ko'proq kitob bo'lsa, bulutni ham yangilaymiz
      if (mergedList.length !== cloudFavs.length) {
        pushDataToCloud({ favorites: mergedList });
      }
    } catch (e) {
      console.warn('Favorites sync error:', e);
    }

    // 2. Xaridlarni (Purchased Books) sinxronlash
    try {
      const rawPurchased = localStorage.getItem('purchased_books');
      const localPurchased: any[] = rawPurchased ? JSON.parse(rawPurchased) : [];
      const cloudPurchased: any[] = Array.isArray(cloudData.purchasedBooks) ? cloudData.purchasedBooks : [];

      const pMap = new Map<string, any>();
      cloudPurchased.forEach(p => {
        const id = typeof p === 'string' ? p : String(p?.id || '');
        if (id) pMap.set(id, typeof p === 'string' ? { id } : p);
      });
      localPurchased.forEach(p => {
        const id = typeof p === 'string' ? p : String(p?.id || '');
        if (id && !pMap.has(id)) pMap.set(id, p);
      });

      const mergedPurchased = Array.from(pMap.values());
      const pStr = JSON.stringify(mergedPurchased);

      if (rawPurchased !== pStr) {
        localStorage.setItem('purchased_books', pStr);
        localChanged = true;
        try { window.dispatchEvent(new CustomEvent('book-purchased')); } catch {}
      }
    } catch (e) {
      console.warn('Purchases sync error:', e);
    }

    // 3. Kitob statuslarini sinxronlash
    try {
      if (cloudData.bookStatuses && typeof cloudData.bookStatuses === 'object') {
        const rawStatuses = localStorage.getItem('book_statuses');
        const localStatuses = rawStatuses ? JSON.parse(rawStatuses) : {};
        const mergedStatuses = { ...cloudData.bookStatuses, ...localStatuses };
        const sStr = JSON.stringify(mergedStatuses);
        if (rawStatuses !== sStr) {
          localStorage.setItem('book_statuses', sStr);
        }
      }
    } catch {}

    // 4. Iqtiboslarni (Quotes) sinxronlash
    try {
      if (Array.isArray(cloudData.quotes)) {
        const rawQuotes = localStorage.getItem('book_quotes');
        const localQuotes: any[] = rawQuotes ? JSON.parse(rawQuotes) : [];
        const qMap = new Map<string, any>();
        cloudData.quotes.forEach((q: any) => q?.id && qMap.set(String(q.id), q));
        localQuotes.forEach((q: any) => q?.id && qMap.set(String(q.id), q));
        const mergedQuotes = Array.from(qMap.values());
        const qStr = JSON.stringify(mergedQuotes);
        if (rawQuotes !== qStr) {
          localStorage.setItem('book_quotes', qStr);
        }
      }
    } catch {}

    // 5. Profil ma'lumotlarini (Bio, Avatar, Accent, Maqsad) sinxronlash
    try {
      const p = cloudData.profile;
      if (p) {
        if (p.bio && !localStorage.getItem('user_bio')) localStorage.setItem('user_bio', p.bio);
        if (p.avatar && !localStorage.getItem('account_avatar')) localStorage.setItem('account_avatar', p.avatar);
        if (p.accent && !localStorage.getItem('account_accent')) localStorage.setItem('account_accent', p.accent);
        if (p.dailyGoal && !localStorage.getItem('daily_goal')) localStorage.setItem('daily_goal', String(p.dailyGoal));
        if (p.streak && !localStorage.getItem('streak')) localStorage.setItem('streak', String(p.streak));
      }
    } catch {}

    try {
      window.dispatchEvent(new CustomEvent('cloud-sync-done', { detail: { changed: localChanged } }));
    } catch {}

    return true;
  } catch (err) {
    console.error('syncUserFromCloud xatolik:', err);
    return false;
  } finally {
    isSyncing = false;
  }
}

/**
 * Mahalliy ma'lumotlarni bulutga yuborish
 */
export async function pushDataToCloud(data: {
  favorites?: any[];
  purchasedBooks?: any[];
  bookStatuses?: Record<string, string>;
  quotes?: any[];
  profile?: any;
}): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const user = getActiveUser();
  if (!user) return false;

  try {
    const payload = {
      username: user.username,
      email: user.email,
      ...data,
    };

    const res = await fetch('/api/user/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return res.ok;
  } catch (err) {
    console.warn('pushDataToCloud xatosi:', err);
    return false;
  }
}

/**
 * Kitobni sevimlilarga qo'shish yoki olib tashlash (Mahalliy + Bulutda darhol sinxronlash)
 */
export async function toggleFavoriteCloud(book: FavoriteItem): Promise<boolean> {
  if (typeof window === 'undefined' || !book?.id) return false;

  try {
    const raw = localStorage.getItem('favorites');
    const list: FavoriteItem[] = raw ? JSON.parse(raw) : [];
    const bookIdStr = String(book.id);
    const exists = list.some(f => String(f.id) === bookIdStr);

    let next: FavoriteItem[];
    let deletedFavs: string[] = [];
    try {
      deletedFavs = JSON.parse(localStorage.getItem('deleted_favorites') || '[]');
    } catch {}

    if (exists) {
      next = list.filter(f => String(f.id) !== bookIdStr);
      if (!deletedFavs.includes(bookIdStr)) {
        deletedFavs.push(bookIdStr);
        localStorage.setItem('deleted_favorites', JSON.stringify(deletedFavs));
      }
    } else {
      // Qayta qo'shilganda deleted ro'yxatidan tozalaymiz
      deletedFavs = deletedFavs.filter(id => id !== bookIdStr);
      localStorage.setItem('deleted_favorites', JSON.stringify(deletedFavs));

      const cleanBook: FavoriteItem = {
        id: bookIdStr,
        title: book.title || '',
        author: book.author || '',
        price: book.price || '',
        rating: Number(book.rating) || 5,
        image: book.image || '',
        category: book.category || 'Badiiy',
      };
      next = [cleanBook, ...list.filter(f => String(f.id) !== bookIdStr)];
    }

    localStorage.setItem('favorites', JSON.stringify(next));

    try {
      window.dispatchEvent(new CustomEvent('fav-updated', { detail: { bookId: bookIdStr, isFav: !exists } }));
    } catch {}

    // Agar tizimga kirgan bo'lsa, bulutga darhol yuboramiz
    const user = getActiveUser();
    if (user) {
      await pushDataToCloud({ favorites: next });
    }

    return !exists;
  } catch (err) {
    console.error('toggleFavoriteCloud xatolik:', err);
    return false;
  }
}

/**
 * Xarid qilingan kitobni bulut va mahalliy xotiraga saqlash
 */
export async function savePurchasedBookCloud(purchasedItem: PurchasedBookItem): Promise<void> {
  if (typeof window === 'undefined' || !purchasedItem?.id) return;

  try {
    const raw = localStorage.getItem('purchased_books');
    const list: any[] = raw ? JSON.parse(raw) : [];
    if (!list.some(p => String(p.id) === String(purchasedItem.id))) {
      list.push(purchasedItem);
      localStorage.setItem('purchased_books', JSON.stringify(list));
      try {
        window.dispatchEvent(new CustomEvent('book-purchased', { detail: { bookId: purchasedItem.id } }));
      } catch {}

      const user = getActiveUser();
      if (user) {
        pushDataToCloud({ purchasedBooks: list });
      }
    }
  } catch (err) {
    console.warn('savePurchasedBookCloud xatosi:', err);
  }
}
