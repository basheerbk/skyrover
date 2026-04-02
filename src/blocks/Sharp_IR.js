import * as Blockly from 'blockly';

Blockly.Blocks['Sharp_IR_attach'] = {
  init: function() {
    this.setColour('#000000');
    this.appendDummyInput()
        .appendField('Sharp IR Sensor');
    this.appendDummyInput()
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField('name')
        .appendField(new Blockly.FieldTextInput('mySharp'), 'SHARP_IR_NAME');
    this.appendDummyInput()
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField('model')
        .appendField(new Blockly.FieldDropdown([
          ['GP2Y0A21YK0F (20-150cm)', 'GP2Y0A21YK0F'],
          ['GP2Y0A02YK0F (20-150cm)', 'GP2Y0A02YK0F'],
          ['GP2Y0A710K0F (100-500cm)', 'GP2Y0A710K0F'],
          ['GP2Y0A41SK0F (4-30cm)', 'GP2Y0A41SK0F']
        ]), 'SHARP_IR_MODEL');
    this.appendValueInput('PIN')
        .setCheck('Number')
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField('pin#');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip('Initializes a Sharp IR distance sensor.');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['Sharp_IR_read'] = {
  init: function() {
    this.setColour('#000000');
    this.appendDummyInput()
        .appendField('Sharp IR read distance from')
        .appendField(new Blockly.FieldTextInput('mySharp'), 'SHARP_IR_NAME');
    this.setOutput(true, 'Number');
    this.setTooltip('Returns the distance measured by the Sharp IR sensor in cm.');
    this.setHelpUrl('');
  }
};
