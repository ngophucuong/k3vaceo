-- Gắn tư liệu vào một BUỔI HỌC cụ thể (26/8).
--
-- Trước nay `links.tag = 'buoi'` chỉ là một cái nhãn rời: nó nói "đây là tài
-- liệu buổi học" mà không nói buổi NÀO. Nên tài liệu của buổi 28/8 và của buổi
-- 11/9 nằm lẫn trong cùng một danh sách, và ở màn Lịch thì không có cách nào
-- hiện ra được.
--
-- Một cột khoá ngoại là đủ. CỐ Ý KHÔNG tạo bảng "shortcut" hay nhân đôi dòng:
-- vẫn đúng MỘT dòng trong `links`, hai màn cùng đọc nó qua hai truy vấn khác
-- nhau. Sửa ở màn nào cũng là sửa chính nó, gỡ ở màn nào cũng biến mất khỏi cả
-- hai. Hai bản ghi thì sớm muộn cũng lệch nhau mà không chỗ nào báo lỗi.
--
-- Đây đúng khuôn mẫu đã có sẵn của `links.section_id` (gắn tư liệu vào một
-- phần bài) — không phải cách làm mới.
--
-- Để NULL nghĩa là tư liệu chung, không thuộc buổi nào. Mọi dòng đang có đều
-- thành NULL, không dòng nào đổi nghĩa.
ALTER TABLE links ADD COLUMN buoi_id INTEGER REFERENCES lich_hoc(id);

-- Màn Lịch hỏi "buổi này có tư liệu nào" cho từng buổi một, nên chỉ mục theo
-- buoi_id là đường nóng. Kèm removed_at vì mọi truy vấn đều lọc bản đã gỡ.
CREATE INDEX ix_links_buoi ON links(buoi_id, removed_at);
