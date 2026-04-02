import * as Blockly from 'blockly';

Blockly.Blocks['array_declare'] = {
  init: function() {
    this.appendDummyInput()
        .appendField('create')
        .appendField(new Blockly.FieldDropdown([['list', 'd1'], ['array', 'd2']]), 'dim')
        .appendField(new Blockly.FieldVariable('myArray'), 'VAR')
        .appendField('as')
        .appendField(new Blockly.FieldDropdown(Blockly.Types.getValidTypeArray()), 'type');
    this.appendValueInput('contenu')
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField(new Blockly.FieldDropdown([['size', 'c1'], ['with values', 'c2']]), 'choix');
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(Blockly.Blocks.array ? Blockly.Blocks.array.HUE : '#745BA5');
    this.setTooltip('Declare an array variable.');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['creer_tableau'] = {
  init: function() {
    this.appendDummyInput()
        .appendField('create array')
        .appendField(new Blockly.FieldVariable('myArray'), 'VAR')
        .appendField('as')
        .appendField(new Blockly.FieldDropdown(Blockly.Types.getValidTypeArray()), 'type');
    this.appendDummyInput()
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField('dimensions')
        .appendField(new Blockly.FieldDropdown([['1','1'],['2','2'],['3','3'],['4','4'],['5','5']], function(option) { this.getSourceBlock().updateShape_(option); }), 'dim');
    this.appendValueInput('D0')
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField(new Blockly.FieldDropdown([['size', 'c1'], ['contents', 'c2']]), 'choix');
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(Blockly.Blocks.array ? Blockly.Blocks.array.HUE : '#745BA5');
    this.setTooltip('Create a multi-dimensional array.');
    this.setHelpUrl('');
  },
  mutationToDom: function() {
    var container = document.createElement('mutation');
    container.setAttribute('dim', this.getFieldValue('dim'));
    return container;
  },
  domToMutation: function(xmlElement) {
    this.updateShape_(xmlElement.getAttribute('dim'));
  },
  updateShape_: function(option) {
    for (var i = 1; i < 6; i++) { if (this.getInput('D' + i)) this.removeInput('D' + i); }
    var count = parseInt(option, 10) || 1;
    for (var i = 1; i < count; i++) this.appendValueInput('D' + i);
  }
};

Blockly.Blocks['fixer_tableau'] = {
  init: function() {
    this.appendDummyInput()
        .appendField('set array')
        .appendField(new Blockly.FieldVariable('myArray'), 'VAR')
        .appendField('dim')
        .appendField(new Blockly.FieldDropdown([['1','1'],['2','2'],['3','3'],['4','4'],['5','5']], function(option) { this.getSourceBlock().updateShape_(option); }), 'dim');
    this.appendValueInput('value').setAlign(Blockly.ALIGN_RIGHT).appendField('value');
    this.appendValueInput('D0').setCheck('Number').setAlign(Blockly.ALIGN_RIGHT).appendField('index');
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(Blockly.Blocks.array ? Blockly.Blocks.array.HUE : '#745BA5');
    this.setTooltip('Set a value at a specific array index.');
    this.setHelpUrl('');
  },
  mutationToDom: function() {
    var container = document.createElement('mutation');
    container.setAttribute('dim', this.getFieldValue('dim'));
    return container;
  },
  domToMutation: function(xmlElement) {
    this.updateShape_(xmlElement.getAttribute('dim'));
  },
  updateShape_: function(option) {
    for (var i = 1; i < 6; i++) { if (this.getInput('D' + i)) this.removeInput('D' + i); }
    var count = parseInt(option, 10) || 1;
    for (var i = 1; i < count; i++) this.appendValueInput('D' + i).setCheck('Number').setAlign(Blockly.ALIGN_RIGHT).appendField('index ' + (i + 1));
  }
};

Blockly.Blocks['tableau_getIndex'] = {
  init: function() {
    this.appendDummyInput()
        .appendField('get from array')
        .appendField(new Blockly.FieldVariable('myArray'), 'VAR')
        .appendField('dim')
        .appendField(new Blockly.FieldDropdown([['1','1'],['2','2'],['3','3'],['4','4'],['5','5']], function(option) { this.getSourceBlock().updateShape_(option); }), 'dim');
    this.appendValueInput('D0').setCheck('Number').setAlign(Blockly.ALIGN_RIGHT).appendField('index');
    this.setOutput(true, null);
    this.setInputsInline(false);
    this.setColour(Blockly.Blocks.array ? Blockly.Blocks.array.HUE : '#745BA5');
    this.setTooltip('Get a value from an array at a specific index.');
    this.setHelpUrl('');
  },
  mutationToDom: function() {
    var container = document.createElement('mutation');
    container.setAttribute('dim', this.getFieldValue('dim'));
    return container;
  },
  domToMutation: function(xmlElement) {
    this.updateShape_(xmlElement.getAttribute('dim'));
  },
  updateShape_: function(option) {
    for (var i = 1; i < 6; i++) { if (this.getInput('D' + i)) this.removeInput('D' + i); }
    var count = parseInt(option, 10) || 1;
    for (var i = 1; i < count; i++) this.appendValueInput('D' + i).setCheck('Number').setAlign(Blockly.ALIGN_RIGHT).appendField('index ' + (i + 1));
  }
};

Blockly.Blocks['number'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(new Blockly.FieldNumber(0), 'NUM');
    this.setOutput(true, 'Number');
    this.setColour(Blockly.Blocks.math ? Blockly.Blocks.math.HUE : '#5B67A5');
    this.setTooltip('A numeric value.');
    this.setHelpUrl('');
  }
};
