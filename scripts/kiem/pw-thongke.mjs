import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const WORKER = resolve(dirname(fileURLToPath(import.meta.url)), '../../worker');
const DB=(q)=>{const o=execFileSync('npx',['wrangler','d1','execute','k3vaceo','--local','--json','--command',q],{cwd:WORKER,maxBuffer:1<<26}).toString();return JSON.parse(o.slice(o.indexOf('[')))[0].results;};
let hong=0; const ok=(t,d)=>{console.log((d?'  ✓ ':'  ✗ ')+t); if(!d) hong++;};
const B='http://127.0.0.1:8787';
const goi=(m,p,ck)=>fetch(B+p,{headers:{cookie:ck}}).then(async r=>({ma:r.status,than:await r.json().catch(()=>({}))}));

// ══ TOÀN BỘ phần đụng D1 ══
DB("DELETE FROM sessions"); DB("DELETE FROM fund_declarations"); DB("DELETE FROM fund_rounds"); DB("DELETE FROM fund_expenses");
DB("DELETE FROM officers WHERE group_id IS NULL AND role='thu_quy'");
DB("UPDATE members SET is_active=1");
const cuong = DB(`SELECT id FROM members WHERE full_name='Ngô Phú Cường' AND is_active=1`)[0].id;
// người khác nhóm để có nhiều nhóm mà so
DB(`INSERT INTO members (cohort_id, group_id, roster_id, full_name, title, company, is_active, created_at, updated_at)
    SELECT r.cohort_id, g.id, r.id, r.full_name, r.title, r.company, 1, datetime('now'), datetime('now')
      FROM roster r JOIN groups g ON g.label = r.group_label
     WHERE g.no IN (7,8) AND NOT EXISTS (SELECT 1 FROM members m WHERE m.roster_id = r.id) LIMIT 10`);
// đợt CẤP LỚP, người thu là Cường (nên Cường xem được cả đợt)
DB(`INSERT INTO fund_rounds (cohort_id,group_id,scope,title,amount,bank_bin,bank_name,account_no,account_name,status,collector_member_id,syntax_template,thuoc_quy)
    VALUES (1,NULL,'class','Quỹ lớp đợt 1',200000,'970422','MB Bank','0789267999','NGO PHU CUONG','open',${cuong},'{TEN} N{NHOM}','lop')`);
const dot = DB(`SELECT id FROM fund_rounds ORDER BY id DESC LIMIT 1`)[0].id;
DB(`INSERT INTO fund_declarations (round_id,member_id,declared_at) SELECT ${dot}, id, datetime('now') FROM members WHERE is_active=1 AND id % 2 = 0`);
DB(`UPDATE fund_declarations SET verified_by=${cuong}, verified_at=datetime('now') WHERE round_id=${dot} AND member_id % 4 = 0`);
// một người thường của nhóm 6 để đối chứng N6
const thuong = DB(`SELECT id FROM members WHERE group_id=6 AND is_active=1 AND id<>${cuong}
  AND id NOT IN (SELECT member_id FROM officers WHERE superseded_at IS NULL AND member_id IS NOT NULL) LIMIT 1`)[0].id;
// một TRƯỞNG NHÓM của nhóm 7 — phải KHÔNG thấy số của nhóm 6/8
const n7 = DB(`SELECT id FROM members WHERE group_id=(SELECT id FROM groups WHERE no=7) AND is_active=1 LIMIT 1`)[0].id;
DB(`INSERT INTO officers (cohort_id,group_id,role,member_id,effective_from)
    SELECT 1,(SELECT id FROM groups WHERE no=7),'truong_nhom',${n7},date('now')`);
const bam=async t=>{const h=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t));return [...new Uint8Array(h)].map(x=>x.toString(16).padStart(2,'0')).join('');};
const tC='tkC'+Date.now(), tT='tkT'+Date.now(), t7='tk7'+Date.now();
DB(`INSERT INTO sessions (member_id,token_hash,expires_at) VALUES
  (${cuong},'${await bam(tC)}',datetime('now','+1 day')),
  (${thuong},'${await bam(tT)}',datetime('now','+1 day')),
  (${n7},'${await bam(t7)}',datetime('now','+1 day'))`);
