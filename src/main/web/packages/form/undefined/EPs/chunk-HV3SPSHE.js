import { a as _ } from "./chunk-WWJ6UWS7.js";
var z = _((S, p) => {
  "use strict";
  var u = Object.defineProperty,
    M = Object.getOwnPropertyDescriptor,
    X = Object.getOwnPropertyNames,
    O = Object.prototype.hasOwnProperty,
    j = (e, t) => {
      for (var o in t) u(e, o, { get: t[o], enumerable: !0 });
    },
    F = (e, t, o, l) => {
      if ((t && typeof t == "object") || typeof t == "function")
        for (let r of X(t))
          !O.call(e, r) && r !== o && u(e, r, { get: () => t[r], enumerable: !(l = M(t, r)) || l.enumerable });
      return e;
    },
    P = (e) => F(u({}, "__esModule", { value: !0 }), e),
    c = {};
  j(c, {
    $: () => N,
    getJQuery: () => d,
    getProjektId: () => E,
    getUrlParameter: () => U,
    getXUtil: () => T,
    getXfcMetaData: () => A,
    getXmFormDynValues: () => b,
    getXmFormDynValuesParsed: () => k,
    getXmFormI18n: () => R,
    getXmFormModel: () => w,
    getXmFormPluginValidationRules: () => I,
    getXmFormValidationRules: () => V,
    getXmValidator: () => D,
    gotoPage: () => x,
    setValidate: () => L,
  });
  p.exports = P(c);
  var y = () => (typeof globalThis == "object" ? globalThis : window),
    h = (e) => y()[e],
    a = (e) => () => y()[e],
    s =
      (e) =>
      (...t) =>
        h(e)(...t),
    g,
    A = a("XFC_METADATA"),
    R = a("XM_FORM_I18N"),
    b = a("XM_FORM_DYNVALUES"),
    V = a("XM_FORM_VRULES"),
    w = a("XM_FORM_MODEL"),
    I = a("XM_FORM_PLUGIN_VRULES"),
    D = a("xm_validator"),
    T = () => d().xutil,
    E = s("getProjektId"),
    U = s("getURLParameter"),
    x = s("gotoPage"),
    L = s("setValidate"),
    d = s("xm_jq");
  function k() {
    var e, t;
    if (g !== void 0) return g;
    let o = { formItems: {}, repetitions: {} },
      l = (e = b()) != null ? e : {};
    for (let r of Object.keys(l != null ? l : {})) {
      let n = l[r];
      if (n !== void 0)
        if (Array.isArray(n)) {
          let i = r.endsWith("_dyn_size") ? r.substring(0, r.length - 9) : r;
          o.repetitions[i] = n;
        } else
          for (let i of Object.keys(n)) {
            let m = n[i],
              f = (t = o.formItems[r]) != null ? t : { size: 0, value: {} };
            if (((o.formItems[r] = f), m !== void 0))
              if (typeof m == "number") f.size = m;
              else {
                let v = i.startsWith("_") ? i.substring(1) : i;
                f.value[v] = m;
              }
          }
    }
    return (g = o), o;
  }
  if (typeof XFC_METADATA != "object")
    throw new Error(
      [
        "fc-form-renderer is not available",
        "This module only contains type declaration files and no implementation.",
        "The declared types are available only within a web form context of the XIMA formcycle application.",
      ].join(`
`),
    );
  var N = d();
});
export { z as a };
