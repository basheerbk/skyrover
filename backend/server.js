const express = require('express');
const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const http = require('http');
const https = require('https');
const { Server } = require('socket.io');

const execAsync = promisify(exec);
const app = express();
app.set('trust proxy', 1);
const PORT = Number(process.env.PORT) || 5005;
/** Bind address: use 127.0.0.1 behind nginx; default 0.0.0.0 for local dev */
const HOST = process.env.HOST || '0.0.0.0';

/** One JSON object per line: compile/upload audit trail */
const AUDIT_LOG_DIR = process.env.BLOCKIDE_AUDIT_LOG_DIR
  ? path.resolve(process.env.BLOCKIDE_AUDIT_LOG_DIR)
  : path.join(__dirname, 'data');
const AUDIT_LOG_FILE = path.join(AUDIT_LOG_DIR, 'compile_audit.jsonl');
const AUDIT_INCLUDE_CODE =
  process.env.BLOCKIDE_AUDIT_INCLUDE_CODE === '1' ||
  process.env.BLOCKIDE_AUDIT_INCLUDE_CODE === 'true';

/** Quote a single CLI argument for Windows cmd.exe / POSIX sh (double-quote + escape). */
function safeCliArg(value) {
  const s = String(value);
  if (!/["\s&|<>^%;`$]/.test(s)) return s;
  if (process.platform === 'win32') {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return "'" + s.replace(/'/g, "'\\''") + "'";
}

function truncate(str, max) {
  if (str == null) return null;
  const s = String(str);
  return s.length <= max ? s : s.slice(0, max) + '…';
}

function hashSketch(code) {
  return crypto.createHash('sha256').update(code || '', 'utf8').digest('hex');
}

function resolveAuditUser(req) {
  const b = req.body && typeof req.body === 'object' ? req.body : {};
  const fromBody = b.user ?? b.userId;
  const fromHeader = req.headers['x-user-id'] || req.headers['x-blockide-user'];
  const raw = fromBody != null && fromBody !== '' ? fromBody : fromHeader;
  if (raw == null || raw === '') return 'anonymous';
  const s = String(raw).trim().slice(0, 256);
  return s || 'anonymous';
}

function resolveRequestId(req) {
  const b = req.body && typeof req.body === 'object' ? req.body : {};
  const rid = b.requestId ?? req.headers['x-request-id'];
  if (rid == null || rid === '') return null;
  return String(rid).trim().slice(0, 128);
}

async function logAudit(entry) {
  try {
    await fs.mkdir(AUDIT_LOG_DIR, { recursive: true });
    const line =
      JSON.stringify({
        ts: new Date().toISOString(),
        ...entry,
      }) + '\n';
    await fs.appendFile(AUDIT_LOG_FILE, line, 'utf8');
  } catch (e) {
    console.error('[AUDIT] Write failed:', e.message);
  }
}

/** @param {string} boardFQBN */
function getEsp32FlashOptions(boardFQBN) {
  const fqbn = (boardFQBN || '').toLowerCase();
  if (fqbn.includes('esp32s3') || fqbn.includes('xiaoesp32s3')) {
    return { flashMode: 'dio', flashFreq: '80m', flashSize: '8MB' };
  }
  if (fqbn.includes('esp32c3')) {
    return { flashMode: 'dio', flashFreq: '80m', flashSize: '4MB' };
  }
  return { flashMode: 'dio', flashFreq: '40m', flashSize: '4MB' };
}

/** @param {string} boardFQBN */
function getEsp8266FlashOptions(_boardFQBN) {
  return { flashMode: 'dio', flashFreq: '40m', flashSize: '4MB' };
}

/**
 * ESP8266 Arduino build: single sketch .bin at flash offset 0 (browser esptool-js).
 * @param {string} buildDir
 */
async function collectEsp8266Artifacts(buildDir) {
  async function walk(dir) {
    const names = await fs.readdir(dir);
    /** @type {{ name: string, full: string }[]} */
    const bins = [];
    for (const name of names) {
      const full = path.join(dir, name);
      const st = await fs.stat(full);
      if (st.isDirectory()) {
        bins.push(...(await walk(full)));
      } else if (name.endsWith('.bin')) {
        bins.push({ name, full });
      }
    }
    return bins;
  }
  const all = await walk(buildDir);
  if (all.length === 0) {
    throw new Error('No .bin files in build output. Is esp8266 core installed (arduino-cli core install esp8266:esp8266)?');
  }
  const inoBin = all.find((x) => x.name.toLowerCase().endsWith('.ino.bin'));
  const chosen = inoBin || all[0];
  const buf = await fs.readFile(chosen.full);
  return [{ name: chosen.name, address: 0, dataBase64: buf.toString('base64') }];
}

/**
 * Map Arduino-ESP32 build output .bin files to flash addresses (default partition scheme).
 * @param {string} buildDir
 */
async function collectEsp32Artifacts(buildDir) {
  const files = await fs.readdir(buildDir);
  const bins = files.filter((f) => f.endsWith('.bin'));
  if (bins.length === 0) {
    throw new Error('No .bin files in build output. Is the esp32 core installed (arduino-cli core install esp32:esp32)?');
  }

  const named = bins.map((name) => ({ name, full: path.join(buildDir, name) }));
  const merged = named.find(({ name }) => name.toLowerCase().includes('merged'));
  if (merged) {
    const buf = await fs.readFile(merged.full);
    return [{ name: merged.name, address: 0, dataBase64: buf.toString('base64') }];
  }

  const out = [];
  for (const { name, full } of named) {
    const l = name.toLowerCase();
    let address = null;
    if (l.includes('bootloader')) address = 0x1000;
    else if (l.includes('partitions')) address = 0x8000;
    else if (l.includes('boot_app0')) address = 0xe000;
    else if (l.endsWith('.ino.bin') && !l.includes('bootloader')) address = 0x10000;
    if (address !== null) {
      const buf = await fs.readFile(full);
      out.push({ name, address, dataBase64: buf.toString('base64') });
    }
  }

  const byAddr = new Set(out.map((x) => x.address));
  if (!byAddr.has(0x1000) || !byAddr.has(0x8000) || !byAddr.has(0x10000)) {
    throw new Error(
      'Could not map ESP32 build artifacts to flash addresses. Found: ' + bins.join(', ')
    );
  }
  return out;
}

/**
 * Intel HEX for Arduino Uno (Optiboot / STK500v1). Skips *with_bootloader.hex*.
 * @param {string} buildDir
 * @returns {Promise<string>} absolute path to .ino.hex
 */
async function collectAvrUnoIntelHexPath(buildDir) {
  async function walk(dir) {
    const names = await fs.readdir(dir);
    /** @type {string[]} */
    const matches = [];
    for (const name of names) {
      const full = path.join(dir, name);
      const st = await fs.stat(full);
      if (st.isDirectory()) {
        matches.push(...(await walk(full)));
      } else {
        const lower = name.toLowerCase();
        if (lower.endsWith('.ino.hex') && !lower.includes('with_bootloader')) {
          matches.push(full);
        }
      }
    }
    return matches;
  }
  const hexFiles = await walk(buildDir);
  if (hexFiles.length === 0) {
    throw new Error(
      'No .ino.hex in AVR build output. Is the arduino:avr core installed (arduino-cli core install arduino:avr)?'
    );
  }
  hexFiles.sort((a, b) => a.length - b.length);
  return hexFiles[0];
}

app.use(express.json());
app.use(express.static(path.join(__dirname, '..'), { index: false }));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-User-Id, X-Blockide-User, X-Request-Id'
  );
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

/** Sarvam AI config (default OpenAI-compatible endpoint). */
const SARVAM_API_KEY = String(
  process.env.SARVAM_API_KEY || process.env.SARVAM_API_SUBSCRIPTION_KEY || ''
).trim();
const SARVAM_MODEL = process.env.SARVAM_MODEL || 'sarvam-m';
const SARVAM_BASE_URL =
  process.env.SARVAM_BASE_URL || 'https://api.sarvam.ai/v1/chat/completions';

function postJsonHttps(urlString, bodyObj, extraHeaders) {
  const body = JSON.stringify(bodyObj);
  const u = new URL(urlString);
  const headers = Object.assign(
    {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body, 'utf8'),
    },
    extraHeaders || {}
  );
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: u.hostname,
        path: u.pathname + u.search,
        method: 'POST',
        headers,
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8');
          let json;
          try {
            json = JSON.parse(raw);
          } catch (e) {
            return reject(new Error('Invalid JSON from AI: ' + raw.slice(0, 240)));
          }
          resolve({ status: res.statusCode || 500, json });
        });
      }
    );
    req.on('error', reject);
    req.setTimeout(120000, () => {
      req.destroy();
      reject(new Error('AI request timeout'));
    });
    req.write(body);
    req.end();
  });
}

