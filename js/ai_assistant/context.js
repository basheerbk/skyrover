/**
 * WorkspaceContextBuilder — builds a snapshot of the current project for the AI.
 * BLOCKS-first: primary context is a human-readable description of the block structure.
 * Code is included as secondary reference.
 * Output: { code: string, summary: string, blocksDescription: string }.
 */
(function (global) {
  'use strict';

  var MAX_CODE_LEN = 8000;
  var MAX_SUMMARY_LEN = 500;
  var MAX_BLOCKS_DESC_LEN = 4000;
  var MAX_SELECTED_BLOCK_LEN = 800;

  /**
   * Friendly names shown to the AI — MUST match what kids see in the Beginner toolbox
   * (LED, Buzzer, Sensors, …). Unknown types fall back to Title Case of block id.
   */
  var BLOCK_LABELS = {
    base_setup_loop: 'Setup + Loop',
    base_setup: 'Setup',
    base_loop: 'Loop',
    base_begin: 'Begin',
    base_end: 'End',
    base_delay: 'Wait (milliseconds)',
    base_delay_sec: 'Wait (seconds)',
    base_map: 'Map number',
    controls_repeat_ext: 'Repeat (count)',
    controls_repeat: 'Repeat N times',
    controls_whileUntil: 'While / until',
    controls_if: 'If',
    controls_ifelse: 'If / else',
    controls_else: 'Else',
    logic_compare: 'Compare',
    logic_operation: 'And / or',
    logic_boolean: 'true / false',
    math_number: 'Number',
    math_arithmetic: 'Math (+ − × ÷)',
    math_random_int: 'Random number',
    inout_digital_write: 'Set digital pin to HIGH/LOW',
    inout_digital_write_validator: 'Set digital pin to HIGH/LOW',
    inout_digital_read: 'Read digital pin (HIGH/LOW)',
    inout_digital_read_validator: 'Read digital pin (HIGH/LOW)',
    inout_digital_mode: 'Set pin mode (INPUT/OUTPUT/INPUT_PULLUP)',
    inout_PWM_write: 'Set pin power (%)',
    inout_analog_read: 'Read analog pin (0-1023)',
    inout_analog_read_validator: 'Read analog pin (0-1023)',
    inout_analog_write: 'Analog write',
    inout_onoff: 'HIGH/LOW value',
    stem_tip_setup: 'Tip: setup runs once (top of Arduino program)',
    stem_tip_loop: 'Tip: loop repeats (bottom of Arduino program)',
    stem_tip_math: 'Tip: use number blocks inside other blocks',
    basic_led_setup: 'Add LED on pin (setup — pin as output)',
    basic_arduino_output_setup: 'Set pin as OUTPUT (setup)',
    basic_digital_input_setup: 'Set pin as INPUT (setup, pull-up or plain)',
    basic_button_setup: 'Add button on pin (Controls category, setup, INPUT_PULLUP)',
    basic_button_state: 'Button pressed or not on pin (Controls category, boolean)',
    basic_button_pressed: 'Button pressed on pin? (legacy block)',
    basic_button_not_pressed: 'Button not pressed on pin? (legacy block)',
    basic_buzzer_setup: 'Add buzzer on pin (setup)',
    basic_servo_setup: 'Add servo on pin (setup)',
    basic_servo_angle: 'Servo angle (click number for protractor, 0–180°)',
    basic_i2c_setup: 'Start I2C bus / Wire.begin (setup)',
    inout_buildin_led: 'Built-in LED',
    serial_init: 'Start Serial Monitor at speed',
    serial_print: 'Serial print message',
    serial_println: 'Serial print line',
    serial_available: 'Serial message available?',
    serial_read: 'Read one serial character',
    basic_serial_read_text: 'Read serial text (string)',
    serial_write: 'Write one serial byte',
    basic_led_pin: 'Turn LED on/off on pin',
    basic_neopixel_strip_setup: 'Add NeoPixel strip on pin with LED count',
    basic_neopixel_single: 'Add NeoPixel on pin with colour',
    basic_neopixel_set_brightness: 'NeoPixel brightness on pin',
    basic_neopixel_fill: 'Fill NeoPixel strip with one colour',
    basic_neopixel_show: 'Show NeoPixel updates now',
    basic_neopixel_clear: 'Turn off all NeoPixels',
    basic_neopixel_color_wipe: 'NeoPixel color wipe animation',
    basic_neopixel_theater_chase: 'NeoPixel theater chase animation',
    basic_neopixel_rainbow_cycle: 'NeoPixel rainbow animation',
    led_blink: 'Blink built-in LED (delay ms)',
    basic_led_blink_pattern: 'Blink LED on pin (on/off ms)',
    basic_led_brightness: 'LED brightness on pin to value percent',
    basic_active_buzzer: 'Active buzzer on/off on pin',
    basic_buzzer_beep: 'Beep on pin (on/off ms)',
    basic_passive_tone: 'Play tone on pin (frequency, duration)',
    basic_passive_stop: 'Stop tone on pin',
    basic_ldr_setup: 'Add LDR sensor on pin (setup)',
    basic_ir_setup: 'Add IR sensor on pin (setup)',
    basic_dht_setup: 'Add DHT11 sensor on pin (setup)',
    basic_ultrasonic_setup: 'Add ultrasonic sensor Trig/Echo (setup)',
    basic_ldr_read: 'Light level on pin (LDR)',
    basic_ir_detect: 'Object detected on pin (IR)',
    basic_dht_temp: 'Temperature from DHT11 on pin',
    basic_dht_humid: 'Humidity from DHT11 on pin',
    basic_ultrasonic: 'Distance (ultrasonic) cm',
    basic_joystick_setup: 'Add joystick (setup: X pin, Y pin, button pin)',
    basic_joystick_x: 'Joystick X axis on pin',
    basic_joystick_y: 'Joystick Y axis on pin',
    basic_joystick_button: 'Joystick button pressed on pin',
    basic_potentiometer_setup: 'Add potentiometer on pin (setup)',
    basic_potentiometer_read: 'Potentiometer value on pin',
    basic_switch_setup: 'Add switch on pin (setup, INPUT_PULLUP)',
    basic_switch_state: 'Switch ON or OFF on pin',
    basic_servo_move: 'Move servo on pin to angle',
    basic_lcd_setup: 'LCD (I2C) start',
    basic_lcd_show_line: 'LCD show text on line',
    lcd_i2c_lcdclear: 'LCD clear',
    lcd_i2c_lcdwrite: 'LCD write at position',
    lcd_i2c_lcdscan: 'LCD I2C scan',
    SSD1306_init_basic: 'Add OLED display (setup, address 0x3C/0x3D)',
    basic_oled_screen_4lines: 'OLED show 4 lines',
    SSD1306_clearDisplay: 'OLED clear',
    SSD1306_display: 'OLED show',
    SSD1306_setTextSize: 'OLED text size',
    SSD1306_setTextColour: 'OLED text colour',
    SSD1306_setCursor: 'OLED cursor',
    SSD1306_print: 'OLED print',
    SSD1306_println: 'OLED println',
    SSD1306_write: 'OLED write character',
    SSD1306_invertDisplay: 'OLED invert',
    SSD1306_startscroll: 'OLED scroll',
    SSD1306_stopscroll: 'OLED stop scroll',
    procedures_defnoreturn: 'Custom block (no return)',
    procedures_defreturn: 'Custom block (return value)',
    procedures_callnoreturn: 'Run custom block',
    time_delay: 'Wait (delay)',
    time_millis: 'Milliseconds'
  };

  function blockFriendlyName(type) {
    return BLOCK_LABELS[type] || (type ? type.replace(/_/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); }) : 'block');
  }

  /** Blockly uses isShadow() method; treating !block.isShadow breaks (function is truthy). */
  function blockIsReal(b) {
    if (!b || !b.type) return false;
    if (typeof b.isShadow === 'function') return !b.isShadow();
    return !b.isShadow;
  }

  /** Get a short description of one block: label + key field values (e.g. pin, value). */
  function describeBlock(block, indent) {
    if (!block || !block.type) return '';
    indent = indent || 0;
    var prefix = (indent > 0 ? '  '.repeat(indent) + '• ' : '');
    var name = blockFriendlyName(block.type);
    var extra = [];
    try {
      if (block.getFieldValue) {
        var pin = block.getFieldValue('PIN') || block.getFieldValue('PIN_NUMBER');
        if (pin != null) extra.push('pin ' + pin);
        var modeIn = block.getFieldValue('MODE');
        if (modeIn != null && String(modeIn).length) extra.push(String(modeIn));
        var val =
          block.getFieldValue('VALUE') ||
          block.getFieldValue('STATE') ||
          block.getFieldValue('STAT') ||
          block.getFieldValue('BOOL');
        if (val != null) extra.push(val);
        var trig = block.getFieldValue('TRIG');
        var echo = block.getFieldValue('ECHO');
        if (trig != null && echo != null) extra.push('Trig ' + trig + ', Echo ' + echo);
        var num = block.getFieldValue('NUM');
        if (num != null) extra.push('times: ' + num);
        var delay = block.getFieldValue('DELAY') || block.getFieldValue('TIME');
        if (delay != null) extra.push('ms: ' + delay);
      }
    } catch (e) { /* ignore */ }
    var line = prefix + name + (extra.length ? ' (' + extra.join(', ') + ')' : '');
    var out = [line];
    try {
      var inputList = block.inputList || [];
      for (var i = 0; i < inputList.length; i++) {
        var conn = inputList[i].connection;
        if (conn) {
          var child = conn.targetBlock && conn.targetBlock();
          if (child && blockIsReal(child)) {
            var c = child;
            while (c) {
              out.push(describeBlock(c, indent + 1));
              c = (c.getNextBlock && c.getNextBlock()) || (c.nextConnection && c.nextConnection.targetBlock && c.nextConnection.targetBlock());
            }
          }
        }
      }
    } catch (e) { /* ignore */ }
    return out.filter(Boolean).join('\n');
  }

  function getToolboxFileHint() {
    try {
      if (typeof sessionStorage !== 'undefined') {
        return String(sessionStorage.getItem('toolbox') || '');
      }
    } catch (e) { /* ignore */ }
    return '';
  }

  /** When mode is unknown, use block types as a weak signal (never overrides explicit mode). */
  function inferModeFromBlocks(workspace) {
    if (!workspace || !workspace.getAllBlocks) return '';
    try {
      var blocks = workspace.getAllBlocks(false);
      var beginnerScore = 0;
      var n = 0;
      var i;
      var type;
      var b;
      for (i = 0; i < blocks.length; i++) {
        b = blocks[i];
        if (!b || !b.type) continue;
        if (typeof b.isInFlyout === 'function' && b.isInFlyout()) continue;
        n++;
        type = b.type;
        if (/^basic_/.test(type) || type === 'led_blink') beginnerScore += 2;
        if (/_validator$/.test(type)) beginnerScore += 1;
      }
      if (n === 0) return '';
      if (beginnerScore >= 3) return 'beginner';
      if (beginnerScore === 0 && n >= 8) return 'advanced';
    } catch (e) { /* ignore */ }
    return '';
  }

  /**
   * @returns {{ mode: string, modeSource: string, toolboxFile: string }}
   */
  function resolveIdeMode(workspace) {
    var toolboxFile = getToolboxFileHint();
    try {
      if (typeof BlocklyDuino !== 'undefined' && typeof BlocklyDuino.getBlockideMode === 'function') {
        return {
          mode: BlocklyDuino.getBlockideMode(),
          modeSource: 'blockide_mode',
          toolboxFile: toolboxFile
        };
      }
    } catch (e) { /* ignore */ }
    try {
      if (typeof localStorage !== 'undefined') {
        var raw = (localStorage.getItem('blockide_mode') || '').toLowerCase();
        if (raw === 'basic') raw = 'beginner';
        if (raw === 'advanced' || raw === 'beginner') {
          return { mode: raw, modeSource: 'localStorage', toolboxFile: toolboxFile };
        }
      }
    } catch (e2) { /* ignore */ }
    var tb = toolboxFile.toLowerCase();
    if (tb.indexOf('beginner') >= 0 || tb === 'toolbox_basic') {
      return { mode: 'beginner', modeSource: 'sessionToolbox', toolboxFile: toolboxFile };
    }
    if (tb.indexOf('arduino_all') >= 0 || /\barduino_[234]\b/.test(tb)) {
      return { mode: 'advanced', modeSource: 'sessionToolbox', toolboxFile: toolboxFile };
    }
    var inferred = inferModeFromBlocks(workspace);
    if (inferred) {
      return { mode: inferred, modeSource: 'blocksHeuristic', toolboxFile: toolboxFile };
    }
    return { mode: 'beginner', modeSource: 'default', toolboxFile: toolboxFile };
  }

  function buildBlocksDescription(workspace) {
    if (!workspace || !workspace.getTopBlocks) return 'No blocks.';
    try {
      var topBlocks = workspace.getTopBlocks(true);
      var lines = [];
      for (var i = 0; i < topBlocks.length; i++) {
        lines.push(describeBlock(topBlocks[i], 0));
      }
      var s = lines.filter(Boolean).join('\n\n');
      if (s.length > MAX_BLOCKS_DESC_LEN) s = s.substring(0, MAX_BLOCKS_DESC_LEN) + '\n... (more blocks)';
      return s || 'No blocks on the workspace.';
    } catch (e) {
      return 'Could not read blocks.';
    }
  }

  function buildContext(workspace) {
    var code = '';
    var summary = '';
    var blocksDescription = '';

    if (!workspace) {
      var ideEmpty = resolveIdeMode(null);
      return {
        code: '',
        summary: 'No workspace.',
        blocksDescription: 'No workspace.',
        selectedBlock: '',
        ideMode: ideEmpty.mode,
        modeSource: ideEmpty.modeSource,
        toolboxFile: ideEmpty.toolboxFile
      };
    }

    var ide = resolveIdeMode(workspace);
    var selectedBlock = '';
    try {
      var sel =
        typeof Blockly !== 'undefined' && Blockly.selected ? Blockly.selected : null;
      var inFlyout = false;
      if (sel && typeof sel.isInFlyout === 'function') {
        inFlyout = !!sel.isInFlyout();
      } else if (sel && typeof sel.isInFlyout === 'boolean') {
        inFlyout = sel.isInFlyout;
      }
      if (
        sel &&
        sel.workspace === workspace &&
        typeof describeBlock === 'function' &&
        !inFlyout
      ) {
        var desc = describeBlock(sel, 0).trim();
        if (desc.length > MAX_SELECTED_BLOCK_LEN) {
          desc = desc.substring(0, MAX_SELECTED_BLOCK_LEN) + '...';
        }
        selectedBlock = desc;
      }
    } catch (eSel) {
      selectedBlock = '';
    }

    try {
      blocksDescription = buildBlocksDescription(workspace);
    } catch (e) {
      blocksDescription = 'Could not read blocks.';
    }

    try {
      var topBlocks = workspace.getTopBlocks(true);
      var names = [];
      for (var i = 0; i < topBlocks.length; i++) {
        var type = topBlocks[i].type || 'block';
        names.push(blockFriendlyName(type));
      }
      summary = topBlocks.length + ' top block(s): ' + (names.slice(0, 12).join(', ') || 'none');
      if (names.length > 12) summary += '...';
    } catch (e) {
      summary = 'Could not summarize blocks.';
    }
    if (summary.length > MAX_SUMMARY_LEN) summary = summary.substring(0, MAX_SUMMARY_LEN) + '...';

    try {
      if (typeof BlocklyDuino !== 'undefined' && BlocklyDuino.workspaceToCode) {
        code = BlocklyDuino.workspaceToCode(workspace) || '';
      } else if (typeof Blockly !== 'undefined' && Blockly.Arduino && Blockly.Arduino.workspaceToCode) {
        code = Blockly.Arduino.workspaceToCode(workspace) || '';
      }
    } catch (e) {
      code = '// Error generating code: ' + (e.message || 'unknown');
    }
    if (code.length > MAX_CODE_LEN) {
      code = code.substring(0, MAX_CODE_LEN) + '\n// ... (truncated)';
    }

    return {
      code: code,
      summary: summary,
      blocksDescription: blocksDescription,
      selectedBlock: selectedBlock,
      ideMode: ide.mode,
      modeSource: ide.modeSource,
      toolboxFile: ide.toolboxFile
    };
  }

  global.WorkspaceContextBuilder = { buildContext: buildContext };
})(typeof window !== 'undefined' ? window : this);
