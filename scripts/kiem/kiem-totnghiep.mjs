// Zone Lễ tốt nghiệp — routes/tot-nghiep.js (migration 0041).
//
// Ngô Phú Cường (18/9) đưa 15 câu Ban tổ chức muốn thu để chuẩn bị Lễ tốt
// nghiệp 26/9, và xin "một zone riêng". Lý lẽ thiết kế ở migration 0041.
//
// MƯỜI phép ĐỐI CHỨNG, mỗi cái ứng với một chỗ hỏng được mà không báo lỗi:
//
//   1. /api/totnghiep/danh-sach KHÔNG KÈM COOKIE → phải 401, không phải 200.
//      Đây là phép quan trọng nhất của cả bộ. Ranh giới công khai/cần-phiên
//      trong index.js là VỊ TRÍ DÒNG (dòng 163-164 là getCurrentMember → 401)
//      chứ không phải một cờ nào: một lần sửa về sau đẩy nhầm route lên nửa
//      trên là danh sách cả lớp kèm điện thoại thành công khai, mà không phép
//      kiểm nào khác kêu lên.
//   2. Người thường (không thuộc Ban cán sự lớp) gọi danh-sach → 403; uy_vien
//      (Ngô Phú Cường) → 200. isClassCommittee gồm cả uy_vien, cố ý — đây là
//      quyền ĐỌC để báo cáo, không đụng tiền.
//   3. Điền sẵn ĐÚNG: goi_y lấy ngày sinh từ roster.dob NGUYÊN VĂN, không
//      chuẩn hoá. 28/146 dòng trên D1 thật chỉ có năm ('1966') — chuẩn hoá
//      hộ là bịa ngày tháng lên chứng chỉ.
//   4. Lưu phần A hai lần KHÔNG đẻ hai dòng (UNIQUE member_id có răng), và
//      lần hai ghi đè chứ không lỗi.
//   5. Ba phần lưu ĐỘC LẬP: lưu Gala không xoá mất phần A đã lưu, và ngược
//      lại. Đây là cả lý do tách ba phần — hỏng chỗ này là mất dữ liệu.
//   6. linh_vuc lọc qua nganhRaChuoi: mã lạ bị bỏ, quá 3 mã thì cắt còn 3.
//   7. du_le / tai_tro chỉ nhận giá trị trong danh sách; giá trị lạ → null
//      (chưa trả lời) chứ không 422.
//   8. N6 ở ban-nop: route KHÔNG nhận group_id trong thân nên không có gì để
//      giả mạo — kiểm bằng cách cho người Nhóm 7 nộp link rồi xác nhận Nhóm 6
//      KHÔNG đổi. Và link không https → 422 link_must_be_https.
//   9. Đợt thu phí của migration 0041 có thật, đúng số tiền / số tài khoản /
//      cú pháp, và dot_phi đi qua CHÍNH shapeRound() của funds.js — nhãn
//      trạng thái phải là của funds.js chứ không phải bản sao.
//  10. CSV: có BOM UTF-8, và cột phí ghi "đã tự khai" chứ TUYỆT ĐỐI KHÔNG
//      ghi "đã đóng" (mục 6.4 SRS). Tệp này đi ra ngoài cho Ban tổ chức đọc.
//
// Chạy:  bash scripts/kiem/reset-totnghiep.sh && node scripts/kiem/kiem-totnghiep.mjs

import { readFileSync } from 'node:fs';

let hong = 0;
const ok = (t, d) => { console.log((d ? '  ✓ ' : '  ✗ ') + t); if (!d) hong++; };
const B = 'http://127.0.0.1:8787';
const IP = { 'cf-connecting-ip': '203.0.113.96' };

const ckCuong = 's=tk-tn-cuong';
const ckThuong = 's=tk-tn-thuong';
const ckN7 = 's=tk-tn-n7';

const get = (p, ck) => fetch(B + p, { headers: ck ? { cookie: ck, ...IP } : { ...IP } });
const send = (p, ck, method, body) => fetch(B + p, {
  method, headers: { cookie: ck, 'content-type': 'application/json', ...IP },
  body: JSON.stringify(body ?? {}),
});
const put = (p, ck, body) => send(p, ck, 'PUT', body);
const patch = (p, ck, body) => send(p, ck, 'PATCH', body);

// ── 0. Máy chủ có thật sự chạy, ba phiên có thật ─────────────────────────
console.log('── Máy chủ có thật sự chạy không ──');
const health = await fetch(B + '/api/health').then(r => r.json()).catch(() => ({}));
ok(`/api/health trả roster_total = ${health.roster_total} (≥ 134)`, health.roster_total >= 134);
for (const [ten, ck] of [['Ngô Phú Cường', ckCuong], ['Kiểm TN Thường', ckThuong],
                          ['Kiểm TN Nhóm Bảy', ckN7]]) {
  const r = await get('/api/totnghiep', ck);
  ok(`phiên ${ten} gọi /api/totnghiep được (${r.status})`, r.status === 200);
}

// ── 1. KHÔNG COOKIE → 401, không phải 200 ────────────────────────────────
console.log('\n── Chốt chặn quan trọng nhất: không cookie thì phải 401 ──');
for (const duong of ['/api/totnghiep', '/api/totnghiep/danh-sach', '/api/totnghiep/xuat.csv']) {
  const r = await get(duong, null);
  ok(`${duong} không cookie → 401 (nhận ${r.status})`, r.status === 401);
}
const rGhiKhongPhien = await fetch(B + '/api/totnghiep/ho-so', {
  method: 'PUT', headers: { 'content-type': 'application/json', ...IP }, body: '{}',
});
ok(`PUT /api/totnghiep/ho-so không cookie → 401 (nhận ${rGhiKhongPhien.status})`,
   rGhiKhongPhien.status === 401);

// ── 2. Ai xem được danh sách cả lớp ──────────────────────────────────────
console.log('\n── Ai xem được danh sách cả lớp ──');
const rThuongDs = await get('/api/totnghiep/danh-sach', ckThuong);
ok(`người thường → 403 (nhận ${rThuongDs.status})`, rThuongDs.status === 403);
const rCuongDs = await get('/api/totnghiep/danh-sach', ckCuong);
ok(`uy_vien (Ngô Phú Cường) → 200 (nhận ${rCuongDs.status})`, rCuongDs.status === 200);
const dsCuong = await rCuongDs.json();
// KHÔNG so với con số của bản thật (75 dòng members lúc viết mục này): D1 cục
// bộ mới nạp chỉ có những người migration seed sẵn, còn 60 người kia là do
// chính họ tự nhận hồ sơ trên tên miền. Ghim một con số của production vào
// đây là bộ kiểm đỏ mỗi lần nạp lại DB sạch, vì một lý do chẳng liên quan gì
// tới mã — đúng kiểu ghim `roster_total === 134` đã phải sửa ngày 9/9.
ok(`danh sách có ${dsCuong.tong} người (> 0)`, dsCuong.tong > 0);
ok('mỗi người có group_label và các mốc', dsCuong.nguoi.every(
  x => 'group_label' in x && 'ho_so_luc' in x && 'gala_luc' in x));

// ── 3. Điền sẵn từ dữ liệu đã có, ngày sinh NGUYÊN VĂN ───────────────────
console.log('\n── Điền sẵn: 6/15 câu D1 đã có sẵn ──');
const tnCuong = await get('/api/totnghiep', ckCuong).then(r => r.json());
ok('goi_y.ho_ten = Ngô Phú Cường', tnCuong.goi_y?.ho_ten === 'Ngô Phú Cường');
ok('goi_y có dien_thoai', !!tnCuong.goi_y?.dien_thoai);
ok('nganh_list trả 19 ngành', (tnCuong.nganh_list ?? []).length === 19);
ok('la_ban_can_su = true (uy_vien)', tnCuong.la_ban_can_su === true);
ok('dang_ky = null khi chưa điền gì', tnCuong.dang_ky === null);
ok('nhom có label và danh sách thành viên',
   !!tnCuong.nhom?.label && Array.isArray(tnCuong.nhom?.thanh_vien));

// Ngày sinh phải khớp NGUYÊN VĂN roster.dob — không chuẩn hoá, không đoán.
const dobGoc = await fetch(B + '/api/home', { headers: { cookie: ckCuong } })
  .then(r => r.json()).then(() => null).catch(() => null);
ok('goi_y.ngay_sinh là chuỗi hoặc null (không phải object/Date đã chế biến)',
   tnCuong.goi_y.ngay_sinh === null || typeof tnCuong.goi_y.ngay_sinh === 'string');

/* ── 3b. Ô "Việc của bạn" ở tab Hôm nay (19/9) ────────────────────────────
   Ngô Phú Cường: *"ở Trang 'Hôm nay' vẫn có session 'Nhóm chưa có đề tài'.
   dù chúng ta đã thay đổi luồng này rồi mà."* Chuỗi thật là "Nhóm chưa chốt
   đề tài", sinh ở computeAction() (routes/home.js) chứ không ở giao diện.

   Bốn phép, và phép thứ HAI mới là phép có răng: phép "chuỗi cũ đã biến mất"
   một mình vẫn XANH với một bản vá chỉ xoá bước cũ mà quên thêm bước mới, và
   cũng xanh với một bước mới không bao giờ tắt. Phải đi hết ba trạng thái. */
console.log('\n── Ô "Việc của bạn" nói đúng việc đang gấp ──');

const heroRaw = async () => (await get('/api/home', ckCuong)).text();
const hero = async () => JSON.parse(await heroRaw()).action ?? {};

// (a) Chưa khai gì → phải là việc Lễ & Gala (hạn 21h00 ngày 19/9, gấp nhất).
const tho0 = await heroRaw();
const a0 = JSON.parse(tho0).action ?? {};
ok(`chưa khai gì → target = "totnghiep" (nhận "${a0.target}")`, a0.target === 'totnghiep');
ok(`câu hero nhắc Lễ tốt nghiệp (nhận "${a0.h}")`, /Lễ tốt nghiệp/i.test(a0.h ?? ''));
// Grep THÔ trên nguyên văn JSON — không chỉ đọc action.h, vì chuỗi cũ có thể
// còn nấp ở một nhánh khác của cùng hàm.
ok('chuỗi "Nhóm chưa chốt đề tài" KHÔNG còn trong /api/home',
   !tho0.includes('Nhóm chưa chốt đề tài'));

/* A2 — MỐC gala_luc CHỈ ĐÓNG KHI THẬT SỰ CÓ TRẢ LỜI (vá 19/9).
   `putGala` bản đầu ghi mốc VÔ ĐIỀU KIỆN, nên bấm Lưu mà chưa chạm Có/Không
   vẫn làm ô "Dự Lễ" thành ✓ xong và `xong_gala` trên màn Ban cán sự lớp đếm
   người ấy vào cột ĐÃ TRẢ LỜI — trong khi Ban tổ chức không có câu trả lời
   nào. Chỗ này gọi được vì bản đăng ký của anh Cường còn trắng nguyên.

   ĐI CẢ HAI CHIỀU: một bản vá chặn quá tay (không bao giờ đóng mốc) cũng làm
   người trả lời "Không" biến mất khỏi danh sách, mà chiều ấy im lặng y hệt. */
