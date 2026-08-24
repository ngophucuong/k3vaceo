// Service worker. Hai việc, và CỐ Ý chỉ hai việc:
//
//   1. Nhận thông báo đẩy rồi hiện lên.
//   2. Bấm vào thông báo thì mở ứng dụng, ưu tiên tab đang mở sẵn.
//
// KHÔNG cache gì cả. Đây là chỗ dễ tự bắn vào chân nhất của PWA: cache sai một
// lần là người dùng chạy bản cũ hàng tuần mà không hiểu vì sao, và cách chữa
// duy nhất là bảo họ xoá dữ liệu trình duyệt. Ứng dụng này nhẹ và luôn cần số
// liệu mới nhất (ai đã nộp quỹ, lịch học đổi chưa) — chạy offline không có
// giá trị gì, mà rủi ro thì thật.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', event => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch { /* gói lạ thì vẫn hiện */ }
  const title = d.title || 'k3vaceo';
  event.waitUntil(self.registration.showNotification(title, {
    body: d.body || 'Có thông báo mới.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    // tag để hai thông báo của cùng một tin không chồng thành hai dòng.
    tag: d.tag || 'k3vaceo',
    data: { url: d.url || '/nay' },
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const dich = (event.notification.data && event.notification.data.url) || '/nay';
  event.waitUntil((async () => {
    const ds = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of ds) {
      // Đã mở sẵn thì chuyển tab ấy sang đúng màn, đừng mở thêm cửa sổ thứ hai.
      if (new URL(c.url).origin === self.location.origin) {
        await c.focus();
        if ('navigate' in c) { try { await c.navigate(dich); } catch { /* focus là đủ */ } }
        return;
      }
    }
    await self.clients.openWindow(dich);
  })());
});
