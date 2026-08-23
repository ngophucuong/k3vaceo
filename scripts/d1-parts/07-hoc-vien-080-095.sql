-- k3vaceo — tệp 7/15: học viên 80–95 trong danh sách gốc
-- Dán cả tệp vào Console D1 rồi Execute. Chạy lại nhiều lần vẫn đúng.
-- Sinh tự động bởi scripts/build-d1-parts.mjs — đừng sửa tay.

DELETE FROM roster WHERE cohort_id = (SELECT id FROM cohorts WHERE code = 'K03') AND seq BETWEEN 80 AND 95;

INSERT INTO roster (cohort_id, seq, group_label, full_name, dob, title, company, address, phone)
SELECT c.id, v.* FROM (VALUES
  (80,'Nhóm 7','Lê Thanh Phú','03/02/1987','CEO - Founder','Công ty TNHH Đầu tư & Phát triển Công nghệ PHÚ THỊNH PHÁT','Tổ dân phố 1, phường Sông Trí, tỉnh Hà Tĩnh','0912262777'),
  (81,'Nhóm 7','Nghiêm Thị Chung','16/05/1984','Phó TGĐ','Công ty Cổ phần Đầu tư và Công nghệ HTI (HTI Group)','Tầng 15-VP2, Tòa nhà Sun Square, số 21 Lê Đức Thọ, phường Từ Liêm, Thành phố Hà Nội','0983398930'),
  (82,'Nhóm 7','Phạm Thùy Linh','27/07/1981','Giám đốc chuyên môn','Trung tâm Xét nghiệm Green Lab - Công ty Cổ phần đầu tư và Công nghệ Y tế Hà Nội','649/77/77 Đ. Lĩnh Nam, Vĩnh Hưng, Hà Nội','0936212213'),
  (83,'Nhóm 7','Nguyễn Hoàng Dương','09/08/2000','Trợ lý Ban giám đốc','Công ty Cổ phần Hữu Nghị Xuân Cương','Trung tâm dịch vụ Hữu Nghị Xuân Cương, Cửa khẩu Quốc tế Hữu Nghị, Xã Đồng Đăng, Tỉnh Lạng Sơn','0962858188'),
  (84,'Nhóm 7','Vũ Thị Ngân Hà','26/06/1979','Chánh VP HĐQT','Công ty cổ phần công nghệ -Viễn thông ELCOM',NULL,NULL),
  (85,'Nhóm 7','Nguyễn Thành Trung','15/02/1980','Trưởng bộ phận Kỹ thuật Công nghệ','CTCP Stavian Sản xuất Công nghiệp',NULL,NULL),
  (86,'Nhóm 7','Tô Thị Mến','27/05/1983','Phó Giám Đốc','Công ty TNHH Thiết bị Y tế Hamemy','Số 29, ngách 14/3, ngõ 14 Phố Pháo Đài Láng, phường Láng, Hà Nội','0984025870'),
  (87,'Nhóm 7','Bùi Văn Nghiêm','09/10/1997','Trường phòng','Công ty TNHH Kiến trúc & Nội thất IMA Việt Nam','Tầng 8, số 164 ngõ Xã Đàn 2, Đống Đa, Hà Nội','0971491931'),
  (88,'Nhóm 7','Nguyễn Tuấn Long','20/03/1976','Phó Tổng Giám đốc','CTCP Stavian VP Tây Ninh',NULL,NULL),
  (89,'Nhóm 7','Phạm Quý Hưng','25/08/2003','Trưởng phòng R&D','Công ty Cổ phần ABC Việt Nam',NULL,NULL),
  (90,'Nhóm 7','Bùi Chí Hướng','2000','TP Kinh Doanh','Công ty TNHH thiết bị và kết cấu Bảo Sơn','Thôn Quảng Hội, xã Nội Bài, Hà Nội','0338559513'),
  (91,'Nhóm 7','Hoàng Đình Anh','22/02/1990','Tổng Giám Đốc','CÔNG TY CỔ PHẦN BẤT ĐỘNG SẢN SGO THE BEST LAND','Tầng 2, TTTM HPC Landmark 105, đường Tố Hữu, phường Hà Đông, thành phố Hà Nội, Việt Nam','0979012298'),
  (92,'Nhóm 8','Nguyễn Bảo Kiên','1977','Tổng Giám đốc','CTCP Khu công nghiệp Stavian Thái Nguyên',NULL,NULL),
  (93,'Nhóm 8','Hoàng Thị Thu Hiền','14/08/1984','Phó Tổng Giám đốc Thường trực','CÔNG TY CỔ PHẦN OPL LOGISTICS',NULL,NULL),
  (94,'Nhóm 8','Hà Thị Tuyết','13/10/1984','Giám Đốc','Công ty Luật TNHH Dịch vụ pháp lý 4.0','Khu dân cư số 9, ngõ 100 Đường Minh Cầu, phường Phan Đình Phùng, tỉnh Thái Nguyên','0912681234'),
  (95,'Nhóm 8','Đậu Huy Đại','09/10/2007','Marketing','(Tự do)',NULL,'0386696998')
) v, cohorts c WHERE c.code = 'K03';
