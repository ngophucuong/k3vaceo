// Dựng tệp lịch iCalendar (RFC 5545) cho lịch học của khoá. Tự viết, không
// thêm thư viện — mục 8 SRS cấm build step, và định dạng này chỉ là văn bản.
//
// Bốn chỗ sai được thì im lặng, không báo lỗi, chỉ ra một tệp mà ứng dụng lịch
// từ chối mở hoặc mở ra sai giờ. Ghi ra đây để lần sau khỏi dò lại:
//
// 1. XUỐNG DÒNG PHẢI LÀ CRLF. Chỉ \n thì một số máy đọc nuốt cả tệp.
// 2. GẤP DÒNG PHẢI ĐẾM THEO BYTE, KHÔNG THEO KÝ TỰ. Giới hạn là 75 octet, mà
//    chữ Việt có dấu chiếm 2–3 byte trong UTF-8 — đếm theo ký tự thì một dòng
//    "Quản trị chiến lược kinh doanh" tưởng ngắn nhưng thật ra đã quá. Và cắt
//    giữa một ký tự nhiều byte là hỏng cả dòng.
// 3. GIỜ VIỆT NAM LÀ UTC+7 QUANH NĂM, không có giờ mùa hè bao giờ. Nên quy về
//    UTC rồi ghi hậu tố Z là xong, không cần kèm khối VTIMEZONE. Nhưng phải
//    dùng Date.UTC để trừ 7 tiếng: 06:00 ngày 28 lùi thành 23:00 ngày 27, tự
//    trừ bằng tay là quên mất chuyện đổi ngày.
// 4. UID PHẢI CỐ ĐỊNH THEO BUỔI. Nhờ nó mà tải lại tệp là các buổi cũ được
//    CẬP NHẬT chứ không nhân đôi — chuyện sống còn vì lịch lớp có dời buổi.
//    Kèm SEQUENCE tăng dần (lấy theo lúc sửa) thì máy đọc mới chịu cập nhật.
//
// Quy ước 1 CLAUDE.md (mọi mốc thời gian do SQLite sinh và so sánh) vẫn giữ:
// DTSTAMP và SEQUENCE đều lấy từ D1. Chỗ dùng Date.UTC dưới đây chỉ là phép
// tính đổi múi giờ để IN RA, không ghi vào đâu và không so bằng SQL.

const CRLF = '\r\n';
const OFFSET_VN = 7; // giờ, cố định quanh năm

// Thoát ký tự trong giá trị kiểu TEXT. Dấu hai chấm KHÔNG phải thoát; thoát
// nó là một lỗi hay gặp và làm chủ đề buổi học hiện ra kèm dấu chéo ngược.
function esc(s) {
  return String(s ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

// Gấp dòng dài theo octet. Dòng nối tiếp bắt đầu bằng đúng một dấu cách.
function gap(line) {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;

  const out = [];
  let dau = 0;              // vị trí byte bắt đầu đoạn đang cắt
  let toiDa = 75;           // dòng đầu 75 octet, dòng sau 74 (chừa dấu cách)
  while (dau < bytes.length) {
    let het = Math.min(dau + toiDa, bytes.length);
    // Lùi về ranh giới ký tự: byte tiếp theo là 10xxxxxx thì đang đứng giữa
    // một ký tự nhiều byte, phải lùi thêm.
    while (het > dau && het < bytes.length && (bytes[het] & 0xc0) === 0x80) het--;
    out.push(new TextDecoder().decode(bytes.subarray(dau, het)));
    dau = het;
    toiDa = 74;
  }
  return out.join(CRLF + ' ');
}

// 'YYYY-MM-DD' + 'HH:MM' giờ Việt Nam → 'YYYYMMDDTHHMMSSZ'
function mocUtc(ngay, gio, themPhut = 0) {
  const [y, m, d] = ngay.split('-').map(Number);
  const [hh, mm] = gio.split(':').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d, hh - OFFSET_VN, mm + themPhut));
  const p = (n, r = 2) => String(n).padStart(r, '0');
  return `${p(t.getUTCFullYear(), 4)}${p(t.getUTCMonth() + 1)}${p(t.getUTCDate())}`
       + `T${p(t.getUTCHours())}${p(t.getUTCMinutes())}00Z`;
}

// 'YYYY-MM-DD' → 'YYYYMMDD', cộng thêm số ngày nếu cần (DTEND của buổi cả
// ngày là ngày HÔM SAU — đầu mút phải là mút hở, quên là mất một ngày).
function mocNgay(ngay, themNgay = 0) {
  const [y, m, d] = ngay.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + themNgay));
  const p = (n, r = 2) => String(n).padStart(r, '0');
  return `${p(t.getUTCFullYear(), 4)}${p(t.getUTCMonth() + 1)}${p(t.getUTCDate())}`;
}

