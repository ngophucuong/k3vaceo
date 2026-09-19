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
// 3. Ba khối gập có thật, và MỖI LÚC ĐÚNG MỘT khối mở (yêu cầu 18/9: "chỉ
//    hiển thị một phần, 2 phần còn lại thu gọn cho gọn gàng"). Khối mở sẵn là
//    Gala khi còn phải chuyển phí — mã QR không được nằm sau một cú chạm với
//    đúng người chưa trả tiền.
// 4. Ô ngày sinh điền sẵn NGUYÊN VĂN từ roster, và khi chuỗi không đủ
//    dd/mm/yyyy thì có lời nhắc kiểm lại. Đây là chỗ 28/146 người trên D1 thật
//    chỉ có năm sinh — in thẳng '1966' lên chứng chỉ là hỏng thật.
// 5. Lưu từng phần RIÊNG: bấm Lưu phần Gala thì chip tiến độ của Gala đổi
//    thành "✓ xong" mà chip Hồ sơ KHÔNG đổi theo.
// 6. Chip "đã tự khai" phải là CAM (.khaichip), không phải xanh (.xong) — hai
//    màu hai nghĩa, và xanh trong ứng dụng này chỉ có một nghĩa: người thu đã
//    nhận tiền.
// 7. Chọn quá 3 lĩnh vực thì chặn ở nút thứ tư, đúng NGANH_TOI_DA.
// 8. "Ép khai đủ" (18/9): thiếu ô thì bị chặn, câu báo GỌI ĐÚNG TÊN ô còn
//    trống, và đoạn vừa gõ KHÔNG mất — form dài hơn một màn điện thoại, gõ
//    lại lần hai thì phần lớn bỏ cuộc.
// 9. Form CÔNG KHAI có ô chọn ảnh chân dung/logo, và ô ấy KHÔNG hé lộ người
//    được chọn đã gửi ảnh hay chưa.
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
ok('tiêu đề đúng', (await p.locator('.tncard h1').innerText()).includes('Lễ tốt nghiệp'));
ok('không lỗi JS: ' + (loi.join(' | ') || 'sạch'), loi.length === 0);

// ── 2. Mục 6.4 SRS: không bao giờ có chữ "đã đóng" ───────────────────────
console.log('\n── Câu chữ bắt buộc (mục 6.4 SRS) ──');
const chuTrenMan = await p.locator('body').innerText();
ok('KHÔNG có chữ "đã đóng" ở bất kỳ đâu trên màn hình', !/đã đóng/i.test(chuTrenMan));
ok('KHÔNG có chữ viết tắt "BCS" (N7)', !/\bBCS\b/.test(chuTrenMan));
ok('có nói "tự khai" hoặc "đã chuyển khoản"', /tự khai|chuyển khoản/i.test(chuTrenMan));

/* ── 3. MỖI LÚC ĐÚNG MỘT KHỐI MỞ ─────────────────────────────────────────
   Ngô Phú Cường 18/9: "3 phần này nên gập vào và chỉ hiển thị một phần, 2
   phần còn lại thu gọn cho gọn gàng."

   Phép kiểm phải hỏi CẢ HAI chiều, vì mỗi chiều bắt một bản vá hỏng khác
   nhau: "đúng một khối mở lúc đầu" một mình vẫn xanh với bản quên đóng các
   khối kia khi mở một khối mới, còn "mở cái này thì cái kia đóng" một mình
   vẫn xanh với bản mở sẵn cả ba. */
console.log('\n── Ba khối gập, mỗi lúc đúng MỘT khối mở ──');
ok('có đúng 3 khối .tnsec', await p.locator('.tnsec').count() === 3);
const tieuDe = await p.locator('.tnsec > summary b').allInnerTexts();
ok(`thứ tự: Lễ & Gala trước (${tieuDe[0]})`, tieuDe[0].includes('Gala'));
const dangMo = async () =>
  (await p.locator('.tnsec').evaluateAll(els => els.map(e => e.hasAttribute('open'))));
const mo1 = await dangMo();
ok(`ĐÚNG MỘT khối đang mở (${mo1.join(', ')})`, mo1.filter(Boolean).length === 1);
ok('và đó là Gala — hạn 21h00 ngày 19/9, gấp nhất trong ba', mo1[0] === true);

/* ── LỐI VỀ Ở ĐẦU TRANG (19/9) ────────────────────────────────────────────
   Ngô Phú Cường: *"Ở phần tốt nghiệp thêm icon nút Back (Trở về ứng dụng) ở
   phía trên (hiện tạo chỉ có ở dưới cùng)."* Biểu mẫu này dài hơn ba màn điện
   thoại, mà `body.noapp` đã bỏ thanh sáu tab — nên đường ra duy nhất nằm tận
   chân trang, sau cả ba khối đang mở. Trên iPhone đã cài lên màn hình chính
   thì còn không có cả nút Back của trình duyệt.

   Phép đo VỊ TRÍ, không chỉ đếm phần tử: một nút "về ứng dụng" thứ hai đặt
   nhầm xuống cuối thì phép đếm vẫn xanh mà chẳng chữa được gì. */
ok('có lối về ở ĐẦU trang', await p.locator('.tnhead .tnve').count() === 1);
const viTri = await p.evaluate(() => ({
  ve: document.querySelector('.tnhead .tnve')?.getBoundingClientRect().top,
  khoi: document.querySelector('.tnsec')?.getBoundingClientRect().top,
  cao: Math.round(document.querySelector('.tnhead .tnve')?.getBoundingClientRect().height ?? 0),
}));
ok(`lối về nằm TRÊN khối đầu tiên (${Math.round(viTri.ve)}px < ${Math.round(viTri.khoi)}px)`,
   viTri.ve < viTri.khoi);
ok(`vùng chạm cao ${viTri.cao}px (cần ≥ 44)`, viTri.cao >= 44);
ok('trỏ về gốc ứng dụng', await p.locator('.tnhead .tnve').getAttribute('href') === '/');

// Mở khối thứ hai thì khối thứ nhất phải TỰ ĐÓNG. Chỉ cách này mới phân biệt
// được accordion thật với ba <details> độc lập cùng mở sẵn một cái.
await p.locator('.tnsec').nth(1).locator('summary').click();
await p.waitForTimeout(400);
const mo2 = await dangMo();
ok(`mở Hồ sơ thì Gala tự gập (${mo2.join(', ')})`,
   mo2[1] === true && mo2[0] === false && mo2.filter(Boolean).length === 1);

// Gập chính nó lại thì được phép không còn khối nào mở — đó là một trạng thái
// hợp lệ, không phải lỗi.
await p.locator('.tnsec').nth(1).locator('summary').click();
await p.waitForTimeout(400);
ok('gập hết cũng được', (await dangMo()).filter(Boolean).length === 0);

// Trả lại khối Gala cho các phép bên dưới.
await p.locator('.tnsec').first().locator('summary').click();
await p.waitForTimeout(400);
// NÚT THẬT, không phải <span>. Ngô Phú Cường 19/9: "3 chip khoanh đỏ cũng bấm
// được nhé". <button> chứ không <span role="button">: bàn phím và trình đọc
// màn hình hiểu sẵn, khỏi phải tự viết keydown cho Enter/Space.
ok('có ba ô tiến độ, và cả ba là NÚT thật', await p.locator('.tnprog > button').count() === 3);

/* BA Ô PHẢI NẰM CÙNG MỘT HÀNG. Ngô Phú Cường chụp màn hình 19/9: ở khổ 390px
   ô thứ ba rơi xuống dòng hai. Rơi dòng là mất đúng công dụng của dải này —
   ba mốc phải nhìn thấy CÙNG LÚC thì mới biết còn thiếu phần nào.
   Đo bằng `offsetTop`: cùng hàng thì cả ba bằng nhau. Phép đếm số ô (ngay
   trên) một mình vẫn xanh khi chúng xếp thành ba dòng chồng nhau. */
const hangChip = await p.locator('.tnprog').evaluate(el =>
  [...new Set([...el.children].map(c => c.offsetTop))].length);
ok(`ba ô tiến độ nằm CÙNG một hàng (đếm được ${hangChip} hàng)`, hangChip === 1);

const caoChip = await p.locator('.tnprog > button')
  .evaluateAll(els => els.map(e => Math.round(e.getBoundingClientRect().height)));
ok(`ba ô cao ${caoChip.join('/')}px (cần ≥ 44)`, caoChip.every(h => h >= 44));

