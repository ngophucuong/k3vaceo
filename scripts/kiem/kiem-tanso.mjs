// Giới hạn tần suất: đếm LẦN ĐOÁN, không đếm NGƯỜI.
//
// Câu hỏi bộ kiểm này trả lời: cả lớp 134 người ngồi cùng một phòng, cùng một
// WiFi, cùng mở ứng dụng lên — thì đường vào có còn mở không?
//
// Trước 27/8 câu trả lời là KHÔNG. Mọi cửa vào đều khoá theo địa chỉ IP và
// tính cả lượt THÀNH CÔNG, mà sau NAT thì cả phòng chung đúng một địa chỉ.
// Người thứ 11 vào lần đầu, người thứ 21 đăng nhập bằng passkey hay bấm link
// mời, đều nhận 429 mà không hiểu vì sao.
//
// Chạy:  bash scripts/kiem/reset-tanso.sh  &&  node scripts/kiem/kiem-tanso.mjs
//
// Bốn phép ĐỐI CHỨNG ở cuối là thứ giữ cho bộ kiểm có răng: nới hạn mức ra thì
// mấy phép trên xanh hết, nên phải có phép chứng minh kẻ dò số VẪN chết nhanh.

import { readFileSync } from 'node:fs';

let hong = 0;
const ok = (t, d) => { console.log((d ? '  ✓ ' : '  ✗ ') + t); if (!d) hong++; };
const B = 'http://127.0.0.1:8787';

// Địa chỉ IP giả lập qua cf-connecting-ip — đúng thứ clientIp() đọc trên bản
// thật. Dùng dải tài liệu (RFC 5737) cho khỏi trùng địa chỉ thật.
const LOP = '203.0.113.7';        // WiFi hội trường: cả lớp chung một địa chỉ
const post = (p, body, ip = LOP, ck) => fetch(B + p, {
  method: 'POST',
  headers: {
    'content-type': 'application/json', 'cf-connecting-ip': ip,
    ...(ck ? { cookie: `s=${ck}` } : {}),
  },
  body: JSON.stringify(body),
});
const get = (p, ip = LOP) => fetch(B + p, { headers: { 'cf-connecting-ip': ip } });

// Danh sách gốc là dữ liệu cố định của migration 0002 nên chép thẳng vào đây
// được. Hai mươi người ĐẦU tiên có số điện thoại và chưa ai nhận hồ sơ.
const NGUOI = [
  [1, '0979755857'], [2, '0973836585'], [3, '0941416979'], [4, '0913030324'],
  [5, '0816271927'], [6, '0988507279'], [7, '0968469000'], [11, '0987739894'],
  [13, '0976911081'], [14, '0988393000'], [15, '0982174121'], [16, '0334906765'],
  [17, '0364006679'], [18, '0368186363'], [19, '0915171986'], [20, '0987421123'],
  [25, '0983742998'], [26, '0357277777'], [27, '0972182598'], [28, '0988754276'],
];
const NGUNG = 57;          // hồ sơ đã ngừng tham gia mà chưa kịp nhận (reset gieo)
const KHONG_SO = 8;        // Nguyễn Thanh Bình — danh sách gốc chưa có số

// ── 0. Ứng dụng có thật sự chạy không ────────────────────────────────────
// Điểm 2 trong scripts/kiem/README.md: đã có lần bộ kiểm báo "sạch" trên một
// máy chủ chưa hề chạy. Mọi khẳng định dưới đây vô nghĩa nếu chỗ này đỏ.
console.log('── Máy chủ có thật sự chạy không ──');
const health = await get('/api/health').then(r => r.json()).catch(() => ({}));
ok(`/api/health trả roster_total = ${health.roster_total} (134)`, health.roster_total === 134);
ok('bảng rate_events đã sạch (reset-tanso.sh đã chạy)',
   (await post('/api/onboard/check', { roster_id: NGUOI[0][0], phone: NGUOI[0][1] })).status === 200);

// ── 1. Cả lớp ngồi cùng một WiFi, vào lần đầu ────────────────────────────
console.log('\n── 20 người vào lần đầu từ MỘT địa chỉ IP ──');
let vaoDuoc = 0, khoaO = 0;
for (const [i, [rid, sdt]] of NGUOI.entries()) {
  const r = await post('/api/onboard/vao',
    { roster_id: rid, phone: sdt, email: `nguoi${rid}@kiemtra.vn` });
  if (r.status === 200) vaoDuoc++;
  else if (r.status === 429 && !khoaO) khoaO = i + 1;
}
ok(khoaO ? `KHOÁ OAN ở người thứ ${khoaO}` : 'không ai bị khoá oan', khoaO === 0);
ok(`${vaoDuoc}/${NGUOI.length} người vào được`, vaoDuoc === NGUOI.length);

