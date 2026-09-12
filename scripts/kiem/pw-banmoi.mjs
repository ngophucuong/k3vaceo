// Băng "Có bản mới" và phép soi bản lúc mở trang (public/app.js).
//
// VÌ SAO BỘ KIỂM NÀY ĐÁNG CÓ RIÊNG: `soiBanLucMo()` chạy trong `boot()` — đường
// khởi động của MỌI người dùng — và nó gọi `location.reload()`. Sai một chốt là
// 146 người rơi vào vòng tải lại vô hạn và không ai vào được ứng dụng. Đây là
// thay đổi rủi ro nhất từng đụng vào tệp app.js, nên phép kiểm phải ĐẾM SỐ LẦN
// TẢI LẠI chứ không chỉ hỏi "có vào được không".
//
// Lỗ hổng được vá (tra ra 12/9, có từ 25/8): băng "Có bản mới" CHỈ hiện khi số
// hiệu bản đổi GIỮA CHỪNG, tức app phải đang mở sẵn lúc deploy. Mở trang mới
// thì `boot()` gán thẳng `BAN_LUC_MO = HOME.ban` nên không bao giờ lệch —
// "đóng app rồi mở lại", việc ai cũng nghĩ tới đầu tiên, là việc DUY NHẤT
// không có tác dụng.
//
// Sáu phép ĐỐI CHỨNG:
//   1. Ứng dụng THẬT SỰ nạp được (bài học "không lỗi JS trên trang chưa nạp").
//   2. Mở lần ĐẦU trên máy trắng: KHÔNG tải lại, chỉ ghi số hiệu vào sổ. Người
//      mở lần đầu vốn đã có mã mới nhất — tải lại là phí một vòng mạng cho
//      mỗi người dùng mới.
//   3. Mở lại khi số hiệu KHÔNG đổi: KHÔNG tải lại. Đây là ca thường ngày,
//      chạy vài trăm lần mỗi ngày; tải lại ở đây là hỏng to.
//   4. Sổ ghi số hiệu CŨ (giả lập vừa deploy xong): BĂNG HIỆN RA, và tuyệt
//      đối KHÔNG tự tải lại — người dùng bấm hay không là quyền họ.
//   5. Sổ KHÔNG bị cập nhật khi chưa bấm băng: mở lại lần nữa băng vẫn hiện.
//      Cập nhật sớm thì băng biến mất trong khi người ta vẫn đang chạy mã cũ.
//   6. localStorage bị chặn (duyệt riêng tư): không băng, không tải lại, ứng
//      dụng vẫn chạy bình thường. Thà chạy mã cũ còn hơn kẹt ngoài cửa.
//
// MỘT CHỖ MÔI TRƯỜNG NÀY KHÔNG KIỂM ĐƯỢC, nói thẳng ra: `location.reload()`
// chạy với `wrangler dev` + khối [assets] để lại MỘT TRANG TRẮNG — thẻ
// `<script src="/app.js">` của tài liệu mới không chạy (`typeof window.mdSafe`
// là undefined). Đo bằng phép đối chứng: `location.reload()` TRẦN, không kèm
// fetch gì, cũng trắng y hệt — nên đây là giới hạn của máy chủ dev, không
// phải lỗi mã. Băng này đã chạy thật trên tên miền (chính Ngô Phú Cường dùng
// nó để cập nhật). Vì vậy bộ kiểm chỉ khẳng định tới chỗ BẤM ĐƯỢC và ĐÚNG MỘT
// lượt điều hướng; "sau khi tải lại thì màn vẽ lại đẹp" phải nghiệm thu trên
// tên miền thật.
//
// Chạy:  bash scripts/kiem/reset-tro-ly.sh  &&  node scripts/kiem/pw-banmoi.mjs
//        (mượn phiên Ngô Phú Cường của reset-tro-ly.sh, không cần fixture riêng)

import { chromium } from 'playwright-core';

