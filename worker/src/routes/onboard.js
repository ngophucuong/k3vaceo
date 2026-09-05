// Tự nhận diện tại /vao.
//
// LUỒNG LẦN ĐẦU (rút gọn 27/8 — xem "Bỏ OTP ở lần đầu" trong CLAUDE.md):
//   1. Gõ tên → chọn đúng mình trong danh sách gốc 134 người
//   2. Nhập SỐ ĐIỆN THOẠI để chứng minh đúng là mình — số này Ban tổ chức đã
//      có sẵn, KHÔNG gửi gì tới nó, chỉ đối chiếu
//   3. Khai email → VÀO LUÔN, không cần mã
//   4. Mời đặt passkey ngay — đây mới là thứ giữ chỗ cho những lần sau
//
// LUỒNG VÀO LẠI: passkey, hoặc mã 6 số qua email (/dangnhap). Số điện thoại
// KHÔNG dùng lại được.
//
// CHỐT CHẶN QUAN TRỌNG NHẤT: đường số-điện-thoại chỉ mở được hồ sơ CHƯA AI
// NHẬN (claimed_at IS NULL). Nhận xong là cửa đóng vĩnh viễn.
//
// Vì sao phải có chốt ấy: số điện thoại KHÔNG phải bí mật trong nội bộ lớp —
// danh sách lớp kèm số rất có thể đã lưu hành, và trong nhóm Zalo thì số
// thường nhìn thấy được. Nó chặn được người ngoài, không chặn được bạn cùng
// lớp. Nếu để số dùng lại mãi thì ai có danh sách cũng đăng nhập được vào chỗ
// bất kỳ ai, bất cứ lúc nào, kể cả trưởng nhóm (mở sổ thu, tạo đợt thu, cho
// người khác ngừng tham gia). Khoá vào lần-đầu-duy-nhất thì cửa sổ ấy đóng
// ngay khi chính chủ đăng nhập lần đầu.
//
// Nguyên tắc N4 SRS viết nguyên văn "không xác minh email, không OTP" — nên
// bỏ OTP là quay về đúng chuẩn gốc, chứ không phải nới ra khỏi nó. OTP giữ
// làm ĐƯỜNG DỰ PHÒNG: vào lại, và ai muốn kiểm chứng email để có đường khôi
// phục khi mất máy.

import { json, error, readJson } from '../lib/http.js';
import {
  createOtp, verifyOtp, createSession, sessionCookieHeader, OTP_MAX_ATTEMPTS,
} from '../auth.js';
import { logActivity } from '../permissions.js';
import { normalizeEmail, isValidEmail } from '../lib/validate.js';
import { normalizePhone, isValidVnPhone, phonesMatch } from '../lib/phone.js';
import { mailerConfigured, sendMail } from '../mailer.js';
import { clientIp, allow, conQuota, ghiNhan } from '../lib/ratelimit.js';
import { cheEmail as che } from '../lib/che.js';

// ── Hạn mức của cửa số điện thoại ────────────────────────────────────────
// Số điện thoại là cửa an ninh DUY NHẤT của lần đăng nhập đầu, nên phải khoá
// chặt. Nhưng bản 27/8 khoá nhầm chỗ: 10 lượt/IP/giờ, tính cả lượt THÀNH CÔNG.
// Cả lớp ngồi chung hội trường thì chung đúng một địa chỉ IP, nên người thứ 11
// vào lần đầu nhận 429 — đo được, xem scripts/kiem/kiem-tanso.mjs.
//
// Nay đếm đúng thứ cần đếm: chỉ lượt ĐOÁN SAI SỐ mới vào sổ. Người vào đúng
// ngay lần đầu không tiêu của ai một lượt nào.
//
// Hai thùng, và thùng THEO HỒ SƠ mới là cửa thật: muốn dò số của ai thì phải
// nện vào đúng roster_id của người ấy, mà 8 lần một giờ thì không đi tới đâu
// trước 10^8 khả năng. Thùng theo IP để chặn máy quét rải mỏng trên nhiều hồ
// sơ — mỗi hồ sơ chỉ một phát nên thùng kia không bắt được.
//
// Export hai hằng số này vì routes/invite.js dùng lại CHUNG hai thùng khi xác
// nhận lại số cho một hồ sơ ĐÃ CÓ NGƯỜI NHẬN (phát lại link mời) — cùng một
// bí mật đang bị soi thì phải cùng một hạn mức, không thì đi đường kia là
// được thêm một lượt đoán miễn phí.
export const DOAN_SAI_MOI_HO_SO = 8;
export const DOAN_SAI_MOI_IP = 30;

