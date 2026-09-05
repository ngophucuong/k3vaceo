#!/usr/bin/env node
// Kiểm thuật toán ghép nối giao thương (worker/src/lib/ghep.js) và danh mục
// ngành (lib/nganh.js). Logic thuần, KHÔNG cần máy chủ và không chạm D1:
//
//     node scripts/kiem/kiem-ghep.mjs
//
// Bốn phép ở cuối là ĐỐI CHỨNG — mỗi cái dựng lại một cách làm ngây thơ rồi
// chứng minh nó cho kết quả sai ở đúng ca mà phép kiểm phía trên đang khẳng
// định. Không có chúng thì mấy phép trên đậu kể cả khi thuật toán bị thay
// bằng một phép so chuỗi tầm thường, và một bộ kiểm như thế thì vô dụng.

import { boDau, tuKhoa, tuQuaChung, xepGoiY, NGUONG_GOI_Y } from '../../worker/src/lib/ghep.js';
import { NGANH, docNganh, nganhRaChuoi, NGANH_TOI_DA } from '../../worker/src/lib/nganh.js';

let dat = 0, hong = 0;
const ok = (ten, dieuKien, them = '') => {
  if (dieuKien) { dat++; console.log(`  ✓ ${ten}`); }
  else { hong++; console.log(`  ✗ ${ten}${them ? `\n      ${them}` : ''}`); }
};
const muc = t => console.log(`\n${t}`);

/* ══ 1. Bỏ dấu ═════════════════════════════════════════════════════════════ */
muc('1. Bỏ dấu tiếng Việt');
ok("'đường' → 'duong'", boDau('Đường') === 'duong', `nhận: ${boDau('Đường')}`);
ok("'vận tải' → 'van tai'", boDau('Vận tải') === 'van tai');
ok('giữ nguyên chữ không dấu', boDau('logistics') === 'logistics');

/* ══ 2. Từ khoá: bigram gánh phần chính ════════════════════════════════════ */
muc('2. Từ khoá — bigram và từ đơn dài');
const k = tuKhoa('Vận tải hàng hoá');
ok("có bigram 'van tai'", k.has('van tai'));
ok("có bigram 'hang hoa'", k.has('hang hoa'));
ok("KHÔNG có từ đơn 'tai' (dưới 4 ký tự)", !k.has('tai'));
ok("có từ đơn dài 'logistics'", tuKhoa('dịch vụ logistics').has('logistics'));
ok('bỏ từ chung: không có từ đơn "muon"', !tuKhoa('muốn tìm thêm').has('muon'));

/* ══ 3. Cắt từ quá chung, và HAI chốt an toàn ══════════════════════════════ */
muc('3. Cắt từ khoá quá phổ biến');
const nhieu = Array.from({ length: 30 }, () => tuKhoa('dịch vụ trọn gói'));
const catNhieu = tuQuaChung(nhieu);
ok("30 hồ sơ cùng 'dịch vụ' → cụm ấy bị cắt", catNhieu.has('dich vu'));

const it = Array.from({ length: 5 }, () => tuKhoa('dịch vụ trọn gói'));
ok('dưới 20 hồ sơ → KHÔNG cắt gì (chốt an toàn 1)', tuQuaChung(it).size === 0,
   `cắt mất ${tuQuaChung(it).size} cụm khi dữ liệu còn thưa`);

// Chốt an toàn 2: ngưỡng không bao giờ dưới 5 hồ sơ. Với 21 hồ sơ thì 20% là
// 4,2 → làm tròn lên 5, và một cụm chỉ 4 người dùng KHÔNG được coi là chung.
const hp = Array.from({ length: 21 }, (_, i) =>
  tuKhoa(i < 4 ? 'cắt gọt kim loại' : `ngành riêng số ${i}`));
ok('21 hồ sơ, cụm của 4 người → chưa cắt (chốt an toàn 2)',
   !tuQuaChung(hp).has('cat got'));

/* ══ 4. Ba chiều ghép ══════════════════════════════════════════════════════ */
muc('4. Ba chiều ghép và câu giải thích');
const toi = {
  id: 1, full_name: 'Tôi', company: 'Công ty A', title: 'Giám đốc',
  sells_what: 'Vận tải container Bắc Nam', sells_to: 'Nhà máy sản xuất',
  needs: 'Phần mềm quản lý kho', offers: 'Kho bãi tại Hải Phòng', mo_ta: null,
};
const ho = [
  { id: 2, full_name: 'Người cần vận tải', company: 'B', title: '',
    sells_what: 'Bao bì giấy', sells_to: '', needs: 'Đối tác vận tải container', offers: '', mo_ta: null },
  { id: 3, full_name: 'Người bán phần mềm', company: 'C', title: '',
    sells_what: 'Phần mềm quản lý kho và bán hàng', sells_to: '', needs: '', offers: '', mo_ta: null },
  { id: 4, full_name: 'Nhà máy', company: 'Nhà máy sản xuất thép', title: 'Chủ tịch',
    sells_what: 'Thép xây dựng', sells_to: '', needs: '', offers: '', mo_ta: null },
  { id: 5, full_name: 'Không liên quan', company: 'E', title: '',
    sells_what: 'Cắt tóc gội đầu', sells_to: '', needs: '', offers: '', mo_ta: null },
];
const gy = xepGoiY(toi, ho);
const tim = id => gy.find(g => g.member_id === id);

