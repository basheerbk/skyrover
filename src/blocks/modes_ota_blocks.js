import * as Blockly from 'blockly';

/**
 * @fileoverview OTA (Over-The-Air) blocks for BlocklyArduino
 * @author BlocklyArduino
 */

Blockly.Blocks['ota'] = {
  HUE: 120
};

Blockly.Blocks['ota_setup_simple'] = {
  init: function() {
    this.setColour('#00979D');
    this.appendDummyInput()
        .appendField("🔧 OTA Setup")
        .appendField("WiFi SSID")
        .appendField(new Blockly.FieldTextInput("MyWiFi"), "SSID")
        .appendField("Password")
        .appendField(new Blockly.FieldTextInput("mypassword"), "PASSWORD");
    this.appendDummyInput()
        .appendField("OTA Password")
        .appendField(new Blockly.FieldTextInput("admin"), "OTA_PASSWORD")
        .appendField("Port")
        .appendField(new Blockly.FieldNumber(3232, 1024, 65535, 1), "PORT");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip("Easy OTA setup - connects to WiFi and enables wireless updates");
    this.setHelpUrl("");
  }
};

Blockly.Blocks['ota_init'] = {
  init: function() {
    this.setColour('#00979D');
    this.appendDummyInput()
        .appendField("OTA Initialize")
        .appendField("Port")
        .appendField(new Blockly.FieldNumber(3232, 1024, 65535, 1), "PORT")
        .appendField("Password")
        .appendField(new Blockly.FieldTextInput("admin"), "PASSWORD");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip("Initialize OTA (Over-The-Air) update functionality");
    this.setHelpUrl("");
  }
};

Blockly.Blocks['ota_handle'] = {
  init: function() {
    this.setColour('#00979D');
    this.appendDummyInput()
        .appendField("OTA Handle");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip("Handle OTA updates - call this in loop()");
    this.setHelpUrl("");
  }
};

Blockly.Blocks['ota_check_update'] = {
  init: function() {
    this.setColour('#00979D');
    this.appendDummyInput()
        .appendField("OTA Check for Update");
    this.setOutput(true, "Boolean");
    this.setTooltip("Check if an OTA update is available");
    this.setHelpUrl("");
  }
};

Blockly.Blocks['ota_get_progress'] = {
  init: function() {
    this.setColour('#00979D');
    this.appendDummyInput()
        .appendField("OTA Get Progress");
    this.setOutput(true, "Number");
    this.setTooltip("Get the progress percentage of current OTA update");
    this.setHelpUrl("");
  }
};

Blockly.Blocks['ota_get_error'] = {
  init: function() {
    this.setColour('#00979D');
    this.appendDummyInput()
        .appendField("OTA Get Error");
    this.setOutput(true, "Number");
    this.setTooltip("Get the error code if OTA update failed");
    this.setHelpUrl("");
  }
};

Blockly.Blocks['ota_begin'] = {
  init: function() {
    this.setColour('#00979D');
    this.appendDummyInput()
        .appendField("OTA Begin Update")
        .appendField("Size")
        .appendField(new Blockly.FieldNumber(0, 0, 1000000, 1), "SIZE");
    this.setInputsInline(true);
    this.setOutput(true, "Boolean");
    this.setTooltip("Begin OTA update process");
    this.setHelpUrl("");
  }
};

Blockly.Blocks['ota_write'] = {
  init: function() {
    this.setColour('#00979D');
    this.appendValueInput("DATA")
        .setCheck("Number")
        .appendField("OTA Write Data");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip("Write data during OTA update");
    this.setHelpUrl("");
  }
};

Blockly.Blocks['ota_end'] = {
  init: function() {
    this.setColour('#00979D');
    this.appendDummyInput()
        .appendField("OTA End Update");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip("End OTA update process");
    this.setHelpUrl("");
  }
}; 