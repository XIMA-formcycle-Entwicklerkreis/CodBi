function f(r, e, n, o) {
  var i = arguments.length,
    t = i < 3 ? e : o === null ? (o = Object.getOwnPropertyDescriptor(e, n)) : o,
    a;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function") t = Reflect.decorate(r, e, n, o);
  else for (var c = r.length - 1; c >= 0; c--) (a = r[c]) && (t = (i < 3 ? a(t) : i > 3 ? a(e, n, t) : a(e, n)) || t);
  return i > 3 && t && Object.defineProperty(e, n, t), t;
}
function u(r, e) {
  return function (n, o) {
    e(n, o, r);
  };
}
function s(r, e) {
  if (typeof Reflect == "object" && typeof Reflect.metadata == "function") return Reflect.metadata(r, e);
}
export { f as a, u as b, s as c };
