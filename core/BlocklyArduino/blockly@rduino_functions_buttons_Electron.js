/**
 * Blockly@rduino
 */

'use strict';

/** Same-origin '' when IDE is served over http(s) with the API; file:// → localhost:5005; override BLOCKIDE_BACKEND_URL if API is elsewhere. */
BlocklyDuino.getBackendBaseUrl = function () {
    if (typeof window !== 'undefined' && typeof window.blockideResolveBackendBaseUrl === 'function') {
        return window.blockideResolveBackendBaseUrl();
    }
    if (typeof window !== 'undefined' && window.BLOCKIDE_BACKEND_URL) {
        var u = String(window.BLOCKIDE_BACKEND_URL).trim();
        if (u) return u.replace(/\/+$/, '');
    }
    try {
        if (typeof window !== 'undefined' && window.location && window.location.protocol === 'file:') {
            return 'http://localhost:5005';
        }
    } catch (e) { /* ignore */ }
    return '';
};

/** Sent with /compile and /upload for server audit (user label + requestId). */
BlocklyDuino.auditRequestFields = function () {
    var o = {};
    var u = '';
    try {
        if (typeof window !== 'undefined' && window.BLOCKIDE_USER) {
            u = String(window.BLOCKIDE_USER).trim();
        }
        if (!u) {
            u = (sessionStorage.getItem('blockide_user') || localStorage.getItem('blockide_user') || '').trim();
        }
    } catch (e) { /* ignore */ }
    if (u) o.user = u.slice(0, 256);
    try {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            o.requestId = crypto.randomUUID();
        } else {
            o.requestId = 'r-' + Date.now() + '-' + Math.floor(Math.random() * 1e9);
        }
    } catch (e2) {
        o.requestId = 'r-' + Date.now();
    }
    return o;
};

BlocklyDuino.getSketchSourceForCompile = function () {
    var raw = $('#pre_previewArduino').data('rawCode');
    if (raw && String(raw).length) return String(raw);
    var t = $('#pre_previewArduino').text();
    if (t && t.trim().length) return t;
    t = $('#pre_arduino').text();
    if (t && t.trim().length) return t;
    if (typeof BlocklyDuino.workspaceToCode === 'function' && Blockly.getMainWorkspace()) {
        try {
            return BlocklyDuino.workspaceToCode(Blockly.getMainWorkspace());
        } catch (e) { /* ignore */ }
    }
    return '';
};

/**
 * Populate the edit textarea "edit_code" with the pre arduino code
 */
BlocklyDuino.editArduinoCode = function () {
    $('#edit_code').val($('#pre_arduino').text());
};

/**
 * Creates an XML file containing the blocks from the Blockly workspace and
 * prompts the users to save it into their local file system.
 */
