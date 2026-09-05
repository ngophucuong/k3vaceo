// "Cảm giác ứng dụng, không phải trang web" — giữ lại các chỉnh sửa ngày 5/9.
//
// Vì sao bộ kiểm này đáng có: lỗi khiến nó ra đời KHÔNG phải lỗi logic, mà là
// một dòng CSS còn THIẾU — đầu trang không chừa chỗ cho thanh trạng thái, nên
// khi cài lên màn hình chính thì "Nhóm 6" vẽ chồng lên đồng hồ hệ thống. Không
// phép kiểm API nào thấy được, không lỗi JS nào nổi lên, deploy vẫn xanh; chỉ
// người dùng thật mở ứng dụng mới thấy (Ngô Phú Cường chụp màn hình gửi lại).
// Cùng loại với bài học đã ghi trong CLAUDE.md: "chỉ ảnh chụp mới thấy — phép
// kiểm chuỗi không thấy".
//
// Phép ĐỐI CHỨNG đáng giữ nhất ở đây là phép NGƯỢC: sau khi tắt bôi đen chữ
// cho khung sườn, phải chứng minh SỐ ĐIỆN THOẠI trong Danh bạ VẪN copy được.
// Đặt nhầm `user-select:none` lên `body` cho gọn thì màn hình trông y hệt, mà
// danh bạ mất đúng việc nó sinh ra để làm — chép số gọi cho nhau.
//
// Cần reset-moi.sh (dựng phiên Ngô Phú Cường), và wrangler.toml phải BẬT khối
// [assets] để phục vụ giao diện — nhớ tắt lại trước khi commit.
//
// Chạy:  bash scripts/kiem/reset-moi.sh  &&  node scripts/kiem/pw-mobile.mjs

import { chromium } from 'playwright-core';

let hong = 0;
const ok = (t, d) => { console.log((d ? '  ✓ ' : '  ✗ ') + t); if (!d) hong++; };
const B = 'http://127.0.0.1:8787';

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const c = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await c.addCookies([{ name: 's', value: 'tk-cuong-moi-xuyennhom', domain: '127.0.0.1', path: '/' }]);
const p = await c.newPage();
const loi = []; p.on('pageerror', e => loi.push(e.message));

// Mọi bộ kiểm giao diện phải mở đầu bằng phép này: đã có lần bộ kiểm báo
// "không lỗi JS: sạch" trên một trang CHƯA HỀ NẠP (quên bật [assets] nên `/`
// trả JSON — trang không có JS thì tất nhiên không có lỗi JS).
await p.goto(B + '/#/nhom'); await p.waitForTimeout(1600);
ok('ứng dụng thật sự nạp được (có thanh tab)', await p.locator('.nb[data-v="nhom"]').count() === 1);

console.log('\n── Thẻ meta ──');
const vp = await p.getAttribute('meta[name=viewport]', 'content');
ok(`viewport khoá zoom: ${vp}`, /user-scalable=no/.test(vp) && /viewport-fit=cover/.test(vp));
ok('theme-color khớp nền sáng (#F3F3F1), không phải màu tối cắt ngang đầu trang',
   (await p.getAttribute('meta[name=theme-color]', 'content')) === '#F3F3F1');
ok('thanh trạng thái iOS là "default" — black-translucent làm chữ giờ trắng trên nền sáng',
   (await p.getAttribute('meta[name="apple-mobile-web-app-status-bar-style"]', 'content')) === 'default');

console.log('\n── Hành vi chạm ──');
ok('html có touch-action:manipulation (bỏ chạm-hai-lần-phóng + 300ms trễ)',
   await p.evaluate(() => getComputedStyle(document.documentElement).touchAction) === 'manipulation');
ok('body chặn kéo căng mép / kéo-xuống-tải-lại',
   await p.evaluate(() => getComputedStyle(document.body).overscrollBehaviorY) === 'none');
ok('đầu trang KHÔNG bôi đen được (khung sườn)',
   await p.evaluate(() => getComputedStyle(document.querySelector('header')).userSelect) === 'none');

// ĐỐI CHỨNG NGƯỢC — xem đầu tệp. Không có phép này thì phép trên xanh cả khi
// đã lỡ tắt bôi đen cho TOÀN BỘ trang.
//
// Phải chọn người ĐÃ ĐĂNG NHẬP: số của người chưa đăng nhập bị che ở máy chủ,
// và số đã che CỐ Ý không bọc trong `tel:` (bấm vào là gọi một số không có
// thật) — nên tìm `a[href^="tel:"]` ở một người chưa đăng nhập sẽ không thấy
// gì, và phép kiểm đỏ vì lý do chẳng liên quan. reset-moi.sh dựng sẵn Nguyễn
// Thị Hằng Nhi (roster 105) ĐÃ nhận hồ sơ kèm số của danh sách gốc.
await p.click('[data-the="lop"]'); await p.waitForTimeout(900);
await p.fill('#dbTim', 'Nguyễn Thị Hằng Nhi'); await p.waitForTimeout(600);
await p.click('[data-db]'); await p.waitForTimeout(500);
const chonDuoc = await p.evaluate(() => {
  const a = document.querySelector('a[href^="tel:"]');
  return a ? getComputedStyle(a).userSelect : 'khong-thay-so-nao (chạy reset-moi.sh chưa?)';
});
ok(`số điện thoại trong Danh bạ VẪN copy được (user-select: ${chonDuoc})`,
   chonDuoc === 'auto' || chonDuoc === 'text');

console.log('\n── Ô nhập: 16px để iOS không tự phóng ──');
const co = await p.evaluate(() => getComputedStyle(document.querySelector('#dbTim')).fontSize);
ok(`ô tìm kiếm là ${co} (cần ≥ 16px, dưới ngưỡng này Safari tự phóng cả trang)`,
   parseFloat(co) >= 16);

// Chromium trên máy chủ không có "tai thỏ" nên env(safe-area-inset-*) luôn = 0
// và computed style không nói được gì. Đọc thẳng LUẬT trong stylesheet.
console.log('\n── Luật safe-area có mặt trong stylesheet ──');
const luat = await p.evaluate(async () => {
  const css = (await fetch('/app.css').then(r => r.text())).replace(/\s*\n\s*/g, '');
  return {
    top: /header\{[^}]*padding-top:env\(safe-area-inset-top\)/.test(css),
    dvh: css.includes('100dvh') && css.includes('90dvh'),
    sheet: css.includes('overscroll-behavior:contain'),
  };
});
ok('đầu trang chừa chỗ cho thanh trạng thái (env safe-area-inset-top)', luat.top);
ok('dùng dvh cho sheet và màn nhận link (vh tính sai khi thanh địa chỉ hiện ra)', luat.dvh);
ok('sheet không kéo lây trang nền phía sau', luat.sheet);

ok('không lỗi JS: ' + (loi.join(' | ') || 'sạch'), loi.length === 0);
await p.screenshot({ path: '/tmp/k3vaceo-mobile.png' });
await b.close();
console.log(`\n${hong ? `✗ ${hong} phép kiểm đỏ` : '✓ tất cả xanh'}`);
process.exit(hong ? 1 : 0);
