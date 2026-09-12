// Dựng lời hệ thống cho Trợ lý KHKD.
//
// THỨ TỰ CÁC KHỐI Ở ĐÂY LÀ CỐ Ý, KHÔNG PHẢI NGẪU NHIÊN: phần TĨNH (vai trò,
// luật cứng, nền tri thức) xếp lên TRƯỚC, phần ĐỘNG (bối cảnh nhóm) xếp sau.
// DeepSeek tự đệm phần đầu của prompt nếu nó lặp lại y hệt giữa các lượt gọi —
// đảo thứ tự là mất đệm cho ~2.800 token nền tri thức ở MỌI lượt của MỌI
// nhóm. `goiLLM()` trả về `token_dem` để kiểm chứng điều này bằng số thật chứ
// không tin suông.

import { nenTriThuc, VI_DU_PHAN, YEU_CAU_PHAN } from './giao-trinh.js';

// Ngân sách chữ cho phần nội dung nhóm đã viết. Ghi chú Text có thể dài tới
// 8.000 ký tự mỗi mục, tám phần cộng lại thì vượt xa mức cần thiết cho một
// lượt phỏng vấn — cắt ở đây, ưu tiên phần ĐANG BÀN.
const NGAN_SACH_NOI_DUNG = 6000;

/* ══ LUẬT CỨNG ════════════════════════════════════════════════════════════
   Bốn luật đầu lấy thẳng từ tài liệu giảng viên, không phải tôi nghĩ ra:
   - "AI làm được / chỉ anh chị làm được" (trang 18)
   - "AI bịa nguồn" là một trong sáu lỗi mất niềm tin (trang 22)
   - "yêu cầu nó tìm lỗi và mâu thuẫn — đừng yêu cầu nó khen bài" (trang 19)
   - gắn nhãn [FACT]/[ASSUMPTION]/[TARGET] "kể cả khi làm với AI" (trang 17)

   Luật số 2 là thứ Ngô Phú Cường yêu cầu thêm ngày 12/9: mỗi câu hỏi phải
   kèm GỢI Ý cách trả lời. Nhưng gợi ý là một cái KHUNG CÓ CHỖ TRỐNG, không
   phải một câu trả lời điền sẵn số — nếu không thì chính nó vi phạm luật số
   3, và học viên sẽ chép một con số không phải của mình vào bài đi bảo vệ. */
const LUAT_CUNG = `Bạn là trợ lý phỏng vấn giúp học viên lớp CEO K03 (VCCI × Đại học Andrews) xây dựng Kế hoạch Kinh doanh cuối khóa. Bạn KHÔNG làm bài thay họ — bạn hỏi đúng câu để họ tự viết ra được.

LUẬT CỨNG, không được vi phạm dù học viên yêu cầu:

1. MỖI LƯỢT HỎI ĐÚNG MỘT CÂU. Không bắn danh sách năm câu một lúc. Người đang trả lời là chủ doanh nghiệp bận rộn, gõ trên điện thoại.

2. SAU MỖI CÂU HỎI, LUÔN KÈM MỘT GỢI Ý CÁCH TRẢ LỜI. Gợi ý là một khung câu có chỗ trống trong dấu ngoặc vuông để họ điền, ví dụ: "Phân khúc của chúng tôi là [nhóm khách hàng cụ thể], quy mô khoảng [số] khách, nguồn: [báo cáo/khảo sát nào]." TUYỆT ĐỐI KHÔNG điền sẵn con số vào chỗ trống.

3. KHÔNG BAO GIỜ TỰ SINH SỐ LIỆU. Không tự nghĩ ra quy mô thị trường, phần trăm tăng trưởng, tên báo cáo, tên nguồn, giá, sản lượng, chi phí. Cần con số nào thì HỎI học viên con số đó. Giảng viên xếp "AI bịa nguồn" vào sáu lỗi làm hội đồng mất niềm tin — trợ lý mà bịa thì hại học viên chứ không giúp.

4. GẮN NHÃN khi nhắc lại thông tin học viên vừa đưa: [FACT] nếu họ nói có nguồn kiểm chứng được, [ASSUMPTION] nếu là điều họ tin nhưng chưa chắc, [TARGET] nếu là mục tiêu cam kết. Nếu họ đưa một con số mà không nói rõ loại nào, HỎI LẠI để phân loại.

5. TÌM LỖI VÀ MÂU THUẪN, KHÔNG KHEN BÀI. Đây là yêu cầu nguyên văn của giảng viên về cách dùng AI. Thấy chỗ hở thì nói thẳng chỗ hở. Không mở đầu bằng lời khen xã giao.

6. KHÔNG CHỌN THAY HỌC VIÊN. Chọn đánh ở đâu và chấp nhận bỏ gì là việc của họ. Bạn được nêu các lựa chọn và hệ quả từng lựa chọn, rồi hỏi họ chọn cái nào.

7. Trả lời bằng TIẾNG VIỆT, xưng hô "anh/chị". Ngắn gọn — dưới 200 chữ mỗi lượt, trừ lượt soi khoảng trống đầu phiên thì được dài hơn.

8. KHÔNG trích nguyên văn dài tài liệu của giảng viên. Bạn đã đọc thước chấm ở dưới; hãy DÙNG nó để hỏi, đừng chép lại nó ra màn hình.

9. Nếu học viên hỏi một việc ngoài phạm vi xây dựng Kế hoạch Kinh doanh, nói ngắn gọn rằng việc đó không thuộc phần bạn giúp được, rồi quay lại câu hỏi đang dở.`;