const tong = DB(`SELECT COUNT(*) AS n FROM members WHERE is_active=1`)[0].n;
const daNhan = DB(`SELECT COUNT(*) AS n FROM fund_declarations WHERE round_id=${dot} AND verified_at IS NOT NULL`)[0].n;
const daKhai = DB(`SELECT COUNT(*) AS n FROM fund_declarations WHERE round_id=${dot} AND verified_at IS NULL AND declared_at IS NOT NULL`)[0].n;
console.log(`đợt lớp ${dot} · ${tong} người · đã nhận ${daNhan} · mới khai ${daKhai}`);
// ══ hết ══

console.log('── Số liệu khớp với D1 ──');
const kq = await goi('GET','/api/funds/thong-ke',`s=${tC}`);
const d = kq.than.dot[0];
ok(`tổng ${d.tong} = ${tong}`, d.tong === tong);
ok(`đã nhận ${d.da_nhan} = ${daNhan}`, d.da_nhan === daNhan);
ok(`mới khai ${d.da_khai} = ${daKhai}`, d.da_khai === daKhai);
ok(`ba trạng thái cộng lại = tổng`, d.da_nhan + d.da_khai + d.chua_khai === d.tong);
ok(`tiền đã nhận ${d.tien_da_nhan} = ${daNhan} × 200000`, d.tien_da_nhan === daNhan * 200000);
ok('chia theo nhóm cộng lại đúng bằng tổng',
   d.theo_nhom.reduce((a,n)=>a+n.tong,0) === d.tong &&
   d.theo_nhom.reduce((a,n)=>a+n.da_nhan,0) === d.da_nhan);

console.log('── N6: ai thấy được gì ──');
ok(`người thu thấy đủ ${d.theo_nhom.length} nhóm`, d.theo_nhom.length >= 3);
const k7 = (await goi('GET','/api/funds/thong-ke',`s=${t7}`)).than.dot[0];
ok('trưởng nhóm 7 KHÔNG thấy phần chia theo nhóm', k7.theo_nhom === null);
ok('nhưng vẫn thấy tổng của cả đợt (dãy chấm vốn đã công khai)', k7.tong === tong);
const kT = (await goi('GET','/api/funds/thong-ke',`s=${tT}`)).than.dot[0];
ok('người thường cũng không thấy chia nhóm', kT.theo_nhom === null);

console.log('── Giao diện ──');
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
const c = await b.newContext({ viewport:{width:390,height:1100}, deviceScaleFactor:2 });
await c.addCookies([{name:'s',value:tC,domain:'127.0.0.1',path:'/'}]);
const p = await c.newPage();
const loi=[]; p.on('pageerror',e=>loi.push(e.message));
await p.goto('http://127.0.0.1:8787/#/quy'); await p.waitForTimeout(2200);
ok('không lỗi JS: '+(loi.join(' | ')||'sạch'), loi.length===0);
await p.click('#tkBtn'); await p.waitForTimeout(1500);
ok('có chú giải 3 mục', await p.locator('.tk-cg span').count() === 3);
ok('chú giải có CHỮ, không chỉ có màu',
   (await p.locator('.tk-cg').innerText()).includes('Người thu đã nhận'));
const cot = await p.locator('.tk-t').count();
ok(`có ${cot} cột = 1 tổng + ${d.theo_nhom.length} nhóm`, cot === 1 + d.theo_nhom.length);
ok('ô cam có vân chéo (mã hoá thứ hai cho người mù màu)',
   (await p.locator('.tk-b').first().evaluate(e=>getComputedStyle(e).backgroundImage)).includes('repeating-linear-gradient'));
ok('mỗi cột có nhãn số đi kèm', await p.locator('.tk-s').count() >= cot);
ok('có nhãn cho người đọc màn hình',
   (await p.locator('.tk-t').first().getAttribute('aria-label')).includes('người thu đã nhận'));
