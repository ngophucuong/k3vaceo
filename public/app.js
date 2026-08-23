/* ═══════════ TIỆN ÍCH ═══════════ */
const $ = s => document.querySelector(s);

// Phải thoát cả dấu nháy: chuỗi này được nhúng vào bên trong thuộc tính HTML
// (href="...", value="..."), nên bỏ sót dấu " là thoát ra khỏi thuộc tính và
// gắn được onmouseover — bất kỳ ai gắn liên kết vào Kho cũng chèn được mã
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
  rate_limited: 'Bạn thử hơi nhiều lần. Chờ một lát rồi làm lại.',
  mailer_not_configured: 'Chưa cấu hình gửi thư — nhắn trưởng nhóm để lấy link mời.',
  only_collector: 'Chỉ người thu của đợt này mới xác nhận đã nhận tiền.',
  already_verified: 'Người thu đã xác nhận nhận được tiền của bạn — không bỏ khai được nữa.',
  round_not_open: 'Đợt thu này chưa mở.',
  amount_invalid: 'Số tiền chưa hợp lệ.',
  bank_bin_invalid: 'Mã ngân hàng phải đúng 6 chữ số.',
  account_no_invalid: 'Số tài khoản chỉ gồm chữ và số.',
  collector_not_found: 'Người thu phải là thành viên trong nhóm.',
  title_required: 'Cần đặt tên cho đợt thu.',
  passkey_verify_failed: 'Không xác thực được passkey. Thử lại hoặc dùng email.',
  passkey_unknown: 'Passkey này chưa được đăng ký ở đây.',
  passkey_already_registered: 'Thiết bị này đã đăng ký passkey rồi.',
  challenge_invalid: 'Phiên đăng ký passkey hết hạn — bấm lại từ đầu.',
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
let MEMBERS = [];     // /api/members gần nhất

const iAmOfficer = () => !!HOME?.officers?.some(o => o.member_id === HOME.me.id);

