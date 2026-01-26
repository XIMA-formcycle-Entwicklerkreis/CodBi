import { a as $t } from "./chunk-K6ISRTTP.js";
import { a as X } from "./chunk-JL2EL352.js";
import { a as $e } from "./chunk-W23DHSE2.js";
import { a as Lt } from "./chunk-MUWAMKOD.js";
import { f as me, g as Xt, h as lt } from "./chunk-RS4WWU7K.js";
var _i = me($e(), 1);
var dt = typeof window != "undefined" && typeof window.document != "undefined",
  _ = dt ? window : {},
  Tt = dt ? "ontouchstart" in _.document.documentElement : !1,
  vt = dt ? "PointerEvent" in _ : !1,
  U = "cropper",
  k = `${U}-canvas`,
  Vt = `${U}-crosshair`,
  jt = `${U}-grid`,
  Bt = `${U}-handle`,
  M = `${U}-image`,
  O = `${U}-selection`,
  Ft = `${U}-shade`,
  Zt = `${U}-viewer`,
  tt = "select",
  gt = "move",
  L = "scale",
  ut = "rotate",
  et = "transform",
  z = "none",
  At = "n-resize",
  St = "e-resize",
  wt = "s-resize",
  Nt = "w-resize",
  it = "ne-resize",
  st = "nw-resize",
  nt = "se-resize",
  rt = "sw-resize",
  qt = "action",
  ge = Tt ? "touchend touchcancel" : "mouseup",
  Ee = Tt ? "touchmove" : "mousemove",
  be = Tt ? "touchstart" : "mousedown",
  yt = vt ? "pointerdown" : be,
  Ot = vt ? "pointermove" : Ee,
  Rt = vt ? "pointerup pointercancel" : ge,
  It = "error",
  _t = "keydown",
  V = "load";
var kt = "wheel",
  Y = "action",
  D = "actionend",
  Gt = "actionmove",
  H = "actionstart",
  W = "change",
  pt = "transform";
function ot(l) {
  return typeof l == "string";
}
var xt = Number.isNaN || _.isNaN;
function p(l) {
  return typeof l == "number" && !xt(l);
}
function y(l) {
  return p(l) && l > 0 && l < 1 / 0;
}
function Kt(l) {
  return typeof l == "undefined";
}
function Pt(l) {
  return typeof l == "object" && l !== null;
}
var { hasOwnProperty: Ce } = Object.prototype;
function at(l) {
  if (!Pt(l)) return !1;
  try {
    let { constructor: t } = l,
      { prototype: e } = t;
    return t && e && Ce.call(e, "isPrototypeOf");
  } catch (t) {
    return !1;
  }
}
function ct(l) {
  return typeof l == "function";
}
function j(l) {
  return typeof l == "object" && l !== null && l.nodeType === 1;
}
var Te = /([a-z\d])([A-Z])/g;
function Mt(l) {
  return String(l).replace(Te, "$1-$2").toLowerCase();
}
var ve = /-[A-z\d]/g;
function zt(l) {
  return l.replace(ve, (t) => t.slice(1).toUpperCase());
}
var Jt = /\s\s*/;
function b(l, t, e, i) {
  t.trim()
    .split(Jt)
    .forEach((s) => {
      l.removeEventListener(s, e, i);
    });
}
function C(l, t, e, i) {
  t.trim()
    .split(Jt)
    .forEach((s) => {
      l.addEventListener(s, e, i);
    });
}
function Dt(l, t, e, i) {
  C(l, t, e, Object.assign(Object.assign({}, i), { once: !0 }));
}
var Ae = { bubbles: !0, cancelable: !0, composed: !0 };
function Qt(l, t, e, i) {
  return l.dispatchEvent(new CustomEvent(t, Object.assign(Object.assign(Object.assign({}, Ae), { detail: e }), i)));
}
var Yt = Promise.resolve();
function te(l, t) {
  return t ? Yt.then(l ? t.bind(l) : t) : Yt;
}
function Ht(l) {
  let { documentElement: t } = l.ownerDocument,
    e = l.getBoundingClientRect();
  return { left: e.left + (_.pageXOffset - t.clientLeft), top: e.top + (_.pageYOffset - t.clientTop) };
}
var Se = /deg|g?rad|turn$/i;
function Et(l) {
  let t = parseFloat(l) || 0;
  if (t !== 0) {
    let [e = "rad"] = String(l).match(Se) || [];
    switch (e.toLowerCase()) {
      case "deg":
        return (t / 360) * (Math.PI * 2);
      case "grad":
        return (t / 400) * (Math.PI * 2);
      case "turn":
        return t * (Math.PI * 2);
    }
  }
  return t;
}
var Ut = "contain",
  we = "cover";
function ht(l, t = Ut) {
  let { aspectRatio: e } = l,
    { width: i, height: s } = l,
    n = y(i),
    a = y(s);
  if (n && a) {
    let o = s * e;
    (t === Ut && o > i) || (t === we && o < i) ? (s = i / e) : (i = s * e);
  } else n ? (s = i / e) : a && (i = s * e);
  return { width: i, height: s };
}
function Wt(l, ...t) {
  if (t.length === 0) return l;
  let [e, i, s, n, a, o] = l,
    [h, r, c, d, f, m] = t[0];
  return (
    (l = [e * h + s * r, i * h + n * r, e * c + s * d, i * c + n * d, e * f + s * m + a, i * f + n * m + o]),
    Wt(l, ...t.slice(1))
  );
}
var Ne = ":host([hidden]){display:none!important}",
  ye = /left|top|width|height/i,
  ee = "open",
  bt = new WeakMap(),
  Ct = new WeakMap(),
  ie = new Map(),
  se = _.document && Array.isArray(_.document.adoptedStyleSheets) && "replaceSync" in _.CSSStyleSheet.prototype,
  v = class extends HTMLElement {
    get $sharedStyle() {
      return `${this.themeColor ? `:host{--theme-color: ${this.themeColor};}` : ""}${Ne}`;
    }
    constructor() {
      var t, e;
      super(), (this.shadowRootMode = ee), (this.slottable = !0);
      let i =
        (e = (t = Object.getPrototypeOf(this)) === null || t === void 0 ? void 0 : t.constructor) === null ||
        e === void 0
          ? void 0
          : e.$name;
      i && ie.set(i, this.tagName.toLowerCase());
    }
    static get observedAttributes() {
      return ["shadow-root-mode", "slottable", "theme-color"];
    }
    attributeChangedCallback(t, e, i) {
      if (Object.is(i, e)) return;
      let s = zt(t),
        n = this[s],
        a = i;
      switch (typeof n) {
        case "boolean":
          a = i !== null && i !== "false";
          break;
        case "number":
          a = Number(i);
          break;
      }
      switch (((this[s] = a), t)) {
        case "theme-color": {
          let o = Ct.get(this),
            h = this.$sharedStyle;
          o && h && (se ? o.replaceSync(h) : (o.textContent = h));
          break;
        }
      }
    }
    $propertyChangedCallback(t, e, i) {
      if (!Object.is(i, e))
        switch (((t = Mt(t)), typeof i)) {
          case "boolean":
            i === !0 ? this.hasAttribute(t) || this.setAttribute(t, "") : this.removeAttribute(t);
            break;
          case "number":
            xt(i) ? (i = "") : (i = String(i));
          default:
            i ? this.getAttribute(t) !== i && this.setAttribute(t, i) : this.removeAttribute(t);
        }
    }
    connectedCallback() {
      Object.getPrototypeOf(this).constructor.observedAttributes.forEach((e) => {
        let i = zt(e),
          s = this[i];
        Kt(s) || this.$propertyChangedCallback(i, void 0, s),
          Object.defineProperty(this, i, {
            enumerable: !0,
            configurable: !0,
            get() {
              return s;
            },
            set(n) {
              let a = s;
              (s = n), this.$propertyChangedCallback(i, a, n);
            },
          });
      });
      let t = this.attachShadow({ mode: this.shadowRootMode || ee });
      if (
        (this.shadowRoot || bt.set(this, t),
        Ct.set(this, this.$addStyles(this.$sharedStyle)),
        this.$style && this.$addStyles(this.$style),
        this.$template)
      ) {
        let e = document.createElement("template");
        (e.innerHTML = this.$template), t.appendChild(e.content);
      }
      if (this.slottable) {
        let e = document.createElement("slot");
        t.appendChild(e);
      }
    }
    disconnectedCallback() {
      Ct.has(this) && Ct.delete(this), bt.has(this) && bt.delete(this);
    }
    $getTagNameOf(t) {
      var e;
      return (e = ie.get(t)) !== null && e !== void 0 ? e : t;
    }
    $setStyles(t) {
      return (
        Object.keys(t).forEach((e) => {
          let i = t[e];
          p(i) && (i !== 0 && ye.test(e) ? (i = `${i}px`) : (i = String(i))), (this.style[e] = i);
        }),
        this
      );
    }
    $getShadowRoot() {
      return this.shadowRoot || bt.get(this);
    }
    $addStyles(t) {
      let e,
        i = this.$getShadowRoot();
      return (
        se
          ? ((e = new CSSStyleSheet()), e.replaceSync(t), (i.adoptedStyleSheets = i.adoptedStyleSheets.concat(e)))
          : ((e = document.createElement("style")), (e.textContent = t), i.appendChild(e)),
        e
      );
    }
    $emit(t, e, i) {
      return Qt(this, t, e, i);
    }
    $nextTick(t) {
      return te(this, t);
    }
    static $define(t, e) {
      Pt(t) && ((e = t), (t = "")),
        t || (t = this.$name || this.name),
        (t = Mt(t)),
        dt && _.customElements && !_.customElements.get(t) && customElements.define(t, this, e);
    }
  };
