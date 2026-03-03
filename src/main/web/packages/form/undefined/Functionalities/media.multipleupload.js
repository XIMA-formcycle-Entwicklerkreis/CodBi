import { a as E } from "./chunk-7ZUEWSHL.js";
import { a as f } from "./chunk-PSEWTT4Z.js";
import { a as p } from "./chunk-M2SNI3IN.js";
import { a as x } from "./chunk-4JLAI42Q.js";
import { a as u } from "./chunk-KEJSWGMR.js";
import { a } from "./chunk-SEUS6MHP.js";
import { a as m } from "./chunk-CDLTIEKC.js";
import { f as b, g as r, h as t } from "./chunk-UTJJRBTX.js";
var l = b(x(), 1);
var i = class {
  static functionality(n, e) {
    let y = n.maximum ? Number.parseInt(n.maximum) : 2,
      s = E.tsCheck(
        e.parentElement.querySelector("label span"),
        `Isn't there a <label> with a <span> for the tagged <input type="file">?`,
      ).innerHTML;
    e.addEventListener("change", (h) => {
      if (e.files.length > y)
        (0, l.getJQuery)()(e).error(
          n.prefixtoomany && n.postfixtoomany
            ? n.prefixtoomany + n.maximum + n.postfixtoomany
            : `Too many files selected. The maximum number of files is ${n.maximum ? n.maximum : 2}.`,
        );
      else if (((0, l.getJQuery)()(e).error(""), e.files.length !== 1)) {
        e.parentElement.querySelector("label span").innerHTML = `${s} (`;
        for (let g of e.files) e.parentElement.querySelector("label span").innerHTML += `${g.name}, `;
        (e.parentElement.querySelector("label span").innerHTML = e.parentElement
          .querySelector("label span")
          .innerHTML.substring(0, e.parentElement.querySelector("label span").innerHTML.length - 2)),
          (e.parentElement.querySelector("label span").innerHTML += ")");
      }
    }),
      e.setAttribute("multiple", "");
  }
};
r(
  [
    t(0, m.PRE("string", "prefixtoomany :: postfixtoomany")),
    t(0, m.PRE("string | number", "maximum")),
    t(0, p.PRE(new m("string"), new a(/\d+/), "maximum")),
    t(1, u.PRE(HTMLInputElement, "Is it not an <input> that is tagged with this functionality?")),
    t(1, f.PRE("type", !1, 'Is it not an <input type = "file"> that is tagged with this functionality?', "type")),
  ],
  i,
  "functionality",
  1,
);
window.codbi.registerFunctionality("Media.MultipleUpload", i.functionality.bind(i));
export { i as Media_MultipleUpload };
