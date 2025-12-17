/**
 * Registers standard configurations specific to people characteristics.
 *
 * CSS-Classes:
 * - **CodBi_People_Alphanumeric**
 *  The {@link HTMLInputElement } tagged with this class may only contain characters matching
 *  **^[-0-9A-za-z/: ]*[0-9A-za-z]$** and prevents entering characters not matching **[-0-9A-za-z/: ]**.
 * - **CodBi_People_Name**
 *  The {@link HTMLInputElement } tagged with this class may only contain characters matching
 *  **^[-0-9A-za-z/:# ]*[0-9A-za-z]$** and prevents entering characters not matching **[ A-Za-zà-ÿ'-]**.
 * - **CodBi_People_BuildingNumber**, **CodBi_OpenPLZ_AC_SET_BuildingNumber**
 *  The {@link HTMLInputElement } tagged with this class may only contain characters matching
 *  **^[0-9]+[-0-9A-Za-z/]*[0-9A-Za-z]$** and prevents entering characters not matching **[-A-Za-z0-9/ ]**.
 *  - **CodBi_People_Mail**
 *  The {@link HTMLInputElement } tagged with this class may only contain characters matching
 *  **^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z][a-zA-Z]?$** and prevents entering characters not matching **[a-zA-Z0-9._%+-@]**.
 * - **CodBi_People_18plus**
 *  The {@link HTMLInputElement }s tagged with this class will be configured to not allow entering or selecting dates from JQuery's
 *  datepicker that are less than 18 years in the past, which is useful for {@link HTMLInputElement }s taking birthdays.
 *  The {@link HTMLInputElement } will be Cleave formatted with leading zeros and dots as separator.
 *
 * - **CodBi_People_Phone**
 *  The {@link HTMLInputElement }s tagged with this class will be configured to only allow valid phonenumber input.
 *
 * - **CodBi_People_PLZ**
 * The {@link HTMLInputElement }s tagged with this class will be configured to only allow valid german postal codes.
 *
 * - **CodBi_Fotocropper_Board, CodBi_Fotocropper_Uploader, CodBi_Fotocropper_Update & CodBi_Fotocropper_Foto**
 * Tagging the proper elements with these classes a fotocropper can be set up.
 *
 * - **CodBi_OpenPLZ_AC_SET_PLZ**
 * Combines **CodBi_OpenPLZ_AC_SET_PLZ** with **CodBi_People_PLZ**.
 *
 * - **CodBi_OpenPLZ_AC_SET_Locality**
 * Combines **CodBi_OpenPLZ_AC_SET_Locality** with **CodBi_People_Name**.
 *
 * - **CodBi_OpenPLZ_AC_SET_Street**
 * Combines **CodBi_OpenPLZ_AC_SET_Street** with **CodBi_People_Name**.
 *
 * - **CodBi_OpenPLZ_Select_Localities**
 * Fills a {@link HTMLSelectElement } with all the Localities of the country which's country code is specified
 * in the global variable **CodBi_OpenPLZ_Country** according to the regular expression specified in the
 * global variable **CodBi_OpenPLZ_Selection_regexName** for the name of the localities.
 *
 * - **CodBi_OpenPLZ_Select_Streets_By_PLZ**
 * Fills a {@link HTMLSelectElement } with all the streets in a locality that is identified by it'S postal code
 * according to the regular expression placed in the global variable **CodBi_OpenPLZ_Selection_Streets_regexName**
 * for the name of the streets.
 *
 * - **CodBi_OpenPLZ_Select_Orga_Bundeslaender**
 * Fills a {@link HTMLSelectElement } with all the federal states of Germany.
 *
 * - **CodBi_OpenPLZ_Select_Orga_Bayern**
 * Fills a {@link HTMLSelectElement } with all the government regions of Bayern (Germany). */
