import { a as h } from "./chunk-JDZ7GIHA.js";
import { a as c } from "./chunk-INDLVHJ6.js";
import { a as f } from "./chunk-SBHCT576.js";
import "./chunk-ZAZUS2LA.js";
import { a as k } from "./chunk-HV3SPSHE.js";
import { a as l } from "./chunk-BQCZFAYZ.js";
import { a as m } from "./chunk-PN2FQ2K5.js";
import { a as u } from "./chunk-2NFNCZZA.js";
import { b as E, c as p, d as o, g as b } from "./chunk-WWJ6UWS7.js";
var w = E(k(), 1);
var e = class e {
  static retrieve(n) {
    return new Promise((i, g) => {
      e.buffer && (n.length >= 2 ? i(e.buffer.map((r) => r[n[1]])) : i(e.buffer));
      let y = (0, w.getJQuery)(),
        a = new Array();
      y.ajax({
        url: `${window.codbi.baseURL}plugin?name=CodBi_BayVIS_Auskunft_Behoerdenverzeichnis`,
        type: "GET",
        headers: { Accept: "application/xml" },
      })
        .done((r) => {
          let t = new c({ attributeNamePrefix: "", ignoreAttributes: !1 }).parse(r)["ns2:behoerden"];
          if (
            (t === void 0 && (t = JSON.parse(r)),
            t === void 0 && g(new f("Unable to retrieve data from CodBi_BayVIS_Auskunft_Behoerdenverzeichnis")),
            (a = t.behoerde),
            n.length >= 1)
          ) {
            let d = new Array();
            for (let A of a) d.push(A[n[0]]);
            i(d);
          }
          i(a);
        })
        .fail((r) => {
          g(new f("Unable to retrieve data from CodBi_BayVIS_Auskunft_Behoerdenverzeichnis"));
        });
    });
  }
};
(e.stdExp = { directoryMember: /^(behoerdenart|behoerdengruppe|bezeichnung|email|id|sortierreihenfolge)$/ }),
  p(
    [
      b.ParamvalueProvider,
      o(0, l.PRE(1, !0, !1, "length", "Has a property of the authority been specified?")),
      o(0, u.PRE(new m("string"))),
      o(0, u.PRE(new h(e.stdExp.directoryMember), 1)),
    ],
    e,
    "retrieve",
    1,
  );
var s = e;
window.codbi.registerEP("BayVIS.Behoerden", s.retrieve.bind(s));
export { s as BayVIS_Behoerden };
