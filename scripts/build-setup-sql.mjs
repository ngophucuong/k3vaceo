#!/usr/bin/env node
// Gộp toàn bộ migration thành MỘT tệp SQL để dán/tải thẳng vào console D1 trên
// dashboard Cloudflare — dành cho người không muốn động tới dòng lệnh.
//
// Kèm luôn phần ghi vào bảng d1_migrations, để sau này ai chạy
// `wrangler d1 migrations apply` cũng không áp lại lần hai lên dữ liệu thật.
//
// Chạy lại mỗi khi thêm migration mới:  node scripts/build-setup-sql.mjs

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const MIG = path.join(ROOT, 'migrations');

const files = readdirSync(MIG).filter(f => f.endsWith('.sql')).sort();

let out = `-- ═══════════════════════════════════════════════════════════════
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
-- Gồm ${files.length} migration: ${files.join(', ')}
-- ═══════════════════════════════════════════════════════════════

`;

for (const f of files) {
  out += `\n-- ─────────────────────────────────────────────────────────────\n`;
  out += `-- ${f}\n`;
  out += `-- ─────────────────────────────────────────────────────────────\n`;
  out += readFileSync(path.join(MIG, f), 'utf8').trimEnd() + '\n';
}

// Ghi nhớ đúng như cách wrangler làm, để lần sau chạy
// `wrangler d1 migrations apply --remote` nó thấy đã áp rồi và bỏ qua.
out += `

-- ─────────────────────────────────────────────────────────────
-- Đánh dấu đã áp, để wrangler không chạy lại lên dữ liệu thật
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS d1_migrations(
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT UNIQUE,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
INSERT OR IGNORE INTO d1_migrations (name) VALUES
${files.map(f => `  ('${f}')`).join(',\n')};
`;

const dest = path.join(ROOT, 'scripts', 'setup-d1.sql');
writeFileSync(dest, out, 'utf8');
console.log(`✓ scripts/setup-d1.sql — ${files.length} migration, ${(out.length / 1024).toFixed(1)} KB`);
