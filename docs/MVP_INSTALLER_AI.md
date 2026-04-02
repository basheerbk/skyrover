# MVP installer — bundled AI proxy

The packaged app resolves the Sarvam (Vercel) proxy **without** requiring the user to open Global configuration first.

## Bundled values (see `electron/main.js`)

- `MVP_AI_PROXY_URL` — `POST /api/chat` on Vercel  
- `MVP_AI_CLIENT_TOKEN` — same secret as Vercel `AI_CLIENT_TOKEN` / `AI_CLIENT_TOKENS`

## Resolution order (highest wins)

**URL:** saved `ai_backend_url` → `BLOCKIDE_AI_URL` → bundled `MVP_AI_PROXY_URL`  
Invalid or non-`http(s)` saved URLs fall back to the bundled URL.

**Token:** saved `ai_backend_token` → `BLOCKIDE_AI_TOKEN` → `electron/blockide_ai_token.local.txt` → bundled `MVP_AI_CLIENT_TOKEN`  
Leading `Bearer ` is stripped. Whitespace-only counts as empty.

## Before a public GitHub release

1. Set `MVP_AI_CLIENT_TOKEN` to `''` or remove the bundled token.  
2. Rotate the Vercel client token if it was ever committed.  
3. Keep `SARVAM_API_KEY` only on Vercel, never in the repo.

## Packaged files

`package.json` → `build.files` must include `js/**/*` so `js/ai_assistant/*` loads inside the `.exe`.
