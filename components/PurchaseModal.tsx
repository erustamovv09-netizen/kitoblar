"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  CheckCircle2,
  ShieldCheck,
  Zap,
  CreditCard,
  Smartphone,
  BookOpen,
  ArrowRight,
  Sparkles,
  Headphones,
  Copy,
  Check,
  Clock,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { restoreUserSession } from '@/app/lib/session';
import { formatUzbekDateTime } from '@/app/lib/date';
import styles from './PurchaseModal.module.css';

export interface PurchaseModalBook {
  id: string | number;
  title: string;
  author: string;
  image?: string;
  cover_image?: string;
  category?: string;
  price: string | number;
  salePrice?: number | string | null;
  sale_price?: number | string | null;
  discountPercent?: number;
  price_electronic?: number | null;
  price_paper?: number | null;
  priceElectronic?: string;
  pricePaper?: string;
  hasAudio?: boolean;
  has_audio?: boolean;
}

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: PurchaseModalBook | null;
  initialFormat?: 'electronic' | 'paper';
  onSuccess?: (bookId: string | number, format?: 'electronic' | 'paper') => void;
}

type PaymentMethod = 'card' | 'payme' | 'click' | 'uzum';

const PAYMENT_CONFIGS: Record<PaymentMethod, {
  name: string;
  sub: string;
  badge: string;
  badgeBg: string;
  badgeColor: string;
  brand: string;
  themeColor: string;
  gradient: string;
  glowColor: string;
  tagline: string;
  appUrl?: string;
  appButtonText?: string;
  instructions: {
    step1: string;
    step2: string;
    step3: string;
  };
}> = {
  card: {
    name: 'Bank kartasi',
    sub: 'Uzcard / Humo / Visa',
    badge: '💳',
    badgeBg: 'rgba(16, 185, 129, 0.15)',
    badgeColor: '#10b981',
    brand: 'BANK KARTASI (UZCARD / HUMO / VISA)',
    themeColor: '#10b981',
    gradient: 'linear-gradient(135deg, #052e23 0%, #0d4636 50%, #031b14 100%)',
    glowColor: 'rgba(16, 185, 129, 0.35)',
    tagline: 'Istalgan mobil banking ilovangiz orqali o\'tkazing',
    instructions: {
      step1: 'Karta raqamidan "Nusxa olish" tugmasi orqali nusxalang.',
      step2: 'Mobil banking ilovangizda (Anorbank, TBC, Ipak Yo‘li, Kapitalbank va h.k.) summani o‘tkazing.',
      step3: 'O‘tkazma qilgan kartangizning oxirgi 4 ta raqamini va to‘lov chekini quyida kiriting.',
    }
  },
  payme: {
    name: 'Payme',
    sub: 'Payme orqali to‘lov',
    badge: 'P',
    badgeBg: 'rgba(0, 204, 204, 0.15)',
    badgeColor: '#00cccc',
    brand: 'PAYME ORQALI TO‘LOV',
    themeColor: '#00cccc',
    gradient: 'linear-gradient(135deg, #05262e 0%, #0c3e4a 50%, #02161b 100%)',
    glowColor: 'rgba(0, 204, 204, 0.35)',
    tagline: 'Payme ilovasiga o\'tib, kartaga tezkor o\'tkazing',
    appUrl: 'https://payme.uz/',
    appButtonText: 'Payme ilovasini ochish',
    instructions: {
      step1: 'Karta raqamini nusxalang yoki to‘g‘ridan-to‘g‘ri "Payme ilovasini ochish" tugmasini bosing.',
      step2: 'Payme ilovangizda "O‘tkazmalar" bo‘limiga o‘tib, ko‘rsatilgan summani yuboring.',
      step3: 'O‘tkazma qilgan kartangizning oxirgi 4 ta raqamini va to‘lov chekini quyida kiriting.',
    }
  },
  click: {
    name: 'Click',
    sub: 'Click Up orqali to‘lov',
    badge: 'C',
    badgeBg: 'rgba(0, 115, 255, 0.15)',
    badgeColor: '#0073ff',
    brand: 'CLICK ORQALI TO‘LOV',
    themeColor: '#0073ff',
    gradient: 'linear-gradient(135deg, #081e3a 0%, #0c3162 50%, #041021 100%)',
    glowColor: 'rgba(0, 115, 255, 0.35)',
    tagline: 'Click ilovasiga o\'tib, kartaga bir zumda yuboring',
    appUrl: 'https://my.click.uz/',
    appButtonText: 'Click ilovasini ochish',
    instructions: {
      step1: 'Karta raqamini nusxalang yoki to‘g‘ridan-to‘g‘ri "Click ilovasini ochish" tugmasini bosing.',
      step2: 'Click ilovangizda "Kartaga o‘tkazish" bo‘limiga kirib ko‘rsatilgan summani yuboring.',
      step3: 'O‘tkazma qilgan kartangizning oxirgi 4 ta raqamini va to‘lov chekini quyida kiriting.',
    }
  },
  uzum: {
    name: 'Uzum Pay',
    sub: 'Uzum Bank orqali to‘lov',
    badge: 'U',
    badgeBg: 'rgba(168, 85, 247, 0.15)',
    badgeColor: '#a855f7',
    brand: 'UZUM BANK / UZUM PAY',
    themeColor: '#a855f7',
    gradient: 'linear-gradient(135deg, #24083a 0%, #441170 50%, #120320 100%)',
    glowColor: 'rgba(168, 85, 247, 0.35)',
    tagline: 'Uzum Bank ilovasidan 0% komissiya bilan to\'lang',
    appUrl: 'https://uzumbank.uz/',
    appButtonText: 'Uzum Bank ilovasini ochish',
    instructions: {
      step1: 'Uzum Bank karta raqamidan "Nusxa olish" tugmasi orqali nusxa oling.',
      step2: 'Uzum Bank ilovangizda "O‘tkazmalar" bo‘limidan 0% komissiya bilan summani o‘tkazing.',
      step3: 'O‘tkazma qilgan kartangizning oxirgi 4 ta raqamini va to‘lov chekini quyida kiriting.',
    }
  }
};

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop';

