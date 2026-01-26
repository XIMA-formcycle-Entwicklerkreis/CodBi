import { a as n } from "./chunk-JL2EL352.js";
import { a as l } from "./chunk-MUWAMKOD.js";
import { g as f, h as a } from "./chunk-RS4WWU7K.js";
var o = class o {
  static functionality(e, c) {
    let s = window.location.href.indexOf(e.rootint) === -1 ? e.rootext : e.rootint,
      i = window.location.href.indexOf(e.rootint) === -1 ? e.rootint : e.rootext;
    for (let r of c.querySelectorAll("a")) {
      let t = r.getAttribute("href");
      t && t.indexOf(i) !== -1 && r.setAttribute("href", t.replace(i, s));
    }
    for (let r of c.querySelectorAll("img, iframe")) {
      let t = r.getAttribute("src");
      t && t.indexOf(i) !== -1 && r.setAttribute("src", t.replace(i, s));
    }
    for (let r of c.querySelectorAll("object")) {
      let t = r.getAttribute("data");
      t && t.indexOf(i) !== -1 && r.setAttribute("data", t.replace(i, s));
    }
  }
};
(o.registered = window.codbi.registerFunctionality("Net.xrURL.Normalize", o.functionality)),
  f(
    [l.ParamvalueProvider, a(0, n.PRE(n.stdExp.url, "rootint")), a(0, n.PRE(n.stdExp.url, "rootext"))],
    o,
    "functionality",
    1,
  );
var u = o;
export { u as Net_xrURL_Normalize };