/* ── DẢI Ô LÀ MỘT THANH TAB: chạm ô nào mở khối ấy ───────────────────────
   PHÉP CÓ RĂNG NHẤT CỦA CẢ MỤC, vì hai dải xếp NGƯỢC NHAU:
     ô   0 Hồ sơ · 1 Đề tài · 2 Gala
     khối 0 gala  · 1 hoso   · 2 detai
   Ánh xạ theo CHỈ SỐ thì chạm "Hồ sơ" mở ra Gala, và không chỗ nào báo lỗi.
   Nên phải soi theo ĐÚNG TÊN `data-sec`, tuyệt đối không theo vị trí. */
console.log('\n── Ba ô tiến độ bấm được, và mở ĐÚNG khối của nó ──');
const khoiDangMo = async () => p.locator('.tnsec[open]').getAttribute('data-sec');
for (const [oTen, secMong] of [['Hồ sơ', 'hoso'], ['Đề tài', 'detai'], ['Gala', 'gala']]) {
  await p.locator(`.tnprog > button[data-tnmo="${secMong}"]`).click();
  await p.waitForTimeout(700);
  const thay = await khoiDangMo();
  ok(`chạm ô "${oTen}" → mở khối "${secMong}" (đang mở: ${thay})`, thay === secMong);
  ok(`… và đúng MỘT khối mở, hai khối kia gập`,
     (await p.locator('.tnsec[open]').count()) === 1);
  ok(`… ô "${oTen}" được đánh dấu đang mở, hai ô kia thì không`,
     (await p.locator('.tnprog > button.dangmo').count()) === 1
     && (await p.locator(`.tnprog > button[data-tnmo="${secMong}"]`)
           .evaluate(e => e.classList.contains('dangmo'))));
}

/* MỘT NGUỒN SỰ THẬT. Mở khối bằng <summary> — đường vốn có từ đầu, không đụng
   tới ô nào — thì dấu trên dải ô VẪN phải đổi theo. Bỏ phép này thì một bản vá
   đồng bộ dấu trong handler của ô vẫn xanh, và hai chỗ nói hai chuyện ngay lần
   đầu có người chạm summary. */
await p.locator('.tnsec[data-sec="hoso"] > summary').click();
await p.waitForTimeout(400);
ok('mở bằng <summary> thì dấu trên dải ô cũng đổi theo',
   (await p.locator('.tnprog > button.dangmo').count()) === 1
   && (await p.locator('.tnprog > button[data-tnmo="hoso"]')
         .evaluate(e => e.classList.contains('dangmo'))));

/* VÀ PHẢI CUỘN TỚI. Biểu mẫu dài hơn một màn điện thoại: mở một khối nằm dưới
   mép màn mà không cuộn thì chạm xong màn hình đứng im, đọc lên y như hỏng.
   Đo cả TRƯỚC lẫn SAU — chỉ đo "sau" thì phép kiểm vẫn xanh khi khối vốn đã
   nằm sẵn trong màn, tức chẳng chứng minh được gì.

   ĐIỀU PHÉP NÀY KHÔNG CHỨNG MINH, nói thẳng: nó không phân biệt được "chờ
   `toggle` rồi mới cuộn" với "cuộn ngay". Đã thử gỡ bản vá ấy ra và phép kiểm
   vẫn xanh — vì gập khối Hồ sơ làm trần cuộn tụt xuống nên trình duyệt kẹp cú
   cuộn lại đúng chỗ cần tới. Xem chú thích trong `app.js` cho số đo. */
await p.evaluate(() => window.scrollTo(0, 0));
await p.waitForTimeout(300);
const dinhTruoc = await p.locator('.tnsec[data-sec="detai"]')
  .evaluate(e => e.getBoundingClientRect().top);
await p.locator('.tnprog > button[data-tnmo="detai"]').click();
await p.waitForTimeout(900);
const dinhSau = await p.locator('.tnsec[data-sec="detai"]')
  .evaluate(e => e.getBoundingClientRect().top);
const caoMan = await p.evaluate(() => window.innerHeight);
ok(`khối "Đề tài" vốn nằm NGOÀI màn (đỉnh ở ${Math.round(dinhTruoc)}px / màn ${caoMan}px)`,
   dinhTruoc > caoMan);
ok(`chạm ô là cuộn tới, khối vào trong màn (đỉnh nay ${Math.round(dinhSau)}px)`,
   dinhSau >= -2 && dinhSau < caoMan);

// Trả lại khối Gala cho các phép bên dưới.
await p.locator('.tnprog > button[data-tnmo="gala"]').click();
await p.evaluate(() => window.scrollTo(0, 0));
await p.waitForTimeout(700);

/* ── Mã QR phải NHÌN THẤY ĐƯỢC khi chưa chuyển phí ───────────────────────
   Ngô Phú Cường 18/9: "Câu hỏi đã chuyển khoản 1.000.000 chưa, nếu chưa thì
   sẽ tự động expand hình ảnh QR code."

   Đây là chỗ hai yêu cầu suýt đánh nhau: gập hai khối cho gọn (yêu cầu ở
   trên) mà gập nhầm khối đang giữ mã QR thì người đã đăng ký dự Lễ nhưng chưa
   chuyển tiền mở trang ra không thấy mã đâu — đúng người cần thấy nhất. */
console.log('\n── Chưa chuyển phí thì khối Gala mở sẵn, mã QR ở trong ──');
ok('câu hỏi nêu rõ SỐ TIỀN, không hỏi trống không',
   /đã chuyển khoản .*1\.000\.000.*chưa/i.test(await p.locator('.tnphi').innerText()));
ok('có ô mã QR (hoặc nhánh dự phòng khi mã không tải được)',
   (await p.locator('.tnphi img.qr').count()) + (await p.locator('.tnphi .ph').count()) > 0);

/* ── Đề tài KHKD: cá nhân, theo lĩnh vực (migration 0043) ────────────────
   Thay cho lượt bình chọn Zalo đã khoá. Ba điều phải chứng minh bằng trình
   duyệt: 15 lĩnh vực hiện ra, chọn MỘT (khác chip ngành ở phần A cho tối đa
   3), và lưu được mà không cần điền đủ — "không bắt buộc ai cũng phải nộp". */
console.log('\n── Đề tài KHKD theo lĩnh vực ──');
const khoiDeTai = await moKhoi(p, 'Đề tài Kế hoạch kinh doanh');
ok('có 15 chip lĩnh vực', await p.locator('#tnLv .fc').count() === 15);
ok('nói rõ KHÔNG BẮT BUỘC', /không bắt buộc/i.test(await khoiDeTai.innerText()));
// Chọn MỘT, không phải nhiều: bấm chip thứ hai thì chip thứ nhất phải tắt.
await p.locator('#tnLv .fc').nth(0).click(); await p.waitForTimeout(120);
await p.locator('#tnLv .fc').nth(3).click(); await p.waitForTimeout(120);
ok('chọn MỘT lĩnh vực (bấm cái thứ hai thì cái đầu tắt)',
   await p.locator('#tnLv .fc.on').count() === 1);
// Chạm lại để bỏ chọn — người lỡ tay phải gỡ được.
await p.locator('#tnLv .fc').nth(3).click(); await p.waitForTimeout(120);
ok('chạm lại thì bỏ chọn được', await p.locator('#tnLv .fc.on').count() === 0);

await p.locator('#tnLv .fc').nth(0).click(); await p.waitForTimeout(120);
await p.fill('#tnDeTai', 'KIEMTN Chuỗi nhà thuốc khu công nghiệp');
await p.click('#tnLuuDeTai'); await p.waitForTimeout(1800);
const chipSauDeTai = await p.locator('.tnprog > button').allInnerTexts();
ok(`chip "Đề tài" thành ✓ xong dù CHƯA có link (${chipSauDeTai[1].replace(/\n/g, ' ')})`,
   chipSauDeTai[1].includes('xong'));
ok('không lỗi JS sau khi lưu đề tài: ' + (loi.join(' | ') || 'sạch'), loi.length === 0);

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

/* Ô chữ tự do của chip "Ngành khác" — migration 0044, Ngô Phú Cường hỏi
   "Khác có thể điền free text không?". Ô phải ẨN khi chưa bấm chip: bày sẵn
   một ô trống không ai biết để làm gì, ngay dưới hàng chip, chỉ làm form dài
   thêm cho 146 người mà phần lớn không cần tới nó. */
