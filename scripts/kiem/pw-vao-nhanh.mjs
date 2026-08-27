import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';
let hong = 0;
const ok = (t, d) => { console.log((d ? '  ✓ ' : '  ✗ ') + t); if (!d) hong++; };
const B = 'http://127.0.0.1:8787';
// RP_ID trong .dev.vars là "localhost", mà WebAuthn đòi rp.id khớp tên miền của
// origin. Gọi qua 127.0.0.1 thì trình duyệt ném SecurityError và passkey im lặng
// không đăng ký được. Phần giao diện dùng localhost.
const BL = 'http://localhost:8787';
const post = (p, body, ck) => fetch(B + p, {
  method: 'POST',
  headers: { 'content-type': 'application/json', ...(ck ? { cookie: `s=${ck}` } : {}) },
  body: JSON.stringify(body),
});
const get = (p, ck) => fetch(B + p, ck ? { headers: { cookie: `s=${ck}` } } : undefined);

// Người CÓ số, chưa ai nhận · Người KHÔNG có số
const CO = { rid: 68, ten: 'Nguyễn Thị Anh Lài', sdt: '0965133751' };
const CO2 = { rid: 67, ten: 'Phan Thị Thanh Nga', sdt: '0985981808' };
const KHONG = { rid: 8, ten: 'Nguyễn Thanh Bình' };

console.log('── Cờ "có số" ở bước 1 khớp khít luật của máy chủ (cả 134 người) ──');
const that = JSON.parse(readFileSync(new URL("./coso.json", import.meta.url), "utf8"));
// Quét bằng nhiều truy vấn ngắn để phủ hết danh sách
const thay = new Map();
for (const q of ['nguyen', 'tran', 'le', 'pham', 'hoang', 'vu', 'dang', 'bui', 'do',
                 'ho', 'ngo', 'duong', 'ly', 'phan', 'vo', 'dinh', 'ta', 'luu', 'mai', 'cao']) {
  const r = await get('/api/wizard/roster/search?q=' + encodeURIComponent(q));
  if (!r.ok) continue;
  for (const p of (await r.json()).people) thay.set(String(p.roster_id), p.co_so_doi_chieu ? 1 : 0);
}
const lech = [...thay].filter(([id, v]) => that[id] !== v);
ok(`quét được ${thay.size}/134 người`, thay.size >= 100);
ok(`không ai lệch giữa cờ và luật đối chiếu (${lech.length} lệch)`, lech.length === 0);
ok('KHÔNG trả số điện thoại ra đường công khai', !(await (await get(
  '/api/wizard/roster/search?q=nguyen')).text()).includes('0965'));

console.log('── Cờ dự đoán đúng kết quả THẬT của /api/onboard/check ──');
for (const [nhan, rid, mongCoSo] of [['có số', CO.rid, true], ['không số', KHONG.rid, false]]) {
  const r = await post('/api/onboard/check', { roster_id: rid, phone: '0900000000' });
  const d = await r.json().catch(() => ({}));
  const thieu = d.error === 'phone_missing_in_roster';
  ok(`${nhan}: check ${thieu ? 'báo thiếu số' : 'không báo thiếu số'} — khớp cờ`, thieu === !mongCoSo);
}

console.log('── Vào thẳng: số đúng là có phiên, không cần mã ──');
const r1 = await post('/api/onboard/vao', { roster_id: CO.rid, phone: CO.sdt, email: 'lai.thu@congty.vn' });
ok(`mã ${r1.status} (200)`, r1.status === 200);
const ck1 = (r1.headers.get('set-cookie') || '').match(/s=([^;]+)/)?.[1];
ok('có cookie phiên', !!ck1);
const home = await (await get('/api/home', ck1)).json();
ok(`phiên dùng được, vào với tên "${home.me?.full_name}"`, home.me?.full_name === CO.ten);
ok('đã đánh dấu nhận hồ sơ', home.me?.da_nhan_ho_so === true);
ok('email CHƯA kiểm chứng (đúng: lần đầu không cần mã)', home.me?.email_verified === false);

