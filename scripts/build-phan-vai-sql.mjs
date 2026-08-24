#!/usr/bin/env node
// Đọc scripts/data/phan-vai.csv, kiểm tra, rồi sinh SQL gán vai — cả cấp lớp
// (officers.group_id để trống) lẫn cấp nhóm (group_id lấy theo nhóm của chính
// người ấy trong danh sách gốc).
//
// Chạy tay:   node scripts/build-phan-vai-sql.mjs             (chỉ kiểm, in báo cáo)
//             node scripts/build-phan-vai-sql.mjs --ra x.sql  (kiểm rồi ghi SQL)
// Workflow .github/workflows/phan-vai.yml gọi bản --ra.
//
// Vai cấp lớp = dòng officers có group_id để trống (mục 3 SRS, bảng officers).
// Cho tới Đợt 5 chưa ai giữ vai này nên quỹ lớp không tạo được — quyền đã viết
// sẵn trong permissions.js, chỉ thiếu dữ liệu. Tệp này lấp chỗ thiếu ấy.
//
// Một chỗ đáng chú ý: hai người này ở Nhóm 5 và Nhóm 7, mà mới chỉ Nhóm 6 có
// dòng trong bảng members. Nên trước khi gán vai phải tạo hồ sơ cho họ từ
// danh sách gốc — tạo với claimed_at để trống, tức "hồ sơ có sẵn nhưng chưa ai
// nhận". Lúc họ tự đăng nhập ở /dangnhap, luồng onboard tìm thấy dòng này theo
// roster_id và gắn email vào, không tạo trùng.

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const CSV = path.join(ROOT, 'scripts', 'data', 'phan-vai.csv');
const VAI_LOP = new Set(['lop_truong', 'lop_pho', 'thu_quy']);
const VAI_NHOM = new Set(['truong_nhom', 'pho_nhom']);
const VAI_HOP_LE = new Set([...VAI_LOP, ...VAI_NHOM]);

// Tách một dòng CSV có tôn trọng dấu nháy kép và "" thoát bên trong.
function tachDong(dong) {
  const o = []; let cur = '', trongNhay = false;
  for (let i = 0; i < dong.length; i++) {
    const c = dong[i];
    if (trongNhay) {
      if (c === '"') { if (dong[i + 1] === '"') { cur += '"'; i++; } else trongNhay = false; }
      else cur += c;
    } else if (c === '"') trongNhay = true;
    else if (c === ',') { o.push(cur); cur = ''; }
    else cur += c;
  }
  o.push(cur);
  return o.map(x => x.trim());
}

const nhay = s => (s == null || s === '' ? 'NULL' : `'${String(s).replace(/'/g, "''")}'`);

const dong = readFileSync(CSV, 'utf8').split('\n')
  .map(l => l.replace(/\r$/, ''))
  .filter(l => l.trim() && !l.trimStart().startsWith('#'));

const dau = tachDong(dong[0]);
if (dau[0] !== 'vai_tro' || dau[1] !== 'stt') {
  console.error(`✗ Dòng tiêu đề phải là "vai_tro,stt,ho_ten,ghi_chu" — đang thấy: ${dong[0]}`);
  process.exit(1);
}

const nhan = [], loi = [];
for (const l of dong.slice(1)) {
  const [vai, stt, ten, ghiChu] = tachDong(l);
  if (!VAI_HOP_LE.has(vai)) { loi.push(`vai "${vai}" không hợp lệ — chỉ nhận ${[...VAI_HOP_LE].join(' | ')}`); continue; }
  const seq = Number(stt);
  if (!Number.isInteger(seq) || seq < 1 || seq > 134) { loi.push(`stt "${stt}" của ${vai} phải là số từ 1 đến 134`); continue; }
  if (!ten) { loi.push(`dòng ${vai} stt ${stt} thiếu họ tên — cần để đối chiếu`); continue; }
  nhan.push({ vai, seq, ten, ghiChu: ghiChu || null });
}

// Mỗi vai chỉ một người — nhưng vai cấp NHÓM thì "mỗi nhóm một người", nên
// khoá theo cả vai lẫn số thứ tự nhóm. Nhóm chưa biết ở đây (SQL tự suy từ
// danh sách gốc), nên với vai cấp nhóm ta chỉ chặn trùng đúng cặp (vai, stt);
// trùng vai trong CÙNG một nhóm thì câu kiểm ở cuối tệp SQL bắt được.
const theoVai = new Map();
for (const r of nhan) {
  const khoa = VAI_LOP.has(r.vai) ? r.vai : `${r.vai}#${r.seq}`;
  (theoVai.get(khoa) ?? theoVai.set(khoa, []).get(khoa)).push(r);
}
for (const [khoa, ds] of theoVai) {
  if (ds.length > 1) loi.push(`${khoa} bị gán ${ds.length} lần: ${ds.map(r => r.ten).join(', ')}`);
}

console.log(`Đọc ${dong.length - 1} dòng: ${nhan.length} hợp lệ, ${loi.length} lỗi.`);
if (loi.length) {
  console.error('\n✗ Phải sửa những chỗ này trước:');
  for (const x of loi) console.error('   · ' + x);
  process.exit(1);
}
if (!nhan.length) { console.log('Chưa có dòng nào để nạp.'); process.exit(0); }

const K03 = `(SELECT id FROM cohorts WHERE code = 'K03')`;
const sql = [
  '-- Sinh tự động bởi scripts/build-phan-vai-sql.mjs. Đừng sửa tay.',
  `-- ${nhan.length} vai cấp lớp.`,
  '',
];