console.log('\n── "Ngành khác" mới mở ô chữ ──');
ok('chưa bấm "Ngành khác" thì ô chữ ẩn', !(await p.locator('#tnNgKhac').isVisible()));
await p.locator('#tnNg .fc.on').first().click();     // nhả một chip cho đủ chỗ
await p.waitForTimeout(120);
await p.locator('#tnNg [data-ma="khac"]').click();
await p.waitForTimeout(200);
ok('bấm "Ngành khác" thì ô chữ hiện ra', await p.locator('#tnNgKhac').isVisible());
await p.fill('#tnNgKhac', 'Logistics chuỗi lạnh');
await p.locator('#tnNg [data-ma="khac"]').click();   // bỏ chip
await p.waitForTimeout(200);
ok('bỏ chip thì ô chữ ẩn lại', !(await p.locator('#tnNgKhac').isVisible()));
// Ẩn KHÔNG được xoá chữ: bấm nhầm rồi bấm lại mà mất đoạn vừa gõ là một lỗi
// mất dữ liệu nhỏ nhưng có thật, nhất là trên điện thoại.
await p.locator('#tnNg [data-ma="khac"]').click();
await p.waitForTimeout(200);
ok('bấm lại thì chữ vừa gõ VẪN CÒN, không bị ẩn rồi xoá',
   (await p.inputValue('#tnNgKhac')) === 'Logistics chuỗi lạnh');

// ── 5. Lưu từng phần RIÊNG ───────────────────────────────────────────────
console.log('\n── Ba phần lưu riêng: chip tiến độ đổi đúng một cái ──');
const chipTruoc = await p.locator('.tnprog > button').allInnerTexts();
// CHỈ hai chip Hồ sơ và Gala — chip Đề tài đã ✓ từ mục trên, vì mục ấy thật
// sự lưu một đề tài. Ghim "cả ba đều chưa điền" ở đây là bộ kiểm tự mâu thuẫn
// với chính bước nó vừa chạy.
ok(`chip Hồ sơ và Gala còn "chưa điền" (${chipTruoc[0].replace(/\n/g, ' ')} · ${chipTruoc[2].replace(/\n/g, ' ')})`,
   chipTruoc[0].includes('chưa điền') && chipTruoc[2].includes('chưa điền'));

await moKhoi(p, 'Lễ tốt nghiệp');
await p.locator('#tnDuLe [data-dule="co"]').click();
await p.waitForTimeout(150);
/* Khai nốt tài trợ / gian hàng / văn nghệ QUA CHÍNH BIỂU MẪU, không bơm
   thẳng vào API. Ba thứ này thu từ 18/9 mà tới 19/9 màn Ban cán sự lớp vẫn
   chưa hiện chúng — phần dưới của bộ kiểm soi đúng chỗ ấy, nên chúng phải
   tới D1 bằng đường người dùng thật đi. */
await p.locator('#tnTaiTro [data-tt="tien"]').click();
await p.fill('#tnTTMo', 'ủng hộ 5 triệu');
await p.locator('#tnGH').check();
await p.locator('#tnVN').check();
await p.fill('#tnVNMo', 'song ca 2 người');
await p.waitForTimeout(150);
await p.click('#tnLuuGala');
await p.waitForTimeout(1600);

const chipSau = await p.locator('.tnprog > button').allInnerTexts();
ok(`chip "Gala" thành ✓ xong (${chipSau[2]})`, chipSau[2].includes('xong'));
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

// Ngô Phú Cường yêu cầu 18/9: khai xong là CẤT mã QR đi. Để nguyên là mời
// chuyển tiền thêm lần nữa cho đúng người vừa nói mình đã chuyển — và ở đây
// (sandbox không ra được internet) thứ còn lại là ô dự phòng CAM đọc lên y
// như một cảnh báo trên một việc đã xong. Kiểm cả ô dự phòng lẫn thẻ img, vì
// mạng tốt thì hiện thẻ img còn mạng yếu thì hiện ô — cất là phải cất cả hai.
ok('khai xong thì KHÔNG còn mã QR (cả thẻ img lẫn ô dự phòng)',
   await khoiPhi.locator('img.qr').count() === 0 && await khoiPhi.locator('.ph').count() === 0);
ok('cũng cất luôn nút chép cú pháp chuyển khoản',
   await khoiPhi.locator('[data-tncopy]').count() === 0);
// Cất một thứ đi mà không nói cách lấy lại là làm người ta sợ — nhất là khi
// họ bấm nhầm. Đường lui có thật (chạm lại nút là bỏ khai), nên câu chữ phải
// nói ra, và đây là phép canh cho chính câu ấy.
ok('nói rõ đường lui: khai nhầm thì chạm lại, mã QR hiện lại',
   /chạm lại/i.test(await khoiPhi.innerText()) && /hiện lại/i.test(await khoiPhi.innerText()));
await nutKhai.click();          // bỏ khai
await p.waitForTimeout(1600);
ok('bỏ khai thì mã QR (ở đây là ô dự phòng) quay lại thật',
   await p.locator('.tnphi .ph').count() === 1);
await p.locator('[data-tndeclare]').click();   // khai lại, để các phép sau đứng nguyên chỗ cũ
await p.waitForTimeout(1600);

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

/* ── THẺ TỔNG QUAN (19/9) ─────────────────────────────────────────────────
   Ngô Phú Cường xin "UI thông minh, logic hơn … xem số người đăng ký dự Gala,
   tài trợ, tách thống kê đề tài". Ba thứ đã thu từ 18/9 mà màn hình CHƯA BAO
   GIỜ hiện: tài trợ, gian hàng, văn nghệ — muốn biết ai đăng ký tiết mục văn
   nghệ thì phải tải CSV về rồi mở Excel. */
console.log('\n── Thẻ Tổng quan: Gala, phí, tài trợ, gian hàng, văn nghệ ──');
ok('mặc định mở thẻ "Tổng quan", không phải danh mục đề tài',
   await p.locator('#sheet [data-dstn="tong"].on').count() === 1);
const chuTong = await p.locator('#sheet').innerText();
for (const muc of ['Gala 26/9', 'Phí Gala', 'Tài trợ', 'Gian hàng', 'văn nghệ', 'chứng chỉ']) {
  ok(`thẻ Tổng quan có khối "${muc}"`, new RegExp(muc, 'i').test(chuTong));
}
// Ba thứ kia phải kèm TÊN, không chỉ con số: cả ba đều phải liên hệ lại từng
// người (chốt hiện vật, xếp chỗ standee, dựng chương trình), mà một con số
// trần thì vẫn phải mở CSV ra mới biết gọi cho ai.
ok('tài trợ / gian hàng / văn nghệ kèm TÊN người, không chỉ con số',
   (chuTong.match(/Ngô Phú Cường/g) ?? []).length >= 3);
ok('… và kèm chi tiết tiết mục văn nghệ', /song ca 2 người/.test(chuTong));
/* Ô SỐ PHẢI CÙNG MỘT HÀNG — cùng lý do dải `.tnprog`: ba con số của một câu
   hỏi phải nhìn thấy cùng lúc thì mới so được. Đo bằng offsetTop, vì phép
   đếm "có ba ô" một mình vẫn xanh khi chúng xếp thành ba dòng chồng nhau. */
const hangSo = await p.locator('#sheet .dstnso').first()
  .evaluate(el => [...el.children].map(c => c.offsetTop));
ok(`ba ô số nằm CÙNG MỘT HÀNG (offsetTop ${hangSo.join('/')})`,
   hangSo.length === 3 && new Set(hangSo).size === 1);
/* MÀU ĐI THEO NGHĨA. `--go` trong sản phẩm này có đúng MỘT nghĩa: người thu
   đã nhận tiền. Ô "có dự Gala" là một câu trả lời, không phải một lời khen —
   tô xanh nó là phá quy ước màu đã giữ từ Đợt 3. Soi ô đầu của khối Gala. */
const oGalaCo = await p.locator('#sheet .dstnso').first().locator('.dstno').first()
  .getAttribute('class');
ok(`ô "có dự" KHÔNG mang lớp .go (class="${oGalaCo}")`, !/\bgo\b/.test(oGalaCo));

console.log('\n── Màn thay cho bình chọn Zalo (thẻ Đề tài) ──');
await p.locator('#sheet [data-dstn="linhvuc"]').click(); await p.waitForTimeout(400);
ok('mở được thẻ "Đề tài"',
   await p.locator('#sheet [data-dstn="linhvuc"].on').count() === 1);
ok('hiện ĐỦ 15 lĩnh vực kể cả lĩnh vực chưa ai chọn',
   await p.locator('#sheet .dstnlv').count() === 15);
