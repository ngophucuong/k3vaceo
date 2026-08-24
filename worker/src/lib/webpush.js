// Gửi thông báo đẩy tới trình duyệt, tự viết bằng WebCrypto của Workers.
// Không thêm thư viện: mục 8 SRS chốt "không build step, không framework", và
// mọi thư viện web-push đều dựng cho Node chứ không cho Workers.
//
// Ba tầng chồng lên nhau, hỏng tầng nào cũng ra "thư đi mà không ai nhận":
//
//   1. VAPID  (RFC 8292) — JWT ký ES256, chứng minh với máy chủ đẩy rằng
//      người gửi là ai. Không có thì Chrome/Firefox từ chối thẳng.
//   2. aes128gcm (RFC 8188) — khuôn gói dữ liệu mã hoá.
//   3. Khoá chung ECDH + HKDF (RFC 8291) — khoá mã hoá dựng từ khoá công khai
//      của CHÍNH trình duyệt ấy, nên máy chủ đẩy chuyển tiếp được mà không
//      đọc được nội dung.
//
// Nội dung đẩy cố tình rất ngắn và KHÔNG chứa gì nhạy cảm: máy chủ đẩy là bên
// thứ ba (Google, Apple, Mozilla), và thông báo còn hiện trên màn hình khoá.

const enc = new TextEncoder();

/* ══ Tiện ích base64url ═════════════════════════════════════════════════ */

export function b64urlToBytes(s) {
  const p = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(p + '='.repeat((4 - (p.length % 4)) % 4));
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}

export function bytesToB64url(b) {
  let s = '';
  for (const x of new Uint8Array(b)) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function noi(...phan) {
  const tong = phan.reduce((n, p) => n + p.length, 0);
  const ra = new Uint8Array(tong);
  let i = 0;
  for (const p of phan) { ra.set(p, i); i += p.length; }
  return ra;
}

function u16(n) { return new Uint8Array([(n >> 8) & 0xff, n & 0xff]); }
function u32(n) { return new Uint8Array([(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff]); }

/* ══ VAPID: JWT ký ES256 ════════════════════════════════════════════════ */

// Khoá riêng VAPID cất dưới dạng base64url của 32 byte thô (đúng thứ
// `web-push generate-vapid-keys` in ra). WebCrypto không nhập được dạng thô
// cho khoá riêng, nên dựng JWK từ nó — d là khoá riêng, x/y lấy từ khoá công
// khai đi kèm.
async function nhapKhoaRieng(vapidPrivate, vapidPublic) {
  const pub = b64urlToBytes(vapidPublic);       // 65 byte, mở đầu bằng 0x04
  if (pub.length !== 65 || pub[0] !== 0x04) throw new Error('VAPID_PUBLIC_KEY sai khuôn (cần 65 byte P-256 chưa nén)');
  const d = b64urlToBytes(vapidPrivate);
  if (d.length !== 32) throw new Error('VAPID_PRIVATE_KEY sai khuôn (cần 32 byte)');
  return crypto.subtle.importKey('jwk', {
    kty: 'EC', crv: 'P-256',
    x: bytesToB64url(pub.slice(1, 33)),
    y: bytesToB64url(pub.slice(33, 65)),
    d: bytesToB64url(d),
    ext: true,
  }, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
}

export async function taoVapidJwt({ endpoint, subject, vapidPublic, vapidPrivate, hanGio = 12 }) {
  const aud = new URL(endpoint).origin;
  const header = bytesToB64url(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const payload = bytesToB64url(enc.encode(JSON.stringify({
    aud, sub: subject,
    exp: Math.floor(Date.now() / 1000) + hanGio * 3600,
  })));
  const than = `${header}.${payload}`;
  const key = await nhapKhoaRieng(vapidPrivate, vapidPublic);
  // WebCrypto trả chữ ký ES256 dạng r||s 64 byte — đúng thứ JWS cần, không
  // phải DER. Chỗ này hay sai khi bê mã từ Node sang.
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(than));
  return `${than}.${bytesToB64url(sig)}`;
}

/* ══ Mã hoá nội dung: aes128gcm ═════════════════════════════════════════ */

async function hkdf(salt, ikm, info, doDai) {
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt, info }, key, doDai * 8));
}

