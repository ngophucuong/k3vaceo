// An toàn của mdSafe() (public/app.js) — hàm render Markdown cho ô "Nội dung
// Text" của Tư liệu. Đây là phép kiểm ĐÁNG GIÁ NHẤT của cả tính năng: một ghi
// chú Text bây giờ là VĂN BẢN CHẠY THẲNG VÀO innerHTML của mọi người trong
// lớp đọc nó — sai một chỗ escape là 134 người dính XSS lưu trữ qua đúng chỗ
// trước đây chỉ nhận URL.
//
// Phải chạy bằng trình duyệt thật vì mdSafe() sống trong app.js (mã phía
// trình duyệt), không phải mã máy chủ — không cách nào gọi nó từ Node thuần.
//
// Bốn ca ĐỘC đều phải: (a) không cho __X* chạy, và (b) chuỗi độc vẫn còn
// nguyên trong .textContent — chứng minh nó bị VÔ HIỆU HOÁ chứ không phải bị
// ÂM THẦM XOÁ MẤT (một hàm chỉ biết .replace(/<[^>]*>/g,'') cũng "an toàn"
// theo nghĩa không chạy mã, nhưng nó xoá luôn nội dung hợp lệ có dấu < > —
// mdSafe() không được phép làm vậy).
//
// Phần đầu (mdSafe) không cần đăng nhập. Phần cuối (giao diện gắn Tư liệu
// dạng Text từ đầu tới cuối) cần phiên của Ngô Phú Cường — chạy
// reset-tulieu-text.sh trước để có phiên đó và dọn sạch dữ liệu thử cũ.
//
// Chạy:  bash scripts/kiem/reset-tulieu-text.sh  &&  node scripts/kiem/pw-tulieu-text.mjs

import { chromium } from 'playwright-core';

let hong = 0;
const ok = (t, d) => { console.log((d ? '  ✓ ' : '  ✗ ') + t); if (!d) hong++; };
const B = 'http://127.0.0.1:8787';

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const p = await (await b.newContext()).newPage();
const loi = []; p.on('pageerror', e => loi.push(e.message));
await p.goto(B + '/'); await p.waitForTimeout(1500);

console.log('── Ứng dụng có thật sự nạp được, và mdSafe() có tồn tại không ──');
ok('mdSafe là một hàm toàn cục', await p.evaluate(() => typeof window.mdSafe === 'function'));
ok('không lỗi JS khi nạp trang: ' + (loi.join(' | ') || 'sạch'), loi.length === 0);

// Đưa một chuỗi Markdown qua mdSafe(), gắn kết quả vào DOM thật (không chỉ
// đọc chuỗi HTML trả về) — chỉ có cách này mới biết chắc trình duyệt có THỰC
// SỰ THI HÀNH mã độc hay không, thay vì đoán qua việc có chữ "<script" trong
// chuỗi hay không.
async function thuMD(md) {
  return p.evaluate((md) => {
    let el = document.getElementById('xss-scratch');
    if (!el) { el = document.createElement('div'); el.id = 'xss-scratch'; document.body.appendChild(el); }
    window.__X1 = window.__X2 = window.__X3 = window.__X4 = undefined;
    window.__X5 = window.__X6 = undefined;
    el.innerHTML = window.mdSafe(md);
    // Bốn ca độc đầu chạy ngay lúc gắn vào DOM. Ca dán-thẳng (__X5) lại nấp
    // trong một thuộc tính sự kiện, chỉ nổ khi có người rê chuột qua — nên
    // phải KÍCH nó, không thì phép kiểm xanh mà chẳng chứng minh được gì.
    el.querySelectorAll('a').forEach(a => a.dispatchEvent(
      new MouseEvent('mouseover', { bubbles: true })));
    return {
      html: el.innerHTML,
      text: el.textContent,
      xChay: !!(window.__X1 || window.__X2 || window.__X3 || window.__X4
             || window.__X5 || window.__X6),
    };
  }, md);
}

console.log('── ĐỐI CHỨNG: bốn kiểu chèn mã đều bị vô hiệu, không bị xoá mất ──');

const kq1 = await thuMD('Xem: <script>window.__X1=1</script> hết.');
ok('thẻ <script> KHÔNG chạy', !kq1.xChay);
ok('vẫn còn nguyên chữ (bị vô hiệu, không bị xoá)', kq1.text.includes('<script>window.__X1=1</script>'));
ok('HTML trả về không có thẻ <script> thật', !/<script[\s>]/i.test(kq1.html));

const kq2 = await thuMD('**đậm** <img src=x onerror="window.__X2=1"> chữ');
ok('onerror của <img> KHÔNG chạy', !kq2.xChay);
ok('markdown hợp lệ TRƯỚC đoạn độc vẫn render đúng (<b>đậm</b>)', kq2.html.includes('<b>đậm</b>'));
ok('không có thẻ <img> thật trong HTML trả về', !/<img[\s>]/i.test(kq2.html));

