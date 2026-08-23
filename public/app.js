/* ═══════════ TIỆN ÍCH ═══════════ */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
const ini = n => { const w = n.trim().split(/\s+/); return (w[w.length - 2]?.[0] || '') + (w[w.length - 1]?.[0] || ''); };
const hue = n => { let h = 0; for (const c of n) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
const avatar = (name, cl = '') => `<span class="av ${cl}" style="background:hsl(${hue(name)} 34% 42%)">${esc(ini(name))}</span>`;
const short = n => n.trim().split(/\s+/).slice(-2).join(' ');
function toast(t) {
  const e = $('#toast'); e.textContent = t; e.classList.add('on');
  clearTimeout(e._t); e._t = setTimeout(() => e.classList.remove('on'), 2100);
}

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
let HOME = null; // kết quả /api/home gần nhất, header và "Hôm nay" dùng chung

function iAmOfficer() {
  return !!HOME?.officers?.some(o => o.member_id === HOME.me.id);
}

/* ═══════════ SHEET DÙNG CHUNG ═══════════ */
function ensureVeil() {
  if ($('#veil')) return;
  document.body.insertAdjacentHTML('beforeend',
    `<div class="veil" id="veil"><div class="sheet" id="sheet"></div></div>`);
  $('#veil').addEventListener('click', e => { if (e.target.id === 'veil') closeSheet(); });
}
function openSheet(html) {
  ensureVeil();
  $('#sheet').innerHTML = '<div class="grab"></div>' + html;
  $('#veil').classList.add('on');
}
function closeSheet() { $('#veil')?.classList.remove('on'); }

/* ═══════════ MÀN NHẬN LINK MỜI (/i/:token) ═══════════ */
async function renderClaim(token) {
  document.body.classList.add('noapp');
  const root = $('#root');
  root.innerHTML = `<div class="claimwrap"><div class="claimcard" id="claimcard">Đang tải…</div></div>`;
  let data;
  try {
    data = await apiGet(`/api/invite/${encodeURIComponent(token)}`);
  } catch (e) {
    $('#claimcard').innerHTML = `<div class="lb">Link mời</div><h1>Không mở được link này</h1>
      <div class="err">Link đã hết hạn hoặc không đúng. Nhắn cho trưởng nhóm để xin gửi lại.</div>`;
    return;
  }
  const { member, group } = data;
  $('#claimcard').innerHTML = `
    <div class="lb">${esc(group.label)} · Khoá K03</div>
    <h1>${member.already_claimed ? 'Sửa lại hồ sơ của bạn' : `Chào ${esc(short(member.full_name))}`}</h1>
    <p class="sub">${member.already_claimed
      ? 'Bạn đã xác nhận hồ sơ trước đó — sửa lại nếu có gì đổi, hoặc bấm thẳng "Vào ứng dụng".'
      : 'Thông tin lấy từ danh sách Ban tổ chức, có chỗ đã cũ hoặc sai. Sửa lại cho đúng rồi xác nhận.'}</p>
    <label class="f">Họ tên</label><input value="${esc(member.full_name)}" disabled>
    <label class="f">Email <span style="color:var(--due)">*</span></label>
    <input id="cEmail" value="${esc(member.email)}" placeholder="ten@congty.vn" inputmode="email">
    <div class="hintline">Dùng để đăng nhập lại từ lần sau (Đợt 2).</div>
    <label class="f">Điện thoại</label><input id="cPhone" value="${esc(member.phone)}" placeholder="09xx xxx xxx" inputmode="tel">
    <label class="f">Chức vụ</label><input id="cTitle" value="${esc(member.title)}">
    <label class="f">Đơn vị</label><input id="cCompany" value="${esc(member.company)}">
    <div id="cErr" class="errline" style="display:none"></div>
    <button class="wide" id="cSubmit">${member.already_claimed ? 'Lưu' : 'Xác nhận hồ sơ'}</button>`;

  $('#cSubmit').onclick = async () => {
    const email = $('#cEmail').value.trim();
    if (!email) {
      $('#cErr').textContent = 'Cần điền email để dùng lần sau.';
      $('#cErr').style.display = 'block';
      $('#cEmail').style.boxShadow = 'inset 0 0 0 2px var(--due)';
      return;
    }
    $('#cSubmit').textContent = 'Đang lưu…';
    try {
      await apiPost(`/api/invite/${encodeURIComponent(token)}/claim`, {
        email, phone: $('#cPhone').value.trim(), title: $('#cTitle').value.trim(), company: $('#cCompany').value.trim(),
      });
      history.replaceState({}, '', '/');
      document.body.classList.remove('noapp');
      boot();
    } catch (e) {
      $('#cErr').textContent = 'Không lưu được — thử lại.';
      $('#cErr').style.display = 'block';
      $('#cSubmit').textContent = member.already_claimed ? 'Lưu' : 'Xác nhận hồ sơ';
    }
  };
}

/* ═══════════ CHƯA ĐĂNG NHẬP ═══════════ */
function renderNoSession() {
  document.body.classList.add('noapp');
  $('#root').innerHTML = `<div class="claimwrap"><div class="claimcard">
    <div class="lb">k3vaceo</div><h1>Cần link mời từ trưởng nhóm</h1>
    <p class="sub">Đợt 1 mới nhận diện qua link mời riêng cho từng người. Nếu bạn đã có link, mở lại đúng link đó.
    Chưa có thì nhắn trưởng hoặc phó nhóm để xin gửi lại.</p>
  </div></div>`;
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
  if (v === 'nhom') drawNhom();
  if (v === 'kho') drawKho('all');
  if (v === 'bai') drawSoon('bai');
  if (v === 'quy') drawSoon('quy');
}
function go(v) { location.hash = '#/' + v; }

/* ─── Đầu trang ─── */
function drawHead() {
  $('#hdGroup').textContent = HOME.group?.label ?? '';
  $('#avMe').innerHTML = esc(ini(HOME.me.full_name));
  $('#avMe').style.background = `hsl(${hue(HOME.me.full_name)} 34% 42%)`;
  $('#avMe').onclick = openMe;

  const sections = HOME.progress.sections;
  $('#rail').innerHTML = sections.map(s =>
    `<button class="seg ${s.pct === 0 ? 'zero' : ''}" title="${esc(s.title)}" onclick="location.hash='#/bai'">
      <i style="width:${s.pct}%"></i></button>`).join('');
  $('#pAll').textContent = HOME.progress.overall_pct + '%';
  $('#pOwn').innerHTML = HOME.progress.mine_count
    ? `Bạn giữ <b class="num">${HOME.progress.mine_count}</b> phần`
    : `<span style="color:var(--due)">Bạn chưa nhận phần nào</span>`;

  if (HOME.cohort?.defense_on) {
    const days = Math.ceil((new Date(HOME.cohort.defense_on) - new Date()) / 86400000);
    $('#cdN').textContent = days > 0 ? days : 0;
  }
}

/* ─── Hôm nay ─── */
function drawNay() {
  const a = HOME.action;
  const targetHash = { profile: null, plan: '#/bai', fund: '#/quy', insight: '#/bai' }[a.target];
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
        ${iAmOfficer() ? `<button class="ico" data-role="${role}" data-label="${esc(label)}">✎</button>` : ''}
      </div>`;
    }).join('')}</div>
  </div>
  <div class="sect">
    <div class="eb">Đang diễn ra</div>
    <div class="card"><div class="cb" style="padding:4px 16px">
      ${HOME.feed.length ? HOME.feed.map(f => `<div class="fd">${avatar(f.actor_name)}
          <div class="x"><b>${esc(short(f.actor_name))}</b> ${esc(f.summary)}</div>
          <span class="t">${new Date(f.created_at).toLocaleDateString('vi-VN')}</span></div>`).join('')
        : '<div class="cb mut">Chưa có hoạt động nào.</div>'}
    </div></div>
  </div>`;

  $('#heroCta').onclick = () => {
    if (a.target === 'profile') openMemberEdit(HOME.me.id);
    else if (targetHash) location.hash = targetHash;
  };
  document.querySelectorAll('#v-nay .ico[data-role]').forEach(btn => {
    btn.onclick = () => openOfficerEdit(btn.dataset.role, btn.dataset.label);
  });
}

/* ─── Nhóm ─── */
let MEMBERS_CACHE = [];
async function drawNhom() {
  $('#v-nhom').innerHTML = `<div class="foot" style="padding:0 2px 16px">Đang tải…</div>`;
  const { members } = await apiGet('/api/members');
  MEMBERS_CACHE = members;
  $('#v-nhom').innerHTML = `
  <div class="foot" style="padding:0 2px 16px">
    Hồ sơ lấy từ danh sách Ban tổ chức, có chỗ sai và có chỗ đã cũ.
    <b style="color:var(--ink)">Ai cũng tự sửa được hồ sơ của mình</b> — không cần xin ai.
  </div>
  <div class="eb">Thành viên <span class="c">${members.filter(m => m.claimed).length}/${members.length}</span></div>
  <div class="card">
    ${members.map(m => {
      const f = m.profile_filled;
      return `<button class="mrow" data-toggle="${m.id}">
        ${avatar(m.full_name)}
        <div class="b"><div class="nm">${esc(m.full_name)}</div>
          <div class="co">${esc(m.title || '')}${m.title && m.company ? ' · ' : ''}${esc(m.company || '')}</div></div>
        <span class="ring ${f === 4 ? 'full' : 'part'}">${f === 4 ? '✓' : f}</span>
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
        <button class="wide" style="padding:11px;font-size:14px" data-edit="${m.id}">
          ${m.id === HOME.me.id ? 'Sửa hồ sơ của tôi' : 'Sửa giúp — rồi báo lại chính chủ'}</button>
      </div>`;
    }).join('')}
  </div>`;

  document.querySelectorAll('#v-nhom [data-toggle]').forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.toggle, panel = $('#pan' + id), was = panel.classList.contains('on');
      document.querySelectorAll('#v-nhom .pan').forEach(p => p.classList.remove('on'));
      if (!was) panel.classList.add('on');
    };
  });
  document.querySelectorAll('#v-nhom [data-edit]').forEach(btn => {
    btn.onclick = () => openMemberEdit(Number(btn.dataset.edit));
  });
}

