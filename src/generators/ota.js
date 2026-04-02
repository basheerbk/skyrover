import '../compat_shim.js';

/**
 * @fileoverview OTA (Over-The-Air) blocks for Arduino
 * @author BlocklyArduino
 */

Blockly.Arduino.ota_setup_simple = function(block) {
  var ssid = block.getFieldValue('SSID');
  var password = block.getFieldValue('PASSWORD');
  var otaPassword = block.getFieldValue('OTA_PASSWORD');
  var port = block.getFieldValue('PORT');
  
  // Add required includes
  Blockly.Arduino.addInclude('ota', '#include <ArduinoOTA.h>');
  Blockly.Arduino.addInclude('wifi', '#include <WiFi.h>');
  
  // Add setup code
  var setupCode = '// Connect to WiFi\n';
  setupCode += 'Serial.println("Connecting to WiFi...");\n';
  setupCode += 'WiFi.begin("' + ssid + '", "' + password + '");\n';
  setupCode += 'while (WiFi.status() != WL_CONNECTED) {\n';
  setupCode += '  delay(500);\n';
  setupCode += '  Serial.print(".");\n';
  setupCode += '}\n';
  setupCode += 'Serial.println("");\n';
  setupCode += 'Serial.println("WiFi connected!");\n';
  setupCode += 'Serial.print("IP address: ");\n';
  setupCode += 'Serial.println(WiFi.localIP());\n';
  setupCode += '\n';
  setupCode += '// Setup OTA\n';
  setupCode += 'Serial.println("Setting up OTA...");\n';
  setupCode += 'ArduinoOTA.setPort(' + port + ');\n';
  setupCode += 'ArduinoOTA.setHostname("BlocklyArduino");\n';
  setupCode += 'ArduinoOTA.setPassword("' + otaPassword + '");\n';
  setupCode += 'ArduinoOTA.onStart([]() {\n';
  setupCode += '  String type = (ArduinoOTA.getCommand() == U_FLASH) ? "sketch" : "filesystem";\n';
  setupCode += '  Serial.println("Start updating " + type);\n';
  setupCode += '});\n';
  setupCode += 'ArduinoOTA.onEnd([]() {\n';
  setupCode += '  Serial.println("\\nEnd");\n';
  setupCode += '});\n';
  setupCode += 'ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {\n';
  setupCode += '  Serial.printf("Progress: %u%%\\r", (progress / (total / 100)));\n';
  setupCode += '});\n';
  setupCode += 'ArduinoOTA.onError([](ota_error_t error) {\n';
  setupCode += '  Serial.printf("Error[%u]: ", error);\n';
  setupCode += '  if (error == OTA_AUTH_ERROR) Serial.println("Auth Failed");\n';
  setupCode += '  else if (error == OTA_BEGIN_ERROR) Serial.println("Begin Failed");\n';
  setupCode += '  else if (error == OTA_CONNECT_ERROR) Serial.println("Connect Failed");\n';
  setupCode += '  else if (error == OTA_RECEIVE_ERROR) Serial.println("Receive Failed");\n';
  setupCode += '  else if (error == OTA_END_ERROR) Serial.println("End Failed");\n';
  setupCode += '});\n';
  setupCode += 'ArduinoOTA.begin();\n';
  setupCode += 'Serial.println("OTA Ready! You can now upload wirelessly.");\n';
  
  Blockly.Arduino.setups_['setup_ota_simple'] = setupCode;
  
  return '';
};

Blockly.Arduino.ota_init = function(block) {
  var port = block.getFieldValue('PORT');
  var password = block.getFieldValue('PASSWORD');
  
  // Add required includes
  Blockly.Arduino.addInclude('ota', '#include <ArduinoOTA.h>');
  
  // Add setup code
  var setupCode = 'ArduinoOTA.setPort(' + port + ');\n';
  setupCode += 'ArduinoOTA.setHostname("BlocklyArduino");\n';
  setupCode += 'ArduinoOTA.setPassword("' + password + '");\n';
  setupCode += 'ArduinoOTA.onStart([]() {\n';
  setupCode += '  String type = (ArduinoOTA.getCommand() == U_FLASH) ? "sketch" : "filesystem";\n';
  setupCode += '  Serial.println("Start updating " + type);\n';
  setupCode += '});\n';
  setupCode += 'ArduinoOTA.onEnd([]() {\n';
  setupCode += '  Serial.println("\\nEnd");\n';
  setupCode += '});\n';
  setupCode += 'ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {\n';
  setupCode += '  Serial.printf("Progress: %u%%\\r", (progress / (total / 100)));\n';
  setupCode += '});\n';
  setupCode += 'ArduinoOTA.onError([](ota_error_t error) {\n';
  setupCode += '  Serial.printf("Error[%u]: ", error);\n';
  setupCode += '  if (error == OTA_AUTH_ERROR) Serial.println("Auth Failed");\n';
  setupCode += '  else if (error == OTA_BEGIN_ERROR) Serial.println("Begin Failed");\n';
  setupCode += '  else if (error == OTA_CONNECT_ERROR) Serial.println("Connect Failed");\n';
  setupCode += '  else if (error == OTA_RECEIVE_ERROR) Serial.println("Receive Failed");\n';
  setupCode += '  else if (error == OTA_END_ERROR) Serial.println("End Failed");\n';
  setupCode += '});\n';
  setupCode += 'ArduinoOTA.begin();\n';
  
  Blockly.Arduino.setups_['setup_ota'] = setupCode;
  
  return '';
};

Blockly.Arduino.ota_handle = function(block) {
  return 'ArduinoOTA.handle();\n';
};

Blockly.Arduino.ota_check_update = function(block) {
  return ['ArduinoOTA.available()', Blockly.Arduino.ORDER_ATOMIC];
};

Blockly.Arduino.ota_get_progress = function(block) {
  return ['ArduinoOTA.getProgress()', Blockly.Arduino.ORDER_ATOMIC];
};

Blockly.Arduino.ota_get_error = function(block) {
  return ['ArduinoOTA.getError()', Blockly.Arduino.ORDER_ATOMIC];
};

Blockly.Arduino.ota_begin = function(block) {
  var size = block.getFieldValue('SIZE');
  return ['ArduinoOTA.begin(' + size + ')', Blockly.Arduino.ORDER_ATOMIC];
};

Blockly.Arduino.ota_write = function(block) {
  var data = Blockly.Arduino.valueToCode(block, 'DATA', Blockly.Arduino.ORDER_ATOMIC) || '0';
  return 'ArduinoOTA.write(' + data + ');\n';
};

Blockly.Arduino.ota_end = function(block) {
  return 'ArduinoOTA.end();\n';
}; 