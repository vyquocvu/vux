/* Shared behaviour for the design mockups: theme, debug overlay, TOC spy,
   reading progress, and the floating variant switcher. */
(function () {
  var VARIANTS = [
    { id: 'index', label: 'So sánh' },
    { id: '0-baseline', label: '0 · Hiện tại' },
    { id: 'a-reading-rail', label: 'A · Reading rail' },
    { id: 'b-centered', label: 'B · Centered' },
    { id: 'c-ambient-rail', label: 'C · Ambient rail' },
    { id: 'd-two-col-index', label: 'D · Two-col' },
  ];

  var current = document.documentElement.getAttribute('data-variant') || '';

  /* ---- theme ---- */
  var stored = null;
  try { stored = localStorage.getItem('mock-theme'); } catch (e) {}
  if (stored === 'dark' || (!stored && matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  }
  function toggleTheme() {
    var dark = document.documentElement.classList.toggle('dark');
    try { localStorage.setItem('mock-theme', dark ? 'dark' : 'light'); } catch (e) {}
  }

  /* ---- dead-zone overlay ---- */
  var dead = false;
  function toggleDead() {
    dead = document.body.classList.toggle('show-deadzone');
    var b = document.querySelector('[data-dead-btn]');
    if (b) b.classList.toggle('is-current', dead);
  }

  var zone = document.querySelector('.deadzone');
  if (zone) {
    var src = document.querySelector(zone.getAttribute('data-measure-src'));
    function measure() {
      if (!src) return;
      var gap = Math.max(0, Math.round(window.innerWidth - src.getBoundingClientRect().right));
      zone.style.setProperty('--deadzone-w', gap + 'px');
      zone.setAttribute('data-width', gap + 'px');
    }
    window.addEventListener('resize', measure);
    measure();
  }

  /* ---- scroll-spy TOC ---- */
  var links = [].slice.call(document.querySelectorAll('[data-toc-link]'));
  if (links.length) {
    var targets = links
      .map(function (l) { return document.getElementById(l.hash.slice(1)); })
      .filter(Boolean);

    function sync() {
      var y = window.scrollY + 120;
      var active = targets[0];
      for (var i = 0; i < targets.length; i++) {
        if (targets[i].offsetTop <= y) active = targets[i];
      }
      links.forEach(function (l) {
        l.classList.toggle('is-active', !!active && l.hash === '#' + active.id);
      });
    }
    window.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    sync();
  }

  /* ---- reading progress (bar + ring) ---- */
  var bar = document.querySelector('[data-progress-bar]');
  var ring = document.querySelector('[data-progress-ring]');
  var pctEl = document.querySelector('[data-progress-pct]');
  function progress() {
    if (!bar && !ring) return;
    var h = document.documentElement.scrollHeight - window.innerHeight;
    var p = h > 0 ? Math.min(100, Math.max(0, (window.scrollY / h) * 100)) : 0;
    if (bar) bar.style.transform = 'scaleX(' + p / 100 + ')';
    if (ring) ring.style.setProperty('--progress', p.toFixed(1));
    if (pctEl) pctEl.textContent = Math.round(p) + '%';
  }
  window.addEventListener('scroll', progress, { passive: true });
  window.addEventListener('resize', progress);
  progress();

  /* ---- floating switcher ---- */
  var bar6 = document.createElement('div');
  bar6.className = 'mockbar';
  bar6.innerHTML =
    VARIANTS.map(function (v) {
      return '<a href="' + v.id + '.html" class="' +
        (v.id === current ? 'is-current' : '') + '">' + v.label + '</a>';
    }).join('') +
    (document.querySelector('.deadzone')
      ? '<button data-dead-btn type="button" title="Bật/tắt vùng chết (D)">Vùng chết</button>'
      : '') +
    '<button data-theme-btn type="button" title="Bật/tắt dark (T)">Dark</button>';
  document.body.appendChild(bar6);

  bar6.querySelector('[data-theme-btn]').addEventListener('click', toggleTheme);
  var deadBtn = bar6.querySelector('[data-dead-btn]');
  if (deadBtn) deadBtn.addEventListener('click', toggleDead);

  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var t = e.target.tagName;
    if (t === 'INPUT' || t === 'TEXTAREA') return;
    if (e.key === 't' || e.key === 'T') toggleTheme();
    if ((e.key === 'd' || e.key === 'D') && deadBtn) toggleDead();
  });
})();
