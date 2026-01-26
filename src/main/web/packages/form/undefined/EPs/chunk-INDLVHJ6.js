var K = {
    preserveOrder: !1,
    attributeNamePrefix: "@_",
    attributesGroupName: !1,
    textNodeName: "#text",
    ignoreAttributes: !0,
    removeNSPrefix: !1,
    allowBooleanAttributes: !1,
    parseTagValue: !0,
    parseAttributeValue: !1,
    trimValues: !0,
    cdataPropName: !1,
    numberParseOptions: { hex: !0, leadingZeros: !0, eNotation: !0 },
    tagValueProcessor: function (e, t) {
      return t;
    },
    attributeValueProcessor: function (e, t) {
      return t;
    },
    stopNodes: [],
    alwaysCreateTextNode: !1,
    isArray: () => !1,
    commentPropName: !1,
    unpairedTags: [],
    processEntities: !0,
    htmlEntities: !1,
    ignoreDeclaration: !1,
    ignorePiTags: !1,
    transformTagName: !1,
    transformAttributeName: !1,
    updateTag: function (e, t, n) {
      return e;
    },
    captureMetaData: !1,
  },
  U = function (e) {
    return Object.assign({}, K, e);
  };
var B =
    ":A-Za-z_\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD",
  J = B + "\\-.\\d\\u00B7\\u0300-\\u036F\\u203F-\\u2040",
  z = "[" + B + "][" + J + "]*",
  H = new RegExp("^" + z + "$");
