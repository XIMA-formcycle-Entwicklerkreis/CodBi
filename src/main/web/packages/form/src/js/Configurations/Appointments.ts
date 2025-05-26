/**
 * Registers standard configurations specific to appointment arrangements.
 *
 * CSS-Classes:
 * - **CodBi_DateFrame_1_Begin & CodBi_DateFrame_1_End ( 1 to 5 )**
 *  The {@link HTMLInputElement }s tagged with these classes will be configured to not allow entering a date
 *  in the tagged {@link HTMLInputElement } that is higher than the one in the {@link HTMLInputElement } the
 *  CSS-Selector "MaxField" points to.
 *  Weekends and bavarian holidays for the current and next year (including katholic ones and the
 *  Augsburger Friedensfest) are disallowed.
 *
 * - **CodBi_TimeFrame_1_Begin & CodBi_TimeFrame_1_End ( 1 to 5 )**
 *  The {@link HTMLInputElement }s tagged with these classes will be configured to not allow entering a time
 *  in the tagged {@link HTMLInputElement } that is higher than the one in the {@link HTMLInputElement } the
 *  CSS-Selector "MaxField" points to.
 *  Both {@link HTMLInputElement }s are restricted to HH:MM using following {@link RegExp }:
 *  ^(0[0-9]|1[0-9]|2[0-3]):(0[0-9]|[1-5][0-9])$.
 *  Both are formatted with Cleave to permit HH:MM only. */
