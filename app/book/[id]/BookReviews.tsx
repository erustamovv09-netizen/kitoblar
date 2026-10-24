"use client";

import React, { useEffect, useState } from 'react';
import { MessageSquare, Star, User, Send, StarHalf, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '../../lib/api';
import { Review } from '../../lib/db';
import styles from './BookReviews.module.css';

interface BookReviewsProps {
  bookId: string;
}

export default function BookReviews({ bookId }: BookReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState<number>(0); // 0 = no pre-selection, avoids forcing 5 stars
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [success, setSuccess] = useState<boolean>(false);
  const [showAllReviews, setShowAllReviews] = useState<boolean>(false);

  // Load reviews on mount
  useEffect(() => {
    async function fetchReviews() {
      const data = await api.getReviews(bookId);
      setReviews(data);
      setLoading(false);
      if (Array.isArray(data) && data.length > 0) {
        const avg = Math.round((data.reduce((sum, r) => sum + r.rating, 0) / data.length) * 10) / 10;
        try {
          localStorage.setItem(`book_rating_${bookId}`, String(avg));
          localStorage.setItem(`book_reviews_count_${bookId}`, String(data.length));
          window.dispatchEvent(new CustomEvent('reviews-updated', { detail: { bookId, avg, count: data.length } }));
        } catch {}
      }
    }

    // Attempt to load username from localStorage
    if (typeof window !== "undefined") {
      const storedName = localStorage.getItem('username') || localStorage.getItem('name');
      if (storedName) {
        setUserName(storedName);
        setIsLoggedIn(true);
      }
    }

    // Register event listener for live updates
    const handleUpdate = () => {
      fetchReviews();
    };
    window.addEventListener('reviews-updated', handleUpdate);

    fetchReviews();
    return () => {
      window.removeEventListener('reviews-updated', handleUpdate);
    };
  }, [bookId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    setSubmitting(true);
    const storedUser = typeof window !== 'undefined' ? (localStorage.getItem('username') || localStorage.getItem('name') || localStorage.getItem('email')?.split('@')[0]) : null;
    const reviewerName = userName.trim() || storedUser || 'Kitobxon';
    const finalComment = comment.trim();

    const newReview = await api.addReview(bookId, {
      bookId,
      userName: reviewerName,
      rating,
      comment: finalComment
    });

    const updatedList = [newReview, ...reviews];
    setReviews(updatedList);
    setComment('');
    setRating(0); // Reset after submitting
    setHoverRating(null);
    setSuccess(true);
    setSubmitting(false);

    // Notify other components of update in real-time
    try {
      const newAvg = Math.round((updatedList.reduce((sum, r) => sum + r.rating, 0) / updatedList.length) * 10) / 10;
      localStorage.setItem(`book_rating_${bookId}`, String(newAvg));
      localStorage.setItem(`book_reviews_count_${bookId}`, String(updatedList.length));
      window.dispatchEvent(new CustomEvent('reviews-updated', { detail: { bookId, avg: newAvg, count: updatedList.length } }));
    } catch {}

    setTimeout(() => setSuccess(false), 3500);
  };

  // Calculate statistics
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews 
    : 0;

  // Star breakdown counts (5 down to 1)
  const starCounts = [0, 0, 0, 0, 0];
  reviews.forEach(r => {
    const starIdx = Math.round(r.rating) - 1;
    if (starIdx >= 0 && starIdx < 5) {
      starCounts[starIdx]++;
    }
  });

  // Filter actual written comments (excluding empty ratings)
  const textReviews = reviews.filter(r => r.comment && r.comment.trim().length > 0 && !r.comment.includes('yulduz bilan baholandi'));

  return (
    <div id="book-reviews-section" className={styles.reviewsSection}>
      <h3 className={styles.sectionTitle}>
        <MessageSquare size={20} className={styles.titleIcon} />
        O&apos;quvchilar fikrlari va baholari ({totalReviews})
      </h3>

      <div className={styles.statsContainer}>
        {/* Rating Summary Card */}
        <div className={styles.ratingSummary}>
          <div className={styles.bigRating}>{averageRating > 0 ? averageRating.toFixed(1) : "—"}</div>
          <div className={styles.starsWrapper}>
            {[1, 2, 3, 4, 5].map(star => {
              const fill = averageRating >= star 
                ? '#f59e0b' 
                : (averageRating > star - 1 ? '#fbbf24' : 'rgba(255,255,255,0.1)');
              return <Star key={star} size={18} fill={fill} stroke={fill} />;
            })}
          </div>
          <span className={styles.statsCount}>
            {totalReviews} ta baho {textReviews.length > 0 && `· ${textReviews.length} ta sharh`}
          </span>
        </div>

        {/* Rating Breakdown Progress Bars */}
        <div className={styles.breakdown}>
          {[5, 4, 3, 2, 1].map(star => {
            const count = starCounts[star - 1];
            const percent = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            return (
              <div key={star} className={styles.breakdownRow}>
                <span className={styles.starLabel}>{star} ★</span>
                <div className={styles.progressBg}>
                  <div className={styles.progressFill} style={{ width: `${percent}%` }} />
                </div>
                <span className={styles.countLabel}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review Submission Form */}
      <form onSubmit={handleSubmit} className={styles.reviewForm}>
        <h4>Baho bering yoki fikr qoldiring</h4>
        
        {success && (
          <div className={styles.successMessage}>
            ✓ Bahoyingiz muvaffaqiyatli qabul qilindi! Rahmat!
          </div>
        )}

        <div className={styles.formRow}>
          <div className={styles.inputGroup}>
            <label htmlFor="name-input">Ismingiz</label>
            <input 
              id="name-input"
              type="text" 
              placeholder={isLoggedIn ? userName : "Ismingizni kiriting"}
              value={userName} 
              onChange={e => !isLoggedIn && setUserName(e.target.value)}
              readOnly={isLoggedIn}
              className={styles.textInput}
              style={isLoggedIn ? { opacity: 0.85, cursor: 'not-allowed', backgroundColor: 'var(--search-bg)' } : {}}
            />
          </div>

          <div className={styles.ratingInputGroup}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
              <label style={{ margin: 0 }}>Yulduzcha tanlang *</label>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: (hoverRating || rating) ? '#f59e0b' : 'var(--text-secondary)' }}>
                {(() => {
                  const v = hoverRating !== null ? hoverRating : rating;
                  if (v === 1) return "1 — Yomon 🙁";
                  if (v === 2) return "2 — Qoniqarli 😐";
                  if (v === 3) return "3 — Yaxshi 🙂";
                  if (v === 4) return "4 — Juda yaxshi 😊";
                  if (v === 5) return "5 — A'lo darajada ⭐";
                  return "Tanlanmagan";
                })()}
              </span>
            </div>
            <div className={styles.starSelector}>
              {[1, 2, 3, 4, 5].map(star => {
                const activeVal = hoverRating !== null ? hoverRating : rating;
                const isLit = activeVal > 0 && star <= activeVal;
                return (
                  <button
                    key={star}
                    type="button"
                    className={styles.starBtn}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    title={`${star} ball`}
                  >
                    <Star 
                      size={26} 
                      fill={isLit ? '#f59e0b' : 'transparent'} 
                      stroke={isLit ? '#f59e0b' : 'var(--text-secondary)'} 
                      style={{ opacity: isLit ? 1 : 0.45, transition: 'all 0.15s ease' }}
                    />
                  </button>
                );
              })}
              {rating > 0 && (
                <button
                  type="button"
                  onClick={() => setRating(0)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.75rem', cursor: 'pointer', marginLeft: '6px', textDecoration: 'underline' }}
                >
                  Tozalash
                </button>
              )}
            </div>
          </div>
        </div>

        <div className={styles.inputGroup} style={{ marginTop: '1rem' }}>
          <label htmlFor="comment-input" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Sharh</span>
            <span style={{ opacity: 0.65, fontSize: '0.78rem', fontWeight: 500 }}>(ixtiyoriy)</span>
          </label>
          <textarea
            id="comment-input"
            rows={3}
            placeholder="Kitob haqidagi taassurotlaringiz (ixtiyoriy — sharh yozmasdan shunchaki yulduzcha orqali ham baholashingiz mumkin)..."
            value={comment}
            onChange={e => setComment(e.target.value)}
            className={styles.textareaInput}
          />
        </div>

        <button 
          type="submit" 
          disabled={submitting || rating === 0} 
          className={styles.submitBtn}
          style={{
            opacity: (submitting || rating === 0) ? 0.6 : 1,
            cursor: (submitting || rating === 0) ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s'
          }}
        >
          {submitting 
            ? 'Yuborilmoqda...' 
            : rating === 0
              ? 'Baholash uchun yulduzcha tanlang'
              : (comment.trim() ? `Sharh va ${rating}★ bahoni yuborish` : `⭐ ${rating} ball bilan baholash`)}
          <Send size={16} />
        </button>
      </form>

      {/* Reviews List — compactly limited to prevent infinite downward stretching */}
      <div className={styles.reviewsList}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '8px' }}>
          <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
            Kitobxonlar sharhlari ({textReviews.length})
          </h4>
          {totalReviews > textReviews.length && (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Jami {totalReviews} kishi baholagan
            </span>
          )}
        </div>

        {loading ? (
          <p className={styles.emptyState}>Sharhlar yuklanmoqda...</p>
        ) : textReviews.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Hozircha yozma sharhlar qoldirilmagan. Birinchi bo&apos;lib o&apos;z fikringizni bildiring!</p>
          </div>
        ) : (
          <>
            {(showAllReviews ? textReviews : textReviews.slice(0, 3)).map(rev => (
              <div key={rev.id} className={styles.reviewCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.avatar}>
                    <User size={16} />
                  </div>
                  <div className={styles.metaInfo}>
                    <span className={styles.reviewerName}>{rev.userName}</span>
                    <span className={styles.reviewDate}>{rev.createdAt}</span>
                  </div>
                  <div className={styles.cardStars}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star 
                        key={star} 
                        size={14} 
                        fill={star <= rev.rating ? '#f59e0b' : 'transparent'} 
                        stroke={star <= rev.rating ? '#f59e0b' : 'var(--text-secondary)'} 
                      />
                    ))}
                  </div>
                </div>
                <p className={styles.cardComment}>{rev.comment}</p>
              </div>
            ))}

            {textReviews.length > 3 && (
              <button
                type="button"
                onClick={() => setShowAllReviews(!showAllReviews)}
                style={{
                  margin: '0.5rem auto 0', padding: '10px 24px', borderRadius: '24px',
                  background: 'var(--search-bg)', border: '1px solid var(--search-border)',
                  color: 'var(--accent-blue, #3b82f6)', fontSize: '0.88rem', fontWeight: 600,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                  transition: 'all 0.2s ease', fontFamily: 'inherit'
                }}
              >
                {showAllReviews
                  ? 'Kamroq ko\'rsatish ↑'
                  : `Barcha sharhlarni ko'rish (${textReviews.length} ta) ↓`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
