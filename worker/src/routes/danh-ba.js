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

import { json, error } from '../lib/http.js';
import { cheSoDienThoai, cheEmail } from '../lib/che.js';
import { isClassCommittee, logAudit } from '../permissions.js';
import { reissueInviteToken } from '../auth.js';

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
    // Quyền của NGƯỜI XEM, không phải của từng dòng — giao diện dùng để quyết
    // có bày nút "Tạo link mời" hay không. Máy chủ vẫn kiểm lại trong
    // postDanhBaMoi (quy ước 6: không tin giao diện).
    can_moi: await isClassCommittee(env, me.id),
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

/* ══ Tạo link mời XUYÊN NHÓM — Ban cán sự lớp mới có ══════════════════════
   Ngô Phú Cường yêu cầu 3/9: là uỷ viên Ban cán sự lớp, anh cần phát được link
   mời cho người CHƯA đăng nhập ở BẤT KỲ nhóm nào, không chỉ Nhóm 6 của mình.

   Trước đây việc này khoá cứng vào canManageGroup(me, me.group_id) — trưởng
   hoặc phó của CHÍNH nhóm đó mới mời được người trong nhóm đó. Đường này KHÔNG
   đụng tới canManageGroup: cơ cấu, phần bài, ngừng tham gia của nhóm khác vẫn
   đóng nguyên với người ngoài nhóm — chỉ riêng việc PHÁT LINK MỜI mới mở cho
   Ban cán sự lớp, vì phát link mời không đọc được việc của nhóm (không sổ
   thu, không bài, không thông báo nội bộ) — cùng lý lẽ đã dùng cho N6 ở danh
   bạ, không phải một ngoại lệ mới.

   Vai đủ điều kiện là isClassCommittee (lop_truong/lop_pho/thu_quy/uy_vien),
   không phải isClassOfficer: phát link mời không đụng tiền, nên uỷ viên —
   vai thấp nhất cấp lớp — đã đủ, đúng tinh thần nó được lập ra (mục "Tư liệu:
   sửa được" trong CLAUDE.md, migration 0013). */
export async function postDanhBaMoi(request, env, me, rosterId) {
  if (!(await isClassCommittee(env, me.id))) return error('forbidden', 403);

  const person = await env.DB.prepare(
    'SELECT * FROM roster WHERE id = ? AND cohort_id = ?'
  ).bind(rosterId, me.cohort_id).first();
  if (!person) return error('not_found', 404);

  let member = await env.DB.prepare(
    'SELECT id, full_name, claimed_at FROM members WHERE roster_id = ? AND is_active = 1'
  ).bind(rosterId).first();

  // Đã nhận hồ sơ rồi thì link mời hết tác dụng — đúng chốt chặn của
  // /api/onboard/vao (số điện thoại không dùng lại được sau khi nhận). Người
  // này vào lại bằng passkey hoặc mã email, không phải link mời.
  if (member?.claimed_at) return error('da_nhan_cho', 409);

  if (!member) {
    // Chưa có hồ sơ ở BẤT KỲ nhóm nào — tạo mới, đúng nhóm ghi trong danh
    // sách gốc. Không dùng nhóm của NGƯỜI PHÁT LINK: đây là hồ sơ của người
    // nhận, phải vào đúng nhóm của họ chứ không phải nhóm của Ban cán sự lớp.
    const group = await env.DB.prepare(
      'SELECT id FROM groups WHERE cohort_id = ? AND label = ?'
    ).bind(person.cohort_id, person.group_label).first();
    if (!group) return error('group_not_found', 404);

    member = await env.DB.prepare(
      `INSERT INTO members (cohort_id, group_id, roster_id, full_name, title, company, phone,
                            is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
       RETURNING id, full_name`
    ).bind(person.cohort_id, group.id, person.id, person.full_name,
           person.title, person.company, person.phone).first();
  }

  // reissueInviteToken tự lo cả hai trường hợp: người mới tạo (không có link
  // cũ nào để vô hiệu, UPDATE khớp 0 dòng) và người đã từng được mời (link cũ
  // bị vô hiệu trước khi cấp link mới) — không cần tách nhánh.
  const token = await reissueInviteToken(env, member.id, me.id);

  await logAudit(env, {
    actorId: me.id, action: 'invite.cross_group', targetType: 'member', targetId: member.id,
    ip: request.headers.get('cf-connecting-ip'),
  });

  const origin = new URL(request.url).origin;
  return json({ full_name: member.full_name, url: `${origin}/i/${token}` });
}
