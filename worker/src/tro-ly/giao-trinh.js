// Nền tri thức của Trợ lý KHKD — rút từ ĐÚNG HAI tài liệu Ngô Phú Cường cung
// cấp ngày 12/9, không thêm gì của tôi:
//
//   1. "Hướng dẫn xây dựng và bảo vệ Kế hoạch Kinh doanh cuối khóa" (PDF, 23
//      trang, bộ CEO K2) — THƯỚC CHẤM: hội đồng nhìn bài bằng mắt nào, sáu
//      cổng kiểm soát, sáu lỗi mất niềm tin, ngân hàng câu hỏi phản biện.
//   2. "Hướng dẫn lập KHKD" (Word) — ĐẶC TẢ CẤU TRÚC. Tệp này có một đặc
//      điểm quý: CHỮ ĐỎ là yêu cầu của giảng viên, CHỮ ĐEN là ví dụ minh hoạ
//      (case RiVita). Tách được bằng máy: 1.698 ký tự đỏ / 37.448 ký tự đen.
//      Bảy phần đánh số + phần sản phẩm mở đầu khớp ĐÚNG KHÍT tám phần bài
//      đang có trong ứng dụng (migration 0003) — nên không đổi khung.
//
// Vì sao tách làm ba khối chứ không nhét một cục: THUOC_CHAM và YEU_CAU_PHAN
// đứng yên tuyệt đối giữa mọi lượt gọi của mọi nhóm nên đặt được breakpoint
// prompt caching lên chúng (đọc lại chỉ còn ~10% giá). VI_DU_PHAN thì chỉ nạp
// đúng phần đang bàn — vừa rẻ hơn vừa đúng trọng tâm hơn.

/* ══ KHỐI 1: THƯỚC CHẤM (từ PDF) ═══════════════════════════════════════════
   Đây là phần làm trợ lý khác một mô hình ngôn ngữ nói chuyện chung chung:
   nó không tự nghĩ ra tiêu chí, nó chấm bằng đúng thước hội đồng sẽ dùng. */
