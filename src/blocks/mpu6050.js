import * as Blockly from 'blockly';

/**
 * @fileoverview MPU6050 6-axis motion sensor blocks
 * @author BlockIDE Team
 */

Blockly.Blocks['mpu6050_init'] = {
  init: function() {
    this.setColour('#00979D');
    this.setHelpUrl('https://github.com/ElectronicCats/mpu6050');
    this.appendDummyInput()
        .appendField('Setup MPU6050');
    this.appendDummyInput()
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField('I2C Address')
        .appendField(new Blockly.FieldDropdown([
          ['0x68', '0x68'],
          ['0x69', '0x69']
        ]), 'ADDRESS');
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip('Initialize MPU6050 6-axis motion sensor (accelerometer + gyroscope)');
  }
};

Blockly.Blocks['mpu6050_read_accel'] = {
  init: function() {
    this.setColour('#00979D');
    this.setHelpUrl('https://github.com/ElectronicCats/mpu6050');
    this.appendDummyInput()
        .appendField('MPU6050 Acceleration')
        .appendField(new Blockly.FieldDropdown([
          ['X', 'X'],
          ['Y', 'Y'],
          ['Z', 'Z']
        ]), 'AXIS');
    this.setOutput(true, 'Number');
    this.setTooltip('Read acceleration on X, Y, or Z axis (range: -32768 to 32767)');
  },
  getBlockType: function() {
    return Blockly.Types.NUMBER;
  }
};

Blockly.Blocks['mpu6050_read_gyro'] = {
  init: function() {
    this.setColour('#00979D');
    this.setHelpUrl('https://github.com/ElectronicCats/mpu6050');
    this.appendDummyInput()
        .appendField('MPU6050 Rotation')
        .appendField(new Blockly.FieldDropdown([
          ['X', 'X'],
          ['Y', 'Y'],
          ['Z', 'Z']
        ]), 'AXIS');
    this.setOutput(true, 'Number');
    this.setTooltip('Read gyroscope rotation on X, Y, or Z axis (range: -32768 to 32767)');
  },
  getBlockType: function() {
    return Blockly.Types.NUMBER;
  }
};
