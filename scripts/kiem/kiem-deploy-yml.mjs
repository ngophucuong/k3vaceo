// Canh MỘT bất biến của `.github/workflows/deploy.yml`, và chỉ một:
//
//   TRONG MỘT KHỐI `node -e '…'` KHÔNG ĐƯỢC CÓ DẤU NHÁY ĐƠN NÀO — kể cả trong
//   chuỗi JS, kể cả trong chú thích.
//
// Vì sao đáng có một bộ kiểm riêng cho đúng một dòng luật này: trong nháy đơn,
// shell KHÔNG có cơ chế thoát nào cả. Gặp nháy đơn thứ hai là nó ĐÓNG chuỗi
// ngay tại đó, phần tiếp theo rơi ra ngoài cho shell đọc như mã lệnh. Hệ quả
// thì tuỳ số lượng nháy đơn:
//
//   • số CHẴN và phần lọt ra không có ký tự đặc biệt → shell ghép lại thành
//     một chuỗi, trông như vẫn chạy — nhưng mọi dấu " trong phần lọt ra bị
//     ĂN MẤT, nên node nhận một chuỗi KHÁC thứ đọc thấy trong tệp;
//   • gặp `(` hay `)` trong phần lọt ra → `syntax error near unexpected token`
//     và cả bước kiểm chết.
//
// Cả hai đã xảy ra thật ở lượt deploy #111 (12/9): mã Worker lên hoàn toàn
// bình thường, migration áp xong, Pages xuất bản xong — chỉ có bước "Kiểm tra
// tên miền thật" tự chết. Đo lại bằng cách chặn `node` giả và bắt đúng chuỗi
// shell truyền vào: tệp có 4.542 byte, node chỉ nhận được 2.225.
//
// Quy tắc thay thế, dùng cho cả ba loại nội dung:
//   - chuỗi JS      → dùng nháy kép "…" hoặc backtick `…`
//   - nháy đơn trong DỮ LIỆU (câu SQL chẳng hạn) → viết '
//   - chú thích     → viết lại cho không có dấu nháy đơn
//
// Chạy:  node scripts/kiem/kiem-deploy-yml.mjs        (không cần máy chủ)

import { readFileSync, readdirSync } from 'node:fs';

const TEP = new URL('../../.github/workflows/deploy.yml', import.meta.url);
const src = readFileSync(TEP, 'utf8');

let hong = 0;
const ok = (t, d) => { console.log((d ? '  ✓ ' : '  ✗ ') + t); if (!d) hong++; };

// Quét theo DÒNG chứ không parse YAML: `node -e '` mở khối, và khối đóng ở
// dòng đầu tiên bắt đầu bằng một nháy đơn — kèm bất kỳ đuôi shell nào
// (`' || true`, `' || gt=1`, `' 2>/dev/null)`). Bản đầu của chính bộ kiểm này
// chỉ nhận hai đuôi `||`/`&&` nên khối MỞ ĐẦU (nằm trong `$( … )`, đóng bằng
// `' 2>/dev/null)`) coi như không bao giờ đóng, nuốt luôn 180 dòng shell phía
// sau và báo đỏ 25 dòng hoàn toàn hợp lệ. Thô nhưng không phụ thuộc thư viện
// YAML nào.
const dong = src.split('\n');
const khoi = [];
let dangMo = null;
dong.forEach((d, i) => {
  if (dangMo === null) {
    if (/node (?:--input-type=\S+ )?-e '\s*$/.test(d)) dangMo = { tu: i + 1, than: [] };
  } else if (/^\s*'(\s.*)?$/.test(d)) {
    khoi.push({ ...dangMo, den: i });
    dangMo = null;
  } else {
    dangMo.than.push({ so: i + 1, chu: d });
  }
});

console.log('── Khối `node -e` trong deploy.yml ──');
ok(`tìm thấy ${khoi.length} khối (phải ≥ 4)`, khoi.length >= 4);
ok('không khối nào bỏ ngỏ (mọi khối đều có dòng đóng)', dangMo === null);

console.log('\n── Bất biến: KHÔNG một dấu nháy đơn nào bên trong ──');
for (const k of khoi) {
  const ban = k.than.filter(l => l.chu.includes("'"));
  ok(`khối dòng ${k.tu}–${k.den} (${k.than.length} dòng)`, ban.length === 0);
  for (const l of ban) console.log(`      dòng ${l.so}: ${l.chu.trim().slice(0, 110)}`);
}

/* ══ CÙNG HỌ, CHỖ KHÁC: BACKTICK trong khối SQL của các script reset ═══════
   Trả giá 18/9. `reset-totnghiep.sh` bọc cả khối SQL trong một chuỗi NHÁY KÉP,
   mà trong nháy kép thì backtick là THAY THẾ LỆNH — shell chạy thứ nằm giữa
   hai backtick rồi nhét kết quả vào chỗ ấy. Hai dòng CHÚ THÍCH viết đúng theo
   nếp Markdown của repo này:

     -- `Unknown arguments: tự, tạo, hồ, sơ …`, còn reset thì lặng lẽ không chạy
     -- họ với bẫy nháy đơn trong khối `node -e` của deploy.yml (CLAUDE.md).

   khiến shell thật sự thử chạy hai lệnh ấy: `Unknown: command not found` và
   `node: -e requires an argument` in ra giữa lượt reset. Lần này SQL sống sót
   vì hai dòng đó là chú thích `--` nên mất chữ cũng vẫn là chú thích — nhưng
   đúng cùng một dòng chữ nằm trong một câu INSERT thì nó sửa thầm dữ liệu
   seed, và bộ kiểm sẽ đỏ ở một chỗ chẳng liên quan.

   Trớ trêu nhất: chính hai dòng chú thích ấy đang mô tả cái bẫy nháy kép mà
   script này vừa vấp bằng một cơ chế khác. Vì vậy có phép canh riêng. */
console.log('\n── Backtick trong khối SQL nháy kép của script reset ──');
const scripts = readdirSync(new URL('.', import.meta.url))
  .filter(f => /^(reset|gieo)-.*\.sh$/.test(f)).sort();
ok(`tìm thấy ${scripts.length} script reset/gieo (phải ≥ 5)`, scripts.length >= 5);
for (const f of scripts) {
  const s = readFileSync(new URL(f, import.meta.url), 'utf8');
  const xau = [];
  for (const m of s.matchAll(/--command "([\s\S]*?)"\s*(?:>|\n|$)/g)) {
    if (m[1].includes('`')) xau.push(s.slice(0, m.index).split('\n').length);
  }
  ok(`${f}`, xau.length === 0);
  for (const n of xau) console.log(`      khối --command mở ở dòng ${n} có backtick bên trong`);
}

console.log(hong ? `\n${hong} phép HỎNG` : '\nTất cả phép đối chứng đều xanh');
process.exit(hong ? 1 : 0);
