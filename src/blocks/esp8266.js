import * as Blockly from 'blockly';

Blockly.Blocks['esp8266_init'] = {
  init: function() {
    this.setColour(Blockly.Blocks.esp8266 ? Blockly.Blocks.esp8266.HUE : '#4CAF50');
    this.appendDummyInput()
        .appendField('ESP8266 WiFi Init');
    this.appendDummyInput()
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField('IP type')
        .appendField(new Blockly.FieldDropdown([['dynamic', 'dynamic'], ['static', 'static']], function(option) { this.getSourceBlock().updateShape1_(option); }), 'staticdynamic');
    this.appendDummyInput()
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField('SSID')
        .appendField(new Blockly.FieldTextInput('monWIFI'), 'SSID');
    this.appendDummyInput()
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField('Password')
        .appendField(new Blockly.FieldTextInput('123456789'), 'KEY');
    this.appendDummyInput()
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField(new Blockly.FieldDropdown([['client', 'client'], ['server', 'serveur']], function(option) { this.getSourceBlock().updateShape2_(option); }), 'clientserveur');
    this.setPreviousStatement(false);
    this.setNextStatement(false);
    this.setTooltip('Initialize ESP8266 WiFi connection.');
    this.setHelpUrl('');
  },
  updateShape1_: function(option) {
    var inputExists = this.getInput('D0');
    if (inputExists) {
      this.removeInput('D0');
      if (this.getInput('D1')) this.removeInput('D1');
      if (this.getInput('D2')) this.removeInput('D2');
    }
    if (option === 'static') {
      this.appendDummyInput('D0').setAlign(Blockly.ALIGN_RIGHT).appendField('IP').appendField(new Blockly.FieldTextInput('192'), 'IPa').appendField('.').appendField(new Blockly.FieldTextInput('168'), 'IPb').appendField('.').appendField(new Blockly.FieldTextInput('1'), 'IPc').appendField('.').appendField(new Blockly.FieldTextInput('77'), 'IPd');
      this.appendDummyInput('D1').setAlign(Blockly.ALIGN_RIGHT).appendField('Subnet').appendField(new Blockly.FieldTextInput('255'), 'MASKa').appendField('.').appendField(new Blockly.FieldTextInput('255'), 'MASKb').appendField('.').appendField(new Blockly.FieldTextInput('255'), 'MASKc').appendField('.').appendField(new Blockly.FieldTextInput('0'), 'MASKd');
      this.appendDummyInput('D2').setAlign(Blockly.ALIGN_RIGHT).appendField('Gateway').appendField(new Blockly.FieldTextInput('1'), 'GATEWAY');
    }
  },
  updateShape2_: function(option) {
    var inputExists = this.getInput('V0');
    if (inputExists) this.removeInput('V0');
    if (option === 'serveur') {
      this.appendValueInput('V0').setAlign(Blockly.ALIGN_RIGHT).appendField('Port');
    }
  },
  mutationToDom: function() {
    var container = document.createElement('mutation');
    container.setAttribute('clientserveur', this.getFieldValue('clientserveur'));
    container.setAttribute('staticdynamic', this.getFieldValue('staticdynamic'));
    return container;
  },
  domToMutation: function(xmlElement) {
    this.updateShape2_(xmlElement.getAttribute('clientserveur'));
    this.updateShape1_(xmlElement.getAttribute('staticdynamic'));
  }
};

Blockly.Blocks['esp8266_send'] = {
  init: function() {
    this.setColour(Blockly.Blocks.esp8266 ? Blockly.Blocks.esp8266.HUE : '#4CAF50');
    this.appendValueInput('message').appendField('send');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setTooltip('Send a message via ESP8266.');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['esp8266_send_html'] = {
  init: function() {
    this.setColour(Blockly.Blocks.esp8266 ? Blockly.Blocks.esp8266.HUE : '#4CAF50');
    this.appendDummyInput().appendField('send an HTML page');
    this.appendStatementInput('HEAD').appendField('<head>');
    this.appendStatementInput('BODY').appendField('<body>');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setTooltip('Send an HTML page via ESP8266.');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['esp8266_wait_server'] = {
  init: function() {
    this.setColour(Blockly.Blocks.esp8266 ? Blockly.Blocks.esp8266.HUE : '#4CAF50');
    this.appendDummyInput().appendField('wait for a client request');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setTooltip('Wait for a client request on ESP8266 server.');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['esp8266_wait_client'] = {
  init: function() {
    this.setColour(Blockly.Blocks.esp8266 ? Blockly.Blocks.esp8266.HUE : '#4CAF50');
    this.appendValueInput('host').appendField('wait for server response from host');
    this.appendValueInput('port').setAlign(Blockly.ALIGN_RIGHT).appendField('port');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setTooltip('Connect to a server via ESP8266.');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['esp8266_request_indexof'] = {
  init: function() {
    this.setColour(Blockly.Blocks.esp8266 ? Blockly.Blocks.esp8266.HUE : '#4CAF50');
    this.appendValueInput('CASE0').setAlign(Blockly.ALIGN_RIGHT).appendField('if request contains');
    this.appendStatementInput('DO0').setAlign(Blockly.ALIGN_RIGHT).appendField('do');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setTooltip('Check if the HTTP request contains a specific string.');
    this.setHelpUrl('');
    this.casebreakCount_ = 0;
  },
  mutationToDom: function() {
    if (!this.casebreakCount_) return null;
    var container = document.createElement('mutation');
    container.setAttribute('casebreak', this.casebreakCount_);
    return container;
  },
  domToMutation: function(xmlElement) {
    this.casebreakCount_ = parseInt(xmlElement.getAttribute('casebreak'), 10) || 0;
    for (var i = 1; i <= this.casebreakCount_; i++) {
      this.appendValueInput('CASE' + i).setAlign(Blockly.ALIGN_RIGHT).appendField('contains');
      this.appendStatementInput('DO' + i).appendField('do');
    }
  }
};
