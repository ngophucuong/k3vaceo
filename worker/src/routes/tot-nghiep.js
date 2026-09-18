import { json, error, readJson } from '../lib/http.js';
import { isClassCommittee, logAudit, logActivity } from '../permissions.js';
import { cleanText } from '../lib/validate.js';
import { NGANH, nganhRaChuoi } from '../lib/nganh.js';
import { LINH_VUC_KHKD, docLinhVucKhkd, tenLinhVucKhkd } from '../lib/linh-vuc-khkd.js';
import { shapeRound } from './funds.js';
import { conQuota, ghiNhan } from '../lib/ratelimit.js';
import { buildTransferNote, buildQrUrl } from '../lib/vietqr.js';
import { driveCauHinh, taiLenDrive, taoThuMuc } from '../lib/drive.js';
import { doanLoaiAnh, TOI_DA_BYTE } from '../lib/anh.js';

/* ══ Zone "Lễ tốt nghiệp" — /totnghiep ══════════════════════════════════════
   Ngô Phú Cường đưa 15 câu Ban tổ chức muốn thu để chuẩn bị Lễ tốt nghiệp
   26/9. Lý lẽ đầy đủ ở migrations/0041_dang_ky_tot_nghiep.sql — đọc ở đó
   trước khi sửa file này.

   Ba phần, BA HẠN KHÁC NHAU, nên lưu độc lập:
     A · Hồ sơ & chứng chỉ   PUT /api/totnghiep/ho-so    hạn 26/9
     B · Đề tài KHKD         PUT /api/totnghiep/de-tai   hạn 26/9, của CÁ NHÂN
     C · Lễ + Gala           PUT /api/totnghiep/gala     hạn 21h00 NGÀY 19/9

   Phần B sáng 18/9 nộp theo NHÓM (PATCH /api/totnghiep/ban-nop, ghi vào
   groups.ban_nop_*). Chiều cùng ngày lớp đổi cách nộp bài — nay theo LĨNH VỰC
   và theo cá nhân, đường cũ GỠ HẲN. Lý lẽ ở migrations/0043_de_tai_theo_linh_
   vuc.sql, danh mục 15 lĩnh vực ở lib/linh-vuc-khkd.js.

   SÁU route đầu CẦN PHIÊN — đăng ký trong index.js ở nửa DƯỚI dòng
   getCurrentMember. HAI route công khai (…/cong-khai, migration 0042) nằm ở
   nửa TRÊN, ngược hẳn. Ranh giới công khai/cần-phiên của router này là VỊ TRÍ
   DÒNG chứ không phải một cờ nào, nên đặt nhầm một dòng lên nửa trên là nó
   thành công khai mà không phép kiểm nào kêu lên — deploy.yml canh CẢ HAI
   chiều trên tên miền thật.
   ═══════════════════════════════════════════════════════════════════════════ */

// Hạn đăng ký Gala theo thư mời Ban tổ chức. Giao diện dùng để nói "còn N giờ"
// chứ KHÔNG dùng để chặn: ai đăng ký muộn vẫn ghi được, và Ban cán sự lớp đọc
// mốc gala_luc để biết ai kịp ai không. Chặn cứng thì người lỡ hạn không còn
// đường nào báo là mình muốn đi, mà đó lại đúng là lúc cần biết nhất.
const HAN_GALA = '2026-09-19 21:00';
const NGAY_LE = '2026-09-26';

const DU_LE = ['co', 'khong'];
const TAI_TRO = ['tien', 'hien_vat', 'khong'];

// Một chuỗi chỉ được nhận nếu nằm trong danh sách. Giá trị lạ → null (chưa
// trả lời) chứ không phải lỗi 422: cùng lý lẽ docNganh() đã ghi — một giá trị
// thừa từ giao diện cũ còn trong đệm trình duyệt không nên làm người dùng mất
// nguyên phần vừa gõ.
const motTrong = (v, ds) => (ds.includes(String(v ?? '')) ? String(v) : null);
const coKhong = v => (v === 1 || v === true || v === '1' ? 1 : 0);

/* Ô chữ tự do đi kèm chip "Ngành khác" (migration 0044). Lý do có nó, và con
   số soi được trước khi làm, nằm trong chính migration ấy.

   CHỈ GIỮ KHI CHIP `khac` CÒN ĐƯỢC CHỌN — bỏ chip mà vẫn giữ chữ thì bản xuất
   CSV in ra một ngành mà người ấy đã thôi khai, và không màn nào lộ ra để họ
   sửa: giao diện ẩn luôn ô chữ khi chip tắt. Ràng buộc "chữ chỉ sống cùng
   chip" phải đặt ở MÁY CHỦ chứ không ở giao diện (quy ước 6), vì đây là chỗ
   duy nhất cả hai đường ghi — có phiên và công khai — cùng đi qua. */
function docLinhVucKhac(chuoiNganh, giaTri) {
  const coChipKhac = String(chuoiNganh ?? '').split(',').includes('khac');
  return coChipKhac ? cleanText(giaTri, 120) : null;
}

/* Mã ngành → NHÃN, cho bản xuất CSV mà Ban tổ chức mở bằng Excel.
   Cột này vốn in thẳng chuỗi thô 'van-tai,thuong-mai' — đúng dữ liệu nhưng
   không ai ngoài người viết mã đọc được, mà cả lý do tệp CSV tồn tại là để
   người khác đọc. Ô "Ngành khác" nối vào ngay sau chính nhãn ấy, nên đọc một
   dòng là biết người ta tự gọi ngành mình là gì. */
function tenNganhDoc(chuoi, khac) {
  const ten = String(chuoi ?? '').split(',').filter(Boolean)
    .map(ma => NGANH.find(n => n.ma === ma)?.ten ?? ma);
  const chuKhac = cleanText(khac, 120);
  if (chuKhac) {
    const i = ten.findIndex(t => t === 'Ngành khác');
    if (i >= 0) ten[i] = `Ngành khác: ${chuKhac}`;
    else ten.push(`Ngành khác: ${chuKhac}`);
  }
  return ten.join(' · ');
}

async function docDangKy(env, memberId) {
  return env.DB.prepare(
    'SELECT * FROM dang_ky_tot_nghiep WHERE member_id = ?'
  ).bind(memberId).first();
}

/* ── Màn hình chỉ gọi MỘT lượt ────────────────────────────────────────────
   Gộp sẵn mọi thứ: hồ sơ điền sẵn, danh mục ngành, đề tài + link của nhóm,
   danh sách thành viên, đợt thu phí kèm QR, và bản đăng ký đã lưu nếu có. */
