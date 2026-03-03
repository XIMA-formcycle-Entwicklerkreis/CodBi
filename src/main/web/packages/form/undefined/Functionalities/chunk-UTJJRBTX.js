var I = Object.create;
var h = Object.defineProperty,
  $ = Object.defineProperties,
  C = Object.getOwnPropertyDescriptor,
  D = Object.getOwnPropertyDescriptors,
  S = Object.getOwnPropertyNames,
  v = Object.getOwnPropertySymbols,
  j = Object.getPrototypeOf,
  w = Object.prototype.hasOwnProperty,
  B = Object.prototype.propertyIsEnumerable;
var P = (i) => {
    throw TypeError(i);
  },
  V = Math.pow,
  m = (i, e, n) => (e in i ? h(i, e, { enumerable: !0, configurable: !0, writable: !0, value: n }) : (i[e] = n)),
  M = (i, e) => {
    for (var n in e || (e = {})) w.call(e, n) && m(i, n, e[n]);
    if (v) for (var n of v(e)) B.call(e, n) && m(i, n, e[n]);
    return i;
  },
  T = (i, e) => $(i, D(e));
var A = ((i) =>
  typeof require != "undefined"
    ? require
    : typeof Proxy != "undefined"
      ? new Proxy(i, { get: (e, n) => (typeof require != "undefined" ? require : e)[n] })
      : i)(function (i) {
  if (typeof require != "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + i + '" is not supported');
});
var W = (i, e) => () => (e || i((e = { exports: {} }).exports, e), e.exports);
var q = (i, e, n, t) => {
  if ((e && typeof e == "object") || typeof e == "function")
    for (let r of S(e))
      !w.call(i, r) && r !== n && h(i, r, { get: () => e[r], enumerable: !(t = C(e, r)) || t.enumerable });
  return i;
};
var X = (i, e, n) => (
  (n = i != null ? I(j(i)) : {}), q(e || !i || !i.__esModule ? h(n, "default", { value: i, enumerable: !0 }) : n, i)
);
var E = (i, e, n, t) => {
    for (var r = t > 1 ? void 0 : t ? C(e, n) : e, o = i.length - 1, u; o >= 0; o--)
      (u = i[o]) && (r = (t ? u(e, n, r) : u(r)) || r);
    return t && r && h(e, n, r), r;
  },
  H = (i, e) => (n, t) => e(n, t, i);
var p = (i, e, n) => m(i, typeof e != "symbol" ? e + "" : e, n),
  b = (i, e, n) => e.has(i) || P("Cannot " + n);
var R = (i, e, n) => (b(i, e, "read from private field"), n ? n.call(i) : e.get(i)),
  F = (i, e, n) =>
    e.has(i) ? P("Cannot add the same private member more than once") : e instanceof WeakSet ? e.add(i) : e.set(i, n),
  x = (i, e, n, t) => (b(i, e, "write to private field"), t ? t.call(i, n) : e.set(i, n), n),
  N = (i, e, n) => (b(i, e, "access private method"), n);
var O = (i, e, n, t) => ({
  set _(r) {
    x(i, e, r, n);
  },
  get _() {
    return R(i, e, t);
  },
});
var G = (i, e, n) =>
  new Promise((t, r) => {
    var o = (c) => {
        try {
          a(n.next(c));
        } catch (l) {
          r(l);
        }
      },
      u = (c) => {
        try {
          a(n.throw(c));
        } catch (l) {
          r(l);
        }
      },
      a = (c) => (c.done ? t(c.value) : Promise.resolve(c.value).then(o, u));
    a((n = n.apply(i, e)).next());
  });
var s = class s {
  constructor(
    e = { throwException: !0, logToConsole: !1 },
    n = { checkPreconditions: !0, checkPostconditions: !0, checkInvariants: !0 },
  ) {
    p(this, "executionSettings", { checkPreconditions: !0, checkPostconditions: !0, checkInvariants: !0 });
    p(this, "warningSettings", { logToConsole: !0 });
    p(this, "infringementSettings", { throwException: !0, logToConsole: !1 });
    (this.infringementSettings = e),
      s.getHost().WaXCode === void 0 && (s.getHost().WaXCode = {}),
      (s.getHost().WaXCode.DBC = this),
      s.dbcCache.set("WaXCode.DBC", this);
  }
  static getHost() {
    return typeof window != "undefined" ? window : globalThis;
  }
  static getDBC(e) {
    let n = e != null ? e : "WaXCode.DBC";
    if (s.dbcCache.has(n)) return s.dbcCache.get(n);
    let t = s.resolveDBCPath(s.getHost(), n);
    return t && s.dbcCache.set(n, t), t;
  }
  static getRequestKey(e, n) {
    var r;
    return `${typeof e == "function" ? e.name : ((r = e.constructor) == null ? void 0 : r.name) || "Unknown"}:${String(n)}`;
  }
  static requestParamValue(e, n, t, r) {
    let o = s.getRequestKey(e, n);
    s.paramValueRequests.has(o)
      ? s.paramValueRequests.get(o).has(t)
        ? s.paramValueRequests.get(o).get(t).push(r)
        : s.paramValueRequests.get(o).set(t, new Array(r))
      : s.paramValueRequests.set(o, new Map([[t, new Array(r)]]));
  }
  static ParamvalueProvider(e, n, t) {
    let r = t.value,
      o = typeof e == "function";
    return (
      (t.value = function (...u) {
        let a = o ? this : this.constructor,
          c = s.getRequestKey(a, n);
        if (s.paramValueRequests.has(c)) {
          for (let l of s.paramValueRequests.get(c).keys())
            if (l < u.length) for (let f of s.paramValueRequests.get(c).get(l)) f(u[l]);
        } else console.warn("No parameter value requests found for key:", c);
        return r.apply(this, u);
      }),
      t
    );
  }
  static decClassInvariant(e, n = void 0, t = "WaXCode.DBC") {
    return (r, o, u) => {
      if (!s.getDBC(t).executionSettings.checkInvariants) return;
      let a = u.set,
        c = u.get,
        l;
      Object.defineProperty(r, o, {
        get() {
          if (!s.getDBC(t).executionSettings.checkInvariants) return;
          let f = n ? s.resolve(this, n) : this;
          for (let g of e) {
            let d = g.check(f);
            typeof d == "string" && s.getDBC(t).reportFieldInfringement(d, r, n, o, f);
          }
          return c[o];
        },
        set(f) {
          if (!s.getDBC(t).executionSettings.checkInvariants) return;
          let g = n ? s.resolve(this, n) : this;
          for (let d of e) {
            let y = d.check(g);
            typeof y == "string" && s.getDBC(t).reportFieldInfringement(y, r, n, o, g);
          }
          l = f;
        },
        enumerable: !0,
        configurable: !0,
      });
    };
  }
  static decInvariant(e, n = void 0, t = void 0, r = void 0) {
    return (o, u) => {
      if (!s.getDBC(t).executionSettings.checkInvariants) return;
      let a;
      Object.defineProperty(o, u, {
        set(c) {
          if (!s.getDBC(t).executionSettings.checkInvariants) return;
          let l = n ? s.resolve(c, n) : c;
          for (let f of e) {
            let g = f.check(l);
            typeof g == "string" && s.getDBC(t).reportFieldInfringement(g, o, n, u, l, r);
          }
          a = c;
        },
        enumerable: !0,
        configurable: !0,
      });
    };
  }
  static decPostcondition(e, n = void 0, t = void 0, r = void 0) {
    return (o, u, a) => {
      let c = a.value;
      return (
        (a.value = (...l) => {
          if (!s.getDBC(n).executionSettings.checkPostconditions) return;
          let f = c.apply(this, l),
            g = t ? s.resolve(f, t) : f,
            d = e(g, o, u);
          return typeof d == "string" && s.getDBC(n).reportReturnvalueInfringement(d, o, t, u, g, r), f;
        }),
        a
      );
    };
  }
  static decPrecondition(e, n = void 0, t = void 0, r = void 0) {
    let o = t ? t.replace(/ /g, "").split("::") : [void 0];
    return (u, a, c) => {
      s.requestParamValue(u, a, c, (l) => {
        if (s.getDBC(n).executionSettings.checkPreconditions)
          for (let f of o) {
            let g = f ? s.resolve(l, f) : l,
              d = e(g, u, a, c);
            typeof d == "string" && s.getDBC(n).reportParameterInfringement(d, u, f, a, c, g, r);
          }
      });
    };
  }
  reportWarning(e) {
    this.warningSettings.logToConsole && console.warn(e);
  }
  reportInfringement(e, n, t, r, o, u = void 0) {
    let a = `[ From "${n}"${typeof t == "function" ? ` in "${t.name}"` : typeof t == "object" && t !== null && typeof t.constructor == "function" ? ` in "${t.constructor.name}"` : `in "${t}"`}${o ? ` > "${o}"` : ""}: ${e} ${u ? `\u2728 ${u} \u2728` : ""}]`;
    if (this.infringementSettings.throwException) throw new s.Infringement(a);
    this.infringementSettings.logToConsole && console.log(a);
  }
  reportParameterInfringement(e, n, t, r, o, u, a = void 0) {
    let c = o + 1;
    this.reportInfringement(
      `[ Parameter-value "${u}" of the ${c}${c === 1 ? "st" : c === 2 ? "nd" : c === 3 ? "rd" : "th"} parameter did not fulfill one of it's contracts: ${e} ]`,
      r,
      n,
      u,
      t,
      a,
    );
  }
  reportFieldInfringement(e, n, t, r, o, u = void 0) {
    this.reportInfringement(
      `[ New value for "${r}"${t === void 0 ? "" : `.${t}`} with value "${o}" did not fulfill one of it's contracts: ${e} ]`,
      r,
      n,
      o,
      t,
    );
  }
  reportReturnvalueInfringement(e, n, t, r, o, u = void 0) {
    this.reportInfringement(`[ Return-value "${o}" did not fulfill one of it's contracts: ${e} ]`, r, n, o, t, u);
  }
  static resolve(e, n) {
    if (!e || typeof n != "string") return;
    let t = s.pathTokenCache.get(n),
      r = t != null ? t : n.replace(/\[(['"]?)(.*?)\1\]/g, ".$2").split(".");
    t || s.pathTokenCache.set(n, r);
    let o = e;
    for (let u of r) {
      if (o === null || typeof o == "undefined") return;
      let a = u.match(/(\w+)\((.*)\)/);
      if (a) {
        let c = a[1],
          f = a[2].split(",").map((g) => g.trim());
        if (typeof o[c] == "function") o = o[c].apply(o, f);
        else return;
      } else o = o[u];
    }
    return o;
  }
};
p(s, "dbcCache", new Map()),
  p(s, "pathTokenCache", new Map()),
  p(s, "paramValueRequests", new Map()),
  p(
    s,
    "Infringement",
    class extends Error {
      constructor(e) {
        super(`[ XDBC Infringement ${e}]`);
      }
    },
  ),
  p(s, "resolveDBCPath", (e, n) => (n == null ? void 0 : n.split(".").reduce((t, r) => t[r], e)));
var k = s;
new k();
export {
  V as a,
  M as b,
  T as c,
  A as d,
  W as e,
  X as f,
  E as g,
  H as h,
  p as i,
  R as j,
  F as k,
  x as l,
  N as m,
  O as n,
  G as o,
  k as p,
};
