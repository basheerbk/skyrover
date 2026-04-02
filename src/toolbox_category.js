import * as Blockly from 'blockly';

/** Scale factor for toolbox category rows (circle, label, row height). */
const TOOLBOX_UI_SCALE = 0.9;

// ── Per-category colors ───────────────────────────────────────────────────────
// Colors sourced directly from compat_shim.js _hueMap — exact block colors
const CATEGORY_COLORS = {
    'Logic':               '#FFAB19', // logic HUE
    'Loops':               '#FFD500', // loops HUE
    'Math':                '#40BF4A', // math HUE
    'CAT_MATH':            '#40BF4A',
    'Array':               '#4CBFE6', // array HUE
    'Text':                '#9966FF', // texts HUE
    'Variables':           '#FF8C1A', // variables HUE
    'Functions':           '#FF6680', // procedures HUE
    'Arduino':             '#00979D', // Beginner pins+Serial; CAT_ARDUINO in advanced toolboxes
    'Serial Message':      '#00979D', // Beginner serial monitor messaging
    'Time':                '#3B82F6', // Beginner wait/delay blocks (distinct blue)
    'Controls':            '#5E60CE', // Beginner interactive input controls
    'Push Button':         '#5E60CE',
    'Joystick':            '#5E60CE',
    'Potentiometer':       '#5E60CE',
    'Switch':              '#5E60CE',
    'Out':                 '#00979D', // arduino_io HUE
    'Digital':             '#00979D', // arduino_io HUE
    'Analog':              '#00979D', // arduino_io HUE
    'time':                '#00979D', // arduino_base HUE
    'converting':          '#00979D', // arduino_conversion HUE
    'Serial Com':          '#00979D', // arduino_serial HUE
    'serial communication':'#00979D',
    'softserial lib':      '#00979D', // arduino_softserial HUE
    'storage':             '#00979D', // storage HUE
    'CAT_STORAGE_EEPROM':  '#00979D',
    'Sensors':             '#9B59B6', // beginner sensors purple
    'LDR':                 '#9B59B6',
    'IR':                  '#9B59B6',
    'DHT11':               '#9B59B6',
    'Ultrasonic':          '#9B59B6',
    'Actuators':           '#27AE60', // servo / motor green
    // ── Beginner mode child-friendly category names ───────────────────────────
    'Logic':               '#FFAB19', // decisions, comparisons & waits
    'Loop':                '#FFD500', // repeat actions
    'Loops':               '#FFD500', // keep alias for other toolboxes
    'LED':                 '#FF5722', // LEDs: on/off, blink, brightness (distinct from Logic)
    'NeoPixel':            '#FF5722', // LED subcategory for addressable RGB strips/pixels
    'Buzzer':              '#6B8E23', // active + passive buzzer (olive green)
    'Numbers':             '#40BF4A', // same as Math — numbers & calculations
    'OLED display':        '#2980B9', // Display / SSD1306
    'Display':             '#2980B9', // Beginner parent: LCD + OLED (clear UI blue)
    'LCD (I2C)':           '#2980B9',
    'OLED':                '#2980B9',
    'LCD screens':         '#2980B9', // lcd_i2c / CAT_LCD_SCREEN
    'SPI':                 '#9999FF', // SPI HUE
    'ESP8266 IOT':         '#B4AC91', // esp8266 HUE
};

