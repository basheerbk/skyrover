# Blink Bot Firmware

## 📁 Files

- **BlinkBot.ino** - Complete standalone ESP32 firmware

## 🚀 Quick Start

### 1. Upload Firmware
1. Open `BlinkBot.ino` in Arduino IDE
2. Select your ESP32 board:
   - Tools → Board → ESP32 Arduino → ESP32 Dev Module
3. Select the correct COM port
4. Click Upload
5. Wait for upload to complete

### 2. Verify Setup
1. Open Serial Monitor (115200 baud)
2. You should see:
   ```
   === Blink Bot Firmware ===
   BLE Server started and advertising
   Blink Bot BLE Ready!
   Waiting for BLE connection...
   Device name: BlinkBot
   ```

### 3. Connect via BLE
- Use the Blockly IDE "Run" button to connect
- Or use any BLE scanner app to find "BlinkBot"

## 📡 Supported Commands

Send these commands via BLE:

- `led 22 high` - Turn LED on pin 22 ON
- `led 22 low` - Turn LED on pin 22 OFF
- `blink led 22 delay 500` - Blink LED on pin 22 for 500ms

## ⚙️ Customization

### Change Device Name
Edit line 113 in `BlinkBot.ino`:
```cpp
BLEDevice::init("YourDeviceName");  // Change this
```

### Add More Commands
Edit the `executeCommand()` function to add new command handlers.

## 🔧 Requirements

- ESP32 board (any variant)
- Arduino IDE with ESP32 board support installed
- USB cable for initial upload

## 📝 Notes

- This firmware only needs to be uploaded **once** via USB
- After that, control your ESP32 wirelessly via BLE
- Commands are sent from the Blockly IDE "Run" button
- Serial Monitor shows received commands and connection status

