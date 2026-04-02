/**
 * Servo angle field: compact "90°" on the block; click opens a protractor in DropDownDiv.
 */

import * as Blockly from 'blockly';

const POPUP_W = 170;
const POPUP_H = 70;
const CX = POPUP_W / 2;
const CY = POPUP_H - 14;
const R = 50;

function clampDeg(n) {
  var x = Math.round(Number(n));
  if (Number.isNaN(x)) return 90;
  return Math.max(0, Math.min(180, x));
}

function parseFieldValue(v) {
  if (v === null || v === undefined) return 90;
  return clampDeg(v);
}

function degreesFromSvgPoint(px, py) {
  var dx = px - CX;
  var dy = CY - py;
  var rad = Math.atan2(dy, dx);
  if (rad < 0 || rad > Math.PI) {
    var distL = Math.hypot(px - (CX - R), py - CY);
    var distR = Math.hypot(px - (CX + R), py - CY);
    return distL <= distR ? 180 : 0;
  }
  return clampDeg((rad * 180) / Math.PI);
}

export class FieldProtractor extends Blockly.Field {
  static EDITABLE = true;
  static SERIALIZABLE = true;

  constructor(value, validator, config) {
    var initial =
      value !== undefined && value !== null ? String(parseFieldValue(value)) : '90';
    super(initial, validator, config);
    /** @type {Blockly.browserEvents.Data|null} */
    this.editorPointerDownWrapper_ = null;
    /** @type {Blockly.browserEvents.Data|null} */
    this.editorPointerMoveWrapper_ = null;
    /** @type {Blockly.browserEvents.Data|null} */
    this.editorPointerUpWrapper_ = null;
    /** @type {SVGSVGElement|null} */
    this.editorSvg_ = null;
    /** @type {number} */
    this.editorLiveDeg_ = 90;
  }

  static fromJson(options) {
    var v = options['value'] !== undefined ? options['value'] : (options['angle'] !== undefined ? options['angle'] : '90');
    return new FieldProtractor(v);
  }

  doClassValidation_(newValue) {
    if (newValue === null || newValue === undefined) return null;
    var s = String(newValue).trim();
    if (s === '') return null;
    var n = parseInt(s, 10);
    if (Number.isNaN(n)) return null;
    return String(clampDeg(n));
  }

  initView() {
    this.createBorderRect_();
    this.createTextElement_();
    this.clickTarget_ = this.getSvgRoot();
  }

  render_() {
    if (this.textContent_) {
      this.textContent_.nodeValue = this.getDisplayText_();
    }
    // During block construction, setValue runs before init(); getConstants() is still null.
    if (!this.getConstants()) {
      return;
    }
    super.render_();
  }

  getDisplayText_() {
    return String(parseFieldValue(this.getValue())) + '\u00b0';
  }

