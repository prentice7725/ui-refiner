/* Optional effects on top of a theme: hero-video, hero-slides, reveal, marquee, and header-blur and intro (CSS only).
   The page names them on <html data-fx="...">. For a demonstration, ?fx=hero-video,reveal (or ?fx=all, ?fx=none)
   overrides that, and ?fx-level=bold raises the strength.
   Nothing moves when the visitor asks for reduced motion; video is skipped on Save-Data or a 2G connection. */
(function () {
  var root = document.documentElement;
  var ALL = 'hero-video reveal header-blur';
  var q = new URLSearchParams(location.search);
  if (q.has('fx')) {
    var v = q.get('fx');
    root.setAttribute('data-fx', v === 'all' ? ALL : v === 'none' ? '' : v.split(',').join(' '));
  }
  if (q.has('fx-level')) root.setAttribute('data-fx-level', q.get('fx-level'));

  var fx = (root.getAttribute('data-fx') || '').split(/\s+/).filter(Boolean);
  var on = function (name) { return fx.indexOf(name) >= 0; };
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var conn = navigator.connection || {};
  var light = conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '');

  function ready(fn) { if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }

  ready(function () {
    /* Remove what the page does not use, so a static page carries no hidden media. */
    if (!on('hero-video')) document.querySelectorAll('.fx-hero-video').forEach(function (el) { el.remove(); });
    if (!on('hero-slides')) document.querySelectorAll('[data-fx-slide]').forEach(function (el) { el.remove(); });
    if (still) return;

    /* A moving hero: one pause control, stopped while the hero is out of view. */
    function mover(hero, start, stop) {
      var button = hero.querySelector('.fx-pause');
      var paused = false, visible = true;
      function sync() { if (!paused && visible) start(); else stop(); }
      hero.classList.add('fx-moving');
      if (button) {
        var label = function () {
          button.textContent = paused ? (button.dataset.play || 'Play') : (button.dataset.pause || 'Pause');
          button.setAttribute('aria-pressed', String(paused));
        };
        label();
        button.addEventListener('click', function () { paused = !paused; label(); sync(); });
      }
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) { visible = es[0].isIntersecting; sync(); }).observe(hero);
      }
      sync();
    }

    var video = on('hero-video') && !light && document.querySelector('.fx-hero-video');
    if (video) {
      video.muted = true; video.playsInline = true; video.loop = true;
      video.src = video.dataset.src;
      video.addEventListener('playing', function () { video.classList.add('is-playing'); }, { once: true });
      mover(video.closest('[data-fx-hero]') || video.parentNode,
        function () { var p = video.play(); if (p && p.catch) p.catch(function () {}); },
        function () { video.pause(); });
    }

    var slides = on('hero-slides') ? document.querySelectorAll('[data-fx-slide]') : [];
    if (slides.length) {
      var i = -1, timer = null, every = 6000;
      var next = function () {
        if (i >= 0) slides[i].classList.remove('is-current');
        i = i + 1 < slides.length ? i + 1 : -1;   /* -1: back to the hero photograph underneath */
        if (i >= 0) slides[i].classList.add('is-current');
      };
      slides.forEach(function (s) { s.loading = 'eager'; });
      mover(slides[0].closest('[data-fx-hero]') || slides[0].parentNode,
        function () { if (!timer) timer = setInterval(next, every); },
        function () { clearInterval(timer); timer = null; });
    }

    if (on('marquee')) {
      document.querySelectorAll('.fx-marquee__track').forEach(function (track) {
        [].slice.call(track.children).forEach(function (c) { var d = c.cloneNode(true); d.setAttribute('aria-hidden', 'true'); track.appendChild(d); });
        var strip = track.parentNode;
        if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { strip.classList.toggle('is-off', !es[0].isIntersecting); }).observe(strip);
      });
    }

    if (on('reveal') && 'IntersectionObserver' in window) {
      var marked = document.querySelectorAll('[data-reveal]');
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
      }, { rootMargin: '0px 0px -8% 0px' });
      /* Blocks already on screen at load are shown at once, never faded in under the visitor's eyes. */
      marked.forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('is-in');
        else io.observe(el);
      });
      root.classList.add('fx-reveal-on');
    }
  });
})();
