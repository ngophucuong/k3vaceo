-- Trợ lý KHKD — phỏng vấn và dẫn dắt học viên xây dựng Kế hoạch Kinh doanh.
--
-- ══ VÌ SAO CÓ MIGRATION NÀY ═══════════════════════════════════════════════
-- Ngô Phú Cường cung cấp hai tài liệu gốc của giảng viên ngày 12/9 ("Hướng
-- dẫn xây dựng và bảo vệ KHKD cuối khóa" và "Hướng dẫn lập KHKD") rồi yêu
-- cầu: một Agent phỏng vấn, phân tích khoảng trống, gợi ý cách trả lời theo
-- nội dung học viên đưa vào, lưu được phiên hỏi đáp. Sau khi được nêu rõ hai
-- rào cản (N1 "không chat", N2 "không giữ bản sao tài liệu của người khác"),
-- anh quyết BỎ CẢ HAI để đổi lấy một trợ lý thật sự dùng được cho học viên.
-- Ghi ở đây để người sau biết đó là một quyết định, không phải chỗ quên —
-- đúng nếp đã làm cho mọi lần lệch nguyên tắc trước (xem CLAUDE.md).
--
-- ══ BA VIỆC TRONG MỘT MIGRATION ═══════════════════════════════════════════
-- 1. Hai bảng lưu phiên hỏi đáp.
-- 2. Bảng cai_dat — chỗ đặt CÔNG TẮC TẮT của trợ lý.
-- 3. Nâng cấp `requirement` của tám phần bài bằng nguyên văn chữ đỏ trong
--    file Word của giảng viên. Việc số 3 có giá trị ĐỘC LẬP: kể cả trợ lý
--    không bao giờ chạy, cả 10 nhóm vẫn đọc được yêu cầu đầy đủ thay vì bản
--    tóm tắt một dòng đang có từ migration 0003.

-- ── 1. Phiên hỏi đáp ──────────────────────────────────────────────────────
-- section_id NULL = phiên cho CẢ BÀI (chọn đề tài, tập phản biện), khác với
-- phiên gắn vào đúng một phần. Không tách hai bảng: cùng một cuộc hội thoại,
-- chỉ khác chỗ neo.
--
-- Đếm token ngay trong bảng chứ không chỉ trong log: đây là tính năng ĐẦU
-- TIÊN của dự án tốn tiền thật theo lượt dùng, và cách duy nhất biết đang
-- tốn bao nhiêu mà không phải mở bảng điều khiển của nhà cung cấp là tự cộng
-- ở đây.
CREATE TABLE tro_ly_phien (
  id          INTEGER PRIMARY KEY,
  group_id    INTEGER NOT NULL REFERENCES groups(id),
  section_id  INTEGER REFERENCES plan_sections(id),   -- NULL = phiên cho cả bài
  mo_boi      INTEGER NOT NULL REFERENCES members(id),
  tieu_de     TEXT,
  giai_doan   TEXT,                                    -- de_tai | viet_phan | phan_bien
  trang_thai  TEXT NOT NULL DEFAULT 'dang_mo',         -- dang_mo | da_dong
  so_luot     INTEGER NOT NULL DEFAULT 0,              -- số lượt hỏi đáp, dùng cho trần mỗi phiên
  token_vao   INTEGER NOT NULL DEFAULT 0,
  token_ra    INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
);
CREATE INDEX ix_troly_phien_nhom ON tro_ly_phien(group_id, updated_at DESC);
CREATE INDEX ix_troly_phien_phan ON tro_ly_phien(section_id, trang_thai);

CREATE TABLE tro_ly_tin (
  id         INTEGER PRIMARY KEY,
  phien_id   INTEGER NOT NULL REFERENCES tro_ly_phien(id),
  vai        TEXT NOT NULL,        -- nguoi | tro_ly
  noi_dung   TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX ix_troly_tin_phien ON tro_ly_tin(phien_id, id);

-- ── 2. Công tắc tắt ───────────────────────────────────────────────────────
-- Mọi tính năng trước đều miễn phí nên không cần thứ này. Trợ lý thì tốn tiền
-- theo lượt gọi, mà `deploy.yml` mất khoảng hai phút để chạy xong — quá chậm
-- khi cần dừng gấp. Một dòng trong D1 tắt được tức thì bằng một lệnh
-- `wrangler d1 execute`, không cần deploy.
CREATE TABLE cai_dat (
  khoa       TEXT PRIMARY KEY,
  gia_tri    TEXT,
  ghi_chu    TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);
INSERT INTO cai_dat (khoa, gia_tri, ghi_chu) VALUES
  ('tro_ly_bat', '1', 'Đặt về 0 là tắt Trợ lý KHKD ngay lập tức, không cần deploy.'),
  ('tro_ly_luot_moi_nguoi_moi_ngay', '40', 'Trần số lượt hỏi mỗi người mỗi ngày.'),
  ('tro_ly_luot_moi_phien', '30', 'Hết trần thì phải mở phiên mới, chặn một phiên phình vô hạn.');

-- ── 3. Nguyên văn yêu cầu của giảng viên cho tám phần ─────────────────────
-- Chữ đỏ trong "Hướng dẫn lập KHKD" là yêu cầu, chữ đen là ví dụ minh hoạ
-- (case RiVita) — tách được bằng máy, chỉ 1.698 ký tự đỏ trên 37.448 ký tự
-- đen. Năm phần có chữ đỏ (1–5) chép NGUYÊN VĂN dưới đây. Ba phần còn lại
-- (Sản phẩm/khách hàng, Lộ trình, Rủi ro) file Word KHÔNG có chữ đỏ — yêu cầu
-- suy ra từ thước chấm trong PDF, và câu chữ nói rõ nguồn để không trình bày
-- suy luận như lời giảng viên.
--
-- An toàn vì `requirement` KHÔNG BAO GIỜ do người dùng sửa: patchSection
-- (routes/plan.js) chỉ nhận owner_member_id, pct và note. Không có nhánh nào
-- ghi vào cột này, nên cập nhật hàng loạt không đè lên sửa tay của ai.
--
-- Bản trong worker/src/tro-ly/giao-trinh.js phải TRÙNG KHỚP với bản ở đây —
-- một bên là thứ học viên đọc trên màn hình, một bên là thứ trợ lý đọc trong
-- prompt, hai bên nói khác nhau là học viên bị chấm bằng một thước mà họ
-- không nhìn thấy. `kiem-tro-ly.mjs` so từng ký tự hai bản để bắt lệch.

UPDATE plan_template_sections SET requirement =
 'Nêu rõ sản phẩm / dịch vụ của đề tài và các nhóm khách hàng mục tiêu. Mỗi nhóm khách hàng phải nói được họ cần gì ở sản phẩm này. Đây là phần chốt lý do để tin: đọc xong hội đồng phải hiểu ta bán gì, cho ai, và vì sao người đó cần.'
 WHERE ord = 0 AND template_id = (SELECT id FROM plan_templates WHERE is_default = 1);

UPDATE plan_template_sections SET requirement =
 'Phần này cần tính được quy mô (size) của phân khúc thị trường mục tiêu và tốc độ tăng trưởng của phân khúc thị trường mục tiêu này trong những năm tới, đồng thời trình bày kết quả nghiên cứu nhu cầu, hành vi … của khách hàng trong phân khúc này đối với sản phẩm / dịch vụ của công ty.'
 WHERE ord = 1 AND template_id = (SELECT id FROM plan_templates WHERE is_default = 1);

UPDATE plan_template_sections SET requirement =
 'Phần này cần trình bày được kế hoạch marketing để làm sao cho công ty bán được sản phẩm / dịch vụ tới đối tượng khách hàng mục tiêu với chỉ tiêu về doanh thu / khách hàng như dự kiến, khả thi về ngân sách marketing và đem lại lợi nhuận cho công ty. Trả lời được câu hỏi: tại sao khách hàng trong phân khúc này lại quan tâm đến / chọn mua sản phẩm / dịch vụ của công ty (mà không phải là của các đối thủ cạnh tranh).'
 WHERE ord = 2 AND template_id = (SELECT id FROM plan_templates WHERE is_default = 1);

UPDATE plan_template_sections SET requirement =
 'Phần này cần thuyết phục được hội đồng / nhà đầu tư rằng công ty có đủ nhân sự (chủ chốt) trong những lĩnh vực cần thiết để triển khai thành công kế hoạch kinh doanh này; hoặc có phương án xây dựng đội ngũ nhân sự khả thi, trong phạm vi ngân sách cho phép.'
 WHERE ord = 3 AND template_id = (SELECT id FROM plan_templates WHERE is_default = 1);

UPDATE plan_template_sections SET requirement =
 'Phần này cần thuyết phục được hội đồng / nhà đầu tư rằng công ty sở hữu công nghệ ưu việt hoặc phù hợp hoặc các nguồn lực quan trọng khác như: đất đai, vị trí, nhà xưởng, máy móc, trang thiết bị, phần mềm, patent (bản quyền phát minh, sáng chế …), quy trình quản trị chuỗi cung ứng / quản lý chất lượng, logistics … để có thể cung cấp sản phẩm / dịch vụ cho khách hàng một cách hiệu quả, đáp ứng nhu cầu của khách hàng.'
 WHERE ord = 4 AND template_id = (SELECT id FROM plan_templates WHERE is_default = 1);

UPDATE plan_template_sections SET requirement =
 'Phần này cần đưa ra những tính toán, phân tích tài chính để thuyết phục hội đồng / nhà đầu tư rằng dự án này sẽ đem lại doanh thu / lợi nhuận với tỷ suất hấp dẫn và khả thi. Đặc biệt, cần tính toán tổng vốn đầu tư cần có để triển khai thành công dự án này và đề xuất huy động vốn từ những nguồn nào, phương án huy động vốn …'
 WHERE ord = 5 AND template_id = (SELECT id FROM plan_templates WHERE is_default = 1);

UPDATE plan_template_sections SET requirement =
 'Chia lộ trình thành các giai đoạn theo năm hoặc theo quý, mỗi giai đoạn một mục tiêu ĐO ĐƯỢC. Riêng 90 ngày đầu phải chi tiết tới mức trả lời được câu khóa của hội đồng: việc gì làm trước, ai chịu trách nhiệm, cần bao nhiêu tiền, và mốc nào quyết định đi tiếp hay dừng.'
 WHERE ord = 6 AND template_id = (SELECT id FROM plan_templates WHERE is_default = 1);

UPDATE plan_template_sections SET requirement =
 'Nêu 3–5 rủi ro lớn nhất. Mỗi rủi ro phải đi đủ sáu ô: rủi ro · dấu hiệu kích hoạt · hành động phòng ngừa · phương án dự phòng · người phụ trách · rủi ro còn lại. Nói được rủi ro còn lại là dấu hiệu của người đã tính kỹ.'
 WHERE ord = 7 AND template_id = (SELECT id FROM plan_templates WHERE is_default = 1);

-- Chép xuống bản sao của từng nhóm. Nhóm nào chạy wizard sau này thì
-- createPlan (routes/start-wizard.js) tự lấy bản mới từ template.
UPDATE plan_sections SET
  requirement = (SELECT ts.requirement FROM plan_template_sections ts
                   JOIN plan_templates t ON t.id = ts.template_id AND t.is_default = 1
                  WHERE ts.ord = plan_sections.ord),
  updated_at = datetime('now')
WHERE EXISTS (SELECT 1 FROM plan_template_sections ts
                JOIN plan_templates t ON t.id = ts.template_id AND t.is_default = 1
               WHERE ts.ord = plan_sections.ord);
