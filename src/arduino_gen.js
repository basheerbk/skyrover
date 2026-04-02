/**
 * BlockIDE Arduino Code Generator
 * Built on Blockly v12 Generator API
 * Replaces the legacy generator_arduino.js + Blockly.Arduino global
 */

import * as Blockly from 'blockly';

export class ArduinoGenerator extends Blockly.Generator {
  constructor() {
    super('Arduino');

    // Storage for code sections built up during generation
    this.includes_    = Object.create(null); // #include <Servo.h>
    this.definitions_ = Object.create(null); // Servo myServo;  (hardware objects + typed var decls)
    this.variables_   = Object.create(null); // int x = 0;      (legacy variable declarations dict)
    this.setups_      = Object.create(null); // myServo.attach(9);
    this.loops_       = Object.create(null); // code always in loop (rare)

    // Operator precedence — matches legacy values exactly
    this.ORDER_ATOMIC         = 0;
    this.ORDER_UNARY_POSTFIX  = 1;
    this.ORDER_UNARY_PREFIX   = 2;
    this.ORDER_MULTIPLICATIVE = 3;
    this.ORDER_ADDITIVE       = 4;
    this.ORDER_SHIFT          = 5;
    this.ORDER_RELATIONAL     = 6;
    this.ORDER_EQUALITY       = 7;
    this.ORDER_BITWISE_AND    = 8;
    this.ORDER_BITWISE_XOR    = 9;
    this.ORDER_BITWISE_OR     = 10;
    this.ORDER_LOGICAL_AND    = 11;
    this.ORDER_LOGICAL_OR     = 12;
    this.ORDER_CONDITIONAL    = 13;
    this.ORDER_ASSIGNMENT     = 14;
    this.ORDER_COMMA          = 15;
    this.ORDER_NONE           = 99;

    this.INDENT = '  ';
    this.isInterrupt = false;
  }

  /**
   * Add an #include line (deduplicated by tag)
   * @param {string} tag   Unique key e.g. 'servo'
   * @param {string} code  Full line e.g. '#include <Servo.h>'
   */
  addInclude(tag, code) {
    this.includes_[tag] = code;
  }

  /**
   * Add a global variable/object declaration
   * @param {string} tag   Unique key e.g. 'servo_9'
   * @param {string} code  e.g. 'Servo myServo_9;'
   */
  addDefinition(tag, code) {
    this.definitions_[tag] = code;
  }

  /**
   * Add a line to void setup()
   * @param {string} tag   Unique key e.g. 'servo_9_attach'
   * @param {string} code  e.g. 'myServo_9.attach(9);'
   */
  addSetup(tag, code) {
    this.setups_[tag] = code;
  }

  /**
   * Add a line that always runs in void loop()
   * @param {string} tag
   * @param {string} code
   */
  addLoop(tag, code) {
    this.loops_[tag] = code;
  }

  /**
   * Reset all stored sections — called before each generation pass
   */
  init(workspace) {
    super.init(workspace);
    this.includes_    = Object.create(null);
    this.definitions_ = Object.create(null);
    this.variables_   = Object.create(null);
    this.setups_      = Object.create(null);
    this.loops_       = Object.create(null);
    this.nameDB_ = new Blockly.Names(this.RESERVED_WORDS_);
    this.nameDB_.setVariableMap(workspace.getVariableMap());
  }

  /**
   * Assemble the final sketch from all collected sections + loop body
   * @param {string} code  The generated loop body
   * @returns {string}     Complete Arduino sketch
   */
  finish(code) {
    const includes    = Object.values(this.includes_).join('\n');
    const definitions = Object.values(this.definitions_).join('\n');
    // variables_ holds legacy typed/const declarations written by variables_set_init,
    // variables_const, array blocks, etc. Emitted after definitions, before setup().
    const varDecls    = Object.values(this.variables_).join('\n');
    const setupLines  = Object.values(this.setups_)
                              .map(l => this.INDENT + l)
                              .join('\n');
    const loopExtra   = Object.values(this.loops_)
                              .map(l => this.INDENT + l)
                              .join('\n');

    const sketch = [
      includes    ? includes + '\n'    : '',
      definitions ? definitions + '\n' : '',
      varDecls    ? varDecls + '\n'    : '',
      'void setup() {',
      setupLines || '',
      '}\n',
      'void loop() {',
      loopExtra || '',
      code,
      '}',
    ].join('\n');

    // Clean up double blank lines
    return sketch.replace(/\n{3,}/g, '\n\n').trim() + '\n';
  }

  /** Naked values (expression statements) are discarded in Arduino C */
  scrubNakedValue() {
    return '';
  }

  /**
   * Encode a string as a C string literal
   * @param {string} str
   * @returns {string}
   */
  quote_(str) {
    str = str.replace(/\\/g, '\\\\')
             .replace(/\n/g, '\\\n')
             .replace(/"/g, '\\"');
    return '"' + str + '"';
  }

  /**
   * Common scrub — adds newline between sequential statements.
   * Ensures the full stack is generated (e.g. LED HIGH → delay → LED LOW → delay).
   * Uses getNextBlock() when available (Blockly v12), else nextConnection.targetBlock().
   */
  scrub_(block, code, thisOnly) {
    let nextCode = '';
    if (!thisOnly && code != null) {
      const nextBlock = typeof block.getNextBlock === 'function'
        ? block.getNextBlock()
        : (block.nextConnection && block.nextConnection.targetBlock && block.nextConnection.targetBlock());
      if (nextBlock) {
        try {
          nextCode = '\n' + this.blockToCode(nextBlock);
        } catch (e) {
          console.warn('[CODE_GEN] Next block in stack failed:', nextBlock.type, e);
        }
      }
    }
    return (code || '') + nextCode;
  }
}

// Singleton instance — import this everywhere
export const Arduino = new ArduinoGenerator();

// Reserved words for variable name sanitisation
ArduinoGenerator.prototype.RESERVED_WORDS_ = [
  'auto','break','case','char','const','continue','default','do',
  'double','else','enum','extern','float','for','goto','if','int',
  'long','register','return','short','signed','sizeof','static',
  'struct','switch','typedef','union','unsigned','void','volatile',
  'while','boolean','byte','word','String','Serial','HIGH','LOW',
  'INPUT','OUTPUT','INPUT_PULLUP','LED_BUILTIN','true','false',
  'NULL','setup','loop','pinMode','digitalWrite','digitalRead',
  'analogWrite','analogRead','delay','millis','micros',
].join(',');