export async function getTotNghiep(env, me) {
  const [dk, hoSoGoc, nhom, thanhVien, officers, dotPhi] = await Promise.all([
    docDangKy(env, me.id),
    // roster.dob là nguồn DUY NHẤT của ngày sinh — members không có cột này.
    // LEFT JOIN vì người thêm tay (không qua roster) vẫn phải mở form được.
    env.DB.prepare(
      `SELECT r.dob, mp.needs, mp.nganh, mp.mo_ta
         FROM members m
         LEFT JOIN roster r ON r.id = m.roster_id
         LEFT JOIN member_profile mp ON mp.member_id = m.id
        WHERE m.id = ?`
    ).bind(me.id).first(),
    me.group_id
      ? env.DB.prepare(
          `SELECT g.id, g.no, g.label, p.topic_product, p.topic_customers
             FROM groups g LEFT JOIN plans p ON p.group_id = g.id
            WHERE g.id = ?`
        ).bind(me.group_id).first()
      : null,
    me.group_id
      ? env.DB.prepare(
          'SELECT full_name FROM members WHERE group_id = ? AND is_active = 1 ORDER BY full_name COLLATE NOCASE'
        ).bind(me.group_id).all()
      : { results: [] },
    me.group_id
      ? env.DB.prepare(
          `SELECT o.role, m.full_name FROM officers o
             JOIN members m ON m.id = o.member_id
            WHERE o.group_id = ? AND o.superseded_at IS NULL
              AND o.role IN ('truong_nhom', 'pho_nhom', 'tieu_bieu')`
        ).bind(me.group_id).all()
      : { results: [] },
    // Đợt thu phí Gala — migration 0041 dựng nó với đúng ba dấu này. Tìm theo
    // (scope, amount, account_no) chứ không theo tiêu đề: tiêu đề sửa được
    // bằng nút ✎ trong ứng dụng, so tên là có ngày form mất mã QR mà không
    // chỗ nào báo lỗi.
    env.DB.prepare(
      `SELECT * FROM fund_rounds
        WHERE cohort_id = ? AND scope = 'class' AND amount = 1000000
          AND account_no = '0975587586' LIMIT 1`
    ).bind(me.cohort_id).first(),
  ]);

  return json({
    han_gala: HAN_GALA,
    ngay_le: NGAY_LE,
    nganh_list: NGANH,
    linh_vuc_khkd_list: LINH_VUC_KHKD,
    la_ban_can_su: await isClassCommittee(env, me.id),
    // Chưa có khoá Drive thì giao diện ẨN HẲN ô chọn ảnh, không bày một nút
    // bấm vào là 503 — đúng khuôn đã dùng cho thẻ trợ lý và nút thông báo đẩy.
    // Cờ thôi, KHÔNG BAO GIỜ trả một mẩu nào của khoá ra đây.
    drive_bat: !!driveCauHinh(env),
    // Điền sẵn từ những gì D1 đã biết. Giao diện chỉ dùng phần này khi CHƯA có
    // bản đăng ký — đã lưu rồi thì đọc từ `dang_ky` để không đè bản người ta
    // vừa sửa bằng bản gốc (quy ước 3 CLAUDE.md, lỗi mất dữ liệu Đợt 1).
    goi_y: {
      ho_ten: me.full_name,
      // NGUYÊN VĂN, không chuẩn hoá. 28/146 dòng chỉ có năm ('1966') và 11
      // dòng trống — đo trên D1 thật 18/9. Giao diện gắn nhãn "kiểm lại giúp"
      // khi chuỗi không khớp dd/mm/yyyy, chứ máy chủ không đoán hộ ngày tháng.
      ngay_sinh: hoSoGoc?.dob ?? null,
      dien_thoai: me.phone,
      doanh_nghiep: me.company,
      mo_ta_dn: hoSoGoc?.mo_ta ?? null,
      linh_vuc: hoSoGoc?.nganh ?? null,
      chuc_vu: me.title,
      nhu_cau_ket_noi: hoSoGoc?.needs ?? null,
    },
    dang_ky: dk ?? null,
    // Dùng LẠI shapeRound() của funds.js, không chép trường sang hình dạng
    // thứ hai: nhãn trạng thái ("đã tự khai" / "người thu đã nhận", mục 6.4
    // SRS), cú pháp chuyển khoản và đường dựng QR chỉ có một nguồn. Đường GHI
    // vẫn là POST /api/funds/:id/declare có sẵn — zone này không có route
    // tiền nào của riêng nó.
    dot_phi: dotPhi ? await shapeRound(env, dotPhi, me) : null,
    nhom: nhom
      ? {
          no: nhom.no,
          label: nhom.label,
          topic_product: nhom.topic_product ?? null,
          topic_customers: nhom.topic_customers ?? null,
          truong_nhom: (officers.results ?? []).find(o => o.role === 'truong_nhom')?.full_name ?? null,
          thanh_vien: (thanhVien.results ?? []).map(x => x.full_name),
        }
      : null,
  });
}

/* ── Phần A: hồ sơ & chứng chỉ ────────────────────────────────────────────
   Không nhận member_id trong thân — chính chủ tự khai, đúng khuôn
   putGianHang và PUT /api/me/mail-thong-bao. Không có chỗ nào để dò. */
export async function putHoSo(request, env, me) {
  const body = await readJson(request);
  const cu = await docDangKy(env, me.id);

  const dat = {
    ho_ten: cleanText(body.ho_ten, 120),
    ngay_sinh: cleanText(body.ngay_sinh, 20),
    dien_thoai: cleanText(body.dien_thoai, 20),
    doanh_nghiep: cleanText(body.doanh_nghiep, 200),
    linh_vuc: nganhRaChuoi(body.linh_vuc),
    chuc_vu: cleanText(body.chuc_vu, 120),
    nhu_cau_ket_noi: cleanText(body.nhu_cau_ket_noi, 500),
  };
  dat.linh_vuc_khac = docLinhVucKhac(dat.linh_vuc, body.linh_vuc_khac);

  await env.DB.prepare(
    `INSERT INTO dang_ky_tot_nghiep
       (member_id, ho_ten, ngay_sinh, dien_thoai, doanh_nghiep, linh_vuc,
        linh_vuc_khac, chuc_vu, nhu_cau_ket_noi, ho_so_luc, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
     ON CONFLICT(member_id) DO UPDATE SET
       ho_ten = excluded.ho_ten, ngay_sinh = excluded.ngay_sinh,
       dien_thoai = excluded.dien_thoai, doanh_nghiep = excluded.doanh_nghiep,
       linh_vuc = excluded.linh_vuc, linh_vuc_khac = excluded.linh_vuc_khac,
       chuc_vu = excluded.chuc_vu,
       nhu_cau_ket_noi = excluded.nhu_cau_ket_noi,
       ho_so_luc = excluded.ho_so_luc, updated_at = excluded.updated_at`
  ).bind(
    me.id, dat.ho_ten, dat.ngay_sinh, dat.dien_thoai, dat.doanh_nghiep,
    dat.linh_vuc, dat.linh_vuc_khac, dat.chuc_vu, dat.nhu_cau_ket_noi
  ).run();

  // Chỉ ghi hoạt động LẦN ĐẦU. Sửa lại một chữ mà đẩy thêm một dòng vào feed
  // "Đang diễn ra" của cả nhóm thì feed thành sổ nháp của một người.
  if (!cu?.ho_so_luc) {
    await logActivity(env, {
      cohortId: me.cohort_id, groupId: me.group_id, actorId: me.id,
      verb: 'totnghiep.hoso', objectType: 'dang_ky_tot_nghiep', objectId: me.id,
      summary: 'điền hồ sơ làm chứng chỉ tốt nghiệp',
    });
  }
  return json({ ok: true, dang_ky: await docDangKy(env, me.id) });
}

