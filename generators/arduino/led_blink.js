Blockly.Arduino['led_blink'] = function(block) {
  var delay_time = Blockly.Arduino.valueToCode(block, 'DELAY', Blockly.Arduino.ORDER_ATOMIC) || '1000';
  
  // Get the built-in LED pin from the board profile
  var ledPin = profile.defaultBoard.builtInLed || '13';

  // Setup code (runs once) - use built-in LED pin from board profile
  Blockly.Arduino.addSetup('pinMode_' + ledPin, 'pinMode(' + ledPin + ', OUTPUT);', true);

  // Main code (runs in loop) - use built-in LED pin from board profile
  var code = 'digitalWrite(' + ledPin + ', HIGH);\n';
  code += 'delay(' + delay_time + ');\n';
  code += 'digitalWrite(' + ledPin + ', LOW);\n';
  code += 'delay(' + delay_time + ');\n';
  return code;
}; 