ok('người cần thứ tôi bán → có gợi ý', !!tim(2));
ok("  và giải thích đúng chiều 'ho_can'", tim(2)?.chieu === 'ho_can', `nhận: ${tim(2)?.chieu}`);
ok('người bán thứ tôi cần → có gợi ý', !!tim(3));
ok("  và giải thích đúng chiều 'toi_can'", tim(3)?.chieu === 'toi_can', `nhận: ${tim(3)?.chieu}`);
ok('người đúng loại khách tôi tìm → có gợi ý', !!tim(4));
ok("  và giải thích đúng chiều 'dung_khach'", tim(4)?.chieu === 'dung_khach', `nhận: ${tim(4)?.chieu}`);
ok('người không liên quan → KHÔNG gợi ý', !tim(5));
ok('không tự ghép với chính mình', !xepGoiY(toi, [toi, ...ho]).find(g => g.member_id === toi.id));
ok('có nêu chữ trùng để giải thích', (tim(2)?.trung ?? []).includes('van tai'),
   `nhận: ${JSON.stringify(tim(2)?.trung)}`);
ok('xếp theo điểm giảm dần', gy.every((g, i) => i === 0 || gy[i - 1].diem >= g.diem));

/* ══ 5. Danh mục ngành ═════════════════════════════════════════════════════ */
muc('5. Danh mục ngành');
ok('mã ngành không trùng nhau', new Set(NGANH.map(n => n.ma)).size === NGANH.length);
ok('mọi mã đều dạng chữ-thường-gạch-nối', NGANH.every(n => /^[a-z-]+$/.test(n.ma)));
ok("có mã 'khac' để không ai bị kẹt", NGANH.some(n => n.ma === 'khac'));
ok('bỏ mã lạ', docNganh('van-tai,ma-bia-dat').join() === 'van-tai');
ok('bỏ mã trùng', docNganh('van-tai,van-tai').length === 1);
ok(`cắt còn ${NGANH_TOI_DA} ngành`,
   docNganh('van-tai,cong-nghe,tu-van,y-te,giao-duc').length === NGANH_TOI_DA);
ok('nhận cả mảng lẫn chuỗi',
   docNganh(['van-tai', 'y-te']).join() === docNganh('van-tai,y-te').join());
ok('rỗng → NULL chứ không phải chuỗi rỗng', nganhRaChuoi('') === null);
ok('toàn mã lạ → NULL', nganhRaChuoi('khong-co-that') === null);

/* ══ 6. BỐN ĐỐI CHỨNG — chứng minh phép kiểm trên có răng ══════════════════ */
muc('6. Đối chứng (mỗi phép dựng lại một cách làm ngây thơ và cho thấy nó sai)');

// (a) Bỏ dấu bằng NFD KHÔNG THÔI thì 'đ' sót lại — và 'đường' không bao giờ
//     khớp 'duong'. Đây là lỗi im lặng: không ném lỗi, chỉ mất gợi ý.
const boDauThieu = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
ok('(a) bỏ dấu thiếu bước đ→d thì hỏng — bản thật thì không',
   boDauThieu('Đường') !== 'duong' && boDau('Đường') === 'duong');

// (b) So TỪ ĐƠN thay vì bigram: 'tải app' khớp nhầm 'vận tải'. Đây là lý do
//     bigram tồn tại, và phép kiểm mục 2 sẽ vẫn đậu nếu ai đó đổi sang so từ
//     đơn — nên phải có đối chứng này.
const tuDon = s => new Set(boDau(s).split(/[^a-z0-9]+/).filter(Boolean));
const giao = (a, b) => [...a].filter(x => b.has(x)).length;
const nguoiTaiApp = { id: 9, full_name: 'Tải app', company: '', title: '',
  sells_what: 'Tải app xem phim', sells_to: '', needs: '', offers: '', mo_ta: null };
ok('(b) so từ đơn thì "tải app" khớp nhầm "vận tải" — bản thật thì không',
   giao(tuDon('Vận tải container'), tuDon('Tải app xem phim')) > 0
   && !xepGoiY(toi, [nguoiTaiApp]).length);

// (c) Bỏ chốt "dưới 20 hồ sơ thì không cắt": danh mục vừa mở với 5 người sẽ
//     mất sạch gợi ý. Không có gì báo lỗi — chỉ là một màn trống.
const catSom = (taps) => {                       // bản KHÔNG có chốt an toàn
  const dem = new Map();
  for (const t of taps) for (const x of t) dem.set(x, (dem.get(x) ?? 0) + 1);
  const nguong = Math.ceil(taps.length * 0.2);
  return new Set([...dem].filter(([, n]) => n >= nguong).map(([x]) => x));
};
ok('(c) bỏ chốt 20 hồ sơ thì dữ liệu thưa mất sạch từ khoá — bản thật giữ nguyên',
   catSom(it).size > 0 && tuQuaChung(it).size === 0);

// (d) Ngưỡng điểm phải có RĂNG: một cụm trùng lẻ tẻ không được thành gợi ý.
//     Nếu ai đó hạ NGUONG_GOI_Y xuống 1 thì mọi người khớp với mọi người, và
//     danh mục gợi ý thành danh sách 133 người — vô dụng mà trông vẫn chạy.
const mo = { id: 10, full_name: 'Trùng lẻ tẻ', company: '', title: '',
  sells_what: 'Bán bàn ghế', sells_to: '', needs: 'Kho lạnh', offers: '', mo_ta: null };
ok('(d) trùng một từ đơn thì dưới ngưỡng, không thành gợi ý',
   NGUONG_GOI_Y > 1 && !xepGoiY(toi, [mo]).length);

console.log(`\n${hong === 0 ? '✓ ĐÚNG HẾT' : '✗ CÓ LỖI'} — ${dat} đạt, ${hong} hỏng\n`);
process.exit(hong === 0 ? 0 : 1);
