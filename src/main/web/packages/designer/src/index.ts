import { registerCustomElements } from "./js/register-customElements.js";
import { enableCodbiElementMarkers } from "./js/CodbiElementMarkers.js";

import { registerButtonActionTranslations } from "./js/register-custom-translations.js";
import { registerCustomFormCategories } from "./js/register-custom-form-categories.js";
import { registerCustomFormProperties } from "./js/register-custom-form-properties.js";
import { registerCustomMirrorProperties } from "./js/register-custom-mirror-properties.js";

registerButtonActionTranslations();
registerCustomFormCategories();
registerCustomFormProperties();
registerCustomMirrorProperties();
registerCustomElements();
// Paints the CodBi overlays (Mirror badges) when the "mark CodBi elements" mode is on (ALT+V).
enableCodbiElementMarkers();
