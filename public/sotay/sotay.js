/* Thanh mục lục bám trên cùng + soi phần đang đọc.
   Cố ý viết bằng JS thuần và cố ý dựng danh sách bằng cách chép lại mục lục
   cạnh bên: sửa mục lục một chỗ là hai chỗ cùng đổi. Không chạy được JS thì
   mục lục thường ở đầu trang vẫn là những liên kết bình thường. */
(function () {
  var muc = document.querySelector('.muc ol');
  var phan = [].slice.call(document.querySelectorAll('main section[id]'));
  if (!muc || !phan.length) return;

  var thanh = document.createElement('div');
  thanh.className = 'thanh';
  thanh.innerHTML =
    '<div class="thanh-trong"><button class="thanh-nut" type="button" aria-expanded="false" aria-controls="thanh-ds">' +
      '<span class="thanh-nhan">Mục</span><span class="thanh-ten"></span>' +
      '<svg class="thanh-mt" width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
      '<path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg></button></div><ol class="thanh-ds" id="thanh-ds" hidden></ol>';
  document.body.insertBefore(thanh, document.body.firstChild);

  var ds = thanh.querySelector('.thanh-ds');
  ds.innerHTML = muc.innerHTML;
  var ten = thanh.querySelector('.thanh-ten');
  var nut = thanh.querySelector('.thanh-nut');

  function dong() { ds.hidden = true; thanh.removeAttribute('data-mo'); nut.setAttribute('aria-expanded', 'false'); }
  function mo() { ds.hidden = false; thanh.setAttribute('data-mo', '1'); nut.setAttribute('aria-expanded', 'true'); }
  nut.addEventListener('click', function () { ds.hidden ? mo() : dong(); });
  ds.addEventListener('click', function (e) { if (e.target.closest('a')) dong(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') dong(); });

  var lien = [].slice.call(document.querySelectorAll('.muc a, .thanh-ds a'));
  var dangO = null, dangCho = false;

  function soi() {
    dangCho = false;
    // Lấy toạ độ bằng getBoundingClientRect: offsetTop tính theo phần tử cha
    // có định vị, mà bố cục này có phần tử sticky nên offsetTop sẽ lệch.
    var moc = window.scrollY + (window.innerWidth >= 1080 ? 130 : 150);
    var id = phan[0].id;
    for (var i = 0; i < phan.length; i++) {
      if (phan[i].getBoundingClientRect().top + window.scrollY <= moc) id = phan[i].id;
    }
    if (id === dangO) return;
    dangO = id;
    var nhan = '';
    lien.forEach(function (a) {
      var khop = a.getAttribute('href') === '#' + id;
      a.classList.toggle('dang', khop);
      if (khop && !nhan) nhan = a.textContent.trim();
    });
    ten.textContent = nhan;
  }

  addEventListener('scroll', function () {
    if (!dangCho) { dangCho = true; requestAnimationFrame(soi); }
  }, { passive: true });
  addEventListener('resize', soi);
  soi();
})();
