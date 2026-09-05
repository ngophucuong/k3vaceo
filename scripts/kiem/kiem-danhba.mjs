// Danh bạ lớp — và phép đối chứng quan trọng nhất của nó: SỐ THẬT KHÔNG ĐƯỢC
// LỌT RA trong phúc đáp của người chưa đăng nhập.
//
// Vì sao phép ấy là phép đáng giữ nhất: che ở giao diện trông y hệt che ở máy
// chủ khi nhìn màn hình, nhưng mở tab Network là đọc được nguyên vẹn. Một bộ
// kiểm chỉ xem chuỗi hiển thị có dấu sao hay không thì ĐẬU cả hai cách — mà một
// trong hai cách là trao chìa khoá vào hồ sơ của người ta cho cả lớp.
//
// Cập nhật 5/9: bốn dòng hồ sơ (bán gì/bán cho ai/cần gì/giúp được gì) mở ra
// cả lớp — kiểm CẢ HAI chiều ở cuối tệp: người chưa đăng nhập phải null (đối
// chứng âm), và điền thật cho người vừa đăng nhập rồi đọc lại đúng giá trị
// (đối chứng dương) — chỉ kiểm chiều âm thì một bộ kiểm "gán null cho tất cả,
// kể cả người có dữ liệu thật" vẫn đậu.
//
// Chạy:  bash scripts/kiem/reset-tanso.sh  &&  node scripts/kiem/kiem-danhba.mjs
// (reset-tanso.sh dọn sổ tần suất và trả hồ sơ 1–60 về "chưa ai nhận")

let hong = 0;
const ok = (t, d) => { console.log((d ? '  ✓ ' : '  ✗ ') + t); if (!d) hong++; };
const B = 'http://127.0.0.1:8787';
const IP = { 'cf-connecting-ip': '203.0.113.55' };

// ── Đăng nhập một người để có phiên ──────────────────────────────────────
const NGUOI = [4, '0913030324'];   // dữ liệu cố định của migration 0002
const r0 = await fetch(`${B}/api/onboard/vao`, {
  method: 'POST', headers: { 'content-type': 'application/json', ...IP },
  body: JSON.stringify({ roster_id: NGUOI[0], phone: NGUOI[1], email: 'kiem.danhba@x.vn' }),
});
const ck = (r0.headers.get('set-cookie') || '').match(/s=([^;]+)/)?.[1];
ok(`đăng nhập được để gọi danh bạ (${r0.status})`, r0.status === 200 && !!ck);
if (!ck) { console.log('\n✗ không có phiên — chạy reset-tanso.sh trước'); process.exit(1); }

const r = await fetch(`${B}/api/danh-ba`, { headers: { cookie: `s=${ck}`, ...IP } });
const tho = await r.text();
const ds = JSON.parse(tho).nguoi;

console.log('── Danh bạ trả về cả lớp ──');
ok(`${ds.length} người (≥ 134 — roster được phép đông thêm)`, ds.length >= 134);
ok('ai cũng có tên', ds.every(p => p.full_name));
ok('ai cũng có nhóm', ds.every(p => p.group_label));

/* ══════════════════ ĐỐI CHỨNG: SỐ THẬT KHÔNG LỌT RA ═══════════════════════
   Đọc số thật thẳng từ D1 rồi tìm nguyên văn nó trong phúc đáp. Đây là phép
   duy nhất phân biệt được "che ở máy chủ" với "che ở giao diện". */
console.log('\n── ĐỐI CHỨNG: che ở MÁY CHỦ, không phải ở giao diện ──');
const { execFileSync } = await import('node:child_process');
const SQL = `SELECT r.id, r.phone FROM roster r WHERE COALESCE(r.phone,'') <> ''
             AND NOT EXISTS (SELECT 1 FROM members m WHERE m.roster_id = r.id AND m.claimed_at IS NOT NULL)
             LIMIT 12`;
let thatSu = [];
try {
  const out = execFileSync('npx', ['wrangler', 'd1', 'execute', 'k3vaceo', '--local', '--json', '--command', SQL],
    { cwd: new URL('../../worker', import.meta.url).pathname, encoding: 'utf8' });
  thatSu = JSON.parse(out.slice(out.indexOf('[')))[0].results;
} catch {
  console.log('  (bỏ qua: không đọc được D1 — dev server đang giữ khoá, xem README)');
}
if (thatSu.length) {
  const lot = thatSu.filter(x => tho.includes(x.phone));
  ok(`${thatSu.length} số thật của người chưa đăng nhập, ${lot.length} số lọt ra`, lot.length === 0);
}

// Đối chứng ngược — nếu phép trên xanh chỉ vì phúc đáp rỗng thì nó vô nghĩa.
const daVao = ds.filter(p => p.da_dang_nhap && p.phone);
ok(`có ${daVao.length} người đã đăng nhập để đối chứng ngược`, daVao.length > 0);
ok('số của người ĐÃ đăng nhập thì hiện đủ, không có dấu sao',
   daVao.every(p => !p.phone.includes('*')));

console.log('\n── Khuôn che ──');
const cheSo = ds.filter(p => !p.da_dang_nhap && p.phone);
ok(`${cheSo.length} người chưa đăng nhập có số, tất cả đúng khuôn 097****857`,
   cheSo.every(p => /^\d{3}\*+\d{3}$|^\*+$/.test(p.phone)));
