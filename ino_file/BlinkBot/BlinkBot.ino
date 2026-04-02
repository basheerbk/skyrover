
// ============================================
// INCLUDES
// ============================================
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLE2902.h>

// ============================================
// CONFIGURATION
// ============================================
namespace BlinkBotConfig {
  // BLE UUIDs
  const char* SERVICE_UUID = "12345678-1234-1234-1234-123456789abc";
  const char* CHARACTERISTIC_UUID_RX = "87654321-4321-4321-4321-cba987654321";
  const char* CHARACTERISTIC_UUID_TX = "11111111-2222-3333-4444-555555555555";
  
  // Device name
  const char* DEVICE_NAME = "BlinkBot";
  
  // Pin definitions
  const int LED_BUILTIN = 2;           // Built-in LED pin
  const int BLINKBOT_PIN_DEFAULT = 23; // Default blink pin (hardcoded)
  
  // Timing
  const int SERIAL_BAUD = 115200;
  const int LOOP_DELAY_MS = 20;        // Main loop delay for BLE stack
  const int MAX_DELAY_MS = 10000;      // Maximum blink delay
  const int MIN_DELAY_MS = 1;          // Minimum blink delay
}

// ============================================
// PIN UTILITIES
// ============================================
namespace PinUtils {
  // ESP32 pins that cannot be used as outputs
  const int INVALID_OUTPUT_PINS[] = {6, 7, 8, 9, 10, 11, 34, 35, 36, 39};
  const int NUM_INVALID_PINS = sizeof(INVALID_OUTPUT_PINS) / sizeof(INVALID_OUTPUT_PINS[0]);
  
  /**
   * Check if pin is valid for output
   */
  bool isValidOutputPin(int pin) {
    if (pin < 0 || pin > 39) return false;
    
    for (int i = 0; i < NUM_INVALID_PINS; i++) {
      if (pin == INVALID_OUTPUT_PINS[i]) return false;
    }
    
    return true;
  }
  
  /**
   * Parse number from command string
   * Handles both spaced and non-spaced formats
   */
  int parseNumber(String cmd, int startPos) {
    if (startPos < 0 || startPos >= cmd.length()) return 0;
    
    // Skip whitespace
    while (startPos < cmd.length() && (cmd[startPos] == ' ' || cmd[startPos] == '\t')) {
      startPos++;
    }
    
    if (startPos >= cmd.length()) return 0;
    
    // Find end of number
    int endPos = startPos;
    while (endPos < cmd.length() && isDigit(cmd[endPos])) {
      endPos++;
    }
    
    if (endPos == startPos) return 0;
    
    String numStr = cmd.substring(startPos, endPos);
    numStr.trim();
    return numStr.toInt();
  }
}

// ============================================
// LED CONTROL
// ============================================
namespace LEDControl {
  /**
   * Set LED pin state with validation
   */
  void setLED(int pin, bool state) {
    Serial.print("[LED] Setting GPIO ");
    Serial.print(pin);
    Serial.print(" to ");
    Serial.println(state ? "HIGH" : "LOW");
    
    if (!PinUtils::isValidOutputPin(pin)) {
      Serial.print("[LED] ✗ Invalid pin: ");
      Serial.println(pin);
      return;
    }
    
    pinMode(pin, OUTPUT);
    delayMicroseconds(100);
    digitalWrite(pin, state);
    
    Serial.print("[LED] ✓ GPIO ");
    Serial.print(pin);
    Serial.print(" = ");
    Serial.println(state ? "HIGH" : "LOW");
  }
  
