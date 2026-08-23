// Kiểm tra tối thiểu, cố ý không chặt: mục tiêu là bắt lỗi gõ nhầm chứ không
// phải xác minh email có thật (nguyên tắc N4 — không xác minh email ở đợt 1,
// tự giác là chính). Chặt quá thì loại nhầm email công ty hợp lệ.
const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

export function cleanText(v, maxLength) {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  if (s === '') return null;
  return maxLength ? s.slice(0, maxLength) : s;
}

export function normalizeEmail(v) {
  const s = cleanText(v, 160);
  return s ? s.toLowerCase() : null;
}

export function isValidEmail(v) {
  return typeof v === 'string' && EMAIL_RE.test(v);
}

export function clampPct(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(100, Math.round(n)));
}
