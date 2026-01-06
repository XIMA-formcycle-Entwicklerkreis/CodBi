import {
  CodBiError
} from "./chunk-QGX5JPGQ.js";
import {
  REGEX
} from "./chunk-QZ34KSY4.js";
import {
  require_dist
} from "./chunk-2R3WETV4.js";
import {
  DBC
} from "./chunk-7Z6CEUOW.js";
import {
  __decorateClass,
  __decorateParam,
  __toESM
} from "./chunk-KWZW6WYL.js";

// src/js/Functionalities/media.image.cropper.ts
var import_fc_form_renderer = __toESM(require_dist(), 1);

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
  types.trim().split(REGEXP_SPACES).forEach((type) => {
    target.removeEventListener(type, listener, options);
  });
}
function on(target, types, listener, options) {
  types.trim().split(REGEXP_SPACES).forEach((type) => {
    target.addEventListener(type, listener, options);
  });
}
function once(target, types, listener, options) {
  on(target, types, listener, Object.assign(Object.assign({}, options), { once: true }));
}
var defaultEventOptions = {
  bubbles: true,
  cancelable: true,
  composed: true
};
function emit(target, type, detail, options) {
  return target.dispatchEvent(new CustomEvent(type, Object.assign(Object.assign(Object.assign({}, defaultEventOptions), { detail }), options)));
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
    top: box.top + (WINDOW.pageYOffset - documentElement.clientTop)
  };
}
var REGEXP_ANGLE_UNIT = /deg|g?rad|turn$/i;
function toAngleInRadian(angle) {
  const value = parseFloat(angle) || 0;
  if (value !== 0) {
    const [unit = "rad"] = String(angle).match(REGEXP_ANGLE_UNIT) || [];
    switch (unit.toLowerCase()) {
      case "deg":
        return value / 360 * (Math.PI * 2);
      case "grad":
        return value / 400 * (Math.PI * 2);
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
    if (type === SIZE_ADJUSTMENT_TYPE_CONTAIN && adjustedWidth > width || type === SIZE_ADJUSTMENT_TYPE_COVER && adjustedWidth < width) {
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
    height
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
    b1 * e2 + d1 * f2 + f1
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
var supportsAdoptedStyleSheets = WINDOW.document && Array.isArray(WINDOW.document.adoptedStyleSheets) && "replaceSync" in WINDOW.CSSStyleSheet.prototype;
var CropperElement = class extends HTMLElement {
  get $sharedStyle() {
    return `${this.themeColor ? `:host{--theme-color: ${this.themeColor};}` : ""}${style}`;
  }
  constructor() {
    var _a, _b;
    super();
    this.shadowRootMode = DEFAULT_SHADOW_ROOT_MODE;
    this.slottable = true;
    const name = (_b = (_a = Object.getPrototypeOf(this)) === null || _a === void 0 ? void 0 : _a.constructor) === null || _b === void 0 ? void 0 : _b.$name;
    if (name) {
      tagNames.set(name, this.tagName.toLowerCase());
    }
  }
  static get observedAttributes() {
    return [
      "shadow-root-mode",
      "slottable",
      "theme-color"
    ];
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
        }
      });
    });
    const shadow = this.attachShadow({
      mode: this.shadowRootMode || DEFAULT_SHADOW_ROOT_MODE
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
    return super.observedAttributes.concat([
      "background",
      "disabled",
      "scale-step"
    ]);
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
        capture: true
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
        capture: true
      });
      this.$onWheel = null;
    }
  }
  $handlePointerDown(event) {
    const { buttons, button, type } = event;
    if (this.disabled || // Handle pointer or mouse event, and ignore touch event
    (type === "pointerdown" && event.pointerType === "mouse" || type === "mousedown") && // No primary button (Usually the left button)
    (isNumber(buttons) && buttons !== 1 || isNumber(button) && button !== 0 || event.ctrlKey)) {
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
          endY: pageY
        });
      });
    } else {
      const { pointerId = 0, pageX, pageY } = event;
      $pointers.set(pointerId, {
        startX: pageX,
        startY: pageY,
        endX: pageX,
        endY: pageY
      });
    }
    if ($pointers.size > 1) {
      action = ACTION_TRANSFORM;
    } else if (isElement(event.target)) {
      action = event.target.action || event.target.getAttribute(ATTRIBUTE_ACTION) || "";
    }
    if (this.$emit(EVENT_ACTION_START, {
      action,
      relatedEvent: event
    }) === false) {
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
    if (this.$emit(EVENT_ACTION_MOVE, {
      action: $action,
      relatedEvent: event
    }) === false) {
      return;
    }
    event.preventDefault();
    if (event.changedTouches) {
      Array.from(event.changedTouches).forEach(({ identifier, pageX, pageY }) => {
        const pointer = $pointers.get(identifier);
        if (pointer) {
          Object.assign(pointer, {
            endX: pageX,
            endY: pageY
          });
        }
      });
    } else {
      const { pointerId = 0, pageX, pageY } = event;
      const pointer = $pointers.get(pointerId);
      if (pointer) {
        Object.assign(pointer, {
          endX: pageX,
          endY: pageY
        });
      }
    }
    const detail = {
      action: $action,
      relatedEvent: event
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
        cancelable: false
      });
    }
  }
  $handlePointerUp(event) {
    const { $action, $pointers } = this;
    if (this.disabled || $action === ACTION_NONE) {
      return;
    }
    if (this.$emit(EVENT_ACTION_END, {
      action: $action,
      relatedEvent: event
    }) === false) {
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
    this.$emit(EVENT_ACTION, {
      action: ACTION_SCALE,
      scale,
      relatedEvent: event
    }, {
      cancelable: false
    });
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
          height: options.height
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
      cropperImage.$ready().then((image) => {
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
      }).catch(reject);
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
  "srcset"
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
      "translatable"
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
        position: "absolute"
      });
      this.$onCanvasActionStart = (event) => {
        var _a, _b;
        this.$actionStartTarget = (_b = (_a = event.detail) === null || _a === void 0 ? void 0 : _a.relatedEvent) === null || _b === void 0 ? void 0 : _b.target;
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
      height: $image.naturalHeight
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
            if (!$selection || $selection.hidden || !$selection.movable || $selection.dynamic || !(this.$actionStartTarget && $selection.contains(this.$actionStartTarget))) {
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
              if (!$selection || !$selection.zoomable || $selection.zoomable && $selection.dynamic) {
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
            const [scaleX, skewY, skewX, scaleY] = [
              cos * scale,
              sin * scale,
              -sin * scale,
              cos * scale
            ];
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
              this.$transform(scaleX, skewY, skewX, scaleY, translateX * (1 - scaleX) + translateY * skewX, translateY * (1 - scaleY) + translateX * skewY);
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
        this.$transform(scaleX, skewY, skewX, scaleY, translateX * (1 - scaleX) - translateY * skewX, translateY * (1 - scaleY) - translateX * skewY);
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
        if (this.$emit(EVENT_TRANSFORM, {
          matrix: newMatrix,
          oldMatrix
        }) === false) {
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
    return super.observedAttributes.concat([
      "height",
      "width",
      "x",
      "y"
    ]);
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
          if ($selection.hidden || x === 0 && y === 0 && width === 0 && height === 0) {
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
    if (!isNumber(x) || !isNumber(y) || !isNumber(width) || !isNumber(height) || x === this.x && y === this.y && width === this.width && height === this.height) {
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
      outlineWidth: WINDOW.innerWidth
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
    return super.observedAttributes.concat([
      "action",
      "plain"
    ]);
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
      height: 0
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
      "zoomable"
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
                height: this.height
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
        transform: `translate(${this.x}px, ${this.y}px)`
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
        height: this.height
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
            height: activeSelection.height
          });
        }
      } else {
        this.$clear();
      }
    }
  }
  $handleActionStart(event) {
    var _a, _b;
    const relatedTarget = (_b = (_a = event.detail) === null || _a === void 0 ? void 0 : _a.relatedEvent) === null || _b === void 0 ? void 0 : _b.target;
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
        height: this.height
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
    if (!action || this.hidden && action !== ACTION_SELECT || this.multiple && !this.active && action !== ACTION_SCALE) {
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
          (this.multiple && !this.hidden ? this.$createSelection() : this).$change(detail.startX - offset.left, detail.startY - offset.top, Math.abs(moveX), Math.abs(moveY), aspectRatio);
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
        if (this.movable && (this.dynamic || this.$actionStartTarget && this.contains(this.$actionStartTarget))) {
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
    if (this.hidden || !this.keyboard || this.multiple && !this.active || event.defaultPrevented) {
      return;
    }
    const { activeElement } = document;
    if (activeElement && (["INPUT", "TEXTAREA"].includes(activeElement.tagName) || ["true", "plaintext-only"].includes(activeElement.contentEditable))) {
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
    if (this.$changing || !isNumber(x) || !isNumber(y) || !isNumber(width) || !isNumber(height) || width < 0 || height < 0) {
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
    if (x === this.x && y === this.y && width === this.width && height === this.height && Object.is(aspectRatio, this.aspectRatio) && !_force) {
      return this;
    }
    if (this.hidden) {
      this.hidden = false;
    }
    if (this.$emit(EVENT_CHANGE, {
      x,
      y,
      width,
      height
    }) === false) {
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
      height: this.height
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
          height: options.height
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
      cropperImage.$ready().then((image) => {
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
      }).catch(reject);
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
    return super.observedAttributes.concat([
      "bordered",
      "columns",
      "covered",
      "rows"
    ]);
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
    return super.observedAttributes.concat([
      "centered"
    ]);
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
    return super.observedAttributes.concat([
      "resize",
      "selection"
    ]);
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
    if (!selection || selection.x === 0 && selection.y === 0 && selection.width === 0 && selection.height === 0) {
      selection = {
        x: 0,
        y: 0,
        width: $canvas.offsetWidth,
        height: $canvas.offsetHeight
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
      this.$transformImageByOffset(matrix !== null && matrix !== void 0 ? matrix : this.$sourceImage.$getTransform(), -x, -y);
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
          height: image.naturalHeight * $scale
        });
      });
      $image.$setTransform(a, b, c, d, newE * $scale, newF * $scale);
    }
  }
};
CropperViewer.$name = CROPPER_VIEWER;
CropperViewer.$version = "2.0.0";

// ../../node_modules/cropperjs/dist/cropper.esm.raw.js
var DEFAULT_TEMPLATE = '<cropper-canvas background><cropper-image rotatable scalable skewable translatable></cropper-image><cropper-shade hidden></cropper-shade><cropper-handle action="select" plain></cropper-handle><cropper-selection initial-coverage="0.5" movable resizable><cropper-grid role="grid" bordered covered></cropper-grid><cropper-crosshair centered></cropper-crosshair><cropper-handle action="move" theme-color="rgba(255, 255, 255, 0.35)"></cropper-handle><cropper-handle action="n-resize"></cropper-handle><cropper-handle action="e-resize"></cropper-handle><cropper-handle action="s-resize"></cropper-handle><cropper-handle action="w-resize"></cropper-handle><cropper-handle action="ne-resize"></cropper-handle><cropper-handle action="nw-resize"></cropper-handle><cropper-handle action="se-resize"></cropper-handle><cropper-handle action="sw-resize"></cropper-handle></cropper-selection></cropper-canvas>';
var REGEXP_ALLOWED_ELEMENTS = /^img|canvas$/;
var REGEXP_BLOCKED_TAGS = /<(\/?(?:script|style)[^>]*)>/gi;
var DEFAULT_OPTIONS = {
  template: DEFAULT_TEMPLATE
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
  static functionality(toLoad, toProcess) {
    const container = toProcess.querySelector(toLoad.container);
    if (container === void 0) {
      new CodBiError(`The container "${toLoad.container}" is not available`);
    }
    const fileInput = toProcess.querySelector(toLoad.file);
    if (fileInput === void 0 || fileInput === null || fileInput.tagName.toLowerCase() !== "input" || fileInput.getAttribute("type") !== "file") {
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
            `width : ${toLoad.maxwidth ? toLoad.maxwidth : 500}px ; height : ${toLoad.maxheight ? toLoad.maxheight : 500}px ;`
          );
          newImage.setAttribute("data-name", "CodBi_Media_Imagecropper_Bild");
          container.appendChild(newImage);
          const aspectRatio = toLoad.aspectratio && typeof toLoad.aspectratio === "string" && toLoad.aspectratio.indexOf("/") !== -1 ? divide(toLoad.aspectratio) : void 0;
          const rectContainer = newImage.getBoundingClientRect();
          toLoad.csscropperhandle = toLoad.csscropperhandle ? toLoad.csscropperhandle : "background-color: darkorange ;";
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
                    ${aspectRatio ? "" : `
                        <cropper-crosshair centered></cropper-crosshair>
                        <cropper-handle action = "n-resize"   style = "${toLoad.csscropperhandle}"></cropper-handle>
                        <cropper-handle action = "e-resize"   style = "${toLoad.csscropperhandle}"></cropper-handle>
                        <cropper-handle action = "s-resize"   style = "${toLoad.csscropperhandle}"></cropper-handle>
                        <cropper-handle action = "w-resize"   style = "${toLoad.csscropperhandle}"></cropper-handle>
                        <cropper-handle action = "ne-resize"  style = "${toLoad.csscropperhandle}"></cropper-handle>
                        <cropper-handle action = "nw-resize"  style = "${toLoad.csscropperhandle}"></cropper-handle>
                        <cropper-handle action = "se-resize"  style = "${toLoad.csscropperhandle}"></cropper-handle>
                        <cropper-handle action = "sw-resize"  style = "${toLoad.csscropperhandle}"></cropper-handle>`}
                    </cropper-handle></cropper-selection></cropper-canvas>`
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
            canvas.$toCanvas({
              width: toLoad.outputwidth ? toLoad.outputwidth : 1e3
            }).then((canvas2) => {
              target.setAttribute(
                "width",
                (Number.parseInt(canvas2?.getAttribute("width")) * window.devicePixelRatio * 4 || 1).toString()
              );
              target.setAttribute(
                "width",
                (Number.parseInt(canvas2?.getAttribute("height")) * window.devicePixelRatio * 4 || 1).toString()
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
  static {
    // #region Initialization
    /**
     * States whether this {@link Media_Image_Cropper } was successfully registered
     * via {@link CodbiGlobal.registerFunctionality } with the CodBi and performs the registration upon class usage.*/
    this.registered = (() => {
      return window.codbi.registerFunctionality("Media.Image.Cropper", _Media_Image_Cropper.functionality);
    })();
  }
  // #endregion Initialization
};
__decorateClass([
  DBC.ParamvalueProvider,
  __decorateParam(0, REGEX.PRE(REGEX.stdExp.cssSelector, "container")),
  __decorateParam(0, REGEX.PRE(REGEX.stdExp.cssSelector, "target")),
  __decorateParam(0, REGEX.PRE(REGEX.stdExp.cssSelector, "file")),
  __decorateParam(0, REGEX.PRE(REGEX.stdExp.cssSelector, "updater"))
], _Media_Image_Cropper, "functionality", 1);
var Media_Image_Cropper = _Media_Image_Cropper;
var divide = (divisionString) => {
  try {
    const parts = divisionString.split(/\s*\/\s*/);
    if (parts.length !== 2) {
      throw new Error("Input format is incorrect. Expected 'number / number'.");
    }
    const numerator = Number.parseFloat(parts[0]);
    const denominator = Number.parseFloat(parts[1]);
    if (Number.isNaN(numerator) || Number.isNaN(denominator) || !Number.isFinite(numerator) || !Number.isFinite(denominator)) {
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
export {
  Media_Image_Cropper
};
/*! Bundled license information:

cropperjs/dist/cropper.esm.raw.js:
  (*! Cropper.js v2.0.0 | (c) 2015-present Chen Fengyuan | MIT *)
*/
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vd2ViL3BhY2thZ2VzL2Zvcm0vc3JjL2pzL0Z1bmN0aW9uYWxpdGllcy9tZWRpYS5pbWFnZS5jcm9wcGVyLnRzIiwgIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3dlYi9ub2RlX21vZHVsZXMvQGNyb3BwZXIvdXRpbHMvZGlzdC91dGlscy5lc20ucmF3LmpzIiwgIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3dlYi9ub2RlX21vZHVsZXMvQGNyb3BwZXIvZWxlbWVudC9kaXN0L2VsZW1lbnQuZXNtLnJhdy5qcyIsICIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvbWFpbi93ZWIvbm9kZV9tb2R1bGVzL0Bjcm9wcGVyL2VsZW1lbnQtY2FudmFzL2Rpc3QvZWxlbWVudC1jYW52YXMuZXNtLnJhdy5qcyIsICIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvbWFpbi93ZWIvbm9kZV9tb2R1bGVzL0Bjcm9wcGVyL2VsZW1lbnQtaW1hZ2UvZGlzdC9lbGVtZW50LWltYWdlLmVzbS5yYXcuanMiLCAiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vd2ViL25vZGVfbW9kdWxlcy9AY3JvcHBlci9lbGVtZW50LXNoYWRlL2Rpc3QvZWxlbWVudC1zaGFkZS5lc20ucmF3LmpzIiwgIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3dlYi9ub2RlX21vZHVsZXMvQGNyb3BwZXIvZWxlbWVudC1oYW5kbGUvZGlzdC9lbGVtZW50LWhhbmRsZS5lc20ucmF3LmpzIiwgIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3dlYi9ub2RlX21vZHVsZXMvQGNyb3BwZXIvZWxlbWVudC1zZWxlY3Rpb24vZGlzdC9lbGVtZW50LXNlbGVjdGlvbi5lc20ucmF3LmpzIiwgIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3dlYi9ub2RlX21vZHVsZXMvQGNyb3BwZXIvZWxlbWVudC1ncmlkL2Rpc3QvZWxlbWVudC1ncmlkLmVzbS5yYXcuanMiLCAiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vd2ViL25vZGVfbW9kdWxlcy9AY3JvcHBlci9lbGVtZW50LWNyb3NzaGFpci9kaXN0L2VsZW1lbnQtY3Jvc3NoYWlyLmVzbS5yYXcuanMiLCAiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vd2ViL25vZGVfbW9kdWxlcy9AY3JvcHBlci9lbGVtZW50LXZpZXdlci9kaXN0L2VsZW1lbnQtdmlld2VyLmVzbS5yYXcuanMiLCAiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vd2ViL25vZGVfbW9kdWxlcy9jcm9wcGVyanMvZGlzdC9jcm9wcGVyLmVzbS5yYXcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8vICNyZWdpb24gSW1wb3J0c1xuLy8gI3JlZ2lvbiBYSU1BXG5pbXBvcnQgeyBnZXRKUXVlcnkgfSBmcm9tIFwiQGRlLXhpbWEvZmMtZm9ybS1yZW5kZXJlclwiO1xuLy8gI2VuZHJlZ2lvbiBYSU1BXG4vLyAjcmVnaW9uIENyb3BwZXJcbmltcG9ydCBDcm9wcGVyIGZyb20gXCJjcm9wcGVyanNcIjtcbi8vICNlbmRyZWdpb24gQ3JvcHBlclxuLy8gI3JlZ2lvbiBYREJDXG5pbXBvcnQgeyBEQkMgfSBmcm9tIFwieGRiYy9zcmMvREJDXCI7XG5pbXBvcnQgeyBSRUdFWCB9IGZyb20gXCJ4ZGJjL3NyYy9EQkMvUkVHRVhcIjtcbi8vICNlbmRyZWdpb24gWERCQ1xuaW1wb3J0IHsgQ29kQmlFcnJvciB9IGZyb20gXCIuLi9nbG9iYWwtc2NvcGUuanNcIjtcbi8vICNlbmRyZWdpb24gSW1wb3J0c1xuLyoqXG4gKiBQcm92aWRlcyB0aGUge0BsaW5rIE1lZGlhX0ltYWdlX0Nyb3BwZXIuZnVuY3Rpb25hbGl0eSB9LlxuICpcbiAqIEByZW1hcmtzXG4gKiBNYWludGFpbmVyOiBDYWxsYXJpLCBTYWx2YXRvcmUgKFNhbHZhdG9yZS5DYWxsYXJpQEFuc2JhY2guZGUpICovXG4vLyBiaW9tZS1pZ25vcmUgbGludC9jb21wbGV4aXR5L25vU3RhdGljT25seUNsYXNzOiBQcm9hY3RpdmUgRGVzaWduLlxuZXhwb3J0IGNsYXNzIE1lZGlhX0ltYWdlX0Nyb3BwZXIge1xuICAvKipcbiAgICogVGhpcyBmdW5jdGlvbmFsaXR5IHByb3ZpZGVzIGFuIGltYWdlY3JvcHBlciAoaHR0cHM6Ly9mZW5neXVhbmNoZW4uZ2l0aHViLmlvL2Nyb3BwZXJqcy8pLlxuICAgKiBJbiBvcmRlciBmb3IgaXQgdG8gd29yayBhbHNvIGluIHJlcGV0aXRpdmUgQ29udGFpbmVycyBcImRhdGEtY2ItZnVuY1wiIGdvdHRhIGJlIHNldCBvbiB0aGUgZmlyc3Qgb3V0ZXJtb3N0IGNvbnRhaW5lclxuICAgKiB0aGF0IGlzIG5vdCByZXBldGl0aXZlIGl0c2VsZiBidXQgbGllcyB3aXRoIHRoZSByZXBldGl0aXZlIG9uZS5cbiAgICpcbiAgICogQ29uZmlnIFBhcmFtZXRlcjpcbiAgICogIC0gQ29udGFpbmVyOiAgICAgICAgVGhlIHtAbGluayBIVE1MRGl2RWxlbWVudCB9IHRoYXQgc2hhbGwgY29udGFpbiB0aGUgQ3JvcHBlci1VSS5cbiAgICogIC0gVGFyZ2V0OiAgICAgICAgICAgVGhlIHtAbGluayBIVE1MSW1hZ2VFbGVtZW50IH0gdGhhdCB3aWxsIGNvbnRhaW4gdGhlIGNyb3BwZWQgaW1hZ2Ugd2hlblxuICAgKiAgICAgICAgICAgICAgICAgICAgICBjbGlja2luZyB0aGUgXCJVcGRhdGVyXCIuXG4gICAqICAtIEZpbGU6ICAgICAgICAgICAgIFRoZSB7QGxpbmsgSFRNTElucHV0RWxlbWVudCB9IG9mIHR5cGUgPSBcImZpbGVcIiB3aGVyZSB0byBzZWxlY3QgdGhlIGltYWdlIHRvIGNyb3AuXG4gICAqICAtIFVwZGF0ZXI6ICAgICAgICAgIFRoZSBDU1MtU2VsZWN0b3Igc3BlY2lmeWluZyB0aGUge0BsaW5rIEhUTUxCdXR0b25FbGVtZW50IH0gdGhhdCwgb24gY2xpY2ssIHdpbGwgY2F1c2UgYW4gdXBkYXRlIG9mIHRoZSBcIlRhcmdldFwiLlxuICAgKiAgLSBJbWFnZVVSTCAgICAgICAgICBUaGUgQ1NTLVNlbGVjdG9yIHNwZWNpZnlpbmcgdGhlIHtAbGluayBIVE1MSW5wdXRFbGVtZW50IH0gdGhhdCBzaGFsbCByZWNlaXZlIHRoZSBpbWFnZSBkYXRhLlxuICAgKiAgLSBBc3BlY3RSYXRpbzogICAgICBUaGUgb3B0aW9uYWwgY3JvcHBlcidzIGFzcGVjdHJhdGlvIHRvIHJldGFpbiAoZS5nLiAxNiAvIDkgb3IgNCAvIDMgKS5cbiAgICogICAgICAgICAgICAgICAgICAgICAgU2V0dGluZyB0aGlzIHZhbHVlIHdpbGwgbWFrZSB0aGUgY3JvcHBlciBub24tcmVzaXphYmxlLlxuICAgKiAgLSBPdXRwdXRXaWR0aCAgICAgICBUaGUgd2lkdGggaW4gcGl4ZWwgZm9yIGNhbnZhcyB3aGVyZSB0aGUgY3JvcHBlZCBhcmVhIHNoYWxsIGJlIHJlZmxlY3RlZC5cbiAgICogIC0gQ1NTQ3JvcHBlckhhbmRsZSAgVGhlIENTUyB0aGF0IHNoYWxsIGJlIGFwcGxpZWQgb24gZWFjaCA8Y3JvcHBlci1oYW5kbGU+IChkZWZhdWx0cyB0byBiYWNrZ3JvdW5kLWNvbG9yOiBkYXJrb3JhbmdlIDspLlxuICAgKlxuICAgKiBAcGFyYW0gdG9Mb2FkIFByb3ZpZGVkIGJ5IHRoZSBDb2RCaS4gKi9cbiAgQERCQy5QYXJhbXZhbHVlUHJvdmlkZXJcbiAgcHVibGljIHN0YXRpYyBmdW5jdGlvbmFsaXR5KFxuICAgIEBSRUdFWC5QUkUoUkVHRVguc3RkRXhwLmNzc1NlbGVjdG9yLCBcImNvbnRhaW5lclwiKVxuICAgIEBSRUdFWC5QUkUoUkVHRVguc3RkRXhwLmNzc1NlbGVjdG9yLCBcInRhcmdldFwiKVxuICAgIEBSRUdFWC5QUkUoUkVHRVguc3RkRXhwLmNzc1NlbGVjdG9yLCBcImZpbGVcIilcbiAgICBAUkVHRVguUFJFKFJFR0VYLnN0ZEV4cC5jc3NTZWxlY3RvciwgXCJ1cGRhdGVyXCIpXG4gICAgdG9Mb2FkOiB7IFtrZXk6IHN0cmluZ106IHVua25vd24gfSxcbiAgICB0b1Byb2Nlc3M6IEVsZW1lbnQsXG4gICk6IHZvaWQge1xuICAgIGNvbnN0IGNvbnRhaW5lcjogSFRNTEVsZW1lbnQgfCB1bmRlZmluZWQgPSB0b1Byb2Nlc3MucXVlcnlTZWxlY3Rvcih0b0xvYWQuY29udGFpbmVyIGFzIHN0cmluZyk7XG4gICAgLy8gRG8gbm90aGluZyBpZiB0aGVyZSdzIG5vIGltYWdlIGNvbnRhaW5lci5cbiAgICBpZiAoY29udGFpbmVyID09PSB1bmRlZmluZWQpIHtcbiAgICAgIG5ldyBDb2RCaUVycm9yKGBUaGUgY29udGFpbmVyIFwiJHt0b0xvYWQuY29udGFpbmVyfVwiIGlzIG5vdCBhdmFpbGFibGVgKTtcbiAgICB9XG5cbiAgICBjb25zdCBmaWxlSW5wdXQ6IEhUTUxFbGVtZW50IHwgdW5kZWZpbmVkID0gdG9Qcm9jZXNzLnF1ZXJ5U2VsZWN0b3IodG9Mb2FkLmZpbGUgYXMgc3RyaW5nKTtcbiAgICAvLyBEbyBub3RoaW5nIGlmIFwiZmlsZVwiLUNvZEJpLVBhcmFtZXRlciBkb2Vzbid0IHNlbGVjdCBhIFwiSFRNTElucHV0RWxlbWVudFwiLlxuICAgIGlmIChcbiAgICAgIGZpbGVJbnB1dCA9PT0gdW5kZWZpbmVkIHx8XG4gICAgICBmaWxlSW5wdXQgPT09IG51bGwgfHxcbiAgICAgIGZpbGVJbnB1dC50YWdOYW1lLnRvTG93ZXJDYXNlKCkgIT09IFwiaW5wdXRcIiB8fFxuICAgICAgZmlsZUlucHV0LmdldEF0dHJpYnV0ZShcInR5cGVcIikgIT09IFwiZmlsZVwiXG4gICAgKSB7XG4gICAgICBuZXcgQ29kQmlFcnJvcihgVGhlIGZpbGUgcGlja2VyIFwiJHt0b0xvYWQuZmlsZX1cIiBpcyBlaXRoZXIgbm90IGF2YWlsYWJsZSBvciBub3QgYSBmaWxlIHBpY2tlcmApO1xuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbGV0IGNyb3BwZXI6IENyb3BwZXIgfCB1bmRlZmluZWQ7XG4gICAgLy8gI3JlZ2lvbiBSZWdpc3RlciBldmVudCB0byBwcm9wZXJseSByZWFjdCBvbiBmaWxlIGNoYW5nZXMuXG4gICAgLy8gYmlvbWUtaWdub3JlIGxpbnQvc3R5bGUvbm9Ob25OdWxsQXNzZXJ0aW9uOiBXYXMgY2hlY2tlZCBvbiBsaW5lIDQ3LlxuICAgIGZpbGVJbnB1dCEuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoZXZlbnQ6IEV2ZW50KTogdW5kZWZpbmVkID0+IHtcbiAgICAgIGlmICgoZmlsZUlucHV0IGFzIEhUTUxJbnB1dEVsZW1lbnQpLmZpbGVzICYmIChmaWxlSW5wdXQgYXMgSFRNTElucHV0RWxlbWVudCkuZmlsZXMubGVuZ3RoID4gMCkge1xuICAgICAgICBjb25zdCBmaWxlOiBGaWxlIHwgdW5kZWZpbmVkID0gKGZpbGVJbnB1dCBhcyBIVE1MSW5wdXRFbGVtZW50KS5maWxlc1swXTtcblxuICAgICAgICBpZiAoZmlsZSkge1xuICAgICAgICAgIGNvbnRhaW5lci5pbm5lckhUTUwgPSBcIlwiOyAvLyBDbGVhciBwcmV2aW91cyBjcm9wcGVyLCBpZiBleGlzdGVudC5cblxuICAgICAgICAgIGNvbnN0IG5ld0ltYWdlOiBIVE1MSW1hZ2VFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImltZ1wiKTtcbiAgICAgICAgICBuZXdJbWFnZS5zcmMgPSB3aW5kb3cuVVJMLmNyZWF0ZU9iamVjdFVSTChmaWxlKTtcblxuICAgICAgICAgIG5ld0ltYWdlLnNldEF0dHJpYnV0ZShcbiAgICAgICAgICAgIFwic3R5bGVcIixcbiAgICAgICAgICAgIGB3aWR0aCA6ICR7dG9Mb2FkLm1heHdpZHRoID8gdG9Mb2FkLm1heHdpZHRoIDogNTAwfXB4IDsgaGVpZ2h0IDogJHt0b0xvYWQubWF4aGVpZ2h0ID8gdG9Mb2FkLm1heGhlaWdodCA6IDUwMH1weCA7YCxcbiAgICAgICAgICApO1xuICAgICAgICAgIG5ld0ltYWdlLnNldEF0dHJpYnV0ZShcImRhdGEtbmFtZVwiLCBcIkNvZEJpX01lZGlhX0ltYWdlY3JvcHBlcl9CaWxkXCIpO1xuICAgICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChuZXdJbWFnZSk7XG4gICAgICAgICAgLy8gI3JlZ2lvbiBDYWxjdWxhdGUgYXNwZWN0IHJhdGlvbiwgaWYgcHJvdmlkZWRcbiAgICAgICAgICBjb25zdCBhc3BlY3RSYXRpbzogbnVtYmVyIHwgdW5kZWZpbmVkID1cbiAgICAgICAgICAgIHRvTG9hZC5hc3BlY3RyYXRpbyAmJiB0eXBlb2YgdG9Mb2FkLmFzcGVjdHJhdGlvID09PSBcInN0cmluZ1wiICYmIHRvTG9hZC5hc3BlY3RyYXRpby5pbmRleE9mKFwiL1wiKSAhPT0gLTFcbiAgICAgICAgICAgICAgPyBkaXZpZGUodG9Mb2FkLmFzcGVjdHJhdGlvIGFzIHN0cmluZylcbiAgICAgICAgICAgICAgOiB1bmRlZmluZWQ7XG4gICAgICAgICAgLy8gI2VuZHJlZ2lvbiBDYWxjdWxhdGUgYXNwZWN0IHJhdGlvbiwgaWYgcHJvdmlkZWRcbiAgICAgICAgICBjb25zdCByZWN0Q29udGFpbmVyID0gbmV3SW1hZ2UuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cbiAgICAgICAgICB0b0xvYWQuY3NzY3JvcHBlcmhhbmRsZSA9IHRvTG9hZC5jc3Njcm9wcGVyaGFuZGxlXG4gICAgICAgICAgICA/IHRvTG9hZC5jc3Njcm9wcGVyaGFuZGxlXG4gICAgICAgICAgICA6IFwiYmFja2dyb3VuZC1jb2xvcjogZGFya29yYW5nZSA7XCI7XG4gICAgICAgICAgY3JvcHBlciA9IG5ldyBDcm9wcGVyKG5ld0ltYWdlLCB7XG4gICAgICAgICAgICB0ZW1wbGF0ZTogYFxuICAgICAgICAgICAgICAgIDxjcm9wcGVyLWNhbnZhcyBzdHlsZSA9IFwiaGVpZ2h0IDogMTAwJSA7IHdpZHRoIDogMTAwJSA7XCIgYmFja2dyb3VuZCA+XG4gICAgICAgICAgICAgICAgICA8Y3JvcHBlci1pbWFnZSAgaW5pdGlhbC1jZW50ZXItc2l6ZSA9IFwiY29udGFpblwiIHJvdGF0YWJsZSBzY2FsYWJsZSBza2V3YWJsZSB0cmFuc2xhdGFibGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBAdHJhbnNmb3JtICAgICAgICAgID0gXCJvbkNyb3BwZXJJbWFnZVRyYW5zZm9ybVwiPlxuICAgICAgICAgICAgICAgICAgICA8Y3JvcHBlci1oYW5kbGUgYWN0aW9uICAgICAgPSBcIm1vdmVcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlbWUtY29sb3IgPSBcInJnYmEoIDI1NSwgMjU1LCAyNTUsIDAuMzUgKVwiPjwvY3JvcHBlci1oYW5kbGU+PC9jcm9wcGVyLWltYWdlPlxuICAgICAgICAgICAgICAgICAgPGNyb3BwZXItc2hhZGUgaGlkZGVuPjwvY3JvcHBlci1zaGFkZT5cbiAgICAgICAgICAgICAgICAgIDxjcm9wcGVyLXNlbGVjdGlvblxuICAgICAgICAgICAgICAgICAgICB3aWR0aCA9IFwiMTAwXCJcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0ID0gXCIxMDBcIlxuICAgICAgICAgICAgICAgICAgICBtb3ZhYmxlICR7YXNwZWN0UmF0aW8gPyBcIlwiIDogXCJyZXNpemFibGUgem9vbWFibGVcIn0+XG4gICAgICAgICAgICAgICAgICAgIDxjcm9wcGVyLWdyaWQgcm9sZSA9IFwiZ3JpZFwiIGJvcmRlcmVkIGNvdmVyZWQ+PC9jcm9wcGVyLWdyaWQ+XG4gICAgICAgICAgICAgICAgICAgIDxjcm9wcGVyLWhhbmRsZSBhY3Rpb24gICAgICA9IFwibW92ZVwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVtZS1jb2xvciA9IFwicmdiYSggMjU1LCAyNTUsIDI1NSwgMC4zNSApXCI+PC9jcm9wcGVyLWhhbmRsZT5cbiAgICAgICAgICAgICAgICAgICAgJHtcbiAgICAgICAgICAgICAgICAgICAgICBhc3BlY3RSYXRpb1xuICAgICAgICAgICAgICAgICAgICAgICAgPyBcIlwiXG4gICAgICAgICAgICAgICAgICAgICAgICA6IGBcbiAgICAgICAgICAgICAgICAgICAgICAgIDxjcm9wcGVyLWNyb3NzaGFpciBjZW50ZXJlZD48L2Nyb3BwZXItY3Jvc3NoYWlyPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGNyb3BwZXItaGFuZGxlIGFjdGlvbiA9IFwibi1yZXNpemVcIiAgIHN0eWxlID0gXCIke3RvTG9hZC5jc3Njcm9wcGVyaGFuZGxlfVwiPjwvY3JvcHBlci1oYW5kbGU+XG4gICAgICAgICAgICAgICAgICAgICAgICA8Y3JvcHBlci1oYW5kbGUgYWN0aW9uID0gXCJlLXJlc2l6ZVwiICAgc3R5bGUgPSBcIiR7dG9Mb2FkLmNzc2Nyb3BwZXJoYW5kbGV9XCI+PC9jcm9wcGVyLWhhbmRsZT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxjcm9wcGVyLWhhbmRsZSBhY3Rpb24gPSBcInMtcmVzaXplXCIgICBzdHlsZSA9IFwiJHt0b0xvYWQuY3NzY3JvcHBlcmhhbmRsZX1cIj48L2Nyb3BwZXItaGFuZGxlPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGNyb3BwZXItaGFuZGxlIGFjdGlvbiA9IFwidy1yZXNpemVcIiAgIHN0eWxlID0gXCIke3RvTG9hZC5jc3Njcm9wcGVyaGFuZGxlfVwiPjwvY3JvcHBlci1oYW5kbGU+XG4gICAgICAgICAgICAgICAgICAgICAgICA8Y3JvcHBlci1oYW5kbGUgYWN0aW9uID0gXCJuZS1yZXNpemVcIiAgc3R5bGUgPSBcIiR7dG9Mb2FkLmNzc2Nyb3BwZXJoYW5kbGV9XCI+PC9jcm9wcGVyLWhhbmRsZT5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxjcm9wcGVyLWhhbmRsZSBhY3Rpb24gPSBcIm53LXJlc2l6ZVwiICBzdHlsZSA9IFwiJHt0b0xvYWQuY3NzY3JvcHBlcmhhbmRsZX1cIj48L2Nyb3BwZXItaGFuZGxlPlxuICAgICAgICAgICAgICAgICAgICAgICAgPGNyb3BwZXItaGFuZGxlIGFjdGlvbiA9IFwic2UtcmVzaXplXCIgIHN0eWxlID0gXCIke3RvTG9hZC5jc3Njcm9wcGVyaGFuZGxlfVwiPjwvY3JvcHBlci1oYW5kbGU+XG4gICAgICAgICAgICAgICAgICAgICAgICA8Y3JvcHBlci1oYW5kbGUgYWN0aW9uID0gXCJzdy1yZXNpemVcIiAgc3R5bGUgPSBcIiR7dG9Mb2FkLmNzc2Nyb3BwZXJoYW5kbGV9XCI+PC9jcm9wcGVyLWhhbmRsZT5gXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgPC9jcm9wcGVyLWhhbmRsZT48L2Nyb3BwZXItc2VsZWN0aW9uPjwvY3JvcHBlci1jYW52YXM+YCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgIC8vICNlbmRyZWdpb24gUmVnaXN0ZXIgZXZlbnQgdG8gcHJvcGVybHkgcmVhY3Qgb24gZmlsZSBjaGFuZ2VzLlxuICAgIC8vICNyZWdpb24gUmVnaXN0ZXIgcHJvcGVyIGV2ZW50IHRvIHVwZGF0ZSB0aGUgXCJ0YXJnZXRcIi5cbiAgICBmb3IgKGNvbnN0IHVwZGF0ZXIgb2YgdG9Qcm9jZXNzLnBhcmVudEVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCh0b0xvYWQudXBkYXRlciBhcyBzdHJpbmcpKSB7XG4gICAgICB1cGRhdGVyLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZXZlbnQ6IEV2ZW50KTogdW5kZWZpbmVkID0+IHtcbiAgICAgICAgaWYgKGNyb3BwZXIgJiYgdG9Mb2FkLnRhcmdldCAmJiB0eXBlb2YgKHRvTG9hZC50YXJnZXQgPT09IFwic3RyaW5nXCIpKSB7XG4gICAgICAgICAgY29uc3QgdGFyZ2V0ID0gdG9Qcm9jZXNzLnBhcmVudEVsZW1lbnQucXVlcnlTZWxlY3Rvcih0b0xvYWQudGFyZ2V0IGFzIHN0cmluZyk7XG4gICAgICAgICAgY29uc3QgY2FudmFzID0gY3JvcHBlci5nZXRDcm9wcGVyU2VsZWN0aW9uKCk7XG5cbiAgICAgICAgICBpZiAoY2FudmFzKSB7XG4gICAgICAgICAgICBjb25zdCB0YXJnZXRCb3VuZGluZ0NsaWVudFJlY3QgPSB0YXJnZXQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhjYW52YXMsIGNhbnZhcz8uY2xpZW50SGVpZ2h0LCBjYW52YXM/LmNsaWVudEhlaWdodCwgd2luZG93LmRldmljZVBpeGVsUmF0aW8sIFwiY2FudmFzXCIpO1xuICAgICAgICAgICAgY2FudmFzXG4gICAgICAgICAgICAgIC4kdG9DYW52YXMoe1xuICAgICAgICAgICAgICAgIHdpZHRoOiB0b0xvYWQub3V0cHV0d2lkdGggPyAodG9Mb2FkLm91dHB1dHdpZHRoIGFzIG51bWJlcikgOiAxMDAwLFxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAudGhlbigoY2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudCkgPT4ge1xuICAgICAgICAgICAgICAgIHRhcmdldC5zZXRBdHRyaWJ1dGUoXG4gICAgICAgICAgICAgICAgICBcIndpZHRoXCIsXG4gICAgICAgICAgICAgICAgICAoTnVtYmVyLnBhcnNlSW50KGNhbnZhcz8uZ2V0QXR0cmlidXRlKFwid2lkdGhcIikpICogd2luZG93LmRldmljZVBpeGVsUmF0aW8gKiA0IHx8IDEpLnRvU3RyaW5nKCksXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB0YXJnZXQuc2V0QXR0cmlidXRlKFxuICAgICAgICAgICAgICAgICAgXCJ3aWR0aFwiLFxuICAgICAgICAgICAgICAgICAgKE51bWJlci5wYXJzZUludChjYW52YXM/LmdldEF0dHJpYnV0ZShcImhlaWdodFwiKSkgKiB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyAqIDQgfHwgMSkudG9TdHJpbmcoKSxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIGNvbnN0IHVybEltYWdlID0gY2FudmFzLnRvRGF0YVVSTChcImltYWdlL2pwZWdcIiwgMS4wKTtcblxuICAgICAgICAgICAgICAgIGlmICh0b0xvYWQuaW1hZ2V1cmwpIHtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGltYWdlVVJMUmVjZWl2ZXIgPSB0b1Byb2Nlc3MucXVlcnlTZWxlY3Rvcih0b0xvYWQuaW1hZ2V1cmwgYXMgc3RyaW5nKTtcblxuICAgICAgICAgICAgICAgICAgaWYgKGltYWdlVVJMUmVjZWl2ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgKGltYWdlVVJMUmVjZWl2ZXIgYXMgSFRNTElucHV0RWxlbWVudCkudmFsdWUgPSB1cmxJbWFnZTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0YXJnZXQ/LnNldEF0dHJpYnV0ZShcInNyY1wiLCB1cmxJbWFnZSk7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICAgIC8vICNlbmRyZWdpb24gUmVnaXN0ZXIgcHJvcGVyIGV2ZW50IHRvIHVwZGF0ZSB0aGUgXCJ0YXJnZXRcIi5cbiAgfVxuICAvLyAjcmVnaW9uIEluaXRpYWxpemF0aW9uXG4gIC8qKlxuICAgKiBTdGF0ZXMgd2hldGhlciB0aGlzIHtAbGluayBNZWRpYV9JbWFnZV9Dcm9wcGVyIH0gd2FzIHN1Y2Nlc3NmdWxseSByZWdpc3RlcmVkXG4gICAqIHZpYSB7QGxpbmsgQ29kYmlHbG9iYWwucmVnaXN0ZXJGdW5jdGlvbmFsaXR5IH0gd2l0aCB0aGUgQ29kQmkgYW5kIHBlcmZvcm1zIHRoZSByZWdpc3RyYXRpb24gdXBvbiBjbGFzcyB1c2FnZS4qL1xuICBwdWJsaWMgc3RhdGljIHJlZ2lzdGVyZWQ6IGJvb2xlYW4gPSAoKCkgPT4ge1xuICAgIHJldHVybiB3aW5kb3cuY29kYmkucmVnaXN0ZXJGdW5jdGlvbmFsaXR5KFwiTWVkaWEuSW1hZ2UuQ3JvcHBlclwiLCBNZWRpYV9JbWFnZV9Dcm9wcGVyLmZ1bmN0aW9uYWxpdHkpO1xuICB9KSgpO1xuICAvLyAjZW5kcmVnaW9uIEluaXRpYWxpemF0aW9uXG59XG4vLyAjcmVnaW9uIEhlbHBlclxuY29uc3QgZGl2aWRlID0gKGRpdmlzaW9uU3RyaW5nKTogbnVtYmVyID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBwYXJ0cyA9IGRpdmlzaW9uU3RyaW5nLnNwbGl0KC9cXHMqXFwvXFxzKi8pO1xuXG4gICAgaWYgKHBhcnRzLmxlbmd0aCAhPT0gMikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW5wdXQgZm9ybWF0IGlzIGluY29ycmVjdC4gRXhwZWN0ZWQgJ251bWJlciAvIG51bWJlcicuXCIpO1xuICAgIH1cblxuICAgIGNvbnN0IG51bWVyYXRvciA9IE51bWJlci5wYXJzZUZsb2F0KHBhcnRzWzBdKTtcbiAgICBjb25zdCBkZW5vbWluYXRvciA9IE51bWJlci5wYXJzZUZsb2F0KHBhcnRzWzFdKTtcblxuICAgIGlmIChcbiAgICAgIE51bWJlci5pc05hTihudW1lcmF0b3IpIHx8XG4gICAgICBOdW1iZXIuaXNOYU4oZGVub21pbmF0b3IpIHx8XG4gICAgICAhTnVtYmVyLmlzRmluaXRlKG51bWVyYXRvcikgfHxcbiAgICAgICFOdW1iZXIuaXNGaW5pdGUoZGVub21pbmF0b3IpXG4gICAgKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUaGUgbnVtZXJhdG9yIG9yIGRlbm9taW5hdG9yIGlzIG5vdCBhIHZhbGlkIG51bWJlci5cIik7XG4gICAgfVxuXG4gICAgaWYgKGRlbm9taW5hdG9yID09PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZGl2aWRlIGJ5IHplcm8uXCIpO1xuICAgIH1cblxuICAgIHJldHVybiBudW1lcmF0b3IgLyBkZW5vbWluYXRvcjtcbiAgfSBjYXRjaCAoWCkge1xuICAgIHRocm93IG5ldyBDb2RCaUVycm9yKGBFcnJvcjogJHsoWCBhcyBFcnJvcikubWVzc2FnZX1gKTtcbiAgfVxufTtcbi8vICNlbmRyZWdpb24gSGVscGVyXG4iLCAiY29uc3QgSVNfQlJPV1NFUiA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiB3aW5kb3cuZG9jdW1lbnQgIT09ICd1bmRlZmluZWQnO1xuY29uc3QgV0lORE9XID0gSVNfQlJPV1NFUiA/IHdpbmRvdyA6IHt9O1xuY29uc3QgSVNfVE9VQ0hfREVWSUNFID0gSVNfQlJPV1NFUiA/ICdvbnRvdWNoc3RhcnQnIGluIFdJTkRPVy5kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgOiBmYWxzZTtcbmNvbnN0IEhBU19QT0lOVEVSX0VWRU5UID0gSVNfQlJPV1NFUiA/ICdQb2ludGVyRXZlbnQnIGluIFdJTkRPVyA6IGZhbHNlO1xuY29uc3QgTkFNRVNQQUNFID0gJ2Nyb3BwZXInO1xuY29uc3QgQ1JPUFBFUl9DQU5WQVMgPSBgJHtOQU1FU1BBQ0V9LWNhbnZhc2A7XG5jb25zdCBDUk9QUEVSX0NST1NTSEFJUiA9IGAke05BTUVTUEFDRX0tY3Jvc3NoYWlyYDtcbmNvbnN0IENST1BQRVJfR0lSRCA9IGAke05BTUVTUEFDRX0tZ3JpZGA7XG5jb25zdCBDUk9QUEVSX0hBTkRMRSA9IGAke05BTUVTUEFDRX0taGFuZGxlYDtcbmNvbnN0IENST1BQRVJfSU1BR0UgPSBgJHtOQU1FU1BBQ0V9LWltYWdlYDtcbmNvbnN0IENST1BQRVJfU0VMRUNUSU9OID0gYCR7TkFNRVNQQUNFfS1zZWxlY3Rpb25gO1xuY29uc3QgQ1JPUFBFUl9TSEFERSA9IGAke05BTUVTUEFDRX0tc2hhZGVgO1xuY29uc3QgQ1JPUFBFUl9WSUVXRVIgPSBgJHtOQU1FU1BBQ0V9LXZpZXdlcmA7XG4vLyBBY3Rpb25zXG5jb25zdCBBQ1RJT05fU0VMRUNUID0gJ3NlbGVjdCc7XG5jb25zdCBBQ1RJT05fTU9WRSA9ICdtb3ZlJztcbmNvbnN0IEFDVElPTl9TQ0FMRSA9ICdzY2FsZSc7XG5jb25zdCBBQ1RJT05fUk9UQVRFID0gJ3JvdGF0ZSc7XG5jb25zdCBBQ1RJT05fVFJBTlNGT1JNID0gJ3RyYW5zZm9ybSc7XG5jb25zdCBBQ1RJT05fTk9ORSA9ICdub25lJztcbmNvbnN0IEFDVElPTl9SRVNJWkVfTk9SVEggPSAnbi1yZXNpemUnO1xuY29uc3QgQUNUSU9OX1JFU0laRV9FQVNUID0gJ2UtcmVzaXplJztcbmNvbnN0IEFDVElPTl9SRVNJWkVfU09VVEggPSAncy1yZXNpemUnO1xuY29uc3QgQUNUSU9OX1JFU0laRV9XRVNUID0gJ3ctcmVzaXplJztcbmNvbnN0IEFDVElPTl9SRVNJWkVfTk9SVEhFQVNUID0gJ25lLXJlc2l6ZSc7XG5jb25zdCBBQ1RJT05fUkVTSVpFX05PUlRIV0VTVCA9ICdudy1yZXNpemUnO1xuY29uc3QgQUNUSU9OX1JFU0laRV9TT1VUSEVBU1QgPSAnc2UtcmVzaXplJztcbmNvbnN0IEFDVElPTl9SRVNJWkVfU09VVEhXRVNUID0gJ3N3LXJlc2l6ZSc7XG4vLyBBdHRyaWJ1dGVzXG5jb25zdCBBVFRSSUJVVEVfQUNUSU9OID0gJ2FjdGlvbic7XG4vLyBOYXRpdmUgZXZlbnRzXG5jb25zdCBFVkVOVF9UT1VDSF9FTkQgPSBJU19UT1VDSF9ERVZJQ0UgPyAndG91Y2hlbmQgdG91Y2hjYW5jZWwnIDogJ21vdXNldXAnO1xuY29uc3QgRVZFTlRfVE9VQ0hfTU9WRSA9IElTX1RPVUNIX0RFVklDRSA/ICd0b3VjaG1vdmUnIDogJ21vdXNlbW92ZSc7XG5jb25zdCBFVkVOVF9UT1VDSF9TVEFSVCA9IElTX1RPVUNIX0RFVklDRSA/ICd0b3VjaHN0YXJ0JyA6ICdtb3VzZWRvd24nO1xuY29uc3QgRVZFTlRfUE9JTlRFUl9ET1dOID0gSEFTX1BPSU5URVJfRVZFTlQgPyAncG9pbnRlcmRvd24nIDogRVZFTlRfVE9VQ0hfU1RBUlQ7XG5jb25zdCBFVkVOVF9QT0lOVEVSX01PVkUgPSBIQVNfUE9JTlRFUl9FVkVOVCA/ICdwb2ludGVybW92ZScgOiBFVkVOVF9UT1VDSF9NT1ZFO1xuY29uc3QgRVZFTlRfUE9JTlRFUl9VUCA9IEhBU19QT0lOVEVSX0VWRU5UID8gJ3BvaW50ZXJ1cCBwb2ludGVyY2FuY2VsJyA6IEVWRU5UX1RPVUNIX0VORDtcbmNvbnN0IEVWRU5UX0VSUk9SID0gJ2Vycm9yJztcbmNvbnN0IEVWRU5UX0tFWURPV04gPSAna2V5ZG93bic7XG5jb25zdCBFVkVOVF9MT0FEID0gJ2xvYWQnO1xuY29uc3QgRVZFTlRfUkVTSVpFID0gJ3Jlc2l6ZSc7XG5jb25zdCBFVkVOVF9XSEVFTCA9ICd3aGVlbCc7XG4vLyBDdXN0b20gZXZlbnRzXG5jb25zdCBFVkVOVF9BQ1RJT04gPSAnYWN0aW9uJztcbmNvbnN0IEVWRU5UX0FDVElPTl9FTkQgPSAnYWN0aW9uZW5kJztcbmNvbnN0IEVWRU5UX0FDVElPTl9NT1ZFID0gJ2FjdGlvbm1vdmUnO1xuY29uc3QgRVZFTlRfQUNUSU9OX1NUQVJUID0gJ2FjdGlvbnN0YXJ0JztcbmNvbnN0IEVWRU5UX0NIQU5HRSA9ICdjaGFuZ2UnO1xuY29uc3QgRVZFTlRfVFJBTlNGT1JNID0gJ3RyYW5zZm9ybSc7XG5cbi8qKlxuICogQ2hlY2sgaWYgdGhlIGdpdmVuIHZhbHVlIGlzIGEgc3RyaW5nLlxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIGdpdmVuIHZhbHVlIGlzIGEgc3RyaW5nLCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGlzU3RyaW5nKHZhbHVlKSB7XG4gICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZyc7XG59XG4vKipcbiAqIENoZWNrIGlmIHRoZSBnaXZlbiB2YWx1ZSBpcyBub3QgYSBudW1iZXIuXG4gKi9cbmNvbnN0IGlzTmFOID0gTnVtYmVyLmlzTmFOIHx8IFdJTkRPVy5pc05hTjtcbi8qKlxuICogQ2hlY2sgaWYgdGhlIGdpdmVuIHZhbHVlIGlzIGEgbnVtYmVyLlxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIGdpdmVuIHZhbHVlIGlzIGEgbnVtYmVyLCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGlzTnVtYmVyKHZhbHVlKSB7XG4gICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicgJiYgIWlzTmFOKHZhbHVlKTtcbn1cbi8qKlxuICogQ2hlY2sgaWYgdGhlIGdpdmVuIHZhbHVlIGlzIGEgcG9zaXRpdmUgbnVtYmVyLlxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIGdpdmVuIHZhbHVlIGlzIGEgcG9zaXRpdmUgbnVtYmVyLCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGlzUG9zaXRpdmVOdW1iZXIodmFsdWUpIHtcbiAgICByZXR1cm4gaXNOdW1iZXIodmFsdWUpICYmIHZhbHVlID4gMCAmJiB2YWx1ZSA8IEluZmluaXR5O1xufVxuLyoqXG4gKiBDaGVjayBpZiB0aGUgZ2l2ZW4gdmFsdWUgaXMgdW5kZWZpbmVkLlxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIGdpdmVuIHZhbHVlIGlzIHVuZGVmaW5lZCwgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBpc1VuZGVmaW5lZCh2YWx1ZSkge1xuICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICd1bmRlZmluZWQnO1xufVxuLyoqXG4gKiBDaGVjayBpZiB0aGUgZ2l2ZW4gdmFsdWUgaXMgYW4gb2JqZWN0LlxuICogQHBhcmFtIHsqfSB2YWx1ZSAtIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgZ2l2ZW4gdmFsdWUgaXMgYW4gb2JqZWN0LCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGlzT2JqZWN0KHZhbHVlKSB7XG4gICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgIT09IG51bGw7XG59XG5jb25zdCB7IGhhc093blByb3BlcnR5IH0gPSBPYmplY3QucHJvdG90eXBlO1xuLyoqXG4gKiBDaGVjayBpZiB0aGUgZ2l2ZW4gdmFsdWUgaXMgYSBwbGFpbiBvYmplY3QuXG4gKiBAcGFyYW0geyp9IHZhbHVlIC0gVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHRoZSBnaXZlbiB2YWx1ZSBpcyBhIHBsYWluIG9iamVjdCwgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBpc1BsYWluT2JqZWN0KHZhbHVlKSB7XG4gICAgaWYgKCFpc09iamVjdCh2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBjb25zdCB7IGNvbnN0cnVjdG9yIH0gPSB2YWx1ZTtcbiAgICAgICAgY29uc3QgeyBwcm90b3R5cGUgfSA9IGNvbnN0cnVjdG9yO1xuICAgICAgICByZXR1cm4gY29uc3RydWN0b3IgJiYgcHJvdG90eXBlICYmIGhhc093blByb3BlcnR5LmNhbGwocHJvdG90eXBlLCAnaXNQcm90b3R5cGVPZicpO1xuICAgIH1cbiAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn1cbi8qKlxuICogQ2hlY2sgaWYgdGhlIGdpdmVuIHZhbHVlIGlzIGEgZnVuY3Rpb24uXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgZ2l2ZW4gdmFsdWUgaXMgYSBmdW5jdGlvbiwgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJztcbn1cbi8qKlxuICogQ2hlY2sgaWYgdGhlIGdpdmVuIG5vZGUgaXMgYW4gZWxlbWVudC5cbiAqIEBwYXJhbSB7Kn0gbm9kZSBUaGUgbm9kZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgZ2l2ZW4gbm9kZSBpcyBhbiBlbGVtZW50OyBvdGhlcndpc2UsIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGlzRWxlbWVudChub2RlKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBub2RlID09PSAnb2JqZWN0JyAmJiBub2RlICE9PSBudWxsICYmIG5vZGUubm9kZVR5cGUgPT09IDE7XG59XG5jb25zdCBSRUdFWFBfQ0FNRUxfQ0FTRSA9IC8oW2EtelxcZF0pKFtBLVpdKS9nO1xuLyoqXG4gKiBUcmFuc2Zvcm0gdGhlIGdpdmVuIHN0cmluZyBmcm9tIGNhbWVsQ2FzZSB0byBrZWJhYi1jYXNlLlxuICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlIFRoZSB2YWx1ZSB0byB0cmFuc2Zvcm0uXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBSZXR1cm5zIHRoZSB0cmFuc2Zvcm1lZCB2YWx1ZS5cbiAqL1xuZnVuY3Rpb24gdG9LZWJhYkNhc2UodmFsdWUpIHtcbiAgICByZXR1cm4gU3RyaW5nKHZhbHVlKS5yZXBsYWNlKFJFR0VYUF9DQU1FTF9DQVNFLCAnJDEtJDInKS50b0xvd2VyQ2FzZSgpO1xufVxuY29uc3QgUkVHRVhQX0tFQkFCX0NBU0UgPSAvLVtBLXpcXGRdL2c7XG4vKipcbiAqIFRyYW5zZm9ybSB0aGUgZ2l2ZW4gc3RyaW5nIGZyb20ga2ViYWItY2FzZSB0byBjYW1lbENhc2UuXG4gKiBAcGFyYW0ge3N0cmluZ30gdmFsdWUgVGhlIHZhbHVlIHRvIHRyYW5zZm9ybS5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IFJldHVybnMgdGhlIHRyYW5zZm9ybWVkIHZhbHVlLlxuICovXG5mdW5jdGlvbiB0b0NhbWVsQ2FzZSh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZS5yZXBsYWNlKFJFR0VYUF9LRUJBQl9DQVNFLCAoc3Vic3RyaW5nKSA9PiBzdWJzdHJpbmcuc2xpY2UoMSkudG9VcHBlckNhc2UoKSk7XG59XG5jb25zdCBSRUdFWFBfU1BBQ0VTID0gL1xcc1xccyovO1xuLyoqXG4gKiBSZW1vdmUgZXZlbnQgbGlzdGVuZXIgZnJvbSB0aGUgZXZlbnQgdGFyZ2V0LlxuICoge0BsaW5rIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9FdmVudFRhcmdldC9yZW1vdmVFdmVudExpc3RlbmVyfVxuICogQHBhcmFtIHtFdmVudFRhcmdldH0gdGFyZ2V0IFRoZSB0YXJnZXQgb2YgdGhlIGV2ZW50LlxuICogQHBhcmFtIHtzdHJpbmd9IHR5cGVzIFRoZSB0eXBlcyBvZiB0aGUgZXZlbnQuXG4gKiBAcGFyYW0ge0V2ZW50TGlzdGVuZXJPckV2ZW50TGlzdGVuZXJPYmplY3R9IGxpc3RlbmVyIFRoZSBsaXN0ZW5lciBvZiB0aGUgZXZlbnQuXG4gKiBAcGFyYW0ge0V2ZW50TGlzdGVuZXJPcHRpb25zfSBbb3B0aW9uc10gVGhlIG9wdGlvbnMgc3BlY2lmeSBjaGFyYWN0ZXJpc3RpY3MgYWJvdXQgdGhlIGV2ZW50IGxpc3RlbmVyLlxuICovXG5mdW5jdGlvbiBvZmYodGFyZ2V0LCB0eXBlcywgbGlzdGVuZXIsIG9wdGlvbnMpIHtcbiAgICB0eXBlcy50cmltKCkuc3BsaXQoUkVHRVhQX1NQQUNFUykuZm9yRWFjaCgodHlwZSkgPT4ge1xuICAgICAgICB0YXJnZXQucmVtb3ZlRXZlbnRMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lciwgb3B0aW9ucyk7XG4gICAgfSk7XG59XG4vKipcbiAqIEFkZCBldmVudCBsaXN0ZW5lciB0byB0aGUgZXZlbnQgdGFyZ2V0LlxuICoge0BsaW5rIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9FdmVudFRhcmdldC9hZGRFdmVudExpc3RlbmVyfVxuICogQHBhcmFtIHtFdmVudFRhcmdldH0gdGFyZ2V0IFRoZSB0YXJnZXQgb2YgdGhlIGV2ZW50LlxuICogQHBhcmFtIHtzdHJpbmd9IHR5cGVzIFRoZSB0eXBlcyBvZiB0aGUgZXZlbnQuXG4gKiBAcGFyYW0ge0V2ZW50TGlzdGVuZXJPckV2ZW50TGlzdGVuZXJPYmplY3R9IGxpc3RlbmVyIFRoZSBsaXN0ZW5lciBvZiB0aGUgZXZlbnQuXG4gKiBAcGFyYW0ge0FkZEV2ZW50TGlzdGVuZXJPcHRpb25zfSBbb3B0aW9uc10gVGhlIG9wdGlvbnMgc3BlY2lmeSBjaGFyYWN0ZXJpc3RpY3MgYWJvdXQgdGhlIGV2ZW50IGxpc3RlbmVyLlxuICovXG5mdW5jdGlvbiBvbih0YXJnZXQsIHR5cGVzLCBsaXN0ZW5lciwgb3B0aW9ucykge1xuICAgIHR5cGVzLnRyaW0oKS5zcGxpdChSRUdFWFBfU1BBQ0VTKS5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgICAgIHRhcmdldC5hZGRFdmVudExpc3RlbmVyKHR5cGUsIGxpc3RlbmVyLCBvcHRpb25zKTtcbiAgICB9KTtcbn1cbi8qKlxuICogQWRkIG9uY2UgZXZlbnQgbGlzdGVuZXIgdG8gdGhlIGV2ZW50IHRhcmdldC5cbiAqIEBwYXJhbSB7RXZlbnRUYXJnZXR9IHRhcmdldCBUaGUgdGFyZ2V0IG9mIHRoZSBldmVudC5cbiAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlcyBUaGUgdHlwZXMgb2YgdGhlIGV2ZW50LlxuICogQHBhcmFtIHtFdmVudExpc3RlbmVyT3JFdmVudExpc3RlbmVyT2JqZWN0fSBsaXN0ZW5lciBUaGUgbGlzdGVuZXIgb2YgdGhlIGV2ZW50LlxuICogQHBhcmFtIHtBZGRFdmVudExpc3RlbmVyT3B0aW9uc30gW29wdGlvbnNdIFRoZSBvcHRpb25zIHNwZWNpZnkgY2hhcmFjdGVyaXN0aWNzIGFib3V0IHRoZSBldmVudCBsaXN0ZW5lci5cbiAqL1xuZnVuY3Rpb24gb25jZSh0YXJnZXQsIHR5cGVzLCBsaXN0ZW5lciwgb3B0aW9ucykge1xuICAgIG9uKHRhcmdldCwgdHlwZXMsIGxpc3RlbmVyLCBPYmplY3QuYXNzaWduKE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMpLCB7IG9uY2U6IHRydWUgfSkpO1xufVxuY29uc3QgZGVmYXVsdEV2ZW50T3B0aW9ucyA9IHtcbiAgICBidWJibGVzOiB0cnVlLFxuICAgIGNhbmNlbGFibGU6IHRydWUsXG4gICAgY29tcG9zZWQ6IHRydWUsXG59O1xuLyoqXG4gKiBEaXNwYXRjaCBldmVudCBvbiB0aGUgZXZlbnQgdGFyZ2V0LlxuICoge0BsaW5rIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9FdmVudFRhcmdldC9kaXNwYXRjaEV2ZW50fVxuICogQHBhcmFtIHtFdmVudFRhcmdldH0gdGFyZ2V0IFRoZSB0YXJnZXQgb2YgdGhlIGV2ZW50LlxuICogQHBhcmFtIHtzdHJpbmd9IHR5cGUgVGhlIG5hbWUgb2YgdGhlIGV2ZW50LlxuICogQHBhcmFtIHsqfSBbZGV0YWlsXSBUaGUgZGF0YSBwYXNzZWQgd2hlbiBpbml0aWFsaXppbmcgdGhlIGV2ZW50LlxuICogQHBhcmFtIHtDdXN0b21FdmVudEluaXR9IFtvcHRpb25zXSBUaGUgb3RoZXIgZXZlbnQgb3B0aW9ucy5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIHRoZSByZXN1bHQgdmFsdWUuXG4gKi9cbmZ1bmN0aW9uIGVtaXQodGFyZ2V0LCB0eXBlLCBkZXRhaWwsIG9wdGlvbnMpIHtcbiAgICByZXR1cm4gdGFyZ2V0LmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KHR5cGUsIE9iamVjdC5hc3NpZ24oT2JqZWN0LmFzc2lnbihPYmplY3QuYXNzaWduKHt9LCBkZWZhdWx0RXZlbnRPcHRpb25zKSwgeyBkZXRhaWwgfSksIG9wdGlvbnMpKSk7XG59XG5jb25zdCByZXNvbHZlZFByb21pc2UgPSBQcm9taXNlLnJlc29sdmUoKTtcbi8qKlxuICogRGVmZXJzIHRoZSBjYWxsYmFjayB0byBiZSBleGVjdXRlZCBhZnRlciB0aGUgbmV4dCBET00gdXBkYXRlIGN5Y2xlLlxuICogQHBhcmFtIHsqfSBbY29udGV4dF0gVGhlIGB0aGlzYCBjb250ZXh0LlxuICogQHBhcmFtIHtGdW5jdGlvbn0gW2NhbGxiYWNrXSBUaGUgY2FsbGJhY2sgdG8gZXhlY3V0ZSBhZnRlciB0aGUgbmV4dCBET00gdXBkYXRlIGN5Y2xlLlxuICogQHJldHVybnMge1Byb21pc2V9IEEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHRvIG5vdGhpbmcuXG4gKi9cbmZ1bmN0aW9uIG5leHRUaWNrKGNvbnRleHQsIGNhbGxiYWNrKSB7XG4gICAgcmV0dXJuIGNhbGxiYWNrXG4gICAgICAgID8gcmVzb2x2ZWRQcm9taXNlLnRoZW4oY29udGV4dCA/IGNhbGxiYWNrLmJpbmQoY29udGV4dCkgOiBjYWxsYmFjaylcbiAgICAgICAgOiByZXNvbHZlZFByb21pc2U7XG59XG4vKipcbiAqIEdldCB0aGUgb2Zmc2V0IGJhc2Ugb24gdGhlIGRvY3VtZW50LlxuICogQHBhcmFtIHtFbGVtZW50fSBlbGVtZW50IFRoZSB0YXJnZXQgZWxlbWVudC5cbiAqIEByZXR1cm5zIHtvYmplY3R9IFRoZSBvZmZzZXQgZGF0YS5cbiAqL1xuZnVuY3Rpb24gZ2V0T2Zmc2V0KGVsZW1lbnQpIHtcbiAgICBjb25zdCB7IGRvY3VtZW50RWxlbWVudCB9ID0gZWxlbWVudC5vd25lckRvY3VtZW50O1xuICAgIGNvbnN0IGJveCA9IGVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogYm94LmxlZnQgKyAoV0lORE9XLnBhZ2VYT2Zmc2V0IC0gZG9jdW1lbnRFbGVtZW50LmNsaWVudExlZnQpLFxuICAgICAgICB0b3A6IGJveC50b3AgKyAoV0lORE9XLnBhZ2VZT2Zmc2V0IC0gZG9jdW1lbnRFbGVtZW50LmNsaWVudFRvcCksXG4gICAgfTtcbn1cbmNvbnN0IFJFR0VYUF9BTkdMRV9VTklUID0gL2RlZ3xnP3JhZHx0dXJuJC9pO1xuLyoqXG4gKiBDb252ZXJ0IGFuIGFuZ2xlIHRvIGEgcmFkaWFuIG51bWJlci5cbiAqIHtAbGluayBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9DU1MvYW5nbGV9XG4gKiBAcGFyYW0ge251bWJlcnxzdHJpbmd9IGFuZ2xlIFRoZSBhbmdsZSB0byBjb252ZXJ0LlxuICogQHJldHVybnMge251bWJlcn0gUmV0dXJucyB0aGUgcmFkaWFuIG51bWJlci5cbiAqL1xuZnVuY3Rpb24gdG9BbmdsZUluUmFkaWFuKGFuZ2xlKSB7XG4gICAgY29uc3QgdmFsdWUgPSBwYXJzZUZsb2F0KGFuZ2xlKSB8fCAwO1xuICAgIGlmICh2YWx1ZSAhPT0gMCkge1xuICAgICAgICBjb25zdCBbdW5pdCA9ICdyYWQnXSA9IFN0cmluZyhhbmdsZSkubWF0Y2goUkVHRVhQX0FOR0xFX1VOSVQpIHx8IFtdO1xuICAgICAgICBzd2l0Y2ggKHVuaXQudG9Mb3dlckNhc2UoKSkge1xuICAgICAgICAgICAgY2FzZSAnZGVnJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gKHZhbHVlIC8gMzYwKSAqIChNYXRoLlBJICogMik7XG4gICAgICAgICAgICBjYXNlICdncmFkJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gKHZhbHVlIC8gNDAwKSAqIChNYXRoLlBJICogMik7XG4gICAgICAgICAgICBjYXNlICd0dXJuJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWUgKiAoTWF0aC5QSSAqIDIpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZTtcbn1cbmNvbnN0IFNJWkVfQURKVVNUTUVOVF9UWVBFX0NPTlRBSU4gPSAnY29udGFpbic7XG5jb25zdCBTSVpFX0FESlVTVE1FTlRfVFlQRV9DT1ZFUiA9ICdjb3Zlcic7XG4vKipcbiAqIEdldCB0aGUgbWF4IHNpemVzIGluIGEgcmVjdGFuZ2xlIHVuZGVyIHRoZSBnaXZlbiBhc3BlY3QgcmF0aW8uXG4gKiBAcGFyYW0ge29iamVjdH0gZGF0YSBUaGUgb3JpZ2luYWwgc2l6ZXMuXG4gKiBAcGFyYW0ge3N0cmluZ30gW3R5cGVdIFRoZSBhZGp1c3QgdHlwZS5cbiAqIEByZXR1cm5zIHtvYmplY3R9IFJldHVybnMgdGhlIHJlc3VsdCBzaXplcy5cbiAqL1xuZnVuY3Rpb24gZ2V0QWRqdXN0ZWRTaXplcyhkYXRhLCB0eXBlID0gU0laRV9BREpVU1RNRU5UX1RZUEVfQ09OVEFJTikge1xuICAgIGNvbnN0IHsgYXNwZWN0UmF0aW8gfSA9IGRhdGE7XG4gICAgbGV0IHsgd2lkdGgsIGhlaWdodCB9ID0gZGF0YTtcbiAgICBjb25zdCBpc1ZhbGlkV2lkdGggPSBpc1Bvc2l0aXZlTnVtYmVyKHdpZHRoKTtcbiAgICBjb25zdCBpc1ZhbGlkSGVpZ2h0ID0gaXNQb3NpdGl2ZU51bWJlcihoZWlnaHQpO1xuICAgIGlmIChpc1ZhbGlkV2lkdGggJiYgaXNWYWxpZEhlaWdodCkge1xuICAgICAgICBjb25zdCBhZGp1c3RlZFdpZHRoID0gaGVpZ2h0ICogYXNwZWN0UmF0aW87XG4gICAgICAgIGlmICgodHlwZSA9PT0gU0laRV9BREpVU1RNRU5UX1RZUEVfQ09OVEFJTiAmJiBhZGp1c3RlZFdpZHRoID4gd2lkdGgpXG4gICAgICAgICAgICB8fCAodHlwZSA9PT0gU0laRV9BREpVU1RNRU5UX1RZUEVfQ09WRVIgJiYgYWRqdXN0ZWRXaWR0aCA8IHdpZHRoKSkge1xuICAgICAgICAgICAgaGVpZ2h0ID0gd2lkdGggLyBhc3BlY3RSYXRpbztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHdpZHRoID0gaGVpZ2h0ICogYXNwZWN0UmF0aW87XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSBpZiAoaXNWYWxpZFdpZHRoKSB7XG4gICAgICAgIGhlaWdodCA9IHdpZHRoIC8gYXNwZWN0UmF0aW87XG4gICAgfVxuICAgIGVsc2UgaWYgKGlzVmFsaWRIZWlnaHQpIHtcbiAgICAgICAgd2lkdGggPSBoZWlnaHQgKiBhc3BlY3RSYXRpbztcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgd2lkdGgsXG4gICAgICAgIGhlaWdodCxcbiAgICB9O1xufVxuLyoqXG4gKiBNdWx0aXBseSBtdWx0aXBsZSBtYXRyaWNlcy5cbiAqIEBwYXJhbSB7QXJyYXl9IG1hdHJpeCBUaGUgZmlyc3QgbWF0cml4LlxuICogQHBhcmFtIHtBcnJheX0gYXJncyBUaGUgcmVzdCBtYXRyaWNlcy5cbiAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyB0aGUgcmVzdWx0IG1hdHJpeC5cbiAqL1xuZnVuY3Rpb24gbXVsdGlwbHlNYXRyaWNlcyhtYXRyaXgsIC4uLmFyZ3MpIHtcbiAgICBpZiAoYXJncy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIG1hdHJpeDtcbiAgICB9XG4gICAgY29uc3QgW2ExLCBiMSwgYzEsIGQxLCBlMSwgZjFdID0gbWF0cml4O1xuICAgIGNvbnN0IFthMiwgYjIsIGMyLCBkMiwgZTIsIGYyXSA9IGFyZ3NbMF07XG4gICAgLy8gXHUyNTBDIGExIGMxIGUxIFx1MjUxMCAgIFx1MjUwQyBhMiBjMiBlMiBcdTI1MTBcbiAgICAvLyBcdTI1MDIgYjEgZDEgZjEgXHUyNTAyIFx1MDBENyBcdTI1MDIgYjIgZDIgZjIgXHUyNTAyXG4gICAgLy8gXHUyNTE0IDAgIDAgIDEgIFx1MjUxOCAgIFx1MjUxNCAwICAwICAxICBcdTI1MThcbiAgICBtYXRyaXggPSBbXG4gICAgICAgIGExICogYTIgKyBjMSAqIGIyIC8qICsgZTEgKiAwICovLFxuICAgICAgICBiMSAqIGEyICsgZDEgKiBiMiAvKiArIGYxICogMCAqLyxcbiAgICAgICAgYTEgKiBjMiArIGMxICogZDIgLyogKyBlMSAqIDAgKi8sXG4gICAgICAgIGIxICogYzIgKyBkMSAqIGQyIC8qICsgZjEgKiAwICovLFxuICAgICAgICBhMSAqIGUyICsgYzEgKiBmMiArIGUxIC8qICogMSAqLyxcbiAgICAgICAgYjEgKiBlMiArIGQxICogZjIgKyBmMSAvKiAqIDEgKi8sXG4gICAgXTtcbiAgICByZXR1cm4gbXVsdGlwbHlNYXRyaWNlcyhtYXRyaXgsIC4uLmFyZ3Muc2xpY2UoMSkpO1xufVxuXG5leHBvcnQgeyBBQ1RJT05fTU9WRSwgQUNUSU9OX05PTkUsIEFDVElPTl9SRVNJWkVfRUFTVCwgQUNUSU9OX1JFU0laRV9OT1JUSCwgQUNUSU9OX1JFU0laRV9OT1JUSEVBU1QsIEFDVElPTl9SRVNJWkVfTk9SVEhXRVNULCBBQ1RJT05fUkVTSVpFX1NPVVRILCBBQ1RJT05fUkVTSVpFX1NPVVRIRUFTVCwgQUNUSU9OX1JFU0laRV9TT1VUSFdFU1QsIEFDVElPTl9SRVNJWkVfV0VTVCwgQUNUSU9OX1JPVEFURSwgQUNUSU9OX1NDQUxFLCBBQ1RJT05fU0VMRUNULCBBQ1RJT05fVFJBTlNGT1JNLCBBVFRSSUJVVEVfQUNUSU9OLCBDUk9QUEVSX0NBTlZBUywgQ1JPUFBFUl9DUk9TU0hBSVIsIENST1BQRVJfR0lSRCwgQ1JPUFBFUl9IQU5ETEUsIENST1BQRVJfSU1BR0UsIENST1BQRVJfU0VMRUNUSU9OLCBDUk9QUEVSX1NIQURFLCBDUk9QUEVSX1ZJRVdFUiwgRVZFTlRfQUNUSU9OLCBFVkVOVF9BQ1RJT05fRU5ELCBFVkVOVF9BQ1RJT05fTU9WRSwgRVZFTlRfQUNUSU9OX1NUQVJULCBFVkVOVF9DSEFOR0UsIEVWRU5UX0VSUk9SLCBFVkVOVF9LRVlET1dOLCBFVkVOVF9MT0FELCBFVkVOVF9QT0lOVEVSX0RPV04sIEVWRU5UX1BPSU5URVJfTU9WRSwgRVZFTlRfUE9JTlRFUl9VUCwgRVZFTlRfUkVTSVpFLCBFVkVOVF9UT1VDSF9FTkQsIEVWRU5UX1RPVUNIX01PVkUsIEVWRU5UX1RPVUNIX1NUQVJULCBFVkVOVF9UUkFOU0ZPUk0sIEVWRU5UX1dIRUVMLCBIQVNfUE9JTlRFUl9FVkVOVCwgSVNfQlJPV1NFUiwgSVNfVE9VQ0hfREVWSUNFLCBOQU1FU1BBQ0UsIFdJTkRPVywgZW1pdCwgZ2V0QWRqdXN0ZWRTaXplcywgZ2V0T2Zmc2V0LCBpc0VsZW1lbnQsIGlzRnVuY3Rpb24sIGlzTmFOLCBpc051bWJlciwgaXNPYmplY3QsIGlzUGxhaW5PYmplY3QsIGlzUG9zaXRpdmVOdW1iZXIsIGlzU3RyaW5nLCBpc1VuZGVmaW5lZCwgbXVsdGlwbHlNYXRyaWNlcywgbmV4dFRpY2ssIG9mZiwgb24sIG9uY2UsIHRvQW5nbGVJblJhZGlhbiwgdG9DYW1lbENhc2UsIHRvS2ViYWJDYXNlIH07XG4iLCAiaW1wb3J0IHsgV0lORE9XLCB0b0NhbWVsQ2FzZSwgdG9LZWJhYkNhc2UsIGlzTmFOLCBpc1VuZGVmaW5lZCwgaXNOdW1iZXIsIGVtaXQsIG5leHRUaWNrLCBpc09iamVjdCwgSVNfQlJPV1NFUiB9IGZyb20gJ0Bjcm9wcGVyL3V0aWxzJztcblxudmFyIHN0eWxlID0gYDpob3N0KFtoaWRkZW5dKXtkaXNwbGF5Om5vbmUhaW1wb3J0YW50fWA7XG5cbmNvbnN0IFJFR0VYUF9TVUZGSVggPSAvbGVmdHx0b3B8d2lkdGh8aGVpZ2h0L2k7XG5jb25zdCBERUZBVUxUX1NIQURPV19ST09UX01PREUgPSAnb3Blbic7XG5jb25zdCBzaGFkb3dSb290cyA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBzdHlsZVNoZWV0cyA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCB0YWdOYW1lcyA9IG5ldyBNYXAoKTtcbmNvbnN0IHN1cHBvcnRzQWRvcHRlZFN0eWxlU2hlZXRzID0gV0lORE9XLmRvY3VtZW50ICYmIEFycmF5LmlzQXJyYXkoV0lORE9XLmRvY3VtZW50LmFkb3B0ZWRTdHlsZVNoZWV0cykgJiYgJ3JlcGxhY2VTeW5jJyBpbiBXSU5ET1cuQ1NTU3R5bGVTaGVldC5wcm90b3R5cGU7XG5jbGFzcyBDcm9wcGVyRWxlbWVudCBleHRlbmRzIEhUTUxFbGVtZW50IHtcbiAgICBnZXQgJHNoYXJlZFN0eWxlKCkge1xuICAgICAgICByZXR1cm4gYCR7dGhpcy50aGVtZUNvbG9yID8gYDpob3N0ey0tdGhlbWUtY29sb3I6ICR7dGhpcy50aGVtZUNvbG9yfTt9YCA6ICcnfSR7c3R5bGV9YDtcbiAgICB9XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHZhciBfYSwgX2I7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuc2hhZG93Um9vdE1vZGUgPSBERUZBVUxUX1NIQURPV19ST09UX01PREU7XG4gICAgICAgIHRoaXMuc2xvdHRhYmxlID0gdHJ1ZTtcbiAgICAgICAgY29uc3QgbmFtZSA9IChfYiA9IChfYSA9IE9iamVjdC5nZXRQcm90b3R5cGVPZih0aGlzKSkgPT09IG51bGwgfHwgX2EgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9hLmNvbnN0cnVjdG9yKSA9PT0gbnVsbCB8fCBfYiA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2IuJG5hbWU7XG4gICAgICAgIGlmIChuYW1lKSB7XG4gICAgICAgICAgICB0YWdOYW1lcy5zZXQobmFtZSwgdGhpcy50YWdOYW1lLnRvTG93ZXJDYXNlKCkpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHN0YXRpYyBnZXQgb2JzZXJ2ZWRBdHRyaWJ1dGVzKCkge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgJ3NoYWRvdy1yb290LW1vZGUnLFxuICAgICAgICAgICAgJ3Nsb3R0YWJsZScsXG4gICAgICAgICAgICAndGhlbWUtY29sb3InLFxuICAgICAgICBdO1xuICAgIH1cbiAgICAvLyBDb252ZXJ0IGF0dHJpYnV0ZSB0byBwcm9wZXJ0eVxuICAgIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpIHtcbiAgICAgICAgaWYgKE9iamVjdC5pcyhuZXdWYWx1ZSwgb2xkVmFsdWUpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcHJvcGVydHlOYW1lID0gdG9DYW1lbENhc2UobmFtZSk7XG4gICAgICAgIGNvbnN0IG9sZFByb3BlcnR5VmFsdWUgPSB0aGlzW3Byb3BlcnR5TmFtZV07XG4gICAgICAgIGxldCBuZXdQcm9wZXJ0eVZhbHVlID0gbmV3VmFsdWU7XG4gICAgICAgIHN3aXRjaCAodHlwZW9mIG9sZFByb3BlcnR5VmFsdWUpIHtcbiAgICAgICAgICAgIGNhc2UgJ2Jvb2xlYW4nOlxuICAgICAgICAgICAgICAgIG5ld1Byb3BlcnR5VmFsdWUgPSBuZXdWYWx1ZSAhPT0gbnVsbCAmJiBuZXdWYWx1ZSAhPT0gJ2ZhbHNlJztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ251bWJlcic6XG4gICAgICAgICAgICAgICAgbmV3UHJvcGVydHlWYWx1ZSA9IE51bWJlcihuZXdWYWx1ZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgdGhpc1twcm9wZXJ0eU5hbWVdID0gbmV3UHJvcGVydHlWYWx1ZTtcbiAgICAgICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICAgICAgICBjYXNlICd0aGVtZS1jb2xvcic6IHtcbiAgICAgICAgICAgICAgICBjb25zdCBzdHlsZVNoZWV0ID0gc3R5bGVTaGVldHMuZ2V0KHRoaXMpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN0eWxlcyA9IHRoaXMuJHNoYXJlZFN0eWxlO1xuICAgICAgICAgICAgICAgIGlmIChzdHlsZVNoZWV0ICYmIHN0eWxlcykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoc3VwcG9ydHNBZG9wdGVkU3R5bGVTaGVldHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlU2hlZXQucmVwbGFjZVN5bmMoc3R5bGVzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlU2hlZXQudGV4dENvbnRlbnQgPSBzdHlsZXM7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gQ29udmVydCBwcm9wZXJ0eSB0byBhdHRyaWJ1dGVcbiAgICAkcHJvcGVydHlDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKSB7XG4gICAgICAgIGlmIChPYmplY3QuaXMobmV3VmFsdWUsIG9sZFZhbHVlKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIG5hbWUgPSB0b0tlYmFiQ2FzZShuYW1lKTtcbiAgICAgICAgc3dpdGNoICh0eXBlb2YgbmV3VmFsdWUpIHtcbiAgICAgICAgICAgIGNhc2UgJ2Jvb2xlYW4nOlxuICAgICAgICAgICAgICAgIGlmIChuZXdWYWx1ZSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMuaGFzQXR0cmlidXRlKG5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZShuYW1lLCAnJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlQXR0cmlidXRlKG5hbWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ251bWJlcic6XG4gICAgICAgICAgICAgICAgaWYgKGlzTmFOKG5ld1ZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICBuZXdWYWx1ZSA9ICcnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbmV3VmFsdWUgPSBTdHJpbmcobmV3VmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIEZhbGwgdGhyb3VnaFxuICAgICAgICAgICAgLy8gY2FzZSAnc3RyaW5nJzpcbiAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1mYWxsdGhyb3VnaFxuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICBpZiAobmV3VmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuZ2V0QXR0cmlidXRlKG5hbWUpICE9PSBuZXdWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUobmFtZSwgbmV3VmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUF0dHJpYnV0ZShuYW1lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIC8vIE9ic2VydmUgcHJvcGVydGllcyBhZnRlciBvYnNlcnZlZCBhdHRyaWJ1dGVzXG4gICAgICAgIE9iamVjdC5nZXRQcm90b3R5cGVPZih0aGlzKS5jb25zdHJ1Y3Rvci5vYnNlcnZlZEF0dHJpYnV0ZXMuZm9yRWFjaCgoYXR0cmlidXRlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwcm9wZXJ0eSA9IHRvQ2FtZWxDYXNlKGF0dHJpYnV0ZSk7XG4gICAgICAgICAgICBsZXQgdmFsdWUgPSB0aGlzW3Byb3BlcnR5XTtcbiAgICAgICAgICAgIGlmICghaXNVbmRlZmluZWQodmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy4kcHJvcGVydHlDaGFuZ2VkQ2FsbGJhY2socHJvcGVydHksIHVuZGVmaW5lZCwgdmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIHByb3BlcnR5LCB7XG4gICAgICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgZ2V0KCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBzZXQobmV3VmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2xkVmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBuZXdWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy4kcHJvcGVydHlDaGFuZ2VkQ2FsbGJhY2socHJvcGVydHksIG9sZFZhbHVlLCBuZXdWYWx1ZSk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc3Qgc2hhZG93ID0gdGhpcy5hdHRhY2hTaGFkb3coe1xuICAgICAgICAgICAgbW9kZTogdGhpcy5zaGFkb3dSb290TW9kZSB8fCBERUZBVUxUX1NIQURPV19ST09UX01PREUsXG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoIXRoaXMuc2hhZG93Um9vdCkge1xuICAgICAgICAgICAgc2hhZG93Um9vdHMuc2V0KHRoaXMsIHNoYWRvdyk7XG4gICAgICAgIH1cbiAgICAgICAgc3R5bGVTaGVldHMuc2V0KHRoaXMsIHRoaXMuJGFkZFN0eWxlcyh0aGlzLiRzaGFyZWRTdHlsZSkpO1xuICAgICAgICBpZiAodGhpcy4kc3R5bGUpIHtcbiAgICAgICAgICAgIHRoaXMuJGFkZFN0eWxlcyh0aGlzLiRzdHlsZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuJHRlbXBsYXRlKSB7XG4gICAgICAgICAgICBjb25zdCB0ZW1wbGF0ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RlbXBsYXRlJyk7XG4gICAgICAgICAgICB0ZW1wbGF0ZS5pbm5lckhUTUwgPSB0aGlzLiR0ZW1wbGF0ZTtcbiAgICAgICAgICAgIHNoYWRvdy5hcHBlbmRDaGlsZCh0ZW1wbGF0ZS5jb250ZW50KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5zbG90dGFibGUpIHtcbiAgICAgICAgICAgIGNvbnN0IHNsb3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzbG90Jyk7XG4gICAgICAgICAgICBzaGFkb3cuYXBwZW5kQ2hpbGQoc2xvdCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZGlzY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIGlmIChzdHlsZVNoZWV0cy5oYXModGhpcykpIHtcbiAgICAgICAgICAgIHN0eWxlU2hlZXRzLmRlbGV0ZSh0aGlzKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc2hhZG93Um9vdHMuaGFzKHRoaXMpKSB7XG4gICAgICAgICAgICBzaGFkb3dSb290cy5kZWxldGUodGhpcyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGNsYXNzLW1ldGhvZHMtdXNlLXRoaXNcbiAgICAkZ2V0VGFnTmFtZU9mKG5hbWUpIHtcbiAgICAgICAgdmFyIF9hO1xuICAgICAgICByZXR1cm4gKF9hID0gdGFnTmFtZXMuZ2V0KG5hbWUpKSAhPT0gbnVsbCAmJiBfYSAhPT0gdm9pZCAwID8gX2EgOiBuYW1lO1xuICAgIH1cbiAgICAkc2V0U3R5bGVzKHByb3BlcnRpZXMpIHtcbiAgICAgICAgT2JqZWN0LmtleXMocHJvcGVydGllcykuZm9yRWFjaCgocHJvcGVydHkpID0+IHtcbiAgICAgICAgICAgIGxldCB2YWx1ZSA9IHByb3BlcnRpZXNbcHJvcGVydHldO1xuICAgICAgICAgICAgaWYgKGlzTnVtYmVyKHZhbHVlKSkge1xuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSAhPT0gMCAmJiBSRUdFWFBfU1VGRklYLnRlc3QocHJvcGVydHkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gYCR7dmFsdWV9cHhgO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBTdHJpbmcodmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuc3R5bGVbcHJvcGVydHldID0gdmFsdWU7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogT3V0cHV0cyB0aGUgc2hhZG93IHJvb3Qgb2YgdGhlIGVsZW1lbnQuXG4gICAgICogQHJldHVybnMge1NoYWRvd1Jvb3R9IFJldHVybnMgdGhlIHNoYWRvdyByb290LlxuICAgICAqL1xuICAgICRnZXRTaGFkb3dSb290KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zaGFkb3dSb290IHx8IHNoYWRvd1Jvb3RzLmdldCh0aGlzKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQWRkcyBzdHlsZXMgdG8gdGhlIHNoYWRvdyByb290LlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBzdHlsZXMgVGhlIHN0eWxlcyB0byBhZGQuXG4gICAgICogQHJldHVybnMge0NTU1N0eWxlU2hlZXR8SFRNTFN0eWxlRWxlbWVudH0gUmV0dXJucyB0aGUgZ2VuZXJhdGVkIHN0eWxlIHNoZWV0LlxuICAgICAqL1xuICAgICRhZGRTdHlsZXMoc3R5bGVzKSB7XG4gICAgICAgIGxldCBzdHlsZVNoZWV0O1xuICAgICAgICBjb25zdCBzaGFkb3cgPSB0aGlzLiRnZXRTaGFkb3dSb290KCk7XG4gICAgICAgIGlmIChzdXBwb3J0c0Fkb3B0ZWRTdHlsZVNoZWV0cykge1xuICAgICAgICAgICAgc3R5bGVTaGVldCA9IG5ldyBDU1NTdHlsZVNoZWV0KCk7XG4gICAgICAgICAgICBzdHlsZVNoZWV0LnJlcGxhY2VTeW5jKHN0eWxlcyk7XG4gICAgICAgICAgICBzaGFkb3cuYWRvcHRlZFN0eWxlU2hlZXRzID0gc2hhZG93LmFkb3B0ZWRTdHlsZVNoZWV0cy5jb25jYXQoc3R5bGVTaGVldCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBzdHlsZVNoZWV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgICAgICAgICAgIHN0eWxlU2hlZXQudGV4dENvbnRlbnQgPSBzdHlsZXM7XG4gICAgICAgICAgICBzaGFkb3cuYXBwZW5kQ2hpbGQoc3R5bGVTaGVldCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHN0eWxlU2hlZXQ7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIERpc3BhdGNoZXMgYW4gZXZlbnQgYXQgdGhlIGVsZW1lbnQuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHR5cGUgVGhlIG5hbWUgb2YgdGhlIGV2ZW50LlxuICAgICAqIEBwYXJhbSB7Kn0gW2RldGFpbF0gVGhlIGRhdGEgcGFzc2VkIHdoZW4gaW5pdGlhbGl6aW5nIHRoZSBldmVudC5cbiAgICAgKiBAcGFyYW0ge0N1c3RvbUV2ZW50SW5pdH0gW29wdGlvbnNdIFRoZSBvdGhlciBldmVudCBvcHRpb25zLlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIHRoZSByZXN1bHQgdmFsdWUuXG4gICAgICovXG4gICAgJGVtaXQodHlwZSwgZGV0YWlsLCBvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiBlbWl0KHRoaXMsIHR5cGUsIGRldGFpbCwgb3B0aW9ucyk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIERlZmVycyB0aGUgY2FsbGJhY2sgdG8gYmUgZXhlY3V0ZWQgYWZ0ZXIgdGhlIG5leHQgRE9NIHVwZGF0ZSBjeWNsZS5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY2FsbGJhY2tdIFRoZSBjYWxsYmFjayB0byBleGVjdXRlIGFmdGVyIHRoZSBuZXh0IERPTSB1cGRhdGUgY3ljbGUuXG4gICAgICogQHJldHVybnMge1Byb21pc2V9IEEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHRvIG5vdGhpbmcuXG4gICAgICovXG4gICAgJG5leHRUaWNrKGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiBuZXh0VGljayh0aGlzLCBjYWxsYmFjayk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIERlZmluZXMgdGhlIGNvbnN0cnVjdG9yIGFzIGEgbmV3IGN1c3RvbSBlbGVtZW50LlxuICAgICAqIHtAbGluayBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvQ3VzdG9tRWxlbWVudFJlZ2lzdHJ5L2RlZmluZX1cbiAgICAgKiBAcGFyYW0ge3N0cmluZ3xvYmplY3R9IFtuYW1lXSBUaGUgZWxlbWVudCBuYW1lLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc10gVGhlIGVsZW1lbnQgZGVmaW5pdGlvbiBvcHRpb25zLlxuICAgICAqL1xuICAgIHN0YXRpYyAkZGVmaW5lKG5hbWUsIG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKGlzT2JqZWN0KG5hbWUpKSB7XG4gICAgICAgICAgICBvcHRpb25zID0gbmFtZTtcbiAgICAgICAgICAgIG5hbWUgPSAnJztcbiAgICAgICAgfVxuICAgICAgICBpZiAoIW5hbWUpIHtcbiAgICAgICAgICAgIG5hbWUgPSB0aGlzLiRuYW1lIHx8IHRoaXMubmFtZTtcbiAgICAgICAgfVxuICAgICAgICBuYW1lID0gdG9LZWJhYkNhc2UobmFtZSk7XG4gICAgICAgIGlmIChJU19CUk9XU0VSICYmIFdJTkRPVy5jdXN0b21FbGVtZW50cyAmJiAhV0lORE9XLmN1c3RvbUVsZW1lbnRzLmdldChuYW1lKSkge1xuICAgICAgICAgICAgY3VzdG9tRWxlbWVudHMuZGVmaW5lKG5hbWUsIHRoaXMsIG9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgfVxufVxuQ3JvcHBlckVsZW1lbnQuJHZlcnNpb24gPSAnMi4wLjAnO1xuXG5leHBvcnQgeyBDcm9wcGVyRWxlbWVudCBhcyBkZWZhdWx0IH07XG4iLCAiaW1wb3J0IENyb3BwZXJFbGVtZW50IGZyb20gJ0Bjcm9wcGVyL2VsZW1lbnQnO1xuaW1wb3J0IHsgQ1JPUFBFUl9DQU5WQVMsIEFDVElPTl9OT05FLCBvbiwgRVZFTlRfUE9JTlRFUl9ET1dOLCBFVkVOVF9QT0lOVEVSX01PVkUsIEVWRU5UX1BPSU5URVJfVVAsIEVWRU5UX1dIRUVMLCBvZmYsIGlzTnVtYmVyLCBpc0VsZW1lbnQsIEFUVFJJQlVURV9BQ1RJT04sIEVWRU5UX0FDVElPTl9TVEFSVCwgRVZFTlRfQUNUSU9OX01PVkUsIEFDVElPTl9UUkFOU0ZPUk0sIEVWRU5UX0FDVElPTiwgRVZFTlRfQUNUSU9OX0VORCwgQUNUSU9OX1NDQUxFLCBpc1N0cmluZywgaXNQbGFpbk9iamVjdCwgaXNQb3NpdGl2ZU51bWJlciwgZ2V0QWRqdXN0ZWRTaXplcywgQ1JPUFBFUl9JTUFHRSwgaXNGdW5jdGlvbiwgQUNUSU9OX1JPVEFURSB9IGZyb20gJ0Bjcm9wcGVyL3V0aWxzJztcblxudmFyIHN0eWxlID0gYDpob3N0e2Rpc3BsYXk6YmxvY2s7bWluLWhlaWdodDoxMDBweDttaW4td2lkdGg6MjAwcHg7b3ZlcmZsb3c6aGlkZGVuO3Bvc2l0aW9uOnJlbGF0aXZlO3RvdWNoLWFjdGlvbjpub25lOy13ZWJraXQtdG91Y2gtY2FsbG91dDpub25lOy13ZWJraXQtdXNlci1zZWxlY3Q6bm9uZTstbW96LXVzZXItc2VsZWN0Om5vbmU7dXNlci1zZWxlY3Q6bm9uZX06aG9zdChbYmFja2dyb3VuZF0pe2JhY2tncm91bmQtY29sb3I6I2ZmZjtiYWNrZ3JvdW5kLWltYWdlOnJlcGVhdGluZy1saW5lYXItZ3JhZGllbnQoNDVkZWcsI2NjYyAyNSUsdHJhbnNwYXJlbnQgMCx0cmFuc3BhcmVudCA3NSUsI2NjYyAwLCNjY2MpLHJlcGVhdGluZy1saW5lYXItZ3JhZGllbnQoNDVkZWcsI2NjYyAyNSUsdHJhbnNwYXJlbnQgMCx0cmFuc3BhcmVudCA3NSUsI2NjYyAwLCNjY2MpO2JhY2tncm91bmQtaW1hZ2U6cmVwZWF0aW5nLWNvbmljLWdyYWRpZW50KCNjY2MgMCAyNSUsI2ZmZiAwIDUwJSk7YmFja2dyb3VuZC1wb3NpdGlvbjowIDAsLjVyZW0gLjVyZW07YmFja2dyb3VuZC1zaXplOjFyZW0gMXJlbX06aG9zdChbZGlzYWJsZWRdKXtwb2ludGVyLWV2ZW50czpub25lfTpob3N0KFtkaXNhYmxlZF0pOmFmdGVye2JvdHRvbTowO2NvbnRlbnQ6XCJcIjtjdXJzb3I6bm90LWFsbG93ZWQ7ZGlzcGxheTpibG9jaztsZWZ0OjA7cG9pbnRlci1ldmVudHM6bm9uZTtwb3NpdGlvbjphYnNvbHV0ZTtyaWdodDowO3RvcDowfWA7XG5cbmNsYXNzIENyb3BwZXJDYW52YXMgZXh0ZW5kcyBDcm9wcGVyRWxlbWVudCB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKC4uLmFyZ3VtZW50cyk7XG4gICAgICAgIHRoaXMuJG9uUG9pbnRlckRvd24gPSBudWxsO1xuICAgICAgICB0aGlzLiRvblBvaW50ZXJNb3ZlID0gbnVsbDtcbiAgICAgICAgdGhpcy4kb25Qb2ludGVyVXAgPSBudWxsO1xuICAgICAgICB0aGlzLiRvbldoZWVsID0gbnVsbDtcbiAgICAgICAgdGhpcy4kd2hlZWxpbmcgPSBmYWxzZTtcbiAgICAgICAgdGhpcy4kcG9pbnRlcnMgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMuJHN0eWxlID0gc3R5bGU7XG4gICAgICAgIHRoaXMuJGFjdGlvbiA9IEFDVElPTl9OT05FO1xuICAgICAgICB0aGlzLmJhY2tncm91bmQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5kaXNhYmxlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnNjYWxlU3RlcCA9IDAuMTtcbiAgICAgICAgdGhpcy50aGVtZUNvbG9yID0gJyMzOWYnO1xuICAgIH1cbiAgICBzdGF0aWMgZ2V0IG9ic2VydmVkQXR0cmlidXRlcygpIHtcbiAgICAgICAgcmV0dXJuIHN1cGVyLm9ic2VydmVkQXR0cmlidXRlcy5jb25jYXQoW1xuICAgICAgICAgICAgJ2JhY2tncm91bmQnLFxuICAgICAgICAgICAgJ2Rpc2FibGVkJyxcbiAgICAgICAgICAgICdzY2FsZS1zdGVwJyxcbiAgICAgICAgXSk7XG4gICAgfVxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICBzdXBlci5jb25uZWN0ZWRDYWxsYmFjaygpO1xuICAgICAgICBpZiAoIXRoaXMuZGlzYWJsZWQpIHtcbiAgICAgICAgICAgIHRoaXMuJGJpbmQoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBkaXNjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgaWYgKCF0aGlzLmRpc2FibGVkKSB7XG4gICAgICAgICAgICB0aGlzLiR1bmJpbmQoKTtcbiAgICAgICAgfVxuICAgICAgICBzdXBlci5kaXNjb25uZWN0ZWRDYWxsYmFjaygpO1xuICAgIH1cbiAgICAkcHJvcGVydHlDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKSB7XG4gICAgICAgIGlmIChPYmplY3QuaXMobmV3VmFsdWUsIG9sZFZhbHVlKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHN1cGVyLiRwcm9wZXJ0eUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpO1xuICAgICAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgICAgICAgIGNhc2UgJ2Rpc2FibGVkJzpcbiAgICAgICAgICAgICAgICBpZiAobmV3VmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy4kdW5iaW5kKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLiRiaW5kKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuICAgICRiaW5kKCkge1xuICAgICAgICBpZiAoIXRoaXMuJG9uUG9pbnRlckRvd24pIHtcbiAgICAgICAgICAgIHRoaXMuJG9uUG9pbnRlckRvd24gPSB0aGlzLiRoYW5kbGVQb2ludGVyRG93bi5iaW5kKHRoaXMpO1xuICAgICAgICAgICAgb24odGhpcywgRVZFTlRfUE9JTlRFUl9ET1dOLCB0aGlzLiRvblBvaW50ZXJEb3duKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMuJG9uUG9pbnRlck1vdmUpIHtcbiAgICAgICAgICAgIHRoaXMuJG9uUG9pbnRlck1vdmUgPSB0aGlzLiRoYW5kbGVQb2ludGVyTW92ZS5iaW5kKHRoaXMpO1xuICAgICAgICAgICAgb24odGhpcy5vd25lckRvY3VtZW50LCBFVkVOVF9QT0lOVEVSX01PVkUsIHRoaXMuJG9uUG9pbnRlck1vdmUpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy4kb25Qb2ludGVyVXApIHtcbiAgICAgICAgICAgIHRoaXMuJG9uUG9pbnRlclVwID0gdGhpcy4kaGFuZGxlUG9pbnRlclVwLmJpbmQodGhpcyk7XG4gICAgICAgICAgICBvbih0aGlzLm93bmVyRG9jdW1lbnQsIEVWRU5UX1BPSU5URVJfVVAsIHRoaXMuJG9uUG9pbnRlclVwKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMuJG9uV2hlZWwpIHtcbiAgICAgICAgICAgIHRoaXMuJG9uV2hlZWwgPSB0aGlzLiRoYW5kbGVXaGVlbC5iaW5kKHRoaXMpO1xuICAgICAgICAgICAgb24odGhpcywgRVZFTlRfV0hFRUwsIHRoaXMuJG9uV2hlZWwsIHtcbiAgICAgICAgICAgICAgICBwYXNzaXZlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBjYXB0dXJlOiB0cnVlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgJHVuYmluZCgpIHtcbiAgICAgICAgaWYgKHRoaXMuJG9uUG9pbnRlckRvd24pIHtcbiAgICAgICAgICAgIG9mZih0aGlzLCBFVkVOVF9QT0lOVEVSX0RPV04sIHRoaXMuJG9uUG9pbnRlckRvd24pO1xuICAgICAgICAgICAgdGhpcy4kb25Qb2ludGVyRG93biA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuJG9uUG9pbnRlck1vdmUpIHtcbiAgICAgICAgICAgIG9mZih0aGlzLm93bmVyRG9jdW1lbnQsIEVWRU5UX1BPSU5URVJfTU9WRSwgdGhpcy4kb25Qb2ludGVyTW92ZSk7XG4gICAgICAgICAgICB0aGlzLiRvblBvaW50ZXJNb3ZlID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy4kb25Qb2ludGVyVXApIHtcbiAgICAgICAgICAgIG9mZih0aGlzLm93bmVyRG9jdW1lbnQsIEVWRU5UX1BPSU5URVJfVVAsIHRoaXMuJG9uUG9pbnRlclVwKTtcbiAgICAgICAgICAgIHRoaXMuJG9uUG9pbnRlclVwID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy4kb25XaGVlbCkge1xuICAgICAgICAgICAgb2ZmKHRoaXMsIEVWRU5UX1dIRUVMLCB0aGlzLiRvbldoZWVsLCB7XG4gICAgICAgICAgICAgICAgY2FwdHVyZTogdHJ1ZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy4kb25XaGVlbCA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9XG4gICAgJGhhbmRsZVBvaW50ZXJEb3duKGV2ZW50KSB7XG4gICAgICAgIGNvbnN0IHsgYnV0dG9ucywgYnV0dG9uLCB0eXBlIH0gPSBldmVudDtcbiAgICAgICAgaWYgKHRoaXMuZGlzYWJsZWQgfHwgKFxuICAgICAgICAvLyBIYW5kbGUgcG9pbnRlciBvciBtb3VzZSBldmVudCwgYW5kIGlnbm9yZSB0b3VjaCBldmVudFxuICAgICAgICAoKHR5cGUgPT09ICdwb2ludGVyZG93bicgJiYgZXZlbnQucG9pbnRlclR5cGUgPT09ICdtb3VzZScpIHx8IHR5cGUgPT09ICdtb3VzZWRvd24nKSAmJiAoXG4gICAgICAgIC8vIE5vIHByaW1hcnkgYnV0dG9uIChVc3VhbGx5IHRoZSBsZWZ0IGJ1dHRvbilcbiAgICAgICAgKGlzTnVtYmVyKGJ1dHRvbnMpICYmIGJ1dHRvbnMgIT09IDEpIHx8IChpc051bWJlcihidXR0b24pICYmIGJ1dHRvbiAhPT0gMClcbiAgICAgICAgICAgIC8vIE9wZW4gY29udGV4dCBtZW51XG4gICAgICAgICAgICB8fCBldmVudC5jdHJsS2V5KSkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB7ICRwb2ludGVycyB9ID0gdGhpcztcbiAgICAgICAgbGV0IGFjdGlvbiA9ICcnO1xuICAgICAgICBpZiAoZXZlbnQuY2hhbmdlZFRvdWNoZXMpIHtcbiAgICAgICAgICAgIEFycmF5LmZyb20oZXZlbnQuY2hhbmdlZFRvdWNoZXMpLmZvckVhY2goKHsgaWRlbnRpZmllciwgcGFnZVgsIHBhZ2VZLCB9KSA9PiB7XG4gICAgICAgICAgICAgICAgJHBvaW50ZXJzLnNldChpZGVudGlmaWVyLCB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0WDogcGFnZVgsXG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0WTogcGFnZVksXG4gICAgICAgICAgICAgICAgICAgIGVuZFg6IHBhZ2VYLFxuICAgICAgICAgICAgICAgICAgICBlbmRZOiBwYWdlWSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgeyBwb2ludGVySWQgPSAwLCBwYWdlWCwgcGFnZVkgfSA9IGV2ZW50O1xuICAgICAgICAgICAgJHBvaW50ZXJzLnNldChwb2ludGVySWQsIHtcbiAgICAgICAgICAgICAgICBzdGFydFg6IHBhZ2VYLFxuICAgICAgICAgICAgICAgIHN0YXJ0WTogcGFnZVksXG4gICAgICAgICAgICAgICAgZW5kWDogcGFnZVgsXG4gICAgICAgICAgICAgICAgZW5kWTogcGFnZVksXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoJHBvaW50ZXJzLnNpemUgPiAxKSB7XG4gICAgICAgICAgICBhY3Rpb24gPSBBQ1RJT05fVFJBTlNGT1JNO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGlzRWxlbWVudChldmVudC50YXJnZXQpKSB7XG4gICAgICAgICAgICBhY3Rpb24gPSBldmVudC50YXJnZXQuYWN0aW9uIHx8IGV2ZW50LnRhcmdldC5nZXRBdHRyaWJ1dGUoQVRUUklCVVRFX0FDVElPTikgfHwgJyc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuJGVtaXQoRVZFTlRfQUNUSU9OX1NUQVJULCB7XG4gICAgICAgICAgICBhY3Rpb24sXG4gICAgICAgICAgICByZWxhdGVkRXZlbnQ6IGV2ZW50LFxuICAgICAgICB9KSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvLyBQcmV2ZW50IHBhZ2Ugem9vbWluZyBpbiB0aGUgYnJvd3NlcnMgZm9yIGlPUy5cbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdGhpcy4kYWN0aW9uID0gYWN0aW9uO1xuICAgICAgICB0aGlzLnN0eWxlLndpbGxDaGFuZ2UgPSAndHJhbnNmb3JtJztcbiAgICB9XG4gICAgJGhhbmRsZVBvaW50ZXJNb3ZlKGV2ZW50KSB7XG4gICAgICAgIGNvbnN0IHsgJGFjdGlvbiwgJHBvaW50ZXJzIH0gPSB0aGlzO1xuICAgICAgICBpZiAodGhpcy5kaXNhYmxlZCB8fCAkYWN0aW9uID09PSBBQ1RJT05fTk9ORSB8fCAkcG9pbnRlcnMuc2l6ZSA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLiRlbWl0KEVWRU5UX0FDVElPTl9NT1ZFLCB7XG4gICAgICAgICAgICBhY3Rpb246ICRhY3Rpb24sXG4gICAgICAgICAgICByZWxhdGVkRXZlbnQ6IGV2ZW50LFxuICAgICAgICB9KSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvLyBQcmV2ZW50IHBhZ2Ugc2Nyb2xsaW5nLlxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBpZiAoZXZlbnQuY2hhbmdlZFRvdWNoZXMpIHtcbiAgICAgICAgICAgIEFycmF5LmZyb20oZXZlbnQuY2hhbmdlZFRvdWNoZXMpLmZvckVhY2goKHsgaWRlbnRpZmllciwgcGFnZVgsIHBhZ2VZLCB9KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgcG9pbnRlciA9ICRwb2ludGVycy5nZXQoaWRlbnRpZmllcik7XG4gICAgICAgICAgICAgICAgaWYgKHBvaW50ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmFzc2lnbihwb2ludGVyLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbmRYOiBwYWdlWCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuZFk6IHBhZ2VZLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IHsgcG9pbnRlcklkID0gMCwgcGFnZVgsIHBhZ2VZIH0gPSBldmVudDtcbiAgICAgICAgICAgIGNvbnN0IHBvaW50ZXIgPSAkcG9pbnRlcnMuZ2V0KHBvaW50ZXJJZCk7XG4gICAgICAgICAgICBpZiAocG9pbnRlcikge1xuICAgICAgICAgICAgICAgIE9iamVjdC5hc3NpZ24ocG9pbnRlciwge1xuICAgICAgICAgICAgICAgICAgICBlbmRYOiBwYWdlWCxcbiAgICAgICAgICAgICAgICAgICAgZW5kWTogcGFnZVksXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZGV0YWlsID0ge1xuICAgICAgICAgICAgYWN0aW9uOiAkYWN0aW9uLFxuICAgICAgICAgICAgcmVsYXRlZEV2ZW50OiBldmVudCxcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKCRhY3Rpb24gPT09IEFDVElPTl9UUkFOU0ZPUk0pIHtcbiAgICAgICAgICAgIGNvbnN0IHBvaW50ZXJzMiA9IG5ldyBNYXAoJHBvaW50ZXJzKTtcbiAgICAgICAgICAgIGxldCBtYXhSb3RhdGVSYXRlID0gMDtcbiAgICAgICAgICAgIGxldCBtYXhTY2FsZVJhdGUgPSAwO1xuICAgICAgICAgICAgbGV0IHJvdGF0ZSA9IDA7XG4gICAgICAgICAgICBsZXQgc2NhbGUgPSAwO1xuICAgICAgICAgICAgbGV0IGNlbnRlclggPSBldmVudC5wYWdlWDtcbiAgICAgICAgICAgIGxldCBjZW50ZXJZID0gZXZlbnQucGFnZVk7XG4gICAgICAgICAgICAkcG9pbnRlcnMuZm9yRWFjaCgocG9pbnRlciwgcG9pbnRlcklkKSA9PiB7XG4gICAgICAgICAgICAgICAgcG9pbnRlcnMyLmRlbGV0ZShwb2ludGVySWQpO1xuICAgICAgICAgICAgICAgIHBvaW50ZXJzMi5mb3JFYWNoKChwb2ludGVyMikgPT4ge1xuICAgICAgICAgICAgICAgICAgICBsZXQgeDEgPSBwb2ludGVyMi5zdGFydFggLSBwb2ludGVyLnN0YXJ0WDtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHkxID0gcG9pbnRlcjIuc3RhcnRZIC0gcG9pbnRlci5zdGFydFk7XG4gICAgICAgICAgICAgICAgICAgIGxldCB4MiA9IHBvaW50ZXIyLmVuZFggLSBwb2ludGVyLmVuZFg7XG4gICAgICAgICAgICAgICAgICAgIGxldCB5MiA9IHBvaW50ZXIyLmVuZFkgLSBwb2ludGVyLmVuZFk7XG4gICAgICAgICAgICAgICAgICAgIGxldCB6MSA9IDA7XG4gICAgICAgICAgICAgICAgICAgIGxldCB6MiA9IDA7XG4gICAgICAgICAgICAgICAgICAgIGxldCBhMSA9IDA7XG4gICAgICAgICAgICAgICAgICAgIGxldCBhMiA9IDA7XG4gICAgICAgICAgICAgICAgICAgIGlmICh4MSA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHkxIDwgMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGExID0gTWF0aC5QSSAqIDI7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICh5MSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhMSA9IE1hdGguUEk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoeDEgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhMSA9IChNYXRoLlBJIC8gMikgKyBNYXRoLmF0YW4oeTEgLyB4MSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoeDEgPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhMSA9IChNYXRoLlBJICogMS41KSArIE1hdGguYXRhbih5MSAvIHgxKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoeDIgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh5MiA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhMiA9IE1hdGguUEkgKiAyO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoeTIgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYTIgPSBNYXRoLlBJO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHgyID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYTIgPSAoTWF0aC5QSSAvIDIpICsgTWF0aC5hdGFuKHkyIC8geDIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHgyIDwgMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYTIgPSAoTWF0aC5QSSAqIDEuNSkgKyBNYXRoLmF0YW4oeTIgLyB4Mik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGEyID4gMCB8fCBhMSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJvdGF0ZVJhdGUgPSBhMiAtIGExO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYWJzUm90YXRlUmF0ZSA9IE1hdGguYWJzKHJvdGF0ZVJhdGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFic1JvdGF0ZVJhdGUgPiBtYXhSb3RhdGVSYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF4Um90YXRlUmF0ZSA9IGFic1JvdGF0ZVJhdGU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcm90YXRlID0gcm90YXRlUmF0ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjZW50ZXJYID0gKHBvaW50ZXIuc3RhcnRYICsgcG9pbnRlcjIuc3RhcnRYKSAvIDI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2VudGVyWSA9IChwb2ludGVyLnN0YXJ0WSArIHBvaW50ZXIyLnN0YXJ0WSkgLyAyO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHgxID0gTWF0aC5hYnMoeDEpO1xuICAgICAgICAgICAgICAgICAgICB5MSA9IE1hdGguYWJzKHkxKTtcbiAgICAgICAgICAgICAgICAgICAgeDIgPSBNYXRoLmFicyh4Mik7XG4gICAgICAgICAgICAgICAgICAgIHkyID0gTWF0aC5hYnMoeTIpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoeDEgPiAwICYmIHkxID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgejEgPSBNYXRoLnNxcnQoKHgxICogeDEpICsgKHkxICogeTEpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICh4MSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHoxID0geDE7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoeTEgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB6MSA9IHkxO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICh4MiA+IDAgJiYgeTIgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB6MiA9IE1hdGguc3FydCgoeDIgKiB4MikgKyAoeTIgKiB5MikpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHgyID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgejIgPSB4MjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICh5MiA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHoyID0geTI7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHoxID4gMCAmJiB6MiA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHNjYWxlUmF0ZSA9ICh6MiAtIHoxKSAvIHoxO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYWJzU2NhbGVSYXRlID0gTWF0aC5hYnMoc2NhbGVSYXRlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhYnNTY2FsZVJhdGUgPiBtYXhTY2FsZVJhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXhTY2FsZVJhdGUgPSBhYnNTY2FsZVJhdGU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NhbGUgPSBzY2FsZVJhdGU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2VudGVyWCA9IChwb2ludGVyLnN0YXJ0WCArIHBvaW50ZXIyLnN0YXJ0WCkgLyAyO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNlbnRlclkgPSAocG9pbnRlci5zdGFydFkgKyBwb2ludGVyMi5zdGFydFkpIC8gMjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb25zdCByb3RhdGFibGUgPSBtYXhSb3RhdGVSYXRlID4gMDtcbiAgICAgICAgICAgIGNvbnN0IHNjYWxhYmxlID0gbWF4U2NhbGVSYXRlID4gMDtcbiAgICAgICAgICAgIGlmIChyb3RhdGFibGUgJiYgc2NhbGFibGUpIHtcbiAgICAgICAgICAgICAgICBkZXRhaWwucm90YXRlID0gcm90YXRlO1xuICAgICAgICAgICAgICAgIGRldGFpbC5zY2FsZSA9IHNjYWxlO1xuICAgICAgICAgICAgICAgIGRldGFpbC5jZW50ZXJYID0gY2VudGVyWDtcbiAgICAgICAgICAgICAgICBkZXRhaWwuY2VudGVyWSA9IGNlbnRlclk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChyb3RhdGFibGUpIHtcbiAgICAgICAgICAgICAgICBkZXRhaWwuYWN0aW9uID0gQUNUSU9OX1JPVEFURTtcbiAgICAgICAgICAgICAgICBkZXRhaWwucm90YXRlID0gcm90YXRlO1xuICAgICAgICAgICAgICAgIGRldGFpbC5jZW50ZXJYID0gY2VudGVyWDtcbiAgICAgICAgICAgICAgICBkZXRhaWwuY2VudGVyWSA9IGNlbnRlclk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChzY2FsYWJsZSkge1xuICAgICAgICAgICAgICAgIGRldGFpbC5hY3Rpb24gPSBBQ1RJT05fU0NBTEU7XG4gICAgICAgICAgICAgICAgZGV0YWlsLnNjYWxlID0gc2NhbGU7XG4gICAgICAgICAgICAgICAgZGV0YWlsLmNlbnRlclggPSBjZW50ZXJYO1xuICAgICAgICAgICAgICAgIGRldGFpbC5jZW50ZXJZID0gY2VudGVyWTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGRldGFpbC5hY3Rpb24gPSBBQ1RJT05fTk9ORTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IFtwb2ludGVyXSA9IEFycmF5LmZyb20oJHBvaW50ZXJzLnZhbHVlcygpKTtcbiAgICAgICAgICAgIE9iamVjdC5hc3NpZ24oZGV0YWlsLCBwb2ludGVyKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBPdmVycmlkZSB0aGUgc3RhcnRpbmcgY29vcmRpbmF0ZVxuICAgICAgICAkcG9pbnRlcnMuZm9yRWFjaCgocG9pbnRlcikgPT4ge1xuICAgICAgICAgICAgcG9pbnRlci5zdGFydFggPSBwb2ludGVyLmVuZFg7XG4gICAgICAgICAgICBwb2ludGVyLnN0YXJ0WSA9IHBvaW50ZXIuZW5kWTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChkZXRhaWwuYWN0aW9uICE9PSBBQ1RJT05fTk9ORSkge1xuICAgICAgICAgICAgdGhpcy4kZW1pdChFVkVOVF9BQ1RJT04sIGRldGFpbCwge1xuICAgICAgICAgICAgICAgIGNhbmNlbGFibGU6IGZhbHNlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgJGhhbmRsZVBvaW50ZXJVcChldmVudCkge1xuICAgICAgICBjb25zdCB7ICRhY3Rpb24sICRwb2ludGVycyB9ID0gdGhpcztcbiAgICAgICAgaWYgKHRoaXMuZGlzYWJsZWQgfHwgJGFjdGlvbiA9PT0gQUNUSU9OX05PTkUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy4kZW1pdChFVkVOVF9BQ1RJT05fRU5ELCB7XG4gICAgICAgICAgICBhY3Rpb246ICRhY3Rpb24sXG4gICAgICAgICAgICByZWxhdGVkRXZlbnQ6IGV2ZW50LFxuICAgICAgICB9KSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBpZiAoZXZlbnQuY2hhbmdlZFRvdWNoZXMpIHtcbiAgICAgICAgICAgIEFycmF5LmZyb20oZXZlbnQuY2hhbmdlZFRvdWNoZXMpLmZvckVhY2goKHsgaWRlbnRpZmllciwgfSkgPT4ge1xuICAgICAgICAgICAgICAgICRwb2ludGVycy5kZWxldGUoaWRlbnRpZmllcik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IHsgcG9pbnRlcklkID0gMCB9ID0gZXZlbnQ7XG4gICAgICAgICAgICAkcG9pbnRlcnMuZGVsZXRlKHBvaW50ZXJJZCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCRwb2ludGVycy5zaXplID09PSAwKSB7XG4gICAgICAgICAgICB0aGlzLnN0eWxlLndpbGxDaGFuZ2UgPSAnJztcbiAgICAgICAgICAgIHRoaXMuJGFjdGlvbiA9IEFDVElPTl9OT05FO1xuICAgICAgICB9XG4gICAgfVxuICAgICRoYW5kbGVXaGVlbChldmVudCkge1xuICAgICAgICBpZiAodGhpcy5kaXNhYmxlZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIC8vIExpbWl0IHdoZWVsIHNwZWVkIHRvIHByZXZlbnQgem9vbSB0b28gZmFzdCAoIzIxKVxuICAgICAgICBpZiAodGhpcy4kd2hlZWxpbmcpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLiR3aGVlbGluZyA9IHRydWU7XG4gICAgICAgIC8vIERlYm91bmNlIGJ5IDUwbXNcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLiR3aGVlbGluZyA9IGZhbHNlO1xuICAgICAgICB9LCA1MCk7XG4gICAgICAgIGNvbnN0IGRlbHRhID0gZXZlbnQuZGVsdGFZID4gMCA/IC0xIDogMTtcbiAgICAgICAgY29uc3Qgc2NhbGUgPSBkZWx0YSAqIHRoaXMuc2NhbGVTdGVwO1xuICAgICAgICB0aGlzLiRlbWl0KEVWRU5UX0FDVElPTiwge1xuICAgICAgICAgICAgYWN0aW9uOiBBQ1RJT05fU0NBTEUsXG4gICAgICAgICAgICBzY2FsZSxcbiAgICAgICAgICAgIHJlbGF0ZWRFdmVudDogZXZlbnQsXG4gICAgICAgIH0sIHtcbiAgICAgICAgICAgIGNhbmNlbGFibGU6IGZhbHNlLFxuICAgICAgICB9KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2hhbmdlcyB0aGUgY3VycmVudCBhY3Rpb24gdG8gYSBuZXcgb25lLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBhY3Rpb24gVGhlIG5ldyBhY3Rpb24uXG4gICAgICogQHJldHVybnMge0Nyb3BwZXJDYW52YXN9IFJldHVybnMgYHRoaXNgIGZvciBjaGFpbmluZy5cbiAgICAgKi9cbiAgICAkc2V0QWN0aW9uKGFjdGlvbikge1xuICAgICAgICBpZiAoaXNTdHJpbmcoYWN0aW9uKSkge1xuICAgICAgICAgICAgdGhpcy4kYWN0aW9uID0gYWN0aW9uO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBHZW5lcmF0ZXMgYSByZWFsIGNhbnZhcyBlbGVtZW50LCB3aXRoIHRoZSBpbWFnZSBkcmF3IGludG8gaWYgdGhlcmUgaXMgb25lLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc10gVGhlIGF2YWlsYWJsZSBvcHRpb25zLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy53aWR0aF0gVGhlIHdpZHRoIG9mIHRoZSBjYW52YXMuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLmhlaWdodF0gVGhlIGhlaWdodCBvZiB0aGUgY2FudmFzLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IFtvcHRpb25zLmJlZm9yZURyYXddIFRoZSBmdW5jdGlvbiBjYWxsZWQgYmVmb3JlIGRyYXdpbmcgdGhlIGltYWdlIG9udG8gdGhlIGNhbnZhcy5cbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZX0gUmV0dXJucyBhIHByb21pc2UgdGhhdCByZXNvbHZlcyB0byB0aGUgZ2VuZXJhdGVkIGNhbnZhcyBlbGVtZW50LlxuICAgICAqL1xuICAgICR0b0NhbnZhcyhvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuaXNDb25uZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKCdUaGUgY3VycmVudCBlbGVtZW50IGlzIG5vdCBjb25uZWN0ZWQgdG8gdGhlIERPTS4nKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICAgICAgICBsZXQgd2lkdGggPSB0aGlzLm9mZnNldFdpZHRoO1xuICAgICAgICAgICAgbGV0IGhlaWdodCA9IHRoaXMub2Zmc2V0SGVpZ2h0O1xuICAgICAgICAgICAgbGV0IHNjYWxlID0gMTtcbiAgICAgICAgICAgIGlmIChpc1BsYWluT2JqZWN0KG9wdGlvbnMpXG4gICAgICAgICAgICAgICAgJiYgKGlzUG9zaXRpdmVOdW1iZXIob3B0aW9ucy53aWR0aCkgfHwgaXNQb3NpdGl2ZU51bWJlcihvcHRpb25zLmhlaWdodCkpKSB7XG4gICAgICAgICAgICAgICAgKHsgd2lkdGgsIGhlaWdodCB9ID0gZ2V0QWRqdXN0ZWRTaXplcyh7XG4gICAgICAgICAgICAgICAgICAgIGFzcGVjdFJhdGlvOiB3aWR0aCAvIGhlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IG9wdGlvbnMud2lkdGgsXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogb3B0aW9ucy5oZWlnaHQsXG4gICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgIHNjYWxlID0gd2lkdGggLyB0aGlzLm9mZnNldFdpZHRoO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FudmFzLndpZHRoID0gd2lkdGg7XG4gICAgICAgICAgICBjYW52YXMuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICAgICAgY29uc3QgY3JvcHBlckltYWdlID0gdGhpcy5xdWVyeVNlbGVjdG9yKHRoaXMuJGdldFRhZ05hbWVPZihDUk9QUEVSX0lNQUdFKSk7XG4gICAgICAgICAgICBpZiAoIWNyb3BwZXJJbWFnZSkge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoY2FudmFzKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjcm9wcGVySW1hZ2UuJHJlYWR5KCkudGhlbigoaW1hZ2UpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgICAgICAgICAgICAgaWYgKGNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgW2EsIGIsIGMsIGQsIGUsIGZdID0gY3JvcHBlckltYWdlLiRnZXRUcmFuc2Zvcm0oKTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IG5ld0UgPSBlO1xuICAgICAgICAgICAgICAgICAgICBsZXQgbmV3RiA9IGY7XG4gICAgICAgICAgICAgICAgICAgIGxldCBkZXN0V2lkdGggPSBpbWFnZS5uYXR1cmFsV2lkdGg7XG4gICAgICAgICAgICAgICAgICAgIGxldCBkZXN0SGVpZ2h0ID0gaW1hZ2UubmF0dXJhbEhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNjYWxlICE9PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdFICo9IHNjYWxlO1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV3RiAqPSBzY2FsZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc3RXaWR0aCAqPSBzY2FsZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc3RIZWlnaHQgKj0gc2NhbGU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2VudGVyWCA9IGRlc3RXaWR0aCAvIDI7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNlbnRlclkgPSBkZXN0SGVpZ2h0IC8gMjtcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dC5maWxsU3R5bGUgPSAndHJhbnNwYXJlbnQnO1xuICAgICAgICAgICAgICAgICAgICBjb250ZXh0LmZpbGxSZWN0KDAsIDAsIHdpZHRoLCBoZWlnaHQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXNQbGFpbk9iamVjdChvcHRpb25zKSAmJiBpc0Z1bmN0aW9uKG9wdGlvbnMuYmVmb3JlRHJhdykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnMuYmVmb3JlRHJhdy5jYWxsKHRoaXMsIGNvbnRleHQsIGNhbnZhcyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY29udGV4dC5zYXZlKCk7XG4gICAgICAgICAgICAgICAgICAgIC8vIE1vdmUgdGhlIHRyYW5zZm9ybSBvcmlnaW4gdG8gdGhlIGNlbnRlciBvZiB0aGUgaW1hZ2UuXG4gICAgICAgICAgICAgICAgICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0NTUy90cmFuc2Zvcm0tb3JpZ2luXG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQudHJhbnNsYXRlKGNlbnRlclgsIGNlbnRlclkpO1xuICAgICAgICAgICAgICAgICAgICBjb250ZXh0LnRyYW5zZm9ybShhLCBiLCBjLCBkLCBuZXdFLCBuZXdGKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gUmVzZXQgdGhlIHRyYW5zZm9ybSBvcmlnaW4gdG8gdGhlIHRvcC1sZWZ0IG9mIHRoZSBpbWFnZS5cbiAgICAgICAgICAgICAgICAgICAgY29udGV4dC50cmFuc2xhdGUoLWNlbnRlclgsIC1jZW50ZXJZKTtcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoaW1hZ2UsIDAsIDAsIGRlc3RXaWR0aCwgZGVzdEhlaWdodCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQucmVzdG9yZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXNvbHZlKGNhbnZhcyk7XG4gICAgICAgICAgICB9KS5jYXRjaChyZWplY3QpO1xuICAgICAgICB9KTtcbiAgICB9XG59XG5Dcm9wcGVyQ2FudmFzLiRuYW1lID0gQ1JPUFBFUl9DQU5WQVM7XG5Dcm9wcGVyQ2FudmFzLiR2ZXJzaW9uID0gJzIuMC4wJztcblxuZXhwb3J0IHsgQ3JvcHBlckNhbnZhcyBhcyBkZWZhdWx0IH07XG4iLCAiaW1wb3J0IENyb3BwZXJFbGVtZW50IGZyb20gJ0Bjcm9wcGVyL2VsZW1lbnQnO1xuaW1wb3J0IHsgQ1JPUFBFUl9JTUFHRSwgQ1JPUFBFUl9DQU5WQVMsIG9uLCBFVkVOVF9BQ1RJT05fU1RBUlQsIEVWRU5UX0FDVElPTl9FTkQsIEVWRU5UX0FDVElPTiwgRVZFTlRfTE9BRCwgb2ZmLCBBQ1RJT05fVFJBTlNGT1JNLCBBQ1RJT05fUk9UQVRFLCBBQ1RJT05fU0NBTEUsIEFDVElPTl9OT05FLCBDUk9QUEVSX1NFTEVDVElPTiwgQUNUSU9OX01PVkUsIG9uY2UsIEVWRU5UX0VSUk9SLCBpc0Z1bmN0aW9uLCBpc051bWJlciwgdG9BbmdsZUluUmFkaWFuLCBtdWx0aXBseU1hdHJpY2VzLCBFVkVOVF9UUkFOU0ZPUk0gfSBmcm9tICdAY3JvcHBlci91dGlscyc7XG5cbnZhciBzdHlsZSA9IGA6aG9zdHtkaXNwbGF5OmlubGluZS1ibG9ja31pbWd7ZGlzcGxheTpibG9jaztoZWlnaHQ6MTAwJTttYXgtaGVpZ2h0Om5vbmUhaW1wb3J0YW50O21heC13aWR0aDpub25lIWltcG9ydGFudDttaW4taGVpZ2h0OjAhaW1wb3J0YW50O21pbi13aWR0aDowIWltcG9ydGFudDt3aWR0aDoxMDAlfWA7XG5cbmNvbnN0IGNhbnZhc0NhY2hlID0gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IE5BVElWRV9BVFRSSUJVVEVTID0gW1xuICAgICdhbHQnLFxuICAgICdjcm9zc29yaWdpbicsXG4gICAgJ2RlY29kaW5nJyxcbiAgICAnaW1wb3J0YW5jZScsXG4gICAgJ2xvYWRpbmcnLFxuICAgICdyZWZlcnJlcnBvbGljeScsXG4gICAgJ3NpemVzJyxcbiAgICAnc3JjJyxcbiAgICAnc3Jjc2V0Jyxcbl07XG5jbGFzcyBDcm9wcGVySW1hZ2UgZXh0ZW5kcyBDcm9wcGVyRWxlbWVudCB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKC4uLmFyZ3VtZW50cyk7XG4gICAgICAgIHRoaXMuJG1hdHJpeCA9IFsxLCAwLCAwLCAxLCAwLCAwXTtcbiAgICAgICAgdGhpcy4kb25Mb2FkID0gbnVsbDtcbiAgICAgICAgdGhpcy4kb25DYW52YXNBY3Rpb24gPSBudWxsO1xuICAgICAgICB0aGlzLiRvbkNhbnZhc0FjdGlvbkVuZCA9IG51bGw7XG4gICAgICAgIHRoaXMuJG9uQ2FudmFzQWN0aW9uU3RhcnQgPSBudWxsO1xuICAgICAgICB0aGlzLiRhY3Rpb25TdGFydFRhcmdldCA9IG51bGw7XG4gICAgICAgIHRoaXMuJHN0eWxlID0gc3R5bGU7XG4gICAgICAgIHRoaXMuJGltYWdlID0gbmV3IEltYWdlKCk7XG4gICAgICAgIHRoaXMuaW5pdGlhbENlbnRlclNpemUgPSAnY29udGFpbic7XG4gICAgICAgIHRoaXMucm90YXRhYmxlID0gZmFsc2U7XG4gICAgICAgIHRoaXMuc2NhbGFibGUgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5za2V3YWJsZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLnNsb3R0YWJsZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLnRyYW5zbGF0YWJsZSA9IGZhbHNlO1xuICAgIH1cbiAgICBzZXQgJGNhbnZhcyhlbGVtZW50KSB7XG4gICAgICAgIGNhbnZhc0NhY2hlLnNldCh0aGlzLCBlbGVtZW50KTtcbiAgICB9XG4gICAgZ2V0ICRjYW52YXMoKSB7XG4gICAgICAgIHJldHVybiBjYW52YXNDYWNoZS5nZXQodGhpcyk7XG4gICAgfVxuICAgIHN0YXRpYyBnZXQgb2JzZXJ2ZWRBdHRyaWJ1dGVzKCkge1xuICAgICAgICByZXR1cm4gc3VwZXIub2JzZXJ2ZWRBdHRyaWJ1dGVzLmNvbmNhdChOQVRJVkVfQVRUUklCVVRFUywgW1xuICAgICAgICAgICAgJ2luaXRpYWwtY2VudGVyLXNpemUnLFxuICAgICAgICAgICAgJ3JvdGF0YWJsZScsXG4gICAgICAgICAgICAnc2NhbGFibGUnLFxuICAgICAgICAgICAgJ3NrZXdhYmxlJyxcbiAgICAgICAgICAgICd0cmFuc2xhdGFibGUnLFxuICAgICAgICBdKTtcbiAgICB9XG4gICAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSkge1xuICAgICAgICBpZiAoT2JqZWN0LmlzKG5ld1ZhbHVlLCBvbGRWYWx1ZSkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBzdXBlci5hdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKTtcbiAgICAgICAgLy8gSW5oZXJpdHMgdGhlIG5hdGl2ZSBhdHRyaWJ1dGVzXG4gICAgICAgIGlmIChOQVRJVkVfQVRUUklCVVRFUy5pbmNsdWRlcyhuYW1lKSkge1xuICAgICAgICAgICAgdGhpcy4kaW1hZ2Uuc2V0QXR0cmlidXRlKG5hbWUsIG5ld1ZhbHVlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAkcHJvcGVydHlDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKSB7XG4gICAgICAgIGlmIChPYmplY3QuaXMobmV3VmFsdWUsIG9sZFZhbHVlKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHN1cGVyLiRwcm9wZXJ0eUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpO1xuICAgICAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgICAgICAgIGNhc2UgJ2luaXRpYWxDZW50ZXJTaXplJzpcbiAgICAgICAgICAgICAgICB0aGlzLiRuZXh0VGljaygoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuJGNlbnRlcihuZXdWYWx1ZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG4gICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHN1cGVyLmNvbm5lY3RlZENhbGxiYWNrKCk7XG4gICAgICAgIGNvbnN0IHsgJGltYWdlIH0gPSB0aGlzO1xuICAgICAgICBjb25zdCAkY2FudmFzID0gdGhpcy5jbG9zZXN0KHRoaXMuJGdldFRhZ05hbWVPZihDUk9QUEVSX0NBTlZBUykpO1xuICAgICAgICBpZiAoJGNhbnZhcykge1xuICAgICAgICAgICAgdGhpcy4kY2FudmFzID0gJGNhbnZhcztcbiAgICAgICAgICAgIHRoaXMuJHNldFN0eWxlcyh7XG4gICAgICAgICAgICAgICAgLy8gTWFrZSBpdCBhIGJsb2NrIGVsZW1lbnQgdG8gYXZvaWQgc2lkZSBlZmZlY3RzICgjMTA3NCkuXG4gICAgICAgICAgICAgICAgZGlzcGxheTogJ2Jsb2NrJyxcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy4kb25DYW52YXNBY3Rpb25TdGFydCA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgICAgIHZhciBfYSwgX2I7XG4gICAgICAgICAgICAgICAgdGhpcy4kYWN0aW9uU3RhcnRUYXJnZXQgPSAoX2IgPSAoX2EgPSBldmVudC5kZXRhaWwpID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS5yZWxhdGVkRXZlbnQpID09PSBudWxsIHx8IF9iID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYi50YXJnZXQ7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdGhpcy4kb25DYW52YXNBY3Rpb25FbmQgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy4kYWN0aW9uU3RhcnRUYXJnZXQgPSBudWxsO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHRoaXMuJG9uQ2FudmFzQWN0aW9uID0gdGhpcy4kaGFuZGxlQWN0aW9uLmJpbmQodGhpcyk7XG4gICAgICAgICAgICBvbigkY2FudmFzLCBFVkVOVF9BQ1RJT05fU1RBUlQsIHRoaXMuJG9uQ2FudmFzQWN0aW9uU3RhcnQpO1xuICAgICAgICAgICAgb24oJGNhbnZhcywgRVZFTlRfQUNUSU9OX0VORCwgdGhpcy4kb25DYW52YXNBY3Rpb25FbmQpO1xuICAgICAgICAgICAgb24oJGNhbnZhcywgRVZFTlRfQUNUSU9OLCB0aGlzLiRvbkNhbnZhc0FjdGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy4kb25Mb2FkID0gdGhpcy4kaGFuZGxlTG9hZC5iaW5kKHRoaXMpO1xuICAgICAgICBvbigkaW1hZ2UsIEVWRU5UX0xPQUQsIHRoaXMuJG9uTG9hZCk7XG4gICAgICAgIHRoaXMuJGdldFNoYWRvd1Jvb3QoKS5hcHBlbmRDaGlsZCgkaW1hZ2UpO1xuICAgIH1cbiAgICBkaXNjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgY29uc3QgeyAkaW1hZ2UsICRjYW52YXMgfSA9IHRoaXM7XG4gICAgICAgIGlmICgkY2FudmFzKSB7XG4gICAgICAgICAgICBpZiAodGhpcy4kb25DYW52YXNBY3Rpb25TdGFydCkge1xuICAgICAgICAgICAgICAgIG9mZigkY2FudmFzLCBFVkVOVF9BQ1RJT05fU1RBUlQsIHRoaXMuJG9uQ2FudmFzQWN0aW9uU3RhcnQpO1xuICAgICAgICAgICAgICAgIHRoaXMuJG9uQ2FudmFzQWN0aW9uU3RhcnQgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuJG9uQ2FudmFzQWN0aW9uRW5kKSB7XG4gICAgICAgICAgICAgICAgb2ZmKCRjYW52YXMsIEVWRU5UX0FDVElPTl9FTkQsIHRoaXMuJG9uQ2FudmFzQWN0aW9uRW5kKTtcbiAgICAgICAgICAgICAgICB0aGlzLiRvbkNhbnZhc0FjdGlvbkVuZCA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy4kb25DYW52YXNBY3Rpb24pIHtcbiAgICAgICAgICAgICAgICBvZmYoJGNhbnZhcywgRVZFTlRfQUNUSU9OLCB0aGlzLiRvbkNhbnZhc0FjdGlvbik7XG4gICAgICAgICAgICAgICAgdGhpcy4kb25DYW52YXNBY3Rpb24gPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICgkaW1hZ2UgJiYgdGhpcy4kb25Mb2FkKSB7XG4gICAgICAgICAgICBvZmYoJGltYWdlLCBFVkVOVF9MT0FELCB0aGlzLiRvbkxvYWQpO1xuICAgICAgICAgICAgdGhpcy4kb25Mb2FkID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLiRnZXRTaGFkb3dSb290KCkucmVtb3ZlQ2hpbGQoJGltYWdlKTtcbiAgICAgICAgc3VwZXIuZGlzY29ubmVjdGVkQ2FsbGJhY2soKTtcbiAgICB9XG4gICAgJGhhbmRsZUxvYWQoKSB7XG4gICAgICAgIGNvbnN0IHsgJGltYWdlIH0gPSB0aGlzO1xuICAgICAgICB0aGlzLiRzZXRTdHlsZXMoe1xuICAgICAgICAgICAgd2lkdGg6ICRpbWFnZS5uYXR1cmFsV2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6ICRpbWFnZS5uYXR1cmFsSGVpZ2h0LFxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKHRoaXMuJGNhbnZhcykge1xuICAgICAgICAgICAgdGhpcy4kY2VudGVyKHRoaXMuaW5pdGlhbENlbnRlclNpemUpO1xuICAgICAgICB9XG4gICAgfVxuICAgICRoYW5kbGVBY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgaWYgKHRoaXMuaGlkZGVuIHx8ICEodGhpcy5yb3RhdGFibGUgfHwgdGhpcy5zY2FsYWJsZSB8fCB0aGlzLnRyYW5zbGF0YWJsZSkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB7ICRjYW52YXMgfSA9IHRoaXM7XG4gICAgICAgIGNvbnN0IHsgZGV0YWlsIH0gPSBldmVudDtcbiAgICAgICAgaWYgKGRldGFpbCkge1xuICAgICAgICAgICAgY29uc3QgeyByZWxhdGVkRXZlbnQgfSA9IGRldGFpbDtcbiAgICAgICAgICAgIGxldCB7IGFjdGlvbiB9ID0gZGV0YWlsO1xuICAgICAgICAgICAgaWYgKGFjdGlvbiA9PT0gQUNUSU9OX1RSQU5TRk9STSAmJiAoIXRoaXMucm90YXRhYmxlIHx8ICF0aGlzLnNjYWxhYmxlKSkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnJvdGF0YWJsZSkge1xuICAgICAgICAgICAgICAgICAgICBhY3Rpb24gPSBBQ1RJT05fUk9UQVRFO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmICh0aGlzLnNjYWxhYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbiA9IEFDVElPTl9TQ0FMRTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbiA9IEFDVElPTl9OT05FO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN3aXRjaCAoYWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgY2FzZSBBQ1RJT05fTU9WRTpcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMudHJhbnNsYXRhYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgJHNlbGVjdGlvbiA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVsYXRlZEV2ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNlbGVjdGlvbiA9IHJlbGF0ZWRFdmVudC50YXJnZXQuY2xvc2VzdCh0aGlzLiRnZXRUYWdOYW1lT2YoQ1JPUFBFUl9TRUxFQ1RJT04pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghJHNlbGVjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzZWxlY3Rpb24gPSAkY2FudmFzLnF1ZXJ5U2VsZWN0b3IodGhpcy4kZ2V0VGFnTmFtZU9mKENST1BQRVJfU0VMRUNUSU9OKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoJHNlbGVjdGlvbiAmJiAkc2VsZWN0aW9uLm11bHRpcGxlICYmICEkc2VsZWN0aW9uLmFjdGl2ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzZWxlY3Rpb24gPSAkY2FudmFzLnF1ZXJ5U2VsZWN0b3IoYCR7dGhpcy4kZ2V0VGFnTmFtZU9mKENST1BQRVJfU0VMRUNUSU9OKX1bYWN0aXZlXWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEkc2VsZWN0aW9uIHx8ICRzZWxlY3Rpb24uaGlkZGVuIHx8ICEkc2VsZWN0aW9uLm1vdmFibGUgfHwgJHNlbGVjdGlvbi5keW5hbWljXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfHwgISh0aGlzLiRhY3Rpb25TdGFydFRhcmdldCAmJiAkc2VsZWN0aW9uLmNvbnRhaW5zKHRoaXMuJGFjdGlvblN0YXJ0VGFyZ2V0KSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLiRtb3ZlKGRldGFpbC5lbmRYIC0gZGV0YWlsLnN0YXJ0WCwgZGV0YWlsLmVuZFkgLSBkZXRhaWwuc3RhcnRZKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIEFDVElPTl9ST1RBVEU6XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnJvdGF0YWJsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlbGF0ZWRFdmVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHsgeCwgeSB9ID0gdGhpcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLiRyb3RhdGUoZGV0YWlsLnJvdGF0ZSwgcmVsYXRlZEV2ZW50LmNsaWVudFggLSB4LCByZWxhdGVkRXZlbnQuY2xpZW50WSAtIHkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy4kcm90YXRlKGRldGFpbC5yb3RhdGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgQUNUSU9OX1NDQUxFOlxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5zY2FsYWJsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlbGF0ZWRFdmVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0ICRzZWxlY3Rpb24gPSByZWxhdGVkRXZlbnQudGFyZ2V0LmNsb3Nlc3QodGhpcy4kZ2V0VGFnTmFtZU9mKENST1BQRVJfU0VMRUNUSU9OKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEkc2VsZWN0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHx8ICEkc2VsZWN0aW9uLnpvb21hYmxlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHx8ICgkc2VsZWN0aW9uLnpvb21hYmxlICYmICRzZWxlY3Rpb24uZHluYW1pYykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgeyB4LCB5IH0gPSB0aGlzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLiR6b29tKGRldGFpbC5zY2FsZSwgcmVsYXRlZEV2ZW50LmNsaWVudFggLSB4LCByZWxhdGVkRXZlbnQuY2xpZW50WSAtIHkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuJHpvb20oZGV0YWlsLnNjYWxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIEFDVElPTl9UUkFOU0ZPUk06XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnJvdGF0YWJsZSAmJiB0aGlzLnNjYWxhYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB7IHJvdGF0ZSB9ID0gZGV0YWlsO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHsgc2NhbGUgfSA9IGRldGFpbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzY2FsZSA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY2FsZSA9IDEgLyAoMSAtIHNjYWxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjYWxlICs9IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjb3MgPSBNYXRoLmNvcyhyb3RhdGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2luID0gTWF0aC5zaW4ocm90YXRlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IFtzY2FsZVgsIHNrZXdZLCBza2V3WCwgc2NhbGVZXSA9IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb3MgKiBzY2FsZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaW4gKiBzY2FsZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAtc2luICogc2NhbGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29zICogc2NhbGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlbGF0ZWRFdmVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNsaWVudFJlY3QgPSB0aGlzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHggPSByZWxhdGVkRXZlbnQuY2xpZW50WCAtIGNsaWVudFJlY3QueDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB5ID0gcmVsYXRlZEV2ZW50LmNsaWVudFkgLSBjbGllbnRSZWN0Lnk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgW2EsIGIsIGMsIGRdID0gdGhpcy4kbWF0cml4O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG9yaWdpblggPSBjbGllbnRSZWN0LndpZHRoIC8gMjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBvcmlnaW5ZID0gY2xpZW50UmVjdC5oZWlnaHQgLyAyO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG1vdmVYID0geCAtIG9yaWdpblg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbW92ZVkgPSB5IC0gb3JpZ2luWTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0cmFuc2xhdGVYID0gKChtb3ZlWCAqIGQpIC0gKGMgKiBtb3ZlWSkpIC8gKChhICogZCkgLSAoYyAqIGIpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0cmFuc2xhdGVZID0gKChtb3ZlWSAqIGEpIC0gKGIgKiBtb3ZlWCkpIC8gKChhICogZCkgLSAoYyAqIGIpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKiBFcXVhbHMgdG9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKiB0aGlzLiRyb3RhdGUocm90YXRlLCB4LCB5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKiB0aGlzLiRzY2FsZShzY2FsZSwgeCwgeSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy4kdHJhbnNmb3JtKHNjYWxlWCwgc2tld1ksIHNrZXdYLCBzY2FsZVksIHRyYW5zbGF0ZVggKiAoMSAtIHNjYWxlWCkgKyB0cmFuc2xhdGVZICogc2tld1gsIHRyYW5zbGF0ZVkgKiAoMSAtIHNjYWxlWSkgKyB0cmFuc2xhdGVYICogc2tld1kpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICogRXF1YWxzIHRvXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICogdGhpcy4kcm90YXRlKHJvdGF0ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICogdGhpcy4kc2NhbGUoc2NhbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuJHRyYW5zZm9ybShzY2FsZVgsIHNrZXdZLCBza2V3WCwgc2NhbGVZLCAwLCAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBEZWZlcnMgdGhlIGNhbGxiYWNrIHRvIGV4ZWN1dGUgYWZ0ZXIgc3VjY2Vzc2Z1bGx5IGxvYWRpbmcgdGhlIGltYWdlLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IFtjYWxsYmFja10gVGhlIGNhbGxiYWNrIHRvIGV4ZWN1dGUgYWZ0ZXIgc3VjY2Vzc2Z1bGx5IGxvYWRpbmcgdGhlIGltYWdlLlxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlfSBSZXR1cm5zIGEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHRvIHRoZSBpbWFnZSBlbGVtZW50LlxuICAgICAqL1xuICAgICRyZWFkeShjYWxsYmFjaykge1xuICAgICAgICBjb25zdCB7ICRpbWFnZSB9ID0gdGhpcztcbiAgICAgICAgY29uc3QgcHJvbWlzZSA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGVycm9yID0gbmV3IEVycm9yKCdGYWlsZWQgdG8gbG9hZCB0aGUgaW1hZ2Ugc291cmNlJyk7XG4gICAgICAgICAgICBpZiAoJGltYWdlLmNvbXBsZXRlKSB7XG4gICAgICAgICAgICAgICAgaWYgKCRpbWFnZS5uYXR1cmFsV2lkdGggPiAwICYmICRpbWFnZS5uYXR1cmFsSGVpZ2h0ID4gMCkge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCRpbWFnZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IG9uTG9hZCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby11c2UtYmVmb3JlLWRlZmluZVxuICAgICAgICAgICAgICAgICAgICBvZmYoJGltYWdlLCBFVkVOVF9FUlJPUiwgb25FcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoJGltYWdlKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGNvbnN0IG9uRXJyb3IgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIG9mZigkaW1hZ2UsIEVWRU5UX0xPQUQsIG9uTG9hZCk7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBvbmNlKCRpbWFnZSwgRVZFTlRfTE9BRCwgb25Mb2FkKTtcbiAgICAgICAgICAgICAgICBvbmNlKCRpbWFnZSwgRVZFTlRfRVJST1IsIG9uRXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKGlzRnVuY3Rpb24oY2FsbGJhY2spKSB7XG4gICAgICAgICAgICBwcm9taXNlLnRoZW4oKGltYWdlKSA9PiB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soaW1hZ2UpO1xuICAgICAgICAgICAgICAgIHJldHVybiBpbWFnZTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBbGlnbnMgdGhlIGltYWdlIHRvIHRoZSBjZW50ZXIgb2YgaXRzIHBhcmVudCBlbGVtZW50LlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBbc2l6ZV0gVGhlIHNpemUgb2YgdGhlIGltYWdlLlxuICAgICAqIEByZXR1cm5zIHtDcm9wcGVySW1hZ2V9IFJldHVybnMgYHRoaXNgIGZvciBjaGFpbmluZy5cbiAgICAgKi9cbiAgICAkY2VudGVyKHNpemUpIHtcbiAgICAgICAgY29uc3QgeyBwYXJlbnRFbGVtZW50IH0gPSB0aGlzO1xuICAgICAgICBpZiAoIXBhcmVudEVsZW1lbnQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNvbnRhaW5lciA9IHBhcmVudEVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIGNvbnN0IGNvbnRhaW5lcldpZHRoID0gY29udGFpbmVyLndpZHRoO1xuICAgICAgICBjb25zdCBjb250YWluZXJIZWlnaHQgPSBjb250YWluZXIuaGVpZ2h0O1xuICAgICAgICBjb25zdCB7IHgsIHksIHdpZHRoLCBoZWlnaHQsIH0gPSB0aGlzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICBjb25zdCBzdGFydFggPSB4ICsgKHdpZHRoIC8gMik7XG4gICAgICAgIGNvbnN0IHN0YXJ0WSA9IHkgKyAoaGVpZ2h0IC8gMik7XG4gICAgICAgIGNvbnN0IGVuZFggPSBjb250YWluZXIueCArIChjb250YWluZXJXaWR0aCAvIDIpO1xuICAgICAgICBjb25zdCBlbmRZID0gY29udGFpbmVyLnkgKyAoY29udGFpbmVySGVpZ2h0IC8gMik7XG4gICAgICAgIHRoaXMuJG1vdmUoZW5kWCAtIHN0YXJ0WCwgZW5kWSAtIHN0YXJ0WSk7XG4gICAgICAgIGlmIChzaXplICYmICh3aWR0aCAhPT0gY29udGFpbmVyV2lkdGggfHwgaGVpZ2h0ICE9PSBjb250YWluZXJIZWlnaHQpKSB7XG4gICAgICAgICAgICBjb25zdCBzY2FsZVggPSBjb250YWluZXJXaWR0aCAvIHdpZHRoO1xuICAgICAgICAgICAgY29uc3Qgc2NhbGVZID0gY29udGFpbmVySGVpZ2h0IC8gaGVpZ2h0O1xuICAgICAgICAgICAgc3dpdGNoIChzaXplKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAnY292ZXInOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLiRzY2FsZShNYXRoLm1heChzY2FsZVgsIHNjYWxlWSkpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdjb250YWluJzpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy4kc2NhbGUoTWF0aC5taW4oc2NhbGVYLCBzY2FsZVkpKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIE1vdmVzIHRoZSBpbWFnZS5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0geCBUaGUgbW92aW5nIGRpc3RhbmNlIGluIHRoZSBob3Jpem9udGFsIGRpcmVjdGlvbi5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW3ldIFRoZSBtb3ZpbmcgZGlzdGFuY2UgaW4gdGhlIHZlcnRpY2FsIGRpcmVjdGlvbi5cbiAgICAgKiBAcmV0dXJucyB7Q3JvcHBlckltYWdlfSBSZXR1cm5zIGB0aGlzYCBmb3IgY2hhaW5pbmcuXG4gICAgICovXG4gICAgJG1vdmUoeCwgeSA9IHgpIHtcbiAgICAgICAgaWYgKHRoaXMudHJhbnNsYXRhYmxlICYmIGlzTnVtYmVyKHgpICYmIGlzTnVtYmVyKHkpKSB7XG4gICAgICAgICAgICBjb25zdCBbYSwgYiwgYywgZF0gPSB0aGlzLiRtYXRyaXg7XG4gICAgICAgICAgICBjb25zdCBlID0gKCh4ICogZCkgLSAoYyAqIHkpKSAvICgoYSAqIGQpIC0gKGMgKiBiKSk7XG4gICAgICAgICAgICBjb25zdCBmID0gKCh5ICogYSkgLSAoYiAqIHgpKSAvICgoYSAqIGQpIC0gKGMgKiBiKSk7XG4gICAgICAgICAgICB0aGlzLiR0cmFuc2xhdGUoZSwgZik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIE1vdmVzIHRoZSBpbWFnZSB0byBhIHNwZWNpZmljIHBvc2l0aW9uLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB4IFRoZSBuZXcgcG9zaXRpb24gaW4gdGhlIGhvcml6b250YWwgZGlyZWN0aW9uLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbeV0gVGhlIG5ldyBwb3NpdGlvbiBpbiB0aGUgdmVydGljYWwgZGlyZWN0aW9uLlxuICAgICAqIEByZXR1cm5zIHtDcm9wcGVySW1hZ2V9IFJldHVybnMgYHRoaXNgIGZvciBjaGFpbmluZy5cbiAgICAgKi9cbiAgICAkbW92ZVRvKHgsIHkgPSB4KSB7XG4gICAgICAgIGlmICh0aGlzLnRyYW5zbGF0YWJsZSAmJiBpc051bWJlcih4KSAmJiBpc051bWJlcih5KSkge1xuICAgICAgICAgICAgY29uc3QgW2EsIGIsIGMsIGRdID0gdGhpcy4kbWF0cml4O1xuICAgICAgICAgICAgY29uc3QgZSA9ICgoeCAqIGQpIC0gKGMgKiB5KSkgLyAoKGEgKiBkKSAtIChjICogYikpO1xuICAgICAgICAgICAgY29uc3QgZiA9ICgoeSAqIGEpIC0gKGIgKiB4KSkgLyAoKGEgKiBkKSAtIChjICogYikpO1xuICAgICAgICAgICAgdGhpcy4kc2V0VHJhbnNmb3JtKGEsIGIsIGMsIGQsIGUsIGYpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSb3RhdGVzIHRoZSBpbWFnZS5cbiAgICAgKiB7QGxpbmsgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQ1NTL3RyYW5zZm9ybS1mdW5jdGlvbi9yb3RhdGV9XG4gICAgICoge0BsaW5rIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9DYW52YXNSZW5kZXJpbmdDb250ZXh0MkQvcm90YXRlfVxuICAgICAqIEBwYXJhbSB7bnVtYmVyfHN0cmluZ30gYW5nbGUgVGhlIHJvdGF0aW9uIGFuZ2xlIChpbiByYWRpYW5zKS5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW3hdIFRoZSByb3RhdGlvbiBvcmlnaW4gaW4gdGhlIGhvcml6b250YWwsIGRlZmF1bHRzIHRvIHRoZSBjZW50ZXIgb2YgdGhlIGltYWdlLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbeV0gVGhlIHJvdGF0aW9uIG9yaWdpbiBpbiB0aGUgdmVydGljYWwsIGRlZmF1bHRzIHRvIHRoZSBjZW50ZXIgb2YgdGhlIGltYWdlLlxuICAgICAqIEByZXR1cm5zIHtDcm9wcGVySW1hZ2V9IFJldHVybnMgYHRoaXNgIGZvciBjaGFpbmluZy5cbiAgICAgKi9cbiAgICAkcm90YXRlKGFuZ2xlLCB4LCB5KSB7XG4gICAgICAgIGlmICh0aGlzLnJvdGF0YWJsZSkge1xuICAgICAgICAgICAgY29uc3QgcmFkaWFuID0gdG9BbmdsZUluUmFkaWFuKGFuZ2xlKTtcbiAgICAgICAgICAgIGNvbnN0IGNvcyA9IE1hdGguY29zKHJhZGlhbik7XG4gICAgICAgICAgICBjb25zdCBzaW4gPSBNYXRoLnNpbihyYWRpYW4pO1xuICAgICAgICAgICAgY29uc3QgW3NjYWxlWCwgc2tld1ksIHNrZXdYLCBzY2FsZVldID0gW2Nvcywgc2luLCAtc2luLCBjb3NdO1xuICAgICAgICAgICAgaWYgKGlzTnVtYmVyKHgpICYmIGlzTnVtYmVyKHkpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgW2EsIGIsIGMsIGRdID0gdGhpcy4kbWF0cml4O1xuICAgICAgICAgICAgICAgIGNvbnN0IHsgd2lkdGgsIGhlaWdodCB9ID0gdGhpcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgICAgICAgICBjb25zdCBvcmlnaW5YID0gd2lkdGggLyAyO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9yaWdpblkgPSBoZWlnaHQgLyAyO1xuICAgICAgICAgICAgICAgIGNvbnN0IG1vdmVYID0geCAtIG9yaWdpblg7XG4gICAgICAgICAgICAgICAgY29uc3QgbW92ZVkgPSB5IC0gb3JpZ2luWTtcbiAgICAgICAgICAgICAgICBjb25zdCB0cmFuc2xhdGVYID0gKChtb3ZlWCAqIGQpIC0gKGMgKiBtb3ZlWSkpIC8gKChhICogZCkgLSAoYyAqIGIpKTtcbiAgICAgICAgICAgICAgICBjb25zdCB0cmFuc2xhdGVZID0gKChtb3ZlWSAqIGEpIC0gKGIgKiBtb3ZlWCkpIC8gKChhICogZCkgLSAoYyAqIGIpKTtcbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBFcXVhbHMgdG9cbiAgICAgICAgICAgICAgICAgKiB0aGlzLiR0cmFuc2xhdGUodHJhbnNsYXRlWCwgdHJhbnNsYXRlWCk7XG4gICAgICAgICAgICAgICAgICogdGhpcy4kcm90YXRlKGFuZ2xlKTtcbiAgICAgICAgICAgICAgICAgKiB0aGlzLiR0cmFuc2xhdGUoLXRyYW5zbGF0ZVgsIC10cmFuc2xhdGVYKTtcbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICB0aGlzLiR0cmFuc2Zvcm0oc2NhbGVYLCBza2V3WSwgc2tld1gsIHNjYWxlWSwgdHJhbnNsYXRlWCAqICgxIC0gc2NhbGVYKSAtIHRyYW5zbGF0ZVkgKiBza2V3WCwgdHJhbnNsYXRlWSAqICgxIC0gc2NhbGVZKSAtIHRyYW5zbGF0ZVggKiBza2V3WSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLiR0cmFuc2Zvcm0oc2NhbGVYLCBza2V3WSwgc2tld1gsIHNjYWxlWSwgMCwgMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFpvb21zIHRoZSBpbWFnZS5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gc2NhbGUgVGhlIHpvb20gZmFjdG9yLiBQb3NpdGl2ZSBudW1iZXJzIGZvciB6b29taW5nIGluLCBhbmQgbmVnYXRpdmUgbnVtYmVycyBmb3Igem9vbWluZyBvdXQuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFt4XSBUaGUgem9vbSBvcmlnaW4gaW4gdGhlIGhvcml6b250YWwsIGRlZmF1bHRzIHRvIHRoZSBjZW50ZXIgb2YgdGhlIGltYWdlLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbeV0gVGhlIHpvb20gb3JpZ2luIGluIHRoZSB2ZXJ0aWNhbCwgZGVmYXVsdHMgdG8gdGhlIGNlbnRlciBvZiB0aGUgaW1hZ2UuXG4gICAgICogQHJldHVybnMge0Nyb3BwZXJJbWFnZX0gUmV0dXJucyBgdGhpc2AgZm9yIGNoYWluaW5nLlxuICAgICAqL1xuICAgICR6b29tKHNjYWxlLCB4LCB5KSB7XG4gICAgICAgIGlmICghdGhpcy5zY2FsYWJsZSB8fCBzY2FsZSA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNjYWxlIDwgMCkge1xuICAgICAgICAgICAgc2NhbGUgPSAxIC8gKDEgLSBzY2FsZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBzY2FsZSArPSAxO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpc051bWJlcih4KSAmJiBpc051bWJlcih5KSkge1xuICAgICAgICAgICAgY29uc3QgW2EsIGIsIGMsIGRdID0gdGhpcy4kbWF0cml4O1xuICAgICAgICAgICAgY29uc3QgeyB3aWR0aCwgaGVpZ2h0IH0gPSB0aGlzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICAgICAgY29uc3Qgb3JpZ2luWCA9IHdpZHRoIC8gMjtcbiAgICAgICAgICAgIGNvbnN0IG9yaWdpblkgPSBoZWlnaHQgLyAyO1xuICAgICAgICAgICAgY29uc3QgbW92ZVggPSB4IC0gb3JpZ2luWDtcbiAgICAgICAgICAgIGNvbnN0IG1vdmVZID0geSAtIG9yaWdpblk7XG4gICAgICAgICAgICBjb25zdCB0cmFuc2xhdGVYID0gKChtb3ZlWCAqIGQpIC0gKGMgKiBtb3ZlWSkpIC8gKChhICogZCkgLSAoYyAqIGIpKTtcbiAgICAgICAgICAgIGNvbnN0IHRyYW5zbGF0ZVkgPSAoKG1vdmVZICogYSkgLSAoYiAqIG1vdmVYKSkgLyAoKGEgKiBkKSAtIChjICogYikpO1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBFcXVhbHMgdG9cbiAgICAgICAgICAgICAqIHRoaXMuJHRyYW5zbGF0ZSh0cmFuc2xhdGVYLCB0cmFuc2xhdGVYKTtcbiAgICAgICAgICAgICAqIHRoaXMuJHNjYWxlKHNjYWxlKTtcbiAgICAgICAgICAgICAqIHRoaXMuJHRyYW5zbGF0ZSgtdHJhbnNsYXRlWCwgLXRyYW5zbGF0ZVgpO1xuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB0aGlzLiR0cmFuc2Zvcm0oc2NhbGUsIDAsIDAsIHNjYWxlLCB0cmFuc2xhdGVYICogKDEgLSBzY2FsZSksIHRyYW5zbGF0ZVkgKiAoMSAtIHNjYWxlKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLiRzY2FsZShzY2FsZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNjYWxlcyB0aGUgaW1hZ2UuXG4gICAgICoge0BsaW5rIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0NTUy90cmFuc2Zvcm0tZnVuY3Rpb24vc2NhbGV9XG4gICAgICoge0BsaW5rIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9DYW52YXNSZW5kZXJpbmdDb250ZXh0MkQvc2NhbGV9XG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHggVGhlIHNjYWxpbmcgZmFjdG9yIGluIHRoZSBob3Jpem9udGFsIGRpcmVjdGlvbi5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW3ldIFRoZSBzY2FsaW5nIGZhY3RvciBpbiB0aGUgdmVydGljYWwgZGlyZWN0aW9uLlxuICAgICAqIEByZXR1cm5zIHtDcm9wcGVySW1hZ2V9IFJldHVybnMgYHRoaXNgIGZvciBjaGFpbmluZy5cbiAgICAgKi9cbiAgICAkc2NhbGUoeCwgeSA9IHgpIHtcbiAgICAgICAgaWYgKHRoaXMuc2NhbGFibGUpIHtcbiAgICAgICAgICAgIHRoaXMuJHRyYW5zZm9ybSh4LCAwLCAwLCB5LCAwLCAwKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogU2tld3MgdGhlIGltYWdlLlxuICAgICAqIHtAbGluayBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9DU1MvdHJhbnNmb3JtLWZ1bmN0aW9uL3NrZXd9XG4gICAgICoge0BsaW5rIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9DYW52YXNSZW5kZXJpbmdDb250ZXh0MkQvdHJhbnNmb3JtfVxuICAgICAqIEBwYXJhbSB7bnVtYmVyfHN0cmluZ30geCBUaGUgc2tld2luZyBhbmdsZSBpbiB0aGUgaG9yaXpvbnRhbCBkaXJlY3Rpb24uXG4gICAgICogQHBhcmFtIHtudW1iZXJ8c3RyaW5nfSBbeV0gVGhlIHNrZXdpbmcgYW5nbGUgaW4gdGhlIHZlcnRpY2FsIGRpcmVjdGlvbi5cbiAgICAgKiBAcmV0dXJucyB7Q3JvcHBlckltYWdlfSBSZXR1cm5zIGB0aGlzYCBmb3IgY2hhaW5pbmcuXG4gICAgICovXG4gICAgJHNrZXcoeCwgeSA9IDApIHtcbiAgICAgICAgaWYgKHRoaXMuc2tld2FibGUpIHtcbiAgICAgICAgICAgIGNvbnN0IHJhZGlhblggPSB0b0FuZ2xlSW5SYWRpYW4oeCk7XG4gICAgICAgICAgICBjb25zdCByYWRpYW5ZID0gdG9BbmdsZUluUmFkaWFuKHkpO1xuICAgICAgICAgICAgdGhpcy4kdHJhbnNmb3JtKDEsIE1hdGgudGFuKHJhZGlhblkpLCBNYXRoLnRhbihyYWRpYW5YKSwgMSwgMCwgMCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFRyYW5zbGF0ZXMgdGhlIGltYWdlLlxuICAgICAqIHtAbGluayBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9DU1MvdHJhbnNmb3JtLWZ1bmN0aW9uL3RyYW5zbGF0ZX1cbiAgICAgKiB7QGxpbmsgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0NhbnZhc1JlbmRlcmluZ0NvbnRleHQyRC90cmFuc2xhdGV9XG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHggVGhlIHRyYW5zbGF0aW5nIGRpc3RhbmNlIGluIHRoZSBob3Jpem9udGFsIGRpcmVjdGlvbi5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW3ldIFRoZSB0cmFuc2xhdGluZyBkaXN0YW5jZSBpbiB0aGUgdmVydGljYWwgZGlyZWN0aW9uLlxuICAgICAqIEByZXR1cm5zIHtDcm9wcGVySW1hZ2V9IFJldHVybnMgYHRoaXNgIGZvciBjaGFpbmluZy5cbiAgICAgKi9cbiAgICAkdHJhbnNsYXRlKHgsIHkgPSB4KSB7XG4gICAgICAgIGlmICh0aGlzLnRyYW5zbGF0YWJsZSAmJiBpc051bWJlcih4KSAmJiBpc051bWJlcih5KSkge1xuICAgICAgICAgICAgdGhpcy4kdHJhbnNmb3JtKDEsIDAsIDAsIDEsIHgsIHkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBUcmFuc2Zvcm1zIHRoZSBpbWFnZS5cbiAgICAgKiB7QGxpbmsgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQ1NTL3RyYW5zZm9ybS1mdW5jdGlvbi9tYXRyaXh9XG4gICAgICoge0BsaW5rIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9DYW52YXNSZW5kZXJpbmdDb250ZXh0MkQvdHJhbnNmb3JtfVxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBhIFRoZSBzY2FsaW5nIGZhY3RvciBpbiB0aGUgaG9yaXpvbnRhbCBkaXJlY3Rpb24uXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGIgVGhlIHNrZXdpbmcgYW5nbGUgaW4gdGhlIHZlcnRpY2FsIGRpcmVjdGlvbi5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gYyBUaGUgc2tld2luZyBhbmdsZSBpbiB0aGUgaG9yaXpvbnRhbCBkaXJlY3Rpb24uXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGQgVGhlIHNjYWxpbmcgZmFjdG9yIGluIHRoZSB2ZXJ0aWNhbCBkaXJlY3Rpb24uXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGUgVGhlIHRyYW5zbGF0aW5nIGRpc3RhbmNlIGluIHRoZSBob3Jpem9udGFsIGRpcmVjdGlvbi5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gZiBUaGUgdHJhbnNsYXRpbmcgZGlzdGFuY2UgaW4gdGhlIHZlcnRpY2FsIGRpcmVjdGlvbi5cbiAgICAgKiBAcmV0dXJucyB7Q3JvcHBlckltYWdlfSBSZXR1cm5zIGB0aGlzYCBmb3IgY2hhaW5pbmcuXG4gICAgICovXG4gICAgJHRyYW5zZm9ybShhLCBiLCBjLCBkLCBlLCBmKSB7XG4gICAgICAgIGlmIChpc051bWJlcihhKVxuICAgICAgICAgICAgJiYgaXNOdW1iZXIoYilcbiAgICAgICAgICAgICYmIGlzTnVtYmVyKGMpXG4gICAgICAgICAgICAmJiBpc051bWJlcihkKVxuICAgICAgICAgICAgJiYgaXNOdW1iZXIoZSlcbiAgICAgICAgICAgICYmIGlzTnVtYmVyKGYpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy4kc2V0VHJhbnNmb3JtKG11bHRpcGx5TWF0cmljZXModGhpcy4kbWF0cml4LCBbYSwgYiwgYywgZCwgZSwgZl0pKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmVzZXRzIChvdmVycmlkZXMpIHRoZSBjdXJyZW50IHRyYW5zZm9ybSB0byB0aGUgc3BlY2lmaWMgaWRlbnRpdHkgbWF0cml4LlxuICAgICAqIHtAbGluayBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEL3NldFRyYW5zZm9ybX1cbiAgICAgKiBAcGFyYW0ge251bWJlcnxBcnJheX0gYSBUaGUgc2NhbGluZyBmYWN0b3IgaW4gdGhlIGhvcml6b250YWwgZGlyZWN0aW9uLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBiIFRoZSBza2V3aW5nIGFuZ2xlIGluIHRoZSB2ZXJ0aWNhbCBkaXJlY3Rpb24uXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGMgVGhlIHNrZXdpbmcgYW5nbGUgaW4gdGhlIGhvcml6b250YWwgZGlyZWN0aW9uLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBkIFRoZSBzY2FsaW5nIGZhY3RvciBpbiB0aGUgdmVydGljYWwgZGlyZWN0aW9uLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBlIFRoZSB0cmFuc2xhdGluZyBkaXN0YW5jZSBpbiB0aGUgaG9yaXpvbnRhbCBkaXJlY3Rpb24uXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGYgVGhlIHRyYW5zbGF0aW5nIGRpc3RhbmNlIGluIHRoZSB2ZXJ0aWNhbCBkaXJlY3Rpb24uXG4gICAgICogQHJldHVybnMge0Nyb3BwZXJJbWFnZX0gUmV0dXJucyBgdGhpc2AgZm9yIGNoYWluaW5nLlxuICAgICAqL1xuICAgICRzZXRUcmFuc2Zvcm0oYSwgYiwgYywgZCwgZSwgZikge1xuICAgICAgICBpZiAodGhpcy5yb3RhdGFibGUgfHwgdGhpcy5zY2FsYWJsZSB8fCB0aGlzLnNrZXdhYmxlIHx8IHRoaXMudHJhbnNsYXRhYmxlKSB7XG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShhKSkge1xuICAgICAgICAgICAgICAgIFthLCBiLCBjLCBkLCBlLCBmXSA9IGE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaXNOdW1iZXIoYSlcbiAgICAgICAgICAgICAgICAmJiBpc051bWJlcihiKVxuICAgICAgICAgICAgICAgICYmIGlzTnVtYmVyKGMpXG4gICAgICAgICAgICAgICAgJiYgaXNOdW1iZXIoZClcbiAgICAgICAgICAgICAgICAmJiBpc051bWJlcihlKVxuICAgICAgICAgICAgICAgICYmIGlzTnVtYmVyKGYpKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb2xkTWF0cml4ID0gWy4uLnRoaXMuJG1hdHJpeF07XG4gICAgICAgICAgICAgICAgY29uc3QgbmV3TWF0cml4ID0gW2EsIGIsIGMsIGQsIGUsIGZdO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLiRlbWl0KEVWRU5UX1RSQU5TRk9STSwge1xuICAgICAgICAgICAgICAgICAgICBtYXRyaXg6IG5ld01hdHJpeCxcbiAgICAgICAgICAgICAgICAgICAgb2xkTWF0cml4LFxuICAgICAgICAgICAgICAgIH0pID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy4kbWF0cml4ID0gbmV3TWF0cml4O1xuICAgICAgICAgICAgICAgIHRoaXMuc3R5bGUudHJhbnNmb3JtID0gYG1hdHJpeCgke25ld01hdHJpeC5qb2luKCcsICcpfSlgO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXRyaWV2ZXMgdGhlIGN1cnJlbnQgdHJhbnNmb3JtYXRpb24gbWF0cml4IGJlaW5nIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQuXG4gICAgICoge0BsaW5rIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9DYW52YXNSZW5kZXJpbmdDb250ZXh0MkQvZ2V0VHJhbnNmb3JtfVxuICAgICAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyB0aGUgcmVhZG9ubHkgdHJhbnNmb3JtYXRpb24gbWF0cml4LlxuICAgICAqL1xuICAgICRnZXRUcmFuc2Zvcm0oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLiRtYXRyaXguc2xpY2UoKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmVzZXRzIHRoZSBjdXJyZW50IHRyYW5zZm9ybSB0byB0aGUgaW5pdGlhbCBpZGVudGl0eSBtYXRyaXguXG4gICAgICoge0BsaW5rIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9DYW52YXNSZW5kZXJpbmdDb250ZXh0MkQvcmVzZXRUcmFuc2Zvcm19XG4gICAgICogQHJldHVybnMge0Nyb3BwZXJJbWFnZX0gUmV0dXJucyBgdGhpc2AgZm9yIGNoYWluaW5nLlxuICAgICAqL1xuICAgICRyZXNldFRyYW5zZm9ybSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuJHNldFRyYW5zZm9ybShbMSwgMCwgMCwgMSwgMCwgMF0pO1xuICAgIH1cbn1cbkNyb3BwZXJJbWFnZS4kbmFtZSA9IENST1BQRVJfSU1BR0U7XG5Dcm9wcGVySW1hZ2UuJHZlcnNpb24gPSAnMi4wLjAnO1xuXG5leHBvcnQgeyBDcm9wcGVySW1hZ2UgYXMgZGVmYXVsdCB9O1xuIiwgImltcG9ydCBDcm9wcGVyRWxlbWVudCBmcm9tICdAY3JvcHBlci9lbGVtZW50JztcbmltcG9ydCB7IENST1BQRVJfU0hBREUsIENST1BQRVJfQ0FOVkFTLCBDUk9QUEVSX1NFTEVDVElPTiwgQUNUSU9OX1NFTEVDVCwgb24sIEVWRU5UX0FDVElPTl9TVEFSVCwgRVZFTlRfQUNUSU9OX0VORCwgRVZFTlRfQ0hBTkdFLCBvZmYsIGlzTnVtYmVyLCBXSU5ET1cgfSBmcm9tICdAY3JvcHBlci91dGlscyc7XG5cbnZhciBzdHlsZSA9IGA6aG9zdHtkaXNwbGF5OmJsb2NrO2hlaWdodDowO2xlZnQ6MDtvdXRsaW5lOnZhcigtLXRoZW1lLWNvbG9yKSBzb2xpZCAxcHg7cG9zaXRpb246cmVsYXRpdmU7dG9wOjA7d2lkdGg6MH06aG9zdChbdHJhbnNwYXJlbnRdKXtvdXRsaW5lLWNvbG9yOnRyYW5zcGFyZW50fWA7XG5cbmNvbnN0IGNhbnZhc0NhY2hlID0gbmV3IFdlYWtNYXAoKTtcbmNsYXNzIENyb3BwZXJTaGFkZSBleHRlbmRzIENyb3BwZXJFbGVtZW50IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoLi4uYXJndW1lbnRzKTtcbiAgICAgICAgdGhpcy4kb25DYW52YXNDaGFuZ2UgPSBudWxsO1xuICAgICAgICB0aGlzLiRvbkNhbnZhc0FjdGlvbkVuZCA9IG51bGw7XG4gICAgICAgIHRoaXMuJG9uQ2FudmFzQWN0aW9uU3RhcnQgPSBudWxsO1xuICAgICAgICB0aGlzLiRzdHlsZSA9IHN0eWxlO1xuICAgICAgICB0aGlzLnggPSAwO1xuICAgICAgICB0aGlzLnkgPSAwO1xuICAgICAgICB0aGlzLndpZHRoID0gMDtcbiAgICAgICAgdGhpcy5oZWlnaHQgPSAwO1xuICAgICAgICB0aGlzLnNsb3R0YWJsZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLnRoZW1lQ29sb3IgPSAncmdiYSgwLCAwLCAwLCAwLjY1KSc7XG4gICAgfVxuICAgIHNldCAkY2FudmFzKGVsZW1lbnQpIHtcbiAgICAgICAgY2FudmFzQ2FjaGUuc2V0KHRoaXMsIGVsZW1lbnQpO1xuICAgIH1cbiAgICBnZXQgJGNhbnZhcygpIHtcbiAgICAgICAgcmV0dXJuIGNhbnZhc0NhY2hlLmdldCh0aGlzKTtcbiAgICB9XG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7XG4gICAgICAgIHJldHVybiBzdXBlci5vYnNlcnZlZEF0dHJpYnV0ZXMuY29uY2F0KFtcbiAgICAgICAgICAgICdoZWlnaHQnLFxuICAgICAgICAgICAgJ3dpZHRoJyxcbiAgICAgICAgICAgICd4JyxcbiAgICAgICAgICAgICd5JyxcbiAgICAgICAgXSk7XG4gICAgfVxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICBzdXBlci5jb25uZWN0ZWRDYWxsYmFjaygpO1xuICAgICAgICBjb25zdCAkY2FudmFzID0gdGhpcy5jbG9zZXN0KHRoaXMuJGdldFRhZ05hbWVPZihDUk9QUEVSX0NBTlZBUykpO1xuICAgICAgICBpZiAoJGNhbnZhcykge1xuICAgICAgICAgICAgdGhpcy4kY2FudmFzID0gJGNhbnZhcztcbiAgICAgICAgICAgIHRoaXMuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgICAgICAgICAgY29uc3QgJHNlbGVjdGlvbiA9ICRjYW52YXMucXVlcnlTZWxlY3Rvcih0aGlzLiRnZXRUYWdOYW1lT2YoQ1JPUFBFUl9TRUxFQ1RJT04pKTtcbiAgICAgICAgICAgIGlmICgkc2VsZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgdGhpcy4kb25DYW52YXNBY3Rpb25TdGFydCA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoJHNlbGVjdGlvbi5oaWRkZW4gJiYgZXZlbnQuZGV0YWlsLmFjdGlvbiA9PT0gQUNUSU9OX1NFTEVDVCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5oaWRkZW4gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgdGhpcy4kb25DYW52YXNBY3Rpb25FbmQgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCRzZWxlY3Rpb24uaGlkZGVuICYmIGV2ZW50LmRldGFpbC5hY3Rpb24gPT09IEFDVElPTl9TRUxFQ1QpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaGlkZGVuID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgdGhpcy4kb25DYW52YXNDaGFuZ2UgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgeyB4LCB5LCB3aWR0aCwgaGVpZ2h0LCB9ID0gZXZlbnQuZGV0YWlsO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLiRjaGFuZ2UoeCwgeSwgd2lkdGgsIGhlaWdodCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICgkc2VsZWN0aW9uLmhpZGRlbiB8fCAoeCA9PT0gMCAmJiB5ID09PSAwICYmIHdpZHRoID09PSAwICYmIGhlaWdodCA9PT0gMCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaGlkZGVuID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgb24oJGNhbnZhcywgRVZFTlRfQUNUSU9OX1NUQVJULCB0aGlzLiRvbkNhbnZhc0FjdGlvblN0YXJ0KTtcbiAgICAgICAgICAgICAgICBvbigkY2FudmFzLCBFVkVOVF9BQ1RJT05fRU5ELCB0aGlzLiRvbkNhbnZhc0FjdGlvbkVuZCk7XG4gICAgICAgICAgICAgICAgb24oJGNhbnZhcywgRVZFTlRfQ0hBTkdFLCB0aGlzLiRvbkNhbnZhc0NoYW5nZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy4kcmVuZGVyKCk7XG4gICAgfVxuICAgIGRpc2Nvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICBjb25zdCB7ICRjYW52YXMgfSA9IHRoaXM7XG4gICAgICAgIGlmICgkY2FudmFzKSB7XG4gICAgICAgICAgICBpZiAodGhpcy4kb25DYW52YXNBY3Rpb25TdGFydCkge1xuICAgICAgICAgICAgICAgIG9mZigkY2FudmFzLCBFVkVOVF9BQ1RJT05fU1RBUlQsIHRoaXMuJG9uQ2FudmFzQWN0aW9uU3RhcnQpO1xuICAgICAgICAgICAgICAgIHRoaXMuJG9uQ2FudmFzQWN0aW9uU3RhcnQgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuJG9uQ2FudmFzQWN0aW9uRW5kKSB7XG4gICAgICAgICAgICAgICAgb2ZmKCRjYW52YXMsIEVWRU5UX0FDVElPTl9FTkQsIHRoaXMuJG9uQ2FudmFzQWN0aW9uRW5kKTtcbiAgICAgICAgICAgICAgICB0aGlzLiRvbkNhbnZhc0FjdGlvbkVuZCA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy4kb25DYW52YXNDaGFuZ2UpIHtcbiAgICAgICAgICAgICAgICBvZmYoJGNhbnZhcywgRVZFTlRfQ0hBTkdFLCB0aGlzLiRvbkNhbnZhc0NoYW5nZSk7XG4gICAgICAgICAgICAgICAgdGhpcy4kb25DYW52YXNDaGFuZ2UgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHN1cGVyLmRpc2Nvbm5lY3RlZENhbGxiYWNrKCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENoYW5nZXMgdGhlIHBvc2l0aW9uIGFuZC9vciBzaXplIG9mIHRoZSBzaGFkZS5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0geCBUaGUgbmV3IHBvc2l0aW9uIGluIHRoZSBob3Jpem9udGFsIGRpcmVjdGlvbi5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0geSBUaGUgbmV3IHBvc2l0aW9uIGluIHRoZSB2ZXJ0aWNhbCBkaXJlY3Rpb24uXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFt3aWR0aF0gVGhlIG5ldyB3aWR0aC5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW2hlaWdodF0gVGhlIG5ldyBoZWlnaHQuXG4gICAgICogQHJldHVybnMge0Nyb3BwZXJTaGFkZX0gUmV0dXJucyBgdGhpc2AgZm9yIGNoYWluaW5nLlxuICAgICAqL1xuICAgICRjaGFuZ2UoeCwgeSwgd2lkdGggPSB0aGlzLndpZHRoLCBoZWlnaHQgPSB0aGlzLmhlaWdodCkge1xuICAgICAgICBpZiAoIWlzTnVtYmVyKHgpXG4gICAgICAgICAgICB8fCAhaXNOdW1iZXIoeSlcbiAgICAgICAgICAgIHx8ICFpc051bWJlcih3aWR0aClcbiAgICAgICAgICAgIHx8ICFpc051bWJlcihoZWlnaHQpXG4gICAgICAgICAgICB8fCAoeCA9PT0gdGhpcy54ICYmIHkgPT09IHRoaXMueSAmJiB3aWR0aCA9PT0gdGhpcy53aWR0aCAmJiBoZWlnaHQgPT09IHRoaXMuaGVpZ2h0KSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuaGlkZGVuKSB7XG4gICAgICAgICAgICB0aGlzLmhpZGRlbiA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMueCA9IHg7XG4gICAgICAgIHRoaXMueSA9IHk7XG4gICAgICAgIHRoaXMud2lkdGggPSB3aWR0aDtcbiAgICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgIHJldHVybiB0aGlzLiRyZW5kZXIoKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmVzZXRzIHRoZSBzaGFkZSB0byBpdHMgaW5pdGlhbCBwb3NpdGlvbiBhbmQgc2l6ZS5cbiAgICAgKiBAcmV0dXJucyB7Q3JvcHBlclNoYWRlfSBSZXR1cm5zIGB0aGlzYCBmb3IgY2hhaW5pbmcuXG4gICAgICovXG4gICAgJHJlc2V0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy4kY2hhbmdlKDAsIDAsIDAsIDApO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZWZyZXNoZXMgdGhlIHBvc2l0aW9uIG9yIHNpemUgb2YgdGhlIHNoYWRlLlxuICAgICAqIEByZXR1cm5zIHtDcm9wcGVyU2hhZGV9IFJldHVybnMgYHRoaXNgIGZvciBjaGFpbmluZy5cbiAgICAgKi9cbiAgICAkcmVuZGVyKCkge1xuICAgICAgICByZXR1cm4gdGhpcy4kc2V0U3R5bGVzKHtcbiAgICAgICAgICAgIHRyYW5zZm9ybTogYHRyYW5zbGF0ZSgke3RoaXMueH1weCwgJHt0aGlzLnl9cHgpYCxcbiAgICAgICAgICAgIHdpZHRoOiB0aGlzLndpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiB0aGlzLmhlaWdodCxcbiAgICAgICAgICAgIG91dGxpbmVXaWR0aDogV0lORE9XLmlubmVyV2lkdGgsXG4gICAgICAgIH0pO1xuICAgIH1cbn1cbkNyb3BwZXJTaGFkZS4kbmFtZSA9IENST1BQRVJfU0hBREU7XG5Dcm9wcGVyU2hhZGUuJHZlcnNpb24gPSAnMi4wLjAnO1xuXG5leHBvcnQgeyBDcm9wcGVyU2hhZGUgYXMgZGVmYXVsdCB9O1xuIiwgImltcG9ydCBDcm9wcGVyRWxlbWVudCBmcm9tICdAY3JvcHBlci9lbGVtZW50JztcbmltcG9ydCB7IENST1BQRVJfSEFORExFLCBBQ1RJT05fTk9ORSB9IGZyb20gJ0Bjcm9wcGVyL3V0aWxzJztcblxudmFyIHN0eWxlID0gYDpob3N0e2JhY2tncm91bmQtY29sb3I6dmFyKC0tdGhlbWUtY29sb3IpO2Rpc3BsYXk6YmxvY2t9Omhvc3QoW2FjdGlvbj1tb3ZlXSksOmhvc3QoW2FjdGlvbj1zZWxlY3RdKXtoZWlnaHQ6MTAwJTtsZWZ0OjA7cG9zaXRpb246YWJzb2x1dGU7dG9wOjA7d2lkdGg6MTAwJX06aG9zdChbYWN0aW9uPW1vdmVdKXtjdXJzb3I6bW92ZX06aG9zdChbYWN0aW9uPXNlbGVjdF0pe2N1cnNvcjpjcm9zc2hhaXJ9Omhvc3QoW2FjdGlvbiQ9LXJlc2l6ZV0pe2JhY2tncm91bmQtY29sb3I6dHJhbnNwYXJlbnQ7aGVpZ2h0OjE1cHg7cG9zaXRpb246YWJzb2x1dGU7d2lkdGg6MTVweH06aG9zdChbYWN0aW9uJD0tcmVzaXplXSk6YWZ0ZXJ7YmFja2dyb3VuZC1jb2xvcjp2YXIoLS10aGVtZS1jb2xvcik7Y29udGVudDpcIlwiO2Rpc3BsYXk6YmxvY2s7aGVpZ2h0OjVweDtsZWZ0OjUwJTtwb3NpdGlvbjphYnNvbHV0ZTt0b3A6NTAlO3RyYW5zZm9ybTp0cmFuc2xhdGUoLTUwJSwtNTAlKTt3aWR0aDo1cHh9Omhvc3QoW2FjdGlvbj1uLXJlc2l6ZV0pLDpob3N0KFthY3Rpb249cy1yZXNpemVdKXtjdXJzb3I6bnMtcmVzaXplO2xlZnQ6NTAlO3RyYW5zZm9ybTp0cmFuc2xhdGVYKC01MCUpO3dpZHRoOjEwMCV9Omhvc3QoW2FjdGlvbj1uLXJlc2l6ZV0pe3RvcDotOHB4fTpob3N0KFthY3Rpb249cy1yZXNpemVdKXtib3R0b206LThweH06aG9zdChbYWN0aW9uPWUtcmVzaXplXSksOmhvc3QoW2FjdGlvbj13LXJlc2l6ZV0pe2N1cnNvcjpldy1yZXNpemU7aGVpZ2h0OjEwMCU7dG9wOjUwJTt0cmFuc2Zvcm06dHJhbnNsYXRlWSgtNTAlKX06aG9zdChbYWN0aW9uPWUtcmVzaXplXSl7cmlnaHQ6LThweH06aG9zdChbYWN0aW9uPXctcmVzaXplXSl7bGVmdDotOHB4fTpob3N0KFthY3Rpb249bmUtcmVzaXplXSl7Y3Vyc29yOm5lc3ctcmVzaXplO3JpZ2h0Oi04cHg7dG9wOi04cHh9Omhvc3QoW2FjdGlvbj1udy1yZXNpemVdKXtjdXJzb3I6bndzZS1yZXNpemU7bGVmdDotOHB4O3RvcDotOHB4fTpob3N0KFthY3Rpb249c2UtcmVzaXplXSl7Ym90dG9tOi04cHg7Y3Vyc29yOm53c2UtcmVzaXplO3JpZ2h0Oi04cHh9Omhvc3QoW2FjdGlvbj1zZS1yZXNpemVdKTphZnRlcntoZWlnaHQ6MTVweDt3aWR0aDoxNXB4fUBtZWRpYSAocG9pbnRlcjpjb2Fyc2Upezpob3N0KFthY3Rpb249c2UtcmVzaXplXSk6YWZ0ZXJ7aGVpZ2h0OjEwcHg7d2lkdGg6MTBweH19QG1lZGlhIChwb2ludGVyOmZpbmUpezpob3N0KFthY3Rpb249c2UtcmVzaXplXSk6YWZ0ZXJ7aGVpZ2h0OjVweDt3aWR0aDo1cHh9fTpob3N0KFthY3Rpb249c3ctcmVzaXplXSl7Ym90dG9tOi04cHg7Y3Vyc29yOm5lc3ctcmVzaXplO2xlZnQ6LThweH06aG9zdChbcGxhaW5dKXtiYWNrZ3JvdW5kLWNvbG9yOnRyYW5zcGFyZW50fWA7XG5cbmNsYXNzIENyb3BwZXJIYW5kbGUgZXh0ZW5kcyBDcm9wcGVyRWxlbWVudCB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKC4uLmFyZ3VtZW50cyk7XG4gICAgICAgIHRoaXMuJG9uQ2FudmFzQ3JvcEVuZCA9IG51bGw7XG4gICAgICAgIHRoaXMuJG9uQ2FudmFzQ3JvcFN0YXJ0ID0gbnVsbDtcbiAgICAgICAgdGhpcy4kc3R5bGUgPSBzdHlsZTtcbiAgICAgICAgdGhpcy5hY3Rpb24gPSBBQ1RJT05fTk9ORTtcbiAgICAgICAgdGhpcy5wbGFpbiA9IGZhbHNlO1xuICAgICAgICB0aGlzLnNsb3R0YWJsZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLnRoZW1lQ29sb3IgPSAncmdiYSg1MSwgMTUzLCAyNTUsIDAuNSknO1xuICAgIH1cbiAgICBzdGF0aWMgZ2V0IG9ic2VydmVkQXR0cmlidXRlcygpIHtcbiAgICAgICAgcmV0dXJuIHN1cGVyLm9ic2VydmVkQXR0cmlidXRlcy5jb25jYXQoW1xuICAgICAgICAgICAgJ2FjdGlvbicsXG4gICAgICAgICAgICAncGxhaW4nLFxuICAgICAgICBdKTtcbiAgICB9XG59XG5Dcm9wcGVySGFuZGxlLiRuYW1lID0gQ1JPUFBFUl9IQU5ETEU7XG5Dcm9wcGVySGFuZGxlLiR2ZXJzaW9uID0gJzIuMC4wJztcblxuZXhwb3J0IHsgQ3JvcHBlckhhbmRsZSBhcyBkZWZhdWx0IH07XG4iLCAiaW1wb3J0IENyb3BwZXJFbGVtZW50IGZyb20gJ0Bjcm9wcGVyL2VsZW1lbnQnO1xuaW1wb3J0IHsgQ1JPUFBFUl9TRUxFQ1RJT04sIEVWRU5UX0NIQU5HRSwgb24sIEVWRU5UX0tFWURPV04sIG9mZiwgaXNQb3NpdGl2ZU51bWJlciwgQ1JPUFBFUl9DQU5WQVMsIEVWRU5UX0FDVElPTl9TVEFSVCwgRVZFTlRfQUNUSU9OX0VORCwgRVZFTlRfQUNUSU9OLCBnZXRBZGp1c3RlZFNpemVzLCBBQ1RJT05fU0VMRUNULCBBQ1RJT05fU0NBTEUsIGdldE9mZnNldCwgQUNUSU9OX01PVkUsIEFDVElPTl9SRVNJWkVfTk9SVEhXRVNULCBBQ1RJT05fUkVTSVpFX1NPVVRIV0VTVCwgQUNUSU9OX1JFU0laRV9OT1JUSEVBU1QsIEFDVElPTl9SRVNJWkVfU09VVEhFQVNULCBpc051bWJlciwgaXNQbGFpbk9iamVjdCwgQ1JPUFBFUl9JTUFHRSwgaXNGdW5jdGlvbiwgQUNUSU9OX1JFU0laRV9XRVNULCBBQ1RJT05fUkVTSVpFX0VBU1QsIEFDVElPTl9SRVNJWkVfU09VVEgsIEFDVElPTl9SRVNJWkVfTk9SVEggfSBmcm9tICdAY3JvcHBlci91dGlscyc7XG5cbnZhciBzdHlsZSA9IGA6aG9zdHtkaXNwbGF5OmJsb2NrO2xlZnQ6MDtwb3NpdGlvbjpyZWxhdGl2ZTtyaWdodDowfTpob3N0KFtvdXRsaW5lZF0pe291dGxpbmU6MXB4IHNvbGlkIHZhcigtLXRoZW1lLWNvbG9yKX06aG9zdChbbXVsdGlwbGVdKXtvdXRsaW5lOjFweCBkYXNoZWQgaHNsYSgwLDAlLDEwMCUsLjUpfTpob3N0KFttdWx0aXBsZV0pOmFmdGVye2JvdHRvbTowO2NvbnRlbnQ6XCJcIjtjdXJzb3I6cG9pbnRlcjtkaXNwbGF5OmJsb2NrO2xlZnQ6MDtwb3NpdGlvbjphYnNvbHV0ZTtyaWdodDowO3RvcDowfTpob3N0KFttdWx0aXBsZV1bYWN0aXZlXSl7b3V0bGluZS1jb2xvcjp2YXIoLS10aGVtZS1jb2xvcik7ei1pbmRleDoxfTpob3N0KFttdWx0aXBsZV0pPip7dmlzaWJpbGl0eTpoaWRkZW59Omhvc3QoW211bHRpcGxlXVthY3RpdmVdKT4qe3Zpc2liaWxpdHk6dmlzaWJsZX06aG9zdChbbXVsdGlwbGVdW2FjdGl2ZV0pOmFmdGVye2Rpc3BsYXk6bm9uZX1gO1xuXG5jb25zdCBjYW52YXNDYWNoZSA9IG5ldyBXZWFrTWFwKCk7XG5jbGFzcyBDcm9wcGVyU2VsZWN0aW9uIGV4dGVuZHMgQ3JvcHBlckVsZW1lbnQge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlciguLi5hcmd1bWVudHMpO1xuICAgICAgICB0aGlzLiRvbkNhbnZhc0FjdGlvbiA9IG51bGw7XG4gICAgICAgIHRoaXMuJG9uQ2FudmFzQWN0aW9uU3RhcnQgPSBudWxsO1xuICAgICAgICB0aGlzLiRvbkNhbnZhc0FjdGlvbkVuZCA9IG51bGw7XG4gICAgICAgIHRoaXMuJG9uRG9jdW1lbnRLZXlEb3duID0gbnVsbDtcbiAgICAgICAgdGhpcy4kYWN0aW9uID0gJyc7XG4gICAgICAgIHRoaXMuJGFjdGlvblN0YXJ0VGFyZ2V0ID0gbnVsbDtcbiAgICAgICAgdGhpcy4kY2hhbmdpbmcgPSBmYWxzZTtcbiAgICAgICAgdGhpcy4kc3R5bGUgPSBzdHlsZTtcbiAgICAgICAgdGhpcy4kaW5pdGlhbFNlbGVjdGlvbiA9IHtcbiAgICAgICAgICAgIHg6IDAsXG4gICAgICAgICAgICB5OiAwLFxuICAgICAgICAgICAgd2lkdGg6IDAsXG4gICAgICAgICAgICBoZWlnaHQ6IDAsXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMueCA9IDA7XG4gICAgICAgIHRoaXMueSA9IDA7XG4gICAgICAgIHRoaXMud2lkdGggPSAwO1xuICAgICAgICB0aGlzLmhlaWdodCA9IDA7XG4gICAgICAgIHRoaXMuYXNwZWN0UmF0aW8gPSBOYU47XG4gICAgICAgIHRoaXMuaW5pdGlhbEFzcGVjdFJhdGlvID0gTmFOO1xuICAgICAgICB0aGlzLmluaXRpYWxDb3ZlcmFnZSA9IE5hTjtcbiAgICAgICAgdGhpcy5hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgLy8gRGVwcmVjYXRlZCBhcyBvZiB2Mi4wLjAtcmMuMCwgdXNlIGBkeW5hbWljYCBpbnN0ZWFkLlxuICAgICAgICB0aGlzLmxpbmtlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmR5bmFtaWMgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5tb3ZhYmxlID0gZmFsc2U7XG4gICAgICAgIHRoaXMucmVzaXphYmxlID0gZmFsc2U7XG4gICAgICAgIHRoaXMuem9vbWFibGUgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5tdWx0aXBsZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLmtleWJvYXJkID0gZmFsc2U7XG4gICAgICAgIHRoaXMub3V0bGluZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5wcmVjaXNlID0gZmFsc2U7XG4gICAgfVxuICAgIHNldCAkY2FudmFzKGVsZW1lbnQpIHtcbiAgICAgICAgY2FudmFzQ2FjaGUuc2V0KHRoaXMsIGVsZW1lbnQpO1xuICAgIH1cbiAgICBnZXQgJGNhbnZhcygpIHtcbiAgICAgICAgcmV0dXJuIGNhbnZhc0NhY2hlLmdldCh0aGlzKTtcbiAgICB9XG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7XG4gICAgICAgIHJldHVybiBzdXBlci5vYnNlcnZlZEF0dHJpYnV0ZXMuY29uY2F0KFtcbiAgICAgICAgICAgICdhY3RpdmUnLFxuICAgICAgICAgICAgJ2FzcGVjdC1yYXRpbycsXG4gICAgICAgICAgICAnZHluYW1pYycsXG4gICAgICAgICAgICAnaGVpZ2h0JyxcbiAgICAgICAgICAgICdpbml0aWFsLWFzcGVjdC1yYXRpbycsXG4gICAgICAgICAgICAnaW5pdGlhbC1jb3ZlcmFnZScsXG4gICAgICAgICAgICAna2V5Ym9hcmQnLFxuICAgICAgICAgICAgJ2xpbmtlZCcsXG4gICAgICAgICAgICAnbW92YWJsZScsXG4gICAgICAgICAgICAnbXVsdGlwbGUnLFxuICAgICAgICAgICAgJ291dGxpbmVkJyxcbiAgICAgICAgICAgICdwcmVjaXNlJyxcbiAgICAgICAgICAgICdyZXNpemFibGUnLFxuICAgICAgICAgICAgJ3dpZHRoJyxcbiAgICAgICAgICAgICd4JyxcbiAgICAgICAgICAgICd5JyxcbiAgICAgICAgICAgICd6b29tYWJsZScsXG4gICAgICAgIF0pO1xuICAgIH1cbiAgICAkcHJvcGVydHlDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKSB7XG4gICAgICAgIGlmIChPYmplY3QuaXMobmV3VmFsdWUsIG9sZFZhbHVlKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHN1cGVyLiRwcm9wZXJ0eUNoYW5nZWRDYWxsYmFjayhuYW1lLCBvbGRWYWx1ZSwgbmV3VmFsdWUpO1xuICAgICAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgICAgICAgIGNhc2UgJ3gnOlxuICAgICAgICAgICAgY2FzZSAneSc6XG4gICAgICAgICAgICBjYXNlICd3aWR0aCc6XG4gICAgICAgICAgICBjYXNlICdoZWlnaHQnOlxuICAgICAgICAgICAgICAgIGlmICghdGhpcy4kY2hhbmdpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy4kbmV4dFRpY2soKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy4kY2hhbmdlKHRoaXMueCwgdGhpcy55LCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCwgdGhpcy5hc3BlY3RSYXRpbywgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2FzcGVjdFJhdGlvJzpcbiAgICAgICAgICAgIGNhc2UgJ2luaXRpYWxBc3BlY3RSYXRpbyc6XG4gICAgICAgICAgICAgICAgdGhpcy4kbmV4dFRpY2soKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLiRpbml0U2VsZWN0aW9uKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdpbml0aWFsQ292ZXJhZ2UnOlxuICAgICAgICAgICAgICAgIHRoaXMuJG5leHRUaWNrKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzUG9zaXRpdmVOdW1iZXIobmV3VmFsdWUpICYmIG5ld1ZhbHVlIDw9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuJGluaXRTZWxlY3Rpb24odHJ1ZSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2tleWJvYXJkJzpcbiAgICAgICAgICAgICAgICB0aGlzLiRuZXh0VGljaygoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLiRjYW52YXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChuZXdWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy4kb25Eb2N1bWVudEtleURvd24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy4kb25Eb2N1bWVudEtleURvd24gPSB0aGlzLiRoYW5kbGVLZXlEb3duLmJpbmQodGhpcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uKHRoaXMub3duZXJEb2N1bWVudCwgRVZFTlRfS0VZRE9XTiwgdGhpcy4kb25Eb2N1bWVudEtleURvd24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHRoaXMuJG9uRG9jdW1lbnRLZXlEb3duKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2ZmKHRoaXMub3duZXJEb2N1bWVudCwgRVZFTlRfS0VZRE9XTiwgdGhpcy4kb25Eb2N1bWVudEtleURvd24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuJG9uRG9jdW1lbnRLZXlEb3duID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnbXVsdGlwbGUnOlxuICAgICAgICAgICAgICAgIHRoaXMuJG5leHRUaWNrKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuJGNhbnZhcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2VsZWN0aW9ucyA9IHRoaXMuJGdldFNlbGVjdGlvbnMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChuZXdWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGVjdGlvbnMuZm9yRWFjaCgoc2VsZWN0aW9uKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGVjdGlvbi5hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFjdGl2ZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy4kZW1pdChFVkVOVF9DSEFOR0UsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeDogdGhpcy54LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB5OiB0aGlzLnksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiB0aGlzLndpZHRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IHRoaXMuaGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxlY3Rpb25zLnNsaWNlKDEpLmZvckVhY2goKHNlbGVjdGlvbikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLiRyZW1vdmVTZWxlY3Rpb24oc2VsZWN0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAncHJlY2lzZSc6XG4gICAgICAgICAgICAgICAgdGhpcy4kbmV4dFRpY2soKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLiRjaGFuZ2UodGhpcy54LCB0aGlzLnkpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgLy8gQmFja3dhcmRzIGNvbXBhdGlibGUgd2l0aCAyLjAuMC1yY1xuICAgICAgICAgICAgY2FzZSAnbGlua2VkJzpcbiAgICAgICAgICAgICAgICBpZiAobmV3VmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5keW5hbWljID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG4gICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHN1cGVyLmNvbm5lY3RlZENhbGxiYWNrKCk7XG4gICAgICAgIGNvbnN0ICRjYW52YXMgPSB0aGlzLmNsb3Nlc3QodGhpcy4kZ2V0VGFnTmFtZU9mKENST1BQRVJfQ0FOVkFTKSk7XG4gICAgICAgIGlmICgkY2FudmFzKSB7XG4gICAgICAgICAgICB0aGlzLiRjYW52YXMgPSAkY2FudmFzO1xuICAgICAgICAgICAgdGhpcy4kc2V0U3R5bGVzKHtcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcbiAgICAgICAgICAgICAgICB0cmFuc2Zvcm06IGB0cmFuc2xhdGUoJHt0aGlzLnh9cHgsICR7dGhpcy55fXB4KWAsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmICghdGhpcy5oaWRkZW4pIHtcbiAgICAgICAgICAgICAgICB0aGlzLiRyZW5kZXIoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuJGluaXRTZWxlY3Rpb24odHJ1ZSk7XG4gICAgICAgICAgICB0aGlzLiRvbkNhbnZhc0FjdGlvblN0YXJ0ID0gdGhpcy4kaGFuZGxlQWN0aW9uU3RhcnQuYmluZCh0aGlzKTtcbiAgICAgICAgICAgIHRoaXMuJG9uQ2FudmFzQWN0aW9uRW5kID0gdGhpcy4kaGFuZGxlQWN0aW9uRW5kLmJpbmQodGhpcyk7XG4gICAgICAgICAgICB0aGlzLiRvbkNhbnZhc0FjdGlvbiA9IHRoaXMuJGhhbmRsZUFjdGlvbi5iaW5kKHRoaXMpO1xuICAgICAgICAgICAgb24oJGNhbnZhcywgRVZFTlRfQUNUSU9OX1NUQVJULCB0aGlzLiRvbkNhbnZhc0FjdGlvblN0YXJ0KTtcbiAgICAgICAgICAgIG9uKCRjYW52YXMsIEVWRU5UX0FDVElPTl9FTkQsIHRoaXMuJG9uQ2FudmFzQWN0aW9uRW5kKTtcbiAgICAgICAgICAgIG9uKCRjYW52YXMsIEVWRU5UX0FDVElPTiwgdGhpcy4kb25DYW52YXNBY3Rpb24pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy4kcmVuZGVyKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZGlzY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIGNvbnN0IHsgJGNhbnZhcyB9ID0gdGhpcztcbiAgICAgICAgaWYgKCRjYW52YXMpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLiRvbkNhbnZhc0FjdGlvblN0YXJ0KSB7XG4gICAgICAgICAgICAgICAgb2ZmKCRjYW52YXMsIEVWRU5UX0FDVElPTl9TVEFSVCwgdGhpcy4kb25DYW52YXNBY3Rpb25TdGFydCk7XG4gICAgICAgICAgICAgICAgdGhpcy4kb25DYW52YXNBY3Rpb25TdGFydCA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy4kb25DYW52YXNBY3Rpb25FbmQpIHtcbiAgICAgICAgICAgICAgICBvZmYoJGNhbnZhcywgRVZFTlRfQUNUSU9OX0VORCwgdGhpcy4kb25DYW52YXNBY3Rpb25FbmQpO1xuICAgICAgICAgICAgICAgIHRoaXMuJG9uQ2FudmFzQWN0aW9uRW5kID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLiRvbkNhbnZhc0FjdGlvbikge1xuICAgICAgICAgICAgICAgIG9mZigkY2FudmFzLCBFVkVOVF9BQ1RJT04sIHRoaXMuJG9uQ2FudmFzQWN0aW9uKTtcbiAgICAgICAgICAgICAgICB0aGlzLiRvbkNhbnZhc0FjdGlvbiA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgc3VwZXIuZGlzY29ubmVjdGVkQ2FsbGJhY2soKTtcbiAgICB9XG4gICAgJGdldFNlbGVjdGlvbnMoKSB7XG4gICAgICAgIGxldCBzZWxlY3Rpb25zID0gW107XG4gICAgICAgIGlmICh0aGlzLnBhcmVudEVsZW1lbnQpIHtcbiAgICAgICAgICAgIHNlbGVjdGlvbnMgPSBBcnJheS5mcm9tKHRoaXMucGFyZW50RWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKHRoaXMuJGdldFRhZ05hbWVPZihDUk9QUEVSX1NFTEVDVElPTikpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc2VsZWN0aW9ucztcbiAgICB9XG4gICAgJGluaXRTZWxlY3Rpb24oY2VudGVyID0gZmFsc2UsIHJlc2l6ZSA9IGZhbHNlKSB7XG4gICAgICAgIGNvbnN0IHsgaW5pdGlhbENvdmVyYWdlLCBwYXJlbnRFbGVtZW50IH0gPSB0aGlzO1xuICAgICAgICBpZiAoaXNQb3NpdGl2ZU51bWJlcihpbml0aWFsQ292ZXJhZ2UpICYmIHBhcmVudEVsZW1lbnQpIHtcbiAgICAgICAgICAgIGNvbnN0IGFzcGVjdFJhdGlvID0gdGhpcy5hc3BlY3RSYXRpbyB8fCB0aGlzLmluaXRpYWxBc3BlY3RSYXRpbztcbiAgICAgICAgICAgIGxldCB3aWR0aCA9IChyZXNpemUgPyAwIDogdGhpcy53aWR0aCkgfHwgcGFyZW50RWxlbWVudC5vZmZzZXRXaWR0aCAqIGluaXRpYWxDb3ZlcmFnZTtcbiAgICAgICAgICAgIGxldCBoZWlnaHQgPSAocmVzaXplID8gMCA6IHRoaXMuaGVpZ2h0KSB8fCBwYXJlbnRFbGVtZW50Lm9mZnNldEhlaWdodCAqIGluaXRpYWxDb3ZlcmFnZTtcbiAgICAgICAgICAgIGlmIChpc1Bvc2l0aXZlTnVtYmVyKGFzcGVjdFJhdGlvKSkge1xuICAgICAgICAgICAgICAgICh7IHdpZHRoLCBoZWlnaHQgfSA9IGdldEFkanVzdGVkU2l6ZXMoeyBhc3BlY3RSYXRpbywgd2lkdGgsIGhlaWdodCB9KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLiRjaGFuZ2UodGhpcy54LCB0aGlzLnksIHdpZHRoLCBoZWlnaHQpO1xuICAgICAgICAgICAgaWYgKGNlbnRlcikge1xuICAgICAgICAgICAgICAgIHRoaXMuJGNlbnRlcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gT3ZlcnJpZGVzIHRoZSBpbml0aWFsIHBvc2l0aW9uIGFuZCBzaXplXG4gICAgICAgICAgICB0aGlzLiRpbml0aWFsU2VsZWN0aW9uID0ge1xuICAgICAgICAgICAgICAgIHg6IHRoaXMueCxcbiAgICAgICAgICAgICAgICB5OiB0aGlzLnksXG4gICAgICAgICAgICAgICAgd2lkdGg6IHRoaXMud2lkdGgsXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiB0aGlzLmhlaWdodCxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9XG4gICAgJGNyZWF0ZVNlbGVjdGlvbigpIHtcbiAgICAgICAgY29uc3QgbmV3U2VsZWN0aW9uID0gdGhpcy5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgIGlmICh0aGlzLmhhc0F0dHJpYnV0ZSgnaWQnKSkge1xuICAgICAgICAgICAgbmV3U2VsZWN0aW9uLnJlbW92ZUF0dHJpYnV0ZSgnaWQnKTtcbiAgICAgICAgfVxuICAgICAgICBuZXdTZWxlY3Rpb24uaW5pdGlhbENvdmVyYWdlID0gTmFOO1xuICAgICAgICB0aGlzLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICBpZiAodGhpcy5wYXJlbnRFbGVtZW50KSB7XG4gICAgICAgICAgICB0aGlzLnBhcmVudEVsZW1lbnQuaW5zZXJ0QmVmb3JlKG5ld1NlbGVjdGlvbiwgdGhpcy5uZXh0U2libGluZyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ld1NlbGVjdGlvbjtcbiAgICB9XG4gICAgJHJlbW92ZVNlbGVjdGlvbihzZWxlY3Rpb24gPSB0aGlzKSB7XG4gICAgICAgIGlmICh0aGlzLnBhcmVudEVsZW1lbnQpIHtcbiAgICAgICAgICAgIGNvbnN0IHNlbGVjdGlvbnMgPSB0aGlzLiRnZXRTZWxlY3Rpb25zKCk7XG4gICAgICAgICAgICBpZiAoc2VsZWN0aW9ucy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaW5kZXggPSBzZWxlY3Rpb25zLmluZGV4T2Yoc2VsZWN0aW9uKTtcbiAgICAgICAgICAgICAgICBjb25zdCBhY3RpdmVTZWxlY3Rpb24gPSBzZWxlY3Rpb25zW2luZGV4ICsgMV0gfHwgc2VsZWN0aW9uc1tpbmRleCAtIDFdO1xuICAgICAgICAgICAgICAgIGlmIChhY3RpdmVTZWxlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0aW9uLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnBhcmVudEVsZW1lbnQucmVtb3ZlQ2hpbGQoc2VsZWN0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgYWN0aXZlU2VsZWN0aW9uLmFjdGl2ZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGFjdGl2ZVNlbGVjdGlvbi4kZW1pdChFVkVOVF9DSEFOR0UsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHg6IGFjdGl2ZVNlbGVjdGlvbi54LFxuICAgICAgICAgICAgICAgICAgICAgICAgeTogYWN0aXZlU2VsZWN0aW9uLnksXG4gICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogYWN0aXZlU2VsZWN0aW9uLndpZHRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBhY3RpdmVTZWxlY3Rpb24uaGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLiRjbGVhcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgICRoYW5kbGVBY3Rpb25TdGFydChldmVudCkge1xuICAgICAgICB2YXIgX2EsIF9iO1xuICAgICAgICBjb25zdCByZWxhdGVkVGFyZ2V0ID0gKF9iID0gKF9hID0gZXZlbnQuZGV0YWlsKSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2EucmVsYXRlZEV2ZW50KSA9PT0gbnVsbCB8fCBfYiA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2IudGFyZ2V0O1xuICAgICAgICB0aGlzLiRhY3Rpb24gPSAnJztcbiAgICAgICAgdGhpcy4kYWN0aW9uU3RhcnRUYXJnZXQgPSByZWxhdGVkVGFyZ2V0O1xuICAgICAgICBpZiAoIXRoaXMuaGlkZGVuXG4gICAgICAgICAgICAmJiB0aGlzLm11bHRpcGxlXG4gICAgICAgICAgICAmJiAhdGhpcy5hY3RpdmVcbiAgICAgICAgICAgICYmIHJlbGF0ZWRUYXJnZXQgPT09IHRoaXNcbiAgICAgICAgICAgICYmIHRoaXMucGFyZW50RWxlbWVudCkge1xuICAgICAgICAgICAgdGhpcy4kZ2V0U2VsZWN0aW9ucygpLmZvckVhY2goKHNlbGVjdGlvbikgPT4ge1xuICAgICAgICAgICAgICAgIHNlbGVjdGlvbi5hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5hY3RpdmUgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy4kZW1pdChFVkVOVF9DSEFOR0UsIHtcbiAgICAgICAgICAgICAgICB4OiB0aGlzLngsXG4gICAgICAgICAgICAgICAgeTogdGhpcy55LFxuICAgICAgICAgICAgICAgIHdpZHRoOiB0aGlzLndpZHRoLFxuICAgICAgICAgICAgICAgIGhlaWdodDogdGhpcy5oZWlnaHQsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAkaGFuZGxlQWN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGNvbnN0IHsgY3VycmVudFRhcmdldCwgZGV0YWlsIH0gPSBldmVudDtcbiAgICAgICAgaWYgKCFjdXJyZW50VGFyZ2V0IHx8ICFkZXRhaWwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB7IHJlbGF0ZWRFdmVudCB9ID0gZGV0YWlsO1xuICAgICAgICBsZXQgeyBhY3Rpb24gfSA9IGRldGFpbDtcbiAgICAgICAgLy8gU3dpdGNoaW5nIHRvIGFub3RoZXIgc2VsZWN0aW9uXG4gICAgICAgIGlmICghYWN0aW9uICYmIHRoaXMubXVsdGlwbGUpIHtcbiAgICAgICAgICAgIC8vIEdldCB0aGUgYGFjdGlvbmAgcHJvcGVydHkgZnJvbSB0aGUgZm9jdXNpbmcgaW4gc2VsZWN0aW9uXG4gICAgICAgICAgICBhY3Rpb24gPSB0aGlzLiRhY3Rpb24gfHwgKHJlbGF0ZWRFdmVudCA9PT0gbnVsbCB8fCByZWxhdGVkRXZlbnQgPT09IHZvaWQgMCA/IHZvaWQgMCA6IHJlbGF0ZWRFdmVudC50YXJnZXQuYWN0aW9uKTtcbiAgICAgICAgICAgIHRoaXMuJGFjdGlvbiA9IGFjdGlvbjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWFjdGlvblxuICAgICAgICAgICAgfHwgKHRoaXMuaGlkZGVuICYmIGFjdGlvbiAhPT0gQUNUSU9OX1NFTEVDVClcbiAgICAgICAgICAgIHx8ICh0aGlzLm11bHRpcGxlICYmICF0aGlzLmFjdGl2ZSAmJiBhY3Rpb24gIT09IEFDVElPTl9TQ0FMRSkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBtb3ZlWCA9IGRldGFpbC5lbmRYIC0gZGV0YWlsLnN0YXJ0WDtcbiAgICAgICAgY29uc3QgbW92ZVkgPSBkZXRhaWwuZW5kWSAtIGRldGFpbC5zdGFydFk7XG4gICAgICAgIGNvbnN0IHsgd2lkdGgsIGhlaWdodCB9ID0gdGhpcztcbiAgICAgICAgbGV0IHsgYXNwZWN0UmF0aW8gfSA9IHRoaXM7XG4gICAgICAgIC8vIExvY2tpbmcgYXNwZWN0IHJhdGlvIGJ5IGhvbGRpbmcgc2hpZnQga2V5XG4gICAgICAgIGlmICghaXNQb3NpdGl2ZU51bWJlcihhc3BlY3RSYXRpbykgJiYgcmVsYXRlZEV2ZW50LnNoaWZ0S2V5KSB7XG4gICAgICAgICAgICBhc3BlY3RSYXRpbyA9IGlzUG9zaXRpdmVOdW1iZXIod2lkdGgpICYmIGlzUG9zaXRpdmVOdW1iZXIoaGVpZ2h0KSA/IHdpZHRoIC8gaGVpZ2h0IDogMTtcbiAgICAgICAgfVxuICAgICAgICBzd2l0Y2ggKGFjdGlvbikge1xuICAgICAgICAgICAgY2FzZSBBQ1RJT05fU0VMRUNUOlxuICAgICAgICAgICAgICAgIGlmIChtb3ZlWCAhPT0gMCAmJiBtb3ZlWSAhPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB7ICRjYW52YXMgfSA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG9mZnNldCA9IGdldE9mZnNldChjdXJyZW50VGFyZ2V0KTtcbiAgICAgICAgICAgICAgICAgICAgKHRoaXMubXVsdGlwbGUgJiYgIXRoaXMuaGlkZGVuID8gdGhpcy4kY3JlYXRlU2VsZWN0aW9uKCkgOiB0aGlzKS4kY2hhbmdlKGRldGFpbC5zdGFydFggLSBvZmZzZXQubGVmdCwgZGV0YWlsLnN0YXJ0WSAtIG9mZnNldC50b3AsIE1hdGguYWJzKG1vdmVYKSwgTWF0aC5hYnMobW92ZVkpLCBhc3BlY3RSYXRpbyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChtb3ZlWCA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtb3ZlWSA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBcdTIxOTZcdUZFMEZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb24gPSBBQ1RJT05fUkVTSVpFX05PUlRIV0VTVDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKG1vdmVZID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFx1MjE5OVx1RkUwRlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbiA9IEFDVElPTl9SRVNJWkVfU09VVEhXRVNUO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKG1vdmVYID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1vdmVZIDwgMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFx1MjE5N1x1RkUwRlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbiA9IEFDVElPTl9SRVNJWkVfTk9SVEhFQVNUO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAobW92ZVkgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gXHUyMTk4XHVGRTBGXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uID0gQUNUSU9OX1JFU0laRV9TT1VUSEVBU1Q7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKCRjYW52YXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRjYW52YXMuJGFjdGlvbiA9IGFjdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgQUNUSU9OX01PVkU6XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubW92YWJsZSAmJiAodGhpcy5keW5hbWljXG4gICAgICAgICAgICAgICAgICAgIHx8ICh0aGlzLiRhY3Rpb25TdGFydFRhcmdldCAmJiB0aGlzLmNvbnRhaW5zKHRoaXMuJGFjdGlvblN0YXJ0VGFyZ2V0KSkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuJG1vdmUobW92ZVgsIG1vdmVZKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIEFDVElPTl9TQ0FMRTpcbiAgICAgICAgICAgICAgICBpZiAocmVsYXRlZEV2ZW50ICYmIHRoaXMuem9vbWFibGUgJiYgKHRoaXMuZHluYW1pY1xuICAgICAgICAgICAgICAgICAgICB8fCB0aGlzLmNvbnRhaW5zKHJlbGF0ZWRFdmVudC50YXJnZXQpKSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBvZmZzZXQgPSBnZXRPZmZzZXQoY3VycmVudFRhcmdldCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuJHpvb20oZGV0YWlsLnNjYWxlLCByZWxhdGVkRXZlbnQucGFnZVggLSBvZmZzZXQubGVmdCwgcmVsYXRlZEV2ZW50LnBhZ2VZIC0gb2Zmc2V0LnRvcCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICB0aGlzLiRyZXNpemUoYWN0aW9uLCBtb3ZlWCwgbW92ZVksIGFzcGVjdFJhdGlvKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAkaGFuZGxlQWN0aW9uRW5kKCkge1xuICAgICAgICB0aGlzLiRhY3Rpb24gPSAnJztcbiAgICAgICAgdGhpcy4kYWN0aW9uU3RhcnRUYXJnZXQgPSBudWxsO1xuICAgIH1cbiAgICAkaGFuZGxlS2V5RG93bihldmVudCkge1xuICAgICAgICBpZiAodGhpcy5oaWRkZW5cbiAgICAgICAgICAgIHx8ICF0aGlzLmtleWJvYXJkXG4gICAgICAgICAgICB8fCAodGhpcy5tdWx0aXBsZSAmJiAhdGhpcy5hY3RpdmUpXG4gICAgICAgICAgICB8fCBldmVudC5kZWZhdWx0UHJldmVudGVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgeyBhY3RpdmVFbGVtZW50IH0gPSBkb2N1bWVudDtcbiAgICAgICAgLy8gRGlzYWJsZSBrZXlib2FyZCBjb250cm9sIHdoZW4gaW5wdXQgc29tZXRoaW5nXG4gICAgICAgIGlmIChhY3RpdmVFbGVtZW50ICYmIChbJ0lOUFVUJywgJ1RFWFRBUkVBJ10uaW5jbHVkZXMoYWN0aXZlRWxlbWVudC50YWdOYW1lKVxuICAgICAgICAgICAgfHwgWyd0cnVlJywgJ3BsYWludGV4dC1vbmx5J10uaW5jbHVkZXMoYWN0aXZlRWxlbWVudC5jb250ZW50RWRpdGFibGUpKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHN3aXRjaCAoZXZlbnQua2V5KSB7XG4gICAgICAgICAgICBjYXNlICdCYWNrc3BhY2UnOlxuICAgICAgICAgICAgICAgIGlmIChldmVudC5tZXRhS2V5KSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuJHJlbW92ZVNlbGVjdGlvbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ0RlbGV0ZSc6XG4gICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICB0aGlzLiRyZW1vdmVTZWxlY3Rpb24oKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIC8vIE1vdmUgdG8gdGhlIGxlZnRcbiAgICAgICAgICAgIGNhc2UgJ0Fycm93TGVmdCc6XG4gICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICB0aGlzLiRtb3ZlKC0xLCAwKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIC8vIE1vdmUgdG8gdGhlIHJpZ2h0XG4gICAgICAgICAgICBjYXNlICdBcnJvd1JpZ2h0JzpcbiAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuJG1vdmUoMSwgMCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAvLyBNb3ZlIHRvIHRoZSB0b3BcbiAgICAgICAgICAgIGNhc2UgJ0Fycm93VXAnOlxuICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgdGhpcy4kbW92ZSgwLCAtMSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAvLyBNb3ZlIHRvIHRoZSBib3R0b21cbiAgICAgICAgICAgIGNhc2UgJ0Fycm93RG93bic6XG4gICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICB0aGlzLiRtb3ZlKDAsIDEpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnKyc6XG4gICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICB0aGlzLiR6b29tKDAuMSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICctJzpcbiAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuJHpvb20oLTAuMSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogQWxpZ25zIHRoZSBzZWxlY3Rpb24gdG8gdGhlIGNlbnRlciBvZiBpdHMgcGFyZW50IGVsZW1lbnQuXG4gICAgICogQHJldHVybnMge0Nyb3BwZXJTZWxlY3Rpb259IFJldHVybnMgYHRoaXNgIGZvciBjaGFpbmluZy5cbiAgICAgKi9cbiAgICAkY2VudGVyKCkge1xuICAgICAgICBjb25zdCB7IHBhcmVudEVsZW1lbnQgfSA9IHRoaXM7XG4gICAgICAgIGlmICghcGFyZW50RWxlbWVudCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgeCA9IChwYXJlbnRFbGVtZW50Lm9mZnNldFdpZHRoIC0gdGhpcy53aWR0aCkgLyAyO1xuICAgICAgICBjb25zdCB5ID0gKHBhcmVudEVsZW1lbnQub2Zmc2V0SGVpZ2h0IC0gdGhpcy5oZWlnaHQpIC8gMjtcbiAgICAgICAgcmV0dXJuIHRoaXMuJGNoYW5nZSh4LCB5KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogTW92ZXMgdGhlIHNlbGVjdGlvbi5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0geCBUaGUgbW92aW5nIGRpc3RhbmNlIGluIHRoZSBob3Jpem9udGFsIGRpcmVjdGlvbi5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW3ldIFRoZSBtb3ZpbmcgZGlzdGFuY2UgaW4gdGhlIHZlcnRpY2FsIGRpcmVjdGlvbi5cbiAgICAgKiBAcmV0dXJucyB7Q3JvcHBlclNlbGVjdGlvbn0gUmV0dXJucyBgdGhpc2AgZm9yIGNoYWluaW5nLlxuICAgICAqL1xuICAgICRtb3ZlKHgsIHkgPSB4KSB7XG4gICAgICAgIHJldHVybiB0aGlzLiRtb3ZlVG8odGhpcy54ICsgeCwgdGhpcy55ICsgeSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIE1vdmVzIHRoZSBzZWxlY3Rpb24gdG8gYSBzcGVjaWZpYyBwb3NpdGlvbi5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0geCBUaGUgbmV3IHBvc2l0aW9uIGluIHRoZSBob3Jpem9udGFsIGRpcmVjdGlvbi5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW3ldIFRoZSBuZXcgcG9zaXRpb24gaW4gdGhlIHZlcnRpY2FsIGRpcmVjdGlvbi5cbiAgICAgKiBAcmV0dXJucyB7Q3JvcHBlclNlbGVjdGlvbn0gUmV0dXJucyBgdGhpc2AgZm9yIGNoYWluaW5nLlxuICAgICAqL1xuICAgICRtb3ZlVG8oeCwgeSA9IHgpIHtcbiAgICAgICAgaWYgKCF0aGlzLm1vdmFibGUpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLiRjaGFuZ2UoeCwgeSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEFkanVzdHMgdGhlIHNpemUgdGhlIHNlbGVjdGlvbiBvbiBhIHNwZWNpZmljIHNpZGUgb3IgY29ybmVyLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBhY3Rpb24gSW5kaWNhdGVzIHRoZSBzaWRlIG9yIGNvcm5lciB0byByZXNpemUuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtvZmZzZXRYXSBUaGUgaG9yaXpvbnRhbCBvZmZzZXQgb2YgdGhlIHNwZWNpZmljIHNpZGUgb3IgY29ybmVyLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbb2Zmc2V0WV0gVGhlIHZlcnRpY2FsIG9mZnNldCBvZiB0aGUgc3BlY2lmaWMgc2lkZSBvciBjb3JuZXIuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFthc3BlY3RSYXRpb10gVGhlIGFzcGVjdCByYXRpbyBmb3IgY29tcHV0aW5nIHRoZSBuZXcgc2l6ZSBpZiBpdCBpcyBuZWNlc3NhcnkuXG4gICAgICogQHJldHVybnMge0Nyb3BwZXJTZWxlY3Rpb259IFJldHVybnMgYHRoaXNgIGZvciBjaGFpbmluZy5cbiAgICAgKi9cbiAgICAkcmVzaXplKGFjdGlvbiwgb2Zmc2V0WCA9IDAsIG9mZnNldFkgPSAwLCBhc3BlY3RSYXRpbyA9IHRoaXMuYXNwZWN0UmF0aW8pIHtcbiAgICAgICAgaWYgKCF0aGlzLnJlc2l6YWJsZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgaGFzVmFsaWRBc3BlY3RSYXRpbyA9IGlzUG9zaXRpdmVOdW1iZXIoYXNwZWN0UmF0aW8pO1xuICAgICAgICBjb25zdCB7ICRjYW52YXMgfSA9IHRoaXM7XG4gICAgICAgIGxldCB7IHgsIHksIHdpZHRoLCBoZWlnaHQsIH0gPSB0aGlzO1xuICAgICAgICBzd2l0Y2ggKGFjdGlvbikge1xuICAgICAgICAgICAgY2FzZSBBQ1RJT05fUkVTSVpFX05PUlRIOlxuICAgICAgICAgICAgICAgIHkgKz0gb2Zmc2V0WTtcbiAgICAgICAgICAgICAgICBoZWlnaHQgLT0gb2Zmc2V0WTtcbiAgICAgICAgICAgICAgICBpZiAoaGVpZ2h0IDwgMCkge1xuICAgICAgICAgICAgICAgICAgICBhY3Rpb24gPSBBQ1RJT05fUkVTSVpFX1NPVVRIO1xuICAgICAgICAgICAgICAgICAgICBoZWlnaHQgPSAtaGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICB5IC09IGhlaWdodDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGhhc1ZhbGlkQXNwZWN0UmF0aW8pIHtcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0WCA9IG9mZnNldFkgKiBhc3BlY3RSYXRpbztcbiAgICAgICAgICAgICAgICAgICAgeCArPSBvZmZzZXRYIC8gMjtcbiAgICAgICAgICAgICAgICAgICAgd2lkdGggLT0gb2Zmc2V0WDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHdpZHRoIDwgMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGggPSAtd2lkdGg7XG4gICAgICAgICAgICAgICAgICAgICAgICB4IC09IHdpZHRoO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBBQ1RJT05fUkVTSVpFX0VBU1Q6XG4gICAgICAgICAgICAgICAgd2lkdGggKz0gb2Zmc2V0WDtcbiAgICAgICAgICAgICAgICBpZiAod2lkdGggPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbiA9IEFDVElPTl9SRVNJWkVfV0VTVDtcbiAgICAgICAgICAgICAgICAgICAgd2lkdGggPSAtd2lkdGg7XG4gICAgICAgICAgICAgICAgICAgIHggLT0gd2lkdGg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChoYXNWYWxpZEFzcGVjdFJhdGlvKSB7XG4gICAgICAgICAgICAgICAgICAgIG9mZnNldFkgPSBvZmZzZXRYIC8gYXNwZWN0UmF0aW87XG4gICAgICAgICAgICAgICAgICAgIHkgLT0gb2Zmc2V0WSAvIDI7XG4gICAgICAgICAgICAgICAgICAgIGhlaWdodCArPSBvZmZzZXRZO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaGVpZ2h0IDwgMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0ID0gLWhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHkgLT0gaGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBBQ1RJT05fUkVTSVpFX1NPVVRIOlxuICAgICAgICAgICAgICAgIGhlaWdodCArPSBvZmZzZXRZO1xuICAgICAgICAgICAgICAgIGlmIChoZWlnaHQgPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbiA9IEFDVElPTl9SRVNJWkVfTk9SVEg7XG4gICAgICAgICAgICAgICAgICAgIGhlaWdodCA9IC1oZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgIHkgLT0gaGVpZ2h0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoaGFzVmFsaWRBc3BlY3RSYXRpbykge1xuICAgICAgICAgICAgICAgICAgICBvZmZzZXRYID0gb2Zmc2V0WSAqIGFzcGVjdFJhdGlvO1xuICAgICAgICAgICAgICAgICAgICB4IC09IG9mZnNldFggLyAyO1xuICAgICAgICAgICAgICAgICAgICB3aWR0aCArPSBvZmZzZXRYO1xuICAgICAgICAgICAgICAgICAgICBpZiAod2lkdGggPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3aWR0aCA9IC13aWR0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHggLT0gd2lkdGg7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIEFDVElPTl9SRVNJWkVfV0VTVDpcbiAgICAgICAgICAgICAgICB4ICs9IG9mZnNldFg7XG4gICAgICAgICAgICAgICAgd2lkdGggLT0gb2Zmc2V0WDtcbiAgICAgICAgICAgICAgICBpZiAod2lkdGggPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbiA9IEFDVElPTl9SRVNJWkVfRUFTVDtcbiAgICAgICAgICAgICAgICAgICAgd2lkdGggPSAtd2lkdGg7XG4gICAgICAgICAgICAgICAgICAgIHggLT0gd2lkdGg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChoYXNWYWxpZEFzcGVjdFJhdGlvKSB7XG4gICAgICAgICAgICAgICAgICAgIG9mZnNldFkgPSBvZmZzZXRYIC8gYXNwZWN0UmF0aW87XG4gICAgICAgICAgICAgICAgICAgIHkgKz0gb2Zmc2V0WSAvIDI7XG4gICAgICAgICAgICAgICAgICAgIGhlaWdodCAtPSBvZmZzZXRZO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaGVpZ2h0IDwgMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0ID0gLWhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHkgLT0gaGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBBQ1RJT05fUkVTSVpFX05PUlRIRUFTVDpcbiAgICAgICAgICAgICAgICBpZiAoaGFzVmFsaWRBc3BlY3RSYXRpbykge1xuICAgICAgICAgICAgICAgICAgICBvZmZzZXRZID0gLW9mZnNldFggLyBhc3BlY3RSYXRpbztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgeSArPSBvZmZzZXRZO1xuICAgICAgICAgICAgICAgIGhlaWdodCAtPSBvZmZzZXRZO1xuICAgICAgICAgICAgICAgIHdpZHRoICs9IG9mZnNldFg7XG4gICAgICAgICAgICAgICAgaWYgKHdpZHRoIDwgMCAmJiBoZWlnaHQgPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbiA9IEFDVElPTl9SRVNJWkVfU09VVEhXRVNUO1xuICAgICAgICAgICAgICAgICAgICB3aWR0aCA9IC13aWR0aDtcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0ID0gLWhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgeCAtPSB3aWR0aDtcbiAgICAgICAgICAgICAgICAgICAgeSAtPSBoZWlnaHQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHdpZHRoIDwgMCkge1xuICAgICAgICAgICAgICAgICAgICBhY3Rpb24gPSBBQ1RJT05fUkVTSVpFX05PUlRIV0VTVDtcbiAgICAgICAgICAgICAgICAgICAgd2lkdGggPSAtd2lkdGg7XG4gICAgICAgICAgICAgICAgICAgIHggLT0gd2lkdGg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGhlaWdodCA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uID0gQUNUSU9OX1JFU0laRV9TT1VUSEVBU1Q7XG4gICAgICAgICAgICAgICAgICAgIGhlaWdodCA9IC1oZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgIHkgLT0gaGVpZ2h0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgQUNUSU9OX1JFU0laRV9OT1JUSFdFU1Q6XG4gICAgICAgICAgICAgICAgaWYgKGhhc1ZhbGlkQXNwZWN0UmF0aW8pIHtcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0WSA9IG9mZnNldFggLyBhc3BlY3RSYXRpbztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgeCArPSBvZmZzZXRYO1xuICAgICAgICAgICAgICAgIHkgKz0gb2Zmc2V0WTtcbiAgICAgICAgICAgICAgICB3aWR0aCAtPSBvZmZzZXRYO1xuICAgICAgICAgICAgICAgIGhlaWdodCAtPSBvZmZzZXRZO1xuICAgICAgICAgICAgICAgIGlmICh3aWR0aCA8IDAgJiYgaGVpZ2h0IDwgMCkge1xuICAgICAgICAgICAgICAgICAgICBhY3Rpb24gPSBBQ1RJT05fUkVTSVpFX1NPVVRIRUFTVDtcbiAgICAgICAgICAgICAgICAgICAgd2lkdGggPSAtd2lkdGg7XG4gICAgICAgICAgICAgICAgICAgIGhlaWdodCA9IC1oZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgIHggLT0gd2lkdGg7XG4gICAgICAgICAgICAgICAgICAgIHkgLT0gaGVpZ2h0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmICh3aWR0aCA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uID0gQUNUSU9OX1JFU0laRV9OT1JUSEVBU1Q7XG4gICAgICAgICAgICAgICAgICAgIHdpZHRoID0gLXdpZHRoO1xuICAgICAgICAgICAgICAgICAgICB4IC09IHdpZHRoO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChoZWlnaHQgPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbiA9IEFDVElPTl9SRVNJWkVfU09VVEhXRVNUO1xuICAgICAgICAgICAgICAgICAgICBoZWlnaHQgPSAtaGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICB5IC09IGhlaWdodDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIEFDVElPTl9SRVNJWkVfU09VVEhFQVNUOlxuICAgICAgICAgICAgICAgIGlmIChoYXNWYWxpZEFzcGVjdFJhdGlvKSB7XG4gICAgICAgICAgICAgICAgICAgIG9mZnNldFkgPSBvZmZzZXRYIC8gYXNwZWN0UmF0aW87XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHdpZHRoICs9IG9mZnNldFg7XG4gICAgICAgICAgICAgICAgaGVpZ2h0ICs9IG9mZnNldFk7XG4gICAgICAgICAgICAgICAgaWYgKHdpZHRoIDwgMCAmJiBoZWlnaHQgPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbiA9IEFDVElPTl9SRVNJWkVfTk9SVEhXRVNUO1xuICAgICAgICAgICAgICAgICAgICB3aWR0aCA9IC13aWR0aDtcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0ID0gLWhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgeCAtPSB3aWR0aDtcbiAgICAgICAgICAgICAgICAgICAgeSAtPSBoZWlnaHQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHdpZHRoIDwgMCkge1xuICAgICAgICAgICAgICAgICAgICBhY3Rpb24gPSBBQ1RJT05fUkVTSVpFX1NPVVRIV0VTVDtcbiAgICAgICAgICAgICAgICAgICAgd2lkdGggPSAtd2lkdGg7XG4gICAgICAgICAgICAgICAgICAgIHggLT0gd2lkdGg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGhlaWdodCA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uID0gQUNUSU9OX1JFU0laRV9OT1JUSEVBU1Q7XG4gICAgICAgICAgICAgICAgICAgIGhlaWdodCA9IC1oZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgIHkgLT0gaGVpZ2h0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgQUNUSU9OX1JFU0laRV9TT1VUSFdFU1Q6XG4gICAgICAgICAgICAgICAgaWYgKGhhc1ZhbGlkQXNwZWN0UmF0aW8pIHtcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0WSA9IC1vZmZzZXRYIC8gYXNwZWN0UmF0aW87XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHggKz0gb2Zmc2V0WDtcbiAgICAgICAgICAgICAgICB3aWR0aCAtPSBvZmZzZXRYO1xuICAgICAgICAgICAgICAgIGhlaWdodCArPSBvZmZzZXRZO1xuICAgICAgICAgICAgICAgIGlmICh3aWR0aCA8IDAgJiYgaGVpZ2h0IDwgMCkge1xuICAgICAgICAgICAgICAgICAgICBhY3Rpb24gPSBBQ1RJT05fUkVTSVpFX05PUlRIRUFTVDtcbiAgICAgICAgICAgICAgICAgICAgd2lkdGggPSAtd2lkdGg7XG4gICAgICAgICAgICAgICAgICAgIGhlaWdodCA9IC1oZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgIHggLT0gd2lkdGg7XG4gICAgICAgICAgICAgICAgICAgIHkgLT0gaGVpZ2h0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmICh3aWR0aCA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uID0gQUNUSU9OX1JFU0laRV9TT1VUSEVBU1Q7XG4gICAgICAgICAgICAgICAgICAgIHdpZHRoID0gLXdpZHRoO1xuICAgICAgICAgICAgICAgICAgICB4IC09IHdpZHRoO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChoZWlnaHQgPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbiA9IEFDVElPTl9SRVNJWkVfTk9SVEhXRVNUO1xuICAgICAgICAgICAgICAgICAgICBoZWlnaHQgPSAtaGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICB5IC09IGhlaWdodDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCRjYW52YXMpIHtcbiAgICAgICAgICAgICRjYW52YXMuJHNldEFjdGlvbihhY3Rpb24pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLiRjaGFuZ2UoeCwgeSwgd2lkdGgsIGhlaWdodCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFpvb21zIHRoZSBzZWxlY3Rpb24uXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHNjYWxlIFRoZSB6b29tIGZhY3Rvci4gUG9zaXRpdmUgbnVtYmVycyBmb3Igem9vbWluZyBpbiwgYW5kIG5lZ2F0aXZlIG51bWJlcnMgZm9yIHpvb21pbmcgb3V0LlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbeF0gVGhlIHpvb20gb3JpZ2luIGluIHRoZSBob3Jpem9udGFsLCBkZWZhdWx0cyB0byB0aGUgY2VudGVyIG9mIHRoZSBzZWxlY3Rpb24uXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFt5XSBUaGUgem9vbSBvcmlnaW4gaW4gdGhlIHZlcnRpY2FsLCBkZWZhdWx0cyB0byB0aGUgY2VudGVyIG9mIHRoZSBzZWxlY3Rpb24uXG4gICAgICogQHJldHVybnMge0Nyb3BwZXJTZWxlY3Rpb259IFJldHVybnMgYHRoaXNgIGZvciBjaGFpbmluZy5cbiAgICAgKi9cbiAgICAkem9vbShzY2FsZSwgeCwgeSkge1xuICAgICAgICBpZiAoIXRoaXMuem9vbWFibGUgfHwgc2NhbGUgPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzY2FsZSA8IDApIHtcbiAgICAgICAgICAgIHNjYWxlID0gMSAvICgxIC0gc2NhbGUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgc2NhbGUgKz0gMTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB7IHdpZHRoLCBoZWlnaHQgfSA9IHRoaXM7XG4gICAgICAgIGNvbnN0IG5ld1dpZHRoID0gd2lkdGggKiBzY2FsZTtcbiAgICAgICAgY29uc3QgbmV3SGVpZ2h0ID0gaGVpZ2h0ICogc2NhbGU7XG4gICAgICAgIGxldCBuZXdYID0gdGhpcy54O1xuICAgICAgICBsZXQgbmV3WSA9IHRoaXMueTtcbiAgICAgICAgaWYgKGlzTnVtYmVyKHgpICYmIGlzTnVtYmVyKHkpKSB7XG4gICAgICAgICAgICBuZXdYIC09IChuZXdXaWR0aCAtIHdpZHRoKSAqICgoeCAtIHRoaXMueCkgLyB3aWR0aCk7XG4gICAgICAgICAgICBuZXdZIC09IChuZXdIZWlnaHQgLSBoZWlnaHQpICogKCh5IC0gdGhpcy55KSAvIGhlaWdodCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvLyBab29tIGZyb20gdGhlIGNlbnRlciBvZiB0aGUgc2VsZWN0aW9uXG4gICAgICAgICAgICBuZXdYIC09IChuZXdXaWR0aCAtIHdpZHRoKSAvIDI7XG4gICAgICAgICAgICBuZXdZIC09IChuZXdIZWlnaHQgLSBoZWlnaHQpIC8gMjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy4kY2hhbmdlKG5ld1gsIG5ld1ksIG5ld1dpZHRoLCBuZXdIZWlnaHQpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDaGFuZ2VzIHRoZSBwb3NpdGlvbiBhbmQvb3Igc2l6ZSBvZiB0aGUgc2VsZWN0aW9uLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB4IFRoZSBuZXcgcG9zaXRpb24gaW4gdGhlIGhvcml6b250YWwgZGlyZWN0aW9uLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB5IFRoZSBuZXcgcG9zaXRpb24gaW4gdGhlIHZlcnRpY2FsIGRpcmVjdGlvbi5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW3dpZHRoXSBUaGUgbmV3IHdpZHRoLlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBbaGVpZ2h0XSBUaGUgbmV3IGhlaWdodC5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW2FzcGVjdFJhdGlvXSBUaGUgbmV3IGFzcGVjdCByYXRpbyBmb3IgdGhpcyBjaGFuZ2Ugb25seS5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW19mb3JjZV0gRm9yY2UgY2hhbmdlLlxuICAgICAqIEByZXR1cm5zIHtDcm9wcGVyU2VsZWN0aW9ufSBSZXR1cm5zIGB0aGlzYCBmb3IgY2hhaW5pbmcuXG4gICAgICovXG4gICAgJGNoYW5nZSh4LCB5LCB3aWR0aCA9IHRoaXMud2lkdGgsIGhlaWdodCA9IHRoaXMuaGVpZ2h0LCBhc3BlY3RSYXRpbyA9IHRoaXMuYXNwZWN0UmF0aW8sIF9mb3JjZSA9IGZhbHNlKSB7XG4gICAgICAgIGlmICh0aGlzLiRjaGFuZ2luZ1xuICAgICAgICAgICAgfHwgIWlzTnVtYmVyKHgpXG4gICAgICAgICAgICB8fCAhaXNOdW1iZXIoeSlcbiAgICAgICAgICAgIHx8ICFpc051bWJlcih3aWR0aClcbiAgICAgICAgICAgIHx8ICFpc051bWJlcihoZWlnaHQpXG4gICAgICAgICAgICB8fCB3aWR0aCA8IDBcbiAgICAgICAgICAgIHx8IGhlaWdodCA8IDApIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpc1Bvc2l0aXZlTnVtYmVyKGFzcGVjdFJhdGlvKSkge1xuICAgICAgICAgICAgKHsgd2lkdGgsIGhlaWdodCB9ID0gZ2V0QWRqdXN0ZWRTaXplcyh7IGFzcGVjdFJhdGlvLCB3aWR0aCwgaGVpZ2h0IH0sICdjb3ZlcicpKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMucHJlY2lzZSkge1xuICAgICAgICAgICAgeCA9IE1hdGgucm91bmQoeCk7XG4gICAgICAgICAgICB5ID0gTWF0aC5yb3VuZCh5KTtcbiAgICAgICAgICAgIHdpZHRoID0gTWF0aC5yb3VuZCh3aWR0aCk7XG4gICAgICAgICAgICBoZWlnaHQgPSBNYXRoLnJvdW5kKGhlaWdodCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHggPT09IHRoaXMueFxuICAgICAgICAgICAgJiYgeSA9PT0gdGhpcy55XG4gICAgICAgICAgICAmJiB3aWR0aCA9PT0gdGhpcy53aWR0aFxuICAgICAgICAgICAgJiYgaGVpZ2h0ID09PSB0aGlzLmhlaWdodFxuICAgICAgICAgICAgJiYgT2JqZWN0LmlzKGFzcGVjdFJhdGlvLCB0aGlzLmFzcGVjdFJhdGlvKVxuICAgICAgICAgICAgJiYgIV9mb3JjZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuaGlkZGVuKSB7XG4gICAgICAgICAgICB0aGlzLmhpZGRlbiA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLiRlbWl0KEVWRU5UX0NIQU5HRSwge1xuICAgICAgICAgICAgeCxcbiAgICAgICAgICAgIHksXG4gICAgICAgICAgICB3aWR0aCxcbiAgICAgICAgICAgIGhlaWdodCxcbiAgICAgICAgfSkgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLiRjaGFuZ2luZyA9IHRydWU7XG4gICAgICAgIHRoaXMueCA9IHg7XG4gICAgICAgIHRoaXMueSA9IHk7XG4gICAgICAgIHRoaXMud2lkdGggPSB3aWR0aDtcbiAgICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgIHRoaXMuJGNoYW5naW5nID0gZmFsc2U7XG4gICAgICAgIHJldHVybiB0aGlzLiRyZW5kZXIoKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmVzZXRzIHRoZSBzZWxlY3Rpb24gdG8gaXRzIGluaXRpYWwgcG9zaXRpb24gYW5kIHNpemUuXG4gICAgICogQHJldHVybnMge0Nyb3BwZXJTZWxlY3Rpb259IFJldHVybnMgYHRoaXNgIGZvciBjaGFpbmluZy5cbiAgICAgKi9cbiAgICAkcmVzZXQoKSB7XG4gICAgICAgIGNvbnN0IHsgeCwgeSwgd2lkdGgsIGhlaWdodCwgfSA9IHRoaXMuJGluaXRpYWxTZWxlY3Rpb247XG4gICAgICAgIHJldHVybiB0aGlzLiRjaGFuZ2UoeCwgeSwgd2lkdGgsIGhlaWdodCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENsZWFycyB0aGUgc2VsZWN0aW9uLlxuICAgICAqIEByZXR1cm5zIHtDcm9wcGVyU2VsZWN0aW9ufSBSZXR1cm5zIGB0aGlzYCBmb3IgY2hhaW5pbmcuXG4gICAgICovXG4gICAgJGNsZWFyKCkge1xuICAgICAgICB0aGlzLiRjaGFuZ2UoMCwgMCwgMCwgMCwgTmFOLCB0cnVlKTtcbiAgICAgICAgdGhpcy5oaWRkZW4gPSB0cnVlO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmVmcmVzaGVzIHRoZSBwb3NpdGlvbiBvciBzaXplIG9mIHRoZSBzZWxlY3Rpb24uXG4gICAgICogQHJldHVybnMge0Nyb3BwZXJTZWxlY3Rpb259IFJldHVybnMgYHRoaXNgIGZvciBjaGFpbmluZy5cbiAgICAgKi9cbiAgICAkcmVuZGVyKCkge1xuICAgICAgICByZXR1cm4gdGhpcy4kc2V0U3R5bGVzKHtcbiAgICAgICAgICAgIHRyYW5zZm9ybTogYHRyYW5zbGF0ZSgke3RoaXMueH1weCwgJHt0aGlzLnl9cHgpYCxcbiAgICAgICAgICAgIHdpZHRoOiB0aGlzLndpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiB0aGlzLmhlaWdodCxcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlcyBhIHJlYWwgY2FudmFzIGVsZW1lbnQsIHdpdGggdGhlIGltYWdlIChzZWxlY3RlZCBhcmVhIG9ubHkpIGRyYXcgaW50byBpZiB0aGVyZSBpcyBvbmUuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zXSBUaGUgYXZhaWxhYmxlIG9wdGlvbnMuXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IFtvcHRpb25zLndpZHRoXSBUaGUgd2lkdGggb2YgdGhlIGNhbnZhcy5cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMuaGVpZ2h0XSBUaGUgaGVpZ2h0IG9mIHRoZSBjYW52YXMuXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gW29wdGlvbnMuYmVmb3JlRHJhd10gVGhlIGZ1bmN0aW9uIGNhbGxlZCBiZWZvcmUgZHJhd2luZyB0aGUgaW1hZ2Ugb250byB0aGUgY2FudmFzLlxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlfSBSZXR1cm5zIGEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHRvIHRoZSBnZW5lcmF0ZWQgY2FudmFzIGVsZW1lbnQuXG4gICAgICovXG4gICAgJHRvQ2FudmFzKG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGlmICghdGhpcy5pc0Nvbm5lY3RlZCkge1xuICAgICAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoJ1RoZSBjdXJyZW50IGVsZW1lbnQgaXMgbm90IGNvbm5lY3RlZCB0byB0aGUgRE9NLicpKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgICAgICAgIGxldCB7IHdpZHRoLCBoZWlnaHQgfSA9IHRoaXM7XG4gICAgICAgICAgICBsZXQgc2NhbGUgPSAxO1xuICAgICAgICAgICAgaWYgKGlzUGxhaW5PYmplY3Qob3B0aW9ucylcbiAgICAgICAgICAgICAgICAmJiAoaXNQb3NpdGl2ZU51bWJlcihvcHRpb25zLndpZHRoKSB8fCBpc1Bvc2l0aXZlTnVtYmVyKG9wdGlvbnMuaGVpZ2h0KSkpIHtcbiAgICAgICAgICAgICAgICAoeyB3aWR0aCwgaGVpZ2h0IH0gPSBnZXRBZGp1c3RlZFNpemVzKHtcbiAgICAgICAgICAgICAgICAgICAgYXNwZWN0UmF0aW86IHdpZHRoIC8gaGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgICB3aWR0aDogb3B0aW9ucy53aWR0aCxcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBvcHRpb25zLmhlaWdodCxcbiAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICAgICAgc2NhbGUgPSB3aWR0aCAvIHRoaXMud2lkdGg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYW52YXMud2lkdGggPSB3aWR0aDtcbiAgICAgICAgICAgIGNhbnZhcy5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgICAgICBpZiAoIXRoaXMuJGNhbnZhcykge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoY2FudmFzKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBjcm9wcGVySW1hZ2UgPSB0aGlzLiRjYW52YXMucXVlcnlTZWxlY3Rvcih0aGlzLiRnZXRUYWdOYW1lT2YoQ1JPUFBFUl9JTUFHRSkpO1xuICAgICAgICAgICAgaWYgKCFjcm9wcGVySW1hZ2UpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKGNhbnZhcyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY3JvcHBlckltYWdlLiRyZWFkeSgpLnRoZW4oKGltYWdlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgICAgICAgICAgICAgIGlmIChjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IFthLCBiLCBjLCBkLCBlLCBmXSA9IGNyb3BwZXJJbWFnZS4kZ2V0VHJhbnNmb3JtKCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG9mZnNldFggPSAtdGhpcy54O1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBvZmZzZXRZID0gLXRoaXMueTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdHJhbnNsYXRlWCA9ICgob2Zmc2V0WCAqIGQpIC0gKGMgKiBvZmZzZXRZKSkgLyAoKGEgKiBkKSAtIChjICogYikpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB0cmFuc2xhdGVZID0gKChvZmZzZXRZICogYSkgLSAoYiAqIG9mZnNldFgpKSAvICgoYSAqIGQpIC0gKGMgKiBiKSk7XG4gICAgICAgICAgICAgICAgICAgIGxldCBuZXdFID0gYSAqIHRyYW5zbGF0ZVggKyBjICogdHJhbnNsYXRlWSArIGU7XG4gICAgICAgICAgICAgICAgICAgIGxldCBuZXdGID0gYiAqIHRyYW5zbGF0ZVggKyBkICogdHJhbnNsYXRlWSArIGY7XG4gICAgICAgICAgICAgICAgICAgIGxldCBkZXN0V2lkdGggPSBpbWFnZS5uYXR1cmFsV2lkdGg7XG4gICAgICAgICAgICAgICAgICAgIGxldCBkZXN0SGVpZ2h0ID0gaW1hZ2UubmF0dXJhbEhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNjYWxlICE9PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdFICo9IHNjYWxlO1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV3RiAqPSBzY2FsZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc3RXaWR0aCAqPSBzY2FsZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc3RIZWlnaHQgKj0gc2NhbGU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2VudGVyWCA9IGRlc3RXaWR0aCAvIDI7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNlbnRlclkgPSBkZXN0SGVpZ2h0IC8gMjtcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dC5maWxsU3R5bGUgPSAndHJhbnNwYXJlbnQnO1xuICAgICAgICAgICAgICAgICAgICBjb250ZXh0LmZpbGxSZWN0KDAsIDAsIHdpZHRoLCBoZWlnaHQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXNQbGFpbk9iamVjdChvcHRpb25zKSAmJiBpc0Z1bmN0aW9uKG9wdGlvbnMuYmVmb3JlRHJhdykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnMuYmVmb3JlRHJhdy5jYWxsKHRoaXMsIGNvbnRleHQsIGNhbnZhcyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY29udGV4dC5zYXZlKCk7XG4gICAgICAgICAgICAgICAgICAgIC8vIE1vdmUgdGhlIHRyYW5zZm9ybSBvcmlnaW4gdG8gdGhlIGNlbnRlciBvZiB0aGUgaW1hZ2UuXG4gICAgICAgICAgICAgICAgICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0NTUy90cmFuc2Zvcm0tb3JpZ2luXG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQudHJhbnNsYXRlKGNlbnRlclgsIGNlbnRlclkpO1xuICAgICAgICAgICAgICAgICAgICBjb250ZXh0LnRyYW5zZm9ybShhLCBiLCBjLCBkLCBuZXdFLCBuZXdGKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gTW92ZSB0aGUgdHJhbnNmb3JtIG9yaWdpbiB0byB0aGUgdG9wLWxlZnQgb2YgdGhlIGltYWdlLlxuICAgICAgICAgICAgICAgICAgICBjb250ZXh0LnRyYW5zbGF0ZSgtY2VudGVyWCwgLWNlbnRlclkpO1xuICAgICAgICAgICAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZShpbWFnZSwgMCwgMCwgZGVzdFdpZHRoLCBkZXN0SGVpZ2h0KTtcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dC5yZXN0b3JlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlc29sdmUoY2FudmFzKTtcbiAgICAgICAgICAgIH0pLmNhdGNoKHJlamVjdCk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbkNyb3BwZXJTZWxlY3Rpb24uJG5hbWUgPSBDUk9QUEVSX1NFTEVDVElPTjtcbkNyb3BwZXJTZWxlY3Rpb24uJHZlcnNpb24gPSAnMi4wLjAnO1xuXG5leHBvcnQgeyBDcm9wcGVyU2VsZWN0aW9uIGFzIGRlZmF1bHQgfTtcbiIsICJpbXBvcnQgQ3JvcHBlckVsZW1lbnQgZnJvbSAnQGNyb3BwZXIvZWxlbWVudCc7XG5pbXBvcnQgeyBDUk9QUEVSX0dJUkQgfSBmcm9tICdAY3JvcHBlci91dGlscyc7XG5cbnZhciBzdHlsZSA9IGA6aG9zdHtkaXNwbGF5OmZsZXg7ZmxleC1kaXJlY3Rpb246Y29sdW1uO3Bvc2l0aW9uOnJlbGF0aXZlO3RvdWNoLWFjdGlvbjpub25lOy13ZWJraXQtdXNlci1zZWxlY3Q6bm9uZTstbW96LXVzZXItc2VsZWN0Om5vbmU7dXNlci1zZWxlY3Q6bm9uZX06aG9zdChbYm9yZGVyZWRdKXtib3JkZXI6MXB4IGRhc2hlZCB2YXIoLS10aGVtZS1jb2xvcil9Omhvc3QoW2NvdmVyZWRdKXtib3R0b206MDtsZWZ0OjA7cG9zaXRpb246YWJzb2x1dGU7cmlnaHQ6MDt0b3A6MH06aG9zdD5zcGFue2Rpc3BsYXk6ZmxleDtmbGV4OjF9Omhvc3Q+c3BhbitzcGFue2JvcmRlci10b3A6MXB4IGRhc2hlZCB2YXIoLS10aGVtZS1jb2xvcil9Omhvc3Q+c3Bhbj5zcGFue2ZsZXg6MX06aG9zdD5zcGFuPnNwYW4rc3Bhbntib3JkZXItbGVmdDoxcHggZGFzaGVkIHZhcigtLXRoZW1lLWNvbG9yKX1gO1xuXG5jbGFzcyBDcm9wcGVyR3JpZCBleHRlbmRzIENyb3BwZXJFbGVtZW50IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoLi4uYXJndW1lbnRzKTtcbiAgICAgICAgdGhpcy4kc3R5bGUgPSBzdHlsZTtcbiAgICAgICAgdGhpcy5ib3JkZXJlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmNvbHVtbnMgPSAzO1xuICAgICAgICB0aGlzLmNvdmVyZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5yb3dzID0gMztcbiAgICAgICAgdGhpcy5zbG90dGFibGUgPSBmYWxzZTtcbiAgICAgICAgdGhpcy50aGVtZUNvbG9yID0gJ3JnYmEoMjM4LCAyMzgsIDIzOCwgMC41KSc7XG4gICAgfVxuICAgIHN0YXRpYyBnZXQgb2JzZXJ2ZWRBdHRyaWJ1dGVzKCkge1xuICAgICAgICByZXR1cm4gc3VwZXIub2JzZXJ2ZWRBdHRyaWJ1dGVzLmNvbmNhdChbXG4gICAgICAgICAgICAnYm9yZGVyZWQnLFxuICAgICAgICAgICAgJ2NvbHVtbnMnLFxuICAgICAgICAgICAgJ2NvdmVyZWQnLFxuICAgICAgICAgICAgJ3Jvd3MnLFxuICAgICAgICBdKTtcbiAgICB9XG4gICAgJHByb3BlcnR5Q2hhbmdlZENhbGxiYWNrKG5hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZSkge1xuICAgICAgICBpZiAoT2JqZWN0LmlzKG5ld1ZhbHVlLCBvbGRWYWx1ZSkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBzdXBlci4kcHJvcGVydHlDaGFuZ2VkQ2FsbGJhY2sobmFtZSwgb2xkVmFsdWUsIG5ld1ZhbHVlKTtcbiAgICAgICAgaWYgKG5hbWUgPT09ICdyb3dzJyB8fCBuYW1lID09PSAnY29sdW1ucycpIHtcbiAgICAgICAgICAgIHRoaXMuJG5leHRUaWNrKCgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLiRyZW5kZXIoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNvbm5lY3RlZENhbGxiYWNrKCkge1xuICAgICAgICBzdXBlci5jb25uZWN0ZWRDYWxsYmFjaygpO1xuICAgICAgICB0aGlzLiRyZW5kZXIoKTtcbiAgICB9XG4gICAgJHJlbmRlcigpIHtcbiAgICAgICAgY29uc3Qgc2hhZG93ID0gdGhpcy4kZ2V0U2hhZG93Um9vdCgpO1xuICAgICAgICBjb25zdCBmcmFnbWVudCA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnJvd3M7IGkgKz0gMSkge1xuICAgICAgICAgICAgY29uc3Qgcm93ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgICAgICAgcm93LnNldEF0dHJpYnV0ZSgncm9sZScsICdyb3cnKTtcbiAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgdGhpcy5jb2x1bW5zOyBqICs9IDEpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb2x1bW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICAgICAgICAgICAgY29sdW1uLnNldEF0dHJpYnV0ZSgncm9sZScsICdncmlkY2VsbCcpO1xuICAgICAgICAgICAgICAgIHJvdy5hcHBlbmRDaGlsZChjb2x1bW4pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZnJhZ21lbnQuYXBwZW5kQ2hpbGQocm93KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc2hhZG93KSB7XG4gICAgICAgICAgICBzaGFkb3cuaW5uZXJIVE1MID0gJyc7XG4gICAgICAgICAgICBzaGFkb3cuYXBwZW5kQ2hpbGQoZnJhZ21lbnQpO1xuICAgICAgICB9XG4gICAgfVxufVxuQ3JvcHBlckdyaWQuJG5hbWUgPSBDUk9QUEVSX0dJUkQ7XG5Dcm9wcGVyR3JpZC4kdmVyc2lvbiA9ICcyLjAuMCc7XG5cbmV4cG9ydCB7IENyb3BwZXJHcmlkIGFzIGRlZmF1bHQgfTtcbiIsICJpbXBvcnQgQ3JvcHBlckVsZW1lbnQgZnJvbSAnQGNyb3BwZXIvZWxlbWVudCc7XG5pbXBvcnQgeyBDUk9QUEVSX0NST1NTSEFJUiB9IGZyb20gJ0Bjcm9wcGVyL3V0aWxzJztcblxudmFyIHN0eWxlID0gYDpob3N0e2Rpc3BsYXk6aW5saW5lLWJsb2NrO2hlaWdodDoxZW07cG9zaXRpb246cmVsYXRpdmU7dG91Y2gtYWN0aW9uOm5vbmU7LXdlYmtpdC11c2VyLXNlbGVjdDpub25lOy1tb3otdXNlci1zZWxlY3Q6bm9uZTt1c2VyLXNlbGVjdDpub25lO3ZlcnRpY2FsLWFsaWduOm1pZGRsZTt3aWR0aDoxZW19Omhvc3Q6YWZ0ZXIsOmhvc3Q6YmVmb3Jle2JhY2tncm91bmQtY29sb3I6dmFyKC0tdGhlbWUtY29sb3IpO2NvbnRlbnQ6XCJcIjtkaXNwbGF5OmJsb2NrO3Bvc2l0aW9uOmFic29sdXRlfTpob3N0OmJlZm9yZXtoZWlnaHQ6MXB4O2xlZnQ6MDt0b3A6NTAlO3RyYW5zZm9ybTp0cmFuc2xhdGVZKC01MCUpO3dpZHRoOjEwMCV9Omhvc3Q6YWZ0ZXJ7aGVpZ2h0OjEwMCU7bGVmdDo1MCU7dG9wOjA7dHJhbnNmb3JtOnRyYW5zbGF0ZVgoLTUwJSk7d2lkdGg6MXB4fTpob3N0KFtjZW50ZXJlZF0pe2xlZnQ6NTAlO3Bvc2l0aW9uOmFic29sdXRlO3RvcDo1MCU7dHJhbnNmb3JtOnRyYW5zbGF0ZSgtNTAlLC01MCUpfWA7XG5cbmNsYXNzIENyb3BwZXJDcm9zc2hhaXIgZXh0ZW5kcyBDcm9wcGVyRWxlbWVudCB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKC4uLmFyZ3VtZW50cyk7XG4gICAgICAgIHRoaXMuJHN0eWxlID0gc3R5bGU7XG4gICAgICAgIHRoaXMuY2VudGVyZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5zbG90dGFibGUgPSBmYWxzZTtcbiAgICAgICAgdGhpcy50aGVtZUNvbG9yID0gJ3JnYmEoMjM4LCAyMzgsIDIzOCwgMC41KSc7XG4gICAgfVxuICAgIHN0YXRpYyBnZXQgb2JzZXJ2ZWRBdHRyaWJ1dGVzKCkge1xuICAgICAgICByZXR1cm4gc3VwZXIub2JzZXJ2ZWRBdHRyaWJ1dGVzLmNvbmNhdChbXG4gICAgICAgICAgICAnY2VudGVyZWQnLFxuICAgICAgICBdKTtcbiAgICB9XG59XG5Dcm9wcGVyQ3Jvc3NoYWlyLiRuYW1lID0gQ1JPUFBFUl9DUk9TU0hBSVI7XG5Dcm9wcGVyQ3Jvc3NoYWlyLiR2ZXJzaW9uID0gJzIuMC4wJztcblxuZXhwb3J0IHsgQ3JvcHBlckNyb3NzaGFpciBhcyBkZWZhdWx0IH07XG4iLCAiaW1wb3J0IENyb3BwZXJFbGVtZW50IGZyb20gJ0Bjcm9wcGVyL2VsZW1lbnQnO1xuaW1wb3J0IHsgQ1JPUFBFUl9WSUVXRVIsIENST1BQRVJfU0VMRUNUSU9OLCBpc0VsZW1lbnQsIG9uLCBFVkVOVF9DSEFOR0UsIENST1BQRVJfQ0FOVkFTLCBDUk9QUEVSX0lNQUdFLCBFVkVOVF9MT0FELCBFVkVOVF9UUkFOU0ZPUk0sIG9mZiB9IGZyb20gJ0Bjcm9wcGVyL3V0aWxzJztcblxudmFyIHN0eWxlID0gYDpob3N0e2Rpc3BsYXk6YmxvY2s7aGVpZ2h0OjEwMCU7b3ZlcmZsb3c6aGlkZGVuO3Bvc2l0aW9uOnJlbGF0aXZlO3dpZHRoOjEwMCV9YDtcblxuY29uc3QgY2FudmFzQ2FjaGUgPSBuZXcgV2Vha01hcCgpO1xuY29uc3QgaW1hZ2VDYWNoZSA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBzZWxlY3Rpb25DYWNoZSA9IG5ldyBXZWFrTWFwKCk7XG5jb25zdCBzb3VyY2VJbWFnZUNhY2hlID0gbmV3IFdlYWtNYXAoKTtcbmNvbnN0IFJFU0laRV9CT1RIID0gJ2JvdGgnO1xuY29uc3QgUkVTSVpFX0hPUklaT05UQUwgPSAnaG9yaXpvbnRhbCc7XG5jb25zdCBSRVNJWkVfVkVSVElDQUwgPSAndmVydGljYWwnO1xuY29uc3QgUkVTSVpFX05PTkUgPSAnbm9uZSc7XG5jbGFzcyBDcm9wcGVyVmlld2VyIGV4dGVuZHMgQ3JvcHBlckVsZW1lbnQge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlciguLi5hcmd1bWVudHMpO1xuICAgICAgICB0aGlzLiRvblNlbGVjdGlvbkNoYW5nZSA9IG51bGw7XG4gICAgICAgIHRoaXMuJG9uU291cmNlSW1hZ2VMb2FkID0gbnVsbDtcbiAgICAgICAgdGhpcy4kb25Tb3VyY2VJbWFnZVRyYW5zZm9ybSA9IG51bGw7XG4gICAgICAgIHRoaXMuJHNjYWxlID0gMTtcbiAgICAgICAgdGhpcy4kc3R5bGUgPSBzdHlsZTtcbiAgICAgICAgdGhpcy5yZXNpemUgPSBSRVNJWkVfVkVSVElDQUw7XG4gICAgICAgIHRoaXMuc2VsZWN0aW9uID0gJyc7XG4gICAgICAgIHRoaXMuc2xvdHRhYmxlID0gZmFsc2U7XG4gICAgfVxuICAgIHNldCAkaW1hZ2UoZWxlbWVudCkge1xuICAgICAgICBpbWFnZUNhY2hlLnNldCh0aGlzLCBlbGVtZW50KTtcbiAgICB9XG4gICAgZ2V0ICRpbWFnZSgpIHtcbiAgICAgICAgcmV0dXJuIGltYWdlQ2FjaGUuZ2V0KHRoaXMpO1xuICAgIH1cbiAgICBzZXQgJHNvdXJjZUltYWdlKGVsZW1lbnQpIHtcbiAgICAgICAgc291cmNlSW1hZ2VDYWNoZS5zZXQodGhpcywgZWxlbWVudCk7XG4gICAgfVxuICAgIGdldCAkc291cmNlSW1hZ2UoKSB7XG4gICAgICAgIHJldHVybiBzb3VyY2VJbWFnZUNhY2hlLmdldCh0aGlzKTtcbiAgICB9XG4gICAgc2V0ICRjYW52YXMoZWxlbWVudCkge1xuICAgICAgICBjYW52YXNDYWNoZS5zZXQodGhpcywgZWxlbWVudCk7XG4gICAgfVxuICAgIGdldCAkY2FudmFzKCkge1xuICAgICAgICByZXR1cm4gY2FudmFzQ2FjaGUuZ2V0KHRoaXMpO1xuICAgIH1cbiAgICBzZXQgJHNlbGVjdGlvbihlbGVtZW50KSB7XG4gICAgICAgIHNlbGVjdGlvbkNhY2hlLnNldCh0aGlzLCBlbGVtZW50KTtcbiAgICB9XG4gICAgZ2V0ICRzZWxlY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBzZWxlY3Rpb25DYWNoZS5nZXQodGhpcyk7XG4gICAgfVxuICAgIHN0YXRpYyBnZXQgb2JzZXJ2ZWRBdHRyaWJ1dGVzKCkge1xuICAgICAgICByZXR1cm4gc3VwZXIub2JzZXJ2ZWRBdHRyaWJ1dGVzLmNvbmNhdChbXG4gICAgICAgICAgICAncmVzaXplJyxcbiAgICAgICAgICAgICdzZWxlY3Rpb24nLFxuICAgICAgICBdKTtcbiAgICB9XG4gICAgY29ubmVjdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHN1cGVyLmNvbm5lY3RlZENhbGxiYWNrKCk7XG4gICAgICAgIGxldCAkc2VsZWN0aW9uID0gbnVsbDtcbiAgICAgICAgaWYgKHRoaXMuc2VsZWN0aW9uKSB7XG4gICAgICAgICAgICAkc2VsZWN0aW9uID0gdGhpcy5vd25lckRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IodGhpcy5zZWxlY3Rpb24pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgJHNlbGVjdGlvbiA9IHRoaXMuY2xvc2VzdCh0aGlzLiRnZXRUYWdOYW1lT2YoQ1JPUFBFUl9TRUxFQ1RJT04pKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNFbGVtZW50KCRzZWxlY3Rpb24pKSB7XG4gICAgICAgICAgICB0aGlzLiRzZWxlY3Rpb24gPSAkc2VsZWN0aW9uO1xuICAgICAgICAgICAgdGhpcy4kb25TZWxlY3Rpb25DaGFuZ2UgPSB0aGlzLiRoYW5kbGVTZWxlY3Rpb25DaGFuZ2UuYmluZCh0aGlzKTtcbiAgICAgICAgICAgIG9uKCRzZWxlY3Rpb24sIEVWRU5UX0NIQU5HRSwgdGhpcy4kb25TZWxlY3Rpb25DaGFuZ2UpO1xuICAgICAgICAgICAgY29uc3QgJGNhbnZhcyA9ICRzZWxlY3Rpb24uY2xvc2VzdCh0aGlzLiRnZXRUYWdOYW1lT2YoQ1JPUFBFUl9DQU5WQVMpKTtcbiAgICAgICAgICAgIGlmICgkY2FudmFzKSB7XG4gICAgICAgICAgICAgICAgdGhpcy4kY2FudmFzID0gJGNhbnZhcztcbiAgICAgICAgICAgICAgICBjb25zdCAkc291cmNlSW1hZ2UgPSAkY2FudmFzLnF1ZXJ5U2VsZWN0b3IodGhpcy4kZ2V0VGFnTmFtZU9mKENST1BQRVJfSU1BR0UpKTtcbiAgICAgICAgICAgICAgICBpZiAoJHNvdXJjZUltYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuJHNvdXJjZUltYWdlID0gJHNvdXJjZUltYWdlO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLiRpbWFnZSA9ICRzb3VyY2VJbWFnZS5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuJGdldFNoYWRvd1Jvb3QoKS5hcHBlbmRDaGlsZCh0aGlzLiRpbWFnZSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuJG9uU291cmNlSW1hZ2VMb2FkID0gdGhpcy4kaGFuZGxlU291cmNlSW1hZ2VMb2FkLmJpbmQodGhpcyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuJG9uU291cmNlSW1hZ2VUcmFuc2Zvcm0gPSB0aGlzLiRoYW5kbGVTb3VyY2VJbWFnZVRyYW5zZm9ybS5iaW5kKHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICBvbigkc291cmNlSW1hZ2UuJGltYWdlLCBFVkVOVF9MT0FELCB0aGlzLiRvblNvdXJjZUltYWdlTG9hZCk7XG4gICAgICAgICAgICAgICAgICAgIG9uKCRzb3VyY2VJbWFnZSwgRVZFTlRfVFJBTlNGT1JNLCB0aGlzLiRvblNvdXJjZUltYWdlVHJhbnNmb3JtKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLiRyZW5kZXIoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBkaXNjb25uZWN0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgY29uc3QgeyAkc2VsZWN0aW9uLCAkc291cmNlSW1hZ2UgfSA9IHRoaXM7XG4gICAgICAgIGlmICgkc2VsZWN0aW9uICYmIHRoaXMuJG9uU2VsZWN0aW9uQ2hhbmdlKSB7XG4gICAgICAgICAgICBvZmYoJHNlbGVjdGlvbiwgRVZFTlRfQ0hBTkdFLCB0aGlzLiRvblNlbGVjdGlvbkNoYW5nZSk7XG4gICAgICAgICAgICB0aGlzLiRvblNlbGVjdGlvbkNoYW5nZSA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCRzb3VyY2VJbWFnZSAmJiB0aGlzLiRvblNvdXJjZUltYWdlTG9hZCkge1xuICAgICAgICAgICAgb2ZmKCRzb3VyY2VJbWFnZS4kaW1hZ2UsIEVWRU5UX0xPQUQsIHRoaXMuJG9uU291cmNlSW1hZ2VMb2FkKTtcbiAgICAgICAgICAgIHRoaXMuJG9uU291cmNlSW1hZ2VMb2FkID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoJHNvdXJjZUltYWdlICYmIHRoaXMuJG9uU291cmNlSW1hZ2VUcmFuc2Zvcm0pIHtcbiAgICAgICAgICAgIG9mZigkc291cmNlSW1hZ2UsIEVWRU5UX1RSQU5TRk9STSwgdGhpcy4kb25Tb3VyY2VJbWFnZVRyYW5zZm9ybSk7XG4gICAgICAgICAgICB0aGlzLiRvblNvdXJjZUltYWdlVHJhbnNmb3JtID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBzdXBlci5kaXNjb25uZWN0ZWRDYWxsYmFjaygpO1xuICAgIH1cbiAgICAkaGFuZGxlU2VsZWN0aW9uQ2hhbmdlKGV2ZW50KSB7XG4gICAgICAgIHRoaXMuJHJlbmRlcihldmVudC5kZXRhaWwpO1xuICAgIH1cbiAgICAkaGFuZGxlU291cmNlSW1hZ2VMb2FkKCkge1xuICAgICAgICBjb25zdCB7ICRpbWFnZSwgJHNvdXJjZUltYWdlIH0gPSB0aGlzO1xuICAgICAgICBjb25zdCBvbGRTcmMgPSAkaW1hZ2UuZ2V0QXR0cmlidXRlKCdzcmMnKTtcbiAgICAgICAgY29uc3QgbmV3U3JjID0gJHNvdXJjZUltYWdlLmdldEF0dHJpYnV0ZSgnc3JjJyk7XG4gICAgICAgIGlmIChuZXdTcmMgJiYgbmV3U3JjICE9PSBvbGRTcmMpIHtcbiAgICAgICAgICAgICRpbWFnZS5zZXRBdHRyaWJ1dGUoJ3NyYycsIG5ld1NyYyk7XG4gICAgICAgICAgICAkaW1hZ2UuJHJlYWR5KCgpID0+IHtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy4kcmVuZGVyKCk7XG4gICAgICAgICAgICAgICAgfSwgNTApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgJGhhbmRsZVNvdXJjZUltYWdlVHJhbnNmb3JtKGV2ZW50KSB7XG4gICAgICAgIHRoaXMuJHJlbmRlcih1bmRlZmluZWQsIGV2ZW50LmRldGFpbC5tYXRyaXgpO1xuICAgIH1cbiAgICAkcmVuZGVyKHNlbGVjdGlvbiwgbWF0cml4KSB7XG4gICAgICAgIGNvbnN0IHsgJGNhbnZhcywgJHNlbGVjdGlvbiB9ID0gdGhpcztcbiAgICAgICAgaWYgKCFzZWxlY3Rpb24gJiYgISRzZWxlY3Rpb24uaGlkZGVuKSB7XG4gICAgICAgICAgICBzZWxlY3Rpb24gPSAkc2VsZWN0aW9uO1xuICAgICAgICB9XG4gICAgICAgIGlmICghc2VsZWN0aW9uIHx8IChzZWxlY3Rpb24ueCA9PT0gMFxuICAgICAgICAgICAgJiYgc2VsZWN0aW9uLnkgPT09IDBcbiAgICAgICAgICAgICYmIHNlbGVjdGlvbi53aWR0aCA9PT0gMFxuICAgICAgICAgICAgJiYgc2VsZWN0aW9uLmhlaWdodCA9PT0gMCkpIHtcbiAgICAgICAgICAgIHNlbGVjdGlvbiA9IHtcbiAgICAgICAgICAgICAgICB4OiAwLFxuICAgICAgICAgICAgICAgIHk6IDAsXG4gICAgICAgICAgICAgICAgd2lkdGg6ICRjYW52YXMub2Zmc2V0V2lkdGgsXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiAkY2FudmFzLm9mZnNldEhlaWdodCxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgeyB4LCB5LCB3aWR0aCwgaGVpZ2h0LCB9ID0gc2VsZWN0aW9uO1xuICAgICAgICBjb25zdCBzdHlsZXMgPSB7fTtcbiAgICAgICAgY29uc3QgeyBjbGllbnRXaWR0aCwgY2xpZW50SGVpZ2h0IH0gPSB0aGlzO1xuICAgICAgICBsZXQgbmV3V2lkdGggPSBjbGllbnRXaWR0aDtcbiAgICAgICAgbGV0IG5ld0hlaWdodCA9IGNsaWVudEhlaWdodDtcbiAgICAgICAgbGV0IHNjYWxlID0gTmFOO1xuICAgICAgICBzd2l0Y2ggKHRoaXMucmVzaXplKSB7XG4gICAgICAgICAgICBjYXNlIFJFU0laRV9CT1RIOlxuICAgICAgICAgICAgICAgIHNjYWxlID0gMTtcbiAgICAgICAgICAgICAgICBuZXdXaWR0aCA9IHdpZHRoO1xuICAgICAgICAgICAgICAgIG5ld0hlaWdodCA9IGhlaWdodDtcbiAgICAgICAgICAgICAgICBzdHlsZXMud2lkdGggPSB3aWR0aDtcbiAgICAgICAgICAgICAgICBzdHlsZXMuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBSRVNJWkVfSE9SSVpPTlRBTDpcbiAgICAgICAgICAgICAgICBzY2FsZSA9IGhlaWdodCA+IDAgPyBjbGllbnRIZWlnaHQgLyBoZWlnaHQgOiAwO1xuICAgICAgICAgICAgICAgIG5ld1dpZHRoID0gd2lkdGggKiBzY2FsZTtcbiAgICAgICAgICAgICAgICBzdHlsZXMud2lkdGggPSBuZXdXaWR0aDtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgUkVTSVpFX1ZFUlRJQ0FMOlxuICAgICAgICAgICAgICAgIHNjYWxlID0gd2lkdGggPiAwID8gY2xpZW50V2lkdGggLyB3aWR0aCA6IDA7XG4gICAgICAgICAgICAgICAgbmV3SGVpZ2h0ID0gaGVpZ2h0ICogc2NhbGU7XG4gICAgICAgICAgICAgICAgc3R5bGVzLmhlaWdodCA9IG5ld0hlaWdodDtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgUkVTSVpFX05PTkU6XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIGlmIChjbGllbnRXaWR0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgc2NhbGUgPSB3aWR0aCA+IDAgPyBjbGllbnRXaWR0aCAvIHdpZHRoIDogMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoY2xpZW50SGVpZ2h0ID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBzY2FsZSA9IGhlaWdodCA+IDAgPyBjbGllbnRIZWlnaHQgLyBoZWlnaHQgOiAwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLiRzY2FsZSA9IHNjYWxlO1xuICAgICAgICB0aGlzLiRzZXRTdHlsZXMoc3R5bGVzKTtcbiAgICAgICAgaWYgKHRoaXMuJHNvdXJjZUltYWdlKSB7XG4gICAgICAgICAgICB0aGlzLiR0cmFuc2Zvcm1JbWFnZUJ5T2Zmc2V0KG1hdHJpeCAhPT0gbnVsbCAmJiBtYXRyaXggIT09IHZvaWQgMCA/IG1hdHJpeCA6IHRoaXMuJHNvdXJjZUltYWdlLiRnZXRUcmFuc2Zvcm0oKSwgLXgsIC15KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAkdHJhbnNmb3JtSW1hZ2VCeU9mZnNldChtYXRyaXgsIHgsIHkpIHtcbiAgICAgICAgY29uc3QgeyAkaW1hZ2UsICRzY2FsZSwgJHNvdXJjZUltYWdlLCB9ID0gdGhpcztcbiAgICAgICAgaWYgKCRzb3VyY2VJbWFnZSAmJiAkaW1hZ2UgJiYgJHNjYWxlID49IDApIHtcbiAgICAgICAgICAgIGNvbnN0IFthLCBiLCBjLCBkLCBlLCBmXSA9IG1hdHJpeDtcbiAgICAgICAgICAgIGNvbnN0IHRyYW5zbGF0ZVggPSAoKHggKiBkKSAtIChjICogeSkpIC8gKChhICogZCkgLSAoYyAqIGIpKTtcbiAgICAgICAgICAgIGNvbnN0IHRyYW5zbGF0ZVkgPSAoKHkgKiBhKSAtIChiICogeCkpIC8gKChhICogZCkgLSAoYyAqIGIpKTtcbiAgICAgICAgICAgIGNvbnN0IG5ld0UgPSBhICogdHJhbnNsYXRlWCArIGMgKiB0cmFuc2xhdGVZICsgZTtcbiAgICAgICAgICAgIGNvbnN0IG5ld0YgPSBiICogdHJhbnNsYXRlWCArIGQgKiB0cmFuc2xhdGVZICsgZjtcbiAgICAgICAgICAgICRpbWFnZS4kcmVhZHkoKGltYWdlKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy4kc2V0U3R5bGVzLmNhbGwoJGltYWdlLCB7XG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiBpbWFnZS5uYXR1cmFsV2lkdGggKiAkc2NhbGUsXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogaW1hZ2UubmF0dXJhbEhlaWdodCAqICRzY2FsZSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgJGltYWdlLiRzZXRUcmFuc2Zvcm0oYSwgYiwgYywgZCwgbmV3RSAqICRzY2FsZSwgbmV3RiAqICRzY2FsZSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5Dcm9wcGVyVmlld2VyLiRuYW1lID0gQ1JPUFBFUl9WSUVXRVI7XG5Dcm9wcGVyVmlld2VyLiR2ZXJzaW9uID0gJzIuMC4wJztcblxuZXhwb3J0IHsgUkVTSVpFX0JPVEgsIFJFU0laRV9IT1JJWk9OVEFMLCBSRVNJWkVfTk9ORSwgUkVTSVpFX1ZFUlRJQ0FMLCBDcm9wcGVyVmlld2VyIGFzIGRlZmF1bHQgfTtcbiIsICIvKiEgQ3JvcHBlci5qcyB2Mi4wLjAgfCAoYykgMjAxNS1wcmVzZW50IENoZW4gRmVuZ3l1YW4gfCBNSVQgKi9cbmltcG9ydCB7IGlzU3RyaW5nLCBpc0VsZW1lbnQsIENST1BQRVJfSU1BR0UsIENST1BQRVJfQ0FOVkFTLCBDUk9QUEVSX1NFTEVDVElPTiB9IGZyb20gJ0Bjcm9wcGVyL3V0aWxzJztcbmV4cG9ydCAqIGZyb20gJ0Bjcm9wcGVyL3V0aWxzJztcbmltcG9ydCB7IENyb3BwZXJDYW52YXMsIENyb3BwZXJDcm9zc2hhaXIsIENyb3BwZXJHcmlkLCBDcm9wcGVySGFuZGxlLCBDcm9wcGVySW1hZ2UsIENyb3BwZXJTZWxlY3Rpb24sIENyb3BwZXJTaGFkZSwgQ3JvcHBlclZpZXdlciB9IGZyb20gJ0Bjcm9wcGVyL2VsZW1lbnRzJztcbmV4cG9ydCAqIGZyb20gJ0Bjcm9wcGVyL2VsZW1lbnRzJztcblxudmFyIERFRkFVTFRfVEVNUExBVEUgPSAoJzxjcm9wcGVyLWNhbnZhcyBiYWNrZ3JvdW5kPidcbiAgICArICc8Y3JvcHBlci1pbWFnZSByb3RhdGFibGUgc2NhbGFibGUgc2tld2FibGUgdHJhbnNsYXRhYmxlPjwvY3JvcHBlci1pbWFnZT4nXG4gICAgKyAnPGNyb3BwZXItc2hhZGUgaGlkZGVuPjwvY3JvcHBlci1zaGFkZT4nXG4gICAgKyAnPGNyb3BwZXItaGFuZGxlIGFjdGlvbj1cInNlbGVjdFwiIHBsYWluPjwvY3JvcHBlci1oYW5kbGU+J1xuICAgICsgJzxjcm9wcGVyLXNlbGVjdGlvbiBpbml0aWFsLWNvdmVyYWdlPVwiMC41XCIgbW92YWJsZSByZXNpemFibGU+J1xuICAgICsgJzxjcm9wcGVyLWdyaWQgcm9sZT1cImdyaWRcIiBib3JkZXJlZCBjb3ZlcmVkPjwvY3JvcHBlci1ncmlkPidcbiAgICArICc8Y3JvcHBlci1jcm9zc2hhaXIgY2VudGVyZWQ+PC9jcm9wcGVyLWNyb3NzaGFpcj4nXG4gICAgKyAnPGNyb3BwZXItaGFuZGxlIGFjdGlvbj1cIm1vdmVcIiB0aGVtZS1jb2xvcj1cInJnYmEoMjU1LCAyNTUsIDI1NSwgMC4zNSlcIj48L2Nyb3BwZXItaGFuZGxlPidcbiAgICArICc8Y3JvcHBlci1oYW5kbGUgYWN0aW9uPVwibi1yZXNpemVcIj48L2Nyb3BwZXItaGFuZGxlPidcbiAgICArICc8Y3JvcHBlci1oYW5kbGUgYWN0aW9uPVwiZS1yZXNpemVcIj48L2Nyb3BwZXItaGFuZGxlPidcbiAgICArICc8Y3JvcHBlci1oYW5kbGUgYWN0aW9uPVwicy1yZXNpemVcIj48L2Nyb3BwZXItaGFuZGxlPidcbiAgICArICc8Y3JvcHBlci1oYW5kbGUgYWN0aW9uPVwidy1yZXNpemVcIj48L2Nyb3BwZXItaGFuZGxlPidcbiAgICArICc8Y3JvcHBlci1oYW5kbGUgYWN0aW9uPVwibmUtcmVzaXplXCI+PC9jcm9wcGVyLWhhbmRsZT4nXG4gICAgKyAnPGNyb3BwZXItaGFuZGxlIGFjdGlvbj1cIm53LXJlc2l6ZVwiPjwvY3JvcHBlci1oYW5kbGU+J1xuICAgICsgJzxjcm9wcGVyLWhhbmRsZSBhY3Rpb249XCJzZS1yZXNpemVcIj48L2Nyb3BwZXItaGFuZGxlPidcbiAgICArICc8Y3JvcHBlci1oYW5kbGUgYWN0aW9uPVwic3ctcmVzaXplXCI+PC9jcm9wcGVyLWhhbmRsZT4nXG4gICAgKyAnPC9jcm9wcGVyLXNlbGVjdGlvbj4nXG4gICAgKyAnPC9jcm9wcGVyLWNhbnZhcz4nKTtcblxuY29uc3QgUkVHRVhQX0FMTE9XRURfRUxFTUVOVFMgPSAvXmltZ3xjYW52YXMkLztcbmNvbnN0IFJFR0VYUF9CTE9DS0VEX1RBR1MgPSAvPChcXC8/KD86c2NyaXB0fHN0eWxlKVtePl0qKT4vZ2k7XG5jb25zdCBERUZBVUxUX09QVElPTlMgPSB7XG4gICAgdGVtcGxhdGU6IERFRkFVTFRfVEVNUExBVEUsXG59O1xuQ3JvcHBlckNhbnZhcy4kZGVmaW5lKCk7XG5Dcm9wcGVyQ3Jvc3NoYWlyLiRkZWZpbmUoKTtcbkNyb3BwZXJHcmlkLiRkZWZpbmUoKTtcbkNyb3BwZXJIYW5kbGUuJGRlZmluZSgpO1xuQ3JvcHBlckltYWdlLiRkZWZpbmUoKTtcbkNyb3BwZXJTZWxlY3Rpb24uJGRlZmluZSgpO1xuQ3JvcHBlclNoYWRlLiRkZWZpbmUoKTtcbkNyb3BwZXJWaWV3ZXIuJGRlZmluZSgpO1xuY2xhc3MgQ3JvcHBlciB7XG4gICAgY29uc3RydWN0b3IoZWxlbWVudCwgb3B0aW9ucykge1xuICAgICAgICB0aGlzLm9wdGlvbnMgPSBERUZBVUxUX09QVElPTlM7XG4gICAgICAgIGlmIChpc1N0cmluZyhlbGVtZW50KSkge1xuICAgICAgICAgICAgZWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoZWxlbWVudCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFpc0VsZW1lbnQoZWxlbWVudCkgfHwgIVJFR0VYUF9BTExPV0VEX0VMRU1FTlRTLnRlc3QoZWxlbWVudC5sb2NhbE5hbWUpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBmaXJzdCBhcmd1bWVudCBpcyByZXF1aXJlZCBhbmQgbXVzdCBiZSBhbiA8aW1nPiBvciA8Y2FudmFzPiBlbGVtZW50LicpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgICAgIG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKE9iamVjdC5hc3NpZ24oe30sIERFRkFVTFRfT1BUSU9OUyksIG9wdGlvbnMpO1xuICAgICAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgICAgICBjb25zdCB7IG93bmVyRG9jdW1lbnQgfSA9IGVsZW1lbnQ7XG4gICAgICAgIGxldCB7IGNvbnRhaW5lciB9ID0gb3B0aW9ucztcbiAgICAgICAgaWYgKGNvbnRhaW5lcikge1xuICAgICAgICAgICAgaWYgKGlzU3RyaW5nKGNvbnRhaW5lcikpIHtcbiAgICAgICAgICAgICAgICBjb250YWluZXIgPSBvd25lckRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoY29udGFpbmVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghaXNFbGVtZW50KGNvbnRhaW5lcikpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBgY29udGFpbmVyYCBvcHRpb24gbXVzdCBiZSBhbiBlbGVtZW50IG9yIGEgdmFsaWQgc2VsZWN0b3IuJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFpc0VsZW1lbnQoY29udGFpbmVyKSkge1xuICAgICAgICAgICAgaWYgKGVsZW1lbnQucGFyZW50RWxlbWVudCkge1xuICAgICAgICAgICAgICAgIGNvbnRhaW5lciA9IGVsZW1lbnQucGFyZW50RWxlbWVudDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnRhaW5lciA9IG93bmVyRG9jdW1lbnQuYm9keTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNvbnRhaW5lciA9IGNvbnRhaW5lcjtcbiAgICAgICAgY29uc3QgdGFnTmFtZSA9IGVsZW1lbnQubG9jYWxOYW1lO1xuICAgICAgICBsZXQgc3JjID0gJyc7XG4gICAgICAgIGlmICh0YWdOYW1lID09PSAnaW1nJykge1xuICAgICAgICAgICAgKHsgc3JjIH0gPSBlbGVtZW50KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0YWdOYW1lID09PSAnY2FudmFzJyAmJiB3aW5kb3cuSFRNTENhbnZhc0VsZW1lbnQpIHtcbiAgICAgICAgICAgIHNyYyA9IGVsZW1lbnQudG9EYXRhVVJMKCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgeyB0ZW1wbGF0ZSB9ID0gb3B0aW9ucztcbiAgICAgICAgaWYgKHRlbXBsYXRlICYmIGlzU3RyaW5nKHRlbXBsYXRlKSkge1xuICAgICAgICAgICAgY29uc3QgdGVtcGxhdGVFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGVtcGxhdGUnKTtcbiAgICAgICAgICAgIGNvbnN0IGRvY3VtZW50RnJhZ21lbnQgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG4gICAgICAgICAgICB0ZW1wbGF0ZUVsZW1lbnQuaW5uZXJIVE1MID0gdGVtcGxhdGUucmVwbGFjZShSRUdFWFBfQkxPQ0tFRF9UQUdTLCAnJmx0OyQxJmd0OycpO1xuICAgICAgICAgICAgZG9jdW1lbnRGcmFnbWVudC5hcHBlbmRDaGlsZCh0ZW1wbGF0ZUVsZW1lbnQuY29udGVudCk7XG4gICAgICAgICAgICBBcnJheS5mcm9tKGRvY3VtZW50RnJhZ21lbnQucXVlcnlTZWxlY3RvckFsbChDUk9QUEVSX0lNQUdFKSkuZm9yRWFjaCgoaW1hZ2UpID0+IHtcbiAgICAgICAgICAgICAgICBpbWFnZS5zZXRBdHRyaWJ1dGUoJ3NyYycsIHNyYyk7XG4gICAgICAgICAgICAgICAgaW1hZ2Uuc2V0QXR0cmlidXRlKCdhbHQnLCBlbGVtZW50LmFsdCB8fCAnVGhlIGltYWdlIHRvIGNyb3AnKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKGVsZW1lbnQucGFyZW50RWxlbWVudCkge1xuICAgICAgICAgICAgICAgIGVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgICAgICBjb250YWluZXIuaW5zZXJ0QmVmb3JlKGRvY3VtZW50RnJhZ21lbnQsIGVsZW1lbnQubmV4dFNpYmxpbmcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKGRvY3VtZW50RnJhZ21lbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGdldENyb3BwZXJDYW52YXMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKENST1BQRVJfQ0FOVkFTKTtcbiAgICB9XG4gICAgZ2V0Q3JvcHBlckltYWdlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcihDUk9QUEVSX0lNQUdFKTtcbiAgICB9XG4gICAgZ2V0Q3JvcHBlclNlbGVjdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoQ1JPUFBFUl9TRUxFQ1RJT04pO1xuICAgIH1cbiAgICBnZXRDcm9wcGVyU2VsZWN0aW9ucygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3JBbGwoQ1JPUFBFUl9TRUxFQ1RJT04pO1xuICAgIH1cbn1cbkNyb3BwZXIudmVyc2lvbiA9ICcyLjAuMCc7XG5cbmV4cG9ydCB7IERFRkFVTFRfVEVNUExBVEUsIENyb3BwZXIgYXMgZGVmYXVsdCB9O1xuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVBLDhCQUEwQjs7O0FDRjFCLElBQU0sYUFBYSxPQUFPLFdBQVcsZUFBZSxPQUFPLE9BQU8sYUFBYTtBQUMvRSxJQUFNLFNBQVMsYUFBYSxTQUFTLENBQUM7QUFDdEMsSUFBTSxrQkFBa0IsYUFBYSxrQkFBa0IsT0FBTyxTQUFTLGtCQUFrQjtBQUN6RixJQUFNLG9CQUFvQixhQUFhLGtCQUFrQixTQUFTO0FBQ2xFLElBQU0sWUFBWTtBQUNsQixJQUFNLGlCQUFpQixHQUFHLFNBQVM7QUFDbkMsSUFBTSxvQkFBb0IsR0FBRyxTQUFTO0FBQ3RDLElBQU0sZUFBZSxHQUFHLFNBQVM7QUFDakMsSUFBTSxpQkFBaUIsR0FBRyxTQUFTO0FBQ25DLElBQU0sZ0JBQWdCLEdBQUcsU0FBUztB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UUFBa0I7QUFFMUUsb0JBQUksa0JBQWtCO0FBQ3BCLGtCQUFDLGlCQUFzQyxRQUFRO0FBQUEsZ0JBQ2pEO0FBQUEsY0FDRjtBQUVBLHNCQUFRLGFBQWEsT0FBTyxRQUFRO0FBQUEsWUFDdEMsQ0FBQztBQUFBLFVBQ0w7QUFBQSxRQUNGO0FBQUEsTUFDRixDQUFDO0FBQUEsSUFDSDtBQUFBLEVBRUY7QUFBQSxFQUtBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxTQUFjLGNBQXVCLE1BQU07QUFDekMsYUFBTyxPQUFPLE1BQU0sc0JBQXNCLHVCQUF1QixxQkFBb0IsYUFBYTtBQUFBLElBQ3BHLEdBQUc7QUFBQTtBQUFBO0FBRUw7QUE3SWdCO0FBQUEsRUFEYixJQUFJO0FBQUEsRUFFRix5QkFBTSxJQUFJLE1BQU0sT0FBTyxhQUFhLFdBQVc7QUFBQSxFQUMvQyx5QkFBTSxJQUFJLE1BQU0sT0FBTyxhQUFhLFFBQVE7QUFBQSxFQUM1Qyx5QkFBTSxJQUFJLE1BQU0sT0FBTyxhQUFhLE1BQU07QUFBQSxFQUMxQyx5QkFBTSxJQUFJLE1BQU0sT0FBTyxhQUFhLFNBQVM7QUFBQSxHQXhCckMsc0JBb0JHO0FBcEJULElBQU0sc0JBQU47QUFtS1AsSUFBTSxTQUFTLENBQUMsbUJBQTJCO0FBQ3pDLE1BQUk7QUFDRixVQUFNLFFBQVEsZUFBZSxNQUFNLFVBQVU7QUFFN0MsUUFBSSxNQUFNLFdBQVcsR0FBRztBQUN0QixZQUFNLElBQUksTUFBTSx3REFBd0Q7QUFBQSxJQUMxRTtBQUVBLFVBQU0sWUFBWSxPQUFPLFdBQVcsTUFBTSxDQUFDLENBQUM7QUFDNUMsVUFBTSxjQUFjLE9BQU8sV0FBVyxNQUFNLENBQUMsQ0FBQztBQUU5QyxRQUNFLE9BQU8sTUFBTSxTQUFTLEtBQ3RCLE9BQU8sTUFBTSxXQUFXLEtBQ3hCLENBQUMsT0FBTyxTQUFTLFNBQVMsS0FDMUIsQ0FBQyxPQUFPLFNBQVMsV0FBVyxHQUM1QjtBQUNBLFlBQU0sSUFBSSxNQUFNLHFEQUFxRDtBQUFBLElBQ3ZFO0FBRUEsUUFBSSxnQkFBZ0IsR0FBRztBQUNyQixZQUFNLElBQUksTUFBTSx3QkFBd0I7QUFBQSxJQUMxQztBQUVBLFdBQU8sWUFBWTtBQUFBLEVBQ3JCLFNBQVMsR0FBRztBQUNWLFVBQU0sSUFBSSxXQUFXLFVBQVcsRUFBWSxPQUFPLEVBQUU7QUFBQSxFQUN2RDtBQUNGOyIsCiAgIm5hbWVzIjogWyJzdHlsZSIsICJzdHlsZSIsICJzdHlsZSIsICJjYW52YXNDYWNoZSIsICJzdHlsZSIsICJzdHlsZSIsICJjYW52YXNDYWNoZSIsICJzdHlsZSIsICJzdHlsZSIsICJzdHlsZSIsICJjYW52YXNDYWNoZSIsICJjYW52YXMiXQp9Cg==
