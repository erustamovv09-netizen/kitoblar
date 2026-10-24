import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { ensureTelegramPolling } from '@/app/lib/telegram';

interface OrderItem {
  id: string;
  receiptNumber: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  bookImage?: string;
  format: 'electronic' | 'paper';
  formatLabel: string;
  purpose: string;
  price: number;
  originalPrice?: number;
  paymentMethod: 'payme' | 'click' | 'uzum' | 'card';
  userName: string;
  userEmail?: string;
  userPhone: string;
  senderCardLast4?: string;
  receiptImage?: string;
  deliveryAddress?: string | null;
  region?: string | null;
  status: 'pending' | 'completed' | 'processing' | 'delivered' | 'cancelled';
  statusLabel?: string;
  createdAt: string;
  notes?: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const RECEIPTS_DIR = path.join(process.cwd(), 'public', 'receipts');

// Ensure telegram polling runs on server
ensureTelegramPolling();

function ensureDataFile(): OrderItem[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(ORDERS_FILE)) {
      fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
    const raw = fs.readFileSync(ORDERS_FILE, 'utf-8');
    return JSON.parse(raw) as OrderItem[];
  } catch (err) {
    console.error('Error reading orders file:', err);
    return [];
  }
}

function saveOrders(orders: OrderItem[]): boolean {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error saving orders file:', err);
    return false;
  }
}

// Format Uzbek date for Telegram notification
function formatUzbekDateTime(dateInput: Date | string = new Date()): string {
  const d = new Date(dateInput);
  const months = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}-${month}, ${year}, ${hours}:${minutes}`;
}

// Telegram notification sender with inline keyboard buttons
async function sendTelegramNotification(order: OrderItem) {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
    return;
  }

  // Ensure polling is active
  ensureTelegramPolling();

  const isPaper = order.format === 'paper';
  const formatIcon = isPaper ? '📦' : '📱';
  const formatText = isPaper ? "Qog'oz format (Bosma kitob)" : "Elektron kitob (Mutolaa & Audio)";
  const purposeText = isPaper
    ? "Bosma kitobni xaridor manziliga yetkazib berish (Kuryer xizmati)"
    : "Saytda to'liq mutolaa qilish va audio eshitish huquqi (Cheksiz kirish)";

  const formattedPrice = Number(order.price || 0).toLocaleString('uz-UZ');
  const formattedDate = formatUzbekDateTime(order.createdAt);

  const statusText = order.status === 'completed'
    ? '✅ To\'langan (Faol)'
    : order.status === 'pending'
    ? '⏳ TO\'LOV KUTILMOQDA (Kartangizni tekshiring!)'
    : '🚚 Yetkazilmoqda (Kuryerda)';

  const cardInfo = order.senderCardLast4
    ? `💳 <b>Xaridor kartasi:</b> <code>*${order.senderCardLast4}</code>`
    : `💳 <b>To'lov usuli:</b> <b>${order.paymentMethod.toUpperCase()}</b>`;

  const text = `
🔔 <b>YANGI TO'LOV KELIB TUSHDI!</b>

🧾 <b>Chek raqami:</b> <code>${order.receiptNumber}</code>
📖 <b>Kitob:</b> <b>${order.bookTitle}</b>
✍️ <b>Muallif:</b> ${order.bookAuthor}
${formatIcon} <b>Format:</b> ${formatText}
🎯 <b>To'lov maqsadi:</b> ${purposeText}

💰 <b>Kutilayotgan summa:</b> <b>${formattedPrice} so'm</b>
${cardInfo}

👤 <b>Xaridor:</b> ${order.userName}
${order.userPhone && order.userPhone !== 'Elektron xarid' && order.userPhone !== '+998' ? `📞 <b>Telefon:</b> <a href="tel:${order.userPhone}">${order.userPhone}</a>\n` : ''}${order.userEmail ? `📧 <b>Email:</b> ${order.userEmail}\n` : ''}${order.deliveryAddress ? `📍 <b>Yetkazish manzili:</b> ${order.deliveryAddress}\n` : ''}🕒 <b>Vaqti:</b> ${formattedDate}
📊 <b>Holati:</b> ${statusText}

💡 <b>QANDAY TASDIQLAYSAN?</b>
Uzum Bank ilovangizga yoki SMS ga qarang: <b>*${order.senderCardLast4 || 'XXXX'}</b> kartasidan <b>${formattedPrice} so'm</b> kelgan bo'lsa, quyidagi <b>"✅ To'lovni tasdiqlash"</b> tugmasini 1 marta bosing!
`.trim();

  const inlineKeyboard = {
    inline_keyboard: [
      [
        { text: "✅ To'lovni tasdiqlash", callback_data: `approve_${order.id}` },
        { text: "❌ Bekor qilish", callback_data: `reject_${order.id}` }
      ]
    ]
  };

  // If receiptImage is present as a saved local path or base64
  if (order.receiptImage && order.receiptImage.startsWith('data:image')) {
    try {
      const match = order.receiptImage.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
      if (match) {
        const mimeSub = match[1];
        const base64Data = match[2];
        const buffer = Buffer.from(base64Data, 'base64');
        const blob = new Blob([buffer], { type: `image/${mimeSub}` });

        const formData = new FormData();
        formData.append('chat_id', CHAT_ID);
        formData.append('photo', blob, `receipt_${order.receiptNumber}.${mimeSub}`);
        formData.append('caption', text);
        formData.append('parse_mode', 'HTML');
        formData.append('reply_markup', JSON.stringify(inlineKeyboard));

        const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
          method: 'POST',
          body: formData,
        });

        if (res.ok) return;
      }
    } catch (photoErr) {
      console.warn('Failed to send photo to Telegram, falling back to text:', photoErr);
    }
  }

  // Fallback to text message
  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboard,
      }),
    });
  } catch (err) {
    console.error('Failed to send Telegram order alert:', err);
  }
}

