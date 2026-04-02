import * as Blockly from 'blockly';

/**
 */
// Kid-friendly labels for STEM educators: simple, action-oriented language
Blockly.Msg.SSD1306_WIDTH = "screen width";
Blockly.Msg.SSD1306_HEIGHT = "screen height";
Blockly.Msg.SSD1306_OLED_RESET = "reset pin";
Blockly.Msg.SSD1306_I2C_ADDRESS = "address";
Blockly.Msg.SSD1306_OLED_RESET_NOT_USED = "not used";

Blockly.Msg.SSD1306_INIT_WIDTH_DROPDOWN = [["128","128"],["64","64"]];
Blockly.Msg.SSD1306_INIT_HEIGHT_DROPDOWN = [["64","64"],["32","32"]];
Blockly.Msg.SSD1306_INIT_OLED_RESET_DROPDOWN = [[Blockly.Msg.SSD1306_OLED_RESET_NOT_USED,"-1"],["4","4"]];

Blockly.Msg.SSD1306_INIT_NAME = 'set up OLED display';
Blockly.Msg.SSD1306_INIT_TOOLTIP = 'Put this in setup so the display is ready. Use it once at the start.';

Blockly.Blocks.SSD1306_HUE = '#2980B9';

Blockly.Blocks['SSD1306_init'] = {
  helpUrl: '',
  init: function() {
    this.setColour(Blockly.Blocks.SSD1306_HUE);
//    this.setHelpUrl(Blockly.Msg.SSD1306_HELPURL);
    this.appendDummyInput("")
        .appendField(Blockly.Msg.SSD1306_INIT_NAME);
//        ;
	this.appendDummyInput("")
	  	.setAlign(Blockly.ALIGN_RIGHT)
	  	.appendField(Blockly.Msg.SSD1306_WIDTH)
        	.appendField(new Blockly.FieldDropdown(Blockly.Msg.SSD1306_INIT_WIDTH_DROPDOWN), "WIDTH");
        this.appendDummyInput("")
	  	.setAlign(Blockly.ALIGN_RIGHT)
	  	.appendField(Blockly.Msg.SSD1306_HEIGHT)
                .appendField(new Blockly.FieldDropdown(Blockly.Msg.SSD1306_INIT_HEIGHT_DROPDOWN), "HEIGHT");
	this.appendDummyInput("")
	  	.setAlign(Blockly.ALIGN_RIGHT)
	  	.appendField(Blockly.Msg.SSD1306_OLED_RESET)
                .appendField(new Blockly.FieldDropdown(Blockly.Msg.SSD1306_INIT_OLED_RESET_DROPDOWN), "OLED_RESET");
	this.appendDummyInput("")
	  	.setAlign(Blockly.ALIGN_RIGHT)
	  	.appendField(Blockly.Msg.SSD1306_I2C_ADDRESS)
                .appendField(new Blockly.FieldNumber(0x3C, Blockly.Blocks.math_number.validator), "I2C_ADDRESS");
	//  	.setConstraints(8,0x77,1);
	this.setOutput(true, 'Number');
	this.setPreviousStatement(true, null);
	this.setNextStatement(true, null);
	this.setTooltip(Blockly.Msg.SSD1306_INIT_TOOLTIP);
  }
};

// Kids / basic toolbox: setup-oriented block with selectable common I2C addresses.
Blockly.Msg.SSD1306_INIT_BASIC_TOOLTIP = 'Use this once in setup. Works with the usual 128×64 OLED.';

Blockly.Blocks['SSD1306_init_basic'] = {
  helpUrl: '',
  init: function() {
    this.setColour(Blockly.Blocks.SSD1306_HUE);
    var title =
      typeof Blockly.Msg.BASIC_OLED_SETUP_TITLE === 'string' &&
      Blockly.Msg.BASIC_OLED_SETUP_TITLE.trim()
        ? Blockly.Msg.BASIC_OLED_SETUP_TITLE
        : 'Add OLED display (setup)';
    var addrLabel =
      typeof Blockly.Msg.BASIC_OLED_SETUP_ADDR === 'string' &&
      Blockly.Msg.BASIC_OLED_SETUP_ADDR.trim()
        ? Blockly.Msg.BASIC_OLED_SETUP_ADDR
        : 'address';
    var tooltip =
      typeof Blockly.Msg.BASIC_OLED_SETUP_TOOLTIP === 'string' &&
      Blockly.Msg.BASIC_OLED_SETUP_TOOLTIP.trim()
        ? Blockly.Msg.BASIC_OLED_SETUP_TOOLTIP
        : 'Put this in setup once. Starts OLED at selected I2C address and applies safe text defaults.';
    this.appendDummyInput("")
        .appendField(title)
        .appendField(addrLabel)
        .appendField(
          new Blockly.FieldDropdown([
            ['0x3C', '0x3C'],
            ['0x3D', '0x3D']
          ]),
          'ADDR'
        );
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip(tooltip);
  }
};

