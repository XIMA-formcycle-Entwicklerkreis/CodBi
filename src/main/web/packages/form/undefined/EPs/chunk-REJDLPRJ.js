var m = Object.create;
var i = Object.defineProperty;
var l = Object.getOwnPropertyDescriptor;
var n = Object.getOwnPropertyNames;
var o = Object.getPrototypeOf,
  p = Object.prototype.hasOwnProperty;
var q = (b, a, c) => (a in b ? i(b, a, { enumerable: !0, configurable: !0, writable: !0, value: c }) : (b[a] = c));
var s = (b, a) => () => (a || b((a = { exports: {} }).exports, a), a.exports);
var r = (b, a, c, e) => {
  if ((a && typeof a == "object") || typeof a == "function")
    for (let d of n(a))
      !p.call(b, d) && d !== c && i(b, d, { get: () => a[d], enumerable: !(e = l(a, d)) || e.enumerable });
  return b;
};
var t = (b, a, c) => (
  (c = b != null ? m(o(b)) : {}), r(a || !b || !b.__esModule ? i(c, "default", { value: b, enumerable: !0 }) : c, b)
);
var u = (b, a, c, e) => {
    for (var d = e > 1 ? void 0 : e ? l(a, c) : a, g = b.length - 1, h; g >= 0; g--)
      (h = b[g]) && (d = (e ? h(a, c, d) : h(d)) || d);
    return e && d && i(a, c, d), d;
  },
  v = (b, a) => (c, e) => a(c, e, b);
var w = (b, a, c) => q(b, typeof a != "symbol" ? a + "" : a, c);
var x = (b, a, c) =>
  new Promise((e, d) => {
    var g = (f) => {
        try {
          j(c.next(f));
        } catch (k) {
          d(k);
        }
      },
      h = (f) => {
        try {
          j(c.throw(f));
        } catch (k) {
          d(k);
        }
      },
      j = (f) => (f.done ? e(f.value) : Promise.resolve(f.value).then(g, h));
    j((c = c.apply(b, a)).next());
  });
export { s as a, t as b, u as c, v as d, w as e, x as f };
