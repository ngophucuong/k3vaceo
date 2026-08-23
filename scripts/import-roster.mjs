#!/usr/bin/env node
// Đọc file danh sách gốc của Ban tổ chức (2 sheet: "DS lớp", "Trưởng, phó nhóm")
// và sinh migrations/0002_seed_roster.sql — chạy lại mỗi khi có bản danh sách mới.
//
// Dùng:  node scripts/import-roster.mjs <đường-dẫn-file.xlsx>
//
// Việc script này KHÔNG làm: không tạo members (chỉ tạo roster + groups —
// members của từng nhóm chỉ sinh ra khi nhóm đó nhận link mời hoặc chạy wizard,
// xem mục 5 SRS). Không tự ý viết tắt tên đơn vị ("Công ty Cổ phần" -> "CTCP") —
// đó là việc mỗi người tự biên tập khi xác nhận hồ sơ của mình (nguyên tắc N5).

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import XLSX from 'xlsx';

const SRC = process.argv[2];
if (!SRC) {
  console.error('Dùng: node scripts/import-roster.mjs <đường-dẫn-file.xlsx>');
  process.exit(1);
}

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

// Lỗi chính tả rõ ràng trong tên đơn vị — mục 9.4 SRS: sửa khi nhập, ghi log.
// Thêm dòng mới vào đây nếu lần nhập sau phát hiện lỗi khác.
const SPELLING_FIXES = [
  { match: /Thương Msij Mylax/g, fix: 'Thương mại Mylax', reason: 'lỗi gõ "Msij" — đúng ra là "mại"' },
];

function esc(v) {
  if (v === null || v === undefined || v === '') return 'NULL';
  return `'${String(v).replace(/'/g, "''")}'`;
}

function applySpellingFixes(text, ctx, issues) {
  if (!text) return text;
  let out = text;
  for (const { match, fix, reason } of SPELLING_FIXES) {
    if (match.test(out)) {
      issues.push({ ...ctx, kind: 'chinh-ta', detail: `"${out}" → "${out.replace(match, fix)}" (${reason})` });
      out = out.replace(match, fix);
    }
  }
  return out;
}

// roster là "bản gốc, chỉ đọc" nên luôn giữ giá trị thật của nguồn — kể cả khi
// bất thường. Chỉ khôi phục số 0 khi rõ ràng là lỗi Excel lưu dạng số (điều đó
// là phục hồi đúng bản gốc, không phải sửa dữ liệu). Số vẫn sai sau khi khôi
// phục thì GIỮ NGUYÊN trong roster để còn tra lại nguồn, chỉ đánh dấu "không
// hợp lệ" — nơi nào copy sang members (mục 9.1 SRS) mới đọc cờ này để bỏ trống.
function normalizePhone(raw, ctx, issues) {
  if (raw === null || raw === undefined) return { store: null, valid: false };
  let s = String(raw).trim();
  if (s === '') return { store: null, valid: false };
  // Chỉ vá số 0 khi chuỗi KHÔNG có sẵn số 0 đầu — một chuỗi 9 số đã bắt đầu
  // bằng 0 (vd "098778525") là thiếu 1 số thật, không phải bị rụng số 0.
  if (/^\d+$/.test(s) && s.length === 9 && !s.startsWith('0')) s = '0' + s;
  const valid = /^0\d{9}$/.test(s);
  if (!valid) {
    issues.push({ ...ctx, kind: 'so-dien-thoai', detail: `"${s}" có ${s.length} ký tự, khác chuẩn 10 ký tự — giữ nguyên trong roster để tra lại nguồn, không hợp lệ để đưa vào hồ sơ thành viên.` });
  }
  return { store: s, valid };
}

function groupNoOf(cell) {
  const m = String(cell ?? '').match(/\d+/);
  return m ? parseInt(m[0], 10) : null;
}

const wb = XLSX.readFile(SRC);

// ── Sheet "DS lớp": bỏ 4 dòng tiêu đề + 2 dòng đề mục cột, dữ liệu từ dòng 7 ──
const dsRows = XLSX.utils.sheet_to_json(wb.Sheets['DS lớp'], { header: 1, range: 6, blankrows: false });
const issues = [];
const people = [];
for (const row of dsRows) {
  const [, nhom, hoten, ngaysinh, chucvu, donvi, diachi, dienthoai] = row;
  if (!hoten || !String(hoten).trim()) continue;
  const groupNo = groupNoOf(nhom);
  const ctx = { group: groupNo, name: String(hoten).trim() };
  people.push({
    groupNo,
    fullName: String(hoten).trim(),
    dob: ngaysinh != null && String(ngaysinh).trim() !== '' ? String(ngaysinh).trim() : null,
    title: chucvu != null ? applySpellingFixes(String(chucvu).trim(), ctx, issues) : null,
    company: donvi != null ? applySpellingFixes(String(donvi).trim(), ctx, issues) : null,
    address: diachi != null && String(diachi).trim() !== '' ? String(diachi).trim() : null,
    ...normalizePhone(dienthoai, ctx, issues), // → { store, valid }
  });
}

