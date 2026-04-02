import '../compat_shim.js';

Blockly.Arduino['dht_read'] = function(block) {
  var dhtType = block.getFieldValue('DHT_TYPE');
  var pin = block.getFieldValue('PIN');
  var varName = Blockly.Arduino.variableDB_.getDistinctName('dht', Blockly.Variables.NAME_TYPE);
  Blockly.Arduino.includes_['dht'] = '#include <DHT.h>';
  Blockly.Arduino.definitions_['dht_obj_' + varName] = 'DHT ' + varName + '(' + pin + ', ' + dhtType + ');';
  Blockly.Arduino.setups_['dht_begin_' + varName] = varName + '.begin();';
  var code = varName;
  return [code, Blockly.Arduino.ORDER_ATOMIC];
};

Blockly.Arduino['dht_temperature'] = function(block) {
  var dhtObj = Blockly.Arduino.valueToCode(block, 'DHT_OBJ', Blockly.Arduino.ORDER_ATOMIC);
  var code = dhtObj + '.readTemperature()';
  return [code, Blockly.Arduino.ORDER_ATOMIC];
};

Blockly.Arduino['dht_humidity'] = function(block) {
  var dhtObj = Blockly.Arduino.valueToCode(block, 'DHT_OBJ', Blockly.Arduino.ORDER_ATOMIC);
  var code = dhtObj + '.readHumidity()';
  return [code, Blockly.Arduino.ORDER_ATOMIC];
};