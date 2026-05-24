"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AccountPage() {
    const [name, setName] = useState('');
    const [editing, setEditing] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('username');
        if (stored) setName(stored);
    }, []);

    function saveProfile() {
        localStorage.setItem('username', name);
        setEditing(false);
    }

    function logout() {
        localStorage.removeItem('username');
        setName('');
    }

    return (
        <main style={{ padding: '2rem' }}>
            <h1>Profil</h1>
            {name ? (
                <div>
                    <p>Salom, <strong>{name}</strong></p>
                    <p>Bu yerda profil ma'lumotlari va sozlamalar bo'ladi.</p>
                    <div style={{ marginTop: 12 }}>
                        <button onClick={() => setEditing(true)} style={{ marginRight: 8 }}>Tahrirlash</button>
                        <button onClick={logout}>Chiqish</button>
                    </div>
                </div>
            ) : (
                <div>
                    <p>Siz tizimga kirmagansiz.</p>
                    <div style={{ marginTop: 12 }}>
                        <input
                            placeholder="Ismingiz"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            style={{ marginRight: 8 }}
                        />
                        <button onClick={saveProfile}>Saqlash</button>
                    </div>
                </div>
            )}

            {editing && (
                <div style={{ marginTop: 12 }}>
                    <input value={name} onChange={(e) => setName(e.target.value)} />
                    <button onClick={saveProfile} style={{ marginLeft: 8 }}>Saqlash</button>
                </div>
            )}

            <p style={{ marginTop: 16 }}>
                Orqaga: <Link href="/">Bosh sahifa</Link>
            </p>
        </main>
    );
}

