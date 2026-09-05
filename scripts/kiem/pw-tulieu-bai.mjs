// Liên thông Bài ↔ Tư liệu — phần thứ ba của "một dòng, hai/ba màn"
// (buổi học đã liên thông từ trước; đây là phần bài, links.section_id).
//
// Bốn điều phải chứng minh bằng trình duyệt thật, không chỉ bằng API:
// 1. Sheet sửa một phần bài (openSectionEdit) có nút "+ Gắn tư liệu cho phần
//    này" và, sau khi gắn, hiện lại đúng ghi chú đó (veTuLieuGan dùng chung
//    với buổi học).
// 2. Thẻ phần bài ở tab Bài (drawBai) hiện huy hiệu "📎 N tư liệu".
// 3. Tab Tư liệu (Kho) gộp các mục gắn-vào-phần dưới đề mục riêng
//    "Theo phần bài", và dòng meta đọc đúng "Phần N · tên phần" (nhanGan).
// 4. N6: mở sheet "Gắn Tư liệu" ngay từ một phần bài thì ô "Thuộc phần bài
//    nào" phải có sẵn đúng phần đang mở, chọn sẵn (preSection).
//
// Cần phiên của Ngô Phú Cường — chạy reset-tulieu-text.sh trước (dựng đúng
// phiên tk-cuong-tulieu-text đang dùng chung cho các bộ kiểm Tư liệu).
//
// Chạy:  bash scripts/kiem/reset-tulieu-text.sh  &&  node scripts/kiem/pw-tulieu-bai.mjs

import { chromium } from 'playwright-core';

let hong = 0;
const ok = (t, d) => { console.log((d ? '  ✓ ' : '  ✗ ') + t); if (!d) hong++; };
const B = 'http://127.0.0.1:8787';
const TOK = 'tk-cuong-tulieu-text';

// Dọn rác của lần chạy trước, phòng khi bị ngắt giữa chừng.
async function donRac() {
  const doc = await fetch(`${B}/api/links`, { headers: { cookie: `s=${TOK}` } }).then(r => r.json());
  for (const r of doc.links ?? []) {
    if (r.title?.startsWith('KIEMBAI_')) {
      await fetch(`${B}/api/links/${r.id}`, { method: 'DELETE', headers: { cookie: `s=${TOK}` } });
    }
  }
}
await donRac();

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const c = await b.newContext({ viewport: { width: 390, height: 1100 }, deviceScaleFactor: 2 });
await c.addCookies([{ name: 's', value: TOK, domain: '127.0.0.1', path: '/' }]);
const p = await c.newPage();
const loi = []; p.on('pageerror', e => loi.push(e.message));
await p.goto(B + '/#/bai'); await p.waitForTimeout(2000);

ok('ứng dụng thật sự nạp được (có thanh tab)', await p.locator('.nb[data-v="bai"]').count() === 1);
ok('không lỗi JS khi mở tab Bài: ' + (loi.join(' | ') || 'sạch'), loi.length === 0);

console.log('── Mở sheet Phần 1 (Nghiên cứu Marketing), gắn một ghi chú Text ──');
await p.locator('button.pt', { hasText: 'Nghiên cứu Marketing' }).click();
await p.waitForTimeout(500);
ok('sheet phần bài mở ra đúng tiêu đề', (await p.locator('#sheet h3').innerText()).includes('Nghiên cứu Marketing'));
ok('có nút "+ Gắn tư liệu cho phần này"', await p.locator('#sAddLink').count() === 1);

await p.click('#sAddLink'); await p.waitForTimeout(500);
ok('mở sheet Gắn Tư liệu', await p.locator('#lSave').count() === 1);
ok('mặc định "Dùng cho" = Cho bài (vì mở từ một phần bài)', await p.locator('#lT').inputValue() === 'bai');
ok('ô chọn phần bài ĐANG HIỆN (không phải ô chọn buổi)',
   await p.locator('#lPhanBox').isVisible() && !(await p.locator('#lBuoiBox').isVisible()));
const phanDangChon = await p.locator('#lP option:checked').innerText();
ok('ô chọn phần bài đã CHỌN SẴN đúng phần đang mở (preSection)', phanDangChon.includes('Nghiên cứu Marketing'));

await p.click('#modeText'); await p.waitForTimeout(200);
const TIEU_DE = 'KIEMBAI_ghichuphan';
await p.fill('#lC', '# Ghi chú Phần 1\n\nMột đoạn kiểm thử liên thông Bài.');
await p.fill('#lN', TIEU_DE);
await p.click('#lSave'); await p.waitForTimeout(700);
ok('sheet đóng lại sau khi lưu', !(await p.locator('#lSave').isVisible().catch(() => false)));

console.log('── Tab Bài: sheet phần bài và thẻ tổng đều thấy tư liệu vừa gắn ──');
// openSheet() thay nguyên nội dung #sheet, không xếp chồng — lưu xong là đóng
// hẳn veil, quay về màn dưới (tab Bài vừa được drawBai() vẽ lại). Muốn thấy
// lại ghi chú trong sheet phần bài thì phải MỞ LẠI sheet đó, không phải ngồi
// chờ nó "còn nguyên" sau khi sheet Gắn Tư liệu đóng.
ok('thẻ "Tám phần" hiện huy hiệu 📎 cho đúng phần vừa gắn',
   (await p.locator('button.pt', { hasText: 'Nghiên cứu Marketing' }).innerText()).includes('📎 1 tư liệu'));
await p.locator('button.pt', { hasText: 'Nghiên cứu Marketing' }).click(); await p.waitForTimeout(400);
ok('mở lại sheet phần bài hiện lại đúng ghi chú vừa gắn (veTuLieuGan)',
   await p.locator('#sheet [data-xemtext]', { hasText: TIEU_DE }).count() === 1);

// Bấm lại vào ghi chú ngay trong sheet phần bài (đang mở từ bước trên) phải
// mở được nội dung Markdown.
await p.locator('#sheet [data-xemtext]', { hasText: TIEU_DE }).click(); await p.waitForTimeout(400);
ok('bấm vào ghi chú mở đúng nội dung Markdown đã gõ',
   (await p.locator('.mdview h4').innerText().catch(() => '')) === 'Ghi chú Phần 1');
await p.click('#mvC'); await p.waitForTimeout(300);
ok('không lỗi JS sau cả loạt thao tác trong tab Bài: ' + (loi.join(' | ') || 'sạch'), loi.length === 0);

console.log('── Tab Tư liệu: mục gắn-vào-phần gộp dưới "Theo phần bài", nhãn đúng ──');
await p.goto(B + '/#/kho'); await p.waitForTimeout(1500);
ok('có đề mục "Theo phần bài"', await p.getByText('Theo phần bài', { exact: false }).count() >= 1);
ok('mục vừa gắn hiện trong tab Tư liệu', await p.getByText(TIEU_DE).count() > 0);
ok('nhãn phần bài đọc đúng "Phần 1 · Nghiên cứu Marketing" (nhanGan, không phải nhãn buổi học)',
   await p.getByText('Phần 1 · Nghiên cứu Marketing').count() >= 1);
ok('không lỗi JS ở tab Tư liệu: ' + (loi.join(' | ') || 'sạch'), loi.length === 0);

await p.screenshot({ path: 'tulieu-bai-ui.png' });
await b.close();

await donRac();
console.log(`\n${hong ? `✗ ${hong} phép kiểm đỏ` : '✓ tất cả xanh'}`);
process.exit(hong ? 1 : 0);
