// Enhanced LDR Sensor Blocks

// Ensure message keys exist (fallback if lang file hasn't defined them)
(function() {
  var _msg = Blockly.Msg || {};
  var defaults = {
    LDR_SETUP_TEXT: 'Setup LDR sensor on pin', LDR_SETUP_TOOLTIP: 'Initialize LDR sensor',
    LDR_READ_TEXT: 'Read LDR on pin', LDR_READ_TOOLTIP: 'Read light level (0-1023)',
    LDR_THRESHOLD_TEXT: 'LDR on pin', LDR_THRESHOLD_IS: 'is',
    LDR_THRESHOLD_BRIGHTER: 'brighter than', LDR_THRESHOLD_DARKER: 'darker than',
    LDR_THRESHOLD_THRESHOLD: 'threshold', LDR_THRESHOLD_TOOLTIP: 'Check if light is above/below threshold',
    LDR_LIGHT_LEVEL_TEXT: 'Light level on pin', LDR_LIGHT_LEVEL_TOOLTIP: 'Returns: Very Dark / Dark / Medium / Bright / Very Bright',
    LDR_AUTO_ADJUST_TEXT: 'Auto adjust on pin', LDR_AUTO_ADJUST_IF_BRIGHT: 'if bright',
    LDR_AUTO_ADJUST_IF_DARK: 'if dark', LDR_AUTO_ADJUST_TOOLTIP: 'Run different code based on light level',
    LDR_CALIBRATE_TEXT: 'Calibrate LDR on pin', LDR_CALIBRATE_WITH_SAMPLES: 'with samples',
    LDR_CALIBRATE_TOOLTIP: 'Average multiple readings for calibration',
    TEMP_SETUP_TEXT: 'Setup temperature sensor on pin', TEMP_SETUP_TOOLTIP: 'Initialize analog temperature sensor',
    TEMP_READ_TEXT: 'Read temperature on pin', TEMP_READ_TOOLTIP: 'Returns temperature in °C',
    TEMP_THRESHOLD_TEXT: 'Temperature on pin', TEMP_THRESHOLD_IS: 'is',
    TEMP_THRESHOLD_ABOVE: 'above', TEMP_THRESHOLD_BELOW: 'below',
    TEMP_THRESHOLD_THRESHOLD: '°C threshold', TEMP_THRESHOLD_TOOLTIP: 'Check if temperature is above/below value',
    TEMP_CONVERT_TEXT: 'Convert temperature', TEMP_CONVERT_C_TO_F: '°C → °F',
    TEMP_CONVERT_F_TO_C: '°F → °C', TEMP_CONVERT_TOOLTIP: 'Convert between Celsius and Fahrenheit',
  };
  for (var k in defaults) { if (!_msg[k]) _msg[k] = defaults[k]; }
})();

// LDR Sensor Setup Block
Blockly.Blocks['ldr_setup'] = {
  init: function() {
    this.setColour(160);
    this.setHelpUrl("");
    this.appendDummyInput()
        .appendField(Blockly.Msg.LDR_SETUP_TEXT)
        .appendField(new Blockly.FieldTextInput('A0'), "PIN");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip(Blockly.Msg.LDR_SETUP_TOOLTIP);
  }
};

// Temperature Sensor Setup Block
Blockly.Blocks['temp_setup'] = {
  init: function() {
    this.setColour(200);
    this.setHelpUrl("");
    this.appendDummyInput()
        .appendField(Blockly.Msg.TEMP_SETUP_TEXT)
        .appendField(new Blockly.FieldTextInput('A0'), "PIN");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip(Blockly.Msg.TEMP_SETUP_TOOLTIP);
  }
};

Blockly.Blocks['ldr_read'] = {
  init: function() {
    this.setColour(160);
    this.setHelpUrl("");
    this.appendDummyInput()
        .appendField(Blockly.Msg.LDR_READ_TEXT)
        .appendField(new Blockly.FieldTextInput('A0'), "PIN");
    this.setOutput(true, 'Number');
    this.setTooltip(Blockly.Msg.LDR_READ_TOOLTIP);
  }
};

Blockly.Blocks['ldr_threshold'] = {
  init: function() {
    this.setColour(160);
    this.setHelpUrl("");
    this.appendDummyInput()
        .appendField(Blockly.Msg.LDR_THRESHOLD_TEXT)
        .appendField(new Blockly.FieldTextInput('A0'), "PIN")
        .appendField(Blockly.Msg.LDR_THRESHOLD_IS)
        .appendField(new Blockly.FieldDropdown([
          [Blockly.Msg.LDR_THRESHOLD_BRIGHTER, "BRIGHTER"],
          [Blockly.Msg.LDR_THRESHOLD_DARKER, "DARKER"]
        ]), "COMPARISON")
        .appendField(Blockly.Msg.LDR_THRESHOLD_THRESHOLD)
        .appendField(new Blockly.FieldNumber(500, 0, 1023, 1), "THRESHOLD");
    this.setOutput(true, 'Boolean');
    this.setTooltip(Blockly.Msg.LDR_THRESHOLD_TOOLTIP);
  }
};