// ── Sheet "Trưởng, phó nhóm": tham khảo cho wizard sau này (đợt 4), KHÔNG ghi
// vào bảng officers ngay — vì officers.member_id cần một dòng members thật, mà
// members của 9/10 nhóm chỉ được tạo khi chính nhóm đó nhận link mời/chạy wizard.
const tpRows = XLSX.utils.sheet_to_json(wb.Sheets['Trưởng, phó nhóm'], { header: 1, range: 6, blankrows: false })
  .filter(r => r[2] && String(r[2]).trim());
const suggestedOfficers = tpRows.map((r, i) => ({
  groupNo: groupNoOf(r[1]),
  fullName: String(r[2]).trim(),
  role: i % 2 === 0 ? 'truong_nhom' : 'pho_nhom', // 2 dòng liên tiếp mỗi nhóm: trưởng rồi đến phó
}));

if (people.length !== 134) {
  console.warn(`⚠ Đọc được ${people.length} người, khác 134 người SRS mục 9 yêu cầu kiểm — vẫn ghi ra để bạn xem lại.`);
}

// ── Sinh migrations/0002_seed_roster.sql ──
const groupNos = [...new Set(people.map(p => p.groupNo))].sort((a, b) => a - b);

let sql = `-- Sinh tự động bởi scripts/import-roster.mjs từ "${path.basename(SRC)}"\n`;
sql += `-- Chạy lại khi có danh sách mới: npm run import:roster -- <file.xlsx>\n\n`;

sql += `INSERT INTO cohorts (code, name, starts_on, ends_on, defense_on, sessions_total) VALUES\n`;
sql += `  ('K03', 'Giám đốc điều hành doanh nghiệp K03 (VCCI x Đại học Andrews)', '2026-08-15', '2026-09-26', '2026-09-26', 13);\n\n`;

sql += `INSERT INTO groups (cohort_id, no, label, status) VALUES\n`;
sql += groupNos
  .map(n => `  ((SELECT id FROM cohorts WHERE code = 'K03'), ${n}, 'Nhóm ${n}', 'unclaimed')`)
  .join(',\n') + ';\n\n';

sql += `INSERT INTO roster (cohort_id, seq, group_label, full_name, dob, title, company, address, phone, source) VALUES\n`;
sql += people
  .map((p, i) => `  ((SELECT id FROM cohorts WHERE code = 'K03'), ${i + 1}, 'Nhóm ${p.groupNo}', ` +
    `${esc(p.fullName)}, ${esc(p.dob)}, ${esc(p.title)}, ${esc(p.company)}, ${esc(p.address)}, ${esc(p.store)}, 'Ban tổ chức 15/8')`)
  .join(',\n') + ';\n';

writeFileSync(path.join(ROOT, 'migrations/0002_seed_roster.sql'), sql, 'utf8');

// ── Danh sách trưởng/phó dự kiến — lưu tham khảo, không phải migration ──
mkdirSync(path.join(ROOT, 'scripts/data'), { recursive: true });
writeFileSync(
  path.join(ROOT, 'scripts/data/truong-pho-nhom-du-kien.json'),
  JSON.stringify(suggestedOfficers, null, 2) + '\n',
  'utf8'
);

// ── Báo cáo các chỗ cần kiểm tra lại (mục 9.1/9.4 SRS) ──
const byGroup = {};
for (const p of people) byGroup[p.groupNo] = (byGroup[p.groupNo] || 0) + 1;

let report = `# Báo cáo nhập liệu roster\n\n`;
report += `Nguồn: \`${path.basename(SRC)}\` · sinh lúc chạy script.\n\n`;
report += `Tổng **${people.length}** người trong **${groupNos.length}** nhóm ` +
  `(${groupNos.map(n => `Nhóm ${n}: ${byGroup[n]}`).join(', ')}).\n`;
report += `Có số điện thoại (kể cả bất thường): **${people.filter(p => p.store).length}**/${people.length} · hợp lệ để dùng cho hồ sơ thành viên: **${people.filter(p => p.valid).length}**/${people.length}.\n\n`;
report += `## Cần kiểm tra lại (${issues.length})\n\n`;
report += issues.length
  ? issues.map(it => `- Nhóm ${it.group} · ${it.name} — ${it.detail}`).join('\n') + '\n'
  : '_Không có._\n';

writeFileSync(path.join(ROOT, 'scripts/import-report.md'), report, 'utf8');

console.log(`✓ migrations/0002_seed_roster.sql — ${people.length} người, ${groupNos.length} nhóm`);
console.log(`✓ scripts/import-report.md — ${issues.length} điểm cần kiểm tra lại`);
console.log(`✓ scripts/data/truong-pho-nhom-du-kien.json — ${suggestedOfficers.length} dòng tham khảo cho wizard Đợt 4`);
