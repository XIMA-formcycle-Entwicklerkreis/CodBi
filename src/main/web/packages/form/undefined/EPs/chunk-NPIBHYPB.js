import { a as A } from "./chunk-JDZ7GIHA.js";
import { a as v } from "./chunk-INDLVHJ6.js";
import { a as s } from "./chunk-SBHCT576.js";
import { a as y } from "./chunk-HV3SPSHE.js";
import { a as L } from "./chunk-BQCZFAYZ.js";
import { a as w } from "./chunk-PN2FQ2K5.js";
import { a as f } from "./chunk-2NFNCZZA.js";
import { b as z, c as h, d as i, g as b } from "./chunk-WWJ6UWS7.js";
var C = z(y(), 1);
var e = class e {
  static retrieve(g) {
    return new Promise((l, m) => {
      e.buffer && (g.length >= 2 ? l(e.buffer.map((r) => r[g[1]])) : l(e.buffer)),
        (0, C.getJQuery)()
          .ajax({
            url: `${window.codbi.baseURL}plugin?name=CodBi_BayVIS_Auskunft_Ansprechpartnerverzeichnis`,
            type: "GET",
            headers: { Accept: "application/xml" },
          })
          .done((r) => {
            var c, u, p, d;
            let t = new v({ attributeNamePrefix: "", ignoreAttributes: !1 }).parse(r)["ns2:ansprechpartner"];
            t === void 0 && (t = JSON.parse(r)),
              t === void 0 &&
                m(new s("Unable to retrieve data from servlet CodBi_BayVIS_Auskunft_Ansprechpartnerverzeichnis"));
            let E = t.ap,
              n = g[0].split(" ");
            for (let a of E)
              ((a.vorname.toLocaleLowerCase() === ((c = n[0]) == null ? void 0 : c.trim().toLocaleLowerCase()) &&
                a.nachname.toLocaleLowerCase() === ((u = n[1]) == null ? void 0 : u.trim().toLocaleLowerCase())) ||
                (a.vorname.toLocaleLowerCase() === ((p = n[1]) == null ? void 0 : p.trim().toLocaleLowerCase()) &&
                  a.nachname.toLocaleLowerCase() === ((d = n[0]) == null ? void 0 : d.trim().toLocaleLowerCase()))) &&
                l([a.ansprechpartnerId]);
            m(new s(`No Contact with name "${n}" found`));
          })
          .fail((r) => {
            m(new s("Unable to retrieve data from servlet CodBi_BayVIS_Auskunft_Ansprechpartnerverzeichnis"));
          });
    });
  }
};
h(
  [
    b.ParamvalueProvider,
    i(0, L.PRE(1, !1, !1, "length", "Has the contact's first- and last name been specified?")),
    i(0, f.PRE(new w("string"), 0)),
    i(0, f.PRE(new A(/^[A-Z][a-z]+\s[A-Z][a-z]+$/), 0)),
  ],
  e,
  "retrieve",
  1,
);
var o = e;
window.codbi.registerEP("BayVIS.Ansprechpartner.ID", o.retrieve.bind(o));
export { o as a };
