/**
 * Compatibility shim — makes legacy Blockly@rduino code
 * work unchanged with Blockly v12.
 *
 * Covers:
 *  1. Blockly.Arduino proxy (generator functions + forBlock registration)
 *  2. goog.* Closure Library stubs (dom, string, color, asserts, etc.)
 *  3. Blockly constant renames (ALIGN_*, FieldInstance, FieldColour, etc.)
 *  4. Blockly.Type / Blockly.Types / Blockly.StaticTyping stubs
 *  5. BlocklyDuino global stubs
 *  6. FieldInstance class shim
 */

import * as Blockly from 'blockly';
import { Arduino } from './arduino_gen.js';

const gen = Arduino;

// ── Helper: wrap generator functions for forBlock API ────────────────────────
// Supports both old-style (uses `this`) and new-style (uses `block` param).
// We call fn.call(block, block, generator) so that:
//   - old-style: `this.getFieldValue(...)` → `this` = block ✓
//   - new-style: `function(block) { block.getFieldValue(...) }` → first arg = block ✓
function wrapOldStyle(fn) {
  return function(block, generator) {
    _shim.includes_    = generator.includes_;
    _shim.definitions_ = generator.definitions_;
    _shim.setups_      = generator.setups_;
    _shim.variableDB_  = generator.nameDB_;
    _shim._currentGen  = generator;
    return fn.call(block, block, generator);
  };
}

// ── Shim object for the Arduino proxy ────────────────────────────────────────
const _shim = {
  includes_:    gen.includes_,
  definitions_: gen.definitions_,
  setups_:      gen.setups_,
  variableDB_:  gen.nameDB_,
  _currentGen:  gen,

  ORDER_ATOMIC:         0,
  ORDER_UNARY_POSTFIX:  1,
  ORDER_UNARY_PREFIX:   2,
  ORDER_MULTIPLICATIVE: 3,
  ORDER_ADDITIVE:       4,
  ORDER_SHIFT:          5,
  ORDER_RELATIONAL:     6,
  ORDER_EQUALITY:       7,
  ORDER_BITWISE_AND:    8,
  ORDER_BITWISE_XOR:    9,
  ORDER_BITWISE_OR:     10,
  ORDER_LOGICAL_AND:    11,
  ORDER_LOGICAL_OR:     12,
  ORDER_CONDITIONAL:    13,
  ORDER_ASSIGNMENT:     14,
  ORDER_COMMA:          15,
  ORDER_UNARY_NEGATION: 16,
  ORDER_MEMBER:         17,
  ORDER_NONE:           99,

  valueToCode(block, name, order) {
    return this._currentGen.valueToCode(block, name, order);
  },
  statementToCode(block, name) {
    return this._currentGen.statementToCode(block, name);
  },
  addInclude(tag, code) { this._currentGen.addInclude(tag, code); },
  addDefinition(tag, code) { this._currentGen.addDefinition(tag, code); },
  addSetup(tag, code) { this._currentGen.addSetup(tag, code); },

  /**
   * Map Blockly.Types (typeId string) to Arduino C type names.
   * Used by variables_set_init, variables_const, procedures, array blocks.
   */
  getArduinoType_(type) {
    if (!type || !type.typeId) return 'int';
    var map = {
      'Number': 'int',
      'Decimal': 'float',
      'Boolean': 'bool',
      'Text': 'String',
      'Character': 'char',
      'Short Number': 'short',
      'Large Number': 'long',
      'Array': 'int',
      'Undefined': 'int',
      'Null': 'int',
    };
    return map[type.typeId] || 'int';
  },

  INFINITE_LOOP_TRAP: null,

  // StaticTyping stub (referenced by old generator_arduino and core code)
  StaticTyping: {
    collectVarsWithTypes: function() { return {}; },
    setProcedureArgs: function() {},
    manageStandalone: function() { return ''; },
  },
};

