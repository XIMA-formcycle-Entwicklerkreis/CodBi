var y = Object.create;
var h = Object.defineProperty;
var k = Object.getOwnPropertyDescriptor;
var v = Object.getOwnPropertyNames;
var C = Object.getPrototypeOf,
  w = Object.prototype.hasOwnProperty;
var P = (c, e, n) => (e in c ? h(c, e, { enumerable: !0, configurable: !0, writable: !0, value: n }) : (c[e] = n));
var $ = (c, e) => () => (e || c((e = { exports: {} }).exports, e), e.exports);
var I = (c, e, n, t) => {
  if ((e && typeof e == "object") || typeof e == "function")
    for (let i of v(e))
      !w.call(c, i) && i !== n && h(c, i, { get: () => e[i], enumerable: !(t = k(e, i)) || t.enumerable });
  return c;
};
var D = (c, e, n) => (
  (n = c != null ? y(C(c)) : {}), I(e || !c || !c.__esModule ? h(n, "default", { value: c, enumerable: !0 }) : n, c)
);
var S = (c, e, n, t) => {
    for (var i = t > 1 ? void 0 : t ? k(e, n) : e, r = c.length - 1, s; r >= 0; r--)
      (s = c[r]) && (i = (t ? s(e, n, i) : s(i)) || i);
    return t && i && h(e, n, i), i;
  },
  j = (c, e) => (n, t) => e(n, t, c);
var p = (c, e, n) => P(c, typeof e != "symbol" ? e + "" : e, n);
var B = (c, e, n) =>
  new Promise((t, i) => {
    var r = (u) => {
        try {
          a(n.next(u));
        } catch (l) {
          i(l);
        }
      },
      s = (u) => {
        try {
          a(n.throw(u));
        } catch (l) {
          i(l);
        }
      },
      a = (u) => (u.done ? t(u.value) : Promise.resolve(u.value).then(r, s));
    a((n = n.apply(c, e)).next());
  });
