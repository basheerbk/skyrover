/**
 * Visual Blocks Language
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
 * @fileoverview Helper functions for generating Arduino blocks.
 * @author gasolin@gmail.com (Fred Lin)
 */
'use strict';

goog.provide('Blockly.Blocks.arduino_io');

goog.require('Blockly.Blocks');
goog.require('Blockly.Types');

// Global variables to store current pin configurations
var currentDigitalPins = [];
var currentPwmPins = [];
var currentAnalogPins = [];

// Utility functions — delegate to webpack bundle (src/board_pin_options.js) when present
function getDigitalPins() {
  if (typeof window !== 'undefined' && window.BlockIDE_boardPinOptions &&
      typeof window.BlockIDE_boardPinOptions.getDigitalPinOptions === 'function') {
    try {
      var d = window.BlockIDE_boardPinOptions.getDigitalPinOptions();
      if (d && d.length) return d;
    } catch (e) {
      console.warn('getDigitalPins via BlockIDE_boardPinOptions failed', e);
    }
  }
  if (typeof profile !== 'undefined' && profile.defaultBoard) {
    var boardProfile = profile.defaultBoard;
    if (boardProfile && boardProfile.dropdownDigital) {
      if (Array.isArray(boardProfile.dropdownDigital)) {
        return boardProfile.dropdownDigital;
      } else if (boardProfile.dropdownDigital === "attention") {
        return [
          ["0", "0"], ["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"],
          ["5", "5"], ["6", "6"], ["7", "7"], ["8", "8"], ["9", "9"],
          ["10", "10"], ["11", "11"], ["12", "12"], ["13", "13"]
        ];
      }
    }
  }
  return [
    ["0", "0"], ["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"],
    ["5", "5"], ["6", "6"], ["7", "7"], ["8", "8"], ["9", "9"],
    ["10", "10"], ["11", "11"], ["12", "12"], ["13", "13"]
  ];
}

function getPwmPins() {
  if (typeof window !== 'undefined' && window.BlockIDE_boardPinOptions &&
      typeof window.BlockIDE_boardPinOptions.getPwmPinOptions === 'function') {
    try {
      var p = window.BlockIDE_boardPinOptions.getPwmPinOptions();
      if (p && p.length) return p;
    } catch (e) {
      console.warn('getPwmPins via BlockIDE_boardPinOptions failed', e);
    }
  }
  if (typeof profile !== 'undefined' && profile.defaultBoard) {
    var boardProfile = profile.defaultBoard;
    if (boardProfile && boardProfile.dropdownPWM) {
      return boardProfile.dropdownPWM;
    }
  }
  return [
    ["3", "3"], ["5", "5"], ["6", "6"], ["9", "9"], ["10", "10"], ["11", "11"]
  ];
}

function getAnalogPins() {
  if (typeof window !== 'undefined' && window.BlockIDE_boardPinOptions &&
      typeof window.BlockIDE_boardPinOptions.getAnalogPinOptions === 'function') {
    try {
      var a = window.BlockIDE_boardPinOptions.getAnalogPinOptions();
      if (a && a.length) return a;
    } catch (e) {
      console.warn('getAnalogPins via BlockIDE_boardPinOptions failed', e);
    }
  }
  if (typeof profile !== 'undefined' && profile.defaultBoard) {
    var boardProfile = profile.defaultBoard;
    if (boardProfile && boardProfile.dropdownAnalog) {
      return boardProfile.dropdownAnalog;
    }
  }
  return [
    ["A0", "A0"], ["A1", "A1"], ["A2", "A2"], ["A3", "A3"], ["A4", "A4"], ["A5", "A5"]
  ];
}

