/**
 * ESP32 + ESP8266: compile via backend (returnBinaries), then flash with Web Serial + esptool-js (browser).
 * Arduino Uno / AVR still use server /upload with a local serial port (not cloud USB).
 */

import { ESPLoader, Transport } from 'esptool-js';

function auditFields() {
  if (typeof BlocklyDuino !== 'undefined' && typeof BlocklyDuino.auditRequestFields === 'function') {
    return BlocklyDuino.auditRequestFields();
  }
  const o = {};
  try {
    if (typeof window !== 'undefined' && window.BLOCKIDE_USER) {
      const u = String(window.BLOCKIDE_USER).trim().slice(0, 256);
      if (u) o.user = u;
    }
    if (!o.user) {
      const u = (
        sessionStorage.getItem('blockide_user') ||
        localStorage.getItem('blockide_user') ||
        ''
      ).trim().slice(0, 256);
      if (u) o.user = u;
    }
  } catch (_) {
    /* ignore */
  }
  try {
    o.requestId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `r-${Date.now()}`;
  } catch (_) {
    o.requestId = `r-${Date.now()}`;
  }
  return o;
}

function b64ToUint8Array(b64) {
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function compileEsp32ForWeb(backendUrl, code, board) {
  const b = (board || '').trim();
  if (!b.startsWith('esp32:') && !b.startsWith('esp8266:')) {
    throw new Error('Web USB flash supports ESP32 (esp32:…) or ESP8266 (esp8266:…) boards only.');
  }
  const base = backendUrl || '';
  const res = await fetch(`${base}/compile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(Object.assign({ code, board, returnBinaries: true }, auditFields())),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.message || data.error || 'Compile failed');
  }
  if (!data.artifacts || !data.artifacts.length) {
    throw new Error(
      'Server returned no firmware binaries (install esp32:esp32 or esp8266:esp8266 core on the compile server).'
    );
  }
  return data;
}

export async function flashEsp32WithWebSerial(serialPort, compileResult, options = {}) {
  const {
    onLog,
    board,
    flashMode = compileResult.flashMode || 'dio',
    flashFreq = compileResult.flashFreq || '40m',
    flashSize = compileResult.flashSize || '4MB',
    onProgress,
  } = options;

  const terminal = {
    clean() {},
    writeLine(s) {
      if (onLog) onLog(s);
    },
    write(s) {
      if (onLog) onLog(s);
    },
  };

  const transport = new Transport(serialPort, false);
  const loader = new ESPLoader({
    transport,
    baudrate: 115200,
    terminal,
    debugLogging: false,
  });

  await loader.main();

  const fileArray = compileResult.artifacts
    .map((a) => ({
      data: typeof a.dataBase64 === 'string' ? b64ToUint8Array(a.dataBase64) : a.data,
      address: a.address,
    }))
    .sort((x, y) => x.address - y.address);

  await loader.writeFlash({
    fileArray,
    flashMode,
    flashFreq,
    flashSize,
    eraseAll: false,
    compress: true,
    reportProgress: onProgress || (() => {}),
  });

  const resetMode =
    typeof board === 'string' && board.startsWith('esp8266:') ? 'soft_reset' : 'hard_reset';
  await loader.after(resetMode);
}

/**
 * @param {object} opts
 * @param {string} opts.backendUrl Same-origin '' when served from backend, or 'http://localhost:5005'
 * @param {string} opts.code Arduino sketch source
 * @param {string} opts.board FQBN e.g. esp32:esp32:esp32 or esp8266:esp8266:nodemcuv2
 * @param {function(string): void} [opts.onLog]
 * @param {function(number,number,number): void} [opts.onProgress]
 * @param {SerialPort} [opts.serialPort] Already-authorized port from navigator.serial.getPorts() — skips requestPort (required after async delays where the user gesture is gone).
 * @param {Promise<SerialPort>} [opts.portPromise] Return value of requestPort() called synchronously in the click handler — required on Chromium when this function runs inside async/regenerator (otherwise requestPort throws "user gesture").
 */
export async function compileAndFlashEsp32Web(opts) {
  const {
    backendUrl,
    code,
    board,
    onLog,
    onProgress,
    serialPort: preAuthorizedPort,
    portPromise: externalPortPromise,
  } = opts;

  if (typeof navigator === 'undefined' || !navigator.serial) {
    var insecure =
      typeof window !== 'undefined' &&
      typeof window.isSecureContext !== 'undefined' &&
      !window.isSecureContext;
    var ua = typeof navigator !== 'undefined' ? String(navigator.userAgent || '') : '';
    var mobileUa = /iPhone|iPad|iPod|Android|Mobile\/|webOS/i.test(ua);
    throw new Error(
      insecure
        ? 'Web Serial is off on non-HTTPS pages. Use https://your-domain, or SSH tunnel and open http://localhost:5005 (see docs/deploy-oracle.md).'
        : mobileUa
          ? 'Web Serial is not supported on phone/tablet (or mobile emulation in DevTools). Turn off device emulation, use Chrome or Edge on a desktop, USB-connect your board, then Upload.'
          : 'Web Serial is not available in this browser. Use Chrome or Edge on desktop (latest).'
    );
  }

  const compilePromise = compileEsp32ForWeb(backendUrl, code, board);
  let port;
  let compileResult;

  if (preAuthorizedPort) {
    if (onLog) onLog('Compiling on server…');
    compileResult = await compilePromise;
    port = preAuthorizedPort;
  } else {
    // Prefer portPromise from a synchronous click handler; calling requestPort() here often fails
    // after async boundaries (Babel regenerator, async doUpload, etc.).
    const portPromise =
      externalPortPromise != null ? externalPortPromise : navigator.serial.requestPort();
    if (onLog) {
      onLog(
        externalPortPromise != null
          ? 'Compiling on server… (finish choosing your USB port if the dialog is open)'
          : 'Select your USB serial port in the browser dialog. Compiling on server…'
      );
    }
    try {
      compileResult = await compilePromise;
    } catch (e) {
      portPromise.catch(() => {});
      throw e;
    }
    if (onLog) onLog('Compilation finished. Flashing firmware…');
    try {
      port = await portPromise;
    } catch (e) {
      const msg = e && e.message ? String(e.message) : String(e);
      const lower = msg.toLowerCase();
      if (e && e.name === 'NotFoundError') {
        throw new Error('No USB port was selected.');
      }
      if (lower.includes('user gesture') || lower.includes('requestport')) {
        throw new Error(
          'Browser blocked the USB picker. Click Upload and select the USB device immediately from the popup.'
        );
      }
      if (lower.includes('cancel')) {
        throw new Error('USB port selection was cancelled.');
      }
      throw new Error(msg);
    }
  }

  try {
    await flashEsp32WithWebSerial(port, compileResult, { onLog, onProgress, board });
  } finally {
    try {
      await port.close();
    } catch (_) {
      /* ignore */
    }
  }
}
