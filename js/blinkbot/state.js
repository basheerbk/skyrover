(function() {
  'use strict';

  // Central store for Blink Bot runtime state. Keeps defaults identical to prior behavior.
  const store = {
    connected: false,
    deviceId: null,
    device: null,
    characteristic: null,
    isConnecting: false,
    connectionTimeout: null,
    serialConnected: false,
    serialPort: null,
    connectionMode: 'BLE' // 'BLE' or 'SERIAL'
  };

  function get(key) {
    return store[key];
  }

  function set(key, value) {
    store[key] = value;
    return value;
  }

  function resetConnection() {
    store.connected = false;
    store.deviceId = null;
    store.device = null;
    store.characteristic = null;
    store.isConnecting = false;
    if (store.connectionTimeout) {
      clearTimeout(store.connectionTimeout);
    }
    store.connectionTimeout = null;
  }

  function resetSerial() {
    store.serialConnected = false;
    store.serialPort = null;
  }

  function resetAll() {
    resetConnection();
    resetSerial();
    store.connectionMode = 'BLE';
  }

  // Expose globally for runtime to consume.
  window.BlinkBotState = {
    get,
    set,
    resetConnection,
    resetSerial,
    resetAll,
    raw: store
  };
})(); 

