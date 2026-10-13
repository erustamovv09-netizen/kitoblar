import Link from 'next/link';
import { BookOpen, Users, Globe, Award, Send } from 'lucide-react';
import styles from './page.module.css';

export const metadata = {
  title: 'Biz haqimizda | Kitoblar Portali',
  description: 'Kitoblar Portali haqida ma\'lumot - O\'zbekistondagi eng yirik e-kutubxona',
};

const stats = [
  { icon: BookOpen, value: '1,000+', label: 'Kitoblar' },
  { icon: Users, value: '5,000+', label: 'Foydalanuvchilar' },
  { icon: Globe, value: '10+', label: 'Kategoriyalar' },
  { icon: Award, value: '5 yil', label: 'Tajriba' },
];

export default function AboutPage() {
  return (
    <main className={styles.main}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.badge}>Biz haqimizda</div>
          <h1 className={styles.heroTitle}>
            Bilimga eshik ochuvchi <span className={styles.accent}>kutubxona</span>
          </h1>
          <p className={styles.heroDesc}>
            Kitoblar Portali — qulay va zamonaviy onlayn kutubxona. Bu yerda siz o'zingiz yoqtirgan sevimli asarlaringizni topishingiz va o'qishingiz mumkin. Loyihamiz kitobxonlar uchun ajoyib qulayliklar yaratish maqsadida ishlab chiqilgan.
          </p>
          <Link href="/" className={styles.btn}>Kitoblarni ko&apos;rish</Link>
        </div>
      </section>

      {/* Stats */}
      <section className={styles.stats}>
        <div className={styles.container}>
          {stats.map(({ icon: Icon, value, label }) => (
            <div key={label} className={styles.statCard}>
              <div className={styles.statIcon}>
                <Icon size={28} />
              </div>
              <div className={styles.statValue}>{value}</div>
              <div className={styles.statLabel}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <div className={styles.textBlock}>
            <h2 className={styles.sectionTitle}>Bizning maqsadimiz</h2>
            <p className={styles.sectionText}>
              Biz har bir o&apos;zbek fuqarosiga sifatli bilim va madaniyatni qulay va arzon narxda yetkazib berishni maqsad qilganmiz.
              Kitob o&apos;qish odatini keng targ&apos;ib qilish orqali jamiyatimizni rivojlantirmoqdamiz.
            </p>
            <p className={styles.sectionText}>
              Platformamizda badiiy asarlar, ilmiy-ommabop, biznes va shaxsiy rivojlanish kitoblari mavjud.
              Har hafta yangi kitoblar qo&apos;shib boriladi.
            </p>
          </div>
          <div className={styles.missionVisual}>
            <div className={styles.missionIcon}>📚</div>
            <div className={styles.missionQuote}>
              &quot;Kitob — eng yaxshi do&apos;st&quot;
            </div>
          </div>
        </div>
      </section>

      {/* Founder */}
      <section className={styles.teamSection}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 className={styles.centeredTitle}>Loyiha muallifi</h2>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem', width: '100%' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(79,142,247,0.08), rgba(139,92,246,0.08))',
              border: '1px solid rgba(79,142,247,0.2)',
              borderRadius: '24px',
              padding: '2.5rem 1.5rem',
              textAlign: 'center',
              maxWidth: '380px',
              width: '100%',
              margin: '0 auto',
              backdropFilter: 'blur(12px)',
            }}>
              {/* Avatar */}
              <div style={{
                width: '110px', height: '110px', borderRadius: '50%',
                background: 'var(--theme-color, var(--accent-blue))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2.8rem', fontWeight: 800, color: '#fff',
                margin: '0 auto 1.25rem',
                boxShadow: '0 12px 32px rgba(79,142,247,0.35)',
                border: '3px solid rgba(255,255,255,0.1)',
              }}>
                R
              </div>

              {/* Badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: 'rgba(79,142,247,0.12)', color: '#4f8ef7',
                border: '1px solid rgba(79,142,247,0.25)',
                borderRadius: '20px', padding: '4px 14px',
                fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em',
                marginBottom: '1rem',
              }}>
                👨‍💻 Asoschisi &amp; Dasturchi
              </div>

              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.4rem' }}>
                Rustamov Elshod
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                Kitoblar Portali loyihasining yaratuvchisi. O&apos;zbekistonda kitob o&apos;qish madaniyatini
                raqamli platformalar orqali rivojlantirish maqsadida ushbu loyihani ishga tushirdi.
              </p>

              {/* Social links */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <a href="https://instagram.com/rustamovv.09" target="_blank" rel="noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 16px', borderRadius: '10px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--text-primary)', textDecoration: 'none',
                    fontSize: '0.85rem', fontWeight: 600,
                  }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
                  </svg> Instagram
                </a>
                <a href="https://t.me/Rustamovv_E" target="_blank" rel="noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 16px', borderRadius: '10px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--text-primary)', textDecoration: 'none',
                    fontSize: '0.85rem', fontWeight: 600,
                  }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                  </svg> Telegram
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className={styles.backWrap}>
        <Link href="/" className={styles.backLink}>← Bosh sahifaga qaytish</Link>
      </div>
    </main>
  );
}