app.post('/api/ai/chat', async (req, res) => {
  try {
    if (!SARVAM_API_KEY) {
      console.warn('[api/ai/chat] Sarvam not configured (set SARVAM_API_KEY on the server)');
      return res.status(503).json({
        error: 'SERVER_CONFIG',
      });
    }
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const messages = body.messages;
    const context = body.context && typeof body.context === 'object' ? body.context : {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'EMPTY_MESSAGES' });
    }

    const sysText = [
      'You are Skyrover AI Mentor for K-12 students and STEM teachers using Blockly + Arduino/ESP32.',
      'This is NOT blind chat: every request includes current project context. Use it.',
      'Primary goal: teach by guiding thinking, not by dumping full answers too early.',
      'Use age-appropriate language. Keep explanations short, concrete, and encouraging.',
      'When debugging, ask 1-2 diagnostic questions first, then suggest the smallest next test.',
      'For project ideas, provide step-by-step milestones with clear success checks.',
      'Default to BLOCKS-FIRST mentoring: explain which Blockly blocks to drag, where to place them, and why.',
      'Do not output full Arduino code unless the user explicitly asks for code.',
      'If code is requested, provide blocks first, then optional code as a secondary section.',
      'Context priority rules:',
      '1) Trust blocksDescription first (visual workspace is source of truth).',
      '2) Use selectedBlock to resolve "this block" questions.',
      '3) Use code as secondary reference only.',
      '4) If blocks and code disagree, say code may be stale and follow blocks.',
      'Respect IDE mode:',
      '- Beginner mode: prefer beginner-friendly/basic blocks and simple flow.',
      '- Advanced mode: include richer control/sensor/logic block options.',
      'Beginner wording policy: use kid-facing toolbox labels when possible (e.g., "Blink built-in LED", "Turn LED on/off on pin", "Wait (milliseconds)").',
      'When user asks "how to build X", answer in this structure:',
      '1) Blocks to use (exact block names/types they should search for)',
      '2) Build order (top-to-bottom block assembly steps)',
      '3) Wiring checklist',
      '4) Test checklist',
      '5) Common mistakes and quick fixes',
      'Always prioritize safety: mention power, wiring polarity, and safe pin usage when relevant.',
      'Safety boundaries:',
      '- Refuse dangerous instructions (mains voltage, weapon-like or harmful projects, hazardous misuse).',
      '- Recommend adult supervision for risky physical builds.',
      '- Do not directly solve school tests/exams; coach with hints and steps instead.',
      'Format style: short sections, bullets, and numbered steps that kids can follow.',
      'Do NOT reveal internal reasoning, hidden analysis, or tags like <think>. Return only final mentor-facing guidance.',
      '',
      '--- Workspace (current) ---',
      'IDE mode: ' + String(context.ideMode || 'unknown'),
      'Summary: ' + String(context.summary || ''),
      'Selected block (if any): ' + String(context.selectedBlock || '(none)'),
      '',
      '--- Blocks (structure) ---',
      String(context.blocksDescription || '(none)').slice(0, 14000),
      '',
      '--- Generated code (reference) ---',
      String(context.code || '// none').slice(0, 14000),
      '',
      'When useful, end with:',
      '1) "Try this now" (one concrete next action), and',
      '2) "If it fails" (one fallback check).',
    ].join('\n');

    const chatMessages = [];
    for (let i = 0; i < messages.length; i++) {
      const m = messages[i];
      if (!m || typeof m.content !== 'string') continue;
      const role = m.role === 'assistant' ? 'assistant' : 'user';
      chatMessages.push({ role, content: m.content });
    }
    if (chatMessages.length === 0) {
      return res.status(400).json({ error: 'EMPTY_MESSAGES' });
    }

    const url = SARVAM_BASE_URL;
    const sarvamBody = {
      model: SARVAM_MODEL,
      temperature: 0.65,
      max_tokens: 2048,
      messages: [{ role: 'system', content: sysText }].concat(chatMessages),
    };

    const { status, json: data } = await postJsonHttps(url, sarvamBody, {
      Authorization: `Bearer ${SARVAM_API_KEY}`,
    });
    if (status < 200 || status >= 300) {
      const msg =
        (data && data.error && data.error.message) ||
        (typeof data === 'object' ? JSON.stringify(data).slice(0, 600) : String(data));
      console.error('[api/ai/chat] Sarvam HTTP', status, msg);
      return res.status(502).json({
        error: 'API_ERROR',
      });
    }
    let text = '';
    if (data && Array.isArray(data.choices) && data.choices[0] && data.choices[0].message) {
      text = String(data.choices[0].message.content || '');
    } else if (typeof data.output_text === 'string') {
      text = data.output_text;
    }
    if (!text.trim()) {
      const reason =
        (data && data.choices && data.choices[0] && data.choices[0].finish_reason) || null;
      console.error('[api/ai/chat] Empty or short model response', reason || '');
      return res.status(502).json({
        error: 'API_ERROR',
      });
    }
    return res.json({ text: text.trim() });
  } catch (e) {
    console.error('[api/ai/chat]', e);
    return res.status(500).json({
      error: 'NETWORK',
    });
  }
});