let hong = 0;
const ok = (t, d) => { console.log((d ? '  ✓ ' : '  ✗ ') + t); if (!d) hong++; };
const B = 'http://127.0.0.1:8787';
const KHOA = 'k3_ban_da_chay';

const b = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'],
});
const c = await b.newContext({ viewport: { width: 390, height: 900 } });
await c.addCookies([{ name: 's', value: 'tk-cuong-troly', domain: '127.0.0.1', path: '/' }]);
const p = await c.newPage();
const loi = []; p.on('pageerror', e => loi.push(e.message));

/* ĐẾM LƯỢT NẠP BẰNG sessionStorage, KHÔNG BẰNG `page.on('load')`.
   Bản đầu của bộ kiểm này dùng `p.on('load')` và đọc ra 0 lượt ở đúng ba ca
   quan trọng nhất — trông y như mã không tải lại. Đo lại bằng một dấu đặt vào
   `window` thì thấy nó BIẾN MẤT sau `location.reload()`, tức trang ĐÃ tải lại
   thật; chỉ là Playwright ở đây không bắn `load` cho lượt điều hướng ấy (chỉ
   bắn `framenavigated`). Suýt nữa thì tôi đi sửa một đoạn mã vốn đã đúng.
   `addInitScript` chạy lại ở MỌI lượt nạp tài liệu, kể cả reload, và
   sessionStorage sống qua reload trong cùng một tab — nên đây là phép đo trực
   tiếp, không phụ thuộc sự kiện nào của Playwright. */
const DEM = '__nap_tai_lieu';
const gan = async (pg) => pg.addInitScript((k) => {
  try { sessionStorage.setItem(k, String(Number(sessionStorage.getItem(k) || 0) + 1)); } catch { /* kệ */ }
}, DEM);
const demNap = (pg) => pg.evaluate(k => Number(sessionStorage.getItem(k) || 0), DEM);
const xoaDem = (pg) => pg.evaluate(k => { try { sessionStorage.setItem(k, '0'); } catch { /* kệ */ } }, DEM);
await gan(p);
let soLanNap = 0;

const doc = () => p.evaluate(k => { try { return localStorage.getItem(k); } catch { return '__CHAN__'; } }, KHOA);

console.log('── 1. Mở lần ĐẦU trên máy trắng ──');
await p.goto(B + '/#/nay'); await p.waitForTimeout(3000);
soLanNap = await demNap(p);
ok('ứng dụng nạp được (có thanh tab)', await p.locator('.nb[data-v="nay"]').count() === 1);
ok('không lỗi JS: ' + (loi.join(' | ') || 'sạch'), loi.length === 0);
ok(`chỉ nạp đúng 1 lần, KHÔNG tự tải lại (${soLanNap})`, soLanNap === 1);
ok('KHÔNG hiện băng (máy mới vốn đã có mã mới nhất)', await p.locator('#banmoi').count() === 0);

const ban = await doc();
// COMMIT_SHA không đặt ở máy cục bộ thì /api/home trả ban = null và phép soi
// thoát ngay — bộ kiểm sẽ xanh mà chẳng chứng minh được gì. Chặn ở đây.
if (!ban || ban === '__CHAN__') {
  console.log(`  ✗ sổ localStorage rỗng (ban = ${JSON.stringify(ban)}).`);
  console.log('    Đặt COMMIT_SHA=<gì đó> vào worker/.dev.vars rồi khởi động lại server.');
  await b.close(); process.exit(1);
}
ok(`sổ đã ghi số hiệu bản đang chạy (${ban.slice(0, 12)})`, true);

console.log('\n── 2. Mở lại khi số hiệu KHÔNG đổi (ca thường ngày) ──');
await xoaDem(p);
await p.reload(); await p.waitForTimeout(3000);
soLanNap = await demNap(p);
ok(`chỉ nạp đúng 1 lần, KHÔNG tải lại (${soLanNap})`, soLanNap === 1);
ok('vẫn KHÔNG hiện băng', await p.locator('#banmoi').count() === 0);
ok('sổ giữ nguyên số hiệu', await doc() === ban);

