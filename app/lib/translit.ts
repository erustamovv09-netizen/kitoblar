/**
 * O'zbek tili uchun mukammal ikki tomonlama transliteratsiya moduli:
 * - Lotin -> Kiril (Latin to Cyrillic)
 * - Kiril -> Lotin (Cyrillic to Latin)
 * Matn dastlab qaysi yozuvda kiritilganidan qat'i nazar (Lotin yoki Kiril),
 * o'quvchi xohlagan yozuv turiga (Lotin yoki Kiril) to'g'ri o'girib beradi.
 */

export function hasCyrillic(text: string): boolean {
  return /[\u0400-\u04FF]/.test(text);
}

export function hasLatin(text: string): boolean {
  return /[A-Za-z]/.test(text);
}

/**
 * Kirilcha matnni Lotinchaga o'girish
 */
export function toLatin(text: string): string {
  if (!text) return '';

  let res = text;

  // Uppercase context: oldidan yoki ketidan boshqa bosh harf kelsa to'liq KATTA harf bo'ladi
  const isUpperContext = '(?=[А-ЯЁЎҒҚҲA-Z])|(?<=[А-ЯЁЎҒҚҲA-Z])';

  // 1. Ko'p harfli kiril harflari (Digraflar va maxsus harflar)
  res = res.replace(new RegExp(`Ш(?:${isUpperContext})`, 'gu'), 'SH');
  res = res.replace(/Ш/g, 'Sh');
  res = res.replace(/ш/g, 'sh');

  res = res.replace(new RegExp(`Ч(?:${isUpperContext})`, 'gu'), 'CH');
  res = res.replace(/Ч/g, 'Ch');
  res = res.replace(/ч/g, 'ch');

  res = res.replace(new RegExp(`Щ(?:${isUpperContext})`, 'gu'), 'SHCH');
  res = res.replace(/Щ/g, 'Shch');
  res = res.replace(/щ/g, 'shch');

  res = res.replace(new RegExp(`Ц(?:${isUpperContext})`, 'gu'), 'TS');
  res = res.replace(/Ц/g, 'Ts');
  res = res.replace(/ц/g, 'ts');

  res = res.replace(new RegExp(`Ё(?:${isUpperContext})`, 'gu'), 'YO');
  res = res.replace(/Ё/g, 'Yo');
  res = res.replace(/ё/g, 'yo');

  res = res.replace(new RegExp(`Ю(?:${isUpperContext})`, 'gu'), 'YU');
  res = res.replace(/Ю/g, 'Yu');
  res = res.replace(/ю/g, 'yu');

  res = res.replace(new RegExp(`Я(?:${isUpperContext})`, 'gu'), 'YA');
  res = res.replace(/Я/g, 'Ya');
  res = res.replace(/я/g, 'ya');

  res = res.replace(new RegExp(`Ў(?:${isUpperContext})`, 'gu'), "O'");
  res = res.replace(/Ў/g, "O'");
  res = res.replace(/ў/g, "o'");

  res = res.replace(new RegExp(`Ғ(?:${isUpperContext})`, 'gu'), "G'");
  res = res.replace(/Ғ/g, "G'");
  res = res.replace(/ғ/g, "g'");

  // 2. E / e harfining maxsus holati:
  // So'z boshida yoki unli/tutuq belgisidan keyin -> Ye / ye
  // Undosh harfdan keyin -> E / e
  res = res.replace(/(^|[\s\p{P}\p{S}\d]|[аоуиэеўёюяАОУИЭЕЎЁЮЯъьЪЬ])Е(?=[А-ЯЁЎҒҚҲA-Z])/gu, '$1YE');
  res = res.replace(/(^|[\s\p{P}\p{S}\d]|[аоуиэеўёюяАОУИЭЕЎЁЮЯъьЪЬ])Е/gu, '$1Ye');
  res = res.replace(/(^|[\s\p{P}\p{S}\d]|[аоуиэеўёюяАОУИЭЕЎЁЮЯъьЪЬ])е/gu, '$1ye');
  res = res.replace(/Е/g, 'E');
  res = res.replace(/е/g, 'e');

  res = res.replace(/Э/g, 'E');
  res = res.replace(/э/g, 'e');

  // Ъ / ъ -> '
  res = res.replace(/[Ъъ]/g, "'");

  // Ь / ь -> unlidan oldin kelsa tutuq, aks holda tushirib qoldiriladi
  res = res.replace(/[Ьь](?=[еёюяЕЁЮЯ])/g, "'");
  res = res.replace(/[Ьь]/g, '');

  // 3. Yakka kiril harflari (aniq Unicode escape kodlari bilan)
  const map: Record<string, string> = {
    '\u0410': 'A', '\u0430': 'a', // А, а
    '\u0411': 'B', '\u0431': 'b', // Б, б
    '\u0412': 'V', '\u0432': 'v', // В, в
    '\u0413': 'G', '\u0433': 'g', // Г, г
    '\u0414': 'D', '\u0434': 'd', // Д, д
    '\u0416': 'J', '\u0436': 'j', // Ж, ж
    '\u0417': 'Z', '\u0437': 'z', // З, з
    '\u0418': 'I', '\u0438': 'i', // И, и
    '\u0419': 'Y', '\u0439': 'y', // Й, й
    '\u041A': 'K', '\u043A': 'k', // К, к
    '\u041B': 'L', '\u043B': 'l', // Л, л
    '\u041C': 'M', '\u043C': 'm', // М, м
    '\u041D': 'N', '\u043D': 'n', // Н, н
    '\u041E': 'O', '\u043E': 'o', // О, о
    '\u041F': 'P', '\u043F': 'p', // П, п
    '\u0420': 'R', '\u0440': 'r', // Р, р
    '\u0421': 'S', '\u0441': 's', // С, с
    '\u0422': 'T', '\u0442': 't', // Т, т
    '\u0423': 'U', '\u0443': 'u', // У, у
    '\u0424': 'F', '\u0444': 'f', // Ф, ф
    '\u0425': 'X', '\u0445': 'x', // Х, х
    '\u042B': 'I', '\u044B': 'i', // Ы, ы
    '\u049A': 'Q', '\u049B': 'q', // Қ, қ
    '\u04B2': 'H', '\u04B3': 'h', // Ҳ, ҳ
  };

  return res.replace(/[\u0400-\u04FF]/g, char => map[char] || char);
}

