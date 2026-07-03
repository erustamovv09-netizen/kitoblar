"use client";

import React, { useMemo, useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, SlidersHorizontal, Star } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import BookCard from '@/components/BookCard';
import booksDB from '../lib/books';
import { api, Book } from '../lib/api';
import styles from './search.module.css';

// Helper to extract numeric price from string format "45,000 so'm"
const getNumericPrice = (p: string) => {
  return Number(p.replace(/[^0-9]/g, '')) || 0;
};

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [books, setBooks] = useState<Book[]>([]);

  useEffect(() => {
    async function loadBooks() {
      const data = await api.getBooks();
      if (data && data.length > 0) setBooks(data);
    }
    loadBooks();
  }, []);

  // Unique books (remove duplicates by title)
  const uniqueBooks = useMemo(() => {
    const activeList = books.length > 0 ? books : booksDB;
    return Array.from(new Map(activeList.map(item => [item.title, item])).values());
  }, [books]);

  // Compute all available categories and their total counts from the unique list
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    uniqueBooks.forEach(b => {
      counts[b.category] = (counts[b.category] || 0) + 1;
    });
    return counts;
  }, [uniqueBooks]);

  // Pricing limits in unique books list
  const maxAvailablePrice = useMemo(() => {
    return uniqueBooks.reduce((max, b) => Math.max(max, getNumericPrice(b.price)), 100000);
  }, [uniqueBooks]);

  // Filter & Sort States
  const [category, setCategory] = useState<string>('All');
  const [maxPrice, setMaxPrice] = useState<number>(maxAvailablePrice);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>('default');
  const [showMobileFilters, setShowMobileFilters] = useState<boolean>(false);

  // Clear all filters
  const handleClearFilters = () => {
    setCategory('All');
    setMaxPrice(maxAvailablePrice);
    setMinRating(0);
    setSortBy('default');
  };

  // Perform filtering & sorting
  const results = useMemo(() => {
    // 1. Text Query Filter
    let list = query 
      ? uniqueBooks.filter(book => 
          book.title.toLowerCase().includes(query.toLowerCase()) || 
          book.author.toLowerCase().includes(query.toLowerCase())
        )
      : uniqueBooks;

    // 2. Category Filter
    if (category !== 'All') {
      list = list.filter(b => b.category === category);
    }

    // 3. Price Filter
    list = list.filter(b => getNumericPrice(b.price) <= maxPrice);

    // 4. Rating Filter
    if (minRating > 0) {
      list = list.filter(b => b.rating >= minRating);
    }

    // 5. Sorting
    if (sortBy === 'price-asc') {
      list = [...list].sort((a, b) => getNumericPrice(a.price) - getNumericPrice(b.price));
    } else if (sortBy === 'price-desc') {
      list = [...list].sort((a, b) => getNumericPrice(b.price) - getNumericPrice(a.price));
    } else if (sortBy === 'rating-desc') {
      list = [...list].sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'year-desc') {
      list = [...list].sort((a, b) => b.publishedYear - a.publishedYear);
    }

    return list;
  }, [uniqueBooks, query, category, maxPrice, minRating, sortBy]);

  return (
    <div className={styles.container}>
      <Link href="/" className={styles.backButton}>
        <ArrowLeft size={20} />
        <span>Bosh sahifaga qaytish</span>
      </Link>
      
      <h1 className={styles.title}>{query ? `Izlash natijalari: "${query}"` : 'Kutubxona katalogi'}</h1>
      <p className={styles.description}>
        {results.length > 0 ? `${results.length} ta kitob topildi` : 'Mos keluvchi kitoblar topilmadi.'}
      </p>

      {/* Mobile filter toggle button */}
      <button 
        className={styles.filterToggleBtn}
        onClick={() => setShowMobileFilters(prev => !prev)}
      >
        <SlidersHorizontal size={18} />
        <span>{showMobileFilters ? "Filtrlarni yashirish" : "Filtrlarni ko'rsatish"}</span>
      </button>

      <div className={styles.layout}>
        {/* Left Sidebar Filters */}
        <aside className={`${styles.sidebar} ${showMobileFilters ? styles.sidebarOpen : ''}`}>
          <div className={styles.filterHeader}>
            <h3>
              <SlidersHorizontal size={18} />
              Filtrlar
            </h3>
            {(category !== 'All' || maxPrice < maxAvailablePrice || minRating > 0 || sortBy !== 'default') && (
              <button className={styles.clearBtn} onClick={handleClearFilters}>
                Tozalash
              </button>
            )}
          </div>

          {/* Sort Section */}
          <div className={styles.filterSection}>
            <label className={styles.sectionLabel} htmlFor="sort-select">Saralash</label>
            <select 
              id="sort-select"
              value={sortBy} 
              onChange={e => setSortBy(e.target.value)}
              className={styles.sortSelect}
            >
              <option value="default">Mos kelishi bo&apos;yicha</option>
              <option value="price-asc">Narxi: pastdan balandga</option>
              <option value="price-desc">Narxi: balanddan pastga</option>
              <option value="rating-desc">Reyting: yuqoridan pastga</option>
              <option value="year-desc">Nashr yili: yangilaridan boshlab</option>
            </select>
          </div>

          {/* Categories Section */}
          <div className={styles.filterSection}>
            <span className={styles.sectionLabel}>Toifalar</span>
            <div className={styles.categoryList}>
              <button 
                className={`${styles.categoryBtn} ${category === 'All' ? styles.categoryBtnActive : ''}`}
                onClick={() => setCategory('All')}
              >
                <span>Barchasi</span>
                <span className={styles.categoryCount}>{uniqueBooks.length}</span>
              </button>
              {Object.entries(categoryCounts).map(([catName, count]) => (
                <button
                  key={catName}
                  className={`${styles.categoryBtn} ${category === catName ? styles.categoryBtnActive : ''}`}
                  onClick={() => setCategory(catName)}
                >
                  <span>{catName}</span>
                  <span className={styles.categoryCount}>{count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Slider */}
          <div className={styles.filterSection}>
            <label htmlFor="price-range-slider" className={styles.sectionLabel}>Maximal narxi</label>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', margin: '0.2rem 0' }}>
              {maxPrice.toLocaleString('uz-UZ')} so&apos;m
            </div>
            <input 
              id="price-range-slider"
              type="range" 
              min={20000} 
              max={maxAvailablePrice} 
              step={5000} 
              value={maxPrice} 
              onChange={e => setMaxPrice(Number(e.target.value))}
              className={styles.priceSlider}
            />
            <div className={styles.sliderLabels}>
              <span>20,000 so&apos;m</span>
              <span>{maxAvailablePrice.toLocaleString('uz-UZ')} so&apos;m</span>
            </div>
          </div>

          {/* Ratings Filter */}
          <div className={styles.filterSection}>
            <span className={styles.sectionLabel}>Minimal reyting</span>
            <div className={styles.ratingSelector}>
              <button 
                className={`${styles.ratingOption} ${minRating === 0 ? styles.ratingOptionActive : ''}`}
                onClick={() => setMinRating(0)}
              >
                Barcha reytinglar
              </button>
              {[4.9, 4.8, 4.7].map(rate => (
                <button
                  key={rate}
                  className={`${styles.ratingOption} ${minRating === rate ? styles.ratingOptionActive : ''}`}
                  onClick={() => setMinRating(rate)}
                >
                  <Star size={14} className={styles.starIcon} fill="#f59e0b" />
                  <span>{rate} dan yuqori</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Right Books Grid Area */}
        <section className={styles.gridArea}>
          {results.length === 0 ? (
            <div className={styles.noResults}>
              <h2>Kitoblar topilmadi</h2>
              <p>Belgilangan filtrlar bo&apos;yicha hech qanday kitob topilmadi. Filtr parametrlarini o&apos;zgartirib ko&apos;ring yoki &quot;Tozalash&quot; tugmasini bosing.</p>
            </div>
          ) : (
            <div className={styles.grid}>
              {results.map(book => (
                <BookCard key={book.id} {...book} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <main className={styles.main}>
      <Suspense fallback={<div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>Yuklanmoqda...</div>}>
        <SearchContent />
      </Suspense>
    </main>
  );
}
