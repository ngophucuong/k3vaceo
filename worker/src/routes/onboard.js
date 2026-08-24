// Đợt 5 — tự nhận diện rồi đăng nhập bằng OTP qua email.
//
// LUỒNG (mục 4 SRS viết lại):
//   1. Gõ tên → chọn đúng mình trong danh sách gốc 134 người
//   2. Nhập SỐ ĐIỆN THOẠI để chứng minh đúng là mình — số này Ban tổ chức đã
//      có sẵn, KHÔNG gửi gì tới nó, chỉ đối chiếu
//   3. Khai email → nhận mã 6 số qua thư
//   4. Nhập mã → có phiên, email được đánh dấu đã kiểm chứng
//   5. Passkey chỉ hiện ra sau bước 4
//
// Vì sao số điện thoại đủ làm bằng chứng ở bước 2: tên thì cả lớp ai cũng
// biết, còn số thì chỉ Ban tổ chức và người quen mới có. Với lớp 134 người
// biết mặt nhau, cộng nhật ký công khai ở tab Nhóm, thế là đủ (nguyên tắc N4
// — tự giác là chính). Ai chiếm chỗ người khác thì cả nhóm nhìn thấy ngay.

import { json, error, readJson } from '../lib/http.js';
import {
  createOtp, verifyOtp, createSession, sessionCookieHeader, OTP_MAX_ATTEMPTS,
} from '../auth.js';
import { logActivity } from '../permissions.js';
import { normalizeEmail, isValidEmail } from '../lib/validate.js';
import { normalizePhone, isValidVnPhone, phonesMatch } from '../lib/phone.js';
import { mailerConfigured, sendMail } from '../mailer.js';
import { clientIp, allow } from '../lib/ratelimit.js';

const CHECK_PER_HOUR = 20;   // đối chiếu số điện thoại
const OTP_PER_HOUR = 5;      // xin mã — mỗi lần là một lá thư gửi đi
const VERIFY_PER_HOUR = 20;  // nhập mã

/* ══ Bước 2: đối chiếu số điện thoại ══════════════════════════════════════
   Chỉ để giao diện báo sớm cho người dùng. KHÔNG phải cửa an ninh — cửa thật
   nằm ở postOnboardStart, nơi số được kiểm lại lần nữa trước khi gửi mã. Có
   như vậy thì gọi thẳng API bỏ qua bước này cũng không lọt. */
export async function postOnboardCheck(request, env) {
  if (!(await allow(env, 'onboard_check', clientIp(request), CHECK_PER_HOUR))) {
    return error('rate_limited', 429, { retry_after_minutes: 60 });
  }
  const body = await readJson(request);
  const ket_qua = await doiChieu(env, body);
  if (ket_qua.loi) return error(ket_qua.loi, ket_qua.ma, ket_qua.them);

  const { person, member } = ket_qua;
  return json({
    ok: true,
    full_name: person.full_name,
    group_label: person.group_label,
    title: person.title,
    company: person.company,
    // Đã nhận chỗ rồi thì giao diện mời đăng nhập bằng email sẵn có, đỡ phải
    // khai lại — nhưng vẫn không tiết lộ email đó là gì.
    da_nhan_cho: !!member?.claimed_at,
    goi_y_email: member?.email ? che(member.email) : null,
  });
}

/* ══ Bước 3: khai email, nhận mã ══════════════════════════════════════════ */
export async function postOnboardStart(request, env, ctx) {
  if (!(await allow(env, 'otp_request', clientIp(request), OTP_PER_HOUR))) {
    return error('rate_limited', 429, { retry_after_minutes: 60 });
  }
  const body = await readJson(request);

  // Kiểm lại số điện thoại ở đây mới là cửa thật.
  const ket_qua = await doiChieu(env, body);
  if (ket_qua.loi) return error(ket_qua.loi, ket_qua.ma, ket_qua.them);
  const { person } = ket_qua;
  let { member } = ket_qua;

  const email = normalizeEmail(body.email);
  if (!email || !isValidEmail(email)) return error('email_invalid', 422);

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

  await guiMa(env, ctx, { id: member.id, full_name: person.full_name, email });
  return json({ ok: true, email: che(email) });
}