// ── 1b. Ô tìm tên: bước đầu tiên của tất cả 134 người ────────────────────
// Mỗi người gõ tên mình ít nhất một lượt, nên hạn mức phải rộng hơn sĩ số lớp.
// Cũ là 60 — hết chỗ ở người thứ 61, trước cả khi ai kịp nhập số điện thoại.
console.log('\n── 150 lượt tìm tên từ MỘT địa chỉ IP ──');
let timOk = 0, timKhoa = 0;
for (let i = 0; i < 150; i++) {
  const r = await get('/api/wizard/roster/search?q=' + encodeURIComponent(['nguyen', 'tran', 'le'][i % 3]));
  if (r.status === 200) timOk++; else if (r.status === 429 && !timKhoa) timKhoa = i + 1;
}
ok(timKhoa ? `KHOÁ OAN ở lượt thứ ${timKhoa}` : 'không lượt nào bị khoá oan', timKhoa === 0);
ok(`${timOk}/150 lượt tìm được (sĩ số lớp là 134)`, timOk === 150);

// ── 2. Passkey: cả lớp mở màn đăng nhập cùng lúc ─────────────────────────
console.log('\n── 40 lượt mở màn đăng nhập bằng passkey từ MỘT địa chỉ IP ──');
let pkOk = 0, pkKhoa = 0;
for (let i = 0; i < 40; i++) {
  const r = await post('/api/passkey/login/options', {});
  if (r.status === 200) pkOk++; else if (r.status === 429 && !pkKhoa) pkKhoa = i + 1;
}
ok(pkKhoa ? `KHOÁ OAN ở lượt thứ ${pkKhoa}` : 'không lượt nào bị khoá oan', pkKhoa === 0);
ok(`${pkOk}/40 lượt xin được challenge`, pkOk === 40);

// ── 3. Link mời: cả lớp bấm link thật cùng lúc ───────────────────────────
console.log('\n── 30 lượt bấm link mời THẬT từ MỘT địa chỉ IP ──');
const moi = JSON.parse(readFileSync(new URL('./moi-tanso.json', import.meta.url), 'utf8'));
let moiOk = 0, moiKhoa = 0;
for (const [i, t] of moi.entries()) {
  const r = await get('/api/invite/' + t);
  if (r.status === 200) moiOk++; else if (r.status === 429 && !moiKhoa) moiKhoa = i + 1;
}
ok(moiKhoa ? `KHOÁ OAN ở lượt thứ ${moiKhoa}` : 'không lượt nào bị khoá oan', moiKhoa === 0);
ok(`${moiOk}/30 link mời đọc được`, moiOk === 30);

/* ══════════════════ ĐỐI CHỨNG ══════════════════════════════════════════
   Nới hạn mức ra thì ba phép trên xanh hết mà cửa an ninh thì mở toang. Bốn
   phép dưới đây chứng minh cửa VẪN đóng với kẻ dò — nếu chúng cũng xanh khi
   ta gỡ hết giới hạn đi thì bộ kiểm này không có răng. */

// ── 4. Dò số của MỘT người ───────────────────────────────────────────────
console.log('\n── ĐỐI CHỨNG: dò số điện thoại của một người ──');
const KE_DO = '198.51.100.9';
let doDuoc = 0;
for (let i = 0; i < 40; i++) {
  const r = await post('/api/onboard/vao',
    { roster_id: 30, phone: '09' + String(10000000 + i), email: 'ke.do@x.vn' }, KE_DO);
  if (r.status === 429) break;
  doDuoc++;
}
ok(`chặn sau ${doDuoc} lần đoán sai (phải ≤ 10)`, doDuoc <= 10);

// ── 5. /check và /vao phải dùng CHUNG hạn mức ────────────────────────────
// Hai đường soi cùng một bí mật. Mỗi đường một hạn mức riêng thì kẻ dò được
// gấp đôi số lần, chỉ bằng cách gọi xen kẽ.
console.log('\n── ĐỐI CHỨNG: /check và /vao không được cộng thêm lượt cho nhau ──');
const r5 = await post('/api/onboard/check', { roster_id: 30, phone: '0900000001' }, KE_DO);
ok(`/check cũng bị chặn ngay (${r5.status} = 429)`, r5.status === 429);

