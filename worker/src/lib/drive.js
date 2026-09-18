// Đẩy tệp lên Google Drive — gọi thẳng HTTP, không thêm thư viện.
//
// Đúng nếp đã dùng cho Resend, Web Push và DeepSeek (mục 8 SRS). Tệp này CỐ Ý
// chỉ lo chuyên chở: nó không biết gì về chứng chỉ, ảnh chân dung hay logo.
// Luật "tệp nào được nhận" nằm ở lib/anh.js, chính sách nằm ở routes.
//
// ══ VÌ SAO DRIVE, KHÔNG PHẢI R2 — VÀ VÌ SAO ĐÂY KHÔNG PHẢI BỎ N2 ═════════
// Lý lẽ đầy đủ ở CLAUDE.md. Tóm tắt phần phải nhớ khi sửa tệp này: ứng dụng
// là ỐNG DẪN, không phải kho. Byte đi qua Worker rồi nằm trên Drive của người
// phụ trách; D1 chỉ giữ đường dẫn và id. Hết khoá học, ứng dụng tắt thì ảnh
// vẫn còn — đó đúng là điều N2 muốn bảo vệ, không phải điều nó cấm.
//
// ══ REFRESH TOKEN, KHÔNG PHẢI SERVICE ACCOUNT ════════════════════════════
// Tài khoản dịch vụ KHÔNG có dung lượng Drive riêng, nên đẩy vào thư mục của
// một Gmail thường là `403 storageQuotaExceeded` — muốn chạy phải có Workspace
// + Shared Drive, tức phải trả tiền. Và tệp sẽ thuộc sở hữu của tài khoản dịch
// vụ: xoá dự án Google Cloud là ảnh cả lớp đi theo, đúng thứ N2 sinh ra để
// tránh. Refresh token chạy với Gmail thường và tệp thuộc về chính chủ.
//
// ══ SCOPE drive.file — HỆ QUẢ PHẢI NHỚ ═══════════════════════════════════
// Đây là scope Drive DUY NHẤT Google không xếp loại "nhạy cảm", nên xuất bản
// được thẳng, không phải qua vòng thẩm định hàng tuần. Giá phải trả: ứng dụng
// CHỈ đụng được tệp do chính nó tạo ra. Vì vậy THƯ MỤC ĐÍCH PHẢI DO ỨNG DỤNG
// TẠO — dán id một thư mục tạo tay thì Drive trả `404 File not found: <id>`,
// một câu đọc lên như "thư mục không tồn tại" nên rất dễ đi tìm nhầm chỗ.
// taoThuMuc() dưới đây là chỗ giải quyết việc ấy.

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const API_URL = 'https://www.googleapis.com';

// Đổi được đích gọi bằng một biến môi trường, CÙNG HAI LÝ DO đã ghi cho
// LLM_BASE_URL trong lib/llm.js — và lý do thứ nhất mới là lý do thật:
// `fetch` tới một host bị chặn trong sandbox KHÔNG hỏng ngay, nó TREO tới khi
// workerd cắt kết nối, và bộ kiểm chết bằng `UND_ERR_SOCKET: other side
// closed` mà không phép nào đọc được `hong_o_buoc`. `.dev.vars` trỏ biến này
// vào CỔNG ĐÓNG 127.0.0.1:2527 (2525 SMTP, 2526 LLM) để lỗi nổi lên trong
// vài mili giây và đọc được.
//
// Một biến cho CẢ HAI host: khi đặt thì token lẫn upload cùng đi về đó.
// BẢN THẬT PHẢI ĐỂ TRỐNG.
function goc(env) {
  const u = (env.GOOGLE_BASE_URL || '').trim();
  if (!u) return null;
  const hopLe = u.startsWith('https://')
    || u.startsWith('http://127.0.0.1') || u.startsWith('http://localhost');
  if (!hopLe) throw new LoiDrive('cau_hinh_sai', 'GOOGLE_BASE_URL phải là https:// hoặc loopback');
  return u.replace(/\/+$/, '');
}

const urlToken = env => (goc(env) ? `${goc(env)}/token` : TOKEN_URL);
const urlApi = (env, duong) => `${goc(env) ?? API_URL}${duong}`;

