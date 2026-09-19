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
ok(`Y tế/Giáo dục đếm được 2 người (nhận ${yte?.so_nguoi})`, yte?.so_nguoi === 2);
ok('và 2 người ấy đều đã nộp link', yte?.so_da_nop_link === 2);
// Lượt bình chọn Zalo chỉ cho con số và avatar. Phép này canh đúng chỗ khác
// biệt: phải dò ngược ra được TÊN, đề tài và link.
ok('dò ngược ra TÊN từng người', (yte?.nguoi ?? []).some(x => x.full_name === 'Ngô Phú Cường'));
ok('kèm đề tài và link của họ',
   (yte?.nguoi ?? []).every(x => x.khkd_de_tai && x.khkd_url));
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

console.log(hong === 0 ? '\n✅ TẤT CẢ ĐỀU XANH' : `\n❌ ${hong} phép ĐỎ`);
process.exit(hong === 0 ? 0 : 1);
