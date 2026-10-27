/**
 * Doimiy ko'p darajali sessiya boshqaruvi (localStorage + Cookie + sessionStorage).
 * Safari iOS ITP (7 kunlik limit), brauzer keshini tozalash yoki oynani yopishda
 * ham foydalanuvchi hisobdan chiqib ketmasligi uchun 10 yillik cookie bilan sinxronlashgan.
 */

import { formatUzbekDate } from './date';

export interface UserSession {
  username: string;
  name?: string;
  email?: string;
  join_date?: string;
}

const COOKIE_MAX_AGE = 315360000; // 10 yil (sekundlarda)

export function setCookie(name: string, value: string, maxAge = COOKIE_MAX_AGE) {
  if (typeof document === 'undefined') return;
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
}

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

export function deleteCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

/**
 * Foydalanuvchi hisobini doimiy saqlash (Login / Register / Profile update da ishlatiladi)
 */
export function saveUserSession(user: UserSession, options?: { skipEvent?: boolean }) {
  if (typeof window === 'undefined') return;
  const { username, name, email, join_date } = user;
  if (!username) return;

  const displayName = name || username;
  const cleanJoin = join_date ? formatUzbekDate(join_date) : '';

  // Agar allaqachon xuddi shu ma'lumotlar saqlangan bo'lsa, hodisani takroran uzatmaymiz (rekursiv siklni to'xtatish)
  const curUser = localStorage.getItem('username');
  const curName = localStorage.getItem('name');
  const curEmail = localStorage.getItem('email');
  const isUnchanged = curUser === username && curName === displayName && (curEmail || '') === (email || '');

  // 1. localStorage — asosiy mijoz xotirasi
  try {
    localStorage.setItem('username', username);
    localStorage.setItem('name', displayName);
    if (email) localStorage.setItem('email', email);
    if (cleanJoin) localStorage.setItem('join_date', cleanJoin);
  } catch (e) {
    console.warn('localStorage ga yozishda xatolik:', e);
  }

  // 2. Cookie — 10 yillik muddat (Safari ITP yoki xotira tozalansa ham o'chib ketmaydi)
  try {
    setCookie('kitoblar_user', JSON.stringify({
      username,
      name: displayName,
      email: email || '',
      join_date: cleanJoin || ''
    }));
    setCookie('username', username);
    setCookie('name', displayName);
  } catch (e) {
    console.warn('Cookie ga yozishda xatolik:', e);
  }

  // 3. sessionStorage — joriy tab zaxirasi
  try {
    sessionStorage.setItem('auth_username', username);
    sessionStorage.setItem('auth_name', displayName);
    if (email) sessionStorage.setItem('auth_email', email);
  } catch (e) {
    console.warn('sessionStorage ga yozishda xatolik:', e);
  }

  // Faqat ma'lumot o'zgargandagina va skipEvent bo'lmagandagina hodisani uzatamiz
  if (!isUnchanged && !options?.skipEvent) {
    try {
      window.dispatchEvent(new Event('auth-changed'));
    } catch {}
  }
}

/**
 * Sahifa yuklanganda foydalanuvchi sessiyasini tekshiradi va kerak bo'lsa qayta tiklaydi
 */
export function restoreUserSession(): UserSession | null {
  if (typeof window === 'undefined') return null;

  let username = localStorage.getItem('username');
  let name = localStorage.getItem('name');
  let email = localStorage.getItem('email');
  let join_date = localStorage.getItem('join_date');
  if (join_date) join_date = formatUzbekDate(join_date);

  let recoveredFromBackup = false;

  // Agar localStorage dan yo'qolgan bo'lsa (masalan Safari tozalagan bo'lsa), cookie dan tiklaymiz
  if (!username) {
    try {
      const cookieData = getCookie('kitoblar_user');
      if (cookieData) {
        const parsed = JSON.parse(cookieData);
        username = parsed.username || null;
        name = parsed.name || username;
        email = parsed.email || null;
        join_date = parsed.join_date || null;
        if (username) recoveredFromBackup = true;
      } else {
        const simpleUsername = getCookie('username');
        if (simpleUsername) {
          username = simpleUsername;
          name = getCookie('name') || simpleUsername;
          recoveredFromBackup = true;
        }
      }
    } catch {}
  }

  // Agar hali ham topilmasa, sessionStorage dan tiklaymiz
  if (!username) {
    try {
      username = sessionStorage.getItem('auth_username');
      name = sessionStorage.getItem('auth_name') || username;
      email = sessionStorage.getItem('auth_email');
      if (username) recoveredFromBackup = true;
    } catch {}
  }

  if (username) {
    // Faqat cookie yoki sessionStorage dan yangi tiklangan taqdirdagina zaxiraga yozamiz (skipEvent bilan, rekursiyani oldini olish)
    if (recoveredFromBackup) {
      saveUserSession({
        username,
        name: name || username,
        email: email || undefined,
        join_date: join_date || undefined
      }, { skipEvent: true });
    }
    return {
      username,
      name: name || username,
      email: email || undefined,
      join_date: join_date || undefined
    };
  }

  return null;
}

/**
 * Foydalanuvchi tizimdan chiqqanda barcha qatlamlardan to'liq tozalash
 */
export function clearUserSession() {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem('username');
    localStorage.removeItem('name');
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
  } catch {}

  try {
    sessionStorage.removeItem('auth_username');
    sessionStorage.removeItem('auth_name');
    sessionStorage.removeItem('auth_email');
  } catch {}

  try {
    deleteCookie('kitoblar_user');
    deleteCookie('username');
    deleteCookie('name');
  } catch {}

  try {
    window.dispatchEvent(new Event('auth-changed'));
  } catch {}
}