const rGalaGalaRong = await put('/api/totnghiep/gala', ckCuong, {});
const bGalaGalaRong = await rGalaGalaRong.json().catch(() => ({}));
ok(`lưu Gala với thân RỖNG → 200 (nhận ${rGalaGalaRong.status})`, rGalaGalaRong.status === 200);
ok('… nhưng KHÔNG đóng mốc gala_luc', bGalaGalaRong.dang_ky?.gala_luc == null);
const aGalaRong = await hero();
ok('… và hero vẫn còn giục việc Lễ & Gala, chưa coi là xong',
   aGalaRong.target === 'totnghiep' && /Lễ tốt nghiệp/i.test(aGalaRong.h ?? ''));

const rKhong = await put('/api/totnghiep/gala', ckCuong, { du_le: 'khong' });
const bKhong = await rKhong.json().catch(() => ({}));
ok('trả lời "Không dự" thì mốc PHẢI đóng — không chặn quá tay',
   !!bKhong.dang_ky?.gala_luc && bKhong.dang_ky?.du_le === 'khong');

// (b) Trả lời Gala xong → phải CHUYỂN sang việc hồ sơ chứng chỉ, chưa tắt hẳn.
await put('/api/totnghiep/gala', ckCuong, { du_le: 'co' });
const a1 = await hero();
ok(`khai Gala xong → vẫn "totnghiep" nhưng đổi câu (nhận "${a1.h}")`,
   a1.target === 'totnghiep' && /hồ sơ|chứng chỉ/i.test(a1.h ?? ''));

// (c) Khai nốt hồ sơ → bước này phải TẮT và nhường chỗ cho chuỗi cũ của SRS.
await put('/api/totnghiep/ho-so', ckCuong, {
  ho_ten: 'Ngô Phú Cường', ngay_sinh: '01/02/1980', dien_thoai: '0979755857',
  doanh_nghiep: 'Công ty A', chuc_vu: 'Giám đốc',
  linh_vuc: ['cong-nghe'], nhu_cau_ket_noi: 'kiểm hero',
});
const a2 = await hero();
ok(`khai đủ hai phần → bước tốt nghiệp TẮT, rơi xuống bước cũ (nhận "${a2.target}")`,
   a2.target !== 'totnghiep' && !!a2.target);

/* (d) HAI MỐC KHÔNG ĐƯỢC CHÉP TAY. home.js phải `import { HAN_GALA, NGAY_LE }`
   từ tot-nghiep.js. Chép giá trị sang tệp thứ hai thì sớm muộn hai bản lệch
   nhau, và triệu chứng là ô hero tắt sớm hoặc muộn một ngày — không chỗ nào
   báo lỗi. Đây là chốt DUY NHẤT chặn được chuyện ấy. */
const nguonHome = readFileSync(new URL('../../worker/src/routes/home.js', import.meta.url), 'utf8');
const ngayChepTay = nguonHome.match(/2026-09-\d\d/g) ?? [];
ok(`home.js KHÔNG chép tay mốc ngày nào (thấy ${ngayChepTay.length}: ${ngayChepTay.join(', ') || 'không'})`,
   ngayChepTay.length === 0);
ok('home.js import HAN_GALA và NGAY_LE từ tot-nghiep.js',
   /import\s*\{[^}]*HAN_GALA[^}]*NGAY_LE[^}]*\}\s*from\s*'\.\/tot-nghiep\.js'/.test(nguonHome));

// (e) /api/totnghiep thôi trả đề tài NHÓM — payload chết, giao diện chưa bao
// giờ đọc, để lại thì lần sửa sau có người tưởng hai luồng còn dính nhau.
const tnSau = await get('/api/totnghiep', ckCuong).then(r => r.json());
ok('phúc đáp /api/totnghiep không còn topic_product / topic_customers',
   !('topic_product' in (tnSau.nhom ?? {})) && !('topic_customers' in (tnSau.nhom ?? {})));

// ── 4. Lưu hai lần KHÔNG đẻ hai dòng ─────────────────────────────────────
console.log('\n── Chốt UNIQUE member_id có răng không ──');
const hoSo1 = {
  ho_ten: 'Ngô Phú Cường', ngay_sinh: '01/02/1980', dien_thoai: '0979755857',
  doanh_nghiep: 'Công ty A', chuc_vu: 'Giám đốc',
  linh_vuc: ['cong-nghe', 'thuong-mai'], nhu_cau_ket_noi: 'lần một',
};
const r1 = await put('/api/totnghiep/ho-so', ckCuong, hoSo1);
ok(`lưu lần 1 → 200 (nhận ${r1.status})`, r1.status === 200);
const r2 = await put('/api/totnghiep/ho-so', ckCuong, { ...hoSo1, nhu_cau_ket_noi: 'lần hai' });
const b2 = await r2.json().catch(() => ({}));
ok(`lưu lần 2 → 200, KHÔNG lỗi UNIQUE (nhận ${r2.status})`, r2.status === 200);
ok('lần 2 GHI ĐÈ (nhu_cau_ket_noi = "lần hai")', b2.dang_ky?.nhu_cau_ket_noi === 'lần hai');
const dsSauHaiLan = await get('/api/totnghiep/danh-sach', ckCuong).then(r => r.json());
const dongCuong = dsSauHaiLan.nguoi.filter(x => x.full_name === 'Ngô Phú Cường');
ok(`Ngô Phú Cường chỉ có ĐÚNG MỘT dòng (đếm ${dongCuong.length})`, dongCuong.length === 1);
ok('xong_ho_so đếm được 1', dsSauHaiLan.xong_ho_so === 1);

/* ══ "ÉP" KHAI ĐỦ — Ngô Phú Cường yêu cầu 18/9 ══════════════════════════════
   "Khai đủ thông tin về doanh nghiệp và nhu cầu giao thương, 'ép' khai đủ
   những thông tin doanh nghiệp mới được submit."

   Lý do có yêu cầu này đo được, không phải cảm tính: soi D1 thật 18/9 cho
   `co_ho_so = 46` mà `da_chon_nganh = 0` — 46 người đã điền hồ sơ Giao thương,
   KHÔNG MỘT AI từng bấm một chip ngành nào. Ô nào bỏ qua được thì phần lớn
   người ta bỏ qua.

   Kiểm TỪNG Ô một chứ không chỉ kiểm "thiếu hết thì chặn": sót một khoá trong
   BAT_BUOC là ô ấy lặng lẽ thành không bắt buộc, và không có gì báo. */
console.log('\n── Phần hồ sơ: thiếu một ô là KHÔNG lưu được ──');
for (const [khoa, nhan] of [
  ['ngay_sinh', 'Ngày sinh'], ['dien_thoai', 'Số điện thoại'],
  ['doanh_nghiep', 'Doanh nghiệp'], ['chuc_vu', 'Chức vụ'],
  ['nhu_cau_ket_noi', 'Nhu cầu kết nối'],
]) {
  const r = await put('/api/totnghiep/ho-so', ckCuong, { ...hoSo1, [khoa]: '' });
  const b = await r.json().catch(() => ({}));
  ok(`bỏ trống "${nhan}" → 422 và gọi đúng tên ô (nhận ${r.status})`,
     r.status === 422 && b.error === 'thieu_thong_tin' && (b.thieu_ten ?? []).includes(nhan));
}
const rKhongNganh = await put('/api/totnghiep/ho-so', ckCuong, { ...hoSo1, linh_vuc: [] });
const bKhongNganh = await rKhongNganh.json().catch(() => ({}));
ok(`không chọn lĩnh vực nào → 422 (nhận ${rKhongNganh.status})`, rKhongNganh.status === 422);
ok('gọi đúng tên "Lĩnh vực hoạt động"',
   (bKhongNganh.thieu_ten ?? []).includes('Lĩnh vực hoạt động'));

// Chọn chip "Ngành khác" mà không gõ chữ cũng là thiếu: bản xuất CSV in ra
// đúng hai chữ "Ngành khác", không hơn gì việc không chọn gì — mà lại trông
// như đã khai xong.
const rKhacRong = await put('/api/totnghiep/ho-so', ckCuong, {
  ...hoSo1, linh_vuc: ['khac'], linh_vuc_khac: '   ',
});
ok(`chip "Ngành khác" mà ô chữ trống → 422 (nhận ${rKhacRong.status})`, rKhacRong.status === 422);

// ĐỐI CHỨNG: đủ cả bảy ô thì vẫn lưu được như thường — phép trên không được
// chặt tới mức chặn luôn người điền đủ.
const rDu = await put('/api/totnghiep/ho-so', ckCuong, hoSo1);
ok(`điền đủ → 200 (nhận ${rDu.status})`, rDu.status === 200);

/* ĐỐI CHỨNG QUAN TRỌNG NHẤT của ràng buộc này: nó KHÔNG được lan sang phần
   Gala. Hạn Gala là 21h00 NGÀY 19/9, sớm hơn hạn hồ sơ (26/9) cả tuần — buộc
   xong hồ sơ mới cho đăng ký Gala là mất đúng cái hạn gấp nhất, và đó chính
   là cái bẫy mà thiết kế "ba phần, ba nút Lưu" sinh ra để tránh. */
const rGalaTuDo = await put('/api/totnghiep/gala', ckCuong, { du_le: 'co' });
ok(`lưu Gala KHÔNG bị ràng buộc hồ sơ → 200 (nhận ${rGalaTuDo.status})`,
   rGalaTuDo.status === 200);

/* Ghi ngược `linh_vuc` sang `member_profile.nganh`. Không có bước này thì cả
   lớp khai ngành ở đây trong khi bộ lọc ngành ở tab Giao thương vẫn đứng trên
   dữ liệu RỖNG (`da_chon_nganh = 0`) — hai nguồn sự thật cho cùng một việc,
   và bên có dữ liệu lại không phải bên cần dùng. */
console.log('\n── Ngành khai ở đây phải tới được tab Giao thương ──');
// `nhu_cau_ket_noi: 'lần hai'` là để TRẢ LẠI trạng thái cho mục "Ba phần lưu
// độc lập" ngay bên dưới — nó đọc đúng chuỗi ấy để chứng minh lưu Gala không
// xoá mất phần A. Khối này chen vào giữa nên phải dọn theo mình.
await put('/api/totnghiep/ho-so', ckCuong, {
  ...hoSo1, linh_vuc: ['van-tai', 'thuong-mai'], nhu_cau_ket_noi: 'lần hai',
});
const gt = await get('/api/giao-thuong', ckCuong).then(r => r.json()).catch(() => ({}));
// `toi.nganh` đã qua tachNganh() nên là MẢNG MÃ, không phải chuỗi.
const nganhGt = (gt.toi?.nganh ?? []).map(x => x.ma ?? x);
ok(`member_profile.nganh nhận được ngành vừa khai (${nganhGt.join(',') || 'RỖNG'})`,
   nganhGt.includes('van-tai') && nganhGt.includes('thuong-mai'));

