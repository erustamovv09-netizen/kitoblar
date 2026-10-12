import booksDB from './books';
import { mockDB, Review, ReadingProgress, Activity } from './db';


// Dynamic API URL: adapts to localhost, mobile IP (window.location.hostname:8000), or configured environment
export const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined' && window.location.hostname) {
    return `http://${window.location.hostname}:8000/api`;
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
};
// Helper to always resolve the current API URL
const getBase = () => getApiBaseUrl();

export interface Book {
  id: string;
  title: string;
  author: string;
  price: string;
  rating: number;
  image: string;
  category: string;
  description: string;
  pages: number;
  language: string;
  publishedYear: number | string;
  hasAudio?: boolean;
  audioUrl?: string;
  content?: string;
  is_weekly_top?: boolean;
  isWeeklyTop?: boolean;
}

// Utility to handle fetch requests with a timeout and automatic mock fallback
async function fetchWithFallback<T>(
  endpoint: string,
  options: RequestInit = {},
  fallbackValue: T
): Promise<T> {
  const url = `${getApiBaseUrl()}${endpoint}`;

  // Create controller to implement timeout (e.g., 2 seconds)
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 2000);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    clearTimeout(id);

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    const data = await response.json();
    return data as T;
  } catch (error: any) {
    clearTimeout(id);
    return fallbackValue;
  }
}

export function formatPublishedYear(year: any, title?: string, id?: string): string | number {
  if (!year) year = 2024;
  const str = String(year).trim();
  const titleLower = String(title || '').toLowerCase();

  // If already formatted with a publisher, keep it
  if (str.includes(',') || str.includes('/') || str.toLowerCase().includes('nashr') || str.toLowerCase().includes('qalam')) {
    return str;
  }

  const yearDigits = str.match(/\d{4}/)?.[0] || '2024';

  if (titleLower.includes('binafsha') || String(id) === '1') {
    return `${yearDigits}, Falaq nashr`;
  } else if (titleLower.includes('odam') || titleLower.includes('qiyin') || String(id) === '2') {
    return `${yearDigits}, Sharq nashriyoti`;
  } else if (titleLower.includes('harom') || titleLower.includes('ko‘z') || titleLower.includes("ko'z") || String(id) === '3') {
    return `${yearDigits}, Oltin Qalam`;
  } else if (titleLower.includes('arosat') || String(id) === '4' || String(id) === '5') {
    return `${yearDigits}, Huzur nashriyoti`;
  } else if (titleLower.includes('alkimyogar')) {
    return `${yearDigits}, Yangi asr avlodi`;
  }

  return str;
}

function fixMediaUrl(url?: string): string {
  if (!url) return '';
  if (typeof window !== 'undefined' && window.location.hostname) {
    return url.replace(/https?:\/\/(127\.0\.0\.1|localhost|\d+\.\d+\.\d+\.\d+):8000/g, `http://${window.location.hostname}:8000`);
  }
  return url;
}

function formatPrice(val: any): string {
  if (!val && val !== 0) return "0 so'm";
  const str = String(val).trim();
  if (str.includes("so'm")) return str;
  const num = parseFloat(str.replace(/[^\d.-]/g, ''));
  if (isNaN(num)) return str;
  return `${Math.round(num).toLocaleString('uz-UZ')} so'm`;
}

