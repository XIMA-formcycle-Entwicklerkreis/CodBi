/**
 * Registers standard configurations specific to LDAP autocompletion of {@link HTMLInputElement }s.
 *
 * CSS-Classes:
 *  - **CodBi_LDAP_AC_Mail**
 *    The {@link HTMLInputElement }s tagged with these classes will be configured to be autocompleted as soon as the
 *    entered mail-address matches an entry in the connected LDAP. As long as there are multiple matches, a selection
 *    will be presented to the user.
 *    Entering an address that does not match any entry in the LDAP will not be tolerated.
 *    This class matches the common LDAP-Property **mail**.
 *
 *  - **CodBi_LDAP_AC_FirstName**
 *    This class matches the common LDAP-Property **givenName**.
 *
 *  - **CodBi_LDAP_AC_LastName**
 *    This class matches the common LDAP-Property **sn**.
 *
 *  - **CodBi_LDAP_AC_Title**
 *    This class matches the common LDAP-Property **title**.
 *
 *  - **CodBi_LDAP_AC_Department**
 *    This class matches the common LDAP-Property **department**.
 *
 *  - **CodBi_LDAP_AC_Telephone**
 *    This class matches the common LDAP-Property **telephoneNumber**.
 *
 *  - **CodBi_LDAP_AC_Account**
 *    This class matches the common LDAP-Property **sAMAccountName**.
 *
 *  - **CodBi_LDAP_AC_CommonName**
 *    This class matches the common LDAP-Property **cn**.
 *
 *  - **CodBi_LDAP_AC_DisplayName**
 *    This class matches the common LDAP-Property **displayName**. */
export function loadConfig(): void {
  window.codbi.loadConfigs([
    {
      targets: ".CodBi_LDAP_AC_Mail",
      FUNC: "LDAP.Autocomplete",
      Property: "mail",
    },
    {
      targets: ".CodBi_LDAP_AC_FirstName",
      FUNC: "LDAP.Autocomplete",
      Property: "givenName",
    },
    {
      targets: ".CodBi_LDAP_AC_LastName",
      FUNC: "LDAP.Autocomplete",
      Property: "sn",
    },
    {
      targets: ".CodBi_LDAP_AC_Title",
      FUNC: "LDAP.Autocomplete",
      Property: "title",
    },
    {
      targets: ".CodBi_LDAP_AC_Department",
      FUNC: "LDAP.Autocomplete",
      Property: "department",
    },
    {
      targets: ".CodBi_LDAP_AC_Telephone",
      FUNC: "LDAP.Autocomplete",
      Property: "telephoneNumber",
    },
    {
      targets: ".CodBi_LDAP_AC_Account",
      FUNC: "LDAP.Autocomplete",
      Property: "sAMAccountName",
    },
    {
      targets: ".CodBi_LDAP_AC_CommonName",
      FUNC: "LDAP.Autocomplete",
      Property: "cn",
    },
    {
      targets: ".CodBi_LDAP_AC_DisplayName",
      FUNC: "LDAP.Autocomplete",
      Property: "displayName",
    },
  ]);
}

loadConfig();
