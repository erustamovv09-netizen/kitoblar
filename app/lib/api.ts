import booksDB from './books';
import { mockDB, Review, ReadingProgress, Activity } from './db';


// Dynamic API URL: adapts to production domain, SSL, localhost, or mobile IP
export const getApiBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname) {
    const host = window.location.hostname;
    const isLocal = host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.') || host.startsWith('10.') || host.startsWith('172.');
    if (isLocal) {
      return `http://${host}:8000/api`;
    }
    // Live domain (e.g. kitoblar.shop)
    return `${window.location.origin}/api`;
  }
  return "http://127.0.0.1:8000/api";
};

export const getBackendBaseUrl = (): string => {
  // If explicitly set, use it
  if (process.env.NEXT_PUBLIC_BACKEND_URL) {
    return process.env.NEXT_PUBLIC_BACKEND_URL;
  }
  // Derive from NEXT_PUBLIC_API_URL (strip trailing /api)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '');
  }
  if (typeof window !== 'undefined' && window.location.hostname) {
    const host = window.location.hostname;
    const isLocal = host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.') || host.startsWith('10.') || host.startsWith('172.');
    if (isLocal) {
      return `http://${host}:8000`;
    }
    // On production domain, backend is on render — use env var pattern
    // Fallback: same origin (reverse proxy setup)
    return window.location.origin;
  }
  return "http://127.0.0.1:8000";
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
  sale_price?: number | null;
  salePrice?: string;
  discount_expires_at?: string | null;
  discountExpiresAt?: string | null;
  // Format narxlari (Elektron va Qog'oz)
  price_electronic?: number | null;
  price_paper?: number | null;
  priceElectronic?: string;
  pricePaper?: string;
}

// Utility to handle fetch requests with a timeout and automatic mock fallback
async function fetchWithFallback<T>(
  endpoint: string,
  options: RequestInit = {},
  fallbackValue: T
): Promise<T> {
  const url = `${getApiBaseUrl()}${endpoint}`;

  // Create controller to implement timeout (e.g., 10 seconds for cloud cold starts)
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 10000);

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

export function getStaticBookCover(id?: string | number, title?: string): string | null {
  const t = String(title || '').toLowerCase().trim();
  const idStr = String(id || '').trim();

  if (idStr === '7' || t.includes('1500') || t.includes('maxbus')) {
    return '/images/1500-yillik-maxbuslar.jpg';
  }
  if (idStr === '4' || idStr === '5' || t.includes('arosat')) {
    return '/images/arosat.jpg';
  }
  if (idStr === '1' || t.includes('binafsha')) {
    if (t.includes('1-qism') || t.includes('1 qism') || t.includes('1-qismida') || t.includes('birinchi')) {
      return '/images/binafsha.jpeg';
    }
    return '/images/binafsha-2.jpg';
  }
  if (idStr === '3' || t.includes('harom') || t.includes('ko‘z') || t.includes("ko'z") || t.includes('kozlaringni')) {
    return '/images/kozlaringni-haromdan-saqla.jpg';
  }
  return null;
}

