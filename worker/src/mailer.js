// Gửi thư qua SMTP cá nhân bằng TCP Socket API của Workers (mục 4.2 SRS —
// đăng nhập lại bằng email). Không dùng dịch vụ gửi thư bên thứ ba: tài khoản
// SMTP sẵn có của người dựng là đủ cho 134 người.
//
// LƯU Ý HẠ TẦNG: Cloudflare chặn cổng 25 ra ngoài. Dùng 587 (STARTTLS) hoặc
// 465 (TLS ngay từ đầu) — cấu hình bằng SMTP_PORT + SMTP_SECURE.
//
// Biến môi trường (đặt bằng `wrangler secret put`, đừng để trong wrangler.toml):
//   SMTP_HOST     smtp.gmail.com
//   SMTP_PORT     587
//   SMTP_SECURE   starttls | tls | plain   (plain chỉ dùng khi kiểm thử cục bộ)
//   SMTP_USER     địa chỉ đăng nhập
//   SMTP_PASS     mật khẩu ứng dụng (Gmail/Outlook bắt bật xác minh 2 bước trước)
//   MAIL_FROM     "Nhóm 6 K03 <ten@gmail.com>"

import { connect } from 'cloudflare:sockets';

export function mailerConfigured(env) {
  return !!(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS && env.MAIL_FROM);
}

const enc = new TextEncoder();
const dec = new TextDecoder();

function b64(s) {
  return btoa(String.fromCharCode(...enc.encode(s)));
}

// Đọc cho tới hết một phúc đáp SMTP. Phúc đáp nhiều dòng có dấu '-' ngay sau
// mã số ("250-SIZE"), dòng cuối dùng dấu cách ("250 OK") — đọc thiếu dòng cuối
// thì lệnh kế tiếp sẽ khớp nhầm với phần đuôi của phúc đáp trước.
async function readReply(reader) {
  let buf = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split('\r\n').filter(Boolean);
    const last = lines[lines.length - 1];
    if (last && /^\d{3} /.test(last)) break;
  }
  const code = parseInt(buf.slice(0, 3), 10);
  return { code, text: buf.trim() };
}

async function send(writer, line) {
  await writer.write(enc.encode(line + '\r\n'));
}

async function expect(reader, okCodes, step) {
  const reply = await readReply(reader);
  if (!okCodes.includes(reply.code)) {
    throw new Error(`SMTP ${step} thất bại: ${reply.text || '(không có phúc đáp)'}`);
  }
  return reply;
}

// Chấm đầu dòng trong phần thân có nghĩa là "hết thư" — phải nhân đôi, nếu
// không một dòng chỉ có dấu chấm sẽ cắt cụt thư.
function dotStuff(body) {
  return body.split('\r\n').map(l => (l.startsWith('.') ? '.' + l : l)).join('\r\n');
}

function buildMessage({ from, to, subject, text }) {
  // Tiêu đề tiếng Việt phải mã hoá RFC 2047, nếu không dấu sẽ vỡ ở phía nhận.
  const encodedSubject = `=?UTF-8?B?${b64(subject)}?=`;
  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodedSubject}`,
    `Date: ${new Date().toUTCString()}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
  ];
  // Base64 cho thân thư để khỏi lo dòng dài và ký tự có dấu.
  const encodedBody = b64(text).replace(/(.{76})/g, '$1\r\n');
  return headers.join('\r\n') + '\r\n\r\n' + dotStuff(encodedBody);
}

function addressOnly(v) {
  const m = String(v).match(/<([^>]+)>/);
  return m ? m[1] : String(v).trim();
}

export async function sendMail(env, { to, subject, text }) {
  if (!mailerConfigured(env)) throw new Error('SMTP chưa được cấu hình');

  const host = env.SMTP_HOST;
  const port = Number(env.SMTP_PORT || 587);
  const mode = (env.SMTP_SECURE || 'starttls').toLowerCase();

  let socket = connect(
    { hostname: host, port },
    mode === 'tls' ? { secureTransport: 'on' }
      : mode === 'starttls' ? { secureTransport: 'starttls' }
      : {}
  );

  let writer = socket.writable.getWriter();
  let reader = socket.readable.getReader();

  try {
    await expect(reader, [220], 'chào hỏi');

    await send(writer, 'EHLO k3vaceo');
    await expect(reader, [250], 'EHLO');

    if (mode === 'starttls') {
      await send(writer, 'STARTTLS');
      await expect(reader, [220], 'STARTTLS');
      // Sau startTls() là một socket khác — phải lấy lại writer/reader, giữ
      // cái cũ sẽ ghi vào đường chưa mã hoá đã đóng.
      reader.releaseLock();
      writer.releaseLock();
      socket = socket.startTls();
      writer = socket.writable.getWriter();
      reader = socket.readable.getReader();
      await send(writer, 'EHLO k3vaceo');
      await expect(reader, [250], 'EHLO sau STARTTLS');
    }

    {
      await send(writer, 'AUTH LOGIN');
      await expect(reader, [334], 'AUTH LOGIN');
      await send(writer, b64(env.SMTP_USER));
      await expect(reader, [334], 'gửi tài khoản');
      await send(writer, b64(env.SMTP_PASS));
      await expect(reader, [235], 'gửi mật khẩu');
    }

    await send(writer, `MAIL FROM:<${addressOnly(env.MAIL_FROM)}>`);
    await expect(reader, [250], 'MAIL FROM');
    await send(writer, `RCPT TO:<${addressOnly(to)}>`);
    await expect(reader, [250, 251], 'RCPT TO');
    await send(writer, 'DATA');
    await expect(reader, [354], 'DATA');

    await send(writer, buildMessage({ from: env.MAIL_FROM, to, subject, text }) + '\r\n.');
    await expect(reader, [250], 'kết thúc thư');

    await send(writer, 'QUIT');
  } finally {
    try { reader.releaseLock(); writer.releaseLock(); await socket.close(); } catch { /* đóng được tới đâu hay tới đó */ }
  }
}
