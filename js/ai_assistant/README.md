# AI Assistant (Gemini)

In-IDE chatbot that analyzes the current blocks and Arduino code to help children learn and debug.

## Setup

1. Get a Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey).
2. In BlockIDE: open **Global configuration** (e.g. from the menu or Options), enter the key in **AI Assistant (Gemini API key)**, and click **Save**.
3. The key is stored only in the Electron main process (config under user data); it is never sent to the renderer.

## Usage

- Click **AI Assistant** in the header to open the chat modal.
- Type a question or use the quick prompts (“What does this block do?”, “Give me a hint”, “What should I add next?”).
- The assistant receives the current workspace code and a short block summary so answers are project-specific.
- Use **Clear chat** to start a new conversation.

## Display formatting

- **`formatMessage.js`** turns assistant replies into safe HTML: **bold**, `inline code`, and **numbered steps** split into bordered **step cards** with each following line shown as a **dot row** (so dense instructions are easier to scan). The model is prompted (via the Vercel proxy system prompt) to use one line per sub-action under each numbered step.

## Architecture

- **UI:** Button and modal in `index.html`; styles in the same file.
- **Controller:** `controller.js` — chat state, Send/Clear/quick prompts, calls context builder and chat service.
- **Context:** `context.js` — builds `{ code, summary }` from the Blockly workspace via `BlocklyDuino.workspaceToCode`.
- **Service:** `service.js` — in Electron uses `electronAPI.geminiChat(payload)` (IPC to main); otherwise mock.
- **Main process:** `electron/main.js` — stores API key, handles `gemini-chat` IPC, calls Gemini API with a STEM-tutor system prompt.
