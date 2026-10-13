"use client";

import React, { useEffect, useState, use, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Settings,
  ChevronLeft,
  ChevronRight,
  Check,
  BookOpen,
  Maximize2,
  Minimize2,
  Menu,
  X
} from 'lucide-react';
import { api, Book } from '../../../lib/api';
import { parseBookIntoChapters } from '@/app/lib/chapters';
import styles from './page.module.css';

// Mock contents for the books in the DB to make the reader feel real
const bookChapters: Record<string, { title: string; content: string }[]> = {
  '1': [
    {
      title: "1-Bob: Sehrli olam ostonasida",
      content: "Xaya har doim o‘zini boshqalardan farq qilishini his etardi. Uning atrofida sodir bo‘ladigan tushunarsiz hodisalar, sirli shivir-shivir ovozlar va binafsha rangli g‘ayritabiiy shu’lalar uni doimo o‘ziga tortardi. Bir kuni kechasi, uzoq o‘rmon chetidagi eski kutubxonadan topilgan qadimiy kitobni ochgach, uning hayoti butunlay o‘zgarib ketdi..."
    },
    {
      title: "2-Bob: Xayaning siri va qismati",
      content: "Yangi sehrli olamga qadam qo‘ygan Xaya u yerda ko‘plab sirli mavjudotlar va o‘zi kabi g‘ayritabiiy qobiliyatga ega bo‘lgan insonlar borligini bilib oladi. Ammo bu olamda faqat yorug‘lik va go‘zallik hukmron emas edi. Qorong‘u kuchlar ham uzoq vaqtdan beri uning kelishini va u ko‘targan qadimiy sirni qo‘lga kiritishni kutishayotgan edi..."
    },
    {
      title: "3-Bob: Nur va soyalar jangi",
      content: "Xaya o‘zining ichki kuchi va qalbining ruhiy uyg‘onishi orqali qorong‘u zulmatga qarshi kurashishga majbur bo‘ladi. Binafsha rangli shu’la faqatgina qudrat belgisi emas, balki qutqaruvchi nur ekanligini anglab yetadi. Uning sarguzashtlari endigina boshlanayotgan bo‘lsa-da, u o‘z taqdiri bilan yuzma-yuz kelishga tayyor edi..."
    }
  ],
  '2': [
    {
      title: "1-Bob: Urush yillari xotirasi",
      content: "Ikki eshik orasi romani inson taqdirlarining murakkab chalkashliklari, urush keltirgan fojialar haqida hikoya qiladi. Asar qahramonlari har kuni hayot va mamot eshiklari orasida yashaydilar. Kattaqo‘rg‘on qishlog‘idagi oddiy odamlarning hayoti urush boshlanishi bilan butunlay o‘zgarib ketadi. Erkaklar frontga jo‘nab ketadi, ayollar va bolalar esa orqa frontda og‘ir mehnat ostida eziladi..."
    },
    {
      title: "2-Bob: Qora kimsaning taqdiri",
      content: "Asardagi har bir qahramon o‘z qismatiga ega. Kimsanning o‘limi va uning atrofidagilarning qayg‘usi odamni chuqur o‘yga toldiradi. Urush yillarida yo‘qotishlar shunchalik ko‘p ediki, odamlar o‘z yaqinlaridan ayrilishga ko‘nikib qolishgandek tuyulardi. Biroq, har bir ayriliq qalbda chuqur va unutilmas chandiqlar qoldiradi..."
    }
  ],
  'b1': [
    {
      title: "1-Bob: Atom odatlarning ajoyib kuchi",
      content: "Odatlar - bu shaxsiy rivojlanishning murakkab foizidir. Agar siz har kuni atigi 1 foizga yaxshi bo‘lsangiz, bir yil davomida deyarli 37 baravar yaxshiroq natijaga erishasiz. Kichik o‘zgarishlar vaqt o‘tishi bilan ulkan natijalarni beradi. Aksincha, har kuni 1 foizga yomonlashsangiz, deyarli nolga tushib qolasiz. Kichik g‘alabalar yoki mayda xatolar to‘planib, hayotingiz yo‘nalishini belgilaydi..."
    },
    {
      title: "2-Bob: Nega odatlarni o‘zgartirish qiyin?",
      content: "Odatlarni o‘zgartirish ikki sababga ko‘ra qiyin: birinchidan, biz noto‘g‘ri narsani o‘zgartirishga harakat qilamiz; ikkinchidan, biz odatni noto‘g‘ri usulda o‘zgartirishga urinamiz. O‘zgarishning uchta darajasi bor: natijalarni o‘zgartirish, jarayonlarni o‘zgartirish va o‘zlikni (shaxsiyatni) o‘zgartirish. Haqiqiy va uzoq muddatli o‘zgarish aynan o‘zlikni o‘zgartirishdan boshlanadi..."
    }
  ]
};