v.$version = "2.0.0";
var Oe =
    ':host{display:block;min-height:100px;min-width:200px;overflow:hidden;position:relative;touch-action:none;-webkit-touch-callout:none;-webkit-user-select:none;-moz-user-select:none;user-select:none}:host([background]){background-color:#fff;background-image:repeating-linear-gradient(45deg,#ccc 25%,transparent 0,transparent 75%,#ccc 0,#ccc),repeating-linear-gradient(45deg,#ccc 25%,transparent 0,transparent 75%,#ccc 0,#ccc);background-image:repeating-conic-gradient(#ccc 0 25%,#fff 0 50%);background-position:0 0,.5rem .5rem;background-size:1rem 1rem}:host([disabled]){pointer-events:none}:host([disabled]):after{bottom:0;content:"";cursor:not-allowed;display:block;left:0;pointer-events:none;position:absolute;right:0;top:0}',
  B = class extends v {
    constructor() {
      super(...arguments),
        (this.$onPointerDown = null),
        (this.$onPointerMove = null),
        (this.$onPointerUp = null),
        (this.$onWheel = null),
        (this.$wheeling = !1),
        (this.$pointers = new Map()),
        (this.$style = Oe),
        (this.$action = z),
        (this.background = !1),
        (this.disabled = !1),
        (this.scaleStep = 0.1),
        (this.themeColor = "#39f");
    }
    static get observedAttributes() {
      return super.observedAttributes.concat(["background", "disabled", "scale-step"]);
    }
    connectedCallback() {
      super.connectedCallback(), this.disabled || this.$bind();
    }
    disconnectedCallback() {
      this.disabled || this.$unbind(), super.disconnectedCallback();
    }
    $propertyChangedCallback(t, e, i) {
      if (!Object.is(i, e))
        switch ((super.$propertyChangedCallback(t, e, i), t)) {
          case "disabled":
            i ? this.$unbind() : this.$bind();
            break;
        }
    }
    $bind() {
      this.$onPointerDown ||
        ((this.$onPointerDown = this.$handlePointerDown.bind(this)), C(this, yt, this.$onPointerDown)),
        this.$onPointerMove ||
          ((this.$onPointerMove = this.$handlePointerMove.bind(this)), C(this.ownerDocument, Ot, this.$onPointerMove)),
        this.$onPointerUp ||
          ((this.$onPointerUp = this.$handlePointerUp.bind(this)), C(this.ownerDocument, Rt, this.$onPointerUp)),
        this.$onWheel ||
          ((this.$onWheel = this.$handleWheel.bind(this)), C(this, kt, this.$onWheel, { passive: !1, capture: !0 }));
    }
    $unbind() {
      this.$onPointerDown && (b(this, yt, this.$onPointerDown), (this.$onPointerDown = null)),
        this.$onPointerMove && (b(this.ownerDocument, Ot, this.$onPointerMove), (this.$onPointerMove = null)),
        this.$onPointerUp && (b(this.ownerDocument, Rt, this.$onPointerUp), (this.$onPointerUp = null)),
        this.$onWheel && (b(this, kt, this.$onWheel, { capture: !0 }), (this.$onWheel = null));
    }
    $handlePointerDown(t) {
      let { buttons: e, button: i, type: s } = t;
      if (
        this.disabled ||
        (((s === "pointerdown" && t.pointerType === "mouse") || s === "mousedown") &&
          ((p(e) && e !== 1) || (p(i) && i !== 0) || t.ctrlKey))
      )
        return;
      let { $pointers: n } = this,
        a = "";
      if (t.changedTouches)
        Array.from(t.changedTouches).forEach(({ identifier: o, pageX: h, pageY: r }) => {
          n.set(o, { startX: h, startY: r, endX: h, endY: r });
        });
      else {
        let { pointerId: o = 0, pageX: h, pageY: r } = t;
        n.set(o, { startX: h, startY: r, endX: h, endY: r });
      }
      n.size > 1 ? (a = et) : j(t.target) && (a = t.target.action || t.target.getAttribute(qt) || ""),
        this.$emit(H, { action: a, relatedEvent: t }) !== !1 &&
          (t.preventDefault(), (this.$action = a), (this.style.willChange = "transform"));
    }
    $handlePointerMove(t) {
      let { $action: e, $pointers: i } = this;
      if (this.disabled || e === z || i.size === 0 || this.$emit(Gt, { action: e, relatedEvent: t }) === !1) return;
      if ((t.preventDefault(), t.changedTouches))
        Array.from(t.changedTouches).forEach(({ identifier: n, pageX: a, pageY: o }) => {
          let h = i.get(n);
          h && Object.assign(h, { endX: a, endY: o });
        });
      else {
        let { pointerId: n = 0, pageX: a, pageY: o } = t,
          h = i.get(n);
        h && Object.assign(h, { endX: a, endY: o });
      }
      let s = { action: e, relatedEvent: t };
      if (e === et) {
        let n = new Map(i),
          a = 0,
          o = 0,
          h = 0,
          r = 0,
          c = t.pageX,
          d = t.pageY;
        i.forEach((u, w) => {
          n.delete(w),
            n.forEach((A) => {
              let $ = A.startX - u.startX,
                T = A.startY - u.startY,
                g = A.endX - u.endX,
                E = A.endY - u.endY,
                S = 0,
                N = 0,
                R = 0,
                I = 0;
              if (
                ($ === 0
                  ? T < 0
                    ? (R = Math.PI * 2)
                    : T > 0 && (R = Math.PI)
                  : $ > 0
                    ? (R = Math.PI / 2 + Math.atan(T / $))
                    : $ < 0 && (R = Math.PI * 1.5 + Math.atan(T / $)),
                g === 0
                  ? E < 0
                    ? (I = Math.PI * 2)
                    : E > 0 && (I = Math.PI)
                  : g > 0
                    ? (I = Math.PI / 2 + Math.atan(E / g))
                    : g < 0 && (I = Math.PI * 1.5 + Math.atan(E / g)),
                I > 0 || R > 0)
              ) {
                let x = I - R,
                  P = Math.abs(x);
                P > a && ((a = P), (h = x), (c = (u.startX + A.startX) / 2), (d = (u.startY + A.startY) / 2));
              }
              if (
                (($ = Math.abs($)),
                (T = Math.abs(T)),
                (g = Math.abs(g)),
                (E = Math.abs(E)),
                $ > 0 && T > 0 ? (S = Math.sqrt($ * $ + T * T)) : $ > 0 ? (S = $) : T > 0 && (S = T),
                g > 0 && E > 0 ? (N = Math.sqrt(g * g + E * E)) : g > 0 ? (N = g) : E > 0 && (N = E),
                S > 0 && N > 0)
              ) {
                let x = (N - S) / S,
                  P = Math.abs(x);
                P > o && ((o = P), (r = x), (c = (u.startX + A.startX) / 2), (d = (u.startY + A.startY) / 2));
              }
            });
        });
        let f = a > 0,
          m = o > 0;
        f && m
          ? ((s.rotate = h), (s.scale = r), (s.centerX = c), (s.centerY = d))
          : f
            ? ((s.action = ut), (s.rotate = h), (s.centerX = c), (s.centerY = d))
            : m
              ? ((s.action = L), (s.scale = r), (s.centerX = c), (s.centerY = d))
              : (s.action = z);
      } else {
        let [n] = Array.from(i.values());
        Object.assign(s, n);
      }
      i.forEach((n) => {
        (n.startX = n.endX), (n.startY = n.endY);
      }),
        s.action !== z && this.$emit(Y, s, { cancelable: !1 });
    }
    $handlePointerUp(t) {
      let { $action: e, $pointers: i } = this;
      if (!(this.disabled || e === z) && this.$emit(D, { action: e, relatedEvent: t }) !== !1) {
        if ((t.preventDefault(), t.changedTouches))
          Array.from(t.changedTouches).forEach(({ identifier: s }) => {
            i.delete(s);
          });
        else {
          let { pointerId: s = 0 } = t;
          i.delete(s);
        }
        i.size === 0 && ((this.style.willChange = ""), (this.$action = z));
      }
    }
    $handleWheel(t) {
      if (this.disabled || (t.preventDefault(), this.$wheeling)) return;
      (this.$wheeling = !0),
        setTimeout(() => {
          this.$wheeling = !1;
        }, 50);
      let i = (t.deltaY > 0 ? -1 : 1) * this.scaleStep;
      this.$emit(Y, { action: L, scale: i, relatedEvent: t }, { cancelable: !1 });
    }
    $setAction(t) {
      return ot(t) && (this.$action = t), this;
    }
    $toCanvas(t) {
      return new Promise((e, i) => {
        if (!this.isConnected) {
          i(new Error("The current element is not connected to the DOM."));
          return;
        }
        let s = document.createElement("canvas"),
          n = this.offsetWidth,
          a = this.offsetHeight,
          o = 1;
        at(t) &&
          (y(t.width) || y(t.height)) &&
          (({ width: n, height: a } = ht({ aspectRatio: n / a, width: t.width, height: t.height })),
          (o = n / this.offsetWidth)),
          (s.width = n),
          (s.height = a);
        let h = this.querySelector(this.$getTagNameOf(M));
        if (!h) {
          e(s);
          return;
        }
        h.$ready()
          .then((r) => {
            let c = s.getContext("2d");
            if (c) {
              let [d, f, m, u, w, A] = h.$getTransform(),
                $ = w,
                T = A,
                g = r.naturalWidth,
                E = r.naturalHeight;
              o !== 1 && (($ *= o), (T *= o), (g *= o), (E *= o));
              let S = g / 2,
                N = E / 2;
              (c.fillStyle = "transparent"),
                c.fillRect(0, 0, n, a),
                at(t) && ct(t.beforeDraw) && t.beforeDraw.call(this, c, s),
                c.save(),
                c.translate(S, N),
                c.transform(d, f, m, u, $, T),
                c.translate(-S, -N),
                c.drawImage(r, 0, 0, g, E),
                c.restore();
            }
            e(s);
          })
          .catch(i);
      });
    }
  };
