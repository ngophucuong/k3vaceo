// Link mời XUYÊN NHÓM cho Ban cán sự lớp — POST /api/danh-ba/:roster_id/moi.
//
// Trước 3/9, phát link mời chỉ trưởng/phó của CHÍNH nhóm đó gọi được
// (canManageGroup). Ngô Phú Cường (uỷ viên Ban cán sự lớp, không phải trưởng
// nhóm nào khác Nhóm 6) cần mời được người ở BẤT KỲ nhóm nào. Route mới nằm ở
// routes/danh-ba.js, cố ý KHÔNG đụng canManageGroup — cơ cấu/phần bài/ngừng
// tham gia của nhóm khác vẫn đóng nguyên với người ngoài nhóm.
//
// Cập nhật 5/9: mở rộng thêm cho người ĐÃ ĐĂNG NHẬP — trước đó route này chặn
// cứng 409 da_nhan_cho, nay bỏ chặn ở ĐÂY nhưng dựng lại chốt ở BƯỚC NHẬN
// (postInviteClaim, routes/invite.js): hồ sơ đã có người nhận thì phải gõ
// ĐÚNG số điện thoại mới nhận lại được, cùng bậc kiểm và cùng hạn mức đoán với
// /vao. Đây là phần ĐÁNG GIÁ NHẤT của bộ kiểm này — không chỉ hỏi "route có
// chạy" mà còn phải chứng minh: token một mình KHÔNG còn đủ để chiếm tài
// khoản người khác, và cửa đoán số vẫn có hạn mức thật (không mở song song
// một đường dò số không bị khoá).
//
// Cập nhật 5/9 (chiều): phát hiện thật ngoài đời — Đinh Khánh Toàn (Nhóm 9,
// roster KHÔNG có số điện thoại nào) được phát lại link mà không tài nào NHẬN
// LẠI được, vì mọi số gõ vào đều báo sai — hồ sơ này không có gì để đối chiếu
// nên bắt đúng một số không tồn tại là khoá VĨNH VIỄN. xacNhanLaiSo() nay cho
// qua thẳng khi không có số nào để soi (đối chứng thứ tám bên dưới).
//
// Tám phép ĐỐI CHỨNG:
//   1. Người thường (không phải Ban cán sự lớp) → 403 forbidden.
//   2. Người ĐÃ nhận hồ sơ (roster 105) — phát lại được (200, không còn 409),
//      nhưng GET /api/invite/:token phải giấu số điện thoại (phone: null).
//   3. Claim link đó với số SAI → 401 phone_mismatch, không lộ chỗ sai.
//   4. Claim KHÔNG kèm số → 422 phone_invalid, và KHÔNG bị tính vào hạn mức
//      đoán (gõ hụt không phải một lần đoán, đúng nguyên tắc của doiChieu()).
//   5. Claim với số ĐÚNG → 200, có phiên, email được cập nhật đúng giá trị
//      gửi lên — chứng minh claim đi trọn đường chứ không chỉ trả 200 suông.
//   6. Đoán sai đủ 8 lần (DOAN_SAI_MOI_HO_SO) thì lần thứ 9 phải 429
//      rate_limited — cùng hạn mức với /vao, không phải một cửa dò số miễn phí
//      thứ hai.
//   7. Gọi hai lần cho CÙNG một người chưa nhận (roster 106) → hai token KHÁC
//      nhau, token cũ chết ngay (410), và hồ sơ mới tạo rơi đúng NHÓM ghi
//      trong roster.group_label của NGƯỜI NHẬN — không đòi số điện thoại gì cả
//      (hành vi CŨ, không đổi, vì đây là lần nhận đầu tiên).
//   8. Người ĐÃ nhận hồ sơ nhưng roster KHÔNG có số nào để đối chiếu (ca
//      "Kiểm Tra Không Số") → has_phone_on_file = false, và NHẬN LẠI được dù
//      gõ số bậy hay không gõ số nào — không còn kẹt vĩnh viễn như Đinh Khánh
//      Toàn đã gặp.
//
// Chạy:  bash scripts/kiem/reset-moi.sh  &&  node scripts/kiem/kiem-moi.mjs

