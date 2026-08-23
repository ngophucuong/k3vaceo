-- k3vaceo — tệp 8/15: học viên 96–111 trong danh sách gốc
-- Dán cả tệp vào Console D1 rồi Execute. Chạy lại nhiều lần vẫn đúng.
-- Sinh tự động bởi scripts/build-d1-parts.mjs — đừng sửa tay.

DELETE FROM roster WHERE cohort_id = (SELECT id FROM cohorts WHERE code = 'K03') AND seq BETWEEN 96 AND 111;

INSERT INTO roster (cohort_id, seq, group_label, full_name, dob, title, company, address, phone)
SELECT c.id, v.* FROM (VALUES
  (96,'Nhóm 8','Đặng Thùy Dương','09/05/1994','Giám Đốc','Công ty Cổ phần SUNPRIME GROUP','101 Xuân Quỳnh, phường Yên Hòa, Hà Nội','0399636855'),
  (97,'Nhóm 8','Nguyễn Thị Tùng Vân','27/03/1977','Chánh VP','Hiệp hội các tổ chức dịch vụ phát triển kinh doanh Việt Nam - VABSO',NULL,NULL),
  (98,'Nhóm 8','Nguyễn Phan Minh Tâm','05/05/2004','Trưởng phòng nhân sự','Công ty TNHH Kết nối chuyên nghiệp toàn cầu','Số 123 ngõ 554 Trường Chinh, phường Kim Liên, Hà Nội','0362444568'),
  (99,'Nhóm 8','Phạm Ngọc Anh','27/05/1978','Giám Đốc','Công ty TNHH Xuất nhập khẩu phụ tùng AUTO','Số 52 Ngõ 42 Đường Xuân Khôi, Phường Long Biên, Hà Nội','0927051978'),
  (100,'Nhóm 8','Trần Thành Nhật','1995','TP Kỹ Thuật','Công ty TNHH thiết bị và kết cấu Bảo Sơn','Thôn Quảng Hội, xã Nội Bài, Hà Nội','0987752980'),
  (101,'Nhóm 8','Hoàng Huyền Trang','07/10/2000','CB P. Kinh doanh','CÔNG TY TNHH HÒA BÌNH','tổ dân phố Nguyễn Thái Học 15, phường Yên Bái, tỉnh Lào Cai','0837365279'),
  (102,'Nhóm 8','Lê Minh Tiến',NULL,'Chủ tịch','Công ty Cổ phần SEI Enterprise',NULL,'0914544449'),
  (103,'Nhóm 8','Đỗ Thanh Thanh Huyền','31/07/1996','Giám Đốc','Công ty TNHH TQC CGLOBAL CENTER FOR SUSTAINABILITY','C10, Khu Pandora, số 53 phố Triều Khúc, Phường Thanh Liệt, Hà Nội','0976916125'),
  (104,'Nhóm 8','Phùng Thanh Quân','22/06/1992','Phó phòng Kinh doanh Bột Giấy SPP','CTCP Stavian Giấy và Bột Giấy',NULL,NULL),
  (105,'Nhóm 8','Nguyễn Thị Hằng Nhi','1994','Giám đốc','Công ty cổ phần thương mại và dịch vụ MedGate','79 Ngọc Hồi, Yên Sở, Hà Nội','0373780212'),
  (106,'Nhóm 9','Lê Thị Huế','03/09/1977','Chủ tịch Công ty','Công ty TNHH Dược phẩm Bách Thông','Số 5 ngõ 9 Nguyễn Văn Linh, phường Việt Hưng, Hà Nội','0947516888'),
  (107,'Nhóm 9','Hoàng Thị Lương','18/11/1984','GĐ Nhân sự','Công ty cổ phần đầu tư công nghệ Tiên Phong','Số 23 lô 4A đường Trung Yên 10. phường Yên Hòa, Hà Nội','0986427437'),
  (108,'Nhóm 9','Nguyễn Thị Thùy Dung','21/12/1982','Phó Tổng Giám Đốc','công ty Cổ phần Tập đoàn Dược phẩm và Thương mại SOHACO',NULL,'0932278997'),
  (109,'Nhóm 9','Lê Thanh Yên',NULL,'Senior Manager','Công ty TNHH Shimadzu Vietnam','Detech Building, 8 Tôn Thất Thuyết, Cầu Giấy, Hà Nội','0989199123'),
  (110,'Nhóm 9','Mai Mậu Thành','22/07/1985','Phó Tổng Giám đốc','CTCP Kim loại Công nghiệp Stavian',NULL,NULL),
  (111,'Nhóm 9','Phan Thị Thanh Nga','17/03/1979','Trưởng VPĐD','VP Đại diện Công ty cổ phần Excel Creates','Phòng C3, tầng 11, Tòa nhà CDC, 25 Lê Đại Hành, phường Hai Bà Trưng, Hà Nội','0985981808')
) v, cohorts c WHERE c.code = 'K03';
