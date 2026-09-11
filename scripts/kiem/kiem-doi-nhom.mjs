// Xin đổi nhóm — routes/doi-nhom.js (migration 0037).
//
// Ngô Phú Cường hỏi "ai là phê duyệt thì phù hợp" ngay sau migration 0036
// (chuyển tay Trương Thị Ngọc Anh, Nhóm 4 → Nhóm 6) — muốn việc này tự chạy
// được, không phải chờ tôi viết migration mỗi lần. Trả lời qua AskUserQuestion:
// TRƯỞNG/PHÓ NHÓM ĐÍCH duyệt, không phải Ban cán sự lớp, không phải cả hai
// nhóm cùng đồng ý.
//
// Chín phép ĐỐI CHỨNG:
//   1. Đang giữ chức (Ngô Phú Cường, trưởng Nhóm 6) → 409 dang_giu_chuc_nhom
//      khi tự xin đổi nhóm — đúng chốt "đầu vào" đã dùng cho ngừng tham gia,
//      dùng LẠI chucDangGiu() từ routes/members.js chứ không viết bản sao.
//   2. Nộp đơn hợp lệ (Nguyễn Thị Thu Hương, Nhóm 6 → Nhóm 7) → 200, và GET
//      lại thấy đúng trạng thái cho_duyet.
//   3. Nộp lại đích chính nhóm mình đang ở → 422 da_o_nhom_nay (không phụ
//      thuộc có đơn đang chờ hay không — chốt này đứng TRƯỚC bước ghi).
//   4. Nộp đơn THỨ HAI trong khi đơn đầu còn cho_duyet → 409
//      dang_co_don_cho_duyet (ux_doinhom_dang_cho, migration 0037).
//   5. Nhóm đích không tồn tại (99) → 422 nhom_khong_hop_le.
//   6. N6: officer của một nhóm KHÁC (không phải nhóm đích) cố duyệt HOẶC từ
//      chối đơn → 404 not_found ở CẢ HAI route, không phải 403 — 403 xác nhận
//      id đó có thật (quy ước 6 CLAUDE.md). Đây là phép quan trọng nhất: thiếu
//      điều kiện isGroupOfficer(me, yc.den_group_id) ở MỘT trong hai route là
//      cho phép nhóm bất kỳ duyệt/từ chối đơn không nhắm vào mình.
//   7. Officer ĐÚNG nhóm đích duyệt → 200, kèm nha_phan KHÔNG rỗng (người xin
//      đang giữ phần bài cuối của Nhóm 6 — đúng lỗi "phần bài không tự báo
//      lỗi" đã trả giá nhiều lần ở ngừng tham gia). Xác nhận bằng ba cách:
//      group_id đổi thật (đọc lại /api/danh-ba), phần bài ở Nhóm 6 đã về NULL
//      (đọc lại /api/plan), và đơn không còn nằm trong cho_nhom_toi của nhóm
//      đích nữa.
//   8. Duyệt/từ chối LẠI một đơn đã xử lý xong → 409 da_xu_ly_roi.
//   9. Từ chối (đơn thứ hai, Nhóm 7 → Nhóm 8) ghi đúng ly_do_tu_choi, người
//      xin đọc lại được qua chính GET của mình; rồi huỷ (đơn thứ ba, → Nhóm 9)
//      — người KHÁC không huỷ hộ được (404), chính chủ huỷ được (200), và sau
//      khi huỷ thì cua_toi lùi về đơn TRƯỚC ĐÓ còn ý nghĩa (tu_choi) chứ không
//      phải null — vì da_huy bị loại khỏi diện "đáng nói lại", đúng thiết kế
//      của getDoiNhom(), không phải một lỗ hổng.
//
// Chạy:  bash scripts/kiem/reset-doi-nhom.sh  &&  node scripts/kiem/kiem-doi-nhom.mjs

