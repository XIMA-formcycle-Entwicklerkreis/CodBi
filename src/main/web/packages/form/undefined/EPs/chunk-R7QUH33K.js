import { __commonJS } from "./chunk-YNACB2OL.js";

// ../../node_modules/@de-xima/fc-form-renderer/dist/index.js
var require_dist = __commonJS({
  "../../node_modules/@de-xima/fc-form-renderer/dist/index.js"(exports, module) {
    "use strict";
    var u = Object.defineProperty;
    var y = Object.getOwnPropertyDescriptor;
    var I = Object.getOwnPropertyNames;
    var F = Object.prototype.hasOwnProperty;
    var V = (e, t) => {
      for (var n in t) u(e, n, { get: t[n], enumerable: true });
    };
    var x = (e, t, n, s) => {
      if ((t && typeof t == "object") || typeof t == "function")
        for (let o of I(t))
          !F.call(e, o) && o !== n && u(e, o, { get: () => t[o], enumerable: !(s = y(t, o)) || s.enumerable });
      return e;
    };
    var b = (e) => x(u({}, "__esModule", { value: true }), e);
    var E = {};
    V(E, {
      $: () => O,
      getJQuery: () => l,
      getProjektId: () => w,
      getUrlParameter: () => k,
      getXUtil: () => h,
      getXfcMetaData: () => _,
      getXmFormDynValues: () => f,
      getXmFormDynValuesParsed: () => j,
      getXmFormI18n: () => R,
      getXmFormModel: () => T,
      getXmFormPluginValidationRules: () => D,
      getXmFormValidationRules: () => A,
      getXmValidator: () => P,
      gotoPage: () => U,
      setValidate: () => v,
    });
    module.exports = b(E);
    var p = () => (typeof globalThis == "object" ? globalThis : window);
    var M = (e) => p()[e];
    var r = (e) => () => p()[e];
    var m =
      (e) =>
      (...t) =>
        M(e)(...t);
    var g;
    var _ = r("XFC_METADATA");
    var R = r("XM_FORM_I18N");
    var f = r("XM_FORM_DYNVALUES");
    var A = r("XM_FORM_VRULES");
    var T = r("XM_FORM_MODEL");
    var D = r("XM_FORM_PLUGIN_VRULES");
    var P = r("xm_validator");
    var h = () => l().xutil;
    var w = m("getProjektId");
    var k = m("getURLParameter");
    var U = m("gotoPage");
    var v = m("setValidate");
    var l = m("xm_jq");
    function j() {
      var n, s;
      if (g !== void 0) return g;
      let e = { formItems: {}, repetitions: {} },
        t = (n = f()) != null ? n : {};
      for (let o of Object.keys(t != null ? t : {})) {
        let i = t[o];
        if (i !== void 0)
          if (Array.isArray(i)) {
            let a = o.endsWith("_dyn_size") ? o.substring(0, o.length - 9) : o;
            e.repetitions[a] = i;
          } else
            for (let a of Object.keys(i)) {
              let c = i[a],
                d = (s = e.formItems[o]) != null ? s : { size: 0, value: {} };
              if (((e.formItems[o] = d), c !== void 0))
                if (typeof c == "number") d.size = c;
                else {
                  let X = a.startsWith("_") ? a.substring(1) : a;
                  d.value[X] = c;
                }
            }
      }
      return (g = e), e;
    }
    if (typeof XFC_METADATA != "object")
      throw new Error(
        [
          "fc-form-renderer is not available",
          "This module only contains type declaration files and no implementation.",
          "The declared types are available only within a web form context of the XIMA formcycle application.",
        ].join(`
`),
      );
    var O = l();
  },
});

