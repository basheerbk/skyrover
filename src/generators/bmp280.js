import '../compat_shim.js';

/**
 * @fileoverview BMP280 code generators for Arduino
 * @author BlockIDE Team
 */

Blockly.Arduino['bmp280_init'] = function(block) {
  var address = block.getFieldValue('ADDRESS');
  
  Blockly.Arduino.includes_['include_Wire'] = '#include <Wire.h>';
  Blockly.Arduino.includes_['include_BMP280'] = '#include <Adafruit_BMP280.h>';
  
  Blockly.Arduino.definitions_['define_bmp280'] = 'Adafruit_BMP280 bmp;';
  
  var setupCode = '';
  if (address === '0x76') {
    setupCode = 'if (!bmp.begin(0x76)) {\n' +
                '    Serial.println("Could not find BMP280 sensor!");\n' +
                '    while (1);\n' +
                '  }';
  } else {
    setupCode = 'if (!bmp.begin()) {\n' +
                '    Serial.println("Could not find BMP280 sensor!");\n' +
                '    while (1);\n' +
                '  }';
  }
  
  Blockly.Arduino.setups_['setup_bmp280'] = setupCode;
  
  return '';
};

Blockly.Arduino['bmp280_read_temp'] = function(block) {
  Blockly.Arduino.includes_['include_Wire'] = '#include <Wire.h>';
  Blockly.Arduino.includes_['include_BMP280'] = '#include <Adafruit_BMP280.h>';
  
  var code = 'bmp.readTemperature()';
  return [code, Blockly.Arduino.ORDER_ATOMIC];
};

Blockly.Arduino['bmp280_read_pressure'] = function(block) {
  Blockly.Arduino.includes_['include_Wire'] = '#include <Wire.h>';
  Blockly.Arduino.includes_['include_BMP280'] = '#include <Adafruit_BMP280.h>';
  
  var code = 'bmp.readPressure()';
  return [code, Blockly.Arduino.ORDER_ATOMIC];
};

Blockly.Arduino['bmp280_read_altitude'] = function(block) {
  Blockly.Arduino.includes_['include_Wire'] = '#include <Wire.h>';
  Blockly.Arduino.includes_['include_BMP280'] = '#include <Adafruit_BMP280.h>';
  
  var seaLevel = Blockly.Arduino.valueToCode(block, 'SEA_LEVEL', Blockly.Arduino.ORDER_ATOMIC);
  if (!seaLevel) {
    seaLevel = '1013.25';
  }
  
  var code = 'bmp.readAltitude(' + seaLevel + ')';
  return [code, Blockly.Arduino.ORDER_ATOMIC];
};
