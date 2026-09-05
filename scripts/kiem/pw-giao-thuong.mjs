// Kiểm tab Giao thương trong ứng dụng và trang công khai /giao-thuong.
//
//     bash scripts/kiem/gieo-giao-thuong.sh     # TRƯỚC khi chạy dev server
//     cd worker && npx wrangler dev --port 8787 --local
//     node scripts/kiem/pw-giao-thuong.mjs
//
// Cần khối [assets] trong wrangler.toml được bật, nếu không thì `/` trả JSON.
// Phép kiểm đầu tiên bắt đúng chuyện đó — xem scripts/kiem/README.md, mục
// "bộ kiểm báo sạch trên một trang chưa hề nạp".

import { chromium } from 'playwright-core';
let hong = 0;
const ok = (t, d, them = '') => {
  console.log((d ? '  ✓ ' : '  ✗ ') + t + (!d && them ? `\n      ${them}` : ''));
  if (!d) hong++;
};
const B = 'http://127.0.0.1:8787';
const COOKIE = { name: 's', value: 'kiemthu-giao-thuong-0001', domain: '127.0.0.1', path: '/' };
const ANH = process.env.ANH_DIR || '/tmp/gt';

const b = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'],
});

/* Gian hàng chuẩn của Ngô Phú Cường. Bộ kiểm tự đặt lại trạng thái này ở đầu
   và cuối, nên chạy lại được nhiều lần — kể cả sau một lượt chạy đứt giữa
   chừng. PUT thay TOÀN BỘ hồ sơ (không phải vá từng trường), nên phải gửi đủ
   mọi ô; gửi thiếu là xoá trắng ô ấy. */
const CHUAN = {
  sells_what: 'Vận tải container Bắc – Nam',
  sells_to: 'Nhà máy sản xuất, công ty xuất nhập khẩu',
  needs: 'Phần mềm quản lý kho',
  offers: 'Kho bãi tại Hải Phòng',
  nganh: ['van-tai', 'thuong-mai'],
  mo_ta: 'Đội xe 20 đầu kéo, chạy tuyến Hải Phòng – Đà Nẵng – TP.HCM.',
  website: 'https://vantai-vd.test',
  cong_khai: true, hien_lien_he: false,
};
const datGianHang = (obj) => fetch(B + '/api/me/giao-thuong', {
  method: 'PUT',
  headers: { 'content-type': 'application/json', cookie: `s=${COOKIE.value}` },
  body: JSON.stringify(obj),
}).then(r => r.json());

await datGianHang(CHUAN);

/* ══ 1. TRANG CÔNG KHAI — context SẠCH, không cookie ═══════════════════════ */
console.log('── Trang /giao-thuong/ : người lạ, không đăng nhập ──');
{
  const c = await b.newContext({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 2 });
  const p = await c.newPage();
  const loi = [];
  p.on('pageerror', e => loi.push(String(e)));
  await p.goto(B + '/giao-thuong/', { waitUntil: 'networkidle' });

  // Khẳng định trang THẬT SỰ nạp trước đã. Không có phép này thì mọi phép
  // dưới đây vẫn "đậu" trên một trang trắng.
  ok('trang nạp được (có thẻ .ds)', await p.locator('.ds').count() > 0);
  ok('không lỗi JS', loi.length === 0, loi[0]);

  const chu = await p.locator('body').innerText();
  ok('thấy người đã bật công khai (Trần Văn Kho)', chu.includes('Trần Văn Kho'));
  ok('thấy người bật công khai mà tắt liên hệ (Lê Thị Bao Bì)', chu.includes('Lê Thị Bao Bì'));

  // ĐỐI CHỨNG QUAN TRỌNG NHẤT của cả bộ: người CHƯA bật phải vắng mặt hoàn
  // toàn. Nếu chốt cong_khai hỏng thì không có gì kêu lên — trang vẫn đẹp,
  // chỉ là có thêm người không muốn ở đó.
  ok('người CHƯA bật công khai vắng mặt (Phạm Nhà Máy)', !chu.includes('Phạm Nhà Máy'),
     'rò dữ liệu: chốt cong_khai không đứng');

  // Rò số điện thoại là lỗi im lặng thứ hai: người ấy vẫn ở đúng chỗ, chỉ
  // thừa ra một dòng mà họ đã chọn không đưa.
  const html = await p.content();
  ok('KHÔNG rò số của người tắt liên hệ (0900000901)', !html.includes('0900000901'),
     'rò số điện thoại: chốt hien_lien_he không đứng');
  ok('có số của người ĐÃ bật liên hệ (0900000900)', html.includes('0900000900'));

  ok('lọc theo ngành hiện ra', await p.locator('#chip .fc').count() > 1);
  ok('có ô tìm', await p.locator('#tim').count() === 1);

  // Tìm không dấu phải ra kết quả có dấu.
  await p.fill('#tim', 'bao bi');
  await p.waitForTimeout(200);
  const sauTim = await p.locator('.ds').innerText();
  ok('gõ không dấu "bao bi" vẫn ra "Lê Thị Bao Bì"', sauTim.includes('Lê Thị Bao Bì'));
  ok('  và lọc bỏ người khác', !sauTim.includes('Trần Văn Kho'));
  await p.fill('#tim', '');
  await p.waitForTimeout(200);

  await p.screenshot({ path: `${ANH}/cong-khai.png`, fullPage: true });
  await c.close();
}