function openMemberEdit(id) {
  const m = MEMBERS_CACHE.find(x => x.id === id) || { id, ...HOME.me, profile: {} };
  const own = id === HOME.me.id;
  openSheet(`
   <h3>${esc(m.full_name)}</h3>
   <p class="sub">${own ? 'Ban tổ chức ghi có chỗ sai thì sửa thẳng ở đây, không cần xin ai.'
                        : 'Bạn đang sửa hộ. Sửa xong nhớ nhắn cho chính chủ một câu.'}</p>
   <label class="f">Điện thoại</label><input id="eP" value="${esc(m.phone)}" placeholder="09xx xxx xxx" inputmode="tel">
   <label class="f">Chức vụ</label><input id="eT" value="${esc(m.title)}">
   <label class="f">Đơn vị</label><input id="eC" value="${esc(m.company)}">
   <label class="f">Bán gì</label><input id="eA" value="${esc(m.profile?.sells_what)}" maxlength="80">
   <label class="f">Bán cho ai</label><input id="eB" value="${esc(m.profile?.sells_to)}" maxlength="80">
   <label class="f">Cần gì ở nhóm</label><input id="eD" value="${esc(m.profile?.needs)}" maxlength="80">
   <label class="f">Giúp được gì cho nhóm</label><input id="eE" value="${esc(m.profile?.offers)}" maxlength="80">
   <div class="sa"><button class="big c" id="eCancel">Thôi</button>
     <button class="big go" id="eSave">Lưu</button></div>`);
  $('#eCancel').onclick = closeSheet;
  $('#eSave').onclick = async () => {
    $('#eSave').disabled = true; $('#eSave').textContent = 'Đang lưu…';
    try {
      await apiPatch(`/api/members/${id}`, { title: $('#eT').value, company: $('#eC').value, phone: $('#eP').value });
      await apiPut(`/api/members/${id}/profile`, {
        sells_what: $('#eA').value, sells_to: $('#eB').value, needs: $('#eD').value, offers: $('#eE').value,
      });
      closeSheet(); toast('Đã lưu');
      HOME = await apiGet('/api/home'); drawHead(); drawNay();
      if (!$('#v-nhom').classList.contains('on')) { /* nothing */ } else drawNhom();
    } catch (e) {
      toast('Không lưu được — thử lại');
      $('#eSave').disabled = false; $('#eSave').textContent = 'Lưu';
    }
  };
}

