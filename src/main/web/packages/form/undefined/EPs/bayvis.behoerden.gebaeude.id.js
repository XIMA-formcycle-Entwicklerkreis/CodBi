import { a as i } from "./chunk-6BQ5WEIU.js";
import "./chunk-2P4INLEO.js";
import "./chunk-IZMXAPWV.js";
import "./chunk-INDLVHJ6.js";
import "./chunk-XMOSKO55.js";
import "./chunk-EEU2ZRMO.js";
import "./chunk-CVDXS2Z7.js";
import "./chunk-PR6DYHSM.js";
import { a as u } from "./chunk-TNKBSIBG.js";
import { c as o } from "./chunk-REJDLPRJ.js";
var e = class e {
  static retrieve(d) {
    return new Promise((a, m) => {
      i.retrieve([d[0]]).then((r) => {
        let n = new Array();
        if (Array.isArray(r.behoerdenGebaeudeZuordnungen.gebaeude))
          for (let b of r.behoerdenGebaeudeZuordnungen.gebaeude) n.push(b.id.toString());
        else n.push(r.behoerdenGebaeudeZuordnungen.gebaeude.id.toString());
        a(n);
      });
    });
  }
};
(e.registered = window.codbi.registerEP("BayVIS.Behoerden.Gebaeude.ID", e.retrieve)),
  o([u.ParamvalueProvider], e, "retrieve", 1);
var t = e;
export { t as BayVIS_Behoerden_Gebaeude_ID };