// Ba đường /check, /vao, /start soi CÙNG một bí mật, nên phải dùng CHUNG hạn
// mức. Tách ra thì kẻ dò gọi xen kẽ là được gấp ba số lần — vì vậy chỗ đếm
// nằm trong doiChieu() chứ không ở từng route.
const VERIFY_PER_HOUR = 20;  // nhập mã

// Xin mã: hai lần khoá, cố ý khác nhau về chất.
//
// Điều thật sự cần chặn là dội thư vào MỘT hộp thư, nên khoá chặt theo email —
// 5 lần/giờ cho một địa chỉ là quá đủ cho người dùng thật.
//
// Khoá theo IP thì phải lỏng. Bản đầu để 5 lần/giờ chung cho cả IP, và đó là
// lỗi thiết kế với lớp 134 người: cả một công ty ngồi sau một địa chỉ IP, năm
// người xin mã xong là người thứ sáu bị khoá oan suốt một giờ mà không hiểu vì
// sao. Nâng lên 40 rồi, nhưng 40 VẪN dưới sĩ số lớp — mà đây là lớp học chung
// một hội trường, nên con số nào thấp hơn 134 cũng chỉ bảo đảm được đúng một
// việc: khoá oan người thật. Nay đặt trên sĩ số.
//
// Cái mất: một địa chỉ IP kích được nhiều thư hơn trong một giờ. Chấp nhận
// được vì hai đường xin mã đều KHÔNG gửi tới địa chỉ tuỳ ý — /onboard/start
// đòi đúng số điện thoại trước, /auth/otp chỉ gửi tới email đã có trong lớp.
// Trần thật của cả hệ thống là 134 người × 5 lượt, do khoá theo email quyết
// định, chứ không phải do con số này.
const OTP_PER_HOUR = 150;        // theo IP — chỉ để chặn máy quét
const OTP_PER_EMAIL_HOUR = 5;    // theo email — chặn dội thư, đây mới là cửa thật

/* ══ Bước 2: đối chiếu số điện thoại ══════════════════════════════════════
   Chỉ để giao diện báo sớm cho người dùng. KHÔNG phải cửa an ninh — cửa thật
   nằm ở postOnboardStart, nơi số được kiểm lại lần nữa trước khi gửi mã. Có
   như vậy thì gọi thẳng API bỏ qua bước này cũng không lọt. */
export async function postOnboardCheck(request, env) {
  const body = await readJson(request);
  const ket_qua = await doiChieu(env, request, body);
  if (ket_qua.loi) return error(ket_qua.loi, ket_qua.ma, ket_qua.them);

  const { person, member } = ket_qua;
  return json({
    ok: true,
    full_name: person.full_name,
    // Nhóm THẬT trước, danh sách gốc chỉ là đường lui khi chưa có hồ sơ.
    group_label: member?.group_label || person.group_label,
    da_chuyen_nhom: !!(member?.group_label && member.group_label !== person.group_label),
    title: person.title,
    company: person.company,
    // Đã nhận chỗ rồi thì giao diện mời đăng nhập bằng email sẵn có, đỡ phải
    // khai lại — nhưng vẫn không tiết lộ email đó là gì.
    da_nhan_cho: !!member?.claimed_at,
    goi_y_email: member?.email ? che(member.email) : null,
  });
}

/* ══ Vào thẳng: số điện thoại đúng là có phiên, không cần mã ═══════════════
   CHỈ cho hồ sơ CHƯA AI NHẬN. Xem khối chú thích đầu tệp để biết vì sao chốt
   ấy là thứ giữ cho đường này an toàn được. */
