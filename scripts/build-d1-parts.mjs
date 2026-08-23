#!/usr/bin/env node
// Sinh scripts/d1-parts/*.sql — bộ tệp NHỎ để dán lần lượt vào Console D1 trên
// dashboard Cloudflare, dành cho khi console nghẹn với tệp lớn.
//
// Mỗi tệp dưới 3 KB và TỰ CHỦ: mở đầu bằng câu DELETE xoá đúng phần dữ liệu
// mà chính nó nạp. Nghĩa là dán lại một tệp bất kỳ, nhiều lần, theo thứ tự nào
// cũng không nhân đôi dữ liệu — miễn là cuối cùng chạy đủ cả bộ theo số thứ tự.
//
// Danh sách học viên được nén lại cho ngắn: thay vì lặp
// `(SELECT id FROM cohorts WHERE code='K03')` ở từng dòng thì nối một lần với
// bảng cohorts, và bỏ cột `source` vì nó đã có DEFAULT đúng giá trị đó.
// Dữ liệu sinh ra giống hệt bản gốc — scripts/build-d1-parts.mjs có phần đối
// chiếu trong bộ kiểm thử.
//
// Chạy lại khi 0002/0003 đổi:  node scripts/build-d1-parts.mjs

import { readFileSync, writeFileSync, readdirSync, rmSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const MIG = path.join(ROOT, 'migrations');
const OUT = path.join(ROOT, 'scripts', 'd1-parts');
const NGUONG = 3000;                       // ngưỡng byte mỗi tệp
const K03 = `(SELECT id FROM cohorts WHERE code = 'K03')`;

// ── Tách một dòng VALUES của SQL thành từng trường, tôn trọng dấu nháy ────────
// Không dùng split(',') được: địa chỉ và tên công ty có dấu phẩy bên trong.
function tachTruong(dong) {
  const s = dong.replace(/^\(/, '').replace(/\)$/, '');
  const truong = [];
  let sau = 0, sau_nhay = false, sau_ngoac = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (sau_nhay) {
      if (c === "'") sau_nhay = s[i + 1] === "'" ? (i++, true) : false;
    } else if (c === "'") sau_nhay = true;
    else if (c === '(') sau_ngoac++;
    else if (c === ')') sau_ngoac--;
    else if (c === ',' && sau_ngoac === 0) { truong.push(s.slice(sau, i).trim()); sau = i + 1; }
  }
  truong.push(s.slice(sau).trim());
  return truong;
}

// ── Đọc 134 dòng học viên từ 0002 và nén lại ────────────────────────────────
const s0002 = readFileSync(path.join(MIG, '0002_seed_roster.sql'), 'utf8').split('\n');
const iHeader = s0002.findIndex(l => l.startsWith('INSERT INTO roster'));
const COT = s0002[iHeader].match(/\(([^)]*)\)/)[1].split(',').map(c => c.trim());
const MAC_DINH_SOURCE = "'Ban tổ chức 15/8'";

const hocVien = s0002.slice(iHeader + 1).map(l => l.trim()).filter(Boolean)
  .map(l => tachTruong(l.replace(/[,;]$/, '')))
  .map(f => {
    if (f.length !== COT.length) throw new Error(`Tách sai số trường: ${f.length} ≠ ${COT.length}`);
    if (f[0] !== K03) throw new Error(`Cột cohort_id không như mong đợi: ${f[0]}`);
    if (f[f.length - 1] !== MAC_DINH_SOURCE) throw new Error(`source lệch mặc định: ${f[f.length - 1]}`);
    return { seq: Number(f[1]), sql: `(${f.slice(1, -1).join(',')})` };   // bỏ cohort_id + source
  });

const COT_NEN = COT.slice(1, -1).join(', ');

// ── Gom các dòng học viên thành mẻ vừa ngưỡng ───────────────────────────────
const me = [];
let hienTai = [];
let co = 0;
for (const hv of hocVien) {
  if (hienTai.length && co + hv.sql.length > NGUONG - 400) { me.push(hienTai); hienTai = []; co = 0; }
  hienTai.push(hv); co += hv.sql.length + 3;
}
if (hienTai.length) me.push(hienTai);

// ── Cắt 0003 theo các mục đánh số, gom lại cho vừa ngưỡng ───────────────────
const s0003 = readFileSync(path.join(MIG, '0003_seed_group6.sql'), 'utf8');
const mucs = s0003.split(/\n(?=-- ── \d+\. )/).slice(1).map(t => t.trimEnd());

