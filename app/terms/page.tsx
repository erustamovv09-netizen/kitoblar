import Link from 'next/link';

export const metadata = {
  title: 'Foydalanish shartlari | Kitoblar Portali',
  description: 'Kitoblar Portali foydalanish shartlari va qoidalari',
};

const sections = [
  {
    emoji: '📋',
    title: '1. Umumiy qoidalar',
    text: `Ushbu foydalanish shartlari ("Shartlar") Kitoblar Portali veb-sayti va xizmatlaridan foydalanishni tartibga soladi. Saytdan foydalanish orqali siz ushbu shartlarga roziligingizni bildirasiz. Agar rozilik bildirsangiz, xizmatlarimizdan foydalanishingiz mumkin.`,
  },
  {
    emoji: '👤',
    title: '2. Hisob va roʻyxatdan oʻtish',
    text: `Saytimizdan toʻliq foydalanish uchun roʻyxatdan oʻtishingiz talab qilinishi mumkin. Siz toʻgʻri va dolzarb maʼlumotlarni kiritishingiz shart. Hisob ma'lumotlaringizni sir saqlash va uchinchi shaxslarga bermaslik mas'uliyati sizning zimmangizda.`,
  },
  {
    emoji: '📚',
    title: '3. Intellektual mulk',
    text: `Saytdagi barcha kontent — kitoblar, tasvirlar, dizayn va kodlar Kitoblar Portali mulki hisoblanadi yoki litsenziyalangan materiallardir. Ularni ruxsatsiz nusxalash, tarqatish yoki tijoriy maqsadlarda foydalanish taqiqlanadi.`,
  },
  {
    emoji: '🚫',
    title: '4. Taqiqlangan xatti-harakatlar',
    text: `Foydalanuvchilar quyidagi harakatlarni amalga oshirishi taqiqlanadi: boshqa foydalanuvchilarga ziyon yetkazish, saytni buzish yoki uning ishlashiga xalaqit berish, spam tarqatish, soxta hisob yaratish va qonuniy talablarga zid harakatlar.`,
  },
  {
    emoji: '🔒',
    title: '5. Maʼlumotlar xavfsizligi',
    text: `Biz sizning shaxsiy maʼlumotlaringizni himoya qilish uchun zamonaviy xavfsizlik choralarini qoʻllaymiz. Biroq internet orqali uzatilayotgan maʼlumotlarning toʻliq xavfsizligini kafolatlay olmaymiz. Batafsil maʼlumot uchun Maxfiylik siyosatimizni oʻqing.`,
  },
  {
    emoji: '✏️',
    title: '6. Shartlarni oʻzgartirish',
    text: `Kitoblar Portali ushbu shartlarni istalgan vaqtda oʻzgartirish huquqini oʻzida saqlab qoladi. Oʻzgartirishlar saytda eʼlon qilinganidan soʻng kuchga kiradi. Saytdan foydalanishni davom ettirsangiz, yangi shartlarga roziligingizni bildirgansiz.`,
  },
];

