/**
 * AI Assistant — entry. Call AIAssistant.init() when workspace is ready.
 */
(function (global) {
  'use strict';

  var controller = null;

  function init() {
    var messagesEl = document.getElementById('ai_assistant_messages');
    var inputEl = document.getElementById('ai_assistant_input');
    var sendBtn = document.getElementById('ai_assistant_send');
    var loadingEl = document.getElementById('ai_assistant_loading');
    var clearBtn = document.getElementById('ai_assistant_clear');
    var quickPrompts = document.querySelectorAll('.ai-quick-prompt');

    if (!messagesEl || !inputEl || !sendBtn) return;

    var getWorkspace = function () {
      if (typeof BlocklyDuino !== 'undefined' && BlocklyDuino.workspace) {
        return BlocklyDuino.workspace;
      }
      if (typeof Blockly !== 'undefined' && Blockly.getMainWorkspace) {
        return Blockly.getMainWorkspace();
      }
      return null;
    };

    var chatService = global.GeminiChatService && global.GeminiChatService.getChatService
      ? global.GeminiChatService.getChatService()
      : global.GeminiChatService.createMockService();

    var contextBuilder = global.WorkspaceContextBuilder || { buildContext: function () { return { code: '', summary: '' }; } };

    controller = new global.AIAssistantController({
      messagesEl: messagesEl,
      inputEl: inputEl,
      sendBtn: sendBtn,
      loadingEl: loadingEl,
      clearBtn: clearBtn,
      getWorkspace: getWorkspace,
      chatService: chatService,
      contextBuilder: contextBuilder,
      quickPromptButtons: Array.prototype.slice.call(quickPrompts || [])
    });
    controller.init();
  }

  global.AIAssistant = {
    init: init
  };
})(typeof window !== 'undefined' ? window : this);
