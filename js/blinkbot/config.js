(function() {
  'use strict';

  // Centralized Blink Bot configuration with safe defaults.
  const DEFAULT_CONFIG = {
    UUIDs: {
      service: '12345678-1234-1234-1234-123456789abc',
      rx: '87654321-4321-4321-4321-cba987654321',
      tx: '11111111-2222-3333-4444-555555555555'
    },
    defaultDeviceName: 'BlinkBot',
    limits: {
      commandBytes: 20 // BLE payload limit (bytes)
    },
    timeouts: {
      write: 5000 // BLE write timeout (ms)
    }
  };

  // Allow future overrides while keeping current defaults.
  window.BlinkBotConfig = Object.assign({}, DEFAULT_CONFIG, window.BlinkBotConfig || {});
})(); 

