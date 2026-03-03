import { a as Ft } from "./chunk-HI24USOS.js";
import { a as gt } from "./chunk-DCP5OS4S.js";
import "./chunk-7ZUEWSHL.js";
import { a as St } from "./chunk-M2SNI3IN.js";
import "./chunk-4JLAI42Q.js";
import { a as At } from "./chunk-KEJSWGMR.js";
import { a as _ } from "./chunk-SEUS6MHP.js";
import { a as dt } from "./chunk-CDLTIEKC.js";
import { g as Vt, h as z, p as jt } from "./chunk-UTJJRBTX.js";
var ut = typeof window != "undefined" && typeof window.document != "undefined",
  k = ut ? window : {},
  wt = ut ? "ontouchstart" in k.document.documentElement : !1,
  Nt = ut ? "PointerEvent" in k : !1,
  V = "cropper",
  x = `${V}-canvas`,
  qt = `${V}-crosshair`,
  Gt = `${V}-grid`,
  Kt = `${V}-handle`,
  D = `${V}-image`,
  O = `${V}-selection`,
  Jt = `${V}-shade`,
  Qt = `${V}-viewer`,
  et = "select",
  Et = "move",
  Y = "scale",
  pt = "rotate",
  it = "transform",
  H = "none",
  yt = "n-resize",
  Ot = "e-resize",
  Rt = "s-resize",
  It = "w-resize",
  st = "ne-resize",
  nt = "nw-resize",
  rt = "se-resize",
  ot = "sw-resize",
  te = "action",
  be = wt ? "touchend touchcancel" : "mouseup",
  Ce = wt ? "touchmove" : "mousemove",
  Te = wt ? "touchstart" : "mousedown",
  _t = Nt ? "pointerdown" : Te,
  kt = Nt ? "pointermove" : Ce,
  xt = Nt ? "pointerup pointercancel" : be,
  Pt = "error",
  Mt = "keydown",
  j = "load";
var zt = "wheel",
  U = "action",
  W = "actionend",
  ee = "actionmove",
  L = "actionstart",
  X = "change",
  ft = "transform";
