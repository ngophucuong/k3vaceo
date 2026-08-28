// Danh bạ lớp — cả 134 người của khoá K03, không chỉ nhóm mình.
//
// LỆCH CÓ CHỦ Ý SO VỚI N6, Ngô Phú Cường quyết ngày 28/8. N6 viết "dữ liệu
// nhóm cách ly, Nhóm 8 không đọc được gì của Nhóm 6". Đường này cho cả lớp
// thấy nhau. Lý do phân định: N6 sinh ra để bảo vệ VIỆC CỦA NHÓM — sổ thu, bài
// tám phần, thông báo nội bộ — chứ không phải danh tính cá nhân. Danh bạ không
// đụng tới thứ nào trong số đó: không có tiền, không có bài, không có thông
// báo. Đây là lớp 134 chủ doanh nghiệp, và thứ giá trị nhất một khoá học như
// vậy sinh ra là mạng lưới; khoá kết thúc 26/9 thì quỹ, bài và lịch đều chết
// theo, danh bạ thì không.
//
// Phần lớn dữ liệu ở đây VỐN ĐÃ công khai: /api/wizard/roster/search trả tên,
// nhóm, chức vụ và đơn vị cho bất kỳ ai chưa đăng nhập — đó là cách màn
// /dangnhap tìm tên. Cái mới duy nhất là THÔNG TIN LIÊN HỆ, và nó bị che theo
// luật ở lib/che.js.
//
// KHÔNG có bốn dòng hồ sơ (bán gì / bán cho ai / cần gì / giúp được gì) ở đây.
// Chúng là dữ liệu để chia việc trong nhóm; mở ra cả lớp là một quyết định
// khác, và hôm nay gần như chưa ai điền nên mở ra cũng chỉ thấy 134 ô trống.

import { json } from '../lib/http.js';
import { cheSoDienThoai, cheEmail } from '../lib/che.js';

// Nhãn tiếng Việt của vai cấp lớp. Giữ ở đây chứ không để giao diện tự đoán
// theo mã vai: thêm một vai mới mà quên sửa giao diện thì nó hiện mã thô.
// N7: viết đủ "Ban cán sự lớp", không bao giờ viết tắt.
const NHAN_VAI_LOP = {
  lop_truong: 'Lớp trưởng',
  lop_pho: 'Lớp phó',
  thu_quy: 'Thủ quỹ lớp',
  uy_vien: 'Uỷ viên Ban cán sự lớp',
};

export async function getDanhBa(env, me) {
  const rows = await env.DB.prepare(
    `SELECT r.id AS roster_id, r.full_name, r.title AS roster_title,
            r.company AS roster_company, r.phone AS roster_phone,
            r.group_label AS roster_group,
            m.id AS member_id, m.title, m.company, m.phone, m.email, m.claimed_at,
            g.label AS group_label, g.no AS group_no,
            (SELECT o.role FROM officers o
              WHERE o.member_id = m.id AND o.group_id IS NULL
                AND o.superseded_at IS NULL
              ORDER BY o.id LIMIT 1) AS vai_lop
       FROM roster r
       -- Người đã NGỪNG THAM GIA rụng khỏi danh bạ: điều kiện is_active nằm
       -- trong phép JOIN chứ không ở WHERE, nếu không thì dòng roster của họ
       -- bị loại luôn và họ biến mất cả tên. Ở đây họ vẫn còn tên nhưng coi
       -- như chưa đăng nhập — mà thế là đúng: họ không còn là người của lớp.
       LEFT JOIN members m ON m.roster_id = r.id AND m.is_active = 1
       LEFT JOIN groups g ON g.id = m.group_id
      WHERE r.cohort_id = ?
      ORDER BY COALESCE(g.no, CAST(REPLACE(r.group_label, 'Nhóm ', '') AS INTEGER)), r.id`
  ).bind(me.cohort_id).all();

  return json({
    nguoi: (rows.results ?? []).map(r => {
      const daVao = !!r.claimed_at;
      // Số để hiện: số chính chủ hoặc người cùng nhóm đã sửa trong hồ sơ, lùi
      // về số Ban tổ chức ghi trong danh sách gốc.
      const so = r.phone || r.roster_phone || null;
      return {
        roster_id: r.roster_id,
        member_id: r.member_id ?? null,
        full_name: r.full_name,
        // Nhóm THẬT trước, danh sách gốc chỉ là đường lui — danh sách gốc là
        // bản ghi ngày 15/8 và không đổi khi Ban tổ chức chuyển ai sang nhóm
        // khác giữa khoá.
        group_label: r.group_label || r.roster_group,
        group_no: r.group_no ?? null,
        title: r.title || r.roster_title,
        company: r.company || r.roster_company,
        da_dang_nhap: daVao,
        vai_lop: r.vai_lop ? (NHAN_VAI_LOP[r.vai_lop] ?? null) : null,
        // Chưa đăng nhập thì che — xem lý do dài trong lib/che.js.
        phone: daVao ? so : cheSoDienThoai(so),
        email: daVao ? (r.email ?? null) : (r.email ? cheEmail(r.email) : null),
        che: !daVao,
      };
    }),
  });
}
