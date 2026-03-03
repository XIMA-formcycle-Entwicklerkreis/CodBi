import { a as m } from "./chunk-PSEWTT4Z.js";
import { a as c } from "./chunk-4JLAI42Q.js";
import { a as l } from "./chunk-KEJSWGMR.js";
import { a as p } from "./chunk-CDLTIEKC.js";
import { f as y, g as d, h as n, p as o } from "./chunk-UTJJRBTX.js";
var u = y(c(), 1);
var i = class {
  static functionality(r, e) {
    let t = (0, u.getJQuery)();
    t(e).data("datepicker") === 1 && t(e).datepicker(),
      t(e).datepicker("option", "beforeShowDay", t.datepicker.noWeekends),
      t(e).on("change", (k) => {
        let a = new Date(e.value.split(r.delimiter || ".").reduce((f, g, s) => g + (s === 0 ? "" : "/") + f)).getDay();
        a === 0 || a === 6 ? t(e).error(r.msgnoweekends || "Specifying weekends is not allowed.") : t(e).error("");
      });
  }
};
d(
  [
    o.ParamvalueProvider,
    n(0, p.PRE("string", "msgnoweekends :: delimiter")),
    n(
      1,
      l.PRE(HTMLInputElement, void 0, 'Is it not an <input type = "text"/> that is tagged with this functionality?'),
    ),
    n(1, m.PRE("text", !1, "type")),
  ],
  i,
  "functionality",
  1,
);
window.codbi.registerFunctionality("Date.NoWeekends", i.functionality.bind(i));
export { i as Date_NoWeekends };
