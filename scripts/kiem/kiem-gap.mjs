// Kiểm riêng phép GẤP DÒNG của ics.js. Dữ liệu lịch thật không ép được nhánh
// này (điểm gấp tình cờ không rơi giữa ký tự nào), nên phải dựng chuỗi cố ý
// đẩy mốc 75 octet vào GIỮA một ký tự ba byte.
//
// Phép kiểm đúng KHÔNG phải là "giải mã UTF-8 có ném lỗi không" — TextDecoder
// không ném, nó lặng lẽ thay bằng ký tự thay thế U+FFFD. Phải mở gấp dòng ra
// rồi so từng ký tự với chuỗi gốc.
import { dungIcs } from '../../worker/src/lib/ics.js';

let hong = 0;
const ok = (t, d) => { console.log((d ? '  ✓ ' : '  ✗ ') + t); if (!d) hong++; };

function moGap(ics) {
  const ra = [];
  for (const d of ics.split('\r\n')) {
    if (d.startsWith(' ') && ra.length) ra[ra.length - 1] += d.slice(1);
    else if (d) ra.push(d);
  }
  return ra;
}

const enc = new TextEncoder();
let soLanEpDuoc = 0, sai = 0, coFFFD = 0, quaDai = 0;

// Quét mọi độ dài đệm 0..40: với chữ 'ế' ba byte thì chắc chắn có những độ dài
// làm mốc 75 rơi vào byte thứ hai hoặc thứ ba của một ký tự.
for (let n = 0; n <= 40; n++) {
  const chuDe = 'x'.repeat(n) + 'ế'.repeat(30);
  const ics = dungIcs(
    [{ id: 1, ngay: '2026-08-27', tu_gio: '13:30', den_gio: '15:00', chu_de: chuDe, seq: 1 }],
    { code: 'K03', name: 'Khoá thử' }, '20260826T000000Z', 'thu.example');

  // 1. không dòng nào quá 75 octet
  for (const d of ics.split('\r\n')) if (enc.encode(d).length > 75) quaDai++;
  // 2. không có ký tự thay thế
  if (ics.includes('�')) coFFFD++;
  // 3. mở gấp dòng ra phải khôi phục ĐÚNG chuỗi gốc
  const sum = moGap(ics).find(d => d.startsWith('SUMMARY:'))?.slice(8);
  if (sum !== chuDe) sai++;

  // Có thật sự ép được vào giữa ký tự không? 'SUMMARY:' dài 8 byte; mốc cắt
  // đầu tiên ở byte 75, tức byte thứ 67 của phần chữ. Với n byte 'x' rồi 'ế'
  // ba byte một, cắt rơi giữa ký tự khi (67 - n) không chia hết cho 3.
  if (n < 67 && (67 - n) % 3 !== 0) soLanEpDuoc++;
}

console.log(`── Gấp dòng: quét 41 độ dài, ${soLanEpDuoc} lần điểm gấp rơi GIỮA ký tự ──`);
ok('không dòng nào quá 75 octet', quaDai === 0);
ok('không sinh ra ký tự thay thế U+FFFD', coFFFD === 0);
ok('mở gấp dòng ra khôi phục đúng chuỗi gốc, không sai một ký tự', sai === 0);
ok('phép kiểm có ép được vào nhánh cắt-giữa-ký-tự', soLanEpDuoc > 20);

console.log('── Thoát ký tự ──');
const ics2 = dungIcs(
  [{ id: 9, ngay: '2026-08-27', chu_de: 'Thuế; rủi ro, và \\ chuyện khác', seq: 1 }],
  { code: 'K03' }, '20260826T000000Z', 'thu.example');
const s2 = moGap(ics2).find(d => d.startsWith('SUMMARY:')).slice(8);
ok('dấu chấm phẩy được thoát', s2.includes('\\;'));
ok('dấu phẩy được thoát', s2.includes('\\,'));
ok('dấu chéo ngược được thoát trước tiên (không thoát hai lần)', s2.includes('\\\\'));

console.log('── Đổi ngày khi trừ 7 tiếng ──');
// 06:00 giờ Việt Nam là 23:00 hôm TRƯỚC theo UTC. Tự trừ bằng tay là quên.
const ics3 = dungIcs(
  [{ id: 5, ngay: '2026-08-28', tu_gio: '06:00', den_gio: '07:00', chu_de: 'Sớm', seq: 1 }],
  { code: 'K03' }, '20260826T000000Z', 'thu.example');
const d3 = moGap(ics3).find(d => d.startsWith('DTSTART'));
ok(`06:00 ngày 28 → 23:00 ngày 27 UTC (${d3})`, d3 === 'DTSTART:20260827T230000Z');

console.log(hong ? `\n${hong} HỎNG` : '\nĐÚNG HẾT');
process.exit(hong ? 1 : 0);