// Function to update pin configurations when board changes
function updatePinConfigurations() {
  var log = function (msg) {
    console.log(msg);
    if (window.electronAPI && window.electronAPI.log) {
      window.electronAPI.log(msg);
    }
  };

  log('updatePinConfigurations called');

  // Update the global arrays
  currentDigitalPins.length = 0;
  currentPwmPins.length = 0;
  currentAnalogPins.length = 0;

  var digitalPins = getDigitalPins();
  var pwmPins = getPwmPins();
  var analogPins = getAnalogPins();

  if (profile.defaultBoard) {
    log('Current Profile Object: ' + JSON.stringify(profile.defaultBoard));
  }

  log('Profile digital pins length: ' + (digitalPins ? digitalPins.length : 'null'));
  if (digitalPins && digitalPins.length > 0) {
    log('First digital pin: ' + JSON.stringify(digitalPins[0]));
    log('Last digital pin: ' + JSON.stringify(digitalPins[digitalPins.length - 1]));
  }

  currentDigitalPins.push(...digitalPins);
  currentPwmPins.push(...pwmPins);
  currentAnalogPins.push(...analogPins);

  log('Updated currentDigitalPins length: ' + currentDigitalPins.length);
  // Check for duplicates in the first few items
  if (currentDigitalPins.length > 5) {
    var dump = [];
    for (var i = 0; i < 10 && i < currentDigitalPins.length; i++) dump.push(currentDigitalPins[i][0]);
    log('First 10 pins in global array: ' + JSON.stringify(dump));
  }

  log('PWM pins length: ' + currentPwmPins.length);
  // ... existing logging ...
  if (typeof Blockly !== 'undefined' && Blockly.mainWorkspace) {
    var blocks = Blockly.mainWorkspace.getAllBlocks();
    console.log('Found', blocks.length, 'blocks in workspace');

    var updatedBlocks = 0;
    blocks.forEach(function (block) {
      if (block.type && (
        block.type === 'inout_digital_write' ||
        block.type === 'inout_digital_write_validator' ||
        block.type === 'inout_digital_read' ||
        block.type === 'inout_digital_read_check' ||
        block.type === 'inout_digital_read_validator' ||
        block.type === 'inout_digital_mode' ||
        block.type === 'inout_PWM_write' ||
        block.type === 'inout_PWM_write_validator' ||
        block.type === 'inout_PWM_write_inline' ||
        block.type === 'inout_analog_read' ||
        block.type === 'inout_analog_read_validator' ||
        block.type === 'inout_analog_read_voltage' ||
        block.type === 'inout_analog_write_validator' ||
        block.type === 'tone' ||
        block.type === 'tone_notime' ||
        block.type === 'notone' ||
        block.type === 'inout_button_wait_il' ||
        block.type === 'inout_button_wait_iph'
      )) {
        // Update PIN field if it exists
        var pinField = block.getField('PIN');
        if (pinField) {
          var currentValue = pinField.getValue();
          var newOptions = [];

          // Determine which pin array to use based on block type
          if (block.type.includes('PWM')) {
            newOptions = currentPwmPins;
          } else if (block.type.includes('analog')) {
            newOptions = currentAnalogPins;
          } else {
            newOptions = currentDigitalPins;
          }

          console.log('Updating block', block.type, 'from', currentValue, 'to options:', newOptions);

          // Update the dropdown options with a sanitizing generator
          pinField.menuGenerator_ = function () {
            var log = function (msg) {
              if (window.electronAPI && window.electronAPI.log) {
                window.electronAPI.log(msg);
              }
            };

            // Create a unique set of options to prevent duplicates
            var uniqueOptions = [];
            var seen = new Set();

            if (newOptions && newOptions.length > 0) {
              for (var i = 0; i < newOptions.length; i++) {
                var opt = newOptions[i];
                // opt is [text, value]
                if (!seen.has(opt[1])) {
                  seen.add(opt[1]);
                  uniqueOptions.push(opt);
                }
              }
            }

            log('Dropdown requested for ' + block.type + '. Raw len: ' + (newOptions ? newOptions.length : 0) + ', Unique len: ' + uniqueOptions.length);
            return uniqueOptions;
          };

          // Try to keep the current value if it's still valid
          var validValue = false;
          for (var i = 0; i < newOptions.length; i++) {
            if (newOptions[i][1] === currentValue) {
              validValue = true;
              break;
            }
          }

          // If current value is not valid, set to first option
          if (!validValue && newOptions.length > 0) {
            pinField.setValue(newOptions[0][1]);
            console.log('Changed value from', currentValue, 'to', newOptions[0][1]);
          }

          // Force the field to re-render
          pinField.render_();
          updatedBlocks++;
        }
      }
    });
    console.log('Updated', updatedBlocks, 'blocks with pin dropdowns');

    // Beginner basic_* blocks: coerce invalid stored pins after board change
    if (typeof window !== 'undefined' && window.BlockIDE_boardPinOptions &&
        typeof window.BlockIDE_boardPinOptions.coerceBasicKitPinsInWorkspace === 'function') {
      try {
        window.BlockIDE_boardPinOptions.coerceBasicKitPinsInWorkspace(Blockly.mainWorkspace);
      } catch (e) {
        console.warn('coerceBasicKitPinsInWorkspace failed', e);
      }
    }

    // Force the workspace to re-render
    if (Blockly.mainWorkspace.render) {
      Blockly.mainWorkspace.render();
    }
  } else {
    console.log('Blockly workspace not available');
  }
}

