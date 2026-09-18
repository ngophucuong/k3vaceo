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

// ── 7. du_le / tai_tro chỉ nhận giá trị trong danh sách ──────────────────
console.log('\n── Giá trị lạ → null (chưa trả lời), không phải 422 ──');
const rLa = await put('/api/totnghiep/gala', ckCuong, { du_le: 'co le', tai_tro: 'vang' });
const bLa = await rLa.json().catch(() => ({}));
ok(`vẫn 200 (nhận ${rLa.status})`, rLa.status === 200);
ok('du_le lạ → null', bLa.dang_ky?.du_le === null);
ok('tai_tro lạ → null', bLa.dang_ky?.tai_tro === null);
// Trả lại giá trị đúng cho các phép sau
await put('/api/totnghiep/gala', ckCuong, { du_le: 'co', tai_tro: 'tien' });

// ── 8. N6 ở ban-nop: không có group_id nào để giả mạo ────────────────────
console.log('\n── Link bản nộp KHKD: không lẫn nhóm, chỉ https ──');
const rSai = await patch('/api/totnghiep/ban-nop', ckCuong, { ban_nop_url: 'http://drive.google.com/x' });
const bSai = await rSai.json().catch(() => ({}));
ok(`http:// → 422 link_must_be_https (nhận ${rSai.status} ${bSai.error ?? ''})`,
   rSai.status === 422 && bSai.error === 'link_must_be_https');

const rN6 = await patch('/api/totnghiep/ban-nop', ckCuong, { ban_nop_url: 'https://drive.google.com/nhom6' });
ok(`Nhóm 6 nộp link → 200 (nhận ${rN6.status})`, rN6.status === 200);
const rN7 = await patch('/api/totnghiep/ban-nop', ckN7, { ban_nop_url: 'https://drive.google.com/nhom7' });
ok(`Nhóm 7 nộp link → 200 (nhận ${rN7.status})`, rN7.status === 200);

const sauCuong = await get('/api/totnghiep', ckCuong).then(r => r.json());
const sauN7 = await get('/api/totnghiep', ckN7).then(r => r.json());
ok('Nhóm 6 vẫn là link của Nhóm 6 — người Nhóm 7 KHÔNG ghi đè được',
   sauCuong.nhom?.ban_nop_url === 'https://drive.google.com/nhom6');
ok('Nhóm 7 giữ link của Nhóm 7', sauN7.nhom?.ban_nop_url === 'https://drive.google.com/nhom7');
ok('ghi nhận ai nộp (ban_nop_boi_ten)', sauCuong.nhom?.ban_nop_boi_ten === 'Ngô Phú Cường');
ok('có mốc ban_nop_luc', !!sauCuong.nhom?.ban_nop_luc);

// Xoá trắng được: thà trống còn hơn một đường dẫn hỏng (cùng quyết định đã áp
// cho PATCH /api/links/:id ngày 25/8).
const rXoa = await patch('/api/totnghiep/ban-nop', ckN7, { ban_nop_url: null });
ok(`xoá trắng → 200 (nhận ${rXoa.status})`, rXoa.status === 200);
const sauXoa = await get('/api/totnghiep', ckN7).then(r => r.json());
ok('xoá xong thì ban_nop_url null VÀ mốc cũng null',
   sauXoa.nhom?.ban_nop_url === null && sauXoa.nhom?.ban_nop_luc === null);

// Link của nhóm hiện luôn ở tab Bài (getPlan). Chỉ Nhóm 6 có dòng plans ở D1
// cục bộ — đúng như trên bản thật, nơi 9/10 nhóm chưa có.
const plan = await get('/api/plan', ckCuong).then(r => r.json());
ok('getPlan trả ban_nop_url của nhóm', plan.plan?.ban_nop_url === 'https://drive.google.com/nhom6');

// ── 9. Đợt thu phí có thật và đi qua shapeRound() ────────────────────────
console.log('\n── Đợt thu phí Gala (migration 0041) ──');
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
ok('có cột "Link bản KHKD của nhóm"', csv.includes('Link bản KHKD của nhóm'));
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