export async function postOnboardVao(request, env) {
  const body = await readJson(request);

  const ket_qua = await doiChieu(env, request, body);
  if (ket_qua.loi) return error(ket_qua.loi, ket_qua.ma, ket_qua.them);
  const { person } = ket_qua;
  let { member } = ket_qua;

  // CHỐT CHẶN. Hồ sơ đã có người nhận thì số điện thoại hết tác dụng — vào lại
  // phải bằng passkey hoặc mã email. Kiểm ở ĐÂY chứ không tin giao diện
  // (quy ước 6): giao diện đã rẽ nhánh sẵn từ /api/onboard/check, nhưng gọi
  // thẳng API bỏ qua nó thì vẫn phải chặn.
  if (member?.claimed_at) return error('da_nhan_cho', 409);

  const email = normalizeEmail(body.email);
  if (!email || !isValidEmail(email)) return error('email_invalid', 422);

  // Email là lối đăng nhập lại, nên trùng email là trùng luôn lối vào.
  const taken = await env.DB.prepare(
    'SELECT full_name FROM members WHERE cohort_id = ? AND email = ? AND roster_id IS NOT ?'
  ).bind(person.cohort_id, email, person.id).first();
  if (taken) return error('email_taken', 409, { taken_by: taken.full_name });

  if (!member) {
    const group = await env.DB.prepare(
      'SELECT id FROM groups WHERE cohort_id = ? AND label = ?'
    ).bind(person.cohort_id, person.group_label).first();
    if (!group) return error('group_not_found', 404);

    member = await env.DB.prepare(
      `INSERT INTO members (cohort_id, group_id, roster_id, full_name, title, company,
                            phone, email, claimed_at, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), 1, datetime('now'), datetime('now'))
       RETURNING id, full_name`
    ).bind(person.cohort_id, group.id, person.id, person.full_name, person.title,
           person.company, normalizePhone(body.phone), email).first();
  } else {
    // COALESCE trên claimed_at là thừa ở đây (đã chặn ở trên nếu khác NULL),
    // nhưng giữ cho hai chỗ đặt claimed_at trong tệp này viết giống hệt nhau.
    await env.DB.prepare(
      `UPDATE members SET email = ?, claimed_at = COALESCE(claimed_at, datetime('now')),
              updated_at = datetime('now') WHERE id = ?`
    ).bind(email, member.id).run();
  }

  // KHÔNG đặt email_verified_at: email thật sự chưa được kiểm chứng. Passkey
  // vẫn mở được (xem routes/passkey.js), còn ai muốn có đường khôi phục khi
  // mất máy thì tự bấm gửi mã trong tab Tài khoản.
  const token = await createSession(env, member.id, request.headers.get('user-agent'));

  await logActivity(env, {
    cohortId: person.cohort_id, groupId: member.group_id ?? null, actorId: member.id,
    verb: 'member.claim', objectType: 'member', objectId: member.id,
    summary: 'tự nhận diện và vào ứng dụng lần đầu',
  });

  return json({ ok: true, full_name: person.full_name }, 200, {
    'Set-Cookie': sessionCookieHeader(token, new URL(request.url).protocol === 'https:'),
  });
}

