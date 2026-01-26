function e() {
  window.codbi.loadConfigs([
    {
      targets: ".CodBi_OpenPLZ_AC_SET_PLZ",
      FUNC: "OpenPLZ.Autocomplete",
      Country: "{ V > CodBi_OpenPLZ_Country }",
      TargetData: "PostalCodes",
      Dependent: ".CodBi_OpenPLZ_AC_SET_Locality",
      FocusOnAutocomplete: ".CodBi_OpenPLZ_AC_SET_Street",
      MsgNotKnown: "Nur bekannte Postleitzahlen sind erlaubt.",
    },
    {
      targets: ".CodBi_OpenPLZ_AC_SET_Locality",
      FUNC: "OpenPLZ.Autocomplete",
      Country: "{ V > CodBi_OpenPLZ_Country }",
      TargetData: "Localities",
      Dependent: ".CodBi_OpenPLZ_AC_SET_PLZ",
      FocusOnAutocomplete: ".CodBi_OpenPLZ_AC_SET_Street",
      MsgNotKnown: "Nur bekannte \xD6rtlichkeiten sind erlaubt.",
    },
    {
      targets: ".CodBi_OpenPLZ_AC_SET_Street",
      FUNC: "OpenPLZ.Autocomplete",
      Country: "{ V > CodBi_OpenPLZ_Country }",
      TargetData: "Streets",
      DependentLocality: ".CodBi_OpenPLZ_AC_SET_Locality",
      DependentPLZ: ".CodBi_OpenPLZ_AC_SET_PLZ",
      FocusOnAutocomplete: ".CodBi_OpenPLZ_AC_SET_BuildingNumber",
      MsgNotKnown: "Nur bekannte Stra\xDFen f\xFCr den Ort, falls angegeben, oder das Land sind erlaubt.",
    },
  ]);
}
e();
export { e as loadConfig };
