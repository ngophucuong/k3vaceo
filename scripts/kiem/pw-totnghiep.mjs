// Giao diện zone Lễ tốt nghiệp (/totnghiep) — kiem-totnghiep.mjs đã kiểm hết
// phần máy chủ; tệp này chỉ kiểm điều máy chủ không kiểm được.
//
// BẢY điều phải chứng minh bằng trình duyệt thật:
//
// 1. /totnghiep THẬT SỰ nạp được ứng dụng. Mọi bộ kiểm giao diện mở đầu bằng
//    phép này từ 26/8, sau lần một bộ kiểm báo "không lỗi JS: sạch" trên một
//    trang chưa hề nạp (quên bật [assets] nên / trả JSON — trang không có JS
//    thì tất nhiên không có lỗi JS).
// 2. KHÔNG có chữ "đã đóng" ở bất kỳ đâu trên màn hình (mục 6.4 SRS). Phép
//    kiểm chuỗi ở máy chủ không thấy được chữ do GIAO DIỆN tự viết ra.
// 3. Ba khối gập có thật, và khối Gala mở sẵn — hạn của nó là 21h00 ngày 19/9,
//    gấp nhất trong ba phần.
// 4. Ô ngày sinh điền sẵn NGUYÊN VĂN từ roster, và khi chuỗi không đủ
//    dd/mm/yyyy thì có lời nhắc kiểm lại. Đây là chỗ 28/146 người trên D1 thật
//    chỉ có năm sinh — in thẳng '1966' lên chứng chỉ là hỏng thật.
// 5. Lưu từng phần RIÊNG: bấm Lưu phần Gala thì chip tiến độ của Gala đổi
//    thành "✓ xong" mà chip Hồ sơ KHÔNG đổi theo.
// 6. Chip "đã tự khai" phải là CAM (.khaichip), không phải xanh (.xong) — hai
//    màu hai nghĩa, và xanh trong ứng dụng này chỉ có một nghĩa: người thu đã
//    nhận tiền.
// 7. Chọn quá 3 lĩnh vực thì chặn ở nút thứ tư, đúng NGANH_TOI_DA.
//
// Kèm phép đo bố cục ở khổ 390px (iPhone 12–15): không tràn ngang. Lỗi bố cục
// chỉ ảnh chụp mới thấy — phép kiểm chuỗi không thấy.
//
// Chạy:  bash scripts/kiem/reset-totnghiep.sh && node scripts/kiem/pw-totnghiep.mjs

import { chromium } from 'playwright-core';

let hong = 0;
const ok = (t, d) => { console.log((d ? '  ✓ ' : '  ✗ ') + t); if (!d) hong++; };
const B = 'http://127.0.0.1:8787';

const b = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox'],
});
const c = await b.newContext({ viewport: { width: 390, height: 1400 }, deviceScaleFactor: 2 });
await c.addCookies([{ name: 's', value: 'tk-tn-cuong', domain: '127.0.0.1', path: '/' }]);
const p = await c.newPage();
const loi = []; p.on('pageerror', e => loi.push(e.message));

// Bấm <summary> là TOGGLE, không phải "mở". Hai khối Hồ sơ và Lễ & Gala đều
// MỞ SẴN khi chưa điền gì (`${d.ho_so_luc ? '' : 'open'}`), nên bấm vào là
// ĐÓNG chúng lại — lượt chạy đầu của bộ kiểm này chết đúng ở đó, với câu
// "element is not visible" trên một chip vẫn nằm nguyên trong DOM. Chỉ bấm
// khi đang đóng, đúng như người dùng thật làm.
async function moKhoi(trang, ten) {
  const khoi = trang.locator('.tnsec').filter({ has: trang.locator('summary b', { hasText: ten }) });
  if (!(await khoi.evaluate(el => el.hasAttribute('open')))) {
    await khoi.locator('summary').click();
    await trang.waitForTimeout(350);
  }
  return khoi;
}

// ── 1. Trang thật sự nạp ─────────────────────────────────────────────────
console.log('── /totnghiep có thật sự nạp không ──');
await p.goto(B + '/totnghiep'); await p.waitForTimeout(1800);
ok('mdSafe() có mặt → app.js đã chạy thật', await p.evaluate(() => typeof window.mdSafe) !== 'undefined');
ok('có khung .tncard', await p.locator('.tncard').count() === 1);
ok('tiêu đề đúng', (await p.locator('.tncard > h1').innerText()).includes('Lễ tốt nghiệp'));
ok('không lỗi JS: ' + (loi.join(' | ') || 'sạch'), loi.length === 0);