/**
 * Lotincha matnni Kirilchaga o'girish
 */
export function toCyrillic(text: string): string {
  if (!text) return '';

  let res = text;

  // 1. O' va G' harflarini turli apostrof shakllari bilan normallashtirish (' ‘ ’ ʻ ʼ ` ´)
  res = res.replace(/O['‘'’ʻʼ`´]/g, 'Ў');
  res = res.replace(/o['‘'’ʻʼ`´]/g, 'ў');
  res = res.replace(/G['‘'’ʻʼ`´]/g, 'Ғ');
  res = res.replace(/g['‘'’ʻʼ`´]/g, 'ғ');

  // 2. Digraflar (bitta harfli qoidalardan oldin almashtiriladi)
  res = res.replace(/SH/g, 'Ш');
  res = res.replace(/Sh/g, 'Ш');
  res = res.replace(/sh/g, 'ш');

  res = res.replace(/CH/g, 'Ч');
  res = res.replace(/Ch/g, 'Ч');
  res = res.replace(/ch/g, 'ч');

  res = res.replace(/YO/g, 'Ё');
  res = res.replace(/Yo/g, 'Ё');
  res = res.replace(/yo/g, 'ё');

  res = res.replace(/YU/g, 'Ю');
  res = res.replace(/Yu/g, 'Ю');
  res = res.replace(/yu/g, 'ю');

  res = res.replace(/YA/g, 'Я');
  res = res.replace(/Ya/g, 'Я');
  res = res.replace(/ya/g, 'я');

  res = res.replace(/YE/g, 'Е');
  res = res.replace(/Ye/g, 'Е');
  res = res.replace(/ye/g, 'е');

  res = res.replace(/TS/g, 'Ц');
  res = res.replace(/Ts/g, 'Ц');
  res = res.replace(/ts/g, 'ц');

  // 3. E / e harfining qoidasi:
  // So'z boshida yoki unlidan keyin -> Э / э
  // Undoshdan keyin -> Е / е
  res = res.replace(/(^|[\s\p{P}\p{S}\d]|[aouieAOUiEаоуиэеўёюяАОУИЭЕЎЁЮЯ'‘'’ʻʼ`´])E(?=[A-Za-zА-Яа-я])/gu, '$1Э');
  res = res.replace(/(^|[\s\p{P}\p{S}\d]|[aouieAOUiEаоуиэеўёюяАОУИЭЕЎЁЮЯ'‘'’ʻʼ`´])E/gu, '$1Э');
  res = res.replace(/(^|[\s\p{P}\p{S}\d]|[aouieAOUiEаоуиэеўёюяАОУИЭЕЎЁЮЯ'‘'’ʻʼ`´])e/gu, '$1э');
  res = res.replace(/E/g, 'Е');
  res = res.replace(/e/g, 'е');

  // 4. Qolgan tutuq belgilari
  res = res.replace(/['‘'’ʻʼ`´]/g, 'ъ');

  // 5. Yakka lotin harflari
  const map: Record<string, string> = {
    'A': 'А', 'a': 'а',
    'B': 'Б', 'b': 'б',
    'D': 'Д', 'd': 'д',
    'F': 'Ф', 'f': 'ф',
    'G': 'Г', 'g': 'г',
    'H': 'Ҳ', 'h': 'ҳ',
    'I': 'И', 'i': 'и',
    'J': 'Ж', 'j': 'ж',
    'K': 'К', 'k': 'к',
    'L': 'Л', 'l': 'л',
    'M': 'М', 'm': 'м',
    'N': 'Н', 'n': 'н',
    'O': 'О', 'o': 'о',
    'P': 'П', 'p': 'п',
    'Q': 'Қ', 'q': 'қ',
    'R': 'Р', 'r': 'р',
    'S': 'С', 's': 'с',
    'T': 'Т', 't': 'т',
    'U': 'У', 'u': 'у',
    'V': 'В', 'v': 'в',
    'X': 'Х', 'x': 'х',
    'Y': 'Й', 'y': 'й',
    'Z': 'З', 'z': 'з',
  };

  return res.replace(/[A-Za-z]/g, char => map[char] || char);
}

/**
 * Matnni o'quvchi tanlagan yozuv turiga (script) moslab o'girish:
 * - targetScript === 'latin' bo'lsa: Kirilcha matnni Lotinchaga o'giradi (Lotincha bo'lsa tegilmaydi).
 * - targetScript === 'cyrillic' bo'lsa: Lotincha matnni Kirilchaga o'giradi (Kirilcha bo'lsa tegilmaydi).
 */
export function applyScript(text: string, targetScript: 'latin' | 'cyrillic'): string {
  if (!text) return '';

  if (targetScript === 'latin') {
    // Agar matnda kirilcha harflar bo'lsa, lotinchaga o'giramiz
    if (hasCyrillic(text)) {
      return toLatin(text);
    }
    return text;
  } else {
    // Agar matnda lotincha harflar bo'lsa, kirilchaga o'giramiz
    if (hasLatin(text)) {
      return toCyrillic(text);
    }
    return text;
  }
}
