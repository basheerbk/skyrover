/**
 * BlockIDE v2 — Blockly v12 Entry Point
 * Bundled by webpack into dist/blockide_bundle.js
 */

import * as Blockly from 'blockly';
import { FieldColour as PluginFieldColour, registerFieldColour } from '@blockly/field-colour';
import * as boardPinOptions from './board_pin_options.js';

if (typeof window !== 'undefined') {
  window.BlockIDE_boardPinOptions = boardPinOptions;
}
try {
  registerFieldColour();
  console.info('[BlockIDE:Colour] registerFieldColour() executed');
} catch (err) {
  console.error('[BlockIDE:Colour] registerFieldColour() failed', err);
}

try {
  // Force-bind the plugin class on this Blockly instance in case
  // registry registration happened on a different module instance.
  if (!Blockly.FieldColour && PluginFieldColour) {
    Blockly.FieldColour = PluginFieldColour;
    console.warn('[BlockIDE:Colour] FieldColour was missing; bound plugin class directly');
  }
} catch (err) {
  console.error('[BlockIDE:Colour] direct FieldColour binding failed', err);
}

try {
  const registeredClass =
    Blockly.fieldRegistry && typeof Blockly.fieldRegistry.getClass === 'function'
      ? (Blockly.fieldRegistry.getClass('field_colour') ||
         Blockly.fieldRegistry.getClass('field_color'))
      : null;
  const ctorName =
    Blockly.FieldColour && Blockly.FieldColour.name
      ? Blockly.FieldColour.name
      : typeof Blockly.FieldColour;
  const registryName =
    registeredClass && registeredClass.name ? registeredClass.name : typeof registeredClass;
  const runtimeInfo = {
    hasFieldColour: !!Blockly.FieldColour,
    fieldColourCtor: ctorName,
    hasRegistryClass: !!registeredClass,
    registryCtor: registryName,
  };
  console.info('[BlockIDE:Colour] runtime info', runtimeInfo);
  if (typeof window !== 'undefined') {
    window.BlockIDE_colourRuntimeInfo = runtimeInfo;
  }
} catch (err) {
  console.error('[BlockIDE:Colour] runtime inspection failed', err);
}
import { Arduino }         from './arduino_gen.js';
import './compat_shim.js';
import './toolbox_category.js';
import './blocks/arduino_functions.js';

// ── Block Definitions ────────────────────────────────────────────────────────
import './blocks/Blockly_logic.js';
import './blocks/Blockly_math.js';
import './blocks/Blockly_text.js';
import './blocks/BlocklyArduino_variables.js';
import './blocks/BlocklyArduino_array.js';
import './blocks/blockly_array_extra.js';
import './blocks/BlocklyArduino_logic.js';
import './blocks/BlocklyArduino_loops.js';
import './blocks/BlocklyArduino_math.js';
import './blocks/BlocklyArduino_text.js';
import './blocks/arduino_base_arduino_base.js';
import './blocks/arduino_base_arduino_conversion.js';
import './blocks/arduino_base_arduino_serial.js';
import './blocks/arduino_base_arduino_softserial.js';
import './blocks/modes_ota_blocks.js';
import './blocks/adafruit_motorshield_v1.js';
import './blocks/adafruit_motorshield_v2.js';
import './blocks/Adafruit_SSD1306.js';
import './blocks/APDS-9960_RGB_Gesture.js';
import './blocks/arduino_shield.js';
import './blocks/capacitiveSensor.js';
import './blocks/display-oled-128x64-i2c.js';
import './blocks/ds18b20.js';
import './blocks/esp8266.js';
import './blocks/ethernet.js';
import './blocks/HX711.js';
import './blocks/I2C.js';
import './blocks/IR.js';
import './blocks/keypad.js';
import './blocks/lcd_i2c.js';
import './blocks/led-rgb-ws2812b.js';
import './blocks/LoRa.js';
import './blocks/matrix-led-rgb-ws2812.js';
import './blocks/null.js';
import './blocks/RFID.js';
import './blocks/RTC_DS3231.js';
import './blocks/sensor_actuator.js';
import './blocks/servo.js';
import './blocks/Sharp_IR.js';
import './blocks/SPI.js';
import './blocks/stepper_motor.js';
import './blocks/storage.js';
import './blocks/unipolar_stepper_motor.js';
import './blocks/dht.js';
import './blocks/mpu6050.js';
import './blocks/bmp280.js';
import { registerFieldProtractor } from './fields/field_protractor.js';
registerFieldProtractor();
import './blocks/basic_kit.js';

