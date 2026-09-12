// Trợ lý KHKD — giao diện hội thoại trong tab Bài (public/app.js, app.css).
//
// VÌ SAO PHẢI CÓ BỘ KIỂM TRÌNH DUYỆT RIÊNG, không dồn vào kiem-tro-ly.mjs:
// câu trả lời của mô hình là VĂN BẢN KHÔNG DO NGƯỜI TRONG LỚP GÕ RA mà vẫn
// chạy thẳng vào innerHTML qua mdSafe(). Mọi chỗ khác dùng mdSafe() đều nhận
// chữ của người trong lớp; đây là chỗ DUY NHẤT nhận chữ của một hệ thống
// ngoài. Prompt bảo nó đừng sinh HTML, nhưng "đã bảo rồi" không phải một chốt
// chặn — chốt chặn là mdSafe() esc() TRƯỚC rồi mới parse, và phép kiểm này là
// thứ giữ nó. Phiên gieo sẵn trong reset-tro-ly.sh cố ý nhét bốn ca độc vào
// đúng chỗ câu trả lời của trợ lý.
//
// Sandbox không gọi được ra internet nên KHÔNG có lượt hỏi đáp thật nào. Bù
// lại, nhánh HỎNG kiểm được — và nó gánh phép quan trọng thứ hai của tệp này:
// Ô NHẬP KHÔNG ĐƯỢC XOÁ khi gửi hỏng. Trên điện thoại, mất một đoạn vừa gõ là
// chuyện lớn; và đúng hôm nay thì gửi LUÔN hỏng, nên nếu quy tắc ấy sai thì
// mọi học viên gõ gì cũng mất.
//
// Mười một phép ĐỐI CHỨNG:
//   1. Ứng dụng THẬT SỰ nạp được (bài học "không lỗi JS trên một trang chưa
//      hề nạp" — CLAUDE.md, mục Tư liệu gắn vào buổi học).
//   2. Thẻ "Trợ lý KHKD" hiện ở tab Bài, có nút mở phiên.
//   3. Phiên gieo sẵn hiện trong danh sách, bấm "mở lại" mở đúng phiên.
//   4. Bong bóng đúng hai vai: .tlbb.toi (người) và .tlbb.tl (trợ lý).
//   5. XSS: bốn ca độc trong câu trả lời của trợ lý đều KHÔNG chạy.
//   6. …mà cũng KHÔNG bị xoá mất — chuỗi độc còn nguyên trong .textContent.
//      Thiếu vế này thì một hàm chỉ biết cắt thẻ cũng "đậu".
//   7. Markdown thuận vẫn render: **đậm**, gạch đầu dòng, URL dán thẳng.
//   8. `.tlbox` có thanh cuộn RIÊNG (scrollHeight > clientHeight). Không có
//      thì `box.scrollTop = box.scrollHeight` là lệnh rỗng, câu vừa gửi nằm
//      ngoài tầm nhìn, và học viên tưởng gửi hỏng.
//   9. Bong bóng người dùng KHÔNG mang cặp màu --go-bg/--go. Cặp ấy trong sản
//      phẩm này có đúng MỘT nghĩa: người thu đã nhận tiền (CLAUDE.md).
//  10. GỬI HỎNG THÌ Ô NHẬP GIỮ NGUYÊN CHỮ, nút Gửi bật lại, và chỗ giữ chỗ
//      "Trợ lý đang nghĩ…" biến mất.
//  11. Câu báo lỗi KÈM TÊN BƯỚC HỎNG (errTroLy) — "Không xong, thử lại" thì
//      người dùng không nói lại được gì cho tôi, mà log Worker đã từng câm cả
//      ngày (CLAUDE.md).
// Cộng hai phép ở sheet phần bài: nút "Hỏi trợ lý về phần này" có mặt, và tab
// Bài không bày nút nào khi trợ lý tắt (kiểm ở lượt chạy `tat`).
//
// Chạy:  bash scripts/kiem/reset-tro-ly.sh      &&  node scripts/kiem/pw-tro-ly.mjs
//        bash scripts/kiem/reset-tro-ly.sh tat  &&  node scripts/kiem/pw-tro-ly.mjs tat

