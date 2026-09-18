// Nhận diện ảnh bằng MAGIC BYTES, không tin phần mở rộng hay content-type.
//
// Tách khỏi lib/drive.js có chủ đích: drive.js chỉ lo chuyên chở, còn tệp này
// là luật "tệp nào được nhận". Và tách ra thì Node gọi thẳng được — sandbox
// không ra được internet nên đường Drive KHÔNG kiểm thật được ở đây, nhưng
// toàn bộ phần đứng TRƯỚC lượt gọi ấy thì kiểm được, và đây là phần đó.
//
// ══ VÌ SAO KHÔNG TIN content-type ════════════════════════════════════════
// Nó do máy khách gửi lên, đổi được bằng một dòng. Một tệp .exe đặt tên
// anh.jpg với header image/jpeg vẫn đi lọt nếu chỉ soi hai thứ ấy — rồi nằm
// trong Drive của Ban tổ chức mang tên một học viên.

// Đọc đủ 12 byte đầu là phân biệt được mọi định dạng trong danh sách dưới.
const CAN = 12;

const khop = (b, mau, tu = 0) => mau.every((x, i) => x === null || b[tu + i] === x);

/**
 * Soi 12 byte đầu và trả về loại ảnh.
 * @returns {{ok: true, mime, duoi}} | {ok: false, la, goi_y}
 *
 * `goi_y` là phần đáng giá nhất của hàm này. "Tệp không hợp lệ" thì học viên
 * không biết làm gì tiếp; "đây là ảnh HEIC, định dạng gốc của iPhone — mở ảnh
 * lên rồi chọn Sao chép sẽ ra JPG" thì họ tự xong trong mười giây. Lớp này
 * phần lớn dùng iPhone, nên HEIC là ca sẽ gặp NHIỀU NHẤT, không phải ca hiếm.
 */
