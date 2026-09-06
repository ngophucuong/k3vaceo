// Danh mục giao thương công khai. Không gọi API nào cần phiên, và không dùng
// lại mã của app.js — tệp này chạy độc lập, đúng như /lich/lich.js.
//
// CSP `script-src 'self'` (public/_headers) chặn thẳng script nội dòng, nên
// tệp này BẮT BUỘC phải rời. Nhét vào <script> trong index.html thì trang
// trắng và không báo gì cả.

// esc() phải thoát CẢ HAI loại nháy, không chỉ < > &: chuỗi đi vào bên trong
// thuộc tính HTML (title=", href="), và bỏ sót dấu nháy là mở lỗ XSS lưu trữ.
// Đã từng xảy ra qua liên kết trong Kho.
const ESC = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' };
const esc = s => String(s ?? '').replace(/[<>&"']/g, c => ESC[c]);

// Bỏ dấu để gõ không dấu vẫn tìm ra. 'đ' không phải dấu tổ hợp nên NFD không
// tách được — phải thay riêng, nếu không thì gõ "duong" không ra "Đường".
const boDau = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();

const ini = n => {
  const t = String(n ?? '').trim().split(/\s+/);
  return ((t[0]?.[0] ?? '') + (t.length > 1 ? t[t.length - 1][0] : '')).toUpperCase();
};
const hue = n => { let h = 0; for (const c of String(n ?? '')) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };

// Phòng thủ lớp hai cho href. Máy chủ đã chặn mọi thứ không phải https khi
// ghi (routes/giao-thuong.js), nhưng chuỗi này đi thẳng vào href — và
// 'javascript:...' thì esc() KHÔNG cứu được, vì nó không chứa ký tự HTML nào
// để mà thoát. Một lớp kiểm ở nơi dùng là rẻ, và nó vẫn đứng nếu luật phía
// máy chủ có ngày bị nới ra.
const anToan = u => /^https:\/\/[^\s/]+\./i.test(String(u ?? '')) ? u : null;

const ICON = {
  goi: '<svg viewBox="0 0 20 20"><path d="M4 3h3l1.5 4-2 1.5a10 10 0 005 5L13 11.5 17 13v3a1 1 0 01-1 1A13 13 0 013 4a1 1 0 011-1z"/></svg>',
  thu: '<svg viewBox="0 0 20 20"><rect x="2.5" y="4.5" width="15" height="11" rx="2"/><path d="M3 6l7 5 7-5"/></svg>',
  web: '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="7.5"/><path d="M2.5 10h15M10 2.5a12 12 0 010 15 12 12 0 010-15"/></svg>',
};

// Trạng thái để NGOÀI hàm vẽ: bấm chip hay gõ tìm chỉ sửa state rồi vẽ lại,
// không gọi lại máy chủ. Cùng nếp với hàng chip ở sổ thu — danh mục nhiều
// nhất 134 dòng và đã tải sẵn, thêm một vòng mạng mỗi lần bấm là phí.
let DL = null;
let LOC = { nganh: 'tat-ca', tim: '' };

function veThe(p, tenNganh) {
  const web = anToan(p.website);
  const lh = [];
  if (p.phone) lh.push(`<a class="chinh" href="tel:${esc(p.phone.replace(/[^\d+]/g, ''))}">${ICON.goi}Gọi</a>`);
  if (p.email) lh.push(`<a href="mailto:${esc(p.email)}">${ICON.thu}Email</a>`);
  // rel="nofollow noopener": đây là liên kết do người dùng tự khai, không
  // phải liên kết ứng dụng bảo chứng.
  if (web) lh.push(`<a href="${esc(web)}" target="_blank" rel="nofollow noopener">${ICON.web}Website</a>`);

  const noi = [p.title, p.company].filter(Boolean).map(esc).join(' · ');

  return `<article class="g">
    <div class="dau">
      <span class="av" style="background:hsl(${hue(p.full_name)} 34% 42%)">${esc(ini(p.full_name))}</span>
      <div style="min-width:0">
        <div class="ten">${esc(p.full_name)}</div>
        ${noi ? `<div class="noi">${noi}</div>` : ''}
        ${p.nganh?.length ? `<div class="nganh">${p.nganh.map(m =>
          `<span class="tg">${esc(tenNganh.get(m) ?? m)}</span>`).join('')}</div>` : ''}
      </div>
    </div>
    ${p.sells_what ? `<div class="ban"><span class="k">Bán gì</span>${esc(p.sells_what)}</div>` : ''}
    ${p.sells_to ? `<div class="phu"><span class="k">Bán cho ai</span>${esc(p.sells_to)}</div>` : ''}
    ${p.offers ? `<div class="phu"><span class="k">Giúp được gì</span>${esc(p.offers)}</div>` : ''}
    ${p.mo_ta ? `<div class="tas">${esc(p.mo_ta)}</div>` : ''}
    ${p.needs ? `<div class="can"><span class="k">Đang cần</span>${esc(p.needs)}</div>` : ''}
    ${lh.length ? `<div class="lh">${lh.join('')}</div>` : ''}
  </article>`;
}

function ve() {
  const ds = document.getElementById('ds');
  const tong = document.getElementById('tong');
  const tenNganh = new Map((DL.nganh_list ?? []).map(n => [n.ma, n.ten]));
  const nguoi = DL.nguoi ?? [];

  if (!nguoi.length) {
    document.getElementById('loc').hidden = true;
    ds.innerHTML = `<div class="trong">
      <p class="t">Chưa có gian hàng nào được công khai</p>
      <p class="d">Danh mục này chỉ hiện những học viên đã tự bật công khai trong ứng dụng.
        Nếu bạn học K03, bạn là người đầu tiên được — mở ứng dụng, điền bán gì và bán cho ai,
        rồi bật công tắc công khai.</p>
    </div>`;
    tong.hidden = true;
    return;
  }

  // Chỉ dựng chip cho ngành CÓ người. Chip trỏ vào danh sách rỗng thì bấm vào
  // là màn trắng, và người ta tưởng trang hỏng chứ không nghĩ là chưa ai chọn
  // ngành ấy.
  const dem = new Map();
  for (const p of nguoi) for (const m of p.nganh ?? []) dem.set(m, (dem.get(m) ?? 0) + 1);
  const chips = [['tat-ca', 'Tất cả', nguoi.length]].concat(
    (DL.nganh_list ?? []).filter(n => dem.has(n.ma)).map(n => [n.ma, n.ten, dem.get(n.ma)]));
  document.getElementById('chip').innerHTML = chips.map(([ma, ten, n]) =>
    `<button class="fc ${LOC.nganh === ma ? 'on' : ''}" data-nganh="${esc(ma)}">${esc(ten)} <span class="num">${n}</span></button>`
  ).join('');
  document.getElementById('loc').hidden = false;

  const q = boDau(LOC.tim).trim();
  const hien = nguoi.filter(p => {
    if (LOC.nganh !== 'tat-ca' && !(p.nganh ?? []).includes(LOC.nganh)) return false;
    if (!q) return true;
    // Tìm trên mọi ô chữ, kể cả tên ngành: gõ "vận tải" phải ra cả người chọn
    // ngành Vận tải lẫn người viết "vận tải" trong ô bán gì.
    const kho = boDau([p.full_name, p.title, p.company, p.sells_what, p.sells_to,
      p.needs, p.offers, p.mo_ta, ...(p.nganh ?? []).map(m => tenNganh.get(m))]
      .filter(Boolean).join(' '));
    return q.split(/\s+/).every(t => kho.includes(t));
  });

  ds.innerHTML = hien.length
    ? hien.map(p => veThe(p, tenNganh)).join('')
    : `<div class="trong"><p class="t">Không có ai khớp</p>
       <p class="d">Thử bớt chữ trong ô tìm, hoặc chọn lại “Tất cả”.</p></div>`;

  tong.hidden = false;
  tong.textContent = hien.length === nguoi.length
    ? `${nguoi.length} gian hàng đang công khai.`
    : `Hiện ${hien.length} trong ${nguoi.length} gian hàng.`;

  document.querySelectorAll('#chip [data-nganh]').forEach(b => {
    b.onclick = () => { LOC.nganh = b.dataset.nganh; ve(); };
  });
}

async function nap() {
  const ds = document.getElementById('ds');
  try {
    const r = await fetch('/api/giao-thuong/cong-khai');
    if (!r.ok) throw new Error(String(r.status));
    DL = await r.json();
  } catch {
    ds.innerHTML = `<p class="dangtai">Chưa tải được danh mục. Kiểm tra kết nối rồi tải lại trang.</p>`;
    return;
  }
  ve();
}

// Ô tìm gắn MỘT lần ở đây, không gắn lại trong ve(): vẽ lại mà thay phần tử
// input thì con trỏ nhảy về đầu ô và bàn phím điện thoại đóng lại — gõ được
// hai chữ là bỏ cuộc.
document.getElementById('tim').addEventListener('input', e => {
  LOC.tim = e.target.value;
  if (DL) ve();
});

nap();

// Quay lại trang thì nạp lại, có chốt 30 giây. Cố ý không setInterval: gọi
// máy chủ đều đặn suốt ngày là phí, và pin điện thoại trả giá.
let lanCuoi = Date.now();
const lamMoi = () => {
  if (document.hidden || Date.now() - lanCuoi < 30000) return;
  lanCuoi = Date.now();
  nap();
};
document.addEventListener('visibilitychange', lamMoi);
window.addEventListener('focus', lamMoi);