// ── SVG icons for each category (white, 16×16 viewBox) ───────────────────────
const CATEGORY_ICONS = {
    // One large + one small gear — logic & control flow
    'Logic': `<svg viewBox="0 0 16 16" fill="none" stroke="white" stroke-linecap="round" stroke-linejoin="round"><g stroke-width="1.35"><circle cx="6.2" cy="8" r="3"/><path d="M6.2 4.4v1.25M6.2 10.35v1.25M3.2 8h1.25M9.95 8h1.25M4.35 5.5l.9.9M7.95 8.6l.9.9M4.35 10.5l.9-.9M7.95 5.4l.9-.9"/></g><g stroke-width="1.15"><circle cx="12.6" cy="6.5" r="1.05"/><path d="M12.6 5v.55M12.6 7.45v.55M11.55 6.5h.55M13.65 6.5h.55M11.85 5.75l.4.4M13.35 6.75l.4.4M11.85 7.25l.4-.4M13.35 5.25l.4-.4"/></g></svg>`,
    // Infinity — repeat forever
    'Loop': `<svg viewBox="0 0 16 16" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8c0-1.7-1.1-3-2.5-3S1 6.3 1 8s1.1 3 2.5 3S6 9.7 6 8zm0 0c0 1.7 1.1 3 2.5 3S11 9.7 11 8s-1.1-3-2.5-3S6 6.3 6 8z"/></svg>`,
    'Loops': `<svg viewBox="0 0 16 16" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8c0-1.7-1.1-3-2.5-3S1 6.3 1 8s1.1 3 2.5 3S6 9.7 6 8zm0 0c0 1.7 1.1 3 2.5 3S11 9.7 11 8s-1.1-3-2.5-3S6 6.3 6 8z"/></svg>`,
    // X in a box — named storage slot
    'Variables': `<svg viewBox="0 0 16 16" fill="none" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="12" height="12" rx="2"/><path d="M5 5l6 6M11 5l-6 6"/></svg>`,
    // Puzzle piece — reusable / composable blocks
    'Functions': `<svg viewBox="0 0 16 16" fill="none" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 5h4V3.5C6 2.7 6.7 2 7.5 2S9 2.7 9 3.5V5h3a1 1 0 0 1 1 1v2.5H11.5C10.7 8.5 10 9.2 10 10s.7 1.5 1.5 1.5H13V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/></svg>`,
    // Calculator / operations
    'Math': `<svg viewBox="0 0 16 16" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="12" height="12" rx="2"/><path d="M5 8h6M8 5v6"/></svg>`,
    // Letter A — text / string / char
    'Text': `<svg viewBox="0 0 16 16" fill="none" stroke="white" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><path d="M4 13L8 3.5L12 13"/><path d="M5.5 9h5"/></svg>`,
    // Microchip — the Arduino board
    'Arduino': `<svg viewBox="0 0 16 16" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="8" height="8" rx="1"/><path d="M4 6H2M4 10H2M12 6h2M12 10h2M6 4V2M10 4V2M6 12v2M10 12v2"/></svg>`,
    'Serial Message': `<svg viewBox="0 0 16 16" fill="none" stroke="white" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M2 5h9M13 5l-2-2M13 5l-2 2"/><path d="M14 11H5M3 11l2-2M3 11l2 2"/></svg>`,
    'Time': `<svg viewBox="0 0 16 16" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round"><circle cx="8" cy="8" r="5.5"/><path d="M8 5v3.5l2.5 1.5"/></svg>`,
    'Controls': `<svg viewBox="0 0 16 16" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="5"/><circle cx="8" cy="8" r="1.4" fill="white" stroke="none"/><path d="M8 3v2M13 8h-2M8 13v-2M3 8h2"/></svg>`,
    'Push Button': `<svg viewBox="0 0 16 16" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="10" height="6" rx="2"/><path d="M6 6V4.5a2 2 0 0 1 4 0V6"/></svg>`,
    'Joystick': `<svg viewBox="0 0 16 16" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="6" r="2.3"/><path d="M8 8.3v3.7"/><rect x="5" y="12" width="6" height="2" rx="1"/></svg>`,
    'Potentiometer': `<svg viewBox="0 0 16 16" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="4.5"/><path d="M8 8L11 5"/><circle cx="8" cy="8" r="1.2" fill="white" stroke="none"/></svg>`,
    'Switch': `<svg viewBox="0 0 16 16" fill="none" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="12" height="4" rx="2"/><circle cx="6" cy="8" r="1.5" fill="white" stroke="none"/></svg>`,
    // LED / light output
    'Out': `<svg viewBox="0 0 16 16" fill="none" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 10V8.5A3 3 0 1 1 10 8.5V10H6z"/><path d="M6 10h4M6.5 12h3M7.5 14h1"/></svg>`,
    // Toggle / binary switch — HIGH or LOW
    'Digital': `<svg viewBox="0 0 16 16" fill="none" stroke="white" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="6" width="14" height="4" rx="2"/><circle cx="11" cy="8" r="1.5" fill="white" stroke="none"/></svg>`,
    // Sine wave — analog signal
    'Analog': `<svg viewBox="0 0 16 16" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 8 Q4 3 7 8 Q10 13 13 8 Q14 5 15 8"/></svg>`,
    // Clock — timing & delays
    'time': `<svg viewBox="0 0 16 16" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round"><circle cx="8" cy="8" r="5.5"/><path d="M8 5v3.5l2.5 1.5"/></svg>`,
    // Swap arrows — type conversion
    'converting': `<svg viewBox="0 0 16 16" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5h10M10 2l3 3-3 3"/><path d="M13 11H3M6 8l-3 3 3 3"/></svg>`,
    // TX/RX lines — wired data transfer
    'Serial Com': `<svg viewBox="0 0 16 16" fill="none" stroke="white" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M2 5h9M13 5l-2-2M13 5l-2 2"/><path d="M14 11H5M3 11l2-2M3 11l2 2"/></svg>`,
    'serial communication': `<svg viewBox="0 0 16 16" fill="none" stroke="white" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M2 5h9M13 5l-2-2M13 5l-2 2"/><path d="M14 11H5M3 11l2-2M3 11l2 2"/></svg>`,
    // Antenna / wireless — software serial
    'softserial lib': `<svg viewBox="0 0 16 16" fill="none" stroke="white" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8 10v4"/><path d="M5.5 8.5A3.5 3.5 0 0 1 8 5a3.5 3.5 0 0 1 2.5 3.5"/><path d="M3 7A5.5 5.5 0 0 1 8 3a5.5 5.5 0 0 1 5 4"/><circle cx="8" cy="10" r="1" fill="white" stroke="none"/></svg>`,
    // Database cylinder — EEPROM/SD storage
    'storage': `<svg viewBox="0 0 16 16" fill="none" stroke="white" stroke-width="1.6" stroke-linecap="round"><ellipse cx="8" cy="5" rx="5" ry="2"/><path d="M3 5v6c0 1.1 2.24 2 5 2s5-.9 5-2V5"/><path d="M3 8c0 1.1 2.24 2 5 2s5-.9 5-2"/></svg>`,
    // Radar rings — sensing the environment
    'Sensors': `<svg viewBox="0 0 16 16" fill="none" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="2.5"/><path d="M4.5 4.5A5 5 0 0 0 3 8a5 5 0 0 0 1.5 3.5M11.5 4.5A5 5 0 0 1 13 8a5 5 0 0 1-1.5 3.5"/></svg>`,
    'LDR': `<svg viewBox="0 0 16 16" fill="none" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="2.5"/><path d="M4.5 4.5A5 5 0 0 0 3 8a5 5 0 0 0 1.5 3.5M11.5 4.5A5 5 0 0 1 13 8a5 5 0 0 1-1.5 3.5"/></svg>`,
    'IR': `<svg viewBox="0 0 16 16" fill="none" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="2.5"/><path d="M4.5 4.5A5 5 0 0 0 3 8a5 5 0 0 0 1.5 3.5M11.5 4.5A5 5 0 0 1 13 8a5 5 0 0 1-1.5 3.5"/></svg>`,
    'DHT11': `<svg viewBox="0 0 16 16" fill="none" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="2.5"/><path d="M4.5 4.5A5 5 0 0 0 3 8a5 5 0 0 0 1.5 3.5M11.5 4.5A5 5 0 0 1 13 8a5 5 0 0 1-1.5 3.5"/></svg>`,
    'Ultrasonic': `<svg viewBox="0 0 16 16" fill="none" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="2.5"/><path d="M4.5 4.5A5 5 0 0 0 3 8a5 5 0 0 0 1.5 3.5M11.5 4.5A5 5 0 0 1 13 8a5 5 0 0 1-1.5 3.5"/></svg>`,
    // Gear with shaft — motor / physical output
    'Actuators': `<svg viewBox="0 0 16 16" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="9" r="4"/><circle cx="8" cy="9" r="1.5" fill="white" stroke="none"/><rect x="6" y="2" width="4" height="3" rx="1"/><path d="M8 5v3"/></svg>`,
    // ── Beginner mode child-friendly category icons ─────────────────────────
    // Calculator — same as Math (numbers & operations)
    'Numbers': `<svg viewBox="0 0 16 16" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="12" height="12" rx="2"/><path d="M5 8h6M8 5v6"/></svg>`,
    'LED': `<svg viewBox="0 0 16 16" fill="none" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V7.5A3 3 0 1 1 10 7.5V9H6z"/><path d="M6 9h4M6.5 11h3M7.5 13h1"/></svg>`,
    'NeoPixel': `<svg viewBox="0 0 16 16" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="4.2"/><circle cx="8" cy="8" r="1.4" fill="white" stroke="none"/><path d="M8 1.8v1.6M8 12.6v1.6M1.8 8h1.6M12.6 8h1.6"/></svg>`,
    // Piezo buzzer: round disc + two pins (reads as hardware, not “speaker”)
    'Buzzer': `<svg viewBox="0 0 16 16" fill="none" stroke="white" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="8" cy="6.5" rx="4.2" ry="3.6"/><circle cx="8" cy="6.5" r="1.35" fill="white" stroke="none"/><path d="M6 10.5v3.2M10 10.5v3.2"/></svg>`,
    // Small OLED screen — rectangle with text lines
    'OLED display': `<svg viewBox="0 0 16 16" fill="none" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="12" height="10" rx="2"/><path d="M5 8h6M8 6v4"/></svg>`,
    'Display': `<svg viewBox="0 0 16 16" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round"><rect x="2" y="3" width="12" height="9" rx="1"/><path d="M6 14h4"/><path d="M5 12h6"/></svg>`,
    'LCD (I2C)': `<svg viewBox="0 0 16 16" fill="none" stroke="white" stroke-width="1.3" stroke-linecap="round"><rect x="2" y="4" width="12" height="8" rx="1"/><path d="M4 7h8M4 10h8"/></svg>`,
    'OLED': `<svg viewBox="0 0 16 16" fill="none" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="12" height="10" rx="2"/><path d="M5 8h6M8 6v4"/></svg>`,
};

