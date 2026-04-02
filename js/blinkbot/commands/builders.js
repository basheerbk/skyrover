(function() {
  'use strict';

  // Command builder utilities (kept identical to previous inline implementations).
  function buildLEDCommand(pin, state) {
    return 'led ' + pin + ' ' + (state === 'HIGH' ? 'high' : 'low');
  }

  function buildBlinkCommand(pin, times, delay) { // times kept for signature compatibility
    // Compact format fits within 20-byte BLE limit and matches firmware parser.
    return 'blink led' + pin + ' d' + delay;
  }

  window.BlinkBotBuilders = {
    buildLEDCommand,
    buildBlinkCommand
  };
})(); 

