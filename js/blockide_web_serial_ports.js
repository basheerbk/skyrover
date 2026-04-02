/**
 * Web-only: list USB serial devices on the user's PC via the Web Serial API.
 * Never uses GET /ports (that lists the compile server's /dev/tty*, not your machine).
 */
(function (w) {
  'use strict';

  /** Set true to show "＋ Add USB serial device…" in port dropdowns (temporary UI toggle). */
  w.BLOCKIDE_SHOW_USB_SERIAL_ADD_OPTION = false;

  function formatPortLabel(port, index) {
    try {
      var info = port.getInfo && port.getInfo();
      if (info && info.usbVendorId != null) {
        var vid = info.usbVendorId.toString(16).padStart(4, '0');
        var pid =
          info.usbProductId != null && info.usbProductId !== undefined
            ? info.usbProductId.toString(16).padStart(4, '0')
            : '????';
        return 'USB ' + vid + ':' + pid + ' (this computer)';
      }
    } catch (e) {
      /* ignore */
    }
    return 'USB serial #' + (index + 1) + ' (this computer)';
  }

  w.blockideWebSerialParseIndex = function (value) {
    if (typeof value !== 'string' || value.indexOf('webserial:') !== 0) return null;
    var n = parseInt(value.slice('webserial:'.length), 10);
    return Number.isFinite(n) ? n : null;
  };

  w.blockideIsWebSerialPortValue = function (value) {
    return typeof value === 'string' && value.indexOf('webserial:') === 0;
  };

  /**
   * @param {HTMLSelectElement} selectEl
   * @param {string} [preferValue] previous value to restore if still valid
   */
  w.blockideFillWebSerialSelect = async function (selectEl, preferValue) {
    if (!selectEl) return;

    if (!navigator.serial) {
      selectEl.innerHTML = '';
      var o = document.createElement('option');
      o.value = 'no_com';
      if (typeof window.isSecureContext !== 'undefined' && !window.isSecureContext) {
        o.textContent =
          'USB serial blocked: page is not secure (use HTTPS or http://localhost)';
        o.title =
          'Chrome is correct — but Web Serial is disabled on http://YOUR_PUBLIC_IP. Use HTTPS (nginx + certificate, see docs/deploy-oracle.md), or SSH tunnel: ssh -L 5005:127.0.0.1:5005 opc@SERVER then open http://localhost:5005';
      } else {
        o.textContent = 'Web Serial unavailable — try Chrome or Edge (latest)';
        o.title = 'This browser or profile may not support the Web Serial API.';
      }
      selectEl.appendChild(o);
      selectEl.disabled = false;
      return;
    }

    var ports = [];
    try {
      ports = await navigator.serial.getPorts();
    } catch (e) {
      console.warn('[WebSerial] getPorts failed', e);
    }

    var prev = preferValue != null ? preferValue : selectEl.value;
    selectEl.innerHTML = '';

    var showAdd = w.BLOCKIDE_SHOW_USB_SERIAL_ADD_OPTION === true;
    if (showAdd) {
      var addOpt = document.createElement('option');
      addOpt.value = '__add_usb_serial__';
      addOpt.textContent = '＋ Add USB serial device…';
      selectEl.appendChild(addOpt);
    }

    if (ports.length === 0) {
      var empty = document.createElement('option');
      empty.value = 'no_com';
      empty.textContent = showAdd
        ? 'No device paired — use ＋ Add to pick your board'
        : 'No USB device yet — use Upload (ESP32/8266) once to pick your port';
      selectEl.appendChild(empty);
      selectEl.disabled = false;
    } else {
      for (var i = 0; i < ports.length; i++) {
        var opt = document.createElement('option');
        opt.value = 'webserial:' + i;
        opt.textContent = formatPortLabel(ports[i], i);
        selectEl.appendChild(opt);
      }
      selectEl.disabled = false;
      if (prev && prev.indexOf('webserial:') === 0) {
        var ok = false;
        for (var j = 0; j < selectEl.options.length; j++) {
          if (selectEl.options[j].value === prev) {
            ok = true;
            break;
          }
        }
        if (ok) selectEl.value = prev;
      }
    }
  };

  w.blockideAttachWebSerialAddHandler = function (selectEl) {
    if (!w.BLOCKIDE_SHOW_USB_SERIAL_ADD_OPTION) return;
    if (!selectEl || selectEl.dataset.blockideWebAddBound === '1') return;
    selectEl.dataset.blockideWebAddBound = '1';
    selectEl.addEventListener('change', function () {
      if (selectEl.value !== '__add_usb_serial__') return;
      (async function () {
        try {
          if (navigator.serial) await navigator.serial.requestPort();
        } catch (e) {
          /* user cancelled */
        }
        await w.blockideFillWebSerialSelect(selectEl, null);
        if (navigator.serial) {
          var list = await navigator.serial.getPorts();
          if (list.length) selectEl.value = 'webserial:' + (list.length - 1);
          else selectEl.value = 'no_com';
        }
      })();
    });
  };

  var serialReadActive = false;
  var activeReader = null;
  var activePort = null;

  w.blockideBrowserSerialOpen = async function (portValue, baudRate, onChunk) {
    await w.blockideBrowserSerialClose();
    var idx = w.blockideWebSerialParseIndex(portValue);
    if (idx == null || !navigator.serial) {
      throw new Error('Invalid USB serial selection');
    }
    var ports = await navigator.serial.getPorts();
    var port = ports[idx];
    if (!port) {
      throw new Error('That USB device is no longer listed — use ＋ Add again');
    }
    await port.open({ baudRate: baudRate || 9600 });
    activePort = port;
    var reader = port.readable.getReader();
    activeReader = reader;
    serialReadActive = true;
    var dec = new TextDecoder();
    (async function () {
      try {
        while (serialReadActive && activePort === port) {
          var read = await reader.read();
          if (read.done) break;
          if (read.value && read.value.length && typeof onChunk === 'function') {
            onChunk(dec.decode(read.value, { stream: true }));
          }
        }
      } catch (e) {
        if (typeof onChunk === 'function') onChunk('\n[Serial read stopped]\n');
      } finally {
        try {
          reader.releaseLock();
        } catch (_) {
          /* ignore */
        }
      }
    })();
    return true;
  };

  w.blockideBrowserSerialClose = async function () {
    serialReadActive = false;
    if (activeReader) {
      try {
        await activeReader.cancel();
      } catch (_) {
        /* ignore */
      }
      try {
        activeReader.releaseLock();
      } catch (_) {
        /* ignore */
      }
    }
    activeReader = null;
    if (activePort) {
      try {
        await activePort.close();
      } catch (_) {
        /* ignore */
      }
    }
    activePort = null;
  };

  w.blockideBrowserSerialIsOpen = function () {
    return !!activePort;
  };

  w.blockideBrowserSerialWrite = async function (text) {
    if (!activePort || !activePort.writable) {
      throw new Error('Serial port is not open');
    }
    var enc = new TextEncoder();
    var writer = activePort.writable.getWriter();
    try {
      await writer.write(enc.encode(text));
    } finally {
      writer.releaseLock();
    }
  };
})(typeof window !== 'undefined' ? window : this);
