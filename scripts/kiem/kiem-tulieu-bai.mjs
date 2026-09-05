// Liên thông Bài ↔ Tư liệu (links.section_id) — phía máy chủ. Đúng khuôn
// "một dòng, hai/ba màn" đã dùng cho buổi học, mở rộng cho phần bài.
//
// KHÁC buổi học ở một điểm quan trọng: lich_hoc dùng CHUNG cho cả khoá, còn
// mỗi nhóm giữ một bộ tám phần RIÊNG (plan_sections qua plan_id → group_id
// của chính nhóm). docSectionId() (routes/links.js) vì vậy phải kiểm CẢ "có
// thật" LẪN "thuộc đúng nhóm của người gọi" — bốn phép đối chứng dưới đây
// đều xoay quanh đúng chốt chặn N6 ấy và hai chỗ phải sửa kèm ở plan.js.
//
// Cần một plan_sections.id THẬT SỰ thuộc nhóm KHÁC Nhóm 6 để kiểm N6 — chạy
// reset-tulieu-bai.sh trước (seed thêm Nhóm 7, reset-tulieu-text.sh không có).
//
// Chạy:  bash scripts/kiem/reset-tulieu-bai.sh  &&  node scripts/kiem/kiem-tulieu-bai.mjs

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

console.log('── Tìm section_id của Phần 1 Nhóm 6 ──');
const plan6 = await get('/api/plan', CK).then(r => r.json());
const sec6 = plan6.sections.find(s => s.ord === 1);
ok('có sẵn Phần 1 (ord=1) của Nhóm 6', !!sec6);

// Không có route đọc phần của NHÓM KHÁC (đúng N6 — không lộ cơ cấu bài của
// nhóm khác) nên không dò được qua API. reset-tulieu-bai.sh seed sẵn đúng
// một phần cho Nhóm 7, luôn ngay sau id lớn nhất của Nhóm 6 vì D1 cục bộ mới
// nạp chỉ có bộ tám phần của Nhóm 6 (migration 0003, id 1..8) trước khi seed.
const UNG_VIEN_NHOM_KHAC = Math.max(...plan6.sections.map(s => s.id)) + 1;

console.log('── Tạo tư liệu Text gắn vào Phần 1 của Nhóm 6 ──');
const rTao = await post('/api/links', {
  kind: 'TEXT', content_md: '# Ghi chú phần 1\n\nNội dung kiểm thử.',
  title: 'KIEMBAI_ghichu', tag: 'bai', section_id: sec6.id,
});
const bTao = await rTao.json();
ok(`tạo được (nhận ${rTao.status})`, rTao.status === 200 && !!bTao.id);
const id1 = bTao.id;

console.log('── ĐỐI CHỨNG 1: /api/plan trả tu_lieu đúng cho đúng phần (plan.js) ──');
const planSau = await get('/api/plan', CK).then(r => r.json());
const sec6Sau = planSau.sections.find(s => s.id === sec6.id);
ok('Phần 1 có đúng 1 tư liệu, đúng id vừa tạo', sec6Sau.tu_lieu.length === 1 && sec6Sau.tu_lieu[0].id === id1);
ok('content_md có mặt trong tu_lieu (không chỉ url/title/kind)',
   sec6Sau.tu_lieu[0].content_md === '# Ghi chú phần 1\n\nNội dung kiểm thử.');
const phanKhacCungNhom = planSau.sections.find(s => s.id !== sec6.id);
ok('phần khác CÙNG NHÓM không dính tư liệu của Phần 1 (không lẫn giữa các phần)',
   phanKhacCungNhom.tu_lieu.length === 0);

console.log('── ĐỐI CHỨNG 2: /api/links trả kèm section_ord/section_title (links.js listLinks) ──');
const kho = await get('/api/links', CK).then(r => r.json());
const rKho = kho.links.find(r => r.id === id1);
ok('section_ord đúng (1)', rKho.section_ord === 1);
ok(`section_title đúng ("${sec6.title}")`, rKho.section_title === sec6.title);

console.log('── ĐỐI CHỨNG 3 (N6): không gắn được vào phần của NHÓM KHÁC ──');
const rXuyenNhom = await post('/api/links', {
  kind: 'TEXT', content_md: 'x', title: 'KIEMBAI_xuyennhom', tag: 'bai', section_id: UNG_VIEN_NHOM_KHAC,
});
const bXuyenNhom = await rXuyenNhom.json();
ok(`POST section_id của nhóm khác → 404 section_not_found (nhận ${rXuyenNhom.status} ${bXuyenNhom.error ?? ''})`,
   rXuyenNhom.status === 404 && bXuyenNhom.error === 'section_not_found');

const rPatchXuyenNhom = await patch(`/api/links/${id1}`, { section_id: UNG_VIEN_NHOM_KHAC });
const bPatchXuyenNhom = await rPatchXuyenNhom.json();
ok(`PATCH section_id của nhóm khác cũng bị chặn y hệt (nhận ${rPatchXuyenNhom.status} ${bPatchXuyenNhom.error ?? ''})`,
   rPatchXuyenNhom.status === 404 && bPatchXuyenNhom.error === 'section_not_found');

console.log('── section_id không tồn tại (mọi nhóm) → 404, không phải 500 ──');
const rKhongThat = await post('/api/links', {
  kind: 'TEXT', content_md: 'x', title: 'KIEMBAI_khongthat', tag: 'bai', section_id: 999999,
});
const bKhongThat = await rKhongThat.json();
ok(`section_id 999999 → 404 section_not_found (nhận ${rKhongThat.status} ${bKhongThat.error ?? ''})`,
   rKhongThat.status === 404 && bKhongThat.error === 'section_not_found');

console.log('── Gỡ khỏi phần (section_id: null) — mất khỏi /api/plan ngay ──');
await patch(`/api/links/${id1}`, { section_id: null });
const planGo = await get('/api/plan', CK).then(r => r.json());
ok('sau khi gỡ, Phần 1 hết tư liệu', planGo.sections.find(s => s.id === sec6.id).tu_lieu.length === 0);
const khoGo = await get('/api/links', CK).then(r => r.json());
ok('/api/links cũng hết section_ord/section_title', !khoGo.links.find(r => r.id === id1).section_ord);

// Dọn dẹp — bộ kiểm chạy lại được nhiều lần mà không cần reset giữa chừng.
await del(`/api/links/${id1}`);

console.log(`\n${hong ? `✗ ${hong} phép kiểm đỏ` : '✓ tất cả xanh'}`);
process.exit(hong ? 1 : 0);
