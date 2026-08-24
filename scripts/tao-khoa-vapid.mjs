#!/usr/bin/env node
// Sinh cặp khoá VAPID cho thông báo đẩy. Chạy MỘT LẦN, rồi đặt kết quả vào
// GitHub Secrets — deploy.yml tự đồng bộ sang Worker mỗi lần deploy.
//
//   node scripts/tao-khoa-vapid.mjs
//
// Đổi khoá về sau là MỌI đăng ký hiện có chết hết: trình duyệt gắn đăng ký với
// đúng khoá công khai đã dùng lúc đăng ký. Cả lớp sẽ phải bật lại thông báo.
// Nên sinh một lần rồi giữ.

import { webcrypto } from 'node:crypto';
const { subtle } = webcrypto;

const b64url = b => Buffer.from(b).toString('base64')
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const kp = await subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
const pub = new Uint8Array(await subtle.exportKey('raw', kp.publicKey));   // 65 byte, mở đầu 0x04
const jwk = await subtle.exportKey('jwk', kp.privateKey);                  // d đã là base64url

console.log(`
════════════════════════════════════════════════════════════
  KHOÁ VAPID — đặt ba dòng dưới vào GitHub Secrets
  (Settings → Secrets and variables → Actions → New secret)
════════════════════════════════════════════════════════════

VAPID_PUBLIC_KEY
${b64url(pub)}

VAPID_PRIVATE_KEY
${jwk.d}

VAPID_SUBJECT
mailto:info@cuongngo.cloud

════════════════════════════════════════════════════════════
  Khoá CÔNG KHAI không phải bí mật — trình duyệt cần nó để
  đăng ký, ứng dụng trả nó ở /api/push/khoa. Khoá RIÊNG thì
  giữ kín: ai có nó là đẩy được thông báo nhân danh ứng dụng.

  Đổi khoá về sau = mọi đăng ký hiện có chết, cả lớp phải bật
  lại. Sinh một lần rồi giữ.
════════════════════════════════════════════════════════════
`);
