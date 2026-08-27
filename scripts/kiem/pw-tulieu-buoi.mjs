import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';
const TK = readFileSync('tk.txt', 'utf8').trim();
const T7 = readFileSync('tk7.txt', 'utf8').trim();
let hong = 0;
const ok = (t, d) => { console.log((d ? '  ✓ ' : '  ✗ ') + t); if (!d) hong++; };
const B = 'http://127.0.0.1:8787';
const goi = (p, ck) => fetch(B + p, ck ? { headers: { cookie: `s=${ck}` } } : undefined)
  .then(async r => ({ ma: r.status, than: await r.json().catch(() => ({})) }));

console.log('── Trang CÔNG KHAI: chỉ số đếm, không tên, không đường dẫn ──');
const ck = (await goi('/api/lich/cong-khai')).than;
const raw = JSON.stringify(ck);
const b3 = ck.buoi.find(b => b.id === 3);
// 3 tư liệu của LỚP gắn vào buổi 3, nhưng một cái chưa có url → đếm 2
ok(`buổi 3 báo ${b3.so_tu_lieu} tài liệu (2 cái của lớp đã có đường dẫn)`, b3.so_tu_lieu === 2);
ok('KHÔNG rò tên tài liệu nào', !/THU /.test(raw));
ok('KHÔNG rò đường dẫn nào', !/drive\.google|https?:/.test(raw));
ok('KHÔNG có khoá url hay title của tư liệu', !/"url"|"tu_lieu"/.test(raw));
// Tư liệu của NHÓM 6 gắn vào cùng buổi 3 — con số công khai không được tính nó
ok('con số công khai KHÔNG tính tư liệu riêng của nhóm (N6)', b3.so_tu_lieu === 2);
ok('mục chưa có đường dẫn không bị đếm', b3.so_tu_lieu === 2);

console.log('── Đăng nhập: thấy đường dẫn thật ──');
const home = (await goi('/api/home', TK)).than;
const hb3 = home.lich_hoc.find(b => b.id === 3);
ok('buổi 3 có trong lịch sắp tới', !!hb3);
ok(`Cường thấy ${hb3.tu_lieu.length} tư liệu (3 của lớp + 1 của nhóm 6)`, hb3.tu_lieu.length === 4);
ok('có đường dẫn thật', hb3.tu_lieu.some(r => (r.url || '').includes('drive.google')));
ok('mục chưa có đường dẫn VẪN hiện (url null)', hb3.tu_lieu.some(r => !r.url));
// Tài liệu chính của Ban tổ chức phải đứng TRÊN ghi chép riêng của nhóm
ok('tư liệu của lớp xếp trước tư liệu của nhóm',
   hb3.tu_lieu.findIndex(r => r.scope === 'group') === hb3.tu_lieu.length - 1);

console.log('── N6: người nhóm 7 không thấy ghi chép của nhóm 6 ──');
const h7 = (await goi('/api/home', T7)).than;
const b7 = h7.lich_hoc.find(b => b.id === 3);
ok(`nhóm 7 chỉ thấy ${b7.tu_lieu.length} tư liệu của lớp`, b7.tu_lieu.length === 3);
ok('KHÔNG thấy ghi chép riêng của nhóm 6',
   !b7.tu_lieu.some(r => /nhóm 6/i.test(r.title)));
ok('nhưng vẫn thấy đủ tài liệu chung của lớp',
   b7.tu_lieu.length === 3 && b7.tu_lieu.every(r => r.scope === 'class'));

console.log('── /api/lich (đăng nhập) lọc y hệt /api/home ──');
const l6 = (await goi('/api/lich', TK)).than.lich_hoc.find(b => b.id === 3);
const l7 = (await goi('/api/lich', T7)).than.lich_hoc.find(b => b.id === 3);
ok('nhóm 6: /api/lich khớp /api/home', l6.tu_lieu.length === hb3.tu_lieu.length);
ok('nhóm 7: /api/lich khớp /api/home', l7.tu_lieu.length === b7.tu_lieu.length);

