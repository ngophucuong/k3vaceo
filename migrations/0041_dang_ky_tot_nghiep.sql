-- Zone "Lễ tốt nghiệp" — bảng đăng ký, ô nộp link KHKD, và đợt thu phí Gala.
--
-- ══ VÌ SAO CÓ MIGRATION NÀY ═══════════════════════════════════════════════
-- Ngô Phú Cường (18/9) đưa 15 câu Ban tổ chức muốn thu của học viên để chuẩn
-- bị Lễ tốt nghiệp 26/9, và xin "một zone riêng". Khảo sát ra điều quyết định
-- cả hình dạng việc này: 6/15 câu D1 ĐÃ CÓ SẴN dữ liệu (họ tên, ngày sinh,
-- điện thoại, doanh nghiệp, lĩnh vực, chức vụ), 2 câu nữa có sẵn cả cỗ máy
-- (đề tài KHKD, và toàn bộ quỹ + VietQR cho khoản phí). Nên đây không phải
-- một biểu mẫu 15 câu từ đầu, mà là màn XÁC NHẬN thứ đã biết cộng 5 câu mới.
--
-- ══ BA PHẦN, LƯU ĐỘC LẬP ══════════════════════════════════════════════════
-- Ngô Phú Cường hỏi thẳng "có nên tách các phần?" — nên, và vì một lý do cụ
-- thể chứ không phải cho gọn: ba cụm có BA HẠN KHÁC NHAU.
--   A · Hồ sơ & chứng chỉ (câu 1-9)     hạn 26/9
--   B · Đề tài KHKD + link (câu 10)     hạn 26/9, việc của NHÓM
--   C · Lễ tốt nghiệp & Gala (câu 11-15) hạn 21h00 NGÀY 19/9
-- Gộp một form 15 câu thì người muốn đăng ký Gala tối nay bị chặn vì chưa có
-- ảnh chân dung — mất đúng cái hạn gấp nhất. Mỗi phần đóng dấu một mốc riêng
-- (ho_so_luc, gala_luc, groups.ban_nop_luc) nên câu Ban tổ chức thật sự cần
-- ("còn ai chưa xong phần nào") trả lời được bằng một truy vấn, không đoán.
--
-- ══ KHÔNG LƯU CÂU 10 VÀ CÂU 12 VÀO BẢNG NÀY ═══════════════════════════════
-- Đề tài đọc thẳng từ plans/officers/members, trạng thái tiền đọc thẳng từ
-- fund_declarations. Chép sang bảng thứ hai là đẻ ra hai nguồn sự thật cho
-- cùng một việc — lỗi đã ghi nhiều lần trong CLAUDE.md ("hai bản ghi thì sớm
-- muộn cũng lệch nhau mà không chỗ nào báo lỗi").
--
-- ══ CHỈ HỌC VIÊN, KHÔNG CÓ DÒNG KHÁCH MỜI ═════════════════════════════════
-- Đã hỏi Ngô Phú Cường, anh chọn "chỉ học viên". Nhờ vậy member_id NOT NULL
-- và UNIQUE thẳng, không cần cột `loai`, không cần ràng buộc CHECK, không cần
-- UNIQUE MỘT PHẦN như ux_doinhom_dang_cho (migration 0037) — ở đó cần vì có
-- dòng member_id NULL, ở đây thì không.
--
-- ══ KHÔNG LƯU cohort_id, KHÔNG LƯU group_id ═══════════════════════════════
-- Suy ra được từ members, đúng khuôn push_subscriptions (0012) và
-- yeu_cau_doi_nhom (0037) đã bỏ cột này vì lý do tương tự.
CREATE TABLE dang_ky_tot_nghiep (
  id              INTEGER PRIMARY KEY,
  member_id       INTEGER NOT NULL UNIQUE REFERENCES members(id),

  -- ── Phần A: bản ĐÃ XÁC NHẬN. Cố ý KHÔNG ghi đè members/roster ──────────
  -- roster.dob là bản ghi lịch sử của Ban tổ chức và định dạng KHÔNG đồng
  -- nhất — đo trên D1 thật 18/9: 146 dòng gồm 107 dạng dd/mm/yyyy, 28 dòng
  -- CHỈ CÓ NĂM ('1966'), 11 dòng trống, 0 dòng dạng lạ. Cột này chưa code nào
  -- từng đọc (grep '\bdob\b' ra 0 kết quả) nên chưa ai phát hiện. In thẳng
  -- một chuỗi '1966' lên chứng chỉ là hỏng thật, nên form điền sẵn nguyên văn
  -- rồi để chính chủ xác nhận, và bản xác nhận nằm ở ĐÂY.
  ho_ten          TEXT,
  ngay_sinh       TEXT,
  dien_thoai      TEXT,
  doanh_nghiep    TEXT,
  linh_vuc        TEXT,          -- mã ngành, phân tách bằng dấu phẩy (lib/nganh.js)
  chuc_vu         TEXT,
  -- Câu 9. member_profile.needs chỉ 80 ký tự mà câu hỏi đòi "cụ thể". Không
  -- nới needs: nó đang hiện trong thẻ gọn ở Danh bạ và Giao thương, nới ra là
  -- vỡ bố cục hai màn khác. Cột riêng 500 ký tự, điền sẵn TỪ needs.
  nhu_cau_ket_noi TEXT,
  -- Câu 7, 8 — Đợt 2 (Worker tự đẩy lên Google Drive của Ban tổ chức).
  -- Cột chính là *_url chứ không phải *_drive_id: đường Drive ghi webViewLink
  -- vào đây, còn drive_id chỉ để về sau còn sửa/xoá được tệp. Nếu đường Drive
  -- vướng thì cùng ô ấy nhận link dán tay, không phải đổi lược đồ.
  anh_url         TEXT,
  anh_drive_id    TEXT,
  logo_url        TEXT,
  logo_drive_id   TEXT,
  ho_so_luc       TEXT,          -- mốc xác nhận phần A

  -- ── Phần C ──────────────────────────────────────────────────────────────
  du_le           TEXT,          -- câu 11: 'co' | 'khong'
  tai_tro         TEXT,          -- câu 13: 'tien' | 'hien_vat' | 'khong'
  tai_tro_mo_ta   TEXT,
  gian_hang       INTEGER DEFAULT 0,   -- câu 14
  van_nghe        INTEGER DEFAULT 0,   -- câu 15
  van_nghe_mo_ta  TEXT,
  gala_luc        TEXT,          -- mốc xác nhận phần C

  created_at      TEXT DEFAULT (datetime('now')),
  updated_at      TEXT DEFAULT (datetime('now'))
);

-- Ban cán sự lớp duyệt danh sách theo "ai xong phần nào" — hai mốc này là thứ
-- được lọc, nên đưa vào chỉ mục luôn.
CREATE INDEX ix_dktn_moc ON dang_ky_tot_nghiep(ho_so_luc, gala_luc);

-- ══ CÂU 10: LINK BẢN NỘP KHKD — ĐẶT TRÊN `groups`, KHÔNG PHẢI `plans` ═════
-- Chỗ này ban đầu định đặt trên `plans` (semantic đúng hơn: link tới chính
-- bản kế hoạch kinh doanh). Lượt soi D1 thật ngày 18/9 bác bỏ:
--
--     CHỈ NHÓM 6 CÓ DÒNG `plans` (plan_id=1). Chín nhóm còn lại KHÔNG CÓ.
--
-- `plans` chỉ sinh ra khi nhóm chạy wizard tạo kế hoạch, mà 9/10 nhóm chưa
-- làm. Đặt cột ở đó là 9 nhóm KHÔNG CÓ CHỖ NÀO để nộp link, tám ngày trước
-- buổi bảo vệ. Chữa bằng cách tự tạo dòng `plans` khi nộp thì tệ hơn nữa:
-- getPlan() sẽ thôi trả 404 nên tab Bài của 9 nhóm ấy mất màn "chưa có kế
-- hoạch — tạo ngay", thay bằng một bài tám phần RỖNG. Sửa một chỗ, hỏng chỗ
-- khác.
--
-- `groups` thì luôn có đủ 10 dòng (đã đếm trên D1 thật). Link bản nộp là một
-- sự thật của ĐỘI, tồn tại độc lập với việc đội ấy có dùng khung tám phần
-- trong ứng dụng hay không.
--
-- Đúng N2 NGUYÊN BẢN, không lệch gì: "ứng dụng không giữ file, chỉ lưu URL".
ALTER TABLE groups ADD COLUMN ban_nop_url TEXT;
ALTER TABLE groups ADD COLUMN ban_nop_luc TEXT;
ALTER TABLE groups ADD COLUMN ban_nop_boi INTEGER;   -- members.id, ai nộp lần cuối

-- ══ ĐỢT THU PHÍ GALA — ĐỢT CẤP LỚP ĐẦU TIÊN CỦA DỰ ÁN ═════════════════════
-- Đo trên D1 thật 18/9: `SELECT ... FROM fund_rounds WHERE scope='class'` trả
-- về RỖNG. Đây là đợt thu cấp lớp đầu tiên từng có — CLAUDE.md ghi "quỹ lớp
-- chưa tạo được: chưa ai giữ vai cấp lớp trong dữ liệu", mà điều đó nay ĐÃ CŨ:
-- cùng lượt soi cho thấy ba vai cấp lớp đều có người và còn hiệu lực từ 5/9
--   lop_truong = Lưu Minh Tiến (15) · thu_quy = Vũ Thị Ngân (48)
--   uy_vien    = Ngô Phú Cường (6)
--
-- Vì sao viết bằng migration chứ không qua route POST /api/funds: `postFund`
-- đòi isClassOfficer, mà Ngô Phú Cường là `uy_vien` nên KHÔNG tạo được đợt
-- lớp (uy_vien cố ý không nằm trong VAI_DIEU_HANH — xem permissions.js). Chỉ
-- Lưu Minh Tiến hoặc Vũ Thị Ngân tạo được. Migration đi thẳng vào D1.
--
-- Số tài khoản lấy từ chính thư mời Ban tổ chức, đã chép vào ghi chú của
-- migration 0040: "Vũ Thị Ngân — MBBank — 0975 587 586". Trùng khít số điện
-- thoại của chị trong roster seq 136, và soi D1 xác nhận chị đúng là người
-- đang giữ vai thu_quy cấp lớp — ba nguồn độc lập cùng chỉ một người.
--
-- bank_bin 970422 = MB Bank, đã có sẵn trong lib/vietqr.js.
--
-- closes_on là hạn ĐĂNG KÝ (21h00 ngày 19/9 theo thư mời), không phải hạn
-- chuyển tiền. Nó chỉ hiện ra như một nhãn, không chặn ai khai sau ngày đó
-- (patchFund/postDeclare không đọc cột này) — đúng thứ cần: ai chuyển muộn
-- vẫn khai được, không kẹt.
--
-- Guard WHERE NOT EXISTS theo (scope, amount, account_no) chứ không theo tiêu
-- đề: tiêu đề sửa được bằng nút ✎ ngay trong ứng dụng, so tên là có ngày chạy
-- lại thành hai dòng mà không ai hay.
INSERT INTO fund_rounds
  (cohort_id, scope, group_id, title, purpose, amount, bank_bin, bank_name,
   account_no, account_name, collector_member_id, syntax_template, thuoc_quy,
   opens_on, closes_on, status, created_by)
SELECT
  (SELECT id FROM cohorts WHERE code = 'K03'),
  'class', NULL,
  'Phí dự Lễ Tốt nghiệp & Gala 26/9',
  'Tiệc tối, gala và chương trình giao lưu 17h00-22h00 ngày 26/9 tại Dolce by Wyndham, Giảng Võ. Chỉ dành cho ai đăng ký dự Lễ — buổi bảo vệ Kế hoạch kinh doanh 13h30-17h00 cùng ngày KHÔNG thu phí.',
  1000000, '970422', 'MB Bank',
  '0975587586', 'VU THI NGAN',
  (SELECT id FROM members WHERE roster_id =
     (SELECT id FROM roster WHERE seq = 136 AND full_name = 'Vũ Thị Ngân')),
  'GALA {TEN} N{NHOM}', 'lop',
  '2026-09-18', '2026-09-19', 'open',
  (SELECT id FROM members WHERE roster_id =
     (SELECT id FROM roster WHERE seq = 136 AND full_name = 'Vũ Thị Ngân'))
 WHERE NOT EXISTS (
   SELECT 1 FROM fund_rounds
    WHERE scope = 'class' AND amount = 1000000 AND account_no = '0975587586'
 );
