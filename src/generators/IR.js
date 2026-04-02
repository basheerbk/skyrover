import '../compat_shim.js';

/**
 * Visual Blocks Language
 *
 * Copyright 2012 Fred Lin.
 * https://github.com/gasolin/BlocklyDuino
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
 * Thanks to Fred Lin for building BlockyDuino!
 * @author greich@ac-versailles.fr Guillaume Reich
 */

Blockly.Arduino.IR_init = function() {
  var value_pin = Blockly.Arduino.valueToCode(this, 'PIN', Blockly.Arduino.ORDER_ATOMIC);

  Blockly.Arduino.includes_['includes_IR'] = 
  '#include <IRremote.h>\n';
  Blockly.Arduino.definitions_['define_IR_init'] =
  "int IRpin = " + value_pin + ";\n" +
  "IRrecv irrecv(IRpin);\n" +
   "decode_results results;\n";

  Blockly.Arduino.setups_['setup_IR_init'] = 
  'irrecv.enableIRIn();\n';

  var code = '';
  return code;
};

Blockly.Arduino.IR_test_LED = function() {
  var ledPin = profile.defaultBoard.builtInLed || '13';
  Blockly.Arduino.setups_['setup_IR_test_LED'] = 
  'pinMode(' + ledPin + ', OUTPUT);\n';
  var code =
  'if (irrecv.decode(&results))\n' +
  '  {\n' +
  '  digitalWrite(' + ledPin + ', HIGH);\n' +
  '  delay(100);\n' +
  '  digitalWrite(' + ledPin + ', LOW);\n' +
  '  irrecv.resume();   // Receive the next value\n' +
  '  }\n';
  return code;
};

Blockly.Arduino.IR_test_monitor = function() {
  Blockly.Arduino.setups_['setup_IR_test_monitor'] = 
  'Serial.begin(9600);\n';
  var code =
  'if (irrecv.decode(&results))\n' +
  '  {\n' +
  '  Serial.println(results.value, DEC); // Print the Serial results.value\n' +
  '  irrecv.resume();   // Receive the next value\n' +
  '  }\n';
  return code;
};

Blockly.Arduino.IR_next_value = function() {
  var code = 'irrecv.resume();   // Receive the next value\n';
  return code;
};

Blockly.Arduino.IR_detection = function() {
  var code = 'irrecv.decode(&results)';
  return [code, Blockly.Arduino.ORDER_ATOMIC];
};

Blockly.Arduino.IR_reception_code = function() {
  var code = 'results.value';
  return [code, Blockly.Arduino.ORDER_ATOMIC];
};

// User-friendly IR blocks generator code

// 1. When IR code received on pin [PIN], store in variable [VAR]
Blockly.Arduino['ir_receive'] = function(block) {
  var pin = block.getFieldValue('PIN');
  var variable = Blockly.Arduino.variableDB_.getName(block.getFieldValue('VAR'), Blockly.Variables.NAME_TYPE);
  Blockly.Arduino.includes_['include_irremote'] = '#include <IRremote.h>';
  Blockly.Arduino.definitions_['irrecv_' + pin] = 'IRrecv irrecv_' + pin + '(' + pin + ');\ndecode_results results_' + pin + ';';
  Blockly.Arduino.setups_['irrecv_' + pin] = 'irrecv_' + pin + '.enableIRIn();';
  var code = 'if (irrecv_' + pin + '.decode(&results_' + pin + ')) {\n  ' + variable + ' = results_' + pin + '.value;\n  irrecv_' + pin + '.resume();\n}\n';
  return code;
};

// 2. If IR code equals [CODE] on pin [PIN]
Blockly.Arduino['ir_compare'] = function(block) {
  var pin = block.getFieldValue('PIN');
  var codeValue = block.getFieldValue('CODE');
  Blockly.Arduino.includes_['include_irremote'] = '#include <IRremote.h>';
  Blockly.Arduino.definitions_['irrecv_' + pin] = 'IRrecv irrecv_' + pin + '(' + pin + ');\ndecode_results results_' + pin + ';';
  Blockly.Arduino.setups_['irrecv_' + pin] = 'irrecv_' + pin + '.enableIRIn();';
  var code = '(irrecv_' + pin + '.decode(&results_' + pin + ') && results_' + pin + '.value == ' + codeValue + ')';
  return [code, Blockly.Arduino.ORDER_LOGICAL_AND];
};

// 3. Send IR code [CODE] on pin [PIN]
Blockly.Arduino['ir_send'] = function(block) {
  var pin = block.getFieldValue('PIN');
  var codeValue = block.getFieldValue('CODE');
  Blockly.Arduino.includes_['include_irremote'] = '#include <IRremote.h>';
  Blockly.Arduino.definitions_['irsend'] = 'IRsend irsend;';
  var code = 'irsend.sendNEC(' + codeValue + ', 32);\n';
  return code;
};

// 4. Ready IR receiver on pin [PIN] for next code
Blockly.Arduino['ir_resume'] = function(block) {
  var pin = block.getFieldValue('PIN');
  var code = 'irrecv_' + pin + '.resume();\n';
  return code;
};

// Generator for user-friendly IR sensor blocks (normal digital IR sensors)

// 1. Initialize IR sensor on pin
Blockly.Arduino['ir_sensor_init'] = function(block) {
  var pin = block.getFieldValue('PIN');
  var code = 'pinMode(' + pin + ', INPUT);\n';
  return code;
};

// 2. Read IR sensor on pin
Blockly.Arduino['ir_sensor_read'] = function(block) {
  var pin = block.getFieldValue('PIN');
  var code = 'digitalRead(' + pin + ')';
  return [code, Blockly.Arduino.ORDER_ATOMIC];
};

// 3. If IR sensor on pin is HIGH/LOW
Blockly.Arduino['ir_sensor_compare'] = function(block) {
  var pin = block.getFieldValue('PIN');
  var state = block.getFieldValue('STATE');
  var code = '(digitalRead(' + pin + ') == ' + state + ')';
  return [code, Blockly.Arduino.ORDER_ATOMIC];
};

// 4. Set IR LED on pin to ON/OFF
Blockly.Arduino['ir_led_write'] = function(block) {
  var pin = block.getFieldValue('PIN');
  var state = block.getFieldValue('STATE');
  var code = 'pinMode(' + pin + ', OUTPUT);\ndigitalWrite(' + pin + ', ' + state + ');\n';
  return code;
};
