# CodBi Functionalities

Rules for each CodBi functionality (data-cb-func), their parameters, and application conditions.

## GENERIC RULE for all CSS-Selector parameters

When a parameter requires a CSS-Selector referencing another form element, ALWAYS use the target element's properties.name value prefixed with a dot '.' (e.g., '.tfInterviewBis' or '.taAddress'). NEVER use an ID selector (# prefix, e.g., '#xi-tf-interviewbis'), because element IDs are mangled in repeatable containers; only properties.name-based selectors work reliably when CodBi searches within the shared parent container.

## AI.LLAMA.CHAT

Applicable on a container element to embed an AI chat widget (requires a locally running LLAMA server via CodBi settings).

When the user asks for an AI chat / KI-Chat / chatbot, create all of the following elements:
- XContainer wrapper (fullwidth="1"). Do NOT add data-cb-func="ai.llama.chat" to the container — it goes ONLY on the chat display.
- Chat display: XTextArea (data-cb-func="ai.llama.chat", readonly, fullwidth, autosize, no label). ADD attributes: data-cb-MaxPixelSize="360000", data-cb-maxchatwindowheight="1200".
- User input: XTextArea (cssclasses=["AI_LLAMA_CHAT_Input"], fullwidth, autosize).
- Send button: XButtonList with SINGLE button (cssclasses=["AI_LLAMA_CHAT_Send"], action.page="").
- Stop button: SEPARATE XButtonList with SINGLE button (cssclasses=["AI_LLAMA_CHAT_Stop"], action.page="").
- Upload: XUpload (cssclasses=["AI_LLAMA_CHAT_Upload"], fileextension="image/*,.pdf").
- Thinking checkbox: XCheckbox (cssclasses=["AI_LLAMA_CHAT_Thinking"]).
- Internet checkbox: XCheckbox (cssclasses=["AI_LLAMA_CHAT_Internet"]).
- Location checkbox: XCheckbox (cssclasses=["AI_LLAMA_CHAT_Location"]).
- Alert checkbox: XCheckbox (cssclasses=["AI_LLAMA_CHAT_AlertOnFinish"]).
- Mail container: XContainer containing mail checkbox + mail address field.
- Mail checkbox: XCheckbox (cssclasses=["AI_LLAMA_CHAT_MailForward"]) inside the mail container.
- Mail address: XTextField (cssclasses=["AI_LLAMA_CHAT_MailAddress"], datatype="email") inside the mail container. Set hiddenif="<MailForwardCheckbox_ID>", hiddenifcomp=0 and hiddenifclear="false" as DIRECT properties.

CRITICAL — Distinguish from Form Chatbot Plugin (XIMA Chatbot): Use XNavigationBar for XIMA mentioned navigation. Use CodBi ai.llama.chat ONLY when "CodBi KI-Chat" is explicitly mentioned.

## AI.OCR

Applicable on an XUpload field to extract and return text from uploaded images or PDFs via OCR.
- Mode="print": do NOT set data-cb-Field on the upload. The receiver text field is identified by its CodBi_AI_OCR_Receiver CSS class.
- Mode="verify": set Pattern, RegExFlags, WrongFileMessage, InvalidImageText (ALL five for verify).

## Date.Frame

Applicable ONLY on the BEGIN (minimum) XTextField of type 'date' when there is a second related end date field. The end field is referenced via the 'MaxField' parameter. Do NOT put this functionality on the end date element.

## Date.Min

Applicable on a XTextField of type 'date' to enforce a minimum allowed date (e.g. prevent past dates).

## Date.NoWeekends

Applicable on a XTextField of type 'date' to disallow weekend dates.

## Date.Today

Supports arithmetic directly — do NOT wrap it in Date.Arithmetic. Use "{ Date.Today > +1d }" for tomorrow, "{ Date.Today > -1d }" for yesterday. Arithmetic: +N d/m/y (add), -N d/m/y (subtract).

## Date.FromString

Turns a date string into a Date object. Use for any prompt about converting/parsing a date string. Example: "{ Date.FromString > 01.12.1978 }". Optional second param sets the format.

## Form.Navigator

Applicable on forms with 2 or more pages (multi-step forms); adds a navigation progress bar or breadcrumb tabs. Do NOT apply to single-page forms.

