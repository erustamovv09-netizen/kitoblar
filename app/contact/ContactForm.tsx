"use client";

import React, { useState } from 'react';

export default function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });

      if (!res.ok) throw new Error('Yuborishda xatolik');

      setSubmitted(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      setTimeout(() => setSubmitted(false), 6000);
    } catch {
      setError('Xabar yuborilmadi. Iltimos qayta urinib ko\'ring.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-form-wrap">
      <h2 className="contact-info-title">Xabar yuboring</h2>

      {submitted && (
        <div style={{
          padding: '1rem 1.25rem',
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#10b981',
          borderRadius: '10px',
          fontSize: '0.92rem',
          fontWeight: 600,
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          ✓ Xabaringiz yuborildi! Tez orada siz bilan bog&apos;lanamiz.
        </div>
      )}

      {error && (
        <div style={{
          padding: '1rem 1.25rem',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          color: '#f87171',
          borderRadius: '10px',
          fontSize: '0.92rem',
          fontWeight: 600,
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          ✗ {error}
        </div>
      )}

      <form className="contact-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-field">
            <label htmlFor="name-input" className="form-label">Ismingiz</label>
            <input
              id="name-input"
              type="text"
              placeholder="Ism Familiya"
              className="form-input"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="email-input" className="form-label">Email</label>
            <input
              id="email-input"
              type="email"
              placeholder="email@example.com"
              className="form-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="form-field">
          <label htmlFor="subject-input" className="form-label">Mavzu</label>
          <input
            id="subject-input"
            type="text"
            placeholder="Xabar mavzusi"
            className="form-input"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="message-input" className="form-label">Xabaringiz</label>
          <textarea
            id="message-input"
            placeholder="Xabaringizni yozing..."
            className="form-textarea"
            rows={6}
            value={message}
            onChange={e => setMessage(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="form-btn" disabled={loading}>
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                width: '16px', height: '16px',
                border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: '#fff',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
                display: 'inline-block',
              }} />
              Yuborilmoqda...
            </span>
          ) : 'Yuborish →'}
        </button>
      </form>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
