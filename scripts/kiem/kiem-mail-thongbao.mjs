// Thư khi có thông báo mới (migration 0031, routes/thong-bao-mail.js).
//
// Ngô Phú Cường yêu cầu 6/9: "một ứng dụng chết là có thông báo mới được đăng
// trên App nhưng không có notify đến". Đường đẩy đã dựng từ 28/8 nhưng đo trên
// D1 thật ngày 6/9 chỉ 2/146 người bật và chưa gói tin nào từng đi, nên thư
// mới là đường báo tin thật sự tới được người ta.
//
// BỐN PHÉP ĐỐI CHỨNG, mỗi cái ứng với một chỗ hỏng ngầm — không chỗ nào tự
// báo lỗi, chỉ có người kêu "sao tôi không nhận được thư":
//
//   1. MA TRẬN PHẠM VI phải TRÙNG KHÍT guiThongBaoDay() trong routes/push.js:
//      thông báo nhóm chỉ tới nhóm ấy, thông báo lớp mới tới cả khoá. Lệch một
//      chút là cùng một thông báo mà đường đẩy tới một nhóm người còn đường
//      thư tới nhóm khác.
//   2. KHÔNG GỬI NGƯỢC cho người vừa đăng. Đếm bằng cách so với chính D1 chứ
//      không tin con số API tự khai.
//   3. CÔNG TẮC CỦA CHÍNH CHỦ có tác dụng thật — tắt một người thì con số
//      giảm đúng MỘT. Phép này cần phiên thứ hai, vì không ai tắt hộ được (N5).
//   4. SỬA thông báo thì KHÔNG gửi thư lại. Cùng lý do đã áp cho thông báo
//      đẩy: sửa một dấu phẩy mà cả lớp nhận thư lần nữa thì lần sau họ tắt hết.
//
// Chạy:  bash scripts/kiem/reset-mail-thongbao.sh && node scripts/kiem/kiem-mail-thongbao.mjs

import { readFileSync } from 'node:fs';

let hong = 0;
const ok = (t, d) => { console.log((d ? '  ✓ ' : '  ✗ ') + t); if (!d) hong++; };
const B = 'http://127.0.0.1:8787';
const CK_A = 's=tk-cuong-mailtb';       // Ngô Phú Cường — trưởng Nhóm 6 + uỷ viên lớp
const CK_B = 's=tk-bandong-mailtb';     // một người khác cùng Nhóm 6

const post = (p, body, ck = CK_A) => fetch(B + p, {
  method: 'POST', headers: { 'content-type': 'application/json', cookie: ck }, body: JSON.stringify(body),
});
const patch = (p, body, ck = CK_A) => fetch(B + p, {
  method: 'PATCH', headers: { 'content-type': 'application/json', cookie: ck }, body: JSON.stringify(body),
});
const put = (p, body, ck = CK_A) => fetch(B + p, {
  method: 'PUT', headers: { 'content-type': 'application/json', cookie: ck }, body: JSON.stringify(body),
});
const get = (p, ck) => fetch(B + p, ck ? { headers: { cookie: ck } } : undefined);

// Mẫu số đọc thẳng từ D1 — con số ĐỘC LẬP với chính mã đang kiểm. Hỏi API
// "có bao nhiêu người nhận" rồi so với chính nó thì phép kiểm không có răng.
//
// Đọc từ TỆP chứ không gọi `wrangler d1 execute` tại chỗ: `wrangler dev` giữ
// khoá tệp SQLite từ lúc khởi động, nên chạm D1 giữa chừng sẽ cắt ngang kết
// nối HTTP đang mở và bộ kiểm chết với `UND_ERR_SOCKET: other side closed` —
// trông y hệt máy chủ sập. reset-mail-thongbao.sh đọc sẵn lúc server còn tắt.
const mau = JSON.parse(readFileSync(new URL('./mail-mau-so.json', import.meta.url), 'utf8'));

console.log('── Máy chủ có thật sự chạy không ──');
const health = await get('/api/health').then(r => r.json()).catch(() => ({}));
ok(`/api/health trả roster_total = ${health.roster_total} (≥ 134)`, health.roster_total >= 134);

const homeA = await get('/api/home', CK_A).then(r => r.json());
const homeB = await get('/api/home', CK_B).then(r => r.json());
ok(`phiên A là Ngô Phú Cường`, homeA?.me?.full_name === 'Ngô Phú Cường');
ok(`phiên B là người khác, cùng Nhóm 6 (${homeB?.me?.full_name ?? '—'})`,
   !!homeB?.me?.id && homeB.me.id !== homeA.me.id && homeB.me.group_id === homeA.me.group_id);

console.log('── /api/home phải nói trạng thái công tắc ──');
ok('me.mail_thong_bao = true (migration 0031 mặc định BẬT)', homeA?.me?.mail_thong_bao === true);

const idA = homeA.me.id;
const monNhom = mau.mon_nhom, monLop = mau.mon_lop, monLopKeCaMinh = mau.mon_lop_ke_ca_minh;
ok(`mẫu số đọc đúng hồ sơ của A (id ${mau.id_a})`, mau.id_a === idA);
console.log(`  (D1 nói: thông báo nhóm → ${monNhom} người, thông báo lớp → ${monLop} người)`);