console.log('── Passkey mở được ngay, không đòi kiểm chứng email ──');
const pk = await post('/api/passkey/register/options', {}, ck1);
ok(`register/options trả ${pk.status} (200, trước đây là 403)`, pk.status === 200);

console.log('── CHỐT CHẶN: nhận rồi thì số điện thoại hết tác dụng ──');
const r2 = await post('/api/onboard/vao', { roster_id: CO.rid, phone: CO.sdt, email: 'ke.khac@x.vn' });
ok(`gọi lại → ${r2.status} 409 da_nhan_cho`,
   r2.status === 409 && (await r2.json()).error === 'da_nhan_cho');
const r3 = await post('/api/onboard/vao', { roster_id: CO2.rid, phone: '0900000001', email: 'a@b.vn' });
ok(`số sai → ${r3.status}, KHÔNG vào được`, r3.status >= 400);
const r4 = await post('/api/onboard/vao', { roster_id: KHONG.rid, phone: '0912345678', email: 'a@b.vn' });
ok(`người chưa có số → ${r4.status} phone_missing_in_roster`,
   (await r4.json()).error === 'phone_missing_in_roster');

console.log('── Đường dự phòng vẫn còn ──');
const r5 = await post('/api/auth/otp', { email: 'lai.thu@congty.vn' });
const d5 = await r5.json().catch(() => ({}));
// Sandbox không có máy chủ thư, nên 502 mail_send_failed là ĐÚNG: nó chứng tỏ
// route chạy hết đường tới bước gửi. Đòi 2xx ở đây là đòi thứ môi trường này
// không làm được, và sẽ phải nới ra — nới rồi thì phép kiểm hết răng.
ok(`/api/auth/otp chạy hết tới bước gửi (${r5.status} ${d5.error ?? 'ok'})`,
   r5.status === 200 || d5.error === 'mail_send_failed');
ok('/api/onboard/start vẫn còn route',
   (await post('/api/onboard/start', { roster_id: CO2.rid, phone: CO2.sdt, email: 'nga@x.vn' })).status !== 404);

console.log('── Giao diện ──');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });

// (a) Người KHÔNG có số: chặn ngay sau khi chọn tên
const ca = await b.newContext({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 2 });
const pa = await ca.newPage(); const loiA = []; pa.on('pageerror', e => loiA.push(e.message));
await pa.goto(BL + '/vao'); await pa.waitForTimeout(1200);
ok('màn /vao thật sự nạp được', await pa.locator('#vTen').count() === 1);
await pa.fill('#vTen', 'thanh binh'); await pa.waitForTimeout(1200);
await pa.locator('[data-rid]').first().click(); await pa.waitForTimeout(600);
const vbA = await pa.locator('body').innerText();
ok('không lỗi JS: ' + (loiA.join(' | ') || 'sạch'), loiA.length === 0);
ok('KHÔNG hiện ô số điện thoại', await pa.locator('#vSdt').count() === 0);
ok('hiện màn xin link đăng nhập', /xin link đăng nhập/i.test(vbA));
ok('nhắc liên hệ Ban cán sự lớp', /Ban cán sự lớp/i.test(vbA));
ok('viết đủ chữ, không dùng "BCS" (N7)', !/\bBCS\b/.test(vbA));
await pa.screenshot({ path: 'vao-thieu-so.png', fullPage: true });

