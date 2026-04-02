(function() {
  'use strict';

  const hasModules = window.BlinkBotTransportBLE && window.BlinkBotTransportSend && window.BlinkBotState;
  if (!hasModules) {
    console.warn('[BLINKBOT][BRIDGE] Missing transport/state modules. Bridge not applied.');
    return;
  }

  const state = window.BlinkBotState;
  const ble = window.BlinkBotTransportBLE;
  const serial = window.BlinkBotTransportSerial;
  const send = window.BlinkBotTransportSend;
  const builders = window.BlinkBotBuilders || {};
  const originalRuntime = window.BlinkBotRuntime || {};

  function log(label, data) {
    console.log('[BLINKBOT][BRIDGE]', label, data || '');
  }

  async function connectBLE(deviceName) {
    log('connectBLE:start', deviceName);
    const ok = await ble.connect(deviceName);
    log('connectBLE:done', ok);
    return ok;
  }

  async function disconnectAll() {
    log('disconnect:start');
    if (ble && typeof ble.disconnect === 'function') {
      await ble.disconnect();
    }
    if (serial && typeof serial.disconnect === 'function') {
      await serial.disconnect();
    }
    log('disconnect:done');
    return true;
  }

  async function connectSerial(port, baud) {
    if (!serial || typeof serial.connect !== 'function') {
      console.warn('[BLINKBOT][BRIDGE] Serial transport missing');
      return false;
    }
    log('connectSerial:start', { port, baud });
    const ok = await serial.connect(port, baud);
    log('connectSerial:done', ok);
    return ok;
  }

  async function sendCommand(command) {
    log('sendCommand', command);
    return await send.sendCommand(command);
  }

  const runtime = {
    connect: connectBLE,
    connectDirect: connectBLE,
    disconnect: disconnectAll,
    connectSerial,
    sendCommand,
    isConnected: () => !!(state.get('connected') || state.get('serialConnected')),
    isBLEConnected: () => !!state.get('connected'),
    isSerialConnected: () => !!state.get('serialConnected'),
    getConnectionMode: () => state.get('connectionMode'),
    setConnectionMode: (mode) => state.set('connectionMode', mode),
    buildLEDCommand: builders.buildLEDCommand || originalRuntime.buildLEDCommand,
    buildBlinkCommand: builders.buildBlinkCommand || originalRuntime.buildBlinkCommand,
    diagnose: originalRuntime.diagnose
  };

  window.BlinkBotRuntime = Object.assign({}, originalRuntime, runtime);
  log('bridge:active', {
    hasBLE: !!ble,
    hasSend: !!send,
    hasState: !!state
  });
})();