console.log('\n── 3. Sổ ghi số hiệu CŨ — giả lập "hôm sau mở app ra" ──');
await p.evaluate(k => localStorage.setItem(k, 'ban-cu-tu-hom-qua'), KHOA);
await xoaDem(p);
await p.reload(); await p.waitForTimeout(4000);
soLanNap = await demNap(p);
ok('BĂNG HIỆN RA — đây là cái lỗ vừa vá', await p.locator('#banmoi').count() === 1);
ok(`KHÔNG tự tải lại, chỉ đúng 1 lượt nạp (${soLanNap})`, soLanNap === 1);
ok('ứng dụng vẫn vẽ bình thường phía dưới băng',
  await p.locator('.nb[data-v="nay"]').count() === 1);

console.log('\n── 4. Chưa bấm băng thì sổ KHÔNG được cập nhật ──');
ok('sổ vẫn là số hiệu cũ (người dùng vẫn đang chạy mã cũ)',
  await doc() === 'ban-cu-tu-hom-qua');
await xoaDem(p);
await p.reload(); await p.waitForTimeout(4000);
ok('mở lại lần nữa băng VẪN hiện', await p.locator('#banmoi').count() === 1);
ok(`vẫn không tải lại (${await demNap(p)})`, await demNap(p) === 1);

console.log('\n── 5. Bấm băng: ghi sổ rồi mới điều hướng ──');
await xoaDem(p);
await p.click('#banmoi');
await p.waitForTimeout(6000);
soLanNap = await demNap(p);
// Bộ đếm vừa được xoá về 0 NGAY TRƯỚC cú bấm, nên 1 = đúng một lượt điều
// hướng do băng gây ra. (Bản đầu tôi viết 2 vì quên mất là đã xoá đếm — phép
// kiểm đỏ trong khi mã đúng.)
ok(`đúng MỘT lượt điều hướng, không lặp (${soLanNap})`, soLanNap === 1);
ok('sổ đã cập nhật sang số hiệu mới', await doc() === ban);
await xoaDem(p);
await p.waitForTimeout(5000);
ok(`đứng yên sau đó, không lặp (${await demNap(p)})`, await demNap(p) === 0);

console.log('\n── 6. localStorage bị chặn (duyệt riêng tư) ──');
const c2 = await b.newContext({ viewport: { width: 390, height: 900 } });
await c2.addCookies([{ name: 's', value: 'tk-cuong-troly', domain: '127.0.0.1', path: '/' }]);
const p2 = await c2.newPage();
const loi2 = []; p2.on('pageerror', e => loi2.push(e.message));
await gan(p2);
// Ném lỗi ở CẢ getItem lẫn setItem, đúng như Safari duyệt riêng tư từng làm.
await p2.addInitScript(() => {
  const chan = () => { throw new Error('localStorage bị chặn'); };
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    get: () => ({ getItem: chan, setItem: chan, removeItem: chan }),
  });
});
await p2.goto(B + '/#/nay'); await p2.waitForTimeout(4000);
const nap2 = await demNap(p2);
ok(`không tải lại (${nap2} lượt nạp)`, nap2 === 1);
ok('không hiện băng', await p2.locator('#banmoi').count() === 0);
ok('ứng dụng vẫn chạy bình thường', await p2.locator('.nb[data-v="nay"]').count() === 1);
ok('không lỗi JS lọt ra ngoài: ' + (loi2.join(' | ') || 'sạch'), loi2.length === 0);

await b.close();
console.log(hong ? `\n${hong} phép HỎNG` : '\nTất cả phép đối chứng đều xanh');
console.log('Nhắc lại: "sau khi tải lại thì màn vẽ lại đẹp" KHÔNG kiểm được ở đây — '
  + 'location.reload() với wrangler dev để lại trang trắng, kể cả khi gọi trần.');
process.exit(hong ? 1 : 0);