Blockly.Blocks['ldr_light_level'] = {
  init: function() {
    this.setColour(160);
    this.setHelpUrl("");
    this.appendDummyInput()
        .appendField(Blockly.Msg.LDR_LIGHT_LEVEL_TEXT)
        .appendField(new Blockly.FieldTextInput('A0'), "PIN");
    this.setOutput(true, 'String');
    this.setTooltip(Blockly.Msg.LDR_LIGHT_LEVEL_TOOLTIP);
  }
};

Blockly.Blocks['ldr_auto_adjust'] = {
  init: function() {
    this.setColour(160);
    this.setHelpUrl("");
    this.appendDummyInput()
        .appendField(Blockly.Msg.LDR_AUTO_ADJUST_TEXT)
        .appendField(new Blockly.FieldTextInput('A0'), "PIN");
    this.appendValueInput("BRIGHT_ACTION")
        .setCheck(null)
        .appendField(Blockly.Msg.LDR_AUTO_ADJUST_IF_BRIGHT);
    this.appendValueInput("DARK_ACTION")
        .setCheck(null)
        .appendField(Blockly.Msg.LDR_AUTO_ADJUST_IF_DARK);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip(Blockly.Msg.LDR_AUTO_ADJUST_TOOLTIP);
  }
};

Blockly.Blocks['ldr_calibrate'] = {
  init: function() {
    this.setColour(160);
    this.setHelpUrl("");
    this.appendDummyInput()
        .appendField(Blockly.Msg.LDR_CALIBRATE_TEXT)
        .appendField(new Blockly.FieldTextInput('A0'), "PIN");
    this.appendValueInput("SAMPLES")
        .setCheck("Number")
        .appendField(Blockly.Msg.LDR_CALIBRATE_WITH_SAMPLES);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip(Blockly.Msg.LDR_CALIBRATE_TOOLTIP);
  }
};

// Temperature Sensor Blocks
Blockly.Blocks['temp_read'] = {
  init: function() {
    this.setColour(200);
    this.setHelpUrl("");
    this.appendDummyInput()
        .appendField(Blockly.Msg.TEMP_READ_TEXT)
        .appendField(new Blockly.FieldTextInput('A0'), "PIN");
    this.setOutput(true, 'Number');
    this.setTooltip(Blockly.Msg.TEMP_READ_TOOLTIP);
  }
};

Blockly.Blocks['temp_threshold'] = {
  init: function() {
    this.setColour(200);
    this.setHelpUrl("");
    this.appendDummyInput()
        .appendField(Blockly.Msg.TEMP_THRESHOLD_TEXT)
        .appendField(new Blockly.FieldTextInput('A0'), "PIN")
        .appendField(Blockly.Msg.TEMP_THRESHOLD_IS)
        .appendField(new Blockly.FieldDropdown([
          [Blockly.Msg.TEMP_THRESHOLD_ABOVE, "ABOVE"],
          [Blockly.Msg.TEMP_THRESHOLD_BELOW, "BELOW"]
        ]), "COMPARISON")
        .appendField(Blockly.Msg.TEMP_THRESHOLD_THRESHOLD)
        .appendField(new Blockly.FieldNumber(25, -50, 100, 1), "THRESHOLD")
        .appendField("°C");
    this.setOutput(true, 'Boolean');
    this.setTooltip(Blockly.Msg.TEMP_THRESHOLD_TOOLTIP);
  }
};

Blockly.Blocks['temp_convert'] = {
  init: function() {
    this.setColour(200);
    this.setHelpUrl("");
    this.appendDummyInput()
        .appendField(Blockly.Msg.TEMP_CONVERT_TEXT)
        .appendField(new Blockly.FieldDropdown([
          [Blockly.Msg.TEMP_CONVERT_C_TO_F, "C_TO_F"],
          [Blockly.Msg.TEMP_CONVERT_F_TO_C, "F_TO_C"]
        ]), "CONVERSION");
    this.appendValueInput("TEMP")
        .setCheck("Number")
        .appendField("temperature");
    this.setOutput(true, 'Number');
    this.setTooltip(Blockly.Msg.TEMP_CONVERT_TOOLTIP);
  }
}; 