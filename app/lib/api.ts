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
    const raw = await fetchWithFallback<any[]>('/books/', { method: 'GET' }, booksDB);
    const books = Array.isArray(raw) ? raw.map(mapDjangoBookToBook) : booksDB.map(mapDjangoBookToBook);
    // Filter out locally-deleted books
    const deleted = getDeletedBookIds();
    const filtered = deleted.size > 0 ? books.filter(b => !deleted.has(String(b.id))) : books;
    // Merge admin-edited local overrides (image, title, price, etc.)
    const localEdits = getLocalAdminBooks();
    // Also include locally-created books (local_ prefix IDs not in backend)
    const backendIds = new Set(filtered.map(b => b.id));
    const localOnlyBooks = Object.values(localEdits)
      .filter((e: any) => !backendIds.has(String(e.id)) && !deleted.has(String(e.id)))
      .map((e: any) => ({
        id: String(e.id),
        title: e.title || '',
        author: e.author || '',
        price: e.price || "0 so'm",
        rating: Number(e.rating) || 0,
        image: e.image || e.imageUrl || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop',
        category: e.category || 'Badiiy',
        description: e.description || '',
        pages: Number(e.pages) || 0,
        language: e.language || "O'zbek tili",
        publishedYear: Number(e.publishedYear) || 2024,
        hasAudio: !!e.hasAudio,
        audioUrl: e.audioUrl || '',
      } as Book));
    if (Object.keys(localEdits).length === 0) return [...filtered, ...localOnlyBooks];
    return [
      ...filtered.map(book => {
        const edit = localEdits[book.id];
        if (!edit) return book;
        return { ...book, ...edit, id: book.id };
      }),
      ...localOnlyBooks,
    ];
  },

  async getBook(id: string): Promise<Book | null> {
    const localBook = booksDB.find((b) => b.id === id) || null;
    const raw = await fetchWithFallback<any | null>(`/books/${id}/`, { method: 'GET' }, localBook);
    const book = raw ? mapDjangoBookToBook(raw) : null;
    if (!book) return null;
    // Override with admin-edited local data if available
    const localEdits = getLocalAdminBooks();
    const edit = localEdits[id];
    if (edit) {
      return {
        ...book,
        title: edit.title ?? book.title,
        author: edit.author ?? book.author,
        category: edit.category ?? book.category,
        price: edit.price ?? book.price,
        description: edit.description ?? book.description,
        pages: edit.pages != null ? Number(edit.pages) : book.pages,
        language: edit.language ?? book.language,
        publishedYear: edit.publishedYear != null ? Number(edit.publishedYear) : book.publishedYear,
        rating: edit.rating != null ? Number(edit.rating) : book.rating,
        hasAudio: edit.hasAudio != null ? !!edit.hasAudio : book.hasAudio,
        audioUrl: edit.audioUrl ?? book.audioUrl,
        // Most important: use uploaded/edited image
        image: edit.image || edit.imageUrl || book.image,
      };
    }
    return book;
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
      } catch {}
      // Track deleted backend IDs
      try {
        const deleted: string[] = JSON.parse(localStorage.getItem('deleted_book_ids') || '[]');
        if (!deleted.includes(String(id))) {
          deleted.push(String(id));
          localStorage.setItem('deleted_book_ids', JSON.stringify(deleted));
        }
      } catch {}
    }
    // Try backend DELETE
    try {
      const response = await fetch(`${API_BASE_URL}/books/${id}/`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(3000),
      });
      if (response.ok || response.status === 204) {
        return { success: true, fromBackend: true };
      }
    } catch {}
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
      audioUrl: data.audioUrl,
    };
    try {
      const response = await fetch(`${API_BASE_URL}/books/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(4000),
      });
      if (response.ok || response.status === 201) {
        const book = await response.json();
        return { success: true, fromBackend: true, book: mapDjangoBookToBook(book) };
      }
    } catch {}
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
      } catch {}
    }
    return { success: false, fromBackend: false };
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
