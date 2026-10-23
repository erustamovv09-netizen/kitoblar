// app/lib/purchases.ts
// Helper to verify user purchase status (locally & with server verification)

export interface AccessResult {
  isPurchased: boolean;
  isPending: boolean;
  receiptNumber?: string;
  order?: any;
}

export async function checkBookAccess(bookId: string | number): Promise<AccessResult> {
  if (typeof window === 'undefined' || !bookId) {
    return { isPurchased: false, isPending: false };
  }

  const idStr = String(bookId);

  // 1. Check local confirmed purchases
  try {
    const raw = localStorage.getItem('purchased_books');
    if (raw) {
      const list = JSON.parse(raw);
      const found = list.find((p: any) => String(p.id) === idStr);
      if (found) {
        return { isPurchased: true, isPending: false, receiptNumber: found.receiptNumber, order: found };
      }
    }
  } catch {}

  // 2. Check pending / recent orders on server
  try {
    const rawPending = localStorage.getItem('pending_orders');
    const pendingList: any[] = rawPending ? JSON.parse(rawPending) : [];
    const pendingMatch = pendingList.find((p: any) => String(p.bookId) === idStr);

    const phone = localStorage.getItem('user_phone') || '';
    const query = pendingMatch?.receiptNumber
      ? `receipt=${encodeURIComponent(pendingMatch.receiptNumber)}`
      : phone
      ? `phone=${encodeURIComponent(phone)}&bookId=${encodeURIComponent(idStr)}`
      : null;

    if (query) {
      const res = await fetch(`/api/orders?${query}`).then(r => r.json()).catch(() => null);
      if (res?.order) {
        const order = res.order;
        if (order.status === 'completed' || order.status === 'delivered') {
          // Admin approved the payment! Sync to purchased_books
          const raw = localStorage.getItem('purchased_books');
          const list = raw ? JSON.parse(raw) : [];
          if (!list.some((p: any) => String(p.id) === idStr)) {
            list.push({
              id: idStr,
              title: order.bookTitle,
              author: order.bookAuthor,
              format: order.format,
              price: order.price,
              receiptNumber: order.receiptNumber,
              image: order.bookImage,
              date: order.createdAt,
            });
            localStorage.setItem('purchased_books', JSON.stringify(list));
            window.dispatchEvent(new CustomEvent('book-purchased', { detail: { bookId: idStr } }));
          }
          // Remove from pending
          const updatedPending = pendingList.filter((p: any) => String(p.bookId) !== idStr);
          localStorage.setItem('pending_orders', JSON.stringify(updatedPending));

          return { isPurchased: true, isPending: false, receiptNumber: order.receiptNumber, order };
        } else if (order.status === 'pending') {
          return { isPurchased: false, isPending: true, receiptNumber: order.receiptNumber, order };
        } else if (order.status === 'cancelled') {
          const updatedPending = pendingList.filter((p: any) => String(p.bookId) !== idStr);
          localStorage.setItem('pending_orders', JSON.stringify(updatedPending));
          return { isPurchased: false, isPending: false };
        }
      }
    }

    if (pendingMatch) {
      return { isPurchased: false, isPending: true, receiptNumber: pendingMatch.receiptNumber, order: pendingMatch };
    }
  } catch {}

  return { isPurchased: false, isPending: false };
}
