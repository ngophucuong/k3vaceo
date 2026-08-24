// Gửi thư qua SMTP cá nhân bằng TCP Socket API của Workers (mục 4.2 SRS —
// đăng nhập lại bằng email). Không dùng dịch vụ gửi thư bên thứ ba: tài khoản
// SMTP sẵn có của người dựng là đủ cho 134 người.
//
// LƯU Ý HẠ TẦNG: Cloudflare chặn cổng 25 ra ngoài. Dùng 587 (STARTTLS) hoặc
// 465 (TLS ngay từ đầu) — cấu hình bằng SMTP_PORT + SMTP_SECURE.
//
// Biến môi trường (đặt bằng `wrangler secret put`, đừng để trong wrangler.toml):
//   SMTP_HOST     smtp.hostinger.com
//   SMTP_PORT     465 (TLS) hoặc 587 (STARTTLS)
//   SMTP_SECURE   starttls | tls | plain — bỏ trống thì suy từ cổng
//   SMTP_USER     địa chỉ đăng nhập      (nhận cả tên SMTP_USERNAME)
//   SMTP_PASS     mật khẩu               (nhận cả tên SMTP_PASSWORD)
//   MAIL_FROM     "Tên hiển thị <ten@ten-mien.com>"  (nhận cả SMTP_FROM_EMAIL)

import { connect } from 'cloudflare:sockets';

// Chấp nhận hai bộ tên cho cùng một thứ. Bộ ngắn là bộ chính; bộ dài
// (SMTP_USERNAME / SMTP_PASSWORD / SMTP_FROM_EMAIL) là tên hay gặp ở bảng điều
// khiển của nhà cung cấp hosting. Đặt nhầm sang bộ kia đã xảy ra một lần và
// triệu chứng rất khó đoán: Worker trả 503 mailer_not_configured y như khi
// chưa đặt gì cả.
export function docCauHinhSmtp(env) {
  const port = Number(env.SMTP_PORT || 587);
  return {
    host: env.SMTP_HOST,
    port,
    // Cổng 465 là TLS NGAY TỪ ĐẦU, không phải STARTTLS. Suy mặc định từ cổng
    // để bớt một biến phải nhớ — đặt lệch cặp cổng/chế độ thì bắt tay treo
    // hoặc lỗi khó hiểu chứ không báo thẳng ra.
    mode: (env.SMTP_SECURE || (port === 465 ? 'tls' : 'starttls')).toLowerCase(),
    user: env.SMTP_USER || env.SMTP_USERNAME,
    pass: env.SMTP_PASS || env.SMTP_PASSWORD,
    from: env.MAIL_FROM || env.SMTP_FROM_EMAIL,
  };
}

export function mailerConfigured(env) {
  const c = docCauHinhSmtp(env);
  return !!(c.host && c.user && c.pass && c.from);
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

// Tên hiển thị có dấu cũng phải mã hoá RFC 2047 y như tiêu đề — ví dụ ghi
// trong chính tệp này từng là "Nhóm 6 K03 <...>", đúng kiểu sẽ vỡ. Từ khoá:
// encoded-word KHÔNG được nằm trong chuỗi có nháy kép, nên bỏ nháy trước.
export function encodeFrom(v) {
  const m = String(v).match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (!m) return String(v).trim();
  const dc = m[2];
  const ten = m[1].replace(/^"(.*)"$/, '$1').trim();
  if (!ten) return dc;
  return /^[\x20-\x7E]*$/.test(ten) ? `${ten} <${dc}>` : `=?UTF-8?B?${b64(ten)}?= <${dc}>`;
}

function buildMessage({ from, to, subject, text }) {
  // Tiêu đề tiếng Việt phải mã hoá RFC 2047, nếu không dấu sẽ vỡ ở phía nhận.
  const encodedSubject = `=?UTF-8?B?${b64(subject)}?=`;
  const headers = [
    `From: ${encodeFrom(from)}`,
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

  const { host, port, mode, user, pass, from } = docCauHinhSmtp(env);

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
      await send(writer, b64(user));
      await expect(reader, [334], 'gửi tài khoản');
      await send(writer, b64(pass));
      await expect(reader, [235], 'gửi mật khẩu');
    }

    await send(writer, `MAIL FROM:<${addressOnly(from)}>`);
    await expect(reader, [250], 'MAIL FROM');
    await send(writer, `RCPT TO:<${addressOnly(to)}>`);
    await expect(reader, [250, 251], 'RCPT TO');
    await send(writer, 'DATA');
    await expect(reader, [354], 'DATA');

    await send(writer, buildMessage({ from, to, subject, text }) + '\r\n.');
    await expect(reader, [250], 'kết thúc thư');

    await send(writer, 'QUIT');
  } finally {
    try { reader.releaseLock(); writer.releaseLock(); await socket.close(); } catch { /* đóng được tới đâu hay tới đó */ }
  }
}