function A(e, t) {
  let n = [],
    s = t.exec(e);
  for (; s; ) {
    let o = [];
    o.startIndex = t.lastIndex - s[0].length;
    let r = s.length;
    for (let u = 0; u < r; u++) o.push(s[u]);
    n.push(o), (s = t.exec(e));
  }
  return n;
}
var w = function (e) {
  let t = H.exec(e);
  return !(t === null || typeof t == "undefined");
};
function Y(e) {
  return typeof e != "undefined";
}
var O;
typeof Symbol != "function" ? (O = "@@xmlMetadata") : (O = Symbol("XML Node Metadata"));
var a = class {
  constructor(t) {
    (this.tagname = t), (this.child = []), (this[":@"] = {});
  }
  add(t, n) {
    t === "__proto__" && (t = "#__proto__"), this.child.push({ [t]: n });
  }
  addChild(t, n) {
    t.tagname === "__proto__" && (t.tagname = "#__proto__"),
      t[":@"] && Object.keys(t[":@"]).length > 0
        ? this.child.push({ [t.tagname]: t.child, ":@": t[":@"] })
        : this.child.push({ [t.tagname]: t.child }),
      n !== void 0 && (this.child[this.child.length - 1][O] = { startIndex: n });
  }
  static getMetaDataSymbol() {
    return O;
  }
};
function M(e, t) {
  let n = {};
  if (
    e[t + 3] === "O" &&
    e[t + 4] === "C" &&
    e[t + 5] === "T" &&
    e[t + 6] === "Y" &&
    e[t + 7] === "P" &&
    e[t + 8] === "E"
  ) {
    t = t + 9;
    let s = 1,
      o = !1,
      r = !1,
      u = "";
    for (; t < e.length; t++)
      if (e[t] === "<" && !r) {
        if (o && b(e, "!ENTITY", t)) {
          t += 7;
          let f, i;
          ([f, i, t] = x(e, t + 1)), i.indexOf("&") === -1 && (n[f] = { regx: RegExp(`&${f};`, "g"), val: i });
        } else if (o && b(e, "!ELEMENT", t)) {
          t += 8;
          let { index: f } = ee(e, t + 1);
          t = f;
        } else if (o && b(e, "!ATTLIST", t)) t += 8;
        else if (o && b(e, "!NOTATION", t)) {
          t += 9;
          let { index: f } = D(e, t + 1);
          t = f;
        } else if (b(e, "!--", t)) r = !0;
        else throw new Error("Invalid DOCTYPE");
        s++, (u = "");
      } else if (e[t] === ">") {
        if ((r ? e[t - 1] === "-" && e[t - 2] === "-" && ((r = !1), s--) : s--, s === 0)) break;
      } else e[t] === "[" ? (o = !0) : (u += e[t]);
    if (s !== 0) throw new Error("Unclosed DOCTYPE");
  } else throw new Error("Invalid Tag instead of DOCTYPE");
  return { entities: n, i: t };
}
var E = (e, t) => {
  for (; t < e.length && /\s/.test(e[t]); ) t++;
  return t;
};
function x(e, t) {
  t = E(e, t);
  let n = "";
  for (; t < e.length && !/\s/.test(e[t]) && e[t] !== '"' && e[t] !== "'"; ) (n += e[t]), t++;
  if ((F(n), (t = E(e, t)), e.substring(t, t + 6).toUpperCase() === "SYSTEM"))
    throw new Error("External entities are not supported");
  if (e[t] === "%") throw new Error("Parameter entities are not supported");
  let s = "";
  return ([t, s] = v(e, t, "entity")), t--, [n, s, t];
}
function D(e, t) {
  t = E(e, t);
  let n = "";
  for (; t < e.length && !/\s/.test(e[t]); ) (n += e[t]), t++;
  F(n), (t = E(e, t));
  let s = e.substring(t, t + 6).toUpperCase();
  if (s !== "SYSTEM" && s !== "PUBLIC") throw new Error(`Expected SYSTEM or PUBLIC, found "${s}"`);
  (t += s.length), (t = E(e, t));
  let o = null,
    r = null;
  if (s === "PUBLIC")
    ([t, o] = v(e, t, "publicIdentifier")),
      (t = E(e, t)),
      (e[t] === '"' || e[t] === "'") && ([t, r] = v(e, t, "systemIdentifier"));
  else if (s === "SYSTEM" && (([t, r] = v(e, t, "systemIdentifier")), !r))
    throw new Error("Missing mandatory system identifier for SYSTEM notation");
  return { notationName: n, publicIdentifier: o, systemIdentifier: r, index: --t };
}
function v(e, t, n) {
  let s = "",
    o = e[t];
  if (o !== '"' && o !== "'") throw new Error(`Expected quoted string, found "${o}"`);
  for (t++; t < e.length && e[t] !== o; ) (s += e[t]), t++;
  if (e[t] !== o) throw new Error(`Unterminated ${n} value`);
  return t++, [t, s];
}
function ee(e, t) {
  t = E(e, t);
  let n = "";
  for (; t < e.length && !/\s/.test(e[t]); ) (n += e[t]), t++;
  if (!F(n)) throw new Error(`Invalid element name: "${n}"`);
  t = E(e, t);
  let s = "";
  if (e[t] === "E" && b(e, "MPTY", t)) t += 6;
  else if (e[t] === "A" && b(e, "NY", t)) t += 4;
  else if (e[t] === "(") {
    for (t++; t < e.length && e[t] !== ")"; ) (s += e[t]), t++;
    if (e[t] !== ")") throw new Error("Unterminated content model");
  } else throw new Error(`Invalid Element Expression, found "${e[t]}"`);
  return { elementName: n, contentModel: s.trim(), index: t };
}
function b(e, t, n) {
  for (let s = 0; s < t.length; s++) if (t[s] !== e[n + s + 1]) return !1;
  return !0;
}
function F(e) {
  if (w(e)) return e;
  throw new Error(`Invalid entity name ${e}`);
}
var te = /^[-+]?0x[a-fA-F0-9]+$/,
  ne = /^([\-\+])?(0*)([0-9]*(\.[0-9]*)?)$/,
  re = { hex: !0, leadingZeros: !0, decimalPoint: ".", eNotation: !0 };
