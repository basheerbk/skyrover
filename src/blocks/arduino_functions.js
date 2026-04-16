/**
 * @fileoverview Arduino C-style user functions (advanced toolbox).
 */
import * as Blockly from 'blockly';

/** Display label (word) first, C type second — kids see words, generated code stays valid */
var PARAM_TYPES = [
  ['number (int)', 'int'],
  ['big number (long)', 'long'],
  ['decimal (float)', 'float'],
  ['yes or no (bool)', 'bool'],
  ['byte', 'byte'],
  ['letter (char)', 'char'],
  ['small number (uint8_t)', 'uint8_t'],
  ['word (String)', 'String'],
];

var RETURN_TYPES = [
  ['number (int)', 'int'],
  ['big number (long)', 'long'],
  ['decimal (float)', 'float'],
  ['yes or no (bool)', 'bool'],
  ['byte', 'byte'],
  ['letter (char)', 'char'],
  ['small number (uint8_t)', 'uint8_t'],
  ['word (String)', 'String'],
];

function emptyParamList() {
  return [];
}

/** Statement call: warm coral — “do something” */
var COLOUR_FUNC_CALL_DO = '#F06292';
/** Value call: soft purple — “gives a number back” */
var COLOUR_FUNC_CALL_GET = '#BA68C8';

Blockly.Blocks['arduino_func_mutator_container'] = {
  init: function () {
    this.setColour('#FF6680');
    this.appendDummyInput().appendField(Blockly.Msg.ARDUINO_FUNC_MUTATOR_PARAMS || 'parameters');
    this.appendStatementInput('STACK');
    this.setTooltip(Blockly.Msg.ARDUINO_FUNC_MUTATOR_TOOLTIP || '');
    this.contextMenu = false;
  },
};

Blockly.Blocks['arduino_func_mutator_param'] = {
  init: function () {
    this.setColour('#FF6680');
    this.appendDummyInput()
      .appendField(Blockly.Msg.ARDUINO_FUNC_MUTATOR_TYPE_LETTER || 'Letter')
      .appendField(new Blockly.FieldDropdown(PARAM_TYPES), 'PTYPE')
      .appendField(Blockly.Msg.ARDUINO_FUNC_MUTATOR_NAME_WORD || 'Word')
      .appendField(new Blockly.FieldTextInput('name'), 'PNAME');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setTooltip(Blockly.Msg.ARDUINO_FUNC_MUTATOR_PARAM_TOOLTIP || '');
    this.contextMenu = false;
  },
};

Blockly.Blocks['arduino_func_define_void'] = {
  init: function () {
    this.setColour('#FF6680');
    this.setTooltip(Blockly.Msg.ARDUINO_FUNC_DEFINE_VOID_TOOLTIP || '');
    this.setHelpUrl('');
    this.paramList_ = emptyParamList();
    this.appendDummyInput('HDR')
      .appendField(Blockly.Msg.ARDUINO_FUNC_DEFINE_VOID_TITLE || 'function void')
      .appendField(new Blockly.FieldTextInput('myFunction'), 'NAME');
    this.appendStatementInput('STACK')
      .appendField(Blockly.Msg.ARDUINO_FUNC_IN_FUNCTION || 'do');
    this.setPreviousStatement(false);
    this.setNextStatement(false);
    this.setMutator(new Blockly.Mutator(['arduino_func_mutator_param']));
  },
  mutationToDom: function () {
    var container = document.createElement('mutation');
    var params = this.paramList_ || [];
    for (var i = 0; i < params.length; i++) {
      var p = document.createElement('param');
      p.setAttribute('ptype', params[i].type);
      p.setAttribute('pname', params[i].name);
      container.appendChild(p);
    }
    return container;
  },
  domToMutation: function (xmlElement) {
    this.paramList_ = [];
    for (var i = 0; i < xmlElement.children.length; i++) {
      var child = xmlElement.children[i];
      if (child.nodeName.toLowerCase() === 'param') {
        this.paramList_.push({
          type: child.getAttribute('ptype') || 'int',
          name: child.getAttribute('pname') || 'name',
        });
      }
    }
  },
  decompose: function (workspace) {
    var container = workspace.newBlock('arduino_func_mutator_container');
    container.initSvg();
    var conn = container.getInput('STACK').connection;
    var list = this.paramList_ || [];
    for (var i = 0; i < list.length; i++) {
      var item = workspace.newBlock('arduino_func_mutator_param');
      item.initSvg();
      item.setFieldValue(list[i].type, 'PTYPE');
      item.setFieldValue(list[i].name, 'PNAME');
      conn.connect(item.previousConnection);
      conn = item.nextConnection;
    }
    return container;
  },
  compose: function (containerBlock) {
    var list = [];
    var item = containerBlock.getInputTargetBlock('STACK');
    while (item) {
      list.push({
        type: item.getFieldValue('PTYPE'),
        name: item.getFieldValue('PNAME'),
      });
      item = item.nextConnection && item.nextConnection.targetBlock();
    }
    this.paramList_ = list;
  },
  saveExtraState: function () {
    return { params: this.paramList_ || [] };
  },
  loadExtraState: function (state) {
    this.paramList_ = (state && Array.isArray(state.params)) ? state.params : [];
  },
};