function openOfficerEdit(role, label) {
  openSheet(`
   <h3>${esc(label)}</h3>
   <p class="sub">Ghi vào đây kèm ghi chú nguồn, để không ai phải hỏi lại.</p>
   <label class="f">Là ai</label>
   <select id="oM"><option value="">— còn trống —</option>
     ${MEMBERS_CACHE.map(m => `<option value="${m.id}">${esc(m.full_name)}</option>`).join('')}</select>
   <label class="f">Ghi chú nguồn</label><input id="oN" placeholder="chốt trong buổi họp nhóm ngày…">
   <div class="sa"><button class="big c" id="oCancel">Thôi</button>
     <button class="big go" id="oSave">Ghi vào</button></div>`);
  $('#oCancel').onclick = closeSheet;
  $('#oSave').onclick = async () => {
    $('#oSave').disabled = true;
    try {
      const v = $('#oM').value;
      await apiPut('/api/officers', { role, member_id: v ? Number(v) : null, note: $('#oN').value });
      closeSheet(); toast('Đã cập nhật cơ cấu');
      HOME = await apiGet('/api/home'); drawHead(); drawNay();
    } catch (e) {
      toast('Không lưu được — thử lại'); $('#oSave').disabled = false;
    }
  };
}

/* ─── Kho ─── */
const KHO_FILTERS = [['all', 'Tất cả'], ['bai', 'Cho bài'], ['buoi', 'Theo buổi'], ['lop', 'Lớp K03']];
async function drawKho(tag) {
  $('#v-kho').innerHTML = `<div class="foot" style="padding:0 2px 14px">Đang tải…</div>`;
  const { links } = await apiGet(tag && tag !== 'all' ? `/api/links?tag=${tag}` : '/api/links');
  $('#v-kho').innerHTML = `
  <div class="foot" style="padding:0 2px 14px">
    Kho chỉ giữ đường dẫn. File vẫn nằm ở Drive của người làm ra nó — ứng dụng không chứa,
    không sao lưu, không đứng tên.
  </div>
  <div class="fl">${KHO_FILTERS.map(([k, l]) => `<button class="fc ${tag === k ? 'on' : ''}" data-tag="${k}">${l}</button>`).join('')}</div>
  <div class="card">${links.length ? links.map(r => r.url
      ? `<a class="rs" href="${esc(r.url)}" target="_blank" rel="noopener">
          <span class="ext">${esc(r.kind)}</span><div class="b"><div class="t">${esc(r.title)}</div>
          <div class="m">${new Date(r.created_at).toLocaleDateString('vi-VN')}</div></div><span style="color:var(--ink3)">↗</span></a>`
      : `<div class="rs" style="cursor:default"><span class="ext">${esc(r.kind)}</span>
          <div class="b"><div class="t">${esc(r.title)}</div><div class="m">chưa có đường dẫn — điền khi có</div></div></div>`
    ).join('') : '<div class="cb mut">Chưa có liên kết nào trong mục này.</div>'}</div>
  <button class="wide" style="margin-top:12px;background:transparent;color:var(--ink2);box-shadow:inset 0 0 0 1px var(--line2)" id="addLinkBtn">+ Gắn một liên kết</button>
  <div class="foot"></div>`;

  document.querySelectorAll('#v-kho [data-tag]').forEach(btn => { btn.onclick = () => drawKho(btn.dataset.tag); });
  $('#addLinkBtn').onclick = openLinkAdd;
}

