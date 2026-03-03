import { a as o } from "./chunk-DCP5OS4S.js";
import "./chunk-7ZUEWSHL.js";
import { a as M } from "./chunk-PSEWTT4Z.js";
import { a as g } from "./chunk-M2SNI3IN.js";
import { a as T } from "./chunk-4JLAI42Q.js";
import { a as v } from "./chunk-KEJSWGMR.js";
import { a as s } from "./chunk-SEUS6MHP.js";
import { a as d } from "./chunk-CDLTIEKC.js";
import { f as h, g as x, h as u, p as y } from "./chunk-UTJJRBTX.js";
var I = h(T(), 1);
var p = class {
  static functionality(e, l) {
    let a = v.tsCheck(
      l.parentElement.parentElement.querySelector(e.maxfield),
      HTMLInputElement,
      "Is the CSS-Selector in the MaxField-Parameter not selecting an <input/> element?",
    );
    if (a === null) throw new o(`The selector "${e.maxfield}" does not select anything.`);
    let n = (0, I.getJQuery)();
    (e.msgmininvalid = e.msgmininvalid ? e.msgmininvalid : "Minimum value is invalid."),
      (e.msgmaxinvalid = e.msgmaxinvalid ? e.msgmaxinvalid : "Maximum value is invalid."),
      (e.equalitypermitted = e.equalitypermitted
        ? typeof e.equalitypermitted == "boolean"
          ? e.equalitypermitted
          : e.equalitypermitted.toLowerCase() === "true"
        : !1);
    let f = (m) => {
        e.equalitypermitted
          ? new Date(l.value.split(".").reduce((i, t, r) => t + (r === 0 ? "" : "/") + i)) >=
            new Date(a.value.split(".").reduce((i, t, r) => t + (r === 0 ? "" : "/") + i))
            ? n(l).error(e.msgmininvalid)
            : (n(l).error(""), n(a).error(""))
          : new Date(l.value.split(".").reduce((i, t, r) => t + (r === 0 ? "" : "/") + i)) >
              new Date(a.value.split(".").reduce((i, t, r) => t + (r === 0 ? "" : "/") + i))
            ? n(l).error(e.msgmininvalid)
            : (n(l).error(""), n(a).error(""));
      },
      E = (m) => {
        e.equalitypermitted
          ? new Date(l.value.split(".").reduce((i, t, r) => t + (r === 0 ? "" : "/") + i)) >=
            new Date(a.value.split(".").reduce((i, t, r) => t + (r === 0 ? "" : "/") + i))
            ? n(a).error(e.msgmaxinvalid)
            : (n(a).error(""), n(l).error(""))
          : new Date(l.value.split(".").reduce((i, t, r) => t + (r === 0 ? "" : "/") + i)) >
              new Date(a.value.split(".").reduce((i, t, r) => t + (r === 0 ? "" : "/") + i))
            ? n(a).error(e.msgmaxinvalid)
            : (n(a).error(""), n(l).error(""));
      },
      c = n(l).datepicker("option", "change"),
      w = n(a).datepicker("option", "change");
    n(l).on("change", (m) => {
      c && c(m), f(m);
    }),
      l.addEventListener("input", f),
      n(a).on("change", (m) => {
        w && w(m), E(m);
      }),
      a.addEventListener("input", E);
  }
};
x(
  [
    y.ParamvalueProvider,
    u(0, d.PRE("string", "maxfield :: msgmininvalid :: msgmaxinvalid")),
    u(0, s.PRE(s.stdExp.cssSelector, "maxfield", "Does the MaXField-Parameter not contain a valid CSS-Selector?")),
    u(0, g.PRE(new d("string"), new s(s.stdExp.boolean), "equalitypermitted")),
    u(0, g.PRE(new d("string"), new d("boolean"), "equalitypermitted", !0)),
    u(
      1,
      v.PRE(HTMLInputElement, void 0, 'Is it not an <input type = "text"/> that is tagged with this functionality?'),
    ),
    u(1, M.PRE("text", !1, "type")),
  ],
  p,
  "functionality",
  1,
);
window.codbi.registerFunctionality("Date.Frame", p.functionality.bind(p));
export { p as Date_Frame };