// Fallback chapter generator for other books
const generateChapters = (title: string) => [
  {
    title: "1-Bob: Muqaddima va Kirish",
    content: `"${title}" asarining ushbu bobida kitobning asosiy mazmuni va maqsadi yoritiladi. Muallif mavzuga chuqur kirib borishdan oldin uning ahamiyati va o‘quvchi hayotiga ta’siri haqida yozadi. Falsafiy qarashlar va hayotiy misollar orqali mavzuning dolzarbligi tushuntiriladi.`
  },
  {
    title: "2-Bob: Asosiy Konsepsiyalar va Tahlil",
    content: `Ushbu qismda muallif o‘z g‘oyalarini batafsil ochib beradi. Tizimli yondashuv, nazariy qarashlar va amaliy tahlillar orqali o‘quvchiga yangi bilimlar taqdim etiladi. Har bir fikr dalillar va tajribalar bilan mustahkamlanadi, bu esa asarning qadrini yanada oshiradi.`
  },
  {
    title: "3-Bob: Amaliyot va Xulosa",
    content: `Kitobning yakuniy qismida barcha o‘rganilgan bilimlar va g‘oyalar umumlashtiriladi. O‘quvchi uchun amaliy tavsiyalar, kundalik hayotda qo‘llash usullari va kelajakdagi maqsadlarni belgilash bo‘yicha ko‘rsatmalar beriladi. Mutolaa inson dunyoqarashini o‘zgartiruvchi kuchdir.`
  }
];

