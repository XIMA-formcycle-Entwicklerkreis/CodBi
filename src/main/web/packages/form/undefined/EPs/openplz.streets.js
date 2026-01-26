import { a as t } from "./chunk-PZ4L54Z5.js";
import { a as o } from "./chunk-EEU2ZRMO.js";
import { b as n } from "./chunk-REJDLPRJ.js";
var l = n(o(), 1);
var r = class r extends t {
  static retrieve(e) {
    return t.retrieve([
      e[0] ? e[0] : "",
      "Streets",
      "",
      "",
      `name-${e[1].replace(/^/, "\xB0")}`,
      e.length >= 4 ? `locality-${e[3].replace(/^/, "\xB0")}` : `postalCode-${e[2].replace(/^/, "\xB0")}`,
      "",
      "",
      e[4] ? e[4] : "",
    ]);
  }
};
r.registered = window.codbi.registerEP("OpenPLZ.Streets", r.retrieve);
var i = r;
export { i as OpenPLZ_Streets };
