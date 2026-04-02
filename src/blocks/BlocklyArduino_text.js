import * as Blockly from 'blockly';

Blockly.Blocks['text_char'] = {
  init: function() {
    this.setColour('#00979D');
    this.appendDummyInput()
        .appendField(this.newQuote_(true))
        .appendField(new Blockly.FieldTextInput('',Blockly.FieldTextInput.char_validator), 'TEXT')
        .appendField(this.newQuote_(false));
    this.setOutput(true, 'String');
    this.setTooltip(Blockly.Msg.TEXT_CHAR_TOOLTIP);
  },
  newQuote_: function(open) {
	var file = '';
    if (open == this.RTL) {
      file = 'quote3.png';
    } else {
      file = 'quote2.png';
    }
    return new Blockly.FieldImage(Blockly.pathToMedia + file, 7, 12, '"');
  }
};