function at(l) {
  return typeof l == "string";
}
var Dt = Number.isNaN || k.isNaN;
function p(l) {
  return typeof l == "number" && !Dt(l);
}
function y(l) {
  return p(l) && l > 0 && l < 1 / 0;
}
function ie(l) {
  return typeof l == "undefined";
}
function Ht(l) {
  return typeof l == "object" && l !== null;
}
var { hasOwnProperty: ve } = Object.prototype;
function ct(l) {
  if (!Ht(l)) return !1;
  try {
    let { constructor: t } = l,
      { prototype: e } = t;
    return t && e && ve.call(e, "isPrototypeOf");
  } catch (t) {
    return !1;
  }
}
function ht(l) {
  return typeof l == "function";
}
function F(l) {
  return typeof l == "object" && l !== null && l.nodeType === 1;
}
var Se = /([a-z\d])([A-Z])/g;
function Wt(l) {
  return String(l).replace(Se, "$1-$2").toLowerCase();
}
var Ae = /-[A-z\d]/g;
function Lt(l) {
  return l.replace(Ae, (t) => t.slice(1).toUpperCase());
}
var se = /\s\s*/;
function b(l, t, e, i) {
  t.trim()
    .split(se)
    .forEach((s) => {
      l.removeEventListener(s, e, i);
    });
}
function C(l, t, e, i) {
  t.trim()
    .split(se)
    .forEach((s) => {
      l.addEventListener(s, e, i);
    });
}
function Xt(l, t, e, i) {
  C(l, t, e, Object.assign(Object.assign({}, i), { once: !0 }));
}
var we = { bubbles: !0, cancelable: !0, composed: !0 };
function ne(l, t, e, i) {
  return l.dispatchEvent(new CustomEvent(t, Object.assign(Object.assign(Object.assign({}, we), { detail: e }), i)));
}
var Bt = Promise.resolve();
function re(l, t) {
  return t ? Bt.then(l ? t.bind(l) : t) : Bt;
}
function Yt(l) {
  let { documentElement: t } = l.ownerDocument,
    e = l.getBoundingClientRect();
  return { left: e.left + (k.pageXOffset - t.clientLeft), top: e.top + (k.pageYOffset - t.clientTop) };
}
var Ne = /deg|g?rad|turn$/i;
function bt(l) {
  let t = parseFloat(l) || 0;
  if (t !== 0) {
    let [e = "rad"] = String(l).match(Ne) || [];
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
var Zt = "contain",
  ye = "cover";
function lt(l, t = Zt) {
  let { aspectRatio: e } = l,
    { width: i, height: s } = l,
    n = y(i),
    a = y(s);
  if (n && a) {
    let o = s * e;
    (t === Zt && o > i) || (t === ye && o < i) ? (s = i / e) : (i = s * e);
  } else n ? (s = i / e) : a && (i = s * e);
  return { width: i, height: s };
}
function Ut(l, ...t) {
  if (t.length === 0) return l;
  let [e, i, s, n, a, o] = l,
    [h, r, c, d, f, m] = t[0];
  return (
    (l = [e * h + s * r, i * h + n * r, e * c + s * d, i * c + n * d, e * f + s * m + a, i * f + n * m + o]),
    Ut(l, ...t.slice(1))
  );
}
var Oe = ":host([hidden]){display:none!important}",
  Re = /left|top|width|height/i,
  oe = "open",
  Ct = new WeakMap(),
  Tt = new WeakMap(),
  ae = new Map(),
  ce = k.document && Array.isArray(k.document.adoptedStyleSheets) && "replaceSync" in k.CSSStyleSheet.prototype,
  v = class extends HTMLElement {
    get $sharedStyle() {
      return `${this.themeColor ? `:host{--theme-color: ${this.themeColor};}` : ""}${Oe}`;
    }
    constructor() {
      var t, e;
      super(), (this.shadowRootMode = oe), (this.slottable = !0);
      let i =
        (e = (t = Object.getPrototypeOf(this)) === null || t === void 0 ? void 0 : t.constructor) === null ||
        e === void 0
          ? void 0
          : e.$name;
      i && ae.set(i, this.tagName.toLowerCase());
    }
    static get observedAttributes() {
      return ["shadow-root-mode", "slottable", "theme-color"];
    }
    attributeChangedCallback(t, e, i) {
      if (Object.is(i, e)) return;
      let s = Lt(t),
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
          let o = Tt.get(this),
            h = this.$sharedStyle;
          o && h && (ce ? o.replaceSync(h) : (o.textContent = h));
          break;
        }
      }
    }
    $propertyChangedCallback(t, e, i) {
      if (!Object.is(i, e))
        switch (((t = Wt(t)), typeof i)) {
          case "boolean":
            i === !0 ? this.hasAttribute(t) || this.setAttribute(t, "") : this.removeAttribute(t);
            break;
          case "number":
            Dt(i) ? (i = "") : (i = String(i));
          default:
            i ? this.getAttribute(t) !== i && this.setAttribute(t, i) : this.removeAttribute(t);
        }
    }
    connectedCallback() {
      Object.getPrototypeOf(this).constructor.observedAttributes.forEach((e) => {
        let i = Lt(e),
          s = this[i];
        ie(s) || this.$propertyChangedCallback(i, void 0, s),
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
      let t = this.attachShadow({ mode: this.shadowRootMode || oe });
      if (
        (this.shadowRoot || Ct.set(this, t),
        Tt.set(this, this.$addStyles(this.$sharedStyle)),
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
      Tt.has(this) && Tt.delete(this), Ct.has(this) && Ct.delete(this);
    }
    $getTagNameOf(t) {
      var e;
      return (e = ae.get(t)) !== null && e !== void 0 ? e : t;
    }
    $setStyles(t) {
      return (
        Object.keys(t).forEach((e) => {
          let i = t[e];
          p(i) && (i !== 0 && Re.test(e) ? (i = `${i}px`) : (i = String(i))), (this.style[e] = i);
        }),
        this
      );
    }
    $getShadowRoot() {
      return this.shadowRoot || Ct.get(this);
    }
    $addStyles(t) {
      let e,
        i = this.$getShadowRoot();
      return (
        ce
          ? ((e = new CSSStyleSheet()), e.replaceSync(t), (i.adoptedStyleSheets = i.adoptedStyleSheets.concat(e)))
          : ((e = document.createElement("style")), (e.textContent = t), i.appendChild(e)),
        e
      );
    }
    $emit(t, e, i) {
      return ne(this, t, e, i);
    }
    $nextTick(t) {
      return re(this, t);
    }
    static $define(t, e) {
      Ht(t) && ((e = t), (t = "")),
        t || (t = this.$name || this.name),
        (t = Wt(t)),
        ut && k.customElements && !k.customElements.get(t) && customElements.define(t, this, e);
    }
  };
v.$version = "2.0.0";
var Ie =
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
        (this.$style = Ie),
        (this.$action = H),
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
        ((this.$onPointerDown = this.$handlePointerDown.bind(this)), C(this, _t, this.$onPointerDown)),
        this.$onPointerMove ||
          ((this.$onPointerMove = this.$handlePointerMove.bind(this)), C(this.ownerDocument, kt, this.$onPointerMove)),
        this.$onPointerUp ||
          ((this.$onPointerUp = this.$handlePointerUp.bind(this)), C(this.ownerDocument, xt, this.$onPointerUp)),
        this.$onWheel ||
          ((this.$onWheel = this.$handleWheel.bind(this)), C(this, zt, this.$onWheel, { passive: !1, capture: !0 }));
    }
    $unbind() {
      this.$onPointerDown && (b(this, _t, this.$onPointerDown), (this.$onPointerDown = null)),
        this.$onPointerMove && (b(this.ownerDocument, kt, this.$onPointerMove), (this.$onPointerMove = null)),
        this.$onPointerUp && (b(this.ownerDocument, xt, this.$onPointerUp), (this.$onPointerUp = null)),
        this.$onWheel && (b(this, zt, this.$onWheel, { capture: !0 }), (this.$onWheel = null));
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
      n.size > 1 ? (a = it) : F(t.target) && (a = t.target.action || t.target.getAttribute(te) || ""),
        this.$emit(L, { action: a, relatedEvent: t }) !== !1 &&
          (t.preventDefault(), (this.$action = a), (this.style.willChange = "transform"));
    }
    $handlePointerMove(t) {
      let { $action: e, $pointers: i } = this;
      if (this.disabled || e === H || i.size === 0 || this.$emit(ee, { action: e, relatedEvent: t }) === !1) return;
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
      if (e === it) {
        let n = new Map(i),
          a = 0,
          o = 0,
          h = 0,
          r = 0,
          c = t.pageX,
          d = t.pageY;
        i.forEach((u, w) => {
          n.delete(w),
            n.forEach((S) => {
              let $ = S.startX - u.startX,
                T = S.startY - u.startY,
                g = S.endX - u.endX,
                E = S.endY - u.endY,
                A = 0,
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
                let P = I - R,
                  M = Math.abs(P);
                M > a && ((a = M), (h = P), (c = (u.startX + S.startX) / 2), (d = (u.startY + S.startY) / 2));
              }
              if (
                (($ = Math.abs($)),
                (T = Math.abs(T)),
                (g = Math.abs(g)),
                (E = Math.abs(E)),
                $ > 0 && T > 0 ? (A = Math.sqrt($ * $ + T * T)) : $ > 0 ? (A = $) : T > 0 && (A = T),
                g > 0 && E > 0 ? (N = Math.sqrt(g * g + E * E)) : g > 0 ? (N = g) : E > 0 && (N = E),
                A > 0 && N > 0)
              ) {
                let P = (N - A) / A,
                  M = Math.abs(P);
                M > o && ((o = M), (r = P), (c = (u.startX + S.startX) / 2), (d = (u.startY + S.startY) / 2));
              }
            });
        });
        let f = a > 0,
          m = o > 0;
        f && m
          ? ((s.rotate = h), (s.scale = r), (s.centerX = c), (s.centerY = d))
          : f
            ? ((s.action = pt), (s.rotate = h), (s.centerX = c), (s.centerY = d))
            : m
              ? ((s.action = Y), (s.scale = r), (s.centerX = c), (s.centerY = d))
              : (s.action = H);
      } else {
        let [n] = Array.from(i.values());
        Object.assign(s, n);
      }
      i.forEach((n) => {
        (n.startX = n.endX), (n.startY = n.endY);
      }),
        s.action !== H && this.$emit(U, s, { cancelable: !1 });
    }
    $handlePointerUp(t) {
      let { $action: e, $pointers: i } = this;
      if (!(this.disabled || e === H) && this.$emit(W, { action: e, relatedEvent: t }) !== !1) {
        if ((t.preventDefault(), t.changedTouches))
          Array.from(t.changedTouches).forEach(({ identifier: s }) => {
            i.delete(s);
          });
        else {
          let { pointerId: s = 0 } = t;
          i.delete(s);
        }
        i.size === 0 && ((this.style.willChange = ""), (this.$action = H));
      }
    }
    $handleWheel(t) {
      if (this.disabled || (t.preventDefault(), this.$wheeling)) return;
      (this.$wheeling = !0),
        setTimeout(() => {
          this.$wheeling = !1;
        }, 50);
      let i = (t.deltaY > 0 ? -1 : 1) * this.scaleStep;
      this.$emit(U, { action: Y, scale: i, relatedEvent: t }, { cancelable: !1 });
    }
    $setAction(t) {
      return at(t) && (this.$action = t), this;
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
        ct(t) &&
          (y(t.width) || y(t.height)) &&
          (({ width: n, height: a } = lt({ aspectRatio: n / a, width: t.width, height: t.height })),
          (o = n / this.offsetWidth)),
          (s.width = n),
          (s.height = a);
        let h = this.querySelector(this.$getTagNameOf(D));
        if (!h) {
          e(s);
          return;
        }
        h.$ready()
          .then((r) => {
            let c = s.getContext("2d");
            if (c) {
              let [d, f, m, u, w, S] = h.$getTransform(),
                $ = w,
                T = S,
                g = r.naturalWidth,
                E = r.naturalHeight;
              o !== 1 && (($ *= o), (T *= o), (g *= o), (E *= o));
              let A = g / 2,
                N = E / 2;
              (c.fillStyle = "transparent"),
                c.fillRect(0, 0, n, a),
                ct(t) && ht(t.beforeDraw) && t.beforeDraw.call(this, c, s),
                c.save(),
                c.translate(A, N),
                c.transform(d, f, m, u, $, T),
                c.translate(-A, -N),
                c.drawImage(r, 0, 0, g, E),
                c.restore();
            }
            e(s);
          })
          .catch(i);
      });
    }
  };
