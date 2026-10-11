// O'zbek tili uchun noaniq qidiruv (Fuzzy Search) va xatoliklarni to'g'rilash (Levenshtein Distance) utiliti

/**
 * Matnni qidiruv uchun tozalash va unifikatsiya qilish
 * O'zbek harflari: o', g', sh, ch, tutuq belgilarini bir xil formatga keltiradi
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[ʻʼ‘`´']/g, "'") // Barcha turdagi apostroflarni standart ' ga aylantirish
    .replace(/o['ʼ‘`´]/g, 'o')  // o' -> o
    .replace(/g['ʼ‘`´]/g, 'g')  // g' -> g
    .replace(/sh/g, 's')       // sh -> s (qo'shimcha moslik uchun)
    .replace(/ch/g, 'c')       // ch -> c
    .replace(/[^a-z0-9\s]/gi, '') // maxsus belgilarni tozalash
    .trim();
}

/**
 * Ikki so'z o'rtasidagi Levenshtein (tahrirlash) masofasini hisoblaydi.
 * Masalan: "otkan" va "o'tgan" -> 1 ta harf farqi.
 */
export function levenshteinDistance(a: string, b: string): number {
  const an = a.length;
  const bn = b.length;
  if (an === 0) return bn;
  if (bn === 0) return an;

  const matrix: number[][] = [];

  for (let i = 0; i <= bn; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= an; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= bn; i++) {
    for (let j = 1; j <= an; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // almashtirish
          Math.min(
            matrix[i][j - 1] + 1,   // qo'shish
            matrix[i - 1][j] + 1    // o'chirish
          )
        );
      }
    }
  }

  return matrix[bn][an];
}

/**
 * So'z boshqa matn ichida bormi yoki ozgina xato (imlo xatosi) bilan mos keladimi?
 */
export function fuzzyMatchWord(targetWord: string, queryWord: string): boolean {
  if (!targetWord || !queryWord) return false;
  if (targetWord === queryWord) return true;
  if (targetWord.includes(queryWord) || queryWord.includes(targetWord)) return true;

  // Agar so'z uzunligi 3 tadan ko'p bo'lsa, xatolikka ruxsat beramiz
  const maxDistance = queryWord.length > 5 ? 2 : queryWord.length > 3 ? 1 : 0;
  if (maxDistance > 0) {
    const dist = levenshteinDistance(targetWord, queryWord);
    if (dist <= maxDistance) return true;
  }

  return false;
}

/**
 * Asosiy moslik funksiyasi:
 * Kitob sarlavhasi yoki muallifi foydalanuvchi qidiruv so'zlariga qanchalik mos kelishini aniqlaydi.
 */
export function matchesFuzzyQuery(targetTitle: string, targetAuthor: string, query: string): { matches: boolean; score: number } {
  if (!query.trim()) return { matches: true, score: 0 };

  const rawQ = query.toLowerCase().trim();
  const rawTitle = targetTitle.toLowerCase();
  const rawAuthor = targetAuthor.toLowerCase();

  // 1. To'g'ridan-to'g'ri to'liq moslik (eng yuqori ball)
  if (rawTitle.includes(rawQ)) return { matches: true, score: 100 };
  if (rawAuthor.includes(rawQ)) return { matches: true, score: 80 };

  // 2. Normalizatsiya qilingan (o', g' belgilari hisobga olinmagan) moslik
  const normQ = normalizeText(query);
  const normTitle = normalizeText(targetTitle);
  const normAuthor = normalizeText(targetAuthor);

  if (normTitle.includes(normQ)) return { matches: true, score: 90 };
  if (normAuthor.includes(normQ)) return { matches: true, score: 70 };

  // 3. So'zma-so'z tekshirish va xatoliklarni kechirish
  const qWords = normQ.split(/\s+/).filter(Boolean);
  const titleWords = normTitle.split(/\s+/).filter(Boolean);
  const authorWords = normAuthor.split(/\s+/).filter(Boolean);

  let matchedWordsCount = 0;
  for (const qWord of qWords) {
    const inTitle = titleWords.some(tWord => fuzzyMatchWord(tWord, qWord));
    const inAuthor = authorWords.some(aWord => fuzzyMatchWord(aWord, qWord));
    if (inTitle || inAuthor) {
      matchedWordsCount++;
    }
  }

  // Agar qidirilgan so'zlarning kamida 70% mos kelsa
  if (qWords.length > 0 && matchedWordsCount >= Math.ceil(qWords.length * 0.7)) {
    return { matches: true, score: 50 + (matchedWordsCount * 10) };
  }

  return { matches: false, score: 0 };
}
