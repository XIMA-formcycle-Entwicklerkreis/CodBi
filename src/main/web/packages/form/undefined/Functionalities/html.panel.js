import { a as Xn } from "./chunk-BGFHKOW7.js";
import { a as Un } from "./chunk-K6ISRTTP.js";
import { a as gt } from "./chunk-JL2EL352.js";
import { a as Zr } from "./chunk-W23DHSE2.js";
import { a as Wn } from "./chunk-MUWAMKOD.js";
import { e as Kr, f as In, g as Fn, h as Mt } from "./chunk-RS4WWU7K.js";
var Vn = Kr((zn, _t) => {
  (function (k, b) {
    "use strict";
    typeof _t == "object" && typeof _t.exports == "object"
      ? (_t.exports = k.document
          ? b(k, !0)
          : function (T) {
              if (!T.document) throw new Error("jQuery requires a window with a document");
              return b(T);
            })
      : b(k);
  })(typeof window != "undefined" ? window : zn, function (k, b) {
    "use strict";
    var T = [],
      P = Object.getPrototypeOf,
      Z = T.slice,
      et = T.flat
        ? function (e) {
            return T.flat.call(e);
          }
        : function (e) {
            return T.concat.apply([], e);
          },
      qe = T.push,
      ue = T.indexOf,
      Le = {},
      tt = Le.toString,
      Ae = Le.hasOwnProperty,
      nt = Ae.toString,
      yt = nt.call(Object),
      j = {},
      q = function (t) {
        return typeof t == "function" && typeof t.nodeType != "number" && typeof t.item != "function";
      },
      Ce = function (t) {
        return t != null && t === t.window;
      },
      _ = k.document,
      Me = { type: !0, src: !0, nonce: !0, noModule: !0 };
    function de(e, t, n) {
      n = n || _;
      var r,
        a,
        s = n.createElement("script");
      if (((s.text = e), t))
        for (r in Me) (a = t[r] || (t.getAttribute && t.getAttribute(r))), a && s.setAttribute(r, a);
      n.head.appendChild(s).parentNode.removeChild(s);
    }
    function Q(e) {
      return e == null
        ? e + ""
        : typeof e == "object" || typeof e == "function"
          ? Le[tt.call(e)] || "object"
          : typeof e;
    }
    var te = "3.7.1",
      Pe = /HTML$/i,
      i = function (e, t) {
        return new i.fn.init(e, t);
      };
    (i.fn = i.prototype =
      {
        jquery: te,
        constructor: i,
        length: 0,
        toArray: function () {
          return Z.call(this);
        },
        get: function (e) {
          return e == null ? Z.call(this) : e < 0 ? this[e + this.length] : this[e];
        },
        pushStack: function (e) {
          var t = i.merge(this.constructor(), e);
          return (t.prevObject = this), t;
        },
        each: function (e) {
          return i.each(this, e);
        },
        map: function (e) {
          return this.pushStack(
            i.map(this, function (t, n) {
              return e.call(t, n, t);
            }),
          );
        },
        slice: function () {
          return this.pushStack(Z.apply(this, arguments));
        },
        first: function () {
          return this.eq(0);
        },
        last: function () {
          return this.eq(-1);
        },
        even: function () {
          return this.pushStack(
            i.grep(this, function (e, t) {
              return (t + 1) % 2;
            }),
          );
        },
        odd: function () {
          return this.pushStack(
            i.grep(this, function (e, t) {
              return t % 2;
            }),
          );
        },
        eq: function (e) {
          var t = this.length,
            n = +e + (e < 0 ? t : 0);
          return this.pushStack(n >= 0 && n < t ? [this[n]] : []);
        },
        end: function () {
          return this.prevObject || this.constructor();
        },
        push: qe,
        sort: T.sort,
        splice: T.splice,
      }),
      (i.extend = i.fn.extend =
        function () {
          var e,
            t,
            n,
            r,
            a,
            s,
            o = arguments[0] || {},
            l = 1,
            f = arguments.length,
            d = !1;
          for (
            typeof o == "boolean" && ((d = o), (o = arguments[l] || {}), l++),
              typeof o != "object" && !q(o) && (o = {}),
              l === f && ((o = this), l--);
            l < f;
            l++
          )
            if ((e = arguments[l]) != null)
              for (t in e)
                (r = e[t]),
                  !(t === "__proto__" || o === r) &&
                    (d && r && (i.isPlainObject(r) || (a = Array.isArray(r)))
                      ? ((n = o[t]),
                        a && !Array.isArray(n) ? (s = []) : !a && !i.isPlainObject(n) ? (s = {}) : (s = n),
                        (a = !1),
                        (o[t] = i.extend(d, s, r)))
                      : r !== void 0 && (o[t] = r));
          return o;
        }),
      i.extend({
        expando: "jQuery" + (te + Math.random()).replace(/\D/g, ""),
        isReady: !0,
        error: function (e) {
          throw new Error(e);
        },
        noop: function () {},
        isPlainObject: function (e) {
          var t, n;
          return !e || tt.call(e) !== "[object Object]"
            ? !1
            : ((t = P(e)),
              t ? ((n = Ae.call(t, "constructor") && t.constructor), typeof n == "function" && nt.call(n) === yt) : !0);
        },
        isEmptyObject: function (e) {
          var t;
          for (t in e) return !1;
          return !0;
        },
        globalEval: function (e, t, n) {
          de(e, { nonce: t && t.nonce }, n);
        },
        each: function (e, t) {
          var n,
            r = 0;
          if (Oe(e)) for (n = e.length; r < n && t.call(e[r], r, e[r]) !== !1; r++);
          else for (r in e) if (t.call(e[r], r, e[r]) === !1) break;
          return e;
        },
        text: function (e) {
          var t,
            n = "",
            r = 0,
            a = e.nodeType;
          if (!a) for (; (t = e[r++]); ) n += i.text(t);
          return a === 1 || a === 11
            ? e.textContent
            : a === 9
              ? e.documentElement.textContent
              : a === 3 || a === 4
                ? e.nodeValue
                : n;
        },
        makeArray: function (e, t) {
          var n = t || [];
          return e != null && (Oe(Object(e)) ? i.merge(n, typeof e == "string" ? [e] : e) : qe.call(n, e)), n;
        },
        inArray: function (e, t, n) {
          return t == null ? -1 : ue.call(t, e, n);
        },
        isXMLDoc: function (e) {
          var t = e && e.namespaceURI,
            n = e && (e.ownerDocument || e).documentElement;
          return !Pe.test(t || (n && n.nodeName) || "HTML");
        },
        merge: function (e, t) {
          for (var n = +t.length, r = 0, a = e.length; r < n; r++) e[a++] = t[r];
          return (e.length = a), e;
        },
        grep: function (e, t, n) {
          for (var r, a = [], s = 0, o = e.length, l = !n; s < o; s++) (r = !t(e[s], s)), r !== l && a.push(e[s]);
          return a;
        },
        map: function (e, t, n) {
          var r,
            a,
            s = 0,
            o = [];
          if (Oe(e)) for (r = e.length; s < r; s++) (a = t(e[s], s, n)), a != null && o.push(a);
          else for (s in e) (a = t(e[s], s, n)), a != null && o.push(a);
          return et(o);
        },
        guid: 1,
        support: j,
      }),
      typeof Symbol == "function" && (i.fn[Symbol.iterator] = T[Symbol.iterator]),
      i.each("Boolean Number String Function Array Date RegExp Object Error Symbol".split(" "), function (e, t) {
        Le["[object " + t + "]"] = t.toLowerCase();
      });
    function Oe(e) {
      var t = !!e && "length" in e && e.length,
        n = Q(e);
      return q(e) || Ce(e) ? !1 : n === "array" || t === 0 || (typeof t == "number" && t > 0 && t - 1 in e);
    }
    function W(e, t) {
      return e.nodeName && e.nodeName.toLowerCase() === t.toLowerCase();
    }
    var rt = T.pop,
      vt = T.sort,
      we = T.splice,
      L = "[\\x20\\t\\r\\n\\f]",
      oe = new RegExp("^" + L + "+|((?:^|[^\\\\])(?:\\\\.)*)" + L + "+$", "g");
    i.contains = function (e, t) {
      var n = t && t.parentNode;
      return (
        e === n ||
        !!(
          n &&
          n.nodeType === 1 &&
          (e.contains ? e.contains(n) : e.compareDocumentPosition && e.compareDocumentPosition(n) & 16)
        )
      );
    };
    var $e = /([\0-\x1f\x7f]|^-?\d)|^-$|[^\x80-\uFFFF\w-]/g;
    function z(e, t) {
      return t
        ? e === "\0"
          ? "\uFFFD"
          : e.slice(0, -1) + "\\" + e.charCodeAt(e.length - 1).toString(16) + " "
        : "\\" + e;
    }
    i.escapeSelector = function (e) {
      return (e + "").replace($e, z);
    };
    var J = _,
      _e = qe;
    (function () {
      var e,
        t,
        n,
        r,
        a,
        s = _e,
        o,
        l,
        f,
        d,
        y,
        m = i.expando,
        h = 0,
        x = 0,
        D = St(),
        I = St(),
        O = St(),
        K = St(),
        Y = function (u, c) {
          return u === c && (a = !0), 0;
        },
        ve =
          "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",
        me = "(?:\\\\[\\da-fA-F]{1,6}" + L + "?|\\\\[^\\r\\n\\f]|[\\w-]|[^\0-\\x7f])+",
        R =
          "\\[" +
          L +
          "*(" +
          me +
          ")(?:" +
          L +
          "*([*^$|!~]?=)" +
          L +
          `*(?:'((?:\\\\.|[^\\\\'])*)'|"((?:\\\\.|[^\\\\"])*)"|(` +
          me +
          "))|)" +
          L +
          "*\\]",
        Fe =
          ":(" +
          me +
          `)(?:\\((('((?:\\\\.|[^\\\\'])*)'|"((?:\\\\.|[^\\\\"])*)")|((?:\\\\.|[^\\\\()[\\]]|` +
          R +
          ")*)|.*)\\)|)",
        F = new RegExp(L + "+", "g"),
        V = new RegExp("^" + L + "*," + L + "*"),
        dt = new RegExp("^" + L + "*([>+~]|" + L + ")" + L + "*"),
        Vt = new RegExp(L + "|>"),
        be = new RegExp(Fe),
        pt = new RegExp("^" + me + "$"),
        xe = {
          ID: new RegExp("^#(" + me + ")"),
          CLASS: new RegExp("^\\.(" + me + ")"),
          TAG: new RegExp("^(" + me + "|[*])"),
          ATTR: new RegExp("^" + R),
          PSEUDO: new RegExp("^" + Fe),
          CHILD: new RegExp(
            "^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" +
              L +
              "*(even|odd|(([+-]|)(\\d*)n|)" +
              L +
              "*(?:([+-]|)" +
              L +
              "*(\\d+)|))" +
              L +
              "*\\)|)",
            "i",
          ),
          bool: new RegExp("^(?:" + ve + ")$", "i"),
          needsContext: new RegExp(
            "^" +
              L +
              "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" +
              L +
              "*((?:-\\d)?\\d*)" +
              L +
              "*\\)|)(?=[^-]|$)",
            "i",
          ),
        },
        De = /^(?:input|select|textarea|button)$/i,
        Ne = /^h\d$/i,
        le = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,
        Gt = /[+~]/,
        He = new RegExp("\\\\[\\da-fA-F]{1,6}" + L + "?|\\\\([^\\r\\n\\f])", "g"),
        ke = function (u, c) {
          var p = "0x" + u.slice(1) - 65536;
          return (
            c || (p < 0 ? String.fromCharCode(p + 65536) : String.fromCharCode((p >> 10) | 55296, (p & 1023) | 56320))
          );
        },
        Ur = function () {
          je();
        },
        zr = kt(
          function (u) {
            return u.disabled === !0 && W(u, "fieldset");
          },
          { dir: "parentNode", next: "legend" },
        );
      function Vr() {
        try {
          return o.activeElement;
        } catch (u) {}
      }
      try {
        s.apply((T = Z.call(J.childNodes)), J.childNodes), T[J.childNodes.length].nodeType;
      } catch (u) {
        s = {
          apply: function (c, p) {
            _e.apply(c, Z.call(p));
          },
          call: function (c) {
            _e.apply(c, Z.call(arguments, 1));
          },
        };
      }
      function X(u, c, p, g) {
        var v,
          C,
          w,
          S,
          E,
          $,
          M,
          N = c && c.ownerDocument,
          B = c ? c.nodeType : 9;
        if (((p = p || []), typeof u != "string" || !u || (B !== 1 && B !== 9 && B !== 11))) return p;
        if (!g && (je(c), (c = c || o), f)) {
          if (B !== 11 && (E = le.exec(u)))
            if ((v = E[1])) {
              if (B === 9)
                if ((w = c.getElementById(v))) {
                  if (w.id === v) return s.call(p, w), p;
                } else return p;
              else if (N && (w = N.getElementById(v)) && X.contains(c, w) && w.id === v) return s.call(p, w), p;
            } else {
              if (E[2]) return s.apply(p, c.getElementsByTagName(u)), p;
              if ((v = E[3]) && c.getElementsByClassName) return s.apply(p, c.getElementsByClassName(v)), p;
            }
          if (!K[u + " "] && (!d || !d.test(u))) {
            if (((M = u), (N = c), B === 1 && (Vt.test(u) || dt.test(u)))) {
              for (
                N = (Gt.test(u) && Qt(c.parentNode)) || c,
                  (N != c || !j.scope) &&
                    ((S = c.getAttribute("id")) ? (S = i.escapeSelector(S)) : c.setAttribute("id", (S = m))),
                  $ = ht(u),
                  C = $.length;
                C--;
              )
                $[C] = (S ? "#" + S : ":scope") + " " + Ht($[C]);
              M = $.join(",");
            }
            try {
              return s.apply(p, N.querySelectorAll(M)), p;
            } catch (A) {
              K(u, !0);
            } finally {
              S === m && c.removeAttribute("id");
            }
          }
        }
        return Rn(u.replace(oe, "$1"), c, p, g);
      }
      function St() {
        var u = [];
        function c(p, g) {
          return u.push(p + " ") > t.cacheLength && delete c[u.shift()], (c[p + " "] = g);
        }
        return c;
      }
      function he(u) {
        return (u[m] = !0), u;
      }
      function Ke(u) {
        var c = o.createElement("fieldset");
        try {
          return !!u(c);
        } catch (p) {
          return !1;
        } finally {
          c.parentNode && c.parentNode.removeChild(c), (c = null);
        }
      }
      function Gr(u) {
        return function (c) {
          return W(c, "input") && c.type === u;
        };
      }
      function Qr(u) {
        return function (c) {
          return (W(c, "input") || W(c, "button")) && c.type === u;
        };
      }
      function $n(u) {
        return function (c) {
          return "form" in c
            ? c.parentNode && c.disabled === !1
              ? "label" in c
                ? "label" in c.parentNode
                  ? c.parentNode.disabled === u
                  : c.disabled === u
                : c.isDisabled === u || (c.isDisabled !== !u && zr(c) === u)
              : c.disabled === u
            : "label" in c
              ? c.disabled === u
              : !1;
        };
      }
      function We(u) {
        return he(function (c) {
          return (
            (c = +c),
            he(function (p, g) {
              for (var v, C = u([], p.length, c), w = C.length; w--; ) p[(v = C[w])] && (p[v] = !(g[v] = p[v]));
            })
          );
        });
      }
      function Qt(u) {
        return u && typeof u.getElementsByTagName != "undefined" && u;
      }
      function je(u) {
        var c,
          p = u ? u.ownerDocument || u : J;
        return (
          p == o ||
            p.nodeType !== 9 ||
            !p.documentElement ||
            ((o = p),
            (l = o.documentElement),
            (f = !i.isXMLDoc(o)),
            (y = l.matches || l.webkitMatchesSelector || l.msMatchesSelector),
            l.msMatchesSelector && J != o && (c = o.defaultView) && c.top !== c && c.addEventListener("unload", Ur),
            (j.getById = Ke(function (g) {
              return (l.appendChild(g).id = i.expando), !o.getElementsByName || !o.getElementsByName(i.expando).length;
            })),
            (j.disconnectedMatch = Ke(function (g) {
              return y.call(g, "*");
            })),
            (j.scope = Ke(function () {
              return o.querySelectorAll(":scope");
            })),
            (j.cssHas = Ke(function () {
              try {
                return o.querySelector(":has(*,:jqfake)"), !1;
              } catch (g) {
                return !0;
              }
            })),
            j.getById
              ? ((t.filter.ID = function (g) {
                  var v = g.replace(He, ke);
                  return function (C) {
                    return C.getAttribute("id") === v;
                  };
                }),
                (t.find.ID = function (g, v) {
                  if (typeof v.getElementById != "undefined" && f) {
                    var C = v.getElementById(g);
                    return C ? [C] : [];
                  }
                }))
              : ((t.filter.ID = function (g) {
                  var v = g.replace(He, ke);
                  return function (C) {
                    var w = typeof C.getAttributeNode != "undefined" && C.getAttributeNode("id");
                    return w && w.value === v;
                  };
                }),
                (t.find.ID = function (g, v) {
                  if (typeof v.getElementById != "undefined" && f) {
                    var C,
                      w,
                      S,
                      E = v.getElementById(g);
                    if (E) {
                      if (((C = E.getAttributeNode("id")), C && C.value === g)) return [E];
                      for (S = v.getElementsByName(g), w = 0; (E = S[w++]); )
                        if (((C = E.getAttributeNode("id")), C && C.value === g)) return [E];
                    }
                    return [];
                  }
                })),
            (t.find.TAG = function (g, v) {
              return typeof v.getElementsByTagName != "undefined" ? v.getElementsByTagName(g) : v.querySelectorAll(g);
            }),
            (t.find.CLASS = function (g, v) {
              if (typeof v.getElementsByClassName != "undefined" && f) return v.getElementsByClassName(g);
            }),
            (d = []),
            Ke(function (g) {
              var v;
              (l.appendChild(g).innerHTML =
                "<a id='" +
                m +
                "' href='' disabled='disabled'></a><select id='" +
                m +
                "-\r\\' disabled='disabled'><option selected=''></option></select>"),
                g.querySelectorAll("[selected]").length || d.push("\\[" + L + "*(?:value|" + ve + ")"),
                g.querySelectorAll("[id~=" + m + "-]").length || d.push("~="),
                g.querySelectorAll("a#" + m + "+*").length || d.push(".#.+[+~]"),
                g.querySelectorAll(":checked").length || d.push(":checked"),
                (v = o.createElement("input")),
                v.setAttribute("type", "hidden"),
                g.appendChild(v).setAttribute("name", "D"),
                (l.appendChild(g).disabled = !0),
                g.querySelectorAll(":disabled").length !== 2 && d.push(":enabled", ":disabled"),
                (v = o.createElement("input")),
                v.setAttribute("name", ""),
                g.appendChild(v),
                g.querySelectorAll("[name='']").length || d.push("\\[" + L + "*name" + L + "*=" + L + `*(?:''|"")`);
            }),
            j.cssHas || d.push(":has"),
            (d = d.length && new RegExp(d.join("|"))),
            (Y = function (g, v) {
              if (g === v) return (a = !0), 0;
              var C = !g.compareDocumentPosition - !v.compareDocumentPosition;
              return (
                C ||
                ((C = (g.ownerDocument || g) == (v.ownerDocument || v) ? g.compareDocumentPosition(v) : 1),
                C & 1 || (!j.sortDetached && v.compareDocumentPosition(g) === C)
                  ? g === o || (g.ownerDocument == J && X.contains(J, g))
                    ? -1
                    : v === o || (v.ownerDocument == J && X.contains(J, v))
                      ? 1
                      : r
                        ? ue.call(r, g) - ue.call(r, v)
                        : 0
                  : C & 4
                    ? -1
                    : 1)
              );
            })),
          o
        );
      }
      (X.matches = function (u, c) {
        return X(u, null, null, c);
      }),
        (X.matchesSelector = function (u, c) {
          if ((je(u), f && !K[c + " "] && (!d || !d.test(c))))
            try {
              var p = y.call(u, c);
              if (p || j.disconnectedMatch || (u.document && u.document.nodeType !== 11)) return p;
            } catch (g) {
              K(c, !0);
            }
          return X(c, o, null, [u]).length > 0;
        }),
        (X.contains = function (u, c) {
          return (u.ownerDocument || u) != o && je(u), i.contains(u, c);
        }),
        (X.attr = function (u, c) {
          (u.ownerDocument || u) != o && je(u);
          var p = t.attrHandle[c.toLowerCase()],
            g = p && Ae.call(t.attrHandle, c.toLowerCase()) ? p(u, c, !f) : void 0;
          return g !== void 0 ? g : u.getAttribute(c);
        }),
        (X.error = function (u) {
          throw new Error("Syntax error, unrecognized expression: " + u);
        }),
        (i.uniqueSort = function (u) {
          var c,
            p = [],
            g = 0,
            v = 0;
          if (((a = !j.sortStable), (r = !j.sortStable && Z.call(u, 0)), vt.call(u, Y), a)) {
            for (; (c = u[v++]); ) c === u[v] && (g = p.push(v));
            for (; g--; ) we.call(u, p[g], 1);
          }
          return (r = null), u;
        }),
        (i.fn.uniqueSort = function () {
          return this.pushStack(i.uniqueSort(Z.apply(this)));
        }),
        (t = i.expr =
          {
            cacheLength: 50,
            createPseudo: he,
            match: xe,
            attrHandle: {},
            find: {},
            relative: {
              ">": { dir: "parentNode", first: !0 },
              " ": { dir: "parentNode" },
              "+": { dir: "previousSibling", first: !0 },
              "~": { dir: "previousSibling" },
            },
            preFilter: {
              ATTR: function (u) {
                return (
                  (u[1] = u[1].replace(He, ke)),
                  (u[3] = (u[3] || u[4] || u[5] || "").replace(He, ke)),
                  u[2] === "~=" && (u[3] = " " + u[3] + " "),
                  u.slice(0, 4)
                );
              },
              CHILD: function (u) {
                return (
                  (u[1] = u[1].toLowerCase()),
                  u[1].slice(0, 3) === "nth"
                    ? (u[3] || X.error(u[0]),
                      (u[4] = +(u[4] ? u[5] + (u[6] || 1) : 2 * (u[3] === "even" || u[3] === "odd"))),
                      (u[5] = +(u[7] + u[8] || u[3] === "odd")))
                    : u[3] && X.error(u[0]),
                  u
                );
              },
              PSEUDO: function (u) {
                var c,
                  p = !u[6] && u[2];
                return xe.CHILD.test(u[0])
                  ? null
                  : (u[3]
                      ? (u[2] = u[4] || u[5] || "")
                      : p &&
                        be.test(p) &&
                        (c = ht(p, !0)) &&
                        (c = p.indexOf(")", p.length - c) - p.length) &&
                        ((u[0] = u[0].slice(0, c)), (u[2] = p.slice(0, c))),
                    u.slice(0, 3));
              },
            },
            filter: {
              TAG: function (u) {
                var c = u.replace(He, ke).toLowerCase();
                return u === "*"
                  ? function () {
                      return !0;
                    }
                  : function (p) {
                      return W(p, c);
                    };
              },
              CLASS: function (u) {
                var c = D[u + " "];
                return (
                  c ||
                  ((c = new RegExp("(^|" + L + ")" + u + "(" + L + "|$)")) &&
                    D(u, function (p) {
                      return c.test(
                        (typeof p.className == "string" && p.className) ||
                          (typeof p.getAttribute != "undefined" && p.getAttribute("class")) ||
                          "",
                      );
                    }))
                );
              },
              ATTR: function (u, c, p) {
                return function (g) {
                  var v = X.attr(g, u);
                  return v == null
                    ? c === "!="
                    : c
                      ? ((v += ""),
                        c === "="
                          ? v === p
                          : c === "!="
                            ? v !== p
                            : c === "^="
                              ? p && v.indexOf(p) === 0
                              : c === "*="
                                ? p && v.indexOf(p) > -1
                                : c === "$="
                                  ? p && v.slice(-p.length) === p
                                  : c === "~="
                                    ? (" " + v.replace(F, " ") + " ").indexOf(p) > -1
                                    : c === "|="
                                      ? v === p || v.slice(0, p.length + 1) === p + "-"
                                      : !1)
                      : !0;
                };
              },
              CHILD: function (u, c, p, g, v) {
                var C = u.slice(0, 3) !== "nth",
                  w = u.slice(-4) !== "last",
                  S = c === "of-type";
                return g === 1 && v === 0
                  ? function (E) {
                      return !!E.parentNode;
                    }
                  : function (E, $, M) {
                      var N,
                        B,
                        A,
                        U,
                        se,
                        ee = C !== w ? "nextSibling" : "previousSibling",
                        ce = E.parentNode,
                        Te = S && E.nodeName.toLowerCase(),
                        Ze = !M && !S,
                        ne = !1;
                      if (ce) {
                        if (C) {
                          for (; ee; ) {
                            for (A = E; (A = A[ee]); ) if (S ? W(A, Te) : A.nodeType === 1) return !1;
                            se = ee = u === "only" && !se && "nextSibling";
                          }
                          return !0;
                        }
                        if (((se = [w ? ce.firstChild : ce.lastChild]), w && Ze)) {
                          for (
                            B = ce[m] || (ce[m] = {}),
                              N = B[u] || [],
                              U = N[0] === h && N[1],
                              ne = U && N[2],
                              A = U && ce.childNodes[U];
                            (A = (++U && A && A[ee]) || (ne = U = 0) || se.pop());
                          )
                            if (A.nodeType === 1 && ++ne && A === E) {
                              B[u] = [h, U, ne];
                              break;
                            }
                        } else if (
                          (Ze && ((B = E[m] || (E[m] = {})), (N = B[u] || []), (U = N[0] === h && N[1]), (ne = U)),
                          ne === !1)
                        )
                          for (
                            ;
                            (A = (++U && A && A[ee]) || (ne = U = 0) || se.pop()) &&
                            !(
                              (S ? W(A, Te) : A.nodeType === 1) &&
                              ++ne &&
                              (Ze && ((B = A[m] || (A[m] = {})), (B[u] = [h, ne])), A === E)
                            );
                          );
                        return (ne -= v), ne === g || (ne % g === 0 && ne / g >= 0);
                      }
                    };
              },
              PSEUDO: function (u, c) {
                var p,
                  g = t.pseudos[u] || t.setFilters[u.toLowerCase()] || X.error("unsupported pseudo: " + u);
                return g[m]
                  ? g(c)
                  : g.length > 1
                    ? ((p = [u, u, "", c]),
                      t.setFilters.hasOwnProperty(u.toLowerCase())
                        ? he(function (v, C) {
                            for (var w, S = g(v, c), E = S.length; E--; )
                              (w = ue.call(v, S[E])), (v[w] = !(C[w] = S[E]));
                          })
                        : function (v) {
                            return g(v, 0, p);
                          })
                    : g;
              },
            },
            pseudos: {
              not: he(function (u) {
                var c = [],
                  p = [],
                  g = Zt(u.replace(oe, "$1"));
                return g[m]
                  ? he(function (v, C, w, S) {
                      for (var E, $ = g(v, null, S, []), M = v.length; M--; ) (E = $[M]) && (v[M] = !(C[M] = E));
                    })
                  : function (v, C, w) {
                      return (c[0] = v), g(c, null, w, p), (c[0] = null), !p.pop();
                    };
              }),
              has: he(function (u) {
                return function (c) {
                  return X(u, c).length > 0;
                };
              }),
              contains: he(function (u) {
                return (
                  (u = u.replace(He, ke)),
                  function (c) {
                    return (c.textContent || i.text(c)).indexOf(u) > -1;
                  }
                );
              }),
              lang: he(function (u) {
                return (
                  pt.test(u || "") || X.error("unsupported lang: " + u),
                  (u = u.replace(He, ke).toLowerCase()),
                  function (c) {
                    var p;
                    do
                      if ((p = f ? c.lang : c.getAttribute("xml:lang") || c.getAttribute("lang")))
                        return (p = p.toLowerCase()), p === u || p.indexOf(u + "-") === 0;
                    while ((c = c.parentNode) && c.nodeType === 1);
                    return !1;
                  }
                );
              }),
              target: function (u) {
                var c = k.location && k.location.hash;
                return c && c.slice(1) === u.id;
              },
              root: function (u) {
                return u === l;
              },
              focus: function (u) {
                return u === Vr() && o.hasFocus() && !!(u.type || u.href || ~u.tabIndex);
              },
              enabled: $n(!1),
              disabled: $n(!0),
              checked: function (u) {
                return (W(u, "input") && !!u.checked) || (W(u, "option") && !!u.selected);
              },
              selected: function (u) {
                return u.parentNode && u.parentNode.selectedIndex, u.selected === !0;
              },
              empty: function (u) {
                for (u = u.firstChild; u; u = u.nextSibling) if (u.nodeType < 6) return !1;
                return !0;
              },
              parent: function (u) {
                return !t.pseudos.empty(u);
              },
              header: function (u) {
                return Ne.test(u.nodeName);
              },
              input: function (u) {
                return De.test(u.nodeName);
              },
              button: function (u) {
                return (W(u, "input") && u.type === "button") || W(u, "button");
              },
              text: function (u) {
                var c;
                return (
                  W(u, "input") &&
                  u.type === "text" &&
                  ((c = u.getAttribute("type")) == null || c.toLowerCase() === "text")
                );
              },
              first: We(function () {
                return [0];
              }),
              last: We(function (u, c) {
                return [c - 1];
              }),
              eq: We(function (u, c, p) {
                return [p < 0 ? p + c : p];
              }),
              even: We(function (u, c) {
                for (var p = 0; p < c; p += 2) u.push(p);
                return u;
              }),
              odd: We(function (u, c) {
                for (var p = 1; p < c; p += 2) u.push(p);
                return u;
              }),
              lt: We(function (u, c, p) {
                var g;
                for (p < 0 ? (g = p + c) : p > c ? (g = c) : (g = p); --g >= 0; ) u.push(g);
                return u;
              }),
              gt: We(function (u, c, p) {
                for (var g = p < 0 ? p + c : p; ++g < c; ) u.push(g);
                return u;
              }),
            },
          }),
        (t.pseudos.nth = t.pseudos.eq);
      for (e in { radio: !0, checkbox: !0, file: !0, password: !0, image: !0 }) t.pseudos[e] = Gr(e);
      for (e in { submit: !0, reset: !0 }) t.pseudos[e] = Qr(e);
      function Bn() {}
      (Bn.prototype = t.filters = t.pseudos), (t.setFilters = new Bn());
      function ht(u, c) {
        var p,
          g,
          v,
          C,
          w,
          S,
          E,
          $ = I[u + " "];
        if ($) return c ? 0 : $.slice(0);
        for (w = u, S = [], E = t.preFilter; w; ) {
          (!p || (g = V.exec(w))) && (g && (w = w.slice(g[0].length) || w), S.push((v = []))),
            (p = !1),
            (g = dt.exec(w)) &&
              ((p = g.shift()), v.push({ value: p, type: g[0].replace(oe, " ") }), (w = w.slice(p.length)));
          for (C in t.filter)
            (g = xe[C].exec(w)) &&
              (!E[C] || (g = E[C](g))) &&
              ((p = g.shift()), v.push({ value: p, type: C, matches: g }), (w = w.slice(p.length)));
          if (!p) break;
        }
        return c ? w.length : w ? X.error(u) : I(u, S).slice(0);
      }
      function Ht(u) {
        for (var c = 0, p = u.length, g = ""; c < p; c++) g += u[c].value;
        return g;
      }
      function kt(u, c, p) {
        var g = c.dir,
          v = c.next,
          C = v || g,
          w = p && C === "parentNode",
          S = x++;
        return c.first
          ? function (E, $, M) {
              for (; (E = E[g]); ) if (E.nodeType === 1 || w) return u(E, $, M);
              return !1;
            }
          : function (E, $, M) {
              var N,
                B,
                A = [h, S];
              if (M) {
                for (; (E = E[g]); ) if ((E.nodeType === 1 || w) && u(E, $, M)) return !0;
              } else
                for (; (E = E[g]); )
                  if (E.nodeType === 1 || w)
                    if (((B = E[m] || (E[m] = {})), v && W(E, v))) E = E[g] || E;
                    else {
                      if ((N = B[C]) && N[0] === h && N[1] === S) return (A[2] = N[2]);
                      if (((B[C] = A), (A[2] = u(E, $, M)))) return !0;
                    }
              return !1;
            };
      }
      function Yt(u) {
        return u.length > 1
          ? function (c, p, g) {
              for (var v = u.length; v--; ) if (!u[v](c, p, g)) return !1;
              return !0;
            }
          : u[0];
      }
      function Yr(u, c, p) {
        for (var g = 0, v = c.length; g < v; g++) X(u, c[g], p);
        return p;
      }
      function At(u, c, p, g, v) {
        for (var C, w = [], S = 0, E = u.length, $ = c != null; S < E; S++)
          (C = u[S]) && (!p || p(C, g, v)) && (w.push(C), $ && c.push(S));
        return w;
      }
      function Jt(u, c, p, g, v, C) {
        return (
          g && !g[m] && (g = Jt(g)),
          v && !v[m] && (v = Jt(v, C)),
          he(function (w, S, E, $) {
            var M,
              N,
              B,
              A,
              U = [],
              se = [],
              ee = S.length,
              ce = w || Yr(c || "*", E.nodeType ? [E] : E, []),
              Te = u && (w || !c) ? At(ce, U, u, E, $) : ce;
            if ((p ? ((A = v || (w ? u : ee || g) ? [] : S), p(Te, A, E, $)) : (A = Te), g))
              for (M = At(A, se), g(M, [], E, $), N = M.length; N--; ) (B = M[N]) && (A[se[N]] = !(Te[se[N]] = B));
            if (w) {
              if (v || u) {
                if (v) {
                  for (M = [], N = A.length; N--; ) (B = A[N]) && M.push((Te[N] = B));
                  v(null, (A = []), M, $);
                }
                for (N = A.length; N--; ) (B = A[N]) && (M = v ? ue.call(w, B) : U[N]) > -1 && (w[M] = !(S[M] = B));
              }
            } else (A = At(A === S ? A.splice(ee, A.length) : A)), v ? v(null, S, A, $) : s.apply(S, A);
          })
        );
      }
      function Kt(u) {
        for (
          var c,
            p,
            g,
            v = u.length,
            C = t.relative[u[0].type],
            w = C || t.relative[" "],
            S = C ? 1 : 0,
            E = kt(
              function (N) {
                return N === c;
              },
              w,
              !0,
            ),
            $ = kt(
              function (N) {
                return ue.call(c, N) > -1;
              },
              w,
              !0,
            ),
            M = [
              function (N, B, A) {
                var U = (!C && (A || B != n)) || ((c = B).nodeType ? E(N, B, A) : $(N, B, A));
                return (c = null), U;
              },
            ];
          S < v;
          S++
        )
          if ((p = t.relative[u[S].type])) M = [kt(Yt(M), p)];
          else {
            if (((p = t.filter[u[S].type].apply(null, u[S].matches)), p[m])) {
              for (g = ++S; g < v && !t.relative[u[g].type]; g++);
              return Jt(
                S > 1 && Yt(M),
                S > 1 && Ht(u.slice(0, S - 1).concat({ value: u[S - 2].type === " " ? "*" : "" })).replace(oe, "$1"),
                p,
                S < g && Kt(u.slice(S, g)),
                g < v && Kt((u = u.slice(g))),
                g < v && Ht(u),
              );
            }
            M.push(p);
          }
        return Yt(M);
      }
      function Jr(u, c) {
        var p = c.length > 0,
          g = u.length > 0,
          v = function (C, w, S, E, $) {
            var M,
              N,
              B,
              A = 0,
              U = "0",
              se = C && [],
              ee = [],
              ce = n,
              Te = C || (g && t.find.TAG("*", $)),
              Ze = (h += ce == null ? 1 : Math.random() || 0.1),
              ne = Te.length;
            for ($ && (n = w == o || w || $); U !== ne && (M = Te[U]) != null; U++) {
              if (g && M) {
                for (N = 0, !w && M.ownerDocument != o && (je(M), (S = !f)); (B = u[N++]); )
                  if (B(M, w || o, S)) {
                    s.call(E, M);
                    break;
                  }
                $ && (h = Ze);
              }
              p && ((M = !B && M) && A--, C && se.push(M));
            }
            if (((A += U), p && U !== A)) {
              for (N = 0; (B = c[N++]); ) B(se, ee, w, S);
              if (C) {
                if (A > 0) for (; U--; ) se[U] || ee[U] || (ee[U] = rt.call(E));
                ee = At(ee);
              }
              s.apply(E, ee), $ && !C && ee.length > 0 && A + c.length > 1 && i.uniqueSort(E);
            }
            return $ && ((h = Ze), (n = ce)), se;
          };
        return p ? he(v) : v;
      }
      function Zt(u, c) {
        var p,
          g = [],
          v = [],
          C = O[u + " "];
        if (!C) {
          for (c || (c = ht(u)), p = c.length; p--; ) (C = Kt(c[p])), C[m] ? g.push(C) : v.push(C);
          (C = O(u, Jr(v, g))), (C.selector = u);
        }
        return C;
      }
      function Rn(u, c, p, g) {
        var v,
          C,
          w,
          S,
          E,
          $ = typeof u == "function" && u,
          M = !g && ht((u = $.selector || u));
        if (((p = p || []), M.length === 1)) {
          if (
            ((C = M[0] = M[0].slice(0)),
            C.length > 2 && (w = C[0]).type === "ID" && c.nodeType === 9 && f && t.relative[C[1].type])
          ) {
            if (((c = (t.find.ID(w.matches[0].replace(He, ke), c) || [])[0]), c)) $ && (c = c.parentNode);
            else return p;
            u = u.slice(C.shift().value.length);
          }
          for (v = xe.needsContext.test(u) ? 0 : C.length; v-- && ((w = C[v]), !t.relative[(S = w.type)]); )
            if (
              (E = t.find[S]) &&
              (g = E(w.matches[0].replace(He, ke), (Gt.test(C[0].type) && Qt(c.parentNode)) || c))
            ) {
              if ((C.splice(v, 1), (u = g.length && Ht(C)), !u)) return s.apply(p, g), p;
              break;
            }
        }
        return ($ || Zt(u, M))(g, c, !f, p, !c || (Gt.test(u) && Qt(c.parentNode)) || c), p;
      }
      (j.sortStable = m.split("").sort(Y).join("") === m),
        je(),
        (j.sortDetached = Ke(function (u) {
          return u.compareDocumentPosition(o.createElement("fieldset")) & 1;
        })),
        (i.find = X),
        (i.expr[":"] = i.expr.pseudos),
        (i.unique = i.uniqueSort),
        (X.compile = Zt),
        (X.select = Rn),
        (X.setDocument = je),
        (X.tokenize = ht),
        (X.escape = i.escapeSelector),
        (X.getText = i.text),
        (X.isXML = i.isXMLDoc),
        (X.selectors = i.expr),
        (X.support = i.support),
        (X.uniqueSort = i.uniqueSort);
    })();
    var Xe = function (e, t, n) {
        for (var r = [], a = n !== void 0; (e = e[t]) && e.nodeType !== 9; )
          if (e.nodeType === 1) {
            if (a && i(e).is(n)) break;
            r.push(e);
          }
        return r;
      },
      en = function (e, t) {
        for (var n = []; e; e = e.nextSibling) e.nodeType === 1 && e !== t && n.push(e);
        return n;
      },
      tn = i.expr.match.needsContext,
      nn = /^<([a-z][^\/\0>:\x20\t\r\n\f]*)[\x20\t\r\n\f]*\/?>(?:<\/\1>|)$/i;
    function Dt(e, t, n) {
      return q(t)
        ? i.grep(e, function (r, a) {
            return !!t.call(r, a, r) !== n;
          })
        : t.nodeType
          ? i.grep(e, function (r) {
              return (r === t) !== n;
            })
          : typeof t != "string"
            ? i.grep(e, function (r) {
                return ue.call(t, r) > -1 !== n;
              })
            : i.filter(t, e, n);
    }
    (i.filter = function (e, t, n) {
      var r = t[0];
      return (
        n && (e = ":not(" + e + ")"),
        t.length === 1 && r.nodeType === 1
          ? i.find.matchesSelector(r, e)
            ? [r]
            : []
          : i.find.matches(
              e,
              i.grep(t, function (a) {
                return a.nodeType === 1;
              }),
            )
      );
    }),
      i.fn.extend({
        find: function (e) {
          var t,
            n,
            r = this.length,
            a = this;
          if (typeof e != "string")
            return this.pushStack(
              i(e).filter(function () {
                for (t = 0; t < r; t++) if (i.contains(a[t], this)) return !0;
              }),
            );
          for (n = this.pushStack([]), t = 0; t < r; t++) i.find(e, a[t], n);
          return r > 1 ? i.uniqueSort(n) : n;
        },
        filter: function (e) {
          return this.pushStack(Dt(this, e || [], !1));
        },
        not: function (e) {
          return this.pushStack(Dt(this, e || [], !0));
        },
        is: function (e) {
          return !!Dt(this, typeof e == "string" && tn.test(e) ? i(e) : e || [], !1).length;
        },
      });
    var rn,
      Jn = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]+))$/,
      Kn = (i.fn.init = function (e, t, n) {
        var r, a;
        if (!e) return this;
        if (((n = n || rn), typeof e == "string"))
          if (
            (e[0] === "<" && e[e.length - 1] === ">" && e.length >= 3 ? (r = [null, e, null]) : (r = Jn.exec(e)),
            r && (r[1] || !t))
          )
            if (r[1]) {
              if (
                ((t = t instanceof i ? t[0] : t),
                i.merge(this, i.parseHTML(r[1], t && t.nodeType ? t.ownerDocument || t : _, !0)),
                nn.test(r[1]) && i.isPlainObject(t))
              )
                for (r in t) q(this[r]) ? this[r](t[r]) : this.attr(r, t[r]);
              return this;
            } else return (a = _.getElementById(r[2])), a && ((this[0] = a), (this.length = 1)), this;
          else return !t || t.jquery ? (t || n).find(e) : this.constructor(t).find(e);
        else {
          if (e.nodeType) return (this[0] = e), (this.length = 1), this;
          if (q(e)) return n.ready !== void 0 ? n.ready(e) : e(i);
        }
        return i.makeArray(e, this);
      });
    (Kn.prototype = i.fn), (rn = i(_));
    var Zn = /^(?:parents|prev(?:Until|All))/,
      er = { children: !0, contents: !0, next: !0, prev: !0 };
    i.fn.extend({
      has: function (e) {
        var t = i(e, this),
          n = t.length;
        return this.filter(function () {
          for (var r = 0; r < n; r++) if (i.contains(this, t[r])) return !0;
        });
      },
      closest: function (e, t) {
        var n,
          r = 0,
          a = this.length,
          s = [],
          o = typeof e != "string" && i(e);
        if (!tn.test(e)) {
          for (; r < a; r++)
            for (n = this[r]; n && n !== t; n = n.parentNode)
              if (n.nodeType < 11 && (o ? o.index(n) > -1 : n.nodeType === 1 && i.find.matchesSelector(n, e))) {
                s.push(n);
                break;
              }
        }
        return this.pushStack(s.length > 1 ? i.uniqueSort(s) : s);
      },
      index: function (e) {
        return e
          ? typeof e == "string"
            ? ue.call(i(e), this[0])
            : ue.call(this, e.jquery ? e[0] : e)
          : this[0] && this[0].parentNode
            ? this.first().prevAll().length
            : -1;
      },
      add: function (e, t) {
        return this.pushStack(i.uniqueSort(i.merge(this.get(), i(e, t))));
      },
      addBack: function (e) {
        return this.add(e == null ? this.prevObject : this.prevObject.filter(e));
      },
    });
    function an(e, t) {
      for (; (e = e[t]) && e.nodeType !== 1; );
      return e;
    }
    i.each(
      {
        parent: function (e) {
          var t = e.parentNode;
          return t && t.nodeType !== 11 ? t : null;
        },
        parents: function (e) {
          return Xe(e, "parentNode");
        },
        parentsUntil: function (e, t, n) {
          return Xe(e, "parentNode", n);
        },
        next: function (e) {
          return an(e, "nextSibling");
        },
        prev: function (e) {
          return an(e, "previousSibling");
        },
        nextAll: function (e) {
          return Xe(e, "nextSibling");
        },
        prevAll: function (e) {
          return Xe(e, "previousSibling");
        },
        nextUntil: function (e, t, n) {
          return Xe(e, "nextSibling", n);
        },
        prevUntil: function (e, t, n) {
          return Xe(e, "previousSibling", n);
        },
        siblings: function (e) {
          return en((e.parentNode || {}).firstChild, e);
        },
        children: function (e) {
          return en(e.firstChild);
        },
        contents: function (e) {
          return e.contentDocument != null && P(e.contentDocument)
            ? e.contentDocument
            : (W(e, "template") && (e = e.content || e), i.merge([], e.childNodes));
        },
      },
      function (e, t) {
        i.fn[e] = function (n, r) {
          var a = i.map(this, t, n);
          return (
            e.slice(-5) !== "Until" && (r = n),
            r && typeof r == "string" && (a = i.filter(r, a)),
            this.length > 1 && (er[e] || i.uniqueSort(a), Zn.test(e) && a.reverse()),
            this.pushStack(a)
          );
        };
      },
    );
    var ge = /[^\x20\t\r\n\f]+/g;
    function tr(e) {
      var t = {};
      return (
        i.each(e.match(ge) || [], function (n, r) {
          t[r] = !0;
        }),
        t
      );
    }
    i.Callbacks = function (e) {
      e = typeof e == "string" ? tr(e) : i.extend({}, e);
      var t,
        n,
        r,
        a,
        s = [],
        o = [],
        l = -1,
        f = function () {
          for (a = a || e.once, r = t = !0; o.length; l = -1)
            for (n = o.shift(); ++l < s.length; )
              s[l].apply(n[0], n[1]) === !1 && e.stopOnFalse && ((l = s.length), (n = !1));
          e.memory || (n = !1), (t = !1), a && (n ? (s = []) : (s = ""));
        },
        d = {
          add: function () {
            return (
              s &&
                (n && !t && ((l = s.length - 1), o.push(n)),
                (function y(m) {
                  i.each(m, function (h, x) {
                    q(x) ? (!e.unique || !d.has(x)) && s.push(x) : x && x.length && Q(x) !== "string" && y(x);
                  });
                })(arguments),
                n && !t && f()),
              this
            );
          },
          remove: function () {
            return (
              i.each(arguments, function (y, m) {
                for (var h; (h = i.inArray(m, s, h)) > -1; ) s.splice(h, 1), h <= l && l--;
              }),
              this
            );
          },
          has: function (y) {
            return y ? i.inArray(y, s) > -1 : s.length > 0;
          },
          empty: function () {
            return s && (s = []), this;
          },
          disable: function () {
            return (a = o = []), (s = n = ""), this;
          },
          disabled: function () {
            return !s;
          },
          lock: function () {
            return (a = o = []), !n && !t && (s = n = ""), this;
          },
          locked: function () {
            return !!a;
          },
          fireWith: function (y, m) {
            return a || ((m = m || []), (m = [y, m.slice ? m.slice() : m]), o.push(m), t || f()), this;
          },
          fire: function () {
            return d.fireWith(this, arguments), this;
          },
          fired: function () {
            return !!r;
          },
        };
      return d;
    };
    function Ue(e) {
      return e;
    }
    function mt(e) {
      throw e;
    }
    function sn(e, t, n, r) {
      var a;
      try {
        e && q((a = e.promise))
          ? a.call(e).done(t).fail(n)
          : e && q((a = e.then))
            ? a.call(e, t, n)
            : t.apply(void 0, [e].slice(r));
      } catch (s) {
        n.apply(void 0, [s]);
      }
    }
    i.extend({
      Deferred: function (e) {
        var t = [
            ["notify", "progress", i.Callbacks("memory"), i.Callbacks("memory"), 2],
            ["resolve", "done", i.Callbacks("once memory"), i.Callbacks("once memory"), 0, "resolved"],
            ["reject", "fail", i.Callbacks("once memory"), i.Callbacks("once memory"), 1, "rejected"],
          ],
          n = "pending",
          r = {
            state: function () {
              return n;
            },
            always: function () {
              return a.done(arguments).fail(arguments), this;
            },
            catch: function (s) {
              return r.then(null, s);
            },
            pipe: function () {
              var s = arguments;
              return i
                .Deferred(function (o) {
                  i.each(t, function (l, f) {
                    var d = q(s[f[4]]) && s[f[4]];
                    a[f[1]](function () {
                      var y = d && d.apply(this, arguments);
                      y && q(y.promise)
                        ? y.promise().progress(o.notify).done(o.resolve).fail(o.reject)
                        : o[f[0] + "With"](this, d ? [y] : arguments);
                    });
                  }),
                    (s = null);
                })
                .promise();
            },
            then: function (s, o, l) {
              var f = 0;
              function d(y, m, h, x) {
                return function () {
                  var D = this,
                    I = arguments,
                    O = function () {
                      var Y, ve;
                      if (!(y < f)) {
                        if (((Y = h.apply(D, I)), Y === m.promise())) throw new TypeError("Thenable self-resolution");
                        (ve = Y && (typeof Y == "object" || typeof Y == "function") && Y.then),
                          q(ve)
                            ? x
                              ? ve.call(Y, d(f, m, Ue, x), d(f, m, mt, x))
                              : (f++, ve.call(Y, d(f, m, Ue, x), d(f, m, mt, x), d(f, m, Ue, m.notifyWith)))
                            : (h !== Ue && ((D = void 0), (I = [Y])), (x || m.resolveWith)(D, I));
                      }
                    },
                    K = x
                      ? O
                      : function () {
                          try {
                            O();
                          } catch (Y) {
                            i.Deferred.exceptionHook && i.Deferred.exceptionHook(Y, K.error),
                              y + 1 >= f && (h !== mt && ((D = void 0), (I = [Y])), m.rejectWith(D, I));
                          }
                        };
                  y
                    ? K()
                    : (i.Deferred.getErrorHook
                        ? (K.error = i.Deferred.getErrorHook())
                        : i.Deferred.getStackHook && (K.error = i.Deferred.getStackHook()),
                      k.setTimeout(K));
                };
              }
              return i
                .Deferred(function (y) {
                  t[0][3].add(d(0, y, q(l) ? l : Ue, y.notifyWith)),
                    t[1][3].add(d(0, y, q(s) ? s : Ue)),
                    t[2][3].add(d(0, y, q(o) ? o : mt));
                })
                .promise();
            },
            promise: function (s) {
              return s != null ? i.extend(s, r) : r;
            },
          },
          a = {};
        return (
          i.each(t, function (s, o) {
            var l = o[2],
              f = o[5];
            (r[o[1]] = l.add),
              f &&
                l.add(
                  function () {
                    n = f;
                  },
                  t[3 - s][2].disable,
                  t[3 - s][3].disable,
                  t[0][2].lock,
                  t[0][3].lock,
                ),
              l.add(o[3].fire),
              (a[o[0]] = function () {
                return a[o[0] + "With"](this === a ? void 0 : this, arguments), this;
              }),
              (a[o[0] + "With"] = l.fireWith);
          }),
          r.promise(a),
          e && e.call(a, a),
          a
        );
      },
      when: function (e) {
        var t = arguments.length,
          n = t,
          r = Array(n),
          a = Z.call(arguments),
          s = i.Deferred(),
          o = function (l) {
            return function (f) {
              (r[l] = this), (a[l] = arguments.length > 1 ? Z.call(arguments) : f), --t || s.resolveWith(r, a);
            };
          };
        if (t <= 1 && (sn(e, s.done(o(n)).resolve, s.reject, !t), s.state() === "pending" || q(a[n] && a[n].then)))
          return s.then();
        for (; n--; ) sn(a[n], o(n), s.reject);
        return s.promise();
      },
    });
    var nr = /^(Eval|Internal|Range|Reference|Syntax|Type|URI)Error$/;
    (i.Deferred.exceptionHook = function (e, t) {
      k.console &&
        k.console.warn &&
        e &&
        nr.test(e.name) &&
        k.console.warn("jQuery.Deferred exception: " + e.message, e.stack, t);
    }),
      (i.readyException = function (e) {
        k.setTimeout(function () {
          throw e;
        });
      });
    var Nt = i.Deferred();
    (i.fn.ready = function (e) {
      return (
        Nt.then(e).catch(function (t) {
          i.readyException(t);
        }),
        this
      );
    }),
      i.extend({
        isReady: !1,
        readyWait: 1,
        ready: function (e) {
          (e === !0 ? --i.readyWait : i.isReady) ||
            ((i.isReady = !0), !(e !== !0 && --i.readyWait > 0) && Nt.resolveWith(_, [i]));
        },
      }),
      (i.ready.then = Nt.then);
    function bt() {
      _.removeEventListener("DOMContentLoaded", bt), k.removeEventListener("load", bt), i.ready();
    }
    _.readyState === "complete" || (_.readyState !== "loading" && !_.documentElement.doScroll)
      ? k.setTimeout(i.ready)
      : (_.addEventListener("DOMContentLoaded", bt), k.addEventListener("load", bt));
    var Ee = function (e, t, n, r, a, s, o) {
        var l = 0,
          f = e.length,
          d = n == null;
        if (Q(n) === "object") {
          a = !0;
          for (l in n) Ee(e, t, l, n[l], !0, s, o);
        } else if (
          r !== void 0 &&
          ((a = !0),
          q(r) || (o = !0),
          d &&
            (o
              ? (t.call(e, r), (t = null))
              : ((d = t),
                (t = function (y, m, h) {
                  return d.call(i(y), h);
                }))),
          t)
        )
          for (; l < f; l++) t(e[l], n, o ? r : r.call(e[l], l, t(e[l], n)));
        return a ? e : d ? t.call(e) : f ? t(e[0], n) : s;
      },
      rr = /^-ms-/,
      ir = /-([a-z])/g;
    function ar(e, t) {
      return t.toUpperCase();
    }
    function ye(e) {
      return e.replace(rr, "ms-").replace(ir, ar);
    }
    var it = function (e) {
      return e.nodeType === 1 || e.nodeType === 9 || !+e.nodeType;
    };
    function at() {
      this.expando = i.expando + at.uid++;
    }
    (at.uid = 1),
      (at.prototype = {
        cache: function (e) {
          var t = e[this.expando];
          return (
            t ||
              ((t = {}),
              it(e) &&
                (e.nodeType
                  ? (e[this.expando] = t)
                  : Object.defineProperty(e, this.expando, { value: t, configurable: !0 }))),
            t
          );
        },
        set: function (e, t, n) {
          var r,
            a = this.cache(e);
          if (typeof t == "string") a[ye(t)] = n;
          else for (r in t) a[ye(r)] = t[r];
          return a;
        },
        get: function (e, t) {
          return t === void 0 ? this.cache(e) : e[this.expando] && e[this.expando][ye(t)];
        },
        access: function (e, t, n) {
          return t === void 0 || (t && typeof t == "string" && n === void 0)
            ? this.get(e, t)
            : (this.set(e, t, n), n !== void 0 ? n : t);
        },
        remove: function (e, t) {
          var n,
            r = e[this.expando];
          if (r !== void 0) {
            if (t !== void 0)
              for (
                Array.isArray(t) ? (t = t.map(ye)) : ((t = ye(t)), (t = (t in r) ? [t] : t.match(ge) || [])),
                  n = t.length;
                n--;
              )
                delete r[t[n]];
            (t === void 0 || i.isEmptyObject(r)) && (e.nodeType ? (e[this.expando] = void 0) : delete e[this.expando]);
          }
        },
        hasData: function (e) {
          var t = e[this.expando];
          return t !== void 0 && !i.isEmptyObject(t);
        },
      });
    var H = new at(),
      re = new at(),
      sr = /^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,
      or = /[A-Z]/g;
    function ur(e) {
      return e === "true"
        ? !0
        : e === "false"
          ? !1
          : e === "null"
            ? null
            : e === +e + ""
              ? +e
              : sr.test(e)
                ? JSON.parse(e)
                : e;
    }
    function on(e, t, n) {
      var r;
      if (n === void 0 && e.nodeType === 1)
        if (((r = "data-" + t.replace(or, "-$&").toLowerCase()), (n = e.getAttribute(r)), typeof n == "string")) {
          try {
            n = ur(n);
          } catch (a) {}
          re.set(e, t, n);
        } else n = void 0;
      return n;
    }
    i.extend({
      hasData: function (e) {
        return re.hasData(e) || H.hasData(e);
      },
      data: function (e, t, n) {
        return re.access(e, t, n);
      },
      removeData: function (e, t) {
        re.remove(e, t);
      },
      _data: function (e, t, n) {
        return H.access(e, t, n);
      },
      _removeData: function (e, t) {
        H.remove(e, t);
      },
    }),
      i.fn.extend({
        data: function (e, t) {
          var n,
            r,
            a,
            s = this[0],
            o = s && s.attributes;
          if (e === void 0) {
            if (this.length && ((a = re.get(s)), s.nodeType === 1 && !H.get(s, "hasDataAttrs"))) {
              for (n = o.length; n--; )
                o[n] && ((r = o[n].name), r.indexOf("data-") === 0 && ((r = ye(r.slice(5))), on(s, r, a[r])));
              H.set(s, "hasDataAttrs", !0);
            }
            return a;
          }
          return typeof e == "object"
            ? this.each(function () {
                re.set(this, e);
              })
            : Ee(
                this,
                function (l) {
                  var f;
                  if (s && l === void 0)
                    return (f = re.get(s, e)), f !== void 0 || ((f = on(s, e)), f !== void 0) ? f : void 0;
                  this.each(function () {
                    re.set(this, e, l);
                  });
                },
                null,
                t,
                arguments.length > 1,
                null,
                !0,
              );
        },
        removeData: function (e) {
          return this.each(function () {
            re.remove(this, e);
          });
        },
      }),
      i.extend({
        queue: function (e, t, n) {
          var r;
          if (e)
            return (
              (t = (t || "fx") + "queue"),
              (r = H.get(e, t)),
              n && (!r || Array.isArray(n) ? (r = H.access(e, t, i.makeArray(n))) : r.push(n)),
              r || []
            );
        },
        dequeue: function (e, t) {
          t = t || "fx";
          var n = i.queue(e, t),
            r = n.length,
            a = n.shift(),
            s = i._queueHooks(e, t),
            o = function () {
              i.dequeue(e, t);
            };
          a === "inprogress" && ((a = n.shift()), r--),
            a && (t === "fx" && n.unshift("inprogress"), delete s.stop, a.call(e, o, s)),
            !r && s && s.empty.fire();
        },
        _queueHooks: function (e, t) {
          var n = t + "queueHooks";
          return (
            H.get(e, n) ||
            H.access(e, n, {
              empty: i.Callbacks("once memory").add(function () {
                H.remove(e, [t + "queue", n]);
              }),
            })
          );
        },
      }),
      i.fn.extend({
        queue: function (e, t) {
          var n = 2;
          return (
            typeof e != "string" && ((t = e), (e = "fx"), n--),
            arguments.length < n
              ? i.queue(this[0], e)
              : t === void 0
                ? this
                : this.each(function () {
                    var r = i.queue(this, e, t);
                    i._queueHooks(this, e), e === "fx" && r[0] !== "inprogress" && i.dequeue(this, e);
                  })
          );
        },
        dequeue: function (e) {
          return this.each(function () {
            i.dequeue(this, e);
          });
        },
        clearQueue: function (e) {
          return this.queue(e || "fx", []);
        },
        promise: function (e, t) {
          var n,
            r = 1,
            a = i.Deferred(),
            s = this,
            o = this.length,
            l = function () {
              --r || a.resolveWith(s, [s]);
            };
          for (typeof e != "string" && ((t = e), (e = void 0)), e = e || "fx"; o--; )
            (n = H.get(s[o], e + "queueHooks")), n && n.empty && (r++, n.empty.add(l));
          return l(), a.promise(t);
        },
      });
    var un = /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,
      st = new RegExp("^(?:([+-])=|)(" + un + ")([a-z%]*)$", "i"),
      Se = ["Top", "Right", "Bottom", "Left"],
      Be = _.documentElement,
      ze = function (e) {
        return i.contains(e.ownerDocument, e);
      },
      fr = { composed: !0 };
    Be.getRootNode &&
      (ze = function (e) {
        return i.contains(e.ownerDocument, e) || e.getRootNode(fr) === e.ownerDocument;
      });
    var xt = function (e, t) {
      return (
        (e = t || e), e.style.display === "none" || (e.style.display === "" && ze(e) && i.css(e, "display") === "none")
      );
    };
    function fn(e, t, n, r) {
      var a,
        s,
        o = 20,
        l = r
          ? function () {
              return r.cur();
            }
          : function () {
              return i.css(e, t, "");
            },
        f = l(),
        d = (n && n[3]) || (i.cssNumber[t] ? "" : "px"),
        y = e.nodeType && (i.cssNumber[t] || (d !== "px" && +f)) && st.exec(i.css(e, t));
      if (y && y[3] !== d) {
        for (f = f / 2, d = d || y[3], y = +f || 1; o--; )
          i.style(e, t, y + d), (1 - s) * (1 - (s = l() / f || 0.5)) <= 0 && (o = 0), (y = y / s);
        (y = y * 2), i.style(e, t, y + d), (n = n || []);
      }
      return (
        n &&
          ((y = +y || +f || 0),
          (a = n[1] ? y + (n[1] + 1) * n[2] : +n[2]),
          r && ((r.unit = d), (r.start = y), (r.end = a))),
        a
      );
    }
    var ln = {};
    function lr(e) {
      var t,
        n = e.ownerDocument,
        r = e.nodeName,
        a = ln[r];
      return (
        a ||
        ((t = n.body.appendChild(n.createElement(r))),
        (a = i.css(t, "display")),
        t.parentNode.removeChild(t),
        a === "none" && (a = "block"),
        (ln[r] = a),
        a)
      );
    }
    function Ve(e, t) {
      for (var n, r, a = [], s = 0, o = e.length; s < o; s++)
        (r = e[s]),
          r.style &&
            ((n = r.style.display),
            t
              ? (n === "none" && ((a[s] = H.get(r, "display") || null), a[s] || (r.style.display = "")),
                r.style.display === "" && xt(r) && (a[s] = lr(r)))
              : n !== "none" && ((a[s] = "none"), H.set(r, "display", n)));
      for (s = 0; s < o; s++) a[s] != null && (e[s].style.display = a[s]);
      return e;
    }
    i.fn.extend({
      show: function () {
        return Ve(this, !0);
      },
      hide: function () {
        return Ve(this);
      },
      toggle: function (e) {
        return typeof e == "boolean"
          ? e
            ? this.show()
            : this.hide()
          : this.each(function () {
              xt(this) ? i(this).show() : i(this).hide();
            });
      },
    });
    var ot = /^(?:checkbox|radio)$/i,
      cn = /<([a-z][^\/\0>\x20\t\r\n\f]*)/i,
      dn = /^$|^module$|\/(?:java|ecma)script/i;
    (function () {
      var e = _.createDocumentFragment(),
        t = e.appendChild(_.createElement("div")),
        n = _.createElement("input");
      n.setAttribute("type", "radio"),
        n.setAttribute("checked", "checked"),
        n.setAttribute("name", "t"),
        t.appendChild(n),
        (j.checkClone = t.cloneNode(!0).cloneNode(!0).lastChild.checked),
        (t.innerHTML = "<textarea>x</textarea>"),
        (j.noCloneChecked = !!t.cloneNode(!0).lastChild.defaultValue),
        (t.innerHTML = "<option></option>"),
        (j.option = !!t.lastChild);
    })();
    var fe = {
      thead: [1, "<table>", "</table>"],
      col: [2, "<table><colgroup>", "</colgroup></table>"],
      tr: [2, "<table><tbody>", "</tbody></table>"],
      td: [3, "<table><tbody><tr>", "</tr></tbody></table>"],
      _default: [0, "", ""],
    };
    (fe.tbody = fe.tfoot = fe.colgroup = fe.caption = fe.thead),
      (fe.th = fe.td),
      j.option || (fe.optgroup = fe.option = [1, "<select multiple='multiple'>", "</select>"]);
    function ie(e, t) {
      var n;
      return (
        typeof e.getElementsByTagName != "undefined"
          ? (n = e.getElementsByTagName(t || "*"))
          : typeof e.querySelectorAll != "undefined"
            ? (n = e.querySelectorAll(t || "*"))
            : (n = []),
        t === void 0 || (t && W(e, t)) ? i.merge([e], n) : n
      );
    }
    function jt(e, t) {
      for (var n = 0, r = e.length; n < r; n++) H.set(e[n], "globalEval", !t || H.get(t[n], "globalEval"));
    }
    var cr = /<|&#?\w+;/;
    function pn(e, t, n, r, a) {
      for (var s, o, l, f, d, y, m = t.createDocumentFragment(), h = [], x = 0, D = e.length; x < D; x++)
        if (((s = e[x]), s || s === 0))
          if (Q(s) === "object") i.merge(h, s.nodeType ? [s] : s);
          else if (!cr.test(s)) h.push(t.createTextNode(s));
          else {
            for (
              o = o || m.appendChild(t.createElement("div")),
                l = (cn.exec(s) || ["", ""])[1].toLowerCase(),
                f = fe[l] || fe._default,
                o.innerHTML = f[1] + i.htmlPrefilter(s) + f[2],
                y = f[0];
              y--;
            )
              o = o.lastChild;
            i.merge(h, o.childNodes), (o = m.firstChild), (o.textContent = "");
          }
      for (m.textContent = "", x = 0; (s = h[x++]); ) {
        if (r && i.inArray(s, r) > -1) {
          a && a.push(s);
          continue;
        }
        if (((d = ze(s)), (o = ie(m.appendChild(s), "script")), d && jt(o), n))
          for (y = 0; (s = o[y++]); ) dn.test(s.type || "") && n.push(s);
      }
      return m;
    }
    var hn = /^([^.]*)(?:\.(.+)|)/;
    function Ge() {
      return !0;
    }
    function Qe() {
      return !1;
    }
    function qt(e, t, n, r, a, s) {
      var o, l;
      if (typeof t == "object") {
        typeof n != "string" && ((r = r || n), (n = void 0));
        for (l in t) qt(e, l, n, r, t[l], s);
        return e;
      }
      if (
        (r == null && a == null
          ? ((a = n), (r = n = void 0))
          : a == null && (typeof n == "string" ? ((a = r), (r = void 0)) : ((a = r), (r = n), (n = void 0))),
        a === !1)
      )
        a = Qe;
      else if (!a) return e;
      return (
        s === 1 &&
          ((o = a),
          (a = function (f) {
            return i().off(f), o.apply(this, arguments);
          }),
          (a.guid = o.guid || (o.guid = i.guid++))),
        e.each(function () {
          i.event.add(this, t, a, r, n);
        })
      );
    }
    i.event = {
      global: {},
      add: function (e, t, n, r, a) {
        var s,
          o,
          l,
          f,
          d,
          y,
          m,
          h,
          x,
          D,
          I,
          O = H.get(e);
        if (it(e))
          for (
            n.handler && ((s = n), (n = s.handler), (a = s.selector)),
              a && i.find.matchesSelector(Be, a),
              n.guid || (n.guid = i.guid++),
              (f = O.events) || (f = O.events = Object.create(null)),
              (o = O.handle) ||
                (o = O.handle =
                  function (K) {
                    return typeof i != "undefined" && i.event.triggered !== K.type
                      ? i.event.dispatch.apply(e, arguments)
                      : void 0;
                  }),
              t = (t || "").match(ge) || [""],
              d = t.length;
            d--;
          )
            (l = hn.exec(t[d]) || []),
              (x = I = l[1]),
              (D = (l[2] || "").split(".").sort()),
              x &&
                ((m = i.event.special[x] || {}),
                (x = (a ? m.delegateType : m.bindType) || x),
                (m = i.event.special[x] || {}),
                (y = i.extend(
                  {
                    type: x,
                    origType: I,
                    data: r,
                    handler: n,
                    guid: n.guid,
                    selector: a,
                    needsContext: a && i.expr.match.needsContext.test(a),
                    namespace: D.join("."),
                  },
                  s,
                )),
                (h = f[x]) ||
                  ((h = f[x] = []),
                  (h.delegateCount = 0),
                  (!m.setup || m.setup.call(e, r, D, o) === !1) && e.addEventListener && e.addEventListener(x, o)),
                m.add && (m.add.call(e, y), y.handler.guid || (y.handler.guid = n.guid)),
                a ? h.splice(h.delegateCount++, 0, y) : h.push(y),
                (i.event.global[x] = !0));
      },
      remove: function (e, t, n, r, a) {
        var s,
          o,
          l,
          f,
          d,
          y,
          m,
          h,
          x,
          D,
          I,
          O = H.hasData(e) && H.get(e);
        if (!(!O || !(f = O.events))) {
          for (t = (t || "").match(ge) || [""], d = t.length; d--; ) {
            if (((l = hn.exec(t[d]) || []), (x = I = l[1]), (D = (l[2] || "").split(".").sort()), !x)) {
              for (x in f) i.event.remove(e, x + t[d], n, r, !0);
              continue;
            }
            for (
              m = i.event.special[x] || {},
                x = (r ? m.delegateType : m.bindType) || x,
                h = f[x] || [],
                l = l[2] && new RegExp("(^|\\.)" + D.join("\\.(?:.*\\.|)") + "(\\.|$)"),
                o = s = h.length;
              s--;
            )
              (y = h[s]),
                (a || I === y.origType) &&
                  (!n || n.guid === y.guid) &&
                  (!l || l.test(y.namespace)) &&
                  (!r || r === y.selector || (r === "**" && y.selector)) &&
                  (h.splice(s, 1), y.selector && h.delegateCount--, m.remove && m.remove.call(e, y));
            o &&
              !h.length &&
              ((!m.teardown || m.teardown.call(e, D, O.handle) === !1) && i.removeEvent(e, x, O.handle), delete f[x]);
          }
          i.isEmptyObject(f) && H.remove(e, "handle events");
        }
      },
      dispatch: function (e) {
        var t,
          n,
          r,
          a,
          s,
          o,
          l = new Array(arguments.length),
          f = i.event.fix(e),
          d = (H.get(this, "events") || Object.create(null))[f.type] || [],
          y = i.event.special[f.type] || {};
        for (l[0] = f, t = 1; t < arguments.length; t++) l[t] = arguments[t];
        if (((f.delegateTarget = this), !(y.preDispatch && y.preDispatch.call(this, f) === !1))) {
          for (o = i.event.handlers.call(this, f, d), t = 0; (a = o[t++]) && !f.isPropagationStopped(); )
            for (f.currentTarget = a.elem, n = 0; (s = a.handlers[n++]) && !f.isImmediatePropagationStopped(); )
              (!f.rnamespace || s.namespace === !1 || f.rnamespace.test(s.namespace)) &&
                ((f.handleObj = s),
                (f.data = s.data),
                (r = ((i.event.special[s.origType] || {}).handle || s.handler).apply(a.elem, l)),
                r !== void 0 && (f.result = r) === !1 && (f.preventDefault(), f.stopPropagation()));
          return y.postDispatch && y.postDispatch.call(this, f), f.result;
        }
      },
      handlers: function (e, t) {
        var n,
          r,
          a,
          s,
          o,
          l = [],
          f = t.delegateCount,
          d = e.target;
        if (f && d.nodeType && !(e.type === "click" && e.button >= 1)) {
          for (; d !== this; d = d.parentNode || this)
            if (d.nodeType === 1 && !(e.type === "click" && d.disabled === !0)) {
              for (s = [], o = {}, n = 0; n < f; n++)
                (r = t[n]),
                  (a = r.selector + " "),
                  o[a] === void 0 &&
                    (o[a] = r.needsContext ? i(a, this).index(d) > -1 : i.find(a, this, null, [d]).length),
                  o[a] && s.push(r);
              s.length && l.push({ elem: d, handlers: s });
            }
        }
        return (d = this), f < t.length && l.push({ elem: d, handlers: t.slice(f) }), l;
      },
      addProp: function (e, t) {
        Object.defineProperty(i.Event.prototype, e, {
          enumerable: !0,
          configurable: !0,
          get: q(t)
            ? function () {
                if (this.originalEvent) return t(this.originalEvent);
              }
            : function () {
                if (this.originalEvent) return this.originalEvent[e];
              },
          set: function (n) {
            Object.defineProperty(this, e, { enumerable: !0, configurable: !0, writable: !0, value: n });
          },
        });
      },
      fix: function (e) {
        return e[i.expando] ? e : new i.Event(e);
      },
      special: {
        load: { noBubble: !0 },
        click: {
          setup: function (e) {
            var t = this || e;
            return ot.test(t.type) && t.click && W(t, "input") && Tt(t, "click", !0), !1;
          },
          trigger: function (e) {
            var t = this || e;
            return ot.test(t.type) && t.click && W(t, "input") && Tt(t, "click"), !0;
          },
          _default: function (e) {
            var t = e.target;
            return (ot.test(t.type) && t.click && W(t, "input") && H.get(t, "click")) || W(t, "a");
          },
        },
        beforeunload: {
          postDispatch: function (e) {
            e.result !== void 0 && e.originalEvent && (e.originalEvent.returnValue = e.result);
          },
        },
      },
    };
    function Tt(e, t, n) {
      if (!n) {
        H.get(e, t) === void 0 && i.event.add(e, t, Ge);
        return;
      }
      H.set(e, t, !1),
        i.event.add(e, t, {
          namespace: !1,
          handler: function (r) {
            var a,
              s = H.get(this, t);
            if (r.isTrigger & 1 && this[t]) {
              if (s) (i.event.special[t] || {}).delegateType && r.stopPropagation();
              else if (
                ((s = Z.call(arguments)),
                H.set(this, t, s),
                this[t](),
                (a = H.get(this, t)),
                H.set(this, t, !1),
                s !== a)
              )
                return r.stopImmediatePropagation(), r.preventDefault(), a;
            } else
              s &&
                (H.set(this, t, i.event.trigger(s[0], s.slice(1), this)),
                r.stopPropagation(),
                (r.isImmediatePropagationStopped = Ge));
          },
        });
    }
    (i.removeEvent = function (e, t, n) {
      e.removeEventListener && e.removeEventListener(t, n);
    }),
      (i.Event = function (e, t) {
        if (!(this instanceof i.Event)) return new i.Event(e, t);
        e && e.type
          ? ((this.originalEvent = e),
            (this.type = e.type),
            (this.isDefaultPrevented =
              e.defaultPrevented || (e.defaultPrevented === void 0 && e.returnValue === !1) ? Ge : Qe),
            (this.target = e.target && e.target.nodeType === 3 ? e.target.parentNode : e.target),
            (this.currentTarget = e.currentTarget),
            (this.relatedTarget = e.relatedTarget))
          : (this.type = e),
          t && i.extend(this, t),
          (this.timeStamp = (e && e.timeStamp) || Date.now()),
          (this[i.expando] = !0);
      }),
      (i.Event.prototype = {
        constructor: i.Event,
        isDefaultPrevented: Qe,
        isPropagationStopped: Qe,
        isImmediatePropagationStopped: Qe,
        isSimulated: !1,
        preventDefault: function () {
          var e = this.originalEvent;
          (this.isDefaultPrevented = Ge), e && !this.isSimulated && e.preventDefault();
        },
        stopPropagation: function () {
          var e = this.originalEvent;
          (this.isPropagationStopped = Ge), e && !this.isSimulated && e.stopPropagation();
        },
        stopImmediatePropagation: function () {
          var e = this.originalEvent;
          (this.isImmediatePropagationStopped = Ge),
            e && !this.isSimulated && e.stopImmediatePropagation(),
            this.stopPropagation();
        },
      }),
      i.each(
        {
          altKey: !0,
          bubbles: !0,
          cancelable: !0,
          changedTouches: !0,
          ctrlKey: !0,
          detail: !0,
          eventPhase: !0,
          metaKey: !0,
          pageX: !0,
          pageY: !0,
          shiftKey: !0,
          view: !0,
          char: !0,
          code: !0,
          charCode: !0,
          key: !0,
          keyCode: !0,
          button: !0,
          buttons: !0,
          clientX: !0,
          clientY: !0,
          offsetX: !0,
          offsetY: !0,
          pointerId: !0,
          pointerType: !0,
          screenX: !0,
          screenY: !0,
          targetTouches: !0,
          toElement: !0,
          touches: !0,
          which: !0,
        },
        i.event.addProp,
      ),
      i.each({ focus: "focusin", blur: "focusout" }, function (e, t) {
        function n(r) {
          if (_.documentMode) {
            var a = H.get(this, "handle"),
              s = i.event.fix(r);
            (s.type = r.type === "focusin" ? "focus" : "blur"),
              (s.isSimulated = !0),
              a(r),
              s.target === s.currentTarget && a(s);
          } else i.event.simulate(t, r.target, i.event.fix(r));
        }
        (i.event.special[e] = {
          setup: function () {
            var r;
            if ((Tt(this, e, !0), _.documentMode))
              (r = H.get(this, t)), r || this.addEventListener(t, n), H.set(this, t, (r || 0) + 1);
            else return !1;
          },
          trigger: function () {
            return Tt(this, e), !0;
          },
          teardown: function () {
            var r;
            if (_.documentMode)
              (r = H.get(this, t) - 1), r ? H.set(this, t, r) : (this.removeEventListener(t, n), H.remove(this, t));
            else return !1;
          },
          _default: function (r) {
            return H.get(r.target, e);
          },
          delegateType: t,
        }),
          (i.event.special[t] = {
            setup: function () {
              var r = this.ownerDocument || this.document || this,
                a = _.documentMode ? this : r,
                s = H.get(a, t);
              s || (_.documentMode ? this.addEventListener(t, n) : r.addEventListener(e, n, !0)),
                H.set(a, t, (s || 0) + 1);
            },
            teardown: function () {
              var r = this.ownerDocument || this.document || this,
                a = _.documentMode ? this : r,
                s = H.get(a, t) - 1;
              s
                ? H.set(a, t, s)
                : (_.documentMode ? this.removeEventListener(t, n) : r.removeEventListener(e, n, !0), H.remove(a, t));
            },
          });
      }),
      i.each(
        { mouseenter: "mouseover", mouseleave: "mouseout", pointerenter: "pointerover", pointerleave: "pointerout" },
        function (e, t) {
          i.event.special[e] = {
            delegateType: t,
            bindType: t,
            handle: function (n) {
              var r,
                a = this,
                s = n.relatedTarget,
                o = n.handleObj;
              return (
                (!s || (s !== a && !i.contains(a, s))) &&
                  ((n.type = o.origType), (r = o.handler.apply(this, arguments)), (n.type = t)),
                r
              );
            },
          };
        },
      ),
      i.fn.extend({
        on: function (e, t, n, r) {
          return qt(this, e, t, n, r);
        },
        one: function (e, t, n, r) {
          return qt(this, e, t, n, r, 1);
        },
        off: function (e, t, n) {
          var r, a;
          if (e && e.preventDefault && e.handleObj)
            return (
              (r = e.handleObj),
              i(e.delegateTarget).off(r.namespace ? r.origType + "." + r.namespace : r.origType, r.selector, r.handler),
              this
            );
          if (typeof e == "object") {
            for (a in e) this.off(a, t, e[a]);
            return this;
          }
          return (
            (t === !1 || typeof t == "function") && ((n = t), (t = void 0)),
            n === !1 && (n = Qe),
            this.each(function () {
              i.event.remove(this, e, n, t);
            })
          );
        },
      });
    var dr = /<script|<style|<link/i,
      pr = /checked\s*(?:[^=]|=\s*.checked.)/i,
      hr = /^\s*<!\[CDATA\[|\]\]>\s*$/g;
    function gn(e, t) {
      return (W(e, "table") && W(t.nodeType !== 11 ? t : t.firstChild, "tr") && i(e).children("tbody")[0]) || e;
    }
    function gr(e) {
      return (e.type = (e.getAttribute("type") !== null) + "/" + e.type), e;
    }
    function yr(e) {
      return (e.type || "").slice(0, 5) === "true/" ? (e.type = e.type.slice(5)) : e.removeAttribute("type"), e;
    }
    function yn(e, t) {
      var n, r, a, s, o, l, f;
      if (t.nodeType === 1) {
        if (H.hasData(e) && ((s = H.get(e)), (f = s.events), f)) {
          H.remove(t, "handle events");
          for (a in f) for (n = 0, r = f[a].length; n < r; n++) i.event.add(t, a, f[a][n]);
        }
        re.hasData(e) && ((o = re.access(e)), (l = i.extend({}, o)), re.set(t, l));
      }
    }
    function vr(e, t) {
      var n = t.nodeName.toLowerCase();
      n === "input" && ot.test(e.type)
        ? (t.checked = e.checked)
        : (n === "input" || n === "textarea") && (t.defaultValue = e.defaultValue);
    }
    function Ye(e, t, n, r) {
      t = et(t);
      var a,
        s,
        o,
        l,
        f,
        d,
        y = 0,
        m = e.length,
        h = m - 1,
        x = t[0],
        D = q(x);
      if (D || (m > 1 && typeof x == "string" && !j.checkClone && pr.test(x)))
        return e.each(function (I) {
          var O = e.eq(I);
          D && (t[0] = x.call(this, I, O.html())), Ye(O, t, n, r);
        });
      if (
        m &&
        ((a = pn(t, e[0].ownerDocument, !1, e, r)), (s = a.firstChild), a.childNodes.length === 1 && (a = s), s || r)
      ) {
        for (o = i.map(ie(a, "script"), gr), l = o.length; y < m; y++)
          (f = a), y !== h && ((f = i.clone(f, !0, !0)), l && i.merge(o, ie(f, "script"))), n.call(e[y], f, y);
        if (l)
          for (d = o[o.length - 1].ownerDocument, i.map(o, yr), y = 0; y < l; y++)
            (f = o[y]),
              dn.test(f.type || "") &&
                !H.access(f, "globalEval") &&
                i.contains(d, f) &&
                (f.src && (f.type || "").toLowerCase() !== "module"
                  ? i._evalUrl && !f.noModule && i._evalUrl(f.src, { nonce: f.nonce || f.getAttribute("nonce") }, d)
                  : de(f.textContent.replace(hr, ""), f, d));
      }
      return e;
    }
    function vn(e, t, n) {
      for (var r, a = t ? i.filter(t, e) : e, s = 0; (r = a[s]) != null; s++)
        !n && r.nodeType === 1 && i.cleanData(ie(r)),
          r.parentNode && (n && ze(r) && jt(ie(r, "script")), r.parentNode.removeChild(r));
      return e;
    }
    i.extend({
      htmlPrefilter: function (e) {
        return e;
      },
      clone: function (e, t, n) {
        var r,
          a,
          s,
          o,
          l = e.cloneNode(!0),
          f = ze(e);
        if (!j.noCloneChecked && (e.nodeType === 1 || e.nodeType === 11) && !i.isXMLDoc(e))
          for (o = ie(l), s = ie(e), r = 0, a = s.length; r < a; r++) vr(s[r], o[r]);
        if (t)
          if (n) for (s = s || ie(e), o = o || ie(l), r = 0, a = s.length; r < a; r++) yn(s[r], o[r]);
          else yn(e, l);
        return (o = ie(l, "script")), o.length > 0 && jt(o, !f && ie(e, "script")), l;
      },
      cleanData: function (e) {
        for (var t, n, r, a = i.event.special, s = 0; (n = e[s]) !== void 0; s++)
          if (it(n)) {
            if ((t = n[H.expando])) {
              if (t.events) for (r in t.events) a[r] ? i.event.remove(n, r) : i.removeEvent(n, r, t.handle);
              n[H.expando] = void 0;
            }
            n[re.expando] && (n[re.expando] = void 0);
          }
      },
    }),
      i.fn.extend({
        detach: function (e) {
          return vn(this, e, !0);
        },
        remove: function (e) {
          return vn(this, e);
        },
        text: function (e) {
          return Ee(
            this,
            function (t) {
              return t === void 0
                ? i.text(this)
                : this.empty().each(function () {
                    (this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9) && (this.textContent = t);
                  });
            },
            null,
            e,
            arguments.length,
          );
        },
        append: function () {
          return Ye(this, arguments, function (e) {
            if (this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9) {
              var t = gn(this, e);
              t.appendChild(e);
            }
          });
        },
        prepend: function () {
          return Ye(this, arguments, function (e) {
            if (this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9) {
              var t = gn(this, e);
              t.insertBefore(e, t.firstChild);
            }
          });
        },
        before: function () {
          return Ye(this, arguments, function (e) {
            this.parentNode && this.parentNode.insertBefore(e, this);
          });
        },
        after: function () {
          return Ye(this, arguments, function (e) {
            this.parentNode && this.parentNode.insertBefore(e, this.nextSibling);
          });
        },
        empty: function () {
          for (var e, t = 0; (e = this[t]) != null; t++)
            e.nodeType === 1 && (i.cleanData(ie(e, !1)), (e.textContent = ""));
          return this;
        },
        clone: function (e, t) {
          return (
            (e = e == null ? !1 : e),
            (t = t == null ? e : t),
            this.map(function () {
              return i.clone(this, e, t);
            })
          );
        },
        html: function (e) {
          return Ee(
            this,
            function (t) {
              var n = this[0] || {},
                r = 0,
                a = this.length;
              if (t === void 0 && n.nodeType === 1) return n.innerHTML;
              if (typeof t == "string" && !dr.test(t) && !fe[(cn.exec(t) || ["", ""])[1].toLowerCase()]) {
                t = i.htmlPrefilter(t);
                try {
                  for (; r < a; r++)
                    (n = this[r] || {}), n.nodeType === 1 && (i.cleanData(ie(n, !1)), (n.innerHTML = t));
                  n = 0;
                } catch (s) {}
              }
              n && this.empty().append(t);
            },
            null,
            e,
            arguments.length,
          );
        },
        replaceWith: function () {
          var e = [];
          return Ye(
            this,
            arguments,
            function (t) {
              var n = this.parentNode;
              i.inArray(this, e) < 0 && (i.cleanData(ie(this)), n && n.replaceChild(t, this));
            },
            e,
          );
        },
      }),
      i.each(
        {
          appendTo: "append",
          prependTo: "prepend",
          insertBefore: "before",
          insertAfter: "after",
          replaceAll: "replaceWith",
        },
        function (e, t) {
          i.fn[e] = function (n) {
            for (var r, a = [], s = i(n), o = s.length - 1, l = 0; l <= o; l++)
              (r = l === o ? this : this.clone(!0)), i(s[l])[t](r), qe.apply(a, r.get());
            return this.pushStack(a);
          };
        },
      );
    var Lt = new RegExp("^(" + un + ")(?!px)[a-z%]+$", "i"),
      Pt = /^--/,
      Ct = function (e) {
        var t = e.ownerDocument.defaultView;
        return (!t || !t.opener) && (t = k), t.getComputedStyle(e);
      },
      mn = function (e, t, n) {
        var r,
          a,
          s = {};
        for (a in t) (s[a] = e.style[a]), (e.style[a] = t[a]);
        r = n.call(e);
        for (a in t) e.style[a] = s[a];
        return r;
      },
      mr = new RegExp(Se.join("|"), "i");
    (function () {
      function e() {
        if (d) {
          (f.style.cssText = "position:absolute;left:-11111px;width:60px;margin-top:1px;padding:0;border:0"),
            (d.style.cssText =
              "position:relative;display:block;box-sizing:border-box;overflow:scroll;margin:auto;border:1px;padding:1px;width:60%;top:1%"),
            Be.appendChild(f).appendChild(d);
          var y = k.getComputedStyle(d);
          (n = y.top !== "1%"),
            (l = t(y.marginLeft) === 12),
            (d.style.right = "60%"),
            (s = t(y.right) === 36),
            (r = t(y.width) === 36),
            (d.style.position = "absolute"),
            (a = t(d.offsetWidth / 3) === 12),
            Be.removeChild(f),
            (d = null);
        }
      }
      function t(y) {
        return Math.round(parseFloat(y));
      }
      var n,
        r,
        a,
        s,
        o,
        l,
        f = _.createElement("div"),
        d = _.createElement("div");
      d.style &&
        ((d.style.backgroundClip = "content-box"),
        (d.cloneNode(!0).style.backgroundClip = ""),
        (j.clearCloneStyle = d.style.backgroundClip === "content-box"),
        i.extend(j, {
          boxSizingReliable: function () {
            return e(), r;
          },
          pixelBoxStyles: function () {
            return e(), s;
          },
          pixelPosition: function () {
            return e(), n;
          },
          reliableMarginLeft: function () {
            return e(), l;
          },
          scrollboxSize: function () {
            return e(), a;
          },
          reliableTrDimensions: function () {
            var y, m, h, x;
            return (
              o == null &&
                ((y = _.createElement("table")),
                (m = _.createElement("tr")),
                (h = _.createElement("div")),
                (y.style.cssText = "position:absolute;left:-11111px;border-collapse:separate"),
                (m.style.cssText = "box-sizing:content-box;border:1px solid"),
                (m.style.height = "1px"),
                (h.style.height = "9px"),
                (h.style.display = "block"),
                Be.appendChild(y).appendChild(m).appendChild(h),
                (x = k.getComputedStyle(m)),
                (o =
                  parseInt(x.height, 10) + parseInt(x.borderTopWidth, 10) + parseInt(x.borderBottomWidth, 10) ===
                  m.offsetHeight),
                Be.removeChild(y)),
              o
            );
          },
        }));
    })();
    function ut(e, t, n) {
      var r,
        a,
        s,
        o,
        l = Pt.test(t),
        f = e.style;
      return (
        (n = n || Ct(e)),
        n &&
          ((o = n.getPropertyValue(t) || n[t]),
          l && o && (o = o.replace(oe, "$1") || void 0),
          o === "" && !ze(e) && (o = i.style(e, t)),
          !j.pixelBoxStyles() &&
            Lt.test(o) &&
            mr.test(t) &&
            ((r = f.width),
            (a = f.minWidth),
            (s = f.maxWidth),
            (f.minWidth = f.maxWidth = f.width = o),
            (o = n.width),
            (f.width = r),
            (f.minWidth = a),
            (f.maxWidth = s))),
        o !== void 0 ? o + "" : o
      );
    }
    function bn(e, t) {
      return {
        get: function () {
          if (e()) {
            delete this.get;
            return;
          }
          return (this.get = t).apply(this, arguments);
        },
      };
    }
    var xn = ["Webkit", "Moz", "ms"],
      Tn = _.createElement("div").style,
      Cn = {};
    function br(e) {
      for (var t = e[0].toUpperCase() + e.slice(1), n = xn.length; n--; ) if (((e = xn[n] + t), e in Tn)) return e;
    }
    function Ot(e) {
      var t = i.cssProps[e] || Cn[e];
      return t || (e in Tn ? e : (Cn[e] = br(e) || e));
    }
    var xr = /^(none|table(?!-c[ea]).+)/,
      Tr = { position: "absolute", visibility: "hidden", display: "block" },
      wn = { letterSpacing: "0", fontWeight: "400" };
    function En(e, t, n) {
      var r = st.exec(t);
      return r ? Math.max(0, r[2] - (n || 0)) + (r[3] || "px") : t;
    }
    function $t(e, t, n, r, a, s) {
      var o = t === "width" ? 1 : 0,
        l = 0,
        f = 0,
        d = 0;
      if (n === (r ? "border" : "content")) return 0;
      for (; o < 4; o += 2)
        n === "margin" && (d += i.css(e, n + Se[o], !0, a)),
          r
            ? (n === "content" && (f -= i.css(e, "padding" + Se[o], !0, a)),
              n !== "margin" && (f -= i.css(e, "border" + Se[o] + "Width", !0, a)))
            : ((f += i.css(e, "padding" + Se[o], !0, a)),
              n !== "padding"
                ? (f += i.css(e, "border" + Se[o] + "Width", !0, a))
                : (l += i.css(e, "border" + Se[o] + "Width", !0, a)));
      return (
        !r &&
          s >= 0 &&
          (f += Math.max(0, Math.ceil(e["offset" + t[0].toUpperCase() + t.slice(1)] - s - f - l - 0.5)) || 0),
        f + d
      );
    }
    function Sn(e, t, n) {
      var r = Ct(e),
        a = !j.boxSizingReliable() || n,
        s = a && i.css(e, "boxSizing", !1, r) === "border-box",
        o = s,
        l = ut(e, t, r),
        f = "offset" + t[0].toUpperCase() + t.slice(1);
      if (Lt.test(l)) {
        if (!n) return l;
        l = "auto";
      }
      return (
        ((!j.boxSizingReliable() && s) ||
          (!j.reliableTrDimensions() && W(e, "tr")) ||
          l === "auto" ||
          (!parseFloat(l) && i.css(e, "display", !1, r) === "inline")) &&
          e.getClientRects().length &&
          ((s = i.css(e, "boxSizing", !1, r) === "border-box"), (o = f in e), o && (l = e[f])),
        (l = parseFloat(l) || 0),
        l + $t(e, t, n || (s ? "border" : "content"), o, r, l) + "px"
      );
    }
    i.extend({
      cssHooks: {
        opacity: {
          get: function (e, t) {
            if (t) {
              var n = ut(e, "opacity");
              return n === "" ? "1" : n;
            }
          },
        },
      },
      cssNumber: {
        animationIterationCount: !0,
        aspectRatio: !0,
        borderImageSlice: !0,
        columnCount: !0,
        flexGrow: !0,
        flexShrink: !0,
        fontWeight: !0,
        gridArea: !0,
        gridColumn: !0,
        gridColumnEnd: !0,
        gridColumnStart: !0,
        gridRow: !0,
        gridRowEnd: !0,
        gridRowStart: !0,
        lineHeight: !0,
        opacity: !0,
        order: !0,
        orphans: !0,
        scale: !0,
        widows: !0,
        zIndex: !0,
        zoom: !0,
        fillOpacity: !0,
        floodOpacity: !0,
        stopOpacity: !0,
        strokeMiterlimit: !0,
        strokeOpacity: !0,
      },
      cssProps: {},
      style: function (e, t, n, r) {
        if (!(!e || e.nodeType === 3 || e.nodeType === 8 || !e.style)) {
          var a,
            s,
            o,
            l = ye(t),
            f = Pt.test(t),
            d = e.style;
          if ((f || (t = Ot(l)), (o = i.cssHooks[t] || i.cssHooks[l]), n !== void 0)) {
            if (
              ((s = typeof n),
              s === "string" && (a = st.exec(n)) && a[1] && ((n = fn(e, t, a)), (s = "number")),
              n == null || n !== n)
            )
              return;
            s === "number" && !f && (n += (a && a[3]) || (i.cssNumber[l] ? "" : "px")),
              !j.clearCloneStyle && n === "" && t.indexOf("background") === 0 && (d[t] = "inherit"),
              (!o || !("set" in o) || (n = o.set(e, n, r)) !== void 0) && (f ? d.setProperty(t, n) : (d[t] = n));
          } else return o && "get" in o && (a = o.get(e, !1, r)) !== void 0 ? a : d[t];
        }
      },
      css: function (e, t, n, r) {
        var a,
          s,
          o,
          l = ye(t),
          f = Pt.test(t);
        return (
          f || (t = Ot(l)),
          (o = i.cssHooks[t] || i.cssHooks[l]),
          o && "get" in o && (a = o.get(e, !0, n)),
          a === void 0 && (a = ut(e, t, r)),
          a === "normal" && t in wn && (a = wn[t]),
          n === "" || n ? ((s = parseFloat(a)), n === !0 || isFinite(s) ? s || 0 : a) : a
        );
      },
    }),
      i.each(["height", "width"], function (e, t) {
        i.cssHooks[t] = {
          get: function (n, r, a) {
            if (r)
              return xr.test(i.css(n, "display")) && (!n.getClientRects().length || !n.getBoundingClientRect().width)
                ? mn(n, Tr, function () {
                    return Sn(n, t, a);
                  })
                : Sn(n, t, a);
          },
          set: function (n, r, a) {
            var s,
              o = Ct(n),
              l = !j.scrollboxSize() && o.position === "absolute",
              f = l || a,
              d = f && i.css(n, "boxSizing", !1, o) === "border-box",
              y = a ? $t(n, t, a, d, o) : 0;
            return (
              d &&
                l &&
                (y -= Math.ceil(
                  n["offset" + t[0].toUpperCase() + t.slice(1)] - parseFloat(o[t]) - $t(n, t, "border", !1, o) - 0.5,
                )),
              y && (s = st.exec(r)) && (s[3] || "px") !== "px" && ((n.style[t] = r), (r = i.css(n, t))),
              En(n, r, y)
            );
          },
        };
      }),
      (i.cssHooks.marginLeft = bn(j.reliableMarginLeft, function (e, t) {
        if (t)
          return (
            (parseFloat(ut(e, "marginLeft")) ||
              e.getBoundingClientRect().left -
                mn(e, { marginLeft: 0 }, function () {
                  return e.getBoundingClientRect().left;
                })) + "px"
          );
      })),
      i.each({ margin: "", padding: "", border: "Width" }, function (e, t) {
        (i.cssHooks[e + t] = {
          expand: function (n) {
            for (var r = 0, a = {}, s = typeof n == "string" ? n.split(" ") : [n]; r < 4; r++)
              a[e + Se[r] + t] = s[r] || s[r - 2] || s[0];
            return a;
          },
        }),
          e !== "margin" && (i.cssHooks[e + t].set = En);
      }),
      i.fn.extend({
        css: function (e, t) {
          return Ee(
            this,
            function (n, r, a) {
              var s,
                o,
                l = {},
                f = 0;
              if (Array.isArray(r)) {
                for (s = Ct(n), o = r.length; f < o; f++) l[r[f]] = i.css(n, r[f], !1, s);
                return l;
              }
              return a !== void 0 ? i.style(n, r, a) : i.css(n, r);
            },
            e,
            t,
            arguments.length > 1,
          );
        },
      });
    function ae(e, t, n, r, a) {
      return new ae.prototype.init(e, t, n, r, a);
    }
    (i.Tween = ae),
      (ae.prototype = {
        constructor: ae,
        init: function (e, t, n, r, a, s) {
          (this.elem = e),
            (this.prop = n),
            (this.easing = a || i.easing._default),
            (this.options = t),
            (this.start = this.now = this.cur()),
            (this.end = r),
            (this.unit = s || (i.cssNumber[n] ? "" : "px"));
        },
        cur: function () {
          var e = ae.propHooks[this.prop];
          return e && e.get ? e.get(this) : ae.propHooks._default.get(this);
        },
        run: function (e) {
          var t,
            n = ae.propHooks[this.prop];
          return (
            this.options.duration
              ? (this.pos = t = i.easing[this.easing](e, this.options.duration * e, 0, 1, this.options.duration))
              : (this.pos = t = e),
            (this.now = (this.end - this.start) * t + this.start),
            this.options.step && this.options.step.call(this.elem, this.now, this),
            n && n.set ? n.set(this) : ae.propHooks._default.set(this),
            this
          );
        },
      }),
      (ae.prototype.init.prototype = ae.prototype),
      (ae.propHooks = {
        _default: {
          get: function (e) {
            var t;
            return e.elem.nodeType !== 1 || (e.elem[e.prop] != null && e.elem.style[e.prop] == null)
              ? e.elem[e.prop]
              : ((t = i.css(e.elem, e.prop, "")), !t || t === "auto" ? 0 : t);
          },
          set: function (e) {
            i.fx.step[e.prop]
              ? i.fx.step[e.prop](e)
              : e.elem.nodeType === 1 && (i.cssHooks[e.prop] || e.elem.style[Ot(e.prop)] != null)
                ? i.style(e.elem, e.prop, e.now + e.unit)
                : (e.elem[e.prop] = e.now);
          },
        },
      }),
      (ae.propHooks.scrollTop = ae.propHooks.scrollLeft =
        {
          set: function (e) {
            e.elem.nodeType && e.elem.parentNode && (e.elem[e.prop] = e.now);
          },
        }),
      (i.easing = {
        linear: function (e) {
          return e;
        },
        swing: function (e) {
          return 0.5 - Math.cos(e * Math.PI) / 2;
        },
        _default: "swing",
      }),
      (i.fx = ae.prototype.init),
      (i.fx.step = {});
    var Je,
      wt,
      Cr = /^(?:toggle|show|hide)$/,
      wr = /queueHooks$/;
    function Bt() {
      wt &&
        (_.hidden === !1 && k.requestAnimationFrame ? k.requestAnimationFrame(Bt) : k.setTimeout(Bt, i.fx.interval),
        i.fx.tick());
    }
    function Hn() {
      return (
        k.setTimeout(function () {
          Je = void 0;
        }),
        (Je = Date.now())
      );
    }
    function Et(e, t) {
      var n,
        r = 0,
        a = { height: e };
      for (t = t ? 1 : 0; r < 4; r += 2 - t) (n = Se[r]), (a["margin" + n] = a["padding" + n] = e);
      return t && (a.opacity = a.width = e), a;
    }
    function kn(e, t, n) {
      for (var r, a = (pe.tweeners[t] || []).concat(pe.tweeners["*"]), s = 0, o = a.length; s < o; s++)
        if ((r = a[s].call(n, t, e))) return r;
    }
    function Er(e, t, n) {
      var r,
        a,
        s,
        o,
        l,
        f,
        d,
        y,
        m = "width" in t || "height" in t,
        h = this,
        x = {},
        D = e.style,
        I = e.nodeType && xt(e),
        O = H.get(e, "fxshow");
      n.queue ||
        ((o = i._queueHooks(e, "fx")),
        o.unqueued == null &&
          ((o.unqueued = 0),
          (l = o.empty.fire),
          (o.empty.fire = function () {
            o.unqueued || l();
          })),
        o.unqueued++,
        h.always(function () {
          h.always(function () {
            o.unqueued--, i.queue(e, "fx").length || o.empty.fire();
          });
        }));
      for (r in t)
        if (((a = t[r]), Cr.test(a))) {
          if ((delete t[r], (s = s || a === "toggle"), a === (I ? "hide" : "show")))
            if (a === "show" && O && O[r] !== void 0) I = !0;
            else continue;
          x[r] = (O && O[r]) || i.style(e, r);
        }
      if (((f = !i.isEmptyObject(t)), !(!f && i.isEmptyObject(x)))) {
        m &&
          e.nodeType === 1 &&
          ((n.overflow = [D.overflow, D.overflowX, D.overflowY]),
          (d = O && O.display),
          d == null && (d = H.get(e, "display")),
          (y = i.css(e, "display")),
          y === "none" && (d ? (y = d) : (Ve([e], !0), (d = e.style.display || d), (y = i.css(e, "display")), Ve([e]))),
          (y === "inline" || (y === "inline-block" && d != null)) &&
            i.css(e, "float") === "none" &&
            (f ||
              (h.done(function () {
                D.display = d;
              }),
              d == null && ((y = D.display), (d = y === "none" ? "" : y))),
            (D.display = "inline-block"))),
          n.overflow &&
            ((D.overflow = "hidden"),
            h.always(function () {
              (D.overflow = n.overflow[0]), (D.overflowX = n.overflow[1]), (D.overflowY = n.overflow[2]);
            })),
          (f = !1);
        for (r in x)
          f ||
            (O ? "hidden" in O && (I = O.hidden) : (O = H.access(e, "fxshow", { display: d })),
            s && (O.hidden = !I),
            I && Ve([e], !0),
            h.done(function () {
              I || Ve([e]), H.remove(e, "fxshow");
              for (r in x) i.style(e, r, x[r]);
            })),
            (f = kn(I ? O[r] : 0, r, h)),
            r in O || ((O[r] = f.start), I && ((f.end = f.start), (f.start = 0)));
      }
    }
    function Sr(e, t) {
      var n, r, a, s, o;
      for (n in e)
        if (
          ((r = ye(n)),
          (a = t[r]),
          (s = e[n]),
          Array.isArray(s) && ((a = s[1]), (s = e[n] = s[0])),
          n !== r && ((e[r] = s), delete e[n]),
          (o = i.cssHooks[r]),
          o && "expand" in o)
        ) {
          (s = o.expand(s)), delete e[r];
          for (n in s) n in e || ((e[n] = s[n]), (t[n] = a));
        } else t[r] = a;
    }
    function pe(e, t, n) {
      var r,
        a,
        s = 0,
        o = pe.prefilters.length,
        l = i.Deferred().always(function () {
          delete f.elem;
        }),
        f = function () {
          if (a) return !1;
          for (
            var m = Je || Hn(),
              h = Math.max(0, d.startTime + d.duration - m),
              x = h / d.duration || 0,
              D = 1 - x,
              I = 0,
              O = d.tweens.length;
            I < O;
            I++
          )
            d.tweens[I].run(D);
          return (
            l.notifyWith(e, [d, D, h]), D < 1 && O ? h : (O || l.notifyWith(e, [d, 1, 0]), l.resolveWith(e, [d]), !1)
          );
        },
        d = l.promise({
          elem: e,
          props: i.extend({}, t),
          opts: i.extend(!0, { specialEasing: {}, easing: i.easing._default }, n),
          originalProperties: t,
          originalOptions: n,
          startTime: Je || Hn(),
          duration: n.duration,
          tweens: [],
          createTween: function (m, h) {
            var x = i.Tween(e, d.opts, m, h, d.opts.specialEasing[m] || d.opts.easing);
            return d.tweens.push(x), x;
          },
          stop: function (m) {
            var h = 0,
              x = m ? d.tweens.length : 0;
            if (a) return this;
            for (a = !0; h < x; h++) d.tweens[h].run(1);
            return m ? (l.notifyWith(e, [d, 1, 0]), l.resolveWith(e, [d, m])) : l.rejectWith(e, [d, m]), this;
          },
        }),
        y = d.props;
      for (Sr(y, d.opts.specialEasing); s < o; s++)
        if (((r = pe.prefilters[s].call(d, e, y, d.opts)), r))
          return q(r.stop) && (i._queueHooks(d.elem, d.opts.queue).stop = r.stop.bind(r)), r;
      return (
        i.map(y, kn, d),
        q(d.opts.start) && d.opts.start.call(e, d),
        d.progress(d.opts.progress).done(d.opts.done, d.opts.complete).fail(d.opts.fail).always(d.opts.always),
        i.fx.timer(i.extend(f, { elem: e, anim: d, queue: d.opts.queue })),
        d
      );
    }
    (i.Animation = i.extend(pe, {
      tweeners: {
        "*": [
          function (e, t) {
            var n = this.createTween(e, t);
            return fn(n.elem, e, st.exec(t), n), n;
          },
        ],
      },
      tweener: function (e, t) {
        q(e) ? ((t = e), (e = ["*"])) : (e = e.match(ge));
        for (var n, r = 0, a = e.length; r < a; r++)
          (n = e[r]), (pe.tweeners[n] = pe.tweeners[n] || []), pe.tweeners[n].unshift(t);
      },
      prefilters: [Er],
      prefilter: function (e, t) {
        t ? pe.prefilters.unshift(e) : pe.prefilters.push(e);
      },
    })),
      (i.speed = function (e, t, n) {
        var r =
          e && typeof e == "object"
            ? i.extend({}, e)
            : { complete: n || (!n && t) || (q(e) && e), duration: e, easing: (n && t) || (t && !q(t) && t) };
        return (
          i.fx.off
            ? (r.duration = 0)
            : typeof r.duration != "number" &&
              (r.duration in i.fx.speeds
                ? (r.duration = i.fx.speeds[r.duration])
                : (r.duration = i.fx.speeds._default)),
          (r.queue == null || r.queue === !0) && (r.queue = "fx"),
          (r.old = r.complete),
          (r.complete = function () {
            q(r.old) && r.old.call(this), r.queue && i.dequeue(this, r.queue);
          }),
          r
        );
      }),
      i.fn.extend({
        fadeTo: function (e, t, n, r) {
          return this.filter(xt).css("opacity", 0).show().end().animate({ opacity: t }, e, n, r);
        },
        animate: function (e, t, n, r) {
          var a = i.isEmptyObject(e),
            s = i.speed(t, n, r),
            o = function () {
              var l = pe(this, i.extend({}, e), s);
              (a || H.get(this, "finish")) && l.stop(!0);
            };
          return (o.finish = o), a || s.queue === !1 ? this.each(o) : this.queue(s.queue, o);
        },
        stop: function (e, t, n) {
          var r = function (a) {
            var s = a.stop;
            delete a.stop, s(n);
          };
          return (
            typeof e != "string" && ((n = t), (t = e), (e = void 0)),
            t && this.queue(e || "fx", []),
            this.each(function () {
              var a = !0,
                s = e != null && e + "queueHooks",
                o = i.timers,
                l = H.get(this);
              if (s) l[s] && l[s].stop && r(l[s]);
              else for (s in l) l[s] && l[s].stop && wr.test(s) && r(l[s]);
              for (s = o.length; s--; )
                o[s].elem === this && (e == null || o[s].queue === e) && (o[s].anim.stop(n), (a = !1), o.splice(s, 1));
              (a || !n) && i.dequeue(this, e);
            })
          );
        },
        finish: function (e) {
          return (
            e !== !1 && (e = e || "fx"),
            this.each(function () {
              var t,
                n = H.get(this),
                r = n[e + "queue"],
                a = n[e + "queueHooks"],
                s = i.timers,
                o = r ? r.length : 0;
              for (n.finish = !0, i.queue(this, e, []), a && a.stop && a.stop.call(this, !0), t = s.length; t--; )
                s[t].elem === this && s[t].queue === e && (s[t].anim.stop(!0), s.splice(t, 1));
              for (t = 0; t < o; t++) r[t] && r[t].finish && r[t].finish.call(this);
              delete n.finish;
            })
          );
        },
      }),
      i.each(["toggle", "show", "hide"], function (e, t) {
        var n = i.fn[t];
        i.fn[t] = function (r, a, s) {
          return r == null || typeof r == "boolean" ? n.apply(this, arguments) : this.animate(Et(t, !0), r, a, s);
        };
      }),
      i.each(
        {
          slideDown: Et("show"),
          slideUp: Et("hide"),
          slideToggle: Et("toggle"),
          fadeIn: { opacity: "show" },
          fadeOut: { opacity: "hide" },
          fadeToggle: { opacity: "toggle" },
        },
        function (e, t) {
          i.fn[e] = function (n, r, a) {
            return this.animate(t, n, r, a);
          };
        },
      ),
      (i.timers = []),
      (i.fx.tick = function () {
        var e,
          t = 0,
          n = i.timers;
        for (Je = Date.now(); t < n.length; t++) (e = n[t]), !e() && n[t] === e && n.splice(t--, 1);
        n.length || i.fx.stop(), (Je = void 0);
      }),
      (i.fx.timer = function (e) {
        i.timers.push(e), i.fx.start();
      }),
      (i.fx.interval = 13),
      (i.fx.start = function () {
        wt || ((wt = !0), Bt());
      }),
      (i.fx.stop = function () {
        wt = null;
      }),
      (i.fx.speeds = { slow: 600, fast: 200, _default: 400 }),
      (i.fn.delay = function (e, t) {
        return (
          (e = (i.fx && i.fx.speeds[e]) || e),
          (t = t || "fx"),
          this.queue(t, function (n, r) {
            var a = k.setTimeout(n, e);
            r.stop = function () {
              k.clearTimeout(a);
            };
          })
        );
      }),
      (function () {
        var e = _.createElement("input"),
          t = _.createElement("select"),
          n = t.appendChild(_.createElement("option"));
        (e.type = "checkbox"),
          (j.checkOn = e.value !== ""),
          (j.optSelected = n.selected),
          (e = _.createElement("input")),
          (e.value = "t"),
          (e.type = "radio"),
          (j.radioValue = e.value === "t");
      })();
    var An,
      ft = i.expr.attrHandle;
    i.fn.extend({
      attr: function (e, t) {
        return Ee(this, i.attr, e, t, arguments.length > 1);
      },
      removeAttr: function (e) {
        return this.each(function () {
          i.removeAttr(this, e);
        });
      },
    }),
      i.extend({
        attr: function (e, t, n) {
          var r,
            a,
            s = e.nodeType;
          if (!(s === 3 || s === 8 || s === 2)) {
            if (typeof e.getAttribute == "undefined") return i.prop(e, t, n);
            if (
              ((s !== 1 || !i.isXMLDoc(e)) &&
                (a = i.attrHooks[t.toLowerCase()] || (i.expr.match.bool.test(t) ? An : void 0)),
              n !== void 0)
            ) {
              if (n === null) {
                i.removeAttr(e, t);
                return;
              }
              return a && "set" in a && (r = a.set(e, n, t)) !== void 0 ? r : (e.setAttribute(t, n + ""), n);
            }
            return a && "get" in a && (r = a.get(e, t)) !== null
              ? r
              : ((r = i.find.attr(e, t)), r == null ? void 0 : r);
          }
        },
        attrHooks: {
          type: {
            set: function (e, t) {
              if (!j.radioValue && t === "radio" && W(e, "input")) {
                var n = e.value;
                return e.setAttribute("type", t), n && (e.value = n), t;
              }
            },
          },
        },
        removeAttr: function (e, t) {
          var n,
            r = 0,
            a = t && t.match(ge);
          if (a && e.nodeType === 1) for (; (n = a[r++]); ) e.removeAttribute(n);
        },
      }),
      (An = {
        set: function (e, t, n) {
          return t === !1 ? i.removeAttr(e, n) : e.setAttribute(n, n), n;
        },
      }),
      i.each(i.expr.match.bool.source.match(/\w+/g), function (e, t) {
        var n = ft[t] || i.find.attr;
        ft[t] = function (r, a, s) {
          var o,
            l,
            f = a.toLowerCase();
          return s || ((l = ft[f]), (ft[f] = o), (o = n(r, a, s) != null ? f : null), (ft[f] = l)), o;
        };
      });
    var Hr = /^(?:input|select|textarea|button)$/i,
      kr = /^(?:a|area)$/i;
    i.fn.extend({
      prop: function (e, t) {
        return Ee(this, i.prop, e, t, arguments.length > 1);
      },
      removeProp: function (e) {
        return this.each(function () {
          delete this[i.propFix[e] || e];
        });
      },
    }),
      i.extend({
        prop: function (e, t, n) {
          var r,
            a,
            s = e.nodeType;
          if (!(s === 3 || s === 8 || s === 2))
            return (
              (s !== 1 || !i.isXMLDoc(e)) && ((t = i.propFix[t] || t), (a = i.propHooks[t])),
              n !== void 0
                ? a && "set" in a && (r = a.set(e, n, t)) !== void 0
                  ? r
                  : (e[t] = n)
                : a && "get" in a && (r = a.get(e, t)) !== null
                  ? r
                  : e[t]
            );
        },
        propHooks: {
          tabIndex: {
            get: function (e) {
              var t = i.find.attr(e, "tabindex");
              return t ? parseInt(t, 10) : Hr.test(e.nodeName) || (kr.test(e.nodeName) && e.href) ? 0 : -1;
            },
          },
        },
        propFix: { for: "htmlFor", class: "className" },
      }),
      j.optSelected ||
        (i.propHooks.selected = {
          get: function (e) {
            var t = e.parentNode;
            return t && t.parentNode && t.parentNode.selectedIndex, null;
          },
          set: function (e) {
            var t = e.parentNode;
            t && (t.selectedIndex, t.parentNode && t.parentNode.selectedIndex);
          },
        }),
      i.each(
        [
          "tabIndex",
          "readOnly",
          "maxLength",
          "cellSpacing",
          "cellPadding",
          "rowSpan",
          "colSpan",
          "useMap",
          "frameBorder",
          "contentEditable",
        ],
        function () {
          i.propFix[this.toLowerCase()] = this;
        },
      );
    function Re(e) {
      var t = e.match(ge) || [];
      return t.join(" ");
    }
    function Ie(e) {
      return (e.getAttribute && e.getAttribute("class")) || "";
    }
    function Rt(e) {
      return Array.isArray(e) ? e : typeof e == "string" ? e.match(ge) || [] : [];
    }
    i.fn.extend({
      addClass: function (e) {
        var t, n, r, a, s, o;
        return q(e)
          ? this.each(function (l) {
              i(this).addClass(e.call(this, l, Ie(this)));
            })
          : ((t = Rt(e)),
            t.length
              ? this.each(function () {
                  if (((r = Ie(this)), (n = this.nodeType === 1 && " " + Re(r) + " "), n)) {
                    for (s = 0; s < t.length; s++) (a = t[s]), n.indexOf(" " + a + " ") < 0 && (n += a + " ");
                    (o = Re(n)), r !== o && this.setAttribute("class", o);
                  }
                })
              : this);
      },
      removeClass: function (e) {
        var t, n, r, a, s, o;
        return q(e)
          ? this.each(function (l) {
              i(this).removeClass(e.call(this, l, Ie(this)));
            })
          : arguments.length
            ? ((t = Rt(e)),
              t.length
                ? this.each(function () {
                    if (((r = Ie(this)), (n = this.nodeType === 1 && " " + Re(r) + " "), n)) {
                      for (s = 0; s < t.length; s++)
                        for (a = t[s]; n.indexOf(" " + a + " ") > -1; ) n = n.replace(" " + a + " ", " ");
                      (o = Re(n)), r !== o && this.setAttribute("class", o);
                    }
                  })
                : this)
            : this.attr("class", "");
      },
      toggleClass: function (e, t) {
        var n,
          r,
          a,
          s,
          o = typeof e,
          l = o === "string" || Array.isArray(e);
        return q(e)
          ? this.each(function (f) {
              i(this).toggleClass(e.call(this, f, Ie(this), t), t);
            })
          : typeof t == "boolean" && l
            ? t
              ? this.addClass(e)
              : this.removeClass(e)
            : ((n = Rt(e)),
              this.each(function () {
                if (l)
                  for (s = i(this), a = 0; a < n.length; a++)
                    (r = n[a]), s.hasClass(r) ? s.removeClass(r) : s.addClass(r);
                else
                  (e === void 0 || o === "boolean") &&
                    ((r = Ie(this)),
                    r && H.set(this, "__className__", r),
                    this.setAttribute &&
                      this.setAttribute("class", r || e === !1 ? "" : H.get(this, "__className__") || ""));
              }));
      },
      hasClass: function (e) {
        var t,
          n,
          r = 0;
        for (t = " " + e + " "; (n = this[r++]); )
          if (n.nodeType === 1 && (" " + Re(Ie(n)) + " ").indexOf(t) > -1) return !0;
        return !1;
      },
    });
    var Ar = /\r/g;
    i.fn.extend({
      val: function (e) {
        var t,
          n,
          r,
          a = this[0];
        return arguments.length
          ? ((r = q(e)),
            this.each(function (s) {
              var o;
              this.nodeType === 1 &&
                (r ? (o = e.call(this, s, i(this).val())) : (o = e),
                o == null
                  ? (o = "")
                  : typeof o == "number"
                    ? (o += "")
                    : Array.isArray(o) &&
                      (o = i.map(o, function (l) {
                        return l == null ? "" : l + "";
                      })),
                (t = i.valHooks[this.type] || i.valHooks[this.nodeName.toLowerCase()]),
                (!t || !("set" in t) || t.set(this, o, "value") === void 0) && (this.value = o));
            }))
          : a
            ? ((t = i.valHooks[a.type] || i.valHooks[a.nodeName.toLowerCase()]),
              t && "get" in t && (n = t.get(a, "value")) !== void 0
                ? n
                : ((n = a.value), typeof n == "string" ? n.replace(Ar, "") : n == null ? "" : n))
            : void 0;
      },
    }),
      i.extend({
        valHooks: {
          option: {
            get: function (e) {
              var t = i.find.attr(e, "value");
              return t != null ? t : Re(i.text(e));
            },
          },
          select: {
            get: function (e) {
              var t,
                n,
                r,
                a = e.options,
                s = e.selectedIndex,
                o = e.type === "select-one",
                l = o ? null : [],
                f = o ? s + 1 : a.length;
              for (s < 0 ? (r = f) : (r = o ? s : 0); r < f; r++)
                if (
                  ((n = a[r]),
                  (n.selected || r === s) && !n.disabled && (!n.parentNode.disabled || !W(n.parentNode, "optgroup")))
                ) {
                  if (((t = i(n).val()), o)) return t;
                  l.push(t);
                }
              return l;
            },
            set: function (e, t) {
              for (var n, r, a = e.options, s = i.makeArray(t), o = a.length; o--; )
                (r = a[o]), (r.selected = i.inArray(i.valHooks.option.get(r), s) > -1) && (n = !0);
              return n || (e.selectedIndex = -1), s;
            },
          },
        },
      }),
      i.each(["radio", "checkbox"], function () {
        (i.valHooks[this] = {
          set: function (e, t) {
            if (Array.isArray(t)) return (e.checked = i.inArray(i(e).val(), t) > -1);
          },
        }),
          j.checkOn ||
            (i.valHooks[this].get = function (e) {
              return e.getAttribute("value") === null ? "on" : e.value;
            });
      });
    var lt = k.location,
      Mn = { guid: Date.now() },
      It = /\?/;
    i.parseXML = function (e) {
      var t, n;
      if (!e || typeof e != "string") return null;
      try {
        t = new k.DOMParser().parseFromString(e, "text/xml");
      } catch (r) {}
      return (
        (n = t && t.getElementsByTagName("parsererror")[0]),
        (!t || n) &&
          i.error(
            "Invalid XML: " +
              (n
                ? i
                    .map(n.childNodes, function (r) {
                      return r.textContent;
                    })
                    .join(`
`)
                : e),
          ),
        t
      );
    };
    var _n = /^(?:focusinfocus|focusoutblur)$/,
      Dn = function (e) {
        e.stopPropagation();
      };
    i.extend(i.event, {
      trigger: function (e, t, n, r) {
        var a,
          s,
          o,
          l,
          f,
          d,
          y,
          m,
          h = [n || _],
          x = Ae.call(e, "type") ? e.type : e,
          D = Ae.call(e, "namespace") ? e.namespace.split(".") : [];
        if (
          ((s = m = o = n = n || _),
          !(n.nodeType === 3 || n.nodeType === 8) &&
            !_n.test(x + i.event.triggered) &&
            (x.indexOf(".") > -1 && ((D = x.split(".")), (x = D.shift()), D.sort()),
            (f = x.indexOf(":") < 0 && "on" + x),
            (e = e[i.expando] ? e : new i.Event(x, typeof e == "object" && e)),
            (e.isTrigger = r ? 2 : 3),
            (e.namespace = D.join(".")),
            (e.rnamespace = e.namespace ? new RegExp("(^|\\.)" + D.join("\\.(?:.*\\.|)") + "(\\.|$)") : null),
            (e.result = void 0),
            e.target || (e.target = n),
            (t = t == null ? [e] : i.makeArray(t, [e])),
            (y = i.event.special[x] || {}),
            !(!r && y.trigger && y.trigger.apply(n, t) === !1)))
        ) {
          if (!r && !y.noBubble && !Ce(n)) {
            for (l = y.delegateType || x, _n.test(l + x) || (s = s.parentNode); s; s = s.parentNode) h.push(s), (o = s);
            o === (n.ownerDocument || _) && h.push(o.defaultView || o.parentWindow || k);
          }
          for (a = 0; (s = h[a++]) && !e.isPropagationStopped(); )
            (m = s),
              (e.type = a > 1 ? l : y.bindType || x),
              (d = (H.get(s, "events") || Object.create(null))[e.type] && H.get(s, "handle")),
              d && d.apply(s, t),
              (d = f && s[f]),
              d && d.apply && it(s) && ((e.result = d.apply(s, t)), e.result === !1 && e.preventDefault());
          return (
            (e.type = x),
            !r &&
              !e.isDefaultPrevented() &&
              (!y._default || y._default.apply(h.pop(), t) === !1) &&
              it(n) &&
              f &&
              q(n[x]) &&
              !Ce(n) &&
              ((o = n[f]),
              o && (n[f] = null),
              (i.event.triggered = x),
              e.isPropagationStopped() && m.addEventListener(x, Dn),
              n[x](),
              e.isPropagationStopped() && m.removeEventListener(x, Dn),
              (i.event.triggered = void 0),
              o && (n[f] = o)),
            e.result
          );
        }
      },
      simulate: function (e, t, n) {
        var r = i.extend(new i.Event(), n, { type: e, isSimulated: !0 });
        i.event.trigger(r, null, t);
      },
    }),
      i.fn.extend({
        trigger: function (e, t) {
          return this.each(function () {
            i.event.trigger(e, t, this);
          });
        },
        triggerHandler: function (e, t) {
          var n = this[0];
          if (n) return i.event.trigger(e, t, n, !0);
        },
      });
    var Mr = /\[\]$/,
      Nn = /\r?\n/g,
      _r = /^(?:submit|button|image|reset|file)$/i,
      Dr = /^(?:input|select|textarea|keygen)/i;
    function Ft(e, t, n, r) {
      var a;
      if (Array.isArray(t))
        i.each(t, function (s, o) {
          n || Mr.test(e) ? r(e, o) : Ft(e + "[" + (typeof o == "object" && o != null ? s : "") + "]", o, n, r);
        });
      else if (!n && Q(t) === "object") for (a in t) Ft(e + "[" + a + "]", t[a], n, r);
      else r(e, t);
    }
    (i.param = function (e, t) {
      var n,
        r = [],
        a = function (s, o) {
          var l = q(o) ? o() : o;
          r[r.length] = encodeURIComponent(s) + "=" + encodeURIComponent(l == null ? "" : l);
        };
      if (e == null) return "";
      if (Array.isArray(e) || (e.jquery && !i.isPlainObject(e)))
        i.each(e, function () {
          a(this.name, this.value);
        });
      else for (n in e) Ft(n, e[n], t, a);
      return r.join("&");
    }),
      i.fn.extend({
        serialize: function () {
          return i.param(this.serializeArray());
        },
        serializeArray: function () {
          return this.map(function () {
            var e = i.prop(this, "elements");
            return e ? i.makeArray(e) : this;
          })
            .filter(function () {
              var e = this.type;
              return (
                this.name &&
                !i(this).is(":disabled") &&
                Dr.test(this.nodeName) &&
                !_r.test(e) &&
                (this.checked || !ot.test(e))
              );
            })
            .map(function (e, t) {
              var n = i(this).val();
              return n == null
                ? null
                : Array.isArray(n)
                  ? i.map(n, function (r) {
                      return {
                        name: t.name,
                        value: r.replace(
                          Nn,
                          `\r
`,
                        ),
                      };
                    })
                  : {
                      name: t.name,
                      value: n.replace(
                        Nn,
                        `\r
`,
                      ),
                    };
            })
            .get();
        },
      });
    var Nr = /%20/g,
      jr = /#.*$/,
      qr = /([?&])_=[^&]*/,
      Lr = /^(.*?):[ \t]*([^\r\n]*)$/gm,
      Pr = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/,
      Or = /^(?:GET|HEAD)$/,
      $r = /^\/\//,
      jn = {},
      Wt = {},
      qn = "*/".concat("*"),
      Xt = _.createElement("a");
    Xt.href = lt.href;
    function Ln(e) {
      return function (t, n) {
        typeof t != "string" && ((n = t), (t = "*"));
        var r,
          a = 0,
          s = t.toLowerCase().match(ge) || [];
        if (q(n))
          for (; (r = s[a++]); )
            r[0] === "+" ? ((r = r.slice(1) || "*"), (e[r] = e[r] || []).unshift(n)) : (e[r] = e[r] || []).push(n);
      };
    }
    function Pn(e, t, n, r) {
      var a = {},
        s = e === Wt;
      function o(l) {
        var f;
        return (
          (a[l] = !0),
          i.each(e[l] || [], function (d, y) {
            var m = y(t, n, r);
            if (typeof m == "string" && !s && !a[m]) return t.dataTypes.unshift(m), o(m), !1;
            if (s) return !(f = m);
          }),
          f
        );
      }
      return o(t.dataTypes[0]) || (!a["*"] && o("*"));
    }
    function Ut(e, t) {
      var n,
        r,
        a = i.ajaxSettings.flatOptions || {};
      for (n in t) t[n] !== void 0 && ((a[n] ? e : r || (r = {}))[n] = t[n]);
      return r && i.extend(!0, e, r), e;
    }
    function Br(e, t, n) {
      for (var r, a, s, o, l = e.contents, f = e.dataTypes; f[0] === "*"; )
        f.shift(), r === void 0 && (r = e.mimeType || t.getResponseHeader("Content-Type"));
      if (r) {
        for (a in l)
          if (l[a] && l[a].test(r)) {
            f.unshift(a);
            break;
          }
      }
      if (f[0] in n) s = f[0];
      else {
        for (a in n) {
          if (!f[0] || e.converters[a + " " + f[0]]) {
            s = a;
            break;
          }
          o || (o = a);
        }
        s = s || o;
      }
      if (s) return s !== f[0] && f.unshift(s), n[s];
    }
    function Rr(e, t, n, r) {
      var a,
        s,
        o,
        l,
        f,
        d = {},
        y = e.dataTypes.slice();
      if (y[1]) for (o in e.converters) d[o.toLowerCase()] = e.converters[o];
      for (s = y.shift(); s; )
        if (
          (e.responseFields[s] && (n[e.responseFields[s]] = t),
          !f && r && e.dataFilter && (t = e.dataFilter(t, e.dataType)),
          (f = s),
          (s = y.shift()),
          s)
        ) {
          if (s === "*") s = f;
          else if (f !== "*" && f !== s) {
            if (((o = d[f + " " + s] || d["* " + s]), !o)) {
              for (a in d)
                if (((l = a.split(" ")), l[1] === s && ((o = d[f + " " + l[0]] || d["* " + l[0]]), o))) {
                  o === !0 ? (o = d[a]) : d[a] !== !0 && ((s = l[0]), y.unshift(l[1]));
                  break;
                }
            }
            if (o !== !0)
              if (o && e.throws) t = o(t);
              else
                try {
                  t = o(t);
                } catch (m) {
                  return { state: "parsererror", error: o ? m : "No conversion from " + f + " to " + s };
                }
          }
        }
      return { state: "success", data: t };
    }
    i.extend({
      active: 0,
      lastModified: {},
      etag: {},
      ajaxSettings: {
        url: lt.href,
        type: "GET",
        isLocal: Pr.test(lt.protocol),
        global: !0,
        processData: !0,
        async: !0,
        contentType: "application/x-www-form-urlencoded; charset=UTF-8",
        accepts: {
          "*": qn,
          text: "text/plain",
          html: "text/html",
          xml: "application/xml, text/xml",
          json: "application/json, text/javascript",
        },
        contents: { xml: /\bxml\b/, html: /\bhtml/, json: /\bjson\b/ },
        responseFields: { xml: "responseXML", text: "responseText", json: "responseJSON" },
        converters: { "* text": String, "text html": !0, "text json": JSON.parse, "text xml": i.parseXML },
        flatOptions: { url: !0, context: !0 },
      },
      ajaxSetup: function (e, t) {
        return t ? Ut(Ut(e, i.ajaxSettings), t) : Ut(i.ajaxSettings, e);
      },
      ajaxPrefilter: Ln(jn),
      ajaxTransport: Ln(Wt),
      ajax: function (e, t) {
        typeof e == "object" && ((t = e), (e = void 0)), (t = t || {});
        var n,
          r,
          a,
          s,
          o,
          l,
          f,
          d,
          y,
          m,
          h = i.ajaxSetup({}, t),
          x = h.context || h,
          D = h.context && (x.nodeType || x.jquery) ? i(x) : i.event,
          I = i.Deferred(),
          O = i.Callbacks("once memory"),
          K = h.statusCode || {},
          Y = {},
          ve = {},
          me = "canceled",
          R = {
            readyState: 0,
            getResponseHeader: function (F) {
              var V;
              if (f) {
                if (!s)
                  for (s = {}; (V = Lr.exec(a)); )
                    s[V[1].toLowerCase() + " "] = (s[V[1].toLowerCase() + " "] || []).concat(V[2]);
                V = s[F.toLowerCase() + " "];
              }
              return V == null ? null : V.join(", ");
            },
            getAllResponseHeaders: function () {
              return f ? a : null;
            },
            setRequestHeader: function (F, V) {
              return f == null && ((F = ve[F.toLowerCase()] = ve[F.toLowerCase()] || F), (Y[F] = V)), this;
            },
            overrideMimeType: function (F) {
              return f == null && (h.mimeType = F), this;
            },
            statusCode: function (F) {
              var V;
              if (F)
                if (f) R.always(F[R.status]);
                else for (V in F) K[V] = [K[V], F[V]];
              return this;
            },
            abort: function (F) {
              var V = F || me;
              return n && n.abort(V), Fe(0, V), this;
            },
          };
        if (
          (I.promise(R),
          (h.url = ((e || h.url || lt.href) + "").replace($r, lt.protocol + "//")),
          (h.type = t.method || t.type || h.method || h.type),
          (h.dataTypes = (h.dataType || "*").toLowerCase().match(ge) || [""]),
          h.crossDomain == null)
        ) {
          l = _.createElement("a");
          try {
            (l.href = h.url),
              (l.href = l.href),
              (h.crossDomain = Xt.protocol + "//" + Xt.host != l.protocol + "//" + l.host);
          } catch (F) {
            h.crossDomain = !0;
          }
        }
        if (
          (h.data && h.processData && typeof h.data != "string" && (h.data = i.param(h.data, h.traditional)),
          Pn(jn, h, t, R),
          f)
        )
          return R;
        (d = i.event && h.global),
          d && i.active++ === 0 && i.event.trigger("ajaxStart"),
          (h.type = h.type.toUpperCase()),
          (h.hasContent = !Or.test(h.type)),
          (r = h.url.replace(jr, "")),
          h.hasContent
            ? h.data &&
              h.processData &&
              (h.contentType || "").indexOf("application/x-www-form-urlencoded") === 0 &&
              (h.data = h.data.replace(Nr, "+"))
            : ((m = h.url.slice(r.length)),
              h.data &&
                (h.processData || typeof h.data == "string") &&
                ((r += (It.test(r) ? "&" : "?") + h.data), delete h.data),
              h.cache === !1 && ((r = r.replace(qr, "$1")), (m = (It.test(r) ? "&" : "?") + "_=" + Mn.guid++ + m)),
              (h.url = r + m)),
          h.ifModified &&
            (i.lastModified[r] && R.setRequestHeader("If-Modified-Since", i.lastModified[r]),
            i.etag[r] && R.setRequestHeader("If-None-Match", i.etag[r])),
          ((h.data && h.hasContent && h.contentType !== !1) || t.contentType) &&
            R.setRequestHeader("Content-Type", h.contentType),
          R.setRequestHeader(
            "Accept",
            h.dataTypes[0] && h.accepts[h.dataTypes[0]]
              ? h.accepts[h.dataTypes[0]] + (h.dataTypes[0] !== "*" ? ", " + qn + "; q=0.01" : "")
              : h.accepts["*"],
          );
        for (y in h.headers) R.setRequestHeader(y, h.headers[y]);
        if (h.beforeSend && (h.beforeSend.call(x, R, h) === !1 || f)) return R.abort();
        if (((me = "abort"), O.add(h.complete), R.done(h.success), R.fail(h.error), (n = Pn(Wt, h, t, R)), !n))
          Fe(-1, "No Transport");
        else {
          if (((R.readyState = 1), d && D.trigger("ajaxSend", [R, h]), f)) return R;
          h.async &&
            h.timeout > 0 &&
            (o = k.setTimeout(function () {
              R.abort("timeout");
            }, h.timeout));
          try {
            (f = !1), n.send(Y, Fe);
          } catch (F) {
            if (f) throw F;
            Fe(-1, F);
          }
        }
        function Fe(F, V, dt, Vt) {
          var be,
            pt,
            xe,
            De,
            Ne,
            le = V;
          f ||
            ((f = !0),
            o && k.clearTimeout(o),
            (n = void 0),
            (a = Vt || ""),
            (R.readyState = F > 0 ? 4 : 0),
            (be = (F >= 200 && F < 300) || F === 304),
            dt && (De = Br(h, R, dt)),
            !be &&
              i.inArray("script", h.dataTypes) > -1 &&
              i.inArray("json", h.dataTypes) < 0 &&
              (h.converters["text script"] = function () {}),
            (De = Rr(h, De, R, be)),
            be
              ? (h.ifModified &&
                  ((Ne = R.getResponseHeader("Last-Modified")),
                  Ne && (i.lastModified[r] = Ne),
                  (Ne = R.getResponseHeader("etag")),
                  Ne && (i.etag[r] = Ne)),
                F === 204 || h.type === "HEAD"
                  ? (le = "nocontent")
                  : F === 304
                    ? (le = "notmodified")
                    : ((le = De.state), (pt = De.data), (xe = De.error), (be = !xe)))
              : ((xe = le), (F || !le) && ((le = "error"), F < 0 && (F = 0))),
            (R.status = F),
            (R.statusText = (V || le) + ""),
            be ? I.resolveWith(x, [pt, le, R]) : I.rejectWith(x, [R, le, xe]),
            R.statusCode(K),
            (K = void 0),
            d && D.trigger(be ? "ajaxSuccess" : "ajaxError", [R, h, be ? pt : xe]),
            O.fireWith(x, [R, le]),
            d && (D.trigger("ajaxComplete", [R, h]), --i.active || i.event.trigger("ajaxStop")));
        }
        return R;
      },
      getJSON: function (e, t, n) {
        return i.get(e, t, n, "json");
      },
      getScript: function (e, t) {
        return i.get(e, void 0, t, "script");
      },
    }),
      i.each(["get", "post"], function (e, t) {
        i[t] = function (n, r, a, s) {
          return (
            q(r) && ((s = s || a), (a = r), (r = void 0)),
            i.ajax(i.extend({ url: n, type: t, dataType: s, data: r, success: a }, i.isPlainObject(n) && n))
          );
        };
      }),
      i.ajaxPrefilter(function (e) {
        var t;
        for (t in e.headers) t.toLowerCase() === "content-type" && (e.contentType = e.headers[t] || "");
      }),
      (i._evalUrl = function (e, t, n) {
        return i.ajax({
          url: e,
          type: "GET",
          dataType: "script",
          cache: !0,
          async: !1,
          global: !1,
          converters: { "text script": function () {} },
          dataFilter: function (r) {
            i.globalEval(r, t, n);
          },
        });
      }),
      i.fn.extend({
        wrapAll: function (e) {
          var t;
          return (
            this[0] &&
              (q(e) && (e = e.call(this[0])),
              (t = i(e, this[0].ownerDocument).eq(0).clone(!0)),
              this[0].parentNode && t.insertBefore(this[0]),
              t
                .map(function () {
                  for (var n = this; n.firstElementChild; ) n = n.firstElementChild;
                  return n;
                })
                .append(this)),
            this
          );
        },
        wrapInner: function (e) {
          return q(e)
            ? this.each(function (t) {
                i(this).wrapInner(e.call(this, t));
              })
            : this.each(function () {
                var t = i(this),
                  n = t.contents();
                n.length ? n.wrapAll(e) : t.append(e);
              });
        },
        wrap: function (e) {
          var t = q(e);
          return this.each(function (n) {
            i(this).wrapAll(t ? e.call(this, n) : e);
          });
        },
        unwrap: function (e) {
          return (
            this.parent(e)
              .not("body")
              .each(function () {
                i(this).replaceWith(this.childNodes);
              }),
            this
          );
        },
      }),
      (i.expr.pseudos.hidden = function (e) {
        return !i.expr.pseudos.visible(e);
      }),
      (i.expr.pseudos.visible = function (e) {
        return !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
      }),
      (i.ajaxSettings.xhr = function () {
        try {
          return new k.XMLHttpRequest();
        } catch (e) {}
      });
    var Ir = { 0: 200, 1223: 204 },
      ct = i.ajaxSettings.xhr();
    (j.cors = !!ct && "withCredentials" in ct),
      (j.ajax = ct = !!ct),
      i.ajaxTransport(function (e) {
        var t, n;
        if (j.cors || (ct && !e.crossDomain))
          return {
            send: function (r, a) {
              var s,
                o = e.xhr();
              if ((o.open(e.type, e.url, e.async, e.username, e.password), e.xhrFields))
                for (s in e.xhrFields) o[s] = e.xhrFields[s];
              e.mimeType && o.overrideMimeType && o.overrideMimeType(e.mimeType),
                !e.crossDomain && !r["X-Requested-With"] && (r["X-Requested-With"] = "XMLHttpRequest");
              for (s in r) o.setRequestHeader(s, r[s]);
              (t = function (l) {
                return function () {
                  t &&
                    ((t = n = o.onload = o.onerror = o.onabort = o.ontimeout = o.onreadystatechange = null),
                    l === "abort"
                      ? o.abort()
                      : l === "error"
                        ? typeof o.status != "number"
                          ? a(0, "error")
                          : a(o.status, o.statusText)
                        : a(
                            Ir[o.status] || o.status,
                            o.statusText,
                            (o.responseType || "text") !== "text" || typeof o.responseText != "string"
                              ? { binary: o.response }
                              : { text: o.responseText },
                            o.getAllResponseHeaders(),
                          ));
                };
              }),
                (o.onload = t()),
                (n = o.onerror = o.ontimeout = t("error")),
                o.onabort !== void 0
                  ? (o.onabort = n)
                  : (o.onreadystatechange = function () {
                      o.readyState === 4 &&
                        k.setTimeout(function () {
                          t && n();
                        });
                    }),
                (t = t("abort"));
              try {
                o.send((e.hasContent && e.data) || null);
              } catch (l) {
                if (t) throw l;
              }
            },
            abort: function () {
              t && t();
            },
          };
      }),
      i.ajaxPrefilter(function (e) {
        e.crossDomain && (e.contents.script = !1);
      }),
      i.ajaxSetup({
        accepts: {
          script: "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript",
        },
        contents: { script: /\b(?:java|ecma)script\b/ },
        converters: {
          "text script": function (e) {
            return i.globalEval(e), e;
          },
        },
      }),
      i.ajaxPrefilter("script", function (e) {
        e.cache === void 0 && (e.cache = !1), e.crossDomain && (e.type = "GET");
      }),
      i.ajaxTransport("script", function (e) {
        if (e.crossDomain || e.scriptAttrs) {
          var t, n;
          return {
            send: function (r, a) {
              (t = i("<script>")
                .attr(e.scriptAttrs || {})
                .prop({ charset: e.scriptCharset, src: e.url })
                .on(
                  "load error",
                  (n = function (s) {
                    t.remove(), (n = null), s && a(s.type === "error" ? 404 : 200, s.type);
                  }),
                )),
                _.head.appendChild(t[0]);
            },
            abort: function () {
              n && n();
            },
          };
        }
      });
    var On = [],
      zt = /(=)\?(?=&|$)|\?\?/;
    i.ajaxSetup({
      jsonp: "callback",
      jsonpCallback: function () {
        var e = On.pop() || i.expando + "_" + Mn.guid++;
        return (this[e] = !0), e;
      },
    }),
      i.ajaxPrefilter("json jsonp", function (e, t, n) {
        var r,
          a,
          s,
          o =
            e.jsonp !== !1 &&
            (zt.test(e.url)
              ? "url"
              : typeof e.data == "string" &&
                (e.contentType || "").indexOf("application/x-www-form-urlencoded") === 0 &&
                zt.test(e.data) &&
                "data");
        if (o || e.dataTypes[0] === "jsonp")
          return (
            (r = e.jsonpCallback = q(e.jsonpCallback) ? e.jsonpCallback() : e.jsonpCallback),
            o
              ? (e[o] = e[o].replace(zt, "$1" + r))
              : e.jsonp !== !1 && (e.url += (It.test(e.url) ? "&" : "?") + e.jsonp + "=" + r),
            (e.converters["script json"] = function () {
              return s || i.error(r + " was not called"), s[0];
            }),
            (e.dataTypes[0] = "json"),
            (a = k[r]),
            (k[r] = function () {
              s = arguments;
            }),
            n.always(function () {
              a === void 0 ? i(k).removeProp(r) : (k[r] = a),
                e[r] && ((e.jsonpCallback = t.jsonpCallback), On.push(r)),
                s && q(a) && a(s[0]),
                (s = a = void 0);
            }),
            "script"
          );
      }),
      (j.createHTMLDocument = (function () {
        var e = _.implementation.createHTMLDocument("").body;
        return (e.innerHTML = "<form></form><form></form>"), e.childNodes.length === 2;
      })()),
      (i.parseHTML = function (e, t, n) {
        if (typeof e != "string") return [];
        typeof t == "boolean" && ((n = t), (t = !1));
        var r, a, s;
        return (
          t ||
            (j.createHTMLDocument
              ? ((t = _.implementation.createHTMLDocument("")),
                (r = t.createElement("base")),
                (r.href = _.location.href),
                t.head.appendChild(r))
              : (t = _)),
          (a = nn.exec(e)),
          (s = !n && []),
          a ? [t.createElement(a[1])] : ((a = pn([e], t, s)), s && s.length && i(s).remove(), i.merge([], a.childNodes))
        );
      }),
      (i.fn.load = function (e, t, n) {
        var r,
          a,
          s,
          o = this,
          l = e.indexOf(" ");
        return (
          l > -1 && ((r = Re(e.slice(l))), (e = e.slice(0, l))),
          q(t) ? ((n = t), (t = void 0)) : t && typeof t == "object" && (a = "POST"),
          o.length > 0 &&
            i
              .ajax({ url: e, type: a || "GET", dataType: "html", data: t })
              .done(function (f) {
                (s = arguments), o.html(r ? i("<div>").append(i.parseHTML(f)).find(r) : f);
              })
              .always(
                n &&
                  function (f, d) {
                    o.each(function () {
                      n.apply(this, s || [f.responseText, d, f]);
                    });
                  },
              ),
          this
        );
      }),
      (i.expr.pseudos.animated = function (e) {
        return i.grep(i.timers, function (t) {
          return e === t.elem;
        }).length;
      }),
      (i.offset = {
        setOffset: function (e, t, n) {
          var r,
            a,
            s,
            o,
            l,
            f,
            d,
            y = i.css(e, "position"),
            m = i(e),
            h = {};
          y === "static" && (e.style.position = "relative"),
            (l = m.offset()),
            (s = i.css(e, "top")),
            (f = i.css(e, "left")),
            (d = (y === "absolute" || y === "fixed") && (s + f).indexOf("auto") > -1),
            d ? ((r = m.position()), (o = r.top), (a = r.left)) : ((o = parseFloat(s) || 0), (a = parseFloat(f) || 0)),
            q(t) && (t = t.call(e, n, i.extend({}, l))),
            t.top != null && (h.top = t.top - l.top + o),
            t.left != null && (h.left = t.left - l.left + a),
            "using" in t ? t.using.call(e, h) : m.css(h);
        },
      }),
      i.fn.extend({
        offset: function (e) {
          if (arguments.length)
            return e === void 0
              ? this
              : this.each(function (a) {
                  i.offset.setOffset(this, e, a);
                });
          var t,
            n,
            r = this[0];
          if (r)
            return r.getClientRects().length
              ? ((t = r.getBoundingClientRect()),
                (n = r.ownerDocument.defaultView),
                { top: t.top + n.pageYOffset, left: t.left + n.pageXOffset })
              : { top: 0, left: 0 };
        },
        position: function () {
          if (this[0]) {
            var e,
              t,
              n,
              r = this[0],
              a = { top: 0, left: 0 };
            if (i.css(r, "position") === "fixed") t = r.getBoundingClientRect();
            else {
              for (
                t = this.offset(), n = r.ownerDocument, e = r.offsetParent || n.documentElement;
                e && (e === n.body || e === n.documentElement) && i.css(e, "position") === "static";
              )
                e = e.parentNode;
              e &&
                e !== r &&
                e.nodeType === 1 &&
                ((a = i(e).offset()),
                (a.top += i.css(e, "borderTopWidth", !0)),
                (a.left += i.css(e, "borderLeftWidth", !0)));
            }
            return {
              top: t.top - a.top - i.css(r, "marginTop", !0),
              left: t.left - a.left - i.css(r, "marginLeft", !0),
            };
          }
        },
        offsetParent: function () {
          return this.map(function () {
            for (var e = this.offsetParent; e && i.css(e, "position") === "static"; ) e = e.offsetParent;
            return e || Be;
          });
        },
      }),
      i.each({ scrollLeft: "pageXOffset", scrollTop: "pageYOffset" }, function (e, t) {
        var n = t === "pageYOffset";
        i.fn[e] = function (r) {
          return Ee(
            this,
            function (a, s, o) {
              var l;
              if ((Ce(a) ? (l = a) : a.nodeType === 9 && (l = a.defaultView), o === void 0)) return l ? l[t] : a[s];
              l ? l.scrollTo(n ? l.pageXOffset : o, n ? o : l.pageYOffset) : (a[s] = o);
            },
            e,
            r,
            arguments.length,
          );
        };
      }),
      i.each(["top", "left"], function (e, t) {
        i.cssHooks[t] = bn(j.pixelPosition, function (n, r) {
          if (r) return (r = ut(n, t)), Lt.test(r) ? i(n).position()[t] + "px" : r;
        });
      }),
      i.each({ Height: "height", Width: "width" }, function (e, t) {
        i.each({ padding: "inner" + e, content: t, "": "outer" + e }, function (n, r) {
          i.fn[r] = function (a, s) {
            var o = arguments.length && (n || typeof a != "boolean"),
              l = n || (a === !0 || s === !0 ? "margin" : "border");
            return Ee(
              this,
              function (f, d, y) {
                var m;
                return Ce(f)
                  ? r.indexOf("outer") === 0
                    ? f["inner" + e]
                    : f.document.documentElement["client" + e]
                  : f.nodeType === 9
                    ? ((m = f.documentElement),
                      Math.max(
                        f.body["scroll" + e],
                        m["scroll" + e],
                        f.body["offset" + e],
                        m["offset" + e],
                        m["client" + e],
                      ))
                    : y === void 0
                      ? i.css(f, d, l)
                      : i.style(f, d, y, l);
              },
              t,
              o ? a : void 0,
              o,
            );
          };
        });
      }),
      i.each(["ajaxStart", "ajaxStop", "ajaxComplete", "ajaxError", "ajaxSuccess", "ajaxSend"], function (e, t) {
        i.fn[t] = function (n) {
          return this.on(t, n);
        };
      }),
      i.fn.extend({
        bind: function (e, t, n) {
          return this.on(e, null, t, n);
        },
        unbind: function (e, t) {
          return this.off(e, null, t);
        },
        delegate: function (e, t, n, r) {
          return this.on(t, e, n, r);
        },
        undelegate: function (e, t, n) {
          return arguments.length === 1 ? this.off(e, "**") : this.off(t, e || "**", n);
        },
        hover: function (e, t) {
          return this.on("mouseenter", e).on("mouseleave", t || e);
        },
      }),
      i.each(
        "blur focus focusin focusout resize scroll click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup contextmenu".split(
          " ",
        ),
        function (e, t) {
          i.fn[t] = function (n, r) {
            return arguments.length > 0 ? this.on(t, null, n, r) : this.trigger(t);
          };
        },
      );
    var Fr = /^[\s\uFEFF\xA0]+|([^\s\uFEFF\xA0])[\s\uFEFF\xA0]+$/g;
    (i.proxy = function (e, t) {
      var n, r, a;
      if ((typeof t == "string" && ((n = e[t]), (t = e), (e = n)), !!q(e)))
        return (
          (r = Z.call(arguments, 2)),
          (a = function () {
            return e.apply(t || this, r.concat(Z.call(arguments)));
          }),
          (a.guid = e.guid = e.guid || i.guid++),
          a
        );
    }),
      (i.holdReady = function (e) {
        e ? i.readyWait++ : i.ready(!0);
      }),
      (i.isArray = Array.isArray),
      (i.parseJSON = JSON.parse),
      (i.nodeName = W),
      (i.isFunction = q),
      (i.isWindow = Ce),
      (i.camelCase = ye),
      (i.type = Q),
      (i.now = Date.now),
      (i.isNumeric = function (e) {
        var t = i.type(e);
        return (t === "number" || t === "string") && !isNaN(e - parseFloat(e));
      }),
      (i.trim = function (e) {
        return e == null ? "" : (e + "").replace(Fr, "$1");
      }),
      typeof define == "function" &&
        define.amd &&
        define("jquery", [], function () {
          return i;
        });
    var Wr = k.jQuery,
      Xr = k.$;
    return (
      (i.noConflict = function (e) {
        return k.$ === i && (k.$ = Xr), e && k.jQuery === i && (k.jQuery = Wr), i;
      }),
      typeof b == "undefined" && (k.jQuery = k.$ = i),
      i
    );
  });
});
var Yn = In(Zr(), 1);
var si = In(Vn(), 1);
var G = class G {
  static determinePage(b) {
    let T = b;
    for (; T !== null; ) {
      if (T.classList.contains("CXPage")) return T;
      T = T.parentElement;
    }
    return T;
  }
  static unfoldPanelAncestors(b) {
    let T = b;
    for (; T !== null; ) T.CodBi_HTML_Panel_Folded && T.CodBi_HTML_Panel_Header.click(), (T = T.parentElement);
  }
  static functionality(b, T) {
    var Z, et, qe, ue, Le, tt, Ae, nt, yt, j, q, Ce, _;
    if (XFC_METADATA.requestType === "print") return;
    let P;
    if (b.generateheader && T.children.length > 0 && b.generateheader.toLocaleLowerCase() === "true") {
      b.scroll === void 0
        ? (b.scroll = !1)
        : typeof b.scroll == "string" && (b.scroll = b.scroll.toLowerCase().trim() === "true"),
        b.scroll &&
          b.scrollblock &&
          typeof b.scrollblock == "string" &&
          (b.scrollblock = b.scrollblock.toLowerCase().trim()),
        b.scroll &&
          b.scrollblock !== "start" &&
          b.scrollblock !== "center" &&
          b.scrollblock !== "end" &&
          b.scrollblock !== "nearest" &&
          (b.scrollblock = "nearest");
      let Me = document.createElement("div");
      Me.classList.add("cHeader"), (P = document.createElement("div"));
      let de = T.querySelector("legend");
      b.autoheadertitlesuplementsspacer = b.autoheadertitlesuplementsspacer ? b.autoheadertitlesuplementsspacer : " / ";
      let Q = b.autoheadertitlesuplementsspacer,
        te = T.querySelectorAll(".CodBi_HTML_Panel_AutoHeaderTitle_Supplement"),
        Pe = () => {
          for (let i = 0; i < te.length; i++) Q += `${te[i].value === "" || i === 0 ? "" : ", "}${te[i].value}`;
        };
      for (let i = 0; i < te.length; i++)
        !Qn("XFieldSet", T, te[i]) &&
          !Qn("XContainer", T, te[i]) &&
          te[i].addEventListener("change", (Oe) => {
            (Q = b.autoheadertitlesuplementsspacer),
              Pe(),
              (P.innerHTML = `${b.autoheaderlevel ? `<h${b.autoheaderlevel}>` : ""}${b.autoheadertitle ? b.autoheadertitle + (Q.length !== b.autoheadertitlesuplementsspacer.length ? Q : "") : T.tagName === "FIELDSET" ? de.innerHTML + (Q.length === b.autoheadertitlesuplementsspacer.length ? "" : Q) : ""}${b.autoheaderlevel ? `</h${b.autoheaderlevel}>` : ""}`);
          });
      Pe(),
        (P.innerHTML = `${b.autoheaderlevel ? `<h${b.autoheaderlevel}>` : ""}${b.autoheadertitle ? b.autoheadertitle + (Q.length !== b.autoheadertitlesuplementsspacer.length ? Q : "") : T.tagName === "FIELDSET" && de ? ((Z = T.querySelector("legend")) == null ? void 0 : Z.innerHTML) + (Q.length === b.autoheadertitlesuplementsspacer.length ? "" : Q) : ""}${b.autoheaderlevel ? `</h${b.autoheaderlevel}>` : ""}`),
        de && de.remove(),
        P.setAttribute("style", b.autoheadercss),
        P.classList.add("CodBi_HTML_Panel_Header"),
        Me.appendChild(P),
        T.insertBefore(Me, T.firstChild);
    } else P = T.querySelector(".CodBi_HTML_Panel_Header");
    if (P === null)
      throw new Un(
        `Tagged <div> "${T.getAttribute("data-name")}" contains no HTML-Element tagged with CSS-"CodBi_HTML_Panel_Header".`,
      );
    {
      (T.CodBi_HTML_Panel_Header = P), T.classList.add("--HTML_Panel");
      let Me = P.getAttribute("style"),
        de = Array.from(T.children),
        Q = de.indexOf(P.parentElement),
        te = Q === de.length - 1 ? void 0 : de[Q];
      te && G.mapHeaderAfterElements.set(T, te);
      let Pe = T.style.display;
      (T.CodBi_HTML_Panel_Folded = document.body.classList.contains("fc-print-mode")
        ? !1
        : b.folded !== void 0
          ? b.folded.toLowerCase().trim() === "true"
          : !1),
        T.CodBi_HTML_Panel_Folded
          ? ((T.style.display = "none"), P == null || P.remove(), (et = T.parentElement) == null || et.appendChild(P))
          : b.cssheaderunfolded && (P == null || P.setAttribute("style", b.cssheaderunfolded)),
        T.CodBi_HTML_Panel_Folded && T.classList.add("--folded");
      let i = (qe = P.parentElement) == null ? void 0 : qe.getAttribute("id");
      i === null && (i = T.getAttribute("id"));
      let Oe = document.createElement("style");
      Oe.innerHTML = `
      @media( print ) {
        #${i}.CodBi.--HTML_Panel { display : ${Pe} !important ;}
      }

      .CodBi_HTML_Panel_MissingRequiredField { border-left-style: solid !important ; border-right-style: solid !important ; padding: .5em ; box-shadow: 0 0 .25em darkorange ; border-color: red !important ;}

      @media( prefers-color-scheme : dark ) {
        .CodBi_HTML_Panel_MissingRequiredField { border-left-style: solid !important ; border-right-style: solid !important ; padding: .5em ; box-shadow: 0 0 .25em darkorange ; border-color: darkorange !important ;}

        #${i} .CodBi_HTML_Panel_Header { ${b.dcssheaderunfolded ? b.dcssheaderunfolded : "background: linear-gradient(130deg, rgba(5, 5, 5, 1) 0%, rgba(56, 47, 47, 1) 23%, rgba(84, 62, 62, 1) 55%, rgba(56, 52, 52, 1) 89%, rgba(0, 0, 0, 1) 100%) !important ;"}}}

      .CodBi_HTML_Panel_Header > p { margin : 0 ;}

      #${i} .CodBi_HTML_Panel_Header:after,
      #${((Le = (ue = T.parentElement) == null ? void 0 : ue.parentElement)) == null ? void 0 : Le.getAttribute("id")} .CodBi_HTML_Panel_Header:after {
        content : "${b.cssafterheadercontent ? b.cssafterheadercontent : ""}";

        ${b.cssafterheader ? b.cssafterheader : ""}
      }

      #${i} .CodBi_HTML_Panel_Header:before,
      #${((Ae = (tt = T.parentElement) == null ? void 0 : tt.parentElement)) == null ? void 0 : Ae.getAttribute("id")} .CodBi_HTML_Panel_Header:before {
        content : "${b.cssbeforeheadercontent ? b.cssbeforeheadercontent : ""}";

        ${b.cssbeforeheader ? b.cssbeforeheader : ""}
      }

      #${i} .CodBi_HTML_Panel_Header:hover,
      .XFieldSetWrapper:has( #${i}) .CodBi_HTML_Panel_Header:hover     { ${b.cssheaderhover ? b.cssheaderhover : "color: darkorange ;"}}
      #${i} .CodBi_HTML_Panel_Header:hover > *,
      .XFieldSetWrapper:has( #${i}) .CodBi_HTML_Panel_Header:hover > * { ${b.cssheaderhover ? "" : "margin-left: 5% ; transition: .5s all ;"}}
      #${i} .CodBi_HTML_Panel_Header:active,
      .XFieldSetWrapper:has( #${i}) .CodBi_HTML_Panel_Header:active    { ${b.cssheaderactive ? b.cssheaderactive : "scale : .9 ;"}}

      ${
        b.cssanimfadeinpanel
          ? `@keyframes CodBi_FadeIN_Panel_${i} {
          ${b.cssanimfadeinpanel}}`
          : ""
      }

      #${i} .CodBi.--HTML_Panel,
      #${i}.CodBi.--HTML_Panel    { animation : CodBi_FadeIN_Panel_${i} ${b.cssanimfadeinpanelduration ? b.cssanimfadeinpanelduration : "0s"} ${b.cssanimfadeinpaneleasing ? b.cssanimfadeinpaneleasing : "ease-in-out"} forwards ;}`;
      let W = document.createElement("style");
      W.innerHTML = `
        #${i} > style + .CodBi_HTML_Panel_Header::after,
        #${i} > * > style + .CodBi_HTML_Panel_Header::after {
          content : "${b.cssafterheadercontentunfolded ? b.cssafterheadercontentunfolded : b.cssafterheadercontent ? b.cssafterheadercontent : ""}";

          ${b.cssafterheaderunfolded ? b.cssafterheaderunfolded : b.cssafterheader ? b.cssafterheader : ""}}`;
      let rt = document.createElement("style");
      (rt.innerHTML = `
        #${i} > style + .CodBi_HTML_Panel_Header::before,
        #${i} > * > style + .CodBi_HTML_Panel_Header::before {
          content : "${b.cssbeforeheadercontentunfolded ? b.cssbeforeheadercontentunfolded : b.cssbeforeheadercontent ? b.cssbeforeheadercontent : ""}";

          ${b.cssbeforeheaderunfolded ? b.cssbeforeheaderunfolded : b.cssbeforeheader ? b.cssbeforeheader : ""}}`),
        (nt = P.parentElement) == null || nt.insertBefore(Oe, P),
        b.wrappercss &&
          (yt = T.parentElement) != null &&
          yt.classList.contains("XFieldSetWrapper") &&
          ((j = T.parentElement) == null || j.setAttribute("style", b.wrappercss)),
        P.addEventListener("click", (we) => {
          var L, oe, $e, z;
          if (T.CodBi_HTML_Panel_Folded) {
            if (
              ((T.CodBi_HTML_Panel_Folded = !T.CodBi_HTML_Panel_Folded),
              (T.style.display = Pe),
              P == null || P.remove(),
              b.cssheaderunfolded && P.setAttribute("style", b.cssheaderunfolded),
              te === void 0 ? T.appendChild(P) : T.insertBefore(P, te),
              (b.cssafterheadercontentunfolded || b.cssafterheaderunfolded) &&
                ((L = P.parentElement) == null || L.insertBefore(W, P),
                (oe = P.parentElement) == null || oe.insertBefore(rt, P)),
              b.scroll && T.scrollIntoView({ behavior: "smooth", block: b.scrollblock, inline: "nearest" }),
              T.hasAttribute("data-cb-accordion"))
            ) {
              b.accordion = T.getAttribute("data-cb-accordion");
              for (let J of document.querySelectorAll(
                `.CodBi.--HTML_Panel[ data-cb-accordion = "${b.accordion}"]:not(.--folded)`,
              ))
                ($e = J.querySelector(".CodBi_HTML_Panel_Header")) == null ||
                  $e.dispatchEvent(new MouseEvent("click", { bubbles: !0 }));
            }
            T.classList.remove("--folded");
          } else
            (T.CodBi_HTML_Panel_Folded = !T.CodBi_HTML_Panel_Folded),
              (T.style.display = "none"),
              P.remove(),
              Me && P.setAttribute("style", Me),
              (z = T.parentElement) == null || z.appendChild(P),
              (b.cssafterheadercontentunfolded || b.cssafterheaderunfolded) && (W.remove(), rt.remove()),
              T.classList.add("--folded");
        });
      let vt = !1;
      for (let we of T.querySelectorAll('[ aria-required = "true"]')) vt = !0;
      if (vt) {
        let we = document.createElement("style");
        (we.innerHTML = `
          #${i} > .CodBi_HTML_Panel_Header:before,
          #${((Ce = (q = T.parentElement) == null ? void 0 : q.parentElement)) == null ? void 0 : Ce.getAttribute("id")} > * > .CodBi_HTML_Panel_Header:before {
            content : "${b.cssrequiredfieldscontent ? b.cssrequiredfieldscontent : "*"}";

          ${b.cssrequiredfields ? b.cssrequiredfields : "color : red ; position : relative ; top : .5em ;"}}`),
          (_ = P.parentElement) == null || _.insertBefore(we, P);
      }
      (0, Yn.getXUtil)().on("submit", (we) => {
        var oe, $e;
        for (let z of document.querySelectorAll(".CodBi_HTML_Panel_MissingRequiredField"))
          z.classList.remove("CodBi_HTML_Panel_MissingRequiredField");
        let L = !1;
        for (let z of document.querySelectorAll('[ aria-required = "true"]'))
          if ((z.value === "" || z.value === void 0) && (G.unfoldPanelAncestors(z), !ei(z))) {
            let J = !1;
            if (z.classList.contains("XSelect"))
              for (let _e of z.querySelectorAll("input")) _e.checked === !0 && (J = !0);
            if (!J) {
              let _e = (oe = G.determinePage(z)) == null ? void 0 : oe.getAttribute("data-xn");
              return (
                _e && (gotoPage(_e), z.scrollIntoView({ behavior: "smooth", block: b.scrollblock })),
                z.focus(),
                z.classList.add("CodBi_HTML_Panel_MissingRequiredField"),
                { preventSubmission: !0 }
              );
            }
          }
        if (G.invalidElements.length === 0) return { preventSubmission: !1 };
        for (let z of G.invalidElements) {
          (L = !0), G.unfoldPanelAncestors(z);
          let J = ($e = G.determinePage(z)) == null ? void 0 : $e.getAttribute("data-xn");
          J && (gotoPage(J), z.scrollIntoView({ behavior: "smooth", block: b.scrollblock })), z.focus();
        }
        return { preventSubmission: L };
      }),
        G.validatorRegistered ||
          xm_validator.on("begin", (we) => {
            for (let L of we.items)
              !G.invalidElements.includes(L) && L.getAttribute("aria-invalid") === "true" && G.invalidElements.push(L),
                G.invalidElements.includes(L) &&
                  L.getAttribute("aria-invalid") === "false" &&
                  (G.invalidElements = G.invalidElements.filter((oe) => oe !== L));
          });
    }
  }
};
(G.mapHeaderAfterElements = new Map()),
  (G.invalidElements = new Array()),
  (G.validatorRegistered = !1),
  (G.registered = window.codbi.registerFunctionality("HTML.Panel", G.functionality)),
  Fn(
    [
      Wn.ParamvalueProvider,
      Mt(0, gt.PRE(gt.stdExp.keyPath, "path")),
      Mt(0, gt.PRE(gt.stdExp.property, "property")),
      Mt(1, Xn.PRE(HTMLDivElement)),
    ],
    G,
    "functionality",
    1,
  );
var Gn = G;
function Qn(k, b, T) {
  for (; T && T !== b; ) {
    if (
      T.getAttribute("class").indexOf(` ${k} `) !== -1 ||
      T.getAttribute("class").indexOf(` ${k}"`) !== -1 ||
      T.getAttribute("class").indexOf(`"${k} `) !== -1 ||
      T.getAttribute("class").indexOf(`"${k}"`) !== -1
    )
      return !0;
    T = T.parentElement;
  }
  return !1;
}
function ei(k) {
  for (; k !== null; ) {
    if (k.style.display === "none") return !0;
    k = k.parentElement;
  }
  return !1;
}
export { Gn as HTML_Panel };
/*! Bundled license information:

jquery/dist/jquery.js:
  (*!
   * jQuery JavaScript Library v3.7.1
   * https://jquery.com/
   *
   * Copyright OpenJS Foundation and other contributors
   * Released under the MIT license
   * https://jquery.org/license
   *
   * Date: 2023-08-28T13:37Z
   *)
*/
