// The main JavaScript for the code library
import { getJQuery } from "@de-xima/fc-form-renderer";
import { onDocumentReady } from "./js/code-library.js";
import { createCodbiGlobal } from "./js/global-scope.js";

console.log(
  "%c   ___         _  ___  _ \n" +
    "  / __|___   _| || _ )(_)\n" +
    " | (_ / _ \\/ _` || _ \\| |\n" +
    "  \\___\\___/\\__,_||___/|_|\n" +
    "%cCode Library v1 for XIMA FORMCYCLE\n",
  "color:#4A90D9;font-weight:bold;font-size:14px;font-family:monospace;line-height:1.3;",
  "color:#8896A7;font-size:11px;font-family:monospace;line-height:1.3;",
);

window.codbi = createCodbiGlobal();

getJQuery()(onDocumentReady);