/* ══ Đăng nhập lại: chỉ cần email ═════════════════════════════════════════ */
export async function postOtpRequest(request, env, ctx) {
  const body = await readJson(request);
  const email = normalizeEmail(body.email);
  if (!email || !isValidEmail(email)) return error('email_invalid', 422);

  if (!(await allow(env, 'otp_request', clientIp(request), OTP_PER_HOUR))) {
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

  await guiMa(env, ctx, member);
  return cungMotCau;
}

/* ══ Nhập mã → có phiên ═══════════════════════════════════════════════════ */
export async function postOtpVerify(request, env) {
  if (!(await allow(env, 'otp_verify', clientIp(request), VERIFY_PER_HOUR))) {
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
  if (!member) return error('otp_wrong', 401);

  const kq = await verifyOtp(env, member.id, code);
  if (!kq.ok) {
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

  await guiMa(env, ctx, me);
  return json({ ok: true, email: che(me.email) });
}

export async function postVerifyMyEmailConfirm(request, env, me) {
  if (!(await allow(env, 'otp_verify', clientIp(request), VERIFY_PER_HOUR))) {
    return error('rate_limited', 429, { retry_after_minutes: 60 });
  }
  const body = await readJson(request);
  const code = String(body.code ?? '').replace(/\D/g, '');
  if (code.length !== 6) return error('otp_invalid_format', 422);

  const kq = await verifyOtp(env, me.id, code);
  if (!kq.ok) {
    const ma = kq.reason === 'otp_locked' ? 429 : kq.reason === 'otp_expired' ? 410 : 401;
    return error(kq.reason, ma, kq.con_lai !== undefined ? { con_lai: kq.con_lai } : undefined);
  }
  await env.DB.prepare(
    `UPDATE members SET email_verified_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`
  ).bind(me.id).run();
  return json({ ok: true });
}

/* ══ Dùng chung ═══════════════════════════════════════════════════════════ */

// Đối chiếu roster_id + số điện thoại. Trả về { person, member } hoặc { loi }.
async function doiChieu(env, body) {
  const rosterId = Number(body.roster_id);
  if (!Number.isInteger(rosterId) || rosterId <= 0) return { loi: 'roster_invalid', ma: 422 };

  const person = await env.DB.prepare('SELECT * FROM roster WHERE id = ?').bind(rosterId).first();
  if (!person) return { loi: 'roster_not_found', ma: 404 };

  const member = await env.DB.prepare(
    'SELECT id, full_name, email, claimed_at, phone, phone_self_set_at FROM members WHERE roster_id = ?'
  ).bind(rosterId).first();

  // Hai số được coi là hợp lệ để đối chiếu:
  //   1. Số Ban tổ chức ghi trong danh sách gốc (roster.phone).
  //   2. Số mà CHÍNH CHỦ đã tự sửa trong hồ sơ (members.phone có dấu
  //      phone_self_set_at) — dành cho ai bị ghi sai số hoặc chưa có số nào:
  //      vào bằng link mời, sửa đúng số của mình, từ lần sau tự vào được.
  // Cố ý không nhận số do người cùng nhóm sửa hộ: nhận thì A sửa số của B
  // thành số mình rồi đăng nhập ở /dangnhap nhận là B, đổi luôn email đăng nhập của B.
  const soHopLe = [person.phone];
  if (member?.phone && member.phone_self_set_at) soHopLe.push(member.phone);
  const soDoiChieu = soHopLe.filter(Boolean);

  // Không có số nào để soi (44/134 người trong danh sách gốc). Nói rõ để họ
  // biết đường xin link mời, chứ báo "sai số" thì họ gõ lại cả buổi.
  if (!soDoiChieu.length) {
    return { loi: 'phone_missing_in_roster', ma: 409,
             them: { full_name: person.full_name, group_label: person.group_label } };
  }

  if (!isValidVnPhone(body.phone)) return { loi: 'phone_invalid', ma: 422 };
  // Cố tình KHÔNG nói lệch ở chỗ nào — nói ra là biến ô này thành công cụ dò số.
  if (!soDoiChieu.some(so => phonesMatch(so, body.phone))) return { loi: 'phone_mismatch', ma: 401 };

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

  // Gửi sau khi đã trả lời để người dùng không phải ngồi chờ SMTP bắt tay.
  // Hệ quả: HTTP 200 KHÔNG chứng minh thư đã đi — chỗ duy nhất lộ ra sự thật
  // là dòng console.error này trong log Worker.
  const job = sendMail(env, { to: member.email, subject: `Mã đăng nhập k3vaceo: ${code}`, text })
    .catch(err => console.error('Gửi mã đăng nhập thất bại:', String(err)));
  if (ctx?.waitUntil) ctx.waitUntil(job); else await job;
}

// Che email khi hiển thị lại: "ngophucuong@gmail.com" → "ng•••••••@gmail.com".
// Đủ để người dùng nhận ra hộp thư của mình mà người lạ đứng cạnh không đọc được.
function che(email) {
  const [ten, mien] = String(email).split('@');
  if (!mien) return '•••';
  const dau = ten.slice(0, 2);
  return `${dau}${'•'.repeat(Math.max(3, ten.length - 2))}@${mien}`;
}
