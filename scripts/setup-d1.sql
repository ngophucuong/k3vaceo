-- ═══════════════════════════════════════════════════════════════
-- k3vaceo — dựng toàn bộ cơ sở dữ liệu trong MỘT lần chạy
--
-- Sinh tự động bởi scripts/build-setup-sql.mjs. ĐỪNG sửa tay tệp này —
-- sửa migration tương ứng rồi chạy lại script.
--
-- Dùng khi bạn làm hoàn toàn trên dashboard Cloudflare:
--   Storage & Databases → D1 → k3vaceo → Console → dán cả tệp này → Execute
--
-- Chạy đúng một lần trên một cơ sở dữ liệu trống. Chạy lần hai sẽ báo lỗi
-- "table already exists" — đó là dấu hiệu tốt, nghĩa là dữ liệu cũ còn nguyên.
--
-- Gồm 6 migration: 0001_init.sql, 0002_seed_roster.sql, 0003_seed_group6.sql, 0004_invite_kind_and_rate_limit.sql, 0005_webauthn_challenges.sql, 0006_wizard_and_presentation.sql
-- ═══════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────
-- 0001_init.sql
-- ─────────────────────────────────────────────────────────────
-- k3vaceo — schema khởi tạo (mục 3, SRS v1.0)
-- Áp dụng: wrangler d1 migrations apply k3vaceo --remote

-- ══ Khoá học và danh sách gốc ══
CREATE TABLE cohorts (
  id INTEGER PRIMARY KEY, code TEXT UNIQUE,
  name TEXT, starts_on TEXT, ends_on TEXT,
  defense_on TEXT, sessions_total INTEGER
);

CREATE TABLE roster (                                 -- bản gốc Ban tổ chức, chỉ đọc
  id INTEGER PRIMARY KEY, cohort_id INTEGER,
  seq INTEGER, group_label TEXT,
  full_name TEXT, dob TEXT, title TEXT, company TEXT,
  address TEXT, phone TEXT,
  source TEXT DEFAULT 'Ban tổ chức 15/8'
);
CREATE INDEX ix_roster_cohort ON roster(cohort_id);
CREATE INDEX ix_roster_group_label ON roster(cohort_id, group_label);

-- ══ Nhóm và thành viên ══
CREATE TABLE groups (
  id INTEGER PRIMARY KEY, cohort_id INTEGER,
  no INTEGER, label TEXT,
  status TEXT DEFAULT 'unclaimed',                    -- unclaimed | active | archived
  claimed_by INTEGER, claimed_at TEXT,
  UNIQUE(cohort_id, no)
);

