/**
 * Visual Blocks Language
 *
 * Copyright 2012 Google Inc.
 * http://blockly.googlecode.com/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Generating Arduino for logic blocks.
 * @author gasolin@gmail.com  (Fred Lin)
 */
import '../compat_shim.js';


Blockly.Arduino.controls_if = function() {
  // If/elseif/else condition.
  var n = 0;
  var argument = Blockly.Arduino.valueToCode(this, 'IF' + n,
      Blockly.Arduino.ORDER_NONE) || 'false';
  var branch = Blockly.Arduino.statementToCode(this, 'DO' + n) || '';
  var code = 'if (' + argument + ') {\n' + branch + '\n}';
  for (n = 1; n <= this.elseifCount_; n++) {
    argument = Blockly.Arduino.valueToCode(this, 'IF' + n,
      Blockly.Arduino.ORDER_NONE) || 'false';
    branch = Blockly.Arduino.statementToCode(this, 'DO' + n) || '';
    code += ' else if (' + argument + ') {\n' + branch + '}';
  }
  if (this.elseCount_) {
    branch = Blockly.Arduino.statementToCode(this, 'ELSE') || '';
    code += ' else {\n' + branch + '\n}';
  }
  return code + '\n';
};

/** If / else (no mutator) — same C output as controls_if with elseCount_ = 1 */
Blockly.Arduino.controls_ifelse = function () {
  var argument = Blockly.Arduino.valueToCode(this, 'IF0', Blockly.Arduino.ORDER_NONE) || 'false';
  var branchIf = Blockly.Arduino.statementToCode(this, 'DO0') || '';
  var branchElse = Blockly.Arduino.statementToCode(this, 'ELSE') || '';
  return 'if (' + argument + ') {\n' + branchIf + '\n} else {\n' + branchElse + '\n}\n';
};

Blockly.Arduino.logic_compare = function() {
  // Comparison operator. Guard mode/operator for STEM blocks (sensor in A, number in B).
  var mode = this.getFieldValue('OP') || 'EQ';
  var operator = Blockly.Arduino.logic_compare.OPERATORS[mode] || '==';
  var order = (operator == '==' || operator == '!=') ?
      Blockly.Arduino.ORDER_EQUALITY : Blockly.Arduino.ORDER_RELATIONAL;
  var argument0 = Blockly.Arduino.valueToCode(this, 'A', order) || '0';
  var argument1 = Blockly.Arduino.valueToCode(this, 'B', order) || '0';
  var code = argument0 + ' ' + operator + ' ' + argument1;
  return [code, order];
};

Blockly.Arduino.logic_compare.OPERATORS = {
  EQ: '==',
  NEQ: '!=',
  LT: '<',
  LTE: '<=',
  GT: '>',
  GTE: '>='
};

Blockly.Arduino.logic_operation = function() {
  // Operations 'and', 'or'.
  var operator = (this.getFieldValue('OP') == 'AND') ? '&&' : '||';
  var order = (operator == '&&') ? Blockly.Arduino.ORDER_LOGICAL_AND :
      Blockly.Arduino.ORDER_LOGICAL_OR;
  var argument0 = Blockly.Arduino.valueToCode(this, 'A', order) || 'false';
  var argument1 = Blockly.Arduino.valueToCode(this, 'B', order) || 'false';
  var code = argument0 + ' ' + operator + ' ' + argument1;
  return [code, order];
};

Blockly.Arduino.logic_negate = function() {
  // Negation.
  var order = Blockly.Arduino.ORDER_UNARY_PREFIX;
  var argument0 = Blockly.Arduino.valueToCode(this, 'BOOL', order) || 'false';
  var code = '!' + argument0;
  return [code, order];
};

Blockly.Arduino.logic_boolean = function() {
  // Boolean values true and false. Guard for missing field.
  var code = (this.getFieldValue('BOOL') == 'TRUE') ? 'true' : 'false';
  return [code, Blockly.Arduino.ORDER_ATOMIC];
};

Blockly.Arduino.logic_null = function() {
  var code = 'NULL';
  return [code ,Blockly.Arduino.ORDER_ATOMIC];
};

Blockly.Arduino.controls_switch = function() {
  // switch/var/case/do/default function
  var n = 0;
  var switchvar = Blockly.Arduino.variableDB_.getName(this.getFieldValue('SWVAR'),
      Blockly.Variables.NAME_TYPE);
  var argument = Blockly.Arduino.valueToCode(this, 'CASE' + n,
      Blockly.Arduino.ORDER_NONE) || 'false';
  var branch = Blockly.Arduino.statementToCode(this, 'DO' + n) || '';
  var code = 'switch (' + switchvar + ') {\n'+
  'case ' + argument + ': \n' + branch + '  break;\n';
  for (n = 1; n <= this.casebreakCount_; n++) {
    argument = Blockly.Arduino.valueToCode(this, 'CASE' + n,
      Blockly.Arduino.ORDER_NONE) || 'false';
    branch = Blockly.Arduino.statementToCode(this, 'DO' + n) || '';
    code += ' case ' + argument + ': \n' + branch + '  break;\n';
  }
  if (this.defaultCount_) {
    branch = Blockly.Arduino.statementToCode(this, 'DEFAULT') || '';
    code += ' default :\n' + branch + ' ';
  }
  code += '}'
  return code + '\n';
};