function fixMediaUrl(url?: string): string {
  if (!url) return '';
  const backendBase = getBackendBaseUrl();
  if (url.startsWith('/media/') || url.startsWith('/static/')) {
    return `${backendBase}${url}`;
  }
  if (typeof window !== 'undefined' && window.location.hostname) {
    return url.replace(/https?:\/\/(127\.0\.0\.1|localhost|\d+\.\d+\.\d+\.\d+):8000/g, backendBase);
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

  const staticCover = getStaticBookCover(djangoBook.id, djangoBook.title);
  let rawImage = djangoBook.cover_image || djangoBook.image;
  // Faqat rasm bo'sh bo'lsa yoki eski buzilgan 404 URL (Image_7_rEB0a9Z) yoki Unsplash bo'lsa zaxira muqovani olamiz
  if (staticCover && (!rawImage || rawImage.includes('Image_7_rEB0a9Z.jpeg') || rawImage.includes('unsplash.com/photo-1544947950'))) {
    rawImage = staticCover;
  }
  if (!rawImage) {
    rawImage = staticCover || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop';
  }

  // Chegirma ma'lumotlarini description ichidagi maxsus HTML izohdan ham olamiz (Render PostgreSQL da abadiy saqlanadi)
  let salePrice = djangoBook.sale_price != null ? Number(djangoBook.sale_price) : null;
  let discountExpiresAt = djangoBook.discount_expires_at || djangoBook.discountExpiresAt || null;
  let cleanDescription = djangoBook.description || '';

  if (typeof cleanDescription === 'string' && cleanDescription.includes('<!--DISCOUNT:')) {
    const match = cleanDescription.match(/<!--DISCOUNT:(.*?)-->/);
    if (match) {
      try {
        const parsed = JSON.parse(match[1]);
        if (parsed.sale_price != null) salePrice = Number(parsed.sale_price);
        if (parsed.discount_expires_at) discountExpiresAt = parsed.discount_expires_at;
      } catch {}
    }
    cleanDescription = cleanDescription.replace(/<!--DISCOUNT:.*?-->/g, '').trim();
  }

  // Format narxlarini (Elektron va Qog'oz) description ichidagi HTML izohdan yoki bevosita ustunlardan olamiz
  let priceElectronic: number | null = djangoBook.price_electronic != null ? Number(djangoBook.price_electronic) : null;
  let pricePaper: number | null = djangoBook.price_paper != null ? Number(djangoBook.price_paper) : null;

  if (typeof cleanDescription === 'string' && cleanDescription.includes('<!--PRICING:')) {
    const pMatch = cleanDescription.match(/<!--PRICING:(.*?)-->/);
    if (pMatch) {
      try {
        const parsedP = JSON.parse(pMatch[1]);
        if (parsedP.price_electronic != null) priceElectronic = Number(parsedP.price_electronic);
        if (parsedP.price_paper != null) pricePaper = Number(parsedP.price_paper);
      } catch {}
    }
    cleanDescription = cleanDescription.replace(/<!--PRICING:.*?-->/g, '').trim();
  }

  // Standart mantiqiy narxlar (agar admin alohida ko'rsatmagan bo'lsa)
  const numBase = parseFloat(String(djangoBook.price || '0').replace(/[^\d.-]/g, '')) || 50000;
  if (priceElectronic == null || isNaN(priceElectronic) || priceElectronic <= 0) {
    priceElectronic = Math.max(10000, Math.round((numBase * 0.5) / 1000) * 1000);
  }
  if (pricePaper == null || isNaN(pricePaper) || pricePaper <= 0) {
    pricePaper = Math.max(priceElectronic, numBase > 0 ? numBase : 60000);
  }

  return {
    id: String(djangoBook.id),
    title: djangoBook.title,
    author: djangoBook.author,
    price: formatPrice(djangoBook.price),
    rating: Number(djangoBook.rating) != null && !isNaN(Number(djangoBook.rating)) ? Number(djangoBook.rating) : 5,
    image: fixMediaUrl(rawImage),
    category: djangoBook.category_name || djangoBook.category || 'Badiiy',
    description: cleanDescription,
    pages: Number(djangoBook.pages) || 0,
    language: djangoBook.language || "O'zbek tili",
    publishedYear: formatPublishedYear(djangoBook.year || djangoBook.publishedYear, djangoBook.title, djangoBook.id),
    hasAudio: isAudio,
    audioUrl: fixMediaUrl(resolvedAudioUrl),
    content: djangoBook.content || '',
    is_weekly_top: Boolean(djangoBook.is_weekly_top || djangoBook.isWeeklyTop),
    isWeeklyTop: Boolean(djangoBook.is_weekly_top || djangoBook.isWeeklyTop),
    // Chegirma maydonlari
    sale_price: salePrice,
    salePrice: salePrice ? `${salePrice.toLocaleString('uz-UZ')} so'm` : '',
    discount_expires_at: discountExpiresAt,
    discountExpiresAt: discountExpiresAt,
    // Format narxlari
    price_electronic: priceElectronic,
    price_paper: pricePaper,
    priceElectronic: formatPrice(priceElectronic),
    pricePaper: formatPrice(pricePaper),
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



// Helper: kitob muqovasi (rasm) override larini alohida localStorage kalitida saqlash (backend o'chib yonsa ham yo'qolmaydi)
export function getCoverOverrides(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem('cover_overrides');
    const overrides = raw ? JSON.parse(raw) : {};
    // Bugfix: Agar eski keshda 1-kitob (Binafsha shu'lasi 2-qism) uchun xato tarzda 1-qism rasmi ("/images/binafsha.jpeg") saqlanib qolgan bo'lsa, uni to'g'ri 2-qism rasmiga almashtiramiz
    if (overrides['1'] === '/images/binafsha.jpeg') {
      overrides['1'] = '/images/binafsha-2.jpg';
      localStorage.setItem('cover_overrides', JSON.stringify(overrides));
    }
    return overrides;
  } catch { return {}; }
}

export function saveCoverOverride(bookId: string, imageSrc: string) {
  if (typeof window === 'undefined' || !bookId || !imageSrc) return;
  try {
    const current = getCoverOverrides();
    current[String(bookId)] = imageSrc;
    localStorage.setItem('cover_overrides', JSON.stringify(current));
  } catch (e) {
    console.warn('cover_overrides saqlashda xatolik:', e);
  }
}

export function removeCoverOverride(bookId: string) {
  if (typeof window === 'undefined' || !bookId) return;
  try {
    const current = getCoverOverrides();
    delete current[String(bookId)];
    localStorage.setItem('cover_overrides', JSON.stringify(current));
  } catch {}
}

// Helper: chegirma override larini alohida localStorage kalitida saqlash
export function getDiscountOverrides(): Record<string, { sale_price: number | null; discount_expires_at: string | null }> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem('discount_overrides');
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export function saveDiscountOverride(bookId: string, salePrice: number | null, discountExpiresAt: string | null) {
  if (typeof window === 'undefined') return;
  try {
    const overrides = getDiscountOverrides();
    if (salePrice && salePrice > 0) {
      overrides[String(bookId)] = { sale_price: salePrice, discount_expires_at: discountExpiresAt };
    } else {
      delete overrides[String(bookId)];
    }
    localStorage.setItem('discount_overrides', JSON.stringify(overrides));
  } catch {}
}

// Helper: elektron va qog'oz format narxlari override larini saqlash
export function getPricingOverrides(): Record<string, { price_electronic: number | null; price_paper: number | null }> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem('pricing_overrides');
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export function savePricingOverride(bookId: string, priceElectronic: number | null, pricePaper: number | null) {
  if (typeof window === 'undefined' || !bookId) return;
  try {
    const overrides = getPricingOverrides();
    overrides[String(bookId)] = { price_electronic: priceElectronic, price_paper: pricePaper };
    localStorage.setItem('pricing_overrides', JSON.stringify(overrides));
  } catch {}
}

// Synchronous initial books getter for instant 0ms rendering (no cold-start delay)
export function getInitialBooks(): Book[] {
  const deleted = getDeletedBookIds();
  const coverOverrides = getCoverOverrides();
  const discountOverrides = getDiscountOverrides();
  const pricingOverrides = getPricingOverrides();

  let rawList: any[] = [];
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem('cached_full_books') || localStorage.getItem('cached_backend_books');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          rawList = parsed;
        }
      }
    } catch {}
  }

  if (rawList.length === 0) {
    rawList = booksDB as any[];
  }

  return rawList
    .map(mapDjangoBookToBook)
    .filter(b => !deleted.has(String(b.id)))
    .map(b => {
      const idStr = String(b.id);
      const ov = discountOverrides[idStr];
      const cov = coverOverrides[idStr];
      const pov = pricingOverrides[idStr];
      const pe = pov?.price_electronic ?? b.price_electronic;
      const pp = pov?.price_paper ?? b.price_paper;
      let finalCover = cov || b.image;
      if (idStr === '1' && (finalCover === '/images/binafsha.jpeg' || !finalCover)) {
        finalCover = '/images/binafsha-2.jpg';
      }
      return {
        ...b,
        image: finalCover,
        sale_price: ov ? ov.sale_price : b.sale_price,
        discount_expires_at: ov ? ov.discount_expires_at : b.discount_expires_at,
        discountExpiresAt: ov ? ov.discount_expires_at : b.discountExpiresAt,
        price_electronic: pe,
        price_paper: pp,
        priceElectronic: formatPrice(pe),
        pricePaper: formatPrice(pp),
      };
    });
}

