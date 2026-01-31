var i = class i {
  static getRequestKey(o, n) {
    var t;
    return `${typeof o == "function" ? o.name : ((t = o.constructor) == null ? void 0 : t.name) || "Unknown"}:${String(n)}`;
  }
  static requestParamValue(o, n, e, t) {
    let s = i.getRequestKey(o, n);
    i.paramValueRequests.has(s)
      ? i.paramValueRequests.get(s).has(e)
        ? i.paramValueRequests.get(s).get(e).push(t)
        : i.paramValueRequests.get(s).set(e, new Array(t))
      : i.paramValueRequests.set(s, new Map([[e, new Array(t)]]));
  }
  static ParamvalueProvider(o, n, e) {
    let t = e.value,
      s = typeof o == "function";
    e.value = function (...r) {
      console.log(
        "ParamvalueProvider2 invoked for",
        n,
        "with args:",
        r,
        "this:",
        this,
        "this is function?:",
        typeof this == "function",
      );
      let c = s ? this : this.constructor,
        l = i.getRequestKey(c, n);
      if (i.paramValueRequests.has(l)) {
        for (let a of i.paramValueRequests.get(l).keys())
          if (a < r.length) for (let u of i.paramValueRequests.get(l).get(a)) u(r[a]);
      } else console.warn("No parameter value requests found for key:", l);
      return t.apply(this, r);
    };
  }
  static decClassInvariant(o, n = void 0, e = "WaXCode.DBC") {
    return (t, s, r) => {
      if (!i.resolveDBCPath(window, e).executionSettings.checkInvariants) return;
      let c = r.set,
        l = r.get,
        a;
      Object.defineProperty(t, s, {
        get() {
          if (!i.resolveDBCPath(window, e).executionSettings.checkInvariants) return;
          let u = n ? i.resolve(this, n) : this;
          for (let f of o) {
            let d = f.check(u);
            typeof d == "string" && i.resolveDBCPath(window, e).reportFieldInfringement(d, t, n, s, u);
          }
          return l[s];
        },
        set(u) {
          if (!i.resolveDBCPath(window, e).executionSettings.checkInvariants) return;
          let f = n ? i.resolve(this, n) : this;
          for (let d of o) {
            let h = d.check(f);
            typeof h == "string" && i.resolveDBCPath(window, e).reportFieldInfringement(h, t, n, s, f);
          }
          a = u;
        },
        enumerable: !0,
        configurable: !0,
      });
    };
  }
  static decInvariant(o, n = void 0, e = "WaXCode.DBC") {
    return (t, s) => {
      if (!i.resolveDBCPath(window, e).executionSettings.checkInvariants) return;
      let r;
      Object.defineProperty(t, s, {
        set(c) {
          if (!i.resolveDBCPath(window, e).executionSettings.checkInvariants) return;
          let l = n ? i.resolve(c, n) : c;
          for (let a of o) {
            let u = a.check(l);
            typeof u == "string" && i.resolveDBCPath(window, e).reportFieldInfringement(u, t, n, s, l);
          }
          r = c;
        },
        enumerable: !0,
        configurable: !0,
      });
    };
  }
  static decPostcondition(o, n, e = void 0) {
    return (t, s, r) => {
      let c = r.value;
      return (
        (r.value = (...l) => {
          if (!i.resolveDBCPath(window, n).executionSettings.checkPostconditions) {
            console.log("Postcondition checks are disabled.");
            return;
          }
          let a = c.apply(this, l),
            u = e ? i.resolve(a, e) : a,
            f = o(u, t, s);
          return typeof f == "string" && i.resolveDBCPath(window, n).reportReturnvalueInfringement(f, t, e, s, u), a;
        }),
        r
      );
    };
  }
  static decPrecondition(o, n, e = void 0) {
    return (t, s, r) => {
      i.requestParamValue(t, s, r, (c) => {
        if (!i.resolveDBCPath(window, n).executionSettings.checkPreconditions) {
          console.log("Precondition checks are disabled.");
          return;
        }
        let l = e ? e.split("::") : [void 0];
        for (let a of l) {
          let u = a ? i.resolve(c, a) : c,
            f = o(u, t, s, r);
          typeof f == "string" && i.resolveDBCPath(window, n).reportParameterInfringement(f, t, a, s, r, u);
        }
      });
    };
  }
  reportWarning(o) {
    this.warningSettings.logToConsole && console.warn(o);
  }
  reportInfringement(o, n, e, t) {
    let s = `[ From "${n}"${t ? `'s member "${t}"` : ""}${typeof e == "function" ? ` in "${e.name}"` : typeof e == "object" && e !== null && typeof e.constructor == "function" ? ` in "${e.constructor.name}"` : ""}: ${o}]`;
    if (this.infringementSettings.throwException) throw new i.Infringement(s);
    this.infringementSettings.logToConsole && console.log(s);
  }
  reportParameterInfringement(o, n, e, t, s, r) {
    let c = s + 1;
    this.reportInfringement(
      `[ Parameter-value "${r}" of the ${c}${c === 1 ? "st" : c === 2 ? "nd" : c === 3 ? "rd" : "th"} parameter did not fulfill one of it's contracts: ${o}]`,
      t,
      n,
      e,
    );
  }
  reportFieldInfringement(o, n, e, t, s) {
    this.reportInfringement(
      `[ New value for "${t}"${e === void 0 ? "" : `.${e}`} with value "${s}" did not fulfill one of it's contracts: ${o}]`,
      t,
      n,
      e,
    );
  }
  reportReturnvalueInfringement(o, n, e, t, s) {
    this.reportInfringement(`[ Return-value "${s}" did not fulfill one of it's contracts: ${o}]`, t, n, e);
  }
  constructor(
    o = { throwException: !0, logToConsole: !1 },
    n = { checkPreconditions: !0, checkPostconditions: !0, checkInvariants: !0 },
  ) {
    (this.executionSettings = { checkPreconditions: !0, checkPostconditions: !0, checkInvariants: !0 }),
      (this.warningSettings = { logToConsole: !0 }),
      (this.infringementSettings = { throwException: !0, logToConsole: !1 }),
      (this.infringementSettings = o),
      window.WaXCode === void 0 && (window.WaXCode = {}),
      (window.WaXCode.DBC = this);
  }
  static resolve(o, n) {
    if (!o || typeof n != "string") return;
    let e = n.replace(/\[(['"]?)(.*?)\1\]/g, ".$2").split("."),
      t = o;
    for (let s of e) {
      if (t === null || typeof t == "undefined") return;
      let r = s.match(/(\w+)\((.*)\)/);
      if (r) {
        let c = r[1],
          a = r[2].split(",").map((u) => u.trim());
        if (typeof t[c] == "function") t = t[c].apply(t, a);
        else return;
      } else t = t[s];
    }
    return t;
  }
};
(i.paramValueRequests = new Map()),
  (i.Infringement = class extends Error {
    constructor(o) {
      super(`[ XDBC Infringement ${o}]`);
    }
  }),
  (i.resolveDBCPath = (o, n) => (n == null ? void 0 : n.split(".").reduce((e, t) => e[t], o)));
var g = i;
new g();
export { g as a };