B.$name = x;
B.$version = "2.0.0";
var _e =
    ":host{display:inline-block}img{display:block;height:100%;max-height:none!important;max-width:none!important;min-height:0!important;min-width:0!important;width:100%}",
  he = new WeakMap(),
  le = ["alt", "crossorigin", "decoding", "importance", "loading", "referrerpolicy", "sizes", "src", "srcset"],
  Z = class extends v {
    constructor() {
      super(...arguments),
        (this.$matrix = [1, 0, 0, 1, 0, 0]),
        (this.$onLoad = null),
        (this.$onCanvasAction = null),
        (this.$onCanvasActionEnd = null),
        (this.$onCanvasActionStart = null),
        (this.$actionStartTarget = null),
        (this.$style = _e),
        (this.$image = new Image()),
        (this.initialCenterSize = "contain"),
        (this.rotatable = !1),
        (this.scalable = !1),
        (this.skewable = !1),
        (this.slottable = !1),
        (this.translatable = !1);
    }
    set $canvas(t) {
      he.set(this, t);
    }
    get $canvas() {
      return he.get(this);
    }
    static get observedAttributes() {
      return super.observedAttributes.concat(le, [
        "initial-center-size",
        "rotatable",
        "scalable",
        "skewable",
        "translatable",
      ]);
    }
    attributeChangedCallback(t, e, i) {
      Object.is(i, e) || (super.attributeChangedCallback(t, e, i), le.includes(t) && this.$image.setAttribute(t, i));
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
        e = this.closest(this.$getTagNameOf(x));
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
        C(e, L, this.$onCanvasActionStart),
        C(e, W, this.$onCanvasActionEnd),
        C(e, U, this.$onCanvasAction)),
        (this.$onLoad = this.$handleLoad.bind(this)),
        C(t, j, this.$onLoad),
        this.$getShadowRoot().appendChild(t);
    }
    disconnectedCallback() {
      let { $image: t, $canvas: e } = this;
      e &&
        (this.$onCanvasActionStart && (b(e, L, this.$onCanvasActionStart), (this.$onCanvasActionStart = null)),
        this.$onCanvasActionEnd && (b(e, W, this.$onCanvasActionEnd), (this.$onCanvasActionEnd = null)),
        this.$onCanvasAction && (b(e, U, this.$onCanvasAction), (this.$onCanvasAction = null))),
        t && this.$onLoad && (b(t, j, this.$onLoad), (this.$onLoad = null)),
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
          (n === it &&
            (!this.rotatable || !this.scalable) &&
            (this.rotatable ? (n = pt) : this.scalable ? (n = Y) : (n = H)),
          n)
        ) {
          case Et:
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
          case pt:
            if (this.rotatable)
              if (s) {
                let { x: a, y: o } = this.getBoundingClientRect();
                this.$rotate(i.rotate, s.clientX - a, s.clientY - o);
              } else this.$rotate(i.rotate);
            break;
          case Y:
            if (this.scalable)
              if (s) {
                let a = s.target.closest(this.$getTagNameOf(O));
                if (!a || !a.zoomable || (a.zoomable && a.dynamic)) {
                  let { x: o, y: h } = this.getBoundingClientRect();
                  this.$zoom(i.scale, s.clientX - o, s.clientY - h);
                }
              } else this.$zoom(i.scale);
            break;
          case it:
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
                  S = s.clientY - u.y,
                  [$, T, g, E] = this.$matrix,
                  A = u.width / 2,
                  N = u.height / 2,
                  R = w - A,
                  I = S - N,
                  P = (R * E - g * I) / ($ * E - g * T),
                  M = (I * $ - T * R) / ($ * E - g * T);
                this.$transform(c, d, f, m, P * (1 - c) + M * f, M * (1 - m) + P * d);
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
                b(e, Pt, h), s(e);
              },
              h = () => {
                b(e, j, o), n(a);
              };
            Xt(e, j, o), Xt(e, Pt, h);
          }
        });
      return ht(t) && i.then((s) => (t(s), s)), i;
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
        let s = bt(t),
          n = Math.cos(s),
          a = Math.sin(s),
          [o, h, r, c] = [n, a, -a, n];
        if (p(e) && p(i)) {
          let [d, f, m, u] = this.$matrix,
            { width: w, height: S } = this.getBoundingClientRect(),
            $ = w / 2,
            T = S / 2,
            g = e - $,
            E = i - T,
            A = (g * u - m * E) / (d * u - m * f),
            N = (E * d - f * g) / (d * u - m * f);
          this.$transform(o, h, r, c, A * (1 - o) - N * r, N * (1 - c) - A * h);
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
        let i = bt(t),
          s = bt(e);
        this.$transform(1, Math.tan(s), Math.tan(i), 1, 0, 0);
      }
      return this;
    }
    $translate(t, e = t) {
      return this.translatable && p(t) && p(e) && this.$transform(1, 0, 0, 1, t, e), this;
    }
    $transform(t, e, i, s, n, a) {
      return p(t) && p(e) && p(i) && p(s) && p(n) && p(a)
        ? this.$setTransform(Ut(this.$matrix, [t, e, i, s, n, a]))
        : this;
    }
    $setTransform(t, e, i, s, n, a) {
      if (
        (this.rotatable || this.scalable || this.skewable || this.translatable) &&
        (Array.isArray(t) && ([t, e, i, s, n, a] = t), p(t) && p(e) && p(i) && p(s) && p(n) && p(a))
      ) {
        let o = [...this.$matrix],
          h = [t, e, i, s, n, a];
        if (this.$emit(ft, { matrix: h, oldMatrix: o }) === !1) return this;
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
Z.$name = D;
Z.$version = "2.0.0";
var ke =
    ":host{display:block;height:0;left:0;outline:var(--theme-color) solid 1px;position:relative;top:0;width:0}:host([transparent]){outline-color:transparent}",
  de = new WeakMap(),
  q = class extends v {
    constructor() {
      super(...arguments),
        (this.$onCanvasChange = null),
        (this.$onCanvasActionEnd = null),
        (this.$onCanvasActionStart = null),
        (this.$style = ke),
        (this.x = 0),
        (this.y = 0),
        (this.width = 0),
        (this.height = 0),
        (this.slottable = !1),
        (this.themeColor = "rgba(0, 0, 0, 0.65)");
    }
    set $canvas(t) {
      de.set(this, t);
    }
    get $canvas() {
      return de.get(this);
    }
    static get observedAttributes() {
      return super.observedAttributes.concat(["height", "width", "x", "y"]);
    }
    connectedCallback() {
      super.connectedCallback();
      let t = this.closest(this.$getTagNameOf(x));
      if (t) {
        (this.$canvas = t), (this.style.position = "absolute");
        let e = t.querySelector(this.$getTagNameOf(O));
        e &&
          ((this.$onCanvasActionStart = (i) => {
            e.hidden && i.detail.action === et && (this.hidden = !1);
          }),
          (this.$onCanvasActionEnd = (i) => {
            e.hidden && i.detail.action === et && (this.hidden = !0);
          }),
          (this.$onCanvasChange = (i) => {
            let { x: s, y: n, width: a, height: o } = i.detail;
            this.$change(s, n, a, o), (e.hidden || (s === 0 && n === 0 && a === 0 && o === 0)) && (this.hidden = !0);
          }),
          C(t, L, this.$onCanvasActionStart),
          C(t, W, this.$onCanvasActionEnd),
          C(t, X, this.$onCanvasChange));
      }
      this.$render();
    }
    disconnectedCallback() {
      let { $canvas: t } = this;
      t &&
        (this.$onCanvasActionStart && (b(t, L, this.$onCanvasActionStart), (this.$onCanvasActionStart = null)),
        this.$onCanvasActionEnd && (b(t, W, this.$onCanvasActionEnd), (this.$onCanvasActionEnd = null)),
        this.$onCanvasChange && (b(t, X, this.$onCanvasChange), (this.$onCanvasChange = null))),
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
        outlineWidth: k.innerWidth,
      });
    }
  };