export function doanLoaiAnh(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (b.length < CAN) return { ok: false, la: 'qua_ngan', goi_y: 'Tệp rỗng hoặc hỏng.' };

  // JPEG: FF D8 FF
  if (khop(b, [0xff, 0xd8, 0xff])) return { ok: true, mime: 'image/jpeg', duoi: 'jpg' };
  // PNG: 89 50 4E 47 0D 0A 1A 0A — tám byte, không phải bốn. Bốn byte đầu
  // trùng với vài định dạng khác, và hai byte 0D 0A là chốt bắt tệp đã bị một
  // đường truyền nào đó "sửa" xuống dòng CRLF thành LF.
  if (khop(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { ok: true, mime: 'image/png', duoi: 'png' };
  }

  // ── Từ đây là các định dạng BỊ TỪ CHỐI, nhận diện chỉ để báo cho tử tế ──

  // HEIC/HEIF: byte 4..7 là 'ftyp', rồi brand ở 8..11. Đây là định dạng MẶC
  // ĐỊNH của iPhone — ca sẽ gặp nhiều nhất trong cả danh sách này.
  if (khop(b, [0x66, 0x74, 0x79, 0x70], 4)) {
    const brand = String.fromCharCode(b[8], b[9], b[10], b[11]);
    if (/^(heic|heix|hevc|mif1|msf1|heim|hesp)$/.test(brand)) {
      return { ok: false, la: 'heic',
        goi_y: 'Đây là ảnh HEIC — định dạng gốc của iPhone. Mở ảnh trong Ảnh, bấm Chia sẻ rồi chọn Sao chép ảnh, sau đó dán vào đây sẽ ra JPG. Hoặc đổi Cài đặt → Camera → Định dạng sang "Tương thích nhất".' };
    }
    if (brand === 'avif' || brand === 'avis') {
      return { ok: false, la: 'avif', goi_y: 'Đây là ảnh AVIF. Lưu lại dưới dạng JPG hoặc PNG rồi gửi lại giúp.' };
    }
  }
  // WebP: 'RIFF' ở 0..3 và 'WEBP' ở 8..11
  if (khop(b, [0x52, 0x49, 0x46, 0x46]) && khop(b, [0x57, 0x45, 0x42, 0x50], 8)) {
    return { ok: false, la: 'webp', goi_y: 'Đây là ảnh WebP. Lưu lại dưới dạng JPG hoặc PNG rồi gửi lại giúp.' };
  }
  // PDF: '%PDF'
  if (khop(b, [0x25, 0x50, 0x44, 0x46])) {
    return { ok: false, la: 'pdf', goi_y: 'Đây là tệp PDF, không phải ảnh. Cần một ảnh chân dung JPG hoặc PNG.' };
  }
  // GIF: 'GIF8'
  if (khop(b, [0x47, 0x49, 0x46, 0x38])) {
    return { ok: false, la: 'gif', goi_y: 'Đây là ảnh GIF. Lưu lại dưới dạng JPG hoặc PNG rồi gửi lại giúp.' };
  }
  // ZIP và mọi thứ dựng trên ZIP (docx, xlsx, pptx): 'PK' 03 04
  if (khop(b, [0x50, 0x4b, 0x03, 0x04])) {
    return { ok: false, la: 'zip', goi_y: 'Đây là tệp nén hoặc tệp Word/Excel, không phải ảnh.' };
  }

  return { ok: false, la: 'khong_ro',
    goi_y: 'Không nhận ra đây là ảnh. Cần tệp JPG hoặc PNG.' };
}

// 2MB. Giao diện đã thu nhỏ ảnh trước khi gửi nên người dùng bình thường
// không chạm tới; con số này để chặn ca cố tình và ca giao diện hỏng.
export const TOI_DA_BYTE = 2 * 1024 * 1024;

/**
 * Nối thân multipart cho Drive Ở MỨC BYTE.
 *
 * ĐÂY LÀ CHỖ SAI ĐƯỢC MÀ DRIVE VẪN TRẢ HTTP 200. Dựng thân bằng chuỗi mẫu
 * (`--${ranh}\r\n...${anh}`) thì phần nhị phân đi qua UTF-16 của JavaScript,
 * mọi byte ≥ 0x80 bị thay bằng ký tự thay thế, ảnh hỏng — mà Drive vẫn nhận
 * và vẫn trả 200 kèm một tệp mở ra là vỡ. Không có lỗi nào để đọc.
 *
 * Ranh giới phải là `\r\n`, không phải `\n`.
 */
export function thanMultipart(sieuDuLieu, mime, bytes, ranh) {
  const enc = new TextEncoder();
  const dau = enc.encode(
    `--${ranh}\r\n` +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    `${JSON.stringify(sieuDuLieu)}\r\n` +
    `--${ranh}\r\n` +
    `Content-Type: ${mime}\r\n\r\n`
  );
  const cuoi = enc.encode(`\r\n--${ranh}--\r\n`);

  const out = new Uint8Array(dau.length + bytes.length + cuoi.length);
  out.set(dau, 0);
  out.set(bytes, dau.length);
  out.set(cuoi, dau.length + bytes.length);
  return out;
}

/* ── Tên tệp cho Ban tổ chức đọc, không phải cho máy chủ ─────────────────
   Ngô Phú Cường xin dạng `ngo-phu-cuong.jpg`. Đúng, và vì một lý do cụ thể
   chứ không phải thẩm mỹ: Ban tổ chức tải cả thư mục về máy Windows rồi giao
   cho người làm chứng chỉ. Tên có DẤU và có DẤU CÁCH thì qua zip/giải nén
   trên Windows hay ra ký tự rác, và đưa vào bất kỳ script nào cũng vướng.

   Giữ THÊM hai phần so với ví dụ ấy, mỗi phần một lý do đã đo được:

   1. TIỀN TỐ LOẠI (`chan-dung-` / `logo-`). Không có thì ảnh chân dung và
      logo của cùng một người trùng tên khi cùng đuôi, mà Drive CHO PHÉP trùng
      tên — kết quả là hai tệp giống hệt nhau trong thư mục và không ai biết
      cái nào là cái nào.
   2. SỐ NHÓM (`-n6`). Đây KHÔNG phải phòng xa: roster có HAI người cùng tên
      `Phan Thị Thanh Nga`, một ở Nhóm 6 một ở Nhóm 9 (xem CLAUDE.md). Bỏ số
      nhóm là hai người ấy ghi đè lên nhau trong mắt người làm chứng chỉ.

   Tên rỗng sau khi bỏ dấu (hồ sơ chỉ có ký tự lạ) thì rơi về `hoc-vien` cộng
   số nhóm — thà một tên chung còn hơn một tệp tên `.jpg`. */
export function tenTepAnh(boDau, { tienTo, hoTen, nhomSo, duoi }) {
  const slug = boDau(hoTen)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  const nhom = nhomSo ? `-n${nhomSo}` : '';
  return `${tienTo}-${slug || 'hoc-vien'}${nhom}.${duoi}`;
}
