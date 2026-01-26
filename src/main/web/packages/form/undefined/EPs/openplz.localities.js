import { a as n } from "./chunk-PZ4L54Z5.js";
import "./chunk-EEU2ZRMO.js";
import "./chunk-REJDLPRJ.js";
var r = class r extends n {
  static retrieve(e) {
    return n.retrieve([
      e[0],
      "Localities",
      "",
      "",
      `name-${e[1].replace(/^/, "\xB0")}`,
      e.length >= 3 ? `postalCode-${e[2].replace(/^/, "\xB0")}` : "",
      "",
      "",
      "",
      e[3] ? e[3] : "",
      e[3] ? e[3] : "",
    ]);
  }
};
r.registered = window.codbi.registerEP("OpenPLZ.Localities", r.retrieve);
var t = r;
export { t as OpenPLZ_Localities };
