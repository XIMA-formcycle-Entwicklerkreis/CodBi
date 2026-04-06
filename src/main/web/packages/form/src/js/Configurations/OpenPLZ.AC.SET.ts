/**
 * Registers standard configurations that binds {@link HTMLInputElements } tagged with the
 * data-cb-func **OpenPLZ.Autocomplete** into a set of {@link HTMLInputElement }s that act together as an interface
 * for fast and accurate provision of an address within a specific country.
 * Simply tag every {@link HTMLInputElement } within a {@link HTMLDivElement } with the the corresponding
 * **CodBi-Class**. **These classes may also be used standalone**.
 *
 * CSS-Classes:
 *  - **CodBi_OpenPLZ_AC_SET_PLZ**:             Represents the set's **postal code**.
 *  - **CodBi_OpenPLZ_AC_SET_Locality**:        Represents the set's **locality**.
 *  - **CodBi_OpenPLZ_AC_SET_Street**:          Represents the set's **street**.
 *  - **CodBi_OpenPLZ_AC_SET_BuildingNumber**:  Represents the set's **building number**.
 *
 * Global Variables:
 *  - **CodBi_OpenPLZ_Country**: The code of the country to check. If not set the Plugin-Variable **OpenPLZ_Country**
 *                               will be used. If the Plugin-Variable is not set "**de**" will be used. */
export function loadConfig(): void {
  window.codbi.loadConfigs([
    {
      targets: ".CodBi_OpenPLZ_AC_SET_PLZ",
      FUNC: "HTML.Input.Cleave, OpenPLZ.Autocomplete",
      Country: "{ V > CodBi_OpenPLZ_Country }",
      TargetData: "PostalCodes",
      Dependent: ".CodBi_OpenPLZ_AC_SET_Locality",
      FocusOnAutocomplete: ".CodBi_OpenPLZ_AC_SET_Street",
      MsgNotKnown: "Nur bekannte Postleitzahlen sind erlaubt.",
      config: `^${JSON.stringify({
        numeral: true,
        numeralIntegerScale: 5,
        delimiter: "",
      })
        .replace("{", "<")
        .replace("}", ">")}`,
    },
    {
      targets: ".CodBi_OpenPLZ_AC_SET_Locality",
      FUNC: "OpenPLZ.Autocomplete",
      Country: "{ V > CodBi_OpenPLZ_Country }",
      TargetData: "Localities",
      Dependent: ".CodBi_OpenPLZ_AC_SET_PLZ",
      FocusOnAutocomplete: ".CodBi_OpenPLZ_AC_SET_Street",
      MsgNotKnown: "Nur bekannte Örtlichkeiten sind erlaubt.",
    },
    {
      targets: ".CodBi_OpenPLZ_AC_SET_Street",
      FUNC: "OpenPLZ.Autocomplete",
      Country: "{ V > CodBi_OpenPLZ_Country }",
      TargetData: "Streets",
      DependentLocality: ".CodBi_OpenPLZ_AC_SET_Locality",
      DependentPLZ: ".CodBi_OpenPLZ_AC_SET_PLZ",
      FocusOnAutocomplete: ".CodBi_OpenPLZ_AC_SET_BuildingNumber",
      MsgNotKnown: "Nur bekannte Straßen für den Ort, falls angegeben, oder das Land sind erlaubt.",
    },
  ]);
}

loadConfig();
