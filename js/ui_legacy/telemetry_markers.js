(function (w, d) {
  'use strict';

  if (!w) return;

  function nowIso() {
    try {
      return new Date().toISOString();
    } catch (_) {
      return '' + Date.now();
    }
  }

  function emit(name, payload) {
    var event = {
      name: String(name || 'ui_event'),
      ts: nowIso(),
      payload: payload || {},
    };
    w.BlockIDE_UI_TELEMETRY_LAST = event;
    try {
      if (typeof w.trackGAEvent === 'function') {
        w.trackGAEvent(event.name, event.payload);
      }
    } catch (_) {
      /* telemetry best-effort */
    }
    try {
      console.log('[UI_MARKER]', event.name, event.payload || {});
    } catch (_) {
      /* noop */
    }
  }

  w.blockideUIMarker = emit;

  d.addEventListener(
    'click',
    function (e) {
      var t = e && e.target;
      if (!t || !t.closest) return;
      if (t.closest('#side_btn_upload') || t.closest('#btn_flash_local')) {
        emit('ui_upload_click', {
          board: (w.profile && w.profile.defaultBoardKey) || 'unknown'
        });
      } else if (t.closest('#side_btn_connect_monitor')) {
        emit('ui_serial_toggle_click', {});
      } else if (t.closest('#btn_arduino_board')) {
        emit('ui_board_modal_open', {});
      }
    },
    true
  );
})(typeof window !== 'undefined' ? window : null, typeof document !== 'undefined' ? document : null);

