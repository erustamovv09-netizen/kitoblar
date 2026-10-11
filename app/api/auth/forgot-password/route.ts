import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const { username, email } = await req.json();

    if (!username || !email) {
      return NextResponse.json({ error: "Username va email kiritilishi shart" }, { status: 400 });
    }

    const host = req.headers.get('host') || 'localhost:3000';
    // Development local server doesn't have SSL certificate, so use http
    const protocol = host.startsWith('https://') ? 'https' : 'http';

    // Generate a simple token (base64 encoded JSON with expiration)
    const tokenPayload = {
      username: username.trim(),
      email: email.trim(),
      exp: Date.now() + 1000 * 60 * 60, // 1 hour
    };
    const token = Buffer.from(JSON.stringify(tokenPayload)).toString('base64');
    const resetUrl = `${protocol}://${host}/reset-password?token=${token}`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: `"Kitoblar Portali" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Parolni tiklash bo'yicha havola — Kitoblar Portali",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0;">
          <h2 style="color: #1e293b; margin-top: 0; font-size: 22px;">Assalomu alaykum, ${username}!</h2>
          <p style="color: #475569; font-size: 15px; line-height: 1.6;">
            Kitoblar Portali hisobingiz uchun parolni tiklash so'rovi yuborildi.
          </p>
          <div style="margin: 28px 0; text-align: center;">
            <a href="${resetUrl}" style="background: #2563eb; color: #ffffff; padding: 14px 28px; font-weight: 600; font-size: 15px; text-decoration: none; border-radius: 8px; display: inline-block;">
              Parolni tiklash
            </a>
          </div>
          <p style="color: #64748b; font-size: 13px; line-height: 1.5;">
            Agar tugma ishlamasa, quyidagi havolani brauzerga nusxalab qo'ying:<br/>
            <a href="${resetUrl}" style="color: #2563eb; word-break: break-all;">${resetUrl}</a>
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="color: #94a3b8; font-size: 12px; margin-bottom: 0;">
            Bu havola 1 soat davomida amal qiladi. Agar siz bu so'rovni yubormagan bo'lsangiz, ushbu xatga e'tibor bermang.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Email send error:', err);
    return NextResponse.json({ error: err.message || "Xat yuborishda xatolik yuz berdi" }, { status: 500 });
  }
}
