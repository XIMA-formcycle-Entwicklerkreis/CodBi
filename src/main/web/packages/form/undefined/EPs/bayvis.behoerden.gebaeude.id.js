import { a as o } from "./chunk-5VSWSYRJ.js";
import { a as d } from "./chunk-JDZ7GIHA.js";
import "./chunk-INDLVHJ6.js";
import "./chunk-SBHCT576.js";
import "./chunk-ZAZUS2LA.js";
import "./chunk-HV3SPSHE.js";
import { a as s } from "./chunk-BQCZFAYZ.js";
import { a as b } from "./chunk-PN2FQ2K5.js";
import { a as n } from "./chunk-2NFNCZZA.js";
import { c as i, d as e, g as a } from "./chunk-WWJ6UWS7.js";
var r = class {
  static retrieve(m) {
    return new Promise((g, E) => {
      o.retrieve([m[0]]).then((t) => {
        let u = new Array();
        if (Array.isArray(t.behoerdenGebaeudeZuordnungen.gebaeude))
          for (let h of t.behoerdenGebaeudeZuordnungen.gebaeude) u.push(h.id.toString());
        else u.push(t.behoerdenGebaeudeZuordnungen.gebaeude.id.toString());
        g(u);
      });
    });
  }
};
i(
  [
    a.ParamvalueProvider,
    e(0, s.PRE(1, !0, !1, "length", "Has the ID of the authority been specified?")),
    e(0, n.PRE(new b("string | object"))),
    e(0, n.PRE(new d(o.stdExp.authorityID), 0, 1)),
    e(0, n.PRE(new d(o.stdExp.directoryMember), 2)),
  ],
  r,
  "retrieve",
  1,
);
window.codbi.registerEP("BayVIS.Behoerden.Gebaeude.ID", r.retrieve.bind(r));
export { r as BayVIS_Behoerden_Gebaeude_ID };
