import * as Blockly from 'blockly';

/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2012 Fred Lin.
 * https://github.com/gasolin/BlocklyDuino
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Thanks to Fred Lin for building BlockyDuino!
 * @author greich@ac-versailles.fr Guillaume Reich
 */

Blockly.Msg.IR_HELPURL = 'http://greich.fr/v1/blog/post.php?id=13';

// User-friendly IR blocks for Blockly Arduino

Blockly.Blocks['ir_receive'] = {
  init: function() {
    this.setColour(160);
    this.appendDummyInput()
      .appendField("when IR code received on pin")
      .appendField(new Blockly.FieldDropdown([
        ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"], ["7", "7"], ["8", "8"], ["9", "9"], ["10", "10"], ["11", "11"], ["12", "12"], ["13", "13"]
      ]), "PIN")
      .appendField(", store in variable")
      .appendField(new Blockly.FieldVariable("ir_code"), "VAR");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip("Stores the received IR code in a variable when a code is received on the selected pin.");
    this.setHelpUrl("");
  }
};

Blockly.Blocks['ir_compare'] = {
  init: function() {
    this.setColour(160);
    this.appendDummyInput()
      .appendField("if IR code equals")
      .appendField(new Blockly.FieldNumber(0), "CODE")
      .appendField("on pin")
      .appendField(new Blockly.FieldDropdown([
        ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"], ["7", "7"], ["8", "8"], ["9", "9"], ["10", "10"], ["11", "11"], ["12", "12"], ["13", "13"]
      ]), "PIN");
    this.setOutput(true, 'Boolean');
    this.setTooltip("Returns true if the received IR code matches the given value on the selected pin.");
    this.setHelpUrl("");
  }
};

Blockly.Blocks['ir_send'] = {
  init: function() {
    this.setColour(160);
    this.appendDummyInput()
      .appendField("send IR code")
      .appendField(new Blockly.FieldNumber(0), "CODE")
      .appendField("on pin")
      .appendField(new Blockly.FieldDropdown([
        ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"], ["7", "7"], ["8", "8"], ["9", "9"], ["10", "10"], ["11", "11"], ["12", "12"], ["13", "13"]
      ]), "PIN");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip("Sends the specified IR code on the selected pin.");
    this.setHelpUrl("");
  }
};

Blockly.Blocks['ir_resume'] = {
  init: function() {
    this.setColour(160);
    this.appendDummyInput()
      .appendField("ready IR receiver on pin")
      .appendField(new Blockly.FieldDropdown([
        ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"], ["7", "7"], ["8", "8"], ["9", "9"], ["10", "10"], ["11", "11"], ["12", "12"], ["13", "13"]
      ]), "PIN")
      .appendField("for next code");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip("Prepares the IR receiver to receive the next code on the selected pin.");
    this.setHelpUrl("");
  }
};

// User-friendly IR sensor blocks for normal digital IR sensors

// 1. Initialize IR sensor on pin
Blockly.Blocks['ir_sensor_init'] = {
  init: function() {
    this.setColour(160);
    this.appendDummyInput()
      .appendField("initialize IR sensor on pin")
      .appendField(new Blockly.FieldDropdown([
        ["0", "0"], ["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"],
        ["5", "5"], ["6", "6"], ["7", "7"], ["8", "8"], ["9", "9"],
        ["10", "10"], ["11", "11"], ["12", "12"], ["13", "13"]
      ]), "PIN");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip("Configure the selected pin as input for a basic IR sensor.");
    this.setHelpUrl("");
  }
};

// 2. Read IR sensor on pin
Blockly.Blocks['ir_sensor_read'] = {
  init: function() {
    this.setColour(160);
    this.appendDummyInput()
      .appendField("read IR sensor on pin")
      .appendField(new Blockly.FieldDropdown([
        ["0", "0"], ["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"],
        ["5", "5"], ["6", "6"], ["7", "7"], ["8", "8"], ["9", "9"],
        ["10", "10"], ["11", "11"], ["12", "12"], ["13", "13"]
      ]), "PIN");
    this.setOutput(true, 'Boolean');
    this.setTooltip("Read the digital value (HIGH/LOW) from the IR sensor pin.");
    this.setHelpUrl("");
  }
};

// 3. If IR sensor on pin is HIGH/LOW
Blockly.Blocks['ir_sensor_compare'] = {
  init: function() {
    this.setColour(160);
    this.appendDummyInput()
      .appendField("if IR sensor on pin")
      .appendField(new Blockly.FieldDropdown([
        ["0", "0"], ["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"],
        ["5", "5"], ["6", "6"], ["7", "7"], ["8", "8"], ["9", "9"],
        ["10", "10"], ["11", "11"], ["12", "12"], ["13", "13"]
      ]), "PIN")
      .appendField("is")
      .appendField(new Blockly.FieldDropdown([["HIGH", "HIGH"], ["LOW", "LOW"]]), "STATE");
    this.setOutput(true, 'Boolean');
    this.setTooltip("Check if the IR sensor pin is HIGH or LOW.");
    this.setHelpUrl("");
  }
};

// 4. Set IR LED on pin to ON/OFF
Blockly.Blocks['ir_led_write'] = {
  init: function() {
    this.setColour(160);
    this.appendDummyInput()
      .appendField("set IR LED on pin")
      .appendField(new Blockly.FieldDropdown([
        ["0", "0"], ["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"],
        ["5", "5"], ["6", "6"], ["7", "7"], ["8", "8"], ["9", "9"],
        ["10", "10"], ["11", "11"], ["12", "12"], ["13", "13"]
      ]), "PIN")
      .appendField("to")
      .appendField(new Blockly.FieldDropdown([["ON", "HIGH"], ["OFF", "LOW"]]), "STATE");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip("Set the IR LED pin to HIGH (ON) or LOW (OFF).");
    this.setHelpUrl("");
  }
};