function getStaticCoverForBook(bookId?: string, bookTitle?: string): string | null {
  const t = String(bookTitle || '').toLowerCase().trim();
  const idStr = String(bookId || '').trim();
  if (idStr === '7' || t.includes('1500') || t.includes('maxbus')) return '/images/1500-yillik-maxbuslar.jpg';
  if (idStr === '4' || idStr === '5' || t.includes('arosat')) return '/images/arosat.jpg';
  if (idStr === '1' || t.includes('binafsha')) return '/images/binafsha.jpeg';
  if (idStr === '3' || t.includes('harom') || t.includes('ko‘z') || t.includes("ko'z") || t.includes('kozlaringni')) return '/images/kozlaringni-haromdan-saqla.jpg';
  return null;
}

// GET: Fetch all orders and metrics
export async function GET(req: NextRequest) {
  try {
    const rawOrders = ensureDataFile();
    const orders = rawOrders.map(o => {
      const staticCov = getStaticCoverForBook(o.bookId, o.bookTitle);
      if (staticCov && (!o.bookImage || o.bookImage.includes('onrender.com/media/book_covers/') || o.bookImage.includes('unsplash.com/photo-1544947950'))) {
        return { ...o, bookImage: staticCov };
      }
      return o;
    });

    // Filter by single receipt or phone/username/email + bookId if requested
    const { searchParams } = new URL(req.url);
    const filterReceipt = searchParams.get('receipt');
    const filterPhone = searchParams.get('phone');
    const filterBookId = searchParams.get('bookId');
    const filterUsername = searchParams.get('username')?.trim().toLowerCase();
    const filterEmail = searchParams.get('email')?.trim().toLowerCase();

    if (filterReceipt) {
      const match = orders.find(o => o.receiptNumber === filterReceipt || o.id === filterReceipt);
      return NextResponse.json({ success: true, order: match || null });
    }

    if (filterBookId && (filterUsername || filterEmail)) {
      const match = orders.find(o => 
        String(o.bookId) === String(filterBookId) && (
          (filterUsername && (o.userName || '').toLowerCase().trim() === filterUsername) ||
          (filterEmail && (o.userEmail || '').toLowerCase().trim() === filterEmail)
        )
      );
      if (match) {
        return NextResponse.json({ success: true, order: match });
      }
    }

    if (filterPhone && filterBookId) {
      const digits = filterPhone.replace(/\D/g, '').slice(-9);
      const match = orders.find(o => 
        String(o.bookId) === String(filterBookId) && 
        o.userPhone.replace(/\D/g, '').includes(digits)
      );
      return NextResponse.json({ success: true, order: match || null });
    }

    // If only user is requested, return that user's orders
    if (filterUsername || filterEmail) {
      const userOrders = orders.filter(o => 
        (filterUsername && (o.userName || '').toLowerCase().trim() === filterUsername) ||
        (filterEmail && (o.userEmail || '').toLowerCase().trim() === filterEmail)
      );
      userOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return NextResponse.json({
        success: true,
        orders: userOrders,
        stats: {
          totalOrders: userOrders.length,
          totalRevenue: userOrders
            .filter(o => o.status !== 'cancelled' && o.status !== 'pending')
            .reduce((sum, o) => sum + (Number(o.price) || 0), 0),
          pendingCount: userOrders.filter(o => o.status === 'pending').length,
          electronicCount: userOrders.filter(o => o.format === 'electronic').length,
          paperCount: userOrders.filter(o => o.format === 'paper').length,
          completedCount: userOrders.filter(o => o.status === 'completed' || o.status === 'delivered').length,
          processingCount: userOrders.filter(o => o.status === 'processing').length,
        }
      });
    }

    // Sort newest first
    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Compute stats
    const totalOrders = orders.length;
    const totalRevenue = orders
      .filter(o => o.status !== 'cancelled' && o.status !== 'pending')
      .reduce((sum, o) => sum + (Number(o.price) || 0), 0);
    const pendingCount = orders.filter(o => o.status === 'pending').length;
    const electronicCount = orders.filter(o => o.format === 'electronic').length;
    const paperCount = orders.filter(o => o.format === 'paper').length;
    const completedCount = orders.filter(o => o.status === 'completed' || o.status === 'delivered').length;
    const processingCount = orders.filter(o => o.status === 'processing').length;

    return NextResponse.json({
      success: true,
      orders,
      stats: {
        totalOrders,
        totalRevenue,
        pendingCount,
        electronicCount,
        paperCount,
        completedCount,
        processingCount,
      }
    });
  } catch (err: any) {
    console.error('GET orders error:', err);
    return NextResponse.json({ error: 'Buyurtmalarni yuklashda xatolik yuz berdi' }, { status: 500 });
  }
}

