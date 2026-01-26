import { a as A } from "./chunk-IZMXAPWV.js";
import { a as C } from "./chunk-EEU2ZRMO.js";
import { a as b } from "./chunk-PR6DYHSM.js";
import { a as f } from "./chunk-TNKBSIBG.js";
import { b as w, c as l, d as p } from "./chunk-REJDLPRJ.js";
var d = w(C(), 1);
var r = class r {
  static genComparableKey(s) {
    let g = [...s.years].sort().join("-"),
      t = [...s.states].sort().join("-");
    return `${g}_${t}_${s.augsburg ? "T" : "F"}_${s.catholic ? "T" : "F"}`;
  }
  static retrieve(s) {
    let g = new Array(),
      t = new Array(),
      a = new Array(),
      i = s.some((e) => e.toLowerCase() === "friedensfest"),
      n = s.some((e) => e.toLowerCase() === "katholisch");
    for (let e of s)
      if (Number.isNaN(e)) t.push(e);
      else if (e.toLowerCase().indexOf("this_year") !== -1) {
        let o = e.indexOf("+");
        o === -1 && (o = e.indexOf("-")),
          o !== -1
            ? t.push(
                (
                  new Date().getFullYear() +
                  Number.parseInt(e.substring(o + 1)) * (e.substring(o, o + 1) === "+" ? 1 : -1)
                ).toString(),
              )
            : t.push(new Date().getFullYear().toString());
      } else
        e.toLowerCase().indexOf("friedensfest") === -1 &&
          e.toLowerCase().indexOf("katholisch") === -1 &&
          a.push(e.toLowerCase());
    let c = new Promise((e) => {
      if (r.buffer.has(r.genComparableKey({ years: t, states: a, augsburg: i, catholic: n }))) {
        if (Array.isArray(r.buffer.get(r.genComparableKey({ years: t, states: a, augsburg: i, catholic: n })))) {
          e(r.buffer.get(r.genComparableKey({ years: t, states: a, augsburg: i, catholic: n })));
          return;
        } else
          r.buffer.get(r.genComparableKey({ years: t, states: a, augsburg: i, catholic: n })).then((u) => {
            e(u);
          });
        return;
      }
      (0, d.getJQuery)()
        .ajax({
          url: `${window.codbi.baseURL}plugin?name=CodBi_Holidays_FeiertageDE`,
          type: "GET",
          headers: {
            years: t.join(","),
            states: a.join(",").replace(/ /g, ""),
            augsburg: i ? "true" : "false  ",
            catholic: n ? "true" : "false",
          },
        })
        .done((u) => {
          let y = JSON.parse(u);
          if (y.status !== "error") {
            for (let h of y.feiertage)
              g.push(
                new Date(h.date.replace(/\./g, "/").replace(/-/g, "/")).toLocaleDateString("de-DE", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                }),
              );
            r.buffer.set(r.genComparableKey({ years: t, states: a, augsburg: i, catholic: n }), g), e(g);
          }
        });
    });
    return r.buffer.set(r.genComparableKey({ years: t, states: a, augsburg: i, catholic: n }), c), c;
  }
};
(r.buffer = new Map()),
  (r.registered = window.codbi.registerEP("Date.Holidays", r.retrieve)),
  l([f.ParamvalueProvider, p(0, b.PRE(new A("string")))], r, "retrieve", 1);
var m = r;
export { m as Date_Holidays };
