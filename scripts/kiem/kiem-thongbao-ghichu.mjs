// Đính kèm Ghi chú vào Thông báo (migration 0034, docGhiChuId trong lich.js).
//
// Ngô Phú Cường hỏi 8/9: "trong thông báo gán Ghi chú vào như thế nào?" —
// trước đó không có đường nào, chỉ nhắc bằng chữ thường không bấm được.
//
// NĂM PHÉP ĐỐI CHỨNG, mỗi cái ứng với một chỗ hỏng ngầm nếu thiếu kiểm:
//   1. Đính kèm ghi chú CẢ LỚP đọc được → phải cho qua.
//   2. Đính kèm ghi chú NHÓM KHÁC (Nhóm 7) → phải 404 ghichu_not_found —
//      không phải 403 (403 xác nhận id đó có thật, lộ N6).
//   3. Đính kèm một liên kết KHÔNG PHẢI TEXT (kind='DRIVE') → phải 404, dù
//      cùng scope='class' mà người soạn đọc được thoải mái — sai LOẠI chứ
//      không phải sai PHẠM VI.
//   4. /api/home trả về đúng ghi chú đã đính kèm dưới dạng `tu_lieu: [...]`
//      — đúng khuôn dữ liệu veTuLieuGan() đã dùng cho buổi học/phần bài.
//   5. SỬA thông báo: đổi ghi chú đính kèm phải ghi thật; BỎ TRỐNG trường
//      ghi_chu_id ở PATCH (không gửi lên) phải GIỮ NGUYÊN đính kèm cũ —
//      cùng khuôn merge-not-overwrite của noi_dung/nguon/het_han.
//
// Chạy:  bash scripts/kiem/reset-thongbao.sh && node scripts/kiem/kiem-thongbao-ghichu.mjs

let hong = 0;
const ok = (t, d) => { console.log((d ? '  ✓ ' : '  ✗ ') + t); if (!d) hong++; };
const B = 'http://127.0.0.1:8787';
const CK = 's=tk-cuong-thongbao';

const post = (p, body) => fetch(B + p, {
  method: 'POST', headers: { 'content-type': 'application/json', cookie: CK }, body: JSON.stringify(body),
});
const patch = (p, body) => fetch(B + p, {
  method: 'PATCH', headers: { 'content-type': 'application/json', cookie: CK }, body: JSON.stringify(body),
});
const get = (p, ck) => fetch(B + p, ck ? { headers: { cookie: ck } } : { headers: { cookie: CK } });

console.log('── Máy chủ có thật sự chạy không ──');
const health = await get('/api/health').then(r => r.json()).catch(() => ({}));
ok(`/api/health trả roster_total = ${health.roster_total} (≥ 134)`, health.roster_total >= 134);

const links = (await get('/api/links?tag=all').then(r => r.json())).links ?? [];
const gcLop = links.find(l => l.title === 'KIEMTBGC_lop');
const gcNhom6 = links.find(l => l.title === 'KIEMTBGC_nhom6');
const gcKhongPhaiText = links.find(l => l.title === 'KIEMTBGC_khongphaitext');
ok('có đủ ba fixture ghi chú/liên kết đọc được', !!gcLop && !!gcNhom6 && !!gcKhongPhaiText);
// KIEMTBGC_nhom7 KHÔNG được list ra (N6 chặn ngay ở đường đọc) — dò id bằng
// cách khác: id liền kề trong khoảng đã tạo, không lấy từ /api/links vì nó
// sẽ không có mặt ở đó, đúng chủ ý.
const idNhom7 = Math.max(gcLop?.id ?? 0, gcNhom6?.id ?? 0, gcKhongPhaiText?.id ?? 0) - 1;

console.log('── ĐỐI CHỨNG 1: đính kèm ghi chú cả lớp đọc được ──');
const r1 = await post('/api/thong-bao', { cap: 'nhom', noi_dung: 'KIEMTB_gc_1', ghi_chu_id: gcLop.id });
const b1 = await r1.json();
ok(`đăng kèm ghi chú cấp lớp → 200 (nhận ${r1.status})`, r1.status === 200);
const idTb1 = b1.id;

console.log('── ĐỐI CHỨNG 2: đính kèm ghi chú của NHÓM KHÁC → 404, không phải 403 ──');
const r2 = await post('/api/thong-bao', { cap: 'nhom', noi_dung: 'KIEMTB_gc_2', ghi_chu_id: idNhom7 });
const b2 = await r2.json();
ok(`nhận 404 ghichu_not_found (nhận ${r2.status} ${b2.error ?? ''})`,
   r2.status === 404 && b2.error === 'ghichu_not_found');

