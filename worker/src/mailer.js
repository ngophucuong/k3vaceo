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
  // Có Resend là gửi được, không cần bí mật SMTP nào.
  if (env.RESEND_API_KEY && (env.MAIL_FROM || env.SMTP_FROM_EMAIL)) return true;
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

// Lỗi SMTP mang theo TÊN BƯỚC. Không có nó thì chỉ biết "gửi hỏng" mà không
// biết hỏng ở đâu — và cách duy nhất để biết là đọc log Worker, thứ hoá ra
// không đọc được (wrangler tail im lặng suốt ngày 24/8, nhiều khả năng API
// token thiếu quyền Workers Tail). Tên bước không lộ gì bí mật nhưng chỉ đúng
// chỗ hỏng, nên trả thẳng về trong phúc đáp HTTP.
class LoiSmtp extends Error {
  constructor(buoc, ma, text) {
    super(`SMTP ${buoc} thất bại: ${text || '(không có phúc đáp)'}`);
    this.buoc = buoc;
    this.ma = ma ?? null;
  }
}

async function expect(reader, okCodes, step) {
  const reply = await readReply(reader);
  if (!okCodes.includes(reply.code)) throw new LoiSmtp(step, reply.code, reply.text);
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

// Mã hoá quoted-printable (RFC 2045 mục 6.7). Trước đây dùng base64 cho thân
// thư — hợp lệ, nhưng thư chỉ có văn bản thuần mà mã hoá base64 là chuyện người
// gửi tử tế gần như không bao giờ làm, nên bộ lọc coi đó là dấu hiệu spam. Đo
// được ngày 24/8: cùng tài khoản Hostinger, thư văn bản thuần gửi từ máy chủ
// GitHub thì tới hộp thư, thư base64 gửi từ Worker thì biến mất không dấu vết.
// Quoted-printable giữ được dấu tiếng Việt mà thư vẫn đọc được bằng mắt.
function quotedPrintable(text) {
  const byte = new TextEncoder().encode(text);
  const ra = [];
  let dong = '';

  const xuong = (mem) => { ra.push(mem ? dong + '=' : dong); dong = ''; };

  for (let i = 0; i < byte.length; i++) {
    const b = byte[i];

    // Xuống dòng thật giữ nguyên. \r\n trong nguồn tính là một lần.
    if (b === 0x0A) { xuong(false); continue; }
    if (b === 0x0D) { if (byte[i + 1] === 0x0A) i++; xuong(false); continue; }

    // Ký tự in được ASCII đi thẳng, trừ dấu '=' phải tự mã hoá.
    // Ngoài ra khoảng trắng và tab không được đứng cuối dòng.
    const cuoiDong = i + 1 >= byte.length || byte[i + 1] === 0x0D || byte[i + 1] === 0x0A;
    const laTrang = b === 0x20 || b === 0x09;
    const thang = b >= 33 && b <= 126 && b !== 0x3D;

    const manh = (thang || (laTrang && !cuoiDong))
      ? String.fromCharCode(b)
      : '=' + b.toString(16).toUpperCase().padStart(2, '0');

    // Dòng tối đa 76 ký tự KỂ CẢ dấu '=' báo ngắt mềm ở cuối.
    if (dong.length + manh.length > 75) xuong(true);
    dong += manh;
  }
  ra.push(dong);
  return ra.join('\r\n');
}

function addressOnly(v) {
  const m = String(v).match(/<([^>]+)>/);
  return m ? m[1] : String(v).trim();
}

function buildMessage({ from, to, subject, text }) {
  // Tiêu đề tiếng Việt phải mã hoá RFC 2047, nếu không dấu sẽ vỡ ở phía nhận.
  const encodedSubject = `=?UTF-8?B?${b64(subject)}?=`;

  // Message-ID là BẮT BUỘC trên thực tế, dù RFC 5322 chỉ khuyến nghị. Máy chủ
  // thư bình thường tự thêm hộ, còn client tự viết như cái này thì không ai
  // thêm hộ cả. Gmail coi thư thiếu Message-ID là dấu hiệu spam rất mạnh và
  // thường vứt lặng lẽ — không vào Spam, không báo lỗi, không bounce. Đúng
  // triệu chứng đã gặp: Hostinger trả 250 (đã nhận thư) mà hộp thư trống trơn.
  // Phần miền lấy từ địa chỉ gửi để khớp với SPF/DKIM của cuongngo.cloud.
  const mienGui = addressOnly(from).split('@')[1] || 'k3vaceo';
  const messageId = `<${crypto.randomUUID()}@${mienGui}>`;

  const headers = [
    `From: ${encodeFrom(from)}`,
    `To: ${to}`,
    `Subject: ${encodedSubject}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: ${messageId}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: quoted-printable',
  ];
  return headers.join('\r\n') + '\r\n\r\n' + dotStuff(quotedPrintable(text));
}

// ── Đường gửi thứ hai: API HTTP ──────────────────────────────────────────
//
// Client SMTP tự viết ở dưới đã chứng minh là mong manh: ngày 24/8, cùng một
// tài khoản Hostinger, thư gửi từ máy chủ GitHub bằng thư viện chuẩn thì tới
// nơi, thư gửi từ Worker thì Hostinger nhận (trả 250) rồi biến mất. Đã sửa ba
// chỗ khác biệt tìm được mà vẫn chưa chắc ăn.
//
// Nên mở sẵn một đường không dính SMTP: gọi API HTTP của dịch vụ thư giao
// dịch. Không TCP tự viết, không TLS tự viết, không bắt tay nhiều nhịp — chỉ
// một lượt fetch, và có bảng theo dõi từng lá thư đi tới đâu.
//
// Bật bằng cách đặt đúng MỘT bí mật: RESEND_API_KEY. Có nó thì dùng đường này,
// không có thì rơi về SMTP như cũ. Không đổi dòng nào ở chỗ gọi.
function resendCauHinh(env) {
  return env.RESEND_API_KEY ? {
    key: env.RESEND_API_KEY,
    from: env.MAIL_FROM || env.SMTP_FROM_EMAIL,
  } : null;
}

async function guiQuaResend(cf, { to, subject, text }) {
  const tra = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${cf.key}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from: cf.from, to: [addressOnly(to)], subject, text }),
  });
  const than = await tra.text();
  if (!tra.ok) throw new Error(`Resend từ chối (HTTP ${tra.status}): ${than.slice(0, 300)}`);
  // Ghi lại mã thư để tra được về sau, y như mã hàng đợi của SMTP.
  console.log('Đã gửi qua Resend:', than.slice(0, 200));
}

export async function sendMail(env, { to, subject, text }) {
  const cf = resendCauHinh(env);
  if (cf) return guiQuaResend(cf, { to, subject, text });

  if (!mailerConfigured(env)) throw new Error('SMTP chưa được cấu hình');

  const { host, port, mode, user, pass, from } = docCauHinhSmtp(env);

  let socket, writer, reader;
  try {
    socket = connect(
      { hostname: host, port },
      mode === 'tls' ? { secureTransport: 'on' }
        : mode === 'starttls' ? { secureTransport: 'starttls' }
        : {}
    );
    writer = socket.writable.getWriter();
    reader = socket.readable.getReader();
  } catch (err) {
    // Không mở nổi socket: chặn cổng, chặn IP, hoặc bắt tay TLS đổ. Đánh dấu
    // riêng vì cách chữa hoàn toàn khác với lỗi trong lòng phiên SMTP.
    throw new LoiSmtp(`mở kết nối tới ${host}:${port} (${mode})`, null, String(err));
  }

  try {
    await expect(reader, [220], 'chào hỏi');

    // EHLO phải là tên miền đầy đủ. Bản cũ gửi 'k3vaceo' — không có dấu chấm,
    // không phải tên miền nào cả. Máy chủ nhận vẫn cho qua nhưng ghi lại trong
    // header Received, và bộ lọc phía sau trừ điểm nặng chỗ ấy. Lấy miền của
    // chính địa chỉ gửi để khớp với SPF/DKIM.
    const tenMay = addressOnly(from).split('@')[1] || 'k3vaceo.cuongngo.app';
    await send(writer, `EHLO ${tenMay}`);
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
      await send(writer, `EHLO ${tenMay}`);
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
    const nhanThu = await expect(reader, [250], 'kết thúc thư');

    // Ghi lại nguyên văn câu 250 cuối cùng. Hầu hết máy chủ trả kèm mã hàng
    // đợi ("250 Ok: queued as 4abc..."), và đó là thứ DUY NHẤT truy vết được
    // khi thư biến mất sau lúc nhà cung cấp đã nhận: đưa mã ấy cho bộ phận hỗ
    // trợ là họ tra được thư đi đâu. Không có nó thì chỉ biết "đã nhận" rồi
    // thôi — đúng cái ngõ cụt đã gặp ngày 24/8.
    // KHÔNG ghi tiêu đề hay thân thư: tiêu đề có chứa mã 6 số.
    console.log('SMTP đã nhận thư:', nhanThu.text.replace(/\s+/g, ' ').slice(0, 300));

    await send(writer, 'QUIT');
  } finally {
    try { reader.releaseLock(); writer.releaseLock(); await socket.close(); } catch { /* đóng được tới đâu hay tới đó */ }
  }
}
