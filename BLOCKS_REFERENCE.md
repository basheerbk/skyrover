# BlockIDE — Blocks Reference

Complete reference of every block category, block type, and the text shown on each block.

---

## Table of Contents

1. [Code Categories](#code-categories)
   - [Logic](#logic)
   - [Loops](#loops)
   - [Math](#math)
   - [Array](#array)
   - [Text](#text)
   - [Variables](#variables)
   - [Functions](#functions)
2. [Arduino Hardware](#arduino-hardware)
   - [Arduino (Setup & Loop)](#arduino-setup--loop)
   - [Out (Output)](#out-output)
   - [Digital](#digital)
   - [Analog](#analog)
   - [Time](#time)
   - [Converting](#converting)
   - [Serial Com](#serial-com)
   - [Soft Serial](#soft-serial)
   - [Storage / EEPROM](#storage--eeprom)
3. [Motors & Actuators](#motors--actuators)
   - [Servo Motor](#servo-motor)
   - [Stepper Motors](#stepper-motors)
4. [Displays](#displays)
   - [LCD I²C](#lcd-ic)
   - [OLED Screen (U8G)](#oled-screen-u8g)
   - [SSD1306 OLED](#ssd1306-oled)
   - [Chainable RGB LED](#chainable-rgb-led)
   - [Matrix RGB LED 8×8](#matrix-rgb-led-88)
5. [Sensors](#sensors)
   - [LDR (Light Sensor)](#ldr-light-sensor)
   - [Temperature Sensor (Analog)](#temperature-sensor-analog)
   - [DHT (Temperature & Humidity)](#dht-temperature--humidity)
   - [MPU6050 (Gyro/Accel)](#mpu6050-gyroaccel)
   - [BMP280 (Pressure/Temp)](#bmp280-pressuretemp)
   - [IR Sensors](#ir-sensors)
   - [Sharp IR Distance](#sharp-ir-distance)
   - [RFID](#rfid)
   - [Keypad](#keypad)
   - [HX711 Load Cell](#hx711-load-cell)
   - [APDS-9960 (Colour + Gesture)](#apds-9960-colour--gesture)
   - [DS18B20 Thermometer](#ds18b20-thermometer)
   - [Capacitive Sensor](#capacitive-sensor)
6. [Communication](#communication)
   - [SPI](#spi)
   - [I²C (Software)](#ic-software)
   - [I²C (Hardware)](#ic-hardware)
   - [Ethernet (Client)](#ethernet-client)
   - [Ethernet (Server)](#ethernet-server)
   - [Ethernet WiFi (ESP8266)](#ethernet-wifi-esp8266)
   - [ESP8266 IoT](#esp8266-iot)
   - [Blynk IoT](#blynk-iot)
   - [LoRa](#lora)
7. [Special Blocks](#special-blocks)
   - [LED Blink](#led-blink)
   - [OTA (Over-The-Air Update)](#ota-over-the-air-update)
8. [Add Blocks Categories (Modal)](#add-blocks-categories-modal)
9. [UI Text Reference](#ui-text-reference)

---

## Code Categories

### Logic

**Category ID:** `CAT_LOGIC` | **Colour:** `#FFAB19` (amber)

Conditional and comparison blocks — *"If / else decisions & conditions"*

| Block Type | Text on Block | Output |
|---|---|---|
| `controls_if` | **if** … **do** … **else** | Statement |
| `controls_switch` | **switch** … **case** … **default** | Statement |
| `logic_compare` | `[value] = / ≠ / < / ≤ / > / ≥ [value]` | Boolean |
| `logic_operation` | `[value] and / or [value]` | Boolean |
| `logic_negate` | **not** `[value]` | Boolean |
| `logic_boolean` | **true** / **false** | Boolean |
| `logic_null` | **null** | Any |

---

### Loops

**Category ID:** `CAT_LOOPS` | **Colour:** `#FFD500` (yellow)

Repeat actions — *"Repeat actions multiple times"*

| Block Type | Text on Block | Output |
|---|---|---|
| `controls_repeat` | **repeat** `10` **times — do** | Statement |
| `controls_repeat_ext` | **repeat** `[number]` **times — do** | Statement |
| `controls_whileUntil` | **repeat while / until** `[condition]` **do** | Statement |
| `controls_for` | **count with** `[var]` **from** `[num]` **to** `[num]` **by** `[num]` **do** | Statement |
| `controls_flow_statements` | **break out of / continue with next iteration of loop** | Statement |

---

### Math

**Category ID:** `CAT_MATH` | **Colour:** `#40BF4A` (green)

Numbers and calculations — *"Numbers & calculations"*

| Block Type | Text on Block | Output |
|---|---|---|
| `math_number` | `0` | Number |
| `inout_angle_maths` | Angle field (0–360°) | Number |
| `math_arithmetic` | `[num] + / - / × / ÷ / ^ [num]` | Number |
| `math_interval` | Map/constrain value | Number |
| `math_single` | **√ / abs / - / ln / log₁₀ / e^ / 10^** `[num]` | Number |
| `math_trig` | **sin / cos / tan / asin / acos / atan** `[num]` | Number |
| `math_constant` | **π / e / φ / √2 / √½ / ∞** | Number |
| `math_number_property` | `[num]` **is even / odd / prime / whole / positive / negative / divisible by** | Boolean |
| `math_round` | **round / round up / round down** `[num]` | Number |
| `math_on_list` | **sum / min / max / average / median / mode / std dev / random item** of list | Number |
| `math_modulo` | `[num]` **remainder of** `[num]` | Number |
| `math_constrain` | **constrain** `[num]` **between** `[low]` **and** `[high]` | Number |
| `math_random_int` | **random integer from** `[low]` **to** `[high]` | Number |
| `math_random_float` | **random fraction** | Number (0–1) |

---

### Array

**Category ID:** `CAT_ARRAY` | **Colour:** `#4CBFE6` (light blue)

Lists and arrays — *"Lists & arrays"*

| Block Type | Text on Block | Output |
|---|---|---|
| `array_declare` | **create array** `[name]` **type** `[type]` **size** `[num]` | Statement |
| `array_modify` | **set element nb** `[index]` **of** `[name]` **to** `[value]` | Statement |
| `array_create_with` | **an array** with N items | Array |
| `creer_tableau` | **create list** `[name]` | Statement |
| `fixer_tableau` | **set** `[name][ index ]` = `[value]` | Statement |
| `tableau_getIndex` | `[name][ index ]` | Any |
| `array_getIndex` | **get index** `[index]` **of** `[name]` | Any |

---

### Text

**Category ID:** `CAT_TEXT` | **Colour:** `#9966FF` (purple)

Text operations — *"Text operations"*

| Block Type | Text on Block | Output |
|---|---|---|
| `text` | `" "` (text string) | String |
| `char` | `char` `[value]` | char |
| `text_join` | **create text with** `[items…]` | String |
| `text_append` | **to** `[var]` **append text** `[value]` | Statement |
| `text_length` | **length of** `[text]` | Number |
| `text_isEmpty` | `[text]` **is empty** | Boolean |
| `text_indexOf` | **in text** `[text]` **find first/last occurrence of** `[text]` | Number |
| `text_charAt` | **in text** `[text]` **get letter # / first / last / random** | String |
| `text_getSubstring` | **in text** `[text]` **get substring from** … **to** … | String |
| `text_changeCase` | **to UPPER CASE / lower case / Title Case** `[text]` | String |
| `text_trim` | **trim spaces from both / left / right side of** `[text]` | String |
| `text_print` | **print** `[text]` | Statement |
| `text_prompt_ext` | **prompt for** text / number **with message** `[text]` | String / Number |

---

### Variables

**Category ID:** `CAT_VARIABLES` | **Colour:** `#FF8C1A` (orange)

Store & use values — *"Store & use values"*

> Variable blocks are auto-generated. Create a variable using the **"Create variable…"** button at the top of the category.

| Block Type | Text on Block | Output |
|---|---|---|
| `variables_get` | `[variable name]` | Any |
| `variables_set` | **set** `[variable]` **to** `[value]` | Statement |
| `math_change` | **change** `[variable]` **by** `[num]` | Statement |

---

### Functions

**Category ID:** `CAT_FUNCTIONS` | **Colour:** `#FF6680` (pink)

Create reusable blocks of code — *"Create reusable blocks of code"*

> Function blocks are auto-generated. Use **"Create function…"** to define one.

| Block Type | Text on Block | Output |
|---|---|---|
| `procedures_defnoreturn` | **to** `[name]` **do** … | Definition |
| `procedures_defreturn` | **to** `[name]` **do** … **return** `[value]` | Definition |
| `procedures_callnoreturn` | `[name]` | Statement call |
| `procedures_callreturn` | `[name]` | Value call |
| `procedures_ifreturn` | **if** `[condition]` **return** `[value]` | Statement |

---

## Arduino Hardware

### Arduino (Setup & Loop)

**Category ID:** `CAT_ARDUINO` | **Colour:** `#00979D` (teal)

Control your Arduino board — *"Setup & Loop"*

| Block Type | Text on Block | Output |
|---|---|---|
| `base_setup_loop` | **Setup** … **loop** … | Statement |
| `base_define` | **Define** `[name]` **=** `[value]` | Statement |
| `base_define_bloc` | **Define** block with code | Statement |
| `biblio_include` | **Include library** `[name]` | Statement |
| `include_file` | **#include** `"filename"` | Statement |
| `base_code` | **Code** `[raw text]` | Statement |
| `base_comment` | **// Comment** `[text]` | Statement |
| `base_end` | **wait forever (END of program)** | Statement |

---

### Out (Output)

**Category ID:** `CAT_ARDUINO_OUT` | **Colour:** `#00979D`

Output: LEDs, buzzers & tones — *"Output signals"*

| Block Type | Text on Block | Output |
|---|---|---|
| `inout_buildin_led` | **Built-in LED** `HIGH / LOW` | Statement |
| `inout_analog_write_validator` | **write on pin PWM~** `[pin]` **value** `[0–255]` | Statement |
| `inout_PWM_write` | **write on pin PWM~** `[pin]` **value** `[input]` | Statement |
| `inout_PWM_write_inline` | **write on pin PWM~** `[pin]` **value** `[0]` | Statement |
| `tone` | **emits sound on the pin** `[pin]` **on frequency (Hz)** `[freq]` **for a time (ms)** `[dur]` | Statement |
| `tone_notime` | **emits sound on the pin** `[pin]` **on frequency (Hz)** `[freq]` | Statement |
| `notone` | **stop sound on the pin** `[pin]` | Statement |
| `led_blink` | **Blink built-in LED** delay (ms) `[value]` | Statement |

---

### Digital

**Category ID:** `Digital` | **Colour:** `#00979D`

Read & write digital pins (0 or 1) — *"Digital pin control"*

| Block Type | Text on Block | Output |
|---|---|---|
| `inout_digital_write` | **put the pin Digital** `[pin]` **to logic state** `[HIGH/LOW]` | Statement |
| `inout_digital_read` | **the logic state of the digital pin** `[pin]` | Boolean |
| `inout_digital_mode` | **set pin** `[pin]` **as** `[INPUT/OUTPUT/INPUT_PULLUP]` | Statement |
| `inout_onoff` | `HIGH` / `LOW` | Boolean |
| `inout_attachInterrupt` | **attach interrupt on pin** `[pin]` **mode** `[RISING/FALLING/CHANGE/LOW]` **do** | Statement |
| `inout_detachInterrupt` | **detach interrupt on pin** `[pin]` | Statement |
| `inout_digital_read_check` | **read digital pin** `[pin]` **with pull-up** `[checkbox]` | Boolean |
| `inout_buildin_led` | **Built-in LED** `HIGH / LOW` | Statement |

---

### Analog

**Category ID:** `Analog` | **Colour:** `#00979D`

Read & write analog pins (0–1023) — *"Analog signal control"*

| Block Type | Text on Block | Output |
|---|---|---|
| `inout_analog_read` | **read value on the analog input** `[pin]` | Number (0–1023) |
| `inout_analog_read_voltage` | **read voltage on analog pin** `[pin]` | Decimal (0–5 V) |
| `inout_PWM_write_inline` | **write on pin PWM~** `[pin]` **value** `[0–255]` | Statement |

---

### Time

**Category ID:** `CAT_ARDUINO_TIME` | **Colour:** `#00979D`

Delays & timing — *"Time & Delay"*

| Block Type | Text on Block | Output |
|---|---|---|
| `millis` | **milliseconds since start** | Number (ms) |
| `millis_sec` | **seconds since start** | Number (s) |
| `inout_pulsein` | **measure pulse on pin** `[pin]` **state** `[HIGH/LOW]` | Number (µs) |
| `inout_pulsein_timeout` | **measure pulse on pin** `[pin]` **state** `[HIGH/LOW]` **timeout** `[µs]` | Number (µs) |
| `base_delay` | **delay (in ms)** `[value]` | Statement |
| `base_delay_sec` | **delay (in seconds)** `[value]` | Statement |
| `tempo_no_delay` | **non-blocking delay** `[ms]` **do** | Statement |

---

### Converting

**Category ID:** `CAT_ARDUINO_CONVERSION` | **Colour:** `#00979D`

Convert between data types — *"Data Conversion"*

| Block Type | Text on Block | Output |
|---|---|---|
| `conversion_tochar` | **Convert to char** `[value]` | char |
| `conversion_tobyte` | **Convert to Byte** `[value]` | byte |
| `conversion_toint` | **Convert to Int** `[value]` | int |
| `conversion_tofloat` | **Convert to Float** `[value]` | float |
| `conversion_toString` | **Convert to String** `[value]` | String |
| `conversion_map` | **re-maps value** `[v]` **from [low1–high1] to [low2–high2]** | Number |

---

### Serial Com

**Category ID:** `Serial Com` | **Colour:** `#00979D`

Send & receive serial data — *"Serial Communication"*

| Block Type | Text on Block | Output |
|---|---|---|
| `serial_init` | **Serial communication init speed** `[9600/…]` | Statement |
| `serial_flush` | **Serial Flush** | Statement |
| `serial_write` | **Serial Write** `[value]` | Statement |
| `serial_printfor` | **Serial Print formatted** `[format]` | Statement |
| `serial_print` | **Serial Print console** `[value]` | Statement |
| `serial_print_tab` | **Serial Print TAB** `[value]` | Statement |
| `serial_println` | **Serial Println** `[value]` | Statement |
| `serial_print_var` | **Serial Print variable** `[name]` | Statement |
| `serial_write_out` | **Serial write out** `[value]` | Statement |
| `serial_available` | **Serial Available?** | Boolean |
| `serial_read` | **Serial Read** | Number |
| `serial_readStringUntil` | **Serial readStringUntil** `[char]` | String |
| `serial_line` | **line break** | Statement |
| `serial_print_multi` | **Serial Print** multiple values | Statement |

---

### Soft Serial

**Category ID:** `CAT_ARDUINO_COMM_SOFTSERIAL` | **Colour:** `#00979D`

Software serial communication port — *"Software Serial"*

| Block Type | Text on Block | Output |
|---|---|---|
| `soft_init` | **Software Serial** RX `[pin]` TX `[pin]` **speed** `[baud]` | Statement |
| `soft_flush` | **Soft Serial Flush** | Statement |
| `soft_print` | **Soft Serial Print** `[value]` | Statement |
| `soft_write` | **Soft Serial Write** `[value]` | Statement |
| `soft_available` | **Soft Serial Available?** | Boolean |
| `soft_read` | **Soft Serial Read** | Number |
| `soft_readStringUntil` | **Soft Serial readStringUntil** `[char]` | String |
| `serial_line` | **line break** | Statement |

---

### Storage / EEPROM

**Category ID:** `CAT_STORAGE_EEPROM` | **Colour:** `#00979D`

Save data to EEPROM / SD card — *"Persistent Storage"*

| Block Type | Text on Block | Output |
|---|---|---|
| `storage_sd_write` | **SD write** file `[name]` value `[value]` | Statement |
| `storage_eeprom_write_long` | **EEPROM write long** address `[addr]` value `[value]` | Statement |
| `storage_eeprom_read_long` | **EEPROM read long** address `[addr]` | Number |
| `storage_eeprom_write_byte` | **EEPROM write byte** address `[addr]` value `[value]` | Statement |
| `storage_eeprom_read_byte` | **EEPROM read byte** address `[addr]` | Number |

---

## Motors & Actuators

### Servo Motor

**Category ID:** `CAT_ARDUINO_SERVO` | **Colour:** `#3498DB` (blue)

| Block Type | Text on Block | Output |
|---|---|---|
| `servo_attach` | **Attach Servomotor** `[name]` **on pin** `[pin]` | Statement |
| `servo_move` | **Rotate the Servo motor** `[name]` **to** `[0–180]` **degrees** | Statement |
| `servo_read_degrees` | **Servo** `[name]` **current angle** | Number |
| `servo_attached` | **Servomotor** `[name]` **attached?** | Boolean |
| `servo_detach` | **Detach Servomotor** `[name]` | Statement |
| `servo_rot_continue` | **Continuous rotation servo** `[name]` **on pin** `[pin]` | Statement |
| `servo_rot_continue_param` | **Set continuous servo** `[name]` **speed** `[value]` | Statement |

---

### Stepper Motors

**Category ID:** `CAT_STEPPER` | **Colour:** hue `80` (yellow-green)

| Block Type | Text on Block | Output |
|---|---|---|
| `stepper_config` | **Stepper** `[name]` **steps/rev** `[num]` **pins** `[1]` `[2]` | Statement |
| `stepper_step` | **Stepper** `[name]` **move** `[steps]` **steps** | Statement |
| `unipolar_stepper_motor_init` | **Unipolar stepper** `[name]` **pins** `[1][2][3][4]` | Statement |
| `unipolar_stepper_motor_steps` | **Stepper** `[name]` **move** `[steps]` **steps** | Statement |
| `unipolar_stepper_motor_turns` | **Stepper** `[name]` **turn** `[n]` **revolutions** | Statement |
| `unipolar_stepper_motor_speed_block` | **Set stepper** `[name]` **speed** `[rpm]` **RPM** | Statement |

---

## Displays

### LCD I²C

**Category ID:** `CAT_LCD_I2C` | **Colour:** `#87AD34` (olive green)

| Block Type | Text on Block | Output |
|---|---|---|
| `lcd_i2c_lcdscan` | **Scan I²C LCD address** | Statement |
| `lcd_i2c_lcdinit` | **Init LCD** `[cols]` **×** `[rows]` **at address** `[0x27]` | Statement |
| `lcd_i2c_lcdclear` | **LCD Clear** | Statement |
| `lcd_i2c_lcdwrite` | **LCD write** at col `[c]` row `[r]` **text** `[value]` | Statement |

---

### OLED Screen (U8G)

**Category ID:** `CAT_OLED_U8G` | **Colour:** `#1B2944` (dark navy)

| Block Type | Text on Block | Output |
|---|---|---|
| `lp2i_u8g_draw_string` | **OLED draw text** at x `[x]` y `[y]` `[text]` | Statement |
| `lp2i_u8g_draw_4strings` | **OLED draw 4 lines** `[l1][l2][l3][l4]` | Statement |
| `lp2i_u8g_print` | **OLED print** `[value]` | Statement |
| `lp2i_u8g_4draw_print` | **OLED print 4 values** | Statement |

---

### SSD1306 OLED

**Category ID:** `CAT_SSD1306` | **Colour:** hue `160`

#### Main
| Block Type | Text on Block | Output |
|---|---|---|
| `SSD1306_init` | **Init SSD1306** width `[128]` height `[64]` address `[0x3C]` | Statement |
| `SSD1306_display` | **SSD1306 display** | Statement |
| `SSD1306_clearDisplay` | **SSD1306 clear display** | Statement |
| `SSD1306_invertDisplay` | **SSD1306 invert** `[true/false]` | Statement |
| `SSD1306_width` | **SSD1306 width** | Number |
| `SSD1306_height` | **SSD1306 height** | Number |
| `SSD1306_startscroll` | **SSD1306 start scroll** direction `[right/left/diag right/diag left]` | Statement |
| `SSD1306_stopscroll` | **SSD1306 stop scroll** | Statement |

#### Draw
| Block Type | Text on Block | Output |
|---|---|---|
| `SSD1306_drawPixel` | **Draw pixel** at x `[x]` y `[y]` colour `[WHITE/BLACK]` | Statement |
| `SSD1306_drawLine` | **Draw line** x1 `[x1]` y1 `[y1]` x2 `[x2]` y2 `[y2]` colour | Statement |
| `SSD1306_drawRect` | **Draw rectangle** x `[x]` y `[y]` w `[w]` h `[h]` colour | Statement |
| `SSD1306_drawCircle` | **Draw circle** x `[x]` y `[y]` r `[r]` colour | Statement |
| `SSD1306_drawRoundRect` | **Draw rounded rect** x y w h radius colour | Statement |
| `SSD1306_drawTriangle` | **Draw triangle** x1 y1 x2 y2 x3 y3 colour | Statement |

#### Text
| Block Type | Text on Block | Output |
|---|---|---|
| `SSD1306_setTextSize` | **Set text size** `[1–5]` | Statement |
| `SSD1306_setTextColour` | **Set text colour** `[WHITE/BLACK/INVERSE]` | Statement |
| `SSD1306_setCursor` | **Set cursor** x `[x]` y `[y]` | Statement |
| `SSD1306_cp437` | **Enable CP437 font** `[true/false]` | Statement |
| `SSD1306_write` | **Write char** `[value]` | Statement |
| `SSD1306_println` | **Println** `[value]` | Statement |
| `SSD1306_print` | **Print** `[value]` | Statement |

---

### Chainable RGB LED

**Category ID:** `CAT_LED_RGB_CHAIN` | **Colour:** `#C9D7E2`

| Block Type | Text on Block | Output |
|---|---|---|
| `lp2i_ledRGB_WS2812B_init` | **Init WS2812B LEDs** `[n]` LEDs on pin `[pin]` | Statement |
| `lp2i_ledRGB_WS2812B_setBrightness` | **Set brightness** `[0–255]` | Statement |
| `lp2i_ledRGB_WS2812B_setPixelColor` | **Set LED** `[n]` **colour** R `[r]` G `[g]` B `[b]` | Statement |

---

### Matrix RGB LED 8×8

**Category ID:** `CAT_MATRIX_LED_RGB` | **Colour:** `#C9D7E2`

| Block Type | Text on Block | Output |
|---|---|---|
| `MatrixLED_WS2812B_init` | **Init 8×8 Matrix** on pin `[pin]` | Statement |
| `MatrixLED_WS2812B_setBrightness` | **Set brightness** `[0–255]` | Statement |
| `MatrixLED_WS2812B_setPixelColor` | **Set pixel** x `[x]` y `[y]` R G B | Statement |
| `MatrixLED_WS2812B_draw` | **Draw matrix** | Statement |
| `MatrixLED_WS2812B_CLEAN` | **Clear matrix** | Statement |

---

## Sensors

### LDR (Light Sensor)

**Category ID:** `CAT_LDR_SENSORS` | **Colour:** `#A0A0A0` (grey)

| Block Type | Text on Block | Output |
|---|---|---|
| `ldr_setup` | **Setup LDR sensor on pin** `[A0]` | Statement |
| `ldr_read` | **Read LDR on pin** `[A0]` | Number (0–1023) |
| `ldr_threshold` | **LDR on pin** `[A0]` **is** `[brighter than / darker than]` **threshold** `[500]` | Boolean |
| `ldr_light_level` | **Light level on pin** `[A0]` | String (`"Very Dark"` … `"Very Bright"`) |
| `ldr_auto_adjust` | **Auto adjust on pin** `[A0]` — **if bright** `[do]` **if dark** `[do]` | Statement |
| `ldr_calibrate` | **Calibrate LDR on pin** `[A0]` **with samples** `[10]` | Statement |

---

### Temperature Sensor (Analog)

**Category ID:** `CAT_TEMP_SENSORS` | **Colour:** `#A0A0A0`

| Block Type | Text on Block | Output |
|---|---|---|
| `temp_setup` | **Setup temperature sensor on pin** `[A0]` | Statement |
| `temp_read` | **Read temperature on pin** `[A0]` | Number (°C) |
| `temp_threshold` | **Temperature on pin** `[A0]` **is** `[above / below]` `[25]` **°C threshold** | Boolean |
| `temp_convert` | **Convert temperature** `[°C→°F / °F→°C]` **temperature** `[value]` | Number |

---

### DHT (Temperature & Humidity)

**Category ID:** `CAT_TEMP_SENSORS` | **Colour:** `#A0A0A0`

| Block Type | Text on Block | Output |
|---|---|---|
| `dht_read` | **DHT Read** sensor `[DHT11/DHT22]` on pin `[pin]` | Statement |
| `dht_temperature` | **Temperature C** | Number (°C) |
| `dht_humidity` | **Humidity %** | Number (%) |

---

### MPU6050 (Gyro/Accel)

**Category ID:** `CAT_MPU6050` | **Colour:** `#2980B9` (blue)

| Block Type | Text on Block | Output |
|---|---|---|
| `mpu6050_init` | **Init MPU6050** | Statement |
| `mpu6050_read_accel` | **Accelerometer** `[X / Y / Z]` | Number |
| `mpu6050_read_gyro` | **Gyroscope** `[X / Y / Z]` | Number |

---

### BMP280 (Pressure/Temp)

**Category ID:** `CAT_BMP280` | **Colour:** `#16A085` (teal-green)

| Block Type | Text on Block | Output |
|---|---|---|
| `bmp280_init` | **Init BMP280** | Statement |
| `bmp280_read_temp` | **BMP280 temperature** | Number (°C) |
| `bmp280_read_pressure` | **BMP280 pressure** | Number (Pa) |
| `bmp280_read_altitude` | **BMP280 altitude** | Number (m) |

---

### IR Sensors

**Category ID:** `IR Sensors` | **Colour:** `#A0A0A0`

| Block Type | Text on Block | Output |
|---|---|---|
| `ir_sensor_init` | **Init IR sensor on pin** `[pin]` | Statement |
| `ir_sensor_read` | **Read IR sensor** `[name]` | Number |
| `ir_sensor_compare` | **IR sensor** `[name]` **detects object?** | Boolean |
| `ir_led_write` | **IR LED on pin** `[pin]` **emit** `[value]` | Statement |

---

### Sharp IR Distance

**Category ID:** `CAT_SHARP` | **Colour:** `#000000` (black)

| Block Type | Text on Block | Output |
|---|---|---|
| `Sharp_IR_attach` | **Attach Sharp IR sensor** `[name]` **on pin** `[pin]` **model** `[GP2Y0A21YK0F/…]` | Statement |
| `Sharp_IR_read` | **Read distance** `[name]` **cm** | Number (cm) |

---

### RFID

**Category ID:** `CAT_RFID` | **Colour:** `#9BACB4` (steel blue)

| Block Type | Text on Block | Output |
|---|---|---|
| `RFID_module` | **Init RFID** SS pin `[pin]` RST pin `[pin]` | Statement |
| `RFID_detection` | **RFID card detected?** | Boolean |
| `RFID_reception_cle` | **RFID read card** | Statement |
| `RFID_valeur_cle` | **RFID card value** | String |
| `RFID_code_acces` | **Access code** `[text]` | String |
| `RFID_acces_autorise` | **RFID access authorised?** | Boolean |
| `RFID_lecture_cle` | **Read RFID key** | Statement |
| `RFID_fermeture` | **RFID close** | Statement |

---

### Keypad

**Category ID:** `CAT_KEYPAD` | **Colour:** `#46C286` (green)

| Block Type | Text on Block | Output |
|---|---|---|
| `keypad_touche_appuyee` | **Keypad key pressed** | String (key character) |

---

### HX711 Load Cell

**Category ID:** `CAT_HX711` | **Colour:** `#D9242D` (red)

| Block Type | Text on Block | Output |
|---|---|---|
| `HX711_init` | **Init HX711** DOUT `[pin]` CLK `[pin]` scale `[value]` | Statement |
| `HX711_read` | **Read HX711 weight** | Number |

---

### APDS-9960 (Colour + Gesture)

**Category ID:** `CAT_APDS_9960_RGB_Gesture` | **Colour:** `#D9242D` (red)

| Block Type | Text on Block | Output |
|---|---|---|
| `APDS9960_ColorSensor_init` | **Init APDS-9960 colour sensor** | Statement |
| `APDS9960_ColorSensor_test` | **APDS-9960 colour available?** | Boolean |
| `APDS9960_ColorSensor_ambient` | **APDS-9960 ambient light** | Number |
| `APDS9960_ColorSensor_red` | **APDS-9960 red** | Number |
| `APDS9960_ColorSensor_green` | **APDS-9960 green** | Number |
| `APDS9960_ColorSensor_blue` | **APDS-9960 blue** | Number |

---

### DS18B20 Thermometer

**Category ID:** `CAT_DS18B20` | **Colour:** `#00979D`

| Block Type | Text on Block | Output |
|---|---|---|
| `ds18b20_search1` | **sur la broche N°** `[pin]` **addresse** `[addr]` (detect sensor) | Statement |
| `ds18b20_temp1` | **Read DS18B20 temperature** **addresse** `[addr]` | Number (°C) |

---

### Capacitive Sensor

**Category ID:** `CAT_CAPACITIVE` | **Colour:** various

| Block Type | Text on Block | Output |
|---|---|---|
| `capacitiveSensor_init` | **Init capacitive sensor** send `[pin]` receive `[pin]` | Statement |
| `capacitiveSensor_read` | **Read capacitive** `[name]` **samples** `[n]` | Number |

---

## Communication

### SPI

**Category ID:** `CAT_SPI` | **Colour:** `#9999FF` (lavender)

| Block Type | Text on Block | Output |
|---|---|---|
| `SPI_init` | **SPI init** CS pin `[pin]` clock `[speed]` | Statement |
| `SPI_send` | **SPI send** `[value]` | Statement |
| `SPI_send_param` | **SPI send** `[value]` **to** `[register]` | Statement |
| `SPI_receive` | **SPI receive from** `[register]` | Number |

---

### I²C (Software)

**Category ID:** `SOFT_I2C` | **Colour:** `#CC0033` (red)

| Block Type | Text on Block | Output |
|---|---|---|
| `I2C_init` | **Init Soft I²C** SDA `[pin]` SCL `[pin]` | Statement |
| `I2C_start` | **I²C Start** address `[addr]` mode `[R/W]` | Statement |
| `I2C_restart` | **I²C Restart** address `[addr]` mode `[R/W]` | Statement |
| `I2C_stop` | **I²C Stop** | Statement |
| `I2C_write` | **I²C Write** `[value]` | Statement |
| `I2C_read` | **I²C Read** `[ACK/NACK]` | Number |
| `I2C_scan` | **I²C Scan** (print addresses) | Statement |

---

### I²C (Hardware)

**Category ID:** `Hardware_I2C` | **Colour:** `#CC0033`

| Block Type | Text on Block | Output |
|---|---|---|
| `I2C_init_HW` | **Init Hardware I²C** | Statement |
| `I2C_start_HW` | **I²C begin transmission to** `[addr]` | Statement |
| `I2C_stop_HW` | **I²C end transmission** | Statement |
| `I2C_restart_HW` | **I²C restart** | Statement |
| `I2C_write_HW` | **I²C write** `[value]` | Statement |
| `I2C_request_HW` | **I²C request** `[n]` **bytes from** `[addr]` | Statement |
| `I2C_available_HW` | **I²C available?** | Boolean |
| `I2C_data_HW` | **I²C read byte** | Number |

---

### Ethernet (Client)

**Category ID:** `CAT_ETHERNET_CLIENT` | **Colour:** `#FFCC66` (gold)

| Block Type | Text on Block | Output |
|---|---|---|
| `ethernet_begin_staticIP_client` | **Ethernet begin** static IP `[ip]` MAC `[mac]` | Statement |
| `ethernet_begin_dhcp_client` | **Ethernet begin DHCP** MAC `[mac]` | Statement |
| `ethernet_connect` | **Connect to** `[host]` port `[port]` | Statement |
| `ethernet_stop` | **Ethernet stop** | Statement |
| `ethernet_available` | **Ethernet data available?** | Boolean |
| `ethernet_print` | **Ethernet print** `[value]` | Statement |
| `ethernet_println` | **Ethernet println** `[value]` | Statement |
| `ethernet_read` | **Ethernet read** | String |
| `ethernet_get_request` | **HTTP GET request** url `[url]` | Statement |
| `ethernet_post_request` | **HTTP POST request** url `[url]` data `[value]` | Statement |

---

### Ethernet (Server)

**Category ID:** `CAT_ETHERNET_SERVER` | **Colour:** `#FFCC66`

| Block Type | Text on Block | Output |
|---|---|---|
| `ethernet_begin_dhcp_server` | **Ethernet server DHCP** MAC `[mac]` port `[80]` | Statement |
| `ethernet_begin_staticIP_server` | **Ethernet server static IP** `[ip]` MAC `[mac]` port `[80]` | Statement |
| `ethernet_localip` | **Local IP address** | String |
| `ethernet_ATTENTE_CLIENT` | **Wait for client** | Boolean |
| `ethernet_connected` | **Client connected?** | Boolean |
| `ethernet_HTML_send_page` | **Send HTML page** header `[h]` body `[b]` | Statement |
| `ethernet_PARSERV2_CREATION` | **Create HTTP parser** | Statement |
| `ethernet_PARSERV2_LECTURE` | **Read HTTP request** | Statement |
| `ethernet_PARSERV2_PARSING` | **Parse request** | Statement |
| `ethernet_PARSERV2_GETNAME` | **Get parameter name** | String |
| `ethernet_PARSERV2_GETVALUE` | **Get parameter value** | String |
| `ethernet_PARSERV2_FREE` | **Free HTTP parser** | Statement |

---

### Ethernet WiFi (ESP8266)

**Category ID:** `CAT_WIFI_INIT` | **Colour:** `#FFCC66`

| Block Type | Text on Block | Output |
|---|---|---|
| `ethernet_wifi_begin_server` | **WiFi server** SSID `[ssid]` password `[pass]` port `[80]` | Statement |
| `ethernet_client_for_wifi_server` | **WiFi client** | Statement |
| `ethernet_wifi_localip` | **WiFi local IP** | String |

---

### ESP8266 IoT

**Category ID:** `CAT_ESP8266` / `CAT_esp8266_wifi` | **Colour:** `#B4AC91` (tan)

| Block Type | Text on Block | Output |
|---|---|---|
| `esp8266_init` | **ESP8266 WiFi** SSID `[ssid]` password `[pass]` mode `[client/server]` IP `[dynamic/static]` | Statement |
| `esp8266_send` | **ESP8266 send** `[value]` | Statement |
| `esp8266_send_html` | **ESP8266 send HTML** head `[h]` body `[b]` | Statement |
| `esp8266_wait_server` | **ESP8266 wait for request** | Statement |
| `esp8266_wait_client` | **ESP8266 connect to** host `[host]` port `[port]` | Statement |
| `esp8266_request_indexof` | **if request contains** `[str]` **do** … (extensible with more cases) | Statement |

---

### Blynk IoT

**Category ID:** `CAT_BLYNK_IOT` | **Colour:** `#23C890` (green)

> Designed for ESP32 + Blynk cloud app connectivity.

| Block Type | Text on Block | Output |
|---|---|---|
| `blynk_iot_setup_esp32` | **Blynk IOT** Template ID `[id]` Template name `[name]` Auth token `[token]` Wi‑Fi name (SSID) `[ssid]` Wi‑Fi password `[pass]` | Statement |
| `blynk_iot_run` | **Blynk.run** | Statement (place in loop) |
| `blynk_iot_vpin_digital_out` | **Button in app controls pin** Virtual pin V `[0]` controls board pin `[value]` When virtual pin is ON, board pin is `[HIGH/LOW]` | Statement |
| `blynk_iot_vpin_handler` | **virtual pin value changes** Virtual pin V `[0]` — If value is 1 `[do]` Else if value is 0 `[do]` | Statement |

---

### LoRa

**Category ID:** `CAT_LORA` | **Colour:** hue `160`

| Block Type | Text on Block | Output |
|---|---|---|
| `LoRa_init` | **LoRa init** frequency `[868E6]` | Statement |
| `LoRa_end` | **LoRa end** | Statement |
| `LoRa_beginPacket` | **LoRa begin packet** | Statement |
| `LoRa_endPacket` | **LoRa end packet** | Statement |
| `LoRa_parsePacket` | **LoRa parse packet** | Number (size) |
| `LoRa_receive` | **LoRa receive mode** | Statement |
| `LoRa_available` | **LoRa data available?** | Boolean |
| `LoRa_read` | **LoRa read byte** | Number |
| `LoRa_peek` | **LoRa peek byte** | Number |
| `LoRa_packetRssi` | **LoRa RSSI** | Number (dBm) |
| `LoRa_packetSnr` | **LoRa SNR** | Number |
| `LoRa_setTxPower` | **LoRa set TX power** `[dBm]` | Statement |
| `LoRa_setSpreadingFactor` | **LoRa set spreading factor** `[7–12]` | Statement |
| `LoRa_setSignalBandwidth` | **LoRa set bandwidth** `[Hz]` | Statement |
| `LoRa_enableCrc` | **LoRa enable CRC** | Statement |
| `LoRa_disableCrc` | **LoRa disable CRC** | Statement |
| `LoRa_setSyncWord` | **LoRa set sync word** `[0x12]` | Statement |
| `LoRa_random` | **LoRa random number** | Number |
| `LoRa_idle` | **LoRa idle mode** | Statement |
| `LoRa_sleep` | **LoRa sleep mode** | Statement |
| `LoRa_onReceive` | **LoRa on receive** `[callback]` | Statement |
| `LoRa_onTxDone` | **LoRa on TX done** `[callback]` | Statement |

---

## Special Blocks

### LED Blink

**Location:** `blocks/led_blink.js` — included in `CAT_ARDUINO_OUT`

| Block Type | Text on Block | Output |
|---|---|---|
| `led_blink` | **Blink built-in LED** delay (ms) `[value]` | Statement |

---

### OTA (Over-The-Air Update)

**Category ID:** `CAT_OTA` | **Colour:** `#8B4513` (brown)

| Block Type | Text on Block | Output |
|---|---|---|
| `ota_setup_simple` | **OTA Setup** hostname `[name]` password `[pass]` port `[8266]` | Statement |
| `ota_init` | **OTA Init** | Statement |
| `ota_handle` | **OTA Handle** (place in loop) | Statement |
| `ota_check_update` | **OTA update available?** | Boolean |
| `ota_get_progress` | **OTA progress %** | Number |
| `ota_get_error` | **OTA error message** | String |
| `ota_begin` | **OTA begin** | Statement |
| `ota_write` | **OTA write** `[data]` | Statement |
| `ota_end` | **OTA end** | Statement |

---

## Add Blocks Categories (Modal)

When you click **"Add Blocks"**, the modal groups all optional libraries into the following groups:

| Group | Categories |
|---|---|
| **Code** | Logic, Loops, Math, Array, Text, Variables, Functions |
| **Hardware** | Arduino, Time, Converting, SPI, ESP8266 |
| **Actuator** | Out, Servo, Stepper, LEDs |
| **Sensor** | Basic Sensors, Advanced Sensors (MPU, BMP), Keypad, RTC DS3231, LDR, Temperature/DHT, IR |
| **Display** | LCD Screens, OLED (U8G), SSD1306, LED Matrix, Chainable RGB |
| **Comms** | Bluetooth, RF 433MHz, RFID/NFC, LoRa, Ethernet, Blynk IoT |
| **Robot** | Drone, BlinkBot, Otto, Robuno, Robobox |
| **Shield** | DFRobot Shields, Seeed Grove, Grove System |

---

## UI Text Reference

### Menu Bar

| Menu Item | Text |
|---|---|
| Files | New Project / Open… / Save as… / Examples |
| Steps | Wiring / Supervision / Blocks / Code / Console |
| Tools | (tools sub-menu) |
| Options | Global configuration / Difficulty level / Block categories |
| Help | — |
| About | About Blockcode |

### Difficulty Levels (Toolbox Presets)

| Level | Description |
|---|---|
| Algorithm only | Logic, Loops, Math, Variables, Functions only |
| Arduino level 1 | Adds basic I/O blocks |
| Arduino level 2 | Adds more sensors and actuators |
| Arduino level 3 | Adds communication modules |
| Arduino level 4 | Full advanced set |
| Arduino all! | All categories visible |

### Button Labels

| Button | Text |
|---|---|
| Save project | "Save project" |
| Load project | "Load project" |
| Open example | "Open example" |
| Undo | "Undo (ctrl+z)" |
| Redo | "Redo (ctrl+y)" |
| Copy code | "Copy code" |
| Edit source code | "Edit source code" |
| Save .ino | "Save code as '.ino' file" |
| Verify | "Test code with Arduino IDE" |
| Upload | "Transfer to the Board" |
| Add Blocks | "Add Blocks" (toolbox sidebar button) |
| Close | "Close" |
| OK | "OK" |
| Save Configuration | "Save Configuration" |

### Status / Error Messages

| Key | Message |
|---|---|
| Verification success | "Verification completed successfully. Size: [n] bytes" |
| Verification failed | "Verification failed. Error: [details]" |
| Verifying… | "Verification …." |
| File load error | "Could not load your saved file. Maybe it was created with a different version of Blockly?" |
| Clear workspace | "Delete all Blocks (%1 blocks)?" |
| Timeout | "Maximum execution iterations exceeded." |
| HTTP error | "There was a problem with the request." |

---

*This document was auto-generated from the BlockIDE source: `toolbox/toolbox_arduino_all.xml`, `blocks/`, `src/blocks/`, `lang/BlocklyArduino_blocks/en.js`, `lang/BlocklyArduino_msg/en.js`.*