export const THUOC_CHAM = `# THƯỚC CHẤM CỦA HỘI ĐỒNG (trích tài liệu giảng viên)

## Bài thắng là giao của bốn điều kiện — thiếu một là rơi khỏi nhóm dẫn đầu
1. ĐÚNG Ý GIẢNG VIÊN — bám sát tám nội dung tối thiểu và tiêu chí chấm.
2. KHÁC BIỆT CHIẾN LƯỢC — lý do khách hàng chọn ta, đối thủ khó sao chép.
3. CÓ SỐ LIỆU — giả định rõ nguồn, mô hình tính ra được.
4. TRIỂN KHAI ĐƯỢC — ai làm, bao nhiêu tiền, khi nào biết đúng sai.

## Ba lăng kính chấm — một kế hoạch bị soi bằng ba con mắt khác nhau
- THẦY KIM (Kế hoạch Kinh doanh — ƯU TIÊN CAO NHẤT): "Kế hoạch này có triển
  khai được không?" Soi: mục tiêu cụ thể và giả định đứng sau; việc gì làm
  trước, ai chịu trách nhiệm; nguồn lực, mốc kiểm chứng, KPI, phương án B.
- THẦY VIỆT ANH (Chiến lược Kinh doanh): "Vì sao doanh nghiệp này sẽ thắng?"
  Soi: định vị và khách hàng mục tiêu; lợi thế khó sao chép; những đánh đổi
  đã chọn.
- THẦY ĐỨC (Quản trị Tài chính): "Các giả định có vững không?" Soi: driver
  tạo ra doanh thu; biên gộp, điểm hòa vốn, dòng tiền; kịch bản và độ nhạy.

## Chuỗi cam kết của lăng kính Thầy Kim — đứt một mắt là một câu không trả lời được
Mục tiêu (cụ thể, đo được) → Giả định (dựa trên cơ sở nào) → Hành động (việc
gì làm trước) → Nguồn lực (người, tiền, thời gian) → Milestone (mốc kiểm
chứng) → KPI (đúng/sai đo bằng gì) → Phương án B (sai thì làm gì).
CÂU HỎI KHÓA: "Nếu mai bắt đầu, 90 ngày đầu tiên nhóm làm gì — ai chịu trách
nhiệm — cần bao nhiêu tiền?"

## Chọn đề tài — quyết định một nửa chất lượng bài
1. Doanh nghiệp của thành viên trong nhóm — dữ liệu thật, dùng được ngay sau
   khóa học. BAN TỔ CHỨC KHUYẾN KHÍCH vì tính thực tiễn cao.
2. Doanh nghiệp niêm yết hoặc đại chúng — thông tin công khai dễ kiểm chứng,
   nhưng khó có chiều sâu vận hành và người chịu trách nhiệm.
3. Dự án hoặc mô hình kinh doanh mới — sáng tạo nhất, nhưng gần như mọi con
   số đều là giả định, phải chứng minh nhiều hơn.
Chọn hướng 1 thì trả lời được câu khó nhất của hội đồng: "ai làm và lấy tiền
ở đâu?"

## Sáu cổng kiểm soát trước khi nộp — DÙNG ĐÂY LÀM KHUNG PHÂN TÍCH KHOẢNG TRỐNG
01 SƯỜN — đủ tám nội dung, không phần nào bị bỏ rơi giữa chừng.
02 SỐ — doanh thu, chi phí và dòng tiền khớp nhau, không mâu thuẫn.
03 NGUỒN — mọi con số quan trọng có nguồn, hoặc ghi rõ chỗ còn thiếu.
04 LOGIC — thị trường → bán hàng → công suất → tài chính nối liền một mạch.
05 KHẢ THI — mỗi việc có người phụ trách, mốc thời gian và ngân sách.
06 PHẢN BIỆN — trả lời được mười câu hỏi khó nhất về bài của mình.

## Sáu lỗi làm hội đồng mất niềm tin
✕ Nhiều mô hình, không có quyết định — vẽ đủ SWOT, PEST, 5 Forces rồi không chọn gì.
✕ Thị trường rất lớn — không thu hẹp được đến khách hàng thật.
✕ Số liệu không có driver — doanh thu tăng mà không nói tăng nhờ đâu.
✕ AI bịa nguồn — trích dẫn nghe hay nhưng không tra được.
✕ Slide quá nhiều chữ — người trình bày đứng đọc slide.
✕ Không trả lời được về dòng tiền — có lãi trên giấy nhưng không biết tiền về khi nào.
"Mất niềm tin ở một điểm, cả bài bị đọc lại bằng con mắt nghi ngờ."

## Kỷ luật dữ liệu — gắn nhãn ngay từ bản nháp, KỂ CẢ KHI LÀM VỚI AI
[FACT] Sự thật — điều đã xảy ra và kiểm chứng được. Phải có nguồn: báo cáo,
  hợp đồng, hệ thống.
[ASSUMPTION] Giả định — điều ta tin sẽ đúng nhưng chưa chắc. Phải nêu cơ sở và
  mức độ nhạy cảm.
[TARGET] Mục tiêu — điều ta cam kết đạt. Phải có mốc kiểm chứng và người chịu
  trách nhiệm.
Bài đạt giải nhất để hẳn một phụ lục liệt kê mọi giả định và cơ sở dự báo.

## Thị trường — rộng phải thu hẹp được đến khách hàng trả tiền
TAM (toàn bộ nhu cầu) → SAM (phần phục vụ được) → SOM (phần thực giành được).
Bốn lớp bằng chứng cho một tuyên bố thị trường: nguồn công khai · dữ liệu nội
bộ · phỏng vấn khách hàng · thử nghiệm bán thật.
ICP — chân dung khách hàng lý tưởng, phải có: số tài khoản mục tiêu · tần suất
mua trong năm · giá trị trung bình mỗi đơn · tỷ lệ chuyển đổi từng bước phễu ·
chi phí có được một khách (CAC).

## Lợi thế cạnh tranh — bốn phép thử
1. ĐÁNG GIÁ — khách hàng có trả tiền cho điều đó không?
2. HIẾM — bao nhiêu đối thủ đang làm được?
3. KHÓ SAO CHÉP — sao chép mất bao lâu và tốn những gì?
4. KHAI THÁC ĐƯỢC — bộ máy hiện tại có đủ sức khai thác không?
Mục tiêu: thời gian đối thủ cần để sao chép phải DÀI HƠN thời gian mình cần để
mở rộng. Khác biệt là giao của nhiều năng lực, không phải một câu slogan.

## Từ tư tưởng đến vận hành — hội đồng tin cơ chế, không tin lời hứa
Triết lý (điều doanh nghiệp tin) → Quy trình (cách làm bắt buộc) → KPI (chỉ số
theo dõi) → Bằng chứng (dữ liệu chứng minh).
Khi mượn nguyên lý của doanh nghiệp lớn (Toyota, Amazon, Xiaomi, BYD,
Samsung): chọn ĐÚNG MỘT nguyên lý phù hợp, chỉ rõ nó nằm trong quy trình nào
đang chạy hằng ngày, gắn quy trình đó với một chỉ số đo được, kèm bằng chứng
(SOP, báo cáo, nhật ký hệ thống). Trích khẩu hiệu thì ai cũng làm được.

## Mô hình tài chính — năm câu hội đồng chắc chắn hỏi
1. Base, Bull, Bear khác nhau ở giả định nào?
2. Hòa vốn ở mức sản lượng và thời điểm nào?
3. Vốn lưu động có tăng nhanh hơn doanh thu không?
4. Mô hình nhạy nhất với giá, sản lượng hay giá vốn?
5. Cần bao nhiêu vốn, giải ngân theo mốc nào?
Mạch tính: Khách hàng → Sản lượng → Giá → Doanh thu (Volume × Price) → Biên
gộp → Chi phí vận hành (OPEX) → Dòng tiền → Vốn cần theo milestone.

## Rủi ro — làm kế hoạch đáng tin hơn, không yếu đi
Nêu 3–5 rủi ro lớn nhất, MỖI rủi ro đi đủ SÁU Ô: rủi ro · dấu hiệu kích hoạt ·
hành động phòng ngừa · phương án dự phòng · người phụ trách · rủi ro còn lại.
Nói được "rủi ro còn lại" là dấu hiệu của người đã tính kỹ.

## Ngày bảo vệ — sáu bước, không phải tám chương
Vấn đề → Cơ hội → Lựa chọn → Hệ năng lực → Tiền → 90 ngày tới.
Chi tiết để dành cho phụ lục và phần hỏi đáp.
BA CÂU HỎI GẦN NHƯ CHẮC CHẮN SẼ ĐẾN:
1. "Vì sao đối thủ không làm được như anh chị?"
2. "Nếu doanh thu chỉ đạt 70% kế hoạch thì dòng tiền ra sao?"
3. "90 ngày đầu ai làm gì, và mốc nào quyết định đi tiếp hay dừng?"

## Cách tổ chức nhóm — bốn vai, một người chốt
Trưởng nhóm (điều phối, chốt phạm vi, sở hữu câu chuyện xuyên suốt) · Người
tổng hợp và dựng slide (giữ mô hình dữ liệu, mọi con số truy được về một ô
tính) · Người thuyết trình chính (kể chuyện, không đọc slide, tập ít nhất hai
lần có bấm giờ) · Người hỗ trợ phản biện (đóng vai hội đồng tập dượt trước).
Nhịp bảy ngày: D1 chọn đề tài · D2 khóa dữ liệu · D3 viết tám phần · D4 mô
hình tài chính · D5 bản đầy đủ · D6 dựng slide · D7 tập bảo vệ.
Một bộ số · một người chốt · một file gốc · một lịch review.

## RANH GIỚI CỦA AI — giảng viên nói rõ trong tài liệu
AI LÀM ĐƯỢC: dựng khung, viết nháp, sắp xếp lập luận; tính toán mô hình TỪ SỐ
LIỆU HỌC VIÊN ĐƯA VÀO.
CHỈ HỌC VIÊN LÀM ĐƯỢC: chọn đánh ở đâu và chấp nhận bỏ gì; cung cấp số thật
của doanh nghiệp và thị trường.
Và câu quan trọng nhất về cách dùng AI: "Khi nhờ AI rà bài, hãy yêu cầu nó TÌM
LỖI VÀ MÂU THUẪN — đừng yêu cầu nó khen bài."
"Bài tốt không phải bài viết nhiều nhất — là bài trả lời được nhiều câu hỏi nhất."`;