// ── Hover tooltips ────────────────────────────────────────────────────────────
const CATEGORY_TOOLTIPS = {
    'Logic':               'Start your project, make choices, and add waits',
    'Loop':                'Repeat actions multiple times',
    'Loops':               'Repeat actions multiple times',
    'Variables':           'Store & use values',
    'Functions':           'Create reusable blocks of code',
    'Math':                'Numbers & calculations',
    'Text':                'Words, phrases, and single letters',
    'Arduino':             'Pins, digital/analog I/O, PWM, and Serial',
    'Serial Message':      'Send and receive text between Arduino and Serial Monitor',
    'Time':                'Wait blocks: pause for milliseconds or seconds',
    'Controls':            'Interactive inputs: buttons, joystick, knobs, and switches',
    'Push Button':         'Detect button pressed or not pressed',
    'Joystick':            'Read X/Y movement and button press',
    'Potentiometer':       'Read knob position as a number',
    'Switch':              'Read switch ON or OFF state',
    'Out':                 'Output: LEDs, buzzers & tones',
    'Digital':             'Read & write digital pins (0 or 1)',
    'Analog':              'Read & write analog pins (0–1023)',
    'time':                'Delays & timing',
    'converting':          'Convert between data types',
    'Serial Com':          'Send & receive serial data',
    'serial communication':'Send & receive serial data',
    'softserial lib':      'Software serial communication port',
    'storage':             'Save data to EEPROM / SD card',
    'Sensors':             'Read sensors: temperature, light & more',
    'LDR':                 'Light sensor setup and reading',
    'IR':                  'Infrared sensor setup and detection',
    'DHT11':               'Temperature and humidity with DHT11',
    'Ultrasonic':          'Distance sensing with ultrasonic sensor',
    'Actuators':           'Control motors, servos & outputs',
    // ── Beginner mode child-friendly tooltips ─────────────────────────────────
    'Numbers':             'Work with numbers and calculations',
    'LED':                 'Lights on pins: on/off, blink patterns, and dimming',
    'NeoPixel':            'Addressable RGB LEDs: set pixel color and strip size',
    'Buzzer':              'Active on/off & beeps; passive tones on a pin',
    'OLED display':        'Show text and graphics on the small screen',
    'Display':             'LCD character screen and OLED graphics',
    'LCD (I2C)':           '16×2 text LCD on I2C',
    'OLED':                '128×64 SSD1306: text, size, colour, scroll',
};

