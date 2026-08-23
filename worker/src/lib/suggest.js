// Gợi ý phân công tính ở máy chủ từ members.title — bảng quy tắc mục 7.2 SRS,
// giữ nguyên thứ tự vì "khớp trước thắng" (dòng "giám đốc" cố ý nằm cuối).
//
// So khớp trên chuỗi đã bỏ dấu và viết thường, nên "Tài chính", "tai chinh",
// "TÀI CHÍNH" đều khớp như nhau. Mỗi nhóm mẫu có thêm các dạng viết tắt xuất
// hiện thật trong danh sách Ban tổ chức (VPĐD, HCNS, HĐQT, GĐKD…) — SRS nêu
// nhóm nghĩa chứ không liệt kê hết cách viết, mà bỏ sót viết tắt thì hơn nửa
// số người trong nhóm 6 không nhận được gợi ý nào.
const RULES = [
  { ord: 5, re: /tai chinh|ke toan|cfo|ktt/ },
  { ord: 3, re: /nhan su|nhan luc|hanh chinh nhan su|hcns|hr\b/ },
  { ord: 2, re: /marketing|ban hang|thuong mai|kinh doanh|van phong dai dien|vpdd|cua hang|truyen thong|media|gdkd/ },
  { ord: 4, re: /\bcoo\b|van hanh|san xuat|nha may|ky thuat|thiet bi|xay dung|kien truc|du an|logistics/ },
  { ord: 6, re: /hoi dong quan tri|hdqt|chanh van phong|chanh vp|chu tich/ },
  { ord: 1, re: /\bceo\b|managing|tong giam doc|\btgd\b/ },
  { ord: 1, re: /giam doc|\bgd\b/ },
];

export function bare(s) {
  return String(s ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase();
}

// Phần bài hợp với chức vụ này, hoặc null nếu không quy tắc nào khớp.
export function sectionForTitle(title) {
  const t = bare(title);
  for (const r of RULES) if (r.re.test(t)) return r.ord;
  return null;
}

// members: [{id, full_name, title}], sections: [{ord, owner_member_id}]
// Trả về { [ord]: {id, full_name, title} } cho các phần chưa có chủ.
// Không gợi ý người đã giữ một phần khác (mục 7.2 SRS).
export function suggestOwners(members, sections) {
  const taken = new Set(sections.map(s => s.owner_member_id).filter(Boolean));
  const free = members.filter(m => !taken.has(m.id));
  const out = {};
  const used = new Set();
  for (const s of sections) {
    if (s.owner_member_id) continue;
    const pick = free.find(m => !used.has(m.id) && sectionForTitle(m.title) === s.ord);
    if (pick) {
      used.add(pick.id);
      out[s.ord] = { id: pick.id, full_name: pick.full_name, title: pick.title };
    }
  }
  return out;
}
