// k3vaceo API — router tay, không dùng framework (nguyên tắc hạ tầng, xem SRS mục 8).
// Đợt 1: nhận diện qua link mời, hồ sơ tự sửa, cơ cấu nhóm có lịch sử, Kho, Hôm nay.
// Đợt 2: bài 8 phần, gợi ý phân công, tiến độ, tâm đắc, đăng nhập lại bằng email.
// Đợt 3 (quỹ, passkey) thêm route mới vào routes/ mà không đổi cách định tuyến này.

import { json, error } from './lib/http.js';
import { getCurrentMember } from './auth.js';
import { clientIp, allow } from './lib/ratelimit.js';
import { getInvite, postInviteClaim } from './routes/invite.js';
import { getHome } from './routes/home.js';
import { listMembers, getMember, patchMember, putMemberProfile } from './routes/members.js';
import { getOfficers, putOfficers } from './routes/officers.js';
import { listLinks, postLink, deleteLink } from './routes/links.js';
import { postWizardInvites, postMemberInvite } from './routes/wizard.js';
import { postLogout } from './routes/session.js';
import { getPlan, patchSection, patchTopic } from './routes/plan.js';
import { postInsight, deleteInsight } from './routes/insights.js';
import { postEmailRequest, postEmailConsume } from './routes/email-login.js';
import { postOnboardCheck, postOnboardStart, postOtpRequest, postOtpVerify,
         postVerifyMyEmail, postVerifyMyEmailConfirm } from './routes/onboard.js';
import { listFunds, postFund, patchFund, getFundQr, postDeclare, deleteDeclare, getLedger, postVerify } from './routes/funds.js';
import {
  postRegisterOptions, postRegisterVerify, postLoginOptions, postLoginVerify,
  listPasskeys, deletePasskey,
} from './routes/passkey.js';
import {
  searchRoster, claimGroup, bulkMembers, createPlan,
  postJoinRequest, listJoinRequests, decideJoinRequest,
} from './routes/start-wizard.js';
import { exportPlanDocx } from './routes/export.js';

const INVITE_TRIES_PER_HOUR = 20;   // mục 8 SRS