Blockly.Msg.SSD1306_DISPLAY_NAME = 'refresh display';

Blockly.Blocks['SSD1306_display'] = {
        init: function() {
	this.setColour(Blockly.Blocks.SSD1306_HUE);
	this.appendDummyInput("")
		.appendField(Blockly.Msg.SSD1306_DISPLAY_NAME);
	this.setInputsInline(false);
	this.setPreviousStatement(true, null);
	this.setNextStatement(true, null);
	}
};

Blockly.Msg.SSD1306_CLEARDISPLAY_NAME = 'clear the screen';
Blockly.Msg.SSD1306_CLEARDISPLAY_TOOLTIP = 'Erase everything on the screen. Good to do before writing something new.';

Blockly.Blocks['SSD1306_clearDisplay'] = {
	init: function() {
	this.setColour(Blockly.Blocks.SSD1306_HUE);
	this.appendDummyInput("")
               	.appendField(Blockly.Msg.SSD1306_CLEARDISPLAY_NAME);
       	this.setInputsInline(false);
       	this.setPreviousStatement(true, null);
       	this.setNextStatement(true, null);
	this.setTooltip(Blockly.Msg.SSD1306_CLEARDISPLAY_TOOLTIP);
        }
};

Blockly.Msg.SSD1306_INVERTDISPLAY_NAME = 'flip screen colours';
Blockly.Msg.SSD1306_INVERTDISPLAY_CHECKBOX_NAME = 'on';

Blockly.Blocks['SSD1306_invertDisplay'] = {
        init: function() {
	this.setColour(Blockly.Blocks.SSD1306_HUE);
        this.appendDummyInput("")
		.appendField(Blockly.Msg.SSD1306_INVERTDISPLAY_NAME);
	this.appendValueInput("ENABLE")
        	.setCheck("Boolean")
		.setAlign(Blockly.ALIGN_RIGHT)
		.appendField(Blockly.Msg.SSD1306_INVERTDISPLAY_CHECKBOX_NAME);
        this.setInputsInline(false);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        }
};

Blockly.Msg.SSD1306_DRAWPIXEL_NAME = 'draw a dot';
Blockly.Msg.SSD1306_XPOS = "column";
Blockly.Msg.SSD1306_YPOS = "row";
Blockly.Msg.SSD1306_COLOUR_FIELDDROPDOWN = [["White", "SSD1306_WHITE"],["Black", "SSD1306_BLACK"], ["Inverse", "SSD1306_INVERSE"]];
Blockly.Msg.SSD1306_COLOUR = 'colour';

Blockly.Blocks['SSD1306_drawPixel'] = {
	init: function() {
	this.setColour(Blockly.Blocks.SSD1306_HUE);
        this.appendDummyInput("")
                .appendField(Blockly.Msg.SSD1306_DRAWPIXEL_NAME);
	this.appendValueInput("XPOS")
                .setCheck("Number")
		.setAlign(Blockly.ALIGN_RIGHT)
		.appendField(Blockly.Msg.SSD1306_XPOS);
       	this.appendValueInput("YPOS")
                .setCheck("Number")
		.setAlign(Blockly.ALIGN_RIGHT)
       	        .appendField(Blockly.Msg.SSD1306_YPOS);
	this.appendDummyInput("")
       		.appendField(Blockly.Msg.SSD1306_COLOUR)
		.appendField(new Blockly.FieldDropdown(Blockly.Msg.SSD1306_COLOUR_FIELDDROPDOWN), "COLOUR");
	this.setInputsInline(false);
       	this.setPreviousStatement(true, null);
       	this.setNextStatement(true, null);
	}
};

Blockly.Msg.SSD1306_DRAWLINE_NAME = 'draw line';
Blockly.Msg.SSD1306_START = 'from';
Blockly.Msg.SSD1306_END = 'to';

