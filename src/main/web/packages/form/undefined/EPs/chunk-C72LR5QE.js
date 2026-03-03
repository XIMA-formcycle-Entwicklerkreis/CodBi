import { a as u } from "./chunk-X7STRZ54.js";
import { a as f } from "./chunk-JDZ7GIHA.js";
import { a as p } from "./chunk-PN2FQ2K5.js";
import { a as l } from "./chunk-2NFNCZZA.js";
import { c as n, d as o, g as m } from "./chunk-WWJ6UWS7.js";
var a = class {
  static retrieve(t) {
    var i;
    let e = new Date();
    return ((i = t[0]) == null ? void 0 : i.toLocaleUpperCase()) === "NOW" || t.length === 0 ? new Date() : c(e, t);
  }
};
n(
  [m.ParamvalueProvider, u.POST(Date), o(0, l.PRE([new p("string"), new f(/^(?i:(NOW)|([+-]\d+[dmy]))$/i)]))],
  a,
  "retrieve",
  1,
);
window.codbi.registerEP("Date.Today", a.retrieve.bind(a));
function c(r, t) {
  for (let e of t)
    e.replace("+", ""),
      e.toLocaleLowerCase().indexOf("d") !== -1 && r.setDate(r.getDate() + Number.parseInt(e.replace("d", ""))),
      e.toLocaleLowerCase().indexOf("m") !== -1 && r.setMonth(r.getMonth() + Number.parseInt(e.replace("m", ""))),
      e.toLocaleLowerCase().indexOf("y") !== -1 && r.setFullYear(r.getFullYear() + Number.parseInt(e.replace("y", "")));
  return r;
}
export { a, c as b };