CRITICAL — Form.Navigator AUTO-GENERATES navigation buttons. Create a SEPARATE XContainer (div) for the nav bar — do NOT put data-cb-func=form.navigator on XPage elements. XPage is not a div and the functionality requires HTMLDivElement. Add the container to the first page's elements array.

CRITICAL — Distinguish from XNavigationBar plugin: Use data-cb-func=form.navigator ONLY when the prompt mentions "CodBi Navbar" or "CodBi Navigation". When the prompt mentions "XIMA Navigationsleiste", "XIMA navbar", "FORMCYCLE navbar", "Navigationsleiste", "Progress Bar", "FC-Navbar", or "formcycle navigation bar", use className="XNavigationBar" instead.

## HTML.CSS

Applicable on any element to inject custom CSS text into the page (with optional placeholder replacements).

## HTML.Input.Cleave

Applicable on a XTextField to apply input masking/formatting (credit card, phone, IBAN, date, etc.) via Cleave.js.

## HTML.Input.REGEX

Applicable on a XTextField to validate, reformat, or RESTRICT the typed value against a regular expression pattern.

CRITICAL — USE THIS FUNCTIONALITY whenever the user asks to disallow/block/prevent certain characters from being typed into an input field (input restriction / character blacklist). Examples: "darf die Zeichen e$% nicht enthalten", "soll die Eingabe von e, $ und % verhindern", "does not allow the input of the characters e$%", "block the characters ...". This is the ONLY CodBi functionality for blocking characters — do NOT use HTML.Input.Cleave or any CSS class for this.

To BLOCK characters, express the forbidden set as a NEGATED character class `[^…]` (matches any character EXCEPT the listed ones) and set the parameters on the XTextField via the attributes array:
- data-cb-func = "HTML.Input.REGEX"
- data-cb-keyexpression = the per-keystroke pattern every typed character must comply with → negated class, e.g. "[^e$%]" (prevents typing e, $ and %)
- data-cb-expression = the whole-value pattern the final value must comply with → "^[^e$%]*$" (the complete value may contain any characters except e, $ and %)
- data-cb-flags = (optional) regex flags, e.g. "g"

Example — an input field that must not allow the characters e, $ and %:
"attributes": [{"text":"data-cb-func","value":"HTML.Input.REGEX"},{"text":"data-cb-keyexpression","value":"[^e$%]"},{"text":"data-cb-expression","value":"^[^e$%]*$"}]

