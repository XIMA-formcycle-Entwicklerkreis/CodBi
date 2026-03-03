import { a as R } from "./chunk-HV3SPSHE.js";
import { a as d } from "./chunk-BQCZFAYZ.js";
import { a as A } from "./chunk-PN2FQ2K5.js";
import { a as m } from "./chunk-2NFNCZZA.js";
import { b as C, c as p, d as y, g as b } from "./chunk-WWJ6UWS7.js";
var h = C(R(), 1);
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
    let f = new Promise((e) => {
      if (r.buffer.has(r.genComparableKey({ years: t, states: a, augsburg: i, catholic: n }))) {
        if (Array.isArray(r.buffer.get(r.genComparableKey({ years: t, states: a, augsburg: i, catholic: n })))) {
          e(r.buffer.get(r.genComparableKey({ years: t, states: a, augsburg: i, catholic: n })));
          return;
        } else
          r.buffer.get(r.genComparableKey({ years: t, states: a, augsburg: i, catholic: n })).then((c) => {
            e(c);
          });
        return;
      }
      (0, h.getJQuery)()
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
        .done((c) => {
          let l = JSON.parse(c);
          if (l.status !== "error") {
            for (let w of l.feiertage)
              g.push(
                new Date(w.date.replace(/\./g, "/").replace(/-/g, "/")).toLocaleDateString("de-DE", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                }),
              );
            r.buffer.set(r.genComparableKey({ years: t, states: a, augsburg: i, catholic: n }), g), e(g);
          }
        });
    });
    return r.buffer.set(r.genComparableKey({ years: t, states: a, augsburg: i, catholic: n }), f), f;
  }
};
(r.buffer = new Map()),
  p(
    [
      b.ParamvalueProvider,
      y(0, d.PRE(1, !0, !1, "length", "Hasn't at least the year been specified?")),
      y(0, m.PRE(new A("string"))),
    ],
    r,
    "retrieve",
    1,
  );
var u = r;
window.codbi.registerEP("Date.Holidays", u.retrieve.bind(u));
export { u as Date_Holidays };