CREATE TABLE members (
  id INTEGER PRIMARY KEY, cohort_id INTEGER, group_id INTEGER,
  roster_id INTEGER,                                  -- NULL nếu người mới không có trong danh sách
  full_name TEXT NOT NULL, title TEXT, company TEXT,
  phone TEXT, email TEXT,
  claimed_at TEXT,                                    -- NULL = chưa nhận tên
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX ux_member_email ON members(cohort_id, email) WHERE email IS NOT NULL;
CREATE INDEX ix_members_group ON members(group_id);
CREATE INDEX ix_members_roster ON members(roster_id);

CREATE TABLE member_profile (
  member_id INTEGER PRIMARY KEY,
  sells_what TEXT, sells_to TEXT, needs TEXT, offers TEXT,   -- mỗi ô ≤ 80 ký tự
  updated_at TEXT DEFAULT (datetime('now')), updated_by INTEGER
);

-- ══ Cơ cấu, giữ lịch sử ══
CREATE TABLE officers (
  id INTEGER PRIMARY KEY, cohort_id INTEGER,
  group_id INTEGER,                                   -- NULL = chức vụ cấp lớp
  role TEXT,          -- lop_truong | lop_pho | thu_quy | truong_nhom | pho_nhom
  member_id INTEGER,  -- NULL = còn trống
  note TEXT, effective_from TEXT,
  recorded_by INTEGER, created_at TEXT DEFAULT (datetime('now')), superseded_at TEXT
);
-- Bản đang hiệu lực = bản ghi có superseded_at IS NULL cho mỗi (group_id, role)
CREATE INDEX ix_officers_group_role ON officers(group_id, role, superseded_at);

-- ══ Bài kế hoạch kinh doanh ══
CREATE TABLE plan_templates (id INTEGER PRIMARY KEY, name TEXT, is_default INTEGER);
CREATE TABLE plan_template_sections (
  id INTEGER PRIMARY KEY, template_id INTEGER,
  ord INTEGER, title TEXT, requirement TEXT
);
CREATE TABLE plans (
  id INTEGER PRIMARY KEY, group_id INTEGER UNIQUE, template_id INTEGER,
  topic_product TEXT, topic_customers TEXT, updated_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE plan_sections (
  id INTEGER PRIMARY KEY, plan_id INTEGER,
  ord INTEGER, title TEXT, requirement TEXT,
  owner_member_id INTEGER, pct INTEGER DEFAULT 0, note TEXT,
  updated_at TEXT DEFAULT (datetime('now')), updated_by INTEGER
);
CREATE INDEX ix_plan_sections_plan ON plan_sections(plan_id);

-- ══ Tâm đắc và Kho ══
CREATE TABLE insights (
  id INTEGER PRIMARY KEY, group_id INTEGER, section_id INTEGER,
  body TEXT, speaker TEXT, heard_on TEXT,
  is_proxy INTEGER DEFAULT 1, created_by INTEGER, created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX ix_insights_group ON insights(group_id);

CREATE TABLE links (
  id INTEGER PRIMARY KEY, cohort_id INTEGER,
  scope TEXT,                                         -- class | group
  group_id INTEGER, section_id INTEGER,
  url TEXT, title TEXT, kind TEXT,                    -- DRIVE|SHEET|DOCX|PDF|WEB
  tag TEXT,                                           -- bai | buoi | lop
  created_by INTEGER, created_at TEXT DEFAULT (datetime('now')), removed_at TEXT
);
CREATE INDEX ix_links_scope ON links(cohort_id, scope, group_id);

-- ══ Quỹ ══
CREATE TABLE fund_rounds (
  id INTEGER PRIMARY KEY, cohort_id INTEGER,
  scope TEXT NOT NULL,            -- class | group
  group_id INTEGER,               -- bắt buộc khi scope='group', NULL khi scope='class'
  title TEXT NOT NULL, purpose TEXT,
  amount INTEGER NOT NULL,        -- VND / người
  bank_bin TEXT NOT NULL,         -- mã ngân hàng VietQR, vd '970422'
  bank_name TEXT, account_no TEXT NOT NULL, account_name TEXT,
  collector_member_id INTEGER,    -- người thu, người duy nhất xác nhận được
  syntax_template TEXT DEFAULT '{TEN} N{NHOM}',
  opens_on TEXT, closes_on TEXT,
  status TEXT DEFAULT 'draft',    -- draft | open | closed
  created_by INTEGER, created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE fund_declarations (
  id INTEGER PRIMARY KEY, round_id INTEGER, member_id INTEGER,
  declared_at TEXT, note TEXT,
  verified_by INTEGER, verified_at TEXT,              -- chỉ collector
  UNIQUE(round_id, member_id)
);

-- ══ Hoạt động và đăng nhập ══
CREATE TABLE activity (
  id INTEGER PRIMARY KEY, cohort_id INTEGER, group_id INTEGER,
  actor_member_id INTEGER, verb TEXT, object_type TEXT, object_id INTEGER,
  summary TEXT, created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX ix_activity_group_time ON activity(group_id, created_at DESC);

CREATE TABLE invites (
  id INTEGER PRIMARY KEY, member_id INTEGER,
  token_hash TEXT UNIQUE, expires_at TEXT, used_at TEXT, created_by INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX ix_invites_member ON invites(member_id);

CREATE TABLE sessions (
  id INTEGER PRIMARY KEY, member_id INTEGER,
  token_hash TEXT UNIQUE, created_at TEXT DEFAULT (datetime('now')), expires_at TEXT, user_agent TEXT
);
CREATE INDEX ix_sessions_member ON sessions(member_id);

CREATE TABLE credentials (                            -- passkey, đợt 3
  id INTEGER PRIMARY KEY, member_id INTEGER,
  credential_id TEXT UNIQUE, public_key BLOB,
  sign_count INTEGER, label TEXT, created_at TEXT DEFAULT (datetime('now')), last_used_at TEXT
);

CREATE TABLE audit_log (
  id INTEGER PRIMARY KEY, actor_member_id INTEGER, action TEXT,
  target_type TEXT, target_id INTEGER, before_json TEXT, after_json TEXT,
  ip TEXT, created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX ix_audit_target ON audit_log(target_type, target_id);

-- ─────────────────────────────────────────────────────────────
-- 0002_seed_roster.sql
-- ─────────────────────────────────────────────────────────────
-- Sinh tự động bởi scripts/import-roster.mjs từ "0e26cba3-Final_Danh_sa_ch_ky__K03_15.08.xlsx"
-- Chạy lại khi có danh sách mới: npm run import:roster -- <file.xlsx>

INSERT INTO cohorts (code, name, starts_on, ends_on, defense_on, sessions_total) VALUES
  ('K03', 'Giám đốc điều hành doanh nghiệp K03 (VCCI x Đại học Andrews)', '2026-08-15', '2026-09-26', '2026-09-26', 13);

INSERT INTO groups (cohort_id, no, label, status) VALUES
  ((SELECT id FROM cohorts WHERE code = 'K03'), 1, 'Nhóm 1', 'unclaimed'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 2, 'Nhóm 2', 'unclaimed'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 3, 'Nhóm 3', 'unclaimed'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 4, 'Nhóm 4', 'unclaimed'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 5, 'Nhóm 5', 'unclaimed'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 6, 'Nhóm 6', 'unclaimed'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 7, 'Nhóm 7', 'unclaimed'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 8, 'Nhóm 8', 'unclaimed'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 9, 'Nhóm 9', 'unclaimed'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 10, 'Nhóm 10', 'unclaimed');

INSERT INTO roster (cohort_id, seq, group_label, full_name, dob, title, company, address, phone, source) VALUES
  ((SELECT id FROM cohorts WHERE code = 'K03'), 1, 'Nhóm 1', 'Nguyễn Văn Khải', '1966', 'Tổng Giám Đốc', 'Công ty Cổ phần Thương mại Dược VTYT Khải Hà', 'Số 2A, Phố Lý Bôn, phường Thái Bình, tỉnh Hưng Yên', '0979755857', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 2, 'Nhóm 1', 'Nguyễn Thị Phượng', '09/05/1990', 'Tổng Giám Đốc', 'Công ty Cổ phần Hữu Nghị Xuân Cương', 'Trung tâm dịch vụ Hữu Nghị Xuân Cương, Cửa khẩu Quốc tế Hữu Nghị, Xã Đồng Đăng, Tỉnh Lạng Sơn', '0973836585', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 3, 'Nhóm 1', 'Trần Thị Hòa', '21/12/1983', 'Thành viên hộ kinh doanh', 'Hộ kinh doanh Bếp AHF', 'Phòng C0806, HH2C, Khu đô thị mới Dương Nội, phường Yên Nghĩa, Hà Nội', '0941416979', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 4, 'Nhóm 1', 'Trần Thị Thu Cúc', '1981', 'Kế toán trưởng công ty thành viên', 'Công ty CP Đầu tư Phát triển nhà Constrexim', 'Tầng 6, tòa nhà Golden Park, số 2, phố Phạm Văn Bạch, phường Cầu Giấy, Hà Nội', '0913030324', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 5, 'Nhóm 1', 'Nguyễn Thị Quỳnh', '16/09/1985', 'Giám Đốc', 'Công ty Cổ phần ADUMI Việt', 'A01-L06, Khu A, KĐTM Dương Nội, phường Dương Nội, Hà Nội', '0816271927', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 6, 'Nhóm 1', 'Ngô Văn Hòa', '04/03/1979', 'Thành viên HĐQT', 'Công ty CP Sản Xuất và Thương Mại Nội Địa Hóa Ô Tô 1- 5', 'Đường Uy Nỗ, Xã Thư Lâm, Thành phố Hà Nội', '0988507279', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 7, 'Nhóm 1', 'Vũ Long Biên', '11/10/1984', 'Giám Đốc', 'Công ty TNHH Leadership & Sustainability', 'Số 1A ngõ 26, đường Tân Thịnh, tổ 10, phường Quyết Thắng, tỉnh Thái Nguyên, Việt Nam', '0968469000', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 8, 'Nhóm 1', 'Nguyễn Thanh Bình', '10/05/1975', 'Giám đốc Nhân sự', 'Công ty cổ phần công nghệ -Viễn thông ELCOM', NULL, NULL, 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 9, 'Nhóm 1', 'Lê Thị Thu Trang', '15/06/1983', 'Chánh văn phòng', 'CTCP Stavian Hóa Chất', NULL, NULL, 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 10, 'Nhóm 1', 'Đinh Thị Giang', '06/04/1976', 'Trưởng Ban Hành chính nhân sự', 'CTCP Stavian Sản xuất Công nghiệp', NULL, NULL, 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 11, 'Nhóm 1', 'Bùi Xuân Luận', '1994', 'Giám đốc', 'Công ty cổ phần công nghệ TECOVA', '145 Ngọc Hồi, Yên Sở, Hà Nội', '0987739894', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 12, 'Nhóm 1', 'Nguyễn Khắc Dũng', NULL, 'Giám đốc Nhà máy', 'CÔNG TY CỔ PHẦN STAVIAN BAO BÌ HƯNG YÊN', NULL, NULL, 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 13, 'Nhóm 2', 'Man Thị Kim Liên', '1986', 'Trưởng phòng bán hàng', 'Công ty TNHH Sungwoo vina', 'Khu Công Nghiệp Thuận Thành 3, Trí Quả, Bắc Ninh', '0976911081', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 14, 'Nhóm 2', 'Dương Văn Thương', '1986', 'CEO', 'Công ty Cổ Phần The Best Wine', '115 Xuân Quỳnh, phường Yên Hòa, Hà Nội', '0988393000', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 15, 'Nhóm 2', 'Phạm Quang Hưng', '1977', 'Kế toán trưởng công ty mẹ', 'Công ty CP Đầu tư Phát triển nhà Constrexim', 'Tầng 6, tòa nhà Golden Park, số 2, phố Phạm Văn Bạch, phường Cầu Giấy, Hà Nội', '0982174121', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 16, 'Nhóm 2', 'Nguyễn Anh Tú', '01/11/1999', 'Leader', 'Công ty TNHH THETA UNIVERSE MEDIA', 'Tầng 2 Tòa nhà LND Galaxy, Số 3 Đường Galaxy 6, phường Hà Đông, Hà Nội, Việt Nam', '0334906765', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 17, 'Nhóm 2', 'Hoàng Thám Hoa', '06/06/1979', 'Thành viên HĐQT', 'Công ty CP Sản Xuất và Thương Mại Nội Địa Hóa Ô Tô 1- 5', 'Đường Uy Nỗ, Xã Thư Lâm, Thành phố Hà Nội', '0364006679', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 18, 'Nhóm 2', 'Nguyễn Thị Kiều Anh', '1994', 'Giám đốc', 'Công ty Cổ phần Thương mại Dược VTYT Khải Hà', 'Số 2A, Phố Lý Bôn, phường Thái Bình, tỉnh Hưng Yên', '0368186363', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 19, 'Nhóm 2', 'Giang Quốc Ân', '17/01/1986', 'Phó TGĐ', 'Công ty Cổ phần Đầu tư và Công nghệ HTI (HTI Group)', 'Tầng 15-VP2, Tòa nhà Sun Square, số 21 Lê Đức Thọ, phường Từ Liêm, Thành phố Hà Nội', '0915171986', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 20, 'Nhóm 2', 'Trần Văn Điển', '12/08/1987', 'Phó Tổng Giám Đốc', 'Công ty Cổ phần Hữu Nghị Xuân Cương', 'Trung tâm dịch vụ Hữu Nghị Xuân Cương, Cửa khẩu Quốc tế Hữu Nghị, Xã Đồng Đăng, Tỉnh Lạng Sơn', '0987421123', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 21, 'Nhóm 2', 'Trần Huy Tùng', '02/10/1983', 'Giám đốc trung tâm R&D', 'Công ty cổ phần công nghệ -Viễn thông ELCOM', NULL, NULL, 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 22, 'Nhóm 2', 'Trần Duy Hưng', '21/12/1989', 'Trợ lý Chủ tịch HĐQT', 'CTCP Stavian Hóa Chất', NULL, NULL, 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 23, 'Nhóm 2', 'Phương Thanh Vũ', '14/01/1982', 'Trưởng ban Nghiên cứu và phát triển', 'CTCP Stavian Sản xuất Công nghiệp', NULL, NULL, 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 24, 'Nhóm 2', 'Đỗ Văn Lương', '29/08/1976', 'Phó Giám đốc Nhà máy', 'CÔNG TY CỔ PHẦN STAVIAN BAO BÌ HƯNG YÊN', NULL, NULL, 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 25, 'Nhóm 2', 'Vũ Thị Kim Liên', '05/09/1974', 'Giám Đốc', 'Công ty TNHH GROWTH Việt Nam', '493 Kim Ngưu, Vĩnh Tuy, Hà Nội', '0983742998', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 26, 'Nhóm 3', 'Phạm Hồng Đức', '20/06/1985', 'CT HĐQT', 'Công ty cổ phần tập đoàn địa ốc Golden Land', 'Tầng 3, tòa nhà SDU, số 163 đường Trần Phú, Hà Đông, Hà Nội', '0357277777', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 27, 'Nhóm 3', 'Chử Minh Châu', '27/10/1970', 'Phó Tổng Giám Đốc', 'Công ty CP Sản Xuất và Thương Mại Nội Địa Hóa Ô Tô 1- 5', 'Đường Uy Nỗ, Xã Thư Lâm, Thành phố Hà Nội', '0972182598', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 28, 'Nhóm 3', 'Bùi Thị Thanh Huyền', '1976', 'Phó Tổng Giám Đốc', 'Công ty CP Đầu tư Phát triển nhà Constrexim', 'Tầng 6, tòa nhà Golden Park, số 2, phố Phạm Văn Bạch, phường Cầu Giấy, Hà Nội', '0988754276', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 29, 'Nhóm 3', 'Đỗ Thị Định', '28/11/1985', 'Leader', 'Công ty TNHH THETA UNIVERSE MEDIA', 'Tầng 2 Tòa nhà LND Galaxy, Số 3 Đường Galaxy 6, phường Hà Đông, Hà Nội, Việt Nam', '0963026563', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 30, 'Nhóm 3', 'Lê Thị Thanh Hòa', '1984', 'Phó Giám Đốc', 'Công ty Cổ phần Thương mại Dược VTYT Khải Hà', 'Số 2A, Phố Lý Bôn, phường Thái Bình, tỉnh Hưng Yên', '0984958809', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 31, 'Nhóm 3', 'Trần Thị Thu Trang', '03/02/1982', 'Phó TGĐ HTI Scientific', 'Công ty Cổ phần Đầu tư và Công nghệ HTI', 'Tầng 15-VP2, Tòa nhà Sun Square, số 21 Lê Đức Thọ, phường Từ Liêm, Thành phố Hà Nội', '0962429986', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 32, 'Nhóm 3', 'Nguyễn Thị My Hương', '03/03/1993', 'Phó Tổng Giám Đốc', 'Công ty Cổ phần Hữu Nghị Xuân Cương', 'Trung tâm dịch vụ Hữu Nghị Xuân Cương, Cửa khẩu Quốc tế Hữu Nghị, Xã Đồng Đăng, Tỉnh Lạng Sơn', '0986888946', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 33, 'Nhóm 3', 'Nguyễn Thị Kim Oanh', '28/12/1984', 'Giám đốc công ty con', 'Công ty cổ phần công nghệ -Viễn thông ELCOM', NULL, NULL, 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 34, 'Nhóm 3', 'Nguyễn Kiều Oanh', '13/11/1978', 'Phó Giám đốc Phòng Dịch vụ hành chính', 'CTCP Stavian Hóa Chất', NULL, NULL, 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 35, 'Nhóm 3', 'Trần Thu Thùy', '24/03/1989', 'Phó Ban Marketing', 'CTCP Stavian Sản xuất Công nghiệp', NULL, NULL, 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 36, 'Nhóm 3', 'Chu Anh Tuấn', '02/08/1983', 'Phó Giám đốc Nhà máy', 'CÔNG TY CỔ PHẦN STAVIAN BAO BÌ HƯNG YÊN', NULL, NULL, 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 37, 'Nhóm 3', 'Trần Bá Dũng', '1979', 'Phó Giám Đốc', 'Công ty Cổ phần Quản lý hàng hóa thế giới xanh', '79 Bằng Liệt, phường Hoàng Liệt, Hà Nội', '0966166289', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 38, 'Nhóm 3', 'Tạ Thị Thanh', '13/09/1995', 'Chủ doanh nghiệp', 'Công ty Cổ phần Lương Thực An Thịnh Phát', 'Số 50, liền kề 02, Khu đô thị Tân Tây Đô, Đan Phượng, Hà Nội', '0961601801', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 39, 'Nhóm 4', 'Đặng Văn Khải', '1976', 'Phó Tổng Giám Đốc', 'Công ty CP Đầu tư Phát triển nhà Constrexim', 'Tầng 6, tòa nhà Golden Park, số 2, phố Phạm Văn Bạch, phường Cầu Giấy, Hà Nội', '0903210135', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 40, 'Nhóm 4', 'Trịnh Thái Thường', '28/12/1985', 'Giám đốc vận hành', 'Công ty cổ phần công nghệ -Viễn thông ELCOM', NULL, NULL, 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 41, 'Nhóm 4', 'Trương Duy Thanh', '29/04/1996', 'CEO', 'Công ty Cổ phần Quốc tế ANVY', 'Tòa S202, Khu đô thị Vinhomes Ocean Park, Gia Lâm, Hà Nội', '0963976617', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 42, 'Nhóm 4', 'Nguyễn Ngọc Minh', '06/12/2000', 'Leader', 'Công ty TNHH THETA UNIVERSE MEDIA', 'Tầng 2 Tòa nhà LND Galaxy, Số 3 Đường Galaxy 6, phường Hà Đông, Hà Nội, Việt Nam', '0335280116', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 43, 'Nhóm 4', 'Nguyễn Thị Mai Nga', '10/07/1996', 'Phòng PTTT', 'Công ty CP Sản Xuất và Thương Mại Nội Địa Hóa Ô Tô 1- 5', 'Đường Uy Nỗ, Xã Thư Lâm, Thành phố Hà Nội', '0866626279', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 44, 'Nhóm 4', 'Hà Thị Tuyết Mai', '1989', 'Giám Đốc nhà máy', 'Công ty Cổ phần Thương mại Dược VTYT Khải Hà', 'Số 2A, Phố Lý Bôn, phường Thái Bình, tỉnh Hưng Yên', '0973793167', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 45, 'Nhóm 4', 'Tạ Ngọc Thanh', '25/08/1986', 'GĐ Cty HTI UAS', 'Công ty Cổ phần Đầu tư và Công nghệ HTI', 'Tầng 15-VP2, Tòa nhà Sun Square, số 21 Lê Đức Thọ, phường Từ Liêm, Thành phố Hà Nội', '0906250886', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 46, 'Nhóm 4', 'Mai Thị Huệ', '22/04/1981', 'Phó Tổng Giám Đốc', 'Công ty Cổ phần Hữu Nghị Xuân Cương', 'Trung tâm dịch vụ Hữu Nghị Xuân Cương, Cửa khẩu Quốc tế Hữu Nghị, Xã Đồng Đăng, Tỉnh Lạng Sơn', '0983224686', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 47, 'Nhóm 4', 'Tạ Duy Hưng', '27/07/1993', 'Giám đốc dự án', 'CTCP Stavian Hóa Chất', NULL, NULL, 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 48, 'Nhóm 4', 'Nguyễn Nho Huân', '04/02/1990', 'Trưởng phòng sản xuất', 'CTCP Stavian Sản xuất Công nghiệp', NULL, NULL, 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 49, 'Nhóm 4', 'Phạm Đăng Đề', '04/02/1975', 'Phó Giám đốc Nhà máy', 'CÔNG TY CỔ PHẦN STAVIAN BAO BÌ HƯNG YÊN', NULL, NULL, 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 50, 'Nhóm 4', 'Nguyễn Văn Huy', '25/10/1981', 'Giám Đốc', 'Công ty TNHH KDTM Đức Huy Intech', 'Số 19, ngõ 179.169 tổ 28 phố Vĩnh Hưng, phường Vĩnh Hưng, Hà Nội', '0968623881', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 51, 'Nhóm 4', 'Nguyễn Trung Đức', '1990', 'BOM Business Development', 'Công ty Cổ phần Trường học Công nghê MINDX', '71 Nguyễn Chí Thanh, phường Giảng Võ, Hà Nội', '0946391896', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 52, 'Nhóm 5', 'Đào Văn Duy', '05/09/1986', 'Giám Đốc', 'Công ty CP Starpoly', NULL, NULL, 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 53, 'Nhóm 5', 'Bùi Đức Mạnh', '22/07/1993', 'Phó Giám Đốc', 'CÔNG TY TNHH THƯƠNG MẠI TỔNG HỢP TIẾN THÀNH', 'Km2+900, Đại Lộ Trần Hưng Đạo, Phường Cam Đường, Tỉnh Lào Cai', '0856566666', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 54, 'Nhóm 5', 'Kiều Đăng Tiến', '1986', 'Phụ trách VP công ty', 'Công ty CP Đầu tư Phát triển nhà Constrexim', 'Tầng 6, tòa nhà Golden Park, số 2, phố Phạm Văn Bạch, phường Cầu Giấy, Hà Nội', '0964600555', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 55, 'Nhóm 5', 'Phạm Tố Quyên', '07/03/1990', 'Giám Đốc', 'Công ty TNHH MTV LÊ GIA THÀNH CÔNG', '345 Đội Cấn, phường Ba Đình, Hà Nội', '0985070390', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 56, 'Nhóm 5', 'Đỗ Thị Thương', '20/10/1989', 'Leader', 'Công ty TNHH THETA UNIVERSE MEDIA', 'Tầng 2 Tòa nhà LND Galaxy, Số 3 Đường Galaxy 6, phường Hà Đông, Hà Nội, Việt Nam', '0989136311', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 57, 'Nhóm 5', 'Nguyễn Thành Công', '26/03/1979', 'Trợ lý ban giám đốc', 'Công ty CP Sản Xuất và Thương Mại Nội Địa Hóa Ô Tô 1- 5', 'Đường Uy Nỗ, Xã Thư Lâm, Thành phố Hà Nội', '0986004333', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 58, 'Nhóm 5', 'Cao Phương Thảo', '29/10/1995', 'Phó Giám Đốc', 'Công ty Cổ phần thiết bị nghe nhìn Việt Anh Audio', 'Xóm 3, Đồng Nhân, An Khánh, Hà Nội', '0946706710', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 59, 'Nhóm 5', 'Hoàng Thị Mùi', '21/03/1983', 'Phó Giám Đốc', 'CÔNG TY TNHH HÒA BÌNH', 'tổ dân phố Nguyễn Thái Học 15, phường Yên Bái, tỉnh Lào Cai', '0913565737', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 60, 'Nhóm 5', 'Phạm Tuấn Hoàng', '11/07/1990', 'Giám Đốc', 'Công ty Cổ phần Hữu Nghị Xuân Cương', 'Trung tâm dịch vụ Hữu Nghị Xuân Cương, Cửa khẩu Quốc tế Hữu Nghị, Xã Đồng Đăng, Tỉnh Lạng Sơn', '0919235678', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 61, 'Nhóm 5', 'Đậu Thị Lý', '08/12/1988', 'Kế toán trưởng', 'Công ty cổ phần công nghệ -Viễn thông ELCOM', NULL, NULL, 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 62, 'Nhóm 5', 'Cao Văn Hách', '20/11/1979', 'Phó Tổng Giám Đốc', 'CTCP Stavian Hóa Chất', NULL, NULL, 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 63, 'Nhóm 5', 'Nguyễn Quang Huy', '09/04/1990', 'Trợ lý Hội đồng Quản trị', 'CTCP Stavian Sản xuất Công nghiệp', NULL, NULL, 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 64, 'Nhóm 5', 'Nguyễn Thị Quỳnh Hương', '1992', 'Student Success Leader', 'Công ty Cổ phần Trường học Công nghê MINDX', '72 Nguyễn Chí Thanh, phường Giảng Võ, Hà Nội', '0836866789', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 65, 'Nhóm 5', 'Lưu Minh Tiến', '19/08/1987', 'Chủ tịch', 'Công ty Cổ phần Solar Electric Việt Nam', 'Số B13 KĐT Trung Hòa Nhân Chính, phường Yên Hòa, Hà Nội', '0914544449', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 66, 'Nhóm 6', 'Nguyễn Thị Thu Hương', '13/07/1991', 'Giám đốc Tài chính', 'Công Ty Cổ Phần Maruni Quốc Tế', NULL, NULL, 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 67, 'Nhóm 6', 'Phan Thị Thanh Nga', '17/03/1979', 'Trưởng VPĐD', 'VP Đại diện Công ty cổ phần Excel Creates', 'Phòng C3, tầng 11, Tòa nhà CDC, 25 Lê Đại Hành, phường Hai Bà Trưng, Hà Nội', '0985981808', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 68, 'Nhóm 6', 'Nguyễn Thị Anh Lài', '13/09/1990', 'CEO', 'Công Ty Cổ Phần Kinh Doanh và Thương mại Mylax', '28 Nguyễn Gia Thiều, phường Cửa Nam, Hà Nội', '0965133751', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 69, 'Nhóm 6', 'Nguyễn Thu Mai', '09/08/1980', 'Giám Đốc', 'Công ty TNHH TM & SX Hùng Mạnh MelyFarm', 'Mường Lò, Đường Hoa Ban, Tổ 12, Phường Nghĩa Lộ, Tỉnh Lào Cai', '0949039399', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 70, 'Nhóm 6', 'Vũ Thị Thu Hoài', '26/11/1983', 'Giám đốc điều hành', 'Công ty Cổ phần đầu tư và Công nghệ Y tế Hà Nội', '649/77/77 Đ. Lĩnh Nam, Vĩnh Hưng, Hà Nội', '0904871239', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 71, 'Nhóm 6', 'Ngô Phú Cường', '26/03/1977', 'Giám Đốc', 'Công ty Cổ phần Hữu Nghị Xuân Cương', 'Trung tâm dịch vụ Hữu Nghị Xuân Cương, Cửa khẩu Quốc tế Hữu Nghị, Xã Đồng Đăng, Tỉnh Lạng Sơn', '0909088838', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 72, 'Nhóm 6', 'Bùi Thị Huyền Trang', '07/01/1987', 'Managing Director', 'Nano Technologies', NULL, NULL, 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 73, 'Nhóm 6', 'Trần Hoàng Hà', '11/05/1993', 'COO Công ty con', 'Công ty cổ phần công nghệ -Viễn thông ELCOM', NULL, NULL, 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 74, 'Nhóm 6', 'Đào Hồng Luật', '21/04/1985', 'Trưởng phòng HCNS', 'CTCP Stavian Hóa Chất', NULL, NULL, 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 75, 'Nhóm 6', 'Khương Quốc Chung', '20/11/1987', 'Giám đốc dự án thiết bị y tế', 'CTCP Stavian Sản xuất Công nghiệp', NULL, NULL, 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 76, 'Nhóm 6', 'Lê Trung Đức', '09/03/1998', 'Cửa hàng trưởng', 'CÔNG TY TNHH THƯƠNG MẠI TỔNG HỢP TIẾN THÀNH', 'Km2+900, Đại Lộ Trần Hưng Đạo, Phường Cam Đường, Tỉnh Lào Cai', '098778525', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 77, 'Nhóm 6', 'Phạm Thế Nam', '09/11/1989', 'Giám Đốc', 'Công ty TNHH Xây dựng và Phát triển quốc tế Bảo Châu', 'Văn phòng số 122 đường Bạch Thái Bưởi, phường Gia Viên, Hải Phòng', '0789267999', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 78, 'Nhóm 6', 'Nguyễn Hoàng Anh', '15/07/1986', 'Giám Đốc', 'Công ty TNHH Kiến trúc & Nội thất IMA Việt Nam', 'Tầng 8, số 164 ngõ Xã Đàn 2, Đống Đa, Hà Nội', '0914622286', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 79, 'Nhóm 6', 'Lê Thị Bích Liên', '13/10/1978', 'Chánh VP HĐQT', 'Alphanam Group', NULL, NULL, 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 80, 'Nhóm 7', 'Lê Thanh Phú', '03/02/1987', 'CEO - Founder', 'Công ty TNHH Đầu tư & Phát triển Công nghệ PHÚ THỊNH PHÁT', 'Tổ dân phố 1, phường Sông Trí, tỉnh Hà Tĩnh', '0912262777', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 81, 'Nhóm 7', 'Nghiêm Thị Chung', '16/05/1984', 'Phó TGĐ', 'Công ty Cổ phần Đầu tư và Công nghệ HTI (HTI Group)', 'Tầng 15-VP2, Tòa nhà Sun Square, số 21 Lê Đức Thọ, phường Từ Liêm, Thành phố Hà Nội', '0983398930', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 82, 'Nhóm 7', 'Phạm Thùy Linh', '27/07/1981', 'Giám đốc chuyên môn', 'Trung tâm Xét nghiệm Green Lab - Công ty Cổ phần đầu tư và Công nghệ Y tế Hà Nội', '649/77/77 Đ. Lĩnh Nam, Vĩnh Hưng, Hà Nội', '0936212213', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 83, 'Nhóm 7', 'Nguyễn Hoàng Dương', '09/08/2000', 'Trợ lý Ban giám đốc', 'Công ty Cổ phần Hữu Nghị Xuân Cương', 'Trung tâm dịch vụ Hữu Nghị Xuân Cương, Cửa khẩu Quốc tế Hữu Nghị, Xã Đồng Đăng, Tỉnh Lạng Sơn', '0962858188', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 84, 'Nhóm 7', 'Vũ Thị Ngân Hà', '26/06/1979', 'Chánh VP HĐQT', 'Công ty cổ phần công nghệ -Viễn thông ELCOM', NULL, NULL, 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 85, 'Nhóm 7', 'Nguyễn Thành Trung', '15/02/1980', 'Trưởng bộ phận Kỹ thuật Công nghệ', 'CTCP Stavian Sản xuất Công nghiệp', NULL, NULL, 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 86, 'Nhóm 7', 'Tô Thị Mến', '27/05/1983', 'Phó Giám Đốc', 'Công ty TNHH Thiết bị Y tế Hamemy', 'Số 29, ngách 14/3, ngõ 14 Phố Pháo Đài Láng, phường Láng, Hà Nội', '0984025870', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 87, 'Nhóm 7', 'Bùi Văn Nghiêm', '09/10/1997', 'Trường phòng', 'Công ty TNHH Kiến trúc & Nội thất IMA Việt Nam', 'Tầng 8, số 164 ngõ Xã Đàn 2, Đống Đa, Hà Nội', '0971491931', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 88, 'Nhóm 7', 'Nguyễn Tuấn Long', '20/03/1976', 'Phó Tổng Giám đốc', 'CTCP Stavian VP Tây Ninh', NULL, NULL, 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 89, 'Nhóm 7', 'Phạm Quý Hưng', '25/08/2003', 'Trưởng phòng R&D', 'Công ty Cổ phần ABC Việt Nam', NULL, NULL, 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 90, 'Nhóm 7', 'Bùi Chí Hướng', '2000', 'TP Kinh Doanh', 'Công ty TNHH thiết bị và kết cấu Bảo Sơn', 'Thôn Quảng Hội, xã Nội Bài, Hà Nội', '0338559513', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 91, 'Nhóm 7', 'Hoàng Đình Anh', '22/02/1990', 'Tổng Giám Đốc', 'CÔNG TY CỔ PHẦN BẤT ĐỘNG SẢN SGO THE BEST LAND', 'Tầng 2, TTTM HPC Landmark 105, đường Tố Hữu, phường Hà Đông, thành phố Hà Nội, Việt Nam', '0979012298', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 92, 'Nhóm 8', 'Nguyễn Bảo Kiên', '1977', 'Tổng Giám đốc', 'CTCP Khu công nghiệp Stavian Thái Nguyên', NULL, NULL, 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 93, 'Nhóm 8', 'Hoàng Thị Thu Hiền', '14/08/1984', 'Phó Tổng Giám đốc Thường trực', 'CÔNG TY CỔ PHẦN OPL LOGISTICS', NULL, NULL, 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 94, 'Nhóm 8', 'Hà Thị Tuyết', '13/10/1984', 'Giám Đốc', 'Công ty Luật TNHH Dịch vụ pháp lý 4.0', 'Khu dân cư số 9, ngõ 100 Đường Minh Cầu, phường Phan Đình Phùng, tỉnh Thái Nguyên', '0912681234', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 95, 'Nhóm 8', 'Đậu Huy Đại', '09/10/2007', 'Marketing', '(Tự do)', NULL, '0386696998', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 96, 'Nhóm 8', 'Đặng Thùy Dương', '09/05/1994', 'Giám Đốc', 'Công ty Cổ phần SUNPRIME GROUP', '101 Xuân Quỳnh, phường Yên Hòa, Hà Nội', '0399636855', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 97, 'Nhóm 8', 'Nguyễn Thị Tùng Vân', '27/03/1977', 'Chánh VP', 'Hiệp hội các tổ chức dịch vụ phát triển kinh doanh Việt Nam - VABSO', NULL, NULL, 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 98, 'Nhóm 8', 'Nguyễn Phan Minh Tâm', '05/05/2004', 'Trưởng phòng nhân sự', 'Công ty TNHH Kết nối chuyên nghiệp toàn cầu', 'Số 123 ngõ 554 Trường Chinh, phường Kim Liên, Hà Nội', '0362444568', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 99, 'Nhóm 8', 'Phạm Ngọc Anh', '27/05/1978', 'Giám Đốc', 'Công ty TNHH Xuất nhập khẩu phụ tùng AUTO', 'Số 52 Ngõ 42 Đường Xuân Khôi, Phường Long Biên, Hà Nội', '0927051978', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 100, 'Nhóm 8', 'Trần Thành Nhật', '1995', 'TP Kỹ Thuật', 'Công ty TNHH thiết bị và kết cấu Bảo Sơn', 'Thôn Quảng Hội, xã Nội Bài, Hà Nội', '0987752980', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 101, 'Nhóm 8', 'Hoàng Huyền Trang', '07/10/2000', 'CB P. Kinh doanh', 'CÔNG TY TNHH HÒA BÌNH', 'tổ dân phố Nguyễn Thái Học 15, phường Yên Bái, tỉnh Lào Cai', '0837365279', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 102, 'Nhóm 8', 'Lê Minh Tiến', NULL, 'Chủ tịch', 'Công ty Cổ phần SEI Enterprise', NULL, '0914544449', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 103, 'Nhóm 8', 'Đỗ Thanh Thanh Huyền', '31/07/1996', 'Giám Đốc', 'Công ty TNHH TQC CGLOBAL CENTER FOR SUSTAINABILITY', 'C10, Khu Pandora, số 53 phố Triều Khúc, Phường Thanh Liệt, Hà Nội', '0976916125', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 104, 'Nhóm 8', 'Phùng Thanh Quân', '22/06/1992', 'Phó phòng Kinh doanh Bột Giấy SPP', 'CTCP Stavian Giấy và Bột Giấy', NULL, NULL, 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 105, 'Nhóm 8', 'Nguyễn Thị Hằng Nhi', '1994', 'Giám đốc', 'Công ty cổ phần thương mại và dịch vụ MedGate', '79 Ngọc Hồi, Yên Sở, Hà Nội', '0373780212', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 106, 'Nhóm 9', 'Lê Thị Huế', '03/09/1977', 'Chủ tịch Công ty', 'Công ty TNHH Dược phẩm Bách Thông', 'Số 5 ngõ 9 Nguyễn Văn Linh, phường Việt Hưng, Hà Nội', '0947516888', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 107, 'Nhóm 9', 'Hoàng Thị Lương', '18/11/1984', 'GĐ Nhân sự', 'Công ty cổ phần đầu tư công nghệ Tiên Phong', 'Số 23 lô 4A đường Trung Yên 10. phường Yên Hòa, Hà Nội', '0986427437', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 108, 'Nhóm 9', 'Nguyễn Thị Thùy Dung', '21/12/1982', 'Phó Tổng Giám Đốc', 'công ty Cổ phần Tập đoàn Dược phẩm và Thương mại SOHACO', NULL, '0932278997', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 109, 'Nhóm 9', 'Lê Thanh Yên', NULL, 'Senior Manager', 'Công ty TNHH Shimadzu Vietnam', 'Detech Building, 8 Tôn Thất Thuyết, Cầu Giấy, Hà Nội', '0989199123', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 110, 'Nhóm 9', 'Mai Mậu Thành', '22/07/1985', 'Phó Tổng Giám đốc', 'CTCP Kim loại Công nghiệp Stavian', NULL, NULL, 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 111, 'Nhóm 9', 'Phan Thị Thanh Nga', '17/03/1979', 'Trưởng VPĐD', 'VP Đại diện Công ty cổ phần Excel Creates', 'Phòng C3, tầng 11, Tòa nhà CDC, 25 Lê Đại Hành, phường Hai Bà Trưng, Hà Nội', '0985981808', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 112, 'Nhóm 9', 'Đinh Khánh Toàn', NULL, NULL, 'Công ty TNHH TQC CGLOBAL CENTER FOR SUSTAINABILITY', 'C10, Khu Pandora, số 53 phố Triều Khúc, Phường Thanh Liệt, Hà Nội', NULL, 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 113, 'Nhóm 9', 'Phùng Thạch Lâm', '2008', 'Nhân viên kinh doanh', 'Hợp tác xã nông nghiệp và sản xuất Khánh Lâm', 'Thôn Đông Hữu, Xã Vật Lại, Thành phố Hà Nội', '0918243687', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 114, 'Nhóm 9', 'Vũ Văn Trang', '18/07/1984', 'Phó Tổng Giám đốc', 'CTCP Khí Stavian', NULL, NULL, 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 115, 'Nhóm 9', 'Nguyễn Minh Tưởng', '25/10/1981', 'Phó Tổng Giám đốc', 'CÔNG TY CỔ PHẦN OPL LOGISTICS', NULL, NULL, 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 116, 'Nhóm 9', 'Đinh Văn Hải', '27/05/1981', 'Giám Đốc', 'Công ty TNHH Thiết bị Y tế Hamemy', 'Số 29, ngách 14/3, ngõ 14 Phố Pháo Đài Láng, phường Láng, Hà Nội', '0979852956', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 117, 'Nhóm 9', 'Thiều Thị Hường', '18/10/1986', 'Giám đốc', 'Công ty Đào Tạo và kiến tạo Nội Thất Thiều Hường', '27/401 Cổ Nhuế, Đông Ngạc, Hà Nội', '0966988980', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 118, 'Nhóm 9', 'Hoàng Thanh Hà', '13/07/1988', 'Quản lý', 'Công ty Cổ phần Tư vấn & Dịch vụ Đổi mới khí hậu KLINOVA', 'số 41, ngách 622/14, đường Minh Khai, phường Vĩnh Tuy, Hà Nội', '0983281307', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 119, 'Nhóm 9', 'Đỗ Ngọc Hân', '09/06/1994', NULL, NULL, NULL, NULL, 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 120, 'Nhóm 9', 'Nguyễn Thị Kim Thanh', '1990', 'GĐKD', 'Công ty TNHH TM và DV In nhanh sức mạnh số', 'Số 26 ngách 445 ngõ 192 Lê Trọng Tấn, Phường Định Công, Hà Nội.', '0824193986', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 121, 'Nhóm 10', 'Trần Thị Thủy', NULL, 'Phó Tổng Giám Đốc', 'Công ty CP Tà Lùng Quang Minh', '29 Lê Duẩn, phường Bãi Cháy, tỉnh Quảng Ninh', NULL, 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 122, 'Nhóm 10', 'Đỗ Thị Thu', '22/08/1988', 'Giám Đốc', 'Công ty TNHH THETA UNIVERSE MEDIA', 'Tầng 2 Tòa nhà LND Galaxy, Số 3 Đường Galaxy 6, phường Hà Đông, Hà Nội, Việt Nam', '0972325168', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 123, 'Nhóm 10', 'Phạm Quang Đán', '1998', 'Phó Giám Đốc', 'Công ty TNHH TMDV Boom Logistics', 'Lô 126-N9 khu đô thị Vườn Hồng, phường Hải An, Hải Phòng', '0793204398', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 124, 'Nhóm 10', 'Nguyễn Thị Linh', '06/06/1996', 'Trợ lý Hội đồng Quản trị', 'CTCP Kim loại Công nghiệp Stavian', NULL, NULL, 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 125, 'Nhóm 10', 'Nguyễn Minh Sỹ', '18/11/1972', 'Phó TGĐ', 'Công ty TNHH Kiểm toán KDG Việt Nam', 'Tầng 4 nhà C, số 125 Hoàng Văn Thái, Phương Liệt, Hà Nội', '0986066670', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 126, 'Nhóm 10', 'Lâm Ngọc Thảo', '21/02/1991', 'Phó Tổng Giám đốc', 'CTCP Stavian Giấy và Bột Giấy', NULL, NULL, 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 127, 'Nhóm 10', 'Nguyễn Diệu Hiền', '1984', 'Tổng Giám đốc', 'Công ty TNHH TMDV QT Hiếu Phong', '125 Láng Hạ, phường Láng Hạ, Hà Nội', '0788088080', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 128, 'Nhóm 10', 'Phạm Tiến Dũng', '08/09/1984', 'Trưởng phòng', 'Trung tâm Văn hóa Doanh nhân - VCCI', 'Trung tâm Văn hóa Doanh nhân - VCCI', '0373030000', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 129, 'Nhóm 10', 'Phạm Thị Hoa', NULL, NULL, 'CTY TNHH KINH DOANH THUONG MAI DICH VU MINH NGOC', NULL, NULL, 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 130, 'Nhóm 10', 'Vũ Mạnh Thắng', '18/11/1981', 'Giám đốc', 'Công ty Cổ phần Home On', 'Số 45 Lô D6, KĐT Geleximco Lê Trọng Tấn, Dương Nội, Hà Nội', '0904508083', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 131, 'Nhóm 10', 'Nguyễn Thị Hải', NULL, 'Tổng Giám đốc', 'CTCP Công nghệ SICIX', NULL, NULL, 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 132, 'Nhóm 10', 'Lê Quốc Tuấn', '1994', 'TPKTSX', 'Công ty TNHH sản xuất thương mại tư vấn và dịch vụ cơ điện Lê Gia', 'Số 14, xóm 2, Nguyên Khê, Phúc Thịnh, Hà Nội', '0368071294', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 133, 'Nhóm 10', 'Vương Quốc Huy', '20/10/1992', 'Đồng sáng lập & Giám đốc kinh doanh', 'Công ty TNHH Hồ Shan Trà', 'Thôn Đát Tờ, xã Nghĩa Tâm, Lào Cai, Việt Nam', '0364393992', 'Ban tổ chức 15/8'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 134, 'Nhóm 10', 'Vũ Tuấn Anh', '27/11/1984', NULL, 'Công ty Cổ phần Thung Lũng Vân Hồ', 'CN1-7, khu công nghệ Minh Quang, Thượng Hồng, Hưng Yên', '0976790048', 'Ban tổ chức 15/8');

-- ─────────────────────────────────────────────────────────────
-- 0003_seed_group6.sql
-- ─────────────────────────────────────────────────────────────
-- k3vaceo — kích hoạt thật Nhóm 6 (14 người), khớp trạng thái k3vaceo-v2.html
-- Không sinh tự động — đây là hiểu biết thật về Nhóm 6 sau buổi họp 15/8, không
-- suy ra được từ file Excel. Chạy sau 0002_seed_roster.sql.

-- ── 1. Members: copy nguyên trạng từ roster, trừ vài ngoại lệ đã biết ──
-- Ngô Phú Cường đã tự xác nhận hồ sơ (chức vụ/đơn vị anh tự biên tập lại,
-- có email). Lê Trung Đức: roster giữ số điện thoại thô '098778525' (thiếu 1
-- số — xem scripts/import-report.md) nhưng KHÔNG copy số sai đó vào hồ sơ
-- thành viên; để trống chờ hỏi lại.
INSERT INTO members (cohort_id, group_id, roster_id, full_name, title, company, phone, email, claimed_at, is_active, created_at, updated_at)
SELECT
  r.cohort_id,
  (SELECT id FROM groups WHERE cohort_id = r.cohort_id AND no = 6),
  r.id,
  r.full_name,
  CASE WHEN r.full_name = 'Ngô Phú Cường' THEN 'Giám đốc' ELSE r.title END,
  CASE WHEN r.full_name = 'Ngô Phú Cường' THEN 'CTCP Hữu Nghị Xuân Cương' ELSE r.company END,
  CASE WHEN r.full_name = 'Lê Trung Đức' THEN NULL ELSE r.phone END,
  CASE WHEN r.full_name = 'Ngô Phú Cường' THEN 'cuong@xuancuong.vn' END,
  CASE WHEN r.full_name = 'Ngô Phú Cường' THEN '2026-08-23 09:00:00' END,
  1, datetime('now'), datetime('now')
FROM roster r
WHERE r.group_label = 'Nhóm 6'
  AND r.cohort_id = (SELECT id FROM cohorts WHERE code = 'K03');

-- ── 2. Nhóm 6 chuyển sang active, người nhận là Cường ──
UPDATE groups
SET status = 'active',
    claimed_by = (SELECT id FROM members WHERE full_name = 'Ngô Phú Cường' AND group_id = groups.id),
    claimed_at = '2026-08-23 09:00:00'
WHERE no = 6 AND cohort_id = (SELECT id FROM cohorts WHERE code = 'K03');

-- ── 3. Hồ sơ mở rộng của Cường (bán gì / bán cho ai / cần gì / giúp được gì) ──
INSERT INTO member_profile (member_id, sells_what, sells_to, needs, offers, updated_at, updated_by)
SELECT m.id,
  'Phần mềm quản trị và tự động hoá vận hành',
  'Doanh nghiệp sản xuất và logistics, 20–300 người',
  'Số liệu thị trường cho phần 1',
  'Dựng công cụ, xử lý dữ liệu, gỡ băng tự động',
  datetime('now'), m.id
FROM members m JOIN groups g ON g.id = m.group_id
WHERE g.no = 6 AND m.full_name = 'Ngô Phú Cường';

-- ── 4. Cơ cấu — giữ cả bản dự kiến lẫn bản thật, đúng cơ chế "lịch sử" ──
-- Dự kiến của Ban tổ chức (sheet "Trưởng, phó nhóm"), bị thay ngay trong buổi họp 15/8.
INSERT INTO officers (cohort_id, group_id, role, member_id, note, effective_from, recorded_by, created_at, superseded_at)
SELECT (SELECT id FROM cohorts WHERE code = 'K03'), g.id, 'truong_nhom',
  (SELECT id FROM members WHERE group_id = g.id AND full_name = 'Nguyễn Thị Thu Hương'),
  'danh sách dự kiến Ban tổ chức 15/8', '2026-08-15', NULL,
  '2026-08-15 08:00:00', '2026-08-15 18:00:00'
FROM groups g WHERE g.no = 6;

INSERT INTO officers (cohort_id, group_id, role, member_id, note, effective_from, recorded_by, created_at, superseded_at)
SELECT (SELECT id FROM cohorts WHERE code = 'K03'), g.id, 'pho_nhom',
  (SELECT id FROM members WHERE group_id = g.id AND full_name = 'Phan Thị Thanh Nga'),
  'danh sách dự kiến Ban tổ chức 15/8', '2026-08-15', NULL,
  '2026-08-15 08:00:00', '2026-08-15 18:00:00'
FROM groups g WHERE g.no = 6;

-- Bản đang hiệu lực, sau buổi họp nhóm cùng ngày.
INSERT INTO officers (cohort_id, group_id, role, member_id, note, effective_from, recorded_by, created_at, superseded_at)
SELECT (SELECT id FROM cohorts WHERE code = 'K03'), g.id, 'truong_nhom',
  (SELECT id FROM members WHERE group_id = g.id AND full_name = 'Ngô Phú Cường'),
  'cập nhật sau buổi họp nhóm 15/8', '2026-08-15',
  (SELECT id FROM members WHERE group_id = g.id AND full_name = 'Ngô Phú Cường'),
  '2026-08-15 18:00:00', NULL
FROM groups g WHERE g.no = 6;

INSERT INTO officers (cohort_id, group_id, role, member_id, note, effective_from, recorded_by, created_at, superseded_at)
SELECT (SELECT id FROM cohorts WHERE code = 'K03'), g.id, 'pho_nhom',
  NULL, 'chưa xác nhận', '2026-08-15',
  (SELECT id FROM members WHERE group_id = g.id AND full_name = 'Ngô Phú Cường'),
  '2026-08-15 18:00:00', NULL
FROM groups g WHERE g.no = 6;

-- ── 5. Khung bài mặc định — 8 phần theo hướng dẫn giảng viên ──
INSERT INTO plan_templates (name, is_default) VALUES ('Khung 8 phần theo hướng dẫn giảng viên', 1);

INSERT INTO plan_template_sections (template_id, ord, title, requirement) VALUES
  ((SELECT id FROM plan_templates WHERE is_default = 1), 0, 'Sản phẩm và khách hàng mục tiêu',
    'Nêu sản phẩm hoặc dịch vụ của đề tài và các nhóm khách hàng mục tiêu. Bản mẫu của giảng viên dựng quanh một sản phẩm mới, không bắt buộc phải là công ty có sẵn.'),
  ((SELECT id FROM plan_templates WHERE is_default = 1), 1, 'Nghiên cứu Marketing',
    'Quy mô phân khúc mục tiêu, tốc độ tăng trưởng những năm tới, nhu cầu và hành vi khách hàng, phân tích cạnh tranh.'),
  ((SELECT id FROM plan_templates WHERE is_default = 1), 2, 'Kế hoạch Marketing',
    'Vì sao khách hàng chọn mình mà không chọn đối thủ. Kèm chỉ tiêu doanh thu và ngân sách marketing khả thi.'),
  ((SELECT id FROM plan_templates WHERE is_default = 1), 3, 'Kế hoạch Nhân sự',
    'Đủ nhân sự chủ chốt, hoặc phương án xây đội ngũ khả thi trong ngân sách.'),
  ((SELECT id FROM plan_templates WHERE is_default = 1), 4, 'Kế hoạch Sản xuất và Tác nghiệp',
    'Công nghệ, nhà xưởng, thiết bị, chuỗi cung ứng, quản lý chất lượng, logistics.'),
  ((SELECT id FROM plan_templates WHERE is_default = 1), 5, 'Kế hoạch Tài chính',
    'Doanh thu, lợi nhuận, tỷ suất, tổng vốn đầu tư và phương án huy động vốn.'),
  ((SELECT id FROM plan_templates WHERE is_default = 1), 6, 'Lộ trình thực hiện',
    'Chia giai đoạn theo năm, mỗi giai đoạn một mục tiêu đo được.'),
  ((SELECT id FROM plan_templates WHERE is_default = 1), 7, 'Kế hoạch Dự phòng rủi ro',
    'Rủi ro thị trường, chuỗi cung ứng, niềm tin, pháp lý — mỗi rủi ro một giải pháp.');

INSERT INTO plans (group_id, template_id, topic_product, topic_customers, updated_at)
SELECT g.id, (SELECT id FROM plan_templates WHERE is_default = 1), NULL, NULL, datetime('now')
FROM groups g WHERE g.no = 6;

INSERT INTO plan_sections (plan_id, ord, title, requirement, owner_member_id, pct, note, updated_at, updated_by)
SELECT p.id, ts.ord, ts.title, ts.requirement, NULL, 0, NULL, datetime('now'), NULL
FROM plan_template_sections ts
JOIN plan_templates t ON t.id = ts.template_id AND t.is_default = 1
JOIN plans p ON p.group_id = (SELECT id FROM groups WHERE no = 6);

-- ── 6. Hai câu tâm đắc đã ghi, gắn vào phần 2 (Kế hoạch Marketing) ──
INSERT INTO insights (group_id, section_id, body, speaker, heard_on, is_proxy, created_by, created_at)
SELECT g.id,
  (SELECT ps.id FROM plan_sections ps JOIN plans pl ON pl.id = ps.plan_id WHERE pl.group_id = g.id AND ps.ord = 2),
  'Doanh nghiệp không chết vì thiếu cơ hội. Chết vì đuổi theo quá nhiều cơ hội cùng lúc.',
  'Giảng viên buổi 3', '2026-08-21', 1,
  (SELECT id FROM members WHERE group_id = g.id AND full_name = 'Ngô Phú Cường'),
  '2026-08-21 20:00:00'
FROM groups g WHERE g.no = 6;

INSERT INTO insights (group_id, section_id, body, speaker, heard_on, is_proxy, created_by, created_at)
SELECT g.id,
  (SELECT ps.id FROM plan_sections ps JOIN plans pl ON pl.id = ps.plan_id WHERE pl.group_id = g.id AND ps.ord = 2),
  'Khách hàng tốt nhất của tôi là khách cũ quay lại. Vậy mà cả năm ngân sách đổ hết vào tìm khách mới.',
  'Phạm Thế Nam', '2026-08-22', 1,
  (SELECT id FROM members WHERE group_id = g.id AND full_name = 'Ngô Phú Cường'),
  '2026-08-22 20:00:00'
FROM groups g WHERE g.no = 6;

-- ── 7. Kho — 4 tài nguyên đã biết tên/loại, CHƯA có url thật (xem ghi chú README) ──
INSERT INTO links (cohort_id, scope, group_id, section_id, url, title, kind, tag, created_by, created_at)
VALUES
  ((SELECT id FROM cohorts WHERE code = 'K03'), 'class', NULL, NULL, NULL,
    'Hướng dẫn lập kế hoạch kinh doanh — bản của giảng viên', 'DOCX', 'bai', NULL, '2026-08-22 10:00:00'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 'class', NULL, NULL, NULL,
    'Tóm tắt buổi 1 — bản gỡ băng và ý chính', 'DRIVE', 'buoi',
    (SELECT m.id FROM members m JOIN groups g ON g.id = m.group_id WHERE g.no = 6 AND m.full_name = 'Bùi Thị Huyền Trang'),
    '2026-08-20 15:00:00'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 'class', NULL, NULL, NULL,
    'Danh sách học viên K03 · 134 người, 10 nhóm', 'XLSX', 'lop', NULL, '2026-08-15 09:00:00'),
  ((SELECT id FROM cohorts WHERE code = 'K03'), 'class', NULL, NULL, NULL,
    'Lịch học K03 — 13 buổi đến 26/9', 'PDF', 'lop', NULL, '2026-08-15 09:00:00');

-- ── 8. Nhật ký hoạt động — 3 dòng đầu tiên của Nhóm 6 ──
INSERT INTO activity (cohort_id, group_id, actor_member_id, verb, object_type, object_id, summary, created_at)
SELECT (SELECT id FROM cohorts WHERE code = 'K03'), g.id,
  (SELECT id FROM members WHERE group_id = g.id AND full_name = 'Ngô Phú Cường'),
  'plan.init', 'plan', (SELECT id FROM plans WHERE group_id = g.id),
  'tạo khung tám phần theo hướng dẫn của giảng viên', '2026-08-23 08:30:00'
FROM groups g WHERE g.no = 6;

INSERT INTO activity (cohort_id, group_id, actor_member_id, verb, object_type, object_id, summary, created_at)
SELECT (SELECT id FROM cohorts WHERE code = 'K03'), g.id,
  (SELECT id FROM members WHERE group_id = g.id AND full_name = 'Ngô Phú Cường'),
  'members.import', 'group', g.id,
  'nhập hồ sơ 14 thành viên từ danh sách lớp', '2026-08-23 08:45:00'
FROM groups g WHERE g.no = 6;

INSERT INTO activity (cohort_id, group_id, actor_member_id, verb, object_type, object_id, summary, created_at)
SELECT (SELECT id FROM cohorts WHERE code = 'K03'), g.id,
  (SELECT id FROM members WHERE group_id = g.id AND full_name = 'Bùi Thị Huyền Trang'),
  'links.add', 'link',
  (SELECT id FROM links WHERE title = 'Tóm tắt buổi 1 — bản gỡ băng và ý chính'),
  'gắn bản tóm tắt buổi 1 vào Kho', '2026-08-22 16:00:00'
FROM groups g WHERE g.no = 6;

-- ─────────────────────────────────────────────────────────────
-- 0004_invite_kind_and_rate_limit.sql
-- ─────────────────────────────────────────────────────────────
-- Đợt 2 — hai bổ sung nhỏ ngoài DDL gốc mục 3 SRS, đều có lý do:
--
-- 1) invites.kind — SRS mô tả bảng invites cho link mời (mục 4.1) rồi mục 4.2
--    thêm magic link đăng nhập lại. Hai loại khác hẳn nhau về vòng đời: link
--    mời hạn 14 ngày dùng nhiều lần, magic link hạn 15 phút dùng một lần.
--    Không tách loại thì một magic link đem dán vào /i/{token} sẽ chạy như
--    lời mời nhiều lần, tức là "dùng một lần" chỉ còn trên giấy.
--
-- 2) rate_events — mục 8 SRS yêu cầu "20 lần thử token mời mỗi IP mỗi giờ".
--    Không có KV/Durable Object trong phạm vi công cụ này nên đếm bằng D1.

ALTER TABLE invites ADD COLUMN kind TEXT NOT NULL DEFAULT 'invite';  -- invite | magic

CREATE TABLE rate_events (
  id INTEGER PRIMARY KEY,
  bucket TEXT NOT NULL,        -- 'invite_try' | 'magic_request'
  ip TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX ix_rate_events ON rate_events(bucket, ip, created_at);

-- ─────────────────────────────────────────────────────────────
-- 0005_webauthn_challenges.sql
-- ─────────────────────────────────────────────────────────────
-- Đợt 3 — passkey (mục 4.3 SRS).
--
-- Bảng credentials đã có sẵn từ 0001. Chỗ còn thiếu là nơi giữ challenge giữa
-- hai chặng của WebAuthn: máy chủ sinh challenge, trình duyệt mang đi ký, rồi
-- gửi lại — phải so đúng challenge đã phát ra, nếu không thì chữ ký cũ đem
-- dùng lại được. Không giữ trong bộ nhớ Worker được vì mỗi request có thể rơi
-- vào một isolate khác.
--
-- member_id để NULL khi đăng nhập: lúc đó chưa biết người dùng là ai, danh
-- tính lấy từ userHandle mà chính passkey trả về.

CREATE TABLE webauthn_challenges (
  id TEXT PRIMARY KEY,            -- handle trả cho trình duyệt, gửi lại ở chặng sau
  member_id INTEGER,              -- NULL khi đăng nhập
  challenge TEXT NOT NULL,
  kind TEXT NOT NULL,             -- register | authenticate
  created_at TEXT DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);
CREATE INDEX ix_webauthn_challenges_exp ON webauthn_challenges(expires_at);

CREATE INDEX ix_credentials_member ON credentials(member_id);
CREATE INDEX ix_fund_declarations_round ON fund_declarations(round_id);
CREATE INDEX ix_fund_rounds_scope ON fund_rounds(cohort_id, scope, group_id, status);

-- ─────────────────────────────────────────────────────────────
-- 0006_wizard_and_presentation.sql
-- ─────────────────────────────────────────────────────────────
-- Đợt 4 — wizard cho nhóm khác và bảng phân công thuyết trình.

-- Bước 3 của wizard (mục 5 SRS): nhóm đã có người dựng thì người thứ hai
-- chuyển sang luồng "xin vào nhóm, gửi yêu cầu cho trưởng nhóm hiện tại".
-- Phần lớn trường hợp sẽ không cần đến bảng này — người trong danh sách gốc
-- đã được wizard tạo sẵn dòng members, chỉ cần trưởng nhóm phát lại link mời.
-- Bảng dành cho trường hợp còn lại: người bị bỏ sót ở bước 5, hoặc người muốn
-- đổi sang nhóm khác với nhóm ghi trong danh sách.
CREATE TABLE join_requests (
  id INTEGER PRIMARY KEY,
  cohort_id INTEGER NOT NULL,
  group_id INTEGER NOT NULL,
  roster_id INTEGER,                     -- NULL nếu người này không có trong danh sách gốc
  full_name TEXT NOT NULL,
  email TEXT,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | accepted | declined
  decided_by INTEGER, decided_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX ix_join_requests_group ON join_requests(group_id, status);

-- Phân công thuyết trình 20 phút. Để ngay trong plan_sections vì mỗi phần bài
-- ứng với một lượt nói — tách bảng riêng chỉ để giữ hai cột là thừa.
-- Ba-rem chấm "không quá 20 phút" và "nhiều người cùng nói", nên giao diện
-- cộng tổng phút và đếm số người nói khác nhau từ hai cột này.
ALTER TABLE plan_sections ADD COLUMN present_member_id INTEGER;
ALTER TABLE plan_sections ADD COLUMN present_minutes INTEGER;


-- ─────────────────────────────────────────────────────────────
-- Đánh dấu đã áp, để wrangler không chạy lại lên dữ liệu thật
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS d1_migrations(
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT UNIQUE,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
INSERT OR IGNORE INTO d1_migrations (name) VALUES
  ('0001_init.sql'),
  ('0002_seed_roster.sql'),
  ('0003_seed_group6.sql'),
  ('0004_invite_kind_and_rate_limit.sql'),
  ('0005_webauthn_challenges.sql'),
  ('0006_wizard_and_presentation.sql');
