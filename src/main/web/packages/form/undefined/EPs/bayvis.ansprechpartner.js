import { a as c } from "./chunk-JDZ7GIHA.js";
import { a as h } from "./chunk-INDLVHJ6.js";
import { a as l } from "./chunk-SBHCT576.js";
import "./chunk-ZAZUS2LA.js";
import { a as E } from "./chunk-HV3SPSHE.js";
import { a as f } from "./chunk-BQCZFAYZ.js";
import { a as b } from "./chunk-PN2FQ2K5.js";
import { a as o } from "./chunk-2NFNCZZA.js";
import { b as A, c as d, d as s, g as m } from "./chunk-WWJ6UWS7.js";
var p = A(E(), 1);
var e = class e {
  static retrieve(n) {
    return new Promise((i, w) => {
      e.buffer && (n.length >= 1 ? i(e.buffer.map((r) => r[n[0]])) : i(e.buffer));
      let y = (0, p.getJQuery)(),
        g = new Array();
      y.ajax({
        url: `${window.codbi.baseURL}plugin?name=CodBi_BayVIS_Auskunft_Ansprechpartnerverzeichnis`,
        type: "GET",
        headers: { Accept: "application/xml" },
      })
        .done((r) => {
          let t = new h({ attributeNamePrefix: "", ignoreAttributes: !1 }).parse(r)["ns2:ansprechpartner"];
          if ((t === void 0 && (t = JSON.parse(r)), t !== void 0)) {
            if (((g = e.buffer = t.ap), n.length >= 1)) {
              let u = new Array();
              for (let z of g) u.push(z[n[0]]);
              i(u);
            }
            i(g);
          }
        })
        .fail((r) => {
          w(new l("Unable to retrieve data from Servlet CodBi_BayVIS_Auskunft_Ansprechpartnerverzeichnis."));
        });
    });
  }
};
(e.stdExp = {
  directoryMember:
    /^(anrede|vorname|nachname|funktion|stellenbezeichnung|email|website|zimmer|sortierreihenfolge|behoerdeId|behoerdeBezeichnung|gebaeudeId|gebaeudeBezeichnung|ansprechpartnerId)$/,
}),
  d(
    [
      m.ParamvalueProvider,
      s(0, f.PRE(1, !1, !1, "length", "Has directory property been specified?")),
      s(0, o.PRE(new b("string"))),
      s(0, o.PRE(new c(e.stdExp.directoryMember), 0)),
    ],
    e,
    "retrieve",
    1,
  );
var a = e;
window.codbi.registerEP("BayVIS.Ansprechpartner", a.retrieve.bind(a));
export { a as BayVIS_Ansprechpartner };
