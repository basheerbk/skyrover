# UI Regression Checklist

Use this checklist before and after each UI modernization slice.

## Build and Asset Integrity

- `npm run build:bundle` succeeds.
- `npm run smoke:test` passes (checks key assets + wiring + local server reachability).
- Browser hard refresh loads latest `index.html`, `dist/blockide_bundle.js`, and added UI assets.
- Console contains `[UI_VERSION]` stamp with current app version and build timestamp.

## Upload and Serial Critical Flows

- ESP upload flow: click upload -> USB picker appears -> compile runs -> flash runs -> success message.
- Rapid double-click upload does not start duplicate upload runs.
- Upload while serial monitor is open closes serial safely and proceeds once.
- Cancel USB picker gives clear cancellation message; no stuck loading state.
- Gesture-blocked picker gives actionable message and no UI deadlock.

## Board Mapping and Pin Profiles

- Switching boards updates profile and FQBN correctly:
  - `esp32:esp32:esp32`
  - `esp32:esp32:esp32c3`
  - `esp8266:esp8266:nodemcuv2`
- Pin dropdowns refresh after board switch and no stale board pins remain.

## Modal and Message UX

- Boards modal opens, selection highlights, and persists active board.
- Messages tab renders logs in order and remains responsive under frequent updates.
- Serial expand modal mirrors primary serial output without duplication glitches.

## Unsupported Environment Handling

- Mobile/unsupported browsers show clear upload limitation guidance.
- Non-secure context (`http://` non-localhost) displays secure-context error guidance.

## Rollback Readiness

- Feature flags can disable modernization slices without touching legacy flows.
- Previous static asset set can be redeployed quickly if regression is detected.

