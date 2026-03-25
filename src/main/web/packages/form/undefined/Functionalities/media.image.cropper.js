import { OR } from "./chunk-YYG42PYR.js";
import { CodBiError } from "./chunk-NKLWL4ZS.js";
import "./chunk-JP4GUAZX.js";
import { IF } from "./chunk-2VQP2CFN.js";
import { REGEX } from "./chunk-F3IDEOQS.js";
import { TYPE } from "./chunk-O5T7YW22.js";
import { INSTANCE } from "./chunk-53TEMTGA.js";
import { DBC } from "./chunk-LFRFVRJV.js";
import "./chunk-ZTMSSRTV.js";
import { __decorateClass, __decorateParam } from "./chunk-AOJQKO6T.js";

// ../../node_modules/@cropper/utils/dist/utils.esm.raw.js
var IS_BROWSER = typeof window !== "undefined" && typeof window.document !== "undefined";
var WINDOW = IS_BROWSER ? window : {};
var IS_TOUCH_DEVICE = IS_BROWSER ? "ontouchstart" in WINDOW.document.documentElement : false;
var HAS_POINTER_EVENT = IS_BROWSER ? "PointerEvent" in WINDOW : false;
var NAMESPACE = "cropper";
var CROPPER_CANVAS = `${NAMESPACE}-canvas`;
var CROPPER_CROSSHAIR = `${NAMESPACE}-crosshair`;
var CROPPER_GIRD = `${NAMESPACE}-grid`;
var CROPPER_HANDLE = `${NAMESPACE}-handle`;
var CROPPER_IMAGE = `${NAMESPACE}-image`;
var CROPPER_SELECTION = `${NAMESPACE}-selection`;
var CROPPER_SHADE = `${NAMESPACE}-shade`;
var CROPPER_VIEWER = `${NAMESPACE}-viewer`;
var ACTION_SELECT = "select";
var ACTION_MOVE = "move";
var ACTION_SCALE = "scale";
var ACTION_ROTATE = "rotate";
var ACTION_TRANSFORM = "transform";
var ACTION_NONE = "none";
var ACTION_RESIZE_NORTH = "n-resize";
var ACTION_RESIZE_EAST = "e-resize";
var ACTION_RESIZE_SOUTH = "s-resize";
var ACTION_RESIZE_WEST = "w-resize";
var ACTION_RESIZE_NORTHEAST = "ne-resize";
var ACTION_RESIZE_NORTHWEST = "nw-resize";
var ACTION_RESIZE_SOUTHEAST = "se-resize";
var ACTION_RESIZE_SOUTHWEST = "sw-resize";
var ATTRIBUTE_ACTION = "action";
var EVENT_TOUCH_END = IS_TOUCH_DEVICE ? "touchend touchcancel" : "mouseup";
var EVENT_TOUCH_MOVE = IS_TOUCH_DEVICE ? "touchmove" : "mousemove";
var EVENT_TOUCH_START = IS_TOUCH_DEVICE ? "touchstart" : "mousedown";
var EVENT_POINTER_DOWN = HAS_POINTER_EVENT ? "pointerdown" : EVENT_TOUCH_START;
var EVENT_POINTER_MOVE = HAS_POINTER_EVENT ? "pointermove" : EVENT_TOUCH_MOVE;
var EVENT_POINTER_UP = HAS_POINTER_EVENT ? "pointerup pointercancel" : EVENT_TOUCH_END;
var EVENT_ERROR = "error";
var EVENT_KEYDOWN = "keydown";
var EVENT_LOAD = "load";
var EVENT_WHEEL = "wheel";
var EVENT_ACTION = "action";
var EVENT_ACTION_END = "actionend";
var EVENT_ACTION_MOVE = "actionmove";
var EVENT_ACTION_START = "actionstart";
var EVENT_CHANGE = "change";
var EVENT_TRANSFORM = "transform";
function isString(value) {
  return typeof value === "string";
}
var isNaN = Number.isNaN || WINDOW.isNaN;
function isNumber(value) {
  return typeof value === "number" && !isNaN(value);
}
function isPositiveNumber(value) {
  return isNumber(value) && value > 0 && value < Infinity;
}
function isUndefined(value) {
  return typeof value === "undefined";
}
function isObject(value) {
  return typeof value === "object" && value !== null;
}
var { hasOwnProperty } = Object.prototype;
function isPlainObject(value) {
  if (!isObject(value)) {
    return false;
  }
  try {
    const { constructor } = value;
    const { prototype } = constructor;
    return constructor && prototype && hasOwnProperty.call(prototype, "isPrototypeOf");
  } catch (error) {
    return false;
  }
}
function isFunction(value) {
  return typeof value === "function";
}
function isElement(node) {
  return typeof node === "object" && node !== null && node.nodeType === 1;
}
var REGEXP_CAMEL_CASE = /([a-z\d])([A-Z])/g;
function toKebabCase(value) {
  return String(value).replace(REGEXP_CAMEL_CASE, "$1-$2").toLowerCase();
}
var REGEXP_KEBAB_CASE = /-[A-z\d]/g;
function toCamelCase(value) {
  return value.replace(REGEXP_KEBAB_CASE, (substring) => substring.slice(1).toUpperCase());
}
var REGEXP_SPACES = /\s\s*/;
function off(target, types, listener, options) {
  types
    .trim()
    .split(REGEXP_SPACES)
    .forEach((type) => {
      target.removeEventListener(type, listener, options);
    });
}
function on(target, types, listener, options) {
  types
    .trim()
    .split(REGEXP_SPACES)
    .forEach((type) => {
      target.addEventListener(type, listener, options);
    });
}
function once(target, types, listener, options) {
  on(target, types, listener, Object.assign(Object.assign({}, options), { once: true }));
}
var defaultEventOptions = {
  bubbles: true,
  cancelable: true,
  composed: true,
};
function emit(target, type, detail, options) {
  return target.dispatchEvent(
    new CustomEvent(type, Object.assign(Object.assign(Object.assign({}, defaultEventOptions), { detail }), options)),
  );
}
var resolvedPromise = Promise.resolve();
function nextTick(context, callback) {
  return callback ? resolvedPromise.then(context ? callback.bind(context) : callback) : resolvedPromise;
}
function getOffset(element) {
  const { documentElement } = element.ownerDocument;
  const box = element.getBoundingClientRect();
  return {
    left: box.left + (WINDOW.pageXOffset - documentElement.clientLeft),
    top: box.top + (WINDOW.pageYOffset - documentElement.clientTop),
  };
}
var REGEXP_ANGLE_UNIT = /deg|g?rad|turn$/i;
function toAngleInRadian(angle) {
  const value = parseFloat(angle) || 0;
  if (value !== 0) {
    const [unit = "rad"] = String(angle).match(REGEXP_ANGLE_UNIT) || [];
    switch (unit.toLowerCase()) {
      case "deg":
        return (value / 360) * (Math.PI * 2);
      case "grad":
        return (value / 400) * (Math.PI * 2);
      case "turn":
        return value * (Math.PI * 2);
    }
  }
  return value;
}
var SIZE_ADJUSTMENT_TYPE_CONTAIN = "contain";
var SIZE_ADJUSTMENT_TYPE_COVER = "cover";
function getAdjustedSizes(data, type = SIZE_ADJUSTMENT_TYPE_CONTAIN) {
  const { aspectRatio } = data;
  let { width, height } = data;
  const isValidWidth = isPositiveNumber(width);
  const isValidHeight = isPositiveNumber(height);
  if (isValidWidth && isValidHeight) {
    const adjustedWidth = height * aspectRatio;
    if (
      (type === SIZE_ADJUSTMENT_TYPE_CONTAIN && adjustedWidth > width) ||
      (type === SIZE_ADJUSTMENT_TYPE_COVER && adjustedWidth < width)
    ) {
      height = width / aspectRatio;
    } else {
      width = height * aspectRatio;
    }
  } else if (isValidWidth) {
    height = width / aspectRatio;
  } else if (isValidHeight) {
    width = height * aspectRatio;
  }
  return {
    width,
    height,
  };
}
function multiplyMatrices(matrix, ...args) {
  if (args.length === 0) {
    return matrix;
  }
  const [a1, b1, c1, d1, e1, f1] = matrix;
  const [a2, b2, c2, d2, e2, f2] = args[0];
  matrix = [
    a1 * a2 + c1 * b2,
    b1 * a2 + d1 * b2,
    a1 * c2 + c1 * d2,
    b1 * c2 + d1 * d2,
    a1 * e2 + c1 * f2 + e1,
    b1 * e2 + d1 * f2 + f1,
  ];
  return multiplyMatrices(matrix, ...args.slice(1));
}

// ../../node_modules/@cropper/element/dist/element.esm.raw.js
var style = `:host([hidden]){display:none!important}`;
var REGEXP_SUFFIX = /left|top|width|height/i;
var DEFAULT_SHADOW_ROOT_MODE = "open";
var shadowRoots = /* @__PURE__ */ new WeakMap();
var styleSheets = /* @__PURE__ */ new WeakMap();
var tagNames = /* @__PURE__ */ new Map();
var supportsAdoptedStyleSheets =
  WINDOW.document &&
  Array.isArray(WINDOW.document.adoptedStyleSheets) &&
  "replaceSync" in WINDOW.CSSStyleSheet.prototype;
var CropperElement = class extends HTMLElement {
  get $sharedStyle() {
    return `${this.themeColor ? `:host{--theme-color: ${this.themeColor};}` : ""}${style}`;
  }
  constructor() {
    var _a, _b;
    super();
    this.shadowRootMode = DEFAULT_SHADOW_ROOT_MODE;
    this.slottable = true;
    const name =
      (_b = (_a = Object.getPrototypeOf(this)) === null || _a === void 0 ? void 0 : _a.constructor) === null ||
      _b === void 0
        ? void 0
        : _b.$name;
    if (name) {
      tagNames.set(name, this.tagName.toLowerCase());
    }
  }
  static get observedAttributes() {
    return ["shadow-root-mode", "slottable", "theme-color"];
  }
  // Convert attribute to property
  attributeChangedCallback(name, oldValue, newValue) {
    if (Object.is(newValue, oldValue)) {
      return;
    }
    const propertyName = toCamelCase(name);
    const oldPropertyValue = this[propertyName];
    let newPropertyValue = newValue;
    switch (typeof oldPropertyValue) {
      case "boolean":
        newPropertyValue = newValue !== null && newValue !== "false";
        break;
      case "number":
        newPropertyValue = Number(newValue);
        break;
    }
    this[propertyName] = newPropertyValue;
    switch (name) {
      case "theme-color": {
        const styleSheet = styleSheets.get(this);
        const styles = this.$sharedStyle;
        if (styleSheet && styles) {
          if (supportsAdoptedStyleSheets) {
            styleSheet.replaceSync(styles);
          } else {
            styleSheet.textContent = styles;
          }
        }
        break;
      }
    }
  }
  // Convert property to attribute
  $propertyChangedCallback(name, oldValue, newValue) {
    if (Object.is(newValue, oldValue)) {
      return;
    }
    name = toKebabCase(name);
    switch (typeof newValue) {
      case "boolean":
        if (newValue === true) {
          if (!this.hasAttribute(name)) {
            this.setAttribute(name, "");
          }
        } else {
          this.removeAttribute(name);
        }
        break;
      case "number":
        if (isNaN(newValue)) {
          newValue = "";
        } else {
          newValue = String(newValue);
        }
      // Fall through
      // case 'string':
      // eslint-disable-next-line no-fallthrough
      default:
        if (newValue) {
          if (this.getAttribute(name) !== newValue) {
            this.setAttribute(name, newValue);
          }
        } else {
          this.removeAttribute(name);
        }
    }
  }
  connectedCallback() {
    Object.getPrototypeOf(this).constructor.observedAttributes.forEach((attribute) => {
      const property = toCamelCase(attribute);
      let value = this[property];
      if (!isUndefined(value)) {
        this.$propertyChangedCallback(property, void 0, value);
      }
      Object.defineProperty(this, property, {
        enumerable: true,
        configurable: true,
        get() {
          return value;
        },
        set(newValue) {
          const oldValue = value;
          value = newValue;
          this.$propertyChangedCallback(property, oldValue, newValue);
        },
      });
    });
    const shadow = this.attachShadow({
      mode: this.shadowRootMode || DEFAULT_SHADOW_ROOT_MODE,
    });
    if (!this.shadowRoot) {
      shadowRoots.set(this, shadow);
    }
    styleSheets.set(this, this.$addStyles(this.$sharedStyle));
    if (this.$style) {
      this.$addStyles(this.$style);
    }
    if (this.$template) {
      const template = document.createElement("template");
      template.innerHTML = this.$template;
      shadow.appendChild(template.content);
    }
    if (this.slottable) {
      const slot = document.createElement("slot");
      shadow.appendChild(slot);
    }
  }
  disconnectedCallback() {
    if (styleSheets.has(this)) {
      styleSheets.delete(this);
    }
    if (shadowRoots.has(this)) {
      shadowRoots.delete(this);
    }
  }
  // eslint-disable-next-line class-methods-use-this
  $getTagNameOf(name) {
    var _a;
    return (_a = tagNames.get(name)) !== null && _a !== void 0 ? _a : name;
  }
  $setStyles(properties) {
    Object.keys(properties).forEach((property) => {
      let value = properties[property];
      if (isNumber(value)) {
        if (value !== 0 && REGEXP_SUFFIX.test(property)) {
          value = `${value}px`;
        } else {
          value = String(value);
        }
      }
      this.style[property] = value;
    });
    return this;
  }
  /**
   * Outputs the shadow root of the element.
   * @returns {ShadowRoot} Returns the shadow root.
   */
  $getShadowRoot() {
    return this.shadowRoot || shadowRoots.get(this);
  }
  /**
   * Adds styles to the shadow root.
   * @param {string} styles The styles to add.
   * @returns {CSSStyleSheet|HTMLStyleElement} Returns the generated style sheet.
   */
  $addStyles(styles) {
    let styleSheet;
    const shadow = this.$getShadowRoot();
    if (supportsAdoptedStyleSheets) {
      styleSheet = new CSSStyleSheet();
      styleSheet.replaceSync(styles);
      shadow.adoptedStyleSheets = shadow.adoptedStyleSheets.concat(styleSheet);
    } else {
      styleSheet = document.createElement("style");
      styleSheet.textContent = styles;
      shadow.appendChild(styleSheet);
    }
    return styleSheet;
  }
  /**
   * Dispatches an event at the element.
   * @param {string} type The name of the event.
   * @param {*} [detail] The data passed when initializing the event.
   * @param {CustomEventInit} [options] The other event options.
   * @returns {boolean} Returns the result value.
   */
  $emit(type, detail, options) {
    return emit(this, type, detail, options);
  }
  /**
   * Defers the callback to be executed after the next DOM update cycle.
   * @param {Function} [callback] The callback to execute after the next DOM update cycle.
   * @returns {Promise} A promise that resolves to nothing.
   */
  $nextTick(callback) {
    return nextTick(this, callback);
  }
  /**
   * Defines the constructor as a new custom element.
   * {@link https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry/define}
   * @param {string|object} [name] The element name.
   * @param {object} [options] The element definition options.
   */
  static $define(name, options) {
    if (isObject(name)) {
      options = name;
      name = "";
    }
    if (!name) {
      name = this.$name || this.name;
    }
    name = toKebabCase(name);
    if (IS_BROWSER && WINDOW.customElements && !WINDOW.customElements.get(name)) {
      customElements.define(name, this, options);
    }
  }
};
CropperElement.$version = "2.0.0";

// ../../node_modules/@cropper/element-canvas/dist/element-canvas.esm.raw.js
var style2 = `:host{display:block;min-height:100px;min-width:200px;overflow:hidden;position:relative;touch-action:none;-webkit-touch-callout:none;-webkit-user-select:none;-moz-user-select:none;user-select:none}:host([background]){background-color:#fff;background-image:repeating-linear-gradient(45deg,#ccc 25%,transparent 0,transparent 75%,#ccc 0,#ccc),repeating-linear-gradient(45deg,#ccc 25%,transparent 0,transparent 75%,#ccc 0,#ccc);background-image:repeating-conic-gradient(#ccc 0 25%,#fff 0 50%);background-position:0 0,.5rem .5rem;background-size:1rem 1rem}:host([disabled]){pointer-events:none}:host([disabled]):after{bottom:0;content:"";cursor:not-allowed;display:block;left:0;pointer-events:none;position:absolute;right:0;top:0}`;
var CropperCanvas = class extends CropperElement {
  constructor() {
    super(...arguments);
    this.$onPointerDown = null;
    this.$onPointerMove = null;
    this.$onPointerUp = null;
    this.$onWheel = null;
    this.$wheeling = false;
    this.$pointers = /* @__PURE__ */ new Map();
    this.$style = style2;
    this.$action = ACTION_NONE;
    this.background = false;
    this.disabled = false;
    this.scaleStep = 0.1;
    this.themeColor = "#39f";
  }
  static get observedAttributes() {
    return super.observedAttributes.concat(["background", "disabled", "scale-step"]);
  }
  connectedCallback() {
    super.connectedCallback();
    if (!this.disabled) {
      this.$bind();
    }
  }
  disconnectedCallback() {
    if (!this.disabled) {
      this.$unbind();
    }
    super.disconnectedCallback();
  }
  $propertyChangedCallback(name, oldValue, newValue) {
    if (Object.is(newValue, oldValue)) {
      return;
    }
    super.$propertyChangedCallback(name, oldValue, newValue);
    switch (name) {
      case "disabled":
        if (newValue) {
          this.$unbind();
        } else {
          this.$bind();
        }
        break;
    }
  }
  $bind() {
    if (!this.$onPointerDown) {
      this.$onPointerDown = this.$handlePointerDown.bind(this);
      on(this, EVENT_POINTER_DOWN, this.$onPointerDown);
    }
    if (!this.$onPointerMove) {
      this.$onPointerMove = this.$handlePointerMove.bind(this);
      on(this.ownerDocument, EVENT_POINTER_MOVE, this.$onPointerMove);
    }
    if (!this.$onPointerUp) {
      this.$onPointerUp = this.$handlePointerUp.bind(this);
      on(this.ownerDocument, EVENT_POINTER_UP, this.$onPointerUp);
    }
    if (!this.$onWheel) {
      this.$onWheel = this.$handleWheel.bind(this);
      on(this, EVENT_WHEEL, this.$onWheel, {
        passive: false,
        capture: true,
      });
    }
  }
  $unbind() {
    if (this.$onPointerDown) {
      off(this, EVENT_POINTER_DOWN, this.$onPointerDown);
      this.$onPointerDown = null;
    }
    if (this.$onPointerMove) {
      off(this.ownerDocument, EVENT_POINTER_MOVE, this.$onPointerMove);
      this.$onPointerMove = null;
    }
    if (this.$onPointerUp) {
      off(this.ownerDocument, EVENT_POINTER_UP, this.$onPointerUp);
      this.$onPointerUp = null;
    }
    if (this.$onWheel) {
      off(this, EVENT_WHEEL, this.$onWheel, {
        capture: true,
      });
      this.$onWheel = null;
    }
  }
  $handlePointerDown(event) {
    const { buttons, button, type } = event;
    if (
      this.disabled || // Handle pointer or mouse event, and ignore touch event
      (((type === "pointerdown" && event.pointerType === "mouse") || type === "mousedown") && // No primary button (Usually the left button)
        ((isNumber(buttons) && buttons !== 1) || (isNumber(button) && button !== 0) || event.ctrlKey))
    ) {
      return;
    }
    const { $pointers } = this;
    let action = "";
    if (event.changedTouches) {
      Array.from(event.changedTouches).forEach(({ identifier, pageX, pageY }) => {
        $pointers.set(identifier, {
          startX: pageX,
          startY: pageY,
          endX: pageX,
          endY: pageY,
        });
      });
    } else {
      const { pointerId = 0, pageX, pageY } = event;
      $pointers.set(pointerId, {
        startX: pageX,
        startY: pageY,
        endX: pageX,
        endY: pageY,
      });
    }
    if ($pointers.size > 1) {
      action = ACTION_TRANSFORM;
    } else if (isElement(event.target)) {
      action = event.target.action || event.target.getAttribute(ATTRIBUTE_ACTION) || "";
    }
    if (
      this.$emit(EVENT_ACTION_START, {
        action,
        relatedEvent: event,
      }) === false
    ) {
      return;
    }
    event.preventDefault();
    this.$action = action;
    this.style.willChange = "transform";
  }
  $handlePointerMove(event) {
    const { $action, $pointers } = this;
    if (this.disabled || $action === ACTION_NONE || $pointers.size === 0) {
      return;
    }
    if (
      this.$emit(EVENT_ACTION_MOVE, {
        action: $action,
        relatedEvent: event,
      }) === false
    ) {
      return;
    }
    event.preventDefault();
    if (event.changedTouches) {
      Array.from(event.changedTouches).forEach(({ identifier, pageX, pageY }) => {
        const pointer = $pointers.get(identifier);
        if (pointer) {
          Object.assign(pointer, {
            endX: pageX,
            endY: pageY,
          });
        }
      });
    } else {
      const { pointerId = 0, pageX, pageY } = event;
      const pointer = $pointers.get(pointerId);
      if (pointer) {
        Object.assign(pointer, {
          endX: pageX,
          endY: pageY,
        });
      }
    }
    const detail = {
      action: $action,
      relatedEvent: event,
    };
    if ($action === ACTION_TRANSFORM) {
      const pointers2 = new Map($pointers);
      let maxRotateRate = 0;
      let maxScaleRate = 0;
      let rotate = 0;
      let scale = 0;
      let centerX = event.pageX;
      let centerY = event.pageY;
      $pointers.forEach((pointer, pointerId) => {
        pointers2.delete(pointerId);
        pointers2.forEach((pointer2) => {
          let x1 = pointer2.startX - pointer.startX;
          let y1 = pointer2.startY - pointer.startY;
          let x2 = pointer2.endX - pointer.endX;
          let y2 = pointer2.endY - pointer.endY;
          let z1 = 0;
          let z2 = 0;
          let a1 = 0;
          let a2 = 0;
          if (x1 === 0) {
            if (y1 < 0) {
              a1 = Math.PI * 2;
            } else if (y1 > 0) {
              a1 = Math.PI;
            }
          } else if (x1 > 0) {
            a1 = Math.PI / 2 + Math.atan(y1 / x1);
          } else if (x1 < 0) {
            a1 = Math.PI * 1.5 + Math.atan(y1 / x1);
          }
          if (x2 === 0) {
            if (y2 < 0) {
              a2 = Math.PI * 2;
            } else if (y2 > 0) {
              a2 = Math.PI;
            }
          } else if (x2 > 0) {
            a2 = Math.PI / 2 + Math.atan(y2 / x2);
          } else if (x2 < 0) {
            a2 = Math.PI * 1.5 + Math.atan(y2 / x2);
          }
          if (a2 > 0 || a1 > 0) {
            const rotateRate = a2 - a1;
            const absRotateRate = Math.abs(rotateRate);
            if (absRotateRate > maxRotateRate) {
              maxRotateRate = absRotateRate;
              rotate = rotateRate;
              centerX = (pointer.startX + pointer2.startX) / 2;
              centerY = (pointer.startY + pointer2.startY) / 2;
            }
          }
          x1 = Math.abs(x1);
          y1 = Math.abs(y1);
          x2 = Math.abs(x2);
          y2 = Math.abs(y2);
          if (x1 > 0 && y1 > 0) {
            z1 = Math.sqrt(x1 * x1 + y1 * y1);
          } else if (x1 > 0) {
            z1 = x1;
          } else if (y1 > 0) {
            z1 = y1;
          }
          if (x2 > 0 && y2 > 0) {
            z2 = Math.sqrt(x2 * x2 + y2 * y2);
          } else if (x2 > 0) {
            z2 = x2;
          } else if (y2 > 0) {
            z2 = y2;
          }
          if (z1 > 0 && z2 > 0) {
            const scaleRate = (z2 - z1) / z1;
            const absScaleRate = Math.abs(scaleRate);
            if (absScaleRate > maxScaleRate) {
              maxScaleRate = absScaleRate;
              scale = scaleRate;
              centerX = (pointer.startX + pointer2.startX) / 2;
              centerY = (pointer.startY + pointer2.startY) / 2;
            }
          }
        });
      });
      const rotatable = maxRotateRate > 0;
      const scalable = maxScaleRate > 0;
      if (rotatable && scalable) {
        detail.rotate = rotate;
        detail.scale = scale;
        detail.centerX = centerX;
        detail.centerY = centerY;
      } else if (rotatable) {
        detail.action = ACTION_ROTATE;
        detail.rotate = rotate;
        detail.centerX = centerX;
        detail.centerY = centerY;
      } else if (scalable) {
        detail.action = ACTION_SCALE;
        detail.scale = scale;
        detail.centerX = centerX;
        detail.centerY = centerY;
      } else {
        detail.action = ACTION_NONE;
      }
    } else {
      const [pointer] = Array.from($pointers.values());
      Object.assign(detail, pointer);
    }
    $pointers.forEach((pointer) => {
      pointer.startX = pointer.endX;
      pointer.startY = pointer.endY;
    });
    if (detail.action !== ACTION_NONE) {
      this.$emit(EVENT_ACTION, detail, {
        cancelable: false,
      });
    }
  }
  $handlePointerUp(event) {
    const { $action, $pointers } = this;
    if (this.disabled || $action === ACTION_NONE) {
      return;
    }
    if (
      this.$emit(EVENT_ACTION_END, {
        action: $action,
        relatedEvent: event,
      }) === false
    ) {
      return;
    }
    event.preventDefault();
    if (event.changedTouches) {
      Array.from(event.changedTouches).forEach(({ identifier }) => {
        $pointers.delete(identifier);
      });
    } else {
      const { pointerId = 0 } = event;
      $pointers.delete(pointerId);
    }
    if ($pointers.size === 0) {
      this.style.willChange = "";
      this.$action = ACTION_NONE;
    }
  }
  $handleWheel(event) {
    if (this.disabled) {
      return;
    }
    event.preventDefault();
    if (this.$wheeling) {
      return;
    }
    this.$wheeling = true;
    setTimeout(() => {
      this.$wheeling = false;
    }, 50);
    const delta = event.deltaY > 0 ? -1 : 1;
    const scale = delta * this.scaleStep;
    this.$emit(
      EVENT_ACTION,
      {
        action: ACTION_SCALE,
        scale,
        relatedEvent: event,
      },
      {
        cancelable: false,
      },
    );
  }
  /**
   * Changes the current action to a new one.
   * @param {string} action The new action.
   * @returns {CropperCanvas} Returns `this` for chaining.
   */
  $setAction(action) {
    if (isString(action)) {
      this.$action = action;
    }
    return this;
  }
  /**
   * Generates a real canvas element, with the image draw into if there is one.
   * @param {object} [options] The available options.
   * @param {number} [options.width] The width of the canvas.
   * @param {number} [options.height] The height of the canvas.
   * @param {Function} [options.beforeDraw] The function called before drawing the image onto the canvas.
   * @returns {Promise} Returns a promise that resolves to the generated canvas element.
   */
  $toCanvas(options) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error("The current element is not connected to the DOM."));
        return;
      }
      const canvas = document.createElement("canvas");
      let width = this.offsetWidth;
      let height = this.offsetHeight;
      let scale = 1;
      if (isPlainObject(options) && (isPositiveNumber(options.width) || isPositiveNumber(options.height))) {
        ({ width, height } = getAdjustedSizes({
          aspectRatio: width / height,
          width: options.width,
          height: options.height,
        }));
        scale = width / this.offsetWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const cropperImage = this.querySelector(this.$getTagNameOf(CROPPER_IMAGE));
      if (!cropperImage) {
        resolve(canvas);
        return;
      }
      cropperImage
        .$ready()
        .then((image) => {
          const context = canvas.getContext("2d");
          if (context) {
            const [a, b, c, d, e, f] = cropperImage.$getTransform();
            let newE = e;
            let newF = f;
            let destWidth = image.naturalWidth;
            let destHeight = image.naturalHeight;
            if (scale !== 1) {
              newE *= scale;
              newF *= scale;
              destWidth *= scale;
              destHeight *= scale;
            }
            const centerX = destWidth / 2;
            const centerY = destHeight / 2;
            context.fillStyle = "transparent";
            context.fillRect(0, 0, width, height);
            if (isPlainObject(options) && isFunction(options.beforeDraw)) {
              options.beforeDraw.call(this, context, canvas);
            }
            context.save();
            context.translate(centerX, centerY);
            context.transform(a, b, c, d, newE, newF);
            context.translate(-centerX, -centerY);
            context.drawImage(image, 0, 0, destWidth, destHeight);
            context.restore();
          }
          resolve(canvas);
        })
        .catch(reject);
    });
  }
};
CropperCanvas.$name = CROPPER_CANVAS;
CropperCanvas.$version = "2.0.0";

// ../../node_modules/@cropper/element-image/dist/element-image.esm.raw.js
var style3 = `:host{display:inline-block}img{display:block;height:100%;max-height:none!important;max-width:none!important;min-height:0!important;min-width:0!important;width:100%}`;
var canvasCache = /* @__PURE__ */ new WeakMap();
var NATIVE_ATTRIBUTES = [
  "alt",
  "crossorigin",
  "decoding",
  "importance",
  "loading",
  "referrerpolicy",
  "sizes",
  "src",
  "srcset",
];
var CropperImage = class extends CropperElement {
  constructor() {
    super(...arguments);
    this.$matrix = [1, 0, 0, 1, 0, 0];
    this.$onLoad = null;
    this.$onCanvasAction = null;
    this.$onCanvasActionEnd = null;
    this.$onCanvasActionStart = null;
    this.$actionStartTarget = null;
    this.$style = style3;
    this.$image = new Image();
    this.initialCenterSize = "contain";
    this.rotatable = false;
    this.scalable = false;
    this.skewable = false;
    this.slottable = false;
    this.translatable = false;
  }
  set $canvas(element) {
    canvasCache.set(this, element);
  }
  get $canvas() {
    return canvasCache.get(this);
  }
  static get observedAttributes() {
    return super.observedAttributes.concat(NATIVE_ATTRIBUTES, [
      "initial-center-size",
      "rotatable",
      "scalable",
      "skewable",
      "translatable",
    ]);
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (Object.is(newValue, oldValue)) {
      return;
    }
    super.attributeChangedCallback(name, oldValue, newValue);
    if (NATIVE_ATTRIBUTES.includes(name)) {
      this.$image.setAttribute(name, newValue);
    }
  }
  $propertyChangedCallback(name, oldValue, newValue) {
    if (Object.is(newValue, oldValue)) {
      return;
    }
    super.$propertyChangedCallback(name, oldValue, newValue);
    switch (name) {
      case "initialCenterSize":
        this.$nextTick(() => {
          this.$center(newValue);
        });
        break;
    }
  }
  connectedCallback() {
    super.connectedCallback();
    const { $image } = this;
    const $canvas = this.closest(this.$getTagNameOf(CROPPER_CANVAS));
    if ($canvas) {
      this.$canvas = $canvas;
      this.$setStyles({
        // Make it a block element to avoid side effects (#1074).
        display: "block",
        position: "absolute",
      });
      this.$onCanvasActionStart = (event) => {
        var _a, _b;
        this.$actionStartTarget =
          (_b = (_a = event.detail) === null || _a === void 0 ? void 0 : _a.relatedEvent) === null || _b === void 0
            ? void 0
            : _b.target;
      };
      this.$onCanvasActionEnd = () => {
        this.$actionStartTarget = null;
      };
      this.$onCanvasAction = this.$handleAction.bind(this);
      on($canvas, EVENT_ACTION_START, this.$onCanvasActionStart);
      on($canvas, EVENT_ACTION_END, this.$onCanvasActionEnd);
      on($canvas, EVENT_ACTION, this.$onCanvasAction);
    }
    this.$onLoad = this.$handleLoad.bind(this);
    on($image, EVENT_LOAD, this.$onLoad);
    this.$getShadowRoot().appendChild($image);
  }
  disconnectedCallback() {
    const { $image, $canvas } = this;
    if ($canvas) {
      if (this.$onCanvasActionStart) {
        off($canvas, EVENT_ACTION_START, this.$onCanvasActionStart);
        this.$onCanvasActionStart = null;
      }
      if (this.$onCanvasActionEnd) {
        off($canvas, EVENT_ACTION_END, this.$onCanvasActionEnd);
        this.$onCanvasActionEnd = null;
      }
      if (this.$onCanvasAction) {
        off($canvas, EVENT_ACTION, this.$onCanvasAction);
        this.$onCanvasAction = null;
      }
    }
    if ($image && this.$onLoad) {
      off($image, EVENT_LOAD, this.$onLoad);
      this.$onLoad = null;
    }
    this.$getShadowRoot().removeChild($image);
    super.disconnectedCallback();
  }
  $handleLoad() {
    const { $image } = this;
    this.$setStyles({
      width: $image.naturalWidth,
      height: $image.naturalHeight,
    });
    if (this.$canvas) {
      this.$center(this.initialCenterSize);
    }
  }
  $handleAction(event) {
    if (this.hidden || !(this.rotatable || this.scalable || this.translatable)) {
      return;
    }
    const { $canvas } = this;
    const { detail } = event;
    if (detail) {
      const { relatedEvent } = detail;
      let { action } = detail;
      if (action === ACTION_TRANSFORM && (!this.rotatable || !this.scalable)) {
        if (this.rotatable) {
          action = ACTION_ROTATE;
        } else if (this.scalable) {
          action = ACTION_SCALE;
        } else {
          action = ACTION_NONE;
        }
      }
      switch (action) {
        case ACTION_MOVE:
          if (this.translatable) {
            let $selection = null;
            if (relatedEvent) {
              $selection = relatedEvent.target.closest(this.$getTagNameOf(CROPPER_SELECTION));
            }
            if (!$selection) {
              $selection = $canvas.querySelector(this.$getTagNameOf(CROPPER_SELECTION));
            }
            if ($selection && $selection.multiple && !$selection.active) {
              $selection = $canvas.querySelector(`${this.$getTagNameOf(CROPPER_SELECTION)}[active]`);
            }
            if (
              !$selection ||
              $selection.hidden ||
              !$selection.movable ||
              $selection.dynamic ||
              !(this.$actionStartTarget && $selection.contains(this.$actionStartTarget))
            ) {
              this.$move(detail.endX - detail.startX, detail.endY - detail.startY);
            }
          }
          break;
        case ACTION_ROTATE:
          if (this.rotatable) {
            if (relatedEvent) {
              const { x, y } = this.getBoundingClientRect();
              this.$rotate(detail.rotate, relatedEvent.clientX - x, relatedEvent.clientY - y);
            } else {
              this.$rotate(detail.rotate);
            }
          }
          break;
        case ACTION_SCALE:
          if (this.scalable) {
            if (relatedEvent) {
              const $selection = relatedEvent.target.closest(this.$getTagNameOf(CROPPER_SELECTION));
              if (!$selection || !$selection.zoomable || ($selection.zoomable && $selection.dynamic)) {
                const { x, y } = this.getBoundingClientRect();
                this.$zoom(detail.scale, relatedEvent.clientX - x, relatedEvent.clientY - y);
              }
            } else {
              this.$zoom(detail.scale);
            }
          }
          break;
        case ACTION_TRANSFORM:
          if (this.rotatable && this.scalable) {
            const { rotate } = detail;
            let { scale } = detail;
            if (scale < 0) {
              scale = 1 / (1 - scale);
            } else {
              scale += 1;
            }
            const cos = Math.cos(rotate);
            const sin = Math.sin(rotate);
            const [scaleX, skewY, skewX, scaleY] = [cos * scale, sin * scale, -sin * scale, cos * scale];
            if (relatedEvent) {
              const clientRect = this.getBoundingClientRect();
              const x = relatedEvent.clientX - clientRect.x;
              const y = relatedEvent.clientY - clientRect.y;
              const [a, b, c, d] = this.$matrix;
              const originX = clientRect.width / 2;
              const originY = clientRect.height / 2;
              const moveX = x - originX;
              const moveY = y - originY;
              const translateX = (moveX * d - c * moveY) / (a * d - c * b);
              const translateY = (moveY * a - b * moveX) / (a * d - c * b);
              this.$transform(
                scaleX,
                skewY,
                skewX,
                scaleY,
                translateX * (1 - scaleX) + translateY * skewX,
                translateY * (1 - scaleY) + translateX * skewY,
              );
            } else {
              this.$transform(scaleX, skewY, skewX, scaleY, 0, 0);
            }
          }
          break;
      }
    }
  }
  /**
   * Defers the callback to execute after successfully loading the image.
   * @param {Function} [callback] The callback to execute after successfully loading the image.
   * @returns {Promise} Returns a promise that resolves to the image element.
   */
  $ready(callback) {
    const { $image } = this;
    const promise = new Promise((resolve, reject) => {
      const error = new Error("Failed to load the image source");
      if ($image.complete) {
        if ($image.naturalWidth > 0 && $image.naturalHeight > 0) {
          resolve($image);
        } else {
          reject(error);
        }
      } else {
        const onLoad = () => {
          off($image, EVENT_ERROR, onError);
          resolve($image);
        };
        const onError = () => {
          off($image, EVENT_LOAD, onLoad);
          reject(error);
        };
        once($image, EVENT_LOAD, onLoad);
        once($image, EVENT_ERROR, onError);
      }
    });
    if (isFunction(callback)) {
      promise.then((image) => {
        callback(image);
        return image;
      });
    }
    return promise;
  }
  /**
   * Aligns the image to the center of its parent element.
   * @param {string} [size] The size of the image.
   * @returns {CropperImage} Returns `this` for chaining.
   */
  $center(size) {
    const { parentElement } = this;
    if (!parentElement) {
      return this;
    }
    const container = parentElement.getBoundingClientRect();
    const containerWidth = container.width;
    const containerHeight = container.height;
    const { x, y, width, height } = this.getBoundingClientRect();
    const startX = x + width / 2;
    const startY = y + height / 2;
    const endX = container.x + containerWidth / 2;
    const endY = container.y + containerHeight / 2;
    this.$move(endX - startX, endY - startY);
    if (size && (width !== containerWidth || height !== containerHeight)) {
      const scaleX = containerWidth / width;
      const scaleY = containerHeight / height;
      switch (size) {
        case "cover":
          this.$scale(Math.max(scaleX, scaleY));
          break;
        case "contain":
          this.$scale(Math.min(scaleX, scaleY));
          break;
      }
    }
    return this;
  }
  /**
   * Moves the image.
   * @param {number} x The moving distance in the horizontal direction.
   * @param {number} [y] The moving distance in the vertical direction.
   * @returns {CropperImage} Returns `this` for chaining.
   */
  $move(x, y = x) {
    if (this.translatable && isNumber(x) && isNumber(y)) {
      const [a, b, c, d] = this.$matrix;
      const e = (x * d - c * y) / (a * d - c * b);
      const f = (y * a - b * x) / (a * d - c * b);
      this.$translate(e, f);
    }
    return this;
  }
  /**
   * Moves the image to a specific position.
   * @param {number} x The new position in the horizontal direction.
   * @param {number} [y] The new position in the vertical direction.
   * @returns {CropperImage} Returns `this` for chaining.
   */
  $moveTo(x, y = x) {
    if (this.translatable && isNumber(x) && isNumber(y)) {
      const [a, b, c, d] = this.$matrix;
      const e = (x * d - c * y) / (a * d - c * b);
      const f = (y * a - b * x) / (a * d - c * b);
      this.$setTransform(a, b, c, d, e, f);
    }
    return this;
  }
  /**
   * Rotates the image.
   * {@link https://developer.mozilla.org/en-US/docs/Web/CSS/transform-function/rotate}
   * {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/rotate}
   * @param {number|string} angle The rotation angle (in radians).
   * @param {number} [x] The rotation origin in the horizontal, defaults to the center of the image.
   * @param {number} [y] The rotation origin in the vertical, defaults to the center of the image.
   * @returns {CropperImage} Returns `this` for chaining.
   */
  $rotate(angle, x, y) {
    if (this.rotatable) {
      const radian = toAngleInRadian(angle);
      const cos = Math.cos(radian);
      const sin = Math.sin(radian);
      const [scaleX, skewY, skewX, scaleY] = [cos, sin, -sin, cos];
      if (isNumber(x) && isNumber(y)) {
        const [a, b, c, d] = this.$matrix;
        const { width, height } = this.getBoundingClientRect();
        const originX = width / 2;
        const originY = height / 2;
        const moveX = x - originX;
        const moveY = y - originY;
        const translateX = (moveX * d - c * moveY) / (a * d - c * b);
        const translateY = (moveY * a - b * moveX) / (a * d - c * b);
        this.$transform(
          scaleX,
          skewY,
          skewX,
          scaleY,
          translateX * (1 - scaleX) - translateY * skewX,
          translateY * (1 - scaleY) - translateX * skewY,
        );
      } else {
        this.$transform(scaleX, skewY, skewX, scaleY, 0, 0);
      }
    }
    return this;
  }
  /**
   * Zooms the image.
   * @param {number} scale The zoom factor. Positive numbers for zooming in, and negative numbers for zooming out.
   * @param {number} [x] The zoom origin in the horizontal, defaults to the center of the image.
   * @param {number} [y] The zoom origin in the vertical, defaults to the center of the image.
   * @returns {CropperImage} Returns `this` for chaining.
   */
  $zoom(scale, x, y) {
    if (!this.scalable || scale === 0) {
      return this;
    }
    if (scale < 0) {
      scale = 1 / (1 - scale);
    } else {
      scale += 1;
    }
    if (isNumber(x) && isNumber(y)) {
      const [a, b, c, d] = this.$matrix;
      const { width, height } = this.getBoundingClientRect();
      const originX = width / 2;
      const originY = height / 2;
      const moveX = x - originX;
      const moveY = y - originY;
      const translateX = (moveX * d - c * moveY) / (a * d - c * b);
      const translateY = (moveY * a - b * moveX) / (a * d - c * b);
      this.$transform(scale, 0, 0, scale, translateX * (1 - scale), translateY * (1 - scale));
    } else {
      this.$scale(scale);
    }
    return this;
  }
  /**
   * Scales the image.
   * {@link https://developer.mozilla.org/en-US/docs/Web/CSS/transform-function/scale}
   * {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/scale}
   * @param {number} x The scaling factor in the horizontal direction.
   * @param {number} [y] The scaling factor in the vertical direction.
   * @returns {CropperImage} Returns `this` for chaining.
   */
  $scale(x, y = x) {
    if (this.scalable) {
      this.$transform(x, 0, 0, y, 0, 0);
    }
    return this;
  }
  /**
   * Skews the image.
   * {@link https://developer.mozilla.org/en-US/docs/Web/CSS/transform-function/skew}
   * {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/transform}
   * @param {number|string} x The skewing angle in the horizontal direction.
   * @param {number|string} [y] The skewing angle in the vertical direction.
   * @returns {CropperImage} Returns `this` for chaining.
   */
  $skew(x, y = 0) {
    if (this.skewable) {
      const radianX = toAngleInRadian(x);
      const radianY = toAngleInRadian(y);
      this.$transform(1, Math.tan(radianY), Math.tan(radianX), 1, 0, 0);
    }
    return this;
  }
  /**
   * Translates the image.
   * {@link https://developer.mozilla.org/en-US/docs/Web/CSS/transform-function/translate}
   * {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/translate}
   * @param {number} x The translating distance in the horizontal direction.
   * @param {number} [y] The translating distance in the vertical direction.
   * @returns {CropperImage} Returns `this` for chaining.
   */
  $translate(x, y = x) {
    if (this.translatable && isNumber(x) && isNumber(y)) {
      this.$transform(1, 0, 0, 1, x, y);
    }
    return this;
  }
  /**
   * Transforms the image.
   * {@link https://developer.mozilla.org/en-US/docs/Web/CSS/transform-function/matrix}
   * {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/transform}
   * @param {number} a The scaling factor in the horizontal direction.
   * @param {number} b The skewing angle in the vertical direction.
   * @param {number} c The skewing angle in the horizontal direction.
   * @param {number} d The scaling factor in the vertical direction.
   * @param {number} e The translating distance in the horizontal direction.
   * @param {number} f The translating distance in the vertical direction.
   * @returns {CropperImage} Returns `this` for chaining.
   */
  $transform(a, b, c, d, e, f) {
    if (isNumber(a) && isNumber(b) && isNumber(c) && isNumber(d) && isNumber(e) && isNumber(f)) {
      return this.$setTransform(multiplyMatrices(this.$matrix, [a, b, c, d, e, f]));
    }
    return this;
  }
  /**
   * Resets (overrides) the current transform to the specific identity matrix.
   * {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/setTransform}
   * @param {number|Array} a The scaling factor in the horizontal direction.
   * @param {number} b The skewing angle in the vertical direction.
   * @param {number} c The skewing angle in the horizontal direction.
   * @param {number} d The scaling factor in the vertical direction.
   * @param {number} e The translating distance in the horizontal direction.
   * @param {number} f The translating distance in the vertical direction.
   * @returns {CropperImage} Returns `this` for chaining.
   */
  $setTransform(a, b, c, d, e, f) {
    if (this.rotatable || this.scalable || this.skewable || this.translatable) {
      if (Array.isArray(a)) {
        [a, b, c, d, e, f] = a;
      }
      if (isNumber(a) && isNumber(b) && isNumber(c) && isNumber(d) && isNumber(e) && isNumber(f)) {
        const oldMatrix = [...this.$matrix];
        const newMatrix = [a, b, c, d, e, f];
        if (
          this.$emit(EVENT_TRANSFORM, {
            matrix: newMatrix,
            oldMatrix,
          }) === false
        ) {
          return this;
        }
        this.$matrix = newMatrix;
        this.style.transform = `matrix(${newMatrix.join(", ")})`;
      }
    }
    return this;
  }
  /**
   * Retrieves the current transformation matrix being applied to the element.
   * {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/getTransform}
   * @returns {Array} Returns the readonly transformation matrix.
   */
  $getTransform() {
    return this.$matrix.slice();
  }
  /**
   * Resets the current transform to the initial identity matrix.
   * {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/resetTransform}
   * @returns {CropperImage} Returns `this` for chaining.
   */
  $resetTransform() {
    return this.$setTransform([1, 0, 0, 1, 0, 0]);
  }
};
CropperImage.$name = CROPPER_IMAGE;
CropperImage.$version = "2.0.0";

// ../../node_modules/@cropper/element-shade/dist/element-shade.esm.raw.js
var style4 = `:host{display:block;height:0;left:0;outline:var(--theme-color) solid 1px;position:relative;top:0;width:0}:host([transparent]){outline-color:transparent}`;
var canvasCache2 = /* @__PURE__ */ new WeakMap();
var CropperShade = class extends CropperElement {
  constructor() {
    super(...arguments);
    this.$onCanvasChange = null;
    this.$onCanvasActionEnd = null;
    this.$onCanvasActionStart = null;
    this.$style = style4;
    this.x = 0;
    this.y = 0;
    this.width = 0;
    this.height = 0;
    this.slottable = false;
    this.themeColor = "rgba(0, 0, 0, 0.65)";
  }
  set $canvas(element) {
    canvasCache2.set(this, element);
  }
  get $canvas() {
    return canvasCache2.get(this);
  }
  static get observedAttributes() {
    return super.observedAttributes.concat(["height", "width", "x", "y"]);
  }
  connectedCallback() {
    super.connectedCallback();
    const $canvas = this.closest(this.$getTagNameOf(CROPPER_CANVAS));
    if ($canvas) {
      this.$canvas = $canvas;
      this.style.position = "absolute";
      const $selection = $canvas.querySelector(this.$getTagNameOf(CROPPER_SELECTION));
      if ($selection) {
        this.$onCanvasActionStart = (event) => {
          if ($selection.hidden && event.detail.action === ACTION_SELECT) {
            this.hidden = false;
          }
        };
        this.$onCanvasActionEnd = (event) => {
          if ($selection.hidden && event.detail.action === ACTION_SELECT) {
            this.hidden = true;
          }
        };
        this.$onCanvasChange = (event) => {
          const { x, y, width, height } = event.detail;
          this.$change(x, y, width, height);
          if ($selection.hidden || (x === 0 && y === 0 && width === 0 && height === 0)) {
            this.hidden = true;
          }
        };
        on($canvas, EVENT_ACTION_START, this.$onCanvasActionStart);
        on($canvas, EVENT_ACTION_END, this.$onCanvasActionEnd);
        on($canvas, EVENT_CHANGE, this.$onCanvasChange);
      }
    }
    this.$render();
  }
  disconnectedCallback() {
    const { $canvas } = this;
    if ($canvas) {
      if (this.$onCanvasActionStart) {
        off($canvas, EVENT_ACTION_START, this.$onCanvasActionStart);
        this.$onCanvasActionStart = null;
      }
      if (this.$onCanvasActionEnd) {
        off($canvas, EVENT_ACTION_END, this.$onCanvasActionEnd);
        this.$onCanvasActionEnd = null;
      }
      if (this.$onCanvasChange) {
        off($canvas, EVENT_CHANGE, this.$onCanvasChange);
        this.$onCanvasChange = null;
      }
    }
    super.disconnectedCallback();
  }
  /**
   * Changes the position and/or size of the shade.
   * @param {number} x The new position in the horizontal direction.
   * @param {number} y The new position in the vertical direction.
   * @param {number} [width] The new width.
   * @param {number} [height] The new height.
   * @returns {CropperShade} Returns `this` for chaining.
   */
  $change(x, y, width = this.width, height = this.height) {
    if (
      !isNumber(x) ||
      !isNumber(y) ||
      !isNumber(width) ||
      !isNumber(height) ||
      (x === this.x && y === this.y && width === this.width && height === this.height)
    ) {
      return this;
    }
    if (this.hidden) {
      this.hidden = false;
    }
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    return this.$render();
  }
  /**
   * Resets the shade to its initial position and size.
   * @returns {CropperShade} Returns `this` for chaining.
   */
  $reset() {
    return this.$change(0, 0, 0, 0);
  }
  /**
   * Refreshes the position or size of the shade.
   * @returns {CropperShade} Returns `this` for chaining.
   */
  $render() {
    return this.$setStyles({
      transform: `translate(${this.x}px, ${this.y}px)`,
      width: this.width,
      height: this.height,
      outlineWidth: WINDOW.innerWidth,
    });
  }
};
CropperShade.$name = CROPPER_SHADE;
CropperShade.$version = "2.0.0";

// ../../node_modules/@cropper/element-handle/dist/element-handle.esm.raw.js
var style5 = `:host{background-color:var(--theme-color);display:block}:host([action=move]),:host([action=select]){height:100%;left:0;position:absolute;top:0;width:100%}:host([action=move]){cursor:move}:host([action=select]){cursor:crosshair}:host([action$=-resize]){background-color:transparent;height:15px;position:absolute;width:15px}:host([action$=-resize]):after{background-color:var(--theme-color);content:"";display:block;height:5px;left:50%;position:absolute;top:50%;transform:translate(-50%,-50%);width:5px}:host([action=n-resize]),:host([action=s-resize]){cursor:ns-resize;left:50%;transform:translateX(-50%);width:100%}:host([action=n-resize]){top:-8px}:host([action=s-resize]){bottom:-8px}:host([action=e-resize]),:host([action=w-resize]){cursor:ew-resize;height:100%;top:50%;transform:translateY(-50%)}:host([action=e-resize]){right:-8px}:host([action=w-resize]){left:-8px}:host([action=ne-resize]){cursor:nesw-resize;right:-8px;top:-8px}:host([action=nw-resize]){cursor:nwse-resize;left:-8px;top:-8px}:host([action=se-resize]){bottom:-8px;cursor:nwse-resize;right:-8px}:host([action=se-resize]):after{height:15px;width:15px}@media (pointer:coarse){:host([action=se-resize]):after{height:10px;width:10px}}@media (pointer:fine){:host([action=se-resize]):after{height:5px;width:5px}}:host([action=sw-resize]){bottom:-8px;cursor:nesw-resize;left:-8px}:host([plain]){background-color:transparent}`;
var CropperHandle = class extends CropperElement {
  constructor() {
    super(...arguments);
    this.$onCanvasCropEnd = null;
    this.$onCanvasCropStart = null;
    this.$style = style5;
    this.action = ACTION_NONE;
    this.plain = false;
    this.slottable = false;
    this.themeColor = "rgba(51, 153, 255, 0.5)";
  }
  static get observedAttributes() {
    return super.observedAttributes.concat(["action", "plain"]);
  }
};
CropperHandle.$name = CROPPER_HANDLE;
CropperHandle.$version = "2.0.0";

// ../../node_modules/@cropper/element-selection/dist/element-selection.esm.raw.js
var style6 = `:host{display:block;left:0;position:relative;right:0}:host([outlined]){outline:1px solid var(--theme-color)}:host([multiple]){outline:1px dashed hsla(0,0%,100%,.5)}:host([multiple]):after{bottom:0;content:"";cursor:pointer;display:block;left:0;position:absolute;right:0;top:0}:host([multiple][active]){outline-color:var(--theme-color);z-index:1}:host([multiple])>*{visibility:hidden}:host([multiple][active])>*{visibility:visible}:host([multiple][active]):after{display:none}`;
var canvasCache3 = /* @__PURE__ */ new WeakMap();
var CropperSelection = class extends CropperElement {
  constructor() {
    super(...arguments);
    this.$onCanvasAction = null;
    this.$onCanvasActionStart = null;
    this.$onCanvasActionEnd = null;
    this.$onDocumentKeyDown = null;
    this.$action = "";
    this.$actionStartTarget = null;
    this.$changing = false;
    this.$style = style6;
    this.$initialSelection = {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    };
    this.x = 0;
    this.y = 0;
    this.width = 0;
    this.height = 0;
    this.aspectRatio = NaN;
    this.initialAspectRatio = NaN;
    this.initialCoverage = NaN;
    this.active = false;
    this.linked = false;
    this.dynamic = false;
    this.movable = false;
    this.resizable = false;
    this.zoomable = false;
    this.multiple = false;
    this.keyboard = false;
    this.outlined = false;
    this.precise = false;
  }
  set $canvas(element) {
    canvasCache3.set(this, element);
  }
  get $canvas() {
    return canvasCache3.get(this);
  }
  static get observedAttributes() {
    return super.observedAttributes.concat([
      "active",
      "aspect-ratio",
      "dynamic",
      "height",
      "initial-aspect-ratio",
      "initial-coverage",
      "keyboard",
      "linked",
      "movable",
      "multiple",
      "outlined",
      "precise",
      "resizable",
      "width",
      "x",
      "y",
      "zoomable",
    ]);
  }
  $propertyChangedCallback(name, oldValue, newValue) {
    if (Object.is(newValue, oldValue)) {
      return;
    }
    super.$propertyChangedCallback(name, oldValue, newValue);
    switch (name) {
      case "x":
      case "y":
      case "width":
      case "height":
        if (!this.$changing) {
          this.$nextTick(() => {
            this.$change(this.x, this.y, this.width, this.height, this.aspectRatio, true);
          });
        }
        break;
      case "aspectRatio":
      case "initialAspectRatio":
        this.$nextTick(() => {
          this.$initSelection();
        });
        break;
      case "initialCoverage":
        this.$nextTick(() => {
          if (isPositiveNumber(newValue) && newValue <= 1) {
            this.$initSelection(true, true);
          }
        });
        break;
      case "keyboard":
        this.$nextTick(() => {
          if (this.$canvas) {
            if (newValue) {
              if (!this.$onDocumentKeyDown) {
                this.$onDocumentKeyDown = this.$handleKeyDown.bind(this);
                on(this.ownerDocument, EVENT_KEYDOWN, this.$onDocumentKeyDown);
              }
            } else if (this.$onDocumentKeyDown) {
              off(this.ownerDocument, EVENT_KEYDOWN, this.$onDocumentKeyDown);
              this.$onDocumentKeyDown = null;
            }
          }
        });
        break;
      case "multiple":
        this.$nextTick(() => {
          if (this.$canvas) {
            const selections = this.$getSelections();
            if (newValue) {
              selections.forEach((selection) => {
                selection.active = false;
              });
              this.active = true;
              this.$emit(EVENT_CHANGE, {
                x: this.x,
                y: this.y,
                width: this.width,
                height: this.height,
              });
            } else {
              this.active = false;
              selections.slice(1).forEach((selection) => {
                this.$removeSelection(selection);
              });
            }
          }
        });
        break;
      case "precise":
        this.$nextTick(() => {
          this.$change(this.x, this.y);
        });
        break;
      // Backwards compatible with 2.0.0-rc
      case "linked":
        if (newValue) {
          this.dynamic = true;
        }
        break;
    }
  }
  connectedCallback() {
    super.connectedCallback();
    const $canvas = this.closest(this.$getTagNameOf(CROPPER_CANVAS));
    if ($canvas) {
      this.$canvas = $canvas;
      this.$setStyles({
        position: "absolute",
        transform: `translate(${this.x}px, ${this.y}px)`,
      });
      if (!this.hidden) {
        this.$render();
      }
      this.$initSelection(true);
      this.$onCanvasActionStart = this.$handleActionStart.bind(this);
      this.$onCanvasActionEnd = this.$handleActionEnd.bind(this);
      this.$onCanvasAction = this.$handleAction.bind(this);
      on($canvas, EVENT_ACTION_START, this.$onCanvasActionStart);
      on($canvas, EVENT_ACTION_END, this.$onCanvasActionEnd);
      on($canvas, EVENT_ACTION, this.$onCanvasAction);
    } else {
      this.$render();
    }
  }
  disconnectedCallback() {
    const { $canvas } = this;
    if ($canvas) {
      if (this.$onCanvasActionStart) {
        off($canvas, EVENT_ACTION_START, this.$onCanvasActionStart);
        this.$onCanvasActionStart = null;
      }
      if (this.$onCanvasActionEnd) {
        off($canvas, EVENT_ACTION_END, this.$onCanvasActionEnd);
        this.$onCanvasActionEnd = null;
      }
      if (this.$onCanvasAction) {
        off($canvas, EVENT_ACTION, this.$onCanvasAction);
        this.$onCanvasAction = null;
      }
    }
    super.disconnectedCallback();
  }
  $getSelections() {
    let selections = [];
    if (this.parentElement) {
      selections = Array.from(this.parentElement.querySelectorAll(this.$getTagNameOf(CROPPER_SELECTION)));
    }
    return selections;
  }
  $initSelection(center = false, resize = false) {
    const { initialCoverage, parentElement } = this;
    if (isPositiveNumber(initialCoverage) && parentElement) {
      const aspectRatio = this.aspectRatio || this.initialAspectRatio;
      let width = (resize ? 0 : this.width) || parentElement.offsetWidth * initialCoverage;
      let height = (resize ? 0 : this.height) || parentElement.offsetHeight * initialCoverage;
      if (isPositiveNumber(aspectRatio)) {
        ({ width, height } = getAdjustedSizes({ aspectRatio, width, height }));
      }
      this.$change(this.x, this.y, width, height);
      if (center) {
        this.$center();
      }
      this.$initialSelection = {
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,
      };
    }
  }
  $createSelection() {
    const newSelection = this.cloneNode(true);
    if (this.hasAttribute("id")) {
      newSelection.removeAttribute("id");
    }
    newSelection.initialCoverage = NaN;
    this.active = false;
    if (this.parentElement) {
      this.parentElement.insertBefore(newSelection, this.nextSibling);
    }
    return newSelection;
  }
  $removeSelection(selection = this) {
    if (this.parentElement) {
      const selections = this.$getSelections();
      if (selections.length > 1) {
        const index = selections.indexOf(selection);
        const activeSelection = selections[index + 1] || selections[index - 1];
        if (activeSelection) {
          selection.active = false;
          this.parentElement.removeChild(selection);
          activeSelection.active = true;
          activeSelection.$emit(EVENT_CHANGE, {
            x: activeSelection.x,
            y: activeSelection.y,
            width: activeSelection.width,
            height: activeSelection.height,
          });
        }
      } else {
        this.$clear();
      }
    }
  }
  $handleActionStart(event) {
    var _a, _b;
    const relatedTarget =
      (_b = (_a = event.detail) === null || _a === void 0 ? void 0 : _a.relatedEvent) === null || _b === void 0
        ? void 0
        : _b.target;
    this.$action = "";
    this.$actionStartTarget = relatedTarget;
    if (!this.hidden && this.multiple && !this.active && relatedTarget === this && this.parentElement) {
      this.$getSelections().forEach((selection) => {
        selection.active = false;
      });
      this.active = true;
      this.$emit(EVENT_CHANGE, {
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,
      });
    }
  }
  $handleAction(event) {
    const { currentTarget, detail } = event;
    if (!currentTarget || !detail) {
      return;
    }
    const { relatedEvent } = detail;
    let { action } = detail;
    if (!action && this.multiple) {
      action = this.$action || (relatedEvent === null || relatedEvent === void 0 ? void 0 : relatedEvent.target.action);
      this.$action = action;
    }
    if (
      !action ||
      (this.hidden && action !== ACTION_SELECT) ||
      (this.multiple && !this.active && action !== ACTION_SCALE)
    ) {
      return;
    }
    const moveX = detail.endX - detail.startX;
    const moveY = detail.endY - detail.startY;
    const { width, height } = this;
    let { aspectRatio } = this;
    if (!isPositiveNumber(aspectRatio) && relatedEvent.shiftKey) {
      aspectRatio = isPositiveNumber(width) && isPositiveNumber(height) ? width / height : 1;
    }
    switch (action) {
      case ACTION_SELECT:
        if (moveX !== 0 && moveY !== 0) {
          const { $canvas } = this;
          const offset = getOffset(currentTarget);
          (this.multiple && !this.hidden ? this.$createSelection() : this).$change(
            detail.startX - offset.left,
            detail.startY - offset.top,
            Math.abs(moveX),
            Math.abs(moveY),
            aspectRatio,
          );
          if (moveX < 0) {
            if (moveY < 0) {
              action = ACTION_RESIZE_NORTHWEST;
            } else if (moveY > 0) {
              action = ACTION_RESIZE_SOUTHWEST;
            }
          } else if (moveX > 0) {
            if (moveY < 0) {
              action = ACTION_RESIZE_NORTHEAST;
            } else if (moveY > 0) {
              action = ACTION_RESIZE_SOUTHEAST;
            }
          }
          if ($canvas) {
            $canvas.$action = action;
          }
        }
        break;
      case ACTION_MOVE:
        if (this.movable && (this.dynamic || (this.$actionStartTarget && this.contains(this.$actionStartTarget)))) {
          this.$move(moveX, moveY);
        }
        break;
      case ACTION_SCALE:
        if (relatedEvent && this.zoomable && (this.dynamic || this.contains(relatedEvent.target))) {
          const offset = getOffset(currentTarget);
          this.$zoom(detail.scale, relatedEvent.pageX - offset.left, relatedEvent.pageY - offset.top);
        }
        break;
      default:
        this.$resize(action, moveX, moveY, aspectRatio);
    }
  }
  $handleActionEnd() {
    this.$action = "";
    this.$actionStartTarget = null;
  }
  $handleKeyDown(event) {
    if (this.hidden || !this.keyboard || (this.multiple && !this.active) || event.defaultPrevented) {
      return;
    }
    const { activeElement } = document;
    if (
      activeElement &&
      (["INPUT", "TEXTAREA"].includes(activeElement.tagName) ||
        ["true", "plaintext-only"].includes(activeElement.contentEditable))
    ) {
      return;
    }
    switch (event.key) {
      case "Backspace":
        if (event.metaKey) {
          event.preventDefault();
          this.$removeSelection();
        }
        break;
      case "Delete":
        event.preventDefault();
        this.$removeSelection();
        break;
      // Move to the left
      case "ArrowLeft":
        event.preventDefault();
        this.$move(-1, 0);
        break;
      // Move to the right
      case "ArrowRight":
        event.preventDefault();
        this.$move(1, 0);
        break;
      // Move to the top
      case "ArrowUp":
        event.preventDefault();
        this.$move(0, -1);
        break;
      // Move to the bottom
      case "ArrowDown":
        event.preventDefault();
        this.$move(0, 1);
        break;
      case "+":
        event.preventDefault();
        this.$zoom(0.1);
        break;
      case "-":
        event.preventDefault();
        this.$zoom(-0.1);
        break;
    }
  }
  /**
   * Aligns the selection to the center of its parent element.
   * @returns {CropperSelection} Returns `this` for chaining.
   */
  $center() {
    const { parentElement } = this;
    if (!parentElement) {
      return this;
    }
    const x = (parentElement.offsetWidth - this.width) / 2;
    const y = (parentElement.offsetHeight - this.height) / 2;
    return this.$change(x, y);
  }
  /**
   * Moves the selection.
   * @param {number} x The moving distance in the horizontal direction.
   * @param {number} [y] The moving distance in the vertical direction.
   * @returns {CropperSelection} Returns `this` for chaining.
   */
  $move(x, y = x) {
    return this.$moveTo(this.x + x, this.y + y);
  }
  /**
   * Moves the selection to a specific position.
   * @param {number} x The new position in the horizontal direction.
   * @param {number} [y] The new position in the vertical direction.
   * @returns {CropperSelection} Returns `this` for chaining.
   */
  $moveTo(x, y = x) {
    if (!this.movable) {
      return this;
    }
    return this.$change(x, y);
  }
  /**
   * Adjusts the size the selection on a specific side or corner.
   * @param {string} action Indicates the side or corner to resize.
   * @param {number} [offsetX] The horizontal offset of the specific side or corner.
   * @param {number} [offsetY] The vertical offset of the specific side or corner.
   * @param {number} [aspectRatio] The aspect ratio for computing the new size if it is necessary.
   * @returns {CropperSelection} Returns `this` for chaining.
   */
  $resize(action, offsetX = 0, offsetY = 0, aspectRatio = this.aspectRatio) {
    if (!this.resizable) {
      return this;
    }
    const hasValidAspectRatio = isPositiveNumber(aspectRatio);
    const { $canvas } = this;
    let { x, y, width, height } = this;
    switch (action) {
      case ACTION_RESIZE_NORTH:
        y += offsetY;
        height -= offsetY;
        if (height < 0) {
          action = ACTION_RESIZE_SOUTH;
          height = -height;
          y -= height;
        }
        if (hasValidAspectRatio) {
          offsetX = offsetY * aspectRatio;
          x += offsetX / 2;
          width -= offsetX;
          if (width < 0) {
            width = -width;
            x -= width;
          }
        }
        break;
      case ACTION_RESIZE_EAST:
        width += offsetX;
        if (width < 0) {
          action = ACTION_RESIZE_WEST;
          width = -width;
          x -= width;
        }
        if (hasValidAspectRatio) {
          offsetY = offsetX / aspectRatio;
          y -= offsetY / 2;
          height += offsetY;
          if (height < 0) {
            height = -height;
            y -= height;
          }
        }
        break;
      case ACTION_RESIZE_SOUTH:
        height += offsetY;
        if (height < 0) {
          action = ACTION_RESIZE_NORTH;
          height = -height;
          y -= height;
        }
        if (hasValidAspectRatio) {
          offsetX = offsetY * aspectRatio;
          x -= offsetX / 2;
          width += offsetX;
          if (width < 0) {
            width = -width;
            x -= width;
          }
        }
        break;
      case ACTION_RESIZE_WEST:
        x += offsetX;
        width -= offsetX;
        if (width < 0) {
          action = ACTION_RESIZE_EAST;
          width = -width;
          x -= width;
        }
        if (hasValidAspectRatio) {
          offsetY = offsetX / aspectRatio;
          y += offsetY / 2;
          height -= offsetY;
          if (height < 0) {
            height = -height;
            y -= height;
          }
        }
        break;
      case ACTION_RESIZE_NORTHEAST:
        if (hasValidAspectRatio) {
          offsetY = -offsetX / aspectRatio;
        }
        y += offsetY;
        height -= offsetY;
        width += offsetX;
        if (width < 0 && height < 0) {
          action = ACTION_RESIZE_SOUTHWEST;
          width = -width;
          height = -height;
          x -= width;
          y -= height;
        } else if (width < 0) {
          action = ACTION_RESIZE_NORTHWEST;
          width = -width;
          x -= width;
        } else if (height < 0) {
          action = ACTION_RESIZE_SOUTHEAST;
          height = -height;
          y -= height;
        }
        break;
      case ACTION_RESIZE_NORTHWEST:
        if (hasValidAspectRatio) {
          offsetY = offsetX / aspectRatio;
        }
        x += offsetX;
        y += offsetY;
        width -= offsetX;
        height -= offsetY;
        if (width < 0 && height < 0) {
          action = ACTION_RESIZE_SOUTHEAST;
          width = -width;
          height = -height;
          x -= width;
          y -= height;
        } else if (width < 0) {
          action = ACTION_RESIZE_NORTHEAST;
          width = -width;
          x -= width;
        } else if (height < 0) {
          action = ACTION_RESIZE_SOUTHWEST;
          height = -height;
          y -= height;
        }
        break;
      case ACTION_RESIZE_SOUTHEAST:
        if (hasValidAspectRatio) {
          offsetY = offsetX / aspectRatio;
        }
        width += offsetX;
        height += offsetY;
        if (width < 0 && height < 0) {
          action = ACTION_RESIZE_NORTHWEST;
          width = -width;
          height = -height;
          x -= width;
          y -= height;
        } else if (width < 0) {
          action = ACTION_RESIZE_SOUTHWEST;
          width = -width;
          x -= width;
        } else if (height < 0) {
          action = ACTION_RESIZE_NORTHEAST;
          height = -height;
          y -= height;
        }
        break;
      case ACTION_RESIZE_SOUTHWEST:
        if (hasValidAspectRatio) {
          offsetY = -offsetX / aspectRatio;
        }
        x += offsetX;
        width -= offsetX;
        height += offsetY;
        if (width < 0 && height < 0) {
          action = ACTION_RESIZE_NORTHEAST;
          width = -width;
          height = -height;
          x -= width;
          y -= height;
        } else if (width < 0) {
          action = ACTION_RESIZE_SOUTHEAST;
          width = -width;
          x -= width;
        } else if (height < 0) {
          action = ACTION_RESIZE_NORTHWEST;
          height = -height;
          y -= height;
        }
        break;
    }
    if ($canvas) {
      $canvas.$setAction(action);
    }
    return this.$change(x, y, width, height);
  }
  /**
   * Zooms the selection.
   * @param {number} scale The zoom factor. Positive numbers for zooming in, and negative numbers for zooming out.
   * @param {number} [x] The zoom origin in the horizontal, defaults to the center of the selection.
   * @param {number} [y] The zoom origin in the vertical, defaults to the center of the selection.
   * @returns {CropperSelection} Returns `this` for chaining.
   */
  $zoom(scale, x, y) {
    if (!this.zoomable || scale === 0) {
      return this;
    }
    if (scale < 0) {
      scale = 1 / (1 - scale);
    } else {
      scale += 1;
    }
    const { width, height } = this;
    const newWidth = width * scale;
    const newHeight = height * scale;
    let newX = this.x;
    let newY = this.y;
    if (isNumber(x) && isNumber(y)) {
      newX -= (newWidth - width) * ((x - this.x) / width);
      newY -= (newHeight - height) * ((y - this.y) / height);
    } else {
      newX -= (newWidth - width) / 2;
      newY -= (newHeight - height) / 2;
    }
    return this.$change(newX, newY, newWidth, newHeight);
  }
  /**
   * Changes the position and/or size of the selection.
   * @param {number} x The new position in the horizontal direction.
   * @param {number} y The new position in the vertical direction.
   * @param {number} [width] The new width.
   * @param {number} [height] The new height.
   * @param {number} [aspectRatio] The new aspect ratio for this change only.
   * @param {number} [_force] Force change.
   * @returns {CropperSelection} Returns `this` for chaining.
   */
  $change(x, y, width = this.width, height = this.height, aspectRatio = this.aspectRatio, _force = false) {
    if (
      this.$changing ||
      !isNumber(x) ||
      !isNumber(y) ||
      !isNumber(width) ||
      !isNumber(height) ||
      width < 0 ||
      height < 0
    ) {
      return this;
    }
    if (isPositiveNumber(aspectRatio)) {
      ({ width, height } = getAdjustedSizes({ aspectRatio, width, height }, "cover"));
    }
    if (!this.precise) {
      x = Math.round(x);
      y = Math.round(y);
      width = Math.round(width);
      height = Math.round(height);
    }
    if (
      x === this.x &&
      y === this.y &&
      width === this.width &&
      height === this.height &&
      Object.is(aspectRatio, this.aspectRatio) &&
      !_force
    ) {
      return this;
    }
    if (this.hidden) {
      this.hidden = false;
    }
    if (
      this.$emit(EVENT_CHANGE, {
        x,
        y,
        width,
        height,
      }) === false
    ) {
      return this;
    }
    this.$changing = true;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.$changing = false;
    return this.$render();
  }
  /**
   * Resets the selection to its initial position and size.
   * @returns {CropperSelection} Returns `this` for chaining.
   */
  $reset() {
    const { x, y, width, height } = this.$initialSelection;
    return this.$change(x, y, width, height);
  }
  /**
   * Clears the selection.
   * @returns {CropperSelection} Returns `this` for chaining.
   */
  $clear() {
    this.$change(0, 0, 0, 0, NaN, true);
    this.hidden = true;
    return this;
  }
  /**
   * Refreshes the position or size of the selection.
   * @returns {CropperSelection} Returns `this` for chaining.
   */
  $render() {
    return this.$setStyles({
      transform: `translate(${this.x}px, ${this.y}px)`,
      width: this.width,
      height: this.height,
    });
  }
  /**
   * Generates a real canvas element, with the image (selected area only) draw into if there is one.
   * @param {object} [options] The available options.
   * @param {number} [options.width] The width of the canvas.
   * @param {number} [options.height] The height of the canvas.
   * @param {Function} [options.beforeDraw] The function called before drawing the image onto the canvas.
   * @returns {Promise} Returns a promise that resolves to the generated canvas element.
   */
  $toCanvas(options) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error("The current element is not connected to the DOM."));
        return;
      }
      const canvas = document.createElement("canvas");
      let { width, height } = this;
      let scale = 1;
      if (isPlainObject(options) && (isPositiveNumber(options.width) || isPositiveNumber(options.height))) {
        ({ width, height } = getAdjustedSizes({
          aspectRatio: width / height,
          width: options.width,
          height: options.height,
        }));
        scale = width / this.width;
      }
      canvas.width = width;
      canvas.height = height;
      if (!this.$canvas) {
        resolve(canvas);
        return;
      }
      const cropperImage = this.$canvas.querySelector(this.$getTagNameOf(CROPPER_IMAGE));
      if (!cropperImage) {
        resolve(canvas);
        return;
      }
      cropperImage
        .$ready()
        .then((image) => {
          const context = canvas.getContext("2d");
          if (context) {
            const [a, b, c, d, e, f] = cropperImage.$getTransform();
            const offsetX = -this.x;
            const offsetY = -this.y;
            const translateX = (offsetX * d - c * offsetY) / (a * d - c * b);
            const translateY = (offsetY * a - b * offsetX) / (a * d - c * b);
            let newE = a * translateX + c * translateY + e;
            let newF = b * translateX + d * translateY + f;
            let destWidth = image.naturalWidth;
            let destHeight = image.naturalHeight;
            if (scale !== 1) {
              newE *= scale;
              newF *= scale;
              destWidth *= scale;
              destHeight *= scale;
            }
            const centerX = destWidth / 2;
            const centerY = destHeight / 2;
            context.fillStyle = "transparent";
            context.fillRect(0, 0, width, height);
            if (isPlainObject(options) && isFunction(options.beforeDraw)) {
              options.beforeDraw.call(this, context, canvas);
            }
            context.save();
            context.translate(centerX, centerY);
            context.transform(a, b, c, d, newE, newF);
            context.translate(-centerX, -centerY);
            context.drawImage(image, 0, 0, destWidth, destHeight);
            context.restore();
          }
          resolve(canvas);
        })
        .catch(reject);
    });
  }
};
CropperSelection.$name = CROPPER_SELECTION;
CropperSelection.$version = "2.0.0";

// ../../node_modules/@cropper/element-grid/dist/element-grid.esm.raw.js
var style7 = `:host{display:flex;flex-direction:column;position:relative;touch-action:none;-webkit-user-select:none;-moz-user-select:none;user-select:none}:host([bordered]){border:1px dashed var(--theme-color)}:host([covered]){bottom:0;left:0;position:absolute;right:0;top:0}:host>span{display:flex;flex:1}:host>span+span{border-top:1px dashed var(--theme-color)}:host>span>span{flex:1}:host>span>span+span{border-left:1px dashed var(--theme-color)}`;
var CropperGrid = class extends CropperElement {
  constructor() {
    super(...arguments);
    this.$style = style7;
    this.bordered = false;
    this.columns = 3;
    this.covered = false;
    this.rows = 3;
    this.slottable = false;
    this.themeColor = "rgba(238, 238, 238, 0.5)";
  }
  static get observedAttributes() {
    return super.observedAttributes.concat(["bordered", "columns", "covered", "rows"]);
  }
  $propertyChangedCallback(name, oldValue, newValue) {
    if (Object.is(newValue, oldValue)) {
      return;
    }
    super.$propertyChangedCallback(name, oldValue, newValue);
    if (name === "rows" || name === "columns") {
      this.$nextTick(() => {
        this.$render();
      });
    }
  }
  connectedCallback() {
    super.connectedCallback();
    this.$render();
  }
  $render() {
    const shadow = this.$getShadowRoot();
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < this.rows; i += 1) {
      const row = document.createElement("span");
      row.setAttribute("role", "row");
      for (let j = 0; j < this.columns; j += 1) {
        const column = document.createElement("span");
        column.setAttribute("role", "gridcell");
        row.appendChild(column);
      }
      fragment.appendChild(row);
    }
    if (shadow) {
      shadow.innerHTML = "";
      shadow.appendChild(fragment);
    }
  }
};
CropperGrid.$name = CROPPER_GIRD;
CropperGrid.$version = "2.0.0";

// ../../node_modules/@cropper/element-crosshair/dist/element-crosshair.esm.raw.js
var style8 = `:host{display:inline-block;height:1em;position:relative;touch-action:none;-webkit-user-select:none;-moz-user-select:none;user-select:none;vertical-align:middle;width:1em}:host:after,:host:before{background-color:var(--theme-color);content:"";display:block;position:absolute}:host:before{height:1px;left:0;top:50%;transform:translateY(-50%);width:100%}:host:after{height:100%;left:50%;top:0;transform:translateX(-50%);width:1px}:host([centered]){left:50%;position:absolute;top:50%;transform:translate(-50%,-50%)}`;
var CropperCrosshair = class extends CropperElement {
  constructor() {
    super(...arguments);
    this.$style = style8;
    this.centered = false;
    this.slottable = false;
    this.themeColor = "rgba(238, 238, 238, 0.5)";
  }
  static get observedAttributes() {
    return super.observedAttributes.concat(["centered"]);
  }
};
CropperCrosshair.$name = CROPPER_CROSSHAIR;
CropperCrosshair.$version = "2.0.0";

// ../../node_modules/@cropper/element-viewer/dist/element-viewer.esm.raw.js
var style9 = `:host{display:block;height:100%;overflow:hidden;position:relative;width:100%}`;
var canvasCache4 = /* @__PURE__ */ new WeakMap();
var imageCache = /* @__PURE__ */ new WeakMap();
var selectionCache = /* @__PURE__ */ new WeakMap();
var sourceImageCache = /* @__PURE__ */ new WeakMap();
var RESIZE_BOTH = "both";
var RESIZE_HORIZONTAL = "horizontal";
var RESIZE_VERTICAL = "vertical";
var RESIZE_NONE = "none";
var CropperViewer = class extends CropperElement {
  constructor() {
    super(...arguments);
    this.$onSelectionChange = null;
    this.$onSourceImageLoad = null;
    this.$onSourceImageTransform = null;
    this.$scale = 1;
    this.$style = style9;
    this.resize = RESIZE_VERTICAL;
    this.selection = "";
    this.slottable = false;
  }
  set $image(element) {
    imageCache.set(this, element);
  }
  get $image() {
    return imageCache.get(this);
  }
  set $sourceImage(element) {
    sourceImageCache.set(this, element);
  }
  get $sourceImage() {
    return sourceImageCache.get(this);
  }
  set $canvas(element) {
    canvasCache4.set(this, element);
  }
  get $canvas() {
    return canvasCache4.get(this);
  }
  set $selection(element) {
    selectionCache.set(this, element);
  }
  get $selection() {
    return selectionCache.get(this);
  }
  static get observedAttributes() {
    return super.observedAttributes.concat(["resize", "selection"]);
  }
  connectedCallback() {
    super.connectedCallback();
    let $selection = null;
    if (this.selection) {
      $selection = this.ownerDocument.querySelector(this.selection);
    } else {
      $selection = this.closest(this.$getTagNameOf(CROPPER_SELECTION));
    }
    if (isElement($selection)) {
      this.$selection = $selection;
      this.$onSelectionChange = this.$handleSelectionChange.bind(this);
      on($selection, EVENT_CHANGE, this.$onSelectionChange);
      const $canvas = $selection.closest(this.$getTagNameOf(CROPPER_CANVAS));
      if ($canvas) {
        this.$canvas = $canvas;
        const $sourceImage = $canvas.querySelector(this.$getTagNameOf(CROPPER_IMAGE));
        if ($sourceImage) {
          this.$sourceImage = $sourceImage;
          this.$image = $sourceImage.cloneNode(true);
          this.$getShadowRoot().appendChild(this.$image);
          this.$onSourceImageLoad = this.$handleSourceImageLoad.bind(this);
          this.$onSourceImageTransform = this.$handleSourceImageTransform.bind(this);
          on($sourceImage.$image, EVENT_LOAD, this.$onSourceImageLoad);
          on($sourceImage, EVENT_TRANSFORM, this.$onSourceImageTransform);
        }
      }
      this.$render();
    }
  }
  disconnectedCallback() {
    const { $selection, $sourceImage } = this;
    if ($selection && this.$onSelectionChange) {
      off($selection, EVENT_CHANGE, this.$onSelectionChange);
      this.$onSelectionChange = null;
    }
    if ($sourceImage && this.$onSourceImageLoad) {
      off($sourceImage.$image, EVENT_LOAD, this.$onSourceImageLoad);
      this.$onSourceImageLoad = null;
    }
    if ($sourceImage && this.$onSourceImageTransform) {
      off($sourceImage, EVENT_TRANSFORM, this.$onSourceImageTransform);
      this.$onSourceImageTransform = null;
    }
    super.disconnectedCallback();
  }
  $handleSelectionChange(event) {
    this.$render(event.detail);
  }
  $handleSourceImageLoad() {
    const { $image, $sourceImage } = this;
    const oldSrc = $image.getAttribute("src");
    const newSrc = $sourceImage.getAttribute("src");
    if (newSrc && newSrc !== oldSrc) {
      $image.setAttribute("src", newSrc);
      $image.$ready(() => {
        setTimeout(() => {
          this.$render();
        }, 50);
      });
    }
  }
  $handleSourceImageTransform(event) {
    this.$render(void 0, event.detail.matrix);
  }
  $render(selection, matrix) {
    const { $canvas, $selection } = this;
    if (!selection && !$selection.hidden) {
      selection = $selection;
    }
    if (!selection || (selection.x === 0 && selection.y === 0 && selection.width === 0 && selection.height === 0)) {
      selection = {
        x: 0,
        y: 0,
        width: $canvas.offsetWidth,
        height: $canvas.offsetHeight,
      };
    }
    const { x, y, width, height } = selection;
    const styles = {};
    const { clientWidth, clientHeight } = this;
    let newWidth = clientWidth;
    let newHeight = clientHeight;
    let scale = NaN;
    switch (this.resize) {
      case RESIZE_BOTH:
        scale = 1;
        newWidth = width;
        newHeight = height;
        styles.width = width;
        styles.height = height;
        break;
      case RESIZE_HORIZONTAL:
        scale = height > 0 ? clientHeight / height : 0;
        newWidth = width * scale;
        styles.width = newWidth;
        break;
      case RESIZE_VERTICAL:
        scale = width > 0 ? clientWidth / width : 0;
        newHeight = height * scale;
        styles.height = newHeight;
        break;
      case RESIZE_NONE:
      default:
        if (clientWidth > 0) {
          scale = width > 0 ? clientWidth / width : 0;
        } else if (clientHeight > 0) {
          scale = height > 0 ? clientHeight / height : 0;
        }
    }
    this.$scale = scale;
    this.$setStyles(styles);
    if (this.$sourceImage) {
      this.$transformImageByOffset(
        matrix !== null && matrix !== void 0 ? matrix : this.$sourceImage.$getTransform(),
        -x,
        -y,
      );
    }
  }
  $transformImageByOffset(matrix, x, y) {
    const { $image, $scale, $sourceImage } = this;
    if ($sourceImage && $image && $scale >= 0) {
      const [a, b, c, d, e, f] = matrix;
      const translateX = (x * d - c * y) / (a * d - c * b);
      const translateY = (y * a - b * x) / (a * d - c * b);
      const newE = a * translateX + c * translateY + e;
      const newF = b * translateX + d * translateY + f;
      $image.$ready((image) => {
        this.$setStyles.call($image, {
          width: image.naturalWidth * $scale,
          height: image.naturalHeight * $scale,
        });
      });
      $image.$setTransform(a, b, c, d, newE * $scale, newF * $scale);
    }
  }
};
CropperViewer.$name = CROPPER_VIEWER;
CropperViewer.$version = "2.0.0";

// ../../node_modules/cropperjs/dist/cropper.esm.raw.js
var DEFAULT_TEMPLATE =
  '<cropper-canvas background><cropper-image rotatable scalable skewable translatable></cropper-image><cropper-shade hidden></cropper-shade><cropper-handle action="select" plain></cropper-handle><cropper-selection initial-coverage="0.5" movable resizable><cropper-grid role="grid" bordered covered></cropper-grid><cropper-crosshair centered></cropper-crosshair><cropper-handle action="move" theme-color="rgba(255, 255, 255, 0.35)"></cropper-handle><cropper-handle action="n-resize"></cropper-handle><cropper-handle action="e-resize"></cropper-handle><cropper-handle action="s-resize"></cropper-handle><cropper-handle action="w-resize"></cropper-handle><cropper-handle action="ne-resize"></cropper-handle><cropper-handle action="nw-resize"></cropper-handle><cropper-handle action="se-resize"></cropper-handle><cropper-handle action="sw-resize"></cropper-handle></cropper-selection></cropper-canvas>';
var REGEXP_ALLOWED_ELEMENTS = /^img|canvas$/;
var REGEXP_BLOCKED_TAGS = /<(\/?(?:script|style)[^>]*)>/gi;
var DEFAULT_OPTIONS = {
  template: DEFAULT_TEMPLATE,
};
CropperCanvas.$define();
CropperCrosshair.$define();
CropperGrid.$define();
CropperHandle.$define();
CropperImage.$define();
CropperSelection.$define();
CropperShade.$define();
CropperViewer.$define();
var Cropper = class {
  constructor(element, options) {
    this.options = DEFAULT_OPTIONS;
    if (isString(element)) {
      element = document.querySelector(element);
    }
    if (!isElement(element) || !REGEXP_ALLOWED_ELEMENTS.test(element.localName)) {
      throw new Error("The first argument is required and must be an <img> or <canvas> element.");
    }
    this.element = element;
    options = Object.assign(Object.assign({}, DEFAULT_OPTIONS), options);
    this.options = options;
    const { ownerDocument } = element;
    let { container } = options;
    if (container) {
      if (isString(container)) {
        container = ownerDocument.querySelector(container);
      }
      if (!isElement(container)) {
        throw new Error("The `container` option must be an element or a valid selector.");
      }
    }
    if (!isElement(container)) {
      if (element.parentElement) {
        container = element.parentElement;
      } else {
        container = ownerDocument.body;
      }
    }
    this.container = container;
    const tagName = element.localName;
    let src = "";
    if (tagName === "img") {
      ({ src } = element);
    } else if (tagName === "canvas" && window.HTMLCanvasElement) {
      src = element.toDataURL();
    }
    const { template } = options;
    if (template && isString(template)) {
      const templateElement = document.createElement("template");
      const documentFragment = document.createDocumentFragment();
      templateElement.innerHTML = template.replace(REGEXP_BLOCKED_TAGS, "&lt;$1&gt;");
      documentFragment.appendChild(templateElement.content);
      Array.from(documentFragment.querySelectorAll(CROPPER_IMAGE)).forEach((image) => {
        image.setAttribute("src", src);
        image.setAttribute("alt", element.alt || "The image to crop");
      });
      if (element.parentElement) {
        element.style.display = "none";
        container.insertBefore(documentFragment, element.nextSibling);
      } else {
        container.appendChild(documentFragment);
      }
    }
  }
  getCropperCanvas() {
    return this.container.querySelector(CROPPER_CANVAS);
  }
  getCropperImage() {
    return this.container.querySelector(CROPPER_IMAGE);
  }
  getCropperSelection() {
    return this.container.querySelector(CROPPER_SELECTION);
  }
  getCropperSelections() {
    return this.container.querySelectorAll(CROPPER_SELECTION);
  }
};
Cropper.version = "2.0.0";

// src/js/Functionalities/media.image.cropper.ts
var _Media_Image_Cropper = class _Media_Image_Cropper {
  static {
    /** Stores often used {@link RegExp }s. */
    this.stdExp = {
      aspectRatio: /^\d+\s*\/\s*\d+$/,
    };
  }
  static functionality(toLoad, toProcess) {
    const container = toProcess.querySelector(toLoad.container);
    if (container === void 0) {
      new CodBiError(`The container "${toLoad.container}" is not available`);
    }
    const fileInput = toProcess.querySelector(toLoad.file);
    if (
      fileInput === void 0 ||
      fileInput === null ||
      fileInput.tagName.toLowerCase() !== "input" ||
      fileInput.getAttribute("type") !== "file"
    ) {
      new CodBiError(`The file picker "${toLoad.file}" is either not available or not a file picker`);
      return;
    }
    let cropper;
    fileInput.addEventListener("change", (event) => {
      if (fileInput.files && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        if (file) {
          container.innerHTML = "";
          const newImage = document.createElement("img");
          newImage.src = window.URL.createObjectURL(file);
          newImage.setAttribute(
            "style",
            `width : ${toLoad.maxwidth ? toLoad.maxwidth : 500}px ; height : ${toLoad.maxheight ? toLoad.maxheight : 500}px ;`,
          );
          newImage.setAttribute("data-name", "CodBi_Media_Imagecropper_Bild");
          container.appendChild(newImage);
          const aspectRatio =
            toLoad.aspectratio && typeof toLoad.aspectratio === "string" && toLoad.aspectratio.indexOf("/") !== -1
              ? divide(toLoad.aspectratio)
              : void 0;
          const rectContainer = newImage.getBoundingClientRect();
          toLoad.csscropperhandle = toLoad.csscropperhandle
            ? toLoad.csscropperhandle
            : "background-color: darkorange ;";
          cropper = new Cropper(newImage, {
            template: `
                <cropper-canvas style = "height : 100% ; width : 100% ;" background >
                  <cropper-image  initial-center-size = "contain" rotatable scalable skewable translatable
                                  @transform          = "onCropperImageTransform">
                    <cropper-handle action      = "move"
                                    theme-color = "rgba( 255, 255, 255, 0.35 )"></cropper-handle></cropper-image>
                  <cropper-shade hidden></cropper-shade>
                  <cropper-selection
                    width = "100"
                    height = "100"
                    movable ${aspectRatio ? "" : "resizable zoomable"}>
                    <cropper-grid role = "grid" bordered covered></cropper-grid>
                    <cropper-handle action      = "move"
                                    theme-color = "rgba( 255, 255, 255, 0.35 )"></cropper-handle>
                    ${
                      aspectRatio
                        ? ""
                        : `
                        <cropper-crosshair centered></cropper-crosshair>
                        <cropper-handle action = "n-resize"   style = "${toLoad.csscropperhandle}"></cropper-handle>
                        <cropper-handle action = "e-resize"   style = "${toLoad.csscropperhandle}"></cropper-handle>
                        <cropper-handle action = "s-resize"   style = "${toLoad.csscropperhandle}"></cropper-handle>
                        <cropper-handle action = "w-resize"   style = "${toLoad.csscropperhandle}"></cropper-handle>
                        <cropper-handle action = "ne-resize"  style = "${toLoad.csscropperhandle}"></cropper-handle>
                        <cropper-handle action = "nw-resize"  style = "${toLoad.csscropperhandle}"></cropper-handle>
                        <cropper-handle action = "se-resize"  style = "${toLoad.csscropperhandle}"></cropper-handle>
                        <cropper-handle action = "sw-resize"  style = "${toLoad.csscropperhandle}"></cropper-handle>`
                    }
                    </cropper-handle></cropper-selection></cropper-canvas>`,
          });
        }
      }
    });
    for (const updater of toProcess.parentElement.querySelectorAll(toLoad.updater)) {
      updater.addEventListener("click", (event) => {
        if (cropper && toLoad.target && typeof (toLoad.target === "string")) {
          const target = toProcess.parentElement.querySelector(toLoad.target);
          const canvas = cropper.getCropperSelection();
          if (canvas) {
            const targetBoundingClientRect = target.getBoundingClientRect();
            console.log(canvas, canvas?.clientHeight, canvas?.clientHeight, window.devicePixelRatio, "canvas");
            canvas
              .$toCanvas({
                width: toLoad.outputwidth ? toLoad.outputwidth : 1e3,
              })
              .then((canvas2) => {
                target.setAttribute(
                  "width",
                  (Number.parseInt(canvas2?.getAttribute("width")) * window.devicePixelRatio * 4 || 1).toString(),
                );
                target.setAttribute(
                  "width",
                  (Number.parseInt(canvas2?.getAttribute("height")) * window.devicePixelRatio * 4 || 1).toString(),
                );
                const urlImage = canvas2.toDataURL("image/jpeg", 1);
                if (toLoad.imageurl) {
                  const imageURLReceiver = toProcess.querySelector(toLoad.imageurl);
                  if (imageURLReceiver) {
                    imageURLReceiver.value = urlImage;
                  }
                }
                target?.setAttribute("src", urlImage);
              });
          }
        }
      });
    }
  }
};
__decorateClass(
  [
    DBC.ParamvalueProvider,
    __decorateParam(0, TYPE.PRE("string", "container :: target :: file :: updater :: imageurl :: csscropperhandle")),
    __decorateParam(0, REGEX.PRE(REGEX.stdExp.cssSelector, "container")),
    __decorateParam(0, REGEX.PRE(REGEX.stdExp.cssSelector, "target")),
    __decorateParam(0, REGEX.PRE(REGEX.stdExp.cssSelector, "file")),
    __decorateParam(0, REGEX.PRE(REGEX.stdExp.cssSelector, "updater")),
    __decorateParam(0, REGEX.PRE(REGEX.stdExp.cssSelector, "imageurl")),
    __decorateParam(0, TYPE.PRE("string | number", "aspectratio :: outputwidth")),
    __decorateParam(0, IF.PRE(new TYPE("string"), new REGEX(_Media_Image_Cropper.stdExp.aspectRatio), "aspectratio")),
    __decorateParam(0, IF.PRE(new TYPE("string"), new REGEX(/[1-9][1-9][1-9]+/), "outputwidth")),
    __decorateParam(
      1,
      OR.PRE(
        [new INSTANCE(HTMLDivElement), new INSTANCE(HTMLFieldSetElement)],
        void 0,
        "Is it not a <div> or <fieldset> that is tagged with this functionality?",
      ),
    ),
  ],
  _Media_Image_Cropper,
  "functionality",
  1,
);
var Media_Image_Cropper = _Media_Image_Cropper;
window.codbi.registerFunctionality("Media.Image.Cropper", Media_Image_Cropper.functionality.bind(Media_Image_Cropper));
var divide = (divisionString) => {
  try {
    const parts = divisionString.split(/\s*\/\s*/);
    if (parts.length !== 2) {
      throw new Error("Input format is incorrect. Expected 'number / number'.");
    }
    const numerator = Number.parseFloat(parts[0]);
    const denominator = Number.parseFloat(parts[1]);
    if (
      Number.isNaN(numerator) ||
      Number.isNaN(denominator) ||
      !Number.isFinite(numerator) ||
      !Number.isFinite(denominator)
    ) {
      throw new Error("The numerator or denominator is not a valid number.");
    }
    if (denominator === 0) {
      throw new Error("Cannot divide by zero.");
    }
    return numerator / denominator;
  } catch (X) {
    throw new CodBiError(`Error: ${X.message}`);
  }
};
export { Media_Image_Cropper };
/*! Bundled license information:

cropperjs/dist/cropper.esm.raw.js:
  (*! Cropper.js v2.0.0 | (c) 2015-present Chen Fengyuan | MIT *)
*/
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0Bjcm9wcGVyL3V0aWxzL2Rpc3QvdXRpbHMuZXNtLnJhdy5qcyIsICIuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvQGNyb3BwZXIvZWxlbWVudC9kaXN0L2VsZW1lbnQuZXNtLnJhdy5qcyIsICIuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvQGNyb3BwZXIvZWxlbWVudC1jYW52YXMvZGlzdC9lbGVtZW50LWNhbnZhcy5lc20ucmF3LmpzIiwgIi4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9AY3JvcHBlci9lbGVtZW50LWltYWdlL2Rpc3QvZWxlbWVudC1pbWFnZS5lc20ucmF3LmpzIiwgIi4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9AY3JvcHBlci9lbGVtZW50LXNoYWRlL2Rpc3QvZWxlbWVudC1zaGFkZS5lc20ucmF3LmpzIiwgIi4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9AY3JvcHBlci9lbGVtZW50LWhhbmRsZS9kaXN0L2VsZW1lbnQtaGFuZGxlLmVzbS5yYXcuanMiLCAiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0Bjcm9wcGVyL2VsZW1lbnQtc2VsZWN0aW9uL2Rpc3QvZWxlbWVudC1zZWxlY3Rpb24uZXNtLnJhdy5qcyIsICIuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvQGNyb3BwZXIvZWxlbWVudC1ncmlkL2Rpc3QvZWxlbWVudC1ncmlkLmVzbS5yYXcuanMiLCAiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0Bjcm9wcGVyL2VsZW1lbnQtY3Jvc3NoYWlyL2Rpc3QvZWxlbWVudC1jcm9zc2hhaXIuZXNtLnJhdy5qcyIsICIuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvQGNyb3BwZXIvZWxlbWVudC12aWV3ZXIvZGlzdC9lbGVtZW50LXZpZXdlci5lc20ucmF3LmpzIiwgIi4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9jcm9wcGVyanMvZGlzdC9jcm9wcGVyLmVzbS5yYXcuanMiLCAiLi4vLi4vc3JjL2pzL0Z1bmN0aW9uYWxpdGllcy9tZWRpYS5pbWFnZS5jcm9wcGVyLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBJU19CUk9XU0VSID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIHdpbmRvdy5kb2N1bWVudCAhPT0gJ3VuZGVmaW5lZCc7XG5jb25zdCBXSU5ET1cgPSBJU19CUk9XU0VSID8gd2luZG93IDoge307XG5jb25zdCBJU19UT1VDSF9ERVZJQ0UgPSBJU19CUk9XU0VSID8gJ29udG91Y2hzdGFydCcgaW4gV0lORE9XLmRvY3VtZW50LmRvY3VtZW50RWxlbWVudCA6IGZhbHNlO1xuY29uc3QgSEFTX1BPSU5URVJfRVZFTlQgPSBJU19CUk9XU0VSID8gJ1BvaW50ZXJFdmVudCcgaW4gV0lORE9XIDogZmFsc2U7XG5jb25zdCBOQU1FU1BBQ0UgPSAnY3JvcHBlcic7XG5jb25zdCBDUk9QUEVSX0NBTlZBUyA9IGAke05BTUVTUEFDRX0tY2FudmFzYDtcbmNvbnN0IENST1BQRVJfQ1JPU1NIQUlSID0gYCR7TkFNRVNQQUNFfS1jcm9zc2hhaXJgO1xuY29uc3QgQ1JPUFBFUl9HSVJEID0gYCR7TkFNRVNQQUNFfS1ncmlkYDtcbmNvbnN0IENST1BQRVJfSEFORExFID0gYCR7TkFNRVNQQUNFfS1oYW5kbGVgO1xuY29uc3QgQ1JPUFBFUl9JTUFHRSA9IGAke05BTUVTUEFDRX0taW1hZ2VgO1xuY29uc3QgQ1JPUFBFUl9TRUxFQ1RJT04gPSBgJHtOQU1FU1BBQ0V9LXNlbGVjdGlvbmA7XG5jb25zdCBDUk9QUEVSX1NIQURFID0gYCR7TkFNRVNQQUNFfS1zaGFkZWA7XG5jb25zdCBDUk9QUEVSX1ZJRVdFUiA9IGAke05BTUVTUEFDRX0tdmlld2VyYDtcbi8vIEFjdGlvbnNcbmNvbnN0IEFDVElPTl9TRUxFQ1QgPSAnc2VsZWN0JztcbmNvbnN0IEFDVElPTl9NT1ZFID0gJ21vdmUnO1xuY29uc3QgQUNUSU9OX1NDQUxFID0gJ3NjYWxlJztcbmNvbnN0IEFDVElPTl9ST1RBVEUgPSAncm90YXRlJztcbmNvbnN0IEFDVElPTl9UUkFOU0ZPUk0gPSAndHJhbnNmb3JtJztcbmNvbnN0IEFDVElPTl9OT05FID0gJ25vbmUnO1xuY29uc3QgQUNUSU9OX1JFU0laRV9OT1JUSCA9ICduLXJlc2l6ZSc7XG5jb25zdCBBQ1RJT05fUkVTSVpFX0VBU1QgPSAnZS1yZXNpemUnO1xuY29uc3QgQUNUSU9OX1JFU0laRV9TT1VUSCA9ICdzLXJlc2l6ZSc7XG5jb25zdCBBQ1RJT05fUkVTSVpFX1dFU1QgPSAndy1yZXNpemUnO1xuY29uc3QgQUNUSU9OX1JFU0laRV9OT1JUSEVBU1QgPSAnbmUtcmVzaXplJztcbmNvbnN0IEFDVElPTl9SRVNJWkVfTk9SVEhXRVNUID0gJ253LXJlc2l6ZSc7XG5jb25zdCBBQ1RJT05fUkVTSVpFX1NPVVRIRUFTVCA9ICdzZS1yZXNpemUnO1xuY29uc3QgQUNUSU9OX1JFU0laRV9TT1VUSFdFU1QgPSAnc3ctcmVzaXplJztcbi8vIEF0dHJpYnV0ZXNcbmNvbnN0IEFUVFJJQlVURV9BQ1RJT04gPSAnYWN0aW9uJztcbi8vIE5hdGl2ZSBldmVudHNcbmNvbnN0IEVWRU5UX1RPVUNIX0VORCA9IElTX1RPVUNIX0RFVklDRSA/ICd0b3VjaGVuZCB0b3VjaGNhbmNlbCcgOiAnbW91c2V1cCc7XG5jb25zdCBFVkVOVF9UT1VDSF9NT1ZFID0gSVNfVE9VQ0hfREVWSUNFID8gJ3RvdWNobW92ZScgOiAnbW91c2Vtb3ZlJztcbmNvbnN0IEVWRU5UX1RPVUNIX1NUQVJUID0gSVNfVE9VQ0hfREVWSUNFID8gJ3RvdWNoc3RhcnQnIDogJ21vdXNlZG93bic7XG5jb25zdCBFVkVOVF9QT0lOVEVSX0RPV04gPSBIQVNfUE9JTlRFUl9FVkVOVCA/ICdwb2ludGVyZG93bicgOiBFVkVOVF9UT1VDSF9TVEFSVDtcbmNvbnN0IEVWRU5UX1BPSU5URVJfTU9WRSA9IEhBU19QT0lOVEVSX0VWRU5UID8gJ3BvaW50ZXJtb3ZlJyA6IEVWRU5UX1RPVUNIX01PVkU7XG5jb25zdCBFVkVOVF9QT0lOVEVSX1VQID0gSEFTX1BPSU5URVJfRVZFTlQgPyAncG9pbnRlcnVwIHBvaW50ZXJjYW5jZWwnIDogRVZFTlRfVE9VQ0hfRU5EO1xuY29uc3QgRVZFTlRfRVJST1IgPSAnZXJyb3InO1xuY29uc3QgRVZFTlRfS0VZRE9XTiA9ICdrZXlkb3duJztcbmNvbnN0IEVWRU5UX0xPQUQgPSAnbG9hZCc7XG5jb25zdCBFVkVOVF9SRVNJWkUgPSAncmVzaXplJztcbmNvbnN0IEVWRU5UX1dIRUVMID0gJ3doZWVsJztcbi8vIEN1c3RvbSBldmVudHNcbmNvbnN0IEVWRU5UX0FDVElPTiA9ICdhY3Rpb24nO1xuY29uc3QgRVZFTlRfQUNUSU9OX0VORCA9ICdhY3Rpb25lbmQnO1xuY29uc3QgRVZFTlRfQUNUSU9OX01PVkUgPSAnYWN0aW9ubW92ZSc7XG5jb25zdCBFVkVOVF9BQ1RJT05fU1RBUlQgPSAnYWN0aW9uc3RhcnQnO1xuY29uc3QgRVZFTlRfQ0hBTkdFID0gJ2NoYW5nZSc7XG5jb25zdCBFVkVOVF9UUkFOU0ZPUk0gPSAndHJhbnNmb3JtJztcblxuLyoqXG4gKiBDaGVjayBpZiB0aGUgZ2l2ZW4gdmFsdWUgaXMgYSBzdHJpbmcuXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgZ2l2ZW4gdmFsdWUgaXMgYSBzdHJpbmcsIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gaXNTdHJpbmcodmFsdWUpIHtcbiAgICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJztcbn1cbi8qKlxuICogQ2hlY2sgaWYgdGhlIGdpdmVuIHZhbHVlIGlzIG5vdCBhIG51bWJlci5cbiAqL1xuY29uc3QgaXNOYU4gPSBOdW1iZXIuaXNOYU4gfHwgV0lORE9XLmlzTmFOO1xuLyoqXG4gKiBDaGVjayBpZiB0aGUgZ2l2ZW4gdmFsdWUgaXMgYSBudW1iZXIuXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgZ2l2ZW4gdmFsdWUgaXMgYSBudW1iZXIsIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gaXNOdW1iZXIodmFsdWUpIHtcbiAgICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJyAmJiAhaXNOYU4odmFsdWUpO1xufVxuLyoqXG4gKiBDaGVjayBpZiB0aGUgZ2l2ZW4gdmFsdWUgaXMgYSBwb3NpdGl2ZSBudW1iZXIuXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgZ2l2ZW4gdmFsdWUgaXMgYSBwb3NpdGl2ZSBudW1iZXIsIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gaXNQb3NpdGl2ZU51bWJlcih2YWx1ZSkge1xuICAgIHJldHVybiBpc051bWJlcih2YWx1ZSkgJiYgdmFsdWUgPiAwICYmIHZhbHVlIDwgSW5maW5pdHk7XG59XG4vKipcbiAqIENoZWNrIGlmIHRoZSBnaXZlbiB2YWx1ZSBpcyB1bmRlZmluZWQuXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgZ2l2ZW4gdmFsdWUgaXMgdW5kZWZpbmVkLCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKHZhbHVlKSB7XG4gICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ3VuZGVmaW5lZCc7XG59XG4vKipcbiAqIENoZWNrIGlmIHRoZSBnaXZlbiB2YWx1ZSBpcyBhbiBvYmplY3QuXG4gKiBAcGFyYW0geyp9IHZhbHVlIC0gVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHRoZSBnaXZlbiB2YWx1ZSBpcyBhbiBvYmplY3QsIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gaXNPYmplY3QodmFsdWUpIHtcbiAgICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSAhPT0gbnVsbDtcbn1cbmNvbnN0IHsgaGFzT3duUHJvcGVydHkgfSA9IE9iamVjdC5wcm90b3R5cGU7XG4vKipcbiAqIENoZWNrIGlmIHRoZSBnaXZlbiB2YWx1ZSBpcyBhIHBsYWluIG9iamVjdC5cbiAqIEBwYXJhbSB7Kn0gdmFsdWUgLSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIGdpdmVuIHZhbHVlIGlzIGEgcGxhaW4gb2JqZWN0LCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGlzUGxhaW5PYmplY3QodmFsdWUpIHtcbiAgICBpZiAoIWlzT2JqZWN0KHZhbHVlKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHsgY29uc3RydWN0b3IgfSA9IHZhbHVlO1xuICAgICAgICBjb25zdCB7IHByb3RvdHlwZSB9ID0gY29uc3RydWN0b3I7XG4gICAgICAgIHJldHVybiBjb25zdHJ1Y3RvciAmJiBwcm90b3R5cGUgJiYgaGFzT3duUHJvcGVydHkuY2FsbChwcm90b3R5cGUsICdpc1Byb3RvdHlwZU9mJyk7XG4gICAgfVxuICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxufVxuLyoqXG4gKiBDaGVjayBpZiB0aGUgZ2l2ZW4gdmFsdWUgaXMgYSBmdW5jdGlvbi5cbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHRoZSBnaXZlbiB2YWx1ZSBpcyBhIGZ1bmN0aW9uLCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGlzRnVuY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nO1xufVxuLyoqXG4gKiBDaGVjayBpZiB0aGUgZ2l2ZW4gbm9kZSBpcyBhbiBlbGVtZW50LlxuICogQHBhcmFtIHsqfSBub2RlIFRoZSBub2RlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHRoZSBnaXZlbiBub2RlIGlzIGFuIGVsZW1lbnQ7IG90aGVyd2lzZSwgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gaXNFbGVtZW50KG5vZGUpIHtcbiAgICByZXR1cm4gdHlwZW9mIG5vZGUgPT09ICdvYmplY3QnICYmIG5vZGUgIT09IG51bGwgJiYgbm9kZS5ub2RlVHlwZSA9PT0gMTtcbn1cbmNvbnN0IFJFR0VYUF9DQU1FTF9DQVNFID0gLyhbYS16XFxkXSkoW0EtWl0pL2c7XG4vKipcbiAqIFRyYW5zZm9ybSB0aGUgZ2l2ZW4gc3RyaW5nIGZyb20gY2FtZWxDYXNlIHRvIGtlYmFiLWNhc2UuXG4gKiBAcGFyYW0ge3N0cmluZ30gdmFsdWUgVGhlIHZhbHVlIHRvIHRyYW5zZm9ybS5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IFJldHVybnMgdGhlIHRyYW5zZm9ybWVkIHZhbHVlLlxuICovXG5mdW5jdGlvbiB0b0tlYmFiQ2FzZSh2YWx1ZSkge1xuICAgIHJldHVybiBTdHJpbmcodmFsdWUpLnJlcGxhY2UoUkVHRVhQX0NBTUVMX0NBU0UsICckMS0kMicpLnRvTG93ZXJDYXNlKCk7XG59XG5jb25zdCBSRUdFWFBfS0VCQUJfQ0FTRSA9IC8tW0EtelxcZF0vZztcbi8qKlxuICogVHJhbnNmb3JtIHRoZSBnaXZlbiBzdHJpbmcgZnJvbSBrZWJhYi1jYXNlIHRvIGNhbWVsQ2FzZS5cbiAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZSBUaGUgdmFsdWUgdG8gdHJhbnNmb3JtLlxuICogQHJldHVybnMge3N0cmluZ30gUmV0dXJucyB0aGUgdHJhbnNmb3JtZWQgdmFsdWUuXG4gKi9cbmZ1bmN0aW9uIHRvQ2FtZWxDYXNlKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlLnJlcGxhY2UoUkVHRVhQX0tFQkFCX0NBU0UsIChzdWJzdHJpbmcpID0+IHN1YnN0cmluZy5zbGljZSgxKS50b1VwcGVyQ2FzZSgpKTtcbn1cbmNvbnN0IFJFR0VYUF9TUEFDRVMgPSAvXFxzXFxzKi87XG4vKipcbiAqIFJlbW92ZSBldmVudCBsaXN0ZW5lciBmcm9tIHRoZSBldmVudCB0YXJnZXQuXG4gKiB7QGxpbmsgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0V2ZW50VGFyZ2V0L3JlbW92ZUV2ZW50TGlzdGVuZXJ9XG4gKiBAcGFyYW0ge0V2ZW50VGFyZ2V0fSB0YXJnZXQgVGhlIHRhcmdldCBvZiB0aGUgZXZlbnQuXG4gKiBAcGFyYW0ge3N0cmluZ30gdHlwZXMgVGhlIHR5cGVzIG9mIHRoZSBldmVudC5cbiAqIEBwYXJhbSB7RXZlbnRMaXN0ZW5lck9yRXZlbnRMaXN0ZW5lck9iamVjdH0gbGlzdGVuZXIgVGhlIGxpc3RlbmVyIG9mIHRoZSBldmVudC5cbiAqIEBwYXJhbSB7RXZlbnRMaXN0ZW5lck9wdGlvbnN9IFtvcHRpb25zXSBUaGUgb3B0aW9ucyBzcGVjaWZ5IGNoYXJhY3RlcmlzdGljcyBhYm91dCB0aGUgZXZlbnQgbGlzdGVuZXIuXG4gKi9cbmZ1bmN0aW9uIG9mZih0YXJnZXQsIHR5cGVzLCBsaXN0ZW5lciwgb3B0aW9ucykge1xuICAgIHR5cGVzLnRyaW0oKS5zcGxpdChSRUdFWFBfU1BBQ0VTKS5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgICAgIHRhcmdldC5yZW1vdmVFdmVudExpc3RlbmVyKHR5cGUsIGxpc3RlbmVyLCBvcHRpb25zKTtcbiAgICB9KTtcbn1cbi8qKlxuICogQWRkIGV2ZW50IGxpc3RlbmVyIHRvIHRoZSBldmVudCB0YXJnZXQuXG4gKiB7QGxpbmsgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0V2ZW50VGFyZ2V0L2FkZEV2ZW50TGlzdGVuZXJ9XG4gKiBAcGFyYW0ge0V2ZW50VGFyZ2V0fSB0YXJnZXQgVGhlIHRhcmdldCBvZiB0aGUgZXZlbnQuXG4gKiBAcGFyYW0ge3N0cmluZ30gdHlwZXMgVGhlIHR5cGVzIG9mIHRoZSBldmVudC5cbiAqIEBwYXJhbSB7RXZlbnRMaXN0ZW5lck9yRXZlbnRMaXN0ZW5lck9iamVjdH0gbGlzdGVuZXIgVGhlIGxpc3RlbmVyIG9mIHRoZSBldmVudC5cbiAqIEBwYXJhbSB7QWRkRXZlbnRMaXN0ZW5lck9wdGlvbnN9IFtvcHRpb25zXSBUaGUgb3B0aW9ucyBzcGVjaWZ5IGNoYXJhY3RlcmlzdGljcyBhYm91dCB0aGUgZXZlbnQgbGlzdGVuZXIuXG4gKi9cbmZ1bmN0aW9uIG9uKHRhcmdldCwgdHlwZXMsIGxpc3RlbmVyLCBvcHRpb25zKSB7XG4gICAgdHlwZXMudHJpbSgpLnNwbGl0KFJFR0VYUF9TUEFDRVMpLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICAgICAgdGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgbGlzdGVuZXIsIG9wdGlvbnMpO1xuICAgIH0pO1xufVxuLyoqXG4gKiBBZGQgb25jZSBldmVudCBsaXN0ZW5lciB0byB0aGUgZXZlbnQgdGFyZ2V0LlxuICogQHBhcmFtIHtFdmVudFRhcmdldH0gdGFyZ2V0IFRoZSB0YXJnZXQgb2YgdGhlIGV2ZW50LlxuICogQHBhcmFtIHtzdHJpbmd9IHR5cGVzIFRoZSB0eXBlcyBvZiB0aGUgZXZlbnQuXG4gKiBAcGFyYW0ge0V2ZW50TGlzdGVuZXJPckV2ZW50TGlzdGVuZXJPYmplY3R9IGxpc3RlbmVyIFRoZSBsaXN0ZW5lciBvZiB0aGUgZXZlbnQuXG4gKiBAcGFyYW0ge0FkZEV2ZW50TGlzdGVuZXJPcHRpb25zfSBbb3B0aW9uc10gVGhlIG9wdGlvbnMgc3BlY2lmeSBjaGFyYWN0ZXJpc3RpY3MgYWJvdXQgdGhlIGV2ZW50IGxpc3RlbmVyLlxuICovXG5mdW5jdGlvbiBvbmNlKHRhcmdldCwgdHlwZXMsIGxpc3RlbmVyLCBvcHRpb25zKSB7XG4gICAgb24odGFyZ2V0LCB0eXBlcywgbGlzdGVuZXIsIE9iamVjdC5hc3NpZ24oT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucyksIHsgb25jZTogdHJ1ZSB9KSk7XG59XG5jb25zdCBkZWZhdWx0RXZlbnRPcHRpb25zID0ge1xuICAgIGJ1YmJsZXM6IHRydWUsXG4gICAgY2FuY2VsYWJsZTogdHJ1ZSxcbiAgICBjb21wb3NlZDogdHJ1ZSxcbn07XG4vKipcbiAqIERpc3BhdGNoIGV2ZW50IG9uIHRoZSBldmVudCB0YXJnZXQuXG4gKiB7QGxpbmsgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0V2ZW50VGFyZ2V0L2Rpc3BhdGNoRXZlbnR9XG4gKiBAcGFyYW0ge0V2ZW50VGFyZ2V0fSB0YXJnZXQgVGhlIHRhcmdldCBvZiB0aGUgZXZlbnQuXG4gKiBAcGFyYW0ge3N0cmluZ30gdHlwZSBUaGUgbmFtZSBvZiB0aGUgZXZlbnQuXG4gKiBAcGFyYW0geyp9IFtkZXRhaWxdIFRoZSBkYXRhIHBhc3NlZCB3aGVuIGluaXRpYWxpemluZyB0aGUgZXZlbnQuXG4gKiBAcGFyYW0ge0N1c3RvbUV2ZW50SW5pdH0gW29wdGlvbnNdIFRoZSBvdGhlciBldmVudCBvcHRpb25zLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgdGhlIHJlc3VsdCB2YWx1ZS5cbiAqL1xuZnVuY3Rpb24gZW1pdCh0YXJnZXQsIHR5cGUsIGRldGFpbCwgb3B0aW9ucykge1xuICAgIHJldHVybiB0YXJnZXQuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQodHlwZSwgT2JqZWN0LmFzc2lnbihPYmplY3QuYXNzaWduKE9iamVjdC5hc3NpZ24oe30sIGRlZmF1bHRFdmVudE9wdGlvbnMpLCB7IGRldGFpbCB9KSwgb3B0aW9ucykpKTtcbn1cbmNvbnN0IHJlc29sdmVkUHJvbWlzZSA9IFByb21pc2UucmVzb2x2ZSgpO1xuLyoqXG4gKiBEZWZlcnMgdGhlIGNhbGxiYWNrIHRvIGJlIGV4ZWN1dGVkIGFmdGVyIHRoZSBuZXh0IERPTSB1cGRhdGUgY3ljbGUuXG4gKiBAcGFyYW0geyp9IFtjb250ZXh0XSBUaGUgYHRoaXNgIGNvbnRleHQuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY2FsbGJhY2tdIFRoZSBjYWxsYmFjayB0byBleGVjdXRlIGFmdGVyIHRoZSBuZXh0IERPTSB1cGRhdGUgY3ljbGUuXG4gKiBAcmV0dXJucyB7UHJvbWlzZX0gQSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgdG8gbm90aGluZy5cbiAqL1xuZnVuY3Rpb24gbmV4dFRpY2soY29udGV4dCwgY2FsbGJhY2spIHtcbiAgICByZXR1cm4gY2FsbGJhY2tcbiAgICAgICAgPyByZXNvbHZlZFByb21pc2UudGhlbihjb250ZXh0ID8gY2FsbGJhY2suYmluZChjb250ZXh0KSA6IGNhbGxiYWNrKVxuICAgICAgICA6IHJlc29sdmVkUHJvbWlzZTtcbn1cbi8qKlxuICogR2V0IHRoZSBvZmZzZXQgYmFzZSBvbiB0aGUgZG9jdW1lbnQuXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGVsZW1lbnQgVGhlIHRhcmdldCBlbGVtZW50LlxuICogQHJldHVybnMge29iamVjdH0gVGhlIG9mZnNldCBkYXRhLlxuICovXG5mdW5jdGlvbiBnZXRPZmZzZXQoZWxlbWVudCkge1xuICAgIGNvbnN0IHsgZG9jdW1lbnRFbGVtZW50IH0gPSBlbGVtZW50Lm93bmVyRG9jdW1lbnQ7XG4gICAgY29uc3QgYm94ID0gZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBsZWZ0OiBib3gubGVmdCArIChXSU5ET1cucGFnZVhPZmZzZXQgLSBkb2N1bWVudEVsZW1lbnQuY2xpZW50TGVmdCksXG4gICAgICAgIHRvcDogYm94LnRvcCArIChXSU5ET1cucGFnZVlPZmZzZXQgLSBkb2N1bWVudEVsZW1lbnQuY2xpZW50VG9wKSxcbiAgICB9O1xufVxuY29uc3QgUkVHRVhQX0FOR0xFX1VOSVQgPSAvZGVnfGc/cmFkfHR1cm4kL2k7XG4vKipcbiAqIENvbnZlcnQgYW4gYW5nbGUgdG8gYSByYWRpYW4gbnVtYmVyLlxuICoge0BsaW5rIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0NTUy9hbmdsZX1cbiAqIEBwYXJhbSB7bnVtYmVyfHN0cmluZ30gYW5nbGUgVGhlIGFuZ2xlIHRvIGNvbnZlcnQuXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBSZXR1cm5zIHRoZSByYWRpYW4gbnVtYmVyLlxuICovXG5mdW5jdGlvbiB0b0FuZ2xlSW5SYWRpYW4oYW5nbGUpIHtcbiAgICBjb25zdCB2YWx1ZSA9IHBhcnNlRmxvYXQoYW5nbGUpIHx8IDA7XG4gICAgaWYgKHZhbHVlICE9PSAwKSB7XG4gICAgICAgIGNvbnN0IFt1bml0ID0gJ3JhZCddID0gU3RyaW5nKGFuZ2xlKS5tYXRjaChSRUdFWFBfQU5HTEVfVU5JVCkgfHwgW107XG4gICAgICAgIHN3aXRjaCAodW5pdC50b0xvd2VyQ2FzZSgpKSB7XG4gICAgICAgICAgICBjYXNlICdkZWcnOlxuICAgICAgICAgICAgICAgIHJldHVybiAodmFsdWUgLyAzNjApICogKE1hdGguUEkgKiAyKTtcbiAgICAgICAgICAgIGNhc2UgJ2dyYWQnOlxuICAgICAgICAgICAgICAgIHJldHVybiAodmFsdWUgLyA0MDApICogKE1hdGguUEkgKiAyKTtcbiAgICAgICAgICAgIGNhc2UgJ3R1cm4nOlxuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZSAqIChNYXRoLlBJICogMik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlO1xufVxuY29uc3QgU0laRV9BREpVU1RNRU5UX1RZUEVfQ09OVEFJTiA9ICdjb250YWluJztcbmNvbnN0IFNJWkVfQURKVVNUTUVOVF9UWVBFX0NPVkVSID0gJ2NvdmVyJztcbi8qKlxuICogR2V0IHRoZSBtYXggc2l6ZXMgaW4gYSByZWN0YW5nbGUgdW5kZXIgdGhlIGdpdmVuIGFzcGVjdCByYXRpby5cbiAqIEBwYXJhbSB7b2JqZWN0fSBkYXRhIFRoZSBvcmlnaW5hbCBzaXplcy5cbiAqIEBwYXJhbSB7c3RyaW5nfSBbdHlwZV0gVGhlIGFkanVzdCB0eXBlLlxuICogQHJldHVybnMge29iamVjdH0gUmV0dXJucyB0aGUgcmVzdWx0IHNpemVzLlxuICovXG5mdW5jdGlvbiBnZXRBZGp1c3RlZFNpemVzKGRhdGEsIHR5cGUgPSBTSVpFX0FESlVTVE1FTlRfVFlQRV9DT05UQUlOKSB7XG4gICAgY29uc3QgeyBhc3BlY3RSYXRpbyB9ID0gZGF0YTtcbiAgICBsZXQgeyB3aWR0aCwgaGVpZ2h0IH0gPSBkYXRhO1xuICAgIGNvbnN0IGlzVmFsaWRXaWR0aCA9IGlzUG9zaXRpdmVOdW1iZXIod2lkdGgpO1xuICAgIGNvbnN0IGlzVmFsaWRIZWlnaHQgPSBpc1Bvc2l0aXZlTnVtYmVyKGhlaWdodCk7XG4gICAgaWYgKGlzVmFsaWRXaWR0aCAmJiBpc1ZhbGlkSGVpZ2h0KSB7XG4gICAgICAgIGNvbnN0IGFkanVzdGVkV2lkdGggPSBoZWlnaHQgKiBhc3BlY3RSYXRpbztcbiAgICAgICAgaWYgKCh0eXBlID09PSBTSVpFX0FESlVTVE1FTlRfVFlQRV9DT05UQUlOICYmIGFkanVzdGVkV2lkdGggPiB3aWR0aClcbiAgICAgICAgICAgIHx8ICh0eXBlID09PSBTSVpFX0FESlVTVE1FTlRfVFlQRV9DT1ZFUiAmJiBhZGp1c3RlZFdpZHRoIDwgd2lkdGgpKSB7XG4gICAgICAgICAgICBoZWlnaHQgPSB3aWR0aCAvIGFzcGVjdFJhdGlvO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgd2lkdGggPSBoZWlnaHQgKiBhc3BlY3RSYXRpbztcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIGlmIChpc1ZhbGlkV2lkdGgpIHtcbiAgICAgICAgaGVpZ2h0ID0gd2lkdGggLyBhc3BlY3RSYXRpbztcbiAgICB9XG4gICAgZWxzZSBpZiAoaXNWYWxpZEhlaWdodCkge1xuICAgICAgICB3aWR0aCA9IGhlaWdodCAqIGFzcGVjdFJhdGlvO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICB3aWR0aCxcbiAgICAgICAgaGVpZ2h0LFxuICAgIH07XG59XG4vKipcbiAqIE11bHRpcGx5IG11bHRpcGxlIG1hdHJpY2VzLlxuICogQHBhcmFtIHtBcnJheX0gbWF0cml4IFRoZSBmaXJzdCBtYXRyaXguXG4gKiBAcGFyYW0ge0FycmF5fSBhcmdzIFRoZSByZXN0IG1hdHJpY2VzLlxuICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIHRoZSByZXN1bHQgbWF0cml4LlxuICovXG5mdW5jdGlvbiBtdWx0aXBseU1hdHJpY2VzKG1hdHJpeCwgLi4uYXJncykge1xuICAgIGlmIChhcmdzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gbWF0cml4O1xuICAgIH1cbiAgICBjb25zdCBbYTEsIGIxLCBjMSwgZDEsIGUxLCBmMV0gPSBtYXRyaXg7XG4gICAgY29uc3QgW2EyLCBiMiwgYzIsIGQyLCBlMiwgZjJdID0gYXJnc1swXTtcbiAgICAvLyBcdTI1MEMgYTEgYzEgZTEgXHUyNTEwICAgXHUyNTBDIGEyIGMyIGUyIFx1MjUxMFxuICAgIC8vIFx1MjUwMiBiMSBkMSBmMSBcdTI1MDIgXHUwMEQ3IFx1MjUwMiBiMiBkMiBmMiBcdTI1MDJcbiAgICAvLyBcdTI1MTQgMCAgMCAgMSAgXHUyNTE4ICAgXHUyNTE0IDAgIDAgIDEgIFx1MjUxOFxuICAgIG1hdHJpeCA9IFtcbiAgICAgICAgYTEgKiBhMiArIGMxICogYjIgLyogKyBlMSAqIDAgKi8sXG4gICAgICAgIGIxICogYTIgKyBkMSAqIGIyIC8qICsgZjEgKiAwICovLFxuICAgICAgICBhMSAqIGMyICsgYzEgKiBkMiAvKiArIGUxICogMCAqLyxcbiAgICAgICAgYjEgKiBjMiArIGQxICogZDIgLyogKyBmMSAqIDAgKi8sXG4gICAgICAgIGExICogZTIgKyBjMSAqIGYyICsgZTEgLyogKiAxICovLFxuICAgICAgICBiMSAqIGUyICsgZDEgKiBmMiArIGYxIC8qICogMSAqLyxcbiAgICBdO1xuICAgIHJldHVybiBtdWx0aXBseU1hdHJpY2VzKG1hdHJpeCwgLi4uYXJncy5zbGljZSgxKSk7XG59XG5cbmV4cG9ydCB7IEFDVElPTl9NT1ZFLCBBQ1RJT05fTk9ORSwgQUNUSU9OX1JFU0laRV9FQVNULCBBQ1RJT05fUkVTSVpFX05PUlRILCBBQ1RJT05fUkVTSVpFX05PUlRIRUFTVCwgQUNUSU9OX1JFU0laRV9OT1JUSFdFU1QsIEFDVElPTl9SRVNJWkVfU09VVEgsIEFDVElPTl9SRVNJWkVfU09VVEhFQVNULCBBQ1RJT05fUkVTSVpFX1NPVVRIV0VTVCwgQUNUSU9OX1JFU0laRV9XRVNULCBBQ1RJT05fUk9UQVRFLCBBQ1RJT05fU0NBTEUsIEFDVElPTl9TRUxFQ1QsIEFDVElPTl9UUkFOU0ZPUk0sIEFUVFJJQlVURV9BQ1RJT04sIENST1BQRVJfQ0FOVkFTLCBDUk9QUEVSX0NST1NTSEFJUiwgQ1JPUFBFUl9HSVJELCBDUk9QUEVSX0hBTkRMRSwgQ1JPUFBFUl9JTUFHRSwgQ1JPUFBFUl9TRUxFQ1RJT04sIENST1BQRVJfU0hBREUsIENST1BQRVJfVklFV0VSLCBFVkVOVF9BQ1RJT04sIEVWRU5UX0FDVElPTl9FTkQsIEVWRU5UX0FDVElPTl9NT1ZFLCBFVkVOVF9BQ1RJT05fU1RBUlQsIEVWRU5UX0NIQU5HRSwgRVZFTlRfRVJST1IsIEVWRU5UX0tFWURPV04sIEVWRU5UX0xPQUQsIEVWRU5UX1BPSU5URVJfRE9XTiwgRVZFTlRfUE9JTlRFUl9NT1ZFLCBFVkVOVF9QT0lOVEVSX1VQLCBFVkVOVF9SRVNJWkUsIEVWRU5UX1RPVUNIX0VORCwgRVZFTlRfVE9VQ0hfTU9WRSwgRVZFTlRfVE9VQ0hfU1RBUlQsIEVWRU5UX1RSQU5TRk9STSwgRVZFTlRfV0hFRUwsIEhBU19QT0lOVEVSX0VWRU5ULCBJU19CUk9XU0VSLCBJU19UT1VDSF9ERVZJQ0UsIE5BTUVTUEFDRSwgV0lORE9XLCBlbWl0LCBnZXRBZGp1c3RlZFNpemVzLCBnZXRPZmZzZXQsIGlzRWxlbWVudCwgaXNGdW5jdGlvbiwgaXNOYU4sIGlzTnVtYmVyLCBpc09iamVjdCwgaXNQbGFpbk9iamVjdCwgaXNQb3NpdGl2ZU51bWJlciwgaXNTdHJpbmcsIGlzVW5kZWZpbmVkLCBtdWx0aXBseU1hdHJpY2VzLCBuZXh0VGljaywgb2ZmLCBvbiwgb25jZSwgdG9BbmdsZUluUmFkaWFuLCB0b0NhbWVsQ2FzZSwgdG9LZWJhYkNhc2UgfTtcbiIsICJpbXBvcnQgeyBXSU5ET1csIHRvQ2FtZWxDYXNlLCB0b0tlYmFiQ2FzZSwgaXNOYU4sIGlzVW5kZWZpbmVkLCBpc051bWJlciwgZW1pdCwgbmV4dFRpY2ssIGlzT2JqZWN0LCBJU19CUk9XU0VSIH0gZnJvbSAnQGNyb3BwZXIvdXRpbHMnO1xuXG52YXIgc3R5bGUgPSBgOmhvc3QoW2hpZGRlbl0pe2Rpc3BsYXk6bm9uZSFpbXBvcnRhbnR9YDtcblxuY29uc3QgUkVHRVhQX1NVRkZJWCA9IC9sZWZ0fHRvcHx3aWR0aHxoZWlnaHQvaTtcbmNvbnN0IERFRkFVTFRfU0hBRE9XX1JPT1RfTU9ERSA9ICdvcGVuJztcbmNvbnN0IHNoYWRvd1Jvb3RzID0gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IHN0eWxlU2hlZXRzID0gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IHRhZ05hbWVzID0gbmV3IE1hcCgpO1xuY29uc3Qgc3VwcG9ydHNBZG9wdGVkU3R5bGVTaGVldHMgPSBXSU5ET1cuZG9jdW1lbnQgJiYgQXJyYXkuaXNBcnJheShXSU5ET1cuZG9jdW1lbnQuYWRvcHRlZFN0eWxlU2hlZXRzKSAmJiAncmVwbGFjZVN5bmMnIGluIFdJTkRPVy5DU1NTdHlsZVNoZWV0LnByb3RvdHlwZTtcbmNsYXNzIENyb3BwZXJFbGVtZW50IGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuICAgIGdldCAkc2hhcmVkU3R5bGUoKSB7XG4gICAgICAgIHJldHVybiBgJHt0aGlzLnRoZW1lQ29sb3IgPyBgOmhvc3R7LS10aGVtZS1jb2xvcjogJHt0aGlzLnRoZW1lQ29sb3J9O31gIDogJyd9JHtzdHlsZX1gO1xuICAgIH1cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdmFyIF9hLCBfYjtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5zaGFkb3dSb290TW9kZSA9IERFRkFVTFRfU0hBRE9XX1JPT1RfTU9ERTtcbiAgICAgICAgdGhpcy5zbG90dGFibGUgPSB0cnVlO1xuICAgICAgICBjb25zdCBuYW1lID0gKF9iID0gKF9hID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKHRoaXMpKSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2EuY29uc3RydWN0b3IpID09PSBudWxsIHx8IF9iID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYi4kbmFtZTtcbiAgICAgICAgaWYgKG5hbWUpIHtcbiAgICAgICAgICAgIHRhZ05hbWVzLnNldChuYW1lLCB0aGlzLnRhZ05hbWUudG9Mb3dlckNhc2UoKSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICAnc2hhZG93LXJvb3QtbW9kZScsXG4gICAgICAgICAgICAnc2xvdHRhYmxlJyxcbiAgICAgICAgICAgICd0aGVtZS1jb2xvcicsXG4gICAgICAgIF07XG4gICAgfVxuICAgIC8vIENvbnZlcnQgYXR0cmlidXRlIHRvIHByb3BlcnR5XG4gICAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSkge1xuICAgICAgICBpZiAoT2JqZWN0LmlzKG5ld1ZhbHVlLCBvbGRWYWx1ZSkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBwcm9wZXJ0eU5hbWUgPSB0b0NhbWVsQ2FzZShuYW1lKTtcbiAgICAgICAgY29uc3Qgb2xkUHJvcGVydHlWYWx1ZSA9IHRoaXNbcHJvcGVydHlOYW1lXTtcbiAgICAgICAgbGV0IG5ld1Byb3BlcnR5VmFsdWUgPSBuZXdWYWx1ZTtcbiAgICAgICAgc3dpdGNoICh0eXBlb2Ygb2xkUHJvcGVydHlWYWx1ZSkge1xuICAgICAgICAgICAgY2FzZSAnYm9vbGVhbic6XG4gICAgICAgICAgICAgICAgbmV3UHJvcGVydHlWYWx1ZSA9IG5ld1ZhbHVlICE9PSBudWxsICYmIG5ld1ZhbHVlICE9PSAnZmFsc2UnO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnbnVtYmVyJzpcbiAgICAgICAgICAgICAgICBuZXdQcm9wZXJ0eVZhbHVlID0gTnVtYmVyKG5ld1ZhbHVlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICB0aGlzW3Byb3BlcnR5TmFtZV0gPSBuZXdQcm9wZXJ0eVZhbHVlO1xuICAgICAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgICAgICAgIGNhc2UgJ3RoZW1lLWNvbG9yJzoge1xuICAgICAgICAgICAgICAgIGNvbnN0IHN0eWxlU2hlZXQgPSBzdHlsZVNoZWV0cy5nZXQodGhpcyk7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3R5bGVzID0gdGhpcy4kc2hhcmVkU3R5bGU7XG4gICAgICAgICAgICAgICAgaWYgKHN0eWxlU2hlZXQgJiYgc3R5bGVzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzdXBwb3J0c0Fkb3B0ZWRTdHlsZVNoZWV0cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGVTaGVldC5yZXBsYWNlU3luYyhzdHlsZXMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGVTaGVldC50ZXh0Q29udGVudCA9IHN0eWxlcztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICAvLyBDb252ZXJ0IHByb3BlcnR5IHRvIGF0dHJpYnV0ZVxuICAgICRwcm9wZXJ0eUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpIHtcbiAgICAgICAgaWYgKE9iamVjdC5pcyhuZXdWYWx1ZSwgb2xkVmFsdWUpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgbmFtZSA9IHRvS2ViYWJDYXNlKG5hbWUpO1xuICAgICAgICBzd2l0Y2ggKHR5cGVvZiBuZXdWYWx1ZSkge1xuICAgICAgICAgICAgY2FzZSAnYm9vbGVhbic6XG4gICAgICAgICAgICAgICAgaWYgKG5ld1ZhbHVlID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5oYXNBdHRyaWJ1dGUobmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKG5hbWUsICcnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVBdHRyaWJ1dGUobmFtZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnbnVtYmVyJzpcbiAgICAgICAgICAgICAgICBpZiAoaXNOYU4obmV3VmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIG5ld1ZhbHVlID0gJyc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBuZXdWYWx1ZSA9IFN0cmluZyhuZXdWYWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gRmFsbCB0aHJvdWdoXG4gICAgICAgICAgICAvLyBjYXNlICdzdHJpbmcnOlxuICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWZhbGx0aHJvdWdoXG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIGlmIChuZXdWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5nZXRBdHRyaWJ1dGUobmFtZSkgIT09IG5ld1ZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShuYW1lLCBuZXdWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlQXR0cmlidXRlKG5hbWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgLy8gT2JzZXJ2ZSBwcm9wZXJ0aWVzIGFmdGVyIG9ic2VydmVkIGF0dHJpYnV0ZXNcbiAgICAgICAgT2JqZWN0LmdldFByb3RvdHlwZU9mKHRoaXMpLmNvbnN0cnVjdG9yLm9ic2VydmVkQXR0cmlidXRlcy5mb3JFYWNoKChhdHRyaWJ1dGUpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHByb3BlcnR5ID0gdG9DYW1lbENhc2UoYXR0cmlidXRlKTtcbiAgICAgICAgICAgIGxldCB2YWx1ZSA9IHRoaXNbcHJvcGVydHldO1xuICAgICAgICAgICAgaWYgKCFpc1VuZGVmaW5lZCh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLiRwcm9wZXJ0eUNoYW5nZWRDYWxsYmFjayhwcm9wZXJ0eSwgdW5kZWZpbmVkLCB2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgcHJvcGVydHksIHtcbiAgICAgICAgICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICBnZXQoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHNldChuZXdWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBvbGRWYWx1ZSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IG5ld1ZhbHVlO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLiRwcm9wZXJ0eUNoYW5nZWRDYWxsYmFjayhwcm9wZXJ0eSwgb2xkVmFsdWUsIG5ld1ZhbHVlKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBzaGFkb3cgPSB0aGlzLmF0dGFjaFNoYWRvdyh7XG4gICAgICAgICAgICBtb2RlOiB0aGlzLnNoYWRvd1Jvb3RNb2RlIHx8IERFRkFVTFRfU0hBRE9XX1JPT1RfTU9ERSxcbiAgICAgICAgfSk7XG4gICAgICAgIGlmICghdGhpcy5zaGFkb3dSb290KSB7XG4gICAgICAgICAgICBzaGFkb3dSb290cy5zZXQodGhpcywgc2hhZG93KTtcbiAgICAgICAgfVxuICAgICAgICBzdHlsZVNoZWV0cy5zZXQodGhpcywgdGhpcy4kYWRkU3R5bGVzKHRoaXMuJHNoYXJlZFN0eWxlKSk7XG4gICAgICAgIGlmICh0aGlzLiRzdHlsZSkge1xuICAgICAgICAgICAgdGhpcy4kYWRkU3R5bGVzKHRoaXMuJHN0eWxlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy4kdGVtcGxhdGUpIHtcbiAgICAgICAgICAgIGNvbnN0IHRlbXBsYXRlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGVtcGxhdGUnKTtcbiAgICAgICAgICAgIHRlbXBsYXRlLmlubmVySFRNTCA9IHRoaXMuJHRlbXBsYXRlO1xuICAgICAgICAgICAgc2hhZG93LmFwcGVuZENoaWxkKHRlbXBsYXRlLmNvbnRlbnQpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnNsb3R0YWJsZSkge1xuICAgICAgICAgICAgY29uc3Qgc2xvdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3Nsb3QnKTtcbiAgICAgICAgICAgIHNoYWRvdy5hcHBlbmRDaGlsZChzbG90KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBkaXNjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgaWYgKHN0eWxlU2hlZXRzLmhhcyh0aGlzKSkge1xuICAgICAgICAgICAgc3R5bGVTaGVldHMuZGVsZXRlKHRoaXMpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzaGFkb3dSb290cy5oYXModGhpcykpIHtcbiAgICAgICAgICAgIHNoYWRvd1Jvb3RzLmRlbGV0ZSh0aGlzKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgY2xhc3MtbWV0aG9kcy11c2UtdGhpc1xuICAgICRnZXRUYWdOYW1lT2YobmFtZSkge1xuICAgICAgICB2YXIgX2E7XG4gICAgICAgIHJldHVybiAoX2EgPSB0YWdOYW1lcy5nZXQobmFtZSkpICE9PSBudWxsICYmIF9hICE9PSB2b2lkIDAgPyBfYSA6IG5hbWU7XG4gICAgfVxuICAgICRzZXRTdHlsZXMocHJvcGVydGllcykge1xuICAgICAgICBPYmplY3Qua2V5cyhwcm9wZXJ0aWVzKS5mb3JFYWNoKChwcm9wZXJ0eSkgPT4ge1xuICAgICAgICAgICAgbGV0IHZhbHVlID0gcHJvcGVydGllc1twcm9wZXJ0eV07XG4gICAgICAgICAgICBpZiAoaXNOdW1iZXIodmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlICE9PSAwICYmIFJFR0VYUF9TVUZGSVgudGVzdChwcm9wZXJ0eSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBgJHt2YWx1ZX1weGA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IFN0cmluZyh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5zdHlsZVtwcm9wZXJ0eV0gPSB2YWx1ZTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBPdXRwdXRzIHRoZSBzaGFkb3cgcm9vdCBvZiB0aGUgZWxlbWVudC5cbiAgICAgKiBAcmV0dXJucyB7U2hhZG93Um9vdH0gUmV0dXJucyB0aGUgc2hhZG93IHJvb3QuXG4gICAgICovXG4gICAgJGdldFNoYWRvd1Jvb3QoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNoYWRvd1Jvb3QgfHwgc2hhZG93Um9vdHMuZ2V0KHRoaXMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBZGRzIHN0eWxlcyB0byB0aGUgc2hhZG93IHJvb3QuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHN0eWxlcyBUaGUgc3R5bGVzIHRvIGFkZC5cbiAgICAgKiBAcmV0dXJucyB7Q1NTU3R5bGVTaGVldHxIVE1MU3R5bGVFbGVtZW50fSBSZXR1cm5zIHRoZSBnZW5lcmF0ZWQgc3R5bGUgc2hlZXQuXG4gICAgICovXG4gICAgJGFkZFN0eWxlcyhzdHlsZXMpIHtcbiAgICAgICAgbGV0IHN0eWxlU2hlZXQ7XG4gICAgICAgIGNvbnN0IHNoYWRvdyA9IHRoaXMuJGdldFNoYWRvd1Jvb3QoKTtcbiAgICAgICAgaWYgKHN1cHBvcnRzQWRvcHRlZFN0eWxlU2hlZXRzKSB7XG4gICAgICAgICAgICBzdHlsZVNoZWV0ID0gbmV3IENTU1N0eWxlU2hlZXQoKTtcbiAgICAgICAgICAgIHN0eWxlU2hlZXQucmVwbGFjZVN5bmMoc3R5bGVzKTtcbiAgICAgICAgICAgIHNoYWRvdy5hZG9wdGVkU3R5bGVTaGVldHMgPSBzaGFkb3cuYWRvcHRlZFN0eWxlU2hlZXRzLmNvbmNhdChzdHlsZVNoZWV0KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHN0eWxlU2hlZXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuICAgICAgICAgICAgc3R5bGVTaGVldC50ZXh0Q29udGVudCA9IHN0eWxlcztcbiAgICAgICAgICAgIHNoYWRvdy5hcHBlbmRDaGlsZChzdHlsZVNoZWV0KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc3R5bGVTaGVldDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRGlzcGF0Y2hlcyBhbiBldmVudCBhdCB0aGUgZWxlbWVudC5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdHlwZSBUaGUgbmFtZSBvZiB0aGUgZXZlbnQuXG4gICAgICogQHBhcmFtIHsqfSBbZGV0YWlsXSBUaGUgZGF0YSBwYXNzZWQgd2hlbiBpbml0aWFsaXppbmcgdGhlIGV2ZW50LlxuICAgICAqIEBwYXJhbSB7Q3VzdG9tRXZlbnRJbml0fSBbb3B0aW9uc10gVGhlIG90aGVyIGV2ZW50IG9wdGlvbnMuXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgdGhlIHJlc3VsdCB2YWx1ZS5cbiAgICAgKi9cbiAgICAkZW1pdCh0eXBlLCBkZXRhaWwsIG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIGVtaXQodGhpcywgdHlwZSwgZGV0YWlsLCBvcHRpb25zKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRGVmZXJzIHRoZSBjYWxsYmFjayB0byBiZSBleGVjdXRlZCBhZnRlciB0aGUgbmV4dCBET00gdXBkYXRlIGN5Y2xlLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IFtjYWxsYmFja10gVGhlIGNhbGxiYWNrIHRvIGV4ZWN1dGUgYWZ0ZXIgdGhlIG5leHQgRE9NIHVwZGF0ZSBjeWNsZS5cbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gQSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgdG8gbm90aGluZy5cbiAgICAgKi9cbiAgICAkbmV4dFRpY2soY2FsbGJhY2spIHtcbiAgICAgICAgcmV0dXJuIG5leHRUaWNrKHRoaXMsIGNhbGxiYWNrKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRGVmaW5lcyB0aGUgY29uc3RydWN0b3IgYXMgYSBuZXcgY3VzdG9tIGVsZW1lbnQuXG4gICAgICoge0BsaW5rIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9DdXN0b21FbGVtZW50UmVnaXN0cnkvZGVmaW5lfVxuICAgICAqIEBwYXJhbSB7c3RyaW5nfG9iamVjdH0gW25hbWVdIFRoZSBlbGVtZW50IG5hbWUuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zXSBUaGUgZWxlbWVudCBkZWZpbml0aW9uIG9wdGlvbnMuXG4gICAgICovXG4gICAgc3RhdGljICRkZWZpbmUobmFtZSwgb3B0aW9ucykge1xuICAgICAgICBpZiAoaXNPYmplY3QobmFtZSkpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBuYW1lO1xuICAgICAgICAgICAgbmFtZSA9ICcnO1xuICAgICAgICB9XG4gICAgICAgIGlmICghbmFtZSkge1xuICAgICAgICAgICAgbmFtZSA9IHRoaXMuJG5hbWUgfHwgdGhpcy5uYW1lO1xuICAgICAgICB9XG4gICAgICAgIG5hbWUgPSB0b0tlYmFiQ2FzZShuYW1lKTtcbiAgICAgICAgaWYgKElTX0JST1dTRVIgJiYgV0lORE9XLmN1c3RvbUVsZW1lbnRzICYmICFXSU5ET1cuY3VzdG9tRWxlbWVudHMuZ2V0KG5hbWUpKSB7XG4gICAgICAgICAgICBjdXN0b21FbGVtZW50cy5kZWZpbmUobmFtZSwgdGhpcywgb3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICB9XG59XG5Dcm9wcGVyRWxlbWVudC4kdmVyc2lvbiA9ICcyLjAuMCc7XG5cbmV4cG9ydCB7IENyb3BwZXJFbGVtZW50IGFzIGRlZmF1bHQgfTtcbiIsICJpbXBvcnQgQ3JvcHBlckVsZW1lbnQgZnJvbSAnQGNyb3BwZXIvZWxlbWVudCc7XG5pbXBvcnQgeyBDUk9QUEVSX0NBTlZBUywgQUNUSU9OX05PTkUsIG9uLCBFVkVOVF9QT0lOVEVSX0RPV04sIEVWRU5UX1BPSU5URVJfTU9WRSwgRVZFTlRfUE9JTlRFUl9VUCwgRVZFTlRfV0hFRUwsIG9mZiwgaXNOdW1iZXIsIGlzRWxlbWVudCwgQVRUUklCVVRFX0FDVElPTiwgRVZFTlRfQUNUSU9OX1NUQVJULCBFVkVOVF9BQ1RJT05fTU9WRSwgQUNUSU9OX1RSQU5TRk9STSwgRVZFTlRfQUNUSU9OLCBFVkVOVF9BQ1RJT05fRU5ELCBBQ1RJT05fU0NBTEUsIGlzU3RyaW5nLCBpc1BsYWluT2JqZWN0LCBpc1Bvc2l0aXZlTnVtYmVyLCBnZXRBZGp1c3RlZFNpemVzLCBDUk9QUEVSX0lNQUdFLCBpc0Z1bmN0aW9uLCBBQ1RJT05fUk9UQVRFIH0gZnJvbSAnQGNyb3BwZXIvdXRpbHMnO1xuXG52YXIgc3R5bGUgPSBgOmhvc3R7ZGlzcGxheTpibG9jazttaW4taGVpZ2h0OjEwMHB4O21pbi13aWR0aDoyMDBweDtvdmVyZmxvdzpoaWRkZW47cG9zaXRpb246cmVsYXRpdmU7dG91Y2gtYWN0aW9uOm5vbmU7LXdlYmtpdC10b3VjaC1jYWxsb3V0Om5vbmU7LXdlYmtpdC11c2VyLXNlbGVjdDpub25lOy1tb3otdXNlci1zZWxlY3Q6bm9uZTt1c2VyLXNlbGVjdDpub25lfTpob3N0KFtiYWNrZ3JvdW5kXSl7YmFja2dyb3VuZC1jb2xvcjojZmZmO2JhY2tncm91bmQtaW1hZ2U6cmVwZWF0aW5nLWxpbmVhci1ncmFkaWVudCg0NWRlZywjY2NjIDI1JSx0cmFuc3BhcmVudCAwLHRyYW5zcGFyZW50IDc1JSwjY2NjIDAsI2NjYykscmVwZWF0aW5nLWxpbmVhci1ncmFkaWVudCg0NWRlZywjY2NjIDI1JSx0cmFuc3BhcmVudCAwLHRyYW5zcGFyZW50IDc1JSwjY2NjIDAsI2NjYyk7YmFja2dyb3VuZC1pbWFnZTpyZXBlYXRpbmctY29uaWMtZ3JhZGllbnQoI2NjYyAwIDI1JSwjZmZmIDAgNTAlKTtiYWNrZ3JvdW5kLXBvc2l0aW9uOjAgMCwuNXJlbSAuNXJlbTtiYWNrZ3JvdW5kLXNpemU6MXJlbSAxcmVtfTpob3N0KFtkaXNhYmxlZF0pe3BvaW50ZXItZXZlbnRzOm5vbmV9Omhvc3QoW2Rpc2FibGVkXSk6YWZ0ZXJ7Ym90dG9tOjA7Y29udGVudDpcIlwiO2N1cnNvcjpub3QtYWxsb3dlZDtkaXNwbGF5OmJsb2NrO2xlZnQ6MDtwb2ludGVyLWV2ZW50czpub25lO3Bvc2l0aW9uOmFic29sdXRlO3JpZ2h0OjA7dG9wOjB9YDtcblxuY2xhc3MgQ3JvcHBlckNhbnZhcyBleHRlbmRzIENyb3BwZXJFbGVtZW50IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoLi4uYXJndW1lbnRzKTtcbiAgICAgICAgdGhpcy4kb25Qb2ludGVyRG93biA9IG51bGw7XG4gICAgICAgIHRoaXMuJG9uUG9pbnRlck1vdmUgPSBudWxsO1xuICAgICAgICB0aGlzLiRvblBvaW50ZXJVcCA9IG51bGw7XG4gICAgICAgIHRoaXMuJG9uV2hlZWwgPSBudWxsO1xuICAgICAgICB0aGlzLiR3aGVlbGluZyA9IGZhbHNlO1xuICAgICAgICB0aGlzLiRwb2ludGVycyA9IG5ldyBNYXAoKTtcbiAgICAgICAgdGhpcy4kc3R5bGUgPSBzdHlsZTtcbiAgICAgICAgdGhpcy4kYWN0aW9uID0gQUNUSU9OX05PTkU7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmRpc2FibGVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuc2NhbGVTdGVwID0gMC4xO1xuICAgICAgICB0aGlzLnRoZW1lQ29sb3IgPSAnIzM5Zic7XG4gICAgfVxuICAgIHN0YXRpYyBnZXQgb2JzZXJ2ZWRBdHRyaWJ1dGVzKCkge1xuICAgICAgICByZXR1cm4gc3VwZXIub2JzZXJ2ZWRBdHRyaWJ1dGVzLmNvbmNhdChbXG4gICAgICAgICAgICAnYmFja2dyb3VuZCcsXG4gICAgICAgICAgICAnZGlzYWJsZWQnLFxuICAgICAgICAgICAgJ3NjYWxlLXN0ZXAnLFxuICAgICAgICBdKTtcbiAgICB9XG4gICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHN1cGVyLmNvbm5lY3RlZENhbGxiYWNrKCk7XG4gICAgICAgIGlmICghdGhpcy5kaXNhYmxlZCkge1xuICAgICAgICAgICAgdGhpcy4kYmluZCgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGRpc2Nvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICBpZiAoIXRoaXMuZGlzYWJsZWQpIHtcbiAgICAgICAgICAgIHRoaXMuJHVuYmluZCgpO1xuICAgICAgICB9XG4gICAgICAgIHN1cGVyLmRpc2Nvbm5lY3RlZENhbGxiYWNrKCk7XG4gICAgfVxuICAgICRwcm9wZXJ0eUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpIHtcbiAgICAgICAgaWYgKE9iamVjdC5pcyhuZXdWYWx1ZSwgb2xkVmFsdWUpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgc3VwZXIuJHByb3BlcnR5Q2hhbmdlZENhbGxiYWNrKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSk7XG4gICAgICAgIHN3aXRjaCAobmFtZSkge1xuICAgICAgICAgICAgY2FzZSAnZGlzYWJsZWQnOlxuICAgICAgICAgICAgICAgIGlmIChuZXdWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLiR1bmJpbmQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuJGJpbmQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG4gICAgJGJpbmQoKSB7XG4gICAgICAgIGlmICghdGhpcy4kb25Qb2ludGVyRG93bikge1xuICAgICAgICAgICAgdGhpcy4kb25Qb2ludGVyRG93biA9IHRoaXMuJGhhbmRsZVBvaW50ZXJEb3duLmJpbmQodGhpcyk7XG4gICAgICAgICAgICBvbih0aGlzLCBFVkVOVF9QT0lOVEVSX0RPV04sIHRoaXMuJG9uUG9pbnRlckRvd24pO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy4kb25Qb2ludGVyTW92ZSkge1xuICAgICAgICAgICAgdGhpcy4kb25Qb2ludGVyTW92ZSA9IHRoaXMuJGhhbmRsZVBvaW50ZXJNb3ZlLmJpbmQodGhpcyk7XG4gICAgICAgICAgICBvbih0aGlzLm93bmVyRG9jdW1lbnQsIEVWRU5UX1BPSU5URVJfTU9WRSwgdGhpcy4kb25Qb2ludGVyTW92ZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLiRvblBvaW50ZXJVcCkge1xuICAgICAgICAgICAgdGhpcy4kb25Qb2ludGVyVXAgPSB0aGlzLiRoYW5kbGVQb2ludGVyVXAuYmluZCh0aGlzKTtcbiAgICAgICAgICAgIG9uKHRoaXMub3duZXJEb2N1bWVudCwgRVZFTlRfUE9JTlRFUl9VUCwgdGhpcy4kb25Qb2ludGVyVXApO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy4kb25XaGVlbCkge1xuICAgICAgICAgICAgdGhpcy4kb25XaGVlbCA9IHRoaXMuJGhhbmRsZVdoZWVsLmJpbmQodGhpcyk7XG4gICAgICAgICAgICBvbih0aGlzLCBFVkVOVF9XSEVFTCwgdGhpcy4kb25XaGVlbCwge1xuICAgICAgICAgICAgICAgIHBhc3NpdmU6IGZhbHNlLFxuICAgICAgICAgICAgICAgIGNhcHR1cmU6IHRydWUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAkdW5iaW5kKCkge1xuICAgICAgICBpZiAodGhpcy4kb25Qb2ludGVyRG93bikge1xuICAgICAgICAgICAgb2ZmKHRoaXMsIEVWRU5UX1BPSU5URVJfRE9XTiwgdGhpcy4kb25Qb2ludGVyRG93bik7XG4gICAgICAgICAgICB0aGlzLiRvblBvaW50ZXJEb3duID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy4kb25Qb2ludGVyTW92ZSkge1xuICAgICAgICAgICAgb2ZmKHRoaXMub3duZXJEb2N1bWVudCwgRVZFTlRfUE9JTlRFUl9NT1ZFLCB0aGlzLiRvblBvaW50ZXJNb3ZlKTtcbiAgICAgICAgICAgIHRoaXMuJG9uUG9pbnRlck1vdmUgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLiRvblBvaW50ZXJVcCkge1xuICAgICAgICAgICAgb2ZmKHRoaXMub3duZXJEb2N1bWVudCwgRVZFTlRfUE9JTlRFUl9VUCwgdGhpcy4kb25Qb2ludGVyVXApO1xuICAgICAgICAgICAgdGhpcy4kb25Qb2ludGVyVXAgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLiRvbldoZWVsKSB7XG4gICAgICAgICAgICBvZmYodGhpcywgRVZFTlRfV0hFRUwsIHRoaXMuJG9uV2hlZWwsIHtcbiAgICAgICAgICAgICAgICBjYXB0dXJlOiB0cnVlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLiRvbldoZWVsID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cbiAgICAkaGFuZGxlUG9pbnRlckRvd24oZXZlbnQpIHtcbiAgICAgICAgY29uc3QgeyBidXR0b25zLCBidXR0b24sIHR5cGUgfSA9IGV2ZW50O1xuICAgICAgICBpZiAodGhpcy5kaXNhYmxlZCB8fCAoXG4gICAgICAgIC8vIEhhbmRsZSBwb2ludGVyIG9yIG1vdXNlIGV2ZW50LCBhbmQgaWdub3JlIHRvdWNoIGV2ZW50XG4gICAgICAgICgodHlwZSA9PT0gJ3BvaW50ZXJkb3duJyAmJiBldmVudC5wb2ludGVyVHlwZSA9PT0gJ21vdXNlJykgfHwgdHlwZSA9PT0gJ21vdXNlZG93bicpICYmIChcbiAgICAgICAgLy8gTm8gcHJpbWFyeSBidXR0b24gKFVzdWFsbHkgdGhlIGxlZnQgYnV0dG9uKVxuICAgICAgICAoaXNOdW1iZXIoYnV0dG9ucykgJiYgYnV0dG9ucyAhPT0gMSkgfHwgKGlzTnVtYmVyKGJ1dHRvbikgJiYgYnV0dG9uICE9PSAwKVxuICAgICAgICAgICAgLy8gT3BlbiBjb250ZXh0IG1lbnVcbiAgICAgICAgICAgIHx8IGV2ZW50LmN0cmxLZXkpKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHsgJHBvaW50ZXJzIH0gPSB0aGlzO1xuICAgICAgICBsZXQgYWN0aW9uID0gJyc7XG4gICAgICAgIGlmIChldmVudC5jaGFuZ2VkVG91Y2hlcykge1xuICAgICAgICAgICAgQXJyYXkuZnJvbShldmVudC5jaGFuZ2VkVG91Y2hlcykuZm9yRWFjaCgoeyBpZGVudGlmaWVyLCBwYWdlWCwgcGFnZVksIH0pID0+IHtcbiAgICAgICAgICAgICAgICAkcG9pbnRlcnMuc2V0KGlkZW50aWZpZXIsIHtcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRYOiBwYWdlWCxcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRZOiBwYWdlWSxcbiAgICAgICAgICAgICAgICAgICAgZW5kWDogcGFnZVgsXG4gICAgICAgICAgICAgICAgICAgIGVuZFk6IHBhZ2VZLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb25zdCB7IHBvaW50ZXJJZCA9IDAsIHBhZ2VYLCBwYWdlWSB9ID0gZXZlbnQ7XG4gICAgICAgICAgICAkcG9pbnRlcnMuc2V0KHBvaW50ZXJJZCwge1xuICAgICAgICAgICAgICAgIHN0YXJ0WDogcGFnZVgsXG4gICAgICAgICAgICAgICAgc3RhcnRZOiBwYWdlWSxcbiAgICAgICAgICAgICAgICBlbmRYOiBwYWdlWCxcbiAgICAgICAgICAgICAgICBlbmRZOiBwYWdlWSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGlmICgkcG9pbnRlcnMuc2l6ZSA+IDEpIHtcbiAgICAgICAgICAgIGFjdGlvbiA9IEFDVElPTl9UUkFOU0ZPUk07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaXNFbGVtZW50KGV2ZW50LnRhcmdldCkpIHtcbiAgICAgICAgICAgIGFjdGlvbiA9IGV2ZW50LnRhcmdldC5hY3Rpb24gfHwgZXZlbnQudGFyZ2V0LmdldEF0dHJpYnV0ZShBVFRSSUJVVEVfQUNUSU9OKSB8fCAnJztcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy4kZW1pdChFVkVOVF9BQ1RJT05fU1RBUlQsIHtcbiAgICAgICAgICAgIGFjdGlvbixcbiAgICAgICAgICAgIHJlbGF0ZWRFdmVudDogZXZlbnQsXG4gICAgICAgIH0pID09PSBmYWxzZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vIFByZXZlbnQgcGFnZSB6b29taW5nIGluIHRoZSBicm93c2VycyBmb3IgaU9TLlxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB0aGlzLiRhY3Rpb24gPSBhY3Rpb247XG4gICAgICAgIHRoaXMuc3R5bGUud2lsbENoYW5nZSA9ICd0cmFuc2Zvcm0nO1xuICAgIH1cbiAgICAkaGFuZGxlUG9pbnRlck1vdmUoZXZlbnQpIHtcbiAgICAgICAgY29uc3QgeyAkYWN0aW9uLCAkcG9pbnRlcnMgfSA9IHRoaXM7XG4gICAgICAgIGlmICh0aGlzLmRpc2FibGVkIHx8ICRhY3Rpb24gPT09IEFDVElPTl9OT05FIHx8ICRwb2ludGVycy5zaXplID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuJGVtaXQoRVZFTlRfQUNUSU9OX01PVkUsIHtcbiAgICAgICAgICAgIGFjdGlvbjogJGFjdGlvbixcbiAgICAgICAgICAgIHJlbGF0ZWRFdmVudDogZXZlbnQsXG4gICAgICAgIH0pID09PSBmYWxzZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vIFByZXZlbnQgcGFnZSBzY3JvbGxpbmcuXG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGlmIChldmVudC5jaGFuZ2VkVG91Y2hlcykge1xuICAgICAgICAgICAgQXJyYXkuZnJvbShldmVudC5jaGFuZ2VkVG91Y2hlcykuZm9yRWFjaCgoeyBpZGVudGlmaWVyLCBwYWdlWCwgcGFnZVksIH0pID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBwb2ludGVyID0gJHBvaW50ZXJzLmdldChpZGVudGlmaWVyKTtcbiAgICAgICAgICAgICAgICBpZiAocG9pbnRlcikge1xuICAgICAgICAgICAgICAgICAgICBPYmplY3QuYXNzaWduKHBvaW50ZXIsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuZFg6IHBhZ2VYLFxuICAgICAgICAgICAgICAgICAgICAgICAgZW5kWTogcGFnZVksXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgeyBwb2ludGVySWQgPSAwLCBwYWdlWCwgcGFnZVkgfSA9IGV2ZW50O1xuICAgICAgICAgICAgY29uc3QgcG9pbnRlciA9ICRwb2ludGVycy5nZXQocG9pbnRlcklkKTtcbiAgICAgICAgICAgIGlmIChwb2ludGVyKSB7XG4gICAgICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihwb2ludGVyLCB7XG4gICAgICAgICAgICAgICAgICAgIGVuZFg6IHBhZ2VYLFxuICAgICAgICAgICAgICAgICAgICBlbmRZOiBwYWdlWSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zdCBkZXRhaWwgPSB7XG4gICAgICAgICAgICBhY3Rpb246ICRhY3Rpb24sXG4gICAgICAgICAgICByZWxhdGVkRXZlbnQ6IGV2ZW50LFxuICAgICAgICB9O1xuICAgICAgICBpZiAoJGFjdGlvbiA9PT0gQUNUSU9OX1RSQU5TRk9STSkge1xuICAgICAgICAgICAgY29uc3QgcG9pbnRlcnMyID0gbmV3IE1hcCgkcG9pbnRlcnMpO1xuICAgICAgICAgICAgbGV0IG1heFJvdGF0ZVJhdGUgPSAwO1xuICAgICAgICAgICAgbGV0IG1heFNjYWxlUmF0ZSA9IDA7XG4gICAgICAgICAgICBsZXQgcm90YXRlID0gMDtcbiAgICAgICAgICAgIGxldCBzY2FsZSA9IDA7XG4gICAgICAgICAgICBsZXQgY2VudGVyWCA9IGV2ZW50LnBhZ2VYO1xuICAgICAgICAgICAgbGV0IGNlbnRlclkgPSBldmVudC5wYWdlWTtcbiAgICAgICAgICAgICRwb2ludGVycy5mb3JFYWNoKChwb2ludGVyLCBwb2ludGVySWQpID0+IHtcbiAgICAgICAgICAgICAgICBwb2ludGVyczIuZGVsZXRlKHBvaW50ZXJJZCk7XG4gICAgICAgICAgICAgICAgcG9pbnRlcnMyLmZvckVhY2goKHBvaW50ZXIyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGxldCB4MSA9IHBvaW50ZXIyLnN0YXJ0WCAtIHBvaW50ZXIuc3RhcnRYO1xuICAgICAgICAgICAgICAgICAgICBsZXQgeTEgPSBwb2ludGVyMi5zdGFydFkgLSBwb2ludGVyLnN0YXJ0WTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHgyID0gcG9pbnRlcjIuZW5kWCAtIHBvaW50ZXIuZW5kWDtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHkyID0gcG9pbnRlcjIuZW5kWSAtIHBvaW50ZXIuZW5kWTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHoxID0gMDtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHoyID0gMDtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGExID0gMDtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGEyID0gMDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHgxID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoeTEgPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYTEgPSBNYXRoLlBJICogMjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHkxID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGExID0gTWF0aC5QSTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICh4MSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGExID0gKE1hdGguUEkgLyAyKSArIE1hdGguYXRhbih5MSAvIHgxKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICh4MSA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGExID0gKE1hdGguUEkgKiAxLjUpICsgTWF0aC5hdGFuKHkxIC8geDEpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICh4MiA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHkyIDwgMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGEyID0gTWF0aC5QSSAqIDI7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICh5MiA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhMiA9IE1hdGguUEk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoeDIgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhMiA9IChNYXRoLlBJIC8gMikgKyBNYXRoLmF0YW4oeTIgLyB4Mik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoeDIgPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhMiA9IChNYXRoLlBJICogMS41KSArIE1hdGguYXRhbih5MiAvIHgyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoYTIgPiAwIHx8IGExID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgcm90YXRlUmF0ZSA9IGEyIC0gYTE7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBhYnNSb3RhdGVSYXRlID0gTWF0aC5hYnMocm90YXRlUmF0ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWJzUm90YXRlUmF0ZSA+IG1heFJvdGF0ZVJhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXhSb3RhdGVSYXRlID0gYWJzUm90YXRlUmF0ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByb3RhdGUgPSByb3RhdGVSYXRlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNlbnRlclggPSAocG9pbnRlci5zdGFydFggKyBwb2ludGVyMi5zdGFydFgpIC8gMjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjZW50ZXJZID0gKHBvaW50ZXIuc3RhcnRZICsgcG9pbnRlcjIuc3RhcnRZKSAvIDI7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgeDEgPSBNYXRoLmFicyh4MSk7XG4gICAgICAgICAgICAgICAgICAgIHkxID0gTWF0aC5hYnMoeTEpO1xuICAgICAgICAgICAgICAgICAgICB4MiA9IE1hdGguYWJzKHgyKTtcbiAgICAgICAgICAgICAgICAgICAgeTIgPSBNYXRoLmFicyh5Mik7XG4gICAgICAgICAgICAgICAgICAgIGlmICh4MSA+IDAgJiYgeTEgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB6MSA9IE1hdGguc3FydCgoeDEgKiB4MSkgKyAoeTEgKiB5MSkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHgxID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgejEgPSB4MTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICh5MSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHoxID0geTE7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHgyID4gMCAmJiB5MiA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHoyID0gTWF0aC5zcXJ0KCh4MiAqIHgyKSArICh5MiAqIHkyKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoeDIgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB6MiA9IHgyO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHkyID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgejIgPSB5MjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoejEgPiAwICYmIHoyID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2NhbGVSYXRlID0gKHoyIC0gejEpIC8gejE7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBhYnNTY2FsZVJhdGUgPSBNYXRoLmFicyhzY2FsZVJhdGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFic1NjYWxlUmF0ZSA+IG1heFNjYWxlUmF0ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1heFNjYWxlUmF0ZSA9IGFic1NjYWxlUmF0ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY2FsZSA9IHNjYWxlUmF0ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjZW50ZXJYID0gKHBvaW50ZXIuc3RhcnRYICsgcG9pbnRlcjIuc3RhcnRYKSAvIDI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2VudGVyWSA9IChwb2ludGVyLnN0YXJ0WSArIHBvaW50ZXIyLnN0YXJ0WSkgLyAyO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnN0IHJvdGF0YWJsZSA9IG1heFJvdGF0ZVJhdGUgPiAwO1xuICAgICAgICAgICAgY29uc3Qgc2NhbGFibGUgPSBtYXhTY2FsZVJhdGUgPiAwO1xuICAgICAgICAgICAgaWYgKHJvdGF0YWJsZSAmJiBzY2FsYWJsZSkge1xuICAgICAgICAgICAgICAgIGRldGFpbC5yb3RhdGUgPSByb3RhdGU7XG4gICAgICAgICAgICAgICAgZGV0YWlsLnNjYWxlID0gc2NhbGU7XG4gICAgICAgICAgICAgICAgZGV0YWlsLmNlbnRlclggPSBjZW50ZXJYO1xuICAgICAgICAgICAgICAgIGRldGFpbC5jZW50ZXJZID0gY2VudGVyWTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHJvdGF0YWJsZSkge1xuICAgICAgICAgICAgICAgIGRldGFpbC5hY3Rpb24gPSBBQ1RJT05fUk9UQVRFO1xuICAgICAgICAgICAgICAgIGRldGFpbC5yb3RhdGUgPSByb3RhdGU7XG4gICAgICAgICAgICAgICAgZGV0YWlsLmNlbnRlclggPSBjZW50ZXJYO1xuICAgICAgICAgICAgICAgIGRldGFpbC5jZW50ZXJZID0gY2VudGVyWTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHNjYWxhYmxlKSB7XG4gICAgICAgICAgICAgICAgZGV0YWlsLmFjdGlvbiA9IEFDVElPTl9TQ0FMRTtcbiAgICAgICAgICAgICAgICBkZXRhaWwuc2NhbGUgPSBzY2FsZTtcbiAgICAgICAgICAgICAgICBkZXRhaWwuY2VudGVyWCA9IGNlbnRlclg7XG4gICAgICAgICAgICAgICAgZGV0YWlsLmNlbnRlclkgPSBjZW50ZXJZO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZGV0YWlsLmFjdGlvbiA9IEFDVElPTl9OT05FO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgW3BvaW50ZXJdID0gQXJyYXkuZnJvbSgkcG9pbnRlcnMudmFsdWVzKCkpO1xuICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihkZXRhaWwsIHBvaW50ZXIpO1xuICAgICAgICB9XG4gICAgICAgIC8vIE92ZXJyaWRlIHRoZSBzdGFydGluZyBjb29yZGluYXRlXG4gICAgICAgICRwb2ludGVycy5mb3JFYWNoKChwb2ludGVyKSA9PiB7XG4gICAgICAgICAgICBwb2ludGVyLnN0YXJ0WCA9IHBvaW50ZXIuZW5kWDtcbiAgICAgICAgICAgIHBvaW50ZXIuc3RhcnRZID0gcG9pbnRlci5lbmRZO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKGRldGFpbC5hY3Rpb24gIT09IEFDVElPTl9OT05FKSB7XG4gICAgICAgICAgICB0aGlzLiRlbWl0KEVWRU5UX0FDVElPTiwgZGV0YWlsLCB7XG4gICAgICAgICAgICAgICAgY2FuY2VsYWJsZTogZmFsc2UsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAkaGFuZGxlUG9pbnRlclVwKGV2ZW50KSB7XG4gICAgICAgIGNvbnN0IHsgJGFjdGlvbiwgJHBvaW50ZXJzIH0gPSB0aGlzO1xuICAgICAgICBpZiAodGhpcy5kaXNhYmxlZCB8fCAkYWN0aW9uID09PSBBQ1RJT05fTk9ORSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLiRlbWl0KEVWRU5UX0FDVElPTl9FTkQsIHtcbiAgICAgICAgICAgIGFjdGlvbjogJGFjdGlvbixcbiAgICAgICAgICAgIHJlbGF0ZWRFdmVudDogZXZlbnQsXG4gICAgICAgIH0pID09PSBmYWxzZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGlmIChldmVudC5jaGFuZ2VkVG91Y2hlcykge1xuICAgICAgICAgICAgQXJyYXkuZnJvbShldmVudC5jaGFuZ2VkVG91Y2hlcykuZm9yRWFjaCgoeyBpZGVudGlmaWVyLCB9KSA9PiB7XG4gICAgICAgICAgICAgICAgJHBvaW50ZXJzLmRlbGV0ZShpZGVudGlmaWVyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgeyBwb2ludGVySWQgPSAwIH0gPSBldmVudDtcbiAgICAgICAgICAgICRwb2ludGVycy5kZWxldGUocG9pbnRlcklkKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoJHBvaW50ZXJzLnNpemUgPT09IDApIHtcbiAgICAgICAgICAgIHRoaXMuc3R5bGUud2lsbENoYW5nZSA9ICcnO1xuICAgICAgICAgICAgdGhpcy4kYWN0aW9uID0gQUNUSU9OX05PTkU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgJGhhbmRsZVdoZWVsKGV2ZW50KSB7XG4gICAgICAgIGlmICh0aGlzLmRpc2FibGVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgLy8gTGltaXQgd2hlZWwgc3BlZWQgdG8gcHJldmVudCB6b29tIHRvbyBmYXN0ICgjMjEpXG4gICAgICAgIGlmICh0aGlzLiR3aGVlbGluZykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuJHdoZWVsaW5nID0gdHJ1ZTtcbiAgICAgICAgLy8gRGVib3VuY2UgYnkgNTBtc1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuJHdoZWVsaW5nID0gZmFsc2U7XG4gICAgICAgIH0sIDUwKTtcbiAgICAgICAgY29uc3QgZGVsdGEgPSBldmVudC5kZWx0YVkgPiAwID8gLTEgOiAxO1xuICAgICAgICBjb25zdCBzY2FsZSA9IGRlbHRhICogdGhpcy5zY2FsZVN0ZXA7XG4gICAgICAgIHRoaXMuJGVtaXQoRVZFTlRfQUNUSU9OLCB7XG4gICAgICAgICAgICBhY3Rpb246IEFDVElPTl9TQ0FMRSxcbiAgICAgICAgICAgIHNjYWxlLFxuICAgICAgICAgICAgcmVsYXRlZEV2ZW50OiBldmVudCxcbiAgICAgICAgfSwge1xuICAgICAgICAgICAgY2FuY2VsYWJsZTogZmFsc2UsXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDaGFuZ2VzIHRoZSBjdXJyZW50IGFjdGlvbiB0byBhIG5ldyBvbmUuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGFjdGlvbiBUaGUgbmV3IGFjdGlvbi5cbiAgICAgKiBAcmV0dXJucyB7Q3JvcHBlckNhbnZhc30gUmV0dXJucyBgdGhpc2AgZm9yIGNoYWluaW5nLlxuICAgICAqL1xuICAgICRzZXRBY3Rpb24oYWN0aW9uKSB7XG4gICAgICAgIGlmIChpc1N0cmluZyhhY3Rpb24pKSB7XG4gICAgICAgICAgICB0aGlzLiRhY3Rpb24gPSBhY3Rpb247XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlcyBhIHJlYWwgY2FudmFzIGVsZW1lbnQsIHdpdGggdGhlIGltYWdlIGRyYXcgaW50byBpZiB0aGVyZSBpcyBvbmUuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zXSBUaGUgYXZhaWxhYmxlIG9wdGlvbnMuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLndpZHRoXSBUaGUgd2lkdGggb2YgdGhlIGNhbnZhcy5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMuaGVpZ2h0XSBUaGUgaGVpZ2h0IG9mIHRoZSBjYW52YXMuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gW29wdGlvbnMuYmVmb3JlRHJhd10gVGhlIGZ1bmN0aW9uIGNhbGxlZCBiZWZvcmUgZHJhd2luZyB0aGUgaW1hZ2Ugb250byB0aGUgY2FudmFzLlxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlfSBSZXR1cm5zIGEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHRvIHRoZSBnZW5lcmF0ZWQgY2FudmFzIGVsZW1lbnQuXG4gICAgICovXG4gICAgJHRvQ2FudmFzKG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGlmICghdGhpcy5pc0Nvbm5lY3RlZCkge1xuICAgICAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoJ1RoZSBjdXJyZW50IGVsZW1lbnQgaXMgbm90IGNvbm5lY3RlZCB0byB0aGUgRE9NLicpKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgICAgICAgIGxldCB3aWR0aCA9IHRoaXMub2Zmc2V0V2lkdGg7XG4gICAgICAgICAgICBsZXQgaGVpZ2h0ID0gdGhpcy5vZmZzZXRIZWlnaHQ7XG4gICAgICAgICAgICBsZXQgc2NhbGUgPSAxO1xuICAgICAgICAgICAgaWYgKGlzUGxhaW5PYmplY3Qob3B0aW9ucylcbiAgICAgICAgICAgICAgICAmJiAoaXNQb3NpdGl2ZU51bWJlcihvcHRpb25zLndpZHRoKSB8fCBpc1Bvc2l0aXZlTnVtYmVyKG9wdGlvbnMuaGVpZ2h0KSkpIHtcbiAgICAgICAgICAgICAgICAoeyB3aWR0aCwgaGVpZ2h0IH0gPSBnZXRBZGp1c3RlZFNpemVzKHtcbiAgICAgICAgICAgICAgICAgICAgYXNwZWN0UmF0aW86IHdpZHRoIC8gaGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgICB3aWR0aDogb3B0aW9ucy53aWR0aCxcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBvcHRpb25zLmhlaWdodCxcbiAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgc2NhbGUgPSB3aWR0aCAvIHRoaXMub2Zmc2V0V2lkdGg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYW52YXMud2lkdGggPSB3aWR0aDtcbiAgICAgICAgICAgIGNhbnZhcy5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgICAgICBjb25zdCBjcm9wcGVySW1hZ2UgPSB0aGlzLnF1ZXJ5U2VsZWN0b3IodGhpcy4kZ2V0VGFnTmFtZU9mKENST1BQRVJfSU1BR0UpKTtcbiAgICAgICAgICAgIGlmICghY3JvcHBlckltYWdlKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShjYW52YXMpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNyb3BwZXJJbWFnZS4kcmVhZHkoKS50aGVuKChpbWFnZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICAgICAgICAgICAgICBpZiAoY29udGV4dCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBbYSwgYiwgYywgZCwgZSwgZl0gPSBjcm9wcGVySW1hZ2UuJGdldFRyYW5zZm9ybSgpO1xuICAgICAgICAgICAgICAgICAgICBsZXQgbmV3RSA9IGU7XG4gICAgICAgICAgICAgICAgICAgIGxldCBuZXdGID0gZjtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGRlc3RXaWR0aCA9IGltYWdlLm5hdHVyYWxXaWR0aDtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGRlc3RIZWlnaHQgPSBpbWFnZS5uYXR1cmFsSGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2NhbGUgIT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld0UgKj0gc2NhbGU7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdGICo9IHNjYWxlO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVzdFdpZHRoICo9IHNjYWxlO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVzdEhlaWdodCAqPSBzY2FsZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjZW50ZXJYID0gZGVzdFdpZHRoIC8gMjtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2VudGVyWSA9IGRlc3RIZWlnaHQgLyAyO1xuICAgICAgICAgICAgICAgICAgICBjb250ZXh0LmZpbGxTdHlsZSA9ICd0cmFuc3BhcmVudCc7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQuZmlsbFJlY3QoMCwgMCwgd2lkdGgsIGhlaWdodCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpc1BsYWluT2JqZWN0KG9wdGlvbnMpICYmIGlzRnVuY3Rpb24ob3B0aW9ucy5iZWZvcmVEcmF3KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5iZWZvcmVEcmF3LmNhbGwodGhpcywgY29udGV4dCwgY2FudmFzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjb250ZXh0LnNhdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gTW92ZSB0aGUgdHJhbnNmb3JtIG9yaWdpbiB0byB0aGUgY2VudGVyIG9mIHRoZSBpbWFnZS5cbiAgICAgICAgICAgICAgICAgICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQ1NTL3RyYW5zZm9ybS1vcmlnaW5cbiAgICAgICAgICAgICAgICAgICAgY29udGV4dC50cmFuc2xhdGUoY2VudGVyWCwgY2VudGVyWSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQudHJhbnNmb3JtKGEsIGIsIGMsIGQsIG5ld0UsIG5ld0YpO1xuICAgICAgICAgICAgICAgICAgICAvLyBSZXNldCB0aGUgdHJhbnNmb3JtIG9yaWdpbiB0byB0aGUgdG9wLWxlZnQgb2YgdGhlIGltYWdlLlxuICAgICAgICAgICAgICAgICAgICBjb250ZXh0LnRyYW5zbGF0ZSgtY2VudGVyWCwgLWNlbnRlclkpO1xuICAgICAgICAgICAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShpbWFnZSwgMCwgMCwgZGVzdFdpZHRoLCBkZXN0SGVpZ2h0KTtcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dC5yZXN0b3JlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlc29sdmUoY2FudmFzKTtcbiAgICAgICAgICAgIH0pLmNhdGNoKHJlamVjdCk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbkNyb3BwZXJDYW52YXMuJG5hbWUgPSBDUk9QUEVSX0NBTlZBUztcbkNyb3BwZXJDYW52YXMuJHZlcnNpb24gPSAnMi4wLjAnO1xuXG5leHBvcnQgeyBDcm9wcGVyQ2FudmFzIGFzIGRlZmF1bHQgfTtcbiIsICJpbXBvcnQgQ3JvcHBlckVsZW1lbnQgZnJvbSAnQGNyb3BwZXIvZWxlbWVudCc7XG5pbXBvcnQgeyBDUk9QUEVSX0lNQUdFLCBDUk9QUEVSX0NBTlZBUywgb24sIEVWRU5UX0FDVElPTl9TVEFSVCwgRVZFTlRfQUNUSU9OX0VORCwgRVZFTlRfQUNUSU9OLCBFVkVOVF9MT0FELCBvZmYsIEFDVElPTl9UUkFOU0ZPUk0sIEFDVElPTl9ST1RBVEUsIEFDVElPTl9TQ0FMRSwgQUNUSU9OX05PTkUsIENST1BQRVJfU0VMRUNUSU9OLCBBQ1RJT05fTU9WRSwgb25jZSwgRVZFTlRfRVJST1IsIGlzRnVuY3Rpb24sIGlzTnVtYmVyLCB0b0FuZ2xlSW5SYWRpYW4sIG11bHRpcGx5TWF0cmljZXMsIEVWRU5UX1RSQU5TRk9STSB9IGZyb20gJ0Bjcm9wcGVyL3V0aWxzJztcblxudmFyIHN0eWxlID0gYDpob3N0e2Rpc3BsYXk6aW5saW5lLWJsb2NrfWltZ3tkaXNwbGF5OmJsb2NrO2hlaWdodDoxMDAlO21heC1oZWlnaHQ6bm9uZSFpbXBvcnRhbnQ7bWF4LXdpZHRoOm5vbmUhaW1wb3J0YW50O21pbi1oZWlnaHQ6MCFpbXBvcnRhbnQ7bWluLXdpZHRoOjAhaW1wb3J0YW50O3dpZHRoOjEwMCV9YDtcblxuY29uc3QgY2FudmFzQ2FjaGUgPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgTkFUSVZFX0FUVFJJQlVURVMgPSBbXG4gICAgJ2FsdCcsXG4gICAgJ2Nyb3Nzb3JpZ2luJyxcbiAgICAnZGVjb2RpbmcnLFxuICAgICdpbXBvcnRhbmNlJyxcbiAgICAnbG9hZGluZycsXG4gICAgJ3JlZmVycmVycG9saWN5JyxcbiAgICAnc2l6ZXMnLFxuICAgICdzcmMnLFxuICAgICdzcmNzZXQnLFxuXTtcbmNsYXNzIENyb3BwZXJJbWFnZSBleHRlbmRzIENyb3BwZXJFbGVtZW50IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoLi4uYXJndW1lbnRzKTtcbiAgICAgICAgdGhpcy4kbWF0cml4ID0gWzEsIDAsIDAsIDEsIDAsIDBdO1xuICAgICAgICB0aGlzLiRvbkxvYWQgPSBudWxsO1xuICAgICAgICB0aGlzLiRvbkNhbnZhc0FjdGlvbiA9IG51bGw7XG4gICAgICAgIHRoaXMuJG9uQ2FudmFzQWN0aW9uRW5kID0gbnVsbDtcbiAgICAgICAgdGhpcy4kb25DYW52YXNBY3Rpb25TdGFydCA9IG51bGw7XG4gICAgICAgIHRoaXMuJGFjdGlvblN0YXJ0VGFyZ2V0ID0gbnVsbDtcbiAgICAgICAgdGhpcy4kc3R5bGUgPSBzdHlsZTtcbiAgICAgICAgdGhpcy4kaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcbiAgICAgICAgdGhpcy5pbml0aWFsQ2VudGVyU2l6ZSA9ICdjb250YWluJztcbiAgICAgICAgdGhpcy5yb3RhdGFibGUgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5zY2FsYWJsZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLnNrZXdhYmxlID0gZmFsc2U7XG4gICAgICAgIHRoaXMuc2xvdHRhYmxlID0gZmFsc2U7XG4gICAgICAgIHRoaXMudHJhbnNsYXRhYmxlID0gZmFsc2U7XG4gICAgfVxuICAgIHNldCAkY2FudmFzKGVsZW1lbnQpIHtcbiAgICAgICAgY2FudmFzQ2FjaGUuc2V0KHRoaXMsIGVsZW1lbnQpO1xuICAgIH1cbiAgICBnZXQgJGNhbnZhcygpIHtcbiAgICAgICAgcmV0dXJuIGNhbnZhc0NhY2hlLmdldCh0aGlzKTtcbiAgICB9XG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7XG4gICAgICAgIHJldHVybiBzdXBlci5vYnNlcnZlZEF0dHJpYnV0ZXMuY29uY2F0KE5BVElWRV9BVFRSSUJVVEVTLCBbXG4gICAgICAgICAgICAnaW5pdGlhbC1jZW50ZXItc2l6ZScsXG4gICAgICAgICAgICAncm90YXRhYmxlJyxcbiAgICAgICAgICAgICdzY2FsYWJsZScsXG4gICAgICAgICAgICAnc2tld2FibGUnLFxuICAgICAgICAgICAgJ3RyYW5zbGF0YWJsZScsXG4gICAgICAgIF0pO1xuICAgIH1cbiAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKSB7XG4gICAgICAgIGlmIChPYmplY3QuaXMobmV3VmFsdWUsIG9sZFZhbHVlKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHN1cGVyLmF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpO1xuICAgICAgICAvLyBJbmhlcml0cyB0aGUgbmF0aXZlIGF0dHJpYnV0ZXNcbiAgICAgICAgaWYgKE5BVElWRV9BVFRSSUJVVEVTLmluY2x1ZGVzKG5hbWUpKSB7XG4gICAgICAgICAgICB0aGlzLiRpbWFnZS5zZXRBdHRyaWJ1dGUobmFtZSwgbmV3VmFsdWUpO1xuICAgICAgICB9XG4gICAgfVxuICAgICRwcm9wZXJ0eUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpIHtcbiAgICAgICAgaWYgKE9iamVjdC5pcyhuZXdWYWx1ZSwgb2xkVmFsdWUpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgc3VwZXIuJHByb3BlcnR5Q2hhbmdlZENhbGxiYWNrKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSk7XG4gICAgICAgIHN3aXRjaCAobmFtZSkge1xuICAgICAgICAgICAgY2FzZSAnaW5pdGlhbENlbnRlclNpemUnOlxuICAgICAgICAgICAgICAgIHRoaXMuJG5leHRUaWNrKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy4kY2VudGVyKG5ld1ZhbHVlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cbiAgICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgc3VwZXIuY29ubmVjdGVkQ2FsbGJhY2soKTtcbiAgICAgICAgY29uc3QgeyAkaW1hZ2UgfSA9IHRoaXM7XG4gICAgICAgIGNvbnN0ICRjYW52YXMgPSB0aGlzLmNsb3Nlc3QodGhpcy4kZ2V0VGFnTmFtZU9mKENST1BQRVJfQ0FOVkFTKSk7XG4gICAgICAgIGlmICgkY2FudmFzKSB7XG4gICAgICAgICAgICB0aGlzLiRjYW52YXMgPSAkY2FudmFzO1xuICAgICAgICAgICAgdGhpcy4kc2V0U3R5bGVzKHtcbiAgICAgICAgICAgICAgICAvLyBNYWtlIGl0IGEgYmxvY2sgZWxlbWVudCB0byBhdm9pZCBzaWRlIGVmZmVjdHMgKCMxMDc0KS5cbiAgICAgICAgICAgICAgICBkaXNwbGF5OiAnYmxvY2snLFxuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLiRvbkNhbnZhc0FjdGlvblN0YXJ0ID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgdmFyIF9hLCBfYjtcbiAgICAgICAgICAgICAgICB0aGlzLiRhY3Rpb25TdGFydFRhcmdldCA9IChfYiA9IChfYSA9IGV2ZW50LmRldGFpbCkgPT09IG51bGwgfHwgX2EgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9hLnJlbGF0ZWRFdmVudCkgPT09IG51bGwgfHwgX2IgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9iLnRhcmdldDtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB0aGlzLiRvbkNhbnZhc0FjdGlvbkVuZCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLiRhY3Rpb25TdGFydFRhcmdldCA9IG51bGw7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdGhpcy4kb25DYW52YXNBY3Rpb24gPSB0aGlzLiRoYW5kbGVBY3Rpb24uYmluZCh0aGlzKTtcbiAgICAgICAgICAgIG9uKCRjYW52YXMsIEVWRU5UX0FDVElPTl9TVEFSVCwgdGhpcy4kb25DYW52YXNBY3Rpb25TdGFydCk7XG4gICAgICAgICAgICBvbigkY2FudmFzLCBFVkVOVF9BQ1RJT05fRU5ELCB0aGlzLiRvbkNhbnZhc0FjdGlvbkVuZCk7XG4gICAgICAgICAgICBvbigkY2FudmFzLCBFVkVOVF9BQ1RJT04sIHRoaXMuJG9uQ2FudmFzQWN0aW9uKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLiRvbkxvYWQgPSB0aGlzLiRoYW5kbGVMb2FkLmJpbmQodGhpcyk7XG4gICAgICAgIG9uKCRpbWFnZSwgRVZFTlRfTE9BRCwgdGhpcy4kb25Mb2FkKTtcbiAgICAgICAgdGhpcy4kZ2V0U2hhZG93Um9vdCgpLmFwcGVuZENoaWxkKCRpbWFnZSk7XG4gICAgfVxuICAgIGRpc2Nvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICBjb25zdCB7ICRpbWFnZSwgJGNhbnZhcyB9ID0gdGhpcztcbiAgICAgICAgaWYgKCRjYW52YXMpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLiRvbkNhbnZhc0FjdGlvblN0YXJ0KSB7XG4gICAgICAgICAgICAgICAgb2ZmKCRjYW52YXMsIEVWRU5UX0FDVElPTl9TVEFSVCwgdGhpcy4kb25DYW52YXNBY3Rpb25TdGFydCk7XG4gICAgICAgICAgICAgICAgdGhpcy4kb25DYW52YXNBY3Rpb25TdGFydCA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy4kb25DYW52YXNBY3Rpb25FbmQpIHtcbiAgICAgICAgICAgICAgICBvZmYoJGNhbnZhcywgRVZFTlRfQUNUSU9OX0VORCwgdGhpcy4kb25DYW52YXNBY3Rpb25FbmQpO1xuICAgICAgICAgICAgICAgIHRoaXMuJG9uQ2FudmFzQWN0aW9uRW5kID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLiRvbkNhbnZhc0FjdGlvbikge1xuICAgICAgICAgICAgICAgIG9mZigkY2FudmFzLCBFVkVOVF9BQ1RJT04sIHRoaXMuJG9uQ2FudmFzQWN0aW9uKTtcbiAgICAgICAgICAgICAgICB0aGlzLiRvbkNhbnZhc0FjdGlvbiA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCRpbWFnZSAmJiB0aGlzLiRvbkxvYWQpIHtcbiAgICAgICAgICAgIG9mZigkaW1hZ2UsIEVWRU5UX0xPQUQsIHRoaXMuJG9uTG9hZCk7XG4gICAgICAgICAgICB0aGlzLiRvbkxvYWQgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuJGdldFNoYWRvd1Jvb3QoKS5yZW1vdmVDaGlsZCgkaW1hZ2UpO1xuICAgICAgICBzdXBlci5kaXNjb25uZWN0ZWRDYWxsYmFjaygpO1xuICAgIH1cbiAgICAkaGFuZGxlTG9hZCgpIHtcbiAgICAgICAgY29uc3QgeyAkaW1hZ2UgfSA9IHRoaXM7XG4gICAgICAgIHRoaXMuJHNldFN0eWxlcyh7XG4gICAgICAgICAgICB3aWR0aDogJGltYWdlLm5hdHVyYWxXaWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogJGltYWdlLm5hdHVyYWxIZWlnaHQsXG4gICAgICAgIH0pO1xuICAgICAgICBpZiAodGhpcy4kY2FudmFzKSB7XG4gICAgICAgICAgICB0aGlzLiRjZW50ZXIodGhpcy5pbml0aWFsQ2VudGVyU2l6ZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgJGhhbmRsZUFjdGlvbihldmVudCkge1xuICAgICAgICBpZiAodGhpcy5oaWRkZW4gfHwgISh0aGlzLnJvdGF0YWJsZSB8fCB0aGlzLnNjYWxhYmxlIHx8IHRoaXMudHJhbnNsYXRhYmxlKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHsgJGNhbnZhcyB9ID0gdGhpcztcbiAgICAgICAgY29uc3QgeyBkZXRhaWwgfSA9IGV2ZW50O1xuICAgICAgICBpZiAoZGV0YWlsKSB7XG4gICAgICAgICAgICBjb25zdCB7IHJlbGF0ZWRFdmVudCB9ID0gZGV0YWlsO1xuICAgICAgICAgICAgbGV0IHsgYWN0aW9uIH0gPSBkZXRhaWw7XG4gICAgICAgICAgICBpZiAoYWN0aW9uID09PSBBQ1RJT05fVFJBTlNGT1JNICYmICghdGhpcy5yb3RhdGFibGUgfHwgIXRoaXMuc2NhbGFibGUpKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMucm90YXRhYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbiA9IEFDVElPTl9ST1RBVEU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHRoaXMuc2NhbGFibGUpIHtcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uID0gQUNUSU9OX1NDQUxFO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uID0gQUNUSU9OX05PTkU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3dpdGNoIChhY3Rpb24pIHtcbiAgICAgICAgICAgICAgICBjYXNlIEFDVElPTl9NT1ZFOlxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy50cmFuc2xhdGFibGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCAkc2VsZWN0aW9uID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZWxhdGVkRXZlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2VsZWN0aW9uID0gcmVsYXRlZEV2ZW50LnRhcmdldC5jbG9zZXN0KHRoaXMuJGdldFRhZ05hbWVPZihDUk9QUEVSX1NFTEVDVElPTikpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEkc2VsZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNlbGVjdGlvbiA9ICRjYW52YXMucXVlcnlTZWxlY3Rvcih0aGlzLiRnZXRUYWdOYW1lT2YoQ1JPUFBFUl9TRUxFQ1RJT04pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkc2VsZWN0aW9uICYmICRzZWxlY3Rpb24ubXVsdGlwbGUgJiYgISRzZWxlY3Rpb24uYWN0aXZlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNlbGVjdGlvbiA9ICRjYW52YXMucXVlcnlTZWxlY3RvcihgJHt0aGlzLiRnZXRUYWdOYW1lT2YoQ1JPUFBFUl9TRUxFQ1RJT04pfVthY3RpdmVdYCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoISRzZWxlY3Rpb24gfHwgJHNlbGVjdGlvbi5oaWRkZW4gfHwgISRzZWxlY3Rpb24ubW92YWJsZSB8fCAkc2VsZWN0aW9uLmR5bmFtaWNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB8fCAhKHRoaXMuJGFjdGlvblN0YXJ0VGFyZ2V0ICYmICRzZWxlY3Rpb24uY29udGFpbnModGhpcy4kYWN0aW9uU3RhcnRUYXJnZXQpKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuJG1vdmUoZGV0YWlsLmVuZFggLSBkZXRhaWwuc3RhcnRYLCBkZXRhaWwuZW5kWSAtIGRldGFpbC5zdGFydFkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgQUNUSU9OX1JPVEFURTpcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMucm90YXRhYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVsYXRlZEV2ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgeyB4LCB5IH0gPSB0aGlzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuJHJvdGF0ZShkZXRhaWwucm90YXRlLCByZWxhdGVkRXZlbnQuY2xpZW50WCAtIHgsIHJlbGF0ZWRFdmVudC5jbGllbnRZIC0geSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLiRyb3RhdGUoZGV0YWlsLnJvdGF0ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBBQ1RJT05fU0NBTEU6XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnNjYWxhYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVsYXRlZEV2ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgJHNlbGVjdGlvbiA9IHJlbGF0ZWRFdmVudC50YXJnZXQuY2xvc2VzdCh0aGlzLiRnZXRUYWdOYW1lT2YoQ1JPUFBFUl9TRUxFQ1RJT04pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoISRzZWxlY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfHwgISRzZWxlY3Rpb24uem9vbWFibGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfHwgKCRzZWxlY3Rpb24uem9vbWFibGUgJiYgJHNlbGVjdGlvbi5keW5hbWljKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB7IHgsIHkgfSA9IHRoaXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuJHpvb20oZGV0YWlsLnNjYWxlLCByZWxhdGVkRXZlbnQuY2xpZW50WCAtIHgsIHJlbGF0ZWRFdmVudC5jbGllbnRZIC0geSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy4kem9vbShkZXRhaWwuc2NhbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgQUNUSU9OX1RSQU5TRk9STTpcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMucm90YXRhYmxlICYmIHRoaXMuc2NhbGFibGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHsgcm90YXRlIH0gPSBkZXRhaWw7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgeyBzY2FsZSB9ID0gZGV0YWlsO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNjYWxlIDwgMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjYWxlID0gMSAvICgxIC0gc2NhbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NhbGUgKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvcyA9IE1hdGguY29zKHJvdGF0ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzaW4gPSBNYXRoLnNpbihyb3RhdGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgW3NjYWxlWCwgc2tld1ksIHNrZXdYLCBzY2FsZVldID0gW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvcyAqIHNjYWxlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpbiAqIHNjYWxlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC1zaW4gKiBzY2FsZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb3MgKiBzY2FsZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVsYXRlZEV2ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY2xpZW50UmVjdCA9IHRoaXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgeCA9IHJlbGF0ZWRFdmVudC5jbGllbnRYIC0gY2xpZW50UmVjdC54O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHkgPSByZWxhdGVkRXZlbnQuY2xpZW50WSAtIGNsaWVudFJlY3QueTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBbYSwgYiwgYywgZF0gPSB0aGlzLiRtYXRyaXg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgb3JpZ2luWCA9IGNsaWVudFJlY3Qud2lkdGggLyAyO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG9yaWdpblkgPSBjbGllbnRSZWN0LmhlaWdodCAvIDI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbW92ZVggPSB4IC0gb3JpZ2luWDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBtb3ZlWSA9IHkgLSBvcmlnaW5ZO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRyYW5zbGF0ZVggPSAoKG1vdmVYICogZCkgLSAoYyAqIG1vdmVZKSkgLyAoKGEgKiBkKSAtIChjICogYikpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRyYW5zbGF0ZVkgPSAoKG1vdmVZICogYSkgLSAoYiAqIG1vdmVYKSkgLyAoKGEgKiBkKSAtIChjICogYikpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqIEVxdWFscyB0b1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqIHRoaXMuJHJvdGF0ZShyb3RhdGUsIHgsIHkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqIHRoaXMuJHNjYWxlKHNjYWxlLCB4LCB5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLiR0cmFuc2Zvcm0oc2NhbGVYLCBza2V3WSwgc2tld1gsIHNjYWxlWSwgdHJhbnNsYXRlWCAqICgxIC0gc2NhbGVYKSArIHRyYW5zbGF0ZVkgKiBza2V3WCwgdHJhbnNsYXRlWSAqICgxIC0gc2NhbGVZKSArIHRyYW5zbGF0ZVggKiBza2V3WSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKiBFcXVhbHMgdG9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKiB0aGlzLiRyb3RhdGUocm90YXRlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKiB0aGlzLiRzY2FsZShzY2FsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy4kdHJhbnNmb3JtKHNjYWxlWCwgc2tld1ksIHNrZXdYLCBzY2FsZVksIDAsIDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIERlZmVycyB0aGUgY2FsbGJhY2sgdG8gZXhlY3V0ZSBhZnRlciBzdWNjZXNzZnVsbHkgbG9hZGluZyB0aGUgaW1hZ2UuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gW2NhbGxiYWNrXSBUaGUgY2FsbGJhY2sgdG8gZXhlY3V0ZSBhZnRlciBzdWNjZXNzZnVsbHkgbG9hZGluZyB0aGUgaW1hZ2UuXG4gICAgICogQHJldHVybnMge1Byb21pc2V9IFJldHVybnMgYSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgdG8gdGhlIGltYWdlIGVsZW1lbnQuXG4gICAgICovXG4gICAgJHJlYWR5KGNhbGxiYWNrKSB7XG4gICAgICAgIGNvbnN0IHsgJGltYWdlIH0gPSB0aGlzO1xuICAgICAgICBjb25zdCBwcm9taXNlID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgZXJyb3IgPSBuZXcgRXJyb3IoJ0ZhaWxlZCB0byBsb2FkIHRoZSBpbWFnZSBzb3VyY2UnKTtcbiAgICAgICAgICAgIGlmICgkaW1hZ2UuY29tcGxldGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoJGltYWdlLm5hdHVyYWxXaWR0aCA+IDAgJiYgJGltYWdlLm5hdHVyYWxIZWlnaHQgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoJGltYWdlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb25Mb2FkID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXVzZS1iZWZvcmUtZGVmaW5lXG4gICAgICAgICAgICAgICAgICAgIG9mZigkaW1hZ2UsIEVWRU5UX0VSUk9SLCBvbkVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgkaW1hZ2UpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgY29uc3Qgb25FcnJvciA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgb2ZmKCRpbWFnZSwgRVZFTlRfTE9BRCwgb25Mb2FkKTtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIG9uY2UoJGltYWdlLCBFVkVOVF9MT0FELCBvbkxvYWQpO1xuICAgICAgICAgICAgICAgIG9uY2UoJGltYWdlLCBFVkVOVF9FUlJPUiwgb25FcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoaXNGdW5jdGlvbihjYWxsYmFjaykpIHtcbiAgICAgICAgICAgIHByb21pc2UudGhlbigoaW1hZ2UpID0+IHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhpbWFnZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGltYWdlO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEFsaWducyB0aGUgaW1hZ2UgdG8gdGhlIGNlbnRlciBvZiBpdHMgcGFyZW50IGVsZW1lbnQuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IFtzaXplXSBUaGUgc2l6ZSBvZiB0aGUgaW1hZ2UuXG4gICAgICogQHJldHVybnMge0Nyb3BwZXJJbWFnZX0gUmV0dXJucyBgdGhpc2AgZm9yIGNoYWluaW5nLlxuICAgICAqL1xuICAgICRjZW50ZXIoc2l6ZSkge1xuICAgICAgICBjb25zdCB7IHBhcmVudEVsZW1lbnQgfSA9IHRoaXM7XG4gICAgICAgIGlmICghcGFyZW50RWxlbWVudCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY29udGFpbmVyID0gcGFyZW50RWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgY29uc3QgY29udGFpbmVyV2lkdGggPSBjb250YWluZXIud2lkdGg7XG4gICAgICAgIGNvbnN0IGNvbnRhaW5lckhlaWdodCA9IGNvbnRhaW5lci5oZWlnaHQ7XG4gICAgICAgIGNvbnN0IHsgeCwgeSwgd2lkdGgsIGhlaWdodCwgfSA9IHRoaXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIGNvbnN0IHN0YXJ0WCA9IHggKyAod2lkdGggLyAyKTtcbiAgICAgICAgY29uc3Qgc3RhcnRZID0geSArIChoZWlnaHQgLyAyKTtcbiAgICAgICAgY29uc3QgZW5kWCA9IGNvbnRhaW5lci54ICsgKGNvbnRhaW5lcldpZHRoIC8gMik7XG4gICAgICAgIGNvbnN0IGVuZFkgPSBjb250YWluZXIueSArIChjb250YWluZXJIZWlnaHQgLyAyKTtcbiAgICAgICAgdGhpcy4kbW92ZShlbmRYIC0gc3RhcnRYLCBlbmRZIC0gc3RhcnRZKTtcbiAgICAgICAgaWYgKHNpemUgJiYgKHdpZHRoICE9PSBjb250YWluZXJXaWR0aCB8fCBoZWlnaHQgIT09IGNvbnRhaW5lckhlaWdodCkpIHtcbiAgICAgICAgICAgIGNvbnN0IHNjYWxlWCA9IGNvbnRhaW5lcldpZHRoIC8gd2lkdGg7XG4gICAgICAgICAgICBjb25zdCBzY2FsZVkgPSBjb250YWluZXJIZWlnaHQgLyBoZWlnaHQ7XG4gICAgICAgICAgICBzd2l0Y2ggKHNpemUpIHtcbiAgICAgICAgICAgICAgICBjYXNlICdjb3Zlcic6XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuJHNjYWxlKE1hdGgubWF4KHNjYWxlWCwgc2NhbGVZKSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ2NvbnRhaW4nOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLiRzY2FsZShNYXRoLm1pbihzY2FsZVgsIHNjYWxlWSkpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogTW92ZXMgdGhlIGltYWdlLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB4IFRoZSBtb3ZpbmcgZGlzdGFuY2UgaW4gdGhlIGhvcml6b250YWwgZGlyZWN0aW9uLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbeV0gVGhlIG1vdmluZyBkaXN0YW5jZSBpbiB0aGUgdmVydGljYWwgZGlyZWN0aW9uLlxuICAgICAqIEByZXR1cm5zIHtDcm9wcGVySW1hZ2V9IFJldHVybnMgYHRoaXNgIGZvciBjaGFpbmluZy5cbiAgICAgKi9cbiAgICAkbW92ZSh4LCB5ID0geCkge1xuICAgICAgICBpZiAodGhpcy50cmFuc2xhdGFibGUgJiYgaXNOdW1iZXIoeCkgJiYgaXNOdW1iZXIoeSkpIHtcbiAgICAgICAgICAgIGNvbnN0IFthLCBiLCBjLCBkXSA9IHRoaXMuJG1hdHJpeDtcbiAgICAgICAgICAgIGNvbnN0IGUgPSAoKHggKiBkKSAtIChjICogeSkpIC8gKChhICogZCkgLSAoYyAqIGIpKTtcbiAgICAgICAgICAgIGNvbnN0IGYgPSAoKHkgKiBhKSAtIChiICogeCkpIC8gKChhICogZCkgLSAoYyAqIGIpKTtcbiAgICAgICAgICAgIHRoaXMuJHRyYW5zbGF0ZShlLCBmKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogTW92ZXMgdGhlIGltYWdlIHRvIGEgc3BlY2lmaWMgcG9zaXRpb24uXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHggVGhlIG5ldyBwb3NpdGlvbiBpbiB0aGUgaG9yaXpvbnRhbCBkaXJlY3Rpb24uXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFt5XSBUaGUgbmV3IHBvc2l0aW9uIGluIHRoZSB2ZXJ0aWNhbCBkaXJlY3Rpb24uXG4gICAgICogQHJldHVybnMge0Nyb3BwZXJJbWFnZX0gUmV0dXJucyBgdGhpc2AgZm9yIGNoYWluaW5nLlxuICAgICAqL1xuICAgICRtb3ZlVG8oeCwgeSA9IHgpIHtcbiAgICAgICAgaWYgKHRoaXMudHJhbnNsYXRhYmxlICYmIGlzTnVtYmVyKHgpICYmIGlzTnVtYmVyKHkpKSB7XG4gICAgICAgICAgICBjb25zdCBbYSwgYiwgYywgZF0gPSB0aGlzLiRtYXRyaXg7XG4gICAgICAgICAgICBjb25zdCBlID0gKCh4ICogZCkgLSAoYyAqIHkpKSAvICgoYSAqIGQpIC0gKGMgKiBiKSk7XG4gICAgICAgICAgICBjb25zdCBmID0gKCh5ICogYSkgLSAoYiAqIHgpKSAvICgoYSAqIGQpIC0gKGMgKiBiKSk7XG4gICAgICAgICAgICB0aGlzLiRzZXRUcmFuc2Zvcm0oYSwgYiwgYywgZCwgZSwgZik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJvdGF0ZXMgdGhlIGltYWdlLlxuICAgICAqIHtAbGluayBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9DU1MvdHJhbnNmb3JtLWZ1bmN0aW9uL3JvdGF0ZX1cbiAgICAgKiB7QGxpbmsgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0NhbnZhc1JlbmRlcmluZ0NvbnRleHQyRC9yb3RhdGV9XG4gICAgICogQHBhcmFtIHtudW1iZXJ8c3RyaW5nfSBhbmdsZSBUaGUgcm90YXRpb24gYW5nbGUgKGluIHJhZGlhbnMpLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbeF0gVGhlIHJvdGF0aW9uIG9yaWdpbiBpbiB0aGUgaG9yaXpvbnRhbCwgZGVmYXVsdHMgdG8gdGhlIGNlbnRlciBvZiB0aGUgaW1hZ2UuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFt5XSBUaGUgcm90YXRpb24gb3JpZ2luIGluIHRoZSB2ZXJ0aWNhbCwgZGVmYXVsdHMgdG8gdGhlIGNlbnRlciBvZiB0aGUgaW1hZ2UuXG4gICAgICogQHJldHVybnMge0Nyb3BwZXJJbWFnZX0gUmV0dXJucyBgdGhpc2AgZm9yIGNoYWluaW5nLlxuICAgICAqL1xuICAgICRyb3RhdGUoYW5nbGUsIHgsIHkpIHtcbiAgICAgICAgaWYgKHRoaXMucm90YXRhYmxlKSB7XG4gICAgICAgICAgICBjb25zdCByYWRpYW4gPSB0b0FuZ2xlSW5SYWRpYW4oYW5nbGUpO1xuICAgICAgICAgICAgY29uc3QgY29zID0gTWF0aC5jb3MocmFkaWFuKTtcbiAgICAgICAgICAgIGNvbnN0IHNpbiA9IE1hdGguc2luKHJhZGlhbik7XG4gICAgICAgICAgICBjb25zdCBbc2NhbGVYLCBza2V3WSwgc2tld1gsIHNjYWxlWV0gPSBbY29zLCBzaW4sIC1zaW4sIGNvc107XG4gICAgICAgICAgICBpZiAoaXNOdW1iZXIoeCkgJiYgaXNOdW1iZXIoeSkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBbYSwgYiwgYywgZF0gPSB0aGlzLiRtYXRyaXg7XG4gICAgICAgICAgICAgICAgY29uc3QgeyB3aWR0aCwgaGVpZ2h0IH0gPSB0aGlzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9yaWdpblggPSB3aWR0aCAvIDI7XG4gICAgICAgICAgICAgICAgY29uc3Qgb3JpZ2luWSA9IGhlaWdodCAvIDI7XG4gICAgICAgICAgICAgICAgY29uc3QgbW92ZVggPSB4IC0gb3JpZ2luWDtcbiAgICAgICAgICAgICAgICBjb25zdCBtb3ZlWSA9IHkgLSBvcmlnaW5ZO1xuICAgICAgICAgICAgICAgIGNvbnN0IHRyYW5zbGF0ZVggPSAoKG1vdmVYICogZCkgLSAoYyAqIG1vdmVZKSkgLyAoKGEgKiBkKSAtIChjICogYikpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHRyYW5zbGF0ZVkgPSAoKG1vdmVZICogYSkgLSAoYiAqIG1vdmVYKSkgLyAoKGEgKiBkKSAtIChjICogYikpO1xuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIEVxdWFscyB0b1xuICAgICAgICAgICAgICAgICAqIHRoaXMuJHRyYW5zbGF0ZSh0cmFuc2xhdGVYLCB0cmFuc2xhdGVYKTtcbiAgICAgICAgICAgICAgICAgKiB0aGlzLiRyb3RhdGUoYW5nbGUpO1xuICAgICAgICAgICAgICAgICAqIHRoaXMuJHRyYW5zbGF0ZSgtdHJhbnNsYXRlWCwgLXRyYW5zbGF0ZVgpO1xuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIHRoaXMuJHRyYW5zZm9ybShzY2FsZVgsIHNrZXdZLCBza2V3WCwgc2NhbGVZLCB0cmFuc2xhdGVYICogKDEgLSBzY2FsZVgpIC0gdHJhbnNsYXRlWSAqIHNrZXdYLCB0cmFuc2xhdGVZICogKDEgLSBzY2FsZVkpIC0gdHJhbnNsYXRlWCAqIHNrZXdZKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuJHRyYW5zZm9ybShzY2FsZVgsIHNrZXdZLCBza2V3WCwgc2NhbGVZLCAwLCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogWm9vbXMgdGhlIGltYWdlLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBzY2FsZSBUaGUgem9vbSBmYWN0b3IuIFBvc2l0aXZlIG51bWJlcnMgZm9yIHpvb21pbmcgaW4sIGFuZCBuZWdhdGl2ZSBudW1iZXJzIGZvciB6b29taW5nIG91dC5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW3hdIFRoZSB6b29tIG9yaWdpbiBpbiB0aGUgaG9yaXpvbnRhbCwgZGVmYXVsdHMgdG8gdGhlIGNlbnRlciBvZiB0aGUgaW1hZ2UuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFt5XSBUaGUgem9vbSBvcmlnaW4gaW4gdGhlIHZlcnRpY2FsLCBkZWZhdWx0cyB0byB0aGUgY2VudGVyIG9mIHRoZSBpbWFnZS5cbiAgICAgKiBAcmV0dXJucyB7Q3JvcHBlckltYWdlfSBSZXR1cm5zIGB0aGlzYCBmb3IgY2hhaW5pbmcuXG4gICAgICovXG4gICAgJHpvb20oc2NhbGUsIHgsIHkpIHtcbiAgICAgICAgaWYgKCF0aGlzLnNjYWxhYmxlIHx8IHNjYWxlID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgICBpZiAoc2NhbGUgPCAwKSB7XG4gICAgICAgICAgICBzY2FsZSA9IDEgLyAoMSAtIHNjYWxlKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHNjYWxlICs9IDE7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzTnVtYmVyKHgpICYmIGlzTnVtYmVyKHkpKSB7XG4gICAgICAgICAgICBjb25zdCBbYSwgYiwgYywgZF0gPSB0aGlzLiRtYXRyaXg7XG4gICAgICAgICAgICBjb25zdCB7IHdpZHRoLCBoZWlnaHQgfSA9IHRoaXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgICAgICBjb25zdCBvcmlnaW5YID0gd2lkdGggLyAyO1xuICAgICAgICAgICAgY29uc3Qgb3JpZ2luWSA9IGhlaWdodCAvIDI7XG4gICAgICAgICAgICBjb25zdCBtb3ZlWCA9IHggLSBvcmlnaW5YO1xuICAgICAgICAgICAgY29uc3QgbW92ZVkgPSB5IC0gb3JpZ2luWTtcbiAgICAgICAgICAgIGNvbnN0IHRyYW5zbGF0ZVggPSAoKG1vdmVYICogZCkgLSAoYyAqIG1vdmVZKSkgLyAoKGEgKiBkKSAtIChjICogYikpO1xuICAgICAgICAgICAgY29uc3QgdHJhbnNsYXRlWSA9ICgobW92ZVkgKiBhKSAtIChiICogbW92ZVgpKSAvICgoYSAqIGQpIC0gKGMgKiBiKSk7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEVxdWFscyB0b1xuICAgICAgICAgICAgICogdGhpcy4kdHJhbnNsYXRlKHRyYW5zbGF0ZVgsIHRyYW5zbGF0ZVgpO1xuICAgICAgICAgICAgICogdGhpcy4kc2NhbGUoc2NhbGUpO1xuICAgICAgICAgICAgICogdGhpcy4kdHJhbnNsYXRlKC10cmFuc2xhdGVYLCAtdHJhbnNsYXRlWCk7XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHRoaXMuJHRyYW5zZm9ybShzY2FsZSwgMCwgMCwgc2NhbGUsIHRyYW5zbGF0ZVggKiAoMSAtIHNjYWxlKSwgdHJhbnNsYXRlWSAqICgxIC0gc2NhbGUpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuJHNjYWxlKHNjYWxlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogU2NhbGVzIHRoZSBpbWFnZS5cbiAgICAgKiB7QGxpbmsgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQ1NTL3RyYW5zZm9ybS1mdW5jdGlvbi9zY2FsZX1cbiAgICAgKiB7QGxpbmsgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0NhbnZhc1JlbmRlcmluZ0NvbnRleHQyRC9zY2FsZX1cbiAgICAgKiBAcGFyYW0ge251bWJlcn0geCBUaGUgc2NhbGluZyBmYWN0b3IgaW4gdGhlIGhvcml6b250YWwgZGlyZWN0aW9uLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbeV0gVGhlIHNjYWxpbmcgZmFjdG9yIGluIHRoZSB2ZXJ0aWNhbCBkaXJlY3Rpb24uXG4gICAgICogQHJldHVybnMge0Nyb3BwZXJJbWFnZX0gUmV0dXJucyBgdGhpc2AgZm9yIGNoYWluaW5nLlxuICAgICAqL1xuICAgICRzY2FsZSh4LCB5ID0geCkge1xuICAgICAgICBpZiAodGhpcy5zY2FsYWJsZSkge1xuICAgICAgICAgICAgdGhpcy4kdHJhbnNmb3JtKHgsIDAsIDAsIHksIDAsIDApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTa2V3cyB0aGUgaW1hZ2UuXG4gICAgICoge0BsaW5rIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0NTUy90cmFuc2Zvcm0tZnVuY3Rpb24vc2tld31cbiAgICAgKiB7QGxpbmsgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0NhbnZhc1JlbmRlcmluZ0NvbnRleHQyRC90cmFuc2Zvcm19XG4gICAgICogQHBhcmFtIHtudW1iZXJ8c3RyaW5nfSB4IFRoZSBza2V3aW5nIGFuZ2xlIGluIHRoZSBob3Jpem9udGFsIGRpcmVjdGlvbi5cbiAgICAgKiBAcGFyYW0ge251bWJlcnxzdHJpbmd9IFt5XSBUaGUgc2tld2luZyBhbmdsZSBpbiB0aGUgdmVydGljYWwgZGlyZWN0aW9uLlxuICAgICAqIEByZXR1cm5zIHtDcm9wcGVySW1hZ2V9IFJldHVybnMgYHRoaXNgIGZvciBjaGFpbmluZy5cbiAgICAgKi9cbiAgICAkc2tldyh4LCB5ID0gMCkge1xuICAgICAgICBpZiAodGhpcy5za2V3YWJsZSkge1xuICAgICAgICAgICAgY29uc3QgcmFkaWFuWCA9IHRvQW5nbGVJblJhZGlhbih4KTtcbiAgICAgICAgICAgIGNvbnN0IHJhZGlhblkgPSB0b0FuZ2xlSW5SYWRpYW4oeSk7XG4gICAgICAgICAgICB0aGlzLiR0cmFuc2Zvcm0oMSwgTWF0aC50YW4ocmFkaWFuWSksIE1hdGgudGFuKHJhZGlhblgpLCAxLCAwLCAwKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogVHJhbnNsYXRlcyB0aGUgaW1hZ2UuXG4gICAgICoge0BsaW5rIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0NTUy90cmFuc2Zvcm0tZnVuY3Rpb24vdHJhbnNsYXRlfVxuICAgICAqIHtAbGluayBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEL3RyYW5zbGF0ZX1cbiAgICAgKiBAcGFyYW0ge251bWJlcn0geCBUaGUgdHJhbnNsYXRpbmcgZGlzdGFuY2UgaW4gdGhlIGhvcml6b250YWwgZGlyZWN0aW9uLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbeV0gVGhlIHRyYW5zbGF0aW5nIGRpc3RhbmNlIGluIHRoZSB2ZXJ0aWNhbCBkaXJlY3Rpb24uXG4gICAgICogQHJldHVybnMge0Nyb3BwZXJJbWFnZX0gUmV0dXJucyBgdGhpc2AgZm9yIGNoYWluaW5nLlxuICAgICAqL1xuICAgICR0cmFuc2xhdGUoeCwgeSA9IHgpIHtcbiAgICAgICAgaWYgKHRoaXMudHJhbnNsYXRhYmxlICYmIGlzTnVtYmVyKHgpICYmIGlzTnVtYmVyKHkpKSB7XG4gICAgICAgICAgICB0aGlzLiR0cmFuc2Zvcm0oMSwgMCwgMCwgMSwgeCwgeSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFRyYW5zZm9ybXMgdGhlIGltYWdlLlxuICAgICAqIHtAbGluayBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9DU1MvdHJhbnNmb3JtLWZ1bmN0aW9uL21hdHJpeH1cbiAgICAgKiB7QGxpbmsgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0NhbnZhc1JlbmRlcmluZ0NvbnRleHQyRC90cmFuc2Zvcm19XG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGEgVGhlIHNjYWxpbmcgZmFjdG9yIGluIHRoZSBob3Jpem9udGFsIGRpcmVjdGlvbi5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gYiBUaGUgc2tld2luZyBhbmdsZSBpbiB0aGUgdmVydGljYWwgZGlyZWN0aW9uLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBjIFRoZSBza2V3aW5nIGFuZ2xlIGluIHRoZSBob3Jpem9udGFsIGRpcmVjdGlvbi5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gZCBUaGUgc2NhbGluZyBmYWN0b3IgaW4gdGhlIHZlcnRpY2FsIGRpcmVjdGlvbi5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gZSBUaGUgdHJhbnNsYXRpbmcgZGlzdGFuY2UgaW4gdGhlIGhvcml6b250YWwgZGlyZWN0aW9uLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBmIFRoZSB0cmFuc2xhdGluZyBkaXN0YW5jZSBpbiB0aGUgdmVydGljYWwgZGlyZWN0aW9uLlxuICAgICAqIEByZXR1cm5zIHtDcm9wcGVySW1hZ2V9IFJldHVybnMgYHRoaXNgIGZvciBjaGFpbmluZy5cbiAgICAgKi9cbiAgICAkdHJhbnNmb3JtKGEsIGIsIGMsIGQsIGUsIGYpIHtcbiAgICAgICAgaWYgKGlzTnVtYmVyKGEpXG4gICAgICAgICAgICAmJiBpc051bWJlcihiKVxuICAgICAgICAgICAgJiYgaXNOdW1iZXIoYylcbiAgICAgICAgICAgICYmIGlzTnVtYmVyKGQpXG4gICAgICAgICAgICAmJiBpc051bWJlcihlKVxuICAgICAgICAgICAgJiYgaXNOdW1iZXIoZikpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLiRzZXRUcmFuc2Zvcm0obXVsdGlwbHlNYXRyaWNlcyh0aGlzLiRtYXRyaXgsIFthLCBiLCBjLCBkLCBlLCBmXSkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXNldHMgKG92ZXJyaWRlcykgdGhlIGN1cnJlbnQgdHJhbnNmb3JtIHRvIHRoZSBzcGVjaWZpYyBpZGVudGl0eSBtYXRyaXguXG4gICAgICoge0BsaW5rIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9DYW52YXNSZW5kZXJpbmdDb250ZXh0MkQvc2V0VHJhbnNmb3JtfVxuICAgICAqIEBwYXJhbSB7bnVtYmVyfEFycmF5fSBhIFRoZSBzY2FsaW5nIGZhY3RvciBpbiB0aGUgaG9yaXpvbnRhbCBkaXJlY3Rpb24uXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGIgVGhlIHNrZXdpbmcgYW5nbGUgaW4gdGhlIHZlcnRpY2FsIGRpcmVjdGlvbi5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gYyBUaGUgc2tld2luZyBhbmdsZSBpbiB0aGUgaG9yaXpvbnRhbCBkaXJlY3Rpb24uXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGQgVGhlIHNjYWxpbmcgZmFjdG9yIGluIHRoZSB2ZXJ0aWNhbCBkaXJlY3Rpb24uXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGUgVGhlIHRyYW5zbGF0aW5nIGRpc3RhbmNlIGluIHRoZSBob3Jpem9udGFsIGRpcmVjdGlvbi5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gZiBUaGUgdHJhbnNsYXRpbmcgZGlzdGFuY2UgaW4gdGhlIHZlcnRpY2FsIGRpcmVjdGlvbi5cbiAgICAgKiBAcmV0dXJucyB7Q3JvcHBlckltYWdlfSBSZXR1cm5zIGB0aGlzYCBmb3IgY2hhaW5pbmcuXG4gICAgICovXG4gICAgJHNldFRyYW5zZm9ybShhLCBiLCBjLCBkLCBlLCBmKSB7XG4gICAgICAgIGlmICh0aGlzLnJvdGF0YWJsZSB8fCB0aGlzLnNjYWxhYmxlIHx8IHRoaXMuc2tld2FibGUgfHwgdGhpcy50cmFuc2xhdGFibGUpIHtcbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KGEpKSB7XG4gICAgICAgICAgICAgICAgW2EsIGIsIGMsIGQsIGUsIGZdID0gYTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpc051bWJlcihhKVxuICAgICAgICAgICAgICAgICYmIGlzTnVtYmVyKGIpXG4gICAgICAgICAgICAgICAgJiYgaXNOdW1iZXIoYylcbiAgICAgICAgICAgICAgICAmJiBpc051bWJlcihkKVxuICAgICAgICAgICAgICAgICYmIGlzTnVtYmVyKGUpXG4gICAgICAgICAgICAgICAgJiYgaXNOdW1iZXIoZikpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBvbGRNYXRyaXggPSBbLi4udGhpcy4kbWF0cml4XTtcbiAgICAgICAgICAgICAgICBjb25zdCBuZXdNYXRyaXggPSBbYSwgYiwgYywgZCwgZSwgZl07XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuJGVtaXQoRVZFTlRfVFJBTlNGT1JNLCB7XG4gICAgICAgICAgICAgICAgICAgIG1hdHJpeDogbmV3TWF0cml4LFxuICAgICAgICAgICAgICAgICAgICBvbGRNYXRyaXgsXG4gICAgICAgICAgICAgICAgfSkgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLiRtYXRyaXggPSBuZXdNYXRyaXg7XG4gICAgICAgICAgICAgICAgdGhpcy5zdHlsZS50cmFuc2Zvcm0gPSBgbWF0cml4KCR7bmV3TWF0cml4LmpvaW4oJywgJyl9KWA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHJpZXZlcyB0aGUgY3VycmVudCB0cmFuc2Zvcm1hdGlvbiBtYXRyaXggYmVpbmcgYXBwbGllZCB0byB0aGUgZWxlbWVudC5cbiAgICAgKiB7QGxpbmsgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0NhbnZhc1JlbmRlcmluZ0NvbnRleHQyRC9nZXRUcmFuc2Zvcm19XG4gICAgICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIHRoZSByZWFkb25seSB0cmFuc2Zvcm1hdGlvbiBtYXRyaXguXG4gICAgICovXG4gICAgJGdldFRyYW5zZm9ybSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuJG1hdHJpeC5zbGljZSgpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXNldHMgdGhlIGN1cnJlbnQgdHJhbnNmb3JtIHRvIHRoZSBpbml0aWFsIGlkZW50aXR5IG1hdHJpeC5cbiAgICAgKiB7QGxpbmsgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0NhbnZhc1JlbmRlcmluZ0NvbnRleHQyRC9yZXNldFRyYW5zZm9ybX1cbiAgICAgKiBAcmV0dXJucyB7Q3JvcHBlckltYWdlfSBSZXR1cm5zIGB0aGlzYCBmb3IgY2hhaW5pbmcuXG4gICAgICovXG4gICAgJHJlc2V0VHJhbnNmb3JtKCkge1xuICAgICAgICByZXR1cm4gdGhpcy4kc2V0VHJhbnNmb3JtKFsxLCAwLCAwLCAxLCAwLCAwXSk7XG4gICAgfVxufVxuQ3JvcHBlckltYWdlLiRuYW1lID0gQ1JPUFBFUl9JTUFHRTtcbkNyb3BwZXJJbWFnZS4kdmVyc2lvbiA9ICcyLjAuMCc7XG5cbmV4cG9ydCB7IENyb3BwZXJJbWFnZSBhcyBkZWZhdWx0IH07XG4iLCAiaW1wb3J0IENyb3BwZXJFbGVtZW50IGZyb20gJ0Bjcm9wcGVyL2VsZW1lbnQnO1xuaW1wb3J0IHsgQ1JPUFBFUl9TSEFERSwgQ1JPUFBFUl9DQU5WQVMsIENST1BQRVJfU0VMRUNUSU9OLCBBQ1RJT05fU0VMRUNULCBvbiwgRVZFTlRfQUNUSU9OX1NUQVJULCBFVkVOVF9BQ1RJT05fRU5ELCBFVkVOVF9DSEFOR0UsIG9mZiwgaXNOdW1iZXIsIFdJTkRPVyB9IGZyb20gJ0Bjcm9wcGVyL3V0aWxzJztcblxudmFyIHN0eWxlID0gYDpob3N0e2Rpc3BsYXk6YmxvY2s7aGVpZ2h0OjA7bGVmdDowO291dGxpbmU6dmFyKC0tdGhlbWUtY29sb3IpIHNvbGlkIDFweDtwb3NpdGlvbjpyZWxhdGl2ZTt0b3A6MDt3aWR0aDowfTpob3N0KFt0cmFuc3BhcmVudF0pe291dGxpbmUtY29sb3I6dHJhbnNwYXJlbnR9YDtcblxuY29uc3QgY2FudmFzQ2FjaGUgPSBuZXcgV2Vha01hcCgpO1xuY2xhc3MgQ3JvcHBlclNoYWRlIGV4dGVuZHMgQ3JvcHBlckVsZW1lbnQge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlciguLi5hcmd1bWVudHMpO1xuICAgICAgICB0aGlzLiRvbkNhbnZhc0NoYW5nZSA9IG51bGw7XG4gICAgICAgIHRoaXMuJG9uQ2FudmFzQWN0aW9uRW5kID0gbnVsbDtcbiAgICAgICAgdGhpcy4kb25DYW52YXNBY3Rpb25TdGFydCA9IG51bGw7XG4gICAgICAgIHRoaXMuJHN0eWxlID0gc3R5bGU7XG4gICAgICAgIHRoaXMueCA9IDA7XG4gICAgICAgIHRoaXMueSA9IDA7XG4gICAgICAgIHRoaXMud2lkdGggPSAwO1xuICAgICAgICB0aGlzLmhlaWdodCA9IDA7XG4gICAgICAgIHRoaXMuc2xvdHRhYmxlID0gZmFsc2U7XG4gICAgICAgIHRoaXMudGhlbWVDb2xvciA9ICdyZ2JhKDAsIDAsIDAsIDAuNjUpJztcbiAgICB9XG4gICAgc2V0ICRjYW52YXMoZWxlbWVudCkge1xuICAgICAgICBjYW52YXNDYWNoZS5zZXQodGhpcywgZWxlbWVudCk7XG4gICAgfVxuICAgIGdldCAkY2FudmFzKCkge1xuICAgICAgICByZXR1cm4gY2FudmFzQ2FjaGUuZ2V0KHRoaXMpO1xuICAgIH1cbiAgICBzdGF0aWMgZ2V0IG9ic2VydmVkQXR0cmlidXRlcygpIHtcbiAgICAgICAgcmV0dXJuIHN1cGVyLm9ic2VydmVkQXR0cmlidXRlcy5jb25jYXQoW1xuICAgICAgICAgICAgJ2hlaWdodCcsXG4gICAgICAgICAgICAnd2lkdGgnLFxuICAgICAgICAgICAgJ3gnLFxuICAgICAgICAgICAgJ3knLFxuICAgICAgICBdKTtcbiAgICB9XG4gICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHN1cGVyLmNvbm5lY3RlZENhbGxiYWNrKCk7XG4gICAgICAgIGNvbnN0ICRjYW52YXMgPSB0aGlzLmNsb3Nlc3QodGhpcy4kZ2V0VGFnTmFtZU9mKENST1BQRVJfQ0FOVkFTKSk7XG4gICAgICAgIGlmICgkY2FudmFzKSB7XG4gICAgICAgICAgICB0aGlzLiRjYW52YXMgPSAkY2FudmFzO1xuICAgICAgICAgICAgdGhpcy5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgICAgICAgICBjb25zdCAkc2VsZWN0aW9uID0gJGNhbnZhcy5xdWVyeVNlbGVjdG9yKHRoaXMuJGdldFRhZ05hbWVPZihDUk9QUEVSX1NFTEVDVElPTikpO1xuICAgICAgICAgICAgaWYgKCRzZWxlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICB0aGlzLiRvbkNhbnZhc0FjdGlvblN0YXJ0ID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmICgkc2VsZWN0aW9uLmhpZGRlbiAmJiBldmVudC5kZXRhaWwuYWN0aW9uID09PSBBQ1RJT05fU0VMRUNUKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmhpZGRlbiA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB0aGlzLiRvbkNhbnZhc0FjdGlvbkVuZCA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoJHNlbGVjdGlvbi5oaWRkZW4gJiYgZXZlbnQuZGV0YWlsLmFjdGlvbiA9PT0gQUNUSU9OX1NFTEVDVCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5oaWRkZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB0aGlzLiRvbkNhbnZhc0NoYW5nZSA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB7IHgsIHksIHdpZHRoLCBoZWlnaHQsIH0gPSBldmVudC5kZXRhaWw7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuJGNoYW5nZSh4LCB5LCB3aWR0aCwgaGVpZ2h0KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCRzZWxlY3Rpb24uaGlkZGVuIHx8ICh4ID09PSAwICYmIHkgPT09IDAgJiYgd2lkdGggPT09IDAgJiYgaGVpZ2h0ID09PSAwKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5oaWRkZW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBvbigkY2FudmFzLCBFVkVOVF9BQ1RJT05fU1RBUlQsIHRoaXMuJG9uQ2FudmFzQWN0aW9uU3RhcnQpO1xuICAgICAgICAgICAgICAgIG9uKCRjYW52YXMsIEVWRU5UX0FDVElPTl9FTkQsIHRoaXMuJG9uQ2FudmFzQWN0aW9uRW5kKTtcbiAgICAgICAgICAgICAgICBvbigkY2FudmFzLCBFVkVOVF9DSEFOR0UsIHRoaXMuJG9uQ2FudmFzQ2hhbmdlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLiRyZW5kZXIoKTtcbiAgICB9XG4gICAgZGlzY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIGNvbnN0IHsgJGNhbnZhcyB9ID0gdGhpcztcbiAgICAgICAgaWYgKCRjYW52YXMpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLiRvbkNhbnZhc0FjdGlvblN0YXJ0KSB7XG4gICAgICAgICAgICAgICAgb2ZmKCRjYW52YXMsIEVWRU5UX0FDVElPTl9TVEFSVCwgdGhpcy4kb25DYW52YXNBY3Rpb25TdGFydCk7XG4gICAgICAgICAgICAgICAgdGhpcy4kb25DYW52YXNBY3Rpb25TdGFydCA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy4kb25DYW52YXNBY3Rpb25FbmQpIHtcbiAgICAgICAgICAgICAgICBvZmYoJGNhbnZhcywgRVZFTlRfQUNUSU9OX0VORCwgdGhpcy4kb25DYW52YXNBY3Rpb25FbmQpO1xuICAgICAgICAgICAgICAgIHRoaXMuJG9uQ2FudmFzQWN0aW9uRW5kID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLiRvbkNhbnZhc0NoYW5nZSkge1xuICAgICAgICAgICAgICAgIG9mZigkY2FudmFzLCBFVkVOVF9DSEFOR0UsIHRoaXMuJG9uQ2FudmFzQ2hhbmdlKTtcbiAgICAgICAgICAgICAgICB0aGlzLiRvbkNhbnZhc0NoYW5nZSA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgc3VwZXIuZGlzY29ubmVjdGVkQ2FsbGJhY2soKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2hhbmdlcyB0aGUgcG9zaXRpb24gYW5kL29yIHNpemUgb2YgdGhlIHNoYWRlLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB4IFRoZSBuZXcgcG9zaXRpb24gaW4gdGhlIGhvcml6b250YWwgZGlyZWN0aW9uLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB5IFRoZSBuZXcgcG9zaXRpb24gaW4gdGhlIHZlcnRpY2FsIGRpcmVjdGlvbi5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW3dpZHRoXSBUaGUgbmV3IHdpZHRoLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbaGVpZ2h0XSBUaGUgbmV3IGhlaWdodC5cbiAgICAgKiBAcmV0dXJucyB7Q3JvcHBlclNoYWRlfSBSZXR1cm5zIGB0aGlzYCBmb3IgY2hhaW5pbmcuXG4gICAgICovXG4gICAgJGNoYW5nZSh4LCB5LCB3aWR0aCA9IHRoaXMud2lkdGgsIGhlaWdodCA9IHRoaXMuaGVpZ2h0KSB7XG4gICAgICAgIGlmICghaXNOdW1iZXIoeClcbiAgICAgICAgICAgIHx8ICFpc051bWJlcih5KVxuICAgICAgICAgICAgfHwgIWlzTnVtYmVyKHdpZHRoKVxuICAgICAgICAgICAgfHwgIWlzTnVtYmVyKGhlaWdodClcbiAgICAgICAgICAgIHx8ICh4ID09PSB0aGlzLnggJiYgeSA9PT0gdGhpcy55ICYmIHdpZHRoID09PSB0aGlzLndpZHRoICYmIGhlaWdodCA9PT0gdGhpcy5oZWlnaHQpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5oaWRkZW4pIHtcbiAgICAgICAgICAgIHRoaXMuaGlkZGVuID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy54ID0geDtcbiAgICAgICAgdGhpcy55ID0geTtcbiAgICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xuICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgcmV0dXJuIHRoaXMuJHJlbmRlcigpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXNldHMgdGhlIHNoYWRlIHRvIGl0cyBpbml0aWFsIHBvc2l0aW9uIGFuZCBzaXplLlxuICAgICAqIEByZXR1cm5zIHtDcm9wcGVyU2hhZGV9IFJldHVybnMgYHRoaXNgIGZvciBjaGFpbmluZy5cbiAgICAgKi9cbiAgICAkcmVzZXQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLiRjaGFuZ2UoMCwgMCwgMCwgMCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJlZnJlc2hlcyB0aGUgcG9zaXRpb24gb3Igc2l6ZSBvZiB0aGUgc2hhZGUuXG4gICAgICogQHJldHVybnMge0Nyb3BwZXJTaGFkZX0gUmV0dXJucyBgdGhpc2AgZm9yIGNoYWluaW5nLlxuICAgICAqL1xuICAgICRyZW5kZXIoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLiRzZXRTdHlsZXMoe1xuICAgICAgICAgICAgdHJhbnNmb3JtOiBgdHJhbnNsYXRlKCR7dGhpcy54fXB4LCAke3RoaXMueX1weClgLFxuICAgICAgICAgICAgd2lkdGg6IHRoaXMud2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IHRoaXMuaGVpZ2h0LFxuICAgICAgICAgICAgb3V0bGluZVdpZHRoOiBXSU5ET1cuaW5uZXJXaWR0aCxcbiAgICAgICAgfSk7XG4gICAgfVxufVxuQ3JvcHBlclNoYWRlLiRuYW1lID0gQ1JPUFBFUl9TSEFERTtcbkNyb3BwZXJTaGFkZS4kdmVyc2lvbiA9ICcyLjAuMCc7XG5cbmV4cG9ydCB7IENyb3BwZXJTaGFkZSBhcyBkZWZhdWx0IH07XG4iLCAiaW1wb3J0IENyb3BwZXJFbGVtZW50IGZyb20gJ0Bjcm9wcGVyL2VsZW1lbnQnO1xuaW1wb3J0IHsgQ1JPUFBFUl9IQU5ETEUsIEFDVElPTl9OT05FIH0gZnJvbSAnQGNyb3BwZXIvdXRpbHMnO1xuXG52YXIgc3R5bGUgPSBgOmhvc3R7YmFja2dyb3VuZC1jb2xvcjp2YXIoLS10aGVtZS1jb2xvcik7ZGlzcGxheTpibG9ja306aG9zdChbYWN0aW9uPW1vdmVdKSw6aG9zdChbYWN0aW9uPXNlbGVjdF0pe2hlaWdodDoxMDAlO2xlZnQ6MDtwb3NpdGlvbjphYnNvbHV0ZTt0b3A6MDt3aWR0aDoxMDAlfTpob3N0KFthY3Rpb249bW92ZV0pe2N1cnNvcjptb3ZlfTpob3N0KFthY3Rpb249c2VsZWN0XSl7Y3Vyc29yOmNyb3NzaGFpcn06aG9zdChbYWN0aW9uJD0tcmVzaXplXSl7YmFja2dyb3VuZC1jb2xvcjp0cmFuc3BhcmVudDtoZWlnaHQ6MTVweDtwb3NpdGlvbjphYnNvbHV0ZTt3aWR0aDoxNXB4fTpob3N0KFthY3Rpb24kPS1yZXNpemVdKTphZnRlcntiYWNrZ3JvdW5kLWNvbG9yOnZhcigtLXRoZW1lLWNvbG9yKTtjb250ZW50OlwiXCI7ZGlzcGxheTpibG9jaztoZWlnaHQ6NXB4O2xlZnQ6NTAlO3Bvc2l0aW9uOmFic29sdXRlO3RvcDo1MCU7dHJhbnNmb3JtOnRyYW5zbGF0ZSgtNTAlLC01MCUpO3dpZHRoOjVweH06aG9zdChbYWN0aW9uPW4tcmVzaXplXSksOmhvc3QoW2FjdGlvbj1zLXJlc2l6ZV0pe2N1cnNvcjpucy1yZXNpemU7bGVmdDo1MCU7dHJhbnNmb3JtOnRyYW5zbGF0ZVgoLTUwJSk7d2lkdGg6MTAwJX06aG9zdChbYWN0aW9uPW4tcmVzaXplXSl7dG9wOi04cHh9Omhvc3QoW2FjdGlvbj1zLXJlc2l6ZV0pe2JvdHRvbTotOHB4fTpob3N0KFthY3Rpb249ZS1yZXNpemVdKSw6aG9zdChbYWN0aW9uPXctcmVzaXplXSl7Y3Vyc29yOmV3LXJlc2l6ZTtoZWlnaHQ6MTAwJTt0b3A6NTAlO3RyYW5zZm9ybTp0cmFuc2xhdGVZKC01MCUpfTpob3N0KFthY3Rpb249ZS1yZXNpemVdKXtyaWdodDotOHB4fTpob3N0KFthY3Rpb249dy1yZXNpemVdKXtsZWZ0Oi04cHh9Omhvc3QoW2FjdGlvbj1uZS1yZXNpemVdKXtjdXJzb3I6bmVzdy1yZXNpemU7cmlnaHQ6LThweDt0b3A6LThweH06aG9zdChbYWN0aW9uPW53LXJlc2l6ZV0pe2N1cnNvcjpud3NlLXJlc2l6ZTtsZWZ0Oi04cHg7dG9wOi04cHh9Omhvc3QoW2FjdGlvbj1zZS1yZXNpemVdKXtib3R0b206LThweDtjdXJzb3I6bndzZS1yZXNpemU7cmlnaHQ6LThweH06aG9zdChbYWN0aW9uPXNlLXJlc2l6ZV0pOmFmdGVye2hlaWdodDoxNXB4O3dpZHRoOjE1cHh9QG1lZGlhIChwb2ludGVyOmNvYXJzZSl7Omhvc3QoW2FjdGlvbj1zZS1yZXNpemVdKTphZnRlcntoZWlnaHQ6MTBweDt3aWR0aDoxMHB4fX1AbWVkaWEgKHBvaW50ZXI6ZmluZSl7Omhvc3QoW2FjdGlvbj1zZS1yZXNpemVdKTphZnRlcntoZWlnaHQ6NXB4O3dpZHRoOjVweH19Omhvc3QoW2FjdGlvbj1zdy1yZXNpemVdKXtib3R0b206LThweDtjdXJzb3I6bmVzdy1yZXNpemU7bGVmdDotOHB4fTpob3N0KFtwbGFpbl0pe2JhY2tncm91bmQtY29sb3I6dHJhbnNwYXJlbnR9YDtcblxuY2xhc3MgQ3JvcHBlckhhbmRsZSBleHRlbmRzIENyb3BwZXJFbGVtZW50IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoLi4uYXJndW1lbnRzKTtcbiAgICAgICAgdGhpcy4kb25DYW52YXNDcm9wRW5kID0gbnVsbDtcbiAgICAgICAgdGhpcy4kb25DYW52YXNDcm9wU3RhcnQgPSBudWxsO1xuICAgICAgICB0aGlzLiRzdHlsZSA9IHN0eWxlO1xuICAgICAgICB0aGlzLmFjdGlvbiA9IEFDVElPTl9OT05FO1xuICAgICAgICB0aGlzLnBsYWluID0gZmFsc2U7XG4gICAgICAgIHRoaXMuc2xvdHRhYmxlID0gZmFsc2U7XG4gICAgICAgIHRoaXMudGhlbWVDb2xvciA9ICdyZ2JhKDUxLCAxNTMsIDI1NSwgMC41KSc7XG4gICAgfVxuICAgIHN0YXRpYyBnZXQgb2JzZXJ2ZWRBdHRyaWJ1dGVzKCkge1xuICAgICAgICByZXR1cm4gc3VwZXIub2JzZXJ2ZWRBdHRyaWJ1dGVzLmNvbmNhdChbXG4gICAgICAgICAgICAnYWN0aW9uJyxcbiAgICAgICAgICAgICdwbGFpbicsXG4gICAgICAgIF0pO1xuICAgIH1cbn1cbkNyb3BwZXJIYW5kbGUuJG5hbWUgPSBDUk9QUEVSX0hBTkRMRTtcbkNyb3BwZXJIYW5kbGUuJHZlcnNpb24gPSAnMi4wLjAnO1xuXG5leHBvcnQgeyBDcm9wcGVySGFuZGxlIGFzIGRlZmF1bHQgfTtcbiIsICJpbXBvcnQgQ3JvcHBlckVsZW1lbnQgZnJvbSAnQGNyb3BwZXIvZWxlbWVudCc7XG5pbXBvcnQgeyBDUk9QUEVSX1NFTEVDVElPTiwgRVZFTlRfQ0hBTkdFLCBvbiwgRVZFTlRfS0VZRE9XTiwgb2ZmLCBpc1Bvc2l0aXZlTnVtYmVyLCBDUk9QUEVSX0NBTlZBUywgRVZFTlRfQUNUSU9OX1NUQVJULCBFVkVOVF9BQ1RJT05fRU5ELCBFVkVOVF9BQ1RJT04sIGdldEFkanVzdGVkU2l6ZXMsIEFDVElPTl9TRUxFQ1QsIEFDVElPTl9TQ0FMRSwgZ2V0T2Zmc2V0LCBBQ1RJT05fTU9WRSwgQUNUSU9OX1JFU0laRV9OT1JUSFdFU1QsIEFDVElPTl9SRVNJWkVfU09VVEhXRVNULCBBQ1RJT05fUkVTSVpFX05PUlRIRUFTVCwgQUNUSU9OX1JFU0laRV9TT1VUSEVBU1QsIGlzTnVtYmVyLCBpc1BsYWluT2JqZWN0LCBDUk9QUEVSX0lNQUdFLCBpc0Z1bmN0aW9uLCBBQ1RJT05fUkVTSVpFX1dFU1QsIEFDVElPTl9SRVNJWkVfRUFTVCwgQUNUSU9OX1JFU0laRV9TT1VUSCwgQUNUSU9OX1JFU0laRV9OT1JUSCB9IGZyb20gJ0Bjcm9wcGVyL3V0aWxzJztcblxudmFyIHN0eWxlID0gYDpob3N0e2Rpc3BsYXk6YmxvY2s7bGVmdDowO3Bvc2l0aW9uOnJlbGF0aXZlO3JpZ2h0OjB9Omhvc3QoW291dGxpbmVkXSl7b3V0bGluZToxcHggc29saWQgdmFyKC0tdGhlbWUtY29sb3IpfTpob3N0KFttdWx0aXBsZV0pe291dGxpbmU6MXB4IGRhc2hlZCBoc2xhKDAsMCUsMTAwJSwuNSl9Omhvc3QoW211bHRpcGxlXSk6YWZ0ZXJ7Ym90dG9tOjA7Y29udGVudDpcIlwiO2N1cnNvcjpwb2ludGVyO2Rpc3BsYXk6YmxvY2s7bGVmdDowO3Bvc2l0aW9uOmFic29sdXRlO3JpZ2h0OjA7dG9wOjB9Omhvc3QoW211bHRpcGxlXVthY3RpdmVdKXtvdXRsaW5lLWNvbG9yOnZhcigtLXRoZW1lLWNvbG9yKTt6LWluZGV4OjF9Omhvc3QoW211bHRpcGxlXSk+Knt2aXNpYmlsaXR5OmhpZGRlbn06aG9zdChbbXVsdGlwbGVdW2FjdGl2ZV0pPip7dmlzaWJpbGl0eTp2aXNpYmxlfTpob3N0KFttdWx0aXBsZV1bYWN0aXZlXSk6YWZ0ZXJ7ZGlzcGxheTpub25lfWA7XG5cbmNvbnN0IGNhbnZhc0NhY2hlID0gbmV3IFdlYWtNYXAoKTtcbmNsYXNzIENyb3BwZXJTZWxlY3Rpb24gZXh0ZW5kcyBDcm9wcGVyRWxlbWVudCB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKC4uLmFyZ3VtZW50cyk7XG4gICAgICAgIHRoaXMuJG9uQ2FudmFzQWN0aW9uID0gbnVsbDtcbiAgICAgICAgdGhpcy4kb25DYW52YXNBY3Rpb25TdGFydCA9IG51bGw7XG4gICAgICAgIHRoaXMuJG9uQ2FudmFzQWN0aW9uRW5kID0gbnVsbDtcbiAgICAgICAgdGhpcy4kb25Eb2N1bWVudEtleURvd24gPSBudWxsO1xuICAgICAgICB0aGlzLiRhY3Rpb24gPSAnJztcbiAgICAgICAgdGhpcy4kYWN0aW9uU3RhcnRUYXJnZXQgPSBudWxsO1xuICAgICAgICB0aGlzLiRjaGFuZ2luZyA9IGZhbHNlO1xuICAgICAgICB0aGlzLiRzdHlsZSA9IHN0eWxlO1xuICAgICAgICB0aGlzLiRpbml0aWFsU2VsZWN0aW9uID0ge1xuICAgICAgICAgICAgeDogMCxcbiAgICAgICAgICAgIHk6IDAsXG4gICAgICAgICAgICB3aWR0aDogMCxcbiAgICAgICAgICAgIGhlaWdodDogMCxcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy54ID0gMDtcbiAgICAgICAgdGhpcy55ID0gMDtcbiAgICAgICAgdGhpcy53aWR0aCA9IDA7XG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gMDtcbiAgICAgICAgdGhpcy5hc3BlY3RSYXRpbyA9IE5hTjtcbiAgICAgICAgdGhpcy5pbml0aWFsQXNwZWN0UmF0aW8gPSBOYU47XG4gICAgICAgIHRoaXMuaW5pdGlhbENvdmVyYWdlID0gTmFOO1xuICAgICAgICB0aGlzLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICAvLyBEZXByZWNhdGVkIGFzIG9mIHYyLjAuMC1yYy4wLCB1c2UgYGR5bmFtaWNgIGluc3RlYWQuXG4gICAgICAgIHRoaXMubGlua2VkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuZHluYW1pYyA9IGZhbHNlO1xuICAgICAgICB0aGlzLm1vdmFibGUgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5yZXNpemFibGUgPSBmYWxzZTtcbiAgICAgICAgdGhpcy56b29tYWJsZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLm11bHRpcGxlID0gZmFsc2U7XG4gICAgICAgIHRoaXMua2V5Ym9hcmQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5vdXRsaW5lZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnByZWNpc2UgPSBmYWxzZTtcbiAgICB9XG4gICAgc2V0ICRjYW52YXMoZWxlbWVudCkge1xuICAgICAgICBjYW52YXNDYWNoZS5zZXQodGhpcywgZWxlbWVudCk7XG4gICAgfVxuICAgIGdldCAkY2FudmFzKCkge1xuICAgICAgICByZXR1cm4gY2FudmFzQ2FjaGUuZ2V0KHRoaXMpO1xuICAgIH1cbiAgICBzdGF0aWMgZ2V0IG9ic2VydmVkQXR0cmlidXRlcygpIHtcbiAgICAgICAgcmV0dXJuIHN1cGVyLm9ic2VydmVkQXR0cmlidXRlcy5jb25jYXQoW1xuICAgICAgICAgICAgJ2FjdGl2ZScsXG4gICAgICAgICAgICAnYXNwZWN0LXJhdGlvJyxcbiAgICAgICAgICAgICdkeW5hbWljJyxcbiAgICAgICAgICAgICdoZWlnaHQnLFxuICAgICAgICAgICAgJ2luaXRpYWwtYXNwZWN0LXJhdGlvJyxcbiAgICAgICAgICAgICdpbml0aWFsLWNvdmVyYWdlJyxcbiAgICAgICAgICAgICdrZXlib2FyZCcsXG4gICAgICAgICAgICAnbGlua2VkJyxcbiAgICAgICAgICAgICdtb3ZhYmxlJyxcbiAgICAgICAgICAgICdtdWx0aXBsZScsXG4gICAgICAgICAgICAnb3V0bGluZWQnLFxuICAgICAgICAgICAgJ3ByZWNpc2UnLFxuICAgICAgICAgICAgJ3Jlc2l6YWJsZScsXG4gICAgICAgICAgICAnd2lkdGgnLFxuICAgICAgICAgICAgJ3gnLFxuICAgICAgICAgICAgJ3knLFxuICAgICAgICAgICAgJ3pvb21hYmxlJyxcbiAgICAgICAgXSk7XG4gICAgfVxuICAgICRwcm9wZXJ0eUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpIHtcbiAgICAgICAgaWYgKE9iamVjdC5pcyhuZXdWYWx1ZSwgb2xkVmFsdWUpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgc3VwZXIuJHByb3BlcnR5Q2hhbmdlZENhbGxiYWNrKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSk7XG4gICAgICAgIHN3aXRjaCAobmFtZSkge1xuICAgICAgICAgICAgY2FzZSAneCc6XG4gICAgICAgICAgICBjYXNlICd5JzpcbiAgICAgICAgICAgIGNhc2UgJ3dpZHRoJzpcbiAgICAgICAgICAgIGNhc2UgJ2hlaWdodCc6XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLiRjaGFuZ2luZykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLiRuZXh0VGljaygoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLiRjaGFuZ2UodGhpcy54LCB0aGlzLnksIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0LCB0aGlzLmFzcGVjdFJhdGlvLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnYXNwZWN0UmF0aW8nOlxuICAgICAgICAgICAgY2FzZSAnaW5pdGlhbEFzcGVjdFJhdGlvJzpcbiAgICAgICAgICAgICAgICB0aGlzLiRuZXh0VGljaygoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuJGluaXRTZWxlY3Rpb24oKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2luaXRpYWxDb3ZlcmFnZSc6XG4gICAgICAgICAgICAgICAgdGhpcy4kbmV4dFRpY2soKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXNQb3NpdGl2ZU51bWJlcihuZXdWYWx1ZSkgJiYgbmV3VmFsdWUgPD0gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy4kaW5pdFNlbGVjdGlvbih0cnVlLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAna2V5Ym9hcmQnOlxuICAgICAgICAgICAgICAgIHRoaXMuJG5leHRUaWNrKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuJGNhbnZhcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5ld1ZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLiRvbkRvY3VtZW50S2V5RG93bikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLiRvbkRvY3VtZW50S2V5RG93biA9IHRoaXMuJGhhbmRsZUtleURvd24uYmluZCh0aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb24odGhpcy5vd25lckRvY3VtZW50LCBFVkVOVF9LRVlET1dOLCB0aGlzLiRvbkRvY3VtZW50S2V5RG93bik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAodGhpcy4kb25Eb2N1bWVudEtleURvd24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvZmYodGhpcy5vd25lckRvY3VtZW50LCBFVkVOVF9LRVlET1dOLCB0aGlzLiRvbkRvY3VtZW50S2V5RG93bik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy4kb25Eb2N1bWVudEtleURvd24gPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdtdWx0aXBsZSc6XG4gICAgICAgICAgICAgICAgdGhpcy4kbmV4dFRpY2soKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy4kY2FudmFzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzZWxlY3Rpb25zID0gdGhpcy4kZ2V0U2VsZWN0aW9ucygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5ld1ZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZWN0aW9ucy5mb3JFYWNoKChzZWxlY3Rpb24pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZWN0aW9uLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWN0aXZlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLiRlbWl0KEVWRU5UX0NIQU5HRSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4OiB0aGlzLngsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHk6IHRoaXMueSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IHRoaXMud2lkdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogdGhpcy5oZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGVjdGlvbnMuc2xpY2UoMSkuZm9yRWFjaCgoc2VsZWN0aW9uKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuJHJlbW92ZVNlbGVjdGlvbihzZWxlY3Rpb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdwcmVjaXNlJzpcbiAgICAgICAgICAgICAgICB0aGlzLiRuZXh0VGljaygoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuJGNoYW5nZSh0aGlzLngsIHRoaXMueSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAvLyBCYWNrd2FyZHMgY29tcGF0aWJsZSB3aXRoIDIuMC4wLXJjXG4gICAgICAgICAgICBjYXNlICdsaW5rZWQnOlxuICAgICAgICAgICAgICAgIGlmIChuZXdWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmR5bmFtaWMgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cbiAgICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgc3VwZXIuY29ubmVjdGVkQ2FsbGJhY2soKTtcbiAgICAgICAgY29uc3QgJGNhbnZhcyA9IHRoaXMuY2xvc2VzdCh0aGlzLiRnZXRUYWdOYW1lT2YoQ1JPUFBFUl9DQU5WQVMpKTtcbiAgICAgICAgaWYgKCRjYW52YXMpIHtcbiAgICAgICAgICAgIHRoaXMuJGNhbnZhcyA9ICRjYW52YXM7XG4gICAgICAgICAgICB0aGlzLiRzZXRTdHlsZXMoe1xuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgICAgICAgICAgICAgIHRyYW5zZm9ybTogYHRyYW5zbGF0ZSgke3RoaXMueH1weCwgJHt0aGlzLnl9cHgpYCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKCF0aGlzLmhpZGRlbikge1xuICAgICAgICAgICAgICAgIHRoaXMuJHJlbmRlcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy4kaW5pdFNlbGVjdGlvbih0cnVlKTtcbiAgICAgICAgICAgIHRoaXMuJG9uQ2FudmFzQWN0aW9uU3RhcnQgPSB0aGlzLiRoYW5kbGVBY3Rpb25TdGFydC5iaW5kKHRoaXMpO1xuICAgICAgICAgICAgdGhpcy4kb25DYW52YXNBY3Rpb25FbmQgPSB0aGlzLiRoYW5kbGVBY3Rpb25FbmQuYmluZCh0aGlzKTtcbiAgICAgICAgICAgIHRoaXMuJG9uQ2FudmFzQWN0aW9uID0gdGhpcy4kaGFuZGxlQWN0aW9uLmJpbmQodGhpcyk7XG4gICAgICAgICAgICBvbigkY2FudmFzLCBFVkVOVF9BQ1RJT05fU1RBUlQsIHRoaXMuJG9uQ2FudmFzQWN0aW9uU3RhcnQpO1xuICAgICAgICAgICAgb24oJGNhbnZhcywgRVZFTlRfQUNUSU9OX0VORCwgdGhpcy4kb25DYW52YXNBY3Rpb25FbmQpO1xuICAgICAgICAgICAgb24oJGNhbnZhcywgRVZFTlRfQUNUSU9OLCB0aGlzLiRvbkNhbnZhc0FjdGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLiRyZW5kZXIoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBkaXNjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgY29uc3QgeyAkY2FudmFzIH0gPSB0aGlzO1xuICAgICAgICBpZiAoJGNhbnZhcykge1xuICAgICAgICAgICAgaWYgKHRoaXMuJG9uQ2FudmFzQWN0aW9uU3RhcnQpIHtcbiAgICAgICAgICAgICAgICBvZmYoJGNhbnZhcywgRVZFTlRfQUNUSU9OX1NUQVJULCB0aGlzLiRvbkNhbnZhc0FjdGlvblN0YXJ0KTtcbiAgICAgICAgICAgICAgICB0aGlzLiRvbkNhbnZhc0FjdGlvblN0YXJ0ID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLiRvbkNhbnZhc0FjdGlvbkVuZCkge1xuICAgICAgICAgICAgICAgIG9mZigkY2FudmFzLCBFVkVOVF9BQ1RJT05fRU5ELCB0aGlzLiRvbkNhbnZhc0FjdGlvbkVuZCk7XG4gICAgICAgICAgICAgICAgdGhpcy4kb25DYW52YXNBY3Rpb25FbmQgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuJG9uQ2FudmFzQWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgb2ZmKCRjYW52YXMsIEVWRU5UX0FDVElPTiwgdGhpcy4kb25DYW52YXNBY3Rpb24pO1xuICAgICAgICAgICAgICAgIHRoaXMuJG9uQ2FudmFzQWN0aW9uID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBzdXBlci5kaXNjb25uZWN0ZWRDYWxsYmFjaygpO1xuICAgIH1cbiAgICAkZ2V0U2VsZWN0aW9ucygpIHtcbiAgICAgICAgbGV0IHNlbGVjdGlvbnMgPSBbXTtcbiAgICAgICAgaWYgKHRoaXMucGFyZW50RWxlbWVudCkge1xuICAgICAgICAgICAgc2VsZWN0aW9ucyA9IEFycmF5LmZyb20odGhpcy5wYXJlbnRFbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwodGhpcy4kZ2V0VGFnTmFtZU9mKENST1BQRVJfU0VMRUNUSU9OKSkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzZWxlY3Rpb25zO1xuICAgIH1cbiAgICAkaW5pdFNlbGVjdGlvbihjZW50ZXIgPSBmYWxzZSwgcmVzaXplID0gZmFsc2UpIHtcbiAgICAgICAgY29uc3QgeyBpbml0aWFsQ292ZXJhZ2UsIHBhcmVudEVsZW1lbnQgfSA9IHRoaXM7XG4gICAgICAgIGlmIChpc1Bvc2l0aXZlTnVtYmVyKGluaXRpYWxDb3ZlcmFnZSkgJiYgcGFyZW50RWxlbWVudCkge1xuICAgICAgICAgICAgY29uc3QgYXNwZWN0UmF0aW8gPSB0aGlzLmFzcGVjdFJhdGlvIHx8IHRoaXMuaW5pdGlhbEFzcGVjdFJhdGlvO1xuICAgICAgICAgICAgbGV0IHdpZHRoID0gKHJlc2l6ZSA/IDAgOiB0aGlzLndpZHRoKSB8fCBwYXJlbnRFbGVtZW50Lm9mZnNldFdpZHRoICogaW5pdGlhbENvdmVyYWdlO1xuICAgICAgICAgICAgbGV0IGhlaWdodCA9IChyZXNpemUgPyAwIDogdGhpcy5oZWlnaHQpIHx8IHBhcmVudEVsZW1lbnQub2Zmc2V0SGVpZ2h0ICogaW5pdGlhbENvdmVyYWdlO1xuICAgICAgICAgICAgaWYgKGlzUG9zaXRpdmVOdW1iZXIoYXNwZWN0UmF0aW8pKSB7XG4gICAgICAgICAgICAgICAgKHsgd2lkdGgsIGhlaWdodCB9ID0gZ2V0QWRqdXN0ZWRTaXplcyh7IGFzcGVjdFJhdGlvLCB3aWR0aCwgaGVpZ2h0IH0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuJGNoYW5nZSh0aGlzLngsIHRoaXMueSwgd2lkdGgsIGhlaWdodCk7XG4gICAgICAgICAgICBpZiAoY2VudGVyKSB7XG4gICAgICAgICAgICAgICAgdGhpcy4kY2VudGVyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBPdmVycmlkZXMgdGhlIGluaXRpYWwgcG9zaXRpb24gYW5kIHNpemVcbiAgICAgICAgICAgIHRoaXMuJGluaXRpYWxTZWxlY3Rpb24gPSB7XG4gICAgICAgICAgICAgICAgeDogdGhpcy54LFxuICAgICAgICAgICAgICAgIHk6IHRoaXMueSxcbiAgICAgICAgICAgICAgICB3aWR0aDogdGhpcy53aWR0aCxcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IHRoaXMuaGVpZ2h0LFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAkY3JlYXRlU2VsZWN0aW9uKCkge1xuICAgICAgICBjb25zdCBuZXdTZWxlY3Rpb24gPSB0aGlzLmNsb25lTm9kZSh0cnVlKTtcbiAgICAgICAgaWYgKHRoaXMuaGFzQXR0cmlidXRlKCdpZCcpKSB7XG4gICAgICAgICAgICBuZXdTZWxlY3Rpb24ucmVtb3ZlQXR0cmlidXRlKCdpZCcpO1xuICAgICAgICB9XG4gICAgICAgIG5ld1NlbGVjdGlvbi5pbml0aWFsQ292ZXJhZ2UgPSBOYU47XG4gICAgICAgIHRoaXMuYWN0aXZlID0gZmFsc2U7XG4gICAgICAgIGlmICh0aGlzLnBhcmVudEVsZW1lbnQpIHtcbiAgICAgICAgICAgIHRoaXMucGFyZW50RWxlbWVudC5pbnNlcnRCZWZvcmUobmV3U2VsZWN0aW9uLCB0aGlzLm5leHRTaWJsaW5nKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3U2VsZWN0aW9uO1xuICAgIH1cbiAgICAkcmVtb3ZlU2VsZWN0aW9uKHNlbGVjdGlvbiA9IHRoaXMpIHtcbiAgICAgICAgaWYgKHRoaXMucGFyZW50RWxlbWVudCkge1xuICAgICAgICAgICAgY29uc3Qgc2VsZWN0aW9ucyA9IHRoaXMuJGdldFNlbGVjdGlvbnMoKTtcbiAgICAgICAgICAgIGlmIChzZWxlY3Rpb25zLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpbmRleCA9IHNlbGVjdGlvbnMuaW5kZXhPZihzZWxlY3Rpb24pO1xuICAgICAgICAgICAgICAgIGNvbnN0IGFjdGl2ZVNlbGVjdGlvbiA9IHNlbGVjdGlvbnNbaW5kZXggKyAxXSB8fCBzZWxlY3Rpb25zW2luZGV4IC0gMV07XG4gICAgICAgICAgICAgICAgaWYgKGFjdGl2ZVNlbGVjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICBzZWxlY3Rpb24uYWN0aXZlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGFyZW50RWxlbWVudC5yZW1vdmVDaGlsZChzZWxlY3Rpb24pO1xuICAgICAgICAgICAgICAgICAgICBhY3RpdmVTZWxlY3Rpb24uYWN0aXZlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgYWN0aXZlU2VsZWN0aW9uLiRlbWl0KEVWRU5UX0NIQU5HRSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgeDogYWN0aXZlU2VsZWN0aW9uLngsXG4gICAgICAgICAgICAgICAgICAgICAgICB5OiBhY3RpdmVTZWxlY3Rpb24ueSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiBhY3RpdmVTZWxlY3Rpb24ud2lkdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IGFjdGl2ZVNlbGVjdGlvbi5oZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuJGNsZWFyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgJGhhbmRsZUFjdGlvblN0YXJ0KGV2ZW50KSB7XG4gICAgICAgIHZhciBfYSwgX2I7XG4gICAgICAgIGNvbnN0IHJlbGF0ZWRUYXJnZXQgPSAoX2IgPSAoX2EgPSBldmVudC5kZXRhaWwpID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS5yZWxhdGVkRXZlbnQpID09PSBudWxsIHx8IF9iID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYi50YXJnZXQ7XG4gICAgICAgIHRoaXMuJGFjdGlvbiA9ICcnO1xuICAgICAgICB0aGlzLiRhY3Rpb25TdGFydFRhcmdldCA9IHJlbGF0ZWRUYXJnZXQ7XG4gICAgICAgIGlmICghdGhpcy5oaWRkZW5cbiAgICAgICAgICAgICYmIHRoaXMubXVsdGlwbGVcbiAgICAgICAgICAgICYmICF0aGlzLmFjdGl2ZVxuICAgICAgICAgICAgJiYgcmVsYXRlZFRhcmdldCA9PT0gdGhpc1xuICAgICAgICAgICAgJiYgdGhpcy5wYXJlbnRFbGVtZW50KSB7XG4gICAgICAgICAgICB0aGlzLiRnZXRTZWxlY3Rpb25zKCkuZm9yRWFjaCgoc2VsZWN0aW9uKSA9PiB7XG4gICAgICAgICAgICAgICAgc2VsZWN0aW9uLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLmFjdGl2ZSA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLiRlbWl0KEVWRU5UX0NIQU5HRSwge1xuICAgICAgICAgICAgICAgIHg6IHRoaXMueCxcbiAgICAgICAgICAgICAgICB5OiB0aGlzLnksXG4gICAgICAgICAgICAgICAgd2lkdGg6IHRoaXMud2lkdGgsXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiB0aGlzLmhlaWdodCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgICRoYW5kbGVBY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgY29uc3QgeyBjdXJyZW50VGFyZ2V0LCBkZXRhaWwgfSA9IGV2ZW50O1xuICAgICAgICBpZiAoIWN1cnJlbnRUYXJnZXQgfHwgIWRldGFpbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHsgcmVsYXRlZEV2ZW50IH0gPSBkZXRhaWw7XG4gICAgICAgIGxldCB7IGFjdGlvbiB9ID0gZGV0YWlsO1xuICAgICAgICAvLyBTd2l0Y2hpbmcgdG8gYW5vdGhlciBzZWxlY3Rpb25cbiAgICAgICAgaWYgKCFhY3Rpb24gJiYgdGhpcy5tdWx0aXBsZSkge1xuICAgICAgICAgICAgLy8gR2V0IHRoZSBgYWN0aW9uYCBwcm9wZXJ0eSBmcm9tIHRoZSBmb2N1c2luZyBpbiBzZWxlY3Rpb25cbiAgICAgICAgICAgIGFjdGlvbiA9IHRoaXMuJGFjdGlvbiB8fCAocmVsYXRlZEV2ZW50ID09PSBudWxsIHx8IHJlbGF0ZWRFdmVudCA9PT0gdm9pZCAwID8gdm9pZCAwIDogcmVsYXRlZEV2ZW50LnRhcmdldC5hY3Rpb24pO1xuICAgICAgICAgICAgdGhpcy4kYWN0aW9uID0gYWN0aW9uO1xuICAgICAgICB9XG4gICAgICAgIGlmICghYWN0aW9uXG4gICAgICAgICAgICB8fCAodGhpcy5oaWRkZW4gJiYgYWN0aW9uICE9PSBBQ1RJT05fU0VMRUNUKVxuICAgICAgICAgICAgfHwgKHRoaXMubXVsdGlwbGUgJiYgIXRoaXMuYWN0aXZlICYmIGFjdGlvbiAhPT0gQUNUSU9OX1NDQUxFKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG1vdmVYID0gZGV0YWlsLmVuZFggLSBkZXRhaWwuc3RhcnRYO1xuICAgICAgICBjb25zdCBtb3ZlWSA9IGRldGFpbC5lbmRZIC0gZGV0YWlsLnN0YXJ0WTtcbiAgICAgICAgY29uc3QgeyB3aWR0aCwgaGVpZ2h0IH0gPSB0aGlzO1xuICAgICAgICBsZXQgeyBhc3BlY3RSYXRpbyB9ID0gdGhpcztcbiAgICAgICAgLy8gTG9ja2luZyBhc3BlY3QgcmF0aW8gYnkgaG9sZGluZyBzaGlmdCBrZXlcbiAgICAgICAgaWYgKCFpc1Bvc2l0aXZlTnVtYmVyKGFzcGVjdFJhdGlvKSAmJiByZWxhdGVkRXZlbnQuc2hpZnRLZXkpIHtcbiAgICAgICAgICAgIGFzcGVjdFJhdGlvID0gaXNQb3NpdGl2ZU51bWJlcih3aWR0aCkgJiYgaXNQb3NpdGl2ZU51bWJlcihoZWlnaHQpID8gd2lkdGggLyBoZWlnaHQgOiAxO1xuICAgICAgICB9XG4gICAgICAgIHN3aXRjaCAoYWN0aW9uKSB7XG4gICAgICAgICAgICBjYXNlIEFDVElPTl9TRUxFQ1Q6XG4gICAgICAgICAgICAgICAgaWYgKG1vdmVYICE9PSAwICYmIG1vdmVZICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHsgJGNhbnZhcyB9ID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2Zmc2V0ID0gZ2V0T2Zmc2V0KGN1cnJlbnRUYXJnZXQpO1xuICAgICAgICAgICAgICAgICAgICAodGhpcy5tdWx0aXBsZSAmJiAhdGhpcy5oaWRkZW4gPyB0aGlzLiRjcmVhdGVTZWxlY3Rpb24oKSA6IHRoaXMpLiRjaGFuZ2UoZGV0YWlsLnN0YXJ0WCAtIG9mZnNldC5sZWZ0LCBkZXRhaWwuc3RhcnRZIC0gb2Zmc2V0LnRvcCwgTWF0aC5hYnMobW92ZVgpLCBNYXRoLmFicyhtb3ZlWSksIGFzcGVjdFJhdGlvKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1vdmVYIDwgMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1vdmVZIDwgMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFx1MjE5Nlx1RkUwRlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbiA9IEFDVElPTl9SRVNJWkVfTk9SVEhXRVNUO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAobW92ZVkgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gXHUyMTk5XHVGRTBGXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uID0gQUNUSU9OX1JFU0laRV9TT1VUSFdFU1Q7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAobW92ZVggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobW92ZVkgPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gXHUyMTk3XHVGRTBGXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uID0gQUNUSU9OX1JFU0laRV9OT1JUSEVBU1Q7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChtb3ZlWSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBcdTIxOThcdUZFMEZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb24gPSBBQ1RJT05fUkVTSVpFX1NPVVRIRUFTVDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoJGNhbnZhcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgJGNhbnZhcy4kYWN0aW9uID0gYWN0aW9uO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBBQ1RJT05fTU9WRTpcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5tb3ZhYmxlICYmICh0aGlzLmR5bmFtaWNcbiAgICAgICAgICAgICAgICAgICAgfHwgKHRoaXMuJGFjdGlvblN0YXJ0VGFyZ2V0ICYmIHRoaXMuY29udGFpbnModGhpcy4kYWN0aW9uU3RhcnRUYXJnZXQpKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy4kbW92ZShtb3ZlWCwgbW92ZVkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgQUNUSU9OX1NDQUxFOlxuICAgICAgICAgICAgICAgIGlmIChyZWxhdGVkRXZlbnQgJiYgdGhpcy56b29tYWJsZSAmJiAodGhpcy5keW5hbWljXG4gICAgICAgICAgICAgICAgICAgIHx8IHRoaXMuY29udGFpbnMocmVsYXRlZEV2ZW50LnRhcmdldCkpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG9mZnNldCA9IGdldE9mZnNldChjdXJyZW50VGFyZ2V0KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy4kem9vbShkZXRhaWwuc2NhbGUsIHJlbGF0ZWRFdmVudC5wYWdlWCAtIG9mZnNldC5sZWZ0LCByZWxhdGVkRXZlbnQucGFnZVkgLSBvZmZzZXQudG9wKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHRoaXMuJHJlc2l6ZShhY3Rpb24sIG1vdmVYLCBtb3ZlWSwgYXNwZWN0UmF0aW8pO1xuICAgICAgICB9XG4gICAgfVxuICAgICRoYW5kbGVBY3Rpb25FbmQoKSB7XG4gICAgICAgIHRoaXMuJGFjdGlvbiA9ICcnO1xuICAgICAgICB0aGlzLiRhY3Rpb25TdGFydFRhcmdldCA9IG51bGw7XG4gICAgfVxuICAgICRoYW5kbGVLZXlEb3duKGV2ZW50KSB7XG4gICAgICAgIGlmICh0aGlzLmhpZGRlblxuICAgICAgICAgICAgfHwgIXRoaXMua2V5Ym9hcmRcbiAgICAgICAgICAgIHx8ICh0aGlzLm11bHRpcGxlICYmICF0aGlzLmFjdGl2ZSlcbiAgICAgICAgICAgIHx8IGV2ZW50LmRlZmF1bHRQcmV2ZW50ZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB7IGFjdGl2ZUVsZW1lbnQgfSA9IGRvY3VtZW50O1xuICAgICAgICAvLyBEaXNhYmxlIGtleWJvYXJkIGNvbnRyb2wgd2hlbiBpbnB1dCBzb21ldGhpbmdcbiAgICAgICAgaWYgKGFjdGl2ZUVsZW1lbnQgJiYgKFsnSU5QVVQnLCAnVEVYVEFSRUEnXS5pbmNsdWRlcyhhY3RpdmVFbGVtZW50LnRhZ05hbWUpXG4gICAgICAgICAgICB8fCBbJ3RydWUnLCAncGxhaW50ZXh0LW9ubHknXS5pbmNsdWRlcyhhY3RpdmVFbGVtZW50LmNvbnRlbnRFZGl0YWJsZSkpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgc3dpdGNoIChldmVudC5rZXkpIHtcbiAgICAgICAgICAgIGNhc2UgJ0JhY2tzcGFjZSc6XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50Lm1ldGFLZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy4kcmVtb3ZlU2VsZWN0aW9uKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnRGVsZXRlJzpcbiAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuJHJlbW92ZVNlbGVjdGlvbigpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgLy8gTW92ZSB0byB0aGUgbGVmdFxuICAgICAgICAgICAgY2FzZSAnQXJyb3dMZWZ0JzpcbiAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuJG1vdmUoLTEsIDApO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgLy8gTW92ZSB0byB0aGUgcmlnaHRcbiAgICAgICAgICAgIGNhc2UgJ0Fycm93UmlnaHQnOlxuICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy4kbW92ZSgxLCAwKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIC8vIE1vdmUgdG8gdGhlIHRvcFxuICAgICAgICAgICAgY2FzZSAnQXJyb3dVcCc6XG4gICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICB0aGlzLiRtb3ZlKDAsIC0xKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIC8vIE1vdmUgdG8gdGhlIGJvdHRvbVxuICAgICAgICAgICAgY2FzZSAnQXJyb3dEb3duJzpcbiAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuJG1vdmUoMCwgMSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICcrJzpcbiAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuJHpvb20oMC4xKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJy0nOlxuICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy4kem9vbSgtMC4xKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBBbGlnbnMgdGhlIHNlbGVjdGlvbiB0byB0aGUgY2VudGVyIG9mIGl0cyBwYXJlbnQgZWxlbWVudC5cbiAgICAgKiBAcmV0dXJucyB7Q3JvcHBlclNlbGVjdGlvbn0gUmV0dXJucyBgdGhpc2AgZm9yIGNoYWluaW5nLlxuICAgICAqL1xuICAgICRjZW50ZXIoKSB7XG4gICAgICAgIGNvbnN0IHsgcGFyZW50RWxlbWVudCB9ID0gdGhpcztcbiAgICAgICAgaWYgKCFwYXJlbnRFbGVtZW50KSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB4ID0gKHBhcmVudEVsZW1lbnQub2Zmc2V0V2lkdGggLSB0aGlzLndpZHRoKSAvIDI7XG4gICAgICAgIGNvbnN0IHkgPSAocGFyZW50RWxlbWVudC5vZmZzZXRIZWlnaHQgLSB0aGlzLmhlaWdodCkgLyAyO1xuICAgICAgICByZXR1cm4gdGhpcy4kY2hhbmdlKHgsIHkpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBNb3ZlcyB0aGUgc2VsZWN0aW9uLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB4IFRoZSBtb3ZpbmcgZGlzdGFuY2UgaW4gdGhlIGhvcml6b250YWwgZGlyZWN0aW9uLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbeV0gVGhlIG1vdmluZyBkaXN0YW5jZSBpbiB0aGUgdmVydGljYWwgZGlyZWN0aW9uLlxuICAgICAqIEByZXR1cm5zIHtDcm9wcGVyU2VsZWN0aW9ufSBSZXR1cm5zIGB0aGlzYCBmb3IgY2hhaW5pbmcuXG4gICAgICovXG4gICAgJG1vdmUoeCwgeSA9IHgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuJG1vdmVUbyh0aGlzLnggKyB4LCB0aGlzLnkgKyB5KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogTW92ZXMgdGhlIHNlbGVjdGlvbiB0byBhIHNwZWNpZmljIHBvc2l0aW9uLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB4IFRoZSBuZXcgcG9zaXRpb24gaW4gdGhlIGhvcml6b250YWwgZGlyZWN0aW9uLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbeV0gVGhlIG5ldyBwb3NpdGlvbiBpbiB0aGUgdmVydGljYWwgZGlyZWN0aW9uLlxuICAgICAqIEByZXR1cm5zIHtDcm9wcGVyU2VsZWN0aW9ufSBSZXR1cm5zIGB0aGlzYCBmb3IgY2hhaW5pbmcuXG4gICAgICovXG4gICAgJG1vdmVUbyh4LCB5ID0geCkge1xuICAgICAgICBpZiAoIXRoaXMubW92YWJsZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuJGNoYW5nZSh4LCB5KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQWRqdXN0cyB0aGUgc2l6ZSB0aGUgc2VsZWN0aW9uIG9uIGEgc3BlY2lmaWMgc2lkZSBvciBjb3JuZXIuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGFjdGlvbiBJbmRpY2F0ZXMgdGhlIHNpZGUgb3IgY29ybmVyIHRvIHJlc2l6ZS5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW29mZnNldFhdIFRoZSBob3Jpem9udGFsIG9mZnNldCBvZiB0aGUgc3BlY2lmaWMgc2lkZSBvciBjb3JuZXIuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtvZmZzZXRZXSBUaGUgdmVydGljYWwgb2Zmc2V0IG9mIHRoZSBzcGVjaWZpYyBzaWRlIG9yIGNvcm5lci5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW2FzcGVjdFJhdGlvXSBUaGUgYXNwZWN0IHJhdGlvIGZvciBjb21wdXRpbmcgdGhlIG5ldyBzaXplIGlmIGl0IGlzIG5lY2Vzc2FyeS5cbiAgICAgKiBAcmV0dXJucyB7Q3JvcHBlclNlbGVjdGlvbn0gUmV0dXJucyBgdGhpc2AgZm9yIGNoYWluaW5nLlxuICAgICAqL1xuICAgICRyZXNpemUoYWN0aW9uLCBvZmZzZXRYID0gMCwgb2Zmc2V0WSA9IDAsIGFzcGVjdFJhdGlvID0gdGhpcy5hc3BlY3RSYXRpbykge1xuICAgICAgICBpZiAoIXRoaXMucmVzaXphYmxlKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBoYXNWYWxpZEFzcGVjdFJhdGlvID0gaXNQb3NpdGl2ZU51bWJlcihhc3BlY3RSYXRpbyk7XG4gICAgICAgIGNvbnN0IHsgJGNhbnZhcyB9ID0gdGhpcztcbiAgICAgICAgbGV0IHsgeCwgeSwgd2lkdGgsIGhlaWdodCwgfSA9IHRoaXM7XG4gICAgICAgIHN3aXRjaCAoYWN0aW9uKSB7XG4gICAgICAgICAgICBjYXNlIEFDVElPTl9SRVNJWkVfTk9SVEg6XG4gICAgICAgICAgICAgICAgeSArPSBvZmZzZXRZO1xuICAgICAgICAgICAgICAgIGhlaWdodCAtPSBvZmZzZXRZO1xuICAgICAgICAgICAgICAgIGlmIChoZWlnaHQgPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbiA9IEFDVElPTl9SRVNJWkVfU09VVEg7XG4gICAgICAgICAgICAgICAgICAgIGhlaWdodCA9IC1oZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgIHkgLT0gaGVpZ2h0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoaGFzVmFsaWRBc3BlY3RSYXRpbykge1xuICAgICAgICAgICAgICAgICAgICBvZmZzZXRYID0gb2Zmc2V0WSAqIGFzcGVjdFJhdGlvO1xuICAgICAgICAgICAgICAgICAgICB4ICs9IG9mZnNldFggLyAyO1xuICAgICAgICAgICAgICAgICAgICB3aWR0aCAtPSBvZmZzZXRYO1xuICAgICAgICAgICAgICAgICAgICBpZiAod2lkdGggPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3aWR0aCA9IC13aWR0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHggLT0gd2lkdGg7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIEFDVElPTl9SRVNJWkVfRUFTVDpcbiAgICAgICAgICAgICAgICB3aWR0aCArPSBvZmZzZXRYO1xuICAgICAgICAgICAgICAgIGlmICh3aWR0aCA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uID0gQUNUSU9OX1JFU0laRV9XRVNUO1xuICAgICAgICAgICAgICAgICAgICB3aWR0aCA9IC13aWR0aDtcbiAgICAgICAgICAgICAgICAgICAgeCAtPSB3aWR0aDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGhhc1ZhbGlkQXNwZWN0UmF0aW8pIHtcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0WSA9IG9mZnNldFggLyBhc3BlY3RSYXRpbztcbiAgICAgICAgICAgICAgICAgICAgeSAtPSBvZmZzZXRZIC8gMjtcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0ICs9IG9mZnNldFk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChoZWlnaHQgPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQgPSAtaGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICAgICAgeSAtPSBoZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIEFDVElPTl9SRVNJWkVfU09VVEg6XG4gICAgICAgICAgICAgICAgaGVpZ2h0ICs9IG9mZnNldFk7XG4gICAgICAgICAgICAgICAgaWYgKGhlaWdodCA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uID0gQUNUSU9OX1JFU0laRV9OT1JUSDtcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0ID0gLWhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgeSAtPSBoZWlnaHQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChoYXNWYWxpZEFzcGVjdFJhdGlvKSB7XG4gICAgICAgICAgICAgICAgICAgIG9mZnNldFggPSBvZmZzZXRZICogYXNwZWN0UmF0aW87XG4gICAgICAgICAgICAgICAgICAgIHggLT0gb2Zmc2V0WCAvIDI7XG4gICAgICAgICAgICAgICAgICAgIHdpZHRoICs9IG9mZnNldFg7XG4gICAgICAgICAgICAgICAgICAgIGlmICh3aWR0aCA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoID0gLXdpZHRoO1xuICAgICAgICAgICAgICAgICAgICAgICAgeCAtPSB3aWR0aDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgQUNUSU9OX1JFU0laRV9XRVNUOlxuICAgICAgICAgICAgICAgIHggKz0gb2Zmc2V0WDtcbiAgICAgICAgICAgICAgICB3aWR0aCAtPSBvZmZzZXRYO1xuICAgICAgICAgICAgICAgIGlmICh3aWR0aCA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uID0gQUNUSU9OX1JFU0laRV9FQVNUO1xuICAgICAgICAgICAgICAgICAgICB3aWR0aCA9IC13aWR0aDtcbiAgICAgICAgICAgICAgICAgICAgeCAtPSB3aWR0aDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGhhc1ZhbGlkQXNwZWN0UmF0aW8pIHtcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0WSA9IG9mZnNldFggLyBhc3BlY3RSYXRpbztcbiAgICAgICAgICAgICAgICAgICAgeSArPSBvZmZzZXRZIC8gMjtcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0IC09IG9mZnNldFk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChoZWlnaHQgPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQgPSAtaGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICAgICAgeSAtPSBoZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIEFDVElPTl9SRVNJWkVfTk9SVEhFQVNUOlxuICAgICAgICAgICAgICAgIGlmIChoYXNWYWxpZEFzcGVjdFJhdGlvKSB7XG4gICAgICAgICAgICAgICAgICAgIG9mZnNldFkgPSAtb2Zmc2V0WCAvIGFzcGVjdFJhdGlvO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB5ICs9IG9mZnNldFk7XG4gICAgICAgICAgICAgICAgaGVpZ2h0IC09IG9mZnNldFk7XG4gICAgICAgICAgICAgICAgd2lkdGggKz0gb2Zmc2V0WDtcbiAgICAgICAgICAgICAgICBpZiAod2lkdGggPCAwICYmIGhlaWdodCA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uID0gQUNUSU9OX1JFU0laRV9TT1VUSFdFU1Q7XG4gICAgICAgICAgICAgICAgICAgIHdpZHRoID0gLXdpZHRoO1xuICAgICAgICAgICAgICAgICAgICBoZWlnaHQgPSAtaGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICB4IC09IHdpZHRoO1xuICAgICAgICAgICAgICAgICAgICB5IC09IGhlaWdodDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAod2lkdGggPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbiA9IEFDVElPTl9SRVNJWkVfTk9SVEhXRVNUO1xuICAgICAgICAgICAgICAgICAgICB3aWR0aCA9IC13aWR0aDtcbiAgICAgICAgICAgICAgICAgICAgeCAtPSB3aWR0aDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoaGVpZ2h0IDwgMCkge1xuICAgICAgICAgICAgICAgICAgICBhY3Rpb24gPSBBQ1RJT05fUkVTSVpFX1NPVVRIRUFTVDtcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0ID0gLWhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgeSAtPSBoZWlnaHQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBBQ1RJT05fUkVTSVpFX05PUlRIV0VTVDpcbiAgICAgICAgICAgICAgICBpZiAoaGFzVmFsaWRBc3BlY3RSYXRpbykge1xuICAgICAgICAgICAgICAgICAgICBvZmZzZXRZID0gb2Zmc2V0WCAvIGFzcGVjdFJhdGlvO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB4ICs9IG9mZnNldFg7XG4gICAgICAgICAgICAgICAgeSArPSBvZmZzZXRZO1xuICAgICAgICAgICAgICAgIHdpZHRoIC09IG9mZnNldFg7XG4gICAgICAgICAgICAgICAgaGVpZ2h0IC09IG9mZnNldFk7XG4gICAgICAgICAgICAgICAgaWYgKHdpZHRoIDwgMCAmJiBoZWlnaHQgPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbiA9IEFDVElPTl9SRVNJWkVfU09VVEhFQVNUO1xuICAgICAgICAgICAgICAgICAgICB3aWR0aCA9IC13aWR0aDtcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0ID0gLWhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgeCAtPSB3aWR0aDtcbiAgICAgICAgICAgICAgICAgICAgeSAtPSBoZWlnaHQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHdpZHRoIDwgMCkge1xuICAgICAgICAgICAgICAgICAgICBhY3Rpb24gPSBBQ1RJT05fUkVTSVpFX05PUlRIRUFTVDtcbiAgICAgICAgICAgICAgICAgICAgd2lkdGggPSAtd2lkdGg7XG4gICAgICAgICAgICAgICAgICAgIHggLT0gd2lkdGg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGhlaWdodCA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uID0gQUNUSU9OX1JFU0laRV9TT1VUSFdFU1Q7XG4gICAgICAgICAgICAgICAgICAgIGhlaWdodCA9IC1oZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgIHkgLT0gaGVpZ2h0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgQUNUSU9OX1JFU0laRV9TT1VUSEVBU1Q6XG4gICAgICAgICAgICAgICAgaWYgKGhhc1ZhbGlkQXNwZWN0UmF0aW8pIHtcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0WSA9IG9mZnNldFggLyBhc3BlY3RSYXRpbztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgd2lkdGggKz0gb2Zmc2V0WDtcbiAgICAgICAgICAgICAgICBoZWlnaHQgKz0gb2Zmc2V0WTtcbiAgICAgICAgICAgICAgICBpZiAod2lkdGggPCAwICYmIGhlaWdodCA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uID0gQUNUSU9OX1JFU0laRV9OT1JUSFdFU1Q7XG4gICAgICAgICAgICAgICAgICAgIHdpZHRoID0gLXdpZHRoO1xuICAgICAgICAgICAgICAgICAgICBoZWlnaHQgPSAtaGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICB4IC09IHdpZHRoO1xuICAgICAgICAgICAgICAgICAgICB5IC09IGhlaWdodDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAod2lkdGggPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbiA9IEFDVElPTl9SRVNJWkVfU09VVEhXRVNUO1xuICAgICAgICAgICAgICAgICAgICB3aWR0aCA9IC13aWR0aDtcbiAgICAgICAgICAgICAgICAgICAgeCAtPSB3aWR0aDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoaGVpZ2h0IDwgMCkge1xuICAgICAgICAgICAgICAgICAgICBhY3Rpb24gPSBBQ1RJT05fUkVTSVpFX05PUlRIRUFTVDtcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0ID0gLWhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgeSAtPSBoZWlnaHQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBBQ1RJT05fUkVTSVpFX1NPVVRIV0VTVDpcbiAgICAgICAgICAgICAgICBpZiAoaGFzVmFsaWRBc3BlY3RSYXRpbykge1xuICAgICAgICAgICAgICAgICAgICBvZmZzZXRZID0gLW9mZnNldFggLyBhc3BlY3RSYXRpbztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgeCArPSBvZmZzZXRYO1xuICAgICAgICAgICAgICAgIHdpZHRoIC09IG9mZnNldFg7XG4gICAgICAgICAgICAgICAgaGVpZ2h0ICs9IG9mZnNldFk7XG4gICAgICAgICAgICAgICAgaWYgKHdpZHRoIDwgMCAmJiBoZWlnaHQgPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbiA9IEFDVElPTl9SRVNJWkVfTk9SVEhFQVNUO1xuICAgICAgICAgICAgICAgICAgICB3aWR0aCA9IC13aWR0aDtcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0ID0gLWhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgeCAtPSB3aWR0aDtcbiAgICAgICAgICAgICAgICAgICAgeSAtPSBoZWlnaHQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHdpZHRoIDwgMCkge1xuICAgICAgICAgICAgICAgICAgICBhY3Rpb24gPSBBQ1RJT05fUkVTSVpFX1NPVVRIRUFTVDtcbiAgICAgICAgICAgICAgICAgICAgd2lkdGggPSAtd2lkdGg7XG4gICAgICAgICAgICAgICAgICAgIHggLT0gd2lkdGg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGhlaWdodCA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uID0gQUNUSU9OX1JFU0laRV9OT1JUSFdFU1Q7XG4gICAgICAgICAgICAgICAgICAgIGhlaWdodCA9IC1oZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgIHkgLT0gaGVpZ2h0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJGNhbnZhcykge1xuICAgICAgICAgICAgJGNhbnZhcy4kc2V0QWN0aW9uKGFjdGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuJGNoYW5nZSh4LCB5LCB3aWR0aCwgaGVpZ2h0KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogWm9vbXMgdGhlIHNlbGVjdGlvbi5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gc2NhbGUgVGhlIHpvb20gZmFjdG9yLiBQb3NpdGl2ZSBudW1iZXJzIGZvciB6b29taW5nIGluLCBhbmQgbmVnYXRpdmUgbnVtYmVycyBmb3Igem9vbWluZyBvdXQuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFt4XSBUaGUgem9vbSBvcmlnaW4gaW4gdGhlIGhvcml6b250YWwsIGRlZmF1bHRzIHRvIHRoZSBjZW50ZXIgb2YgdGhlIHNlbGVjdGlvbi5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW3ldIFRoZSB6b29tIG9yaWdpbiBpbiB0aGUgdmVydGljYWwsIGRlZmF1bHRzIHRvIHRoZSBjZW50ZXIgb2YgdGhlIHNlbGVjdGlvbi5cbiAgICAgKiBAcmV0dXJucyB7Q3JvcHBlclNlbGVjdGlvbn0gUmV0dXJucyBgdGhpc2AgZm9yIGNoYWluaW5nLlxuICAgICAqL1xuICAgICR6b29tKHNjYWxlLCB4LCB5KSB7XG4gICAgICAgIGlmICghdGhpcy56b29tYWJsZSB8fCBzY2FsZSA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNjYWxlIDwgMCkge1xuICAgICAgICAgICAgc2NhbGUgPSAxIC8gKDEgLSBzY2FsZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBzY2FsZSArPSAxO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHsgd2lkdGgsIGhlaWdodCB9ID0gdGhpcztcbiAgICAgICAgY29uc3QgbmV3V2lkdGggPSB3aWR0aCAqIHNjYWxlO1xuICAgICAgICBjb25zdCBuZXdIZWlnaHQgPSBoZWlnaHQgKiBzY2FsZTtcbiAgICAgICAgbGV0IG5ld1ggPSB0aGlzLng7XG4gICAgICAgIGxldCBuZXdZID0gdGhpcy55O1xuICAgICAgICBpZiAoaXNOdW1iZXIoeCkgJiYgaXNOdW1iZXIoeSkpIHtcbiAgICAgICAgICAgIG5ld1ggLT0gKG5ld1dpZHRoIC0gd2lkdGgpICogKCh4IC0gdGhpcy54KSAvIHdpZHRoKTtcbiAgICAgICAgICAgIG5ld1kgLT0gKG5ld0hlaWdodCAtIGhlaWdodCkgKiAoKHkgLSB0aGlzLnkpIC8gaGVpZ2h0KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vIFpvb20gZnJvbSB0aGUgY2VudGVyIG9mIHRoZSBzZWxlY3Rpb25cbiAgICAgICAgICAgIG5ld1ggLT0gKG5ld1dpZHRoIC0gd2lkdGgpIC8gMjtcbiAgICAgICAgICAgIG5ld1kgLT0gKG5ld0hlaWdodCAtIGhlaWdodCkgLyAyO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLiRjaGFuZ2UobmV3WCwgbmV3WSwgbmV3V2lkdGgsIG5ld0hlaWdodCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENoYW5nZXMgdGhlIHBvc2l0aW9uIGFuZC9vciBzaXplIG9mIHRoZSBzZWxlY3Rpb24uXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHggVGhlIG5ldyBwb3NpdGlvbiBpbiB0aGUgaG9yaXpvbnRhbCBkaXJlY3Rpb24uXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHkgVGhlIG5ldyBwb3NpdGlvbiBpbiB0aGUgdmVydGljYWwgZGlyZWN0aW9uLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbd2lkdGhdIFRoZSBuZXcgd2lkdGguXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtoZWlnaHRdIFRoZSBuZXcgaGVpZ2h0LlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbYXNwZWN0UmF0aW9dIFRoZSBuZXcgYXNwZWN0IHJhdGlvIGZvciB0aGlzIGNoYW5nZSBvbmx5LlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbX2ZvcmNlXSBGb3JjZSBjaGFuZ2UuXG4gICAgICogQHJldHVybnMge0Nyb3BwZXJTZWxlY3Rpb259IFJldHVybnMgYHRoaXNgIGZvciBjaGFpbmluZy5cbiAgICAgKi9cbiAgICAkY2hhbmdlKHgsIHksIHdpZHRoID0gdGhpcy53aWR0aCwgaGVpZ2h0ID0gdGhpcy5oZWlnaHQsIGFzcGVjdFJhdGlvID0gdGhpcy5hc3BlY3RSYXRpbywgX2ZvcmNlID0gZmFsc2UpIHtcbiAgICAgICAgaWYgKHRoaXMuJGNoYW5naW5nXG4gICAgICAgICAgICB8fCAhaXNOdW1iZXIoeClcbiAgICAgICAgICAgIHx8ICFpc051bWJlcih5KVxuICAgICAgICAgICAgfHwgIWlzTnVtYmVyKHdpZHRoKVxuICAgICAgICAgICAgfHwgIWlzTnVtYmVyKGhlaWdodClcbiAgICAgICAgICAgIHx8IHdpZHRoIDwgMFxuICAgICAgICAgICAgfHwgaGVpZ2h0IDwgMCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzUG9zaXRpdmVOdW1iZXIoYXNwZWN0UmF0aW8pKSB7XG4gICAgICAgICAgICAoeyB3aWR0aCwgaGVpZ2h0IH0gPSBnZXRBZGp1c3RlZFNpemVzKHsgYXNwZWN0UmF0aW8sIHdpZHRoLCBoZWlnaHQgfSwgJ2NvdmVyJykpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy5wcmVjaXNlKSB7XG4gICAgICAgICAgICB4ID0gTWF0aC5yb3VuZCh4KTtcbiAgICAgICAgICAgIHkgPSBNYXRoLnJvdW5kKHkpO1xuICAgICAgICAgICAgd2lkdGggPSBNYXRoLnJvdW5kKHdpZHRoKTtcbiAgICAgICAgICAgIGhlaWdodCA9IE1hdGgucm91bmQoaGVpZ2h0KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoeCA9PT0gdGhpcy54XG4gICAgICAgICAgICAmJiB5ID09PSB0aGlzLnlcbiAgICAgICAgICAgICYmIHdpZHRoID09PSB0aGlzLndpZHRoXG4gICAgICAgICAgICAmJiBoZWlnaHQgPT09IHRoaXMuaGVpZ2h0XG4gICAgICAgICAgICAmJiBPYmplY3QuaXMoYXNwZWN0UmF0aW8sIHRoaXMuYXNwZWN0UmF0aW8pXG4gICAgICAgICAgICAmJiAhX2ZvcmNlKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5oaWRkZW4pIHtcbiAgICAgICAgICAgIHRoaXMuaGlkZGVuID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuJGVtaXQoRVZFTlRfQ0hBTkdFLCB7XG4gICAgICAgICAgICB4LFxuICAgICAgICAgICAgeSxcbiAgICAgICAgICAgIHdpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0LFxuICAgICAgICB9KSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuJGNoYW5naW5nID0gdHJ1ZTtcbiAgICAgICAgdGhpcy54ID0geDtcbiAgICAgICAgdGhpcy55ID0geTtcbiAgICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xuICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgdGhpcy4kY2hhbmdpbmcgPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuIHRoaXMuJHJlbmRlcigpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXNldHMgdGhlIHNlbGVjdGlvbiB0byBpdHMgaW5pdGlhbCBwb3NpdGlvbiBhbmQgc2l6ZS5cbiAgICAgKiBAcmV0dXJucyB7Q3JvcHBlclNlbGVjdGlvbn0gUmV0dXJucyBgdGhpc2AgZm9yIGNoYWluaW5nLlxuICAgICAqL1xuICAgICRyZXNldCgpIHtcbiAgICAgICAgY29uc3QgeyB4LCB5LCB3aWR0aCwgaGVpZ2h0LCB9ID0gdGhpcy4kaW5pdGlhbFNlbGVjdGlvbjtcbiAgICAgICAgcmV0dXJuIHRoaXMuJGNoYW5nZSh4LCB5LCB3aWR0aCwgaGVpZ2h0KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2xlYXJzIHRoZSBzZWxlY3Rpb24uXG4gICAgICogQHJldHVybnMge0Nyb3BwZXJTZWxlY3Rpb259IFJldHVybnMgYHRoaXNgIGZvciBjaGFpbmluZy5cbiAgICAgKi9cbiAgICAkY2xlYXIoKSB7XG4gICAgICAgIHRoaXMuJGNoYW5nZSgwLCAwLCAwLCAwLCBOYU4sIHRydWUpO1xuICAgICAgICB0aGlzLmhpZGRlbiA9IHRydWU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZWZyZXNoZXMgdGhlIHBvc2l0aW9uIG9yIHNpemUgb2YgdGhlIHNlbGVjdGlvbi5cbiAgICAgKiBAcmV0dXJucyB7Q3JvcHBlclNlbGVjdGlvbn0gUmV0dXJucyBgdGhpc2AgZm9yIGNoYWluaW5nLlxuICAgICAqL1xuICAgICRyZW5kZXIoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLiRzZXRTdHlsZXMoe1xuICAgICAgICAgICAgdHJhbnNmb3JtOiBgdHJhbnNsYXRlKCR7dGhpcy54fXB4LCAke3RoaXMueX1weClgLFxuICAgICAgICAgICAgd2lkdGg6IHRoaXMud2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IHRoaXMuaGVpZ2h0LFxuICAgICAgICB9KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogR2VuZXJhdGVzIGEgcmVhbCBjYW52YXMgZWxlbWVudCwgd2l0aCB0aGUgaW1hZ2UgKHNlbGVjdGVkIGFyZWEgb25seSkgZHJhdyBpbnRvIGlmIHRoZXJlIGlzIG9uZS5cbiAgICAgKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnNdIFRoZSBhdmFpbGFibGUgb3B0aW9ucy5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMud2lkdGhdIFRoZSB3aWR0aCBvZiB0aGUgY2FudmFzLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy5oZWlnaHRdIFRoZSBoZWlnaHQgb2YgdGhlIGNhbnZhcy5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBbb3B0aW9ucy5iZWZvcmVEcmF3XSBUaGUgZnVuY3Rpb24gY2FsbGVkIGJlZm9yZSBkcmF3aW5nIHRoZSBpbWFnZSBvbnRvIHRoZSBjYW52YXMuXG4gICAgICogQHJldHVybnMge1Byb21pc2V9IFJldHVybnMgYSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgdG8gdGhlIGdlbmVyYXRlZCBjYW52YXMgZWxlbWVudC5cbiAgICAgKi9cbiAgICAkdG9DYW52YXMob3B0aW9ucykge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmlzQ29ubmVjdGVkKSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcignVGhlIGN1cnJlbnQgZWxlbWVudCBpcyBub3QgY29ubmVjdGVkIHRvIHRoZSBET00uJykpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgICAgICAgbGV0IHsgd2lkdGgsIGhlaWdodCB9ID0gdGhpcztcbiAgICAgICAgICAgIGxldCBzY2FsZSA9IDE7XG4gICAgICAgICAgICBpZiAoaXNQbGFpbk9iamVjdChvcHRpb25zKVxuICAgICAgICAgICAgICAgICYmIChpc1Bvc2l0aXZlTnVtYmVyKG9wdGlvbnMud2lkdGgpIHx8IGlzUG9zaXRpdmVOdW1iZXIob3B0aW9ucy5oZWlnaHQpKSkge1xuICAgICAgICAgICAgICAgICh7IHdpZHRoLCBoZWlnaHQgfSA9IGdldEFkanVzdGVkU2l6ZXMoe1xuICAgICAgICAgICAgICAgICAgICBhc3BlY3RSYXRpbzogd2lkdGggLyBoZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiBvcHRpb25zLndpZHRoLFxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IG9wdGlvbnMuaGVpZ2h0LFxuICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICBzY2FsZSA9IHdpZHRoIC8gdGhpcy53aWR0aDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhbnZhcy53aWR0aCA9IHdpZHRoO1xuICAgICAgICAgICAgY2FudmFzLmhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgICAgIGlmICghdGhpcy4kY2FudmFzKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShjYW52YXMpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGNyb3BwZXJJbWFnZSA9IHRoaXMuJGNhbnZhcy5xdWVyeVNlbGVjdG9yKHRoaXMuJGdldFRhZ05hbWVPZihDUk9QUEVSX0lNQUdFKSk7XG4gICAgICAgICAgICBpZiAoIWNyb3BwZXJJbWFnZSkge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoY2FudmFzKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjcm9wcGVySW1hZ2UuJHJlYWR5KCkudGhlbigoaW1hZ2UpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgICAgICAgICAgICAgaWYgKGNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgW2EsIGIsIGMsIGQsIGUsIGZdID0gY3JvcHBlckltYWdlLiRnZXRUcmFuc2Zvcm0oKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2Zmc2V0WCA9IC10aGlzLng7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG9mZnNldFkgPSAtdGhpcy55O1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB0cmFuc2xhdGVYID0gKChvZmZzZXRYICogZCkgLSAoYyAqIG9mZnNldFkpKSAvICgoYSAqIGQpIC0gKGMgKiBiKSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRyYW5zbGF0ZVkgPSAoKG9mZnNldFkgKiBhKSAtIChiICogb2Zmc2V0WCkpIC8gKChhICogZCkgLSAoYyAqIGIpKTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IG5ld0UgPSBhICogdHJhbnNsYXRlWCArIGMgKiB0cmFuc2xhdGVZICsgZTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IG5ld0YgPSBiICogdHJhbnNsYXRlWCArIGQgKiB0cmFuc2xhdGVZICsgZjtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGRlc3RXaWR0aCA9IGltYWdlLm5hdHVyYWxXaWR0aDtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGRlc3RIZWlnaHQgPSBpbWFnZS5uYXR1cmFsSGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2NhbGUgIT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld0UgKj0gc2NhbGU7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdGICo9IHNjYWxlO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVzdFdpZHRoICo9IHNjYWxlO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVzdEhlaWdodCAqPSBzY2FsZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjZW50ZXJYID0gZGVzdFdpZHRoIC8gMjtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2VudGVyWSA9IGRlc3RIZWlnaHQgLyAyO1xuICAgICAgICAgICAgICAgICAgICBjb250ZXh0LmZpbGxTdHlsZSA9ICd0cmFuc3BhcmVudCc7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQuZmlsbFJlY3QoMCwgMCwgd2lkdGgsIGhlaWdodCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpc1BsYWluT2JqZWN0KG9wdGlvbnMpICYmIGlzRnVuY3Rpb24ob3B0aW9ucy5iZWZvcmVEcmF3KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5iZWZvcmVEcmF3LmNhbGwodGhpcywgY29udGV4dCwgY2FudmFzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjb250ZXh0LnNhdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gTW92ZSB0aGUgdHJhbnNmb3JtIG9yaWdpbiB0byB0aGUgY2VudGVyIG9mIHRoZSBpbWFnZS5cbiAgICAgICAgICAgICAgICAgICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQ1NTL3RyYW5zZm9ybS1vcmlnaW5cbiAgICAgICAgICAgICAgICAgICAgY29udGV4dC50cmFuc2xhdGUoY2VudGVyWCwgY2VudGVyWSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQudHJhbnNmb3JtKGEsIGIsIGMsIGQsIG5ld0UsIG5ld0YpO1xuICAgICAgICAgICAgICAgICAgICAvLyBNb3ZlIHRoZSB0cmFuc2Zvcm0gb3JpZ2luIHRvIHRoZSB0b3AtbGVmdCBvZiB0aGUgaW1hZ2UuXG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQudHJhbnNsYXRlKC1jZW50ZXJYLCAtY2VudGVyWSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGltYWdlLCAwLCAwLCBkZXN0V2lkdGgsIGRlc3RIZWlnaHQpO1xuICAgICAgICAgICAgICAgICAgICBjb250ZXh0LnJlc3RvcmUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShjYW52YXMpO1xuICAgICAgICAgICAgfSkuY2F0Y2gocmVqZWN0KTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuQ3JvcHBlclNlbGVjdGlvbi4kbmFtZSA9IENST1BQRVJfU0VMRUNUSU9OO1xuQ3JvcHBlclNlbGVjdGlvbi4kdmVyc2lvbiA9ICcyLjAuMCc7XG5cbmV4cG9ydCB7IENyb3BwZXJTZWxlY3Rpb24gYXMgZGVmYXVsdCB9O1xuIiwgImltcG9ydCBDcm9wcGVyRWxlbWVudCBmcm9tICdAY3JvcHBlci9lbGVtZW50JztcbmltcG9ydCB7IENST1BQRVJfR0lSRCB9IGZyb20gJ0Bjcm9wcGVyL3V0aWxzJztcblxudmFyIHN0eWxlID0gYDpob3N0e2Rpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47cG9zaXRpb246cmVsYXRpdmU7dG91Y2gtYWN0aW9uOm5vbmU7LXdlYmtpdC11c2VyLXNlbGVjdDpub25lOy1tb3otdXNlci1zZWxlY3Q6bm9uZTt1c2VyLXNlbGVjdDpub25lfTpob3N0KFtib3JkZXJlZF0pe2JvcmRlcjoxcHggZGFzaGVkIHZhcigtLXRoZW1lLWNvbG9yKX06aG9zdChbY292ZXJlZF0pe2JvdHRvbTowO2xlZnQ6MDtwb3NpdGlvbjphYnNvbHV0ZTtyaWdodDowO3RvcDowfTpob3N0PnNwYW57ZGlzcGxheTpmbGV4O2ZsZXg6MX06aG9zdD5zcGFuK3NwYW57Ym9yZGVyLXRvcDoxcHggZGFzaGVkIHZhcigtLXRoZW1lLWNvbG9yKX06aG9zdD5zcGFuPnNwYW57ZmxleDoxfTpob3N0PnNwYW4+c3BhbitzcGFue2JvcmRlci1sZWZ0OjFweCBkYXNoZWQgdmFyKC0tdGhlbWUtY29sb3IpfWA7XG5cbmNsYXNzIENyb3BwZXJHcmlkIGV4dGVuZHMgQ3JvcHBlckVsZW1lbnQge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlciguLi5hcmd1bWVudHMpO1xuICAgICAgICB0aGlzLiRzdHlsZSA9IHN0eWxlO1xuICAgICAgICB0aGlzLmJvcmRlcmVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuY29sdW1ucyA9IDM7XG4gICAgICAgIHRoaXMuY292ZXJlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnJvd3MgPSAzO1xuICAgICAgICB0aGlzLnNsb3R0YWJsZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLnRoZW1lQ29sb3IgPSAncmdiYSgyMzgsIDIzOCwgMjM4LCAwLjUpJztcbiAgICB9XG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7XG4gICAgICAgIHJldHVybiBzdXBlci5vYnNlcnZlZEF0dHJpYnV0ZXMuY29uY2F0KFtcbiAgICAgICAgICAgICdib3JkZXJlZCcsXG4gICAgICAgICAgICAnY29sdW1ucycsXG4gICAgICAgICAgICAnY292ZXJlZCcsXG4gICAgICAgICAgICAncm93cycsXG4gICAgICAgIF0pO1xuICAgIH1cbiAgICAkcHJvcGVydHlDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKSB7XG4gICAgICAgIGlmIChPYmplY3QuaXMobmV3VmFsdWUsIG9sZFZhbHVlKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHN1cGVyLiRwcm9wZXJ0eUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpO1xuICAgICAgICBpZiAobmFtZSA9PT0gJ3Jvd3MnIHx8IG5hbWUgPT09ICdjb2x1bW5zJykge1xuICAgICAgICAgICAgdGhpcy4kbmV4dFRpY2soKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuJHJlbmRlcigpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHN1cGVyLmNvbm5lY3RlZENhbGxiYWNrKCk7XG4gICAgICAgIHRoaXMuJHJlbmRlcigpO1xuICAgIH1cbiAgICAkcmVuZGVyKCkge1xuICAgICAgICBjb25zdCBzaGFkb3cgPSB0aGlzLiRnZXRTaGFkb3dSb290KCk7XG4gICAgICAgIGNvbnN0IGZyYWdtZW50ID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucm93czsgaSArPSAxKSB7XG4gICAgICAgICAgICBjb25zdCByb3cgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICAgICAgICByb3cuc2V0QXR0cmlidXRlKCdyb2xlJywgJ3JvdycpO1xuICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCB0aGlzLmNvbHVtbnM7IGogKz0gMSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbHVtbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICAgICAgICAgICAgICBjb2x1bW4uc2V0QXR0cmlidXRlKCdyb2xlJywgJ2dyaWRjZWxsJyk7XG4gICAgICAgICAgICAgICAgcm93LmFwcGVuZENoaWxkKGNvbHVtbik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmcmFnbWVudC5hcHBlbmRDaGlsZChyb3cpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzaGFkb3cpIHtcbiAgICAgICAgICAgIHNoYWRvdy5pbm5lckhUTUwgPSAnJztcbiAgICAgICAgICAgIHNoYWRvdy5hcHBlbmRDaGlsZChmcmFnbWVudCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5Dcm9wcGVyR3JpZC4kbmFtZSA9IENST1BQRVJfR0lSRDtcbkNyb3BwZXJHcmlkLiR2ZXJzaW9uID0gJzIuMC4wJztcblxuZXhwb3J0IHsgQ3JvcHBlckdyaWQgYXMgZGVmYXVsdCB9O1xuIiwgImltcG9ydCBDcm9wcGVyRWxlbWVudCBmcm9tICdAY3JvcHBlci9lbGVtZW50JztcbmltcG9ydCB7IENST1BQRVJfQ1JPU1NIQUlSIH0gZnJvbSAnQGNyb3BwZXIvdXRpbHMnO1xuXG52YXIgc3R5bGUgPSBgOmhvc3R7ZGlzcGxheTppbmxpbmUtYmxvY2s7aGVpZ2h0OjFlbTtwb3NpdGlvbjpyZWxhdGl2ZTt0b3VjaC1hY3Rpb246bm9uZTstd2Via2l0LXVzZXItc2VsZWN0Om5vbmU7LW1vei11c2VyLXNlbGVjdDpub25lO3VzZXItc2VsZWN0Om5vbmU7dmVydGljYWwtYWxpZ246bWlkZGxlO3dpZHRoOjFlbX06aG9zdDphZnRlciw6aG9zdDpiZWZvcmV7YmFja2dyb3VuZC1jb2xvcjp2YXIoLS10aGVtZS1jb2xvcik7Y29udGVudDpcIlwiO2Rpc3BsYXk6YmxvY2s7cG9zaXRpb246YWJzb2x1dGV9Omhvc3Q6YmVmb3Jle2hlaWdodDoxcHg7bGVmdDowO3RvcDo1MCU7dHJhbnNmb3JtOnRyYW5zbGF0ZVkoLTUwJSk7d2lkdGg6MTAwJX06aG9zdDphZnRlcntoZWlnaHQ6MTAwJTtsZWZ0OjUwJTt0b3A6MDt0cmFuc2Zvcm06dHJhbnNsYXRlWCgtNTAlKTt3aWR0aDoxcHh9Omhvc3QoW2NlbnRlcmVkXSl7bGVmdDo1MCU7cG9zaXRpb246YWJzb2x1dGU7dG9wOjUwJTt0cmFuc2Zvcm06dHJhbnNsYXRlKC01MCUsLTUwJSl9YDtcblxuY2xhc3MgQ3JvcHBlckNyb3NzaGFpciBleHRlbmRzIENyb3BwZXJFbGVtZW50IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoLi4uYXJndW1lbnRzKTtcbiAgICAgICAgdGhpcy4kc3R5bGUgPSBzdHlsZTtcbiAgICAgICAgdGhpcy5jZW50ZXJlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnNsb3R0YWJsZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLnRoZW1lQ29sb3IgPSAncmdiYSgyMzgsIDIzOCwgMjM4LCAwLjUpJztcbiAgICB9XG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7XG4gICAgICAgIHJldHVybiBzdXBlci5vYnNlcnZlZEF0dHJpYnV0ZXMuY29uY2F0KFtcbiAgICAgICAgICAgICdjZW50ZXJlZCcsXG4gICAgICAgIF0pO1xuICAgIH1cbn1cbkNyb3BwZXJDcm9zc2hhaXIuJG5hbWUgPSBDUk9QUEVSX0NST1NTSEFJUjtcbkNyb3BwZXJDcm9zc2hhaXIuJHZlcnNpb24gPSAnMi4wLjAnO1xuXG5leHBvcnQgeyBDcm9wcGVyQ3Jvc3NoYWlyIGFzIGRlZmF1bHQgfTtcbiIsICJpbXBvcnQgQ3JvcHBlckVsZW1lbnQgZnJvbSAnQGNyb3BwZXIvZWxlbWVudCc7XG5pbXBvcnQgeyBDUk9QUEVSX1ZJRVdFUiwgQ1JPUFBFUl9TRUxFQ1RJT04sIGlzRWxlbWVudCwgb24sIEVWRU5UX0NIQU5HRSwgQ1JPUFBFUl9DQU5WQVMsIENST1BQRVJfSU1BR0UsIEVWRU5UX0xPQUQsIEVWRU5UX1RSQU5TRk9STSwgb2ZmIH0gZnJvbSAnQGNyb3BwZXIvdXRpbHMnO1xuXG52YXIgc3R5bGUgPSBgOmhvc3R7ZGlzcGxheTpibG9jaztoZWlnaHQ6MTAwJTtvdmVyZmxvdzpoaWRkZW47cG9zaXRpb246cmVsYXRpdmU7d2lkdGg6MTAwJX1gO1xuXG5jb25zdCBjYW52YXNDYWNoZSA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBpbWFnZUNhY2hlID0gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IHNlbGVjdGlvbkNhY2hlID0gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IHNvdXJjZUltYWdlQ2FjaGUgPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgUkVTSVpFX0JPVEggPSAnYm90aCc7XG5jb25zdCBSRVNJWkVfSE9SSVpPTlRBTCA9ICdob3Jpem9udGFsJztcbmNvbnN0IFJFU0laRV9WRVJUSUNBTCA9ICd2ZXJ0aWNhbCc7XG5jb25zdCBSRVNJWkVfTk9ORSA9ICdub25lJztcbmNsYXNzIENyb3BwZXJWaWV3ZXIgZXh0ZW5kcyBDcm9wcGVyRWxlbWVudCB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKC4uLmFyZ3VtZW50cyk7XG4gICAgICAgIHRoaXMuJG9uU2VsZWN0aW9uQ2hhbmdlID0gbnVsbDtcbiAgICAgICAgdGhpcy4kb25Tb3VyY2VJbWFnZUxvYWQgPSBudWxsO1xuICAgICAgICB0aGlzLiRvblNvdXJjZUltYWdlVHJhbnNmb3JtID0gbnVsbDtcbiAgICAgICAgdGhpcy4kc2NhbGUgPSAxO1xuICAgICAgICB0aGlzLiRzdHlsZSA9IHN0eWxlO1xuICAgICAgICB0aGlzLnJlc2l6ZSA9IFJFU0laRV9WRVJUSUNBTDtcbiAgICAgICAgdGhpcy5zZWxlY3Rpb24gPSAnJztcbiAgICAgICAgdGhpcy5zbG90dGFibGUgPSBmYWxzZTtcbiAgICB9XG4gICAgc2V0ICRpbWFnZShlbGVtZW50KSB7XG4gICAgICAgIGltYWdlQ2FjaGUuc2V0KHRoaXMsIGVsZW1lbnQpO1xuICAgIH1cbiAgICBnZXQgJGltYWdlKCkge1xuICAgICAgICByZXR1cm4gaW1hZ2VDYWNoZS5nZXQodGhpcyk7XG4gICAgfVxuICAgIHNldCAkc291cmNlSW1hZ2UoZWxlbWVudCkge1xuICAgICAgICBzb3VyY2VJbWFnZUNhY2hlLnNldCh0aGlzLCBlbGVtZW50KTtcbiAgICB9XG4gICAgZ2V0ICRzb3VyY2VJbWFnZSgpIHtcbiAgICAgICAgcmV0dXJuIHNvdXJjZUltYWdlQ2FjaGUuZ2V0KHRoaXMpO1xuICAgIH1cbiAgICBzZXQgJGNhbnZhcyhlbGVtZW50KSB7XG4gICAgICAgIGNhbnZhc0NhY2hlLnNldCh0aGlzLCBlbGVtZW50KTtcbiAgICB9XG4gICAgZ2V0ICRjYW52YXMoKSB7XG4gICAgICAgIHJldHVybiBjYW52YXNDYWNoZS5nZXQodGhpcyk7XG4gICAgfVxuICAgIHNldCAkc2VsZWN0aW9uKGVsZW1lbnQpIHtcbiAgICAgICAgc2VsZWN0aW9uQ2FjaGUuc2V0KHRoaXMsIGVsZW1lbnQpO1xuICAgIH1cbiAgICBnZXQgJHNlbGVjdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHNlbGVjdGlvbkNhY2hlLmdldCh0aGlzKTtcbiAgICB9XG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7XG4gICAgICAgIHJldHVybiBzdXBlci5vYnNlcnZlZEF0dHJpYnV0ZXMuY29uY2F0KFtcbiAgICAgICAgICAgICdyZXNpemUnLFxuICAgICAgICAgICAgJ3NlbGVjdGlvbicsXG4gICAgICAgIF0pO1xuICAgIH1cbiAgICBjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgc3VwZXIuY29ubmVjdGVkQ2FsbGJhY2soKTtcbiAgICAgICAgbGV0ICRzZWxlY3Rpb24gPSBudWxsO1xuICAgICAgICBpZiAodGhpcy5zZWxlY3Rpb24pIHtcbiAgICAgICAgICAgICRzZWxlY3Rpb24gPSB0aGlzLm93bmVyRG9jdW1lbnQucXVlcnlTZWxlY3Rvcih0aGlzLnNlbGVjdGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAkc2VsZWN0aW9uID0gdGhpcy5jbG9zZXN0KHRoaXMuJGdldFRhZ05hbWVPZihDUk9QUEVSX1NFTEVDVElPTikpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpc0VsZW1lbnQoJHNlbGVjdGlvbikpIHtcbiAgICAgICAgICAgIHRoaXMuJHNlbGVjdGlvbiA9ICRzZWxlY3Rpb247XG4gICAgICAgICAgICB0aGlzLiRvblNlbGVjdGlvbkNoYW5nZSA9IHRoaXMuJGhhbmRsZVNlbGVjdGlvbkNoYW5nZS5iaW5kKHRoaXMpO1xuICAgICAgICAgICAgb24oJHNlbGVjdGlvbiwgRVZFTlRfQ0hBTkdFLCB0aGlzLiRvblNlbGVjdGlvbkNoYW5nZSk7XG4gICAgICAgICAgICBjb25zdCAkY2FudmFzID0gJHNlbGVjdGlvbi5jbG9zZXN0KHRoaXMuJGdldFRhZ05hbWVPZihDUk9QUEVSX0NBTlZBUykpO1xuICAgICAgICAgICAgaWYgKCRjYW52YXMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLiRjYW52YXMgPSAkY2FudmFzO1xuICAgICAgICAgICAgICAgIGNvbnN0ICRzb3VyY2VJbWFnZSA9ICRjYW52YXMucXVlcnlTZWxlY3Rvcih0aGlzLiRnZXRUYWdOYW1lT2YoQ1JPUFBFUl9JTUFHRSkpO1xuICAgICAgICAgICAgICAgIGlmICgkc291cmNlSW1hZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy4kc291cmNlSW1hZ2UgPSAkc291cmNlSW1hZ2U7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuJGltYWdlID0gJHNvdXJjZUltYWdlLmNsb25lTm9kZSh0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy4kZ2V0U2hhZG93Um9vdCgpLmFwcGVuZENoaWxkKHRoaXMuJGltYWdlKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy4kb25Tb3VyY2VJbWFnZUxvYWQgPSB0aGlzLiRoYW5kbGVTb3VyY2VJbWFnZUxvYWQuYmluZCh0aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy4kb25Tb3VyY2VJbWFnZVRyYW5zZm9ybSA9IHRoaXMuJGhhbmRsZVNvdXJjZUltYWdlVHJhbnNmb3JtLmJpbmQodGhpcyk7XG4gICAgICAgICAgICAgICAgICAgIG9uKCRzb3VyY2VJbWFnZS4kaW1hZ2UsIEVWRU5UX0xPQUQsIHRoaXMuJG9uU291cmNlSW1hZ2VMb2FkKTtcbiAgICAgICAgICAgICAgICAgICAgb24oJHNvdXJjZUltYWdlLCBFVkVOVF9UUkFOU0ZPUk0sIHRoaXMuJG9uU291cmNlSW1hZ2VUcmFuc2Zvcm0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuJHJlbmRlcigpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGRpc2Nvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICBjb25zdCB7ICRzZWxlY3Rpb24sICRzb3VyY2VJbWFnZSB9ID0gdGhpcztcbiAgICAgICAgaWYgKCRzZWxlY3Rpb24gJiYgdGhpcy4kb25TZWxlY3Rpb25DaGFuZ2UpIHtcbiAgICAgICAgICAgIG9mZigkc2VsZWN0aW9uLCBFVkVOVF9DSEFOR0UsIHRoaXMuJG9uU2VsZWN0aW9uQ2hhbmdlKTtcbiAgICAgICAgICAgIHRoaXMuJG9uU2VsZWN0aW9uQ2hhbmdlID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoJHNvdXJjZUltYWdlICYmIHRoaXMuJG9uU291cmNlSW1hZ2VMb2FkKSB7XG4gICAgICAgICAgICBvZmYoJHNvdXJjZUltYWdlLiRpbWFnZSwgRVZFTlRfTE9BRCwgdGhpcy4kb25Tb3VyY2VJbWFnZUxvYWQpO1xuICAgICAgICAgICAgdGhpcy4kb25Tb3VyY2VJbWFnZUxvYWQgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGlmICgkc291cmNlSW1hZ2UgJiYgdGhpcy4kb25Tb3VyY2VJbWFnZVRyYW5zZm9ybSkge1xuICAgICAgICAgICAgb2ZmKCRzb3VyY2VJbWFnZSwgRVZFTlRfVFJBTlNGT1JNLCB0aGlzLiRvblNvdXJjZUltYWdlVHJhbnNmb3JtKTtcbiAgICAgICAgICAgIHRoaXMuJG9uU291cmNlSW1hZ2VUcmFuc2Zvcm0gPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHN1cGVyLmRpc2Nvbm5lY3RlZENhbGxiYWNrKCk7XG4gICAgfVxuICAgICRoYW5kbGVTZWxlY3Rpb25DaGFuZ2UoZXZlbnQpIHtcbiAgICAgICAgdGhpcy4kcmVuZGVyKGV2ZW50LmRldGFpbCk7XG4gICAgfVxuICAgICRoYW5kbGVTb3VyY2VJbWFnZUxvYWQoKSB7XG4gICAgICAgIGNvbnN0IHsgJGltYWdlLCAkc291cmNlSW1hZ2UgfSA9IHRoaXM7XG4gICAgICAgIGNvbnN0IG9sZFNyYyA9ICRpbWFnZS5nZXRBdHRyaWJ1dGUoJ3NyYycpO1xuICAgICAgICBjb25zdCBuZXdTcmMgPSAkc291cmNlSW1hZ2UuZ2V0QXR0cmlidXRlKCdzcmMnKTtcbiAgICAgICAgaWYgKG5ld1NyYyAmJiBuZXdTcmMgIT09IG9sZFNyYykge1xuICAgICAgICAgICAgJGltYWdlLnNldEF0dHJpYnV0ZSgnc3JjJywgbmV3U3JjKTtcbiAgICAgICAgICAgICRpbWFnZS4kcmVhZHkoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLiRyZW5kZXIoKTtcbiAgICAgICAgICAgICAgICB9LCA1MCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAkaGFuZGxlU291cmNlSW1hZ2VUcmFuc2Zvcm0oZXZlbnQpIHtcbiAgICAgICAgdGhpcy4kcmVuZGVyKHVuZGVmaW5lZCwgZXZlbnQuZGV0YWlsLm1hdHJpeCk7XG4gICAgfVxuICAgICRyZW5kZXIoc2VsZWN0aW9uLCBtYXRyaXgpIHtcbiAgICAgICAgY29uc3QgeyAkY2FudmFzLCAkc2VsZWN0aW9uIH0gPSB0aGlzO1xuICAgICAgICBpZiAoIXNlbGVjdGlvbiAmJiAhJHNlbGVjdGlvbi5oaWRkZW4pIHtcbiAgICAgICAgICAgIHNlbGVjdGlvbiA9ICRzZWxlY3Rpb247XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFzZWxlY3Rpb24gfHwgKHNlbGVjdGlvbi54ID09PSAwXG4gICAgICAgICAgICAmJiBzZWxlY3Rpb24ueSA9PT0gMFxuICAgICAgICAgICAgJiYgc2VsZWN0aW9uLndpZHRoID09PSAwXG4gICAgICAgICAgICAmJiBzZWxlY3Rpb24uaGVpZ2h0ID09PSAwKSkge1xuICAgICAgICAgICAgc2VsZWN0aW9uID0ge1xuICAgICAgICAgICAgICAgIHg6IDAsXG4gICAgICAgICAgICAgICAgeTogMCxcbiAgICAgICAgICAgICAgICB3aWR0aDogJGNhbnZhcy5vZmZzZXRXaWR0aCxcbiAgICAgICAgICAgICAgICBoZWlnaHQ6ICRjYW52YXMub2Zmc2V0SGVpZ2h0LFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB7IHgsIHksIHdpZHRoLCBoZWlnaHQsIH0gPSBzZWxlY3Rpb247XG4gICAgICAgIGNvbnN0IHN0eWxlcyA9IHt9O1xuICAgICAgICBjb25zdCB7IGNsaWVudFdpZHRoLCBjbGllbnRIZWlnaHQgfSA9IHRoaXM7XG4gICAgICAgIGxldCBuZXdXaWR0aCA9IGNsaWVudFdpZHRoO1xuICAgICAgICBsZXQgbmV3SGVpZ2h0ID0gY2xpZW50SGVpZ2h0O1xuICAgICAgICBsZXQgc2NhbGUgPSBOYU47XG4gICAgICAgIHN3aXRjaCAodGhpcy5yZXNpemUpIHtcbiAgICAgICAgICAgIGNhc2UgUkVTSVpFX0JPVEg6XG4gICAgICAgICAgICAgICAgc2NhbGUgPSAxO1xuICAgICAgICAgICAgICAgIG5ld1dpZHRoID0gd2lkdGg7XG4gICAgICAgICAgICAgICAgbmV3SGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICAgICAgICAgIHN0eWxlcy53aWR0aCA9IHdpZHRoO1xuICAgICAgICAgICAgICAgIHN0eWxlcy5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFJFU0laRV9IT1JJWk9OVEFMOlxuICAgICAgICAgICAgICAgIHNjYWxlID0gaGVpZ2h0ID4gMCA/IGNsaWVudEhlaWdodCAvIGhlaWdodCA6IDA7XG4gICAgICAgICAgICAgICAgbmV3V2lkdGggPSB3aWR0aCAqIHNjYWxlO1xuICAgICAgICAgICAgICAgIHN0eWxlcy53aWR0aCA9IG5ld1dpZHRoO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBSRVNJWkVfVkVSVElDQUw6XG4gICAgICAgICAgICAgICAgc2NhbGUgPSB3aWR0aCA+IDAgPyBjbGllbnRXaWR0aCAvIHdpZHRoIDogMDtcbiAgICAgICAgICAgICAgICBuZXdIZWlnaHQgPSBoZWlnaHQgKiBzY2FsZTtcbiAgICAgICAgICAgICAgICBzdHlsZXMuaGVpZ2h0ID0gbmV3SGVpZ2h0O1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBSRVNJWkVfTk9ORTpcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgaWYgKGNsaWVudFdpZHRoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBzY2FsZSA9IHdpZHRoID4gMCA/IGNsaWVudFdpZHRoIC8gd2lkdGggOiAwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChjbGllbnRIZWlnaHQgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHNjYWxlID0gaGVpZ2h0ID4gMCA/IGNsaWVudEhlaWdodCAvIGhlaWdodCA6IDA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuJHNjYWxlID0gc2NhbGU7XG4gICAgICAgIHRoaXMuJHNldFN0eWxlcyhzdHlsZXMpO1xuICAgICAgICBpZiAodGhpcy4kc291cmNlSW1hZ2UpIHtcbiAgICAgICAgICAgIHRoaXMuJHRyYW5zZm9ybUltYWdlQnlPZmZzZXQobWF0cml4ICE9PSBudWxsICYmIG1hdHJpeCAhPT0gdm9pZCAwID8gbWF0cml4IDogdGhpcy4kc291cmNlSW1hZ2UuJGdldFRyYW5zZm9ybSgpLCAteCwgLXkpO1xuICAgICAgICB9XG4gICAgfVxuICAgICR0cmFuc2Zvcm1JbWFnZUJ5T2Zmc2V0KG1hdHJpeCwgeCwgeSkge1xuICAgICAgICBjb25zdCB7ICRpbWFnZSwgJHNjYWxlLCAkc291cmNlSW1hZ2UsIH0gPSB0aGlzO1xuICAgICAgICBpZiAoJHNvdXJjZUltYWdlICYmICRpbWFnZSAmJiAkc2NhbGUgPj0gMCkge1xuICAgICAgICAgICAgY29uc3QgW2EsIGIsIGMsIGQsIGUsIGZdID0gbWF0cml4O1xuICAgICAgICAgICAgY29uc3QgdHJhbnNsYXRlWCA9ICgoeCAqIGQpIC0gKGMgKiB5KSkgLyAoKGEgKiBkKSAtIChjICogYikpO1xuICAgICAgICAgICAgY29uc3QgdHJhbnNsYXRlWSA9ICgoeSAqIGEpIC0gKGIgKiB4KSkgLyAoKGEgKiBkKSAtIChjICogYikpO1xuICAgICAgICAgICAgY29uc3QgbmV3RSA9IGEgKiB0cmFuc2xhdGVYICsgYyAqIHRyYW5zbGF0ZVkgKyBlO1xuICAgICAgICAgICAgY29uc3QgbmV3RiA9IGIgKiB0cmFuc2xhdGVYICsgZCAqIHRyYW5zbGF0ZVkgKyBmO1xuICAgICAgICAgICAgJGltYWdlLiRyZWFkeSgoaW1hZ2UpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLiRzZXRTdHlsZXMuY2FsbCgkaW1hZ2UsIHtcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IGltYWdlLm5hdHVyYWxXaWR0aCAqICRzY2FsZSxcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBpbWFnZS5uYXR1cmFsSGVpZ2h0ICogJHNjYWxlLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAkaW1hZ2UuJHNldFRyYW5zZm9ybShhLCBiLCBjLCBkLCBuZXdFICogJHNjYWxlLCBuZXdGICogJHNjYWxlKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbkNyb3BwZXJWaWV3ZXIuJG5hbWUgPSBDUk9QUEVSX1ZJRVdFUjtcbkNyb3BwZXJWaWV3ZXIuJHZlcnNpb24gPSAnMi4wLjAnO1xuXG5leHBvcnQgeyBSRVNJWkVfQk9USCwgUkVTSVpFX0hPUklaT05UQUwsIFJFU0laRV9OT05FLCBSRVNJWkVfVkVSVElDQUwsIENyb3BwZXJWaWV3ZXIgYXMgZGVmYXVsdCB9O1xuIiwgIi8qISBDcm9wcGVyLmpzIHYyLjAuMCB8IChjKSAyMDE1LXByZXNlbnQgQ2hlbiBGZW5neXVhbiB8IE1JVCAqL1xuaW1wb3J0IHsgaXNTdHJpbmcsIGlzRWxlbWVudCwgQ1JPUFBFUl9JTUFHRSwgQ1JPUFBFUl9DQU5WQVMsIENST1BQRVJfU0VMRUNUSU9OIH0gZnJvbSAnQGNyb3BwZXIvdXRpbHMnO1xuZXhwb3J0ICogZnJvbSAnQGNyb3BwZXIvdXRpbHMnO1xuaW1wb3J0IHsgQ3JvcHBlckNhbnZhcywgQ3JvcHBlckNyb3NzaGFpciwgQ3JvcHBlckdyaWQsIENyb3BwZXJIYW5kbGUsIENyb3BwZXJJbWFnZSwgQ3JvcHBlclNlbGVjdGlvbiwgQ3JvcHBlclNoYWRlLCBDcm9wcGVyVmlld2VyIH0gZnJvbSAnQGNyb3BwZXIvZWxlbWVudHMnO1xuZXhwb3J0ICogZnJvbSAnQGNyb3BwZXIvZWxlbWVudHMnO1xuXG52YXIgREVGQVVMVF9URU1QTEFURSA9ICgnPGNyb3BwZXItY2FudmFzIGJhY2tncm91bmQ+J1xuICAgICsgJzxjcm9wcGVyLWltYWdlIHJvdGF0YWJsZSBzY2FsYWJsZSBza2V3YWJsZSB0cmFuc2xhdGFibGU+PC9jcm9wcGVyLWltYWdlPidcbiAgICArICc8Y3JvcHBlci1zaGFkZSBoaWRkZW4+PC9jcm9wcGVyLXNoYWRlPidcbiAgICArICc8Y3JvcHBlci1oYW5kbGUgYWN0aW9uPVwic2VsZWN0XCIgcGxhaW4+PC9jcm9wcGVyLWhhbmRsZT4nXG4gICAgKyAnPGNyb3BwZXItc2VsZWN0aW9uIGluaXRpYWwtY292ZXJhZ2U9XCIwLjVcIiBtb3ZhYmxlIHJlc2l6YWJsZT4nXG4gICAgKyAnPGNyb3BwZXItZ3JpZCByb2xlPVwiZ3JpZFwiIGJvcmRlcmVkIGNvdmVyZWQ+PC9jcm9wcGVyLWdyaWQ+J1xuICAgICsgJzxjcm9wcGVyLWNyb3NzaGFpciBjZW50ZXJlZD48L2Nyb3BwZXItY3Jvc3NoYWlyPidcbiAgICArICc8Y3JvcHBlci1oYW5kbGUgYWN0aW9uPVwibW92ZVwiIHRoZW1lLWNvbG9yPVwicmdiYSgyNTUsIDI1NSwgMjU1LCAwLjM1KVwiPjwvY3JvcHBlci1oYW5kbGU+J1xuICAgICsgJzxjcm9wcGVyLWhhbmRsZSBhY3Rpb249XCJuLXJlc2l6ZVwiPjwvY3JvcHBlci1oYW5kbGU+J1xuICAgICsgJzxjcm9wcGVyLWhhbmRsZSBhY3Rpb249XCJlLXJlc2l6ZVwiPjwvY3JvcHBlci1oYW5kbGU+J1xuICAgICsgJzxjcm9wcGVyLWhhbmRsZSBhY3Rpb249XCJzLXJlc2l6ZVwiPjwvY3JvcHBlci1oYW5kbGU+J1xuICAgICsgJzxjcm9wcGVyLWhhbmRsZSBhY3Rpb249XCJ3LXJlc2l6ZVwiPjwvY3JvcHBlci1oYW5kbGU+J1xuICAgICsgJzxjcm9wcGVyLWhhbmRsZSBhY3Rpb249XCJuZS1yZXNpemVcIj48L2Nyb3BwZXItaGFuZGxlPidcbiAgICArICc8Y3JvcHBlci1oYW5kbGUgYWN0aW9uPVwibnctcmVzaXplXCI+PC9jcm9wcGVyLWhhbmRsZT4nXG4gICAgKyAnPGNyb3BwZXItaGFuZGxlIGFjdGlvbj1cInNlLXJlc2l6ZVwiPjwvY3JvcHBlci1oYW5kbGU+J1xuICAgICsgJzxjcm9wcGVyLWhhbmRsZSBhY3Rpb249XCJzdy1yZXNpemVcIj48L2Nyb3BwZXItaGFuZGxlPidcbiAgICArICc8L2Nyb3BwZXItc2VsZWN0aW9uPidcbiAgICArICc8L2Nyb3BwZXItY2FudmFzPicpO1xuXG5jb25zdCBSRUdFWFBfQUxMT1dFRF9FTEVNRU5UUyA9IC9eaW1nfGNhbnZhcyQvO1xuY29uc3QgUkVHRVhQX0JMT0NLRURfVEFHUyA9IC88KFxcLz8oPzpzY3JpcHR8c3R5bGUpW14+XSopPi9naTtcbmNvbnN0IERFRkFVTFRfT1BUSU9OUyA9IHtcbiAgICB0ZW1wbGF0ZTogREVGQVVMVF9URU1QTEFURSxcbn07XG5Dcm9wcGVyQ2FudmFzLiRkZWZpbmUoKTtcbkNyb3BwZXJDcm9zc2hhaXIuJGRlZmluZSgpO1xuQ3JvcHBlckdyaWQuJGRlZmluZSgpO1xuQ3JvcHBlckhhbmRsZS4kZGVmaW5lKCk7XG5Dcm9wcGVySW1hZ2UuJGRlZmluZSgpO1xuQ3JvcHBlclNlbGVjdGlvbi4kZGVmaW5lKCk7XG5Dcm9wcGVyU2hhZGUuJGRlZmluZSgpO1xuQ3JvcHBlclZpZXdlci4kZGVmaW5lKCk7XG5jbGFzcyBDcm9wcGVyIHtcbiAgICBjb25zdHJ1Y3RvcihlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMub3B0aW9ucyA9IERFRkFVTFRfT1BUSU9OUztcbiAgICAgICAgaWYgKGlzU3RyaW5nKGVsZW1lbnQpKSB7XG4gICAgICAgICAgICBlbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihlbGVtZW50KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWlzRWxlbWVudChlbGVtZW50KSB8fCAhUkVHRVhQX0FMTE9XRURfRUxFTUVOVFMudGVzdChlbGVtZW50LmxvY2FsTmFtZSkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIGZpcnN0IGFyZ3VtZW50IGlzIHJlcXVpcmVkIGFuZCBtdXN0IGJlIGFuIDxpbWc+IG9yIDxjYW52YXM+IGVsZW1lbnQuJyk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbiAgICAgICAgb3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oT2JqZWN0LmFzc2lnbih7fSwgREVGQVVMVF9PUFRJT05TKSwgb3B0aW9ucyk7XG4gICAgICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgICAgIGNvbnN0IHsgb3duZXJEb2N1bWVudCB9ID0gZWxlbWVudDtcbiAgICAgICAgbGV0IHsgY29udGFpbmVyIH0gPSBvcHRpb25zO1xuICAgICAgICBpZiAoY29udGFpbmVyKSB7XG4gICAgICAgICAgICBpZiAoaXNTdHJpbmcoY29udGFpbmVyKSkge1xuICAgICAgICAgICAgICAgIGNvbnRhaW5lciA9IG93bmVyRG9jdW1lbnQucXVlcnlTZWxlY3Rvcihjb250YWluZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFpc0VsZW1lbnQoY29udGFpbmVyKSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIGBjb250YWluZXJgIG9wdGlvbiBtdXN0IGJlIGFuIGVsZW1lbnQgb3IgYSB2YWxpZCBzZWxlY3Rvci4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIWlzRWxlbWVudChjb250YWluZXIpKSB7XG4gICAgICAgICAgICBpZiAoZWxlbWVudC5wYXJlbnRFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgY29udGFpbmVyID0gZWxlbWVudC5wYXJlbnRFbGVtZW50O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgY29udGFpbmVyID0gb3duZXJEb2N1bWVudC5ib2R5O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuY29udGFpbmVyID0gY29udGFpbmVyO1xuICAgICAgICBjb25zdCB0YWdOYW1lID0gZWxlbWVudC5sb2NhbE5hbWU7XG4gICAgICAgIGxldCBzcmMgPSAnJztcbiAgICAgICAgaWYgKHRhZ05hbWUgPT09ICdpbWcnKSB7XG4gICAgICAgICAgICAoeyBzcmMgfSA9IGVsZW1lbnQpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHRhZ05hbWUgPT09ICdjYW52YXMnICYmIHdpbmRvdy5IVE1MQ2FudmFzRWxlbWVudCkge1xuICAgICAgICAgICAgc3JjID0gZWxlbWVudC50b0RhdGFVUkwoKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB7IHRlbXBsYXRlIH0gPSBvcHRpb25zO1xuICAgICAgICBpZiAodGVtcGxhdGUgJiYgaXNTdHJpbmcodGVtcGxhdGUpKSB7XG4gICAgICAgICAgICBjb25zdCB0ZW1wbGF0ZUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZW1wbGF0ZScpO1xuICAgICAgICAgICAgY29uc3QgZG9jdW1lbnRGcmFnbWVudCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcbiAgICAgICAgICAgIHRlbXBsYXRlRWxlbWVudC5pbm5lckhUTUwgPSB0ZW1wbGF0ZS5yZXBsYWNlKFJFR0VYUF9CTE9DS0VEX1RBR1MsICcmbHQ7JDEmZ3Q7Jyk7XG4gICAgICAgICAgICBkb2N1bWVudEZyYWdtZW50LmFwcGVuZENoaWxkKHRlbXBsYXRlRWxlbWVudC5jb250ZW50KTtcbiAgICAgICAgICAgIEFycmF5LmZyb20oZG9jdW1lbnRGcmFnbWVudC5xdWVyeVNlbGVjdG9yQWxsKENST1BQRVJfSU1BR0UpKS5mb3JFYWNoKChpbWFnZSkgPT4ge1xuICAgICAgICAgICAgICAgIGltYWdlLnNldEF0dHJpYnV0ZSgnc3JjJywgc3JjKTtcbiAgICAgICAgICAgICAgICBpbWFnZS5zZXRBdHRyaWJ1dGUoJ2FsdCcsIGVsZW1lbnQuYWx0IHx8ICdUaGUgaW1hZ2UgdG8gY3JvcCcpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoZWxlbWVudC5wYXJlbnRFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgICAgIGNvbnRhaW5lci5pbnNlcnRCZWZvcmUoZG9jdW1lbnRGcmFnbWVudCwgZWxlbWVudC5uZXh0U2libGluZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoZG9jdW1lbnRGcmFnbWVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgZ2V0Q3JvcHBlckNhbnZhcygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoQ1JPUFBFUl9DQU5WQVMpO1xuICAgIH1cbiAgICBnZXRDcm9wcGVySW1hZ2UoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKENST1BQRVJfSU1BR0UpO1xuICAgIH1cbiAgICBnZXRDcm9wcGVyU2VsZWN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcihDUk9QUEVSX1NFTEVDVElPTik7XG4gICAgfVxuICAgIGdldENyb3BwZXJTZWxlY3Rpb25zKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvckFsbChDUk9QUEVSX1NFTEVDVElPTik7XG4gICAgfVxufVxuQ3JvcHBlci52ZXJzaW9uID0gJzIuMC4wJztcblxuZXhwb3J0IHsgREVGQVVMVF9URU1QTEFURSwgQ3JvcHBlciBhcyBkZWZhdWx0IH07XG4iLCAiLy8gI3JlZ2lvbiBJbXBvcnRzXG4vLyAjcmVnaW9uIFhJTUFcbmltcG9ydCB7IGdldEpRdWVyeSB9IGZyb20gXCJAZGUteGltYS9mYy1mb3JtLXJlbmRlcmVyXCI7XG4vLyAjZW5kcmVnaW9uIFhJTUFcbi8vICNyZWdpb24gQ3JvcHBlclxuaW1wb3J0IENyb3BwZXIgZnJvbSBcImNyb3BwZXJqc1wiO1xuLy8gI2VuZHJlZ2lvbiBDcm9wcGVyXG4vLyAjcmVnaW9uIFhEQkNcbmltcG9ydCB7IERCQyB9IGZyb20gXCJ4ZGJjL3NyYy9EQkNcIjtcbmltcG9ydCB7IElGIH0gZnJvbSBcInhkYmMvc3JjL0RCQy9JRi5qc1wiO1xuaW1wb3J0IHsgVFlQRSB9IGZyb20gXCJ4ZGJjL3NyYy9EQkMvVFlQRS5qc1wiO1xuaW1wb3J0IHsgUkVHRVggfSBmcm9tIFwieGRiYy9zcmMvREJDL1JFR0VYXCI7XG5pbXBvcnQgeyBJTlNUQU5DRSB9IGZyb20gXCJ4ZGJjL3NyYy9EQkMvSU5TVEFOQ0UuanNcIjtcbmltcG9ydCB7IE9SIH0gZnJvbSBcInhkYmMvc3JjL0RCQy9PUi5qc1wiO1xuLy8gI2VuZHJlZ2lvbiBYREJDXG5pbXBvcnQgeyBDb2RCaUVycm9yIH0gZnJvbSBcIi4uL2dsb2JhbC1zY29wZS5qc1wiO1xuLy8gI2VuZHJlZ2lvbiBJbXBvcnRzXG4vKipcbiAqIFByb3ZpZGVzIHRoZSB7QGxpbmsgTWVkaWFfSW1hZ2VfQ3JvcHBlci5mdW5jdGlvbmFsaXR5IH0uXG4gKlxuICogQHJlbWFya3NcbiAqIE1haW50YWluZXI6IENhbGxhcmksIFNhbHZhdG9yZSAoU2FsdmF0b3JlLkNhbGxhcmlAQW5zYmFjaC5kZSkgKi9cbi8vIGJpb21lLWlnbm9yZSBsaW50L2NvbXBsZXhpdHkvbm9TdGF0aWNPbmx5Q2xhc3M6IFByb2FjdGl2ZSBEZXNpZ24uXG5leHBvcnQgY2xhc3MgTWVkaWFfSW1hZ2VfQ3JvcHBlciB7XG4gIC8qKiBTdG9yZXMgb2Z0ZW4gdXNlZCB7QGxpbmsgUmVnRXhwIH1zLiAqL1xuICBwdWJsaWMgc3RhdGljIHN0ZEV4cDogeyBba2V5OiBzdHJpbmddOiBSZWdFeHAgfSA9IHtcbiAgICBhc3BlY3RSYXRpbzogL15cXGQrXFxzKlxcL1xccypcXGQrJC8sXG4gIH07XG4gIC8qKlxuICAgKiBUaGlzIGZ1bmN0aW9uYWxpdHkgcHJvdmlkZXMgYW4gaW1hZ2UtY3JvcHBlciAoaHR0cHM6Ly9mZW5neXVhbmNoZW4uZ2l0aHViLmlvL2Nyb3BwZXJqcy8pLlxuICAgKiBJbiBvcmRlciBmb3IgaXQgdG8gd29yayBhbHNvIGluIHJlcGV0aXRpdmUgQ29udGFpbmVycyBcImRhdGEtY2ItZnVuY1wiIGdvdHRhIGJlIHNldCBvbiB0aGUgZmlyc3Qgb3V0ZXJtb3N0IGNvbnRhaW5lclxuICAgKiB0aGF0IGlzIG5vdCByZXBldGl0aXZlIGl0c2VsZiBidXQgbGllcyB3aXRoIHRoZSByZXBldGl0aXZlIG9uZS5cbiAgICpcbiAgICogQ29uZmlnIFBhcmFtZXRlcjpcbiAgICogIC0gQ29udGFpbmVyOiAgICAgICAgVGhlIENTUy1TZWxlY3RvciBvZiB0aGUge0BsaW5rIEhUTUxEaXZFbGVtZW50IH0gdGhhdCBzaGFsbCBjb250YWluIHRoZSBDcm9wcGVyLVVJLlxuICAgKiAgLSBUYXJnZXQ6ICAgICAgICAgICBUaGUgQ1NTLVNlbGVjdG9yIG9mIHRoZSB7QGxpbmsgSFRNTEltYWdlRWxlbWVudCB9IHRoYXQgd2lsbCBjb250YWluIHRoZSBjcm9wcGVkIGltYWdlIGFmdGVyXG4gICAqICAgICAgICAgICAgICAgICAgICAgIGNsaWNraW5nIHRoZSBcIlVwZGF0ZXJcIi5cbiAgICogIC0gRmlsZTogICAgICAgICAgICAgVGhlIENTUy1TZWxlY3RvciBvZiB0aGUge0BsaW5rIEhUTUxJbnB1dEVsZW1lbnQgfSBvZiB0eXBlID0gXCJmaWxlXCIgd2hlcmUgdG8gc2VsZWN0IHRoZSBpbWFnZSB0byBjcm9wLlxuICAgKiAgLSBVcGRhdGVyOiAgICAgICAgICBUaGUgQ1NTLVNlbGVjdG9yIHNwZWNpZnlpbmcgdGhlIHtAbGluayBIVE1MQnV0dG9uRWxlbWVudCB9IHRoYXQsIG9uIGNsaWNrLCB3aWxsIGNhdXNlIGFuIHVwZGF0ZSBvZiB0aGUgXCJUYXJnZXRcIi5cbiAgICogIC0gSW1hZ2VVUkwgICAgICAgICAgVGhlIENTUy1TZWxlY3RvciBzcGVjaWZ5aW5nIHRoZSB7QGxpbmsgSFRNTElucHV0RWxlbWVudCB9IHRoYXQgc2hhbGwgcmVjZWl2ZSB0aGUgaW1hZ2UgZGF0YS5cbiAgICogIC0gQXNwZWN0UmF0aW86ICAgICAgVGhlIG9wdGlvbmFsIGNyb3BwZXIncyBhc3BlY3QtcmF0aW8gdG8gcmV0YWluIChlLmcuIDE2IC8gOSBvciA0IC8gMyApLlxuICAgKiAgICAgICAgICAgICAgICAgICAgICBTZXR0aW5nIHRoaXMgdmFsdWUgd2lsbCBtYWtlIHRoZSBjcm9wcGVyIG5vbi1yZXNpemFibGUuXG4gICAqICAtIE91dHB1dFdpZHRoICAgICAgIFRoZSB3aWR0aCBpbiBwaXhlbCBmb3IgY2FudmFzIHdoZXJlIHRoZSBjcm9wcGVkIGFyZWEgc2hhbGwgYmUgcmVmbGVjdGVkLlxuICAgKiAgICAgICAgICAgICAgICAgICAgICBJZiBwcm92aWRlZCBhcyBhIHN0cmluZyB0aGUgbWluaW11bSB2YWx1ZSBpcyAxMDAuIERlZmF1bHRzIHRvIDEwMDBweC5cbiAgICogIC0gQ1NTQ3JvcHBlckhhbmRsZSAgVGhlIENTUyB0aGF0IHNoYWxsIGJlIGFwcGxpZWQgb24gZWFjaCA8Y3JvcHBlci1oYW5kbGU+IChkZWZhdWx0cyB0byBiYWNrZ3JvdW5kLWNvbG9yOiBkYXJrb3JhbmdlIDspLlxuICAgKlxuICAgKiBAcGFyYW0gdG9Mb2FkIFByb3ZpZGVkIGJ5IHRoZSBDb2RCaS4gKi9cbiAgQERCQy5QYXJhbXZhbHVlUHJvdmlkZXJcbiAgcHVibGljIHN0YXRpYyBmdW5jdGlvbmFsaXR5KFxuICAgIEBUWVBFLlBSRShcInN0cmluZ1wiLCBcImNvbnRhaW5lciA6OiB0YXJnZXQgOjogZmlsZSA6OiB1cGRhdGVyIDo6IGltYWdldXJsIDo6IGNzc2Nyb3BwZXJoYW5kbGVcIilcbiAgICBAUkVHRVguUFJFKFJFR0VYLnN0ZEV4cC5jc3NTZWxlY3RvciwgXCJjb250YWluZXJcIilcbiAgICBAUkVHRVguUFJFKFJFR0VYLnN0ZEV4cC5jc3NTZWxlY3RvciwgXCJ0YXJnZXRcIilcbiAgICBAUkVHRVguUFJFKFJFR0VYLnN0ZEV4cC5jc3NTZWxlY3RvciwgXCJmaWxlXCIpXG4gICAgQFJFR0VYLlBSRShSRUdFWC5zdGRFeHAuY3NzU2VsZWN0b3IsIFwidXBkYXRlclwiKVxuICAgIEBSRUdFWC5QUkUoUkVHRVguc3RkRXhwLmNzc1NlbGVjdG9yLCBcImltYWdldXJsXCIpXG4gICAgQFRZUEUuUFJFKFwic3RyaW5nIHwgbnVtYmVyXCIsIFwiYXNwZWN0cmF0aW8gOjogb3V0cHV0d2lkdGhcIilcbiAgICBASUYuUFJFKG5ldyBUWVBFKFwic3RyaW5nXCIpLCBuZXcgUkVHRVgoTWVkaWFfSW1hZ2VfQ3JvcHBlci5zdGRFeHAuYXNwZWN0UmF0aW8pLCBcImFzcGVjdHJhdGlvXCIpXG4gICAgQElGLlBSRShuZXcgVFlQRShcInN0cmluZ1wiKSwgbmV3IFJFR0VYKC9bMS05XVsxLTldWzEtOV0rLyksIFwib3V0cHV0d2lkdGhcIilcbiAgICB0b0xvYWQ6IHsgW2tleTogc3RyaW5nXTogdW5rbm93biB9LFxuXG4gICAgQE9SLlBSRShcbiAgICAgIFtuZXcgSU5TVEFOQ0UoSFRNTERpdkVsZW1lbnQpLCBuZXcgSU5TVEFOQ0UoSFRNTEZpZWxkU2V0RWxlbWVudCldLFxuICAgICAgdW5kZWZpbmVkLFxuICAgICAgXCJJcyBpdCBub3QgYSA8ZGl2PiBvciA8ZmllbGRzZXQ+IHRoYXQgaXMgdGFnZ2VkIHdpdGggdGhpcyBmdW5jdGlvbmFsaXR5P1wiLFxuICAgIClcbiAgICB0b1Byb2Nlc3M6IEVsZW1lbnQsXG4gICk6IHZvaWQge1xuICAgIGNvbnN0IGNvbnRhaW5lcjogSFRNTEVsZW1lbnQgfCB1bmRlZmluZWQgPSB0b1Byb2Nlc3MucXVlcnlTZWxlY3Rvcih0b0xvYWQuY29udGFpbmVyIGFzIHN0cmluZyk7XG4gICAgLy8gRG8gbm90aGluZyBpZiB0aGVyZSdzIG5vIGltYWdlIGNvbnRhaW5lci5cbiAgICBpZiAoY29udGFpbmVyID09PSB1bmRlZmluZWQpIHtcbiAgICAgIG5ldyBDb2RCaUVycm9yKGBUaGUgY29udGFpbmVyIFwiJHt0b0xvYWQuY29udGFpbmVyfVwiIGlzIG5vdCBhdmFpbGFibGVgKTtcbiAgICB9XG5cbiAgICBjb25zdCBmaWxlSW5wdXQ6IEhUTUxFbGVtZW50IHwgdW5kZWZpbmVkID0gdG9Qcm9jZXNzLnF1ZXJ5U2VsZWN0b3IodG9Mb2FkLmZpbGUgYXMgc3RyaW5nKTtcbiAgICAvLyBEbyBub3RoaW5nIGlmIFwiZmlsZVwiLUNvZEJpLVBhcmFtZXRlciBkb2Vzbid0IHNlbGVjdCBhIFwiSFRNTElucHV0RWxlbWVudFwiLlxuICAgIGlmIChcbiAgICAgIGZpbGVJbnB1dCA9PT0gdW5kZWZpbmVkIHx8XG4gICAgICBmaWxlSW5wdXQgPT09IG51bGwgfHxcbiAgICAgIGZpbGVJbnB1dC50YWdOYW1lLnRvTG93ZXJDYXNlKCkgIT09IFwiaW5wdXRcIiB8fFxuICAgICAgZmlsZUlucHV0LmdldEF0dHJpYnV0ZShcInR5cGVcIikgIT09IFwiZmlsZVwiXG4gICAgKSB7XG4gICAgICBuZXcgQ29kQmlFcnJvcihgVGhlIGZpbGUgcGlja2VyIFwiJHt0b0xvYWQuZmlsZX1cIiBpcyBlaXRoZXIgbm90IGF2YWlsYWJsZSBvciBub3QgYSBmaWxlIHBpY2tlcmApO1xuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbGV0IGNyb3BwZXI6IENyb3BwZXIgfCB1bmRlZmluZWQ7XG4gICAgLy8gI3JlZ2lvbiBSZWdpc3RlciBldmVudCB0byBwcm9wZXJseSByZWFjdCBvbiBmaWxlIGNoYW5nZXMuXG4gICAgZmlsZUlucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgKGV2ZW50OiBFdmVudCk6IHVuZGVmaW5lZCA9PiB7XG4gICAgICBpZiAoKGZpbGVJbnB1dCBhcyBIVE1MSW5wdXRFbGVtZW50KS5maWxlcyAmJiAoZmlsZUlucHV0IGFzIEhUTUxJbnB1dEVsZW1lbnQpLmZpbGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgY29uc3QgZmlsZTogRmlsZSB8IHVuZGVmaW5lZCA9IChmaWxlSW5wdXQgYXMgSFRNTElucHV0RWxlbWVudCkuZmlsZXNbMF07XG5cbiAgICAgICAgaWYgKGZpbGUpIHtcbiAgICAgICAgICBjb250YWluZXIuaW5uZXJIVE1MID0gXCJcIjsgLy8gQ2xlYXIgcHJldmlvdXMgY3JvcHBlciwgaWYgZXhpc3RlbnQuXG5cbiAgICAgICAgICBjb25zdCBuZXdJbWFnZTogSFRNTEltYWdlRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbWdcIik7XG4gICAgICAgICAgbmV3SW1hZ2Uuc3JjID0gd2luZG93LlVSTC5jcmVhdGVPYmplY3RVUkwoZmlsZSk7XG5cbiAgICAgICAgICBuZXdJbWFnZS5zZXRBdHRyaWJ1dGUoXG4gICAgICAgICAgICBcInN0eWxlXCIsXG4gICAgICAgICAgICBgd2lkdGggOiAke3RvTG9hZC5tYXh3aWR0aCA/IHRvTG9hZC5tYXh3aWR0aCA6IDUwMH1weCA7IGhlaWdodCA6ICR7dG9Mb2FkLm1heGhlaWdodCA/IHRvTG9hZC5tYXhoZWlnaHQgOiA1MDB9cHggO2AsXG4gICAgICAgICAgKTtcbiAgICAgICAgICBuZXdJbWFnZS5zZXRBdHRyaWJ1dGUoXCJkYXRhLW5hbWVcIiwgXCJDb2RCaV9NZWRpYV9JbWFnZWNyb3BwZXJfQmlsZFwiKTtcbiAgICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQobmV3SW1hZ2UpO1xuICAgICAgICAgIC8vICNyZWdpb24gQ2FsY3VsYXRlIGFzcGVjdCByYXRpb24sIGlmIHByb3ZpZGVkXG4gICAgICAgICAgY29uc3QgYXNwZWN0UmF0aW86IG51bWJlciB8IHVuZGVmaW5lZCA9XG4gICAgICAgICAgICB0b0xvYWQuYXNwZWN0cmF0aW8gJiYgdHlwZW9mIHRvTG9hZC5hc3BlY3RyYXRpbyA9PT0gXCJzdHJpbmdcIiAmJiB0b0xvYWQuYXNwZWN0cmF0aW8uaW5kZXhPZihcIi9cIikgIT09IC0xXG4gICAgICAgICAgICAgID8gZGl2aWRlKHRvTG9hZC5hc3BlY3RyYXRpbyBhcyBzdHJpbmcpXG4gICAgICAgICAgICAgIDogdW5kZWZpbmVkO1xuICAgICAgICAgIC8vICNlbmRyZWdpb24gQ2FsY3VsYXRlIGFzcGVjdCByYXRpb24sIGlmIHByb3ZpZGVkXG4gICAgICAgICAgY29uc3QgcmVjdENvbnRhaW5lciA9IG5ld0ltYWdlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG4gICAgICAgICAgdG9Mb2FkLmNzc2Nyb3BwZXJoYW5kbGUgPSB0b0xvYWQuY3NzY3JvcHBlcmhhbmRsZVxuICAgICAgICAgICAgPyB0b0xvYWQuY3NzY3JvcHBlcmhhbmRsZVxuICAgICAgICAgICAgOiBcImJhY2tncm91bmQtY29sb3I6IGRhcmtvcmFuZ2UgO1wiO1xuICAgICAgICAgIGNyb3BwZXIgPSBuZXcgQ3JvcHBlcihuZXdJbWFnZSwge1xuICAgICAgICAgICAgdGVtcGxhdGU6IGBcbiAgICAgICAgICAgICAgICA8Y3JvcHBlci1jYW52YXMgc3R5bGUgPSBcImhlaWdodCA6IDEwMCUgOyB3aWR0aCA6IDEwMCUgO1wiIGJhY2tncm91bmQgPlxuICAgICAgICAgICAgICAgICAgPGNyb3BwZXItaW1hZ2UgIGluaXRpYWwtY2VudGVyLXNpemUgPSBcImNvbnRhaW5cIiByb3RhdGFibGUgc2NhbGFibGUgc2tld2FibGUgdHJhbnNsYXRhYmxlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQHRyYW5zZm9ybSAgICAgICAgICA9IFwib25Dcm9wcGVySW1hZ2VUcmFuc2Zvcm1cIj5cbiAgICAgICAgICAgICAgICAgICAgPGNyb3BwZXItaGFuZGxlIGFjdGlvbiAgICAgID0gXCJtb3ZlXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZW1lLWNvbG9yID0gXCJyZ2JhKCAyNTUsIDI1NSwgMjU1LCAwLjM1IClcIj48L2Nyb3BwZXItaGFuZGxlPjwvY3JvcHBlci1pbWFnZT5cbiAgICAgICAgICAgICAgICAgIDxjcm9wcGVyLXNoYWRlIGhpZGRlbj48L2Nyb3BwZXItc2hhZGU+XG4gICAgICAgICAgICAgICAgICA8Y3JvcHBlci1zZWxlY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgd2lkdGggPSBcIjEwMFwiXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodCA9IFwiMTAwXCJcbiAgICAgICAgICAgICAgICAgICAgbW92YWJsZSAke2FzcGVjdFJhdGlvID8gXCJcIiA6IFwicmVzaXphYmxlIHpvb21hYmxlXCJ9PlxuICAgICAgICAgICAgICAgICAgICA8Y3JvcHBlci1ncmlkIHJvbGUgPSBcImdyaWRcIiBib3JkZXJlZCBjb3ZlcmVkPjwvY3JvcHBlci1ncmlkPlxuICAgICAgICAgICAgICAgICAgICA8Y3JvcHBlci1oYW5kbGUgYWN0aW9uICAgICAgPSBcIm1vdmVcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbWUtY29sb3IgPSBcInJnYmEoIDI1NSwgMjU1LCAyNTUsIDAuMzUgKVwiPjwvY3JvcHBlci1oYW5kbGU+XG4gICAgICAgICAgICAgICAgICAgICR7XG4gICAgICAgICAgICAgICAgICAgICAgYXNwZWN0UmF0aW9cbiAgICAgICAgICAgICAgICAgICAgICAgID8gXCJcIlxuICAgICAgICAgICAgICAgICAgICAgICAgOiBgXG4gICAgICAgICAgICAgICAgICAgICAgICA8Y3JvcHBlci1jcm9zc2hhaXIgY2VudGVyZWQ+PC9jcm9wcGVyLWNyb3NzaGFpcj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxjcm9wcGVyLWhhbmRsZSBhY3Rpb24gPSBcIm4tcmVzaXplXCIgICBzdHlsZSA9IFwiJHt0b0xvYWQuY3NzY3JvcHBlcmhhbmRsZX1cIj48L2Nyb3BwZXItaGFuZGxlPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGNyb3BwZXItaGFuZGxlIGFjdGlvbiA9IFwiZS1yZXNpemVcIiAgIHN0eWxlID0gXCIke3RvTG9hZC5jc3Njcm9wcGVyaGFuZGxlfVwiPjwvY3JvcHBlci1oYW5kbGU+XG4gICAgICAgICAgICAgICAgICAgICAgICA8Y3JvcHBlci1oYW5kbGUgYWN0aW9uID0gXCJzLXJlc2l6ZVwiICAgc3R5bGUgPSBcIiR7dG9Mb2FkLmNzc2Nyb3BwZXJoYW5kbGV9XCI+PC9jcm9wcGVyLWhhbmRsZT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxjcm9wcGVyLWhhbmRsZSBhY3Rpb24gPSBcInctcmVzaXplXCIgICBzdHlsZSA9IFwiJHt0b0xvYWQuY3NzY3JvcHBlcmhhbmRsZX1cIj48L2Nyb3BwZXItaGFuZGxlPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGNyb3BwZXItaGFuZGxlIGFjdGlvbiA9IFwibmUtcmVzaXplXCIgIHN0eWxlID0gXCIke3RvTG9hZC5jc3Njcm9wcGVyaGFuZGxlfVwiPjwvY3JvcHBlci1oYW5kbGU+XG4gICAgICAgICAgICAgICAgICAgICAgICA8Y3JvcHBlci1oYW5kbGUgYWN0aW9uID0gXCJudy1yZXNpemVcIiAgc3R5bGUgPSBcIiR7dG9Mb2FkLmNzc2Nyb3BwZXJoYW5kbGV9XCI+PC9jcm9wcGVyLWhhbmRsZT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxjcm9wcGVyLWhhbmRsZSBhY3Rpb24gPSBcInNlLXJlc2l6ZVwiICBzdHlsZSA9IFwiJHt0b0xvYWQuY3NzY3JvcHBlcmhhbmRsZX1cIj48L2Nyb3BwZXItaGFuZGxlPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGNyb3BwZXItaGFuZGxlIGFjdGlvbiA9IFwic3ctcmVzaXplXCIgIHN0eWxlID0gXCIke3RvTG9hZC5jc3Njcm9wcGVyaGFuZGxlfVwiPjwvY3JvcHBlci1oYW5kbGU+YFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIDwvY3JvcHBlci1oYW5kbGU+PC9jcm9wcGVyLXNlbGVjdGlvbj48L2Nyb3BwZXItY2FudmFzPmAsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgICAvLyAjZW5kcmVnaW9uIFJlZ2lzdGVyIGV2ZW50IHRvIHByb3Blcmx5IHJlYWN0IG9uIGZpbGUgY2hhbmdlcy5cbiAgICAvLyAjcmVnaW9uIFJlZ2lzdGVyIHByb3BlciBldmVudCB0byB1cGRhdGUgdGhlIFwidGFyZ2V0XCIuXG4gICAgZm9yIChjb25zdCB1cGRhdGVyIG9mIHRvUHJvY2Vzcy5wYXJlbnRFbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwodG9Mb2FkLnVwZGF0ZXIgYXMgc3RyaW5nKSkge1xuICAgICAgdXBkYXRlci5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGV2ZW50OiBFdmVudCk6IHVuZGVmaW5lZCA9PiB7XG4gICAgICAgIGlmIChjcm9wcGVyICYmIHRvTG9hZC50YXJnZXQgJiYgdHlwZW9mICh0b0xvYWQudGFyZ2V0ID09PSBcInN0cmluZ1wiKSkge1xuICAgICAgICAgIGNvbnN0IHRhcmdldCA9IHRvUHJvY2Vzcy5wYXJlbnRFbGVtZW50LnF1ZXJ5U2VsZWN0b3IodG9Mb2FkLnRhcmdldCBhcyBzdHJpbmcpO1xuICAgICAgICAgIGNvbnN0IGNhbnZhcyA9IGNyb3BwZXIuZ2V0Q3JvcHBlclNlbGVjdGlvbigpO1xuXG4gICAgICAgICAgaWYgKGNhbnZhcykge1xuICAgICAgICAgICAgY29uc3QgdGFyZ2V0Qm91bmRpbmdDbGllbnRSZWN0ID0gdGFyZ2V0LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coY2FudmFzLCBjYW52YXM/LmNsaWVudEhlaWdodCwgY2FudmFzPy5jbGllbnRIZWlnaHQsIHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvLCBcImNhbnZhc1wiKTtcbiAgICAgICAgICAgIGNhbnZhc1xuICAgICAgICAgICAgICAuJHRvQ2FudmFzKHtcbiAgICAgICAgICAgICAgICB3aWR0aDogdG9Mb2FkLm91dHB1dHdpZHRoID8gKHRvTG9hZC5vdXRwdXR3aWR0aCBhcyBudW1iZXIpIDogMTAwMCxcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgLnRoZW4oKGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQpID0+IHtcbiAgICAgICAgICAgICAgICB0YXJnZXQuc2V0QXR0cmlidXRlKFxuICAgICAgICAgICAgICAgICAgXCJ3aWR0aFwiLFxuICAgICAgICAgICAgICAgICAgKE51bWJlci5wYXJzZUludChjYW52YXM/LmdldEF0dHJpYnV0ZShcIndpZHRoXCIpKSAqIHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvICogNCB8fCAxKS50b1N0cmluZygpLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgdGFyZ2V0LnNldEF0dHJpYnV0ZShcbiAgICAgICAgICAgICAgICAgIFwid2lkdGhcIixcbiAgICAgICAgICAgICAgICAgIChOdW1iZXIucGFyc2VJbnQoY2FudmFzPy5nZXRBdHRyaWJ1dGUoXCJoZWlnaHRcIikpICogd2luZG93LmRldmljZVBpeGVsUmF0aW8gKiA0IHx8IDEpLnRvU3RyaW5nKCksXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBjb25zdCB1cmxJbWFnZSA9IGNhbnZhcy50b0RhdGFVUkwoXCJpbWFnZS9qcGVnXCIsIDEuMCk7XG5cbiAgICAgICAgICAgICAgICBpZiAodG9Mb2FkLmltYWdldXJsKSB7XG4gICAgICAgICAgICAgICAgICBjb25zdCBpbWFnZVVSTFJlY2VpdmVyID0gdG9Qcm9jZXNzLnF1ZXJ5U2VsZWN0b3IodG9Mb2FkLmltYWdldXJsIGFzIHN0cmluZyk7XG5cbiAgICAgICAgICAgICAgICAgIGlmIChpbWFnZVVSTFJlY2VpdmVyKSB7XG4gICAgICAgICAgICAgICAgICAgIChpbWFnZVVSTFJlY2VpdmVyIGFzIEhUTUxJbnB1dEVsZW1lbnQpLnZhbHVlID0gdXJsSW1hZ2U7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGFyZ2V0Py5zZXRBdHRyaWJ1dGUoXCJzcmNcIiwgdXJsSW1hZ2UpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICAvLyAjZW5kcmVnaW9uIFJlZ2lzdGVyIHByb3BlciBldmVudCB0byB1cGRhdGUgdGhlIFwidGFyZ2V0XCIuXG4gIH1cbn1cblxud2luZG93LmNvZGJpLnJlZ2lzdGVyRnVuY3Rpb25hbGl0eShcIk1lZGlhLkltYWdlLkNyb3BwZXJcIiwgTWVkaWFfSW1hZ2VfQ3JvcHBlci5mdW5jdGlvbmFsaXR5LmJpbmQoTWVkaWFfSW1hZ2VfQ3JvcHBlcikpOyAvLyBJbml0aWFsaXphdGlvblxuLy8gI3JlZ2lvbiBIZWxwZXJcbmNvbnN0IGRpdmlkZSA9IChkaXZpc2lvblN0cmluZyk6IG51bWJlciA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3QgcGFydHMgPSBkaXZpc2lvblN0cmluZy5zcGxpdCgvXFxzKlxcL1xccyovKTtcblxuICAgIGlmIChwYXJ0cy5sZW5ndGggIT09IDIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIklucHV0IGZvcm1hdCBpcyBpbmNvcnJlY3QuIEV4cGVjdGVkICdudW1iZXIgLyBudW1iZXInLlwiKTtcbiAgICB9XG5cbiAgICBjb25zdCBudW1lcmF0b3IgPSBOdW1iZXIucGFyc2VGbG9hdChwYXJ0c1swXSk7XG4gICAgY29uc3QgZGVub21pbmF0b3IgPSBOdW1iZXIucGFyc2VGbG9hdChwYXJ0c1sxXSk7XG5cbiAgICBpZiAoXG4gICAgICBOdW1iZXIuaXNOYU4obnVtZXJhdG9yKSB8fFxuICAgICAgTnVtYmVyLmlzTmFOKGRlbm9taW5hdG9yKSB8fFxuICAgICAgIU51bWJlci5pc0Zpbml0ZShudW1lcmF0b3IpIHx8XG4gICAgICAhTnVtYmVyLmlzRmluaXRlKGRlbm9taW5hdG9yKVxuICAgICkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVGhlIG51bWVyYXRvciBvciBkZW5vbWluYXRvciBpcyBub3QgYSB2YWxpZCBudW1iZXIuXCIpO1xuICAgIH1cblxuICAgIGlmIChkZW5vbWluYXRvciA9PT0gMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGRpdmlkZSBieSB6ZXJvLlwiKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbnVtZXJhdG9yIC8gZGVub21pbmF0b3I7XG4gIH0gY2F0Y2ggKFgpIHtcbiAgICB0aHJvdyBuZXcgQ29kQmlFcnJvcihgRXJyb3I6ICR7KFggYXMgRXJyb3IpLm1lc3NhZ2V9YCk7XG4gIH1cbn07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
