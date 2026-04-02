/**
 * Blockly@rduino
 */

'use strict';

goog.require('Blockly.Blocks');
goog.require('Blockly.Types');
goog.require('Blockly.FieldDate');

/**
 * Create a namespace for the application.
 */
var BlocklyDuino = {};
Blockly.pathToBlockly = './';
Blockly.pathToMedia = './media/';

BlocklyDuino.selectedToolbox = "toolbox_none";
BlocklyDuino.selectedCard = 'none';
BlocklyDuino.selectedTab = 'blocks';
BlocklyDuino.inlineBool = true;
BlocklyDuino.withImage = true;
BlocklyDuino.ajaxOK = true;
BlocklyDuino.toolboxInIndexHtml = false;
BlocklyDuino.loadingDefaultBlocks = false;

/**
 * Normalize persisted toolbox key: legacy toolbox_basic -> toolbox_beginner.
 * @param {string} key
 * @return {string}
 */
BlocklyDuino.normalizeToolboxFileKey = function (key) {
    if (key === 'toolbox_basic') return 'toolbox_beginner';
    return key;
};

/**
 * Normalize mode string: legacy "basic" -> "beginner".
 * @param {string|null|undefined} raw
 * @return {"beginner"|"advanced"}
 */
BlocklyDuino.normalizeBlockideMode = function (raw) {
    var m = (raw == null ? '' : String(raw)).toLowerCase();
    if (m === 'advanced') return 'advanced';
    return 'beginner';
};

/**
 * Read blockide_mode from localStorage; migrate legacy "basic" to "beginner".
 * @return {"beginner"|"advanced"}
 */
BlocklyDuino.getBlockideMode = function () {
    var raw = localStorage.getItem('blockide_mode');
    var norm = BlocklyDuino.normalizeBlockideMode(raw || 'beginner');
    if (raw === 'basic' && norm === 'beginner') {
        localStorage.setItem('blockide_mode', 'beginner');
    }
    return norm;
};

/**
 * Blockly's main workspace.
 * @type {Blockly.WorkspaceSvg}
 */
BlocklyDuino.workspace = null;
var BlocklyLevel = 'none';

/**
 * Custom workspaceToCode function that processes all top-level blocks, including those not connected to Arduino structure blocks.
 * @param {Blockly.Workspace} workspace The workspace to generate code from.
 * @return {string} Generated Arduino code.
 */
BlocklyDuino.workspaceToCode = function (workspace) {
    if (!workspace) {
        console.warn("No workspace specified in workspaceToCode call. Guessing.");
        workspace = Blockly.getMainWorkspace();
    }

    if (!workspace) {
        console.error('[CODE_GEN] No workspace available!');
        return '';
    }

    // IMPORTANT: Do NOT use standard Blockly.Arduino.workspaceToCode
    // It doesn't have our validation logic for blocks outside setup/loop
    // We MUST use our custom implementation below

    // REMOVED: Early return that bypassed validation
    // if (Blockly.Arduino && Blockly.Arduino.workspaceToCode && typeof Blockly.Arduino.workspaceToCode === 'function') {
    //     try {
    //         return Blockly.Arduino.workspaceToCode(workspace);  // ❌ This bypasses our validation!
    //     } catch (e) {
    //         console.error('[CODE_GEN] Standard workspaceToCode failed, trying fallback:', e);
    //     }
    // }

    // Custom implementation with validation for blocks outside setup/loop
    try {
        Blockly.Arduino.init(workspace);
    } catch (e) {
        console.error('[CODE_GEN] Failed to initialize Arduino generator:', e);
        return '';
    }

    // Check if blockToCode exists
    if (!Blockly.Arduino.blockToCode) {
        console.error('[CODE_GEN] Blockly.Arduino.blockToCode not available!');
        return '';
    }

    var code = [];
    var topBlocks = workspace.getTopBlocks(true);
    var ignoredBlocks = []; // Track blocks that were ignored (outside setup/loop)

    // Helper: is this block a function definition?
    function isFunctionDefinition(block) {
        return block.type === 'procedures_defnoreturn' || block.type === 'procedures_defreturn';
    }

    // Helper: is this block a root block (setup/loop)?
    function isRootBlock(block) {
        return (
            block.type === 'base_setup_loop' ||
            block.type === 'base_setup' ||
            block.type === 'base_loop' ||
            block.type === 'base_begin' ||
            block.type === 'base_end'
        );
    }

    // Helper: is this block connected to a root (setup/loop)?
    function isConnectedToRoot(block) {
        if (isRootBlock(block)) {
            return true;
        }
        var current = block;
        while (current) {
            var parent = current.getParent && current.getParent();
            if (!parent) break;
            if (isRootBlock(parent)) {
                return true;
            }
            current = parent;
        }
        return false;
    }

    // Helper: is this block a Blink Bot runtime command block?
    // These blocks execute at runtime (not during code generation)
    function isBlinkBotRuntimeBlock(block) {
        return (
            block.type === 'blinkbot_led_control' ||
            block.type === 'blinkbot_start_blink' ||
            block.type === 'blinkbot_stop_blink' ||
            block.type === 'blinkbot_connect_ble' ||
            block.type === 'blinkbot_disconnect' ||
            block.type === 'blinkbot_is_connected' ||
            block.type === 'blinkbot_when_run' ||
            block.type === 'blinkbot_repeat_times'
        );
    }

    // Process all top-level blocks
    for (var i = 0; i < topBlocks.length; i++) {
        var block = topBlocks[i];
        if (!block || !block.type) continue;

        // Determine if this block should generate code
        var isAllowed = isFunctionDefinition(block) ||
            isConnectedToRoot(block) ||
            isBlinkBotRuntimeBlock(block);

        // Process if it's allowed (function definition, root block, connected to root, or Blink Bot runtime)
        if (isAllowed) {
            try {
                // Check if generator exists for this block type
                if (!Blockly.Arduino.blockToCode || typeof Blockly.Arduino.blockToCode !== 'function') {
                    console.error('[CODE_GEN] blockToCode not available for block', block.type);
                    continue;
                }

                var blockCode = Blockly.Arduino.blockToCode(block);
                if (goog.isArray && goog.isArray(blockCode)) {
                    blockCode = blockCode[0];
                }
                if (blockCode && typeof blockCode === 'string') {
                    if (block.outputConnection && Blockly.Arduino.scrubNakedValue) {
                        try {
                            blockCode = Blockly.Arduino.scrubNakedValue(blockCode);
                        } catch (e) {
                            // Ignore scrub errors
                        }
                    }
                    code.push(blockCode);
                }
            } catch (e) {
                console.error('[CODE_GEN] Error generating code for block', block.type, ':', e);
                // Continue processing other blocks
            }
        } else {
            // Block is outside setup/loop and not a special case - ignore it
            ignoredBlocks.push(block);
            console.warn('[CODE_GEN] Block ignored (outside setup/loop):', block.type);
        }
    }

    // Show user-friendly warnings for ignored blocks
    if (ignoredBlocks.length > 0) {
        console.warn('[CODE_GEN] Total blocks ignored:', ignoredBlocks.length);

        // Send warning to Messages panel if available
        if (false && typeof addMessage === 'function') { // Disabled per user request
            addMessage('⚠️ ' + ignoredBlocks.length + ' block(s) outside setup/loop were ignored.', 'warning');
            addMessage('💡 Tip: Place blocks inside "Arduino program" or "loop forever" blocks to compile.', 'info');
        }
    }

    try {
        var result = code.join('\n');
        if (Blockly.Arduino.finish) {
            result = Blockly.Arduino.finish(result);
        }
        result = result.replace(/^\s+\n/, '');
        result = result.replace(/\n\s+$/, '\n');
        return result;
    } catch (e) {
        console.error('[CODE_GEN] Error finishing code:', e);
        return code.join('\n');
    }
};

/**
 * Helper function to get all blocks connected to a given block (recursively).
 * @param {Blockly.Block} startBlock The starting block.
 * @return {Array<Blockly.Block>} Array of all connected blocks.
 */
BlocklyDuino.getAllConnectedBlocks = function (startBlock) {
    var connectedBlocks = [];
    var visited = new Set();

    function traverseBlock(block) {
        if (!block || visited.has(block.id)) {
            return;
        }

        visited.add(block.id);
        connectedBlocks.push(block);

        // Check all inputs
        for (var i = 0; i < block.inputList.length; i++) {
            var input = block.inputList[i];
            if (input.connection && input.connection.targetBlock()) {
                traverseBlock(input.connection.targetBlock());
            }
        }

        // Check next statement
        if (block.nextConnection && block.nextConnection.targetBlock()) {
            traverseBlock(block.nextConnection.targetBlock());
        }

        // Check previous statement
        if (block.previousConnection && block.previousConnection.targetBlock()) {
            traverseBlock(block.previousConnection.targetBlock());
        }
    }

    traverseBlock(startBlock);
    return connectedBlocks;
};

/**
 * Populate the currently selected pane with content generated from the blocks.
 */
BlocklyDuino.renderContent = function () {
    var content = $('#content_' + BlocklyDuino.selectedTab);
    if (content.prop('id') == 'content_blocks') {
        // If the workspace was changed by the XML tab, Firefox will have
        // performed an incomplete rendering due to Blockly being invisible. Rerender.
        BlocklyDuino.workspace.render();
        $(".blocklyTreeSeparator").removeAttr("style");
        $(".blocklyToolboxDiv").show();
        $("#tools_blocks").show();
        $("#btn_levels").show();
        $("#header_supervision").hide();
        $("#header_code").hide();
    } else {
        switch (content.prop('id')) {
            // case 'content_xml':
            // $(".blocklyToolboxDiv").hide();
            // $('#pre_xml').text(Blockly.Xml.domToPrettyText(Blockly.Xml.workspaceToDom(BlocklyDuino.workspace)));
            // if (typeof prettyPrintOne == 'function') {
            // $('#pre_xml').html(prettyPrintOne($('#pre_xml').html(), 'xml'));
            // }
            // $("#tools_blocks").hide();
            // break;

            case 'content_arduino':
                $(".blocklyToolboxDiv").hide();
                // Optimization: Use the same logic as the preview to avoid redundant work
                BlocklyDuino.renderArduinoCodePreview();

                $("#tools_blocks").hide();
                $("#btn_levels").hide();
                $("#header_supervision").hide();
                $("#header_code").show();
                break;

            //case 'content_supervision':
            //$("#content_supervision").load('./tools/supervision/pymata_arduino.html', BlocklyDuino.renderSupervisionContent);
            //$("#tools_blocks").hide();
            //$("#btn_levels").hide();
            //$("#header_supervision").show();
            //$("#header_code").hide();
        }
    }
};

/**
 * Render block factory - Simple version that worked before
 */
/**
 * Render block factory - Optimized version with debouncing and caching
 */
BlocklyDuino.lastGeneratedCode = "";
BlocklyDuino.previewTimeout = null;

BlocklyDuino.renderArduinoCodePreview = function () {
    if (!BlocklyDuino.workspace) return;

    // Safety: don't render while dragging
    if (BlocklyDuino.workspace.isDragging && BlocklyDuino.workspace.isDragging()) {
        return;
    }

    var cardId = BlocklyDuino.getStringParamFromUrl('card', '');
    var generatedCode;

    try {
        if (cardId != 'kit_microbit') {
            // CRITICAL FIX: Use BlocklyDuino.workspaceToCode FIRST!
            // It has our validation logic for blocks outside setup/loop
            if (BlocklyDuino.workspaceToCode) {
                generatedCode = BlocklyDuino.workspaceToCode(BlocklyDuino.workspace);
            } else if (Blockly.Arduino && Blockly.Arduino.workspaceToCode) {
                // Fallback to standard (no validation)
                console.warn('[PREVIEW] Using standard workspaceToCode - validation may not work');
                generatedCode = Blockly.Arduino.workspaceToCode(BlocklyDuino.workspace);
            } else {
                return;
            }
        } else {
            generatedCode = Blockly.Python.workspaceToCode(BlocklyDuino.workspace);
        }
    } catch (e) {
        console.error('[PREVIEW] Code generation error:', e);
        return;
    }

    // Performance Optimization: Only update DOM and run syntax highlighting if code changed
    if (generatedCode === BlocklyDuino.lastGeneratedCode) {
        return;
    }
    BlocklyDuino.lastGeneratedCode = generatedCode;

    // Update preview element
    var $preview = $('#pre_previewArduino');
    var $arduino = $('#pre_arduino, #pre_Arduino');

    $preview.text(generatedCode || '').data('rawCode', generatedCode);
    $arduino.text(generatedCode || '').data('rawCode', generatedCode);

    // Pretty Print (Syntax Highlighting) - limit frequency or only run when tab is visible?
    if (typeof prettyPrintOne == 'function' && generatedCode) {
        // Only run pretty print if the code isn't massive (e.g. > 50kb can be slow)
        if (generatedCode.length < 50000) {
            var escapedCode = generatedCode.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); var highlighted = prettyPrintOne(escapedCode, 'cpp');
            $preview.html(highlighted);
            $arduino.html(highlighted);
        }
    }
};

/**
 * Workspace change handler with debouncing and drag detection.
 * Consolidates all workspace-dependent updates into a single efficient cycle.
 */
