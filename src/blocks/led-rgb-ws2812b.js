import * as Blockly from 'blockly';

// define blocks
Blockly.Blocks['lp2i_ledRGB_WS2812B_init'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(Blockly.Msg.lp2i_ledRGB_WS2812B_init)
        .setAlign(Blockly.ALIGN_RIGHT)
		.appendField(
				new Blockly.FieldInstance('WS2812_fieldInstance',
										  Blockly.Msg.lp2i_ledRGB_WS2812B_DEFAULT_NAME,
										  false, false, false),
				'NEOPIXEL_NAME')
		;
    this.appendValueInput("Pin_LedRGB_init")
		.setCheck('Number')
        .setAlign(Blockly.ALIGN_RIGHT)
		.appendField(Blockly.Msg.lp2i_ledRGB_WS2812B_init_Pin);
    this.appendValueInput("Number_of_Pixels")
		.setCheck('Number')
        .setAlign(Blockly.ALIGN_RIGHT)
		.appendField(Blockly.Msg.lp2i_ledRGB_WS2812B_init_Number_of_Pixels);
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#00979D');
    this.setTooltip('');
    this.setHelpUrl('http://blogpeda.ac-poitiers.fr/techno-jean-mace/2016/02/07/utilisation-de-modules-led-rgb-ws2812b-avec-blockly-arduino/');
  }
};

Blockly.Blocks['lp2i_ledRGB_WS2812B_setPixelColor'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(Blockly.Msg.lp2i_ledRGB_WS2812B_setPixelColor)
		.appendField(
				new Blockly.FieldInstance('WS2812_fieldInstance',
										  Blockly.Msg.lp2i_ledRGB_WS2812B_DEFAULT_NAME,
										  false, false, false),
				'NEOPIXEL_NAME')
		;
    this.appendValueInput("Red")
		.setCheck('Number')
        .setAlign(Blockly.ALIGN_RIGHT)
		.appendField(Blockly.Msg.lp2i_ledRGB_WS2812B_setPixelColor_Red);
    this.appendValueInput("Green")
		.setCheck('Number')
        .setAlign(Blockly.ALIGN_RIGHT)
		.appendField(Blockly.Msg.lp2i_ledRGB_WS2812B_setPixelColor_Green);
    this.appendValueInput("Blue")
		.setCheck('Number')
        .setAlign(Blockly.ALIGN_RIGHT)
		.appendField(Blockly.Msg.lp2i_ledRGB_WS2812B_setPixelColor_Blue);
    this.appendValueInput("Pixel_number")
		.setCheck('Number')
        .setAlign(Blockly.ALIGN_RIGHT)
		.appendField(Blockly.Msg.lp2i_ledRGB_WS2812B_setPixelColor_Pixel_Number);
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#00979D');
    this.setTooltip('');
    this.setHelpUrl('http://blogpeda.ac-poitiers.fr/techno-jean-mace/2016/02/07/utilisation-de-modules-led-rgb-ws2812b-avec-blockly-arduino/');
  },
  /**
   * Called whenever anything on the workspace changes.
   * It checks/warns if the selected stepper instance has a config block.
   * @this Blockly.Block
   */
  onchange: function() {
    if (!this.workspace) return;  // Block has been deleted.

    var instanceName = this.getFieldValue('NEOPIXEL_NAME')
    if (Blockly.Instances.isInstancePresent(instanceName, 'WS2812_fieldInstance', this)) {
      this.setWarningText(null);
    } else {
      this.setWarningText(
        Blockly.Msg.COMPONENT_WARN.replace(
            '%1', Blockly.Msg.NEOPIXEL_COMPONENT).replace(
                '%2', instanceName));
    }
  }
};

Blockly.Blocks['lp2i_ledRGB_WS2812B_setBrightness'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(Blockly.Msg.lp2i_ledRGB_WS2812B_setPixelColor)
		.appendField(
				new Blockly.FieldInstance('WS2812_fieldInstance',
										  Blockly.Msg.lp2i_ledRGB_WS2812B_DEFAULT_NAME,
										  false, false, false),
				'NEOPIXEL_NAME')
		;
    this.appendValueInput("Brightness")
		.setCheck('Number')
        .setAlign(Blockly.ALIGN_RIGHT)
		.appendField(Blockly.Msg.lp2i_ledRGB_WS2812B_Brightness);		
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#00979D');
    this.setTooltip('');
    this.setHelpUrl('http://blogpeda.ac-poitiers.fr/techno-jean-mace/2016/02/07/utilisation-de-modules-led-rgb-ws2812b-avec-blockly-arduino/');
  },
  /**
   * Called whenever anything on the workspace changes.
   * It checks/warns if the selected stepper instance has a config block.
   * @this Blockly.Block
   */
  onchange: function() {
    if (!this.workspace) return;  // Block has been deleted.

    var instanceName = this.getFieldValue('NEOPIXEL_NAME')
    if (Blockly.Instances.isInstancePresent(instanceName, 'WS2812_fieldInstance', this)) {
      this.setWarningText(null);
    } else {
      this.setWarningText(
        Blockly.Msg.COMPONENT_WARN.replace(
            '%1', Blockly.Msg.NEOPIXEL_COMPONENT).replace(
                '%2', instanceName));
    }
  }
};