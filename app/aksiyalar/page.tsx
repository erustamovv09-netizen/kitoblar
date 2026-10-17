"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Flame,
  Clock,
  Sparkles,
  Tag,
  Copy,
  Check,
  Percent,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Zap,
  Gift,
  Star
} from 'lucide-react';
import { api, Book } from '../lib/api';
import styles from './page.module.css';

interface PromoCode {
  code: string;
  discount: string;
  title: string;
  desc: string;
  tag: string;
}

const PROMO_CODES: PromoCode[] = [
  {
    code: 'KITOBLAR20',
    discount: '20%',
    title: 'Barcha elektron kitoblarga',
    desc: 'Har qanday janrdagi elektron kitoblar uchun cheklovsiz 20% chegirma',
    tag: 'Ommabop'
  },
  {
    code: 'MUTOLAA30',
    discount: '30%',
    title: 'Maxsus oylik aksiya',
    desc: '2 ta yoki undan ortiq kitob xarid qilganda butun savatchaga 30% chegirma',
    tag: 'Eng foydali'
  },
  {
    code: 'AUDIOBEPUL',
    discount: '100%',
    title: 'Bepul audio format',
    desc: 'Elektron kitob bilan birga uning to‘liq audio talqini mutlaqo bepul taqdim etiladi',
    tag: 'Sovg‘a'
  }
];

