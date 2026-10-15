"use client";

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BookOpen, User, Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { getApiBaseUrl } from '../lib/api';
import styles from './register.module.css';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';
  const fromUrl = searchParams.get('from') || (redirectUrl.startsWith('/book/') ? redirectUrl.replace(/\/read$|\/listen$/, '') : '/');

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const passwordStrength = () => {
    if (password.length === 0) return 0;
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const strengthColors = ['', '#ef4444', '#f97316', '#f59e0b', '#10b981'];
  const strengthLabels = ['', 'Juda zaif', "O'rta", 'Yaxshi', 'Kuchli'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !username.trim() || !email.trim() || !password || !confirmPassword) {
      setError("Iltimos, barcha maydonlarni to'ldiring.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Email manzil noto'g'ri formatda.");
      return;
    }
    if (password.length < 6) {
      setError("Parol kamida 6 ta belgidan iborat bo'lishi kerak.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Parollar mos kelmaydi.");
      return;
    }
    setLoading(true);
    
    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/auth/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), username: username.trim(), email: email.trim(), password }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Server xatosi yoki username allaqachon band!');
      }

      const data = await res.json();
      
      localStorage.setItem('name', data.name || data.username);
      localStorage.setItem('username', data.username);
      localStorage.setItem('email', data.email || '');
      localStorage.setItem('join_date', new Date().toLocaleDateString('uz-UZ', {
        year: 'numeric', month: 'long', day: 'numeric'
      }));
      window.dispatchEvent(new Event('auth-changed'));
      
      router.push(redirectUrl);
    } catch (err: any) {
      setError(err.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const strength = passwordStrength();

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <Link
            href={fromUrl}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--text-secondary, #94a3b8)',
              textDecoration: 'none',
              fontSize: '0.88rem',
              fontWeight: 500,
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
              transition: 'all 0.2s'
            }}
          >
            <ArrowLeft size={16} />
            <span>Orqaga qaytish</span>
          </Link>

          <Link href="/" className={styles.logo}>
            <BookOpen size={24} className={styles.logoIcon} />
            <span>Kitoblar</span>
          </Link>
        </div>

        <div className={styles.header}>
          <h1 className={styles.title}>Hisob yaratish</h1>
          <p className={styles.subtitle}>Minglab kitoblar sizni kutmoqda</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="reg-name">To'liq ism</label>
            <div className={styles.inputWrapper}>
              <User size={18} className={styles.inputIcon} />
              <input
                id="reg-name"
                type="text"
                className={styles.input}
                placeholder="Alisher Navoiy"
                value={name}
                onChange={e => setName(e.target.value)}
                autoComplete="name"
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="reg-username">Username</label>
            <div className={styles.inputWrapper}>
              <User size={18} className={styles.inputIcon} />
              <input
                id="reg-username"
                type="text"
                className={styles.input}
                placeholder="alisher_navoiy"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="reg-email">Email</label>
            <div className={styles.inputWrapper}>
              <Mail size={18} className={styles.inputIcon} />
              <input
                id="reg-email"
                type="email"
                className={styles.input}
                placeholder="alisher@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="reg-password">Parol</label>
            <div className={styles.inputWrapper}>
              <Lock size={18} className={styles.inputIcon} />
              <input
                id="reg-password"
                type={showPass ? 'text' : 'password'}
                className={`${styles.input} ${styles.inputPadRight}`}
                placeholder="Kamida 6 ta belgi"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="new-password"
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

            {password.length > 0 && (
              <div className={styles.strengthMeter}>
                <div className={styles.strengthBar}>
                  <div
                    className={styles.strengthFill}
                    style={{
                      width: `${(strength / 4) * 100}%`,
                      backgroundColor: strengthColors[strength],
                    }}
                  />
                </div>
                <span className={styles.strengthText} style={{ color: strengthColors[strength] }}>
                  {strengthLabels[strength]}
                </span>
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="reg-confirm">Parolni tasdiqlang</label>
            <div className={styles.inputWrapper}>
              <Lock size={18} className={styles.inputIcon} />
              <input
                id="reg-confirm"
                type={showConfirm ? 'text' : 'password'}
                className={`${styles.input} ${styles.inputPadRight}`}
                placeholder="Parolni qayta kiriting"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowConfirm(v => !v)}
                aria-label={showConfirm ? "Parolni yashirish" : "Parolni ko'rsatish"}
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
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
            id="register-submit"
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading ? (
              <span className={styles.spinner} />
            ) : (
              <>
                Ro&apos;yxatdan o&apos;tish
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className={styles.divider}><span>yoki</span></div>

        <p className={styles.switchText}>
          Hisobingiz bormi?{' '}
          <Link
            href={`/login?redirect=${encodeURIComponent(redirectUrl)}&from=${encodeURIComponent(fromUrl)}`}
            className={styles.switchLink}
          >
            Kirish
          </Link>
        </p>
      </motion.div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />}>
      <RegisterForm />
    </Suspense>
  );
}
