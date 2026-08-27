# Kiểm tệp .ics một cách ĐỘC LẬP: không dùng lại công thức của worker/src/lib/ics.js
# mà tính lại bằng zoneinfo của Python. Tự kiểm bằng chính công thức mình viết thì
# sai giống hệt nhau và test vẫn xanh.
import sys, urllib.request
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

VN = ZoneInfo('Asia/Ho_Chi_Minh')
UTC = ZoneInfo('UTC')
hong = 0
def ok(t, d):
    global hong
    print(('  ✓ ' if d else '  ✗ ') + t)
    if not d: hong += 1

url = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8787/api/lich/k3vaceo.ics'
r = urllib.request.urlopen(url)
raw = r.read()
ct = r.headers.get('Content-Type', '')

print('── Vỏ HTTP ──')
ok(f'Content-Type là text/calendar ({ct})', 'text/calendar' in ct)
ok('có Content-Disposition kèm tên tệp',
   '.ics' in (r.headers.get('Content-Disposition') or ''))
ok('không cần cookie vẫn tải được (mã 200)', r.status == 200)

print('── Khuôn RFC 5545 ──')
text = raw.decode('utf-8')          # ném lỗi nếu gấp dòng cắt giữa ký tự nhiều byte
ok('giải mã UTF-8 được — gấp dòng không cắt giữa ký tự', True)
ok('xuống dòng là CRLF, không phải LF trần',
   b'\r\n' in raw and raw.count(b'\n') == raw.count(b'\r\n'))

dong = raw.split(b'\r\n')
qua = [d for d in dong if len(d) > 75]
ok(f'mọi dòng ≤ 75 octet (dài nhất {max((len(d) for d in dong), default=0)})', not qua)

ok('mở bằng BEGIN:VCALENDAR', text.startswith('BEGIN:VCALENDAR\r\n'))
ok('đóng bằng END:VCALENDAR', text.rstrip('\r\n').endswith('END:VCALENDAR'))
ok('có VERSION:2.0', 'VERSION:2.0' in text)
ok('có PRODID', '\r\nPRODID:' in text)

# ── Mở gấp dòng rồi tách sự kiện ──
mo = []
for d in text.split('\r\n'):
    if d.startswith(' ') and mo:
        mo[-1] += d[1:]
    elif d:
        mo.append(d)

sk, cur = [], None
for d in mo:
    if d == 'BEGIN:VEVENT':
        cur = {}
    elif d == 'END:VEVENT':
        sk.append(cur); cur = None
    elif cur is not None:
        k, _, v = d.partition(':')
        cur[k] = v

print(f'── {len(sk)} sự kiện ──')
ok('có sự kiện', len(sk) > 0)
ok('mọi sự kiện đều có UID', all('UID' in e for e in sk))
ok('UID không trùng nhau', len({e['UID'] for e in sk}) == len(sk))
ok('mọi sự kiện đều có DTSTAMP', all('DTSTAMP' in e for e in sk))
ok('mọi sự kiện đều có SUMMARY', all('SUMMARY' in e for e in sk))
ok('mọi sự kiện đều có DTSTART', all(any(k.startswith('DTSTART') for k in e) for e in sk))
ok('mọi sự kiện đều có DTEND', all(any(k.startswith('DTEND') for k in e) for e in sk))

print('── Đổi múi giờ, đối chứng bằng zoneinfo ──')
# Lấy dữ liệu gốc từ API công khai rồi tự tính lại
import json
d = json.load(urllib.request.urlopen(url.replace('/k3vaceo.ics', '/cong-khai')))
theoUid = {e['UID'].split('@')[0]: e for e in sk}
solech = 0
for b in d['buoi']:
    e = theoUid.get(f"buoi-{b['id']}")
    if not e:
        print(f"  ✗ thiếu sự kiện cho buổi {b['id']}"); hong += 1; continue
    if b['tu_gio']:
        y, m, dd = map(int, b['ngay'].split('-'))
        hh, mi = map(int, b['tu_gio'].split(':'))
        mong = datetime(y, m, dd, hh, mi, tzinfo=VN).astimezone(UTC).strftime('%Y%m%dT%H%M%SZ')
        if e.get('DTSTART') != mong:
            print(f"  ✗ buổi {b['id']} DTSTART {e.get('DTSTART')} ≠ {mong}"); solech += 1
        # giờ kết thúc: có thì theo dữ liệu, không có thì mặc định +3 tiếng
        if b['den_gio']:
            hh2, mi2 = map(int, b['den_gio'].split(':'))
            mongE = datetime(y, m, dd, hh2, mi2, tzinfo=VN).astimezone(UTC).strftime('%Y%m%dT%H%M%SZ')
        else:
            mongE = (datetime(y, m, dd, hh, mi, tzinfo=VN) + timedelta(hours=3)) \
                    .astimezone(UTC).strftime('%Y%m%dT%H%M%SZ')
        if e.get('DTEND') != mongE:
            print(f"  ✗ buổi {b['id']} DTEND {e.get('DTEND')} ≠ {mongE}"); solech += 1
    else:
        mong = b['ngay'].replace('-', '')
        sau = (datetime.fromisoformat(b['ngay']) + timedelta(days=1)).strftime('%Y%m%d')
        if e.get('DTSTART;VALUE=DATE') != mong:
            print(f"  ✗ buổi {b['id']} cả ngày DTSTART sai"); solech += 1
        if e.get('DTEND;VALUE=DATE') != sau:
            print(f"  ✗ buổi {b['id']} DTEND cả ngày phải là HÔM SAU (mút hở)"); solech += 1
ok(f'mọi mốc giờ khớp zoneinfo Asia/Ho_Chi_Minh ({len(d["buoi"])} buổi)', solech == 0)

print('── Buổi đã huỷ ──')
huy = [b for b in d['buoi'] if b['da_huy']]
if huy:
    e = theoUid[f"buoi-{huy[0]['id']}"]
    ok('buổi đã huỷ VẪN có trong tệp (để lịch người ta gạch đi được)', e is not None)
    ok('và mang STATUS:CANCELLED', e.get('STATUS') == 'CANCELLED')
else:
    print('  (không có buổi huỷ nào để kiểm)')
ok('buổi chưa huỷ mang STATUS:CONFIRMED',
   all(theoUid[f"buoi-{b['id']}"].get('STATUS') == 'CONFIRMED'
       for b in d['buoi'] if not b['da_huy']))

print('── Thoát ký tự ──')
ok('dấu hai chấm KHÔNG bị thoát trong SUMMARY',
   not any('\\:' in e.get('SUMMARY', '') for e in sk))
ok('chữ Việt có dấu còn nguyên sau khi mở gấp dòng',
   any('ế' in e.get('SUMMARY', '') or 'ị' in e.get('SUMMARY', '') for e in sk))

print('── Buổi bảo vệ ──')
bv = theoUid.get('baove')
ok('có sự kiện buổi bảo vệ', bv is not None)
if bv:
    ok(f"đúng ngày {d['khoa']['defense_on']}",
       bv.get('DTSTART;VALUE=DATE') == d['khoa']['defense_on'].replace('-', ''))

print('── Tải hai lần cho ra tệp y hệt (DTSTAMP không lấy giờ máy) ──')
raw2 = urllib.request.urlopen(url).read()
ok('hai lượt tải giống hệt nhau', raw == raw2)

print(f"\n{hong} HỎNG" if hong else '\nĐÚNG HẾT')
sys.exit(1 if hong else 0)