Blockly.Blocks['arduino_func_define_return'] = {
  init: function () {
    this.setColour('#FF6680');
    this.setTooltip(Blockly.Msg.ARDUINO_FUNC_DEFINE_RETURN_TOOLTIP || '');
    this.setHelpUrl('');
    this.paramList_ = emptyParamList();
    this.appendDummyInput('HDR')
      .appendField(Blockly.Msg.ARDUINO_FUNC_DEFINE_RETURN_TITLE || 'function')
      .appendField(new Blockly.FieldDropdown(RETURN_TYPES), 'RET_TYPE')
      .appendField(new Blockly.FieldTextInput('readSensor'), 'NAME');
    this.appendStatementInput('STACK')
      .appendField(Blockly.Msg.ARDUINO_FUNC_IN_FUNCTION || 'do');
    this.setPreviousStatement(false);
    this.setNextStatement(false);
    this.setMutator(new Blockly.Mutator(['arduino_func_mutator_param']));
  },
  mutationToDom: Blockly.Blocks['arduino_func_define_void'].mutationToDom,
  domToMutation: Blockly.Blocks['arduino_func_define_void'].domToMutation,
  decompose: Blockly.Blocks['arduino_func_define_void'].decompose,
  compose: Blockly.Blocks['arduino_func_define_void'].compose,
  saveExtraState: Blockly.Blocks['arduino_func_define_void'].saveExtraState,
  loadExtraState: Blockly.Blocks['arduino_func_define_void'].loadExtraState,
};

Blockly.Blocks['arduino_func_return'] = {
  init: function () {
    this.setColour('#FF6680');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setTooltip(Blockly.Msg.ARDUINO_FUNC_RETURN_TOOLTIP || '');
    this.appendValueInput('VALUE')
      .setCheck(null)
      .appendField(Blockly.Msg.ARDUINO_FUNC_RETURN_TITLE || 'return');
  },
};

Blockly.Blocks['arduino_func_call_mutator_container'] = {
  init: function () {
    this.setColour('#FF6680');
    this.appendDummyInput().appendField(Blockly.Msg.ARDUINO_FUNC_MUTATOR_CALL_SLOTS_TITLE || '');
    this.appendStatementInput('STACK');
    this.contextMenu = false;
  },
};

Blockly.Blocks['arduino_func_call_mutator_arg'] = {
  init: function () {
    this.setColour('#FF6680');
    this.appendDummyInput().appendField(Blockly.Msg.ARDUINO_FUNC_MUTATOR_CALL_SLOT_ITEM || '');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.contextMenu = false;
  },
};

