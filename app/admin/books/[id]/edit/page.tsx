"use client";

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, Save, CheckCircle2, Link2, ImageIcon, Upload, X } from 'lucide-react';
import { api, Book } from '../../../../lib/api';

const CATEGORIES = ['Badiiy', 'Biznes', 'Ilmiy', 'Tarixiy', 'Detektiv', 'Bolalar adabiyoti', 'Jahon adabiyoti', 'Shaxsiy rivojlanish', 'Moliya', 'Falsafa', 'Psixologiya'];

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px',
  background: 'var(--search-bg)', border: '1px solid var(--search-border)',
  borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.92rem', fontFamily: 'inherit',
  transition: 'border-color 0.2s', outline: 'none'
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.8rem', fontWeight: 700,
  color: 'var(--text-secondary)',
  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px', display: 'block'
};

type ImageMode = 'url' | 'file';

export default function EditBookPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params?.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const txtInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [imageMode, setImageMode] = useState<ImageMode>('url');
  const [previewUrl, setPreviewUrl] = useState('');

  const [form, setForm] = useState({
    title: '', author: '', category: 'Badiiy', price: '', description: '',
    pages: '', language: "O'zbek tili", publishedYear: new Date().getFullYear().toString(),
    hasAudio: false, audioUrl: '', imageUrl: '', rating: '0', content: ''
  });

  useEffect(() => {
    async function loadBook() {
      if (!bookId) return;

      // Yordamchi funksiya — formani kitob ma'lumotlari bilan to'ldirish
      function fillForm(b: any) {
        setForm({
          title: b.title || '',
          author: b.author || '',
          category: b.category || 'Badiiy',
          price: b.price || '',
          description: b.description || '',
          pages: String(b.pages || ''),
          language: b.language || "O'zbek tili",
          publishedYear: String(b.publishedYear || b.year || new Date().getFullYear()),
          hasAudio: b.hasAudio || false,
          audioUrl: b.audioUrl || '',
          imageUrl: b.image || b.imageUrl || '',
          rating: String(b.rating || '0'),
          content: b.content || '',
        });
        setPreviewUrl(b.image || b.imageUrl || '');
      }

      // 1. Avval localStorage da admin tomonidan saqlangan versiyani tekshir
      try {
        const stored = localStorage.getItem('admin_books');
        if (stored) {
          const arr: any[] = JSON.parse(stored);
          const local = arr.find(b => String(b.id) === String(bookId));
          if (local) {
            fillForm(local);
            setLoading(false);
            return; // Topildi — API ga bormasdan to'xtat
          }
        }
      } catch {}

      // 2. API dan yuklab ol (backend yoki fallback)
      const book = await api.getBook(bookId);
      if (book) {
        fillForm(book);
      } else {
        setError('Kitob topilmadi. Sahifa orqaga qaytib boshqa kitobni tanlang.');
      }
      setLoading(false);
    }
    loadBook();
  }, [bookId]);

  const set = (key: string, val: string | boolean) => setForm(prev => ({ ...prev, [key]: val }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError("Faqat rasm fayllari qabul qilinadi (JPG, PNG, WEBP...)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Rasm hajmi 5MB dan kichik bo'lishi kerak.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setPreviewUrl(dataUrl);
      set('imageUrl', dataUrl);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setPreviewUrl('');
    set('imageUrl', '');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    set('imageUrl', val);
    setPreviewUrl(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim() || !form.author.trim()) {
      setError("Kitob nomi va muallif talab qilinadi.");
      return;
    }
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    // Save edited version to localStorage (demo)
    const stored: any[] = JSON.parse(localStorage.getItem('admin_books') || '[]');
    const existingIdx = stored.findIndex(b => b.id === bookId);
    const updated = {
      id: bookId,
      ...form,
      pages: Number(form.pages) || 0,
      publishedYear: Number(form.publishedYear),
      rating: Number(form.rating) || 0,
      image: form.imageUrl || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop',
      content: form.content || '',
    };
    if (existingIdx >= 0) {
      stored[existingIdx] = updated;
    } else {
      stored.unshift(updated);
    }
    localStorage.setItem('admin_books', JSON.stringify(stored));
    setSaving(false);
    setSuccess(true);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--text-secondary)', gap: '12px' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <span>Ma&apos;lumotlar yuklanmoqda...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Kitob topilmagan holat
  if (!form.title && !loading && error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1.25rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem' }}>📚</div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Kitob topilmadi</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '360px' }}>
          Bu kitob ma&apos;lumotlari yuklanmadi. Backend serverini tekshiring yoki kitobni qayta qo&apos;shing.
        </p>
        <Link href="/admin/books" style={{ padding: '10px 20px', background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', borderRadius: '10px', color: '#fff', fontWeight: 700, textDecoration: 'none' }}>
          Kitoblar ro&apos;yxatiga qaytish
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1.5rem', textAlign: 'center' }}>
        <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(16,185,129,0.2)' }}>
          <CheckCircle2 size={44} style={{ color: '#10b981' }} />
        </div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>O&apos;zgarishlar saqlandi!</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={() => setSuccess(false)} style={{ padding: '10px 20px', background: 'var(--search-bg)', border: '1px solid var(--border-color)', borderRadius: '10px', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Davom ettirish
          </button>
          <Link href="/admin/books" style={{ padding: '10px 20px', background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', borderRadius: '10px', color: '#fff', fontWeight: 700, textDecoration: 'none' }}>
            Kitoblar ro&apos;yxati
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link href="/admin/books" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', textDecoration: 'none' }}>
        <ArrowLeft size={18} />
        Kitoblar ro&apos;yxatiga qaytish
      </Link>

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BookOpen size={28} style={{ color: 'var(--accent-blue)' }} />
          Kitobni tahrirlash
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>ID: {bookId}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gap: '1.5rem' }}>

          {/* Basic info */}
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '16px', padding: '1.5rem', backdropFilter: 'blur(8px)' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '1rem' }}>Asosiy ma&apos;lumotlar</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Kitob nomi *</label>
                <input required style={inputStyle} placeholder="Kitob nomi" value={form.title} onChange={e => set('title', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Muallif *</label>
                <input required style={inputStyle} placeholder="Muallif ismi" value={form.author} onChange={e => set('author', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Kategoriya</label>
                <select style={inputStyle} value={form.category} onChange={e => set('category', e.target.value)}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Narxi</label>
                <input style={inputStyle} placeholder="45,000 so'm" value={form.price} onChange={e => set('price', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Reyting (0-5)</label>
                <input type="number" min="0" max="5" step="0.1" style={inputStyle} value={form.rating} onChange={e => set('rating', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Sahifalar soni</label>
                <input type="number" style={inputStyle} placeholder="320" value={form.pages} onChange={e => set('pages', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Nashr yili</label>
                <input type="number" style={inputStyle} placeholder="2024" value={form.publishedYear} onChange={e => set('publishedYear', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Til</label>
                <input style={inputStyle} placeholder="O'zbek tili" value={form.language} onChange={e => set('language', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Description */}
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '16px', padding: '1.5rem', backdropFilter: 'blur(8px)' }}>
            <label style={labelStyle}>Tavsif</label>
            <textarea
              style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }}
              placeholder="Kitob haqida qisqacha ma'lumot..."
              value={form.description}
              onChange={e => set('description', e.target.value)}
            />
          </div>

          {/* Book content */}
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '16px', padding: '1.5rem', backdropFilter: 'blur(8px)' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '4px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={18} style={{ color: 'var(--accent-blue)' }} />
              Kitob matni (o&apos;qish uchun)
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              O&apos;quvchilar o&apos;qishi uchun kitob matnini kiriting. Boblarni ajratish uchun <code style={{ background: 'rgba(79,142,247,0.1)', padding: '1px 6px', borderRadius: '4px', color: 'var(--accent-blue)' }}>--- Bob nomi ---</code> ishlating.
            </p>
            <textarea
              style={{ ...inputStyle, minHeight: '300px', resize: 'vertical', fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: '1.7' }}
              placeholder={`--- 1-Bob: Muqaddima ---
Bu yerda matn...`}
              value={form.content}
              onChange={e => set('content', e.target.value)}
            />
            {form.content && (
              <p style={{ fontSize: '0.78rem', color: '#10b981', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                📖 {form.content.split('\n').filter((l: string) => l.trim().match(/^---.*---$/)).length || 1} ta bob · {form.content.length.toLocaleString()} belgi
              </p>
            )}
            {/* TXT fayl yuklash */}
            <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <input
                ref={txtInputRef}
                type="file"
                accept=".txt,text/plain"
                style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = ev => set('content', (ev.target?.result as string) || '');
                  reader.readAsText(file, 'UTF-8');
                  if (txtInputRef.current) txtInputRef.current.value = '';
                }}
              />
              <button
                type="button"
                onClick={() => txtInputRef.current?.click()}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '8px 14px', background: 'rgba(79,142,247,0.1)',
                  border: '1px dashed rgba(79,142,247,0.4)', borderRadius: '8px',
                  color: 'var(--accent-blue)', fontSize: '0.82rem', fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit'
                }}
              >
                <Upload size={14} /> .txt fayl yuklash
              </button>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                yoki yuqoridagi maydonga bevosita matn paste qiling
              </span>
            </div>
          </div>

          {/* Cover Image */}
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '16px', padding: '1.5rem', backdropFilter: 'blur(8px)' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Upload size={18} style={{ color: 'var(--accent-blue)' }} />
              Muqova rasmi
            </h3>

            {/* Mode switcher */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem' }}>
              {(['url', 'file'] as ImageMode[]).map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => { setImageMode(mode); clearImage(); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 16px', borderRadius: '8px', fontWeight: 600,
                    fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit',
                    border: imageMode === mode ? '1.5px solid var(--accent-blue)' : '1px solid var(--border-color)',
                    background: imageMode === mode ? 'rgba(79,142,247,0.1)' : 'var(--search-bg)',
                    color: imageMode === mode ? 'var(--accent-blue)' : 'var(--text-secondary)',
                    transition: 'all 0.2s'
                  }}
                >
                  {mode === 'url' ? <Link2 size={15} /> : <ImageIcon size={15} />}
                  {mode === 'url' ? 'Havola (URL)' : 'Galereyadan tanlash'}
                </button>
              ))}
            </div>

            {imageMode === 'url' ? (
              <div>
                <input
                  style={inputStyle}
                  placeholder="https://example.com/rasm.jpg"
                  value={form.imageUrl}
                  onChange={handleUrlChange}
                />
                {previewUrl && (
                  <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <img
                      src={previewUrl}
                      alt="Preview"
                      style={{ width: '70px', height: '95px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-color)', flexShrink: 0 }}
                      onError={() => setPreviewUrl('')}
                    />
                    <button type="button" onClick={clearImage} style={{ fontSize: '0.8rem', color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <X size={14} /> Rasmni olib tashlash
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed var(--search-border)', borderRadius: '12px',
                    padding: '2rem', textAlign: 'center', cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: previewUrl ? 'transparent' : 'var(--search-bg)'
                  }}
                  onMouseEnter={e => { if (!previewUrl) (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-blue)'; }}
                  onMouseLeave={e => { if (!previewUrl) (e.currentTarget as HTMLElement).style.borderColor = 'var(--search-border)'; }}
                >
                  {previewUrl ? (
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <img
                        src={previewUrl}
                        alt="Preview"
                        style={{ maxHeight: '200px', maxWidth: '150px', borderRadius: '10px', objectFit: 'cover', display: 'block', margin: '0 auto' }}
                      />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); clearImage(); }}
                        style={{ position: 'absolute', top: '-8px', right: '-8px', width: '24px', height: '24px', borderRadius: '50%', background: '#ef4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(79,142,247,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                        <Upload size={24} style={{ color: 'var(--accent-blue)' }} />
                      </div>
                      <p style={{ fontWeight: 600, marginBottom: '4px' }}>Rasm tanlash uchun bosing</p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>JPG, PNG, WEBP — maksimal 5MB</p>
                    </>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                {previewUrl && (
                  <button type="button" onClick={() => fileInputRef.current?.click()} style={{ marginTop: '8px', fontSize: '0.82rem', color: 'var(--accent-blue)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                    Boshqa rasm tanlash
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Audio */}
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '16px', padding: '1.5rem', backdropFilter: 'blur(8px)' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1rem' }}>Audio</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: form.hasAudio ? '1rem' : '0' }}>
              <input
                type="checkbox"
                id="has-audio"
                checked={form.hasAudio}
                onChange={e => set('hasAudio', e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent-blue)' }}
              />
              <label htmlFor="has-audio" style={{ fontWeight: 600, cursor: 'pointer' }}>Audio format mavjud</label>
            </div>
            {form.hasAudio && (
              <div>
                <label style={labelStyle}>Audio fayl URL</label>
                <input style={inputStyle} placeholder="https://..." value={form.audioUrl} onChange={e => set('audioUrl', e.target.value)} />
              </div>
            )}
          </div>

          {error && (
            <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', color: '#f87171', fontSize: '0.88rem' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={saving} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '14px', background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
            border: 'none', borderRadius: '12px', color: '#fff', fontWeight: 700, fontSize: '1rem',
            cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
            boxShadow: '0 4px 20px rgba(79,142,247,0.3)', fontFamily: 'inherit',
            transition: 'opacity 0.2s, transform 0.2s'
          }}>
            {saving
              ? <span style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
              : <><Save size={18} /> O&apos;zgarishlarni saqlash</>
            }
          </button>
        </div>
      </form>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
