import { json } from '../lib/http.js';

const PROFILE_FIELDS = ['sells_what', 'sells_to', 'needs', 'offers'];

async function profileCompleteness(env, memberId) {
  const p = await env.DB.prepare('SELECT sells_what, sells_to, needs, offers FROM member_profile WHERE member_id = ?')
    .bind(memberId).first();
  if (!p) return 0;
  return PROFILE_FIELDS.filter(f => p[f] && String(p[f]).trim() !== '').length;
}

// Thứ tự xét đúng mục 7.1 SRS. "Chưa nhận tên" không xét ở đây — người gọi
// endpoint này đã đăng nhập (đã nhận tên) rồi, trường hợp đó xử lý ở màn hình
// nhận link mời (routes/invite.js).
async function computeAction(env, me) {
  const filled = await profileCompleteness(env, me.id);
  if (filled < 4) {
    return {
      h: 'Bốn dòng còn thiếu trong hồ sơ',
      p: 'Bạn cần gì ở nhóm và giúp được gì cho nhóm — hai dòng đó là chỗ cả nhóm dùng đến khi chia việc.',
      c: 'Điền nốt', target: 'profile',
    };
  }

  const plan = await env.DB.prepare('SELECT id, topic_product, topic_customers FROM plans WHERE group_id = ?')
    .bind(me.group_id).first();
  if (plan) {
    // "Chốt đề tài" là đã ghi được sản phẩm và khách hàng mục tiêu vào
    // plans.topic_* — không phải là đã có ai nhận phần 0. Hai việc khác nhau:
    // mục 7.1 SRS xét đề tài ở bước 3 rồi mới xét nhận phần ở bước 4.
    if (!plan.topic_product || !plan.topic_customers) {
      return {
        h: 'Nhóm chưa chốt đề tài',
        p: 'Chưa có sản phẩm và khách hàng mục tiêu thì bảy phần sau đều treo. Đây là việc chặn mọi việc khác.',
        c: 'Mở phần 0', target: 'plan', section_ord: 0,
      };
    }

    const mine = await env.DB.prepare('SELECT ord, pct FROM plan_sections WHERE plan_id = ? AND owner_member_id = ? ORDER BY ord')
      .bind(plan.id, me.id).all();
    const mineRows = mine.results ?? [];
    if (mineRows.length === 0) {
      const free = await env.DB.prepare('SELECT COUNT(*) AS n FROM plan_sections WHERE plan_id = ? AND owner_member_id IS NULL')
        .bind(plan.id).first();
      return {
        h: `Còn ${free?.n ?? 0} phần chưa ai nhận`,
        p: 'Ba-rem chấm điểm có mục làm việc nhóm. Nhận một phần là có tên trong nhật ký đóng góp.',
        c: 'Xem các phần', target: 'plan',
      };
    }
    const behind = mineRows.find(s => s.pct < 50);
    if (behind) {
      return {
        h: `Phần ${behind.ord} còn ${100 - behind.pct}%`,
        p: 'Phần bạn giữ đang dở — cập nhật tiến độ để cả nhóm biết chỗ nào cần đỡ.',
        c: 'Cập nhật', target: 'plan', section_ord: behind.ord,
      };
    }
  }

  const openFund = await env.DB.prepare(
    `SELECT f.id FROM fund_rounds f
     WHERE f.status = 'open' AND (f.scope = 'class' OR f.group_id = ?)
       AND NOT EXISTS (SELECT 1 FROM fund_declarations d WHERE d.round_id = f.id AND d.member_id = ?)
     LIMIT 1`
  ).bind(me.group_id, me.id).first();
  if (openFund) {
    return { h: 'Có quỹ đang mở', p: 'Mã chuyển khoản riêng của bạn đã sẵn, nội dung điền tự động.', c: 'Mở mã QR', target: 'fund' };
  }

  return { h: 'Không có việc nào đang nợ', p: 'Nghe được câu hay trong buổi học thì ghi lại, nó chảy thẳng vào bài.', c: 'Ghi tâm đắc', target: 'insight', done: true };
}

export async function getHome(env, me) {
  const [action, officersRes, feedRes, sectionsRes, group, cohort] = await Promise.all([
    computeAction(env, me),
    env.DB.prepare(
      `SELECT o.role, o.note, o.effective_from, m.id AS member_id, m.full_name, m.title, m.company
       FROM officers o LEFT JOIN members m ON m.id = o.member_id
       WHERE o.group_id = ? AND o.role IN ('truong_nhom', 'pho_nhom') AND o.superseded_at IS NULL`
    ).bind(me.group_id).all(),
    env.DB.prepare(
      `SELECT a.summary, a.verb, a.created_at, m.id AS actor_id, m.full_name AS actor_name
       FROM activity a JOIN members m ON m.id = a.actor_member_id
       WHERE a.group_id = ? ORDER BY a.created_at DESC LIMIT 7`
    ).bind(me.group_id).all(),
    env.DB.prepare(
      `SELECT ps.ord, ps.title, ps.pct, ps.owner_member_id FROM plan_sections ps
       JOIN plans p ON p.id = ps.plan_id WHERE p.group_id = ? ORDER BY ps.ord`
    ).bind(me.group_id).all(),
    env.DB.prepare('SELECT no, label FROM groups WHERE id = ?').bind(me.group_id).first(),
    env.DB.prepare('SELECT code, defense_on FROM cohorts WHERE id = ?').bind(me.cohort_id).first(),
  ]);

  const sections = sectionsRes.results ?? [];
  const overall = sections.length ? Math.round(sections.reduce((s, x) => s + x.pct, 0) / sections.length) : 0;
  const mineCount = sections.filter(s => s.owner_member_id === me.id).length;

  return json({
    // email_verified quyết định có hiện nút đăng ký passkey hay không
    // (Đợt 5). Máy chủ vẫn chặn riêng ở postRegisterOptions.
    me: { id: me.id, full_name: me.full_name, group_id: me.group_id,
          email_verified: !!me.email_verified_at,
          // Che bớt để người đứng cạnh không đọc được, nhưng vẫn đủ để chính
          // chủ nhận ra hộp thư nào sẽ nhận mã.
          email_che: me.email ? me.email.replace(/^(..)([^@]*)/, (_, a, b) => a + '•'.repeat(Math.max(3, b.length))) : null },
    group,
    cohort,
    action,
    officers: officersRes.results ?? [],
    feed: feedRes.results ?? [],
    progress: { sections: sections.map(s => ({ ord: s.ord, title: s.title, pct: s.pct })), overall_pct: overall, mine_count: mineCount },
  });
}
