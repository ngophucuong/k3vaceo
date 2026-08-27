// Sinh coso.json — bảng "người nào CÓ số để đối chiếu", tính thẳng từ D1 bằng
// LUẬT của doiChieu() trong worker/src/routes/onboard.js.
//
// pw-vao-nhanh.mjs đối chiếu cờ co_so_doi_chieu mà searchRoster trả ra với
// bảng này. Hai bên lệch nhau thì màn /vao bảo "chưa có số" trong khi máy chủ
// vẫn đối chiếu được, hoặc ngược lại — và không chỗ nào báo lỗi.
//
// Tệp này TỰ SINH, không commit: nó chỉ đúng với dữ liệu đang nằm trong D1.
// Trước 27/8 nó nằm ở thư mục scratchpad, nên bộ kiểm commit vào repo không
// chạy nổi vì thiếu đúng một tệp không ai biết lấy ở đâu.
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const SQL = `SELECT r.id,
  (CASE WHEN COALESCE(r.phone, '') <> '' THEN 1
        WHEN EXISTS (SELECT 1 FROM members m
                      WHERE m.roster_id = r.id
                        AND COALESCE(m.phone, '') <> ''
                        AND m.phone_self_set_at IS NOT NULL) THEN 1
        ELSE 0 END) AS co_so
  FROM roster r WHERE r.cohort_id = (SELECT id FROM cohorts WHERE code = 'K03')`;

const out = execFileSync('npx',
  ['wrangler', 'd1', 'execute', 'k3vaceo', '--local', '--json', '--command', SQL],
  { cwd: new URL('../../worker', import.meta.url).pathname, encoding: 'utf8' });

// wrangler in kèm mấy dòng cảnh báo trước JSON, cắt từ dấu ngoặc vuông đầu tiên.
const rows = JSON.parse(out.slice(out.indexOf('[')))[0].results;
const bang = Object.fromEntries(rows.map(r => [String(r.id), r.co_so]));
writeFileSync(new URL('./coso.json', import.meta.url), JSON.stringify(bang));
console.log(`coso.json: ${rows.length} người, ${rows.filter(r => r.co_so).length} người có số`);