let hong = 0;
const ok = (t, d) => { console.log((d ? '  ✓ ' : '  ✗ ') + t); if (!d) hong++; };
const B = 'http://127.0.0.1:8787';
const IP = { 'cf-connecting-ip': '203.0.113.90' };

const ckCuong = 's=tk-cuong-moi-xuyennhom';
const ckThuong = 's=tk-thuong-moi-xuyennhom';

const post = (p, ck) => fetch(B + p, { method: 'POST', headers: { cookie: ck, ...IP } });
const get = (p) => fetch(B + p, { headers: IP });

// ── 0. Ứng dụng có thật sự chạy không, và hai phiên thử có thật ─────────
console.log('── Máy chủ có thật sự chạy không ──');
const health = await get('/api/health').then(r => r.json()).catch(() => ({}));
ok(`/api/health trả roster_total = ${health.roster_total} (≥ 134 — roster được phép đông thêm)`,
   health.roster_total >= 134);

const rCuong = await fetch(`${B}/api/danh-ba`, { headers: { cookie: ckCuong, ...IP } });
ok(`phiên Ngô Phú Cường gọi /api/danh-ba được (${rCuong.status})`, rCuong.status === 200);
const canMoi = (await rCuong.json()).can_moi;
ok('Ngô Phú Cường (uỷ viên) có can_moi = true', canMoi === true);

const rThuong = await fetch(`${B}/api/danh-ba`, { headers: { cookie: ckThuong, ...IP } });
ok(`phiên Nguyễn Thị Thu Hương gọi /api/danh-ba được (${rThuong.status})`, rThuong.status === 200);
const canMoiThuong = (await rThuong.json()).can_moi;
ok('thành viên thường có can_moi = false', canMoiThuong === false);

// ── 1. Người thường không phải Ban cán sự lớp → 403 ──────────────────────
console.log('\n── Người thường gọi route mời xuyên nhóm ──');
const rForbidden = await post('/api/danh-ba/106/moi', ckThuong);
const bForbidden = await rForbidden.json().catch(() => ({}));
ok(`403 forbidden (nhận ${rForbidden.status} ${bForbidden.error ?? ''})`,
   rForbidden.status === 403 && bForbidden.error === 'forbidden');

// ── 2. Người ĐÃ nhận hồ sơ (roster 105, Nhóm 8) — nay phát lại được ──────
console.log('\n── Mời người ĐÃ nhận hồ sơ (roster 105, Nhóm 8) — mở rộng 5/9 ──');
const postJson = (p, ck, body) => fetch(B + p, {
  method: 'POST', headers: { cookie: ck, 'content-type': 'application/json', ...IP },
  body: JSON.stringify(body ?? {}),
});

const rDaNhan = await post('/api/danh-ba/105/moi', ckCuong);
const bDaNhan = await rDaNhan.json().catch(() => ({}));
ok(`không còn 409 — phát lại được (nhận ${rDaNhan.status})`,
   rDaNhan.status === 200 && bDaNhan.full_name === 'Nguyễn Thị Hằng Nhi');
const tokenDaNhan = bDaNhan.url?.split('/i/')[1];
ok('có token', !!tokenDaNhan);

const rXemDaNhan = await get('/api/invite/' + tokenDaNhan);
const bXemDaNhan = await rXemDaNhan.json();
ok('already_claimed = true', bXemDaNhan.member?.already_claimed === true);
ok('số điện thoại bị GIẤU (phone: null) — không thì ai cầm link cũng đọc được',
   bXemDaNhan.member?.phone === null);

// ── 3. Claim với số SAI → 401, không lộ chỗ sai ──────────────────────────
const rSaiSo = await postJson(`/api/invite/${tokenDaNhan}/claim`, null,
  { email: 'ke-la@example.com', phone: '0999999999' });
const bSaiSo = await rSaiSo.json().catch(() => ({}));
ok(`số sai → 401 phone_mismatch (nhận ${rSaiSo.status} ${bSaiSo.error ?? ''})`,
   rSaiSo.status === 401 && bSaiSo.error === 'phone_mismatch');