BlocklyDuino.saveXmlFile = function () {
    var ws = Blockly.getMainWorkspace ? Blockly.getMainWorkspace() : Blockly.mainWorkspace;
    var xml = Blockly.Xml.workspaceToDom(ws);

    var toolbox = sessionStorage.getItem('toolbox');
    if (!toolbox) {
        toolbox = $("#toolboxes").val();
    }

    if (toolbox) {
        var newel = document.createElement("toolbox");
        newel.appendChild(document.createTextNode(toolbox));
        xml.insertBefore(newel, xml.childNodes[0]);
    }

    var toolboxids = sessionStorage.getItem('toolboxids');
    if (toolboxids === undefined || toolboxids === "") {
        if ($('#defaultCategories').length) {
            toolboxids = $('#defaultCategories').html();
        }
    }

    if (toolboxids) {
        var newel = document.createElement("toolboxcategories");
        newel.appendChild(document.createTextNode(toolboxids));
        xml.insertBefore(newel, xml.childNodes[0]);
    }

    var data = Blockly.Xml.domToPrettyText(xml);
    var datenow = Date.now();
    var defaultFilename = "skyrover_project" + datenow + ".sky";

    // Check for Electron native save
    if (window.electronAPI && window.electronAPI.saveFile) {
        window.electronAPI.saveFile({
            content: data,
            defaultPath: defaultFilename,
            filters: [{ name: 'Skyrover Project', extensions: ['sky', 'xml'] }]
        }).then(function (result) {
            if (result.success) {
                if (window.addNewMessage) addNewMessage("Project saved successfully!", "success");
            } else if (result.error) {
                if (window.addNewMessage) addNewMessage("Error saving file: " + result.error, "error");
            }
        }).catch(function (err) {
            console.error("Save Project IPC Error:", err);
            if (window.addNewMessage) addNewMessage("System Error saving project: " + err, "error");
        });
        // Prevent default link behavior
        return false;
    } else {
        var uri = 'data:text/xml;charset=utf-8,' + encodeURIComponent(data);
        var element = document.createElement('a');
        element.setAttribute('href', uri);
        element.setAttribute('download', defaultFilename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }
};

/**
 * Creates an INO file containing the Arduino code from the Blockly workspace and
 * prompts the users to save it into their local file system.
 */
BlocklyDuino.saveArduinoFile = function () {
    var code = BlocklyDuino.getSketchSourceForCompile();
    var datenow = Date.now();
    var filename = "arduino_" + datenow + ".ino";

    // Check for Electron native save
    if (window.electronAPI && window.electronAPI.saveFile) {
        window.electronAPI.saveFile({
            content: code,
            defaultPath: filename,
            filters: [{ name: 'Arduino Sketch', extensions: ['ino'] }]
        }).then(function (result) {
            if (result.success) {
                if (window.addNewMessage) addNewMessage("Sketch saved successfully!", "success");
            } else if (result.error) {
                if (window.addNewMessage) addNewMessage("Error saving sketch: " + result.error, "error");
            }
        }).catch(function (err) {
            console.error("Save Sketch IPC Error:", err);
            if (window.addNewMessage) addNewMessage("System Error saving sketch: " + err, "error");
        });
        return;
    }

    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/ino;charset=utf-8,' + encodeURIComponent(code));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
};

/**
 * Load Arduino code from component pre_arduino
 */
BlocklyDuino.getFiles = function () {
    var code = BlocklyDuino.getSketchSourceForCompile();
    return { "sketch.ino": code.replace(/</g, '&lt;').replace(/>/g, '&gt;') };
};


/**
 // * Load blocks from local file.
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
            try {
                var xml = Blockly.Xml.textToDom(target.result);
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
        }
        // Reset value of input after loading because Chrome will not fire
        // a 'change' event if the same file is loaded again.
        $('#load').val('');
    };
    reader.readAsText(files[0]);
};

/**
 * Discard all blocks from the workspace.
 */
BlocklyDuino.discard = function () {
    var count = BlocklyDuino.workspace.getAllBlocks().length;
    if (count < 2 || window.confirm(MSG['discard'].replace('%1', count))) {
        BlocklyDuino.workspace.clear();
        //clean URL from example if opened
        var search = window.location.search;
        var newsearch = search.replace(/([?&]url=)[^&]*/, '');
        window.history.pushState(search, "Title", newsearch);
        BlocklyDuino.renderContent();
    }
};

/**
 * Undo/redo functions
 */
BlocklyDuino.Undo = function () {
    var ws = Blockly.getMainWorkspace ? Blockly.getMainWorkspace() : Blockly.mainWorkspace;
    if (ws) ws.undo(0);
};
BlocklyDuino.Redo = function () {
    var ws = Blockly.getMainWorkspace ? Blockly.getMainWorkspace() : Blockly.mainWorkspace;
    if (ws) ws.undo(1);
};


/**
 * Reset Blockly@rduino and clean webbrowser cache, local storage
 */
BlocklyDuino.clearLocalStorage = function () {
    window.removeEventListener('unload', BlocklyDuino.backupBlocks, false);
    localStorage.clear();
    sessionStorage.clear();
};


/**
 * Change ergonomy and resize left buttons in just icons
 */
BlocklyDuino.miniMenuPanel = function () {
    // Store the blocks for the duration of the reload.
    BlocklyDuino.backupBlocks();

    var search = window.location.search;
    if (search.length <= 1) {
        search = '?size=miniMenu';
    } else if (search.match(/[?&]size=[^&]*/)) {
        search = search.replace(/([?&]size=)[^&]*/, '');
        search = search.replace(/\&/, '?');
    } else {
        search = search.replace(/\?/, '?size=miniMenu&');
    }

    // remove url file
    //search = search.replace(/([?&]url=)[^&]*/, '');
    window.location = window.location.protocol + '//' + window.location.host + window.location.pathname + search;
};


/**
 * Try to take a screen capture of all blocks on workspace
 * Thanks to the open source community for contributions.
 *
 */
BlocklyDuino.workspace_capture = function () {
    var ws = BlocklyDuino.workspace.svgBlockCanvas_.cloneNode(true);
    ws.removeAttribute("width");
    ws.removeAttribute("height");
    ws.removeAttribute("transform");
    var styleElem = document.createElementNS("http://www.w3.org/2000/svg", "style");
    styleElem.textContent = Blockly.Css.CONTENT.join('');
    ws.insertBefore(styleElem, ws.firstChild);
    var bbox = BlocklyDuino.workspace.svgBlockCanvas_.getBBox();
    var canvas = document.createElement("canvas");
    canvas.width = Math.ceil(bbox.width + 10);
    canvas.height = Math.ceil(bbox.height + 10);
    var ctx = canvas.getContext("2d");
    var xml = new XMLSerializer().serializeToString(ws);
    xml = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="' + bbox.width + '" height="' + bbox.height + '" viewBox="' + bbox.x + ' ' + bbox.y + ' ' + bbox.width + ' ' + bbox.height + '"><rect width="100%" height="100%" fill="white"></rect>' + xml + '</svg>';
    var img = new Image();
    img.setAttribute("src", 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(xml))));
    img.onload = function () {
        ctx.drawImage(img, 5, 5);
        var canvasdata = canvas.toDataURL("image/png", 1);
        var datenow = Date.now();
        var a = document.createElement("a");
        a.download = "capture" + datenow + ".png";
        a.href = canvasdata;
        document.body.appendChild(a);
        a.click();
    }
};

