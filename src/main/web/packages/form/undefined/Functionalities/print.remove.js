import "./chunk-K6ISRTTP.js";
import "./chunk-W23DHSE2.js";
import "./chunk-MUWAMKOD.js";
import "./chunk-RS4WWU7K.js";
var t = class t {
  static functionality(e, l) {
    let n = !1;
    if (
      (e.invert &&
        e.invert.toLowerCase() === "true" &&
        ((n = !0), (e.parentallevel = e.parentallevel ? e.parentallevel : "1")),
      n ? XFC_METADATA.requestType !== "print" : XFC_METADATA.requestType === "print")
    ) {
      if (e.documentselector) {
        let r = document.querySelector(e.documentselector);
        r && r.remove();
        return;
      }
      if (e.parentallevel) {
        let r = l,
          u = Number.parseInt(e.parentallevel);
        for (let i = 0; i < u; i++) r = r.parentElement;
        r.remove();
        return;
      }
      l.remove();
    }
  }
};
t.registered = window.codbi.registerFunctionality("Print.Remove", t.functionality);
var s = t;
export { s as Print_Remove };
