(function (w) {
  'use strict';
  if (!w) return;
  var version = '2.0.0-ui-modernization';
  var stamp = new Date().toISOString();
  w.BLOCKIDE_UI_VERSION = version;
  w.BLOCKIDE_UI_BUILD_STAMP = stamp;
  try {
    console.log('[UI_VERSION]', version, stamp);
  } catch (_) {
    /* noop */
  }
})(typeof window !== 'undefined' ? window : null);

