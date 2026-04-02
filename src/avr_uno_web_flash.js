/**
 * Arduino Uno: compile on server (Intel HEX) + flash in browser via Web Serial (STK500v1 / Optiboot).
 */

import avrbro from 'avrbro';

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

/**
 * @param {string} backendUrl
 * @param {string} code
 * @param {string} board FQBN must be arduino:avr:uno
 */
export async function compileUnoForWeb(backendUrl, code, board) {
  const b = (board || '').trim();
  if (b !== 'arduino:avr:uno') {
    throw new Error('Browser Uno upload supports board arduino:avr:uno only.');
  }
  const base = (backendUrl || '').replace(/\/$/, '');
  const res = await fetch(`${base}/compile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(Object.assign({ code, board: b, returnBinaries: true }, auditFields())),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.message || data.error || 'Compile failed');
  }
  if (!data.hexIntel || typeof data.hexIntel !== 'string') {
    throw new Error('Server returned no Intel HEX (install arduino:avr on the compile server).');
  }
  return data;
}

/**
 * @param {SerialPort} serialPort
 * @param {{ hexIntel: string, baudRate?: number }} compileResult
 * @param {{ onLog?: (s: string) => void }} [options]
 */
export async function flashUnoWithWebSerial(serialPort, compileResult, options = {}) {
  const { onLog } = options;
  const baudRate = compileResult.baudRate || 115200;
  await serialPort.open({ baudRate });
  const reader = serialPort.readable.getReader();
  const writer = serialPort.writable.getWriter();
  const serial = { port: serialPort, reader, writer };
  try {
    const hexData = avrbro.parseHex(compileResult.hexIntel);
    if (onLog) onLog(`Flashing Arduino Uno (STK500, ${baudRate} baud)…`);
    await avrbro.flash(serial, hexData, { boardName: 'uno', debug: false });
    if (onLog) onLog('Upload complete.');
  } finally {
    try {
      await avrbro.closeSerial(serial);
    } catch (_) {
      /* noop */
    }
  }
}

/**
 * @param {{
 *   backendUrl: string,
 *   code: string,
 *   board?: string,
 *   portPromise?: Promise<SerialPort>,
 *   serialPort?: SerialPort,
 *   onLog?: (s: string) => void
 * }} opts
 */
export async function compileAndFlashUnoWeb(opts) {
  const {
    backendUrl,
    code,
    board = 'arduino:avr:uno',
    onLog,
    serialPort: preAuthorizedPort,
    portPromise: externalPortPromise,
  } = opts;

  if (typeof navigator === 'undefined' || !navigator.serial) {
    const insecure =
      typeof window !== 'undefined' &&
      typeof window.isSecureContext !== 'undefined' &&
      !window.isSecureContext;
    const ua = typeof navigator !== 'undefined' ? String(navigator.userAgent || '') : '';
    const mobileUa = /iPhone|iPad|iPod|Android|Mobile\/|webOS/i.test(ua);
    throw new Error(
      insecure
        ? 'Web Serial is off on non-HTTPS pages. Use https://your-domain, or SSH tunnel and open http://localhost:5005 (see docs/deploy-oracle.md).'
        : mobileUa
          ? 'Web Serial is not supported on phone/tablet (or mobile emulation in DevTools). Turn off device emulation, use Chrome or Edge on a desktop, USB-connect your board, then Upload.'
          : 'Web Serial is not available in this browser. Use Chrome or Edge on desktop (latest).'
    );
  }

  const compilePromise = compileUnoForWeb(backendUrl, code, board);
  let port;
  let compileResult;

  if (preAuthorizedPort) {
    if (onLog) onLog('Compiling on server…');
    compileResult = await compilePromise;
    port = preAuthorizedPort;
  } else {
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
    if (onLog) onLog('Compilation finished. Uploading sketch…');
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
    await flashUnoWithWebSerial(port, compileResult, { onLog });
  } finally {
    try {
      await port.close();
    } catch (_) {
      /* ignore */
    }
  }
}
