export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...extraHeaders },
  });
}

export function error(code, status, extra) {
  return json({ error: code, ...extra }, status);
}

export function parseCookies(request) {
  const header = request.headers.get('cookie') || '';
  const out = {};
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i === -1) continue;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

// Luôn trả về một object thuần. Body là null, số, chuỗi hay mảng đều thành {}
// — nếu không thì `'title' in body` ném TypeError và mọi payload dị dạng biến
// thành lỗi 500 thay vì được xử lý như dữ liệu sai.
export async function readJson(request) {
  try {
    const data = await request.json();
    if (data === null || typeof data !== 'object' || Array.isArray(data)) return {};
    return data;
  } catch {
    return {};
  }
}
