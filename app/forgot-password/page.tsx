"use client";

import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Mail, User, ArrowRight, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import styles from '../login/login.module.css';

export default function ForgotPasswordPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !email.trim()) {
      setError("Iltimos, username va emailingizni kiriting.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Email manzil noto'g'ri formatda.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Xat yuborishda xatolik yuz berdi");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.bgGlow1} />
      <div className={styles.bgGlow2} />

      <motion.div
        className={styles.card}
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className={styles.logoRow}>
          <Link href="/" className={styles.logo}>
            <BookOpen size={26} className={styles.logoIcon} />
            <span>Kitoblar</span>
          </Link>
        </div>

        <div className={styles.header}>
          <h1 className={styles.title}>Parolni tiklash</h1>
          <p className={styles.subtitle}>
            Ro'yxatdan o'tgan Username va emailingizni kiriting. Biz parolni yangilash havolasini yuboramiz.
          </p>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: '#10b981'
            }}>
              <CheckCircle size={32} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              Havola yuborildi!
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              <strong>{email}</strong> manziliga parolni tiklash havolasi yuborildi. Iltimos, emailingizni tekshiring.
            </p>
            <Link
              href="/login"
              className={styles.submitBtn}
              style={{ textDecoration: 'none' }}
            >
              <ArrowLeft size={18} />
              Kirish sahifasiga qaytish
            </Link>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="reset-username">Username</label>
              <div className={styles.inputWrapper}>
                <User size={18} className={styles.inputIcon} />
                <input
                  id="reset-username"
                  type="text"
                  className={styles.input}
                  placeholder="admin"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoComplete="username"
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="reset-email">Email</label>
              <div className={styles.inputWrapper}>
                <Mail size={18} className={styles.inputIcon} />
                <input
                  id="reset-email"
                  type="email"
                  className={styles.input}
                  placeholder="email@misol.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            {error && (
              <motion.div
                className={styles.errorBox}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </motion.div>
            )}

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? (
                <span className={styles.spinner} />
              ) : (
                <>
                  Havolani yuborish
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
              <Link href="/login" style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <ArrowLeft size={14} />
                Kirish sahifasiga qaytish
              </Link>
            </div>
          </form>
        )}
      </motion.div>
    </main>
  );
}
