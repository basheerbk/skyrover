# vercel-ai — BlockIDE AI proxy (Sarvam)

Serverless API on Vercel. Keeps `SARVAM_API_KEY` off the desktop app.

Uses [Sarvam AI](https://sarvam.ai/) **chat completions** API (`POST /v1/chat/completions`) with the `api-subscription-key` header. Strong support for Indic languages — see [Sarvam docs](https://docs.sarvam.ai/).

## Root URL

Opening `https://<project>.vercel.app` in the browser shows a short info page. The **AI endpoint** is always **`POST /api/chat`** (full URL: `https://<project>.vercel.app/api/chat`). BlockIDE must use that `/api/chat` URL, not the site root alone.

## Deploy

1. Install [Vercel CLI](https://vercel.com/docs/cli): `npm i -g vercel`
2. From this folder:

   ```bash
   cd vercel-ai
   vercel
   ```

3. In **Vercel → Project → Settings → Environment Variables** (Production):

   | Name | Value |
   |------|--------|
   | `SARVAM_API_KEY` | Your key from [Sarvam Dashboard](https://dashboard.sarvam.ai/) |
   | `AI_CLIENT_TOKENS` | One or more secrets, comma-separated (e.g. `tok_abc,tok_xyz`) |
   | `AI_CLIENT_TOKEN` | **Optional single token** (same as one value in `AI_CLIENT_TOKENS` if you only use one) |

4. **Remove** legacy `GROQ_API_KEY` / `GEMINI_API_KEY` if present (no longer used by this handler).
5. Redeploy after adding env vars.

**Important:** If `AI_CLIENT_TOKENS` is empty, **anyone** who finds your URL can use your quota. Set at least one token before going public.

## Endpoint

After deploy:

`POST https://<project>.vercel.app/api/chat`

```http
Authorization: Bearer <one-of-AI_CLIENT_TOKENS>
Content-Type: application/json
```

```json
{
  "messages": [{ "role": "user", "content": "What does my loop do?" }],
  "context": {
    "blocksDescription": "…",
    "code": "// optional",
    "summary": ""
  }
}
```

Success: `{ "text": "…", "proxyRev": 3, "modelUsed": "…" }`  
Errors (same shape as Electron app): `{ "error": "…", "hint": "…", "proxyRev": 3, "modelUsed"?: "…", "status"?: number }`. Every error includes a non-empty **`hint`** and **`proxyRev`** (bump in `api/chat.js`) so you can confirm the latest handler is deployed.

If the client only sees `{"error":"API_ERROR"}` with **no** `hint` or `proxyRev`, the request is **not** reaching this handler version — redeploy this project from the BlockIDE `vercel-ai` folder or fix the AI URL in BlockIDE settings.

## Long chat threads

The proxy **re-sends workspace + full history** each turn. Very long threads can exceed provider limits and show generic errors. The handler keeps only the **last 20** client messages, uses **shorter caps on older turns** (last 6 at full length), and trims embedded **code** when there are many turns. In the app, use **Clear chat** for a fresh context if replies start failing after many messages.

## Optional env

- `SARVAM_MODEL` — default `sarvam-30b` (see [Sarvam models](https://docs.sarvam.ai/))
- `SARVAM_MAX_OUTPUT_TOKENS` — default `4096` (raise if answers stop mid-sentence; cap `8192`)
- `SARVAM_API_SUBSCRIPTION_KEY` — same as `SARVAM_API_KEY` if you prefer that variable name

## Troubleshooting `{ "error": "SERVER_CONFIG" }`

1. **Redeploy** after adding or editing env vars (Deployments → ⋮ → Redeploy). Old builds do not pick up new secrets.
2. Variable name must be exactly **`SARVAM_API_KEY`** (Production or **All Environments**).
3. Value must be the raw subscription key — **no** surrounding quotes in the Vercel UI; avoid trailing spaces or line breaks (the server trims/normalizes, but bad pastes can still fail).
4. Confirm you are hitting the **same** Vercel project where those variables are defined.

## Wire BlockIDE (Electron)

1. Run the app → open **Global configuration** (boards / options modal).
2. Under **AI server (Vercel proxy)** paste:
   - URL: `https://<project>.vercel.app/api/chat`
   - Token: one value from `AI_CLIENT_TOKENS` (leave blank only if the server has no tokens set).
3. Click **Save AI server**.

Or set environment variables when launching Electron: `BLOCKIDE_AI_URL`, `BLOCKIDE_AI_TOKEN`.

**Direct Gemini from the app:** still works if you clear the AI server URL and set a Gemini key in the app (Electron main process) — that path does not use this Vercel project.

## Local test (one prompt, no Vercel CLI)

From `vercel-ai`, copy `.env.example` to `.env` and set `SARVAM_API_KEY` (and optional `AI_CLIENT_TOKENS` if you use client auth).

```bash
node scripts/send-prompt.js "What is 2+2? One word only."
```

With a running server (`vercel dev` or production):

```bash
node scripts/send-prompt.js --url http://localhost:3000/api/chat --token mytesttoken "Hello"
```

## Local test

```bash
export SARVAM_API_KEY=...
export AI_CLIENT_TOKENS=mytesttoken
vercel dev
```

```bash
curl -sS -X POST http://localhost:3000/api/chat \
  -H "Authorization: Bearer mytesttoken" \
  -H "Content-Type: application/json" \
  -d "{\"messages\":[{\"role\":\"user\",\"content\":\"Say hi in one sentence\"}],\"context\":{}}"
```

## Migrating from Groq

1. Add `SARVAM_API_KEY` in Vercel (Production).
2. Remove `GROQ_API_KEY` and `GROQ_MODEL` (optional but avoids confusion).
3. Redeploy production.

No changes are required in the Electron app if it already posts to `/api/chat` with the same JSON shape.