let selectedBoard = null;
let serialPort = null;
let serialParser = null;

// Arduino CLI path
function getArduinoCliPath() {
  const cliPath = path.join(__dirname, '..', 'arduino-cli.exe');
  if (require('fs').existsSync(cliPath)) {
    return cliPath;
  }
  return 'arduino-cli'; // Fallback to PATH
}

// Library mapping (same as Python version)
const requiredLibraries = {
  'Servo.h': [],
  'Wire.h': [],
  'SPI.h': [],
  'EEPROM.h': [],
  'SD.h': [],
  'SoftwareSerial.h': [],
  'DHT.h': ['DHT sensor library'],
  'Adafruit_Sensor.h': ['Adafruit Unified Sensor'],
  'Adafruit_SSD1306.h': ['Adafruit SSD1306'],
  'Adafruit_GFX.h': ['Adafruit GFX Library'],
  'Adafruit_NeoPixel.h': ['Adafruit NeoPixel'],
  'IRremote.h': ['IRremote'],
  'Keypad.h': ['Keypad'],
  'LedControl.h': ['LedControl'],
  'LoRa.h': ['LoRa'],
  'OneWire.h': ['OneWire'],
  'SharpIR.h': ['SharpIR'],
  'LiquidCrystal_I2C.h': ['LiquidCrystal I2C'],
  'RTClib.h': ['RTClib'],
  'VirtualWire.h': ['RadioHead'],
  'MFRC522.h': ['MFRC522'],
  'nRF24L01.h': ['RF24'],
  // Add more as needed
};

// Check if library is installed
async function checkLibraryInstalled(libraryName) {
  try {
    const cliPath = getArduinoCliPath();
    const { stdout } = await execAsync(`"${cliPath}" lib list --format json`);
    const libs = JSON.parse(stdout);
    return libs.some(lib => 
      lib.library && lib.library.name && 
      lib.library.name.toLowerCase() === libraryName.toLowerCase()
    );
  } catch (error) {
    // Fallback to text search
    try {
      const { stdout } = await execAsync(`"${cliPath}" lib list`);
      return stdout.toLowerCase().includes(libraryName.toLowerCase());
    } catch (e) {
      return false;
    }
  }
}

// Install libraries in batch
async function installLibrariesBatch(libraryNames) {
  if (!libraryNames || libraryNames.length === 0) return true;
  
  try {
    const cliPath = getArduinoCliPath();
    const libraries = libraryNames.map(lib => `"${lib}"`).join(' ');
    const command = `"${cliPath}" lib install ${libraries}`;
    
    console.log(`[LIBINSTALL] Installing ${libraryNames.length} libraries: ${libraryNames.join(', ')}`);
    
    const { stdout, stderr } = await execAsync(command, { timeout: 180000 });
    console.log(`[LIBINSTALL] Successfully installed libraries`);
    return true;
  } catch (error) {
    console.error(`[LIBINSTALL] Failed to install libraries: ${error.message}`);
    return false;
  }
}