import { chromium } from 'playwright-core';

const TAT = process.argv[2] === 'tat';
let hong = 0;
const ok = (t, d) => { console.log((d ? '  ✓ ' : '  ✗ ') + t); if (!d) hong++; };
const B = 'http://127.0.0.1:8787';

const b = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'],
});
const c = await b.newContext({ viewport: { width: 390, height: 1100 }, deviceScaleFactor: 2 });
await c.addCookies([{ name: 's', value: 'tk-cuong-troly', domain: '127.0.0.1', path: '/' }]);
const p = await c.newPage();
const loi = []; p.on('pageerror', e => loi.push(e.message));

await p.goto(B + '/#/bai'); await p.waitForTimeout(2600);

console.log('── Ứng dụng có thật sự nạp được không ──');
ok('có thanh tab (ứng dụng nạp thật, không phải JSON)', await p.locator('.nb[data-v="bai"]').count() === 1);
ok('không lỗi JS: ' + (loi.join(' | ') || 'sạch'), loi.length === 0);

if (TAT) {
  // Lượt chạy `tat`: công tắc trong D1 đã về 0, /api/tro-ly trả bat = false.
  // Giao diện phải ẩn HẲN cả thẻ lẫn nút trong sheet phần bài — bày ra một
  // nút bấm vào là 503 thì tệ hơn không có nút.
  console.log('\n── Trợ lý đang TẮT: giao diện phải ẩn hẳn, không bày nút chết ──');
  ok('không có mục "Trợ lý KHKD" ở tab Bài', await p.getByText('Trợ lý KHKD', { exact: true }).count() === 0);
  ok('không có nút mở phiên', await p.locator('#tlMo').count() === 0);
  await p.locator('#v-bai .pt').nth(1).click(); await p.waitForTimeout(900);
  ok('sheet phần bài KHÔNG có nút "Hỏi trợ lý về phần này"', await p.locator('#sTroLy').count() === 0);
  ok('nhưng nút "+ Gắn tư liệu cho phần này" vẫn còn (tắt trợ lý không làm hỏng việc khác)',
    await p.locator('#sAddLink').count() === 1);
  ok('không lỗi JS: ' + (loi.join(' | ') || 'sạch'), loi.length === 0);
  await p.screenshot({ path: 'troly-tat.png' });
  await b.close();
  console.log(hong ? `\n${hong} phép HỎNG` : '\nTất cả phép đối chứng đều xanh');
  process.exit(hong ? 1 : 0);
}

console.log('\n── Thẻ Trợ lý KHKD ở tab Bài ──');
ok('có mục "Trợ lý KHKD"', await p.getByText('Trợ lý KHKD', { exact: true }).count() > 0);
ok('có nút mở phiên (#tlMo)', await p.locator('#tlMo').count() === 1);
const nutCu = p.locator('#v-bai [data-tlphien]');
ok(`có nút "mở lại" cho phiên gieo sẵn (${await nutCu.count()})`, await nutCu.count() >= 1);
ok('danh sách phiên ghi rõ tên người mở và số lượt',
  (await p.locator('#v-bai .fd').first().innerText()).includes('lượt'));

