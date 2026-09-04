// Link mời XUYÊN NHÓM cho Ban cán sự lớp — POST /api/danh-ba/:roster_id/moi.
//
// Trước 3/9, phát link mời chỉ trưởng/phó của CHÍNH nhóm đó gọi được
// (canManageGroup). Ngô Phú Cường (uỷ viên Ban cán sự lớp, không phải trưởng
// nhóm nào khác Nhóm 6) cần mời được người ở BẤT KỲ nhóm nào. Route mới nằm ở
// routes/danh-ba.js, cố ý KHÔNG đụng canManageGroup — cơ cấu/phần bài/ngừng
// tham gia của nhóm khác vẫn đóng nguyên với người ngoài nhóm.
//
// Bốn phép ĐỐI CHỨNG ở đây, mỗi phép ứng với một chốt chặn đã kiểm bằng người
// thật lúc viết route (xem "Link mời xuyên nhóm" trong CLAUDE.md):
//   1. Người thường (không phải Ban cán sự lớp) → 403 forbidden.
//   2. Người ĐÃ nhận hồ sơ → 409 da_nhan_cho, không có đường tắt bỏ qua.
//   3. Gọi hai lần cho CÙNG một người chưa nhận → hai token KHÁC nhau, và
//      token cũ chết ngay (410) — reissueInviteToken phải thật sự vô hiệu
//      link trước chứ không chỉ cấp thêm.
//   4. Người CHƯA có dòng members nào (73/134 người lúc viết route) vẫn tạo
//      được, và phải rơi đúng NHÓM ghi trong roster.group_label của NGƯỜI
//      NHẬN — không phải nhóm của người phát link.
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

// ── 2. Người ĐÃ nhận hồ sơ → 409 da_nhan_cho ─────────────────────────────
console.log('\n── Mời người ĐÃ nhận hồ sơ (roster 105, Nhóm 8) ──');
const rDaNhan = await post('/api/danh-ba/105/moi', ckCuong);
const bDaNhan = await rDaNhan.json().catch(() => ({}));
ok(`409 da_nhan_cho (nhận ${rDaNhan.status} ${bDaNhan.error ?? ''})`,
   rDaNhan.status === 409 && bDaNhan.error === 'da_nhan_cho');

// ── 3+4. Người CHƯA có hồ sơ nào (roster 106, Lê Thị Huế, Nhóm 9) ────────
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

console.log(`\n${hong ? `✗ ${hong} phép kiểm đỏ` : '✓ tất cả xanh'}`);
process.exit(hong ? 1 : 0);
