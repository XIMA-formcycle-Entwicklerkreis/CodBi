import "./chunk-REJDLPRJ.js";
var n = class n {
  static retrieve(r) {
    return r.length > 1
      ? (r[0].sort((i, o) => {
          let t = i[r[1]].toUpperCase(),
            e = o[r[1]].toUpperCase();
          return t < e ? -1 : t > e ? 1 : 0;
        }),
        r[0])
      : r.sort();
  }
};
n.registered = window.codbi.registerEP("Sorted", n.retrieve);
var s = n;
export { s as Sorted };
