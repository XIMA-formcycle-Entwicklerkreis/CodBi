var r = Object.create;
var i = Object.defineProperty,
  s = Object.defineProperties,
  o = Object.getOwnPropertyDescriptor,
  t = Object.getOwnPropertyDescriptors,
  u = Object.getOwnPropertyNames,
  n = Object.getOwnPropertySymbols,
  v = Object.getPrototypeOf,
  p = Object.prototype.hasOwnProperty,
  w = Object.prototype.propertyIsEnumerable;
var q = (b) => {
    throw TypeError(b);
  },
  A = Math.pow,
  l = (b, a, c) => (a in b ? i(b, a, { enumerable: !0, configurable: !0, writable: !0, value: c }) : (b[a] = c)),
  B = (b, a) => {
    for (var c in a || (a = {})) p.call(a, c) && l(b, c, a[c]);
    if (n) for (var c of n(a)) w.call(a, c) && l(b, c, a[c]);
    return b;
  },
  C = (b, a) => s(b, t(a));
var D = ((b) =>
  typeof require != "undefined"
    ? require
    : typeof Proxy != "undefined"
      ? new Proxy(b, { get: (a, c) => (typeof require != "undefined" ? require : a)[c] })
      : b)(function (b) {
  if (typeof require != "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + b + '" is not supported');
});
var E = (b, a) => () => (a || b((a = { exports: {} }).exports, a), a.exports);
var x = (b, a, c, e) => {
  if ((a && typeof a == "object") || typeof a == "function")
    for (let d of u(a))
      !p.call(b, d) && d !== c && i(b, d, { get: () => a[d], enumerable: !(e = o(a, d)) || e.enumerable });
  return b;
};
var F = (b, a, c) => (
  (c = b != null ? r(v(b)) : {}), x(a || !b || !b.__esModule ? i(c, "default", { value: b, enumerable: !0 }) : c, b)
);
var G = (b, a, c, e) => {
    for (var d = e > 1 ? void 0 : e ? o(a, c) : a, g = b.length - 1, h; g >= 0; g--)
      (h = b[g]) && (d = (e ? h(a, c, d) : h(d)) || d);
    return e && d && i(a, c, d), d;
  },
  H = (b, a) => (c, e) => a(c, e, b);
var I = (b, a, c) => l(b, typeof a != "symbol" ? a + "" : a, c),
  m = (b, a, c) => a.has(b) || q("Cannot " + c);
var y = (b, a, c) => (m(b, a, "read from private field"), c ? c.call(b) : a.get(b)),
  J = (b, a, c) =>
    a.has(b) ? q("Cannot add the same private member more than once") : a instanceof WeakSet ? a.add(b) : a.set(b, c),
  z = (b, a, c, e) => (m(b, a, "write to private field"), e ? e.call(b, c) : a.set(b, c), c),
  K = (b, a, c) => (m(b, a, "access private method"), c);
var L = (b, a, c, e) => ({
  set _(d) {
    z(b, a, d, c);
  },
  get _() {
    return y(b, a, e);
  },
});
var M = (b, a, c) =>
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
export {
  A as a,
  B as b,
  C as c,
  D as d,
  E as e,
  F as f,
  G as g,
  H as h,
  I as i,
  y as j,
  J as k,
  z as l,
  K as m,
  L as n,
  M as o,
};