// ── Proxy: intercepts Blockly.Arduino.xxx access ─────────────────────────────
const ArduinoProxy = new Proxy(_shim, {
  set(target, prop, value) {
    if (typeof value === 'function' && !prop.startsWith('_')) {
      gen.forBlock[prop] = wrapOldStyle(value);
    } else {
      target[prop] = value;
    }
    return true;
  },

  get(target, prop) {
    if (prop in target) return target[prop];

    // Pass through to actual generator methods (init, blockToCode, finish, etc.)
    if (prop in gen) {
      const val = gen[prop];
      if (typeof val === 'function') return val.bind(gen);
      return val;
    }

    return gen.forBlock[prop];
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1: Expose Blockly globals
// ═══════════════════════════════════════════════════════════════════════════════

// The webpack module namespace is sometimes not fully enumerable on window.
// Explicitly build window.Blockly from the imported namespace to ensure all
// important properties are accessible by legacy code.
if (!window.Blockly) window.Blockly = {};
var wb0 = window.Blockly;

// Copy all enumerable exports from the ES module namespace
for (var _key in Blockly) {
  if (Blockly.hasOwnProperty(_key) || typeof Blockly[_key] !== 'undefined') {
    try { wb0[_key] = Blockly[_key]; } catch(e) { /* read-only */ }
  }
}

// Explicitly copy critical functions that old code calls
wb0.inject       = Blockly.inject;
wb0.svgResize    = Blockly.svgResize;
wb0.Xml          = Blockly.Xml;
wb0.Events       = Blockly.Events;
wb0.Blocks       = Blockly.Blocks;
wb0.Variables    = Blockly.Variables || {};
wb0.Msg          = Blockly.Msg;
wb0.Themes       = Blockly.Themes;
wb0.Names        = Blockly.Names;
wb0.Generator    = Blockly.Generator || Blockly.CodeGenerator;
wb0.Procedures   = Blockly.Procedures || Blockly.procedures;
wb0.FieldDropdown  = Blockly.FieldDropdown;
wb0.FieldTextInput = Blockly.FieldTextInput;
wb0.FieldCheckbox  = Blockly.FieldCheckbox;
wb0.FieldImage     = Blockly.FieldImage;
wb0.FieldNumber    = Blockly.FieldNumber;
wb0.FieldVariable  = Blockly.FieldVariable;
wb0.FieldLabel     = Blockly.FieldLabel;
wb0.getMainWorkspace = Blockly.getMainWorkspace;
wb0.common       = Blockly.common;

// Shim: Blockly.mainWorkspace (removed in v12, replaced by getMainWorkspace())
// Define as a getter so it always returns the live workspace instance
try {
  Object.defineProperty(window.Blockly, 'mainWorkspace', {
    get: function() {
      return Blockly.getMainWorkspace ? Blockly.getMainWorkspace() : null;
    },
    configurable: true,
  });
} catch(e) { /* already defined */ }

window.Blockly.Arduino = ArduinoProxy;

if (!window.Blockly.Blocks) window.Blockly.Blocks = Blockly.Blocks || {};
if (!window.Blockly.Blocks.variables) window.Blockly.Blocks.variables = {};

window.Blockly.Variables = Blockly.Variables || {};
window.Blockly.Variables.NAME_TYPE = 'VARIABLE';

// Block category HUE colors (previously set by blocks/blocks_colors.js)
var _bk = window.Blockly.Blocks;
var _hueMap = {
  array: '#4CBFE6', logic: '#FFAB19', loops: '#FFD500', math: '#40BF4A',
  texts: '#9966FF', variables: '#FF8C1A', procedures: '#FF6680',
  adafruit_motorshield_v1: '#2D7F4F', adafruit_motorshield_v2: '#005D9D',
  APDS9960: '#D9242D', arduino_base: '#00979D', arduino_conversion: '#00979D',
  arduino_io: '#00979D', arduino_serial: '#00979D', arduino_softserial: '#00979D',
  arduino_shield: '#F39800', capacitiveSensor: '#EA9576', ds18b20: '#B7A700',
  esp8266: '#B4AC91', ethernet: '#FFCC66', HX711: '#D9242D', I2C: '#CC0033',
  infrarouge: '#00979D', keypad: '#46C286', ledRGB_WS2812B: '#C9D7E2',
  lcd_i2c: '#2980B9', null: '#00979D', RFID: '#9BACB4',
  sensor_actuator: '#00979D', servo: '#3498DB', mpu6050: '#2980B9',
  bmp280: '#16A085', SPI: '#9999FF', stepper_motor: '#8CA55B',
  storage: '#00979D', u8g: '#2980B9',
};
for (var _cat in _hueMap) {
  if (!_bk[_cat]) _bk[_cat] = {};
  _bk[_cat].HUE = _hueMap[_cat];
}

// Path constants expected by legacy code
window.Blockly.pathToBlockly = window.Blockly.pathToBlockly || './';
window.Blockly.pathToMedia   = window.Blockly.pathToMedia   || './media/';

// HSV constants used by old Blockly.makeColour / visual code
if (window.Blockly.HSV_SATURATION === undefined) window.Blockly.HSV_SATURATION = 0.45;
if (window.Blockly.HSV_VALUE === undefined)      window.Blockly.HSV_VALUE = 0.65;

// ALIGN_* moved to Blockly.inputs.Align in v12
if (Blockly.inputs && Blockly.inputs.Align) {
  Blockly.ALIGN_LEFT   = Blockly.inputs.Align.LEFT;
  Blockly.ALIGN_RIGHT  = Blockly.inputs.Align.RIGHT;
  Blockly.ALIGN_CENTRE = Blockly.inputs.Align.CENTRE;
} else {
  Blockly.ALIGN_LEFT   = -1;
  Blockly.ALIGN_RIGHT  =  1;
  Blockly.ALIGN_CENTRE =  0;
}

// dragMode_ constant referenced by old Blockly core
if (Blockly.DRAG_NONE === undefined) Blockly.DRAG_NONE = 0;
if (typeof Blockly.dragMode_ === 'undefined') Blockly.dragMode_ = 0;

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2: FieldInstance shim
// ═══════════════════════════════════════════════════════════════════════════════

class FieldInstanceShim extends Blockly.FieldDropdown {
  constructor(instanceType, instanceName) {
    const defaultName = instanceName || instanceType || 'instance';
    super([[defaultName, defaultName]]);
    this.instanceType_ = instanceType;
  }
}
Blockly.FieldInstance = FieldInstanceShim;

if (!Blockly.FieldColour) {
  var colourClass = null;
  try {
    // Preferred: color field plugin class (registered by @blockly/field-colour).
    if (Blockly.fieldRegistry && typeof Blockly.fieldRegistry.getClass === 'function') {
      colourClass =
        Blockly.fieldRegistry.getClass('field_colour') ||
        Blockly.fieldRegistry.getClass('field_color');
    }
  } catch (e) {
    // ignore and keep fallback path below
  }

  if (colourClass) {
    Blockly.FieldColour = colourClass;
  } else {
    // Do NOT silently downgrade to text input — it hides UX regression.
    console.warn('[compat_shim] Blockly.FieldColour unavailable; color picker UI may not open.');
  }
}

// FieldDate — rarely used, stub as text input
if (!Blockly.FieldDate) {
  Blockly.FieldDate = Blockly.FieldTextInput;
}

// FieldAngle — separate package in v12, stub as FieldNumber
if (!Blockly.FieldAngle) {
  Blockly.FieldAngle = Blockly.FieldNumber;
}
wb0.FieldAngle = Blockly.FieldAngle;

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2b: Mutator stub (removed in Blockly v12)
// ═══════════════════════════════════════════════════════════════════════════════

if (!Blockly.Mutator) {
  Blockly.Mutator = function MutatorStub(quarkNames) {
    this.quarkNames_ = quarkNames || [];
  };
  Blockly.Mutator.prototype.dispose = function() {};
  Blockly.Mutator.prototype.setVisible = function() {};
  Blockly.Mutator.prototype.initSvg = function() {};
  Blockly.Mutator.prototype.createIcon = function() {};
  Blockly.Mutator.prototype.layout_ = function() {};
  Blockly.Mutator.prototype.workspaceChanged_ = function() {};
}
wb0.Mutator = Blockly.Mutator;

// Override setMutator — v12's implementation expects a proper Icon interface
// that our stub doesn't provide. Make it a safe no-op.
if (Blockly.BlockSvg) {
  Blockly.BlockSvg.prototype.setMutator = function() {};
}
if (Blockly.Block) {
  Blockly.Block.prototype.setMutator = function() {};
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2c: Xml.textToDom stub
// ═══════════════════════════════════════════════════════════════════════════════

var xmlNs = Blockly.Xml || wb0.Xml || {};
if (!xmlNs.textToDom) {
  xmlNs.textToDom = function(text) {
    var parser = new DOMParser();
    var dom = parser.parseFromString(text, 'text/xml');
    return dom.documentElement;
  };
}
if (!xmlNs.domToText) {
  xmlNs.domToText = function(dom) {
    return new XMLSerializer().serializeToString(dom);
  };
}
wb0.Xml = xmlNs;

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3: Blockly.Type / Types / StaticTyping stubs
// ═══════════════════════════════════════════════════════════════════════════════

if (!Blockly.Type) {
  Blockly.Type = function(args) {
    this.typeId = args.typeId || '';
    this.typeMsgName = args.typeMsgName || '';
    this.compatibleTypes = args.compatibleTypes || [];
    this.output = this.typeId;
  };
  Blockly.Type.prototype.typeId = '';
  Blockly.Type.prototype.compatibleTypes_ = [];
  Blockly.Type.prototype.isCompatibleWith = function(otherType) { return true; };
  Blockly.Type.prototype.generateTypeError = function() { return ''; };
}

if (!Blockly.Types) {
  Blockly.Types = {
    NUMBER:     new Blockly.Type({typeId: 'Number',     typeMsgName: 'ARD_TYPE_NUMBER',     compatibleTypes: []}),
    TEXT:       new Blockly.Type({typeId: 'Text',       typeMsgName: 'ARD_TYPE_TEXT',       compatibleTypes: []}),
    BOOLEAN:    new Blockly.Type({typeId: 'Boolean',    typeMsgName: 'ARD_TYPE_BOOL',       compatibleTypes: []}),
    CHARACTER:  new Blockly.Type({typeId: 'Character',  typeMsgName: 'ARD_TYPE_CHAR',       compatibleTypes: []}),
    SHORT_NUMBER: new Blockly.Type({typeId: 'Short Number', typeMsgName: 'ARD_TYPE_SHORT', compatibleTypes: []}),
    LARGE_NUMBER: new Blockly.Type({typeId: 'Large Number', typeMsgName: 'ARD_TYPE_LONG',  compatibleTypes: []}),
    DECIMAL:    new Blockly.Type({typeId: 'Decimal',    typeMsgName: 'ARD_TYPE_DECIMAL',    compatibleTypes: []}),
    ARRAY:      new Blockly.Type({typeId: 'Array',      typeMsgName: 'ARD_TYPE_ARRAY',      compatibleTypes: []}),
    NULL:       new Blockly.Type({typeId: 'Null',       typeMsgName: 'ARD_TYPE_NULL',       compatibleTypes: []}),
    UNDEF:      new Blockly.Type({typeId: 'Undefined',  typeMsgName: 'ARD_TYPE_UNDEF',      compatibleTypes: []}),
    CHILD_BLOCK_MISSING: new Blockly.Type({typeId: 'ChildBlockMissing', typeMsgName: 'ARD_TYPE_CHILDBLOCKMISSING', compatibleTypes: []}),
    getValidTypeArray: function() {
      return [
        [this.NUMBER.typeId,       this.NUMBER.typeId],
        [this.TEXT.typeId,         this.TEXT.typeId],
        [this.BOOLEAN.typeId,     this.BOOLEAN.typeId],
        [this.CHARACTER.typeId,   this.CHARACTER.typeId],
        [this.SHORT_NUMBER.typeId, this.SHORT_NUMBER.typeId],
        [this.LARGE_NUMBER.typeId, this.LARGE_NUMBER.typeId],
        [this.DECIMAL.typeId,     this.DECIMAL.typeId],
        [this.ARRAY.typeId,       this.ARRAY.typeId],
      ];
    },
  };
}

if (!Blockly.StaticTyping) {
  Blockly.StaticTyping = function() {};
  Blockly.StaticTyping.prototype.collectVarsWithTypes = function() { return {}; };
  Blockly.StaticTyping.prototype.setProcedureArgs = function() {};
  Blockly.StaticTyping.prototype.manageStandalone = function() { return ''; };
}

// Instances stub (used by Ardublockly)
if (!Blockly.Instances) {
  Blockly.Instances = {
    NAME_TYPE: 'INSTANCE',
    flyoutCategory: function() { return []; },
    allInstances: function() { return []; },
    allInstancesOf: function() { return []; },
    getInstancesOfType: function() { return []; },
    isInstance: function() { return false; },
    // v12 compat: blocks call this in onchange to check if an instance is declared
    // Return true so blocks don't show false warnings and don't crash the flyout
    isInstancePresent: function(instanceName, instanceType, block) { return true; },
    getInstancesWithType: function(instanceType, workspace) { return []; },
    getInstanceTypes: function(workspace) { return []; },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4: goog.* Closure Library stubs
// ═══════════════════════════════════════════════════════════════════════════════

if (!window.goog) window.goog = {};
const g = window.goog;

g.provide  = g.provide  || function() {};
g.require  = g.require  || function() {};
g.inherits = g.inherits || function(child, parent) {
  child.superClass_ = parent.prototype;
  Object.setPrototypeOf(child.prototype, parent.prototype);
  child.prototype.constructor = child;
};

g.isArray    = g.isArray    || function(v) { return Array.isArray(v); };
g.isString   = g.isString   || function(v) { return typeof v === 'string'; };
g.isFunction = g.isFunction || function(v) { return typeof v === 'function'; };
g.isNumber   = g.isNumber   || function(v) { return typeof v === 'number'; };
g.isObject   = g.isObject   || function(v) { return typeof v === 'object' && v !== null; };

if (!g.asserts) {
  g.asserts = {
    assert:       function(cond, msg) { if (!cond) console.warn('[goog.asserts]', msg); },
    assertObject: function(v) { return v; },
    assertString: function(v) { return v; },
    assertNumber: function(v) { return v; },
    assertArray:  function(v) { return v; },
    fail:         function(msg) { console.warn('[goog.asserts.fail]', msg); },
  };
}

if (!g.string) {
  g.string = {
    caseInsensitiveCompare: function(a, b) {
      var la = String(a).toLowerCase(), lb = String(b).toLowerCase();
      return la < lb ? -1 : la > lb ? 1 : 0;
    },
    trim: function(s) { return s.trim(); },
    startsWith: function(s, prefix) { return s.indexOf(prefix) === 0; },
  };
}

if (!g.dom) {
  g.dom = {
    createDom: function(tag) {
      var el = document.createElement(tag);
      var i = 1;
      if (arguments.length > 1) {
        var second = arguments[1];
        if (typeof second === 'string') {
          el.className = second;
          i = 2;
        } else if (second && typeof second === 'object' && !second.nodeType) {
          for (var key in second) {
            if (second.hasOwnProperty(key)) el.setAttribute(key, second[key]);
          }
          i = 2;
        } else {
          i = 2;
        }
      }
      for (; i < arguments.length; i++) {
        var child = arguments[i];
        if (typeof child === 'string') {
          el.appendChild(document.createTextNode(child));
        } else if (child && child.nodeType) {
          el.appendChild(child);
        }
      }
      return el;
    },
    contains: function(parent, child) {
      return parent ? parent.contains(child) : false;
    },
    removeChildren: function(el) {
      while (el.firstChild) el.removeChild(el.firstChild);
    },
    getViewportSize: function() {
      return { width: window.innerWidth, height: window.innerHeight };
    },
  };
}

if (!g.style) {
  g.style = {
    getViewportPageOffset: function() { return { x: 0, y: 0 }; },
    getSize: function(el) { return { width: el.offsetWidth, height: el.offsetHeight }; },
  };
}

if (!g.color) {
  g.color = {
    hsvToHex: function(h, s, v) {
      h = Number(h);
      s = typeof s === 'number' ? s : 0.45;
      v = typeof v === 'number' ? v : 255 * 0.65;
      v = v / 255;
      var c = v * s;
      var x = c * (1 - Math.abs(((h / 60) % 2) - 1));
      var m = v - c;
      var r = 0, g = 0, b = 0;
      if (h < 60)       { r = c; g = x; }
      else if (h < 120) { r = x; g = c; }
      else if (h < 180) { g = c; b = x; }
      else if (h < 240) { g = x; b = c; }
      else if (h < 300) { r = x; b = c; }
      else              { r = c; b = x; }
      var toHex = function(n) {
        var hex = Math.round((n + m) * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      };
      return '#' + toHex(r) + toHex(g) + toHex(b);
    },
    hexToRgb: function(hex) {
      hex = hex.replace('#', '');
      return {
        r: parseInt(hex.substring(0, 2), 16),
        g: parseInt(hex.substring(2, 4), 16),
        b: parseInt(hex.substring(4, 6), 16),
      };
    },
  };
}

if (!g.ui) {
  g.ui = {
    Component: { setDefaultRightToLeft: function() {} },
  };
}

if (!g.userAgent) {
  g.userAgent = { IPAD: false, MOBILE: false, IE: false };
}

if (!g.math) {
  g.math = { clamp: function(v, min, max) { return Math.max(min, Math.min(max, v)); } };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 5: BlocklyDuino global stubs
// ═══════════════════════════════════════════════════════════════════════════════

if (!window.BlocklyDuino) window.BlocklyDuino = {};

if (typeof window.BlocklyDuino.getStringParamFromUrl !== 'function') {
  window.BlocklyDuino.getStringParamFromUrl = function(name, defaultValue) {
    try {
      var url = new URL(window.location.href);
      var value = url.searchParams.get(name);
      return value == null ? defaultValue : value;
    } catch (e) {
      return defaultValue;
    }
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 6: Blockly v12 API compat patches
// ═══════════════════════════════════════════════════════════════════════════════

// These stubs go on window.Blockly (set above) since the ES module is read-only.
var wb = window.Blockly;

if (Blockly.utils && Blockly.utils.dom && Blockly.utils.dom.createSvgElement) {
  wb.createSvgElement = Blockly.utils.dom.createSvgElement;
}

wb.bindEventWithChecks_ = wb.bindEventWithChecks_ || function(el, name, ctx, fn) {
  var handler = ctx ? fn.bind(ctx) : fn;
  el.addEventListener(name, handler);
  return [[el, name, handler]];
};
wb.bindEvent_ = wb.bindEvent_ || wb.bindEventWithChecks_;
wb.unbindEvent_ = wb.unbindEvent_ || function(handlers) {
  if (handlers) {
    while (handlers.length) {
      var h = handlers.pop();
      h[0].removeEventListener(h[1], h[2]);
    }
  }
};

if (!wb.Xml) wb.Xml = Blockly.Xml || {};

// svgResize — might be accessed as Blockly.svgResize
if (!wb.svgResize && Blockly.svgResize) {
  wb.svgResize = Blockly.svgResize;
}

// getMainWorkspace
if (!wb.getMainWorkspace && Blockly.getMainWorkspace) {
  wb.getMainWorkspace = Blockly.getMainWorkspace;
}

// noEvent utility
wb.noEvent = wb.noEvent || function(e) { e.preventDefault(); e.stopPropagation(); };

// isTargetInput_
wb.isTargetInput_ = wb.isTargetInput_ || function(e) {
  var t = e.target;
  return t && (t.type === 'textarea' || t.type === 'text' || t.type === 'number' ||
    t.type === 'email' || t.type === 'password' || t.type === 'search' ||
    t.type === 'tel' || t.type === 'url' || t.isContentEditable);
};

export { ArduinoProxy as LegacyArduino };
