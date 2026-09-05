import { json, error } from '../lib/http.js';
import { canManageGroup, logAudit } from '../permissions.js';
import { createInviteToken, reissueInviteToken, INVITE_KIND } from '../auth.js';

// Sinh khối văn bản dán vào Zalo — mỗi thành viên chưa nhận tên một dòng kèm
// link riêng. Người nào đang còn lời mời hợp lệ thì giữ nguyên (D1 chỉ lưu bản
// băm nên không in lại được token cũ) và đánh dấu already_sent, để bấm nút hai
// lần không làm chết cả loạt link vừa gửi đi. Ai mất link thì dùng nút phát
// lại riêng cho người đó — POST /api/members/:id/invite.
export async function postWizardInvites(request, env, me) {
  if (!(await canManageGroup(env, me, me.group_id))) return error('forbidden', 403);

  const unclaimed = await env.DB.prepare(
    `SELECT m.id, m.full_name,
            (SELECT COUNT(*) FROM invites i
              WHERE i.member_id = m.id AND i.kind = ? AND i.used_at IS NULL
                AND i.expires_at > datetime('now')) AS live_invites
     FROM members m
     WHERE m.group_id = ? AND m.claimed_at IS NULL AND m.is_active = 1
     ORDER BY m.id`
  ).bind(INVITE_KIND, me.group_id).all();

  const origin = new URL(request.url).origin;
  const lines = [];
  for (const m of unclaimed.results ?? []) {
    const token = m.live_invites > 0 ? null : await createInviteToken(env, m.id, me.id, INVITE_KIND);
    lines.push({
      member_id: m.id,
      full_name: m.full_name,
      url: token ? `${origin}/i/${token}` : null,
      already_sent: !token,
    });
  }

  const text = lines
    .map(l => `${l.full_name} — ${l.url ?? '(đã phát trước đó, xem lại tin nhắn cũ hoặc bấm phát lại)'}`)
    .join('\n');
  return json({ lines, text });
}

// Phát lại link cho đúng một người — kể cả người đã nhận tên rồi (mất máy, xoá
// dữ liệu Safari, đổi điện thoại). Đợt 1 chưa có đăng nhập bằng email nên link
// mời là lối vào duy nhất; không có đường phát lại thì họ mất hẳn quyền vào.
// Mọi lời mời cũ còn hạn của người đó bị đóng lại để chỉ còn một link sống.
//
// An toàn cho người ĐÃ NHẬN nhờ chốt chặn ở bước NHẬN (xacNhanLaiSo,
// routes/invite.js, thêm 5/9) — hồ sơ đã có người nhận thì phải gõ ĐÚNG số
// điện thoại mới nhận lại được. Trước bản sửa đó, route này để hở: ai cầm
// được link phát lại là đăng nhập thẳng vào tài khoản người khác, không cần
// biết số điện thoại hay passkey gì cả — chỉ cần gõ một email tự chọn bất kỳ.
export async function postMemberInvite(request, env, me, targetId) {
  if (!(await canManageGroup(env, me, me.group_id))) return error('forbidden', 403);

  const target = await env.DB.prepare(
    'SELECT id, full_name FROM members WHERE id = ? AND group_id = ? AND is_active = 1'
  ).bind(targetId, me.group_id).first();
  if (!target) return error('not_found', 404);

  const token = await reissueInviteToken(env, target.id, me.id);
  await logAudit(env, {
    actorId: me.id, action: 'invite.reissue', targetType: 'member', targetId: target.id,
    ip: request.headers.get('cf-connecting-ip'),
  });

  const origin = new URL(request.url).origin;
  return json({ full_name: target.full_name, url: `${origin}/i/${token}` });
}
