/* Gửi THƯ khi có thông báo mới — Ngô Phú Cường yêu cầu 6/9.
   Nguyên văn: "một ứng dụng chết là có thông báo mới được đăng trên App
   nhưng không có notify đến".

   Vì sao không dựa vào thông báo đẩy: đo trên D1 thật ngày 6/9 thì chỉ 2/146
   người đã bật, và `last_ok_at` của cả hai đều NULL — chưa một gói tin nào
   từng đi. Đường đẩy vẫn giữ (miễn phí, tức thì), nhưng nó KHÔNG phải là thứ
   đang báo tin cho lớp, và không nên chờ nó thành như vậy.

   Vẫn nằm trong lệch có chủ ý của N1 đã chốt ngày 24/8: thư này mang đúng một
   việc — "có tin mới, mở ứng dụng ra xem" — chứ không thành kênh nhắn tin thứ
   hai bên cạnh Zalo. Vì vậy không có nút trả lời, không có chuỗi hội thoại,
   và nội dung cắt ngắn kèm lời mời mở ứng dụng.

   BA điều đã cân nhắc, mỗi điều một lý do:

   1. GỬI MỘT LÁ CHO NHIỀU NGƯỜI BẰNG BCC, không gửi riêng từng lá. Worker có
      trần số lượt gọi ra ngoài mỗi request (gói miễn phí 50); một thông báo
      cả lớp là 66 người và sẽ thành 146, gửi riêng là vượt trần rồi những
      người CUỐI danh sách lặng lẽ không nhận được gì — đúng loại hỏng mà cả
      ngày 5/9 mất công đi tìm. Bcc ở tầng phong bì nên không ai đọc được địa
      chỉ của người khác.

   2. CHIA LÔ. Giữ mỗi lô nhỏ hơn hẳn trần của mọi nhà cung cấp, và để một lô
      hỏng không kéo cả lớp theo.

   3. KHÔNG gửi khi SỬA thông báo — chỉ khi đăng mới. Sửa một dấu phẩy mà 66
      người nhận thư lần nữa thì lần sau họ tắt hết, và mất luôn cả đường báo
      tin thật. Cùng lý do đã áp cho thông báo đẩy ở patchThongBao. */

import { json } from '../lib/http.js';
import { sendMail, mailerConfigured } from '../mailer.js';

// Mỗi lô tối đa bao nhiêu người nhận. 40 chứ không phải 50: Resend chặn ở 50
// địa chỉ cho một lượt gọi (tính gộp to + cc + bcc), nên đặt đúng 50 là chạm
// mép — thêm một dòng nữa ở ô To là cả lô bị từ chối. Và cả lớp 146 người vẫn
// chỉ tốn 4 lượt gọi ra ngoài, thừa chỗ dưới trần 50 subrequest của gói
// Workers miễn phí (đường đẩy cũng ăn vào chính trần ấy).
//
// CHƯA KIỂM CHỨNG ĐƯỢC: Resend đếm hạn mức 100 thư/ngày của gói miễn phí theo
// LƯỢT GỌI hay theo ĐỊA CHỈ NHẬN. Nếu theo địa chỉ thì một thông báo cả lớp
// (66 người có email lúc viết dòng này) ăn 2/3 hạn mức ngày. Chỉ đo được bằng
// bảng điều khiển Resend sau lần gửi thật đầu tiên.
const MOI_LO = 40;

/* Ai nhận thư. Ma trận phạm vi phải TRÙNG KHÍT với guiThongBaoDay() trong
   routes/push.js: thông báo nhóm chỉ tới nhóm ấy, thông báo lớp mới tới cả
   khoá, và không gửi ngược cho chính người đăng. Lệch một chút là cùng một
   thông báo mà đường đẩy tới một nhóm người còn đường thư tới nhóm khác —
   không chỗ nào báo lỗi, chỉ có người kêu "sao tôi không nhận được". */