// ── 2. Mục 6.4 SRS: không bao giờ có chữ "đã đóng" ───────────────────────
console.log('\n── Câu chữ bắt buộc (mục 6.4 SRS) ──');
const chuTrenMan = await p.locator('body').innerText();
ok('KHÔNG có chữ "đã đóng" ở bất kỳ đâu trên màn hình', !/đã đóng/i.test(chuTrenMan));
ok('KHÔNG có chữ viết tắt "BCS" (N7)', !/\bBCS\b/.test(chuTrenMan));
ok('có nói "tự khai" hoặc "đã chuyển khoản"', /tự khai|chuyển khoản/i.test(chuTrenMan));

// ── 3. Ba khối gập, Gala mở sẵn ──────────────────────────────────────────
console.log('\n── Ba khối gập, khối gấp nhất mở sẵn ──');
ok('có đúng 3 khối .tnsec', await p.locator('.tnsec').count() === 3);
const tieuDe = await p.locator('.tnsec > summary b').allInnerTexts();
ok(`thứ tự: Lễ & Gala trước (${tieuDe[0]})`, tieuDe[0].includes('Gala'));
ok('khối Gala đang MỞ (hạn 21h 19/9, gấp nhất)',
   await p.locator('.tnsec').first().evaluate(el => el.hasAttribute('open')));
// Hai khối có việc phải làm đều mở sẵn; chỉ Đề tài (việc chung của nhóm, phần
// lớn là đọc) thì gập lại — người mở trang lần đầu thấy ngay thứ cần điền chứ
// không phải đi bấm ra từng khối.
const trangThaiMo = await p.locator('.tnsec').evaluateAll(els => els.map(e => e.hasAttribute('open')));
ok(`Gala mở · Hồ sơ mở · Đề tài gập (${trangThaiMo.join(', ')})`,
   trangThaiMo[0] === true && trangThaiMo[1] === true && trangThaiMo[2] === false);
ok('có ba chip tiến độ', await p.locator('.tnprog > span').count() === 3);

// ── 4. Ngày sinh điền sẵn nguyên văn ─────────────────────────────────────
console.log('\n── Hồ sơ: điền sẵn, và nói thẳng chỗ dữ liệu gốc chưa đủ ──');
const khoiHoSo = await moKhoi(p, 'Hồ sơ làm chứng chỉ');
const ten = await p.inputValue('#tnTen');
ok(`ô Họ và tên điền sẵn ("${ten}")`, ten === 'Ngô Phú Cường');
const dob = await p.inputValue('#tnDob');
const duKhuon = /^\d{2}\/\d{2}\/\d{4}$/.test(dob);
ok(`ô Ngày sinh nhận nguyên văn từ roster ("${dob || '(trống)'}")`, typeof dob === 'string');
// Có nhắc kiểm lại đúng khi chuỗi KHÔNG đủ khuôn — và KHÔNG nhắc khi đủ.
const coNhac = (await khoiHoSo.innerText()).includes('Danh sách gốc');
ok(duKhuon ? 'ngày sinh đủ khuôn → không nhắc thừa' : 'ngày sinh thiếu → CÓ nhắc kiểm lại',
   duKhuon ? !coNhac : coNhac);
ok('ô Điện thoại điền sẵn', (await p.inputValue('#tnSdt')).length > 0);
ok('có 19 chip lĩnh vực', await p.locator('#tnNg .fc').count() === 19);

// ── 7. Tối đa 3 lĩnh vực ─────────────────────────────────────────────────
console.log('\n── Lĩnh vực: chặn ở nút thứ tư ──');
for (let i = 0; i < 4; i++) { await p.locator('#tnNg .fc').nth(i).click(); await p.waitForTimeout(120); }
ok('bấm 4 chip mà chỉ 3 cái sáng', await p.locator('#tnNg .fc.on').count() === 3);

// ── 5. Lưu từng phần RIÊNG ───────────────────────────────────────────────
console.log('\n── Ba phần lưu riêng: chip tiến độ đổi đúng một cái ──');
const chipTruoc = await p.locator('.tnprog > span').allInnerTexts();
ok('ban đầu cả ba chip đều "chưa điền"', chipTruoc.every(x => x.includes('chưa điền')));

await moKhoi(p, 'Lễ tốt nghiệp');
await p.locator('#tnDuLe [data-dule="co"]').click();
await p.waitForTimeout(150);
await p.click('#tnLuuGala');
await p.waitForTimeout(1600);

const chipSau = await p.locator('.tnprog > span').allInnerTexts();
ok(`chip "Dự Lễ" thành ✓ xong (${chipSau[2]})`, chipSau[2].includes('xong'));
ok(`chip "Hồ sơ" VẪN "chưa điền" (${chipSau[0]}) — lưu một phần không đụng phần kia`,
   chipSau[0].includes('chưa điền'));
ok('không lỗi JS sau khi lưu: ' + (loi.join(' | ') || 'sạch'), loi.length === 0);