// Make the function global
window.updatePinConfigurations = updatePinConfigurations;

// Initialize pin configurations
updatePinConfigurations();

// Legacy arrays for backward compatibility (will be replaced with dynamic functions)
var digitalPins = currentDigitalPins;
var pwmPins = currentPwmPins;
var analogPins = currentAnalogPins;

//To support syntax defined in http://arduino.cc/en/Reference/HomePage

Blockly.Blocks.inout_buildin_led = {
  init: function () {
    this.setColour('#FF5722');
    this.setHelpUrl(Blockly.Msg.ARDUINO_INOUT_BUILDIN_LED_HELPURL);
    var dropdownOptions = [["HIGH", "HIGH"], ["LOW", "LOW"]];
    if (Array.isArray(Blockly.Msg.FIELDDROPDOWN) && Array.isArray(Blockly.Msg.FIELDDROPDOWN[0])) {
      dropdownOptions = Blockly.Msg.FIELDDROPDOWN;
    }
    this.appendDummyInput()
      .appendField(Blockly.Msg.ARDUINO_INOUT_BUILDIN_LED_INPUT)
      .appendField(new Blockly.FieldDropdown(dropdownOptions), 'STAT');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip(Blockly.Msg.ARDUINO_INOUT_BUILDIN_LED_TOOLTIP);
  }
};

Blockly.Blocks.inout_pulsein = {
  init: function () {
    this.setColour(Blockly.Blocks.arduino_io.HUE);
    this.setHelpUrl('http://arduino.cc/en/Reference/pulseIn');
    this.appendValueInput("PIN")
      .setCheck("Number")
      .appendField(Blockly.Msg.ARDUINO_PULSEIN);
    var dropdownOptions = [["HIGH", "HIGH"], ["LOW", "LOW"]];
    if (Array.isArray(Blockly.Msg.FIELDDROPDOWN) && Array.isArray(Blockly.Msg.FIELDDROPDOWN[0])) {
      dropdownOptions = Blockly.Msg.FIELDDROPDOWN;
    }
    this.appendDummyInput()
      .appendField(Blockly.Msg.ARDUINO_INOUT_STAT)
      .appendField(new Blockly.FieldDropdown(dropdownOptions), 'STAT');
    this.setInputsInline(true);
    this.setOutput(true, 'Number');
    this.setTooltip('Reads a pulse (either HIGH or LOW) on a pin. For example, if value is HIGH, pulseIn() waits for the pin to go HIGH, starts timing, then waits for the pin to go LOW and stops timing. Returns the length of the pulse in microseconds. Gives up and returns 0 if no pulse starts within a specified time out.');
  }
};