ok('KHÔNG có chữ "tỉ lệ đóng" hay "đã đóng"',
   !/tỉ lệ đóng|đã đóng/i.test(await p.locator('.sheet').innerText()));
ok('không tràn ngang', await p.evaluate(()=>document.documentElement.scrollWidth<=390));
// ba ô cộng lại đúng 100% chiều rộng cột
const rong = await p.locator('.tk-t').first().evaluate(e =>
  [...e.children].reduce((a,c)=>a+c.getBoundingClientRect().width,0) / e.getBoundingClientRect().width);
ok(`ba ô lấp đầy cột (${(rong*100).toFixed(1)}%)`, rong > 0.94 && rong <= 1.001);
// Dòng chú giải thích VÌ SAO không có phần chia nhóm. Người thu THẤY phần chia
// nên dòng ấy phải im — hiện lên là đọc thành "bạn không có quyền" trước mặt
// đúng người có quyền.
const chu = 'Chỉ người thu của đợt';
ok('người thu KHÔNG bị nhắc chuyện quyền',
   !(await p.locator('.sheet').innerText()).includes(chu));
await p.screenshot({ path:'thongke.png' });
// đổi sang trưởng nhóm 7 — người thật sự không xem được, dòng chú PHẢI hiện
const c7 = await b.newContext({ viewport:{width:390,height:1100} });
await c7.addCookies([{name:'s',value:t7,domain:'127.0.0.1',path:'/'}]);
const p7 = await c7.newPage();
await p7.goto('http://127.0.0.1:8787/#/quy'); await p7.waitForTimeout(2200);
await p7.click('#tkBtn'); await p7.waitForTimeout(1200);
const vb7 = await p7.locator('.sheet').innerText();
ok('trưởng nhóm 7 ĐƯỢC nhắc vì sao không thấy chia nhóm', vb7.includes(chu));
ok('trưởng nhóm 7 chỉ thấy 1 cột (tổng của đợt)', await p7.locator('.tk-t').count() === 1);

// Ca hỏng thật của mã cũ: người thu của một đợt NHÓM. Đợt nhóm chỉ có một
// nhóm nên không bao giờ có phần chia — mã cũ suy ra từ chỗ đó rằng người xem
// thiếu quyền, và nhắc chuyện quyền ngay trước mặt chính người thu. Chặn API
// để dựng đúng ca ấy, vì trên D1 luôn có thêm đợt lớp che mất.
const gia = (xemCaDot) => async (route) => route.fulfill({ contentType:'application/json',
  body: JSON.stringify({ dot: [{ id:99, title:'Quỹ nhóm 6 đợt 1', scope:'group', amount:100000,
    status:'open', tong:14, da_nhan:5, da_khai:4, chua_khai:5,
    tien_da_nhan:500000, tien_can:1400000, theo_nhom:null, xem_ca_dot:xemCaDot }] }) });

for (const [xemCaDot, phaiHien, nhan] of [[true,false,'người thu đợt nhóm'],[false,true,'người thường']]) {
  const cx = await b.newContext({ viewport:{width:390,height:900} });
  await cx.addCookies([{name:'s',value:tC,domain:'127.0.0.1',path:'/'}]);
  const px = await cx.newPage();
  await px.route('**/api/funds/thong-ke', gia(xemCaDot));
  await px.goto('http://127.0.0.1:8787/#/quy'); await px.waitForTimeout(2000);
  await px.click('#tkBtn'); await px.waitForTimeout(900);
  const co = (await px.locator('.sheet').innerText()).includes(chu);
  ok(`${nhan}: dòng nhắc quyền ${phaiHien?'PHẢI hiện':'phải im'} — đang ${co?'hiện':'im'}`, co === phaiHien);
  await cx.close();
}
await b.close();
console.log(hong?`\n${hong} HỎNG`:'\nĐÚNG HẾT');
process.exit(hong?1:0);
