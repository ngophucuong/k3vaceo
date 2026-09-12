// Trợ lý KHKD — routes/tro-ly.js, lib/llm.js, tro-ly/prompt.js (migration 0038).
//
// ĐIỀU PHẢI NÓI TRƯỚC, VÌ NÓ QUYẾT ĐỊNH BỘ KIỂM NÀY KIỂM ĐƯỢC GÌ: sandbox
// KHÔNG gọi được ra internet (`HTTP 403 Host not in allowlist: api.deepseek.com`
// trong log dev), nên KHÔNG một lượt hỏi đáp THẬT nào chạy được ở đây. Bộ kiểm
// vì thế chia đôi có ý thức:
//
//   • Kiểm được: mọi thứ đứng TRƯỚC lượt gọi ra ngoài (chốt N6, công tắc tắt,
//     hai tầng trần lượt, đọc lại phiên, đóng phiên), cộng nhánh HỎNG của
//     chính lượt gọi ấy.
//   • KHÔNG kiểm được: một câu trả lời thật của mô hình. Bằng chứng duy nhất
//     đáng tin cho việc ấy là một phiên thật trên tên miền — đúng bài học của
//     đường gửi thư ngày 24/8 ("thư nằm trong hộp thư, không phải một dòng log
//     nói rằng nó đã đi"). Đừng để bộ kiểm này xanh mà tưởng trợ lý đã chạy.
//
// Mười ba phép ĐỐI CHỨNG:
//   1. `/api/health` báo tro_ly.bat, và KHÔNG có mảnh nào của khoá trong phúc
//      đáp. Khác khoá VAPID (khoá công khai, in ra được), khoá LLM là khoá
//      TÍNH TIỀN — lộ một mảnh cũng là lộ. Quét chuỗi 'sk-' cho có răng bất kể
//      giá trị khoá là gì.
//   2. LỆCH NỀN TRI THỨC: `requirement` của tám phần trong D1 phải TRÙNG TỪNG
//      KÝ TỰ với YEU_CAU_PHAN trong worker/src/tro-ly/giao-trinh.js. Migration
//      0038 hứa hẳn trong chú thích rằng phép kiểm này tồn tại. Lệch thì học
//      viên đọc một thước trên màn hình còn trợ lý chấm bằng một thước khác —
//      không chỗ nào báo lỗi, chỉ có lời khuyên sai.
//  2b. LỆCH SỐ HIỆU PHẦN: trợ lý phải gọi phần bài đúng cái tên học viên đang
//      nhìn thấy ở tab Bài. `ord` chạy 0..7 với ord=0 là phần MỞ ĐẦU, nên bảy
//      phần đánh số của bản Word là ord 1..7 — giao diện in thẳng `s.ord`.
//      Trợ lý từng viết `ord + 1` (sửa 12/9): mở "Phần 1 · Nghiên cứu
//      Marketing" mà trợ lý dẫn dắt bằng "Phần 2", và bản thảo chốt xuống Ghi
//      chú cũng mang sai số. Cùng họ với phép 2 — không chỗ nào báo lỗi.
//   3. N6 — phiên của NHÓM KHÁC: cả bốn route (GET / hỏi / chốt / đóng) phải
//      trả 404, KHÔNG phải 403 (quy ước 6 CLAUDE.md). Kèm phép đối chứng
//      thuận: chính phiên của mình thì 200 — thiếu vế này thì một lỗi làm mọi
//      thứ 404 cũng lọt qua.
//   4. N6 — phần bài của NHÓM KHÁC: mở phiên gắn vào section_id của Nhóm 7 →
//      404. Đây là chốt ghi, không phải chốt đọc: thiếu điều kiện p.group_id
//      thì Nhóm 6 neo được phiên vào phần bài của Nhóm 7.
//   5. Đọc lại phiên trả đúng tin nhắn, đúng thứ tự, đúng vai.
//   6. Trần MỖI PHIÊN (30) → 409 phien_qua_dai, kèm `tran` để giao diện nói
//      được con số.
//   7. Trần MỖI NGƯỜI MỖI NGÀY (40) → 429 het_luot_hom_nay, và GET /api/tro-ly
//      của chính người ấy trả con_luot = false để giao diện biết đường.
//   8. Chốt bản thảo trên phiên KHÔNG gắn phần bài → 422 phien_khong_gan_phan.
//   9. Gửi rỗng → 422 noi_dung_required. section_id rác → 422 section_invalid.
//  10. NHÁNH HỎNG CỦA LƯỢT GỌI THẬT: 502 kèm `hong_o_buoc`. Đây là con mắt duy
//      nhất khi trợ lý hỏng trên tên miền thật (log Worker đã từng câm cả ngày,
//      CLAUDE.md), nên phải có phép kiểm giữ nó.
//  11. GỌI HỎNG KHÔNG ĐƯỢC ĐỂ LẠI RÁC: sau một lượt 502, số phiên KHÔNG tăng.
//      postPhien ghi dòng phiên SAU khi gọi xong — đảo thứ tự là mỗi lần mạng
//      chập để lại một phiên rỗng trong danh sách của nhóm.
//  12. GỌI HỎNG KHÔNG ĐƯỢC TÍNH VÀO HẠN MỨC: `ghiNhan` đứng sau `goi`. Đo
//      bằng một hồ sơ gieo sẵn ĐÚNG 39/40 lượt — nó qua cửa, gọi hỏng, mà
//      vẫn phải còn lượt. Sát mép một đơn vị nên phép kiểm có răng.
//  13. Đóng phiên → đọc lại thấy da_dong → hỏi tiếp thì 409 phien_da_dong.
//
// Và ba phép của lượt chạy "tắt" (`node kiem-tro-ly.mjs tat`):
//  14. Công tắc `cai_dat.tro_ly_bat = '0'` chặn được mở phiên / hỏi / chốt
//      (503 tro_ly_da_tat) mà KHÔNG cần deploy.
//  15. GET /api/tro-ly trả bat = false → giao diện ẩn hẳn thẻ trợ lý.
//  16. ĐÓNG phiên vẫn 200 dù trợ lý đang tắt — CỐ Ý: tắt trợ lý là chặn chỗ
//      TIÊU TIỀN, không phải khoá học viên lại trong một phiên không đóng được.
//
// Chạy:  bash scripts/kiem/reset-tro-ly.sh      && node scripts/kiem/kiem-tro-ly.mjs
//        bash scripts/kiem/reset-tro-ly.sh tat  && node scripts/kiem/kiem-tro-ly.mjs tat

