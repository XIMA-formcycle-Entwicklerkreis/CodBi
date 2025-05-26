/**
 * Registers standard configurations specific to people characteristics.
 *
 * CSS-Classes:
 * - **CodBi_People_18plus**
 *  The {@link HTMLInputElement }s tagged with this class will be configured to not allow entering or selecting dates from JQuery's
 *  datepicker that are less than 18 years in the past, which is useful for {@link HTMLInputElement }s taking birthdays.
 * The {@link HTMLInputElement } will be Cleave formatted with leading zeros and dots as separator.
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
    targets: ".CodBi_People_18plus",
    FUNC: "HTML.Input.Cleave, Date.Min",
    Minimum: "18",
    MsgHigher: "",
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
    targets: ".CodBi_Fotocropper_Board",
    FUNC: "Media.Image.Cropper",
    Container: ".CodBi_Fotocropper_Board",
    File: ".CodBi_Fotocropper_Uploader",
    Updater: ".CodBi_Fotocropper_Update",
    Target: ".CodBi_Fotocropper_Foto",
    AspectRatio: "4/3",
  });
}