export default function BookReaderPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const bookId = resolvedParams.id;
  const [book, setBook] = useState<Book | null>(null);

  // Reader Customization State
  const [theme, setTheme] = useState<'light' | 'dark' | 'sepia'>('dark');
  const [fontSize, setFontSize] = useState<number>(18);
  const [lineHeight, setLineHeight] = useState<'normal' | 'relaxed' | 'loose'>('relaxed');
  const [script, setScript] = useState<'latin' | 'cyrillic'>('latin');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  // Content Navigation State
  const [currentChapter, setCurrentChapter] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Auth Check
  useEffect(() => {
    const isLogged = localStorage.getItem('username');
    if (!isLogged) {
      router.push('/login');
    }
  }, [router]);

  // O'zbek lotin → kiril transliteratsiyasi
  const toСyrillic = (text: string): string => {
    const rules: [RegExp, string][] = [
      // Digraphs (avval)
      [/SH/g, 'Ш'], [/Sh/g, 'Ш'], [/sh/g, 'ш'],
      [/CH/g, 'Ч'], [/Ch/g, 'Ч'], [/ch/g, 'ч'],
      [/O'|O`/g, 'Ў'], [/o'|o`/g, 'ў'],
      [/G'|G`/g, 'Ғ'], [/g'|g`/g, 'ғ'],
      [/YO/g, 'Ё'], [/Yo/g, 'Ё'], [/yo/g, 'ё'],
      [/YA/g, 'Я'], [/Ya/g, 'Я'], [/ya/g, 'я'],
      [/YU/g, 'Ю'], [/Yu/g, 'Ю'], [/yu/g, 'ю'],
      [/YE/g, 'Е'], [/Ye/g, 'Е'], [/ye/g, 'е'],
      [/TS/g, 'Ц'], [/Ts/g, 'Ц'], [/ts/g, 'ц'],
      // Single chars
      [/A/g,'А'],[/a/g,'а'],[/B/g,'Б'],[/b/g,'б'],
      [/D/g,'Д'],[/d/g,'д'],[/E/g,'Э'],[/e/g,'э'],
      [/F/g,'Ф'],[/f/g,'ф'],[/G/g,'Г'],[/g/g,'г'],
      [/H/g,'Ҳ'],[/h/g,'ҳ'],[/I/g,'И'],[/i/g,'и'],
      [/J/g,'Ж'],[/j/g,'ж'],[/K/g,'К'],[/k/g,'к'],
      [/L/g,'Л'],[/l/g,'л'],[/M/g,'М'],[/m/g,'м'],
      [/N/g,'Н'],[/n/g,'н'],[/O/g,'О'],[/o/g,'о'],
      [/P/g,'П'],[/p/g,'п'],[/Q/g,'Қ'],[/q/g,'қ'],
      [/R/g,'Р'],[/r/g,'р'],[/S/g,'С'],[/s/g,'с'],
      [/T/g,'Т'],[/t/g,'т'],[/U/g,'У'],[/u/g,'у'],
      [/V/g,'В'],[/v/g,'в'],[/X/g,'Х'],[/x/g,'х'],
      [/Y/g,'Й'],[/y/g,'й'],[/Z/g,'З'],[/z/g,'з'],
      [/'/g,'ъ'],[/`/g,'ъ'],
    ];
    let result = text;
    for (const [from, to] of rules) result = result.replace(from, to);
    return result;
  };

  const applyScript = (text: string) =>
    script === 'cyrillic' ? toСyrillic(text) : text;

  // Load book from API
  useEffect(() => {
    async function loadBook() {
      const data = await api.getBook(bookId);
      setBook(data);
    }
    loadBook();
  }, [bookId]);

  // Kitob matnini boblarga bo'lish
  const chapters = useMemo(() => {
    const backendContent = (book as any)?.content as string | undefined;

    // Backend'da matn bor bo'lsa — uni aqlli algoritm bilan boblarga bo'lamiz
    if (backendContent && backendContent.trim()) {
      const parsed = parseBookIntoChapters(backendContent);
      if (parsed.length > 0) {
        return parsed;
      }
    }

    // Fallback: oldindan yozilgan boblar yoki avtomatik yaratilgan
    return bookChapters[bookId] || generateChapters(book?.title || 'Kitob');
  }, [bookId, book]);
  const totalChapters = chapters.length;

  // Load preferences and reading progress
  useEffect(() => {
    // Theme
    const savedReaderTheme = localStorage.getItem('reader_theme') as any;
    if (savedReaderTheme) setTheme(savedReaderTheme);

    // Font size
    const savedFontSize = localStorage.getItem('reader_font_size');
    if (savedFontSize) setFontSize(Number(savedFontSize));

    // Script (latin/cyrillic)
    const savedScript = localStorage.getItem('reader_script') as any;
    if (savedScript) setScript(savedScript);

    // Progress
    async function loadProgress() {
      const progress = await api.getReadingProgress(bookId);
      if (progress) {
        // Find chapter index matching progress
        const idx = chapters.findIndex(c => c.title === progress.chapter);
        if (idx !== -1) setCurrentChapter(idx);
      }
      setLoading(false);
    }
    loadProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId]);

  // Save progress on chapter change
  useEffect(() => {
    if (loading) return;
    const percent = Math.round(((currentChapter + 1) / totalChapters) * 100);
    api.saveReadingProgress(
      bookId,
      percent,
      chapters[currentChapter].title,
      1 // page
    );
  }, [currentChapter, bookId, chapters, totalChapters, loading]);

  // Track active reading time (accumulates seconds while reading)
  useEffect(() => {
    if (loading) return;
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        const username = (typeof window !== 'undefined' ? (localStorage.getItem('username') || localStorage.getItem('name')) : null) || 'rustamov';
        const key = `user_reading_time_${username}_${bookId}`;
        const currentSecs = Number(localStorage.getItem(key) || 0) + 10;
        localStorage.setItem(key, String(currentSecs));
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [loading, bookId]);

  const handleNextChapter = () => {
    if (currentChapter < totalChapters - 1) {
      setCurrentChapter(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevChapter = () => {
    if (currentChapter > 0) {
      setCurrentChapter(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => { });
      setFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => { });
      setFullscreen(false);
    }
  };

  const saveThemePref = (t: 'light' | 'dark' | 'sepia') => {
    setTheme(t);
    localStorage.setItem('reader_theme', t);
  };

  const saveFontPref = (size: number) => {
    setFontSize(size);
    localStorage.setItem('reader_font_size', String(size));
  };

  if (!loading && !book) {
    return (
      <div className={styles.errorContainer}>
        <h2>Kitob topilmadi</h2>
        <Link href="/" className={styles.errorBtn}>Bosh sahifaga qaytish</Link>
      </div>
    );
  }

  if (loading && !book) {
    return (
      <div className={styles.errorContainer} style={{ color: 'var(--text-secondary)' }}>
        <BookOpen size={48} style={{ margin: '0 auto 1rem', display: 'block', opacity: 0.5 }} />
        <p>Yuklanmoqda...</p>
      </div>
    );
  }

  // Get active style class depending on theme state
  const themeClass = theme === 'sepia' ? styles.themeSepia : theme === 'light' ? styles.themeLight : styles.themeDark;

  return (
    <div className={`${styles.readerWrapper} ${themeClass}`}>
      {/* Top Navbar */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href={`/book/${bookId}`} className={styles.navBack} title="Kitob sahifasiga qaytish">
            <ArrowLeft size={20} />
            <span>Chiqish</span>
          </Link>
          <div className={styles.divider}>|</div>
          <span className={styles.bookTitle}>{book?.title}</span>
        </div>

        <div className={styles.headerRight}>
          <button
            className={styles.toolBtn}
            onClick={() => setSidebarOpen(s => !s)}
            title="Mundarija"
          >
            <Menu size={20} />
          </button>
          <button
            className={`${styles.toolBtn} ${showSettings ? styles.toolBtnActive : ''}`}
            onClick={() => setShowSettings(s => !s)}
            title="Sozlamalar"
          >
            <Settings size={20} />
          </button>
          <button
            className={styles.toolBtn}
            onClick={toggleFullscreen}
            title={fullscreen ? "Ekran rejimidan chiqish" : "To'liq ekran rejimi"}
          >
            {fullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
        </div>
      </header>

      {/* Sidebar Content (Mundarija) */}
      {sidebarOpen && (
        <div className={styles.sidebarOverlay} onClick={() => setSidebarOpen(false)}>
          <aside className={styles.sidebar} onClick={e => e.stopPropagation()}>
            <div className={styles.sidebarHeader}>
              <h3>Mundarija</h3>
              <button className={styles.closeBtn} onClick={() => setSidebarOpen(false)}>×</button>
            </div>
            <div className={styles.sidebarList}>
              {chapters.map((ch, idx) => (
                <button
                  key={idx}
                  className={`${styles.sidebarItem} ${currentChapter === idx ? styles.sidebarItemActive : ''}`}
                  onClick={() => {
                    setCurrentChapter(idx);
                    setSidebarOpen(false);
                  }}
                >
                  <span className={styles.sidebarIdx}>{idx + 1}</span>
                  <span className={styles.sidebarChTitle}>{ch.title}</span>
                  {currentChapter === idx && <Check size={14} className={styles.activeCheck} />}
                </button>
              ))}
            </div>
          </aside>
        </div>
      )}

      {/* Settings Bar Popover */}
      {showSettings && (
        <>
          {/* Invisible overlay to close on outside click */}
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 49 }}
            onClick={() => setShowSettings(false)}
          />
          <div className={styles.settingsPopover} style={{ zIndex: 50 }}>
            {/* Header with close button */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.6 }}>Sozlamalar</span>
              <button
                onClick={() => setShowSettings(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.6, padding: '2px', display: 'flex', alignItems: 'center', borderRadius: '4px' }}
                title="Yopish"
              >
                <X size={16} />
              </button>
            </div>

            <div className={styles.popoverSection}>
              <span className={styles.sectionLabel}>Mavzu ranglari</span>
              <div className={styles.themeGrid}>
                <button
                  className={`${styles.themeOption} ${styles.themeOptionLight} ${theme === 'light' ? styles.optionActive : ''}`}
                  onClick={() => saveThemePref('light')}
                >
                  Yorug'
                </button>
                <button
                  className={`${styles.themeOption} ${styles.themeOptionSepia} ${theme === 'sepia' ? styles.optionActive : ''}`}
                  onClick={() => saveThemePref('sepia')}
                >
                  Sepiya
                </button>
                <button
                  className={`${styles.themeOption} ${styles.themeOptionDark} ${theme === 'dark' ? styles.optionActive : ''}`}
                  onClick={() => saveThemePref('dark')}
                >
                  Qorong'u
                </button>
              </div>
            </div>

            <div className={styles.popoverSection}>
              <span className={styles.sectionLabel}>Shrift o'lchami ({fontSize}px)</span>
              <div className={styles.fontControls}>
                <button onClick={() => saveFontPref(Math.max(14, fontSize - 2))} disabled={fontSize <= 14}>A-</button>
                <button onClick={() => saveFontPref(Math.min(28, fontSize + 2))} disabled={fontSize >= 28}>A+</button>
              </div>
            </div>

            <div className={styles.popoverSection}>
              <span className={styles.sectionLabel}>Satrlar oralig'i</span>
              <div className={styles.lineHeightGrid}>
                <button
                  className={`${styles.lhOption} ${lineHeight === 'normal' ? styles.optionActive : ''}`}
                  onClick={() => setLineHeight('normal')}
                >
                  Zich
                </button>
                <button
                  className={`${styles.lhOption} ${lineHeight === 'relaxed' ? styles.optionActive : ''}`}
                  onClick={() => setLineHeight('relaxed')}
                >
                  O'rta
                </button>
                <button
                  className={`${styles.lhOption} ${lineHeight === 'loose' ? styles.optionActive : ''}`}
                  onClick={() => setLineHeight('loose')}
                >
                  Keng
                </button>
              </div>
            </div>

            {/* Script toggle */}
            <div className={styles.popoverSection}>
              <span className={styles.sectionLabel}>Yozuv turi</span>
              <div className={styles.lineHeightGrid}>
                <button
                  className={`${styles.lhOption} ${script === 'latin' ? styles.optionActive : ''}`}
                  onClick={() => { setScript('latin'); localStorage.setItem('reader_script', 'latin'); }}
                >
                  Lotin
                </button>
                <button
                  className={`${styles.lhOption} ${script === 'cyrillic' ? styles.optionActive : ''}`}
                  onClick={() => { setScript('cyrillic'); localStorage.setItem('reader_script', 'cyrillic'); }}
                >
                  Кирил
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Reading Progress Indicator */}
      <div className={styles.progressLine}>
        <div
          className={styles.progressBar}
          style={{ width: `${((currentChapter + 1) / totalChapters) * 100}%` }}
        />
      </div>

      {/* Main Text Content Area */}
      <main className={styles.mainContainer}>
        <article
          className={`${styles.readerBody} ${styles[`lh_${lineHeight}`]}`}
          style={{ fontSize: `${fontSize}px` }}
        >
          <span className={styles.chapterTag}>
            Bob {currentChapter + 1} / {totalChapters}
          </span>
          <h2 className={styles.chapterTitle}>{applyScript(chapters[currentChapter].title)}</h2>

          {applyScript(chapters[currentChapter].content).split('\n\n').map((para, i) => (
            <p key={i} className={styles.paragraph}>{para.split('\n').map((line, j) => (
              <span key={j}>{line}{j < para.split('\n').length - 1 && <br />}</span>
            ))}</p>
          ))}

          {/* Oxirgi bobda "Davomi tez orada" kartasi */}
          {currentChapter === totalChapters - 1 && (
            <div style={{
              marginTop: '3rem',
              padding: '2rem 1.5rem',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(79,142,247,0.12))',
              border: '1px solid rgba(139,92,246,0.3)',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Dekor doiralari */}
              <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(139,92,246,0.08)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: '-20px', left: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(79,142,247,0.08)', pointerEvents: 'none' }} />

              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✨</div>
              <h3 style={{
                fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem',
                background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                Bu qism shu yerda tugaydi
              </h3>
              <p style={{ fontSize: '0.95rem', opacity: 0.75, marginBottom: '0.4rem', lineHeight: 1.6 }}>
                <strong style={{ color: 'inherit' }}>{book?.title || 'Kitob'}</strong>ning keyingi qismi tayyorlanmoqda.
              </p>
              <p style={{ fontSize: '0.85rem', opacity: 0.55, marginBottom: '1.5rem' }}>
                Davomi tez orada chiqadi — kuzatib boring! 🔔
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => window.history.back()}
                  style={{
                    padding: '10px 20px', borderRadius: '10px', fontWeight: 600,
                    fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit',
                    background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.4)',
                    color: '#a78bfa'
                  }}
                >
                  ← Kitob sahifasiga qaytish
                </button>
              </div>
            </div>
          )}
        </article>

        {/* Footer Page / Chapter Navigation */}
        <section className={styles.navigation}>
          <button
            className={styles.navBtn}
            onClick={handlePrevChapter}
            disabled={currentChapter === 0}
          >
            <ChevronLeft size={20} />
            <span>Oldingi bob</span>
          </button>

          <span className={styles.navPageIndicator}>
            Bob {currentChapter + 1} of {totalChapters}
          </span>

          <button
            className={styles.navBtn}
            onClick={handleNextChapter}
            disabled={currentChapter === totalChapters - 1}
          >
            <span>Keyingi bob</span>
            <ChevronRight size={20} />
          </button>
        </section>
      </main>
    </div>
  );
}