import { readFileSync } from 'node:fs';
import { YEU_CAU_PHAN } from '../../worker/src/tro-ly/giao-trinh.js';
import { nhanPhan } from '../../worker/src/tro-ly/prompt.js';

const TAT = process.argv[2] === 'tat';
let hong = 0;
const ok = (t, d) => { console.log((d ? '  ✓ ' : '  ✗ ') + t); if (!d) hong++; };
const B = 'http://127.0.0.1:8787';
const IP = { 'cf-connecting-ip': '203.0.113.77' };

const ckCuong = 's=tk-cuong-troly';
const ckHet = 's=tk-hetluot-troly';
const ckKhac = 's=tk-nhomkhac-troly';
const ckSat = 's=tk-sattran-troly';

const get = (p, ck) => fetch(B + p, { headers: { cookie: ck, ...IP } });
const post = (p, ck, body) => fetch(B + p, {
  method: 'POST', headers: { cookie: ck, 'content-type': 'application/json', ...IP },
  body: JSON.stringify(body ?? {}),
});
const jget = async (p, ck) => (await get(p, ck)).json();

// CỐ Ý KHÔNG đọc thẳng D1 ở đây. Bản đầu của bộ kiểm này đếm rate_events bằng
// `npx wrangler d1 execute --local` giữa chừng — và đó đúng là cái bẫy CLAUDE.md
// đã ghi ("chạm D1 lúc nó đang chạy là nó chết"): lệnh ấy chạy xong thì dev
// server đứt, và request NGAY SAU nó chết với `UND_ERR_SOCKET: other side
// closed` — trông y như đường gọi LLM treo, trong khi thủ phạm là chính bộ
// kiểm. Nay mọi phép đều đi qua HTTP, và phép "gọi hỏng không tính vào hạn
// mức" đo bằng một hồ sơ gieo sẵn 39/40 lượt (xem phần dưới) thay vì đếm bảng.