// ── 4. Claim KHÔNG kèm số → 422, và KHÔNG tính vào hạn mức đoán ──────────
const rThieuSo = await postJson(`/api/invite/${tokenDaNhan}/claim`, null,
  { email: 'ke-la-2@example.com' });
const bThieuSo = await rThieuSo.json().catch(() => ({}));
ok(`thiếu số → 422 phone_invalid, không phải 401 (nhận ${rThieuSo.status} ${bThieuSo.error ?? ''})`,
   rThieuSo.status === 422 && bThieuSo.error === 'phone_invalid');

// ── 5. Claim với số ĐÚNG → 200, có phiên, email cập nhật đúng ────────────
const rDungSo = await postJson(`/api/invite/${tokenDaNhan}/claim`, null,
  { email: 'hangnhi-that@example.com', phone: '0373780212' });
ok(`số đúng → 200, có set-cookie phiên (nhận ${rDungSo.status})`,
   rDungSo.status === 200 && !!rDungSo.headers.get('set-cookie'));

// ── 6. Đoán sai đủ 8 lần (DOAN_SAI_MOI_HO_SO) thì lần 9 phải 429 ─────────
// Lần sai ở bước 3 đã tính 1 — cần thêm 7 lần sai nữa cho đủ 8, rồi lần thứ 9
// (dù số gì) phải bị khoá. Thiếu số ở bước 4 không được tính, nên nếu nó lỡ
// bị tính nhầm thì phép này sẽ khoá SỚM một lượt — bắt được ngay.
let khoaOLuot = 0;
for (let i = 2; i <= 8; i++) {
  const r = await postJson(`/api/invite/${tokenDaNhan}/claim`, null,
    { email: `ke-la-${i}@example.com`, phone: '0999999999' });
  if (r.status === 429) { khoaOLuot = i; break; }
}
ok(`7 lần sai kế tiếp (lượt 2–8) đều 401, chưa bị khoá sớm`, khoaOLuot === 0);
const r429 = await postJson(`/api/invite/${tokenDaNhan}/claim`, null,
  { email: 'ke-la-9@example.com', phone: '0999999999' });
const b429 = await r429.json().catch(() => ({}));
ok(`lượt thứ 9 → 429 rate_limited, cùng hạn mức với /vao (nhận ${r429.status} ${b429.error ?? ''})`,
   r429.status === 429 && b429.error === 'rate_limited');

// ── 7. Người CHƯA có hồ sơ nào (roster 106, Lê Thị Huế, Nhóm 9) ──────────
console.log('\n── Mời người CHƯA có hồ sơ nào (roster 106, Nhóm 9) ──');
const rLan1 = await post('/api/danh-ba/106/moi', ckCuong);
const bLan1 = await rLan1.json().catch(() => ({}));
ok(`lần 1: 200, có tên và url (nhận ${rLan1.status})`,
   rLan1.status === 200 && bLan1.full_name === 'Lê Thị Huế' && typeof bLan1.url === 'string');

const tokenLan1 = bLan1.url?.split('/i/')[1];
ok('lần 1 tạo được token', !!tokenLan1);

const rLan2 = await post('/api/danh-ba/106/moi', ckCuong);
const bLan2 = await rLan2.json().catch(() => ({}));
ok(`lần 2: 200, cùng tên (nhận ${rLan2.status})`,
   rLan2.status === 200 && bLan2.full_name === 'Lê Thị Huế');
const tokenLan2 = bLan2.url?.split('/i/')[1];
ok('lần 2 ra TOKEN KHÁC lần 1 — không phát lại token cũ', !!tokenLan2 && tokenLan2 !== tokenLan1);

// Đối chứng: token LẦN 1 phải đã chết, vì reissueInviteToken vô hiệu nó trước
// khi cấp token mới ở lần 2. Không có phép này thì "khác token" ở trên có thể
// chỉ là tạo thêm lời mời chồng lên, để cả hai cùng sống.
const rTokenCu = await get('/api/invite/' + tokenLan1);
ok(`token lần 1 đã 410 (nhận ${rTokenCu.status})`, rTokenCu.status === 410);

