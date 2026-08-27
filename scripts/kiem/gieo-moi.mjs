// Sinh 30 lời mời còn hạn cho kiem-tanso.mjs, dùng ở phép kiểm "cả lớp bấm
// link mời cùng lúc". D1 chỉ giữ bản BĂM của token, nên phải sinh ở đây rồi
// ghi ra hai tệp: câu SQL để nạp, và danh sách token để bộ kiểm đọc lại.
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';

const toks = Array.from({ length: 30 }, (_, i) => `kiemtratanso${String(i).padStart(3, '0')}abcdefghij`);
const rows = toks.map(t =>
  `(1, '${createHash('sha256').update(t).digest('hex')}', 'invite', datetime('now', '+1 day'), datetime('now'))`);

writeFileSync(new URL('./moi-tanso.json', import.meta.url), JSON.stringify(toks));
writeFileSync('/tmp/moi-tanso.sql', [
  'DELETE FROM invites WHERE member_id = 1;',
  'INSERT INTO invites (member_id, token_hash, kind, expires_at, created_at) VALUES',
  rows.join(',\n') + ';',
].join('\n'));