ok('lĩnh vực chưa ai chọn vẫn hiện (chỉ mờ đi), không biến mất',
   await p.locator('#sheet .dstnlv.trong').count() > 0);
ok('có thanh nền so sánh bằng mắt như Zalo',
   await p.locator('#sheet .dstnlv .thanh').count() === 15);
// Chỗ khác biệt thật sự với Zalo: bấm vào ra TÊN.
ok('chưa bấm thì chưa hiện tên ai', await p.locator('#sheet .dstnai').count() === 0);
await p.locator('#sheet .dstnlv').first().click(); await p.waitForTimeout(500);
ok('bấm một lĩnh vực thì hiện TÊN từng người', await p.locator('#sheet .dstnai').count() === 1);
ok('kèm tên đề tài của họ',
   /KIEMTN Chuỗi nhà thuốc/.test(await p.locator('#sheet .dstnai').innerText()));
// SO CHỮ KHÔNG PHÂN BIỆT HOA THƯỜNG. Nhãn nằm trong `.eb`, mà lớp ấy có
// `text-transform:uppercase` — và innerText của Chrome trả về chữ ĐÃ BIẾN ĐỔI,
// nên `/Chưa chọn lĩnh vực/` đỏ dù chữ có thật trong DOM. Cùng họ với bẫy
// "đọc byte chứ đừng đọc chuỗi" của BOM: thứ trình duyệt trả về không phải
// thứ mình viết ra.
ok('có mục "Chưa chọn lĩnh vực"', /chưa chọn lĩnh vực/i.test(await p.locator('#sheet').innerText()));
// Tên lĩnh vực dài phải hiện ĐỦ. .dstnbox là flex column có max-height nên
// mặc định các mục CO LẠI dưới chiều cao nội dung, và tên hai dòng bị cắt mất
// dòng dưới — không lỗi JS, phép kiểm chuỗi không thấy, chỉ ảnh chụp mới thấy.
const bicat = await p.locator('#sheet .dstnlv').evaluateAll(
  els => els.filter(e => e.scrollHeight > e.clientHeight + 1).length);
ok(`không mục nào bị cắt chữ (${bicat} mục bị cắt)`, bicat === 0);
// Thẻ đang mở phải sống lâu hơn một lượt vẽ lại — cùng bài học với bộ lọc Sổ thu.
await p.locator('#sheet [data-dstn="nguoi"]').click(); await p.waitForTimeout(400);
ok('đổi sang thẻ "Từng người" được', await p.locator('#sheet [data-dstn="nguoi"].on').count() === 1);
ok('thẻ "Từng người" hiện danh sách từng người', await p.locator('#sheet .fd').count() > 0);

/* Ô TÌM. 146 dòng là khoảng 10.000px cuộn, mà màn này gần như luôn mở ra để
   tra MỘT người ("anh A đã trả lời chưa"). Lọc THẲNG TRÊN DOM chứ không vẽ
   lại: vẽ lại là ô tìm mất tiêu điểm và bàn phím điện thoại sập xuống sau mỗi
   chữ gõ vào — phép cuối của khối này canh đúng chỗ ấy, và nó có răng thật vì
   một bản vá gọi veDanhSachTotNghiep() trong oninput vẫn LỌC ĐÚNG. */
const truocTim = await p.locator('#sheet #dstnDs .fd:visible').count();
await p.fill('#dstnTim', 'cuong');
await p.waitForTimeout(250);
const sauTim = await p.locator('#sheet #dstnDs .fd:visible').count();
ok(`gõ "cuong" (KHÔNG DẤU) lọc được danh sách (${truocTim} → ${sauTim})`,
   sauTim >= 1 && sauTim < truocTim);
ok('… và người khớp đúng là Ngô Phú Cường',
   /Ngô Phú Cường/.test(await p.locator('#sheet #dstnDs .fd:visible').first().innerText()));
ok('ô tìm GIỮ ĐƯỢC TIÊU ĐIỂM sau khi lọc (không vẽ lại cả sheet)',
   await p.evaluate(() => document.activeElement?.id) === 'dstnTim');
await p.fill('#dstnTim', 'khong-co-ai-ten-nhu-vay');
await p.waitForTimeout(250);
ok('không ai khớp thì nói ra, không để một khung trống câm',
   await p.locator('#sheet #dstnKhong').isVisible());
await p.fill('#dstnTim', ''); await p.waitForTimeout(250);

await p.locator('#sheet [data-dstn="linhvuc"]').click(); await p.waitForTimeout(400);
ok('quay lại thẻ lĩnh vực thì lĩnh vực vừa mở VẪN mở',
   await p.locator('#sheet .dstnai').count() === 1);
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

/* ── Tab Hôm nay: ô "Việc của bạn" và thẻ 🎓 KHÔNG được nói cùng một chuyện ──
   Ngô Phú Cường 19/9: ô hero vẫn giục "Nhóm chưa chốt đề tài" dù lớp đã bỏ
   đường nộp theo nhóm từ 18/9 (migration 0043). Bước ấy nay thay bằng việc
   TỐT NGHIỆP còn nợ, và khi hero đã dẫn sang /totnghiep thì thẻ 🎓 ngay dưới
   là bản sao đặt cạnh nhau — ẩn đi.

   Phép này phải đi CẢ HAI CHIỀU. Phép một chiều cũ ("luôn có đúng một thẻ")
   sẽ đỏ sau bản vá, vì bộ kiểm này CỐ Ý không bao giờ lưu phần Hồ sơ (xem mục
   "lưu một phần không đụng phần kia" ở trên) nên hero của chính phiên ấy đang
   là bước hồ sơ tốt nghiệp. Chữa bằng cách XOÁ phép là mất luôn chốt canh
   "còn lối vào /totnghiep từ tab Hôm nay" — đúng bài học số 35 trong README.
   Nên nó xoay sang chiều còn lại, và bắt được cả hai kiểu hỏng: ẩn CẢ HAI
   (mất hẳn lối vào) và hiện CẢ HAI (nói một chuyện hai lần). */
console.log('\n── Tab Hôm nay: hero và thẻ 🎓 ──');
await p.goto(B + '/#/nay'); await p.waitForTimeout(1600);
ok('không thêm tab thứ bảy vào thanh nav', await p.locator('.nb').count() === 6);

const heroH = await p.locator('#v-nay .hero h2').innerText().catch(() => '');
ok(`hero KHÔNG còn giục đề tài nhóm (đang nói: "${heroH}")`, !/chưa chốt đề tài/i.test(heroH));
ok(`hero nói việc tốt nghiệp còn nợ (hồ sơ chứng chỉ)`, /hồ sơ|chứng chỉ/i.test(heroH));
ok('hero đang dẫn sang /totnghiep → thẻ 🎓 ẩn đi, không nói hai lần',
   await p.locator('.tnthe').count() === 0);

/* Khối "Đang diễn ra" nằm NGAY DƯỚI trên cùng màn hình ấy, và logActivity ở
   routes/plan.js ghi vào đó. Sửa hero mà quên dòng kia thì chữ cũ vẫn còn
   trên đúng tab vừa chữa.

   Soi ĐÚNG chuỗi của đường NHÓM. Đừng nới thành /chốt đề tài/ — đường CÁ NHÂN
   (routes/tot-nghiep.js) ghi "chốt đề tài KHKD: …", và đó là luồng MỚI, phải
   còn nguyên; một regex rộng hơn sẽ bắt nhầm chính thứ vừa dựng lên. */
const feed = await p.locator('#v-nay').innerText();
ok('khối "Đang diễn ra" không còn chữ "chốt đề tài của nhóm"',
   !/chốt đề tài của nhóm/i.test(feed));

/* Nút hero phải ĐIỀU HƯỚNG THẬT. Quên nhánh `target === 'totnghiep'` trong
   onclick thì nút không làm gì cả: không lỗi JS, không log, hero nói đúng câu
   mà bấm vào đứng im — đúng loại hỏng im lặng tệ nhất của cả bản vá. */
await p.locator('#heroCta').click();
await p.waitForTimeout(1500);
ok(`bấm nút hero → sang /totnghiep (đang ở ${new URL(p.url()).pathname})`,
   new URL(p.url()).pathname === '/totnghiep');
ok('và trang ấy dựng đủ ba khối', await p.locator('.tnsec').count() === 3);

