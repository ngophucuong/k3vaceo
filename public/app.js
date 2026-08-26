/* ═══════════ TIỆN ÍCH ═══════════ */
const $ = s => document.querySelector(s);

// Phải thoát cả dấu nháy: chuỗi này được nhúng vào bên trong thuộc tính HTML
// (href="...", value="..."), nên bỏ sót dấu " là thoát ra khỏi thuộc tính và
// gắn được onmouseover — bất kỳ ai gắn liên kết vào Tư liệu cũng chèn được mã
// chạy trên máy đồng đội.
const ESC_MAP = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' };
const esc = s => String(s ?? '').replace(/[<>&"']/g, c => ESC_MAP[c]);

const ini = n => { const w = String(n ?? '').trim().split(/\s+/); return (w[w.length - 2]?.[0] || '') + (w[w.length - 1]?.[0] || ''); };
const hue = n => { let h = 0; for (const c of String(n ?? '')) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
const avatar = (name, cl = '') => `<span class="av ${cl}" style="background:hsl(${hue(name)} 34% 42%)">${esc(ini(name))}</span>`;
const short = n => String(n ?? '').trim().split(/\s+/).slice(-2).join(' ');
const vnDate = s => { const d = new Date(String(s).replace(' ', 'T') + 'Z'); return isNaN(d) ? '' : d.toLocaleDateString('vi-VN'); };

function toast(t) {
  const e = $('#toast'); e.textContent = t; e.classList.add('on');
  clearTimeout(e._t); e._t = setTimeout(() => e.classList.remove('on'), 2400);
}

const vnMoney = n => Number(n ?? 0).toLocaleString('vi-VN');

/* Dựng nội dung chuyển khoản từ cú pháp — bản sao đúng logic của
   buildTransferNote trong worker/src/lib/vietqr.js: thay chỗ trống, bỏ dấu,
   viết hoa, gộp khoảng trắng. Chép lại ở đây để xem trước hiện ngay lúc gõ mà
   không phải hỏi máy chủ từng ký tự. Sửa một bên thì phải sửa bên kia. */
const boDau = t => String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd').replace(/Đ/g, 'D');
const dungNoiDung = (cuPhap, ten, nhom) =>
  boDau(String(cuPhap || '{TEN} N{NHOM}').replace(/\{TEN\}/g, ten ?? '').replace(/\{NHOM\}/g, nhom ?? ''))
    .toUpperCase().replace(/\s+/g, ' ').trim();

/* ═══════════ WEBAUTHN — đổi qua lại base64url ↔ ArrayBuffer ═══════════
   Trình duyệt mới có PublicKeyCredential.parseCreationOptionsFromJSON() làm
   sẵn việc này, nhưng Safari iOS 16 (thiết bị SRS mục 8 yêu cầu đỡ) chưa có,
   nên tự đổi tay cho chắc. */
const b64uToBuf = s => {
  const bin = atob(String(s).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(bin, c => c.charCodeAt(0)).buffer;
};
const bufToB64u = b => btoa(String.fromCharCode(...new Uint8Array(b)))
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const passkeySupported = () => !!(window.PublicKeyCredential && navigator.credentials?.create);

const ERR_TEXT = {
  email_taken: 'Email này người khác trong lớp đã dùng.',
  email_invalid: 'Email chưa đúng định dạng.',
  email_required: 'Cần điền email.',
  forbidden: 'Bạn không có quyền làm việc này.',
  forbidden_assign: 'Chỉ trưởng hoặc phó nhóm mới giao được phần bài.',
  last_officer: 'Không bỏ trống được: nhóm phải còn ít nhất một trưởng hoặc phó.',
  url_must_be_https: 'Đường dẫn phải bắt đầu bằng https://',
  rate_limited: 'Bạn xin mã hơi nhiều lần rồi. Chờ khoảng một tiếng rồi thử lại — hoặc xin trưởng nhóm một link mời để vào ngay.',
  mailer_not_configured: 'Chưa cấu hình gửi thư — nhắn trưởng nhóm để lấy link mời.',
  mail_send_failed: 'Máy chủ thư không nhận thư lúc này. Thử lại sau vài phút, hoặc nhắn trưởng nhóm để lấy link mời.',
  only_collector: 'Chỉ người thu của đợt này mới xác nhận đã nhận tiền.',
  already_verified: 'Người thu đã xác nhận nhận được tiền của bạn — không bỏ khai được nữa.',
  round_not_open: 'Đợt thu này chưa mở.',
  amount_invalid: 'Số tiền chưa hợp lệ.',
  bank_bin_invalid: 'Mã ngân hàng phải đúng 6 chữ số.',
  account_no_invalid: 'Số tài khoản chỉ gồm chữ và số.',
  collector_not_found: 'Người thu phải là thành viên trong nhóm.',
  title_required: 'Cần đặt tên cho đợt thu.',
  syntax_required: 'Cần có cú pháp nội dung chuyển khoản.',
  syntax_thieu_ten: 'Cú pháp phải có {TEN}, không thì cả nhóm chuyển khoản giống hệt nhau và người thu không biết ai là ai.',
  passkey_verify_failed: 'Không xác thực được passkey. Thử lại hoặc dùng email.',
  passkey_unknown: 'Passkey này chưa được đăng ký ở đây.',
  passkey_already_registered: 'Thiết bị này đã đăng ký passkey rồi.',
  challenge_invalid: 'Phiên đăng ký passkey hết hạn — bấm lại từ đầu.',
  // Đợt 5 — tự nhận diện và OTP
  phone_mismatch: 'Số điện thoại không khớp với số Ban tổ chức đang có. Kiểm tra lại; nếu bạn đã đổi số thì xin trưởng nhóm một link mời, đăng nhập rồi tự sửa số trong tab Tài khoản là lần sau tự đăng nhập được.',
  phone_invalid: 'Số điện thoại phải đủ 10 chữ số và bắt đầu bằng 0.',
  phone_missing_in_roster: 'Ban tổ chức chưa có số điện thoại của bạn nên chưa đối chiếu được.',
  roster_not_found: 'Không tìm thấy tên này trong danh sách lớp.',
  otp_wrong: 'Mã không đúng.',
  otp_expired: 'Mã đã hết hạn hoặc đã dùng rồi — xin mã mới.',
  otp_locked: 'Nhập sai quá nhiều lần, mã này bị huỷ. Xin mã mới.',
  otp_invalid_format: 'Mã gồm đúng 6 chữ số.',
  email_chua_kiem_chung: 'Cần xác minh email bằng mã trước khi thêm passkey.',
  // Đợt 6 — sổ chi
  scope_invalid: 'Không xác định được sổ quỹ nào.',
  category_invalid: 'Hạng mục chi không hợp lệ.',
  spent_on_invalid: 'Ngày chi chưa đúng — chọn lại trên lịch.',
  round_invalid: 'Đợt thu đã chọn không thuộc sổ này.',
  tu_khai_di: 'Đây là hồ sơ của chính bạn — dùng nút "Tôi đã chuyển" ở tab Quỹ.',
  khong_phai_khai_ho: 'Người này tự khai chứ không phải ai khai hộ, nên bạn không gỡ được.',
  member_not_in_round: 'Người này không thuộc đợt thu ấy.',
  thuoc_quy_khoa: 'Đợt đã mở rồi thì không đổi được sổ nhận tiền — số dư hai sổ sẽ nhảy cùng lúc.',
};
const errText = e => ERR_TEXT[e?.data?.error] || 'Không xong — thử lại.';

/* ═══════════ GỌI API ═══════════ */
async function api(path, opts = {}) {
  const res = await fetch(path, {
    credentials: 'same-origin',
    headers: opts.body ? { 'content-type': 'application/json' } : {},
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || 'error'), { status: res.status, data });
  return data;
}
const apiGet = p => api(p);
const apiPost = (p, body) => api(p, { method: 'POST', body: JSON.stringify(body ?? {}) });
const apiPatch = (p, body) => api(p, { method: 'PATCH', body: JSON.stringify(body ?? {}) });
const apiPut = (p, body) => api(p, { method: 'PUT', body: JSON.stringify(body ?? {}) });
const apiDelete = p => api(p, { method: 'DELETE' });

/* ═══════════ TRẠNG THÁI ═══════════ */
let HOME = null;      // /api/home gần nhất
let PLAN = null;      // /api/plan gần nhất
let KHO_CAN_LOP = false;
let KHO_LINKS = [];    // /api/links gần nhất, để bảng sửa đọc lại
let KHO_TAG = null;    // bộ lọc đang xem, để vẽ lại đúng chỗ sau khi lưu  // mình có đăng được tư liệu cấp lớp không
let MEMBERS = [];     // /api/members gần nhất

const iAmOfficer = () => !!HOME?.officers?.some(o => o.member_id === HOME.me.id);

let BAN_LUC_MO = null;   // mã bản máy chủ chạy lúc mình mở trang

async function refreshHome() {
  HOME = await apiGet('/api/home');
  if (BAN_LUC_MO === null) BAN_LUC_MO = HOME.ban ?? null;
  else if (HOME.ban && HOME.ban !== BAN_LUC_MO) veBangCoBanMoi();
  drawHead(); drawNay(); veChamDo();
}

// ── Tự làm mới khi quay lại ứng dụng ────────────────────────────────────────
// Trước đây ứng dụng KHÔNG bao giờ tự làm mới: mở lên rồi để đó, hôm sau quay
// lại vẫn thấy số liệu hôm qua cho tới khi chạm vào một nút nào đó. Trên iPhone
// đã cài lên màn hình chính thì càng rõ, vì người ta không đóng hẳn app bao giờ.
//
// Không dùng setInterval: gọi máy chủ đều đặn suốt ngày cho một lớp 134 người
// là phí, và pin điện thoại trả giá. Chỉ làm mới đúng lúc người ta quay lại
// nhìn — thêm một chốt chặn 30 giây để chuyển qua chuyển lại không thành mưa
// request.
let LUC_LAM_MOI = 0;
function batTuLamMoi() {
  const thu = async () => {
    if (document.visibilityState !== 'visible') return;
    if (Date.now() - LUC_LAM_MOI < 30000) return;
    LUC_LAM_MOI = Date.now();
    try {
      await refreshHome();
      // Màn đang mở cũng phải mới theo, không thì số ở tab Hôm nay đã đổi mà
      // danh sách đang xem vẫn là bản cũ.
      const v = (location.hash || '#/nay').replace('#/', '');
      if (v === 'bai' && $('#v-bai').dataset.loaded) await drawBai();
      if (v === 'nhom' && $('#v-nhom').dataset.loaded) await drawNhom();
      if (v === 'quy' && $('#v-quy').dataset.loaded) await drawQuy();
    } catch { /* mất mạng thì thôi, lần sau quay lại thử tiếp */ }
  };
  document.addEventListener('visibilitychange', thu);
  window.addEventListener('focus', thu);
}

// Máy chủ đã lên bản mới trong lúc app nằm im. Không tự tải lại: người ta có
// thể đang gõ dở một ô. Chỉ báo và để họ bấm.
function veBangCoBanMoi() {
  if ($('#banmoi')) return;
  document.body.insertAdjacentHTML('beforeend',
    `<button class="banmoi" id="banmoi">Có bản mới — chạm để tải lại</button>`);
  $('#banmoi').onclick = async () => {
    const nut = $('#banmoi');
    nut.textContent = 'Đang tải bản mới…';
    // location.reload() KHÔNG đủ. Đo trên tên miền thật ngày 25/8: app.js và
    // app.css bị trả về với max-age=14400 — bốn tiếng dùng thẳng bản đệm.
    // (public/_headers đã đặt no-cache, nhưng có một lớp ghi đè ở cấp zone
    // Cloudflare.) Tải lại thường thì index.html mới về mà app.js vẫn lấy từ
    // đệm, mã không đổi, băng này hiện lại ngay — bấm mãi không hết.
    //
    // fetch(cache:'reload') buộc đi mạng VÀ ghi đè bản trong đệm HTTP, nên
    // lượt tải lại ngay sau đó nhận đúng mã mới. Hỏng thì vẫn tải lại, vì
    // cùng lắm là quay về đúng tình trạng cũ chứ không tệ hơn.
    try {
      await Promise.all(['/app.js', '/app.css'].map(u =>
        fetch(u, { cache: 'reload' }).catch(() => {})));
    } catch { /* mất mạng thì thôi */ }
    location.reload();
  };
}
async function ensureMembers() {
  if (!MEMBERS.length) MEMBERS = (await apiGet('/api/members')).members;
  return MEMBERS;
}

/* ═══════════ SHEET ═══════════ */
function ensureVeil() {
  if ($('#veil')) return;
  document.body.insertAdjacentHTML('beforeend', `<div class="veil" id="veil"><div class="sheet" id="sheet"></div></div>`);
  $('#veil').addEventListener('click', e => { if (e.target.id === 'veil') closeSheet(); });
}
function openSheet(html) {
  ensureVeil();
  $('#sheet').innerHTML = '<div class="grab"></div>' + html;
  $('#veil').classList.add('on');
}
const closeSheet = () => $('#veil')?.classList.remove('on');

// Bọc nút Lưu: khoá nút khi đang gửi, hiện lỗi nói được thành lời khi hỏng.
async function submitting(btn, fn, okMsg) {
  const label = btn.textContent;
  btn.disabled = true; btn.textContent = 'Đang lưu…';
  try {
    await fn();
    closeSheet();
    if (okMsg) toast(okMsg);
    return true;
  } catch (e) {
    toast(errText(e));
    btn.disabled = false; btn.textContent = label;
    return false;
  }
}

/* ═══════════ MÀN NHẬN LINK MỜI (/i/:token) ═══════════ */
async function renderClaim(token) {
  document.body.classList.add('noapp');
  $('#root').innerHTML = `<div class="claimwrap"><div class="claimcard" id="claimcard">Đang tải…</div></div>`;
  let data;
  try {
    data = await apiGet(`/api/invite/${encodeURIComponent(token)}`);
  } catch (e) {
    $('#claimcard').innerHTML = `<div class="lb">Link mời</div><h1>Không mở được link này</h1>
      <div class="err">${e.status === 429 ? 'Thử hơi nhiều lần, chờ một lát rồi mở lại.'
        : 'Link đã hết hạn hoặc không đúng. Nhắn cho trưởng nhóm để xin gửi lại.'}</div>
      <div style="margin-top:16px"><button class="wide" id="claimHome">Về trang chính</button></div>`;
    // Gắn bằng thuộc tính DOM chứ không viết onclick="" vào HTML: CSP đặt
    // script-src 'self' để chặn mọi handler nội tuyến — đó là lớp phòng thủ
    // thứ hai cho đúng loại lỗi XSS đã từng có ở Tư liệu.
    $('#claimHome').onclick = () => { location.href = '/'; };
    return;
  }
  const { member, group } = data;
  $('#claimcard').innerHTML = `
    <div class="lb">${esc(group.label)} · Khoá K03</div>
    <h1>${member.already_claimed ? 'Sửa lại hồ sơ của bạn' : `Chào ${esc(short(member.full_name))}`}</h1>
    <p class="sub">${member.already_claimed
      ? 'Bạn đã xác nhận hồ sơ trước đó — sửa lại nếu có gì đổi rồi bấm lưu.'
      : 'Thông tin lấy từ danh sách Ban tổ chức, có chỗ đã cũ hoặc sai. Sửa lại cho đúng rồi xác nhận.'}</p>
    <label class="f">Họ tên</label><input value="${esc(member.full_name)}" disabled>
    <label class="f">Email <span style="color:var(--due)">*</span></label>
    <input id="cEmail" value="${esc(member.email)}" placeholder="ten@congty.vn" inputmode="email" maxlength="160">
    <div class="hintline">Dùng để tự đăng nhập lại nếu mất link này.</div>
    <label class="f">Điện thoại</label><input id="cPhone" value="${esc(member.phone)}" placeholder="09xx xxx xxx" inputmode="tel" maxlength="30">
    <label class="f">Chức vụ</label><input id="cTitle" value="${esc(member.title)}" maxlength="120">
    <label class="f">Đơn vị</label><input id="cCompany" value="${esc(member.company)}" maxlength="160">
    <div id="cErr" class="errline" style="display:none"></div>
    <button class="wide" id="cSubmit">${member.already_claimed ? 'Lưu' : 'Xác nhận hồ sơ'}</button>`;

  const showErr = msg => { $('#cErr').textContent = msg; $('#cErr').style.display = 'block'; };
  $('#cSubmit').onclick = async () => {
    const email = $('#cEmail').value.trim();
    if (!email) { showErr('Cần điền email để dùng lần sau.'); return; }
    const label = $('#cSubmit').textContent;
    $('#cSubmit').disabled = true; $('#cSubmit').textContent = 'Đang lưu…';
    try {
      await apiPost(`/api/invite/${encodeURIComponent(token)}/claim`, {
        email, phone: $('#cPhone').value, title: $('#cTitle').value, company: $('#cCompany').value,
      });
      history.replaceState({}, '', '/');
      boot();
    } catch (e) {
      showErr(errText(e));
      $('#cSubmit').disabled = false; $('#cSubmit').textContent = label;
    }
  };
}

/* ═══════════ ĐĂNG NHẬP LẠI BẰNG EMAIL ═══════════ */
async function renderMagicConsume(token) {
  document.body.classList.add('noapp');
  $('#root').innerHTML = `<div class="claimwrap"><div class="claimcard"><h1>Đang đăng nhập…</h1></div></div>`;
  try {
    await apiPost(`/api/auth/email/${encodeURIComponent(token)}`);
    history.replaceState({}, '', '/');
    boot();
  } catch (e) {
    $('#root').innerHTML = `<div class="claimwrap"><div class="claimcard">
      <div class="lb">Đăng nhập</div><h1>Link này không dùng được nữa</h1>
      <div class="err">Link đăng nhập chỉ dùng một lần và hết hạn sau 15 phút. Xin một link mới.</div>
      <div style="margin-top:16px"><button class="wide" id="again">Xin link mới</button></div>
    </div></div>`;
    // Gán thẳng hàm thì đối tượng sự kiện chui vào tham số đầu và bị đổ
    // vào ô email — bọc lại cho chắc.
    $('#again').onclick = () => renderLogin();
  }
}

function renderLogin(emailSan) {
  document.body.classList.add('noapp');
  $('#root').innerHTML = `<div class="claimwrap"><div class="claimcard">
    <div class="lb">k3vaceo · Khoá K03</div>
    <h1>Đăng nhập</h1>
    <p class="sub">Nhập email bạn đã khai. Chúng tôi gửi một mã 6 số tới hộp thư đó.</p>
    <label class="f">Email</label><input id="lgEmail" placeholder="ten@congty.vn" inputmode="email" maxlength="160" value="${esc(emailSan ?? '')}">
    <div id="lgMsg" class="hintline" style="display:none"></div>
    <button class="wide" id="lgSend">Gửi mã đăng nhập</button>
    <button class="wide ghost" id="lgPasskey" style="margin-top:10px">Đăng nhập bằng passkey</button>
    <div class="foot" style="padding:14px 0 0">Lần đầu đăng nhập? <a href="/dangnhap" id="lgVao">Bấm đây để tự nhận diện</a> bằng tên và số điện thoại.</div>
  </div></div>`;
  $('#lgPasskey').onclick = loginWithPasskey;
  $('#lgVao').onclick = e => { e.preventDefault(); history.pushState({}, '', '/dangnhap'); renderVao(); };
  $('#lgSend').onclick = async () => {
    const email = $('#lgEmail').value.trim();
    if (!email) return;
    const btn = $('#lgSend');
    btn.disabled = true; btn.textContent = 'Đang gửi…';
    try {
      await apiPost('/api/auth/otp', { email });
      renderNhapMa(email, 'Nếu email này có trong lớp, mã vừa được gửi tới đó.');
    } catch (e) {
      $('#lgMsg').style.display = 'block';
      $('#lgMsg').style.color = 'var(--due)';
      $('#lgMsg').textContent = errText(e);
      btn.disabled = false; btn.textContent = 'Gửi mã đăng nhập';
    }
  };
}

/* Màn nhập mã 6 số — dùng chung cho cả lần đầu lẫn đăng nhập lại.
   inputmode="numeric" để điện thoại bật bàn phím số; autocomplete="one-time-code"
   để iOS gợi ý mã ngay trên bàn phím, khỏi phải chuyển sang app Mail chép tay. */
function renderNhapMa(email, loiNhan) {
  document.body.classList.add('noapp');
  $('#root').innerHTML = `<div class="claimwrap"><div class="claimcard">
    <div class="lb">k3vaceo · Khoá K03</div>
    <h1>Nhập mã 6 số</h1>
    <p class="sub">${esc(loiNhan)} Mã sống 10 phút.</p>
    <label class="f">Mã trong thư</label>
    <input id="maOtp" inputmode="numeric" autocomplete="one-time-code" maxlength="6"
           placeholder="000000" style="font-size:28px;letter-spacing:8px;text-align:center">
    <div id="maMsg" class="hintline" style="display:none"></div>
    <button class="wide" id="maOk">Đăng nhập</button>
    <button class="wide ghost" id="maLai" style="margin-top:10px">Gửi lại mã</button>
    <div class="foot" style="padding:14px 0 0">Không thấy thư? Xem cả mục Spam.</div>
  </div></div>`;
  const oMa = $('#maOtp');
  oMa.focus();
  const bao = (t, do_ = true) => {
    $('#maMsg').style.display = 'block';
    $('#maMsg').style.color = do_ ? 'var(--due)' : '';
    $('#maMsg').textContent = t;
  };
  const guiDi = async () => {
    const code = oMa.value.replace(/\D/g, '');
    if (code.length !== 6) return bao('Mã gồm đúng 6 chữ số.');
    $('#maOk').disabled = true; $('#maOk').textContent = 'Đang kiểm…';
    try {
      const kq = await apiPost('/api/auth/otp/verify', { email, code });
      history.replaceState({}, '', '/');
      if (kq.lan_dau) sessionStorage.setItem('k3-vua-vao', '1');
      boot();
    } catch (e) {
      const conLai = e?.data?.con_lai;
      bao(errText(e) + (conLai !== undefined ? ` Còn ${conLai} lần thử.` : ''));
      $('#maOk').disabled = false; $('#maOk').textContent = 'Đăng nhập';
      oMa.select();
    }
  };
  $('#maOk').onclick = guiDi;
  oMa.onkeydown = e => { if (e.key === 'Enter') guiDi(); };
  // Dán mã từ thư thì đăng nhập luôn, khỏi phải bấm nút.
  oMa.oninput = () => { if (oMa.value.replace(/\D/g, '').length === 6) guiDi(); };
  $('#maLai').onclick = async () => {
    $('#maLai').disabled = true; $('#maLai').textContent = 'Đang gửi…';
    try { await apiPost('/api/auth/otp', { email }); bao('Đã gửi mã mới.', false); }
    catch (e) { bao(errText(e)); }
    setTimeout(() => { $('#maLai').disabled = false; $('#maLai').textContent = 'Gửi lại mã'; }, 15000);
  };
}

/* ═══════════ TỰ NHẬN DIỆN (/dangnhap) ═══════════
   Ba bước, theo đúng luồng đã chốt:
     1. Gõ tên → chọn đúng mình trong danh sách gốc 134 người
     2. Nhập số điện thoại — Ban tổ chức đã có sẵn, chỉ đối chiếu, KHÔNG gửi gì
     3. Khai email → nhận mã 6 số → nhập mã → xong
   Passkey chỉ hiện ở tab Tài khoản sau khi xong bước 3. */
const VAO = { person: null };

function vaoShell(title, sub, body) {
  document.body.classList.add('noapp');
  $('#root').innerHTML = `<div class="claimwrap"><div class="claimcard">
    <div class="lb">k3vaceo · Khoá K03</div>
    <h1>${esc(title)}</h1>
    <p class="sub">${sub}</p>
    ${body}
  </div></div>`;
}

function renderVao() { vaoBuoc1(); }

function vaoBuoc1() {
  vaoShell('Bạn là ai?', 'Gõ tên bạn — không dấu cũng tìm ra.', `
    <label class="f">Họ tên</label>
    <input id="vTen" placeholder="ví dụ: cuong" autocomplete="name" maxlength="60">
    <div id="vDs" style="margin-top:10px"></div>
    <div class="foot" style="padding:14px 0 0">Đã khai email rồi?
      <a href="/dangnhap/email" id="vDn">Đăng nhập bằng email</a>.</div>`);
  $('#vDn').onclick = e => { e.preventDefault(); history.pushState({}, '', '/dangnhap/email'); renderLogin(); };

  let hen;
  $('#vTen').oninput = () => {
    clearTimeout(hen);
    const q = $('#vTen').value.trim();
    if (q.length < 2) { $('#vDs').innerHTML = ''; return; }
    // Chờ người ta gõ xong hẵng hỏi máy chủ — tìm kiếm có giới hạn 60 lần/giờ.
    hen = setTimeout(async () => {
      let ds = [];
      try { ds = (await apiGet('/api/wizard/roster/search?q=' + encodeURIComponent(q))).people; }
      catch (e) { $('#vDs').innerHTML = `<div class="err">${esc(errText(e))}</div>`; return; }
      if (!ds.length) {
        $('#vDs').innerHTML = `<div class="mut">Không thấy ai tên như vậy trong lớp. Thử gõ ngắn hơn, hoặc nhắn trưởng nhóm.</div>`;
        return;
      }
      $('#vDs').innerHTML = `<div class="card"><div class="cb" style="padding:2px 14px">${ds.map(p => `
        <div class="fd"><div class="x"><b>${esc(p.full_name)}</b>
          <div style="font-size:11.5px;color:var(--ink3);margin-top:2px">${esc(p.group_label)}${p.title ? ' · ' + esc(p.title) : ''}</div>
        </div><button class="lnk" data-rid="${p.roster_id}">là tôi</button></div>`).join('')}
      </div></div>`;
      document.querySelectorAll('#vDs [data-rid]').forEach(b => {
        b.onclick = () => {
          VAO.person = ds.find(x => String(x.roster_id) === b.dataset.rid);
          vaoBuoc2();
        };
      });
    }, 350);
  };
}

function vaoBuoc2() {
  const p = VAO.person;
  vaoShell('Đúng là bạn chứ?',
    `Nhập số điện thoại để đối chiếu với số Ban tổ chức đang giữ. <b>Không có tin nhắn nào được gửi tới số này</b> — chỉ dùng để xác nhận đúng người.`, `
    <div class="card" style="margin-bottom:14px"><div class="cb" style="padding:12px 14px">
      <b>${esc(p.full_name)}</b>
      <div style="font-size:12px;color:var(--ink3);margin-top:3px">${esc(p.group_label)}${p.title ? ' · ' + esc(p.title) : ''}${p.company ? '<br>' + esc(p.company) : ''}</div>
      ${p.da_chuyen_nhom ? `<div style="font-size:11.5px;color:var(--ink3);margin-top:6px">
        Danh sách ngày 15/8 ghi bạn ở ${esc(p.group_label_goc)}; bạn đã được chuyển sang ${esc(p.group_label)}.</div>` : ''}
    </div></div>
    <label class="f">Số điện thoại</label>
    <input id="vSdt" inputmode="tel" autocomplete="tel" maxlength="20" placeholder="09xx xxx xxx">
    <div id="vMsg" class="hintline" style="display:none"></div>
    <button class="wide" id="vOk">Tiếp tục</button>
    <button class="wide ghost" id="vLui" style="margin-top:10px">Không phải tôi, chọn lại</button>`);
  $('#vLui').onclick = vaoBuoc1;

  const tiep = async () => {
    const phone = $('#vSdt').value.trim();
    if (!phone) return;
    $('#vOk').disabled = true; $('#vOk').textContent = 'Đang kiểm…';
    try {
      const kq = await apiPost('/api/onboard/check', { roster_id: p.roster_id, phone });
      VAO.phone = phone;
      VAO.daNhanCho = kq.da_nhan_cho;
      VAO.goiYEmail = kq.goi_y_email;
      vaoBuoc3();
    } catch (e) {
      // Chưa có số trong danh sách gốc là chuyện của dữ liệu, không phải người
      // dùng gõ sai — nói khác đi kẻo họ ngồi thử lại cả buổi.
      if (e?.data?.error === 'phone_missing_in_roster') return vaoThieuSo(e.data);
      $('#vMsg').style.display = 'block';
      $('#vMsg').style.color = 'var(--due)';
      $('#vMsg').textContent = errText(e);
      $('#vOk').disabled = false; $('#vOk').textContent = 'Tiếp tục';
    }
  };
  $('#vOk').onclick = tiep;
  $('#vSdt').onkeydown = e => { if (e.key === 'Enter') tiep(); };
  $('#vSdt').focus();
}

function vaoThieuSo(d) {
  vaoShell('Chưa đối chiếu được',
    'Ban tổ chức chưa có số điện thoại của bạn trong danh sách lớp, nên chưa xác nhận được đúng người.', `
    <div class="card" style="margin-bottom:14px"><div class="cb" style="padding:12px 14px">
      <b>${esc(d.full_name ?? '')}</b>
      <div style="font-size:12px;color:var(--ink3);margin-top:3px">${esc(d.group_label ?? '')}</div>
    </div></div>
    <div class="mut">Nhắn trưởng nhóm bổ sung số của bạn vào danh sách lớp. Xong là bạn đăng nhập được ngay, không phải làm gì thêm.</div>
    <div class="mut" style="margin-top:10px">Hoặc xin trưởng nhóm một <b>link mời</b>. Đăng nhập bằng link rồi tự điền số của mình
      trong tab Tài khoản — từ lần sau bạn tự đăng nhập được ở đây, không phải xin nữa.</div>
    <button class="wide ghost" id="vLui2" style="margin-top:14px">Quay lại</button>`);
  $('#vLui2').onclick = vaoBuoc1;
}

function vaoBuoc3() {
  const p = VAO.person;
  vaoShell(VAO.daNhanCho ? 'Chào bạn trở lại' : 'Email của bạn',
    VAO.daNhanCho
      ? `Bạn đã nhận hồ sơ này rồi${VAO.goiYEmail ? ` với email <b>${esc(VAO.goiYEmail)}</b>` : ''}. Nhập lại email đó để nhận mã đăng nhập.`
      : 'Khai email để nhận mã đăng nhập. Đây cũng là đường đăng nhập lại khi bạn đổi máy, nên hãy dùng hộp thư bạn mở được.', `
    <label class="f">Email</label>
    <input id="vEmail" inputmode="email" autocomplete="email" maxlength="160" placeholder="ten@congty.vn">
    <div id="vMsg3" class="hintline" style="display:none"></div>
    <button class="wide" id="vGui">Gửi mã cho tôi</button>
    <button class="wide ghost" id="vLui3" style="margin-top:10px">Quay lại</button>`);
  $('#vLui3').onclick = vaoBuoc2;

  const gui = async () => {
    const email = $('#vEmail').value.trim();
    if (!email) return;
    $('#vGui').disabled = true; $('#vGui').textContent = 'Đang gửi…';
    try {
      await apiPost('/api/onboard/start', { roster_id: p.roster_id, phone: VAO.phone, email });
      renderNhapMa(email, `Đã gửi mã tới ${esc(email)}.`);
    } catch (e) {
      $('#vMsg3').style.display = 'block';
      $('#vMsg3').style.color = 'var(--due)';
      $('#vMsg3').textContent = e?.data?.error === 'email_taken'
        ? `Email này đã thuộc về ${e.data.taken_by}. Dùng email khác, hoặc nhắn trưởng nhóm nếu bị nhầm.`
        : errText(e);
      $('#vGui').disabled = false; $('#vGui').textContent = 'Gửi mã cho tôi';
    }
  };
  $('#vGui').onclick = gui;
  $('#vEmail').onkeydown = e => { if (e.key === 'Enter') gui(); };
  $('#vEmail').focus();
}

/* ═══════════ WIZARD DỰNG NHÓM (/start) ═══════════
   Mục tiêu mục 5 SRS: một trưởng nhóm bất kỳ tự dựng xong dưới 5 phút, không
   cần liên hệ ai. Nên gộp các bước bỏ qua được và điền sẵn tối đa. */
const WZ = { step: 1, person: null, group: null, rosterRest: [], members: [] };

function wzShell(title, sub, body, footer) {
  document.body.classList.add('noapp');
  $('#root').innerHTML = `<div class="claimwrap"><div class="claimcard wide-card">
    <div class="lb">Dựng không gian nhóm · Khoá K03</div>
    <h1>${esc(title)}</h1>
    <p class="sub">${sub}</p>
    ${body}
    ${footer ?? ''}
  </div></div>`;
}

function renderStart() {
  WZ.step = 1;
  wzShell('Bạn là ai', 'Gõ tên bạn để tìm trong danh sách 134 học viên K03. Gõ không dấu cũng được.', `
    <label class="f">Họ tên</label>
    <input id="wzQ" placeholder="ví dụ: nguyen van a" autocomplete="off">
    <div id="wzHits"></div>
    <div id="wzErr" class="errline" style="display:none"></div>
    <div class="foot" style="padding:14px 0 0">Không tìm thấy tên mình? Nhắn Ban cán sự lớp — danh sách này lấy nguyên từ bản Ban tổ chức phát ngày 15/8.</div>`);

  let timer;
  $('#wzQ').oninput = () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const q = $('#wzQ').value.trim();
      if (q.length < 2) { $('#wzHits').innerHTML = ''; return; }
      try {
        const { people } = await apiGet(`/api/wizard/roster/search?q=${encodeURIComponent(q)}`);
        $('#wzHits').innerHTML = people.length
          ? people.map(p => `<button class="opt" data-pick='${esc(JSON.stringify(p))}'>
              <div style="flex:1;min-width:0">
                <div style="font-weight:600;font-size:14.5px">${esc(p.full_name)}</div>
                <div style="font-size:12.5px;color:var(--ink2)">${esc(p.group_label)}${p.title ? ' · ' + esc(p.title) : ''}</div>
              </div>
              ${p.already_member ? '<span class="tg go">đã có nhóm</span>' : ''}</button>`).join('')
          : `<div class="mut" style="padding:6px 2px">Không có tên nào khớp.</div>`;
        document.querySelectorAll('#wzHits [data-pick]').forEach(b => {
          b.onclick = () => wzStep2(JSON.parse(b.dataset.pick));
        });
      } catch (e) {
        $('#wzErr').textContent = errText(e); $('#wzErr').style.display = 'block';
      }
    }, 250);
  };
  setTimeout(() => $('#wzQ')?.focus(), 200);
}

function wzStep2(person) {
  WZ.person = person;
  const groupNo = Number(String(person.group_label).match(/\d+/)?.[0] ?? 0);
  wzShell(`Chào ${esc(short(person.full_name))}`,
    'Danh sách ghi bạn ở nhóm dưới đây. Đổi được nếu bạn đã chuyển nhóm.', `
    <label class="f">Email của bạn <span style="color:var(--due)">*</span></label>
    <input id="wzEmail" placeholder="ten@congty.vn" inputmode="email" maxlength="160">
    <div class="hintline">Dùng để đăng nhập lại nếu mất link.</div>
    <label class="f">Nhóm của bạn</label>
    <select id="wzGroup">${Array.from({ length: 10 }, (_, i) => i + 1).map(n =>
      `<option value="${n}" ${n === groupNo ? 'selected' : ''}>Nhóm ${n}</option>`).join('')}</select>
    <div id="wzErr" class="errline" style="display:none"></div>
    <div class="sa"><button class="big c" id="wzBack">Quay lại</button>
      <button class="big go" id="wzGo">Dựng nhóm này</button></div>`);
  $('#wzBack').onclick = renderStart;
  $('#wzGo').onclick = async () => {
    const email = $('#wzEmail').value.trim();
    if (!email) { $('#wzErr').textContent = 'Cần điền email.'; $('#wzErr').style.display = 'block'; return; }
    const btn = $('#wzGo'); btn.disabled = true; btn.textContent = 'Đang dựng…';
    try {
      const r = await apiPost('/api/wizard/claim-group', {
        roster_id: person.roster_id, email, group_no: Number($('#wzGroup').value),
      });
      WZ.group = r.group;
      WZ.rosterRest = r.roster_rest;
      WZ.members = r.roster_rest.map(x => ({ ...x, keep: true }));
      wzStep3();
    } catch (e) {
      if (e.status === 409 && e.data?.already_claimed) { wzAlreadyClaimed(e.data); return; }
      $('#wzErr').textContent = errText(e); $('#wzErr').style.display = 'block';
      btn.disabled = false; btn.textContent = 'Dựng nhóm này';
    }
  };
  setTimeout(() => $('#wzEmail')?.focus(), 200);
}

// Ràng buộc mục 5: một nhóm chỉ một người dựng. Người thứ hai sang luồng xin vào.
function wzAlreadyClaimed(info) {
  const lead = info.lead;
  wzShell(`${esc(info.group.label)} đã có người dựng`,
    lead ? `Trưởng nhóm hiện tại là <b>${esc(lead.full_name)}</b>. Nhanh nhất là nhắn thẳng cho anh/chị ấy xin link mời.`
         : 'Nhóm này đã có người dựng không gian.', `
    ${lead?.phone ? `<a class="wide" href="tel:${esc(lead.phone)}" style="display:block;text-align:center;text-decoration:none">Gọi ${esc(short(lead.full_name))} · ${esc(lead.phone)}</a>` : ''}
    ${info.you_are_already_member
      ? `<div class="foot" style="padding:14px 0 0">Bạn đã có tên trong nhóm rồi — chỉ cần trưởng nhóm phát lại link mời cho bạn.</div>`
      : `<div class="foot" style="padding:14px 0 6px">Hoặc gửi một yêu cầu xin vào nhóm, trưởng nhóm sẽ thấy khi mở ứng dụng.</div>
         <label class="f">Nhắn kèm một câu</label>
         <input id="wzNote" maxlength="200" placeholder="ví dụ: em chuyển từ nhóm 3 sang">
         <button class="wide ghost" id="wzJoin">Gửi yêu cầu xin vào nhóm</button>`}
    <div class="sa" style="margin-top:14px"><button class="big c" id="wzBack">Quay lại</button></div>`);
  $('#wzBack').onclick = renderStart;
  if ($('#wzJoin')) $('#wzJoin').onclick = async () => {
    const btn = $('#wzJoin'); btn.disabled = true;
    try {
      await apiPost('/api/wizard/join-request', {
        group_no: info.group.no, full_name: WZ.person.full_name,
        roster_id: WZ.person.roster_id, note: $('#wzNote').value,
      });
      btn.textContent = 'Đã gửi — chờ trưởng nhóm nhận';
    } catch (e) { toast(errText(e)); btn.disabled = false; }
  };
}

function wzStep3() {
  WZ.step = 3;
  wzShell(`Thành viên ${esc(WZ.group.label)}`,
    'Danh sách đổ sẵn từ bản Ban tổ chức. Bỏ tick người không còn trong nhóm, rồi bấm xác nhận.', `
    <div class="card"><div class="cb" style="padding:2px 14px">
      ${WZ.members.map((m, i) => `<label class="fd" style="cursor:pointer">
        <input type="checkbox" data-keep="${i}" checked style="width:auto;margin:6px 0 0">
        <div class="x"><b>${esc(m.full_name)}</b>
          <div style="font-size:11.5px;color:var(--ink3);margin-top:2px">${esc(m.title || '')}${m.title && m.company ? ' · ' : ''}${esc(m.company || '')}</div></div>
      </label>`).join('')}
    </div></div>
    <div class="foot" style="padding:10px 0 4px">Bạn (<b>${esc(short(WZ.person.full_name))}</b>) đã ở trong nhóm và đang là trưởng nhóm.</div>
    <div class="sa"><button class="big go" id="wzNext">Xác nhận ${WZ.members.length} người</button></div>`);

  document.querySelectorAll('[data-keep]').forEach(cb => {
    cb.onchange = () => {
      WZ.members[Number(cb.dataset.keep)].keep = cb.checked;
      const n = WZ.members.filter(m => m.keep).length;
      $('#wzNext').textContent = `Xác nhận ${n} người`;
    };
  });
  $('#wzNext').onclick = () => submitting($('#wzNext'), async () => {
    const list = WZ.members.filter(m => m.keep)
      .map(m => ({ roster_id: m.roster_id, full_name: m.full_name, title: m.title, company: m.company, phone: m.phone }));
    await apiPost('/api/wizard/members', { members: list });
    wzStep4();
  });
}

async function wzStep4() {
  WZ.step = 4;
  const { members } = await apiGet('/api/members');
  wzShell('Đề tài và phó nhóm',
    'Hai ô này bỏ trống cũng được — điền sau ở màn hình chính. Khung bài tám phần theo hướng dẫn giảng viên sẽ tạo tự động.', `
    <label class="f">Sản phẩm hoặc dịch vụ</label>
    <textarea id="wzP" maxlength="300" placeholder="Nhóm định làm gì"></textarea>
    <label class="f">Khách hàng mục tiêu</label>
    <textarea id="wzC" maxlength="300" placeholder="Bán cho ai"></textarea>
    <label class="f">Phó nhóm</label>
    <select id="wzDep"><option value="">— để trống, chọn sau —</option>
      ${members.filter(m => m.full_name !== WZ.person.full_name)
        .map(m => `<option value="${m.id}">${esc(m.full_name)}</option>`).join('')}</select>
    <div class="sa"><button class="big go" id="wzNext">Tạo khung bài</button></div>`);

  $('#wzNext').onclick = () => submitting($('#wzNext'), async () => {
    await apiPost('/api/wizard/plan', { topic_product: $('#wzP').value, topic_customers: $('#wzC').value });
    const dep = $('#wzDep').value;
    if (dep) {
      await apiPut('/api/officers', { role: 'pho_nhom', member_id: Number(dep), note: 'chọn khi dựng nhóm' })
        .catch(() => { /* không chặn wizard vì một việc bỏ qua được */ });
    }
    await wzStep5();
  });
}

async function wzStep5() {
  WZ.step = 5;
  wzShell('Phát link mời', 'Xong rồi. Chép khối dưới đây dán thẳng vào Zalo nhóm — mỗi người một link riêng.', `
    <div class="card"><div class="cb" style="padding:0 14px" id="wzLines">Đang sinh link…</div></div>
    <button class="wide" id="wzCopy" style="margin-top:12px">Chép cả khối</button>
    <button class="wide ghost" id="wzDone" style="margin-top:10px">Mở ứng dụng</button>`);

  let data;
  try { data = await apiPost('/api/wizard/invites'); }
  catch (e) { $('#wzLines').innerHTML = `<div class="mut" style="padding:12px 0">${esc(errText(e))}</div>`; data = { lines: [], text: '' }; }

  $('#wzLines').innerHTML = data.lines.length
    ? data.lines.map(l => `<div class="fd"><div class="x"><b>${esc(l.full_name)}</b>
        <div style="font-size:11px;color:var(--ink3);word-break:break-all;margin-top:2px">${esc(l.url ?? '(đã phát trước đó)')}</div></div></div>`).join('')
    : `<div class="mut" style="padding:12px 0">Không còn ai cần link mời.</div>`;

  $('#wzCopy').onclick = async () => {
    try { await navigator.clipboard.writeText(data.text); toast('Đã chép — dán vào Zalo nhóm'); }
    catch { toast('Trình duyệt không cho chép — chép tay giúp nhé'); }
  };
  $('#wzDone').onclick = () => { history.replaceState({}, '', '/'); boot(); };
}

function renderNoSession() {
  document.body.classList.add('noapp');
  $('#root').innerHTML = `<div class="claimwrap"><div class="claimcard">
    <div class="lb">k3vaceo · Khoá K03</div><h1>Chưa đăng nhập</h1>
    <p class="sub">Lần đầu đăng nhập thì tự nhận diện bằng tên và số điện thoại — không cần ai gửi gì cho bạn.</p>
    <button class="wide" id="toVao">Tôi là học viên K03, đăng nhập lần đầu</button>
    <button class="wide ghost" id="toLogin" style="margin-top:10px">Đã khai email rồi — đăng nhập bằng email</button>
  </div></div>`;
  $('#toVao').onclick = () => { history.pushState({}, '', '/dangnhap'); renderVao(); };
  $('#toLogin').onclick = () => { history.pushState({}, '', '/dangnhap/email'); renderLogin(); };
}

/* ═══════════ KHUNG ỨNG DỤNG ═══════════ */
const VIEWS = ['nay', 'bai', 'nhom', 'kho', 'quy'];

/* Icon thanh điều hướng. Bản trước vẽ bằng CSS — mỗi tab là một khối bo góc
   khác nhau, nên năm tab trông gần như y hệt và không gợi ra thứ gì. Nay vẽ
   bằng SVG nét, mỗi hình nói đúng việc của tab đó.

   Dùng currentColor để tự đổi màu theo trạng thái chọn, stroke-width 1.6 khớp
   với độ dày cũ, và vẽ trên khung 20×20 cho nét rơi đúng nửa pixel. Nhúng
   thẳng vào chuỗi HTML chứ không tải tệp ngoài: mục 8 SRS cấm build step, mà
   thêm một lượt tải chỉ để lấy năm hình nhỏ cũng không đáng. */
const svg = (d, them = '') => `<svg class="g" viewBox="0 0 20 20" fill="none" aria-hidden="true"
  stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${d}${them}</svg>`;

const ICON = {
  // Hôm nay: tờ lịch, có dấu ngày đang tới.
  nay: svg(`<rect x="2.8" y="4.2" width="14.4" height="13" rx="2.4"/>
            <path d="M2.8 8.2h14.4M6.6 2.8v2.8M13.4 2.8v2.8"/>
            <circle cx="10" cy="12.4" r="1.5" fill="currentColor" stroke="none"/>`),
  // Bài: trang giấy có dòng chữ — bản kế hoạch kinh doanh tám phần.
  bai: svg(`<path d="M4.6 2.8h6.6l4.2 4.2v10.2a1.8 1.8 0 0 1-1.8 1.8H4.6a1.8 1.8 0 0 1-1.8-1.8V4.6a1.8 1.8 0 0 1 1.8-1.8Z"/>
            <path d="M11 2.9V7.2h4.3M6.4 11h7.2M6.4 14.2h4.8"/>`),
  // Nhóm: hai người.
  nhom: svg(`<circle cx="8" cy="7.2" r="2.9"/>
             <path d="M2.9 16.8a5.1 5.1 0 0 1 10.2 0"/>
             <path d="M13.6 4.7a2.9 2.9 0 0 1 0 5.5M14.6 16.8a5 5 0 0 0-1.4-3.5"/>`),
  // Tư liệu: tập tài liệu xếp chồng — ứng dụng chỉ giữ đường dẫn, không giữ file.
  kho: svg(`<path d="M6.2 2.8h6l3.6 3.6v8.4a1.8 1.8 0 0 1-1.8 1.8H6.2a1.8 1.8 0 0 1-1.8-1.8V4.6a1.8 1.8 0 0 1 1.8-1.8Z"/>
            <path d="M11.9 2.9v3.7h3.7"/>
            <path d="M2.6 6.6v9.6a2.4 2.4 0 0 0 2.4 2.4h7.6"/>`),
  // Quỹ: tờ tiền.
  quy: svg(`<rect x="2.4" y="5.2" width="15.2" height="9.6" rx="2"/>
            <circle cx="10" cy="10" r="2.4"/>
            <path d="M5.4 8.2v3.6M14.6 8.2v3.6"/>`),
};

function shellHtml() {
  return `
  <header><div class="wrap">
    <div class="hd">
      <div class="hl"><span class="g" id="hdGroup"></span><span class="s">Khoá K03</span></div>
      <div class="cd"><span class="n num" id="cdN">–</span><span class="u">ngày đến bảo vệ</span></div>
      <button class="av avbtn" id="avMe"></button>
    </div>
    <div class="rail" id="rail"></div>
    <div class="raillb"><span>Tiến độ bài <b class="num" id="pAll">0%</b></span><span id="pOwn"></span></div>
  </div></header>
  <main class="wrap">
    <section class="view on" id="v-nay"></section>
    <section class="view" id="v-bai"></section>
    <section class="view" id="v-nhom"></section>
    <section class="view" id="v-kho"></section>
    <section class="view" id="v-quy"></section>
  </main>
  <nav><div class="navin">
    <button class="nb" data-v="nay">${ICON.nay}Hôm nay</button>
    <button class="nb" data-v="bai">${ICON.bai}Bài</button>
    <button class="nb" data-v="nhom">${ICON.nhom}Nhóm</button>
    <button class="nb" data-v="kho">${ICON.kho}Tư liệu</button>
    <button class="nb" data-v="quy">${ICON.quy}Quỹ</button>
  </div></nav>`;
}

function route() {
  let v = (location.hash || '#/nay').replace('#/', '');
  if (!VIEWS.includes(v)) v = 'nay';
  document.querySelectorAll('.view').forEach(x => x.classList.remove('on'));
  document.querySelectorAll('.nb').forEach(x => x.classList.toggle('on', x.dataset.v === v));
  $('#v-' + v).classList.add('on');
  window.scrollTo({ top: 0, behavior: 'instant' });
  if (v === 'bai') drawBai();
  if (v === 'nhom') drawNhom();
  if (v === 'kho') drawKho('all');
  if (v === 'quy') drawQuy();
  if (v === 'nay') danhDauDaXem();
}

// Chấm đỏ trên tab Hôm nay. Đây là đường báo tin chạy trên MỌI máy — không cần
// quyền, không cần cài gì, không phụ thuộc Apple hay Google. Thông báo đẩy chỉ
// là lớp thêm cho ai đã cài ứng dụng lên màn hình chính.
function veChamDo() {
  const nut = document.querySelector('.nb[data-v="nay"]');
  if (!nut) return;
  nut.classList.toggle('cham', (HOME?.thong_bao_moi ?? 0) > 0);
}

// Chỉ đánh dấu khi người ta THẬT SỰ đang đứng ở tab Hôm nay. refreshHome() gọi
// drawNay() sau đủ thứ thao tác ở tab khác; đánh dấu ở đó thì chấm đỏ tắt trong
// khi người dùng chưa hề nhìn thấy thông báo.
async function danhDauDaXem() {
  if (!(HOME?.thong_bao_moi > 0)) return;
  try { await apiPost('/api/thong-bao/da-xem'); } catch { return; }
  HOME.thong_bao_moi = 0;
  (HOME.thong_bao ?? []).forEach(t => { t.moi = 0; });
  veChamDo(); drawNay();
}
const go = v => { location.hash = '#/' + v; };

/* ─── Đầu trang ─── */
function drawHead() {
  $('#hdGroup').textContent = HOME.group?.label ?? '';
  $('#avMe').innerHTML = esc(ini(HOME.me.full_name));
  $('#avMe').style.background = `hsl(${hue(HOME.me.full_name)} 34% 42%)`;
  $('#avMe').onclick = openMe;

  const sections = HOME.progress.sections;
  $('#rail').innerHTML = sections.map(s =>
    `<button class="seg ${s.pct === 0 ? 'zero' : ''}" title="${esc(s.title)}" data-goto-bai="1"><i style="width:${s.pct}%"></i></button>`).join('');
  document.querySelectorAll('#rail [data-goto-bai]').forEach(b => { b.onclick = () => go('bai'); });
  $('#pAll').textContent = HOME.progress.overall_pct + '%';
  $('#pOwn').innerHTML = HOME.progress.mine_count
    ? `Bạn giữ <b class="num">${HOME.progress.mine_count}</b> phần`
    : `<span style="color:var(--due)">Bạn chưa nhận phần nào</span>`;

  if (HOME.cohort?.defense_on) {
    // Mốc "hôm nay" lấy từ MÁY CHỦ (giờ Việt Nam), không lấy từ máy người
    // dùng: máy đặt lệch múi giờ thì con số lệch một ngày, và trang /lich công
    // khai vốn tính bằng ngày máy chủ sẽ nói khác ứng dụng — hai nguồn sự thật
    // cho cùng một con số. Không có hom_nay thì mới lùi về ngày của máy.
    const g = s => { const [y, mo, d] = s.split('-').map(Number); return Date.UTC(y, mo - 1, d); };
    let today;
    if (HOME.hom_nay) {
      today = g(HOME.hom_nay);
    } else {
      const t = new Date();
      today = Date.UTC(t.getFullYear(), t.getMonth(), t.getDate());
    }
    const days = Math.round((g(HOME.cohort.defense_on) - today) / 86400000);
    $('#cdN').textContent = days > 0 ? days : 0;
  }
}

/* ─── Hôm nay ─── */
function drawNay() {
  const a = HOME.action;
  $('#v-nay').innerHTML = `
  <div class="hero">
    <div class="lb">Việc của bạn</div>
    <h2>${esc(a.h)}</h2><p>${esc(a.p)}</p>
    <button class="cta ${a.done ? 'done' : ''}" id="heroCta">${esc(a.c)} <span>→</span></button>
  </div>
  ${veThongBao()}
  ${veLichHoc()}
  <div class="sect">
    <div class="eb">Cơ cấu nhóm</div>
    <div class="card">${[
      ['truong_nhom', 'Trưởng nhóm'],
      ['pho_nhom', 'Phó nhóm'],
      // Thành viên tiêu biểu: quyền ngang phó nhóm, không phải chức danh suông.
      ['tieu_bieu', 'Thành viên tiêu biểu'],
    ].map(([role, label]) => {
      const o = HOME.officers.find(x => x.role === role);
      return `<div class="of ${o?.member_id ? '' : 'void'}">
        <span class="rl">${label}</span>
        <div style="flex:1;min-width:0">
          ${o?.member_id
            ? `<div class="nm">${esc(o.full_name)}</div><div class="co">${esc(o.title || '')}${o.title && o.company ? ' · ' : ''}${esc(o.company || '')}</div>`
            : `<div class="nm">Chưa có ai nhận</div>`}
          <div class="src">${esc(o?.note || '')}</div></div>
        ${iAmOfficer() ? `<button class="ico" data-role="${role}" data-label="${esc(label)}" aria-label="Sửa ${esc(label)}">✎</button>` : ''}
      </div>`;
    }).join('')}</div>
    ${iAmOfficer() ? `<button class="wide ghost" id="inviteBtn" style="margin-top:10px">Phát link mời cho người chưa đăng nhập</button>` : ''}
  </div>
  <div class="sect" id="joinBox" style="display:none"></div>
  <div class="sect">
    <div class="eb">Đang diễn ra</div>
    <div class="card"><div class="cb" style="padding:4px 16px">
      ${HOME.feed.length ? HOME.feed.map(f => `<div class="fd">${avatar(f.actor_name)}
          <div class="x"><b>${esc(short(f.actor_name))}</b> ${esc(f.summary)}</div>
          <span class="t">${vnDate(f.created_at)}</span></div>`).join('')
        : '<div class="cb mut">Chưa có hoạt động nào.</div>'}
    </div></div>
  </div>`;

  $('#heroCta').onclick = () => {
    if (a.target === 'profile') openMemberEdit(HOME.me.id);
    else if (a.target === 'plan') go('bai');
    else if (a.target === 'insight') { go('bai'); setTimeout(openInsightAdd, 260); }
    else if (a.target === 'fund') go('quy');
  };
  document.querySelectorAll('#v-nay .ico[data-role]').forEach(btn => {
    btn.onclick = () => openOfficerEdit(btn.dataset.role, btn.dataset.label);
  });
  if ($('#inviteBtn')) $('#inviteBtn').onclick = openInviteSheet;
  if ($('#lichThem')) $('#lichThem').onclick = () => suaBuoi(null);
  if ($('#tbThem')) $('#tbThem').onclick = themThongBao;
  document.querySelectorAll('#v-nay [data-buoi]').forEach(b => {
    b.onclick = () => suaBuoi(Number(b.dataset.buoi));
  });
  document.querySelectorAll('#v-nay [data-xoatb]').forEach(b => {
    b.onclick = () => xoaThongBao(Number(b.dataset.xoatb));
  });
  if (iAmOfficer()) drawJoinRequests();
}

/* ─── Lịch học và thông báo của lớp ───
   Ban tổ chức gửi lịch qua Zalo mỗi tuần và tin nhắn ấy trôi mất sau hai ngày.
   Đây là chỗ chốt lại — đọc thôi, không phải điểm danh (mục 1.4 SRS xếp điểm
   danh ngoài phạm vi v1). Chỉ Ban cán sự lớp sửa được. */

const THU = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

// 'YYYY-MM-DD' → 'Thứ Năm 27/8'. Cắt chuỗi rồi dựng Date theo giờ địa phương;
// new Date('2026-08-27') bị hiểu là UTC nên ở múi giờ Việt Nam vẫn ra đúng
// ngày, nhưng ở múi âm thì lùi một ngày — không đáng để dính bẫy ấy.
function ngayVN(iso) {
  if (!iso) return '';
  const [y, m, d] = String(iso).split('-').map(Number);
  if (!y || !m || !d) return String(iso);
  return `${THU[new Date(y, m - 1, d).getDay()]} ${d}/${m}`;
}

function khungGio(b) {
  if (b.tu_gio && b.den_gio) return `${b.tu_gio}–${b.den_gio}`;
  if (b.tu_gio) return `từ ${b.tu_gio}`;
  if (b.den_gio) return `đến ${b.den_gio}`;
  return b.ghi_chu ? '' : 'cả buổi';
}

function veLichHoc() {
  const ds = HOME.lich_hoc ?? [];
  const sua = !!HOME.can_sua_lich;
  if (!ds.length && !sua) return '';
  return `
  <div class="sect">
    <div class="eb">Lịch học sắp tới${ds.length ? ` <span class="c">${ds.length}</span>` : ''}</div>
    <div class="card"><div class="cb" style="padding:4px 16px">
      ${ds.length ? ds.map(b => `<div class="fd" style="align-items:flex-start">
        <div class="x">
          <div style="font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--ink3)">
            ${esc(ngayVN(b.ngay))}${khungGio(b) ? ' · ' + esc(khungGio(b)) : ''}${b.ghi_chu ? ' · ' + esc(b.ghi_chu) : ''}</div>
          <b>${esc(b.chu_de)}</b>
          ${b.giang_vien ? `<div style="font-size:12px;color:var(--ink2);margin-top:2px">${esc(b.giang_vien)}</div>` : ''}
        </div>
        ${sua ? `<button class="ico" data-buoi="${b.id}" aria-label="Sửa buổi ${esc(b.chu_de)}">✎</button>` : ''}
      </div>`).join('')
        : '<div class="cb mut">Chưa có buổi nào trong lịch.</div>'}
    </div></div>
    ${sua ? `<button class="wide ghost" id="lichThem" style="margin-top:10px">+ Thêm buổi học</button>` : ''}
    ${ds.length ? `<a class="wide ghost nutlich" href="/api/lich/k3vaceo.ics">Thêm cả khoá vào lịch điện thoại</a>` : ''}
  </div>`;
}

function veThongBao() {
  const ds = HOME.thong_bao ?? [];
  const dangLop = !!HOME.can_sua_lich;          // Ban cán sự lớp
  const dangNhom = iAmOfficer();                 // trưởng / phó nhóm
  if (!ds.length && !dangLop && !dangNhom) return '';

  const goDuoc = t => (t.group_id == null ? dangLop : dangNhom);
  return `
  <div class="sect">
    <div class="eb">Thông báo${HOME.thong_bao_moi ? ` <span class="c">${HOME.thong_bao_moi} mới</span>` : ''}</div>
    ${ds.length ? ds.map(t => `<div class="warn" style="margin-bottom:8px;display:flex;gap:10px;align-items:flex-start">
      <div style="flex:1;min-width:0">${esc(t.noi_dung)}
        <div style="font-size:11.5px;color:var(--ink3);margin-top:4px;font-weight:400">
          ${t.group_id == null ? 'Cả lớp' : 'Riêng nhóm'}${t.nguon ? ' · ' + esc(t.nguon) : ''}${t.moi ? ' · mới' : ''}</div></div>
      ${goDuoc(t) ? `<button class="ico" data-xoatb="${t.id}" aria-label="Gỡ thông báo">✕</button>` : ''}
    </div>`).join('')
      : '<div class="card"><div class="cb mut">Chưa có thông báo nào.</div></div>'}
    ${dangLop || dangNhom ? `<button class="wide ghost" id="tbThem" style="margin-top:2px">+ Thêm thông báo</button>` : ''}
  </div>`;
}

// id = null là thêm mới.
function suaBuoi(id) {
  const b = id ? (HOME.lich_hoc ?? []).find(x => x.id === id) : null;
  openSheet(`
   <h3>${b ? 'Sửa buổi học' : 'Thêm buổi học'}</h3>
   <p class="sub">Cả lớp đọc được lịch này. Sai một ngày là có người đi nhầm buổi, nên xem kỹ trước khi lưu.</p>
   <label class="f">Ngày</label><input id="lNgay" type="date" value="${esc(b?.ngay || '')}">
   <label class="f">Từ giờ</label><input id="lTu" type="time" value="${esc(b?.tu_gio || '')}">
   <label class="f">Đến giờ</label><input id="lDen" type="time" value="${esc(b?.den_gio || '')}">
   <div class="hintline">Để trống giờ nếu thông báo chỉ nói “buổi sáng”, rồi ghi rõ vào ô ghi chú.</div>
   <label class="f">Chủ đề</label><input id="lChuDe" maxlength="200" value="${esc(b?.chu_de || '')}"
     placeholder="Hướng dẫn lập Kế hoạch kinh doanh">
   <label class="f">Giảng viên</label><input id="lGV" maxlength="200" value="${esc(b?.giang_vien || '')}"
     placeholder="TS. Trần Đoàn Kim — VCCI">
   <label class="f">Ghi chú</label><input id="lGhiChu" maxlength="300" value="${esc(b?.ghi_chu || '')}"
     placeholder="Buổi sáng">
   ${b ? `<div style="margin-top:14px;display:flex;flex-direction:column;gap:8px">
     <button class="wide ghost" id="lXoa" style="padding:11px;font-size:14px">Xoá buổi này khỏi lịch</button>
   </div>` : ''}
   <div id="lErr" class="errline" style="display:none"></div>
   <div class="sa"><button class="big c" id="lThoi">Thôi</button>
     <button class="big go" id="lLuu">Lưu</button></div>`);

  $('#lThoi').onclick = closeSheet;
  if ($('#lXoa')) $('#lXoa').onclick = () => submitting($('#lXoa'), async () => {
    await apiDelete(`/api/lich/${id}`);
    await refreshHome();
  }, 'Đã xoá khỏi lịch');

  $('#lLuu').onclick = () => {
    if (!$('#lNgay').value) {
      $('#lErr').textContent = 'Phải có ngày.'; $('#lErr').style.display = 'block'; return;
    }
    if (!$('#lChuDe').value.trim()) {
      $('#lErr').textContent = 'Phải có chủ đề.'; $('#lErr').style.display = 'block'; return;
    }
    const than = {
      ngay: $('#lNgay').value, tu_gio: $('#lTu').value || null, den_gio: $('#lDen').value || null,
      chu_de: $('#lChuDe').value, giang_vien: $('#lGV').value, ghi_chu: $('#lGhiChu').value,
    };
    submitting($('#lLuu'), async () => {
      if (id) await apiPatch(`/api/lich/${id}`, than);
      else await apiPost('/api/lich', than);
      await refreshHome();
    }, id ? 'Đã lưu' : 'Đã thêm vào lịch');
  };
}

function themThongBao() {
  const dangLop = !!HOME.can_sua_lich;
  const nhom = HOME?.group?.no ? `Nhóm ${HOME.group.no}` : 'nhóm mình';
  openSheet(`
   <h3>Thêm thông báo</h3>
   <p class="sub">Thứ cần biết mà không gắn vào một buổi cụ thể. Đây không phải chỗ nhắn tin —
     nguyên tắc N1: Zalo để bàn, ứng dụng để chốt.</p>
   ${dangLop ? `<label class="f">Ai nhận</label>
   <select id="tbCap"><option value="nhom">${esc(nhom)} — chỉ nhóm mình</option>
     <option value="lop">Cả lớp — 134 người</option></select>
   <div class="hintline" id="tbCapHint"></div>` : `<div class="hintline">Thông báo này chỉ ${esc(nhom)} thấy.</div>`}
   <label class="f">Nội dung</label>
   <textarea id="tbND" rows="4" maxlength="1000" placeholder="Chương trình tham quan kiến tập chuyển sang chiều thứ Sáu 11/9/2026."></textarea>
   <label class="f">Ai phát</label><input id="tbNguon" maxlength="60" value="${dangLop ? 'Ban tổ chức' : esc(nhom)}">
   <label class="f">Ẩn sau ngày</label><input id="tbHan" type="date">
   <div class="hintline">Quá ngày này thì thông báo tự thôi hiện. Để trống là hiện mãi.</div>
   <div id="tbErr" class="errline" style="display:none"></div>
   <div class="sa"><button class="big c" id="tbThoi">Thôi</button>
     <button class="big go" id="tbLuu">Đăng</button></div>`);
  $('#tbThoi').onclick = closeSheet;

  if ($('#tbCap')) {
    const ve = () => {
      const lop = $('#tbCap').value === 'lop';
      $('#tbCapHint').innerHTML = lop
        ? '<b>Cả 134 người nhận.</b> Ai đã bật thông báo đẩy sẽ nhận ngay trên điện thoại. Đăng nhầm khó rút lại.'
        : 'Chỉ người trong nhóm bạn thấy. Nhóm khác không đọc được.';
      $('#tbNguon').value = lop ? 'Ban tổ chức' : (HOME?.group?.label || '');
    };
    $('#tbCap').onchange = ve; ve();
  }

  $('#tbLuu').onclick = () => {
    if (!$('#tbND').value.trim()) {
      $('#tbErr').textContent = 'Phải có nội dung.'; $('#tbErr').style.display = 'block'; return;
    }
    submitting($('#tbLuu'), async () => {
      await apiPost('/api/thong-bao', {
        cap: $('#tbCap') ? $('#tbCap').value : 'nhom',
        noi_dung: $('#tbND').value, nguon: $('#tbNguon').value, het_han: $('#tbHan').value || null,
      });
      await refreshHome();
    }, 'Đã đăng thông báo');
  };
}

function xoaThongBao(id) {
  const t = (HOME.thong_bao ?? []).find(x => x.id === id);
  openSheet(`<h3>Gỡ thông báo</h3>
    <p class="sub">“${esc(t?.noi_dung || '')}”</p>
    <div class="sa"><button class="big c" id="gThoi">Thôi</button>
      <button class="big go" id="gGo">Gỡ xuống</button></div>`);
  $('#gThoi').onclick = closeSheet;
  $('#gGo').onclick = () => submitting($('#gGo'), async () => {
    await apiDelete(`/api/thong-bao/${id}`);
    await refreshHome();
  }, 'Đã gỡ');
}

// Người ngoài xin vào nhóm (wizard bước 3). Chỉ hiện khi thật sự có yêu cầu —
// không có thì không chiếm chỗ trên màn hình.
async function drawJoinRequests() {
  let requests = [];
  try { requests = (await apiGet('/api/join-requests')).requests; } catch { return; }
  const box = $('#joinBox');
  if (!box || !requests.length) return;

  box.style.display = 'block';
  box.innerHTML = `
    <div class="eb">Xin vào nhóm <span class="c">${requests.length}</span></div>
    <div class="card"><div class="cb" style="padding:2px 14px">
      ${requests.map(r => `<div class="fd">
        ${avatar(r.full_name)}
        <div class="x"><b>${esc(r.full_name)}</b>
          ${r.note ? `<div style="font-size:12px;color:var(--ink2);margin-top:2px">${esc(r.note)}</div>` : ''}
          ${r.email ? `<div style="font-size:11.5px;color:var(--ink3);margin-top:2px">${esc(r.email)}</div>` : ''}</div>
        <div style="display:flex;gap:6px;align-items:center">
          <button class="tg" data-jr="${r.id}" data-ok="0">từ chối</button>
          <button class="tg go" data-jr="${r.id}" data-ok="1">nhận</button>
        </div></div>`).join('')}
    </div></div>`;

  document.querySelectorAll('#joinBox [data-jr]').forEach(b => {
    b.onclick = async () => {
      b.disabled = true;
      try {
        const r = await apiPost(`/api/join-requests/${b.dataset.jr}`, { accept: b.dataset.ok === '1' });
        if (r.accepted && r.url) {
          openSheet(`<h3>Đã nhận ${esc(r.full_name)}</h3>
            <p class="sub">Gửi link mời dưới đây cho họ qua Zalo.</p>
            <div class="card"><div class="cb" style="word-break:break-all;font-size:13px">${esc(r.url)}</div></div>
            <div class="sa"><button class="big c" id="jrC">Đóng</button><button class="big go" id="jrCopy">Chép link</button></div>`);
          $('#jrC').onclick = closeSheet;
          $('#jrCopy').onclick = async () => {
            try { await navigator.clipboard.writeText(r.url); toast('Đã chép link'); } catch { toast('Chép tay giúp nhé'); }
          };
        } else toast('Đã từ chối');
        await refreshHome();
      } catch (e) { toast(errText(e)); b.disabled = false; }
    };
  });
}

/* ─── Phát link mời ─── */
async function openInviteSheet() {
  openSheet(`<h3>Phát link mời</h3><p class="sub">Đang lấy danh sách…</p>`);
  let data;
  try { data = await apiPost('/api/wizard/invites'); }
  catch (e) { closeSheet(); toast(errText(e)); return; }

  const lines = data.lines;
  openSheet(`
   <h3>Phát link mời</h3>
   <p class="sub">${lines.length ? 'Mỗi người một link riêng. Chép cả khối rồi dán vào Zalo nhóm.' : 'Cả nhóm đã nhận tên xong — không còn ai cần link.'}</p>
   ${lines.length ? `<div class="card"><div class="cb" style="padding:0 14px">
     ${lines.map(l => `<div class="fd"><div class="x"><b>${esc(l.full_name)}</b>
       <div style="font-size:11.5px;color:var(--ink3);word-break:break-all;margin-top:2px">
         ${l.url ? esc(l.url) : 'đã phát trước đó — dùng nút phát lại ở tab Nhóm'}</div></div></div>`).join('')}
   </div></div>
   <button class="wide" id="copyAll" style="margin-top:12px">Chép cả khối</button>` : ''}
   <div class="sa"><button class="big c" id="ivClose">Đóng</button></div>`);
  $('#ivClose').onclick = closeSheet;
  if ($('#copyAll')) $('#copyAll').onclick = async () => {
    try { await navigator.clipboard.writeText(data.text); toast('Đã chép — dán vào Zalo nhóm'); }
    catch { toast('Trình duyệt không cho chép tự động — chép tay giúp nhé'); }
  };
}

/* ─── Bài ─── */
// Nhóm chưa có khung tám phần. Không phải lỗi — chỉ là chưa ai bắt đầu.
// Nói rõ ai làm được việc ấy, và cho làm ngay tại chỗ nếu đúng người.
function veBaiChuaCo() {
  const toi = iAmOfficer();
  $('#v-bai').innerHTML = `
  <div class="card"><div class="cb">
    <div style="font-weight:600;margin-bottom:6px">Nhóm chưa có khung bài</div>
    <div class="mut">Kế hoạch kinh doanh chấm theo tám phần. Dựng khung một lần là cả nhóm
      nhận phần, ghi tiến độ và xuất bản thảo Word được.</div>
    ${toi ? '' : `<div class="mut" style="margin-top:10px">Việc này của trưởng hoặc phó nhóm.
      Nhóm chưa có ai giữ vai thì người đầu tiên mở
      <span class="ma">k3vaceo.cuongngo.app/start</span> sẽ nhận trưởng nhóm.</div>`}
  </div></div>
  ${toi ? `<button class="wide" id="baiDung" style="margin-top:12px">Dựng khung tám phần</button>` : ''}
  <div class="foot">Đề tài sửa được sau, không cần chốt ngay lúc dựng.</div>`;

  if ($('#baiDung')) $('#baiDung').onclick = () => {
    openSheet(`
     <h3>Dựng khung tám phần</h3>
     <p class="sub">Tạo đủ tám phần theo hướng dẫn của giảng viên. Đề tài để trống cũng được, sửa sau.</p>
     <label class="f">Sản phẩm / dịch vụ</label>
     <input id="bkP" maxlength="300" placeholder="Cà phê đặc sản rang mộc">
     <label class="f">Khách hàng mục tiêu</label>
     <input id="bkC" maxlength="300" placeholder="Quán cà phê nhỏ ở Hà Nội">
     <div class="sa"><button class="big c" id="bkThoi">Thôi</button>
       <button class="big go" id="bkGo">Dựng khung</button></div>`);
    $('#bkThoi').onclick = closeSheet;
    $('#bkGo').onclick = () => submitting($('#bkGo'), async () => {
      await apiPost('/api/wizard/plan', {
        topic_product: $('#bkP').value, topic_customers: $('#bkC').value,
      });
      await drawBai(); await refreshHome();
    }, 'Đã dựng khung tám phần');
  };
}

async function drawBai() {
  if (!$('#v-bai').dataset.loaded) $('#v-bai').innerHTML = `<div class="foot" style="padding:0 2px">Đang tải…</div>`;
  try {
    PLAN = await apiGet('/api/plan');
  } catch (e) {
    // Nhóm chưa dựng khung bài thì /api/plan trả 404. Không bắt thì màn hình
    // đứng nguyên ở "Đang tải…" — chín trong mười nhóm sẽ thấy đúng cảnh ấy
    // khi mở ứng dụng lần đầu, và trông y như ứng dụng hỏng.
    if (e?.data?.error === 'plan_not_found') { $('#v-bai').dataset.loaded = '1'; return veBaiChuaCo(); }
    throw e;
  }
  $('#v-bai').dataset.loaded = '1';
  const { plan, sections, suggestions, insights, overall_pct, can_assign } = PLAN;
  const pres = PLAN.presentation ?? { total_minutes: 0, limit_minutes: 20, speaker_count: 0 };
  const topicDone = plan.topic_product && plan.topic_customers;

  $('#v-bai').innerHTML = `
  <div class="rub">
    <div class="rc"><div class="p">40%</div><div class="l">Thuyết trình</div>
      <ul><li>Không quá 20 phút</li><li>Trả lời hội đồng</li><li>Nhiều người cùng nói</li></ul></div>
    <div class="rc"><div class="p">60%</div><div class="l">Bài viết</div>
      <ul><li>Tính khả thi</li><li>Số liệu có nguồn</li><li>Đủ bảy phần</li><li>Nhiều người cùng viết</li></ul></div>
  </div>
  <div class="foot" style="padding:0 2px 18px">
    Mục “khả năng làm việc nhóm” được chấm ở cả hai nửa. Nhật ký ở màn hình Hôm nay tự ghi ai làm gì —
    đến 26/9 nó là bằng chứng, không phải lời nói.
  </div>

  <div class="eb">Đề tài</div>
  <div class="card"><div class="cb">
    ${topicDone
      ? `<div class="fi"><div class="k">Sản phẩm / dịch vụ</div><div class="v">${esc(plan.topic_product)}</div></div>
         <div class="fi" style="margin-bottom:0"><div class="k">Khách hàng mục tiêu</div><div class="v">${esc(plan.topic_customers)}</div></div>`
      : `<div style="font-weight:600;margin-bottom:4px;color:var(--due)">Nhóm chưa chốt đề tài</div>
         <div class="mut">Chưa có sản phẩm và khách hàng mục tiêu thì bảy phần sau đều treo.</div>`}
    ${can_assign ? `<button class="wide ghost" id="topicBtn" style="margin-top:13px;padding:11px;font-size:14px">
        ${topicDone ? 'Sửa đề tài' : 'Chốt đề tài'}</button>` : ''}
  </div></div>

  <div class="eb" style="margin-top:26px">Tám phần <span class="c ${overall_pct === 100 ? 'xong' : ''}">${overall_pct === 100 ? '✓ xong' : overall_pct + '%'}</span></div>
  <div class="card">${sections.map(s => {
    const sg = suggestions[String(s.ord)];
    return `<button class="pt ${s.pct === 0 ? 'zero' : ''}" data-section="${s.id}">
      <span class="pnum">${s.ord === 0 ? '—' : '0' + s.ord}</span>
      <div class="pbd">
        <h4>${esc(s.title)}</h4>
        <div class="rq">${esc(s.requirement)}</div>
        ${s.owner_member_id
          ? `<div class="own">${avatar(s.owner_name)} ${esc(short(s.owner_name))}</div>`
          : sg ? `<span class="hint">✦ hợp với ${esc(short(sg.full_name))}</span>`
               : `<span class="tg due">chưa ai nhận</span>`}
        ${s.note ? `<div class="rq" style="margin-top:7px;margin-bottom:0">Còn thiếu: ${esc(s.note)}</div>` : ''}
        <div class="pbar"><i style="width:${s.pct}%"></i></div>
      </div>
      <span class="pct ${s.pct === 100 ? 'xong' : ''}">${s.pct === 100 ? '✓' : s.pct + '%'}</span></button>`;
  }).join('')}</div>

  <div class="eb" style="margin-top:28px">Tâm đắc <span class="c">${insights.length}</span></div>
  ${insights.length ? insights.map(q => `<div class="q">
      <blockquote>“${esc(q.body)}”</blockquote>
      <div class="qf"><span class="w">${esc(q.speaker)}</span><span>·</span><span>${vnDate(q.heard_on)}</span>
        ${q.section_ord !== null && q.section_ord !== undefined ? `<span class="tg">→ phần ${q.section_ord}</span>` : ''}
        ${q.created_by === HOME.me.id || iAmOfficer() ? `<button class="lnk" data-del-insight="${q.id}">gỡ</button>` : ''}
      </div></div>`).join('')
    : `<div class="card"><div class="cb mut">Chưa ghi câu nào. Nghe được câu hay trong buổi học thì ghi lại — nó chảy thẳng vào bài.</div></div>`}
  <button class="wide ghost" id="addInsight" style="margin-top:6px">+ Ghi một câu vừa nghe được</button>

  <div class="eb" style="margin-top:28px">Thuyết trình
    <span class="c">${pres.total_minutes}/${pres.limit_minutes} phút</span></div>
  <div class="card">
    <div class="cb" style="padding-bottom:10px">
      <div class="${pres.total_minutes > pres.limit_minutes ? 'warn' : 'mut'}" style="font-size:13px">
        ${pres.total_minutes > pres.limit_minutes
          ? `<b>Quá ${pres.total_minutes - pres.limit_minutes} phút.</b> Ba-rem chấm “không quá 20 phút” — cắt bớt trước khi lên bảo vệ.`
          : `Đã phân ${pres.total_minutes} phút cho ${pres.speaker_count} người nói. Ba-rem chấm cả “không quá 20 phút” lẫn “nhiều người cùng nói”.`}
      </div>
    </div>
    ${sections.map(s => `<div class="prow">
      <span class="pnum">${s.ord === 0 ? '—' : '0' + s.ord}</span>
      <div class="pbd"><div style="font-size:13.5px;font-weight:600">${esc(s.title)}</div>
        <div style="font-size:12.5px;color:${s.present_name ? 'var(--ink2)' : 'var(--ink3)'};margin-top:2px">
          ${s.present_name ? esc(s.present_name) : 'chưa phân công'}</div></div>
      <span class="pct">${s.present_minutes ? s.present_minutes + "'" : '—'}</span>
      ${can_assign ? `<button class="ico" data-present="${s.id}" aria-label="Phân công thuyết trình">✎</button>` : ''}
    </div>`).join('')}
  </div>

  <button class="wide ghost" id="exportDocx" style="margin-top:16px">Tải bản thảo Word (8 phần)</button>
  <div class="foot">Bản thảo dựng sẵn khung tám phần đúng thứ tự, kèm phân công, tâm đắc và nguồn đã gắn.
    Nội dung từng phần thì nhóm tự viết trong Word.</div>`;

  document.querySelectorAll('#v-bai [data-section]').forEach(b => {
    b.onclick = () => openSectionEdit(Number(b.dataset.section));
  });
  document.querySelectorAll('#v-bai [data-del-insight]').forEach(b => {
    b.onclick = async () => {
      try { await apiDelete(`/api/insights/${b.dataset.delInsight}`); toast('Đã gỡ'); await drawBai(); await refreshHome(); }
      catch (e) { toast(errText(e)); }
    };
  });
  $('#addInsight').onclick = openInsightAdd;
  if ($('#topicBtn')) $('#topicBtn').onclick = openTopicEdit;
  document.querySelectorAll('#v-bai [data-present]').forEach(b => {
    b.onclick = () => openPresentEdit(Number(b.dataset.present));
  });
  $('#exportDocx').onclick = () => {
    // Để trình duyệt tự tải: endpoint trả sẵn content-disposition, cookie phiên
    // đi kèm vì cùng tên miền.
    location.href = '/api/plan/export.docx';
    toast('Đang tải bản thảo…');
  };
}

function openPresentEdit(sectionId) {
  const s = PLAN.sections.find(x => x.id === sectionId);
  const pres = PLAN.presentation;
  const others = pres.total_minutes - (s.present_minutes || 0);
  openSheet(`
   <h3>${s.ord === 0 ? '' : 'Phần ' + s.ord + ' · '}${esc(s.title)}</h3>
   <p class="sub">Ai đứng nói phần này và nói bao lâu. Các phần khác đang chiếm ${others} phút,
     còn lại ${Math.max(0, pres.limit_minutes - others)} phút trong giới hạn 20.</p>
   <label class="f">Người nói</label>
   <select id="prM"><option value="">— chưa phân công —</option>
     ${PLAN.members.map(m => `<option value="${m.id}" ${s.present_member_id === m.id ? 'selected' : ''}>${esc(m.full_name)}</option>`).join('')}</select>
   <label class="f">Bao nhiêu phút</label>
   <input id="prN" type="number" min="0" max="20" inputmode="numeric" value="${s.present_minutes ?? ''}">
   <div class="sa"><button class="big c" id="prCancel">Thôi</button>
     <button class="big go" id="prSave">Lưu</button></div>`);
  $('#prCancel').onclick = closeSheet;
  $('#prSave').onclick = () => submitting($('#prSave'), async () => {
    const v = $('#prM').value, n = $('#prN').value;
    await apiPatch(`/api/plan/sections/${sectionId}`, {
      present_member_id: v === '' ? null : Number(v),
      present_minutes: n === '' ? null : Number(n),
    });
    await drawBai();
  }, 'Đã phân công');
}

function openTopicEdit() {
  const p = PLAN.plan;
  openSheet(`
   <h3>Đề tài của nhóm</h3>
   <p class="sub">Bản mẫu của giảng viên dựng quanh một sản phẩm mới — không bắt buộc phải là công ty có sẵn của ai.</p>
   <label class="f">Sản phẩm hoặc dịch vụ</label>
   <textarea id="tP" maxlength="300" placeholder="Nhóm định làm gì">${esc(p.topic_product)}</textarea>
   <label class="f">Khách hàng mục tiêu</label>
   <textarea id="tC" maxlength="300" placeholder="Bán cho ai">${esc(p.topic_customers)}</textarea>
   <div class="sa"><button class="big c" id="tCancel">Thôi</button>
     <button class="big go" id="tSave">Lưu</button></div>`);
  $('#tCancel').onclick = closeSheet;
  $('#tSave').onclick = () => submitting($('#tSave'), async () => {
    await apiPatch('/api/plan/topic', { topic_product: $('#tP').value, topic_customers: $('#tC').value });
    await drawBai(); await refreshHome();
  }, 'Đã lưu đề tài');
}

async function openSectionEdit(sectionId) {
  const s = PLAN.sections.find(x => x.id === sectionId);
  const sg = PLAN.suggestions[String(s.ord)];
  const canAssign = PLAN.can_assign;
  const iOwn = s.owner_member_id === HOME.me.id;
  const members = PLAN.members;

  openSheet(`
   <h3>${s.ord === 0 ? '' : 'Phần ' + s.ord + ' · '}${esc(s.title)}</h3>
   <p class="sub">${esc(s.requirement)}</p>
   ${sg && canAssign ? `<div class="card" style="margin-bottom:14px"><div class="cb" style="display:flex;align-items:center;gap:11px">
     ${avatar(sg.full_name)}<div style="flex:1;min-width:0"><div style="font-size:12px;color:var(--go);font-weight:600">Gợi ý theo chức vụ</div>
     <div style="font-size:14px;font-weight:600">${esc(sg.full_name)}</div>
     <div style="font-size:12.5px;color:var(--ink2)">${esc(sg.title)}</div></div>
     <button class="tg go" style="padding:7px 12px" id="pickSg">Chọn</button>
   </div></div>` : ''}
   ${canAssign ? `<label class="f">Ai phụ trách</label>
     <select id="sOwner"><option value="">— chưa ai nhận —</option>
       ${members.map(m => `<option value="${m.id}" ${s.owner_member_id === m.id ? 'selected' : ''}>${esc(m.full_name)}${m.title ? ' · ' + esc(m.title) : ''}</option>`).join('')}
     </select>`
    : `<label class="f">Ai phụ trách</label>
       <div class="ro">${s.owner_name ? esc(s.owner_name) : 'chưa ai nhận'} <span style="color:var(--ink3)">· chỉ trưởng hoặc phó nhóm đổi được</span></div>`}
   ${canAssign || iOwn ? `
     <label class="f">Đã xong bao nhiêu phần trăm</label>
     <input id="sPct" type="number" min="0" max="100" value="${s.pct}" inputmode="numeric">
     <label class="f">Còn thiếu gì</label>
     <textarea id="sNote" maxlength="500" placeholder="Đã có số liệu nào, còn thiếu nguồn nào.">${esc(s.note)}</textarea>`
    : `<div class="hintline" style="margin-top:14px">Bạn không giữ phần này nên không sửa được tiến độ. Nhắn ${s.owner_name ? esc(short(s.owner_name)) : 'trưởng nhóm'} nếu cần đổi.</div>`}
   <div class="sa"><button class="big c" id="sCancel">Thôi</button>
     ${canAssign || iOwn ? `<button class="big go" id="sSave">Lưu</button>` : ''}</div>`);

  $('#sCancel').onclick = closeSheet;
  if ($('#pickSg')) $('#pickSg').onclick = () => { $('#sOwner').value = String(sg.id); };
  if ($('#sSave')) $('#sSave').onclick = () => submitting($('#sSave'), async () => {
    const payload = { pct: Number($('#sPct').value || 0), note: $('#sNote').value };
    if (canAssign) payload.owner_member_id = $('#sOwner').value === '' ? null : Number($('#sOwner').value);
    await apiPatch(`/api/plan/sections/${sectionId}`, payload);
    await drawBai(); await refreshHome();
  }, 'Đã cập nhật');
}

function openInsightAdd() {
  const sections = PLAN?.sections ?? [];
  openSheet(`
   <h3>Câu vừa nghe được</h3>
   <p class="sub">Hai dòng là đủ. Ghi tên người nói kể cả khi họ chưa dùng ứng dụng.</p>
   <label class="f">Câu nói</label>
   <textarea id="iBody" maxlength="1000" placeholder="Chép đại ý, không cần đúng từng chữ."></textarea>
   <label class="f">Ai nói</label><input id="iWho" maxlength="120" placeholder="Giảng viên buổi 5 / tên người trong nhóm">
   <label class="f">Chảy vào phần nào</label>
   <select id="iSec"><option value="">— chưa gắn phần nào —</option>
     ${sections.map(s => `<option value="${s.id}">${s.ord === 0 ? '—' : 'Phần ' + s.ord} · ${esc(s.title)}</option>`).join('')}</select>
   <div class="sa"><button class="big c" id="iCancel">Thôi</button>
     <button class="big go" id="iSave">Ghi lại</button></div>`);
  $('#iCancel').onclick = closeSheet;
  setTimeout(() => $('#iBody')?.focus(), 240);
  $('#iSave').onclick = async () => {
    if (!$('#iBody').value.trim()) { $('#iBody').style.boxShadow = 'inset 0 0 0 2px var(--due)'; return; }
    await submitting($('#iSave'), async () => {
      await apiPost('/api/insights', {
        body: $('#iBody').value, speaker: $('#iWho').value,
        section_id: $('#iSec').value === '' ? null : Number($('#iSec').value),
      });
      if (!location.hash.includes('bai')) go('bai'); else await drawBai();
      await refreshHome();
    }, 'Đã ghi, và đã gắn vào bài');
  };
}

/* ─── Nhóm ─── */
// Thêm người vào nhóm mình. Ca có thật: Ban tổ chức chuyển Nguyễn Thị Tùng Vân
// từ Nhóm 8 sang Nhóm 6 giữa khoá, mà trong ứng dụng không có đường nào làm
// việc ấy — phải chạy workflow ghi thẳng vào D1. Không ổn để lâu.
//
// Danh sách gốc GIỮ NGUYÊN nhóm cũ: đó là bản ghi Ban tổ chức phát ngày 15/8.
// Bảng thành viên mới là "ai đang thực sự ở nhóm nào".
function openThemNguoi() {
  openSheet(`
   <h3>Thêm người vào nhóm</h3>
   <p class="sub">Tìm trong danh sách 134 người của lớp. Gõ không dấu cũng ra.</p>
   <label class="f">Tên người cần thêm</label>
   <input id="tnQ" placeholder="vd: tung van" autocomplete="off" maxlength="60">
   <div id="tnHits" style="margin-top:8px"></div>
   <div id="tnErr" class="errline" style="display:none"></div>
   <div class="sa"><button class="big c" id="tnThoi">Thôi</button></div>`);
  $('#tnThoi').onclick = closeSheet;

  let timer;
  $('#tnQ').oninput = () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const q = $('#tnQ').value.trim();
      if (q.length < 2) { $('#tnHits').innerHTML = ''; return; }
      let people;
      try { ({ people } = await apiGet(`/api/wizard/roster/search?q=${encodeURIComponent(q)}`)); }
      catch (e) { $('#tnErr').textContent = errText(e); $('#tnErr').style.display = 'block'; return; }

      $('#tnHits').innerHTML = people.length
        ? people.map(p => `<button class="opt" data-them='${esc(JSON.stringify(p))}'
              ${p.already_member ? 'disabled style="opacity:.5"' : ''}>
            <div style="flex:1;min-width:0">
              <div style="font-weight:600;font-size:14.5px">${esc(p.full_name)}</div>
              <div style="font-size:12.5px;color:var(--ink2)">${esc(p.group_label)}${p.title ? ' · ' + esc(p.title) : ''}</div>
            </div>
            ${p.already_member ? '<span class="tg">đã có nhóm</span>' : ''}</button>`).join('')
        : `<div class="mut" style="padding:6px 2px">Không có tên nào khớp trong danh sách lớp.</div>`;

      document.querySelectorAll('#tnHits [data-them]').forEach(b => {
        b.onclick = () => xacNhanThem(JSON.parse(b.dataset.them));
      });
    }, 250);
  };
  setTimeout(() => $('#tnQ')?.focus(), 200);
}