BlocklyDuino.onWorkspaceChange = function (event) {
    if (!BlocklyDuino.workspace) return;

    // 1. Critical Performance: Skip everything while dragging
    if (BlocklyDuino.workspace.isDragging && BlocklyDuino.workspace.isDragging()) {
        return;
    }

    // 2. Filter out UI events (scroll, zoom, selection, etc)
    // We use a broader check to catch more noise
    if (event.type == Blockly.Events.UI ||
        event.type == 'ui' ||
        event.type == 'click' ||
        event.type == 'selected' ||
        event.type == 'drag' ||
        event.element == 'click') {
        return;
    }

    // 3. Debounce the code preview and special block handling
    if (BlocklyDuino.previewTimeout) {
        clearTimeout(BlocklyDuino.previewTimeout);
    }

    // Short delay for responsiveness, longer for very complex workspaces
    // We'll calculate blockCount INSIDE the timer to avoid it running on every move
    BlocklyDuino.previewTimeout = setTimeout(function () {
        if (!BlocklyDuino.workspace || (BlocklyDuino.workspace.isDragging && BlocklyDuino.workspace.isDragging())) {
            return;
        }

        // Run the main preview update
        BlocklyDuino.renderArduinoCodePreview();

        // RUN ANALYTICS: Track Block Usage (on Creation)
        if (event.type == Blockly.Events.CREATE && event.ids) {
            try {
                // Determine source: toolbox vs copy/paste/load
                // Note: Blockly doesn't explicitly flag 'toolbox' creation in all versions, 
                // but we can infer it or just track all new blocks.
                // We avoid tracking during initial load via checking 'BlocklyDuino.loadingDefaultBlocks' if it existed, 
                // but checking workspace.isDragging is a decent proxy for "user interaction".

                event.ids.forEach(function (blockId) {
                    var block = BlocklyDuino.workspace.getBlockById(blockId);
                    if (block) {
                        // Send Analytics using robust helper if available
                        var tracker = (typeof window.trackGAEvent === 'function') ? window.trackGAEvent : window.gtag;

                        if (typeof tracker === 'function') {
                            // Simple debounce per block type to avoid spamming "math_number" 50 times
                            var key = 'ga_debounce_' + block.type;
                            var lastSent = sessionStorage.getItem(key);
                            var now = Date.now();

                            // Only send if > 30 seconds since last of this type (prevents spam on paste)
                            if (!lastSent || (now - parseInt(lastSent)) > 30000) {
                                tracker('use_block', {
                                    'block_type': block.type,
                                    'block_category': (block.category || 'unknown')
                                });
                                sessionStorage.setItem(key, now.toString());
                            }
                        }
                    }
                });
            } catch (e) {
                console.warn('[ANALYTICS] Error tracking block usage:', e);
            }
        }

        // Run special logic that requires workspace scanning
        // We only do this after structural changes
        if (event.type == Blockly.Events.CREATE ||
            event.type == Blockly.Events.CHANGE ||
            event.type == Blockly.Events.MOVE ||
            event.type == Blockly.Events.DELETE) {
            BlocklyDuino.handleBlinkBotSpecialBlocks(event);
        }
    }, 150); // Reduced delay to 150ms for better "perceived" smoothness
};

/**
 * Handle special cleanup logic for BlinkBot blocks
 */
BlocklyDuino.handleBlinkBotSpecialBlocks = function (event) {
    try {
        var ws = BlocklyDuino.workspace;
        if (!ws) return;

        // Scan for hat block
        var all = ws.getAllBlocks(false);
        var hasWhenRun = false;
        for (var i = 0; i < all.length; i++) {
            if (all[i].type === 'blinkbot_when_run') {
                hasWhenRun = true;
                break;
            }
        }

        if (hasWhenRun) {
            // If hat is present, remove setup/loop skeletons
            var tops = ws.getTopBlocks(false);
            var blocksToRemove = [];

            for (var j = 0; j < tops.length; j++) {
                var t = tops[j];
                if (t && (t.type === 'base_setup_loop' || t.type === 'base_setup' || t.type === 'base_loop')) {
                    blocksToRemove.push(t);
                }
            }

            if (blocksToRemove.length > 0) {
                // Disable events while deleting to prevent recursive calls
                Blockly.Events.disable();
                try {
                    for (var k = 0; k < blocksToRemove.length; k++) {
                        blocksToRemove[k].dispose(false);
                    }
                } finally {
                    Blockly.Events.enable();
                }
            }
        }
    } catch (e) {
        console.warn('[WORKSPACE] Error in BlinkBot special handling:', e);
    }
};

/**
 * Populate the supervision tabs with selected card
 */
