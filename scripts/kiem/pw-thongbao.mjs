// Thông báo: link bấm được, sửa lại được, và có thanh định dạng (thêm 5/9).
//
// Ba việc Ngô Phú Cường yêu cầu sau khi gửi ảnh một thông báo có dán nguyên si
// đường dẫn Outline: đọc được mà bấm không được, đăng rồi thì không sửa lại
// được, và không có cách nào làm đậm hay xuống gạch đầu dòng.
//
// Phép ĐỐI CHỨNG đáng giữ nhất ở đây là phép N6 ở đường SỬA: thông báo nội bộ
// của nhóm khác phải trả 404 chứ KHÔNG phải 403 — 403 là xác nhận id ấy có
// thật, dò dần là dựng lại được có bao nhiêu thông báo của nhóm nào (quy ước 6
// trong CLAUDE.md). Một phép kiểm chỉ hỏi "có bị chặn không" sẽ ĐẬU cả với 403.
//
// Cần reset-thongbao.sh, và wrangler.toml phải BẬT khối [assets] để phục vụ
// giao diện — nhớ tắt lại trước khi commit.
//
// Chạy:  bash scripts/kiem/reset-thongbao.sh  &&  node scripts/kiem/pw-thongbao.mjs

import { chromium } from 'playwright-core';

let hong = 0;
const ok = (t, d) => { console.log((d ? '  ✓ ' : '  ✗ ') + t); if (!d) hong++; };
const B = 'http://127.0.0.1:8787';
const CK = 's=tk-cuong-thongbao';

/* ══ Phần máy chủ ══════════════════════════════════════════════════════════ */
console.log('── Máy chủ: PATCH /api/thong-bao/:id ──');
const home = await fetch(`${B}/api/home`, { headers: { cookie: CK } }).then(r => r.json());
const cua6 = (home.thong_bao ?? []).find(t => t.noi_dung.startsWith('KIEMTB_nhom6'));
ok('thấy thông báo của Nhóm 6 trong /api/home', !!cua6);

// N6: thông báo của nhóm khác không được lọt vào /api/home của mình.
ok('KHÔNG thấy thông báo nội bộ của nhóm khác',
   !(home.thong_bao ?? []).some(t => t.noi_dung.startsWith('KIEMTB_nhomkhac')));

const patch = (id, than) => fetch(`${B}/api/thong-bao/${id}`, {
  method: 'PATCH', headers: { cookie: CK, 'content-type': 'application/json' },
  body: JSON.stringify(than),
});

const rSua = await patch(cua6.id, { noi_dung: 'KIEMTB_nhom6 đã sửa https://vi.wikipedia.org/wiki/VCCI' });
ok(`sửa được thông báo của nhóm mình (nhận ${rSua.status})`, rSua.status === 200);

const home2 = await fetch(`${B}/api/home`, { headers: { cookie: CK } }).then(r => r.json());
const sau = (home2.thong_bao ?? []).find(t => t.id === cua6.id);
ok('nội dung đã đổi thật, không phải chỉ trả 200 suông',
   sau?.noi_dung === 'KIEMTB_nhom6 đã sửa https://vi.wikipedia.org/wiki/VCCI');

// Gửi thiếu trường thì GIỮ NGUYÊN, không xoá trắng (cùng khuôn với patchLink).
await patch(cua6.id, { nguon: 'Ban cán sự lớp' });
const home3 = await fetch(`${B}/api/home`, { headers: { cookie: CK } }).then(r => r.json());
const sau3 = (home3.thong_bao ?? []).find(t => t.id === cua6.id);
ok('gửi thiếu noi_dung thì giữ nguyên nội dung cũ, không xoá trắng',
   sau3?.noi_dung === 'KIEMTB_nhom6 đã sửa https://vi.wikipedia.org/wiki/VCCI');
ok('trường gửi lên thì được cập nhật', sau3?.nguon === 'Ban cán sự lớp');

// ĐỐI CHỨNG N6 — xem đầu tệp. Phải đọc id thật của thông báo nhóm khác từ D1
// (không có đường API nào cho ta thấy nó, đó chính là điều đang kiểm), nên
// lấy bằng cách thử id lân cận: id của nhóm khác nằm ngay cạnh id vừa tạo.
const thuId = cua6.id + 1;
const rKhac = await patch(thuId, { noi_dung: 'không được phép' });
ok(`sửa thông báo của nhóm khác → 404 chứ KHÔNG phải 403 (nhận ${rKhac.status})`,
   rKhac.status === 404);

