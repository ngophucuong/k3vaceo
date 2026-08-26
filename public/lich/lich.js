// Lịch công khai — không cần đăng nhập, không gọi API nào cần phiên.
//
// CSP của _headers đặt `script-src 'self'`, nên tệp này BẮT BUỘC nằm rời. Đưa
// vào <script> nội dòng là bị chặn thẳng, trang trắng mà không báo gì.
'use strict';

// Thoát cả " và ' — chuỗi được nhúng vào thuộc tính HTML, bỏ sót dấu nháy là
// mở lỗ XSS lưu trữ (quy ước 2 CLAUDE.md; đã từng xảy ra qua liên kết Kho).
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const THU = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];

// '2026-08-27' → {d:27, t:'Th 5', thu:'Thứ năm', dm:'27/8'}
// Dựng bằng Date.UTC rồi đọc bằng getUTCDay: nếu dùng new Date('2026-08-27')
// thì trình duyệt hiểu là nửa đêm UTC, và ở múi giờ âm sẽ lùi thành hôm trước
// — thứ trong tuần hiện sai một ngày mà không ai để ý.
function docNgay(s) {
  const [y, m, d] = String(s).split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  const thu = THU[t.getUTCDay()];
  return { d, m, thu, t: thu.replace('Thứ ', 'Th ').replace('Chủ nhật', 'CN'), dm: `${d}/${m}` };
}

// Số ngày từ a đến b, cả hai dạng 'YYYY-MM-DD'. Tính bằng UTC để không dính
// giờ mùa hè của múi giờ máy người xem.
function soNgay(a, b) {
  const g = s => { const [y, m, d] = String(s).split('-').map(Number); return Date.UTC(y, m - 1, d); };
  return Math.round((g(b) - g(a)) / 86400000);
}

function gioText(b) {
  if (!b.tu_gio) return '';
  return b.den_gio ? `${b.tu_gio}–${b.den_gio}` : `từ ${b.tu_gio}`;
}

function veBuoi(b, homNay) {
  const n = docNgay(b.ngay);
  const laNay = b.ngay === homNay;
  const daQua = b.ngay < homNay;
  const gio = gioText(b);
  const phu = [
    gio ? `<span class="gio">${esc(gio)}</span>` : null,
    b.giang_vien ? esc(b.giang_vien) : null,
    b.ghi_chu ? esc(b.ghi_chu) : null,
  ].filter(Boolean).join(' · ');

  const cls = ['b', laNay ? 'naydau' : '', daQua && !laNay ? 'qua' : '', b.da_huy ? 'dahuy' : '']
    .filter(Boolean).join(' ');
  const chip = b.da_huy ? '<span class="chip huy">đã huỷ</span>'
             : laNay ? '<span class="chip nay">hôm nay</span>' : '';

  return `<div class="${cls}">
    <div class="ngay"><span class="d">${n.d}</span><span class="t">${esc(n.t)}</span></div>
    <div class="than">
      <div class="de">${esc(b.chu_de)}${chip}</div>
      ${phu ? `<div class="phu">${phu}</div>` : ''}
    </div>
  </div>`;
}

function veTiep(b, homNay) {
  const el = document.getElementById('tiep');
  if (!b) {
    el.className = 'tiep trong';
    el.innerHTML = `<p class="de">Chưa có buổi nào sắp tới trong lịch.<br>
      Ban tổ chức công bố dần từng tuần.</p>`;
    el.hidden = false;
    return;
  }
  const n = docNgay(b.ngay);
  const cach = soNgay(homNay, b.ngay);
  const khiNao = cach === 0 ? 'Hôm nay' : cach === 1 ? 'Ngày mai' : `Còn ${cach} ngày`;
  const gio = gioText(b);

  el.className = 'tiep';
  el.innerHTML = `
    <p class="nhan">Buổi tiếp theo</p>
    <p class="khi">${esc(n.thu)}, ${esc(n.dm)}${gio ? ` · ${esc(gio)}` : ''}</p>
    <p class="cach">${esc(khiNao)}${gio ? '' : ' · chưa công bố giờ'}</p>
    <p class="de">${esc(b.chu_de)}</p>
    ${b.giang_vien ? `<p class="gv">${esc(b.giang_vien)}</p>` : ''}
    ${b.ghi_chu ? `<p class="gv">${esc(b.ghi_chu)}</p>` : ''}`;
  el.hidden = false;
}

