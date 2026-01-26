import { a as m } from "./chunk-IZMXAPWV.js";
import { a as f } from "./chunk-INDLVHJ6.js";
import { a as c } from "./chunk-XMOSKO55.js";
import { a as A } from "./chunk-EEU2ZRMO.js";
import { a } from "./chunk-CVDXS2Z7.js";
import { a as g } from "./chunk-PR6DYHSM.js";
import { a as d } from "./chunk-TNKBSIBG.js";
import { b as z, c as b, d as s } from "./chunk-REJDLPRJ.js";
var h = z(A(), 1);
var e = class e {
  static retrieve(n) {
    return new Promise((i, p) => {
      e.buffer && (n.length >= 1 ? i(e.buffer.map((r) => r[n[0]])) : i(e.buffer));
      let w = (0, h.getJQuery)(),
        o = new Array();
      w.ajax({
        url: `${window.codbi.baseURL}plugin?name=CodBi_BayVIS_Auskunft_Ansprechpartnerverzeichnis`,
        type: "GET",
        headers: { Accept: "application/xml" },
      })
        .done((r) => {
          let t = new f({ attributeNamePrefix: "", ignoreAttributes: !1 }).parse(r)["ns2:ansprechpartner"];
          if ((t === void 0 && (t = JSON.parse(r)), t !== void 0)) {
            if (((o = e.buffer = t.ap), n.length >= 1)) {
              let u = new Array();
              for (let y of o) u.push(y[n[0]]);
              i(u);
            }
            i(o);
          }
        })
        .fail((r) => {
          p(new c("Unable to retrieve data from Servlet CodBi_BayVIS_Auskunft_Ansprechpartnerverzeichnis."));
        });
    });
  }
};
(e.stdExp = { directoryMember: /^(behoerdenart|behoerdengruppe|bezeichnung|email|id|sortierreihenfolge)$/ }),
  (e.registered = window.codbi.registerEP("BayVIS.Ansprechpartner", e.retrieve)),
  b(
    [
      d.ParamvalueProvider,
      s(0, g.PRE(new m("string"))),
      s(0, g.PRE(new a(a.stdExp.url), 0)),
      s(0, g.PRE(new a(e.stdExp.directoryMember), 1)),
    ],
    e,
    "retrieve",
    1,
  );
var l = e;
export { l as BayVIS_Ansprechpartner };