// ── 6. Quét rải trên nhiều người từ một địa chỉ ──────────────────────────
console.log('\n── ĐỐI CHỨNG: quét rải một lần mỗi người trên nhiều hồ sơ ──');
// Đếm lần ĐOÁN chứ không đếm vòng lặp: 44/134 người chưa có số nào trong danh
// sách gốc, gọi vào họ trả phone_missing_in_roster chứ không phải "sai số".
// Hồ sơ không có số thì chẳng có gì để đoán, nên không tính vào sổ là ĐÚNG —
// lần đầu viết phép kiểm này đếm cả vòng lặp rồi báo đỏ oan ở con số 47.
const KE_QUET = '198.51.100.22';
let doanSai = 0, hoSoDaCham = 0;
for (let rid = 60; rid < 134; rid++) {
  const r = await post('/api/onboard/vao',
    { roster_id: rid, phone: '0900000000', email: 'ke.quet@x.vn' }, KE_QUET);
  if (r.status === 429) break;
  hoSoDaCham++;
  if (r.status === 401) doanSai++;   // 401 = phone_mismatch, tức một lần đoán thật
}
ok(`chặn sau ${doanSai} lần đoán sai, trải trên ${hoSoDaCham} hồ sơ (phải ≤ 30)`,
   doanSai <= 30);
ok('vòng quét bị chặn trước khi đi hết 134 người', hoSoDaCham < 74);

// ── 6b. Cầm link THẬT mà gõ nhầm email thì không được tính là đoán token ──
// Trước khi siết, thuToken() tính mọi mã 4xx — nên người dùng link đúng của
// mình, gõ sai email vài lần, là đốt hạn mức chung với cả phòng.
console.log('\n── Cầm link thật, gõ nhầm email ──');
const KE_NHAM = '198.51.100.44';
let nham = 0;
for (const t of moi.slice(0, 25)) {
  const r = await post(`/api/invite/${t}/claim`, { email: 'khong-phai-email' }, KE_NHAM);
  if (r.status === 429) break;
  nham++;
}
ok(`gõ nhầm email ${nham}/25 lần mà không bị khoá`, nham === 25);

// ── 7. Dò token lời mời vẫn phải chết ở 20 lần (mục 8 SRS) ───────────────
console.log('\n── ĐỐI CHỨNG: dò token lời mời ──');
const KE_TOKEN = '198.51.100.33';
let tokenDuoc = 0;
for (let i = 0; i < 40; i++) {
  const r = await get('/api/invite/khongcothattokennay' + i, KE_TOKEN);
  if (r.status === 429) break;
  tokenDuoc++;
}
ok(`chặn sau ${tokenDuoc} token bịa (mục 8 SRS: 20)`, tokenDuoc <= 20);

/* ══════════════════ CHỐT CHẶN CŨ PHẢI CÒN NGUYÊN ═══════════════════════ */
console.log('\n── Chốt chặn của Đợt "bỏ OTP" còn nguyên ──');
const SACH = '203.0.113.99';
const r8 = await post('/api/onboard/vao',
  { roster_id: NGUOI[0][0], phone: NGUOI[0][1], email: 'lan.hai@kiemtra.vn' }, SACH);
ok(`hồ sơ đã nhận: gọi lại trả ${r8.status} (409)`, r8.status === 409);

const r9 = await post('/api/onboard/vao',
  { roster_id: 31, phone: '0900000009', email: 'sai.so@kiemtra.vn' }, SACH);
ok(`số sai: trả ${r9.status} (401)`, r9.status === 401);

const r10 = await post('/api/onboard/vao',
  { roster_id: KHONG_SO, phone: '0900000009', email: 'chua.so@kiemtra.vn' }, SACH);
const d10 = await r10.json().catch(() => ({}));
ok(`chưa có số trong danh sách gốc: ${d10.error} (phone_missing_in_roster)`,
   d10.error === 'phone_missing_in_roster');

// ── 8. Đã ngừng tham gia thì không mở lại được bằng số điện thoại ────────
// Hạ is_active về 0 là rút mọi đường vào (CLAUDE.md, mục "ngừng tham gia").
// Nhưng ai bị cho ngừng TRƯỚC khi kịp nhận hồ sơ thì claimed_at vẫn NULL —
// chốt chặn duy nhất của /vao không đụng tới họ.
console.log('\n── Người đã ngừng tham gia, chưa kịp nhận hồ sơ ──');
const ngung = await post('/api/onboard/vao',
  { roster_id: NGUNG, phone: '0986004333', email: 'da.ngung@kiemtra.vn' }, SACH);
const dn = await ngung.json().catch(() => ({}));
ok(`trả ${ngung.status} ${dn.error ?? ''} — không được cấp phiên (409 da_ngung_tham_gia)`,
   ngung.status === 409 && dn.error === 'da_ngung_tham_gia');

console.log(`\n${hong ? `✗ ${hong} phép kiểm đỏ` : '✓ tất cả xanh'}`);
process.exit(hong ? 1 : 0);