// Khai nốt hồ sơ → bước tốt nghiệp TẮT, và thẻ 🎓 phải QUAY LẠI.
await p.evaluate(() => fetch('/api/totnghiep/ho-so', {
  method: 'PUT', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    ho_ten: 'Ngô Phú Cường', ngay_sinh: '01/02/1980', dien_thoai: '0979755857',
    doanh_nghiep: 'Công ty A', chuc_vu: 'Giám đốc',
    linh_vuc: ['cong-nghe'], nhu_cau_ket_noi: 'kiểm thẻ hôm nay',
  }),
}).then(r => r.text()));
await p.goto(B + '/#/nay'); await p.waitForTimeout(1600);
const the = p.locator('.tnthe');
ok('khai xong → hero nhường chỗ, thẻ 🎓 hiện lại', await the.count() === 1);
ok('thẻ trỏ đúng /totnghiep', (await the.getAttribute('href')) === '/totnghiep');

/* ── Tab Bài: khối Đề tài thôi màu CAM ───────────────────────────────────
   Cam trong sản phẩm này nghĩa là "còn phải làm gì đó", mà đề tài chung của
   nhóm thôi là việc còn nợ từ 18/9. Đọc màu THẬT bằng getComputedStyle và so
   với chính giá trị --due lấy từ stylesheet — ghi cứng mã màu là có ngày đổi
   biến mà phép kiểm vẫn xanh. Phép kiểm chuỗi một mình mù với chuyện này. */
console.log('\n── Tab Bài: đề tài nhóm nay là tuỳ chọn ──');
await p.goto(B + '/#/bai'); await p.waitForTimeout(1800);
const baiTxt = await p.locator('#v-bai').innerText();
ok('không còn câu "bảy phần sau đều treo"', !/bảy phần sau đều treo/i.test(baiTxt));
ok('không còn chữ "chưa chốt đề tài"', !/chưa chốt đề tài/i.test(baiTxt));
ok('có dẫn sang trang Lễ tốt nghiệp', await p.locator('#v-bai a[href="/totnghiep"]').count() >= 1);
const camOi = await p.evaluate(() => {
  const due = getComputedStyle(document.documentElement).getPropertyValue('--due').trim();
  const chuan = c => { const d = document.createElement('i'); d.style.color = c;
    document.body.appendChild(d); const v = getComputedStyle(d).color; d.remove(); return v; };
  const mucTieu = chuan(due);
  return [...document.querySelectorAll('#v-bai .cb *')]
    .some(e => getComputedStyle(e).color === mucTieu && /đề tài|nhóm chưa/i.test(e.textContent));
});
ok('khối Đề tài KHÔNG còn dùng màu cam --due', camOi === false);

/* ── /dangnhap phải BIẾT máy này đã đăng nhập rồi (19/9) ───────────────────
   Ngô Phú Cường: *"Một số người đã đăng nhập và đã điền số điện thoại email
   nhưng tôi gửi link đăng nhập cho họ, họ lại không thấy hiện lên?"* — triệu
   chứng họ gặp là *"mở ra màn đòi số điện thoại"*.

   `boot()` gọi thẳng màn tự nhận diện cho `/dangnhap` mà KHÔNG hề hỏi người
   đang mở đã có phiên hay chưa. Người đã ở trong ứng dụng bấm vào link nhận
   được một màn "Bạn là ai?", rồi bước 2 đòi số khớp bản danh sách 15/8 — với
   38 người thiếu số đúng thì đó là ngõ cụt.

   Dùng CHÍNH phiên Cường ở trên, vì chỗ này chỉ lộ ra khi CÓ phiên. */
console.log('\n── /dangnhap khi máy đã đăng nhập rồi ──');
await p.goto(B + '/dangnhap'); await p.waitForTimeout(1800);
ok('hiện băng "máy này đang đăng nhập"', await p.locator('#vPhien .vphien').count() === 1);
ok('… và nói ĐÚNG TÊN đang đăng nhập, không phải một câu chung chung',
   /Ngô Phú Cường/.test(await p.locator('#vPhien').innerText()));
/* Băng chứ không phải chuyển hướng: người thật sự muốn đăng nhập bằng tài
   khoản khác (máy dùng chung, trưởng nhóm mở hộ) phải còn nguyên đường vào.
   Bỏ phép này thì một bản vá `location.href = '/'` vẫn xanh ở phép trên. */
ok('biểu mẫu đăng nhập VẪN còn bên dưới, không bị đá về trang chủ',
   await p.locator('#vTen').count() === 1);
ok('nút "Vào ứng dụng" đưa về gốc', await p.locator('#vPhienVao').count() === 1);
await p.locator('#vPhienVao').click(); await p.waitForTimeout(1600);
ok(`bấm vào thì về thật (đang ở ${new URL(p.url()).pathname})`,
   new URL(p.url()).pathname === '/');

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

/* Phép đối chứng cho băng vừa kiểm ở trên: KHÔNG có phiên thì KHÔNG có băng.
   Bỏ phép này thì một bản vá vẽ băng vô điều kiện vẫn xanh — và nó sẽ bảo
   77 người chưa vào được rằng họ đang đăng nhập rồi, ở đúng màn của họ. */
await p3.goto(B + '/dangnhap'); await p3.waitForTimeout(1600);
ok('chưa đăng nhập thì KHÔNG có băng "đang đăng nhập"',
   await p3.locator('#vPhien .vphien').count() === 0);
ok('… và màn vào vẫn dựng đủ như cũ', await p3.locator('#vTen').count() === 1);

await p3.goto(B + '/totnghiep'); await p3.waitForTimeout(1600);

// Phải bày ĐỦ HAI lối: 39 người kia CÓ số nên vẫn đăng nhập được, và đăng
// nhập thì được cả ứng dụng. Chỉ bày lối công khai là họ mất phần còn lại mà
// không ai nói cho biết.
ok('có lối "Đăng nhập"', await p3.locator('a[href="/dangnhap"]').count() >= 1);
ok('có lối "điền thẳng ở đây"', await p3.locator('#tnckBatDau').count() === 1);

await p3.click('#tnckBatDau'); await p3.waitForTimeout(500);
ok('mở ra màn tìm tên', await p3.locator('#tnckTen').count() === 1);

/* LỐI VỀ ỨNG DỤNG CHỈ CÓ Ở BẢN CÓ PHIÊN — phép đối chứng cho một chỗ LỆCH CÓ
   CHỦ Ý, không phải chỗ quên. Đường này dành cho 38 người KHÔNG đăng nhập
   được: với họ "về ứng dụng" dẫn thẳng vào màn 401, tức một lối ra dẫn vào
   ngõ cụt. Thiếu phép này thì một lần sửa "cho nhất quán hai màn" lọt qua
   sạch, và nó hỏng đúng với nhóm người khó vào nhất.
   Soi ở ĐÂY chứ không ở màn 401 ngay trước: màn ấy dùng `.claimcard` chứ
   chưa dựng băng chàm, nên phép đo ở đó xanh mà chẳng chứng minh được gì. */
ok('đường CÔNG KHAI có băng nhận diện chàm, để họ biết mình đang ở đúng chỗ',
   await p3.locator('.tnhead').count() === 1);
ok('… nhưng KHÔNG có nút "về ứng dụng" trong băng ấy',
   await p3.locator('.tnhead .tnve').count() === 0);
// Vẫn phải có lối lui từng bước — bỏ luôn cả hai là nhốt người ta trong form.
ok('… mà có lối "Quay lại" theo từng bước', await p3.locator('.tnback').count() >= 1);

/* A4 — DANH SÁCH BỊ CẮT PHẢI NÓI RA.
   searchRoster cắt cứng ở 12 người và trước 19/9 không báo là đã cắt: gõ
   "nguyen" khớp 26 người, chỉ thấy 12, và người không thấy tên mình kết luận
   Ban tổ chức bỏ sót họ — ngay ở bước ĐẦU TIÊN của lối đi duy nhất dành cho
   38 người không đăng nhập được. */
await p3.fill('#tnckTen', 'nguyen'); await p3.waitForTimeout(1400);
const dsCat = await p3.locator('#tnckDs').innerText();
ok('gõ một chuỗi khớp nhiều người thì đúng 12 dòng hiện ra',
   (await p3.locator('#tnckDs [data-rid]').count()) === 12);
ok('và NÓI RA còn bao nhiêu người nữa bị cắt', /Còn \d+ người nữa/.test(dsCat));
ok('kèm lời khuyên ĐÚNG CHIỀU — gõ THÊM chữ, không phải gõ ngắn hơn',
   /gõ thêm chữ/i.test(dsCat) && !/ngắn hơn/i.test(dsCat));