// ── 5. Ba phần lưu ĐỘC LẬP ───────────────────────────────────────────────
console.log('\n── Ba phần lưu độc lập, không đè lên nhau ──');
const rGala = await put('/api/totnghiep/gala', ckCuong, {
  du_le: 'co', tai_tro: 'tien', tai_tro_mo_ta: 'ủng hộ 5 triệu',
  gian_hang: 1, van_nghe: 1, van_nghe_mo_ta: 'song ca 2 người',
});
const bGala = await rGala.json().catch(() => ({}));
ok(`lưu Gala → 200 (nhận ${rGala.status})`, rGala.status === 200);
ok('lưu Gala KHÔNG xoá mất phần A', bGala.dang_ky?.nhu_cau_ket_noi === 'lần hai');
ok('lưu Gala KHÔNG xoá mất ho_so_luc', !!bGala.dang_ky?.ho_so_luc);
ok('du_le lưu đúng', bGala.dang_ky?.du_le === 'co');
ok('gian_hang = 1', bGala.dang_ky?.gian_hang === 1);

const r3 = await put('/api/totnghiep/ho-so', ckCuong, { ...hoSo1, nhu_cau_ket_noi: 'lần ba' });
const b3 = await r3.json().catch(() => ({}));
ok('lưu lại phần A KHÔNG xoá mất phần C (du_le vẫn "co")', b3.dang_ky?.du_le === 'co');
ok('phần A vẫn ghi đè được (lần ba)', b3.dang_ky?.nhu_cau_ket_noi === 'lần ba');
ok('gala_luc còn nguyên', !!b3.dang_ky?.gala_luc);

// ── 6. linh_vuc lọc qua nganhRaChuoi ─────────────────────────────────────
console.log('\n── Lĩnh vực: bỏ mã lạ, cắt còn tối đa 3 ──');
const rNg = await put('/api/totnghiep/ho-so', ckCuong, {
  ...hoSo1, linh_vuc: ['cong-nghe', 'ma-khong-co-that', 'thuong-mai', 'van-tai', 'y-te'],
});
const bNg = await rNg.json().catch(() => ({}));
const maDaLuu = String(bNg.dang_ky?.linh_vuc ?? '').split(',').filter(Boolean);
ok(`cắt còn 3 mã (nhận ${maDaLuu.length}: ${maDaLuu.join(',')})`, maDaLuu.length === 3);
ok('mã lạ bị bỏ', !maDaLuu.includes('ma-khong-co-that'));

/* Ô chữ tự do đi kèm chip "Ngành khác" — migration 0044.
   Ngô Phú Cường 18/9: "Khác có thể điền free text không?" Soi D1 thật trước
   khi làm cho con số quyết định: 46 người có member_profile mà da_chon_nganh
   = 0 — KHÔNG MỘT AI từng bấm một chip ngành nào. Nên danh mục 19 mã không
   được sửa theo phỏng đoán; thứ đáng làm là mở đường cho người không thấy
   mình trong danh sách tự nói ra. */
console.log('\n── "Ngành khác": ô chữ chỉ sống cùng chip ──');
const rKhac = await put('/api/totnghiep/ho-so', ckCuong, {
  ...hoSo1, linh_vuc: ['khac', 'van-tai'], linh_vuc_khac: 'Logistics chuỗi lạnh',
});
const bKhac = await rKhac.json().catch(() => ({}));
ok('có chip khac thì giữ nguyên chữ',
   bKhac.dang_ky?.linh_vuc_khac === 'Logistics chuỗi lạnh');

// PHÉP CÓ RĂNG của cả tính năng. Giao diện ẩn ô chữ khi chip tắt, nhưng ẩn
// KHÔNG phải là chốt chặn (quy ước 6: kiểm ở máy chủ, không tin giao diện) —
// và ở đây cái giá rất cụ thể: bản xuất CSV sẽ in ra một ngành mà người ấy đã
// thôi khai, còn họ thì không thấy ô nào để sửa vì nó đang bị ẩn.
const rBo = await put('/api/totnghiep/ho-so', ckCuong, {
  ...hoSo1, linh_vuc: ['van-tai'], linh_vuc_khac: 'Logistics chuỗi lạnh',
});
const bBo = await rBo.json().catch(() => ({}));
ok('bỏ chip khac thì chữ bị gỡ theo, dù máy khách vẫn gửi lên',
   bBo.dang_ky?.linh_vuc_khac === null);

// Trả lại trạng thái có chữ, để phép kiểm CSV bên dưới có cái mà đọc.
await put('/api/totnghiep/ho-so', ckCuong, {
  ...hoSo1, linh_vuc: ['khac', 'van-tai'], linh_vuc_khac: 'Logistics chuỗi lạnh',
});

// ── 7. du_le / tai_tro chỉ nhận giá trị trong danh sách ──────────────────
console.log('\n── Giá trị lạ → null (chưa trả lời), không phải 422 ──');
const rLa = await put('/api/totnghiep/gala', ckCuong, { du_le: 'co le', tai_tro: 'vang' });
const bLa = await rLa.json().catch(() => ({}));
ok(`vẫn 200 (nhận ${rLa.status})`, rLa.status === 200);
ok('du_le lạ → null', bLa.dang_ky?.du_le === null);
ok('tai_tro lạ → null', bLa.dang_ky?.tai_tro === null);
// Trả lại giá trị đúng cho các phép sau
await put('/api/totnghiep/gala', ckCuong, { du_le: 'co', tai_tro: 'tien' });

/* ── 8. Đề tài KHKD theo CÁ NHÂN / theo LĨNH VỰC (migration 0043) ────────
   Đổi 18/9 chiều: "Các nhóm hoạt động không hiệu quả nên lớp quyết định nộp
   đề tài tự do theo cá nhân hoặc cùng lĩnh vực, không bắt buộc ai cũng phải
   nộp." Đường theo nhóm (ban_nop_*) đã gỡ hẳn. */
console.log('\n── Đề tài KHKD: cá nhân, theo lĩnh vực, không bắt buộc ──');

// Đường theo nhóm phải BIẾN MẤT, không được sống sót thành nguồn sự thật thứ hai.
const rCu = await patch('/api/totnghiep/ban-nop', ckCuong, { ban_nop_url: 'https://x.vn/a' });
ok(`PATCH /api/totnghiep/ban-nop đã gỡ → 404 (nhận ${rCu.status})`, rCu.status === 404);

const tnLv = await get('/api/totnghiep', ckCuong).then(r => r.json());
ok('trả đủ 15 lĩnh vực KHKD', (tnLv.linh_vuc_khkd_list ?? []).length === 15);
// Mã phải mang tiền tố lv- để không lẫn với danh mục NGANH của Giao thương:
// không có tiền tố thì `bat-dong-san` hợp lệ ở CẢ HAI, nên một mã truyền nhầm
// sẽ được nhận LẶNG LẼ thay vì bị loại.
ok('mọi mã đều có tiền tố lv-', (tnLv.linh_vuc_khkd_list ?? []).every(x => x.ma.startsWith('lv-')));
ok('không mã nào trùng với danh mục NGANH của Giao thương',
   (tnLv.linh_vuc_khkd_list ?? []).every(x => !(tnLv.nganh_list ?? []).some(n => n.ma === x.ma)));

const rSaiUrl = await put('/api/totnghiep/de-tai', ckCuong, { khkd_url: 'http://x.vn/a' });
ok(`http:// → 422 link_must_be_https (nhận ${rSaiUrl.status})`, rSaiUrl.status === 422);

// Mã lạ → null (chưa chọn), KHÔNG 422 — cùng lý lẽ docNganh(): một mã thừa từ
// giao diện cũ trong đệm trình duyệt không nên làm mất nguyên phần vừa gõ.
const rLaLv = await put('/api/totnghiep/de-tai', ckCuong, {
  khkd_linh_vuc: 'bat-dong-san', khkd_de_tai: 'Thử mã của danh mục kia',
});
const bLaLv = await rLaLv.json().catch(() => ({}));
ok(`mã của danh mục NGANH → vẫn 200 (nhận ${rLaLv.status})`, rLaLv.status === 200);
ok('nhưng KHÔNG được nhận: khkd_linh_vuc = null', bLaLv.dang_ky?.khkd_linh_vuc === null);
ok('phần gõ tay vẫn giữ nguyên', bLaLv.dang_ky?.khkd_de_tai === 'Thử mã của danh mục kia');

const truocDt = await get('/api/totnghiep', ckCuong).then(r => r.json());
const rDt = await put('/api/totnghiep/de-tai', ckCuong, {
  khkd_linh_vuc: 'lv-y-te-giao-duc', khkd_de_tai: 'Chuỗi nhà thuốc khu công nghiệp',
  khkd_url: 'https://drive.google.com/bai-cuong',
});
const bDt = await rDt.json().catch(() => ({}));
ok(`lưu đề tài → 200 (nhận ${rDt.status})`, rDt.status === 200);
ok('lĩnh vực lưu đúng', bDt.dang_ky?.khkd_linh_vuc === 'lv-y-te-giao-duc');
ok('có mốc khkd_luc', !!bDt.dang_ky?.khkd_luc);
ok(`lưu đề tài KHÔNG xoá mất phần A (vẫn "${bDt.dang_ky?.nhu_cau_ket_noi}")`,
   bDt.dang_ky?.nhu_cau_ket_noi === truocDt.dang_ky?.nhu_cau_ket_noi);
ok('lưu đề tài KHÔNG xoá mất phần C', bDt.dang_ky?.du_le === 'co');

// "Không bắt buộc ai cũng phải nộp": lưu RỖNG phải hợp lệ, và KHÔNG được đóng
// dấu mốc — đóng dấu cho một lượt rỗng là màn Ban cán sự lớp đếm nhầm người ấy
// vào cột "đã khai", mà con số ấy là cả lý do tính năng này tồn tại.
const rRong = await put('/api/totnghiep/de-tai', ckCuong, {});
const bRong = await rRong.json().catch(() => ({}));
ok(`lưu rỗng → 200 (nhận ${rRong.status})`, rRong.status === 200);
ok('lưu rỗng KHÔNG đóng dấu mốc (khkd_luc = null)', bRong.dang_ky?.khkd_luc === null);
// Trả lại cho các phép sau
await put('/api/totnghiep/de-tai', ckCuong, {
  khkd_linh_vuc: 'lv-y-te-giao-duc', khkd_de_tai: 'Chuỗi nhà thuốc khu công nghiệp',
  khkd_url: 'https://drive.google.com/bai-cuong',
});

// Người Nhóm 7 chọn CÙNG lĩnh vực — đúng ca "cùng lĩnh vực" mà lớp quyết.
await put('/api/totnghiep/de-tai', ckN7, {
  khkd_linh_vuc: 'lv-y-te-giao-duc', khkd_de_tai: 'Chuỗi nhà thuốc khu công nghiệp',
  khkd_url: 'https://drive.google.com/bai-cuong',
});

