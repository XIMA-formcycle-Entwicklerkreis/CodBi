import { a as me } from "./chunk-K3A632J4.js";
import { a as pe } from "./chunk-QM2ZX7FA.js";
import { a as fe } from "./chunk-MUWAMKOD.js";
import { g as ce, h as de } from "./chunk-RS4WWU7K.js";
var M =
    typeof window != "undefined"
      ? window
      : typeof global != "undefined"
        ? global
        : typeof self != "undefined"
          ? self
          : {},
  _ = function (e, t, n, a, o, u, c, p, h, g) {
    var m = this;
    (m.numeralDecimalMark = e || "."),
      (m.numeralIntegerScale = t > 0 ? t : 0),
      (m.numeralDecimalScale = n >= 0 ? n : 2),
      (m.numeralThousandsGroupStyle = a || _.groupStyle.thousand),
      (m.numeralPositiveOnly = !!o),
      (m.stripLeadingZeroes = u !== !1),
      (m.prefix = c || c === "" ? c : ""),
      (m.signBeforePrefix = !!p),
      (m.tailPrefix = !!h),
      (m.delimiter = g || g === "" ? g : ","),
      (m.delimiterRE = g ? new RegExp("\\" + g, "g") : "");
  };
_.groupStyle = { thousand: "thousand", lakh: "lakh", wan: "wan", none: "none" };
_.prototype = {
  getRawValue: function (e) {
    return e.replace(this.delimiterRE, "").replace(this.numeralDecimalMark, ".");
  },
  format: function (e) {
    var t = this,
      n,
      a,
      o,
      u,
      c = "";
    switch (
      ((e = e
        .replace(/[A-Za-z]/g, "")
        .replace(t.numeralDecimalMark, "M")
        .replace(/[^\dM-]/g, "")
        .replace(/^\-/, "N")
        .replace(/\-/g, "")
        .replace("N", t.numeralPositiveOnly ? "" : "-")
        .replace("M", t.numeralDecimalMark)),
      t.stripLeadingZeroes && (e = e.replace(/^(-)?0+(?=\d)/, "$1")),
      (a = e.slice(0, 1) === "-" ? "-" : ""),
      typeof t.prefix != "undefined" ? (t.signBeforePrefix ? (o = a + t.prefix) : (o = t.prefix + a)) : (o = a),
      (u = e),
      e.indexOf(t.numeralDecimalMark) >= 0 &&
        ((n = e.split(t.numeralDecimalMark)),
        (u = n[0]),
        (c = t.numeralDecimalMark + n[1].slice(0, t.numeralDecimalScale))),
      a === "-" && (u = u.slice(1)),
      t.numeralIntegerScale > 0 && (u = u.slice(0, t.numeralIntegerScale)),
      t.numeralThousandsGroupStyle)
    ) {
      case _.groupStyle.lakh:
        u = u.replace(/(\d)(?=(\d\d)+\d$)/g, "$1" + t.delimiter);
        break;
      case _.groupStyle.wan:
        u = u.replace(/(\d)(?=(\d{4})+$)/g, "$1" + t.delimiter);
        break;
      case _.groupStyle.thousand:
        u = u.replace(/(\d)(?=(\d{3})+$)/g, "$1" + t.delimiter);
        break;
    }
    return t.tailPrefix
      ? a + u.toString() + (t.numeralDecimalScale > 0 ? c.toString() : "") + t.prefix
      : o + u.toString() + (t.numeralDecimalScale > 0 ? c.toString() : "");
  },
};
var Re = _,
  he = function (e, t, n) {
    var a = this;
    (a.date = []),
      (a.blocks = []),
      (a.datePattern = e),
      (a.dateMin = t
        .split("-")
        .reverse()
        .map(function (o) {
          return parseInt(o, 10);
        })),
      a.dateMin.length === 2 && a.dateMin.unshift(0),
      (a.dateMax = n
        .split("-")
        .reverse()
        .map(function (o) {
          return parseInt(o, 10);
        })),
      a.dateMax.length === 2 && a.dateMax.unshift(0),
      a.initBlocks();
  };
he.prototype = {
  initBlocks: function () {
    var e = this;
    e.datePattern.forEach(function (t) {
      t === "Y" ? e.blocks.push(4) : e.blocks.push(2);
    });
  },
  getISOFormatDate: function () {
    var e = this,
      t = e.date;
    return t[2] ? t[2] + "-" + e.addLeadingZero(t[1]) + "-" + e.addLeadingZero(t[0]) : "";
  },
  getBlocks: function () {
    return this.blocks;
  },
  getValidatedDate: function (e) {
    var t = this,
      n = "";
    return (
      (e = e.replace(/[^\d]/g, "")),
      t.blocks.forEach(function (a, o) {
        if (e.length > 0) {
          var u = e.slice(0, a),
            c = u.slice(0, 1),
            p = e.slice(a);
          switch (t.datePattern[o]) {
            case "d":
              u === "00" ? (u = "01") : parseInt(c, 10) > 3 ? (u = "0" + c) : parseInt(u, 10) > 31 && (u = "31");
              break;
            case "m":
              u === "00" ? (u = "01") : parseInt(c, 10) > 1 ? (u = "0" + c) : parseInt(u, 10) > 12 && (u = "12");
              break;
          }
          (n += u), (e = p);
        }
      }),
      this.getFixedDateString(n)
    );
  },
  getFixedDateString: function (e) {
    var t = this,
      n = t.datePattern,
      a = [],
      o = 0,
      u = 0,
      c = 0,
      p = 0,
      h = 0,
      g = 0,
      m,
      S,
      v,
      w = !1;
    e.length === 4 &&
      n[0].toLowerCase() !== "y" &&
      n[1].toLowerCase() !== "y" &&
      ((p = n[0] === "d" ? 0 : 2),
      (h = 2 - p),
      (m = parseInt(e.slice(p, p + 2), 10)),
      (S = parseInt(e.slice(h, h + 2), 10)),
      (a = this.getFixedDate(m, S, 0))),
      e.length === 8 &&
        (n.forEach(function (C, I) {
          switch (C) {
            case "d":
              o = I;
              break;
            case "m":
              u = I;
              break;
            default:
              c = I;
              break;
          }
        }),
        (g = c * 2),
        (p = o <= c ? o * 2 : o * 2 + 2),
        (h = u <= c ? u * 2 : u * 2 + 2),
        (m = parseInt(e.slice(p, p + 2), 10)),
        (S = parseInt(e.slice(h, h + 2), 10)),
        (v = parseInt(e.slice(g, g + 4), 10)),
        (w = e.slice(g, g + 4).length === 4),
        (a = this.getFixedDate(m, S, v))),
      e.length === 4 &&
        (n[0] === "y" || n[1] === "y") &&
        ((h = n[0] === "m" ? 0 : 2),
        (g = 2 - h),
        (S = parseInt(e.slice(h, h + 2), 10)),
        (v = parseInt(e.slice(g, g + 2), 10)),
        (w = e.slice(g, g + 2).length === 2),
        (a = [0, S, v])),
      e.length === 6 &&
        (n[0] === "Y" || n[1] === "Y") &&
        ((h = n[0] === "m" ? 0 : 4),
        (g = 2 - 0.5 * h),
        (S = parseInt(e.slice(h, h + 2), 10)),
        (v = parseInt(e.slice(g, g + 4), 10)),
        (w = e.slice(g, g + 4).length === 4),
        (a = [0, S, v])),
      (a = t.getRangeFixedDate(a)),
      (t.date = a);
    var D =
      a.length === 0
        ? e
        : n.reduce(function (C, I) {
            switch (I) {
              case "d":
                return C + (a[0] === 0 ? "" : t.addLeadingZero(a[0]));
              case "m":
                return C + (a[1] === 0 ? "" : t.addLeadingZero(a[1]));
              case "y":
                return C + (w ? t.addLeadingZeroForYear(a[2], !1) : "");
              case "Y":
                return C + (w ? t.addLeadingZeroForYear(a[2], !0) : "");
            }
          }, "");
    return D;
  },
  getRangeFixedDate: function (e) {
    var t = this,
      n = t.datePattern,
      a = t.dateMin || [],
      o = t.dateMax || [];
    return !e.length ||
      (a.length < 3 && o.length < 3) ||
      (n.find(function (u) {
        return u.toLowerCase() === "y";
      }) &&
        e[2] === 0)
      ? e
      : o.length && (o[2] < e[2] || (o[2] === e[2] && (o[1] < e[1] || (o[1] === e[1] && o[0] < e[0]))))
        ? o
        : a.length && (a[2] > e[2] || (a[2] === e[2] && (a[1] > e[1] || (a[1] === e[1] && a[0] > e[0]))))
          ? a
          : e;
  },
  getFixedDate: function (e, t, n) {
    return (
      (e = Math.min(e, 31)),
      (t = Math.min(t, 12)),
      (n = parseInt(n || 0, 10)),
      ((t < 7 && t % 2 === 0) || (t > 8 && t % 2 === 1)) &&
        (e = Math.min(e, t === 2 ? (this.isLeapYear(n) ? 29 : 28) : 30)),
      [e, t, n]
    );
  },
  isLeapYear: function (e) {
    return (e % 4 === 0 && e % 100 !== 0) || e % 400 === 0;
  },
  addLeadingZero: function (e) {
    return (e < 10 ? "0" : "") + e;
  },
  addLeadingZeroForYear: function (e, t) {
    return t ? (e < 10 ? "000" : e < 100 ? "00" : e < 1e3 ? "0" : "") + e : (e < 10 ? "0" : "") + e;
  },
};
var Oe = he,
  ge = function (e, t) {
    var n = this;
    (n.time = []), (n.blocks = []), (n.timePattern = e), (n.timeFormat = t), n.initBlocks();
  };
