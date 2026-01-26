import { a as c } from "./chunk-2P4INLEO.js";
import { a as p } from "./chunk-INDLVHJ6.js";
import { a as u } from "./chunk-XMOSKO55.js";
import { a as y } from "./chunk-EEU2ZRMO.js";
import { a as g } from "./chunk-CVDXS2Z7.js";
import { a } from "./chunk-PR6DYHSM.js";
import { a as h } from "./chunk-TNKBSIBG.js";
import { b as E, c as d, d as n } from "./chunk-REJDLPRJ.js";
var m = E(y(), 1);
var r = class r {
  static retrieve(t) {
    return new Promise((i, f) => {
      if (r.buffer.has(t[1])) {
        i(r.buffer[t[1]]);
        return;
      }
      let w = (0, m.getJQuery)(),
        s = new Array();
      w.ajax({
        url: `${window.codbi.baseURL}plugin?name=CodBi_BayVIS_Auskunft_Gebaeudedetails`,
        type: "GET",
        headers: { Accept: "application/xml", ID: t[0], GebaeudeID: t[1] },
      })
        .done((o) => {
          let e = new p({ attributeNamePrefix: "", ignoreAttributes: !1 }).parse(o)["ns2:GetBehoerdenGebaeudeResponse"];
          if (
            (e === void 0 && ((e = JSON.parse(o)), (e.BehoerdenGebaeude = e.behoerdenGebaeude)),
            (s = e.BehoerdenGebaeude),
            t.length >= 3)
          ) {
            let l = s[t[2]];
            l === void 0 && f(new u(`Detail "${t[2]}" of authorities is not available.`)), i(l);
          }
          i(s);
        })
        .fail((o) => {
          f(new u("Unable to retrieve data from CodBi_BayVIS_Auskunft_Behoerdendetails"));
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
  (r.registered = window.codbi.registerEP("BayVIS.Behoerden.Details.Gebaeude", r.retrieve)),
  d(
    [
      h.ParamvalueProvider,
      n(0, c.PRE(2, !0, !1, "length")),
      n(0, a.PRE(new g(r.stdExp.authorityID), 0, 1)),
      n(0, a.PRE(new g(r.stdExp.directoryMember), 2)),
    ],
    r,
    "retrieve",
    1,
  );
var b = r;
export { b as BayVIS_Behoerden_Details_Gebaeude };