let hong = 0;
const ok = (t, d) => { console.log((d ? '  ✓ ' : '  ✗ ') + t); if (!d) hong++; };
const B = 'http://127.0.0.1:8787';
const IP = { 'cf-connecting-ip': '203.0.113.95' };

const ckCuong = 's=tk-cuong-doinhom';
const ckHuong = 's=tk-huong-doinhom';
const ckDich = 's=tk-truong-dich-doinhom';
const ckKhac = 's=tk-truong-khac-doinhom';

const get = (p, ck) => fetch(B + p, { headers: { cookie: ck, ...IP } });
const postJson = (p, ck, body) => fetch(B + p, {
  method: 'POST', headers: { cookie: ck, 'content-type': 'application/json', ...IP },
  body: JSON.stringify(body ?? {}),
});

// ── 0. Máy chủ có thật sự chạy, ba phiên thử có thật ─────────────────────
console.log('── Máy chủ có thật sự chạy không ──');
const health = await fetch(B + '/api/health').then(r => r.json()).catch(() => ({}));
ok(`/api/health trả roster_total = ${health.roster_total} (≥ 134)`, health.roster_total >= 134);

for (const [ten, ck] of [['Ngô Phú Cường', ckCuong], ['Nguyễn Thị Thu Hương', ckHuong],
                          ['Kiểm Đổi Nhóm Đích', ckDich], ['Kiểm Đổi Nhóm Khác', ckKhac]]) {
  const r = await get('/api/doi-nhom', ck);
  ok(`phiên ${ten} gọi /api/doi-nhom được (${r.status})`, r.status === 200);
}

// ── 1. Đang giữ chức thì không xin đổi nhóm được ─────────────────────────
console.log('\n── Đang giữ chức (Ngô Phú Cường, trưởng Nhóm 6) ──');
const dCuong = await get('/api/doi-nhom', ckCuong).then(r => r.json());
ok('dang_giu_chuc = true', dCuong.dang_giu_chuc === true);
const rCuongXin = await postJson('/api/doi-nhom', ckCuong, { den_nhom_so: 7 });
const bCuongXin = await rCuongXin.json().catch(() => ({}));
ok(`409 dang_giu_chuc_nhom (nhận ${rCuongXin.status} ${bCuongXin.error ?? ''})`,
   rCuongXin.status === 409 && bCuongXin.error === 'dang_giu_chuc_nhom');

// ── 2. Nộp đơn hợp lệ: Nguyễn Thị Thu Hương, Nhóm 6 → Nhóm 7 ─────────────
console.log('\n── Nộp đơn hợp lệ (Nhóm 6 → Nhóm 7) ──');
const dHuong = await get('/api/doi-nhom', ckHuong).then(r => r.json());
ok('dang_giu_chuc = false (thành viên thường)', dHuong.dang_giu_chuc === false);
ok('chưa có đơn nào đang chờ (cua_toi null)', dHuong.cua_toi === null);
ok('nhom trả đủ 10 nhóm', Array.isArray(dHuong.nhom) && dHuong.nhom.length === 10);

const rXin1 = await postJson('/api/doi-nhom', ckHuong, { den_nhom_so: 7, ly_do: 'muốn thử sức nhóm khác' });
const bXin1 = await rXin1.json().catch(() => ({}));
ok(`200, có id (nhận ${rXin1.status})`, rXin1.status === 200 && Number.isInteger(bXin1.id));
const donNhom7 = bXin1.id;

const dSauXin1 = await get('/api/doi-nhom', ckHuong).then(r => r.json());
ok('cua_toi.trang_thai = cho_duyet', dSauXin1.cua_toi?.trang_thai === 'cho_duyet');
ok('cua_toi.den_nhom_label = Nhóm 7', dSauXin1.cua_toi?.den_nhom_label === 'Nhóm 7');

