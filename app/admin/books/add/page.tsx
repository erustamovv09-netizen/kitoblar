"use client";

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, BookOpen, Upload, Save, CheckCircle2, Link2, ImageIcon, X, Server, HardDrive } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop';
const STATIC_CATEGORIES = ['Badiiy', 'Biznes', 'Ilmiy', 'Tarixiy', 'Detektiv', 'Bolalar adabiyoti', 'Jahon adabiyoti', 'Shaxsiy rivojlanish', 'Moliya', 'Falsafa', 'Psixologiya'];

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
interface Category { id: number; name: string; slug: string; }

export default function AddBookPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const txtInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: '', author: '', price: '', description: '',
    pages: '', language: "O'zbek tili", publishedYear: new Date().getFullYear().toString(),
    hasAudio: false, audioUrl: '', imageUrl: '', isWeeklyTop: false,
    content: ''
  });
  const [imageMode, setImageMode] = useState<ImageMode>('url');
  const [previewUrl, setPreviewUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [savedToBackend, setSavedToBackend] = useState(false);
  const [error, setError] = useState('');

  // Categories from backend
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  // Fallback category name when backend is unavailable
  const [staticCategory, setStaticCategory] = useState('Badiiy');

  // Fetch categories from Django backend
  useEffect(() => {
    fetch(`${API_BASE}/categories/`, { signal: AbortSignal.timeout(3000) })
      .then(r => r.json())
      .then((data: Category[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data);
          setSelectedCategoryId(data[0].id);
          setCategoriesLoaded(true);
        }
      })
      .catch(() => {
        // Backend unavailable, use static list
        setCategoriesLoaded(false);
      });
  }, []);

  const set = (key: string, val: string | boolean) => setForm(prev => ({ ...prev, [key]: val }));

  // Compress image for localStorage fallback only
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX = 600;
          let { width, height } = img;
          if (width > MAX || height > MAX) {
            if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
            else { width = Math.round(width * MAX / height); height = MAX; }
          }
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.src = ev.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  // File picker — stores actual File object for backend upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError("Faqat rasm fayllari qabul qilinadi (JPG, PNG, WEBP...)");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError("Rasm hajmi 15MB dan kichik bo'lishi kerak.");
      return;
    }
    setError('');
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setPreviewUrl('');
    setImageFile(null);
    set('imageUrl', '');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    set('imageUrl', val);
    setPreviewUrl(val);
    setImageFile(null);
  };

  const resetForm = () => {
    setSuccess(false);
    setSavedToBackend(false);
    setPreviewUrl('');
    setImageFile(null);
    setForm({
      title: '', author: '', price: '', description: '',
      pages: '', language: "O'zbek tili", publishedYear: new Date().getFullYear().toString(),
      hasAudio: false, audioUrl: '', imageUrl: '', isWeeklyTop: false
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim() || !form.author.trim()) {
      setError("Kitob nomi va muallif talab qilinadi.");
      return;
    }
    setLoading(true);

    // ── 1. Try Django Backend ─────────────────────────────────────
    if (selectedCategoryId) {
      try {
        const fd = new FormData();
        fd.append('title', form.title.trim());
        fd.append('author', form.author.trim());
        fd.append('category', String(selectedCategoryId));
        fd.append('price', String(Number(form.price.replace(/\D/g, '')) || 0));
        fd.append('description', form.description);
        fd.append('pages', String(Number(form.pages) || 0));
        fd.append('language', form.language || "O'zbek tili");
        fd.append('year', form.publishedYear || String(new Date().getFullYear()));
        fd.append('rating', '0');
        fd.append('is_weekly_top', form.isWeeklyTop ? 'true' : 'false');
        fd.append('is_trending', 'true');
        fd.append('content', form.content || '');

        // Image: prefer actual file; for URL mode, try to fetch & re-upload
        if (imageFile) {
          fd.append('cover_image', imageFile);
        } else if (form.imageUrl) {
          try {
            const imgResp = await fetch(form.imageUrl, { signal: AbortSignal.timeout(4000) });
            const blob = await imgResp.blob();
            const ext = blob.type.includes('png') ? 'png' : 'jpg';
            fd.append('cover_image', new File([blob], `cover.${ext}`, { type: blob.type }));
          } catch {
            // URL not fetchable — backend call will still proceed (cover_image missing)
          }
        }

        const response = await fetch(`${API_BASE}/books/`, {
          method: 'POST',
          body: fd,
          signal: AbortSignal.timeout(10000),
        });

        if (response.ok || response.status === 201) {
          setLoading(false);
          setSavedToBackend(true);
          setSuccess(true);
          return;
        }
        // Non-2xx — fall through to localStorage
      } catch {
        // Network error — fall through to localStorage
      }
    }

    // ── 2. Fallback: localStorage ─────────────────────────────────
    let imageForLocal = form.imageUrl || FALLBACK_IMAGE;
    if (imageFile) {
      imageForLocal = await compressImage(imageFile);
    }
    const categoryName = categoriesLoaded
      ? (categories.find(c => c.id === selectedCategoryId)?.name || staticCategory)
      : staticCategory;

    const stored: any[] = JSON.parse(localStorage.getItem('admin_books') || '[]');
    const updatedStored = form.isWeeklyTop
      ? stored.map((b: any) => ({ ...b, isWeeklyTop: false, is_weekly_top: false }))
      : stored;
    updatedStored.unshift({
      ...form,
      id: Date.now().toString(),
      category: categoryName,
      price: form.price ? `${Number(form.price.replace(/\D/g, '')).toLocaleString('uz-UZ')} so'm` : "0 so'm",
      rating: 0,
      pages: Number(form.pages) || 0,
      publishedYear: Number(form.publishedYear),
      image: imageForLocal,
      is_weekly_top: form.isWeeklyTop,
    });
    localStorage.setItem('admin_books', JSON.stringify(updatedStored));
    setLoading(false);
    setSavedToBackend(false);
    setSuccess(true);
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (success) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1.5rem', textAlign: 'center' }}>
        <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: savedToBackend ? 'rgba(16,185,129,0.12)' : 'rgba(79,142,247,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: savedToBackend ? '0 0 30px rgba(16,185,129,0.2)' : '0 0 30px rgba(79,142,247,0.2)' }}>
          <CheckCircle2 size={44} style={{ color: savedToBackend ? '#10b981' : 'var(--accent-blue)' }} />
        </div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Kitob muvaffaqiyatli qo&apos;shildi!</h2>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '8px 16px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600,
          background: savedToBackend ? 'rgba(16,185,129,0.1)' : 'rgba(79,142,247,0.1)',
          color: savedToBackend ? '#10b981' : 'var(--accent-blue)',
          border: `1px solid ${savedToBackend ? 'rgba(16,185,129,0.3)' : 'rgba(79,142,247,0.3)'}`
        }}>
          {savedToBackend ? <><Server size={15} /> Backend bazasiga saqlandi</> : <><HardDrive size={15} /> Lokal xotirada saqlandi</>}
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={resetForm} style={{ padding: '10px 20px', background: 'var(--search-bg)', border: '1px solid var(--border-color)', borderRadius: '10px', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Yana qo&apos;shish
          </button>
          <Link href="/admin/books" style={{ padding: '10px 20px', background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', borderRadius: '10px', color: '#fff', fontWeight: 700, textDecoration: 'none' }}>
            Kitoblar ro&apos;yxati
          </Link>
        </div>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────
  return (
    <div>
      <Link href="/admin/books" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', textDecoration: 'none' }}>
        <ArrowLeft size={18} />
        Kitoblar ro&apos;yxatiga qaytish
      </Link>

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BookOpen size={28} style={{ color: 'var(--accent-blue)' }} />
          Yangi kitob qo&apos;shish
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {categoriesLoaded
            ? <><Server size={14} style={{ color: '#10b981' }} /> Backend bilan ulandi — ma&apos;lumot to&apos;g&apos;ridan-to&apos;g&apos;ri saqlanadi</>
            : <><HardDrive size={14} style={{ color: 'var(--accent-blue)' }} /> Backend offline — lokal xotirada saqlanadi</>}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gap: '1.5rem' }}>

          {/* Basic info */}
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '16px', padding: '1.5rem', backdropFilter: 'blur(8px)' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '1rem' }}>Asosiy ma&apos;lumotlar</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Kitob nomi *</label>
                <input required style={inputStyle} placeholder="Kitob nomi" value={form.title} onChange={e => set('title', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Muallif *</label>
                <input required style={inputStyle} placeholder="Muallif ismi" value={form.author} onChange={e => set('author', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>
                  Kategoriya
                  {categoriesLoaded && <span style={{ marginLeft: '6px', color: '#10b981', fontSize: '0.7rem' }}>● Backend</span>}
                </label>
                {categoriesLoaded ? (
                  <select
                    style={inputStyle}
                    value={selectedCategoryId ?? ''}
                    onChange={e => setSelectedCategoryId(Number(e.target.value))}
                  >
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                ) : (
                  <select style={inputStyle} value={staticCategory} onChange={e => setStaticCategory(e.target.value)}>
                    {STATIC_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                )}
              </div>
              <div>
                <label style={labelStyle}>Narxi (so&apos;m)</label>
                <input style={inputStyle} placeholder="45000" value={form.price} onChange={e => set('price', e.target.value)} />
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

          {/* Book content — actual text for the reader */}
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '16px', padding: '1.5rem', backdropFilter: 'blur(8px)' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '4px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={18} style={{ color: 'var(--accent-blue)' }} />
              Kitob matni (o&apos;qish uchun)
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              O&apos;quvchilar o&apos;qishi uchun kitob matnini kiriting. Boblarni ajratish uchun:
              <code style={{ background: 'rgba(79,142,247,0.1)', padding: '1px 6px', borderRadius: '4px', marginLeft: '4px', fontSize: '0.78rem', color: 'var(--accent-blue)' }}>--- Bob nomi ---</code>
            </p>
            <textarea
              style={{ ...inputStyle, minHeight: '300px', resize: 'vertical', fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: '1.7' }}
              placeholder={`--- 1-Bob: Muqaddima ---
Bu yerda birinchi bob matni yoziladi...

--- 2-Bob: Asosiy qism ---
Bu yerda ikkinchi bob matni yoziladi...`}
              value={form.content}
              onChange={e => set('content', e.target.value)}
            />
             {form.content && (
              <p style={{ fontSize: '0.78rem', color: '#10b981', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Server size={12} /> {form.content.split('\n').filter(l => l.trim().match(/^---.*---$/)).length || 1} ta bob aniqlandi · {form.content.length.toLocaleString()} belgi
              </p>
            )}

            {/* TXT fayl yuklash */}
            <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
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

          {/* Cover Image — URL or File */}
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
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                  Kitob muqovasining to&apos;liq URL manzilini kiriting
                </p>
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
                        style={{
                          position: 'absolute', top: '-8px', right: '-8px',
                          width: '24px', height: '24px', borderRadius: '50%',
                          background: '#ef4444', border: 'none', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff'
                        }}
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
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>JPG, PNG, WEBP — maksimal 15MB</p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                {imageFile && (
                  <p style={{ marginTop: '8px', fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Server size={13} /> To&apos;liq sifatda backend&apos;ga yuklanadi
                  </p>
                )}
                {previewUrl && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{ marginTop: '4px', fontSize: '0.82rem', color: 'var(--accent-blue)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    Boshqa rasm tanlash
                  </button>
                )}
              </div>
            )}

            {/* Preview for URL mode */}
            {imageMode === 'url' && previewUrl && (
              <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ position: 'relative', width: '80px', height: '110px', flexShrink: 0, borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  <Image src={previewUrl} alt="Preview" fill style={{ objectFit: 'cover' }} unoptimized onError={() => setPreviewUrl('')} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Muqova ko&apos;rinishi:</p>
                  <button type="button" onClick={clearImage} style={{ fontSize: '0.8rem', color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <X size={14} /> Tozalash
                  </button>
                </div>
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

          {/* Weekly Top */}
          <div style={{
            background: form.isWeeklyTop
              ? 'linear-gradient(135deg, rgba(250,204,21,0.08), rgba(251,146,60,0.08))'
              : 'var(--card-bg)',
            border: form.isWeeklyTop
              ? '1.5px solid rgba(250,204,21,0.4)'
              : '1px solid var(--card-border)',
            borderRadius: '16px', padding: '1.5rem', backdropFilter: 'blur(8px)',
            transition: 'all 0.3s'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '1.25rem' }}>⭐</span>
                  <h3 style={{ fontWeight: 700, fontSize: '1rem', margin: 0 }}>Hafta kitobi</h3>
                  {form.isWeeklyTop && (
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px',
                      background: 'rgba(250,204,21,0.15)', color: '#fbbf24',
                      borderRadius: '20px', border: '1px solid rgba(250,204,21,0.3)',
                      letterSpacing: '0.04em'
                    }}>FAOL</span>
                  )}
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.83rem', margin: 0 }}>
                  Bosh sahifada &ldquo;Hafta kitobi&rdquo; sifatida ko&apos;rsatiladi
                </p>
              </div>
              <button
                type="button"
                onClick={() => set('isWeeklyTop', !form.isWeeklyTop)}
                style={{
                  position: 'relative', width: '52px', height: '28px',
                  borderRadius: '14px', border: 'none', cursor: 'pointer',
                  background: form.isWeeklyTop
                    ? 'linear-gradient(135deg, #fbbf24, #f97316)'
                    : 'var(--search-border)',
                  transition: 'background 0.3s', flexShrink: 0
                }}
                aria-label="Hafta kitobi toggle"
              >
                <span style={{
                  position: 'absolute', top: '3px',
                  left: form.isWeeklyTop ? '27px' : '3px',
                  width: '22px', height: '22px', borderRadius: '50%',
                  background: '#fff', transition: 'left 0.3s',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
                }} />
              </button>
            </div>
          </div>

          {error && (
            <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', color: '#f87171', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '14px', background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
            border: 'none', borderRadius: '12px', color: '#fff', fontWeight: 700, fontSize: '1rem',
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
            boxShadow: '0 4px 20px rgba(79,142,247,0.3)', fontFamily: 'inherit',
            transition: 'opacity 0.2s, transform 0.2s'
          }}>
            {loading
              ? <span style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
              : <><Save size={18} /> Saqlash</>
            }
          </button>
        </div>
      </form>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