// ── Build circle + label row ─────────────────────────────────────────────────
function buildCircleRow(rowDiv, name, colour, level) {
    if (!rowDiv) return;
    if (rowDiv.dataset.blockideCircle) return;
    rowDiv.dataset.blockideCircle = '1';

    const isSub  = (level || 0) > 0;
    const sz     = Math.round((isSub ? 24 : 30) * TOOLBOX_UI_SCALE);
    const rowH   = Math.round((isSub ? 42 : 52) * TOOLBOX_UI_SCALE);
    const color  = CATEGORY_COLORS[name] || colour || '#888888';
    const icon   = CATEGORY_ICONS[name]  || '';
    const tip    = CATEGORY_TOOLTIPS[name] || name;
    const labelPx = Math.round((isSub ? 10.5 : 12) * TOOLBOX_UI_SCALE * 10) / 10;

    // ── Row: horizontal flex ────────────────────────────────────────────────
    Object.assign(rowDiv.style, {
        display:         'flex',
        flexDirection:   'row',
        alignItems:      'center',
        justifyContent:  'flex-start',
        height:           rowH + 'px',
        minHeight:        rowH + 'px',
        padding:         `0 ${Math.round(10 * TOOLBOX_UI_SCALE)}px 0 ${Math.round(12 * TOOLBOX_UI_SCALE)}px`,
        border:          'none',
        borderLeft:      '3px solid transparent',
        outline:         'none',
        borderRadius:    '0',
        margin:          '0',
        width:           '100%',
        cursor:          'pointer',
        boxSizing:       'border-box',
        backgroundColor: 'transparent',
        transition:      'background-color 0.15s ease, border-left-color 0.15s ease',
        gap:             Math.round(10 * TOOLBOX_UI_SCALE) + 'px',
    });

    rowDiv.title = tip;

    // ── Hide Blockly's original children ────────────────────────────────────
    Array.from(rowDiv.children).forEach(child => {
        child.style.display = 'none';
    });

    // ── Circle with icon ─────────────────────────────────────────────────────
    const circle = document.createElement('span');
    circle.className = 'blockide-circle';
    Object.assign(circle.style, {
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        width:            sz + 'px',
        height:           sz + 'px',
        minWidth:         sz + 'px',
        borderRadius:    '50%',
        backgroundColor:  color,
        flexShrink:      '0',
        boxShadow:       '0 2px 5px rgba(0,0,0,0.22)',
        transition:      'transform 0.18s cubic-bezier(0.175,0.885,0.32,1.275), box-shadow 0.18s ease',
        pointerEvents:   'none',
    });
    if (icon) {
        circle.innerHTML = icon;
        const svg = circle.querySelector('svg');
        if (svg) {
            svg.style.width  = (sz * 0.6) + 'px';
            svg.style.height = (sz * 0.6) + 'px';
            svg.style.flexShrink = '0';
        }
    }
    rowDiv.appendChild(circle);

    // ── Label ────────────────────────────────────────────────────────────────
    const label = document.createElement('span');
    label.className = 'blockide-label';
    label.textContent = name || '';
    Object.assign(label.style, {
        display:      'block',
        fontSize:     labelPx + 'px',
        fontWeight:   '600',
        color:        '#1e1e1e',
        textAlign:    'left',
        lineHeight:   '1.3',
        whiteSpace:   'nowrap',
        overflow:     'hidden',
        textOverflow: 'ellipsis',
        fontFamily:   '"Poppins", "Segoe UI", Arial, sans-serif',
        pointerEvents:'none',
        letterSpacing: '0.01em',
    });
    rowDiv.appendChild(label);
}