/* ══ Bước 3: khai email, nhận mã ══════════════════════════════════════════ */
export async function postOnboardStart(request, env, ctx) {
  if (!(await allow(env, 'otp_request', clientIp(request), OTP_PER_HOUR))) {
    return error('rate_limited', 429, { retry_after_minutes: 60 });
  }
  const body = await readJson(request);

  // Kiểm lại số điện thoại ở đây mới là cửa thật.
  const ket_qua = await doiChieu(env, request, body);
  if (ket_qua.loi) return error(ket_qua.loi, ket_qua.ma, ket_qua.them);
  const { person } = ket_qua;
  let { member } = ket_qua;

  const email = normalizeEmail(body.email);
  if (!email || !isValidEmail(email)) return error('email_invalid', 422);

  // Khoá theo email — cửa thật chặn dội thư. Đặt sau khi đã đối chiếu số điện
  // thoại nên không dùng để dò được gì.
  if (!(await allow(env, 'otp_email', email, OTP_PER_EMAIL_HOUR))) {
    return error('rate_limited', 429, { retry_after_minutes: 60 });
  }

  // Email là lối đăng nhập, nên trùng email là trùng luôn lối vào.
  const taken = await env.DB.prepare(
    'SELECT full_name FROM members WHERE cohort_id = ? AND email = ? AND roster_id IS NOT ?'
  ).bind(person.cohort_id, email, person.id).first();
  if (taken) return error('email_taken', 409, { taken_by: taken.full_name });

  if (!mailerConfigured(env)) return error('mailer_not_configured', 503);

  if (!member) {
    // Chưa có dòng trong members (các nhóm khác Nhóm 6 chưa ai kích hoạt).
    // Tạo hồ sơ nhưng CHƯA đặt claimed_at — chỉ khi nhập đúng mã mới tính là
    // đã nhận chỗ. Không thì ai cũng tạo được hồ sơ ma bằng cách bỏ ngang.
    const group = await env.DB.prepare(
      'SELECT id FROM groups WHERE cohort_id = ? AND label = ?'
    ).bind(person.cohort_id, person.group_label).first();
    if (!group) return error('group_not_found', 404);

    member = await env.DB.prepare(
      `INSERT INTO members (cohort_id, group_id, roster_id, full_name, title, company,
                            phone, email, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
       RETURNING id, full_name, email`
    ).bind(person.cohort_id, group.id, person.id, person.full_name, person.title,
           person.company, normalizePhone(body.phone), email).first();
  } else {
    await env.DB.prepare(
      `UPDATE members SET email = ?, updated_at = datetime('now') WHERE id = ?`
    ).bind(email, member.id).run();
  }

  try {
    await guiMa(env, ctx, { id: member.id, full_name: person.full_name, email });
  } catch (err) {
    return error('mail_send_failed', 502, err?.buoc ? { hong_o_buoc: err.buoc } : undefined);
  }
  return json({ ok: true, email: che(email) });
}

/* ══ Đăng nhập lại: chỉ cần email ═════════════════════════════════════════ */
export async function postOtpRequest(request, env, ctx) {
  const body = await readJson(request);
  const email = normalizeEmail(body.email);
  if (!email || !isValidEmail(email)) return error('email_invalid', 422);

  // Khoá theo email đặt TRƯỚC khi tra cơ sở dữ liệu, và áp cho mọi email dù có
  // thật hay không — nếu chỉ áp cho email có thật thì chính cái khoá ấy lộ ra
  // địa chỉ nào đã đăng ký.
  if (!(await allow(env, 'otp_email', email, OTP_PER_EMAIL_HOUR)) ||
      !(await allow(env, 'otp_request', clientIp(request), OTP_PER_HOUR))) {
    return error('rate_limited', 429, { retry_after_minutes: 60 });
  }

  const member = await env.DB.prepare(
    'SELECT id, full_name, email FROM members WHERE email = ? AND is_active = 1'
  ).bind(email).first();

  // Trả lời giống hệt nhau dù email có trong lớp hay không — nếu khác nhau thì
  // ai cũng dò được ai đã đăng ký, chỉ bằng cách thử từng địa chỉ.
  const cungMotCau = json({ ok: true, sent_if_known: true });
  if (!member) return cungMotCau;
  if (!mailerConfigured(env)) return error('mailer_not_configured', 503);

  // Gửi hỏng thì nói thật. Vẫn không lộ email nào có thật: câu này chỉ xuất
  // hiện khi đã tìm thấy người, mà tới được đây thì người dùng gõ đúng email
  // của chính mình rồi.
  try {
    await guiMa(env, ctx, member);
  } catch (err) {
    return error('mail_send_failed', 502, err?.buoc ? { hong_o_buoc: err.buoc } : undefined);
  }
  return cungMotCau;
}