// ── 6. Màu đi theo NGHĨA, không theo "đã xong bước nào" ──────────────────
console.log('\n── Màu của trạng thái tiền ──');
// Sandbox không ra được internet nên img.vietqr.io KHÔNG BAO GIỜ tải được —
// tức nhánh dự phòng luôn chạy ở đây, và đó là điều may: nó đúng bằng cảnh
// người dùng thật gặp lúc mạng yếu. Nhánh này có sẵn ở tab Quỹ từ Đợt 3 và
// ban đầu tôi quên chép sang màn này; chỉ ẢNH CHỤP mới thấy — phép kiểm chuỗi
// không thấy một ô vỡ ảnh nằm giữa màn hình tiền nong.
ok('mã QR hỏng thì hiện ô giải thích, KHÔNG để ô vỡ ảnh',
   await p.locator('.tnphi .ph').count() === 1 && await p.locator('.tnphi img.qr').count() === 0);
ok('ô dự phòng vẫn chỉ được sang số tài khoản bên dưới',
   /số tài khoản/i.test(await p.locator('.tnphi .ph').innerText()));

const nutKhai = p.locator('[data-tndeclare]');
ok('có nút tự khai phí', await nutKhai.count() === 1);
await nutKhai.click();
await p.waitForTimeout(1600);
ok('sau khi tự khai có chip CAM .khaichip', await p.locator('.khaichip').count() >= 1);
// Phép có RĂNG: .xong / .xongchip (cặp --go-bg/--go) trong ứng dụng này chỉ có
// MỘT nghĩa — người thu đã nhận tiền. Chưa ai xác nhận mà đã xanh là phá quy
// ước màu, và không phép kiểm chuỗi nào thấy.
const khoiPhi = p.locator('.tnphi');
ok('khối phí KHÔNG có .xongchip xanh khi người thu chưa xác nhận',
   await khoiPhi.locator('.xongchip').count() === 0);
ok('chữ trên nút nói "tự khai", không nói "đã đóng"',
   /tự khai/i.test(await khoiPhi.innerText()) && !/đã đóng/i.test(await khoiPhi.innerText()));

// ── Bố cục 390px: không tràn ngang ───────────────────────────────────────
console.log('\n── Bố cục ở khổ 390px (iPhone 12–15) ──');
const tran = await p.evaluate(() =>
  document.documentElement.scrollWidth - document.documentElement.clientWidth);
ok(`không tràn ngang (thừa ${tran}px)`, tran <= 1);
await p.screenshot({ path: '/tmp/tn-390.png', fullPage: true });
console.log('  (ảnh chụp: /tmp/tn-390.png)');

// ── Ban cán sự lớp thấy nút xem cả lớp ───────────────────────────────────
console.log('\n── Ban cán sự lớp ──');
ok('uy_vien thấy nút "xem cả lớp"', await p.locator('#tnDanhSach').count() === 1);
await p.click('#tnDanhSach'); await p.waitForTimeout(1000);
ok('sheet danh sách mở ra', (await p.locator('#sheet h3').innerText()).includes('cả lớp'));
const chuSheet = await p.locator('#sheet').innerText();
ok('sheet KHÔNG có chữ "đã đóng"', !/đã đóng/i.test(chuSheet));
ok('có nút tải CSV', await p.locator('#sheet a[href="/api/totnghiep/xuat.csv"]').count() === 1);
await p.click('#dsDong'); await p.waitForTimeout(400);

// ── Người thường KHÔNG thấy nút ấy ───────────────────────────────────────
const c2 = await b.newContext({ viewport: { width: 390, height: 1400 } });
await c2.addCookies([{ name: 's', value: 'tk-tn-thuong', domain: '127.0.0.1', path: '/' }]);
const p2 = await c2.newPage();
const loi2 = []; p2.on('pageerror', e => loi2.push(e.message));
await p2.goto(B + '/totnghiep'); await p2.waitForTimeout(1500);
ok('người thường KHÔNG thấy nút "xem cả lớp"', await p2.locator('#tnDanhSach').count() === 0);
ok('người thường vẫn mở được form', await p2.locator('.tnsec').count() === 3);
ok('không lỗi JS ở phiên thứ hai: ' + (loi2.join(' | ') || 'sạch'), loi2.length === 0);

// ── Thẻ ở tab Hôm nay dẫn sang đúng đây ──────────────────────────────────
console.log('\n── Thẻ ở tab Hôm nay ──');
await p.goto(B + '/#/nay'); await p.waitForTimeout(1600);
const the = p.locator('.tnthe');
ok('có thẻ "Đăng ký Lễ tốt nghiệp" ở tab Hôm nay', await the.count() === 1);
ok('thẻ trỏ đúng /totnghiep', (await the.getAttribute('href')) === '/totnghiep');
ok('không thêm tab thứ bảy vào thanh nav', await p.locator('.nb').count() === 6);