// Mang theo TÊN BƯỚC hỏng, đúng khuôn LoiSmtp và LoiLLM. Đây là đường DUY
// NHẤT đọc được sự thật khi log Worker câm — bài học đã trả giá ở đường gửi
// thư 24/8 và trả lần nữa ở trợ lý. Sandbox không gọi ra internet được, nên
// khi đường Drive hỏng trên tên miền thật thì `hong_o_buoc` trong phúc đáp
// 502 là thứ duy nhất nói được hỏng ở đâu.
export class LoiDrive extends Error {
  constructor(buoc, chiTiet, ma = null) {
    super(`${buoc}: ${chiTiet}`);
    this.buoc = buoc;
    this.ma = ma;
  }
}

// Trả null khi CHƯA cấu hình — đúng khuôn llmCauHinh()/pushCauHinh(): thiếu
// khoá thì route trả 503, giao diện ẩn hẳn ô chọn ảnh, mọi thứ khác chạy bình
// thường. TUYỆT ĐỐI không trả một mẩu nào của khoá ra khỏi hàm này.
export function driveCauHinh(env) {
  const du = env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_REFRESH_TOKEN;
  return du ? { co_khoa: true } : null;
}

/* ── Subrequest 1/2: đổi refresh token lấy access token ──────────────────
   KHÔNG ĐỆM access token. Worker không có KV, mà nhét vào D1 là đổi một thứ
   đọc-nhiều-ghi-nhiều lấy một lượt fetch rẻ. Hai subrequest mỗi tệp còn xa
   trần 50 của gói miễn phí. */
async function layAccessToken(env) {
  if (!driveCauHinh(env)) {
    throw new LoiDrive('chua_cau_hinh', 'thiếu GOOGLE_CLIENT_ID/SECRET/REFRESH_TOKEN trong Worker');
  }
  const dich = urlToken(env);

  let tra;
  try {
    tra = await fetch(dich, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        refresh_token: env.GOOGLE_REFRESH_TOKEN,
        grant_type: 'refresh_token',
      }),
      signal: AbortSignal.timeout(20_000),
    });
  } catch (err) {
    const het = err?.name === 'TimeoutError' || err?.name === 'AbortError';
    throw new LoiDrive(het ? 'qua_lau' : 'lay_token', String(err));
  }

  if (!tra.ok) {
    const text = await tra.text().catch(() => '');
    // Câu hay gặp nhất ở đây là `invalid_grant`, và nó có đúng MỘT nguyên
    // nhân đáng nghi: refresh token cấp lúc ứng dụng còn ở trạng thái
    // "Testing" đã chết sau 7 ngày. Xuất bản sau đó KHÔNG hồi sinh token cũ —
    // phải lấy token MỚI. Ghi thẳng câu này ra để lần sau khỏi đi dò.
    const goiY = /invalid_grant/.test(text)
      ? ' — nhiều khả năng refresh token đã bị thu hồi hoặc đã hết hạn 7 ngày của trạng thái Testing; lấy token MỚI ở OAuth Playground.'
      : '';
    throw new LoiDrive('token_tu_choi', `HTTP ${tra.status} ${text.slice(0, 300)}${goiY}`, tra.status);
  }

  let data;
  try {
    data = await tra.json();
  } catch (err) {
    throw new LoiDrive('phuc_dap_la', `token: không đọc được JSON: ${err}`);
  }
  if (!data.access_token) throw new LoiDrive('phuc_dap_rong', 'token: thiếu access_token');
  return data.access_token;
}

/* ── Tạo thư mục đích ────────────────────────────────────────────────────
   Phải do CHÍNH ỨNG DỤNG tạo, xem chú thích scope ở đầu tệp. Chỗ gọi lưu id
   trả về vào bảng `cai_dat` để lần sau dùng lại, không tạo lại mỗi lượt. */
