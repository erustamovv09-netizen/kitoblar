"use client";

import React, { useEffect, useState } from 'react';
import { MessageSquare, Star, User, Send, StarHalf } from 'lucide-react';
import { api } from '../../lib/api';
import { Review } from '../../lib/db';
import styles from './BookReviews.module.css';

interface BookReviewsProps {
  bookId: string;
}

export default function BookReviews({ bookId }: BookReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [success, setSuccess] = useState<boolean>(false);

  // Load reviews on mount
  useEffect(() => {
    async function fetchReviews() {
      const data = await api.getReviews(bookId);
      setReviews(data);
      setLoading(false);
    }

    // Attempt to load username from localStorage
    if (typeof window !== "undefined") {
      const storedName = localStorage.getItem('username');
      if (storedName) setUserName(storedName);
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
    if (!comment.trim()) return;

    setSubmitting(true);
    const reviewerName = userName.trim() || 'Kitobxon';

    const newReview = await api.addReview(bookId, {
      bookId,
      userName: reviewerName,
      rating,
      comment: comment.trim()
    });

    setReviews(prev => [newReview, ...prev]);
    setComment('');
    setSuccess(true);
    setSubmitting(false);

    // Notify other components of update in real-time
    try {
      window.dispatchEvent(new CustomEvent('reviews-updated'));
    } catch {}

    setTimeout(() => setSuccess(false), 3000);
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

  return (
    <div className={styles.reviewsSection}>
      <h3 className={styles.sectionTitle}>
        <MessageSquare size={20} className={styles.titleIcon} />
        O'quvchilar fikrlari ({totalReviews})
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
          <span className={styles.statsCount}>{totalReviews} ta taqriz</span>
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
        <h4>Fikringizni qoldiring</h4>
        
        {success && (
          <div className={styles.successMessage}>
            Fikringiz muvaffaqiyatli qabul qilindi! Rahmat!
          </div>
        )}

        <div className={styles.formRow}>
          <div className={styles.inputGroup}>
            <label htmlFor="name-input">Ismingiz</label>
            <input 
              id="name-input"
              type="text" 
              placeholder="Ismingizni kiriting (ixtiyoriy)"
              value={userName} 
              onChange={e => setUserName(e.target.value)}
              className={styles.textInput}
            />
          </div>

          <div className={styles.ratingInputGroup}>
            <label>Baho bering</label>
            <div className={styles.starSelector}>
              {[1, 2, 3, 4, 5].map(star => {
                const isLit = hoverRating !== null ? star <= hoverRating : star <= rating;
                return (
                  <button
                    key={star}
                    type="button"
                    className={styles.starBtn}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                  >
                    <Star 
                      size={24} 
                      fill={isLit ? '#f59e0b' : 'transparent'} 
                      stroke={isLit ? '#f59e0b' : 'var(--text-secondary)'} 
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className={styles.inputGroup} style={{ marginTop: '1rem' }}>
          <label htmlFor="comment-input">Sharh</label>
          <textarea
            id="comment-input"
            rows={4}
            placeholder="Kitob haqidagi taassurotlaringizni yozing..."
            value={comment}
            onChange={e => setComment(e.target.value)}
            className={styles.textareaInput}
            required
          />
        </div>

        <button 
          type="submit" 
          disabled={submitting || !comment.trim()} 
          className={styles.submitBtn}
        >
          {submitting ? 'Yuborilmoqda...' : 'Fikrni yuborish'}
          <Send size={16} />
        </button>
      </form>

      {/* Reviews List */}
      <div className={styles.reviewsList}>
        {loading ? (
          <p className={styles.emptyState}>Sharhlar yuklanmoqda...</p>
        ) : reviews.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Hali sharhlar yozilmagan. Birinchi bo'lib o'z fikringizni bildiring!</p>
          </div>
        ) : (
          reviews.map(rev => (
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
          ))
        )}
      </div>
    </div>
  );
}
