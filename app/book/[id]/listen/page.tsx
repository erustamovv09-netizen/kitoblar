"use client";

import React, { useEffect, useRef, useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Lock,
  Sparkles,
  Headphones,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { api, Book } from '@/app/lib/api';
import { checkBookAccess } from '@/app/lib/purchases';
import PurchaseModal from '@/components/PurchaseModal';
import styles from './listen.module.css';

export default function ListenPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);

  // Purchase & Access state (Audio is part of electronic book purchase)
  const PREVIEW_LIMIT = 30; // 30 soniyalik bepul audio namuna
  const [isPurchased, setIsPurchased] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [pendingReceipt, setPendingReceipt] = useState('');
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);

  useEffect(() => {
    const isLogged = localStorage.getItem('username');
    if (!isLogged) {
      router.replace(`/login?redirect=${encodeURIComponent(`/book/${resolvedParams.id}/listen`)}&from=${encodeURIComponent(`/book/${resolvedParams.id}`)}`);
    }
  }, [router, resolvedParams.id]);

  // Check purchase status in localStorage & server verification
  useEffect(() => {
    let mounted = true;
    async function verifyAudioAccess() {
      try {
        const res = await checkBookAccess(resolvedParams.id);
        if (!mounted) return;
        setIsPurchased(res.isPurchased);
        setIsPending(res.isPending);
        if (res.receiptNumber) setPendingReceipt(res.receiptNumber);
      } catch {
        if (!mounted) return;
        setIsPurchased(false);
        setIsPending(false);
      }
    }
    verifyAudioAccess();
    window.addEventListener('book-purchased', verifyAudioAccess);
    window.addEventListener('order-submitted', verifyAudioAccess);
    window.addEventListener('storage', verifyAudioAccess);
    return () => {
      mounted = false;
      window.removeEventListener('book-purchased', verifyAudioAccess);
      window.removeEventListener('order-submitted', verifyAudioAccess);
      window.removeEventListener('storage', verifyAudioAccess);
    };
  }, [resolvedParams.id]);

  // Audio state
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    async function fetchBook() {
      const data = await api.getBook(resolvedParams.id);
      if (!data || !data.hasAudio || !data.audioUrl) {
        notFound();
      } else {
        setBook(data);
      }
      setLoading(false);
    }
    fetchBook();
  }, [resolvedParams.id]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      if (!isPurchased && audio.currentTime >= PREVIEW_LIMIT) {
        audio.currentTime = PREVIEW_LIMIT;
        audio.pause();
        setIsPlaying(false);
        setPurchaseModalOpen(true);
        setProgress(PREVIEW_LIMIT);
        return;
      }
      setProgress(audio.currentTime);
    };

    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [book, isPurchased]);

  const togglePlay = () => {
    if (!isPurchased && progress >= PREVIEW_LIMIT) {
      setPurchaseModalOpen(true);
      return;
    }
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {});
      }
    }
  };

  const skipForward = () => {
    if (audioRef.current) {
      const nextTime = audioRef.current.currentTime + 15;
      if (!isPurchased && nextTime >= PREVIEW_LIMIT) {
        audioRef.current.currentTime = PREVIEW_LIMIT;
        audioRef.current.pause();
        setIsPlaying(false);
        setPurchaseModalOpen(true);
        setProgress(PREVIEW_LIMIT);
        return;
      }
      audioRef.current.currentTime = Math.min(nextTime, duration);
    }
  };

  const skipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 15, 0);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (!isPurchased && time > PREVIEW_LIMIT) {
      if (audioRef.current) {
        audioRef.current.currentTime = PREVIEW_LIMIT;
        audioRef.current.pause();
      }
      setProgress(PREVIEW_LIMIT);
      setIsPlaying(false);
      setPurchaseModalOpen(true);
      return;
    }
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className={styles.loading}>Yuklanmoqda...</div>;
  }

  if (!book) return null;

  return (
    <main className={styles.container}>
      <Link href={`/book/${book.id}`} className={styles.backButton}>
        <ArrowLeft size={20} />
        <span>Kitob sahifasiga qaytish</span>
      </Link>

      <div className={styles.playerCard}>
        <div className={styles.coverWrapper}>
          <Image src={book.image} alt={book.title} fill className={styles.coverImage} unoptimized />
          <div className={styles.coverOverlay} />
        </div>

        <div className={styles.infoSection}>
          {/* Purchase status tag */}
          {!isPurchased ? (
            <div className={styles.previewBadge}>
              <Lock size={13} /> Namunaviy tinglov (30 soniya bepul)
            </div>
          ) : (
            <div className={styles.unlockedBadge}>
              <CheckCircle2 size={13} /> To‘liq audio versiya ochilgan
            </div>
          )}

          <h1 className={styles.title}>{book.title}</h1>
          <p className={styles.author}>{book.author}</p>

          <audio ref={audioRef} src={book.audioUrl} preload="metadata" />

          <div className={styles.progressContainer}>
            <input
              type="range"
              className={styles.progressBar}
              min={0}
              max={duration || 100}
              value={progress}
              onChange={handleSeek}
            />
            <div className={styles.timeInfo}>
              <span>{formatTime(progress)}</span>
              <span>
                {!isPurchased
                  ? `00:30 (Namunaviy) / ${formatTime(duration)}`
                  : formatTime(duration)}
              </span>
            </div>
          </div>

          <div className={styles.controls}>
            <button onClick={toggleMute} className={styles.secondaryBtn} aria-label={isMuted ? "Ovozni yoqish" : "Ovozni o'chirish"}>
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            
            <div className={styles.mainControls}>
              <button onClick={skipBackward} className={styles.skipBtn} aria-label="15 soniya orqaga">
                <SkipBack size={24} />
              </button>
              
              <button onClick={togglePlay} className={styles.playBtn} aria-label={isPlaying ? "To'xtatish" : "Ijro etish"}>
                {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
              </button>
              
              <button onClick={skipForward} className={styles.skipBtn} aria-label="15 soniya oldinga">
                <SkipForward size={24} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pending status banner */}
      {isPending && !isPurchased && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.12)', border: '1.5px solid rgba(245, 158, 11, 0.35)',
          borderRadius: '16px', padding: '1.25rem', textAlign: 'center', margin: '1rem 0'
        }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontWeight: 800, fontSize: '1rem', marginBottom: '6px' }}>
            <Clock size={18} /> To&apos;lovingiz tekshirilmoqda {pendingReceipt ? `(#${pendingReceipt})` : ''}
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}>
            Siz ushbu kitob uchun to&apos;lov qilgansiz. Admin to&apos;lovni tasdiqlashi bilan audio to&apos;liq ochiladi.
          </p>
        </div>
      )}

      {/* Paywall Banner if book is not purchased */}
      {!isPurchased && (
        <div className={styles.audioPaywallCard}>
          <div className={styles.audioPaywallHeader}>
            <div className={styles.audioLockCircle}>
              <Lock size={26} />
            </div>
            <div>
              <div className={styles.audioPaywallTag}>
                <Sparkles size={13} /> Elektron paketga kiritilgan
              </div>
              <h3 className={styles.audioPaywallTitle}>
                Audio kitobni to‘liq eshitish uchun elektron formatni xarid qiling
              </h3>
              <p className={styles.audioPaywallDesc}>
                Ushbu audio talqin elektron format to‘plamiga kiritilgan. Elektron kitobni xarid qilsangiz, asarni <strong>ham to‘liq o‘qish</strong>, <strong>ham barcha audio qismlarini cheklovlarsiz tinglash</strong> imkoniyatiga ega bo‘lasiz!
              </p>
            </div>
          </div>

          <div className={styles.audioPaywallActionRow}>
            <div className={styles.audioPriceBlock}>
              <span className={styles.audioPriceLabel}>Elektron + Audio narxi:</span>
              <span className={styles.audioPriceValue}>
                {book.priceElectronic || (book as any).price_electronic || book.price}
              </span>
            </div>
            <button
              onClick={() => setPurchaseModalOpen(true)}
              className={styles.audioBuyBtn}
            >
              <Headphones size={18} /> Elektron xarid qilish (Audio ochiladi)
            </button>
          </div>
        </div>
      )}

      {/* Purchase Modal */}
      <PurchaseModal
        isOpen={purchaseModalOpen}
        onClose={() => setPurchaseModalOpen(false)}
        book={book}
        initialFormat="electronic"
        onSuccess={() => {
          setIsPurchased(true);
        }}
      />
    </main>
  );
}