var o = class o {
  constructor(
    e = { throwException: !0, logToConsole: !1 },
    n = { checkPreconditions: !0, checkPostconditions: !0, checkInvariants: !0 },
  ) {
    p(this, "executionSettings", { checkPreconditions: !0, checkPostconditions: !0, checkInvariants: !0 });
    p(this, "warningSettings", { logToConsole: !0 });
    p(this, "infringementSettings", { throwException: !0, logToConsole: !1 });
    (this.infringementSettings = e),
      o.getHost().WaXCode === void 0 && (o.getHost().WaXCode = {}),
      (o.getHost().WaXCode.DBC = this),
      o.dbcCache.set("WaXCode.DBC", this);
  }
  static getHost() {
    return typeof window != "undefined" ? window : globalThis;
  }
  static getDBC(e) {
    let n = e != null ? e : "WaXCode.DBC";
    if (o.dbcCache.has(n)) return o.dbcCache.get(n);
    let t = o.resolveDBCPath(o.getHost(), n);
    return t && o.dbcCache.set(n, t), t;
  }
  static getRequestKey(e, n) {
    var i;
    return `${typeof e == "function" ? e.name : ((i = e.constructor) == null ? void 0 : i.name) || "Unknown"}:${String(n)}`;
  }
  static requestParamValue(e, n, t, i) {
    let r = o.getRequestKey(e, n);
    o.paramValueRequests.has(r)
      ? o.paramValueRequests.get(r).has(t)
        ? o.paramValueRequests.get(r).get(t).push(i)
        : o.paramValueRequests.get(r).set(t, new Array(i))
      : o.paramValueRequests.set(r, new Map([[t, new Array(i)]]));
  }
  static ParamvalueProvider(e, n, t) {
    let i = t.value,
      r = typeof e == "function";
    return (
      (t.value = function (...s) {
        let a = r ? this : this.constructor,
          u = o.getRequestKey(a, n);
        if (o.paramValueRequests.has(u)) {
          for (let l of o.paramValueRequests.get(u).keys())
            if (l < s.length) for (let f of o.paramValueRequests.get(u).get(l)) f(s[l]);
        } else console.warn("No parameter value requests found for key:", u);
        return i.apply(this, s);
      }),
      t
    );
  }
  static decClassInvariant(e, n = void 0, t = "WaXCode.DBC") {
    return (i, r, s) => {
      if (!o.getDBC(t).executionSettings.checkInvariants) return;
      let a = s.set,
        u = s.get,
        l;
      Object.defineProperty(i, r, {
        get() {
          if (!o.getDBC(t).executionSettings.checkInvariants) return;
          let f = n ? o.resolve(this, n) : this;
          for (let g of e) {
            let d = g.check(f);
            typeof d == "string" && o.getDBC(t).reportFieldInfringement(d, i, n, r, f);
          }
          return u[r];
        },
        set(f) {
          if (!o.getDBC(t).executionSettings.checkInvariants) return;
          let g = n ? o.resolve(this, n) : this;
          for (let d of e) {
            let b = d.check(g);
            typeof b == "string" && o.getDBC(t).reportFieldInfringement(b, i, n, r, g);
          }
          l = f;
        },
        enumerable: !0,
        configurable: !0,
      });
    };
  }
  static decInvariant(e, n = void 0, t = void 0, i = void 0) {
    return (r, s) => {
      if (!o.getDBC(t).executionSettings.checkInvariants) return;
      let a;
      Object.defineProperty(r, s, {
        set(u) {
          if (!o.getDBC(t).executionSettings.checkInvariants) return;
          let l = n ? o.resolve(u, n) : u;
          for (let f of e) {
            let g = f.check(l);
            typeof g == "string" && o.getDBC(t).reportFieldInfringement(g, r, n, s, l, i);
          }
          a = u;
        },
        enumerable: !0,
        configurable: !0,
      });
    };
  }
  static decPostcondition(e, n = void 0, t = void 0, i = void 0) {
    return (r, s, a) => {
      let u = a.value;
      return (
        (a.value = (...l) => {
          if (!o.getDBC(n).executionSettings.checkPostconditions) return;
          let f = u.apply(this, l),
            g = t ? o.resolve(f, t) : f,
            d = e(g, r, s);
          return typeof d == "string" && o.getDBC(n).reportReturnvalueInfringement(d, r, t, s, g, i), f;
        }),
        a
      );
    };
  }
  static decPrecondition(e, n = void 0, t = void 0, i = void 0) {
    let r = t ? t.replace(/ /g, "").split("::") : [void 0];
    return (s, a, u) => {
      o.requestParamValue(s, a, u, (l) => {
        if (o.getDBC(n).executionSettings.checkPreconditions)
          for (let f of r) {
            let g = f ? o.resolve(l, f) : l,
              d = e(g, s, a, u);
            typeof d == "string" && o.getDBC(n).reportParameterInfringement(d, s, f, a, u, g, i);
          }
      });
    };
  }
  reportWarning(e) {
    this.warningSettings.logToConsole && console.warn(e);
  }
  reportInfringement(e, n, t, i, r, s = void 0) {
    let a = `[ From "${n}"${typeof t == "function" ? ` in "${t.name}"` : typeof t == "object" && t !== null && typeof t.constructor == "function" ? ` in "${t.constructor.name}"` : `in "${t}"`}${r ? ` > "${r}"` : ""}: ${e} ${s ? `\u2728 ${s} \u2728` : ""}]`;
    if (this.infringementSettings.throwException) throw new o.Infringement(a);
    this.infringementSettings.logToConsole && console.log(a);
  }
  reportParameterInfringement(e, n, t, i, r, s, a = void 0) {
    let u = r + 1;
    this.reportInfringement(
      `[ Parameter-value "${s}" of the ${u}${u === 1 ? "st" : u === 2 ? "nd" : u === 3 ? "rd" : "th"} parameter did not fulfill one of it's contracts: ${e} ]`,
      i,
      n,
      s,
      t,
      a,
    );
  }
  reportFieldInfringement(e, n, t, i, r, s = void 0) {
    this.reportInfringement(
      `[ New value for "${i}"${t === void 0 ? "" : `.${t}`} with value "${r}" did not fulfill one of it's contracts: ${e} ]`,
      i,
      n,
      r,
      t,
    );
  }
  reportReturnvalueInfringement(e, n, t, i, r, s = void 0) {
    this.reportInfringement(`[ Return-value "${r}" did not fulfill one of it's contracts: ${e} ]`, i, n, r, t, s);
  }
  static resolve(e, n) {
    if (!e || typeof n != "string") return;
    let t = o.pathTokenCache.get(n),
      i = t != null ? t : n.replace(/\[(['"]?)(.*?)\1\]/g, ".$2").split(".");
    t || o.pathTokenCache.set(n, i);
    let r = e;
    for (let s of i) {
      if (r === null || typeof r == "undefined") return;
      let a = s.match(/(\w+)\((.*)\)/);
      if (a) {
        let u = a[1],
          f = a[2].split(",").map((g) => g.trim());
        if (typeof r[u] == "function") r = r[u].apply(r, f);
        else return;
      } else r = r[s];
    }
    return r;
  }
};
p(o, "dbcCache", new Map()),
  p(o, "pathTokenCache", new Map()),
  p(o, "paramValueRequests", new Map()),
  p(
    o,
    "Infringement",
    class extends Error {
      constructor(e) {
        super(`[ XDBC Infringement ${e}]`);
      }
    },
  ),
  p(o, "resolveDBCPath", (e, n) => (n == null ? void 0 : n.split(".").reduce((t, i) => t[i], e)));
var m = o;
new m();
export { $ as a, D as b, S as c, j as d, p as e, B as f, m as g };
