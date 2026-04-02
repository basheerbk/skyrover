/**
 * Board-aware pin dropdown options — single source for webpack blocks + legacy arduino_io.js.
 * Reads `profile.defaultBoard` from core/BlocklyArduino/blockly@rduino_boards.js (global).
 */

/** @type {[string, string][]} */
const FALLBACK_DIGITAL = [
  ['0', '0'], ['1', '1'], ['2', '2'], ['3', '3'], ['4', '4'],
  ['5', '5'], ['6', '6'], ['7', '7'], ['8', '8'], ['9', '9'],
  ['10', '10'], ['11', '11'], ['12', '12'], ['13', '13'],
];

/** @type {[string, string][]} */
const FALLBACK_PWM = [
  ['3', '3'], ['5', '5'], ['6', '6'], ['9', '9'], ['10', '10'], ['11', '11'],
];

/** @type {[string, string][]} */
const FALLBACK_ANALOG = [
  ['A0', 'A0'], ['A1', 'A1'], ['A2', 'A2'], ['A3', 'A3'], ['A4', 'A4'], ['A5', 'A5'],
];

/** Mega: profile uses dropdownDigital === "attention" — trimmed set for Blockly UX */
const MEGA_ATTENTION_DIGITAL = FALLBACK_DIGITAL.slice();

/**
 * Board profiles live in core/BlocklyArduino/blockly@rduino_boards.js as a classic script `var profile`.
 * Webpack ES modules do NOT see that as a lexical global — must read globalThis/window.
 */
function getBlockideProfileRoot() {
  try {
    if (typeof globalThis !== 'undefined' && globalThis.profile) {
      return globalThis.profile;
    }
  } catch (e) {
    /* ignore */
  }
  if (typeof window !== 'undefined' && window.profile) {
    return window.profile;
  }
  return null;
}

function getActiveBoardProfile() {
  const root = getBlockideProfileRoot();
  if (root && root.defaultBoard) {
    return root.defaultBoard;
  }
  return null;
}

/**
 * @param {[string, string][]} options
 * @returns {[string, string][]}
 */
export function dedupePinOptions(options) {
  if (!options || !options.length) return [];
  const seen = new Set();
  const out = [];
  for (let i = 0; i < options.length; i++) {
    const row = options[i];
    if (!row || row.length < 2) continue;
    const v = String(row[1]);
    if (seen.has(v)) continue;
    seen.add(v);
    out.push([String(row[0]), v]);
  }
  return out;
}

/**
 * @param {[string, string][]} options
 * @param {string} value
 */
export function pinValueIsAllowed(options, value) {
  if (value === undefined || value === null) return false;
  const s = String(value);
  for (let i = 0; i < options.length; i++) {
    if (options[i][1] === s) return true;
  }
  return false;
}

/**
 * @param {[string, string][]} options
 * @param {string} value
 * @returns {string}
 */
export function coercePinValue(options, value) {
  if (!options || !options.length) return value == null ? '' : String(value);
  if (pinValueIsAllowed(options, value)) return String(value);
  return options[0][1];
}

function resolveDropdown(board, key, attentionHandler, fallback) {
  if (!board || board[key] === undefined || board[key] === null) {
    return dedupePinOptions(fallback());
  }
  const raw = board[key];
  if (key === 'dropdownDigital' && raw === 'attention') {
    return dedupePinOptions(attentionHandler());
  }
  if (!Array.isArray(raw)) {
    return dedupePinOptions(fallback());
  }
  const d = dedupePinOptions(raw);
  return d.length ? d : dedupePinOptions(fallback());
}

export function getDigitalPinOptions() {
  return resolveDropdown(
    getActiveBoardProfile(),
    'dropdownDigital',
    () => MEGA_ATTENTION_DIGITAL,
    () => FALLBACK_DIGITAL
  );
}

export function getPwmPinOptions() {
  const board = getActiveBoardProfile();
  return resolveDropdown(
    board,
    'dropdownPWM',
    () => FALLBACK_PWM,
    () => FALLBACK_PWM
  );
}

export function getAnalogPinOptions() {
  const board = getActiveBoardProfile();
  return resolveDropdown(
    board,
    'dropdownAnalog',
    () => FALLBACK_ANALOG,
    () => FALLBACK_ANALOG
  );
}

/**
 * basic_* blocks: field name -> 'digital' | 'analog' | 'pwm'
 * Keep in sync with basic_kit.js pin fields.
 */
export const BASIC_KIT_PIN_FIELDS = {
  basic_ldr_read: { PIN: 'analog' },
  basic_ir_detect: { PIN: 'digital' },
  basic_dht_temp: { PIN: 'digital' },
  basic_dht_humid: { PIN: 'digital' },
  basic_ultrasonic: { TRIG: 'digital', ECHO: 'digital' },
  basic_servo_move: { PIN: 'pwm' },
  basic_led_setup: { PIN: 'digital' },
  basic_arduino_output_setup: { PIN: 'digital' },
  basic_digital_input_setup: { PIN: 'digital' },
  basic_buzzer_setup: { PIN: 'digital' },
  basic_servo_setup: { PIN: 'pwm' },
  basic_ldr_setup: { PIN: 'analog' },
  basic_ir_setup: { PIN: 'digital' },
  basic_dht_setup: { PIN: 'digital' },
  basic_ultrasonic_setup: { TRIG: 'digital', ECHO: 'digital' },
  basic_button_setup: { PIN: 'digital' },
  basic_button_state: { PIN: 'digital' },
  basic_button_pressed: { PIN: 'digital' },
  basic_button_not_pressed: { PIN: 'digital' },
  basic_led_pin: { PIN: 'digital' },
  basic_neopixel_strip_setup: { PIN: 'digital' },
  basic_neopixel_single: { PIN: 'digital' },
  basic_led_blink_pattern: { PIN: 'digital' },
  basic_led_brightness: { PIN: 'pwm' },
  basic_active_buzzer: { PIN: 'digital' },
  basic_buzzer_beep: { PIN: 'digital' },
  basic_passive_tone: { PIN: 'digital' },
  basic_passive_stop: { PIN: 'digital' },
};

function optionsForMode(mode) {
  if (mode === 'pwm') return getPwmPinOptions();
  if (mode === 'analog') return getAnalogPinOptions();
  return getDigitalPinOptions();
}

/**
 * After board change: fix stored pin values on basic_* blocks so XML/code stay valid.
 * @param {*} workspace Blockly workspace
 */
export function coerceBasicKitPinsInWorkspace(workspace) {
  if (!workspace || typeof workspace.getAllBlocks !== 'function') return;
  const blocks = workspace.getAllBlocks(false);
  for (let b = 0; b < blocks.length; b++) {
    const block = blocks[b];
    const spec = BASIC_KIT_PIN_FIELDS[block.type];
    if (!spec) continue;
    const fieldNames = Object.keys(spec);
    let changed = false;
    for (let f = 0; f < fieldNames.length; f++) {
      const name = fieldNames[f];
      const mode = spec[name];
      const opts = optionsForMode(mode);
      if (!opts.length) continue;
      const field = block.getField(name);
      if (!field || typeof field.getValue !== 'function') continue;
      const cur = field.getValue();
      if (pinValueIsAllowed(opts, cur)) continue;
      const next = opts[0][1];
      field.setValue(next);
      changed = true;
    }
    if (changed && typeof block.render === 'function') {
      block.render();
    }
  }
}