export default {
  async fetch(request, env, ctx) {
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

      // ── Không cần đăng nhập ──────────────────────────────────────────────
      // Hai route token dưới đây là lối vào duy nhất khi chưa có phiên, nên
      // phải chặn dò token theo IP (mục 8 SRS: 20 lần thử mỗi IP mỗi giờ).
      if ((m = pathname.match(/^\/api\/invite\/([^/]+)$/)) && method === 'GET') {
        if (!(await allow(env, 'invite_try', clientIp(request), INVITE_TRIES_PER_HOUR))) {
          return error('rate_limited', 429, { retry_after_minutes: 60 });
        }
        return getInvite(env, m[1]);
      }
      if ((m = pathname.match(/^\/api\/invite\/([^/]+)\/claim$/)) && method === 'POST') {
        if (!(await allow(env, 'invite_try', clientIp(request), INVITE_TRIES_PER_HOUR))) {
          return error('rate_limited', 429, { retry_after_minutes: 60 });
        }
        return postInviteClaim(request, env, m[1]);
      }
      // Đợt 5 — tự nhận diện rồi OTP qua email. Ba chặng: đối chiếu số điện
      // thoại (chỉ để báo sớm), khai email và nhận mã, rồi đổi mã lấy phiên.
      if (pathname === '/api/onboard/check' && method === 'POST') {
        return postOnboardCheck(request, env);
      }
      if (pathname === '/api/onboard/start' && method === 'POST') {
        return postOnboardStart(request, env, ctx);
      }
      if (pathname === '/api/auth/otp' && method === 'POST') {
        return postOtpRequest(request, env, ctx);
      }
      if (pathname === '/api/auth/otp/verify' && method === 'POST') {
        return postOtpVerify(request, env);
      }

      // Magic link của Đợt 2 — giữ làm đường phụ cho ai đã quen, không quảng
      // cáo trên giao diện nữa.
      if (pathname === '/api/auth/email' && method === 'POST') {
        return postEmailRequest(request, env, ctx);
      }
      if ((m = pathname.match(/^\/api\/auth\/email\/([^/]+)$/)) && method === 'POST') {
        return postEmailConsume(request, env, m[1]);
      }
      if (pathname === '/api/auth/logout' && method === 'POST') {
        return postLogout(request, env);
      }
      if (pathname === '/api/passkey/login/options' && method === 'POST') {
        return postLoginOptions(request, env);
      }
      if (pathname === '/api/passkey/login/verify' && method === 'POST') {
        return postLoginVerify(request, env);
      }
      // Wizard: ba route đầu chạy khi CHƯA có phiên — đó là cả điểm của nó,
      // một trưởng nhóm bất kỳ tự dựng được mà không cần ai mời trước.
      if (pathname === '/api/wizard/roster/search' && method === 'GET') {
        return searchRoster(request, env);
      }
      if (pathname === '/api/wizard/claim-group' && method === 'POST') {
        return claimGroup(request, env);
      }
      if (pathname === '/api/wizard/join-request' && method === 'POST') {
        return postJoinRequest(request, env);
      }

      // ── Cần phiên đăng nhập hợp lệ ───────────────────────────────────────
      const me = await getCurrentMember(request, env);
      if (!me) return error('not_authenticated', 401);
      const ip = clientIp(request);

      if (pathname === '/api/home' && method === 'GET') return getHome(env, me);

      // Xác minh email khi đã có phiên (người vào bằng link mời). Dùng phiên
      // chứ không nhận email trong thân — không có chỗ nào để dò.
      if (pathname === '/api/me/verify-email' && method === 'POST') {
        return postVerifyMyEmail(request, env, ctx, me);
      }
      if (pathname === '/api/me/verify-email/confirm' && method === 'POST') {
        return postVerifyMyEmailConfirm(request, env, me);
      }

      if (pathname === '/api/members' && method === 'GET') return listMembers(env, me);
      if ((m = pathname.match(/^\/api\/members\/(\d+)$/)) && method === 'GET') {
        return getMember(env, me, Number(m[1]));
      }
      if ((m = pathname.match(/^\/api\/members\/(\d+)$/)) && method === 'PATCH') {
        return patchMember(request, env, me, Number(m[1]));
      }
      if ((m = pathname.match(/^\/api\/members\/(\d+)\/profile$/)) && method === 'PUT') {
        return putMemberProfile(request, env, me, Number(m[1]));
      }
      if ((m = pathname.match(/^\/api\/members\/(\d+)\/invite$/)) && method === 'POST') {
        return postMemberInvite(request, env, me, Number(m[1]));
      }

      if (pathname === '/api/officers' && method === 'GET') return getOfficers(env, me);
      if (pathname === '/api/officers' && method === 'PUT') return putOfficers(request, env, me, ip);

      if (pathname === '/api/plan' && method === 'GET') return getPlan(env, me);
      if (pathname === '/api/plan/topic' && method === 'PATCH') return patchTopic(request, env, me, ip);
      if ((m = pathname.match(/^\/api\/plan\/sections\/(\d+)$/)) && method === 'PATCH') {
        return patchSection(request, env, me, Number(m[1]), ip);
      }

      if (pathname === '/api/insights' && method === 'POST') return postInsight(request, env, me);
      if ((m = pathname.match(/^\/api\/insights\/(\d+)$/)) && method === 'DELETE') {
        return deleteInsight(env, me, Number(m[1]));
      }

      if (pathname === '/api/links' && method === 'GET') return listLinks(env, me, url.searchParams.get('tag'));
      if (pathname === '/api/links' && method === 'POST') return postLink(request, env, me);
      if ((m = pathname.match(/^\/api\/links\/(\d+)$/)) && method === 'DELETE') {
        return deleteLink(env, me, Number(m[1]));
      }

      if (pathname === '/api/wizard/invites' && method === 'POST') return postWizardInvites(request, env, me);
      if (pathname === '/api/wizard/members' && method === 'POST') return bulkMembers(request, env, me, ip);
      if (pathname === '/api/wizard/plan' && method === 'POST') return createPlan(request, env, me, ip);
      if (pathname === '/api/join-requests' && method === 'GET') return listJoinRequests(env, me);
      if ((m = pathname.match(/^\/api\/join-requests\/(\d+)$/)) && method === 'POST') {
        return decideJoinRequest(request, env, me, Number(m[1]), ip);
      }

      if (pathname === '/api/plan/export.docx' && method === 'GET') return exportPlanDocx(env, me);

      if (pathname === '/api/funds' && method === 'GET') return listFunds(env, me);
      if (pathname === '/api/funds' && method === 'POST') return postFund(request, env, me, ip);
      if ((m = pathname.match(/^\/api\/funds\/(\d+)$/)) && method === 'PATCH') {
        return patchFund(request, env, me, Number(m[1]), ip);
      }
      if ((m = pathname.match(/^\/api\/funds\/(\d+)\/qr$/)) && method === 'GET') {
        return getFundQr(env, me, Number(m[1]));
      }
      if ((m = pathname.match(/^\/api\/funds\/(\d+)\/declare$/)) && method === 'POST') {
        return postDeclare(request, env, me, Number(m[1]), ip);
      }
      if ((m = pathname.match(/^\/api\/funds\/(\d+)\/declare$/)) && method === 'DELETE') {
        return deleteDeclare(env, me, Number(m[1]), ip);
      }
      if ((m = pathname.match(/^\/api\/funds\/(\d+)\/ledger$/)) && method === 'GET') {
        return getLedger(env, me, Number(m[1]));
      }
      if ((m = pathname.match(/^\/api\/funds\/(\d+)\/verify$/)) && method === 'POST') {
        return postVerify(request, env, me, Number(m[1]), ip);
      }

      if (pathname === '/api/passkey/register/options' && method === 'POST') {
        return postRegisterOptions(request, env, me);
      }
      if (pathname === '/api/passkey/register/verify' && method === 'POST') {
        return postRegisterVerify(request, env, me, ip);
      }
      if (pathname === '/api/passkey' && method === 'GET') return listPasskeys(env, me, null);
      if ((m = pathname.match(/^\/api\/passkey\/member\/(\d+)$/)) && method === 'GET') {
        return listPasskeys(env, me, Number(m[1]));
      }
      if ((m = pathname.match(/^\/api\/passkey\/(\d+)$/)) && method === 'DELETE') {
        return deletePasskey(env, me, Number(m[1]), ip);
      }

      return error('not_found', 404, { path: pathname });
    } catch (err) {
      // Chi tiết lỗi chỉ ghi ở máy chủ. Trả nguyên String(err) ra ngoài sẽ lộ
      // tên bảng, tên cột và cả câu SQL qua các thông báo của D1.
      console.error(`${method} ${pathname}:`, err?.stack || String(err));
      return error('internal_error', 500);
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
