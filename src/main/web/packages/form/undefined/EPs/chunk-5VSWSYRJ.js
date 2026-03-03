import { a as u } from "./chunk-JDZ7GIHA.js";
import { a as p } from "./chunk-INDLVHJ6.js";
import { a as d } from "./chunk-SBHCT576.js";
import { a as z } from "./chunk-HV3SPSHE.js";
import { a as m } from "./chunk-BQCZFAYZ.js";
import { a as f } from "./chunk-PN2FQ2K5.js";
import { a as t } from "./chunk-2NFNCZZA.js";
import { b as w, c as a, d as i, g as l } from "./chunk-WWJ6UWS7.js";
var y = w(z(), 1);
var r = class r {
  static retrieve(e) {
    return new Promise((o, b) => {
      if (r.buffer.has(typeof e[0] == "string" ? e[0] : e[0][0])) {
        o([r.buffer[typeof e[0] == "string" ? e[0] : e[0][0]]]);
        return;
      }
      let E = (0, y.getJQuery)(),
        n = new Array();
      E.ajax({
        url: `${window.codbi.baseURL}plugin?name=CodBi_BayVIS_Auskunft_Behoerdendetails`,
        type: "GET",
        headers: { Accept: "application/xml", ID: (typeof e[0] == "string" ? e[0] : e[0][0]).trim() },
      })
        .done((g) => {
          let s = new p({ attributeNamePrefix: "", ignoreAttributes: !1 }).parse(g)["ns2:GetBehoerdeResponse"];
          if ((s === void 0 && (s = JSON.parse(g)), (n = s.behoerde), e.length >= 2)) {
            let h = n[e[1]];
            h === void 0 && b(new d(`Detail "${e[1]}" of authorities is not available.`)), o(h);
          }
          (n.bezeichnungBehoerde = n.bezeichnung), o(n);
        })
        .fail((g) => {
          b(new d("Unable to retrieve data from CodBi_BayVIS_Auskunft_Behoerdendetails"));
        });
    });
  }
};
(r.stdExp = {
  authorityID: /^\d{1,6}$/,
  directoryMember:
    /^(bezeichnungBehoerde|behoerdenart|behoerdengruppe|bezeichnung|email|id|sortierreihenfolge|logo|behoerdeZuordnungen|behoerdenGebaeudeZuordnungen)$/,
}),
  (r.buffer = new Map()),
  (r.registered = window.codbi.registerEP("BayVIS.Behoerden.Details", r.retrieve)),
  a(
    [
      l.ParamvalueProvider,
      i(0, m.PRE(2, !1, !1, "length", "Has the authority and building ID been specified?")),
      i(0, t.PRE(new f("string | object"))),
      i(0, t.PRE(new u(r.stdExp.authorityID), 0, 1)),
      i(0, t.PRE(new u(r.stdExp.directoryMember), 2)),
    ],
    r,
    "retrieve",
    1,
  );
var c = r;
export { c as a };