Blockly.Blocks['SSD1306_drawLine'] = {
        init: function() {
	this.setColour(Blockly.Blocks.SSD1306_HUE);
	this.appendDummyInput("")
                .appendField(Blockly.Msg.SSD1306_DRAWLINE_NAME);
	this.appendDummyInput("")
                .appendField(Blockly.Msg.SSD1306_START);
	this.appendValueInput("XPOS_1")
                .setCheck("Number")
		.setAlign(Blockly.ALIGN_RIGHT)
                .appendField(Blockly.Msg.SSD1306_XPOS);
        this.appendValueInput("YPOS_1")
                .setCheck("Number")
		.setAlign(Blockly.ALIGN_RIGHT)
                .appendField(Blockly.Msg.SSD1306_YPOS);
	this.appendDummyInput("")
                .appendField(Blockly.Msg.SSD1306_END);
	this.appendValueInput("XPOS_2")
                .setCheck("Number")
		.setAlign(Blockly.ALIGN_RIGHT)
                .appendField(Blockly.Msg.SSD1306_XPOS);
        this.appendValueInput("YPOS_2")
                .setCheck("Number")
		.setAlign(Blockly.ALIGN_RIGHT)
                .appendField(Blockly.Msg.SSD1306_YPOS);
        this.appendDummyInput("")
		.setAlign(Blockly.ALIGN_RIGHT)
                .appendField(Blockly.Msg.SSD1306_COLOUR)
		.appendField(new Blockly.FieldDropdown(Blockly.Msg.SSD1306_COLOUR_FIELDDROPDOWN), "COLOUR");
	this.setInputsInline(false);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        }
};

Blockly.Msg.SSD1306_DRAWRECT_NAME = 'draw rectangle';
Blockly.Msg.SSD1306_FILL = 'fill';

Blockly.Blocks['SSD1306_drawRect'] = {
        init: function() {
	this.appendDummyInput("")
                .appendField(Blockly.Msg.SSD1306_DRAWRECT_NAME);
	this.setColour(Blockly.Blocks.SSD1306_HUE);
	this.appendDummyInput("")
                .appendField(Blockly.Msg.SSD1306_START);
	this.appendValueInput("XPOS_1")
                .setCheck("Number")
		.setAlign(Blockly.ALIGN_RIGHT)
                .appendField(Blockly.Msg.SSD1306_XPOS);
        this.appendValueInput("YPOS_1")
                .setCheck("Number")
		.setAlign(Blockly.ALIGN_RIGHT)
                .appendField(Blockly.Msg.SSD1306_YPOS);
	this.appendDummyInput("")
                .appendField(Blockly.Msg.SSD1306_END);
        this.appendValueInput("XPOS_2")
                .setCheck("Number")
		.setAlign(Blockly.ALIGN_RIGHT)
                .appendField(Blockly.Msg.SSD1306_XPOS);
        this.appendValueInput("YPOS_2")
                .setCheck("Number")
		.setAlign(Blockly.ALIGN_RIGHT)
                .appendField(Blockly.Msg.SSD1306_YPOS);
	this.appendValueInput("FILL")
                .setCheck("Boolean")
		.setAlign(Blockly.ALIGN_RIGHT)
		.appendField(Blockly.Msg.SSD1306_FILL);
        this.appendDummyInput("")
		.setAlign(Blockly.ALIGN_RIGHT)
                .appendField(Blockly.Msg.SSD1306_COLOUR)
                .appendField(new Blockly.FieldDropdown(Blockly.Msg.SSD1306_COLOUR_FIELDDROPDOWN), "COLOUR");
	this.setInputsInline(false);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        }
};


Blockly.Msg.SSD1306_DRAWCIRCLE_NAME = 'draw circle';
Blockly.Msg.SSD1306_RADIUS = 'radius';

Blockly.Blocks['SSD1306_drawCircle'] = {
        init: function() {
	this.appendDummyInput("")
                .appendField(Blockly.Msg.SSD1306_DRAWCIRCLE_NAME);
	this.setColour(Blockly.Blocks.SSD1306_HUE);
	this.appendValueInput("XPOS")
                .setCheck("Number")
		.setAlign(Blockly.ALIGN_RIGHT)
                .appendField(Blockly.Msg.SSD1306_XPOS);
        this.appendValueInput("YPOS")
                .setCheck("Number")
		.setAlign(Blockly.ALIGN_RIGHT)
                .appendField(Blockly.Msg.SSD1306_YPOS);
        this.appendValueInput("RADIUS")
                .setCheck("Number")
		.setAlign(Blockly.ALIGN_RIGHT)
                .appendField(Blockly.Msg.SSD1306_RADIUS);
        this.appendValueInput("FILL")
                .setCheck("Boolean")
		.setAlign(Blockly.ALIGN_RIGHT)
                .appendField(Blockly.Msg.SSD1306_FILL);
        this.appendDummyInput("")
		.setAlign(Blockly.ALIGN_RIGHT)
                .appendField(Blockly.Msg.SSD1306_COLOUR)
                .appendField(new Blockly.FieldDropdown(Blockly.Msg.SSD1306_COLOUR_FIELDDROPDOWN), "COLOUR");
        this.setInputsInline(false);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        }
};