// ── 3. Xin đích chính nhóm mình đang ở → 422 (đứng trước cả bước ghi) ────
const rTuXin = await postJson('/api/doi-nhom', ckHuong, { den_nhom_so: 6 });
const bTuXin = await rTuXin.json().catch(() => ({}));
ok(`422 da_o_nhom_nay (nhận ${rTuXin.status} ${bTuXin.error ?? ''})`,
   rTuXin.status === 422 && bTuXin.error === 'da_o_nhom_nay');

// ── 4. Nộp đơn thứ hai trong khi đơn đầu còn chờ → 409 ───────────────────
console.log('\n── Chồng đơn khi đơn trước còn chờ duyệt ──');
const rXinChong = await postJson('/api/doi-nhom', ckHuong, { den_nhom_so: 8 });
const bXinChong = await rXinChong.json().catch(() => ({}));
ok(`409 dang_co_don_cho_duyet (nhận ${rXinChong.status} ${bXinChong.error ?? ''})`,
   rXinChong.status === 409 && bXinChong.error === 'dang_co_don_cho_duyet');

// ── 5. Nhóm đích không tồn tại ────────────────────────────────────────────
const rNhomBay = await postJson('/api/doi-nhom', ckHuong, { den_nhom_so: 99 });
const bNhomBay = await rNhomBay.json().catch(() => ({}));
ok(`422 nhom_khong_hop_le (nhận ${rNhomBay.status} ${bNhomBay.error ?? ''})`,
   rNhomBay.status === 422 && bNhomBay.error === 'nhom_khong_hop_le');

// ── 6. N6: officer nhóm KHÁC không duyệt/từ chối được đơn không nhắm mình ─
console.log('\n── N6: Kiểm Đổi Nhóm Khác (Nhóm 8) đụng đơn nhắm Nhóm 7 ──');
const rSaiDuyet = await postJson(`/api/doi-nhom/${donNhom7}/duyet`, ckKhac);
const bSaiDuyet = await rSaiDuyet.json().catch(() => ({}));
ok(`duyệt → 404 not_found, không phải 403 (nhận ${rSaiDuyet.status} ${bSaiDuyet.error ?? ''})`,
   rSaiDuyet.status === 404 && bSaiDuyet.error === 'not_found');

const rSaiTuChoi = await postJson(`/api/doi-nhom/${donNhom7}/tu-choi`, ckKhac);
const bSaiTuChoi = await rSaiTuChoi.json().catch(() => ({}));
ok(`từ chối → 404 not_found, không phải 403 (nhận ${rSaiTuChoi.status} ${bSaiTuChoi.error ?? ''})`,
   rSaiTuChoi.status === 404 && bSaiTuChoi.error === 'not_found');

// ── 7. Officer ĐÚNG nhóm đích duyệt ───────────────────────────────────────
console.log('\n── Kiểm Đổi Nhóm Đích (Nhóm 7, đúng nhóm) duyệt ──');
const rDuyet = await postJson(`/api/doi-nhom/${donNhom7}/duyet`, ckDich);
const bDuyet = await rDuyet.json().catch(() => ({}));
ok(`200, full_name đúng (nhận ${rDuyet.status})`,
   rDuyet.status === 200 && bDuyet.full_name === 'Nguyễn Thị Thu Hương');
ok('nha_phan KHÔNG rỗng — phần bài cuối Nhóm 6 phải được nhả ra',
   Array.isArray(bDuyet.nha_phan) && bDuyet.nha_phan.length === 1);

const dbSauDuyet = await get('/api/danh-ba', ckCuong).then(r => r.json());
const huongSauDuyet = dbSauDuyet.nguoi.find(p => p.full_name === 'Nguyễn Thị Thu Hương');
ok(`group_id đổi thật — Danh bạ báo đúng Nhóm 7 (nhận "${huongSauDuyet?.group_label}")`,
   huongSauDuyet?.group_label === 'Nhóm 7');

const planSauDuyet = await get('/api/plan', ckCuong).then(r => r.json());
const phanCuoi = planSauDuyet.sections?.find(s => s.ord === 7);
ok('phần bài cuối Nhóm 6 đã về owner_member_id = null',
   phanCuoi && phanCuoi.owner_member_id === null);

