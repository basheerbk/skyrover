import * as Blockly from 'blockly';

/**
 * @fileoverview BMP280 barometric pressure sensor blocks
 * @author BlockIDE Team
 */

Blockly.Blocks['bmp280_init'] = {
  init: function() {
    this.setColour('#00979D');
    this.setHelpUrl('https://github.com/adafruit/Adafruit_BMP280_Library');
    this.appendDummyInput()
        .appendField('Setup BMP280');
    this.appendDummyInput()
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField('I2C Address')
        .appendField(new Blockly.FieldDropdown([
          ['0x77 (default)', '0x77'],
          ['0x76 (alt)', '0x76']
        ]), 'ADDRESS');
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip('Initialize BMP280 barometric pressure sensor (temperature + pressure + altitude)');
  }
};

Blockly.Blocks['bmp280_read_temp'] = {
  init: function() {
    this.setColour('#00979D');
    this.setHelpUrl('https://github.com/adafruit/Adafruit_BMP280_Library');
    this.appendDummyInput()
        .appendField('BMP280 Temperature (°C)');
    this.setOutput(true, 'Number');
    this.setTooltip('Read temperature in degrees Celsius');
  },
  getBlockType: function() {
    return Blockly.Types.DECIMAL;
  }
};

Blockly.Blocks['bmp280_read_pressure'] = {
  init: function() {
    this.setColour('#00979D');
    this.setHelpUrl('https://github.com/adafruit/Adafruit_BMP280_Library');
    this.appendDummyInput()
        .appendField('BMP280 Pressure (Pa)');
    this.setOutput(true, 'Number');
    this.setTooltip('Read atmospheric pressure in Pascals');
  },
  getBlockType: function() {
    return Blockly.Types.DECIMAL;
  }
};

Blockly.Blocks['bmp280_read_altitude'] = {
  init: function() {
    this.setColour('#00979D');
    this.setHelpUrl('https://github.com/adafruit/Adafruit_BMP280_Library');
    this.appendDummyInput()
        .appendField('BMP280 Altitude (m)');
    this.appendValueInput('SEA_LEVEL')
        .setCheck('Number')
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField('Sea level pressure (hPa)');
    this.setInputsInline(false);
    this.setOutput(true, 'Number');
    this.setTooltip('Calculate altitude in meters based on sea level pressure (default: 1013.25 hPa)');
  },
  getBlockType: function() {
    return Blockly.Types.DECIMAL;
  }
};
