/**
 * Local smoke tests for api/chat.js (no Vercel CLI required).
 * Run from vercel-ai: node scripts/test-handler.js
 * Optional: set SARVAM_API_KEY for a live Sarvam round-trip.
 */
/* eslint-disable no-console */

const path = require('path');

function mockRes() {
  const state = { code: null, body: null, headers: [] };
  return {
    setHeader(k, v) {
      state.headers.push([k, v]);
    },
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

async function callHandler(handler, req) {
  const res = mockRes();
  await handler(req, res);
  return res._state;
}

const ENV_KEYS = [
  'SARVAM_API_KEY',
  'SARVAM_API_SUBSCRIPTION_KEY',
  'AI_CLIENT_TOKENS',
  'AI_CLIENT_TOKEN',
  'SARVAM_MODEL',
];

async function withEnv(patch, fn) {
  const saved = {};
  for (const k of ENV_KEYS) {
    saved[k] = process.env[k];
  }
  for (const k of ENV_KEYS) {
    if (Object.prototype.hasOwnProperty.call(patch, k)) {
      const v = patch[k];
      if (v === undefined || v === '') delete process.env[k];
      else process.env[k] = String(v);
    }
  }
  try {
    return await fn();
  } finally {
    for (const k of ENV_KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  }
}

async function main() {
  process.chdir(path.join(__dirname, '..'));
  const handler = require('../api/chat.js');

  // OPTIONS
  let s = await withEnv({ SARVAM_API_KEY: '', AI_CLIENT_TOKENS: '', AI_CLIENT_TOKEN: '' }, () =>
    callHandler(handler, { method: 'OPTIONS', headers: {} })
  );
  console.log('OPTIONS:', s.code === 204 ? 'OK' : 'FAIL', s.code);

  // GET
  s = await withEnv({ SARVAM_API_KEY: '', AI_CLIENT_TOKENS: '' }, () =>
    callHandler(handler, { method: 'GET', headers: {} })
  );
  console.log('GET 405:', s.code === 405 && s.body?.error === 'METHOD_NOT_ALLOWED' ? 'OK' : 'FAIL', s.body);

  // POST no Sarvam key
  s = await withEnv({ SARVAM_API_KEY: '', AI_CLIENT_TOKENS: '', AI_CLIENT_TOKEN: '' }, () =>
    callHandler(handler, {
      method: 'POST',
      headers: {},
      body: { messages: [{ role: 'user', content: 'Hi' }] },
    })
  );
  console.log(
    'POST no SARVAM key:',
    s.code === 500 && s.body?.error === 'SERVER_CONFIG' ? 'OK' : 'FAIL',
    s.body
  );

  // POST with client token required
  s = await withEnv(
    { SARVAM_API_KEY: 'dummy', AI_CLIENT_TOKENS: 'secret1,secret2', AI_CLIENT_TOKEN: '' },
    () =>
      callHandler(handler, {
        method: 'POST',
        headers: {},
        body: { messages: [{ role: 'user', content: 'Hi' }] },
      })
  );
  console.log(
    'POST wrong/missing Bearer:',
    s.code === 401 && s.body?.error === 'UNAUTHORIZED' ? 'OK' : 'FAIL',
    s.body
  );

  // POST with invalid Sarvam key (proves outbound path + error mapping)
  s = await withEnv(
    { SARVAM_API_KEY: 'invalid_key_for_smoke_test', AI_CLIENT_TOKENS: '', AI_CLIENT_TOKEN: '' },
    () =>
      callHandler(handler, {
        method: 'POST',
        headers: {},
        body: { messages: [{ role: 'user', content: 'Say only: pong' }] },
      })
  );
  const badSarvamOk =
    s.code === 200 && s.body?.error === 'API_ERROR' && (s.body?.status === 401 || s.body?.status === 403);
  console.log('POST invalid Sarvam key -> API_ERROR:', badSarvamOk ? 'OK' : 'FAIL', s.body);

  const savedKey = process.env.SARVAM_API_KEY || process.env.SARVAM_API_SUBSCRIPTION_KEY;
  if (savedKey && savedKey.trim().length > 12 && !savedKey.includes('invalid_key_for_smoke_test')) {
    s = await withEnv(
      {
        SARVAM_API_KEY: savedKey.trim(),
        AI_CLIENT_TOKENS: '',
        AI_CLIENT_TOKEN: '',
      },
      () =>
        callHandler(handler, {
          method: 'POST',
          headers: {},
          body: { messages: [{ role: 'user', content: 'Reply with exactly: OK' }] },
        })
    );
    const liveOk = s.code === 200 && typeof s.body?.text === 'string' && s.body.text.length > 0;
    console.log(
      'POST live Sarvam (SARVAM_API_KEY in env):',
      liveOk ? 'OK' : 'FAIL',
      liveOk ? String(s.body.text).slice(0, 80) : s.body
    );
  } else {
    console.log('Skip live Sarvam: set SARVAM_API_KEY in environment for a full round-trip.');
  }

  console.log('\nDone.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