function xacNhanThem(p) {
  const nhomToi = HOME?.group?.label || 'nhóm mình';
  const doiNhom = p.group_label !== nhomToi;
  openSheet(`
   <h3>Thêm vào ${esc(nhomToi)}</h3>
   <div class="card" style="margin-bottom:12px"><div class="cb" style="padding:12px 14px">
     <b>${esc(p.full_name)}</b>
     <div style="font-size:12px;color:var(--ink3);margin-top:3px">${esc(p.group_label)}${p.title ? ' · ' + esc(p.title) : ''}${p.company ? '<br>' + esc(p.company) : ''}</div>
   </div></div>
   ${doiNhom ? `<div class="warn">Danh sách Ban tổ chức ghi người này ở <b>${esc(p.group_label)}</b>.
     Chỉ thêm khi Ban tổ chức đã thật sự chuyển họ sang ${esc(nhomToi)} — thêm nhầm là kéo người
     của nhóm khác vào chỗ mình.</div>` : ''}
   <div class="mut" style="margin-top:12px">Thêm xong sẽ có ngay link mời để gửi qua Zalo.
     Danh sách gốc của Ban tổ chức giữ nguyên, không sửa.</div>
   <div id="xtErr" class="errline" style="display:none"></div>
   <div class="sa"><button class="big c" id="xtLui">Chọn lại</button>
     <button class="big go" id="xtGo">Thêm vào nhóm</button></div>`);
  $('#xtLui').onclick = openThemNguoi;
  $('#xtGo').onclick = async () => {
    const nut = $('#xtGo');
    nut.disabled = true; nut.textContent = 'Đang thêm…';
    let kq;
    try {
      kq = await apiPost('/api/wizard/members', { members: [{
        roster_id: p.roster_id, full_name: p.full_name, title: p.title, company: p.company,
      }] });
    } catch (e) {
      $('#xtErr').textContent = errText(e); $('#xtErr').style.display = 'block';
      nut.disabled = false; nut.textContent = 'Thêm vào nhóm'; return;
    }
    const nguoi = (kq.created ?? [])[0];
    await drawNhom(); await refreshHome();
    if (!nguoi) { closeSheet(); toast('Người này đã có trong nhóm'); return; }

    // Thêm xong thì việc kế tiếp gần như luôn là gửi link — làm nốt tại chỗ,
    // đừng bắt đi tìm nút khác.
    let link = null;
    try { link = await apiPost(`/api/members/${nguoi.id}/invite`); } catch { /* vẫn thêm được */ }
    openSheet(`<h3>Đã thêm ${esc(nguoi.full_name)}</h3>
      ${link ? `<p class="sub">Gửi link dưới đây cho họ qua Zalo. Mở link là vào thẳng, không cần mã.</p>
        <div class="card"><div class="cb" style="word-break:break-all;font-size:13px">${esc(link.url)}</div></div>`
        : `<p class="sub">Chưa lấy được link mời. Mở hồ sơ của họ trong tab Nhóm rồi bấm
           "Phát lại link mời cho người này".</p>`}
      <div class="sa"><button class="big c" id="tnDong">Đóng</button>
        ${link ? `<button class="big go" id="tnChep">Chép link</button>` : ''}</div>`);
    $('#tnDong').onclick = closeSheet;
    if ($('#tnChep')) $('#tnChep').onclick = async () => {
      try { await navigator.clipboard.writeText(link.url); toast('Đã chép link'); }
      catch { toast('Chép tay giúp nhé'); }
    };
  };
}

