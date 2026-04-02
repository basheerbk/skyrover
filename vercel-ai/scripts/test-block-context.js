/**
 * One-shot: POST /api/chat with BlockIDE-shaped payload (messages + context).
 * Loads ../.env for client Bearer token. Usage from vercel-ai:
 *   node scripts/test-block-context.js
 *   node scripts/test-block-context.js --url https://other.vercel.app/api/chat
 */
/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

function parseUrl(argv) {
  const i = argv.indexOf('--url');
  if (i >= 0 && argv[i + 1]) return argv[i + 1].trim();
  return 'https://vercel-ai-lovat.vercel.app/api/chat';
}

loadDotEnv(path.join(__dirname, '..', '.env'));

const url = parseUrl(process.argv.slice(2));
const token =
  (process.env.AI_CLIENT_TOKEN || '').trim() ||
  (process.env.AI_CLIENT_TOKENS || '').split(',')[0].trim() ||
  '';

const headers = { 'Content-Type': 'application/json' };
if (token) headers.Authorization = 'Bearer ' + token;

const body = {
  messages: [
    {
      role: 'user',
      content:
        'What does this block do? Explain using the block names from my list, in one short paragraph.',
    },
  ],
  context: {
    selectedBlock: '• Digital write (pin 13, HIGH)',
    summary: 'Beginner blink on built-in LED',
    blocksDescription: [
      '• Setup + Loop',
      '  In LOOP:',
      '  • Wait (delay) (ms: 500)',
      '  • Digital write (pin 13, HIGH)',
      '  • Wait (delay) (ms: 500)',
      '  • Digital write (pin 13, LOW)',
    ].join('\n'),
    code: [
      'void setup() {',
      '  pinMode(13, OUTPUT);',
      '}',
      'void loop() {',
      '  digitalWrite(13, HIGH);',
      '  delay(500);',
      '  digitalWrite(13, LOW);',
      '  delay(500);',
      '}',
    ].join('\n'),
  },
};

async function main() {
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  let data = {};
  try {
    data = await res.json();
  } catch (_) {
    data = {};
  }
  console.log('HTTP', res.status);
  if (data.text) {
    console.log('\n--- Assistant reply ---\n');
    console.log(data.text);
  } else {
    console.log(JSON.stringify(data, null, 2));
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