// Compile (verify) button handler
BlocklyDuino.verify_local_Click = function () {
    // TRACKING: Verify/Compile
    if (typeof window.trackGAEvent === 'function') {
        window.trackGAEvent('click_verify');
    }

    console.log("Verify button clicked");
    var code = BlocklyDuino.getSketchSourceForCompile();
    var board = (typeof profile !== 'undefined' && profile.defaultBoard && profile.defaultBoard['upload_arg'])
        ? profile.defaultBoard['upload_arg']
        : 'arduino:avr:uno';

    if (typeof profile !== 'undefined' && profile.defaultBoardKey === 'skyrover') {
        board = 'esp32:esp32:esp32';
    }
    if (typeof profile !== 'undefined' && profile.defaultBoardKey === 'esp32c3promini') {
        board = 'esp32:esp32:esp32c3';
    }

    if (window.electronAPI && window.electronAPI.compileCode) {
        if (window.addNewMessage) addNewMessage(MSG['span_verify_local'] + "...", "info");

        window.electronAPI.compileCode({ code: code, board: board })
            .then(function (result) {
                if (result.success) {
                    var msg = "Done Compiling!";
                    if (result.message && result.message !== "Compilation successful") {
                        msg += "\n" + result.message;
                    }
                    if (window.addNewMessage) addNewMessage(msg, "success");
                } else {
                    if (window.addNewMessage) addNewMessage("Compilation Failed:\n" + (result.message || "Unknown error"), "error");
                    console.error("Compilation failed:", result);
                }
            })
            .catch(function (err) {
                if (window.addNewMessage) addNewMessage("System Error: " + err, "error");
                console.error("Compile error:", err);
            });
    } else {
        var base = BlocklyDuino.getBackendBaseUrl();
        if (window.addNewMessage) addNewMessage(MSG['span_verify_local'] + "...", "info");
        fetch(base + '/compile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(Object.assign({ code: code, board: board }, BlocklyDuino.auditRequestFields()))
        })
            .then(function (r) { return r.json(); })
            .then(function (result) {
                if (result.success) {
                    var msg = "Done Compiling!";
                    if (result.message && result.message !== "Compilation successful") {
                        msg += "\n" + result.message;
                    }
                    if (window.addNewMessage) addNewMessage(msg, "success");
                } else {
                    if (window.addNewMessage) addNewMessage("Compilation Failed:\n" + (result.message || result.error || "Unknown error"), "error");
                }
            })
            .catch(function (err) {
                if (window.addNewMessage) addNewMessage("Compile request failed: " + err, "error");
                console.error("Compile error:", err);
            });
    }
};