Blockly.Msg.SSD1306_DRAWROUNDRECT_NAME = 'draw round rectangle';

Blockly.Blocks['SSD1306_drawRoundRect'] = {
        init: function() {
        this.appendDummyInput("")
                .appendField(Blockly.Msg.SSD1306_DRAWROUNDRECT_NAME);
        this.setColour(Blockly.Blocks.SSD1306_HUE);
	this.appendValueInput("XPOS_1")
                .setCheck("Number")
		.setAlign(Blockly.ALIGN_RIGHT)
                .appendField(Blockly.Msg.SSD1306_XPOS);
        this.appendValueInput("YPOS_1")
                .setCheck("Number")
		.setAlign(Blockly.ALIGN_RIGHT)
                .appendField(Blockly.Msg.SSD1306_YPOS);
        this.appendValueInput("XPOS_2")
                .setCheck("Number")
		.setAlign(Blockly.ALIGN_RIGHT)
                .appendField(Blockly.Msg.SSD1306_XPOS);
        this.appendValueInput("YPOS_2")
                .setCheck("Number")
		.setAlign(Blockly.ALIGN_RIGHT)
                .appendField(Blockly.Msg.SSD1306_YPOS);
	this.appendValueInput("RADIUS")
		.setCheck("Number")
		.setAlign(Blockly.ALIGN_RIGHT)
		.appendField(Blockly.Msg.SSD1306_RADIUS);
        this.appendValueInput("FILL")
                .setCheck("Boolean")
		.setAlign(Blockly.ALIGN_RIGHT)
                .appendField(Blockly.Msg.SSD1306_FILL);
        this.appendDummyInput("")
		.setAlign(Blockly.ALIGN_RIGHT)
                .appendField(Blockly.Msg.SSD1306_COLOUR)
                .appendField(new Blockly.FieldDropdown(Blockly.Msg.SSD1306_COLOUR_FIELDDROPDOWN), "COLOUR");
        this.setInputsInline(false);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        }
};

Blockly.Msg.SSD1306_DRAWTRIANGLE_NAME = 'draw triangle';

Blockly.Blocks['SSD1306_drawTriangle'] = {
        init: function() {
        this.appendDummyInput("")
                .appendField(Blockly.Msg.SSD1306_DRAWTRIANGLE_NAME);
        this.setColour(Blockly.Blocks.SSD1306_HUE);
	this.appendValueInput("XPOS_1")
                .setCheck("Number")
		.setAlign(Blockly.ALIGN_RIGHT)
                .appendField(Blockly.Msg.SSD1306_XPOS);
        this.appendValueInput("YPOS_1")
                .setCheck("Number")
		.setAlign(Blockly.ALIGN_RIGHT)
                .appendField(Blockly.Msg.SSD1306_YPOS);
        this.appendValueInput("XPOS_2")
                .setCheck("Number")
		.setAlign(Blockly.ALIGN_RIGHT)
                .appendField(Blockly.Msg.SSD1306_XPOS);
        this.appendValueInput("YPOS_2")
                .setCheck("Number")
		.setAlign(Blockly.ALIGN_RIGHT)
                .appendField(Blockly.Msg.SSD1306_YPOS);
	this.appendValueInput("XPOS_3")
                .setCheck("Number")
		.setAlign(Blockly.ALIGN_RIGHT)
                .appendField(Blockly.Msg.SSD1306_XPOS);
        this.appendValueInput("YPOS_3")
                .setCheck("Number")
		.setAlign(Blockly.ALIGN_RIGHT)
                .appendField(Blockly.Msg.SSD1306_YPOS);
        this.appendValueInput("FILL")
                .setCheck("Boolean")
		.setAlign(Blockly.ALIGN_RIGHT)
                .appendField(Blockly.Msg.SSD1306_FILL);
        this.appendDummyInput("")
		.setAlign(Blockly.ALIGN_RIGHT)
                .appendField(Blockly.Msg.SSD1306_COLOUR)
                .appendField(new Blockly.FieldDropdown(Blockly.Msg.SSD1306_COLOUR_FIELDDROPDOWN), "COLOUR");
        this.setInputsInline(false);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        }
};

