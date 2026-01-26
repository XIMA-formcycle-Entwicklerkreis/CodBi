import "./chunk-REJDLPRJ.js";
var r = class r {
  static retrieve(e) {
    let n = [];
    for (let t of e[2]) t[e[0]] === e[1] && n.push(t);
    return n;
  }
};
r.registered = window.codbi.registerEP("F", r.retrieve);
var i = r;
export { i as F };