// ── Selected-state highlight with left accent bar ────────────────────────────
// Walk the prototype chain to find where updateSelected_ is actually defined,
// then patch it once at that level (not on the subclass that doesn't own it).
function patchUpdateSelected(instance) {
    let proto = Object.getPrototypeOf(instance);
    while (proto && !proto.hasOwnProperty('updateSelected_')) {
        proto = Object.getPrototypeOf(proto);
    }
    if (!proto || proto._blockidePatched) return;
    proto._blockidePatched = true;

    const origUpdate = proto.updateSelected_;

    proto.updateSelected_ = function (isSelected) {
        origUpdate.call(this, isSelected);
        if (this.rowDiv_) {
            // Use setProperty with 'important' priority so we beat every CSS rule
            // including Blockly's own theme CSS that injects !important overrides.
            this.rowDiv_.style.setProperty('background', '', '');
            this.rowDiv_.style.setProperty(
                'background-color',
                isSelected ? '#f9f9f9' : 'transparent',
                'important'
            );

            // Left accent bar using the category's own circle color
            const circle = this.rowDiv_.querySelector('.blockide-circle');
            const accentColor = circle ? circle.style.backgroundColor : '';
            this.rowDiv_.style.setProperty(
                'border-left',
                isSelected ? `3px solid ${accentColor}` : '3px solid transparent',
                'important'
            );

            if (circle) {
                circle.style.transform = isSelected ? 'scale(1.12)' : 'scale(1)';
                circle.style.boxShadow = isSelected
                    ? '0 3px 8px rgba(0,0,0,0.28)'
                    : '0 2px 5px rgba(0,0,0,0.22)';
            }
        }
    };
}

