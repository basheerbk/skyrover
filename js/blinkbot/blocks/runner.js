(function() {
  'use strict';

  // Attaches the Blink Bot Run button handler (logic unchanged).
  function attachRunHandler(runBtn) {
    if (!runBtn) {
      console.error('[INIT] Cannot attach Run button handler - button not found');
      return;
    }

    let isRunning = false; // Prevent multiple simultaneous runs

    runBtn.addEventListener('click', async function() {
      console.log('[RUN] Run button clicked');

      // Prevent rapid clicks
      if (isRunning) {
        console.log('[RUN] Already running, ignoring click');
        if (typeof addMessage === 'function') {
          addMessage('Blink Bot: Already running. Please wait...', 'info');
        }
        return;
      }

      // Check if runtime is loaded
      if (!window.BlinkBotRuntime) {
        console.error('[RUN] BlinkBotRuntime not available');
        if (typeof addMessage === 'function') {
          addMessage('Blink Bot: Runtime not loaded. Please refresh the page.', 'error');
        }
        return;
      }

      console.log('[RUN] Starting execution...');
      isRunning = true;
      runBtn.disabled = true;

      try {
        // Get all blocks in the workspace
        const workspace = Blockly.getMainWorkspace();
        if (!workspace) {
          console.error('[RUN] No workspace found');
          if (typeof addMessage === 'function') {
            addMessage('Blink Bot: No workspace found.', 'error');
          }
          return;
        }

        console.log('[RUN] Workspace found');

        // Get device name from blinkbot_setup block
        let deviceName = 'BlinkBot';
        const allBlocks = workspace.getAllBlocks();
        console.log('[RUN] Total blocks in workspace:', allBlocks.length);

        let setupBlockFound = false;
        for (let i = 0; i < allBlocks.length; i++) {
          if (allBlocks[i].type === 'blinkbot_setup') {
            deviceName = allBlocks[i].getFieldValue('DEVICE_NAME') || 'BlinkBot';
            setupBlockFound = true;
            console.log('[RUN] Setup block found, device name:', deviceName);
            break;
          }
        }

        // If setup block is missing, allow run quietly (assumes firmware already flashed)

        // Find all Blink Bot runtime blocks (hat first if present)
        const runtimeBlocks = [];
        let hatBlock = null;
        let warnedOutOfLoop = false;

        for (let i = 0; i < allBlocks.length; i++) {
          const block = allBlocks[i];
          if (block.type === 'blinkbot_when_run') {
            hatBlock = block;
          }
          if (block.type === 'blinkbot_connect_ble' ||
              block.type === 'blinkbot_disconnect' ||
              block.type === 'blinkbot_is_connected' ||
              block.type === 'blinkbot_led_control' ||
              block.type === 'blinkbot_start_blink' ||
              block.type === 'blinkbot_stop_blink' ||
              block.type === 'blinkbot_repeat_times') {
            // Check if block is in loop section
            let parent = block.getParent();
            let inLoop = false;
            while (parent) {
              if (parent.type === 'base_loop' || parent.type === 'base_setup_loop') {
                inLoop = true;
                break;
              }
              parent = parent.getParent();
            }
            if (!inLoop && !warnedOutOfLoop && typeof addMessage === 'function') {
              addMessage('Blink Bot: Command blocks usually go in Loop; running anyway.', 'info');
              warnedOutOfLoop = true;
            }
            runtimeBlocks.push(block);
            console.log('[RUN] Found runtime block:', block.type, 'inLoop?', inLoop);
          }
        }

        // If hat exists, start execution from the hat's stack order
        if (hatBlock) {
          const ordered = [];
          let current = hatBlock.getNextBlock && hatBlock.getNextBlock();
          while (current) {
            if (runtimeBlocks.indexOf(current) >= 0) {
              ordered.push(current);
            }
            current = current.getNextBlock && current.getNextBlock();
          }
          // Append any other runtime blocks not in the hat chain
          for (let k = 0; k < runtimeBlocks.length; k++) {
            if (ordered.indexOf(runtimeBlocks[k]) === -1) {
              ordered.push(runtimeBlocks[k]);
            }
          }
          runtimeBlocks.length = 0;
          runtimeBlocks.push(...ordered);
        }

        console.log('[RUN] Total runtime blocks found:', runtimeBlocks.length);

        if (runtimeBlocks.length === 0) {
          return;
        }

        // Quiet execution start
        console.log('[RUN] Starting block execution...');

        const runChildStack = async (first) => {
          let current = first;
          while (current) {
            await executeBlock(current);
            current = current.getNextBlock && current.getNextBlock();
          }
        };

        const executeBlock = async (block) => {
          if (!block) return;
          console.log('[RUN] Executing block:', block.type);
          if (block.type === 'blinkbot_repeat_times') {
            const timesCode = Blockly.Arduino.valueToCode(block, 'TIMES', Blockly.Arduino.ORDER_ATOMIC) || '0';
            const times = parseInt(timesCode);
            if (isNaN(times) || times < 1 || times > 10000) {
              if (typeof addMessage === 'function') addMessage('Blink Bot: Invalid repeat count (1-10000).', 'error');
              return;
            }
            const body = block.getInputTargetBlock('DO');
            if (!body) {
              if (typeof addMessage === 'function') addMessage('Blink Bot: Repeat block has no commands inside.', 'warning');
              return;
            }
            for (let t = 0; t < times; t++) {
              await runChildStack(body);
            }
            return;
          }

          try {
            if (block.type === 'blinkbot_connect_ble') {
              const connectionType = block.getFieldValue('CONNECTION_TYPE') || 'BLE';
              let blockDeviceName = Blockly.Arduino.valueToCode(block, 'DEVICE_NAME', Blockly.Arduino.ORDER_ATOMIC) || '"' + deviceName + '"';
              blockDeviceName = blockDeviceName.replace(/^["']|["']$/g, '');

              if (connectionType === 'BLE') {
                if (typeof addMessage === 'function') {
                  addMessage('Blink Bot: Connecting via BLE to ' + blockDeviceName + '...', 'info');
                }
                const connected = await window.BlinkBotRuntime.connectDirect(blockDeviceName);
                if (connected) {
                  if (typeof addMessage === 'function') addMessage('Blink Bot: Connected successfully!', 'success');
                } else {
                  if (typeof addMessage === 'function') addMessage('Blink Bot: Connection failed.', 'error');
                }
              } else if (connectionType === 'SERIAL') {
                if (typeof addMessage === 'function') {
                  addMessage('Blink Bot: USB Serial connection not yet implemented in blocks.', 'warning');
                }
              }
            } else if (block.type === 'blinkbot_disconnect') {
              if (window.BlinkBotRuntime.isConnected()) {
                await window.BlinkBotRuntime.disconnect();
                if (typeof addMessage === 'function') addMessage('Blink Bot: Disconnected', 'info');
              } else {
                if (typeof addMessage === 'function') addMessage('Blink Bot: Already disconnected', 'info');
              }
            } else if (block.type === 'blinkbot_led_control') {
              if (!window.BlinkBotRuntime.isConnected()) {
                if (typeof addMessage === 'function') addMessage('Blink Bot: Not connected. Skipping LED control block.', 'error');
                return;
              }

              const state = block.getFieldValue('STATE');
              if (!state) {
                if (typeof addMessage === 'function') addMessage('Blink Bot: Invalid LED state. Skipping block.', 'error');
                return;
              }
              const pin = Blockly.Arduino.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || '2';
              const pinNum = parseInt(pin);
              if (isNaN(pinNum) || pinNum < 0 || pinNum > 39) {
                if (typeof addMessage === 'function') addMessage('Blink Bot: Invalid pin number (' + pin + '). Must be 0-39.', 'error');
                return;
              }
              const command = window.BlinkBotRuntime.buildLEDCommand(pin, state);
              const success = await window.BlinkBotRuntime.sendCommand(command);
              if (success && typeof addMessage === 'function') {
                addMessage('Blink Bot: LED ' + state + ' (pin ' + pin + ')', 'success');
              }
            } else if (block.type === 'blinkbot_start_blink') {
              if (!window.BlinkBotRuntime.isConnected()) {
                if (typeof addMessage === 'function') addMessage('Blink Bot: Not connected. Skipping blink block.', 'error');
                return;
              }

              const delay = Blockly.Arduino.valueToCode(block, 'DELAY', Blockly.Arduino.ORDER_ATOMIC) || '500';
              const delayInt = parseInt(delay);

              if (isNaN(delayInt) || delayInt < 1 || delayInt > 10000) {
                if (typeof addMessage === 'function') addMessage('Blink Bot: Invalid delay (' + delay + '). Must be 1-10000ms.', 'error');
                return;
              }

              // Single blink command: "blink <delay>" (firmware handles pin 23 and timing)
              const command = 'blink ' + delayInt;
              const success = await window.BlinkBotRuntime.sendCommand(command);
              if (success && typeof addMessage === 'function') {
                addMessage('Blink Bot: Blinked pin 23 for ' + delayInt + 'ms', 'success');
              } else if (!success && typeof addMessage === 'function') {
                addMessage('Blink Bot: Failed to blink.', 'error');
              }
            } else if (block.type === 'blinkbot_stop_blink') {
              if (!window.BlinkBotRuntime.isConnected()) {
                if (typeof addMessage === 'function') addMessage('Blink Bot: Not connected. Skipping stop blink block.', 'error');
                return;
              }

              const command = 'stop blink';
              const success = await window.BlinkBotRuntime.sendCommand(command);
              if (success && typeof addMessage === 'function') {
                addMessage('Blink Bot: Stopped blink loop', 'success');
              }
            } else if (block.type === 'blinkbot_is_connected') {
              const connected = window.BlinkBotRuntime.isConnected();
              if (typeof addMessage === 'function') {
                addMessage('Blink Bot: Connected? ' + (connected ? 'Yes' : 'No'), connected ? 'success' : 'info');
              }
            } else if (block.type === 'blinkbot_run_info') {
              if (typeof addMessage === 'function') {
                addMessage('Blink Bot: Commands run live when you click Run (no upload).', 'info');
              }
            }
          } catch (blockError) {
            console.error('[RUN] Error executing block:', blockError);
            if (typeof addMessage === 'function') {
              addMessage('Blink Bot: Error in block - ' + (blockError.message || 'Unknown error'), 'error');
            }
          }
        };

        for (let i = 0; i < runtimeBlocks.length; i++) {
          await executeBlock(runtimeBlocks[i]);
        }

        if (typeof addMessage === 'function') {
          addMessage('Blink Bot: All commands executed successfully!', 'success');
        }
        console.log('[RUN] All commands executed successfully');

      } catch (error) {
        console.error('[RUN] Error during execution:', error);
        if (typeof addMessage === 'function') {
          addMessage('Blink Bot: Error - ' + (error.message || error.toString() || 'Unknown error'), 'error');
        }
      } finally {
        console.log('[RUN] Resetting run state');
        isRunning = false;
        if (runBtn) {
          runBtn.disabled = false;
        }
      }
    });
  }

  // Programmatic runner (used when Run button delegates directly)
  let running = false;
  async function runBlocks() {
    if (running) {
      console.log('[RUN] Already running, ignoring call');
      if (typeof addMessage === 'function') addMessage('Blink Bot: Already running. Please wait...', 'info');
      return;
    }
    running = true;
    try {
      // Check if runtime is loaded
      if (!window.BlinkBotRuntime) {
        console.error('[RUN] BlinkBotRuntime not available');
        if (typeof addMessage === 'function') addMessage('Blink Bot: Runtime not loaded. Please refresh the page.', 'error');
        return;
      }

      // Get all blocks in the workspace
      const workspace = Blockly.getMainWorkspace();
      if (!workspace) {
        console.error('[RUN] No workspace found');
        if (typeof addMessage === 'function') addMessage('Blink Bot: No workspace found.', 'error');
        return;
      }

      // Get device name from blinkbot_setup block
      let deviceName = 'BlinkBot';
      const allBlocks = workspace.getAllBlocks();
      for (let i = 0; i < allBlocks.length; i++) {
        if (allBlocks[i].type === 'blinkbot_setup') {
          deviceName = allBlocks[i].getFieldValue('DEVICE_NAME') || 'BlinkBot';
          break;
        }
      }

      // Find all Blink Bot runtime blocks (hat first if present)
      const runtimeBlocks = [];
      let hatBlock = null;
      let warnedOutOfLoop = false;

      // Build a set of all blocks that are nested inside repeat blocks
      const nestedInRepeatSet = new Set();
      for (let i = 0; i < allBlocks.length; i++) {
        const rb = allBlocks[i];
        if (rb.type === 'blinkbot_repeat_times') {
          const doInput = rb.getInput('DO');
          if (doInput && doInput.connection) {
            // Get all blocks in the DO stack
            let doBlock = doInput.connection.targetBlock();
            while (doBlock) {
              nestedInRepeatSet.add(doBlock.id);
              doBlock = doBlock.getNextBlock && doBlock.getNextBlock();
            }
          }
        }
      }
      
      // Helper to check if a block is nested inside a repeat block's DO input
      const isNestedInRepeat = (block) => {
        return block && nestedInRepeatSet.has(block.id);
      };

      for (let i = 0; i < allBlocks.length; i++) {
        const block = allBlocks[i];
        if (block.type === 'blinkbot_when_run') {
          hatBlock = block;
        }
        if (block.type === 'blinkbot_connect_ble' ||
            block.type === 'blinkbot_disconnect' ||
            block.type === 'blinkbot_is_connected' ||
            block.type === 'blinkbot_led_control' ||
            block.type === 'blinkbot_start_blink' ||
            block.type === 'blinkbot_stop_blink' ||
            block.type === 'blinkbot_repeat_times') {
          // Skip blocks that are nested inside a repeat block's DO input
          // (they will be executed by the repeat block itself)
          if (isNestedInRepeat(block)) {
            console.log('[RUN] Skipping nested block:', block.type, '(will be executed by repeat block)');
            continue;
          }
          
          // Check if block is in loop section
          let parent = block.getParent();
          let inLoop = false;
          while (parent) {
            if (parent.type === 'base_loop' || parent.type === 'base_setup_loop') {
              inLoop = true;
              break;
            }
            parent = parent.getParent();
          }
          if (!inLoop && !warnedOutOfLoop && typeof addMessage === 'function') {
            addMessage('Blink Bot: Command blocks usually go in Loop; running anyway.', 'info');
            warnedOutOfLoop = true;
          }
          runtimeBlocks.push(block);
          console.log('[RUN] Found runtime block:', block.type, 'inLoop?', inLoop);
        }
      }

      // If hat exists, start execution from the hat's stack order
      if (hatBlock) {
        const ordered = [];
        let current = hatBlock.getNextBlock && hatBlock.getNextBlock();
        while (current) {
          if (runtimeBlocks.indexOf(current) >= 0) {
            ordered.push(current);
          }
          current = current.getNextBlock && current.getNextBlock();
        }
        // Append any other runtime blocks not in the hat chain
        for (let k = 0; k < runtimeBlocks.length; k++) {
          if (ordered.indexOf(runtimeBlocks[k]) === -1) {
            ordered.push(runtimeBlocks[k]);
          }
        }
        runtimeBlocks.length = 0;
        runtimeBlocks.push(...ordered);
      }

      console.log('[RUN] Total runtime blocks found:', runtimeBlocks.length);
      if (runtimeBlocks.length === 0) return;

      console.log('[RUN] Starting block execution...');

      const runChildStack = async (first) => {
        let current = first;
        while (current) {
          await executeBlock(current);
          current = current.getNextBlock && current.getNextBlock();
        }
      };

      const executeBlock = async (block) => {
        if (!block) return;
        console.log('[RUN] Executing block:', block.type);
        if (block.type === 'blinkbot_repeat_times') {
          // Get value from value input (block now uses value input, not field)
          let times = null;
          const timesInput = block.getInput('TIMES');
          
          if (timesInput && timesInput.connection) {
            const timesBlock = timesInput.connection.targetBlock();
            if (timesBlock) {
              // Check if it's a number block (most common case)
              if (timesBlock.type === 'math_number') {
                const timesValue = timesBlock.getFieldValue('NUM');
                times = parseInt(timesValue);
                console.log('[RUN] Repeat block: got times from number block:', times);
              } else {
                // Try to evaluate the block (for expressions or variables)
                try {
                  const timesCode = Blockly.JavaScript.blockToCode(timesBlock);
                  times = parseInt(eval(timesCode));
                  console.log('[RUN] Repeat block: evaluated times from expression:', times, 'code:', timesCode);
                } catch (e) {
                  console.error('[RUN] Failed to evaluate times expression:', e);
                }
              }
            }
          }
          
          // Fallback: try to get from shadow block or default
          if (times === null || isNaN(times)) {
            // Check if there's a shadow block
            if (timesInput && timesInput.connection) {
              const shadowBlock = timesInput.connection.getSourceBlock();
              if (shadowBlock && shadowBlock.type === 'math_number') {
                times = parseInt(shadowBlock.getFieldValue('NUM') || '3');
                console.log('[RUN] Repeat block: got times from shadow block:', times);
              }
            }
            // Last resort: default to 3
            if (times === null || isNaN(times)) {
              times = 3;
              console.log('[RUN] Repeat block: using default times:', times);
            }
          }
          
          if (isNaN(times) || times < 1 || times > 10000) {
            if (typeof addMessage === 'function') addMessage('Blink Bot: Invalid repeat count (' + times + '). Must be 1-10000.', 'error');
            return;
          }
          console.log('[RUN] Repeat block: final times =', times);
          const body = block.getInputTargetBlock('DO');
          console.log('[RUN] Repeat block body:', body ? body.type : 'null');
          if (!body) {
            if (typeof addMessage === 'function') addMessage('Blink Bot: Repeat block has no commands inside.', 'warning');
            return;
          }
          console.log('[RUN] Starting repeat loop: ' + times + ' iterations');
          for (let t = 0; t < times; t++) {
            console.log('[RUN] Repeat iteration ' + (t + 1) + '/' + times);
            await runChildStack(body);
            // Small delay between iterations
            await new Promise(resolve => setTimeout(resolve, 10));
          }
          console.log('[RUN] Repeat loop completed');
          return;
        }

        try {
          if (block.type === 'blinkbot_connect_ble') {
            const connectionType = block.getFieldValue('CONNECTION_TYPE') || 'BLE';
            let blockDeviceName = Blockly.Arduino.valueToCode(block, 'DEVICE_NAME', Blockly.Arduino.ORDER_ATOMIC) || '"' + deviceName + '"';
            blockDeviceName = blockDeviceName.replace(/^["']|["']$/g, '');

            if (connectionType === 'BLE') {
              if (typeof addMessage === 'function') addMessage('Blink Bot: Connecting via BLE to ' + blockDeviceName + '...', 'info');
              const connected = await window.BlinkBotRuntime.connectDirect(blockDeviceName);
              if (connected) {
                if (typeof addMessage === 'function') addMessage('Blink Bot: Connected successfully!', 'success');
              } else {
                if (typeof addMessage === 'function') addMessage('Blink Bot: Connection failed.', 'error');
              }
            } else if (connectionType === 'SERIAL') {
              if (typeof addMessage === 'function') addMessage('Blink Bot: USB Serial connection not yet implemented in blocks.', 'warning');
            }
          } else if (block.type === 'blinkbot_disconnect') {
            if (window.BlinkBotRuntime.isConnected()) {
              await window.BlinkBotRuntime.disconnect();
              if (typeof addMessage === 'function') addMessage('Blink Bot: Disconnected', 'info');
            } else {
              if (typeof addMessage === 'function') addMessage('Blink Bot: Already disconnected', 'info');
            }
          } else if (block.type === 'blinkbot_led_control') {
            if (!window.BlinkBotRuntime.isConnected()) {
              if (typeof addMessage === 'function') addMessage('Blink Bot: Not connected. Skipping LED control block.', 'error');
              return;
            }

            const state = block.getFieldValue('STATE');
            if (!state) {
              if (typeof addMessage === 'function') addMessage('Blink Bot: Invalid LED state. Skipping block.', 'error');
              return;
            }
            const pin = Blockly.Arduino.valueToCode(block, 'PIN', Blockly.Arduino.ORDER_ATOMIC) || '2';
            const pinNum = parseInt(pin);
            if (isNaN(pinNum) || pinNum < 0 || pinNum > 39) {
              if (typeof addMessage === 'function') addMessage('Blink Bot: Invalid pin number (' + pin + '). Must be 0-39.', 'error');
              return;
            }
            const command = window.BlinkBotRuntime.buildLEDCommand(pin, state);
            const success = await window.BlinkBotRuntime.sendCommand(command);
            if (success && typeof addMessage === 'function') addMessage('Blink Bot: LED ' + state + ' (pin ' + pin + ')', 'success');
          } else if (block.type === 'blinkbot_start_blink') {
            if (!window.BlinkBotRuntime.isConnected()) {
              if (typeof addMessage === 'function') addMessage('Blink Bot: Not connected. Skipping blink block.', 'error');
              return;
            }

            const delay = Blockly.Arduino.valueToCode(block, 'DELAY', Blockly.Arduino.ORDER_ATOMIC) || '500';
            const delayInt = parseInt(delay);

            if (isNaN(delayInt) || delayInt < 1 || delayInt > 10000) {
              if (typeof addMessage === 'function') addMessage('Blink Bot: Invalid delay (' + delay + '). Must be 1-10000ms.', 'error');
              return;
            }

            // Single blink command: "blink <delay>" (firmware handles pin 23 and timing)
            const command = 'blink ' + delayInt;
            const success = await window.BlinkBotRuntime.sendCommand(command);
            if (success && typeof addMessage === 'function') {
              addMessage('Blink Bot: Blinked pin 23 for ' + delayInt + 'ms', 'success');
            } else if (!success && typeof addMessage === 'function') {
              addMessage('Blink Bot: Failed to blink.', 'error');
            }
          } else if (block.type === 'blinkbot_stop_blink') {
            if (!window.BlinkBotRuntime.isConnected()) {
              if (typeof addMessage === 'function') addMessage('Blink Bot: Not connected. Skipping stop blink block.', 'error');
              return;
            }

            const command = 'stop blink';
            const success = await window.BlinkBotRuntime.sendCommand(command);
            if (success && typeof addMessage === 'function') addMessage('Blink Bot: Stopped blink loop', 'success');
          } else if (block.type === 'blinkbot_is_connected') {
            const connected = window.BlinkBotRuntime.isConnected();
            if (typeof addMessage === 'function') addMessage('Blink Bot: Connected? ' + (connected ? 'Yes' : 'No'), connected ? 'success' : 'info');
          }
        } catch (blockError) {
          console.error('[RUN] Error executing block:', blockError);
          if (typeof addMessage === 'function') addMessage('Blink Bot: Error in block - ' + (blockError.message || 'Unknown error'), 'error');
        }
      };

      for (let i = 0; i < runtimeBlocks.length; i++) {
        await executeBlock(runtimeBlocks[i]);
      }

      if (typeof addMessage === 'function') addMessage('Blink Bot: All commands executed successfully!', 'success');
      console.log('[RUN] All commands executed successfully');

    } catch (error) {
      console.error('[RUN] Error during execution:', error);
      if (typeof addMessage === 'function') addMessage('Blink Bot: Error - ' + (error.message || error.toString() || 'Unknown error'), 'error');
    } finally {
      console.log('[RUN] Resetting run state');
      running = false;
    }
  }

  window.BlinkBotRunner = { attachRunHandler, runBlocks };
})();

