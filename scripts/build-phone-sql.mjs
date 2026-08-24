#!/usr/bin/env node
// Đọc scripts/data/bo-sung-dien-thoai.csv, kiểm tra, rồi sinh SQL cập nhật D1.
//
// Chạy tay:   node scripts/build-phone-sql.mjs            (chỉ kiểm, in báo cáo)
//             node scripts/build-phone-sql.mjs --ra x.sql (kiểm rồi ghi SQL)
// Workflow .github/workflows/bo-sung-dien-thoai.yml gọi bản --ra.
//
// Dùng chung normalizePhone/isValidVnPhone với Worker để hai bên không bao giờ
// hiểu khác nhau về "số này có hợp lệ không".

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { normalizePhone, isValidVnPhone } from '../worker/src/lib/phone.js';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const CSV = path.join(ROOT, 'scripts', 'data', 'bo-sung-dien-thoai.csv');

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

const dong = readFileSync(CSV, 'utf8').split('\n')
  .map(l => l.replace(/\r$/, ''))
  .filter(l => l.trim() && !l.trimStart().startsWith('#'));

const dau = tachDong(dong[0]);
if (dau[0] !== 'stt' || dau[2] !== 'so_dien_thoai') {
  console.error(`✗ Dòng tiêu đề phải là "stt,ho_ten,so_dien_thoai,..." — đang thấy: ${dong[0]}`);
  process.exit(1);
}

const nhan = [], loi = [], boQua = [];
for (const l of dong.slice(1)) {
  const [stt, ten, sdt] = tachDong(l);
  if (!sdt) { boQua.push(`${stt} ${ten}`); continue; }
  if (!isValidVnPhone(sdt)) { loi.push(`stt ${stt} (${ten}): "${sdt}" không phải số 10 chữ số bắt đầu bằng 0`); continue; }
  const seq = Number(stt);
  if (!Number.isInteger(seq) || seq <= 0) { loi.push(`stt "${stt}" không phải số`); continue; }
  nhan.push({ seq, ten, sdt: normalizePhone(sdt) });
}

// Trùng nhau NGAY TRONG tệp: hai người cùng một số thì bước tự nhận diện không
// phân biệt được ai với ai, nên chặn từ đây chứ đừng để lọt vào D1.
const theoSo = new Map();
for (const r of nhan) (theoSo.get(r.sdt) ?? theoSo.set(r.sdt, []).get(r.sdt)).push(r);
for (const [sdt, ds] of theoSo) {
  if (ds.length > 1) loi.push(`số ${sdt} bị dùng cho ${ds.length} người: ${ds.map(r => r.ten).join(', ')}`);
}

console.log(`Đọc ${dong.length - 1} dòng: ${nhan.length} có số, ${boQua.length} còn trống, ${loi.length} lỗi.`);
if (loi.length) {
  console.error('\n✗ Phải sửa những chỗ này trước:');
  for (const x of loi) console.error('   · ' + x);
  process.exit(1);
}
if (!nhan.length) { console.log('Chưa có dòng nào để nạp — điền cột so_dien_thoai rồi commit lại.'); process.exit(0); }

const K03 = `(SELECT id FROM cohorts WHERE code = 'K03')`;
const sql = [
  '-- Sinh tự động bởi scripts/build-phone-sql.mjs. Đừng sửa tay.',
  `-- ${nhan.length} số điện thoại bổ sung.`,
  '',
];
for (const r of nhan) {
  sql.push(`UPDATE roster SET phone = '${r.sdt}' WHERE cohort_id = ${K03} AND seq = ${r.seq};`);
  // Chỉ đồng bộ sang hồ sơ thành viên khi người đó CHƯA tự nhận hồ sơ. Ai đã
  // nhận rồi thì số trong hồ sơ là của chính họ sửa (nguyên tắc N5) — Ban tổ
  // chức không được đè lên.
  sql.push(
    `UPDATE members SET phone = '${r.sdt}', updated_at = datetime('now')` +
    ` WHERE claimed_at IS NULL AND roster_id = (SELECT id FROM roster WHERE cohort_id = ${K03} AND seq = ${r.seq});`
  );
}

const iRa = process.argv.indexOf('--ra');
if (iRa >= 0 && process.argv[iRa + 1]) {
  writeFileSync(process.argv[iRa + 1], sql.join('\n') + '\n', 'utf8');
  console.log(`✓ đã ghi ${process.argv[iRa + 1]} — ${nhan.length} người`);
} else {
  console.log(`✓ Hợp lệ hết. ${nhan.length} người sẽ được cập nhật:`);
  for (const r of nhan.slice(0, 10)) console.log(`   · ${r.ten} → ${r.sdt}`);
  if (nhan.length > 10) console.log(`   … và ${nhan.length - 10} người nữa`);
}
