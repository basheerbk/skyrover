import * as Blockly from 'blockly';

/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2012 Google Inc.
 * https://developers.google.com/blockly/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Variable blocks for Blockly.
 * @author fraser@google.com (Neil Fraser)
 */
// Helper utilities for variable declaration and assignment validation
// Build a registry of declared variables in the workspace (optionally for a single name)
// Guard: Blockly v12 may not have Blockly.Blocks.variables; create it if undefined
if (!Blockly.Blocks) Blockly.Blocks = {};
if (!Blockly.Blocks.variables) Blockly.Blocks.variables = {};
Blockly.Blocks.variables._buildVarRegistry = function (workspace, skipBlockId, filterName) {
    var registry = Object.create(null);
    if (!workspace || !workspace.getAllBlocks) return registry;
    var all = workspace.getAllBlocks(false);
    for (var i = 0; i < all.length; i++) {
        var b = all[i];
        if (!b || b.id === skipBlockId) continue;
        if (!b.getFieldValue) continue;
        var name = null;
        var typeKey = null;
        var typeId = null;
        var isConst = false;
        if (b.type === 'variables_set_init' || b.type === 'variables_declare_typed') {
            name = b.getFieldValue('VAR');
            typeKey = b.getFieldValue('VARIABLE_SETTYPE_TYPE') || b.getFieldValue('VARIABLE_DECLARE_TYPE');
            typeId = (typeKey && Blockly.Types[typeKey]) ? Blockly.Types[typeKey].typeId : null;
        } else if (b.type === 'variables_const') {
            name = b.getFieldValue('VAR');
            var t = (b.getVarType) ? b.getVarType(name) : null;
            typeId = t && t.typeId ? t.typeId : null;
            typeKey = null; // not used for const; we compare by typeId
            isConst = true;
        }
        if (name) {
            if (filterName && name !== filterName) continue;
            registry[name] = { typeKey: typeKey, typeId: typeId, isConst: isConst };
            if (filterName) break; // early exit when filtering by one name
        }
    }
    return registry;
};

Blockly.Blocks['variables_get'] = {
    /**
     * Block for variable getter.
     * @this Blockly.Block
     */
    init: function () {
        this.setHelpUrl(Blockly.Msg.VARIABLES_GET_HELPURL);
        this.setColour('#FF8C1A');
        this.appendDummyInput()
            .appendField(new Blockly.FieldVariable(Blockly.Msg.VARIABLES_DEFAULT_NAME), 'VAR');
        this.setOutput(true);
        this.setInputsInline(true);
        this.setTooltip(Blockly.Msg.VARIABLES_GET_TOOLTIP);
        this.contextMenuMsg_ = Blockly.Msg.VARIABLES_GET_CREATE_SET;
    },
    contextMenuType_: 'variables_set',
    /**
     * Add menu option to create getter/setter block for this setter/getter.
     * @param {!Array} options List of menu options to add to.
     * @this Blockly.Block
     */
    customContextMenu: function (options) {
        var option = {
            enabled: true
        };
        var name = this.getFieldValue('VAR');
        option.text = this.contextMenuMsg_.replace('%1', name);
        var xmlField = Blockly.utils.xml.createElement('field');
        xmlField.textContent = name;
        xmlField.setAttribute('name', 'VAR');
        var xmlBlock = Blockly.utils.xml.createElement('block');
        xmlBlock.appendChild(xmlField);
        xmlBlock.setAttribute('type', this.contextMenuType_);
        option.callback = Blockly.ContextMenu.callbackFactory(this, xmlBlock);
        options.push(option);
    },
    /**
     * @return {!string} Retrieves the type (stored in varType) of this block.
     * @this Blockly.Block
     */
    getBlockType: function () {
        return [Blockly.Types.UNDEF, this.getFieldValue('VAR')];
    },
    /**
     * Gets the stored type of the variable indicated in the argument. As only one
     * variable is stored in this block, no need to check input
     * @this Blockly.
     * @param {!string} varName Name of this block variable to check type.
     * @return {!string} String to indicate the type of this block.
     */
    getVarType: function (varName) {
        //return [Blockly.Types.UNDEF, this.getFieldValue('VAR')];
        return Blockly.Types.getChildBlockType(this)
    }
};

