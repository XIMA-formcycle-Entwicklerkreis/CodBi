import { a as u } from "./chunk-JDZ7GIHA.js";
import { a as m } from "./chunk-INDLVHJ6.js";
import { a as f } from "./chunk-SBHCT576.js";
import "./chunk-ZAZUS2LA.js";
import { a as P } from "./chunk-HV3SPSHE.js";
import { a as b } from "./chunk-BQCZFAYZ.js";
import { a as p } from "./chunk-PN2FQ2K5.js";
import { a as i } from "./chunk-2NFNCZZA.js";
import { b as y, c as l, d as n, g as c } from "./chunk-WWJ6UWS7.js";
var w = y(P(), 1);
var r = class r {
  static retrieve(e) {
    return new Promise((o, d) => {
      if (r.buffer.has(e[1])) {
        o(r.buffer[e[1]]);
        return;
      }
      let E = (0, w.getJQuery)(),
        a = new Array();
      E.ajax({
        url: `${window.codbi.baseURL}plugin?name=CodBi_BayVIS_Auskunft_Gebaeudedetails`,
        type: "GET",
        headers: { Accept: "application/xml", ID: e[0], GebaeudeID: e[1] },
      })
        .done((g) => {
          let t = new m({ attributeNamePrefix: "", ignoreAttributes: !1 }).parse(g)["ns2:GetBehoerdenGebaeudeResponse"];
          if (
            (t === void 0 && ((t = JSON.parse(g)), (t.BehoerdenGebaeude = t.behoerdenGebaeude)),
            (a = t.BehoerdenGebaeude),
            e.length >= 3)
          ) {
            let h = a[e[2]];
            h === void 0 && d(new f(`Detail "${e[2]}" of authorities is not available.`)), o(h);
          }
          o(a);
        })
        .fail((g) => {
          d(new f("Unable to retrieve data from CodBi_BayVIS_Auskunft_Behoerdendetails"));
        });
    });
  }
};
(r.stdExp = {
  authorityID: /^\d{1,6}$/,
  directoryMember:
    /^(behoerdenart|behoerdengruppe|bezeichnung|email|id|sortierreihenfolge|logo|behoerdeZuordnungen|behoerdenGebaeudeZuordnungen)$/,
}),
  (r.buffer = new Map()),
  l(
    [
      c.ParamvalueProvider,
      n(0, b.PRE(2, !1, !1, "length", "Has the authority and building ID been specified?")),
      n(0, i.PRE(new p("string | object"))),
      n(0, i.PRE(new u(r.stdExp.authorityID), 0, 1)),
      n(0, i.PRE(new u(r.stdExp.directoryMember), 2)),
    ],
    r,
    "retrieve",
    1,
  );
var s = r;
window.codbi.registerEP("BayVIS.Behoerden.Details.Gebaeude", s.retrieve.bind(s));
export { s as BayVIS_Behoerden_Details_Gebaeude };
