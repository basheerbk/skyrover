import * as Blockly from 'blockly';

Blockly.Blocks['inout_angle_maths'] = {
  init: function() {
    this.setColour('#40BF4A');
	this.setHelpUrl('https://developers.google.com/blockly/custom-blocks/defining-blocks#appendfield');
    this.appendDummyInput("")
        .appendField("angle")
        .appendField(new Blockly.FieldAngle("90"), "ANGLE");
    this.setOutput(true, "Number");
    this.setTooltip('angle °');
  }
};

Blockly.Blocks['math_interval'] = {
    init: function() {
        var OPERATORS = [
            ["<", "LT"],
            ["\u2264", "LTE"],
            [">", "GT"],
            ["\u2265", "GTE"]
        ];
        this.appendValueInput("inf").setCheck("Number");
        this.appendDummyInput().appendField(new Blockly.FieldDropdown(OPERATORS), "comp_inf");
        this.appendValueInput("valeur").setCheck(null);
        this.appendDummyInput().appendField(new Blockly.FieldDropdown(OPERATORS), "comp_sup");
        this.appendValueInput("sup").setCheck("Number");
        this.setOutput(true, "Boolean");
        this.setColour('#40BF4A');
        this.setTooltip(Blockly.Msg.compare);
        this.setHelpUrl("")
    }
};