Blockly.Msg.SSD1306_SETTEXTSIZE_NAME = 'make text this big';
Blockly.Msg.SSD1306_SIZE_NAME = 'size';
Blockly.Msg.SSD1306_SETTEXTSIZE_TOOLTIP = 'Choose how big the letters are.';

Blockly.Blocks['SSD1306_setTextSize'] = {
        init: function() {
        this.appendDummyInput("")
                .appendField(Blockly.Msg.SSD1306_SETTEXTSIZE_NAME);
        this.setColour(Blockly.Blocks.SSD1306_HUE);
        this.appendValueInput("SIZE")
        	.setCheck("Number")
		.setAlign(Blockly.ALIGN_RIGHT)
                .appendField(Blockly.Msg.SSD1306_SIZE_NAME);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setTooltip(Blockly.Msg.SSD1306_SETTEXTSIZE_TOOLTIP);
        }
};

Blockly.Msg.SSD1306_SETTEXTCOLOUR_NAME = 'set text colour';

Blockly.Blocks['SSD1306_setTextColour'] = {
        init: function() {
        this.appendDummyInput("")
                .appendField(Blockly.Msg.SSD1306_SETTEXTCOLOUR_NAME);
        this.setColour(Blockly.Blocks.SSD1306_HUE);
	this.appendDummyInput("")
		.setAlign(Blockly.ALIGN_RIGHT)
		.appendField(new Blockly.FieldDropdown([["White", "SSD1306_WHITE"], ["Black", "SSD1306_BLACK"], ["Inverse", "SSD1306_INVERSE"]]), "COLOUR");
	this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        }
};

Blockly.Msg.SSD1306_SETCURSOR_NAME = 'write from position';
Blockly.Msg.SSD1306_SETCURSOR_TOOLTIP = 'Choose where the next text will appear. Column = left/right, row = top/bottom.';

Blockly.Blocks['SSD1306_setCursor'] = {
        init: function() {
        this.appendDummyInput("")
                .appendField(Blockly.Msg.SSD1306_SETCURSOR_NAME);
        this.setColour(Blockly.Blocks.SSD1306_HUE);
	this.appendValueInput("XPOS")
                .setCheck("Number")
		.setAlign(Blockly.ALIGN_RIGHT)
                .appendField(Blockly.Msg.SSD1306_XPOS);
	this.appendValueInput("YPOS")
                .setCheck("Number")
		.setAlign(Blockly.ALIGN_RIGHT)
                .appendField(Blockly.Msg.SSD1306_YPOS);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setTooltip(Blockly.Msg.SSD1306_SETCURSOR_TOOLTIP);
        }
};

Blockly.Msg.SSD1306_CP437_NAME = 'CP437 character set';
Blockly.Msg.SSD1306_ENABLE = 'enable';

Blockly.Blocks['SSD1306_cp437'] = {
        init: function() {
        this.appendDummyInput("")
                .appendField(Blockly.Msg.SSD1306_CP437_NAME);
        this.setColour(Blockly.Blocks.SSD1306_HUE);
        this.appendValueInput("ENABLE")
                .setCheck("Boolean")
                .appendField(Blockly.Msg.SSD1306_ENABLE);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        }
};

Blockly.Msg.SSD1306_CHARACTER = "character";
Blockly.Msg.SSD1306_WRITE_NAME = "write";

Blockly.Blocks['SSD1306_write'] = {
        init: function() {
        this.appendDummyInput("")
                .appendField(Blockly.Msg.SSD1306_WRITE_NAME);
        this.setColour(Blockly.Blocks.SSD1306_HUE);
        this.appendValueInput("CHAR")
                .setCheck("String")
                .appendField(Blockly.Msg.SSD1306_CHARACTER);
	this.setInputsInline(false);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        }
};

Blockly.Msg.SSD1306_PRINTLN_NAME = "write a new line";
Blockly.Msg.SSD1306_STRING = "text";
Blockly.Msg.SSD1306_PRINTLN_TOOLTIP = 'Write text on the screen and then go to the next line (like pressing Enter).';