B.$name = k;
B.$version = "2.0.0";
var Re =
    ":host{display:inline-block}img{display:block;height:100%;max-height:none!important;max-width:none!important;min-height:0!important;min-width:0!important;width:100%}",
  ne = new WeakMap(),
  re = ["alt", "crossorigin", "decoding", "importance", "loading", "referrerpolicy", "sizes", "src", "srcset"],
  F = class extends v {
    constructor() {
      super(...arguments),
        (this.$matrix = [1, 0, 0, 1, 0, 0]),
        (this.$onLoad = null),
        (this.$onCanvasAction = null),
        (this.$onCanvasActionEnd = null),
        (this.$onCanvasActionStart = null),
        (this.$actionStartTarget = null),
        (this.$style = Re),
        (this.$image = new Image()),
        (this.initialCenterSize = "contain"),
        (this.rotatable = !1),
        (this.scalable = !1),
        (this.skewable = !1),
        (this.slottable = !1),
        (this.translatable = !1);
    }
    set $canvas(t) {
      ne.set(this, t);
    }
    get $canvas() {
      return ne.get(this);
    }
    static get observedAttributes() {
      return super.observedAttributes.concat(re, [
        "initial-center-size",
        "rotatable",
        "scalable",
        "skewable",
        "translatable",
      ]);
    }
    attributeChangedCallback(t, e, i) {
      Object.is(i, e) || (super.attributeChangedCallback(t, e, i), re.includes(t) && this.$image.setAttribute(t, i));
    }
    $propertyChangedCallback(t, e, i) {
      if (!Object.is(i, e))
        switch ((super.$propertyChangedCallback(t, e, i), t)) {
          case "initialCenterSize":
            this.$nextTick(() => {
              this.$center(i);
            });
            break;
        }
    }
    connectedCallback() {
      super.connectedCallback();
      let { $image: t } = this,
        e = this.closest(this.$getTagNameOf(k));
      e &&
        ((this.$canvas = e),
        this.$setStyles({ display: "block", position: "absolute" }),
        (this.$onCanvasActionStart = (i) => {
          var s, n;
          this.$actionStartTarget =
            (n = (s = i.detail) === null || s === void 0 ? void 0 : s.relatedEvent) === null || n === void 0
              ? void 0
              : n.target;
        }),
        (this.$onCanvasActionEnd = () => {
          this.$actionStartTarget = null;
        }),
        (this.$onCanvasAction = this.$handleAction.bind(this)),
        C(e, H, this.$onCanvasActionStart),
        C(e, D, this.$onCanvasActionEnd),
        C(e, Y, this.$onCanvasAction)),
        (this.$onLoad = this.$handleLoad.bind(this)),
        C(t, V, this.$onLoad),
        this.$getShadowRoot().appendChild(t);
    }
    disconnectedCallback() {
      let { $image: t, $canvas: e } = this;
      e &&
        (this.$onCanvasActionStart && (b(e, H, this.$onCanvasActionStart), (this.$onCanvasActionStart = null)),
        this.$onCanvasActionEnd && (b(e, D, this.$onCanvasActionEnd), (this.$onCanvasActionEnd = null)),
        this.$onCanvasAction && (b(e, Y, this.$onCanvasAction), (this.$onCanvasAction = null))),
        t && this.$onLoad && (b(t, V, this.$onLoad), (this.$onLoad = null)),
        this.$getShadowRoot().removeChild(t),
        super.disconnectedCallback();
    }
    $handleLoad() {
      let { $image: t } = this;
      this.$setStyles({ width: t.naturalWidth, height: t.naturalHeight }),
        this.$canvas && this.$center(this.initialCenterSize);
    }
    $handleAction(t) {
      if (this.hidden || !(this.rotatable || this.scalable || this.translatable)) return;
      let { $canvas: e } = this,
        { detail: i } = t;
      if (i) {
        let { relatedEvent: s } = i,
          { action: n } = i;
        switch (
          (n === et &&
            (!this.rotatable || !this.scalable) &&
            (this.rotatable ? (n = ut) : this.scalable ? (n = L) : (n = z)),
          n)
        ) {
          case gt:
            if (this.translatable) {
              let a = null;
              s && (a = s.target.closest(this.$getTagNameOf(O))),
                a || (a = e.querySelector(this.$getTagNameOf(O))),
                a && a.multiple && !a.active && (a = e.querySelector(`${this.$getTagNameOf(O)}[active]`)),
                (!a ||
                  a.hidden ||
                  !a.movable ||
                  a.dynamic ||
                  !(this.$actionStartTarget && a.contains(this.$actionStartTarget))) &&
                  this.$move(i.endX - i.startX, i.endY - i.startY);
            }
            break;
          case ut:
            if (this.rotatable)
              if (s) {
                let { x: a, y: o } = this.getBoundingClientRect();
                this.$rotate(i.rotate, s.clientX - a, s.clientY - o);
              } else this.$rotate(i.rotate);
            break;
          case L:
            if (this.scalable)
              if (s) {
                let a = s.target.closest(this.$getTagNameOf(O));
                if (!a || !a.zoomable || (a.zoomable && a.dynamic)) {
                  let { x: o, y: h } = this.getBoundingClientRect();
                  this.$zoom(i.scale, s.clientX - o, s.clientY - h);
                }
              } else this.$zoom(i.scale);
            break;
          case et:
            if (this.rotatable && this.scalable) {
              let { rotate: a } = i,
                { scale: o } = i;
              o < 0 ? (o = 1 / (1 - o)) : (o += 1);
              let h = Math.cos(a),
                r = Math.sin(a),
                [c, d, f, m] = [h * o, r * o, -r * o, h * o];
              if (s) {
                let u = this.getBoundingClientRect(),
                  w = s.clientX - u.x,
                  A = s.clientY - u.y,
                  [$, T, g, E] = this.$matrix,
                  S = u.width / 2,
                  N = u.height / 2,
                  R = w - S,
                  I = A - N,
                  x = (R * E - g * I) / ($ * E - g * T),
                  P = (I * $ - T * R) / ($ * E - g * T);
                this.$transform(c, d, f, m, x * (1 - c) + P * f, P * (1 - m) + x * d);
              } else this.$transform(c, d, f, m, 0, 0);
            }
            break;
        }
      }
    }
    $ready(t) {
      let { $image: e } = this,
        i = new Promise((s, n) => {
          let a = new Error("Failed to load the image source");
          if (e.complete) e.naturalWidth > 0 && e.naturalHeight > 0 ? s(e) : n(a);
          else {
            let o = () => {
                b(e, It, h), s(e);
              },
              h = () => {
                b(e, V, o), n(a);
              };
            Dt(e, V, o), Dt(e, It, h);
          }
        });
      return ct(t) && i.then((s) => (t(s), s)), i;
    }
    $center(t) {
      let { parentElement: e } = this;
      if (!e) return this;
      let i = e.getBoundingClientRect(),
        s = i.width,
        n = i.height,
        { x: a, y: o, width: h, height: r } = this.getBoundingClientRect(),
        c = a + h / 2,
        d = o + r / 2,
        f = i.x + s / 2,
        m = i.y + n / 2;
      if ((this.$move(f - c, m - d), t && (h !== s || r !== n))) {
        let u = s / h,
          w = n / r;
        switch (t) {
          case "cover":
            this.$scale(Math.max(u, w));
            break;
          case "contain":
            this.$scale(Math.min(u, w));
            break;
        }
      }
      return this;
    }
    $move(t, e = t) {
      if (this.translatable && p(t) && p(e)) {
        let [i, s, n, a] = this.$matrix,
          o = (t * a - n * e) / (i * a - n * s),
          h = (e * i - s * t) / (i * a - n * s);
        this.$translate(o, h);
      }
      return this;
    }
    $moveTo(t, e = t) {
      if (this.translatable && p(t) && p(e)) {
        let [i, s, n, a] = this.$matrix,
          o = (t * a - n * e) / (i * a - n * s),
          h = (e * i - s * t) / (i * a - n * s);
        this.$setTransform(i, s, n, a, o, h);
      }
      return this;
    }
    $rotate(t, e, i) {
      if (this.rotatable) {
        let s = Et(t),
          n = Math.cos(s),
          a = Math.sin(s),
          [o, h, r, c] = [n, a, -a, n];
        if (p(e) && p(i)) {
          let [d, f, m, u] = this.$matrix,
            { width: w, height: A } = this.getBoundingClientRect(),
            $ = w / 2,
            T = A / 2,
            g = e - $,
            E = i - T,
            S = (g * u - m * E) / (d * u - m * f),
            N = (E * d - f * g) / (d * u - m * f);
          this.$transform(o, h, r, c, S * (1 - o) - N * r, N * (1 - c) - S * h);
        } else this.$transform(o, h, r, c, 0, 0);
      }
      return this;
    }
    $zoom(t, e, i) {
      if (!this.scalable || t === 0) return this;
      if ((t < 0 ? (t = 1 / (1 - t)) : (t += 1), p(e) && p(i))) {
        let [s, n, a, o] = this.$matrix,
          { width: h, height: r } = this.getBoundingClientRect(),
          c = h / 2,
          d = r / 2,
          f = e - c,
          m = i - d,
          u = (f * o - a * m) / (s * o - a * n),
          w = (m * s - n * f) / (s * o - a * n);
        this.$transform(t, 0, 0, t, u * (1 - t), w * (1 - t));
      } else this.$scale(t);
      return this;
    }
    $scale(t, e = t) {
      return this.scalable && this.$transform(t, 0, 0, e, 0, 0), this;
    }
    $skew(t, e = 0) {
      if (this.skewable) {
        let i = Et(t),
          s = Et(e);
        this.$transform(1, Math.tan(s), Math.tan(i), 1, 0, 0);
      }
      return this;
    }
    $translate(t, e = t) {
      return this.translatable && p(t) && p(e) && this.$transform(1, 0, 0, 1, t, e), this;
    }
    $transform(t, e, i, s, n, a) {
      return p(t) && p(e) && p(i) && p(s) && p(n) && p(a)
        ? this.$setTransform(Wt(this.$matrix, [t, e, i, s, n, a]))
        : this;
    }
    $setTransform(t, e, i, s, n, a) {
      if (
        (this.rotatable || this.scalable || this.skewable || this.translatable) &&
        (Array.isArray(t) && ([t, e, i, s, n, a] = t), p(t) && p(e) && p(i) && p(s) && p(n) && p(a))
      ) {
        let o = [...this.$matrix],
          h = [t, e, i, s, n, a];
        if (this.$emit(pt, { matrix: h, oldMatrix: o }) === !1) return this;
        (this.$matrix = h), (this.style.transform = `matrix(${h.join(", ")})`);
      }
      return this;
    }
    $getTransform() {
      return this.$matrix.slice();
    }
    $resetTransform() {
      return this.$setTransform([1, 0, 0, 1, 0, 0]);
    }
  };
