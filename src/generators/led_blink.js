import '../compat_shim.js';

Blockly.Arduino['led_blink'] = function(block) {
  var delay_time = Blockly.Arduino.valueToCode(block, 'DELAY', Blockly.Arduino.ORDER_ATOMIC) || '1000';
  
  // Built-in LED pin: use board profile when available, else default 13 (STEM-friendly fallback)
  var ledPin = '13';
  if (typeof profile !== 'undefined' && profile.defaultBoard && profile.defaultBoard.builtInLed) {
    ledPin = profile.defaultBoard.builtInLed;
  }

  // Setup code (runs once)
  Blockly.Arduino.addSetup('pinMode_' + ledPin, 'pinMode(' + ledPin + ', OUTPUT);', true);

  // Main code (runs in loop) - use built-in LED pin from board profile
  var code = 'digitalWrite(' + ledPin + ', HIGH);\n';
  code += 'delay(' + delay_time + ');\n';
  code += 'digitalWrite(' + ledPin + ', LOW);\n';
  code += 'delay(' + delay_time + ');\n';
  return code;
}; 