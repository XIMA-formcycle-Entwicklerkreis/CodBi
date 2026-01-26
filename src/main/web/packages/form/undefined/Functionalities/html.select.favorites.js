import { a as g } from "./chunk-BGFHKOW7.js";
import { a as m } from "./chunk-K3A632J4.js";
import { a as v } from "./chunk-QM2ZX7FA.js";
import { a as E } from "./chunk-W23DHSE2.js";
import { a as d } from "./chunk-MUWAMKOD.js";
import { f as c, g as f, h as r } from "./chunk-RS4WWU7K.js";
var u = c(E(), 1);
var n = class n {
  static functionality(i, e) {
    let t = (0, u.getJQuery)(),
      a =
        i.initialelement && typeof i.initialelement == "string"
          ? i.initialelement
          : e.querySelector("option").getAttribute("value");
    e.addEventListener("change", () => {
      t(e).val() === "Divider"
        ? i.dividertarget && typeof i.dividertarget == "string"
          ? (t(e).val(i.dividertarget), (a = i.dividertarget))
          : t(e).val(a)
        : (a = t(e).val());
    }),
      (e.innerHTML = `
          <option value = "Divider"
                  class = "---CodBi --HTML_Select_Favorites --Divider">
                  ${i.divider && typeof i.divider == "string" ? i.divider : ""}</option>
                  ${e.innerHTML}`);
    let s = e.querySelector(".---CodBi.--HTML_Select_Favorites.--Divider");
    for (let y of i.favorites)
      for (let l of e.querySelectorAll("option"))
        l.innerHTML === y &&
          (l.classList.add("---CodBi", "--HTML_Select_Favorites", "--Favorite"), l.remove(), e.insertBefore(l, s));
    i.initialelement && typeof i.initialelement == "string" && t(e).val(i.initialelement);
  }
};
(n.registered = window.codbi.registerFunctionality("HTML.Select.Favorites", n.functionality)),
  f(
    [
      d.ParamvalueProvider,
      r(0, m.PRE("string", "dividertarget")),
      r(0, g.PRE(Array, "favorites")),
      r(0, v.PRE(0, !0, "favorites.length")),
      r(1, v.PRE("SELECT", !1, "tagName")),
    ],
    n,
    "functionality",
    1,
  );
var p = n;
export { p as HTML_Select_Favorites };