  void blinkOnce(int pin, int delayMs) {
    Serial.print("[BLINK] Single blink: GPIO ");
    Serial.print(pin);
    Serial.print(" for ");
    Serial.print(delayMs);
    Serial.println(" ms");
    
    if (!PinUtils::isValidOutputPin(pin)) {
      Serial.print("[BLINK] ✗ Invalid pin: ");
      Serial.println(pin);
      return;
    }
    
    if (delayMs < BlinkBotConfig::MIN_DELAY_MS || delayMs > BlinkBotConfig::MAX_DELAY_MS) {
      Serial.print("[BLINK] ✗ Invalid delay: ");
      Serial.print(delayMs);
      Serial.println(" ms");
      return;
    }
    
    // Turn ON and wait
    setLED(pin, HIGH);
    delay(delayMs);
    
    // Turn OFF and wait (equal delay for symmetric blink)
    setLED(pin, LOW);
    delay(delayMs);
    
    Serial.println("[BLINK] ✓ Single blink complete");
  }
}

// ============================================
// BLINK LOOP CONTROL
// ============================================
namespace BlinkLoop {
  // State variables
  bool active = false;
  int pin = -1;
  int delayMs = 0;
  unsigned long lastBlinkTime = 0;
  bool blinkState = false;
  
  // Forward declarations
  void stop();
  
  /**
   * Start continuous blink loop
   */
  void start(int pin, int delayMs) {
    if (active) stop();
    
    if (!PinUtils::isValidOutputPin(pin)) {
      Serial.print("[LOOP] ✗ Invalid pin: ");
      Serial.println(pin);
      return;
    }
    
    if (delayMs < BlinkBotConfig::MIN_DELAY_MS || delayMs > BlinkBotConfig::MAX_DELAY_MS) {
      Serial.print("[LOOP] ✗ Invalid delay: ");
      Serial.print(delayMs);
      Serial.println(" ms");
      return;
    }
    
    active = true;
    BlinkLoop::pin = pin;
    BlinkLoop::delayMs = delayMs;
    blinkState = false;
    lastBlinkTime = millis();
    
    pinMode(pin, OUTPUT);
    digitalWrite(pin, LOW);
    
    Serial.println("[LOOP] ========================================");
    Serial.print("[LOOP] Starting continuous blink: GPIO ");
    Serial.print(pin);
    Serial.print(", delay ");
    Serial.print(delayMs);
    Serial.println(" ms");
    Serial.println("[LOOP] ========================================");
  }
  
  /**
   * Stop continuous blink loop
   */
  void stop() {
    if (!active) return;
    
    Serial.println("[LOOP] Stopping blink loop...");
    
    if (pin >= 0 && PinUtils::isValidOutputPin(pin)) {
      LEDControl::setLED(pin, LOW);
    }
    
    active = false;
    pin = -1;
    delayMs = 0;
    blinkState = false;
    
    Serial.println("[LOOP] ✓ Blink loop stopped");
  }
  
  /**
   * Update blink loop (call in main loop)
   */
  void update() {
    if (!active || pin < 0) return;
    
    unsigned long currentTime = millis();
    if (currentTime - lastBlinkTime >= delayMs) {
      blinkState = !blinkState;
      digitalWrite(pin, blinkState ? HIGH : LOW);
      lastBlinkTime = currentTime;
    }
  }
  
  /**
   * Check if loop is active on specific pin
   */
  bool isActiveOnPin(int pin) {
    return active && BlinkLoop::pin == pin;
  }
}

