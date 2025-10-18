/**
 * Registers standard configurations specific to appointment arrangements.
 *
 * CSS-Classes:
 * - **CodBi_DateFrame_1_Begin & CodBi_DateFrame_1_End ( 1 to 5 )**
 *  The {@link HTMLInputElement }s tagged with these classes will be configured to not allow entering a date
 *  in the tagged {@link HTMLInputElement } that is higher than the one in the {@link HTMLInputElement } the
 *  CSS-Selector "MaxField" points to.
 *
 * - **CodBi_TimeFrame_1_Begin & CodBi_TimeFrame_1_End ( 1 to 5 )**
 *  The {@link HTMLInputElement }s tagged with these classes will be configured to not allow entering a time
 *  in the tagged {@link HTMLInputElement } that is higher than the one in the {@link HTMLInputElement } the
 *  CSS-Selector "MaxField" points to.
 *  Both {@link HTMLInputElement }s are restricted to HH:MM using following {@link RegExp }:
 *  ^(0[0-9]|1[0-9]|2[0-3]):(0[0-9]|[1-5][0-9])$.
 *  Both are formatted with Cleave to permit HH:MM only.
 *
 * - **CodBi_Holidays_Listing**
 *   The {@link HTMLSelectElement } tagged with this class, will be filled with all holidays for the current
 *   and next years for the state specified in the global variable **CodBi_Holidays_States**. */
