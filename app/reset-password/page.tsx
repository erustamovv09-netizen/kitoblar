"use client";

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BookOpen, Lock, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import styles from '../register/register.module.css';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
  const strength = passwordStrength();

  useEffect(() => {
    if (!token) {
      setError("Havola yaroqsiz yoki mavjud emas.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError("Havola yaroqsiz.");
      return;
    }
    if (password.length < 6) {
      setError("Parol kamida 6 ta belgidan iborat bo'lishi kerak.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Parollar bir-biriga mos kelmadi.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Parolni yangilashda xatolik yuz berdi');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
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
          <h1 className={styles.title}>Yangi parol o'rnatish</h1>
          <p className={styles.subtitle}>Hisobingiz uchun yangi xavfsiz parol kiriting</p>
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
              Parol muvaffaqiyatli yangilandi!
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              3 soniyadan so'ng login sahifasiga yo'naltirilasiz...
            </p>
            <Link href="/login" className={styles.submitBtn} style={{ textDecoration: 'none' }}>
              Kirish sahifasiga o'tish
            </Link>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="new-password">Yangi parol</label>
              <div className={styles.inputWrapper}>
                <Lock size={18} className={styles.inputIcon} />
                <input
                  id="new-password"
                  type={showPass ? 'text' : 'password'}
                  className={`${styles.input} ${styles.inputPadRight}`}
                  placeholder="••••••••"
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
                <div className={styles.strengthRow}>
                  <div className={styles.strengthBar}>
                    {[1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        className={styles.strengthSegment}
                        style={{ background: i <= strength ? strengthColors[strength] : 'var(--border-color)' }}
                      />
                    ))}
                  </div>
                  <span className={styles.strengthLabel} style={{ color: strengthColors[strength] }}>
                    {strengthLabels[strength]}
                  </span>
                </div>
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="confirm-password">Parolni tasdiqlang</label>
              <div className={styles.inputWrapper}>
                <Lock size={18} className={styles.inputIcon} />
                <input
                  id="confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  className={`${styles.input} ${styles.inputPadRight}`}
                  placeholder="••••••••"
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
              {confirmPassword.length > 0 && password === confirmPassword && (
                <span className={styles.matchOk}>✓ Parollar mos keldi</span>
              )}
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
              disabled={loading || !token}
            >
              {loading ? (
                <span className={styles.spinner} />
              ) : (
                <>
                  Parolni saqlash
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}
      </motion.div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh' }} />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
