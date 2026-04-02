import * as Blockly from 'blockly';

Blockly.Blocks['dht_read'] = {
  init: function() {
    this.appendDummyInput()
        .appendField('DHT Sensor')
        .appendField(new Blockly.FieldDropdown([
          ['DHT11', 'DHT11'],
          ['DHT22', 'DHT22']
        ]), 'DHT_TYPE')
        .appendField('Pin')
        .appendField(new Blockly.FieldNumber(2, 0, 13, 1), 'PIN');
    this.setOutput(true, 'DHT');
    this.setColour(230);
    this.setTooltip('Read temperature and humidity from DHT sensor');
    this.setHelpUrl('https://github.com/adafruit/DHT-sensor-library');
  }
};

Blockly.Blocks['dht_temperature'] = {
  init: function() {
    this.appendValueInput('DHT_OBJ')
        .setCheck('DHT')
        .appendField('Temperature (°C) from');
    this.setOutput(true, 'Number');
    this.setColour(20);
    this.setTooltip('Get temperature from DHT sensor');
    this.setHelpUrl('https://github.com/adafruit/DHT-sensor-library');
  }
};

Blockly.Blocks['dht_humidity'] = {
  init: function() {
    this.appendValueInput('DHT_OBJ')
        .setCheck('DHT')
        .appendField('Humidity (%) from');
    this.setOutput(true, 'Number');
    this.setColour(65);
    this.setTooltip('Get humidity from DHT sensor');
    this.setHelpUrl('https://github.com/adafruit/DHT-sensor-library');
  }
};