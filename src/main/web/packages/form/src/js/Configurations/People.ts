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
 * - **CodBi_People_BuildingNumber**
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
 * Tagging the proper elements with these classes a fotocropper can be set up. */
export function loadConfig(): void {
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
    targets: ".CodBi_People_BuildingNumber",
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
}

loadConfig();