async function drawNhom() {
  if (!$('#v-nhom').dataset.loaded) $('#v-nhom').innerHTML = `<div class="foot" style="padding:0 2px">Đang tải…</div>`;
  MEMBERS = (await apiGet('/api/members')).members;
  $('#v-nhom').dataset.loaded = '1';
  const officer = iAmOfficer();

  $('#v-nhom').innerHTML = `
  <div class="foot" style="padding:0 2px 16px">
    Hồ sơ lấy từ danh sách Ban tổ chức, có chỗ sai và có chỗ đã cũ.
    <b style="color:var(--ink)">Ai cũng tự sửa được hồ sơ của mình</b>, và sửa hộ được cho người cùng nhóm.
  </div>
  <div class="eb">Thành viên <span class="c">${MEMBERS.filter(m => m.claimed).length}/${MEMBERS.length}</span></div>
  <div class="card">
    ${MEMBERS.map(m => `
      <button class="mrow" data-toggle="${m.id}">
        ${avatar(m.full_name)}
        <div class="b"><div class="nm">${esc(m.full_name)}${m.claimed ? '' : '<span class="tg due" style="font-size:10px;padding:1px 7px">chưa đăng nhập</span>'}</div>
          <div class="co">${esc(m.title || '')}${m.title && m.company ? ' · ' : ''}${esc(m.company || '')}</div></div>
        <span class="ring ${m.profile_filled === 4 ? 'full' : 'part'}">${m.profile_filled === 4 ? '✓' : m.profile_filled}</span>
      </button>
      <div class="pan" id="pan${m.id}">
        <div class="fi"><div class="k">Liên hệ</div>
          <div class="v ${m.phone || m.email ? '' : 'blank'}">${esc([m.phone, m.email].filter(Boolean).join(' · ')) || 'Chưa có số điện thoại và email'}</div>
          ${m.was.phone ? `<div class="was">Ban tổ chức ghi: <s>${esc(m.was.phone)}</s></div>` : ''}</div>
        <div class="fi"><div class="k">Chức vụ / đơn vị</div>
          <div class="v">${esc(m.title || '')}${m.title && m.company ? ' · ' : ''}${esc(m.company || '')}</div>
          ${m.was.title || m.was.company ? `<div class="was">Ban tổ chức ghi: <s>${esc(m.was.title || m.title)}${m.was.title && m.was.company ? ' · ' : ''}${esc(m.was.company || '')}</s></div>` : ''}</div>
        <div class="fi"><div class="k">Bán gì</div><div class="v ${m.profile.sells_what ? '' : 'blank'}">${esc(m.profile.sells_what) || 'Chưa điền'}</div></div>
        <div class="fi"><div class="k">Bán cho ai</div><div class="v ${m.profile.sells_to ? '' : 'blank'}">${esc(m.profile.sells_to) || 'Chưa điền'}</div></div>
        <div class="fi"><div class="k">Cần gì ở nhóm</div><div class="v ${m.profile.needs ? '' : 'blank'}">${esc(m.profile.needs) || 'Chưa điền'}</div></div>
        <div class="fi"><div class="k">Giúp được gì</div><div class="v ${m.profile.offers ? '' : 'blank'}">${esc(m.profile.offers) || 'Chưa điền'}</div></div>
        <button class="wide ghost" style="padding:11px;font-size:14px" data-edit="${m.id}">
          ${m.id === HOME.me.id ? 'Sửa hồ sơ của tôi' : 'Sửa giúp — rồi báo lại chính chủ'}</button>
        ${officer ? `<button class="wide ghost" style="padding:11px;font-size:14px;margin-top:8px" data-invite="${m.id}">Phát lại link mời cho người này</button>` : ''}
        ${officer && m.id !== HOME.me.id
          ? `<button class="wide ghost" style="padding:11px;font-size:14px;margin-top:8px;color:var(--due)" data-ngung="${m.id}">Ngừng tham gia nhóm</button>` : ''}
      </div>`).join('')}
  </div>
  ${officer ? `<button class="wide ghost" id="themNguoi" style="margin-top:12px">+ Thêm người vào nhóm</button>` : ''}
  <div class="foot">Ai biết số điện thoại người còn trống thì điền hộ, chính chủ sửa lại sau.</div>
  <div id="dsNgung"></div>`;

  if ($('#themNguoi')) $('#themNguoi').onclick = openThemNguoi;
  if (officer) veNguoiDaNgung();

  document.querySelectorAll('#v-nhom [data-toggle]').forEach(btn => {
    btn.onclick = () => {
      const panel = $('#pan' + btn.dataset.toggle), was = panel.classList.contains('on');
      document.querySelectorAll('#v-nhom .pan').forEach(p => p.classList.remove('on'));
      if (!was) panel.classList.add('on');
    };
  });
  document.querySelectorAll('#v-nhom [data-edit]').forEach(btn => {
    btn.onclick = () => openMemberEdit(Number(btn.dataset.edit));
  });
  document.querySelectorAll('#v-nhom [data-ngung]').forEach(btn => {
    btn.onclick = () => xacNhanNgung(Number(btn.dataset.ngung));
  });
  document.querySelectorAll('#v-nhom [data-invite]').forEach(btn => {
    btn.onclick = async () => {
      try {
        const r = await apiPost(`/api/members/${btn.dataset.invite}/invite`);
        openSheet(`<h3>Link mời cho ${esc(r.full_name)}</h3>
          <p class="sub">Link cũ của người này đã bị vô hiệu. Gửi link dưới đây qua Zalo.</p>
          <div class="card"><div class="cb" style="word-break:break-all;font-size:13px">${esc(r.url)}</div></div>
          <div class="sa"><button class="big c" id="ivC">Đóng</button><button class="big go" id="ivCopy">Chép link</button></div>`);
        $('#ivC').onclick = closeSheet;
        $('#ivCopy').onclick = async () => {
          try { await navigator.clipboard.writeText(r.url); toast('Đã chép link'); } catch { toast('Chép tay giúp nhé'); }
        };
      } catch (e) { toast(errText(e)); }
    };
  });
}

