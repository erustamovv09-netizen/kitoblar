/**
 * Uzbek tilida sanalarni barcha brauzerlarda (Chrome, Safari, Firefox va b.)
 * bir xil va chiroyli formatlash uchun utilita.
 * 
 * Chrome (V8) dagi 'uz-UZ' lokalining '2026 M06 18' kabi xatoliklarini to'liq bartaraf etadi.
 */

export const UZ_MONTHS = [
  'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
  'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'
];

/**
 * Sanani '18-iyun, 2026' shaklida chiroyli qilib formatlash
 */
export function formatUzbekDate(val: string | Date | number | null | undefined): string {
  if (!val) return '';

  const str = String(val).trim();

  // Agar allaqachon to'g'ri o'zbek oyi nomi bo'lsa va 'M0' yoki 'M1' kabi brauzer xatosi bo'lmasa
  if (!/\bM\d{1,2}\b/i.test(str)) {
    const hasMonthName = UZ_MONTHS.some(m => str.toLowerCase().includes(m));
    if (hasMonthName) return str;
  }

  // Chrome'dagi '2026 M06 18' yoki '2026-M06-18' formatidagi xatolikni tuzatish
  const chromeMatch1 = str.match(/(\d{4})\s*[-/.]?\s*M0?(\d{1,2})\s*[-/.]?\s*(\d{1,2})/i);
  if (chromeMatch1) {
    const year = chromeMatch1[1];
    const monthIdx = parseInt(chromeMatch1[2], 10) - 1;
    const day = parseInt(chromeMatch1[3], 10);
    const monthName = UZ_MONTHS[monthIdx] || '';
    return `${day}-${monthName}, ${year}`;
  }

  // '18 M06 2026' yoki '18-M06-2026' formatidagi xatolikni tuzatish
  const chromeMatch2 = str.match(/(\d{1,2})\s*[-/.]?\s*M0?(\d{1,2})\s*[-/.]?\s*(\d{4})/i);
  if (chromeMatch2) {
    const day = parseInt(chromeMatch2[1], 10);
    const monthIdx = parseInt(chromeMatch2[2], 10) - 1;
    const year = chromeMatch2[3];
    const monthName = UZ_MONTHS[monthIdx] || '';
    return `${day}-${monthName}, ${year}`;
  }

  // YYYY-MM-DD yoki YYYY.MM.DD
  const ymdMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const monthIdx = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    const monthName = UZ_MONTHS[monthIdx] || '';
    if (monthName) return `${day}-${monthName}, ${year}`;
  }

  // DD.MM.YYYY yoki DD/MM/YYYY yoki DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const monthIdx = parseInt(dmyMatch[2], 10) - 1;
    const year = dmyMatch[3];
    const monthName = UZ_MONTHS[monthIdx] || '';
    if (monthName) return `${day}-${monthName}, ${year}`;
  }

  // Oddiy Date ob'ekti yoki ISO sana qatori bo'lsa
  const d = new Date(val);
  if (!isNaN(d.getTime())) {
    const day = d.getDate();
    const month = UZ_MONTHS[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${month}, ${year}`;
  }

  return str;
}

/**
 * Bugungi sanani '18-iyun, 2026' formatida qaytaradi
 */
export function getTodayUzbekDate(): string {
  const now = new Date();
  const day = now.getDate();
  const month = UZ_MONTHS[now.getMonth()];
  const year = now.getFullYear();
  return `${day}-${month}, ${year}`;
}

/**
 * Sanani vaqt bilan birga '18-iyun, 2026, 14:30' formatida qaytaradi
 */
export function formatUzbekDateTime(val?: string | Date | number | null): string {
  const d = val ? new Date(val) : new Date();
  const dateStr = formatUzbekDate(d);
  if (isNaN(d.getTime())) return dateStr;
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${dateStr}, ${hours}:${minutes}`;
}