ge.prototype = {
  initBlocks: function () {
    var e = this;
    e.timePattern.forEach(function () {
      e.blocks.push(2);
    });
  },
  getISOFormatTime: function () {
    var e = this,
      t = e.time;
    return t[2] ? e.addLeadingZero(t[0]) + ":" + e.addLeadingZero(t[1]) + ":" + e.addLeadingZero(t[2]) : "";
  },
  getBlocks: function () {
    return this.blocks;
  },
  getTimeFormatOptions: function () {
    var e = this;
    return String(e.timeFormat) === "12"
      ? { maxHourFirstDigit: 1, maxHours: 12, maxMinutesFirstDigit: 5, maxMinutes: 60 }
      : { maxHourFirstDigit: 2, maxHours: 23, maxMinutesFirstDigit: 5, maxMinutes: 60 };
  },
  getValidatedTime: function (e) {
    var t = this,
      n = "";
    e = e.replace(/[^\d]/g, "");
    var a = t.getTimeFormatOptions();
    return (
      t.blocks.forEach(function (o, u) {
        if (e.length > 0) {
          var c = e.slice(0, o),
            p = c.slice(0, 1),
            h = e.slice(o);
          switch (t.timePattern[u]) {
            case "h":
              parseInt(p, 10) > a.maxHourFirstDigit
                ? (c = "0" + p)
                : parseInt(c, 10) > a.maxHours && (c = a.maxHours + "");
              break;
            case "m":
            case "s":
              parseInt(p, 10) > a.maxMinutesFirstDigit
                ? (c = "0" + p)
                : parseInt(c, 10) > a.maxMinutes && (c = a.maxMinutes + "");
              break;
          }
          (n += c), (e = h);
        }
      }),
      this.getFixedTimeString(n)
    );
  },
  getFixedTimeString: function (e) {
    var t = this,
      n = t.timePattern,
      a = [],
      o = 0,
      u = 0,
      c = 0,
      p = 0,
      h = 0,
      g = 0,
      m,
      S,
      v;
    return (
      e.length === 6 &&
        (n.forEach(function (w, D) {
          switch (w) {
            case "s":
              o = D * 2;
              break;
            case "m":
              u = D * 2;
              break;
            case "h":
              c = D * 2;
              break;
          }
        }),
        (g = c),
        (h = u),
        (p = o),
        (m = parseInt(e.slice(p, p + 2), 10)),
        (S = parseInt(e.slice(h, h + 2), 10)),
        (v = parseInt(e.slice(g, g + 2), 10)),
        (a = this.getFixedTime(v, S, m))),
      e.length === 4 &&
        t.timePattern.indexOf("s") < 0 &&
        (n.forEach(function (w, D) {
          switch (w) {
            case "m":
              u = D * 2;
              break;
            case "h":
              c = D * 2;
              break;
          }
        }),
        (g = c),
        (h = u),
        (m = 0),
        (S = parseInt(e.slice(h, h + 2), 10)),
        (v = parseInt(e.slice(g, g + 2), 10)),
        (a = this.getFixedTime(v, S, m))),
      (t.time = a),
      a.length === 0
        ? e
        : n.reduce(function (w, D) {
            switch (D) {
              case "s":
                return w + t.addLeadingZero(a[2]);
              case "m":
                return w + t.addLeadingZero(a[1]);
              case "h":
                return w + t.addLeadingZero(a[0]);
            }
          }, "")
    );
  },
  getFixedTime: function (e, t, n) {
    return (n = Math.min(parseInt(n || 0, 10), 60)), (t = Math.min(t, 60)), (e = Math.min(e, 60)), [e, t, n];
  },
  addLeadingZero: function (e) {
    return (e < 10 ? "0" : "") + e;
  },
};
var Le = ge,
  ye = function (e, t) {
    var n = this;
    (n.delimiter = t || t === "" ? t : " "), (n.delimiterRE = t ? new RegExp("\\" + t, "g") : ""), (n.formatter = e);
  };