/* ══ 2. TAB GIAO THƯƠNG trong ứng dụng ════════════════════════════════════════ */
console.log('── Tab Giao thương: đã đăng nhập ──');
{
  const c = await b.newContext({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 2 });
  await c.addCookies([COOKIE]);
  const p = await c.newPage();
  const loi = [];
  p.on('pageerror', e => loi.push(String(e)));
  await p.goto(B + '/#/gt', { waitUntil: 'networkidle' });
  await p.waitForTimeout(900);

  ok('ứng dụng nạp được (có thanh nav)', await p.locator('nav .nb').count() > 0);
  ok('có đúng 6 tab', await p.locator('nav .nb').count() === 6);
  ok('không lỗi JS', loi.length === 0, loi[0]);
  ok('tab Giao thương đang mở', await p.locator('#v-gt.on').count() === 1);

  const chu = await p.locator('#v-gt').innerText();

  // Đây là phép kiểm cho quyết định bỏ N6: người của nhóm 6 phải thấy được
  // gian hàng của nhóm 7, 8, 9. Trước ngày 5/9 điều này là VI PHẠM.
  ok('thấy người nhóm 7 (Trần Văn Kho)', chu.includes('Trần Văn Kho'));
  ok('thấy người nhóm 8 (Lê Thị Bao Bì)', chu.includes('Lê Thị Bao Bì'));
  ok('thấy người nhóm 9 (Phạm Nhà Máy)', chu.includes('Phạm Nhà Máy'),
     'N6 vẫn đang chặn — đường /api/giao-thuong lọc nhầm theo group_id');
  ok('có nhãn nhóm trên thẻ', await p.locator('#v-gt .gtn').count() >= 3);

  // Gợi ý phải GIẢI THÍCH ĐƯỢC. Một danh sách tên không kèm lý do thì không
  // ai bấm, và đó là toàn bộ giá trị của phần ghép nối.
  // Đúng BA gợi ý, mỗi cái một chiều khác nhau — dữ liệu gieo dựng riêng cho
  // việc này. Chỉ kiểm "> 0" thì một thuật toán chỉ tìm được một chiều vẫn
  // đậu, mà đó lại là cách hỏng dễ xảy ra nhất.
  ok('có đúng 3 gợi ý', await p.locator('#v-gt .gtg').count() === 3,
     `thấy ${await p.locator('#v-gt .gtg').count()} — mỗi người khớp một chiều khác nhau`);
  for (const vs of ['Họ đang cần thứ bạn bán', 'Họ có thứ bạn đang cần', 'Họ đúng loại khách bạn tìm']) {
    ok(`  có chiều "${vs}"`, chu.includes(vs));
  }
  ok('gợi ý nêu chữ trùng', chu.includes('cùng nhắc tới'));

  // "Đang cần" phải là khối cam — với người đọc thì đó là chỗ HỌ bán được
  // hàng. Xanh --go trong sản phẩm này chỉ có một nghĩa: xong.
  ok('khối "Đang cần" hiện ra', await p.locator('#v-gt .gtcan').count() > 0);

  await p.screenshot({ path: `${ANH}/tab-giao-thuong.png`, fullPage: true });

  // Lọc theo ngành, không gọi lại máy chủ.
  const truoc = await p.locator('#v-gt .gtc').count();
  await p.locator('#v-gt .fc[data-ng="cong-nghe"]').click();
  await p.waitForTimeout(250);
  const sau = await p.locator('#v-gt .gtc').count();
  ok(`lọc ngành thu hẹp danh sách (${truoc} → ${sau})`, sau < truoc && sau > 0);
  await p.locator('#v-gt .fc[data-ng="tat-ca"]').click();
  await p.waitForTimeout(250);

  /* ── Sheet sửa gian hàng ── */
  console.log('── Sheet gian hàng: hai công tắc mức lộ ──');
  await p.locator('#gtSua').click();
  await p.waitForTimeout(400);
  ok('sheet mở ra', await p.locator('.sheet #gCK').count() === 1);

  const sheet = await p.locator('.sheet').innerText();
  // Câu này là điều kiện để việc bật công khai là một lựa chọn có hiểu biết.
  // Bỏ nó đi thì người ta bật mà không biết mình vừa bật cái gì.
  ok('công tắc nói rõ "Google tìm thấy được"', sheet.includes('Google tìm thấy được'),
     'thiếu câu cảnh báo ở đúng chỗ người ta bấm');
  // Đọc số thật từ API rồi khẳng định sheet in đúng số ấy — KHÔNG viết cứng
  // một chuỗi số vào đây. Viết cứng thì phép kiểm hỏng mỗi lần dữ liệu đổi,
  // và tệ hơn: nó vẫn đậu nếu giao diện in nhầm số của người khác.
  const dl = await p.evaluate(() => fetch('/api/giao-thuong').then(r => r.json()));
  const soThat = dl.toi?.phone ?? '';
  ok(`nói rõ số điện thoại nào sẽ hiện (${soThat})`,
     !!soThat && sheet.includes(soThat),
     'người ta phải NHÌN THẤY số của mình trước khi bấm đưa nó ra internet');

  // Ô "kèm liên hệ" phải mờ khi chưa bật công khai — nhưng KHÔNG được giấu,
  // vì giấu thì người ta tưởng số mình mặc nhiên ra theo.
  await p.locator('.sheet #gCK').uncheck();
  await p.waitForTimeout(200);
  ok('tắt công khai → ô liên hệ mờ đi', await p.locator('.sheet #gLHWrap.mo').count() === 1);
  ok('  nhưng vẫn nhìn thấy', await p.locator('.sheet #gLH').isVisible());
  await p.locator('.sheet #gCK').check();
  await p.waitForTimeout(200);
  ok('bật lại → hết mờ', await p.locator('.sheet #gLHWrap.mo').count() === 0);

  ok('chọn được ngành', await p.locator('.sheet [data-ma]').count() === 19);
  await p.screenshot({ path: `${ANH}/sheet-gian-hang.png`, fullPage: true });
  await p.locator('.sheet #gHuy').click();
  await p.waitForTimeout(300);

  /* ── HỒI QUY: form phải đọc lại từ máy chủ, không tin bộ nhớ ──────────────
     Bốn ô đầu dùng chung với hồ sơ ở tab Nhóm. Kịch bản có thật: mở tab Kết
     nối (nạp GT), sửa "bán gì" ở chỗ khác, rồi quay lại bấm Sửa — nếu form
     dựng từ GT cũ thì bấm Lưu là ghi đè bản mới bằng bản cũ. Đúng loại lỗi
     mất dữ liệu đã xảy ra ở Đợt 1 với form sửa hồ sơ.

     Ở đây giả lập bằng cách đổi dữ liệu SAU LƯNG trang đang mở, rồi mở form
     và xem nó hiện bản nào. */
  console.log('── Hồi quy: form đọc lại từ máy chủ ──');
  const MOI = 'Vận tải container Bắc – Nam · đổi sau lưng';
  await datGianHang({ ...CHUAN, sells_what: MOI });
  await p.locator('#gtSua').click();
  await p.waitForTimeout(600);
  const oBanGi = await p.locator('.sheet #gA').inputValue();
  ok('form hiện bản MỚI nhất, không phải bản trong bộ nhớ', oBanGi === MOI,
     `form đang hiện "${oBanGi}" — mở form từ bộ nhớ đệm, bấm Lưu sẽ xoá mất bản mới`);
  await p.locator('.sheet #gHuy').click();

  await c.close();
}

// Trả gian hàng về trạng thái chuẩn để lượt chạy sau không thấy dữ liệu thừa
// của lượt này (nếp: bộ kiểm phải chạy lại được nhiều lần).
await datGianHang(CHUAN);

await b.close();
console.log(`\n${hong === 0 ? '✓ ĐÚNG HẾT' : `✗ ${hong} phép hỏng`}`);
process.exit(hong === 0 ? 0 : 1);
