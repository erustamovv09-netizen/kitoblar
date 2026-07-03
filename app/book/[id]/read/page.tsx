"use client";

import React, { useEffect, useState, use } from 'react';
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
  Menu
} from 'lucide-react';
import booksDB from '../../../lib/books';
import { api } from '../../../lib/api';
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
  const book = booksDB.find(b => b.id === bookId);

  // Reader Customization State
  const [theme, setTheme] = useState<'light' | 'dark' | 'sepia'>('dark');
  const [fontSize, setFontSize] = useState<number>(18);
  const [lineHeight, setLineHeight] = useState<'normal' | 'relaxed' | 'loose'>('relaxed');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  // Content Navigation State
  const [currentChapter, setCurrentChapter] = useState(0);
  const [loading, setLoading] = useState(true);

  const chapters = bookChapters[bookId] || generateChapters(book?.title || 'Kitob');
  const totalChapters = chapters.length;

  // Load preferences and reading progress
  useEffect(() => {
    // Theme
    const savedReaderTheme = localStorage.getItem('reader_theme') as any;
    if (savedReaderTheme) setTheme(savedReaderTheme);

    // Font size
    const savedFontSize = localStorage.getItem('reader_font_size');
    if (savedFontSize) setFontSize(Number(savedFontSize));

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
  }, [bookId, chapters]);

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

  const handleNextChapter = () => {
    if (currentChapter < totalChapters - 1) {
      setCurrentChapter(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevChapter = () => {
    if (currentChapter > 0) {
      setCurrentChapter(prev => prev - 0 - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
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

  if (!book) {
    return (
      <div className={styles.errorContainer}>
        <h2>Kitob topilmadi</h2>
        <Link href="/" className={styles.errorBtn}>Bosh sahifaga qaytish</Link>
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
          <span className={styles.bookTitle}>{book.title}</span>
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
        <div className={styles.settingsPopover}>
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
        </div>
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
          <h2 className={styles.chapterTitle}>{chapters[currentChapter].title}</h2>
          
          {chapters[currentChapter].content.split('\n\n').map((para, i) => (
            <p key={i} className={styles.paragraph}>{para}</p>
          ))}
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