function openLinkAdd() {
  openSheet(`
   <h3>Gắn liên kết</h3>
   <p class="sub">Chỉ dán đường dẫn https — file để nguyên chỗ cũ.</p>
   <label class="f">Đường dẫn</label><input id="lU" placeholder="https://…" inputmode="url">
   <label class="f">Gọi là gì</label><input id="lN" placeholder="Báo cáo thị trường FMCG 2025">
   <label class="f">Loại</label><select id="lK"><option>DRIVE</option><option>SHEET</option><option>DOCX</option><option>PDF</option><option>WEB</option></select>
   <label class="f">Dùng cho</label><select id="lT"><option value="bai">Cho bài</option><option value="buoi">Theo buổi</option><option value="lop">Lớp K03</option></select>
   <div id="lErr" class="errline" style="display:none"></div>
   <div class="sa"><button class="big c" id="lCancel">Thôi</button>
     <button class="big go" id="lSave">Gắn vào</button></div>`);
  $('#lCancel').onclick = closeSheet;
  $('#lSave').onclick = async () => {
    const url = $('#lU').value.trim();
    if (!/^https:\/\//i.test(url)) {
      $('#lErr').textContent = 'Cần đường dẫn bắt đầu bằng https://'; $('#lErr').style.display = 'block'; return;
    }
    $('#lSave').disabled = true;
    try {
      await apiPost('/api/links', { url, title: $('#lN').value.trim(), kind: $('#lK').value, tag: $('#lT').value });
      closeSheet(); toast('Đã gắn vào Kho'); drawKho('all');
    } catch (e) {
      $('#lErr').textContent = 'Không gắn được — thử lại.'; $('#lErr').style.display = 'block'; $('#lSave').disabled = false;
    }
  };
}

