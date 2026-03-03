import { a as c } from "./chunk-7ZUEWSHL.js";
import { a as m } from "./chunk-M2SNI3IN.js";
import { a as E } from "./chunk-KEJSWGMR.js";
import { a as l } from "./chunk-SEUS6MHP.js";
import { a as i } from "./chunk-CDLTIEKC.js";
import { g as a, h as r } from "./chunk-UTJJRBTX.js";
var n = class {
  static functionality(e, o) {
    let s = !1;
    if (
      (e.invert &&
        e.invert.toLowerCase() === "true" &&
        ((s = !0), (e.parentallevel = e.parentallevel ? e.parentallevel : "1")),
      s ? XFC_METADATA.requestType !== "print" : XFC_METADATA.requestType === "print")
    ) {
      if (e.documentselector) {
        let t = document.querySelector(e.documentselector);
        t && t.remove();
        return;
      }
      if (e.parentallevel) {
        let t = o,
          u = Number.parseInt(e.parentallevel);
        for (let p = 0; p < u; p++) t = t.parentElement;
        t.remove();
        return;
      }
      o.remove();
    }
  }
};
a(
  [
    r(0, c.PRE("documentselector")),
    r(0, i.PRE("string", "documentselector")),
    r(0, m.PRE(new i("string"), new l(/^\d+$/), "parentallevel")),
    r(0, m.PRE(new i("string"), new l(/^(TRUE|FALSE)$/i), "invert")),
    r(1, E.PRE(HTMLElement, "Is it not an HTML-Element that is tagged with this functionality?")),
  ],
  n,
  "functionality",
  1,
);
window.codbi.registerFunctionality("Print.Remove", n.functionality.bind(n));
export { n as Print_Remove };
