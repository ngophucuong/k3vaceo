// Giao diện của việc phát lại link mời cho người ĐÃ ĐĂNG NHẬP (mở rộng 5/9,
// xem kiem-moi.mjs cho phần máy chủ). Đây là tính năng sửa một LỖ HỔNG THẬT:
// trước bản này, ai cầm được link phát lại là đăng nhập thẳng vào tài khoản
// người khác — chỉ cần gõ một email tự chọn, không cần biết gì về người đó.
//
// Ba điều PHẢI đúng trên giao diện, không chỉ ở máy chủ (kiem-moi.mjs đã
// kiểm máy chủ, ở đây kiểm con người thật sẽ thấy gì):
//   1. Nút ở tab Danh bạ đổi nhãn đúng theo trạng thái người nhận — "Phát lại
//      link đăng nhập" cho người đã đăng nhập, không lẫn với "Tạo link mời"
//      của người chưa đăng nhập, để Ban cán sự lớp biết trước phải dặn người
//      nhận chuẩn bị đúng số điện thoại.
//   2. Ô "Điện thoại" ở màn nhận link PHẢI RỖNG khi mở link cho người đã đăng
//      nhập — máy chủ đã giấu số ở getInvite(), nhưng nếu giao diện lỡ điền
//      sẵn một giá trị nào đó (kể cả rỗng giả) thì cả chốt chặn sụp đổ: ai
//      cầm link cũng chỉ cần bấm Lưu mà không cần biết số thật.
//   3. Gõ sai số thì thấy đúng câu giải thích (không phải câu lỗi chung
//      chung), gõ đúng số thì vào được thật — đăng nhập thành công, không chỉ
//      dừng ở "không báo lỗi".
//   4. (Cập nhật 5/9 chiều) Hồ sơ CHƯA TỪNG có số điện thoại nào để đối chiếu
//      (ca thật: Đinh Khánh Toàn, Nhóm 9) thì KHÔNG bị bắt gõ số — để trống
//      và bấm Lưu vẫn phải vào được, không kẹt vĩnh viễn ở lỗi "số không khớp".
//
// Cần reset-moi.sh (dựng phiên Ngô Phú Cường + roster 105 đã đăng nhập + hồ
// sơ giả "Kiểm Tra Không Số" cho ca 4).
//
// Chạy:  bash scripts/kiem/reset-moi.sh  &&  node scripts/kiem/pw-nhanlai.mjs

import { chromium } from 'playwright-core';

let hong = 0;
const ok = (t, d) => { console.log((d ? '  ✓ ' : '  ✗ ') + t); if (!d) hong++; };
const B = 'http://127.0.0.1:8787';

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const c = await b.newContext({ viewport: { width: 390, height: 1100 } });
await c.addCookies([{ name: 's', value: 'tk-cuong-moi-xuyennhom', domain: '127.0.0.1', path: '/' }]);
const p = await c.newPage();
const loi = []; p.on('pageerror', e => loi.push(e.message));

console.log('── Tab Danh bạ → Cả lớp: nút đổi nhãn đúng theo trạng thái ──');
await p.goto(B + '/#/nhom'); await p.waitForTimeout(1500);
ok('ứng dụng thật sự nạp được (có thanh tab)', await p.locator('.nb[data-v="nhom"]').count() === 1);
await p.click('[data-the="lop"]'); await p.waitForTimeout(1000);

await p.fill('#dbTim', 'Nguyễn Thị Hằng Nhi'); await p.waitForTimeout(500);
await p.click('[data-db]'); await p.waitForTimeout(400);
ok('người ĐÃ đăng nhập: nút ghi "Phát lại link đăng nhập" (không phải "Tạo link mời")',
   (await p.locator('[data-moi]').innerText()) === 'Phát lại link đăng nhập');

await p.fill('#dbTim', 'Lê Thị Huế'); await p.waitForTimeout(500);
await p.click('[data-db]'); await p.waitForTimeout(400);
const coNutHue = await p.locator('[data-moi]').count();
if (coNutHue) {
  ok('người CHƯA đăng nhập: nút vẫn ghi "Tạo link mời" như cũ',
     (await p.locator('[data-moi]').innerText()) === 'Tạo link mời');
} else {
  ok('người CHƯA đăng nhập: có nút "Tạo link mời"', false);
}

console.log('\n── Bấm nút cho người đã đăng nhập, đọc lại link ──');
await p.fill('#dbTim', 'Nguyễn Thị Hằng Nhi'); await p.waitForTimeout(500);
await p.click('[data-db]'); await p.waitForTimeout(400);
await p.click('[data-moi]'); await p.waitForTimeout(600);
const sheetText = await p.locator('#sheet').innerText();
ok('sheet nói rõ phải gõ đúng số điện thoại mới vào lại được',
   sheetText.includes('gõ ĐÚNG số điện thoại'));
const url = sheetText.match(/http[^\s]+/)?.[0];
ok('lấy được link từ sheet', !!url);
ok('không lỗi JS ở tab Danh bạ: ' + (loi.join(' | ') || 'sạch'), loi.length === 0);
await b.close();

