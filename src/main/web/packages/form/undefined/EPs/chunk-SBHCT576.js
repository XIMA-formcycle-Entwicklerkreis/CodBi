import { a as m } from "./chunk-HV3SPSHE.js";
import { b as d } from "./chunk-WWJ6UWS7.js";
var g = d(m(), 1);
var o = class extends Error {
  constructor(n) {
    super(`${n}`);
  }
};
function b(a, n = "dd-mm-yyyy") {
  let l = n.toLowerCase(),
    t = a.match(/(\d+)/g),
    e = {},
    c = 0,
    r,
    i,
    s;
  return t
    ? (l.replace(/(yyyy|dd|mm)/g, (u) => ((e[u] = c++), "")),
      e.yyyy !== void 0 && (r = Number.parseInt(t[e.yyyy], 10)),
      e.mm !== void 0 && (i = Number.parseInt(t[e.mm], 10) - 1),
      e.dd !== void 0 && (s = Number.parseInt(t[e.dd], 10)),
      r !== void 0 && i !== void 0 && s !== void 0 ? new Date(r, i, s) : null)
    : null;
}
export { o as a, b };