/* ══ KHỐI 2: YÊU CẦU TỪNG PHẦN (từ chữ đỏ file Word) ══════════════════════
   Chỉ số mảng = plan_sections.ord (0-7), khớp migration 0003.
   `nguyen_van: true` nghĩa là chép NGUYÊN VĂN chữ đỏ của giảng viên. Ba phần
   còn lại (0, 6, 7) file Word KHÔNG có chữ đỏ — yêu cầu ở đó suy ra từ PDF và
   được đánh dấu `nguyen_van: false`, để trợ lý nói đúng mức độ chắc chắn thay
   vì trình bày suy luận của tôi như lời giảng viên. */
export const YEU_CAU_PHAN = [
  {
    ord: 0, ten: 'Sản phẩm và khách hàng mục tiêu', nguyen_van: false,
    yeu_cau:
      'Nêu rõ sản phẩm / dịch vụ của đề tài và các nhóm khách hàng mục tiêu. ' +
      'Mỗi nhóm khách hàng phải nói được họ cần gì ở sản phẩm này. Đây là phần ' +
      'chốt lý do để tin: đọc xong hội đồng phải hiểu ta bán gì, cho ai, và vì ' +
      'sao người đó cần.',
  },
  {
    ord: 1, ten: 'Nghiên cứu Marketing', nguyen_van: true,
    yeu_cau:
      'Phần này cần tính được quy mô (size) của phân khúc thị trường mục tiêu ' +
      'và tốc độ tăng trưởng của phân khúc thị trường mục tiêu này trong những ' +
      'năm tới, đồng thời trình bày kết quả nghiên cứu nhu cầu, hành vi … của ' +
      'khách hàng trong phân khúc này đối với sản phẩm / dịch vụ của công ty.',
  },
  {
    ord: 2, ten: 'Kế hoạch Marketing', nguyen_van: true,
    yeu_cau:
      'Phần này cần trình bày được kế hoạch marketing để làm sao cho công ty ' +
      'bán được sản phẩm / dịch vụ tới đối tượng khách hàng mục tiêu với chỉ ' +
      'tiêu về doanh thu / khách hàng như dự kiến, khả thi về ngân sách ' +
      'marketing và đem lại lợi nhuận cho công ty. Trả lời được câu hỏi: tại ' +
      'sao khách hàng trong phân khúc này lại quan tâm đến / chọn mua sản phẩm ' +
      '/ dịch vụ của công ty (mà không phải là của các đối thủ cạnh tranh).',
  },
  {
    ord: 3, ten: 'Kế hoạch Nhân sự', nguyen_van: true,
    yeu_cau:
      'Phần này cần thuyết phục được hội đồng / nhà đầu tư rằng công ty có đủ ' +
      'nhân sự (chủ chốt) trong những lĩnh vực cần thiết để triển khai thành ' +
      'công kế hoạch kinh doanh này; hoặc có phương án xây dựng đội ngũ nhân sự ' +
      'khả thi, trong phạm vi ngân sách cho phép.',
  },
  {
    ord: 4, ten: 'Kế hoạch Sản xuất và Tác nghiệp', nguyen_van: true,
    yeu_cau:
      'Phần này cần thuyết phục được hội đồng / nhà đầu tư rằng công ty sở hữu ' +
      'công nghệ ưu việt hoặc phù hợp hoặc các nguồn lực quan trọng khác như: ' +
      'đất đai, vị trí, nhà xưởng, máy móc, trang thiết bị, phần mềm, patent ' +
      '(bản quyền phát minh, sáng chế …), quy trình quản trị chuỗi cung ứng / ' +
      'quản lý chất lượng, logistics … để có thể cung cấp sản phẩm / dịch vụ ' +
      'cho khách hàng một cách hiệu quả, đáp ứng nhu cầu của khách hàng.',
  },
  {
    ord: 5, ten: 'Kế hoạch Tài chính', nguyen_van: true,
    yeu_cau:
      'Phần này cần đưa ra những tính toán, phân tích tài chính để thuyết phục ' +
      'hội đồng / nhà đầu tư rằng dự án này sẽ đem lại doanh thu / lợi nhuận ' +
      'với tỷ suất hấp dẫn và khả thi. Đặc biệt, cần tính toán tổng vốn đầu tư ' +
      'cần có để triển khai thành công dự án này và đề xuất huy động vốn từ ' +
      'những nguồn nào, phương án huy động vốn …',
  },
  {
    ord: 6, ten: 'Lộ trình thực hiện', nguyen_van: false,
    yeu_cau:
      'Chia lộ trình thành các giai đoạn theo năm hoặc theo quý, mỗi giai đoạn ' +
      'một mục tiêu ĐO ĐƯỢC. Riêng 90 ngày đầu phải chi tiết tới mức trả lời ' +
      'được câu khóa của hội đồng: việc gì làm trước, ai chịu trách nhiệm, cần ' +
      'bao nhiêu tiền, và mốc nào quyết định đi tiếp hay dừng.',
  },
  {
    ord: 7, ten: 'Kế hoạch Dự phòng rủi ro', nguyen_van: false,
    yeu_cau:
      'Nêu 3–5 rủi ro lớn nhất. Mỗi rủi ro phải đi đủ sáu ô: rủi ro · dấu hiệu ' +
      'kích hoạt · hành động phòng ngừa · phương án dự phòng · người phụ trách ' +
      '· rủi ro còn lại. Nói được rủi ro còn lại là dấu hiệu của người đã tính kỹ.',
  },
];