console.log('\n── Màn nhận link (ẩn danh, chưa đăng nhập gì) ──');
const token = url.split('/i/')[1];
const b2 = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const p2 = await (await b2.newContext({ viewport: { width: 390, height: 1100 } })).newPage();
const loi2 = []; p2.on('pageerror', e => loi2.push(e.message));
await p2.goto(`${B}/i/${token}`); await p2.waitForTimeout(1200);

ok('tiêu đề nói "sửa lại hồ sơ", không chào tên như người mới',
   (await p2.locator('h1').innerText()).includes('Sửa lại hồ sơ'));
ok('phụ đề giải thích phải gõ đúng số để xác nhận',
   (await p2.locator('.sub').innerText()).includes('xác nhận đúng là bạn'));

// ĐỐI CHỨNG QUAN TRỌNG NHẤT: ô điện thoại phải RỖNG. Nếu giao diện lỡ điền
// sẵn số thật vào đây (kể cả chỉ để "cho tiện sửa"), ai cầm link cũng đọc
// được số ngay trên màn hình rồi gõ y nguyên — chốt chặn ở máy chủ coi như
// không tồn tại, vì "biết số" không còn nghĩa là "đúng là chủ nhân hồ sơ".
ok('ô Điện thoại RỖNG — không lộ số thật ra màn hình cho người lạ đọc',
   (await p2.locator('#cPhone').inputValue()) === '');

await p2.fill('#cEmail', 'ke-la-thu@example.com');
await p2.click('#cSubmit'); await p2.waitForTimeout(500);
ok('bấm Lưu mà chưa gõ số điện thoại thì bị chặn ngay trên giao diện (chưa gọi máy chủ)',
   (await p2.locator('#cErr').innerText()).includes('số điện thoại'));

await p2.fill('#cPhone', '0111111111');
await p2.click('#cSubmit'); await p2.waitForTimeout(700);
ok('gõ số SAI thì thấy đúng câu giải thích (không phải câu lỗi chung chung)',
   (await p2.locator('#cErr').innerText()).includes('Gõ đúng số đã đăng ký'));
ok('vẫn còn ở màn nhận link, chưa vào được', p2.url().includes('/i/'));

await p2.fill('#cPhone', '0373780212');
await p2.click('#cSubmit'); await p2.waitForTimeout(900);
ok('gõ ĐÚNG số thì vào được thật — rời khỏi màn /i/, không chỉ hết báo lỗi',
   !p2.url().includes('/i/'));
ok('không lỗi JS ở màn nhận link: ' + (loi2.join(' | ') || 'sạch'), loi2.length === 0);

await b2.close();

// ── Ca "chưa từng có số nào để đối chiếu" (Đinh Khánh Toàn, 5/9 chiều) ─────
// reset-moi.sh dựng sẵn hồ sơ giả "Kiểm Tra Không Số" (đã nhận, roster không
// có số) đúng cho ca này — xem kiem-moi.mjs cho phần máy chủ. Ở đây kiểm
// GIAO DIỆN: người nhận link không bị bắt gõ một số sẽ chẳng bao giờ khớp.
console.log('\n── Màn nhận link khi hồ sơ CHƯA TỪNG có số để đối chiếu ──');
const rTim = await fetch(`${B}/api/wizard/roster/search?q=` + encodeURIComponent('Kiểm Tra Không Số'),
  { headers: { 'cf-connecting-ip': '203.0.113.90' } });
const idKhongSo = (await rTim.json()).people?.[0]?.roster_id;
const rMoi = await fetch(`${B}/api/danh-ba/${idKhongSo}/moi`, {
  method: 'POST', headers: { cookie: 's=tk-cuong-moi-xuyennhom', 'cf-connecting-ip': '203.0.113.90' },
});
const tokenKhongSo = (await rMoi.json()).url?.split('/i/')[1];
ok('lấy được link cho hồ sơ không có số', !!tokenKhongSo);

const b3 = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const p3 = await (await b3.newContext({ viewport: { width: 390, height: 1100 } })).newPage();
const loi3 = []; p3.on('pageerror', e => loi3.push(e.message));
await p3.goto(`${B}/i/${tokenKhongSo}`); await p3.waitForTimeout(1200);

ok('phụ đề nói rõ KHÔNG cần xác nhận thêm, không đòi gõ số',
   (await p3.locator('.sub').innerText()).includes('không cần xác nhận thêm'));
ok('nhãn "Điện thoại" KHÔNG có dấu * bắt buộc',
   !(await p3.locator('label.f', { hasText: 'Điện thoại' }).innerText()).includes('*'));

// Đối chứng quan trọng nhất của ca này: để TRỐNG ô điện thoại và bấm Lưu vẫn
// phải qua được — trước bản vá, dòng dưới sẽ mãi mãi dừng ở "Cần gõ đúng số
// điện thoại", đúng như Đinh Khánh Toàn đã vấp phải ngoài đời.
await p3.fill('#cEmail', 'khongso-giaodien@example.com');
await p3.click('#cSubmit'); await p3.waitForTimeout(900);
ok('để TRỐNG số điện thoại vẫn vào được — không còn kẹt vĩnh viễn',
   !p3.url().includes('/i/'));
ok('không lỗi JS ở màn này: ' + (loi3.join(' | ') || 'sạch'), loi3.length === 0);
await b3.close();

console.log(`\n${hong ? `✗ ${hong} phép kiểm đỏ` : '✓ tất cả xanh'}`);
process.exit(hong ? 1 : 0);