function _(e, t = {}) {
  if (((t = Object.assign({}, re, t)), !e || typeof e != "string")) return e;
  let n = e.trim();
  if (t.skipLike !== void 0 && t.skipLike.test(n)) return e;
  if (e === "0") return 0;
  if (t.hex && te.test(n)) return fe(n, 16);
  if (n.search(/.+[eE].+/) !== -1) return oe(e, n, t);
  {
    let s = ne.exec(n);
    if (s) {
      let o = s[1] || "",
        r = s[2],
        u = ie(s[3]),
        f = o ? e[r.length + 1] === "." : e[r.length] === ".";
      if (!t.leadingZeros && (r.length > 1 || (r.length === 1 && !f))) return e;
      {
        let i = Number(n),
          d = String(i);
        if (i === 0 || i === -0) return i;
        if (d.search(/[eE]/) !== -1) return t.eNotation ? i : e;
        if (n.indexOf(".") !== -1) return d === "0" || d === u || d === `${o}${u}` ? i : e;
        let l = r ? u : n;
        return r ? (l === d || o + l === d ? i : e) : l === d || l === o + d ? i : e;
      }
    } else return e;
  }
}
var se = /^([-+])?(0*)(\d*(\.\d*)?[eE][-\+]?\d+)$/;
function oe(e, t, n) {
  if (!n.eNotation) return e;
  let s = t.match(se);
  if (s) {
    let o = s[1] || "",
      r = s[3].indexOf("e") === -1 ? "E" : "e",
      u = s[2],
      f = o ? e[u.length + 1] === r : e[u.length] === r;
    return u.length > 1 && f
      ? e
      : u.length === 1 && (s[3].startsWith(`.${r}`) || s[3][0] === r)
        ? Number(t)
        : n.leadingZeros && !f
          ? ((t = (s[1] || "") + s[3]), Number(t))
          : e;
  } else return e;
}
function ie(e) {
  return (
    e &&
      e.indexOf(".") !== -1 &&
      ((e = e.replace(/0+$/, "")),
      e === "."
        ? (e = "0")
        : e[0] === "."
          ? (e = "0" + e)
          : e[e.length - 1] === "." && (e = e.substring(0, e.length - 1))),
    e
  );
}
function fe(e, t) {
  if (parseInt) return parseInt(e, t);
  if (Number.parseInt) return Number.parseInt(e, t);
  if (window && window.parseInt) return window.parseInt(e, t);
  throw new Error("parseInt, Number.parseInt, window.parseInt are not supported");
}
function k(e) {
  return typeof e == "function"
    ? e
    : Array.isArray(e)
      ? (t) => {
          for (let n of e) if ((typeof n == "string" && t === n) || (n instanceof RegExp && n.test(t))) return !0;
        }
      : () => !1;
}
var I = class {
  constructor(t) {
    (this.options = t),
      (this.currentNode = null),
      (this.tagsNodeStack = []),
      (this.docTypeEntities = {}),
      (this.lastEntities = {
        apos: { regex: /&(apos|#39|#x27);/g, val: "'" },
        gt: { regex: /&(gt|#62|#x3E);/g, val: ">" },
        lt: { regex: /&(lt|#60|#x3C);/g, val: "<" },
        quot: { regex: /&(quot|#34|#x22);/g, val: '"' },
      }),
      (this.ampEntity = { regex: /&(amp|#38|#x26);/g, val: "&" }),
      (this.htmlEntities = {
        space: { regex: /&(nbsp|#160);/g, val: " " },
        cent: { regex: /&(cent|#162);/g, val: "\xA2" },
        pound: { regex: /&(pound|#163);/g, val: "\xA3" },
        yen: { regex: /&(yen|#165);/g, val: "\xA5" },
        euro: { regex: /&(euro|#8364);/g, val: "\u20AC" },
        copyright: { regex: /&(copy|#169);/g, val: "\xA9" },
        reg: { regex: /&(reg|#174);/g, val: "\xAE" },
        inr: { regex: /&(inr|#8377);/g, val: "\u20B9" },
        num_dec: { regex: /&#([0-9]{1,7});/g, val: (n, s) => String.fromCodePoint(Number.parseInt(s, 10)) },
        num_hex: { regex: /&#x([0-9a-fA-F]{1,6});/g, val: (n, s) => String.fromCodePoint(Number.parseInt(s, 16)) },
      }),
      (this.addExternalEntities = ue),
      (this.parseXml = he),
      (this.parseTextData = le),
      (this.resolveNameSpace = de),
      (this.buildAttributesMap = ge),
      (this.isItStopNode = Ee),
      (this.replaceEntitiesValue = pe),
      (this.readStopNodeData = Te),
      (this.saveTextToParentTag = Ne),
      (this.addChild = ae),
      (this.ignoreAttributesFn = k(this.options.ignoreAttributes));
  }
};
function ue(e) {
  let t = Object.keys(e);
  for (let n = 0; n < t.length; n++) {
    let s = t[n];
    this.lastEntities[s] = { regex: new RegExp("&" + s + ";", "g"), val: e[s] };
  }
}
function le(e, t, n, s, o, r, u) {
  if (e !== void 0 && (this.options.trimValues && !s && (e = e.trim()), e.length > 0)) {
    u || (e = this.replaceEntitiesValue(e));
    let f = this.options.tagValueProcessor(t, e, n, o, r);
    return f == null
      ? e
      : typeof f != typeof e || f !== e
        ? f
        : this.options.trimValues
          ? $(e, this.options.parseTagValue, this.options.numberParseOptions)
          : e.trim() === e
            ? $(e, this.options.parseTagValue, this.options.numberParseOptions)
            : e;
  }
}
function de(e) {
  if (this.options.removeNSPrefix) {
    let t = e.split(":"),
      n = e.charAt(0) === "/" ? "/" : "";
    if (t[0] === "xmlns") return "";
    t.length === 2 && (e = n + t[1]);
  }
  return e;
}
var ce = new RegExp(`([^\\s=]+)\\s*(=\\s*(['"])([\\s\\S]*?)\\3)?`, "gm");
function ge(e, t, n) {
  if (this.options.ignoreAttributes !== !0 && typeof e == "string") {
    let s = A(e, ce),
      o = s.length,
      r = {};
    for (let u = 0; u < o; u++) {
      let f = this.resolveNameSpace(s[u][1]);
      if (this.ignoreAttributesFn(f, t)) continue;
      let i = s[u][4],
        d = this.options.attributeNamePrefix + f;
      if (f.length)
        if (
          (this.options.transformAttributeName && (d = this.options.transformAttributeName(d)),
          d === "__proto__" && (d = "#__proto__"),
          i !== void 0)
        ) {
          this.options.trimValues && (i = i.trim()), (i = this.replaceEntitiesValue(i));
          let l = this.options.attributeValueProcessor(f, i, t);
          l == null
            ? (r[d] = i)
            : typeof l != typeof i || l !== i
              ? (r[d] = l)
              : (r[d] = $(i, this.options.parseAttributeValue, this.options.numberParseOptions));
        } else this.options.allowBooleanAttributes && (r[d] = !0);
    }
    if (!Object.keys(r).length) return;
    if (this.options.attributesGroupName) {
      let u = {};
      return (u[this.options.attributesGroupName] = r), u;
    }
    return r;
  }
}
var he = function (e) {
  e = e.replace(
    /\r\n?/g,
    `
`,
  );
  let t = new a("!xml"),
    n = t,
    s = "",
    o = "";
  for (let r = 0; r < e.length; r++)
    if (e[r] === "<")
      if (e[r + 1] === "/") {
        let f = T(e, ">", r, "Closing Tag is not closed."),
          i = e.substring(r + 2, f).trim();
        if (this.options.removeNSPrefix) {
          let c = i.indexOf(":");
          c !== -1 && (i = i.substr(c + 1));
        }
        this.options.transformTagName && (i = this.options.transformTagName(i)),
          n && (s = this.saveTextToParentTag(s, n, o));
        let d = o.substring(o.lastIndexOf(".") + 1);
        if (i && this.options.unpairedTags.indexOf(i) !== -1)
          throw new Error(`Unpaired tag can not be used as closing tag: </${i}>`);
        let l = 0;
        d && this.options.unpairedTags.indexOf(d) !== -1
          ? ((l = o.lastIndexOf(".", o.lastIndexOf(".") - 1)), this.tagsNodeStack.pop())
          : (l = o.lastIndexOf(".")),
          (o = o.substring(0, l)),
          (n = this.tagsNodeStack.pop()),
          (s = ""),
          (r = f);
      } else if (e[r + 1] === "?") {
        let f = V(e, r, !1, "?>");
        if (!f) throw new Error("Pi Tag is not closed.");
        if (
          ((s = this.saveTextToParentTag(s, n, o)),
          !((this.options.ignoreDeclaration && f.tagName === "?xml") || this.options.ignorePiTags))
        ) {
          let i = new a(f.tagName);
          i.add(this.options.textNodeName, ""),
            f.tagName !== f.tagExp && f.attrExpPresent && (i[":@"] = this.buildAttributesMap(f.tagExp, o, f.tagName)),
            this.addChild(n, i, o, r);
        }
        r = f.closeIndex + 1;
      } else if (e.substr(r + 1, 3) === "!--") {
        let f = T(e, "-->", r + 4, "Comment is not closed.");
        if (this.options.commentPropName) {
          let i = e.substring(r + 4, f - 2);
          (s = this.saveTextToParentTag(s, n, o)),
            n.add(this.options.commentPropName, [{ [this.options.textNodeName]: i }]);
        }
        r = f;
      } else if (e.substr(r + 1, 2) === "!D") {
        let f = M(e, r);
        (this.docTypeEntities = f.entities), (r = f.i);
      } else if (e.substr(r + 1, 2) === "![") {
        let f = T(e, "]]>", r, "CDATA is not closed.") - 2,
          i = e.substring(r + 9, f);
        s = this.saveTextToParentTag(s, n, o);
        let d = this.parseTextData(i, n.tagname, o, !0, !1, !0, !0);
        d == null && (d = ""),
          this.options.cdataPropName
            ? n.add(this.options.cdataPropName, [{ [this.options.textNodeName]: i }])
            : n.add(this.options.textNodeName, d),
          (r = f + 2);
      } else {
        let f = V(e, r, this.options.removeNSPrefix),
          i = f.tagName,
          d = f.rawTagName,
          l = f.tagExp,
          c = f.attrExpPresent,
          N = f.closeIndex;
        this.options.transformTagName && (i = this.options.transformTagName(i)),
          n && s && n.tagname !== "!xml" && (s = this.saveTextToParentTag(s, n, o, !1));
        let R = n;
        R &&
          this.options.unpairedTags.indexOf(R.tagname) !== -1 &&
          ((n = this.tagsNodeStack.pop()), (o = o.substring(0, o.lastIndexOf(".")))),
          i !== t.tagname && (o += o ? "." + i : i);
        let P = r;
        if (this.isItStopNode(this.options.stopNodes, o, i)) {
          let p = "";
          if (l.length > 0 && l.lastIndexOf("/") === l.length - 1)
            i[i.length - 1] === "/"
              ? ((i = i.substr(0, i.length - 1)), (o = o.substr(0, o.length - 1)), (l = i))
              : (l = l.substr(0, l.length - 1)),
              (r = f.closeIndex);
          else if (this.options.unpairedTags.indexOf(i) !== -1) r = f.closeIndex;
          else {
            let m = this.readStopNodeData(e, d, N + 1);
            if (!m) throw new Error(`Unexpected end of ${d}`);
            (r = m.i), (p = m.tagContent);
          }
          let S = new a(i);
          i !== l && c && (S[":@"] = this.buildAttributesMap(l, o, i)),
            p && (p = this.parseTextData(p, i, o, !0, c, !0, !0)),
            (o = o.substr(0, o.lastIndexOf("."))),
            S.add(this.options.textNodeName, p),
            this.addChild(n, S, o, P);
        } else {
          if (l.length > 0 && l.lastIndexOf("/") === l.length - 1) {
            i[i.length - 1] === "/"
              ? ((i = i.substr(0, i.length - 1)), (o = o.substr(0, o.length - 1)), (l = i))
              : (l = l.substr(0, l.length - 1)),
              this.options.transformTagName && (i = this.options.transformTagName(i));
            let p = new a(i);
            i !== l && c && (p[":@"] = this.buildAttributesMap(l, o, i)),
              this.addChild(n, p, o, P),
              (o = o.substr(0, o.lastIndexOf(".")));
          } else {
            let p = new a(i);
            this.tagsNodeStack.push(n),
              i !== l && c && (p[":@"] = this.buildAttributesMap(l, o, i)),
              this.addChild(n, p, o, P),
              (n = p);
          }
          (s = ""), (r = N);
        }
      }
    else s += e[r];
  return t.child;
};
function ae(e, t, n, s) {
  this.options.captureMetaData || (s = void 0);
  let o = this.options.updateTag(t.tagname, n, t[":@"]);
  o === !1 || (typeof o == "string" && (t.tagname = o), e.addChild(t, s));
}
var pe = function (e) {
  if (this.options.processEntities) {
    for (let t in this.docTypeEntities) {
      let n = this.docTypeEntities[t];
      e = e.replace(n.regx, n.val);
    }
    for (let t in this.lastEntities) {
      let n = this.lastEntities[t];
      e = e.replace(n.regex, n.val);
    }
    if (this.options.htmlEntities)
      for (let t in this.htmlEntities) {
        let n = this.htmlEntities[t];
        e = e.replace(n.regex, n.val);
      }
    e = e.replace(this.ampEntity.regex, this.ampEntity.val);
  }
  return e;
};
function Ne(e, t, n, s) {
  return (
    e &&
      (s === void 0 && (s = t.child.length === 0),
      (e = this.parseTextData(e, t.tagname, n, !1, t[":@"] ? Object.keys(t[":@"]).length !== 0 : !1, s)),
      e !== void 0 && e !== "" && t.add(this.options.textNodeName, e),
      (e = "")),
    e
  );
}
function Ee(e, t, n) {
  let s = "*." + n;
  for (let o in e) {
    let r = e[o];
    if (s === r || t === r) return !0;
  }
  return !1;
}
function be(e, t, n = ">") {
  let s,
    o = "";
  for (let r = t; r < e.length; r++) {
    let u = e[r];
    if (s) u === s && (s = "");
    else if (u === '"' || u === "'") s = u;
    else if (u === n[0])
      if (n[1]) {
        if (e[r + 1] === n[1]) return { data: o, index: r };
      } else return { data: o, index: r };
    else u === "	" && (u = " ");
    o += u;
  }
}
function T(e, t, n, s) {
  let o = e.indexOf(t, n);
  if (o === -1) throw new Error(s);
  return o + t.length - 1;
}
function V(e, t, n, s = ">") {
  let o = be(e, t + 1, s);
  if (!o) return;
  let r = o.data,
    u = o.index,
    f = r.search(/\s/),
    i = r,
    d = !0;
  f !== -1 && ((i = r.substring(0, f)), (r = r.substring(f + 1).trimStart()));
  let l = i;
  if (n) {
    let c = i.indexOf(":");
    c !== -1 && ((i = i.substr(c + 1)), (d = i !== o.data.substr(c + 1)));
  }
  return { tagName: i, tagExp: r, closeIndex: u, attrExpPresent: d, rawTagName: l };
}
function Te(e, t, n) {
  let s = n,
    o = 1;
  for (; n < e.length; n++)
    if (e[n] === "<")
      if (e[n + 1] === "/") {
        let r = T(e, ">", n, `${t} is not closed`);
        if (e.substring(n + 2, r).trim() === t && (o--, o === 0)) return { tagContent: e.substring(s, n), i: r };
        n = r;
      } else if (e[n + 1] === "?") n = T(e, "?>", n + 1, "StopNode is not closed.");
      else if (e.substr(n + 1, 3) === "!--") n = T(e, "-->", n + 3, "StopNode is not closed.");
      else if (e.substr(n + 1, 2) === "![") n = T(e, "]]>", n, "StopNode is not closed.") - 2;
      else {
        let r = V(e, n, ">");
        r && ((r && r.tagName) === t && r.tagExp[r.tagExp.length - 1] !== "/" && o++, (n = r.closeIndex));
      }
}
function $(e, t, n) {
  if (t && typeof e == "string") {
    let s = e.trim();
    return s === "true" ? !0 : s === "false" ? !1 : _(e, n);
  } else return Y(e) ? e : "";
}
var j = a.getMetaDataSymbol();
function L(e, t) {
  return X(e, t);
}
function X(e, t, n) {
  let s,
    o = {};
  for (let r = 0; r < e.length; r++) {
    let u = e[r],
      f = we(u),
      i = "";
    if ((n === void 0 ? (i = f) : (i = n + "." + f), f === t.textNodeName))
      s === void 0 ? (s = u[f]) : (s += "" + u[f]);
    else {
      if (f === void 0) continue;
      if (u[f]) {
        let d = X(u[f], t, i),
          l = ye(d, t);
        u[j] !== void 0 && (d[j] = u[j]),
          u[":@"]
            ? Ie(d, u[":@"], i, t)
            : Object.keys(d).length === 1 && d[t.textNodeName] !== void 0 && !t.alwaysCreateTextNode
              ? (d = d[t.textNodeName])
              : Object.keys(d).length === 0 && (t.alwaysCreateTextNode ? (d[t.textNodeName] = "") : (d = "")),
          o[f] !== void 0 && o.hasOwnProperty(f)
            ? (Array.isArray(o[f]) || (o[f] = [o[f]]), o[f].push(d))
            : t.isArray(f, i, l)
              ? (o[f] = [d])
              : (o[f] = d);
      }
    }
  }
  return typeof s == "string" ? s.length > 0 && (o[t.textNodeName] = s) : s !== void 0 && (o[t.textNodeName] = s), o;
}
function we(e) {
  let t = Object.keys(e);
  for (let n = 0; n < t.length; n++) {
    let s = t[n];
    if (s !== ":@") return s;
  }
}
function Ie(e, t, n, s) {
  if (t) {
    let o = Object.keys(t),
      r = o.length;
    for (let u = 0; u < r; u++) {
      let f = o[u];
      s.isArray(f, n + "." + f, !0, !0) ? (e[f] = [t[f]]) : (e[f] = t[f]);
    }
  }
}
function ye(e, t) {
  let { textNodeName: n } = t,
    s = Object.keys(e).length;
  return !!(s === 0 || (s === 1 && (e[n] || typeof e[n] == "boolean" || e[n] === 0)));
}
var Ae = { allowBooleanAttributes: !1, unpairedTags: [] };
function G(e, t) {
  t = Object.assign({}, Ae, t);
  let n = [],
    s = !1,
    o = !1;
  e[0] === "\uFEFF" && (e = e.substr(1));
  for (let r = 0; r < e.length; r++)
    if (e[r] === "<" && e[r + 1] === "?") {
      if (((r += 2), (r = q(e, r)), r.err)) return r;
    } else if (e[r] === "<") {
      let u = r;
      if ((r++, e[r] === "!")) {
        r = Q(e, r);
        continue;
      } else {
        let f = !1;
        e[r] === "/" && ((f = !0), r++);
        let i = "";
        for (
          ;
          r < e.length &&
          e[r] !== ">" &&
          e[r] !== " " &&
          e[r] !== "	" &&
          e[r] !==
            `
` &&
          e[r] !== "\r";
          r++
        )
          i += e[r];
        if (((i = i.trim()), i[i.length - 1] === "/" && ((i = i.substring(0, i.length - 1)), r--), !Fe(i))) {
          let c;
          return (
            i.trim().length === 0 ? (c = "Invalid space after '<'.") : (c = "Tag '" + i + "' is an invalid name."),
            g("InvalidTag", c, h(e, r))
          );
        }
        let d = Ce(e, r);
        if (d === !1) return g("InvalidAttr", "Attributes for '" + i + "' have open quote.", h(e, r));
        let l = d.value;
        if (((r = d.index), l[l.length - 1] === "/")) {
          let c = r - l.length;
          l = l.substring(0, l.length - 1);
          let N = W(l, t);
          if (N === !0) s = !0;
          else return g(N.err.code, N.err.msg, h(e, c + N.err.line));
        } else if (f)
          if (d.tagClosed) {
            if (l.trim().length > 0)
              return g("InvalidTag", "Closing tag '" + i + "' can't have attributes or invalid starting.", h(e, u));
            if (n.length === 0) return g("InvalidTag", "Closing tag '" + i + "' has not been opened.", h(e, u));
            {
              let c = n.pop();
              if (i !== c.tagName) {
                let N = h(e, c.tagStartPos);
                return g(
                  "InvalidTag",
                  "Expected closing tag '" +
                    c.tagName +
                    "' (opened in line " +
                    N.line +
                    ", col " +
                    N.col +
                    ") instead of closing tag '" +
                    i +
                    "'.",
                  h(e, u),
                );
              }
              n.length == 0 && (o = !0);
            }
          } else return g("InvalidTag", "Closing tag '" + i + "' doesn't have proper closing.", h(e, r));
        else {
          let c = W(l, t);
          if (c !== !0) return g(c.err.code, c.err.msg, h(e, r - l.length + c.err.line));
          if (o === !0) return g("InvalidXml", "Multiple possible root nodes found.", h(e, r));
          t.unpairedTags.indexOf(i) !== -1 || n.push({ tagName: i, tagStartPos: u }), (s = !0);
        }
        for (r++; r < e.length; r++)
          if (e[r] === "<")
            if (e[r + 1] === "!") {
              r++, (r = Q(e, r));
              continue;
            } else if (e[r + 1] === "?") {
              if (((r = q(e, ++r)), r.err)) return r;
            } else break;
          else if (e[r] === "&") {
            let c = me(e, r);
            if (c == -1) return g("InvalidChar", "char '&' is not expected.", h(e, r));
            r = c;
          } else if (o === !0 && !Z(e[r])) return g("InvalidXml", "Extra text at the end", h(e, r));
        e[r] === "<" && r--;
      }
    } else {
      if (Z(e[r])) continue;
      return g("InvalidChar", "char '" + e[r] + "' is not expected.", h(e, r));
    }
  if (s) {
    if (n.length == 1) return g("InvalidTag", "Unclosed tag '" + n[0].tagName + "'.", h(e, n[0].tagStartPos));
    if (n.length > 0)
      return g(
        "InvalidXml",
        "Invalid '" +
          JSON.stringify(
            n.map((r) => r.tagName),
            null,
            4,
          ).replace(/\r?\n/g, "") +
          "' found.",
        { line: 1, col: 1 },
      );
  } else return g("InvalidXml", "Start tag expected.", 1);
  return !0;
}
function Z(e) {
  return (
    e === " " ||
    e === "	" ||
    e ===
      `
` ||
    e === "\r"
  );
}
function q(e, t) {
  let n = t;
  for (; t < e.length; t++)
    if (e[t] == "?" || e[t] == " ") {
      let s = e.substr(n, t - n);
      if (t > 5 && s === "xml")
        return g("InvalidXml", "XML declaration allowed only at the start of the document.", h(e, t));
      if (e[t] == "?" && e[t + 1] == ">") {
        t++;
        break;
      } else continue;
    }
  return t;
}
function Q(e, t) {
  if (e.length > t + 5 && e[t + 1] === "-" && e[t + 2] === "-") {
    for (t += 3; t < e.length; t++)
      if (e[t] === "-" && e[t + 1] === "-" && e[t + 2] === ">") {
        t += 2;
        break;
      }
  } else if (
    e.length > t + 8 &&
    e[t + 1] === "D" &&
    e[t + 2] === "O" &&
    e[t + 3] === "C" &&
    e[t + 4] === "T" &&
    e[t + 5] === "Y" &&
    e[t + 6] === "P" &&
    e[t + 7] === "E"
  ) {
    let n = 1;
    for (t += 8; t < e.length; t++)
      if (e[t] === "<") n++;
      else if (e[t] === ">" && (n--, n === 0)) break;
  } else if (
    e.length > t + 9 &&
    e[t + 1] === "[" &&
    e[t + 2] === "C" &&
    e[t + 3] === "D" &&
    e[t + 4] === "A" &&
    e[t + 5] === "T" &&
    e[t + 6] === "A" &&
    e[t + 7] === "["
  ) {
    for (t += 8; t < e.length; t++)
      if (e[t] === "]" && e[t + 1] === "]" && e[t + 2] === ">") {
        t += 2;
        break;
      }
  }
  return t;
}
var Oe = '"',
  ve = "'";
function Ce(e, t) {
  let n = "",
    s = "",
    o = !1;
  for (; t < e.length; t++) {
    if (e[t] === Oe || e[t] === ve) s === "" ? (s = e[t]) : s !== e[t] || (s = "");
    else if (e[t] === ">" && s === "") {
      o = !0;
      break;
    }
    n += e[t];
  }
  return s !== "" ? !1 : { value: n, index: t, tagClosed: o };
}
var Pe = new RegExp(`(\\s*)([^\\s=]+)(\\s*=)?(\\s*(['"])(([\\s\\S])*?)\\5)?`, "g");
function W(e, t) {
  let n = A(e, Pe),
    s = {};
  for (let o = 0; o < n.length; o++) {
    if (n[o][1].length === 0) return g("InvalidAttr", "Attribute '" + n[o][2] + "' has no space in starting.", y(n[o]));
    if (n[o][3] !== void 0 && n[o][4] === void 0)
      return g("InvalidAttr", "Attribute '" + n[o][2] + "' is without value.", y(n[o]));
    if (n[o][3] === void 0 && !t.allowBooleanAttributes)
      return g("InvalidAttr", "boolean attribute '" + n[o][2] + "' is not allowed.", y(n[o]));
    let r = n[o][2];
    if (!Me(r)) return g("InvalidAttr", "Attribute '" + r + "' is an invalid name.", y(n[o]));
    if (!s.hasOwnProperty(r)) s[r] = 1;
    else return g("InvalidAttr", "Attribute '" + r + "' is repeated.", y(n[o]));
  }
  return !0;
}
function Se(e, t) {
  let n = /\d/;
  for (e[t] === "x" && (t++, (n = /[\da-fA-F]/)); t < e.length; t++) {
    if (e[t] === ";") return t;
    if (!e[t].match(n)) break;
  }
  return -1;
}
function me(e, t) {
  if ((t++, e[t] === ";")) return -1;
  if (e[t] === "#") return t++, Se(e, t);
  let n = 0;
  for (; t < e.length; t++, n++)
    if (!(e[t].match(/\w/) && n < 20)) {
      if (e[t] === ";") break;
      return -1;
    }
  return t;
}
function g(e, t, n) {
  return { err: { code: e, msg: t, line: n.line || n, col: n.col } };
}
function Me(e) {
  return w(e);
}
function Fe(e) {
  return w(e);
}
function h(e, t) {
  let n = e.substring(0, t).split(/\r?\n/);
  return { line: n.length, col: n[n.length - 1].length + 1 };
}
function y(e) {
  return e.startIndex + e[1].length;
}
var C = class {
  constructor(t) {
    (this.externalEntities = {}), (this.options = U(t));
  }
  parse(t, n) {
    if (typeof t != "string")
      if (t.toString) t = t.toString();
      else throw new Error("XML data is accepted in String or Bytes[] form.");
    if (n) {
      n === !0 && (n = {});
      let r = G(t, n);
      if (r !== !0) throw Error(`${r.err.msg}:${r.err.line}:${r.err.col}`);
    }
    let s = new I(this.options);
    s.addExternalEntities(this.externalEntities);
    let o = s.parseXml(t);
    return this.options.preserveOrder || o === void 0 ? o : L(o, this.options);
  }
  addEntity(t, n) {
    if (n.indexOf("&") !== -1) throw new Error("Entity value can't have '&'");
    if (t.indexOf("&") !== -1 || t.indexOf(";") !== -1)
      throw new Error("An entity must be set without '&' and ';'. Eg. use '#xD' for '&#xD;'");
    if (n === "&") throw new Error("An entity with value '&' is not permitted");
    this.externalEntities[t] = n;
  }
  static getMetaDataSymbol() {
    return a.getMetaDataSymbol();
  }
};
export { C as a };
