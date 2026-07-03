"use client";

import React, { useEffect, useRef, useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowLeft, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { api, Book } from '@/app/lib/api';
import styles from './listen.module.css';

export default function ListenPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);

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

    const updateProgress = () => setProgress(audio.currentTime);
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
  }, [book]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const skipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 15, duration);
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
              <span>{formatTime(duration)}</span>
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
    </main>
  );
}