CRITICAL — Inside a character class `$` is a LITERAL dollar sign (NOT the end-of-string anchor) and `.` is a literal dot, so `[^e$%]` really blocks e, $ and %. Regex metacharacters that must be blocked literally (e.g. `]`, `\`, `^` inside a class) still need to be escaped.

## HTML.Input.TinyMCE

Applicable on a XTextArea to turn it into a TinyMCE rich-text (WYSIWYG) editor.

CRITICAL — USE THIS FUNCTIONALITY whenever the user asks for a "rich text editor", "WYSIWYG editor", or rich/formatted text entry for a multi-line text field (e.g. "a field to write a story / message with a rich text editor"). Turn the XTextArea into a TinyMCE editor by setting these attributes on it:
- data-cb-func = "HTML.Input.TinyMCE"
- data-cb-plugins = (optional) CSV of TinyMCE plugins to load, e.g. "advlist, autolink, lists, link, image, table, code"
- data-cb-toolbar = (optional) TinyMCE toolbar string, e.g. "undo redo | blocks | bold italic | bullist numlist | link image | code"

Example — a "story" textarea that becomes a rich text editor:
"attributes": [{"text":"data-cb-func","value":"HTML.Input.TinyMCE"},{"text":"data-cb-plugins","value":"advlist, autolink, lists, link, image, table, code"}]

## HTML.Panel

Applicable on any element to wrap it in a collapsible accordion/panel widget.

CRITICAL — Panel CSS classes ONLY work on XFieldSet (fieldset), NOT on XContainer or XContainerInvisible. A fieldset has a 'legend' property that becomes the panel header. A container has NO legend — applying a panel CSS class to a container produces a panel WITHOUT a visible title.

For containers (XContainer, XContainerInvisible) that need to be a panel, ALWAYS use data-cb-func=html.panel via the attributes array with data-cb-generateheader="true" and a data-cb-autoheadertitle.

For fieldsets, use the CSS class CodBi_HTML_Panel_Standard instead — the legend provides the title.

ACCORDION BEHAVIOR — When the user asks for multiple collapsible sections where only ONE should be open at a time, create a wrapper XContainer around ALL the panels. Apply data-cb-func="html.panel.accordion" and data-cb-Accordion="<uniqueGroupName>" to the wrapper. Each inner panel gets data-cb-folded — first panel "false", all subsequent "true".

## HTML.SETAttribute

Applicable on any element to dynamically set one or more HTML attributes on it, including CSS styling via the "style" attribute.

USE THIS FUNCTIONALITY whenever the user asks to set an attribute or a visual/CSS style of an element — e.g. "set the title attribute of that input field to 'Holla die Waldfee'", "set the opacity of that input field to .5", "set the element's background color", "make the field readonly/disabled". Parameters:
- data-cb-name = the attribute to set (e.g. "title", "placeholder", "readonly", "disabled", or "style" for CSS styling)
- data-cb-toset = the value to set the attribute to (e.g. "Holla die Waldfee", "opacity: 0.5")

Example — an input field whose title attribute is set to "Holla die Waldfee":
"attributes": [{"text":"data-cb-func","value":"HTML.SETAttribute"},{"text":"data-cb-name","value":"title"},{"text":"data-cb-toset","value":"Holla die Waldfee"}]

CRITICAL — When MORE THAN ONE functionality applies to the SAME element (e.g. character blocking AND setting an attribute), combine them in ONE comma-separated data-cb-func value and set every parameter as its own data-cb-* attribute — do NOT create several data-cb-func entries or duplicate elements. Example: data-cb-func="HTML.Input.REGEX,HTML.SETAttribute" with data-cb-keyexpression, data-cb-expression, data-cb-name and data-cb-toset all set.

## HTML.Text.Injector

Applicable on any element to inject a dynamic text value into a specific property of that element. Set data-cb-replacement to the EP expression AS-IS (do NOT resolve it), data-cb-placeholder to the placeholder string verbatim, data-cb-property="innerHTML". Keep the element's rtevalue unchanged.

## HTML.Text.Mapper

Applicable on any element to map object properties to named placeholders in a text template.

## HTML.Select.Favorites

CRITICAL — When applying this functionality you MUST also add a data-cb-initialElement attribute to the XSelect's attributes array. Set its value to the value property (NOT the display text) of the FIRST option.

## JSON.SET

Applicable on a hidden field to store a JSON-serialized value derived from another element. JSON.SET fallback only on explicit user request.

## LDAP.Autocomplete.Set

Applicable on form fields that should be auto-filled from a selected LDAP directory match.

## LDAP.Autocomplete

Applicable on a text input that should autocomplete entries from an LDAP directory search.

## Matomo.Tracking

Applicable on any form to add Matomo/Piwik analytics event tracking. When the prompt says "Matomo-Tracking aktivieren" or "activate Matomo tracking" without specifying a SiteID, do NOT add Matomo.Tracking functionality via data-cb-func on any element. Instead, include {"id":"Holistic.Matomo.Tracking","targets":[]} in _codbiApplicability.applied — the server reads this and activates the standard configuration.

## Media.Image.Cropper

Applicable on an XUpload field for images; adds an interactive crop dialog before upload.

## MEDIA.INPUT.SPEECH

Applicable on a text input field to enable speech-to-text dictation via the Web Speech API.

## OpenPLZ.Autocomplete

Applicable on every XTextField (input type=text) within a group of related address fields (postal code, locality/city, street, building number).

PREFERRED — apply the OpenPLZ standard-configuration CSS classes instead of data-cb-func:
- CodBi_OpenPLZ_AC_SET_PLZ on the postal code field.
- CodBi_OpenPLZ_AC_SET_Locality on the locality/city field.
- CodBi_OpenPLZ_AC_SET_Street on the street field.
- CodBi_OpenPLZ_AC_SET_BuildingNumber on the building number field.
The server configures OpenPLZ.Autocomplete (TargetData, Country, Dependent, DependentPLZ, DependentLocality, FocusOnAutocomplete) automatically for each class.

FALLBACK (only when the CSS classes cannot be used): tag EACH address field with data-cb-func=openplz.autocomplete and set the parameters individually. For every tagged field: set TargetData to match its type (Localities, PostalCodes, or Streets), set Country. On the STREET field only: set DependentPLZ and DependentLocality. On the POSTAL CODE and LOCALITY fields: set Dependent as the CSS class selector of the corresponding field, set FocusOnAutocomplete to the street field. On the STREET field: set FocusOnAutocomplete to the building number field, if one exists.

CRITICAL — OpenPLZ.Autocomplete must be applied to ALL address fields in EVERY address group, regardless of which plugin/system they come from. Either via the CodBi_OpenPLZ_AC_SET_* CSS classes (preferred) or via data-cb-func with ALL required parameters (Country, TargetData, Dependent, FocusOnAutocomplete) set on each address field.

## Print.Remove

Applicable on any element that should be invisible when the form is printed.

## Sys.Log.Console

Applicable for debugging; logs CodBi runtime data to the browser developer console.

Sys.Log.Console does NOT need an existing form element — it is a standalone functionality. When the user asks to output/print/log/show anything to the browser console (URL content, BayVIS data, CSV, global variables, DOM elements, etc.), you MUST create a NEW **invisible XSpan** (the plain-text/HTML element of Formcycle — NEVER invent class names like "XText" or "XButton"; XTextField is an INPUT element, not plain text) and list it as a separate item in the root "items" array with EXACTLY this shape:

```
{
  "className": "XSpan",
  "properties": {
    "name": "spLog<Name>",
    "id": "xi-log-<name>",
    "rtevalue": "<short label>",
    "invisible": "1"
  },
  "attributes": [
    { "text": "data-cb-func", "value": "Sys.Log.Console" },
    { "text": "data-cb-Data", "value": "SYS.Log.Console > <what shall be logged>" }
  ]
}
```

Also add the element's name to the first page's "elements" array. The `data-cb-Data` value MUST start with the literal prefix **"SYS.Log.Console > "** followed by the text describing what shall be logged — e.g. `"SYS.Log.Console > Log the details of the planet Pluto with a saturation of .5"`. Do NOT use an element-placeholder expression as the whole value; write the descriptive log text.

## Time.Frame

Applicable ONLY on the BEGIN (minimum) XTextField of type 'time' when there is a second related end time field. The end field is referenced via the 'MaxField' parameter. Do NOT put this functionality on the end time element.

## AI DOCUMENT QA

When the user asks to upload a document and answer specific questions about its content, create an XUpload with data-cb-func="ai.llama.standard.qa" and data-cb-MaxPixelSize="180000" in its attributes. Then create one XTextField (or XTextArea for long answers) per question, each with cssclasses=["AI_LLAMA_STANDARD_QA_Question"] and a data-cb-Question attribute.

The data-cb-Question value supports <[.FieldName]> placeholders (with leading dot) that resolve to the runtime value of another field in the same container.

The upload field and all question fields should be inside an XContainer or XFieldSet wrapper. CRITICAL: data-cb-func="ai.llama.standard.qa" goes on the XUpload, NOT on the container or on the question fields.

## AI TEXT QA (ai.llama.standard.txtqa)

When the user asks to show information about a person or entity based on text values entered in input fields, apply data-cb-func="ai.llama.standard.txtqa" on the FIRST source input field. Add data-cb-useinternet="true" if internet search is needed. All other source fields get cssclasses=["AI_LLAMA_TXTQA_Source"]. The response display field gets cssclasses=["AI_LLAMA_STANDARD_TXTQA_Question"] and a data-cb-Question attribute.

The data-cb-Question value MUST include <[.FieldName]> placeholders (with leading dot) for ALL source fields.

CRITICAL — The field with data-cb-func="ai.llama.standard.txtqa" must NOT have the AI_LLAMA_STANDARD_TXTQA_Question CSS class.

ALL form elements created for this functionality MUST be inside an XContainer or XFieldSet wrapper.

## SPECIALIST RULE

When the prompt mentions a specific specialist model (e.g. "Verwende den Spezialisten XYZ" or "use the XYZ specialist") AND an AI functionality (ai.llama.chat, ai.llama.standard.qa, ai.llama.standard.txtqa) is applied, add a data-cb-Specialist attribute to that functionality's element's attributes array with the specialist name as its value.

The complete list of available functionalities with all their parameters is available at:
{{CODBI_FULL_SECTION}}
