// The main JavaScript for the code library
import { getJQuery } from "@de-xima/fc-form-renderer";
import { announceCodbiBanner } from "./js/banner.js";
import { onDocumentReady } from "./js/code-library.js";
import { createCodbiGlobal } from "./js/global-scope.js";

// Printed once per top-level page — NOT once per designer preview iframe (each of those loads this bundle).
announceCodbiBanner();

window.codbi = createCodbiGlobal();

getJQuery()(onDocumentReady);
