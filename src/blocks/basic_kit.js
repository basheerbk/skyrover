/**
 * Basic Kit Blocks — child-friendly single-block sensors & actuators for Beginner mode.
 * Each block is fully self-contained: the matching generator injects all required
 * #include, global declarations and setup() code automatically behind the scenes.
 */

import * as Blockly from 'blockly';
import {
    getDigitalPinOptions,
    getAnalogPinOptions,
    getPwmPinOptions,
} from '../board_pin_options.js';
import { FieldProtractor } from '../fields/field_protractor.js';

// ── Colour palette (matches toolbox_category.js) ─────────────────────────────
const SENSOR_COLOR  = '#9B59B6';   // Sensors category purple
const ACTUATOR_COLOR = '#27AE60';  // Actuators category green
const LED_COLOR      = '#FF5722';  // Deep orange — distinct from Logic #FFAB19 and Loop #FFD500
const BUZZER_COLOR   = '#6B8E23';  // Buzzer category (olive green)
const CONTROL_COLOR  = '#5E60CE';  // Controls category indigo
const LCD_DISPLAY_COLOR  = '#2980B9';  // Display (LCD I2C) — matches CAT_DISPLAY
const OLED_DISPLAY_COLOR = '#2980B9';  // Display (OLED) — matches CAT_DISPLAY
const TEXT_LITERAL_COLOR = '#9966FF';  // Beginner Text — matches CAT_TEXT / Blockly texts

/** Pin dropdowns follow `profile.defaultBoard` (see board_pin_options.js). */
function fieldDigitalPin() {
    return new Blockly.FieldDropdown(function () {
        return getDigitalPinOptions();
    });
}

function fieldAnalogPin() {
    return new Blockly.FieldDropdown(function () {
        return getAnalogPinOptions();
    });
}

function fieldPwmPin() {
    return new Blockly.FieldDropdown(function () {
        return getPwmPinOptions();
    });
}

