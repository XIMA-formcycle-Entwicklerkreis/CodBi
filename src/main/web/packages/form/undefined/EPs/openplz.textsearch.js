import { a as i } from "./chunk-PZ4L54Z5.js";
import "./chunk-EEU2ZRMO.js";
import "./chunk-REJDLPRJ.js";
var r = class r extends i {
  static retrieve(e) {
    return i.retrieve([
      e[0],
      "FullTextSearch",
      "",
      "",
      `searchTerm-${e[1].replace(/ /, "+")}`,
      "",
      "",
      "",
      e[2] ? e[2] : "",
    ]);
  }
};
r.registered = window.codbi.registerEP("OpenPLZ.TextSearch", r.retrieve);
var n = r;
export { n as OpenPLZ_TextSearch };
