var m = Object.create;
var k = Object.defineProperty;
var l = Object.getOwnPropertyDescriptor;
var n = Object.getOwnPropertyNames;
var o = Object.getPrototypeOf,
  p = Object.prototype.hasOwnProperty;
var r = (b, a) => () => (a || b((a = { exports: {} }).exports, a), a.exports);
var q = (b, a, c, e) => {
  if ((a && typeof a == "object") || typeof a == "function")
    for (let d of n(a))
      !p.call(b, d) && d !== c && k(b, d, { get: () => a[d], enumerable: !(e = l(a, d)) || e.enumerable });
  return b;
};
var s = (b, a, c) => (
  (c = b != null ? m(o(b)) : {}), q(a || !b || !b.__esModule ? k(c, "default", { value: b, enumerable: !0 }) : c, b)
);
var t = (b, a, c, e) => {
    for (var d = e > 1 ? void 0 : e ? l(a, c) : a, g = b.length - 1, h; g >= 0; g--)
      (h = b[g]) && (d = (e ? h(a, c, d) : h(d)) || d);
    return e && d && k(a, c, d), d;
  },
  u = (b, a) => (c, e) => a(c, e, b);
var v = (b, a, c) =>
  new Promise((e, d) => {
    var g = (f) => {
        try {
          i(c.next(f));
        } catch (j) {
          d(j);
        }
      },
      h = (f) => {
        try {
          i(c.throw(f));
        } catch (j) {
          d(j);
        }
      },
      i = (f) => (f.done ? e(f.value) : Promise.resolve(f.value).then(g, h));
    i((c = c.apply(b, a)).next());
  });
export { r as a, s as b, t as c, u as d, v as e };