F.$name = M;
F.$version = "2.0.0";
var Ie =
    ":host{display:block;height:0;left:0;outline:var(--theme-color) solid 1px;position:relative;top:0;width:0}:host([transparent]){outline-color:transparent}",
  oe = new WeakMap(),
  Z = class extends v {
    constructor() {
      super(...arguments),
        (this.$onCanvasChange = null),
        (this.$onCanvasActionEnd = null),
        (this.$onCanvasActionStart = null),
        (this.$style = Ie),
        (this.x = 0),
        (this.y = 0),
        (this.width = 0),
        (this.height = 0),
        (this.slottable = !1),
        (this.themeColor = "rgba(0, 0, 0, 0.65)");
    }
    set $canvas(t) {
      oe.set(this, t);
    }
    get $canvas() {
      return oe.get(this);
    }
    static get observedAttributes() {
      return super.observedAttributes.concat(["height", "width", "x", "y"]);
    }
    connectedCallback() {
      super.connectedCallback();
      let t = this.closest(this.$getTagNameOf(k));
      if (t) {
        (this.$canvas = t), (this.style.position = "absolute");
        let e = t.querySelector(this.$getTagNameOf(O));
        e &&
          ((this.$onCanvasActionStart = (i) => {
            e.hidden && i.detail.action === tt && (this.hidden = !1);
          }),
          (this.$onCanvasActionEnd = (i) => {
            e.hidden && i.detail.action === tt && (this.hidden = !0);
          }),
          (this.$onCanvasChange = (i) => {
            let { x: s, y: n, width: a, height: o } = i.detail;
            this.$change(s, n, a, o), (e.hidden || (s === 0 && n === 0 && a === 0 && o === 0)) && (this.hidden = !0);
          }),
          C(t, H, this.$onCanvasActionStart),
          C(t, D, this.$onCanvasActionEnd),
          C(t, W, this.$onCanvasChange));
      }
      this.$render();
    }
    disconnectedCallback() {
      let { $canvas: t } = this;
      t &&
        (this.$onCanvasActionStart && (b(t, H, this.$onCanvasActionStart), (this.$onCanvasActionStart = null)),
        this.$onCanvasActionEnd && (b(t, D, this.$onCanvasActionEnd), (this.$onCanvasActionEnd = null)),
        this.$onCanvasChange && (b(t, W, this.$onCanvasChange), (this.$onCanvasChange = null))),
        super.disconnectedCallback();
    }
    $change(t, e, i = this.width, s = this.height) {
      return !p(t) || !p(e) || !p(i) || !p(s) || (t === this.x && e === this.y && i === this.width && s === this.height)
        ? this
        : (this.hidden && (this.hidden = !1),
          (this.x = t),
          (this.y = e),
          (this.width = i),
          (this.height = s),
          this.$render());
    }
    $reset() {
      return this.$change(0, 0, 0, 0);
    }
    $render() {
      return this.$setStyles({
        transform: `translate(${this.x}px, ${this.y}px)`,
        width: this.width,
        height: this.height,
        outlineWidth: _.innerWidth,
      });
    }
  };