export function loadConfig(): void {
  // #region Formatting
  window.codbi.loadConfig({
    targets: ".CodBi_People_Alphanumeric",
    FUNC: "HTML.Input.Regex",
    Expression: "°[-0-9A-za-zÄÜÖäüöß/:# ]*[0-9A-za-z]$",
    KeyExpression: "[-0-9A-za-zÄÜÖäüöß/:# ]",
    Flags: "i",
    ErrorPrefix: "Der Name muss dem regulären Ausdruck",
    ErrorPostfix: "entsprechen.",
    ExposeExpression: "TRUE",
  });

  window.codbi.loadConfig({
    targets: ".CodBi_People_Name",
    FUNC: "HTML.Input.Regex",
    Expression: "°[-A-za-zÄÜÖäüößà-ÿ' ]*[a-zà-ÿ']$",
    KeyExpression: "[ A-Za-zÄÜÖäüößà-ÿ'-]",
    ErrorPrefix: "Der Name muss dem regulären Ausdruck",
    ErrorPostfix: "entsprechen.",
    ExposeExpression: "TRUE",
  });

  window.codbi.loadConfig({
    targets: ".CodBi_People_BuildingNumber ~ .CodBi_People_OpenPLZ_AC_SET_BuildingNumber",
    FUNC: "HTML.Input.Regex",
    Expression: "°[0-9]([0-9A-Za-z/-]*[0-9A-Za-z])?$",
    KeyExpression: "[-A-Za-z0-9/ ]",
    Flags: "i",
    ErrorPrefix: "Die Hausnummer muss dem regulären Ausdruck",
    ErrorPostfix: "entsprechen.",
    ExposeExpression: "TRUE",
  });

  window.codbi.loadConfig({
    targets: ".CodBi_People_Mail",
    FUNC: "HTML.Input.Regex",
    Expression: "°[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z][a-zA-Z]?$",
    KeyExpression: "[a-zA-Z0-9._%+-@]",
    Flags: "i",
    ErrorPrefix: "Die Mailadresse muss dem regulären Ausdruck",
    ErrorPostfix: "entsprechen.",
    ExposeExpression: "TRUE",
  });

  window.codbi.loadConfig({
    targets: ".CodBi_People_Phone",
    FUNC: "HTML.Input.Cleave",
    config: `^${JSON.stringify({
      phone: true,
      phoneRegionCode: "DE",
    })
      .replace("{", "<")
      .replace("}", ">")}`,
  });

  window.codbi.loadConfig({
    targets: ".CodBi_People_PLZ",
    FUNC: "HTML.Input.Cleave",
    config: `^${JSON.stringify({
      numeral: true,
      numeralIntegerScale: 5,
      delimiter: "",
    })
      .replace("{", "<")
      .replace("}", ">")}`,
  });
  // #endregion Formatting
  // #region Age Restrictions
  window.codbi.loadConfig({
    targets: ".CodBi_People_18plus",
    FUNC: "HTML.Input.Cleave, Date.Min",
    Minimum: "18",
    MsgHigher: "18 Jahre ist das erforderliche Mindestalter.",
  });

  window.codbi.loadConfig({
    targets: ".CodBi_People_16plus",
    FUNC: "HTML.Input.Cleave, Date.Min",
    Minimum: "16",
    MsgHigher: "16 Jahre ist das erforderliche Mindestalter.",
  });
  // #endregion Age Restrictions
  window.codbi.loadConfig({
    targets: ".CodBi_Fotocropper",
    FUNC: "Media.Image.Cropper",
    Container: ".CodBi_Fotocropper_Board",
    File: ".CodBi_Fotocropper_Uploader",
    Updater: ".CodBi_Fotocropper_Update",
    ImageURL: ".CodBi_Fotocropper_ImageURL",
    Target: ".CodBi_Fotocropper_Foto",
    AspectRatio: "4 / 3",
  });
  // #region OpenPLZ
  // #region For Inputs
  window.codbi.loadConfigs([
    {
      targets: ".CodBi_People_OpenPLZ_AC_SET_PLZ",
      FUNC: "OpenPLZ.Autocomplete, HTML.Input.Cleave",
      Country: "{ V > CodBi_OpenPLZ_Country }",
      TargetData: "PostalCodes",
      Dependent: ".CodBi_People_OpenPLZ_AC_SET_Locality",
      FocusOnAutocomplete: ".CodBi_People_OpenPLZ_AC_SET_Street",
      MsgNotKnown: "Nur bekannte Postleitzahlen sind zulässig.",
      config: `^${JSON.stringify({
        numeral: true,
        numeralIntegerScale: 5,
        delimiter: "",
      })
        .replace("{", "<")
        .replace("}", ">")}`,
    },
    {
      targets: ".CodBi_People_OpenPLZ_AC_SET_Locality",
      FUNC: "OpenPLZ.Autocomplete, HTML.Input.Regex",
      Country: "{ V > CodBi_OpenPLZ_Country }",
      TargetData: "Localities",
      Dependent: ".CodBi_People_OpenPLZ_AC_SET_PLZ",
      FocusOnAutocomplete: ".CodBi_People_OpenPLZ_AC_SET_Street",
      MsgNotKnown: "Nur bekannte Örtlichkeiten sind zulässig.",
      Expression: "°[-A-za-zÄÜÖäüößà-ÿ' ]*[a-zà-ÿ']$",
      KeyExpression: "[ A-Za-zÄÜÖäüößà-ÿ'-]",
      ErrorPrefix: "Der Name muss dem regulären Ausdruck",
      ErrorPostfix: "entsprechen.",
      ExposeExpression: "TRUE",
    },
    {
      targets: ".CodBi_People_OpenPLZ_AC_SET_Street",
      FUNC: "OpenPLZ.Autocomplete, HTML.Input.Regex",
      Country: "{ V > CodBi_OpenPLZ_Country }",
      TargetData: "Streets",
      DependentLocality: ".CodBi_People_OpenPLZ_AC_SET_Locality",
      DependentPLZ: ".CodBi_People_OpenPLZ_AC_SET_PLZ",
      FocusOnAutocomplete: ".CodBi_People_OpenPLZ_AC_SET_BuildingNumber",
      MsgNotKnown: "Nur bekannte Straßen sind zulässig.",
      Expression: "°[-A-za-zÄÜÖäüößà-ÿ' ]*[a-zà-ÿ']$",
      KeyExpression: "[ A-Za-zÄÜÖäüößà-ÿ'-]",
      ErrorPrefix: "Der Name muss dem regulären Ausdruck",
      ErrorPostfix: "entsprechen.",
      ExposeExpression: "TRUE",
    },
  ]);
  // #endregion For Inputs
  // #region For Selects
  window.codbi.loadConfigs([
    {
      targets: ".CodBi_People_OpenPLZ_Select_Localities",
      FUNC: "HTML.Select.Injection",
      Values:
        "{ unique > { openplz.localities > { V > CodBi_OpenPLZ_Country };{ V > CodBi_OpenPLZ_Selection_Localities_regexName ; REPORT }; 1 }; name }",
      TitleProperty: "name",
      ValueProperty: "name",
      TextProperty: "name",
    },
    {
      targets: ".CodBi_People_OpenPLZ_Select_Streets_By_PLZ",
      FUNC: "HTML.Select.Injection",
      Values:
        "{ unique > { openplz.streets > { V > CodBi_OpenPLZ_Country };{ V > CodBi_OpenPLZ_Selection_Streets_regexName ; REPORT };{ V > CodBi_OpenPLZ_Selection_Streets_PLZ ; REPORT }}; name }",
      TitleProperty: "name",
      ValueProperty: "name",
      TextProperty: "name",
    },
    {
      targets: ".CodBi_People_OpenPLZ_Select_Orga_Bundeslaender",
      FUNC: "HTML.Select.Injection",
      Values: "{ unique > { openplz.OrganizationalUnits > de ; FederalStates }; name }",
      TitleProperty: "name",
      ValueProperty: "name",
      TextProperty: "name",
    },
    {
      targets: ".CodBi_People_OpenPLZ_Select_Orga_Bayern",
      FUNC: "HTML.Select.Injection",
      Values: "{ unique > { openplz.OrganizationalUnits > de ; FederalStates ; 09 ; GovernmentRegions }; name }",
      TitleProperty: "name",
      ValueProperty: "name",
      TextProperty: "name",
    },
  ]);
  // #endregion For Selects
  // #region OpenPLZ
}

loadConfig();