/* ── Phần C: Lễ tốt nghiệp & Gala ─────────────────────────────────────────
   KHÔNG có trường nào tên "đã đóng phí". Mục 6.4 SRS cấm tuyệt đối chữ ấy;
   trạng thái tiền đọc từ fund_declarations (người ta bấm "Tôi đã chuyển
   khoản" ở tab Quỹ), và chỉ thành "người thu đã nhận" khi chị Ngân soi sao
   kê xác nhận. Chép một cờ "đã đóng" vào đây là dựng nguồn sự thật thứ hai
   cho tiền — thứ nguy hiểm nhất có thể làm. */
export async function putGala(request, env, me) {
  const body = await readJson(request);
  const cu = await docDangKy(env, me.id);

  const duLe = motTrong(body.du_le, DU_LE);
  const taiTro = motTrong(body.tai_tro, TAI_TRO);
  const vanNghe = coKhong(body.van_nghe);

  await env.DB.prepare(
    `INSERT INTO dang_ky_tot_nghiep
       (member_id, du_le, tai_tro, tai_tro_mo_ta, gian_hang, van_nghe,
        van_nghe_mo_ta, gala_luc, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
     ON CONFLICT(member_id) DO UPDATE SET
       du_le = excluded.du_le, tai_tro = excluded.tai_tro,
       tai_tro_mo_ta = excluded.tai_tro_mo_ta, gian_hang = excluded.gian_hang,
       van_nghe = excluded.van_nghe, van_nghe_mo_ta = excluded.van_nghe_mo_ta,
       gala_luc = excluded.gala_luc, updated_at = excluded.updated_at`
  ).bind(
    me.id, duLe, taiTro, cleanText(body.tai_tro_mo_ta, 500),
    coKhong(body.gian_hang), vanNghe, cleanText(body.van_nghe_mo_ta, 500)
  ).run();

  if (!cu?.gala_luc) {
    await logActivity(env, {
      cohortId: me.cohort_id, groupId: me.group_id, actorId: me.id,
      verb: 'totnghiep.gala', objectType: 'dang_ky_tot_nghiep', objectId: me.id,
      summary: duLe === 'co' ? 'đăng ký dự Lễ tốt nghiệp 26/9' : 'trả lời đăng ký Lễ tốt nghiệp',
    });
  }
  return json({ ok: true, dang_ky: await docDangKy(env, me.id) });
}

/* ── Phần B: đề tài KHKD — THEO CÁ NHÂN, theo LĨNH VỰC ────────────────────
   Đổi 18/9, vài giờ sau khi phát hành bản theo nhóm. Ngô Phú Cường: "Các nhóm
   hoạt động không hiệu quả nên lớp quyết định nộp đề tài tự do theo cá nhân
   hoặc cùng lĩnh vực, không bắt buộc ai cũng phải nộp." Lý lẽ và phương án bị
   loại ghi ở migrations/0043_de_tai_theo_linh_vuc.sql.

   Thay cho một lượt BÌNH CHỌN ZALO đã khoá: lượt ấy cho thấy avatar và con số
   nhưng không cho biết AI chọn GÌ, không nối được sang đề tài hay link bài, và
   không xuất ra được — nguyên văn anh nói là "rất khó để Ban cán sự lớp theo
   dõi".

   BA Ô ĐỀU ĐỂ TRỐNG ĐƯỢC, và đó là chủ ý: "không bắt buộc ai cũng phải nộp"
   là quyết định của lớp. Người mới chọn lĩnh vực mà chưa có đề tài vẫn là một
   dòng hợp lệ và vẫn được đếm — Ban cán sự lớp cần thấy CẢ HAI mức, không chỉ
   mức đã xong.

   Không nhận member_id trong thân: chính chủ tự khai, đúng khuôn putHoSo và
   putGala. Không có chỗ nào để dò, và không ai khai hộ được. */
export async function putDeTai(request, env, me) {
  const body = await readJson(request);

  const url = cleanText(body.khkd_url, 500);
  // Cùng luật với Tư liệu và Giao thương (giao-thuong.js:122): chỉ https.
  // Chuỗi này đi thẳng vào href của một thẻ <a>, mà 'javascript:' thì esc()
  // không cứu được — nó không chứa ký tự HTML nào để thoát.
  if (url && !/^https:\/\/[^\s/]+\./i.test(url)) return error('link_must_be_https', 422);

  const linhVuc = docLinhVucKhkd(body.khkd_linh_vuc);
  const deTai = cleanText(body.khkd_de_tai, 300);
  const cu = await docDangKy(env, me.id);

  // Mốc khkd_luc chỉ đóng khi người ta THẬT SỰ khai một thứ gì đó. Đóng dấu
  // cho một lượt lưu rỗng thì màn Ban cán sự lớp đếm nhầm người ấy vào cột
  // "đã khai" — và con số ấy là cả lý do tính năng này tồn tại.
  const coGi = !!(linhVuc || deTai || url);

  await env.DB.prepare(
    `INSERT INTO dang_ky_tot_nghiep
       (member_id, khkd_linh_vuc, khkd_de_tai, khkd_url, khkd_luc, updated_at)
     VALUES (?, ?, ?, ?, CASE WHEN ? = 1 THEN datetime('now') ELSE NULL END, datetime('now'))
     ON CONFLICT(member_id) DO UPDATE SET
       khkd_linh_vuc = excluded.khkd_linh_vuc,
       khkd_de_tai = excluded.khkd_de_tai,
       khkd_url = excluded.khkd_url,
       khkd_luc = excluded.khkd_luc,
       updated_at = excluded.updated_at`
  ).bind(me.id, linhVuc, deTai, url, coGi ? 1 : 0).run();

  // Ghi hoạt động LẦN ĐẦU thôi — sửa lại một chữ mà đẩy thêm một dòng vào
  // feed "Đang diễn ra" của cả nhóm thì feed thành sổ nháp của một người.
  if (coGi && !cu?.khkd_luc) {
    await logActivity(env, {
      cohortId: me.cohort_id, groupId: me.group_id, actorId: me.id,
      verb: 'totnghiep.detai', objectType: 'dang_ky_tot_nghiep', objectId: me.id,
      summary: deTai ? `chốt đề tài KHKD: ${deTai}` : 'chọn lĩnh vực làm Kế hoạch kinh doanh',
    });
  }
  return json({ ok: true, dang_ky: await docDangKy(env, me.id) });
}

