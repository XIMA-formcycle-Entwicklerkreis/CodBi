import { a as h } from "./chunk-INDLVHJ6.js";
import { a as o } from "./chunk-X27P24HC.js";
import { a as p } from "./chunk-UJFJXTCP.js";
import { a as b } from "./chunk-YVPD7VIJ.js";
import { b as m, c as d } from "./chunk-HGR2N5IE.js";
var a = m(p(), 1);
var r = class r {
  static retrieve(e) {
    return new Promise((i, u) => {
      if (r.buffer.has(typeof e[0] == "string" ? e[0] : e[0][0])) {
        i([r.buffer[typeof e[0] == "string" ? e[0] : e[0][0]]]);
        return;
      }
      let f = (0, a.getJQuery)(),
        n = new Array();
      f.ajax({
        url: `${window.codbi.baseURL}plugin?name=CodBi_BayVIS_Auskunft_Behoerdendetails`,
        type: "GET",
        headers: { Accept: "application/xml", ID: (typeof e[0] == "string" ? e[0] : e[0][0]).trim() },
      })
        .done((t) => {
          let g = new h({ attributeNamePrefix: "", ignoreAttributes: !1 }).parse(t)["ns2:GetBehoerdeResponse"];
          if ((g === void 0 && (g = JSON.parse(t)), (n = g.behoerde), e.length >= 2)) {
            let s = n[e[1]];
            s === void 0 && u(new o(`Detail "${e[1]}" of authorities is not available.`)), i(s);
          }
          (n.bezeichnungBehoerde = n.bezeichnung), i(n);
        })
        .fail((t) => {
          u(new o("Unable to retrieve data from CodBi_BayVIS_Auskunft_Behoerdendetails"));
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
  d([b.ParamvalueProvider], r, "retrieve", 1);
var l = r;
export { l as a };
