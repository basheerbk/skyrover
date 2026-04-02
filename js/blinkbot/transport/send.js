(function() {
  'use strict';

  const CONFIG = window.BlinkBotConfig || {};
  const STATE = window.BlinkBotState || null;

  const COMMAND_SIZE_LIMIT = (CONFIG.limits && CONFIG.limits.commandBytes) || 20;
  const WRITE_TIMEOUT_MS = (CONFIG.timeouts && CONFIG.timeouts.write) || 5000;

  // State helpers (graceful fallback if STATE is missing)
  const getConnected = () => STATE ? STATE.get('connected') : false;
  const setConnected = (v) => STATE ? STATE.set('connected', v) : v;
  const getDevice = () => STATE ? STATE.get('device') : null;
  const setDevice = (v) => STATE ? STATE.set('device', v) : v;
  const getCharacteristic = () => STATE ? STATE.get('characteristic') : null;
  const setCharacteristic = (v) => STATE ? STATE.set('characteristic', v) : v;
  const getDeviceId = () => STATE ? STATE.get('deviceId') : null;
  const setDeviceId = (v) => STATE ? STATE.set('deviceId', v) : v;
  const getSerialConnected = () => STATE ? STATE.get('serialConnected') : false;
  const setSerialConnected = (v) => STATE ? STATE.set('serialConnected', v) : v;
  const getSerialPort = () => STATE ? STATE.get('serialPort') : null;
  const setSerialPort = (v) => STATE ? STATE.set('serialPort', v) : v;
  const getConnectionMode = () => STATE ? STATE.get('connectionMode') : 'BLE';

  async function sendCommand(command) {
    if (!command || typeof command !== 'string' || command.trim().length === 0) {
      console.warn('[BLINKBOT] Invalid command:', command);
      return false;
    }

    if (getConnectionMode() === 'SERIAL') {
      return await sendSerial(command);
    }
    return await sendBLE(command);
  }

  // BLE path
  async function sendBLE(command) {
    const characteristic = getCharacteristic();
    const device = getDevice();

    if (!getConnected() || !characteristic) {
      console.warn('[BLINKBOT] Not connected via BLE. Command ignored:', command);
      if (typeof addMessage === 'function') {
        addMessage('Blink Bot: Not connected via BLE. Please connect first.', 'error');
      }
      return false;
    }

    if (device && device.gatt && !device.gatt.connected) {
      console.warn('[BLINKBOT] Device disconnected. Clearing state.');
      setConnected(false);
      setDevice(null);
      setCharacteristic(null);
      setDeviceId(null);
      if (typeof addMessage === 'function') {
        addMessage('Blink Bot: Device disconnected. Please reconnect.', 'error');
      }
      return false;
    }

    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(command.trim());

      if (data.length > COMMAND_SIZE_LIMIT) {
        console.warn('[BLINKBOT] Command too long:', data.length, 'bytes (max ' + COMMAND_SIZE_LIMIT + ')');
        if (typeof addMessage === 'function') {
          addMessage('Blink Bot: Command too long (max ' + COMMAND_SIZE_LIMIT + ' characters).', 'error');
        }
        return false;
      }

      const writePromise = characteristic.writeValue(data);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Write timeout')), WRITE_TIMEOUT_MS)
      );

      await Promise.race([writePromise, timeoutPromise]);

      console.log('[BLINKBOT] Command sent via BLE:', command);
      return true;
    } catch (error) {
      console.error('[BLINKBOT] Error sending BLE command:', error);

      if (error.name === 'NetworkError' ||
          (error.message && (error.message.includes('disconnected') || error.message.includes('not connected')))) {
        setConnected(false);
        setDevice(null);
        setCharacteristic(null);
        setDeviceId(null);
        if (typeof addMessage === 'function') {
          addMessage('Blink Bot: Device disconnected during command send.', 'error');
        }
      } else if (error.name === 'InvalidStateError') {
        if (typeof addMessage === 'function') {
          addMessage('Blink Bot: Cannot write to device. Please reconnect.', 'error');
        }
      } else if (error.message && error.message.includes('timeout')) {
        if (typeof addMessage === 'function') {
          addMessage('Blink Bot: Command timeout. Device may be unresponsive.', 'error');
        }
      } else {
        if (typeof addMessage === 'function') {
          addMessage('Blink Bot: Error sending command - ' + (error.message || error.name || 'Unknown error'), 'error');
        }
      }
      return false;
    }
  }

  // Serial path
  async function sendSerial(command) {
    if (!getSerialConnected()) {
      console.warn('[BLINKBOT] Not connected via USB Serial. Command ignored:', command);
      if (typeof addMessage === 'function') {
        addMessage('Blink Bot: Not connected via USB Serial. Please connect first.', 'error');
      }
      return false;
    }

    try {
      const commandWithNewline = command.trim() + '\n';
      const isElectron = window.electronAPI && window.electronAPI.isElectron;

      if (isElectron) {
        await window.electronAPI.writeSerial(commandWithNewline);
      } else {
        const BACKEND_URL = window.blockideResolveBackendBaseUrl();

        let socket = window.blinkbotSerialSocket;
        if (!socket || !socket.connected) {
          if (typeof io !== 'undefined') {
            socket = io(BACKEND_URL || undefined);
            window.blinkbotSerialSocket = socket;
          } else {
            throw new Error('Socket.IO not available');
          }
        }

        await new Promise((resolve, reject) => {
          socket.timeout(5000).emit('write_serial', { data: commandWithNewline }, (err, response) => {
            if (err) reject(new Error('Serial write timeout'));
            else resolve(response);
          });
        });
      }

      console.log('[BLINKBOT] Command sent via USB Serial:', command, '(port:', getSerialPort(), ')');
      return true;
    } catch (error) {
      console.error('[BLINKBOT] Error sending USB Serial command:', error);

      if (typeof addMessage === 'function') {
        addMessage('Blink Bot: Error sending USB Serial command - ' + (error.message || 'Unknown error'), 'error');
      }

      if (error.message && (error.message.includes('closed') || error.message.includes('not open'))) {
        setSerialConnected(false);
        setSerialPort(null);
      }

      return false;
    }
  }

  window.BlinkBotTransportSend = {
    sendCommand,
    sendBLE,
    sendSerial
  };
})();