BlocklyDuino.renderSupervisionContent = function () {
    // tabs-1
    var pinTemplate1 = $("#template_tabs1").html();
    var digitalNumbers = window.profile["defaultBoard"].digital;
    for (var i in digitalNumbers) {
        var pinLine = pinTemplate1.replace(/#pin_number#/g, digitalNumbers[i]);
        $("#tabs-1").append(pinLine);
    }

    // tabs-2
    var pinTemplate2 = $("#template_tabs2").html();
    var pwmTemplate = $("#template_tabs2_pwm").html();
    var pwmNumbers = window.profile["defaultBoard"].PWM;
    for (var i in digitalNumbers) {
        var pinLine = pinTemplate2;
        if ($.inArray(digitalNumbers[i], pwmNumbers) != -1) {
            pinLine = pinLine.replace("#pwm_line#", pwmTemplate);
        } else {
            pinLine = pinLine.replace("#pwm_line#", "");
        }
        pinLine = pinLine.replace(/#pin_number#/g, digitalNumbers[i]);
        $("#tabs-2").append(pinLine);
    }

    // tabs-3
    var pinTemplate3 = $("#template_tabs3").html();
    var analogNumbers3 = window.profile["defaultBoard"].analog;
    for (var i in analogNumbers3) {
        var pinNumber = analogNumbers3[i].substring(1);
        var pinLine = pinTemplate3.replace(/#pin_number#/g, pinNumber);
        $("#tabs-3").append(pinLine);
    }

    // tabs-4
    var pinTemplate4 = $("#template_tabs4").html();
    var analogNumbers4 = window.profile["defaultBoard"].analog;
    for (var i in analogNumbers4) {
        var pinNumber = analogNumbers4[i].substring(1);
        var pinLine = pinTemplate4.replace(/#pin_number#/g, pinNumber);
        $("#tabs-4").append(pinLine);
    }

    Code.initLanguageSupervision();
    jscolor.installByClassName("jscolor");
    $.getScript("./tools/supervision/s2aio_iot.js");
};

/**
 * Populate the content arduino code pane with the edit textarea "edit_code"
 */
BlocklyDuino.valideEditedCode = function () {
    try {
        $('#pre_arduino').text($('#edit_code').val());
        if (typeof prettyPrintOne == 'function') {
            $('#pre_arduino').html(prettyPrintOne($('#pre_arduino').html(), 'cpp'));
        }
    } catch (e) {
        alert(e);
    }
};

/**
 * Get parameters from URL.
 * @param {string} name Parameter name.
 * @param {string} defaultValue Value of parameter if not present.
 * @return {string} The parameter value or the default value if not found.
 */
BlocklyDuino.getStringParamFromUrl = function (name, defaultValue) {
    var val = location.search.match(new RegExp('[?&]' + name + '=([^&]+)'));
    return val ? decodeURIComponent(val[1].replace(/\+/g, '%20')) : defaultValue;
};

/**
 * Get the size of the window.
 * @return {string} The size parameter from URL or 'max' by default.
 */
BlocklyDuino.getSize = function () {
    return BlocklyDuino.getStringParamFromUrl('size', 'max');
};

/**
 * Add or replace a parameter to the URL.
 * 
 * @param {string} name The name of the parameter.
 * @param {string} value Value to set
 * @return {string} The url completed with parameter and value
 */
BlocklyDuino.addReplaceParamToUrl = function (url, param, value) {
    var re = new RegExp("([?&])" + param + "=.*?(&|$)", "i");
    var separator = url.indexOf('?') !== -1 ? "&" : "?";
    if (url.match(re)) {
        return url.replace(re, '$1' + param + "=" + value + '$2');
    } else {
        return url + separator + param + "=" + value;
    }
};

/**
 * Load blocks saved on App Engine Storage or in session/local storage.
 * This function is now responsible for deciding if the default blocks should be
 * loaded.
 * @param {string}
 *            defaultXml Text representation of default blocks from a file.
 */
BlocklyDuino.loadBlocks = function (defaultXml) {
    var blocksLoadedFromFile = false;
    if (defaultXml) {
        // Load the editor with default starting blocks from a file.
        var xml = Blockly.Xml.textToDom(defaultXml);
        if (xml.getElementsByTagName('block').length > 0) {
            Blockly.Xml.domToWorkspace(xml, BlocklyDuino.workspace);
            blocksLoadedFromFile = true;
        }
    }

    if (blocksLoadedFromFile) {
        // Blocks were loaded from a file, so we are done.
        return;
    }

    // No blocks from file, so check session storage.
    var blocksLoadedFromSession = false;
    var loadOnce = null;
    try {
        loadOnce = sessionStorage.getItem('loadOnceBlocks');
    } catch (e) {
        // Firefox sometimes throws a SecurityError when accessing localStorage.
    }

    if (loadOnce && loadOnce.indexOf('<block') > -1) {
        // Session storage has blocks, so load them.
        var xml = Blockly.Xml.textToDom(loadOnce);
        Blockly.Xml.domToWorkspace(xml, BlocklyDuino.workspace);
        blocksLoadedFromSession = true;
    }

    // If no blocks were loaded from a file or a populated session,
    // load the default Arduino block.
    if (!blocksLoadedFromFile && !blocksLoadedFromSession) {
        BlocklyDuino.loadDefaultArduinoBlocks();
    }
};

/**
 * Sets Arduino card
 */
BlocklyDuino.setArduinoBoard = function () {
    var cardId = BlocklyDuino.getStringParamFromUrl('card', '');
    if (!cardId) {
        cardId = BlocklyDuino.selectedCard;
    }
    $("#board_select").val(cardId);

    // set the card from url parameters
    profile["defaultBoard"] = profile[cardId];
    $('#arduino_card_picture').attr("src", profile.defaultBoard['picture']);
    $('#arduino_card_miniPicture').attr("src", profile.defaultBoard['miniPicture']);
    $('#arduino_card_miniPicture_Menu').attr("src", profile.defaultBoard['miniPicture_hor']);
    $('#pictureModalLabel').attr('title', (profile.defaultBoard['description']));
    if ($("#board_select").val().substring(0, 4) == "kit_") {
        $("#btn_config").remove();
        $("#btn_config_kit").removeClass('hidden');
        $('#btn_config_kit').attr("href", profile[$("#board_select").val()]['help_link']);
    }
    BlocklyDuino.cardPicture_change_AIO();
};


/**
 * Binds functions to each of the buttons, nav links, and related.
 */
BlocklyDuino.bindFunctions = function () {

    $('#clearLink', '#btn_reset').on("click", BlocklyDuino.clearLocalStorage);

    var clipboard = new Clipboard('#btn_CopyCode');

    // Navigation buttons
    $('#btn_delete').on("click", BlocklyDuino.discard);
    $('#btn_undo').on("click", BlocklyDuino.Undo);
    $('#btn_redo').on("click", BlocklyDuino.Redo);
    $('#btn_pasteIDEArduino').remove();
    $('#btn_saveArduino').on("click", BlocklyDuino.saveArduinoFile);
    $('#btn_block_capture').on("click", BlocklyDuino.workspace_capture);
    $('#btn_saveXML, #menu_12').on("click", function (e) {
        e.preventDefault();
        BlocklyDuino.saveXmlFile();
    });
    $('#btn_validCode').on("click", BlocklyDuino.valideEditedCode);
    $('#btn_factory').on("click", function () {
        var langChoice = BlocklyDuino.getStringParamFromUrl('lang', '');
        window.open("./tools/factory/block_factory.html?lang=" + langChoice, "_blank");
    });
    $('#load').on("change", BlocklyDuino.load);

    // New Project - Clear workspace
    $('#menu_10').on("click", function (e) {
        e.preventDefault();
        var blockCount = BlocklyDuino.workspace.getAllBlocks(false).length;
        if (blockCount > 0) {
            var msg = "Start a new project? This will clear all " + blockCount + " block(s) from the workspace.";
            if (confirm(msg)) {
                BlocklyDuino.workspace.clear();
                BlocklyDuino.renderArduinoCodePreview();
            }
        } else {
            // Already empty, just confirm
            alert("Workspace is already empty.");
        }
    });

    $('#btn_fakeload, #menu_11').on("click", function (e) {
        e.preventDefault();
        // Native Electron Open
        if (window.electronAPI && window.electronAPI.openFile) {
            window.electronAPI.openFile().then(function (result) {
                if (result.success && result.content) {
                    BlocklyDuino.loadString(result.content);
                } else if (!result.canceled && result.error) {
                    alert("Error opening file: " + result.error);
                }
            }).catch(function (err) {
                console.error("Open File IPC Error:", err);
                alert("System Error opening file: " + err);
            });
        } else {
            var loadEl = document.getElementById('load');
            if (!loadEl) {
                alert('Open file control is missing. Please reload the page.');
                return;
            }
            loadEl.value = '';
            loadEl.click();
        }
    });
    $('#btn_preview').on("click", function () {
        $("#toggle_code").toggle("blind");
    });
    $('#pre_previewArduino').on("click", function () {
        $("#toggle_code").toggle("blind");
    });

    $('#toggle-Colors').on("change", BlocklyDuino.toggleTextColors);

    $('#board_select').on("focus", function () {
        BlocklyDuino.selectedCard = $(this).val();
    });
    $('#btn_edit_code').mouseover(function () {
        document.getElementById("survol").textContent = MSG['span_edit_code'];
    }).mouseout(function () {
        document.getElementById("survol").textContent = "";
    });
    $('#btn_saveArduino').mouseover(function () {
        document.getElementById("survol").textContent = MSG['span_saveIno'];
    }).mouseout(function () {
        document.getElementById("survol").textContent = "";
    });
    $('#btn_verify_local').mouseover(function () {
        document.getElementById("survol").textContent = MSG['span_verify_local'];
    }).mouseout(function () {
        document.getElementById("survol").textContent = "";
    });
    $('#btn_flash_local').mouseover(function () {
        document.getElementById("survol").textContent = MSG['span_flash_local'];
    }).mouseout(function () {
        document.getElementById("survol").textContent = "";
    });
    $('#btn_term').mouseover(function () {
        document.getElementById("survol").textContent = MSG['span_connect_serial'];
    }).mouseout(function () {
        document.getElementById("survol").textContent = "";
    });
    $('#btn_configGlobal').on("click", BlocklyDuino.buildlibraries);
    $('#configModalGlobal').on("hidden.bs.modal", function () {
        $("#board_select").val(BlocklyDuino.selectedCard);
        BlocklyDuino.cardPicture_change_AIO();
    });
    $('#configModalGlobal').on("show.bs.modal", function () {
        if (window.electronAPI && window.electronAPI.getGeminiKeyStatus) {
            window.electronAPI.getGeminiKeyStatus().then(function (res) {
                var statusEl = document.getElementById('gemini_key_status');
                var clearEl = document.getElementById('gemini_key_clear');
                if (statusEl) {
                    statusEl.style.display = res.set ? 'block' : 'none';
                    if (res.backendMode) {
                        statusEl.textContent = 'Using AI server — Gemini API key below is ignored until you clear the server.';
                    } else {
                        statusEl.textContent = res.set ? 'Key is configured (enter new key and Save to replace).' : '';
                    }
                }
                if (clearEl) { clearEl.style.display = (res.set && !res.backendMode) ? 'inline' : 'none'; }
            }).catch(function () {
                var statusEl = document.getElementById('gemini_key_status');
                var clearEl = document.getElementById('gemini_key_clear');
                if (statusEl) { statusEl.style.display = 'none'; }
                if (clearEl) { clearEl.style.display = 'none'; }
            });
        }
        if (window.electronAPI && window.electronAPI.getAiBackendConfig) {
            window.electronAPI.getAiBackendConfig().then(function (cfg) {
                var urlEl = document.getElementById('ai_backend_url');
                var st = document.getElementById('ai_backend_status');
                var savedUrl = (cfg.url || '').trim();
                var def = (cfg.defaultUrl || '').trim();
                if (urlEl) {
                    urlEl.value = savedUrl || def;
                }
                if (st) {
                    st.style.display = 'block';
                    var eff = (cfg.effectiveUrl || '').trim();
                    if (eff && cfg.effectiveHasToken) {
                        st.textContent = 'AI Assistant will use: ' + eff + (savedUrl ? ' (your saved URL overrides defaults).' : ' (MVP bundled proxy + token if you did not save).');
                    } else if (savedUrl) {
                        st.textContent = 'Server: ' + (cfg.fromEnv ? 'URL from environment. ' : '') + (cfg.hasToken ? 'Token configured.' : 'Add Bearer token and Save if your server requires one.');
                    } else if (def) {
                        st.textContent = 'Default proxy URL is filled in. Paste token and Save, or rely on MVP bundled credentials.';
                    } else {
                        st.textContent = 'Configure URL and token, or use Gemini key below.';
                    }
                }
            }).catch(function () { });
        }
    });
    $('#btn_save_ai_backend').on('click', function () {
        var urlEl = document.getElementById('ai_backend_url');
        var tokEl = document.getElementById('ai_backend_token');
        var st = document.getElementById('ai_backend_status');
        if (!window.electronAPI || !window.electronAPI.saveAiBackend) return;
        var url = urlEl ? urlEl.value.trim() : '';
        var token = tokEl ? tokEl.value.trim() : '';
        window.electronAPI.saveAiBackend({ url: url, token: token }).then(function (res) {
            if (st) {
                st.style.display = 'block';
                st.textContent = res.success ? (url || token ? 'AI server saved. Restart chat if needed.' : 'Saved config cleared. MVP installer still uses bundled proxy + token until you set overrides.') : ('Error: ' + (res.error || ''));
            }
            if (tokEl && token) { tokEl.value = ''; }
        });
    });
    $('#btn_clear_ai_backend').on('click', function () {
        if (!window.electronAPI || !window.electronAPI.clearAiBackend) return;
        var urlEl = document.getElementById('ai_backend_url');
        var st = document.getElementById('ai_backend_status');
        window.electronAPI.clearAiBackend().then(function (res) {
            if (urlEl) { urlEl.value = ''; }
            if (st) {
                st.style.display = 'block';
                st.textContent = res.success ? 'Switched to Gemini API key mode.' : 'Clear failed.';
            }
        });
    });
    $('#gemini_key_clear').on("click", function (e) {
        e.preventDefault();
        if (window.electronAPI && window.electronAPI.saveGeminiKey) {
            window.electronAPI.saveGeminiKey('').then(function (res) {
                if (res && res.success) {
                    var statusEl = document.getElementById('gemini_key_status');
                    var clearEl = document.getElementById('gemini_key_clear');
                    if (statusEl) { statusEl.style.display = 'block'; statusEl.textContent = 'Key cleared.'; }
                    if (clearEl) { clearEl.style.display = 'none'; }
                }
            });
        }
    });
    $('#btn_saveConfigGlobale').on("click", function () {
        var keyInput = document.getElementById('gemini_api_key');
        if (keyInput && window.electronAPI && window.electronAPI.saveGeminiKey) {
            var key = keyInput.value ? keyInput.value.trim() : '';
            if (!key) {
                var statusEl = document.getElementById('gemini_key_status');
                if (statusEl) {
                    statusEl.style.display = 'block';
                    statusEl.textContent = 'Leave blank to keep current key.';
                }
                return;
            }
            window.electronAPI.saveGeminiKey(key).then(function (res) {
                if (res && res.success) {
                    keyInput.value = '';
                    var statusEl = document.getElementById('gemini_key_status');
                    if (statusEl) {
                        statusEl.style.display = 'block';
                        statusEl.textContent = 'API key saved.';
                    }
                }
            }).catch(function (err) {
                console.warn('[AI] Save Gemini key failed:', err);
            });
        }
    });

    $('#toolboxes').on("focus", function () {
        BlocklyDuino.selectedToolbox = $(this).val();
    });

    //menu déroulant
    $('#toolboxes, #toggle-Functions').on("change", BlocklyDuino.changeToolboxDefinition);
    // $('#toolboxes').on("change", BlocklyDuino.changeToolboxDefinition);

    //bouton de niveaux
    $('#toolbox_algo, #menu_420').on("click", function (e) {
        e.preventDefault();
        document.getElementById("toolboxes").options.selectedIndex = 1;
        BlocklyDuino.changeToolboxDefinition();
    });

    $('#toolbox_arduino_1, #menu_421').on("click", function (e) {
        e.preventDefault();
        document.getElementById("toolboxes").options.selectedIndex = 2;
        BlocklyDuino.changeToolboxDefinition();
    });

    $('#toolbox_arduino_2, #menu_422').on("click", function (e) {
        e.preventDefault();
        document.getElementById("toolboxes").options.selectedIndex = 3;
        BlocklyDuino.changeToolboxDefinition();
    });

    $('#toolbox_arduino_3, #menu_423').on("click", function (e) {
        e.preventDefault();
        document.getElementById("toolboxes").options.selectedIndex = 4;
        BlocklyDuino.changeToolboxDefinition();
    });

    $('#toolbox_arduino_4, #menu_424').on("click", function (e) {
        e.preventDefault();
        document.getElementById("toolboxes").options.selectedIndex = 5;
        BlocklyDuino.changeToolboxDefinition();
    });

    $('#toolbox_arduino_all, #menu_429').on("click", function (e) {
        e.preventDefault();
        document.getElementById("toolboxes").options.selectedIndex = 6;
        BlocklyDuino.changeToolboxDefinition();
    });

    // ── Beginner / Advanced mode toggle ───────────────────────────────────────
    BlocklyDuino.applyMode = function (mode) {
        mode = BlocklyDuino.normalizeBlockideMode(mode);
        var toolboxFile = (mode === 'advanced') ? 'toolbox_arduino_all' : 'toolbox_beginner';

        // ── Persist mode choice ───────────────────────────────────────────────
        localStorage.setItem('blockide_mode', mode);
        sessionStorage.setItem('toolbox', BlocklyDuino.normalizeToolboxFileKey(toolboxFile));

        // ── Update mode dropdown label + menu highlight ───────────────────────
        $('#mode_dropdown_label').text(mode === 'beginner' ? 'Beginner' : 'Advanced');
        $('#mode_opt_beginner_li').toggleClass('active', mode === 'beginner');
        $('#mode_opt_advanced_li').toggleClass('active', mode === 'advanced');

        // ── Load the XML for this mode into the DOM (synchronous AJAX) ────────
        // This populates #toolbox with the full category set for the mode,
        // giving openConfigToolbox and changeToolbox the right source elements.
        BlocklyDuino.loadToolboxDefinition(toolboxFile);

        var toolboxEl = document.getElementById('toolbox');
        var newXml = '<xml id="toolbox">';

        if (mode === 'advanced') {
            // ── Advanced: restore the user's last saved selection ─────────────
            // Priority: saved advanced selection → defaults from the XML file.
            var savedIds = (sessionStorage.getItem('toolbox_advanced_ids') || '').trim();
            var defaultIds = ($('#defaultCategories').html() || '').trim().replace(/\s+/g, '');
            var activeIds = savedIds || defaultIds;

            if (toolboxEl && activeIds) {
                activeIds.split(',').forEach(function (id) {
                    id = id.trim();
                    var el = id ? document.getElementById(id) : null;
                    if (el && el.tagName.toLowerCase() === 'category') {
                        newXml += el.outerHTML;
                    }
                });
            }
            sessionStorage.setItem('toolboxids', activeIds);

        } else {
            // ── Beginner: always show all curated categories, no customisation ─
            if (toolboxEl) {
                var children = toolboxEl.children;
                for (var i = 0; i < children.length; i++) {
                    if (children[i].tagName.toLowerCase() === 'category') {
                        newXml += children[i].outerHTML;
                    }
                }
            }
            // Record all beginner category IDs as active
            var beginnerIds = ($('#defaultCategories').html() || '').trim().replace(/\s+/g, '');
            sessionStorage.setItem('toolboxids', beginnerIds);
        }

        newXml += '</xml>';

        // ── Push directly into the live Blockly workspace ─────────────────────
        if (BlocklyDuino.workspace) {
            try {
                BlocklyDuino.workspace.updateToolbox(newXml);
            } catch (e) {
                console.warn('[applyMode] workspace.updateToolbox failed:', e);
            }
        }

        setTimeout(function () { BlocklyDuino.applyCategoryColors(); }, 200);
        setTimeout(function () { BlocklyDuino.applyCategoryColors(); }, 600);
    };

    $('#mode_opt_beginner').on('click', function (e) {
        e.preventDefault();
        BlocklyDuino.applyMode('beginner');
    });
    $('#mode_opt_advanced').on('click', function (e) {
        e.preventDefault();
        BlocklyDuino.applyMode('advanced');
    });

    $('#menuPanelBlockly li[id^=tab_]').on("click", function () {
        BlocklyDuino.selectedTab = $(this).attr('id').substring(4);
        BlocklyDuino.renderContent();
    });

    $('#divTitreMenu_menu li[id^=mtab_]').on("click", function () {
        BlocklyDuino.selectedTab = $(this).attr('id').substring(5);
        BlocklyDuino.renderContent();
    });

    $('#btn_miniMenuPanel, #menu_441').on("click", BlocklyDuino.miniMenuPanel);

    $('#btn_size').on("click", BlocklyDuino.changeSize);
    $('#btn_config').on("click", BlocklyDuino.openConfigToolbox);

    $('#btn_edit_code').on("click", BlocklyDuino.editArduinoCode);

    $('#select_all').on("click", BlocklyDuino.checkAll);
    $('#btn_valid_config').on("click", BlocklyDuino.changeToolbox);
    $('#btn_validConfigGlobale').on("click", BlocklyDuino.validateConfigGlobal);
    $('#btn_card_picture_change').on("click", BlocklyDuino.validateConfigOffline);
    $('#textSize').on("click", BlocklyDuino.tailleFonte);

    $('#btn_valid_msg').on("click", function () {
        if ($('#ajax_msg').prop("checked")) {
            sessionStorage.setItem('msg_ajax_seen', true);
        }
        $('#ajaxModal').modal('hide');
    });

    $('#btn_inline').on("click", BlocklyDuino.inline);
    //$('#btn_wiring').on("click", BlocklyDuino.openWiringDialog);
    $('#btn_blocs_picture_mini').on("click", BlocklyDuino.blockPicture_mini);
    $('#btn_blocs_picture_maxi').on("click", BlocklyDuino.blockPicture_maxi);
    $('#btn_blocs_picture').on("click", BlocklyDuino.blockPicture);

    $('#btn_card_picture_mini').on("click", BlocklyDuino.cardPicture_mini);
    $('#btn_card_picture_maxi').on("click", BlocklyDuino.cardPicture_maxi);
    $('#btn_wiring_mini').on("click", BlocklyDuino.wiring_mini);
    $('#btn_wiring_maxi').on("click", BlocklyDuino.wiring_maxi);

    $('#btn_example, #menu_131').on("click", function (e) {
        e.preventDefault();
        BlocklyDuino.buildExamples();
    });

    $('#miniCard, #miniCard_Menu').on('click', function () {
        var dialogConvert = $("#pictureModalLabel").dialog({
            autoOpen: false,
            resizable: false,
            height: $("#arduino_card_picture").offsetHeight,
            width: $("#arduino_card_picture").offsetWidth,
            show: {
                effect: "drop",
                duration: 600
            },
            hide: {
                effect: "drop",
                duration: 600
            },
            position: {
                my: "center",
                at: "center",
                of: window
            },
        });
        if (!dialogConvert.dialog("isOpen")) {
            dialogConvert.dialog("open").dialog("option", "buttons");
        };
    });

    $('#btn_wiring, #menu_21').on('click', function () {
        var dialogConvert = $("#wiringModal").dialog({
            autoOpen: false,
            resizable: true,
            height: 400,
            width: 600,
            show: {
                effect: "drop",
                duration: 600
            },
            hide: {
                effect: "drop",
                duration: 600
            },
            position: {
                my: "center",
                at: "center",
                of: window
            },
        });
        if (!dialogConvert.dialog("isOpen")) {
            dialogConvert.dialog("open").dialog("option", "buttons");
        };
    });

    $('#btn_convert, #menu_31').on('click', function () {
        var dialogConvert = $("#convertModal").dialog({
            autoOpen: false,
            resizable: false,
            height: 200,
            width: 480,
            show: {
                effect: "drop",
                duration: 600
            },
            hide: {
                effect: "drop",
                duration: 600
            },
            position: {
                my: "center",
                at: "center",
                of: window
            },
        });
        if (!dialogConvert.dialog("isOpen")) {
            dialogConvert.dialog("open").dialog("option", "buttons");
        };
    });

    $('#btn_screenduino, #menu_32').on('click', function () {
        var iframe = $("#screen_falsemodal > iframe");
        var $screenlang = "./tools/screenduino/index.html";
        var dialogScreen = $("#screen_falsemodal").dialog({
            autoOpen: false,
            resizable: true,
            height: 600,
            width: 650,
            show: {
                effect: "drop",
                duration: 600
            },
            hide: {
                effect: "drop",
                duration: 600
            },
            position: {
                my: "center",
                at: "center",
                of: window
            },
        });
        iframe.attr({
            width: "100%",
            height: "100%",
            src: $screenlang
        });
        if (!dialogScreen.dialog("isOpen")) {
            dialogScreen.dialog("open").dialog("option", "buttons");
        };
    });
    $('#btn_RGB, #menu_33').on('click', function () {
        var iframe = $("#RGB_falsemodal > iframe");
        var $RGBlang = "./tools/RGB/RGB_" + Code.LANG + ".html";
        var dialogRGB = $("#RGB_falsemodal").dialog({
            autoOpen: false,
            resizable: true,
            height: 760,
            width: 550,
            show: {
                effect: "drop",
                duration: 600
            },
            hide: {
                effect: "drop",
                duration: 600
            },
            position: {
                my: "center",
                at: "center",
                of: window
            },
        });
        iframe.attr({
            width: "100%",
            height: "100%",
            src: $RGBlang
        });
        if (!dialogRGB.dialog("isOpen")) {
            dialogRGB.dialog("open").dialog("option", "buttons");
        };
    });
    //mini menus version
    $('#menu_24').on('click', function () {
        $("#barre_ide").prependTo("#content_arduino");
        $("#barre_supervision").prependTo("#content_supervision");
    });

    // Config Modal Tabs and Search
    $('.config-tab-btn').on('click', function (e) {
        e.preventDefault();
        // Switch Tabs
        $('.config-tab-btn').removeClass('active');
        $(this).addClass('active');

        // Switch Panes
        var target = $(this).data('tab');
        if (target === 'all') {
            $('.category-card').show();
        } else {
            $('.category-card').hide();
            $('.category-card[data-group="' + target + '"]').show();
        }
    });

    $('#categorySearch').on('keyup', function () {
        var value = $(this).val().toLowerCase();
        var activeTab = $('.config-tab-btn.active').data('tab');

        $('.category-card').each(function () {
            var card = $(this);
            var text = card.find('.card-title').text().toLowerCase();
            var group = card.data('group');
            var matchesSearch = text.indexOf(value) > -1;
            var matchesTab = activeTab === 'all' || group === activeTab;

            card.toggle(matchesSearch && matchesTab);
        });
    });

    // Card Click Handler (delegated since cards are dynamic)
    $('#modal-body-config').on('click', '.category-card', function (e) {
        // Prevent infinite loop if clicking the checkbox directly
        if ($(e.target).is('input')) return;

        var checkbox = $(this).find('input[type="checkbox"]');
        checkbox.prop('checked', !checkbox.prop('checked'));
        $(this).toggleClass('selected', checkbox.prop('checked'));
    });
};

/**
 * checks all checkboxes in modal "configModal"
 */
BlocklyDuino.checkAll = function () {
    var isChecked = this.checked;
    if (this.checked) {
        // Iterate each checkbox
        $('#modal-body-config input:checkbox[id^=checkbox_]').each(function () {
            this.checked = true;
            $(this).closest('.category-card').addClass('selected');
        });
    } else {
        $('#modal-body-config input:checkbox[id^=checkbox_]').each(function () {
            this.checked = false;
            $(this).closest('.category-card').removeClass('selected');
        });
    }
};

/**
 * Build modal to configure ToolBox
 */
BlocklyDuino.openConfigToolbox = function () {

    var modalbody = $("#modal-body-config");

    // ── Ensure the right toolbox XML is in the DOM for the current mode ──────
    // In Advanced mode we always want the full category list (toolbox_arduino_all)
    // available so the user can check/uncheck any of the 33 categories.
    // In Beginner mode we only offer the curated categories.
    var mode = BlocklyDuino.getBlockideMode();
    var requiredFile = (mode === 'advanced') ? 'toolbox_arduino_all' : 'toolbox_beginner';
    var domFile = sessionStorage.getItem('toolbox') || '';
    if (domFile !== requiredFile) {
        BlocklyDuino.loadToolboxDefinition(requiredFile);
        sessionStorage.setItem('toolbox', requiredFile);
    }

    // ── Determine which category IDs are currently active (pre-check) ────────
    var loadIds;
    if (mode === 'advanced') {
        // Prefer the saved advanced selection; fall back to sessionStorage then defaults.
        loadIds = (sessionStorage.getItem('toolbox_advanced_ids') || '').trim() ||
                  (sessionStorage.getItem('toolboxids') || '').trim() ||
                  ($('#defaultCategories').html() || '').trim().replace(/\s+/g, '');
    } else {
        // Beginner mode: all beginner categories are active.
        loadIds = ($('#defaultCategories').html() || '').trim().replace(/\s+/g, '') ||
                  (sessionStorage.getItem('toolboxids') || '').trim();
    }
    if (!loadIds) loadIds = '';

    if (!BlocklyDuino.ajaxOK || BlocklyDuino.toolboxInIndexHtml) {
        $('#divToolbox').hide();
    }

    // clear modal
    modalbody.empty();

    // SVG icons matching the toolbox circles
    var _S = 'fill="none" stroke="white" stroke-linecap="round" stroke-linejoin="round"';
    var CATEGORY_METADATA = {
        "CAT_LOGIC":            { group: "Code",    color: "#FFAB19", desc: "If, else, conditions",   svg: '<svg viewBox="0 0 16 16" ' + _S + ' stroke-width="1.6"><path d="M8 2a4 4 0 0 1 2.5 7.1V11H5.5V9.1A4 4 0 0 1 8 2z"/><path d="M5.5 11h5"/><path d="M6 13h4"/><path d="M7 15h2"/></svg>' },
        "CAT_LOOPS":            { group: "Code",    color: "#FFD500", desc: "Repeat, while, for",     svg: '<svg viewBox="0 0 16 16" ' + _S + ' stroke-width="1.8"><path d="M6 8c0-1.7-1.1-3-2.5-3S1 6.3 1 8s1.1 3 2.5 3S6 9.7 6 8zm0 0c0 1.7 1.1 3 2.5 3S11 9.7 11 8s-1.1-3-2.5-3S6 6.3 6 8z"/></svg>' },
        "CAT_MATH":             { group: "Code",    color: "#40BF4A", desc: "Numbers & calculations", svg: '<svg viewBox="0 0 16 16" ' + _S + ' stroke-width="1.8"><rect x="2" y="2" width="12" height="12" rx="2"/><path d="M5 8h6M8 5v6"/></svg>' },
        "CAT_ARRAY":            { group: "Code",    color: "#4CBFE6", desc: "Lists & Arrays",         svg: '<svg viewBox="0 0 16 16" ' + _S + ' stroke-width="1.6"><rect x="1" y="4" width="4" height="4" rx="1"/><rect x="6" y="4" width="4" height="4" rx="1"/><rect x="11" y="4" width="4" height="4" rx="1"/><path d="M3 8v4M8 8v4M13 8v4M3 12h10"/></svg>' },
        "CAT_TEXT":             { group: "Code",    color: "#9966FF", desc: "String & character text", svg: '<svg viewBox="0 0 16 16" ' + _S + ' stroke-width="1.65" stroke-linejoin="round"><path d="M4 13L8 3.5L12 13"/><path d="M5.5 9h5"/></svg>' },
        "CAT_VARIABLES":        { group: "Code",    color: "#FF8C1A", desc: "Store & use values",     svg: '<svg viewBox="0 0 16 16" ' + _S + ' stroke-width="1.6"><rect x="2" y="2" width="12" height="12" rx="2"/><path d="M5 5l6 6M11 5l-6 6"/></svg>' },
        "CAT_FUNCTIONS":        { group: "Code",    color: "#FF6680", desc: "Create reusable blocks", svg: '<svg viewBox="0 0 16 16" ' + _S + ' stroke-width="1.6"><path d="M2 5h4V3.5C6 2.7 6.7 2 7.5 2S9 2.7 9 3.5V5h3a1 1 0 0 1 1 1v2.5H11.5C10.7 8.5 10 9.2 10 10s.7 1.5 1.5 1.5H13V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/></svg>' },
        "CAT_ARDUINO":          { group: "Hardware",color: "#00979D", desc: "Setup & Loop",           svg: '<svg viewBox="0 0 16 16" ' + _S + ' stroke-width="1.5"><rect x="4" y="4" width="8" height="8" rx="1"/><path d="M4 6H2M4 10H2M12 6h2M12 10h2M6 4V2M10 4V2M6 12v2M10 12v2"/></svg>' },
        "CAT_ARDUINO_TIME":     { group: "Hardware",color: "#00979D", desc: "Delays & timing",        svg: '<svg viewBox="0 0 16 16" ' + _S + ' stroke-width="1.8"><circle cx="8" cy="8" r="5.5"/><path d="M8 5v3.5l2.5 1.5"/></svg>' },
        "CAT_ARDUINO_CONVERSION":{ group:"Hardware",color: "#00979D", desc: "Convert data types",     svg: '<svg viewBox="0 0 16 16" ' + _S + ' stroke-width="1.8"><path d="M3 5h10M10 2l3 3-3 3"/><path d="M13 11H3M6 8l-3 3 3 3"/></svg>' },
        "CAT_ARDUINO_OUT":      { group: "Hardware",color: "#00979D", desc: "Output: LEDs & signals", svg: '<svg viewBox="0 0 16 16" ' + _S + ' stroke-width="1.6"><path d="M6 10V8.5A3 3 0 1 1 10 8.5V10H6z"/><path d="M6 10h4M6.5 12h3M7.5 14h1"/></svg>' },
        "CAT_SERVO":            { group: "Actuator",color: "#3498DB", desc: "Servo motors",           svg: '<svg viewBox="0 0 16 16" ' + _S + ' stroke-width="1.6"><circle cx="8" cy="9" r="4"/><circle cx="8" cy="9" r="1.5" fill="white" stroke="none"/><rect x="6" y="2" width="4" height="3" rx="1"/><path d="M8 5v3"/></svg>' },
        "CAT_STEPPER":          { group: "Actuator",color: "#8CA55B", desc: "Stepper motors",         svg: '<svg viewBox="0 0 16 16" ' + _S + ' stroke-width="1.6"><circle cx="8" cy="8" r="5.5"/><path d="M8 4v4l3 3"/><circle cx="8" cy="8" r="1.2" fill="white" stroke="none"/></svg>' },
        "CAT_LEDS":             { group: "Actuator",color: "#C9D7E2", desc: "LED control",            svg: '<svg viewBox="0 0 16 16" ' + _S + ' stroke-width="1.6"><path d="M6 10V8.5A3 3 0 1 1 10 8.5V10H6z"/><path d="M6 10h4M7 12h2"/></svg>' },
        "CAT_SENSOR":           { group: "Sensor",  color: "#EA9576", desc: "Basic sensors",          svg: '<svg viewBox="0 0 16 16" ' + _S + ' stroke-width="1.6"><circle cx="8" cy="8" r="2.5"/><path d="M4.5 4.5A5 5 0 0 0 3 8a5 5 0 0 0 1.5 3.5M11.5 4.5A5 5 0 0 1 13 8a5 5 0 0 1-1.5 3.5"/></svg>' },
        "CAT_SENSORS":          { group: "Sensor",  color: "#2980B9", desc: "Advanced sensors",       svg: '<svg viewBox="0 0 16 16" ' + _S + ' stroke-width="1.6"><circle cx="8" cy="8" r="2"/><path d="M3.5 3.5A6.5 6.5 0 0 0 1.5 8a6.5 6.5 0 0 0 2 4.5M12.5 3.5A6.5 6.5 0 0 1 14.5 8a6.5 6.5 0 0 1-2 4.5M5.5 5.5A3.5 3.5 0 0 0 4.5 8a3.5 3.5 0 0 0 1 2.5M10.5 5.5A3.5 3.5 0 0 1 11.5 8a3.5 3.5 0 0 1-1 2.5"/></svg>' },
        "CAT_KEYPAD":           { group: "Sensor",  color: "#46C286", desc: "Keypad input",           svg: '<svg viewBox="0 0 16 16" ' + _S + ' stroke-width="1.5"><rect x="2" y="2" width="3" height="3" rx=".5"/><rect x="6.5" y="2" width="3" height="3" rx=".5"/><rect x="11" y="2" width="3" height="3" rx=".5"/><rect x="2" y="6.5" width="3" height="3" rx=".5"/><rect x="6.5" y="6.5" width="3" height="3" rx=".5"/><rect x="11" y="6.5" width="3" height="3" rx=".5"/><rect x="4.5" y="11" width="7" height="3" rx=".5"/></svg>' },
        "CAT_RTC_DS3231":       { group: "Sensor",  color: "#0084AD", desc: "Real Time Clock",        svg: '<svg viewBox="0 0 16 16" ' + _S + ' stroke-width="1.8"><circle cx="8" cy="8" r="5.5"/><path d="M8 5v3.5l2.5 1.5"/></svg>' },
        "CAT_LCD_SCREEN":       { group: "Display", color: "#2980B9", desc: "LCD screens",            svg: '<svg viewBox="0 0 16 16" ' + _S + ' stroke-width="1.6"><rect x="1" y="3" width="14" height="9" rx="1.5"/><path d="M4 13v1.5M12 13v1.5M4 14.5h8"/><path d="M4 7h8M4 9.5h5"/></svg>' },
        "CAT_OLED_U8G":         { group: "Display", color: "#2980B9", desc: "OLED displays",          svg: '<svg viewBox="0 0 16 16" ' + _S + ' stroke-width="1.6"><rect x="2" y="3" width="12" height="10" rx="2"/><circle cx="6" cy="8" r="1.5" fill="white" stroke="none"/><path d="M9 6.5l3 3M12 6.5l-3 3"/></svg>' },
        "CAT_MATRIX_LED_RGB":   { group: "Display", color: "#C9D7E2", desc: "LED matrix",             svg: '<svg viewBox="0 0 16 16" ' + _S + ' stroke-width="1.5"><circle cx="4" cy="4" r="1.2" fill="white" stroke="none"/><circle cx="8" cy="4" r="1.2" fill="white" stroke="none"/><circle cx="12" cy="4" r="1.2" fill="white" stroke="none"/><circle cx="4" cy="8" r="1.2" fill="white" stroke="none"/><circle cx="8" cy="8" r="1.2" fill="white" stroke="none"/><circle cx="12" cy="8" r="1.2" fill="white" stroke="none"/><circle cx="4" cy="12" r="1.2" fill="white" stroke="none"/><circle cx="8" cy="12" r="1.2" fill="white" stroke="none"/><circle cx="12" cy="12" r="1.2" fill="white" stroke="none"/></svg>' },
        "CAT_DISPLAY":            { group: "Display", color: "#2980B9", desc: "LCD & OLED screens",     svg: '<svg viewBox="0 0 16 16" ' + _S + ' stroke-width="1.6"><rect x="2" y="3" width="12" height="10" rx="2"/><path d="M5 8h6M8 6v4"/></svg>' },
        "CAT_ADAFRUIT_SSD1306": { group: "Display", color: "#2980B9", desc: "SSD1306 OLED",           svg: '<svg viewBox="0 0 16 16" ' + _S + ' stroke-width="1.6"><rect x="2" y="3" width="12" height="10" rx="2"/><path d="M5 8h6M8 6v4"/></svg>' },
        "CAT_BLUETOOTH_MISC":   { group: "Comms",   color: "#0075E1", desc: "Bluetooth",              svg: '<svg viewBox="0 0 16 16" ' + _S + ' stroke-width="1.8"><path d="M6 5l4 3-4 3V3l4 3-4 3"/></svg>' },
        "CAT_RF433":            { group: "Comms",   color: "#9BACB4", desc: "RF 433MHz",              svg: '<svg viewBox="0 0 16 16" ' + _S + ' stroke-width="1.7"><path d="M8 11v4"/><path d="M5.5 9.5A3.5 3.5 0 0 1 8 6a3.5 3.5 0 0 1 2.5 3.5"/><path d="M3 8A5.5 5.5 0 0 1 8 3a5.5 5.5 0 0 1 5 5"/><circle cx="8" cy="11" r="1" fill="white" stroke="none"/></svg>' },
        "CAT_RFID":             { group: "Comms",   color: "#9BACB4", desc: "RFID / NFC",             svg: '<svg viewBox="0 0 16 16" ' + _S + ' stroke-width="1.6"><rect x="2" y="4" width="8" height="8" rx="1"/><path d="M12 6a3 3 0 0 1 0 4"/><path d="M12 4a5 5 0 0 1 0 8"/></svg>' },
        "CAT_LORA":             { group: "Comms",   color: "#6C5CE7", desc: "LoRa long-range",        svg: '<svg viewBox="0 0 16 16" ' + _S + ' stroke-width="1.7"><path d="M8 11v3"/><path d="M5 9.5A4 4 0 0 1 8 7a4 4 0 0 1 3 2.5"/><path d="M2 8A7 7 0 0 1 8 3a7 7 0 0 1 6 5"/><circle cx="8" cy="11" r="1" fill="white" stroke="none"/></svg>' },
        "CAT_ETHERNET":         { group: "Comms",   color: "#FFCC66", desc: "Ethernet / WiFi",        svg: '<svg viewBox="0 0 16 16" ' + _S + ' stroke-width="1.6"><rect x="6" y="10" width="4" height="3" rx=".5"/><rect x="1" y="5" width="4" height="3" rx=".5"/><rect x="6" y="2" width="4" height="3" rx=".5"/><rect x="11" y="5" width="4" height="3" rx=".5"/><path d="M8 5v5M3 8l5-3 5 3"/></svg>' },
        "CAT_DRONE":            { group: "Robot",   color: "#6C5CE7", desc: "Drone control",          svg: '<svg viewBox="0 0 16 16" ' + _S + ' stroke-width="1.5"><circle cx="8" cy="8" r="2"/><path d="M8 6V4M8 12v-2M6 8H4M12 8h-2"/><circle cx="4" cy="4" r="1.5"/><circle cx="12" cy="4" r="1.5"/><circle cx="4" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/></svg>' },
        "CAT_BLINKBOT":         { group: "Robot",   color: "#FF6680", desc: "BlinkBot robot",         svg: '<svg viewBox="0 0 16 16" ' + _S + ' stroke-width="1.6"><rect x="3" y="5" width="10" height="8" rx="2"/><circle cx="6" cy="8.5" r="1.2" fill="white" stroke="none"/><circle cx="10" cy="8.5" r="1.2" fill="white" stroke="none"/><path d="M6 11h4M6 2h4M8 2v3"/></svg>' },
        "CAT_OTTO":             { group: "Robot",   color: "#FFAB19", desc: "Otto robot",             svg: '<svg viewBox="0 0 16 16" ' + _S + ' stroke-width="1.6"><rect x="3" y="2" width="10" height="8" rx="2"/><circle cx="6" cy="6" r="1.5" fill="white" stroke="none"/><circle cx="10" cy="6" r="1.5" fill="white" stroke="none"/><path d="M5 12v2M11 12v2M5 10v2M11 10v2"/></svg>' },
        "CAT_GROVE":            { group: "Shield",  color: "#46C286", desc: "Grove system",           svg: '<svg viewBox="0 0 16 16" ' + _S + ' stroke-width="1.6"><path d="M8 2C5 2 3 4 3 6.5c0 3.5 5 8 5 8s5-4.5 5-8C13 4 11 2 8 2z"/></svg>' },
        "CAT_SPI":              { group: "Hardware",color: "#9999FF", desc: "SPI communication",      svg: '<svg viewBox="0 0 16 16" ' + _S + ' stroke-width="1.7"><path d="M2 5h9M13 5l-2-2M13 5l-2 2"/><path d="M14 11H5M3 11l2-2M3 11l2 2"/></svg>' },
        "CAT_ESP8266":          { group: "Hardware",color: "#B4AC91", desc: "ESP8266 WiFi",           svg: '<svg viewBox="0 0 16 16" ' + _S + ' stroke-width="1.7"><path d="M8 11v3"/><path d="M5 8.5A4 4 0 0 1 8 6a4 4 0 0 1 3 2.5"/><path d="M2.5 6.5A7 7 0 0 1 8 3a7 7 0 0 1 5.5 3.5"/><circle cx="8" cy="11" r="1" fill="white" stroke="none"/></svg>' },
    };

    var i = 0, n;
    var _defaultMeta = { group: "Other", color: "#888888", desc: "Miscellaneous",
        svg: '<svg viewBox="0 0 16 16" fill="none" stroke="white" stroke-width="1.6" stroke-linecap="round"><rect x="3" y="3" width="10" height="10" rx="2"/></svg>' };

    // reset tab state
    $('.config-tab-btn').removeClass('active');
    $('.config-tab-btn[data-tab="all"]').addClass('active');
    $('#categorySearch').val('');

    // create a card for each toolbox category
    $("#toolbox").children("category").each(function () {
        var catId = $(this).attr("id");
        var label = Blockly.Msg[catId];
        if (!label) { return; }
        n = loadIds.search(catId);

        var meta = CATEGORY_METADATA[catId] || _defaultMeta;
        var isChecked = (n >= 0) ? 'checked="checked"' : '';
        var selectedClass = (n >= 0) ? 'selected' : '';

        var cardHtml =
            '<div class="category-card ' + selectedClass + '" data-group="' + meta.group + '">' +
            '<div class="card-icon" style="width:40px;height:40px;border-radius:50%;background:' + meta.color + ';display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 2px 6px rgba(0,0,0,0.2);margin-bottom:6px;">' +
            '<span style="width:20px;height:20px;display:flex;align-items:center;justify-content:center;">' + meta.svg + '</span>' +
            '</div>' +
            '<div class="card-title">' + label + '</div>' +
            '<div class="card-desc">' + meta.desc + '</div>' +
            '<input type="checkbox" ' + isChecked + ' name="checkbox_' + i + '" id="checkbox_' + catId + '"/>' +
            '</div>';

        modalbody.append(cardHtml);
        i++;
    });
};

/**
 * Change the ToolBox following the chosen configuration in the modal
 */
BlocklyDuino.changeToolbox = function () {
    // ── 1. Collect checked category IDs from the modal ───────────────────────
    var toolboxIds = [];
    $('#modal-body-config input:checkbox[id^=checkbox_]').each(function () {
        if (this.checked) {
            toolboxIds.push(this.id.replace('checkbox_', ''));
        }
    });
    var idsStr = toolboxIds.join(',');

    // ── 2. Persist selections ─────────────────────────────────────────────────
    var mode = BlocklyDuino.getBlockideMode();
    sessionStorage.setItem('toolboxids', idsStr);
    if (mode === 'advanced') {
        // Save advanced selection separately so it survives mode round-trips.
        sessionStorage.setItem('toolbox_advanced_ids', idsStr);
    }
    var toolboxFile = (mode === 'advanced') ? 'toolbox_arduino_all' : 'toolbox_beginner';
    sessionStorage.setItem('toolbox', toolboxFile);

    // ── 3. Build toolbox XML directly from the DOM category elements ──────────
    // The #toolbox DOM element always has the full set of categories for the
    // current mode (populated by openConfigToolbox / applyMode), so we can
    // look up each checked ID safely without touching the URL or reloading.
    var toolboxEl = document.getElementById('toolbox');
    var newXml = '<xml id="toolbox">';
    toolboxIds.forEach(function (id) {
        var el = id ? document.getElementById(id) : null;
        if (el && el.tagName.toLowerCase() === 'category') {
            newXml += el.outerHTML;
        }
    });
    newXml += '</xml>';

    // ── 4. Update the live Blockly workspace (no page reload needed) ──────────
    if (BlocklyDuino.workspace) {
        try {
            BlocklyDuino.workspace.updateToolbox(newXml);
        } catch (e) {
            console.warn('[changeToolbox] workspace.updateToolbox failed:', e);
        }
    }

    // ── 5. Close modal and refresh category colours ───────────────────────────
    $('#configModal').modal('hide');
    setTimeout(function () { BlocklyDuino.applyCategoryColors(); }, 200);
    setTimeout(function () { BlocklyDuino.applyCategoryColors(); }, 600);
};

/**
 * Build the xml using toolboxes checked in config modal and stored in session
 */
BlocklyDuino.buildToolbox = function () {
    // set the toolbox from url parameters
    var loadIds = BlocklyDuino.getStringParamFromUrl('toolboxids', '');
    var kitURL = BlocklyDuino.getStringParamFromUrl('card', '');

    // set the toolbox from local storage
    if (loadIds === undefined || loadIds === "") {
        loadIds = sessionStorage.getItem('toolboxids');
    }

    // set the default toolbox if none
    if (loadIds === undefined || loadIds === "" || loadIds === null || kitURL.startsWith('kit')) {
        if ($('#defaultCategories').length) {
            loadIds = $('#defaultCategories').html();
        } else {
            loadIds = '';
        }
    }

    sessionStorage.setItem('toolboxids', loadIds);

    var xmlValue = '<xml id="toolbox">';
    var xmlids = loadIds.split(",");
    for (var i = 0; i < xmlids.length; i++) {
        if ($('#' + xmlids[i]).length) {
            xmlValue += $('#' + xmlids[i])[0].outerHTML;
        }
    }

    xmlValue += '</xml>';

    return xmlValue;
};

/**
 * load the xml toolbox definition
 */
BlocklyDuino.loadToolboxDefinition = function (toolboxFile) {
    if (sessionStorage.getItem('toolbox') === 'toolbox_basic') {
        sessionStorage.setItem('toolbox', 'toolbox_beginner');
    }
    if (!toolboxFile) {
        toolboxFile = BlocklyDuino.getStringParamFromUrl('toolbox', '');
    }
    toolboxFile = BlocklyDuino.normalizeToolboxFileKey(toolboxFile);
    if (!toolboxFile) {
        toolboxFile = sessionStorage.getItem('toolbox');
    }
    toolboxFile = BlocklyDuino.normalizeToolboxFileKey(toolboxFile);
    if (!toolboxFile) {
        toolboxFile = BlocklyDuino.selectedToolbox;
    }
    toolboxFile = BlocklyDuino.normalizeToolboxFileKey(toolboxFile);
    if (BlocklyDuino.selectedToolbox === 'toolbox_basic') {
        BlocklyDuino.selectedToolbox = 'toolbox_beginner';
    }

    $("#toolboxes").val(toolboxFile);
    // update buttons levels
    $('#toolbox_algo').removeClass("active");
    $('#toolbox_arduino_1').removeClass("active");
    $('#toolbox_arduino_2').removeClass("active");
    $('#toolbox_arduino_3').removeClass("active");
    $('#toolbox_arduino_4').removeClass("active");
    $('#toolbox_arduino_all').removeClass("active");
    $('#' + toolboxFile).addClass("active");

    BlocklyDuino.toggleFunctionsChoice();
    if (sessionStorage.getItem('catblocsort') == "F") {
        toolboxFile += '_functions';
    }

    $.ajax({
        type: "GET",
        url: "./toolbox/" + toolboxFile + ".xml",
        dataType: "xml",
        async: false
    }).done(function (data) {
        var toolboxXml = '<xml id="toolbox" style="display: none">';
        toolboxXml += $(data).find('toolbox').html();
        toolboxXml += '</xml>';
        $("#toolbox").remove();
        $('body').append(toolboxXml);
        $("xml").find("category").each(function () {
            // add attribute ID to keep categorie code
            if (!$(this).attr('id')) {
                $(this).attr('id', $(this).attr('name'));
                if (Blockly.Msg[$(this).attr('name')]) {
                    $(this).attr('name', Blockly.Msg[$(this).attr('name')]);
                } else if ($(this).attr('id') === 'CAT_LOGIC' || $(this).attr('name') === 'CAT_LOGIC') {
                    // Failsafe: Ensure Logic never disappears
                    $(this).attr('name', 'Logic');
                }
            }
        });
    }).fail(function (data) {
        $("#toolbox").remove();
        console.log('toolbox file problem');
    });
};

/**
 * Change toolbox definition
 */
BlocklyDuino.changeToolboxDefinition = function () {
    BlocklyDuino.loadToolboxDefinition($("#toolboxes").val());
    BlocklyDuino.openConfigToolbox();
    // Reapply colors after toolbox change (with delays to ensure toolbox is updated)
    setTimeout(function () {
        BlocklyDuino.applyCategoryColors();
        // BlocklyDuino.hideFirstCategory();
    }, 200);
    setTimeout(function () {
        BlocklyDuino.applyCategoryColors();
        // BlocklyDuino.hideFirstCategory();
    }, 600);
};

BlocklyDuino.changeLevelToolboxDefinition = function (level) {
    BlocklyDuino.loadToolboxDefinition(level);
    BlocklyDuino.openConfigToolbox();
};

/**
 * Hide the first category in the toolbox
 * Senior dev approach: handles all edge cases including re-renders, timing, and DOM variations
 */
BlocklyDuino.hideFirstCategory = function () {
    function hideFirstCategoryItem() {
        var treeRoot = document.querySelector('.blocklyTreeRoot');
        if (!treeRoot) return;

        // Method 1: Get direct children
        var directChildren = Array.from(treeRoot.children);
        var firstCategory = null;

        // Find first non-separator category
        for (var i = 0; i < directChildren.length; i++) {
            var child = directChildren[i];

            // Check if it's a treeitem
            if (child.getAttribute('role') === 'treeitem') {
                var row = child.querySelector('.blocklyTreeRow');
                if (row && !row.classList.contains('blocklyTreeSeparator')) {
                    firstCategory = child;
                    break;
                }
            }
        }

        // Method 2: If not found, try querySelector approach
        if (!firstCategory) {
            var items = treeRoot.querySelectorAll('[role="treeitem"]');
            for (var j = 0; j < items.length; j++) {
                var item = items[j];
                // Only consider direct children
                if (item.parentElement === treeRoot) {
                    var row = item.querySelector('.blocklyTreeRow');
                    if (row && !row.classList.contains('blocklyTreeSeparator')) {
                        firstCategory = item;
                        break;
                    }
                }
            }
        }

        // Hide it visually but DON'T remove from DOM (so blocks remain accessible)
        if (firstCategory) {
            // Hide visually with CSS but keep in DOM so Blockly can still access the blocks
            firstCategory.style.cssText = 'display: none !important; visibility: hidden !important; height: 0 !important; overflow: hidden !important; margin: 0 !important; padding: 0 !important; opacity: 0 !important; pointer-events: none !important;';

            // Also hide the row inside
            var row = firstCategory.querySelector('.blocklyTreeRow');
            if (row) {
                row.style.cssText = 'display: none !important; visibility: hidden !important; height: 0 !important; width: 0 !important;';
            }

            // Add class for CSS targeting
            firstCategory.classList.add('blocklyFirstCategoryHidden');

            // IMPORTANT: Don't remove from DOM - this would break Blockly's internal references
            // The category is hidden but Blockly can still access its blocks if needed
        }
    }

    // Try IMMEDIATELY and then multiple times with increasing delays
    hideFirstCategoryItem(); // Immediate attempt
    var delays = [10, 50, 100, 200, 400, 600, 1000, 1500, 2000];
    delays.forEach(function (delay) {
        setTimeout(hideFirstCategoryItem, delay);
    });

    // Also use MutationObserver to catch when Blockly re-renders
    if (typeof MutationObserver !== 'undefined') {
        setTimeout(function () {
            var treeRoot = document.querySelector('.blocklyTreeRoot');
            if (treeRoot && !BlocklyDuino.firstCategoryObserver) {
                BlocklyDuino.firstCategoryObserver = new MutationObserver(function (mutations) {
                    // Check if any new nodes were added
                    var hasNewNodes = false;
                    for (var i = 0; i < mutations.length; i++) {
                        if (mutations[i].addedNodes.length > 0) {
                            hasNewNodes = true;
                            break;
                        }
                    }
                    if (hasNewNodes) {
                        // Small delay to let Blockly finish rendering
                        setTimeout(hideFirstCategoryItem, 50);
                    }
                });

                BlocklyDuino.firstCategoryObserver.observe(treeRoot, {
                    childList: true,
                    subtree: false, // Only watch direct children
                    attributes: false
                });
            }
        }, 200);
    }
};

/**
 * Load blocks from local file.
 */
BlocklyDuino.load = function (event) {
    var files = event.target.files;
    // Only allow uploading one file.
    if (files.length != 1) {
        return;
    }
    // FileReader
    var reader = new FileReader();
    reader.onloadend = function (event) {
        var target = event.target;
        // 2 == FileReader.DONE
        if (target.readyState == 2) {
            BlocklyDuino.loadString(target.result);
        }
        // Reset value of input after loading
        $('#load').val('');
    };
    reader.readAsText(files[0]);
};

/**
 * Load blocks from XML string
 */
BlocklyDuino.loadString = function (xmlText) {
    try {
        var xml = Blockly.Xml.textToDom(xmlText);
    } catch (e) {
        alert(MSG['xmlError'] + '\n' + e);
        return;
    }
    var count = BlocklyDuino.workspace.getAllBlocks().length;
    if (count && confirm(MSG['xmlLoad'])) {
        BlocklyDuino.workspace.clear();
    }
    $('#tab_blocks a').tab('show');
    Blockly.Xml.domToWorkspace(xml, BlocklyDuino.workspace);
    BlocklyDuino.selectedTab = 'blocks';
    BlocklyDuino.renderContent();

    // load toolbox
    var elem = xml.getElementsByTagName("toolbox")[0];
    if (elem != undefined) {
        var node = elem.childNodes[0];
        sessionStorage.setItem('toolbox', node.nodeValue);
        $("#toolboxes").val(node.nodeValue);

        // load toolbox categories
        elem = xml.getElementsByTagName("toolboxcategories")[0];
        if (elem != undefined) {
            node = elem.childNodes[0];
            sessionStorage.setItem('toolbox', node.nodeValue);
        }

        var search = BlocklyDuino.addReplaceParamToUrl(window.location.search, 'toolbox', $("#toolboxes").val());
        search = search.replace(/([?&]url=)[^&]*/, '');
        window.location = window.location.protocol + '//' +
            window.location.host + window.location.pathname +
            search;
    }
};

/**
 * Apply category colors to circular icons dynamically
 * Reads the actual category colors from Blockly's toolbox and applies them
 */
BlocklyDuino.applyCategoryColors = function () {
    // CircleToolboxCategory (registered in dist/blockide_bundle.js) now handles
    // all circle creation and layout automatically via Blockly's own rendering
    // pipeline.  This function is kept as a no-op for backward compatibility.
};

/**
 * Hide a specific category by its name (from XML id attribute or displayed label)
 * @param {string} categoryName - The category name to hide (e.g., "CAT_VARIABLES", "CAT_FUNCTIONS", or the displayed label)
 */
BlocklyDuino.hideCategoryByName = function (categoryName) {
    if (!categoryName) return;

    function hideCategoryItem() {
        var treeRoot = document.querySelector('.blocklyTreeRoot');
        if (!treeRoot) return;

        // Get all category items
        var items = treeRoot.querySelectorAll(':scope > [role="treeitem"]');
        var toolboxXml = document.getElementById('toolbox');

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var row = item.querySelector('.blocklyTreeRow');

            // Skip separators
            if (!row || row.classList.contains('blocklyTreeSeparator')) {
                continue;
            }

            // Check if this is the category we want to hide
            var shouldHide = false;

            // Method 1: Check the label text
            var label = row.querySelector('.blocklyTreeLabel');
            if (label && label.textContent) {
                // Check if label matches (case-insensitive, partial match)
                if (label.textContent.toLowerCase().includes(categoryName.toLowerCase()) ||
                    categoryName.toLowerCase().includes(label.textContent.toLowerCase())) {
                    shouldHide = true;
                }
            }

            // Method 2: Check XML id attribute by matching index
            if (!shouldHide && toolboxXml) {
                var xmlCategories = toolboxXml.querySelectorAll('category');
                var categoryIndex = 0;
                for (var xmlIdx = 0; xmlIdx < xmlCategories.length; xmlIdx++) {
                    var xmlCat = xmlCategories[xmlIdx];
                    var xmlId = xmlCat.getAttribute('id');
                    var xmlName = xmlCat.getAttribute('name');

                    // Skip separators in XML
                    if (xmlCat.tagName === 'sep') continue;

                    // Check if this XML category matches
                    if ((xmlId && xmlId === categoryName) ||
                        (xmlName && xmlName === categoryName)) {
                        // Find the corresponding DOM item by index
                        var domIndex = 0;
                        for (var j = 0; j < items.length; j++) {
                            var domItem = items[j];
                            var domRow = domItem.querySelector('.blocklyTreeRow');
                            if (domRow && !domRow.classList.contains('blocklyTreeSeparator')) {
                                if (domIndex === categoryIndex) {
                                    if (domItem === item) {
                                        shouldHide = true;
                                    }
                                    break;
                                }
                                domIndex++;
                            }
                        }
                    }

                    if (xmlCat.tagName !== 'sep') {
                        categoryIndex++;
                    }
                }
            }

            // Hide the category if it matches
            if (shouldHide) {
                item.style.setProperty('display', 'none', 'important');
                item.style.setProperty('visibility', 'hidden', 'important');
                item.style.setProperty('height', '0', 'important');
                item.style.setProperty('overflow', 'hidden', 'important');
                item.style.setProperty('margin', '0', 'important');
                item.style.setProperty('padding', '0', 'important');
                item.style.setProperty('opacity', '0', 'important');
                item.style.setProperty('pointer-events', 'none', 'important');
                item.classList.add('blocklyCategoryHidden');

                // Also hide the row inside
                if (row) {
                    row.style.setProperty('display', 'none', 'important');
                    row.style.setProperty('visibility', 'hidden', 'important');
                    row.style.setProperty('height', '0', 'important');
                }
            }
        }
    }

    // Try immediately and then with delays
    hideCategoryItem();
    var delays = [10, 50, 100, 200, 400, 600, 1000, 1500, 2000];
    delays.forEach(function (delay) {
        setTimeout(hideCategoryItem, delay);
    });

    // Use MutationObserver to re-hide if Blockly re-renders
    if (typeof MutationObserver !== 'undefined') {
        setTimeout(function () {
            var treeRoot = document.querySelector('.blocklyTreeRoot');
            if (treeRoot && !BlocklyDuino.categoryHideObserver) {
                BlocklyDuino.categoryHideObserver = new MutationObserver(function (mutations) {
                    var hasRelevantChange = false;
                    for (var i = 0; i < mutations.length; i++) {
                        if (mutations[i].addedNodes.length > 0 ||
                            (mutations[i].type === 'attributes' &&
                                (mutations[i].attributeName === 'style' || mutations[i].attributeName === 'class'))) {
                            hasRelevantChange = true;
                            break;
                        }
                    }
                    if (hasRelevantChange) {
                        hideCategoryItem(); // Re-hide if DOM changes
                    }
                });
                BlocklyDuino.categoryHideObserver.observe(treeRoot, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    attributeFilter: ['style', 'class']
                });
            }
        }, 500);
    }
};



/**
 * Initialize Blockly.  Called on page load.
 */
BlocklyDuino.init = function () {
    // Set default language to English
    Code.LANG = 'en';

    // Set default font to Trebuchet MS
    document.body.style.fontFamily = "Trebuchet MS";

    BlocklyDuino.setOrientation();
    BlocklyDuino.testAjax();

    if ($('#toolbox').length) {
        BlocklyDuino.toolboxInIndexHtml = true;
    }

    if (!BlocklyDuino.toolboxInIndexHtml && BlocklyDuino.ajaxOK) {
        BlocklyDuino.loadToolboxDefinition();
    }

    Code.initLanguage();

    // Set maximized view as default
    $("#menuPanel").css({ "display": "none" });
    // maximize div
    $("#divTabpanel").css({ "margin-left": "0px" });
    $('#btn_size').attr("title", MSG['btn_size_min']);
    $('#divTitre').addClass("hidden");
    $('#div_toolboxes').addClass("hidden");
    $('#divTitreMenu').removeClass("hidden");
    $('#icon_btn_size').removeClass('glyphicon-resize-full');
    $('#icon_btn_size').addClass('glyphicon-resize-small');
    $('#div_toolboxes').prepend($('#toolboxes'));

    BlocklyDuino.setArduinoBoard();

    // build Blockly ...
    // Safely select a theme: prefer Modern when available, otherwise fall back.
    // This is written to be compatible with both old and new Blockly builds.
    var selectedTheme = undefined;
    try {
        if (Blockly.Themes) {
            if (Blockly.Themes.Modern) {
                selectedTheme = Blockly.Themes.Modern;
            } else if (Blockly.Themes.Classic) {
                selectedTheme = Blockly.Themes.Classic;
            }
        }
        if (selectedTheme && Blockly.Theme && typeof Blockly.Theme.defineTheme === 'function') {
            selectedTheme = Blockly.Theme.defineTheme('blockide_poppins', {
                base: selectedTheme,
                fontStyle: {
                    family: 'Poppins, "Segoe UI", Arial, sans-serif',
                    weight: '500',
                    size: 11,
                },
            });
        }
    } catch (e) {
        // If anything goes wrong while resolving the theme, just fall back
        // to Blockly's default behavior without a custom theme.
        selectedTheme = undefined;
    }

    BlocklyDuino.workspace = Blockly.inject('content_blocks', {
        grid: {
            spacing: 25,
            length: 3,
            colour: '#ccc',
            snap: true
        },
        renderer: 'zelos',
        sounds: false,
        media: 'media/',
        rtl: false,
        toolbox: BlocklyDuino.buildToolbox(),
        zoom: {
            controls: true,
            wheel: true,
            startScale: 0.9,
            maxScale: 3,
            minScale: 0.3,
            scaleSpeed: 1.2
        },
        move: {
            scrollbars: true,
            drag: true,
            wheel: false
        },
        trashcan: true,
        theme: selectedTheme
    });

    // ── Electron-safe dialog overrides ───────────────────────────────────────
    // window.prompt / window.alert / window.confirm are silently blocked in
    // Electron's renderer process. Override Blockly's dialog layer so variable
    // creation, renaming, and deletion work correctly.
    (function registerElectronDialogs() {
        // Shared modal factory -------------------------------------------------
        function makeModal(content) {
            var overlay = document.createElement('div');
            overlay.style.cssText = [
                'position:fixed;top:0;left:0;width:100%;height:100%;',
                'background:rgba(0,0,0,0.45);z-index:99999;',
                'display:flex;align-items:center;justify-content:center;',
            ].join('');
            var box = document.createElement('div');
            box.style.cssText = [
                'background:#fff;border-radius:10px;padding:24px 28px;',
                'min-width:320px;max-width:440px;width:90%;',
                'box-shadow:0 12px 40px rgba(0,0,0,0.28);',
                'font-family:inherit;',
            ].join('');
            box.appendChild(content);
            overlay.appendChild(box);
            document.body.appendChild(overlay);
            return overlay;
        }

        function makeButton(text, primary) {
            var btn = document.createElement('button');
            btn.textContent = text;
            btn.style.cssText = primary
                ? 'padding:8px 20px;border:none;background:#990099;color:#fff;border-radius:6px;cursor:pointer;font-size:13px;font-weight:700;'
                : 'padding:8px 20px;border:1px solid #ccc;background:#fff;color:#333;border-radius:6px;cursor:pointer;font-size:13px;';
            return btn;
        }

        // Prompt (used for "New variable", "Rename variable") -----------------
        if (Blockly.dialog && typeof Blockly.dialog.setPrompt === 'function') {
            Blockly.dialog.setPrompt(function(message, defaultValue, callback) {
                var frag = document.createDocumentFragment();

                var label = document.createElement('p');
                label.style.cssText = 'margin:0 0 14px;font-size:14px;font-weight:600;color:#222;line-height:1.4;';
                label.textContent = message;

                var input = document.createElement('input');
                input.type = 'text';
                input.value = defaultValue || '';
                input.style.cssText = [
                    'width:100%;box-sizing:border-box;',
                    'padding:9px 12px;border:1.5px solid #ccc;border-radius:7px;',
                    'font-size:14px;outline:none;margin-bottom:18px;',
                    'transition:border-color 0.15s;',
                ].join('');
                input.addEventListener('focus', function() { input.style.borderColor = '#990099'; });
                input.addEventListener('blur',  function() { input.style.borderColor = '#ccc'; });

                var btnRow = document.createElement('div');
                btnRow.style.cssText = 'display:flex;justify-content:flex-end;gap:10px;';

                var cancelBtn = makeButton('Cancel', false);
                var okBtn     = makeButton('OK',     true);

                frag.appendChild(label);
                frag.appendChild(input);
                btnRow.appendChild(cancelBtn);
                btnRow.appendChild(okBtn);
                frag.appendChild(btnRow);

                var overlay = makeModal(frag);

                function confirm() {
                    document.body.removeChild(overlay);
                    var val = input.value.trim();
                    callback(val.length ? val : null);
                }
                function cancel() {
                    document.body.removeChild(overlay);
                    callback(null);
                }

                okBtn.addEventListener('click', confirm);
                cancelBtn.addEventListener('click', cancel);
                input.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter')  confirm();
                    if (e.key === 'Escape') cancel();
                });

                // Focus after paint
                setTimeout(function() { input.focus(); input.select(); }, 60);
            });
        }

        // Alert (used for duplicate variable name warnings) -------------------
        if (Blockly.dialog && typeof Blockly.dialog.setAlert === 'function') {
            Blockly.dialog.setAlert(function(message, callback) {
                var frag = document.createDocumentFragment();

                var label = document.createElement('p');
                label.style.cssText = 'margin:0 0 20px;font-size:14px;color:#222;line-height:1.5;';
                label.textContent = message;

                var btnRow = document.createElement('div');
                btnRow.style.cssText = 'display:flex;justify-content:flex-end;';
                var okBtn = makeButton('OK', true);

                btnRow.appendChild(okBtn);
                frag.appendChild(label);
                frag.appendChild(btnRow);

                var overlay = makeModal(frag);

                function close() {
                    document.body.removeChild(overlay);
                    if (typeof callback === 'function') callback();
                }
                okBtn.addEventListener('click', close);
                document.addEventListener('keydown', function handler(e) {
                    if (e.key === 'Enter' || e.key === 'Escape') {
                        document.removeEventListener('keydown', handler);
                        close();
                    }
                });
            });
        }

        // Confirm (used for "Delete variable?" confirmation) ------------------
        if (Blockly.dialog && typeof Blockly.dialog.setConfirm === 'function') {
            Blockly.dialog.setConfirm(function(message, callback) {
                var frag = document.createDocumentFragment();

                var label = document.createElement('p');
                label.style.cssText = 'margin:0 0 20px;font-size:14px;color:#222;line-height:1.5;';
                label.textContent = message;

                var btnRow = document.createElement('div');
                btnRow.style.cssText = 'display:flex;justify-content:flex-end;gap:10px;';

                var cancelBtn = makeButton('Cancel', false);
                var deleteBtn = makeButton('Delete', true);
                deleteBtn.style.background = '#E74C3C';

                btnRow.appendChild(cancelBtn);
                btnRow.appendChild(deleteBtn);
                frag.appendChild(label);
                frag.appendChild(btnRow);

                var overlay = makeModal(frag);

                function done(result) {
                    document.body.removeChild(overlay);
                    callback(result);
                }
                deleteBtn.addEventListener('click', function() { done(true); });
                cancelBtn.addEventListener('click', function() { done(false); });
                document.addEventListener('keydown', function handler(e) {
                    if (e.key === 'Escape') {
                        document.removeEventListener('keydown', handler);
                        done(false);
                    }
                });
            });
        }
    })();

    // ── Add typed variable blocks to Variables flyout ──────────────────────────
    // Flyout is built by callback registered under key 'VARIABLE' (toolbox uses custom="VARIABLE").
    // We wrap the default v12 callback and inject declaration/init blocks after
    // the "Create variable" button.
    (function addTypedVariableBlockToFlyout() {
        var ws = BlocklyDuino.workspace;
        if (!ws || typeof ws.getToolboxCategoryCallback !== 'function') return;
        var defaultVarCallback = ws.getToolboxCategoryCallback('VARIABLE');
        if (!defaultVarCallback || (!Blockly.Blocks['variables_set_init'] && !Blockly.Blocks['variables_declare_typed'])) return;
        ws.registerToolboxCategoryCallback('VARIABLE', function (targetWorkspace) {
            var list;
            try {
                list = defaultVarCallback(targetWorkspace);
            } catch (e) {
                console.warn('[BlocklyDuino] Variables flyout default callback failed:', e);
                return [];
            }
            if (!Array.isArray(list) || list.length === 0) return list;
            // Blockly v12 flyout expects each item to have a "kind" property (e.g. "button", "block").
            // DOM elements have no .kind and cause createFlyoutInfo to throw on d.kind.toLowerCase().
            var declareItem = { kind: 'block', type: 'variables_declare_typed', gap: 24 };
            var initItem = { kind: 'block', type: 'variables_set_init', gap: 24 };
            var varMap = targetWorkspace.getVariableMap && targetWorkspace.getVariableMap();
            var vars = varMap && varMap.getVariablesOfType && varMap.getVariablesOfType('');
            if (vars && vars.length > 0) {
                var lastVar = vars[vars.length - 1];
                var varField = { name: lastVar.getName(), type: lastVar.getType() };
                if (typeof lastVar.getId === 'function') varField.id = lastVar.getId();
                declareItem.fields = { VAR: varField };
                initItem.fields = { VAR: varField };
            }
            if (Blockly.Blocks['variables_set_init']) {
                list.splice(1, 0, initItem);
            }
            if (Blockly.Blocks['variables_declare_typed']) {
                list.splice(1, 0, declareItem);
            }
            return list;
        });
    })();

    // Inject toolbox circle styles AFTER Blockly.inject() so they beat Blockly's own <style> tag
    (function injectToolboxStyles() {
        if (document.getElementById('blockide-toolbox-overrides')) return;
        var s = document.createElement('style');
        s.id = 'blockide-toolbox-overrides';
        s.textContent = [
            '.blocklyToolboxDiv {',
            '  background-color: #ebebeb !important;',
            '  border-right: 1px solid #d4d4d4 !important;',
            '  box-shadow: 2px 0 8px rgba(0,0,0,0.09) !important;',
            '  min-width: 126px !important;',
            '  width: 126px !important;',
            '  overflow-y: auto !important;',
            '  overflow-x: hidden !important;',
            '}',
            '.blocklyToolboxDiv::-webkit-scrollbar { width: 3px; }',
            '.blocklyToolboxDiv::-webkit-scrollbar-track { background: transparent; }',
            '.blocklyToolboxDiv::-webkit-scrollbar-thumb { background-color: rgba(0,0,0,0.18); border-radius: 4px; }',
            '.blocklyToolboxContents { padding: 4px 0 50px !important; }',
            /* Section separator labels */
            '.blockide-separator {',
            '  padding: 9px 11px 3px !important;',
            '  font-size: 8px !important;',
            '  font-weight: 700 !important;',
            '  letter-spacing: 1.2px !important;',
            '  text-transform: uppercase !important;',
            '  color: #aaa !important;',
            '  font-family: Poppins,"Segoe UI",Arial,sans-serif !important;',
            '  user-select: none !important;',
            '  pointer-events: none !important;',
            '  border-top: 1px solid #e0e0e0 !important;',
            '  margin-top: 4px !important;',
            '}',
            '.blockide-separator:first-child { border-top: none !important; margin-top: 0 !important; }',
            /* hover: subtle grey tint */
            '.blocklyTreeRow:hover { background-color: rgba(0,0,0,0.07) !important; }',
            /* hover: scale circle up slightly */
            '.blocklyTreeRow:hover .blockide-circle { transform: scale(1.12) !important; }',
            /* selected row — same colour as the flyout background */
            '.blocklyTreeSelected > .blocklyTreeRow,',
            '.blocklyTreeRow.blocklyTreeSelected {',
            '  background-color: #f9f9f9 !important;',
            '}',
            /* selected: pop circle */
            '.blocklyTreeSelected > .blocklyTreeRow .blockide-circle,',
            '.blocklyTreeRow.blocklyTreeSelected .blockide-circle {',
            '  transform: scale(1.10) !important;',
            '  box-shadow: 0 3px 8px rgba(0,0,0,0.28) !important;',
            '}',
            '.blocklyTreeSeparator { height: 1px !important; background-color: #d4d4d4 !important; margin: 2px 10px !important; border: none !important; }',
            '.blocklyFlyoutBackground { fill: #f9f9f9 !important; fill-opacity: 1 !important; }'
        ].join('\n');
        document.head.appendChild(s);
    })();

    // bind events to html elements
    BlocklyDuino.bindFunctions();

    // ── Restore Beginner / Advanced mode from localStorage ───────────────────
    BlocklyDuino.applyMode(BlocklyDuino.getBlockideMode());

    // Apply category colors after workspace is created
    BlocklyDuino.applyCategoryColors();

    if (typeof window.AIAssistant !== 'undefined' && window.AIAssistant.init) {
        try { window.AIAssistant.init(); } catch (e) { console.warn('[AI Assistant] init failed:', e); }
    }

    // ── Section separators ────────────────────────────────────────────────────
    // Groups: "CODE" before Logic, "HARDWARE" before Arduino
    var SEPARATOR_BEFORE = {
        'Logic':   'Code',
        'Arduino': 'Hardware',
    };

    BlocklyDuino.injectSectionSeparators = function () {
        var contents = document.querySelector('.blocklyToolboxContents');
        if (!contents) return;

        // Remove existing separators first (safe to re-run)
        contents.querySelectorAll('.blockide-separator').forEach(function (el) {
            el.parentNode.removeChild(el);
        });

        // Walk direct children looking for category rows
        Array.from(contents.children).forEach(function (child) {
            var label = child.querySelector('.blockide-label');
            if (!label) return;
            var name = label.textContent.trim();
            var secName = SEPARATOR_BEFORE[name];
            if (!secName) return;

            var sep = document.createElement('div');
            sep.className = 'blockide-separator';
            sep.textContent = secName;
            contents.insertBefore(sep, child);
        });
    };
    BlocklyDuino.injectSectionSeparators();

    // ── "Add Blocks" button — pinned to bottom of toolbox via flex layout ────
    // Strategy: move the button into .blocklyToolboxDiv as a direct sibling of
    // .blocklyToolboxContents, then make the toolbox a flex column via JS inline
    // styles (highest specificity — beats Blockly's own inline style writes for
    // display/flex since Blockly never touches those properties on the toolbox div).
    // .blocklyToolboxContents gets flex:1 + overflow-y:auto so it scrolls freely
    // while the button stays pinned at the bottom with no width-sync needed.

    BlocklyDuino._applyingToolboxLayout = false;

    BlocklyDuino.setupToolboxLayout = function () {
        if (BlocklyDuino._applyingToolboxLayout) return;
        var toolboxDiv = document.querySelector('.blocklyToolboxDiv');
        var btn        = document.getElementById('btn_advanced_toggle');
        if (!toolboxDiv || !btn) return;

        BlocklyDuino._applyingToolboxLayout = true;
        try {
            // Force toolbox width via inline style (beats Blockly's inline style)
            toolboxDiv.style.width    = '126px';
            toolboxDiv.style.minWidth = '126px';

            // Sync fixed-position button to exact toolbox dimensions
            var rect = toolboxDiv.getBoundingClientRect();
            btn.style.position = 'fixed';
            btn.style.left     = rect.left   + 'px';
            btn.style.bottom   = '0';
            btn.style.width    = rect.width  + 'px';
            btn.style.zIndex   = '1000';
        } finally {
            BlocklyDuino._applyingToolboxLayout = false;
        }
    };

    // Debounced scheduler — coalesces rapid calls (e.g. from MutationObserver)
    BlocklyDuino._scheduleLayout = function () {
        if (BlocklyDuino._layoutRafId) return;
        BlocklyDuino._layoutRafId = requestAnimationFrame(function () {
            BlocklyDuino._layoutRafId = null;
            BlocklyDuino.setupToolboxLayout();
        });
    };

    // Keep alias so old call-sites still work
    BlocklyDuino.fitToolboxForButton  = BlocklyDuino.setupToolboxLayout;
    BlocklyDuino.attachAdvancedButton = BlocklyDuino._scheduleLayout;

    // Patch Blockly.svgResize — Blockly resets toolbox height here; re-apply flex
    if (typeof Blockly !== 'undefined' && Blockly.svgResize) {
        var _origSvgResize = Blockly.svgResize;
        Blockly.svgResize = function () {
            _origSvgResize.apply(this, arguments);
            BlocklyDuino._scheduleLayout();
        };
    }

    window.addEventListener('resize', BlocklyDuino._scheduleLayout);

    // Watch parent of .blocklyToolboxDiv so if Blockly replaces the whole
    // toolbox element we detect it and re-apply layout on the new node.
    (function watchToolbox() {
        var toolboxDiv = document.querySelector('.blocklyToolboxDiv');
        if (!toolboxDiv) { setTimeout(watchToolbox, 200); return; }

        // Watch the toolbox's own style attribute
        var styleObs = new MutationObserver(function () {
            if (!BlocklyDuino._applyingToolboxLayout) BlocklyDuino._scheduleLayout();
        });
        styleObs.observe(toolboxDiv, { attributes: true, attributeFilter: ['style'] });

        // Watch the parent for toolbox replacement
        var parent = toolboxDiv.parentNode;
        if (parent) {
            var parentObs = new MutationObserver(function (mutations) {
                mutations.forEach(function (m) {
                    m.addedNodes.forEach(function (n) {
                        if (n.classList && n.classList.contains('blocklyToolboxDiv')) {
                            // Toolbox was replaced — re-run layout on next frame
                            BlocklyDuino._scheduleLayout();
                            // Re-attach observers to the new node
                            watchToolbox();
                        }
                    });
                });
            });
            parentObs.observe(parent, { childList: true });
        }
    })();

    // Belt-and-suspenders: poll for the first 3 s to survive any late renders
    (function pollLayout(n) {
        BlocklyDuino._scheduleLayout();
        if (n > 0) setTimeout(function () { pollLayout(n - 1); }, 150);
    })(20);

    // Replace first category with search bar
    BlocklyDuino.hideFirstCategory();

    // Variables category (CAT_VARIABLES) is left visible; its flyout is built by
    // the registered 'VARIABLE' callback and must not be hidden.

    // Also watch for toolbox changes using MutationObserver
    if (typeof MutationObserver !== 'undefined') {
        setTimeout(function () {
            var toolboxDiv = document.querySelector('.blocklyToolboxDiv');
            if (toolboxDiv) {
                var observer = new MutationObserver(function (mutations) {
                    // Debounce toolbox updates to prevent lag
                    if (BlocklyDuino.toolboxUpdateTimeout) {
                        clearTimeout(BlocklyDuino.toolboxUpdateTimeout);
                    }
                    BlocklyDuino.toolboxUpdateTimeout = setTimeout(function () {
                        BlocklyDuino.applyCategoryColors();
                        BlocklyDuino.hideFirstCategory();
                        // Do not hide CAT_VARIABLES — Variables flyout is dynamic and must stay visible.
                        // Re-inject separators after toolbox re-render
                        if (BlocklyDuino.injectSectionSeparators) {
                            BlocklyDuino.injectSectionSeparators();
                        }
                        // Re-sync button position/size after toolbox re-render
                        if (BlocklyDuino.fitToolboxForButton) {
                            BlocklyDuino.fitToolboxForButton();
                        }
                    }, 100);
                });
                observer.observe(toolboxDiv, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    attributeFilter: ['style']
                });
                BlocklyDuino.toolboxObserver = observer;
            }
        }, 500);
    }

    BlocklyDuino.renderContent();

    // Add unified change listener for performance (filtered & debounced)
    if (BlocklyDuino.workspace && BlocklyDuino.workspace.addChangeListener && !BlocklyDuino.workspace._hasOnWorkspaceChange) {
        BlocklyDuino.workspace.addChangeListener(BlocklyDuino.onWorkspaceChange);
        BlocklyDuino.workspace._hasOnWorkspaceChange = true;
    }

    // Trigger initial code preview
    BlocklyDuino.renderArduinoCodePreview();


    // load blocks stored in session or passed by url
    var urlFile = BlocklyDuino.getStringParamFromUrl('url', '');
    var loadOnce = null;
    try {
        loadOnce = sessionStorage.getItem('loadOnceBlocks');
    } catch (e) {
        // Firefox sometimes throws a SecurityError when accessing
        // localStorage.
        // Restarting Firefox fixes this, so it looks like a bug.
    }
    if (urlFile) {
        if (loadOnce != null) {
            if (!confirm(MSG['xmlLoad'])) {
                BlocklyDuino.loadBlocks();
            }
        }
        $.get(urlFile, function (data) {
            BlocklyDuino.loadBlocks(data);
        }, 'text');
    } else {
        BlocklyDuino.loadBlocks();
    }

    // Hook a save function onto unload.
    window.addEventListener('unload', BlocklyDuino.backupBlocks, false);

    //global config
    BlocklyDuino.initBlocSort();

    // Apply category colors to circular icons
    BlocklyDuino.applyCategoryColors();

    /*pour changer couleur texte dans toolbox */
    //    $("div:contains('bitbloq').blocklyTreeRow, div:contains('bitbloq').blocklyTreeRow ~ div").on("click", function() {
    //        $(this).removeClass("blocklyTreeSelected")
    //        $(this).find("span").removeClass("blocklyTreeIconNone")
    //        $(this).find("span").addClass('blocklyTreeIcon fa fa-cloud');
    //    });

    if (window.location.protocol == 'http:') {
        $("#btn_create_example, #menu_132").attr("href", "./examples/examples.php?lang=" + Code.LANG);
    } else {
        $("#btn_create_example, #menu_132").attr("href", "./examples/examples.html?lang=" + Code.LANG);
    }

    BlocklyDuino.OnOffLine();
    BlocklyDuino.ExampleWiring();
};