console.log('\n── Mở lại phiên gieo sẵn: bong bóng hai vai ──');
// Chọn ĐÚNG phiên gắn phần bài theo tiêu đề, không bấm "cái đầu tiên": thứ tự
// danh sách là theo updated_at nên nó đổi tuỳ bộ kiểm nào vừa chạy. Bản đầu
// bấm bừa và chết bằng một cú Playwright timeout 30 giây không nói được gì.
const dongPhien = p.locator('#v-bai .fd').filter({ hasText: 'KIEMTL_Phần 2 gieo sẵn' });
ok('tìm được đúng phiên gieo sẵn theo tiêu đề', await dongPhien.count() === 1);
await dongPhien.locator('[data-tlphien]').click();
await p.waitForTimeout(1200);
ok('sheet hội thoại mở ra, có khung .tlbox', await p.locator('#tlBox').count() === 1);
if (await p.locator('#tlIn').count() === 0) {
  console.log('  ✗ phiên gieo sẵn đã bị ĐÓNG — chạy lại reset-tro-ly.sh trước bộ kiểm này');
  await b.close(); process.exit(1);
}
ok('có đúng 1 bong bóng của NGƯỜI (.tlbb.toi)', await p.locator('#tlBox .tlbb.toi').count() === 1);
ok('có đúng 1 bong bóng của TRỢ LÝ (.tlbb.tl)', await p.locator('#tlBox .tlbb.tl').count() === 1);
ok('câu trả lời của trợ lý đi qua mdview (mdSafe), không phải text thuần',
  await p.locator('#tlBox .tlbb.tl .mdview.nho').count() === 1);