// ============================================
// COMMAND PARSER
// ============================================
namespace CommandParser {
  /**
   * Execute command from BLE or Serial
   */
  void execute(String cmd, const char* source = "BLE") {
    cmd.trim();
    if (cmd.length() == 0) return;
    
    Serial.println("\n[CMD] ========================================");
    Serial.print("[CMD] Command from ");
    Serial.print(source);
    Serial.print(": ");
    Serial.println(cmd);
    
    String cmdLower = cmd;
    cmdLower.toLowerCase();
    
    // Parse "stop blink"
    if (cmdLower == "stop blink" || cmdLower == "stopblink") {
      BlinkLoop::stop();
      Serial.println("[CMD] ✓ Command executed");
      Serial.println("[CMD] ========================================");
      return;
    }
    
    // Parse single blink: "blink <delay>" (hardcoded pin 23)
    if (cmdLower.startsWith("blink ")) {
      int delayPos = cmdLower.indexOf("blink ") + 6;
      int delayMs = PinUtils::parseNumber(cmdLower, delayPos);
      
      if (delayMs >= BlinkBotConfig::MIN_DELAY_MS && delayMs <= BlinkBotConfig::MAX_DELAY_MS) {
        LEDControl::blinkOnce(BlinkBotConfig::BLINKBOT_PIN_DEFAULT, delayMs);
        Serial.println("[CMD] ✓ Command executed");
      } else {
        Serial.print("[CMD] ✗ Invalid delay: ");
        Serial.println(delayMs);
      }
      Serial.println("[CMD] ========================================");
      return;
    }
    
    // Parse continuous blink loop: "blink led <pin> delay <ms>" or "blink led<pin> d<ms>"
    if (cmdLower.startsWith("blink led")) {
      int ledPos = cmdLower.indexOf("led") + 3;
      int delayPos = cmdLower.indexOf("delay");
      int dPos = cmdLower.indexOf(" d");
      int dPosCompact = cmdLower.indexOf("d", ledPos);
      
      int pin = 0;
      int delayMs = 0;
      
      // Try compact format with space: "blink led2 d500"
      if (dPos > ledPos && (delayPos < 0 || dPos < delayPos)) {
        pin = PinUtils::parseNumber(cmdLower, ledPos);
        delayMs = PinUtils::parseNumber(cmdLower, dPos + 2);
      }
      // Try compact format without space: "blink led2d500"
      else if (dPosCompact > ledPos && (delayPos < 0 || dPosCompact < delayPos)) {
        pin = PinUtils::parseNumber(cmdLower, ledPos);
        delayMs = PinUtils::parseNumber(cmdLower, dPosCompact + 1);
      }
      // Standard format: "blink led <pin> delay <ms>"
      else if (delayPos > ledPos) {
        pin = PinUtils::parseNumber(cmdLower, ledPos);
        delayMs = PinUtils::parseNumber(cmdLower, delayPos + 5);
      }
      
      if (PinUtils::isValidOutputPin(pin) && delayMs >= BlinkBotConfig::MIN_DELAY_MS && delayMs <= BlinkBotConfig::MAX_DELAY_MS) {
        BlinkLoop::start(pin, delayMs);
        Serial.println("[CMD] ✓ Command executed");
      } else {
        Serial.println("[CMD] ✗ Invalid pin or delay");
      }
      Serial.println("[CMD] ========================================");
      return;
    }
    
    // Parse LED control: "led <pin> high" or "led <pin> low"
    if (cmdLower.startsWith("led")) {
      int ledPos = cmdLower.indexOf("led") + 3;
      int highPos = cmdLower.indexOf("high");
      int lowPos = cmdLower.indexOf("low");
      
      int pin = 0;
      bool state = false;
      bool valid = false;
      
      if (highPos > 0) {
        pin = PinUtils::parseNumber(cmdLower, ledPos);
        state = HIGH;
        valid = true;
      } else if (lowPos > 0) {
        pin = PinUtils::parseNumber(cmdLower, ledPos);
        state = LOW;
        valid = true;
      }
      
      if (valid && PinUtils::isValidOutputPin(pin)) {
        // Stop blink loop if setting pin to LOW and loop is active on this pin
        if (state == LOW && BlinkLoop::isActiveOnPin(pin)) {
          BlinkLoop::stop();
        }
        
        LEDControl::setLED(pin, state);
        Serial.println("[CMD] ✓ Command executed");
      } else {
        Serial.println("[CMD] ✗ Invalid pin or command format");
      }
      Serial.println("[CMD] ========================================");
      return;
    }
    
    // Unknown command
    Serial.print("[CMD] ⚠ Unknown command: ");
    Serial.println(cmd);
    Serial.println("[CMD] Supported commands:");
    Serial.println("[CMD]   - led <pin> high");
    Serial.println("[CMD]   - led <pin> low");
    Serial.println("[CMD]   - blink <delay> (single blink, pin 23)");
    Serial.println("[CMD]   - blink led <pin> delay <ms> (continuous loop)");
    Serial.println("[CMD]   - stop blink");
    Serial.println("[CMD] ========================================");
  }
}