// 'YYYY-MM-DD HH:MM:SS' của SQLite (đã là UTC) → 'YYYYMMDDTHHMMSSZ'
function mocSqlite(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/.exec(String(s ?? ''));
  if (!m) return null;
  return `${m[1]}${m[2]}${m[3]}T${m[4]}${m[5]}${m[6]}Z`;
}

// Buổi chỉ ghi giờ bắt đầu mà không ghi giờ kết thúc thì cho mặc định 3 tiếng.
// Thà dài hơn thực tế còn hơn để một buổi 0 phút — vài ứng dụng lịch không vẽ
// nổi sự kiện dài 0 phút và giấu luôn khỏi màn tuần.
const PHUT_MAC_DINH = 180;

/**
 * @param {object[]} buoi   dòng của lich_hoc, kèm cột `seq` (giây unix lúc sửa)
 * @param {object}   khoa   { code, name, defense_on }
 * @param {string}   dtstamp 'YYYYMMDDTHHMMSSZ' — lúc lịch đổi lần cuối
 * @param {string}   host   tên miền, để dựng UID
 */
export function dungIcs(buoi, khoa, dtstamp, host) {
  const d = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//k3vaceo//Lich hoc ${esc(khoa?.code ?? 'K03')}//VI`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    // Hai dòng X- dưới đây không nằm trong RFC nhưng Apple, Google và Outlook
    // đều đọc — nhờ nó lịch nhập vào có TÊN thay vì một mớ sự kiện rời.
    `X-WR-CALNAME:${esc('Lớp CEO ' + (khoa?.code ?? 'K03'))}`,
    'X-WR-TIMEZONE:Asia/Ho_Chi_Minh',
  ];

  for (const b of buoi) {
    const moTa = [
      b.giang_vien ? `Giảng viên: ${b.giang_vien}` : null,
      b.ghi_chu || null,
      khoa?.name || null,
    ].filter(Boolean).join('\n');

    d.push('BEGIN:VEVENT');
    d.push(`UID:buoi-${b.id}@${host}`);
    d.push(`DTSTAMP:${dtstamp}`);
    // SEQUENCE tăng thì máy đọc mới chịu ghi đè buổi đã nhập lần trước.
    if (Number.isFinite(Number(b.seq))) d.push(`SEQUENCE:${Number(b.seq)}`);

    if (b.tu_gio) {
      d.push(`DTSTART:${mocUtc(b.ngay, b.tu_gio)}`);
      d.push(b.den_gio
        ? `DTEND:${mocUtc(b.ngay, b.den_gio)}`
        : `DTEND:${mocUtc(b.ngay, b.tu_gio, PHUT_MAC_DINH)}`);
    } else {
      // Chưa công bố giờ: để cả ngày, đừng bịa ra một giờ không có thật.
      d.push(`DTSTART;VALUE=DATE:${mocNgay(b.ngay)}`);
      d.push(`DTEND;VALUE=DATE:${mocNgay(b.ngay, 1)}`);
    }

    d.push(`SUMMARY:${esc(b.chu_de)}`);
    if (moTa) d.push(`DESCRIPTION:${esc(moTa)}`);
    // Buổi đã huỷ vẫn gửi đi, kèm STATUS:CANCELLED — có thế thì buổi đã nhập
    // từ lần trước mới bị gạch đi. Bỏ hẳn khỏi tệp thì nó nằm lại trong lịch
    // của người ta mãi mãi, và họ đến lớp vào một ngày không có ai.
    d.push(b.huy_luc ? 'STATUS:CANCELLED' : 'STATUS:CONFIRMED');
    d.push('END:VEVENT');
  }

  // Buổi bảo vệ: cột mốc cả khoá hướng tới, để cả ngày vì chưa có giờ.
  if (khoa?.defense_on) {
    d.push('BEGIN:VEVENT');
    d.push(`UID:baove@${host}`);
    d.push(`DTSTAMP:${dtstamp}`);
    d.push(`DTSTART;VALUE=DATE:${mocNgay(khoa.defense_on)}`);
    d.push(`DTEND;VALUE=DATE:${mocNgay(khoa.defense_on, 1)}`);
    d.push(`SUMMARY:${esc('Bảo vệ kế hoạch kinh doanh — lớp CEO ' + (khoa.code ?? 'K03'))}`);
    d.push('STATUS:CONFIRMED');
    d.push('END:VEVENT');
  }

  d.push('END:VCALENDAR');
  return d.map(gap).join(CRLF) + CRLF;
}

export { mocSqlite };
