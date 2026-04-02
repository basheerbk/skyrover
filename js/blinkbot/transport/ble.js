(function() {
  'use strict';

  const CONFIG = window.BlinkBotConfig || {};
  const STATE = window.BlinkBotState || null;

  const SERVICE_UUID = (CONFIG.UUIDs && CONFIG.UUIDs.service) || '12345678-1234-1234-1234-123456789abc';
  const RX_UUID = (CONFIG.UUIDs && CONFIG.UUIDs.rx) || '87654321-4321-4321-4321-cba987654321';
  const DEFAULT_DEVICE_NAME = CONFIG.defaultDeviceName || 'BlinkBot';

  // State helpers
  const setConnected = (v) => STATE ? STATE.set('connected', v) : v;
  const getConnected = () => STATE ? STATE.get('connected') : false;
  const setDevice = (v) => STATE ? STATE.set('device', v) : v;
  const getDevice = () => STATE ? STATE.get('device') : null;
  const setCharacteristic = (v) => STATE ? STATE.set('characteristic', v) : v;
  const getCharacteristic = () => STATE ? STATE.get('characteristic') : null;
  const setDeviceId = (v) => STATE ? STATE.set('deviceId', v) : v;
  const getIsConnecting = () => STATE ? STATE.get('isConnecting') : false;
  const setIsConnecting = (v) => STATE ? STATE.set('isConnecting', v) : v;
  const getConnectionTimeout = () => STATE ? STATE.get('connectionTimeout') : null;
  const setConnectionTimeout = (v) => STATE ? STATE.set('connectionTimeout', v) : v;
  const setConnectionMode = (v) => STATE ? STATE.set('connectionMode', v) : v;

  async function connect(deviceName) {
    if (getIsConnecting()) {
      console.log('[BLINKBOT] Connection already in progress (BLE).');
      return false;
    }

    // Already connected and GATT alive
    const current = getDevice();
    if (getConnected() && current && current.gatt && current.gatt.connected) {
      console.log('[BLINKBOT] Already connected to', current.name);
      return true;
    }

    setIsConnecting(true);
    const targetName = (deviceName && deviceName.trim()) || DEFAULT_DEVICE_NAME;

    try {
      if (!navigator.bluetooth) {
        const errorMsg = 'Web Bluetooth API not available. Please use Chrome/Edge or Electron.';
        if (typeof addMessage === 'function') addMessage('Blink Bot: ' + errorMsg, 'error');
        setIsConnecting(false);
        return false;
      }

      let bluetoothAvailable = true;
      try {
        if (navigator.bluetooth.getAvailability) {
          bluetoothAvailable = await navigator.bluetooth.getAvailability();
        }
      } catch (err) {
        bluetoothAvailable = true; // assume available if check fails
      }
      if (!bluetoothAvailable) {
        const errorMsg = 'Bluetooth adapter is not available. Please enable Bluetooth.';
        if (typeof addMessage === 'function') addMessage('Blink Bot: ' + errorMsg, 'error');
        setIsConnecting(false);
        return false;
      }

      // Set connection timeout (30s)
      const timeoutHandle = setTimeout(() => {
        if (getIsConnecting()) {
          setIsConnecting(false);
          if (typeof addMessage === 'function') {
            addMessage('Blink Bot: Connection timeout after 30 seconds', 'error');
            addMessage('Blink Bot: Make sure ESP32 is powered on and advertising', 'info');
          }
        }
      }, 30000);
      setConnectionTimeout(timeoutHandle);

      // Device picker
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ name: targetName }],
        optionalServices: [SERVICE_UUID]
      });

      if (typeof addMessage === 'function') {
        addMessage('Blink Bot: ✓ Device selected: ' + (device.name || 'Unknown'), 'success');
        addMessage('Blink Bot: Connecting to device...', 'info');
      }

      // Finish connection
      const ok = await completeConnection(device, targetName);

      if (getConnectionTimeout()) {
        clearTimeout(getConnectionTimeout());
        setConnectionTimeout(null);
      }

      setIsConnecting(false);
      return ok;
    } catch (error) {
      if (getConnectionTimeout()) {
        clearTimeout(getConnectionTimeout());
        setConnectionTimeout(null);
      }
      setIsConnecting(false);

      // User cancellation handling
      const isUserCancellation = (error.name === 'NotFoundError' || error.name === 'DOMException') &&
        error.message &&
        (error.message.toLowerCase().includes('cancelled') ||
         error.message.toLowerCase().includes('user cancelled') ||
         error.message.toLowerCase().includes('no device selected'));

      let errorMsg = error.message || 'Unknown error';
      let messageType = 'error';

      if (isUserCancellation) {
        errorMsg = 'Connection cancelled.';
        messageType = 'info';
      } else if (error.name === 'NotFoundError') {
        errorMsg = 'Device not found in picker. Please ensure the device is advertising.';
      } else if (error.name === 'InvalidStateError') {
        errorMsg = 'Bluetooth adapter is not available. Please check your Bluetooth settings.';
      } else if (error.name === 'NetworkError' || (error.message && error.message.includes('timeout'))) {
        errorMsg = 'Connection failed or timed out. The device may be out of range or not advertising.';
      } else if (error.message && error.message.includes('not writable')) {
        errorMsg = 'Device characteristic error. Please check the firmware version.';
      }

      if (typeof addMessage === 'function') {
        addMessage('Blink Bot: ' + errorMsg, messageType);
      }
      return false;
    }
  }

  async function completeConnection(device, targetName) {
    // GATT connect with timeout
    const connectPromise = device.gatt.connect();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('GATT connection timeout')), 15000)
    );
    const server = await Promise.race([connectPromise, timeoutPromise]);

    if (!server.connected) {
      throw new Error('GATT server reports not connected after connection');
    }

    await new Promise(r => setTimeout(r, 500)); // stabilize

    // Get service and characteristic
    const service = await server.getPrimaryService(SERVICE_UUID);
    const rxCharacteristic = await service.getCharacteristic(RX_UUID);

    // Final settle
    await new Promise(r => setTimeout(r, 1000));

    if (!server.connected) {
      throw new Error('Server disconnected during setup');
    }

    setDevice(device);
    setCharacteristic(rxCharacteristic);
    setConnected(true);
    setDeviceId(device.id);
    setConnectionMode('BLE');

    // Disconnect handler
    device.addEventListener('gattserverdisconnected', () => {
      setConnected(false);
      setDevice(null);
      setCharacteristic(null);
      setDeviceId(null);
      setIsConnecting(false);
      if (typeof addMessage === 'function') {
        addMessage('Blink Bot: Device disconnected unexpectedly', 'error');
      }
    });

    // Connection monitor (lightweight)
    let monitorCount = 0;
    const connectionMonitor = setInterval(() => {
      const dev = getDevice();
      if (dev && dev.gatt) {
        const isConn = dev.gatt.connected;
        if (monitorCount % 5 === 0) {
          console.log(`[BLINKBOT] Connection check #${monitorCount}:`, {
            connected: isConn,
            deviceName: dev.name,
            hasCharacteristic: !!getCharacteristic()
          });
        }
        if (!isConn) {
          clearInterval(connectionMonitor);
          setConnected(false);
          setDevice(null);
          setCharacteristic(null);
          setDeviceId(null);
          if (typeof addMessage === 'function') {
            addMessage('Blink Bot: Connection lost', 'error');
          }
        }
        monitorCount++;
      } else {
        clearInterval(connectionMonitor);
      }
    }, 3000);

    if (device._blinkbotMonitor) clearInterval(device._blinkbotMonitor);
    device._blinkbotMonitor = connectionMonitor;

    if (typeof addMessage === 'function') {
      addMessage('Blink Bot: Connected to ' + (device.name || targetName), 'success');
    }
    return true;
  }

  async function disconnect() {
    if (getIsConnecting()) {
      setIsConnecting(false);
      if (getConnectionTimeout()) {
        clearTimeout(getConnectionTimeout());
        setConnectionTimeout(null);
      }
    }

    if (!getConnected() && !getDevice()) {
      return true;
    }

    try {
      const device = getDevice();
      if (device && device.gatt && device.gatt.connected) {
        await device.gatt.disconnect();
      }

      setConnected(false);
      setDevice(null);
      setCharacteristic(null);
      setDeviceId(null);

      if (typeof addMessage === 'function') {
        addMessage('Blink Bot: Disconnected from BLE', 'info');
      }
      return true;
    } catch (error) {
      console.error('[BLINKBOT] BLE disconnect error:', error);
      setConnected(false);
      setDevice(null);
      setCharacteristic(null);
      setDeviceId(null);
      setIsConnecting(false);
      if (getConnectionTimeout()) {
        clearTimeout(getConnectionTimeout());
        setConnectionTimeout(null);
      }
      return false;
    }
  }

  window.BlinkBotTransportBLE = {
    connect,
    disconnect,
    completeConnection
  };
})();