q.$name = Jt;
q.$version = "2.0.0";
var xe =
    ':host{background-color:var(--theme-color);display:block}:host([action=move]),:host([action=select]){height:100%;left:0;position:absolute;top:0;width:100%}:host([action=move]){cursor:move}:host([action=select]){cursor:crosshair}:host([action$=-resize]){background-color:transparent;height:15px;position:absolute;width:15px}:host([action$=-resize]):after{background-color:var(--theme-color);content:"";display:block;height:5px;left:50%;position:absolute;top:50%;transform:translate(-50%,-50%);width:5px}:host([action=n-resize]),:host([action=s-resize]){cursor:ns-resize;left:50%;transform:translateX(-50%);width:100%}:host([action=n-resize]){top:-8px}:host([action=s-resize]){bottom:-8px}:host([action=e-resize]),:host([action=w-resize]){cursor:ew-resize;height:100%;top:50%;transform:translateY(-50%)}:host([action=e-resize]){right:-8px}:host([action=w-resize]){left:-8px}:host([action=ne-resize]){cursor:nesw-resize;right:-8px;top:-8px}:host([action=nw-resize]){cursor:nwse-resize;left:-8px;top:-8px}:host([action=se-resize]){bottom:-8px;cursor:nwse-resize;right:-8px}:host([action=se-resize]):after{height:15px;width:15px}@media (pointer:coarse){:host([action=se-resize]):after{height:10px;width:10px}}@media (pointer:fine){:host([action=se-resize]):after{height:5px;width:5px}}:host([action=sw-resize]){bottom:-8px;cursor:nesw-resize;left:-8px}:host([plain]){background-color:transparent}',
  G = class extends v {
    constructor() {
      super(...arguments),
        (this.$onCanvasCropEnd = null),
        (this.$onCanvasCropStart = null),
        (this.$style = xe),
        (this.action = H),
        (this.plain = !1),
        (this.slottable = !1),
        (this.themeColor = "rgba(51, 153, 255, 0.5)");
    }
    static get observedAttributes() {
      return super.observedAttributes.concat(["action", "plain"]);
    }
  };
