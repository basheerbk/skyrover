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
 * @fileoverview Variable blocks for Arduino.
 * @author gasolin@gmail.com (Fred Lin)
 */
import '../compat_shim.js';


Blockly.Arduino['variables_get'] = function(block) {
  var code = Blockly.Arduino.variableDB_.getName(block.getFieldValue('VAR'),Blockly.Variables.NAME_TYPE);
  return [code, Blockly.Arduino.ORDER_ATOMIC];
};

Blockly.Arduino['variables_set'] = function(block) {
  var argument0 = Blockly.Arduino.valueToCode(block, 'VALUE', Blockly.Arduino.ORDER_ASSIGNMENT) || '0';
  var varName = Blockly.Arduino.variableDB_.getName(block.getFieldValue('VAR'), Blockly.Variables.NAME_TYPE);
  // Auto-declare as float if no typed declaration exists yet (variables_set_init / variables_const
  // write to the same key with the exact type, so they take priority if processed first).
  if (!Blockly.Arduino.definitions_['var_' + varName] &&
      !Blockly.Arduino.variables_[varName]) {
    Blockly.Arduino.definitions_['var_' + varName] = 'float ' + varName + ' = 0;';
  }
  var code = varName + ' = ' + argument0 + ';\n';
  return code;
};

Blockly.Arduino['variables_const'] = function(block) {
  var argument0 = Blockly.Arduino.valueToCode(block, 'VALUE', Blockly.Arduino.ORDER_ASSIGNMENT) || '0';
  var varName = Blockly.Arduino.variableDB_.getName(block.getFieldValue('VAR'), Blockly.Variables.NAME_TYPE);
  var typeBlock = Blockly.Arduino.getArduinoType_(Blockly.Types.getChildBlockType(block));
  // Write to variables_ (now initialized) — emitted in finish() after definitions_
  Blockly.Arduino.variables_[varName] = 'const ' + typeBlock + ' ' + varName + ' = ' + argument0 + ';';
  return '';
};

Blockly.Arduino['variables_set_init'] = function(block) {
  var varName = Blockly.Arduino.variableDB_.getName(block.getFieldValue('VAR'), Blockly.Variables.NAME_TYPE);
  // Dropdown stores typeId string ("Number", "Boolean", …); Blockly.Types is keyed by uppercase (NUMBER, BOOLEAN).
  // If Blockly.Types is missing or key doesn't match, pass { typeId } so getArduinoType_ can still map it.
  var typeKey = block.getFieldValue('VARIABLE_SETTYPE_TYPE');
  var typeObj = (Blockly.Types && typeof Blockly.Types === 'object' && Blockly.Types[typeKey])
    ? Blockly.Types[typeKey]
    : { typeId: typeKey || 'Number' };
  var varType = Blockly.Arduino.getArduinoType_(typeObj);
  var argument0 = Blockly.Arduino.valueToCode(block, 'VALUE', Blockly.Arduino.ORDER_ASSIGNMENT);
  // Write to variables_ (now initialized) — emitted in finish() after definitions_
  // Also remove any auto-declared float so the explicit type wins
  delete Blockly.Arduino.definitions_['var_' + varName];
  if (argument0) {
    Blockly.Arduino.variables_[varName] = varType + ' ' + varName + ' = ' + argument0 + ';';
  } else {
    Blockly.Arduino.variables_[varName] = varType + ' ' + varName + ';';
  }
  return '';
};

Blockly.Arduino['variables_declare_typed'] = function(block) {
  var varName = Blockly.Arduino.variableDB_.getName(block.getFieldValue('VAR'), Blockly.Variables.NAME_TYPE);
  var typeKey = block.getFieldValue('VARIABLE_DECLARE_TYPE');
  var typeObj = (Blockly.Types && typeof Blockly.Types === 'object' && Blockly.Types[typeKey])
    ? Blockly.Types[typeKey]
    : { typeId: typeKey || 'Number' };
  var varType = Blockly.Arduino.getArduinoType_(typeObj);
  delete Blockly.Arduino.definitions_['var_' + varName];
  Blockly.Arduino.variables_[varName] = varType + ' ' + varName + ';';
  return '';
};