  /**
   * Opens the semicircle protractor in a floating dropdown (click / drag to adjust).
   * @param {?Event} _e
   */
  showEditor_(_e) {
    var block = this.getSourceBlock();
    if (!block || block.isDeadOrDying()) return;

    var self = this;
    this.editorLiveDeg_ = parseFieldValue(this.getValue());

    Blockly.DropDownDiv.clearContent();
    var content = Blockly.DropDownDiv.getContentDiv();
    content.style.padding = '0';
    content.style.background = 'transparent';
    content.style.boxSizing = 'border-box';

    var wrap = document.createElement('div');
    wrap.style.textAlign = 'center';
    wrap.style.padding = '14px 18px 16px';
    wrap.style.borderRadius = '14px';
    wrap.style.background = 'linear-gradient(165deg, #ffffff 0%, #f8fafc 55%, #f1f5f9 100%)';
    wrap.style.border = '1px solid #e2e8f0';
    wrap.style.boxShadow =
      '0 4px 14px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.04)';
    wrap.setAttribute('aria-label', 'Servo angle protractor');

    var hint = document.createElement('div');
    hint.textContent =
      (Blockly.Msg && Blockly.Msg.BASIC_SERVO_ANGLE_POPUP_HINT) ||
      'Click or drag on the arc (0°–180°)';
    hint.style.fontSize = '12px';
    hint.style.fontWeight = '500';
    hint.style.color = '#64748b';
    hint.style.marginBottom = '10px';
    hint.style.lineHeight = '1.35';
    wrap.appendChild(hint);

    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', String(POPUP_W));
    svg.setAttribute('height', String(POPUP_H));
    svg.style.display = 'block';
    svg.style.margin = '0 auto';
    svg.style.cursor = 'pointer';
    svg.style.touchAction = 'none';
    svg.style.overflow = 'visible';

    var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    var grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    grad.setAttribute('id', 'protractorWedgeGrad');
    grad.setAttribute('x1', '0%');
    grad.setAttribute('y1', '100%');
    grad.setAttribute('x2', '0%');
    grad.setAttribute('y2', '0%');
    var g0 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    g0.setAttribute('offset', '0%');
    g0.setAttribute('stop-color', '#bfdbfe');
    g0.setAttribute('stop-opacity', '0.55');
    var g1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    g1.setAttribute('offset', '100%');
    g1.setAttribute('stop-color', '#e0e7ff');
    g1.setAttribute('stop-opacity', '0.35');
    grad.appendChild(g0);
    grad.appendChild(g1);
    defs.appendChild(grad);
    svg.appendChild(defs);

    var wedge = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    wedge.setAttribute(
      'd',
      'M ' + CX + ',' + CY + ' L ' + (CX - R) + ',' + CY + ' A ' + R + ',' + R + ' 0 0 1 ' + (CX + R) + ',' + CY + ' Z'
    );
    wedge.setAttribute('fill', 'url(#protractorWedgeGrad)');
    wedge.setAttribute('stroke', 'none');
    svg.appendChild(wedge);

    var arc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    arc.setAttribute('fill', 'none');
    arc.setAttribute('stroke', '#475569');
    arc.setAttribute('stroke-width', '2.5');
    arc.setAttribute('stroke-linecap', 'round');
    arc.setAttribute(
      'd',
      'M ' + (CX - R) + ',' + CY + ' A ' + R + ',' + R + ' 0 0 1 ' + (CX + R) + ',' + CY
    );
    svg.appendChild(arc);

    for (var d = 0; d <= 180; d += 30) {
      var rad = (d * Math.PI) / 180;
      var c = Math.cos(rad);
      var s = Math.sin(rad);
      var inner = d === 0 || d === 180 ? 8 : 5;
      var tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      tick.setAttribute('x1', String(CX + (R - inner) * c));
      tick.setAttribute('y1', String(CY - (R - inner) * s));
      tick.setAttribute('x2', String(CX + R * c));
      tick.setAttribute('y2', String(CY - R * s));
      tick.setAttribute('stroke', d === 90 ? '#334155' : '#94a3b8');
      tick.setAttribute('stroke-width', d === 0 || d === 90 || d === 180 ? '2.5' : '1.5');
      tick.setAttribute('stroke-linecap', 'round');
      svg.appendChild(tick);
    }

    var lbl180 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    lbl180.setAttribute('x', String(CX - R - 2));
    lbl180.setAttribute('y', String(CY + 6));
    lbl180.setAttribute('text-anchor', 'end');
    lbl180.setAttribute('fill', '#64748b');
    lbl180.setAttribute('font-size', '11');
    lbl180.setAttribute('font-weight', '600');
    lbl180.textContent = '180';
    svg.appendChild(lbl180);

    var lbl0 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    lbl0.setAttribute('x', String(CX + R + 2));
    lbl0.setAttribute('y', String(CY + 6));
    lbl0.setAttribute('text-anchor', 'start');
    lbl0.setAttribute('fill', '#64748b');
    lbl0.setAttribute('font-size', '11');
    lbl0.setAttribute('font-weight', '600');
    lbl0.textContent = '0';
    svg.appendChild(lbl0);

    var needle = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    needle.setAttribute('stroke', '#dc2626');
    needle.setAttribute('stroke-width', '3');
    needle.setAttribute('stroke-linecap', 'round');
    needle.setAttribute('x1', String(CX));
    needle.setAttribute('y1', String(CY));
    svg.appendChild(needle);

    var pivot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    pivot.setAttribute('cx', String(CX));
    pivot.setAttribute('cy', String(CY));
    pivot.setAttribute('r', '5');
    pivot.setAttribute('fill', '#ffffff');
    pivot.setAttribute('stroke', '#dc2626');
    pivot.setAttribute('stroke-width', '2');
    svg.appendChild(pivot);

    var valueBadge = document.createElement('div');
    valueBadge.setAttribute('aria-live', 'polite');
    valueBadge.style.marginTop = '12px';
    valueBadge.style.display = 'inline-block';
    valueBadge.style.minWidth = '88px';
    valueBadge.style.padding = '10px 22px';
    valueBadge.style.borderRadius = '12px';
    valueBadge.style.background = '#ffffff';
    valueBadge.style.border = '2px solid #c7d2fe';
    valueBadge.style.boxShadow = '0 2px 10px rgba(79, 70, 229, 0.08)';
    valueBadge.style.fontSize = '22px';
    valueBadge.style.fontWeight = '700';
    valueBadge.style.fontVariantNumeric = 'tabular-nums';
    valueBadge.style.color = '#0f172a';
    valueBadge.style.letterSpacing = '0.03em';
    valueBadge.style.fontFamily =
      'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

    function syncGraphics() {
      var deg = self.editorLiveDeg_;
      var rads = (deg * Math.PI) / 180;
      var cc = Math.cos(rads);
      var ss = Math.sin(rads);
      needle.setAttribute('x2', String(CX + R * cc));
      needle.setAttribute('y2', String(CY - R * ss));
      valueBadge.textContent = String(deg) + '\u00b0';
    }
    syncGraphics();

    function setDegFromEvent(e) {
      var pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      var ctm = svg.getScreenCTM();
      if (!ctm) return;
      var local = pt.matrixTransform(ctm.inverse());
      self.editorLiveDeg_ = degreesFromSvgPoint(local.x, local.y);
      syncGraphics();
    }

    function endEditorDrag() {
      if (self.editorPointerMoveWrapper_) {
        Blockly.browserEvents.unbind(self.editorPointerMoveWrapper_);
        self.editorPointerMoveWrapper_ = null;
      }
      if (self.editorPointerUpWrapper_) {
        Blockly.browserEvents.unbind(self.editorPointerUpWrapper_);
        self.editorPointerUpWrapper_ = null;
      }
    }

    this.editorSvg_ = svg;
    this.editorPointerDownWrapper_ = Blockly.browserEvents.conditionalBind(
      svg,
      'pointerdown',
      this,
      function (e) {
        if (!self.sourceBlock_ || !self.isCurrentlyEditable()) return;
        e.preventDefault();
        try {
          if (svg.setPointerCapture && e.pointerId !== undefined) {
            svg.setPointerCapture(e.pointerId);
          }
        } catch (err) {
          /* ignore */
        }
        setDegFromEvent(e);
        endEditorDrag();
        self.editorPointerMoveWrapper_ = Blockly.browserEvents.conditionalBind(
          document,
          'pointermove',
          self,
          function (ev) {
            setDegFromEvent(ev);
          }
        );
        self.editorPointerUpWrapper_ = Blockly.browserEvents.conditionalBind(
          document,
          'pointerup',
          self,
          function (ev) {
            endEditorDrag();
            try {
              if (svg.releasePointerCapture && ev.pointerId !== undefined) {
                svg.releasePointerCapture(ev.pointerId);
              }
            } catch (err2) {
              /* ignore */
            }
          }
        );
      }
    );

    wrap.appendChild(svg);
    wrap.appendChild(valueBadge);
    content.appendChild(wrap);

    Blockly.DropDownDiv.setColour('#f8fafc', '#cbd5e0');

    Blockly.DropDownDiv.showPositionedByField(this, function () {
      endEditorDrag();
      if (self.editorPointerDownWrapper_) {
        Blockly.browserEvents.unbind(self.editorPointerDownWrapper_);
        self.editorPointerDownWrapper_ = null;
      }
      self.editorSvg_ = null;
      self.setValue(String(clampDeg(self.editorLiveDeg_)));
    });
  }

  dispose() {
    Blockly.DropDownDiv.hideIfOwner(this);
    if (this.editorPointerDownWrapper_) {
      Blockly.browserEvents.unbind(this.editorPointerDownWrapper_);
      this.editorPointerDownWrapper_ = null;
    }
    if (this.editorPointerMoveWrapper_) {
      Blockly.browserEvents.unbind(this.editorPointerMoveWrapper_);
      this.editorPointerMoveWrapper_ = null;
    }
    if (this.editorPointerUpWrapper_) {
      Blockly.browserEvents.unbind(this.editorPointerUpWrapper_);
      this.editorPointerUpWrapper_ = null;
    }
    super.dispose();
  }

  isClickableInFlyout() {
    return true;
  }
}

var registered = false;

export function registerFieldProtractor() {
  if (registered) return;
  Blockly.fieldRegistry.register('field_protractor', FieldProtractor);
  registered = true;
}
