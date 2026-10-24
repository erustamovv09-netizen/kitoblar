import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface UserDataSync {
  favorites?: any[];
  purchasedBooks?: any[];
  bookStatuses?: Record<string, string>;
  quotes?: any[];
  profile?: {
    name?: string;
    email?: string;
    bio?: string;
    avatar?: string;
    accent?: string;
    dailyGoal?: number;
    todayProgress?: number;
    streak?: number;
  };
  lastUpdated: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const SYNC_FILE = path.join(DATA_DIR, 'user_sync.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const TMP_SYNC_FILE = path.join('/tmp', 'kitoblar_user_sync.json');

function readSyncData(): Record<string, UserDataSync> {
  try {
    if (fs.existsSync(SYNC_FILE)) {
      const raw = fs.readFileSync(SYNC_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Could not read SYNC_FILE, trying tmp:', err);
  }

  try {
    if (fs.existsSync(TMP_SYNC_FILE)) {
      const raw = fs.readFileSync(TMP_SYNC_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch {}

  return {};
}

function writeSyncData(data: Record<string, UserDataSync>): boolean {
  let written = false;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(SYNC_FILE, JSON.stringify(data, null, 2), 'utf-8');
    written = true;
  } catch (err) {
    console.warn('Could not write SYNC_FILE in process.cwd, writing to /tmp:', err);
  }

  try {
    fs.writeFileSync(TMP_SYNC_FILE, JSON.stringify(data, null, 2), 'utf-8');
    written = true;
  } catch (err) {
    console.warn('Could not write TMP_SYNC_FILE:', err);
  }

  return written;
}

function getCompletedOrdersForUser(username?: string, email?: string): any[] {
  try {
    let orders: any[] = [];
    if (fs.existsSync(ORDERS_FILE)) {
      orders = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf-8'));
    } else {
      const tmpOrders = path.join('/tmp', 'orders.json');
      if (fs.existsSync(tmpOrders)) {
        orders = JSON.parse(fs.readFileSync(tmpOrders, 'utf-8'));
      }
    }

    if (!Array.isArray(orders)) return [];

    const uClean = username ? username.toLowerCase().trim() : '';
    const eClean = email ? email.toLowerCase().trim() : '';

    return orders.filter(o => {
      const isApproved = o.status === 'completed' || o.status === 'delivered';
      if (!isApproved) return false;
      const oUser = (o.userName || '').toLowerCase().trim();
      const oEmail = (o.userEmail || '').toLowerCase().trim();
      return (uClean && oUser === uClean) || (eClean && oEmail === eClean);
    });
  } catch {
    return [];
  }
}

// GET: /api/user/sync?username=<username>&email=<email>
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username')?.trim();
    const email = searchParams.get('email')?.trim();

    if (!username && !email) {
      return NextResponse.json({ error: 'Username yoki email talab qilinadi' }, { status: 400 });
    }

    const key = (username || email || '').toLowerCase();
    const allData = readSyncData();
    const isNew = !allData[key];
    let userData = allData[key] || {
      favorites: [],
      purchasedBooks: [],
      bookStatuses: {},
      quotes: [],
      profile: {},
      lastUpdated: new Date().toISOString(),
    };

    // Auto-sync completed orders from orders.json
    const completedOrders = getCompletedOrdersForUser(username || undefined, email || undefined);
    if (completedOrders.length > 0) {
      const currentPurchased = userData.purchasedBooks || [];
      const purchasedMap = new Map<string, any>();
      currentPurchased.forEach(p => {
        const id = typeof p === 'string' ? p : String(p?.id || '');
        if (id) purchasedMap.set(id, typeof p === 'string' ? { id } : p);
      });

      completedOrders.forEach(o => {
        const bId = String(o.bookId);
        if (!purchasedMap.has(bId)) {
          purchasedMap.set(bId, {
            id: bId,
            title: o.bookTitle,
            author: o.bookAuthor,
            format: o.format,
            price: o.price,
            receiptNumber: o.receiptNumber,
            image: o.bookImage,
            date: o.createdAt,
          });
        }
      });

      userData.purchasedBooks = Array.from(purchasedMap.values());
    }

    return NextResponse.json({
      success: true,
      isNew,
      data: userData,
    });
  } catch (err: any) {
    console.error('Error in GET /api/user/sync:', err);
    return NextResponse.json({ error: 'Sinxronizatsiya xatosi' }, { status: 500 });
  }
}

// POST: /api/user/sync
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const username = (body.username || '').trim();
    const email = (body.email || '').trim();

    if (!username && !email) {
      return NextResponse.json({ error: 'Username yoki email talab qilinadi' }, { status: 400 });
    }

    const key = (username || email).toLowerCase();
    const allData = readSyncData();
    const existing = allData[key] || {
      favorites: [],
      purchasedBooks: [],
      bookStatuses: {},
      quotes: [],
      profile: {},
      lastUpdated: new Date().toISOString(),
    };

    // Update favorites if provided
    if (Array.isArray(body.favorites)) {
      existing.favorites = body.favorites;
    }

    // Merge purchasedBooks if provided
    if (Array.isArray(body.purchasedBooks)) {
      const currentPurchased = existing.purchasedBooks || [];
      const pMap = new Map<string, any>();
      currentPurchased.forEach(p => {
        const id = typeof p === 'string' ? p : String(p?.id || '');
        if (id) pMap.set(id, p);
      });
      body.purchasedBooks.forEach((p: any) => {
        const id = typeof p === 'string' ? p : String(p?.id || '');
        if (id) pMap.set(id, p);
      });
      existing.purchasedBooks = Array.from(pMap.values());
    }

    // Update book statuses
    if (body.bookStatuses && typeof body.bookStatuses === 'object') {
      existing.bookStatuses = { ...existing.bookStatuses, ...body.bookStatuses };
    }

    // Update quotes
    if (Array.isArray(body.quotes)) {
      existing.quotes = body.quotes;
    }

    // Update profile
    if (body.profile && typeof body.profile === 'object') {
      existing.profile = { ...existing.profile, ...body.profile };
    }

    // Include completed orders automatically
    const completedOrders = getCompletedOrdersForUser(username || undefined, email || undefined);
    if (completedOrders.length > 0) {
      const pMap = new Map<string, any>();
      (existing.purchasedBooks || []).forEach(p => {
        const id = typeof p === 'string' ? p : String(p?.id || '');
        if (id) pMap.set(id, p);
      });
      completedOrders.forEach(o => {
        const bId = String(o.bookId);
        if (!pMap.has(bId)) {
          pMap.set(bId, {
            id: bId,
            title: o.bookTitle,
            author: o.bookAuthor,
            format: o.format,
            price: o.price,
            receiptNumber: o.receiptNumber,
            image: o.bookImage,
            date: o.createdAt,
          });
        }
      });
      existing.purchasedBooks = Array.from(pMap.values());
    }

    existing.lastUpdated = new Date().toISOString();
    allData[key] = existing;

    writeSyncData(allData);

    return NextResponse.json({
      success: true,
      data: existing,
    });
  } catch (err: any) {
    console.error('Error in POST /api/user/sync:', err);
    return NextResponse.json({ error: 'Sinxronizatsiyani saqlashda xatolik' }, { status: 500 });
  }
}