ye.prototype = {
  setFormatter: function (e) {
    this.formatter = e;
  },
  format: function (e) {
    var t = this;
    t.formatter.clear(),
      (e = e.replace(/[^\d+]/g, "")),
      (e = e.replace(/^\+/, "B").replace(/\+/g, "").replace("B", "+")),
      (e = e.replace(t.delimiterRE, ""));
    for (var n = "", a, o = !1, u = 0, c = e.length; u < c; u++)
      (a = t.formatter.inputDigit(e.charAt(u))), /[\s()-]/g.test(a) ? ((n = a), (o = !0)) : o || (n = a);
    return (n = n.replace(/[()]/g, "")), (n = n.replace(/[\s-]/g, t.delimiter)), n;
  },
};
var Ue = ye,
  H = {
    blocks: {
      uatp: [4, 5, 6],
      amex: [4, 6, 5],
      diners: [4, 6, 4],
      discover: [4, 4, 4, 4],
      mastercard: [4, 4, 4, 4],
      dankort: [4, 4, 4, 4],
      instapayment: [4, 4, 4, 4],
      jcb15: [4, 6, 5],
      jcb: [4, 4, 4, 4],
      maestro: [4, 4, 4, 4],
      visa: [4, 4, 4, 4],
      mir: [4, 4, 4, 4],
      unionPay: [4, 4, 4, 4],
      general: [4, 4, 4, 4],
    },
    re: {
      uatp: /^(?!1800)1\d{0,14}/,
      amex: /^3[47]\d{0,13}/,
      discover: /^(?:6011|65\d{0,2}|64[4-9]\d?)\d{0,12}/,
      diners: /^3(?:0([0-5]|9)|[689]\d?)\d{0,11}/,
      mastercard: /^(5[1-5]\d{0,2}|22[2-9]\d{0,1}|2[3-7]\d{0,2})\d{0,12}/,
      dankort: /^(5019|4175|4571)\d{0,12}/,
      instapayment: /^63[7-9]\d{0,13}/,
      jcb15: /^(?:2131|1800)\d{0,11}/,
      jcb: /^(?:35\d{0,2})\d{0,12}/,
      maestro: /^(?:5[0678]\d{0,2}|6304|67\d{0,2})\d{0,12}/,
      mir: /^220[0-4]\d{0,12}/,
      visa: /^4\d{0,15}/,
      unionPay: /^(62|81)\d{0,14}/,
    },
    getStrictBlocks: function (e) {
      var t = e.reduce(function (n, a) {
        return n + a;
      }, 0);
      return e.concat(19 - t);
    },
    getInfo: function (e, t) {
      var n = H.blocks,
        a = H.re;
      t = !!t;
      for (var o in a)
        if (a[o].test(e)) {
          var u = n[o];
          return { type: o, blocks: t ? this.getStrictBlocks(u) : u };
        }
      return { type: "unknown", blocks: t ? this.getStrictBlocks(n.general) : n.general };
    },
  },
  je = H,
  Ne = {
    noop: function () {},
    strip: function (e, t) {
      return e.replace(t, "");
    },
    getPostDelimiter: function (e, t, n) {
      if (n.length === 0) return e.slice(-t.length) === t ? t : "";
      var a = "";
      return (
        n.forEach(function (o) {
          e.slice(-o.length) === o && (a = o);
        }),
        a
      );
    },
    getDelimiterREByDelimiter: function (e) {
      return new RegExp(e.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1"), "g");
    },
    getNextCursorPosition: function (e, t, n, a, o) {
      return t.length === e ? n.length : e + this.getPositionOffset(e, t, n, a, o);
    },
    getPositionOffset: function (e, t, n, a, o) {
      var u, c, p;
      return (
        (u = this.stripDelimiters(t.slice(0, e), a, o)),
        (c = this.stripDelimiters(n.slice(0, e), a, o)),
        (p = u.length - c.length),
        p !== 0 ? p / Math.abs(p) : 0
      );
    },
    stripDelimiters: function (e, t, n) {
      var a = this;
      if (n.length === 0) {
        var o = t ? a.getDelimiterREByDelimiter(t) : "";
        return e.replace(o, "");
      }
      return (
        n.forEach(function (u) {
          u.split("").forEach(function (c) {
            e = e.replace(a.getDelimiterREByDelimiter(c), "");
          });
        }),
        e
      );
    },
    headStr: function (e, t) {
      return e.slice(0, t);
    },
    getMaxLength: function (e) {
      return e.reduce(function (t, n) {
        return t + n;
      }, 0);
    },
    getPrefixStrippedValue: function (e, t, n, a, o, u, c, p, h) {
      if (n === 0) return e;
      if (e === t && e !== "") return "";
      if (h && e.slice(0, 1) == "-") {
        var g = a.slice(0, 1) == "-" ? a.slice(1) : a;
        return "-" + this.getPrefixStrippedValue(e.slice(1), t, n, g, o, u, c, p, h);
      }
      if (a.slice(0, n) !== t && !p) return c && !a && e ? e : "";
      if (a.slice(-n) !== t && p) return c && !a && e ? e : "";
      var m = this.stripDelimiters(a, o, u);
      return e.slice(0, n) !== t && !p
        ? m.slice(n)
        : e.slice(-n) !== t && p
          ? m.slice(0, -n - 1)
          : p
            ? e.slice(0, -n)
            : e.slice(n);
    },
    getFirstDiffIndex: function (e, t) {
      for (var n = 0; e.charAt(n) === t.charAt(n); ) if (e.charAt(n++) === "") return -1;
      return n;
    },
    getFormattedValue: function (e, t, n, a, o, u) {
      var c = "",
        p = o.length > 0,
        h = "";
      return n === 0
        ? e
        : (t.forEach(function (g, m) {
            if (e.length > 0) {
              var S = e.slice(0, g),
                v = e.slice(g);
              p ? (h = o[u ? m - 1 : m] || h) : (h = a),
                u ? (m > 0 && (c += h), (c += S)) : ((c += S), S.length === g && m < n - 1 && (c += h)),
                (e = v);
            }
          }),
          c);
    },
    fixPrefixCursor: function (e, t, n, a) {
      if (e) {
        var o = e.value,
          u = n || a[0] || " ";
        if (!(!e.setSelectionRange || !t || t.length + u.length <= o.length)) {
          var c = o.length * 2;
          setTimeout(function () {
            e.setSelectionRange(c, c);
          }, 1);
        }
      }
    },
    checkFullSelection: function (e) {
      try {
        var t = window.getSelection() || document.getSelection() || {};
        return t.toString().length === e.length;
      } catch (n) {}
      return !1;
    },
    setSelection: function (e, t, n) {
      if (e === this.getActiveElement(n) && !(e && e.value.length <= t))
        if (e.createTextRange) {
          var a = e.createTextRange();
          a.move("character", t), a.select();
        } else
          try {
            e.setSelectionRange(t, t);
          } catch (o) {
            console.warn("The input element type does not support selection");
          }
    },
    getActiveElement: function (e) {
      var t = e.activeElement;
      return t && t.shadowRoot ? this.getActiveElement(t.shadowRoot) : t;
    },
    isAndroid: function () {
      return navigator && /android/i.test(navigator.userAgent);
    },
    isAndroidBackspaceKeydown: function (e, t) {
      return !this.isAndroid() || !e || !t ? !1 : t === e.slice(0, -1);
    },
  },
  Ze = Ne,
  He = {
    assign: function (e, t) {
      return (
        (e = e || {}),
        (t = t || {}),
        (e.creditCard = !!t.creditCard),
        (e.creditCardStrictMode = !!t.creditCardStrictMode),
        (e.creditCardType = ""),
        (e.onCreditCardTypeChanged = t.onCreditCardTypeChanged || function () {}),
        (e.phone = !!t.phone),
        (e.phoneRegionCode = t.phoneRegionCode || "AU"),
        (e.phoneFormatter = {}),
        (e.time = !!t.time),
        (e.timePattern = t.timePattern || ["h", "m", "s"]),
        (e.timeFormat = t.timeFormat || "24"),
        (e.timeFormatter = {}),
        (e.date = !!t.date),
        (e.datePattern = t.datePattern || ["d", "m", "Y"]),
        (e.dateMin = t.dateMin || ""),
        (e.dateMax = t.dateMax || ""),
        (e.dateFormatter = {}),
        (e.numeral = !!t.numeral),
        (e.numeralIntegerScale = t.numeralIntegerScale > 0 ? t.numeralIntegerScale : 0),
        (e.numeralDecimalScale = t.numeralDecimalScale >= 0 ? t.numeralDecimalScale : 2),
        (e.numeralDecimalMark = t.numeralDecimalMark || "."),
        (e.numeralThousandsGroupStyle = t.numeralThousandsGroupStyle || "thousand"),
        (e.numeralPositiveOnly = !!t.numeralPositiveOnly),
        (e.stripLeadingZeroes = t.stripLeadingZeroes !== !1),
        (e.signBeforePrefix = !!t.signBeforePrefix),
        (e.tailPrefix = !!t.tailPrefix),
        (e.swapHiddenInput = !!t.swapHiddenInput),
        (e.numericOnly = e.creditCard || e.date || !!t.numericOnly),
        (e.uppercase = !!t.uppercase),
        (e.lowercase = !!t.lowercase),
        (e.prefix = e.creditCard || e.date ? "" : t.prefix || ""),
        (e.noImmediatePrefix = !!t.noImmediatePrefix),
        (e.prefixLength = e.prefix.length),
        (e.rawValueTrimPrefix = !!t.rawValueTrimPrefix),
        (e.copyDelimiter = !!t.copyDelimiter),
        (e.initValue = t.initValue !== void 0 && t.initValue !== null ? t.initValue.toString() : ""),
        (e.delimiter =
          t.delimiter || t.delimiter === ""
            ? t.delimiter
            : t.date
              ? "/"
              : t.time
                ? ":"
                : t.numeral
                  ? ","
                  : (t.phone, " ")),
        (e.delimiterLength = e.delimiter.length),
        (e.delimiterLazyShow = !!t.delimiterLazyShow),
        (e.delimiters = t.delimiters || []),
        (e.blocks = t.blocks || []),
        (e.blocksLength = e.blocks.length),
        (e.root = typeof M == "object" && M ? M : window),
        (e.document = t.document || e.root.document),
        (e.maxLength = 0),
        (e.backspace = !1),
        (e.result = ""),
        (e.onValueChanged = t.onValueChanged || function () {}),
        e
      );
    },
  },
  Ye = He,
  y = function (e, t) {
    var n = this,
      a = !1;
    if (
      (typeof e == "string"
        ? ((n.element = document.querySelector(e)), (a = document.querySelectorAll(e).length > 1))
        : typeof e.length != "undefined" && e.length > 0
          ? ((n.element = e[0]), (a = e.length > 1))
          : (n.element = e),
      !n.element)
    )
      throw new Error("[cleave.js] Please check the element");
    if (a)
      try {
        console.warn("[cleave.js] Multiple input fields matched, cleave.js will only take the first one.");
      } catch (o) {}
    (t.initValue = n.element.value), (n.properties = y.DefaultProperties.assign({}, t)), n.init();
  };
y.prototype = {
  init: function () {
    var e = this,
      t = e.properties;
    if (!t.numeral && !t.phone && !t.creditCard && !t.time && !t.date && t.blocksLength === 0 && !t.prefix) {
      e.onInput(t.initValue);
      return;
    }
    (t.maxLength = y.Util.getMaxLength(t.blocks)),
      (e.isAndroid = y.Util.isAndroid()),
      (e.lastInputValue = ""),
      (e.isBackward = ""),
      (e.onChangeListener = e.onChange.bind(e)),
      (e.onKeyDownListener = e.onKeyDown.bind(e)),
      (e.onFocusListener = e.onFocus.bind(e)),
      (e.onCutListener = e.onCut.bind(e)),
      (e.onCopyListener = e.onCopy.bind(e)),
      e.initSwapHiddenInput(),
      e.element.addEventListener("input", e.onChangeListener),
      e.element.addEventListener("keydown", e.onKeyDownListener),
      e.element.addEventListener("focus", e.onFocusListener),
      e.element.addEventListener("cut", e.onCutListener),
      e.element.addEventListener("copy", e.onCopyListener),
      e.initPhoneFormatter(),
      e.initDateFormatter(),
      e.initTimeFormatter(),
      e.initNumeralFormatter(),
      (t.initValue || (t.prefix && !t.noImmediatePrefix)) && e.onInput(t.initValue);
  },
  initSwapHiddenInput: function () {
    var e = this,
      t = e.properties;
    if (t.swapHiddenInput) {
      var n = e.element.cloneNode(!0);
      e.element.parentNode.insertBefore(n, e.element),
        (e.elementSwapHidden = e.element),
        (e.elementSwapHidden.type = "hidden"),
        (e.element = n),
        (e.element.id = "");
    }
  },
  initNumeralFormatter: function () {
    var e = this,
      t = e.properties;
    t.numeral &&
      (t.numeralFormatter = new y.NumeralFormatter(
        t.numeralDecimalMark,
        t.numeralIntegerScale,
        t.numeralDecimalScale,
        t.numeralThousandsGroupStyle,
        t.numeralPositiveOnly,
        t.stripLeadingZeroes,
        t.prefix,
        t.signBeforePrefix,
        t.tailPrefix,
        t.delimiter,
      ));
  },
  initTimeFormatter: function () {
    var e = this,
      t = e.properties;
    t.time &&
      ((t.timeFormatter = new y.TimeFormatter(t.timePattern, t.timeFormat)),
      (t.blocks = t.timeFormatter.getBlocks()),
      (t.blocksLength = t.blocks.length),
      (t.maxLength = y.Util.getMaxLength(t.blocks)));
  },
  initDateFormatter: function () {
    var e = this,
      t = e.properties;
    t.date &&
      ((t.dateFormatter = new y.DateFormatter(t.datePattern, t.dateMin, t.dateMax)),
      (t.blocks = t.dateFormatter.getBlocks()),
      (t.blocksLength = t.blocks.length),
      (t.maxLength = y.Util.getMaxLength(t.blocks)));
  },
  initPhoneFormatter: function () {
    var e = this,
      t = e.properties;
    if (t.phone)
      try {
        t.phoneFormatter = new y.PhoneFormatter(new t.root.Cleave.AsYouTypeFormatter(t.phoneRegionCode), t.delimiter);
      } catch (n) {
        throw new Error("[cleave.js] Please include phone-type-formatter.{country}.js lib");
      }
  },
  onKeyDown: function (e) {
    var t = this,
      n = e.which || e.keyCode;
    (t.lastInputValue = t.element.value), (t.isBackward = n === 8);
  },
  onChange: function (e) {
    var t = this,
      n = t.properties,
      a = y.Util;
    t.isBackward = t.isBackward || e.inputType === "deleteContentBackward";
    var o = a.getPostDelimiter(t.lastInputValue, n.delimiter, n.delimiters);
    t.isBackward && o ? (n.postDelimiterBackspace = o) : (n.postDelimiterBackspace = !1),
      this.onInput(this.element.value);
  },
  onFocus: function () {
    var e = this,
      t = e.properties;
    (e.lastInputValue = e.element.value),
      t.prefix && t.noImmediatePrefix && !e.element.value && this.onInput(t.prefix),
      y.Util.fixPrefixCursor(e.element, t.prefix, t.delimiter, t.delimiters);
  },
  onCut: function (e) {
    y.Util.checkFullSelection(this.element.value) && (this.copyClipboardData(e), this.onInput(""));
  },
  onCopy: function (e) {
    y.Util.checkFullSelection(this.element.value) && this.copyClipboardData(e);
  },
  copyClipboardData: function (e) {
    var t = this,
      n = t.properties,
      a = y.Util,
      o = t.element.value,
      u = "";
    n.copyDelimiter ? (u = o) : (u = a.stripDelimiters(o, n.delimiter, n.delimiters));
    try {
      e.clipboardData ? e.clipboardData.setData("Text", u) : window.clipboardData.setData("Text", u),
        e.preventDefault();
    } catch (c) {}
  },
  onInput: function (e) {
    var t = this,
      n = t.properties,
      a = y.Util,
      o = a.getPostDelimiter(e, n.delimiter, n.delimiters);
    if (
      (!n.numeral && n.postDelimiterBackspace && !o && (e = a.headStr(e, e.length - n.postDelimiterBackspace.length)),
      n.phone)
    ) {
      n.prefix && (!n.noImmediatePrefix || e.length)
        ? (n.result = n.prefix + n.phoneFormatter.format(e).slice(n.prefix.length))
        : (n.result = n.phoneFormatter.format(e)),
        t.updateValueState();
      return;
    }
    if (n.numeral) {
      n.prefix && n.noImmediatePrefix && e.length === 0 ? (n.result = "") : (n.result = n.numeralFormatter.format(e)),
        t.updateValueState();
      return;
    }
    if (
      (n.date && (e = n.dateFormatter.getValidatedDate(e)),
      n.time && (e = n.timeFormatter.getValidatedTime(e)),
      (e = a.stripDelimiters(e, n.delimiter, n.delimiters)),
      (e = a.getPrefixStrippedValue(
        e,
        n.prefix,
        n.prefixLength,
        n.result,
        n.delimiter,
        n.delimiters,
        n.noImmediatePrefix,
        n.tailPrefix,
        n.signBeforePrefix,
      )),
      (e = n.numericOnly ? a.strip(e, /[^\d]/g) : e),
      (e = n.uppercase ? e.toUpperCase() : e),
      (e = n.lowercase ? e.toLowerCase() : e),
      n.prefix && (n.tailPrefix ? (e = e + n.prefix) : (e = n.prefix + e), n.blocksLength === 0))
    ) {
      (n.result = e), t.updateValueState();
      return;
    }
    n.creditCard && t.updateCreditCardPropsByValue(e),
      (e = a.headStr(e, n.maxLength)),
      (n.result = a.getFormattedValue(e, n.blocks, n.blocksLength, n.delimiter, n.delimiters, n.delimiterLazyShow)),
      t.updateValueState();
  },
  updateCreditCardPropsByValue: function (e) {
    var t = this,
      n = t.properties,
      a = y.Util,
      o;
    a.headStr(n.result, 4) !== a.headStr(e, 4) &&
      ((o = y.CreditCardDetector.getInfo(e, n.creditCardStrictMode)),
      (n.blocks = o.blocks),
      (n.blocksLength = n.blocks.length),
      (n.maxLength = a.getMaxLength(n.blocks)),
      n.creditCardType !== o.type &&
        ((n.creditCardType = o.type), n.onCreditCardTypeChanged.call(t, n.creditCardType)));
  },
  updateValueState: function () {
    var e = this,
      t = y.Util,
      n = e.properties;
    if (e.element) {
      var a = e.element.selectionEnd,
        o = e.element.value,
        u = n.result;
      if (((a = t.getNextCursorPosition(a, o, u, n.delimiter, n.delimiters)), e.isAndroid)) {
        window.setTimeout(function () {
          (e.element.value = u), t.setSelection(e.element, a, n.document, !1), e.callOnValueChanged();
        }, 1);
        return;
      }
      (e.element.value = u),
        n.swapHiddenInput && (e.elementSwapHidden.value = e.getRawValue()),
        t.setSelection(e.element, a, n.document, !1),
        e.callOnValueChanged();
    }
  },
  callOnValueChanged: function () {
    var e = this,
      t = e.properties;
    t.onValueChanged.call(e, { target: { name: e.element.name, value: t.result, rawValue: e.getRawValue() } });
  },
  setPhoneRegionCode: function (e) {
    var t = this,
      n = t.properties;
    (n.phoneRegionCode = e), t.initPhoneFormatter(), t.onChange();
  },
  setRawValue: function (e) {
    var t = this,
      n = t.properties;
    (e = e != null ? e.toString() : ""),
      n.numeral && (e = e.replace(".", n.numeralDecimalMark)),
      (n.postDelimiterBackspace = !1),
      (t.element.value = e),
      t.onInput(e);
  },
  getRawValue: function () {
    var e = this,
      t = e.properties,
      n = y.Util,
      a = e.element.value;
    return (
      t.rawValueTrimPrefix &&
        (a = n.getPrefixStrippedValue(
          a,
          t.prefix,
          t.prefixLength,
          t.result,
          t.delimiter,
          t.delimiters,
          t.noImmediatePrefix,
          t.tailPrefix,
          t.signBeforePrefix,
        )),
      t.numeral ? (a = t.numeralFormatter.getRawValue(a)) : (a = n.stripDelimiters(a, t.delimiter, t.delimiters)),
      a
    );
  },
  getISOFormatDate: function () {
    var e = this,
      t = e.properties;
    return t.date ? t.dateFormatter.getISOFormatDate() : "";
  },
  getISOFormatTime: function () {
    var e = this,
      t = e.properties;
    return t.time ? t.timeFormatter.getISOFormatTime() : "";
  },
  getFormattedValue: function () {
    return this.element.value;
  },
  destroy: function () {
    var e = this;
    e.element.removeEventListener("input", e.onChangeListener),
      e.element.removeEventListener("keydown", e.onKeyDownListener),
      e.element.removeEventListener("focus", e.onFocusListener),
      e.element.removeEventListener("cut", e.onCutListener),
      e.element.removeEventListener("copy", e.onCopyListener);
  },
  toString: function () {
    return "[Cleave Object]";
  },
};
y.NumeralFormatter = Re;
y.DateFormatter = Oe;
y.TimeFormatter = Le;
y.PhoneFormatter = Ue;
y.CreditCardDetector = je;
y.Util = Ze;
y.DefaultProperties = Ye;
(typeof M == "object" && M ? M : window).Cleave = y;
var Ge = y,
  we = Ge;
(function () {
  function e(r, i) {
    var l = r.split("."),
      s = Se;
    l[0] in s || !s.execScript || s.execScript("var " + l[0]);
    for (var d; l.length && (d = l.shift()); ) l.length || i === void 0 ? (s = s[d] ? s[d] : (s[d] = {})) : (s[d] = i);
  }
  function t(r, i) {
    function l() {}
    (l.prototype = i.prototype),
      (r.M = i.prototype),
      (r.prototype = new l()),
      (r.prototype.constructor = r),
      (r.N = function (s, d, f) {
        for (var x = Array(arguments.length - 2), F = 2; F < arguments.length; F++) x[F - 2] = arguments[F];
        return i.prototype[d].apply(s, x);
      });
  }
  function n(r, i) {
    r != null && this.a.apply(this, arguments);
  }
  function a(r) {
    r.b = "";
  }
  function o(r, i) {
    r.sort(i || u);
  }
  function u(r, i) {
    return r > i ? 1 : r < i ? -1 : 0;
  }
  function c(r) {
    var i,
      l = [],
      s = 0;
    for (i in r) l[s++] = r[i];
    return l;
  }
  function p(r, i) {
    (this.b = r), (this.a = {});
    for (var l = 0; l < i.length; l++) {
      var s = i[l];
      this.a[s.b] = s;
    }
  }
  function h(r) {
    return (
      (r = c(r.a)),
      o(r, function (i, l) {
        return i.b - l.b;
      }),
      r
    );
  }
  function g(r, i) {
    switch (((this.b = r), (this.g = !!i.v), (this.a = i.c), (this.i = i.type), (this.h = !1), this.a)) {
      case Fe:
      case ke:
      case Ce:
      case Ie:
      case Pe:
      case De:
      case ve:
        this.h = !0;
    }
    this.f = i.defaultValue;
  }
  function m() {
    (this.a = {}), (this.f = this.j().a), (this.b = this.g = null);
  }
  function S(r, i) {
    for (var l = h(r.j()), s = 0; s < l.length; s++) {
      var d = l[s],
        f = d.b;
      if (i.a[f] != null) {
        r.b && delete r.b[d.b];
        var x = d.a == 11 || d.a == 10;
        if (d.g)
          for (var d = v(i, f) || [], F = 0; F < d.length; F++) {
            var k = r,
              E = f,
              Be = x ? d[F].clone() : d[F];
            k.a[E] || (k.a[E] = []), k.a[E].push(Be), k.b && delete k.b[E];
          }
        else (d = v(i, f)), x ? ((x = v(r, f)) ? S(x, d) : I(r, f, d.clone())) : I(r, f, d);
      }
    }
  }
  function v(r, i) {
    var l = r.a[i];
    if (l == null) return null;
    if (r.g) {
      if (!(i in r.b)) {
        var s = r.g,
          d = r.f[i];
        if (l != null)
          if (d.g) {
            for (var f = [], x = 0; x < l.length; x++) f[x] = s.b(d, l[x]);
            l = f;
          } else l = s.b(d, l);
        return (r.b[i] = l);
      }
      return r.b[i];
    }
    return l;
  }
  function w(r, i, l) {
    var s = v(r, i);
    return r.f[i].g ? s[l || 0] : s;
  }
  function D(r, i) {
    var l;
    if (r.a[i] != null) l = w(r, i, void 0);
    else
      e: {
        if (((l = r.f[i]), l.f === void 0)) {
          var s = l.i;
          if (s === Boolean) l.f = !1;
          else if (s === Number) l.f = 0;
          else {
            if (s !== String) {
              l = new s();
              break e;
            }
            l.f = l.h ? "0" : "";
          }
        }
        l = l.f;
      }
    return l;
  }
  function C(r, i) {
    return r.f[i].g ? (r.a[i] != null ? r.a[i].length : 0) : r.a[i] != null ? 1 : 0;
  }
  function I(r, i, l) {
    (r.a[i] = l), r.b && (r.b[i] = l);
  }
  function L(r, i) {
    var l,
      s = [];
    for (l in i) l != 0 && s.push(new g(l, i[l]));
    return new p(r, s);
  }
  function P() {
    m.call(this);
  }
  function b() {
    m.call(this);
  }
  function $() {
    m.call(this);
  }
  function R() {}
  function U() {}
  function V() {}
  function A() {
    this.a = {};
  }
  function Y(r) {
    return r.length == 0 || Ae.test(r);
  }
  function j(r, i) {
    if (i == null) return null;
    i = i.toUpperCase();
    var l = r.a[i];
    if (l == null) {
      if (((l = oe[i]), l == null)) return null;
      (l = new V().a($.j(), l)), (r.a[i] = l);
    }
    return l;
  }
  function G(r) {
    return (r = le[r]), r == null ? "ZZ" : r[0];
  }
  function T(r) {
    (this.H = RegExp("\u2008")),
      (this.C = ""),
      (this.m = new n()),
      (this.w = ""),
      (this.i = new n()),
      (this.u = new n()),
      (this.l = !0),
      (this.A = this.o = this.F = !1),
      (this.G = A.b()),
      (this.s = 0),
      (this.b = new n()),
      (this.B = !1),
      (this.h = ""),
      (this.a = new n()),
      (this.f = []),
      (this.D = r),
      (this.J = this.g = N(this, this.D));
  }
  function N(r, i) {
    var l;
    if (i != null && isNaN(i) && i.toUpperCase() in oe) {
      if (((l = j(r.G, i)), l == null)) throw Error("Invalid region code: " + i);
      l = D(l, 10);
    } else l = 0;
    return (l = j(r.G, G(l))), l != null ? l : se;
  }
  function K(r) {
    for (var i = r.f.length, l = 0; l < i; ++l) {
      var s = r.f[l],
        d = D(s, 1);
      if (r.w == d) return !1;
      var f;
      f = r;
      var x = s,
        F = D(x, 1);
      if (F.indexOf("|") != -1) f = !1;
      else {
        (F = F.replace(Me, "\\d")), (F = F.replace(Ve, "\\d")), a(f.m);
        var k;
        k = f;
        var x = D(x, 2),
          E = "999999999999999".match(F)[0];
        E.length < k.a.b.length
          ? (k = "")
          : ((k = E.replace(new RegExp(F, "g"), x)), (k = k.replace(RegExp("9", "g"), "\u2008"))),
          0 < k.length ? (f.m.a(k), (f = !0)) : (f = !1);
      }
      if (f) return (r.w = d), (r.B = ue.test(w(s, 4))), (r.s = 0), !0;
    }
    return (r.l = !1);
  }
  function q(r, i) {
    for (var l = [], s = i.length - 3, d = r.f.length, f = 0; f < d; ++f) {
      var x = r.f[f];
      C(x, 3) == 0 ? l.push(r.f[f]) : ((x = w(x, 3, Math.min(s, C(x, 3) - 1))), i.search(x) == 0 && l.push(r.f[f]));
    }
    r.f = l;
  }
  function be(r, i) {
    r.i.a(i);
    var l = i;
    if (_e.test(l) || (r.i.b.length == 1 && Ee.test(l))) {
      var s,
        l = i;
      l == "+" ? ((s = l), r.u.a(l)) : ((s = $e[l]), r.u.a(s), r.a.a(s)), (i = s);
    } else (r.l = !1), (r.F = !0);
    if (!r.l) {
      if (!r.F) {
        if (X(r)) {
          if (ee(r)) return z(r);
        } else if (
          (0 < r.h.length &&
            ((l = r.a.toString()),
            a(r.a),
            r.a.a(r.h),
            r.a.a(l),
            (l = r.b.toString()),
            (s = l.lastIndexOf(r.h)),
            a(r.b),
            r.b.a(l.substring(0, s))),
          r.h != W(r))
        )
          return r.b.a(" "), z(r);
      }
      return r.i.toString();
    }
    switch (r.u.b.length) {
      case 0:
      case 1:
      case 2:
        return r.i.toString();
      case 3:
        if (!X(r)) return (r.h = W(r)), Z(r);
        r.A = !0;
      default:
        return r.A
          ? (ee(r) && (r.A = !1), r.b.toString() + r.a.toString())
          : 0 < r.f.length
            ? ((l = te(r, i)),
              (s = J(r)),
              0 < s.length ? s : (q(r, r.a.toString()), K(r) ? Q(r) : r.l ? O(r, l) : r.i.toString()))
            : Z(r);
    }
  }
  function z(r) {
    return (r.l = !0), (r.A = !1), (r.f = []), (r.s = 0), a(r.m), (r.w = ""), Z(r);
  }
  function J(r) {
    for (var i = r.a.toString(), l = r.f.length, s = 0; s < l; ++s) {
      var d = r.f[s],
        f = D(d, 1);
      if (new RegExp("^(?:" + f + ")$").test(i))
        return (r.B = ue.test(w(d, 4))), (i = i.replace(new RegExp(f, "g"), w(d, 2))), O(r, i);
    }
    return "";
  }
  function O(r, i) {
    var l = r.b.b.length;
    return r.B && 0 < l && r.b.toString().charAt(l - 1) != " " ? r.b + " " + i : r.b + i;
  }
  function Z(r) {
    var i = r.a.toString();
    if (3 <= i.length) {
      for (
        var l = r.o && r.h.length == 0 && 0 < C(r.g, 20) ? v(r.g, 20) || [] : v(r.g, 19) || [], s = l.length, d = 0;
        d < s;
        ++d
      ) {
        var f = l[d];
        (0 < r.h.length && Y(D(f, 4)) && !w(f, 6) && f.a[5] == null) ||
          ((r.h.length != 0 || r.o || Y(D(f, 4)) || w(f, 6)) && Te.test(D(f, 2)) && r.f.push(f));
      }
      return q(r, i), (i = J(r)), 0 < i.length ? i : K(r) ? Q(r) : r.i.toString();
    }
    return O(r, i);
  }
  function Q(r) {
    var i = r.a.toString(),
      l = i.length;
    if (0 < l) {
      for (var s = "", d = 0; d < l; d++) s = te(r, i.charAt(d));
      return r.l ? O(r, s) : r.i.toString();
    }
    return r.b.toString();
  }
  function W(r) {
    var i,
      l = r.a.toString(),
      s = 0;
    return (
      w(r.g, 10) != 1
        ? (i = !1)
        : ((i = r.a.toString()), (i = i.charAt(0) == "1" && i.charAt(1) != "0" && i.charAt(1) != "1")),
      i
        ? ((s = 1), r.b.a("1").a(" "), (r.o = !0))
        : r.g.a[15] != null &&
          ((i = new RegExp("^(?:" + w(r.g, 15) + ")")),
          (i = l.match(i)),
          i != null && i[0] != null && 0 < i[0].length && ((r.o = !0), (s = i[0].length), r.b.a(l.substring(0, s)))),
      a(r.a),
      r.a.a(l.substring(s)),
      l.substring(0, s)
    );
  }
  function X(r) {
    var i = r.u.toString(),
      l = new RegExp("^(?:\\+|" + w(r.g, 11) + ")"),
      l = i.match(l);
    return (
      l != null &&
      l[0] != null &&
      0 < l[0].length &&
      ((r.o = !0),
      (l = l[0].length),
      a(r.a),
      r.a.a(i.substring(l)),
      a(r.b),
      r.b.a(i.substring(0, l)),
      i.charAt(0) != "+" && r.b.a(" "),
      !0)
    );
  }
  function ee(r) {
    if (r.a.b.length == 0) return !1;
    var i,
      l = new n();
    e: {
      if (((i = r.a.toString()), i.length != 0 && i.charAt(0) != "0")) {
        for (var s, d = i.length, f = 1; 3 >= f && f <= d; ++f)
          if (((s = parseInt(i.substring(0, f), 10)), s in le)) {
            l.a(i.substring(f)), (i = s);
            break e;
          }
      }
      i = 0;
    }
    return (
      i != 0 &&
      (a(r.a),
      r.a.a(l.toString()),
      (l = G(i)),
      l == "001" ? (r.g = j(r.G, "" + i)) : l != r.D && (r.g = N(r, l)),
      r.b.a("" + i).a(" "),
      (r.h = ""),
      !0)
    );
  }
  function te(r, i) {
    var l = r.m.toString();
    if (0 <= l.substring(r.s).search(r.H)) {
      var s = l.search(r.H),
        l = l.replace(r.H, i);
      return a(r.m), r.m.a(l), (r.s = s), l.substring(0, r.s + 1);
    }
    return r.f.length == 1 && (r.l = !1), (r.w = ""), r.i.toString();
  }
  var Se = this;
  (n.prototype.b = ""),
    (n.prototype.set = function (r) {
      this.b = "" + r;
    }),
    (n.prototype.a = function (r, i, l) {
      if (((this.b += String(r)), i != null)) for (var s = 1; s < arguments.length; s++) this.b += arguments[s];
      return this;
    }),
    (n.prototype.toString = function () {
      return this.b;
    });
  var ve = 1,
    De = 2,
    Fe = 3,
    ke = 4,
    Ce = 6,
    Ie = 16,
    Pe = 18;
  (m.prototype.set = function (r, i) {
    I(this, r.b, i);
  }),
    (m.prototype.clone = function () {
      var r = new this.constructor();
      return r != this && ((r.a = {}), r.b && (r.b = {}), S(r, this)), r;
    }),
    t(P, m);
  var re = null;
  t(b, m);
  var ne = null;
  t($, m);
  var ie = null;
  (P.prototype.j = function () {
    var r = re;
    return (
      r ||
        (re = r =
          L(P, {
            0: { name: "NumberFormat", I: "i18n.phonenumbers.NumberFormat" },
            1: { name: "pattern", required: !0, c: 9, type: String },
            2: { name: "format", required: !0, c: 9, type: String },
            3: { name: "leading_digits_pattern", v: !0, c: 9, type: String },
            4: { name: "national_prefix_formatting_rule", c: 9, type: String },
            6: { name: "national_prefix_optional_when_formatting", c: 8, defaultValue: !1, type: Boolean },
            5: { name: "domestic_carrier_code_formatting_rule", c: 9, type: String },
          })),
      r
    );
  }),
    (P.j = P.prototype.j),
    (b.prototype.j = function () {
      var r = ne;
      return (
        r ||
          (ne = r =
            L(b, {
              0: { name: "PhoneNumberDesc", I: "i18n.phonenumbers.PhoneNumberDesc" },
              2: { name: "national_number_pattern", c: 9, type: String },
              9: { name: "possible_length", v: !0, c: 5, type: Number },
              10: { name: "possible_length_local_only", v: !0, c: 5, type: Number },
              6: { name: "example_number", c: 9, type: String },
            })),
        r
      );
    }),
    (b.j = b.prototype.j),
    ($.prototype.j = function () {
      var r = ie;
      return (
        r ||
          (ie = r =
            L($, {
              0: { name: "PhoneMetadata", I: "i18n.phonenumbers.PhoneMetadata" },
              1: { name: "general_desc", c: 11, type: b },
              2: { name: "fixed_line", c: 11, type: b },
              3: { name: "mobile", c: 11, type: b },
              4: { name: "toll_free", c: 11, type: b },
              5: { name: "premium_rate", c: 11, type: b },
              6: { name: "shared_cost", c: 11, type: b },
              7: { name: "personal_number", c: 11, type: b },
              8: { name: "voip", c: 11, type: b },
              21: { name: "pager", c: 11, type: b },
              25: { name: "uan", c: 11, type: b },
              27: { name: "emergency", c: 11, type: b },
              28: { name: "voicemail", c: 11, type: b },
              29: { name: "short_code", c: 11, type: b },
              30: { name: "standard_rate", c: 11, type: b },
              31: { name: "carrier_specific", c: 11, type: b },
              33: { name: "sms_services", c: 11, type: b },
              24: { name: "no_international_dialling", c: 11, type: b },
              9: { name: "id", required: !0, c: 9, type: String },
              10: { name: "country_code", c: 5, type: Number },
              11: { name: "international_prefix", c: 9, type: String },
              17: { name: "preferred_international_prefix", c: 9, type: String },
              12: { name: "national_prefix", c: 9, type: String },
              13: { name: "preferred_extn_prefix", c: 9, type: String },
              15: { name: "national_prefix_for_parsing", c: 9, type: String },
              16: { name: "national_prefix_transform_rule", c: 9, type: String },
              18: { name: "same_mobile_and_fixed_line_pattern", c: 8, defaultValue: !1, type: Boolean },
              19: { name: "number_format", v: !0, c: 11, type: P },
              20: { name: "intl_number_format", v: !0, c: 11, type: P },
              22: { name: "main_country_for_code", c: 8, defaultValue: !1, type: Boolean },
              23: { name: "leading_digits", c: 9, type: String },
              26: { name: "leading_zero_possible", c: 8, defaultValue: !1, type: Boolean },
            })),
        r
      );
    }),
    ($.j = $.prototype.j),
    (R.prototype.a = function (r) {
      throw (new r.b(), Error("Unimplemented"));
    }),
    (R.prototype.b = function (r, i) {
      if (r.a == 11 || r.a == 10) return i instanceof m ? i : this.a(r.i.prototype.j(), i);
      if (r.a == 14) {
        if (typeof i == "string" && ae.test(i)) {
          var l = Number(i);
          if (0 < l) return l;
        }
        return i;
      }
      if (!r.h) return i;
      if (((l = r.i), l === String)) {
        if (typeof i == "number") return String(i);
      } else if (
        l === Number &&
        typeof i == "string" &&
        (i === "Infinity" || i === "-Infinity" || i === "NaN" || ae.test(i))
      )
        return Number(i);
      return i;
    });
  var ae = /^-?[0-9]+$/;
  t(U, R),
    (U.prototype.a = function (r, i) {
      var l = new r.b();
      return (l.g = this), (l.a = i), (l.b = {}), l;
    }),
    t(V, U),
    (V.prototype.b = function (r, i) {
      return r.a == 8 ? !!i : R.prototype.b.apply(this, arguments);
    }),
    (V.prototype.a = function (r, i) {
      return V.M.a.call(this, r, i);
    });
  var le = { 49: ["DE"] },
    oe = {
      DE: [
        null,
        [
          null,
          null,
          "(?:1|[235-9]\\d{11}|4(?:[0-8]\\d{2,10}|9(?:[05]\\d{7}|[46][1-8]\\d{2,6})))\\d{3}|[1-35-9]\\d{6,13}|49(?:(?:[0-25]\\d|3[1-689])\\d{4,8}|4[1-8]\\d{4}|6[0-8]\\d{3,4}|7[1-7]\\d{5,8})|497[0-7]\\d{4}|49(?:[0-2579]\\d|[34][1-9])\\d{3}|[1-9]\\d{5}|[13468]\\d{4}",
          null,
          null,
          null,
          null,
          null,
          null,
          [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
          [3],
        ],
        [
          null,
          null,
          "(?:2(?:0[1-689]|[1-3569]\\d|4[0-8]|7[1-7]|8[0-7])|5(?:0[2-8]|[124-6]\\d|[38][0-8]|[79][0-7])|6(?:0[02-9]|[1-3589]\\d|[47][0-8]|6[1-9])|7(?:0[2-8]|1[1-9]|[27][0-7]|3\\d|[4-6][0-8]|8[0-5]|9[013-7])|8(?:0[2-9]|1[0-79]|[29]\\d|3[0-46-9]|4[0-6]|5[013-9]|6[1-8]|7[0-8]|8[0-24-6])|9(?:0[6-9]|[1-4]\\d|[589][0-7]|6[0-8]|7[0-467]))\\d{4,12}|3(?:(?:[03569]\\d|4[0-79]|7[1-7]|8[1-8])\\d{4,12}|2\\d{9})|4(?:(?:[02-48]\\d|1[02-9]|5[0-6]|6[0-8]|7[0-79])\\d{4,12}|9(?:[0-37]\\d{4,9}|[4-6]\\d{4,10}))|(?:2(?:0[1-389]|1[124]|2[18]|3[14]|[4-9]1)|3(?:0\\d?|[35-9][15]|4[015])|4(?:0\\d?|[2-9]1)|[57][1-9]1|[68](?:[1-8]1|9\\d?)|9(?:06|[1-9]1))\\d{3}",
          null,
          null,
          null,
          "30123456",
          null,
          null,
          [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
          [3, 4],
        ],
        [
          null,
          null,
          "1(?:5[0-25-9]\\d{8}|(?:6[023]|7\\d)\\d{7,8})",
          null,
          null,
          null,
          "15123456789",
          null,
          null,
          [10, 11],
        ],
        [null, null, "800\\d{7,12}", null, null, null, "8001234567890", null, null, [10, 11, 12, 13, 14, 15]],
        [null, null, "(?:137[7-9]|900(?:[135]|9\\d))\\d{6}", null, null, null, "9001234567", null, null, [10, 11]],
        [
          null,
          null,
          "1(?:3(?:7[1-6]\\d\\d|8)|80\\d{1,7})\\d{4}",
          null,
          null,
          null,
          "18012345",
          null,
          null,
          [7, 8, 9, 10, 11, 12, 13, 14],
        ],
        [null, null, "700\\d{8}", null, null, null, "70012345678", null, null, [11]],
        [null, null, null, null, null, null, null, null, null, [-1]],
        "DE",
        49,
        "00",
        "0",
        null,
        null,
        "0",
        null,
        null,
        null,
        [
          [null, "(\\d{2})(\\d{3,13})", "$1 $2", ["3[02]|40|[68]9"], "0$1"],
          [
            null,
            "(\\d{3})(\\d{3,12})",
            "$1 $2",
            [
              "2(?:0[1-389]|1[124]|2[18]|3[14]|[4-9]1)|3(?:[35-9][15]|4[015])|(?:4[2-9]|[57][1-9]|[68][1-8])1|9(?:06|[1-9]1)",
              "2(?:0[1-389]|1(?:[14]|2[0-8])|2[18]|3[14]|[4-9]1)|3(?:[35-9][15]|4[015])|(?:4[2-9]|[57][1-9]|[68][1-8])1|9(?:06|[1-9]1)",
            ],
            "0$1",
          ],
          [null, "(\\d{3})(\\d{4})", "$1 $2", ["138"], "0$1"],
          [
            null,
            "(\\d{4})(\\d{3,11})",
            "$1 $2",
            [
              "[24-6]|3(?:[3569][02-46-9]|4[2-4679]|7[2-467]|8[2-46-8])|7(?:0[2-8]|[1-9])|8(?:0[2-9]|[1-8])|9(?:0[7-9]|[1-9])",
              "[24-6]|3(?:3(?:0[1-467]|2[127-9]|3[124578]|[46][1246]|7[1257-9]|8[1256]|9[145])|4(?:2[135]|3[1357]|4[13578]|6[1246]|7[1356]|9[1346])|5(?:0[14]|2[1-3589]|3[1357]|[49][1246]|6[1-4]|7[13468]|8[13568])|6(?:0[1356]|2[1-489]|3[124-6]|4[1347]|6[13]|7[12579]|8[1-356]|9[135])|7(?:2[1-7]|3[1357]|4[145]|6[1-5]|7[1-4])|8(?:21|3[1468]|4[1347]|6|7[1467]|8[136])|9(?:0[12479]|2[1358]|3[1357]|4[134679]|6[1-9]|7[136]|8[147]|9[1468]))|7(?:0[2-8]|[1-9])|8(?:0[2-9]|[1-8])|9(?:0[7-9]|[1-9])",
            ],
            "0$1",
          ],
          [null, "(\\d{3})(\\d{5,11})", "$1 $2", ["181"], "0$1"],
          [null, "(\\d{3})(\\d)(\\d{4,10})", "$1 $2 $3", ["1(?:3|80)|9"], "0$1"],
          [null, "(\\d{5})(\\d{3,10})", "$1 $2", ["3"], "0$1"],
          [null, "(\\d{3})(\\d{7,8})", "$1 $2", ["1(?:6[02-489]|7)"], "0$1"],
          [null, "(\\d{3})(\\d{7,12})", "$1 $2", ["8"], "0$1"],
          [null, "(\\d{4})(\\d{7})", "$1 $2", ["15[1279]"], "0$1"],
          [null, "(\\d{5})(\\d{6})", "$1 $2", ["15[0568]"], "0$1"],
          [null, "(\\d{3})(\\d{4})(\\d{4})", "$1 $2 $3", ["7"], "0$1"],
          [null, "(\\d{3})(\\d{8})", "$1 $2", ["18[2-579]", "18[2-579]", "18(?:[2-479]|5(?:0[1-9]|[1-9]))"], "0$1"],
          [null, "(\\d{4})(\\d{7})", "$1 $2", ["18[68]"], "0$1"],
          [null, "(\\d{5})(\\d{6})", "$1 $2", ["18"], "0$1"],
          [null, "(\\d{3})(\\d{2})(\\d{7,8})", "$1 $2 $3", ["1(?:6[023]|7)"], "0$1"],
          [null, "(\\d{3})(\\d{2})(\\d{8})", "$1 $2 $3", ["15[013-68]"], "0$1"],
          [null, "(\\d{4})(\\d{2})(\\d{7})", "$1 $2 $3", ["15"], "0$1"],
        ],
        null,
        [
          null,
          null,
          "16(?:4\\d{1,10}|[89]\\d{1,11})",
          null,
          null,
          null,
          "16412345",
          null,
          null,
          [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
        ],
        null,
        null,
        [null, null, null, null, null, null, null, null, null, [-1]],
        [
          null,
          null,
          "18(?:1\\d{5,11}|[2-9]\\d{8})",
          null,
          null,
          null,
          "18500123456",
          null,
          null,
          [8, 9, 10, 11, 12, 13, 14],
        ],
        null,
        null,
        [
          null,
          null,
          "1(?:5(?:(?:[03-68]00|113)\\d|2\\d55|7\\d99|9\\d33)|(?:6(?:013|255|399)|7(?:(?:[015]1|[69]3)3|[2-4]55|[78]99))\\d?)\\d{7}",
          null,
          null,
          null,
          "177991234567",
          null,
          null,
          [12, 13],
        ],
      ],
    };
  A.b = function () {
    return A.a ? A.a : (A.a = new A());
  };
  var $e = {
      0: "0",
      1: "1",
      2: "2",
      3: "3",
      4: "4",
      5: "5",
      6: "6",
      7: "7",
      8: "8",
      9: "9",
      "\uFF10": "0",
      "\uFF11": "1",
      "\uFF12": "2",
      "\uFF13": "3",
      "\uFF14": "4",
      "\uFF15": "5",
      "\uFF16": "6",
      "\uFF17": "7",
      "\uFF18": "8",
      "\uFF19": "9",
      "\u0660": "0",
      "\u0661": "1",
      "\u0662": "2",
      "\u0663": "3",
      "\u0664": "4",
      "\u0665": "5",
      "\u0666": "6",
      "\u0667": "7",
      "\u0668": "8",
      "\u0669": "9",
      "\u06F0": "0",
      "\u06F1": "1",
      "\u06F2": "2",
      "\u06F3": "3",
      "\u06F4": "4",
      "\u06F5": "5",
      "\u06F6": "6",
      "\u06F7": "7",
      "\u06F8": "8",
      "\u06F9": "9",
    },
    Ee = RegExp("[+\uFF0B]+"),
    _e = RegExp("([0-9\uFF10-\uFF19\u0660-\u0669\u06F0-\u06F9])"),
    Ae = /^\(?\$1\)?$/,
    se = new $();
  I(se, 11, "NA");
  var Me = /\[([^\[\]])*\]/g,
    Ve = /\d(?=[^,}][^,}])/g,
    Te = RegExp(
      "^[-x\u2010-\u2015\u2212\u30FC\uFF0D-\uFF0F \xA0\xAD\u200B\u2060\u3000()\uFF08\uFF09\uFF3B\uFF3D.\\[\\]/~\u2053\u223C\uFF5E]*(\\$\\d[-x\u2010-\u2015\u2212\u30FC\uFF0D-\uFF0F \xA0\xAD\u200B\u2060\u3000()\uFF08\uFF09\uFF3B\uFF3D.\\[\\]/~\u2053\u223C\uFF5E]*)+$",
    ),
    ue = /[- ]/;
  (T.prototype.K = function () {
    (this.C = ""),
      a(this.i),
      a(this.u),
      a(this.m),
      (this.s = 0),
      (this.w = ""),
      a(this.b),
      (this.h = ""),
      a(this.a),
      (this.l = !0),
      (this.A = this.o = this.F = !1),
      (this.f = []),
      (this.B = !1),
      this.g != this.J && (this.g = N(this, this.D));
  }),
    (T.prototype.L = function (r) {
      return (this.C = be(this, r));
    }),
    e("Cleave.AsYouTypeFormatter", T),
    e("Cleave.AsYouTypeFormatter.prototype.inputDigit", T.prototype.L),
    e("Cleave.AsYouTypeFormatter.prototype.clear", T.prototype.K);
}).call(typeof global == "object" && global ? global : window);
var B = class B {
  static functionality(t, n) {
    if (
      (Array.isArray(t.config) && (t.config = t.config[0]),
      Array.isArray(t.date) && (t.date = t.date[0]),
      Array.isArray(t.datemin) && (t.datemin = t.datemin[0]),
      Array.isArray(t.datemax) && (t.datemax = t.datemax[0]),
      Array.isArray(t.delimiter) && (t.delimiter = t.delimiter[0]),
      Array.isArray(t.datepattern) && (t.datepattern = t.datepattern[0]),
      n.tagName.toUpperCase() !== "INPUT")
    )
      return;
    let a = t.config
      ? typeof t.config == "string"
        ? JSON.parse(t.config.replace(/</, "{").replace(/>/, "}"))
        : t.config
      : {
          date: t.date ? t.date : !0,
          dateMin: t.datemin && typeof t.datemin == "string" ? t.datemin : void 0,
          dateMax: t.datemax && typeof t.datemax == "string" ? t.datemax : void 0,
          delimiter: t.delimiter && typeof t.delimiter == "string" ? t.delimiter : ".",
          datePattern: t.datepattern ? me.tsCheck(t.datepattern, "string").split("-") : ["d", "m", "Y"],
        };
    new we(n, a);
  }
};
(B.registered = window.codbi.registerFunctionality("HTML.Input.Cleave", B.functionality)),
  ce([fe.ParamvalueProvider, de(1, pe.PRE("INPUT", !1, "tagName"))], B, "functionality", 1);
var xe = B;
export { xe as HTML_Input_Cleave };
