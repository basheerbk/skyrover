import '../compat_shim.js';

// Enhanced LDR Sensor Code Generators

Blockly.Arduino['ldr_read'] = function(block) {
  var pin = block.getFieldValue('PIN');
  var code = 'analogRead(' + pin + ')';
  return [code, Blockly.Arduino.ORDER_ATOMIC];
};

Blockly.Arduino['ldr_threshold'] = function(block) {
  var pin = block.getFieldValue('PIN');
  var comparison = block.getFieldValue('COMPARISON');
  var threshold = block.getFieldValue('THRESHOLD');
  
  var code = 'analogRead(' + pin + ')';
  if (comparison === 'BRIGHTER') {
    code += ' > ' + threshold;
  } else {
    code += ' < ' + threshold;
  }
  
  return [code, Blockly.Arduino.ORDER_RELATIONAL];
};

Blockly.Arduino['ldr_light_level'] = function(block) {
  var pin = block.getFieldValue('PIN');
  
  // Add helper function for light level classification
  Blockly.Arduino.definitions_['ldr_light_level_function'] = 
    'String getLightLevel(int ldrValue) {\n' +
    '  if (ldrValue < 200) return "Very Dark";\n' +
    '  else if (ldrValue < 400) return "Dark";\n' +
    '  else if (ldrValue < 600) return "Medium";\n' +
    '  else if (ldrValue < 800) return "Bright";\n' +
    '  else return "Very Bright";\n' +
    '}\n';
  
  var code = 'getLightLevel(analogRead(' + pin + '))';
  return [code, Blockly.Arduino.ORDER_ATOMIC];
};

Blockly.Arduino['ldr_auto_adjust'] = function(block) {
  var pin = block.getFieldValue('PIN');
  var brightAction = Blockly.Arduino.statementToCode(block, 'BRIGHT_ACTION');
  var darkAction = Blockly.Arduino.statementToCode(block, 'DARK_ACTION');
  
  var code = 'if (analogRead(' + pin + ') > 500) {\n';
  code += brightAction;
  code += '} else {\n';
  code += darkAction;
  code += '}\n';
  
  return code;
};

Blockly.Arduino['ldr_calibrate'] = function(block) {
  var pin = block.getFieldValue('PIN');
  var samples = Blockly.Arduino.valueToCode(block, 'SAMPLES', Blockly.Arduino.ORDER_ATOMIC) || '10';
  
  // Add calibration function
  Blockly.Arduino.definitions_['ldr_calibrate_function'] = 
    'int calibrateLDR(int pin, int samples) {\n' +
    '  long total = 0;\n' +
    '  for (int i = 0; i < samples; i++) {\n' +
    '    total += analogRead(pin);\n' +
    '    delay(10);\n' +
    '  }\n' +
    '  return total / samples;\n' +
    '}\n';
  
  var code = 'calibrateLDR(' + pin + ', ' + samples + ')';
  return [code, Blockly.Arduino.ORDER_ATOMIC];
};

// Temperature Sensor Code Generators

Blockly.Arduino['temp_read'] = function(block) {
  var pin = block.getFieldValue('PIN');
  
  // Add temperature conversion function
  Blockly.Arduino.definitions_['temp_read_function'] = 
    'float readTemperature(int pin) {\n' +
    '  int rawValue = analogRead(pin);\n' +
    '  float voltage = rawValue * (5.0 / 1023.0);\n' +
    '  float temperature = (voltage - 0.5) * 100.0;\n' +
    '  return temperature;\n' +
    '}\n';
  
  var code = 'readTemperature(' + pin + ')';
  return [code, Blockly.Arduino.ORDER_ATOMIC];
};

Blockly.Arduino['temp_threshold'] = function(block) {
  var pin = block.getFieldValue('PIN');
  var comparison = block.getFieldValue('COMPARISON');
  var threshold = block.getFieldValue('THRESHOLD');
  
  var code = 'readTemperature(' + pin + ')';
  if (comparison === 'ABOVE') {
    code += ' > ' + threshold;
  } else {
    code += ' < ' + threshold;
  }
  
  return [code, Blockly.Arduino.ORDER_RELATIONAL];
};

Blockly.Arduino['temp_convert'] = function(block) {
  var conversion = block.getFieldValue('CONVERSION');
  var temp = Blockly.Arduino.valueToCode(block, 'TEMP', Blockly.Arduino.ORDER_ATOMIC) || '0';
  
  // Add conversion function
  Blockly.Arduino.definitions_['temp_convert_function'] = 
    'float convertTemperature(float temp, String conversion) {\n' +
    '  if (conversion == "C_TO_F") {\n' +
    '    return (temp * 9.0 / 5.0) + 32.0;\n' +
    '  } else {\n' +
    '    return (temp - 32.0) * 5.0 / 9.0;\n' +
    '  }\n' +
    '}\n';
  
  var code = 'convertTemperature(' + temp + ', "' + conversion + '")';
  return [code, Blockly.Arduino.ORDER_ATOMIC];
}; 