export function getInitialHeroBook(): Book | null {
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem('cached_hero_top_book');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.id) return parsed;
      }
    } catch {}
  }
  const books = getInitialBooks();
  if (books.length === 0) return null;
  return books.find(b => b.is_weekly_top || b.isWeeklyTop) || books[0];
}

export function getInitialBook(id: string | number): Book | null {
  const idStr = String(id);
  const all = getInitialBooks();
  return all.find(b => String(b.id) === idStr) || null;
}

export function getInitialRecommended(excludeId: string | number): Book[] {
  const idStr = String(excludeId);
  const all = getInitialBooks();
  return all.filter(b => String(b.id) !== idStr).slice(0, 3);
}

export const api = {
  getInitialBooks,
  getInitialHeroBook,
  getInitialBook,
  getInitialRecommended,

  // ── Books APIs ────────────────────────────────────────────────────────
  async getBooks(): Promise<Book[]> {
    // ── 1. Try backend with 4.5s timeout (Render cold starts won't stall the UI) ─
    let fromBackend = false;
    let raw: any[] = [];
    try {
      const res = await fetch(`${getBase()}/books/`, {
        signal: AbortSignal.timeout(4500),
      });
      if (res.ok) {
        raw = await res.json();
        if (Array.isArray(raw) && raw.length > 0) {
          fromBackend = true;
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('cached_backend_books', JSON.stringify(raw));
            } catch {}
          }
        }
      }
    } catch { }

    // ── 2. If backend is offline / cold-starting, use cached books if available ────
    if (!fromBackend && typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('cached_backend_books') || localStorage.getItem('cached_full_books');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            raw = parsed;
            fromBackend = true;
          }
        }
      } catch {}
    }

    // ── 3. Fallback to booksDB (contains all 6 real books, never empty) ───────────
    if (!fromBackend || !raw || raw.length === 0) {
      raw = booksDB as any[];
      // Background non-blocking ping to wake Render if it was sleeping
      if (typeof window !== 'undefined') {
        fetch(`${getBase()}/books/`).catch(() => {});
      }
    }

    const books = Array.isArray(raw)
      ? raw.map(mapDjangoBookToBook)
      : (booksDB as any[]).map(mapDjangoBookToBook);

    // Filter out locally-deleted books
    const deleted = getDeletedBookIds();
    const filtered = deleted.size > 0 ? books.filter(b => !deleted.has(String(b.id))) : books;

    const localEdits = getLocalAdminBooks();
    const backendIds = new Set(filtered.map(b => String(b.id)));
    const discountOverrides = getDiscountOverrides();
    const pricingOverrides = getPricingOverrides();
    const coverOverrides = getCoverOverrides();

    if (typeof window !== 'undefined') {
      try {
        const stored: any[] = JSON.parse(localStorage.getItem('admin_books') || '[]');
        let updatedCovers = false;
        for (const b of stored) {
          const bImg = b.image || b.imageUrl;
          if (b?.id && bImg) {
            if (String(b.id) === '1' && bImg === '/images/binafsha.jpeg') continue;
            if (!coverOverrides[String(b.id)]) {
              coverOverrides[String(b.id)] = bImg;
              updatedCovers = true;
            }
          }
        }
        if (updatedCovers) {
          localStorage.setItem('cover_overrides', JSON.stringify(coverOverrides));
        }
      } catch {}
    }

    const localOnlyBooks = Object.values(localEdits)
      .filter((e: any) => !backendIds.has(String(e.id)) && !deleted.has(String(e.id)))
      .map((e: any) => {
        const numBase = parseFloat(String(e.price || '0').replace(/[^\d.-]/g, '')) || 50000;
        const priceOv = pricingOverrides[String(e.id)];
        const pe = priceOv?.price_electronic ?? (e.price_electronic != null ? Number(e.price_electronic) : (e.priceElectronic ? Number(String(e.priceElectronic).replace(/\D/g, '')) : Math.max(10000, Math.round((numBase * 0.5) / 1000) * 1000)));
        const pp = priceOv?.price_paper ?? (e.price_paper != null ? Number(e.price_paper) : (e.pricePaper ? Number(String(e.pricePaper).replace(/\D/g, '')) : Math.max(pe, numBase > 0 ? numBase : 60000)));
        return {
          id: String(e.id),
          title: e.title || '',
          author: e.author || '',
          price: formatPrice(e.price),
          rating: Number(e.rating) || 5,
          image: fixMediaUrl(coverOverrides[String(e.id)] || e.image || e.imageUrl || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop'),
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
          sale_price: e.sale_price != null ? Number(e.sale_price) : null,
          salePrice: e.salePrice || '',
          discount_expires_at: e.discount_expires_at || null,
          discountExpiresAt: e.discount_expires_at || e.discountExpiresAt || null,
          price_electronic: pe,
          price_paper: pp,
          priceElectronic: formatPrice(pe),
          pricePaper: formatPrice(pp),
        } as Book;
      });

    const filteredWithOverrides = filtered.map(book => {
      const edit = localEdits[book.id];
      const base = edit ? { ...book, ...edit, id: book.id, price: formatPrice(edit.price || book.price) } : book;
      const ov = discountOverrides[String(book.id)];
      const coverOv = coverOverrides[String(book.id)];
      const priceOv = pricingOverrides[String(book.id)];
      const pe = priceOv?.price_electronic ?? base.price_electronic;
      const pp = priceOv?.price_paper ?? base.price_paper;
      let finalCover = coverOv || base.image;
      if (String(book.id) === '1' && (finalCover === '/images/binafsha.jpeg' || !finalCover)) {
        finalCover = '/images/binafsha-2.jpg';
      }
      return {
        ...base,
        image: finalCover,
        sale_price: ov ? ov.sale_price : base.sale_price,
        discount_expires_at: ov ? ov.discount_expires_at : base.discount_expires_at,
        discountExpiresAt: ov ? ov.discount_expires_at : base.discountExpiresAt,
        price_electronic: pe,
        price_paper: pp,
        priceElectronic: formatPrice(pe),
        pricePaper: formatPrice(pp),
      };
    });

    const result = [...filteredWithOverrides, ...localOnlyBooks].map(b => {
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem(`book_rating_${b.id}`);
          if (stored && !isNaN(Number(stored))) {
            return { ...b, rating: Number(stored) };
          }
        } catch {}
      }
      return b;
    });

    if (typeof window !== 'undefined' && result.length > 0) {
      try {
        localStorage.setItem('cached_full_books', JSON.stringify(result));
        localStorage.setItem('cached_backend_books', JSON.stringify(raw));
      } catch {}
    }

    return result;
  },

  async getBook(id: string | number): Promise<Book | null> {
    const idStr = String(id);
    const coverOverrides = getCoverOverrides();
    const discountOverrides = getDiscountOverrides();
    const pricingOverrides = getPricingOverrides();

    // 1. First check locally-created admin books (local_ IDs only)
    if (typeof window !== 'undefined' && idStr.startsWith('local_')) {
      try {
        const adminBooks: any[] = JSON.parse(localStorage.getItem('admin_books') || '[]');
        const localBook = adminBooks.find((b: any) => String(b.id) === idStr);
        if (localBook) {
          const coverOv = coverOverrides[idStr];
          const discountOv = discountOverrides[idStr];
          const priceOv = pricingOverrides[idStr];
          const pe = priceOv?.price_electronic ?? (localBook.price_electronic != null ? Number(localBook.price_electronic) : null);
          const pp = priceOv?.price_paper ?? (localBook.price_paper != null ? Number(localBook.price_paper) : null);
          return {
            id: idStr,
            title: localBook.title || '',
            author: localBook.author || '',
            price: formatPrice(localBook.price),
            rating: Number(localBook.rating) || 5,
            image: coverOv || fixMediaUrl(localBook.image || localBook.imageUrl || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop'),
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
            sale_price: discountOv ? discountOv.sale_price : (localBook.sale_price != null ? Number(localBook.sale_price) : null),
            discount_expires_at: discountOv ? discountOv.discount_expires_at : (localBook.discount_expires_at || null),
            discountExpiresAt: discountOv ? discountOv.discount_expires_at : (localBook.discount_expires_at || null),
            price_electronic: pe,
            price_paper: pp,
            priceElectronic: formatPrice(pe),
            pricePaper: formatPrice(pp),
          } as any;
        }
      } catch { }
    }

    // 2. Immediate local / cached book fallback so there's never a blank page
    const localRaw = booksDB.find((b) => String(b.id) === idStr) || null;
    let fallbackBook = localRaw ? mapDjangoBookToBook(localRaw) : null;

    if (typeof window !== 'undefined') {
      try {
        const cachedStr = localStorage.getItem('cached_full_books') || localStorage.getItem('cached_backend_books');
        if (cachedStr) {
          const parsed = JSON.parse(cachedStr);
          const match = Array.isArray(parsed) && parsed.find((b: any) => String(b.id) === idStr);
          if (match) {
            fallbackBook = mapDjangoBookToBook(match);
          }
        }
      } catch {}
    }

    // 3. Try backend with a fast 4s timeout
    let book = fallbackBook;
    try {
      const res = await fetch(`${getBase()}/books/${idStr}/`, {
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const freshRaw = await res.json();
        if (freshRaw && freshRaw.id) {
          book = mapDjangoBookToBook(freshRaw);
        }
      }
    } catch {}

    if (book) {
      const coverOv = coverOverrides[idStr];
      if (coverOv) book.image = coverOv;
      if (idStr === '1' && (book.image === '/images/binafsha.jpeg' || !book.image)) {
        book.image = '/images/binafsha-2.jpg';
      }
      const discountOv = discountOverrides[idStr];
      if (discountOv) {
        book.sale_price = discountOv.sale_price;
        book.discount_expires_at = discountOv.discount_expires_at;
        (book as any).discountExpiresAt = discountOv.discount_expires_at;
      }
      const priceOv = pricingOverrides[idStr];
      if (priceOv) {
        if (priceOv.price_electronic != null) {
          book.price_electronic = priceOv.price_electronic;
          book.priceElectronic = formatPrice(priceOv.price_electronic);
        }
        if (priceOv.price_paper != null) {
          book.price_paper = priceOv.price_paper;
          book.pricePaper = formatPrice(priceOv.price_paper);
        }
      }
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem(`book_rating_${idStr}`);
          if (stored && !isNaN(Number(stored))) {
            book.rating = Number(stored);
          }
        } catch {}
      }
      return book;
    }

    // 4. Fallback to localStorage admin_books
    const localEdits = getLocalAdminBooks();
    const edit = localEdits[idStr];
    if (edit) {
      return {
        id: idStr,
        title: edit.title || '',
        author: edit.author || '',
        category: edit.category || 'Badiiy',
        price: formatPrice(edit.price),
        description: edit.description || '',
        pages: edit.pages != null ? Number(edit.pages) : 0,
        language: edit.language || "O'zbek tili",
        publishedYear: formatPublishedYear(edit.publishedYear || '2024', edit.title, idStr),
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

  async getRecommendedBooks(excludeId: string | number): Promise<Book[]> {
    const idStr = String(excludeId);
    const localRecommended = getInitialRecommended(idStr);
    try {
      const res = await fetch(`${getBase()}/books/${idStr}/recommended/`, {
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const raw = await res.json();
        if (Array.isArray(raw) && raw.length > 0) {
          return raw.map(mapDjangoBookToBook);
        }
      }
    } catch {}
    return localRecommended;
  },

  // Delete a book — tries backend DELETE, also removes from local admin_books and adds to deleted_ids
  async deleteBook(id: string): Promise<{ success: boolean; fromBackend: boolean }> {
    // Always track deletion locally so frontend can filter it out
    if (typeof window !== 'undefined') {
      removeCoverOverride(id);
      saveDiscountOverride(id, null, null);
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
    let descToSave = (data.description || '').replace(/<!--DISCOUNT:.*?-->/g, '').replace(/<!--PRICING:.*?-->/g, '').trim();
    const saleNum = data.sale_price != null ? Number(data.sale_price) : null;
    const expAt = data.discount_expires_at || data.discountExpiresAt || null;
    if (saleNum && saleNum > 0) {
      descToSave = `${descToSave}\n<!--DISCOUNT:${JSON.stringify({ sale_price: saleNum, discount_expires_at: expAt })}-->`;
    }
    const pe = data.price_electronic != null ? Number(data.price_electronic) : (data.priceElectronic ? Number(String(data.priceElectronic).replace(/\D/g, '')) : null);
    const pp = data.price_paper != null ? Number(data.price_paper) : (data.pricePaper ? Number(String(data.pricePaper).replace(/\D/g, '')) : null);
    if (pe != null || pp != null) {
      descToSave = `${descToSave}\n<!--PRICING:${JSON.stringify({ price_electronic: pe, price_paper: pp })}-->`;
    }

    const payload = {
      title: data.title,
      author: data.author,
      category: data.category,
      price: data.price,
      description: descToSave,
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
    const pe = data.price_electronic != null ? Number(data.price_electronic) : (data.priceElectronic ? Number(String(data.priceElectronic).replace(/\D/g, '')) : null);
    const pp = data.price_paper != null ? Number(data.price_paper) : (data.pricePaper ? Number(String(data.pricePaper).replace(/\D/g, '')) : null);

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
      // Description ichiga discount va pricing metadata joylash (Render PostgreSQL backend da abadiy saqlanadi)
      let descToSave = (data.description || '').replace(/<!--DISCOUNT:.*?-->/g, '').replace(/<!--PRICING:.*?-->/g, '').trim();
      const saleNum = data.sale_price != null ? Number(data.sale_price) : (data.salePriceNum != null ? Number(data.salePriceNum) : null);
      const expAt = data.discount_expires_at || data.discountExpiresAt || null;
      if (saleNum && saleNum > 0) {
        descToSave = `${descToSave}\n<!--DISCOUNT:${JSON.stringify({ sale_price: saleNum, discount_expires_at: expAt })}-->`;
      }
      if (pe != null || pp != null) {
        descToSave = `${descToSave}\n<!--PRICING:${JSON.stringify({ price_electronic: pe, price_paper: pp })}-->`;
      }
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
        description: descToSave,
        content: data.content || '',
        is_weekly_top: isWeekly,
        is_trending: isWeekly,
        has_audio: Boolean(data.hasAudio !== undefined ? data.hasAudio : data.has_audio),
        audio_url: data.audioUrl || data.audio_url || '',
      };

      if (data.imageUrl && !data.imageUrl.startsWith('data:')) {
        patchData.cover_image_url = data.imageUrl;
        patchData.image = data.imageUrl;
      }

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
        try {
          const updatedBook = await res.json();
          if (updatedBook && (updatedBook.cover_image || updatedBook.image)) {
            const newCov = fixMediaUrl(updatedBook.cover_image || updatedBook.image);
            saveCoverOverride(String(id), newCov);
          }
        } catch {}
      }
    } catch { }

    // 2. Also sync to localStorage & permanent cover overrides
    if (typeof window !== 'undefined') {
      if (data.imageUrl || data.image) {
        let imgToSave = data.imageUrl || data.image;
        if (String(id) === '1' && imgToSave === '/images/binafsha.jpeg') {
          imgToSave = '/images/binafsha-2.jpg';
        }
        saveCoverOverride(String(id), imgToSave);
      }
      if (pe != null || pp != null) {
        savePricingOverride(String(id), pe, pp);
      }
      try {
        const stored: any[] = JSON.parse(localStorage.getItem('admin_books') || '[]');
        const idx = stored.findIndex(b => String(b.id) === String(id));
        const updated = {
          ...(idx >= 0 ? stored[idx] : {}),
          ...data,
          id: String(id),
          price: formatPrice(data.price),
          price_electronic: pe,
          price_paper: pp,
          priceElectronic: formatPrice(pe),
          pricePaper: formatPrice(pp),
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
      const finalReviews = combined;
      if (typeof window !== 'undefined' && finalReviews.length > 0) {
        try {
          const avg = Math.round((finalReviews.reduce((sum, r) => sum + r.rating, 0) / finalReviews.length) * 10) / 10;
          localStorage.setItem(`book_rating_${bookId}`, String(avg));
          localStorage.setItem(`book_reviews_count_${bookId}`, String(finalReviews.length));
        } catch {}
      }
      return finalReviews;
    }
    if (typeof window !== 'undefined' && localReviews.length > 0) {
      try {
        const avg = Math.round((localReviews.reduce((sum, r) => sum + r.rating, 0) / localReviews.length) * 10) / 10;
        localStorage.setItem(`book_rating_${bookId}`, String(avg));
        localStorage.setItem(`book_reviews_count_${bookId}`, String(localReviews.length));
      } catch {}
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