export default function TermsPage() {
  return (
    <main className="terms-main">
      <section className="terms-hero">
        <div className="terms-hero-inner">
          <div className="terms-badge">Foydalanish shartlari</div>
          <h1 className="terms-title">Qoidalar va <span className="terms-accent">shartlar</span></h1>
          <p className="terms-desc">Oxirgi yangilangan: 1-yanvar 2024-yil</p>
        </div>
      </section>

      <div className="terms-body">
        <div className="terms-intro">
          Xizmatlarimizdan foydalanishdan oldin ushbu shartlarni diqqat bilan oʻqing.
          Agar qandaydir savolingiz boʻlsa, <Link href="/contact" className="terms-link">biz bilan bog&apos;laning</Link>.
        </div>

        <div className="terms-sections">
          {sections.map((s) => (
            <div key={s.title} className="terms-section">
              <div className="terms-section-header">
                <span className="terms-section-emoji">{s.emoji}</span>
                <h2 className="terms-section-title">{s.title}</h2>
              </div>
              <p className="terms-section-text">{s.text}</p>
            </div>
          ))}
        </div>

        <div className="terms-contact-box">
          <div className="terms-contact-icon">💬</div>
          <div>
            <div className="terms-contact-label">Savol bormi?</div>
            <div className="terms-contact-text">
              Ushbu shartlar haqida savolingiz yoki tushunmovchiligingiz bo&apos;lsa —
              <Link href="/contact" className="terms-link"> biz bilan bog&apos;laning</Link>.
            </div>
          </div>
        </div>
      </div>

      <div className="terms-back">
        <Link href="/" className="back-link">← Bosh sahifaga qaytish</Link>
      </div>

      <style>{`
        .terms-main {
          min-height: 100vh;
          padding-bottom: 4rem;
        }
        .terms-hero {
          background: linear-gradient(135deg, var(--bg-color) 0%, var(--search-bg) 100%);
          border-bottom: 1px solid var(--border-color);
          padding: 6rem 1.5rem 5rem;
          text-align: center;
        }
        .terms-hero-inner { max-width: 600px; margin: 0 auto; }
        .terms-badge {
          display: inline-block;
          background: rgba(139, 92, 246, 0.15);
          color: var(--accent-purple);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 999px;
          padding: 0.35rem 1rem;
          font-size: 0.85rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-bottom: 1.5rem;
        }
        .terms-title {
          font-size: clamp(2rem, 5vw, 3rem);
          font-weight: 800;
          line-height: 1.15;
          color: var(--text-primary);
          margin-bottom: 1rem;
          letter-spacing: -0.03em;
        }
        .terms-accent {
          background: linear-gradient(90deg, var(--accent-blue), var(--accent-purple));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .terms-desc {
          color: var(--text-secondary);
          font-size: 0.95rem;
        }
        .terms-body {
          max-width: 820px;
          margin: 0 auto;
          padding: 3.5rem 1.5rem;
        }
        .terms-intro {
          color: var(--text-secondary);
          font-size: 1.05rem;
          line-height: 1.75;
          margin-bottom: 2.5rem;
          padding: 1.5rem 2rem;
          background: rgba(59,130,246,0.06);
          border-left: 3px solid var(--accent-blue);
          border-radius: 0 12px 12px 0;
        }
        .terms-sections {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }
        .terms-section {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 16px;
          padding: 1.75rem 2rem;
          transition: border-color 0.2s;
        }
        .terms-section:hover {
          border-color: rgba(59,130,246,0.25);
        }
        .terms-section-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        .terms-section-emoji { font-size: 1.4rem; }
        .terms-section-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.01em;
        }
        .terms-section-text {
          color: var(--text-secondary);
          font-size: 0.97rem;
          line-height: 1.75;
        }
        .terms-contact-box {
          display: flex;
          align-items: flex-start;
          gap: 1.25rem;
          background: linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.08));
          border: 1px solid rgba(139,92,246,0.25);
          border-radius: 16px;
          padding: 1.75rem 2rem;
        }
        .terms-contact-icon { font-size: 1.75rem; flex-shrink: 0; margin-top: 2px; }
        .terms-contact-label {
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.4rem;
        }
        .terms-contact-text {
          color: var(--text-secondary);
          font-size: 0.95rem;
          line-height: 1.6;
        }
        .terms-link {
          color: var(--accent-blue);
          text-decoration: none;
          transition: opacity 0.2s;
        }
        .terms-link:hover { opacity: 0.75; }
        .terms-back {
          text-align: center;
          padding: 1rem 1.5rem 0;
        }
        .back-link {
          color: var(--accent-blue);
          font-size: 0.95rem;
          transition: opacity 0.2s;
          text-decoration: none;
        }
        .back-link:hover { opacity: 0.75; }
      `}</style>
    </main>
  );
}
