import Link from 'next/link';
import { BookOpen, Users, Globe, Award } from 'lucide-react';
import styles from './page.module.css';

export const metadata = {
  title: 'Biz haqimizda | Kitoblar Portali',
  description: 'Kitoblar Portali haqida ma\'lumot - O\'zbekistondagi eng yirik e-kutubxona',
};

const stats = [
  { icon: BookOpen, value: '10,000+', label: 'Kitoblar' },
  { icon: Users, value: '50,000+', label: 'Foydalanuvchilar' },
  { icon: Globe, value: '15+', label: 'Kategoriyalar' },
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
            Kitoblar Portali — O&apos;zbekistondagi eng katta va qulay onlayn kutubxona.
            2019-yildan boshlab minglab kitobxonlarga o&apos;zbek va jahon adabiyotini yetkazib kelmoqdamiz.
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
        <div className={styles.container}>
          <h2 className={styles.centeredTitle}>Loyiha muallifi</h2>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(79,142,247,0.08), rgba(139,92,246,0.08))',
              border: '1px solid rgba(79,142,247,0.2)',
              borderRadius: '24px',
              padding: '3rem 3.5rem',
              textAlign: 'center',
              maxWidth: '380px',
              width: '100%',
              backdropFilter: 'blur(12px)',
            }}>
              {/* Avatar */}
              <div style={{
                width: '110px', height: '110px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #4f8ef7, #8b5cf6)',
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
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <a href="https://instagram.com/rustamovv.09" target="_blank" rel="noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 16px', borderRadius: '10px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--text-primary)', textDecoration: 'none',
                    fontSize: '0.85rem', fontWeight: 600,
                  }}>
                  📸 Instagram
                </a>
                <a href="https://t.me/kitoblar" target="_blank" rel="noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 16px', borderRadius: '10px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--text-primary)', textDecoration: 'none',
                    fontSize: '0.85rem', fontWeight: 600,
                  }}>
                  ✈️ Telegram
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
