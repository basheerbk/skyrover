import * as Blockly from 'blockly';

Blockly.Blocks['HX711_init'] = {
  init: function() {
	this.setHelpUrl(Blockly.Msg.HX711_HELPURL);
    this.setColour('#00979D');
    this.appendDummyInput()
        .appendField(Blockly.Msg.HX711_INIT_TITLE);
    this.appendDummyInput()
        ;
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip(Blockly.Msg.HX711_INIT_TOOLTIP);
  }
};

Blockly.Blocks['HX711_read'] = {
  init: function() {
	this.setHelpUrl(Blockly.Msg.HX711_HELPURL);
    this.setColour('#00979D');
    this.appendDummyInput()
        .appendField(Blockly.Msg.HX711_READ_TITLE)
		.setAlign(Blockly.ALIGN_LEFT);
    this.appendDummyInput()
        ;
    this.appendValueInput("CALIBRATION")
        .appendField(Blockly.Msg.HX711_READ_TEXT)
		.setCheck("Number");
    this.setOutput(true, 'Number');
    this.setTooltip(Blockly.Msg.HX711_READ_TOOLTIP);
  }
};