// POST /api/totnghiep/anh — năm chốt chặn đứng TRƯỚC lượt gọi ra Drive.
//
// Chạy:  bash scripts/kiem/reset-totnghiep.sh && node scripts/kiem/kiem-anh-route.mjs
//
// ══ ĐIỀU BỘ KIỂM NÀY KHÔNG CHỨNG MINH ĐƯỢC, NÓI THẲNG ════════════════════
// Sandbox không ra được internet, nên KHÔNG một tệp nào từng tới Drive từ đây.
// Bộ kiểm chứng minh được mọi thứ đứng TRƯỚC lượt gọi ấy, cộng nhánh HỎNG của
// chính nó (`.dev.vars` trỏ GOOGLE_BASE_URL vào cổng đóng 2527 nên lượt gọi
// hỏng NGAY thay vì treo — xem chú thích trong lib/drive.js).
//
// Bằng chứng duy nhất đáng tin vẫn là mở thư mục Drive và thấy ảnh ở đó —
// đúng bài học của đường gửi thư ngày 24/8: "thư nằm trong hộp thư, không
// phải một dòng log nói rằng nó đã đi".

import { readFileSync } from 'node:fs';

let hong = 0;
const ok = (t, d) => { console.log((d ? '  ✓ ' : '  ✗ ') + t); if (!d) hong++; };
const B = 'http://127.0.0.1:8787';
const IP = { 'cf-connecting-ip': '203.0.113.99' };
const ckCuong = 's=tk-tn-cuong';

const dung = (...b) => { const u = new Uint8Array(64); u.set(b.flat(), 0); return u; };
const chu = s => [...s].map(c => c.charCodeAt(0));
const JPEG = dung([0xff, 0xd8, 0xff, 0xe0], chu('JFIF'));

const gui = (loai, bytes, ck = ckCuong, mime = 'image/jpeg') =>
  fetch(`${B}/api/totnghiep/anh?loai=${loai}`, {
    method: 'POST',
    headers: { ...(ck ? { cookie: ck } : {}), 'content-type': mime, ...IP },
    body: bytes,
  });

console.log('── Máy chủ có thật sự chạy không ──');
const health = await fetch(B + '/api/health').then(r => r.json()).catch(() => ({}));
ok(`/api/health trả roster_total = ${health.roster_total} (≥ 134)`, health.roster_total >= 134);

/* PHÉP QUAN TRỌNG NHẤT CỦA CẢ BỘ. Ranh giới công khai/cần-phiên trong
   index.js là VỊ TRÍ DÒNG chứ không phải một cờ nào. Đường này NHẬN TỆP, nên
   đẩy nhầm nó lên nửa trên là ai cũng đổ được tệp vào Drive của Ban tổ chức —
   một lỗ hổng nặng hơn hẳn mọi route đọc. */
console.log('\n── Chốt 1: không cookie thì phải 401 ──');
const rKhongPhien = await gui('anh', JPEG, null);
ok(`không cookie → 401 (nhận ${rKhongPhien.status})`, rKhongPhien.status === 401);

console.log('\n── Loại ảnh phải nằm trong danh sách ──');
const rLoaiLa = await gui('anh-bia-dat', JPEG);
ok(`loai lạ → 422 (nhận ${rLoaiLa.status})`, rLoaiLa.status === 422);
const rThieuLoai = await fetch(`${B}/api/totnghiep/anh`, {
  method: 'POST', headers: { cookie: ckCuong, 'content-type': 'image/jpeg', ...IP }, body: JPEG,
});
ok(`thiếu loai → 422 (nhận ${rThieuLoai.status})`, rThieuLoai.status === 422);

console.log('\n── Chốt 4: magic bytes, KHÔNG tin content-type ──');
// Phép có RĂNG: khai content-type: image/jpeg cho một tệp chạy Windows. Chỉ
// magic bytes chặn được — đổi tên tệp và sửa header là chuyện một dòng.
const exe = dung([0x4d, 0x5a, 0x90, 0x00]);
const rExe = await gui('anh', exe);
const bExe = await rExe.json().catch(() => ({}));
ok(`tệp .exe khai là image/jpeg → 422 (nhận ${rExe.status})`, rExe.status === 422);
ok('mã lỗi là anh_sai_dinh_dang', bExe.error === 'anh_sai_dinh_dang');