G.$name = Kt;
G.$version = "2.0.0";
var Pe =
    ':host{display:block;left:0;position:relative;right:0}:host([outlined]){outline:1px solid var(--theme-color)}:host([multiple]){outline:1px dashed hsla(0,0%,100%,.5)}:host([multiple]):after{bottom:0;content:"";cursor:pointer;display:block;left:0;position:absolute;right:0;top:0}:host([multiple][active]){outline-color:var(--theme-color);z-index:1}:host([multiple])>*{visibility:hidden}:host([multiple][active])>*{visibility:visible}:host([multiple][active]):after{display:none}',
  ue = new WeakMap(),
  K = class extends v {
    constructor() {
      super(...arguments),
        (this.$onCanvasAction = null),
        (this.$onCanvasActionStart = null),
        (this.$onCanvasActionEnd = null),
        (this.$onDocumentKeyDown = null),
        (this.$action = ""),
        (this.$actionStartTarget = null),
        (this.$changing = !1),
        (this.$style = Pe),
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
      ue.set(this, t);
    }
    get $canvas() {
      return ue.get(this);
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
                    C(this.ownerDocument, Mt, this.$onDocumentKeyDown))
                  : this.$onDocumentKeyDown &&
                    (b(this.ownerDocument, Mt, this.$onDocumentKeyDown), (this.$onDocumentKeyDown = null)));
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
                    this.$emit(X, { x: this.x, y: this.y, width: this.width, height: this.height }))
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
      let t = this.closest(this.$getTagNameOf(x));
      t
        ? ((this.$canvas = t),
          this.$setStyles({ position: "absolute", transform: `translate(${this.x}px, ${this.y}px)` }),
          this.hidden || this.$render(),
          this.$initSelection(!0),
          (this.$onCanvasActionStart = this.$handleActionStart.bind(this)),
          (this.$onCanvasActionEnd = this.$handleActionEnd.bind(this)),
          (this.$onCanvasAction = this.$handleAction.bind(this)),
          C(t, L, this.$onCanvasActionStart),
          C(t, W, this.$onCanvasActionEnd),
          C(t, U, this.$onCanvasAction))
        : this.$render();
    }
    disconnectedCallback() {
      let { $canvas: t } = this;
      t &&
        (this.$onCanvasActionStart && (b(t, L, this.$onCanvasActionStart), (this.$onCanvasActionStart = null)),
        this.$onCanvasActionEnd && (b(t, W, this.$onCanvasActionEnd), (this.$onCanvasActionEnd = null)),
        this.$onCanvasAction && (b(t, U, this.$onCanvasAction), (this.$onCanvasAction = null))),
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
        y(n) && ({ width: a, height: o } = lt({ aspectRatio: n, width: a, height: o })),
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
            s.$emit(X, { x: s.x, y: s.y, width: s.width, height: s.height }));
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
          this.$emit(X, { x: this.x, y: this.y, width: this.width, height: this.height }));
    }
    $handleAction(t) {
      let { currentTarget: e, detail: i } = t;
      if (!e || !i) return;
      let { relatedEvent: s } = i,
        { action: n } = i;
      if (
        (!n && this.multiple && ((n = this.$action || (s == null ? void 0 : s.target.action)), (this.$action = n)),
        !n || (this.hidden && n !== et) || (this.multiple && !this.active && n !== Y))
      )
        return;
      let a = i.endX - i.startX,
        o = i.endY - i.startY,
        { width: h, height: r } = this,
        { aspectRatio: c } = this;
      switch ((!y(c) && s.shiftKey && (c = y(h) && y(r) ? h / r : 1), n)) {
        case et:
          if (a !== 0 && o !== 0) {
            let { $canvas: d } = this,
              f = Yt(e);
            (this.multiple && !this.hidden ? this.$createSelection() : this).$change(
              i.startX - f.left,
              i.startY - f.top,
              Math.abs(a),
              Math.abs(o),
              c,
            ),
              a < 0 ? (o < 0 ? (n = nt) : o > 0 && (n = ot)) : a > 0 && (o < 0 ? (n = st) : o > 0 && (n = rt)),
              d && (d.$action = n);
          }
          break;
        case Et:
          this.movable &&
            (this.dynamic || (this.$actionStartTarget && this.contains(this.$actionStartTarget))) &&
            this.$move(a, o);
          break;
        case Y:
          if (s && this.zoomable && (this.dynamic || this.contains(s.target))) {
            let d = Yt(e);
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
        case yt:
          (h += i),
            (c -= i),
            c < 0 && ((t = Rt), (c = -c), (h -= c)),
            n && ((e = i * s), (o += e / 2), (r -= e), r < 0 && ((r = -r), (o -= r)));
          break;
        case Ot:
          (r += e),
            r < 0 && ((t = It), (r = -r), (o -= r)),
            n && ((i = e / s), (h -= i / 2), (c += i), c < 0 && ((c = -c), (h -= c)));
          break;
        case Rt:
          (c += i),
            c < 0 && ((t = yt), (c = -c), (h -= c)),
            n && ((e = i * s), (o -= e / 2), (r += e), r < 0 && ((r = -r), (o -= r)));
          break;
        case It:
          (o += e),
            (r -= e),
            r < 0 && ((t = Ot), (r = -r), (o -= r)),
            n && ((i = e / s), (h += i / 2), (c -= i), c < 0 && ((c = -c), (h -= c)));
          break;
        case st:
          n && (i = -e / s),
            (h += i),
            (c -= i),
            (r += e),
            r < 0 && c < 0
              ? ((t = ot), (r = -r), (c = -c), (o -= r), (h -= c))
              : r < 0
                ? ((t = nt), (r = -r), (o -= r))
                : c < 0 && ((t = rt), (c = -c), (h -= c));
          break;
        case nt:
          n && (i = e / s),
            (o += e),
            (h += i),
            (r -= e),
            (c -= i),
            r < 0 && c < 0
              ? ((t = rt), (r = -r), (c = -c), (o -= r), (h -= c))
              : r < 0
                ? ((t = st), (r = -r), (o -= r))
                : c < 0 && ((t = ot), (c = -c), (h -= c));
          break;
        case rt:
          n && (i = e / s),
            (r += e),
            (c += i),
            r < 0 && c < 0
              ? ((t = nt), (r = -r), (c = -c), (o -= r), (h -= c))
              : r < 0
                ? ((t = ot), (r = -r), (o -= r))
                : c < 0 && ((t = st), (c = -c), (h -= c));
          break;
        case ot:
          n && (i = -e / s),
            (o += e),
            (r -= e),
            (c += i),
            r < 0 && c < 0
              ? ((t = st), (r = -r), (c = -c), (o -= r), (h -= c))
              : r < 0
                ? ((t = rt), (r = -r), (o -= r))
                : c < 0 && ((t = nt), (c = -c), (h -= c));
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
        : (y(n) && ({ width: i, height: s } = lt({ aspectRatio: n, width: i, height: s }, "cover")),
          this.precise || ((t = Math.round(t)), (e = Math.round(e)), (i = Math.round(i)), (s = Math.round(s))),
          t === this.x && e === this.y && i === this.width && s === this.height && Object.is(n, this.aspectRatio) && !a
            ? this
            : (this.hidden && (this.hidden = !1),
              this.$emit(X, { x: t, y: e, width: i, height: s }) === !1
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
          (ct(t) &&
            (y(t.width) || y(t.height)) &&
            (({ width: n, height: a } = lt({ aspectRatio: n / a, width: t.width, height: t.height })),
            (o = n / this.width)),
          (s.width = n),
          (s.height = a),
          !this.$canvas)
        ) {
          e(s);
          return;
        }
        let h = this.$canvas.querySelector(this.$getTagNameOf(D));
        if (!h) {
          e(s);
          return;
        }
        h.$ready()
          .then((r) => {
            let c = s.getContext("2d");
            if (c) {
              let [d, f, m, u, w, S] = h.$getTransform(),
                $ = -this.x,
                T = -this.y,
                g = ($ * u - m * T) / (d * u - m * f),
                E = (T * d - f * $) / (d * u - m * f),
                A = d * g + m * E + w,
                N = f * g + u * E + S,
                R = r.naturalWidth,
                I = r.naturalHeight;
              o !== 1 && ((A *= o), (N *= o), (R *= o), (I *= o));
              let P = R / 2,
                M = I / 2;
              (c.fillStyle = "transparent"),
                c.fillRect(0, 0, n, a),
                ct(t) && ht(t.beforeDraw) && t.beforeDraw.call(this, c, s),
                c.save(),
                c.translate(P, M),
                c.transform(d, f, m, u, A, N),
                c.translate(-P, -M),
                c.drawImage(r, 0, 0, R, I),
                c.restore();
            }
            e(s);
          })
          .catch(i);
      });
    }
  };