async function refreshHome() {
  HOME = await apiGet('/api/home');
  drawHead(); drawNay();
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
      <div style="margin-top:16px"><button class="wide" onclick="location.href='/'">Về trang chính</button></div>`;
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
  $('#root').innerHTML = `<div class="claimwrap"><div class="claimcard"><h1>Đang đưa bạn vào…</h1></div></div>`;
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
    $('#again').onclick = renderLogin;
  }
}

function renderLogin() {
  document.body.classList.add('noapp');
  $('#root').innerHTML = `<div class="claimwrap"><div class="claimcard">
    <div class="lb">k3vaceo · Khoá K03</div>
    <h1>Đăng nhập</h1>
    <p class="sub">Nhập email bạn đã khai lúc nhận link mời. Chúng tôi gửi một đường dẫn đăng nhập tới hộp thư đó.</p>
    <label class="f">Email</label><input id="lgEmail" placeholder="ten@congty.vn" inputmode="email" maxlength="160">
    <div id="lgMsg" class="hintline" style="display:none"></div>
    <button class="wide" id="lgSend">Gửi link đăng nhập</button>
    <button class="wide ghost" id="lgPasskey" style="margin-top:10px">Đăng nhập bằng passkey</button>
    <div class="foot" style="padding:14px 0 0">Chưa từng nhận link mời? Nhắn trưởng hoặc phó nhóm — link mời riêng là lối vào đầu tiên.</div>
  </div></div>`;
  $('#lgPasskey').onclick = loginWithPasskey;
  $('#lgSend').onclick = async () => {
    const email = $('#lgEmail').value.trim();
    if (!email) return;
    const btn = $('#lgSend');
    btn.disabled = true; btn.textContent = 'Đang gửi…';
    try {
      await apiPost('/api/auth/email', { email });
      $('#lgMsg').style.display = 'block';
      $('#lgMsg').innerHTML = 'Nếu email này có trong lớp, đường dẫn đăng nhập vừa được gửi tới đó. Link sống 15 phút.';
      btn.textContent = 'Đã gửi';
    } catch (e) {
      $('#lgMsg').style.display = 'block';
      $('#lgMsg').style.color = 'var(--due)';
      $('#lgMsg').textContent = errText(e);
      btn.disabled = false; btn.textContent = 'Gửi link đăng nhập';
    }
  };
}

function renderNoSession() {
  document.body.classList.add('noapp');
  $('#root').innerHTML = `<div class="claimwrap"><div class="claimcard">
    <div class="lb">k3vaceo · Khoá K03</div><h1>Chưa đăng nhập</h1>
    <p class="sub">Mở đúng link mời riêng trưởng nhóm đã gửi, hoặc đăng nhập bằng email bạn đã khai.</p>
    <button class="wide" id="toLogin">Đăng nhập bằng email</button>
  </div></div>`;
  $('#toLogin').onclick = renderLogin;
}

/* ═══════════ KHUNG ỨNG DỤNG ═══════════ */
const VIEWS = ['nay', 'bai', 'nhom', 'kho', 'quy'];

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
    <button class="nb" data-v="nay"><span class="g"></span>Hôm nay</button>
    <button class="nb" data-v="bai"><span class="g"></span>Bài</button>
    <button class="nb" data-v="nhom"><span class="g"></span>Nhóm</button>
    <button class="nb" data-v="kho"><span class="g"></span>Kho</button>
    <button class="nb" data-v="quy"><span class="g"></span>Quỹ</button>
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
    // So theo ngày lịch địa phương: new Date('2026-09-26') là nửa đêm UTC nên
    // ở múi giờ Việt Nam số ngày sẽ nhảy lúc 7 giờ sáng thay vì lúc nửa đêm.
    const [y, mo, d] = HOME.cohort.defense_on.split('-').map(Number);
    const target = new Date(y, mo - 1, d);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const days = Math.round((target - today) / 86400000);
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
  <div class="sect">
    <div class="eb">Cơ cấu nhóm</div>
    <div class="card">${['truong_nhom', 'pho_nhom'].map(role => {
      const o = HOME.officers.find(x => x.role === role);
      const label = role === 'truong_nhom' ? 'Trưởng nhóm' : 'Phó nhóm';
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
    ${iAmOfficer() ? `<button class="wide ghost" id="inviteBtn" style="margin-top:10px">Phát link mời cho người chưa vào</button>` : ''}
  </div>
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
async function drawBai() {
  if (!$('#v-bai').dataset.loaded) $('#v-bai').innerHTML = `<div class="foot" style="padding:0 2px">Đang tải…</div>`;
  PLAN = await apiGet('/api/plan');
  $('#v-bai').dataset.loaded = '1';
  const { plan, sections, suggestions, insights, overall_pct, can_assign } = PLAN;
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

  <div class="eb" style="margin-top:26px">Tám phần <span class="c">${overall_pct}%</span></div>
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
      <span class="pct">${s.pct}%</span></button>`;
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
  <div class="foot">Câu nào ghi lại cũng nên gắn vào một phần — ghi xong là bài dày thêm.</div>`;

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
        <div class="b"><div class="nm">${esc(m.full_name)}${m.claimed ? '' : '<span class="tg due" style="font-size:10px;padding:1px 7px">chưa vào</span>'}</div>
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
      </div>`).join('')}
  </div>
  <div class="foot">Ai biết số điện thoại người còn trống thì điền hộ, chính chủ sửa lại sau.</div>`;

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

/* ─── Kho ─── */
const KHO_FILTERS = [['all', 'Tất cả'], ['bai', 'Cho bài'], ['buoi', 'Theo buổi'], ['lop', 'Lớp K03']];
async function drawKho(tag) {
  if (!$('#v-kho').dataset.loaded) $('#v-kho').innerHTML = `<div class="foot" style="padding:0 2px">Đang tải…</div>`;
  const { links } = await apiGet(tag && tag !== 'all' ? `/api/links?tag=${encodeURIComponent(tag)}` : '/api/links');
  $('#v-kho').dataset.loaded = '1';
  $('#v-kho').innerHTML = `
  <div class="foot" style="padding:0 2px 14px">
    Kho chỉ giữ đường dẫn. File vẫn nằm ở Drive của người làm ra nó — ứng dụng không chứa,
    không sao lưu, không đứng tên.
  </div>
  <div class="fl">${KHO_FILTERS.map(([k, l]) => `<button class="fc ${tag === k ? 'on' : ''}" data-tag="${k}">${l}</button>`).join('')}</div>
  <div class="card">${links.length ? links.map(r => r.url
      ? `<a class="rs" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">
          <span class="ext">${esc(r.kind)}</span><div class="b"><div class="t">${esc(r.title)}</div>
          <div class="m">${vnDate(r.created_at)}</div></div><span style="color:var(--ink3)">↗</span></a>`
      : `<div class="rs" style="cursor:default"><span class="ext">${esc(r.kind)}</span>
          <div class="b"><div class="t">${esc(r.title)}</div><div class="m">chưa có đường dẫn — điền khi có</div></div></div>`
    ).join('') : '<div class="cb mut">Chưa có liên kết nào trong mục này.</div>'}</div>
  <button class="wide ghost" style="margin-top:12px" id="addLinkBtn">+ Gắn một liên kết</button>
  <div class="foot"></div>`;

  document.querySelectorAll('#v-kho [data-tag]').forEach(btn => { btn.onclick = () => drawKho(btn.dataset.tag); });
  $('#addLinkBtn').onclick = openLinkAdd;
}

function openLinkAdd() {
  openSheet(`
   <h3>Gắn liên kết</h3>
   <p class="sub">Chỉ dán đường dẫn https — file để nguyên chỗ cũ.</p>
   <label class="f">Đường dẫn</label><input id="lU" placeholder="https://…" inputmode="url" maxlength="2000">
   <label class="f">Gọi là gì</label><input id="lN" maxlength="200" placeholder="Báo cáo thị trường FMCG 2025">
   <label class="f">Loại</label><select id="lK"><option>DRIVE</option><option>SHEET</option><option>DOCX</option><option>PDF</option><option>WEB</option></select>
   <label class="f">Dùng cho</label><select id="lT"><option value="bai">Cho bài</option><option value="buoi">Theo buổi</option><option value="lop">Lớp K03</option></select>
   <div id="lErr" class="errline" style="display:none"></div>
   <div class="sa"><button class="big c" id="lCancel">Thôi</button>
     <button class="big go" id="lSave">Gắn vào</button></div>`);
  $('#lCancel').onclick = closeSheet;
  $('#lSave').onclick = async () => {
    if (!/^https:\/\//i.test($('#lU').value.trim())) {
      $('#lErr').textContent = 'Cần đường dẫn bắt đầu bằng https://';
      $('#lErr').style.display = 'block'; return;
    }
    await submitting($('#lSave'), async () => {
      await apiPost('/api/links', {
        url: $('#lU').value.trim(), title: $('#lN').value, kind: $('#lK').value, tag: $('#lT').value,
      });
      await drawKho('all'); await refreshHome();
    }, 'Đã gắn vào Kho');
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
  ${rounds.length ? rounds.map(r => renderRound(r)).join('') : `
    <div class="card"><div class="cb">
      <div style="font-weight:600;margin-bottom:4px">Chưa có khoản thu nào</div>
      <div class="mut">Trưởng hoặc phó nhóm tạo khoản thu, ứng dụng tự sinh mã riêng cho từng người.</div>
    </div></div>`}
  ${can_create_group || can_create_class ? `<button class="wide ghost" id="newFund" style="margin-top:12px">+ Tạo đợt thu mới</button>` : ''}
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
  if ($('#newFund')) $('#newFund').onclick = openFundCreate;
}

function renderRound(r) {
  const dots = Array.from({ length: r.total_people }, (_, i) =>
    `<i class="${i < r.declared_count ? 'd' : ''}"${i < r.verified_count ? ' data-v="1"' : ''}></i>`).join('');
  return `
  <div class="card">
    <div class="cb">
      <div style="font-size:11px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;color:var(--ink3);margin-bottom:8px">
        ${esc(r.title)}${r.scope === 'class' ? ' · quỹ lớp' : ''}${r.status === 'draft' ? ' · bản nháp' : ''}${r.status === 'closed' ? ' · đã đóng' : ''}</div>
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
        <button class="wide" data-openround="${r.id}">Mở đợt thu</button>
      </div>` : `
      <div class="qrw">
        <img class="qr" src="${esc(r.qr_url)}" alt="Mã chuyển khoản riêng của bạn" width="196" height="196">
        <div class="cap">${esc(r.bank_name || r.bank_bin)} · ${esc(r.account_no)}${r.account_name ? ' · ' + esc(r.account_name) : ''}</div>
        <button class="copy" data-copy="${esc(r.transfer_note)}">${esc(r.transfer_note)} <span style="font-size:11px;color:var(--ink3)">chép</span></button>
      </div>
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
          <b class="num" style="color:var(--ink)">${r.declared_count}/${r.total_people}</b> người đã tự khai${r.verified_count ? `, người thu đã nhận <b class="num" style="color:var(--go)">${r.verified_count}</b>` : ''}.
          Không hiện tên ai — chỉ người thu và trưởng nhóm xem được danh sách.</div>
        ${r.can_see_ledger ? `<button class="wide ghost" data-ledger="${r.id}" style="margin-top:12px;padding:11px;font-size:14px">Mở sổ ${r.i_am_collector ? 'của người thu' : 'theo dõi'}</button>` : ''}
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
  openSheet(`
   <h3>Tạo đợt thu</h3>
   <p class="sub">Số tài khoản đặt riêng cho từng đợt, không dùng chung toàn hệ thống. Tạo xong còn ở bản nháp — xem lại rồi mới mở.</p>
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
   <div id="fErr" class="errline" style="display:none"></div>
   <div class="sa"><button class="big c" id="fCancel">Thôi</button>
     <button class="big go" id="fSave">Tạo bản nháp</button></div>`);

  $('#fB').onchange = () => { $('#fBinWrap').style.display = $('#fB').value === '__other' ? 'block' : 'none'; };
  $('#fCancel').onclick = closeSheet;
  $('#fSave').onclick = async () => {
    const bin = $('#fB').value === '__other' ? $('#fBin').value.trim() : $('#fB').value;
    if (!/^\d{6}$/.test(bin)) {
      $('#fErr').textContent = 'Mã ngân hàng phải đúng 6 chữ số.'; $('#fErr').style.display = 'block'; return;
    }
    await submitting($('#fSave'), async () => {
      await apiPost('/api/funds', {
        scope: 'group',
        title: $('#fT').value, purpose: $('#fP').value,
        amount: Number($('#fA').value || 0),
        bank_bin: bin, account_no: $('#fAcc').value.trim(), account_name: $('#fAccName').value,
        collector_member_id: $('#fC').value === '' ? null : Number($('#fC').value),
        closes_on: $('#fClose').value || null,
      });
      await drawQuy();
    }, 'Đã tạo bản nháp — xem lại rồi mở');
  };
  ensureMembers().then(list => {
    if (!members && $('#fC')) {
      $('#fC').innerHTML = `<option value="">— chưa chọn —</option>` +
        list.map(m => `<option value="${m.id}">${esc(m.full_name)}</option>`).join('');
    }
  });
}

