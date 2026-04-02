/**
 * AIAssistantController — orchestrates chat UI, context building, and chat service.
 */
(function (global) {
  'use strict';

  var Constants = global.AIAssistantConstants || {};
  var ERROR_MESSAGES = {
    NO_API_KEY: Constants.USER_MESSAGE || 'Please set your Gemini API key in Global configuration.',
    UNAUTHORIZED: Constants.UNAUTHORIZED_MESSAGE || 'Invalid AI server token.',
    TIMEOUT: Constants.TIMEOUT_MESSAGE || 'Request timed out.',
    NETWORK: Constants.NETWORK_MESSAGE || 'Could not reach the assistant.',
    API_ERROR: Constants.API_ERROR_MESSAGE || 'The assistant returned an error.',
    SERVER_CONFIG:
      Constants.SERVER_CONFIG_MESSAGE ||
      'The AI mentor is not available on this site right now. Please try again later.',
    BAD_JSON: Constants.BAD_JSON_MESSAGE || 'Bad request.',
    EMPTY_MESSAGES: Constants.EMPTY_MESSAGES_MESSAGE || 'Nothing to send.',
    SERVICE_UNAVAILABLE: Constants.SERVICE_UNAVAILABLE_MESSAGE || 'The assistant service is temporarily busy. Please try again in a moment.'
  };

  /** Never show server/provider details in the chat (ops info belongs in logs only). */
  var ERROR_CODES_NO_SERVER_HINT = {
    SERVER_CONFIG: true,
    API_ERROR: true,
    NETWORK: true,
    UNAUTHORIZED: true
  };

  function getErrorMessage(code, hint) {
    var base = ERROR_MESSAGES[code] || ERROR_MESSAGES.API_ERROR;
    if (ERROR_CODES_NO_SERVER_HINT[code]) {
      return base;
    }
    var hintStr = '';
    if (hint != null && hint !== '') {
      if (typeof hint === 'string') hintStr = hint.trim();
      else {
        try {
          hintStr = JSON.stringify(hint);
        } catch (e) {
          hintStr = String(hint);
        }
      }
    }
    if (hintStr) return base + '\n\n' + hintStr;
    return base;
  }

  function AIAssistantController(options) {
    this.messagesEl = options.messagesEl;
    this.inputEl = options.inputEl;
    this.sendBtn = options.sendBtn;
    this.loadingEl = options.loadingEl;
    this.getWorkspace = options.getWorkspace;
    this.chatService = options.chatService;
    this.contextBuilder = options.contextBuilder;
    this.quickPromptButtons = options.quickPromptButtons || [];
    this.clearBtn = options.clearBtn;
    this.messages = [];
  }

  AIAssistantController.prototype.appendMessage = function (role, content) {
    this.messages.push({ role: role, content: content });
    var wrap = document.createElement('div');
    wrap.className = 'ai-chat-message ' + role;
    var label = document.createElement('div');
    label.className = 'role-label';
    label.textContent = role === 'user' ? 'You' : 'Assistant';
    var body = document.createElement('div');
    body.className = 'ai-chat-message-body';
    if (role === 'assistant' && typeof global.AIAssistantFormatMessage === 'function') {
      body.innerHTML = global.AIAssistantFormatMessage(content);
    } else {
      body.textContent = content;
    }
    wrap.appendChild(label);
    wrap.appendChild(body);
    this.messagesEl.appendChild(wrap);
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  };

  AIAssistantController.prototype.setLoading = function (on) {
    if (this.loadingEl) {
      this.loadingEl.style.display = on ? 'block' : 'none';
    }
    if (this.sendBtn) {
      this.sendBtn.disabled = on;
    }
  };

  AIAssistantController.prototype.sendUserMessage = function (text) {
    text = (text || '').trim();
    if (!text) return;

    this.inputEl.value = '';
    this.appendMessage('user', text);

    var workspace = this.getWorkspace ? this.getWorkspace() : (typeof BlocklyDuino !== 'undefined' ? BlocklyDuino.workspace : null);
    var context = this.contextBuilder && this.contextBuilder.buildContext ? this.contextBuilder.buildContext(workspace) : { code: '', summary: '' };

    var messages = this.messages.slice();
    /** Avoid huge payloads / model context overflow on long sessions (proxy re-injects workspace each time). */
    var MAX_MESSAGES_TO_SEND = 16;
    if (messages.length > MAX_MESSAGES_TO_SEND) {
      messages = messages.slice(-MAX_MESSAGES_TO_SEND);
    }
    var payload = {
      messages: messages.map(function (m) { return { role: m.role, content: m.content }; }),
      context: context
    };

    this.setLoading(true);
    var self = this;

    this.chatService.sendRequest(payload).then(function (result) {
      self.setLoading(false);
      if (result.error) {
        console.warn(
          '[AI Assistant] Controller got error:',
          result.error,
          result.status != null ? result.status : '',
          result.hint ? result.hint : ''
        );
        self.appendMessage('assistant', getErrorMessage(result.error, result.hint));
      } else if (result.text) {
        self.appendMessage('assistant', result.text);
      } else {
        console.warn('[AI Assistant] Controller got empty reply');
        self.appendMessage('assistant', 'No reply from the assistant.');
      }
    }).catch(function (err) {
      self.setLoading(false);
      console.error('[AI Assistant] Controller sendRequest catch:', err);
      self.appendMessage('assistant', getErrorMessage('NETWORK'));
    });
  };

  AIAssistantController.prototype.clearChat = function () {
    this.messages = [];
    this.messagesEl.innerHTML = '';
    if (this.loadingEl) this.loadingEl.style.display = 'none';
    if (this.sendBtn) this.sendBtn.disabled = false;
  };

  AIAssistantController.prototype.init = function () {
    var self = this;

    if (this.sendBtn) {
      this.sendBtn.addEventListener('click', function () {
        self.sendUserMessage(self.inputEl.value);
      });
    }
    if (this.inputEl) {
      this.inputEl.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          self.sendUserMessage(self.inputEl.value);
        }
      });
    }
    this.quickPromptButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var label = (btn.textContent || '').trim();
        if (label) self.sendUserMessage(label);
      });
    });
    if (this.clearBtn) {
      this.clearBtn.addEventListener('click', function () {
        self.clearChat();
      });
    }
  };

  global.AIAssistantController = AIAssistantController;
})(typeof window !== 'undefined' ? window : this);