K.$name = O;
K.$version = "2.0.0";
var Me =
    ":host{display:flex;flex-direction:column;position:relative;touch-action:none;-webkit-user-select:none;-moz-user-select:none;user-select:none}:host([bordered]){border:1px dashed var(--theme-color)}:host([covered]){bottom:0;left:0;position:absolute;right:0;top:0}:host>span{display:flex;flex:1}:host>span+span{border-top:1px dashed var(--theme-color)}:host>span>span{flex:1}:host>span>span+span{border-left:1px dashed var(--theme-color)}",
  J = class extends v {
    constructor() {
      super(...arguments),
        (this.$style = Me),
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
J.$name = Gt;
J.$version = "2.0.0";
var ze =
    ':host{display:inline-block;height:1em;position:relative;touch-action:none;-webkit-user-select:none;-moz-user-select:none;user-select:none;vertical-align:middle;width:1em}:host:after,:host:before{background-color:var(--theme-color);content:"";display:block;position:absolute}:host:before{height:1px;left:0;top:50%;transform:translateY(-50%);width:100%}:host:after{height:100%;left:50%;top:0;transform:translateX(-50%);width:1px}:host([centered]){left:50%;position:absolute;top:50%;transform:translate(-50%,-50%)}',
  Q = class extends v {
    constructor() {
      super(...arguments),
        (this.$style = ze),
        (this.centered = !1),
        (this.slottable = !1),
        (this.themeColor = "rgba(238, 238, 238, 0.5)");
    }
    static get observedAttributes() {
      return super.observedAttributes.concat(["centered"]);
    }
  };
Q.$name = qt;
Q.$version = "2.0.0";
var De = ":host{display:block;height:100%;overflow:hidden;position:relative;width:100%}",
  pe = new WeakMap(),
  fe = new WeakMap(),
  me = new WeakMap(),
  $e = new WeakMap(),
  He = "both",
  We = "horizontal",
  ge = "vertical",
  Le = "none",
  tt = class extends v {
    constructor() {
      super(...arguments),
        (this.$onSelectionChange = null),
        (this.$onSourceImageLoad = null),
        (this.$onSourceImageTransform = null),
        (this.$scale = 1),
        (this.$style = De),
        (this.resize = ge),
        (this.selection = ""),
        (this.slottable = !1);
    }
    set $image(t) {
      fe.set(this, t);
    }
    get $image() {
      return fe.get(this);
    }
    set $sourceImage(t) {
      $e.set(this, t);
    }
    get $sourceImage() {
      return $e.get(this);
    }
    set $canvas(t) {
      pe.set(this, t);
    }
    get $canvas() {
      return pe.get(this);
    }
    set $selection(t) {
      me.set(this, t);
    }
    get $selection() {
      return me.get(this);
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
        F(t))
      ) {
        (this.$selection = t),
          (this.$onSelectionChange = this.$handleSelectionChange.bind(this)),
          C(t, X, this.$onSelectionChange);
        let e = t.closest(this.$getTagNameOf(x));
        if (e) {
          this.$canvas = e;
          let i = e.querySelector(this.$getTagNameOf(D));
          i &&
            ((this.$sourceImage = i),
            (this.$image = i.cloneNode(!0)),
            this.$getShadowRoot().appendChild(this.$image),
            (this.$onSourceImageLoad = this.$handleSourceImageLoad.bind(this)),
            (this.$onSourceImageTransform = this.$handleSourceImageTransform.bind(this)),
            C(i.$image, j, this.$onSourceImageLoad),
            C(i, ft, this.$onSourceImageTransform));
        }
        this.$render();
      }
    }
    disconnectedCallback() {
      let { $selection: t, $sourceImage: e } = this;
      t && this.$onSelectionChange && (b(t, X, this.$onSelectionChange), (this.$onSelectionChange = null)),
        e && this.$onSourceImageLoad && (b(e.$image, j, this.$onSourceImageLoad), (this.$onSourceImageLoad = null)),
        e &&
          this.$onSourceImageTransform &&
          (b(e, ft, this.$onSourceImageTransform), (this.$onSourceImageTransform = null)),
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
        case He:
          (u = 1), (f = o), (m = h), (r.width = o), (r.height = h);
          break;
        case We:
          (u = h > 0 ? d / h : 0), (f = o * u), (r.width = f);
          break;
        case ge:
          (u = o > 0 ? c / o : 0), (m = h * u), (r.height = m);
          break;
        case Le:
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
          S = h * m + c * u + f;
        s.$ready(($) => {
          this.$setStyles.call(s, { width: $.naturalWidth * n, height: $.naturalHeight * n });
        }),
          s.$setTransform(o, h, r, c, w * n, S * n);
      }
    }
  };
