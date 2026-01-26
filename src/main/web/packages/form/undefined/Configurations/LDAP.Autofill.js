function t() {
  window.codbi.loadConfigs([
    { targets: ".CodBi_LDAP_AC_Mail", FUNC: "LDAP.Autocomplete", Property: "mail" },
    { targets: ".CodBi_LDAP_AC_FirstName", FUNC: "LDAP.Autocomplete", Property: "givenName" },
    { targets: ".CodBi_LDAP_AC_LastName", FUNC: "LDAP.Autocomplete", Property: "sn" },
    { targets: ".CodBi_LDAP_AC_Title", FUNC: "LDAP.Autocomplete", Property: "title" },
    { targets: ".CodBi_LDAP_AC_Department", FUNC: "LDAP.Autocomplete", Property: "department" },
    { targets: ".CodBi_LDAP_AC_Telephone", FUNC: "LDAP.Autocomplete", Property: "telephoneNumber" },
    { targets: ".CodBi_LDAP_AC_Account", FUNC: "LDAP.Autocomplete", Property: "sAMAccountName" },
    { targets: ".CodBi_LDAP_AC_CommonName", FUNC: "LDAP.Autocomplete", Property: "cn" },
    { targets: ".CodBi_LDAP_AC_DisplayName", FUNC: "LDAP.Autocomplete", Property: "displayName" },
  ]);
}
t();
export { t as loadConfig };