/* ══ Nhập mã → có phiên ═══════════════════════════════════════════════════ */
export async function postOtpVerify(request, env) {
  // Chỉ lần nhập SAI mới vào sổ. Tính cả lượt đúng thì cả lớp cùng một WiFi
  // sẽ khoá nhau: người thứ 21 gõ đúng mã của mình vẫn nhận 429.
  const ip = clientIp(request);
  if (!(await conQuota(env, 'otp_verify', ip, VERIFY_PER_HOUR))) {
    return error('rate_limited', 429, { retry_after_minutes: 60 });
  }
  const body = await readJson(request);
  const email = normalizeEmail(body.email);
  const code = String(body.code ?? '').replace(/\D/g, '');
  if (!email || !isValidEmail(email)) return error('email_invalid', 422);
  if (code.length !== 6) return error('otp_invalid_format', 422);

  const member = await env.DB.prepare(
    'SELECT id, full_name, group_id, cohort_id, claimed_at FROM members WHERE email = ? AND is_active = 1'
  ).bind(email).first();
  // Email lạ trả cùng một lỗi với mã sai, để không lộ email nào có thật.
  if (!member) { await ghiNhan(env, 'otp_verify', ip); return error('otp_wrong', 401); }

  const kq = await verifyOtp(env, member.id, code);
  if (!kq.ok) {
    await ghiNhan(env, 'otp_verify', ip);
    const ma = kq.reason === 'otp_locked' ? 429 : kq.reason === 'otp_expired' ? 410 : 401;
    return error(kq.reason, ma, kq.con_lai !== undefined ? { con_lai: kq.con_lai } : undefined);
  }

  const lanDau = !member.claimed_at;
  await env.DB.prepare(
    `UPDATE members
        SET email_verified_at = datetime('now'),
            claimed_at = COALESCE(claimed_at, datetime('now')),
            updated_at = datetime('now')
      WHERE id = ?`
  ).bind(member.id).run();

  // Nhật ký công khai ở tab Nhóm — đây là lớp chống chiếm chỗ rẻ nhất: ai nhận
  // chỗ của người khác thì cả nhóm nhìn thấy ngay trong ngày.
  if (lanDau) {
    await logActivity(env, {
      cohortId: member.cohort_id, groupId: member.group_id, actorId: member.id,
      verb: 'member.claim', objectType: 'member', objectId: member.id,
      summary: 'xác nhận hồ sơ của mình bằng mã gửi qua email',
    });
  }

  const token = await createSession(env, member.id, request.headers.get('user-agent'));
  const isHttps = new URL(request.url).protocol === 'https:';
  return json(
    { ok: true, member_id: member.id, lan_dau: lanDau },
    200,
    { 'set-cookie': sessionCookieHeader(token, isHttps) }
  );
}

/* ══ Đã đăng nhập nhưng email chưa kiểm chứng ═════════════════════════════
   Xảy ra với ai vào bằng LINK MỜI: link đó chứng minh trưởng nhóm đã gửi riêng
   cho họ, đủ để cấp phiên, nhưng chưa chứng minh họ cầm hộp thư đã khai. Mà
   passkey thì bắt buộc phải có đường lui bằng email, nên phải xác minh nốt.

   Hai route này dùng PHIÊN chứ không nhận email trong thân — nhờ vậy không có
   chỗ nào để dò xem email nào có trong lớp. */
export async function postVerifyMyEmail(request, env, ctx, me) {
  if (!(await allow(env, 'otp_request', clientIp(request), OTP_PER_HOUR))) {
    return error('rate_limited', 429, { retry_after_minutes: 60 });
  }
  if (!me.email) return error('email_required', 409);
  if (me.email_verified_at) return json({ ok: true, da_kiem_chung: true });
  if (!mailerConfigured(env)) return error('mailer_not_configured', 503);

  try {
    await guiMa(env, ctx, me);
  } catch (err) {
    return error('mail_send_failed', 502, err?.buoc ? { hong_o_buoc: err.buoc } : undefined);
  }
  return json({ ok: true, email: che(me.email) });
}

export async function postVerifyMyEmailConfirm(request, env, me) {
  const ip = clientIp(request);
  if (!(await conQuota(env, 'otp_verify', ip, VERIFY_PER_HOUR))) {
    return error('rate_limited', 429, { retry_after_minutes: 60 });
  }
  const body = await readJson(request);
  const code = String(body.code ?? '').replace(/\D/g, '');
  if (code.length !== 6) return error('otp_invalid_format', 422);

  const kq = await verifyOtp(env, me.id, code);
  if (!kq.ok) {
    await ghiNhan(env, 'otp_verify', ip);
    const ma = kq.reason === 'otp_locked' ? 429 : kq.reason === 'otp_expired' ? 410 : 401;
    return error(kq.reason, ma, kq.con_lai !== undefined ? { con_lai: kq.con_lai } : undefined);
  }
  await env.DB.prepare(
    `UPDATE members SET email_verified_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`
  ).bind(me.id).run();
  return json({ ok: true });
}