// ── 0. Máy chủ có thật sự chạy, ba phiên thử có thật ─────────────────────
console.log(`── Máy chủ có thật sự chạy không (chế độ: ${TAT ? 'TẮT' : 'BẬT'}) ──`);
const health = await fetch(B + '/api/health').then(r => r.json()).catch(() => ({}));
ok(`/api/health trả roster_total = ${health.roster_total} (≥ 134)`, health.roster_total >= 134);

for (const [ten, ck] of [['Ngô Phú Cường', ckCuong], ['Kiểm Trợ Lý Hết Lượt', ckHet],
                         ['Kiểm Trợ Lý Nhóm Khác', ckKhac], ['Kiểm Trợ Lý Sát Trần', ckSat]]) {
  const r = await get('/api/tro-ly', ck);
  ok(`phiên ${ten} gọi /api/tro-ly được (${r.status})`, r.status === 200);
}

// ── 1. /api/health nói được trạng thái, và KHÔNG rò khoá ─────────────────
console.log('\n── /api/health: nói trạng thái, không rò khoá ──');
ok(`tro_ly.bat = ${health.tro_ly?.bat} (khoá đã tới Worker)`, health.tro_ly?.bat === true);
ok(`tro_ly.model = ${health.tro_ly?.model}`, typeof health.tro_ly?.model === 'string' && health.tro_ly.model.length > 0);
// HAI trường, HAI câu hỏi: `bat` là việc của deploy (khoá đã tới chưa),
// `cong_tac` là việc của vận hành (có đang bật không). Gộp một thì tắt trợ lý
// bằng một lệnh d1 mà deploy.yml vẫn xanh — phép kiểm này canh đúng chỗ ấy.
ok(`tro_ly.cong_tac = ${health.tro_ly?.cong_tac}, khớp với chế độ đang chạy`,
  health.tro_ly?.cong_tac === !TAT);
const chuoiHealth = JSON.stringify(health);
ok("không có chuỗi 'sk-' nào trong phúc đáp (khoá LLM là khoá TÍNH TIỀN, khác khoá công khai VAPID)",
  !chuoiHealth.includes('sk-'));
ok('không có trường nào tên chứa "key"/"khoa" trong khối tro_ly',
  !Object.keys(health.tro_ly ?? {}).some(k => /key|khoa/i.test(k)));

// LLM_BASE_URL chỉ được tồn tại trong .dev.vars (cổng đóng, để kiểm nhánh
// hỏng). Lọt vào wrangler.toml là bản THẬT gửi khoá tính tiền đi đâu đó khác
// api.deepseek.com — và `wrangler deploy` ghi đè toàn bộ vars bằng đúng tệp
// ấy, nên tệp ấy là nơi duy nhất cần canh.
const toml = readFileSync(new URL('../../worker/wrangler.toml', import.meta.url), 'utf8');
ok('wrangler.toml KHÔNG khai LLM_BASE_URL (bản thật phải gọi thẳng api.deepseek.com)',
  !/^\s*LLM_BASE_URL/m.test(toml));

