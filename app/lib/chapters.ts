/**
 * Kitob matnini intellektual tarzda boblarga ajratish yordamchisi.
 *
 * Quyidagi formatlarni avtomatik taniydi:
 * - --- Bob nomi --- / === Bob nomi === / ### Bob nomi
 * - MUQADDIMA / KIRISH / XOTIMA / SO'ZBOSHI / PROLOG / EPILOG
 * - BIRINCHI BOB / IKKINCHI BOB / UCHINCHI BOB ...
 * - 1-BOB / 2-BOB / 1-bob: ... / Bob 1 / Bob 2
 * - I BOB / II BOB / Bob I / Bob II
 * - Chapter 1 / Глава 1
 */

export function detectChapterTitle(rawLine: string): string | null {
  const line = rawLine.trim();
  if (!line || line.length > 100) return null;

  // 1. Explicit delimiters: --- Bob nomi --- or === Bob nomi === or *** Bob nomi ***
  const delimiterMatch = line.match(/^[-=*~_#]{2,}\s*(.+?)\s*[-=*~_#]{2,}$/);
  if (delimiterMatch) {
    const t = delimiterMatch[1].trim();
    if (t) return t;
  }

  // 2. Markdown headers: # Bob nomi or ## Bob nomi or ### Bob nomi
  const mdMatch = line.match(/^#{1,3}\s+(.+)$/);
  if (mdMatch) {
    const t = mdMatch[1].trim();
    if (t) return t;
  }

  // 3. Intro / Outro keywords (Muqaddima, Kirish, Xotima, So'zboshi, Epilog, Prolog)
  const introMatch = line.match(/^(?:muqaddima|kirish|kirish\s+so['’`]?zi|xotima|so['’`]?zboshi|prolog|epilog)(?:\s*[:.\-–—]\s*.*)?$/i);
  if (introMatch) {
    return line;
  }

  // 4. Uzbek word numbers for chapters/parts:
  // Birinchi bob, Ikkinchi bob, Uchinchi bob, To'rtinchi bob, Beshinchi bob,
  // Oltinchi bob, Yettinchi bob, Sakkizinchi bob, To'qqizinchi bob, O'ninchi bob, etc.
  const uzWordRegex = /^(?:(?:birinchi|ikkinchi|uchinchi|to['’`]?rtinchi|beshinchi|oltinchi|yettinchi|sakkizinchi|to['’`]?qqizinchi|o['’`]?ninchi|o['’`]?n\s+[a-z'’`]+|yigirmanchi|yigirma\s+[a-z'’`]+|o['’`]?ttizinchi)\s+(?:bob|qism|fasl))(?:\s*[:.\-–—]\s*.*)?$/i;
  if (uzWordRegex.test(line)) {
    return line;
  }

  // 5. Numeric: "1-bob", "1 - bob", "1. Bob", "1-qism", "1-BOB: Sarvinoz"
  const numBob1 = /^\d+\s*[-–—.]?\s*(?:bob|qism|fasl)(?:\s*[:.\-–—]\s*.*)?$/i;
  if (numBob1.test(line)) {
    return line;
  }

  // 5b. Numeric prefix: "Bob 1", "Bob 1:", "Qism 2"
  const numBob2 = /^(?:bob|qism|fasl)\s*[-–—.]?\s*\d+(?:\s*[:.\-–—]\s*.*)?$/i;
  if (numBob2.test(line)) {
    return line;
  }

  // 6. Roman numerals: "I bob", "II-bob", "Bob I", "Bob IV"
  const romanBob1 = /^[ivxldcm]+\s*[-–—.]?\s*(?:bob|qism|fasl)(?:\s*[:.\-–—]\s*.*)?$/i;
  if (romanBob1.test(line)) {
    return line;
  }
  const romanBob2 = /^(?:bob|qism|fasl)\s*[-–—.]?\s*[ivxldcm]+(?:\s*[:.\-–—]\s*.*)?$/i;
  if (romanBob2.test(line)) {
    return line;
  }

  // 7. Russian / English: "Chapter 1", "Глава 1"
  const foreignBob = /^(?:chapter|glava|глава)\s*[-–—.]?\s*(?:\d+|[ivxldcm]+)(?:\s*[:.\-–—]\s*.*)?$/i;
  if (foreignBob.test(line)) {
    return line;
  }

  return null;
}

export function parseBookIntoChapters(rawContent: string): { title: string; content: string }[] {
  if (!rawContent || !rawContent.trim()) return [];

  const lines = rawContent.split(/\r?\n/);
  const parsed: { title: string; content: string }[] = [];
  let currentTitle: string | null = null;
  let currentLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const detected = detectChapterTitle(line);

    if (detected) {
      // Agar oldingi qatorlar to'plangan bo'lsa, avvalgi bobni saqlaymiz
      const textSoFar = currentLines.join('\n').trim();
      if (textSoFar.length > 0) {
        parsed.push({
          title: currentTitle || 'Muqaddima',
          content: textSoFar,
        });
      }
      currentTitle = detected;
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }

  // Oxirgi to'plangan bobni saqlash
  const remainingText = currentLines.join('\n').trim();
  if (remainingText.length > 0 || currentTitle) {
    parsed.push({
      title: currentTitle || (parsed.length === 0 ? '1-Bob' : `${parsed.length + 1}-Bob`),
      content: remainingText,
    });
  }

  // Agar sarlavhalar orqali boblar topilgan bo'lsa, ularni qaytaramiz
  if (parsed.length > 1) {
    return parsed;
  }

  // Agar sarlavhalar orqali ajralmagan bo'lsa va matn juda katta bo'lsa (>5000 belgi)
  const singleContent = (parsed[0]?.content || rawContent).trim();
  const CHUNK_SIZE = 5000;
  if (singleContent.length > CHUNK_SIZE && parsed.length <= 1) {
    const autoChapters: { title: string; content: string }[] = [];
    const paragraphs = singleContent.split(/\n\n+/);
    let currentChunk = '';
    let chapterNum = 1;
    for (const p of paragraphs) {
      if (currentChunk.length + p.length > CHUNK_SIZE && currentChunk.trim().length > 0) {
        autoChapters.push({ title: `${chapterNum}-Qism`, content: currentChunk.trim() });
        chapterNum++;
        currentChunk = p + '\n\n';
      } else {
        currentChunk += p + '\n\n';
      }
    }
    if (currentChunk.trim()) {
      autoChapters.push({ title: `${chapterNum}-Qism`, content: currentChunk.trim() });
    }
    if (autoChapters.length > 1) return autoChapters;
  }

  return parsed.length > 0 ? parsed : [{ title: '1-Bob', content: rawContent.trim() }];
}

export function countChaptersInContent(rawContent: string): number {
  if (!rawContent || !rawContent.trim()) return 0;
  const parsed = parseBookIntoChapters(rawContent);
  return parsed.length;
}
