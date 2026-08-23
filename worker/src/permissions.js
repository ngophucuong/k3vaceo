// Kiểm tra vai + phạm vi nhóm ở máy chủ cho mọi hành động ghi — mục 2.2, mục 8 SRS.
// class_officer chưa có ai giữ trong dữ liệu hiện tại (chưa mở tầng lớp), nên
// chưa cần kiểm ở đây — thêm khi Ban cán sự lớp thật sự dùng (mục 11, điểm #6).

export async function isGroupOfficer(env, memberId, groupId) {
  const row = await env.DB.prepare(
    `SELECT 1 FROM officers
     WHERE group_id = ? AND member_id = ? AND role IN ('truong_nhom', 'pho_nhom') AND superseded_at IS NULL`
  ).bind(groupId, memberId).first();
  return !!row;
}

// Ma trận mục 2.2 SRS: "Sửa hồ sơ người khác cùng nhóm (sửa hộ)" — thành viên
// thường CŨNG được, không cần là trưởng/phó. Điều kiện duy nhất là cùng nhóm
// (nguyên tắc N6 — dữ liệu nhóm cách ly). Mọi lần sửa hộ đều ghi audit_log và
// ghi rõ "do X sửa hộ" trong nhật ký, đúng chú thích (*) của bảng.
export async function canEditProfile(env, actor, target) {
  if (actor.id === target.id) return true;
  return actor.group_id === target.group_id;
}

// Cập nhật cơ cấu, gán người phụ trách phần bài: chỉ trưởng/phó của chính nhóm mình.
export async function canManageGroup(env, actor, groupId) {
  if (actor.group_id !== groupId) return false;
  return isGroupOfficer(env, actor.id, groupId);
}

// Ma trận mục 2.2: "Cập nhật tiến độ phần mình giữ" — thành viên ✓ (chỉ phần
// mình giữ), trưởng/phó ✓ (phần nào cũng được, vì họ điều phối cả bài).
// Còn "Gán người phụ trách phần bài" thì chỉ trưởng/phó — tách riêng ở route.
export async function canUpdateSection(env, actor, section) {
  if (section.owner_member_id === actor.id) return true;
  return isGroupOfficer(env, actor.id, actor.group_id);
}

export async function logAudit(env, { actorId, action, targetType, targetId, before, after, ip }) {
  await env.DB.prepare(
    `INSERT INTO audit_log (actor_member_id, action, target_type, target_id, before_json, after_json, ip, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`
  ).bind(
    actorId, action, targetType, targetId ?? null,
    before !== undefined ? JSON.stringify(before) : null,
    after !== undefined ? JSON.stringify(after) : null,
    ip ?? null
  ).run();
}

export async function logActivity(env, { cohortId, groupId, actorId, verb, objectType, objectId, summary }) {
  await env.DB.prepare(
    `INSERT INTO activity (cohort_id, group_id, actor_member_id, verb, object_type, object_id, summary, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`
  ).bind(cohortId, groupId, actorId, verb, objectType ?? null, objectId ?? null, summary).run();
}