// Install required libraries for code
async function installRequiredLibrariesForCode(code) {
  const headerPattern = /#include\s*[<"]([^>"]+\.h)[>"]/g;
  const headers = [];
  let match;
  
  while ((match = headerPattern.exec(code)) !== null) {
    headers.push(match[1]);
  }
  
  const librariesToInstall = new Set();
  
  for (const header of headers) {
    const libs = requiredLibraries[header] || [];
    for (const lib of libs) {
      if (lib) {
        const installed = await checkLibraryInstalled(lib);
        if (!installed) {
          librariesToInstall.add(lib);
        }
      }
    }
  }
  
  if (librariesToInstall.size > 0) {
    return await installLibrariesBatch(Array.from(librariesToInstall));
  }
  
  return true;
}

// Ensure all required libraries are installed (startup check)
async function ensureRequiredLibraries() {
  console.log('[STARTUP] Checking required Arduino libraries...');
  
  // Update library index first
  try {
    const cliPath = getArduinoCliPath();
    console.log('[STARTUP] Updating library index...');
    await execAsync(`"${cliPath}" lib update-index`, { timeout: 60000 });
    console.log('[STARTUP] Library index updated');
  } catch (error) {
    console.warn('[STARTUP] Could not update library index:', error.message);
  }
  
  // Collect all unique libraries
  const allLibraries = new Set();
  Object.values(requiredLibraries).forEach(libs => {
    libs.forEach(lib => {
      if (lib) allLibraries.add(lib);
    });
  });
  
  // Check and install missing libraries
  const missingLibraries = [];
  for (const lib of allLibraries) {
    const installed = await checkLibraryInstalled(lib);
    if (!installed) {
      missingLibraries.push(lib);
    }
  }
  
  if (missingLibraries.length > 0) {
    console.log(`[STARTUP] Installing ${missingLibraries.length} missing libraries...`);
    await installLibrariesBatch(missingLibraries);
  } else {
    console.log('[STARTUP] All required libraries are installed');
  }
  
  console.log('[STARTUP] Library check complete!');
}

