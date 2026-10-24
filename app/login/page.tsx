"use client";

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BookOpen, Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, AlertCircle, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { getApiBaseUrl } from '../lib/api';
import { saveUserSession } from '../lib/session';
import { syncUserFromCloud } from '../lib/userSync';
import { formatUzbekDate, getTodayUzbekDate } from '../lib/date';
import styles from './login.module.css';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';
  const fromUrl = searchParams.get('from') || (redirectUrl.startsWith('/book/') ? redirectUrl.replace(/\/read$|\/listen$/, '') : '/');

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !email.trim() || !password.trim()) {
      setError("Iltimos, barcha maydonlarni to'ldiring.");
      return;
    }
    if (password.length < 6) {
      setError("Parol kamida 6 ta belgidan iborat bo'lishi kerak.");
      return;
    }
    setLoading(true);
    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Login yoki parol xato!');
      }

      const data = await res.json();
      
      const rawJoin = localStorage.getItem('join_date');
      const joinDate = rawJoin ? formatUzbekDate(rawJoin) : getTodayUzbekDate();

      saveUserSession({
        name: data.name || data.username,
        username: data.username,
        email: data.email || email,
        join_date: joinDate,
      });
      
      // Bulutdagi barcha sevimlilar va xaridlarni ushbu qurilmaga darhol sinxronlash
      await syncUserFromCloud(data.username, { mergeGuestFavorites: true });

      // Kirgandan so'ng to'xtagan kitobiga yoki ko'zlangan sahifaga yo'naltirish
      router.push(redirectUrl);
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
          <h1 className={styles.title}>Xush kelibsiz!</h1>
          <p className={styles.subtitle}>Hisobingizga kiring va mutolaani davom ettiring</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="login-username">Username</label>
            <div className={styles.inputWrapper}>
              <User size={18} className={styles.inputIcon} />
              <input
                id="login-username"
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
            <label className={styles.label} htmlFor="login-email">Email</label>
            <div className={styles.inputWrapper}>
              <Mail size={18} className={styles.inputIcon} />
              <input
                id="login-email"
                type="email"
                className={styles.input}
                placeholder="email@misol.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
          </div>

          <div className={styles.field}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className={styles.label} htmlFor="login-password">Parol</label>
              <Link 
                href="/forgot-password" 
                style={{ fontSize: '0.82rem', color: 'var(--theme-color, var(--accent-blue))', textDecoration: 'none', fontWeight: 600 }}
              >
                Parolni unutdingizmi?
              </Link>
            </div>
            <div className={styles.inputWrapper}>
              <Lock size={18} className={styles.inputIcon} />
              <input
                id="login-password"
                type={showPass ? 'text' : 'password'}
                className={`${styles.input} ${styles.inputPadRight}`}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPass(v => !v)}
                aria-label={showPass ? "Parolni yashirish" : "Parolni ko'rsatish"}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
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
            id="login-submit"
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading ? (
              <span className={styles.spinner} />
            ) : (
              <>
                Kirish
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className={styles.divider}>
          <span>yoki</span>
        </div>

        <p className={styles.switchText}>
          Hisobingiz yo&apos;qmi?{' '}
          <Link
            href={`/register?redirect=${encodeURIComponent(redirectUrl)}&from=${encodeURIComponent(fromUrl)}`}
            className={styles.switchLink}
          >
            Ro&apos;yxatdan o&apos;ting
          </Link>
        </p>
      </motion.div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />}>
      <LoginForm />
    </Suspense>
  );
}