// ── Ngừng tham gia ──────────────────────────────────────────────────────────
// Bảo lưu, chuyển trường, nghỉ hẳn — cùng một việc. Hỏi lại trước khi làm và
// nói RÕ những gì sẽ xảy ra, vì người bấm không đoán được là phần bài sẽ bị
// nhả ra và người ấy sẽ không đăng nhập lại được nữa.
async function xacNhanNgung(id) {
  const m = MEMBERS.find(x => x.id === id);
  if (!m) return;
  openSheet(`<h3>Cho ${esc(m.full_name)} ngừng tham gia?</h3>
    <p class="sub">Dùng khi ai đó bảo lưu, chuyển nhóm hoặc nghỉ hẳn.</p>
    <div class="card"><div class="cb">
      <div class="fi"><div class="k">Sẽ xảy ra</div><div class="v">
        Tên biến mất khỏi danh sách nhóm, khỏi các đợt thu và khỏi danh sách nhận phần bài.
        Người ấy không đăng nhập lại được nữa.</div></div>
      <div class="fi"><div class="k">Phần bài đang giữ</div><div class="v">
        Được nhả ra thành <b>chưa ai nhận</b> để người khác nhận tiếp.</div></div>
      <div class="fi"><div class="k">Không mất gì</div><div class="v">
        Hồ sơ vẫn còn, tiền đã đóng vẫn nằm trong số dư và vẫn hiện trong sổ thu.
        Cho tham gia lại được bất cứ lúc nào.</div></div>
    </div></div>
    <div class="sa"><button class="big c" id="ngC">Thôi</button>
      <button class="big go" id="ngOK">Cho ngừng tham gia</button></div>`);
  $('#ngC').onclick = closeSheet;
  $('#ngOK').onclick = async () => {
    $('#ngOK').disabled = true;
    try {
      const r = await apiPost(`/api/members/${id}/ngung`);
      closeSheet();
      toast(r.nha_phan?.length
        ? `${short(r.ho_ten)} đã ngừng · nhả ${r.nha_phan.length} phần bài`
        : `${short(r.ho_ten)} đã ngừng tham gia`);
      await drawNhom();
    } catch (e) { $('#ngOK').disabled = false; toast(errText(e)); }
  };
}

