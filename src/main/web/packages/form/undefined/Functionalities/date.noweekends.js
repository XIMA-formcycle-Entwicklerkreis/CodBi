import { a as m } from "./chunk-QM2ZX7FA.js";
import { a as s } from "./chunk-W23DHSE2.js";
import { a as d } from "./chunk-MUWAMKOD.js";
import { f as y, g as a, h as l } from "./chunk-RS4WWU7K.js";
var u = y(s(), 1);
var r = class r {
  static functionality(n, e) {
    let i = (0, u.getJQuery)();
    i(e).data("datepicker") === 1 && i(e).datepicker(),
      i(e).datepicker("option", "beforeShowDay", i.datepicker.noWeekends),
      i(e).on("change", (w) => {
        let t = new Date(
          e.value
            .split(n.delimiter && typeof n.delimiter == "string" ? n.delimiter : ".")
            .reduce((g, f, c) => f + (c === 0 ? "" : "/") + g),
        ).getDay();
        t === 0 || t === 6
          ? i(e).error(
              n.msgnoweekends && typeof n.msgnoweekends == "string"
                ? n.msgnoweekends
                : "Specifying weekends is not allowed.",
            )
          : i(e).error("");
      });
  }
};
(r.registered = window.codbi.registerFunctionality("Date.NoWeekends", r.functionality)),
  a([d.ParamvalueProvider, l(1, m.PRE("INPUT", !1, "tagName"))], r, "functionality", 1);
var p = r;
export { p as Date_NoWeekends };
