// Giao diện của Xin đổi nhóm (routes/doi-nhom.js) — kiem-doi-nhom.mjs đã kiểm
// hết phần máy chủ; tệp này chỉ kiểm điều máy chủ không kiểm được: đúng nút,
// đúng sheet, đúng chữ hiện ra, và hai vai (người xin / officer nhóm đích)
// nhìn thấy đúng thứ của mình trong CÙNG một lượt chạy.
//
// Cần phiên của Nguyễn Thị Thu Hương và Kiểm Đổi Nhóm Đích — chạy
// reset-doi-nhom.sh trước (dựng cả hai, cùng lúc dọn đơn cũ và trả Thu Hương
// về Nhóm 6 để chạy lại nhiều lần không vỡ).
//
// Bốn điều phải chứng minh bằng trình duyệt thật:
// 1. Nút "Xin đổi nhóm" chỉ hiện trên hồ sơ CỦA CHÍNH MÌNH trong tab Nhóm.
// 2. Ô chọn nhóm đích trong sheet KHÔNG có nhóm hiện tại (Nhóm 6).
// 3. Gửi đơn xong, mở lại sheet phải thấy trạng thái "Đang chờ duyệt", không
//    phải form nộp đơn nữa — và có nút Huỷ.
// 4. Officer nhóm đích thấy đúng thẻ đơn (tên, nhóm cũ), bấm Duyệt xong thẻ
//    biến mất — cả hai phiên (người xin, officer) không lỗi JS nào.
//
// Chạy:  bash scripts/kiem/reset-doi-nhom.sh  &&  node scripts/kiem/pw-doi-nhom.mjs

import { chromium } from 'playwright-core';

let hong = 0;
const ok = (t, d) => { console.log((d ? '  ✓ ' : '  ✗ ') + t); if (!d) hong++; };
const B = 'http://127.0.0.1:8787';
const TOK_HUONG = 'tk-huong-doinhom';
const TOK_DICH = 'tk-truong-dich-doinhom';

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });

const cH = await b.newContext({ viewport: { width: 390, height: 1100 }, deviceScaleFactor: 2 });
await cH.addCookies([{ name: 's', value: TOK_HUONG, domain: '127.0.0.1', path: '/' }]);
const pH = await cH.newPage();
const loiH = []; pH.on('pageerror', e => loiH.push(e.message));

await pH.goto(B + '/#/nhom'); await pH.waitForTimeout(2000);
ok('ứng dụng thật sự nạp được (có thanh tab)', await pH.locator('.nb[data-v="nhom"]').count() === 1);
ok('không lỗi JS khi mở tab Nhóm: ' + (loiH.join(' | ') || 'sạch'), loiH.length === 0);

console.log('── Nguyễn Thị Thu Hương mở hồ sơ của mình ──');
await pH.locator('button.mrow', { hasText: 'Nguyễn Thị Thu Hương' }).first().click();
await pH.waitForTimeout(400);
// Đếm trên TOÀN TRANG (không chỉ trong panel đang mở): nút này chỉ được vẽ
// một lần, cho đúng dòng m.id === HOME.me.id trong MEMBERS.map(...). Nếu điều
// kiện ấy bị gỡ nhầm, nút sẽ nhân bản ra mọi hồ sơ trong nhóm và count() > 1
// bắt được ngay dù panel của họ đang đóng — id trùng vẫn nằm trong DOM.
ok('có ĐÚNG MỘT nút "Xin đổi nhóm" trên toàn tab Nhóm — đúng hồ sơ của chính mình',
   await pH.locator('#xinDoiNhom').count() === 1);

await pH.click('#xinDoiNhom'); await pH.waitForTimeout(600);
ok('sheet Xin đổi nhóm mở ra', (await pH.locator('#sheet h3').innerText()) === 'Xin đổi nhóm');
ok('có ô chọn nhóm đích và ô lý do', await pH.locator('#xdnNhom').count() === 1 && await pH.locator('#xdnLy').count() === 1);

const cacNhom = await pH.locator('#xdnNhom option').allInnerTexts();
ok('KHÔNG có Nhóm 6 (nhóm hiện tại) trong ô chọn', !cacNhom.includes('Nhóm 6'));
ok('có Nhóm 7 trong ô chọn', cacNhom.includes('Nhóm 7'));
ok('đủ 9 nhóm còn lại (10 nhóm trừ nhóm hiện tại)', cacNhom.length === 9);