// ============================================
// USB SERIAL HANDLER
// ============================================
namespace SerialHandler {
  /**
   * Handle commands from USB Serial
   */
  void handle() {
    static String buffer = "";
    
    while (Serial.available() > 0) {
      char c = Serial.read();
      
      if (c == '\n' || c == '\r') {
        if (buffer.length() > 0) {
          CommandParser::execute(buffer, "USB Serial");
          buffer = "";
        }
      } else {
        buffer += c;
        if (buffer.length() > 100) {
          Serial.println("[SERIAL] ⚠ Buffer overflow, clearing...");
          buffer = "";
        }
      }
    }
  }
}

// ============================================
// BLE MANAGEMENT
// ============================================
namespace BLEManager {
  // Global BLE variables
  BLEServer* pServer = NULL;
  BLECharacteristic* pTxCharacteristic = NULL;
  BLECharacteristic* pRxCharacteristic = NULL;
  bool deviceConnected = false;
  bool oldDeviceConnected = false;
  bool advertisingActive = false;
  unsigned long connectionStartTime = 0;
  int connectionCount = 0;
  
  // BLE Callbacks
  class ServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      Serial.println("\n[BLE] ========================================");
      Serial.println("[BLE] ✓ Device connected");
      
      deviceConnected = true;
      connectionCount++;
      connectionStartTime = millis();
      advertisingActive = false;
      
      Serial.print("[BLE] Connection #: ");
      Serial.println(connectionCount);
      Serial.print("[BLE] Free heap: ");
      Serial.print(ESP.getFreeHeap());
      Serial.println(" bytes");
      Serial.println("[BLE] ========================================");
      
      delay(200);
    }
    
    void onDisconnect(BLEServer* pServer) {
      Serial.println("\n[BLE] ========================================");
      Serial.println("[BLE] Device disconnected");
      
      deviceConnected = false;
      connectionStartTime = 0;
      
      Serial.println("[BLE] Waiting for reconnection...");
      Serial.println("[BLE] ========================================");
    }
  };
  
  class CharacteristicCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pCharacteristic) {
      if (!pCharacteristic) return;
      
      uint8_t* data = pCharacteristic->getData();
      size_t length = pCharacteristic->getLength();
      
      if (length > 0 && data != NULL) {
        String cmd = String((char*)data).substring(0, length);
        CommandParser::execute(cmd, "BLE");
      }
    }
  };
  
  /**
   * Initialize BLE
   */
  void setup() {
    Serial.println("\n[BLE] ========================================");
    Serial.println("[BLE] Initializing BLE...");
    
    BLEDevice::init(BlinkBotConfig::DEVICE_NAME);
    BLEDevice::setPower(ESP_PWR_LVL_P9, ESP_BLE_PWR_TYPE_DEFAULT);
    
    pServer = BLEDevice::createServer();
    pServer->setCallbacks(new ServerCallbacks());
    
    BLEService *pService = pServer->createService(BlinkBotConfig::SERVICE_UUID);
    
    pTxCharacteristic = pService->createCharacteristic(
      BlinkBotConfig::CHARACTERISTIC_UUID_TX,
      BLECharacteristic::PROPERTY_NOTIFY
    );
    pTxCharacteristic->addDescriptor(new BLE2902());
    
    pRxCharacteristic = pService->createCharacteristic(
      BlinkBotConfig::CHARACTERISTIC_UUID_RX,
      BLECharacteristic::PROPERTY_WRITE
    );
    pRxCharacteristic->setCallbacks(new CharacteristicCallbacks());
    
    pService->start();
    
    BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
    pAdvertising->addServiceUUID(BlinkBotConfig::SERVICE_UUID);
    pAdvertising->setScanResponse(true);
    pAdvertising->setMinInterval(0x20);
    pAdvertising->setMaxInterval(0x40);
    
    BLEDevice::startAdvertising();
    advertisingActive = true;
    
    Serial.println("[BLE] ✓ BLE initialized");
    Serial.print("[BLE] Device name: ");
    Serial.println(BlinkBotConfig::DEVICE_NAME);
    Serial.print("[BLE] Service UUID: ");
    Serial.println(BlinkBotConfig::SERVICE_UUID);
    Serial.print("[BLE] Free heap: ");
    Serial.print(ESP.getFreeHeap());
    Serial.println(" bytes");
    Serial.println("[BLE] ========================================");
    Serial.println("[BLE] Waiting for connection...");
    Serial.println("[BLE] ========================================\n");
  }
  
  /**
   * Handle BLE connection state
   */
  void handle() {
    // Handle disconnection - restart advertising
    if (!deviceConnected && oldDeviceConnected) {
      delay(500);
      if (pServer) {
        pServer->startAdvertising();
        advertisingActive = true;
        Serial.println("[BLE] ✓ Advertising restarted");
      }
      oldDeviceConnected = deviceConnected;
    }
    
    // Handle new connection
    if (deviceConnected && !oldDeviceConnected) {
      oldDeviceConnected = deviceConnected;
      advertisingActive = false;
    }
    
    // Ensure advertising if not connected
    if (!deviceConnected && !advertisingActive) {
      if (pServer) {
        pServer->startAdvertising();
        advertisingActive = true;
      }
    }
  }
}


