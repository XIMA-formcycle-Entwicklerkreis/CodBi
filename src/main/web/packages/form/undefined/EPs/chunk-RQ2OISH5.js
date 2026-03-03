import { a as l } from "./chunk-44HOFY3R.js";
import { a as c } from "./chunk-CTQLZ4AL.js";
import { a as o } from "./chunk-JDZ7GIHA.js";
import { a as f } from "./chunk-HV3SPSHE.js";
import { a as s } from "./chunk-BQCZFAYZ.js";
import { a as t } from "./chunk-PN2FQ2K5.js";
import { a as n } from "./chunk-2NFNCZZA.js";
import { b as E, c as g, d as r, g as a } from "./chunk-WWJ6UWS7.js";
var w = E(f(), 1);
var i = class {
  static retrieve(e) {
    return new Promise((d, R) => {
      (0, w.getJQuery)()
        .ajax({
          url: `${window.codbi.baseURL}plugin?name=CodBi_OpenPLZ_Query`,
          type: "GET",
          headers: {
            Accept: "application/json",
            "X-Country": e[0] ? e[0] : "",
            "X-OrgaUnit": e[1] ? e[1] : "",
            "X-OfficialKey": e[2] ? e[2] : "",
            "X-Detail": e[3] ? e[3] : "",
            "X-Param1": e[4] ? e[4].replace("=", "-").replace(/ /, "") : "",
            "X-Param2": e[5] ? e[5].replace("=", "-").replace(/ /, "") : "",
            "X-Param3": e[6] ? e[6].replace("=", "-").replace(/ /, "") : "",
            "X-Param4": e[7] ? e[7].replace("=", "-").replace(/ /, "") : "",
            "X-PagesToLoad": e[8] ? e[8].toString() : void 0,
          },
        })
        .done((P) => {
          d(JSON.parse(P));
        });
    });
  }
};
g(
  [
    a.ParamvalueProvider,
    r(0, s.PRE(1, !0, !1, "length", "Hasn't at least the Orga-Unit been specified?")),
    r(0, n.PRE(new t("string"), 0)),
    r(0, n.PRE(new c([new l(""), new o(/(de|en|at|li|ch)/i)]), 0)),
    r(0, n.PRE(new t("string"), 2)),
    r(0, n.PRE(new c([new l(""), new o(/^\d+$/)]), 2)),
  ],
  i,
  "retrieve",
  1,
);
window.codbi.registerEP("OpenPLZ", i.retrieve.bind(i));
export { i as a };
