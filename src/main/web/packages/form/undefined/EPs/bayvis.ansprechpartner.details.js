import { a as u } from "./chunk-CTQLZ4AL.js";
import { a as E } from "./chunk-NPIBHYPB.js";
import { a as h } from "./chunk-JDZ7GIHA.js";
import { a as I } from "./chunk-INDLVHJ6.js";
import { a as p } from "./chunk-SBHCT576.js";
import "./chunk-ZAZUS2LA.js";
import { a as y } from "./chunk-HV3SPSHE.js";
import { a as A } from "./chunk-BQCZFAYZ.js";
import { a as o } from "./chunk-PN2FQ2K5.js";
import { a as l } from "./chunk-2NFNCZZA.js";
import { b as B, c as T, d as g, g as z } from "./chunk-WWJ6UWS7.js";
var O = B(y(), 1);
var t = class t {
  static retrieve(f) {
    return new Promise((m, b) => {
      var v;
      let D = (0, O.getJQuery)(),
        e = new Array(),
        w = 0,
        c = (r) => {
          if (t.buffer.has(r)) {
            m(t.buffer.get(r));
            return;
          }
          D.ajax({
            url: `${window.codbi.baseURL}plugin?name=CodBi_BayVIS_Auskunft_Ansprechpartnerdetails`,
            type: "GET",
            headers: { Accept: "application/xml", ID: r.trim() },
          })
            .done((s) => {
              w++;
              let a = new I({ attributeNamePrefix: "", ignoreAttributes: !1 }).parse(s)["ns2:ansprechpartner"];
              if ((a === void 0 && (a = JSON.parse(s)), f.length >= 2)) {
                let n = e[f[1]];
                n === void 0 && b(new p(`Detail "${f[1]}" of authorities is not available.`)), e.push(n);
              }
              if (i.length === 1)
                (e = Array.isArray(a.ap) ? a.ap[0] : a.ap),
                  (e.apTelefonOrtsvorwahl = e.telefonOrtsvorwahl),
                  (e.apTelefonAnlage = e.telefonAnlage),
                  (e.apTelefonDurchwahl = e.telefonDurchwahl),
                  (e.apEmail = e.email),
                  (t.buffer[r] = [e]),
                  m(e);
              else {
                let n = Array.isArray(a.ap) ? a.ap[0] : a.ap;
                (n.apTelefonOrtsvorwahl = n.telefonOrtsvorwahl),
                  (n.apTelefonOrtsvorwahl = n.telefonOrtsvorwahl),
                  (n.apTelefonAnlage = n.telefonAnlage),
                  (n.apTelefonDurchwahl = n.telefonDurchwahl),
                  (n.apEmail = n.email),
                  e.push(n),
                  w === i.length && m((t.buffer[r] = e));
              }
            })
            .fail((s) => {
              b(new p("Unable to retrieve data from CodBi_BayVIS_Auskunft_Ansprechpartnerdetails"));
            });
        },
        i = ((v = f[0]) == null ? void 0 : v.toString()).split("/").map((r) => r.trim());
      for (let r = 0; r < i.length; r++)
        Number.isNaN(Number.parseInt(i[r]))
          ? E.retrieve([i[r].trim()]).then((s) => {
              s[0] !== void 0 && c(s[0].toString());
            })
          : c(i[r]);
    });
  }
};
(t.stdExp = {
  directoryMember:
    /^(anrede|vorname|nachname|funktion|stellenbezeichnung|email|website|zimmer|behoerdeId|behoerdeBezeichnung|gebaeudeId|gebaeudeBezeichnung|ansprechpartnerId|telefonLandvorwahl|telefonOrtsvorwahl|telefonAnlage|telefonDurchwahl|apTelefonLandvorwahl|apTelefonOrtsvorwahl|apTelefonAnlage|apTelefonDurchwahl|apEmail)$/,
}),
  (t.buffer = new Map()),
  T(
    [
      z.ParamvalueProvider,
      g(
        0,
        A.PRE(
          1,
          !1,
          !1,
          "length",
          "Has the contact's ID (1st parameter) and the property (2nd parameter) to retrieve been specified?",
        ),
      ),
      g(0, l.PRE(new u([new o("string"), new o("number"), new o("object")]), 0)),
      g(0, l.PRE(new o("string"), 1)),
      g(
        0,
        l.PRE(
          new u([new h(/^([A-Za-z\s]+|\d{1,6})(?:\/([A-Za-z\s]+|\d{1,6}))*|$/), new h(t.stdExp.directoryMember)]),
          1,
        ),
      ),
      g(
        0,
        l.PRE(
          new u([new h(/^([A-Za-z\s]+|\d{1,6})(?:\/([A-Za-z\s]+|\d{1,6}))*|$/), new h(t.stdExp.directoryMember)]),
          1,
        ),
      ),
    ],
    t,
    "retrieve",
    1,
  );
var d = t;
window.codbi.registerEP("BayVIS.Ansprechpartner.Details", d.retrieve.bind(d));
export { d as BayVIS_Ansprechpartner_Details };
