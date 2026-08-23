-- k3vaceo — tệp 5/15: học viên 48–63 trong danh sách gốc
-- Dán cả tệp vào Console D1 rồi Execute. Chạy lại nhiều lần vẫn đúng.
-- Sinh tự động bởi scripts/build-d1-parts.mjs — đừng sửa tay.

DELETE FROM roster WHERE cohort_id = (SELECT id FROM cohorts WHERE code = 'K03') AND seq BETWEEN 48 AND 63;

INSERT INTO roster (cohort_id, seq, group_label, full_name, dob, title, company, address, phone)
SELECT c.id, v.* FROM (VALUES
  (48,'Nhóm 4','Nguyễn Nho Huân','04/02/1990','Trưởng phòng sản xuất','CTCP Stavian Sản xuất Công nghiệp',NULL,NULL),
  (49,'Nhóm 4','Phạm Đăng Đề','04/02/1975','Phó Giám đốc Nhà máy','CÔNG TY CỔ PHẦN STAVIAN BAO BÌ HƯNG YÊN',NULL,NULL),
  (50,'Nhóm 4','Nguyễn Văn Huy','25/10/1981','Giám Đốc','Công ty TNHH KDTM Đức Huy Intech','Số 19, ngõ 179.169 tổ 28 phố Vĩnh Hưng, phường Vĩnh Hưng, Hà Nội','0968623881'),
  (51,'Nhóm 4','Nguyễn Trung Đức','1990','BOM Business Development','Công ty Cổ phần Trường học Công nghê MINDX','71 Nguyễn Chí Thanh, phường Giảng Võ, Hà Nội','0946391896'),
  (52,'Nhóm 5','Đào Văn Duy','05/09/1986','Giám Đốc','Công ty CP Starpoly',NULL,NULL),
  (53,'Nhóm 5','Bùi Đức Mạnh','22/07/1993','Phó Giám Đốc','CÔNG TY TNHH THƯƠNG MẠI TỔNG HỢP TIẾN THÀNH','Km2+900, Đại Lộ Trần Hưng Đạo, Phường Cam Đường, Tỉnh Lào Cai','0856566666'),
  (54,'Nhóm 5','Kiều Đăng Tiến','1986','Phụ trách VP công ty','Công ty CP Đầu tư Phát triển nhà Constrexim','Tầng 6, tòa nhà Golden Park, số 2, phố Phạm Văn Bạch, phường Cầu Giấy, Hà Nội','0964600555'),
  (55,'Nhóm 5','Phạm Tố Quyên','07/03/1990','Giám Đốc','Công ty TNHH MTV LÊ GIA THÀNH CÔNG','345 Đội Cấn, phường Ba Đình, Hà Nội','0985070390'),
  (56,'Nhóm 5','Đỗ Thị Thương','20/10/1989','Leader','Công ty TNHH THETA UNIVERSE MEDIA','Tầng 2 Tòa nhà LND Galaxy, Số 3 Đường Galaxy 6, phường Hà Đông, Hà Nội, Việt Nam','0989136311'),
  (57,'Nhóm 5','Nguyễn Thành Công','26/03/1979','Trợ lý ban giám đốc','Công ty CP Sản Xuất và Thương Mại Nội Địa Hóa Ô Tô 1- 5','Đường Uy Nỗ, Xã Thư Lâm, Thành phố Hà Nội','0986004333'),
  (58,'Nhóm 5','Cao Phương Thảo','29/10/1995','Phó Giám Đốc','Công ty Cổ phần thiết bị nghe nhìn Việt Anh Audio','Xóm 3, Đồng Nhân, An Khánh, Hà Nội','0946706710'),
  (59,'Nhóm 5','Hoàng Thị Mùi','21/03/1983','Phó Giám Đốc','CÔNG TY TNHH HÒA BÌNH','tổ dân phố Nguyễn Thái Học 15, phường Yên Bái, tỉnh Lào Cai','0913565737'),
  (60,'Nhóm 5','Phạm Tuấn Hoàng','11/07/1990','Giám Đốc','Công ty Cổ phần Hữu Nghị Xuân Cương','Trung tâm dịch vụ Hữu Nghị Xuân Cương, Cửa khẩu Quốc tế Hữu Nghị, Xã Đồng Đăng, Tỉnh Lạng Sơn','0919235678'),
  (61,'Nhóm 5','Đậu Thị Lý','08/12/1988','Kế toán trưởng','Công ty cổ phần công nghệ -Viễn thông ELCOM',NULL,NULL),
  (62,'Nhóm 5','Cao Văn Hách','20/11/1979','Phó Tổng Giám Đốc','CTCP Stavian Hóa Chất',NULL,NULL),
  (63,'Nhóm 5','Nguyễn Quang Huy','09/04/1990','Trợ lý Hội đồng Quản trị','CTCP Stavian Sản xuất Công nghiệp',NULL,NULL)
) v, cohorts c WHERE c.code = 'K03';
