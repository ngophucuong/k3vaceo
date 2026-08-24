import { json, error, readJson } from '../lib/http.js';
import { pushCauHinh, guiMotDay } from '../lib/webpush.js';

// Đăng ký nhận thông báo đẩy, và gửi đi khi có thông báo mới.
//
// Đăng ký là chuyện của TỪNG THIẾT BỊ chứ không phải từng người: một người có
// điện thoại và máy tính thì hai dòng, gỡ máy này không ảnh hưởng máy kia.

export function getPushKhoa(env) {
  const cf = pushCauHinh(env);
  return json({ bat: !!cf, khoa_cong_khai: cf?.pub ?? null });
}

export async function postPushDangKy(request, env, me) {
  const cf = pushCauHinh(env);
  if (!cf) return error('push_chua_cau_hinh', 503);

  const body = await readJson(request);
  const endpoint = typeof body.endpoint === 'string' ? body.endpoint.trim() : '';
  const p256dh = typeof body.p256dh === 'string' ? body.p256dh.trim() : '';
  const auth = typeof body.auth === 'string' ? body.auth.trim() : '';
  if (!/^https:\/\//i.test(endpoint) || endpoint.length > 2000) return error('endpoint_invalid', 422);
  if (!p256dh || !auth) return error('khoa_thieu', 422);

  // endpoint là khoá thật: cùng một máy đăng ký lại (đổi tài khoản, cài lại)
  // thì phải nhảy sang chủ mới chứ không tạo dòng thứ hai — không thì người cũ
  // vẫn nhận thông báo của nhóm mà họ không còn ở.
  await env.DB.prepare(
    `INSERT INTO push_subscriptions (member_id, endpoint, p256dh, auth, user_agent, created_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(endpoint) DO UPDATE SET
       member_id = excluded.member_id, p256dh = excluded.p256dh, auth = excluded.auth,
       user_agent = excluded.user_agent, disabled_at = NULL, last_error = NULL`
  ).bind(me.id, endpoint, p256dh, auth,
         (request.headers.get('user-agent') || '').slice(0, 200)).run();

  return json({ ok: true });
}

export async function postPushHuy(request, env, me) {
  const body = await readJson(request);
  const endpoint = typeof body.endpoint === 'string' ? body.endpoint.trim() : '';
  if (!endpoint) return error('endpoint_invalid', 422);
  // Chỉ gỡ đăng ký CỦA MÌNH: biết endpoint của người khác cũng không tắt được
  // thông báo của họ.
  await env.DB.prepare('DELETE FROM push_subscriptions WHERE endpoint = ? AND member_id = ?')
    .bind(endpoint, me.id).run();
  return json({ ok: true });
}

export async function getPushTrangThai(env, me) {
  const row = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM push_subscriptions
      WHERE member_id = ? AND disabled_at IS NULL`
  ).bind(me.id).first();
  const cf = pushCauHinh(env);
  return json({ bat: !!cf, so_thiet_bi: row?.n ?? 0 });
}

// Ai cần nhận một thông báo: cả khoá nếu là thông báo lớp, chỉ nhóm ấy nếu là
// thông báo nhóm. Không gửi cho chính người vừa đăng — họ vừa bấm nút xong.
export async function guiThongBaoDay(env, me, { id, noi_dung, capLop }) {
  const cf = pushCauHinh(env);
  if (!cf) return { bo_qua: 'chưa cấu hình VAPID' };

  const subs = await env.DB.prepare(
    `SELECT ps.id, ps.endpoint, ps.p256dh, ps.auth
       FROM push_subscriptions ps
       JOIN members m ON m.id = ps.member_id
      WHERE ps.disabled_at IS NULL AND m.is_active = 1
        AND m.cohort_id = ? AND ps.member_id <> ?
        AND (? = 1 OR m.group_id = ?)`
  ).bind(me.cohort_id, me.id, capLop ? 1 : 0, me.group_id).all();

  const ds = subs.results ?? [];
  if (!ds.length) return { gui: 0 };

  // Nội dung cố ý ngắn và không có gì nhạy cảm: nó đi qua máy chủ của Google
  // hoặc Apple, và hiện cả trên màn hình khoá. Chi tiết để trong ứng dụng.
  const goi = JSON.stringify({
    title: capLop ? 'Thông báo của lớp' : 'Thông báo của nhóm',
    body: String(noi_dung).slice(0, 140),
    url: '/nay',
    tag: `thongbao-${id}`,
  });

  let ok = 0, hong = 0;
  const ghi = [];
  // Gọi song song: 134 lượt tuần tự thì mất hàng chục giây, mà Worker có hạn
  // thời gian chạy.
  const kq = await Promise.all(ds.map(s => guiMotDay(cf, s, goi)));
  for (let i = 0; i < ds.length; i++) {
    const r = kq[i], s = ds[i];
    if (r.ok) {
      ok++;
      ghi.push(env.DB.prepare(
        `UPDATE push_subscriptions SET last_ok_at = datetime('now'), last_error = NULL WHERE id = ?`
      ).bind(s.id));
    } else {
      hong++;
      ghi.push(env.DB.prepare(
        `UPDATE push_subscriptions SET last_error = ?,
           disabled_at = CASE WHEN ? = 1 THEN datetime('now') ELSE disabled_at END
         WHERE id = ?`
      ).bind(`${r.ma ?? '-'} ${r.text ?? ''}`.slice(0, 300), r.chet ? 1 : 0, s.id));
    }
  }
  if (ghi.length) await env.DB.batch(ghi);
  return { gui: ok, hong };
}