// ── 2. LỆCH NỀN TRI THỨC: D1 vs giao-trinh.js ────────────────────────────
console.log('\n── Yêu cầu tám phần: D1 phải trùng TỪNG KÝ TỰ với giao-trinh.js ──');
const plan = await jget('/api/plan', ckCuong);
ok(`/api/plan trả ${plan.sections?.length} phần (8)`, plan.sections?.length === 8);
for (const y of YEU_CAU_PHAN) {
  const s = plan.sections?.find(x => x.ord === y.ord);
  const trung = s && s.requirement === y.yeu_cau;
  ok(`ord ${y.ord} · ${y.ten}${y.nguyen_van ? ' (nguyên văn chữ đỏ)' : ' (suy từ thước chấm PDF)'}`, trung);
  if (s && !trung) {
    console.log(`      D1  : ${JSON.stringify(String(s.requirement).slice(0, 90))}`);
    console.log(`      code: ${JSON.stringify(String(y.yeu_cau).slice(0, 90))}`);
  }
}

// ── 2b. SỐ HIỆU PHẦN: trợ lý phải gọi ĐÚNG cái tên học viên đang nhìn ────
// Cùng họ với phép kiểm ngay trên: hai chỗ phải trùng nhau, mà lệch thì không
// chỗ nào báo lỗi. `ord` chạy 0..7 với ord=0 là phần MỞ ĐẦU, nên bảy phần đánh
// số của bản Word là ord 1..7 — giao diện in thẳng `s.ord`. Trợ lý từng viết
// `ord + 1`: học viên mở "Phần 1 · Nghiên cứu Marketing" thì trợ lý dẫn dắt
// bằng "Phần 2", và bản thảo chốt xuống Ghi chú cũng mang sai số hiệu.
console.log('\n── Số hiệu phần bài: trợ lý phải trùng nhãn ở tab Bài ──');
const appjs = readFileSync(new URL('../../public/app.js', import.meta.url), 'utf8');
// Nếu giao diện đổi cách đánh số thì phép kiểm này phải ĐỎ để hai bên cùng
// được sửa — đó chính là việc của nó.
ok("giao diện vẫn in số phần bằng `s.ord` trần (không +1), và bỏ số ở ord=0",
  appjs.includes("s.ord === 0 ? '' : 'Phần ' + s.ord + ' · '"));
for (const y of YEU_CAU_PHAN) {
  const nhan = nhanPhan(y.ord, y.ten);
  const mong = y.ord === 0 ? y.ten : `Phần ${y.ord}. ${y.ten}`;
  ok(`ord ${y.ord} → "${nhan}"`, nhan === mong);
}
// Phép đối chứng có răng: đúng cái công thức cũ phải TRƯỢT ở đây.
ok('công thức cũ (ord + 1) bị bắt: "Phần 2" không bao giờ là Nghiên cứu Marketing',
  nhanPhan(1, 'Nghiên cứu Marketing') !== 'Phần 2. Nghiên cứu Marketing');
// Và số hiệu phải khớp với chính dòng D1 mà tab Bài đang vẽ, không chỉ khớp
// với hằng số trong giao-trinh.js.
const lechPhan = (plan.sections ?? []).filter(s2 => {
  const soTroLy = (nhanPhan(s2.ord, s2.title).match(/^Phần (\d+)\./) ?? [])[1] ?? '';
  const soGiaoDien = s2.ord === 0 ? '' : String(s2.ord);
  return soTroLy !== soGiaoDien;
});
ok(`tám phần trong D1: số hiệu trợ lý khớp số hiệu giao diện (lệch: ${lechPhan.length})`,
  lechPhan.length === 0);

