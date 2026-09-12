// Đường gọi mô hình ngôn ngữ cho Trợ lý KHKD — DeepSeek, gọi thẳng HTTP.
//
// KHÔNG thêm thư viện: đúng nếp đã dùng cho Resend (API HTTP) và Web Push
// (tự viết trong lib/webpush.js). API của DeepSeek tương thích khuôn OpenAI
// nên một lượt `fetch` là đủ — thêm một SDK vào bundle của Worker chỉ để ghép
// một chuỗi JSON là cái giá không đáng.
//
// Tệp này CỐ Ý chỉ lo việc chuyên chở, không biết gì về KHKD. Dựng prompt nằm
// ở tro-ly/prompt.js, chọn bối cảnh nằm ở routes/tro-ly.js. Nhờ vậy đổi nhà
// cung cấp về sau chỉ là sửa đúng tệp này — cùng lý lẽ đã ghi cho sendMail()
// trong CLAUDE.md ("đổi nhà cung cấp về sau chỉ là đổi sendMail() đi đường
// khác, phần chọn người nhận và chia lô không đụng tới").

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';

// Đổi được đích gọi bằng một biến môi trường, vì HAI lý do — không phải để
// tiện tay:
//
//  1. Sandbox không ra được internet, mà `fetch` tới một host bị chặn thì
//     TREO chứ không hỏng ngay: request của bộ kiểm chết giữa chừng với
//     `UND_ERR_SOCKET: other side closed` và không phép nào đọc được
//     `hong_o_buoc`. Đúng cái bẫy đã ghi trong CLAUDE.md cho SMTP, và đúng
//     cách chữa đã dùng ở đó: `.dev.vars` trỏ vào một CỔNG ĐÓNG trên máy này
//     để lỗi nổi lên ngay lập tức và đọc được.
//  2. Đổi nhà cung cấp về sau không phải sửa mã.
//
// Chốt chặn: chỉ nhận `https://` hoặc loopback. Đây KHÔNG phải chốt chống kẻ
// tấn công — ai sửa được biến môi trường của Worker thì cũng sửa được chính
// tệp này — mà là chốt chống GÕ NHẦM: một `http://` ra ngoài sẽ gửi khoá
// TÍNH TIỀN đi qua đường không mã hoá, và không chỗ nào báo lỗi.
function dichGoi(env) {
  const u = (env.LLM_BASE_URL || '').trim();
  if (!u) return DEEPSEEK_URL;
  const hopLe = u.startsWith('https://')
    || u.startsWith('http://127.0.0.1') || u.startsWith('http://localhost');
  if (!hopLe) throw new LoiLLM('cau_hinh_sai', 'LLM_BASE_URL phải là https:// hoặc loopback');
  return u;
}

// Hai model của DeepSeek: 'deepseek-chat' trả lời nhanh, 'deepseek-reasoner'
// nghĩ lâu hơn. Mặc định dùng bản nhanh vì đây là phỏng vấn — mỗi lượt chỉ
// một câu hỏi, học viên đang ngồi chờ trên điện thoại. Đổi được bằng một dòng
// trong bảng `cai_dat`, không cần deploy (xem migration 0038).
export const MODEL_MAC_DINH = 'deepseek-chat';

// Model suy luận KHÔNG nhận temperature/top_p — gửi vào thì tốt nhất là bị bỏ
// qua, xấu nhất là bị từ chối. Lọc ở đây thay vì bắt chỗ gọi phải nhớ.
const MODEL_SUY_LUAN = new Set(['deepseek-reasoner']);

// Mang theo TÊN BƯỚC hỏng, đúng khuôn LoiSmtp đã trả giá để có (CLAUDE.md:
// "Lỗi gửi thư mang theo .buoc… Đây là đường duy nhất đọc được sự thật khi
// log Worker câm"). Sandbox không gọi được ra internet và `wrangler tail` thì
// từng im lặng cả ngày, nên khi trợ lý hỏng trên tên miền thật, `hong_o_buoc`
// trong phúc đáp là thứ duy nhất nói được hỏng ở đâu.
export class LoiLLM extends Error {
  constructor(buoc, chiTiet, ma = null) {
    super(`${buoc}: ${chiTiet}`);
    this.buoc = buoc;
    this.ma = ma;
  }
}

