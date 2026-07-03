"use client";
import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import styles from './page.module.css';

export default function ImageZoom({ src, alt }: { src: string; alt: string }) {
    const [open, setOpen] = useState(false);
    const [scale, setScale] = useState(1);
    const [translate, setTranslate] = useState({ x: 0, y: 0 });
    const [closing, setClosing] = useState(false);
    const lastTouchDistance = useRef<number | null>(null);
    const lastPan = useRef<{ x: number; y: number } | null>(null);
    const lastTap = useRef<number>(0);
    const imgRef = useRef<HTMLImageElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const closeTimer = useRef<number | null>(null);

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                setOpen(false);
                setScale(1);
                setTranslate({ x: 0, y: 0 });
            }
        }
        if (open) window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open]);

    // Double-tap to toggle zoom on touch devices
    function handleThumbClick() {
        const now = Date.now();
        if (now - lastTap.current < 350) {
            // double tap
            setScale((s) => (s > 1 ? 1 : 2));
            lastTap.current = 0;
            setOpen(true);
            return;
        }
        lastTap.current = now;
        setOpen(true);
    }

    function getDistance(touches: React.TouchList) {
        const [a, b] = [touches[0], touches[1]];
        const dx = a.clientX - b.clientX;
        const dy = a.clientY - b.clientY;
        return Math.hypot(dx, dy);
    }

    function onTouchStart(e: React.TouchEvent) {
        if (e.touches.length === 2) {
            lastTouchDistance.current = getDistance(e.touches);
        } else if (e.touches.length === 1 && scale > 1) {
            lastPan.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
    }

    function onTouchMove(e: React.TouchEvent) {
        if (e.touches.length === 2 && lastTouchDistance.current) {
            const d = getDistance(e.touches);
            const factor = d / lastTouchDistance.current;
            setScale((s) => Math.min(4, Math.max(1, s * factor)));
            lastTouchDistance.current = d;
        } else if (e.touches.length === 1 && lastPan.current && scale > 1) {
            const dx = e.touches[0].clientX - lastPan.current.x;
            const dy = e.touches[0].clientY - lastPan.current.y;
            setTranslate((t) => {
                const next = { x: t.x + dx, y: t.y + dy };
                return clampTranslate(next);
            });
            lastPan.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
    }

    function onTouchEnd(e: React.TouchEvent) {
        lastTouchDistance.current = null;
        lastPan.current = null;
        // if scale less than 1.05 reset
        if (scale < 1.05) {
            setScale(1);
            setTranslate({ x: 0, y: 0 });
        }
    }

    function onWheel(e: React.WheelEvent) {
        if (!open) return;
        const delta = -e.deltaY;
        setScale((s) => {
            const next = Math.min(4, Math.max(1, s + delta * 0.0015));
            // adjust translate to stay within bounds
            setTranslate((t) => clampTranslate(t, next));
            return next;
        });
    }

    function onDoubleClick() {
        setScale((s) => (s > 1 ? 1 : 2));
    }

    function startClose() {
        setClosing(true);
        if (closeTimer.current) window.clearTimeout(closeTimer.current);
        // wait for CSS animation to finish
        closeTimer.current = window.setTimeout(() => {
            setOpen(false);
            setScale(1);
            setTranslate({ x: 0, y: 0 });
            setClosing(false);
        }, 220);
    }

    // clamp translate values so image cannot be panned outside visible area
    function clampTranslate(t: { x: number; y: number }, sc = scale) {
        try {
            const container = containerRef.current;
            const cw = container ? container.clientWidth : window.innerWidth;
            const ch = container ? container.clientHeight : window.innerHeight;
            const maxX = Math.max(0, (cw * sc - cw) / 2 + 10); // small slack
            const maxY = Math.max(0, (ch * sc - ch) / 2 + 10);
            return {
                x: Math.max(-maxX, Math.min(maxX, t.x)),
                y: Math.max(-maxY, Math.min(maxY, t.y)),
            };
        } catch {
            return t;
        }
    }

    return (
        <>
            <div className={styles.thumbClickable} onClick={handleThumbClick} role="button" tabIndex={0}>
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    <Image src={src} alt={alt} fill unoptimized className={styles.image} />
                </div>
            </div>

            {open && (
                <div className={`${styles.lightboxOverlay} ${closing ? styles.closing : ''}`} onClick={() => startClose()}>
                    <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.lightboxClose} onClick={() => startClose()} aria-label="Yopish">✕</button>
                        <div className={styles.lightboxInner} ref={containerRef}
                            onTouchStart={onTouchStart}
                            onTouchMove={onTouchMove}
                            onTouchEnd={onTouchEnd}
                            onWheel={onWheel as any}
                            onDoubleClick={onDoubleClick}
                        >
                            <img
                                ref={imgRef}
                                src={src}
                                alt={alt}
                                className={`${styles.lightboxImg} ${closing ? styles.closing : ''}`}
                                style={{ transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`, touchAction: 'none', cursor: scale > 1 ? 'grab' : 'zoom-out' }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

// clamp translate values so image cannot be panned outside visible area
function clampTranslate(t: { x: number; y: number }, scale = 1) {
    try {
        const container = document.querySelector('.' + (document.querySelector('[data-imagezoom-container]')?.className || '')) as HTMLElement | null;
        // fallback: use window size
        const cw = container ? container.clientWidth : window.innerWidth;
        const ch = container ? container.clientHeight : window.innerHeight;
        const maxX = Math.max(0, (cw * scale - cw) / 2 + 20); // 20px slack
        const maxY = Math.max(0, (ch * scale - ch) / 2 + 20);
        return {
            x: Math.max(-maxX, Math.min(maxX, t.x)),
            y: Math.max(-maxY, Math.min(maxY, t.y)),
        };
    } catch {
        return t;
    }
}
