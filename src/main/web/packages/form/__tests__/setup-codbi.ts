import { createCodbiGlobal } from "../src/js/global-scope.js";

// Ensure a codbi script tag exists (required by createCodbiGlobal)
const codbiScript = document.createElement("script");
codbiScript.src = "https://example.com/codbi.js";
document.head.appendChild(codbiScript);

// Initialize window.codbi so that EP/Functionality module-scope registration calls succeed
(window as unknown as { codbi: ReturnType<typeof createCodbiGlobal> }).codbi = createCodbiGlobal();
