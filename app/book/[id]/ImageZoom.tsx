"use client";

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { Maximize2, X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import styles from './page.module.css';

interface ImageZoomProps {
  src: string;
  alt: string;
}

export default function ImageZoom({ src, alt }: ImageZoomProps) {
  const [open, setOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  
  const lastTouchDistance = useRef<number | null>(null);
  const lastPan = useRef<{ x: number; y: number } | null>(null);
  const lastTap = useRef<number>(0);
  const isDragging = useRef<boolean>(false);
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll and handle ESC key
  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        closeModal();
      }
    }

    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const closeModal = () => {
    setOpen(false);
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  };

  const handleThumbClick = () => {
    setOpen(true);
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  };

  // Zoom controls
  const zoomIn = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setScale(s => Math.min(3.5, +(s + 0.35).toFixed(2)));
  };

  const zoomOut = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setScale(s => {
      const next = Math.max(1, +(s - 0.35).toFixed(2));
      if (next === 1) setTranslate({ x: 0, y: 0 });
      return next;
    });
  };

  const resetZoom = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  };

  // Double tap or double click to zoom
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (scale > 1.1) {
      resetZoom();
    } else {
      setScale(2);
    }
  };

  // Touch handling
  const getDistance = (touches: React.TouchList) => {
    const a = touches[0];
    const b = touches[1];
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      lastTouchDistance.current = getDistance(e.touches);
    } else if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTap.current < 300) {
        // Double tap on touch
        if (scale > 1.1) {
          resetZoom();
        } else {
          setScale(2);
        }
        lastTap.current = 0;
        return;
      }
      lastTap.current = now;

      if (scale > 1) {
        lastPan.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchDistance.current) {
      const dist = getDistance(e.touches);
      const factor = dist / lastTouchDistance.current;
      setScale(s => Math.min(3.5, Math.max(1, +(s * factor).toFixed(2))));
      lastTouchDistance.current = dist;
    } else if (e.touches.length === 1 && lastPan.current && scale > 1) {
      const dx = e.touches[0].clientX - lastPan.current.x;
      const dy = e.touches[0].clientY - lastPan.current.y;
      setTranslate(t => ({ x: t.x + dx, y: t.y + dy }));
      lastPan.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const onTouchEnd = () => {
    lastTouchDistance.current = null;
    lastPan.current = null;
    if (scale <= 1) {
      setTranslate({ x: 0, y: 0 });
    }
  };

  // Mouse pan handling
  const onMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      isDragging.current = true;
      dragStart.current = { x: e.clientX - translate.x, y: e.clientY - translate.y };
    }
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current && scale > 1) {
      setTranslate({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y
      });
    }
  };

  const onMouseUp = () => {
    isDragging.current = false;
  };

  return (
    <>
      {/* Thumbnail View inside Book Details Page */}
      {(() => {
        const safeSrc = (src && typeof src === 'string' && src.trim()) ? src : 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop';
        return (
          <div 
            className={styles.thumbClickable} 
            onClick={handleThumbClick} 
            role="button" 
            tabIndex={0}
            title="Rasmni to'liq ko'rish uchun bosing"
          >
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              <Image 
                src={safeSrc} 
                alt={alt || "Kitob rasmi"} 
                fill 
                unoptimized 
                className={styles.image} 
                sizes="(max-width: 768px) 100vw, 380px"
                priority
              />
            </div>

            {/* Visual Badge that clearly prompts user to click and view image */}
            <div className={styles.zoomBadge}>
              <Maximize2 size={13} />
              <span>Rasmni ko&apos;rish</span>
            </div>
          </div>
        );
      })()}

      {/* Full-screen Lightbox Portal mounted to document.body */}
      {open && mounted && createPortal(
        <div 
          className={styles.lightboxOverlay} 
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
        >
          {/* Header Bar */}
          <div className={styles.lightboxHeader} onClick={e => e.stopPropagation()}>
            <span className={styles.lightboxTitle}>{alt}</span>
            <button 
              type="button" 
              className={styles.lightboxCloseBtn} 
              onClick={closeModal}
              aria-label="Yopish"
            >
              <X size={16} />
              <span>Yopish</span>
            </button>
          </div>

          {/* Central Image Container */}
          <div 
            className={styles.lightboxBody}
            onClick={closeModal}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
          >
            <img
              src={src}
              alt={alt}
              className={styles.lightboxImg}
              onClick={e => e.stopPropagation()}
              onDoubleClick={handleDoubleClick}
              style={{
                transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
                cursor: scale > 1 ? 'grab' : 'zoom-in'
              }}
              draggable={false}
            />
          </div>

          {/* Bottom Controls Bar */}
          <div className={styles.lightboxFooter} onClick={e => e.stopPropagation()}>
            <div className={styles.lightboxControls}>
              <button 
                type="button" 
                className={styles.lightboxCtrlBtn} 
                onClick={zoomOut}
                disabled={scale <= 1}
                title="Kichiklashtirish"
              >
                <ZoomOut size={17} />
              </button>
              
              <span className={styles.lightboxScaleText}>
                {Math.round(scale * 100)}%
              </span>

              <button 
                type="button" 
                className={styles.lightboxCtrlBtn} 
                onClick={zoomIn}
                disabled={scale >= 3.5}
                title="Kattalashtirish"
              >
                <ZoomIn size={17} />
              </button>

              {scale > 1 && (
                <button 
                  type="button" 
                  className={styles.lightboxCtrlBtn} 
                  onClick={resetZoom}
                  title="Qaytarish (100%)"
                >
                  <RotateCcw size={15} />
                </button>
              )}
            </div>
            <span className={styles.lightboxHint}>
              Kattalashtirish uchun ikki marta bosing yoki barmog&apos;ingiz bilan cho&apos;zing
            </span>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