// ── Leaf category ─────────────────────────────────────────────────────────────
class CircleToolboxCategory extends Blockly.ToolboxCategory {
    createDom_(...args) {
        const dom = super.createDom_(...args);
        try {
            buildCircleRow(this.rowDiv_, this.name_, this.colour_, this.level_);
            patchUpdateSelected(this);
        } catch (e) {
            console.error('[BlockIDE] CircleToolboxCategory error:', e);
        }
        return dom;
    }
    addColourBorder_(_c) {
        if (this.rowDiv_) this.rowDiv_.style.borderLeft = '3px solid transparent';
    }
}

// ── Collapsible (parent) category ─────────────────────────────────────────────
class CircleCollapsibleCategory extends Blockly.CollapsibleToolboxCategory {
    createDom_(...args) {
        const dom = super.createDom_(...args);
        try {
            buildCircleRow(this.rowDiv_, this.name_, this.colour_, this.level_);
            patchUpdateSelected(this);
        } catch (e) {
            console.error('[BlockIDE] CircleCollapsibleCategory error:', e);
        }
        return dom;
    }
    addColourBorder_(_c) {
        if (this.rowDiv_) this.rowDiv_.style.borderLeft = '3px solid transparent';
    }
}

// ── Register both ─────────────────────────────────────────────────────────────
(function () {
    const T = Blockly.registry.Type.TOOLBOX_ITEM;
    try {
        Blockly.registry.register(T, Blockly.ToolboxCategory.registrationName,            CircleToolboxCategory,    true);
        console.log('[BlockIDE] CircleToolboxCategory registered');
    } catch (e) { console.error('[BlockIDE] CircleToolboxCategory failed:', e.message); }

    try {
        Blockly.registry.register(T, Blockly.CollapsibleToolboxCategory.registrationName, CircleCollapsibleCategory, true);
        console.log('[BlockIDE] CircleCollapsibleCategory registered');
    } catch (e) { console.error('[BlockIDE] CircleCollapsibleCategory failed:', e.message); }
})();