Blockly.Blocks.inout_pulsein_timeout = {
  init: function () {
    this.setColour(Blockly.Blocks.arduino_io.HUE);
    this.setHelpUrl('http://arduino.cc/en/Reference/pulseIn');
    this.appendValueInput("PIN")
      .setCheck("Number")
      .appendField(Blockly.Msg.ARDUINO_PULSEIN);
    var dropdownOptions = [["HIGH", "HIGH"], ["LOW", "LOW"]];
    if (Array.isArray(Blockly.Msg.FIELDDROPDOWN) && Array.isArray(Blockly.Msg.FIELDDROPDOWN[0])) {
      dropdownOptions = Blockly.Msg.FIELDDROPDOWN;
    }
    this.appendDummyInput()
      .appendField(Blockly.Msg.ARDUINO_INOUT_STAT)
      .appendField(new Blockly.FieldDropdown(dropdownOptions), 'STAT');
    this.appendValueInput("TIMEOUT")
      .setCheck("Number")
      .appendField(Blockly.Msg.ARDUINO_PULSEIN_TIMEOUT);
    this.setInputsInline(true);
    this.setOutput(true, 'Number');
    this.setTooltip('Reads a pulse (either HIGH or LOW) on a pin. For example, if value is HIGH, pulseIn() waits for the pin to go HIGH, starts timing, then waits for the pin to go LOW and stops timing. Returns the length of the pulse in microseconds. Gives up and returns 0 if no pulse starts within a specified time out.');
  }
};

Blockly.Blocks.inout_digital_write_validator = {
  init: function () {
    this.setColour(Blockly.Blocks.arduino_io.HUE);
    this.setHelpUrl(Blockly.Msg.ARDUINO_INOUT_DIGITAL_WRITE_HELPURL);
    this.appendDummyInput()
      .appendField(Blockly.Msg.ARDUINO_INOUT_DIGITAL_WRITE_INPUT1)
      .appendField(new Blockly.FieldDropdown(function () { return currentDigitalPins; }), 'PIN');
    var dropdownOptions = [["HIGH", "HIGH"], ["LOW", "LOW"]];
    if (Array.isArray(Blockly.Msg.FIELDDROPDOWN) && Array.isArray(Blockly.Msg.FIELDDROPDOWN[0])) {
      dropdownOptions = Blockly.Msg.FIELDDROPDOWN;
    }
    this.appendDummyInput()
      .appendField(Blockly.Msg.ARDUINO_INOUT_DIGITAL_WRITE_INPUT2)
      .appendField(new Blockly.FieldDropdown(dropdownOptions), 'STAT');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip(Blockly.Msg.ARDUINO_INOUT_DIGITAL_WRITE_TOOLTIP);
  }
};

Blockly.Blocks.inout_digital_write = {
  init: function () {
    this.setColour(Blockly.Blocks.arduino_io.HUE);
    this.setHelpUrl(Blockly.Msg.ARDUINO_INOUT_DIGITAL_WRITE_HELPURL);
    this.appendDummyInput()
      .appendField(Blockly.Msg.ARDUINO_INOUT_DIGITAL_WRITE_INPUT1)
      .appendField(new Blockly.FieldDropdown(function () { return currentDigitalPins; }), 'PIN');
    var dropdownOptions = [["HIGH", "HIGH"], ["LOW", "LOW"]];
    if (Array.isArray(Blockly.Msg.FIELDDROPDOWN) && Array.isArray(Blockly.Msg.FIELDDROPDOWN[0])) {
      dropdownOptions = Blockly.Msg.FIELDDROPDOWN;
    }
    this.appendDummyInput()
      .appendField(Blockly.Msg.ARDUINO_INOUT_DIGITAL_WRITE_INPUT2)
      .appendField(new Blockly.FieldDropdown(dropdownOptions), 'STAT');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip(Blockly.Msg.ARDUINO_INOUT_DIGITAL_WRITE_TOOLTIP);
  }
};

Blockly.Blocks.inout_digital_read = {
  init: function () {
    this.setColour(Blockly.Blocks.arduino_io.HUE);
    this.setHelpUrl(Blockly.Msg.ARDUINO_INOUT_DIGITAL_READ_HELPURL);
    this.appendDummyInput()
      .appendField(Blockly.Msg.ARDUINO_INOUT_DIGITAL_READ_INPUT)
      .appendField(new Blockly.FieldDropdown(function () { return currentDigitalPins; }), 'PIN');
    this.setOutput(true, 'Boolean');
    this.setTooltip(Blockly.Msg.ARDUINO_INOUT_DIGITAL_READ_TOOLTIP);
  }
};