/**
 * Create content for modal example
 */
BlocklyDuino.buildExamples = function () {
    var search = window.location.search;
    // remove values from url
    search = search.replace(/([?&]url=)[^&]*/, '');

    $.ajax({
        cache: false,
        url: "./examples/examples.json",
        dataType: "json",
        success: function (data) {
            $("#includedContent").empty();
            $.each(data, function (i, example) {
                if (example.visible) {
                    var line = "<tr>" +
                        "<td><a href='" + search + "&url=./examples/" + example.source_url + "'>" +
                        example.source_text +
                        "</a></td>" +
                        "<td>" +
                        "<a href='./examples/" + example.image + "' target=_blank>" +
                        "<img class='vignette' src='./examples/" + example.image + "'>" +
                        "</a>" +
                        "</td>" +
                        "<td>" +
                        "<a href='./examples/" + example.link_url + "' target=_blank>" +
                        example.link_text +
                        "</a>" +
                        "</td>" +
                        "</tr>";

                    $("#includedContent").append(line);
                }
            });
        }
    });
};


/**
 * Test ajax request 
 */
BlocklyDuino.testAjax = function () {
    $.ajax({
        type: "GET",
        url: "./index.html",
        dataType: 'text',
        error: function () {
            if (window.sessionStorage && !sessionStorage.getItem('msg_ajax_seen')) {
                $('#ajaxModal').modal('show');
            }
            BlocklyDuino.ajaxOK = false;
        }
    });
};