tt.$name = Qt;
tt.$version = "2.0.0";
var Xe =
    '<cropper-canvas background><cropper-image rotatable scalable skewable translatable></cropper-image><cropper-shade hidden></cropper-shade><cropper-handle action="select" plain></cropper-handle><cropper-selection initial-coverage="0.5" movable resizable><cropper-grid role="grid" bordered covered></cropper-grid><cropper-crosshair centered></cropper-crosshair><cropper-handle action="move" theme-color="rgba(255, 255, 255, 0.35)"></cropper-handle><cropper-handle action="n-resize"></cropper-handle><cropper-handle action="e-resize"></cropper-handle><cropper-handle action="s-resize"></cropper-handle><cropper-handle action="w-resize"></cropper-handle><cropper-handle action="ne-resize"></cropper-handle><cropper-handle action="nw-resize"></cropper-handle><cropper-handle action="se-resize"></cropper-handle><cropper-handle action="sw-resize"></cropper-handle></cropper-selection></cropper-canvas>',
  Ye = /^img|canvas$/,
  Ue = /<(\/?(?:script|style)[^>]*)>/gi,
  Ee = { template: Xe };
B.$define();
Q.$define();
J.$define();
G.$define();
Z.$define();
K.$define();
q.$define();
tt.$define();
var mt = class {
  constructor(t, e) {
    if (((this.options = Ee), at(t) && (t = document.querySelector(t)), !F(t) || !Ye.test(t.localName)))
      throw new Error("The first argument is required and must be an <img> or <canvas> element.");
    (this.element = t), (e = Object.assign(Object.assign({}, Ee), e)), (this.options = e);
    let { ownerDocument: i } = t,
      { container: s } = e;
    if (s && (at(s) && (s = i.querySelector(s)), !F(s)))
      throw new Error("The `container` option must be an element or a valid selector.");
    F(s) || (t.parentElement ? (s = t.parentElement) : (s = i.body)), (this.container = s);
    let n = t.localName,
      a = "";
    n === "img" ? ({ src: a } = t) : n === "canvas" && window.HTMLCanvasElement && (a = t.toDataURL());
    let { template: o } = e;
    if (o && at(o)) {
      let h = document.createElement("template"),
        r = document.createDocumentFragment();
      (h.innerHTML = o.replace(Ue, "&lt;$1&gt;")),
        r.appendChild(h.content),
        Array.from(r.querySelectorAll(D)).forEach((c) => {
          c.setAttribute("src", a), c.setAttribute("alt", t.alt || "The image to crop");
        }),
        t.parentElement ? ((t.style.display = "none"), s.insertBefore(r, t.nextSibling)) : s.appendChild(r);
    }
  }
  getCropperCanvas() {
    return this.container.querySelector(x);
  }
  getCropperImage() {
    return this.container.querySelector(D);
  }
  getCropperSelection() {
    return this.container.querySelector(O);
  }
  getCropperSelections() {
    return this.container.querySelectorAll(O);
  }
};
mt.version = "2.0.0";
var $t = class $t {
  static functionality(t, e) {
    let i = e.querySelector(t.container);
    i === void 0 && new gt(`The container "${t.container}" is not available`);
    let s = e.querySelector(t.file);
    if (s == null || s.tagName.toLowerCase() !== "input" || s.getAttribute("type") !== "file") {
      new gt(`The file picker "${t.file}" is either not available or not a file picker`);
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
                ? Ve(t.aspectratio)
                : void 0,
            c = h.getBoundingClientRect();
          (t.csscropperhandle = t.csscropperhandle ? t.csscropperhandle : "background-color: darkorange ;"),
            (n = new mt(h, {
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
($t.stdExp = { aspectRatio: /^\d+\s*\/\s*\d+$/ }),
  Vt(
    [
      jt.ParamvalueProvider,
      z(0, dt.PRE("string", "container :: target :: file :: updater :: imageurl :: csscropperhandle")),
      z(0, _.PRE(_.stdExp.cssSelector, "container")),
      z(0, _.PRE(_.stdExp.cssSelector, "target")),
      z(0, _.PRE(_.stdExp.cssSelector, "file")),
      z(0, _.PRE(_.stdExp.cssSelector, "updater")),
      z(0, _.PRE(_.stdExp.cssSelector, "imageurl")),
      z(0, dt.PRE("string | number", "aspectratio :: outputwidth")),
      z(0, St.PRE(new dt("string"), new _($t.stdExp.aspectRatio), "aspectratio")),
      z(0, St.PRE(new dt("string"), new _(/[1-9][1-9][1-9]+/), "outputwidth")),
      z(
        1,
        Ft.PRE(
          [new At(HTMLDivElement), new At(HTMLFieldSetElement)],
          void 0,
          "Is it not a <div> or <fieldset> that is tagged with this functionality?",
        ),
      ),
    ],
    $t,
    "functionality",
    1,
  );
var vt = $t;
window.codbi.registerFunctionality("Media.Image.Cropper", vt.functionality.bind(vt));
var Ve = (l) => {
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
    throw new gt(`Error: ${t.message}`);
  }
};
export { vt as Media_Image_Cropper };
/*! Bundled license information:

cropperjs/dist/cropper.esm.raw.js:
  (*! Cropper.js v2.0.0 | (c) 2015-present Chen Fengyuan | MIT *)
*/