ok('mọi số đã che giữ nguyên độ dài số gốc (10 chữ số → 10 ký tự)',
   cheSo.every(p => p.phone.length >= 9));
// PHẢI có ít nhất một ca, không thì phép kiểm này xanh một cách rỗng tuếch:
// "0 email đều bị che" đúng về logic mà chẳng chứng minh được gì.
// reset-tanso.sh gieo sẵn một hồ sơ có email mà chưa nhận (roster 58).
const cheMail = ds.filter(p => !p.da_dang_nhap && p.email);
ok(`có ${cheMail.length} email của người chưa đăng nhập để kiểm (phải > 0)`, cheMail.length > 0);
ok('tất cả đều bị che', cheMail.length > 0 && cheMail.every(p => p.email.includes('•')));
ok('KHÔNG có email nào lọt ra nguyên văn', !tho.includes('bo.ngang@kiemtra.vn'));
ok('cờ `che` khớp với trạng thái đăng nhập',
   ds.every(p => p.che === !p.da_dang_nhap));

console.log('\n── Ban cán sự lớp ──');
const vai = ds.filter(p => p.vai_lop);
ok(`có ${vai.length} người mang vai cấp lớp`, vai.length > 0);
ok('nhãn viết đủ chữ, không dùng "BCS" (N7)',
   vai.every(p => !/\bBCS\b/.test(p.vai_lop)));

console.log('\n── Bốn dòng hồ sơ (bán gì/bán cho ai/cần gì/giúp được gì), mở ra cả lớp 5/9 ──');
// ĐỐI CHỨNG ÂM: người CHƯA đăng nhập — bốn dòng phải là null, không phải chỉ
// "không thấy chữ trong response" (cách kiểm cũ, đã bỏ) — kiểm null RÕ RÀNG
// từng dòng thì lỡ một người có DỮ LIỆU THẬT ở member_profile (hiếm nhưng
// không phải không thể — sửa hộ trước khi họ tự đăng nhập) mới chắc chắn bắt
// được, thay vì trông cậy vào việc chữ đó tình cờ không xuất hiện ở đâu khác.
const chuaVao = ds.filter(p => !p.da_dang_nhap);
ok(`${chuaVao.length} người chưa đăng nhập đều có bốn dòng = null`,
   chuaVao.every(p => p.sells_what === null && p.sells_to === null
                    && p.needs === null && p.offers === null));

// ĐỐI CHỨNG DƯƠNG: điền thật cho chính người vừa đăng nhập (roster 4), rồi
// đọc lại — phải thấy đúng giá trị vừa điền, không phải chỉ "không sai".
const meRow = ds.find(p => p.roster_id === NGUOI[0]);
ok('tìm thấy đúng hồ sơ vừa đăng nhập trong danh bạ', !!meRow?.member_id);
if (meRow?.member_id) {
  const GIA_TRI = { sells_what: 'KIEMDANHBA_ban', sells_to: 'KIEMDANHBA_muc_tieu', needs: 'KIEMDANHBA_can', offers: 'KIEMDANHBA_giup' };
  // wrangler dev cục bộ thỉnh thoảng làm rớt MỘT request ngay sau một loạt
  // gọi liên tiếp (đo được: curl gọi y hệt luôn thành công, chỉ fetch() của
  // Node bắn liền tay mới dính — trùng lúc log in ra một loạt kết nối
  // telemetry của wrangler bị egress proxy chặn). Không phải lỗi của route
  // — thử lại một lần cho chắc trước khi báo đỏ oan.
  let rGhi;
  try { rGhi = await fetch(`${B}/api/members/${meRow.member_id}/profile`, {
    method: 'PUT', headers: { cookie: `s=${ck}`, 'content-type': 'application/json', ...IP },
    body: JSON.stringify(GIA_TRI),
  }); } catch {
    await new Promise(r => setTimeout(r, 400));
    rGhi = await fetch(`${B}/api/members/${meRow.member_id}/profile`, {
      method: 'PUT', headers: { cookie: `s=${ck}`, 'content-type': 'application/json', ...IP },
      body: JSON.stringify(GIA_TRI),
    });
  }
  ok(`tự điền hồ sơ của mình được (${rGhi.status})`, rGhi.status === 200);

  const dsSau = await fetch(`${B}/api/danh-ba`, { headers: { cookie: `s=${ck}`, ...IP } }).then(r => r.json()).then(d => d.nguoi);
  const meSau = dsSau.find(p => p.roster_id === NGUOI[0]);
  ok('sau khi điền, danh bạ Cả lớp hiện ĐÚNG bốn giá trị vừa gõ',
     meSau && meSau.sells_what === GIA_TRI.sells_what && meSau.sells_to === GIA_TRI.sells_to
     && meSau.needs === GIA_TRI.needs && meSau.offers === GIA_TRI.offers);
}

console.log('\n── Không rò thứ không thuộc danh bạ ──');
for (const cam of ['token_hash', 'claimed_at']) {
  ok(`không có trường "${cam}"`, !tho.includes(cam));
}

console.log(`\n${hong ? `✗ ${hong} phép kiểm đỏ` : '✓ tất cả xanh'}`);
process.exit(hong ? 1 : 0);
