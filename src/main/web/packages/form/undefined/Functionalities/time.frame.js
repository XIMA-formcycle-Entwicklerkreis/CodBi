import { a as M } from "./chunk-DCP5OS4S.js";
import { a as g } from "./chunk-7ZUEWSHL.js";
import { a as f } from "./chunk-PSEWTT4Z.js";
import { a as I } from "./chunk-M2SNI3IN.js";
import { a as H } from "./chunk-4JLAI42Q.js";
import { a as d } from "./chunk-KEJSWGMR.js";
import { a as m } from "./chunk-SEUS6MHP.js";
import { a } from "./chunk-CDLTIEKC.js";
import { f as y, g as E, h as l, p as v } from "./chunk-UTJJRBTX.js";
var b = y(H(), 1);
var r = class {
  static functionality(t, e) {
    let n = e.parentElement.parentElement.querySelector(t.maxfield);
    if (t.maxfield === "undefined" || typeof t.maxfield != "string" || n === null)
      throw new M(`No maximum field was specified or the selector (${t.maximumField}) is invalid.`);
    let i = (0, b.getJQuery)(),
      u = t.msgmininvalid && typeof t.msgmininvalid == "string" ? t.msgmininvalid : "Minimum value is invalid.",
      p = t.msgmaxinvalid && typeof t.msgmaxinvalid == "string" ? t.msgmaxinvalid : "Maximum value is invalid.",
      s = t.equalitypermitted && typeof t.equalitypermitted == "boolean" ? t.equalitypermitted : !1,
      N = (x) => {
        s
          ? Number.parseInt(e.value.split(":")[0]) * 60 + Number.parseInt(e.value.split(":")[1]) >
            Number.parseInt(n.value.split(":")[0]) * 60 + Number.parseInt(n.value.split(":")[1])
            ? i(e).error(u)
            : (i(e).error(""), i(n).error(""))
          : Number.parseInt(e.value.split(":")[0]) * 60 + Number.parseInt(e.value.split(":")[1]) >=
              Number.parseInt(n.value.split(":")[0]) * 60 + Number.parseInt(n.value.split(":")[1])
            ? i(e).error(u)
            : (i(e).error(""), i(n).error(""));
      },
      T = (x) => {
        s
          ? Number.parseInt(e.value.split(":")[0]) * 60 + Number.parseInt(e.value.split(":")[1]) >
            Number.parseInt(n.value.split(":")[0]) * 60 + Number.parseInt(n.value.split(":")[1])
            ? i(n).error(p)
            : (i(n).error(""), i(e).error(""))
          : Number.parseInt(e.value.split(":")[0]) * 60 + Number.parseInt(e.value.split(":")[1]) >=
              Number.parseInt(n.value.split(":")[0]) * 60 + Number.parseInt(n.value.split(":")[1])
            ? i(n).error(p)
            : (i(n).error(""), i(e).error(""));
      };
    e.addEventListener("input", N), n.addEventListener("input", T);
  }
};
E(
  [
    v.ParamvalueProvider,
    l(0, g.PRE("maxfield")),
    l(0, a.PRE("string", "maxfield :: msgmininvalid :: msgmaxinvalid")),
    l(0, m.PRE(m.stdExp.cssSelector, "maxfield")),
    l(0, I.PRE(new a("string"), new m(/^(TRUE|FALSE)$/i), "equalitypermitted")),
    l(1, d.PRE(HTMLInputElement, "Is it not an <input> that is tagged with this functionality?")),
    l(1, f.PRE("text", !1, "type", 'Is it not an <input type = "time"> that is tagged with this functionality?')),
  ],
  r,
  "functionality",
  1,
);
window.codbi.registerFunctionality("Time.Frame", r.functionality.bind(r));
export { r as Time_Frame };