/* ══ Dùng chung ═══════════════════════════════════════════════════════════ */

// Số nào được coi là "đúng" của một hồ sơ, từ đúng hai nguồn:
//   1. Số Ban tổ chức ghi trong danh sách gốc (roster.phone).
//   2. Số mà CHÍNH CHỦ đã tự sửa trong hồ sơ (members.phone có dấu
//      phone_self_set_at) — dành cho ai bị ghi sai số hoặc chưa có số nào:
//      vào bằng link mời, sửa đúng số của mình, từ lần sau tự vào được.
// Cố ý không nhận số do người cùng nhóm sửa hộ: nhận thì A sửa số của B
// thành số mình rồi đăng nhập ở /dangnhap nhận là B, đổi luôn email đăng nhập của B.
//
// Export vì routes/invite.js dùng lại CHUNG câu hỏi này khi phát lại link mời
// cho một hồ sơ ĐÃ CÓ NGƯỜI NHẬN — cùng một câu hỏi "đúng là người này
// không", viết hai bản dễ lệch nhau lúc sửa một bên mà quên bên kia.
export function soHopLeTuHoSo(person, member) {
  const ds = [person?.phone];
  if (member?.phone && member.phone_self_set_at) ds.push(member.phone);
  return ds.filter(Boolean);
}

// Đối chiếu roster_id + số điện thoại. Trả về { person, member } hoặc { loi }.
//
// Hạn mức nằm TRONG hàm này chứ không ở từng route: /check, /vao và /start đều
// soi cùng một bí mật, để mỗi đường một sổ riêng thì kẻ dò gọi xen kẽ là được
// gấp ba số lần đoán.
async function doiChieu(env, request, body) {
  const rosterId = Number(body.roster_id);
  if (!Number.isInteger(rosterId) || rosterId <= 0) return { loi: 'roster_invalid', ma: 422 };

  // Hỏi sổ trước, nhưng CHƯA ghi gì — chỉ lần đoán sai ở cuối hàm mới vào sổ.
  const ip = clientIp(request);
  const hetPhan = !(await conQuota(env, 'doan_so_ho_so', `r${rosterId}`, DOAN_SAI_MOI_HO_SO))
               || !(await conQuota(env, 'doan_so_ip', ip, DOAN_SAI_MOI_IP));
  if (hetPhan) return { loi: 'rate_limited', ma: 429, them: { retry_after_minutes: 60 } };

  const person = await env.DB.prepare('SELECT * FROM roster WHERE id = ?').bind(rosterId).first();
  if (!person) return { loi: 'roster_not_found', ma: 404 };

  // Lấy kèm nhãn nhóm THẬT của dòng members. Danh sách gốc là bản ghi ngày
  // 15/8 và không đổi khi Ban tổ chức chuyển ai sang nhóm khác giữa khoá —
  // Nguyễn Thị Tùng Vân là ca đầu tiên: gốc ghi Nhóm 8, thực tế ở Nhóm 6.
  // Hiện nhóm cũ ở màn xác nhận thì người ta tưởng ứng dụng ghi sai.
  const member = await env.DB.prepare(
    `SELECT m.id, m.full_name, m.email, m.claimed_at, m.phone, m.phone_self_set_at,
            m.is_active, g.label AS group_label
       FROM members m LEFT JOIN groups g ON g.id = m.group_id
      WHERE m.roster_id = ?`
  ).bind(rosterId).first();

  const soDoiChieu = soHopLeTuHoSo(person, member);

  // Không có số nào để soi (44/134 người trong danh sách gốc). Nói rõ để họ
  // biết đường xin link mời, chứ báo "sai số" thì họ gõ lại cả buổi.
  if (!soDoiChieu.length) {
    return { loi: 'phone_missing_in_roster', ma: 409,
             // Nhóm THẬT ở đây nữa. Sót chỗ này thì người đã chuyển nhóm đọc
             // câu "chưa đối chiếu được" kèm tên nhóm CŨ — vừa sai vừa đúng
             // lúc họ đang bối rối nhất.
             them: { full_name: person.full_name,
                     group_label: member?.group_label || person.group_label } };
  }

  // Gõ hụt một chữ số thì KHÔNG tính là một lần đoán: máy dò gửi số đủ khuôn,
  // chỉ người thật mới gõ thiếu. Tính vào sổ ở đây là phạt đúng người vô tội.
  if (!isValidVnPhone(body.phone)) return { loi: 'phone_invalid', ma: 422 };

  // Cố tình KHÔNG nói lệch ở chỗ nào — nói ra là biến ô này thành công cụ dò số.
  if (!soDoiChieu.some(so => phonesMatch(so, body.phone))) {
    // ĐÂY là lần thử duy nhất đáng ghi vào sổ. Ghi cả hai thùng: thùng theo hồ
    // sơ chặn người nện vào một cái tên, thùng theo IP chặn máy quét rải mỏng
    // mỗi hồ sơ một phát.
    await ghiNhan(env, 'doan_so_ho_so', `r${rosterId}`);
    await ghiNhan(env, 'doan_so_ip', ip);
    return { loi: 'phone_mismatch', ma: 401 };
  }

  // Đã ngừng tham gia thì mọi đường vào phải đóng, kể cả đường này. Hạ
  // is_active về 0 rút được phiên, passkey và thông báo đẩy — nhưng KHÔNG rút
  // được /vao, vì chốt chặn duy nhất ở đó là claimed_at, mà ai bị cho ngừng
  // TRƯỚC khi kịp nhận hồ sơ thì claimed_at vẫn còn trống. Trước khi vá, họ
  // vào được: máy chủ cấp cookie, đặt claimed_at, ghi cả một dòng nhật ký —
  // rồi getCurrentMember lọc is_active nên mọi lời gọi sau đó rơi hết. Người
  // dùng thấy "đã vào" xong bị đá ra, mà cửa /vao thì đóng vĩnh viễn sau lưng.
  //
  // Đặt SAU phép so số: ai chưa biết số của người ta thì cũng không được biết
  // người ta đã nghỉ hay chưa.
  if (member && !member.is_active) return { loi: 'da_ngung_tham_gia', ma: 409 };

  return { person, member: member ?? null };
}