export { require_dist };
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0BkZS14aW1hL2ZjLWZvcm0tcmVuZGVyZXIvZGlzdC9pbmRleC5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiXCJ1c2Ugc3RyaWN0XCI7dmFyIHU9T2JqZWN0LmRlZmluZVByb3BlcnR5O3ZhciB5PU9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3I7dmFyIEk9T2JqZWN0LmdldE93blByb3BlcnR5TmFtZXM7dmFyIEY9T2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTt2YXIgVj0oZSx0KT0+e2Zvcih2YXIgbiBpbiB0KXUoZSxuLHtnZXQ6dFtuXSxlbnVtZXJhYmxlOiEwfSl9LHg9KGUsdCxuLHMpPT57aWYodCYmdHlwZW9mIHQ9PVwib2JqZWN0XCJ8fHR5cGVvZiB0PT1cImZ1bmN0aW9uXCIpZm9yKGxldCBvIG9mIEkodCkpIUYuY2FsbChlLG8pJiZvIT09biYmdShlLG8se2dldDooKT0+dFtvXSxlbnVtZXJhYmxlOiEocz15KHQsbykpfHxzLmVudW1lcmFibGV9KTtyZXR1cm4gZX07dmFyIGI9ZT0+eCh1KHt9LFwiX19lc01vZHVsZVwiLHt2YWx1ZTohMH0pLGUpO3ZhciBFPXt9O1YoRSx7JDooKT0+TyxnZXRKUXVlcnk6KCk9PmwsZ2V0UHJvamVrdElkOigpPT53LGdldFVybFBhcmFtZXRlcjooKT0+ayxnZXRYVXRpbDooKT0+aCxnZXRYZmNNZXRhRGF0YTooKT0+XyxnZXRYbUZvcm1EeW5WYWx1ZXM6KCk9PmYsZ2V0WG1Gb3JtRHluVmFsdWVzUGFyc2VkOigpPT5qLGdldFhtRm9ybUkxOG46KCk9PlIsZ2V0WG1Gb3JtTW9kZWw6KCk9PlQsZ2V0WG1Gb3JtUGx1Z2luVmFsaWRhdGlvblJ1bGVzOigpPT5ELGdldFhtRm9ybVZhbGlkYXRpb25SdWxlczooKT0+QSxnZXRYbVZhbGlkYXRvcjooKT0+UCxnb3RvUGFnZTooKT0+VSxzZXRWYWxpZGF0ZTooKT0+dn0pO21vZHVsZS5leHBvcnRzPWIoRSk7dmFyIHA9KCk9PnR5cGVvZiBnbG9iYWxUaGlzPT1cIm9iamVjdFwiP2dsb2JhbFRoaXM6d2luZG93LE09ZT0+cCgpW2VdLHI9ZT0+KCk9PnAoKVtlXSxtPWU9PiguLi50KT0+TShlKSguLi50KSxnLF89cihcIlhGQ19NRVRBREFUQVwiKSxSPXIoXCJYTV9GT1JNX0kxOE5cIiksZj1yKFwiWE1fRk9STV9EWU5WQUxVRVNcIiksQT1yKFwiWE1fRk9STV9WUlVMRVNcIiksVD1yKFwiWE1fRk9STV9NT0RFTFwiKSxEPXIoXCJYTV9GT1JNX1BMVUdJTl9WUlVMRVNcIiksUD1yKFwieG1fdmFsaWRhdG9yXCIpLGg9KCk9PmwoKS54dXRpbCx3PW0oXCJnZXRQcm9qZWt0SWRcIiksaz1tKFwiZ2V0VVJMUGFyYW1ldGVyXCIpLFU9bShcImdvdG9QYWdlXCIpLHY9bShcInNldFZhbGlkYXRlXCIpLGw9bShcInhtX2pxXCIpO2Z1bmN0aW9uIGooKXt2YXIgbixzO2lmKGchPT12b2lkIDApcmV0dXJuIGc7bGV0IGU9e2Zvcm1JdGVtczp7fSxyZXBldGl0aW9uczp7fX0sdD0obj1mKCkpIT1udWxsP246e307Zm9yKGxldCBvIG9mIE9iamVjdC5rZXlzKHQhPW51bGw/dDp7fSkpe2xldCBpPXRbb107aWYoaSE9PXZvaWQgMClpZihBcnJheS5pc0FycmF5KGkpKXtsZXQgYT1vLmVuZHNXaXRoKFwiX2R5bl9zaXplXCIpP28uc3Vic3RyaW5nKDAsby5sZW5ndGgtOSk6bztlLnJlcGV0aXRpb25zW2FdPWl9ZWxzZSBmb3IobGV0IGEgb2YgT2JqZWN0LmtleXMoaSkpe2xldCBjPWlbYV0sZD0ocz1lLmZvcm1JdGVtc1tvXSkhPW51bGw/czp7c2l6ZTowLHZhbHVlOnt9fTtpZihlLmZvcm1JdGVtc1tvXT1kLGMhPT12b2lkIDApaWYodHlwZW9mIGM9PVwibnVtYmVyXCIpZC5zaXplPWM7ZWxzZXtsZXQgWD1hLnN0YXJ0c1dpdGgoXCJfXCIpP2Euc3Vic3RyaW5nKDEpOmE7ZC52YWx1ZVtYXT1jfX19cmV0dXJuIGc9ZSxlfWlmKHR5cGVvZiBYRkNfTUVUQURBVEEhPVwib2JqZWN0XCIpdGhyb3cgbmV3IEVycm9yKFtcImZjLWZvcm0tcmVuZGVyZXIgaXMgbm90IGF2YWlsYWJsZVwiLFwiVGhpcyBtb2R1bGUgb25seSBjb250YWlucyB0eXBlIGRlY2xhcmF0aW9uIGZpbGVzIGFuZCBubyBpbXBsZW1lbnRhdGlvbi5cIixcIlRoZSBkZWNsYXJlZCB0eXBlcyBhcmUgYXZhaWxhYmxlIG9ubHkgd2l0aGluIGEgd2ViIGZvcm0gY29udGV4dCBvZiB0aGUgWElNQSBmb3JtY3ljbGUgYXBwbGljYXRpb24uXCJdLmpvaW4oYFxuYCkpO3ZhciBPPWwoKTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZGV4LmpzLm1hcFxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBYSxRQUFJLElBQUUsT0FBTztBQUFlLFFBQUksSUFBRSxPQUFPO0FBQXlCLFFBQUksSUFBRSxPQUFPO0FBQW9CLFFBQUksSUFBRSxPQUFPLFVBQVU7QUFBZSxRQUFJLElBQUUsQ0FBQyxHQUFFLE1BQUk7QUFBQyxlQUFRLEtBQUssRUFBRSxHQUFFLEdBQUUsR0FBRSxFQUFDLEtBQUksRUFBRSxDQUFDLEdBQUUsWUFBVyxLQUFFLENBQUM7QUFBQSxJQUFDO0FBQTVELFFBQThELElBQUUsQ0FBQyxHQUFFLEdBQUUsR0FBRSxNQUFJO0FBQUMsVUFBRyxLQUFHLE9BQU8sS0FBRyxZQUFVLE9BQU8sS0FBRyxXQUFXLFVBQVEsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFDLEVBQUUsS0FBSyxHQUFFLENBQUMsS0FBRyxNQUFJLEtBQUcsRUFBRSxHQUFFLEdBQUUsRUFBQyxLQUFJLE1BQUksRUFBRSxDQUFDLEdBQUUsWUFBVyxFQUFFLElBQUUsRUFBRSxHQUFFLENBQUMsTUFBSSxFQUFFLFdBQVUsQ0FBQztBQUFFLGFBQU87QUFBQSxJQUFDO0FBQUUsUUFBSSxJQUFFLE9BQUcsRUFBRSxFQUFFLENBQUMsR0FBRSxjQUFhLEVBQUMsT0FB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