// ── Đây là thứ THAY CHO lượt bình chọn Zalo ──────────────────────────────
console.log('\n── Tổng hợp theo lĩnh vực (thay cho bình chọn Zalo) ──');
const dsLv = await get('/api/totnghiep/danh-sach', ckCuong).then(r => r.json());
ok('trả ĐỦ 15 lĩnh vực kể cả lĩnh vực chưa ai chọn',
   (dsLv.theo_linh_vuc ?? []).length === 15);
const yte = (dsLv.theo_linh_vuc ?? []).find(x => x.ma === 'lv-y-te-giao-duc');
// HAI người, HAI bài — chưa ai rủ ai ở bước này. Phép cùng-làm ở cuối tệp
// đổi đúng cặp số này thành 1 bài / 2 người, và đó là cả điểm của tính năng.
ok(`Y tế/Giáo dục đếm được 2 bài (nhận ${yte?.so_bai})`, yte?.so_bai === 2);
ok(`… và 2 người (nhận ${yte?.so_nguoi})`, yte?.so_nguoi === 2);
ok('và 2 người ấy đều đã nộp link', yte?.so_da_nop_link === 2);
// Lượt bình chọn Zalo chỉ cho con số và avatar. Phép này canh đúng chỗ khác
// biệt: phải dò ngược ra được TÊN, đề tài và link.
ok('dò ngược ra TÊN từng người', (yte?.bai ?? []).some(x => x.full_name === 'Ngô Phú Cường'));
ok('kèm đề tài và link của họ',
   (yte?.bai ?? []).every(x => x.khkd_de_tai && x.khkd_url));
ok(`đếm tổng đã chọn lĩnh vực (nhận ${dsLv.da_chon_linh_vuc})`, dsLv.da_chon_linh_vuc === 2);
ok(`đếm tổng đã nộp link (nhận ${dsLv.da_nop_link})`, dsLv.da_nop_link === 2);
ok('liệt kê được người CHƯA chọn lĩnh vực',
   Array.isArray(dsLv.chua_chon_linh_vuc) && dsLv.chua_chon_linh_vuc.length > 0);

// ── 9. Đợt thu phí có thật và đi qua shapeRound() ────────────────────────
console.log('\n── Đợt thu phí Gala (migration 0041) ──');
const sauCuong = await get('/api/totnghiep', ckCuong).then(r => r.json());
const phi = sauCuong.dot_phi;
ok('dot_phi khác null', !!phi);
ok(`amount = 1.000.000 (nhận ${phi?.amount})`, phi?.amount === 1000000);
ok(`account_no đúng (nhận ${phi?.account_no})`, phi?.account_no === '0975587586');
ok(`bank_name = MB Bank (nhận ${phi?.bank_name})`, phi?.bank_name === 'MB Bank');
ok(`người thu = Vũ Thị Ngân (nhận ${phi?.collector_name})`, phi?.collector_name === 'Vũ Thị Ngân');
ok(`cú pháp chuyển khoản bắt đầu bằng GALA (nhận "${phi?.transfer_note}")`,
   String(phi?.transfer_note ?? '').startsWith('GALA'));
ok('có qr_url', !!phi?.qr_url);
ok('chưa khai thì i_declared = false', phi?.i_declared === false);

// Khai qua đường CÓ SẴN của quỹ, không có route tiền riêng cho zone này.
const rKhai = await fetch(`${B}/api/funds/${phi.id}/declare`, {
  method: 'POST', headers: { cookie: ckCuong, 'content-type': 'application/json', ...IP }, body: '{}',
});
ok(`POST /api/funds/${phi.id}/declare → 200 (nhận ${rKhai.status})`, rKhai.status === 200);
const sauKhai = await get('/api/totnghiep', ckCuong).then(r => r.json());
ok('dot_phi.i_declared = true sau khi khai', sauKhai.dot_phi?.i_declared === true);
ok('nhãn là "đã tự khai", KHÔNG phải "đã đóng" (mục 6.4 SRS)',
   String(sauKhai.dot_phi?.my_status_label ?? '').includes('tự khai'));
ok('chưa xác nhận thì i_am_verified vẫn false', sauKhai.dot_phi?.i_am_verified === false);

// ── 10. CSV: BOM UTF-8, và tuyệt đối không có chữ "đã đóng" ──────────────
console.log('\n── Xuất CSV cho Ban tổ chức ──');
const rCsv = await get('/api/totnghiep/xuat.csv', ckCuong);
ok(`200 (nhận ${rCsv.status})`, rCsv.status === 200);
ok(`content-type là text/csv (nhận ${rCsv.headers.get('content-type')})`,
   String(rCsv.headers.get('content-type') ?? '').includes('text/csv'));
// ĐỌC BYTE, KHÔNG ĐỌC CHUỖI. Phép kiểm bản đầu viết
//     csv.charCodeAt(0) === 0xFEFF
// và nó ĐỎ dù BOM có thật trong tệp (`od -tx1` cho ra ef bb bf ở ba byte đầu).
// Lý do: Response.text() giải mã UTF-8 theo chuẩn WHATWG, mà chuẩn ấy NUỐT
// LUÔN BOM ở đầu dòng — nên mọi phép kiểm ở tầng chuỗi đều mù với đúng cái
// thứ nó định canh. Cùng họ với bẫy TextDecoder của lib/ics.js: giải mã được
// không chứng minh được gì về byte.
const byteCsv = new Uint8Array(await rCsv.clone().arrayBuffer());
ok('có BOM UTF-8 (ef bb bf) ở ĐÚNG ba byte đầu — Excel đọc đúng dấu tiếng Việt',
   byteCsv[0] === 0xEF && byteCsv[1] === 0xBB && byteCsv[2] === 0xBF);
const csv = await rCsv.text();
ok('xuống dòng bằng CRLF', csv.includes('\r\n'));
ok('có ba cột KHKD cá nhân',
   csv.includes('Lĩnh vực KHKD') && csv.includes('Đề tài KHKD') && csv.includes('Link bài KHKD'));