/**
 * Override Blockly method (/Blockly/core/variable.js)
 * To add the block "variables_set_type"
 * 
 * Construct the blocks required by the flyout for the variable category.
 * @param {!Blockly.Workspace} workspace The workspace containing variables.
 * @return {!Array.<!Element>} Array of XML block elements.
 *
 * NOTE: In Blockly v12 the toolbox does NOT call this. The flyout is built by
 * the callback registered with workspace.registerToolboxCategoryCallback('VARIABLE', ...)
 * at inject time (internalFlyoutCategory). This stub exists so any legacy code
 * that calls Blockly.Variables.flyoutCategory(workspace) does not crash on
 * workspace.variableList (v12 has no variableList) or Blockly.registerButtonCallback
 * (removed in v12). Returning [] is safe.
 */
Blockly.Variables.flyoutCategory = function (workspace) {
    return [];
};
/*
BlocklyDuino.openWiringDialog = function() {
    var iframe = $("#wiring_dialog > iframe");
    var dialog = $("#wiring_dialog").dialog({
        autoOpen: false,
        resizable: true,
        height: 600,
        width: 800,
        show: {
            effect: "slide",
            duration: 1000
          },
        hide: {
            effect: "drop",
            duration: 1000
          }
    });
    iframe.attr({
        width: "100%",
        height: "100%",
        src: "https://fr.robom.ru"
    });
    if (!dialog.dialog("isOpen")) {
        dialog.dialog("open");
    }
};*/

