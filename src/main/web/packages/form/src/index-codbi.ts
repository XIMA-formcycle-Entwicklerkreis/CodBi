// The main JavaScript for the code library
import { getJQuery } from "@de-xima/fc-form-renderer";
import { onDocumentReady } from "./js/code-library.js";
import { createCodbiGlobal } from "./js/global-scope.js";

console.log(
  "%c  ____          _ ____  _ \n" +
    " / ___|___   __| | __ )(_)\n" +
    "| |   / _ \\ / _` |  _ \\| |\n" +
    "| |__| (_) | (_| | |_) | |\n" +
    " \\____\\___/ \\__,_|____/|_|\n" +
    "%c Code Library for FORMCYCLE\n" +
    " v1.0.0",
  "color:#4A90D9;font-weight:bold;font-size:12px;font-family:monospace",
  "color:#8896A7;font-size:11px",
);

window.codbi = createCodbiGlobal();

getJQuery()(onDocumentReady);
