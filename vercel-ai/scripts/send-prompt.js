/**
 * Send one chat prompt through BlockIDE's /api/chat handler (local) or HTTP (--url).
 *
 * Usage:
 *   cd vercel-ai
 *   copy .env.example .env   # add SARVAM_API_KEY=...
 *   node scripts/send-prompt.js "What is 2+2? One word."
 *
 * Against a running server (e.g. vercel dev):
 *   node scripts/send-prompt.js --url http://localhost:3000/api/chat --token YOUR_TOKEN "Hi"
 */
/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, 'utf8');
  for (const line of text.split(/\n/)) {
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

loadDotEnv(path.join(__dirname, '..', '.env'));

function mockRes() {
  const state = { code: null, body: null };
  return {
    setHeader() {},
    status(code) {
      state.code = code;
      return {
        json(body) {
          state.body = body;
          return this;
        },
        end() {
          return this;
        },
      };
    },
    json(body) {
      state.code = state.code ?? 200;
      state.body = body;
    },
    _state: state,
  };
}

function parseArgs(argv) {
  const out = { url: null, token: null, promptParts: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--url' && argv[i + 1]) {
      out.url = argv[++i];
      continue;
    }
    if (a === '--token' && argv[i + 1]) {
      out.token = argv[++i];
      continue;
    }
    out.promptParts.push(a);
  }
  return out;
}

async function main() {
  const { url, token: tokenArg, promptParts } = parseArgs(process.argv.slice(2));
  const prompt =
    promptParts.join(' ').trim() || 'Say hello in one short sentence.';
  const token =
    tokenArg ||
    process.env.BLOCKIDE_AI_TOKEN ||
    process.env.AI_TEST_TOKEN ||
    (process.env.AI_CLIENT_TOKEN && process.env.AI_CLIENT_TOKEN.trim()) ||
    (process.env.AI_CLIENT_TOKENS && process.env.AI_CLIENT_TOKENS.split(',')[0].trim()) ||
    '';

  if (url) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        context: {},
      }),
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { _raw: text };
    }
    console.log('HTTP', res.status);
    console.log(typeof data.text === 'string' ? data.text : JSON.stringify(data, null, 2));
    if (data.error) process.exitCode = 1;
    return;
  }

  process.chdir(path.join(__dirname, '..'));
  const handler = require('../api/chat.js');
  const res = mockRes();
  const headers = {};
  if (token) headers.authorization = `Bearer ${token}`;

  await handler(
    {
      method: 'POST',
      headers,
      body: {
        messages: [{ role: 'user', content: prompt }],
        context: {},
      },
    },
    res
  );

  const s = res._state;
  if (s.body && s.body.text) {
    console.log('Reply:\n');
    console.log(s.body.text);
  } else {
    console.log('Response:', JSON.stringify(s.body, null, 2), '(HTTP', s.code + ')');
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
