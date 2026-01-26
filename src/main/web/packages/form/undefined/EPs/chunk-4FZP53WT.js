import { a as p } from "./chunk-INDLVHJ6.js";
import { a } from "./chunk-XMOSKO55.js";
import { a as v } from "./chunk-EEU2ZRMO.js";
import { a as d } from "./chunk-TNKBSIBG.js";
import { b as L, c as f } from "./chunk-REJDLPRJ.js";
var h = L(v(), 1);
var e = class e {
  static retrieve(o) {
    return new Promise((s, g) => {
      e.buffer && (o.length >= 2 ? s(e.buffer.map((r) => r[o[1]])) : s(e.buffer)),
        (0, h.getJQuery)()
          .ajax({
            url: `${window.codbi.baseURL}plugin?name=CodBi_BayVIS_Auskunft_Ansprechpartnerverzeichnis`,
            type: "GET",
            headers: { Accept: "application/xml" },
          })
          .done((r) => {
            var l, m, u, c;
            let i = new p({ attributeNamePrefix: "", ignoreAttributes: !1 }).parse(r)["ns2:ansprechpartner"];
            i === void 0 && (i = JSON.parse(r)),
              i === void 0 &&
                g(new a("Unable to retrieve data from servlet CodBi_BayVIS_Auskunft_Ansprechpartnerverzeichnis"));
            let w = i.ap,
              n = o[0].split(" ");
            for (let t of w)
              ((t.vorname.toLocaleLowerCase() === ((l = n[0]) == null ? void 0 : l.trim().toLocaleLowerCase()) &&
                t.nachname.toLocaleLowerCase() === ((m = n[1]) == null ? void 0 : m.trim().toLocaleLowerCase())) ||
                (t.vorname.toLocaleLowerCase() === ((u = n[1]) == null ? void 0 : u.trim().toLocaleLowerCase()) &&
                  t.nachname.toLocaleLowerCase() === ((c = n[0]) == null ? void 0 : c.trim().toLocaleLowerCase()))) &&
                s([t.ansprechpartnerId]);
            g(new a(`No Contact with name "${n}" found`));
          })
          .fail((r) => {
            g(new a("Unable to retrieve data from servlet CodBi_BayVIS_Auskunft_Ansprechpartnerverzeichnis"));
          });
    });
  }
};
(e.registered = window.codbi.registerEP("BayVIS.Ansprechpartner.ID", e.retrieve)),
  f([d.ParamvalueProvider], e, "retrieve", 1);
var b = e;
export { b as a };