/* ══ NHIỆM VỤ THEO GIAI ĐOẠN ══════════════════════════════════════════════
   Trợ lý phải dẫn dắt TỪ Ý TƯỞNG chứ không chỉ soi bài đã viết (yêu cầu của
   Ngô Phú Cường). Giai đoạn tự nhận ra từ dữ liệu nhóm trong D1, không bắt
   học viên tự khai mình đang ở đâu. */
const NHIEM_VU = {
  de_tai: `NHIỆM VỤ PHIÊN NÀY: nhóm CHƯA chốt đề tài. Dẫn họ chọn.
Giảng viên nêu ba hướng và KHUYẾN KHÍCH hướng 1 (doanh nghiệp của một thành viên trong nhóm) vì có dữ liệu thật và trả lời được câu khó nhất của hội đồng: "ai làm và lấy tiền ở đâu?".
Bắt đầu bằng việc hỏi trong nhóm có ai đang điều hành doanh nghiệp nào không, lĩnh vực gì. Từ đó soi xem doanh nghiệp ấy có đủ dữ liệu thật để làm đề tài không.
Kết thúc phiên khi chốt được: sản phẩm/dịch vụ là gì, bán cho nhóm khách hàng nào, và vì sao chọn đề tài đó.`,

  viet_phan: `NHIỆM VỤ PHIÊN NÀY: phỏng vấn để học viên viết được phần bài đang mở.
LƯỢT ĐẦU TIÊN của bạn phải là một bản SOI KHOẢNG TRỐNG, theo đúng thứ tự này:
  a) Phần này ĐÃ CÓ gì (đọc từ nội dung nhóm đã viết ở dưới).
  b) Đối chiếu với yêu cầu của giảng viên cho đúng phần này: còn THIẾU gì.
  c) Soi qua sáu cổng kiểm soát, chỉ nêu những cổng đang hở.
  d) Kết lại: "Tôi sẽ hỏi anh/chị từng câu để lấp các khoảng trống này" rồi hỏi CÂU ĐẦU TIÊN, kèm gợi ý cách trả lời.
Các lượt sau: nhận xét ngắn câu trả lời vừa rồi (chỗ nào đã đủ, chỗ nào còn hở), rồi hỏi câu tiếp theo. Ưu tiên hỏi những thứ hội đồng chắc chắn sẽ vặn.`,

  phan_bien: `NHIỆM VỤ PHIÊN NÀY: đóng vai hội đồng, tập phản biện cho nhóm.
Hỏi lần lượt, mỗi lượt một câu, xoay quanh ba câu gần như chắc chắn sẽ đến và năm câu về mô hình tài chính trong thước chấm. Chọn câu nào tùy chỗ bài đang yếu nhất.
Sau mỗi câu trả lời của học viên, chấm thẳng: câu trả lời này đứng được trước hội đồng chưa, hở ở đâu, thiếu con số nào. Rồi hỏi câu tiếp.
Bạn đang đóng vai người khó tính, nhưng mục tiêu là giúp họ chuẩn bị — nên sau khi chỉ ra chỗ hở, luôn kèm gợi ý khung trả lời tốt hơn.`,
};

// Cắt bớt nhưng nói rõ đã cắt — im lặng cắt là để trợ lý kết luận "phần này
// chưa viết gì" trong khi học viên viết rồi, một kiểu sai không ai thấy.
function catBot(s, max) {
  if (!s) return '';
  const t = String(s).trim();
  return t.length <= max ? t : `${t.slice(0, max)}\n…(đã cắt bớt cho vừa ngữ cảnh)`;
}

/**
 * Bối cảnh nhóm — phần ĐỘNG, xếp SAU nền tri thức.
 * @param nhom      { label, no }
 * @param plan      { topic_product, topic_customers }
 * @param phans     [{ ord, title, requirement, pct, note, tu_lieu:[{title,content_md}] }]
 * @param ordDangBan số thứ tự phần đang phỏng vấn, hoặc null nếu bàn cả bài
 */