function mapDjangoBookToBook(djangoBook: any): Book {
  if (!djangoBook) return djangoBook;
  const isAudio =
    djangoBook.hasAudio !== undefined ? Boolean(djangoBook.hasAudio) :
    djangoBook.has_audio !== undefined ? Boolean(djangoBook.has_audio) :
    Boolean(djangoBook.audio_file || djangoBook.audio_url || djangoBook.audioUrl) ||
    String(djangoBook.id) === '1' ||
    String(djangoBook.id) === '2' ||
    (typeof djangoBook.title === 'string' && (djangoBook.title.toLowerCase().includes('odam') || djangoBook.title.toLowerCase().includes('alkimyogar')));

  const resolvedAudioUrl =
    djangoBook.audioUrl ||
    djangoBook.audio_url ||
    djangoBook.audio_file ||
    (isAudio ? 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' : '');

  const rawImage = djangoBook.cover_image || djangoBook.image || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop';

  return {
    id: String(djangoBook.id),
    title: djangoBook.title,
    author: djangoBook.author,
    price: formatPrice(djangoBook.price),
    rating: Number(djangoBook.rating) != null && !isNaN(Number(djangoBook.rating)) ? Number(djangoBook.rating) : 5,
    image: fixMediaUrl(rawImage),
    category: djangoBook.category_name || djangoBook.category || 'Badiiy',
    description: djangoBook.description || '',
    pages: Number(djangoBook.pages) || 0,
    language: djangoBook.language || "O'zbek tili",
    publishedYear: formatPublishedYear(djangoBook.year || djangoBook.publishedYear, djangoBook.title, djangoBook.id),
    hasAudio: isAudio,
    audioUrl: fixMediaUrl(resolvedAudioUrl),
    content: djangoBook.content || '',
    is_weekly_top: Boolean(djangoBook.is_weekly_top || djangoBook.isWeeklyTop),
    isWeeklyTop: Boolean(djangoBook.is_weekly_top || djangoBook.isWeeklyTop),
  } as any;
}


// Helper: get admin-edited version of a book from localStorage (client-side only)
function getLocalAdminBooks(): Record<string, any> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem('admin_books');
    if (!stored) return {};
    const arr: any[] = JSON.parse(stored);
    const map: Record<string, any> = {};
    for (const b of arr) {
      if (b?.id) map[String(b.id)] = b;
    }
    return map;
  } catch {
    return {};
  }
}

// Helper: get list of locally-deleted book IDs
function getDeletedBookIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem('deleted_book_ids');
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}



