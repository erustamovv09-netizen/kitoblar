import Link from 'next/link';
import ContactForm from './ContactForm';

export const metadata = {
  title: 'Aloqa | Kitoblar Portali',
  description: 'Kitoblar Portali bilan bog\'laning - aloqa ma\'lumotlari va murojaat formasi',
};

export default function ContactPage() {
  return (
    <main className="contact-main">
      <section className="contact-hero">
        <div className="contact-hero-content">
          <div className="contact-badge">Aloqa</div>
          <h1 className="contact-title">
            Biz bilan <span className="contact-accent">bog&apos;laning</span>
          </h1>
          <p className="contact-desc">
            Savollaringiz, takliflaringiz yoki shikoyatlaringiz bormi? Biz sizdan eshitishdan mamnunmiz.
          </p>
        </div>
      </section>

      <section className="contact-body">
        <div className="contact-grid">
          {/* Contact Info */}
          <div className="contact-info">
            <h2 className="contact-info-title">Murojaat ma&apos;lumotlari</h2>

            <div className="contact-card">
              <div className="contact-card-icon">📧</div>
              <div>
                <div className="contact-card-label">Email</div>
                <a href="mailto:info@kitoblar.uz" className="contact-card-value">info@kitoblar.uz</a>
              </div>
            </div>

            <div className="contact-card">
              <div className="contact-card-icon">📱</div>
              <div>
                <div className="contact-card-label">Telegram</div>
                <a href="https://t.me/kitoblar" target="_blank" rel="noreferrer" className="contact-card-value">@kitoblar</a>
              </div>
            </div>

            <div className="contact-card">
              <div className="contact-card-icon">📍</div>
              <div>
                <div className="contact-card-label">Manzil</div>
                <span className="contact-card-value">Toshkent sh., O&apos;zbekiston</span>
              </div>
            </div>

            <div className="contact-card">
              <div className="contact-card-icon">🕐</div>
              <div>
                <div className="contact-card-label">Ish vaqti</div>
                <span className="contact-card-value">Du–Sha, 09:00–18:00</span>
              </div>
            </div>
          </div>

          {/* Client-side form */}
          <ContactForm />
        </div>
      </section>

      <div className="contact-back">
        <Link href="/" className="back-link">← Bosh sahifaga qaytish</Link>
      </div>

      <style>{`
        .contact-main {
          min-height: 100vh;
          padding-bottom: 4rem;
        }
        .contact-hero {
          background: linear-gradient(135deg, var(--bg-color) 0%, var(--search-bg) 100%);
          border-bottom: 1px solid var(--border-color);
          padding: 6rem 1.5rem 5rem;
          text-align: center;
        }
        .contact-hero-content { max-width: 600px; margin: 0 auto; }
        .contact-badge {
          display: inline-block;
          background: rgba(59, 130, 246, 0.15);
          color: var(--accent-blue);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 999px;
          padding: 0.35rem 1rem;
          font-size: 0.85rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-bottom: 1.5rem;
        }
        .contact-title {
          font-size: clamp(2rem, 5vw, 3rem);
          font-weight: 800;
          line-height: 1.15;
          color: var(--text-primary);
          margin-bottom: 1.25rem;
          letter-spacing: -0.03em;
        }
        .contact-accent {
          background: linear-gradient(90deg, var(--accent-blue), var(--accent-purple));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .contact-desc {
          color: var(--text-secondary);
          font-size: 1.05rem;
          line-height: 1.7;
        }
        .contact-body {
          padding: 4rem 1.5rem;
          max-width: 1100px;
          margin: 0 auto;
        }
        .contact-grid {
          display: grid;
          grid-template-columns: 1fr 1.6fr;
          gap: 3rem;
        }
        .contact-info-title {
          font-size: 1.3rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 1.75rem;
          letter-spacing: -0.02em;
        }
        .contact-info {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .contact-card {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 14px;
          padding: 1.25rem 1.5rem;
          transition: border-color 0.2s, transform 0.2s;
        }
        .contact-card:hover {
          border-color: rgba(59,130,246,0.3);
          transform: translateX(4px);
        }
        .contact-card-icon { font-size: 1.5rem; flex-shrink: 0; margin-top: 2px; }
        .contact-card-label {
          font-size: 0.8rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.3rem;
        }
        .contact-card-value {
          font-size: 0.98rem;
          color: var(--text-primary);
          font-weight: 500;
          text-decoration: none;
          transition: color 0.2s;
        }
        .contact-card-value:hover { color: var(--accent-blue); }
        .contact-form-wrap {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 20px;
          padding: 2.5rem;
        }
        .contact-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .form-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .form-label {
          font-size: 0.88rem;
          font-weight: 500;
          color: var(--text-secondary);
        }
        .form-input, .form-textarea {
          background: var(--search-bg);
          border: 1px solid var(--search-border);
          border-radius: 10px;
          padding: 0.8rem 1rem;
          color: var(--text-primary);
          font-size: 0.95rem;
          font-family: inherit;
          transition: border-color 0.2s;
          outline: none;
          resize: none;
        }
        .form-input:focus, .form-textarea:focus { border-color: var(--accent-blue); }
        .form-input::placeholder, .form-textarea::placeholder {
          color: var(--text-secondary);
          opacity: 0.6;
        }
        .form-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
          color: #fff;
          font-weight: 600;
          font-size: 1rem;
          padding: 0.9rem 2rem;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.2s;
          font-family: inherit;
        }
        .form-btn:hover { opacity: 0.88; transform: translateY(-2px); }
        .form-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .contact-back { text-align: center; padding: 1rem 1.5rem 0; }
        .back-link {
          color: var(--accent-blue);
          font-size: 0.95rem;
          transition: opacity 0.2s;
          text-decoration: none;
        }
        .back-link:hover { opacity: 0.75; }
        @media (max-width: 768px) {
          .contact-grid { grid-template-columns: 1fr; }
          .form-row { grid-template-columns: 1fr; }
          .contact-form-wrap { padding: 1.75rem; }
        }
      `}</style>
    </main>
  );
}
