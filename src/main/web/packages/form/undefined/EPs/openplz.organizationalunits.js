import { a as s } from "./chunk-PZ4L54Z5.js";
import { a as d } from "./chunk-EEU2ZRMO.js";
import { b as u } from "./chunk-REJDLPRJ.js";
var X = u(d(), 1);
var t = class t extends s {
  static retrieve(e) {
    return new Promise((r, P) => {
      let n = (0, X.getJQuery)();
      e.length === 2
        ? n
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
              r(JSON.parse(i));
            })
        : l(e[2])
          ? n
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
                r(JSON.parse(i));
              })
          : n
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
                for (let a of JSON.parse(i))
                  e[2] === a.name &&
                    n
                      .ajax({
                        url: `${window.codbi.baseURL}plugin?name=CodBi_OpenPLZ_Query`,
                        type: "GET",
                        headers: {
                          Accept: "application/json",
                          "X-Country": e[0] ? e[0] : "",
                          "X-OrgaUnit": e[1] ? e[1] : "",
                          "X-OfficialKey": a.key,
                          "X-Detail": e[3] ? e[3] : "",
                          "X-Param1": "",
                          "X-Param2": "",
                          "X-Param3": "",
                          "X-Param4": "",
                          "X-PagesToLoad": e[4] ? e[4] : "",
                        },
                      })
                      .done((c) => {
                        r(JSON.parse(c));
                      });
              });
    });
  }
};
t.registered = window.codbi.registerEP("OpenPLZ.OrganizationalUnits", t.retrieve);
var g = t;
function l(o) {
  if (o.trim() === "") return !1;
  let e = +o;
  return !Number.isNaN(e) && Number.isFinite(e);
}
export { g as OpenPLZ_OrganizationalUnits };
