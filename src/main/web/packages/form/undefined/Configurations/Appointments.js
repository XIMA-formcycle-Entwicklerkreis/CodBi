function e() {
  window.codbi.loadConfig({
    targets: ".CodBi_NoFutureDate",
    FUNC: "Date.Min",
    Minimum: 0,
    MsgHigher: "Das Datum darf nicht in der Zukunft liegen.",
  }),
    window.codbi.loadConfigs([
      {
        targets: ".CodBi_DateFrame_1_Begin",
        FUNC: "HTML.Input.Cleave, Date.Frame",
        MaxField: ".CodBi_DateFrame_1_End",
        MsgMinInvalid: "Das Startdatum darf nicht nach dem Enddatum liegen.",
        MsgMaxInvalid: "Das Enddatum darf nicht vor dem Startdatum liegen.",
      },
      { targets: ".CodBi_DateFrame_1_End", FUNC: "HTML.Input.Cleave" },
      {
        targets: ".CodBi_DateFrame_2_Begin",
        FUNC: "Date.Frame, HTML.Input.Cleave",
        MaxField: ".CodBi_DateFrame_2_End",
        MsgMinInvalid: "Das Startdatum darf nicht nach dem Enddatum liegen.",
        MsgMaxInvalid: "Das Enddatum darf nicht vor dem Startdatum liegen.",
      },
      { targets: ".CodBi_DateFrame_2_End", FUNC: "HTML.Input.Cleave" },
      {
        targets: ".CodBi_DateFrame_3_Begin",
        FUNC: "Date.Frame, HTML.Input.Cleave",
        MaxField: ".CodBi_DateFrame_3_End",
        MsgMinInvalid: "Das Startdatum darf nicht nach dem Enddatum liegen.",
        MsgMaxInvalid: "Das Enddatum darf nicht vor dem Startdatum liegen.",
      },
      { targets: ".CodBi_DateFrame_3_End", FUNC: "HTML.Input.Cleave" },
      {
        targets: ".CodBi_DateFrame_4_Begin",
        FUNC: "Date.Frame, HTML.Input.Cleave",
        MaxField: ".CodBi_DateFrame_4_End",
        MsgMinInvalid: "Das Startdatum darf nicht nach dem Enddatum liegen.",
        MsgMaxInvalid: "Das Enddatum darf nicht vor dem Startdatum liegen.",
      },
      { targets: ".CodBi_DateFrame_4_End", FUNC: "HTML.Input.Cleave" },
      {
        targets: ".CodBi_DateFrame_5_Begin",
        FUNC: "Date.Frame, HTML.Input.Cleave",
        MaxField: ".CodBi_DateFrame_5_End",
        MsgMinInvalid: "Das Startdatum darf nicht nach dem Enddatum liegen.",
        MsgMaxInvalid: "Das Enddatum darf nicht vor dem Startdatum liegen.",
      },
      { targets: ".CodBi_DateFrame_5_End", FUNC: "HTML.Input.Cleave" },
    ]),
    window.codbi.loadConfigs([
      {
        targets: ".CodBi_TimeFrame_1_Begin",
        FUNC: "HTML.Input.Cleave, Time.Frame",
        MaxField: ".CodBi_TimeFrame_1_End",
        MsgMinInvalid: "Die Startzeit darf nicht nach oder gleich der Endzeit sein.",
        MsgMaxInvalid: "Die Endzeit darf nicht vor oder gleich der Anfangszeit sein.",
        config: `^${JSON.stringify({ time: !0, timePattern: ["h", "m"] })
          .replace("{", "<")
          .replace("}", ">")}`,
      },
      {
        targets: ".CodBi_TimeFrame_1_End",
        FUNC: "HTML.Input.Cleave",
        config: `^${JSON.stringify({ time: !0, timePattern: ["h", "m"] })
          .replace("{", "<")
          .replace("}", ">")}`,
      },
      {
        targets: ".CodBi_TimeFrame_2_Begin",
        FUNC: "Time.Frame, HTML.Input.Cleave",
        MaxField: ".CodBi_TimeFrame_2_End",
        MsgMinInvalid: "Die Startzeit darf nicht nach oder gleich der Endzeit sein.",
        MsgMaxInvalid: "Die Endzeit darf nicht vor oder gleich der Anfangszeit sein.",
        config: `^${JSON.stringify({ time: !0, timePattern: ["h", "m"] })
          .replace("{", "<")
          .replace("}", ">")}`,
      },
      {
        targets: ".CodBi_TimeFrame_2_End",
        FUNC: "HTML.Input.Cleave",
        config: `^${JSON.stringify({ time: !0, timePattern: ["h", "m"] })
          .replace("{", "<")
          .replace("}", ">")}`,
      },
      {
        targets: ".CodBi_TimeFrame_3_Begin",
        FUNC: "Time.Frame, HTML.Input.Cleave",
        MaxField: ".CodBi_TimeFrame_3_End",
        MsgMinInvalid: "Die Startzeit darf nicht nach oder gleich der Endzeit sein.",
        MsgMaxInvalid: "Die Endzeit darf nicht vor oder gleich der Anfangszeit sein.",
        config: `^${JSON.stringify({ time: !0, timePattern: ["h", "m"] })
          .replace("{", "<")
          .replace("}", ">")}`,
      },
      {
        targets: ".CodBi_TimeFrame_3_End",
        FUNC: "HTML.Input.Cleave",
        config: `^${JSON.stringify({ time: !0, timePattern: ["h", "m"] })
          .replace("{", "<")
          .replace("}", ">")}`,
      },
      {
        targets: ".CodBi_TimeFrame_4_Begin",
        FUNC: "Time.Frame, HTML.Input.Cleave",
        MaxField: ".CodBi_TimeFrame_4_End",
        EqualityPermitted: !1,
        MsgMinInvalid: "Die Startzeit darf nicht nach oder gleich der Endzeit sein.",
        MsgMaxInvalid: "Die Endzeit darf nicht vor oder gleich der Anfangszeit sein.",
        config: `^${JSON.stringify({ time: !0, timePattern: ["h", "m"] })
          .replace("{", "<")
          .replace("}", ">")}`,
      },
      {
        targets: ".CodBi_TimeFrame_4_End",
        FUNC: "HTML.Input.Cleave",
        config: `^${JSON.stringify({ time: !0, timePattern: ["h", "m"] })
          .replace("{", "<")
          .replace("}", ">")}`,
      },
      {
        targets: ".CodBi_TimeFrame_5_Begin",
        FUNC: "Time.Frame,HTML.Input.Cleave",
        MaxField: ".CodBi_TimeFrame_5_End",
        EqualityPermitted: !1,
        MsgMinInvalid: "Die Startzeit darf nicht nach oder gleich der Endzeit sein.",
        MsgMaxInvalid: "Die Endzeit darf nicht vor oder gleich der Anfangszeit sein.",
        config: `^${JSON.stringify({ time: !0, timePattern: ["h", "m"] })
          .replace("{", "<")
          .replace("}", ">")}`,
      },
      {
        targets: ".CodBi_TimeFrame_5_End",
        FUNC: "HTML.Input.Cleave",
        config: `^${JSON.stringify({ time: !0, timePattern: ["h", "m"] })
          .replace("{", "<")
          .replace("}", ">")}`,
      },
    ]),
    window.codbi.loadConfig({
      targets: ".CodBi_Holidays_Listing",
      FUNC: "HTML.Select.Injection",
      Values: "{ Date.Holidays > { V > CodBi_Holidays_States }; this_year ; this_year + 1 }",
      ReClean: "TRUE",
    });
}
e();
export { e as loadConfig };