Blockly.Blocks['variables_set'] = {
    /**
     * Block for variable setter.
     * @this Blockly.Block
     */
    init: function () {
        this.appendValueInput("VALUE")
            .appendField(Blockly.Msg.VARIABLES_SET)
            .appendField(new Blockly.FieldVariable(Blockly.Msg.VARIABLES_DEFAULT_NAME), 'VAR')
            .appendField(Blockly.Msg._AT);
        this.setHelpUrl(
            typeof Blockly.Msg.VARIABLES_SET_HELPURL === 'string'
                ? Blockly.Msg.VARIABLES_SET_HELPURL
                : ''
        );
        this.setTooltip(Blockly.Msg.VARIABLES_SET_TOOLTIP);
        this.setColour('#FF8C1A');
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.contextMenuMsg_ = Blockly.Msg.VARIABLES_SET_CREATE_GET;
    },
    contextMenuType_: 'variables_get',
    customContextMenu: Blockly.Blocks['variables_get'].customContextMenu,
    /**
     * Searches through the nested blocks to find a variable type.
     * @this Blockly.Block
     * @param {!string} varName Name of this block variable to check type.
     * @return {string} String to indicate the type of this block.
     */
    getVarType: function (varName) {
        return Blockly.Types.getChildBlockType(this);
    },
    onchange: function (event) {
        if (!this.workspace || this.isInFlyout) return;
        var varName = this.getFieldValue('VAR');
        var varModel = null;
        // Robust variable lookup for all Blockly versions
        if (this.getField && this.getField('VAR') && this.getField('VAR').getVariable && this.workspace.getVariableById) {
            // Modern Blockly: use variable ID
            var varId = this.getField('VAR').getVariable().getId();
            varModel = this.workspace.getVariableById(varId);
        } else if (this.workspace.getVariableMap && this.workspace.getVariableMap()) {
            // Some Blockly versions
            varModel = this.workspace.getVariableMap().getVariable(varName);
        } else if (this.workspace.getVariable) {
            // Legacy Blockly
            varModel = this.workspace.getVariable(varName);
        }
        var varType = (varModel && varModel.type && Blockly.Types[varModel.type]) ? Blockly.Types[varModel.type] : Blockly.Types.UNDEF;
        // Registry-based declaration/const checks without altering existing flows
        var registry = Blockly.Blocks.variables._buildVarRegistry(this.workspace, this.id, varName);
        if (varType === Blockly.Types.UNDEF) {
            if (!registry[varName]) {
                this.setWarningText('Error: Variable not declared/typed.');
                return;
            }
            // Use registry type when available to avoid treating as Undefined
            var reg = registry[varName];
            if (reg) {
                if (reg.typeKey && Blockly.Types[reg.typeKey]) {
                    varType = Blockly.Types[reg.typeKey];
                } else if (reg.typeId) {
                    // Find by typeId match
                    for (var key in Blockly.Types) {
                        var t = Blockly.Types[key];
                        if (t && t.typeId === reg.typeId) { varType = t; break; }
                    }
                }
            }
        }
        // If const exists for this name, block setting
        var info = registry[varName];
        if (info && info.isConst) {
            this.setWarningText('Error: Cannot assign to const variable.');
            return;
        }
        // Avoid deep scans in onchange to prevent UI stalls
        // Fast exit if there's no value connected; only clear warnings
        var valueBlock = this.getInputTargetBlock('VALUE');
        var valueType = valueBlock && valueBlock.getBlockType ? valueBlock.getBlockType() : Blockly.Types.UNDEF;
        if (!valueBlock) {
            // No value; only error on const/undeclared above. Otherwise clear.
            if (!(varType && varType === Blockly.Types.UNDEF)) {
                this.setWarningText(null);
            }
            return;
        }
        // Special case: Boolean should only receive 0, 1, true, false, or text 'true'/'false'
        if (varType === Blockly.Types.BOOLEAN) {
            var boolNumericTypes = [
                Blockly.Types.NUMBER,
                Blockly.Types.DECIMAL,
                Blockly.Types.SHORT_NUMBER,
                Blockly.Types.UNS_NUMBER,
                Blockly.Types.LARGE_NUMBER,
                Blockly.Types.LARGE_UNS_NUMBER,
                Blockly.Types.VOLATIL_NUMBER
            ];
            if (valueBlock && valueBlock.getBlockType && boolNumericTypes.indexOf(valueType) !== -1) {
                var raw = valueBlock.getFieldValue ? valueBlock.getFieldValue('NUM') : null;
                var n = raw !== null ? Number(raw) : NaN;
                if (!(n === 0 || n === 1)) {
                    this.setWarningText('Error: Boolean variables should only be assigned 0 (false), 1 (true), true, or false!');
                    return;
                }
            } else if (valueBlock && valueBlock.getBlockType && valueBlock.getBlockType() === Blockly.Types.BOOLEAN) {
                // true/false block, always valid
            } else if (valueBlock && valueBlock.getBlockType && valueBlock.getBlockType() === Blockly.Types.TEXT) {
                var textVal = valueBlock.getFieldValue ? valueBlock.getFieldValue('TEXT') : '';
                if (typeof textVal === 'string' && textVal.toLowerCase() !== 'true' && textVal.toLowerCase() !== 'false') {
                    this.setWarningText('Error: Boolean variables should only be assigned 0 (false), 1 (true), true, or false!');
                    return;
                }
            }
        } else if (varType === Blockly.Types.TEXT) {
            // For String variables, disallow direct numeric assignments. Require text blocks or explicit cast.
            var numericTypes = [
                Blockly.Types.NUMBER,
                Blockly.Types.DECIMAL,
                Blockly.Types.SHORT_NUMBER,
                Blockly.Types.UNS_NUMBER,
                Blockly.Types.LARGE_NUMBER,
                Blockly.Types.LARGE_UNS_NUMBER,
                Blockly.Types.VOLATIL_NUMBER
            ];
            if (valueBlock && valueType && numericTypes.indexOf(valueType) !== -1) {
                this.setWarningText('Error: String variables cannot be assigned numeric values directly. Use a text block or cast to String.');
                return;
            }
        } else if (varType === Blockly.Types.CHARACTER) {
            // Character must be a single character or an integer within [-128, 255]
            if (valueBlock && valueBlock.getBlockType) {
                if (valueBlock.getBlockType() === Blockly.Types.TEXT) {
                    var ch = valueBlock.getFieldValue ? valueBlock.getFieldValue('TEXT') : '';
                    if (typeof ch !== 'string' || ch.length !== 1) {
                        this.setWarningText('Error: Character variables must be assigned a single character.');
                        return;
                    }
                } else if (valueBlock.getBlockType() === Blockly.Types.NUMBER || valueBlock.getBlockType() === Blockly.Types.DECIMAL) {
                    var rawNum = valueBlock.getFieldValue ? valueBlock.getFieldValue('NUM') : null;
                    var num = rawNum !== null ? Number(rawNum) : NaN;
                    if (!Number.isFinite(num) || Math.floor(num) !== num) {
                        this.setWarningText('Error: Character numeric value must be an integer.');
                        return;
                    }
                    if (num < -128 || num > 255) {
                        this.setWarningText('Error: Character numeric value out of range (-128..255).');
                        return;
                    }
                }
            }
        }
        // Normal type compatibility logic
        if (varType && valueType && varType.isCompatibleWith && !varType.isCompatibleWith(valueType)) {
            var varTypeId = varType && varType.typeId ? varType.typeId : varType;
            var valueTypeId = valueType && valueType.typeId ? valueType.typeId : valueType;
            this.setWarningText('Error: Type mismatch - cannot assign ' + (valueTypeId) + ' to ' + (varTypeId));
        } else {
            this.setWarningText(null);
        }
    }
};