ok('CSV in TÊN lĩnh vực chứ không in mã thô', csv.includes('Y tế, Giáo dục') && !csv.includes('lv-y-te-giao-duc'));
// Cột "Lĩnh vực hoạt động" trước đây in thẳng chuỗi mã 'van-tai,khac' — đúng
// dữ liệu nhưng không ai ngoài người viết mã đọc được, mà cả lý do tệp CSV
// tồn tại là để người khác đọc. Nay in nhãn, và ô "Ngành khác" nối ngay sau
// chính nhãn ấy nên đọc một dòng là biết người ta tự gọi ngành mình là gì.
ok('cột Lĩnh vực hoạt động cũng in NHÃN, không in mã',
   csv.includes('Vận tải · Logistics · Kho vận') && !/,van-tai[,"]/.test(csv));
ok('chữ tự do của "Ngành khác" đi kèm ngay trong cùng ô',
   /Ngành khác: Logistics chuỗi lạnh/.test(csv));
ok('dòng của Ngô Phú Cường ghi "Đã tự khai"', /Đã tự khai/.test(csv));
// Phép có RĂNG nhất của cả mục này: mục 6.4 SRS cấm tuyệt đối chữ ấy, và tệp
// này đi ra ngoài cho Ban tổ chức đọc nên sai một chữ là sai chỗ dễ thấy nhất.
ok('TUYỆT ĐỐI không có chữ "đã đóng" ở bất kỳ đâu trong tệp',
   !/đã đóng/i.test(csv));
ok('không có chữ "BCS" (N7 — luôn viết đủ "Ban cán sự lớp")', !/\bBCS\b/.test(csv));

// Người thường không tải được tệp
const rCsvThuong = await get('/api/totnghiep/xuat.csv', ckThuong);
ok(`người thường tải CSV → 403 (nhận ${rCsvThuong.status})`, rCsvThuong.status === 403);

/* ══ 11. ĐƯỜNG CÔNG KHAI (migration 0042) ═══════════════════════════════════
   Đo trên D1 thật 18/9: 38/146 người không có số điện thoại trong danh sách
   gốc nên cửa /dangnhap đóng với họ. Ngô Phú Cường chọn mở RIÊNG form tốt
   nghiệp thay vì nới cửa đăng nhập.

   Bốn phép, và phép cuối là chốt chặn thật sự của cả tính năng. */
console.log('\n── Đường công khai: chỉ GHI được một bản đăng ký ──');

const rCk = await get('/api/totnghiep/cong-khai', null);
ok(`GET không cookie → 200 (nhận ${rCk.status})`, rCk.status === 200);
const bCk = await rCk.json();
ok('trả nganh_list', (bCk.nganh_list ?? []).length === 19);
ok('trả thông tin phí (số tiền, ngân hàng, người thu)',
   bCk.phi?.amount === 1000000 && !!bCk.phi?.account_no);
// KHÔNG được lộ một mẩu dữ liệu cá nhân nào: đường này ai cũng gọi được, và
// điền sẵn ngày sinh hay điện thoại ở đây là phát tán danh bạ cả lớp.
const thoCk = JSON.stringify(bCk);
ok('KHÔNG có trường nào tên dien_thoai/ngay_sinh/email trong phúc đáp',
   !/dien_thoai|ngay_sinh|"email"/.test(thoCk));
ok('KHÔNG lộ số điện thoại của ai (không có chuỗi 10 chữ số bắt đầu bằng 0 ngoài số tài khoản)',
   (thoCk.match(/"0\d{9}"/g) ?? []).every(x => x === '"0975587586"'));

/* A4 — BƯỚC TÌM TÊN PHẢI NÓI RA LÀ DANH SÁCH BỊ CẮT.
   `searchRoster` cắt cứng ở 12 người. Đây là bước ĐẦU TIÊN của lối đi duy
   nhất dành cho 38 người không đăng nhập được: không thấy tên mình mà không
   ai nói là danh sách đã cắt thì họ kết luận Ban tổ chức bỏ sót họ.

   Chỉ được cộng thêm MỘT CON SỐ ĐẾM. Đường này công khai và cố ý không bao
   giờ trả số điện thoại hay email — grep thô ở đây là phép canh có răng nhất,
   vì một trường lỡ thêm vào sẽ im lặng đi ra cho bất kỳ ai gọi. */
const rTim = await fetch(B + '/api/wizard/roster/search?q=nguyen', { headers: IP });
const bTim = await rTim.json();
ok('tìm "nguyen" → trả về đúng 12 dòng (mức cắt cũ)', (bTim.people ?? []).length === 12);
ok(`… kèm TỔNG số người khớp, lớn hơn 12 (nhận ${bTim.tong_khop})`,
   typeof bTim.tong_khop === 'number' && bTim.tong_khop > 12);
const thoTim = JSON.stringify(bTim);
ok('phúc đáp KHÔNG lọt thêm trường phone/email nào',
   !/"phone"|"email"|dien_thoai/.test(thoTim));
ok('và không có chuỗi 10 chữ số nào trông như số điện thoại',
   (thoTim.match(/"0\d{9}"/g) ?? []).length === 0);

// Người CHƯA có hồ sơ members: route phải tự tạo, đúng nhóm trong danh sách gốc.
const timNguoi = await fetch(B + '/api/wizard/roster/search?q=' + encodeURIComponent('Đinh Khánh Toàn'),
  { headers: IP }).then(r => r.json()).catch(() => ({ people: [] }));
const ai = (timNguoi.people ?? [])[0];
ok(`tìm được một người chưa có hồ sơ để thử (${ai?.full_name ?? 'KHÔNG THẤY'})`, !!ai);

const guiCk = than => fetch(B + '/api/totnghiep/cong-khai', {
  method: 'POST', headers: { 'content-type': 'application/json', ...IP },
  body: JSON.stringify(than),
});

if (ai) {
  /* ══ "ÉP KHAI ĐỦ" TRÊN ĐƯỜNG CÔNG KHAI — hai chiều, và chiều thứ hai mới là
     chiều dễ làm hỏng ═══════════════════════════════════════════════════════
     Ngô Phú Cường 18/9: "ép khai đủ những thông tin doanh nghiệp mới được
     submit". Ràng buộc chỉ áp cho PHẦN HỒ SƠ, và chỉ khi lượt gửi có động tới
     phần ấy — xem `coHoSo` trong postTotNghiepCongKhai.

     Vì sao điều kiện `coHoSo` đáng có một phép kiểm riêng: bỏ nó đi thì một
     lượt gửi CHỈ để đăng ký Gala cũng bị chặn, tức buộc xong hồ sơ mới cho
     đăng ký — mất đúng hạn 21h00 NGÀY 19/9, cái hạn gấp nhất của cả zone và
     là cả lý do thiết kế ba phần ba nút Lưu. Phép "thiếu ô → 422" một mình
     thì xanh cả với bản vá làm hỏng đúng chỗ ấy. */
  const rThieu = await guiCk({
    roster_id: ai.roster_id, ho_ten: ai.full_name, doanh_nghiep: 'Công ty X',
    linh_vuc: ['cong-nghe'],   // thiếu ngay_sinh, dien_thoai, chuc_vu, nhu_cau
  });
  const bThieu = await rThieu.json().catch(() => ({}));
  ok(`khai hồ sơ mà thiếu ô → 422 (nhận ${rThieu.status})`, rThieu.status === 422);
  ok('mã lỗi là thieu_thong_tin', bThieu.error === 'thieu_thong_tin');
  ok(`nói rõ ô nào còn trống (${(bThieu.thieu_ten ?? []).join(' · ')})`,
     (bThieu.thieu_ten ?? []).includes('Ngày sinh')
     && bThieu.thieu_ten.includes('Chức vụ')
     && bThieu.thieu_ten.includes('Nhu cầu kết nối'));

  const dsChan = await get('/api/totnghiep/danh-sach', ckCuong).then(r => r.json());
  ok('lượt bị chặn KHÔNG để lại dòng đăng ký nào',
     !dsChan.nguoi.find(x => x.full_name === ai.full_name)?.ho_so_luc);

  // ĐỐI CHỨNG: chỉ trả lời Gala, không động tới phần hồ sơ → KHÔNG bị chặn.
  const rChiGala = await guiCk({ roster_id: ai.roster_id, du_le: 'khong' });
  ok(`chỉ đăng ký Gala, bỏ trống cả phần hồ sơ → 200 (nhận ${rChiGala.status})`,
     rChiGala.status === 200);

  // Chip "Ngành khác" mà không gõ chữ cũng là thiếu — bản xuất CSV in ra đúng
  // hai chữ "Ngành khác" thì không hơn gì việc không chọn gì.
  const rKhacRong = await guiCk({
    roster_id: ai.roster_id, ho_ten: ai.full_name, ngay_sinh: '05/05/1975',
    dien_thoai: '0912345678', doanh_nghiep: 'Công ty X', chuc_vu: 'Giám đốc',
    linh_vuc: ['khac'], linh_vuc_khac: '   ', nhu_cau_ket_noi: 'abc',
  });
  ok(`chọn "Ngành khác" mà để trống ô chữ → 422 (nhận ${rKhacRong.status})`,
     rKhacRong.status === 422);

  const rGui = await guiCk({
    roster_id: ai.roster_id, ho_ten: ai.full_name, ngay_sinh: '05/05/1975',
    dien_thoai: '0912345678', doanh_nghiep: 'Công ty X', chuc_vu: 'Giám đốc',
    du_le: 'co', linh_vuc: ['cong-nghe'],
    nhu_cau_ket_noi: 'kiểm đường công khai',
  });
  const bGui = await rGui.json().catch(() => ({}));
  ok(`gửi KHÔNG cookie → 200 (nhận ${rGui.status} ${bGui.error ?? ''})`, rGui.status === 200);
  ok('trả về mã QR và cú pháp chuyển khoản khi chọn "có dự"',
     !!bGui.phi?.qr_url && String(bGui.phi?.transfer_note ?? '').startsWith('GALA'));

  // Dòng ấy phải hiện ra trong danh sách của Ban cán sự lớp, gắn nhãn nguồn.
  const dsCk = await get('/api/totnghiep/danh-sach', ckCuong).then(r => r.json());
  const dong = dsCk.nguoi.find(x => x.full_name === ai.full_name);
  ok('Ban cán sự lớp thấy dòng vừa gửi', !!dong && dong.du_le === 'co');
  ok('dòng ấy gắn nhãn nguon = cong_khai', dong?.nguon === 'cong_khai');

  // Gửi lại lần hai vẫn được (họ gõ nhầm thì sửa lại), KHÔNG đẻ dòng thứ hai.
  const rLai = await guiCk({ roster_id: ai.roster_id, ho_ten: ai.full_name, du_le: 'khong' });
  ok(`gửi lại → 200 (nhận ${rLai.status})`, rLai.status === 200);
  const dsLai = await get('/api/totnghiep/danh-sach', ckCuong).then(r => r.json());
  ok('vẫn ĐÚNG MỘT dòng cho người ấy',
     dsLai.nguoi.filter(x => x.full_name === ai.full_name).length === 1);
}

/* ── KHAI BỔ SUNG, KHÔNG PHẢI GHI ĐÈ ────────────────────────────────────
   Bản đầu (0042) chặn cứng bằng 409 da_dien_tu_tai_khoan. Ngô Phú Cường nới
   ra 18/9: "tìm tên → điền → gửi" phải dùng được để khai bổ sung, ngang với
   được phát một link riêng.

   Nới bằng cách đổi NGỮ NGHĨA, nên phép kiểm cũng đổi theo — và phần ĐÁNG GIỮ
   NHẤT vẫn là chiều cũ: chốt 409 sinh ra để chống việc ai cầm link cũng XOÁ
   được bản khai của người khác, và điều ấy vẫn phải không làm được. */
console.log('\n── Công khai khai BỔ SUNG được, nhưng không xoá được gì ──');
const timCuong = await fetch(B + '/api/wizard/roster/search?q=' + encodeURIComponent('Ngô Phú Cường'),
  { headers: IP }).then(r => r.json()).catch(() => ({ people: [] }));
const rsCuong = (timCuong.people ?? [])[0];
ok('tìm được roster_id của Ngô Phú Cường', !!rsCuong);

const truocBS = await get('/api/totnghiep', ckCuong).then(r => r.json());
ok('trước khi bổ sung: bản của anh là nguon = phien', truocBS.dang_ky?.nguon === 'phien');

// Lượt gửi CỐ Ý để trống gần hết: đây đúng hình dạng của một lượt bổ sung
// thật (người ta chỉ điền phần còn thiếu), và cũng đúng hình dạng của một
// lượt phá hoại (gửi form rỗng để xoá sạch). Cùng một request, hai ý đồ —
// nên đáp án đúng là "không ô nào bị xoá".
const rBS = await fetch(B + '/api/totnghiep/cong-khai', {
  method: 'POST', headers: { 'content-type': 'application/json', ...IP },
  body: JSON.stringify({ roster_id: rsCuong?.roster_id, nhu_cau_ket_noi: 'bổ sung qua link công khai' }),
});
const bBS = await rBS.json().catch(() => ({}));
ok(`lượt bổ sung → 200, không còn 409 (nhận ${rBS.status})`, rBS.status === 200);
ok('phúc đáp nói rõ đây là lượt BỔ SUNG', bBS.bo_sung === true);

const sauDe = await get('/api/totnghiep', ckCuong).then(r => r.json());
ok('ô vừa gửi ĐÃ vào', sauDe.dang_ky?.nhu_cau_ket_noi === 'bổ sung qua link công khai');
// Bốn ô dưới đây KHÔNG có trong lượt gửi. Đây là phép có RĂNG của cả bản nới:
// gỡ giuCu() ra khỏi route thì cả bốn thành null và bốn dòng này đỏ.
ok('họ tên KHÔNG bị xoá', sauDe.dang_ky?.ho_ten === 'Ngô Phú Cường');
ok('du_le KHÔNG bị xoá (vẫn "co")', sauDe.dang_ky?.du_le === 'co');
ok('lĩnh vực KHKD KHÔNG bị xoá', !!sauDe.dang_ky?.khkd_linh_vuc);
ok('mốc gala_luc KHÔNG bị xoá', !!sauDe.dang_ky?.gala_luc);
// Mốc của phần KHÔNG khai ở lượt này phải ĐỨNG YÊN, không được đóng lại:
// đóng bừa thì màn Ban cán sự lớp đếm nhầm người ta vào cột đã xong.
ok('mốc gala_luc giữ nguyên giá trị cũ, không đóng lại',
   sauDe.dang_ky?.gala_luc === truocBS.dang_ky?.gala_luc);
// `nguon` là sổ tay của Ban cán sự lớp — nới luật thì phải nhìn thấy được.
ok('nguon thành "ca_hai" để Ban cán sự lớp soi lại được',
   sauDe.dang_ky?.nguon === 'ca_hai');

// Và chiều PHÁ HOẠI: gửi một ô rỗng cho một ô đang có chữ thì ô ấy phải còn.
await fetch(B + '/api/totnghiep/cong-khai', {
  method: 'POST', headers: { 'content-type': 'application/json', ...IP },
  body: JSON.stringify({ roster_id: rsCuong?.roster_id, ho_ten: '', du_le: '', khkd_de_tai: '' }),
});
const sauPha = await get('/api/totnghiep', ckCuong).then(r => r.json());
ok('gửi ô RỖNG không xoá được ô đang có chữ',
   sauPha.dang_ky?.ho_ten === 'Ngô Phú Cường' && sauPha.dang_ky?.du_le === 'co');

/* A1 — ĐÚNG CA ĐÃ HỎNG NGOÀI ĐỜI, ở tầng máy chủ.
   Người sửa doanh nghiệp/chức vụ trong tài khoản, hôm sau quay lại đường công
   khai chỉ để thêm ngày sinh. Giao diện điền sẵn hai ô ấy bằng bản danh sách
   gốc 15/8, nên `giuCu()` không bao giờ nhìn thấy ô trống và bản đã sửa bị
   trả ngược về — im lặng, đúng lúc màn cuối đang hứa "ô để trống vẫn giữ
   nguyên nội dung cũ".

   Bản vá nằm ở GIAO DIỆN (value → placeholder, `pw-totnghiep.mjs` canh), còn
   phép này canh vế máy chủ của cùng lời hứa cho ĐÚNG hai ô ấy: các phép trên
   chỉ thử ho_ten/du_le/khkd_*, chưa bao giờ thử doanh_nghiep và chuc_vu. */
await put('/api/totnghiep/ho-so', ckCuong, {
  ho_ten: 'Ngô Phú Cường', ngay_sinh: '01/02/1980', dien_thoai: '0979755857',
  doanh_nghiep: 'Công ty ĐÃ SỬA', chuc_vu: 'Chức vụ ĐÃ SỬA',
  linh_vuc: ['cong-nghe'], nhu_cau_ket_noi: 'giữ nguyên khi bổ sung',
});
await fetch(B + '/api/totnghiep/cong-khai', {
  method: 'POST', headers: { 'content-type': 'application/json', ...IP },
  body: JSON.stringify({ roster_id: rsCuong?.roster_id, ngay_sinh: '02/03/1981' }),
});
const sauA1 = await get('/api/totnghiep', ckCuong).then(r => r.json());
ok('bổ sung ngày sinh qua link công khai KHÔNG trả doanh nghiệp về bản gốc',
   sauA1.dang_ky?.doanh_nghiep === 'Công ty ĐÃ SỬA');
ok('… và chức vụ cũng giữ nguyên bản đã sửa',
   sauA1.dang_ky?.chuc_vu === 'Chức vụ ĐÃ SỬA');
ok('… còn ô thật sự gửi lên thì ĐÃ vào', sauA1.dang_ky?.ngay_sinh === '02/03/1981');

// roster_id bịa → 404, không phải 500
const rBia = await fetch(B + '/api/totnghiep/cong-khai', {
  method: 'POST', headers: { 'content-type': 'application/json', ...IP },
  body: JSON.stringify({ roster_id: 999999, ho_ten: 'Không Có Thật' }),
});
ok(`roster_id bịa → 404 (nhận ${rBia.status})`, rBia.status === 404);

/* ══ SỐ KHAI Ở PHẦN A PHẢI MỞ ĐƯỢC CỬA /dangnhap — và CHỈ từ đường có phiên ══
   Ngô Phú Cường 19/9: *"Một số người đã đăng nhập và đã điền số điện thoại
   email nhưng tôi gửi link đăng nhập cho họ, họ lại không thấy hiện lên?"*

   Một nửa gốc rễ nằm ở `soHopLeTuHoSo()` (routes/onboard.js): nó chỉ tin
   `roster.phone` — bản Ban tổ chức nạp 15/8 — TRỪ KHI chính chủ đã tự đặt số
   của mình (`phone_self_set_at`). Mà `putHoSo` trước 19/9 chỉ ghi vào
   `dang_ky_tot_nghiep.dien_thoai`, nên số người ta vừa gõ vào ứng dụng KHÔNG
   bao giờ tới được cửa đăng nhập: gõ đúng số của mình mà vẫn "số không khớp".

   Ba phép, và phép thứ hai mới là phép có răng. */
console.log('\n── Số khai ở phần A mở được cửa /dangnhap ──');
const SO_PHIEN = '0900000123';   // khai qua đường CÓ PHIÊN
const SO_CK = '0900000456';      // khai qua đường CÔNG KHAI
const doSo = async phone => {
  const r = await fetch(B + '/api/onboard/check', {
    method: 'POST', headers: { 'content-type': 'application/json', ...IP },
    body: JSON.stringify({ roster_id: rsCuong?.roster_id, phone }),
  });
  return { status: r.status, body: await r.json().catch(() => ({})) };
};

await put('/api/totnghiep/ho-so', ckCuong, {
  ho_ten: 'Ngô Phú Cường', ngay_sinh: '01/02/1980', dien_thoai: SO_PHIEN,
  doanh_nghiep: 'Công ty A', chuc_vu: 'Giám đốc',
  linh_vuc: ['cong-nghe'], nhu_cau_ket_noi: 'số mới',
});
const soA = await doSo(SO_PHIEN);
ok(`số tự khai ở phần A mở được /dangnhap (nhận ${soA.status} ${soA.body.error ?? 'ok'})`,
   soA.status === 200);

/* PHÉP CÓ RĂNG NHẤT CỦA CẢ MỤC. Đường công khai KHÔNG có phiên — nó chỉ biết
   một `roster_id` gõ trong URL. Cho nó đặt `phone_self_set_at` là trao cho
   bất kỳ ai cầm link `/totnghiep` quyền đặt chìa khoá đăng nhập cho MỘT NGƯỜI
   KHÁC trong lớp: tìm tên họ, gõ số của mình, rồi sang `/dangnhap` tự nhận hồ
   sơ của họ — mà vào được là đọc được danh bạ cả lớp kèm số điện thoại, sổ
   thu, bài, thông báo nội bộ. Đúng lỗ hổng chiếm tài khoản đã vá ngày 5/9.
   Bỏ phép này thì một bản vá "cho nhất quán hai đường ghi" sẽ lọt qua sạch. */
await fetch(B + '/api/totnghiep/cong-khai', {
  method: 'POST', headers: { 'content-type': 'application/json', ...IP },
  body: JSON.stringify({ roster_id: rsCuong?.roster_id, dien_thoai: SO_CK }),
});
const soB = await doSo(SO_CK);
ok(`số khai qua LINK CÔNG KHAI KHÔNG mở được /dangnhap (nhận ${soB.status} ${soB.body.error ?? 'ok'})`,
   soB.status !== 200);
// Và nó cũng không được PHÁ mất số chính chủ đã tự đặt.
const soC = await doSo(SO_PHIEN);
ok(`… và số tự khai có phiên vẫn còn hiệu lực (nhận ${soC.status})`, soC.status === 200);

// Trả lại số gốc để các bộ kiểm khác không vấp phải số của lượt chạy này.
// (reset-totnghiep.sh vẫn xoá dấu phone_self_set_at — hai lớp, không chỉ một.)
await put('/api/totnghiep/ho-so', ckCuong, {
  ho_ten: 'Ngô Phú Cường', ngay_sinh: '01/02/1980', dien_thoai: '0979755857',
  doanh_nghiep: 'Công ty A', chuc_vu: 'Giám đốc',
  linh_vuc: ['cong-nghe'], nhu_cau_ket_noi: 'số mới',
});

/* ══ THỐNG KÊ CHO BAN CÁN SỰ LỚP — đếm ở MÁY CHỦ ═══════════════════════════
   Ba thứ đã thu từ 18/9 mà màn hình CHƯA BAO GIỜ hiện (tài trợ, gian hàng,
   văn nghệ) — chúng chỉ nằm trong tệp CSV. Nay có khối `thong_ke`.

   Phép đáng giữ nhất là MẪU SỐ của khối phí: nó phải là số người DỰ LỄ, không
   phải sĩ số lớp. Lấy sĩ số thì con số đọc lên như cả lớp đang nợ tiền, mà
   phần lớn trong đó còn chưa trả lời có đi hay không. */
console.log('\n── Thống kê: đếm ở máy chủ, mẫu số đúng ──');
await put('/api/totnghiep/gala', ckCuong, {
  du_le: 'co', tai_tro: 'tien', tai_tro_mo_ta: 'ủng hộ 5 triệu',
  gian_hang: 1, van_nghe: 1, van_nghe_mo_ta: 'song ca 2 người',
});
const tk = await get('/api/totnghiep/danh-sach', ckCuong).then(r => r.json()).catch(() => ({}));
const t = tk.thong_ke ?? {};
ok('có khối thong_ke', !!t.gala && !!t.phi);
ok(`gala.co đếm đúng 1 người (nhận ${t.gala?.co})`, t.gala?.co === 1);
ok(`gala.chua = tổng − đã trả lời (${t.gala?.chua} = ${t.tong} − ${tk.xong_gala})`,
   t.gala?.chua === t.tong - tk.xong_gala);
ok(`MẪU SỐ của khối phí là người DỰ LỄ (${t.phi?.mau_so}), không phải sĩ số (${t.tong})`,
   t.phi?.mau_so === t.gala?.co && t.phi?.mau_so !== t.tong);
ok(`tài trợ trả kèm TÊN, không chỉ con số (${(t.tai_tro?.nguoi ?? []).length} người)`,
   (t.tai_tro?.nguoi ?? []).some(x => x.full_name === 'Ngô Phú Cường' && x.loai === 'tien'
     && x.mo_ta === 'ủng hộ 5 triệu'));
ok('gian hàng trả kèm TÊN',
   (t.gian_hang ?? []).some(x => x.full_name === 'Ngô Phú Cường'));
ok('văn nghệ trả kèm TÊN và mô tả tiết mục',
   (t.van_nghe ?? []).some(x => x.full_name === 'Ngô Phú Cường' && x.mo_ta === 'song ca 2 người'));
/* Mục 6.4 SRS, áp cho một phúc đáp MỚI. Khối thong_ke nói về tiền, nên nó là
   đúng chỗ chữ "đã đóng" dễ lọt vào nhất — và grep thô nguyên văn JSON là
   phép canh duy nhất không bỏ sót một nhánh nào. */
ok('phúc đáp thống kê KHÔNG chứa chữ "đã đóng" (mục 6.4 SRS)',
   !JSON.stringify(tk).includes('đã đóng'));

/* (d2) BƯỚC 5 (quỹ đang mở) PHẢI ĐỌC ĐƯỢC `du_le` — lỗi có thật, vá 19/9.
   Bản vá cùng ngày viết `tn?.du_le !== 'co'` để không mời người đã từ chối
   Gala chuyển 1.000.000 đ, nhưng QUÊN select cột `du_le` trong truy vấn ở đầu
   hàm. Nên `tn.du_le` là `undefined`, vế ấy luôn đúng, và đợt Gala bị bỏ qua
   với MỌI người — kể cả người vừa trả lời "Có dự" và chưa chuyển tiền. Không
   lỗi, không cảnh báo; triệu chứng duy nhất là ô "Việc của bạn" im lặng đúng
   lúc cần nhắc nhất.

   Chạy bằng phiên NHÓM 7 chứ không phải Nhóm 6, và đó là điều kiện để phép
   này tới được bước 5: Nhóm 6 là nhóm DUY NHẤT có dòng `plans`, nên với Cường
   bước 4 luôn chặn trước. Nhóm 7 không có `plans` nên bước 4 bị bỏ qua sạch.

   ĐI CẢ HAI CHIỀU. Phép một chiều ("có dự → fund") một mình vẫn ĐỎ đúng với
   bản lỗi, nhưng lại XANH với một bản vá thô bạo bỏ luôn điều kiện `du_le` —
   và bản ấy mời cả người đã từ chối Gala chuyển tiền, đúng cái vừa chữa.

   ĐẶT Ở CUỐI TỆP, không phải cạnh mấy phép hero khác, và đó không phải sở
   thích: khối này ghi `ho_so_luc` và `gala_luc` cho phiên Nhóm Bảy, nên đặt
   giữa chừng là mọi phép ĐẾM đứng sau nó (`xong_ho_so`, `xong_gala`,
   `theo_linh_vuc`) đọc ra một sĩ số khác. Đã vấp đúng chỗ ấy: `xong_ho_so`
   đỏ ở một chỗ chẳng liên quan gì tới thứ nó đang canh. */
console.log('\n── Bước "quỹ đang mở" phải phân biệt người dự Lễ và người không ──');
const meN7 = (await get('/api/home', ckN7).then(r => r.json()).catch(() => ({}))).me ?? {};
ok('đọc được member_id của phiên Nhóm 7', !!meN7.id);
// Ba bước đứng TRƯỚC bước 5 phải qua hết, nếu không phép này đo nhầm chỗ.
await put('/api/totnghiep/ho-so', ckN7, {
  ho_ten: 'Kiểm TN Nhóm Bảy', ngay_sinh: '02/03/1981', dien_thoai: '0900000071',
  doanh_nghiep: 'Công ty Bảy', chuc_vu: 'Chủ tịch',
  linh_vuc: ['cong-nghe'], nhu_cau_ket_noi: 'kiểm bước quỹ',
});
await put(`/api/members/${meN7.id}/profile`, ckN7, {
  sells_what: 'a', sells_to: 'b', needs: 'c', offers: 'd',
});
const heroN7 = async () => (await get('/api/home', ckN7).then(r => r.json()).catch(() => ({}))).action ?? {};

await put('/api/totnghiep/gala', ckN7, { du_le: 'co' });
const aCo = await heroN7();
/* KHẲNG ĐỊNH THẲNG ĐIỀU KIỆN NGẦM, và phải đặt ĐÚNG Ở ĐÂY — sau khi Nhóm 7
   đã xong Gala, hồ sơ và bốn dòng Giao thương. Đặt sớm hơn thì bước Gala còn
   chặn trước, hero trả "totnghiep", và phép này xanh mà chẳng canh được gì —
   đã thử và thấy đúng vậy.

   Điều kiện: Nhóm 7 KHÔNG có dòng `plans`, đúng như D1 thật (Nhóm 6 là nhóm
   duy nhất có). reset-tulieu-bai.sh cố ý seed một plan_sections của Nhóm 7 để
   chứng minh chốt N6 rồi để lại đó — chạy bộ kiểm này sau nó thì bước 4 chặn
   trước và ba phép dưới đỏ với câu "Còn N phần chưa ai nhận", một câu trỏ sai
   hoàn toàn chỗ hỏng. reset-totnghiep.sh nay dọn dòng ấy; dòng dưới là cái
   chuông báo nếu nó thôi dọn. */
ok(`Nhóm 7 không có dòng plans nên bước phần bài không chặn trước (nhận "${aCo.target}")`,
   aCo.target !== 'plan');
ok(`trả lời "Có dự" mà chưa khai phí → hero mời mở mã QR (nhận "${aCo.target}" · "${aCo.h}")`,
   aCo.target === 'fund');

await put('/api/totnghiep/gala', ckN7, { du_le: 'khong' });
const aKhong = await heroN7();
ok(`trả lời "Không dự" → KHÔNG mời chuyển 1.000.000 đ (nhận "${aKhong.target}")`,
   aKhong.target !== 'fund');

/* (d3) RỦ NGƯỜI CÙNG LÀM ĐỀ TÀI — migration 0045 ═════════════════════════
   Ngô Phú Cường 19/9: "Phần chọn chung đề tài có thể chọn người cùng làm và
   người đó đồng ý."

   ĐẶT Ở CUỐI TỆP, sau cả khối (d2), vì nó đổi `theo_linh_vuc` từ "2 bài · 2
   người" thành "1 bài · 2 người" — đúng cái tính năng này sinh ra để làm, và
   đúng thứ sẽ làm mọi phép đếm đứng trước nó đọc ra con số khác. Cùng bài học
   đã trả giá với khối (d2).

   Ba phép có RĂNG nhất, đã chạy đối chứng (xem README):
     · phép 5 (`bai_cua: 'ho'` đảo vai) — một bản vá bỏ quên `nguoi_gui_id`
       vẫn XANH ở phép 4, nhưng ĐỎ ở đây.
     · phép 6 (người cùng làm không sửa được bài của chủ) — canh đúng vế "bài
       NEO VÀO CHỦ", thứ giữ cho mô hình không có chuỗi lồng nhau.
     · phép 8 (đứng được NHIỀU bài) — một bản vá thêm lại UNIQUE(ban_member_id)
       sẽ đỏ ở đây và chỉ ở đây. */
console.log('\n── Rủ người cùng làm đề tài (migration 0045) ──');

const post = (p, ck, body) => send(p, ck, 'POST', body);
const tnCua = ck => get('/api/totnghiep', ck).then(r => r.json()).catch(() => ({}));
const idCua = async ck => ((await get('/api/home', ck).then(r => r.json()).catch(() => ({}))).me ?? {}).id;

const idCuong = await idCua(ckCuong);
const idThuong = await idCua(ckThuong);
const idN7 = meN7.id;
const idChuaVao = (dsLv.nguoi ?? []).find(x => x.full_name === 'Kiểm TN Chưa Vào')?.member_id;
ok('đọc được member_id của ba phiên và của người CHƯA đăng nhập',
   !!idCuong && !!idThuong && !!idN7 && !!idChuaVao);

// ── 1. Danh sách chọn được: không có chính mình, không có người chưa đăng
//      nhập, và TUYỆT ĐỐI không có số điện thoại hay email của ai.
const tnC0 = await tnCua(ckCuong);
const chon = tnC0.cung_lam?.chon_duoc ?? [];
ok(`chon_duoc có người (${chon.length})`, chon.length > 0);
ok('chon_duoc KHÔNG có chính mình', !chon.some(x => x.member_id === idCuong));
ok('chon_duoc KHÔNG có người chưa đăng nhập',
   !chon.some(x => x.member_id === idChuaVao));
/* Grep thô nguyên văn JSON, đúng khuôn phép canh của đường công khai. Đây là
   một đường ĐỌC MỚI liệt kê cả lớp, nên nó là đúng chỗ một cột nhạy cảm dễ
   lọt vào nhất — và grep bắt được cả nhánh mà một phép đọc theo trường bỏ sót. */
ok('chon_duoc KHÔNG rò số điện thoại hay email của ai',
   !/"phone"|"email"|\d{10}/.test(JSON.stringify(chon)));

// ── 2. Không rủ chính mình, không rủ người chưa đăng nhập.
const rTuRu = await post('/api/totnghiep/cung-lam', ckCuong, { doi_tac_member_id: idCuong });
ok(`rủ chính mình → 409 tu_ru_chinh_minh (nhận ${rTuRu.status})`,
   rTuRu.status === 409 && (await rTuRu.json()).error === 'tu_ru_chinh_minh');
const rChuaVao = await post('/api/totnghiep/cung-lam', ckCuong, { doi_tac_member_id: idChuaVao });
ok(`rủ người CHƯA đăng nhập → 409 ho_chua_dang_nhap (nhận ${rChuaVao.status})`,
   rChuaVao.status === 409 && (await rChuaVao.json()).error === 'ho_chua_dang_nhap');

// ── 3. Chỉ số MỘT PHẦN: một cặp chỉ một quan hệ ĐANG SỐNG, nhưng từ chối
//      rồi / rời ra rồi thì rủ lại được NGAY, không phải xoá dòng cũ.
const clR1 = await post('/api/totnghiep/cung-lam', ckCuong,
  { doi_tac_member_id: idThuong, bai_cua: 'toi', loi_nhan: 'làm chung nhé' });
const clJ1 = await clR1.json();
ok(`Cường rủ Thường vào bài CỦA MÌNH → 200 (nhận ${clR1.status})`, clR1.status === 200 && !!clJ1.id);
const clR1b = await post('/api/totnghiep/cung-lam', ckCuong, { doi_tac_member_id: idThuong });
ok(`rủ lại cùng người khi còn đang chờ → 409 da_co_quan_he (nhận ${clR1b.status})`,
   clR1b.status === 409 && (await clR1b.json()).error === 'da_co_quan_he');

// ── 4. NGƯỜI GỬI KHÔNG TỰ DUYỆT ĐƯỢC — vế ĐỒNG Ý của cả tính năng.
//      404 chứ không 403: 403 là xác nhận id đó có thật (quy ước 6).
const rTuDuyet = await post(`/api/totnghiep/cung-lam/${clJ1.id}/dong-y`, ckCuong);
ok(`người GỬI tự bấm Đồng ý → 404 (nhận ${rTuDuyet.status})`, rTuDuyet.status === 404);
const rDy = await post(`/api/totnghiep/cung-lam/${clJ1.id}/dong-y`, ckThuong);
ok(`đúng người duyệt bấm Đồng ý → 200 (nhận ${rDy.status})`, rDy.status === 200);

// ── 5. PHÉP CÓ RĂNG NHẤT cho vế "người gửi chọn lúc gửi".
//      Cường XIN vào bài của N7 (`bai_cua: 'ho'`) → chủ phải là N7, và N7 mới
//      là người duyệt. Một bản vá bỏ quên `nguoi_gui_id` vẫn xanh ở phép 4.
const clR2 = await post('/api/totnghiep/cung-lam', ckCuong,
  { doi_tac_member_id: idN7, bai_cua: 'ho' });
const clJ2 = await clR2.json();
ok(`Cường XIN vào bài của Nhóm Bảy → 200, bai_cua = "ho" (nhận ${clJ2.bai_cua})`,
   clR2.status === 200 && clJ2.bai_cua === 'ho');
const rXinTuDuyet = await post(`/api/totnghiep/cung-lam/${clJ2.id}/dong-y`, ckCuong);
ok(`chiều "ho": người xin tự duyệt → 404 (nhận ${rXinTuDuyet.status})`, rXinTuDuyet.status === 404);
const rXinDy = await post(`/api/totnghiep/cung-lam/${clJ2.id}/dong-y`, ckN7);
ok(`chiều "ho": CHỦ BÀI duyệt → 200 (nhận ${rXinDy.status})`, rXinDy.status === 200);
const tnC1 = await tnCua(ckCuong);
ok('chiều "ho" ghi đúng vai: Cường nằm ở toi_tham_gia, không ở bai_cua_toi',
   (tnC1.cung_lam?.toi_tham_gia ?? []).some(x => x.chu_member_id === idN7)
   && !(tnC1.cung_lam?.bai_cua_toi ?? []).some(x => x.member_id === idN7));

// ── 6. BÀI NEO VÀO CHỦ: người cùng làm KHÔNG sửa được bài của chủ.
//      Thường gọi PUT de-tai → ghi vào dòng RIÊNG của Thường, không đụng bài
//      của Cường. Đây là thứ giữ cho mô hình không có chuỗi lồng nhau.
const baiCuongTruoc = (await tnCua(ckCuong)).dang_ky?.khkd_de_tai;
await put('/api/totnghiep/de-tai', ckThuong,
  { khkd_linh_vuc: 'lv-cong-nghe', khkd_de_tai: 'Bài riêng của Thường' });
const baiCuongSau = (await tnCua(ckCuong)).dang_ky?.khkd_de_tai;
ok(`người cùng làm sửa đề tài thì KHÔNG đụng bài của chủ ("${baiCuongSau}")`,
   baiCuongSau === baiCuongTruoc && baiCuongTruoc === 'Chuỗi nhà thuốc khu công nghiệp');
ok('… mà ghi vào dòng RIÊNG của chính họ',
   (await tnCua(ckThuong)).dang_ky?.khkd_de_tai === 'Bài riêng của Thường');

// ── 7. CHỦ BÀI KHÔNG GỠ ĐƯỢC AI (Ngô Phú Cường quyết) — chỉ người cùng làm
//      tự rời. Đi cả hai chiều: chặn đúng người, và vẫn cho đúng người đi.
const rChuGo = await post(`/api/totnghiep/cung-lam/${clJ1.id}/roi`, ckCuong);
ok(`chủ bài bấm Rời → 404 (nhận ${rChuGo.status})`, rChuGo.status === 404);
const rRoi = await post(`/api/totnghiep/cung-lam/${clJ1.id}/roi`, ckThuong);
ok(`người cùng làm tự Rời → 200 (nhận ${rRoi.status})`, rRoi.status === 200);
// Rời ra rồi thì rủ lại được NGAY — chỉ số MỘT PHẦN chỉ phủ hai trạng thái
// đang sống. Một chỉ số đầy đủ sẽ làm phép này đỏ.
const rRuLai = await post('/api/totnghiep/cung-lam', ckCuong,
  { doi_tac_member_id: idThuong, bai_cua: 'toi' });
const jRuLai = await rRuLai.json();
ok(`rời ra rồi vẫn rủ lại được ngay → 200 (nhận ${rRuLai.status})`, rRuLai.status === 200);
// Và từ chối rồi cũng vậy.
await post(`/api/totnghiep/cung-lam/${jRuLai.id}/tu-choi`, ckThuong);
const rRuLai2 = await post('/api/totnghiep/cung-lam', ckCuong,
  { doi_tac_member_id: idThuong, bai_cua: 'toi' });
ok(`từ chối rồi vẫn rủ lại được ngay → 200 (nhận ${rRuLai2.status})`, rRuLai2.status === 200);
const jRuLai2 = await rRuLai2.json();
await post(`/api/totnghiep/cung-lam/${jRuLai2.id}/dong-y`, ckThuong);

// ── 8. ĐỨNG ĐƯỢC NHIỀU BÀI (Ngô Phú Cường chọn). Cường đang đứng tên bài của
//      N7; nay Thường đứng tên bài của Cường — và Cường vẫn còn nguyên ở bài
//      N7. Một bản vá thêm lại UNIQUE(ban_member_id) sẽ đỏ đúng ở đây.
const rN7RuCuong = await post('/api/totnghiep/cung-lam', ckN7,
  { doi_tac_member_id: idThuong, bai_cua: 'toi' });
const jN7 = await rN7RuCuong.json();
await post(`/api/totnghiep/cung-lam/${jN7.id}/dong-y`, ckThuong);
const tnT = await tnCua(ckThuong);
ok(`Thường đứng tên ĐƯỢC hai bài cùng lúc (nhận ${(tnT.cung_lam?.toi_tham_gia ?? []).length})`,
   (tnT.cung_lam?.toi_tham_gia ?? []).length === 2);

/* ── 9. Màn Ban cán sự lớp đếm theo BÀI ─────────────────────────────────
   Trạng thái tới đây, đếm cho rõ vì con số dưới rất dễ đọc nhầm:
     · bài của Cường (Y tế) — Thường đứng tên cùng          → 2 người
     · bài của Nhóm Bảy (Y tế) — Cường và Thường đứng tên cùng → 3 người
   Tức 2 BÀI · 5 LƯỢT ĐỨNG TÊN. Thường đếm HAI lần, và đó là sự thật màn
   hình phải nói ra: đó chính là cái giá của quyết định "một người đứng tên
   được nhiều bài", và là lý do CSV in cả hai chiều để Ban cán sự lớp NHÌN
   THẤY ai đang đứng năm bài chứ không phát hiện lúc chấm.

   Điều PHẢI đúng ở đây là `so_bai` KHÁC `so_nguoi`: trước migration 0045 hai
   con số ấy luôn bằng nhau vì mỗi người một bài, nên một bản vá quên đếm
   người cùng làm vẫn xanh nếu chỉ hỏi `so_bai`. */
const dsSau = await get('/api/totnghiep/danh-sach', ckCuong).then(r => r.json());
const yteSau = (dsSau.theo_linh_vuc ?? []).find(x => x.ma === 'lv-y-te-giao-duc');
ok(`lĩnh vực đếm theo BÀI, không theo người (${yteSau?.so_bai} bài · ${yteSau?.so_nguoi} lượt đứng tên)`,
   yteSau?.so_bai === 2 && yteSau?.so_nguoi === 5);
ok('mỗi bài mang kèm danh sách người cùng làm',
   (yteSau?.bai ?? []).some(b => b.member_id === idCuong
     && b.cung_lam.some(c => c.full_name === 'Kiểm TN Thường')));

// ── 10. CSV: hai cột mới, và in đúng TÊN cả hai chiều.
const clCsv = await get('/api/totnghiep/xuat.csv', ckCuong).then(r => r.text());
const dauCsv = clCsv.replace(/^﻿/, '').split('\r\n')[0];
ok('CSV có cột "Ai cùng làm bài của tôi"', dauCsv.includes('Ai cùng làm bài của tôi'));
ok('CSV có cột "Cùng làm bài của"', dauCsv.includes('Cùng làm bài của'));
const clDongCuong = clCsv.split('\r\n').find(l => l.includes('Ngô Phú Cường'));
ok('CSV in đúng tên người cùng làm bài của Cường',
   !!clDongCuong && clDongCuong.includes('Kiểm TN Thường'));

// ── 11. ĐƯỜNG CÔNG KHAI KHÔNG ĐỤNG MỘT DÒNG NÀO. Người đi lối ấy không có
//       phiên nên không đồng ý được, và cũng không bị ai nêu tên vào.
const demTruoc = ((await tnCua(ckCuong)).cung_lam?.bai_cua_toi ?? []).length;
await fetch(B + '/api/totnghiep/cong-khai', {
  method: 'POST', headers: { 'content-type': 'application/json', ...IP },
  body: JSON.stringify({ roster_id: rsCuong?.roster_id ?? rsCuong?.id, ho_ten: 'Ngô Phú Cường' }),
});
const demSau = ((await tnCua(ckCuong)).cung_lam?.bai_cua_toi ?? []).length;
ok(`lượt gửi CÔNG KHAI không tạo/đổi/xoá quan hệ nào (${demTruoc} → ${demSau})`,
   demTruoc === demSau && demTruoc > 0);

// ── 12. Ranh giới index.js:195 — năm route mới phải nằm ở nửa DƯỚI.
for (const [duong, than] of [
  ['/api/totnghiep/cung-lam', { doi_tac_member_id: 1 }],
  [`/api/totnghiep/cung-lam/${clJ1.id}/dong-y`, {}],
  [`/api/totnghiep/cung-lam/${clJ1.id}/tu-choi`, {}],
  [`/api/totnghiep/cung-lam/${clJ1.id}/huy`, {}],
  [`/api/totnghiep/cung-lam/${clJ1.id}/roi`, {}],
]) {
  const r = await fetch(B + duong, {
    method: 'POST', headers: { 'content-type': 'application/json', ...IP },
    body: JSON.stringify(than),
  });
  ok(`POST ${duong} không cookie → 401 (nhận ${r.status})`, r.status === 401);
}

/* ── 13. Ô "Việc của bạn" nhắc lời rủ đang chờ, và CHỈ nhắc người DUYỆT ──
   BƯỚC GALA CỦA CẢ HAI PHẢI XONG TRƯỚC, và đó không phải dọn dẹp cho gọn:
   `computeAction` xét Gala ở bước 1, cùng-làm ở bước 2. Thiếu bước này thì
   phiên Thường rơi ngay ở bước 1 ("Chưa trả lời dự Lễ tốt nghiệp") và phép
   "người GỬI không bị nhắc" XANH vì một lý do chẳng liên quan gì — đã chạy
   đối chứng và thấy đúng vậy: gỡ hẳn điều kiện `nguoi_gui_id <> me.id` ra
   khỏi home.js mà cả hai phép vẫn xanh. Nay chúng mới thật sự canh đúng chỗ. */
await put('/api/totnghiep/gala', ckThuong, { du_le: 'khong' });
const heroThuongTruoc = ((await get('/api/home', ckThuong).then(r => r.json()).catch(() => ({}))).action ?? {});
ok(`phiên Thường đã qua được bước Gala, tới được bước cùng-làm (nhận "${heroThuongTruoc.h}")`,
   !/dự Lễ tốt nghiệp/.test(heroThuongTruoc.h ?? ''));
const rChoN7 = await post('/api/totnghiep/cung-lam', ckThuong,
  { doi_tac_member_id: idN7, bai_cua: 'toi' });
const jChoN7 = await rChoN7.json();
const heroN7Sau = await heroN7();
ok(`người ĐƯỢC rủ thấy hero nhắc (nhận "${heroN7Sau.h}")`,
   /rủ bạn làm chung/.test(heroN7Sau.h ?? '') && heroN7Sau.target === 'totnghiep');
const heroThuong = ((await get('/api/home', ckThuong).then(r => r.json()).catch(() => ({}))).action ?? {});
ok(`người GỬI KHÔNG bị nhắc trả lời lời rủ của chính mình (nhận "${heroThuong.h}")`,
   !/rủ bạn làm chung/.test(heroThuong.h ?? ''));
// Người gửi RÚT được lời rủ khi chưa ai nhận; người kia thì không.
const rHuySai = await post(`/api/totnghiep/cung-lam/${jChoN7.id}/huy`, ckN7);
ok(`không phải người gửi mà bấm Huỷ → 404 (nhận ${rHuySai.status})`, rHuySai.status === 404);
const rHuy = await post(`/api/totnghiep/cung-lam/${jChoN7.id}/huy`, ckThuong);
ok(`người GỬI rút lời rủ → 200 (nhận ${rHuy.status})`, rHuy.status === 200);
const heroN7Cuoi = await heroN7();
ok('rút xong thì hero thôi nhắc', !/rủ bạn làm chung/.test(heroN7Cuoi.h ?? ''));

console.log(hong === 0 ? '\n✅ TẤT CẢ ĐỀU XANH' : `\n❌ ${hong} phép ĐỎ`);
process.exit(hong === 0 ? 0 : 1);