// Danh sách người đã ngừng chỉ trưởng và phó nhóm thấy — người thường không
// thấy gì cả, đó là ý nghĩa của "ẩn hẳn". Nhưng phải có đường quay lại, không
// thì bấm nhầm một cái là phải mở D1 ra sửa.
async function veNguoiDaNgung() {
  const hop = $('#dsNgung');
  if (!hop) return;
  let ds = [];
  try { ds = (await apiGet('/api/members/ngung')).members ?? []; } catch { return; }
  if (!ds.length) { hop.innerHTML = ''; return; }
  hop.innerHTML = `
    <div class="eb" style="margin-top:26px">Đã ngừng tham gia <span class="c">${ds.length}</span></div>
    <div class="card"><div class="cb" style="padding:2px 14px">
      ${ds.map(m => `<div class="fd">
        ${avatar(m.full_name)}
        <div class="x"><b>${esc(m.full_name)}</b>
          <div style="font-size:11.5px;margin-top:2px" class="st-no">${esc(m.title || '')}${m.title && m.company ? ' · ' : ''}${esc(m.company || '')}</div></div>
        <button class="tg" data-lai="${m.id}">cho quay lại</button>
      </div>`).join('')}
    </div></div>
    <div class="foot">Chỉ trưởng và phó nhóm thấy mục này. Phần bài đã nhả ra thì không tự đòi lại.</div>`;
  hop.querySelectorAll('[data-lai]').forEach(b => {
    b.onclick = async () => {
      b.disabled = true;
      try {
        const r = await apiPost(`/api/members/${b.dataset.lai}/tham-gia-lai`);
        toast(`${short(r.ho_ten)} đã tham gia lại`);
        await drawNhom();
      } catch (e) { b.disabled = false; toast(errText(e)); }
    };
  });
}

// Luôn đọc hồ sơ từ máy chủ trước khi mở form. Lấy từ bộ nhớ đệm sẽ có lúc
// đệm còn rỗng (vừa đăng nhập, bấm thẳng "Điền nốt" ở Hôm nay) — khi đó form
// hiện trống và bấm Lưu sẽ xoá sạch chức vụ, đơn vị, số điện thoại đang có.
async function openMemberEdit(id) {
  openSheet(`<h3>Hồ sơ</h3><p class="sub">Đang tải…</p>`);
  let m;
  try { m = (await apiGet(`/api/members/${id}`)).member; }
  catch (e) { closeSheet(); toast(errText(e)); return; }

  const own = id === HOME.me.id;
  openSheet(`
   <h3>${esc(m.full_name)}</h3>
   <p class="sub">${own ? 'Ban tổ chức ghi có chỗ sai thì sửa thẳng ở đây, không cần xin ai.'
                        : 'Bạn đang sửa hộ. Sửa xong nhớ nhắn cho chính chủ một câu.'}</p>
   ${own ? `<label class="f">Email</label><input id="eEmail" value="${esc(m.email)}" inputmode="email" maxlength="160">
            <div class="hintline">Dùng để tự đăng nhập lại nếu mất link mời.</div>` : ''}
   <label class="f">Điện thoại</label><input id="eP" value="${esc(m.phone)}" placeholder="09xx xxx xxx" inputmode="tel" maxlength="30">
   ${own ? `<div class="hintline">Sửa đúng số của bạn ở đây thì lần sau tự đăng nhập được ở màn Đăng nhập, không cần xin link mời nữa.</div>` : ''}
   <label class="f">Chức vụ</label><input id="eT" value="${esc(m.title)}" maxlength="120">
   <label class="f">Đơn vị</label><input id="eC" value="${esc(m.company)}" maxlength="160">
   <label class="f">Bán gì</label><input id="eA" value="${esc(m.profile.sells_what)}" maxlength="80">
   <label class="f">Bán cho ai</label><input id="eB" value="${esc(m.profile.sells_to)}" maxlength="80">
   <label class="f">Cần gì ở nhóm</label><input id="eD" value="${esc(m.profile.needs)}" maxlength="80">
   <label class="f">Giúp được gì cho nhóm</label><input id="eE" value="${esc(m.profile.offers)}" maxlength="80">
   <div class="hintline">Hai dòng cuối là chỗ cả nhóm dùng đến khi chia việc.</div>
   <div class="sa"><button class="big c" id="eCancel">Thôi</button>
     <button class="big go" id="eSave">Lưu</button></div>`);

  $('#eCancel').onclick = closeSheet;
  $('#eSave').onclick = () => submitting($('#eSave'), async () => {
    const patch = { title: $('#eT').value, company: $('#eC').value, phone: $('#eP').value };
    if (own) patch.email = $('#eEmail').value;
    await apiPatch(`/api/members/${id}`, patch);
    await apiPut(`/api/members/${id}/profile`, {
      sells_what: $('#eA').value, sells_to: $('#eB').value, needs: $('#eD').value, offers: $('#eE').value,
    });
    await refreshHome();
    if ($('#v-nhom').dataset.loaded) await drawNhom();
  }, 'Đã lưu');
}

async function openOfficerEdit(role, label) {
  const members = await ensureMembers();
  const current = HOME.officers.find(o => o.role === role);
  openSheet(`
   <h3>${esc(label)}</h3>
   <p class="sub">Ghi kèm ghi chú nguồn, để sau không ai phải hỏi lại bản nào đang đúng.</p>
   <label class="f">Là ai</label>
   <select id="oM"><option value="">— còn trống —</option>
     ${members.map(m => `<option value="${m.id}" ${current?.member_id === m.id ? 'selected' : ''}>${esc(m.full_name)}</option>`).join('')}</select>
   <label class="f">Ghi chú nguồn</label>
   <input id="oN" maxlength="200" placeholder="chốt trong buổi họp nhóm ngày…" value="${esc(current?.note)}">
   <div class="sa"><button class="big c" id="oCancel">Thôi</button>
     <button class="big go" id="oSave">Ghi vào</button></div>`);
  $('#oCancel').onclick = closeSheet;
  $('#oSave').onclick = () => submitting($('#oSave'), async () => {
    const v = $('#oM').value;
    await apiPut('/api/officers', { role, member_id: v === '' ? null : Number(v), note: $('#oN').value });
    await refreshHome();
  }, 'Đã cập nhật cơ cấu');
}

/* ─── Tư liệu (mã trong nguồn vẫn là 'kho' — đổi id sẽ vỡ đường dẫn và API) ─── */
const KHO_FILTERS = [['all', 'Tất cả'], ['bai', 'Cho bài'], ['buoi', 'Theo buổi'], ['lop', 'Lớp K03']];
// Một dòng tư liệu. Tách ra hàm riêng vì nay vẽ ở hai chỗ: mục của lớp và
// mục của nhóm.
// Ai sửa được một liên kết. Chép đúng ma trận của máy chủ (layLienKetSuaDuoc
// trong routes/links.js) — chỉ để khỏi bày nút bấm vào là 403; máy chủ vẫn
// kiểm lại, giao diện không bao giờ là chỗ quyết định quyền.
function suaDuocTuLieu(r) {
  if (r.created_by === HOME?.me?.id) return true;
  if (r.scope === 'class') return KHO_CAN_LOP;
  return iAmOfficer();
}

function veDongTuLieu(r) {
  const than = `<span class="ext">${esc(r.kind)}</span>
    <div class="b"><div class="t">${esc(r.title)}</div>
    <div class="m">${r.url ? vnDate(r.created_at) : 'chưa có đường dẫn — bấm ✎ để dán vào'}</div></div>`;
  const dong = r.url
    ? `<a class="rs" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${than}
        <span style="color:var(--ink3)">↗</span></a>`
    : `<div class="rs" style="cursor:default">${than}</div>`;
  // Nút ✎ phải nằm NGOÀI thẻ <a>: nhét một <button> vào trong <a> là HTML sai,
  // và bấm vào nút sẽ mở luôn đường dẫn.
  return suaDuocTuLieu(r)
    ? `<div class="rsw">${dong}<button class="ico" data-sualink="${r.id}" aria-label="Sửa ${esc(r.title)}">✎</button></div>`
    : dong;
}

// Sửa một liên kết đã có — chủ yếu để DÁN ĐƯỜNG DẪN vào mục còn trống. Không
// có màn này thì mục trống là trống vĩnh viễn, chỉ còn cách xoá đi tạo lại và
// mất luôn ngày đăng lẫn người đăng.
function openLinkEdit(id) {
  const r = (KHO_LINKS || []).find(x => x.id === id);
  if (!r) return;
  openSheet(`
   <h3>Sửa liên kết</h3>
   <p class="sub">${r.url ? 'Đổi đường dẫn, tên hoặc loại.' : 'Mục này chưa có đường dẫn — dán vào đây.'}</p>
   <label class="f">Đường dẫn</label>
   <input id="eU" inputmode="url" spellcheck="false" placeholder="https://drive.google.com/…" value="${esc(r.url || '')}">
   <div class="hintline">Để trống cũng được — thà trống còn hơn một đường dẫn hỏng cho cả lớp bấm vào.</div>
   <label class="f">Gọi là gì</label>
   <input id="eT" maxlength="200" value="${esc(r.title)}">
   <label class="f">Loại</label>
   <select id="eK">${['DRIVE','SHEET','DOCX','XLSX','PDF','WEB']
     .map(k => `<option value="${k}"${k === r.kind ? ' selected' : ''}>${k}</option>`).join('')}</select>
   <label class="f">Đóng cho</label>
   <select id="eG">${[['bai','Cho bài'],['buoi','Theo buổi học'],['lop','Việc chung của lớp']]
     .map(([v, l]) => `<option value="${v}"${v === r.tag ? ' selected' : ''}>${l}</option>`).join('')}</select>
   <div class="foot" style="padding:10px 0 0">Phạm vi (${r.scope === 'class' ? 'cả lớp' : 'nhóm mình'}) không đổi được ở đây.
     Muốn đổi thì gỡ liên kết rồi đăng lại, để nhật ký ghi rõ.</div>
   <div id="eErr" class="errline" style="display:none"></div>
   <div class="sa"><button class="big c" id="eThoi">Thôi</button>
     <button class="big go" id="eLuu">Lưu</button></div>`);
  $('#eThoi').onclick = closeSheet;
  $('#eLuu').onclick = () => submitting($('#eLuu'), async () => {
    await apiPatch(`/api/links/${id}`, {
      url: $('#eU').value.trim(), title: $('#eT').value,
      kind: $('#eK').value, tag: $('#eG').value,
    });
    await drawKho(KHO_TAG); await refreshHome();
  }, 'Đã lưu');
}

async function drawKho(tag) {
  if (!$('#v-kho').dataset.loaded) $('#v-kho').innerHTML = `<div class="foot" style="padding:0 2px">Đang tải…</div>`;
  const kq = await apiGet(tag && tag !== 'all' ? `/api/links?tag=${encodeURIComponent(tag)}` : '/api/links');
  const links = kq.links;
  KHO_LINKS = links; KHO_TAG = tag;
  KHO_CAN_LOP = !!kq.can_dang_lop;
  $('#v-kho').dataset.loaded = '1';

  // Tư liệu của LỚP để riêng và để TRÊN. Trộn chung thì không ai phân biệt
  // được đâu là bản Ban tổ chức phát cho cả khoá, đâu là ghi chép riêng của
  // nhóm — mà hai thứ ấy có sức nặng khác hẳn nhau.
  const cuaLop = links.filter(r => r.scope === 'class');
  const cuaNhom = links.filter(r => r.scope !== 'class');

  $('#v-kho').innerHTML = `
  <div class="foot" style="padding:0 2px 14px">
    Tư liệu chỉ giữ đường dẫn. File vẫn nằm ở Drive của người làm ra nó — ứng dụng không chứa,
    không sao lưu, không đứng tên.
  </div>
  <div class="fl">${KHO_FILTERS.map(([k, l]) => `<button class="fc ${tag === k ? 'on' : ''}" data-tag="${k}">${l}</button>`).join('')}</div>

  ${cuaLop.length ? `<div class="sect">
    <div class="eb">Tư liệu của lớp <span class="c">${cuaLop.length}</span></div>
    <div class="card">${cuaLop.map(veDongTuLieu).join('')}</div>
    <div class="foot">Ban cán sự lớp đăng, cả mười nhóm cùng thấy.</div>
  </div>` : ''}

  <div class="sect">
    ${cuaLop.length ? `<div class="eb">Tư liệu của nhóm${HOME?.group?.no ? ' ' + HOME.group.no : ''}</div>` : ''}
    <div class="card">${cuaNhom.length ? cuaNhom.map(veDongTuLieu).join('')
      : '<div class="cb mut">Chưa có liên kết nào trong mục này.</div>'}</div>
  </div>

  <button class="wide ghost" style="margin-top:12px" id="addLinkBtn">+ Gắn một liên kết</button>
  <div class="foot"></div>`;

  document.querySelectorAll('#v-kho [data-tag]').forEach(btn => { btn.onclick = () => drawKho(btn.dataset.tag); });
  $('#addLinkBtn').onclick = openLinkAdd;
  document.querySelectorAll('#v-kho [data-sualink]').forEach(b => {
    b.onclick = () => openLinkEdit(Number(b.dataset.sualink));
  });
}

function openLinkAdd() {
  openSheet(`
   <h3>Gắn liên kết</h3>
   <p class="sub">Chỉ dán đường dẫn https — file để nguyên chỗ cũ.</p>
   <label class="f">Đường dẫn</label><input id="lU" placeholder="https://…" inputmode="url" maxlength="2000">
   <label class="f">Gọi là gì</label><input id="lN" maxlength="200" placeholder="Báo cáo thị trường FMCG 2025">
   <label class="f">Loại</label><select id="lK"><option>DRIVE</option><option>SHEET</option><option>DOCX</option><option>PDF</option><option>WEB</option></select>
   <label class="f">Dùng cho</label><select id="lT"><option value="bai">Cho bài</option><option value="buoi">Theo buổi</option><option value="lop">Lớp K03</option></select>
   ${KHO_CAN_LOP ? `<label class="f">Ai thấy được</label>
   <select id="lS"><option value="group">Chỉ nhóm mình</option><option value="class">Cả lớp — cả mười nhóm</option></select>
   <div class="hintline" id="lSHint"></div>` : ''}
   <div id="lErr" class="errline" style="display:none"></div>
   <div class="sa"><button class="big c" id="lCancel">Thôi</button>
     <button class="big go" id="lSave">Gắn vào</button></div>`);
  $('#lCancel').onclick = closeSheet;
  if ($('#lS')) {
    const veHint = () => {
      $('#lSHint').innerHTML = $('#lS').value === 'class'
        ? '<b>Cả lớp thấy.</b> Dùng cho thứ Ban tổ chức phát chung: slide bài giảng, mẫu kế hoạch kinh doanh.'
        : 'Chỉ nhóm bạn thấy. Nhóm khác không đọc được.';
    };
    $('#lS').onchange = veHint; veHint();
  }
  $('#lSave').onclick = async () => {
    if (!/^https:\/\//i.test($('#lU').value.trim())) {
      $('#lErr').textContent = 'Cần đường dẫn bắt đầu bằng https://';
      $('#lErr').style.display = 'block'; return;
    }
    await submitting($('#lSave'), async () => {
      await apiPost('/api/links', {
        url: $('#lU').value.trim(), title: $('#lN').value, kind: $('#lK').value, tag: $('#lT').value,
        scope: $('#lS') ? $('#lS').value : 'group',
      });
      await drawKho('all'); await refreshHome();
    }, 'Đã gắn vào Tư liệu');
  };
}

