// Ghép nối giao thương: ai đang cần thứ tôi bán, ai bán thứ tôi đang cần.
//
// ══ VÌ SAO TÍNH Ở MÁY CHỦ, KHÔNG TÍNH Ở GIAO DIỆN ═════════════════════════
// Nếp đã có (sổ thu) là lọc ở giao diện, không gọi lại máy chủ. Chỗ này cố ý
// làm ngược, vì lý do khác hẳn: không có build step (mục 8 SRS), nên mã ở
// worker/src/lib/ KHÔNG dùng lại được trong public/app.js. Muốn tính ở giao
// diện thì phải chép nguyên thuật toán sang một tệp thứ hai — và hai bản sao
// của một thuật toán mờ như thế này thì lệch nhau trong im lặng, triệu chứng
// là gợi ý trong ứng dụng khác gợi ý trên trang công khai mà không ai biết
// bên nào đúng.
//
// Cái giá phải trả bằng không: gợi ý cho tôi KHÔNG đổi khi tôi bấm chip lọc,
// nên tính một lần lúc tải danh mục là đủ. Việc lọc và tìm vẫn ở giao diện.
//
// ══ VÌ SAO KHÔNG DÙNG MÔ HÌNH NGÔN NGỮ ════════════════════════════════════
// 134 hồ sơ, mỗi ô 80–300 ký tự. Gọi một mô hình cho việc này là thêm một
// khoá API, một hạn mức, một đường mạng có thể chết, và một khoản tiền — để
// khớp những cụm mà người dùng vốn đã viết trùng chữ nhau. Phép so chữ chạy
// trong vài mili giây và giải thích được vì sao nó khớp; một mô hình thì
// không, mà gợi ý không giải thích được thì không ai tin.

