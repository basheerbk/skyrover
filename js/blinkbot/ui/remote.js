(function() {
  'use strict';

  function init(remoteModal) {
    if (!remoteModal) return;

    function updateRemoteConnectionStatus() {
      const statusDiv = document.getElementById('remote_connection_status');
      const statusIcon = document.getElementById('remote_status_icon');
      const statusText = document.getElementById('remote_status_text');
      const connectBtn = document.getElementById('remote_btn_connect');
      const disconnectBtn = document.getElementById('remote_btn_disconnect');

      if (!statusDiv || !statusIcon || !statusText || !connectBtn || !disconnectBtn) {
        return;
      }

      const isConnected = window.BlinkBotRuntime && window.BlinkBotRuntime.isConnected();

      if (isConnected) {
        statusDiv.className = 'alert alert-success';
        statusIcon.className = 'glyphicon glyphicon-ok-circle';
        statusText.textContent = 'Connected';
        connectBtn.disabled = true;
        disconnectBtn.disabled = false;
      } else {
        statusDiv.className = 'alert alert-danger';
        statusIcon.className = 'glyphicon glyphicon-remove-circle';
        statusText.textContent = 'Not Connected';
        connectBtn.disabled = false;
        disconnectBtn.disabled = true;
      }
    }

    function addRemoteMessage(message, type) {
      const messagesDiv = document.getElementById('remote_status_messages');
      if (!messagesDiv) return;

      const alertDiv = document.createElement('div');
      alertDiv.className = 'alert alert-' + (type || 'info') + ' alert-dismissible';
      alertDiv.style.marginBottom = '5px';
      alertDiv.style.padding = '8px 15px';
      alertDiv.innerHTML = '<button type="button" class="close" data-dismiss="alert">&times;</button>' + message;

      messagesDiv.appendChild(alertDiv);

      setTimeout(() => {
        if (alertDiv.parentNode) {
          alertDiv.parentNode.removeChild(alertDiv);
        }
      }, 5000);

      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    $('#remoteModal').on('show.bs.modal', function() {
      updateRemoteConnectionStatus();
    });

    const remoteConnectBtn = document.getElementById('remote_btn_connect');
    if (remoteConnectBtn) {
      remoteConnectBtn.addEventListener('click', async function() {
        console.log('[REMOTE] Connect button clicked');

        if (!window.BlinkBotRuntime) {
          addRemoteMessage('Blink Bot Runtime not loaded. Please refresh the page.', 'error');
          return;
        }

        if (window.BlinkBotRuntime.isConnected()) {
          addRemoteMessage('Already connected to Blink Bot.', 'info');
          updateRemoteConnectionStatus();
          return;
        }

        const deviceName = document.getElementById('remote_device_name').value.trim() || 'BlinkBot';

        if (remoteConnectBtn.disabled) {
          addRemoteMessage('Connection already in progress. Please wait...', 'info');
          return;
        }

        remoteConnectBtn.disabled = true;

        const messagesDiv = document.getElementById('remote_status_messages');
        if (messagesDiv) messagesDiv.innerHTML = '';

        addRemoteMessage('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
        addRemoteMessage('📱 DEVICE PICKER APPEARING NOW!', 'success');
        addRemoteMessage('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
        addRemoteMessage('🔍 INSTRUCTIONS:', 'warning');
        addRemoteMessage('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
        addRemoteMessage('1. Look for "' + deviceName + '" in the device list', 'info');
        addRemoteMessage('2. If "' + deviceName + '" is NOT in the list:', 'warning');
        addRemoteMessage('   → Click Cancel/Close', 'info');
        addRemoteMessage('   → Check ESP32 Serial Monitor', 'info');
        addRemoteMessage('   → Verify "Blink Bot BLE Ready!" message', 'info');
        addRemoteMessage('   → Wait 2-3 seconds and try again', 'info');
        addRemoteMessage('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
        addRemoteMessage('3. If "' + deviceName + '" IS in the list:', 'success');
        addRemoteMessage('   → Click on "' + deviceName + '"', 'info');
        addRemoteMessage('   → Click "Pair" or "Connect" button', 'info');
        addRemoteMessage('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
        addRemoteMessage('⚠️ DO NOT cancel if "' + deviceName + '" is visible!', 'warning');
        addRemoteMessage('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');

        if (window.focus) {
          window.focus();
        }

        try {
          const connected = await window.BlinkBotRuntime.connectDirect(deviceName);
          if (connected) {
            addRemoteMessage('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'success');
            addRemoteMessage('✅ Successfully connected to ' + deviceName + '!', 'success');
            addRemoteMessage('Ready to send commands!', 'success');
            addRemoteMessage('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'success');
          } else {
            addRemoteMessage('❌ Connection failed. Please try again.', 'error');
            addRemoteMessage('Check the troubleshooting steps above', 'info');
          }
        } catch (error) {
          console.error('[REMOTE] Connection error:', error);
        } finally {
          remoteConnectBtn.disabled = false;
          updateRemoteConnectionStatus();
        }
      });
    }

    const remoteDisconnectBtn = document.getElementById('remote_btn_disconnect');
    if (remoteDisconnectBtn) {
      remoteDisconnectBtn.addEventListener('click', async function() {
        console.log('[REMOTE] Disconnect button clicked');

        if (!window.BlinkBotRuntime) {
          addRemoteMessage('Blink Bot Runtime not loaded.', 'error');
          return;
        }

        if (!window.BlinkBotRuntime.isConnected()) {
          addRemoteMessage('Not connected to any device.', 'info');
          updateRemoteConnectionStatus();
          return;
        }

        remoteDisconnectBtn.disabled = true;
        addRemoteMessage('Disconnecting...', 'info');

        try {
          await window.BlinkBotRuntime.disconnect();
          addRemoteMessage('Disconnected successfully.', 'success');
        } catch (error) {
          console.error('[REMOTE] Disconnect error:', error);
          addRemoteMessage('Disconnect error: ' + (error.message || 'Unknown error'), 'error');
        } finally {
          updateRemoteConnectionStatus();
        }
      });
    }

    const remoteLedOnBtn = document.getElementById('remote_btn_led_on');
    if (remoteLedOnBtn) {
      remoteLedOnBtn.addEventListener('click', async function() {
        console.log('[REMOTE] LED ON button clicked');

        if (!window.BlinkBotRuntime || !window.BlinkBotRuntime.isConnected()) {
          addRemoteMessage('Please connect to Blink Bot first.', 'error');
          return;
        }

        const pin = parseInt(document.getElementById('remote_pin_number').value);
        if (isNaN(pin) || pin < 0 || pin > 39) {
          addRemoteMessage('Invalid pin number. Must be 0-39.', 'error');
          return;
        }

        remoteLedOnBtn.disabled = true;
        try {
          const command = window.BlinkBotRuntime.buildLEDCommand(pin, 'HIGH');
          const success = await window.BlinkBotRuntime.sendCommand(command);
          if (success) {
            addRemoteMessage('LED ON command sent (Pin ' + pin + ')', 'success');
          } else {
            addRemoteMessage('Failed to send LED ON command.', 'error');
          }
        } catch (error) {
          console.error('[REMOTE] LED ON error:', error);
          addRemoteMessage('Error: ' + (error.message || 'Unknown error'), 'error');
        } finally {
          remoteLedOnBtn.disabled = false;
        }
      });
    }

    const remoteLedOffBtn = document.getElementById('remote_btn_led_off');
    if (remoteLedOffBtn) {
      remoteLedOffBtn.addEventListener('click', async function() {
        console.log('[REMOTE] LED OFF button clicked');

        if (!window.BlinkBotRuntime || !window.BlinkBotRuntime.isConnected()) {
          addRemoteMessage('Please connect to Blink Bot first.', 'error');
          return;
        }

        const pin = parseInt(document.getElementById('remote_pin_number').value);
        if (isNaN(pin) || pin < 0 || pin > 39) {
          addRemoteMessage('Invalid pin number. Must be 0-39.', 'error');
          return;
        }

        remoteLedOffBtn.disabled = true;
        try {
          const command = window.BlinkBotRuntime.buildLEDCommand(pin, 'LOW');
          const success = await window.BlinkBotRuntime.sendCommand(command);
          if (success) {
            addRemoteMessage('LED OFF command sent (Pin ' + pin + ')', 'success');
          } else {
            addRemoteMessage('Failed to send LED OFF command.', 'error');
          }
        } catch (error) {
          console.error('[REMOTE] LED OFF error:', error);
          addRemoteMessage('Error: ' + (error.message || 'Unknown error'), 'error');
        } finally {
          remoteLedOffBtn.disabled = false;
        }
      });
    }

    const remoteRunBtn = document.getElementById('remote_btn_run');
    if (remoteRunBtn) {
      remoteRunBtn.addEventListener('click', async function() {
        console.log('[REMOTE] Run Blink button clicked');

        if (!window.BlinkBotRuntime || !window.BlinkBotRuntime.isConnected()) {
          addRemoteMessage('Please connect to Blink Bot first.', 'error');
          return;
        }

        const pin = parseInt(document.getElementById('remote_pin_number').value);
        const delay = parseInt(document.getElementById('remote_blink_speed').value);

        if (isNaN(pin) || pin < 0 || pin > 39) {
          addRemoteMessage('Invalid pin number. Must be 0-39.', 'error');
          return;
        }

        if (isNaN(delay) || delay < 10 || delay > 10000) {
          addRemoteMessage('Invalid blink speed. Must be 10-10000 ms.', 'error');
          return;
        }

        remoteRunBtn.disabled = true;
        addRemoteMessage('Running blink on Pin ' + pin + ' with delay ' + delay + 'ms...', 'info');

        try {
          const command = window.BlinkBotRuntime.buildBlinkCommand(pin, 1, delay);
          const success = await window.BlinkBotRuntime.sendCommand(command);
          if (success) {
            addRemoteMessage('Blink command sent successfully! (Pin ' + pin + ', Delay ' + delay + 'ms)', 'success');
          } else {
            addRemoteMessage('Failed to send blink command.', 'error');
          }
        } catch (error) {
          console.error('[REMOTE] Run Blink error:', error);
          addRemoteMessage('Error: ' + (error.message || 'Unknown error'), 'error');
        } finally {
          remoteRunBtn.disabled = false;
        }
      });
    }

    const remoteDiagnoseBtn = document.getElementById('remote_btn_diagnose');
    if (remoteDiagnoseBtn) {
      remoteDiagnoseBtn.addEventListener('click', function() {
        console.log('[REMOTE] Diagnostics button clicked');

        if (!window.BlinkBotRuntime) {
          addRemoteMessage('Blink Bot Runtime not loaded.', 'error');
          return;
        }

        addRemoteMessage('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
        addRemoteMessage('🔍 Running Diagnostics...', 'info');
        addRemoteMessage('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');

        const diag = window.BlinkBotRuntime.diagnose();

        if (diag.webBluetoothAvailable) {
          addRemoteMessage('✓ Web Bluetooth API: Available', 'success');
        } else {
          addRemoteMessage('✗ Web Bluetooth API: NOT Available', 'error');
          addRemoteMessage('  → Use Chrome/Edge or Electron app', 'info');
        }

        if (diag.bluetoothAdapter === 'available') {
          addRemoteMessage('✓ Bluetooth Adapter: Available', 'success');
        } else if (diag.bluetoothAdapter === 'not available') {
          addRemoteMessage('✗ Bluetooth Adapter: NOT Available', 'error');
          addRemoteMessage('  → Enable Bluetooth in Windows Settings', 'info');
        } else {
          addRemoteMessage('? Bluetooth Adapter: ' + diag.bluetoothAdapter, 'info');
        }

        if (diag.connectionState) {
          addRemoteMessage('✓ Connection State: Connected', 'success');
          addRemoteMessage('  Device: ' + (diag.deviceName || 'Unknown'), 'info');
        } else {
          addRemoteMessage('✗ Connection State: Not Connected', 'info');
        }

        if (diag.deviceConnected) {
          addRemoteMessage('✓ Device GATT: Connected', 'success');
        } else if (diag.connectionState) {
          addRemoteMessage('⚠ Device GATT: Disconnected (state mismatch)', 'warning');
        } else {
          addRemoteMessage('✗ Device GATT: Not Connected', 'info');
        }

        if (diag.characteristicAvailable) {
          addRemoteMessage('✓ Characteristic: Available', 'success');
        } else {
          addRemoteMessage('✗ Characteristic: Not Available', 'info');
        }

        if (diag.isConnecting) {
          addRemoteMessage('⚠ Connection: In Progress', 'warning');
        }

        addRemoteMessage('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
        addRemoteMessage('💡 Troubleshooting Tips:', 'info');
        addRemoteMessage('  1. Check ESP32 Serial Monitor for "Blink Bot BLE Ready!"', 'info');
        addRemoteMessage('  2. Ensure ESP32 is powered on and nearby', 'info');
        addRemoteMessage('  3. Wait 2-3 seconds after ESP32 boots', 'info');
        addRemoteMessage('  4. Try resetting ESP32 if device not found', 'info');
        addRemoteMessage('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');

        console.log('[REMOTE] Full diagnostics:', diag);
      });
    }

    let remoteStatusInterval = null;
    $('#remoteModal').on('shown.bs.modal', function() {
      updateRemoteConnectionStatus();
      remoteStatusInterval = setInterval(updateRemoteConnectionStatus, 1000);
    });

    $('#remoteModal').on('hidden.bs.modal', function() {
      if (remoteStatusInterval) {
        clearInterval(remoteStatusInterval);
        remoteStatusInterval = null;
      }
    });
  }

  window.BlinkBotRemote = { init, addRemoteMessage: null };
})();

