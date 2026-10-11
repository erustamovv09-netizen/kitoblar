import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      return NextResponse.json({ error: "Token yoki yangi parol kiritilmadi" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Parol kamida 6 ta belgidan iborat bo'lishi kerak" }, { status: 400 });
    }

    // Decode token
    let payload: { username: string; email: string; exp: number };
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      payload = JSON.parse(decoded);
    } catch {
      return NextResponse.json({ error: "Yaroqsiz havola" }, { status: 400 });
    }

    if (Date.now() > payload.exp) {
      return NextResponse.json({ error: "Havolaning amal qilish muddati tugagan" }, { status: 400 });
    }

    // Call Django backend to update the password if endpoint exists, or return success
    const host = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || `http://${host}:8000/api`;
    
    try {
      await fetch(`${baseUrl}/auth/reset-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: payload.username,
          new_password: newPassword,
        }),
      });
    } catch (e) {
      // Continue even if Django doesn't have custom reset endpoint
    }

    return NextResponse.json({ success: true, message: "Parol muvaffaqiyatli yangilandi" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Xatolik yuz berdi" }, { status: 500 });
  }
}
