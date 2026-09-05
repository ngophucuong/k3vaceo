-- Nội dung Text cho buổi 4/9 (LEAN) — Ngô Phú Cường dán nguyên văn bản tóm
-- tắt bài giảng, cùng nội dung đã rút gọn thành ghi_chu ở migration 0024,
-- nay đưa đủ bằng tính năng "Nội dung Text" (migration 0025).
--
-- scope='class': đây là bài giảng chung cả khoá K03 (GV Huỳnh Minh Quốc),
-- không phải ghi chép riêng của Nhóm 6 — đúng khuôn "tư liệu Ban tổ chức phát
-- chung" đã dùng cho slide/tài liệu cấp lớp khác.
--
-- Guard NOT EXISTS theo (buoi_id, kind='TEXT'): chạy lại không tạo trùng, và
-- không đè lên nếu Ban cán sự lớp đã tự đăng một ghi chú Text khác cho đúng
-- buổi này trong lúc chờ migration này chạy.
INSERT INTO links (cohort_id, scope, group_id, buoi_id, title, kind, tag, content_md, created_by, created_at)
SELECT c.id, 'class', NULL, b.id,
       'Tóm tắt buổi 4/9 — Quản trị tinh gọn (LEAN)', 'TEXT', 'buoi',
'Dưới đây là nội dung chi tiết được tổng hợp từ bài giảng về hệ thống quản trị Lean, quy chuẩn 5S và quản trị trực quan, giúp bạn nắm bắt toàn bộ kiến thức cốt lõi mà không cần nghe lại các bản ghi:

### 1. Triết lý Quản trị Lean và "Ngôi nhà Lean"
*   **Bản chất của tự động hóa (Jidoka):** Tự động hóa không chỉ là mua máy móc hay phần mềm đắt tiền. Yếu tố then chốt là **con người quyết định chất lượng**; hệ thống phải trao quyền cho con người dừng dây chuyền khi phát hiện lỗi (như cách Toyota áp dụng) để giải quyết triệt để vấn đề.
*   **Quản trị chất lượng Six Sigma:** Mục tiêu là đạt tới mức độ sai lệch cực thấp. Ở cấp độ 6 Sigma, trong 1 triệu sản phẩm chỉ có khoảng **3,4 sản phẩm lỗi**.
*   **Mô hình Ngôi nhà Lean:**
    *   **Nền móng:** Là **5S** và **Quy chuẩn hóa**.
    *   **Thân nhà:** Gồm quản trị trực quan, Jidoka (tự động hóa có yếu tố con người) và Just-in-Time (đúng, đủ, kịp thời).
    *   **Mái nhà:** Là mục tiêu **loại bỏ lãng phí** và **phụng sự khách hàng**.
    *   *Lưu ý:* Nhiều doanh nghiệp thất bại (85%) do "xây nhà từ nóc" - chỉ tập trung loại bỏ lãng phí để tiết kiệm tiền mà không xây dựng nền móng 5S và quy chuẩn vững chắc.

### 2. Định nghĩa lại 5S (Tránh các sai lầm phổ biến)
Bài giảng nhấn mạnh việc dịch sai các chữ S cuối dẫn đến tư duy và hành động sai:
*   **S1, S2, S3 (Sàng lọc, Sắp xếp, Sạch sẽ):** Đây chỉ là mức độ vệ sinh công nghiệp cơ bản.
*   **S4 - Seiketsu (Standardize - Quy chuẩn hóa):** Thay vì dịch là "Săn sóc", cần hiểu đúng là **tiêu chuẩn hóa các quy trình** lặp đi lặp lại để ai cũng làm ra kết quả giống nhau (ví dụ: quy trình pha cà phê chuẩn).
*   **S5 - Shitsuke (Sustain - Duy trì):** Thay vì dịch là "Sẵn sàng", cần hiểu là **duy trì bền vững** các tiêu chuẩn đã lập ra theo thời gian.

