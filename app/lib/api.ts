import booksDB from './books';
import { mockDB, Review, ReadingProgress, Activity } from './db';

// Backend API URL can be configured using environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

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
  publishedYear: number;
  hasAudio?: boolean;
  audioUrl?: string;
}

// Utility to handle fetch requests with a timeout and automatic mock fallback
async function fetchWithFallback<T>(
  endpoint: string,
  options: RequestInit = {},
  fallbackValue: T
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

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
    console.log(`[API SUCCESS] Loaded from backend: ${endpoint}`);
    return data as T;
  } catch (error: any) {
    clearTimeout(id);
    console.warn(
      `[API FALLBACK] Failed to load from backend (${url}). Using local mock storage. Error: ${error.message}`
    );
    return fallbackValue;
  }
}

function mapDjangoBookToBook(djangoBook: any): Book {
  if (!djangoBook) return djangoBook;
  return {
    id: String(djangoBook.id),
    title: djangoBook.title,
    author: djangoBook.author,
    price: djangoBook.price && typeof djangoBook.price === 'string' && !djangoBook.price.includes("so'm")
      ? `${Number(djangoBook.price).toLocaleString('uz-UZ').replace(/[,.]00$/, '')} so'm`
      : djangoBook.price || "0 so'm",
    rating: Number(djangoBook.rating) || 0,
    image: djangoBook.cover_image || djangoBook.image || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop',
    category: djangoBook.category_name || djangoBook.category || 'Badiiy',
    description: djangoBook.description || '',
    pages: Number(djangoBook.pages) || 0,
    language: djangoBook.language || "O'zbek tili",
    publishedYear: Number(djangoBook.year) || Number(djangoBook.publishedYear) || 2024,
    hasAudio: djangoBook.hasAudio !== undefined ? !!djangoBook.hasAudio : String(djangoBook.id) === '1',
    audioUrl: djangoBook.audioUrl || (String(djangoBook.id) === '1' ? 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' : ''),
  };
}

export const api = {
  // ── Books APIs ────────────────────────────────────────────────────────
  async getBooks(): Promise<Book[]> {
    const raw = await fetchWithFallback<any[]>('/books/', { method: 'GET' }, booksDB);
    return Array.isArray(raw) ? raw.map(mapDjangoBookToBook) : booksDB.map(mapDjangoBookToBook);
  },

  async getBook(id: string): Promise<Book | null> {
    const localBook = booksDB.find((b) => b.id === id) || null;
    const raw = await fetchWithFallback<any | null>(`/books/${id}/`, { method: 'GET' }, localBook);
    return raw ? mapDjangoBookToBook(raw) : null;
  },

  async getRecommendedBooks(excludeId: string): Promise<Book[]> {
    const localRecommended = booksDB.filter((b) => b.id !== excludeId).slice(0, 3);
    const raw = await fetchWithFallback<any[]>(`/books/${excludeId}/recommended/`, { method: 'GET' }, localRecommended);
    return Array.isArray(raw) ? raw.map(mapDjangoBookToBook) : localRecommended.map(mapDjangoBookToBook);
  },

  // ── Reviews APIs ──────────────────────────────────────────────────────
  async getReviews(bookId: string): Promise<Review[]> {
    const localReviews = await mockDB.getReviews(bookId);
    return fetchWithFallback<Review[]>(`/books/${bookId}/reviews/`, { method: 'GET' }, localReviews);
  },

  async addReview(bookId: string, review: Omit<Review, 'id' | 'createdAt'>): Promise<Review> {
    const url = `${API_BASE_URL}/books/${bookId}/reviews/`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(review),
      });
      if (!response.ok) throw new Error(`Status ${response.status}`);
      const data = await response.json();

      // Sync local storage activity log
      mockDB.logEvent(`"${review.userName}" tomonidan kitobga ${review.rating} ballik sharh qoldirildi`, 'user');
      return data as Review;
    } catch (error) {
      console.warn(`[API FALLBACK] Failed to POST review to backend. Using local mock storage.`, error);
      return mockDB.addReview(bookId, review);
    }
  },

  // ── Reading Progress APIs ─────────────────────────────────────────────
  async getReadingProgress(bookId: string): Promise<ReadingProgress | null> {
    const localProgress = await mockDB.getReadingProgress(bookId);
    return fetchWithFallback<ReadingProgress | null>(`/books/${bookId}/progress/`, { method: 'GET' }, localProgress);
  },

  async saveReadingProgress(bookId: string, percent: number, chapter: string, page: number): Promise<void> {
    const url = `${API_BASE_URL}/books/${bookId}/progress/`;
    const progressBody = { percent, chapter, page };
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(progressBody),
      });
      if (!response.ok) throw new Error(`Status ${response.status}`);
      console.log(`[API SUCCESS] Saved reading progress on backend for book ${bookId}`);
    } catch (error) {
      console.warn(`[API FALLBACK] Failed to save progress on backend. Using local mock storage.`, error);
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
    const url = `${API_BASE_URL}/activity/`;
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