/* ─── Quỹ ─── */
let FUNDS = null;

async function drawQuy() {
  if (!$('#v-quy').dataset.loaded) $('#v-quy').innerHTML = `<div class="foot" style="padding:0 2px">Đang tải…</div>`;
  FUNDS = await apiGet('/api/funds');
  $('#v-quy').dataset.loaded = '1';
  const { rounds, can_create_group, can_create_class } = FUNDS;

  $('#v-quy').innerHTML = `
  ${renderSoQuy(FUNDS.so_quy?.group, 'group', FUNDS.can_chi_group)}
  ${renderSoQuy(FUNDS.so_quy?.class, 'class', FUNDS.can_chi_class)}
  ${rounds.length ? rounds.map(r => renderRound(r)).join('') : `
    <div class="card"><div class="cb">
      <div style="font-weight:600;margin-bottom:4px">Chưa có khoản thu nào</div>
      <div class="mut">Trưởng hoặc phó nhóm tạo khoản thu, ứng dụng tự sinh mã riêng cho từng người.</div>
    </div></div>`}
  ${rounds.length ? `<button class="wide ghost" id="tkBtn" style="margin-top:12px">Xem tiến độ thu</button>` : ''}
  ${can_create_group || can_create_class ? `<button class="wide ghost" id="newFund" style="margin-top:${rounds.length ? '8px' : '12px'}">+ Tạo đợt thu mới</button>` : ''}
  <div class="foot">Tiền vào thẳng tài khoản người thu. Ứng dụng không giữ tiền, không đứng giữa,
    và trạng thái ở đây là lời tự khai chứ không phải sao kê.</div>`;

  // Ảnh QR nạp từ img.vietqr.io — hỏng thì thay bằng ô giải thích, đừng để
  // một ô vỡ ảnh nằm giữa màn hình tiền nong.
  document.querySelectorAll('#v-quy img.qr').forEach(img => {
    img.onerror = () => {
      img.outerHTML = `<div class="ph">Chưa hiện được mã. Kiểm tra lại số tài khoản của đợt thu, hoặc chuyển khoản tay theo thông tin bên dưới.</div>`;
    };
  });
  document.querySelectorAll('#v-quy [data-copy]').forEach(b => {
    b.onclick = async () => {
      try { await navigator.clipboard.writeText(b.dataset.copy); toast('Đã chép nội dung chuyển khoản'); }
      catch { toast('Trình duyệt không cho chép — chép tay giúp nhé'); }
    };
  });
  document.querySelectorAll('#v-quy [data-declare]').forEach(b => {
    b.onclick = async () => {
      b.disabled = true;
      try {
        const id = b.dataset.declare;
        if (b.dataset.on === '1') await apiDelete(`/api/funds/${id}/declare`);
        else await apiPost(`/api/funds/${id}/declare`);
        await drawQuy(); await refreshHome();
      } catch (e) { toast(errText(e)); b.disabled = false; }
    };
  });
  document.querySelectorAll('#v-quy [data-ledger]').forEach(b => {
    b.onclick = () => openLedger(Number(b.dataset.ledger));
  });
  document.querySelectorAll('#v-quy [data-openround]').forEach(b => {
    b.onclick = () => confirmOpenRound(Number(b.dataset.openround));
  });
  if ($('#tkBtn')) $('#tkBtn').onclick = openThongKe;
  document.querySelectorAll('#v-quy [data-suadot]').forEach(b => {
    b.onclick = () => suaDot(Number(b.dataset.suadot));
  });
  document.querySelectorAll('#v-quy [data-soquy]').forEach(b => {
    b.onclick = () => openSoChi(b.dataset.soquy);
  });
  if ($('#newFund')) $('#newFund').onclick = openFundCreate;
}

// Thẻ số dư. Chỉ "người thu đã nhận" mới cộng vào tiền thật; lời tự khai để
// riêng một dòng nhạt hơn — ràng buộc câu chữ mục 6.4 SRS, không phải chi tiết
// trình bày. Sổ chưa có gì thì không hiện, khỏi bày một thẻ toàn số 0.
function renderSoQuy(s, scope, canChi) {
  if (!s) return '';
  if (!s.so_dot && !s.so_khoan_chi) return '';
  const ten = scope === 'class' ? 'Sổ quỹ lớp' : 'Sổ quỹ nhóm';
  const am = s.con_lai < 0;
  return `
  <div class="card">
    <div class="cb">
      <div style="font-size:11px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;color:var(--ink3);margin-bottom:8px">${ten}</div>
      <div class="amt" style="color:${am ? 'var(--due)' : 'var(--go)'}">${vnMoney(s.con_lai)}<small> đ còn lại</small></div>
      <div class="fi" style="margin-top:12px"><div class="k">Người thu đã nhận</div><div class="v num">${vnMoney(s.da_nhan)} đ</div></div>
      ${s.cho_doi_chieu ? `<div class="fi"><div class="k">Mới tự khai, chờ đối chiếu</div><div class="v num" style="color:var(--ink2)">${vnMoney(s.cho_doi_chieu)} đ</div></div>` : ''}
      <div class="fi" style="margin-bottom:0"><div class="k">Đã chi (${s.so_khoan_chi} khoản)</div><div class="v num">${vnMoney(s.da_chi)} đ</div></div>
      ${am ? `<div class="warn" style="margin-top:12px"><b>Chi vượt số đã nhận.</b> Kiểm tra lại: có khoản người thu chưa xác nhận, hoặc có khoản chi ghi nhầm.</div>` : ''}
      <button class="wide ghost" data-soquy="${scope}" style="margin-top:12px;padding:11px;font-size:14px">Mở sổ chi${canChi ? ' và ghi khoản mới' : ''}</button>
    </div>
  </div>`;
}

// Ai sửa được cú pháp của một đợt: đúng những người tạo được đợt cùng cấp ấy.
// Máy chủ kiểm lại y hệt bằng canCreate, đây chỉ là để khỏi bày nút vô ích.
function suaDuocDot(r) {
  return r.scope === 'class' ? !!FUNDS?.can_create_class : !!FUNDS?.can_create_group;
}

// Sửa đợt thu đã tạo. Ranh giới sửa được hay không KHÔNG phải "nháp hay đã
// mở" mà là "đã có ai tự khai chưa" — trùng đúng luật máy chủ trong patchFund.
// Chưa ai khai thì sửa được tất, kể cả số tiền và số tài khoản. Có người khai
// rồi thì mấy thứ ấy khoá lại, còn ngày tháng và câu chữ vẫn sửa suốt.
function suaDot(id) {
  const r = FUNDS.rounds.find(x => x.id === id);
  const khoa = !!r.da_co_nguoi_khai;
  const banks = FUNDS.banks;
  const coBin = banks.some(b => b.bin === r.bank_bin);

  openSheet(`
   <h3>Sửa đợt thu</h3>
   <p class="sub">${khoa
      ? 'Đã có người tự khai đã chuyển. Số tiền, số tài khoản, người thu và sổ nhận tiền khoá lại — họ đã chuyển theo thông tin cũ.'
      : 'Chưa ai tự khai, nên sửa được mọi thứ.'}</p>

   <label class="f">Tiêu đề</label>
   <input id="sT" maxlength="120" value="${esc(r.title)}">
   <label class="f">Mục đích</label>
   <input id="sP" maxlength="300" value="${esc(r.purpose || '')}">
   <label class="f">Ngày mở</label>
   <input id="sOpen" type="date" value="${esc(r.opens_on || '')}">
   <label class="f">Ngày đóng</label>
   <input id="sClose" type="date" value="${esc(r.closes_on || '')}">
   <div class="hintline">Để trống là không đặt hạn. Đổi ngày lúc nào cũng được, kể cả khi đợt đang mở.</div>

   <label class="f">Số tiền mỗi người (đ)</label>
   <input id="sA" type="number" min="1000" step="1000" inputmode="numeric" value="${esc(String(r.amount))}" ${khoa ? 'disabled' : ''}>
   <label class="f">Tiền thu về thuộc quỹ nào</label>
   <select id="sQ" ${khoa || r.scope === 'class' ? 'disabled' : ''}>
     <option value="nhom"${r.thuoc_quy === 'nhom' ? ' selected' : ''}>Quỹ nhóm</option>
     <option value="lop"${r.thuoc_quy === 'lop' ? ' selected' : ''}>Quỹ lớp</option></select>
   <label class="f">Ngân hàng</label>
   <select id="sB" ${khoa ? 'disabled' : ''}>
     ${banks.map(b => `<option value="${b.bin}"${b.bin === r.bank_bin ? ' selected' : ''}>${esc(b.name)}</option>`).join('')}
     <option value="__other"${coBin ? '' : ' selected'}>— ngân hàng khác, tự nhập mã —</option></select>
   <div id="sBinWrap" style="display:${coBin ? 'none' : 'block'}">
     <label class="f">Mã ngân hàng VietQR (6 chữ số)</label>
     <input id="sBin" maxlength="6" inputmode="numeric" value="${coBin ? '' : esc(r.bank_bin || '')}" ${khoa ? 'disabled' : ''}>
   </div>
   <label class="f">Số tài khoản</label>
   <input id="sAcc" maxlength="32" inputmode="numeric" value="${esc(r.account_no || '')}" ${khoa ? 'disabled' : ''}>
   <label class="f">Tên chủ tài khoản</label>
   <input id="sAccName" maxlength="120" value="${esc(r.account_name || '')}" ${khoa ? 'disabled' : ''}>
   <label class="f">Người thu</label>
   <select id="fC" ${khoa ? 'disabled' : ''}><option value="">— chưa chọn —</option></select>

   <label class="f">Cú pháp nội dung chuyển khoản</label>
   <input id="sCP" maxlength="60" value="${esc(r.syntax_template)}" spellcheck="false">
   <div class="hintline"><b>{TEN}</b> thay bằng họ tên người chuyển, <b>{NHOM}</b> thay bằng số nhóm.
     Chữ khác gõ thẳng vào. Ví dụ <span class="ma">{TEN} Nhom {NHOM} Quylop</span>.</div>
   <div class="card" style="margin-top:8px"><div class="cb" style="padding:11px 14px">
     <div style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink3)">Bạn sẽ thấy</div>
     <div id="sCPXem" class="num" style="font-size:15px;font-weight:600;margin-top:4px;word-break:break-word"></div>
     <div id="sCPDai" class="foot" style="padding:6px 0 0"></div>
   </div></div>
   ${r.status === 'open' ? `<div class="warn" style="margin-top:12px">Đợt đang mở. Đổi cú pháp thì mã QR của
     người CHƯA chuyển sẽ đổi theo, còn ai đã chuyển rồi vẫn giữ nội dung cũ trên sao kê — người thu nhớ để ý
     cả hai kiểu.</div>` : ''}

   <div style="margin-top:14px;display:flex;flex-direction:column;gap:8px">
     ${r.status === 'open' ? `<button class="wide ghost" id="sDong" style="padding:11px;font-size:14px">Đóng đợt thu lại</button>` : ''}
     ${r.status === 'closed' ? `<button class="wide ghost" id="sMoLai" style="padding:11px;font-size:14px">Mở lại đợt thu</button>` : ''}
     ${khoa
       ? `<div class="foot" style="padding:2px 0 0">Không xoá được đợt này nữa: đã có người tự khai, xoá đi là xoá luôn lời khai của họ. Muốn dừng thì đóng đợt lại, số liệu vẫn còn để đối chiếu.</div>`
       : `<button class="wide ghost" id="sXoa" style="padding:11px;font-size:14px">Xoá hẳn đợt thu này</button>`}
   </div>

   <div id="sErr" class="errline" style="display:none"></div>
   <div class="sa"><button class="big c" id="sThoi">Thôi</button>
     <button class="big go" id="sLuu">Lưu</button></div>`);

  const ve = () => {
    const ra = dungNoiDung($('#sCP').value, HOME?.me?.full_name ?? '', HOME?.group?.no ?? '');
    $('#sCPXem').textContent = ra || '(trống)';
    $('#sCPDai').textContent = ra.length > 40
      ? `${ra.length} ký tự — hơi dài, vài ngân hàng sẽ cắt bớt. Nên rút gọn.`
      : `${ra.length} ký tự.`;
    $('#sCPDai').style.color = ra.length > 40 ? 'var(--due)' : '';
  };
  $('#sCP').oninput = ve;
  ve();
  $('#sB').onchange = () => { $('#sBinWrap').style.display = $('#sB').value === '__other' ? 'block' : 'none'; };

  // Dùng lại đúng bộ nạp người thu của form tạo mới (nó tìm theo id #fC).
  napNguoiThu(r.scope).then(() => {
    if (r.collector_member_id) $('#fC').value = String(r.collector_member_id);
    if (khoa) $('#fC').disabled = true;
  });

  const bao = (t) => { $('#sErr').textContent = t; $('#sErr').style.display = 'block'; };

  if ($('#sDong')) $('#sDong').onclick = () => submitting($('#sDong'), async () => {
    await apiPatch(`/api/funds/${id}`, { status: 'closed' });
    await drawQuy(); await refreshHome();
  }, 'Đã đóng đợt thu');

  if ($('#sMoLai')) $('#sMoLai').onclick = () => submitting($('#sMoLai'), async () => {
    await apiPatch(`/api/funds/${id}`, { status: 'open' });
    await drawQuy(); await refreshHome();
  }, 'Đã mở lại đợt thu');

  if ($('#sXoa')) $('#sXoa').onclick = () => {
    openSheet(`<h3>Xoá đợt thu</h3>
      <p class="sub">Xoá hẳn “${esc(r.title)}”.</p>
      <div class="warn">Chưa ai tự khai nên không mất số liệu của ai, nhưng xoá rồi thì không lấy lại được.
        Khoản chi đã gắn vào đợt này vẫn còn trong sổ chi, chỉ mất phần ghi thuộc đợt nào.</div>
      <div class="sa"><button class="big c" id="xThoi">Thôi</button>
        <button class="big go" id="xGo">Xoá hẳn</button></div>`);
    $('#xThoi').onclick = () => suaDot(id);
    $('#xGo').onclick = () => submitting($('#xGo'), async () => {
      await apiDelete(`/api/funds/${id}`);
      await drawQuy(); await refreshHome();
    }, 'Đã xoá đợt thu');
  };

  $('#sThoi').onclick = closeSheet;
  $('#sLuu').onclick = () => {
    if (!$('#sCP').value.includes('{TEN}')) {
      return bao('Cú pháp phải có {TEN}, không thì cả nhóm chuyển khoản giống hệt nhau và người thu không biết ai là ai.');
    }
    const than = {
      title: $('#sT').value,
      purpose: $('#sP').value,
      opens_on: $('#sOpen').value || null,
      closes_on: $('#sClose').value || null,
      syntax_template: $('#sCP').value,
    };
    if (!khoa) {
      const bin = $('#sB').value === '__other' ? $('#sBin').value.trim() : $('#sB').value;
      if (!/^\d{6}$/.test(bin)) return bao('Mã ngân hàng phải đúng 6 chữ số.');
      const tien = Number($('#sA').value || 0);
      if (!(tien > 0)) return bao('Số tiền mỗi người phải lớn hơn 0.');
      than.amount = tien;
      than.bank_bin = bin;
      than.account_no = $('#sAcc').value.trim();
      than.account_name = $('#sAccName').value;
      than.collector_member_id = $('#fC').value === '' ? null : Number($('#fC').value);
      if (r.scope !== 'class') than.thuoc_quy = $('#sQ').value;
    }
    submitting($('#sLuu'), async () => {
      await apiPatch(`/api/funds/${id}`, than);
      await drawQuy(); await refreshHome();
    }, 'Đã lưu');
  };
}

function renderRound(r) {
  const dots = Array.from({ length: r.total_people }, (_, i) =>
    `<i class="${i < r.declared_count ? 'd' : ''}"${i < r.verified_count ? ' data-v="1"' : ''}></i>`).join('');
  // Hai mức "xong" khác nhau, và mỗi mức cất đi một thứ khác nhau:
  //   xongCuaToi  — người thu đã xác nhận tiền CỦA BẠN. Bạn không còn việc gì,
  //                 nên cất luôn mã QR, số tài khoản và nút chép nội dung. Để
  //                 lại là bày ra một lời mời chuyển tiền lần nữa; tệ hơn nữa,
  //                 khi mạng yếu mã không tải được thì nhánh dự phòng hiện câu
  //                 "Chưa hiện được mã. Kiểm tra lại số tài khoản" — đọc lên
  //                 y như một cảnh báo trên một đợt đã xong xuôi.
  //   xongCaDot   — người thu đã nhận đủ của TẤT CẢ. Đánh dấu ✓ lên đầu thẻ.
  const xongCuaToi = !!r.i_am_verified;
  const xongCaDot = r.total_people > 0 && r.verified_count === r.total_people;
  // Cả nhóm khai xong là một cái mốc thật, nhưng KHÔNG phải quỹ xong: người thu
  // chưa soi sao kê thì chưa đồng nào được coi là tiền thật (mục 6.4 SRS). Nên
  // đánh dấu bằng màu CAM của "đã tự khai", tuyệt đối không dùng ✓ xanh — xanh
  // ở khắp ứng dụng này chỉ có một nghĩa: người thu đã nhận.
  const caNhomDaKhai = !xongCaDot && r.total_people > 0 && r.declared_count === r.total_people;
  return `
  <div class="card">
    <div class="cb">
      <div style="font-size:11px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;color:var(--ink3);margin-bottom:8px">
        ${esc(r.title)}${r.scope === 'class' ? ' · cả lớp' : ''}${r.scope === 'group' && r.thuoc_quy === 'lop' ? ' · thu hộ quỹ lớp' : ''}${r.status === 'draft' ? ' · bản nháp' : ''}${r.status === 'closed' ? ' · đã đóng' : ''}${
          xongCaDot ? ' <span class="xongchip">✓ đã thu đủ</span>' : ''}${
          caNhomDaKhai ? ' <span class="khaichip">cả nhóm đã khai</span>' : ''}</div>
      <div class="amt">${vnMoney(r.amount)}<small> đ / người</small></div>
      ${r.purpose ? `<div class="mut" style="margin-top:11px">${esc(r.purpose)}</div>` : ''}
      ${r.collector_name ? `<div class="mut" style="margin-top:5px">Người thu: <b style="color:var(--ink)">${esc(r.collector_name)}</b></div>` : ''}
      <div class="tagrow" style="margin-top:10px">
        ${r.closes_on ? `<span class="tg">đóng ${esc(r.closes_on)}</span>` : ''}
        <span class="tg">${esc(r.bank_name || r.bank_bin)}</span>
      </div>
    </div>

    ${r.status === 'draft' ? `<div class="cb" style="border-top:1px solid var(--line)">
        <div class="mut" style="margin-bottom:10px">Bản nháp — chưa ai trong nhóm thấy đợt này.</div>
        <div class="fi"><div class="k">Nội dung chuyển khoản của bạn</div><div class="v num">${esc(r.transfer_note)}</div></div>
        <button class="wide" data-openround="${r.id}">Mở đợt thu</button>
        ${suaDuocDot(r) ? `<button class="wide ghost" data-suadot="${r.id}" style="margin-top:8px;padding:11px;font-size:14px">Sửa đợt thu</button>` : ''}
      </div>` : `
      ${xongCuaToi ? '' : `<div class="qrw">
        <img class="qr" src="${esc(r.qr_url)}" alt="Mã chuyển khoản riêng của bạn" width="196" height="196">
        <div class="cap">${esc(r.bank_name || r.bank_bin)} · ${esc(r.account_no)}${r.account_name ? ' · ' + esc(r.account_name) : ''}</div>
        <button class="copy" data-copy="${esc(r.transfer_note)}">${esc(r.transfer_note)} <span style="font-size:11px;color:var(--ink3)">chép</span></button>
      </div>`}
      <div class="cb">
        ${r.i_am_verified
          ? `<div class="wide ok" style="cursor:default">✓ Người thu đã nhận tiền của bạn</div>
             <div class="foot" style="padding:9px 0 0">Đây là xác nhận của người thu sau khi soi sao kê.</div>`
          : r.i_declared
            ? `<button class="wide ok" data-declare="${r.id}" data-on="1">✓ Bạn đã tự khai là đã chuyển</button>
               <div class="foot" style="padding:9px 0 0">Người thu sẽ đối chiếu sao kê. Khai nhầm thì chạm lại để bỏ.</div>`
            : `<button class="wide" data-declare="${r.id}" data-on="0" ${r.status !== 'open' ? 'disabled' : ''}>Tôi đã chuyển</button>
               <div class="foot" style="padding:9px 0 0">Đây là lời tự khai của bạn, không phải xác nhận của người thu.</div>`}
        <div class="dots">${dots}</div>
        <div class="foot" style="padding:8px 0 0">
          ${xongCaDot
            ? `<b style="color:var(--go)">✓ Người thu đã nhận đủ của cả <span class="num">${r.total_people}</span> người.</b> Đợt này xong.`
            : `<b class="num" style="color:var(--ink)">${r.declared_count}/${r.total_people}</b> người đã tự khai${r.verified_count ? `, người thu đã nhận <b class="num" style="color:var(--go)">${r.verified_count}</b>` : ''}.
          ${caNhomDaKhai
            ? '<b style="color:var(--due)">Cả nhóm khai xong — còn chờ người thu đối chiếu sao kê.</b>'
            : 'Không hiện tên ai — chỉ người thu và trưởng nhóm xem được danh sách.'}`}</div>
        ${r.can_see_ledger ? `<button class="wide ghost" data-ledger="${r.id}" style="margin-top:12px;padding:11px;font-size:14px">Mở sổ ${r.i_am_collector ? 'của người thu' : 'theo dõi'}</button>` : ''}
        ${suaDuocDot(r) ? `<button class="wide ghost" data-suadot="${r.id}" style="margin-top:8px;padding:11px;font-size:14px">Sửa đợt thu</button>` : ''}
      </div>`}
  </div>`;
}

