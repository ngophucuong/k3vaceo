import { json, error } from '../lib/http.js';
import { canManageGroup } from '../permissions.js';
import { reuseOrCreateInviteToken } from '../auth.js';

// Sinh khối văn bản dán vào Zalo — mỗi thành viên chưa nhận tên một dòng kèm
// link riêng. Chỉ trưởng/phó nhóm được phát; token cũ còn hạn thì giữ nguyên
// (không lộ lại token cũ vì DB chỉ lưu hash — coi như "đã phát trước đó").
export async function postWizardInvites(request, env, me) {
  if (!(await canManageGroup(env, me, me.group_id))) return error('forbidden', 403);

  const unclaimed = await env.DB.prepare(
    `SELECT id, full_name FROM members WHERE group_id = ? AND claimed_at IS NULL AND is_active = 1 ORDER BY id`
  ).bind(me.group_id).all();

  const origin = new URL(request.url).origin;
  const lines = [];
  for (const m of unclaimed.results ?? []) {
    const token = await reuseOrCreateInviteToken(env, m.id, me.id);
    lines.push({
      member_id: m.id,
      full_name: m.full_name,
      url: token ? `${origin}/i/${token}` : null,
      already_sent: !token,
    });
  }

  const text = lines.map(l => `${l.full_name} — ${l.url ?? '(đã phát trước đó, xem lại tin nhắn cũ)'}`).join('\n');
  return json({ lines, text });
}