async function ve() {
  const ds = document.getElementById('ds');
  let d;
  try {
    const r = await fetch('/api/lich/cong-khai');
    if (!r.ok) throw new Error(String(r.status));
    d = await r.json();
  } catch {
    ds.innerHTML = `<p class="dangtai">Chưa tải được lịch. Kiểm tra kết nối rồi tải lại trang.</p>`;
    return;
  }

  // hom_nay do máy chủ sinh theo giờ Việt Nam. Không lấy ngày của máy người
  // xem: điện thoại đặt sai ngày thì tô nhầm buổi "hôm nay".
  const homNay = d.hom_nay;
  const buoi = d.buoi ?? [];

  // Buổi kế tiếp = buổi chưa qua, chưa huỷ, sớm nhất. Danh sách đã sắp theo
  // ngày rồi nên lấy cái đầu tiên khớp là đúng.
  veTiep(buoi.find(b => b.ngay >= homNay && !b.da_huy), homNay);

  // Chèn nhãn tháng mỗi khi sang tháng mới. Lịch trải tháng 8 sang tháng 9 mà
  // cột ngày chỉ có số ngày, nên không có nhãn thì "11 Th sáu" đọc thành 11/8.
  let thangTruoc = null;
  ds.innerHTML = buoi.length
    ? buoi.map(b => {
        const th = b.ngay.slice(0, 7);
        const nhan = th === thangTruoc ? '' : `<div class="thang">Tháng ${Number(th.slice(5))}</div>`;
        thangTruoc = th;
        return nhan + veBuoi(b, homNay);
      }).join('')
    : `<p class="dangtai">Lịch chưa được công bố buổi nào.</p>`;

  // Đếm ngược tới buổi bảo vệ
  if (d.khoa?.defense_on) {
    const con = soNgay(homNay, d.khoa.defense_on);
    if (con >= 0) {
      document.getElementById('demN').textContent = con;
      document.getElementById('dem').hidden = false;
    }
  }

  // Nói rõ đây là lịch chưa đủ, đừng để ai tưởng khoá chỉ có ngần này buổi.
  // Nói số buổi CÒN THIẾU chứ không nói số buổi đã có: buổi đã huỷ vẫn hiện
  // thành một thẻ, nên "4 buổi đã có" đứng dưới 5 thẻ đọc như đếm sai.
  const tong = d.khoa?.sessions_total;
  const daCo = buoi.filter(b => !b.da_huy).length;
  if (tong && daCo < tong) {
    const el = document.getElementById('tong');
    el.textContent = `Khoá có ${tong} buổi. Còn ${tong - daCo} buổi chưa công bố lịch — `
      + 'Ban tổ chức công bố dần từng tuần.';
    el.hidden = false;
  }
}

ve();

// Quay lại trang (chuyển tab, mở lại từ màn hình chính) thì đọc lại lịch —
// cùng lý do với ứng dụng chính: mở rồi để đó, hôm sau quay lại vẫn thấy số
// liệu hôm qua. Chốt chặn 30 giây để chuyển qua chuyển lại không thành mưa
// request. Cố ý KHÔNG dùng setInterval.
let lanCuoi = Date.now();
function lamMoi() {
  if (document.hidden) return;
  if (Date.now() - lanCuoi < 30000) return;
  lanCuoi = Date.now();
  ve();
}
document.addEventListener('visibilitychange', lamMoi);
window.addEventListener('focus', lamMoi);