/* ══ ĐƯỜNG CÔNG KHAI — cho 38 người chưa đăng nhập được ═════════════════════
   Lý lẽ đầy đủ ở migrations/0042_totnghiep_cong_khai.sql. Tóm tắt phần phải
   nhớ khi sửa file này:

   HAI ROUTE DƯỚI ĐÂY LÀ ROUTE CÔNG KHAI DUY NHẤT CỦA ZONE NÀY, và trong
   index.js chúng phải nằm ở nửa TRÊN dòng getCurrentMember — ngược hẳn sáu
   route kia. Ranh giới ấy là VỊ TRÍ DÒNG, không phải một cờ nào.

   Chúng chỉ GHI được một bản đăng ký. Không cấp phiên, không đọc được danh
   bạ/quỹ/bài/thông báo. Và không trả về một mẩu dữ liệu cá nhân nào của ai:
   ô nhập để TRỐNG, người điền tự gõ. Điền sẵn ngày sinh hay điện thoại ở đây
   là phát tán danh bạ cả lớp cho bất kỳ ai mở link.
   ═══════════════════════════════════════════════════════════════════════════ */

const CONG_KHAI_MOI_GIO = 400;   // PHẢI trên sĩ số lớp — bài học 27/8

// Không nhận tham số, không trả dữ liệu của ai. Chỉ những thứ giao diện cần
// để dựng form: danh mục ngành, hạn, và thông tin đợt thu phí ở mức đã in sẵn
// trên thư mời Ban tổ chức (số tiền, ngân hàng, số tài khoản, tên người thu).
export async function getTotNghiepCongKhai(env) {
  const r = await env.DB.prepare(
    `SELECT fr.amount, fr.bank_bin, fr.bank_name, fr.account_no, fr.account_name,
            m.full_name AS collector_name
       FROM fund_rounds fr LEFT JOIN members m ON m.id = fr.collector_member_id
      WHERE fr.scope = 'class' AND fr.amount = 1000000
        AND fr.account_no = '0975587586' LIMIT 1`
  ).first();

  return json({
    han_gala: HAN_GALA,
    ngay_le: NGAY_LE,
    nganh_list: NGANH,
    linh_vuc_khkd_list: LINH_VUC_KHKD,
    phi: r ? {
      amount: r.amount,
      bank_name: r.bank_name || r.bank_bin,
      account_no: r.account_no,
      account_name: r.account_name,
      collector_name: r.collector_name,
    } : null,
  });
}