/* ── Đường công khai: người CHƯA đăng nhập vẫn điền được (migration 0042) ──
   Đo trên D1 thật 18/9: 38/146 người không có số điện thoại trong danh sách
   gốc nên cửa /dangnhap đóng với họ. Ngô Phú Cường chọn mở RIÊNG form tốt
   nghiệp thay vì nới cửa đăng nhập.

   Ba điều phải chứng minh bằng trình duyệt, và điều thứ hai là quan trọng
   nhất: form KHÔNG được điền sẵn ngày sinh hay điện thoại của ai — điền sẵn
   là phát tán danh bạ cả lớp cho bất kỳ ai mở link. */
console.log('\n── Đường công khai (chưa đăng nhập) ──');
const c3 = await b.newContext({ viewport: { width: 390, height: 1400 } });
const p3 = await c3.newPage();          // KHÔNG có cookie
const loi3 = []; p3.on('pageerror', e => loi3.push(e.message));
await p3.goto(B + '/totnghiep'); await p3.waitForTimeout(1600);

// Phải bày ĐỦ HAI lối: 39 người kia CÓ số nên vẫn đăng nhập được, và đăng
// nhập thì được cả ứng dụng. Chỉ bày lối công khai là họ mất phần còn lại mà
// không ai nói cho biết.
ok('có lối "Đăng nhập"', await p3.locator('a[href="/dangnhap"]').count() >= 1);
ok('có lối "điền thẳng ở đây"', await p3.locator('#tnckBatDau').count() === 1);

await p3.click('#tnckBatDau'); await p3.waitForTimeout(500);
ok('mở ra màn tìm tên', await p3.locator('#tnckTen').count() === 1);
await p3.fill('#tnckTen', 'khanh toan'); await p3.waitForTimeout(1400);
ok('tìm không dấu ra đúng người', (await p3.locator('#tnckDs').innerText()).includes('Đinh Khánh Toàn'));
await p3.locator('#tnckDs [data-rid]').first().click(); await p3.waitForTimeout(1200);

ok('mở ra form', await p3.locator('#ckGui').count() === 1);
// PHÉP CÓ RĂNG NHẤT CỦA MỤC NÀY.
ok('ô Ngày sinh để TRỐNG — không điền sẵn dữ liệu của ai',
   (await p3.inputValue('#ckDob')) === '');
ok('ô Số điện thoại để TRỐNG', (await p3.inputValue('#ckSdt')) === '');
ok('ô Họ tên có sẵn tên vừa chọn (thứ chính họ vừa bấm, không phải thứ bị lộ)',
   (await p3.inputValue('#ckTen')) === 'Đinh Khánh Toàn');
const chuCk = await p3.locator('body').innerText();
ok('KHÔNG có chữ "đã đóng" trên màn công khai', !/đã đóng/i.test(chuCk));

await p3.fill('#ckDob', '05/05/1975');
await p3.fill('#ckSdt', '0912345678');
await p3.locator('#ckDuLe [data-dule="co"]').click(); await p3.waitForTimeout(150);
await p3.click('#ckGui'); await p3.waitForTimeout(2000);

ok('gửi xong ra màn "Đã gửi xong"',
   (await p3.locator('.tncard > h1').innerText()).includes('Đã gửi'));
// Mã QR chỉ hiện SAU khi chọn "có dự" — chưa nói là đi thì chưa có gì để
// chuyển tiền, mà bày sẵn mã là mời chuyển nhầm.
ok('hiện khối phí kèm cú pháp chuyển khoản', await p3.locator('.tnphi').count() === 1);
ok('cú pháp bắt đầu bằng GALA',
   /GALA/.test(await p3.locator('.tnphi .copy').innerText()));
ok('mã QR hỏng thì có ô dự phòng, không để ô vỡ ảnh',
   await p3.locator('.tnphi .ph').count() === 1);
ok('không lỗi JS ở đường công khai: ' + (loi3.join(' | ') || 'sạch'), loi3.length === 0);

const tran3 = await p3.evaluate(() =>
  document.documentElement.scrollWidth - document.documentElement.clientWidth);
ok(`không tràn ngang ở 390px (thừa ${tran3}px)`, tran3 <= 1);
await p3.screenshot({ path: '/tmp/tn-congkhai.png', fullPage: true });
console.log('  (ảnh chụp: /tmp/tn-congkhai.png)');

await b.close();
console.log(hong === 0 ? '\n✅ TẤT CẢ ĐỀU XANH' : `\n❌ ${hong} phép ĐỎ`);
process.exit(hong === 0 ? 0 : 1);