await p3.fill('#tnckTen', 'khanh toan'); await p3.waitForTimeout(1400);
ok('tìm không dấu ra đúng người', (await p3.locator('#tnckDs').innerText()).includes('Đinh Khánh Toàn'));
await p3.locator('#tnckDs [data-rid]').first().click(); await p3.waitForTimeout(1200);

ok('mở ra form', await p3.locator('#ckGui').count() === 1);
ok('form công khai cũng có 15 chip lĩnh vực KHKD', await p3.locator('#ckLv .fc').count() === 15);
// PHÉP CÓ RĂNG NHẤT CỦA MỤC NÀY.
ok('ô Ngày sinh để TRỐNG — không điền sẵn dữ liệu của ai',
   (await p3.inputValue('#ckDob')) === '');
ok('ô Số điện thoại để TRỐNG', (await p3.inputValue('#ckSdt')) === '');
/* A1 — BA Ô NÀY LÀ CHỮ MỜ, KHÔNG PHẢI GIÁ TRỊ.
   Máy chủ hứa "ô để trống thì giữ nguyên bản đã lưu" (giuCu). Một ô điền sẵn
   thì KHÔNG BAO GIỜ trống, nên lời hứa ấy chết lặng với đúng ba ô này: người
   đã sửa doanh nghiệp/chức vụ, hôm sau quay lại chỉ để thêm ngày sinh, bị trả
   về bản danh sách gốc 15/8. Chữ mờ giữ đủ hai vế — vẫn nhìn thấy bản gốc, mà
   để trống vẫn là "giữ bản đã lưu".
   Vế `value` rỗng mới là vế có răng: bỏ nó đi thì đổi ngược về `value=` vẫn
   xanh, vì placeholder và value hiện lên trông y hệt nhau trên ảnh chụp. */
ok('ô Họ tên: tên vừa chọn là CHỮ MỜ, ô vẫn trống',
   (await p3.getAttribute('#ckTen', 'placeholder')) === 'Đinh Khánh Toàn'
   && (await p3.inputValue('#ckTen')) === '');
ok('ô Doanh nghiệp và Chức vụ cũng vậy — trống, chỉ gợi ý bằng chữ mờ',
   (await p3.inputValue('#ckDN')) === '' && (await p3.inputValue('#ckCV')) === ''
   && ((await p3.getAttribute('#ckDN', 'placeholder')) || '').length > 0);
ok('nói cho người điền biết chữ mờ nghĩa là gì',
   /chữ mờ/i.test(await p3.locator('#ckGui').locator('xpath=ancestor::*[contains(@class,"tncard")]').innerText()));
const chuCk = await p3.locator('body').innerText();
ok('KHÔNG có chữ "đã đóng" trên màn công khai', !/đã đóng/i.test(chuCk));

/* ── "ÉP KHAI ĐỦ" nhìn từ phía người dùng ────────────────────────────────
   Ngô Phú Cường 18/9. Phép kiểm ở tầng API đã có (kiem-totnghiep.mjs); phép
   này hỏi một câu khác hẳn mà API không trả lời được: người bị chặn có BIẾT
   mình thiếu ô nào không, và họ có MẤT đoạn vừa gõ không.

   Vế thứ hai mới là vế đáng giá. Form này dài hơn một màn điện thoại và người
   đi lối công khai KHÔNG có bản cũ trên máy chủ để rơi về — chặn mà vẽ lại
   màn là họ gõ lại từ đầu, và lần thứ hai thì phần lớn bỏ cuộc. */
ok('có nói trước phải điền đủ những ô nào', /phải điền đủ/i.test(chuCk));
await p3.fill('#ckDob', '05/05/1975');
await p3.fill('#ckSdt', '0912345678');
await p3.locator('#ckDuLe [data-dule="co"]').click(); await p3.waitForTimeout(150);
await p3.click('#ckGui'); await p3.waitForTimeout(1500);
ok('thiếu ô thì BỊ CHẶN, không nhảy sang màn "đã gửi"',
   await p3.locator('#ckGui').count() === 1);
const loiCk = await p3.locator('#ckErr').innerText();
ok(`câu báo gọi ĐÚNG TÊN ô còn trống ("${loiCk.slice(0, 70)}")`,
   /Nhu cầu kết nối/.test(loiCk) && /Lĩnh vực/.test(loiCk));
// Chặn mà vẽ lại màn là người ta gõ lại từ đầu, và lần thứ hai thì phần lớn
// bỏ cuộc. Ở form này nó nặng hơn hẳn form có phiên: không có bản cũ trên máy
// chủ để rơi về.
ok('ngày sinh vừa gõ VẪN CÒN trong ô, không bị vẽ lại mất',
   (await p3.inputValue('#ckDob')) === '05/05/1975');

// Ô chọn ảnh phải có mặt ở ĐÂY — đó là cả việc "làm nốt phần logo doanh
// nghiệp và ảnh chân dung" cho 38 người không đăng nhập được.
ok('form công khai có ô chọn ảnh chân dung và logo',
   await p3.locator('.tnanh [data-anhfile]').count() === 2);
ok('ô ảnh KHÔNG hé lộ người ấy đã gửi ảnh chưa (không có "đã gửi")',
   !/đã gửi/i.test(await p3.locator('.tnanh').innerText()));

// Đo tràn ngang trên CHÍNH TRANG FORM, không chỉ trên màn cuối: form mới dài
// thêm hai thẻ ảnh nằm cạnh nhau và một dòng nhắc liệt kê bảy tên ô. Lỗi bố
// cục chỉ ảnh chụp mới thấy — phép kiểm chuỗi không thấy.
const tranForm = await p3.evaluate(() =>
  document.documentElement.scrollWidth - document.documentElement.clientWidth);
ok(`form công khai không tràn ngang ở 390px (thừa ${tranForm}px)`, tranForm <= 1);
await p3.screenshot({ path: '/tmp/tn-ck-form.png', fullPage: true });

await p3.fill('#ckDN', 'Công ty Kiểm Tra');
await p3.fill('#ckCV', 'Giám đốc');
await p3.fill('#ckKN', 'cần nhà phân phối ngành thực phẩm ở miền Trung');
await p3.locator('#ckNg .fc').first().click(); await p3.waitForTimeout(150);
await p3.click('#ckGui'); await p3.waitForTimeout(2000);

ok('điền đủ thì gửi được, ra màn "Đã gửi xong"',
   (await p3.locator('.tncard h1').innerText()).includes('Đã gửi'));
// Mã QR chỉ hiện SAU khi chọn "có dự" — chưa nói là đi thì chưa có gì để
// chuyển tiền, mà bày sẵn mã là mời chuyển nhầm.
ok('hiện khối phí kèm cú pháp chuyển khoản', await p3.locator('.tnphi').count() === 1);
/* A3 — HAI nút chép, không phải một.
   Nhánh dự phòng lúc mã QR không tải được nói thẳng "chuyển khoản tay theo số
   tài khoản bên dưới cũng được" — mà trước 19/9 số ấy là chữ thường 12.5px,
   không chép được. Tức đường lui chính thức bắt người 50 tuổi đọc tay một dãy
   10 chữ số rồi gõ lại vào app ngân hàng; gõ sai một số là tiền đi nhầm người.
   Phép này đếm ĐÚNG HAI và soi từng nút mang đúng chuỗi nào — đếm ">= 1" thì
   một bản vá làm rụng mất nút số tài khoản vẫn xanh. */
const chepCk = p3.locator('.tnphi .copy');
ok('khối phí có ĐÚNG hai nút chép', (await chepCk.count()) === 2);
ok('nút thứ nhất chép SỐ TÀI KHOẢN',
   (await chepCk.nth(0).getAttribute('data-tncopy')) === '0975587586');
ok('nút thứ hai chép cú pháp, bắt đầu bằng GALA',
   /^GALA/.test(await chepCk.nth(1).getAttribute('data-tncopy')));
ok('mỗi nút nói rõ nó chép cái gì',
   /chép số TK/i.test(await chepCk.nth(0).innerText())
   && /chép nội dung/i.test(await chepCk.nth(1).innerText()));
ok('mã QR hỏng thì có ô dự phòng, không để ô vỡ ảnh',
   await p3.locator('.tnphi .ph').count() === 1);
ok('không lỗi JS ở đường công khai: ' + (loi3.join(' | ') || 'sạch'), loi3.length === 0);