// Mỗi mục đụng vào bảng nào → biết phải xoá gì cho chạy lại được.
const BANG_CUA_MUC = {
  1: ['members'], 2: [], 3: ['member_profile'], 4: ['officers'],
  5: ['plan_sections', 'plans', 'plan_template_sections', 'plan_templates'],
  6: ['insights'], 7: ['links'], 8: ['activity'],
};

const nhom0003 = [];
let goi = [];
let coGoi = 0;
for (const m of mucs) {
  if (goi.length && coGoi + m.length > NGUONG) { nhom0003.push(goi); goi = []; coGoi = 0; }
  goi.push(m); coGoi += m.length;
}
if (goi.length) nhom0003.push(goi);

// ── Ghi ra đĩa ──────────────────────────────────────────────────────────────
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const tep = [];
const ghi = (ten, noiDung) => { tep.push(ten); writeFileSync(path.join(OUT, ten), noiDung, 'utf8'); };
const dau = (stt, tong, mo_ta) =>
  `-- k3vaceo — tệp ${stt}/${tong}: ${mo_ta}\n` +
  `-- Dán cả tệp vào Console D1 rồi Execute. Chạy lại nhiều lần vẫn đúng.\n` +
  `-- Sinh tự động bởi scripts/build-d1-parts.mjs — đừng sửa tay.\n\n`;

const TONG = 1 + me.length + nhom0003.length;
let stt = 1;

ghi('01-don-dep.sql', dau(stt++, TONG, 'dọn phần nạp dở (chạy đầu tiên)') +
  ['activity', 'links', 'insights', 'plan_sections', 'plans', 'plan_template_sections',
   'plan_templates', 'officers', 'member_profile', 'members', 'roster']
    .map(t => `DELETE FROM ${t};`).join('\n') +
  `\nUPDATE groups SET status = 'unclaimed', claimed_by = NULL, claimed_at = NULL\n WHERE cohort_id = ${K03};\n`);

for (const m of me) {
  const a = m[0].seq, b = m[m.length - 1].seq;
  const ten = `${String(stt).padStart(2, '0')}-hoc-vien-${String(a).padStart(3, '0')}-${String(b).padStart(3, '0')}.sql`;
  ghi(ten, dau(stt++, TONG, `học viên ${a}–${b} trong danh sách gốc`) +
    `DELETE FROM roster WHERE cohort_id = ${K03} AND seq BETWEEN ${a} AND ${b};\n\n` +
    `INSERT INTO roster (cohort_id, ${COT_NEN})\n` +
    `SELECT c.id, v.* FROM (VALUES\n${m.map(h => '  ' + h.sql).join(',\n')}\n) v, cohorts c WHERE c.code = 'K03';\n`);
}

for (const goi of nhom0003) {
  const so = goi.map(g => Number(g.match(/-- ── (\d+)\./)[1]));
  const xoa = [...new Set(so.flatMap(n => BANG_CUA_MUC[n]))];
  const ten = `${String(stt).padStart(2, '0')}-nhom6-muc-${so.join('-')}.sql`;
  ghi(ten, dau(stt++, TONG, `kích hoạt Nhóm 6, mục ${so.join(', ')}`) +
    (xoa.length ? xoa.map(t => `DELETE FROM ${t};`).join('\n') + '\n\n' : '') +
    goi.join('\n\n') + '\n');
}

// Tệp cuối: ghi nhớ migration + kiểm tra luôn.
const allMig = readdirSync(MIG).filter(f => f.endsWith('.sql')).sort();
ghi(`${String(TONG + 1).padStart(2, '0')}-ghi-nho-va-kiem-tra.sql`,
  dau(TONG + 1, TONG + 1, 'đánh dấu đã áp + kiểm tra kết quả') +
  `CREATE TABLE IF NOT EXISTS d1_migrations(\n` +
  `  id         INTEGER PRIMARY KEY AUTOINCREMENT,\n` +
  `  name       TEXT UNIQUE,\n` +
  `  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL\n);\n` +
  `INSERT OR IGNORE INTO d1_migrations (name) VALUES\n${allMig.map(f => `  ('${f}')`).join(',\n')};\n\n` +
  `-- Kiểm tra: dán tiếp scripts/verify-d1.sql — một dòng, cột cuối "ket_qua"\n` +
  `-- phải là "ĐÚNG HẾT".\n`);

const cỡ = tep.map(t => readFileSync(path.join(OUT, t), 'utf8').length);
console.log(`✓ scripts/d1-parts/ — ${tep.length} tệp, lớn nhất ${Math.max(...cỡ)} byte`);
for (let i = 0; i < tep.length; i++) console.log(`   ${tep[i]}  (${cỡ[i]} byte)`);
