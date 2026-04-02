/**
 * Basic Kit Generators — code generators for the child-friendly basic_kit blocks.
 *
 * Each generator uses the keyed-dict injection pattern:
 *   Blockly.Arduino.includes_['key']     → #include lines  (top of file)
 *   Blockly.Arduino.definitions_['key']  → global vars/objects
 *   Blockly.Arduino.setups_['key']       → void setup() { ... }
 *
 * The string key deduplicates: placing two DHT-temp blocks on the SAME pin
 * writes to the same key, so only one global object and one begin() call are emitted.
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. basic_ldr_read — analogRead(pin)
//    Injects pinMode(INPUT) for this analog pin (same key as basic_ldr_setup).
// ─────────────────────────────────────────────────────────────────────────────
Blockly.Arduino['basic_ldr_read'] = function (block) {
    var pin = block.getFieldValue('PIN') || 'A0';
    Blockly.Arduino.setups_['basic_ldr_input_' + pin] = 'pinMode(' + pin + ', INPUT);';
    var code = 'analogRead(' + pin + ')';
    return [code, Blockly.Arduino.ORDER_ATOMIC];
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. basic_ir_detect — digitalRead(pin) == LOW
//    Most common IR obstacle sensors pull the output LOW when detecting.
//    Injects a single pinMode in setup.
// ─────────────────────────────────────────────────────────────────────────────
Blockly.Arduino['basic_ir_detect'] = function (block) {
    var pin = block.getFieldValue('PIN') || '2';
    Blockly.Arduino.setups_['basic_ir_' + pin] = 'pinMode(' + pin + ', INPUT);';
    // Already wrapped in (), so ORDER_ATOMIC prevents double-wrapping when used
    // inside logic_compare or other equality-precedence parent blocks.
    var code = '(digitalRead(' + pin + ') == LOW)';
    return [code, Blockly.Arduino.ORDER_ATOMIC];
};

// ─────────────────────────────────────────────────────────────────────────────
// 2b. Button pressed / not pressed on pin (unified block)
// ─────────────────────────────────────────────────────────────────────────────
Blockly.Arduino['basic_button_state'] = function (block) {
    var pin = block.getFieldValue('PIN') || '2';
    var state = block.getFieldValue('STATE') || 'PRESSED';
    Blockly.Arduino.setups_['setup_input_' + pin] = 'pinMode(' + pin + ', INPUT_PULLUP);';
    var code =
        state === 'NOT_PRESSED'
            ? '(digitalRead(' + pin + ') == HIGH)'
            : '(digitalRead(' + pin + ') == LOW)';
    return [code, Blockly.Arduino.ORDER_ATOMIC];
};

// Legacy generators (old saves)
// ─────────────────────────────────────────────────────────────────────────────
Blockly.Arduino['basic_button_pressed'] = function (block) {
    var pin = block.getFieldValue('PIN') || '2';
    Blockly.Arduino.setups_['setup_input_' + pin] = 'pinMode(' + pin + ', INPUT_PULLUP);';
    var code = '(digitalRead(' + pin + ') == LOW)';
    return [code, Blockly.Arduino.ORDER_ATOMIC];
};

Blockly.Arduino['basic_button_not_pressed'] = function (block) {
    var pin = block.getFieldValue('PIN') || '2';
    Blockly.Arduino.setups_['setup_input_' + pin] = 'pinMode(' + pin + ', INPUT_PULLUP);';
    var code = '(digitalRead(' + pin + ') == HIGH)';
    return [code, Blockly.Arduino.ORDER_ATOMIC];
};

Blockly.Arduino['basic_potentiometer_read'] = function (block) {
    var pin = block.getFieldValue('PIN') || 'A0';
    Blockly.Arduino.setups_['basic_pot_input_' + pin] = 'pinMode(' + pin + ', INPUT);';
    return ['analogRead(' + pin + ')', Blockly.Arduino.ORDER_ATOMIC];
};

Blockly.Arduino['basic_potentiometer_setup'] = function (block) {
    var pin = block.getFieldValue('PIN') || 'A0';
    Blockly.Arduino.setups_['basic_pot_input_' + pin] = 'pinMode(' + pin + ', INPUT);';
    return '';
};

Blockly.Arduino['basic_switch_state'] = function (block) {
    var pin = block.getFieldValue('PIN') || '2';
    var state = block.getFieldValue('STATE') || 'ON';
    Blockly.Arduino.setups_['basic_switch_pullup_' + pin] = 'pinMode(' + pin + ', INPUT_PULLUP);';
    var code =
        state === 'OFF'
            ? '(digitalRead(' + pin + ') == HIGH)'
            : '(digitalRead(' + pin + ') == LOW)';
    return [code, Blockly.Arduino.ORDER_ATOMIC];
};

Blockly.Arduino['basic_switch_setup'] = function (block) {
    var pin = block.getFieldValue('PIN') || '2';
    Blockly.Arduino.setups_['basic_switch_pullup_' + pin] = 'pinMode(' + pin + ', INPUT_PULLUP);';
    return '';
};

Blockly.Arduino['basic_serial_read_text'] = function () {
    if (!Blockly.Arduino.setups_['serial_begin']) {
        Blockly.Arduino.setups_['serial_begin'] = 'Serial.begin(9600);';
    }
    return ['Serial.readStringUntil(\'\\n\')', Blockly.Arduino.ORDER_ATOMIC];
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. basic_dht_temp — dht.readTemperature()
//    Injects full DHT11 initialisation (include + global object + begin).
//    Key is pin-specific so two sensors on different pins each get their own object.
// ─────────────────────────────────────────────────────────────────────────────
Blockly.Arduino['basic_dht_temp'] = function (block) {
    var pin  = block.getFieldValue('PIN') || '2';
    var obj  = 'basic_dht_' + pin;
    Blockly.Arduino.includes_['dht']              = '#include <DHT.h>';
    Blockly.Arduino.definitions_[obj]             = 'DHT ' + obj + '(' + pin + ', DHT11);';
    Blockly.Arduino.setups_['basic_dht_begin_' + pin] = obj + '.begin();';
    var code = obj + '.readTemperature()';
    return [code, Blockly.Arduino.ORDER_ATOMIC];
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. basic_dht_humid — dht.readHumidity()
//    Shares the same include/definition/setup keys as basic_dht_temp for the
//    same pin, so placing both blocks on pin 2 still emits only one DHT object.
// ─────────────────────────────────────────────────────────────────────────────
Blockly.Arduino['basic_dht_humid'] = function (block) {
    var pin  = block.getFieldValue('PIN');
    var obj  = 'basic_dht_' + pin;
    Blockly.Arduino.includes_['dht']              = '#include <DHT.h>';
    Blockly.Arduino.definitions_[obj]             = 'DHT ' + obj + '(' + pin + ', DHT11);';
    Blockly.Arduino.setups_['basic_dht_begin_' + pin] = obj + '.begin();';
    var code = obj + '.readHumidity()';
    return [code, Blockly.Arduino.ORDER_ATOMIC];
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. basic_ultrasonic — getDistance(trig, echo)
//    Injects a reusable helper function once, plus pinMode for both pins.
// ─────────────────────────────────────────────────────────────────────────────
function injectBasicUltrasonicSupport(trig, echo) {
    Blockly.Arduino.definitions_['basic_ultrasonic_func'] = [
        'float getDistance(int trigPin, int echoPin) {',
        '  digitalWrite(trigPin, LOW);',
        '  delayMicroseconds(2);',
        '  digitalWrite(trigPin, HIGH);',
        '  delayMicroseconds(10);',
        '  digitalWrite(trigPin, LOW);',
        '  long duration = pulseIn(echoPin, HIGH, 30000);',
        '  return duration * 0.034 / 2.0;',
        '}',
    ].join('\n');
    Blockly.Arduino.setups_['basic_ultrasonic_trig_' + trig] = 'pinMode(' + trig + ', OUTPUT);';
    Blockly.Arduino.setups_['basic_ultrasonic_echo_' + echo] = 'pinMode(' + echo + ', INPUT);';
}

Blockly.Arduino['basic_ultrasonic'] = function (block) {
    var trig = block.getFieldValue('TRIG') || '9';
    var echo = block.getFieldValue('ECHO') || '10';
    injectBasicUltrasonicSupport(trig, echo);
    var code = 'getDistance(' + trig + ', ' + echo + ')';
    return [code, Blockly.Arduino.ORDER_ATOMIC];
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. basic_servo_move — myServo.write(angle)
//    Full Servo library init injected automatically.
//    Multiple servos on different pins each get their own named object.
// ─────────────────────────────────────────────────────────────────────────────
Blockly.Arduino['basic_servo_move'] = function (block) {
    var pin   = block.getFieldValue('PIN') || '9';
    // ANGLE is a value input — kids can plug in a sensor reading, variable, or map() expression
    var angle = Blockly.Arduino.valueToCode(block, 'ANGLE', Blockly.Arduino.ORDER_ATOMIC) || '90';
    var obj   = 'basic_servo_' + pin;

    Blockly.Arduino.includes_['define_servo']          = '#include <Servo.h>';
    Blockly.Arduino.definitions_['basic_servo_' + pin] = 'Servo ' + obj + ';';
    Blockly.Arduino.setups_['basic_servo_attach_' + pin] = obj + '.attach(' + pin + ');';

    return obj + '.write(' + angle + ');\n';
};

Blockly.Arduino['basic_servo_angle'] = function (block) {
    var raw = block.getFieldValue('DEG');
    var n = parseInt(raw, 10);
    if (Number.isNaN(n)) n = 90;
    n = Math.max(0, Math.min(180, n));
    return [String(n), Blockly.Arduino.ORDER_ATOMIC];
};

// ─────────────────────────────────────────────────────────────────────────────
// 7a. basic_led_setup — pinMode only (teaching setup vs loop)
// ─────────────────────────────────────────────────────────────────────────────
function injectOutputPinSetup(block) {
    var pin = block.getFieldValue('PIN') || '13';
    Blockly.Arduino.setups_['setup_output_' + pin] = 'pinMode(' + pin + ', OUTPUT);';
    return '';
}

Blockly.Arduino['basic_led_setup'] = injectOutputPinSetup;
Blockly.Arduino['basic_arduino_output_setup'] = injectOutputPinSetup;
Blockly.Arduino['basic_buzzer_setup'] = injectOutputPinSetup;

Blockly.Arduino['stem_tip_setup'] = function () {
    return '';
};
Blockly.Arduino['stem_tip_loop'] = function () {
    return '';
};
Blockly.Arduino['stem_tip_math'] = function () {
    return '';
};

Blockly.Arduino['basic_digital_input_setup'] = function (block) {
    var pin = block.getFieldValue('PIN') || '2';
    var mode = block.getFieldValue('MODE') || 'INPUT_PULLUP';
    if (mode === 'INPUT_PULLUP') {
        Blockly.Arduino.setups_['setup_input_' + pin] = 'pinMode(' + pin + ', INPUT_PULLUP);';
    } else {
        Blockly.Arduino.setups_['setup_input_' + pin] = 'pinMode(' + pin + ', INPUT);';
    }
    return '';
};

Blockly.Arduino['basic_button_setup'] = function (block) {
    var pin = block.getFieldValue('PIN') || '2';
    Blockly.Arduino.setups_['setup_input_' + pin] = 'pinMode(' + pin + ', INPUT_PULLUP);';
    return '';
};

Blockly.Arduino['basic_servo_setup'] = function (block) {
    var pin = block.getFieldValue('PIN') || '9';
    var obj = 'basic_servo_' + pin;
    Blockly.Arduino.includes_['define_servo'] = '#include <Servo.h>';
    Blockly.Arduino.definitions_['basic_servo_' + pin] = 'Servo ' + obj + ';';
    Blockly.Arduino.setups_['basic_servo_attach_' + pin] = obj + '.attach(' + pin + ');';
    return '';
};

Blockly.Arduino['basic_i2c_setup'] = function () {
    Blockly.Arduino.includes_['wire'] = '#include <Wire.h>';
    Blockly.Arduino.setups_['basic_wire_begin_once'] = 'Wire.begin();';
    return '';
};

Blockly.Arduino['basic_ldr_setup'] = function (block) {
    var pin = block.getFieldValue('PIN') || 'A0';
    Blockly.Arduino.setups_['basic_ldr_input_' + pin] = 'pinMode(' + pin + ', INPUT);';
    return '';
};

Blockly.Arduino['basic_ir_setup'] = function (block) {
    var pin = block.getFieldValue('PIN') || '2';
    Blockly.Arduino.setups_['basic_ir_' + pin] = 'pinMode(' + pin + ', INPUT);';
    return '';
};

Blockly.Arduino['basic_dht_setup'] = function (block) {
    var pin = block.getFieldValue('PIN') || '2';
    var obj = 'basic_dht_' + pin;
    Blockly.Arduino.includes_['dht'] = '#include <DHT.h>';
    Blockly.Arduino.definitions_[obj] = 'DHT ' + obj + '(' + pin + ', DHT11);';
    Blockly.Arduino.setups_['basic_dht_begin_' + pin] = obj + '.begin();';
    return '';
};

Blockly.Arduino['basic_ultrasonic_setup'] = function (block) {
    var trig = block.getFieldValue('TRIG') || '9';
    var echo = block.getFieldValue('ECHO') || '10';
    injectBasicUltrasonicSupport(trig, echo);
    return '';
};

Blockly.Arduino['basic_joystick_setup'] = function (block) {
    var xPin = block.getFieldValue('XPIN') || 'A0';
    var yPin = block.getFieldValue('YPIN') || 'A1';
    var bPin = block.getFieldValue('BPIN') || '2';
    Blockly.Arduino.setups_['basic_joystick_x_' + xPin] = 'pinMode(' + xPin + ', INPUT);';
    Blockly.Arduino.setups_['basic_joystick_y_' + yPin] = 'pinMode(' + yPin + ', INPUT);';
    Blockly.Arduino.setups_['basic_joystick_btn_' + bPin] = 'pinMode(' + bPin + ', INPUT_PULLUP);';
    return '';
};

Blockly.Arduino['basic_joystick_x'] = function (block) {
    var pin = block.getFieldValue('PIN') || 'A0';
    Blockly.Arduino.setups_['basic_joystick_x_' + pin] = 'pinMode(' + pin + ', INPUT);';
    return ['analogRead(' + pin + ')', Blockly.Arduino.ORDER_ATOMIC];
};

Blockly.Arduino['basic_joystick_y'] = function (block) {
    var pin = block.getFieldValue('PIN') || 'A1';
    Blockly.Arduino.setups_['basic_joystick_y_' + pin] = 'pinMode(' + pin + ', INPUT);';
    return ['analogRead(' + pin + ')', Blockly.Arduino.ORDER_ATOMIC];
};

Blockly.Arduino['basic_joystick_button'] = function (block) {
    var pin = block.getFieldValue('PIN') || '2';
    Blockly.Arduino.setups_['basic_joystick_btn_' + pin] = 'pinMode(' + pin + ', INPUT_PULLUP);';
    return ['(digitalRead(' + pin + ') == LOW)', Blockly.Arduino.ORDER_ATOMIC];
};

function hexToRgbTuple(hex) {
    var clean = String(hex || '#ff0000').replace('#', '');
    if (clean.length === 3) {
        clean = clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2];
    }
    if (!/^[0-9a-fA-F]{6}$/.test(clean)) {
        clean = 'ff0000';
    }
    var r = parseInt(clean.substring(0, 2), 16);
    var g = parseInt(clean.substring(2, 4), 16);
    var b = parseInt(clean.substring(4, 6), 16);
    return [r, g, b];
}

function injectBasicNeoPixelSupport(pin, count) {
    var pinId = String(pin || '2');
    var countValue = Math.max(1, parseInt(count, 10) || 1);
    Blockly.Arduino.includes_['define_neopixel'] = '#include <Adafruit_NeoPixel.h>';
    Blockly.Arduino.definitions_['basic_neopixel_' + pinId] =
        'Adafruit_NeoPixel basic_neopixel_' + pinId +
        ' = Adafruit_NeoPixel(' + countValue + ', ' + pinId + ', NEO_GRB + NEO_KHZ800);';
    Blockly.Arduino.setups_['basic_neopixel_begin_' + pinId] = 'basic_neopixel_' + pinId + '.begin();';
    Blockly.Arduino.setups_['basic_neopixel_show_' + pinId] = 'basic_neopixel_' + pinId + '.show();';
}

Blockly.Arduino['basic_neopixel_strip_setup'] = function (block) {
    var pin = block.getFieldValue('PIN') || '2';
    var count = block.getFieldValue('COUNT') || '8';
    injectBasicNeoPixelSupport(pin, count);
    return '';
};

Blockly.Arduino['basic_neopixel_single'] = function (block) {
    var pin = block.getFieldValue('PIN') || '2';
    var color = block.getFieldValue('COLOR') || '#ff0000';
    injectBasicNeoPixelSupport(pin, 1);
    var rgb = hexToRgbTuple(color);
    var obj = 'basic_neopixel_' + pin;
    return obj + '.setPixelColor(0, ' + obj + '.Color(' + rgb[0] + ', ' + rgb[1] + ', ' + rgb[2] + '));\n' +
        obj + '.show();\n';
};

Blockly.Arduino['basic_neopixel_set_brightness'] = function (block) {
    var pin = block.getFieldValue('PIN') || '2';
    var brightness = Math.max(0, Math.min(255, parseInt(block.getFieldValue('BRIGHTNESS'), 10) || 64));
    injectBasicNeoPixelSupport(pin, 8);
    var obj = 'basic_neopixel_' + pin;
    return obj + '.setBrightness(' + brightness + ');\n' +
        obj + '.show();\n';
};

Blockly.Arduino['basic_neopixel_clear'] = function (block) {
    var pin = block.getFieldValue('PIN') || '2';
    injectBasicNeoPixelSupport(pin, 8);
    var obj = 'basic_neopixel_' + pin;
    return obj + '.clear();\n' +
        obj + '.show();\n';
};

Blockly.Arduino['basic_neopixel_fill'] = function (block) {
    var pin = block.getFieldValue('PIN') || '2';
    var count = Math.max(1, parseInt(block.getFieldValue('COUNT'), 10) || 8);
    var color = block.getFieldValue('COLOR') || '#00ff66';
    injectBasicNeoPixelSupport(pin, count);
    var rgb = hexToRgbTuple(color);
    var obj = 'basic_neopixel_' + pin;
    var code = '';
    code += 'for (int i = 0; i < ' + count + '; i++) {\n';
    code += '  ' + obj + '.setPixelColor(i, ' + obj + '.Color(' + rgb[0] + ', ' + rgb[1] + ', ' + rgb[2] + '));\n';
    code += '}\n';
    code += obj + '.show();\n';
    return code;
};

Blockly.Arduino['basic_neopixel_show'] = function (block) {
    var pin = block.getFieldValue('PIN') || '2';
    injectBasicNeoPixelSupport(pin, 8);
    var obj = 'basic_neopixel_' + pin;
    return obj + '.show();\n';
};

Blockly.Arduino['basic_neopixel_rainbow_cycle'] = function (block) {
    var pin = block.getFieldValue('PIN') || '2';
    var count = Math.max(1, parseInt(block.getFieldValue('COUNT'), 10) || 8);
    var delayMs = Math.max(1, parseInt(block.getFieldValue('DELAY'), 10) || 20);
    var cycles = Math.max(1, parseInt(block.getFieldValue('CYCLES'), 10) || 1);
    injectBasicNeoPixelSupport(pin, count);
    Blockly.Arduino.definitions_['basic_neopixel_wheel_func'] = [
        'uint32_t basicNeoPixelWheel(Adafruit_NeoPixel &strip, byte pos) {',
        '  pos = 255 - pos;',
        '  if (pos < 85) {',
        '    return strip.Color(255 - pos * 3, 0, pos * 3);',
        '  }',
        '  if (pos < 170) {',
        '    pos -= 85;',
        '    return strip.Color(0, pos * 3, 255 - pos * 3);',
        '  }',
        '  pos -= 170;',
        '  return strip.Color(pos * 3, 255 - pos * 3, 0);',
        '}',
    ].join('\n');
    var obj = 'basic_neopixel_' + pin;
    var code = '';
    code += 'for (int j = 0; j < 256 * ' + cycles + '; j++) {\n';
    code += '  for (int i = 0; i < ' + count + '; i++) {\n';
    code += '    ' + obj + '.setPixelColor(i, basicNeoPixelWheel(' + obj + ', ((i * 256 / ' + count + ') + j) & 255));\n';
    code += '  }\n';
    code += '  ' + obj + '.show();\n';
    code += '  delay(' + delayMs + ');\n';
    code += '}\n';
    return code;
};

Blockly.Arduino['basic_neopixel_color_wipe'] = function (block) {
    var pin = block.getFieldValue('PIN') || '2';
    var count = Math.max(1, parseInt(block.getFieldValue('COUNT'), 10) || 8);
    var delayMs = Math.max(1, parseInt(block.getFieldValue('DELAY'), 10) || 60);
    var color = block.getFieldValue('COLOR') || '#ff6600';
    injectBasicNeoPixelSupport(pin, count);
    var rgb = hexToRgbTuple(color);
    var obj = 'basic_neopixel_' + pin;
    var code = '';
    code += 'for (int i = 0; i < ' + count + '; i++) {\n';
    code += '  ' + obj + '.setPixelColor(i, ' + obj + '.Color(' + rgb[0] + ', ' + rgb[1] + ', ' + rgb[2] + '));\n';
    code += '  ' + obj + '.show();\n';
    code += '  delay(' + delayMs + ');\n';
    code += '}\n';
    return code;
};

Blockly.Arduino['basic_neopixel_theater_chase'] = function (block) {
    var pin = block.getFieldValue('PIN') || '2';
    var count = Math.max(1, parseInt(block.getFieldValue('COUNT'), 10) || 8);
    var delayMs = Math.max(1, parseInt(block.getFieldValue('DELAY'), 10) || 80);
    var rounds = Math.max(1, parseInt(block.getFieldValue('ROUNDS'), 10) || 5);
    var color = block.getFieldValue('COLOR') || '#ffffff';
    injectBasicNeoPixelSupport(pin, count);
    var rgb = hexToRgbTuple(color);
    var obj = 'basic_neopixel_' + pin;
    var code = '';
    code += 'for (int a = 0; a < ' + rounds + '; a++) {\n';
    code += '  for (int q = 0; q < 3; q++) {\n';
    code += '    for (int i = 0; i < ' + count + '; i += 3) {\n';
    code += '      int p = i + q;\n';
    code += '      if (p < ' + count + ') {\n';
    code += '        ' + obj + '.setPixelColor(p, ' + obj + '.Color(' + rgb[0] + ', ' + rgb[1] + ', ' + rgb[2] + '));\n';
    code += '      }\n';
    code += '    }\n';
    code += '    ' + obj + '.show();\n';
    code += '    delay(' + delayMs + ');\n';
    code += '    for (int i = 0; i < ' + count + '; i += 3) {\n';
    code += '      int p = i + q;\n';
    code += '      if (p < ' + count + ') {\n';
    code += '        ' + obj + '.setPixelColor(p, 0);\n';
    code += '      }\n';
    code += '    }\n';
    code += '  }\n';
    code += '}\n';
    return code;
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. basic_led_pin — digitalWrite on chosen pin
// ─────────────────────────────────────────────────────────────────────────────
Blockly.Arduino['basic_led_pin'] = function (block) {
    var pin = block.getFieldValue('PIN') || '13';
    var stat = block.getFieldValue('STAT') || 'HIGH';
    Blockly.Arduino.setups_['setup_output_' + pin] = 'pinMode(' + pin + ', OUTPUT);';
    return 'digitalWrite(' + pin + ', ' + stat + ');\n';
};

// ─────────────────────────────────────────────────────────────────────────────
// 8. basic_led_blink_pattern — one on/off cycle on external pin
// ─────────────────────────────────────────────────────────────────────────────
Blockly.Arduino['basic_led_blink_pattern'] = function (block) {
    var pin = block.getFieldValue('PIN') || '13';
    var onMs = Blockly.Arduino.valueToCode(block, 'ON_MS', Blockly.Arduino.ORDER_ATOMIC) || '500';
    var offMs = Blockly.Arduino.valueToCode(block, 'OFF_MS', Blockly.Arduino.ORDER_ATOMIC) || '500';
    Blockly.Arduino.setups_['setup_output_' + pin] = 'pinMode(' + pin + ', OUTPUT);';
    var code = '';
    code += 'digitalWrite(' + pin + ', HIGH);\n';
    code += 'delay(' + onMs + ');\n';
    code += 'digitalWrite(' + pin + ', LOW);\n';
    code += 'delay(' + offMs + ');\n';
    return code;
};

// ─────────────────────────────────────────────────────────────────────────────
// 9. basic_led_brightness — percent (0..100) mapped to PWM (0..255)
// ─────────────────────────────────────────────────────────────────────────────
Blockly.Arduino['basic_led_brightness'] = function (block) {
    var pin = block.getFieldValue('PIN') || '9';
    var percent = Blockly.Arduino.valueToCode(block, 'NUM', Blockly.Arduino.ORDER_ATOMIC) || '50';
    Blockly.Arduino.setups_['setup_output_' + pin] = 'pinMode(' + pin + ', OUTPUT);';
    return 'analogWrite(' + pin + ', (int)((constrain(' + percent + ', 0, 100) * 255) / 100));\n';
};

// ─────────────────────────────────────────────────────────────────────────────
// 10–13. Active / passive buzzer
// ─────────────────────────────────────────────────────────────────────────────
Blockly.Arduino['basic_active_buzzer'] = function (block) {
    var pin = block.getFieldValue('PIN') || '7';
    var stat = block.getFieldValue('STAT') || 'HIGH';
    Blockly.Arduino.setups_['setup_output_' + pin] = 'pinMode(' + pin + ', OUTPUT);';
    return 'digitalWrite(' + pin + ', ' + stat + ');\n';
};

Blockly.Arduino['basic_buzzer_beep'] = function (block) {
    var pin = block.getFieldValue('PIN') || '7';
    var onMs = Blockly.Arduino.valueToCode(block, 'ON_MS', Blockly.Arduino.ORDER_ATOMIC) || '100';
    var offMs = Blockly.Arduino.valueToCode(block, 'OFF_MS', Blockly.Arduino.ORDER_ATOMIC) || '100';
    Blockly.Arduino.setups_['setup_output_' + pin] = 'pinMode(' + pin + ', OUTPUT);';
    var code = '';
    code += 'digitalWrite(' + pin + ', HIGH);\n';
    code += 'delay(' + onMs + ');\n';
    code += 'digitalWrite(' + pin + ', LOW);\n';
    code += 'delay(' + offMs + ');\n';
    return code;
};

Blockly.Arduino['basic_passive_tone'] = function (block) {
    var pin = block.getFieldValue('PIN') || '8';
    var freq = Blockly.Arduino.valueToCode(block, 'FREQ', Blockly.Arduino.ORDER_ATOMIC) || '440';
    var dur = Blockly.Arduino.valueToCode(block, 'DUR', Blockly.Arduino.ORDER_ATOMIC) || '200';
    Blockly.Arduino.setups_['setup_output_' + pin] = 'pinMode(' + pin + ', OUTPUT);';
    var code = '';
    code += 'tone(' + pin + ', ' + freq + ');\n';
    code += 'delay(' + dur + ');\n';
    code += 'noTone(' + pin + ');\n';
    return code;
};

Blockly.Arduino['basic_passive_stop'] = function (block) {
    var pin = block.getFieldValue('PIN') || '8';
    Blockly.Arduino.setups_['setup_output_' + pin] = 'pinMode(' + pin + ', OUTPUT);';
    return 'noTone(' + pin + ');\n';
};

// ── Display: LCD I2C 16×2 ───────────────────────────────────────────────────
Blockly.Arduino['basic_lcd_setup'] = function (block) {
    var addr = block.getFieldValue('ADDR') || '0x27';
    Blockly.Arduino.includes_['define_Wire'] = '#include <Wire.h>';
    Blockly.Arduino.includes_['define_LiquidCrystal_I2C'] = '#include <LiquidCrystal_I2C.h>';
    Blockly.Arduino.definitions_['var_lcd'] = 'LiquidCrystal_I2C lcd(' + addr + ', 16, 2);';
    Blockly.Arduino.setups_['setup_lcd_basic'] =
        'lcd.init();\n' +
        '  lcd.backlight();\n' +
        '  lcd.noCursor();\n' +
        '  lcd.noBlink();\n';
    return '';
};

Blockly.Arduino['basic_lcd_show_line'] = function (block) {
    var line = block.getFieldValue('LINE') || '1';
    var row = line === '2' ? '1' : '0';
    var text = Blockly.Arduino.valueToCode(block, 'TEXT', Blockly.Arduino.ORDER_ATOMIC) || '""';
    return 'lcd.setCursor(0, ' + row + ');\n' +
        'lcd.print(' + text + ');\n';
};

// ── Display: OLED 128×64 quick 4-line screen ─────────────────────────────────
function injectBasicOledSupport(addr) {
    var i2cAddr = addr || '0x3C';
    Blockly.Arduino.includes_['include_SPI'] = '#include <SPI.h>';
    Blockly.Arduino.includes_['include_Wire'] = '#include <Wire.h>';
    Blockly.Arduino.includes_['include_Adafruit_GFX'] = '#include <Adafruit_GFX.h>';
    Blockly.Arduino.includes_['include_Adafruit_SSD1306'] = '#include <Adafruit_SSD1306.h>';
    Blockly.Arduino.definitions_['define_WIDTH'] = '#define SCREEN_WIDTH 128';
    Blockly.Arduino.definitions_['define_HEIGHT'] = '#define SCREEN_HEIGHT 64';
    Blockly.Arduino.definitions_['define_OLED_RESET'] = '#define OLED_RESET -1';
    Blockly.Arduino.definitions_['obj_display'] = 'Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);';
    Blockly.Arduino.setups_['setup_comment'] = '// SSD1306_SWITCHCAPVCC = generate display voltage from 3.3V internally';
    Blockly.Arduino.setups_['setup_display'] = 'display.begin(SSD1306_SWITCHCAPVCC, ' + i2cAddr + ');';
    Blockly.Arduino.setups_['setup_display_defaults'] =
        'display.clearDisplay();\n' +
        '  display.setTextSize(1);\n' +
        '  display.setTextColor(SSD1306_WHITE);';
}

Blockly.Arduino['basic_oled_screen_4lines'] = function (block) {
    // Keep this block safe even if setup block is missing.
    injectBasicOledSupport('0x3C');
    function emitLine(inputName, y) {
        var v = Blockly.Arduino.valueToCode(block, inputName, Blockly.Arduino.ORDER_ATOMIC) || '""';
        return 'display.setCursor(0, ' + y + ');\n' +
            '  display.print(' + v + ');\n';
    }
    var code = 'display.clearDisplay();\n' +
        'display.setTextSize(1);\n' +
        'display.setTextColor(SSD1306_WHITE);\n' +
        emitLine('L1', 0) +
        emitLine('L2', 8) +
        emitLine('L3', 16) +
        emitLine('L4', 24) +
        'display.display();\n';
    return code;
};

Blockly.Arduino['basic_text_string'] = Blockly.Arduino['text'];
Blockly.Arduino['basic_text_char'] = Blockly.Arduino['char'];
