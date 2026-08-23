// Sinh tệp .docx ngay trong Worker, không thêm thư viện nào.
//
// Một .docx chỉ là tệp ZIP chứa vài tệp XML. Bộ ghi ZIP dưới đây dùng phương
// thức "store" (không nén) — dài hơn vài KB nhưng đổi lại không cần deflate,
// mà bản thảo tám phần thì cỡ tệp không thành vấn đề. Cách này giữ đúng
// nguyên tắc hạ tầng mục 8 SRS: không build step, không framework.

const enc = new TextEncoder();

/* ── CRC32, bảng dựng một lần ── */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c >>> 0;
  }
  return t;
})();

function crc32(bytes) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

/* ── ZIP store-only ── */
class ByteWriter {
  constructor() { this.parts = []; this.length = 0; }
  bytes(b) { this.parts.push(b); this.length += b.length; }
  u16(n) { this.bytes(new Uint8Array([n & 0xFF, (n >>> 8) & 0xFF])); }
  u32(n) { this.bytes(new Uint8Array([n & 0xFF, (n >>> 8) & 0xFF, (n >>> 16) & 0xFF, (n >>> 24) & 0xFF])); }
  concat() {
    const out = new Uint8Array(this.length);
    let o = 0;
    for (const p of this.parts) { out.set(p, o); o += p.length; }
    return out;
  }
}

// entries: [{ name, data: Uint8Array }]
export function zip(entries) {
  const out = new ByteWriter();
  const central = [];

  for (const e of entries) {
    const nameBytes = enc.encode(e.name);
    const crc = crc32(e.data);
    const offset = out.length;

    out.u32(0x04034b50);            // chữ ký local file header
    out.u16(20); out.u16(0);        // phiên bản cần để giải nén, cờ
    out.u16(0);                     // phương thức 0 = store
    out.u16(0); out.u16(0);         // giờ, ngày (để 0 cho tệp sinh ra luôn giống nhau)
    out.u32(crc);
    out.u32(e.data.length); out.u32(e.data.length);
    out.u16(nameBytes.length); out.u16(0);
    out.bytes(nameBytes);
    out.bytes(e.data);

    central.push({ nameBytes, crc, size: e.data.length, offset });
  }

  const centralStart = out.length;
  for (const c of central) {
    out.u32(0x02014b50);
    out.u16(20); out.u16(20); out.u16(0);
    out.u16(0);
    out.u16(0); out.u16(0);
    out.u32(c.crc);
    out.u32(c.size); out.u32(c.size);
    out.u16(c.nameBytes.length);
    out.u16(0); out.u16(0); out.u16(0); out.u16(0);
    out.u32(0);
    out.u32(c.offset);
    out.bytes(c.nameBytes);
  }
  const centralSize = out.length - centralStart;

  out.u32(0x06054b50);
  out.u16(0); out.u16(0);
  out.u16(central.length); out.u16(central.length);
  out.u32(centralSize); out.u32(centralStart);
  out.u16(0);

  return out.concat();
}

/* ── OOXML ── */
const escXml = s => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&apos;')
  // Ký tự điều khiển không hợp lệ trong XML 1.0 (chỉ tab, xuống dòng và về
  // đầu dòng được phép) — lọt vào là Word từ chối mở cả tệp.
  .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');

function run(text, { bold, italic, size, color } = {}) {
  const props = [
    bold ? '<w:b/>' : '',
    italic ? '<w:i/>' : '',
    size ? `<w:sz w:val="${size * 2}"/><w:szCs w:val="${size * 2}"/>` : '',
    color ? `<w:color w:val="${color}"/>` : '',
  ].join('');
  // xml:space="preserve" để khoảng trắng đầu/cuối không bị nuốt.
  return `<w:r>${props ? `<w:rPr>${props}</w:rPr>` : ''}<w:t xml:space="preserve">${escXml(text)}</w:t></w:r>`;
}

