// app/lib/telegram.ts
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

function getOrders(): any[] {
  try {
    if (!fs.existsSync(ORDERS_FILE)) return [];
    return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function saveOrders(orders: any[]): boolean {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf-8');
    return true;
  } catch {
    return false;
  }
}

export function approveOrder(orderId: string): any | null {
  const orders = getOrders();
  const idx = orders.findIndex((o) => String(o.id) === String(orderId) || String(o.receiptNumber) === String(orderId));
  if (idx === -1) return null;

  orders[idx].status = 'completed';
  orders[idx].statusLabel = "To'langan (Faol)";
  orders[idx].notes = (orders[idx].notes || '') + " [Telegram orqali tasdiqlandi]";
  saveOrders(orders);
  return orders[idx];
}

export function rejectOrder(orderId: string): any | null {
  const orders = getOrders();
  const idx = orders.findIndex((o) => String(o.id) === String(orderId) || String(o.receiptNumber) === String(orderId));
  if (idx === -1) return null;

  orders[idx].status = 'cancelled';
  orders[idx].statusLabel = "Bekor qilindi";
  orders[idx].notes = (orders[idx].notes || '') + " [Telegram orqali bekor qilindi]";
  saveOrders(orders);
  return orders[idx];
}

// Telegram Bot Polling Worker for instant confirmation (works on localhost & production without public webhook)
let isPollingStarted = false;
let lastUpdateId = 0;

export function ensureTelegramPolling() {
  if (isPollingStarted || typeof window !== 'undefined') return;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  isPollingStarted = true;

  async function poll() {
    try {
      const url = `https://api.telegram.org/bot${token}/getUpdates?offset=${lastUpdateId + 1}&timeout=20`;
      const res = await fetch(url).then(r => r.json()).catch(() => null);

      if (res?.ok && Array.isArray(res.result)) {
        for (const update of res.result) {
          lastUpdateId = Math.max(lastUpdateId, update.update_id);

          const callback = update.callback_query;
          if (callback && callback.data) {
            const data = String(callback.data);
            const callbackId = callback.id;
            const message = callback.message;
            const chatId = message?.chat?.id;
            const messageId = message?.message_id;

            if (data.startsWith('approve_')) {
              const orderId = data.replace('approve_', '');
              const updated = approveOrder(orderId);

              // 1. Answer popup
              await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  callback_query_id: callbackId,
                  text: updated ? "✅ To'lov tasdiqlandi! Kitob xaridorga ochildi." : "Buyurtma topilmadi",
                  show_alert: true,
                }),
              }).catch(() => {});

              // 2. Edit message to show confirmed badge
              if (messageId && chatId) {
                const isPhoto = Boolean(message.photo);
                const editUrl = isPhoto
                  ? `https://api.telegram.org/bot${token}/editMessageCaption`
                  : `https://api.telegram.org/bot${token}/editMessageText`;

                const existingText = message.caption || message.text || '';
                const newText = existingText
                  .replace(/📊 <b>Holati:<\/b> .*/g, '📊 <b>Holati:</b> ✅ TO\'LANGAN VA TASDIQLANDI')
                  + "\n\n🎉 <b>TO'LOV TASDIQLANDI! Kitob xaridorga ochildi.</b>";

                await fetch(editUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: chatId,
                    message_id: messageId,
                    [isPhoto ? 'caption' : 'text']: newText,
                    parse_mode: 'HTML',
                    reply_markup: {
                      inline_keyboard: [
                        [{ text: "✅ To'lov tasdiqlangan (Faol)", callback_data: "none" }]
                      ]
                    }
                  }),
                }).catch(() => {});
              }
            } else if (data.startsWith('reject_')) {
              const orderId = data.replace('reject_', '');
              const updated = rejectOrder(orderId);

              await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  callback_query_id: callbackId,
                  text: "❌ Buyurtma bekor qilindi.",
                  show_alert: true,
                }),
              }).catch(() => {});

              if (messageId && chatId) {
                const isPhoto = Boolean(message.photo);
                const editUrl = isPhoto
                  ? `https://api.telegram.org/bot${token}/editMessageCaption`
                  : `https://api.telegram.org/bot${token}/editMessageText`;

                const existingText = message.caption || message.text || '';
                const newText = existingText
                  .replace(/📊 <b>Holati:<\/b> .*/g, '📊 <b>Holati:</b> ❌ BEKOR QILINDI')
                  + "\n\n❌ <b>BUYURTMA BEKOR QILINDI!</b>";

                await fetch(editUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: chatId,
                    message_id: messageId,
                    [isPhoto ? 'caption' : 'text']: newText,
                    parse_mode: 'HTML',
                    reply_markup: {
                      inline_keyboard: [
                        [{ text: "❌ Bekor qilingan", callback_data: "none" }]
                      ]
                    }
                  }),
                }).catch(() => {});
              }
            }
          }
        }
      }
    } catch (e) {
      // Ignore network hiccup and continue
    } finally {
      // Poll again after short delay
      setTimeout(poll, 1500);
    }
  }

  // Start polling
  poll();
}