// ── Core Blockly block generators (logic, loops, math, text, variables, arrays) ──
import './generators/blockly_logic.js';
import './generators/blockly_loops.js';
import './generators/blockly_math.js';
import './generators/blockly_text.js';
import './generators/blockly_variables.js';
import './generators/blockly_array.js';
import './generators/arduino_functions.js';

// ── Code Generators ──────────────────────────────────────────────────────────
import './generators/arduino_base.js';
import './generators/arduino_conversion.js';
import './generators/arduino_io.js';
import './generators/arduino_process.js';
import './generators/arduino_serial.js';
import './generators/arduino_softserial.js';
import './generators/arduino_shield.js';
import './generators/ota.js';
import './generators/Adafruit_motorshield_v1.js';
import './generators/Adafruit_motorshield_v2.js';
import './generators/Adafruit_SSD1306.js';
import './generators/APDS-9960_RGB_Gesture.js';
import './generators/capacitiveSensor.js';
import './generators/display-oled-128x64-i2c.js';
import './generators/ds18b20.js';
import './generators/esp8266.js';
import './generators/ethernet.js';
import './generators/HX711.js';
import './generators/I2C.js';
import './generators/IR.js';
import './generators/keypad.js';
import './generators/lcd_i2c.js';
import './generators/ldr_sensor.js';
import './generators/led_blink.js';
import './generators/led-rgb-ws2812b.js';
import './generators/LoRa.js';
import './generators/matrix-led-rgb-ws2812.js';
import './generators/mpu6050.js';
import './generators/null.js';
import './generators/RFID.js';
import './generators/RTC_DS3231.js';
import './generators/sensor_actuator.js';
import './generators/servo.js';
import './generators/Sharp_IR.js';
import './generators/SPI.js';
import './generators/stepper_motor.js';
import './generators/storage.js';
import './generators/unipolar_stepper_motor.js';
import './generators/dht.js';
import './generators/bmp280.js';
import './generators/basic_kit.js';


// ── Theme ────────────────────────────────────────────────────────────────────
export { BlockIDETheme, workspaceConfig } from './theme/blockide_theme.js';

// ── Core exports for use in index.html ──────────────────────────────────────
export { Blockly, Arduino };
export { compileAndFlashEsp32Web, compileEsp32ForWeb } from './esp32_web_flash.js';
export {
  compileAndFlashUnoWeb,
  compileUnoForWeb,
  flashUnoWithWebSerial,
} from './avr_uno_web_flash.js';

/**
 * Initialise the Blockly workspace.
 * Called from index.html after bundle loads.
 *
 * @param {string} divId       - ID of the container div
 * @param {object} toolbox     - Toolbox config object (JSON format)
 * @param {object} [config]    - Optional override workspace config
 * @returns {Blockly.WorkspaceSvg}
 */
export function initWorkspace(divId, toolbox, config = {}) {
  const { workspaceConfig: defaultCfg } = require('./theme/blockide_theme.js');
  const workspace = Blockly.inject(divId, {
    ...defaultCfg,
    toolbox,
    ...config,
  });
  return workspace;
}

/**
 * Generate Arduino code from a workspace.
 * @param {Blockly.WorkspaceSvg} workspace
 * @returns {string} Complete Arduino sketch
 */
export function generateCode(workspace) {
  Arduino.init(workspace);
  const code = Arduino.workspaceToCode(workspace);
  return code;
}