// Mục 6.2 SRS bắt hiện lời nhắc này khi mở đợt — ứng dụng không có cách nào
// đối chiếu số tài khoản với ngân hàng, sai một số là tiền đi nhầm chỗ.
function confirmOpenRound(id) {
  const r = FUNDS.rounds.find(x => x.id === id);
  openSheet(`
   <h3>Mở đợt thu</h3>
   <p class="sub">Mở xong là cả nhóm thấy mã QR và bắt đầu chuyển tiền.</p>
   <div class="warn">
     <b>Kiểm tra lại số tài khoản. Ứng dụng không đối chiếu được số tài khoản với ngân hàng.</b>
   </div>
   <div class="card" style="margin-top:12px"><div class="cb">
     <div class="fi"><div class="k">Ngân hàng</div><div class="v">${esc(r.bank_name || r.bank_bin)}</div></div>
     <div class="fi"><div class="k">Số tài khoản</div><div class="v num">${esc(r.account_no)}</div></div>
     <div class="fi"><div class="k">Chủ tài khoản</div><div class="v">${esc(r.account_name) || '—'}</div></div>
     <div class="fi" style="margin-bottom:0"><div class="k">Mỗi người</div><div class="v num">${vnMoney(r.amount)} đ</div></div>
   </div></div>
   <div class="qrw" style="margin-top:12px;border-radius:12px">
     <img class="qr" src="${esc(r.qr_url)}" alt="Thử mã QR trước khi mở" width="160" height="160">
     <div class="cap">Quét thử bằng app ngân hàng để chắc tên người nhận đúng.</div>
   </div>
   <div class="sa"><button class="big c" id="orCancel">Chưa mở</button>
     <button class="big go" id="orGo">Số tài khoản đúng — mở đợt</button></div>`);
  $('#orCancel').onclick = closeSheet;
  $('#orGo').onclick = () => submitting($('#orGo'), async () => {
    await apiPatch(`/api/funds/${id}`, { status: 'open' });
    await drawQuy(); await refreshHome();
  }, 'Đã mở đợt thu');
}

function openFundCreate() {
  const banks = FUNDS.banks;
  const members = MEMBERS.length ? MEMBERS : null;
  const coLop = !!FUNDS.can_create_class;
  openSheet(`
   <h3>Tạo đợt thu</h3>
   <p class="sub">Số tài khoản đặt riêng cho từng đợt, không dùng chung toàn hệ thống. Tạo xong còn ở bản nháp — xem lại rồi mới mở.</p>
   ${coLop ? `<label class="f">Đợt này thu của ai</label>
   <select id="fS"><option value="group">Nhóm mình</option><option value="class">Cả lớp</option></select>` : ''}
   <label class="f">Tiền thu về thuộc quỹ nào</label>
   <select id="fQ"><option value="nhom">Quỹ nhóm</option><option value="lop">Quỹ lớp</option></select>
   <div class="hintline" id="fQHint"></div>
   <label class="f">Tiêu đề</label><input id="fT" maxlength="120" placeholder="Kiến tập nhà máy Bắc Ninh">
   <label class="f">Mục đích</label><input id="fP" maxlength="300" placeholder="Xe và ăn trưa">
   <label class="f">Số tiền mỗi người (đ)</label><input id="fA" type="number" min="1000" step="1000" inputmode="numeric" placeholder="350000">
   <label class="f">Ngân hàng</label>
   <select id="fB">${banks.map(b => `<option value="${b.bin}">${esc(b.name)}</option>`).join('')}
     <option value="__other">— ngân hàng khác, tự nhập mã —</option></select>
   <div id="fBinWrap" style="display:none">
     <label class="f">Mã ngân hàng VietQR (6 chữ số)</label><input id="fBin" maxlength="6" inputmode="numeric" placeholder="970422">
   </div>
   <label class="f">Số tài khoản</label><input id="fAcc" maxlength="32" inputmode="numeric" placeholder="0789267999">
   <label class="f">Tên chủ tài khoản</label><input id="fAccName" maxlength="120" placeholder="PHAM THE NAM">
   <label class="f">Người thu</label>
   <select id="fC"><option value="">— chưa chọn —</option>
     ${(members ?? []).map(m => `<option value="${m.id}">${esc(m.full_name)}</option>`).join('')}</select>
   <label class="f">Ngày đóng</label><input id="fClose" type="date">
   <label class="f">Cú pháp nội dung chuyển khoản</label>
   <input id="fCP" maxlength="60" value="{TEN} N{NHOM}" spellcheck="false">
   <div class="hintline"><b>{TEN}</b> thay bằng họ tên người chuyển, <b>{NHOM}</b> thay bằng số nhóm.
     Chữ khác gõ thẳng vào. Ví dụ <span class="ma">{TEN} Nhom {NHOM} Quylop</span>.</div>
   <div class="card" style="margin-top:8px"><div class="cb" style="padding:11px 14px">
     <div style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink3)">Bạn sẽ thấy</div>
     <div id="fCPXem" class="num" style="font-size:15px;font-weight:600;margin-top:4px;word-break:break-word"></div>
     <div id="fCPDai" class="foot" style="padding:6px 0 0"></div>
   </div></div>
   <div id="fErr" class="errline" style="display:none"></div>
   <div class="sa"><button class="big c" id="fCancel">Thôi</button>
     <button class="big go" id="fSave">Tạo bản nháp</button></div>`);

  // Xem trước dựng bằng chính tên người đang đăng nhập, nên nhìn là biết ngay
  // cú pháp ra cái gì trên sao kê — không phải tưởng tượng.
  const veXemTruoc = () => {
    const ra = dungNoiDung($('#fCP').value, HOME?.me?.full_name ?? 'NGUYEN VAN A', HOME?.group?.no ?? 6);
    $('#fCPXem').textContent = ra || '(trống)';
    // Nhiều ngân hàng cắt nội dung chuyển khoản khá sớm. Không chặn, chỉ nhắc.
    $('#fCPDai').textContent = ra.length > 40
      ? `${ra.length} ký tự — hơi dài, vài ngân hàng sẽ cắt bớt. Nên rút gọn.`
      : `${ra.length} ký tự.`;
    $('#fCPDai').style.color = ra.length > 40 ? 'var(--due)' : '';
  };
  $('#fCP').oninput = veXemTruoc;
  veXemTruoc();

  $('#fB').onchange = () => { $('#fBinWrap').style.display = $('#fB').value === '__other' ? 'block' : 'none'; };
  // Đổi phạm vi thì đổi luôn danh sách người thu: đợt nhóm chỉ chọn được người
  // trong nhóm, đợt lớp chọn được cả khoá (máy chủ cũng kiểm lại y hệt).
  if ($('#fS')) $('#fS').onchange = () => { napNguoiThu($('#fS').value); veQuy(); };

  // Hai câu hỏi khác nhau, cố ý tách: THU CỦA AI quyết định ai nhìn thấy và ai
  // phải đóng; TIỀN VÀO QUỸ NÀO quyết định số dư sổ nào thay đổi. Trưởng nhóm
  // thu hộ quỹ lớp là chuyện thường — tiền vào tài khoản thủ quỹ lớp nên phải
  // cộng vào sổ lớp, dù người đóng là 14 người của nhóm.
  const veQuy = () => {
    const capLop = $('#fS') && $('#fS').value === 'class';
    if (capLop) { $('#fQ').value = 'lop'; $('#fQ').disabled = true; }
    else $('#fQ').disabled = false;
    $('#fQHint').innerHTML = capLop
      ? 'Đợt thu của cả lớp thì tiền đương nhiên thuộc quỹ lớp.'
      : ($('#fQ').value === 'lop'
          ? '<b>Thu hộ quỹ lớp.</b> Nhóm bạn đóng, nhưng tiền vào tài khoản người thu của lớp — nên cộng vào <b>Sổ quỹ lớp</b>, không cộng vào sổ nhóm.'
          : 'Tiền của nhóm, cộng vào <b>Sổ quỹ nhóm</b>.');
  };
  $('#fQ').onchange = veQuy;
  veQuy();
  $('#fCancel').onclick = closeSheet;
  $('#fSave').onclick = async () => {
    const bin = $('#fB').value === '__other' ? $('#fBin').value.trim() : $('#fB').value;
    if (!/^\d{6}$/.test(bin)) {
      $('#fErr').textContent = 'Mã ngân hàng phải đúng 6 chữ số.'; $('#fErr').style.display = 'block'; return;
    }
    if (!$('#fCP').value.includes('{TEN}')) {
      $('#fErr').textContent = 'Cú pháp phải có {TEN}, không thì cả nhóm chuyển khoản giống hệt nhau và người thu không biết ai là ai.';
      $('#fErr').style.display = 'block'; return;
    }
    await submitting($('#fSave'), async () => {
      await apiPost('/api/funds', {
        scope: $('#fS') ? $('#fS').value : 'group',
        title: $('#fT').value, purpose: $('#fP').value,
        amount: Number($('#fA').value || 0),
        bank_bin: bin, account_no: $('#fAcc').value.trim(), account_name: $('#fAccName').value,
        collector_member_id: $('#fC').value === '' ? null : Number($('#fC').value),
        closes_on: $('#fClose').value || null,
        syntax_template: $('#fCP').value,
        thuoc_quy: $('#fQ').value,
      });
      await drawQuy();
    }, 'Đã tạo bản nháp — xem lại rồi mở');
  };
  napNguoiThu('group');
}

// Nạp danh sách người thu theo phạm vi. Giữ lại lựa chọn cũ nếu người ấy vẫn
// còn trong danh sách mới, để đổi qua đổi lại không mất công chọn lần nữa.
async function napNguoiThu(scope) {
  const sel = $('#fC');
  if (!sel) return;
  const dangChon = sel.value;
  let list;
  try {
    list = scope === 'class'
      ? (await apiGet('/api/funds/class-members')).members
      : await ensureMembers();
  } catch { return; }
  sel.innerHTML = `<option value="">— chưa chọn —</option>` +
    list.map(m => `<option value="${m.id}">${esc(m.full_name)}${m.group_no ? ' · nhóm ' + m.group_no : ''}</option>`).join('');
  if (dangChon && list.some(m => String(m.id) === dangChon)) sel.value = dangChon;
}

/* ─── Sổ thu ─── */
// Giữ dữ liệu và bộ lọc ở ngoài hàm vẽ. Hai lý do, cả hai đều đo được:
//  - đổi bộ lọc không phải gọi lại máy chủ;
//  - xác nhận một người xong, sổ vẽ lại mà VẪN giữ nguyên bộ lọc đang xem.
//    Không giữ thì thủ quỹ lớp lọc "chưa khai" trong 134 người, xác nhận một
//    người là danh sách nhảy về đầu — đến người thứ ba thì bỏ cuộc.
let SOTHU = null;

const LOC_SO_THU = [
  ['tat-ca', 'Tất cả'],
  ['chua-khai', 'Chưa khai'],
  ['da-khai', 'Mới tự khai'],
  ['da-nhan', 'Người thu đã nhận'],
];
// Cố ý KHÔNG có nhãn nào tên là "đã đóng": mục 6.4 SRS. Tiền chỉ có thật khi
// người thu soi sao kê xong, nên trạng thái giữa là "mới tự khai" chứ không
// phải "đã đóng".
const trangThai = (p) => p.verified ? 'da-nhan' : p.declared ? 'da-khai' : 'chua-khai';

async function openLedger(roundId) {
  openSheet(`<h3>Sổ thu</h3><p class="sub">Đang tải…</p>`);
  let data;
  try { data = await apiGet(`/api/funds/${roundId}/ledger`); }
  catch (e) { closeSheet(); toast(errText(e)); return; }
  const giu = SOTHU?.roundId === roundId ? SOTHU : null;
  SOTHU = { roundId, data, loc: giu?.loc ?? 'tat-ca', nhom: giu?.nhom ?? 'tat-ca' };
  veSoThu();
}

function veSoThu() {
  const { roundId, data, loc, nhom } = SOTHU;
  const { round, people, i_am_collector, pham_vi_xem } = data;
  const chiNhomMinh = pham_vi_xem === 'nhom-minh';
  const khaiHoDuoc = i_am_collector || chiNhomMinh || !!FUNDS?.can_create_group || !!FUNDS?.can_create_class;

  // Cột nhóm chỉ có nghĩa khi sổ trải trên nhiều nhóm — đợt của nhóm thì mọi
  // dòng cùng một nhóm, hiện ra chỉ tổ chật.
  const cacNhom = [...new Set(people.map(p => p.group_no).filter(n => n != null))].sort((a, b) => a - b);
  const nhieuNhom = cacNhom.length > 1;

  const theoNhom = nhieuNhom && nhom !== 'tat-ca'
    ? people.filter(p => String(p.group_no) === String(nhom)) : people;
  const dem = Object.fromEntries(LOC_SO_THU.map(([k]) => [k, 0]));
  dem['tat-ca'] = theoNhom.length;
  theoNhom.forEach(p => { dem[trangThai(p)]++; });
  const hien = loc === 'tat-ca' ? theoNhom : theoNhom.filter(p => trangThai(p) === loc);
  const daNhan = theoNhom.filter(p => p.verified).length;

  openSheet(`
   <h3>${esc(round.title)}</h3>
   ${chiNhomMinh ? `<div class="warn" style="margin-bottom:12px">Đây là đợt thu của <b>cả lớp</b>.
     Bạn đang xem phần <b>${esc(HOME?.group?.label ?? 'nhóm mình')}</b> — ${people.length} người, không phải toàn lớp.</div>` : ''}
   <p class="sub">${vnMoney(round.amount)} đ mỗi người · ${daNhan === theoNhom.length && theoNhom.length ? '✓ ' : ''}người thu đã nhận ${daNhan}/${theoNhom.length}${chiNhomMinh ? ' trong nhóm bạn' : ''}.
     ${i_am_collector ? 'Soi sao kê xong thì bấm xác nhận từng người.' : 'Chỉ người thu mới xác nhận được đã nhận tiền.'}</p>

   ${nhieuNhom ? `<label class="f">Xem nhóm nào</label>
   <select id="stNhom"><option value="tat-ca">Tất cả ${cacNhom.length} nhóm — ${people.length} người</option>
     ${cacNhom.map(n => `<option value="${n}"${String(nhom) === String(n) ? ' selected' : ''}>Nhóm ${n} — ${people.filter(p => p.group_no === n).length} người</option>`).join('')}
   </select>` : ''}

   <div class="fl cuon" style="margin:${nhieuNhom ? "12px" : "4px"} 0 14px">
     ${LOC_SO_THU.map(([k, l]) => `<button class="fc ${loc === k ? 'on' : ''}" data-loc="${k}">${l} <span class="num">${dem[k]}</span></button>`).join('')}
   </div>

   <div class="warn" style="margin-bottom:14px">Không có nhắc nợ tự động. Ai chưa chuyển thì nhắn riêng.</div>
   ${khaiHoDuoc ? `<div class="foot" style="padding:0 0 12px">Ai gửi ảnh chuyển khoản qua Zalo mà chưa mở ứng dụng bao giờ
     thì bấm <b>khai hộ</b>. Nó ghi là <b>đã tự khai</b> kèm tên bạn — vẫn chờ người thu soi sao kê rồi mới thành
     <b>người thu đã nhận</b>.</div>` : ''}
   <div class="card"><div class="cb" style="padding:2px 14px">
     ${hien.length ? hien.map(p => `<div class="fd">
       ${avatar(p.full_name)}
       <div class="x"><b>${esc(p.full_name)}</b>${
         nhieuNhom && p.group_no != null ? ` <span class="tg" style="font-size:10px;padding:1px 6px">Nhóm ${p.group_no}</span>` : ''}
         <div style="font-size:11.5px;margin-top:2px" class="${p.verified ? 'st-ok' : p.declared ? 'st-mid' : 'st-no'}">${p.verified ? '✓ ' : ''}${esc(p.status_label)}${
           p.khai_ho_boi && !p.verified ? ` · do ${esc(short(p.khai_ho_boi))} khai hộ` : ''}${
           p.da_ngung ? ' · đã ngừng tham gia' : ''}</div></div>
       <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end">
         ${p.phone ? `<a class="tg" href="tel:${esc(p.phone)}">gọi</a>` : ''}
         ${khaiHoDuoc && !p.verified
            ? (p.declared
                ? (p.khai_ho_boi ? `<button class="tg" data-bokhai="${p.id}">bỏ khai hộ</button>` : '')
                : `<button class="tg" data-khaiho="${p.id}">khai hộ</button>`)
            : ''}
         ${i_am_collector ? `<button class="tg ${p.verified ? 'go' : ''}" data-verify="${p.id}" data-undo="${p.verified ? '1' : '0'}">${p.verified ? 'bỏ xác nhận' : 'đã nhận'}</button>` : ''}
       </div></div>`).join('')
     : `<div class="cb mut" style="padding:16px 2px">Không có ai trong mục này.</div>`}
   </div></div>
   <div class="sa"><button class="big c" id="ldClose">Đóng</button></div>`);

  $('#ldClose').onclick = closeSheet;
  document.querySelectorAll('.sheet [data-loc]').forEach(b => {
    b.onclick = () => { SOTHU.loc = b.dataset.loc; veSoThu(); };
  });
  if ($('#stNhom')) $('#stNhom').onchange = () => { SOTHU.nhom = $('#stNhom').value; veSoThu(); };

  const khai = async (btn, memberId, bo) => {
    btn.disabled = true;
    try { await apiPost(`/api/funds/${roundId}/declare-for`, { member_id: memberId, bo }); }
    catch (e) { toast(errText(e)); btn.disabled = false; return; }
    await openLedger(roundId);
    await drawQuy();
  };
  document.querySelectorAll('.sheet [data-khaiho]').forEach(b => {
    b.onclick = () => khai(b, Number(b.dataset.khaiho), false);
  });
  document.querySelectorAll('.sheet [data-bokhai]').forEach(b => {
    b.onclick = () => khai(b, Number(b.dataset.bokhai), true);
  });
  document.querySelectorAll('.sheet [data-verify]').forEach(b => {
    b.onclick = async () => {
      b.disabled = true;
      try {
        await apiPost(`/api/funds/${roundId}/verify`, { member_id: Number(b.dataset.verify), undo: b.dataset.undo === '1' });
        await openLedger(roundId);
        await drawQuy();
      } catch (e) { toast(errText(e)); b.disabled = false; }
    };
  });
}

/* ─── Thống kê tiến độ thu ─── */
// Một cột chồng ba ô. KHÔNG gộp "đã tự khai" với "người thu đã nhận" thành một
// con số "tỉ lệ đóng quỹ" — mục 6.4 SRS: lời khai chưa phải tiền.
function veCot(d) {
  const t = Math.max(d.tong, 1);
  const pc = (n) => (n / t * 100).toFixed(2) + '%';
  const o = [];
  if (d.da_nhan) o.push(`<i class="tk-a" style="width:${pc(d.da_nhan)}" title="Người thu đã nhận: ${d.da_nhan}"></i>`);
  if (d.da_khai) o.push(`<i class="tk-b" style="width:${pc(d.da_khai)}" title="Mới tự khai: ${d.da_khai}"></i>`);
  if (d.chua_khai) o.push(`<i class="tk-c" style="width:${pc(d.chua_khai)}" title="Chưa khai: ${d.chua_khai}"></i>`);
  // Ô xám tương phản dưới 3:1 với nền, nên số phải in ra chữ chứ không được để
  // người đọc tự đoán từ chiều dài cột.
  return `<div class="tk-t" role="img"
     aria-label="${d.da_nhan} người thu đã nhận, ${d.da_khai} mới tự khai, ${d.chua_khai} chưa khai, trên ${d.tong}">${o.join('')}</div>
   <div class="tk-s"><b>${d.da_nhan}</b> người thu đã nhận · <b>${d.da_khai}</b> mới tự khai · <b>${d.chua_khai}</b> chưa khai
     <span style="color:var(--ink3)">· trên ${d.tong}</span></div>`;
}

async function openThongKe() {
  openSheet(`<h3>Tiến độ thu</h3><p class="sub">Đang tải…</p>`);
  let kq;
  try { kq = await apiGet('/api/funds/thong-ke'); }
  catch (e) { closeSheet(); toast(errText(e)); return; }
  const dot = kq.dot ?? [];

  openSheet(`
   <h3>Tiến độ thu</h3>
   <p class="sub">Hai mức tách riêng, cố ý: <b>người thu đã nhận</b> là tiền thật đã đối chiếu sao kê;
     <b>mới tự khai</b> mới chỉ là lời người nộp.</p>
   <div class="tk-cg">
     <span><i style="background:var(--go)"></i> Người thu đã nhận</span>
     <span><i class="tk-b"></i> Mới tự khai</span>
     <span><i style="background:var(--line2)"></i> Chưa khai</span>
   </div>
   ${dot.length ? `<div class="tk">${dot.map(d => `
     <div class="tk-r">
       <div class="tk-nh">${esc(d.title)}${d.scope === 'class' ? ' <span class="tg" style="font-size:10px;padding:1px 6px">cả lớp</span>' : ''}
         <span class="p">${d.tong ? Math.round(d.da_nhan / d.tong * 100) : 0}%</span></div>
       ${veCot(d)}
       <div class="tk-s" style="color:var(--ink3)">Đã vào tài khoản người thu: <b>${vnMoney(d.tien_da_nhan)}</b> / ${vnMoney(d.tien_can)} đ</div>
       ${d.theo_nhom ? `<div class="tk-con">${d.theo_nhom.map(n => `
         <div>
           <div class="tk-nh" style="font-size:12.5px">${esc(n.label ?? 'Chưa có nhóm')}
             <span class="p">${n.tong ? Math.round(n.da_nhan / n.tong * 100) : 0}%</span></div>
           ${veCot(n)}
         </div>`).join('')}</div>` : ''}
     </div>`).join('')}</div>`
   : `<div class="card"><div class="cb mut">Chưa có đợt thu nào đang mở.</div></div>`}
   ${dot.some(d => !d.xem_ca_dot) ?
     `<div class="foot" style="padding:12px 0 0">Chỉ người thu của đợt và Ban cán sự lớp mới xem được phần chia theo nhóm.</div>` : ''}
   <div class="sa"><button class="big c" id="tkClose">Đóng</button></div>`);
  $('#tkClose').onclick = closeSheet;
}

/* ─── Sổ chi ─── */
let SOCHI = null;

// Sổ chi mở cho cả phạm vi xem, khác sổ thu (chỉ người thu và Ban cán sự lớp)
// — giấu khoản chi đi thì mất luôn lý do tồn tại của cái sổ.
async function openSoChi(scope) {
  openSheet(`<h3>Sổ chi</h3><p class="sub">Đang tải…</p>`);
  try { SOCHI = await apiGet(`/api/funds/expenses?scope=${encodeURIComponent(scope)}`); }
  catch (e) { closeSheet(); toast(errText(e)); return; }
  veSoChi();
}

