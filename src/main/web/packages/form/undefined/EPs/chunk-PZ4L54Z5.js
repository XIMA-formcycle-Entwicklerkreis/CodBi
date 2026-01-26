import { a as l } from "./chunk-EEU2ZRMO.js";
import { b as c } from "./chunk-REJDLPRJ.js";
var r = c(l(), 1),
  n = class n {
    static retrieve(e) {
      return new Promise((t, g) => {
        (0, r.getJQuery)()
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
          .done((o) => {
            t(JSON.parse(o));
          });
      });
    }
  };
n.registered = window.codbi.registerEP("OpenPLZ", n.retrieve);
var i = n;
export { i as a };
