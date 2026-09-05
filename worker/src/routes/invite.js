import { json, error, readJson } from '../lib/http.js';
import { resolveInviteToken, createSession, sessionCookieHeader } from '../auth.js';
import { logActivity } from '../permissions.js';
import { cleanText, normalizeEmail, isValidEmail } from '../lib/validate.js';
import { isValidVnPhone, phonesMatch } from '../lib/phone.js';
import { clientIp, conQuota, ghiNhan } from '../lib/ratelimit.js';
import { soHopLeTuHoSo, DOAN_SAI_MOI_HO_SO, DOAN_SAI_MOI_IP } from './onboard.js';

async function laySoRosterCuaMember(env, member) {
  return member.roster_id
    ? env.DB.prepare('SELECT phone FROM roster WHERE id = ?').bind(member.roster_id).first()
    : null;
}

export async function getInvite(env, token) {
  const member = await resolveInviteToken(env, token);
  if (!member) return error('invite_invalid_or_expired', 410);
  const group = await env.DB.prepare('SELECT no, label FROM groups WHERE id = ?').bind(member.group_id).first();
  const daNhan = !!member.claimed_at;
  const person = await laySoRosterCuaMember(env, member);
  return json({
    member: {
      id: member.id,
      full_name: member.full_name,
      title: member.title,
      company: member.company,
      // Hồ sơ ĐÃ CÓ NGƯỜI NHẬN thì KHÔNG trả số điện thoại ra đây — đây chính
      // là thứ người bấm vào link phải TỰ GÕ ĐÚNG để chứng minh là mình (xem
      // postInviteClaim bên dưới). Trả sẵn số ra thì ai cầm link cũng đọc
      // được rồi gõ y nguyên, chốt chặn coi như không có.
      phone: daNhan ? null : member.phone,
      email: member.email,
      already_claimed: daNhan,
      // Chỉ có ý nghĩa khi already_claimed: hồ sơ này có số nào để đối chiếu
      // ở bước NHẬN LẠI không (xem xacNhanLaiSo). Giao diện dùng cờ này để
      // KHÔNG bắt gõ một số sẽ chẳng bao giờ khớp — xem lý do ở xacNhanLaiSo.
      has_phone_on_file: soHopLeTuHoSo(person, member).length > 0,
    },
    group,
  });
}

/* Hồ sơ ĐÃ CÓ NGƯỜI NHẬN mà vẫn phát lại được link (Ngô Phú Cường yêu cầu 5/9
   mở rộng "phát lại link mời" ra cả người đã đăng nhập, cả lớp — xem
   routes/danh-ba.js) thì TOKEN một mình không còn đủ làm bằng chứng: ai cầm
   được link — kể cả Ban cán sự lớp bấm nhầm người, kể cả link lỡ lộ ra ngoài
   — sẽ đăng nhập thẳng vào tài khoản người khác nếu không có chốt này, vì
   bước nhận trước đây chỉ cần một email tự chọn, không đòi gì thêm.
   Đòi lại đúng SỐ ĐIỆN THOẠI, CÙNG bậc kiểm và CÙNG hạn mức (doan_so_ho_so /
   doan_so_ip) với lần đăng nhập đầu ở /vao — không mở thêm một cửa dò số
   song song không bị khoá. */
