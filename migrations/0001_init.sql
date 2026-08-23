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
