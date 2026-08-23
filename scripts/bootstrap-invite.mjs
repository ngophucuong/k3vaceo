#!/usr/bin/env node
// Sinh MỘT link mời để trưởng nhóm đăng nhập lần đầu tiên (chưa có ai trong D1
// để tự phát link cho mình cả). Sau khi trưởng nhóm vào được, 13 người còn lại
// dùng nút "Phát link mời" trong ứng dụng (/api/wizard/invites) — không cần
// chạy script này nữa.
//
// Dùng:  node scripts/bootstrap-invite.mjs "Ngô Phú Cường"

import crypto from 'node:crypto';

const TOKEN_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
const fullName = process.argv.slice(2).join(' ').trim();
if (!fullName) {
  console.error('Dùng: node scripts/bootstrap-invite.mjs "Họ tên đúng như trong roster/members"');
  process.exit(1);
}

let token = '';
for (const b of crypto.randomBytes(22)) token += TOKEN_ALPHABET[b % TOKEN_ALPHABET.length];
const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
const escapedName = fullName.replace(/'/g, "''");

console.log('1) Chạy lệnh này để ghi lời mời vào D1 thật (đổi --remote thành --local nếu đang thử ở máy):\n');
console.log(`npx wrangler d1 execute k3vaceo --remote --command "INSERT INTO invites (member_id, token_hash, expires_at, created_at) SELECT id, '${tokenHash}', datetime('now','+14 days'), datetime('now') FROM members WHERE full_name = '${escapedName}';"`);
console.log('\n2) Sau đó mở đường link này (còn hạn 14 ngày, dùng được nhiều lần):\n');
console.log(`   https://k3vaceo.maychudev.com/i/${token}`);
