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
        : 'No USB device yet — click Connect and choose your board in the browser dialog';
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

  /**
   * Fill two dropdowns from the same Web Serial getPorts() snapshot so option values match.
   * @param {HTMLSelectElement|null} selA
   * @param {HTMLSelectElement|null} selB
   * @param {string} [preferValue]
   */
  w.blockideSyncWebSerialPortDropdowns = async function (selA, selB, preferValue) {
    var pref =
      preferValue != null
        ? preferValue
        : (selA && selA.value) || (selB && selB.value) || '';
    if (selA) {
      await w.blockideFillWebSerialSelect(selA, pref);
    }
    var v = selA ? selA.value : pref;
    if (selB) {
      await w.blockideFillWebSerialSelect(selB, v);
    }
    if (selA && selB && selA.value && Array.from(selB.options).some(function (o) { return o.value === selA.value; })) {
      selB.value = selA.value;
    } else if (selB && selB.value && selA && Array.from(selA.options).some(function (o) { return o.value === selB.value; })) {
      selA.value = selB.value;
    }
  };

  /**
   * Copy options from one select to another (Electron COM list).
   * @param {HTMLSelectElement|null} fromEl
   * @param {HTMLSelectElement|null} toEl
   */
  w.blockideCopySelectOptions = function (fromEl, toEl) {
    if (!fromEl || !toEl) return;
    toEl.innerHTML = fromEl.innerHTML;
    toEl.disabled = fromEl.disabled;
    var v = fromEl.value;
    if (v && Array.from(toEl.options).some(function (o) { return o.value === v; })) {
      toEl.value = v;
    }
  };

  var serialReadActive = false;
  var activeReader = null;
  var activePort = null;

  function serialErrorMessage(e) {
    if (e == null) return 'Unknown error';
    if (typeof e === 'string') return e;
    return e.message || String(e);
  }

  /** True when close() failed only because the port was already closed (safe to try forget). */
  function isAlreadyClosedError(e) {
    if (!e) return false;
    var name = e.name || '';
    var msg = (e.message || '').toLowerCase();
    if (name === 'InvalidStateError') return true;
    if (msg.indexOf('already closed') !== -1) return true;
    if (msg.indexOf('the port is already closed') !== -1) return true;
    return false;
  }

  w.blockideBrowserSerialOpen = async function (portValue, baudRate, onChunk) {
    await w.blockideBrowserSerialClose();
    var idx = w.blockideWebSerialParseIndex(portValue);
    if (idx == null || !navigator.serial) {
      throw new Error('Invalid USB serial selection');
    }
    var ports;
    try {
      ports = await navigator.serial.getPorts();
    } catch (e) {
      throw new Error('Could not list USB devices: ' + serialErrorMessage(e));
    }
    var port = ports[idx];
    if (!port) {
      throw new Error('That USB device is no longer listed — use ＋ Add again');
    }
    try {
      await port.open({ baudRate: baudRate || 9600 });
    } catch (e) {
      throw new Error('Could not open port: ' + serialErrorMessage(e));
    }
    var reader;
    try {
      reader = port.readable.getReader();
    } catch (e) {
      try {
        await port.close();
      } catch (_) {
        /* ignore */
      }
      throw new Error('Could not start serial reader: ' + serialErrorMessage(e));
    }
    activePort = port;
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

  /**
   * Close the active Web Serial connection.
   * @param {{ forget?: boolean }} [options] If forget is true, call SerialPort.forget() after close (Chrome/Edge)
   *   so the site loses permission until the user picks the device again in Connect. Omit or false for temporary
   *   closes (e.g. before firmware upload).
   * @returns {Promise<{
   *   stateCleared: boolean,
   *   hadActivePort: boolean,
   *   closed: boolean,
   *   forgetRequested: boolean,
   *   forgetSupported: boolean,
   *   forgotten: boolean,
   *   errors: Array<{ phase: string, message: string }>
   * }>}
   */
  w.blockideBrowserSerialClose = async function (options) {
    var forgetPairing = options && options.forget === true;
    var errors = [];
    var hadActivePort = !!activePort;
    var closed = false;
    var forgotten = false;
    var forgetSupported = false;

    if (!navigator.serial) {
      serialReadActive = false;
      activeReader = null;
      activePort = null;
      return {
        stateCleared: true,
        hadActivePort: hadActivePort,
        closed: !hadActivePort,
        forgetRequested: forgetPairing,
        forgetSupported: false,
        forgotten: false,
        errors: hadActivePort
          ? [{ phase: 'api', message: 'Web Serial API is not available in this context' }]
          : []
      };
    }

    serialReadActive = false;
    if (activeReader) {
      try {
        await activeReader.cancel();
      } catch (e) {
        errors.push({ phase: 'reader_cancel', message: serialErrorMessage(e) });
      }
      try {
        activeReader.releaseLock();
      } catch (e) {
        errors.push({ phase: 'reader_release', message: serialErrorMessage(e) });
      }
    }
    activeReader = null;
    var portRef = activePort;
    activePort = null;

    if (portRef) {
      try {
        await portRef.close();
        closed = true;
      } catch (e) {
        if (isAlreadyClosedError(e)) {
          closed = true;
        } else {
          errors.push({ phase: 'close', message: serialErrorMessage(e) });
        }
      }

      if (forgetPairing && typeof portRef.forget === 'function') {
        forgetSupported = true;
        if (closed) {
          try {
            await portRef.forget();
            forgotten = true;
          } catch (e) {
            errors.push({ phase: 'forget', message: serialErrorMessage(e) });
          }
        }
      } else if (forgetPairing) {
        errors.push({
          phase: 'forget',
          message: 'This browser does not support unpairing (SerialPort.forget). Use site settings to revoke USB access if needed.'
        });
      }
    }

    return {
      stateCleared: true,
      hadActivePort: hadActivePort,
      closed: hadActivePort ? closed : true,
      forgetRequested: forgetPairing,
      forgetSupported: forgetSupported,
      forgotten: forgotten,
      errors: errors
    };
  };

  w.blockideBrowserSerialIsOpen = function () {
    return !!activePort;
  };

  w.blockideBrowserSerialWrite = async function (text) {
    if (!activePort || !activePort.writable) {
      throw new Error('Serial port is not open');
    }
    var enc = new TextEncoder();
    var writer;
    try {
      writer = activePort.writable.getWriter();
    } catch (e) {
      throw new Error('Serial write stream is busy: ' + serialErrorMessage(e));
    }
    try {
      await writer.write(enc.encode(text));
    } catch (e) {
      throw new Error('Serial write failed: ' + serialErrorMessage(e));
    } finally {
      try {
        writer.releaseLock();
      } catch (e) {
        console.warn('[WebSerial] releaseLock after write', e);
      }
    }
  };
})(typeof window !== 'undefined' ? window : this);
