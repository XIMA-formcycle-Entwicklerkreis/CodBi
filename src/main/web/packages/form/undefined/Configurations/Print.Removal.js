function e() {
  window.codbi.loadConfigs([
    { targets: ".CodBi_Print_Remove_Tagged", FUNC: "Print.Remove" },
    { targets: ".CodBi_Print_Remove_Parent", FUNC: "Print.Remove", ParentalLevel: 1 },
    { targets: ".CodBi_Print_Remove_PrintOnly", FUNC: "Print.Remove", Invert: "TRUE" },
  ]);
}
e();
export { e as loadConfig };
