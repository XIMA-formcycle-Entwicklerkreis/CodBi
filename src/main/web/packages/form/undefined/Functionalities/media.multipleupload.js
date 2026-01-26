import { a as p } from "./chunk-W23DHSE2.js";
import { f as u } from "./chunk-RS4WWU7K.js";
var t = u(p(), 1),
  l = class l {
    static functionality(n, e) {
      let m = n.maximum ? Number.parseInt(n.maximum) : 2,
        r = e.parentElement.querySelector("label span").innerHTML;
      e.addEventListener("change", (f) => {
        if (e.files.length > m)
          (0, t.getJQuery)()(e).error(
            n.prefixtoomany && n.postfixtoomany
              ? n.prefixtoomany + n.maximum + n.postfixtoomany
              : `Too many files selected. The maximum number of files is ${n.maximum ? n.maximum : 2}.`,
          );
        else if (((0, t.getJQuery)()(e).error(""), e.files.length !== 1)) {
          e.parentElement.querySelector("label span").innerHTML = `${r} (`;
          for (let a of e.files) e.parentElement.querySelector("label span").innerHTML += `${a.name}, `;
          (e.parentElement.querySelector("label span").innerHTML = e.parentElement
            .querySelector("label span")
            .innerHTML.substring(0, e.parentElement.querySelector("label span").innerHTML.length - 2)),
            (e.parentElement.querySelector("label span").innerHTML += ")");
        }
      }),
        e.setAttribute("multiple", "");
    }
  };
l.registered = window.codbi.registerFunctionality("Media.MultipleUpload", l.functionality);
var i = l;
export { i as Media_MultipleUpload };
