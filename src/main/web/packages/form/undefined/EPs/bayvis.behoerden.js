import { a as p } from "./chunk-IZMXAPWV.js";
import { a as m } from "./chunk-INDLVHJ6.js";
import { a as u } from "./chunk-XMOSKO55.js";
import { a as k } from "./chunk-EEU2ZRMO.js";
import { a as l } from "./chunk-CVDXS2Z7.js";
import { a } from "./chunk-PR6DYHSM.js";
import { a as b } from "./chunk-TNKBSIBG.js";
import { b as A, c as f, d as s } from "./chunk-REJDLPRJ.js";
var h = A(k(), 1);
var e = class e {
  static retrieve(n) {
    return new Promise((i, g) => {
      e.buffer && (n.length >= 2 ? i(e.buffer.map((r) => r[n[1]])) : i(e.buffer));
      let w = (0, h.getJQuery)(),
        o = new Array();
      w.ajax({
        url: `${window.codbi.baseURL}plugin?name=CodBi_BayVIS_Auskunft_Behoerdenverzeichnis`,
        type: "GET",
        headers: { Accept: "application/xml" },
      })
        .done((r) => {
          let t = new m({ attributeNamePrefix: "", ignoreAttributes: !1 }).parse(r)["ns2:behoerden"];
          if (
            (t === void 0 && (t = JSON.parse(r)),
            t === void 0 && g(new u("Unable to retrieve data from CodBi_BayVIS_Auskunft_Behoerdenverzeichnis")),
            (o = t.behoerde),
            n.length >= 1)
          ) {
            let d = new Array();
            for (let y of o) d.push(y[n[0]]);
            i(d);
          }
          i(o);
        })
        .fail((r) => {
          g(new u("Unable to retrieve data from CodBi_BayVIS_Auskunft_Behoerdenverzeichnis"));
        });
    });
  }
};
(e.stdExp = { directoryMember: /^(behoerdenart|behoerdengruppe|bezeichnung|email|id|sortierreihenfolge)$/ }),
  (e.registered = window.codbi.registerEP("BayVIS.Behoerden", e.retrieve)),
  f(
    [b.ParamvalueProvider, s(0, a.PRE(new p("string"))), s(0, a.PRE(new l(e.stdExp.directoryMember), 1))],
    e,
    "retrieve",
    1,
  );
var c = e;
export { c as BayVIS_Behoerden };