export async function postTotNghiepCongKhai(request, env, ip) {
  if (!(await conQuota(env, 'totnghiep_ck', ip, CONG_KHAI_MOI_GIO))) {
    return error('rate_limited', 429, { retry_after_minutes: 60 });
  }
  await ghiNhan(env, 'totnghiep_ck', ip);

  const body = await readJson(request);
  const rosterId = Number(body.roster_id);
  if (!Number.isInteger(rosterId) || rosterId <= 0) return error('roster_invalid', 422);

  const nguoi = await env.DB.prepare(
    `SELECT r.id, r.cohort_id, r.full_name, r.group_label
       FROM roster r WHERE r.id = ?`
  ).bind(rosterId).first();
  if (!nguoi) return error('not_found', 404);

  // Tự tạo dòng members nếu chưa có — đúng khuôn postDanhBaMoi (danh-ba.js).
  // `claimed_at` để TRỐNG: cửa /vao không đóng lại với họ, số điện thoại của
  // họ trong Danh bạ vẫn bị che, và khi họ đăng nhập thật thì vẫn là CÙNG
  // MỘT dòng nên thấy ngay bản mình đã điền ở đây.
  //
  // Nhóm lấy từ `roster.group_label` của CHÍNH NGƯỜI NHẬN, không phải của ai
  // khác — không có tham số nhóm nào trong thân request để mà giả mạo.
  let mem = await env.DB.prepare(
    'SELECT id FROM members WHERE roster_id = ? AND is_active = 1'
  ).bind(rosterId).first();
  if (!mem) {
    await env.DB.prepare(
      `INSERT INTO members (cohort_id, group_id, roster_id, full_name, title, company, is_active)
       SELECT r.cohort_id,
              (SELECT g.id FROM groups g WHERE g.cohort_id = r.cohort_id AND g.label = r.group_label),
              r.id, r.full_name, r.title, r.company, 1
         FROM roster r WHERE r.id = ?`
    ).bind(rosterId).run();
    mem = await env.DB.prepare(
      'SELECT id FROM members WHERE roster_id = ? AND is_active = 1'
    ).bind(rosterId).first();
    if (!mem) return error('khong_tao_duoc_ho_so', 500);
  }

  // ══ KHAI BỔ SUNG, KHÔNG PHẢI GHI ĐÈ ═════════════════════════════════════
  // Bản đầu (migration 0042) chặn cứng: bản nào do người đã đăng nhập tự điền
  // thì đường công khai trả 409 da_dien_tu_tai_khoan. Ngô Phú Cường nới ra
  // ngày 18/9 — "tìm tên → điền → gửi" phải dùng được để KHAI BỔ SUNG, ngang
  // với việc được phát một link riêng.
  //
  // Nới bằng cách đổi NGỮ NGHĨA chứ không phải bỏ chốt: lượt gửi công khai
  // nay KHÔNG BAO GIỜ XOÁ TRẮNG một ô đã có chữ. Ô nào người gửi bỏ trống thì
  // giữ nguyên giá trị cũ (`giuCu` bên dưới). Nhờ vậy cái mà chốt 409 sinh ra
  // để chống — ai cầm link cũng xoá sạch bản khai của người khác — vẫn không
  // làm được, trong khi người thật quay lại điền thêm phần còn thiếu thì
  // không bị chặn.
  //
  // Hai ô đánh dấu (gian_hang, van_nghe) là ngoại lệ có ý thức: hộp không
  // tích gửi lên giá trị 0, không phân biệt được với "không trả lời", nên
  // chúng ghi đè theo đúng thứ người gửi để lại. Đổi lại người thật vẫn BỎ
  // được đăng ký gian hàng qua đường này — chặn luôn chiều ấy thì một người
  // lỡ tích nhầm không có cách nào rút.
  const cu = await docDangKy(env, mem.id);
  const giuCu = (moi, ten) => (moi === null || moi === undefined || moi === ''
    ? (cu?.[ten] ?? null) : moi);

  const duLe = motTrong(body.du_le, DU_LE);
  // Đề tài KHKD đi CÙNG đường công khai này, không dựng đường thứ hai: 38
  // người không đăng nhập được cũng nằm trong diện "nộp tự do theo cá nhân
  // hoặc cùng lĩnh vực", và bắt họ chờ một link mời để khai lĩnh vực là dựng
  // lại đúng cái rào vừa gỡ.
  const khkdUrl = cleanText(body.khkd_url, 500);
  if (khkdUrl && !/^https:\/\/[^\s/]+\./i.test(khkdUrl)) return error('link_must_be_https', 422);
  const khkdLinhVuc = docLinhVucKhkd(body.khkd_linh_vuc);
  const khkdDeTai = cleanText(body.khkd_de_tai, 300);
  const coKhkd = !!(khkdLinhVuc || khkdDeTai || khkdUrl);

  // Thô = đúng những gì người gửi vừa gõ. Phải giữ riêng khỏi bản đã trộn vì
  // BA MỐC THỜI GIAN bên dưới hỏi "lượt này có khai gì cho phần đó không",
  // chứ không hỏi "sau khi trộn thì phần đó có chữ chưa" — trộn xong rồi mới
  // hỏi thì một lượt gửi chỉ điền Gala cũng đóng dấu ho_so_luc, và màn Ban
  // cán sự lớp đếm nhầm người ấy vào cột đã xong.
  const tho = {
    ngay_sinh: cleanText(body.ngay_sinh, 20),
    dien_thoai: cleanText(body.dien_thoai, 20),
    doanh_nghiep: cleanText(body.doanh_nghiep, 200),
    linh_vuc: nganhRaChuoi(body.linh_vuc),
    chuc_vu: cleanText(body.chuc_vu, 120),
    nhu_cau_ket_noi: cleanText(body.nhu_cau_ket_noi, 500),
  };
  tho.linh_vuc_khac = docLinhVucKhac(tho.linh_vuc, body.linh_vuc_khac);

  const dat = {
    ho_ten: cleanText(body.ho_ten, 120) ?? cu?.ho_ten ?? nguoi.full_name,
    ngay_sinh: giuCu(tho.ngay_sinh, 'ngay_sinh'),
    dien_thoai: giuCu(tho.dien_thoai, 'dien_thoai'),
    doanh_nghiep: giuCu(tho.doanh_nghiep, 'doanh_nghiep'),
    linh_vuc: giuCu(tho.linh_vuc, 'linh_vuc'),
    chuc_vu: giuCu(tho.chuc_vu, 'chuc_vu'),
    nhu_cau_ket_noi: giuCu(tho.nhu_cau_ket_noi, 'nhu_cau_ket_noi'),
  };
  // linh_vuc_khac đi theo linh_vuc ĐÃ TRỘN, không theo bản thô: bỏ trống hàng
  // chip ở lượt bổ sung thì chip cũ được giữ, nên chữ "Ngành khác" cũ cũng
  // phải còn — docLinhVucKhac() chỉ gỡ chữ khi chip `khac` thật sự đã thôi.
  dat.linh_vuc_khac = docLinhVucKhac(dat.linh_vuc, giuCu(tho.linh_vuc_khac, 'linh_vuc_khac'));

  const taiTro = motTrong(body.tai_tro, TAI_TRO);
  const taiTroMo = cleanText(body.tai_tro_mo_ta, 500);
  const vanNgheMo = cleanText(body.van_nghe_mo_ta, 500);
  const gianHang = coKhong(body.gian_hang);
  const vanNghe = coKhong(body.van_nghe);

  // BA MỐC, ba câu hỏi riêng: "lượt này có khai gì cho phần ĐÓ không". Đóng
  // dấu cho một phần người ta để trống thì màn Ban cán sự lớp đếm nhầm họ vào
  // cột đã xong — và con số ấy là cả lý do màn ấy tồn tại. Đã đóng rồi thì
  // giữ, vì bổ sung phần khác không làm phần cũ chưa xong trở lại.
  //
  // ho_ten KHÔNG tính: nó luôn có giá trị (rơi về tên trong danh sách gốc),
  // nên tính vào là mốc nào cũng đóng ở mọi lượt gửi.
  const coHoSo = !!(tho.ngay_sinh || tho.dien_thoai || tho.doanh_nghiep
    || tho.linh_vuc || tho.chuc_vu || tho.nhu_cau_ket_noi);
  // Hai ô đánh dấu tính là CÓ trả lời chỉ khi được tích: hộp bỏ trống gửi lên
  // 0 ở mọi lượt, nên coi 0 là một câu trả lời thì lượt nào cũng đóng dấu.
  const coGala = !!(duLe || taiTro || taiTroMo || vanNgheMo || gianHang || vanNghe);

  // Giá trị du_le SAU KHI TRỘN, dùng cho CẢ lượt ghi lẫn khối phí bên dưới.
  // Nếu khối phí đọc bản THÔ thì một người đã khai "có dự" từ trước, nay chỉ
  // quay lại bổ sung ngày sinh, sẽ nhận lại màn "không có khoản phí nào" —
  // đúng lúc họ cần mã QR nhất.
  const duLeLuu = giuCu(duLe, 'du_le');

  // `nguon` là SỔ TAY của Ban cán sự lớp, không phải một cờ nội bộ: nới luật
  // ghi đè thì phải đổi lấy việc nhìn thấy được ai đã đi đường nào. Giá trị
  // thứ ba `ca_hai` xuất hiện đúng khi một bản do chính chủ điền trong tài
  // khoản về sau được bổ sung qua đường công khai — thứ trước 18/9 không xảy
  // ra được vì bị chặn 409.
  const nguonMoi = !cu ? 'cong_khai'
    : cu.nguon === 'cong_khai' ? 'cong_khai' : 'ca_hai';

  await env.DB.prepare(
    `INSERT INTO dang_ky_tot_nghiep
       (member_id, ho_ten, ngay_sinh, dien_thoai, doanh_nghiep, linh_vuc,
        linh_vuc_khac, chuc_vu,
        nhu_cau_ket_noi, du_le, tai_tro, tai_tro_mo_ta, gian_hang, van_nghe,
        van_nghe_mo_ta, khkd_linh_vuc, khkd_de_tai, khkd_url, khkd_luc,
        nguon, ho_so_luc, gala_luc, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
             CASE WHEN ? = 1 THEN datetime('now') ELSE ? END, ?,
             CASE WHEN ? = 1 THEN datetime('now') ELSE ? END,
             CASE WHEN ? = 1 THEN datetime('now') ELSE ? END,
             datetime('now'))
     ON CONFLICT(member_id) DO UPDATE SET
       ho_ten = excluded.ho_ten, ngay_sinh = excluded.ngay_sinh,
       dien_thoai = excluded.dien_thoai, doanh_nghiep = excluded.doanh_nghiep,
       linh_vuc = excluded.linh_vuc, linh_vuc_khac = excluded.linh_vuc_khac,
       chuc_vu = excluded.chuc_vu,
       nhu_cau_ket_noi = excluded.nhu_cau_ket_noi, du_le = excluded.du_le,
       tai_tro = excluded.tai_tro, tai_tro_mo_ta = excluded.tai_tro_mo_ta,
       gian_hang = excluded.gian_hang, van_nghe = excluded.van_nghe,
       van_nghe_mo_ta = excluded.van_nghe_mo_ta,
       khkd_linh_vuc = excluded.khkd_linh_vuc, khkd_de_tai = excluded.khkd_de_tai,
       khkd_url = excluded.khkd_url, khkd_luc = excluded.khkd_luc,
       nguon = excluded.nguon,
       ho_so_luc = excluded.ho_so_luc, gala_luc = excluded.gala_luc,
       updated_at = excluded.updated_at`
  ).bind(
    mem.id, dat.ho_ten, dat.ngay_sinh, dat.dien_thoai, dat.doanh_nghiep,
    dat.linh_vuc, dat.linh_vuc_khac, dat.chuc_vu, dat.nhu_cau_ket_noi,
    // Phần C và phần B cũng đi qua giuCu — sót một ô ở đây là ô ấy bị xoá
    // trắng ở mọi lượt bổ sung, đúng cái mà chốt 409 cũ sinh ra để chống.
    // Hai ô đánh dấu KHÔNG qua giuCu, xem chú thích ở đầu hàm.
    duLeLuu, giuCu(taiTro, 'tai_tro'), giuCu(taiTroMo, 'tai_tro_mo_ta'),
    gianHang, vanNghe, giuCu(vanNgheMo, 'van_nghe_mo_ta'),
    giuCu(khkdLinhVuc, 'khkd_linh_vuc'), giuCu(khkdDeTai, 'khkd_de_tai'),
    giuCu(khkdUrl, 'khkd_url'),
    // MỐC MỚI do SQLite sinh (quy ước 1 CLAUDE.md — tuyệt đối không dùng
    // Date của JS để ghi thời gian), còn nhánh "giữ nguyên" chỉ chuyền lại
    // đúng chuỗi SQLite đã sinh ở lượt trước. Vì vậy mỗi mốc tốn HAI bind:
    // một cờ có-khai-không, một giá trị cũ.
    coKhkd ? 1 : 0, cu?.khkd_luc ?? null,
    nguonMoi,
    coHoSo ? 1 : 0, cu?.ho_so_luc ?? null,
    coGala ? 1 : 0, cu?.gala_luc ?? null
  ).run();

  // Cú pháp chuyển khoản phải do MÁY CHỦ dựng: buildTransferNote() bỏ dấu rồi
  // viết hoa, chép logic ấy sang giao diện là có ngày hai bên ra hai chuỗi
  // khác nhau và người thu không dò được tiền về của ai.
  let phi = null;
  const round = await env.DB.prepare(
    `SELECT * FROM fund_rounds WHERE cohort_id = ? AND scope = 'class'
        AND amount = 1000000 AND account_no = '0975587586' LIMIT 1`
  ).bind(nguoi.cohort_id).first();
  if (round && duLeLuu === 'co') {
    const nhomSo = await env.DB.prepare(
      'SELECT g.no FROM members m JOIN groups g ON g.id = m.group_id WHERE m.id = ?'
    ).bind(mem.id).first();
    const note = buildTransferNote(round.syntax_template, {
      fullName: dat.ho_ten, groupNo: nhomSo?.no ?? '',
    });
    phi = {
      amount: round.amount,
      bank_name: round.bank_name || round.bank_bin,
      account_no: round.account_no,
      account_name: round.account_name,
      transfer_note: note,
      qr_url: buildQrUrl(round, note),
    };
  }

  // `bo_sung` để màn cuối nói đúng chuyện: người quay lại lần hai cần nghe
  // "đã cập nhật, phần bỏ trống giữ nguyên bản cũ" chứ không phải "đã gửi" —
  // không nói ra thì họ tưởng vừa ghi đè sạch bản khai của chính mình.
  return json({ ok: true, ho_ten: dat.ho_ten, du_le: duLeLuu, bo_sung: !!cu, phi });
}

