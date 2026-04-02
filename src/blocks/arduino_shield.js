import * as Blockly from 'blockly';

/**
 * Visual Blocks Editor
 * Shield Arduino
 * 
 * Didier Dumas - 2016
 */
Blockly.Blocks['LCD_Keypad_Shield_DFR_09'] = {
  init: function() {
    this.setColour('#00979D');
	this.setHelpUrl(Blockly.Msg.LCD_SHIELD_PRINT_HELPURL);
    this.appendDummyInput()
        .appendField(Blockly.Msg.LCD_SHIELD_PRINT_TEXT)
        
    this.appendValueInput("TEXT1")
        .setCheck('String')
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField(Blockly.Msg.LCD_SHIELD_PRINT_INPUT1);
    this.appendValueInput("TEXT2")
        .setCheck('String')
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField(Blockly.Msg.LCD_SHIELD_PRINT_INPUT2);
    this.appendValueInput("DELAY_TIME")
        .setCheck('Number')
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField(Blockly.Msg.LCD_SHIELD_PRINT_INPUT3);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip(Blockly.Msg.LCD_SHIELD_PRINT_TOOLTIP);
  }
};

Blockly.Blocks['LCD_Keypad_Shield_DFR_09_lc'] = {
  init: function() {
    this.setColour('#00979D');
	this.setHelpUrl(Blockly.Msg.LCD_SHIELD_PRINT_HELPURL);
    this.appendDummyInput()
        .appendField(Blockly.Msg.LCD_SHIELD_PRINT_TEXT)
        ;
	this.appendValueInput("ligne")
        .setCheck("Number")
		.setAlign(Blockly.ALIGN_RIGHT)
        .appendField("écrire à la ligne");
    this.appendValueInput("colonne")
        .setCheck("Number")
		.setAlign(Blockly.ALIGN_RIGHT)
        .appendField("écrire à partir de la colonne");
	this.appendValueInput("TEXT4")
        .setCheck('String')
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Message à afficher");
    //this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip('');
  }
};

Blockly.Blocks['LCD_Keypad_Shield_DFR_09_RAZ'] = {
  init: function() {
    this.setColour('#00979D');
	this.setHelpUrl(Blockly.Msg.LCD_SHIELD_PRINT_HELPURL);
    this.appendDummyInput()
        .appendField(Blockly.Msg.LCD_SHIELD_PRINT_TEXT)
        
	this.appendDummyInput()
		.setAlign(Blockly.ALIGN_CENTRE)
		.appendField("Effacer l'écran")
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip('');
  }
};

Blockly.Blocks['LCD_Keypad_Shield_DFR_09_Buttons'] = {
  init: function() {
    this.setColour('#00979D');
	this.setHelpUrl(Blockly.Msg.LCD_SHIELD_PRINT_HELPURL);
    this.appendDummyInput()
        .appendField(Blockly.Msg.LCD_SHIELD_PRINT_TEXT)
        ;
    this.appendDummyInput()
		.setAlign(Blockly.ALIGN_RIGHT)
	    .appendField(Blockly.Msg.LCD_SHIELD_PRINT_INPUT4)
        .appendField(new Blockly.FieldDropdown(Blockly.Msg.LCD_SHIELD_BTN_CHOICE), "BTN");
    this.setOutput(true, 'Boolean');
    this.setTooltip('');
  }
};

Blockly.Blocks['Bluetooth_Shield_duinoFun'] = {
  init: function() {
    this.setColour("#8ec31f");
	this.setHelpUrl('http://www.seeedstudio.com/wiki/Bluetooth_Shield');
    this.appendDummyInput("")
        .appendField('Initialise le module Bluetooth duinoFun');
	this.appendDummyInput("")
        .setAlign(Blockly.ALIGN_RIGHT)
        
    this.appendDummyInput("")
        .setAlign(Blockly.ALIGN_RIGHT)
		.appendField('cavaliers sur les broches');
    this.appendValueInput("BT_RX", 'Number')
        .setCheck('Number')
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("RX ");
    this.appendValueInput("BT_TX", 'Number')
        .setCheck('Number')
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("TX ");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip(Blockly.Msg.TECHNOZONE51_TEXT158);
  }
};