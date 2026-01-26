import { a as E } from "./chunk-BGFHKOW7.js";
import { a as p } from "./chunk-K3A632J4.js";
import { a as h } from "./chunk-QM2ZX7FA.js";
import { a as v } from "./chunk-W23DHSE2.js";
import { a as A } from "./chunk-MUWAMKOD.js";
import { f as b, g as u, h as m } from "./chunk-RS4WWU7K.js";
var w = b(v(), 1);
var s = class s {
  static functionality(r, i) {
    (r.separator = r.separator ? r.separator : ", "),
      Array.isArray(r.prefix) && (r.prefix = r.prefix[0]),
      Array.isArray(r.postfix) && (r.postfix = r.postfix[0]),
      Array.isArray(r.separator) && (r.separator = r.separator),
      Array.isArray(r.showblacklist) && (r.showblacklist = r.showblacklist[0]);
    let t = (0, w.getJQuery)();
    t(i).data("datepicker") === 1 && t(i).datepicker();
    let l = (e, n, g) => {
        if (n.includes(e)) {
          let y = `${r.prefix ? r.prefix : ""}${r.showblacklist && p.tsCheck(r.showblacklist, "string").toLowerCase() === "true" ? n.join(r.separator ? p.tsCheck(r.separator, "string") : "") : ""}${r.postfix ? r.postfix : ""}`;
          t(g).error(y.length > 0 ? y : "The entered value is not allowed.");
        } else t(g).error("");
      },
      a = r.list ? (typeof r.list == "string" ? r.list.split(",") : r.list) : new Array(),
      f = t(i).datepicker("option", "onSelect");
    t(i).on("change", (e) => {
      f && f(e), l(E.tsCheck(e.target, HTMLInputElement).value, a, i);
    }),
      i.addEventListener("input", (e) => {
        l(e.target.value, a, e.target);
      });
    let c = t(i).datepicker("option", "beforeShowDay");
    t(i).datepicker("option", "beforeShowDay", (e) => {
      if (c) {
        let n = c(e);
        if (n && n[0] === !1) return !1;
      }
      return [!a.includes(e.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }))];
    });
  }
};
(s.registered = window.codbi.registerFunctionality("HTML.Input.Blacklist", s.functionality)),
  u([A.ParamvalueProvider, m(1, h.PRE("INPUT", !1, "tagName"))], s, "functionality", 1);
var k = s;
export { k as HTML_Input_Blacklist };
