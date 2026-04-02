(function (w, d) {
  'use strict';
  if (!w || !d) return;

  var header = null;

  function applyHeaderHeight() {
    if (!header) header = d.getElementById('header');
    if (!header) return;
    var h = Math.max(48, Math.ceil(header.getBoundingClientRect().height || 48));
    d.documentElement.style.setProperty('--header-height', h + 'px');
  }

  function onReady() {
    applyHeaderHeight();
    w.setTimeout(applyHeaderHeight, 120);
    w.setTimeout(applyHeaderHeight, 400);
  }

  w.addEventListener('resize', applyHeaderHeight, { passive: true });
  w.addEventListener('orientationchange', applyHeaderHeight, { passive: true });
  d.addEventListener('DOMContentLoaded', onReady);
  w.addEventListener('load', onReady);
})(typeof window !== 'undefined' ? window : null, typeof document !== 'undefined' ? document : null);

