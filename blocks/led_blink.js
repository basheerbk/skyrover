Blockly.Blocks['led_blink'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Blink built-in LED");
    this.appendValueInput("DELAY")
        .setCheck("Number")
        .appendField("delay (ms)");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#FF5722');
    this.setTooltip("Blink the built-in LED on the Arduino board with a delay.");
    this.setHelpUrl("");
  }
}; 