async function xacNhanLaiSo(env, request, member, body) {
  const person = await laySoRosterCuaMember(env, member);
  const soDoiChieu = soHopLeTuHoSo(person, member);
  // Hồ sơ CHƯA TỪNG có số điện thoại nào — cả Ban tổ chức lẫn tự đặt — thì
  // không có gì để đối chiếu. Bắt gõ đúng một số không tồn tại là khoá VĨNH
  // VIỄN, không phải "an toàn hơn cho qua" như bản đầu viết: đúng nhóm người
  // này (roster không có số — xem bo-sung-dien-thoai.csv) vốn NHẬN LẦN ĐẦU mà
  // cũng không cần số (nhánh !wasClaimed không gọi hàm này) — cho qua ở đây
  // chỉ GIỮ NGUYÊN mức bảo vệ họ vốn đã có (một token không đoán được), không
  // hạ thấp thêm gì. Phát hiện thật 5/9: Đinh Khánh Toàn (Nhóm 9, không có số
  // trong roster) không tài nào NHẬN LẠI được vì mọi số gõ vào đều báo sai —
  // lỗi này không tự báo, chỉ lộ ra khi có người thật vấp phải.
  if (!soDoiChieu.length) return null;

  const ip = clientIp(request);
  const hetPhan = !(await conQuota(env, 'doan_so_ho_so', `r${member.roster_id}`, DOAN_SAI_MOI_HO_SO))
               || !(await conQuota(env, 'doan_so_ip', ip, DOAN_SAI_MOI_IP));
  if (hetPhan) return error('rate_limited', 429, { retry_after_minutes: 60 });

  // Gõ hụt một chữ số thì KHÔNG tính là một lần đoán — giống hệt doiChieu().
  if (!isValidVnPhone(body.phone)) return error('phone_invalid', 422);

  if (!soDoiChieu.some(so => phonesMatch(so, body.phone))) {
    await ghiNhan(env, 'doan_so_ho_so', `r${member.roster_id}`);
    await ghiNhan(env, 'doan_so_ip', ip);
    return error('phone_mismatch', 401);
  }
  return null;
}

export async function postInviteClaim(request, env, token) {
  const member = await resolveInviteToken(env, token);
  if (!member) return error('invite_invalid_or_expired', 410);

  const body = await readJson(request);
  const wasClaimed = !!member.claimed_at;

  // Xác nhận lại danh tính TRƯỚC khi làm bất cứ việc gì khác (kể cả soi email
  // đã dùng chưa) — đúng thứ tự "xác thực trước, xử lý sau".
  if (wasClaimed) {
    const loi = await xacNhanLaiSo(env, request, member, body);
    if (loi) return loi;
  }

  const email = normalizeEmail(body.email);
  if (!email) return error('email_required', 422);
  if (!isValidEmail(email)) return error('email_invalid', 422);

  // Không để người này nhận nhầm email của người khác trong lớp — email là
  // đường đăng nhập lại ở Đợt 2 nên trùng email là trùng luôn lối vào.
  const taken = await env.DB.prepare(
    'SELECT full_name FROM members WHERE cohort_id = ? AND email = ? AND id <> ?'
  ).bind(member.cohort_id, email, member.id).first();
  if (taken) return error('email_taken', 409, { taken_by: taken.full_name });

  // Chỉ ghi đè khi người dùng thật sự gửi giá trị — gửi thiếu field thì giữ
  // nguyên bản cũ, không xoá trắng.
  const title = 'title' in body ? (cleanText(body.title, 120) ?? member.title) : member.title;
  const company = 'company' in body ? (cleanText(body.company, 160) ?? member.company) : member.company;
  const phone = 'phone' in body ? (cleanText(body.phone, 30) ?? member.phone) : member.phone;

  try {
    await env.DB.prepare(
      `UPDATE members SET email = ?, phone = ?, title = ?, company = ?,
         claimed_at = COALESCE(claimed_at, datetime('now')), updated_at = datetime('now')
       WHERE id = ?`
    ).bind(email, phone, title, company, member.id).run();
  } catch (err) {
    if (String(err).includes('UNIQUE')) return error('email_taken', 409);
    throw err;
  }

  await logActivity(env, {
    cohortId: member.cohort_id,
    groupId: member.group_id,
    actorId: member.id,
    verb: wasClaimed ? 'member.update' : 'member.claim',
    objectType: 'member',
    objectId: member.id,
    summary: wasClaimed ? 'sửa lại hồ sơ' : 'xác nhận hồ sơ của mình',
  });

  const sessionToken = await createSession(env, member.id, request.headers.get('user-agent'));
  const isHttps = new URL(request.url).protocol === 'https:';
  return json(
    { ok: true, member_id: member.id },
    200,
    { 'set-cookie': sessionCookieHeader(sessionToken, isHttps) }
  );
}
