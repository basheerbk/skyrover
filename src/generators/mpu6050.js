import '../compat_shim.js';

/**
 * @fileoverview MPU6050 code generators for Arduino
 * @author BlockIDE Team
 */

Blockly.Arduino['mpu6050_init'] = function(block) {
  var address = block.getFieldValue('ADDRESS');
  
  Blockly.Arduino.includes_['include_I2Cdev'] = '#include "I2Cdev.h"';
  Blockly.Arduino.includes_['include_MPU6050'] = '#include "MPU6050.h"';
  
  if (address === '0x69') {
    Blockly.Arduino.definitions_['define_mpu6050'] = 'MPU6050 mpu(0x69);';
  } else {
    Blockly.Arduino.definitions_['define_mpu6050'] = 'MPU6050 mpu;';
  }
  
  Blockly.Arduino.definitions_['define_mpu_vars'] = 
    'int16_t ax, ay, az;\n' +
    'int16_t gx, gy, gz;';
  
  var setupCode = '#if I2CDEV_IMPLEMENTATION == I2CDEV_ARDUINO_WIRE\n' +
                  '    Wire.begin();\n' +
                  '  #elif I2CDEV_IMPLEMENTATION == I2CDEV_BUILTIN_FASTWIRE\n' +
                  '    Fastwire::setup(400, true);\n' +
                  '  #endif\n' +
                  '  mpu.initialize();\n' +
                  '  if (!mpu.testConnection()) {\n' +
                  '    Serial.println("MPU6050 connection failed");\n' +
                  '  }';
  
  Blockly.Arduino.setups_['setup_mpu6050'] = setupCode;
  
  return '';
};

Blockly.Arduino['mpu6050_read_accel'] = function(block) {
  var axis = block.getFieldValue('AXIS');
  
  Blockly.Arduino.includes_['include_I2Cdev'] = '#include "I2Cdev.h"';
  Blockly.Arduino.includes_['include_MPU6050'] = '#include "MPU6050.h"';
  
  Blockly.Arduino.definitions_['define_mpu_vars'] = 
    'int16_t ax, ay, az;\n' +
    'int16_t gx, gy, gz;';
  
  var code = 'mpu.getAcceleration(&ax, &ay, &az), a' + axis.toLowerCase();
  return [code, Blockly.Arduino.ORDER_ATOMIC];
};

Blockly.Arduino['mpu6050_read_gyro'] = function(block) {
  var axis = block.getFieldValue('AXIS');
  
  Blockly.Arduino.includes_['include_I2Cdev'] = '#include "I2Cdev.h"';
  Blockly.Arduino.includes_['include_MPU6050'] = '#include "MPU6050.h"';
  
  Blockly.Arduino.definitions_['define_mpu_vars'] = 
    'int16_t ax, ay, az;\n' +
    'int16_t gx, gy, gz;';
  
  var code = 'mpu.getRotation(&gx, &gy, &gz), g' + axis.toLowerCase();
  return [code, Blockly.Arduino.ORDER_ATOMIC];
};