// API Routes
app.get('/healthz', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.get('/status', (req, res) => {
  res.json({ status: 'Server is running!' });
});

app.get('/', (req, res) => {
  // Serve web landing page at root.
  res.sendFile(path.join(__dirname, '..', 'landing.html'));
});

app.get('/ide', (req, res) => {
  // Keep a stable friendly route for the Blockly IDE itself.
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.get('/ports', async (req, res) => {
  try {
    // SerialPort.list() is a static method that returns a Promise in v12+
    const ports = await SerialPort.list();
    const portNames = ports.map(port => port.path || port.comName || port.port);
    res.json(portNames);
  } catch (error) {
    console.error('[PORTS] Error listing ports:', error);
    // Return empty array on error so frontend doesn't break
    res.json([]);
  }
});

app.post('/set_board', (req, res) => {
  const { board } = req.body;
  if (!board) {
    return res.status(400).json({ success: false, message: 'Board FQBN not provided' });
  }
  
  selectedBoard = board;
  console.log(`[SERVER] Board set to ${selectedBoard}`);
  res.json({ success: true, message: `Board set to ${selectedBoard}` });
});

// Library management endpoints (same as Python version)
app.post('/libraries/check', async (req, res) => {
  try {
    await ensureRequiredLibraries();
    res.json({ success: true, message: 'Library check completed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/libraries/fast-check', async (req, res) => {
  try {
    console.log('[FAST] Quick library check...');
    // Only check a few critical libraries
    const criticalLibs = ['DHT sensor library', 'Adafruit Unified Sensor', 'Servo'];
    const missing = [];
    
    for (const lib of criticalLibs) {
      const installed = await checkLibraryInstalled(lib);
      if (!installed) {
        missing.push(lib);
      }
    }
    
    if (missing.length > 0) {
      console.log(`[FAST] Installing critical libraries: ${missing.join(', ')}`);
      await installLibrariesBatch(missing);
    } else {
      console.log('[FAST] All critical libraries available');
    }
    
    res.json({ success: true, message: 'Fast check completed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/libraries/status', async (req, res) => {
  try {
    const cliPath = getArduinoCliPath();
    const { stdout } = await execAsync(`"${cliPath}" lib list --format json`, { timeout: 30000 });
    
    const installedLibs = JSON.parse(stdout);
    const libNames = installedLibs
      .filter(lib => lib.library && lib.library.name)
      .map(lib => lib.library.name);
    
    res.json({
      success: true,
      installed_libraries: libNames,
      total_count: libNames.length
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Could not retrieve library list'
    });
  }
});

app.post('/compile', async (req, res) => {
  const { code, board, returnBinaries } = req.body;

  if (!code) {
    await logAudit({
      event: 'compile',
      user: resolveAuditUser(req),
      requestId: resolveRequestId(req),
      clientIp: req.ip || null,
      board: board || selectedBoard || null,
      codeSha256: null,
      codeLength: 0,
      returnBinaries: !!returnBinaries,
      success: false,
      error: 'No code provided',
    });
    return res.status(400).json({ success: false, message: 'No code provided' });
  }

  const boardFQBN = board || selectedBoard || 'arduino:avr:uno';

  const returnBinsEsp =
    boardFQBN.startsWith('esp32:') || boardFQBN.startsWith('esp8266:');
  const returnBinsAvrUno = boardFQBN === 'arduino:avr:uno';
  if (returnBinaries && !returnBinsEsp && !returnBinsAvrUno) {
    await logAudit({
      event: 'compile',
      user: resolveAuditUser(req),
      requestId: resolveRequestId(req),
      clientIp: req.ip || null,
      board: boardFQBN,
      codeSha256: hashSketch(code),
      codeLength: code.length,
      returnBinaries: true,
      success: false,
      error: 'returnBinaries only for esp32 / esp8266 / arduino:avr:uno',
      ...(AUDIT_INCLUDE_CODE ? { code } : {}),
    });
    return res.status(400).json({
      success: false,
      message:
        'returnBinaries is only supported for ESP32, ESP8266, or arduino:avr:uno (browser USB flash).',
    });
  }

  let tempDir = null;
  try {
    // Install required libraries
    await installRequiredLibrariesForCode(code);

    tempDir = await fs.mkdtemp(path.join(require('os').tmpdir(), 'arduino-'));
    const sketchName = path.basename(tempDir);
    const inoFile = path.join(tempDir, `${sketchName}.ino`);
    await fs.writeFile(inoFile, code, 'utf8');

    const cliPath = getArduinoCliPath();
    const buildDir = path.join(tempDir, 'build');

    let compileCommand;
    if (returnBinaries) {
      await fs.mkdir(buildDir, { recursive: true });
      compileCommand = `"${cliPath}" compile --fqbn ${safeCliArg(boardFQBN)} "${tempDir}" --output-dir "${buildDir}"`;
    } else {
      compileCommand = `"${cliPath}" compile --fqbn ${safeCliArg(boardFQBN)} "${tempDir}"`;
    }

    console.log(`[COMPILE] Compiling for ${boardFQBN}... returnBinaries=${!!returnBinaries}`);

    try {
      const { stdout, stderr } = await execAsync(compileCommand, {
        timeout: 120000,
        cwd: tempDir,
      });

      if (returnBinaries) {
        if (returnBinsAvrUno) {
          const hexPath = await collectAvrUnoIntelHexPath(buildDir);
          const hexIntel = await fs.readFile(hexPath, 'utf8');
          await fs.rm(tempDir, { recursive: true, force: true });
          console.log('[COMPILE] Compilation successful (Arduino Uno Intel HEX for web upload)');
          await logAudit({
            event: 'compile',
            user: resolveAuditUser(req),
            requestId: resolveRequestId(req),
            clientIp: req.ip || null,
            board: boardFQBN,
            codeSha256: hashSketch(code),
            codeLength: code.length,
            returnBinaries: true,
            success: true,
            artifactCount: 1,
            ...(AUDIT_INCLUDE_CODE ? { code } : {}),
          });
          return res.json({
            success: true,
            message: stdout || 'Compilation successful',
            output: stdout,
            hexIntel,
            flashProfile: 'arduino_uno_web',
            baudRate: 115200,
            requestId: resolveRequestId(req) || undefined,
          });
        }

        const is8266 = boardFQBN.startsWith('esp8266:');
        const flashOpts = is8266 ? getEsp8266FlashOptions(boardFQBN) : getEsp32FlashOptions(boardFQBN);
        const artifacts = is8266
          ? await collectEsp8266Artifacts(buildDir)
          : await collectEsp32Artifacts(buildDir);
        await fs.rm(tempDir, { recursive: true, force: true });
        console.log(
          `[COMPILE] Compilation successful (${is8266 ? 'ESP8266' : 'ESP32'} binaries attached)`
        );
        await logAudit({
          event: 'compile',
          user: resolveAuditUser(req),
          requestId: resolveRequestId(req),
          clientIp: req.ip || null,
          board: boardFQBN,
          codeSha256: hashSketch(code),
          codeLength: code.length,
          returnBinaries: true,
          success: true,
          artifactCount: artifacts.length,
          ...(AUDIT_INCLUDE_CODE ? { code } : {}),
        });
        return res.json({
          success: true,
          message: stdout || 'Compilation successful',
          output: stdout,
          artifacts,
          flashMode: flashOpts.flashMode,
          flashFreq: flashOpts.flashFreq,
          flashSize: flashOpts.flashSize,
          requestId: resolveRequestId(req) || undefined,
        });
      }

      await fs.rm(tempDir, { recursive: true, force: true });

      console.log('[COMPILE] Compilation successful');
      await logAudit({
        event: 'compile',
        user: resolveAuditUser(req),
        requestId: resolveRequestId(req),
        clientIp: req.ip || null,
        board: boardFQBN,
        codeSha256: hashSketch(code),
        codeLength: code.length,
        returnBinaries: false,
        success: true,
        ...(AUDIT_INCLUDE_CODE ? { code } : {}),
      });
      res.json({
        success: true,
        message: stdout || 'Compilation successful',
        output: stdout,
        requestId: resolveRequestId(req) || undefined,
      });
    } catch (compileError) {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
      console.error('[COMPILE] Compilation failed');
      const errMsg = compileError.stderr || compileError.message || 'Compilation failed';
      await logAudit({
        event: 'compile',
        user: resolveAuditUser(req),
        requestId: resolveRequestId(req),
        clientIp: req.ip || null,
        board: boardFQBN,
        codeSha256: hashSketch(code),
        codeLength: code.length,
        returnBinaries: !!returnBinaries,
        success: false,
        error: truncate(errMsg, 4000),
        ...(AUDIT_INCLUDE_CODE ? { code } : {}),
      });
      return res.status(400).json({
        success: false,
        message: errMsg,
        requestId: resolveRequestId(req) || undefined,
      });
    }
  } catch (error) {
    console.error('[COMPILE] Error:', error);
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
    await logAudit({
      event: 'compile',
      user: resolveAuditUser(req),
      requestId: resolveRequestId(req),
      clientIp: req.ip || null,
      board: board || selectedBoard || null,
      codeSha256: code ? hashSketch(code) : null,
      codeLength: code ? code.length : 0,
      returnBinaries: !!returnBinaries,
      success: false,
      error: truncate(error.message, 4000),
      ...(AUDIT_INCLUDE_CODE && code ? { code } : {}),
    });
    res.status(500).json({
      success: false,
      message: error.message,
      error: error.stderr || error.stdout || error.message,
      requestId: resolveRequestId(req) || undefined,
    });
  }
});

app.post('/upload', async (req, res) => {
  // Support both JSON and form data (same as Python version)
  let code, board, port;
  
  if (req.is('application/json')) {
    const data = req.body;
    code = data.code;
    board = data.board;
    port = data.port;
  } else {
    code = req.body.code || (req.body.toString ? req.body.toString('utf8') : '');
    board = req.body.board || req.query.board;
    port = req.body.port || req.query.port || req.headers['x-serial-port'];
  }
  
  if (!code) {
    console.log('[UPLOAD] No code provided.');
    await logAudit({
      event: 'upload',
      user: resolveAuditUser(req),
      requestId: resolveRequestId(req),
      clientIp: req.ip || null,
      board: board || selectedBoard || null,
      port: null,
      codeSha256: null,
      codeLength: 0,
      success: false,
      error: 'No code provided',
    });
    return res.status(400).json({ success: false, message: 'No code provided' });
  }

  if (!port) {
    console.log('[UPLOAD] No serial port specified.');
    await logAudit({
      event: 'upload',
      user: resolveAuditUser(req),
      requestId: resolveRequestId(req),
      clientIp: req.ip || null,
      board: board || selectedBoard || null,
      port: null,
      codeSha256: hashSketch(code),
      codeLength: code.length,
      success: false,
      error: 'No serial port specified',
      ...(AUDIT_INCLUDE_CODE ? { code } : {}),
    });
    return res.status(400).json({ success: false, message: 'No serial port specified.' });
  }

  if (!selectedBoard && !board) {
    await logAudit({
      event: 'upload',
      user: resolveAuditUser(req),
      requestId: resolveRequestId(req),
      clientIp: req.ip || null,
      board: null,
      port: truncate(String(port), 128),
      codeSha256: hashSketch(code),
      codeLength: code.length,
      success: false,
      error: 'Please select a board first',
      ...(AUDIT_INCLUDE_CODE ? { code } : {}),
    });
    return res.status(400).json({ success: false, message: 'Please select a board first' });
  }

  const boardFQBN = board || selectedBoard || 'arduino:avr:uno';
  const portLabel = truncate(String(port), 128);

  console.log(`[UPLOAD] Using FQBN: ${boardFQBN}, Port: ${port}`);

  let tempDir = null;
  try {
    // Install required libraries
    await installRequiredLibrariesForCode(code);

    // Create temporary directory (same structure as Python version)
    tempDir = await fs.mkdtemp(path.join(require('os').tmpdir(), 'arduino-'));
    const sketchName = path.basename(tempDir);
    
    // Arduino CLI expects: tempDir/sketchName.ino (file directly in tempDir, NOT in subfolder)
    // Write code to file (same naming as Python: folder_name.ino)
    const inoFile = path.join(tempDir, `${sketchName}.ino`);
    await fs.writeFile(inoFile, code, 'utf8');
    
    const cliPath = getArduinoCliPath();
    
    // Step 1: Compile first (use tempDir - Arduino CLI expects the .ino file directly in this directory)
    const compileCommand = `"${cliPath}" compile --fqbn ${safeCliArg(boardFQBN)} "${tempDir}"`;
    console.log(`[UPLOAD] Compiling for ${boardFQBN}...`);

    try {
      const compileResult = await execAsync(compileCommand, {
        timeout: 120000,
        cwd: tempDir,
      });
      console.log('[UPLOAD] Compile stdout:', compileResult.stdout);
      if (compileResult.stderr) {
        console.log('[UPLOAD] Compile stderr:', compileResult.stderr);
      }
    } catch (compileError) {
      console.error('[UPLOAD] Compile failed');
      console.error('[UPLOAD] Compile stderr:', compileError.stderr || compileError.message);
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
      const cmsg = compileError.stderr || compileError.message || 'Compilation failed';
      await logAudit({
        event: 'upload',
        phase: 'compile',
        user: resolveAuditUser(req),
        requestId: resolveRequestId(req),
        clientIp: req.ip || null,
        board: boardFQBN,
        port: portLabel,
        codeSha256: hashSketch(code),
        codeLength: code.length,
        success: false,
        error: truncate(cmsg, 4000),
        ...(AUDIT_INCLUDE_CODE ? { code } : {}),
      });
      return res.status(400).json({
        success: false,
        message: cmsg,
        requestId: resolveRequestId(req) || undefined,
      });
    }
    
    // Step 2: Upload (use tempDir - Arduino CLI expects the .ino file directly in this directory)
    let uploadCommand = `"${cliPath}" upload -p ${safeCliArg(port)} --fqbn ${safeCliArg(boardFQBN)} "${tempDir}"`;
    
    // Add special flags for ESP32-S3 boards (same as Python version)
    if (boardFQBN === 'esp32:esp32:xiaoesp32s3' || boardFQBN === 'esp32:esp32:esp32s3') {
      uploadCommand += ' --flash-mode dio --flash-freq 80m --flash-size 8MB';
      console.log('[UPLOAD] Using ESP32-S3 special flags');
    }
    
    console.log(`[UPLOAD] Uploading to ${port} (${boardFQBN})...`);
    
    try {
      const { stdout, stderr } = await execAsync(uploadCommand, { 
        timeout: 120000,
        cwd: tempDir 
      });
      
      console.log('[UPLOAD] Upload stdout:', stdout);
      if (stderr) {
        console.log('[UPLOAD] Upload stderr:', stderr);
      }
      
      // Check for fatal errors (same as Python version)
      const fatalError = stderr && (
        stderr.includes('A fatal error occurred') ||
        stderr.includes('could not open port') ||
        stderr.includes('FileNotFoundError')
      );
      
      if (fatalError) {
        console.error('[UPLOAD] Upload failed.');
        await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
        await logAudit({
          event: 'upload',
          phase: 'flash',
          user: resolveAuditUser(req),
          requestId: resolveRequestId(req),
          clientIp: req.ip || null,
          board: boardFQBN,
          port: portLabel,
          codeSha256: hashSketch(code),
          codeLength: code.length,
          success: false,
          error: truncate(stderr || 'Upload failed', 4000),
          ...(AUDIT_INCLUDE_CODE ? { code } : {}),
        });
        return res.status(400).json({
          success: false,
          message: stderr || 'Upload failed',
          requestId: resolveRequestId(req) || undefined,
        });
      }

      // Cleanup
      await fs.rm(tempDir, { recursive: true, force: true });

      console.log('[UPLOAD] Upload succeeded.');
      await logAudit({
        event: 'upload',
        phase: 'flash',
        user: resolveAuditUser(req),
        requestId: resolveRequestId(req),
        clientIp: req.ip || null,
        board: boardFQBN,
        port: portLabel,
        codeSha256: hashSketch(code),
        codeLength: code.length,
        success: true,
        ...(AUDIT_INCLUDE_CODE ? { code } : {}),
      });
      res.json({
        success: true,
        message: stdout || 'Upload successful',
        output: stdout,
        requestId: resolveRequestId(req) || undefined,
      });
    } catch (uploadError) {
      console.error('[UPLOAD] Upload failed.');
      console.error('[UPLOAD] Upload stderr:', uploadError.stderr || uploadError.message);
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
      const umsg = uploadError.stderr || uploadError.message || 'Upload failed';
      await logAudit({
        event: 'upload',
        phase: 'flash',
        user: resolveAuditUser(req),
        requestId: resolveRequestId(req),
        clientIp: req.ip || null,
        board: boardFQBN,
        port: portLabel,
        codeSha256: hashSketch(code),
        codeLength: code.length,
        success: false,
        error: truncate(umsg, 4000),
        ...(AUDIT_INCLUDE_CODE ? { code } : {}),
      });
      return res.status(400).json({
        success: false,
        message: umsg,
        requestId: resolveRequestId(req) || undefined,
      });
    }
  } catch (error) {
    console.error('[UPLOAD] Exception during upload:', error);
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
    await logAudit({
      event: 'upload',
      user: resolveAuditUser(req),
      requestId: resolveRequestId(req),
      clientIp: req.ip || null,
      board: board || selectedBoard || null,
      port: port ? truncate(String(port), 128) : null,
      codeSha256: code ? hashSketch(code) : null,
      codeLength: code ? code.length : 0,
      success: false,
      error: truncate(error.message, 4000),
      ...(AUDIT_INCLUDE_CODE && code ? { code } : {}),
    });
    res.status(500).json({
      success: false,
      message: error.message || 'Unknown error during upload',
      requestId: resolveRequestId(req) || undefined,
    });
  }
});

// HTTP server and Socket.IO for serial communication
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Socket.IO handlers for serial communication
io.on('connection', (socket) => {
  console.log('[SOCKET.IO] Client connected');
  
  socket.on('open_serial', async (data) => {
    const { port, baudrate = 9600 } = data;
    
    if (serialPort && serialPort.isOpen) {
      try {
        socket.emit('serial_error', { error: 'Port already open' });
      } catch (e) {
        // Socket might be closed, ignore
      }
      return;
    }
    
    try {
      serialPort = new SerialPort({ path: port, baudRate: baudrate });
      serialParser = serialPort.pipe(new ReadlineParser({ delimiter: '\n' }));
      
      serialParser.on('data', (data) => {
        // Check if socket is still connected before emitting
        if (socket.connected) {
          try {
            socket.emit('serial_data', { data: data.toString() });
          } catch (e) {
            // Socket closed, ignore
          }
        }
      });
      
      serialPort.on('error', (error) => {
        console.error('[SERIAL] Error:', error);
        if (socket.connected) {
          try {
            socket.emit('serial_error', { error: error.message });
          } catch (e) {
            // Socket closed, ignore
          }
        }
      });
      
      if (socket.connected) {
        try {
          socket.emit('serial_opened', { success: true, message: `Port ${port} opened` });
        } catch (e) {
          // Socket closed, ignore
        }
      }
      console.log(`[SERIAL] Port ${port} opened at ${baudrate} baud`);
      
    } catch (error) {
      if (socket.connected) {
        try {
          socket.emit('serial_error', { error: error.message });
        } catch (e) {
          // Socket closed, ignore
        }
      }
    }
  });
  
  socket.on('close_serial', () => {
    console.log('[SERIAL] Attempting to close port.');
    if (serialPort && serialPort.isOpen) {
      try {
        const portName = serialPort.path;
        serialPort.close();
        serialPort = null;
        serialParser = null;
        console.log(`[SERIAL] Successfully closed port ${portName}.`);
        if (socket.connected) {
          try {
            socket.emit('serial_closed', { success: true, message: 'Port closed' });
          } catch (e) {
            // Socket closed, ignore
          }
        }
      } catch (e) {
        console.error('[SERIAL] Exception while closing port:', e);
        if (socket.connected) {
          try {
            socket.emit('serial_error', { error: String(e) });
          } catch (e2) {
            // Socket closed, ignore
          }
        }
      }
    } else {
      console.log('[SERIAL] Error: No port was open to close.');
      if (socket.connected) {
        try {
          socket.emit('serial_error', { error: 'No port open.' });
        } catch (e) {
          // Socket closed, ignore
        }
      }
    }
  });
  
  socket.on('write_serial', (data) => {
    const msg = typeof data === 'string' ? data : (data.data || data || '');
    
    if (serialPort && serialPort.isOpen) {
      try {
        // Encode string to buffer (same as Python's encode())
        const dataToWrite = Buffer.from(msg, 'utf8');
        serialPort.write(dataToWrite);
        if (socket.connected) {
          try {
            socket.emit('serial_written', { success: true });
          } catch (e) {
            // Socket closed, ignore
          }
        }
      } catch (e) {
        console.error('[SERIAL] Error writing to port:', e);
        if (socket.connected) {
          try {
            socket.emit('serial_error', { error: String(e) });
          } catch (e2) {
            // Socket closed, ignore
          }
        }
      }
    } else {
      if (socket.connected) {
        try {
          socket.emit('serial_error', { error: 'No port open.' });
        } catch (e) {
          // Socket closed, ignore
        }
      }
    }
  });
  
  socket.on('disconnect', () => {
    // Use try-catch to prevent EPIPE errors when socket is already closed
    try {
      console.log('[SOCKET.IO] Client disconnected');
    } catch (e) {
      // Ignore EPIPE errors when socket is closed
    }
    if (serialPort && serialPort.isOpen) {
      try {
        serialPort.close();
      } catch (e) {
        // Ignore errors during close
      }
      serialPort = null;
      serialParser = null;
    }
  });
});

// Start server with error handling
let retryListenScheduled = false;
server.listen(PORT, HOST, () => {
  // Output clear messages that Electron can detect
  const readyMessage = `[SERVER] Server running on http://${HOST}:${PORT}`;
  const readyMessage2 = '[SERVER] Node.js backend ready!';
  
  // Output to stdout (Electron captures this)
  console.log(readyMessage);
  console.log(readyMessage2);
  console.log(`[AUDIT] Compile/upload log: ${AUDIT_LOG_FILE} (set BLOCKIDE_AUDIT_INCLUDE_CODE=true to store full sketches)`);
  console.log('[BLINKBOT] Blink Bot BLE support: Available via Web Bluetooth API');
  console.log('[BLINKBOT] Note: BLE operations are handled in the browser/renderer process');
  
  // Also write directly to ensure it's captured
  process.stdout.write(readyMessage + '\n');
  process.stdout.write(readyMessage2 + '\n');
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[SERVER] Port ${PORT} is already in use!`);
    console.error('[SERVER] Please close the existing server or change the port.');
    console.error('[SERVER] Trying to find and kill the process...');
    
    // Try to find and kill the process on Windows
    if (process.platform === 'win32') {
      const { exec } = require('child_process');
      exec(`netstat -ano | findstr :${PORT}`, (error, stdout) => {
        if (stdout) {
          const lines = stdout.trim().split('\n');
          const pids = new Set();
          lines.forEach(line => {
            const parts = line.trim().split(/\s+/);
            if (parts.length > 0) {
              const pid = parts[parts.length - 1];
              if (pid && !isNaN(pid)) {
                pids.add(pid);
              }
            }
          });
          
          pids.forEach(pid => {
            // Never try to kill this server process.
            if (String(pid) === String(process.pid)) {
              return;
            }
            console.log(`[SERVER] Attempting to kill process ${pid}...`);
            exec(`taskkill /F /PID ${pid}`, (err) => {
              if (!err) {
                console.log(`[SERVER] Killed process ${pid}`);
                // Retry starting server once after a delay.
                if (!retryListenScheduled) {
                  retryListenScheduled = true;
                  setTimeout(() => {
                    if (server.listening) {
                      retryListenScheduled = false;
                      return;
                    }
                    console.log('[SERVER] Retrying to start server...');
                    server.listen(PORT, HOST, () => {
                      retryListenScheduled = false;
                      console.log(`[SERVER] Server running on http://${HOST}:${PORT}`);
                      console.log('[SERVER] Node.js backend ready!');
                    });
                  }, 1000);
                }
              }
            });
          });
        }
      });
    }
  } else {
    console.error('[SERVER] Server error:', err);
    process.exit(1);
  }
});

// Optional: Run library check on startup (can be disabled for faster startup)
// Uncomment the line below if you want to check libraries on every startup
// ensureRequiredLibraries().catch(err => console.error('[STARTUP] Library check failed:', err));

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[SERVER] Shutting down...');
  if (serialPort && serialPort.isOpen) {
    serialPort.close();
  }
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[SERVER] Received SIGINT, shutting down...');
  if (serialPort && serialPort.isOpen) {
    serialPort.close();
  }
  server.close(() => {
    process.exit(0);
  });
});