console.log('── Tư liệu: cùng MỘT dòng, kèm nhãn buổi ──');
const kho = (await goi('/api/links', TK)).than.links;
const gan = kho.filter(r => r.buoi_id === 3);
ok(`tab Tư liệu cũng thấy đủ ${gan.length} dòng ấy`, gan.length === 4);
ok('kèm ngày buổi để dán nhãn', gan.every(r => r.buoi_ngay === '2026-08-28'));
ok('kèm chủ đề buổi', gan.every(r => /Quản trị chiến lược/.test(r.buoi_chu_de || '')));
// id trùng khít giữa hai màn — bằng chứng là MỘT dòng chứ không phải bản sao
const idLich = new Set(hb3.tu_lieu.map(r => r.id));
ok('id ở màn Lịch trùng khít id ở màn Tư liệu (một dòng, không phải bản sao)',
   gan.every(r => idLich.has(r.id)) && gan.length === idLich.size);

console.log('── Sửa ở một chỗ là đổi cả hai ──');
const mot = gan.find(r => r.url && r.scope === 'class');
await fetch(`${B}/api/links/${mot.id}`, {
  method: 'PATCH', headers: { cookie: `s=${TK}`, 'content-type': 'application/json' },
  body: JSON.stringify({ title: 'THU Tên đã đổi' }),
});
const lai = (await goi('/api/home', TK)).than.lich_hoc.find(b => b.id === 3);
ok('đổi tên ở Tư liệu thì màn Lịch đổi theo ngay',
   lai.tu_lieu.some(r => r.id === mot.id && r.title === 'THU Tên đã đổi'));

// Trả tên về như cũ: bộ kiểm phải chạy lại được nhiều lần mà không tự làm
// hỏng tiền đề của chính mình.
await fetch(`${B}/api/links/${mot.id}`, {
  method: 'PATCH', headers: { cookie: `s=${TK}`, 'content-type': 'application/json' },
  body: JSON.stringify({ title: mot.title }),
});

console.log('── Gỡ khỏi buổi (buoi_id = null) ──');
await fetch(`${B}/api/links/${mot.id}`, {
  method: 'PATCH', headers: { cookie: `s=${TK}`, 'content-type': 'application/json' },
  body: JSON.stringify({ buoi_id: null }),
});
const sauGo = (await goi('/api/home', TK)).than.lich_hoc.find(b => b.id === 3);
ok('gỡ xong thì biến khỏi màn Lịch', !sauGo.tu_lieu.some(r => r.id === mot.id));
ok('nhưng VẪN còn trong Tư liệu (chỉ gỡ khỏi buổi, không xoá)',
   (await goi('/api/links', TK)).than.links.some(r => r.id === mot.id));
// gắn lại cho các phép kiểm sau
await fetch(`${B}/api/links/${mot.id}`, {
  method: 'PATCH', headers: { cookie: `s=${TK}`, 'content-type': 'application/json' },
  body: JSON.stringify({ buoi_id: 3 }),
});

console.log('── Buổi id bịa ra thì bị chặn ──');
const bia = await fetch(`${B}/api/links/${mot.id}`, {
  method: 'PATCH', headers: { cookie: `s=${TK}`, 'content-type': 'application/json' },
  body: JSON.stringify({ buoi_id: 999999 }),
});
ok(`gắn vào buổi không có thật → ${bia.status} (404)`, bia.status === 404);
const xau = await fetch(`${B}/api/links`, {
  method: 'POST', headers: { cookie: `s=${TK}`, 'content-type': 'application/json' },
  body: JSON.stringify({ url: 'https://a.com/x', title: 'THU xau', buoi_id: 'abc' }),
});
ok(`buoi_id không phải số → ${xau.status} (422)`, xau.status === 422);

