'use strict';

// Blynk IoT blocks — compatible with Blockly v12
// (goog.provide / goog.require removed — not available outside Closure builds)

Blockly.Blocks.blynk_iot = {
  HUE: '#23C890'
};

// Setup block for ESP32 with template/auth and WiFi creds
Blockly.Blocks.blynk_iot_setup_esp32 = {
  init: function() {
    this.setColour(Blockly.Blocks.blynk_iot.HUE);
    this.appendDummyInput()
        .appendField("Blynk IOT");
    this.appendDummyInput()
        .appendField("Template ID")
        .appendField(new Blockly.FieldTextInput(""), "TEMPLATE_ID");
    this.appendDummyInput()
        .appendField("Template name")
        .appendField(new Blockly.FieldTextInput(""), "TEMPLATE_NAME");
    this.appendDummyInput()
        .appendField("Auth token")
        .appendField(new Blockly.FieldTextInput(""), "AUTH_TOKEN");
    this.appendDummyInput()
        .appendField("Wi‑Fi name (SSID)")
        .appendField(new Blockly.FieldTextInput(""), "WIFI_SSID");
    this.appendDummyInput()
        .appendField("Wi‑Fi password")
        .appendField(new Blockly.FieldTextInput(""), "WIFI_PASS");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip("Fill in your Wi‑Fi and Blynk details. This block lets the ESP32 talk to the Blynk app.");
    this.setHelpUrl("");
  }
};

// Blynk.run() block for loop
Blockly.Blocks.blynk_iot_run = {
  init: function() {
    this.setColour(Blockly.Blocks.blynk_iot.HUE);
    this.appendDummyInput()
        .appendField("Blynk.run");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip("Put this in the loop. It keeps your board and the Blynk app talking to each other.");
    this.setHelpUrl("");
  }
};

// Virtual pin -> digital output helper
Blockly.Blocks.blynk_iot_vpin_digital_out = {
  init: function() {
    this.setColour(Blockly.Blocks.blynk_iot.HUE);
    this.appendDummyInput()
        .appendField("Button in app controls pin");
    this.appendDummyInput()
        .appendField("Virtual pin V")
        .appendField(new Blockly.FieldNumber(0, 0, 255, 1), "VPIN");
    this.appendValueInput("GPIO")
        .setCheck("Number")
        .setAlign((Blockly.inputs && Blockly.inputs.Align) ? Blockly.inputs.Align.RIGHT : (Blockly.ALIGN_RIGHT || 1))
        .appendField("controls board pin");
    this.appendDummyInput()
        .appendField("When virtual pin is ON, board pin is")
        .appendField(new Blockly.FieldDropdown([
          ["HIGH (3.3V)", "HIGH"],
          ["LOW (0V)", "LOW"]
        ]), "ACTIVE_LEVEL");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip(
      "Connect a virtual pin (V0, V1, …) in the Blynk app to a real ESP32 pin.\n" +
      "When the virtual pin is ON, the board pin uses the level you choose.\n" +
      "When the virtual pin is OFF, the board pin automatically does the opposite.\n" +
      "This helps students see the idea of IF / ELSE without extra blocks."
    );
    this.setHelpUrl("");
  }
};

// Virtual pin IF / ELSE handler (teaching block)
Blockly.Blocks.blynk_iot_vpin_handler = {
  init: function() {
    this.setColour(Blockly.Blocks.blynk_iot.HUE);
    this.appendDummyInput()
        .appendField("virtual pin value changes");
    this.appendDummyInput()
        .appendField("Virtual pin V")
        .appendField(new Blockly.FieldNumber(0, 0, 255, 1), "VPIN");
    this.appendStatementInput("ON")
        .setCheck(null)
        .appendField("If value is 1");
    this.appendStatementInput("OFF")
        .setCheck(null)
        .appendField("Else if value is 0");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip(
      "Runs whenever the value of this virtual pin changes.\n" +
      "Inside the first stack you put blocks for value = 1 (button ON).\n" +
      "Inside the second stack you put blocks for value = 0 (button OFF).\n" +
      "This is an IF / ELSE structure, but made as a single easy block for students."
    );
    this.setHelpUrl("");
  }
};

