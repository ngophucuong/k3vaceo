#!/usr/bin/env node
// Sinh scripts/setup-d1-part2.sql — phần CÒN LẠI của setup-d1.sql, dành cho
// trường hợp console D1 đã nuốt được lược đồ + cohort + 10 nhóm rồi nhưng chết
// giữa chừng ở câu INSERT roster.
//
// Lý do chết: 134 dòng roster nằm trong ĐÚNG MỘT câu lệnh dài 35 KB. Ở đây ta
// bẻ thành từng mẻ 20 dòng (mỗi câu dưới 8 KB) nên console nuốt được.
//
// Tệp sinh ra chạy lại được nhiều lần: mở đầu bằng khối DELETE xoá đúng những
// gì chính nó tạo ra. An toàn vì đây là dữ liệu gốc chép từ Excel + trạng thái
// khởi tạo của Nhóm 6, không phải dữ liệu người dùng nhập.
//
// Chạy lại mỗi khi 0002/0003 đổi:  node scripts/build-part2-sql.mjs

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const MIG = path.join(ROOT, 'migrations');
const MOI_ME = 20;                       // số dòng roster mỗi câu INSERT

const allMigrations = readdirSync(MIG).filter(f => f.endsWith('.sql')).sort();

// ── Tách câu INSERT roster trong 0002 thành phần đầu + các dòng giá trị ──
const src0002 = readFileSync(path.join(MIG, '0002_seed_roster.sql'), 'utf8').split('\n');
const iHeader = src0002.findIndex(l => l.startsWith('INSERT INTO roster'));
if (iHeader < 0) throw new Error('Không tìm thấy câu INSERT INTO roster trong 0002');

const header = src0002[iHeader];
const rows = src0002
  .slice(iHeader + 1)
  .map(l => l.trim())
  .filter(Boolean)
  .map(l => l.replace(/[,;]$/, ''));      // bỏ dấu phân cách cuối dòng, lát nữa tự ghép

const src0003 = readFileSync(path.join(MIG, '0003_seed_group6.sql'), 'utf8').trimEnd();

let out = `-- ═══════════════════════════════════════════════════════════════
-- k3vaceo — PHẦN 2: danh sách 134 học viên + kích hoạt Nhóm 6
--
-- Sinh tự động bởi scripts/build-part2-sql.mjs. ĐỪNG sửa tay tệp này.
--
-- Dùng khi console D1 đã chạy xong lược đồ (23 bảng) + cohort K03 + 10 nhóm
-- nhưng chưa nạp được roster. Câu INSERT roster gốc dài 35 KB nên console hay
-- chết giữa chừng; ở đây đã bẻ thành ${Math.ceil(rows.length / MOI_ME)} mẻ, mỗi mẻ ${MOI_ME} dòng.
--
-- CHẠY LẠI ĐƯỢC NHIỀU LẦN. Khối DELETE ở đầu chỉ xoá đúng những gì tệp này
-- tạo ra (danh sách gốc + trạng thái khởi tạo Nhóm 6), nên lỡ chết giữa chừng
-- thì cứ dán lại từ đầu.
--
-- Xong thì dán tiếp scripts/verify-d1.sql để kiểm tra: một dòng, cột cuối
-- ket_qua phải là \"ĐÚNG HẾT\".
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- 0. Dọn phần chạy dở của chính tệp này (bỏ qua được nếu chạy lần đầu)
-- ─────────────────────────────────────────────────────────────
DELETE FROM activity;
DELETE FROM links;
DELETE FROM insights;
DELETE FROM plan_sections;
DELETE FROM plans;
DELETE FROM plan_template_sections;
DELETE FROM plan_templates;
DELETE FROM officers;
DELETE FROM member_profile;
DELETE FROM members;
DELETE FROM roster;
UPDATE groups SET status = 'unclaimed', claimed_by = NULL, claimed_at = NULL
 WHERE cohort_id = (SELECT id FROM cohorts WHERE code = 'K03');

-- ─────────────────────────────────────────────────────────────
-- 1. Danh sách gốc Ban tổ chức — ${rows.length} học viên, chia ${Math.ceil(rows.length / MOI_ME)} mẻ
-- ─────────────────────────────────────────────────────────────
`;

for (let i = 0; i < rows.length; i += MOI_ME) {
  const me = rows.slice(i, i + MOI_ME);
  out += `\n-- mẻ ${i / MOI_ME + 1}: học viên ${i + 1}–${i + me.length}\n`;
  out += `${header}\n${me.map(r => '  ' + r).join(',\n')};\n`;
}

out += `
-- ─────────────────────────────────────────────────────────────
-- 2. Kích hoạt thật Nhóm 6 (nguyên văn 0003_seed_group6.sql)
-- ─────────────────────────────────────────────────────────────
${src0003}

-- ─────────────────────────────────────────────────────────────
-- 3. Đánh dấu đã áp, để wrangler không chạy lại lên dữ liệu thật
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS d1_migrations(
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT UNIQUE,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
INSERT OR IGNORE INTO d1_migrations (name) VALUES
${allMigrations.map(f => `  ('${f}')`).join(',\n')};
`;

const dest = path.join(ROOT, 'scripts', 'setup-d1-part2.sql');
writeFileSync(dest, out, 'utf8');
console.log(`✓ scripts/setup-d1-part2.sql — ${rows.length} học viên / ${Math.ceil(rows.length / MOI_ME)} mẻ, ${(out.length / 1024).toFixed(1)} KB`);