console.log('── ĐỐI CHỨNG 1+2: ma trận phạm vi, và không gửi ngược người đăng ──');
const rNhom = await post('/api/thong-bao', { cap: 'nhom', noi_dung: 'KIEMMAIL_nhom6' });
const bNhom = await rNhom.json();
ok(`đăng thông báo NHÓM → mail.nguoi_nhan = ${bNhom?.mail?.nguoi_nhan} (D1 nói ${monNhom})`,
   rNhom.status === 200 && bNhom?.mail?.nguoi_nhan === monNhom);

const rLop = await post('/api/thong-bao', { cap: 'lop', noi_dung: 'KIEMMAIL_lop' });
const bLop = await rLop.json();
ok(`đăng thông báo LỚP → mail.nguoi_nhan = ${bLop?.mail?.nguoi_nhan} (D1 nói ${monLop})`,
   rLop.status === 200 && bLop?.mail?.nguoi_nhan === monLop);
// So hai con số API trả về với NHAU, không so hai con số D1 với nhau: hai
// mẫu số D1 lệch nhau là điều hiển nhiên và không mã nào làm nó sai được, nên
// so chúng là một phép kiểm không có răng.
ok(`lớp (${bLop?.mail?.nguoi_nhan}) nhiều hơn nhóm (${bNhom?.mail?.nguoi_nhan}) — hai cấp KHÔNG dùng chung một danh sách`,
   bLop?.mail?.nguoi_nhan > bNhom?.mail?.nguoi_nhan);

// Người đăng không có trong danh sách: nếu quên `m.id <> ?` thì cả hai con số
// trên đều tăng đúng 1, mà tự nhìn thì không thấy gì sai.
ok(`bỏ người đăng ra: ${monLop} = ${monLopKeCaMinh} − 1`, monLop === monLopKeCaMinh - 1);

console.log('── ĐỐI CHỨNG 3: công tắc của CHÍNH CHỦ, và nó có tác dụng thật ──');
const rTat = await put('/api/me/mail-thong-bao', { bat: false }, CK_B);
const bTat = await rTat.json();
ok(`người B tự tắt → 200, bat = false (nhận ${rTat.status})`, rTat.status === 200 && bTat.bat === false);

const homeB2 = await get('/api/home', CK_B).then(r => r.json());
ok('/api/home của B nay trả mail_thong_bao = false', homeB2?.me?.mail_thong_bao === false);
ok('công tắc của B KHÔNG đụng tới A', (await get('/api/home', CK_A).then(r => r.json()))?.me?.mail_thong_bao === true);

const rNhom2 = await post('/api/thong-bao', { cap: 'nhom', noi_dung: 'KIEMMAIL_nhom6_sau_khi_tat' });
const bNhom2 = await rNhom2.json();
ok(`B tắt rồi → thông báo nhóm còn ${bNhom2?.mail?.nguoi_nhan} người (trước là ${monNhom})`,
   bNhom2?.mail?.nguoi_nhan === monNhom - 1);

const rBat = await put('/api/me/mail-thong-bao', { bat: true }, CK_B);
ok('bật lại được', (await rBat.json())?.bat === true);
const rNhom3 = await post('/api/thong-bao', { cap: 'nhom', noi_dung: 'KIEMMAIL_nhom6_bat_lai' });
ok(`bật lại → về đúng ${monNhom} người`, (await rNhom3.json())?.mail?.nguoi_nhan === monNhom);

console.log('── ĐỐI CHỨNG 4: SỬA thông báo thì KHÔNG gửi thư lại ──');
const rSua = await patch(`/api/thong-bao/${bNhom.id}`, { noi_dung: 'KIEMMAIL_nhom6 đã sửa một dấu phẩy' });
const bSua = await rSua.json();
ok(`sửa được (nhận ${rSua.status})`, rSua.status === 200);
ok('phúc đáp KHÔNG có trường mail — không lượt gửi nào được kích hoạt', !('mail' in (bSua ?? {})));

console.log('── Công tắc phải dùng PHIÊN, không nhận id trong thân ──');
const rLa = await put('/api/me/mail-thong-bao', { bat: false, member_id: idA }, CK_B);
await rLa.json();
const homeA3 = await get('/api/home', CK_A).then(r => r.json());
ok('gửi kèm member_id của người khác cũng không tắt hộ được ai', homeA3?.me?.mail_thong_bao === true);
await put('/api/me/mail-thong-bao', { bat: true }, CK_B);

console.log('── Chưa đăng nhập thì không đụng được công tắc ──');
const rKhach = await fetch(B + '/api/me/mail-thong-bao', {
  method: 'PUT', headers: { 'content-type': 'application/json' }, body: '{"bat":false}',
});
ok(`không có phiên → 401 (nhận ${rKhach.status})`, rKhach.status === 401);

console.log(hong ? `\n${hong} phép KHÔNG đạt` : '\nĐạt hết');
process.exit(hong ? 1 : 0);