Z.$name = Ft;
Z.$version = "2.0.0";
var _e =
    ':host{background-color:var(--theme-color);display:block}:host([action=move]),:host([action=select]){height:100%;left:0;position:absolute;top:0;width:100%}:host([action=move]){cursor:move}:host([action=select]){cursor:crosshair}:host([action$=-resize]){background-color:transparent;height:15px;position:absolute;width:15px}:host([action$=-resize]):after{background-color:var(--theme-color);content:"";display:block;height:5px;left:50%;position:absolute;top:50%;transform:translate(-50%,-50%);width:5px}:host([action=n-resize]),:host([action=s-resize]){cursor:ns-resize;left:50%;transform:translateX(-50%);width:100%}:host([action=n-resize]){top:-8px}:host([action=s-resize]){bottom:-8px}:host([action=e-resize]),:host([action=w-resize]){cursor:ew-resize;height:100%;top:50%;transform:translateY(-50%)}:host([action=e-resize]){right:-8px}:host([action=w-resize]){left:-8px}:host([action=ne-resize]){cursor:nesw-resize;right:-8px;top:-8px}:host([action=nw-resize]){cursor:nwse-resize;left:-8px;top:-8px}:host([action=se-resize]){bottom:-8px;cursor:nwse-resize;right:-8px}:host([action=se-resize]):after{height:15px;width:15px}@media (pointer:coarse){:host([action=se-resize]):after{height:10px;width:10px}}@media (pointer:fine){:host([action=se-resize]):after{height:5px;width:5px}}:host([action=sw-resize]){bottom:-8px;cursor:nesw-resize;left:-8px}:host([plain]){background-color:transparent}',
  q = class extends v {
    constructor() {
      super(...arguments),
        (this.$onCanvasCropEnd = null),
        (this.$onCanvasCropStart = null),
        (this.$style = _e),
        (this.action = z),
        (this.plain = !1),
        (this.slottable = !1),
        (this.themeColor = "rgba(51, 153, 255, 0.5)");
    }
    static get observedAttributes() {
      return super.observedAttributes.concat(["action", "plain"]);
    }
  };