Blockly.Blocks.inout_digital_read_check = {
  init: function () {
    this.setColour(Blockly.Blocks.arduino_io.HUE);
    this.setHelpUrl(Blockly.Msg.ARDUINO_INOUT_DIGITAL_READ_HELPURL);
    this.appendDummyInput()
      .appendField(Blockly.Msg.ARDUINO_INOUT_DIGITAL_READ_INPUT)
      .appendField(new Blockly.FieldDropdown(function () { return currentDigitalPins; }), 'PIN');
    this.appendDummyInput()
      .setAlign(Blockly.ALIGN_RIGHT)
      .appendField(new Blockly.FieldCheckbox("FALSE"), "pullup")
      .appendField(Blockly.Msg.ARDUINO_INOUT_DIGITAL_READ_PULL_UP);
    this.setInputsInline(false);
    this.setOutput(true, "Boolean");
    this.setTooltip(Blockly.Msg.ARDUINO_INOUT_DIGITAL_READ_PULL_UP_TOOLTIP);
  }
};

Blockly.Blocks.inout_digital_read_validator = {
  init: function () {
    this.setColour(Blockly.Blocks.arduino_io.HUE);
    this.setHelpUrl(Blockly.Msg.ARDUINO_INOUT_DIGITAL_READ_HELPURL);
    this.appendDummyInput()
      .appendField(Blockly.Msg.ARDUINO_INOUT_DIGITAL_READ_INPUT)
      .appendField(new Blockly.FieldDropdown(function () { return currentDigitalPins; }), 'PIN');
    this.setInputsInline(true);
    this.setOutput(true, 'Boolean');
    this.setTooltip(Blockly.Msg.ARDUINO_INOUT_DIGITAL_READ_TOOLTIP);
  }
};

Blockly.Blocks['inout_button_wait_il'] = {
  init: function () {
    this.setColour(Blockly.Blocks.arduino_io.HUE);
    this.appendDummyInput()
      .appendField("1 time wait - push")
      //
      .appendField("PIN#")
      .appendField(new Blockly.FieldDropdown(function () { return currentDigitalPins; }), 'PIN');
    this.setTooltip('1 time wait button in setup) - INPUT & wait for HIGH');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setHelpUrl('http://arduino.cc/en/tutorial/button');
  }
};

Blockly.Blocks['inout_button_wait_iph'] = {
  init: function () {
    this.setColour(Blockly.Blocks.arduino_io.HUE);
    this.appendDummyInput()
      .appendField("1 Time wait - pull")
      //
      .appendField("PIN#")
      .appendField(new Blockly.FieldDropdown(function () { return currentDigitalPins; }), 'PIN');
    this.setTooltip('1 time wait button (in setup) - INPUT_PULLUP & wait for LOW)');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setHelpUrl('https://www.pololu.com/docs/0J57/5');
  }
};

Blockly.Blocks.inout_PWM_write_validator = {
  init: function () {
    this.setColour(Blockly.Blocks.arduino_io.HUE);
    this.setHelpUrl(Blockly.Msg.ARDUINO_INOUT_PWM_WRITE_HELPURL);
    this.appendDummyInput()
      .appendField(Blockly.Msg.ARDUINO_INOUT_PWM_WRITE_INPUT1)
      .appendField(new Blockly.FieldDropdown(function () { return currentPwmPins; }), 'PIN');
    this.appendValueInput("NUM", 'Number')
      .setCheck('Number')
      .appendField(Blockly.Msg.ARDUINO_INOUT_PWM_WRITE_INPUT2 || '')
      .appendField(Blockly.Msg.ARDUINO_INOUT_PWM_WRITE_SUFFIX || '%');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip(Blockly.Msg.ARDUINO_INOUT_PWM_WRITE_TOOLTIP);
  }
};

