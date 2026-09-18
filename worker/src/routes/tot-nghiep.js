import { json, error, readJson } from '../lib/http.js';
import { isClassCommittee, logAudit, logActivity } from '../permissions.js';
import { cleanText } from '../lib/validate.js';
import { NGANH, nganhRaChuoi } from '../lib/nganh.js';
import { LINH_VUC_KHKD, docLinhVucKhkd, tenLinhVucKhkd } from '../lib/linh-vuc-khkd.js';
import { shapeRound } from './funds.js';
import { conQuota, ghiNhan } from '../lib/ratelimit.js';
import { buildTransferNote, buildQrUrl } from '../lib/vietqr.js';

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

  await env.DB.prepare(
    `INSERT INTO dang_ky_tot_nghiep
       (member_id, ho_ten, ngay_sinh, dien_thoai, doanh_nghiep, linh_vuc,
        chuc_vu, nhu_cau_ket_noi, ho_so_luc, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
     ON CONFLICT(member_id) DO UPDATE SET
       ho_ten = excluded.ho_ten, ngay_sinh = excluded.ngay_sinh,
       dien_thoai = excluded.dien_thoai, doanh_nghiep = excluded.doanh_nghiep,
       linh_vuc = excluded.linh_vuc, chuc_vu = excluded.chuc_vu,
       nhu_cau_ket_noi = excluded.nhu_cau_ket_noi,
       ho_so_luc = excluded.ho_so_luc, updated_at = excluded.updated_at`
  ).bind(
    me.id, dat.ho_ten, dat.ngay_sinh, dat.dien_thoai, dat.doanh_nghiep,
    dat.linh_vuc, dat.chuc_vu, dat.nhu_cau_ket_noi
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

  // ══ CHỐT CHẶN THẬT SỰ CỦA CẢ TÍNH NĂNG ══════════════════════════════════
  // Đường công khai KHÔNG ĐƯỢC GHI ĐÈ bản do người đã đăng nhập tự điền.
  // Thiếu chốt này thì bất kỳ ai cầm link cũng phá được bản khai của 69 người
  // đã đăng nhập — đó mới là thiệt hại thật, chứ không phải một dòng rác thêm.
  const cu = await docDangKy(env, mem.id);
  if (cu && cu.nguon === 'phien') return error('da_dien_tu_tai_khoan', 409);

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

  const dat = {
    ho_ten: cleanText(body.ho_ten, 120) ?? nguoi.full_name,
    ngay_sinh: cleanText(body.ngay_sinh, 20),
    dien_thoai: cleanText(body.dien_thoai, 20),
    doanh_nghiep: cleanText(body.doanh_nghiep, 200),
    linh_vuc: nganhRaChuoi(body.linh_vuc),
    chuc_vu: cleanText(body.chuc_vu, 120),
    nhu_cau_ket_noi: cleanText(body.nhu_cau_ket_noi, 500),
  };

  // Một lượt ghi CẢ HAI phần: người đi đường này gõ một mạch rồi bấm Gửi, chứ
  // không có màn ba khối lưu riêng (họ không quay lại sửa được — không có
  // phiên). Vì vậy đóng dấu cả hai mốc cùng lúc.
  await env.DB.prepare(
    `INSERT INTO dang_ky_tot_nghiep
       (member_id, ho_ten, ngay_sinh, dien_thoai, doanh_nghiep, linh_vuc, chuc_vu,
        nhu_cau_ket_noi, du_le, tai_tro, tai_tro_mo_ta, gian_hang, van_nghe,
        van_nghe_mo_ta, khkd_linh_vuc, khkd_de_tai, khkd_url, khkd_luc,
        nguon, ho_so_luc, gala_luc, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
             CASE WHEN ? = 1 THEN datetime('now') ELSE NULL END, 'cong_khai',
             datetime('now'), datetime('now'), datetime('now'))
     ON CONFLICT(member_id) DO UPDATE SET
       ho_ten = excluded.ho_ten, ngay_sinh = excluded.ngay_sinh,
       dien_thoai = excluded.dien_thoai, doanh_nghiep = excluded.doanh_nghiep,
       linh_vuc = excluded.linh_vuc, chuc_vu = excluded.chuc_vu,
       nhu_cau_ket_noi = excluded.nhu_cau_ket_noi, du_le = excluded.du_le,
       tai_tro = excluded.tai_tro, tai_tro_mo_ta = excluded.tai_tro_mo_ta,
       gian_hang = excluded.gian_hang, van_nghe = excluded.van_nghe,
       van_nghe_mo_ta = excluded.van_nghe_mo_ta,
       khkd_linh_vuc = excluded.khkd_linh_vuc, khkd_de_tai = excluded.khkd_de_tai,
       khkd_url = excluded.khkd_url, khkd_luc = excluded.khkd_luc,
       nguon = 'cong_khai',
       ho_so_luc = excluded.ho_so_luc, gala_luc = excluded.gala_luc,
       updated_at = excluded.updated_at`
  ).bind(
    mem.id, dat.ho_ten, dat.ngay_sinh, dat.dien_thoai, dat.doanh_nghiep,
    dat.linh_vuc, dat.chuc_vu, dat.nhu_cau_ket_noi, duLe,
    motTrong(body.tai_tro, TAI_TRO), cleanText(body.tai_tro_mo_ta, 500),
    coKhong(body.gian_hang), coKhong(body.van_nghe), cleanText(body.van_nghe_mo_ta, 500),
    khkdLinhVuc, khkdDeTai, khkdUrl, coKhkd ? 1 : 0
  ).run();

  // Cú pháp chuyển khoản phải do MÁY CHỦ dựng: buildTransferNote() bỏ dấu rồi
  // viết hoa, chép logic ấy sang giao diện là có ngày hai bên ra hai chuỗi
  // khác nhau và người thu không dò được tiền về của ai.
  let phi = null;
  const round = await env.DB.prepare(
    `SELECT * FROM fund_rounds WHERE cohort_id = ? AND scope = 'class'
        AND amount = 1000000 AND account_no = '0975587586' LIMIT 1`
  ).bind(nguoi.cohort_id).first();
  if (round && duLe === 'co') {
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

  return json({ ok: true, ho_ten: dat.ho_ten, du_le: duLe, phi });
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
            d.chuc_vu, d.nhu_cau_ket_noi, d.anh_url, d.logo_url, d.ho_so_luc,
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
    ['Lĩnh vực', x => x.linh_vuc],
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