// Upload button handler
BlocklyDuino.uploadClick = function () {
    if (typeof window !== 'undefined' && window.BlockIDEUploadState &&
        typeof window.BlockIDEUploadState.getState === 'function' &&
        window.BlockIDEUploadState.getState() !== 'idle') {
        if (window.addNewMessage) addNewMessage("Upload already in progress. Please wait.", "warning");
        return;
    }
    var uploadRunId = (typeof window !== 'undefined' && window.BlockIDEUploadState &&
        typeof window.BlockIDEUploadState.begin === 'function')
        ? window.BlockIDEUploadState.begin()
        : Date.now();
    // TRACKING: Upload/Flash
    if (typeof window.trackGAEvent === 'function') {
        window.trackGAEvent('click_upload', {
            board: (window.profile && window.profile.defaultBoardKey) || 'unknown'
        });
    }

    var code = BlocklyDuino.getSketchSourceForCompile();
    var port = $('#serialport_ide').val();
    var board = (typeof profile !== 'undefined' && profile.defaultBoard && profile.defaultBoard['upload_arg'])
        ? profile.defaultBoard['upload_arg']
        : 'arduino:avr:uno';

    if (typeof profile !== 'undefined' && profile.defaultBoardKey === 'skyrover') {
        board = 'esp32:esp32:esp32';
    }
    if (typeof profile !== 'undefined' && profile.defaultBoardKey === 'esp32c3promini') {
        board = 'esp32:esp32:esp32c3';
    }

    if (!code || code.trim() === "") {
        if (window.addNewMessage) addNewMessage("No code to upload. Please generate code first.", "warning");
        return;
    }

    if (window.electronAPI && window.electronAPI.uploadCode) {
        if (!port || port === 'no_com') {
            if (window.addNewMessage) addNewMessage("No serial port selected. Please connect your board and select a port.", "warning");
            return;
        }
        if (window.addNewMessage) addNewMessage(MSG['span_flash_local'] + "...", "info");

        window.electronAPI.uploadCode({ code: code, board: board, port: port })
            .then(function (result) {
                if (result.success) {
                    if (window.BlockIDEUploadState && window.BlockIDEUploadState.move) {
                        window.BlockIDEUploadState.move('done', uploadRunId);
                        window.BlockIDEUploadState.move('idle', uploadRunId);
                    }
                    var msg = "Done Uploading!";
                    if (result.message && result.message !== "Upload successful") {
                        msg += "\n" + result.message;
                    }
                    if (window.addNewMessage) addNewMessage(msg, "success");
                } else {
                    if (window.BlockIDEUploadState && window.BlockIDEUploadState.move) {
                        window.BlockIDEUploadState.move('error', uploadRunId);
                        window.BlockIDEUploadState.move('idle', uploadRunId);
                    }
                    if (window.addNewMessage) addNewMessage("Upload Failed:\n" + (result.message || "Unknown error"), "error");
                    console.error("Upload failed:", result);
                }
            })
            .catch(function (err) {
                if (window.BlockIDEUploadState && window.BlockIDEUploadState.move) {
                    window.BlockIDEUploadState.move('error', uploadRunId);
                    window.BlockIDEUploadState.move('idle', uploadRunId);
                }
                if (window.addNewMessage) addNewMessage("System Error: " + err, "error");
                console.error("Upload error:", err);
            });
        return;
    }

    // Web: ESP32 / ESP8266 — compile + Web Serial (server has no access to your USB)
    var useEspWebSerial =
      board.indexOf('esp32:') === 0 ||
      board.indexOf('esp8266:') === 0;
    if (useEspWebSerial && typeof navigator !== 'undefined' && navigator.serial &&
        typeof window.BlockIDE !== 'undefined' && typeof window.BlockIDE.compileAndFlashEsp32Web === 'function') {
        if (window.addNewMessage) addNewMessage(MSG['span_flash_local'] + " (Web Serial)...", "info");
        var portPromiseFromClick = null;
        try {
            portPromiseFromClick = navigator.serial.requestPort();
        } catch (eGesture) {
            portPromiseFromClick = Promise.reject(eGesture);
        }
        window.BlockIDE.compileAndFlashEsp32Web({
            backendUrl: BlocklyDuino.getBackendBaseUrl(),
            code: code,
            board: board,
            portPromise: portPromiseFromClick,
            onLog: function (s) {
                if (window.addNewMessage) addNewMessage(String(s), "info");
            }
        }).then(function () {
            if (window.BlockIDEUploadState && window.BlockIDEUploadState.move) {
                window.BlockIDEUploadState.move('done', uploadRunId);
                window.BlockIDEUploadState.move('idle', uploadRunId);
            }
            if (window.addNewMessage) addNewMessage("Done uploading!", "success");
        }).catch(function (err) {
            if (window.BlockIDEUploadState && window.BlockIDEUploadState.move) {
                window.BlockIDEUploadState.move('error', uploadRunId);
                window.BlockIDEUploadState.move('idle', uploadRunId);
            }
            if (window.addNewMessage) addNewMessage("Upload failed: " + (err.message || err), "error");
        });
        return;
    }
    if (useEspWebSerial && (!navigator || !navigator.serial)) {
        if (window.addNewMessage) {
            addNewMessage(
                (typeof window.isSecureContext !== 'undefined' && !window.isSecureContext)
                    ? 'Web Serial is disabled on non-secure pages. Use HTTPS or localhost.'
                    : 'Web Serial not available in this browser/device. Use desktop Chrome or Edge.',
                'error'
            );
        }
        return;
    }

    if (typeof window.blockideIsWebSerialPortValue === 'function' && window.blockideIsWebSerialPortValue(port)) {
        if (window.addNewMessage) {
            addNewMessage(
                'The cloud server cannot upload to a USB port on your PC. For ESP32/ESP8266 use Upload (Web Serial). For Uno/other boards use the desktop app, run Block IDE locally, or Arduino IDE.',
                'warning'
            );
        }
        return;
    }

    if (!port || port === 'no_com' || port === '__add_usb_serial__') {
        if (window.addNewMessage) addNewMessage("No serial port selected. Please connect your board and select a port.", "warning");
        return;
    }

    var base = BlocklyDuino.getBackendBaseUrl();
    if (window.addNewMessage) addNewMessage(MSG['span_flash_local'] + "...", "info");
    fetch(base + '/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.assign({ code: code, board: board, port: port }, BlocklyDuino.auditRequestFields()))
    })
        .then(function (r) { return r.json(); })
        .then(function (result) {
            if (result.success) {
                if (window.BlockIDEUploadState && window.BlockIDEUploadState.move) {
                    window.BlockIDEUploadState.move('done', uploadRunId);
                    window.BlockIDEUploadState.move('idle', uploadRunId);
                }
                var msg = "Done Uploading!";
                if (result.message && result.message !== "Upload successful") {
                    msg += "\n" + result.message;
                }
                if (window.addNewMessage) addNewMessage(msg, "success");
            } else {
                if (window.BlockIDEUploadState && window.BlockIDEUploadState.move) {
                    window.BlockIDEUploadState.move('error', uploadRunId);
                    window.BlockIDEUploadState.move('idle', uploadRunId);
                }
                if (window.addNewMessage) addNewMessage("Upload Failed:\n" + (result.message || result.error || "Unknown error"), "error");
            }
        })
        .catch(function (err) {
            if (window.BlockIDEUploadState && window.BlockIDEUploadState.move) {
                window.BlockIDEUploadState.move('error', uploadRunId);
                window.BlockIDEUploadState.move('idle', uploadRunId);
            }
            if (window.addNewMessage) addNewMessage("Upload request failed: " + err, "error");
            console.error("Upload error:", err);
        });
};

// Bind the handlers to the buttons
$(document).ready(function () {
    // Unbind previous handlers if any (to avoid duplicates if reloaded)
    $('#btn_verify_local').off('click').on('click', BlocklyDuino.verify_local_Click);
    $('#btn_flash_local').off('click').on('click', BlocklyDuino.uploadClick);
});