// Bỏ dấu tiếng Việt. 'đ' KHÔNG phải nguyên âm có dấu tổ hợp nên NFD không
// tách nó ra — phải thay riêng, nếu không thì 'đường' và 'duong' không khớp.
export function boDau(s) {
  return String(s ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase();
}

// Từ đơn quá chung, loại khỏi phép đếm từ-đơn.
const TU_CHUNG = new Set([
  'cac', 'nhung', 'mot', 'cua', 'cho', 'voi', 'trong', 'ngoai', 've', 'khi',
  'duoc', 'nguoi', 'chung', 'toi', 'minh', 'ban', 'ho', 'day', 'kia', 'nay',
  'can', 'muon', 'tim', 'kiem', 'them', 'nhieu', 'moi', 'rat', 'hon', 'nhat',
  'lam', 'gia', 'tot', 'cao', 'thap', 'lon', 'nho', 'hay', 'nhu', 'thi', 'la',
]);

/* TỪ CHỨC NĂNG — bigram chứa một trong số này ở BẤT KỲ vị trí nào đều bị bỏ.
   Thấy trên dữ liệu thật ngày 5/9: "xuất và nhập khẩu" sinh ra bigram
   `"xuat va"`, và ứng dụng đem đúng mảnh vỡ ấy ra giải thích vì sao hai người
   nên gặp nhau — `cùng nhắc tới "xuat va"`. Bản đầu chỉ lọc TỪ ĐƠN nên cặp
   nào cũng được nhận, kể cả cặp nửa từ nửa liên từ.

   Đây là chỗ khác `TU_CHUNG` ở trên: 'khach' và 'hang' đều tầm thường khi
   đứng một mình, nhưng "khach hang" là một từ có nghĩa. Còn 'va' thì không
   ghép được với gì để thành nghĩa.

   DANH SÁCH NÀY PHẢI RẤT HẸP, và lý do đắt hơn vẻ ngoài của nó: sau khi bỏ
   dấu, phần lớn từ nối tiếng Việt TRÙNG với một từ nội dung. Bản đầu của tôi
   có 40 mục và lập tức cắt oan "vận tải" — vì 'tai' vừa là "tại" vừa là
   "tải". Bộ kiểm bắt được ngay. Những mục đã phải gỡ, kèm từ bị nó giết:
     tai → vận TẢI, TÀI chính     tu  → TƯ vấn        cua → CỬA hàng
     cho → CHỢ đầu mối            trong → TRỒNG trọt  ve  → VÉ máy bay
     khi → KHÍ đốt                thi → THI công      duoc → DƯỢC phẩm
     den → ĐÈN                    bang → BẢNG, BĂNG   cung → CUNG cấp
     con → CON giống              nen → NỀN tảng      chi → CHI phí
     da  → DA giày                vi  → VI sinh, VÍ   ma  → MÃ số
   Chỉ giữ những âm tiết mà sau khi bỏ dấu gần như không mang nghĩa nào khác
   trong ngữ cảnh làm ăn. Thêm mục mới vào đây thì phải đi hỏi cùng câu ấy:
   bỏ dấu xong nó còn là từ gì nữa? */
const TU_NOI = new Set([
  'va', 'cac', 'nhung', 'mot', 'hay', 'nhu', 'theo', 'truoc',
  'nay', 'kia', 'ay', 'boi', 'neu', 'hoac', 'deu', 'se',
]);

/* CỤM CHUNG CỦA GIỚI KINH DOANH — sàn cứng, chạy CẢ KHI dữ liệu còn thưa.
   Trước 5/9 tôi cố ý không viết danh sách này, với lý lẽ "danh sách viết tay
   luôn thiếu đúng những cụm mà lớp NÀY hay dùng, phép đếm tự động thì thích
   nghi được". Lý lẽ ấy đúng nhưng chưa đủ, và dữ liệu thật bác bỏ nó ngay
   ngày đầu: phép đếm CHỈ chạy khi có từ 20 hồ sơ trở lên (chốt an toàn ngay
   dưới), mà lúc mới mở thì chưa đủ — nên "thị trường" thành lý do ghép nối
   cho bốn người liền, đọc lên như dữ liệu bịa.

   Hai thứ bổ sung cho nhau chứ không thay thế: danh sách này lo lúc thưa,
   phép đếm lo lúc dày và bắt được những cụm tôi không đoán trước. */
const CUM_CHUNG = new Set([
  'thi truong', 'khach hang', 'doanh nghiep', 'dich vu', 'san pham',
  'cong ty', 'kinh doanh', 'phat trien', 'hop tac', 'chat luong',
  'doi tac', 'nhu cau', 'uy tin', 'chuyen nghiep', 'gia canh tranh',
  'toan quoc', 'ca nuoc', 'moi loai', 'da dang', 'chi phi',
]);

// Tách chuỗi thành các âm tiết đã bỏ dấu. Tiếng Việt viết rời từng âm tiết
// nên khoảng trắng là ranh giới tin cậy được — không cần bộ tách từ.
function amTiet(s) {
  return boDau(s).split(/[^a-z0-9]+/).filter(Boolean);
}

/* Từ khoá của một đoạn chữ: BIGRAM (cặp âm tiết liền nhau) cộng từ đơn dài.
   Bigram gánh phần chính, và đó là chỗ khác biệt sống còn với phép so từ đơn:
   trong tiếng Việt gần như mọi từ có nghĩa đều hai âm tiết. So từ đơn thì
   'tải' trong "vận tải" khớp 'tải' trong "tải trọng" và "tải app" — nhiễu tới
   mức gợi ý thành vô dụng. So bigram thì 'van tai' chỉ khớp 'van tai'.

   Từ đơn vẫn giữ nhưng chỉ khi ≥ 4 ký tự sau khi bỏ dấu, để bắt được tên
   riêng và từ mượn ('logistics', 'marketing') vốn không tách thành cặp. */
export function tuKhoa(...doan) {
  const at = amTiet(doan.filter(Boolean).join(' '));
  const ra = new Set();
  for (let i = 0; i < at.length; i++) {
    if (at[i].length >= 4 && !TU_CHUNG.has(at[i])) ra.add(at[i]);
    if (i + 1 >= at.length) continue;
    // Cặp có từ nối ở một trong hai vế là mảnh vỡ giữa hai từ thật, không
    // phải một từ — bỏ. Cặp nằm trong danh sách cụm chung thì có nghĩa nhưng
    // không phân biệt được ai với ai — cũng bỏ.
    if (TU_NOI.has(at[i]) || TU_NOI.has(at[i + 1])) continue;
    const cum = `${at[i]} ${at[i + 1]}`;
    if (CUM_CHUNG.has(cum)) continue;
    ra.add(cum);
  }
  return ra;
}

const DIEM_BIGRAM = 3;   // cặp âm tiết — gần như luôn là một từ có nghĩa
const DIEM_TU_DON = 1;
export const NGUONG_GOI_Y = 3;   // ít nhất một bigram, hoặc ba từ đơn

/* Từ khoá xuất hiện ở quá nhiều hồ sơ thì không phân biệt được ai với ai:
   nếu 60/134 người đều viết "dịch vụ" thì cụm ấy khớp tất cả mọi người và
   giá trị thông tin của nó bằng không. Đây là ý tưởng IDF, nhưng cắt thẳng
   thay vì đánh trọng số — với vài trăm từ khoá thì cắt là đủ và đọc được.

   Vì sao tự đếm chứ không viết sẵn danh sách cụm chung: danh sách viết tay
   luôn thiếu đúng những cụm mà lớp NÀY hay dùng, và tôi không đoán trước
   được. Phép đếm thì tự thích nghi.

   HAI CHỐT AN TOÀN, thiếu một cái là hỏng ngầm khi dữ liệu còn thưa:
     • Dưới 20 hồ sơ thì không cắt gì cả — 20% của 5 hồ sơ là 1, tức mọi từ
       khoá đều bị coi là "quá chung" và danh mục không còn gợi ý nào.
     • Ngưỡng không bao giờ thấp hơn 5 hồ sơ, kể cả khi 20% ra số nhỏ hơn. */
const TOI_THIEU_DE_CAT = 20;
const TI_LE_CAT = 0.2;
const NGUONG_CAT_SAN = 5;

export function tuQuaChung(cacTapTuKhoa) {
  if (cacTapTuKhoa.length < TOI_THIEU_DE_CAT) return new Set();
  const dem = new Map();
  for (const tap of cacTapTuKhoa) {
    for (const t of tap) dem.set(t, (dem.get(t) ?? 0) + 1);
  }
  const nguong = Math.max(NGUONG_CAT_SAN, Math.ceil(cacTapTuKhoa.length * TI_LE_CAT));
  const ra = new Set();
  for (const [t, n] of dem) if (n >= nguong) ra.add(t);
  return ra;
}

function chamDiem(a, b, boQua) {
  const trung = [];
  let diem = 0;
  for (const t of a) {
    if (!b.has(t) || boQua.has(t)) continue;
    diem += t.includes(' ') ? DIEM_BIGRAM : DIEM_TU_DON;
    trung.push(t);
  }
  // Bigram trước, rồi tới từ dài — câu giải thích chỉ đọc được khi cụm có
  // nghĩa nhất đứng đầu.
  trung.sort((x, y) => (y.includes(' ') - x.includes(' ')) || y.length - x.length);
  return { diem, trung: trung.slice(0, 3) };
}

/* Ba chiều ghép, ba câu giải thích khác nhau. Tách ra chứ không cộng gộp vì
   người đọc cần biết vì sao mình nên gọi cho người này — "cùng nhắc tới vận
   tải" là một gợi ý mờ, "họ đang cần thứ bạn bán" là một lý do để bấm gọi.

   CỐ Ý KHÔNG cộng điểm cho người CÙNG NGÀNH. Trực giác bảo cùng ngành thì
   liên quan, nhưng trong giao thương thì cùng ngành phần lớn là đối thủ chứ
   không phải khách hàng — người bán vật liệu xây dựng cần gặp nhà thầu, không
   cần gặp người bán vật liệu xây dựng khác. Ngành vẫn để đó cho người dùng
   TỰ lọc khi họ muốn tìm đồng nghiệp; máy không tự suy ra điều đó. */
const CHIEU = [
  { ma: 'ho_can',  nhan: 'Họ đang cần thứ bạn bán' },
  { ma: 'toi_can', nhan: 'Họ có thứ bạn đang cần' },
  { ma: 'dung_khach', nhan: 'Họ đúng loại khách bạn tìm' },
];

function hoSoKhoa(p) {
  return {
    ban: tuKhoa(p.sells_what, p.offers, p.mo_ta),
    can: tuKhoa(p.needs),
    banCho: tuKhoa(p.sells_to),
    la: tuKhoa(p.company, p.title, p.mo_ta),
  };
}

/* Xếp gợi ý cho MỘT người trên danh sách còn lại.
   `toi` và mỗi phần tử của `danhSach` là một hồ sơ phẳng có: id, full_name,
   company, title, sells_what, sells_to, needs, offers, mo_ta. */
export function xepGoiY(toi, danhSach, gioiHan = 6) {
  const kToi = hoSoKhoa(toi);
  const kHo = danhSach.map(h => ({ h, k: hoSoKhoa(h) }));

  // Đếm độ phổ biến trên TOÀN BỘ chữ của từng hồ sơ, không đếm riêng từng ô:
  // một cụm chung như "dịch vụ" chung là chung, dù nó nằm ở ô "bán gì" hay ô
  // "đang cần".
  const boQua = tuQuaChung(
    [toi, ...danhSach].map(p => tuKhoa(p.sells_what, p.sells_to, p.needs, p.offers, p.mo_ta))
  );

  const ra = [];
  for (const { h, k } of kHo) {
    if (h.id === toi.id) continue;
    const cham = [
      chamDiem(kToi.ban, k.can, boQua),
      chamDiem(kToi.can, k.ban, boQua),
      chamDiem(kToi.banCho, k.la, boQua),
    ];
    const tong = cham.reduce((s, c) => s + c.diem, 0);
    if (tong < NGUONG_GOI_Y) continue;

    // Chiều mạnh nhất quyết định câu giải thích. Bằng điểm thì thứ tự CHIEU
    // quyết định, và "họ đang cần thứ bạn bán" cố ý đứng đầu: đó là chiều duy
    // nhất mà người đọc bán được hàng ngay.
    let manh = 0;
    for (let i = 1; i < cham.length; i++) if (cham[i].diem > cham[manh].diem) manh = i;

    ra.push({
      member_id: h.id,
      diem: tong,
      chieu: CHIEU[manh].ma,
      vi_sao: CHIEU[manh].nhan,
      trung: cham[manh].trung,
    });
  }
  ra.sort((a, b) => b.diem - a.diem || a.member_id - b.member_id);
  return ra.slice(0, gioiHan);
}