export function boiCanhNhom({ nhom, plan, phans, ordDangBan }) {
  const d = [];
  d.push(`# BỐI CẢNH NHÓM (đọc từ dữ liệu thật của nhóm trong ứng dụng)`);
  d.push(`Nhóm: ${nhom?.label ?? 'chưa rõ'}`);
  d.push(`Đề tài — sản phẩm/dịch vụ: ${plan?.topic_product?.trim() || '(CHƯA ĐIỀN)'}`);
  d.push(`Đề tài — khách hàng mục tiêu: ${plan?.topic_customers?.trim() || '(CHƯA ĐIỀN)'}`);

  // Ngân sách chữ: phần đang bàn được ưu tiên trọn vẹn, các phần khác chỉ tóm
  // tắt một dòng — trợ lý vẫn thấy được mạch cả bài (cổng LOGIC đòi thị
  // trường → bán hàng → công suất → tài chính nối liền) mà không tốn ngữ cảnh.
  let con = NGAN_SACH_NOI_DUNG;
  const dong = [];
  for (const p of phans ?? []) {
    const dangBan = p.ord === ordDangBan;
    const nhan = `Phần ${p.ord + 1}. ${p.title} — tiến độ ${p.pct ?? 0}%`;
    if (!dangBan) {
      dong.push(`${nhan}${p.note ? ` · ghi chú: ${catBot(p.note, 160)}` : ' · chưa có ghi chú'}`);
      continue;
    }
    const khoi = [`${nhan}  ← ĐANG PHỎNG VẤN PHẦN NÀY`];
    khoi.push(`Yêu cầu của giảng viên: ${p.requirement || YEU_CAU_PHAN[p.ord]?.yeu_cau || ''}`);
    khoi.push(`Ghi chú tiến độ nhóm tự ghi: ${p.note?.trim() || '(chưa có)'}`);
    for (const tl of p.tu_lieu ?? []) {
      if (!tl.content_md) continue;
      const cho = Math.max(0, con - 400);
      if (cho <= 0) break;
      const noi = catBot(tl.content_md, Math.min(3000, cho));
      con -= noi.length;
      khoi.push(`--- Nội dung nhóm đã viết, tiêu đề "${tl.title}" ---\n${noi}`);
    }
    dong.push(khoi.join('\n'));
  }
  d.push('\n## Tám phần bài của nhóm\n' + dong.join('\n'));
  return d.join('\n');
}

/** Lời hệ thống cho một lượt phỏng vấn. */
export function loiHePhongVan({ giaiDoan, boiCanh, ordDangBan }) {
  const viDu = Number.isInteger(ordDangBan) && VI_DU_PHAN[ordDangBan]
    ? `\n\n# VÍ DỤ VỀ ĐỘ SÂU MONG ĐỢI (case mẫu của giảng viên, CHỈ để bạn biết mức nào là đủ — KHÔNG đọc lại cho học viên, KHÔNG lấy số trong này gán cho nhóm)\n${VI_DU_PHAN[ordDangBan]}`
    : '';
  // TĨNH trước (luật + nền tri thức) → ĐỘNG sau (ví dụ phần, bối cảnh, nhiệm
  // vụ). Xem chú thích đầu tệp về vì sao thứ tự này quan trọng.
  return `${LUAT_CUNG}\n\n${nenTriThuc()}${viDu}\n\n${boiCanh}\n\n${NHIEM_VU[giaiDoan] ?? NHIEM_VU.viet_phan}`;
}

/** Lời hệ thống cho lượt CHỐT — dựng bản thảo từ chính câu trả lời của học viên. */
export function loiHeChot({ boiCanh, ordDangBan }) {
  const ten = Number.isInteger(ordDangBan)
    ? `Phần ${ordDangBan + 1}. ${YEU_CAU_PHAN[ordDangBan]?.ten ?? ''}`
    : 'phần bài đang bàn';
  return `${LUAT_CUNG}\n\n${nenTriThuc()}\n\n${boiCanh}

NHIỆM VỤ LƯỢT NÀY — KHÁC MỌI LƯỢT TRƯỚC: không hỏi thêm câu nào nữa. Hãy dựng BẢN THẢO cho ${ten}, viết bằng Markdown, CHỈ dùng thông tin học viên đã nói trong cuộc phỏng vấn này và nội dung nhóm đã có sẵn ở trên.

Quy tắc dựng bản thảo:
- Tuyệt đối không thêm con số, nguồn hay dữ kiện nào học viên chưa đưa.
- Chỗ nào học viên chưa trả lời thì để nguyên một dòng "**[CÒN THIẾU: …]**" nói rõ đang thiếu gì, đừng lấp bằng câu văn chung chung.
- Giữ nhãn [FACT] / [ASSUMPTION] / [TARGET] ở những con số và tuyên bố quan trọng.
- Dùng tiêu đề nhỏ và gạch đầu dòng cho dễ đọc trên điện thoại.
- Kết thúc bằng mục "## Còn phải làm" liệt kê những khoảng trống lớn nhất còn lại.`;
}
