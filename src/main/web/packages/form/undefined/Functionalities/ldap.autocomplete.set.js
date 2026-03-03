import { b as _ } from "./chunk-XV6HM7GR.js";
import "./chunk-JH6KRLLF.js";
import "./chunk-DCP5OS4S.js";
import "./chunk-7ZUEWSHL.js";
import "./chunk-PSEWTT4Z.js";
import "./chunk-M2SNI3IN.js";
import "./chunk-4JLAI42Q.js";
import "./chunk-KEJSWGMR.js";
import "./chunk-SEUS6MHP.js";
import "./chunk-CDLTIEKC.js";
import { g as l, p as L } from "./chunk-UTJJRBTX.js";
var n = class n {
  static functionality(u, i) {
    let a = (r, c) => {
        let t = i.querySelector(".CodBi_LDAP_AC_Mail");
        t && (t.value = r[0].mail),
          (t = i.querySelector(".CodBi_LDAP_AC_FirstName")),
          t && (t.value = r[0].givenName),
          (t = i.querySelector(".CodBi_LDAP_AC_LastName")),
          t && (t.value = r[0].sn),
          (t = i.querySelector(".CodBi_LDAP_AC_Title")),
          t && (t.value = r[0].title),
          (t = i.querySelector(".CodBi_LDAP_AC_Department")),
          t && (t.value = r[0].department),
          (t = i.querySelector(".CodBi_LDAP_AC_Telephone")),
          t && (t.value = r[0].telephoneNumber),
          (t = i.querySelector(".CodBi_LDAP_AC_Account")),
          t && (t.value = r[0].sAMAccountName),
          (t = i.querySelector(".CodBi_LDAP_AC_CommonName")),
          t && (t.value = r[0].cn),
          (t = i.querySelector(".CodBi_LDAP_AC_DisplayName")),
          t && (t.value = r[0].displayName);
        for (let A of i.querySelectorAll(".CodBi_LDAP_Set_Member"))
          A.hasAttribute("data-cb-ldapProperty") && (A.value = r[0][A.getAttribute("data-cb-ldapProperty")]);
      },
      e = i.querySelector(".CodBi_LDAP_AC_Mail");
    e && (e.codbiLDAPSetMatchListeners = [a]),
      (e = i.querySelector(".CodBi_LDAP_AC_FirstName")),
      e && (e.codbiLDAPSetMatchListeners = [a]),
      (e = i.querySelector(".CodBi_LDAP_AC_LastName")),
      e && (e.codbiLDAPSetMatchListeners = [a]),
      (e = i.querySelector(".CodBi_LDAP_AC_Title")),
      e && (e.codbiLDAPSetMatchListeners = [a]),
      (e = i.querySelector(".CodBi_LDAP_AC_Department")),
      e && (e.codbiLDAPSetMatchListeners = [a]),
      (e = i.querySelector(".CodBi_LDAP_AC_Telephone")),
      e && (e.codbiLDAPSetMatchListeners = [a]),
      (e = i.querySelector(".CodBi_LDAP_AC_Account")),
      e && (e.codbiLDAPSetMatchListeners = [a]),
      (e = i.querySelector(".CodBi_LDAP_AC_CommonName")),
      e && (e.codbiLDAPSetMatchListeners = [a]),
      (e = i.querySelector(".CodBi_LDAP_AC_DisplayName")),
      e && (e.codbiLDAPSetMatchListeners = [a]);
    for (let r of i.querySelectorAll(".CodBi_LDAP_Set_Member"))
      r.hasAttribute("data-cb-ldapProperty") &&
        (_.functionality({ Property: r.getAttribute("data-cb-ldapProperty") }, r),
        (r.codbiLDAPSetMatchListeners = [a]));
  }
};
(n.registered = window.codbi.registerFunctionality("LDAP.Autocomplete.Set", n.functionality)),
  l([L.ParamvalueProvider], n, "functionality", 1);
var o = n;
export { o as LDAP_Autocomplete_Set };