/* Lượt GỬI LẠI — "khai bổ sung" mà Ngô Phú Cường nới ra ngày 18/9.
   Màn cuối phải nói ĐÚNG chuyện: người quay lại lần hai nghe "đã gửi xong"
   suông sẽ tưởng mình vừa ghi đè sạch bản khai cũ, trong khi máy chủ làm
   ngược lại (ô để trống thì giữ nguyên). Câu chữ ở đây không phải trang trí:
   nó là thứ duy nhất nói cho họ biết dữ liệu cũ còn hay mất. */
console.log('\n── Gửi lại lần hai: khai BỔ SUNG, không phải ghi đè ──');
await p3.goto(B + '/totnghiep', { waitUntil: 'networkidle' });
await p3.click('#tnckBatDau'); await p3.waitForTimeout(400);
await p3.fill('#tnckTen', 'khanh toan'); await p3.waitForTimeout(1400);
await p3.locator('#tnckDs [data-rid]').first().click(); await p3.waitForTimeout(1200);
ok('mở lại được form cho cùng một người', await p3.locator('#ckGui').count() === 1);
// CỐ Ý chỉ điền MỘT ô rồi gửi — đúng hình dạng của một lượt bổ sung thật.
await p3.fill('#ckKN', 'bổ sung nhu cầu kết nối');
await p3.click('#ckGui'); await p3.waitForTimeout(2000);
const tieuDe2 = await p3.locator('.tncard h1').innerText();
ok(`màn cuối đổi thành "Đã cập nhật" (đang là "${tieuDe2}")`, /cập nhật/i.test(tieuDe2));
const than2 = await p3.locator('.tncard').innerText();
ok('nói rõ ô để trống vẫn giữ nguyên nội dung cũ',
   /giữ nguyên/i.test(than2) && /để trống/i.test(than2));
// Và khối phí vẫn còn, dù lượt này KHÔNG chọn lại "có dự": du_le cũ được
// giữ, nên người quay lại bổ sung không bị mất mã QR đúng lúc cần nó.
ok('khối phí vẫn còn dù lượt này không chọn lại "có dự"',
   await p3.locator('.tnphi').count() === 1);
ok('không lỗi JS ở lượt bổ sung: ' + (loi3.join(' | ') || 'sạch'), loi3.length === 0);

const tran3 = await p3.evaluate(() =>
  document.documentElement.scrollWidth - document.documentElement.clientWidth);
ok(`không tràn ngang ở 390px (thừa ${tran3}px)`, tran3 <= 1);
await p3.screenshot({ path: '/tmp/tn-congkhai.png', fullPage: true });
console.log('  (ảnh chụp: /tmp/tn-congkhai.png)');

/* ══ RỦ NGƯỜI CÙNG LÀM ĐỀ TÀI (migration 0045) ════════════════════════════
   kiem-totnghiep.mjs đã kiểm hết phần máy chủ. Ở đây chỉ kiểm thứ máy chủ
   KHÔNG kiểm được, và cả ba đều là loại lỗi im lặng:

   · người đã có quan hệ hiện MỜ và bấm KHÔNG được — chặn ở giao diện, vì
     bày một dòng bấm vào là 409 thì tệ hơn hẳn không bày;
   · ô tìm GIỮ TIÊU ĐIỂM sau khi lọc — vẽ lại sheet là bàn phím điện thoại
     sập xuống sau MỖI chữ gõ vào, và không phép kiểm chuỗi nào thấy;
   · dòng phụ của <summary> tô ĐÚNG màu cam `--due`, đọc bằng getComputedStyle
     rồi so với chính giá trị biến lấy từ stylesheet — ghi cứng mã màu là có
     ngày đổi biến mà phép kiểm vẫn xanh.

   Dùng HAI phiên trong cùng một trình duyệt (Cường rủ, Thường trả lời), đúng
   khuôn pw-doi-nhom.mjs: một phiên thì không bao giờ thấy được vế ĐỒNG Ý. */
console.log('\n── Rủ người cùng làm đề tài ──');
const c4 = await b.newContext({ viewport: { width: 390, height: 1400 }, deviceScaleFactor: 2 });
await c4.addCookies([{ name: 's', value: 'tk-tn-cuong', domain: '127.0.0.1', path: '/' }]);
const p4 = await c4.newPage();
const loi4 = []; p4.on('pageerror', e => loi4.push(e.message));
await p4.goto(B + '/totnghiep', { waitUntil: 'networkidle' }); await p4.waitForTimeout(900);

const clKhoiDeTai = await moKhoi(p4, 'Đề tài');
ok('khối Đề tài có nút "Rủ người cùng làm"', await p4.locator('#tnRu').count() === 1);
await p4.click('#tnRu'); await p4.waitForTimeout(500);
ok('sheet mở ra với danh sách chọn người', await p4.locator('#ruDs .fdpick').count() > 0);

// Vùng chạm: cả dòng là một <button> ≥56px, dùng LẠI .fdpick của /vao. Đo
// thật chứ không tin lớp CSS — một bản vá đổi .fdpick ở chỗ khác sẽ lộ ra.
const caoDong = await p4.locator('#ruDs .fdpick').first().evaluate(el => el.getBoundingClientRect().height);
ok(`cả dòng tên bấm được, cao ${Math.round(caoDong)}px (≥56)`, caoDong >= 56);

// Ô tìm lọc THẲNG TRÊN DOM và GIỮ TIÊU ĐIỂM. Phép có răng là tiêu điểm, không
// phải "lọc đúng người" — phép sau xanh với cả một bản vẽ lại cả sheet.
await p4.click('#ruTim');
await p4.type('#ruTim', 'nhom bay', { delay: 40 }); await p4.waitForTimeout(400);
const conHien = await p4.locator('#ruDs .fdpick:visible').count();
ok(`gõ không dấu vẫn lọc đúng (còn ${conHien} dòng)`, conHien >= 1 && conHien < 7);
ok('ô tìm GIỮ tiêu điểm sau khi lọc — không vẽ lại sheet',
   await p4.evaluate(() => document.activeElement?.id) === 'ruTim');

// Bước hai: công tắc hai vế, và vế thứ hai gửi đúng `bai_cua: 'ho'`.
await p4.locator('#ruDs .fdpick:visible').first().click(); await p4.waitForTimeout(400);
ok('bước hai hiện công tắc hai vế', await p4.locator('#ruBen [data-ben]').count() === 2);
ok('mặc định là "bài của tôi"',
   await p4.locator('#ruBen [data-ben="toi"]').evaluate(el => el.classList.contains('on')));
await p4.click('#ruBen [data-ben="ho"]'); await p4.waitForTimeout(200);
ok('bấm vế kia thì vế kia bật và vế đầu tắt',
   await p4.locator('#ruBen [data-ben="ho"]').evaluate(el => el.classList.contains('on'))
   && !(await p4.locator('#ruBen [data-ben="toi"]').evaluate(el => el.classList.contains('on'))));

// Bắt request để chắc thân gửi lên ĐÚNG `bai_cua` đang chọn — đây là chỗ
// giao diện dễ gửi ngược nhất, và gửi ngược thì không chỗ nào báo lỗi: lời rủ
// vẫn đi, chỉ là nó nói sai bài của ai.
await p4.fill('#ruNhan', 'cùng làm nhé');
const [reqRu] = await Promise.all([
  p4.waitForRequest(r => r.url().endsWith('/api/totnghiep/cung-lam') && r.method() === 'POST'),
  p4.click('#ruGui'),
]);
const thanRu = JSON.parse(reqRu.postData() ?? '{}');
ok(`gửi đúng bai_cua đang chọn (nhận "${thanRu.bai_cua}")`, thanRu.bai_cua === 'ho');
ok('gửi kèm lời nhắn vừa gõ', thanRu.loi_nhan === 'cùng làm nhé');
await p4.waitForTimeout(1600);

// Sau khi gửi: người ấy hiện MỜ trong danh sách và bấm KHÔNG được.
await p4.click('#tnRu'); await p4.waitForTimeout(500);
const soMo = await p4.locator('#ruDs .fdpick.mo').count();
ok(`người đã có quan hệ hiện MỜ (${soMo} dòng)`, soMo === 1);
ok('… và bấm KHÔNG được', await p4.locator('#ruDs .fdpick.mo').first().isDisabled());
ok('… nhưng KHÔNG bị lọc khỏi danh sách',
   await p4.locator('#ruDs .fdpick').count() === await p4.locator('#ruDs [data-ru]').count()
   && await p4.locator('#ruDs .fdpick').count() > 1);
await p4.keyboard.press('Escape');
await p4.locator('#veil').evaluate(el => el.classList.remove('on')).catch(() => {});
await p4.waitForTimeout(300);

