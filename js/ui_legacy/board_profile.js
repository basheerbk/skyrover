(function (w) {
  'use strict';
  if (!w) return;

  var fqbnToBoardId = {
    'arduino:avr:uno': 'arduino_uno',
    'arduino:avr:mega': 'arduino_mega',
    'arduino:avr:mega:cpu=atmega2560': 'arduino_mega',
    'arduino:avr:nano': 'arduino_nano',
    'arduino:avr:nano:cpu=atmega328': 'arduino_nano',
    'esp32:esp32:esp32': 'skyrover',
    'esp32:esp32:esp32c3': 'esp32c3promini',
    'esp32:esp32:esp32s3': 'esp32s3',
    'esp8266:esp8266:nodemcuv2': 'esp8266',
  };

  /** Canonical Arduino-CLI FQBN for compile/upload from the active `profile.defaultBoardKey`. */
  var boardKeyToFqbn = {
    skyrover: 'esp32:esp32:esp32',
    esp32c3promini: 'esp32:esp32:esp32c3',
    esp8266: 'esp8266:esp8266:nodemcuv2',
    arduino_uno: 'arduino:avr:uno',
    arduino_nano: 'arduino:avr:nano:cpu=atmega328',
    arduino_mega: 'arduino:avr:mega:cpu=atmega2560',
  };

  function resolveBoardFqbnFromProfile() {
    if (typeof profile === 'undefined' || !profile.defaultBoard) {
      return 'arduino:avr:uno';
    }
    var key = profile.defaultBoardKey;
    if (key && boardKeyToFqbn[key]) {
      return boardKeyToFqbn[key];
    }
    var ua = profile.defaultBoard.upload_arg;
    if (typeof ua === 'string' && ua.trim()) {
      return ua.trim();
    }
    return 'arduino:avr:uno';
  }

  w.updatePinConfigurations = function () {
    console.log('updatePinConfigurations called - should be overridden by block files');
  };

  function refreshPinDropdowns() {
    if (typeof w.updatePinConfigurations === 'function') {
      w.updatePinConfigurations();
    }
    if (typeof Blockly !== 'undefined' && Blockly.mainWorkspace) {
      var blocks = Blockly.mainWorkspace.getAllBlocks();
      blocks.forEach(function (block) {
        if (
          block.type &&
          (block.type === 'inout_digital_write' ||
            block.type === 'inout_digital_write_validator' ||
            block.type === 'inout_digital_read' ||
            block.type === 'inout_digital_read_check' ||
            block.type === 'inout_digital_read_validator' ||
            block.type === 'inout_digital_mode' ||
            block.type === 'inout_PWM_write' ||
            block.type === 'inout_PWM_write_validator' ||
            block.type === 'inout_PWM_write_inline' ||
            block.type === 'inout_analog_read' ||
            block.type === 'inout_analog_read_validator' ||
            block.type === 'inout_analog_read_voltage' ||
            block.type === 'inout_analog_write_validator' ||
            block.type === 'tone' ||
            block.type === 'tone_notime' ||
            block.type === 'notone' ||
            block.type === 'inout_button_wait_il' ||
            block.type === 'inout_button_wait_iph' ||
            (block.type && block.type.indexOf('basic_') === 0))
        ) {
          block.render();
        }
      });
    }
  }

  function updateBoardProfile(fqbn) {
    if ((fqbn && fqbn.includes('skyrover')) || fqbnToBoardId[fqbn] === 'skyrover') {
      fqbn = 'esp32:esp32:esp32';
    }

    var mappedId = fqbnToBoardId[fqbn];
    if (!mappedId && fqbn && typeof console !== 'undefined' && console.warn) {
      console.warn(
        '[Board profile] Unknown FQBN — UI defaults to ESP32 profile; verify board pins:',
        fqbn
      );
    }
    var boardId = mappedId || 'skyrover';
    if (boardId && typeof profile !== 'undefined') {
      profile.defaultBoardKey = boardId;
      profile.defaultBoard = profile[boardId];
      if (boardId === 'skyrover' && profile.defaultBoard) {
        profile.defaultBoard.upload_arg = 'esp32:esp32:esp32';
      }
      if (boardId === 'esp32c3promini' && profile.defaultBoard) {
        profile.defaultBoard.upload_arg = 'esp32:esp32:esp32c3';
      }
      if (boardId === 'arduino_uno' && profile.defaultBoard) {
        profile.defaultBoard.upload_arg = 'arduino:avr:uno';
      }
      if (boardId === 'arduino_nano' && profile.defaultBoard) {
        profile.defaultBoard.upload_arg = 'arduino:avr:nano:cpu=atmega328';
      }
      if (boardId === 'arduino_mega' && profile.defaultBoard) {
        profile.defaultBoard.upload_arg = 'arduino:avr:mega:cpu=atmega2560';
      }
      if (typeof currentDigitalPins === 'undefined') w.currentDigitalPins = [];
      if (typeof currentPwmPins === 'undefined') w.currentPwmPins = [];
      if (typeof currentAnalogPins === 'undefined') w.currentAnalogPins = [];
    } else {
      console.warn('Unknown board FQBN or profile not available:', fqbn);
    }
    setTimeout(refreshPinDropdowns, 50);
  }

  function initializePinSystem() {
    if (typeof currentDigitalPins === 'undefined') w.currentDigitalPins = [];
    if (typeof currentPwmPins === 'undefined') w.currentPwmPins = [];
    if (typeof currentAnalogPins === 'undefined') w.currentAnalogPins = [];

    var selectedCard = document.querySelector('#boardsModal .board-card.selected');
    if (!selectedCard) {
      var defaultCard = document.querySelector('#boardsModal .board-card[data-fqbn="esp32:esp32:esp32"]');
      if (defaultCard) {
        defaultCard.classList.add('selected');
        updateBoardProfile(defaultCard.getAttribute('data-fqbn'));
      }
    } else {
      updateBoardProfile(selectedCard.getAttribute('data-fqbn'));
    }
  }

  w.refreshPinDropdowns = refreshPinDropdowns;
  w.updateBoardProfile = updateBoardProfile;
  w.initializePinSystem = initializePinSystem;
  w.resolveBoardFqbnFromProfile = resolveBoardFqbnFromProfile;
})(typeof window !== 'undefined' ? window : null);

