(function (w) {
  'use strict';
  if (!w) return;

  var flags = {
    enableModernIslands: true,
    enableLegacyJqueryBridge: true,
  };
  w.BLOCKIDE_UI_FLAGS = w.BLOCKIDE_UI_FLAGS || flags;

  function onModal(modalId, eventName, handler) {
    if (!modalId || !eventName || typeof handler !== 'function') return;
    if (w.jQuery && w.BLOCKIDE_UI_FLAGS.enableLegacyJqueryBridge !== false) {
      w.jQuery(modalId).on(eventName, handler);
      return;
    }
    var node = document.querySelector(modalId);
    if (!node) return;
    node.addEventListener(eventName, handler);
  }

  w.BlockIDEUIBridge = {
    onModal: onModal,
  };
})(typeof window !== 'undefined' ? window : null);