async function guiMa(env, ctx, member) {
  const { code, minutes } = await createOtp(env, member.id);
  const text = [
    `Chào ${member.full_name},`,
    '',
    'Mã đăng nhập công cụ nhóm K03 của bạn là:',
    '',
    `    ${code}`,
    '',
    `Mã dùng một lần và hết hạn sau ${minutes} phút.`,
    `Nhập sai quá ${OTP_MAX_ATTEMPTS} lần thì mã bị huỷ, xin mã mới.`,
    '',
    'Nếu bạn không yêu cầu đăng nhập thì bỏ qua thư này.',
  ].join('\n');

  // CHỜ gửi xong rồi mới trả lời, và để lỗi nổi lên cho người gọi.
  //
  // Bản cũ đẩy việc gửi sang ctx.waitUntil cho người dùng khỏi ngồi đợi SMTP
  // bắt tay. Đó chính là chỗ hỏng, đo được ngày 24/8: log Worker không hề có
  // dòng báo đã gửi xong, mà cũng không có dòng lỗi nào. Cả hai cùng vắng
  // nghĩa là hàm không chạy tới cuối — Cloudflare dọn Worker đi giữa lúc còn
  // đang bắt tay, nên chẳng có gì để ghi. Thư chết lặng lẽ, người dùng thấy
  // "đã gửi" mà hộp thư trống suốt cả buổi.
  //
  // Cũng KHÔNG nuốt lỗi bằng .catch nữa. Nuốt thì màn hình vẫn báo đã gửi
  // trong khi thư chưa đi — che mất đúng thứ cần biết.
  try {
    await sendMail(env, { to: member.email, subject: `Mã đăng nhập k3vaceo: ${code}`, text });
  } catch (err) {
    console.error('Gửi mã đăng nhập thất bại:', String(err));
    throw err;
  }
  // (LoiSmtp mang theo .buoc — ba chỗ gọi dưới trả nó về trong phúc đáp.)
}