function veSoChi() {
  const { scope, summary: s, expenses, can_manage } = SOCHI;
  const ten = scope === 'class' ? 'Sổ chi quỹ lớp' : 'Sổ chi quỹ nhóm';
  openSheet(`
   <h3>${ten}</h3>
   <p class="sub">Người thu đã nhận ${vnMoney(s.da_nhan)} đ · đã chi ${vnMoney(s.da_chi)} đ ·
     còn lại <b style="color:${s.con_lai < 0 ? 'var(--due)' : 'var(--go)'}">${vnMoney(s.con_lai)} đ</b>.</p>
   ${can_manage ? `<button class="wide" id="scNew" style="margin-bottom:14px">+ Ghi khoản chi</button>` : ''}
   ${expenses.length ? `<div class="card"><div class="cb" style="padding:2px 0">
     ${expenses.map(e => `<div class="of">
       <div class="rl">${esc(e.spent_on || (e.created_at || '').slice(0, 10))}</div>
       <div style="flex:1;min-width:0">
         <div class="nm">${esc(e.title)}</div>
         <div class="co">${vnMoney(e.amount)} đ${e.category_label ? ' · ' + esc(e.category_label) : ''}${e.payee ? ' · ' + esc(e.payee) : ''}</div>
         ${e.note ? `<div class="co">${esc(e.note)}</div>` : ''}
         <div class="src">${e.round_title ? 'từ đợt “' + esc(e.round_title) + '” · ' : ''}${esc(e.created_by_name || '—')} ghi${e.updated_at ? ' · đã sửa' : ''}</div>
         ${e.receipt_url ? `<div class="src"><a class="lnk" href="${esc(e.receipt_url)}" target="_blank" rel="noopener noreferrer">xem hoá đơn</a></div>` : ''}
       </div>
       ${can_manage ? `<div style="display:flex;gap:6px">
         <button class="tg" data-scedit="${e.id}">sửa</button>
         <button class="tg" data-scdel="${e.id}">xoá</button></div>` : ''}
     </div>`).join('')}
   </div></div>` : `<div class="card"><div class="cb">
     <div style="font-weight:600;margin-bottom:4px">Chưa ghi khoản chi nào</div>
     <div class="mut">${can_manage ? 'Tiêu gì cho quỹ thì ghi vào đây, cả nhóm cùng thấy.' : 'Người giữ quỹ sẽ ghi vào đây khi có khoản chi.'}</div>
   </div></div>`}
   <div class="foot">Ứng dụng không giữ tiền và không đối chiếu sao kê. Đây là sổ tay chung —
     ghi lại việc đã xảy ra ở ngoài đời để ai cũng xem được, không phải chứng từ kế toán.</div>
   <div class="sa"><button class="big c" id="scClose">Đóng</button></div>`);

  $('#scClose').onclick = closeSheet;
  if ($('#scNew')) $('#scNew').onclick = () => formChi(null);
  document.querySelectorAll('.sheet [data-scedit]').forEach(b => {
    b.onclick = () => formChi(SOCHI.expenses.find(x => x.id === Number(b.dataset.scedit)));
  });
  document.querySelectorAll('.sheet [data-scdel]').forEach(b => {
    b.onclick = () => xoaChi(SOCHI.expenses.find(x => x.id === Number(b.dataset.scdel)));
  });
}

async function taiLaiSoChi() {
  SOCHI = await apiGet(`/api/funds/expenses?scope=${encodeURIComponent(SOCHI.scope)}`);
  veSoChi();
  await drawQuy();
}

function formChi(e) {
  const suaLai = !!e;
  const dotCungSo = (FUNDS?.rounds ?? []).filter(r => r.scope === SOCHI.scope && r.status !== 'draft');
  openSheet(`
   <h3>${suaLai ? 'Sửa khoản chi' : 'Ghi khoản chi'}</h3>
   <p class="sub">Cả ${SOCHI.scope === 'class' ? 'lớp' : 'nhóm'} đều xem được khoản này. Ghi rõ để sau khỏi phải nhớ lại.</p>
   <label class="f">Chi vào việc gì</label>
   <input id="cT" maxlength="120" placeholder="In 40 bộ tài liệu buổi 9" value="${esc(e?.title ?? '')}">
   <label class="f">Số tiền (đ)</label>
   <input id="cA" type="number" min="1000" step="1000" inputmode="numeric" placeholder="480000" value="${e?.amount ?? ''}">
   <label class="f">Hạng mục</label>
   <select id="cC"><option value="">— không chọn —</option>
     ${(SOCHI.categories ?? []).map(c => `<option value="${c.key}"${e?.category === c.key ? ' selected' : ''}>${esc(c.label)}</option>`).join('')}</select>
   <label class="f">Ngày chi</label><input id="cD" type="date" value="${esc(e?.spent_on ?? '')}">
   <label class="f">Trả cho ai</label>
   <input id="cP" maxlength="120" placeholder="Cửa hàng in Minh Anh" value="${esc(e?.payee ?? '')}">
   ${dotCungSo.length ? `<label class="f">Tiêu từ đợt thu nào (không bắt buộc)</label>
   <select id="cR"><option value="">— không gắn đợt nào —</option>
     ${dotCungSo.map(r => `<option value="${r.id}"${e?.round_id === r.id ? ' selected' : ''}>${esc(r.title)}</option>`).join('')}</select>` : ''}
   <label class="f">Đường dẫn ảnh hoá đơn</label>
   <input id="cU" maxlength="2000" inputmode="url" placeholder="https://drive.google.com/..." value="${esc(e?.receipt_url ?? '')}">
   <div class="hintline">Ứng dụng không giữ file. Chụp hoá đơn để trên Drive rồi dán đường dẫn vào đây.</div>
   <label class="f">Ghi chú</label><textarea id="cN" maxlength="300" rows="2">${esc(e?.note ?? '')}</textarea>
   <div id="cErr" class="errline" style="display:none"></div>
   <div class="sa"><button class="big c" id="cCancel">Thôi</button>
     <button class="big go" id="cSave">${suaLai ? 'Lưu' : 'Ghi vào sổ'}</button></div>`);

  $('#cCancel').onclick = veSoChi;
  $('#cSave').onclick = async () => {
    const than = {
      scope: SOCHI.scope,
      title: $('#cT').value,
      amount: Number($('#cA').value || 0),
      category: $('#cC').value || null,
      spent_on: $('#cD').value || null,
      payee: $('#cP').value || null,
      round_id: $('#cR') ? ($('#cR').value || null) : null,
      receipt_url: $('#cU').value.trim() || null,
      note: $('#cN').value || null,
    };
    if (!than.title.trim()) { loiChi('Cần ghi chi vào việc gì.'); return; }
    if (!Number.isInteger(than.amount) || than.amount <= 0) { loiChi('Số tiền phải là số nguyên dương.'); return; }
    // Khoá nút trong lúc gửi: bấm đúp ở đây là thành hai khoản chi trùng nhau.
    const nut = $('#cSave'), chu = nut.textContent;
    nut.disabled = true; nut.textContent = 'Đang lưu…';
    try {
      if (suaLai) await apiPatch(`/api/funds/expenses/${e.id}`, than);
      else await apiPost('/api/funds/expenses', than);
    } catch (err) { loiChi(errText(err)); nut.disabled = false; nut.textContent = chu; return; }
    await taiLaiSoChi();
    toast(suaLai ? 'Đã lưu' : 'Đã ghi vào sổ chi');
  };
}

function loiChi(t) { $('#cErr').textContent = t; $('#cErr').style.display = 'block'; }

function xoaChi(e) {
  openSheet(`
   <h3>Xoá khoản chi</h3>
   <p class="sub">“${esc(e.title)}” — ${vnMoney(e.amount)} đ.</p>
   <div class="warn">Xoá xong số dư đổi ngay. Việc xoá vẫn hiện trong nhật ký nhóm và nhật ký hệ thống,
     nên nếu chỉ ghi nhầm số thì nên sửa chứ đừng xoá.</div>
   <div class="sa"><button class="big c" id="xcCancel">Thôi</button>
     <button class="big go" id="xcGo">Xoá khỏi sổ</button></div>`);
  $('#xcCancel').onclick = veSoChi;
  // Cố ý không dùng submitting(): nó đóng sheet sau khi xong, mà ở đây muốn
  // quay lại sổ chi để thấy số dư mới và xoá tiếp nếu cần.
  $('#xcGo').onclick = async () => {
    const nut = $('#xcGo');
    nut.disabled = true; nut.textContent = 'Đang xoá…';
    try { await apiDelete(`/api/funds/expenses/${e.id}`); }
    catch (err) { toast(errText(err)); nut.disabled = false; nut.textContent = 'Xoá khỏi sổ'; return; }
    await taiLaiSoChi();
    toast('Đã xoá khỏi sổ chi');
  };
}

/* ─── Passkey ─── */
async function registerPasskey() {
  if (!passkeySupported()) { toast('Thiết bị này chưa hỗ trợ passkey'); return; }
  try {
    const { handle, options } = await apiPost('/api/passkey/register/options');
    const publicKey = {
      ...options,
      challenge: b64uToBuf(options.challenge),
      user: { ...options.user, id: b64uToBuf(options.user.id) },
      excludeCredentials: (options.excludeCredentials ?? []).map(c => ({ ...c, id: b64uToBuf(c.id) })),
    };
    const cred = await navigator.credentials.create({ publicKey });
    await apiPost('/api/passkey/register/verify', {
      handle,
      label: navigator.userAgent.includes('iPhone') ? 'iPhone'
        : navigator.userAgent.includes('Android') ? 'Điện thoại Android' : 'Máy tính',
      response: {
        id: cred.id,
        rawId: bufToB64u(cred.rawId),
        type: cred.type,
        clientExtensionResults: cred.getClientExtensionResults(),
        response: {
          clientDataJSON: bufToB64u(cred.response.clientDataJSON),
          attestationObject: bufToB64u(cred.response.attestationObject),
          transports: cred.response.getTransports?.() ?? [],
        },
      },
    });
    toast('Đã thêm passkey');
    return true;
  } catch (e) {
    // Người dùng bấm huỷ ở hộp thoại hệ thống thì không phải lỗi, đừng la lên.
    if (e?.name === 'NotAllowedError' || e?.name === 'AbortError') return false;
    toast(errText(e));
    return false;
  }
}

async function loginWithPasskey() {
  if (!passkeySupported()) { toast('Thiết bị này chưa hỗ trợ passkey'); return; }
  try {
    const { handle, options } = await apiPost('/api/passkey/login/options');
    const publicKey = {
      ...options,
      challenge: b64uToBuf(options.challenge),
      allowCredentials: (options.allowCredentials ?? []).map(c => ({ ...c, id: b64uToBuf(c.id) })),
    };
    const cred = await navigator.credentials.get({ publicKey });
    await apiPost('/api/passkey/login/verify', {
      handle,
      response: {
        id: cred.id,
        rawId: bufToB64u(cred.rawId),
        type: cred.type,
        clientExtensionResults: cred.getClientExtensionResults(),
        response: {
          clientDataJSON: bufToB64u(cred.response.clientDataJSON),
          authenticatorData: bufToB64u(cred.response.authenticatorData),
          signature: bufToB64u(cred.response.signature),
          userHandle: cred.response.userHandle ? bufToB64u(cred.response.userHandle) : undefined,
        },
      },
    });
    history.replaceState({}, '', '/');
    boot();
  } catch (e) {
    if (e?.name === 'NotAllowedError' || e?.name === 'AbortError') return;
    toast(errText(e));
  }
}

/* ─── Tài khoản ─── */
async function openMe() {
  openSheet(`
   ${avatar(HOME.me.full_name)}
   <h3 style="margin-top:12px">${esc(HOME.me.full_name)}</h3>
   <p class="sub">${esc(HOME.group?.label ?? '')} · Khoá K03</p>
   <button class="wide ghost" id="meEdit" style="margin-bottom:14px">Sửa hồ sơ của tôi</button>
   <div id="pkBox" class="mut" style="margin-bottom:14px">Đang xem passkey…</div>
   <div id="pushBox" class="mut" style="margin-bottom:14px">Đang xem thông báo…</div>
   <div class="sa"><button class="big c" id="meClose">Đóng</button>
     <button class="big go" id="meLogout" style="background:var(--due)">Đăng xuất</button></div>`);
  $('#meClose').onclick = closeSheet;
  // Đường sửa hồ sơ ngắn nhất: ai vào bằng link mời vì danh sách lớp ghi sai
  // số của họ thì chữa ngay tại đây, không phải đi vòng qua tab Nhóm.
  $('#meEdit').onclick = () => openMemberEdit(HOME.me.id);
  $('#meLogout').onclick = async () => {
    await apiPost('/api/auth/logout');
    closeSheet();
    HOME = null; PLAN = null; MEMBERS = []; FUNDS = null;
    renderNoSession();
  };
  drawPasskeyBox();
  veHopThongBao();
}

/* ─── Thông báo đẩy ───
   Lệch nguyên tắc N1 mục 1.3 SRS, có chủ ý: Ngô Phú Cường quyết ngày 24/8.
   Phần còn lại của N1 giữ nguyên — vẫn không có chat, và thông báo đẩy chỉ
   mang đúng một việc: "có thông báo mới, mở ứng dụng ra xem". */

function pushDungDuoc() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

// iOS chỉ cho nhận thông báo đẩy khi ứng dụng ĐÃ được cài lên màn hình chính.
// Mở trong Safari bình thường thì Notification có tồn tại nhưng xin quyền luôn
// bị từ chối, không kèm lý do — nên phải tự nhận ra và nói trước.
function laIosChuaCai() {
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const daCai = window.matchMedia?.('(display-mode: standalone)')?.matches || navigator.standalone === true;
  return ios && !daCai;
}

async function veHopThongBao() {
  const box = $('#pushBox');
  if (!box) return;

  if (!pushDungDuoc()) {
    box.innerHTML = 'Trình duyệt này không nhận được thông báo đẩy. Chấm đỏ trên tab Hôm nay vẫn báo cho bạn.';
    return;
  }
  let tt;
  try { tt = await apiGet('/api/push/trang-thai'); } catch { box.textContent = ''; return; }
  if (!tt.bat) {
    box.innerHTML = 'Thông báo đẩy chưa được bật ở máy chủ.';
    return;
  }
  if (laIosChuaCai()) {
    box.innerHTML = `<b style="color:var(--ink)">Muốn nhận thông báo trên iPhone?</b><br>
      Bấm nút Chia sẻ ở Safari → <b>Thêm vào MH chính</b>, rồi mở ứng dụng từ biểu tượng vừa hiện.
      iPhone chỉ cho nhận thông báo khi mở theo đường ấy.`;
    return;
  }

  const daBat = Notification.permission === 'granted' && tt.so_thiet_bi > 0;
  box.innerHTML = `
    <div style="margin-bottom:8px">${daBat
      ? `<b style="color:var(--ink)">Đang nhận thông báo</b> trên ${tt.so_thiet_bi} thiết bị.`
      : 'Nhận thông báo khi lớp hoặc nhóm có tin mới.'}</div>
    <button class="wide ghost" id="pushNut" style="padding:11px;font-size:14px">
      ${daBat ? 'Tắt trên máy này' : 'Bật thông báo'}</button>`;
  $('#pushNut').onclick = daBat ? tatThongBao : batThongBao;
}

async function batThongBao() {
  const nut = $('#pushNut');
  nut.disabled = true; nut.textContent = 'Đang xin quyền…';
  try {
    if ((await Notification.requestPermission()) !== 'granted') {
      toast('Bạn đã từ chối. Bật lại trong cài đặt trình duyệt.');
      return veHopThongBao();
    }
    const { khoa_cong_khai } = await apiGet('/api/push/khoa');
    if (!khoa_cong_khai) { toast('Máy chủ chưa cấu hình'); return veHopThongBao(); }

    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,               // Chrome bắt buộc; đặt false là bị từ chối
      applicationServerKey: b64urlSangBytes(khoa_cong_khai),
    });
    const j = sub.toJSON();
    await apiPost('/api/push/dang-ky', {
      endpoint: sub.endpoint, p256dh: j.keys?.p256dh, auth: j.keys?.auth,
    });
    toast('Đã bật thông báo');
  } catch (e) {
    toast(errText(e) || 'Không bật được thông báo');
  }
  veHopThongBao();
}

async function tatThongBao() {
  const nut = $('#pushNut');
  nut.disabled = true; nut.textContent = 'Đang tắt…';
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await apiPost('/api/push/huy', { endpoint: sub.endpoint });
      await sub.unsubscribe();
    }
    toast('Đã tắt trên máy này');
  } catch (e) { toast(errText(e)); }
  veHopThongBao();
}

// applicationServerKey phải là byte thô, không phải chuỗi base64url — truyền
// chuỗi vào thì subscribe() ném InvalidCharacterError.
function b64urlSangBytes(s) {
  const p = (s + '='.repeat((4 - (s.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(p), c => c.charCodeAt(0));
}

/* Xác minh email ngay trong tab Tài khoản — dành cho ai vào bằng link mời:
   đã có phiên nhưng chưa chứng minh cầm hộp thư, nên chưa mở được passkey. */
function veXacMinh(trangThai) {
  const o = $('#pkXm');
  if (!o) return;
  if (trangThai !== 'da-gui') {
    o.innerHTML = `<button class="wide ghost" id="pkGui" style="padding:11px;font-size:14px">Gửi mã xác minh</button>`;
    $('#pkGui').onclick = async () => {
      const b = $('#pkGui'); b.disabled = true; b.textContent = 'Đang gửi…';
      try { await apiPost('/api/me/verify-email'); veXacMinh('da-gui'); }
      catch (e) { toast(errText(e)); b.disabled = false; b.textContent = 'Gửi mã xác minh'; }
    };
    return;
  }
  o.innerHTML = `
    <input id="pkMa" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="000000"
           style="font-size:22px;letter-spacing:6px;text-align:center">
    <div id="pkMsg" class="hintline" style="display:none"></div>
    <button class="wide" id="pkOk" style="margin-top:8px;padding:11px;font-size:14px">Xác minh</button>`;
  const oMa = $('#pkMa'); oMa.focus();
  const xong = async () => {
    const code = oMa.value.replace(/\D/g, '');
    if (code.length !== 6) return;
    $('#pkOk').disabled = true; $('#pkOk').textContent = 'Đang kiểm…';
    try {
      await apiPost('/api/me/verify-email/confirm', { code });
      HOME = await apiGet('/api/home');   // để lần vẽ sau thấy email_verified
      toast('Đã xác minh email');
      await drawPasskeyBox();
    } catch (e) {
      const conLai = e?.data?.con_lai;
      $('#pkMsg').style.display = 'block';
      $('#pkMsg').style.color = 'var(--due)';
      $('#pkMsg').textContent = errText(e) + (conLai !== undefined ? ` Còn ${conLai} lần thử.` : '');
      $('#pkOk').disabled = false; $('#pkOk').textContent = 'Xác minh';
      oMa.select();
    }
  };
  $('#pkOk').onclick = xong;
  oMa.oninput = () => { if (oMa.value.replace(/\D/g, '').length === 6) xong(); };
}

async function drawPasskeyBox() {
  if (!$('#pkBox')) return;

  // Điều kiện của Đợt 5: chưa chứng minh cầm hộp thư thì chưa mở passkey.
  // Passkey gắn chặt vào thiết bị — mất máy mà không có đường email đã kiểm
  // chứng thì không còn lối nào vào lại. Máy chủ cũng chặn riêng, đây chỉ là
  // lớp giao diện cho đỡ bấm hụt.
  if (!HOME?.me?.email_verified) {
    $('#pkBox').innerHTML = `
      <div class="eb" style="margin-bottom:8px">Passkey</div>
      <div class="mut">Xác minh email trước đã. Chúng tôi gửi một mã 6 số tới
        <b>${esc(HOME?.me?.email_che ?? 'email của bạn')}</b> — nhập xong là mở được passkey,
        lần sau vào bằng vân tay hoặc khuôn mặt.</div>
      <div id="pkXm" style="margin-top:10px"></div>`;
    veXacMinh();
    return;
  }

  let list = [];
  try { list = (await apiGet('/api/passkey')).passkeys; } catch { /* không chặn màn tài khoản */ }
  if (!$('#pkBox')) return;

  $('#pkBox').innerHTML = `
    <div class="eb" style="margin-bottom:8px">Passkey <span class="c">${list.length}</span></div>
    ${list.length ? `<div class="card"><div class="cb" style="padding:2px 14px">
      ${list.map(p => `<div class="fd"><div class="x"><b>${esc(p.label)}</b>
        <div style="font-size:11.5px;color:var(--ink3);margin-top:2px">
          thêm ${vnDate(p.created_at)}${p.last_used_at ? ' · dùng gần nhất ' + vnDate(p.last_used_at) : ''}</div></div>
        <button class="lnk" data-rmpk="${p.id}">gỡ</button></div>`).join('')}
    </div></div>`
    : `<div class="mut" style="margin-bottom:10px">Chưa có passkey nào. Thêm một cái để lần sau vào bằng vân tay hoặc khuôn mặt, khỏi chờ thư.</div>`}
    ${passkeySupported() ? `<button class="wide ghost" id="pkAdd" style="margin-top:10px;padding:11px;font-size:14px">+ Thêm passkey cho thiết bị này</button>`
      : `<div class="mut" style="margin-top:8px">Thiết bị này chưa hỗ trợ passkey.</div>`}
    <div class="foot" style="padding:10px 0 0">Passkey chỉ là lối đi nhanh. Email vẫn luôn là đường lui — gỡ hết passkey cũng không mất quyền vào.</div>`;

  if ($('#pkAdd')) $('#pkAdd').onclick = async () => {
    $('#pkAdd').disabled = true;
    if (await registerPasskey()) await drawPasskeyBox(); else $('#pkAdd').disabled = false;
  };
  document.querySelectorAll('.sheet [data-rmpk]').forEach(b => {
    b.onclick = async () => {
      try { await apiDelete(`/api/passkey/${b.dataset.rmpk}`); toast('Đã gỡ passkey'); await drawPasskeyBox(); }
      catch (e) { toast(errText(e)); }
    };
  });
}

/* ═══════════ KHỞI ĐỘNG ═══════════ */
function renderApp() {
  document.body.classList.remove('noapp');
  $('#root').innerHTML = shellHtml();
  ensureVeil();
  document.querySelectorAll('.nb').forEach(b => { b.onclick = () => go(b.dataset.v); });
  drawHead();
  drawNay();
  route();
  veChamDo();
  dangKySw();
}

// Đăng ký service worker. Nó KHÔNG cache gì — chỉ để nhận thông báo đẩy và
// để iPhone chịu cài ứng dụng lên màn hình chính. Hỏng thì bỏ qua, ứng dụng
// vẫn chạy y nguyên.
function dangKySw() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

async function boot() {
  let m;
  if ((m = location.pathname.match(/^\/i\/([^/]+)\/?$/))) return renderClaim(m[1]);
  // /dangnhap là CỬA CHÍNH — màn tự nhận diện bằng tên và số điện thoại.
  // /dangnhap/email là đường cho ai đã khai email rồi. Phải xét trước nhánh
  // magic link, không thì 'email' bị nhận nhầm là token.
  if (location.pathname.replace(/\/$/, '') === '/dangnhap/email') return renderLogin();
  if ((m = location.pathname.match(/^\/dangnhap\/([^/]+)\/?$/))) return renderMagicConsume(m[1]);
  if (location.pathname.replace(/\/$/, '') === '/dangnhap') return renderVao();
  // /vao là địa chỉ cũ đã phát cho lớp — giữ sống, lặng lẽ đổi sang /dangnhap.
  if (location.pathname.replace(/\/$/, '') === '/vao') {
    history.replaceState({}, '', '/dangnhap');
    return renderVao();
  }
  if (location.pathname.replace(/\/$/, '') === '/start') return renderStart();

  try {
    HOME = await apiGet('/api/home');
    BAN_LUC_MO = HOME.ban ?? null;
  } catch (e) {
    if (e.status === 401) return renderNoSession();
    document.body.classList.add('noapp');
    $('#root').innerHTML = `<div class="claimwrap"><div class="claimcard"><h1>Không tải được</h1>
      <p class="sub">Có lỗi khi kết nối máy chủ — thử tải lại trang.</p></div></div>`;
    return;
  }
  renderApp();
  batTuLamMoi();
}

addEventListener('hashchange', route);

// Nút Back của trình duyệt. Các màn trước khi đăng nhập đổi đường dẫn bằng
// pushState, mà không bắt popstate thì bấm Back chỉ đổi thanh địa chỉ còn màn
// hình đứng nguyên — người dùng tưởng máy treo. Trong ứng dụng (đã đăng nhập)
// thì tab chạy bằng hash nên route() lo, gọi boot() ở đó là tải lại thừa.
addEventListener('popstate', () => {
  if (document.body.classList.contains('noapp')) boot();
  else route();
});

boot();