// (b) Người CÓ số: đi hết luồng, không có bước nhập mã
const cb = await b.newContext({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 2 });
const pb = await cb.newPage(); const loiB = []; pb.on('pageerror', e => loiB.push(e.message));
// bật virtual authenticator để bấm nút passkey được thật
const cdp = await cb.newCDPSession(pb);
await cdp.send('WebAuthn.enable');
const { authenticatorId } = await cdp.send('WebAuthn.addVirtualAuthenticator', {
  options: { protocol: 'ctap2', transport: 'internal', hasResidentKey: true,
             hasUserVerification: true, isUserVerified: true, automaticPresenceSimulation: true },
});
await pb.goto(BL + '/vao'); await pb.waitForTimeout(1200);
await pb.fill('#vTen', 'thanh nga'); await pb.waitForTimeout(1200);
await pb.locator('[data-rid]').first().click(); await pb.waitForTimeout(500);
ok('người có số thì hiện ô số điện thoại', await pb.locator('#vSdt').count() === 1);
await pb.fill('#vSdt', CO2.sdt); await pb.click('#vOk'); await pb.waitForTimeout(1200);
ok('sang bước email', await pb.locator('#vEmail').count() === 1);
ok('nút ghi "Vào ứng dụng", không phải "Gửi mã"',
   (await pb.locator('#vGui').innerText()).includes('Vào ứng dụng'));
await pb.fill('#vEmail', 'nga.pt@congty.vn'); await pb.click('#vGui'); await pb.waitForTimeout(1800);
const vbB = await pb.locator('body').innerText();
ok('KHÔNG có bước nhập mã 6 số', !/mã 6 số|nhập mã/i.test(vbB));
ok('vào thẳng màn "Xong rồi"', /Xong rồi/i.test(vbB));
ok('nhắc lại email vừa khai để soát', vbB.includes('nga.pt@congty.vn'));
ok('có nút đặt passkey', await pb.locator('#vPk').count() === 1);
await pb.screenshot({ path: 'vao-xong.png', fullPage: true });

// (c) Bấm đặt passkey thật.
//
// GIỚI HẠN CỦA MÔI TRƯỜNG, KHÔNG PHẢI CỦA SẢN PHẨM: `wrangler dev` có mục
// `routes` trong wrangler.toml nên nó báo request.url mang hostname
// PRODUCTION, trong khi trình duyệt đang ở localhost. verifyRegistrationResponse
// so hai thứ ấy và từ chối:
//   Unexpected registration response origin "http://localhost:8787",
//   expected "http://k3vaceo.cuongngo.app"
// Nên bước /api/passkey/register/verify KHÔNG chạy được ở đây, dù đổi host kiểu
// gì. Trên tên miền thật hai bên trùng nhau. Vì vậy chỉ khẳng định phần kiểm
// được: trình duyệt có TẠO khoá thật, và bấm xong thì rời màn /vao chứ không
// kẹt lại ở nút đã bấm.
const canh = [];
pb.on('console', m => { if (m.type() === 'error') canh.push(m.text()); });
await pb.click('#vPk'); await pb.waitForTimeout(4000);
const creds = await cdp.send('WebAuthn.getCredentials', { authenticatorId });
ok(`trình duyệt tạo khoá thật (${creds.credentials.length})`, creds.credentials.length === 1);
ok(`bấm xong thì rời màn /vao (nay ở ${new URL(pb.url()).pathname})`,
   new URL(pb.url()).pathname === '/');
ok('kể cả khi verify hỏng cũng KHÔNG kẹt lại ở nút "Đang đặt…"',
   await pb.locator('#vPk').count() === 0);
ok('không lỗi JS: ' + (loiB.join(' | ') || 'sạch'), loiB.length === 0);

// Phiên do đường mới cấp có dựng được ứng dụng không — hỏi tách riêng, khỏi
// dính vào chuyện passkey ở trên.
const cc = await b.newContext({ viewport: { width: 390, height: 900 } });
await cc.addCookies([{ name: 's', value: ck1, domain: 'localhost', path: '/' }]);
const pc = await cc.newPage();
await pc.goto(BL + '/'); await pc.waitForTimeout(2500);
ok('phiên từ /api/onboard/vao dựng được ứng dụng',
   await pc.locator('.nb[data-v="nay"]').count() === 1);
await pc.screenshot({ path: 'vao-vao-app.png' });
await b.close();

console.log(hong ? `\n${hong} HỎNG` : '\nĐÚNG HẾT');
process.exit(hong ? 1 : 0);