void setup() {
  Serial.begin(BlinkBotConfig::SERIAL_BAUD);
  delay(1000);
  
  Serial.println("\n\n\n");
  Serial.println("========================================");
  Serial.println("=== Blink Bot Firmware ===");
  Serial.println("========================================");
  Serial.println("Version: 4.0 (Modular Architecture)");
  Serial.println("Date: 2024");
  Serial.println("========================================");
  Serial.println("Features:");
  Serial.println("  - Modular and well-structured code");
  Serial.println("  - BLE and USB Serial support");
  Serial.println("  - LED control (any valid pin)");
  Serial.println("  - Single blink (pin 23, hardcoded)");
  Serial.println("  - Continuous blink loop");
  Serial.println("  - Comprehensive pin validation");
  Serial.println("  - Robust connection management");
  Serial.println("========================================");
  Serial.println();
  
  // Initialize built-in LED
  Serial.println("[SETUP] Initializing built-in LED...");
  pinMode(BlinkBotConfig::LED_BUILTIN, OUTPUT);
  digitalWrite(BlinkBotConfig::LED_BUILTIN, LOW);
  Serial.println("[SETUP] ✓ Built-in LED initialized");
  Serial.println();
  
  // Setup BLE
  BLEManager::setup();
  
  Serial.println("\n========================================");
  Serial.println("Blink Bot Ready!");
  Serial.println("========================================");
  Serial.println("Device name: " + String(BlinkBotConfig::DEVICE_NAME));
  Serial.println("Service UUID: " + String(BlinkBotConfig::SERVICE_UUID));
  Serial.println("RX UUID: " + String(BlinkBotConfig::CHARACTERISTIC_UUID_RX));
  Serial.println("TX UUID: " + String(BlinkBotConfig::CHARACTERISTIC_UUID_TX));
  Serial.println("========================================");
  Serial.println("Supported commands:");
  Serial.println("  - led <pin> high");
  Serial.println("  - led <pin> low");
  Serial.println("  - blink <delay> (single blink, pin 23)");
  Serial.println("  - blink led <pin> delay <ms> (continuous loop)");
  Serial.println("  - stop blink");
  Serial.println("========================================");
  Serial.println();
}

// ============================================
// ARDUINO LOOP
// ============================================
void loop() {
  // Handle BLE connection
  BLEManager::handle();
  
  // Handle USB Serial commands
  SerialHandler::handle();
  
  // Update blink loop if active
  BlinkLoop::update();
  
  // Delay for BLE stack processing
  delay(BlinkBotConfig::LOOP_DELAY_MS);
}