/* ── Ban cán sự lớp: xem cả lớp ───────────────────────────────────────────
   isClassCommittee (gồm cả uy_vien) chứ không isClassOfficer: đây là quyền
   ĐỌC để báo cáo với Ban tổ chức, không đụng tiền — đúng phân định đã ghi
   trong permissions.js. Nhờ vậy Ngô Phú Cường (uy_vien) xem được ngay. */
async function docDanhSach(env, me) {
  const rows = await env.DB.prepare(
    `SELECT m.id AS member_id, m.full_name, m.email, m.phone AS phone_hoso,
            g.no AS group_no, g.label AS group_label, r.dob AS dob_goc,
            d.khkd_linh_vuc, d.khkd_de_tai, d.khkd_url, d.khkd_luc,
            d.ho_ten, d.ngay_sinh, d.dien_thoai, d.doanh_nghiep, d.linh_vuc,
            d.linh_vuc_khac, d.chuc_vu, d.nhu_cau_ket_noi, d.anh_url, d.logo_url, d.ho_so_luc,
            d.du_le, d.tai_tro, d.tai_tro_mo_ta, d.gian_hang, d.van_nghe,
            d.van_nghe_mo_ta, d.gala_luc, d.nguon,
            (SELECT CASE WHEN fd.verified_at IS NOT NULL THEN 'nguoi_thu_da_nhan'
                         WHEN fd.declared_at IS NOT NULL THEN 'da_tu_khai'
                         ELSE NULL END
               FROM fund_declarations fd
               JOIN fund_rounds fr ON fr.id = fd.round_id
              WHERE fd.member_id = m.id AND fr.scope = 'class'
                AND fr.amount = 1000000 LIMIT 1) AS trang_thai_phi
       FROM members m
       LEFT JOIN groups g ON g.id = m.group_id
       LEFT JOIN roster r ON r.id = m.roster_id
       LEFT JOIN dang_ky_tot_nghiep d ON d.member_id = m.id
      WHERE m.cohort_id = ? AND m.is_active = 1
      ORDER BY g.no, m.full_name COLLATE NOCASE`
  ).bind(me.cohort_id).all();
  return rows.results ?? [];
}

export async function getDanhSachTotNghiep(env, me) {
  if (!(await isClassCommittee(env, me.id))) return error('forbidden', 403);
  const ds = await docDanhSach(env, me);

  // Đây là thứ THAY CHO lượt bình chọn Zalo. Lượt ấy chỉ cho con số; chỗ này
  // cho con số KÈM TÊN, kèm ai đã có đề tài và ai đã nộp link — tức là dò
  // ngược được, và xuất ra được. Trả về ĐỦ 15 lĩnh vực kể cả lĩnh vực chưa ai
  // chọn: "chưa ai chọn" là một câu trả lời, còn một dòng biến mất thì Ban cán
  // sự lớp không biết là chưa ai chọn hay là mình quên mất nó.
  const theoLinhVuc = LINH_VUC_KHKD.map(lv => {
    const nguoi = ds.filter(x => x.khkd_linh_vuc === lv.ma);
    return {
      ma: lv.ma, ten: lv.ten,
      so_nguoi: nguoi.length,
      so_da_nop_link: nguoi.filter(x => x.khkd_url).length,
      nguoi: nguoi.map(x => ({
        member_id: x.member_id, full_name: x.full_name, group_label: x.group_label,
        khkd_de_tai: x.khkd_de_tai, khkd_url: x.khkd_url,
      })),
    };
  });

  return json({
    tong: ds.length,
    xong_ho_so: ds.filter(x => x.ho_so_luc).length,
    xong_gala: ds.filter(x => x.gala_luc).length,
    du_le: ds.filter(x => x.du_le === 'co').length,
    da_chon_linh_vuc: ds.filter(x => x.khkd_linh_vuc).length,
    da_nop_link: ds.filter(x => x.khkd_url).length,
    chua_chon_linh_vuc: ds.filter(x => !x.khkd_linh_vuc)
      .map(x => ({ full_name: x.full_name, group_label: x.group_label })),
    theo_linh_vuc: theoLinhVuc,
    nguoi: ds,
  });
}