### 3. Quản trị Trực quan (Visual Management)
*   **Nguyên lý:** "Cái gì không thấy thì không biết, không biết thì không đo lường, không đo lường thì không thể quản trị".
*   **Ứng dụng đèn giao thông:** Sử dụng màu sắc để nhận diện trạng thái: **Xanh** (Tốt/Thành tích), **Vàng** (Cần chú ý/Đo lường), **Đỏ** (Vấn đề nghiêm trọng/Cần xem xét).
*   **Báo cáo A4:** Một bản báo cáo hiệu quả phải giúp người quản lý nắm bắt nội dung cốt lõi trong dưới 30 giây thông qua việc highlight, phóng to thông số quan trọng và dùng mã màu.
*   **Cây mục tiêu trực quan:** Đối với doanh nghiệp nhỏ, có thể vẽ cây mục tiêu gồm: Tài chính, Doanh thu, Đội ngũ. Mỗi mục tiêu lớn chỉ nên có tối đa 3 hành động cốt lõi để tập trung thực hiện.

### 4. Kaizen và Loại bỏ 8 Loại lãng phí
*   **Kaizen:** Là cải tiến liên tục từ những việc nhỏ nhất của cá nhân đến cấp độ tổ chức.
*   **8 loại lãng phí (DOWNTIME):** Vận chuyển, Tồn kho, Thao tác thừa, Chờ đợi, Quy trình thừa, Sản xuất thừa, Sản phẩm lỗi và Lãng phí tài năng.
*   **Sơ đồ dòng giá trị (Value Stream Map - VSM):**
    *   Giúp bóc tách thời gian thực hiện công việc thành 3 loại: **Xanh** (Thời gian tạo ra giá trị thực), **Vàng** (Lãng phí có thể cải thiện ngay), và **Đỏ** (Lãng phí hoàn toàn cần loại bỏ).
    *   Thực tế ngay cả ở các nhà máy tốt, thời gian tạo giá trị thực (thời gian nét) thường chỉ chiếm tối đa 20%.

### 5. Phân tích nguyên nhân gốc rễ (6M + TID)
Khi có sự cố xảy ra, cần phân tích qua các yếu tố:
1. **Man (Con người):** Ý thức, kỹ năng.
2. **Machine (Máy móc):** Thiết bị hỏng, không đồng bộ.
3. **Material (Nguyên vật liệu):** Chất lượng đầu vào.
4. **Method (Phương pháp):** Quy trình làm việc.
5. **Money (Tiền bạc):** Dòng tiền bị tắc nghẽn.
6. **Mundo (Ý thức):** Thái độ làm việc.
7. **Environment (Môi trường):** Thời tiết (như mùa nồm ở miền Bắc), ánh sáng, nhiệt độ.
8. **System (Hệ thống):** Lỗi từ cấu trúc quản lý.
9. **TID (Time, Information, Data):** Quản trị thời gian, thông tin và dữ liệu (mức độ chuyên gia).

### 6. Chuyển đổi số dựa trên nền tảng Lean
*   **Sai lầm:** Bê nguyên một hệ thống hỗn độn, chưa được 5S và chưa tối ưu quy trình lên môi trường số.
*   **Lời khuyên:**
    *   Phải **"5S dữ liệu"** và loại bỏ quy trình thừa trước khi số hóa.
    *   Áp dụng quy luật 80/20: Chỉ nên ưu tiên số hóa **20% dữ liệu/quy trình** được sử dụng hàng ngày (chiếm 80% giá trị công việc) thay vì số hóa tất cả gây tốn kém và chậm hệ thống.
    *   Tận dụng các công cụ như Google Sheets để cộng tác thời gian thực thay vì Excel truyền thống.

**Ví dụ thực tế từ bài giảng:**
*   **Cải tiến xe đẩy:** Gắn bánh xe vào thùng hàng giúp giảm thời gian vận chuyển từ 17 phút xuống còn 4 phút, tiết kiệm hàng trăm triệu đồng chi phí nhân công mỗi năm.
*   **Nút bấm sự cố (Andon):** Khi máy hỏng, công nhân ấn nút để đèn sáng và bộ đếm giờ bắt đầu chạy. Nếu quá 5 phút bộ phận bảo trì không có mặt sẽ bị trừ KPI, giúp loại bỏ việc phải đi tìm người khi có sự cố.',
       m.id, datetime('now')
  FROM cohorts c
  JOIN lich_hoc b ON b.cohort_id = c.id AND b.ngay = '2026-09-04'
  JOIN members m ON m.full_name = 'Ngô Phú Cường' AND m.is_active = 1
 WHERE c.code = 'K03'
   AND NOT EXISTS (SELECT 1 FROM links l WHERE l.buoi_id = b.id AND l.kind = 'TEXT' AND l.removed_at IS NULL);
