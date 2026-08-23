-- k3vaceo — tệp 4/15: học viên 32–47 trong danh sách gốc
-- Dán cả tệp vào Console D1 rồi Execute. Chạy lại nhiều lần vẫn đúng.
-- Sinh tự động bởi scripts/build-d1-parts.mjs — đừng sửa tay.

DELETE FROM roster WHERE cohort_id = (SELECT id FROM cohorts WHERE code = 'K03') AND seq BETWEEN 32 AND 47;

INSERT INTO roster (cohort_id, seq, group_label, full_name, dob, title, company, address, phone)
SELECT c.id, v.* FROM (VALUES
  (32,'Nhóm 3','Nguyễn Thị My Hương','03/03/1993','Phó Tổng Giám Đốc','Công ty Cổ phần Hữu Nghị Xuân Cương','Trung tâm dịch vụ Hữu Nghị Xuân Cương, Cửa khẩu Quốc tế Hữu Nghị, Xã Đồng Đăng, Tỉnh Lạng Sơn','0986888946'),
  (33,'Nhóm 3','Nguyễn Thị Kim Oanh','28/12/1984','Giám đốc công ty con','Công ty cổ phần công nghệ -Viễn thông ELCOM',NULL,NULL),
  (34,'Nhóm 3','Nguyễn Kiều Oanh','13/11/1978','Phó Giám đốc Phòng Dịch vụ hành chính','CTCP Stavian Hóa Chất',NULL,NULL),
  (35,'Nhóm 3','Trần Thu Thùy','24/03/1989','Phó Ban Marketing','CTCP Stavian Sản xuất Công nghiệp',NULL,NULL),
  (36,'Nhóm 3','Chu Anh Tuấn','02/08/1983','Phó Giám đốc Nhà máy','CÔNG TY CỔ PHẦN STAVIAN BAO BÌ HƯNG YÊN',NULL,NULL),
  (37,'Nhóm 3','Trần Bá Dũng','1979','Phó Giám Đốc','Công ty Cổ phần Quản lý hàng hóa thế giới xanh','79 Bằng Liệt, phường Hoàng Liệt, Hà Nội','0966166289'),
  (38,'Nhóm 3','Tạ Thị Thanh','13/09/1995','Chủ doanh nghiệp','Công ty Cổ phần Lương Thực An Thịnh Phát','Số 50, liền kề 02, Khu đô thị Tân Tây Đô, Đan Phượng, Hà Nội','0961601801'),
  (39,'Nhóm 4','Đặng Văn Khải','1976','Phó Tổng Giám Đốc','Công ty CP Đầu tư Phát triển nhà Constrexim','Tầng 6, tòa nhà Golden Park, số 2, phố Phạm Văn Bạch, phường Cầu Giấy, Hà Nội','0903210135'),
  (40,'Nhóm 4','Trịnh Thái Thường','28/12/1985','Giám đốc vận hành','Công ty cổ phần công nghệ -Viễn thông ELCOM',NULL,NULL),
  (41,'Nhóm 4','Trương Duy Thanh','29/04/1996','CEO','Công ty Cổ phần Quốc tế ANVY','Tòa S202, Khu đô thị Vinhomes Ocean Park, Gia Lâm, Hà Nội','0963976617'),
  (42,'Nhóm 4','Nguyễn Ngọc Minh','06/12/2000','Leader','Công ty TNHH THETA UNIVERSE MEDIA','Tầng 2 Tòa nhà LND Galaxy, Số 3 Đường Galaxy 6, phường Hà Đông, Hà Nội, Việt Nam','0335280116'),
  (43,'Nhóm 4','Nguyễn Thị Mai Nga','10/07/1996','Phòng PTTT','Công ty CP Sản Xuất và Thương Mại Nội Địa Hóa Ô Tô 1- 5','Đường Uy Nỗ, Xã Thư Lâm, Thành phố Hà Nội','0866626279'),
  (44,'Nhóm 4','Hà Thị Tuyết Mai','1989','Giám Đốc nhà máy','Công ty Cổ phần Thương mại Dược VTYT Khải Hà','Số 2A, Phố Lý Bôn, phường Thái Bình, tỉnh Hưng Yên','0973793167'),
  (45,'Nhóm 4','Tạ Ngọc Thanh','25/08/1986','GĐ Cty HTI UAS','Công ty Cổ phần Đầu tư và Công nghệ HTI','Tầng 15-VP2, Tòa nhà Sun Square, số 21 Lê Đức Thọ, phường Từ Liêm, Thành phố Hà Nội','0906250886'),
  (46,'Nhóm 4','Mai Thị Huệ','22/04/1981','Phó Tổng Giám Đốc','Công ty Cổ phần Hữu Nghị Xuân Cương','Trung tâm dịch vụ Hữu Nghị Xuân Cương, Cửa khẩu Quốc tế Hữu Nghị, Xã Đồng Đăng, Tỉnh Lạng Sơn','0983224686'),
  (47,'Nhóm 4','Tạ Duy Hưng','27/07/1993','Giám đốc dự án','CTCP Stavian Hóa Chất',NULL,NULL)
) v, cohorts c WHERE c.code = 'K03';