console.log('── Giao diện ──');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const c = await b.newContext({ viewport: { width: 390, height: 1100 }, deviceScaleFactor: 2 });
await c.addCookies([{ name: 's', value: TK, domain: '127.0.0.1', path: '/' }]);
const p = await c.newPage();
const loi = []; p.on('pageerror', e => loi.push(e.message));
await p.goto(B + '/#/nay'); await p.waitForTimeout(2200);
ok('ứng dụng thật sự nạp được (có thanh tab)', await p.locator('.nb[data-v="nay"]').count() === 1);
ok('không lỗi JS: ' + (loi.join(' | ') || 'sạch'), loi.length === 0);
ok('có khối tư liệu dưới buổi', await p.locator('.tlb').count() > 0);
// Buổi 27/8 cũng có tư liệu nên .tlb ĐẦU TIÊN không phải buổi 28/8. Nhắm theo
// khung giờ 13:30–14:30, thứ chỉ buổi 3 có.
const khoiB3 = p.locator('.fd').filter({ hasText: '13:30' }).first().locator('.tlb');
ok('hiện đủ 4 mục dưới buổi 28/8 13:30',
   await khoiB3.locator('a, .trong').count() === 4);
ok('mục chưa có link hiện dạng chữ xám, KHÔNG bấm được',
   await khoiB3.locator('.trong').count() === 1);
ok('mục có link là thẻ <a> mở tab mới',
   (await khoiB3.locator('a').first().getAttribute('target')) === '_blank');
ok('không tràn ngang', await p.evaluate(() => document.documentElement.scrollWidth <= 390));
await p.screenshot({ path: 'tulieu-buoi-nay.png', fullPage: true });

await p.click('.nb[data-v="kho"]'); await p.waitForTimeout(1600);
ok('tab Tư liệu có nhãn buổi', await p.locator('.nb-buoi').count() >= 3);
ok('nhãn ghi đúng ngày',
   (await p.locator('.nb-buoi').first().innerText()).includes('28/8'));
await p.screenshot({ path: 'tulieu-nhan-buoi.png', fullPage: true });

// Sheet sửa phải giữ đúng buổi đang gắn
await p.locator('[data-sualink]').first().click(); await p.waitForTimeout(700);
ok('sheet sửa có ô chọn buổi', await p.locator('#eB').count() === 1);
const daChon = await p.locator('#eB').inputValue();
ok(`ô chọn buổi giữ đúng buổi đang gắn (${daChon || 'trống'})`, daChon !== '');
await p.screenshot({ path: 'tulieu-sheet-buoi.png' });
await b.close();

console.log('── Trang /lich công khai trong trình duyệt, KHÔNG cookie ──');
const b2 = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const c2 = await b2.newContext({ viewport: { width: 390, height: 1000 }, deviceScaleFactor: 2 });
const p2 = await c2.newPage();
const loi2 = []; p2.on('pageerror', e => loi2.push(e.message));
await p2.goto(B + '/lich/'); await p2.waitForTimeout(1800);
ok('trang lịch thật sự nạp được', await p2.locator('#ds .b').count() > 0);
ok('không lỗi JS: ' + (loi2.join(' | ') || 'sạch'), loi2.length === 0);
const vb = await p2.locator('body').innerText();
ok('hiện "2 tài liệu · đăng nhập để mở"', /2\s*tài liệu[\s\S]{0,30}đăng nhập để mở/.test(vb));
ok('KHÔNG hiện tên tài liệu nào', !/THU /.test(vb));
const hrefs = await p2.locator('a').evaluateAll(a => a.map(x => x.getAttribute('href')));
ok('KHÔNG có thẻ <a> nào trỏ ra Drive', !hrefs.some(h => (h || '').includes('drive.google')));
ok('chữ "đăng nhập để mở" trỏ về ứng dụng', hrefs.includes('/'));
await p2.screenshot({ path: 'lich-cong-khai-tulieu.png', fullPage: true });
await b2.close();

console.log(hong ? `\n${hong} HỎNG` : '\nĐÚNG HẾT');
process.exit(hong ? 1 : 0);