function loadConfig(): void {
  // #region CodBi_DateFrame_1[-5]_...
  window.codbi.loadConfigs([
    {
      targets: ".CodBi_DateFrame_1_Begin",
      FUNC: "HTML.Input.Cleave, Date.Frame",
      MaxField: ".CodBi_DateFrame_1_End",
      MsgMinInvalid: "Das Startdatum darf nicht nach dem Enddatum liegen.",
      MsgMaxInvalid: "Das Enddatum darf nicht vor dem Startdatum liegen.",
    },
    {
      targets: ".CodBi_DateFrame_1_End",
      FUNC: "HTML.Input.Cleave",
    },
    {
      targets: ".CodBi_DateFrame_2_Begin",
      FUNC: "Date.Frame, HTML.Input.Cleave",
      MaxField: ".CodBi_DateFrame_2_End",
      MsgMinInvalid: "Das Startdatum darf nicht nach dem Enddatum liegen.",
      MsgMaxInvalid: "Das Enddatum darf nicht vor dem Startdatum liegen.",
    },
    {
      targets: ".CodBi_DateFrame_2_End",
      FUNC: "HTML.Input.Cleave",
    },
    {
      targets: ".CodBi_DateFrame_3_Begin",
      FUNC: "Date.Frame, HTML.Input.Cleave",
      MaxField: ".CodBi_DateFrame_3_End",
      MsgMinInvalid: "Das Startdatum darf nicht nach dem Enddatum liegen.",
      MsgMaxInvalid: "Das Enddatum darf nicht vor dem Startdatum liegen.",
    },
    {
      targets: ".CodBi_DateFrame_3_End",
      FUNC: "HTML.Input.Cleave",
    },
    {
      targets: ".CodBi_DateFrame_4_Begin",
      FUNC: "Date.Frame, HTML.Input.Cleave",
      MaxField: ".CodBi_DateFrame_4_End",
      MsgMinInvalid: "Das Startdatum darf nicht nach dem Enddatum liegen.",
      MsgMaxInvalid: "Das Enddatum darf nicht vor dem Startdatum liegen.",
    },
    {
      targets: ".CodBi_DateFrame_4_End",
      FUNC: "HTML.Input.Cleave",
    },
    {
      targets: ".CodBi_DateFrame_5_Begin",
      FUNC: "Date.Frame, HTML.Input.Cleave",
      MaxField: ".CodBi_DateFrame_5_End",
      MsgMinInvalid: "Das Startdatum darf nicht nach dem Enddatum liegen.",
      MsgMaxInvalid: "Das Enddatum darf nicht vor dem Startdatum liegen.",
    },
    {
      targets: ".CodBi_DateFrame_5_End",
      FUNC: "HTML.Input.Cleave",
    },
  ]);
  // #endregion CodBi_DateFrame_1_...
  // #region CodBi_TimeFrame_1_...
  window.codbi.loadConfigs([
    {
      targets: ".CodBi_TimeFrame_1_Begin",
      FUNC: "HTML.Input.Cleave, Time.Frame",
      MaxField: ".CodBi_TimeFrame_1_End",
      MsgMinInvalid: "Die Startzeit darf nicht nach oder gleich der Endzeit sein.",
      MsgMaxInvalid: "Die Endzeit darf nicht vor oder gleich der Anfangszeit sein.",
      config: `^${JSON.stringify({
        time: true,
        timePattern: ["h", "m"],
      })
        .replace("{", "<")
        .replace("}", ">")}`,
    },
    {
      targets: ".CodBi_TimeFrame_1_End",
      FUNC: "HTML.Input.Cleave",
      config: `^${JSON.stringify({
        time: true,
        timePattern: ["h", "m"],
      })
        .replace("{", "<")
        .replace("}", ">")}`,
    },
    {
      targets: ".CodBi_TimeFrame_2_Begin",
      FUNC: "Time.Frame, HTML.Input.Cleave",
      MaxField: ".CodBi_TimeFrame_2_End",
      MsgMinInvalid: "Die Startzeit darf nicht nach oder gleich der Endzeit sein.",
      MsgMaxInvalid: "Die Endzeit darf nicht vor oder gleich der Anfangszeit sein.",
      config: `^${JSON.stringify({
        time: true,
        timePattern: ["h", "m"],
      })
        .replace("{", "<")
        .replace("}", ">")}`,
    },
    {
      targets: ".CodBi_TimeFrame_2_End",
      FUNC: "HTML.Input.Cleave",
      config: `^${JSON.stringify({
        time: true,
        timePattern: ["h", "m"],
      })
        .replace("{", "<")
        .replace("}", ">")}`,
    },
    {
      targets: ".CodBi_TimeFrame_3_Begin",
      FUNC: "Time.Frame, HTML.Input.Cleave",
      MaxField: ".CodBi_TimeFrame_3_End",
      MsgMinInvalid: "Die Startzeit darf nicht nach oder gleich der Endzeit sein.",
      MsgMaxInvalid: "Die Endzeit darf nicht vor oder gleich der Anfangszeit sein.",
      config: `^${JSON.stringify({
        time: true,
        timePattern: ["h", "m"],
      })
        .replace("{", "<")
        .replace("}", ">")}`,
    },
    {
      targets: ".CodBi_TimeFrame_3_End",
      FUNC: "HTML.Input.Cleave",
      config: `^${JSON.stringify({
        time: true,
        timePattern: ["h", "m"],
      })
        .replace("{", "<")
        .replace("}", ">")}`,
    },
    {
      targets: ".CodBi_TimeFrame_4_Begin",
      FUNC: "Time.Frame, HTML.Input.Cleave",
      MaxField: ".CodBi_TimeFrame_4_End",
      EqualityPermitted: false,
      MsgMinInvalid: "Die Startzeit darf nicht nach oder gleich der Endzeit sein.",
      MsgMaxInvalid: "Die Endzeit darf nicht vor oder gleich der Anfangszeit sein.",
      config: `^${JSON.stringify({
        time: true,
        timePattern: ["h", "m"],
      })
        .replace("{", "<")
        .replace("}", ">")}`,
    },
    {
      targets: ".CodBi_TimeFrame_4_End",
      FUNC: "HTML.Input.Cleave",
      config: `^${JSON.stringify({
        time: true,
        timePattern: ["h", "m"],
      })
        .replace("{", "<")
        .replace("}", ">")}`,
    },
    {
      targets: ".CodBi_TimeFrame_5_Begin",
      FUNC: "Time.Frame,HTML.Input.Cleave",
      MaxField: ".CodBi_TimeFrame_5_End",
      EqualityPermitted: false,
      MsgMinInvalid: "Die Startzeit darf nicht nach oder gleich der Endzeit sein.",
      MsgMaxInvalid: "Die Endzeit darf nicht vor oder gleich der Anfangszeit sein.",
      config: `^${JSON.stringify({
        time: true,
        timePattern: ["h", "m"],
      })
        .replace("{", "<")
        .replace("}", ">")}`,
    },
    {
      targets: ".CodBi_TimeFrame_5_End",
      FUNC: "HTML.Input.Cleave",
      config: `^${JSON.stringify({
        time: true,
        timePattern: ["h", "m"],
      })
        .replace("{", "<")
        .replace("}", ">")}`,
    },
  ]);
  // #endregion CodBi_TimeFrame_1[-5]_...
  // #region H
  // #region CodBi_BayVIS_Behoerde
  window.codbi.loadConfig({
    targets: ".CodBi_Holidays_Listing",
    FUNC: "HTML.Select.Injection",
    Values: "{ Date.Holidays > { V > CodBi_Holidays_States }; this_year ; this_year + 1 }",
    ReClean: "TRUE",
  });
}

loadConfig();
