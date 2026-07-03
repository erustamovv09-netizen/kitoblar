import Link from 'next/link';

export const metadata = {
  title: 'Maxfiylik siyosati | Kitoblar Portali',
  description: 'Kitoblar Portali maxfiylik siyosati — ma\'lumotlaringiz qanday saqlanadi',
};

const sections = [
  {
    emoji: '📦',
    title: '1. Toplanadigan ma\'lumotlar',
    text: `Biz quyidagi maʼlumotlarni toʻplaymiz: ism, email manzil, parol (shifrlangan holda), foydalanish tarixi, brauzer turi va IP manzil. Ushbu maʼlumotlar xizmatimizni yaxshilash va personallashtirilgan tajriba yaratish uchun ishlatiladi.`,
  },
  {
    emoji: '🎯',
    title: '2. Ma\'lumotlardan foydalanish maqsadi',
    text: `Toʻplangan maʼlumotlar: sayt funksionalligini taʼminlash, sizga mos kitoblarni tavsiya qilish, xizmat sifatini oshirish, qonuniy majburiyatlarni bajarish va xavfsizlikni taʼminlash uchun ishlatiladi.`,
  },
  {
    emoji: '🔐',
    title: '3. Ma\'lumotlarni himoya qilish',
    text: `Biz zamonaviy shifrlash texnologiyalaridan foydalanib shaxsiy maʼlumotlaringizni himoya qilamiz. SSL/TLS protokoli orqali barcha maʼlumotlar shifrlangan holda uzatiladi. Server xavfsizligi muntazam tekshirib boriladi.`,
  },
  {
    emoji: '🤝',
    title: '4. Uchinchi shaxslar bilan baham ko\'rish',
    text: `Biz sizning maʼlumotlaringizni sotmaymiz yoki ijaraga bermaymiz. Faqat xizmatlarimizni taʼminlovchi ishonchli hamkorlar (toʻlov tizimlari, analytics) bilan cheklangan maʼlumot ulashilishi mumkin — ular ham maxfiylik standartlariga amal qiladi.`,
  },
  {
    emoji: '🍪',
    title: '5. Cookie fayllari',
    text: `Saytimiz cookie fayllaridan foydalanadi. Cookie — brauzeringizda saqlanadigan kichik matn fayllar. Ular tizimga kirishni osonlashtiradi va sayt ishlashini yaxshilaydi. Brauzer sozlamalarida cookie fayllarini oʻchirib qoʻyishingiz mumkin.`,
  },
  {
    emoji: '⚖️',
    title: '6. Sizning huquqlaringiz',
    text: `Siz istalgan vaqtda shaxsiy maʼlumotlaringizni ko'rish, tahrirlash yoki oʻchirish huquqiga egasiz. Buning uchun hisob sozlamalariga oʻting yoki biz bilan bog'laning. Maʼlumotlaringizni eksport qilishni ham talab qilishingiz mumkin.`,
  },
];

export default function PrivacyPage() {
  return (
    <main className="privacy-main">
      <section className="privacy-hero">
        <div className="privacy-hero-inner">
          <div className="privacy-badge">Maxfiylik siyosati</div>
          <h1 className="privacy-title">
            Maʼlumotlaringiz <span className="privacy-accent">xavfsizligi</span>
          </h1>
          <p className="privacy-desc">Oxirgi yangilangan: 1-yanvar 2024-yil</p>
        </div>
      </section>

      <div className="privacy-body">
        <div className="privacy-intro">
          Biz sizning maxfiyligingizni jiddiy qabul qilamiz. Ushbu siyosat maʼlumotlaringiz qanday toʻplanishi,
          ishlatilishi va himoya qilinishini tushuntiradi.
        </div>

        <div className="privacy-sections">
          {sections.map((s) => (
            <div key={s.title} className="privacy-section">
              <div className="privacy-section-header">
                <span className="privacy-emoji">{s.emoji}</span>
                <h2 className="privacy-section-title">{s.title}</h2>
              </div>
              <p className="privacy-section-text">{s.text}</p>
            </div>
          ))}
        </div>

        <div className="privacy-highlight">
          <div className="privacy-highlight-icon">🛡️</div>
          <div>
            <div className="privacy-highlight-title">Sizning maxfiyligingiz — bizning ustuvorligimiz</div>
            <div className="privacy-highlight-text">
              Savollaringiz boʻlsa, <a href="/contact" className="privacy-link">Aloqa sahifasi</a> orqali murojaat qiling.
              30 kun ichida javob berishga harakat qilamiz.
            </div>
          </div>
        </div>
      </div>

      <div className="privacy-back">
        <Link href="/" className="back-link">← Bosh sahifaga qaytish</Link>
      </div>

      <style>{`
        .privacy-main {
          min-height: 100vh;
          padding-bottom: 4rem;
        }
        .privacy-hero {
          background: linear-gradient(135deg, var(--bg-color) 0%, var(--search-bg) 100%);
          border-bottom: 1px solid var(--border-color);
          padding: 6rem 1.5rem 5rem;
          text-align: center;
        }
        .privacy-hero-inner { max-width: 600px; margin: 0 auto; }
        .privacy-badge {
          display: inline-block;
          background: rgba(16, 185, 129, 0.12);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 999px;
          padding: 0.35rem 1rem;
          font-size: 0.85rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-bottom: 1.5rem;
        }
        .privacy-title {
          font-size: clamp(2rem, 5vw, 3rem);
          font-weight: 800;
          line-height: 1.15;
          color: var(--text-primary);
          margin-bottom: 1rem;
          letter-spacing: -0.03em;
        }
        .privacy-accent {
          background: linear-gradient(90deg, #10b981, var(--accent-blue));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .privacy-desc {
          color: var(--text-secondary);
          font-size: 0.95rem;
        }
        .privacy-body {
          max-width: 820px;
          margin: 0 auto;
          padding: 3.5rem 1.5rem;
        }
        .privacy-intro {
          color: var(--text-secondary);
          font-size: 1.05rem;
          line-height: 1.75;
          margin-bottom: 2.5rem;
          padding: 1.5rem 2rem;
          background: rgba(16,185,129,0.06);
          border-left: 3px solid #10b981;
          border-radius: 0 12px 12px 0;
        }
        .privacy-sections {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }
        .privacy-section {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 16px;
          padding: 1.75rem 2rem;
          transition: border-color 0.2s;
        }
        .privacy-section:hover {
          border-color: rgba(16,185,129,0.25);
        }
        .privacy-section-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        .privacy-emoji { font-size: 1.4rem; }
        .privacy-section-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.01em;
        }
        .privacy-section-text {
          color: var(--text-secondary);
          font-size: 0.97rem;
          line-height: 1.75;
        }
        .privacy-highlight {
          display: flex;
          align-items: flex-start;
          gap: 1.25rem;
          background: linear-gradient(135deg, rgba(16,185,129,0.08), rgba(59,130,246,0.08));
          border: 1px solid rgba(16,185,129,0.25);
          border-radius: 16px;
          padding: 1.75rem 2rem;
        }
        .privacy-highlight-icon { font-size: 1.75rem; flex-shrink: 0; margin-top: 2px; }
        .privacy-highlight-title {
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 0.4rem;
        }
        .privacy-highlight-text {
          color: var(--text-secondary);
          font-size: 0.95rem;
          line-height: 1.6;
        }
        .privacy-link {
          color: var(--accent-blue);
          text-decoration: none;
          transition: opacity 0.2s;
        }
        .privacy-link:hover { opacity: 0.75; }
        .privacy-back {
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
