"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <main style={{
      minHeight: '85vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.5rem',
      backgroundColor: 'var(--bg-color)',
      transition: 'background-color 0.3s ease'
    }}>
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          maxWidth: '520px',
          width: '100%',
          backgroundColor: 'var(--card-bg, rgba(31, 34, 43, 0.4))',
          border: '1px solid var(--card-border, rgba(45, 49, 63, 0.4))',
          borderRadius: '24px',
          padding: '3rem 2rem',
          textAlign: 'center',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          backdropFilter: 'blur(8px)'
        }}
      >
        {/* Animated Icon */}
        <div style={{
          display: 'inline-flex',
          padding: '1.25rem',
          borderRadius: '50%',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          color: '#ef4444',
          marginBottom: '1.5rem'
        }}>
          <BookOpen size={48} />
        </div>

        <h1 style={{
          fontSize: '3rem',
          fontWeight: 800,
          color: 'var(--text-primary)',
          margin: '0 0 0.5rem 0',
          letterSpacing: '-0.03em'
        }}>
          404
        </h1>
        
        <h2 style={{
          fontSize: '1.4rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          margin: '0 0 1rem 0'
        }}>
          Sahifa topilmadi
        </h2>

        <p style={{
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          fontSize: '1rem',
          margin: '0 0 2rem 0'
        }}>
          Siz qidirayotgan sahifa o&apos;chirilgan, nomi o&apos;zgartirilgan yoki vaqtincha mavjud bo&apos;lmasligi mumkin.
        </p>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          <Link href="/" style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            backgroundColor: 'var(--accent-blue)',
            color: 'white',
            fontWeight: 600,
            padding: '0.85rem 2rem',
            borderRadius: '9999px',
            fontSize: '0.98rem',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)'
          }}>
            <ArrowLeft size={18} />
            <span>Bosh sahifaga qaytish</span>
          </Link>

          <Link href="/search" style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            backgroundColor: 'var(--search-bg)',
            border: '1px solid var(--search-border)',
            color: 'var(--text-primary)',
            fontWeight: 500,
            padding: '0.85rem 2rem',
            borderRadius: '9999px',
            fontSize: '0.98rem',
            transition: 'all 0.2s ease'
          }}>
            <Search size={18} />
            <span>Kitoblar qidirish</span>
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