BlocklyDuino.DialogCode = function () {
    var dialogCode = $("#pre_previewArduino").dialog({
        autoOpen: false,
        resizable: true,
        height: 600,
        width: 400,
        show: {
            effect: "drop",
            duration: 1000
        },
        hide: {
            effect: "drop",
            duration: 1000
        },
        position: {
            my: "right top",
            at: "right top",
            of: "#content_blocks"
        },
        buttons: [{
            text: "copy-paste",
            icon: {
                primary: "btn btn_ver btn-danger btn-block"
            },
            click: BlocklyDuino.ArduinoIDEClick_IDE,
        },
        {
            text: 'save',
            icons: {
                primary: "ui-icon-cancel"
            },
            click: BlocklyDuino.saveArduinoFile_IDE,
        },
        {
            text: 'upload',
            icons: {
                primary: "ui-icon-cancel"
            },
            click: BlocklyDuino.uploadClick_IDE,
        }
        ]
    });
    if (!dialogCode.dialog("isOpen")) {
        dialogCode.dialog("open").dialog("option", "buttons");
    };
};

BlocklyDuino.DialogCode_edit = function () {
    $('#edit_code').val($('#pre_previewArduino').text());
    if (typeof prettyPrintOne == 'function') {
        $('#edit_code').html(prettyPrintOne($('#edit_code').html(), 'cpp'));
    }
    //$('#pre_previewArduino').addClass('hidden');

}