console.log('── ĐỐI CHỨNG 3: đính kèm một liên kết KHÔNG PHẢI Ghi chú (kind=DRIVE) ──');
const r3 = await post('/api/thong-bao', { cap: 'nhom', noi_dung: 'KIEMTB_gc_3', ghi_chu_id: gcKhongPhaiText.id });
const b3 = await r3.json();
ok(`nhận 404 dù cùng scope='class' người soạn đọc được (nhận ${r3.status} ${b3.error ?? ''})`,
   r3.status === 404 && b3.error === 'ghichu_not_found');

console.log('── Đính kèm ghi chú riêng của CHÍNH nhóm mình → phải cho qua ──');
const r1b = await post('/api/thong-bao', { cap: 'nhom', noi_dung: 'KIEMTB_gc_1b', ghi_chu_id: gcNhom6.id });
ok(`đăng kèm ghi chú riêng Nhóm 6 → 200 (nhận ${r1b.status})`, r1b.status === 200);

console.log('── ĐỐI CHỨNG 4: /api/home trả đúng ghi chú đính kèm dạng tu_lieu[] ──');
const home = await get('/api/home').then(r => r.json());
const tb1 = (home.thong_bao ?? []).find(t => t.id === idTb1);
ok('thấy thông báo vừa đăng trong /api/home', !!tb1);
ok(`tu_lieu[0].id = ${tb1?.tu_lieu?.[0]?.id} đúng bằng ghi chú vừa đính (${gcLop.id})`,
   tb1?.tu_lieu?.length === 1 && tb1.tu_lieu[0].id === gcLop.id);
ok('tu_lieu[0].kind = TEXT', tb1?.tu_lieu?.[0]?.kind === 'TEXT');
ok('tu_lieu[0].content_md có nội dung thật (không chỉ tiêu đề)',
   (tb1?.tu_lieu?.[0]?.content_md ?? '').includes('Nội dung ghi chú cấp lớp'));

console.log('── ĐỐI CHỨNG 5a: SỬA — đổi ghi chú đính kèm ──');
const r5a = await patch(`/api/thong-bao/${idTb1}`, { ghi_chu_id: gcNhom6.id });
ok(`sửa được (nhận ${r5a.status})`, r5a.status === 200);
const home5a = await get('/api/home').then(r => r.json());
const tb1_5a = (home5a.thong_bao ?? []).find(t => t.id === idTb1);
ok(`đổi thật: tu_lieu[0].id nay là ${tb1_5a?.tu_lieu?.[0]?.id} (mong ${gcNhom6.id})`,
   tb1_5a?.tu_lieu?.[0]?.id === gcNhom6.id);

console.log('── ĐỐI CHỨNG 5b: SỬA nội dung mà KHÔNG gửi ghi_chu_id → giữ nguyên đính kèm ──');
const r5b = await patch(`/api/thong-bao/${idTb1}`, { noi_dung: 'KIEMTB_gc_1 đã sửa nội dung' });
ok(`sửa được (nhận ${r5b.status})`, r5b.status === 200);
const home5b = await get('/api/home').then(r => r.json());
const tb1_5b = (home5b.thong_bao ?? []).find(t => t.id === idTb1);
ok(`KHÔNG gửi ghi_chu_id thì đính kèm GIỮ NGUYÊN (vẫn ${gcNhom6.id}, nhận ${tb1_5b?.tu_lieu?.[0]?.id})`,
   tb1_5b?.tu_lieu?.[0]?.id === gcNhom6.id);

console.log('── SỬA — gửi ghi_chu_id rỗng để GỠ đính kèm ──');
const r5c = await patch(`/api/thong-bao/${idTb1}`, { ghi_chu_id: null });
ok(`gỡ được (nhận ${r5c.status})`, r5c.status === 200);
const home5c = await get('/api/home').then(r => r.json());
const tb1_5c = (home5c.thong_bao ?? []).find(t => t.id === idTb1);
ok('tu_lieu rỗng sau khi gỡ', (tb1_5c?.tu_lieu ?? []).length === 0);

console.log(hong ? `\n${hong} phép KHÔNG đạt` : '\nĐạt hết');
process.exit(hong ? 1 : 0);