// Trả null khi CHƯA cấu hình — đúng khuôn pushCauHinh()/mailerConfigured():
// thiếu khoá thì route trả 503, giao diện ẩn nút, mọi thứ còn lại chạy bình
// thường. Không bao giờ trả chính khoá ra ngoài hàm này.
export function llmCauHinh(env) {
  const khoa = env.DEEPSEEK_API_KEY;
  if (!khoa) return null;
  return { co_khoa: true, model: env.LLM_MODEL || MODEL_MAC_DINH };
}

/**
 * Gọi một lượt hỏi đáp.
 * @param he     {string}  lời hệ thống (vai trò + nền tri thức + bối cảnh)
 * @param tin    {Array}   [{ vai: 'nguoi'|'tro_ly', noi_dung }] theo thứ tự thời gian
 * @returns      { tra_loi, token_vao, token_ra, token_dem, model }
 */
export async function goiLLM(env, { he, tin, model, max_tokens = 3000 }) {
  const cf = llmCauHinh(env);
  if (!cf) throw new LoiLLM('chua_cau_hinh', 'thiếu DEEPSEEK_API_KEY trong Worker');

  const dung = model || cf.model;
  const body = {
    model: dung,
    max_tokens,
    messages: [
      { role: 'system', content: he },
      ...tin.map(t => ({ role: t.vai === 'nguoi' ? 'user' : 'assistant', content: t.noi_dung })),
    ],
  };
  // Nhiệt độ thấp vì luật cứng nhất của trợ lý là KHÔNG BỊA số và nguồn.
  if (!MODEL_SUY_LUAN.has(dung)) body.temperature = 0.3;

  // Ngoài khối try: dichGoi() ném LoiLLM('cau_hinh_sai') của riêng nó, lọt vào
  // catch bên dưới thì bước hỏng bị ghi đè thành 'goi_api' và câu báo nói sai
  // chỗ — đúng thứ `hong_o_buoc` sinh ra để tránh.
  const dich = dichGoi(env);

  let tra;
  try {
    tra = await fetch(dich, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify(body),
      // Không có cái này thì một lượt gọi treo sẽ giữ nguyên request của học
      // viên tới khi runtime tự cắt, và họ chỉ thấy màn hình quay mãi.
      signal: AbortSignal.timeout(60_000),
    });
  } catch (err) {
    const het = err?.name === 'TimeoutError' || err?.name === 'AbortError';
    throw new LoiLLM(het ? 'qua_lau' : 'goi_api', String(err));
  }

  if (!tra.ok) {
    // Đọc một đoạn ngắn của thân lỗi: đủ để biết sai khoá, hết hạn mức hay
    // sai tên model, mà không đổ cả trang lỗi vào phúc đáp.
    const text = await tra.text().catch(() => '');
    throw new LoiLLM('api_tu_choi', `HTTP ${tra.status} ${text.slice(0, 300)}`, tra.status);
  }

  let data;
  try {
    data = await tra.json();
  } catch (err) {
    throw new LoiLLM('phuc_dap_la', `không đọc được JSON: ${err}`);
  }

  const traLoi = data?.choices?.[0]?.message?.content;
  if (typeof traLoi !== 'string' || !traLoi.trim()) {
    throw new LoiLLM('phuc_dap_rong', `không có nội dung trả lời (${JSON.stringify(data).slice(0, 200)})`);
  }

  const u = data.usage || {};
  return {
    tra_loi: traLoi.trim(),
    token_vao: u.prompt_tokens ?? 0,
    token_ra: u.completion_tokens ?? 0,
    // DeepSeek tự đệm phần đầu prompt, không cần khai báo gì — nhưng có báo
    // lại bao nhiêu token trúng đệm. Ghi ra để biết việc xếp phần TĨNH lên
    // trước (nền tri thức) có thật sự ăn đệm hay không, thay vì tin suông.
    token_dem: u.prompt_cache_hit_tokens ?? 0,
    model: dung,
  };
}
