// Dựng nội dung chuyển khoản và URL ảnh QR theo mục 6.3 SRS.
//
// Ứng dụng KHÔNG giữ tiền (nguyên tắc N3): QR chỉ là ảnh do img.vietqr.io
// dựng từ số tài khoản của người thu. Không có khoá API, không gọi máy chủ
// nào ở phía Worker — giao diện nạp thẳng ảnh.

import { bare } from './suggest.js';

// Mã ngân hàng VietQR (BIN theo Napas). Danh sách rút gọn cho các ngân hàng
// hay gặp; người tạo đợt thu vẫn gõ tay được mã khác nếu ngân hàng của họ
// không có ở đây. Mục 6.2 SRS bắt hiện lời nhắc kiểm tra lại số tài khoản
// đúng vì lý do này — không có cách nào đối chiếu tự động.
export const BANKS = [
  { bin: '970422', name: 'MB Bank' },
  { bin: '970436', name: 'Vietcombank' },
  { bin: '970415', name: 'VietinBank' },
  { bin: '970418', name: 'BIDV' },
  { bin: '970405', name: 'Agribank' },
  { bin: '970407', name: 'Techcombank' },
  { bin: '970416', name: 'ACB' },
  { bin: '970432', name: 'VPBank' },
  { bin: '970423', name: 'TPBank' },
  { bin: '970403', name: 'Sacombank' },
  { bin: '970437', name: 'HDBank' },
  { bin: '970441', name: 'VIB' },
  { bin: '970443', name: 'SHB' },
  { bin: '970426', name: 'MSB' },
  { bin: '970431', name: 'Eximbank' },
  { bin: '970448', name: 'OCB' },
  { bin: '970449', name: 'LPBank' },
  { bin: '970440', name: 'SeABank' },
  { bin: '970419', name: 'NCB' },
  { bin: '970412', name: 'PVcomBank' },
  { bin: '970427', name: 'VietABank' },
  { bin: '970425', name: 'ABBANK' },
  { bin: '970409', name: 'BacABank' },
  { bin: '970428', name: 'Nam A Bank' },
  { bin: '970452', name: 'KienLongBank' },
  { bin: '970454', name: 'BVBank' },
];

export const bankName = bin => BANKS.find(b => b.bin === bin)?.name ?? null;
export const isValidBin = bin => /^\d{6}$/.test(String(bin ?? ''));

// {TEN} -> họ tên bỏ dấu, {NHOM} -> số nhóm. Kết quả bỏ dấu, VIẾT HOA, gộp
// khoảng trắng — đúng mục 6.3, và cũng vì nhiều app ngân hàng cắt hoặc bóp
// méo dấu tiếng Việt trong nội dung chuyển khoản.
export function buildTransferNote(template, { fullName, groupNo }) {
  const raw = String(template || '{TEN} N{NHOM}')
    .replace(/\{TEN\}/g, fullName ?? '')
    .replace(/\{NHOM\}/g, groupNo ?? '');
  return bare(raw).toUpperCase().replace(/\s+/g, ' ').trim();
}

// Mã hoá bằng encodeURIComponent chứ không dùng URLSearchParams: cái sau biến
// dấu cách thành '+', chỉ đúng trong ngữ cảnh form. img.vietqr.io là dịch vụ
// ngoài, không thử được ở đây, nên bám đúng dạng %20 của bản tham chiếu.
export function buildQrUrl(round, note) {
  const parts = [
    `amount=${encodeURIComponent(round.amount)}`,
    `addInfo=${encodeURIComponent(note)}`,
  ];
  if (round.account_name) parts.push(`accountName=${encodeURIComponent(round.account_name)}`);
  return `https://img.vietqr.io/image/${round.bank_bin}-${round.account_no}-compact2.png?${parts.join('&')}`;
}
