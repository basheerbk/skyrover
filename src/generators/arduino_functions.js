/**
 * @fileoverview Arduino code generators for user-defined C functions.
 */
import '../compat_shim.js';

/** @param {!Blockly.Block} block @param {!Blockly.Names} db */
function safeFunctionName(block, db) {
  return db.getName(block.getFieldValue('NAME'), Blockly.Procedures.NAME_TYPE);
}

/** @param {!Blockly.Block} block @param {!Blockly.Names} db */
function formatParams(block, db) {
  var plist = block.paramList_ || [];
  return plist
    .map(function (p) {
      return p.type + ' ' + db.getName(p.name, Blockly.Variables.NAME_TYPE);
    })
    .join(', ');
}

/**
 * Emit forward declarations for all user function define blocks (before bodies).
 * Call once after Blockly.Arduino.init(workspace).
 * @param {!Blockly.Workspace} workspace
 */
export function injectArduinoFunctionPrototypes(workspace) {
  var gen = Blockly.Arduino;
  if (!gen || !gen.nameDB_) {
    return;
  }
  var db = gen.nameDB_;
  var lines = [];
  var seen = Object.create(null);
  var blocks = workspace.getAllBlocks(false);
  for (var i = 0; i < blocks.length; i++) {
    var b = blocks[i];
    if (b.type !== 'arduino_func_define_void' && b.type !== 'arduino_func_define_return') {
      continue;
    }
    if (b.getParent && b.getParent()) {
      continue;
    }
    var nm = safeFunctionName(b, db);
    if (seen[nm]) {
      console.warn('[Arduino functions] duplicate definition for:', b.getFieldValue('NAME'));
      continue;
    }
    seen[nm] = true;
    var params = formatParams(b, db);
    if (b.type === 'arduino_func_define_void') {
      lines.push('void ' + nm + '(' + params + ');');
    } else {
      var rt = b.getFieldValue('RET_TYPE') || 'int';
      lines.push(rt + ' ' + nm + '(' + params + ');');
    }
  }
  if (lines.length) {
    gen.addDefinition('arduino_user_func_prototypes', lines.join('\n') + '\n');
  }
}

Blockly.Arduino['arduino_func_define_void'] = function () {
  var block = this;
  if (block.getParent && block.getParent()) {
    return '';
  }
  var db = Blockly.Arduino.variableDB_;
  var name = safeFunctionName(block, db);
  var params = formatParams(block, db);
  var body = Blockly.Arduino.statementToCode(block, 'STACK') || '';
  var code = 'void ' + name + '(' + params + ') {\n' + body + '}\n';
  Blockly.Arduino.addDefinition('arduino_user_func_body_' + name, code);
  return '';
};

Blockly.Arduino['arduino_func_define_return'] = function () {
  var block = this;
  if (block.getParent && block.getParent()) {
    return '';
  }
  var db = Blockly.Arduino.variableDB_;
  var name = safeFunctionName(block, db);
  var params = formatParams(block, db);
  var rt = block.getFieldValue('RET_TYPE') || 'int';
  var body = Blockly.Arduino.statementToCode(block, 'STACK') || '';
  var code = rt + ' ' + name + '(' + params + ') {\n' + body + '}\n';
  Blockly.Arduino.addDefinition('arduino_user_func_body_' + name, code);
  return '';
};

Blockly.Arduino['arduino_func_return'] = function () {
  var block = this;
  var v = Blockly.Arduino.valueToCode(block, 'VALUE', Blockly.Arduino.ORDER_NONE) || '0';
  return 'return ' + v + ';\n';
};

Blockly.Arduino['arduino_func_call_void'] = function () {
  var block = this;
  var db = Blockly.Arduino.variableDB_;
  var name = safeFunctionName(block, db);
  var n = block.argCount_ || 0;
  var parts = [];
  for (var i = 0; i < n; i++) {
    var p = Blockly.Arduino.valueToCode(block, 'ARG' + i, Blockly.Arduino.ORDER_COMMA);
    parts.push(p !== '' && p != null ? p : '0');
  }
  return name + '(' + parts.join(', ') + ');\n';
};

Blockly.Arduino['arduino_func_call_return'] = function () {
  var block = this;
  var db = Blockly.Arduino.variableDB_;
  var name = safeFunctionName(block, db);
  var n = block.argCount_ || 0;
  var parts = [];
  for (var i = 0; i < n; i++) {
    var p = Blockly.Arduino.valueToCode(block, 'ARG' + i, Blockly.Arduino.ORDER_COMMA);
    parts.push(p !== '' && p != null ? p : '0');
  }
  var code = name + '(' + parts.join(', ') + ')';
  return [code, Blockly.Arduino.ORDER_ATOMIC];
};

if (typeof window !== 'undefined') {
  window.injectArduinoFunctionPrototypes = injectArduinoFunctionPrototypes;
}