/* ══ KHỐI 3: VÍ DỤ MINH HOẠ (chữ đen file Word, case RiVita) ══════════════
   Rút gọn còn xương sống của từng phần — mục đích DUY NHẤT là cho trợ lý một
   mốc so sánh về ĐỘ SÂU mong đợi, không phải để chép lại cho học viên.
   Nạp riêng theo phần đang bàn, không nằm trong khối cache chung. */
export const VI_DU_PHAN = [
  'RiVita — nước uống lợi khuẩn từ gạo. Sản phẩm: thức uống giải khát không từ ' +
  'sữa, 100% nguyên liệu Việt. Bốn nhóm khách hàng, mỗi nhóm một nhu cầu riêng: ' +
  'người trẻ (hợp thời, giá rẻ), người yêu thể thao (bù nước gốc thực vật), ' +
  'chuyên gia bận rộn (vấn đề đường ruột do căng thẳng), gia đình (gói thân ' +
  'thiện, tự nhiên cho trẻ em và người già).',

  'RiVita: CAGR thị trường lợi khuẩn 11,63% giai đoạn 2025–2032; 72,37% thị ' +
  'phần thuộc đơn vị nhỏ và vừa; 70% hộ gia đình thành thị tiêu thụ lợi khuẩn ' +
  'hàng tuần; hơn 50% Gen Y/Z ưu tiên sản phẩm gốc thực vật. Kèm khảo sát hành ' +
  'vi khách hàng và phân tích cạnh tranh riêng. Mức độ mong đợi: con số có năm, ' +
  'có tỷ lệ, có nguồn — không phải "thị trường rất tiềm năng".',

  'RiVita: định vị "Tinh hoa gạo Việt – Sức khỏe Việt", rồi so sánh kênh phân ' +
  'phối truyền thống (GT) với hiện đại (MT) có bảng tổng kết ưu thế từng kênh, ' +
  'trước khi chọn. Mức độ mong đợi: nêu lựa chọn kênh và LÝ DO chọn, kèm chỉ ' +
  'tiêu doanh thu và ngân sách marketing.',

  'RiVita: triết lý nhân sự "Kỹ thuật số – Chuyên gia – Tốc độ", rồi cấu trúc ' +
  'bộ máy và định biên, kế hoạch đào tạo, hệ thống KPI đánh giá, chính sách thu ' +
  'hút và giữ chân. Mức độ mong đợi: có sơ đồ trách nhiệm rõ ai làm gì, không ' +
  'chỉ liệt kê chức danh.',

  'RiVita: chiến lược nguồn cung và nguyên liệu; quy trình sản xuất và công ' +
  'nghệ; số hóa vận hành; chuỗi cung ứng lạnh và logistics; tác nghiệp đa kênh; ' +
  'định hướng sản xuất xanh. Kèm khung kiểm soát chất lượng có ngưỡng số: tỷ lệ ' +
  'sống của lợi khuẩn ≥ 99%, tỷ lệ lỗi < 1%, ≥ 80% nguồn gạo địa phương.',

  'RiVita: mục tiêu tài chính và dự báo doanh thu; chi phí sản xuất và giá vốn ' +
  '(COGS); phân bổ chi phí hoạt động (OpEx); kế hoạch đầu tư vốn (CapEx); quản ' +
  'trị dòng tiền và điểm hòa vốn; các chỉ số tài chính then chốt. Mức độ mong ' +
  'đợi: sáu mục này đủ cả, và các con số nối được với nhau.',

  'RiVita: bốn giai đoạn theo năm — 2026 R&D và ra mắt thử nghiệm (500 cửa hàng ' +
  'WinCommerce); 2027 triển khai đại trà toàn quốc; 2028 mở rộng 2–4 mã hàng ' +
  'mới, mục tiêu 8,9% thị phần; 2029 thử nghiệm xuất khẩu. Mức độ mong đợi: mỗi ' +
  'giai đoạn có mục tiêu đo được, không phải một dòng mô tả.',

  'RiVita: rủi ro thị trường (cạnh tranh từ thương hiệu lớn / nhãn riêng siêu ' +
  'thị) → đổi mới sản phẩm liên tục, xây cộng đồng; rủi ro chuỗi cung ứng (biến ' +
  'động giá gạo) → hợp đồng liên kết dài hạn với nông dân và hợp tác xã để chốt ' +
  'giá; rủi ro niềm tin (hàng giả hàng nhái) → mã QR truy xuất nguồn gốc; rủi ro ' +
  'pháp lý (chậm phê duyệt công bố) → làm việc sớm với cơ quan an toàn thực phẩm.',
];

// Ghép khối cache chung: thước chấm + yêu cầu cả tám phần. Đứng yên tuyệt đối
// giữa mọi nhóm, mọi phiên — đây là thứ đặt cache_control lên.
export function nenTriThuc() {
  const phan = YEU_CAU_PHAN.map(p =>
    `### Phần ${p.ord + 1}. ${p.ten}\n${p.yeu_cau}` +
    (p.nguyen_van ? '' : '\n(Yêu cầu phần này suy ra từ thước chấm, không phải nguyên văn tài liệu.)')
  ).join('\n\n');
  return `${THUOC_CHAM}\n\n# YÊU CẦU TỪNG PHẦN (nguyên văn hướng dẫn lập KHKD)\n\n${phan}`;
}