export async function taoThuMuc(env, ten) {
  const token = await layAccessToken(env);
  let tra;
  try {
    tra = await fetch(urlApi(env, '/drive/v3/files?fields=id,name'), {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: ten, mimeType: 'application/vnd.google-apps.folder' }),
      signal: AbortSignal.timeout(20_000),
    });
  } catch (err) {
    const het = err?.name === 'TimeoutError' || err?.name === 'AbortError';
    throw new LoiDrive(het ? 'qua_lau' : 'tai_len', String(err));
  }
  if (!tra.ok) {
    const text = await tra.text().catch(() => '');
    throw new LoiDrive('drive_tu_choi', `tạo thư mục: HTTP ${tra.status} ${text.slice(0, 300)}`, tra.status);
  }
  const data = await tra.json().catch(() => null);
  if (!data?.id) throw new LoiDrive('phuc_dap_rong', 'tạo thư mục: thiếu id');
  return data.id;
}

/* ── Subrequest 2/2: đẩy một tệp lên ─────────────────────────────────────
   BA CHỖ SAI MÀ DRIVE VẪN TRẢ HTTP 200 — cả ba đều nằm gọn trong hàm này,
   nên đọc kỹ trước khi sửa:

   1. THIẾU TIỀN TỐ `/upload/` trong đường dẫn → Drive trả 200, tạo đúng tên
      tệp, NỘI DUNG 0 BYTE. Nhìn thư mục tưởng xong, mở ra mới biết rỗng.
   2. THIẾU `fields=id,name,webViewLink` → `webViewLink` lặng lẽ `undefined`,
      và D1 lưu một dòng không có đường nào mở lại tệp.
   3. DỰNG THÂN BẰNG CHUỖI MẪU → ảnh đi qua UTF-16 và hỏng, Drive vẫn 200.
      Thân phải nối ở mức BYTE — xem thanMultipart() trong lib/anh.js.

   KHÔNG gộp hai ảnh vào một request: gộp thì một ảnh hỏng kéo cả hai. */
export async function taiLenDrive(env, { ten, mime, bytes, thuMucId }) {
  const token = await layAccessToken(env);
  const { thanMultipart } = await import('./anh.js');

  const ranh = `k3vaceo${crypto.randomUUID().replace(/-/g, '')}`;
  const sieu = { name: ten, ...(thuMucId ? { parents: [thuMucId] } : {}) };
  const than = thanMultipart(sieu, mime, bytes, ranh);

  let tra;
  try {
    tra = await fetch(
      urlApi(env, '/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink'),
      {
        method: 'POST',
        headers: {
          'content-type': `multipart/related; boundary=${ranh}`,
          authorization: `Bearer ${token}`,
        },
        body: than,
        signal: AbortSignal.timeout(60_000),
      }
    );
  } catch (err) {
    const het = err?.name === 'TimeoutError' || err?.name === 'AbortError';
    throw new LoiDrive(het ? 'qua_lau' : 'tai_len', String(err));
  }

  if (!tra.ok) {
    const text = await tra.text().catch(() => '');
    // 404 ở ĐÂY gần như luôn là một chuyện: thư mục đích không do ứng dụng
    // tạo ra, nên với scope drive.file nó coi như không tồn tại. Câu lỗi thô
    // của Google đọc lên như thư mục bị xoá, nên nói rõ ra.
    const goiY = tra.status === 404
      ? ' — thư mục đích không do chính ứng dụng tạo ra; với scope drive.file thì nó coi như không tồn tại.'
      : '';
    throw new LoiDrive('drive_tu_choi', `HTTP ${tra.status} ${text.slice(0, 300)}${goiY}`, tra.status);
  }

  let data;
  try {
    data = await tra.json();
  } catch (err) {
    throw new LoiDrive('phuc_dap_la', `tải lên: không đọc được JSON: ${err}`);
  }
  if (!data?.id) throw new LoiDrive('phuc_dap_rong', 'tải lên: thiếu id');
  // webViewLink thiếu là dấu hiệu của lỗi số 2 ở trên. Dựng lại từ id thay vì
  // để null: dòng trong D1 luôn có đường mở lại tệp, kể cả khi Google đổi
  // cách trả trường ấy.
  return {
    id: data.id,
    ten: data.name ?? ten,
    url: data.webViewLink || `https://drive.google.com/file/d/${data.id}/view`,
  };
}
