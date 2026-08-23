// k3vaceo API — router tay, không dùng framework (nguyên tắc hạ tầng, xem SRS mục 8).
// Đợt 1: nhận diện qua link mời, hồ sơ tự sửa, cơ cấu nhóm có lịch sử, Kho,
// Hôm nay. Đợt 2 (bài/tiến độ/tâm đắc/email) và Đợt 3 (quỹ/passkey) thêm route
// mới vào routes/ mà không đổi cách định tuyến này.

import { json, error } from './lib/http.js';
import { getCurrentMember } from './auth.js';
import { getInvite, postInviteClaim } from './routes/invite.js';
import { getHome } from './routes/home.js';
import { listMembers, patchMember, putMemberProfile } from './routes/members.js';
import { getOfficers, putOfficers } from './routes/officers.js';
import { listLinks, postLink, deleteLink } from './routes/links.js';
import { postWizardInvites } from './routes/wizard.js';
import { postLogout } from './routes/session.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    // Chỉ dùng khi kiểm thử cục bộ với [assets] tạm thời trong wrangler.toml —
    // production thật là Pages phục vụ tệp tĩnh (đọc _redirects thật), Worker
    // này không đụng tới. [assets] của Worker không tự đọc _redirects nên phải
    // tự làm SPA fallback ở đây cho khớp hành vi Pages khi kiểm thử.
    if (!pathname.startsWith('/api/') && env.ASSETS) {
      const res = await env.ASSETS.fetch(request);
      if (res.status !== 404) return res;
      return env.ASSETS.fetch(new URL('/index.html', url));
    }

    try {
      if (pathname === '/api/health' && method === 'GET') return handleHealth(env);

      let m;
      if ((m = pathname.match(/^\/api\/invite\/([^/]+)$/)) && method === 'GET') {
        return getInvite(env, m[1]);
      }
      if ((m = pathname.match(/^\/api\/invite\/([^/]+)\/claim$/)) && method === 'POST') {
        return postInviteClaim(request, env, m[1]);
      }
      if (pathname === '/api/auth/logout' && method === 'POST') {
        return postLogout(request, env);
      }

      // Mọi route dưới đây cần phiên đăng nhập hợp lệ.
      const me = await getCurrentMember(request, env);
      if (!me) return error('not_authenticated', 401);

      if (pathname === '/api/home' && method === 'GET') return getHome(env, me);

      if (pathname === '/api/members' && method === 'GET') return listMembers(env, me);
      if ((m = pathname.match(/^\/api\/members\/(\d+)$/)) && method === 'PATCH') {
        return patchMember(request, env, me, Number(m[1]));
      }
      if ((m = pathname.match(/^\/api\/members\/(\d+)\/profile$/)) && method === 'PUT') {
        return putMemberProfile(request, env, me, Number(m[1]));
      }

      if (pathname === '/api/officers' && method === 'GET') return getOfficers(env, me);
      if (pathname === '/api/officers' && method === 'PUT') return putOfficers(request, env, me);

      if (pathname === '/api/links' && method === 'GET') return listLinks(env, me, url.searchParams.get('tag'));
      if (pathname === '/api/links' && method === 'POST') return postLink(request, env, me);
      if ((m = pathname.match(/^\/api\/links\/(\d+)$/)) && method === 'DELETE') {
        return deleteLink(env, me, Number(m[1]));
      }

      if (pathname === '/api/wizard/invites' && method === 'POST') return postWizardInvites(request, env, me);

      return error('not_found', 404, { path: pathname });
    } catch (err) {
      return error('internal_error', 500, { message: String(err) });
    }
  },
};

async function handleHealth(env) {
  const [roster, groups, group6Members, group6Lead] = await Promise.all([
    env.DB.prepare('SELECT COUNT(*) AS n FROM roster').first(),
    env.DB.prepare('SELECT COUNT(*) AS n FROM groups').first(),
    env.DB.prepare(`SELECT COUNT(*) AS n FROM members m JOIN groups g ON g.id = m.group_id WHERE g.no = 6`).first(),
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
}
