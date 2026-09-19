-- Rủ người CÙNG LÀM đề tài, và người kia phải ĐỒNG Ý.
--
-- ══ VÌ SAO ══════════════════════════════════════════════════════════════
-- Ngô Phú Cường 19/9: "Thâm luồng: Phần chọn chung đề tài có thể chọn người
-- cùng làm và người đó đồng ý."
--
-- Migration 0043 (chiều 18/9) chuyển đề tài sang nộp "tự do theo cá nhân hoặc
-- cùng lĩnh vực". Phần B của /totnghiep mới chỉ làm được vế CÁ NHÂN: cơ chế
-- "làm chung" tới nay hoàn toàn là quy ước xã hội — giao diện nói thẳng ra là
-- "cùng chọn một lĩnh vực và dán cùng một đường dẫn".
--
-- Hệ quả cụ thể: ba người làm chung phải dán cùng một link ba lần, và màn Ban
-- cán sự lớp đếm thành BA BÀI. Đúng cái hỏng mà cả zone này sinh ra để chữa —
-- lượt bình chọn Zalo cũng cho con số mà không nối được người với đề tài.
--
-- Vế "người đó đồng ý" không phải chi tiết lịch sự. `putDeTai` cố ý KHÔNG
-- nhận member_id trong thân ("chính chủ tự khai… không ai khai hộ được"). Cho
-- A nêu tên B là mở đúng chỗ ấy — và thứ giữ nguyên tắc N5 lại chính là bước
-- B bấm Đồng ý.
--
-- ══ BẢNG RIÊNG, KHÔNG THÊM CỘT VÀO `dang_ky_tot_nghiep` ══════════════════
-- Bảng ấy khoá `member_id UNIQUE` (0041) — một dòng một người, không biểu
-- diễn được quan hệ nhiều-nhiều. Và migration 0042 đã ghi hẳn bài học đừng
-- thêm khoá thứ hai vào nó.
--
-- ══ MÔ HÌNH: BÀI NEO VÀO CHỦ, QUAN HỆ LÀ MỘT DÒNG PHẲNG ══════════════════
-- Mỗi người có ĐÚNG MỘT bài của riêng mình — chính là ba cột khkd_* trên dòng
-- `dang_ky_tot_nghiep` của họ. Bảng này không đụng tới chúng.
--
-- Ngoài ra họ ĐỨNG TÊN ĐƯỢC trên bài của bất kỳ ai khác, bao nhiêu bài cũng
-- được (Ngô Phú Cường chọn, sau khi được nêu rằng hội đồng có thể không biết
-- chấm bài nào — màn Ban cán sự lớp và CSV vì vậy in ra đủ để nhìn thấy).
--
-- Vì bài luôn neo vào CHỦ chứ không neo vào quan hệ, nên không có chuỗi lồng
-- nhau, không có cây, không có vòng: một dòng ở đây chỉ nói đúng một câu —
-- "người `ban` đứng tên trên bài của người `chu`".
--
-- ══ `nguoi_gui_id`: VÌ SAO CÓ CỘT NÀY ════════════════════════════════════
-- Người gửi chọn lúc gửi bài chung lấy đề tài của ai (Ngô Phú Cường quyết):
--
--   bấm "họ cùng làm bài CỦA TÔI"  → chu = tôi, ban = họ  → HỌ duyệt
--   bấm "tôi cùng làm bài CỦA HỌ"  → chu = họ,  ban = tôi → HỌ duyệt
--
-- Cả hai chiều đều do NGƯỜI KIA đồng ý, đúng nguyên văn yêu cầu. Nhờ ghi lại
-- ai bấm Gửi, không cần cột `huong` riêng:
--   nguoi_duyet = (nguoi_gui_id = chu_member_id) ? ban_member_id : chu_member_id
--
-- Thiếu cột này thì không phân biệt được "A rủ B" với "B xin vào bài A", và
-- người gửi tự duyệt được đơn của chính mình — tức vế ĐỒNG Ý biến mất mà
-- không chỗ nào báo lỗi.
--
-- ══ KHÔNG CÓ CỘT `cohort_id` ════════════════════════════════════════════
-- Suy ra được qua `members`, đúng khuôn yeu_cau_doi_nhom (0037) và
-- push_subscriptions (0012).
CREATE TABLE IF NOT EXISTS khkd_cung_lam (
  id             INTEGER PRIMARY KEY,
  chu_member_id  INTEGER NOT NULL REFERENCES members(id),
  ban_member_id  INTEGER NOT NULL REFERENCES members(id),
  nguoi_gui_id   INTEGER NOT NULL REFERENCES members(id),
  -- cho_duyet | da_dong_y | tu_choi | da_huy | da_roi
  --   da_huy = người GỬI rút lời rủ khi còn đang chờ
  --   da_roi = người đã đồng ý rồi tự rời ra
  -- Hai cái này tách nhau vì chúng là hai câu chuyện khác nhau, và bảng này
  -- là bản ghi lịch sử của một thoả thuận giữa hai người.
  trang_thai     TEXT NOT NULL DEFAULT 'cho_duyet',
  loi_nhan       TEXT,
  quyet_dinh_luc TEXT,
  created_at     TEXT DEFAULT (datetime('now')),
  updated_at     TEXT DEFAULT (datetime('now'))
);

-- Hai chiều tra cứu: bài của tôi có ai, và tôi đứng tên bài của ai.
CREATE INDEX IF NOT EXISTS ix_cunglam_chu ON khkd_cung_lam(chu_member_id, trang_thai);
CREATE INDEX IF NOT EXISTS ix_cunglam_ban ON khkd_cung_lam(ban_member_id, trang_thai);

-- CHỈ SỐ MỘT PHẦN — chốt chặn Ở TẦNG DB, không ở tầng ứng dụng.
--
-- Một cặp (chủ, bạn) chỉ được MỘT quan hệ đang sống, dù đang chờ hay đã đồng
-- ý. Kiểm bằng SELECT rồi INSERT thì có khe hở giữa hai câu — bấm nhanh hai
-- lần, hoặc mở hai tab — đúng lo ngại đã ghi cho ux_doinhom_dang_cho (0037)
-- và invites.token_hash (0004).
--
-- Và vì nó CHỈ phủ hai trạng thái đang sống: từ chối rồi vẫn rủ lại được
-- ngay, rời ra rồi vẫn quay lại được, không phải xoá dòng cũ. Đổi ý là chuyện
-- bình thường của người thật; bắt họ chờ hết hạn một cái gì đó thì mới là lạ.
CREATE UNIQUE INDEX IF NOT EXISTS ux_cunglam_dang_song
  ON khkd_cung_lam(chu_member_id, ban_member_id)
  WHERE trang_thai IN ('cho_duyet', 'da_dong_y');