/*
 *  Store the blocks for the duration of the reload.
 */
BlocklyDuino.backupBlocks = function () {
    if (typeof Blockly != 'undefined' && sessionStorage) {
        var xml = Blockly.Xml.workspaceToDom(BlocklyDuino.workspace);
        var text = Blockly.Xml.domToText(xml);
        sessionStorage.setItem('loadOnceBlocks', text);
    }
};

/**
 * Load default Arduino structure blocks (void setup and void loop)
 * when the workspace is empty. This function is protected by a lock
 * to prevent race conditions.
 */
BlocklyDuino.loadDefaultArduinoBlocks = function () {
    // 1. Check lock to prevent this from running multiple times
    if (BlocklyDuino.loadingDefaultBlocks) {
        return;
    }
    // NEW GUARD: Prevent duplicate base_setup_loop blocks
    if (
        BlocklyDuino.workspace &&
        BlocklyDuino.workspace.getAllBlocks(false).some(
            function (block) { return block.type === 'base_setup_loop'; }
        )
    ) {
        return;
    }
    // Set lock IMMEDIATELY to prevent race conditions
    BlocklyDuino.loadingDefaultBlocks = true;
    setTimeout(function () {
        // 4. Final check: only load if the workspace is still empty
        if (BlocklyDuino.workspace && BlocklyDuino.workspace.getAllBlocks(false).length === 0) {

            // Check if block type is available
            if (!Blockly.Blocks['base_setup_loop']) {
                console.error('Arduino base_setup_loop block not available.');
                BlocklyDuino.loadingDefaultBlocks = false; // Release lock
                return;
            }

            console.log('Loading default Arduino blocks...');

            // Get workspace dimensions to center the blocks
            var metrics = BlocklyDuino.workspace.getMetrics();
            var centerX = Math.max(100, metrics.viewWidth / 2 - 100);
            var centerY = Math.max(100, metrics.viewHeight / 2 - 100);

            // XML-first approach with a manual creation fallback
            var success = false;
            try {
                var defaultXml = '<xml xmlns="https://developers.google.com/blockly/xml">' +
                    '<block type="base_setup_loop" x="' + centerX + '" y="' + centerY + '"></block>' +
                    '</xml>';
                var xml = Blockly.Xml.textToDom(defaultXml);
                var blockCount = Blockly.Xml.domToWorkspace(xml, BlocklyDuino.workspace);
                success = blockCount > 0;
            } catch (e) {
                console.error('XML block creation failed, trying manual approach.', e);
            }

            if (!success) {
                try {
                    var setupLoopBlock = BlocklyDuino.workspace.newBlock('base_setup_loop');
                    setupLoopBlock.moveBy(centerX, centerY);
                    setupLoopBlock.initSvg();
                    setupLoopBlock.render();
                    success = true;
                } catch (e) {
                    console.error('Manual block creation failed.', e);
                }
            }

            if (success) {
                BlocklyDuino.workspace.render();
                // Remove duplicate base_setup_loop blocks if any exist
                var setupLoopBlocks = BlocklyDuino.workspace.getAllBlocks(false).filter(function (block) {
                    return block.type === 'base_setup_loop';
                });
                if (setupLoopBlocks.length > 1) {
                    // Keep the first, remove the rest
                    for (var i = 1; i < setupLoopBlocks.length; i++) {
                        setupLoopBlocks[i].dispose(false, true);
                    }
                }
                // Center the view on the new block
                setTimeout(function () {
                    var topBlocks = BlocklyDuino.workspace.getTopBlocks(false);
                    if (topBlocks.length > 0) {
                        try {
                            // Use modern Blockly API - centerOnBlock was removed in v9+
                            if (typeof BlocklyDuino.workspace.centerOnBlock === 'function') {
                                BlocklyDuino.workspace.centerOnBlock(topBlocks[0].id);
                            } else if (typeof BlocklyDuino.workspace.centerOnBlockById === 'function') {
                                BlocklyDuino.workspace.centerOnBlockById(topBlocks[0].id);
                            } else {
                                // Fallback: scroll to block position
                                var block = topBlocks[0];
                                var xy = block.getRelativeToSurfaceXY();
                                BlocklyDuino.workspace.scroll(xy.x - BlocklyDuino.workspace.getMetrics().viewWidth / 2,
                                    xy.y - BlocklyDuino.workspace.getMetrics().viewHeight / 2);
                            }
                        } catch (e) {
                            // Silently ignore - block may already be visible
                        }
                    }
                }, 50);
                if (typeof BlocklyDuino.renderContent === 'function') {
                    BlocklyDuino.renderContent();
                }
            }
        }
        // 5. Release the lock once the operation is complete
        BlocklyDuino.loadingDefaultBlocks = false;
    }, 200);
};