// POST: Create a new order
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.bookId || !body.bookTitle || !body.price || !body.userName) {
      return NextResponse.json({ error: "Kerakli ma'lumotlar to'liq emas" }, { status: 400 });
    }

    const orders = ensureDataFile();

    const format: 'electronic' | 'paper' = body.format === 'paper' ? 'paper' : 'electronic';
    const receiptNumber = body.receiptNumber || `AKS-${Math.floor(100000 + Math.random() * 900000)}`;

    const staticCov = getStaticCoverForBook(String(body.bookId), String(body.bookTitle));
    const resolvedBookImage = (staticCov && (!body.bookImage || body.bookImage.includes('onrender.com/media/book_covers/') || body.bookImage.includes('unsplash.com/photo-1544947950')))
      ? staticCov
      : (body.bookImage || staticCov || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=400&auto=format&fit=crop');

    const initialStatus = body.status || 'pending';
    const initialStatusLabel = body.statusLabel || (
      initialStatus === 'pending'
        ? "To'lov kutilmoqda (Tekshirilmoqda)"
        : (format === 'paper' ? "Yetkazilmoqda (Kuryerda)" : "To'langan (Faol)")
    );

    let savedReceiptPath: string | undefined = undefined;
    if (body.receiptImage && typeof body.receiptImage === 'string' && body.receiptImage.startsWith('data:image')) {
      try {
        if (!fs.existsSync(RECEIPTS_DIR)) {
          fs.mkdirSync(RECEIPTS_DIR, { recursive: true });
        }
        const match = body.receiptImage.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
        if (match) {
          const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
          const buffer = Buffer.from(match[2], 'base64');
          const fileName = `${receiptNumber}.${ext}`;
          const filePath = path.join(RECEIPTS_DIR, fileName);
          fs.writeFileSync(filePath, buffer);
          savedReceiptPath = `/receipts/${fileName}`;
        }
      } catch (saveImgErr) {
        console.warn('Failed to save receipt image to disk:', saveImgErr);
      }
    }

    const newOrder: OrderItem = {
      id: body.id || `ord_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      receiptNumber,
      bookId: String(body.bookId),
      bookTitle: String(body.bookTitle),
      bookAuthor: String(body.bookAuthor || 'Noma\'lum muallif'),
      bookImage: resolvedBookImage,
      format,
      formatLabel: format === 'paper' ? "Qog'oz format (Bosma kitob)" : "Elektron kitob",
      purpose: body.purpose || (format === 'paper'
        ? "Bosma kitobni manzilga yetkazib berish (Kuryer xizmati)"
        : "Saytda to'liq mutolaa qilish va audioni eshitish huquqi (Cheksiz kirish)"),
      price: Number(body.price),
      originalPrice: body.originalPrice ? Number(body.originalPrice) : Number(body.price),
      paymentMethod: body.paymentMethod || 'card',
      userName: String(body.userName).trim(),
      userEmail: body.userEmail ? String(body.userEmail).trim() : '',
      userPhone: String(body.userPhone || (format === 'paper' ? '+998 ' : '')).trim(),
      senderCardLast4: body.senderCardLast4 ? String(body.senderCardLast4).replace(/\D/g, '').slice(0, 4) : undefined,
      receiptImage: savedReceiptPath || (typeof body.receiptImage === 'string' && !body.receiptImage.startsWith('data:') ? body.receiptImage : undefined),
      deliveryAddress: format === 'paper' ? (body.deliveryAddress || '') : null,
      region: format === 'paper' ? (body.region || 'Toshkent') : null,
      status: initialStatus,
      statusLabel: initialStatusLabel,
      createdAt: body.createdAt || new Date().toISOString(),
      notes: body.notes || (initialStatus === 'pending'
        ? "Xaridor to'lov qildi. Admin kartaga pul tushganini tasdiqlashi kutilmoqda."
        : (format === 'electronic'
          ? "Elektron kitob va audio eshitish huquqi faollashtirildi"
          : "Kuryer orqali manzilga yetkaziladi")),
    };

    // Prepend new order
    orders.unshift(newOrder);
    saveOrders(orders);

    // If client sent raw base64 receiptImage, keep it temporarily on object passed to sendTelegramNotification
    const orderForTelegram = {
      ...newOrder,
      receiptImage: body.receiptImage || savedReceiptPath,
    };

    // Send Telegram Notification in background
    sendTelegramNotification(orderForTelegram).catch(console.error);

    return NextResponse.json({
      success: true,
      order: newOrder,
    }, { status: 201 });
  } catch (err: any) {
    console.error('POST order error:', err);
    return NextResponse.json({ error: 'Buyurtmani saqlashda xatolik yuz berdi' }, { status: 500 });
  }
}

// PATCH: Update order status or notes
export async function PATCH(req: NextRequest) {
  try {
    const { id, status, notes } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Order ID kerak' }, { status: 400 });
    }

    const orders = ensureDataFile();
    const idx = orders.findIndex(o => String(o.id) === String(id) || String(o.receiptNumber) === String(id));

    if (idx === -1) {
      return NextResponse.json({ error: 'Buyurtma topilmadi' }, { status: 404 });
    }

    if (status) {
      orders[idx].status = status;
      if (status === 'completed') orders[idx].statusLabel = "To'langan (Faol)";
      else if (status === 'pending') orders[idx].statusLabel = "To'lov kutilmoqda (Tekshirilmoqda)";
      else if (status === 'processing') orders[idx].statusLabel = "Yetkazilmoqda (Kuryerda)";
      else if (status === 'delivered') orders[idx].statusLabel = "Yetkazib berildi";
      else if (status === 'cancelled') orders[idx].statusLabel = "Bekor qilindi";
    }

    if (notes !== undefined) {
      orders[idx].notes = notes;
    }

    saveOrders(orders);

    return NextResponse.json({
      success: true,
      order: orders[idx],
    });
  } catch (err: any) {
    console.error('PATCH order error:', err);
    return NextResponse.json({ error: 'Buyurtmani yangilashda xatolik yuz berdi' }, { status: 500 });
  }
}

// DELETE: Delete an order
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Order ID ko\'rsatilmadi' }, { status: 400 });
    }

    const orders = ensureDataFile();
    const filtered = orders.filter(o => String(o.id) !== String(id) && String(o.receiptNumber) !== String(id));

    if (filtered.length === orders.length) {
      return NextResponse.json({ error: 'Buyurtma topilmadi' }, { status: 404 });
    }

    saveOrders(filtered);

    return NextResponse.json({
      success: true,
      message: 'Buyurtma muvaffaqiyatli o\'chirildi',
    });
  } catch (err: any) {
    console.error('DELETE order error:', err);
    return NextResponse.json({ error: 'Buyurtmani o\'chirishda xatolik yuz berdi' }, { status: 500 });
  }
}
