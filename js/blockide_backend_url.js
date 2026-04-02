/**
 * Resolves the HTTP base URL for /compile, /ports, Socket.IO, etc.
 * - Optional override: window.BLOCKIDE_BACKEND_URL (no trailing slash)
 * - Served over http(s): same origin ('') so Oracle / nginx + one host works
 * - file:// opens: assume local Node on 5005
 */
(function (w) {
  'use strict';
  w.blockideResolveBackendBaseUrl = function () {
    var custom = w.BLOCKIDE_BACKEND_URL;
    if (typeof custom === 'string') {
      custom = custom.trim();
      if (custom !== '') {
        return custom.replace(/\/+$/, '');
      }
    }
    try {
      if (w.location && w.location.protocol === 'file:') {
        return 'http://localhost:5005';
      }
    } catch (e) { /* ignore */ }
    return '';
  };
})(typeof window !== 'undefined' ? window : this);