export async function chonNguoiNhanMail(env, me, capLop) {
  const rows = await env.DB.prepare(
    `SELECT m.email
       FROM members m
      WHERE m.is_active = 1
        AND m.cohort_id = ?
        AND m.id <> ?
        AND COALESCE(m.email, '') <> ''
        AND m.nhan_mail_thong_bao = 1
        AND (? = 1 OR m.group_id = ?)`
  ).bind(me.cohort_id, me.id, capLop ? 1 : 0, me.group_id).all();
  return (rows.results ?? []).map(r => r.email);
}

/* `ds` truyền vào từ chỗ gọi để khỏi hỏi D1 hai lần: postThongBao cần biết SỐ
   người nhận NGAY để trả về trong phúc đáp (việc gửi thì chạy nền, không ai
   ngồi chờ), còn hàm này cần chính danh sách ấy để gửi. */
export async function guiThongBaoMail(env, me, { noi_dung, capLop, nguon, ds }) {
  if (!mailerConfigured(env)) return { bo_qua: 'chưa cấu hình đường gửi thư' };

  ds = ds ?? await chonNguoiNhanMail(env, me, capLop);
  if (!ds.length) return { gui: 0 };

  // `me` từ getCurrentMember() là `members.*` cộng `group_no` — KHÔNG có
  // group_label. Viết nhầm tên cột ở đây thì tiêu đề thư lặng lẽ thành
  // "Thông báo của nhóm" cho cả mười nhóm, không chỗ nào báo lỗi.
  const dau = capLop ? 'Thông báo của lớp K03'
    : `Thông báo của Nhóm ${me.group_no ?? ''}`.trim();
  const than = [
    dau + (nguon ? ` — ${nguon}` : ''),
    '',
    String(noi_dung).slice(0, 600),
    '',
    '— Mở ứng dụng để xem đầy đủ và các thông báo khác:',
    'https://k3vaceo.cuongngo.app/nay',
    '',
    'Không muốn nhận thư mỗi khi có thông báo mới? Mở ứng dụng,',
    'vào tab Tài khoản và tắt "Thư khi có thông báo mới".',
  ].join('\n');

  // Địa chỉ ở ô "To" là chính hòm thư gửi: người nhận thật nằm ở bcc. Để
  // trống ô To thì nhiều máy chủ từ chối thẳng.
  const guiToi = env.MAIL_FROM || env.SMTP_FROM_EMAIL;

  let ok = 0, hong = 0, loi = null;
  for (let i = 0; i < ds.length; i += MOI_LO) {
    const lo = ds.slice(i, i + MOI_LO);
    try {
      await sendMail(env, { to: guiToi, bcc: lo, subject: dau, text: than });
      ok += lo.length;
    } catch (err) {
      hong += lo.length;
      // Giữ lỗi ĐẦU TIÊN kèm tên bước — đó là thứ nói được vì sao hỏng.
      loi = loi ?? (err?.buoc || err?.message || String(err));
      console.error('Gửi thư thông báo thất bại:', String(err));
    }
  }
  return { gui: ok, hong, loi };
}

/* Công tắc của CHÍNH CHỦ — N5 ("chính chủ tự sửa được thông tin của mình,
   không qua ai duyệt"). Không có đường nào cho người khác tắt hộ: nhận thư
   hay không là việc của từng người, và một trưởng nhóm tắt hộ cả nhóm thì
   thông báo lại rơi vào im lặng đúng như trước.

   Dùng phiên, không nhận member_id trong thân — không có chỗ nào để dò. */
export async function putMailThongBao(request, env, me) {
  const body = await request.json().catch(() => ({}));
  const bat = body?.bat === true || body?.bat === 1;
  await env.DB.prepare(
    `UPDATE members SET nhan_mail_thong_bao = ? WHERE id = ?`
  ).bind(bat ? 1 : 0, me.id).run();
  return json({ ok: true, bat });
}
