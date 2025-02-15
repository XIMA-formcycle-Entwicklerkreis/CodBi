// The main JavaScript for the code library

import { getJQuery } from "@de-xima/fc-form-renderer";

import { onDocumentReady } from "./js/code-library.js";
import { createCodbiGlobal } from "./js/global-scope.js";

window.codbi = createCodbiGlobal();

getJQuery()(onDocumentReady);
