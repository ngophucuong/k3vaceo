-- k3vaceo — tệp 10/15: học viên 129–134 trong danh sách gốc
-- Dán cả tệp vào Console D1 rồi Execute. Chạy lại nhiều lần vẫn đúng.
-- Sinh tự động bởi scripts/build-d1-parts.mjs — đừng sửa tay.

DELETE FROM roster WHERE cohort_id = (SELECT id FROM cohorts WHERE code = 'K03') AND seq BETWEEN 129 AND 134;

INSERT INTO roster (cohort_id, seq, group_label, full_name, dob, title, company, address, phone)
SELECT c.id, v.* FROM (VALUES
  (129,'Nhóm 10','Phạm Thị Hoa',NULL,NULL,'CTY TNHH KINH DOANH THUONG MAI DICH VU MINH NGOC',NULL,NULL),
  (130,'Nhóm 10','Vũ Mạnh Thắng','18/11/1981','Giám đốc','Công ty Cổ phần Home On','Số 45 Lô D6, KĐT Geleximco Lê Trọng Tấn, Dương Nội, Hà Nội','0904508083'),
  (131,'Nhóm 10','Nguyễn Thị Hải',NULL,'Tổng Giám đốc','CTCP Công nghệ SICIX',NULL,NULL),
  (132,'Nhóm 10','Lê Quốc Tuấn','1994','TPKTSX','Công ty TNHH sản xuất thương mại tư vấn và dịch vụ cơ điện Lê Gia','Số 14, xóm 2, Nguyên Khê, Phúc Thịnh, Hà Nội','0368071294'),
  (133,'Nhóm 10','Vương Quốc Huy','20/10/1992','Đồng sáng lập & Giám đốc kinh doanh','Công ty TNHH Hồ Shan Trà','Thôn Đát Tờ, xã Nghĩa Tâm, Lào Cai, Việt Nam','0364393992'),
  (134,'Nhóm 10','Vũ Tuấn Anh','27/11/1984',NULL,'Công ty Cổ phần Thung Lũng Vân Hồ','CN1-7, khu công nghệ Minh Quang, Thượng Hồng, Hưng Yên','0976790048')
) v, cohorts c WHERE c.code = 'K03';
