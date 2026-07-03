"use client";

export interface Review {
  id: string;
  bookId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ReadingProgress {
  bookId: string;
  percent: number;
  chapter: string;
  page: number;
  updatedAt: string;
}

export interface Activity {
  id: string;
  text: string;
  time: string;
  type: 'system' | 'user' | 'favorite' | 'goal';
}

// Helper for synthetic delays
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockDB = {
  // Reviews API
  async getReviews(bookId: string): Promise<Review[]> {
    await delay(300); // Simulate network latency
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(`reviews_${bookId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  async addReview(bookId: string, review: Omit<Review, 'id' | 'createdAt'>): Promise<Review> {
    await delay(400);
    const newReview: Review = {
      ...review,
      id: String(Date.now()),
      createdAt: new Date().toLocaleDateString('uz-UZ', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    if (typeof window !== "undefined") {
      const current = await this.getReviews(bookId);
      const updated = [newReview, ...current];
      localStorage.setItem(`reviews_${bookId}`, JSON.stringify(updated));

      // Also recalculate and cache avg rating for the book in local storage if we want
      const avg = updated.reduce((sum, r) => sum + r.rating, 0) / updated.length;
      localStorage.setItem(`book_rating_${bookId}`, String(avg));
      localStorage.setItem(`book_reviews_count_${bookId}`, String(updated.length));

      // Trigger custom events to notify other components of update
      window.dispatchEvent(new CustomEvent('reviews-updated', { detail: { bookId, avg, count: updated.length } }));
      
      // Log this activity
      this.logEvent(`"${review.userName}" tomonidan kitobga ${review.rating} ballik sharh qoldirildi`, 'user');
    }
    return newReview;
  },

  // Reading Progress API
  async getReadingProgress(bookId: string): Promise<ReadingProgress | null> {
    await delay(200);
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(`reading_progress_${bookId}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  async saveReadingProgress(bookId: string, percent: number, chapter: string, page: number): Promise<void> {
    await delay(200);
    if (typeof window === "undefined") return;
    
    const progress: ReadingProgress = {
      bookId,
      percent,
      chapter,
      page,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(`reading_progress_${bookId}`, JSON.stringify(progress));

    // Also update book_statuses to 'reading' if it wasn't already marked
    try {
      const rawStatuses = localStorage.getItem('book_statuses');
      const statuses = rawStatuses ? JSON.parse(rawStatuses) : {};
      if (statuses[bookId] !== 'reading' && statuses[bookId] !== 'completed') {
        statuses[bookId] = 'reading';
        localStorage.setItem('book_statuses', JSON.stringify(statuses));
        window.dispatchEvent(new Event('storage'));
      }
      if (percent >= 100 && statuses[bookId] !== 'completed') {
        statuses[bookId] = 'completed';
        localStorage.setItem('book_statuses', JSON.stringify(statuses));
        window.dispatchEvent(new Event('storage'));
      }
    } catch {}

    window.dispatchEvent(new CustomEvent('reading-progress-updated', { detail: progress }));
  },

  // Global Activity Logger
  logEvent(text: string, type: 'system' | 'user' | 'favorite' | 'goal'): void {
    if (typeof window === "undefined") return;
    try {
      const rawLog = localStorage.getItem('activity_log');
      const logList: Activity[] = rawLog ? JSON.parse(rawLog) : [];
      const newEvent: Activity = {
        id: String(Date.now()),
        text,
        time: 'Hozir',
        type
      };
      const updated = [newEvent, ...logList].slice(0, 50); // limit to last 50 logs
      localStorage.setItem('activity_log', JSON.stringify(updated));
      window.dispatchEvent(new Event('activity-updated'));
    } catch {}
  }
};