// ── Tra id của ba phiên gieo sẵn ─────────────────────────────────────────
const tl6 = await jget('/api/tro-ly', ckCuong);
const tl7 = await jget('/api/tro-ly', ckKhac);
const pGanPhan = tl6.phien?.find(p => p.tieu_de === 'KIEMTL_Phần 2 gieo sẵn');
const pChamTran = tl6.phien?.find(p => p.tieu_de === 'KIEMTL_Phiên chạm trần');
const pNhom7 = tl7.phien?.find(p => p.tieu_de === 'KIEMTL_Phiên của Nhóm 7');
ok('fixture: ba phiên gieo sẵn đều có', !!(pGanPhan && pChamTran && pNhom7));
if (!pGanPhan || !pChamTran || !pNhom7) {
  console.log('\nThiếu fixture — chạy lại reset-tro-ly.sh.');
  process.exit(1);
}
ok('Nhóm 6 KHÔNG nhìn thấy phiên của Nhóm 7 trong danh sách của mình (N6 ngay ở tầng truy vấn)',
  !tl6.phien.some(p => p.id === pNhom7.id));

if (TAT) {
  // ══ Lượt chạy "tắt" ═══════════════════════════════════════════════════
  console.log('\n── Công tắc tắt (cai_dat.tro_ly_bat = 0) ──');
  ok('GET /api/tro-ly trả bat = false → giao diện ẩn hẳn thẻ trợ lý', tl6.bat === false);
  ok('con_luot = false khi đang tắt (không bày ra một con số vô nghĩa)', tl6.con_luot === false);

  for (const [ten, r] of [
    ['mở phiên', await post('/api/tro-ly/phien', ckCuong, {})],
    ['hỏi tiếp', await post(`/api/tro-ly/phien/${pGanPhan.id}/hoi`, ckCuong, { noi_dung: 'x' })],
    ['chốt bản thảo', await post(`/api/tro-ly/phien/${pGanPhan.id}/chot`, ckCuong, {})],
  ]) {
    const d = await r.json();
    ok(`${ten} → 503 tro_ly_da_tat (${r.status} ${d.error})`, r.status === 503 && d.error === 'tro_ly_da_tat');
  }

  const rDong = await post(`/api/tro-ly/phien/${pGanPhan.id}/dong`, ckCuong, {});
  ok(`ĐÓNG phiên vẫn 200 dù trợ lý đang tắt (${rDong.status}) — tắt là chặn chỗ TIÊU TIỀN, không phải khoá học viên trong một phiên không đóng được`,
    rDong.status === 200);

} else {
  // ══ Lượt chạy chính ═══════════════════════════════════════════════════

  // ── 3. N6: phiên của nhóm khác → 404 ở CẢ BỐN route ────────────────────
  console.log('\n── N6: phiên của Nhóm 7, Ngô Phú Cường chạm vào ──');
  const bonRoute = [
    ['GET phiên', await get(`/api/tro-ly/phien/${pNhom7.id}`, ckCuong)],
    ['POST hỏi', await post(`/api/tro-ly/phien/${pNhom7.id}/hoi`, ckCuong, { noi_dung: 'x' })],
    ['POST chốt', await post(`/api/tro-ly/phien/${pNhom7.id}/chot`, ckCuong, {})],
    ['POST đóng', await post(`/api/tro-ly/phien/${pNhom7.id}/dong`, ckCuong, {})],
  ];
  for (const [ten, r] of bonRoute) {
    ok(`${ten} → 404 not_found, KHÔNG phải 403 (${r.status})`, r.status === 404);
  }
  // Đối chứng THUẬN — thiếu vế này thì một lỗi làm mọi thứ 404 cũng lọt.
  const rMinh = await get(`/api/tro-ly/phien/${pGanPhan.id}`, ckCuong);
  ok(`đối chứng: phiên của CHÍNH mình → 200 (${rMinh.status})`, rMinh.status === 200);

  // ── 4. N6: phần bài của nhóm khác → 404 ở khâu GHI ─────────────────────
  console.log('\n── N6: mở phiên gắn vào phần bài của Nhóm 7 ──');
  const plan7 = await jget('/api/plan', ckKhac);
  const sec7 = plan7.sections?.[0];
  ok('fixture: Nhóm 7 có một plan_sections THẬT (id bịa chỉ chứng minh nhánh "không thấy")', !!sec7?.id);
  if (sec7?.id) {
    const r = await post('/api/tro-ly/phien', ckCuong, { section_id: sec7.id });
    ok(`mở phiên vào phần bài của Nhóm 7 → 404 (${r.status})`, r.status === 404);
  }

  // ── 5. Đọc lại phiên: đúng tin, đúng thứ tự, đúng vai ─────────────────
  console.log('\n── Đọc lại phiên đã lưu ──');
  const pd = await rMinh.json();
  ok(`giữ đủ 2 tin nhắn (${pd.tin?.length})`, pd.tin?.length === 2);
  ok('tin đầu là của NGƯỜI, tin sau là của TRỢ LÝ (đúng thứ tự thời gian)',
    pd.tin?.[0]?.vai === 'nguoi' && pd.tin?.[1]?.vai === 'tro_ly');
  ok('phiên gắn đúng phần bài và đang mở', !!pd.section_id && pd.trang_thai === 'dang_mo');

  // ── 6. Trần mỗi phiên ─────────────────────────────────────────────────
  console.log('\n── Hai tầng trần lượt ──');
  const rTran = await post(`/api/tro-ly/phien/${pChamTran.id}/hoi`, ckCuong, { noi_dung: 'hỏi tiếp' });
  const dTran = await rTran.json();
  ok(`phiên đã 30 lượt → 409 phien_qua_dai (${rTran.status} ${dTran.error})`,
    rTran.status === 409 && dTran.error === 'phien_qua_dai');
  ok(`kèm tran = ${dTran.tran} để giao diện nói được con số`, dTran.tran === 30);

  // ── 7. Trần mỗi người mỗi ngày ────────────────────────────────────────
  const tlHet = await jget('/api/tro-ly', ckHet);
  ok('người đã dùng 40 lượt hôm nay: GET /api/tro-ly trả con_luot = false', tlHet.con_luot === false);
  const rHet = await post('/api/tro-ly/phien', ckHet, {});
  const dHet = await rHet.json();
  ok(`mở phiên → 429 het_luot_hom_nay (${rHet.status} ${dHet.error})`,
    rHet.status === 429 && dHet.error === 'het_luot_hom_nay');
  ok('đối chứng: Ngô Phú Cường CÒN lượt (trần khoá theo member_id, không theo IP — cả lớp ngồi chung WiFi hội trường)',
    tl6.con_luot === true);

  // ── 8-9. Bốn nhánh 422 ────────────────────────────────────────────────
  console.log('\n── Bốn nhánh từ chối sớm (không tiêu một lượt gọi nào) ──');
  for (const [ten, r, ma] of [
    ['chốt bản thảo trên phiên KHÔNG gắn phần bài',
      await post(`/api/tro-ly/phien/${pChamTran.id}/chot`, ckCuong, {}), 'phien_khong_gan_phan'],
    ['gửi một câu rỗng',
      await post(`/api/tro-ly/phien/${pGanPhan.id}/hoi`, ckCuong, { noi_dung: '   ' }), 'noi_dung_required'],
    ['section_id không phải số',
      await post('/api/tro-ly/phien', ckCuong, { section_id: 'abc' }), 'section_invalid'],
    ['section_id âm',
      await post('/api/tro-ly/phien', ckCuong, { section_id: -5 }), 'section_invalid'],
  ]) {
    const d = await r.json();
    ok(`${ten} → 422 ${ma} (${r.status} ${d.error})`, r.status === 422 && d.error === ma);
  }

  // ── 10-12. Nhánh HỎNG của lượt gọi thật ───────────────────────────────
  console.log('\n── Lượt gọi thật hỏng (sandbox không ra được internet) ──');
  const soPhienTruoc = tl6.phien.length;

  const rGoi = await post('/api/tro-ly/phien', ckCuong, {});
  const dGoi = await rGoi.json();
  ok(`→ 502 tro_ly_loi (${rGoi.status} ${dGoi.error})`, rGoi.status === 502 && dGoi.error === 'tro_ly_loi');
  ok(`kèm hong_o_buoc = "${dGoi.hong_o_buoc}" — con mắt duy nhất khi log Worker câm`,
    typeof dGoi.hong_o_buoc === 'string' && dGoi.hong_o_buoc.length > 0);

  const tl6Sau = await jget('/api/tro-ly', ckCuong);
  ok(`gọi hỏng KHÔNG để lại phiên rỗng (${soPhienTruoc} → ${tl6Sau.phien.length})`,
    tl6Sau.phien.length === soPhienTruoc);

  // Hồ sơ gieo sẵn ĐÚNG 39/40 lượt: nó qua được cửa hạn mức (39 < 40), rồi
  // lượt gọi hỏng. Nếu `ghiNhan` chạy dù gọi hỏng thì sổ thành 40 và con_luot
  // lùi về false. Đo bằng một con số sát mép như vậy thì phép kiểm có răng,
  // mà vẫn không phải chạm D1 giữa lúc server đang chạy.
  const satTruoc = await jget('/api/tro-ly', ckSat);
  ok('fixture: hồ sơ sát trần còn lượt trước khi gọi (39/40)', satTruoc.con_luot === true);
  const rSat = await post('/api/tro-ly/phien', ckSat, {});
  ok(`hồ sơ sát trần: lượt gọi hỏng → 502 (${rSat.status})`, rSat.status === 502);
  const satSau = await jget('/api/tro-ly', ckSat);
  ok('gọi hỏng KHÔNG tính vào hạn mức (vẫn còn lượt sau lượt 502) — ghiNhan đứng SAU goi',
    satSau.con_luot === true);

  // ── 13. Đóng phiên ────────────────────────────────────────────────────
  // CỐ Ý đóng phiên "chạm trần" chứ không phải phiên gắn phần bài: pw-tro-ly.mjs
  // dùng CHUNG một lượt reset và cần phiên gắn phần bài còn MỞ để gõ vào ô
  // nhập. Đóng nhầm cái kia thì bộ kiểm giao diện chết bằng một cú Playwright
  // timeout 30 giây không nói được gì — đã tự vấp đúng vậy một lần.
  // `phien_da_dong` được kiểm TRƯỚC `phien_qua_dai` trong postHoi, nên phiên
  // 30 lượt vẫn trả đúng mã cần kiểm ở đây.
  console.log('\n── Đóng phiên ──');
  const rDong = await post(`/api/tro-ly/phien/${pChamTran.id}/dong`, ckCuong, {});
  ok(`đóng → 200 (${rDong.status})`, rDong.status === 200);
  const pSau = await jget(`/api/tro-ly/phien/${pChamTran.id}`, ckCuong);
  ok(`đọc lại thấy trang_thai = ${pSau.trang_thai}`, pSau.trang_thai === 'da_dong');
  const rHoiSau = await post(`/api/tro-ly/phien/${pChamTran.id}/hoi`, ckCuong, { noi_dung: 'hỏi tiếp' });
  const dHoiSau = await rHoiSau.json();
  ok(`hỏi tiếp vào phiên đã đóng → 409 phien_da_dong (${rHoiSau.status} ${dHoiSau.error})`,
    rHoiSau.status === 409 && dHoiSau.error === 'phien_da_dong');
  const pMo = await jget(`/api/tro-ly/phien/${pGanPhan.id}`, ckCuong);
  ok('phiên gắn phần bài vẫn MỞ sau cả lượt kiểm (pw-tro-ly.mjs dùng chung reset này)',
    pMo.trang_thai === 'dang_mo');
}

console.log(hong ? `\n${hong} phép HỎNG` : '\nTất cả phép đối chứng đều xanh');
console.log('Nhắc lại: bộ kiểm này KHÔNG chứng minh được một câu trả lời thật của mô hình — '
  + 'sandbox không gọi được ra internet. Bằng chứng duy nhất là một phiên thật trên tên miền.');
process.exit(hong ? 1 : 0);
