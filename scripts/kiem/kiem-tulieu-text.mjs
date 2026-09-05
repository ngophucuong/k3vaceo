// Tư liệu dạng "Nội dung Text" (kind='TEXT', cột content_md — migration 0025)
// — bên cạnh việc dán đường dẫn Google Drive như trước nay.
//
// Ba phép đối chứng, mỗi cái ứng với một chỗ phải sửa KÈM khi thêm tính năng
// — bỏ một trong ba thì tính năng "có vẻ chạy" nhưng một màn nào đó vẫn sai:
//   1. Con số công khai /api/lich/cong-khai (so_tu_lieu) phải ĐẾM CẢ ghi chú
//      Text. Trước khi sửa, subquery trong lich.js chỉ đếm `url IS NOT NULL`
//      — một ghi chú Text của lớp gắn vào buổi sẽ không được tính, con số nói
//      "chưa có gì" trong khi rõ ràng có.
//   2. layTuLieuTheoBuoi() (dùng CHUNG cho /api/home và /api/lich, xem chú
//      thích trong lich.js) phải trả thêm content_md — thiếu cột này thì Hôm
//      nay hiện đúng tên ghi chú nhưng bấm vào không có gì để hiện.
//   3. Nội dung bị cắt đúng ở giới hạn ứng dụng (8.000 ký tự) — cleanText()
//      phải nhận đúng tham số, không phải mặc định không giới hạn.
//
// Phép an toàn XSS của mdSafe() (render Markdown ở phía trình duyệt) nằm ở
// pw-tulieu-text.mjs riêng — cần trình duyệt thật vì hàm ấy sống trong
// app.js, không phải mã máy chủ.
//
// Chạy:  bash scripts/kiem/reset-tulieu-text.sh  &&  node scripts/kiem/kiem-tulieu-text.mjs

let hong = 0;
const ok = (t, d) => { console.log((d ? '  ✓ ' : '  ✗ ') + t); if (!d) hong++; };
const B = 'http://127.0.0.1:8787';
const CK = 's=tk-cuong-tulieu-text';

const post = (p, body) => fetch(B + p, {
  method: 'POST', headers: { 'content-type': 'application/json', cookie: CK }, body: JSON.stringify(body),
});
const patch = (p, body) => fetch(B + p, {
  method: 'PATCH', headers: { 'content-type': 'application/json', cookie: CK }, body: JSON.stringify(body),
});
const del = p => fetch(B + p, { method: 'DELETE', headers: { cookie: CK } });
const get = (p, ck) => fetch(B + p, ck ? { headers: { cookie: ck } } : undefined);

console.log('── Máy chủ có thật sự chạy không ──');
const health = await get('/api/health').then(r => r.json()).catch(() => ({}));
ok(`/api/health trả roster_total = ${health.roster_total} (≥ 134)`, health.roster_total >= 134);

// 11/9 — Tham quan kiến tập. Phải là buổi CHƯA QUA (server "hôm nay" —
// date('now','+7 hours') — mới là mốc /api/home dùng để lọc "6 buổi sắp tới";
// một buổi đã học rồi như 4/9 sẽ không có trong /api/home dù /api/lich vẫn
// thấy đủ, nên phép đối chứng 2 sẽ đỏ oan nếu chọn nhầm buổi đã qua).
const BUOI_ID = 5;

console.log('── Tạo TEXT: không cần url, nhưng bắt buộc content_md ──');
const rThieu = await post('/api/links', { kind: 'TEXT', title: 'KIEMTULIEU_thieu', tag: 'buoi', scope: 'class' });
const bThieu = await rThieu.json();
ok(`thiếu content_md → 422 content_required (nhận ${rThieu.status} ${bThieu.error ?? ''})`,
   rThieu.status === 422 && bThieu.error === 'content_required');

const NOI_DUNG = '# Tiêu đề\n\nMột đoạn **đậm** và *nghiêng*.';
const rTao = await post('/api/links', {
  kind: 'TEXT', content_md: NOI_DUNG, title: 'KIEMTULIEU_ghichu', tag: 'buoi', scope: 'class', buoi_id: BUOI_ID,
});
const bTao = await rTao.json();
ok(`tạo được, không cần url (nhận ${rTao.status})`, rTao.status === 200 && !!bTao.id);
const id1 = bTao.id;

console.log('── ĐỐI CHỨNG 1: con số công khai đếm cả ghi chú Text ──');
const truoc = (await get('/api/lich/cong-khai').then(r => r.json())).buoi.find(b => b.id === BUOI_ID);
ok('buổi 11/9 đã tính ghi chú Text vừa tạo (≥ 1)', truoc && truoc.so_tu_lieu >= 1);
await del(`/api/links/${id1}`);
const sau = (await get('/api/lich/cong-khai').then(r => r.json())).buoi.find(b => b.id === BUOI_ID);
ok(`xoá ghi chú thì con số giảm đúng 1 (${truoc.so_tu_lieu} → ${sau.so_tu_lieu})`,
   sau.so_tu_lieu === truoc.so_tu_lieu - 1);

console.log('── ĐỐI CHỨNG 2: layTuLieuTheoBuoi trả kèm content_md ──');
const rTao2 = await post('/api/links', {
  kind: 'TEXT', content_md: NOI_DUNG, title: 'KIEMTULIEU_ghichu2', tag: 'buoi', scope: 'class', buoi_id: BUOI_ID,
});
const id2 = (await rTao2.json()).id;
const home = await get('/api/home', CK).then(r => r.json());
const rTrongHome = home.lich_hoc.find(b => b.id === BUOI_ID)?.tu_lieu.find(r => r.id === id2);
ok('buổi 11/9 hiện đúng ghi chú vừa tạo trong /api/home', !!rTrongHome);
ok('content_md có mặt trong /api/home (không chỉ url/title/kind)', rTrongHome?.content_md === NOI_DUNG);

const lich = await get('/api/lich', CK).then(r => r.json());
const rTrongLich = lich.lich_hoc.find(b => b.id === BUOI_ID)?.tu_lieu.find(r => r.id === id2);
ok('/api/lich (đăng nhập) khớp /api/home', rTrongLich?.content_md === NOI_DUNG);

console.log('── Sửa nội dung, đọc lại đúng bản mới ──');
await patch(`/api/links/${id2}`, { content_md: 'Đã sửa lại.' });
const khoSauSua = await get('/api/links', CK).then(r => r.json());
ok('sửa xong, /api/links đọc lại đúng nội dung mới',
   khoSauSua.links.find(r => r.id === id2)?.content_md === 'Đã sửa lại.');

console.log('── ĐỐI CHỨNG 3: giới hạn 8.000 ký tự ──');
const rDai = await post('/api/links', {
  kind: 'TEXT', content_md: 'x'.repeat(9000), title: 'KIEMTULIEU_dai', tag: 'bai', scope: 'group',
});
const idDai = (await rDai.json()).id;
const khoDai = await get('/api/links', CK).then(r => r.json());
const doDai = (khoDai.links.find(r => r.id === idDai)?.content_md || '').length;
ok(`nội dung 9000 ký tự bị cắt còn đúng 8000 (nhận ${doDai})`, doDai === 8000);

// Dọn dẹp — bộ kiểm chạy lại được nhiều lần mà không cần reset giữa chừng.
await del(`/api/links/${id2}`);
await del(`/api/links/${idDai}`);

console.log(`\n${hong ? `✗ ${hong} phép kiểm đỏ` : '✓ tất cả xanh'}`);
process.exit(hong ? 1 : 0);
