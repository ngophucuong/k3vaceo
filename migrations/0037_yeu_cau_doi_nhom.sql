-- Xin đổi nhóm — tự phục vụ, không cần migration tay mỗi lần có người muốn
-- chuyển nhóm.
--
-- ══ VÌ SAO CÓ MIGRATION NÀY ═══════════════════════════════════════════════
-- Migration 0036 (Trương Thị Ngọc Anh, Nhóm 4 → Nhóm 6) là ca ĐẦU TIÊN đổi
-- group_id của một hồ sơ đang hoạt động, và phải làm tay: soi officers/
-- plan_sections thủ công, viết UPDATE khoá chặt theo id, chờ tôi push. Ngô
-- Phú Cường hỏi thẳng ngay sau đó: "Có thể thêm chức năng xin đổi nhóm có
-- được không, ai là phê duyệt thì phù hợp" — tức là muốn việc này tự chạy
-- được, không phải chờ sửa mã mỗi lần.
--
-- ══ AI DUYỆT — ĐÃ HỎI TRỰC TIẾP, KHÔNG TỰ ĐOÁN ═══════════════════════════
-- Ba phương án đưa ra: Ban cán sự lớp duyệt, trưởng/phó nhóm ĐÍCH duyệt, hay
-- cần cả hai nhóm (đi lẫn đến) đồng ý. Ngô Phú Cường chọn: TRƯỞNG/PHÓ NHÓM
-- ĐÍCH DUYỆT. Lý lẽ khớp với cách quyền đã phân trong toàn bộ ứng dụng:
--   • Nhóm ĐÍCH là bên duy nhất chịu hậu quả thật của quyết định — sĩ số đổi,
--     phải chia lại phần bài, thêm một suất thuyết trình. Nhóm ĐI không mất gì
--     mà cũng không có quyền giữ người ở lại (đúng N5 — chính chủ tự quyết,
--     không ai có quyền cấm một người muốn rời nhóm).
--   • Không cần Ban cán sự lớp: một việc nội bộ giữa hai nhóm không cần leo
--     lên cấp lớp mỗi lần, đúng tinh thần "trưởng/phó nhóm tự vận hành nhóm
--     mình" đã xuyên suốt từ Đợt 1 (cơ cấu, phần bài, ngừng tham gia đều vậy).
--   • Không cần HAI nhóm đồng ý: thêm một bên duyệt là thêm một chỗ đơn có
--     thể kẹt vô thời hạn nếu nhóm đi không màng trả lời — nhóm đi chỉ CẦN
--     BIẾT (báo qua activity), không cần ĐỒNG Ý.
--
-- ══ MỘT ĐƠN CHỜ DUYỆT TẠI MỘT THỜI ĐIỂM ══════════════════════════════════
-- ux_doinhom_dang_cho chặn ở tầng DB, không chỉ ở tầng ứng dụng: nộp hai đơn
-- chồng nhau (bấm nhanh hai lần, hay mở hai tab) thì lần thứ hai vỡ UNIQUE
-- constraint, route bắt lỗi đó và trả 409 — không có khe hở giữa lúc kiểm tra
-- và lúc ghi (đúng lo ngại đã áp cho invites.token_hash ở migration 0004).
--
-- ══ ĐANG GIỮ CHỨC THÌ KHÔNG XIN ĐƯỢC ══════════════════════════════════════
-- Cùng chốt chặn "đầu vào" đã dùng cho ngừng tham gia (routes/members.js,
-- postNgungThamGia): trưởng/phó/tiêu biểu của nhóm hiện tại, hoặc Ban cán sự
-- lớp, phải được thay TRƯỚC khi xin đổi nhóm — không thì cơ cấu đứng tên một
-- người không còn ở nhóm đó, giống hệt lỗi ngừng tham gia đã vá ở Đợt 4.
--
-- ══ KHÔNG LƯU cohort_id RIÊNG ═════════════════════════════════════════════
-- member_id, tu_group_id, den_group_id đều đã neo vào đúng một cohort qua
-- members/groups — thêm cột cohort_id ở đây chỉ là lặp lại thứ suy ra được,
-- đúng khuôn push_subscriptions (migration 0012) đã bỏ cohort_id vì lý do
-- tương tự.
CREATE TABLE yeu_cau_doi_nhom (
  id             INTEGER PRIMARY KEY,
  member_id      INTEGER NOT NULL REFERENCES members(id),  -- người xin chuyển
  tu_group_id    INTEGER NOT NULL REFERENCES groups(id),   -- nhóm hiện tại lúc nộp đơn
  den_group_id   INTEGER NOT NULL REFERENCES groups(id),   -- nhóm muốn đến
  ly_do          TEXT,                                     -- do người xin gõ, không bắt buộc
  trang_thai     TEXT NOT NULL DEFAULT 'cho_duyet',         -- cho_duyet|da_duyet|tu_choi|da_huy
  ly_do_tu_choi  TEXT,
  quyet_dinh_boi INTEGER REFERENCES members(id),            -- ai duyệt/từ chối
  quyet_dinh_luc TEXT,
  created_at     TEXT DEFAULT (datetime('now')),
  updated_at     TEXT DEFAULT (datetime('now'))
);

-- "Đơn của tôi" (lịch sử + đơn đang chờ) tra theo member_id; officer nhóm
-- đích tra danh sách chờ theo den_group_id. Cả hai đều lọc kèm trạng thái nên
-- ghép trạng thái vào chỉ mục luôn, khỏi quét thêm.
CREATE INDEX ix_doinhom_member ON yeu_cau_doi_nhom(member_id, trang_thai);
CREATE INDEX ix_doinhom_den ON yeu_cau_doi_nhom(den_group_id, trang_thai);

-- Chốt chặn THẬT ở tầng DB: mỗi người chỉ một đơn CHỜ DUYỆT tại một thời
-- điểm. Chỉ mục một phần (WHERE trang_thai = 'cho_duyet') nên đơn đã duyệt/
-- từ chối/huỷ không tính — người bị từ chối vẫn xin lại được ngay.
CREATE UNIQUE INDEX ux_doinhom_dang_cho ON yeu_cau_doi_nhom(member_id) WHERE trang_thai = 'cho_duyet';
