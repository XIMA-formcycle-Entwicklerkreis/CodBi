import { a as D } from "./chunk-4FZP53WT.js";
import { a as k } from "./chunk-2P4INLEO.js";
import { a as z } from "./chunk-IZMXAPWV.js";
import { a as I } from "./chunk-INDLVHJ6.js";
import { a as v } from "./chunk-XMOSKO55.js";
import { a as B } from "./chunk-EEU2ZRMO.js";
import { a as m } from "./chunk-CVDXS2Z7.js";
import { a as w } from "./chunk-PR6DYHSM.js";
import { a as l } from "./chunk-TNKBSIBG.js";
import { b as O, c as T, d as c } from "./chunk-REJDLPRJ.js";
var y = O(B(), 1);
var p = class d extends l {
  constructor(n) {
    super();
    this.conditions = n;
  }
  static checkAlgorithm(n, s) {
    let t = "";
    for (let e = 0; e < n.length; e++) {
      let o = n[e].check(s);
      if (typeof o == "string") t += `${o}${e === n.length - 1 ? "" : " or "}`;
      else return !0;
    }
    return t;
  }
  static PRE(n, s = void 0, t = "WaXCode.DBC") {
    return l.decPrecondition((e, o, b, h) => d.checkAlgorithm(n, e), t, s);
  }
  static POST(n, s = void 0, t = "WaXCode.DBC") {
    return l.decPostcondition((e, o, b) => d.checkAlgorithm(n, e), t, s);
  }
  static INVARIANT(n, s = void 0, t = "WaXCode.DBC") {
    return l.decInvariant([new d(n)], s, t);
  }
  check(n) {
    return d.checkAlgorithm(this.conditions, n);
  }
  static tsCheck(n, s) {
    let t = d.checkAlgorithm(s, n);
    if (t) return n;
    throw new l.Infringement(t);
  }
};
var a = class a {
  static retrieve(f) {
    return new Promise((n, s) => {
      var A;
      let t = (0, y.getJQuery)(),
        e = new Array(),
        o = 0,
        b = (i) => {
          if (a.buffer.has(i)) {
            n(a.buffer.get(i));
            return;
          }
          t.ajax({
            url: `${window.codbi.baseURL}plugin?name=CodBi_BayVIS_Auskunft_Ansprechpartnerdetails`,
            type: "GET",
            headers: { Accept: "application/xml", ID: i.trim() },
          })
            .done((u) => {
              o++;
              let g = new I({ attributeNamePrefix: "", ignoreAttributes: !1 }).parse(u)["ns2:ansprechpartner"];
              if ((g === void 0 && (g = JSON.parse(u)), f.length >= 2)) {
                let r = e[f[1]];
                r === void 0 && s(new v(`Detail "${f[1]}" of authorities is not available.`)), e.push(r);
              }
              if (h.length === 1)
                (e = Array.isArray(g.ap) ? g.ap[0] : g.ap),
                  (e.apTelefonOrtsvorwahl = e.telefonOrtsvorwahl),
                  (e.apTelefonAnlage = e.telefonAnlage),
                  (e.apTelefonDurchwahl = e.telefonDurchwahl),
                  (e.apEmail = e.email),
                  (a.buffer[i] = [e]),
                  n(e);
              else {
                let r = Array.isArray(g.ap) ? g.ap[0] : g.ap;
                (r.apTelefonOrtsvorwahl = r.telefonOrtsvorwahl),
                  (r.apTelefonOrtsvorwahl = r.telefonOrtsvorwahl),
                  (r.apTelefonAnlage = r.telefonAnlage),
                  (r.apTelefonDurchwahl = r.telefonDurchwahl),
                  (r.apEmail = r.email),
                  e.push(r),
                  o === h.length && n((a.buffer[i] = e));
              }
            })
            .fail((u) => {
              s(new v("Unable to retrieve data from CodBi_BayVIS_Auskunft_Ansprechpartnerdetails"));
            });
        },
        h = ((A = f[0]) == null ? void 0 : A.toString()).split("/").map((i) => i.trim());
      for (let i = 0; i < h.length; i++)
        Number.isNaN(Number.parseInt(h[i]))
          ? D.retrieve([h[i].trim()]).then((u) => {
              u[0] !== void 0 && b(u[0].toString());
            })
          : b(h[i]);
    });
  }
};
(a.stdExp = {
  directoryMember:
    /^(anrede|vorname|nachname|funktion|stellenbezeichnung|email|website|zimmer|behoerdeId|behoerdeBezeichnung|gebaeudeId|gebaeudeBezeichnung|ansprechpartnerId|telefonLandvorwahl|telefonOrtsvorwahl|telefonAnlage|telefonDurchwahl|apTelefonLandvorwahl|apTelefonOrtsvorwahl|apTelefonAnlage|apTelefonDurchwahl|apEmail)$/,
}),
  (a.buffer = new Map()),
  (a.registered = window.codbi.registerEP("BayVIS.Ansprechpartner.Details", a.retrieve)),
  T(
    [
      l.ParamvalueProvider,
      c(0, k.PRE(0, !1, !1, "length")),
      c(0, w.PRE(new z("string"))),
      c(
        0,
        w.PRE(
          new p([new m(/^([A-Za-z\s]+|\d{1,6})(?:\/([A-Za-z\s]+|\d{1,6}))*|$/), new m(a.stdExp.directoryMember)]),
          1,
        ),
      ),
      c(
        0,
        w.PRE(
          new p([new m(/^([A-Za-z\s]+|\d{1,6})(?:\/([A-Za-z\s]+|\d{1,6}))*|$/), new m(a.stdExp.directoryMember)]),
          1,
        ),
      ),
    ],
    a,
    "retrieve",
    1,
  );
var E = a;
export { E as BayVIS_Ansprechpartner_Details };