// HEIC là ca sẽ gặp NHIỀU NHẤT ngoài đời (định dạng mặc định của iPhone), nên
// câu trả lời phải nói được PHẢI LÀM GÌ chứ không chỉ "không hợp lệ".
const heic = dung([0, 0, 0, 0x18], chu('ftyp'), chu('heic'));
const bHeic = await gui('anh', heic).then(r => r.json()).catch(() => ({}));
ok('HEIC bị chặn và gắn đúng nhãn', bHeic.la === 'heic');
ok('HEIC kèm câu chỉ cách chữa cho người dùng iPhone', /iPhone/i.test(bHeic.goi_y ?? ''));

const rRong = await gui('anh', new Uint8Array(0));
ok(`tệp rỗng → 422 (nhận ${rRong.status})`, rRong.status === 422);

console.log('\n── Chốt 3: kích thước ──');
const to = new Uint8Array(2 * 1024 * 1024 + 1024);
to.set([0xff, 0xd8, 0xff, 0xe0], 0);
const rTo = await gui('anh', to);
ok(`tệp > 2MB → 413 (nhận ${rTo.status})`, rTo.status === 413);

/* Nhánh HỎNG của chính đường Drive. `.dev.vars` trỏ GOOGLE_BASE_URL vào cổng
   ĐÓNG 2527 nên lượt gọi hỏng ngay — đó là cả điểm của việc trỏ vào cổng
   đóng thay vì để nó đi ra googleapis.com và TREO.

   Phép này canh thứ quý nhất khi log Worker câm: `hong_o_buoc`. Mất nó thì
   ảnh hỏng trên tên miền thật chỉ còn "Không xong, thử lại" — và học viên
   không nói lại được gì cho tôi. */
console.log('\n── Ảnh HỢP LỆ đi tới bước gọi Drive, và báo đúng bước hỏng ──');
const rThat = await gui('anh', JPEG);
const bThat = await rThat.json().catch(() => ({}));
if (rThat.status === 503) {
  ok('CHƯA cấu hình khoá Drive → 503, không phải 500', bThat.error === 'drive_chua_cau_hinh');
  console.log('    (đặt GOOGLE_CLIENT_ID/SECRET/REFRESH_TOKEN trong .dev.vars để kiểm tiếp nhánh gọi)');
} else {
  ok(`qua hết bốn chốt, tới lượt gọi Drive rồi hỏng → 502 (nhận ${rThat.status})`,
     rThat.status === 502);
  ok(`phúc đáp mang hong_o_buoc = "${bThat.hong_o_buoc}"`, !!bThat.hong_o_buoc);
  // Cổng đóng thì phải hỏng ở bước LẤY TOKEN — subrequest đầu tiên. Báo
  // 'tai_len' ở đây nghĩa là thứ tự các bước trong lib/drive.js đã lệch.
  ok('hỏng đúng ở bước lấy token (subrequest ĐẦU TIÊN), không phải bước tải lên',
     bThat.hong_o_buoc === 'lay_token' || bThat.hong_o_buoc === 'qua_lau');
  ok('KHÔNG lộ một mẩu nào của khoá trong phúc đáp',
     !/GOCSPX|1\/\/0|refresh_token=/.test(JSON.stringify(bThat)));
}

/* Cấu hình bản THẬT phải để trống GOOGLE_BASE_URL. Đặt nhầm nó vào
   wrangler.toml là mọi lượt tải lên trên tên miền đi về một cổng loopback
   không tồn tại — và triệu chứng là "ảnh nào gửi cũng hỏng" mà không ai nghĩ
   tới một dòng cấu hình. Cùng phép canh đã có cho LLM_BASE_URL. */
console.log('\n── Bản thật KHÔNG được ghim GOOGLE_BASE_URL ──');
const toml = readFileSync(new URL('../../worker/wrangler.toml', import.meta.url), 'utf8');
const dong = toml.split('\n').filter(l => /^\s*GOOGLE_BASE_URL\s*=/.test(l));
ok(`wrangler.toml không đặt GOOGLE_BASE_URL (thấy ${dong.length} dòng)`, dong.length === 0);

console.log(hong === 0 ? '\n✅ TẤT CẢ ĐỀU XANH' : `\n❌ ${hong} phép ĐỎ`);
process.exit(hong === 0 ? 0 : 1);