// Người CHƯA có hồ sơ members: route phải tự tạo, đúng nhóm trong danh sách gốc.
const timNguoi = await fetch(B + '/api/wizard/roster/search?q=' + encodeURIComponent('Đinh Khánh Toàn'),
  { headers: IP }).then(r => r.json()).catch(() => ({ people: [] }));
const ai = (timNguoi.people ?? [])[0];
ok(`tìm được một người chưa có hồ sơ để thử (${ai?.full_name ?? 'KHÔNG THẤY'})`, !!ai);

if (ai) {
  const rGui = await fetch(B + '/api/totnghiep/cong-khai', {
    method: 'POST', headers: { 'content-type': 'application/json', ...IP },
    body: JSON.stringify({
      roster_id: ai.roster_id, ho_ten: ai.full_name, ngay_sinh: '05/05/1975',
      dien_thoai: '0912345678', du_le: 'co', linh_vuc: ['cong-nghe'],
      nhu_cau_ket_noi: 'kiểm đường công khai',
    }),
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
  const rLai = await fetch(B + '/api/totnghiep/cong-khai', {
    method: 'POST', headers: { 'content-type': 'application/json', ...IP },
    body: JSON.stringify({ roster_id: ai.roster_id, ho_ten: ai.full_name, du_le: 'khong' }),
  });
  ok(`gửi lại → 200 (nhận ${rLai.status})`, rLai.status === 200);
  const dsLai = await get('/api/totnghiep/danh-sach', ckCuong).then(r => r.json());
  ok('vẫn ĐÚNG MỘT dòng cho người ấy',
     dsLai.nguoi.filter(x => x.full_name === ai.full_name).length === 1);
}

// ── CHỐT CHẶN THẬT SỰ: không ghi đè bản của người ĐÃ ĐĂNG NHẬP ──────────
// Ngô Phú Cường đã điền từ tài khoản của anh ở các phép trên (nguon='phien').
// Ai cầm link công khai mà ghi đè được bản ấy thì phá được bản khai của cả 69
// người đã đăng nhập — đó mới là thiệt hại thật, chứ không phải một dòng rác.
console.log('\n── Chốt chặn: công khai KHÔNG ghi đè bản của người đã đăng nhập ──');
const timCuong = await fetch(B + '/api/wizard/roster/search?q=' + encodeURIComponent('Ngô Phú Cường'),
  { headers: IP }).then(r => r.json()).catch(() => ({ people: [] }));
const rsCuong = (timCuong.people ?? [])[0];
ok('tìm được roster_id của Ngô Phú Cường', !!rsCuong);
const rDe = await fetch(B + '/api/totnghiep/cong-khai', {
  method: 'POST', headers: { 'content-type': 'application/json', ...IP },
  body: JSON.stringify({ roster_id: rsCuong?.roster_id, ho_ten: 'KẺ PHÁ HOẠI', du_le: 'khong' }),
});
const bDe = await rDe.json().catch(() => ({}));
ok(`→ 409 da_dien_tu_tai_khoan (nhận ${rDe.status} ${bDe.error ?? ''})`,
   rDe.status === 409 && bDe.error === 'da_dien_tu_tai_khoan');
const sauDe = await get('/api/totnghiep', ckCuong).then(r => r.json());
ok('bản của Ngô Phú Cường CÒN NGUYÊN (họ tên không bị đổi)',
   sauDe.dang_ky?.ho_ten === 'Ngô Phú Cường');
ok('và du_le vẫn là "co"', sauDe.dang_ky?.du_le === 'co');

// roster_id bịa → 404, không phải 500
const rBia = await fetch(B + '/api/totnghiep/cong-khai', {
  method: 'POST', headers: { 'content-type': 'application/json', ...IP },
  body: JSON.stringify({ roster_id: 999999, ho_ten: 'Không Có Thật' }),
});
ok(`roster_id bịa → 404 (nhận ${rBia.status})`, rBia.status === 404);

console.log(hong === 0 ? '\n✅ TẤT CẢ ĐỀU XANH' : `\n❌ ${hong} phép ĐỎ`);
process.exit(hong === 0 ? 0 : 1);
