import { a as y } from "./chunk-K6ISRTTP.js";
import { a as g } from "./chunk-JL2EL352.js";
import { a as d } from "./chunk-K3A632J4.js";
import { a as H } from "./chunk-W23DHSE2.js";
import { a as w } from "./chunk-MUWAMKOD.js";
import { f as b, g as x, h as m } from "./chunk-RS4WWU7K.js";
var T = b(H(), 1);
var s = class s {
  static functionality(a, r) {
    let l = r.parentElement.parentElement.querySelector(a.maxfield);
    if (l === null) throw new y(`The selector "${a.maxfield}" does not select anything.`);
    let e = (0, T.getJQuery)(),
      p = a.msgmininvalid && typeof a.msgmininvalid == "string" ? a.msgmininvalid : "Minimum value is invalid.",
      v = a.msgmaxinvalid && typeof a.msgmaxinvalid == "string" ? a.msgmaxinvalid : "Maximum value is invalid.",
      f = a.equalitypermitted && typeof a.equalitypermitted == "boolean" ? a.equalitypermitted : !1,
      E = (u) => {
        f
          ? new Date(r.value.split(".").reduce((n, i, t) => i + (t === 0 ? "" : "/") + n)) >=
            new Date(l.value.split(".").reduce((n, i, t) => i + (t === 0 ? "" : "/") + n))
            ? e(r).error(p)
            : (e(r).error(""), e(l).error(""))
          : new Date(r.value.split(".").reduce((n, i, t) => i + (t === 0 ? "" : "/") + n)) >
              new Date(l.value.split(".").reduce((n, i, t) => i + (t === 0 ? "" : "/") + n))
            ? e(r).error(p)
            : (e(r).error(""), e(l).error(""));
      },
      c = (u) => {
        f
          ? new Date(r.value.split(".").reduce((n, i, t) => i + (t === 0 ? "" : "/") + n)) >=
            new Date(l.value.split(".").reduce((n, i, t) => i + (t === 0 ? "" : "/") + n))
            ? e(l).error(v)
            : (e(l).error(""), e(r).error(""))
          : new Date(r.value.split(".").reduce((n, i, t) => i + (t === 0 ? "" : "/") + n)) >
              new Date(l.value.split(".").reduce((n, i, t) => i + (t === 0 ? "" : "/") + n))
            ? e(l).error(v)
            : (e(l).error(""), e(r).error(""));
      },
      o = e(r).datepicker("option", "change"),
      M = e(l).datepicker("option", "change");
    e(r).on("change", (u) => {
      o && o(u), E(u);
    }),
      r.addEventListener("input", E),
      e(l).on("change", (u) => {
        M && M(u), c(u);
      }),
      l.addEventListener("input", c);
  }
};
(s.registered = window.codbi.registerFunctionality("Date.Frame", s.functionality)),
  x(
    [
      w.ParamvalueProvider,
      m(0, d.PRE("string", "maxfield")),
      m(0, g.PRE(g.stdExp.cssSelector, "maxfield")),
      m(0, d.PRE("string", "msgmininvalid")),
      m(0, d.PRE("string", "msgmaxinvalid")),
    ],
    s,
    "functionality",
    1,
  );
var I = s;
export { I as Date_Frame };
