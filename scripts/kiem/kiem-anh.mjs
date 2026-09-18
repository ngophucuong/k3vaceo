// Soi ảnh + nối thân multipart — worker/src/lib/anh.js.
//
// CHẠY THẲNG, KHÔNG CẦN MÁY CHỦ: node scripts/kiem/kiem-anh.mjs
//
// Đây là phần DUY NHẤT của đường Google Drive mà sandbox chứng minh được.
// Sandbox không ra được internet nên không lượt tải lên THẬT nào chạy được ở
// đây — nhưng mọi thứ đứng TRƯỚC lượt gọi ấy thì kiểm được, và ba trong số
// chúng là những chỗ mà Drive VẪN TRẢ HTTP 200 khi làm sai:
//
//   · dựng thân bằng chuỗi mẫu → ảnh đi qua UTF-16 và hỏng, Drive vẫn 200
//   · thiếu tiền tố /upload/   → 200, tên đúng, nội dung 0 byte
//   · thiếu fields=…           → webViewLink lặng lẽ undefined
//
// Phép số 3 dưới đây canh cái thứ nhất — cái duy nhất nằm trong mã của ta.

import { doanLoaiAnh, thanMultipart, TOI_DA_BYTE } from '../../worker/src/lib/anh.js';

let hong = 0;
const ok = (t, d) => { console.log((d ? '  ✓ ' : '  ✗ ') + t); if (!d) hong++; };

// Dựng header của từng định dạng rồi đệm cho đủ dài — chỉ cần 12 byte đầu.
const dung = (...bytes) => {
  const b = new Uint8Array(64);
  b.set(bytes.flat(), 0);
  return b;
};
const chu = s => [...s].map(c => c.charCodeAt(0));