function parseNumericPrice(val: string | number | null | undefined): number {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  return Number(String(val).replace(/[^\d]/g, '')) || 0;
}

export default function PurchaseModal({ isOpen, onClose, book, initialFormat = 'electronic', onSuccess }: PurchaseModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<'electronic' | 'paper'>(initialFormat);
  const [region, setRegion] = useState('Toshkent shahri');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [userName, setUserName] = useState('');
  const [phone, setPhone] = useState('+998 ');
  const [senderCardLast4, setSenderCardLast4] = useState('');
  const [receiptImage, setReceiptImage] = useState('');
  const [receiptPreview, setReceiptPreview] = useState('');
  const [paymentComment, setPaymentComment] = useState('');
  const [copiedCard, setCopiedCard] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState('');
  const [error, setError] = useState('');

  const ADMIN_CARD_NUMBER = process.env.NEXT_PUBLIC_PAYMENT_CARD_NUMBER || '8600 0000 0000 0000';
  const ADMIN_CARD_HOLDER = process.env.NEXT_PUBLIC_PAYMENT_CARD_HOLDER || 'ELSHOD RUSTAMOV';
  const ADMIN_CARD_BANK = process.env.NEXT_PUBLIC_PAYMENT_BANK || 'Uzum Bank';

  // Sync format if initialFormat changes
  useEffect(() => {
    if (initialFormat) {
      setSelectedFormat(initialFormat);
    }
  }, [initialFormat]);

  // Prefill user name and phone if available in session/storage
  useEffect(() => {
    if (isOpen) {
      try {
        const session = restoreUserSession();
        const savedName = session?.name || localStorage.getItem('name') || session?.username || localStorage.getItem('username') || '';
        const savedPhone = localStorage.getItem('user_phone') || '+998 ';
        setUserName(savedName);
        setPhone(savedPhone.length > 5 ? savedPhone : '+998 ');
      } catch {}
      setIsSuccess(false);
      setError('');
      setLoading(false);
      setCopiedCard(false);
      setPaymentComment('');
      setSenderCardLast4('');
      setReceiptImage('');
      setReceiptPreview('');
    }
  }, [isOpen, book]);

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setError("Rasm hajmi juda katta (maksimal 8 MB)");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = reader.result as string;
      setReceiptImage(res);
      setReceiptPreview(res);
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen || !book) return null;

  const basePriceNum = parseNumericPrice(book.price) || 50000;
  const rawElectronic = book.price_electronic != null
    ? Number(book.price_electronic)
    : (book.priceElectronic ? parseNumericPrice(book.priceElectronic) : Math.max(10000, Math.round((basePriceNum * 0.5) / 1000) * 1000));
  const rawPaper = book.price_paper != null
    ? Number(book.price_paper)
    : (book.pricePaper ? parseNumericPrice(book.pricePaper) : Math.max(rawElectronic, basePriceNum > 0 ? basePriceNum : 60000));

  const salePriceNum = parseNumericPrice(book.salePrice || book.sale_price);
  const electronicPrice = (salePriceNum > 0 && salePriceNum < rawElectronic) ? salePriceNum : rawElectronic;
  const paperPrice = rawPaper;

  const currentPriceNum = selectedFormat === 'electronic' ? electronicPrice : paperPrice;
  const currentOriginalNum = selectedFormat === 'electronic' ? rawElectronic : rawPaper;
  const hasDiscount = selectedFormat === 'electronic' && salePriceNum > 0 && salePriceNum < rawElectronic;
  const calculatedPercent = hasDiscount
    ? Math.round((1 - salePriceNum / rawElectronic) * 100)
    : 0;
  const savings = Math.max(0, currentOriginalNum - currentPriceNum);

  // Phone input formatting helper - auto handles digits typed with or without +998
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    let digits = raw.replace(/\D/g, '');
    if (digits.startsWith('998')) {
      digits = digits.slice(3);
    }
    digits = digits.slice(0, 9);
    if (!digits) {
      setPhone('+998 ');
      return;
    }
    let formatted = '+998 ';
    if (digits.length > 0) formatted += digits.slice(0, 2);
    if (digits.length > 2) formatted += ' ' + digits.slice(2, 5);
    if (digits.length > 5) formatted += ' ' + digits.slice(5, 7);
    if (digits.length > 7) formatted += ' ' + digits.slice(7, 9);
    setPhone(formatted);
  };

  const handleCopyCard = () => {
    const rawDigits = ADMIN_CARD_NUMBER.replace(/\s+/g, '');
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(rawDigits);
    }
    setCopiedCard(true);
    setTimeout(() => setCopiedCard(false), 2500);
  };

  const handleConfirmPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanPhone = phone.replace(/[^\d]/g, '');
    if (cleanPhone.length < 9) {
      setError("Iltimos, to'liq telefon raqamingizni kiriting (+998 ...)");
      return;
    }

    if (!userName.trim()) {
      setError("Iltimos, ism-sharifingizni kiriting");
      return;
    }

    const cleanCardLast4 = senderCardLast4.replace(/\D/g, '').slice(0, 4);
    if (cleanCardLast4.length !== 4) {
      setError("Iltimos, o'tkazma qilgan kartangizning oxirgi 4 ta raqamini kiriting (masalan: 4421)");
      return;
    }

    if (selectedFormat === 'paper' && !address.trim()) {
      setError("Iltimos, yetkazib berish manzilini to'liq kiriting");
      return;
    }

    setLoading(true);

    try {
      const receipt = `AKS-${Math.floor(100000 + Math.random() * 900000)}`;
      setReceiptNumber(receipt);

      // Save user phone & address for future
      localStorage.setItem('user_phone', phone);
      if (address.trim()) {
        localStorage.setItem('user_address', `${region}, ${address.trim()}`);
      }

      // 1. Save to pending_orders in localStorage (DO NOT grant free access yet!)
      const rawPending = localStorage.getItem('pending_orders');
      const pendingList: any[] = rawPending ? JSON.parse(rawPending) : [];
      const pendingRecord = {
        id: `ord_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        bookId: String(book.id),
        bookTitle: book.title,
        bookAuthor: book.author,
        receiptNumber: receipt,
        format: selectedFormat,
        price: currentPriceNum,
        image: book.image || book.cover_image || FALLBACK_IMAGE,
        date: new Date().toISOString(),
        paymentMethod,
        senderCardLast4: cleanCardLast4,
        status: 'pending',
      };
      const filteredPending = pendingList.filter((p: any) => String(p.bookId) !== String(book.id));
      filteredPending.unshift(pendingRecord);
      localStorage.setItem('pending_orders', JSON.stringify(filteredPending));

      // 2. Activity Log: "To'lov tekshiruvga yuborildi"
      const rawLogs = localStorage.getItem('activity_log');
      const logs = rawLogs ? JSON.parse(rawLogs) : [];
      logs.unshift({
        id: Date.now().toString(),
        text: `"${book.title}" uchun to'lov (${currentPriceNum.toLocaleString('uz-UZ')} so'm) tekshiruvga yuborildi`,
        time: "Hozirgina",
        type: 'purchase'
      });
      localStorage.setItem('activity_log', JSON.stringify(logs.slice(0, 30)));

      // 3. Send order to server /api/orders (status: 'pending', triggers Telegram alert to Admin)
      const userSessionEmail = localStorage.getItem('email') || '';
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiptNumber: receipt,
          bookId: String(book.id),
          bookTitle: book.title,
          bookAuthor: book.author,
          bookImage: book.image || book.cover_image || FALLBACK_IMAGE,
          format: selectedFormat,
          formatLabel: selectedFormat === 'electronic' ? "Elektron kitob" : "Qog'oz format (Bosma kitob)",
          purpose: selectedFormat === 'electronic'
            ? "Saytda to'liq mutolaa qilish va audioni eshitish huquqi (Cheksiz kirish)"
            : "Bosma kitobni manzilga yetkazib berish (Kuryer xizmati)",
          price: currentPriceNum,
          originalPrice: currentOriginalNum,
          paymentMethod,
          userName: userName.trim() || 'Foydalanuvchi',
          userEmail: userSessionEmail,
          userPhone: phone.trim(),
          senderCardLast4: cleanCardLast4,
          receiptImage: receiptImage || undefined,
          deliveryAddress: selectedFormat === 'paper' ? `${region}, ${address.trim()}` : null,
          region: selectedFormat === 'paper' ? region : null,
          status: 'pending',
          statusLabel: "To'lov kutilmoqda (Tekshirilmoqda)",
          createdAt: new Date().toISOString(),
          notes: paymentComment.trim()
            ? `Xaridor izohi: ${paymentComment.trim()}`
            : `Xaridor to'lov qildi (Karta: *${cleanCardLast4}). Telegram orqali tasdiqlash kutilmoqda.`,
        }),
      });

      // Dispatch event so UI knows a purchase order was submitted
      window.dispatchEvent(new CustomEvent('order-submitted', { detail: { bookId: String(book.id) } }));

      if (onSuccess) {
        onSuccess(book.id, selectedFormat);
      }

      setIsSuccess(true);
    } catch (err) {
      console.error("Xaridni yuborishda xatolik:", err);
      setError("Buyurtmani yuborishda xatolik yuz berdi, iltimos qaytadan urinib ko'ring");
    } finally {
      setLoading(false);
    }
  };

  const coverSrc = book.image || book.cover_image || FALLBACK_IMAGE;

  return (
    <AnimatePresence>
      <div className={styles.overlay} onClick={onClose}>
        <motion.div
          className={styles.modal}
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {/* Header */}
          <div className={styles.modalHeader}>
            <div className={styles.headerLeft}>
              <h3 className={styles.headerTitle}>
                {isSuccess
                  ? (selectedFormat === 'electronic' ? "Elektron kitob xaridi" : "Qog'oz kitob buyurtmasi")
                  : "Kitob xaridi"}
              </h3>
              {calculatedPercent > 0 && !isSuccess && (
                <span className={styles.discountBadge}>
                  <Sparkles size={12} /> -{calculatedPercent}% CHEGIRMA
                </span>
              )}
            </div>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Yopish">
              <X size={18} />
            </button>
          </div>

          {/* Success / Pending Verification Screen */}
          {isSuccess ? (
            <div className={styles.successView}>
              <div className={styles.successIconBadge} style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                <Clock size={42} />
              </div>
              <div>
                <h4 className={styles.successTitle}>To&apos;lovingiz qabul qilindi!</h4>
                <p className={styles.successSubtitle}>
                  <strong>&ldquo;{book.title}&rdquo;</strong> kitobi uchun to&apos;lovingiz tekshiruvga yuborildi.
                  Admin to&apos;lovni tasdiqlashi bilan (Telegram orqali tezkor tekshiriladi) kitobingiz to&apos;liq ochiladi.
                </p>
              </div>

              {/* Receipt */}
              <div className={styles.receiptCard}>
                <div className={styles.receiptRow}>
                  <span className={styles.receiptLabel}>Chek raqami:</span>
                  <span className={styles.receiptValue}>#{receiptNumber}</span>
                </div>
                <div className={styles.receiptRow}>
                  <span className={styles.receiptLabel}>Holati:</span>
                  <span className={styles.receiptValue} style={{ color: '#f59e0b', fontWeight: 800 }}>
                    ⏳ To&apos;lov tekshirilmoqda
                  </span>
                </div>
                {senderCardLast4 && (
                  <div className={styles.receiptRow}>
                    <span className={styles.receiptLabel}>O&apos;tkazma kartasi:</span>
                    <span className={styles.receiptValue} style={{ fontWeight: 700 }}>
                      *{senderCardLast4}
                    </span>
                  </div>
                )}
                <div className={styles.receiptRow}>
                  <span className={styles.receiptLabel}>Kitob formati:</span>
                  <span className={styles.receiptValue} style={{ color: 'var(--accent-blue, #4f8ef7)' }}>
                    {selectedFormat === 'electronic'
                      ? (book.hasAudio ? '📱 Elektron (Mutolaa + Audio kitob)' : '📱 Elektron (Onlayn mutolaa)')
                      : '📖 Qog\'oz (Bosma kitob)'}
                  </span>
                </div>
                {selectedFormat === 'paper' && address.trim() && (
                  <div className={styles.receiptRow}>
                    <span className={styles.receiptLabel}>Yetkazish manzili:</span>
                    <span className={styles.receiptValue} style={{ fontSize: '0.85rem' }}>
                      {region}, {address}
                    </span>
                  </div>
                )}
                <div className={styles.receiptRow}>
                  <span className={styles.receiptLabel}>To&apos;langan summa:</span>
                  <span className={styles.receiptValue} style={{ color: '#10b981', fontWeight: 800 }}>
                    {currentPriceNum.toLocaleString('uz-UZ')} so&apos;m
                  </span>
                </div>
                <div className={styles.receiptRow}>
                  <span className={styles.receiptLabel}>To&apos;lov usuli:</span>
                  <span className={styles.receiptValue} style={{ textTransform: 'uppercase' }}>
                    {paymentMethod === 'card' ? 'Bank kartasi' : paymentMethod}
                  </span>
                </div>
                <div className={styles.receiptRow}>
                  <span className={styles.receiptLabel}>Sana va vaqt:</span>
                  <span className={styles.receiptValue}>
                    {formatUzbekDateTime()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className={styles.successButtons}>
                <button type="button" className={styles.readNowBtn} onClick={onClose}>
                  <CheckCircle2 size={16} /> Tushundim
                </button>
                <Link href="/account" className={styles.closeSuccessBtn} onClick={onClose} style={{ textAlign: 'center', textDecoration: 'none' }}>
                  Buyurtmalarimga o&apos;tish
                </Link>
              </div>
            </div>
          ) : (
            /* Checkout Form */
            <form onSubmit={handleConfirmPurchase} className={styles.modalBody}>
              {/* Book Summary Card */}
              <div className={styles.bookPreview}>
                <div className={styles.bookCoverWrapper}>
                  <Image
                    src={coverSrc}
                    alt={book.title}
                    fill
                    sizes="60px"
                    className={styles.bookCoverImg}
                    unoptimized
                  />
                </div>
                <div className={styles.bookInfo}>
                  <span className={styles.bookCategory}>{book.category || 'Aksiya'}</span>
                  <h4 className={styles.bookTitle} title={book.title}>{book.title}</h4>
                  <p className={styles.bookAuthor}>{book.author}</p>
                </div>
              </div>

              {/* Format Selector Toggle */}
              <div>
                <div className={styles.sectionTitle}>Kitob formatini tanlang</div>
                <div className={styles.formatToggle}>
                  <button
                    type="button"
                    className={`${styles.formatOption} ${selectedFormat === 'electronic' ? styles.formatOptionActive : ''}`}
                    onClick={() => setSelectedFormat('electronic')}
                  >
                    <div className={styles.formatIcon}>
                      <Smartphone size={18} />
                    </div>
                    <div className={styles.formatDetails}>
                      <span className={styles.formatName}>
                        Elektron kitob {book.hasAudio && <span style={{ fontSize: '0.72rem', color: '#a855f7' }}>+ Audio</span>}
                      </span>
                      <span className={styles.formatDesc}>Saytda cheksiz mutolaa</span>
                    </div>
                    <span className={styles.formatPrice}>
                      {electronicPrice.toLocaleString('uz-UZ')} so&apos;m
                    </span>
                  </button>

                  <button
                    type="button"
                    className={`${styles.formatOption} ${selectedFormat === 'paper' ? styles.formatOptionActive : ''}`}
                    onClick={() => setSelectedFormat('paper')}
                  >
                    <div className={styles.formatIcon}>
                      <BookOpen size={18} />
                    </div>
                    <div className={styles.formatDetails}>
                      <span className={styles.formatName}>Qog&apos;oz kitob</span>
                      <span className={styles.formatDesc}>Kuryer orqali yetkazish</span>
                    </div>
                    <span className={styles.formatPrice}>
                      {paperPrice.toLocaleString('uz-UZ')} so&apos;m
                    </span>
                  </button>
                </div>
              </div>

              {/* Delivery info (if paper format) */}
              {selectedFormat === 'paper' && (
                <div className={styles.paperDeliverySection}>
                  <div className={styles.inputField}>
                    <label className={styles.inputLabel}>Viloyat / Shahar</label>
                    <select
                      className={styles.inputControl}
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                    >
                      <option value="Toshkent shahri">Toshkent shahri</option>
                      <option value="Toshkent viloyati">Toshkent viloyati</option>
                      <option value="Samarqand">Samarqand viloyati</option>
                      <option value="Buxoro">Buxoro viloyati</option>
                      <option value="Farg'ona">Farg&apos;ona viloyati</option>
                      <option value="Andijon">Andijon viloyati</option>
                      <option value="Namangan">Namangan viloyati</option>
                      <option value="Qashqadaryo">Qashqadaryo viloyati</option>
                      <option value="Surxondaryo">Surxondaryo viloyati</option>
                      <option value="Xorazm">Xorazm viloyati</option>
                      <option value="Navoiy">Navoiy viloyati</option>
                      <option value="Jizzax">Jizzax viloyati</option>
                      <option value="Sirdaryo">Sirdaryo viloyati</option>
                      <option value="Qoraqalpog'iston">Qoraqalpog&apos;iston Respublikasi</option>
                    </select>
                  </div>

                  <div className={styles.inputField}>
                    <label className={styles.inputLabel}>Yetkazib berish manzili</label>
                    <input
                      type="text"
                      required={selectedFormat === 'paper'}
                      className={styles.inputControl}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Tuman, ko'cha, uy/xonadon raqami"
                    />
                  </div>
                </div>
              )}

              {/* Price Calculation Summary */}
              <div className={styles.priceSummary}>
                <div className={styles.priceDetailRow}>
                  <span>Asl narxi:</span>
                  <span className={hasDiscount ? styles.originalPriceStriked : ''}>
                    {currentOriginalNum.toLocaleString('uz-UZ')} so&apos;m
                  </span>
                </div>
                {hasDiscount && (
                  <div className={styles.priceDetailRow}>
                    <span>Chegirma:</span>
                    <span className={styles.savingsTag}>
                      <Zap size={13} /> -{calculatedPercent}% ({savings.toLocaleString('uz-UZ')} so&apos;m tejaladi)
                    </span>
                  </div>
                )}
                <div className={styles.finalPriceRow}>
                  <span className={styles.finalPriceLabel}>To&apos;lov summasi:</span>
                  <span className={styles.finalPriceValue}>
                    {currentPriceNum.toLocaleString('uz-UZ')} so&apos;m
                  </span>
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <div className={styles.sectionTitle}>To&apos;lov tizimini tanlang</div>
                <div className={styles.paymentGrid}>
                  {(Object.keys(PAYMENT_CONFIGS) as PaymentMethod[]).map((key) => {
                    const cfg = PAYMENT_CONFIGS[key];
                    const isActive = paymentMethod === key;
                    return (
                      <div
                        key={key}
                        className={`${styles.paymentCard} ${isActive ? styles.paymentCardActive : ''}`}
                        onClick={() => setPaymentMethod(key)}
                        style={isActive ? {
                          borderColor: cfg.themeColor,
                          background: `${cfg.themeColor}18`,
                          boxShadow: `0 0 0 1px ${cfg.themeColor}, 0 4px 12px ${cfg.glowColor}`
                        } : undefined}
                      >
                        <div
                          className={styles.paymentIconBadge}
                          style={{ background: cfg.badgeBg, color: cfg.badgeColor }}
                        >
                          {key === 'card' ? <CreditCard size={16} /> : cfg.badge}
                        </div>
                        <div className={styles.paymentInfo}>
                          <span className={styles.paymentName} style={isActive ? { color: cfg.themeColor } : undefined}>
                            {cfg.name}
                          </span>
                          <span className={styles.paymentSub}>{cfg.sub}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Payment Card Widget */}
              {(() => {
                const cfg = PAYMENT_CONFIGS[paymentMethod] || PAYMENT_CONFIGS.card;
                return (
                  <>
                    <div
                      className={styles.bankCardWidget}
                      style={{
                        background: cfg.gradient,
                        borderColor: `${cfg.themeColor}55`,
                        boxShadow: `0 14px 30px -6px ${cfg.glowColor}, 0 0 0 1px ${cfg.themeColor}33`,
                      }}
                    >
                      <div className={styles.bankCardTop}>
                        <div className={styles.bankCardChip} />
                        <span
                          className={styles.bankCardBrand}
                          style={{ color: cfg.themeColor, fontWeight: 900, letterSpacing: '0.5px' }}
                        >
                          {cfg.brand}
                        </span>
                      </div>

                      <div className={styles.bankCardNumberRow}>
                        <span className={styles.bankCardNumber}>{ADMIN_CARD_NUMBER}</span>
                        <button
                          type="button"
                          className={`${styles.copyCardBtn} ${copiedCard ? styles.copyCardBtnCopied : ''}`}
                          onClick={handleCopyCard}
                          style={{
                            background: copiedCard ? 'rgba(16, 185, 129, 0.25)' : `${cfg.themeColor}25`,
                            borderColor: copiedCard ? 'rgba(16, 185, 129, 0.5)' : `${cfg.themeColor}66`,
                            color: copiedCard ? '#34d399' : cfg.themeColor,
                          }}
                        >
                          {copiedCard ? (
                            <>
                              <Check size={14} /> Nusxa olindi
                            </>
                          ) : (
                            <>
                              <Copy size={14} /> Nusxa olish
                            </>
                          )}
                        </button>
                      </div>

                      <div className={styles.bankCardBottom}>
                        <div>
                          <span style={{ fontSize: '0.68rem', display: 'block', opacity: 0.7 }}>KARTA EGASI</span>
                          <span className={styles.bankCardHolder}>{ADMIN_CARD_HOLDER}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.68rem', display: 'block', opacity: 0.7 }}>O&apos;TKAZILADIGAN SUMMA</span>
                          <span style={{ fontSize: '1.08rem', fontWeight: 800, color: '#34d399' }}>
                            {currentPriceNum.toLocaleString('uz-UZ')} so&apos;m
                          </span>
                        </div>
                      </div>

                      {/* Quick link button to open the specific payment app */}
                      {cfg.appUrl && (
                        <div style={{
                          marginTop: '12px',
                          paddingTop: '10px',
                          borderTop: '1px solid rgba(255, 255, 255, 0.12)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '10px',
                          flexWrap: 'wrap'
                        }}>
                          <span style={{ fontSize: '0.74rem', opacity: 0.85, color: '#e2e8f0' }}>
                            {cfg.tagline}
                          </span>
                          <a
                            href={cfg.appUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              background: cfg.themeColor,
                              color: '#ffffff',
                              fontSize: '0.76rem',
                              fontWeight: 800,
                              textDecoration: 'none',
                              boxShadow: `0 4px 12px ${cfg.glowColor}`,
                              transition: 'transform 0.15s ease',
                              fontFamily: 'inherit'
                            }}
                          >
                            <ExternalLink size={12} /> {cfg.appButtonText}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Step-by-step instruction tailored to selected payment system */}
                    <div
                      className={styles.paymentNoticeBox}
                      style={{
                        borderColor: `${cfg.themeColor}44`,
                        background: `${cfg.themeColor}12`,
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontWeight: 700,
                        color: cfg.themeColor,
                        marginBottom: '6px',
                        fontSize: '0.85rem'
                      }}>
                        <span>💡</span>
                        <span>{cfg.name} orqali to&apos;lash yo&apos;riqnomasi:</span>
                      </div>
                      <ol style={{ margin: '0 0 0 1.15rem', padding: 0, fontSize: '0.8rem', lineHeight: 1.55 }}>
                        <li>{cfg.instructions.step1}</li>
                        <li>{cfg.instructions.step2}</li>
                        <li>{cfg.instructions.step3}</li>
                      </ol>
                    </div>
                  </>
                );
              })()}

              {/* Buyer Phone & Name */}
              <div className={styles.inputField}>
                <label className={styles.inputLabel}>Ism-sharifingiz</label>
                <input
                  type="text"
                  required
                  className={styles.inputControl}
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Ismingizni kiriting"
                />
              </div>

              <div className={styles.inputField}>
                <label className={styles.inputLabel}>Telefon raqamingiz (Bog&apos;lanish va faollashtirish uchun)</label>
                <input
                  type="text"
                  required
                  className={styles.inputControl}
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="+998 90 123 45 67"
                />
              </div>

              {/* Sender Card Last 4 digits (crucial to distinguish buyers in bank SMS) */}
              <div className={styles.inputField}>
                <label className={styles.inputLabel}>
                  O&apos;tkazma qilgan kartangiz oxirgi 4 raqami <span style={{ color: '#10b981', fontWeight: 800 }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    maxLength={4}
                    required
                    className={styles.inputControl}
                    value={senderCardLast4}
                    onChange={(e) => setSenderCardLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="Masalan: 4421"
                    style={{ letterSpacing: '4px', fontWeight: 800, fontSize: '1.05rem', paddingLeft: '48px' }}
                  />
                  <span style={{
                    position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                    fontWeight: 700, color: 'var(--text-secondary)', fontSize: '1rem', letterSpacing: '1px'
                  }}>
                    ****
                  </span>
                </div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'block', lineHeight: 1.35 }}>
                  Bank SMS xabarnomangiz bilan to&apos;lovingizni darhol tanib olish uchun kerak.
                </span>
              </div>

              {/* Receipt screenshot upload */}
              <div className={styles.inputField}>
                <label className={styles.inputLabel}>
                  To&apos;lov cheki skrinshoti <span style={{ opacity: 0.6 }}>(Ixtiyoriy, tezkor tekshiruv uchun)</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className={styles.inputControl}
                  onChange={handleReceiptUpload}
                  style={{ fontSize: '0.82rem', padding: '8px 12px' }}
                />
                {receiptPreview && (
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img
                      src={receiptPreview}
                      alt="To'lov cheki"
                      style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)' }}
                    />
                    <div style={{ fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={14} /> Chek rasmi biriktirildi
                    </div>
                    <button
                      type="button"
                      onClick={() => { setReceiptImage(''); setReceiptPreview(''); }}
                      style={{
                        padding: '3px 8px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}
                    >
                      O&apos;chirish
                    </button>
                  </div>
                )}
              </div>

              <div className={styles.inputField}>
                <label className={styles.inputLabel}>
                  To&apos;lov izohi <span style={{ opacity: 0.6 }}>(Ixtiyoriy)</span>
                </label>
                <input
                  type="text"
                  className={styles.inputControl}
                  value={paymentComment}
                  onChange={(e) => setPaymentComment(e.target.value)}
                  placeholder="Masalan: 13:45 da o'tkazildi"
                />
              </div>

              {error && (
                <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '10px', color: '#f87171', fontSize: '0.85rem' }}>
                  {error}
                </div>
              )}

              {/* Trust note */}
              <div className={styles.trustNote}>
                <ShieldCheck size={18} style={{ color: '#10b981', flexShrink: 0 }} />
                <span>
                  {selectedFormat === 'electronic'
                    ? "To'lov tasdiqlangach, kitob shaxsiy javoningizda avtomatik to'liq ochiladi."
                    : "To'lov tasdiqlangach, kitob kuryer orqali ko'rsatilgan manzilga yetkaziladi."}
                </span>
              </div>

              {/* Submit button */}
              <button type="submit" disabled={loading} className={styles.submitBtn}>
                {loading ? (
                  <>
                    <span style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                    Yuborilmoqda...
                  </>
                ) : (
                  <>
                    To&apos;lov qildim • {currentPriceNum.toLocaleString('uz-UZ')} so&apos;m
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>
          )}
        </motion.div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AnimatePresence>
  );
}
