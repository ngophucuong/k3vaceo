// k3vaceo API — router tay, không dùng framework (nguyên tắc hạ tầng, xem SRS mục 8).
// Phần "Chuẩn bị" mới có /api/health, để xác nhận D1 đã gắn đúng và đã nạp
// dữ liệu thật. Các route thật (home, members, officers, plan, links, funds,
// wizard) sẽ thêm dần vào routes/ theo từng đợt của kế hoạch triển khai.

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/health' && request.method === 'GET') {
      return handleHealth(env);
    }

    return json({ error: 'not_found', path: url.pathname }, 404);
  },
};

async function handleHealth(env) {
  try {
    const [roster, groups, group6Members, group6Lead] = await Promise.all([
      env.DB.prepare('SELECT COUNT(*) AS n FROM roster').first(),
      env.DB.prepare('SELECT COUNT(*) AS n FROM groups').first(),
      env.DB.prepare(
        `SELECT COUNT(*) AS n FROM members m JOIN groups g ON g.id = m.group_id WHERE g.no = 6`
      ).first(),
      env.DB.prepare(
        `SELECT m.full_name AS name FROM officers o
         JOIN groups g ON g.id = o.group_id
         JOIN members m ON m.id = o.member_id
         WHERE g.no = 6 AND o.role = 'truong_nhom' AND o.superseded_at IS NULL`
      ).first(),
    ]);
    return json({
      ok: true,
      roster_total: roster?.n ?? 0,
      groups_total: groups?.n ?? 0,
      group6_members: group6Members?.n ?? 0,
      group6_truong_nhom: group6Lead?.name ?? null,
    });
  } catch (err) {
    return json({ ok: false, error: String(err) }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}