/* ── Phía NGƯỜI ĐƯỢC RỦ: dòng phụ <summary> tô đúng màu, và hai nút ─── */
const c5 = await b.newContext({ viewport: { width: 390, height: 1400 }, deviceScaleFactor: 2 });
await c5.addCookies([{ name: 's', value: 'tk-tn-n7', domain: '127.0.0.1', path: '/' }]);
const p5 = await c5.newPage();
const loi5 = []; p5.on('pageerror', e => loi5.push(e.message));

/* PHẢI TRẢ LỜI GALA TRƯỚC, và đó không phải dọn dẹp cho gọn: `tnKhoiMoDau()`
   xếp Gala LÊN TRƯỚC lời rủ (hạn 21h00 ngày 19/9 là hạn gấp nhất của cả
   zone), nên người chưa trả lời Gala mở trang ra thấy khối Gala chứ không
   phải khối Đề tài — đúng thiết kế.

   Bỏ bước này thì hai phép dưới ĐỎ vì một lý do chẳng liên quan, và còn tệ
   hơn: `innerText` của Chrome trả về RỖNG cho nội dung nằm trong <details>
   đang đóng, nên mọi phép so chuỗi sau đó cũng hỏng theo mà câu báo lỗi chỉ
   nói "không khớp". Đã vấp đúng vậy ở lượt chạy đầu. */
/* Trước đó, canh đúng cảnh ấy: CHƯA trả lời Gala mà đã có lời rủ chờ thì
   khối Đề tài GẬP, và dòng phụ cam ở <summary> là thứ DUY NHẤT còn nhìn
   thấy được. Đó chính là lý do dòng phụ tồn tại — nếu nó im thì người ta
   không bao giờ biết có ai đang chờ mình. */
await p5.goto(B + '/totnghiep', { waitUntil: 'networkidle' }); await p5.waitForTimeout(900);
ok('chưa trả lời Gala thì Gala vẫn mở trước (hạn 21h00 19/9 gấp hơn)',
   await p5.locator('.tnsec[data-sec="gala"]').evaluate(el => el.hasAttribute('open'))
   && !(await p5.locator('.tnsec[data-sec="detai"]').evaluate(el => el.hasAttribute('open'))));
ok('… nhưng dòng phụ CAM ở summary vẫn báo có người đang chờ',
   /đang chờ bạn trả lời/i.test(
     await p5.locator('.tnsec[data-sec="detai"] > summary .t i').innerText()));

await fetch(B + '/api/totnghiep/gala', {
  method: 'PUT',
  headers: { cookie: 's=tk-tn-n7', 'content-type': 'application/json' },
  body: JSON.stringify({ du_le: 'khong' }),
});
await p5.goto(B + '/totnghiep', { waitUntil: 'networkidle' }); await p5.waitForTimeout(900);

ok('khối Đề tài MỞ SẴN với người đang có lời rủ chờ trả lời',
   await p5.locator('.tnsec[data-sec="detai"]').evaluate(el => el.hasAttribute('open')));
const phuDeTai = p5.locator('.tnsec[data-sec="detai"] > summary .t i');
ok(`dòng phụ nói có người đang chờ ("${await phuDeTai.innerText()}")`,
   /đang chờ bạn trả lời/i.test(await phuDeTai.innerText()));
/* Đọc màu THẬT và so với chính biến --due lấy từ stylesheet. Ghi cứng
   #A8500E là có ngày đổi biến mà phép kiểm vẫn xanh. */
const [mauPhu, mauDue] = await p5.evaluate(() => {
  const el = document.querySelector('.tnsec[data-sec="detai"] > summary .t i');
  const norm = c => c.replace(/\s/g, '');
  const d = getComputedStyle(document.documentElement).getPropertyValue('--due').trim();
  const do1 = document.createElement('span');
  do1.style.color = d; document.body.appendChild(do1);
  const chuan = norm(getComputedStyle(do1).color); do1.remove();
  return [norm(getComputedStyle(el).color), chuan];
});
ok(`dòng phụ tô đúng màu --due (${mauPhu} vs ${mauDue})`, mauPhu === mauDue);

const choDuyet = p5.locator('.tncl.cho');
ok('có khối "Có người muốn làm chung với bạn"', await choDuyet.count() === 1);
ok('khối ấy đặt TRÊN CÙNG trong thân khối Đề tài',
   await p5.locator('.tnsec[data-sec="detai"] .tnbody > *').first().evaluate(
     el => el.classList.contains('tncl') && el.classList.contains('cho')));
ok('in lời nhắn của người gửi', /cùng làm nhé/.test(await choDuyet.innerText()));
ok('có đủ hai nút Đồng ý / Từ chối',
   await p5.locator('[data-cldy]').count() === 1 && await p5.locator('[data-cltc]').count() === 1);
const caoNut = await p5.locator('[data-cldy]').evaluate(el => el.getBoundingClientRect().height);
ok(`nút Đồng ý cao ${Math.round(caoNut)}px (≥44, vùng chạm tối thiểu)`, caoNut >= 44);

await p5.click('[data-cldy]'); await p5.waitForTimeout(1800);
ok('bấm Đồng ý xong thì khối lời rủ biến mất', await p5.locator('.tncl.cho').count() === 0);
const thanDeTai = await p5.locator('.tnsec[data-sec="detai"]').innerText();
ok('… và hiện khối "Cùng làm bài của bạn" hoặc "Bài chung bạn đang đứng tên"',
   /Cùng làm bài của bạn|Bài chung bạn đang đứng tên/i.test(thanDeTai));
ok('không lỗi JS phía người được rủ: ' + (loi5.join(' | ') || 'sạch'), loi5.length === 0);

/* CHỦ BÀI KHÔNG GỠ ĐƯỢC AI — kiểm ở GIAO DIỆN, vì máy chủ trả 404 thì giao
   diện vẫn có thể bày ra một nút bấm vào là lỗi, mà bày một nút bấm vào là
   lỗi còn tệ hơn hẳn không bày.

   VAI Ở ĐÂY NGƯỢC VỚI TRỰC GIÁC, và đó đúng là chỗ phép kiểm soi nhầm màn:
   lượt gửi ở trên chọn `bai_cua: 'ho'` (Cường XIN vào bài của Nhóm Bảy), nên
   NHÓM BẢY (p5) là CHỦ BÀI còn CƯỜNG (p4) là người cùng làm — ngược hẳn với
   thứ tự hai phiên xuất hiện trong tệp này. Soi nhầm màn thì cả hai phép đỏ
   ở một chỗ chẳng liên quan gì tới thứ chúng đang canh; đã vấp đúng vậy. */
await p4.reload({ waitUntil: 'networkidle' }); await p4.waitForTimeout(900);
await moKhoi(p4, 'Đề tài');
const thanChuBai = await p5.locator('.tnsec[data-sec="detai"]').innerText();
ok('màn CHỦ BÀI không có nút Rời nào (chỉ người cùng làm mới rời được)',
   await p5.locator('[data-clroi]').count() === 0);
ok('… và nói rõ muốn ai rời thì chính họ tự bấm',
   /chính họ bấm|tự rời|không gỡ tên/i.test(thanChuBai));
ok('màn NGƯỜI CÙNG LÀM có nút "Rời khỏi bài này"',
   await p4.locator('[data-clroi]').count() === 1);
// Bài neo vào CHỦ: thẻ bài chung ở màn người cùng làm phải là CHỈ ĐỌC.
ok('… và thẻ bài chung là CHỈ ĐỌC, không có ô nhập nào trong đó',
   await p4.locator('.tncl .it input, .tncl .it textarea').count() === 0);

const tran4 = await p4.evaluate(() =>
  document.documentElement.scrollWidth - document.documentElement.clientWidth);
ok(`không tràn ngang ở 390px sau khi thêm bốn phần (thừa ${tran4}px)`, tran4 <= 1);
ok('không lỗi JS phía người rủ: ' + (loi4.join(' | ') || 'sạch'), loi4.length === 0);
await p4.screenshot({ path: '/tmp/tn-cunglam-chu.png', fullPage: true });
await p5.screenshot({ path: '/tmp/tn-cunglam-ban.png', fullPage: true });
console.log('  (ảnh chụp: /tmp/tn-cunglam-chu.png · /tmp/tn-cunglam-ban.png)');

await b.close();
console.log(hong === 0 ? '\n✅ TẤT CẢ ĐỀU XANH' : `\n❌ ${hong} phép ĐỎ`);
process.exit(hong === 0 ? 0 : 1);