export async function maHoaAes128gcm(noiDung, p256dhB64, authB64, saltCho, khoaTamCho) {
  const khachPub = b64urlToBytes(p256dhB64);
  const auth = b64urlToBytes(authB64);
  const salt = saltCho ?? crypto.getRandomValues(new Uint8Array(16));

  const khoaTam = khoaTamCho ?? await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const tamPub = new Uint8Array(await crypto.subtle.exportKey('raw', khoaTam.publicKey));

  const khachKey = await crypto.subtle.importKey(
    'raw', khachPub, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const chung = new Uint8Array(await crypto.subtle.deriveBits(
    { name: 'ECDH', public: khachKey }, khoaTam.privateKey, 256));

  // Thứ tự trong info là BẮT BUỘC: khoá công khai của TRÌNH DUYỆT trước, của
  // máy chủ sau. Đảo lại thì vẫn ra một khoá hợp lệ, thư vẫn gửi đi, máy chủ
  // đẩy vẫn nhận — nhưng trình duyệt giải mã hỏng và bỏ im lặng.
  const prk = await hkdf(auth, chung, noi(enc.encode('WebPush: info\0'), khachPub, tamPub), 32);
  const cek = await hkdf(salt, prk, enc.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, prk, enc.encode('Content-Encoding: nonce\0'), 12);

  const aes = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  // 0x02 là dấu kết thúc bản ghi cuối (RFC 8188 mục 2). Thiếu nó thì trình
  // duyệt coi là gói cụt.
  const than = noi(enc.encode(noiDung), new Uint8Array([0x02]));
  const kin = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aes, than));

  // Đầu gói aes128gcm: salt(16) | rs(4) | idlen(1) | khoá công khai máy chủ(65)
  return noi(salt, u32(4096), new Uint8Array([tamPub.length]), tamPub, kin);
}

/* ══ Gửi một lượt ═══════════════════════════════════════════════════════ */

export function pushCauHinh(env) {
  const pub = env.VAPID_PUBLIC_KEY, priv = env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return null;
  return { pub, priv, subject: env.VAPID_SUBJECT || 'mailto:info@cuongngo.cloud' };
}

// Trả về { ok } hoặc { ok:false, ma, text, chet } — `chet` nghĩa là đăng ký
// không còn tồn tại, gọi lại bao nhiêu lần cũng thế, nên hãy tắt nó đi.
export async function guiMotDay(cf, sub, noiDung) {
  let than, jwt;
  try {
    than = await maHoaAes128gcm(noiDung, sub.p256dh, sub.auth);
    jwt = await taoVapidJwt({
      endpoint: sub.endpoint, subject: cf.subject,
      vapidPublic: cf.pub, vapidPrivate: cf.priv,
    });
  } catch (err) {
    return { ok: false, ma: null, text: `dựng gói hỏng: ${err.message}`, chet: false };
  }

  let tra;
  try {
    tra = await fetch(sub.endpoint, {
      method: 'POST',
      headers: {
        'content-encoding': 'aes128gcm',
        'content-type': 'application/octet-stream',
        'ttl': '86400',
        'urgency': 'normal',
        authorization: `vapid t=${jwt}, k=${cf.pub}`,
      },
      body: than,
    });
  } catch (err) {
    return { ok: false, ma: null, text: `không gọi được máy chủ đẩy: ${err}`, chet: false };
  }

  if (tra.ok) return { ok: true, ma: tra.status };
  // 404/410 là đăng ký đã chết hẳn: gỡ ứng dụng, xoá dữ liệu trình duyệt, đổi máy.
  const chet = tra.status === 404 || tra.status === 410;
  let text = '';
  try { text = (await tra.text()).slice(0, 300); } catch { /* thân rỗng cũng được */ }
  return { ok: false, ma: tra.status, text, chet };
}
