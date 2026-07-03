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

const team = [
  { name: 'Alisher Karimov', role: 'Asoschisi va CEO', emoji: '👨‍💼' },
  { name: 'Malika Yusupova', role: 'Kontent menejeri', emoji: '👩‍💻' },
  { name: 'Jasur Toshmatov', role: 'Dasturchi', emoji: '👨‍🔧' },
  { name: 'Nilufar Rahimova', role: 'Dizayner', emoji: '👩‍🎨' },
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
            Kitoblar Portali — O'zbekistondagi eng katta va qulay onlayn kutubxona. 
            2019-yildan boshlab minglab kitobxonlarga o'zbek va jahon adabiyotini yetkazib kelmoqdamiz.
          </p>
          <Link href="/" className={styles.btn}>Kitoblarni ko'rish</Link>
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
              Biz har bir o'zbek fuqarosiga sifatli bilim va madaniyatni qulay va arzon narxda yetkazib berishni maqsad qilganmiz.
              Kitob o'qish odatini keng targ'ib qilish orqali jamiyatimizni rivojlantirmoqdamiz.
            </p>
            <p className={styles.sectionText}>
              Platformamizda badiiy asarlar, ilmiy-ommabop, biznes va shaxsiy rivojlanish kitoblari mavjud.
              Har hafta yangi kitoblar qo'shib boriladi.
            </p>
          </div>
          <div className={styles.missionVisual}>
            <div className={styles.missionIcon}>📚</div>
            <div className={styles.missionQuote}>
              "Kitob — eng yaxshi do'st"
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className={styles.teamSection}>
        <div className={styles.container}>
          <h2 className={styles.centeredTitle}>Jamoamiz</h2>
          <div className={styles.teamGrid}>
            {team.map((member) => (
              <div key={member.name} className={styles.teamCard}>
                <div className={styles.teamEmoji}>{member.emoji}</div>
                <h3 className={styles.teamName}>{member.name}</h3>
                <p className={styles.teamRole}>{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className={styles.backWrap}>
        <Link href="/" className={styles.backLink}>← Bosh sahifaga qaytish</Link>
      </div>
    </main>
  );
}