q.$name = Bt;
q.$version = "2.0.0";
var ke =
    ':host{display:block;left:0;position:relative;right:0}:host([outlined]){outline:1px solid var(--theme-color)}:host([multiple]){outline:1px dashed hsla(0,0%,100%,.5)}:host([multiple]):after{bottom:0;content:"";cursor:pointer;display:block;left:0;position:absolute;right:0;top:0}:host([multiple][active]){outline-color:var(--theme-color);z-index:1}:host([multiple])>*{visibility:hidden}:host([multiple][active])>*{visibility:visible}:host([multiple][active]):after{display:none}',
  ae = new WeakMap(),
  G = class extends v {
    constructor() {
      super(...arguments),
        (this.$onCanvasAction = null),
        (this.$onCanvasActionStart = null),
        (this.$onCanvasActionEnd = null),
        (this.$onDocumentKeyDown = null),
        (this.$action = ""),
        (this.$actionStartTarget = null),
        (this.$changing = !1),
        (this.$style = ke),
        (this.$initialSelection = { x: 0, y: 0, width: 0, height: 0 }),
        (this.x = 0),
        (this.y = 0),
        (this.width = 0),
        (this.height = 0),
        (this.aspectRatio = NaN),
        (this.initialAspectRatio = NaN),
        (this.initialCoverage = NaN),
        (this.active = !1),
        (this.linked = !1),
        (this.dynamic = !1),
        (this.movable = !1),
        (this.resizable = !1),
        (this.zoomable = !1),
        (this.multiple = !1),
        (this.keyboard = !1),
        (this.outlined = !1),
        (this.precise = !1);
    }
    set $canvas(t) {
      ae.set(this, t);
    }
    get $canvas() {
      return ae.get(this);
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
    $propertyChangedCallback(t, e, i) {
      if (!Object.is(i, e))
        switch ((super.$propertyChangedCallback(t, e, i), t)) {
          case "x":
          case "y":
          case "width":
          case "height":
            this.$changing ||
              this.$nextTick(() => {
                this.$change(this.x, this.y, this.width, this.height, this.aspectRatio, !0);
              });
            break;
          case "aspectRatio":
          case "initialAspectRatio":
            this.$nextTick(() => {
              this.$initSelection();
            });
            break;
          case "initialCoverage":
            this.$nextTick(() => {
              y(i) && i <= 1 && this.$initSelection(!0, !0);
            });
            break;
          case "keyboard":
            this.$nextTick(() => {
              this.$canvas &&
                (i
                  ? this.$onDocumentKeyDown ||
                    ((this.$onDocumentKeyDown = this.$handleKeyDown.bind(this)),
                    C(this.ownerDocument, _t, this.$onDocumentKeyDown))
                  : this.$onDocumentKeyDown &&
                    (b(this.ownerDocument, _t, this.$onDocumentKeyDown), (this.$onDocumentKeyDown = null)));
            });
            break;
          case "multiple":
            this.$nextTick(() => {
              if (this.$canvas) {
                let s = this.$getSelections();
                i
                  ? (s.forEach((n) => {
                      n.active = !1;
                    }),
                    (this.active = !0),
                    this.$emit(W, { x: this.x, y: this.y, width: this.width, height: this.height }))
                  : ((this.active = !1),
                    s.slice(1).forEach((n) => {
                      this.$removeSelection(n);
                    }));
              }
            });
            break;
          case "precise":
            this.$nextTick(() => {
              this.$change(this.x, this.y);
            });
            break;
          case "linked":
            i && (this.dynamic = !0);
            break;
        }
    }
    connectedCallback() {
      super.connectedCallback();
      let t = this.closest(this.$getTagNameOf(k));
      t
        ? ((this.$canvas = t),
          this.$setStyles({ position: "absolute", transform: `translate(${this.x}px, ${this.y}px)` }),
          this.hidden || this.$render(),
          this.$initSelection(!0),
          (this.$onCanvasActionStart = this.$handleActionStart.bind(this)),
          (this.$onCanvasActionEnd = this.$handleActionEnd.bind(this)),
          (this.$onCanvasAction = this.$handleAction.bind(this)),
          C(t, H, this.$onCanvasActionStart),
          C(t, D, this.$onCanvasActionEnd),
          C(t, Y, this.$onCanvasAction))
        : this.$render();
    }
    disconnectedCallback() {
      let { $canvas: t } = this;
      t &&
        (this.$onCanvasActionStart && (b(t, H, this.$onCanvasActionStart), (this.$onCanvasActionStart = null)),
        this.$onCanvasActionEnd && (b(t, D, this.$onCanvasActionEnd), (this.$onCanvasActionEnd = null)),
        this.$onCanvasAction && (b(t, Y, this.$onCanvasAction), (this.$onCanvasAction = null))),
        super.disconnectedCallback();
    }
    $getSelections() {
      let t = [];
      return this.parentElement && (t = Array.from(this.parentElement.querySelectorAll(this.$getTagNameOf(O)))), t;
    }
    $initSelection(t = !1, e = !1) {
      let { initialCoverage: i, parentElement: s } = this;
      if (y(i) && s) {
        let n = this.aspectRatio || this.initialAspectRatio,
          a = (e ? 0 : this.width) || s.offsetWidth * i,
          o = (e ? 0 : this.height) || s.offsetHeight * i;
        y(n) && ({ width: a, height: o } = ht({ aspectRatio: n, width: a, height: o })),
          this.$change(this.x, this.y, a, o),
          t && this.$center(),
          (this.$initialSelection = { x: this.x, y: this.y, width: this.width, height: this.height });
      }
    }
    $createSelection() {
      let t = this.cloneNode(!0);
      return (
        this.hasAttribute("id") && t.removeAttribute("id"),
        (t.initialCoverage = NaN),
        (this.active = !1),
        this.parentElement && this.parentElement.insertBefore(t, this.nextSibling),
        t
      );
    }
    $removeSelection(t = this) {
      if (this.parentElement) {
        let e = this.$getSelections();
        if (e.length > 1) {
          let i = e.indexOf(t),
            s = e[i + 1] || e[i - 1];
          s &&
            ((t.active = !1),
            this.parentElement.removeChild(t),
            (s.active = !0),
            s.$emit(W, { x: s.x, y: s.y, width: s.width, height: s.height }));
        } else this.$clear();
      }
    }
    $handleActionStart(t) {
      var e, i;
      let s =
        (i = (e = t.detail) === null || e === void 0 ? void 0 : e.relatedEvent) === null || i === void 0
          ? void 0
          : i.target;
      (this.$action = ""),
        (this.$actionStartTarget = s),
        !this.hidden &&
          this.multiple &&
          !this.active &&
          s === this &&
          this.parentElement &&
          (this.$getSelections().forEach((n) => {
            n.active = !1;
          }),
          (this.active = !0),
          this.$emit(W, { x: this.x, y: this.y, width: this.width, height: this.height }));
    }
    $handleAction(t) {
      let { currentTarget: e, detail: i } = t;
      if (!e || !i) return;
      let { relatedEvent: s } = i,
        { action: n } = i;
      if (
        (!n && this.multiple && ((n = this.$action || (s == null ? void 0 : s.target.action)), (this.$action = n)),
        !n || (this.hidden && n !== tt) || (this.multiple && !this.active && n !== L))
      )
        return;
      let a = i.endX - i.startX,
        o = i.endY - i.startY,
        { width: h, height: r } = this,
        { aspectRatio: c } = this;
      switch ((!y(c) && s.shiftKey && (c = y(h) && y(r) ? h / r : 1), n)) {
        case tt:
          if (a !== 0 && o !== 0) {
            let { $canvas: d } = this,
              f = Ht(e);
            (this.multiple && !this.hidden ? this.$createSelection() : this).$change(
              i.startX - f.left,
              i.startY - f.top,
              Math.abs(a),
              Math.abs(o),
              c,
            ),
              a < 0 ? (o < 0 ? (n = st) : o > 0 && (n = rt)) : a > 0 && (o < 0 ? (n = it) : o > 0 && (n = nt)),
              d && (d.$action = n);
          }
          break;
        case gt:
          this.movable &&
            (this.dynamic || (this.$actionStartTarget && this.contains(this.$actionStartTarget))) &&
            this.$move(a, o);
          break;
        case L:
          if (s && this.zoomable && (this.dynamic || this.contains(s.target))) {
            let d = Ht(e);
            this.$zoom(i.scale, s.pageX - d.left, s.pageY - d.top);
          }
          break;
        default:
          this.$resize(n, a, o, c);
      }
    }
    $handleActionEnd() {
      (this.$action = ""), (this.$actionStartTarget = null);
    }
    $handleKeyDown(t) {
      if (this.hidden || !this.keyboard || (this.multiple && !this.active) || t.defaultPrevented) return;
      let { activeElement: e } = document;
      if (!(e && (["INPUT", "TEXTAREA"].includes(e.tagName) || ["true", "plaintext-only"].includes(e.contentEditable))))
        switch (t.key) {
          case "Backspace":
            t.metaKey && (t.preventDefault(), this.$removeSelection());
            break;
          case "Delete":
            t.preventDefault(), this.$removeSelection();
            break;
          case "ArrowLeft":
            t.preventDefault(), this.$move(-1, 0);
            break;
          case "ArrowRight":
            t.preventDefault(), this.$move(1, 0);
            break;
          case "ArrowUp":
            t.preventDefault(), this.$move(0, -1);
            break;
          case "ArrowDown":
            t.preventDefault(), this.$move(0, 1);
            break;
          case "+":
            t.preventDefault(), this.$zoom(0.1);
            break;
          case "-":
            t.preventDefault(), this.$zoom(-0.1);
            break;
        }
    }
    $center() {
      let { parentElement: t } = this;
      if (!t) return this;
      let e = (t.offsetWidth - this.width) / 2,
        i = (t.offsetHeight - this.height) / 2;
      return this.$change(e, i);
    }
    $move(t, e = t) {
      return this.$moveTo(this.x + t, this.y + e);
    }
    $moveTo(t, e = t) {
      return this.movable ? this.$change(t, e) : this;
    }
    $resize(t, e = 0, i = 0, s = this.aspectRatio) {
      if (!this.resizable) return this;
      let n = y(s),
        { $canvas: a } = this,
        { x: o, y: h, width: r, height: c } = this;
      switch (t) {
        case At:
          (h += i),
            (c -= i),
            c < 0 && ((t = wt), (c = -c), (h -= c)),
            n && ((e = i * s), (o += e / 2), (r -= e), r < 0 && ((r = -r), (o -= r)));
          break;
        case St:
          (r += e),
            r < 0 && ((t = Nt), (r = -r), (o -= r)),
            n && ((i = e / s), (h -= i / 2), (c += i), c < 0 && ((c = -c), (h -= c)));
          break;
        case wt:
          (c += i),
            c < 0 && ((t = At), (c = -c), (h -= c)),
            n && ((e = i * s), (o -= e / 2), (r += e), r < 0 && ((r = -r), (o -= r)));
          break;
        case Nt:
          (o += e),
            (r -= e),
            r < 0 && ((t = St), (r = -r), (o -= r)),
            n && ((i = e / s), (h += i / 2), (c -= i), c < 0 && ((c = -c), (h -= c)));
          break;
        case it:
          n && (i = -e / s),
            (h += i),
            (c -= i),
            (r += e),
            r < 0 && c < 0
              ? ((t = rt), (r = -r), (c = -c), (o -= r), (h -= c))
              : r < 0
                ? ((t = st), (r = -r), (o -= r))
                : c < 0 && ((t = nt), (c = -c), (h -= c));
          break;
        case st:
          n && (i = e / s),
            (o += e),
            (h += i),
            (r -= e),
            (c -= i),
            r < 0 && c < 0
              ? ((t = nt), (r = -r), (c = -c), (o -= r), (h -= c))
              : r < 0
                ? ((t = it), (r = -r), (o -= r))
                : c < 0 && ((t = rt), (c = -c), (h -= c));
          break;
        case nt:
          n && (i = e / s),
            (r += e),
            (c += i),
            r < 0 && c < 0
              ? ((t = st), (r = -r), (c = -c), (o -= r), (h -= c))
              : r < 0
                ? ((t = rt), (r = -r), (o -= r))
                : c < 0 && ((t = it), (c = -c), (h -= c));
          break;
        case rt:
          n && (i = -e / s),
            (o += e),
            (r -= e),
            (c += i),
            r < 0 && c < 0
              ? ((t = it), (r = -r), (c = -c), (o -= r), (h -= c))
              : r < 0
                ? ((t = nt), (r = -r), (o -= r))
                : c < 0 && ((t = st), (c = -c), (h -= c));
          break;
      }
      return a && a.$setAction(t), this.$change(o, h, r, c);
    }
    $zoom(t, e, i) {
      if (!this.zoomable || t === 0) return this;
      t < 0 ? (t = 1 / (1 - t)) : (t += 1);
      let { width: s, height: n } = this,
        a = s * t,
        o = n * t,
        h = this.x,
        r = this.y;
      return (
        p(e) && p(i)
          ? ((h -= (a - s) * ((e - this.x) / s)), (r -= (o - n) * ((i - this.y) / n)))
          : ((h -= (a - s) / 2), (r -= (o - n) / 2)),
        this.$change(h, r, a, o)
      );
    }
    $change(t, e, i = this.width, s = this.height, n = this.aspectRatio, a = !1) {
      return this.$changing || !p(t) || !p(e) || !p(i) || !p(s) || i < 0 || s < 0
        ? this
        : (y(n) && ({ width: i, height: s } = ht({ aspectRatio: n, width: i, height: s }, "cover")),
          this.precise || ((t = Math.round(t)), (e = Math.round(e)), (i = Math.round(i)), (s = Math.round(s))),
          t === this.x && e === this.y && i === this.width && s === this.height && Object.is(n, this.aspectRatio) && !a
            ? this
            : (this.hidden && (this.hidden = !1),
              this.$emit(W, { x: t, y: e, width: i, height: s }) === !1
                ? this
                : ((this.$changing = !0),
                  (this.x = t),
                  (this.y = e),
                  (this.width = i),
                  (this.height = s),
                  (this.$changing = !1),
                  this.$render())));
    }
    $reset() {
      let { x: t, y: e, width: i, height: s } = this.$initialSelection;
      return this.$change(t, e, i, s);
    }
    $clear() {
      return this.$change(0, 0, 0, 0, NaN, !0), (this.hidden = !0), this;
    }
    $render() {
      return this.$setStyles({
        transform: `translate(${this.x}px, ${this.y}px)`,
        width: this.width,
        height: this.height,
      });
    }
    $toCanvas(t) {
      return new Promise((e, i) => {
        if (!this.isConnected) {
          i(new Error("The current element is not connected to the DOM."));
          return;
        }
        let s = document.createElement("canvas"),
          { width: n, height: a } = this,
          o = 1;
        if (
          (at(t) &&
            (y(t.width) || y(t.height)) &&
            (({ width: n, height: a } = ht({ aspectRatio: n / a, width: t.width, height: t.height })),
            (o = n / this.width)),
          (s.width = n),
          (s.height = a),
          !this.$canvas)
        ) {
          e(s);
          return;
        }
        let h = this.$canvas.querySelector(this.$getTagNameOf(M));
        if (!h) {
          e(s);
          return;
        }
        h.$ready()
          .then((r) => {
            let c = s.getContext("2d");
            if (c) {
              let [d, f, m, u, w, A] = h.$getTransform(),
                $ = -this.x,
                T = -this.y,
                g = ($ * u - m * T) / (d * u - m * f),
                E = (T * d - f * $) / (d * u - m * f),
                S = d * g + m * E + w,
                N = f * g + u * E + A,
                R = r.naturalWidth,
                I = r.naturalHeight;
              o !== 1 && ((S *= o), (N *= o), (R *= o), (I *= o));
              let x = R / 2,
                P = I / 2;
              (c.fillStyle = "transparent"),
                c.fillRect(0, 0, n, a),
                at(t) && ct(t.beforeDraw) && t.beforeDraw.call(this, c, s),
                c.save(),
                c.translate(x, P),
                c.transform(d, f, m, u, S, N),
                c.translate(-x, -P),
                c.drawImage(r, 0, 0, R, I),
                c.restore();
            }
            e(s);
          })
          .catch(i);
      });
    }
  };
G.$name = O;
G.$version = "2.0.0";
var xe =
    ":host{display:flex;flex-direction:column;position:relative;touch-action:none;-webkit-user-select:none;-moz-user-select:none;user-select:none}:host([bordered]){border:1px dashed var(--theme-color)}:host([covered]){bottom:0;left:0;position:absolute;right:0;top:0}:host>span{display:flex;flex:1}:host>span+span{border-top:1px dashed var(--theme-color)}:host>span>span{flex:1}:host>span>span+span{border-left:1px dashed var(--theme-color)}",
  K = class extends v {
    constructor() {
      super(...arguments),
        (this.$style = xe),
        (this.bordered = !1),
        (this.columns = 3),
        (this.covered = !1),
        (this.rows = 3),
        (this.slottable = !1),
        (this.themeColor = "rgba(238, 238, 238, 0.5)");
    }
    static get observedAttributes() {
      return super.observedAttributes.concat(["bordered", "columns", "covered", "rows"]);
    }
    $propertyChangedCallback(t, e, i) {
      Object.is(i, e) ||
        (super.$propertyChangedCallback(t, e, i),
        (t === "rows" || t === "columns") &&
          this.$nextTick(() => {
            this.$render();
          }));
    }
    connectedCallback() {
      super.connectedCallback(), this.$render();
    }
    $render() {
      let t = this.$getShadowRoot(),
        e = document.createDocumentFragment();
      for (let i = 0; i < this.rows; i += 1) {
        let s = document.createElement("span");
        s.setAttribute("role", "row");
        for (let n = 0; n < this.columns; n += 1) {
          let a = document.createElement("span");
          a.setAttribute("role", "gridcell"), s.appendChild(a);
        }
        e.appendChild(s);
      }
      t && ((t.innerHTML = ""), t.appendChild(e));
    }
  };
K.$name = jt;
K.$version = "2.0.0";
var Pe =
    ':host{display:inline-block;height:1em;position:relative;touch-action:none;-webkit-user-select:none;-moz-user-select:none;user-select:none;vertical-align:middle;width:1em}:host:after,:host:before{background-color:var(--theme-color);content:"";display:block;position:absolute}:host:before{height:1px;left:0;top:50%;transform:translateY(-50%);width:100%}:host:after{height:100%;left:50%;top:0;transform:translateX(-50%);width:1px}:host([centered]){left:50%;position:absolute;top:50%;transform:translate(-50%,-50%)}',
  J = class extends v {
    constructor() {
      super(...arguments),
        (this.$style = Pe),
        (this.centered = !1),
        (this.slottable = !1),
        (this.themeColor = "rgba(238, 238, 238, 0.5)");
    }
    static get observedAttributes() {
      return super.observedAttributes.concat(["centered"]);
    }
  };
J.$name = Vt;
J.$version = "2.0.0";
var Me = ":host{display:block;height:100%;overflow:hidden;position:relative;width:100%}",
  ce = new WeakMap(),
  he = new WeakMap(),
  le = new WeakMap(),
  de = new WeakMap(),
  ze = "both",
  De = "horizontal",
  ue = "vertical",
  He = "none",
  Q = class extends v {
    constructor() {
      super(...arguments),
        (this.$onSelectionChange = null),
        (this.$onSourceImageLoad = null),
        (this.$onSourceImageTransform = null),
        (this.$scale = 1),
        (this.$style = Me),
        (this.resize = ue),
        (this.selection = ""),
        (this.slottable = !1);
    }
    set $image(t) {
      he.set(this, t);
    }
    get $image() {
      return he.get(this);
    }
    set $sourceImage(t) {
      de.set(this, t);
    }
    get $sourceImage() {
      return de.get(this);
    }
    set $canvas(t) {
      ce.set(this, t);
    }
    get $canvas() {
      return ce.get(this);
    }
    set $selection(t) {
      le.set(this, t);
    }
    get $selection() {
      return le.get(this);
    }
    static get observedAttributes() {
      return super.observedAttributes.concat(["resize", "selection"]);
    }
    connectedCallback() {
      super.connectedCallback();
      let t = null;
      if (
        (this.selection
          ? (t = this.ownerDocument.querySelector(this.selection))
          : (t = this.closest(this.$getTagNameOf(O))),
        j(t))
      ) {
        (this.$selection = t),
          (this.$onSelectionChange = this.$handleSelectionChange.bind(this)),
          C(t, W, this.$onSelectionChange);
        let e = t.closest(this.$getTagNameOf(k));
        if (e) {
          this.$canvas = e;
          let i = e.querySelector(this.$getTagNameOf(M));
          i &&
            ((this.$sourceImage = i),
            (this.$image = i.cloneNode(!0)),
            this.$getShadowRoot().appendChild(this.$image),
            (this.$onSourceImageLoad = this.$handleSourceImageLoad.bind(this)),
            (this.$onSourceImageTransform = this.$handleSourceImageTransform.bind(this)),
            C(i.$image, V, this.$onSourceImageLoad),
            C(i, pt, this.$onSourceImageTransform));
        }
        this.$render();
      }
    }
    disconnectedCallback() {
      let { $selection: t, $sourceImage: e } = this;
      t && this.$onSelectionChange && (b(t, W, this.$onSelectionChange), (this.$onSelectionChange = null)),
        e && this.$onSourceImageLoad && (b(e.$image, V, this.$onSourceImageLoad), (this.$onSourceImageLoad = null)),
        e &&
          this.$onSourceImageTransform &&
          (b(e, pt, this.$onSourceImageTransform), (this.$onSourceImageTransform = null)),
        super.disconnectedCallback();
    }
    $handleSelectionChange(t) {
      this.$render(t.detail);
    }
    $handleSourceImageLoad() {
      let { $image: t, $sourceImage: e } = this,
        i = t.getAttribute("src"),
        s = e.getAttribute("src");
      s &&
        s !== i &&
        (t.setAttribute("src", s),
        t.$ready(() => {
          setTimeout(() => {
            this.$render();
          }, 50);
        }));
    }
    $handleSourceImageTransform(t) {
      this.$render(void 0, t.detail.matrix);
    }
    $render(t, e) {
      let { $canvas: i, $selection: s } = this;
      !t && !s.hidden && (t = s),
        (!t || (t.x === 0 && t.y === 0 && t.width === 0 && t.height === 0)) &&
          (t = { x: 0, y: 0, width: i.offsetWidth, height: i.offsetHeight });
      let { x: n, y: a, width: o, height: h } = t,
        r = {},
        { clientWidth: c, clientHeight: d } = this,
        f = c,
        m = d,
        u = NaN;
      switch (this.resize) {
        case ze:
          (u = 1), (f = o), (m = h), (r.width = o), (r.height = h);
          break;
        case De:
          (u = h > 0 ? d / h : 0), (f = o * u), (r.width = f);
          break;
        case ue:
          (u = o > 0 ? c / o : 0), (m = h * u), (r.height = m);
          break;
        case He:
        default:
          c > 0 ? (u = o > 0 ? c / o : 0) : d > 0 && (u = h > 0 ? d / h : 0);
      }
      (this.$scale = u),
        this.$setStyles(r),
        this.$sourceImage && this.$transformImageByOffset(e != null ? e : this.$sourceImage.$getTransform(), -n, -a);
    }
    $transformImageByOffset(t, e, i) {
      let { $image: s, $scale: n, $sourceImage: a } = this;
      if (a && s && n >= 0) {
        let [o, h, r, c, d, f] = t,
          m = (e * c - r * i) / (o * c - r * h),
          u = (i * o - h * e) / (o * c - r * h),
          w = o * m + r * u + d,
          A = h * m + c * u + f;
        s.$ready(($) => {
          this.$setStyles.call(s, { width: $.naturalWidth * n, height: $.naturalHeight * n });
        }),
          s.$setTransform(o, h, r, c, w * n, A * n);
      }
    }
  };
Q.$name = Zt;
Q.$version = "2.0.0";
var We =
    '<cropper-canvas background><cropper-image rotatable scalable skewable translatable></cropper-image><cropper-shade hidden></cropper-shade><cropper-handle action="select" plain></cropper-handle><cropper-selection initial-coverage="0.5" movable resizable><cropper-grid role="grid" bordered covered></cropper-grid><cropper-crosshair centered></cropper-crosshair><cropper-handle action="move" theme-color="rgba(255, 255, 255, 0.35)"></cropper-handle><cropper-handle action="n-resize"></cropper-handle><cropper-handle action="e-resize"></cropper-handle><cropper-handle action="s-resize"></cropper-handle><cropper-handle action="w-resize"></cropper-handle><cropper-handle action="ne-resize"></cropper-handle><cropper-handle action="nw-resize"></cropper-handle><cropper-handle action="se-resize"></cropper-handle><cropper-handle action="sw-resize"></cropper-handle></cropper-selection></cropper-canvas>',
  Xe = /^img|canvas$/,
  Le = /<(\/?(?:script|style)[^>]*)>/gi,
  pe = { template: We };
B.$define();
J.$define();
K.$define();
q.$define();
F.$define();
G.$define();
Z.$define();
Q.$define();
var ft = class {
  constructor(t, e) {
    if (((this.options = pe), ot(t) && (t = document.querySelector(t)), !j(t) || !Xe.test(t.localName)))
      throw new Error("The first argument is required and must be an <img> or <canvas> element.");
    (this.element = t), (e = Object.assign(Object.assign({}, pe), e)), (this.options = e);
    let { ownerDocument: i } = t,
      { container: s } = e;
    if (s && (ot(s) && (s = i.querySelector(s)), !j(s)))
      throw new Error("The `container` option must be an element or a valid selector.");
    j(s) || (t.parentElement ? (s = t.parentElement) : (s = i.body)), (this.container = s);
    let n = t.localName,
      a = "";
    n === "img" ? ({ src: a } = t) : n === "canvas" && window.HTMLCanvasElement && (a = t.toDataURL());
    let { template: o } = e;
    if (o && ot(o)) {
      let h = document.createElement("template"),
        r = document.createDocumentFragment();
      (h.innerHTML = o.replace(Le, "&lt;$1&gt;")),
        r.appendChild(h.content),
        Array.from(r.querySelectorAll(M)).forEach((c) => {
          c.setAttribute("src", a), c.setAttribute("alt", t.alt || "The image to crop");
        }),
        t.parentElement ? ((t.style.display = "none"), s.insertBefore(r, t.nextSibling)) : s.appendChild(r);
    }
  }
  getCropperCanvas() {
    return this.container.querySelector(k);
  }
  getCropperImage() {
    return this.container.querySelector(M);
  }
  getCropperSelection() {
    return this.container.querySelector(O);
  }
  getCropperSelections() {
    return this.container.querySelectorAll(O);
  }
};
ft.version = "2.0.0";
var mt = class mt {
  static functionality(t, e) {
    let i = e.querySelector(t.container);
    i === void 0 && new $t(`The container "${t.container}" is not available`);
    let s = e.querySelector(t.file);
    if (s == null || s.tagName.toLowerCase() !== "input" || s.getAttribute("type") !== "file") {
      new $t(`The file picker "${t.file}" is either not available or not a file picker`);
      return;
    }
    let n;
    s.addEventListener("change", (a) => {
      if (s.files && s.files.length > 0) {
        let o = s.files[0];
        if (o) {
          i.innerHTML = "";
          let h = document.createElement("img");
          (h.src = window.URL.createObjectURL(o)),
            h.setAttribute(
              "style",
              `width : ${t.maxwidth ? t.maxwidth : 500}px ; height : ${t.maxheight ? t.maxheight : 500}px ;`,
            ),
            h.setAttribute("data-name", "CodBi_Media_Imagecropper_Bild"),
            i.appendChild(h);
          let r =
              t.aspectratio && typeof t.aspectratio == "string" && t.aspectratio.indexOf("/") !== -1
                ? Ye(t.aspectratio)
                : void 0,
            c = h.getBoundingClientRect();
          (t.csscropperhandle = t.csscropperhandle ? t.csscropperhandle : "background-color: darkorange ;"),
            (n = new ft(h, {
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
                    movable ${r ? "" : "resizable zoomable"}>
                    <cropper-grid role = "grid" bordered covered></cropper-grid>
                    <cropper-handle action      = "move"
                                    theme-color = "rgba( 255, 255, 255, 0.35 )"></cropper-handle>
                    ${
                      r
                        ? ""
                        : `
                        <cropper-crosshair centered></cropper-crosshair>
                        <cropper-handle action = "n-resize"   style = "${t.csscropperhandle}"></cropper-handle>
                        <cropper-handle action = "e-resize"   style = "${t.csscropperhandle}"></cropper-handle>
                        <cropper-handle action = "s-resize"   style = "${t.csscropperhandle}"></cropper-handle>
                        <cropper-handle action = "w-resize"   style = "${t.csscropperhandle}"></cropper-handle>
                        <cropper-handle action = "ne-resize"  style = "${t.csscropperhandle}"></cropper-handle>
                        <cropper-handle action = "nw-resize"  style = "${t.csscropperhandle}"></cropper-handle>
                        <cropper-handle action = "se-resize"  style = "${t.csscropperhandle}"></cropper-handle>
                        <cropper-handle action = "sw-resize"  style = "${t.csscropperhandle}"></cropper-handle>`
                    }
                    </cropper-handle></cropper-selection></cropper-canvas>`,
            }));
        }
      }
    });
    for (let a of e.parentElement.querySelectorAll(t.updater))
      a.addEventListener("click", (o) => {
        if (n && t.target && typeof (t.target === "string")) {
          let h = e.parentElement.querySelector(t.target),
            r = n.getCropperSelection();
          if (r) {
            let c = h.getBoundingClientRect();
            console.log(
              r,
              r == null ? void 0 : r.clientHeight,
              r == null ? void 0 : r.clientHeight,
              window.devicePixelRatio,
              "canvas",
            ),
              r.$toCanvas({ width: t.outputwidth ? t.outputwidth : 1e3 }).then((d) => {
                h.setAttribute(
                  "width",
                  (
                    Number.parseInt(d == null ? void 0 : d.getAttribute("width")) * window.devicePixelRatio * 4 || 1
                  ).toString(),
                ),
                  h.setAttribute(
                    "width",
                    (
                      Number.parseInt(d == null ? void 0 : d.getAttribute("height")) * window.devicePixelRatio * 4 || 1
                    ).toString(),
                  );
                let f = d.toDataURL("image/jpeg", 1);
                if (t.imageurl) {
                  let m = e.querySelector(t.imageurl);
                  m && (m.value = f);
                }
                h == null || h.setAttribute("src", f);
              });
          }
        }
      });
  }
};
(mt.registered = window.codbi.registerFunctionality("Media.Image.Cropper", mt.functionality)),
  Xt(
    [
      Lt.ParamvalueProvider,
      lt(0, X.PRE(X.stdExp.cssSelector, "container")),
      lt(0, X.PRE(X.stdExp.cssSelector, "target")),
      lt(0, X.PRE(X.stdExp.cssSelector, "file")),
      lt(0, X.PRE(X.stdExp.cssSelector, "updater")),
    ],
    mt,
    "functionality",
    1,
  );
var fe = mt,
  Ye = (l) => {
    try {
      let t = l.split(/\s*\/\s*/);
      if (t.length !== 2) throw new Error("Input format is incorrect. Expected 'number / number'.");
      let e = Number.parseFloat(t[0]),
        i = Number.parseFloat(t[1]);
      if (Number.isNaN(e) || Number.isNaN(i) || !Number.isFinite(e) || !Number.isFinite(i))
        throw new Error("The numerator or denominator is not a valid number.");
      if (i === 0) throw new Error("Cannot divide by zero.");
      return e / i;
    } catch (t) {
      throw new $t(`Error: ${t.message}`);
    }
  };
export { fe as Media_Image_Cropper };
/*! Bundled license information:

cropperjs/dist/cropper.esm.raw.js:
  (*! Cropper.js v2.0.0 | (c) 2015-present Chen Fengyuan | MIT *)
*/
