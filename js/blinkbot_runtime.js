/**
 * Blink Bot Runtime Handler
 * Intercepts Blink Bot command blocks and sends BLE commands instead of generating code
 */

(function() {
  'use strict';
  
  // BLE connection state
  let blinkbotConnected = false;
  let blinkbotDeviceId = null;
  let blinkbotDevice = null; // Web Bluetooth device object
  let blinkbotCharacteristic = null; // Web Bluetooth characteristic object
  let blinkbotServiceUUID = '12345678-1234-1234-1234-123456789abc';
  let blinkbotRxUUID = '87654321-4321-4321-4321-cba987654321';
  let blinkbotTxUUID = '11111111-2222-3333-4444-555555555555';
  let isConnecting = false; // Prevent multiple simultaneous connection attempts
  let connectionTimeout = null; // Connection timeout handler
  
  // USB Serial connection state
  let blinkbotSerialConnected = false;
  let blinkbotSerialPort = null;
  let blinkbotConnectionMode = 'BLE'; // 'BLE' or 'SERIAL'
  
  // Intercept code generation for Blink Bot command blocks
  const originalBlockToCode = Blockly.Arduino.blockToCode;
  Blockly.Arduino.blockToCode = function(block) {
    // Safety check: block might be null
    if (!block || !block.type) {
      // If block is null, call original function which will handle it
      return originalBlockToCode.call(this, block);
    }
    
    // Check if this is a Blink Bot runtime block (not setup block)
    if (block.type === 'blinkbot_led_control' || 
        block.type === 'blinkbot_start_blink' ||
        block.type === 'blinkbot_stop_blink' ||
        block.type === 'blinkbot_connect_ble' ||
        block.type === 'blinkbot_disconnect' ||
        block.type === 'blinkbot_is_connected' ||
        block.type === 'blinkbot_when_run' ||
        block.type === 'blinkbot_repeat_times') {
      
      // These blocks don't generate code - they execute at runtime
      // Return empty code (or comment) so they don't break the generated code
      return '';
    }
    
    // For all other blocks, use the original function
    return originalBlockToCode.call(this, block);
  };
  
  // Send command to Blink Bot via BLE or USB Serial
  async function sendBlinkBotCommand(command) {
    // Validate command
    if (!command || typeof command !== 'string' || command.trim().length === 0) {
      console.warn('[BLINKBOT] Invalid command:', command);
      return false;
    }
    
    // Route to appropriate connection method
    if (blinkbotConnectionMode === 'SERIAL') {
      return await sendBlinkBotCommandSerial(command);
    } else {
      return await sendBlinkBotCommandBLE(command);
    }
  }
  
  // Send BLE command to Blink Bot using Web Bluetooth API
  async function sendBlinkBotCommandBLE(command) {
    // Check connection state
    if (!blinkbotConnected || !blinkbotCharacteristic) {
      console.warn('[BLINKBOT] Not connected via BLE. Command ignored:', command);
      if (typeof addMessage === 'function') {
        addMessage('Blink Bot: Not connected via BLE. Please connect first.', 'error');
      }
      return false;
    }
    
    // Verify device is still connected
    if (blinkbotDevice && blinkbotDevice.gatt && !blinkbotDevice.gatt.connected) {
      console.warn('[BLINKBOT] Device disconnected. Clearing state.');
      blinkbotConnected = false;
      blinkbotDevice = null;
      blinkbotCharacteristic = null;
      blinkbotDeviceId = null;
      if (typeof addMessage === 'function') {
        addMessage('Blink Bot: Device disconnected. Please reconnect.', 'error');
      }
      return false;
    }
    
    try {
      // Convert command string to ArrayBuffer
      const encoder = new TextEncoder();
      const data = encoder.encode(command.trim());
      
      // Validate data size (BLE characteristic has max size, typically 20 bytes)
      if (data.length > 20) {
        console.warn('[BLINKBOT] Command too long:', data.length, 'bytes (max 20)');
        if (typeof addMessage === 'function') {
          addMessage('Blink Bot: Command too long (max 20 characters).', 'error');
        }
        return false;
      }
      
      // Write to RX characteristic with timeout
      const writePromise = blinkbotCharacteristic.writeValue(data);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Write timeout')), 5000)
      );
      
      await Promise.race([writePromise, timeoutPromise]);
      
      console.log('[BLINKBOT] Command sent via BLE:', command);
      return true;
    } catch (error) {
      console.error('[BLINKBOT] Error sending BLE command:', error);
      
      // Handle different error types
      if (error.name === 'NetworkError' || 
          error.message && (error.message.includes('disconnected') || error.message.includes('not connected'))) {
        // Device disconnected
        blinkbotConnected = false;
        blinkbotDevice = null;
        blinkbotCharacteristic = null;
        blinkbotDeviceId = null;
        if (typeof addMessage === 'function') {
          addMessage('Blink Bot: Device disconnected during command send.', 'error');
        }
      } else if (error.name === 'InvalidStateError') {
        // Characteristic not writable or wrong state
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
  
  // Send USB Serial command to Blink Bot
  async function sendBlinkBotCommandSerial(command) {
    // Check connection state
    if (!blinkbotSerialConnected) {
      console.warn('[BLINKBOT] Not connected via USB Serial. Command ignored:', command);
      if (typeof addMessage === 'function') {
        addMessage('Blink Bot: Not connected via USB Serial. Please connect first.', 'error');
      }
      return false;
    }
    
    try {
      const commandWithNewline = command.trim() + '\n';
      
      // Send via Electron IPC or Socket.IO
      const isElectron = window.electronAPI && window.electronAPI.isElectron;
      
      if (isElectron) {
        // Use Electron IPC
        await window.electronAPI.writeSerial(commandWithNewline);
      } else {
        // Use Socket.IO (web mode)
        const BACKEND_URL = window.blockideResolveBackendBaseUrl();
        
        // Get socket from global scope or create new one
        let socket = window.blinkbotSerialSocket;
        if (!socket || !socket.connected) {
          // Try to get socket from existing serial connection
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
      
      console.log('[BLINKBOT] Command sent via USB Serial:', command);
      return true;
    } catch (error) {
      console.error('[BLINKBOT] Error sending USB Serial command:', error);
      
      if (typeof addMessage === 'function') {
        addMessage('Blink Bot: Error sending USB Serial command - ' + (error.message || 'Unknown error'), 'error');
      }
      
      // Check if serial connection is lost
      if (error.message && (error.message.includes('closed') || error.message.includes('not open'))) {
        blinkbotSerialConnected = false;
        blinkbotSerialPort = null;
      }
      
      return false;
    }
  }
  
  // Direct connection function (alias for connectBlinkBot)
  async function connectBlinkBotDirect(deviceName) {
    return await connectBlinkBot(deviceName);
  }
  
  // Connect to Blink Bot device using Web Bluetooth API
  async function connectBlinkBot(deviceName) {
    // Prevent multiple simultaneous connection attempts
    if (isConnecting) {
      console.log('[BLINKBOT] Connection already in progress, waiting...');
      if (typeof addMessage === 'function') {
        addMessage('Blink Bot: Connection already in progress...', 'info');
      }
      // Wait for current connection attempt to complete
      let waitCount = 0;
      while (isConnecting && waitCount < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        waitCount++;
      }
      return blinkbotConnected;
    }
    
    // If already connected, verify connection is still active
    if (blinkbotConnected && blinkbotDevice && blinkbotDevice.gatt) {
      if (blinkbotDevice.gatt.connected) {
        console.log('[BLINKBOT] Already connected to', blinkbotDevice.name);
        return true;
      } else {
        // Connection state says connected but GATT says disconnected - clear state
        console.log('[BLINKBOT] Connection state inconsistent, clearing...');
        blinkbotConnected = false;
        blinkbotDevice = null;
        blinkbotCharacteristic = null;
        blinkbotDeviceId = null;
      }
    }
    
    isConnecting = true;
    
    // Define targetName outside try block so it's accessible in catch block
    const targetName = (deviceName && deviceName.trim()) || 'BlinkBot';
    
    try {
      // Check if Web Bluetooth API is available
      if (!navigator.bluetooth) {
        const errorMsg = 'Web Bluetooth API not available. Please use Chrome/Edge or Electron.';
        console.error('[BLINKBOT]', errorMsg);
        console.error('[BLINKBOT] navigator.bluetooth:', typeof navigator.bluetooth);
        if (typeof addMessage === 'function') {
          addMessage('Blink Bot: ' + errorMsg, 'error');
        }
        isConnecting = false;
        return false;
      }
      
      console.log('[BLINKBOT] Web Bluetooth API available');
      
      // Check if Bluetooth is available (with error handling)
      let bluetoothAvailable = false;
      try {
        if (navigator.bluetooth.getAvailability) {
          bluetoothAvailable = await navigator.bluetooth.getAvailability();
          console.log('[BLINKBOT] Bluetooth availability check:', bluetoothAvailable);
        } else {
          // Some browsers don't support getAvailability, assume it's available
          console.warn('[BLINKBOT] getAvailability not supported, assuming available');
          bluetoothAvailable = true;
        }
      } catch (availabilityError) {
        console.warn('[BLINKBOT] Error checking availability:', availabilityError);
        // Assume available if check fails
        bluetoothAvailable = true;
      }
      
      if (!bluetoothAvailable) {
        const errorMsg = 'Bluetooth adapter is not available. Please enable Bluetooth.';
        console.error('[BLINKBOT]', errorMsg);
        if (typeof addMessage === 'function') {
          addMessage('Blink Bot: ' + errorMsg, 'error');
        }
        isConnecting = false;
        return false;
      }
      
      console.log('[BLINKBOT] Bluetooth adapter is available');
      
      console.log('[BLINKBOT] Requesting BLE device:', targetName);
      
      // Pre-connection checks and user guidance
      const preConnectionChecks = [];
      let allChecksPassed = true;
      
      // Check 1: ESP32 should be advertising
      if (typeof addMessage === 'function') {
        addMessage('Blink Bot: Preparing connection...', 'info');
        addMessage('Blink Bot: Make sure ESP32 is powered on and nearby (< 10 meters)', 'info');
        addMessage('Blink Bot: Check Serial Monitor - should show "Blink Bot BLE Ready!"', 'info');
      }
      
      // Check 2: Window focus (device picker might appear behind window)
      if (window.focus) {
        try {
          window.focus();
          console.log('[BLINKBOT] Window focused to ensure device picker is visible');
        } catch (e) {
          console.warn('[BLINKBOT] Could not focus window:', e);
        }
      }
      
      // CRITICAL: requestDevice() MUST be called synchronously from user gesture
      // Cannot add delays before calling requestDevice() - it breaks the user gesture chain
      // Instructions should be shown in UI BEFORE button click, not here
      
      console.log('[BLINKBOT] Requesting BLE device immediately (user gesture active)...');
      
      // Set connection timeout (30 seconds)
      connectionTimeout = setTimeout(() => {
        if (isConnecting) {
          console.error('[BLINKBOT] Connection timeout');
          isConnecting = false;
          if (typeof addMessage === 'function') {
            addMessage('Blink Bot: Connection timeout after 30 seconds', 'error');
            addMessage('Blink Bot: Make sure ESP32 is powered on and advertising', 'info');
            addMessage('Blink Bot: Check Serial Monitor to verify ESP32 is ready', 'info');
          }
        }
      }, 30000);
      
      // Request BLE device - use "show all devices" strategy first (most reliable)
      // This is most likely to show the device if ESP32 is advertising
      // MUST be called synchronously from user gesture (no await delays before this)
      let device = null;
      let lastError = null;
      
      // Show helpful message before picker appears
      if (typeof addMessage === 'function') {
        addMessage('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
        addMessage('Blink Bot: Device picker appearing now...', 'info');
        addMessage('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
        addMessage('Look for "' + targetName + '" in the device list', 'info');
        addMessage('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
      }
      
      try {
        console.log('[BLINKBOT] Showing all devices (most reliable method)...');
        // Strategy: Show all devices - user selects manually
        // This is most reliable because it doesn't filter, so if ESP32 is advertising, it will appear
        device = await navigator.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: [blinkbotServiceUUID]
        });
        console.log('[BLINKBOT] ✓ Device selected:', device.name || 'Unknown');
      } catch (error) {
        lastError = error;
        console.error('[BLINKBOT] Device selection failed:', error.name, error.message);
        
        // Check if user cancelled
        const isCancellation = error.message && error.message.toLowerCase().includes('cancelled');
        if (isCancellation) {
          console.log('[BLINKBOT] User cancelled device selection');
          // Provide helpful guidance with emphasis on checking ESP32
          if (typeof addMessage === 'function') {
            addMessage('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'warning');
            addMessage('❌ Device picker was cancelled', 'warning');
            addMessage('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
            addMessage('🔍 MOST LIKELY REASON:', 'warning');
            addMessage('"' + targetName + '" was NOT in the device list', 'warning');
            addMessage('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
            addMessage('📋 TROUBLESHOOTING STEPS:', 'info');
            addMessage('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
            addMessage('STEP 1: Check ESP32 Serial Monitor (115200 baud)', 'warning');
            addMessage('   → Open Serial Monitor in Arduino IDE', 'info');
            addMessage('   → Look for these EXACT messages:', 'info');
            addMessage('      ✓ "Blink Bot BLE Ready!"', 'info');
            addMessage('      ✓ "Waiting for BLE connection..."', 'info');
            addMessage('      ✓ "Device name: BlinkBot"', 'info');
            addMessage('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
            addMessage('STEP 2: If messages are MISSING:', 'warning');
            addMessage('   → ESP32 firmware is NOT uploaded', 'error');
            addMessage('   → Upload firmware to ESP32 first', 'error');
            addMessage('   → Wait for "Blink Bot BLE Ready!" message', 'info');
            addMessage('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
            addMessage('STEP 3: If messages ARE showing:', 'info');
            addMessage('   → Wait 2-3 seconds after ESP32 boots', 'info');
            addMessage('   → Move ESP32 closer (< 10 meters)', 'info');
            addMessage('   → Remove obstacles between devices', 'info');
            addMessage('   → Try resetting ESP32 (press reset button)', 'info');
            addMessage('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
            addMessage('STEP 4: Try connecting again', 'info');
            addMessage('   → Click Connect button', 'info');
            addMessage('   → When picker appears, look for "' + targetName + '"', 'info');
            addMessage('   → If "' + targetName + '" appears, select it!', 'success');
            addMessage('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
            addMessage('💡 TIP: The device picker shows ALL BLE devices', 'info');
            addMessage('   If "' + targetName + '" is not there, ESP32 is not advertising', 'warning');
            addMessage('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
          }
        }
        throw error;
      }
      
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
        connectionTimeout = null;
      }
      
      if (!device) {
        const errorMsg = 'No device selected from picker. Please try again and select "' + targetName + '" from the list.';
        console.error('[BLINKBOT]', errorMsg);
        if (typeof addMessage === 'function') {
          addMessage('Blink Bot: ' + errorMsg, 'error');
          addMessage('Blink Bot: Make sure ESP32 is powered on and nearby', 'info');
        }
        throw new Error(errorMsg);
      }
      
      // Verify device name matches (if device has a name)
      if (device.name && device.name.toLowerCase() !== targetName.toLowerCase() && !device.name.toLowerCase().includes(targetName.toLowerCase())) {
        console.warn('[BLINKBOT] Device name mismatch:', device.name, 'expected:', targetName);
        if (typeof addMessage === 'function') {
          addMessage('Blink Bot: ⚠️ Selected device name: "' + device.name + '" (expected: "' + targetName + '")', 'warning');
          addMessage('Blink Bot: Continuing with selected device...', 'info');
        }
      }
      
      console.log('[BLINKBOT] ✓ Device selected:', device.name || 'Unknown');
      console.log('[BLINKBOT] Device ID:', device.id);
      console.log('[BLINKBOT] Device GATT:', device.gatt ? 'available' : 'not available');
      
      if (typeof addMessage === 'function') {
        addMessage('Blink Bot: ✓ Device selected: ' + (device.name || 'Unknown'), 'success');
        addMessage('Blink Bot: Connecting to device...', 'info');
      }
      
      // Continue with GATT connection (this part can be async)
      return await completeConnection(device, targetName);
    } catch (error) {
      // Error handling is done above
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
        connectionTimeout = null;
      }
      isConnecting = false;
      return false;
    }
  }
  
  // Complete the connection after device is selected
  async function completeConnection(device, targetName) {
    try {
      
      // Connect to GATT server with timeout
      console.log('[BLINKBOT] Attempting GATT connection...');
      const connectPromise = device.gatt.connect();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('GATT connection timeout')), 15000)
      );
      const server = await Promise.race([connectPromise, timeoutPromise]);
      
      console.log('[BLINKBOT] Connected to GATT server');
      console.log('[BLINKBOT] Server connected state:', server.connected);
      
      // Verify connection
      if (!server.connected) {
        throw new Error('GATT server reports not connected after connection');
      }
      
      // Wait longer for the connection to stabilize (ESP32 needs more time)
      console.log('[BLINKBOT] Waiting for connection to stabilize...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Verify connection is still active
      if (!server.connected) {
        throw new Error('Server disconnected before service discovery');
      }
      console.log('[BLINKBOT] Connection stable, starting service discovery...');
      
      // Get the service with timeout and retry logic
      let service = null;
      let retryCount = 0;
      const maxRetries = 5; // Increased retries
      
      while (!service && retryCount < maxRetries) {
        try {
          console.log(`[BLINKBOT] Service discovery attempt ${retryCount + 1}/${maxRetries}...`);
          console.log(`[BLINKBOT] Looking for service UUID: ${blinkbotServiceUUID}`);
          
          const servicePromise = server.getPrimaryService(blinkbotServiceUUID);
          const serviceTimeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Service discovery timeout (10s)')), 10000) // Increased to 10s
          );
          service = await Promise.race([servicePromise, serviceTimeoutPromise]);
          console.log('[BLINKBOT] ✓ Service found successfully');
          break;
        } catch (error) {
          retryCount++;
          console.warn(`[BLINKBOT] Service discovery attempt ${retryCount} failed:`, error.message);
          console.warn(`[BLINKBOT] Server connected state:`, server.connected);
          
          if (retryCount < maxRetries) {
            // Wait longer between retries
            const waitTime = 500 * retryCount; // Exponential backoff
            console.log(`[BLINKBOT] Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            
            // Re-verify connection before retry
            if (!server.connected) {
              throw new Error('Server disconnected during service discovery retries');
            }
          } else {
            throw new Error('Service discovery failed after ' + maxRetries + ' attempts: ' + error.message);
          }
        }
      }
      
      if (!service) {
        throw new Error('Could not discover service');
      }
      
      // Wait a bit before characteristic discovery
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Get RX characteristic (for sending commands) with timeout and retry
      let rxCharacteristic = null;
      retryCount = 0;
      const maxCharRetries = 5; // Increased retries
      
      while (!rxCharacteristic && retryCount < maxCharRetries) {
        try {
          console.log(`[BLINKBOT] Characteristic discovery attempt ${retryCount + 1}/${maxCharRetries}...`);
          console.log(`[BLINKBOT] Looking for RX UUID: ${blinkbotRxUUID}`);
          
          const charPromise = service.getCharacteristic(blinkbotRxUUID);
          const charTimeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Characteristic discovery timeout (10s)')), 10000) // Increased to 10s
          );
          rxCharacteristic = await Promise.race([charPromise, charTimeoutPromise]);
          console.log('[BLINKBOT] ✓ RX characteristic found successfully');
          break;
        } catch (error) {
          retryCount++;
          console.warn(`[BLINKBOT] Characteristic discovery attempt ${retryCount} failed:`, error.message);
          console.warn(`[BLINKBOT] Server connected state:`, server.connected);
          
          if (retryCount < maxCharRetries) {
            // Wait longer between retries
            const waitTime = 500 * retryCount; // Exponential backoff
            console.log(`[BLINKBOT] Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            
            // Re-verify connection before retry
            if (!server.connected) {
              throw new Error('Server disconnected during characteristic discovery retries');
            }
          } else {
            throw new Error('Characteristic discovery failed after ' + maxCharRetries + ' attempts: ' + error.message);
          }
        }
      }
      
      if (!rxCharacteristic) {
        throw new Error('Could not discover RX characteristic');
      }
      
      // Verify characteristic is writable
      if (!rxCharacteristic.properties.write && !rxCharacteristic.properties.writeWithoutResponse) {
        throw new Error('RX characteristic is not writable');
      }
      
      // Wait longer to ensure everything is ready
      console.log('[BLINKBOT] Finalizing connection setup...');
      console.log('[BLINKBOT] Waiting for ESP32 to be ready...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Increased to 1000ms
      
      // Verify connection is still active before storing
      if (!server.connected) {
        console.error('[BLINKBOT] ✗ Server disconnected during final setup');
        throw new Error('Server disconnected during setup');
      }
      
      console.log('[BLINKBOT] ✓ Server connection verified:', server.connected);
      console.log('[BLINKBOT] Connection setup complete');
      
      // Verify characteristic properties
      const props = {
        write: rxCharacteristic.properties.write,
        writeWithoutResponse: rxCharacteristic.properties.writeWithoutResponse,
        notify: rxCharacteristic.properties.notify,
        read: rxCharacteristic.properties.read
      };
      console.log('[BLINKBOT] Characteristic properties:', props);
      
      if (!props.write && !props.writeWithoutResponse) {
        console.error('[BLINKBOT] Characteristic is not writable!');
        throw new Error('RX characteristic is not writable');
      }
      
      // Store connection
      blinkbotDevice = device;
      blinkbotCharacteristic = rxCharacteristic;
      blinkbotConnected = true;
      blinkbotDeviceId = device.id;
      blinkbotConnectionMode = 'BLE';
      
      console.log('[BLINKBOT] Connection fully established and verified');
      console.log('[BLINKBOT] Device:', device.name, 'ID:', device.id);
      console.log('[BLINKBOT] Server connected:', server.connected);
      console.log('[BLINKBOT] Ready to send commands');
      
      // Don't send test command - it might cause issues
      // Connection is verified by successful characteristic discovery
      console.log('[BLINKBOT] Skipping test write - connection verified by discovery');
      
      // Handle disconnection with detailed logging
      device.addEventListener('gattserverdisconnected', (event) => {
        console.error('[BLINKBOT] Device disconnected event received', {
          event: event,
          deviceName: device.name,
          deviceId: device.id,
          wasConnected: blinkbotConnected
        });
        blinkbotConnected = false;
        blinkbotDevice = null;
        blinkbotCharacteristic = null;
        blinkbotDeviceId = null;
        isConnecting = false;
        if (typeof addMessage === 'function') {
          addMessage('Blink Bot: Device disconnected unexpectedly', 'error');
        }
      });
      
      // Monitor connection state periodically (less frequent to avoid overhead)
      let monitorCount = 0;
      const connectionMonitor = setInterval(() => {
        monitorCount++;
        if (blinkbotDevice && blinkbotDevice.gatt) {
          const isConnected = blinkbotDevice.gatt.connected;
          // Only log every 5 checks to reduce console spam
          if (monitorCount % 5 === 0) {
            console.log(`[BLINKBOT] Connection check #${monitorCount}:`, {
              connected: isConnected,
              deviceName: blinkbotDevice.name,
              hasCharacteristic: !!blinkbotCharacteristic
            });
          }
          
          if (!isConnected) {
            console.error('[BLINKBOT] ✗ Connection lost - GATT reports disconnected');
            clearInterval(connectionMonitor);
            blinkbotConnected = false;
            blinkbotDevice = null;
            blinkbotCharacteristic = null;
            blinkbotDeviceId = null;
            if (typeof addMessage === 'function') {
              addMessage('Blink Bot: Connection lost', 'error');
            }
          } else {
            // Try to verify we can still access the characteristic
            if (blinkbotCharacteristic) {
              // Connection is still good
              console.log('[BLINKBOT] Connection verified - still active');
            } else {
              console.warn('[BLINKBOT] Connection active but characteristic lost');
            }
          }
        } else {
          console.warn('[BLINKBOT] Monitor: Device or GATT not available');
          clearInterval(connectionMonitor);
        }
      }, 3000); // Check every 3 seconds
      
      // Store monitor for cleanup
      if (device._blinkbotMonitor) {
        clearInterval(device._blinkbotMonitor);
      }
      device._blinkbotMonitor = connectionMonitor;
      
      // Monitor connection state
      if (server.connected) {
        console.log('[BLINKBOT] Server connection verified - connected:', server.connected);
      } else {
        console.warn('[BLINKBOT] Server connection state unclear - connected:', server.connected);
      }
      
      console.log('[BLINKBOT] Successfully connected to', device.name);
      if (typeof addMessage === 'function') {
        addMessage('Blink Bot: Connected to ' + device.name, 'success');
      }
      
      isConnecting = false;
      return true;
    } catch (error) {
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
        connectionTimeout = null;
      }
      
      blinkbotConnected = false;
      blinkbotDevice = null;
      blinkbotCharacteristic = null;
      blinkbotDeviceId = null;
      isConnecting = false;
      
      // Check if user cancelled the device selection (not a real error)
      // User cancellation can appear as NotFoundError or DOMException with "cancelled" message
      const isUserCancellation = (error.name === 'NotFoundError' || error.name === 'DOMException') && 
                                  error.message && 
                                  (error.message.toLowerCase().includes('cancelled') || 
                                   error.message.toLowerCase().includes('user cancelled') ||
                                   error.message.toLowerCase().includes('no device selected'));
      
      let errorMsg = error.message || 'Unknown error';
      let messageType = 'error';
      
      if (isUserCancellation) {
        // User cancelled - provide helpful guidance
        console.log('[BLINKBOT] User cancelled device selection');
        errorMsg = 'Connection cancelled.';
        messageType = 'info';
        
        if (typeof addMessage === 'function') {
          addMessage('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
          addMessage('Blink Bot: ℹ️ Device picker was cancelled', 'info');
          addMessage('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
          addMessage('Blink Bot: ⚠️ TROUBLESHOOTING GUIDE', 'warning');
          addMessage('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
          addMessage('If "' + targetName + '" was NOT in the device list:', 'info');
          addMessage('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
          addMessage('1. Check ESP32 Serial Monitor:', 'info');
          addMessage('   → Should show: "Blink Bot BLE Ready!"', 'info');
          addMessage('   → Should show: "Waiting for BLE connection..."', 'info');
          addMessage('   → If not showing, ESP32 firmware may not be uploaded', 'info');
          addMessage('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
          addMessage('2. Verify ESP32 is powered on:', 'info');
          addMessage('   → Check power LED is on', 'info');
          addMessage('   → Try resetting ESP32 (press reset button)', 'info');
          addMessage('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
          addMessage('3. Check distance:', 'info');
          addMessage('   → Move ESP32 closer to laptop (< 10 meters)', 'info');
          addMessage('   → Remove any obstacles between devices', 'info');
          addMessage('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
          addMessage('4. Wait after boot:', 'info');
          addMessage('   → Wait 2-3 seconds after ESP32 boots', 'info');
          addMessage('   → Wait for Serial Monitor to show "Blink Bot BLE Ready!"', 'info');
          addMessage('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
          addMessage('5. Try again:', 'info');
          addMessage('   → Fix any issues above', 'info');
          addMessage('   → Click Connect again', 'info');
          addMessage('   → When picker appears, look for "' + targetName + '"', 'info');
          addMessage('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
        }
      } else if (error.name === 'NotFoundError') {
        console.warn('[BLINKBOT] Device not found:', error.message);
        errorMsg = 'Device not found in the picker.';
        
        if (typeof addMessage === 'function') {
          addMessage('Blink Bot: ❌ Device "' + targetName + '" not found', 'error');
          addMessage('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
          addMessage('Blink Bot: Troubleshooting steps:', 'info');
          addMessage('  1. Check ESP32 is powered on', 'info');
          addMessage('  2. Check Serial Monitor shows "Blink Bot BLE Ready!"', 'info');
          addMessage('  3. Move ESP32 closer to laptop (< 10 meters)', 'info');
          addMessage('  4. Wait 2-3 seconds after ESP32 boots before connecting', 'info');
          addMessage('  5. Try clicking Connect again', 'info');
          addMessage('  6. If still not visible, ESP32 may need to be reset', 'info');
          addMessage('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
        }
      } else if (error.name === 'SecurityError') {
        console.error('[BLINKBOT] Security error:', error.message);
        
        // Check if it's the "user gesture" error
        if (error.message && error.message.includes('user gesture')) {
          errorMsg = 'Connection must be initiated from button click. Please click Connect button again.';
          if (typeof addMessage === 'function') {
            addMessage('Blink Bot: ⚠️ Security Error - User gesture lost', 'error');
            addMessage('Blink Bot: This happens if there are delays before showing the picker', 'info');
            addMessage('Blink Bot: Please click Connect button again directly', 'info');
            addMessage('Blink Bot: The device picker will appear immediately', 'info');
          }
        } else {
          errorMsg = 'Bluetooth permission denied. Please allow Bluetooth access when prompted.';
        }
      } else if (error.name === 'InvalidStateError') {
        console.error('[BLINKBOT] Invalid state error:', error.message);
        errorMsg = 'Bluetooth adapter is not available. Please check your Bluetooth settings.';
      } else if (error.name === 'NetworkError' || (error.message && error.message.includes('timeout'))) {
        console.error('[BLINKBOT] Network/timeout error:', error.message);
        errorMsg = 'Connection failed or timed out. The device may be out of range, not advertising, or unresponsive.';
      } else if (error.message && error.message.includes('not writable')) {
        console.error('[BLINKBOT] Characteristic error:', error.message);
        errorMsg = 'Device characteristic error. Please check the firmware version.';
      } else {
        // Log actual errors, but not user cancellations
        console.error('[BLINKBOT] Connection error:', error);
      }
      
      if (typeof addMessage === 'function') {
        addMessage('Blink Bot: ' + errorMsg, messageType);
      }
      return false;
    }
  }
  
  // Disconnect from Blink Bot (BLE only)
  async function disconnectBlinkBotBLE() {
    // Cancel any ongoing connection attempt
    if (isConnecting) {
      isConnecting = false;
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
        connectionTimeout = null;
      }
    }
    
    if (!blinkbotConnected && !blinkbotDevice) {
      return true; // Already disconnected
    }
    
    try {
      // Disconnect from GATT server
      if (blinkbotDevice && blinkbotDevice.gatt && blinkbotDevice.gatt.connected) {
        await blinkbotDevice.gatt.disconnect();
      }
      
      blinkbotConnected = false;
      blinkbotDevice = null;
      blinkbotCharacteristic = null;
      blinkbotDeviceId = null;
      
      console.log('[BLINKBOT] Disconnected from BLE');
      if (typeof addMessage === 'function') {
        addMessage('Blink Bot: Disconnected from BLE', 'info');
      }
      return true;
    } catch (error) {
      console.error('[BLINKBOT] BLE disconnect error:', error);
      // Clear state even if disconnect fails
      blinkbotConnected = false;
      blinkbotDevice = null;
      blinkbotCharacteristic = null;
      blinkbotDeviceId = null;
      isConnecting = false;
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
        connectionTimeout = null;
      }
      return false;
    }
  }
  
  // Hook into workspace changes to detect when command blocks are added/executed
  // This will be called when blocks are executed (if there's a run mechanism)
  // For now, we'll expose functions that can be called from the block generators
  
  // Diagnostic function
  function diagnoseBLE() {
    const diagnostics = {
      webBluetoothAvailable: !!navigator.bluetooth,
      bluetoothAdapter: 'unknown',
      connectionState: blinkbotConnected,
      deviceConnected: blinkbotDevice && blinkbotDevice.gatt ? blinkbotDevice.gatt.connected : false,
      characteristicAvailable: !!blinkbotCharacteristic,
      deviceName: blinkbotDevice ? blinkbotDevice.name : null,
      deviceId: blinkbotDeviceId,
      isConnecting: isConnecting
    };
    
    // Check Bluetooth adapter availability
    if (navigator.bluetooth && navigator.bluetooth.getAvailability) {
      navigator.bluetooth.getAvailability().then(available => {
        diagnostics.bluetoothAdapter = available ? 'available' : 'not available';
        console.log('[BLINKBOT] Diagnostics:', diagnostics);
      }).catch(err => {
        diagnostics.bluetoothAdapter = 'error: ' + err.message;
        console.log('[BLINKBOT] Diagnostics:', diagnostics);
      });
    } else {
      diagnostics.bluetoothAdapter = 'getAvailability not supported';
      console.log('[BLINKBOT] Diagnostics:', diagnostics);
    }
    
    return diagnostics;
  }
  
  // Connect to Blink Bot via USB Serial
  async function connectBlinkBotSerial(port, baudrate = 115200) {
    // Disconnect BLE if connected
    if (blinkbotConnected) {
      await disconnectBlinkBot();
    }
    
    if (blinkbotSerialConnected && blinkbotSerialPort === port) {
      console.log('[BLINKBOT] Already connected via USB Serial to', port);
      return true;
    }
    
    try {
      const isElectron = window.electronAPI && window.electronAPI.isElectron;
      
      if (isElectron) {
        // Use Electron IPC
        const result = await window.electronAPI.openSerial({ port, baudrate });
        if (result.success) {
          blinkbotSerialConnected = true;
          blinkbotSerialPort = port;
          blinkbotConnectionMode = 'SERIAL';
          console.log('[BLINKBOT] Connected via USB Serial to', port);
          if (typeof addMessage === 'function') {
            addMessage('Blink Bot: Connected via USB Serial to ' + port, 'success');
          }
          return true;
        } else {
          throw new Error(result.error || 'Failed to open serial port');
        }
      } else {
        // Use Socket.IO (web mode)
        const BACKEND_URL = window.blockideResolveBackendBaseUrl();
        
        // Get or create socket
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
        
        blinkbotSerialConnected = true;
        blinkbotSerialPort = port;
        blinkbotConnectionMode = 'SERIAL';
        console.log('[BLINKBOT] Connected via USB Serial to', port);
        if (typeof addMessage === 'function') {
          addMessage('Blink Bot: Connected via USB Serial to ' + port, 'success');
        }
        return true;
      }
    } catch (error) {
      console.error('[BLINKBOT] USB Serial connection error:', error);
      blinkbotSerialConnected = false;
      blinkbotSerialPort = null;
      
      if (typeof addMessage === 'function') {
        addMessage('Blink Bot: USB Serial connection failed - ' + (error.message || 'Unknown error'), 'error');
      }
      return false;
    }
  }
  
  // Disconnect from Blink Bot (BLE or Serial)
  async function disconnectBlinkBot() {
    // Disconnect BLE
    if (blinkbotConnected) {
      await disconnectBlinkBotBLE();
    }
    
    // Disconnect Serial
    if (blinkbotSerialConnected) {
      await disconnectBlinkBotSerial();
    }
    
    return true;
  }
  
  // Disconnect USB Serial
  async function disconnectBlinkBotSerial() {
    if (!blinkbotSerialConnected) {
      return true;
    }
    
    try {
      const isElectron = window.electronAPI && window.electronAPI.isElectron;
      
      if (isElectron) {
        await window.electronAPI.closeSerial();
      } else {
        // Use Socket.IO
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
      
      blinkbotSerialConnected = false;
      blinkbotSerialPort = null;
      
      console.log('[BLINKBOT] Disconnected from USB Serial');
      if (typeof addMessage === 'function') {
        addMessage('Blink Bot: Disconnected from USB Serial', 'info');
      }
      return true;
    } catch (error) {
      console.error('[BLINKBOT] USB Serial disconnect error:', error);
      // Clear state even if disconnect fails
      blinkbotSerialConnected = false;
      blinkbotSerialPort = null;
      return false;
    }
  }
  
  // Expose functions globally for block execution
  window.BlinkBotRuntime = {
    connect: connectBlinkBot,
    connectDirect: connectBlinkBotDirect,
    connectSerial: connectBlinkBotSerial,
    disconnect: disconnectBlinkBot,
    sendCommand: sendBlinkBotCommand,
    isConnected: () => blinkbotConnected || blinkbotSerialConnected,
    isBLEConnected: () => blinkbotConnected,
    isSerialConnected: () => blinkbotSerialConnected,
    getConnectionMode: () => blinkbotConnectionMode,
    setConnectionMode: (mode) => {
      if (mode === 'BLE' || mode === 'SERIAL') {
        blinkbotConnectionMode = mode;
        console.log('[BLINKBOT] Connection mode set to:', mode);
      }
    },
    diagnose: diagnoseBLE,
    
    // Command builders
    buildLEDCommand: function(pin, state) {
      return 'led ' + pin + ' ' + (state === 'HIGH' ? 'high' : 'low');
    },
    
    buildBlinkCommand: function(pin, times, delay) {
      // Optimized compact format to stay within 20-byte BLE limit
      // Format: "blink led<pin> d<delay>" (ESP32 parser accepts this)
      // Example: "blink led2 d500" = 15 bytes (fits!)
      // Example: "blink led2 d5000" = 16 bytes (fits!)
      // Example: "blink led13 d10000" = 18 bytes (fits!)
      // This is more compact while still being parseable by ESP32
      return 'blink led' + pin + ' d' + delay;
    }
  };
  
  console.log('[BLINKBOT] Runtime handler loaded');
})();

