import { chromium } from 'playwright-core';
let hong = 0;
const ok = (t, d) => { console.log((d ? '  ✓ ' : '  ✗ ') + t); if (!d) hong++; };
const B = 'http://127.0.0.1:8787';

console.log('── API công khai: không cookie ──');
const r = await fetch(B + '/api/lich/cong-khai');
const d = await r.json();
ok(`mã ${r.status} — không cần đăng nhập`, r.status === 200);
ok(`có ${d.buoi.length} buổi`, d.buoi.length > 0);
ok('có hom_nay do máy chủ sinh', /^\d{4}-\d{2}-\d{2}$/.test(d.hom_nay ?? ''));
ok('có ngày bảo vệ', !!d.khoa?.defense_on);

console.log('── N6: đường công khai KHÔNG được rò gì khác ──');
const raw = JSON.stringify(d);
ok('không có thong_bao (có loại nội bộ của nhóm)', !('thong_bao' in d) && !/thong_bao/.test(raw));
ok('không có tên thành viên nào', !/Ngô Phú Cường|full_name|member/i.test(raw));
ok('không có gì về quỹ', !/fund|quy_|account_no|amount/i.test(raw));
ok('không có email hay điện thoại', !/@|phone|email/i.test(raw));
// người lạ không lấy được các đường cần phiên
for (const p of ['/api/home', '/api/lich', '/api/funds']) {
  const x = await fetch(B + p);
  ok(`${p} vẫn đòi đăng nhập (${x.status})`, x.status === 401);
}

console.log('── Trang /lich/ trong Chromium ──');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
// context SẠCH, không cookie — đúng cảnh người hoài nghi bấm vào link
const c = await b.newContext({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 2 });
const p = await c.newPage();
const loi = [], csp = [];
p.on('pageerror', e => loi.push(e.message));
p.on('console', m => { if (/Content Security Policy|Refused to/i.test(m.text())) csp.push(m.text()); });

await p.goto(B + '/lich/');
await p.waitForTimeout(1800);

ok('không lỗi JS: ' + (loi.join(' | ') || 'sạch'), loi.length === 0);
ok('không bị CSP chặn: ' + (csp.join(' | ') || 'sạch'), csp.length === 0);
ok('CSS rời có nạp (nền đúng màu app)',
   (await p.evaluate(() => getComputedStyle(document.body).backgroundColor)) === 'rgb(243, 243, 241)');

const vb = await p.locator('body').innerText();
ok('hiện "Buổi tiếp theo"', /BUỔI TIẾP THEO/i.test(vb));
ok(`hiện đủ ${d.buoi.length} buổi`, await p.locator('.b').count() === d.buoi.length);
ok('có nút thêm vào lịch', await p.locator('#nutIcs').isVisible());
ok('nút trỏ đúng tệp ics',
   (await p.locator('#nutIcs').getAttribute('href')) === '/api/lich/k3vaceo.ics');
ok('có đếm ngược tới buổi bảo vệ', await p.locator('#dem').isVisible());
ok('nói rõ lịch chưa đủ buổi', /Còn \d+ buổi chưa công bố lịch/.test(vb));
// Lịch trải tháng 8 sang tháng 9 — thiếu nhãn tháng thì "11 Th sáu" đọc như 11/8
const soThang = new Set(d.buoi.map(x => x.ngay.slice(0, 7))).size;
ok(`có ${soThang} nhãn tháng cho ${soThang} tháng`, await p.locator('.thang').count() === soThang);
ok('tiêu đề không bị xuống dòng ở khổ 390px',
   await p.locator('.hl .g').evaluate(e => e.getBoundingClientRect().height < 30));

console.log('── Buổi hôm nay và buổi đã huỷ ──');
ok('buổi hôm nay được đánh dấu', await p.locator('.b.naydau').count() === 1);
const huy = d.buoi.filter(x => x.da_huy).length;
ok(`${huy} buổi đã huỷ được đánh dấu`, await p.locator('.b.dahuy').count() === huy);
if (huy) {
  ok('buổi huỷ có CHỮ "đã huỷ", không chỉ đổi màu',
     (await p.locator('.b.dahuy .chip.huy').first().innerText()).toLowerCase().includes('huỷ'));
  ok('và chữ bị gạch ngang (mã hoá thứ hai)',
     (await p.locator('.b.dahuy .de').first().evaluate(e => getComputedStyle(e).textDecorationLine))
       .includes('line-through'));
}

console.log('── Trình bày ──');
ok('không tràn ngang ở khổ 390px',
   await p.evaluate(() => document.documentElement.scrollWidth <= 390));
ok('không có chữ viết tắt "BCS" (N7)', !/\bBCS\b/.test(vb));
ok('trang không đòi nhập gì (không có ô nhập nào)',
   await p.locator('input, textarea').count() === 0);

console.log('── Bấm nút thì ra tệp lịch thật ──');
const ics = await p.request.get(B + '/api/lich/k3vaceo.ics');
ok(`trả text/calendar (${ics.headers()['content-type']})`,
   (ics.headers()['content-type'] || '').includes('text/calendar'));
ok('thân tệp mở bằng BEGIN:VCALENDAR', (await ics.text()).startsWith('BEGIN:VCALENDAR'));

await p.screenshot({ path: 'lich-cong-khai.png', fullPage: true });

console.log('── Khổ máy tính ──');
const c2 = await b.newContext({ viewport: { width: 1280, height: 900 } });
const p2 = await c2.newPage();
await p2.goto(B + '/lich/'); await p2.waitForTimeout(1500);
ok('khổ rộng vẫn không tràn ngang',
   await p2.evaluate(() => document.documentElement.scrollWidth <= 1280));
await p2.screenshot({ path: 'lich-may-tinh.png' });

await b.close();
console.log(hong ? `\n${hong} HỎNG` : '\nĐÚNG HẾT');
process.exit(hong ? 1 : 0);
