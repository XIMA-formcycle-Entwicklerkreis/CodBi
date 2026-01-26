import { i as d } from "./chunk-RS4WWU7K.js";
var r = class r {
  constructor(
    o = { throwException: !0, logToConsole: !1 },
    n = { checkPreconditions: !0, checkPostconditions: !0, checkInvariants: !0 },
  ) {
    d(this, "executionSettings", { checkPreconditions: !0, checkPostconditions: !0, checkInvariants: !0 });
    d(this, "warningSettings", { logToConsole: !0 });
    d(this, "infringementSettings", { throwException: !0, logToConsole: !1 });
    (this.infringementSettings = o), window.WaXCode === void 0 && (window.WaXCode = {}), (window.WaXCode.DBC = this);
  }
  static requestParamValue(o, n, e, t) {
    r.paramValueRequests.has(o)
      ? r.paramValueRequests.get(o).has(n)
        ? r.paramValueRequests.get(o).get(n).has(e)
          ? r.paramValueRequests.get(o).get(n).get(e).push(t)
          : r.paramValueRequests.get(o).get(n).set(e, new Array(t))
        : r.paramValueRequests.get(o).set(n, new Map([[e, new Array(t)]]))
      : r.paramValueRequests.set(o, new Map([[n, new Map([[e, new Array(t)]])]]));
  }
  static ParamvalueProvider(o, n, e) {
    let t = e.value;
    return (
      (e.value = function (...i) {
        if (r.paramValueRequests.has(o) && r.paramValueRequests.get(o).has(n)) {
          for (let s of r.paramValueRequests.get(o).get(n).keys())
            if (s < i.length) for (let u of r.paramValueRequests.get(o).get(n).get(s)) u(i[s]);
        }
        return t.apply(this, i);
      }),
      e
    );
  }
  static decClassInvariant(o, n = void 0, e = "WaXCode.DBC") {
    return (t, i, s) => {
      if (!r.resolveDBCPath(window, e).executionSettings.checkInvariants) return;
      let u = s.set,
        l = s.get,
        a;
      Object.defineProperty(t, i, {
        get() {
          if (!r.resolveDBCPath(window, e).executionSettings.checkInvariants) return;
          let c = n ? r.resolve(this, n) : this;
          for (let f of o) {
            let g = f.check(c);
            typeof g == "string" && r.resolveDBCPath(window, e).reportFieldInfringement(g, t, n, i, c);
          }
          return l[i];
        },
        set(c) {
          if (!r.resolveDBCPath(window, e).executionSettings.checkInvariants) return;
          let f = n ? r.resolve(this, n) : this;
          for (let g of o) {
            let b = g.check(f);
            typeof b == "string" && r.resolveDBCPath(window, e).reportFieldInfringement(b, t, n, i, f);
          }
          a = c;
        },
        enumerable: !0,
        configurable: !0,
      });
    };
  }
  static decInvariant(o, n = void 0, e = "WaXCode.DBC") {
    return (t, i) => {
      if (!r.resolveDBCPath(window, e).executionSettings.checkInvariants) return;
      let s;
      Object.defineProperty(t, i, {
        set(u) {
          if (!r.resolveDBCPath(window, e).executionSettings.checkInvariants) return;
          let l = n ? r.resolve(u, n) : u;
          for (let a of o) {
            let c = a.check(l);
            typeof c == "string" && r.resolveDBCPath(window, e).reportFieldInfringement(c, t, n, i, l);
          }
          s = u;
        },
        enumerable: !0,
        configurable: !0,
      });
    };
  }
  static decPostcondition(o, n, e = void 0) {
    return (t, i, s) => {
      let u = s.value;
      return (
        (s.value = (...l) => {
          if (!r.resolveDBCPath(window, n).executionSettings.checkPostconditions) return;
          let a = u.apply(this, l),
            c = e ? r.resolve(a, e) : a,
            f = o(c, t, i);
          return typeof f == "string" && r.resolveDBCPath(window, n).reportReturnvalueInfringement(f, t, e, i, c), a;
        }),
        s
      );
    };
  }
  static decPrecondition(o, n, e = void 0) {
    return (t, i, s) => {
      r.requestParamValue(t, i, s, (u) => {
        if (!r.resolveDBCPath(window, n).executionSettings.checkPreconditions) return;
        let l = e ? r.resolve(u, e) : u,
          a = o(l, t, i, s);
        typeof a == "string" && r.resolveDBCPath(window, n).reportParameterInfringement(a, t, e, i, s, l);
      });
    };
  }
  reportWarning(o) {
    this.warningSettings.logToConsole && console.warn(o);
  }
  reportInfringement(o, n, e, t) {
    let i = `[ From "${n}"${t ? `'s member "${t}"` : ""}${typeof e == "function" ? ` in "${e.name}"` : typeof e == "object" && e !== null && typeof e.constructor == "function" ? ` in "${e.constructor.name}"` : ""}: ${o}]`;
    if (this.infringementSettings.throwException) throw new r.Infringement(i);
    this.infringementSettings.logToConsole && console.log(i);
  }
  reportParameterInfringement(o, n, e, t, i, s) {
    let u = i + 1;
    this.reportInfringement(
      `[ Parameter-value "${s}" of the ${u}${u === 1 ? "st" : u === 2 ? "nd" : u === 3 ? "rd" : "th"} parameter did not fulfill one of it's contracts: ${o}]`,
      t,
      n,
      e,
    );
  }
  reportFieldInfringement(o, n, e, t, i) {
    this.reportInfringement(
      `[ New value for "${t}"${e === void 0 ? "" : `.${e}`} with value "${i}" did not fulfill one of it's contracts: ${o}]`,
      t,
      n,
      e,
    );
  }
  reportReturnvalueInfringement(o, n, e, t, i) {
    this.reportInfringement(`[ Return-value "${i}" did not fulfill one of it's contracts: ${o}]`, t, n, e);
  }
  static resolve(o, n) {
    if (!o || typeof n != "string") return;
    let e = n.replace(/\[(['"]?)(.*?)\1\]/g, ".$2").split("."),
      t = o;
    for (let i of e) {
      if (t === null || typeof t == "undefined") return;
      let s = i.match(/(\w+)\((.*)\)/);
      if (s) {
        let u = s[1],
          a = s[2].split(",").map((c) => c.trim());
        if (typeof t[u] == "function") t = t[u].apply(t, a);
        else return;
      } else t = t[i];
    }
    return t;
  }
};
d(r, "paramValueRequests", new Map()),
  d(
    r,
    "Infringement",
    class extends Error {
      constructor(o) {
        super(`[ XDBC Infringement ${o}]`);
      }
    },
  ),
  d(r, "resolveDBCPath", (o, n) => (n == null ? void 0 : n.split(".").reduce((e, t) => e[t], o)));
var w = r;
new w();
export { w as a };