Blockly.Blocks.inout_PWM_write = {
  init: function () {
    this.setColour(Blockly.Blocks.arduino_io.HUE);
    this.setHelpUrl(Blockly.Msg.ARDUINO_INOUT_PWM_WRITE_HELPURL);
    this.appendDummyInput()
      .appendField(Blockly.Msg.ARDUINO_INOUT_PWM_WRITE_INPUT1)
      .appendField(new Blockly.FieldDropdown(function () {
        var log = function (msg) {
          if (window.electronAPI && window.electronAPI.log) {
            window.electronAPI.log(msg);
          }
        };
        log('Dropdown opened for inout_PWM_write. currentPwmPins length: ' + currentPwmPins.length);
        if (currentPwmPins.length > 0) {
          log('First PWM pin: ' + currentPwmPins[0]);
        }
        return currentPwmPins;
      }), 'PIN');
    this.appendValueInput("NUM", 'Number')
      .setCheck('Number')
      .appendField(Blockly.Msg.ARDUINO_INOUT_PWM_WRITE_INPUT2 || '')
      .appendField(Blockly.Msg.ARDUINO_INOUT_PWM_WRITE_SUFFIX || '%');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip(Blockly.Msg.ARDUINO_INOUT_PWM_WRITE_TOOLTIP);
  }
};

Blockly.Blocks.inout_PWM_write_inline = {
  init: function () {
    this.setColour(Blockly.Blocks.arduino_io.HUE);
    this.setHelpUrl(Blockly.Msg.ARDUINO_INOUT_PWM_WRITE_HELPURL);
    this.appendDummyInput()
      .appendField(Blockly.Msg.ARDUINO_INOUT_PWM_WRITE_INPUT1)
      .appendField(new Blockly.FieldDropdown(function () { return currentPwmPins; }), 'PIN')
      .appendField(Blockly.Msg.ARDUINO_INOUT_PWM_WRITE_INPUT2 || '')
      .appendField(new Blockly.FieldNumber(0, 0, 100, 1), 'NUM')
      .appendField(Blockly.Msg.ARDUINO_INOUT_PWM_WRITE_SUFFIX || '%');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip(Blockly.Msg.ARDUINO_INOUT_PWM_WRITE_TOOLTIP);
  }
};

Blockly.Blocks.inout_analog_write_validator = {
  init: function () {
    this.setColour(Blockly.Blocks.arduino_io.HUE);
    this.setHelpUrl(Blockly.Msg.ARDUINO_INOUT_ANALOG_WRITE_HELPURL);
    this.appendDummyInput()
      .appendField(Blockly.Msg.ARDUINO_INOUT_ANALOG_WRITE_INPUT1)
      .appendField(new Blockly.FieldDropdown(function () { return currentDigitalPins; }), 'PIN');
    this.appendValueInput("NUM", 'Number')
      .setCheck('Number')
      .appendField(Blockly.Msg.ARDUINO_INOUT_ANALOG_WRITE_INPUT2);
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip(Blockly.Msg.ARDUINO_INOUT_ANALOG_WRITE_TOOLTIP);
  }
};

Blockly.Blocks.tone = {
  init: function () {
    this.setColour(Blockly.Blocks.arduino_io.HUE);
    this.setHelpUrl(Blockly.Msg.ARDUINO_TONE_HELPURL);
    this.appendDummyInput()
      .appendField(Blockly.Msg.ARDUINO_TONE_INPUT1)
      .appendField(new Blockly.FieldDropdown(function () {
        var log = function (msg) {
          if (window.electronAPI && window.electronAPI.log) {
            window.electronAPI.log(msg);
          }
        };
        log('Dropdown opened for tone. currentDigitalPins length: ' + currentDigitalPins.length);
        if (currentDigitalPins.length > 0) {
          log('First pin: ' + currentDigitalPins[0]);
        }
        return currentDigitalPins;
      }), 'PIN');
    this.appendValueInput("NUM")
      .setAlign(Blockly.ALIGN_RIGHT)
      .appendField(Blockly.Msg.ARDUINO_TONE_INPUT2)
      .setCheck('Number');
    this.appendValueInput("TPS")
      .setAlign(Blockly.ALIGN_RIGHT)
      .appendField(Blockly.Msg.ARDUINO_TONE_INPUT3)
      .setCheck('Number');
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip(Blockly.Msg.ARDUINO_TONE_TOOLTIP);
  }
};

