"use client";

import React, { useState } from 'react';

export default function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API delay
    setTimeout(() => {
      setSubmitted(true);
      setLoading(false);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      
      // Hide success message after 5 seconds
      setTimeout(() => setSubmitted(false), 5000);
    }, 800);
  };

  return (
    <div className="contact-form-wrap">
      <h2 className="contact-info-title">Xabar yuboring</h2>
      
      {submitted && (
        <div style={{
          padding: '1rem',
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#10b981',
          borderRadius: '10px',
          fontSize: '0.92rem',
          fontWeight: 600,
          marginBottom: '1.5rem',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          ✓ Xabaringiz yuborildi! Tez orada siz bilan bog'lanamiz.
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
          {loading ? 'Yuborilmoqda...' : 'Yuborish →'}
        </button>
      </form>
    </div>
  );
}
