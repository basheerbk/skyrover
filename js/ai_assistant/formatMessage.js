/**
 * Format assistant reply for display: bold, code, numbered steps with readable sub-lines.
 * Escapes HTML first, then markdown-like formatting for kid-friendly readability.
 */
(function (global) {
  'use strict';

  function stripReasoningArtifacts(text) {
    var s = String(text == null ? '' : text);
    // Remove common hidden-reasoning wrappers seen in some model outputs.
    s = s.replace(/<think>[\s\S]*?<\/think>/gi, '');
    s = s.replace(/```(?:thinking|thought|reasoning)[\s\S]*?```/gi, '');
    // Remove single dangling tags if model streamed partial markup.
    s = s.replace(/<\/?think>/gi, '');
    return s.trim();
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatPlainParagraphs(part) {
    var paragraphs = part.split(/\n\n+/);
    var acc = [];
    for (var i = 0; i < paragraphs.length; i++) {
      var p = paragraphs[i].trim();
      if (!p) continue;
      p = p.replace(/\n/g, '<br/>');
      acc.push('<p class="ai-chat-p">' + p + '</p>');
    }
    return acc.join('');
  }

  /**
   * Lines after "N. title" — one visual row per line (bullets optional).
   */
  function formatStepSubitems(body) {
    body = String(body || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    var lines = body.split('\n');
    var lis = [];
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line) continue;
      var stripped = line.replace(/^[-*•]\s+/, '');
      lis.push('<li class="ai-chat-substep">' + stripped + '</li>');
    }
    if (lis.length === 0) return '';
    return '<ul class="ai-chat-substep-list">' + lis.join('') + '</ul>';
  }

  /**
   * Split before each new line that starts a numbered step: "1. ", "2) ", ...
   */
  function splitNumberedSegments(s) {
    return s.split(/\n(?=\d+(?:\.|\))\s)/);
  }

  function formatOneSegment(part) {
    part = part.trim();
    if (!part) return '';
    var stepRe = /^(\d+)(\.|\))\s+([^\n]+)(?:\n([\s\S]*))?$/;
    var sm = part.match(stepRe);
    if (sm) {
      var num = sm[1];
      var punct = sm[2];
      var title = sm[3];
      var body = sm[4] || '';
      return (
        '<section class="ai-chat-step" aria-label="Step ' +
        num +
        '">' +
        '<div class="ai-chat-step-title"><span class="ai-chat-partition-num">' +
        num +
        punct +
        '</span> ' +
        title +
        '</div>' +
        formatStepSubitems(body) +
        '</section>'
      );
    }
    return formatPlainParagraphs(part);
  }

  /**
   * @param {string} content - Raw assistant message (may contain ** and ` and newlines)
   * @returns {string} Safe HTML string
   */
  function formatAssistantMessage(content) {
    if (content == null || content === '') return '';
    var s = escapeHtml(stripReasoningArtifacts(content));
    s = s.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Bold: **text** and __text__
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    // Italic: _word_ only (avoid * which breaks markdown-style lists)
    s = s.replace(/_([^_\n]+)_/g, '<em>$1</em>');

    // Inline code: `code`
    s = s.replace(/`([^`]+)`/g, '<code class="ai-chat-inline-code">$1</code>');

    var segments = splitNumberedSegments(s);
    var out = [];
    for (var i = 0; i < segments.length; i++) {
      var html = formatOneSegment(segments[i]);
      if (html) out.push(html);
    }
    return out.length ? out.join('') : '<p class="ai-chat-p">' + s.replace(/\n/g, '<br/>') + '</p>';
  }

  global.AIAssistantFormatMessage = formatAssistantMessage;
})(typeof window !== 'undefined' ? window : this);
