import "./chunk-6BQ5WEIU.js";
import "./chunk-2P4INLEO.js";
import "./chunk-IZMXAPWV.js";
import { a as m } from "./chunk-INDLVHJ6.js";
import { a } from "./chunk-XMOSKO55.js";
import { a as l } from "./chunk-EEU2ZRMO.js";
import "./chunk-CVDXS2Z7.js";
import "./chunk-PR6DYHSM.js";
import { a as b } from "./chunk-TNKBSIBG.js";
import { b as h, c as f } from "./chunk-REJDLPRJ.js";
var c = h(l(), 1);
var e = class e {
  static retrieve(t) {
    return new Promise((o, u) => {
      e.buffer && (t.length >= 2 ? o(e.buffer.map((r) => r[t[1]])) : o(e.buffer)),
        (0, c.getJQuery)()
          .ajax({
            url: `${window.codbi.baseURL}plugin?name=CodBi_BayVIS_Auskunft_Behoerdenverzeichnis`,
            type: "GET",
            headers: { Accept: "application/xml" },
          })
          .done((r) => {
            var d;
            let i = new m({ attributeNamePrefix: "", ignoreAttributes: !1 }).parse(r)["ns2:behoerden"];
            i === void 0 && (i = JSON.parse(r)),
              i === void 0 && u(new a("Unable to retrieve data from CodBi_BayVIS_Auskunft_Behoerdenverzeichnis"));
            let s = i.behoerde,
              g = new Array();
            for (let n = 0; n < s.length; n++)
              ((d = s[n]) == null ? void 0 : d.bezeichnung.toLowerCase()) === t[0].toLowerCase() &&
                g.push(s[n].id.toString());
            o(g);
          })
          .fail((r) => {
            u(new a("Unable to retrieve data from CodBi_BayVIS_Auskunft_Behoerdenverzeichnis"));
          });
    });
  }
};
(e.registered = window.codbi.registerEP("BayVIS.Behoerden.ID", e.retrieve)),
  f([b.ParamvalueProvider], e, "retrieve", 1);
var p = e;
export { p as BayVIS_Behoerden_ID };