async function openLedger(roundId) {
  openSheet(`<h3>Sổ thu</h3><p class="sub">Đang tải…</p>`);
  let data;
  try { data = await apiGet(`/api/funds/${roundId}/ledger`); }
  catch (e) { closeSheet(); toast(errText(e)); return; }

  const { round, people, i_am_collector } = data;
  const done = people.filter(p => p.verified).length;
  openSheet(`
   <h3>${esc(round.title)}</h3>
   <p class="sub">${vnMoney(round.amount)} đ mỗi người · người thu đã nhận ${done}/${people.length}.
     ${i_am_collector ? 'Soi sao kê xong thì bấm xác nhận từng người.' : 'Chỉ người thu mới xác nhận được đã nhận tiền.'}</p>
   <div class="warn" style="margin-bottom:14px">Không có nhắc nợ tự động. Ai chưa chuyển thì nhắn riêng.</div>
   <div class="card"><div class="cb" style="padding:2px 14px">
     ${people.map(p => `<div class="fd">
       ${avatar(p.full_name)}
       <div class="x"><b>${esc(p.full_name)}</b>
         <div style="font-size:11.5px;margin-top:2px" class="${p.verified ? 'st-ok' : p.declared ? 'st-mid' : 'st-no'}">${esc(p.status_label)}</div></div>
       <div style="display:flex;gap:6px;align-items:center">
         ${p.phone ? `<a class="tg" href="tel:${esc(p.phone)}">gọi</a>` : ''}
         ${i_am_collector ? `<button class="tg ${p.verified ? 'go' : ''}" data-verify="${p.id}" data-undo="${p.verified ? '1' : '0'}">${p.verified ? 'bỏ xác nhận' : 'đã nhận'}</button>` : ''}
       </div></div>`).join('')}
   </div></div>
   <div class="sa"><button class="big c" id="ldClose">Đóng</button></div>`);

  $('#ldClose').onclick = closeSheet;
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
   <div id="pkBox" class="mut" style="margin-bottom:14px">Đang xem passkey…</div>
   <div class="sa"><button class="big c" id="meClose">Đóng</button>
     <button class="big go" id="meLogout" style="background:var(--due)">Đăng xuất</button></div>`);
  $('#meClose').onclick = closeSheet;
  $('#meLogout').onclick = async () => {
    await apiPost('/api/auth/logout');
    closeSheet();
    HOME = null; PLAN = null; MEMBERS = []; FUNDS = null;
    renderNoSession();
  };
  drawPasskeyBox();
}

async function drawPasskeyBox() {
  if (!$('#pkBox')) return;
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
}

async function boot() {
  let m;
  if ((m = location.pathname.match(/^\/i\/([^/]+)\/?$/))) return renderClaim(m[1]);
  if ((m = location.pathname.match(/^\/dangnhap\/([^/]+)\/?$/))) return renderMagicConsume(m[1]);
  if (location.pathname.replace(/\/$/, '') === '/dangnhap') return renderLogin();

  try {
    HOME = await apiGet('/api/home');
  } catch (e) {
    if (e.status === 401) return renderNoSession();
    document.body.classList.add('noapp');
    $('#root').innerHTML = `<div class="claimwrap"><div class="claimcard"><h1>Không tải được</h1>
      <p class="sub">Có lỗi khi kết nối máy chủ — thử tải lại trang.</p></div></div>`;
    return;
  }
  renderApp();
}

addEventListener('hashchange', route);
boot();
