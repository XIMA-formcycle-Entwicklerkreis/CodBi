import { a as g } from "./chunk-JH6KRLLF.js";
import { a as m } from "./chunk-PSEWTT4Z.js";
import { a as c } from "./chunk-4JLAI42Q.js";
import { a as v } from "./chunk-KEJSWGMR.js";
import { a as f } from "./chunk-CDLTIEKC.js";
import { f as y, g as d, h as t, p as s } from "./chunk-UTJJRBTX.js";
var o = y(c(), 1);
var n = class {
  static functionality(e, i) {
    let r = (0, o.getJQuery)(),
      l =
        e.initialelement && typeof e.initialelement == "string"
          ? e.initialelement
          : i.querySelector("option").getAttribute("value");
    i.addEventListener("change", () => {
      r(i).val() === "Divider"
        ? e.dividertarget && typeof e.dividertarget == "string"
          ? (r(i).val(e.dividertarget), (l = e.dividertarget))
          : r(i).val(l)
        : (l = r(i).val());
    }),
      (i.innerHTML = `
          <option value = "Divider"
                  class = "---CodBi --HTML_Select_Favorites --Divider">
                  ${e.divider && typeof e.divider == "string" ? e.divider : ""}</option>
                  ${i.innerHTML}`);
    let p = i.querySelector(".---CodBi.--HTML_Select_Favorites.--Divider");
    for (let u of e.favorites)
      for (let a of i.querySelectorAll("option"))
        a.innerHTML === u &&
          (a.classList.add("---CodBi", "--HTML_Select_Favorites", "--Favorite"), a.remove(), i.insertBefore(a, p));
    e.initialelement && typeof e.initialelement == "string" && r(i).val(e.initialelement);
  }
};
d(
  [
    s.ParamvalueProvider,
    t(
      0,
      f.PRE(
        "string",
        "dividertarget :: initialelement :: divider",
        'Is one or more of the parameters "dividertarget", "initialelement" or "divider" not of type string?',
      ),
    ),
    t(0, v.PRE(Array, "favorites", 'Is the parameter "favorites" not an array of strings?')),
    t(0, m.PRE(0, !0, "favorites.length", "Isn't at least one favorite specified?")),
    t(
      0,
      g.PRE(
        [new f("string")],
        void 0,
        void 0,
        "favorites",
        `Aren't all elements of parameter "favorites" of type string?`,
      ),
    ),
    t(1, v.PRE(HTMLSelectElement, void 0, "Is it not a <select/> that is tagged with this functionality?")),
  ],
  n,
  "functionality",
  1,
);
window.codbi.registerFunctionality("HTML.Select.Favorites", n.functionality.bind(n));
export { n as HTML_Select_Favorites };
