import { a as y } from "./chunk-INDLVHJ6.js";
import { a as f } from "./chunk-SBHCT576.js";
import "./chunk-ZAZUS2LA.js";
import { a as B } from "./chunk-HV3SPSHE.js";
import { a as l } from "./chunk-BQCZFAYZ.js";
import { a as c } from "./chunk-PN2FQ2K5.js";
import { a as h } from "./chunk-2NFNCZZA.js";
import { b as A, c as m, d as u, g as p } from "./chunk-WWJ6UWS7.js";
var w = A(B(), 1);
var e = class e {
  static retrieve(o) {
    return new Promise((s, d) => {
      e.buffer && (o.length >= 2 ? s(e.buffer.map((r) => r[o[1]])) : s(e.buffer)),
        (0, w.getJQuery)()
          .ajax({
            url: `${window.codbi.baseURL}plugin?name=CodBi_BayVIS_Auskunft_Behoerdenverzeichnis`,
            type: "GET",
            headers: { Accept: "application/xml" },
          })
          .done((r) => {
            var b;
            let n = new y({ attributeNamePrefix: "", ignoreAttributes: !1 }).parse(r)["ns2:behoerden"];
            n === void 0 && (n = JSON.parse(r)),
              n === void 0 && d(new f("Unable to retrieve data from CodBi_BayVIS_Auskunft_Behoerdenverzeichnis"));
            let a = n.behoerde,
              g = new Array();
            for (let i = 0; i < a.length; i++)
              ((b = a[i]) == null ? void 0 : b.bezeichnung.toLowerCase()) === o[0].toLowerCase() &&
                g.push(a[i].id.toString());
            s(g);
          })
          .fail((r) => {
            d(new f("Unable to retrieve data from CodBi_BayVIS_Auskunft_Behoerdenverzeichnis"));
          });
    });
  }
};
m(
  [
    p.ParamvalueProvider,
    u(0, l.PRE(1, !0, !1, "length", "Has the name of the authority been specified?")),
    u(0, h.PRE(new c("string"))),
  ],
  e,
  "retrieve",
  1,
);
var t = e;
window.codbi.registerEP("BayVIS.Behoerden.ID", t.retrieve.bind(t));
export { t as BayVIS_Behoerden_ID };
