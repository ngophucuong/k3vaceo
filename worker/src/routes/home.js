import { json } from '../lib/http.js';
import { layTuLieuTheoBuoi } from './lich.js';
import { isClassCommittee } from '../permissions.js';

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
       WHERE o.group_id = ? AND o.role IN ('truong_nhom', 'pho_nhom', 'tieu_bieu')
         AND o.superseded_at IS NULL`
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

  // Lịch học sắp tới và thông báo còn hiệu lực. Đọc chung một lượt với /api/home
  // để tab Hôm nay không phải gọi thêm — màn này mở nhiều nhất, mỗi lượt gọi
  // thừa là một lần chờ.
  //
  // Mốc thời gian để SQLite so, không dùng Date của JS: chuỗi ISO có 'T' ở vị
  // trí 11 còn SQLite dùng dấu cách, so sánh chuỗi sẽ lệch (quy ước 1 CLAUDE.md).
  //
  // "Hôm nay" ở đây LUÔN là date('now','+7 hours') — ngày theo giờ Việt Nam.
  // datetime('now') của SQLite là UTC, mà UTC đi sau Việt Nam 7 tiếng, nên từ
  // 17h đến nửa đêm giờ Việt Nam thì date('now') vẫn là hôm qua. Hai hệ quả
  // thật, cả hai đều không tự báo lỗi:
  //   · buổi học của hôm nay còn nằm trong danh sách "sắp tới" thêm 7 tiếng
  //   · con số đếm ngược lệch một ngày so với trang /lich công khai
  const [nayRes, lichRes, tbRes, tuLieuBuoi] = await Promise.all([
    env.DB.prepare("SELECT date('now', '+7 hours') AS d").first(),
    env.DB.prepare(
      `SELECT id, ngay, tu_gio, den_gio, chu_de, giang_vien, ghi_chu
         FROM lich_hoc
        WHERE cohort_id = ? AND huy_luc IS NULL AND ngay >= date('now', '+7 hours')
        ORDER BY ngay, COALESCE(tu_gio, '00:00') LIMIT 6`
    ).bind(me.cohort_id).all(),
    // Thông báo hai cấp: group_id NULL là của cả lớp, có số là của riêng nhóm
    // ấy. Người Nhóm 5 không được thấy thông báo nội bộ của Nhóm 6 (N6).
    env.DB.prepare(
      `SELECT id, noi_dung, nguon, het_han, group_id, created_at,
              id > COALESCE(?, 0) AS moi
         FROM thong_bao
        WHERE cohort_id = ? AND (group_id IS NULL OR group_id = ?)
          AND (het_han IS NULL OR het_han >= date('now', '+7 hours'))
        ORDER BY id DESC LIMIT 5`
    ).bind(me.thong_bao_xem_id ?? 0, me.cohort_id, me.group_id).all(),
    // Tư liệu gắn vào buổi. Dùng CHUNG hàm với /api/lich để hai màn không thể
    // lọc khác nhau — cùng một liên kết mà hiện ở màn này, mất ở màn kia là
    // lỗi không chỗ nào báo.
    layTuLieuTheoBuoi(env, me),
  ]);

  return json({
    // Mã bản đang chạy trên máy chủ. Giao diện chụp lại lúc mở trang rồi so
    // mỗi lần quay lại app: khác nhau nghĩa là đã deploy bản mới trong lúc
    // ứng dụng nằm im trong bộ nhớ — chuyện thường gặp với PWA trên iPhone,
    // vì người ta không bao giờ đóng hẳn nó.
    ban: env.COMMIT_SHA ?? null,
    hom_nay: nayRes?.d ?? null,
    lich_hoc: (lichRes.results ?? []).map(b => ({ ...b, tu_lieu: tuLieuBuoi.get(b.id) ?? [] })),
    thong_bao: tbRes.results ?? [],
    // Số thông báo chưa xem — giao diện chấm đỏ lên tab Hôm nay. Đây là đường
    // báo tin chạy được trên MỌI máy, không cần quyền, không cần cài gì; thông
    // báo đẩy chỉ là lớp thêm cho ai cài ứng dụng lên màn hình chính.
    thong_bao_moi: (tbRes.results ?? []).filter(t => t.moi).length,
    // Ai sửa được lịch: chỉ Ban cán sự lớp. Giao diện dùng cờ này để khỏi
    // bày nút bấm vào là 403; máy chủ vẫn kiểm lại trong routes/lich.js.
    can_sua_lich: await isClassCommittee(env, me.id),
    // email_verified quyết định có hiện nút đăng ký passkey hay không
    // (Đợt 5). Máy chủ vẫn chặn riêng ở postRegisterOptions.
    me: { id: me.id, full_name: me.full_name, group_id: me.group_id,
          email_verified: !!me.email_verified_at,
          // Đã nhận hồ sơ thì mở được passkey, kể cả khi email chưa kiểm
          // chứng (xem routes/passkey.js). Máy chủ vẫn chặn lại ở đó.
          da_nhan_ho_so: !!me.claimed_at,
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
