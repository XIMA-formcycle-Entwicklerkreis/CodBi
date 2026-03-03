import { a as w } from "./chunk-PSEWTT4Z.js";
import { a as b } from "./chunk-4JLAI42Q.js";
import { a as E } from "./chunk-KEJSWGMR.js";
import { a } from "./chunk-CDLTIEKC.js";
import { f as k, g as m, h as s, p as h } from "./chunk-UTJJRBTX.js";
var y = k(b(), 1);
var l = class {
  static functionality(e, i) {
    (e.separator = e.separator || ", "),
      (e.showblacklist = e.showblacklist
        ? typeof e.showblacklist == "string"
          ? e.showblacklist.toLowerCase() === "true"
          : e.showblacklist
        : !1);
    let r = (0, y.getJQuery)();
    r(i).data("datepicker") === 1 && r(i).datepicker();
    let f = (t, n, u) => {
        if (n.includes(t)) {
          let g = `${e.prefix ? e.prefix : ""}${e.showblacklist && a.tsCheck(e.showblacklist, "string").toLowerCase() === "true" ? n.join(e.separator ? a.tsCheck(e.separator, "string") : "") : ""}${e.postfix ? e.postfix : ""}`;
          r(u).error(g.length > 0 ? g : "The entered value is not allowed.");
        } else r(u).error("");
      },
      p = e.list ? (typeof e.list == "string" ? e.list.split(",") : e.list) : new Array(),
      c = r(i).datepicker("option", "onSelect");
    r(i).on("change", (t) => {
      c && c(t), f(t.target.value, p, i);
    }),
      i.addEventListener("input", (t) => {
        f(t.target.value, p, t.target);
      });
    let o = r(i).datepicker("option", "beforeShowDay");
    r(i).datepicker("option", "beforeShowDay", (t) => {
      if (o) {
        let n = o(t);
        if (n && n[0] === !1) return !1;
      }
      return [!p.includes(t.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }))];
    });
  }
};
m(
  [
    h.ParamvalueProvider,
    s(0, a.PRE("string", "prefix :: postfix :: separator")),
    s(0, a.PRE("string | boolean", "showblacklist")),
    s(
      1,
      E.PRE(HTMLInputElement, void 0, 'Is it not an <input type = "text"/> that is tagged with this functionality?'),
    ),
    s(1, w.PRE("text", !1, "type")),
  ],
  l,
  "functionality",
  1,
);
window.codbi.registerFunctionality("HTML.Input.Blacklist", l.functionality.bind(l));
export { l as HTML_Input_Blacklist };