/* ── Xuất CSV cho Ban tổ chức ─────────────────────────────────────────────
   CSV chứ không Word: bên làm chứng chỉ mở bằng Excel để trộn thư. lib/docx.js
   để nguyên, không đụng. */
function oCsv(v) {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function getXuatCsv(env, me) {
  if (!(await isClassCommittee(env, me.id))) return error('forbidden', 403);
  const ds = await docDanhSach(env, me);

  const cot = [
    ['Nhóm', x => x.group_label],
    ['Họ và tên', x => x.ho_ten || x.full_name],
    ['Ngày sinh', x => x.ngay_sinh || x.dob_goc],
    ['Điện thoại', x => x.dien_thoai || x.phone_hoso],
    ['Email', x => x.email],
    ['Doanh nghiệp', x => x.doanh_nghiep],
    ['Chức vụ', x => x.chuc_vu],
    ['Lĩnh vực', x => tenNganhDoc(x.linh_vuc, x.linh_vuc_khac)],
    ['Nhu cầu kết nối', x => x.nhu_cau_ket_noi],
    ['Ảnh chân dung', x => x.anh_url],
    ['Logo doanh nghiệp', x => x.logo_url],
    ['Lĩnh vực KHKD', x => tenLinhVucKhkd(x.khkd_linh_vuc)],
    ['Đề tài KHKD', x => x.khkd_de_tai],
    ['Link bài KHKD', x => x.khkd_url],
    ['Dự Lễ 17h-22h', x => (x.du_le === 'co' ? 'Có' : x.du_le === 'khong' ? 'Không' : '')],
    // Nhãn phải đúng mục 6.4 SRS: "đã tự khai" cho tới khi người thu đối
    // chiếu sao kê, KHÔNG BAO GIỜ "đã đóng". Tệp này đi ra ngoài cho Ban tổ
    // chức đọc, nên càng phải đúng chữ.
    ['Phí Gala', x => (x.trang_thai_phi === 'nguoi_thu_da_nhan' ? 'Người thu đã nhận'
      : x.trang_thai_phi === 'da_tu_khai' ? 'Đã tự khai — chờ đối chiếu sao kê' : 'Chưa khai')],
    ['Tài trợ', x => (x.tai_tro === 'tien' ? 'Tiền' : x.tai_tro === 'hien_vat' ? 'Hiện vật'
      : x.tai_tro === 'khong' ? 'Không' : '')],
    ['Tài trợ — chi tiết', x => x.tai_tro_mo_ta],
    ['Gian hàng / standee', x => (x.gian_hang ? 'Có' : '')],
    ['Tiết mục văn nghệ', x => (x.van_nghe ? 'Có' : '')],
    ['Văn nghệ — chi tiết', x => x.van_nghe_mo_ta],
    ['Xong hồ sơ lúc', x => x.ho_so_luc],
    ['Xong đăng ký Lễ lúc', x => x.gala_luc],
    // Cột này là cái giá của việc nới luật ghi đè ngày 18/9: đường công khai
    // nay bổ sung được vào bản của người đã đăng nhập, nên Ban cán sự lớp
    // phải NHÌN THẤY được dòng nào đi đường nào. "Cả hai" là dấu duy nhất nói
    // rằng một bản do chính chủ điền trong tài khoản về sau có người điền
    // thêm qua link công khai — chỗ đáng soi lại nếu có gì trông lạ.
    ['Điền qua', x => (x.nguon === 'cong_khai' ? 'Link công khai'
      : x.nguon === 'ca_hai' ? 'Tài khoản + link công khai' : 'Tài khoản')],
  ];

  const dong = [cot.map(c => oCsv(c[0])).join(',')];
  for (const x of ds) dong.push(cot.map(c => oCsv(c[1](x))).join(','));

  // BOM UTF-8 BẮT BUỘC: thiếu nó thì Excel trên Windows đọc tệp bằng bảng mã
  // hệ thống và mọi dấu tiếng Việt thành ký tự rác. Tệp này để Ban tổ chức mở
  // bằng Excel, nên đó không phải chi tiết nhỏ — đó là cả công dụng của tệp.
  // CRLF chứ không LF, cùng lý do (Excel cũ nuốt cả tệp khi chỉ có LF).
  const body = '﻿' + dong.join('\r\n') + '\r\n';
  return new Response(body, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="dang-ky-tot-nghiep-k3vaceo.csv"',
    },
  });
}

/* ══ ẢNH CHÂN DUNG VÀ LOGO — câu 7 và 8, qua Google Drive ═══════════════════
   Lý lẽ "vì sao Drive chứ không phải R2", và vì sao đây KHÔNG phải bỏ N2,
   nằm ở CLAUDE.md và ở đầu lib/drive.js. Tệp này chỉ lo CHÍNH SÁCH: ai được
   gửi, tệp nào được nhận, và ghi kết quả vào đâu.

   NĂM CHỐT CHẶN, xếp theo GIÁ — rẻ nhất hỏi trước, đúng khuôn congTacVaKhoa()
   của trợ lý. Chỉ khi cả năm qua mới tiêu một lượt gọi ra Drive:

     1. Có phiên            — vị trí dòng trong index.js, dưới getCurrentMember
     2. Có khoá chưa        — thiếu thì 503, giao diện ẩn hẳn ô chọn ảnh
     3. Kích thước          — đọc Content-Length TRƯỚC, rồi kiểm lại trên
                              ArrayBuffer thật (header do máy khách gửi, sửa
                              được bằng một dòng)
     4. Magic bytes         — không tin phần mở rộng, không tin content-type
     5. Hạn mức             — đắt nhất vì phải đếm bảng, nhưng vẫn rẻ hơn một
                              lượt gọi ra ngoài
   ═══════════════════════════════════════════════════════════════════════════ */

const LOAI_ANH = {
  anh:  { cot_url: 'anh_url',  cot_id: 'anh_drive_id',  nhan: 'Ảnh chân dung',      ma_ten: 'chan-dung' },
  logo: { cot_url: 'logo_url', cot_id: 'logo_drive_id', nhan: 'Logo doanh nghiệp', ma_ten: 'logo' },
};

// Trần theo NGƯỜI, không theo IP — cả lớp ngồi chung WiFi hội trường là
// chuyện thường xuyên ở đây (bài học 27/8), khoá theo IP thì người thứ hai
// trong phòng đã hết lượt. Thùng IP vẫn có, nhưng đặt TRÊN sĩ số lớp.
const ANH_MOI_NGUOI_MOI_NGAY = 20;
const ANH_MOI_IP_MOI_GIO = 400;