Blockly.Blocks.tone_notime = {
  init: function () {
    this.setColour(Blockly.Blocks.arduino_io.HUE);
    this.setHelpUrl(Blockly.Msg.ARDUINO_TONE_HELPURL);
    this.appendDummyInput()
      .appendField(Blockly.Msg.ARDUINO_TONE_INPUT1)
      .appendField(new Blockly.FieldDropdown(function () {
        var log = function (msg) {
          if (window.electronAPI && window.electronAPI.log) {
            window.electronAPI.log(msg);
          }
        };
        log('Dropdown opened for tone_notime. currentDigitalPins length: ' + currentDigitalPins.length);
        if (currentDigitalPins.length > 0) {
          log('First pin: ' + currentDigitalPins[0]);
        }
        return currentDigitalPins;
      }), 'PIN');
    this.appendValueInput("NUM")
      .setAlign(Blockly.ALIGN_RIGHT)
      .appendField(Blockly.Msg.ARDUINO_TONE_INPUT2)
      .setCheck('Number');
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip(Blockly.Msg.ARDUINO_TONE_TOOLTIP);
  }
};

Blockly.Blocks.notone = {
  init: function () {
    this.setColour(Blockly.Blocks.arduino_io.HUE);
    this.setHelpUrl(Blockly.Msg.ARDUINO_NOTONE_HELPURL);
    this.appendDummyInput()
      .appendField(Blockly.Msg.ARDUINO_NOTONE_INPUT)
      .appendField(new Blockly.FieldDropdown(function () { return currentDigitalPins; }), 'PIN');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip(Blockly.Msg.ARDUINO_NOTONE_TOOLTIP);
  }
};

Blockly.Blocks.inout_analog_read = {
  init: function () {
    this.setColour(Blockly.Blocks.arduino_io.HUE);
    this.setHelpUrl(Blockly.Msg.ARDUINO_INOUT_ANALOG_READ_HELPURL);
    this.appendDummyInput()
      .appendField(Blockly.Msg.ARDUINO_INOUT_ANALOG_READ_INPUT)
      .appendField(new Blockly.FieldDropdown(function () { return currentAnalogPins; }), 'PIN');
    this.setOutput(true, 'Number');
    this.setTooltip(Blockly.Msg.ARDUINO_INOUT_ANALOG_READ_TOOLTIP);
  }
};

Blockly.Blocks.inout_analog_read_validator = {
  init: function () {
    this.setColour(Blockly.Blocks.arduino_io.HUE);
    this.setHelpUrl(Blockly.Msg.ARDUINO_INOUT_ANALOG_READ_HELPURL);
    this.appendDummyInput()
      .appendField(Blockly.Msg.ARDUINO_INOUT_ANALOG_READ_INPUT)
      .appendField(new Blockly.FieldDropdown(function () { return currentAnalogPins; }), 'PIN');
    this.setOutput(true, 'Number');
    this.setTooltip(Blockly.Msg.ARDUINO_INOUT_ANALOG_READ_TOOLTIP);
  }
};

Blockly.Blocks.inout_onoff = {
  init: function () {
    this.setColour(Blockly.Blocks.arduino_io.HUE);
    this.setHelpUrl(Blockly.Msg.ARDUINO_INOUT_ONOFF_HELPURL);
    var dropdownOptions = [["HIGH", "HIGH"], ["LOW", "LOW"]];
    if (Array.isArray(Blockly.Msg.FIELDDROPDOWN) && Array.isArray(Blockly.Msg.FIELDDROPDOWN[0])) {
      dropdownOptions = Blockly.Msg.FIELDDROPDOWN;
    }
    this.appendDummyInput("")
      .appendField(new Blockly.FieldDropdown(dropdownOptions), 'BOOL');
    this.setOutput(true, 'Boolean');
    this.setTooltip(Blockly.Msg.LOGIC_BOOLEAN_TOOLTIP);
  }
};