console.log('── Nhận đúng hai định dạng, và CHỈ hai ──');
const jpeg = dung([0xff, 0xd8, 0xff, 0xe0], chu('JFIF'));
const png = dung([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
ok('JPEG → image/jpeg', doanLoaiAnh(jpeg).ok && doanLoaiAnh(jpeg).mime === 'image/jpeg');
ok('JPEG → đuôi jpg', doanLoaiAnh(jpeg).duoi === 'jpg');
ok('PNG → image/png', doanLoaiAnh(png).ok && doanLoaiAnh(png).mime === 'image/png');

// PNG bị một đường truyền nào đó "sửa" CRLF thành LF: bốn byte đầu vẫn đúng,
// nên phép kiểm chỉ soi bốn byte sẽ nhận nhầm một tệp đã hỏng.
const pngHong = dung([0x89, 0x50, 0x4e, 0x47, 0x0a, 0x1a, 0x0a]);
ok('PNG mất byte 0x0D (CRLF bị nuốt) → TỪ CHỐI, không nhận nhầm', !doanLoaiAnh(pngHong).ok);

console.log('\n── Từ chối phần còn lại, và nói được PHẢI LÀM GÌ ──');
// HEIC là ca sẽ gặp NHIỀU NHẤT: định dạng mặc định của iPhone, mà lớp này
// phần lớn dùng iPhone. "Tệp không hợp lệ" thì họ không biết làm gì tiếp.
const heic = dung([0, 0, 0, 0x18], chu('ftyp'), chu('heic'));
const rHeic = doanLoaiAnh(heic);
ok('HEIC bị từ chối', !rHeic.ok && rHeic.la === 'heic');
ok('HEIC nói rõ đây là ảnh iPhone', /iPhone/i.test(rHeic.goi_y));
ok('HEIC chỉ được cách chữa cụ thể (Sao chép ảnh / đổi Cài đặt)',
   /sao chép/i.test(rHeic.goi_y) && /cài đặt/i.test(rHeic.goi_y));

const cac = [
  ['AVIF', dung([0, 0, 0, 0x18], chu('ftyp'), chu('avif')), 'avif'],
  ['WebP', dung(chu('RIFF'), [0, 0, 0, 0], chu('WEBP')), 'webp'],
  ['PDF', dung(chu('%PDF-1.7')), 'pdf'],
  ['GIF', dung(chu('GIF89a')), 'gif'],
  ['ZIP/docx', dung([0x50, 0x4b, 0x03, 0x04]), 'zip'],
];
for (const [ten, b, la] of cac) {
  const r = doanLoaiAnh(b);
  ok(`${ten} bị từ chối, gắn đúng nhãn "${la}"`, !r.ok && r.la === la);
  ok(`${ten} có câu gợi ý cho người dùng`, typeof r.goi_y === 'string' && r.goi_y.length > 10);
}

// PHÉP CÓ RĂNG của cả hàm: đổi tên một tệp .exe thành .jpg và khai
// content-type: image/jpeg là chuyện một dòng. Chỉ magic bytes chặn được.
const exe = dung([0x4d, 0x5a, 0x90, 0x00]);       // 'MZ' — tệp chạy của Windows
ok('tệp .exe đội lốt ảnh bị chặn (magic bytes, không tin phần mở rộng)',
   !doanLoaiAnh(exe).ok && doanLoaiAnh(exe).la === 'khong_ro');
ok('tệp rỗng bị chặn', !doanLoaiAnh(new Uint8Array(0)).ok);
ok('tệp ngắn hơn 12 byte bị chặn', !doanLoaiAnh(new Uint8Array(5)).ok);

console.log('\n── Thân multipart nối ở mức BYTE, không qua chuỗi ──');
// Byte ≥ 0x80 là chỗ chết. Dựng thân bằng chuỗi mẫu thì JavaScript đưa chúng
// qua UTF-16 và thay bằng ký tự thay thế (0xEF 0xBF 0xBD) — ảnh hỏng, mà
// Drive vẫn nhận và vẫn trả 200 kèm một tệp mở ra là vỡ.
const doc = new Uint8Array([0xff, 0xd8, 0xff, 0x80, 0x00, 0xfe, 0x7f, 0x81]);
const than = thanMultipart({ name: 'a.jpg' }, 'image/jpeg', doc, 'RANH');
ok('thân trả về là Uint8Array', than instanceof Uint8Array);

// Tìm lại đúng tám byte gốc trong thân, so TỪNG BYTE.
const tim = (hay, kim) => {
  ngoai: for (let i = 0; i + kim.length <= hay.length; i++) {
    for (let j = 0; j < kim.length; j++) if (hay[i + j] !== kim[j]) continue ngoai;
    return i;
  }
  return -1;
};
const viTri = tim(than, doc);
ok(`tám byte nhị phân còn NGUYÊN VẸN trong thân (ở vị trí ${viTri})`, viTri >= 0);

// Phép ĐỐI CHỨNG: chứng minh cách SAI thật sự làm hỏng, chứ không chỉ nói là
// sai. Không có dòng này thì phép trên xanh cả với một bản vá cẩu thả.
const cachSai = new TextEncoder().encode(
  `--RANH\r\nContent-Type: image/jpeg\r\n\r\n${String.fromCharCode(...doc)}\r\n--RANH--\r\n`
);
ok('đối chứng: dựng bằng chuỗi mẫu thì tám byte ấy KHÔNG còn nguyên',
   tim(cachSai, doc) === -1);

const vb = new TextDecoder().decode(than);
ok('ranh giới dùng CRLF, không phải LF', /\r\n--RANH--\r\n$/.test(vb));
ok('có khối JSON siêu dữ liệu đứng trước', vb.startsWith('--RANH\r\nContent-Type: application/json'));
ok('siêu dữ liệu mang đúng tên tệp', vb.includes('"name":"a.jpg"'));
ok('có khai content-type của ảnh', vb.includes('Content-Type: image/jpeg'));

// parents chỉ có mặt khi được truyền vào — thiếu nó thì tệp rơi vào thư mục
// gốc của Drive thay vì thư mục của lớp, và Ban tổ chức phải đi tìm.
const coCha = new TextDecoder().decode(
  thanMultipart({ name: 'a.jpg', parents: ['THUMUC'] }, 'image/jpeg', doc, 'R'));
ok('có parents thì thân mang id thư mục', coCha.includes('"parents":["THUMUC"]'));

console.log('\n── Trần kích thước ──');
ok(`TOI_DA_BYTE = 2MB (${TOI_DA_BYTE})`, TOI_DA_BYTE === 2 * 1024 * 1024);

console.log(hong === 0 ? '\n✅ TẤT CẢ ĐỀU XANH' : `\n❌ ${hong} phép ĐỎ`);
process.exit(hong === 0 ? 0 : 1);