/* ══ Phần giao diện ════════════════════════════════════════════════════════ */
console.log('\n── Giao diện: tab Hôm nay ──');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const c = await b.newContext({ viewport: { width: 390, height: 900 } });
await c.addCookies([{ name: 's', value: 'tk-cuong-thongbao', domain: '127.0.0.1', path: '/' }]);
const p = await c.newPage();
const loi = []; p.on('pageerror', e => loi.push(e.message));
await p.goto(B + '/#/nay'); await p.waitForTimeout(1600);
ok('ứng dụng thật sự nạp được (có thanh tab)', await p.locator('.nb[data-v="nay"]').count() === 1);

// Đây là yêu cầu gốc: URL dán thẳng phải BẤM ĐƯỢC, không chỉ đọc được.
const neo = p.locator('#v-nay .warn a[href="https://vi.wikipedia.org/wiki/VCCI"]');
ok('URL dán thẳng trong thông báo thành thẻ <a> bấm được', await neo.count() === 1);
ok('link mở tab mới (target=_blank)', (await neo.getAttribute('target')) === '_blank');
ok('có rel="noopener" — tab mới không cầm được window.opener',
   (await neo.getAttribute('rel') || '').includes('noopener'));

console.log('\n── Giao diện: sửa lại thông báo ──');
await p.click(`#v-nay [data-suatb="${cua6.id}"]`); await p.waitForTimeout(500);
ok('mở được sheet sửa', (await p.locator('#sheet h3').innerText()).includes('Sửa thông báo'));
ok('ô nội dung điền sẵn bản đang có',
   (await p.locator('#tbND').inputValue()).startsWith('KIEMTB_nhom6 đã sửa'));
// Cấp (ai nhận) KHÔNG được sửa — đổi thông báo nhóm thành thông báo lớp là
// đem việc nội bộ cho 146 người đọc, mà nhật ký chỉ ghi "đã sửa".
ok('KHÔNG có ô chọn "ai nhận" khi sửa — cấp không đổi được',
   await p.locator('#tbCap').count() === 0);

console.log('\n── Thanh định dạng B / I / gạch đầu dòng ──');
ok('có đủ bốn nút', await p.locator('#tbBar [data-md]').count() === 4);

// Xem trước phải dựng bằng chính mdSafe(), nên nó là phép kiểm gián tiếp rằng
// người soạn thấy đúng thứ người đọc sẽ thấy.
ok('ô xem trước dựng sẵn nội dung hiện có',
   (await p.locator('#tbXem a').count()) === 1);

await p.fill('#tbND', 'thử'); await p.waitForTimeout(150);
await p.locator('#tbND').selectText();
await p.click('#tbBar [data-md="b"]'); await p.waitForTimeout(200);
ok('bấm B bọc phần đang chọn bằng **…**', (await p.locator('#tbND').inputValue()) === '**thử**');
ok('xem trước hiện ngay chữ đậm', await p.locator('#tbXem b').count() === 1);

await p.locator('#tbND').selectText();
await p.click('#tbBar [data-md="i"]'); await p.waitForTimeout(200);
ok('bấm I bọc tiếp bằng *…*', (await p.locator('#tbND').inputValue()) === '***thử***');

await p.fill('#tbND', 'một\nhai'); await p.waitForTimeout(150);
await p.locator('#tbND').selectText();
await p.click('#tbBar [data-md="ul"]'); await p.waitForTimeout(200);
ok('bấm gạch đầu dòng thêm "- " cho TỪNG DÒNG đang chọn',
   (await p.locator('#tbND').inputValue()) === '- một\n- hai');
ok('xem trước ra danh sách hai mục', await p.locator('#tbXem ul li').count() === 2);

// Lưu thật, rồi đọc lại từ máy chủ — không dừng ở "sheet đóng lại".
await p.fill('#tbND', 'KIEMTB_nhom6 **chốt** cuối'); await p.waitForTimeout(150);
await p.click('#tbLuu'); await p.waitForTimeout(900);
const home4 = await fetch(`${B}/api/home`, { headers: { cookie: CK } }).then(r => r.json());
ok('lưu từ giao diện đi tới máy chủ thật',
   (home4.thong_bao ?? []).find(t => t.id === cua6.id)?.noi_dung === 'KIEMTB_nhom6 **chốt** cuối');
ok('thẻ thông báo hiện chữ đậm đã dựng', await p.locator('#v-nay .warn b').count() >= 1);

ok('không lỗi JS: ' + (loi.join(' | ') || 'sạch'), loi.length === 0);
await p.screenshot({ path: '/tmp/k3vaceo-thongbao.png' });
await b.close();

console.log(`\n${hong ? `✗ ${hong} phép kiểm đỏ` : '✓ tất cả xanh'}`);
process.exit(hong ? 1 : 0);
