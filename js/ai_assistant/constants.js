/**
 * AI Assistant constants (error codes, default messages).
 */
(function (global) {
  'use strict';

  global.AIAssistantConstants = {
    ERROR_CODES: {
      NO_API_KEY: 'NO_API_KEY',
      UNAUTHORIZED: 'UNAUTHORIZED',
      TIMEOUT: 'TIMEOUT',
      NETWORK: 'NETWORK',
      API_ERROR: 'API_ERROR',
      SERVER_CONFIG: 'SERVER_CONFIG',
      BAD_JSON: 'BAD_JSON',
      EMPTY_MESSAGES: 'EMPTY_MESSAGES'
    },
    /** STEM tutor system prompt is applied in Electron main (gemini-chat handler). */
    USER_MESSAGE: 'Please set your Gemini API key in Global configuration (Options / Configure), or configure the AI server (Vercel proxy).',
    UNAUTHORIZED_MESSAGE: 'AI server rejected the token. Check AI server URL and Bearer token in Global configuration.',
    TIMEOUT_MESSAGE: 'The request took too long. Please try again.',
    NETWORK_MESSAGE: 'Could not reach the assistant. Check your connection.',
    API_ERROR_MESSAGE: 'The assistant returned an error. Please try again.',
    SERVER_CONFIG_MESSAGE:
      'AI is not configured. Set SARVAM_API_KEY when starting the Node backend, then restart the server. Optional: SARVAM_MODEL and SARVAM_BASE_URL.',
    BAD_JSON_MESSAGE: 'The request could not be read. Try again or update BlockIDE.',
    EMPTY_MESSAGES_MESSAGE: 'Nothing to send. Type a message and try again.',
    SERVICE_UNAVAILABLE_MESSAGE: 'The assistant service is temporarily busy. Please try again in a moment.',
    MOCK_REPLY: "I'm your AI Assistant. Connect the backend (GEMINI_API_KEY) to get live answers — this is an offline placeholder."
  };
})(typeof window !== 'undefined' ? window : this);
