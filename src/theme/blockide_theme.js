/**
 * BlockIDE Custom Theme for Blockly v12
 * Uses Zelos renderer (Scratch-like rounded blocks)
 */

import * as Blockly from 'blockly';

export const BlockIDETheme = Blockly.Theme.defineTheme('blockide', {
  base: Blockly.Themes.Classic,

  blockStyles: {
    logic_blocks:     { colourPrimary: '#FFAB19', colourSecondary: '#e09000', colourTertiary: '#c07800' },
    loop_blocks:      { colourPrimary: '#FFD500', colourSecondary: '#e0b800', colourTertiary: '#c09b00' },
    math_blocks:      { colourPrimary: '#40BF4A', colourSecondary: '#30a03a', colourTertiary: '#20802a' },
    text_blocks:      { colourPrimary: '#9966FF', colourSecondary: '#7744ee', colourTertiary: '#5522cc' },
    variable_blocks:  { colourPrimary: '#FF8C1A', colourSecondary: '#e07000', colourTertiary: '#c05000' },
    procedure_blocks: { colourPrimary: '#FF6680', colourSecondary: '#e04060', colourTertiary: '#c02040' },
    arduino_blocks:   { colourPrimary: '#00979D', colourSecondary: '#007580', colourTertiary: '#005560' },
  },

  categoryStyles: {
    logic_category:     { colour: '#FFAB19' },
    loop_category:      { colour: '#FFD500' },
    math_category:      { colour: '#40BF4A' },
    text_category:      { colour: '#9966FF' },
    variable_category:  { colour: '#FF8C1A' },
    procedure_category: { colour: '#FF6680' },
    arduino_category:   { colour: '#00979D' },
  },

  componentStyles: {
    workspaceBackgroundColour: '#f8f9fa',
    toolboxBackgroundColour:   '#2c2c3e',
    toolboxForegroundColour:   '#ffffff',
    flyoutBackgroundColour:    '#3a3a50',
    flyoutForegroundColour:    '#ccccdd',
    flyoutOpacity:             0.97,
    scrollbarColour:           '#6666aa',
    scrollbarOpacity:          0.5,
    insertionMarkerColour:     '#ffffff',
    insertionMarkerOpacity:    0.3,
    markerColour:              '#ffffff',
    cursorColour:              '#d0d0ff',
  },

  fontStyle: {
    family: 'Poppins, "Segoe UI", Arial, sans-serif',
    weight: '500',
    size:   11,
  },

  startHats: false,
});

/**
 * Workspace injection config.
 * Pass this to Blockly.inject().
 */
export const workspaceConfig = {
  renderer:  'zelos',
  theme:     BlockIDETheme,
  zoom: {
    controls:   true,
    wheel:      true,
    startScale: 0.9,
    maxScale:   3,
    minScale:   0.3,
    scaleSpeed: 1.2,
  },
  grid: {
    spacing:  20,
    length:   3,
    colour:   '#e0e0f0',
    snap:     true,
  },
  trashcan:        true,
  move: {
    scrollbars: true,
    drag:       true,
    wheel:      false,
  },
  sounds: true,
};