async function caiDatTn(env, khoa) {
  const row = await env.DB.prepare('SELECT gia_tri FROM cai_dat WHERE khoa = ?').bind(khoa).first();
  return row?.gia_tri ?? null;
}

/* Thư mục đích PHẢI do chính ứng dụng tạo ra — scope `drive.file` chỉ đụng
   được tệp do nó tạo, nên một id thư mục tạo tay sẽ nhận `404 File not found`
   (xem lib/drive.js). Vì vậy tạo LƯỜI ở lượt gửi đầu tiên rồi nhớ id vào bảng
   `cai_dat`, thay vì bắt ai đó chạy một lượt thủ công rồi dán id vào Secret:
   một bước tay là một bước quên được, và triệu chứng của việc quên là một câu
   404 đọc lên như thư mục bị xoá.

   `cai_dat` đã có sẵn từ migration 0038 cho đúng loại việc này, nên không cần
   migration mới. Đặt sẵn DRIVE_FOLDER_ID trong Worker thì dùng cái đó và
   không tạo gì — đường lui khi muốn ghim vào một thư mục cụ thể. */
async function thuMucDich(env) {
  if (env.DRIVE_FOLDER_ID) return env.DRIVE_FOLDER_ID;
  const da = await caiDatTn(env, 'drive_thu_muc_id');
  if (da) return da;

  const id = await taoThuMuc(env, 'k3vaceo — ảnh chứng chỉ CEO K03');
  // INSERT OR IGNORE rồi đọc lại: hai người gửi cùng lúc thì cả hai cùng tạo
  // được một thư mục, nhưng chỉ một id được ghi và CẢ HAI dùng chung id ấy.
  // Thư mục thừa là chuyện cosmetic dọn tay được; hai nửa lớp nằm ở hai thư
  // mục khác nhau mới là chuyện Ban tổ chức phải đi tìm.
  await env.DB.prepare(
    `INSERT OR IGNORE INTO cai_dat (khoa, gia_tri, ghi_chu)
     VALUES ('drive_thu_muc_id', ?, 'Thư mục Drive chứa ảnh chứng chỉ. Do CHÍNH ứng dụng tạo — scope drive.file không đụng được thư mục tạo tay.')`
  ).bind(id).run();
  return (await caiDatTn(env, 'drive_thu_muc_id')) ?? id;
}

export async function postAnhTotNghiep(request, env, me, ip) {
  const loai = LOAI_ANH[new URL(request.url).searchParams.get('loai') ?? ''];
  if (!loai) return error('loai_khong_hop_le', 422);

  // Chốt 2 — thiếu khoá thì 503 và giao diện ẩn hẳn ô chọn ảnh, không bày một
  // nút bấm vào là lỗi.
  if (!driveCauHinh(env)) return error('drive_chua_cau_hinh', 503);

  // Chốt 3a — Content-Length. Từ chối TRƯỚC khi đọc thân là không phải nuốt
  // cả tệp vào bộ nhớ Worker chỉ để vứt đi.
  const khai = Number(request.headers.get('content-length') || 0);
  if (khai > TOI_DA_BYTE) return error('anh_qua_lon', 413, { toi_da: TOI_DA_BYTE, nhan_duoc: khai });

  const bytes = new Uint8Array(await request.arrayBuffer());
  // Chốt 3b — kiểm lại trên tệp THẬT. Content-Length do máy khách gửi.
  if (bytes.length > TOI_DA_BYTE) {
    return error('anh_qua_lon', 413, { toi_da: TOI_DA_BYTE, nhan_duoc: bytes.length });
  }
  if (bytes.length === 0) return error('anh_rong', 422);

  // Chốt 4 — magic bytes. `goi_y` đi thẳng ra giao diện: "đây là ảnh HEIC,
  // định dạng gốc của iPhone, mở ảnh lên rồi chọn Sao chép sẽ ra JPG" hữu ích
  // hơn hẳn "tệp không hợp lệ", và iPhone là máy phần lớn lớp này đang dùng.
  const soi = doanLoaiAnh(bytes);
  if (!soi.ok) return error('anh_sai_dinh_dang', 422, { la: soi.la, goi_y: soi.goi_y });

  // Chốt 5 — hạn mức.
  if (!(await conQuota(env, 'tn_anh_nguoi', `m${me.id}`, ANH_MOI_NGUOI_MOI_NGAY, '-1 day'))) {
    return error('qua_nhieu_lan', 429, { toi_da: ANH_MOI_NGUOI_MOI_NGAY });
  }
  if (!(await conQuota(env, 'tn_anh_ip', ip, ANH_MOI_IP_MOI_GIO))) {
    return error('qua_nhieu_lan', 429);
  }

  // Tên tệp mang HỌ TÊN và NHÓM: Ban tổ chức tải cả thư mục về rồi ghép chứng
  // chỉ, nên một thư mục toàn `IMG_4821.jpg` là bắt họ mở từng tệp ra đoán.
  const nhom = await env.DB.prepare(
    'SELECT g.no FROM members m LEFT JOIN groups g ON g.id = m.group_id WHERE m.id = ?'
  ).bind(me.id).first();
  const sach = String(me.full_name || `member-${me.id}`).replace(/[\\/:*?"<>|]/g, '').trim();
  const ten = `${loai.ma_ten}-${sach}${nhom?.no ? ` - N${nhom.no}` : ''}.${soi.duoi}`;

  let ketQua;
  try {
    ketQua = await taiLenDrive(env, {
      ten, mime: soi.mime, bytes, thuMucId: await thuMucDich(env),
    });
  } catch (err) {
    // `hong_o_buoc` là đường DUY NHẤT đọc được sự thật khi log Worker câm —
    // bài học đã trả giá ở đường gửi thư 24/8 và trả lần nữa ở trợ lý. Giao
    // diện in thẳng tên bước vào câu báo lỗi.
    return error('drive_hong', 502, { hong_o_buoc: err?.buoc ?? 'khong_ro', chi_tiet: String(err?.message ?? err) });
  }

  // ghiNhan đứng SAU lượt gọi: một lượt HỎNG không được ăn mất lượt của học
  // viên. Cùng lý lẽ đã ghi cho trợ lý.
  await ghiNhan(env, 'tn_anh_nguoi', `m${me.id}`);
  await ghiNhan(env, 'tn_anh_ip', ip);

  await env.DB.prepare(
    `INSERT INTO dang_ky_tot_nghiep (member_id, ${loai.cot_url}, ${loai.cot_id}, updated_at)
     VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(member_id) DO UPDATE SET
       ${loai.cot_url} = excluded.${loai.cot_url},
       ${loai.cot_id} = excluded.${loai.cot_id},
       updated_at = excluded.updated_at`
  ).bind(me.id, ketQua.url, ketQua.id).run();

  return json({ ok: true, loai: loai.nhan, url: ketQua.url, ten: ketQua.ten });
}
