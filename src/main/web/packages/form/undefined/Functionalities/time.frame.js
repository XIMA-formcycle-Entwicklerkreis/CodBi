import { a as I } from "./chunk-K6ISRTTP.js";
import { a as r } from "./chunk-JL2EL352.js";
import { a as g } from "./chunk-W23DHSE2.js";
import { a as v } from "./chunk-MUWAMKOD.js";
import { f as N, g as p, h as s } from "./chunk-RS4WWU7K.js";
var E = N(g(), 1);
var l = class l {
  static functionality(t, e) {
    let n = e.parentElement.parentElement.querySelector(t.maxfield);
    if (t.maxfield === "undefined" || typeof t.maxfield != "string" || n === null)
      throw new I(`No maximum field was specified or the selector (${t.maximumField}) is invalid.`);
    let i = (0, E.getJQuery)(),
      a = t.msgmininvalid && typeof t.msgmininvalid == "string" ? t.msgmininvalid : "Minimum value is invalid.",
      m = t.msgmaxinvalid && typeof t.msgmaxinvalid == "string" ? t.msgmaxinvalid : "Maximum value is invalid.",
      u = t.equalitypermitted && typeof t.equalitypermitted == "boolean" ? t.equalitypermitted : !1,
      f = (b) => {
        u
          ? Number.parseInt(e.value.split(":")[0]) * 60 + Number.parseInt(e.value.split(":")[1]) >
            Number.parseInt(n.value.split(":")[0]) * 60 + Number.parseInt(n.value.split(":")[1])
            ? i(e).error(a)
            : (i(e).error(""), i(n).error(""))
          : Number.parseInt(e.value.split(":")[0]) * 60 + Number.parseInt(e.value.split(":")[1]) >=
              Number.parseInt(n.value.split(":")[0]) * 60 + Number.parseInt(n.value.split(":")[1])
            ? i(e).error(a)
            : (i(e).error(""), i(n).error(""));
      },
      M = (b) => {
        u
          ? Number.parseInt(e.value.split(":")[0]) * 60 + Number.parseInt(e.value.split(":")[1]) >
            Number.parseInt(n.value.split(":")[0]) * 60 + Number.parseInt(n.value.split(":")[1])
            ? i(n).error(m)
            : (i(n).error(""), i(e).error(""))
          : Number.parseInt(e.value.split(":")[0]) * 60 + Number.parseInt(e.value.split(":")[1]) >=
              Number.parseInt(n.value.split(":")[0]) * 60 + Number.parseInt(n.value.split(":")[1])
            ? i(n).error(m)
            : (i(n).error(""), i(e).error(""));
      };
    e.addEventListener("input", f), n.addEventListener("input", M);
  }
};
(l.registered = window.codbi.registerFunctionality("Time.Frame", l.functionality)),
  p([v.ParamvalueProvider, s(0, r.PRE(r.stdExp.cssSelector, "maxfield"))], l, "functionality", 1);
var d = l;
export { d as Time_Frame };