export default function AksiyalarPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  // Countdown timer state: 3 kunlik joriy aksiya
  const [timeLeft, setTimeLeft] = useState({
    days: 2,
    hours: 14,
    minutes: 38,
    seconds: 45
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getBooks();
        setBooks(data || []);
      } catch (err) {
        console.error("Aksiyalar kitoblarini yuklashda xatolik:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setToast(`Promokod nusxa olindi: ${code}`);
      setTimeout(() => {
        setCopiedCode(null);
        setToast('');
      }, 2500);
    } catch {
      setToast('Nusxa olishda xatolik');
      setTimeout(() => setToast(''), 2000);
    }
  };

  // Chegirmali narxni hisoblash yordamchisi
  const calculateSalePrice = (priceStr: string, discountPercent: number) => {
    const num = parseFloat(priceStr.replace(/[^\d.-]/g, '')) || 50000;
    const saleNum = Math.round(num * (1 - discountPercent / 100));
    return {
      original: `${Math.round(num).toLocaleString('uz-UZ')} so'm`,
      sale: `${saleNum.toLocaleString('uz-UZ')} so'm`
    };
  };

  return (
    <main className={styles.page}>
      {/* Toast */}
      {toast && (
        <div className={styles.toast}>
          <Check size={18} />
          <span>{toast}</span>
        </div>
      )}

      {/* Hero Section */}
      <section className={styles.hero}>
        <motion.div
          className={styles.heroContent}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className={styles.badge}>
            <Flame size={16} />
            Cheklangan vaqtdagi aksiyalar
          </div>
          <h1 className={styles.title}>
            Eng sara kitoblarga <br /> 40% gacha qaynoq chegirmalar!
          </h1>
          <p className={styles.subtitle}>
            Mutolaa zavqini his eting! Sevimli kitoblaringizni maxsus narxlarda xarid qiling yoki
            eksklyuziv promokodlardan foydalanib chegirmaga ega bo‘ling.
          </p>

          {/* Jonli Taymer */}
          <div className={styles.timerWrapper}>
            <div className={styles.timerLabel}>
              <Clock size={16} />
              Aksiya yakunlanishiga qoldi:
            </div>
            <div className={styles.timerGrid}>
              <div className={styles.timerBox}>
                <span className={styles.timerNum}>{String(timeLeft.days).padStart(2, '0')}</span>
                <span className={styles.timerUnit}>Kun</span>
              </div>
              <span className={styles.timerColon}>:</span>
              <div className={styles.timerBox}>
                <span className={styles.timerNum}>{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className={styles.timerUnit}>Soat</span>
              </div>
              <span className={styles.timerColon}>:</span>
              <div className={styles.timerBox}>
                <span className={styles.timerNum}>{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span className={styles.timerUnit}>Daqiqa</span>
              </div>
              <span className={styles.timerColon}>:</span>
              <div className={styles.timerBox}>
                <span className={styles.timerNum}>{String(timeLeft.seconds).padStart(2, '0')}</span>
                <span className={styles.timerUnit}>Soniya</span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <div className={styles.container}>
        {/* Promokodlar Bo'limi */}
        <section>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionBadge}>Kuponlar & Bonuslar</span>
            <h2 className={styles.sectionTitle}>Aktiv promokodlar</h2>
            <p className={styles.sectionSubtitle}>Promokoddan nusxa oling va to‘lov paytida kiritib chegirmaga ega bo‘ling</p>
          </div>

          <div className={styles.promoGrid}>
            {PROMO_CODES.map((promo, idx) => (
              <motion.div
                key={promo.code}
                className={styles.promoCard}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
              >
                <div>
                  <div className={styles.promoCardTop}>
                    <span className={styles.promoDiscount}>-{promo.discount}</span>
                    <span className={styles.promoTag}>{promo.tag}</span>
                  </div>
                  <h3 className={styles.promoTitle}>{promo.title}</h3>
                  <p className={styles.promoDesc}>{promo.desc}</p>
                </div>

                <div className={styles.codeBox}>
                  <span className={styles.codeText}>{promo.code}</span>
                  <button
                    className={styles.copyBtn}
                    onClick={() => handleCopyCode(promo.code)}
                    aria-label="Kodni nusxalash"
                  >
                    {copiedCode === promo.code ? (
                      <>
                        <Check size={14} /> Nusxalandi
                      </>
                    ) : (
                      <>
                        <Copy size={14} /> Nusxa olish
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Aksiyadagi Kitoblar Katalogi */}
        <section>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionBadge}>Maxsus Narxlar</span>
            <h2 className={styles.sectionTitle}>Aksiya doirasidagi kitoblar</h2>
            <p className={styles.sectionSubtitle}>Hozirgi vaqtda eng katta chegirmaga ega sara asarlar</p>
          </div>

          {loading ? (
            <div className={styles.booksGrid}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={styles.bookCard} style={{ minHeight: '380px' }}>
                  <div className="skeleton" style={{ width: '100%', height: '240px' }} />
                  <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className="skeleton" style={{ height: '14px', width: '40%', borderRadius: '6px' }} />
                    <div className="skeleton" style={{ height: '20px', width: '85%', borderRadius: '6px' }} />
                    <div className="skeleton" style={{ height: '14px', width: '60%', borderRadius: '6px' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.booksGrid}>
              {books.map((book, index) => {
                // Har bir kitobga 20% dan 35% gacha chegirma beramiz
                const discounts = [30, 25, 35, 20, 25, 30];
                const disc = discounts[index % discounts.length];
                const priceObj = calculateSalePrice(book.price || '50000', disc);

                return (
                  <motion.div
                    key={book.id}
                    className={styles.bookCard}
                    initial={{ opacity: 0, y: 25 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: (index % 4) * 0.1 }}
                  >
                    <div className={styles.discountRibbon}>
                      <Percent size={13} />
                      -{disc}% AKSIYA
                    </div>

                    <Link href={`/book/${book.id}`} className={styles.imageWrapper}>
                      <Image
                        src={book.image}
                        alt={book.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 300px"
                        className={styles.bookImg}
                        unoptimized
                      />
                    </Link>

                    <div className={styles.bookBody}>
                      <div>
                        <div className={styles.bookMeta}>
                          <span className={styles.bookCategory}>{book.category || 'Adabiyot'}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#f59e0b', fontWeight: 600 }}>
                            <Star size={13} fill="#f59e0b" color="#f59e0b" />
                            {book.rating || 5}
                          </span>
                        </div>
                        <Link href={`/book/${book.id}`} style={{ textDecoration: 'none' }}>
                          <h3 className={styles.bookTitle}>{book.title}</h3>
                        </Link>
                        <p className={styles.bookAuthor}>{book.author}</p>
                      </div>

                      <div>
                        <div className={styles.priceRow}>
                          <span className={styles.salePrice}>{priceObj.sale}</span>
                          <span className={styles.oldPrice}>{priceObj.original}</span>
                        </div>
                        <Link href={`/book/${book.id}`} className={styles.cardBtn}>
                          <BookOpen size={16} /> Batafsil & Xarid
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        {/* Maxsus To'plamlar (Bundles) */}
        <section>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionBadge}>Katta Tejash</span>
            <h2 className={styles.sectionTitle}>Maxsus kombinatsiya to‘plamlari</h2>
            <p className={styles.sectionSubtitle}>Bir nechta kitoblarni birgalikda oling va 40% gacha tejang</p>
          </div>

          <div className={styles.bundleGrid}>
            <motion.div
              className={styles.bundleCard}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
            >
              <div>
                <span className={styles.promoTag} style={{ marginBottom: '10px', display: 'inline-block' }}>Top Tanlov</span>
                <h3 className={styles.bundleTitle}>Shaxsiy rivojlanish va Psixologiya</h3>
                <p className={styles.promoDesc}>Muvaffaqiyat, fikrlash va ichki xotirjamlik haqidagi 3 ta eng kuchli kitoblar to‘plami</p>

                <ul className={styles.bundleFeatures}>
                  <li className={styles.bundleFeature}>
                    <Check size={16} color="#10b981" /> &quot;Seniki bo‘lgan seni topadi&quot;
                  </li>
                  <li className={styles.bundleFeature}>
                    <Check size={16} color="#10b981" /> &quot;Ko‘zlaringni haromdan saqla&quot;
                  </li>
                  <li className={styles.bundleFeature}>
                    <Check size={16} color="#10b981" /> &quot;Arosat&quot; (Psixologik asar)
                  </li>
                  <li className={styles.bundleFeature}>
                    <Check size={16} color="#10b981" /> Barcha kitoblarga audio format bepul
                  </li>
                </ul>
              </div>

              <div>
                <div className={styles.bundlePriceBox}>
                  <span className={styles.bundleSalePrice}>99 000 so&apos;m</span>
                  <span className={styles.bundleOldPrice}>165 000 so&apos;m</span>
                </div>
                <Link href="/search" className={styles.cardBtn} style={{ background: '#f59e0b', color: '#000' }}>
                  <Zap size={16} /> To‘plamni olish (-40%)
                </Link>
              </div>
            </motion.div>

            <motion.div
              className={styles.bundleCard}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.15 }}
            >
              <div>
                <span className={styles.promoTag} style={{ marginBottom: '10px', display: 'inline-block', background: 'rgba(79, 142, 247, 0.15)', color: '#4f8ef7' }}>Badiiy Meros</span>
                <h3 className={styles.bundleTitle}>Badiiy asarlar durdonalari</h3>
                <p className={styles.promoDesc}>O‘zbek va jahon badiiy adabiyotining eng yuksak tuyg‘ularga boy asarlari to‘plami</p>

                <ul className={styles.bundleFeatures}>
                  <li className={styles.bundleFeature}>
                    <Check size={16} color="#4f8ef7" /> &quot;Odam bo‘lish qiyin&quot;
                  </li>
                  <li className={styles.bundleFeature}>
                    <Check size={16} color="#4f8ef7" /> &quot;Binafsha shu‘lasi&quot; (2-qism)
                  </li>
                  <li className={styles.bundleFeature}>
                    <Check size={16} color="#4f8ef7" /> Yuqori sifatli matn va qulay o‘quvchi
                  </li>
                  <li className={styles.bundleFeature}>
                    <Check size={16} color="#4f8ef7" /> Cheksiz umrbod mutolaa imkoniyati
                  </li>
                </ul>
              </div>

              <div>
                <div className={styles.bundlePriceBox}>
                  <span className={styles.bundleSalePrice}>75 000 so&apos;m</span>
                  <span className={styles.bundleOldPrice}>120 000 so&apos;m</span>
                </div>
                <Link href="/search" className={styles.cardBtn}>
                  <Gift size={16} /> To‘plamni olish (-35%)
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Afzalliklar va Kafolatlar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.5rem',
          marginTop: '4rem',
          padding: '2rem',
          borderRadius: '20px',
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          textAlign: 'center'
        }}>
          <div>
            <ShieldCheck size={32} color="#10b981" style={{ margin: '0 auto 10px' }} />
            <h4 style={{ margin: '0 0 6px', fontWeight: 700 }}>100% Kafolatlangan sifat</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Barcha asarlar to‘liq va sifatli tahrirdan o‘tgan</p>
          </div>
          <div>
            <Zap size={32} color="#f59e0b" style={{ margin: '0 auto 10px' }} />
            <h4 style={{ margin: '0 0 6px', fontWeight: 700 }}>Tezkor dostup</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Xarid qilgan zahotingiz darhol mutolaani boshlaysiz</p>
          </div>
          <div>
            <Gift size={32} color="#9b6dff" style={{ margin: '0 auto 10px' }} />
            <h4 style={{ margin: '0 0 6px', fontWeight: 700 }}>Doimiy yangi aksiyalar</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Har haftada yangi kitoblarga maxsus chegirmalar</p>
          </div>
        </div>
      </div>
    </main>
  );
}