export function loadConfig(): void {
  // #region CodBi_DateFrame_1[-5]_...
  window.codbi.loadConfigs([
    {
      targets: ".CodBi_DateFrame_1_Begin",
      FUNC: "Date.Frame, HTML.Input.Cleave",
      MaxField: ".CodBi_DateFrame_1_End",
      MsgMinInvalid: "Das Startdatum darf nicht nach dem Enddatum liegen.",
      MsgMaxInvalid: "Das Enddatum darf nicht vor dem Startdatum liegen.",
      List: "{ Date.Holidays > this_year + 1; this_year ; BY ; katholisch ; Friedensfest }",
    },
    {
      targets: ".CodBi_DateFrame_1_End",
      FUNC: "HTML.Input.Cleave",
      List: "{ Date.Holidays > this_year + 1; this_year ; BY ; katholisch ; Friedensfest }",
    },
    {
      targets: ".CodBi_DateFrame_2_Begin",
      FUNC: "Date.Frame, HTML.Input.Cleave",
      MaxField: ".CodBi_DateFrame_2_End",
      MsgMinInvalid: "Das Startdatum darf nicht nach dem Enddatum liegen.",
      MsgMaxInvalid: "Das Enddatum darf nicht vor dem Startdatum liegen.",
      List: "{ Date.Holidays > this_year + 1; this_year ; BY ; katholisch ; Friedensfest }",
    },
    {
      targets: ".CodBi_DateFrame_2_End",
      FUNC: "HTML.Input.Cleave",
      List: "{ Date.Holidays > this_year + 1; this_year ; BY ; katholisch ; Friedensfest }",
    },
    {
      targets: ".CodBi_DateFrame_3_Begin",
      FUNC: "Date.Frame, HTML.Input.Cleave",
      MaxField: ".CodBi_DateFrame_3_End",
      MsgMinInvalid: "Das Startdatum darf nicht nach dem Enddatum liegen.",
      MsgMaxInvalid: "Das Enddatum darf nicht vor dem Startdatum liegen.",
      List: "{ Date.Holidays > this_year + 1; this_year ; BY ; katholisch ; Friedensfest }",
    },
    {
      targets: ".CodBi_DateFrame_3_End",
      FUNC: "HTML.Input.Cleave",
      List: "{ Date.Holidays > this_year + 1; this_year ; BY ; katholisch ; Friedensfest }",
    },
    {
      targets: ".CodBi_DateFrame_4_Begin",
      FUNC: "Date.Frame, HTML.Input.Cleave",
      MaxField: ".CodBi_DateFrame_4_End",
      MsgMinInvalid: "Das Startdatum darf nicht nach dem Enddatum liegen.",
      MsgMaxInvalid: "Das Enddatum darf nicht vor dem Startdatum liegen.",
      List: "{ Date.Holidays > this_year + 1; this_year ; BY ; katholisch ; Friedensfest }",
    },
    {
      targets: ".CodBi_DateFrame_4_End",
      FUNC: "HTML.Input.Cleave",
      List: "{ Date.Holidays > this_year + 1; this_year ; BY ; katholisch ; Friedensfest }",
    },
    {
      targets: ".CodBi_DateFrame_5_Begin",
      FUNC: "Date.Frame, HTML.Input.Cleave",
      MaxField: ".CodBi_DateFrame_5_End",
      MsgMinInvalid: "Das Startdatum darf nicht nach dem Enddatum liegen.",
      MsgMaxInvalid: "Das Enddatum darf nicht vor dem Startdatum liegen.",
      List: "{ Date.Holidays > this_year + 1; this_year ; BY ; katholisch ; Friedensfest }",
    },
    {
      targets: ".CodBi_DateFrame_5_End",
      FUNC: "HTML.Input.Cleave",
      List: "{ Date.Holidays > this_year + 1; this_year ; BY ; katholisch ; Friedensfest }",
    },
  ]);
  // #endregion CodBi_DateFrame_1_...
  // #region CodBi_TimeFrame_1_...
  window.codbi.loadConfigs([
    {
      targets: ".CodBi_TimeFrame_1_Begin",
      FUNC: "Time.Frame, HTML.Input.REGEX, HTML.Input.Cleave",
      MaxField: ".CodBi_TimeFrame_1_End",
      MsgMinInvalid: "Die Startzeit darf nicht nach der Endzeit sein.",
      MsgMaxInvalid: "Die Endzeit darf nicht vor der Anfangszeit sein.",
      Expression: "^(0[0-9]|1[0-9]|2[0-3]):(0[0-9]|[1-5][0-9])$",
      ExposeExpression: "TRUE",
      ErrorPrefix:
        'Die Angabe muss eine gültige Zeitangabe mit führenden Nullen, wenn nötig, enthalten wie z.B. 11:05 "',
      cbErrorPostfix: '".',
      config: `^${JSON.stringify({
        time: true,
        timePattern: ["h", "m"],
      })
        .replace("{", "<")
        .replace("}", ">")}`,
    },
    {
      targets: ".CodBi_TimeFrame_1_End",
      FUNC: "HTML.Input.REGEX, HTML.Input.Cleave",
      Expression: "^(0[0-9]|1[0-9]|2[0-3]):(0[0-9]|[1-5][0-9])$",
      ExposeExpression: "TRUE",
      ErrorPrefix:
        'Die Angabe muss eine gültige Zeitangabe mit führenden Nullen, wenn nötig, enthalten wie z.B. 11:05 "',
      cbErrorPostfix: '".',
      config: `^${JSON.stringify({
        time: true,
        timePattern: ["h", "m"],
      })
        .replace("{", "<")
        .replace("}", ">")}`,
    },
    {
      targets: ".CodBi_TimeFrame_2_Begin",
      FUNC: "Time.Frame, HTML.Input.REGEX, HTML.Input.Cleave",
      MaxField: ".CodBi_TimeFrame_2_End",
      MsgMinInvalid: "Die Startzeit darf nicht nach der Endzeit sein.",
      MsgMaxInvalid: "Die Endzeit darf nicht vor der Anfangszeit sein.",
      Expression: "^(0[0-9]|1[0-9]|2[0-3]):(0[0-9]|[1-5][0-9])$",
      ExposeExpression: "TRUE",
      ErrorPrefix:
        'Die Angabe muss eine gültige Zeitangabe mit führenden Nullen, wenn nötig, enthalten wie z.B. 11:05 "',
      cbErrorPostfix: '".',
      config: `^${JSON.stringify({
        time: true,
        timePattern: ["h", "m"],
      })
        .replace("{", "<")
        .replace("}", ">")}`,
    },
    {
      targets: ".CodBi_TimeFrame_2_End",
      FUNC: "HTML.Input.REGEX, HTML.Input.Cleave",
      Expression: "^(0[0-9]|1[0-9]|2[0-3]):(0[0-9]|[1-5][0-9])$",
      ExposeExpression: "TRUE",
      ErrorPrefix:
        'Die Angabe muss eine gültige Zeitangabe mit führenden Nullen, wenn nötig, enthalten wie z.B. 11:05 "',
      ErrorPostfix: '".',
      config: `^${JSON.stringify({
        time: true,
        timePattern: ["h", "m"],
      })
        .replace("{", "<")
        .replace("}", ">")}`,
    },
    {
      targets: ".CodBi_TimeFrame_3_Begin",
      FUNC: "Time.Frame, HTML.Input.REGEX, HTML.Input.Cleave",
      MaxField: ".CodBi_TimeFrame_3_End",
      MsgMinInvalid: "Die Startzeit darf nicht nach der Endzeit sein.",
      MsgMaxInvalid: "Die Endzeit darf nicht vor der Anfangszeit sein.",
      Expression: "^(0[0-9]|1[0-9]|2[0-3]):(0[0-9]|[1-5][0-9])$",
      ExposeExpression: "TRUE",
      ErrorPrefix:
        'Die Angabe muss eine gültige Zeitangabe mit führenden Nullen, wenn nötig, enthalten wie z.B. 11:05 "',
      ErrorPostfix: '".',
      config: `^${JSON.stringify({
        time: true,
        timePattern: ["h", "m"],
      })
        .replace("{", "<")
        .replace("}", ">")}`,
    },
    {
      targets: ".CodBi_TimeFrame_3_End, HTML.Input.Cleave",
      FUNC: "HTML.Input.REGEX",
      Expression: "^(0[0-9]|1[0-9]|2[0-3]):(0[0-9]|[1-5][0-9])$",
      ExposeExpression: "TRUE",
      ErrorPrefix:
        'Die Angabe muss eine gültige Zeitangabe mit führenden Nullen, wenn nötig, enthalten wie z.B. 11:05 "',
      ErrorPostfix: '".',
      config: `^${JSON.stringify({
        time: true,
        timePattern: ["h", "m"],
      })
        .replace("{", "<")
        .replace("}", ">")}`,
    },
    {
      targets: ".CodBi_TimeFrame_4_Begin",
      FUNC: "Time.Frame, HTML.Input.REGEX, HTML.Input.Cleave",
      MaxField: ".CodBi_TimeFrame_4_End",
      MsgMinInvalid: "Die Startzeit darf nicht nach der Endzeit sein.",
      MsgMaxInvalid: "Die Endzeit darf nicht vor der Anfangszeit sein.",
      Expression: "^(0[0-9]|1[0-9]|2[0-3]):(0[0-9]|[1-5][0-9])$",
      ExposeExpression: "TRUE",
      ErrorPrefix:
        'Die Angabe muss eine gültige Zeitangabe mit führenden Nullen, wenn nötig, enthalten wie z.B. 11:05 "',
      ErrorPostfix: '".',
      config: `^${JSON.stringify({
        time: true,
        timePattern: ["h", "m"],
      })
        .replace("{", "<")
        .replace("}", ">")}`,
    },
    {
      targets: ".CodBi_TimeFrame_4_End",
      FUNC: "HTML.Input.REGEX, HTML.Input.Cleave",
      Expression: "^(0[0-9]|1[0-9]|2[0-3]):(0[0-9]|[1-5][0-9])$",
      ExposeExpression: "TRUE",
      ErrorPrefix:
        'Die Angabe muss eine gültige Zeitangabe mit führenden Nullen, wenn nötig, enthalten wie z.B. 11:05 "',
      ErrorPostfix: '".',
      config: `^${JSON.stringify({
        time: true,
        timePattern: ["h", "m"],
      })
        .replace("{", "<")
        .replace("}", ">")}`,
    },
    {
      targets: ".CodBi_TimeFrame_5_Begin",
      FUNC: "Time.Frame, HTML.Input.REGEX, HTML.Input.Cleave",
      MaxField: ".CodBi_TimeFrame_5_End",
      MsgMinInvalid: "Die Startzeit darf nicht nach der Endzeit sein.",
      MsgMaxInvalid: "Die Endzeit darf nicht vor der Anfangszeit sein.",
      Expression: "^(0[0-9]|1[0-9]|2[0-3]):(0[0-9]|[1-5][0-9])$",
      ExposeExpression: "TRUE",
      ErrorPrefix:
        'Die Angabe muss eine gültige Zeitangabe mit führenden Nullen, wenn nötig, enthalten wie z.B. 11:05 "',
      ErrorPostfix: '".',
      config: `^${JSON.stringify({
        time: true,
        timePattern: ["h", "m"],
      })
        .replace("{", "<")
        .replace("}", ">")}`,
    },
    {
      targets: ".CodBi_TimeFrame_5_End",
      FUNC: "HTML.Input.REGEX, HTML.Input.Cleave",
      Expression: "^(0[0-9]|1[0-9]|2[0-3]):(0[0-9]|[1-5][0-9])$",
      ExposeExpression: "TRUE",
      ErrorPrefix:
        'Die Angabe muss eine gültige Zeitangabe mit führenden Nullen, wenn nötig, enthalten wie z.B. 11:05 "',
      ErrorPostfix: '".',
      config: `^${JSON.stringify({
        time: true,
        timePattern: ["h", "m"],
      })
        .replace("{", "<")
        .replace("}", ">")}`,
    },
  ]);
  // #endregion CodBi_TimeFrame_1[-5]_...
}
