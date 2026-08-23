import { json, error, readJson } from '../lib/http.js';
import { canManageGroup, canUpdateSection, logAudit, logActivity } from '../permissions.js';
import { cleanText, clampPct } from '../lib/validate.js';
import { suggestOwners } from '../lib/suggest.js';

async function loadPlan(env, groupId) {
  return env.DB.prepare(
    'SELECT id, topic_product, topic_customers FROM plans WHERE group_id = ?'
  ).bind(groupId).first();
}

export async function getPlan(env, me) {
  const plan = await loadPlan(env, me.group_id);
  if (!plan) return error('plan_not_found', 404);

  const [sectionsRes, membersRes, insightsRes] = await Promise.all([
    env.DB.prepare(
      `SELECT ps.id, ps.ord, ps.title, ps.requirement, ps.pct, ps.note, ps.owner_member_id,
              m.full_name AS owner_name
       FROM plan_sections ps LEFT JOIN members m ON m.id = ps.owner_member_id
       WHERE ps.plan_id = ? ORDER BY ps.ord`
    ).bind(plan.id).all(),
    env.DB.prepare(
      'SELECT id, full_name, title FROM members WHERE group_id = ? AND is_active = 1 ORDER BY id'
    ).bind(me.group_id).all(),
    env.DB.prepare(
      `SELECT i.id, i.body, i.speaker, i.heard_on, i.created_by, i.section_id,
              ps.ord AS section_ord, m.full_name AS created_by_name
       FROM insights i
       LEFT JOIN plan_sections ps ON ps.id = i.section_id
       LEFT JOIN members m ON m.id = i.created_by
       WHERE i.group_id = ? ORDER BY i.created_at DESC`
    ).bind(me.group_id).all(),
  ]);

  const sections = sectionsRes.results ?? [];
  const members = membersRes.results ?? [];
  const overall = sections.length ? Math.round(sections.reduce((s, x) => s + x.pct, 0) / sections.length) : 0;

  return json({
    plan: { topic_product: plan.topic_product, topic_customers: plan.topic_customers },
    sections,
    members,
    suggestions: suggestOwners(members, sections),
    insights: insightsRes.results ?? [],
    overall_pct: overall,
    can_assign: await canManageGroup(env, me, me.group_id),
  });
}

export async function patchSection(request, env, me, sectionId, ip) {
  const section = await env.DB.prepare(
    `SELECT ps.* FROM plan_sections ps JOIN plans p ON p.id = ps.plan_id
     WHERE ps.id = ? AND p.group_id = ?`
  ).bind(sectionId, me.group_id).first();
  if (!section) return error('not_found', 404);

  const body = await readJson(request);
  const wantsOwnerChange = 'owner_member_id' in body;

  // Hai quyền khác nhau trong ma trận mục 2.2: "Gán người phụ trách phần bài"
  // chỉ trưởng/phó, còn "Cập nhật tiến độ phần mình giữ" thì thành viên giữ
  // phần đó cũng làm được.
  if (wantsOwnerChange) {
    if (!(await canManageGroup(env, me, me.group_id))) return error('forbidden_assign', 403);
  } else if (!(await canUpdateSection(env, me, section))) {
    return error('forbidden', 403);
  }

  let ownerId = section.owner_member_id;
  if (wantsOwnerChange) {
    const raw = body.owner_member_id;
    if (raw === null || raw === '') {
      ownerId = null;
    } else {
      ownerId = Number(raw);
      if (!Number.isInteger(ownerId) || ownerId <= 0) return error('owner_invalid', 422);
      const ok = await env.DB.prepare(
        'SELECT id FROM members WHERE id = ? AND group_id = ? AND is_active = 1'
      ).bind(ownerId, me.group_id).first();
      if (!ok) return error('member_not_in_group', 422);
    }
  }

  let pct = section.pct;
  if ('pct' in body) {
    pct = clampPct(body.pct);
    if (pct === null) return error('pct_invalid', 422);
  }
  const note = 'note' in body ? cleanText(body.note, 500) : section.note;

  await env.DB.prepare(
    `UPDATE plan_sections SET owner_member_id = ?, pct = ?, note = ?,
       updated_at = datetime('now'), updated_by = ? WHERE id = ?`
  ).bind(ownerId, pct, note, me.id, section.id).run();

  if (wantsOwnerChange && ownerId !== section.owner_member_id) {
    const who = ownerId
      ? await env.DB.prepare('SELECT full_name FROM members WHERE id = ?').bind(ownerId).first()
      : null;
    await logAudit(env, {
      actorId: me.id, action: 'plan.assign', targetType: 'plan_section', targetId: section.id,
      before: { owner_member_id: section.owner_member_id }, after: { owner_member_id: ownerId }, ip,
    });
    await logActivity(env, {
      cohortId: me.cohort_id, groupId: me.group_id, actorId: me.id,
      verb: 'plan.assign', objectType: 'plan_section', objectId: section.id,
      summary: who ? `giao phần ${section.ord} cho ${who.full_name}` : `bỏ trống người giữ phần ${section.ord}`,
    });
  }
  if (pct !== section.pct) {
    await logActivity(env, {
      cohortId: me.cohort_id, groupId: me.group_id, actorId: me.id,
      verb: 'plan.progress', objectType: 'plan_section', objectId: section.id,
      summary: `cập nhật phần ${section.ord} — ${section.title.toLowerCase()} → ${pct}%`,
    });
  }

  return json({ ok: true });
}

// Chốt đề tài: để trưởng/phó ghi, vì đây là nền của cả bảy phần sau và ghi đè
// nhầm thì kéo theo toàn bài. Ma trận mục 2.2 không có dòng riêng cho đề tài,
// nên xếp cùng nhóm với các quyết định cấu trúc khác (cơ cấu, phân công).
export async function patchTopic(request, env, me, ip) {
  if (!(await canManageGroup(env, me, me.group_id))) return error('forbidden', 403);
  const plan = await loadPlan(env, me.group_id);
  if (!plan) return error('plan_not_found', 404);

  const body = await readJson(request);
  const product = 'topic_product' in body ? cleanText(body.topic_product, 300) : plan.topic_product;
  const customers = 'topic_customers' in body ? cleanText(body.topic_customers, 300) : plan.topic_customers;

  await env.DB.prepare(
    `UPDATE plans SET topic_product = ?, topic_customers = ?, updated_at = datetime('now') WHERE id = ?`
  ).bind(product, customers, plan.id).run();

  await logAudit(env, {
    actorId: me.id, action: 'plan.topic', targetType: 'plan', targetId: plan.id,
    before: { topic_product: plan.topic_product, topic_customers: plan.topic_customers },
    after: { topic_product: product, topic_customers: customers }, ip,
  });
  await logActivity(env, {
    cohortId: me.cohort_id, groupId: me.group_id, actorId: me.id,
    verb: 'plan.topic', objectType: 'plan', objectId: plan.id, summary: 'chốt đề tài của nhóm',
  });

  return json({ ok: true });
}