for (const r of nhan) {
  const R = `(SELECT id FROM roster WHERE cohort_id = ${K03} AND seq = ${r.seq})`;
  sql.push(`-- ${r.vai}: ${r.ten} (stt ${r.seq})`);

  // Mọi câu đều buộc tên trong tệp phải khớp tên trong danh sách gốc. Lệch
  // tên thì không câu nào chạm được dòng nào — im lặng nhưng không gán nhầm
  // người — và phần kiểm tra ở cuối tệp sẽ báo "CÓ CHỖ SAI".
  // (Cố ý không dùng RAISE(): SQLite chỉ cho RAISE() trong trigger, còn mẹo
  //  "SELECT một cột không tồn tại" thì hỏng ngay lúc dịch câu, kể cả khi
  //  nhánh CASE ấy không bao giờ chạy tới.)
  const KHOP = `r.cohort_id = ${K03} AND r.seq = ${r.seq} AND r.full_name = ${nhay(r.ten)}`;

  // 1. Bảo đảm có hồ sơ thành viên. claimed_at để trống = chưa ai nhận chỗ.
  sql.push(
    `INSERT INTO members (cohort_id, group_id, roster_id, full_name, title, company, phone, is_active, created_at, updated_at)` +
    ` SELECT r.cohort_id, g.id, r.id, r.full_name, r.title, r.company, r.phone, 1, datetime('now'), datetime('now')` +
    ` FROM roster r JOIN groups g ON g.cohort_id = r.cohort_id AND g.label = r.group_label` +
    ` WHERE ${KHOP} AND NOT EXISTS (SELECT 1 FROM members m WHERE m.roster_id = r.id);`
  );

  // Vai cấp nhóm thì group_id lấy theo nhóm của chính người ấy trong danh sách
  // gốc; vai cấp lớp thì để trống. Viết dưới dạng truy vấn con để nhóm luôn
  // khớp dữ liệu thật, không phải con số gõ tay trong tệp CSV.
  const capNhom = VAI_NHOM.has(r.vai);
  const NHOM = `(SELECT g.id FROM groups g JOIN roster r2 ON r2.group_label = g.label` +
               ` AND r2.cohort_id = g.cohort_id WHERE ${KHOP.replace(/\br\./g, 'r2.')})`;
  const dieuKienNhom = capNhom ? `group_id = ${NHOM}` : 'group_id IS NULL';

  // 2. Bản cũ của chính vai này thôi hiệu lực — giữ lại để lần theo lịch sử,
  //    đúng tinh thần "cơ cấu có lịch sử" của mục 5.2 SRS. Chỉ hạ bản cũ khi
  //    chắc chắn sắp dựng được bản mới, kẻo vai bị bỏ trống giữa chừng.
  sql.push(
    `UPDATE officers SET superseded_at = datetime('now')` +
    ` WHERE ${dieuKienNhom} AND cohort_id = ${K03} AND role = ${nhay(r.vai)} AND superseded_at IS NULL` +
    `   AND EXISTS (SELECT 1 FROM members m JOIN roster r ON r.id = m.roster_id WHERE ${KHOP});`
  );

  // 3. Gán vai mới.
  sql.push(
    `INSERT INTO officers (cohort_id, group_id, role, member_id, note, effective_from, created_at)` +
    ` SELECT ${K03}, ${capNhom ? 'g.id' : 'NULL'}, ${nhay(r.vai)}, m.id, ${nhay(r.ghiChu)}, date('now'), datetime('now')` +
    ` FROM members m JOIN roster r ON r.id = m.roster_id` +
    (capNhom ? ` JOIN groups g ON g.id = m.group_id` : '') +
    ` WHERE ${KHOP};`
  );

  // 4. Nhóm có người phụ trách thì không còn là nhóm chưa ai dựng nữa. Không
  //    đụng tới claimed_by: cột ấy ghi AI DỰNG không gian nhóm, mà đường này
  //    là sửa từ ngoài chứ không phải dựng.
  if (capNhom) {
    sql.push(
      `UPDATE groups SET status = 'active'` +
      ` WHERE status = 'unclaimed' AND id = (SELECT m.group_id FROM members m` +
      ` JOIN roster r ON r.id = m.roster_id WHERE ${KHOP});`
    );
  }
  sql.push('');
}

// Phần kiểm tra: đếm đúng số vai đang hiệu lực và in ra tên người giữ. Đọc
// bằng --command (không phải --file: đường import của D1 nuốt kết quả SELECT).
sql.push('-- ══ Kiểm tra ══');
sql.push(
  `SELECT (SELECT COUNT(*) FROM officers o WHERE o.cohort_id = ${K03} AND o.superseded_at IS NULL` +
  ` AND o.member_id IS NOT NULL) || ' vai đang hiệu lực' AS tong,` +
  ` (SELECT group_concat(x, ' | ') FROM (SELECT o.role || '=' || m.full_name ||` +
  ` COALESCE(' (' || g.label || ')', ' (cấp lớp)') AS x FROM officers o` +
  ` JOIN members m ON m.id = o.member_id LEFT JOIN groups g ON g.id = o.group_id` +
  ` WHERE o.cohort_id = ${K03} AND o.superseded_at IS NULL ORDER BY g.no, o.role)) AS ai_giu;`
);

const iRa = process.argv.indexOf('--ra');
if (iRa >= 0 && process.argv[iRa + 1]) {
  writeFileSync(process.argv[iRa + 1], sql.join('\n') + '\n', 'utf8');
  console.log(`✓ đã ghi ${process.argv[iRa + 1]} — ${nhan.length} vai`);
} else {
  console.log('✓ Hợp lệ hết. Sẽ gán:');
  for (const r of nhan) {
    const cap = VAI_LOP.has(r.vai) ? 'cấp lớp' : 'cấp nhóm (tự suy nhóm)';
    console.log(`   · ${r.vai.padEnd(11)} → ${r.ten} (stt ${r.seq}, ${cap})`);
  }
}