export function para(text, opts = {}) {
  const { align, spaceBefore, spaceAfter, outline } = opts;
  // THỨ TỰ BẮT BUỘC. Lược đồ OOXML (CT_PPrBase) quy định các phần tử con của
  // w:pPr phải xuất hiện đúng trình tự: … spacing → ind → jc → … → outlineLvl.
  // Xếp sai thứ tự thì tệp vẫn là XML hợp lệ nhưng Word từ chối mở.
  const pPr = [
    (spaceBefore || spaceAfter)
      ? `<w:spacing${spaceBefore ? ` w:before="${spaceBefore * 20}"` : ''}${spaceAfter ? ` w:after="${spaceAfter * 20}"` : ''}/>`
      : '',
    align ? `<w:jc w:val="${align}"/>` : '',
    outline !== undefined ? `<w:outlineLvl w:val="${outline}"/>` : '',
  ].join('');
  const runs = Array.isArray(text) ? text.map(t => run(t.text, t)).join('') : run(text, opts);
  return `<w:p>${pPr ? `<w:pPr>${pPr}</w:pPr>` : ''}${runs}</w:p>`;
}

export function heading(text, level = 1) {
  return para(text, { bold: true, size: level === 1 ? 18 : 14, spaceBefore: 14, spaceAfter: 6, outline: level - 1 });
}

export function pageBreak() {
  return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
}

// rows: [[cell, cell, ...], ...]; hàng đầu in đậm làm tiêu đề.
export function table(rows, widths) {
  const grid = widths.map(w => `<w:gridCol w:w="${w}"/>`).join('');
  const body = rows.map((cells, ri) => {
    const tcs = cells.map((c, ci) =>
      `<w:tc><w:tcPr><w:tcW w:w="${widths[ci]}" w:type="dxa"/></w:tcPr>${para(String(c ?? ''), { bold: ri === 0, size: 10 })}</w:tc>`
    ).join('');
    return `<w:tr>${tcs}</w:tr>`;
  }).join('');
  // Không tham chiếu w:tblStyle: gói này không có styles.xml, trỏ tới một
  // style không tồn tại là lỗi. Viền vẽ thẳng bằng tblBorders.
  return `<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/>
    <w:tblBorders>
      <w:top w:val="single" w:sz="4" w:color="999999"/><w:left w:val="single" w:sz="4" w:color="999999"/>
      <w:bottom w:val="single" w:sz="4" w:color="999999"/><w:right w:val="single" w:sz="4" w:color="999999"/>
      <w:insideH w:val="single" w:sz="4" w:color="999999"/><w:insideV w:val="single" w:sz="4" w:color="999999"/>
    </w:tblBorders></w:tblPr><w:tblGrid>${grid}</w:tblGrid>${body}</w:tbl>`;
}

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
</Types>`;

// Phần document phải có tệp .rels riêng, kể cả khi không tham chiếu tới đâu.
// Thiếu nó thì LibreOffice và Word đều từ chối mở, dù ZIP và XML đều hợp lệ.
const DOC_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`;

const ROOT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
</Relationships>`;

function coreProps(title) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
 xmlns:dc="http://purl.org/dc/elements/1.1/">
<dc:title>${escXml(title)}</dc:title><dc:creator>k3vaceo</dc:creator>
</cp:coreProperties>`;
}

// blocks: mảng chuỗi XML sinh bởi para()/heading()/table()/pageBreak()
export function buildDocx({ title, blocks }) {
  const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>${blocks.join('')}
<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>
<w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1418" w:header="709" w:footer="709" w:gutter="0"/>
</w:sectPr></w:body></w:document>`;

  return zip([
    { name: '[Content_Types].xml', data: enc.encode(CONTENT_TYPES) },
    { name: '_rels/.rels', data: enc.encode(ROOT_RELS) },
    { name: 'word/_rels/document.xml.rels', data: enc.encode(DOC_RELS) },
    { name: 'docProps/core.xml', data: enc.encode(coreProps(title)) },
    { name: 'word/document.xml', data: enc.encode(document) },
  ]);
}
