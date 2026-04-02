(function() {
  'use strict';

  const STATE = window.BlinkBotState || null;

  const setSerialConnected = (v) => STATE ? STATE.set('serialConnected', v) : v;
  const getSerialConnected = () => STATE ? STATE.get('serialConnected') : false;
  const setSerialPort = (v) => STATE ? STATE.set('serialPort', v) : v;
  const getSerialPort = () => STATE ? STATE.get('serialPort') : null;
  const setConnectionMode = (v) => STATE ? STATE.set('connectionMode', v) : v;
  const getConnected = () => STATE ? STATE.get('connected') : false;

  async function connect(port, baudrate = 115200) {
    // Disconnect BLE if connected
    if (getConnected() && window.BlinkBotTransportBLE && typeof window.BlinkBotTransportBLE.disconnect === 'function') {
      await window.BlinkBotTransportBLE.disconnect();
    }

    if (getSerialConnected() && getSerialPort() === port) {
      console.log('[BLINKBOT] Already connected via USB Serial to', port);
      return true;
    }

    try {
      const isElectron = window.electronAPI && window.electronAPI.isElectron;

      if (isElectron) {
        const result = await window.electronAPI.openSerial({ port, baudrate });
        if (result.success) {
          setSerialConnected(true);
          setSerialPort(port);
          setConnectionMode('SERIAL');
          if (typeof addMessage === 'function') {
            addMessage('Blink Bot: Connected via USB Serial to ' + port, 'success');
          }
          return true;
        } else {
          throw new Error(result.error || 'Failed to open serial port');
        }
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
          socket.timeout(5000).emit('open_serial', { port, baudrate }, (err, response) => {
            if (err) reject(new Error('Connection timeout'));
            else if (response && !response.success) reject(new Error(response.error || 'Failed to open port'));
            else resolve(response);
          });
        });

        setSerialConnected(true);
        setSerialPort(port);
        setConnectionMode('SERIAL');
        if (typeof addMessage === 'function') {
          addMessage('Blink Bot: Connected via USB Serial to ' + port, 'success');
        }
        return true;
      }
    } catch (error) {
      console.error('[BLINKBOT] USB Serial connection error:', error);
      setSerialConnected(false);
      setSerialPort(null);

      if (typeof addMessage === 'function') {
        addMessage('Blink Bot: USB Serial connection failed - ' + (error.message || 'Unknown error'), 'error');
      }
      return false;
    }
  }

  async function disconnect() {
    if (!getSerialConnected()) {
      return true;
    }

    try {
      const isElectron = window.electronAPI && window.electronAPI.isElectron;

      if (isElectron) {
        await window.electronAPI.closeSerial();
      } else {
        const socket = window.blinkbotSerialSocket;
        if (socket && socket.connected) {
          await new Promise((resolve, reject) => {
            socket.timeout(5000).emit('close_serial', {}, (err, response) => {
              if (err) reject(new Error('Disconnect timeout'));
              else resolve(response);
            });
          });
        }
      }

      setSerialConnected(false);
      setSerialPort(null);

      if (typeof addMessage === 'function') {
        addMessage('Blink Bot: Disconnected from USB Serial', 'info');
      }
      return true;
    } catch (error) {
      console.error('[BLINKBOT] USB Serial disconnect error:', error);
      setSerialConnected(false);
      setSerialPort(null);
      return false;
    }
  }

  window.BlinkBotTransportSerial = {
    connect,
    disconnect
  };
})();

