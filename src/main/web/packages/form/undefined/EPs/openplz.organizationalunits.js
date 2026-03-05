import { a as y } from "./chunk-RQ2OISH5.js";
import { a as f } from "./chunk-44HOFY3R.js";
import { a as u } from "./chunk-CTQLZ4AL.js";
import { a as l } from "./chunk-JDZ7GIHA.js";
import { a as O } from "./chunk-HV3SPSHE.js";
import { a as P } from "./chunk-BQCZFAYZ.js";
import { a as d } from "./chunk-PN2FQ2K5.js";
import { a as s } from "./chunk-2NFNCZZA.js";
import { b as E, c as X, d as r, g as c } from "./chunk-WWJ6UWS7.js";
var w = E(O(), 1);
var n = class extends y {
  static retrieve(e) {
    return new Promise((a, L) => {
      let t = (0, w.getJQuery)();
      e.length === 2
        ? t
            .ajax({
              url: `${window.codbi.baseURL}plugin?name=CodBi_OpenPLZ_Query`,
              type: "GET",
              headers: {
                Accept: "application/json",
                "X-Country": e[0] ? e[0] : "",
                "X-OrgaUnit": e[1] ? e[1] : "",
                "X-OfficialKey": "",
                "X-Detail": "",
                "X-Param1": "",
                "X-Param2": "",
                "X-Param3": "",
                "X-Param4": "",
                "X-PagesToLoad": e[4] ? e[4] : "",
              },
            })
            .done((i) => {
              a(JSON.parse(i));
            })
        : b(e[2])
          ? t
              .ajax({
                url: `${window.codbi.baseURL}plugin?name=CodBi_OpenPLZ_Query`,
                type: "GET",
                headers: {
                  Accept: "application/json",
                  "X-Country": e[0] ? e[0] : "",
                  "X-OrgaUnit": e[1] ? e[1] : "",
                  "X-OfficialKey": e[2] ? e[2] : "",
                  "X-Detail": e[3] ? e[3] : "",
                  "X-Param1": "",
                  "X-Param2": "",
                  "X-Param3": "",
                  "X-Param4": "",
                  "X-PagesToLoad": e[4] ? e[4] : "",
                },
              })
              .done((i) => {
                a(JSON.parse(i));
              })
          : t
              .ajax({
                url: `${window.codbi.baseURL}plugin?name=CodBi_OpenPLZ_Query`,
                type: "GET",
                headers: {
                  Accept: "application/json",
                  "X-Country": e[0] ? e[0] : "",
                  "X-OrgaUnit": e[1] ? e[1] : "",
                  "X-OfficialKey": "",
                  "X-Detail": "",
                  "X-Param1": "",
                  "X-Param2": "",
                  "X-Param3": "",
                  "X-Param4": "",
                },
              })
              .done((i) => {
                for (let g of JSON.parse(i))
                  e[2] === g.name &&
                    t
                      .ajax({
                        url: `${window.codbi.baseURL}plugin?name=CodBi_OpenPLZ_Query`,
                        type: "GET",
                        headers: {
                          Accept: "application/json",
                          "X-Country": e[0] ? e[0] : "",
                          "X-OrgaUnit": e[1] ? e[1] : "",
                          "X-OfficialKey": g.key,
                          "X-Detail": e[3] ? e[3] : "",
                          "X-Param1": "",
                          "X-Param2": "",
                          "X-Param3": "",
                          "X-Param4": "",
                          "X-PagesToLoad": e[4] ? e[4] : "",
                        },
                      })
                      .done((m) => {
                        a(JSON.parse(m));
                      });
              });
    });
  }
};
X(
  [
    c.ParamvalueProvider,
    r(0, P.PRE(1, !0, !1, "length", "Hasn't at least the Locality's or the Postalcode RegEx been specified?")),
    r(0, s.PRE(new d("string"), 0, 4)),
    r(0, s.PRE(new u([new f(""), new l(/(de|en|at|li|ch)/i)]), 0)),
  ],
  n,
  "retrieve",
  1,
);
window.codbi.registerEP("OpenPLZ.OrganizationalUnits", n.retrieve.bind(n));
function b(o) {
  if (o.trim() === "") return !1;
  let e = +o;
  return !Number.isNaN(e) && Number.isFinite(e);
}
export { n as OpenPLZ_OrganizationalUnits };