console.log('\n── ĐỐI CHỨNG XSS: câu trả lời của trợ lý là chữ của MỘT HỆ THỐNG NGOÀI ──');
// Kích mouseover trên mọi thẻ <a> trong hội thoại: mã độc nấp trong thuộc
// tính sự kiện chỉ nổ khi có người rê chuột qua — không kích thì phép kiểm
// xanh mà chẳng chứng minh được gì (bài học của pw-tulieu-text.mjs).
const kq = await p.evaluate(() => {
  const box = document.getElementById('tlBox');
  box.querySelectorAll('a').forEach(a => a.dispatchEvent(new MouseEvent('mouseover', { bubbles: true })));
  box.querySelectorAll('img').forEach(i => i.dispatchEvent(new Event('error')));
  return { html: box.innerHTML, text: box.textContent };
});
const chay = await p.evaluate(() => !!(window.__xss_troly || window.__xss_troly2));
ok('không một ca độc nào chạy được (window.__xss_troly* vẫn trống)', !chay);
ok('không có thẻ <script> THẬT trong hội thoại', !/<script[\s>]/i.test(kq.html));
ok('không có thẻ <img> THẬT trong hội thoại', !/<img[\s>]/i.test(kq.html));
ok('không có href="javascript:" nào', !/href\s*=\s*"javascript:/i.test(kq.html));
// Vế thứ hai, quan trọng ngang vế đầu: bị VÔ HIỆU HOÁ, không phải bị XOÁ MẤT.
ok('chuỗi <script> vẫn còn nguyên trong .textContent (vô hiệu hoá, KHÔNG xoá mất)',
  kq.text.includes('<script>') && kq.text.includes('window.__xss_troly2=1'));
ok('chuỗi <img … onerror=…> vẫn còn nguyên trong .textContent',
  kq.text.includes('onerror=') && kq.text.includes('<img src=x'));

console.log('\n── Markdown thuận vẫn render (chặn XSS mà không chặn nhầm markdown) ──');
ok('#### → thẻ tiêu đề', /<h[456][\s>]/i.test(kq.html));
ok('**chưa có** → <b>', kq.html.includes('<b>chưa có</b>'));
ok('gạch đầu dòng → <ul><li>', /<ul><li>/.test(kq.html));
ok('URL dán thẳng thành thẻ <a> bấm được (href đủ, nhãn rút gọn)',
  kq.html.includes('href="https://www.gso.gov.vn/so-lieu-thong-ke-chinh-thuc-nam-2025"') && kq.html.includes('…'));

// Ảnh chụp bản SẠCH, trước khi nhồi bong bóng độn ở phép dưới. Mấy lỗi đắt
// nhất của dự án này chỉ lộ ra khi NHÌN (CLAUDE.md nhắc ba lần) — phép kiểm
// chuỗi không thấy chữ đè lên nhau hay thẻ tràn mép.
await p.screenshot({ path: 'troly-hoithoai.png' });

console.log('\n── CSS: khung hội thoại và bảng màu ──');
const css = await p.evaluate(() => {
  const box = document.getElementById('tlBox');
  const toi = box.querySelector('.tlbb.toi');
  // Nhồi thêm bong bóng để chắc chắn nội dung vượt chiều cao khung — phép
  // kiểm phải hỏi "khung CÓ cuộn được không", không phải "hôm nay có đủ chữ
  // để tràn không".
  for (let i = 0; i < 30; i++) {
    const d = document.createElement('div');
    d.className = 'tlbb tl'; d.textContent = 'dòng độn ' + i;
    box.appendChild(d);
  }
  const s = getComputedStyle(box);
  return {
    cuonDuoc: box.scrollHeight > box.clientHeight,
    overflowY: s.overflowY,
    overscroll: s.overscrollBehaviorY,
    nenToi: getComputedStyle(toi).backgroundColor,
  };
});
// Dọn bong bóng độn ngay: ảnh chụp ở cuối tệp phải là màn hình THẬT, không
// phải màn hình có 30 dòng rác của chính bộ kiểm.
await p.evaluate(() => document.querySelectorAll('#tlBox .tlbb.tl').forEach(
  (e, i) => { if (i > 0) e.remove(); }));
ok(`.tlbox có thanh cuộn riêng (overflow-y: ${css.overflowY}) — không có thì lệnh tự cuộn xuống cuối là lệnh rỗng`,
  css.cuonDuoc && css.overflowY !== 'visible');
ok(`.tlbox có overscroll-behavior (${css.overscroll}) — cuộn hết hội thoại thì DỪNG, không kéo lây cả sheet`,
  css.overscroll === 'contain' || css.overscroll === 'none');
// --go-bg là #E4F0EB = rgb(228, 240, 235). Cặp --go-bg/--go có đúng MỘT nghĩa
// trong sản phẩm này: người thu đã nhận tiền.
ok(`bong bóng người dùng KHÔNG dùng màu "đã nhận tiền" (${css.nenToi})`,
  !css.nenToi.replace(/\s/g, '').includes('228,240,235'));

console.log('\n── Gửi hỏng: ô nhập PHẢI giữ nguyên chữ ──');
const CAU = 'Quy mô thị trường Hà Nội khoảng 1,2 triệu người theo Tổng cục Thống kê 2025.';
await p.fill('#tlIn', CAU);
await p.click('#tlGui');
ok('trong lúc chờ có chỗ giữ chỗ "Trợ lý đang nghĩ…"', await p.locator('#tlCho').count() === 1);
await p.waitForTimeout(2500);
ok('gọi hỏng xong thì chỗ giữ chỗ biến mất', await p.locator('#tlCho').count() === 0);
ok('Ô NHẬP GIỮ NGUYÊN CHỮ VỪA GÕ (chỉ xoá SAU khi máy chủ nhận xong)',
  (await p.inputValue('#tlIn')) === CAU);
ok('nút Gửi bật lại, không kẹt ở "Đang hỏi…"',
  !(await p.locator('#tlGui').isDisabled()) && (await p.locator('#tlGui').innerText()).includes('Gửi'));
const chuToast = await p.locator('#toast').innerText();
ok(`câu báo lỗi KÈM tên bước hỏng: "${chuToast}"`, /hỏng ở bước/.test(chuToast));

await p.screenshot({ path: 'troly-guihong.png' });

console.log('\n── Sheet một phần bài có lối vào trợ lý ──');
await p.locator('#tlDong').click(); await p.waitForTimeout(500);
await p.locator('#v-bai .pt').nth(1).click(); await p.waitForTimeout(900);
ok('sheet phần bài có nút "Hỏi trợ lý về phần này"', await p.locator('#sTroLy').count() === 1);
ok('yêu cầu của phần hiện nguyên văn giảng viên (không còn bản tóm tắt một dòng)',
  (await p.locator('#sheet .sub').first().innerText()).length > 120);

ok('không lỗi JS suốt cả lượt: ' + (loi.join(' | ') || 'sạch'), loi.length === 0);
await p.screenshot({ path: 'troly-phanbai.png' });
await b.close();

console.log(hong ? `\n${hong} phép HỎNG` : '\nTất cả phép đối chứng đều xanh');
process.exit(hong ? 1 : 0);
