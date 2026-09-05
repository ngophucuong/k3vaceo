// Đo thanh điều hướng sáu tab ở năm khổ màn hình.
//
//     node scripts/kiem/pw-nav.mjs
//
// Cần `wrangler dev` đang chạy và khối [assets] đã bật.
//
// ══ PHÉP ĐO NÀY ĐÃ TỪNG KHÔNG CÓ RĂNG — ĐỪNG VIẾT LẠI THEO CÁCH CŨ ════════
// Bản đầu đo CHIỀU CAO nút, đoán rằng nhãn quá dài sẽ xuống dòng thứ hai và
// đội nút cao lên. Nó báo xanh ở mọi khổ từ 300px tới 430px — kể cả những khổ
// mà nhãn đang tràn ra ngoài thật.
//
// Lý do: `.nb .lb` có `white-space:nowrap`, nên chữ dài KHÔNG xuống dòng mà
// TRÀN ra khỏi nút. Nút không cao lên. Và vì `.nb` có `min-width:0` nên phần
// tràn cũng không đẩy `.navin` rộng ra, tức `scrollWidth > clientWidth` của
// thanh nav cũng im lặng. Hai phép kiểm hiển nhiên nhất đều mù.
//
// Phép đo đứng vững là so bề rộng THẬT của chữ (`lb.scrollWidth`) với bề rộng
// dùng được của nút (`nb.clientWidth`).
//
// ══ HẠN CHẾ PHẢI NÓI RÕ ═══════════════════════════════════════════════════
// Sandbox không ra được internet nên Google Fonts không tải: phép đo chạy
// trên font dự phòng của hệ thống, KHÔNG phải Be Vietnam Pro. Font dự phòng
// rộng hơn, nên các con số dưới đây là BI QUAN — máy thật chỉ có thể rộng rãi
// hơn chứ không chật hơn. Đó là hướng sai an toàn.

import { chromium } from 'playwright-core';
let hong = 0;
const ok = (t, d, them = '') => {
  console.log((d ? '  ✓ ' : '  ✗ ') + t + (!d && them ? `\n      ${them}` : ''));
  if (!d) hong++;
};
const B = 'http://127.0.0.1:8787';
const COOKIE = { name: 's', value: 'kiemthu-giao-thuong-0001', domain: '127.0.0.1', path: '/' };

const b = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'],
});
const c = await b.newContext({ viewport: { width: 430, height: 800 }, deviceScaleFactor: 2 });
await c.addCookies([COOKIE]);
const p = await c.newPage();
await p.goto(B + '/#/gt', { waitUntil: 'networkidle' });
await p.waitForSelector('nav .nb');

// 320 = iPhone SE đời đầu · 360 = Android phổ thông · 390 = iPhone 12–15
// 412 = Pixel/Galaxy · 430 = iPhone Pro Max · 560 = máy tính bảng, khổ duy
// nhất đủ chỗ cho cả sáu nhãn (thanh nav chạm trần --wrap 520px ở đây).
for (const w of [320, 360, 390, 412, 430, 560]) {
  await p.setViewportSize({ width: w, height: 800 });
  await p.waitForTimeout(150);

  const d = await p.evaluate(() => {
    const nb = [...document.querySelectorAll('nav .nb')];
    return nb.map(n => {
      const lb = n.querySelector('.lb');
      const r = n.getBoundingClientRect();
      return {
        nhan: n.getAttribute('aria-label'),
        dangMo: n.classList.contains('on'),
        nutRong: Math.round(n.clientWidth),
        chuRong: Math.round(lb.scrollWidth),
        hienChu: getComputedStyle(lb).display !== 'none',
        cao: Math.round(r.height),
      };
    });
  });

  const hienChu = d.filter(x => x.hienChu);
  // Chỉ những nhãn ĐANG HIỆN mới cần vừa. Nhãn đã bị ẩn thì bề rộng của nó
  // không còn là vấn đề của ai.
  const tran = hienChu.filter(x => x.chuRong > x.nutRong);
  const cao = d.map(x => x.cao);

  console.log(`── ${w}px ──`);
  ok(`nhãn đang hiện đều vừa trong nút (${hienChu.length}/6 hiện chữ)`,
     tran.length === 0,
     tran.map(x => `"${x.nhan}" cần ${x.chuRong}px, nút ${x.nutRong}px`).join(' · '));
  // Tab đang mở PHẢI đọc được thành chữ ở mọi khổ: icon "Bài" và icon "Tư
  // liệu" đều là hình trang giấy, bỏ chữ hết thì không phân biệt được.
  ok('tab đang mở luôn có chữ', d.find(x => x.dangMo)?.hienChu === true);
  // Nút icon-only phải cao bằng nút có chữ, không thì nền trắng của tab đang
  // mở nhô lên và thanh nav trông như gãy.
  ok(`mọi nút cao bằng nhau (${cao[0]}px)`, new Set(cao).size === 1, cao.join('/'));
  ok(`vùng chạm ≥ 44px`, cao[0] >= 44, `${cao[0]}px — ngón tay sẽ bấm trượt sang tab bên cạnh`);
  ok('mọi nút đều có aria-label', d.every(x => x.nhan));

  await p.screenshot({ path: `/tmp/gt/nav-${w}.png`, clip: { x: 0, y: 800 - 78, width: w, height: 78 } });
}

// Đối chứng: bấm sang tab khác thì chữ phải CHUYỂN theo, không đứng lại ở tab
// cũ. Không có phép này thì một lỗi CSS ghim chữ vào đúng tab đầu vẫn đậu.
await p.setViewportSize({ width: 390, height: 800 });
await p.locator('nav .nb[data-v="quy"]').click();
await p.waitForTimeout(300);
const sauKhiBam = await p.evaluate(() => {
  const co = [...document.querySelectorAll('nav .nb')]
    .filter(n => getComputedStyle(n.querySelector('.lb')).display !== 'none');
  return { soTabCoChu: co.length, nhan: co.map(n => n.getAttribute('aria-label')) };
});
console.log('── bấm sang tab Quỹ ──');
ok('đúng một tab có chữ, và là tab vừa bấm',
   sauKhiBam.soTabCoChu === 1 && sauKhiBam.nhan[0] === 'Quỹ',
   JSON.stringify(sauKhiBam));

await b.close();
console.log(`\n${hong === 0 ? '✓ ĐÚNG HẾT' : `✗ ${hong} phép hỏng`}`);
process.exit(hong === 0 ? 0 : 1);