const kq3 = await thuMD('[bấm vào](javascript:window.__X3=1)');
ok('link javascript: KHÔNG chạy', !kq3.xChay);
// Chỉ cấm href="javascript:..." — chuỗi "javascript:" vẫn được PHÉP xuất hiện
// dưới dạng CHỮ THƯỜNG (đúng như dòng kiểm ngay dưới đây xác nhận), miễn là
// nó không bao giờ lọt vào một thuộc tính href thật.
ok('không tạo href="javascript:..." nào', !/href\s*=\s*"javascript:/i.test(kq3.html));
ok('cú pháp link với scheme không phải https giữ nguyên dạng chữ thô',
   kq3.text.includes('[bấm vào](javascript:window.__X3=1)'));

const kq4 = await thuMD('[a" onmouseover="window.__X4=1](https://x.example.com)');
ok('chèn thuộc tính qua CHỮ của link KHÔNG chạy', !kq4.xChay);
ok('href vẫn đúng, không bị cắt ngang bởi dấu ngoặc kép giả',
   kq4.html.includes('href="https://x.example.com"'));

console.log('── Đối chứng NGƯỢC: markdown hợp lệ vẫn render đúng, không bị vạ lây ──');
const hop1 = await thuMD('# Chào các bạn');
ok('# → <h4>', hop1.html.includes('<h4>Chào các bạn</h4>'));

const hop2 = await thuMD('**đậm** và *nghiêng*');
ok('**...** → <b>, *...* → <i> (không nuốt nhau)',
   hop2.html.includes('<b>đậm</b>') && hop2.html.includes('<i>nghiêng</i>'));

const hop3 = await thuMD('- một\n- hai');
ok('danh sách - → <ul><li>', hop3.html.includes('<ul><li>một</li><li>hai</li></ul>'));

const hop4 = await thuMD('[trang chủ](https://example.com)');
ok('link https hợp lệ vẫn ra thẻ <a> mở tab mới',
   hop4.html.includes('href="https://example.com"') && hop4.html.includes('target="_blank"'));

/* ── URL DÁN THẲNG (thêm 5/9) ────────────────────────────────────────────────
   Ngô Phú Cường gửi ảnh một thông báo có dán nguyên si đường dẫn Outline dài
   66 ký tự: đọc được mà bấm không được. Không ai gõ cú pháp [chữ](url) khi
   dán link, nên mdSafe() phải tự nhận. Đây là chỗ dễ mở lại lỗ XSS nhất
   trong cả hàm, vì nó là quy tắc DUY NHẤT dựng thuộc tính href từ chữ người
   dùng gõ mà KHÔNG có cú pháp bao quanh làm hàng rào. */
const dan1 = await thuMD('Chi tiết: https://outline.cuongngo.app/s/5e30f127-59a7-472f-aa03-abae19f2d8c2');
ok('URL dán thẳng thành thẻ <a> bấm được',
   dan1.html.includes('href="https://outline.cuongngo.app/s/5e30f127-59a7-472f-aa03-abae19f2d8c2"'));
ok('nhãn hiện ra được rút gọn, không tràn thẻ (có dấu …)', dan1.html.includes('…'));
ok('bỏ tiền tố https:// khỏi nhãn cho gọn', dan1.text.includes('outline.cuongngo.app/s/'));

// Dấu chấm cuối câu KHÔNG được nuốt vào link, nếu không thì bấm ra 404.
const dan2 = await thuMD('Xem tại https://vi.wikipedia.org/wiki/VCCI.');
ok('dấu câu cuối câu nằm NGOÀI href',
   dan2.html.includes('href="https://vi.wikipedia.org/wiki/VCCI"') && dan2.text.trim().endsWith('.'));

// Cú pháp [chữ](url) và URL dán thẳng ĐỨNG CẠNH NHAU: bước tự nhận URL chạy
// SAU, nên nếu thẻ <a> vừa dựng còn nằm trong chuỗi thì nó tóm luôn địa chỉ
// trong href rồi lồng <a> vào giữa <a> — HTML hỏng, link bấm ra chỗ khác.
const dan3 = await thuMD('[trang](https://a.example.com) và https://b.example.com');
ok('không lồng thẻ <a> vào trong thẻ <a>', !/<a[^>]*>[^<]*<a/i.test(dan3.html));
ok('cả hai link đều còn đúng địa chỉ',
   dan3.html.includes('href="https://a.example.com"') && dan3.html.includes('href="https://b.example.com"'));

// Ca ĐỘC của riêng đường dán thẳng: nhét dấu nháy kép vào giữa URL để thử
// thoát ra khỏi thuộc tính href. esc() đã đổi " thành &quot; TRƯỚC khi quy
// tắc này chạy, nên nó nằm yên trong giá trị thuộc tính chứ không cắt được.
const dan4 = await thuMD('https://x.example.com/a"onmouseover="window.__X5=1');
ok('URL có dấu nháy kép KHÔNG thoát ra được khỏi href', !dan4.xChay);
ok('không sinh thuộc tính onmouseover thật', !/\sonmouseover\s*=/i.test(dan4.html));

// javascript: dán thẳng phải trơ như cũ — quy tắc mới chỉ bắt https://.
const dan5 = await thuMD('javascript:window.__X6=1');
ok('javascript: dán thẳng KHÔNG thành link', !dan5.html.includes('<a '));

await p.screenshot({ path: 'mdsafe-scratch.png' });
await b.close();

console.log('── Giao diện: gắn một ghi chú Text từ đầu tới cuối ──');
const b2 = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const c2 = await b2.newContext({ viewport: { width: 390, height: 1100 }, deviceScaleFactor: 2 });
await c2.addCookies([{ name: 's', value: 'tk-cuong-tulieu-text', domain: '127.0.0.1', path: '/' }]);
const p2 = await c2.newPage();
const loi2 = []; p2.on('pageerror', e => loi2.push(e.message));
await p2.goto(B + '/#/kho'); await p2.waitForTimeout(2200);
ok('ứng dụng thật sự nạp được (có thanh tab)', await p2.locator('.nb[data-v="kho"]').count() === 1);
ok('không lỗi JS: ' + (loi2.join(' | ') || 'sạch'), loi2.length === 0);

await p2.click('#addLinkBtn'); await p2.waitForTimeout(700);
ok('mặc định mở ở chế độ Đường dẫn', await p2.locator('#modeUrlBox').isVisible());
// ĐỐI CHỨNG: ô "Thuộc buổi học nào" phải liệt kê CẢ buổi đã qua, không chỉ 6
// buổi sắp tới của /api/home — thứ mà "Nội dung Text" sinh ra để làm chính là
// ghi lại tóm tắt MỘT BUỔI ĐÃ HỌC XONG. oChonBuoi() từng đọc HOME.lich_hoc,
// khiến bấm "Gắn Tư liệu" cho một buổi hôm qua trở về trước là bó tay — lỗi
// Ngô Phú Cường gặp thật ngày 5/9 khi buổi 4/9 đã rơi khỏi 6 buổi sắp tới.
const oBuoi = await p2.locator('#lB option').allTextContents();
ok('ô chọn buổi CÓ buổi đã qua (không chỉ 6 buổi sắp tới của /api/home)',
   oBuoi.some(o => o.includes('4/9')));
await p2.click('#modeText'); await p2.waitForTimeout(200);
ok('bấm "Nội dung Text" thì ẩn ô đường dẫn, hiện ô nội dung',
   !(await p2.locator('#modeUrlBox').isVisible()) && await p2.locator('#modeTextBox').isVisible());

const TIEU_DE = 'KIEMTULIEU_giaodien';
await p2.fill('#lC', '# Tiêu đề UI\n\nMột **đoạn kiểm thử** giao diện.');
await p2.fill('#lN', TIEU_DE);
await p2.click('#lSave'); await p2.waitForTimeout(700);
ok('sheet đóng lại sau khi lưu (lưu thành công)', !(await p2.locator('#lSave').isVisible().catch(() => false)));
ok('mục mới hiện trong danh sách Tư liệu', await p2.getByText(TIEU_DE).count() > 0);

// Tìm TRONG tab Tư liệu, không tìm cả trang. Bước dọn dẹp ở cuối tệp này ghi
// một dòng nhật ký `gỡ liên kết "KIEMTULIEU_giaodien"`, và dòng ấy hiện lại ở
// DÒNG HOẠT ĐỘNG của tab Hôm nay trong LƯỢT CHẠY SAU — đang ẩn vì tab khác
// đang mở. getByText() không giới hạn phạm vi sẽ tóm đúng cái ẩn đó rồi chờ
// mãi cho nó hiện ra. Đây là đúng cái bẫy "bộ kiểm phải chạy lại được nhiều
// lần" đã ghi trong README (phép đối chứng số 3), lần này tự cắn vào chính
// mình qua một đường vòng: nhật ký, không phải dữ liệu.
await p2.locator('#v-kho').getByText(TIEU_DE).first().click(); await p2.waitForTimeout(500);
ok('bấm vào mở sheet xem nội dung, render đúng Markdown',
   (await p2.locator('.mdview h4').innerText().catch(() => '')) === 'Tiêu đề UI');
ok('không lỗi JS sau khi mở sheet xem: ' + (loi2.join(' | ') || 'sạch'), loi2.length === 0);
await p2.screenshot({ path: 'tulieu-text-ui.png' });
await b2.close();

// Dọn dẹp mục vừa tạo qua giao diện — không để rác lại cho lần chạy sau.
const doc = await fetch(`${B}/api/links`, { headers: { cookie: 's=tk-cuong-tulieu-text' } }).then(r => r.json());
const rac = doc.links.find(r => r.title === TIEU_DE);
if (rac) await fetch(`${B}/api/links/${rac.id}`, { method: 'DELETE', headers: { cookie: 's=tk-cuong-tulieu-text' } });

console.log(`\n${hong ? `✗ ${hong} phép kiểm đỏ` : '✓ tất cả xanh'}`);
process.exit(hong ? 1 : 0);