const choDichSauDuyet = await get('/api/doi-nhom', ckDich).then(r => r.json());
ok('đơn không còn nằm trong cho_nhom_toi của Nhóm 7 nữa',
   !choDichSauDuyet.cho_nhom_toi.some(y => y.id === donNhom7));

// ── 8. Xử lý lại một đơn đã xong ─────────────────────────────────────────
const rDuyetLai = await postJson(`/api/doi-nhom/${donNhom7}/duyet`, ckDich);
const bDuyetLai = await rDuyetLai.json().catch(() => ({}));
ok(`duyệt lại → 409 da_xu_ly_roi (nhận ${rDuyetLai.status} ${bDuyetLai.error ?? ''})`,
   rDuyetLai.status === 409 && bDuyetLai.error === 'da_xu_ly_roi');

// ── 9. Từ chối rồi huỷ — Thu Hương giờ đã Ở Nhóm 7, xin tiếp sang Nhóm 8 ──
console.log('\n── Từ chối (Nhóm 7 → Nhóm 8), rồi huỷ (Nhóm 7 → Nhóm 9) ──');
const rXin2 = await postJson('/api/doi-nhom', ckHuong, { den_nhom_so: 8 });
const bXin2 = await rXin2.json().catch(() => ({}));
ok(`đơn thứ hai (Nhóm 7 → Nhóm 8) nộp được, 200 (nhận ${rXin2.status})`, rXin2.status === 200);
const donNhom8 = bXin2.id;

const rTuChoi = await postJson(`/api/doi-nhom/${donNhom8}/tu-choi`, ckKhac, { ly_do: 'nhóm đã đủ người' });
ok(`Kiểm Đổi Nhóm Khác (đúng nhóm đích lần này) từ chối được, 200 (nhận ${rTuChoi.status})`,
   rTuChoi.status === 200);

const dSauTuChoi = await get('/api/doi-nhom', ckHuong).then(r => r.json());
ok('cua_toi.trang_thai = tu_choi', dSauTuChoi.cua_toi?.trang_thai === 'tu_choi');
ok('ly_do_tu_choi đọc lại đúng — người xin phải thấy được vì sao',
   dSauTuChoi.cua_toi?.ly_do_tu_choi === 'nhóm đã đủ người');

const rXin3 = await postJson('/api/doi-nhom', ckHuong, { den_nhom_so: 9 });
const bXin3 = await rXin3.json().catch(() => ({}));
ok(`đơn thứ ba (→ Nhóm 9) nộp được sau khi bị từ chối, 200 (nhận ${rXin3.status})`, rXin3.status === 200);
const donNhom9 = bXin3.id;

const rHuyHo = await postJson(`/api/doi-nhom/${donNhom9}/huy`, ckDich);
const bHuyHo = await rHuyHo.json().catch(() => ({}));
ok(`người KHÁC không huỷ hộ được — 404 not_found (nhận ${rHuyHo.status} ${bHuyHo.error ?? ''})`,
   rHuyHo.status === 404 && bHuyHo.error === 'not_found');

const rHuy = await postJson(`/api/doi-nhom/${donNhom9}/huy`, ckHuong);
ok(`chính chủ huỷ được, 200 (nhận ${rHuy.status})`, rHuy.status === 200);

const dSauHuy = await get('/api/doi-nhom', ckHuong).then(r => r.json());
ok('sau khi huỷ, cua_toi lùi về đơn TRƯỚC ĐÓ còn ý nghĩa (tu_choi Nhóm 8) — da_huy không đáng nói lại',
   dSauHuy.cua_toi?.trang_thai === 'tu_choi' && dSauHuy.cua_toi?.id === donNhom8);

console.log(`\n${hong ? `✗ ${hong} phép kiểm đỏ` : '✓ tất cả xanh'}`);
process.exit(hong ? 1 : 0);