await pH.selectOption('#xdnNhom', '7');
await pH.fill('#xdnLy', 'KIEMDN thử giao diện');
await pH.click('#xdnOK'); await pH.waitForTimeout(800);
ok('sheet đóng lại sau khi gửi đơn', !(await pH.locator('#xdnOK').isVisible().catch(() => false)));

console.log('── Mở lại: phải thấy trạng thái ĐANG CHỜ, không phải form nữa ──');
await pH.locator('button.mrow', { hasText: 'Nguyễn Thị Thu Hương' }).first().click(); await pH.waitForTimeout(300);
await pH.click('#xinDoiNhom'); await pH.waitForTimeout(600);
// .k viết HOA bằng CSS (text-transform:uppercase), và innerText() phản ánh
// chữ ĐÃ RENDER chứ không phải chữ nguồn trong HTML — so không phân biệt hoa
// thường để không lệ thuộc vào chi tiết trình bày ấy.
const chuSheet = await pH.locator('#sheet').innerText();
ok('hiện "Đang chờ duyệt"', chuSheet.toLowerCase().includes('đang chờ duyệt'));
ok('hiện đúng tên nhóm đích Nhóm 7', chuSheet.includes('Nhóm 7'));
ok('có nút Huỷ đơn, không còn ô chọn nhóm (không phải form nữa)',
   await pH.locator('#xdnHuy').count() === 1 && await pH.locator('#xdnNhom').count() === 0);
await pH.click('#xdnC'); await pH.waitForTimeout(300);

// ── Chuyển sang vai officer nhóm đích, trong CÙNG một trình duyệt ─────────
console.log('── Kiểm Đổi Nhóm Đích (officer Nhóm 7) thấy đơn và duyệt ──');
const cD = await b.newContext({ viewport: { width: 390, height: 1100 }, deviceScaleFactor: 2 });
await cD.addCookies([{ name: 's', value: TOK_DICH, domain: '127.0.0.1', path: '/' }]);
const pD = await cD.newPage();
const loiD = []; pD.on('pageerror', e => loiD.push(e.message));

await pD.goto(B + '/#/nhom'); await pD.waitForTimeout(2000);
ok('officer nhóm đích thấy mục "Đơn xin vào nhóm"', await pD.getByText('Đơn xin vào nhóm', { exact: false }).count() >= 1);
ok('thấy tên người xin trong thẻ đơn', await pD.getByText('Nguyễn Thị Thu Hương').count() >= 1);
ok('thẻ đơn ghi đúng nhóm cũ (Từ Nhóm 6)', await pD.getByText('Từ Nhóm 6', { exact: false }).count() >= 1);
ok('thẻ đơn hiện đúng lý do đã gõ', await pD.getByText('KIEMDN thử giao diện').count() >= 1);

await pD.locator('[data-duyet]').first().click();
await pD.waitForTimeout(800);
ok('sau khi duyệt, thẻ đơn biến mất khỏi màn của officer', await pD.locator('[data-duyet]').count() === 0);

console.log('── Người xin quay lại: hồ sơ đã đổi, sheet không còn đơn chờ ──');
await pH.reload(); await pH.waitForTimeout(2000);
await pH.locator('button.mrow', { hasText: 'Nguyễn Thị Thu Hương' }).first().click(); await pH.waitForTimeout(300);
await pH.click('#xinDoiNhom'); await pH.waitForTimeout(600);
const chuSheetSauDuyet = await pH.locator('#sheet').innerText();
ok('sau khi được duyệt, mở lại KHÔNG còn "Đang chờ duyệt" (đơn đã xong)',
   !chuSheetSauDuyet.includes('Đang chờ duyệt'));

ok('không lỗi JS ở phía người xin: ' + (loiH.join(' | ') || 'sạch'), loiH.length === 0);
ok('không lỗi JS ở phía officer: ' + (loiD.join(' | ') || 'sạch'), loiD.length === 0);

await pD.screenshot({ path: 'doi-nhom-officer.png' });
await b.close();

console.log(`\n${hong ? `✗ ${hong} phép kiểm đỏ` : '✓ tất cả xanh'}`);
process.exit(hong ? 1 : 0);
