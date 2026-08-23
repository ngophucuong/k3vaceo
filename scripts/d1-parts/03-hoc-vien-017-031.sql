-- k3vaceo — tệp 3/15: học viên 17–31 trong danh sách gốc
-- Dán cả tệp vào Console D1 rồi Execute. Chạy lại nhiều lần vẫn đúng.
-- Sinh tự động bởi scripts/build-d1-parts.mjs — đừng sửa tay.

DELETE FROM roster WHERE cohort_id = (SELECT id FROM cohorts WHERE code = 'K03') AND seq BETWEEN 17 AND 31;

INSERT INTO roster (cohort_id, seq, group_label, full_name, dob, title, company, address, phone)
SELECT c.id, v.* FROM (VALUES
  (17,'Nhóm 2','Hoàng Thám Hoa','06/06/1979','Thành viên HĐQT','Công ty CP Sản Xuất và Thương Mại Nội Địa Hóa Ô Tô 1- 5','Đường Uy Nỗ, Xã Thư Lâm, Thành phố Hà Nội','0364006679'),
  (18,'Nhóm 2','Nguyễn Thị Kiều Anh','1994','Giám đốc','Công ty Cổ phần Thương mại Dược VTYT Khải Hà','Số 2A, Phố Lý Bôn, phường Thái Bình, tỉnh Hưng Yên','0368186363'),
  (19,'Nhóm 2','Giang Quốc Ân','17/01/1986','Phó TGĐ','Công ty Cổ phần Đầu tư và Công nghệ HTI (HTI Group)','Tầng 15-VP2, Tòa nhà Sun Square, số 21 Lê Đức Thọ, phường Từ Liêm, Thành phố Hà Nội','0915171986'),
  (20,'Nhóm 2','Trần Văn Điển','12/08/1987','Phó Tổng Giám Đốc','Công ty Cổ phần Hữu Nghị Xuân Cương','Trung tâm dịch vụ Hữu Nghị Xuân Cương, Cửa khẩu Quốc tế Hữu Nghị, Xã Đồng Đăng, Tỉnh Lạng Sơn','0987421123'),
  (21,'Nhóm 2','Trần Huy Tùng','02/10/1983','Giám đốc trung tâm R&D','Công ty cổ phần công nghệ -Viễn thông ELCOM',NULL,NULL),
  (22,'Nhóm 2','Trần Duy Hưng','21/12/1989','Trợ lý Chủ tịch HĐQT','CTCP Stavian Hóa Chất',NULL,NULL),
  (23,'Nhóm 2','Phương Thanh Vũ','14/01/1982','Trưởng ban Nghiên cứu và phát triển','CTCP Stavian Sản xuất Công nghiệp',NULL,NULL),
  (24,'Nhóm 2','Đỗ Văn Lương','29/08/1976','Phó Giám đốc Nhà máy','CÔNG TY CỔ PHẦN STAVIAN BAO BÌ HƯNG YÊN',NULL,NULL),
  (25,'Nhóm 2','Vũ Thị Kim Liên','05/09/1974','Giám Đốc','Công ty TNHH GROWTH Việt Nam','493 Kim Ngưu, Vĩnh Tuy, Hà Nội','0983742998'),
  (26,'Nhóm 3','Phạm Hồng Đức','20/06/1985','CT HĐQT','Công ty cổ phần tập đoàn địa ốc Golden Land','Tầng 3, tòa nhà SDU, số 163 đường Trần Phú, Hà Đông, Hà Nội','0357277777'),
  (27,'Nhóm 3','Chử Minh Châu','27/10/1970','Phó Tổng Giám Đốc','Công ty CP Sản Xuất và Thương Mại Nội Địa Hóa Ô Tô 1- 5','Đường Uy Nỗ, Xã Thư Lâm, Thành phố Hà Nội','0972182598'),
  (28,'Nhóm 3','Bùi Thị Thanh Huyền','1976','Phó Tổng Giám Đốc','Công ty CP Đầu tư Phát triển nhà Constrexim','Tầng 6, tòa nhà Golden Park, số 2, phố Phạm Văn Bạch, phường Cầu Giấy, Hà Nội','0988754276'),
  (29,'Nhóm 3','Đỗ Thị Định','28/11/1985','Leader','Công ty TNHH THETA UNIVERSE MEDIA','Tầng 2 Tòa nhà LND Galaxy, Số 3 Đường Galaxy 6, phường Hà Đông, Hà Nội, Việt Nam','0963026563'),
  (30,'Nhóm 3','Lê Thị Thanh Hòa','1984','Phó Giám Đốc','Công ty Cổ phần Thương mại Dược VTYT Khải Hà','Số 2A, Phố Lý Bôn, phường Thái Bình, tỉnh Hưng Yên','0984958809'),
  (31,'Nhóm 3','Trần Thị Thu Trang','03/02/1982','Phó TGĐ HTI Scientific','Công ty Cổ phần Đầu tư và Công nghệ HTI','Tầng 15-VP2, Tòa nhà Sun Square, số 21 Lê Đức Thọ, phường Từ Liêm, Thành phố Hà Nội','0962429986')
) v, cohorts c WHERE c.code = 'K03';
