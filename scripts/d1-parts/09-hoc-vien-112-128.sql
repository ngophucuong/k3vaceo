-- k3vaceo — tệp 9/15: học viên 112–128 trong danh sách gốc
-- Dán cả tệp vào Console D1 rồi Execute. Chạy lại nhiều lần vẫn đúng.
-- Sinh tự động bởi scripts/build-d1-parts.mjs — đừng sửa tay.

DELETE FROM roster WHERE cohort_id = (SELECT id FROM cohorts WHERE code = 'K03') AND seq BETWEEN 112 AND 128;

INSERT INTO roster (cohort_id, seq, group_label, full_name, dob, title, company, address, phone)
SELECT c.id, v.* FROM (VALUES
  (112,'Nhóm 9','Đinh Khánh Toàn',NULL,NULL,'Công ty TNHH TQC CGLOBAL CENTER FOR SUSTAINABILITY','C10, Khu Pandora, số 53 phố Triều Khúc, Phường Thanh Liệt, Hà Nội',NULL),
  (113,'Nhóm 9','Phùng Thạch Lâm','2008','Nhân viên kinh doanh','Hợp tác xã nông nghiệp và sản xuất Khánh Lâm','Thôn Đông Hữu, Xã Vật Lại, Thành phố Hà Nội','0918243687'),
  (114,'Nhóm 9','Vũ Văn Trang','18/07/1984','Phó Tổng Giám đốc','CTCP Khí Stavian',NULL,NULL),
  (115,'Nhóm 9','Nguyễn Minh Tưởng','25/10/1981','Phó Tổng Giám đốc','CÔNG TY CỔ PHẦN OPL LOGISTICS',NULL,NULL),
  (116,'Nhóm 9','Đinh Văn Hải','27/05/1981','Giám Đốc','Công ty TNHH Thiết bị Y tế Hamemy','Số 29, ngách 14/3, ngõ 14 Phố Pháo Đài Láng, phường Láng, Hà Nội','0979852956'),
  (117,'Nhóm 9','Thiều Thị Hường','18/10/1986','Giám đốc','Công ty Đào Tạo và kiến tạo Nội Thất Thiều Hường','27/401 Cổ Nhuế, Đông Ngạc, Hà Nội','0966988980'),
  (118,'Nhóm 9','Hoàng Thanh Hà','13/07/1988','Quản lý','Công ty Cổ phần Tư vấn & Dịch vụ Đổi mới khí hậu KLINOVA','số 41, ngách 622/14, đường Minh Khai, phường Vĩnh Tuy, Hà Nội','0983281307'),
  (119,'Nhóm 9','Đỗ Ngọc Hân','09/06/1994',NULL,NULL,NULL,NULL),
  (120,'Nhóm 9','Nguyễn Thị Kim Thanh','1990','GĐKD','Công ty TNHH TM và DV In nhanh sức mạnh số','Số 26 ngách 445 ngõ 192 Lê Trọng Tấn, Phường Định Công, Hà Nội.','0824193986'),
  (121,'Nhóm 10','Trần Thị Thủy',NULL,'Phó Tổng Giám Đốc','Công ty CP Tà Lùng Quang Minh','29 Lê Duẩn, phường Bãi Cháy, tỉnh Quảng Ninh',NULL),
  (122,'Nhóm 10','Đỗ Thị Thu','22/08/1988','Giám Đốc','Công ty TNHH THETA UNIVERSE MEDIA','Tầng 2 Tòa nhà LND Galaxy, Số 3 Đường Galaxy 6, phường Hà Đông, Hà Nội, Việt Nam','0972325168'),
  (123,'Nhóm 10','Phạm Quang Đán','1998','Phó Giám Đốc','Công ty TNHH TMDV Boom Logistics','Lô 126-N9 khu đô thị Vườn Hồng, phường Hải An, Hải Phòng','0793204398'),
  (124,'Nhóm 10','Nguyễn Thị Linh','06/06/1996','Trợ lý Hội đồng Quản trị','CTCP Kim loại Công nghiệp Stavian',NULL,NULL),
  (125,'Nhóm 10','Nguyễn Minh Sỹ','18/11/1972','Phó TGĐ','Công ty TNHH Kiểm toán KDG Việt Nam','Tầng 4 nhà C, số 125 Hoàng Văn Thái, Phương Liệt, Hà Nội','0986066670'),
  (126,'Nhóm 10','Lâm Ngọc Thảo','21/02/1991','Phó Tổng Giám đốc','CTCP Stavian Giấy và Bột Giấy',NULL,NULL),
  (127,'Nhóm 10','Nguyễn Diệu Hiền','1984','Tổng Giám đốc','Công ty TNHH TMDV QT Hiếu Phong','125 Láng Hạ, phường Láng Hạ, Hà Nội','0788088080'),
  (128,'Nhóm 10','Phạm Tiến Dũng','08/09/1984','Trưởng phòng','Trung tâm Văn hóa Doanh nhân - VCCI','Trung tâm Văn hóa Doanh nhân - VCCI','0373030000')
) v, cohorts c WHERE c.code = 'K03';