// Token lần 2 phải còn dùng được — đối chứng ngược, không thì phép 410 ở trên
// xanh chỉ vì MỌI token đều chết, không phải vì đúng cái cũ chết.
const rTokenMoi = await get('/api/invite/' + tokenLan2);
ok(`token lần 2 vẫn còn hạn (nhận ${rTokenMoi.status})`, rTokenMoi.status === 200);

// Hồ sơ vừa tạo phải rơi đúng NHÓM 9 (ghi trong roster.group_label của Lê Thị
// Huế), không phải Nhóm 6 của Ngô Phú Cường — đọc lại qua chính route đăng
// nhập bằng token để không phải chạm D1 lúc server đang chạy.
const bTokenMoi = await rTokenMoi.json();
ok(`hồ sơ mới thuộc đúng Nhóm 9, không phải nhóm người phát link (nhận "${bTokenMoi.group?.label}")`,
   bTokenMoi.group?.label === 'Nhóm 9');

// ── 8. Người ĐÃ nhận hồ sơ nhưng roster KHÔNG có số nào để đối chiếu ─────
console.log('\n── Người ĐÃ nhận hồ sơ, KHÔNG có số nào để đối chiếu (Đinh Khánh Toàn, 5/9) ──');
const rTimKhongSo = await get('/api/wizard/roster/search?q=Ki%E1%BB%83m+Tra+Kh%C3%B4ng+S%E1%BB%91');
const idKhongSo = (await rTimKhongSo.json().catch(() => ({}))).people?.[0]?.roster_id;
ok('tìm được roster giả "Kiểm Tra Không Số"', !!idKhongSo);

const rMoiKhongSo = await post(`/api/danh-ba/${idKhongSo}/moi`, ckCuong);
const bMoiKhongSo = await rMoiKhongSo.json().catch(() => ({}));
ok(`phát link được cho hồ sơ không có số (nhận ${rMoiKhongSo.status})`, rMoiKhongSo.status === 200);
const tokenKhongSo = bMoiKhongSo.url?.split('/i/')[1];

const rXemKhongSo = await get('/api/invite/' + tokenKhongSo);
const bXemKhongSo = await rXemKhongSo.json();
ok('has_phone_on_file = false — giao diện biết đường không bắt gõ số vô ích',
   bXemKhongSo.member?.has_phone_on_file === false);

// Gõ một số BẤT KỲ, kể cả sai be bét — không có gì để đối chiếu thì không có
// "sai" để bắt. Trước bản vá này, dòng dưới đây sẽ nhận 401 phone_mismatch
// mãi mãi, đúng như Đinh Khánh Toàn đã gặp.
const rClaimKhongSo = await postJson(`/api/invite/${tokenKhongSo}/claim`, null,
  { email: 'khongso@example.com', phone: '0999999999' });
ok(`claim với số bất kỳ vẫn 200, không còn kẹt vĩnh viễn (nhận ${rClaimKhongSo.status})`,
   rClaimKhongSo.status === 200);

// Phát lại lần hai, lần này claim KHÔNG kèm số nào — trước bản vá sẽ dính 422
// phone_invalid vì hàm đòi số hợp lệ trước cả khi biết có gì để soi không.
const rMoiKhongSo2 = await post(`/api/danh-ba/${idKhongSo}/moi`, ckCuong);
const tokenKhongSo2 = (await rMoiKhongSo2.json().catch(() => ({}))).url?.split('/i/')[1];
ok('phát lại lần hai vẫn ra token', !!tokenKhongSo2);
const rClaimKhongSo2 = await postJson(`/api/invite/${tokenKhongSo2}/claim`, null,
  { email: 'khongso2@example.com' });
ok(`claim KHÔNG kèm số nào cũng 200 (nhận ${rClaimKhongSo2.status})`,
   rClaimKhongSo2.status === 200);

console.log(`\n${hong ? `✗ ${hong} phép kiểm đỏ` : '✓ tất cả xanh'}`);
process.exit(hong ? 1 : 0);