Blockly.Blocks['variables_const'] = {
    init: function () {
        this.appendValueInput("VAL_CONST")
            .appendField(Blockly.Msg.VARIABLES_SET_CONST)
            .appendField(new Blockly.FieldVariable(Blockly.Msg.VARIABLES_DEFAULT_NAME), 'VAR')
            .appendField(Blockly.Msg.VARIABLES_SET_CONST_AT);
        this.setColour('#FF8C1A');
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setTooltip(Blockly.Msg.VARIABLES_SET_CONST_TOOLTIP);
        this.setHelpUrl(Blockly.Msg.VARIABLES_SET_CONST_HELPURL);
        this.contextMenuMsg_ = Blockly.Msg.VARIABLES_SET_CREATE_GET;
    },
    contextMenuType_: 'variables_get',
    customContextMenu: Blockly.Blocks['variables_get'].customContextMenu,
    /**
     * Searches through the nested blocks to find a variable type.
     * @this Blockly.Block
     * @param {!string} varName Name of this block variable to check type.
     * @return {string} String to indicate the type of this block.
     */
    getVarType: function (varName) {
        return Blockly.Types.getChildBlockType(this);
    }
};

Blockly.Blocks['variables_set_init'] = {
    init: function () {
        this.appendValueInput("VALUE")
            .appendField(Blockly.Msg.VARIABLES_SET_INIT)
            .appendField(new Blockly.FieldVariable(Blockly.Msg.VARIABLES_DEFAULT_NAME), 'VAR')
            .appendField(Blockly.Msg.VARIABLES_AS)
            .appendField(new Blockly.FieldDropdown(Blockly.Types.getValidTypeArray()), 'VARIABLE_SETTYPE_TYPE')
            .appendField(Blockly.Msg._AT);
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour('#FF8C1A');
        this.setHelpUrl(Blockly.Msg.VARIABLES_SET_INIT_HELPURL);
        this.setTooltip(Blockly.Msg.VARIABLES_SET_INIT_TOOLTIP);
        this.contextMenuMsg_ = Blockly.Msg.VARIABLES_SET_CREATE_GET;
    },
    contextMenuType_: 'variables_get',
    customContextMenu: Blockly.Blocks['variables_get'].customContextMenu,
    /**
     * Searches through the nested blocks to find a variable type.
     * @this Blockly.Block
     * @param {!string} varName Name of this block variable to check type.
     * @return {string} String to indicate the type of this block.
     */
    getVarType: function (varName) {
        return Blockly.Types.getChildBlockType(this);
    }
};

Blockly.Blocks['variables_declare_typed'] = {
    init: function () {
        this.appendDummyInput()
            .appendField(Blockly.Msg.VARIABLES_DECLARE_TYPED)
            .appendField(new Blockly.FieldVariable(Blockly.Msg.VARIABLES_DEFAULT_NAME), 'VAR')
            .appendField(Blockly.Msg.VARIABLES_AS)
            .appendField(new Blockly.FieldDropdown(Blockly.Types.getValidTypeArray()), 'VARIABLE_DECLARE_TYPE');
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour('#FF8C1A');
        this.setHelpUrl(Blockly.Msg.VARIABLES_DECLARE_TYPED_HELPURL);
        this.setTooltip(Blockly.Msg.VARIABLES_DECLARE_TYPED_TOOLTIP);
        this.contextMenuMsg_ = Blockly.Msg.VARIABLES_SET_CREATE_GET;
    },
    contextMenuType_: 'variables_get',
    customContextMenu: Blockly.Blocks['variables_get'].customContextMenu,
    getVarType: function () {
        return Blockly.Types.getChildBlockType(this);
    }
};

