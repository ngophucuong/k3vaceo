-- k3vaceo — tệp 6/15: học viên 64–79 trong danh sách gốc
-- Dán cả tệp vào Console D1 rồi Execute. Chạy lại nhiều lần vẫn đúng.
-- Sinh tự động bởi scripts/build-d1-parts.mjs — đừng sửa tay.

DELETE FROM roster WHERE cohort_id = (SELECT id FROM cohorts WHERE code = 'K03') AND seq BETWEEN 64 AND 79;

INSERT INTO roster (cohort_id, seq, group_label, full_name, dob, title, company, address, phone)
SELECT c.id, v.* FROM (VALUES
  (64,'Nhóm 5','Nguyễn Thị Quỳnh Hương','1992','Student Success Leader','Công ty Cổ phần Trường học Công nghê MINDX','72 Nguyễn Chí Thanh, phường Giảng Võ, Hà Nội','0836866789'),
  (65,'Nhóm 5','Lưu Minh Tiến','19/08/1987','Chủ tịch','Công ty Cổ phần Solar Electric Việt Nam','Số B13 KĐT Trung Hòa Nhân Chính, phường Yên Hòa, Hà Nội','0914544449'),
  (66,'Nhóm 6','Nguyễn Thị Thu Hương','13/07/1991','Giám đốc Tài chính','Công Ty Cổ Phần Maruni Quốc Tế',NULL,NULL),
  (67,'Nhóm 6','Phan Thị Thanh Nga','17/03/1979','Trưởng VPĐD','VP Đại diện Công ty cổ phần Excel Creates','Phòng C3, tầng 11, Tòa nhà CDC, 25 Lê Đại Hành, phường Hai Bà Trưng, Hà Nội','0985981808'),
  (68,'Nhóm 6','Nguyễn Thị Anh Lài','13/09/1990','CEO','Công Ty Cổ Phần Kinh Doanh và Thương mại Mylax','28 Nguyễn Gia Thiều, phường Cửa Nam, Hà Nội','0965133751'),
  (69,'Nhóm 6','Nguyễn Thu Mai','09/08/1980','Giám Đốc','Công ty TNHH TM & SX Hùng Mạnh MelyFarm','Mường Lò, Đường Hoa Ban, Tổ 12, Phường Nghĩa Lộ, Tỉnh Lào Cai','0949039399'),
  (70,'Nhóm 6','Vũ Thị Thu Hoài','26/11/1983','Giám đốc điều hành','Công ty Cổ phần đầu tư và Công nghệ Y tế Hà Nội','649/77/77 Đ. Lĩnh Nam, Vĩnh Hưng, Hà Nội','0904871239'),
  (71,'Nhóm 6','Ngô Phú Cường','26/03/1977','Giám Đốc','Công ty Cổ phần Hữu Nghị Xuân Cương','Trung tâm dịch vụ Hữu Nghị Xuân Cương, Cửa khẩu Quốc tế Hữu Nghị, Xã Đồng Đăng, Tỉnh Lạng Sơn','0909088838'),
  (72,'Nhóm 6','Bùi Thị Huyền Trang','07/01/1987','Managing Director','Nano Technologies',NULL,NULL),
  (73,'Nhóm 6','Trần Hoàng Hà','11/05/1993','COO Công ty con','Công ty cổ phần công nghệ -Viễn thông ELCOM',NULL,NULL),
  (74,'Nhóm 6','Đào Hồng Luật','21/04/1985','Trưởng phòng HCNS','CTCP Stavian Hóa Chất',NULL,NULL),
  (75,'Nhóm 6','Khương Quốc Chung','20/11/1987','Giám đốc dự án thiết bị y tế','CTCP Stavian Sản xuất Công nghiệp',NULL,NULL),
  (76,'Nhóm 6','Lê Trung Đức','09/03/1998','Cửa hàng trưởng','CÔNG TY TNHH THƯƠNG MẠI TỔNG HỢP TIẾN THÀNH','Km2+900, Đại Lộ Trần Hưng Đạo, Phường Cam Đường, Tỉnh Lào Cai','098778525'),
  (77,'Nhóm 6','Phạm Thế Nam','09/11/1989','Giám Đốc','Công ty TNHH Xây dựng và Phát triển quốc tế Bảo Châu','Văn phòng số 122 đường Bạch Thái Bưởi, phường Gia Viên, Hải Phòng','0789267999'),
  (78,'Nhóm 6','Nguyễn Hoàng Anh','15/07/1986','Giám Đốc','Công ty TNHH Kiến trúc & Nội thất IMA Việt Nam','Tầng 8, số 164 ngõ Xã Đàn 2, Đống Đa, Hà Nội','0914622286'),
  (79,'Nhóm 6','Lê Thị Bích Liên','13/10/1978','Chánh VP HĐQT','Alphanam Group',NULL,NULL)
) v, cohorts c WHERE c.code = 'K03';