export const api = {
  // ── Books APIs ────────────────────────────────────────────────────────
  async getBooks(): Promise<Book[]> {
    // ── 1. Try backend ────────────────────────────────────────────
    let fromBackend = false;
    let raw: any[] = [];
    try {
      const res = await fetch(`${getBase()}/books/`, {
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        raw = await res.json();
        fromBackend = true;
      }
    } catch { }

    // ── 2. If backend is offline, use mock booksDB ────────────────
    if (!fromBackend) raw = booksDB as any[];

    const books = Array.isArray(raw)
      ? raw.map(mapDjangoBookToBook)
      : (booksDB as any[]).map(mapDjangoBookToBook);

    // Filter out locally-deleted books
    const deleted = getDeletedBookIds();
    const filtered = deleted.size > 0 ? books.filter(b => !deleted.has(String(b.id))) : books;

    // ── 3a. Backend available → backend books are authoritative ──
    if (fromBackend) {
      const localEdits = getLocalAdminBooks();
      const backendIds = new Set(filtered.map(b => String(b.id)));

      // Auto-clean stale edits from localStorage for books that exist on backend
      if (typeof window !== 'undefined') {
        try {
          const stored: any[] = JSON.parse(localStorage.getItem('admin_books') || '[]');
          const cleaned = stored.filter(b => !backendIds.has(String(b.id)));
          if (cleaned.length !== stored.length) {
            localStorage.setItem('admin_books', JSON.stringify(cleaned));
          }
        } catch {}
      }

      const localOnlyBooks = Object.values(localEdits)
        .filter((e: any) => !backendIds.has(String(e.id)) && !deleted.has(String(e.id)))
        .map((e: any) => ({
          id: String(e.id),
          title: e.title || '',
          author: e.author || '',
          price: formatPrice(e.price),
          rating: Number(e.rating) || 5,
          image: fixMediaUrl(e.image || e.imageUrl || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop'),
          category: e.category || 'Badiiy',
          description: e.description || '',
          pages: Number(e.pages) || 0,
          language: e.language || "O'zbek tili",
          publishedYear: formatPublishedYear(e.publishedYear || e.year || '2024', e.title, e.id),
          hasAudio: !!e.hasAudio,
          audioUrl: fixMediaUrl(e.audioUrl || ''),
          content: e.content || '',
          is_weekly_top: Boolean(e.is_weekly_top || e.isWeeklyTop),
          isWeeklyTop: Boolean(e.is_weekly_top || e.isWeeklyTop),
        } as Book));

      return [...filtered, ...localOnlyBooks];
    }

    // ── 3b. Backend offline → booksDB + localStorage-only books ──────────────
    const localEdits = getLocalAdminBooks();
    const backendIds = new Set(filtered.map(b => b.id));
    const localOnlyBooks = Object.values(localEdits)
      .filter((e: any) => !backendIds.has(String(e.id)) && !deleted.has(String(e.id)))
      .map((e: any) => ({
        id: String(e.id),
        title: e.title || '',
        author: e.author || '',
        price: formatPrice(e.price),
        rating: Number(e.rating) || 5,
        image: fixMediaUrl(e.image || e.imageUrl || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop'),
        category: e.category || 'Badiiy',
        description: e.description || '',
        pages: Number(e.pages) || 0,
        language: e.language || "O'zbek tili",
        publishedYear: e.publishedYear || e.year || 2024,
        hasAudio: !!e.hasAudio,
        audioUrl: fixMediaUrl(e.audioUrl || ''),
        content: e.content || '',
        is_weekly_top: Boolean(e.is_weekly_top || e.isWeeklyTop),
        isWeeklyTop: Boolean(e.is_weekly_top || e.isWeeklyTop),
      } as Book));

    if (Object.keys(localEdits).length === 0) return [...filtered, ...localOnlyBooks];
    return [
      ...filtered.map(book => {
        const edit = localEdits[book.id];
        if (!edit) return book;
        return { ...book, ...edit, id: book.id, price: formatPrice(edit.price || book.price) };
      }),
      ...localOnlyBooks,
    ];
  },


  async getBook(id: string): Promise<Book | null> {
    // 1. First check locally-created admin books (local_ IDs only)
    if (typeof window !== 'undefined' && String(id).startsWith('local_')) {
      try {
        const adminBooks: any[] = JSON.parse(localStorage.getItem('admin_books') || '[]');
        const localBook = adminBooks.find((b: any) => String(b.id) === String(id));
        if (localBook) {
          return {
            id: String(localBook.id),
            title: localBook.title || '',
            author: localBook.author || '',
            price: formatPrice(localBook.price),
            rating: Number(localBook.rating) || 5,
            image: fixMediaUrl(localBook.image || localBook.imageUrl || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop'),
            category: localBook.category || 'Badiiy',
            description: localBook.description || '',
            pages: Number(localBook.pages) || 0,
            language: localBook.language || "O'zbek tili",
            publishedYear: localBook.publishedYear || localBook.year || 2024,
            hasAudio: !!localBook.hasAudio,
            audioUrl: fixMediaUrl(localBook.audioUrl || ''),
            content: localBook.content || '',
            is_weekly_top: Boolean(localBook.is_weekly_top || localBook.isWeeklyTop),
            isWeeklyTop: Boolean(localBook.is_weekly_top || localBook.isWeeklyTop),
          } as any;
        }
      } catch { }
    }

    // 2. Fetch from backend
    const localBook = booksDB.find((b) => b.id === id) || null;
    const raw = await fetchWithFallback<any | null>(`/books/${id}/`, { method: 'GET' }, localBook);
    const book = raw ? mapDjangoBookToBook(raw) : null;
    if (book) {
      return book;
    }

    // 3. Fallback to localStorage only if backend returned null
    const localEdits = getLocalAdminBooks();
    const edit = localEdits[id];
    if (edit) {
      return {
        id: String(id),
        title: edit.title || '',
        author: edit.author || '',
        category: edit.category || 'Badiiy',
        price: formatPrice(edit.price),
        description: edit.description || '',
        pages: edit.pages != null ? Number(edit.pages) : 0,
        language: edit.language || "O'zbek tili",
        publishedYear: formatPublishedYear(edit.publishedYear || '2024', edit.title, id),
        rating: edit.rating != null ? Number(edit.rating) : 5,
        hasAudio: !!edit.hasAudio,
        audioUrl: fixMediaUrl(edit.audioUrl || ''),
        content: edit.content || '',
        image: fixMediaUrl(edit.image || edit.imageUrl || ''),
        is_weekly_top: Boolean(edit.is_weekly_top || edit.isWeeklyTop),
        isWeeklyTop: Boolean(edit.is_weekly_top || edit.isWeeklyTop),
      } as any;
    }
    return null;
  },

  async getRecommendedBooks(excludeId: string): Promise<Book[]> {
    const localRecommended = booksDB.filter((b) => b.id !== excludeId).slice(0, 3);
    const raw = await fetchWithFallback<any[]>(`/books/${excludeId}/recommended/`, { method: 'GET' }, localRecommended);
    return Array.isArray(raw) ? raw.map(mapDjangoBookToBook) : localRecommended.map(mapDjangoBookToBook);
  },

  // Delete a book — tries backend DELETE, also removes from local admin_books and adds to deleted_ids
  async deleteBook(id: string): Promise<{ success: boolean; fromBackend: boolean }> {
    // Always track deletion locally so frontend can filter it out
    if (typeof window !== 'undefined') {
      // Remove from admin_books edits
      try {
        const stored: any[] = JSON.parse(localStorage.getItem('admin_books') || '[]');
        localStorage.setItem('admin_books', JSON.stringify(stored.filter(b => String(b.id) !== String(id))));
      } catch { }
      // Track deleted backend IDs
      try {
        const deleted: string[] = JSON.parse(localStorage.getItem('deleted_book_ids') || '[]');
        if (!deleted.includes(String(id))) {
          deleted.push(String(id));
          localStorage.setItem('deleted_book_ids', JSON.stringify(deleted));
        }
      } catch { }
    }
    // Try backend DELETE
    try {
      const response = await fetch(`${getBase()}/books/${id}/`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(3000),
      });
      if (response.ok || response.status === 204) {
        return { success: true, fromBackend: true };
      }
    } catch { }
    // Backend failed — local deletion only
    return { success: true, fromBackend: false };
  },

  // Create a book — tries backend POST, falls back to local admin_books only
  async createBook(data: Partial<Book> & { imageFile?: string }): Promise<{ success: boolean; fromBackend: boolean; book?: Book }> {
    const payload = {
      title: data.title,
      author: data.author,
      category: data.category,
      price: data.price,
      description: data.description,
      pages: data.pages,
      language: data.language,
      year: data.publishedYear,
      hasAudio: data.hasAudio,
      has_audio: data.hasAudio,
      audioUrl: data.audioUrl,
      audio_url: data.audioUrl,
    };
    try {
      const response = await fetch(`${getBase()}/books/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(4000),
      });
      if (response.ok || response.status === 201) {
        const book = await response.json();
        return { success: true, fromBackend: true, book: mapDjangoBookToBook(book) };
      }
    } catch { }
    // Backend failed — save locally
    if (typeof window !== 'undefined') {
      try {
        const stored: any[] = JSON.parse(localStorage.getItem('admin_books') || '[]');
        const localBook = {
          ...data,
          id: `local_${Date.now()}`,
          image: data.imageFile || data.image || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop',
          imageUrl: data.imageFile || data.image || '',
          rating: 0,
        };
        stored.unshift(localBook);
        localStorage.setItem('admin_books', JSON.stringify(stored));
        return { success: true, fromBackend: false, book: localBook as Book };
      } catch { }
    }
    return { success: false, fromBackend: false };
  },

  // Update a book — sends backend PATCH, also syncs localStorage
  async updateBook(id: string, data: any, imageFile?: File | null): Promise<{ success: boolean; fromBackend: boolean }> {
    let fromBackend = false;

    // 1. Try backend PATCH
    try {
      const url = `${getBase()}/books/${id}/`;
      let res: Response;

      const categoryMap: Record<string, number> = {
        'badiiy': 1,
        'badiiy asarlar': 1,
        'biznes': 2,
        'ilmiy': 3,
        'tarixiy': 4,
        'detektiv': 5,
        'bolalar adabiyoti': 6,
        'bolalar': 6,
        'jahon adabiyoti': 7,
        'jahon': 7,
        'shaxsiy rivojlanish': 8,
        'shaxsiy': 8,
        'moliya': 9,
        'falsafa': 10,
        'psixologiya': 11,
      };
      let categoryId = Number(data.category);
      if (isNaN(categoryId) || categoryId <= 0) {
        const norm = String(data.category || '').toLowerCase().trim();
        categoryId = categoryMap[norm] || 1;
      }

      const numericPrice = typeof data.price === 'string'
        ? Number(data.price.replace(/[^\d.-]/g, '')) || 0
        : Number(data.price) || 0;

      const yearDigits = Number(String(data.year || data.publishedYear || '').match(/\d{4}/)?.[0] || '2024');
      const ratingNum = parseFloat(String(data.rating || '5.0')) || 5.0;
      const isWeekly = Boolean(data.is_weekly_top || data.isWeeklyTop);

      const patchData: Record<string, any> = {
        title: data.title ? String(data.title).trim() : '',
        author: data.author ? String(data.author).trim() : '',
        category: categoryId,
        price: numericPrice,
        year: yearDigits,
        rating: ratingNum,
        pages: Number(data.pages) || 0,
        language: data.language || "O'zbek tili",
        description: data.description || '',
        content: data.content || '',
        is_weekly_top: isWeekly,
        is_trending: isWeekly,
        has_audio: Boolean(data.hasAudio !== undefined ? data.hasAudio : data.has_audio),
        audio_url: data.audioUrl || data.audio_url || '',
      };

      let fileToUpload = imageFile;
      if (!fileToUpload && typeof data.imageUrl === 'string' && data.imageUrl.startsWith('data:image/')) {
        try {
          const parts = data.imageUrl.split(',');
          const mime = parts[0].split(';')[0].split(':')[1] || 'image/jpeg';
          const byteCharacters = atob(parts[1]);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const ext = mime.includes('png') ? 'png' : 'jpg';
          fileToUpload = new File([byteArray], `cover.${ext}`, { type: mime });
        } catch {}
      }

      if (fileToUpload) {
        const fd = new FormData();
        Object.entries(patchData).forEach(([k, v]) => {
          if (v !== undefined && v !== null) fd.append(k, String(v));
        });
        fd.append('cover_image', fileToUpload);
        res = await fetch(url, { method: 'PATCH', body: fd, signal: AbortSignal.timeout(10000) });
      } else {
        res = await fetch(url, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patchData),
          signal: AbortSignal.timeout(10000),
        });
      }

      if (res.ok) {
        fromBackend = true;
      }
    } catch { }

    // 2. Also sync to localStorage
    if (typeof window !== 'undefined') {
      try {
        const stored: any[] = JSON.parse(localStorage.getItem('admin_books') || '[]');
        const idx = stored.findIndex(b => String(b.id) === String(id));
        const updated = {
          ...(idx >= 0 ? stored[idx] : {}),
          ...data,
          id: String(id),
          price: formatPrice(data.price),
        };
        if (data.is_weekly_top || data.isWeeklyTop) {
          stored.forEach((b: any) => {
            if (String(b.id) !== String(id)) {
              b.is_weekly_top = false;
              b.isWeeklyTop = false;
            }
          });
        }
        if (idx >= 0) {
          stored[idx] = updated;
        } else {
          stored.unshift(updated);
        }
        localStorage.setItem('admin_books', JSON.stringify(stored));
      } catch { }
    }

    return { success: true, fromBackend };
  },

  // ── Reviews APIs ──────────────────────────────────────────────────────
  async getReviews(bookId: string): Promise<Review[]> {
    const localReviews = await mockDB.getReviews(bookId);
    const backendData = await fetchWithFallback<any[]>(`/books/${bookId}/reviews/`, { method: 'GET' }, localReviews);
    if (Array.isArray(backendData)) {
      const mapped: Review[] = backendData.map((r: any) => ({
        id: String(r.id),
        bookId: String(r.book || r.bookId || bookId),
        userName: r.user_name || r.userName || 'Kitobxon',
        rating: Number(r.rating) || 5,
        comment: r.comment || '',
        createdAt: r.created_at || r.createdAt || new Date().toISOString(),
      }));
      // Merge with local storage reviews so freshly added reviews never disappear
      const combined = [...mapped];
      for (const loc of localReviews) {
        if (!combined.some(c => String(c.id) === String(loc.id) || (c.userName === loc.userName && c.rating === loc.rating && c.comment === loc.comment))) {
          combined.push(loc);
        }
      }
      return combined;
    }
    return localReviews;
  },

  async addReview(bookId: string, review: Omit<Review, 'id' | 'createdAt'>): Promise<Review> {
    const url = `${getBase()}/books/${bookId}/reviews/`;
    // Always persist to local storage first as guarantee
    const localResult = await mockDB.addReview(bookId, review);

    const payload = {
      book: Number(bookId) || bookId,
      user_name: review.userName,
      userName: review.userName,
      user_id: review.userName,
      userId: review.userName,
      rating: review.rating,
      comment: review.comment || '',
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        const data = await response.json();
        mockDB.logEvent(`"${review.userName}" tomonidan kitobga ${review.rating} ballik sharh qoldirildi`, 'user');
        return {
          id: String(data.id),
          bookId: String(data.book || bookId),
          userName: data.user_name || review.userName,
          rating: Number(data.rating) || review.rating,
          comment: data.comment || review.comment || '',
          createdAt: data.created_at || localResult.createdAt,
        };
      }
    } catch { }

    mockDB.logEvent(`"${review.userName}" tomonidan kitobga ${review.rating} ballik sharh qoldirildi`, 'user');
    return localResult;
  },

  // ── Reading Progress APIs ─────────────────────────────────────────────
  async getReadingProgress(bookId: string): Promise<ReadingProgress | null> {
    const localProgress = await mockDB.getReadingProgress(bookId);
    let userId = 'anonymous';
    if (typeof window !== 'undefined') userId = localStorage.getItem('username') || 'anonymous';
    return fetchWithFallback<ReadingProgress | null>(`/books/${bookId}/progress/?userId=${userId}`, { method: 'GET' }, localProgress);
  },

  async saveReadingProgress(bookId: string, percent: number, chapter: string, page: number): Promise<void> {
    const url = `${getBase()}/books/${bookId}/progress/`;
    let userId = 'anonymous';
    if (typeof window !== 'undefined') userId = localStorage.getItem('username') || 'anonymous';

    const progressBody = {
      progressPercent: percent,
      chapter: chapter,
      chapterIndex: page,
      userId: userId
    };
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(progressBody),
      });
      if (!response.ok) throw new Error(`Status ${response.status}`);
    } catch (error) {
      // Ignore error, fallback to mock storage
      await mockDB.saveReadingProgress(bookId, percent, chapter, page);
    }
  },

  // ── Activity Log APIs ─────────────────────────────────────────────────
  async getActivityLog(): Promise<Activity[]> {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem('activity_log');
    const localLogs = raw ? JSON.parse(raw) : [
      { id: '1', text: 'Tizimda hisob muvaffaqiyatli faollashtirildi', time: '1 hafta oldin', type: 'system' }
    ];
    return fetchWithFallback<Activity[]>('/activity/', { method: 'GET' }, localLogs);
  },

  async logEvent(text: string, type: 'system' | 'user' | 'favorite' | 'goal'): Promise<void> {
    const url = `${getBase()}/activity/`;
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, type }),
      });
    } catch {
      // Always log locally as a backup
      mockDB.logEvent(text, type);
    }
  }
};
