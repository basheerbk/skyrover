/**
 * AI chat service — sends messages + context and returns reply.
 * In renderer: calls electronAPI.invoke('gemini-chat', payload).
 * Mock: returns a fixed string for Phase 1.
 */
(function (global) {
  'use strict';

  var Constants = global.AIAssistantConstants || {};

  function createMockService() {
    return {
      sendRequest: function (payload) {
        return new Promise(function (resolve) {
          setTimeout(function () {
            resolve({ text: Constants.MOCK_REPLY || "I'm your AI Assistant (mock)." });
          }, 400);
        });
      }
    };
  }

  function createRealService() {
    return {
      sendRequest: function (payload) {
        if (!global.electronAPI || typeof global.electronAPI.geminiChat !== 'function') {
          console.warn('[AI Assistant] electronAPI.geminiChat not available, using NO_API_KEY');
          return Promise.resolve({ error: Constants.ERROR_CODES.NO_API_KEY });
        }
        console.log('[AI Assistant] Sending request:', payload.messages ? payload.messages.length : 0, 'messages, blocks:', (payload.context && payload.context.blocksDescription) ? payload.context.blocksDescription.length : 0, 'chars, code:', (payload.context && payload.context.code) ? payload.context.code.length : 0, 'chars');
        return global.electronAPI.geminiChat(payload).then(function (result) {
          if (result && result.error) {
            console.warn(
              '[AI Assistant] Chat returned error:',
              result.error,
              result.status != null ? 'status=' + result.status : '',
              result.hint ? 'hint=' + String(result.hint).substring(0, 200) : ''
            );
            return { error: result.error, status: result.status, hint: result.hint };
          }
          console.log('[AI Assistant] Assistant reply length:', (result && result.text) ? result.text.length : 0);
          return { text: (result && result.text) ? result.text : '' };
        }).catch(function (err) {
          console.error('[AI Assistant] geminiChat IPC failed:', err);
          return { error: Constants.ERROR_CODES.NETWORK };
        });
      }
    };
  }

  function createWebBackendService() {
    return {
      sendRequest: function (payload) {
        var base = '';
        try {
          if (typeof global.blockideResolveBackendBaseUrl === 'function') {
            base = global.blockideResolveBackendBaseUrl() || '';
          }
        } catch (e) {
          base = '';
        }
        if (!base && typeof global.location !== 'undefined' && global.location.origin) {
          base = global.location.origin;
        }
        var url = (base.replace(/\/+$/, '') || '') + '/api/ai/chat';
        return global
          .fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
          .then(function (r) {
            return r.text().then(function (raw) {
              var data = {};
              try {
                data = raw ? JSON.parse(raw) : {};
              } catch (e) {
                return {
                  error: Constants.ERROR_CODES.API_ERROR,
                  hint: raw ? raw.slice(0, 300) : 'Invalid response',
                };
              }
              if (!r.ok) {
                return {
                  error: data.error || Constants.ERROR_CODES.API_ERROR,
                  status: r.status,
                  hint: data.hint,
                };
              }
              return { text: data.text ? String(data.text) : '' };
            });
          })
          .catch(function (err) {
            console.error('[AI Assistant] fetch /api/ai/chat failed:', err);
            return { error: Constants.ERROR_CODES.NETWORK };
          });
      },
    };
  }

  function getChatService() {
    if (global.electronAPI && typeof global.electronAPI.geminiChat === 'function') {
      console.log('[AI Assistant] Using AI backend via Electron (IPC)');
      return createRealService();
    }
    if (typeof global.fetch === 'function') {
      console.log('[AI Assistant] Using web backend POST /api/ai/chat (Gemini via server)');
      return createWebBackendService();
    }
    console.log('[AI Assistant] Using mock service (no fetch)');
    return createMockService();
  }

  global.GeminiChatService = {
    getChatService: getChatService,
    createMockService: createMockService,
    createRealService: createRealService
  };
})(typeof window !== 'undefined' ? window : this);