Blockly.Blocks['arduino_func_call_void'] = {
  init: function () {
    this.setColour(COLOUR_FUNC_CALL_DO);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setTooltip(Blockly.Msg.ARDUINO_FUNC_CALL_VOID_TOOLTIP || '');
    this.argCount_ = 0;
    this.updateShape_();
    this.setMutator(new Blockly.Mutator(['arduino_func_call_mutator_arg']));
  },
  mutationToDom: function () {
    var c = document.createElement('mutation');
    c.setAttribute('args', String(this.argCount_));
    return c;
  },
  domToMutation: function (xmlElement) {
    this.argCount_ = parseInt(xmlElement.getAttribute('args'), 10) || 0;
    this.updateShape_();
  },
  decompose: function (workspace) {
    var container = workspace.newBlock('arduino_func_call_mutator_container');
    container.initSvg();
    var conn = container.getInput('STACK').connection;
    for (var i = 0; i < this.argCount_; i++) {
      var item = workspace.newBlock('arduino_func_call_mutator_arg');
      item.initSvg();
      conn.connect(item.previousConnection);
      conn = item.nextConnection;
    }
    return container;
  },
  compose: function (containerBlock) {
    var n = 0;
    var item = containerBlock.getInputTargetBlock('STACK');
    while (item) {
      n++;
      item = item.nextConnection && item.nextConnection.targetBlock();
    }
    this.argCount_ = n;
    this.updateShape_();
  },
  saveExtraState: function () {
    return { argCount: this.argCount_ || 0 };
  },
  loadExtraState: function (state) {
    this.argCount_ = (state && typeof state.argCount === 'number') ? state.argCount : 0;
    this.updateShape_();
  },
  updateShape_: function () {
    if (this.getInput('HDR')) {
      this.removeInput('HDR');
    }
    var i = 0;
    while (this.getInput('ARG' + i)) {
      this.removeInput('ARG' + i);
      i++;
    }
    this.setInputsInline(true);
    this.appendDummyInput('HDR')
      .appendField(Blockly.Msg.ARDUINO_FUNC_RUN_LABEL || 'Run')
      .appendField(new Blockly.FieldTextInput('mySteps'), 'NAME');
    for (var j = 0; j < this.argCount_; j++) {
      var inp = this.appendValueInput('ARG' + j);
      if (j === 0) {
        inp.appendField(Blockly.Msg.ARDUINO_FUNC_WITH_LABEL || 'with');
      } else {
        inp.appendField(Blockly.Msg.ARDUINO_FUNC_AND_LABEL || 'and');
      }
    }
  },
};

Blockly.Blocks['arduino_func_call_return'] = {
  init: function () {
    this.setColour(COLOUR_FUNC_CALL_GET);
    this.setOutput(true, null);
    this.setTooltip(Blockly.Msg.ARDUINO_FUNC_CALL_RETURN_TOOLTIP || '');
    this.argCount_ = 0;
    this.updateShape_();
    this.setMutator(new Blockly.Mutator(['arduino_func_call_mutator_arg']));
  },
  mutationToDom: Blockly.Blocks['arduino_func_call_void'].mutationToDom,
  domToMutation: Blockly.Blocks['arduino_func_call_void'].domToMutation,
  decompose: Blockly.Blocks['arduino_func_call_void'].decompose,
  compose: Blockly.Blocks['arduino_func_call_void'].compose,
  saveExtraState: Blockly.Blocks['arduino_func_call_void'].saveExtraState,
  loadExtraState: Blockly.Blocks['arduino_func_call_void'].loadExtraState,
  updateShape_: function () {
    if (this.getInput('HDR')) {
      this.removeInput('HDR');
    }
    var i = 0;
    while (this.getInput('ARG' + i)) {
      this.removeInput('ARG' + i);
      i++;
    }
    this.setInputsInline(true);
    this.appendDummyInput('HDR')
      .appendField(Blockly.Msg.ARDUINO_FUNC_GET_LABEL || 'Get')
      .appendField(new Blockly.FieldTextInput('readNumber'), 'NAME');
    for (var j = 0; j < this.argCount_; j++) {
      var inp = this.appendValueInput('ARG' + j);
      if (j === 0) {
        inp.appendField(Blockly.Msg.ARDUINO_FUNC_WITH_LABEL || 'with');
      } else {
        inp.appendField(Blockly.Msg.ARDUINO_FUNC_AND_LABEL || 'and');
      }
    }
  },
};
