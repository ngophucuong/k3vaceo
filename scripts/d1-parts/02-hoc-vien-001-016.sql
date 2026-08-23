-- k3vaceo — tệp 2/15: học viên 1–16 trong danh sách gốc
-- Dán cả tệp vào Console D1 rồi Execute. Chạy lại nhiều lần vẫn đúng.
-- Sinh tự động bởi scripts/build-d1-parts.mjs — đừng sửa tay.

DELETE FROM roster WHERE cohort_id = (SELECT id FROM cohorts WHERE code = 'K03') AND seq BETWEEN 1 AND 16;

INSERT INTO roster (cohort_id, seq, group_label, full_name, dob, title, company, address, phone)
SELECT c.id, v.* FROM (VALUES
  (1,'Nhóm 1','Nguyễn Văn Khải','1966','Tổng Giám Đốc','Công ty Cổ phần Thương mại Dược VTYT Khải Hà','Số 2A, Phố Lý Bôn, phường Thái Bình, tỉnh Hưng Yên','0979755857'),
  (2,'Nhóm 1','Nguyễn Thị Phượng','09/05/1990','Tổng Giám Đốc','Công ty Cổ phần Hữu Nghị Xuân Cương','Trung tâm dịch vụ Hữu Nghị Xuân Cương, Cửa khẩu Quốc tế Hữu Nghị, Xã Đồng Đăng, Tỉnh Lạng Sơn','0973836585'),
  (3,'Nhóm 1','Trần Thị Hòa','21/12/1983','Thành viên hộ kinh doanh','Hộ kinh doanh Bếp AHF','Phòng C0806, HH2C, Khu đô thị mới Dương Nội, phường Yên Nghĩa, Hà Nội','0941416979'),
  (4,'Nhóm 1','Trần Thị Thu Cúc','1981','Kế toán trưởng công ty thành viên','Công ty CP Đầu tư Phát triển nhà Constrexim','Tầng 6, tòa nhà Golden Park, số 2, phố Phạm Văn Bạch, phường Cầu Giấy, Hà Nội','0913030324'),
  (5,'Nhóm 1','Nguyễn Thị Quỳnh','16/09/1985','Giám Đốc','Công ty Cổ phần ADUMI Việt','A01-L06, Khu A, KĐTM Dương Nội, phường Dương Nội, Hà Nội','0816271927'),
  (6,'Nhóm 1','Ngô Văn Hòa','04/03/1979','Thành viên HĐQT','Công ty CP Sản Xuất và Thương Mại Nội Địa Hóa Ô Tô 1- 5','Đường Uy Nỗ, Xã Thư Lâm, Thành phố Hà Nội','0988507279'),
  (7,'Nhóm 1','Vũ Long Biên','11/10/1984','Giám Đốc','Công ty TNHH Leadership & Sustainability','Số 1A ngõ 26, đường Tân Thịnh, tổ 10, phường Quyết Thắng, tỉnh Thái Nguyên, Việt Nam','0968469000'),
  (8,'Nhóm 1','Nguyễn Thanh Bình','10/05/1975','Giám đốc Nhân sự','Công ty cổ phần công nghệ -Viễn thông ELCOM',NULL,NULL),
  (9,'Nhóm 1','Lê Thị Thu Trang','15/06/1983','Chánh văn phòng','CTCP Stavian Hóa Chất',NULL,NULL),
  (10,'Nhóm 1','Đinh Thị Giang','06/04/1976','Trưởng Ban Hành chính nhân sự','CTCP Stavian Sản xuất Công nghiệp',NULL,NULL),
  (11,'Nhóm 1','Bùi Xuân Luận','1994','Giám đốc','Công ty cổ phần công nghệ TECOVA','145 Ngọc Hồi, Yên Sở, Hà Nội','0987739894'),
  (12,'Nhóm 1','Nguyễn Khắc Dũng',NULL,'Giám đốc Nhà máy','CÔNG TY CỔ PHẦN STAVIAN BAO BÌ HƯNG YÊN',NULL,NULL),
  (13,'Nhóm 2','Man Thị Kim Liên','1986','Trưởng phòng bán hàng','Công ty TNHH Sungwoo vina','Khu Công Nghiệp Thuận Thành 3, Trí Quả, Bắc Ninh','0976911081'),
  (14,'Nhóm 2','Dương Văn Thương','1986','CEO','Công ty Cổ Phần The Best Wine','115 Xuân Quỳnh, phường Yên Hòa, Hà Nội','0988393000'),
  (15,'Nhóm 2','Phạm Quang Hưng','1977','Kế toán trưởng công ty mẹ','Công ty CP Đầu tư Phát triển nhà Constrexim','Tầng 6, tòa nhà Golden Park, số 2, phố Phạm Văn Bạch, phường Cầu Giấy, Hà Nội','0982174121'),
  (16,'Nhóm 2','Nguyễn Anh Tú','01/11/1999','Leader','Công ty TNHH THETA UNIVERSE MEDIA','Tầng 2 Tòa nhà LND Galaxy, Số 3 Đường Galaxy 6, phường Hà Đông, Hà Nội, Việt Nam','0334906765')
) v, cohorts c WHERE c.code = 'K03';