Blockly.Blocks.inout_angle = {
  init: function () {
    this.appendDummyInput("")
      .appendField(Blockly.Msg.ARDUINO_INOUT_ANGLE)
      .appendField(new Blockly.FieldAngle("90"), "ANGLE");
    this.setOutput(true, "Number");
    this.setColour(Blockly.Blocks.arduino_io.HUE);
    this.setTooltip(Blockly.Msg.ARDUINO_INOUT_ANGLE_TOOLTIP);
    this.setHelpUrl(Blockly.Msg.ARDUINO_INOUT_ANGLE_HELPURL);
  }
};

Blockly.Blocks.inout_attachInterrupt = {
  init: function () {
    this.setColour(Blockly.Blocks.arduino_io.HUE);
    this.setHelpUrl('https://www.arduino.cc/en/Reference/AttachInterrupt');
    var interruptOptions = [['2', '2']];
    if (typeof profile !== 'undefined' && profile.defaultBoard && Array.isArray(profile.defaultBoard.interrupt) && Array.isArray(profile.defaultBoard.interrupt[0])) {
      interruptOptions = profile.defaultBoard.interrupt;
    }
    var modeOptions = [['CHANGE', 'CHANGE']];
    if (Array.isArray(Blockly.Msg.LKL_DROPDOWN) && Array.isArray(Blockly.Msg.LKL_DROPDOWN[0])) {
      modeOptions = Blockly.Msg.LKL_DROPDOWN;
    }
    this.appendDummyInput("")
      .appendField(Blockly.Msg.LKL_ATTACHINTERRUPT_PIN)
      .appendField(new Blockly.FieldDropdown(interruptOptions), 'PIN');
    this.appendDummyInput("")
      .appendField(Blockly.Msg.LKL_MODE)
      .appendField(new Blockly.FieldDropdown(modeOptions), "mode");
    this.appendStatementInput('DO')
      .appendField(Blockly.Msg.CONTROLS_SWITCH_MSG_DO);
    this.setInputsInline(true);
    this.setPreviousStatement(false);
    this.setNextStatement(false);
    this.setTooltip(Blockly.Msg.LKL_TOOLTIP_INOUT_ATTACHINTERRUPT);
  }
};

Blockly.Blocks.inout_detachInterrupt = {
  init: function () {
    this.setColour(Blockly.Blocks.arduino_io.HUE);
    this.setHelpUrl('https://www.arduino.cc/en/Reference/DetachInterrupt');
    var interruptOptions = [['2', '2']];
    if (typeof profile !== 'undefined' && profile.defaultBoard && Array.isArray(profile.defaultBoard.interrupt) && Array.isArray(profile.defaultBoard.interrupt[0])) {
      interruptOptions = profile.defaultBoard.interrupt;
    }
    this.appendDummyInput("")
      .appendField(Blockly.Msg.LKL_DETACHINTERRUPT_PIN)
      .appendField(new Blockly.FieldDropdown(interruptOptions), 'PIN');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setTooltip(Blockly.Msg.LKL_TOOLTIP_INOUT_DETACHINTERRUPT);
  }
};

Blockly.Blocks.inout_pullup = {
  init: function () {
    this.setColour(Blockly.Blocks.arduino_io.HUE);
    this.setHelpUrl("https://www.arduino.cc/en/Tutorial/DigitalPins");
    this.appendValueInput("PIN", 'Number')
      .setCheck('Number')
      .setAlign(Blockly.ALIGN_RIGHT)
      .appendField("valeur de la broche");
    this.setOutput(true, 'Boolean');
    this.setTooltip("");
  }
};

Blockly.Blocks.inout_analog_read_voltage = {
  init: function () {
    this.setColour(Blockly.Blocks.arduino_io.HUE);
    this.setHelpUrl(Blockly.Msg.ARDUINO_INOUT_ANALOG_READ_HELPURL);
    this.appendDummyInput()
      .appendField("Read voltage on pin")
      .appendField(new Blockly.FieldDropdown(function () { return currentAnalogPins; }), 'PIN');
    this.setOutput(true, 'Decimal');
    this.setTooltip("Read analog voltage (0-5V) from analog pin. Returns voltage in volts.");
  }
};