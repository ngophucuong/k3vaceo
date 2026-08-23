// Xuất bản thảo Word theo 8 phần — mục 10 SRS, Đợt 4.
// Tiêu chí nghiệm thu: "bản thảo xuất ra mở được bằng Word và đúng thứ tự 8 phần".

import { error } from '../lib/http.js';
import { buildDocx, para, heading, table, pageBreak } from '../lib/docx.js';
import { bare } from '../lib/suggest.js';

export async function exportPlanDocx(env, me) {
  const plan = await env.DB.prepare(
    'SELECT id, topic_product, topic_customers FROM plans WHERE group_id = ?'
  ).bind(me.group_id).first();
  if (!plan) return error('plan_not_found', 404);

  const [group, sectionsRes, insightsRes, linksRes] = await Promise.all([
    env.DB.prepare('SELECT no, label FROM groups WHERE id = ?').bind(me.group_id).first(),
    env.DB.prepare(
      `SELECT ps.ord, ps.title, ps.requirement, ps.pct, ps.note,
              ps.present_minutes, o.full_name AS owner_name, pm.full_name AS present_name
       FROM plan_sections ps
       LEFT JOIN members o ON o.id = ps.owner_member_id
       LEFT JOIN members pm ON pm.id = ps.present_member_id
       WHERE ps.plan_id = ? ORDER BY ps.ord`
    ).bind(plan.id).all(),
    env.DB.prepare(
      `SELECT i.body, i.speaker, i.heard_on, ps.ord AS section_ord
       FROM insights i LEFT JOIN plan_sections ps ON ps.id = i.section_id
       WHERE i.group_id = ? ORDER BY ps.ord, i.created_at`
    ).bind(me.group_id).all(),
    env.DB.prepare(
      `SELECT title, url, kind FROM links
       WHERE removed_at IS NULL AND url IS NOT NULL AND (scope = 'class' OR group_id = ?)
       ORDER BY created_at`
    ).bind(me.group_id).all(),
  ]);

  const sections = sectionsRes.results ?? [];
  const insights = insightsRes.results ?? [];
  const links = linksRes.results ?? [];
  const blocks = [];

  /* ── Trang bìa ── */
  blocks.push(para('KẾ HOẠCH KINH DOANH', { bold: true, size: 22, align: 'center', spaceAfter: 8 }));
  blocks.push(para(group?.label ?? '', { bold: true, size: 15, align: 'center' }));
  blocks.push(para('Khoá K03 · Giám đốc điều hành doanh nghiệp · VCCI × Đại học Andrews',
    { size: 11, align: 'center', spaceAfter: 20 }));

  if (plan.topic_product || plan.topic_customers) {
    blocks.push(para('Đề tài', { bold: true, size: 13, spaceBefore: 10, spaceAfter: 4 }));
    if (plan.topic_product) blocks.push(para(`Sản phẩm / dịch vụ: ${plan.topic_product}`));
    if (plan.topic_customers) blocks.push(para(`Khách hàng mục tiêu: ${plan.topic_customers}`));
  } else {
    blocks.push(para('Nhóm chưa chốt đề tài.', { italic: true, color: '999999' }));
  }

  /* ── Mục lục phẳng, kèm người phụ trách và tiến độ ── */
  blocks.push(para('Phân công và tiến độ', { bold: true, size: 13, spaceBefore: 16, spaceAfter: 6 }));
  blocks.push(table(
    [['Phần', 'Tên phần', 'Phụ trách', 'Tiến độ'],
     ...sections.map(s => [
       s.ord === 0 ? '—' : String(s.ord),
       s.title,
       s.owner_name ?? 'chưa ai nhận',
       `${s.pct}%`,
     ])],
    [700, 4600, 2600, 900]
  ));

  /* ── Tám phần, đúng thứ tự ord ── */
  for (const s of sections) {
    blocks.push(pageBreak());
    blocks.push(heading(`${s.ord === 0 ? '' : 'Phần ' + s.ord + '. '}${s.title}`, 1));
    blocks.push(para('Yêu cầu của giảng viên', { bold: true, size: 10, spaceBefore: 4, spaceAfter: 2 }));
    blocks.push(para(s.requirement ?? '', { size: 10, italic: true }));
    blocks.push(para(
      `Phụ trách: ${s.owner_name ?? 'chưa ai nhận'} · Tiến độ: ${s.pct}%`,
      { size: 10, spaceBefore: 6 }
    ));
    if (s.note) blocks.push(para(`Còn thiếu: ${s.note}`, { size: 10, color: 'A8500E' }));

    // Chỗ trống để người phụ trách viết vào — đây là BẢN THẢO, không phải bài
    // hoàn chỉnh; nội dung do nhóm tự viết trong Word.
    blocks.push(para('Nội dung', { bold: true, size: 11, spaceBefore: 12, spaceAfter: 4 }));
    blocks.push(para('[Viết nội dung phần này vào đây]', { color: '999999', italic: true }));

    const mine = insights.filter(i => i.section_ord === s.ord);
    if (mine.length) {
      blocks.push(para('Tâm đắc đã ghi cho phần này', { bold: true, size: 11, spaceBefore: 14, spaceAfter: 4 }));
      for (const i of mine) {
        blocks.push(para(`“${i.body}”`, { size: 10 }));
        blocks.push(para(`— ${i.speaker}${i.heard_on ? ', ' + i.heard_on : ''}`, { size: 9, color: '5C6266', spaceAfter: 6 }));
      }
    }
  }

  /* ── Phân công thuyết trình ── */
  const withSlot = sections.filter(s => s.present_name || s.present_minutes);
  if (withSlot.length) {
    blocks.push(pageBreak());
    blocks.push(heading('Phân công thuyết trình', 1));
    const total = sections.reduce((n, s) => n + (s.present_minutes || 0), 0);
    const speakers = new Set(sections.map(s => s.present_name).filter(Boolean));
    blocks.push(para(`Tổng ${total} phút · ${speakers.size} người nói · giới hạn 20 phút.`,
      { size: 10, spaceAfter: 6, color: total > 20 ? 'A8500E' : '146450' }));
    blocks.push(table(
      [['Phần', 'Tên phần', 'Người nói', 'Phút'],
       ...sections.map(s => [
         s.ord === 0 ? '—' : String(s.ord), s.title,
         s.present_name ?? 'chưa phân công',
         s.present_minutes ? String(s.present_minutes) : '—',
       ])],
      [700, 4600, 2600, 900]
    ));
  }

  /* ── Nguồn đã gắn ── */
  if (links.length) {
    blocks.push(pageBreak());
    blocks.push(heading('Nguồn tham khảo đã gắn trong Kho', 1));
    blocks.push(para('Ba-rem chấm “số liệu có nguồn được công bố” — mỗi con số trong bài cần một đường dẫn.',
      { size: 10, italic: true, spaceAfter: 8 }));
    for (const l of links) {
      blocks.push(para(`• ${l.title} (${l.kind})`, { size: 10 }));
      blocks.push(para(l.url, { size: 9, color: '5C6266', spaceAfter: 4 }));
    }
  }

  blocks.push(para(
    'Bản thảo do công cụ nhóm K03 xuất ra. Nội dung từng phần do nhóm tự viết — công cụ chỉ dựng khung, giữ đúng thứ tự tám phần và gom sẵn tâm đắc cùng nguồn đã ghi.',
    { size: 9, color: '93999D', spaceBefore: 24 }
  ));

  const bytes = buildDocx({ title: `Kế hoạch kinh doanh — ${group?.label ?? ''}`, blocks });
  const fileName = `ke-hoach-kinh-doanh-${bare(group?.label ?? 'nhom').replace(/\s+/g, '-')}.docx`;

  return new Response(bytes, {
    headers: {
      'content-type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'content-disposition': `attachment; filename="${fileName}"`,
      'cache-control': 'no-store',
    },
  });
}