/* ─── Bài / Quỹ — chưa tới đợt, hiện tạm ─── */
function drawSoon(which) {
  const info = which === 'bai'
    ? { ic: '📋', h: 'Bài 8 phần đang lên Đợt 2', p: 'Gợi ý phân công, tiến độ và tâm đắc sẽ có ở Đợt 2 (hạn 4/9). Dùng tạm nhóm Zalo trong lúc chờ.' }
    : { ic: '💳', h: 'Quỹ đang lên Đợt 3', p: 'Mã QR theo đợt và tự khai sẽ có ở Đợt 3 (hạn 11/9), sau khi có đủ thông tin tài khoản người thu.' };
  $('#v-' + which).innerHTML = `<div class="soon"><div class="ic">${info.ic}</div><h3>${esc(info.h)}</h3><p>${esc(info.p)}</p></div>`;
}

/* ─── Tài khoản ─── */
function openMe() {
  openSheet(`
   ${avatar(HOME.me.full_name)}
   <h3 style="margin-top:12px">${esc(HOME.me.full_name)}</h3>
   <p class="sub">${esc(HOME.group?.label ?? '')} · Khoá K03</p>
   <div class="sa"><button class="big c" id="meClose">Đóng</button>
     <button class="big go" id="meLogout" style="background:var(--due)">Đăng xuất</button></div>`);
  $('#meClose').onclick = closeSheet;
  $('#meLogout').onclick = async () => {
    await apiPost('/api/auth/logout');
    closeSheet();
    HOME = null;
    renderNoSession();
  };
}

/* ═══════════ KHỞI ĐỘNG ═══════════ */
async function renderApp() {
  document.body.classList.remove('noapp');
  $('#root').innerHTML = shellHtml();
  ensureVeil();
  document.querySelectorAll('.nb').forEach(b => b.onclick = () => go(b.dataset.v));
  drawHead();
  drawNay();
  route();
}

async function boot() {
  const m = location.pathname.match(/^\/i\/([^/]+)\/?$/);
  if (m) return renderClaim(m[1]);

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