function fieldColourPicker(defaultHex) {
    var hex = defaultHex || '#ff0000';
    if (Blockly.FieldColour) {
        try {
            if (!fieldColourPicker._loggedOk) {
                console.info('[BlockIDE:Colour] NeoPixel using FieldColour', {
                    ctor: Blockly.FieldColour.name || 'anonymous',
                    initial: hex
                });
                fieldColourPicker._loggedOk = true;
            }
        } catch (e) {}
        return new Blockly.FieldColour(hex);
    }
    // Very last fallback — should not happen once plugin/compat wiring is correct.
    try {
        console.warn('[BlockIDE:Colour] NeoPixel fallback to FieldTextInput', { initial: hex });
    } catch (e) {}
    return new Blockly.FieldTextInput(hex);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. basic_ldr_read — "light level on pin [A0]"
//    Returns the raw analog reading (0–1023) from an LDR on the chosen pin.
// ─────────────────────────────────────────────────────────────────────────────
Blockly.Blocks['basic_ldr_read'] = {
    init: function () {
        this.setColour(SENSOR_COLOR);
        this.setTooltip('Read the light level (0 = dark, 1023 = bright) from an LDR sensor.');
        this.setHelpUrl('');
        this.appendDummyInput()
            .appendField('light level on pin')
            .appendField(fieldAnalogPin(), 'PIN');
        this.setOutput(true, 'Number');
        this.setInputsInline(true);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. basic_ir_detect — "object detected on pin [2]?"
//    Returns true when an IR obstacle sensor sees an object (active LOW).
// ─────────────────────────────────────────────────────────────────────────────
Blockly.Blocks['basic_ir_detect'] = {
    init: function () {
        this.setColour(SENSOR_COLOR);
        this.setTooltip('Returns true when the IR sensor detects an object in front of it.');
        this.setHelpUrl('');
        this.appendDummyInput()
            .appendField('object detected on pin')
            .appendField(fieldDigitalPin(), 'PIN');
        this.setOutput(true, 'Boolean');
        this.setInputsInline(true);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2b. Button read — one block: pressed / not pressed on pin (INPUT_PULLUP)
// ─────────────────────────────────────────────────────────────────────────────
Blockly.Blocks['basic_button_state'] = {
    init: function () {
        this.setColour(CONTROL_COLOR);
        this.setHelpUrl('');
        var tip =
            typeof Blockly.Msg.BASIC_BUTTON_STATE_TOOLTIP === 'string' &&
            Blockly.Msg.BASIC_BUTTON_STATE_TOOLTIP.trim()
                ? Blockly.Msg.BASIC_BUTTON_STATE_TOOLTIP
                : 'True when the button matches the choice. Pull-up wiring: pin to GND when pressed (use Add button on pin in setup).';
        this.setTooltip(tip);
        var btn =
            typeof Blockly.Msg.BASIC_BUTTON_STATE_LABEL === 'string' &&
            Blockly.Msg.BASIC_BUTTON_STATE_LABEL.trim()
                ? Blockly.Msg.BASIC_BUTTON_STATE_LABEL
                : 'button';
        var onPin =
            typeof Blockly.Msg.BASIC_BUTTON_STATE_ON_PIN === 'string' &&
            Blockly.Msg.BASIC_BUTTON_STATE_ON_PIN.trim()
                ? Blockly.Msg.BASIC_BUTTON_STATE_ON_PIN
                : 'on pin';
        var optPressed =
            typeof Blockly.Msg.BASIC_BUTTON_STATE_PRESSED === 'string' &&
            Blockly.Msg.BASIC_BUTTON_STATE_PRESSED.trim()
                ? Blockly.Msg.BASIC_BUTTON_STATE_PRESSED
                : 'pressed';
        var optNot =
            typeof Blockly.Msg.BASIC_BUTTON_STATE_NOT_PRESSED === 'string' &&
            Blockly.Msg.BASIC_BUTTON_STATE_NOT_PRESSED.trim()
                ? Blockly.Msg.BASIC_BUTTON_STATE_NOT_PRESSED
                : 'not pressed';
        this.appendDummyInput()
            .appendField(btn)
            .appendField(
                new Blockly.FieldDropdown([
                    [optPressed, 'PRESSED'],
                    [optNot, 'NOT_PRESSED'],
                ]),
                'STATE'
            )
            .appendField(onPin)
            .appendField(fieldDigitalPin(), 'PIN');
        this.setOutput(true, 'Boolean');
        this.setInputsInline(true);
    }
};

// Legacy block types (still load old projects; not in beginner toolbox)
// ─────────────────────────────────────────────────────────────────────────────
// 2c–2d. basic_button_pressed / basic_button_not_pressed — kept for XML compatibility
// ─────────────────────────────────────────────────────────────────────────────
Blockly.Blocks['basic_button_pressed'] = {
    init: function () {
        this.setColour(SENSOR_COLOR);
        this.setHelpUrl('');
        var title =
            typeof Blockly.Msg.BASIC_BUTTON_PRESSED_TITLE === 'string' &&
            Blockly.Msg.BASIC_BUTTON_PRESSED_TITLE.trim()
                ? Blockly.Msg.BASIC_BUTTON_PRESSED_TITLE
                : 'button pressed on pin';
        var tip =
            typeof Blockly.Msg.BASIC_BUTTON_PRESSED_TOOLTIP === 'string' &&
            Blockly.Msg.BASIC_BUTTON_PRESSED_TOOLTIP.trim()
                ? Blockly.Msg.BASIC_BUTTON_PRESSED_TOOLTIP
                : 'True when the button is pressed. Use with Add button on pin (internal pull-up, button connects pin to GND).';
        this.setTooltip(tip);
        this.appendDummyInput()
            .appendField(title)
            .appendField(fieldDigitalPin(), 'PIN');
        this.setOutput(true, 'Boolean');
        this.setInputsInline(true);
    }
};

Blockly.Blocks['basic_button_not_pressed'] = {
    init: function () {
        this.setColour(CONTROL_COLOR);
        this.setHelpUrl('');
        var title =
            typeof Blockly.Msg.BASIC_BUTTON_NOT_PRESSED_TITLE === 'string' &&
            Blockly.Msg.BASIC_BUTTON_NOT_PRESSED_TITLE.trim()
                ? Blockly.Msg.BASIC_BUTTON_NOT_PRESSED_TITLE
                : 'button not pressed on pin';
        var tip =
            typeof Blockly.Msg.BASIC_BUTTON_NOT_PRESSED_TOOLTIP === 'string' &&
            Blockly.Msg.BASIC_BUTTON_NOT_PRESSED_TOOLTIP.trim()
                ? Blockly.Msg.BASIC_BUTTON_NOT_PRESSED_TOOLTIP
                : 'True when the button is up (not pressed). Same wiring as button pressed on pin.';
        this.setTooltip(tip);
        this.appendDummyInput()
            .appendField(title)
            .appendField(fieldDigitalPin(), 'PIN');
        this.setOutput(true, 'Boolean');
        this.setInputsInline(true);
    }
};

Blockly.Blocks['basic_potentiometer_read'] = {
    init: function () {
        this.setColour(CONTROL_COLOR);
        this.setHelpUrl('');
        this.setTooltip(
            stemMsg(
                'BASIC_POTENTIOMETER_READ_TOOLTIP',
                'Read knob value from 0 to 1023.'
            )
        );
        this.appendDummyInput()
            .appendField(stemMsg('BASIC_POTENTIOMETER_READ_TITLE', 'potentiometer value on pin'))
            .appendField(fieldAnalogPin(), 'PIN');
        this.setOutput(true, 'Number');
        this.setInputsInline(true);
    }
};

Blockly.Blocks['basic_potentiometer_setup'] = {
    init: function () {
        this.setColour(CONTROL_COLOR);
        this.setHelpUrl('');
        this.setTooltip(
            stemMsg(
                'BASIC_POTENTIOMETER_SETUP_TOOLTIP',
                'Put in setup. Prepares this analog pin to read knob values.'
            )
        );
        this.appendDummyInput()
            .appendField(stemMsg('BASIC_POTENTIOMETER_SETUP_TITLE', 'Add potentiometer on pin'))
            .appendField(fieldAnalogPin(), 'PIN');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setInputsInline(true);
    }
};

Blockly.Blocks['basic_switch_state'] = {
    init: function () {
        this.setColour(CONTROL_COLOR);
        this.setHelpUrl('');
        this.setTooltip(
            stemMsg(
                'BASIC_SWITCH_STATE_TOOLTIP',
                'True when the switch matches your choice.'
            )
        );
        this.appendDummyInput()
            .appendField(stemMsg('BASIC_SWITCH_STATE_TITLE', 'switch'))
            .appendField(
                new Blockly.FieldDropdown([
                    [stemMsg('BASIC_SWITCH_STATE_ON', 'ON'), 'ON'],
                    [stemMsg('BASIC_SWITCH_STATE_OFF', 'OFF'), 'OFF'],
                ]),
                'STATE'
            )
            .appendField(stemMsg('BASIC_SWITCH_STATE_ON_PIN', 'on pin'))
            .appendField(fieldDigitalPin(), 'PIN');
        this.setOutput(true, 'Boolean');
        this.setInputsInline(true);
    }
};

Blockly.Blocks['basic_switch_setup'] = {
    init: function () {
        this.setColour(CONTROL_COLOR);
        this.setHelpUrl('');
        this.setTooltip(
            stemMsg(
                'BASIC_SWITCH_SETUP_TOOLTIP',
                'Put in setup. Uses INPUT_PULLUP for a switch wired to GND.'
            )
        );
        this.appendDummyInput()
            .appendField(stemMsg('BASIC_SWITCH_SETUP_TITLE', 'Add switch on pin'))
            .appendField(fieldDigitalPin(), 'PIN');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setInputsInline(true);
    }
};

Blockly.Blocks['basic_serial_read_text'] = {
    init: function () {
        this.setColour('#00979D');
        this.setHelpUrl('');
        this.setTooltip(
            stemMsg(
                'BASIC_SERIAL_READ_TEXT_TOOLTIP',
                'Read incoming Serial Monitor text until a new line.'
            )
        );
        this.appendDummyInput()
            .appendField(stemMsg('BASIC_SERIAL_READ_TEXT_TITLE', 'read serial text (string)'));
        this.setOutput(true, 'String');
        this.setInputsInline(true);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. basic_dht_temp — "temperature from DHT11 on pin [2]"
//    Returns temperature in °C. Automatically initialises the DHT library.
// ─────────────────────────────────────────────────────────────────────────────
Blockly.Blocks['basic_dht_temp'] = {
    init: function () {
        this.setColour(SENSOR_COLOR);
        this.setTooltip('Read the temperature in °C from a DHT11 sensor. The sensor must be connected to a digital pin.');
        this.setHelpUrl('');
        this.appendDummyInput()
            .appendField('temperature from DHT11 on pin')
            .appendField(fieldDigitalPin(), 'PIN');
        this.setOutput(true, 'Number');
        this.setInputsInline(true);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. basic_dht_humid — "humidity from DHT11 on pin [2]"
//    Returns humidity in %. Shares DHT init with basic_dht_temp (same keys).
// ─────────────────────────────────────────────────────────────────────────────
Blockly.Blocks['basic_dht_humid'] = {
    init: function () {
        this.setColour(SENSOR_COLOR);
        this.setTooltip('Read the humidity (%) from a DHT11 sensor. The sensor must be connected to a digital pin.');
        this.setHelpUrl('');
        this.appendDummyInput()
            .appendField('humidity from DHT11 on pin')
            .appendField(fieldDigitalPin(), 'PIN');
        this.setOutput(true, 'Number');
        this.setInputsInline(true);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. basic_ultrasonic — "distance  Trig [9]  Echo [10]  cm"
//    Returns distance in centimetres from an HC-SR04 ultrasonic sensor.
// ─────────────────────────────────────────────────────────────────────────────
Blockly.Blocks['basic_ultrasonic'] = {
    init: function () {
        this.setColour(SENSOR_COLOR);
        this.setTooltip('Measure the distance in centimetres using an ultrasonic sensor (HC-SR04).');
        this.setHelpUrl('');
        this.appendDummyInput()
            .appendField('distance  Trig pin')
            .appendField(fieldDigitalPin(), 'TRIG')
            .appendField('Echo pin')
            .appendField(fieldDigitalPin(), 'ECHO')
            .appendField('cm');
        this.setOutput(true, 'Number');
        this.setInputsInline(true);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. basic_servo_move — "move servo on pin [9] to [90] degrees"
//    Statement block. Attaches and moves a servo to the specified angle.
// ─────────────────────────────────────────────────────────────────────────────
Blockly.Blocks['basic_servo_move'] = {
    init: function () {
        this.setColour(ACTUATOR_COLOR);
        var tip =
            typeof Blockly.Msg.BASIC_SERVO_MOVE_TOOLTIP === 'string' &&
            Blockly.Msg.BASIC_SERVO_MOVE_TOOLTIP.trim()
                ? Blockly.Msg.BASIC_SERVO_MOVE_TOOLTIP
                : 'Move a servo to an angle (0–180°). Click the angle number to open the protractor, or plug in a variable or sensor.';
        this.setTooltip(tip);
        this.setHelpUrl('');
        this.appendDummyInput()
            .appendField('move servo on pin')
            .appendField(fieldPwmPin(), 'PIN');
        this.appendValueInput('ANGLE')
            .setCheck('Number')
            .appendField('to angle');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setInputsInline(true);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 6b. basic_servo_angle — output block with protractor field (default shadow for move servo)
// ─────────────────────────────────────────────────────────────────────────────
Blockly.Blocks['basic_servo_angle'] = {
    init: function () {
        this.setColour(ACTUATOR_COLOR);
        this.setHelpUrl('');
        var tip =
            typeof Blockly.Msg.BASIC_SERVO_ANGLE_TOOLTIP === 'string' &&
            Blockly.Msg.BASIC_SERVO_ANGLE_TOOLTIP.trim()
                ? Blockly.Msg.BASIC_SERVO_ANGLE_TOOLTIP
                : 'Drag on the arc or slide to pick 0–180°. Pull this out and plug a number or sensor if you want.';
        this.setTooltip(tip);
        var title =
            typeof Blockly.Msg.BASIC_SERVO_ANGLE_TITLE === 'string' &&
            Blockly.Msg.BASIC_SERVO_ANGLE_TITLE.trim()
                ? Blockly.Msg.BASIC_SERVO_ANGLE_TITLE
                : 'angle';
        this.appendDummyInput().appendField(title).appendField(new FieldProtractor('90'), 'DEG');
        this.setOutput(true, 'Number');
        this.setInputsInline(true);
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// 7a. basic_led_setup — "Add LED on pin" (STEM: visible setup / pinMode)
//     Statement with no loop body — only injects pinMode in setup(). Same setups_
//     key as other LED blocks so it deduplicates.
// ─────────────────────────────────────────────────────────────────────────────
Blockly.Blocks['basic_led_setup'] = {
    init: function () {
        this.setColour(LED_COLOR);
        this.setHelpUrl('');
        var title =
            typeof Blockly.Msg.BASIC_LED_SETUP_TITLE === 'string' &&
            Blockly.Msg.BASIC_LED_SETUP_TITLE.trim()
                ? Blockly.Msg.BASIC_LED_SETUP_TITLE
                : 'Add LED on pin';
        var tip =
            typeof Blockly.Msg.BASIC_LED_SETUP_TOOLTIP === 'string' &&
            Blockly.Msg.BASIC_LED_SETUP_TOOLTIP.trim()
                ? Blockly.Msg.BASIC_LED_SETUP_TOOLTIP
                : 'Put this in the setup part of your program (runs once). It sets the pin as OUTPUT for an LED.';
        this.setTooltip(tip);
        this.appendDummyInput()
            .appendField(title)
            .appendField(fieldDigitalPin(), 'PIN');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setInputsInline(true);
    }
};

// ── STEM tips (no code — remind setup vs loop / how to use numbers) ─────────
function stemMsg(key, fallback) {
    return typeof Blockly.Msg[key] === 'string' && Blockly.Msg[key].trim()
        ? Blockly.Msg[key]
        : fallback;
}

Blockly.Blocks['stem_tip_setup'] = {
    init: function () {
        this.setColour('#FFAB19');
        this.setHelpUrl('');
        this.setTooltip(stemMsg('STEM_TIP_SETUP_TOOLTIP', 'Setup runs once when the board starts.'));
        this.appendDummyInput().appendField(stemMsg('STEM_TIP_SETUP_LABEL', 'Tip: use TOP of Arduino program for setup (once)'));
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
    }
};

Blockly.Blocks['stem_tip_loop'] = {
    init: function () {
        this.setColour('#FFD500');
        this.setHelpUrl('');
        this.setTooltip(stemMsg('STEM_TIP_LOOP_TOOLTIP', 'The loop part runs again and again.'));
        this.appendDummyInput().appendField(stemMsg('STEM_TIP_LOOP_LABEL', 'Tip: use BOTTOM of Arduino program for loop (repeat)'));
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
    }
};

Blockly.Blocks['stem_tip_math'] = {
    init: function () {
        this.setColour('#40BF4A');
        this.setHelpUrl('');
        this.setTooltip(stemMsg('STEM_TIP_MATH_TOOLTIP', 'Plug number blocks into waits, LEDs, sensors, and more.'));
        this.appendDummyInput().appendField(stemMsg('STEM_TIP_MATH_LABEL', 'Tip: drag numbers into other blocks'));
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
    }
};

// ── Generic Arduino pin prep (STEM — visible in setup section) ─────────────
Blockly.Blocks['basic_arduino_output_setup'] = {
    init: function () {
        this.setColour('#00979D');
        this.setHelpUrl('');
        this.setTooltip(
            stemMsg(
                'BASIC_ARDUINO_OUTPUT_SETUP_TOOLTIP',
                'Put in setup. Sets the pin as OUTPUT (LED, buzzer, motor signal, etc.).'
            )
        );
        this.appendDummyInput()
            .appendField(stemMsg('BASIC_ARDUINO_OUTPUT_SETUP_TITLE', 'Set pin as OUTPUT'))
            .appendField(fieldDigitalPin(), 'PIN');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setInputsInline(true);
    }
};

Blockly.Blocks['basic_digital_input_setup'] = {
    init: function () {
        this.setColour('#9B59B6');
        this.setHelpUrl('');
        this.setTooltip(
            stemMsg(
                'BASIC_DIGITAL_INPUT_SETUP_TOOLTIP',
                'Put in setup. INPUT_PULLUP is best for a button wired to GND. Use plain INPUT for some sensors.'
            )
        );
        this.appendDummyInput()
            .appendField(stemMsg('BASIC_DIGITAL_INPUT_SETUP_TITLE', 'Set pin as INPUT'))
            .appendField(fieldDigitalPin(), 'PIN')
            .appendField(stemMsg('BASIC_DIGITAL_INPUT_SETUP_MODE', 'as'))
            .appendField(
                new Blockly.FieldDropdown([
                    [stemMsg('BASIC_DIGITAL_INPUT_PULLUP', 'pull-up (buttons)'), 'INPUT_PULLUP'],
                    [stemMsg('BASIC_DIGITAL_INPUT_PLAIN', 'normal INPUT'), 'INPUT']
                ]),
                'MODE'
            );
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setInputsInline(true);
    }
};

Blockly.Blocks['basic_button_setup'] = {
    init: function () {
        this.setColour(CONTROL_COLOR);
        this.setHelpUrl('');
        this.setTooltip(
            stemMsg(
                'BASIC_BUTTON_SETUP_TOOLTIP',
                'Put in setup. Turns on the internal pull-up for this pin — use when the button connects the pin to GND (reads LOW when pressed). Same as Set pin as INPUT with pull-up mode.'
            )
        );
        this.appendDummyInput()
            .appendField(stemMsg('BASIC_BUTTON_SETUP_TITLE', 'Add button on pin'))
            .appendField(fieldDigitalPin(), 'PIN');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setInputsInline(true);
    }
};

Blockly.Blocks['basic_buzzer_setup'] = {
    init: function () {
        this.setColour(BUZZER_COLOR);
        this.setHelpUrl('');
        this.setTooltip(
            stemMsg(
                'BASIC_BUZZER_SETUP_TOOLTIP',
                'Put in setup. Prepares the buzzer pin as OUTPUT (same as other buzzer blocks if you skip this).'
            )
        );
        this.appendDummyInput()
            .appendField(stemMsg('BASIC_BUZZER_SETUP_TITLE', 'Add buzzer on pin'))
            .appendField(fieldDigitalPin(), 'PIN');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setInputsInline(true);
    }
};

Blockly.Blocks['basic_servo_setup'] = {
    init: function () {
        this.setColour(ACTUATOR_COLOR);
        this.setHelpUrl('');
        this.setTooltip(
            stemMsg(
                'BASIC_SERVO_SETUP_TOOLTIP',
                'Put in setup. Connects the servo on this pin (same as Move servo if you skip this).'
            )
        );
        this.appendDummyInput()
            .appendField(stemMsg('BASIC_SERVO_SETUP_TITLE', 'Add servo on pin'))
            .appendField(fieldPwmPin(), 'PIN');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setInputsInline(true);
    }
};

Blockly.Blocks['basic_i2c_setup'] = {
    init: function () {
        this.setColour(LCD_DISPLAY_COLOR);
        this.setHelpUrl('');
        this.setTooltip(
            stemMsg(
                'BASIC_I2C_SETUP_TOOLTIP',
                'Put in setup once before LCD or OLED blocks. Starts the I2C bus (Wire.begin).'
            )
        );
        this.appendDummyInput().appendField(stemMsg('BASIC_I2C_SETUP_TITLE', 'Start I2C bus (for LCD / OLED)'));
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
    }
};

// ── Sensor setup (STEM) — same generator keys as read blocks where possible ──
Blockly.Blocks['basic_ldr_setup'] = {
    init: function () {
        this.setColour(SENSOR_COLOR);
        this.setHelpUrl('');
        this.setTooltip(
            stemMsg(
                'BASIC_LDR_SETUP_TOOLTIP',
                'Put in setup. Sets the analog pin as INPUT for a light-dependent resistor (LDR). Light level block also configures the pin if you skip this.'
            )
        );
        this.appendDummyInput()
            .appendField(stemMsg('BASIC_LDR_SETUP_TITLE', 'Add LDR sensor on pin'))
            .appendField(fieldAnalogPin(), 'PIN');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setInputsInline(true);
    }
};

Blockly.Blocks['basic_ir_setup'] = {
    init: function () {
        this.setColour(SENSOR_COLOR);
        this.setHelpUrl('');
        this.setTooltip(
            stemMsg(
                'BASIC_IR_SETUP_TOOLTIP',
                'Put in setup. Sets the pin as INPUT for an IR obstacle sensor. Object detected block does the same if you skip this.'
            )
        );
        this.appendDummyInput()
            .appendField(stemMsg('BASIC_IR_SETUP_TITLE', 'Add IR sensor on pin'))
            .appendField(fieldDigitalPin(), 'PIN');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setInputsInline(true);
    }
};

Blockly.Blocks['basic_dht_setup'] = {
    init: function () {
        this.setColour(SENSOR_COLOR);
        this.setHelpUrl('');
        this.setTooltip(
            stemMsg(
                'BASIC_DHT_SETUP_TOOLTIP',
                'Put in setup. Starts the DHT11 on this pin. Temperature and humidity blocks also start the sensor if you skip this.'
            )
        );
        this.appendDummyInput()
            .appendField(stemMsg('BASIC_DHT_SETUP_TITLE', 'Add DHT11 sensor on pin'))
            .appendField(fieldDigitalPin(), 'PIN');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setInputsInline(true);
    }
};

Blockly.Blocks['basic_ultrasonic_setup'] = {
    init: function () {
        this.setColour(SENSOR_COLOR);
        this.setHelpUrl('');
        this.setTooltip(
            stemMsg(
                'BASIC_ULTRASONIC_SETUP_TOOLTIP',
                'Put in setup. Prepares Trig (OUTPUT) and Echo (INPUT) and adds the distance helper. Distance block does the same if you skip this.'
            )
        );
        this.appendDummyInput()
            .appendField(stemMsg('BASIC_ULTRASONIC_SETUP_TITLE', 'Add ultrasonic sensor'))
            .appendField(stemMsg('BASIC_ULTRASONIC_TRIG_LABEL', 'Trig pin'))
            .appendField(fieldDigitalPin(), 'TRIG')
            .appendField(stemMsg('BASIC_ULTRASONIC_ECHO_LABEL', 'Echo pin'))
            .appendField(fieldDigitalPin(), 'ECHO');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setInputsInline(true);
    }
};

Blockly.Blocks['basic_joystick_setup'] = {
    init: function () {
        this.setColour(CONTROL_COLOR);
        this.setHelpUrl('');
        this.setTooltip(
            stemMsg(
                'BASIC_JOYSTICK_SETUP_TOOLTIP',
                'Put in setup. Prepares joystick X/Y analog inputs and the button pin with pull-up.'
            )
        );
        this.appendDummyInput()
            .appendField(stemMsg('BASIC_JOYSTICK_SETUP_TITLE', 'Add joystick'))
            .appendField(stemMsg('BASIC_JOYSTICK_X_LABEL', 'X pin'))
            .appendField(fieldAnalogPin(), 'XPIN')
            .appendField(stemMsg('BASIC_JOYSTICK_Y_LABEL', 'Y pin'))
            .appendField(fieldAnalogPin(), 'YPIN')
            .appendField(stemMsg('BASIC_JOYSTICK_BTN_LABEL', 'button pin'))
            .appendField(fieldDigitalPin(), 'BPIN');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setInputsInline(true);
    }
};

Blockly.Blocks['basic_joystick_x'] = {
    init: function () {
        this.setColour(CONTROL_COLOR);
        this.setHelpUrl('');
        this.setTooltip(
            stemMsg(
                'BASIC_JOYSTICK_X_TOOLTIP',
                'Read joystick X axis (0-1023).'
            )
        );
        this.appendDummyInput()
            .appendField(stemMsg('BASIC_JOYSTICK_X_TITLE', 'joystick X on pin'))
            .appendField(fieldAnalogPin(), 'PIN');
        this.setOutput(true, 'Number');
        this.setInputsInline(true);
    }
};

Blockly.Blocks['basic_joystick_y'] = {
    init: function () {
        this.setColour(CONTROL_COLOR);
        this.setHelpUrl('');
        this.setTooltip(
            stemMsg(
                'BASIC_JOYSTICK_Y_TOOLTIP',
                'Read joystick Y axis (0-1023).'
            )
        );
        this.appendDummyInput()
            .appendField(stemMsg('BASIC_JOYSTICK_Y_TITLE', 'joystick Y on pin'))
            .appendField(fieldAnalogPin(), 'PIN');
        this.setOutput(true, 'Number');
        this.setInputsInline(true);
    }
};

Blockly.Blocks['basic_joystick_button'] = {
    init: function () {
        this.setColour(CONTROL_COLOR);
        this.setHelpUrl('');
        this.setTooltip(
            stemMsg(
                'BASIC_JOYSTICK_BUTTON_TOOLTIP',
                'True when joystick button is pressed (button pin uses pull-up, so pressed = LOW).'
            )
        );
        this.appendDummyInput()
            .appendField(stemMsg('BASIC_JOYSTICK_BUTTON_TITLE', 'joystick button pressed on pin'))
            .appendField(fieldDigitalPin(), 'PIN');
        this.setOutput(true, 'Boolean');
        this.setInputsInline(true);
    }
};

Blockly.Blocks['basic_neopixel_single'] = {
    init: function () {
        this.setColour(LED_COLOR);
        this.setHelpUrl('');
        this.setTooltip(
            stemMsg(
                'BASIC_NEOPIXEL_SINGLE_TOOLTIP',
                'Set one NeoPixel LED (index 0) on this pin to the selected colour.'
            )
        );
        this.appendDummyInput()
            .appendField(stemMsg('BASIC_NEOPIXEL_SINGLE_TITLE', 'Add NeoPixel on pin'))
            .appendField(fieldDigitalPin(), 'PIN')
            .appendField(stemMsg('BASIC_NEOPIXEL_COLOUR_LABEL', 'with colour'))
            .appendField(fieldColourPicker('#ff0000'), 'COLOR');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setInputsInline(true);
    }
};

Blockly.Blocks['basic_neopixel_strip_setup'] = {
    init: function () {
        this.setColour(LED_COLOR);
        this.setHelpUrl('');
        this.setTooltip(
            stemMsg(
                'BASIC_NEOPIXEL_STRIP_SETUP_TOOLTIP',
                'Prepare a NeoPixel strip on this pin with this number of LEDs (put in setup).'
            )
        );
        this.appendDummyInput()
            .appendField(stemMsg('BASIC_NEOPIXEL_STRIP_SETUP_TITLE', 'Add NeoPixel strip on pin'))
            .appendField(fieldDigitalPin(), 'PIN')
            .appendField(stemMsg('BASIC_NEOPIXEL_STRIP_COUNT_LABEL', 'with'));
        this.appendDummyInput()
            .appendField(new Blockly.FieldNumber(8, 1, 300, 1), 'COUNT')
            .appendField(stemMsg('BASIC_NEOPIXEL_STRIP_COUNT_SUFFIX', 'LEDs'));
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setInputsInline(true);
    }
};

Blockly.Blocks['basic_neopixel_set_brightness'] = {
    init: function () {
        this.setColour(LED_COLOR);
        this.setHelpUrl('');
        this.setTooltip(
            stemMsg(
                'BASIC_NEOPIXEL_SET_BRIGHTNESS_TOOLTIP',
                'Set NeoPixel strip brightness (0 = off, 255 = brightest).'
            )
        );
        this.appendDummyInput()
            .appendField(stemMsg('BASIC_NEOPIXEL_SET_BRIGHTNESS_TITLE', 'NeoPixel brightness on pin'))
            .appendField(fieldDigitalPin(), 'PIN');
        this.appendDummyInput()
            .appendField(stemMsg('BASIC_NEOPIXEL_SET_BRIGHTNESS_LABEL', 'level'))
            .appendField(new Blockly.FieldNumber(64, 0, 255, 1), 'BRIGHTNESS');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setInputsInline(true);
    }
};

Blockly.Blocks['basic_neopixel_clear'] = {
    init: function () {
        this.setColour(LED_COLOR);
        this.setHelpUrl('');
        this.setTooltip(
            stemMsg(
                'BASIC_NEOPIXEL_CLEAR_TOOLTIP',
                'Turn off all NeoPixels on this pin.'
            )
        );
        this.appendDummyInput()
            .appendField(stemMsg('BASIC_NEOPIXEL_CLEAR_TITLE', 'Turn off all NeoPixels on pin'))
            .appendField(fieldDigitalPin(), 'PIN');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setInputsInline(true);
    }
};

Blockly.Blocks['basic_neopixel_fill'] = {
    init: function () {
        this.setColour(LED_COLOR);
        this.setHelpUrl('');
        this.setTooltip(
            stemMsg(
                'BASIC_NEOPIXEL_FILL_TOOLTIP',
                'Set every LED in this NeoPixel strip to one colour.'
            )
        );
        this.appendDummyInput()
            .appendField(stemMsg('BASIC_NEOPIXEL_FILL_TITLE', 'Fill NeoPixel strip on pin'))
            .appendField(fieldDigitalPin(), 'PIN')
            .appendField(stemMsg('BASIC_NEOPIXEL_FILL_WITH', 'with'))
            .appendField(fieldColourPicker('#00ff66'), 'COLOR');
        this.appendDummyInput()
            .appendField(stemMsg('BASIC_NEOPIXEL_FILL_COUNT_LABEL', 'LED count'))
            .appendField(new Blockly.FieldNumber(8, 1, 300, 1), 'COUNT');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setInputsInline(true);
    }
};

Blockly.Blocks['basic_neopixel_show'] = {
    init: function () {
        this.setColour(LED_COLOR);
        this.setHelpUrl('');
        this.setTooltip(
            stemMsg(
                'BASIC_NEOPIXEL_SHOW_TOOLTIP',
                'Show the latest NeoPixel changes now.'
            )
        );
        this.appendDummyInput()
            .appendField(stemMsg('BASIC_NEOPIXEL_SHOW_TITLE', 'Show NeoPixel updates on pin'))
            .appendField(fieldDigitalPin(), 'PIN');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setInputsInline(true);
    }
};

Blockly.Blocks['basic_neopixel_rainbow_cycle'] = {
    init: function () {
        this.setColour(LED_COLOR);
        this.setHelpUrl('');
        this.setTooltip(
            stemMsg(
                'BASIC_NEOPIXEL_RAINBOW_TOOLTIP',
                'Play a rainbow animation across the whole strip.'
            )
        );
        this.appendDummyInput()
            .appendField(stemMsg('BASIC_NEOPIXEL_RAINBOW_TITLE', 'Rainbow on pin'))
            .appendField(fieldDigitalPin(), 'PIN');
        this.appendDummyInput()
            .appendField(stemMsg('BASIC_NEOPIXEL_RAINBOW_COUNT_LABEL', 'LED count'))
            .appendField(new Blockly.FieldNumber(8, 1, 300, 1), 'COUNT')
            .appendField(stemMsg('BASIC_NEOPIXEL_RAINBOW_DELAY_LABEL', 'speed ms'))
            .appendField(new Blockly.FieldNumber(20, 1, 500, 1), 'DELAY')
            .appendField(stemMsg('BASIC_NEOPIXEL_RAINBOW_CYCLES_LABEL', 'cycles'))
            .appendField(new Blockly.FieldNumber(1, 1, 20, 1), 'CYCLES');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setInputsInline(true);
    }
};

Blockly.Blocks['basic_neopixel_color_wipe'] = {
    init: function () {
        this.setColour(LED_COLOR);
        this.setHelpUrl('');
        this.setTooltip(
            stemMsg(
                'BASIC_NEOPIXEL_COLOR_WIPE_TOOLTIP',
                'Light LEDs one-by-one with the selected colour.'
            )
        );
        this.appendDummyInput()
            .appendField(stemMsg('BASIC_NEOPIXEL_COLOR_WIPE_TITLE', 'Color wipe on pin'))
            .appendField(fieldDigitalPin(), 'PIN')
            .appendField(stemMsg('BASIC_NEOPIXEL_FILL_WITH', 'with'))
            .appendField(fieldColourPicker('#ff6600'), 'COLOR');
        this.appendDummyInput()
            .appendField(stemMsg('BASIC_NEOPIXEL_FILL_COUNT_LABEL', 'LED count'))
            .appendField(new Blockly.FieldNumber(8, 1, 300, 1), 'COUNT')
            .appendField(stemMsg('BASIC_NEOPIXEL_COLOR_WIPE_DELAY_LABEL', 'step ms'))
            .appendField(new Blockly.FieldNumber(60, 1, 1000, 1), 'DELAY');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setInputsInline(true);
    }
};

Blockly.Blocks['basic_neopixel_theater_chase'] = {
    init: function () {
        this.setColour(LED_COLOR);
        this.setHelpUrl('');
        this.setTooltip(
            stemMsg(
                'BASIC_NEOPIXEL_THEATER_CHASE_TOOLTIP',
                'Make a chasing theater-light pattern.'
            )
        );
        this.appendDummyInput()
            .appendField(stemMsg('BASIC_NEOPIXEL_THEATER_CHASE_TITLE', 'Theater chase on pin'))
            .appendField(fieldDigitalPin(), 'PIN')
            .appendField(stemMsg('BASIC_NEOPIXEL_FILL_WITH', 'with'))
            .appendField(fieldColourPicker('#ffffff'), 'COLOR');
        this.appendDummyInput()
            .appendField(stemMsg('BASIC_NEOPIXEL_FILL_COUNT_LABEL', 'LED count'))
            .appendField(new Blockly.FieldNumber(8, 1, 300, 1), 'COUNT')
            .appendField(stemMsg('BASIC_NEOPIXEL_THEATER_CHASE_DELAY_LABEL', 'step ms'))
            .appendField(new Blockly.FieldNumber(80, 1, 1000, 1), 'DELAY')
            .appendField(stemMsg('BASIC_NEOPIXEL_THEATER_CHASE_ROUNDS_LABEL', 'rounds'))
            .appendField(new Blockly.FieldNumber(5, 1, 50, 1), 'ROUNDS');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setInputsInline(true);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. basic_led_pin — "Turn LED ON/OFF on pin"
// ─────────────────────────────────────────────────────────────────────────────
Blockly.Blocks['basic_led_pin'] = {
    init: function () {
        this.setColour(LED_COLOR);
        this.setTooltip('Turn an LED connected to this pin fully on or off.');
        this.setHelpUrl('');
        this.appendDummyInput()
            .appendField('Turn LED')
            .appendField(new Blockly.FieldDropdown([['on', 'HIGH'], ['off', 'LOW']]), 'STAT')
            .appendField('on pin')
            .appendField(fieldDigitalPin(), 'PIN');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setInputsInline(true);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 8. basic_led_blink_pattern — asymmetric blink on any digital pin
// ─────────────────────────────────────────────────────────────────────────────
Blockly.Blocks['basic_led_blink_pattern'] = {
    init: function () {
        this.setColour(LED_COLOR);
        this.setTooltip('Blink an LED: how long it stays on, how long off, and which pin.');
        this.setHelpUrl('');
        this.appendDummyInput()
            .appendField('Blink LED on pin')
            .appendField(fieldDigitalPin(), 'PIN');
        this.appendValueInput('ON_MS')
            .setCheck('Number')
            .appendField('on for (ms)');
        this.appendValueInput('OFF_MS')
            .setCheck('Number')
            .appendField('off for (ms)');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setInputsInline(false);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 9. basic_led_brightness — PWM brightness (%) for beginner-friendly input
// ─────────────────────────────────────────────────────────────────────────────
Blockly.Blocks['basic_led_brightness'] = {
    init: function () {
        this.setColour(LED_COLOR);
        this.setTooltip('Set LED brightness in percent (0% = off, 100% = brightest). Use a PWM pin.');
        this.setHelpUrl('');
        this.appendDummyInput()
            .appendField('LED brightness on pin')
            .appendField(fieldPwmPin(), 'PIN');
        this.appendValueInput('NUM')
            .setCheck('Number')
            .appendField('to');
        this.appendDummyInput()
            .appendField('%');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setInputsInline(true);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 10. basic_active_buzzer — ON/OFF active buzzer (digital pin)
// ─────────────────────────────────────────────────────────────────────────────
Blockly.Blocks['basic_active_buzzer'] = {
    init: function () {
        this.setColour(BUZZER_COLOR);
        this.setTooltip('Active buzzer: turn sound on or off with HIGH/LOW on this pin.');
        this.setHelpUrl('');
        this.appendDummyInput()
            .appendField('active buzzer')
            .appendField(new Blockly.FieldDropdown([['on', 'HIGH'], ['off', 'LOW']]), 'STAT')
            .appendField('on pin')
            .appendField(fieldDigitalPin(), 'PIN');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setInputsInline(true);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 11. basic_buzzer_beep — one on/off beep cycle (active buzzer)
// ─────────────────────────────────────────────────────────────────────────────
Blockly.Blocks['basic_buzzer_beep'] = {
    init: function () {
        this.setColour(BUZZER_COLOR);
        this.setTooltip('Beep once: buzzer on, wait, buzzer off, wait. Put inside a Loop to repeat.');
        this.setHelpUrl('');
        this.appendDummyInput()
            .appendField('beep on pin')
            .appendField(fieldDigitalPin(), 'PIN');
        this.appendValueInput('ON_MS')
            .setCheck('Number')
            .appendField('on for');
        this.appendDummyInput()
            .appendField('ms');
        this.appendValueInput('OFF_MS')
            .setCheck('Number')
            .appendField('off for');
        this.appendDummyInput()
            .appendField('ms');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setInputsInline(true);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 12. basic_passive_tone — play a tone (Hz) for N ms on a pin
// ─────────────────────────────────────────────────────────────────────────────
Blockly.Blocks['basic_passive_tone'] = {
    init: function () {
        this.setColour(BUZZER_COLOR);
        this.setTooltip('Passive buzzer: play this pitch (Hz) for a short time. Use a PWM-capable pin if possible.');
        this.setHelpUrl('');
        this.appendDummyInput()
            .appendField('passive buzzer play on pin')
            .appendField(fieldDigitalPin(), 'PIN');
        this.appendValueInput('FREQ')
            .setCheck('Number')
            .appendField('Hz');
        this.appendValueInput('DUR')
            .setCheck('Number')
            .appendField('for');
        this.appendDummyInput()
            .appendField('ms');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setInputsInline(true);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 13. basic_passive_stop — stop tone on pin
// ─────────────────────────────────────────────────────────────────────────────
Blockly.Blocks['basic_passive_stop'] = {
    init: function () {
        this.setColour(BUZZER_COLOR);
        this.setTooltip('Stop any tone playing on this pin (passive buzzer).');
        this.setHelpUrl('');
        this.appendDummyInput()
            .appendField('stop passive buzzer on pin')
            .appendField(fieldDigitalPin(), 'PIN');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setInputsInline(true);
    }
};

Blockly.Blocks['basic_lcd_setup'] = {
    init: function () {
        this.setColour(LCD_DISPLAY_COLOR);
        this.setTooltip('Run once first. 16×2 LCD on I2C (SDA/SCL). Common addresses 0x27 or 0x3F.');
        this.setHelpUrl('');
        this.appendDummyInput()
            .appendField('set up LCD 16×2 (I2C) address')
            .appendField(new Blockly.FieldDropdown([
                ['0x27', '0x27'],
                ['0x3F', '0x3F'],
            ]), 'ADDR');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setInputsInline(true);
    }
};

Blockly.Blocks['basic_lcd_show_line'] = {
    init: function () {
        this.setColour(LCD_DISPLAY_COLOR);
        this.setTooltip('Show text on the top or bottom row (after set up LCD).');
        this.setHelpUrl('');
        this.appendDummyInput()
            .appendField('LCD line')
            .appendField(new Blockly.FieldDropdown([
                ['1 (top)', '1'],
                ['2 (bottom)', '2'],
            ]), 'LINE');
        this.appendValueInput('TEXT')
            .appendField('text');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setInputsInline(true);
    }
};

Blockly.Blocks['basic_oled_screen_4lines'] = {
    init: function () {
        this.setColour(OLED_DISPLAY_COLOR);
        this.setTooltip('Draw up to 4 lines on the OLED at once. Use after "Add OLED display (setup)".');
        this.setHelpUrl('');
        this.appendDummyInput().appendField('OLED show 4 lines');
        this.appendValueInput('L1').appendField('Line 1');
        this.appendValueInput('L2').appendField('Line 2');
        this.appendValueInput('L3').appendField('Line 3');
        this.appendValueInput('L4').appendField('Line 4');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setInputsInline(false);
    }
};

// ── Beginner Text literals (string vs char) — same codegen as `text` / `char` ─
function basicTextQuoteImage_(open, block) {
    var file =
        open === block.RTL
            ? 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAKCAQAAAAqJXdxAAAAqUlEQVQI1z3KvUpCcRiA8ef9E4JNHhI0aFEacm1o0BsI0Slx8wa8gLauoDnoBhq7DcfWhggONDmJJgqCPA7neJ7p934EOOKOnM8Q7PDElo/4x4lFb2DmuUjcUzS3URnGib9qaPNbuXvBO3sGPHJDRG6fGVdMSeWDP2q99FQdFrz26Gu5Tq7dFMzUvbXy8KXeAj57cOklgA+u1B5AoslLtGIHQMaCVnwDnADZIFIrXsoXrgAAAABJRU5ErkJggg=='
            : 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAKCAQAAAAqJXdxAAAAn0lEQVQI1z3OMa5BURSF4f/cQhAKjUQhuQmFNwGJEUi0RKN5rU7FHKhpjEH3TEMtkdBSCY1EIv8r7nFX9e29V7EBAOvu7RPjwmWGH/VuF8CyN9/OAdvqIXYLvtRaNjx9mMTDyo+NjAN1HNcl9ZQ5oQMM3dgDUqDo1l8DzvwmtZN7mnD+PkmLa+4mhrxVA9fRowBWmVBhFy5gYEjKMfz9AylsaRRgGzvZAAAAAElFTkSuQmCC';
    return new Blockly.FieldImage(file, 12, 12, '"');
}

Blockly.Blocks['basic_text_string'] = {
    init: function () {
        this.setColour(TEXT_LITERAL_COLOR);
        this.setHelpUrl('');
        this.appendDummyInput()
            .appendField('string')
            .appendField(basicTextQuoteImage_(true, this))
            .appendField(new Blockly.FieldTextInput(''), 'TEXT')
            .appendField(basicTextQuoteImage_(false, this));
        this.setOutput(true, 'String');
        this.setTooltip('Text in double quotes — a String for Serial.print, LCD, or OLED.');
    },
};

Blockly.Blocks['basic_text_char'] = {
    init: function () {
        this.setColour(TEXT_LITERAL_COLOR);
        this.setHelpUrl('');
        var charValidator = function (t) {
            var s = typeof t === 'string' ? t : 'A';
            if (/^\d{1,3}$/.test(s)) {
                var n = parseInt(s, 10);
                if (!isFinite(n) || n < 0) n = 0;
                if (n > 255) n = 255;
                return String(n);
            }
            return s.length > 1 ? s.charAt(0) : s || 'A';
        };
        this.appendDummyInput()
            .appendField('char')
            .appendField('\'')
            .appendField(new Blockly.FieldTextInput('A', charValidator), 'CHAR')
            .appendField('\'');
        this.setOutput(true);
        this.getBlockType = function () {
            return Blockly.Types && Blockly.Types.CHARACTER
                ? Blockly.Types.CHARACTER
                : 'String';
        };
        this.setTooltip('One character in single quotes — good for Serial.write or single letters.');
    },
};