Blockly.Blocks['SSD1306_println'] = {
        init: function() {
        this.appendDummyInput("")
                .appendField(Blockly.Msg.SSD1306_PRINTLN_NAME);
        this.setColour(Blockly.Blocks.SSD1306_HUE);
        this.appendValueInput("STRING")
                .setCheck("String")
                .appendField(Blockly.Msg.SSD1306_STRING);
        this.setInputsInline(false);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setTooltip(Blockly.Msg.SSD1306_PRINTLN_TOOLTIP);
        }
};

Blockly.Msg.SSD1306_PRINT_NAME = "write";
Blockly.Msg.SSD1306_PRINT_TOOLTIP = 'Write text on the screen. Use "write a new line" to start a new line after.';

Blockly.Blocks['SSD1306_print'] = {
        init: function() {
        this.appendDummyInput("")
                .appendField(Blockly.Msg.SSD1306_PRINT_NAME);
        this.setColour(Blockly.Blocks.SSD1306_HUE);
        this.appendValueInput("STRING")
                .setCheck("String")
                .appendField(Blockly.Msg.SSD1306_STRING);
        this.setInputsInline(false);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setTooltip(Blockly.Msg.SSD1306_PRINT_TOOLTIP);
        }
};

Blockly.Msg.SSD1306_WIDTH_NAME = "width";

Blockly.Blocks['SSD1306_width'] = {
        init: function() {
        this.appendDummyInput("")
                .appendField(Blockly.Msg.SSD1306_WIDTH_NAME);
        this.setColour(Blockly.Blocks.SSD1306_HUE);
	this.setOutput(true, 'Number');
	this.setPreviousStatement(false, null);
        this.setNextStatement(false, null);
        }
};

Blockly.Msg.SSD1306_HEIGHT_NAME = "height";

Blockly.Blocks['SSD1306_height'] = {
        init: function() {
        this.appendDummyInput("")
                .appendField(Blockly.Msg.SSD1306_HEIGHT_NAME);
        this.setColour(Blockly.Blocks.SSD1306_HUE);
        this.setOutput(true, 'Number');
        this.setPreviousStatement(false, null);
        this.setNextStatement(false, null);
        }
};

Blockly.Msg.SSD1306_STARTSCROLL_NAME = "start scrolling";
Blockly.Msg.SSD1306_SCROLL_DIRECTION_FIELDDROPDOWN = [["Right", "SSD1306_RIGHT"], ["Left", "SSD1306_LEFT"], ["Diagonal Right", "SSD1306_DIAGRIGHT"], ["Diagonal Left", "SSD1306_DIAGLEFT"]];
Blockly.Msg.SSD1306_SCROLL_DIRECTION = "direction";
Blockly.Msg.SSD1306_SCROLL_START_ROW = "start row (0-7)";
Blockly.Msg.SSD1306_SCROLL_END_ROW = "end row (0-7)";

Blockly.Blocks['SSD1306_startscroll'] = {
	init: function() {
	this.appendDummyInput()
		.appendField(Blockly.Msg.SSD1306_STARTSCROLL_NAME);
	this.setColour(Blockly.Blocks.SSD1306_HUE);
	this.appendValueInput("START_ROW")
                .setCheck("Number")
                .setAlign(Blockly.ALIGN_RIGHT)
                .appendField(Blockly.Msg.SSD1306_SCROLL_START_ROW);
	this.setColour(Blockly.Blocks.SSD1306_HUE);
        this.appendValueInput("END_ROW")
                .setCheck("Number")
                .setAlign(Blockly.ALIGN_RIGHT)
                .appendField(Blockly.Msg.SSD1306_SCROLL_END_ROW);
	this.appendDummyInput("")
                .setAlign(Blockly.ALIGN_RIGHT)
                .appendField(Blockly.Msg.SSD1306_SCROLL_DIRECTION)
                .appendField(new Blockly.FieldDropdown(Blockly.Msg.SSD1306_SCROLL_DIRECTION_FIELDDROPDOWN), "SCROLL_DIRECTION");
        this.setInputsInline(false);
	this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
	}
};


Blockly.Msg.SSD1306_STOPSCROLL_NAME = "stop scrolling";
Blockly.Blocks['SSD1306_stopscroll'] = {
        init: function() {
        this.appendDummyInput()
                .appendField(Blockly.Msg.SSD1306_STOPSCROLL_NAME);
        this.setColour(Blockly.Blocks.SSD1306_HUE);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
	}
};




