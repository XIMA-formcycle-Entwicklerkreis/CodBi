# Whole-Form & Whole-Workflow Test Prompts

End-to-end scenario prompts for the **Form Assistant** (Form Designer → AI Assistant) and the
**Workflow Assistant** (Workflow Editor → AI Assistant). Unlike the single-element cards in
[`form-assistant-test-prompts.md`](form-assistant-test-prompts.md:1), each prompt here describes a
**complete form or workflow** so one prompt exercises many widgets / CodBi functionalities /
element placeholders / workflow triggers and nodes together — including their interaction (page
structure, field references, container nesting, loops, lanes, error handling).

Run each scenario in **German and English** — label/endpoint language is part of the check. Always
observe **both stages**: (1) the details request (`need_form_widget_details` / `need_workflow_node_details`)
and (2) the final JSON after the server supplies the schemas.

---

## 0. Shared test form & environment

Use the shared test form from the testing plan ([`form-assistant-prompt-testing-plan.md`](form-assistant-prompt-testing-plan.md:40)):
several pages, submit button `btnZwolf`, text fields `tfVorname`, `tfNachname`, `tfOrt`, `tfPLZ`,
`tfMail`, `tfAlter`, `tfDatum`, `tfUhrzeit`, textarea `tfNachricht`, select `selStadt`, checkbox
`cbNews`, upload `fdDatei`, repeatable container `divRepeat` (with `tfName`/`tfData`), and a
DataQuery `HolaQuery` configured on the server.

**Global checks for every whole-form scenario:**
- [ ] Details request lists **every** widget and functionality the prompt needs — never invented `className`s (`XText` is wrong, `XTextField` is right).
- [ ] Final JSON is valid and coherent: pages/containers reference element `name`s correctly; no orphan elements; unique `name` + `xi-…` id per element.
- [ ] All `data-cb-func` values and `data-cb-*` parameters are exactly as in [`codbi-core-api-compact.md`](../src/main/resources/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/codbi-core-api-compact.md:1).
- [ ] CSS-Selector parameters use the target element's `name` with a dot prefix (`.tfDatumEnde`), **never** `#`-IDs.
- [ ] Labels/placeholders in the prompt's language (DE prompt → German labels).

**Global checks for every whole-workflow scenario:**
- [ ] Details request lists every trigger **and** node used (incl. condition/loop/container nodes).
- [ ] Single lane → single JSON object; multiple independent lanes → array of objects; each with `taskName`, `taskDescription`, `triggerType`, `triggerParams`, `nodeType`, `nodeParams`, `endpointState`, `endpointType`.
- [ ] Child nodes inside `_childNodes` for conditions/loops; chain nodes never placed in `_childNodes`.
- [ ] `endpointState` label in the prompt's language (German prompt → `"Empfangen"`, not `"Received"`); `""` for terminal nodes (FC_RETURN / FC_DELETE_FORM_RECORD / FC_QUEUE_TASK).
- [ ] `[%fieldName%]` placeholders in SQL are **unquoted**.

---

## A. Whole-form scenarios (Form Assistant)

### FS01 — Multi-page registration form (core widgets + navigator + date logic)

**Elements covered:** XPage ×3, Form.Navigator, XHeader/XFooter, XTextField, XSelect, XCheckbox,
XAppointment, XButtonList, Date.Min, Date.NoWeekends, Date.Frame, HTML.Panel, HTML.Input.TinyMCE.

**Prompt (DE):**
> Baue aus dem bestehenden Formular ein dreiseitiges Anmeldeformular „Sprachkurs“ um: Seite 1
> „Personendaten“ mit Kopfbereich „Anmeldung“, Vorname, Nachname, ein Datumsfeld „Geburtsdatum“
> (keine Vergangenheitsdaten, keine Wochenenden), das Feld `selStadt` und das Kontrollkästchen
> `cbNews`. Seite 2 „Kurs & Termin“ mit einem Terminfinder „Beratungstermin“, einem Datumsbereich
> „Kursbeginn“/„Kursende“ (Beginn ist Mindestdatum) und einer Trennlinie. Seite 3 „Nachricht“ mit
> dem Textfeld `tfNachricht` als Rich-Text-Editor und den Buttons „Zurück“ und „Senden“. Füge eine
> Fortschrittsanzeige für das mehrseitige Formular und einen Fußbereich ein. Kapsle die
> Kursauswahl auf Seite 2 in ein aufklappbares Panel.

**Prompt (EN):**
> Rebuild the existing form into a three-page registration form "Language course": page 1
> "Personal data" with a header "Registration", first name, last name, a date field "Date of
> birth" (no past dates, no weekends), the `selStadt` select and the `cbNews` checkbox. Page 2
> "Course & appointment" with an appointment finder "Consultation", a date range
> "Course start"/"Course end" (start is the minimum date) and a separator line. Page 3 "Message"
> with the `tfNachricht` textarea as a rich-text editor and "Back" and "Submit" buttons. Add a
> progress indicator for the multi-page form and a footer. Wrap the course selection on page 2 in
> a collapsible panel.

**Verify:**
- [ ] 3 XPage elements + Form.Navigator on the 2+-page form (NOT on a single page); XHeader/XFooter present.
- [ ] Birth-date field `Geburtsdatum` (`tfDatum`): block FUTURE dates via `CodBi_NoFutureDate`; **NO** `Date.NoWeekends` and **NO** future `Date.Min` (heute/morgen) — a birth date lies in the past, so "keine Vergangenheitsdaten" is contradictory for it, and it may fall on a weekend. `Date.Min` on a birth date is valid ONLY as a PAST minimum (e.g. "at least 18 years old" → `Minimum=18, Unit=y`, no `Reverse`).
- [ ] Course date range: `Date.Frame` on the BEGIN field only with `MaxField` → `.`+end-field-name; optional future `Date.Min` (`Reverse=true`) on `Kursbeginn` only if the AI asks.
- [ ] XAppointment with `appointmentPlan`; XButtonList with `action.page = "previous"/"submit"`; XLine; XTextArea `tfNachricht` with `data-cb-func="HTML.Input.TinyMCE"` + Plugins/Toolbar.
- [ ] HTML.Panel on the course-selection container (XContainer + `data-cb-func="HTML.Panel"` + header attrs).
- [ ] All selectors dot-prefixed names, no invented classes.

**Known trap — „keine Vergangenheitsdaten, keine Wochenenden“ on `Geburtsdatum` (2026-08-17):**
Both date constraints in the prompt are **contradictory** for the birth-date field: a birth date
necessarily lies in the past ("no past dates" / Mindestdatum heute/morgen cannot apply), and it may
fall on a weekend ("no weekends" cannot apply either — people are born on weekends). The AI must NOT
group `Geburtsdatum` together with `Kursbeginn` and ask „Soll das Mindestdatum heute oder morgen
sein?“ — that question is only valid for `Kursbeginn`. Correct handling:
- `Geburtsdatum` → **no future dates**: `CodBi_NoFutureDate` (max = today); **no** `Date.NoWeekends`. `Date.Min` is legitimate ONLY as a PAST minimum (e.g. age ≥ 18 → `Minimum=18, Unit=y`, no `Reverse`); the future-minimum form (`Reverse=true`, heute/morgen) is invalid for a birth date. FS01 requests no age limit, so no `Date.Min` is applied here.
- `Kursbeginn` → future minimum (if requested): `Date.Min` with `Reverse=true` (Minimum=1, Unit=d = tomorrow); `Date.Frame` `MaxField` → `.`+end-field-name makes it the range minimum.
- `Kursende` → end of the `Date.Frame` only; never its own `Date.Min`/`Date.Max`/`Date.Frame`.
If the AI asks for a future minimum or a weekday restriction for the birth-date field, answer:
„Geburtsdatum muss in der Vergangenheit liegen und darf auch auf ein Wochenende fallen — wende nur
`CodBi_NoFutureDate` (max. heute) an; ein `Date.Min` wäre nur als Vergangenheits-Minimum (z. B.
Mindestalter 18 Jahre, `Minimum=18, Unit=y`) gültig; für `Kursbeginn` gelte `morgen` als
Mindestdatum.“

### FS02 — Citizen-service application with ELSTER/BundID + address autofill (Bürgerservice switch ON)

**Elements covered:** XFieldSet, XBsLogin, XSignature, CodBi_OpenPLZ_AC_SET_*, CodBi_LDAP_AC_*,
XUpload + Media.Image.Cropper, XCaptcha, HTML.SETAttribute, Print.Remove, Sys.Log.Console EP.

> **Run with the Bürgerservice switch ON** — canonical field IDs are then enforced (see C07/C09 in
> [`form-assistant-test-prompts.md`](form-assistant-test-prompts.md:174)).

**Prompt (DE):**
> Erstelle im Formular ein Feldset „Bürgerkonto-Daten“ (`fsBKDaten`) mit den Stammdaten Vorname,
> Nachname, Geburtsdatum, Geburtsort, PLZ, Ort, E-Mail und Telefon. Darunter ein Feldset
> `fsBKOrgDaten` für den ELSTER-Organisationslogin mit den nötigen Stammdaten. Ergänze einen
> BundID-Login-Button, ein Signaturfeld „Unterschrift“ und ein Upload-Feld für den Personalausweis
> mit Bild-Cropper und Captcha-Schutz. Die Adressfelder sollen eine Autovervollständigung aus dem
> LDAP-Verzeichnis erhalten; PLZ/Ort/Straße/Hausnummer sollen sich mit deutscher
> Autovervollständigung befüllen. Das Feld „Geburtsort“ soll beim Drucken ausgeblendet werden, und
> dem Feld „E-Mail“ einen Tooltip „Pflichtfeld“ setzen. Logge zusätzlich den KI-Text zu „Wie wird
> das Wetter morgen?“ in die Konsole.

**Prompt (EN):**
> Create a fieldset "Citizen account data" (`fsBKDaten`) in the form with the master data first
> name, last name, date of birth, place of birth, ZIP code, city, e-mail and phone. Below it a
> fieldset `fsBKOrgDaten` for the ELSTER organisation login with the required master data. Add a
> BundID login button, a signature field "Signature" and an upload field for the ID card with an
> image cropper and CAPTCHA protection. The address fields should get autocomplete from the LDAP
> directory; ZIP/city/street/house number should autofill with German autocomplete. The "Place of
> birth" field should be hidden when printing, and the "E-mail" field gets a tooltip "Required
> field". Additionally log the AI text for "How will the weather be tomorrow?" to the console.

**Verify:**
- [ ] `fsBKDaten` fieldset with the canonical IDs (`tfAntragstellerVorname`, `tfAntragstellerName`, `tfAntragstellerGeburtsdatum`, `tfAntragstellerGeburtsort`, `tfAntragstellerPLZ`, `tfAntragstellerOrt`, `tfAntragstellerEmail`, `tfAntragstellerTelefon`); `fsBKOrgDaten` with ELSTER-only fields (`tfOrgName`, `tfOrgRegisterart`, `selOrgPersTyp`, `BPK2`, `TrustLevel`, …).
- [ ] XBsLogin with `bs_auth_ref`; XSignature; XUpload with `data-cb-func="Media.Image.Cropper"`; XCaptcha.
- [ ] `CodBi_OpenPLZ_AC_SET_PLZ/Locality/Street/BuildingNumber` on the right fields; `CodBi_LDAP_AC_*` where LDAP was requested.
- [ ] `data-cb-func="Print.Remove"` on the birth-place field; `HTML.SETAttribute` (Name `title`, ToSet `Pflichtfeld`) on `tfAntragstellerEmail`.
- [ ] Invisible XSpan with `data-cb-Data="SYS.Log.Console > AI.LLAMA.STD.QA > Wie wird das Wetter morgen?; true;;;;;;"`.

### FS03 — Feedback form with AI chat, OCR and data-table (AI + media + DQ)

**Elements covered:** AI.LLAMA.CHAT + sub-classes, AI.OCR, XTextArea + TinyMCE, HTML.Input.REGEX,
JSON.SET, DQ.Table.View, Matomo.Tracking, HTML.CSS, XRating, XMap.

**Prompt (DE):**
> Erweitere das Formular um ein Feedback-Formular: ein Feld „Kundennummer“ mit Maskierung, die nur
> die Zeichen a–z erlaubt, und ein Bewertungsfeld mit 5 Sternen. Bette einen KI-Chat in einen neuen
> Container „KI-Assistent“ ein. Aus dem Upload-Feld `fdDatei` soll per OCR der Text extrahiert und
> in ein neues Feld `tfExtractedText` geschrieben werden. Das Feld `tfNachricht` bleibt ein
> Rich-Text-Editor. Füge ein verstecktes Feld hinzu, das das JSON aus `tfVorname`/`tfNachname`
> speichert, und eine Tabelle, die die Spalten Alter, Name und Details der Abfrage `HolaQuery`
> anzeigt (Details als JSON, Details nicht exportieren, mit Excel-Export). Aktiviere Matomo-Tracking
> für das Formular, füge eigenes CSS für rote Überschriften ein und plaziere eine interaktive Karte.

**Prompt (EN):**
> Extend the form into a feedback form: a "Customer number" field with masking that only allows the
> characters a–z, and a 5-star rating field. Embed an AI chat into a new container "AI assistant".
> The upload field `fdDatei` should have its text extracted via OCR into a new field
> `tfExtractedText`. The `tfNachricht` field stays a rich-text editor. Add a hidden field that
> stores the JSON from `tfVorname`/`tfNachname`, and a table showing the columns Age, Name and
> Details of the `HolaQuery` query (Details as JSON, Details not exported, with Excel export).
> Enable Matomo tracking for the form, add custom CSS for red headings and place an interactive map.

**Verify:**
- [ ] AI.LLAMA.CHAT on the new container with the `AI_LLAMA_CHAT_*` sub-elements (Input/Send/Stop/…).
- [ ] AI.OCR on `fdDatei` with `Field=".tfExtractedText"` (+ Mode required); target field `tfExtractedText` exists.
- [ ] XRating (5 stars); HTML.Input.REGEX: `data-cb-keyexpression="[^a-z]"`, `data-cb-expression="^[^a-z]*$"` (adjust to the requested rule).
- [ ] Hidden field with `data-cb-func="JSON.SET"` + expression over `tfVorname`/`tfNachname`.
- [ ] DQ.Table.View: `data-cb-columns="Alter,Name,Details"`, `data-cb-dataquery="HolaQuery"`, `jsonFlag` on Details, `excludecolumns` for Details-not-exported, Excel export enabled.
- [ ] Matomo.Tracking (`SiteID` — ask if missing), HTML.CSS with the CSS text, XMap (Leaflet).

### FS04 — Event booking with appointment finder, time frame and panels

**Elements covered:** XAppointment, XFieldSet + CodBi_HTML_Panel_Standard, CodBi_Accordion_*,
Time.Frame, XNavigationBar (NOT Form.Navigator), XLanguageSwich, XFormula, XSpacer.

**Prompt (DE):**
> Erstelle eine Event-Anmeldung: ein Feldset „Veranstaltung“ als Standard-Panel mit der Überschrift
> „Anmeldung“, ein Terminfinder „Wunschtermin“, ein Zeitbereich „Beginn“/„Ende“ (Beginn ist
> Mindestzeit) und ein berechnetes, schreibgeschütztes Feld „Gesamtpreis“. Ordne drei weitere
> Inhaltsgruppen als Akkordeon mit drei Panels an. Füge eine Navigations-/Fortschrittsleiste
> (Formcycle-Navbar), einen Sprachumschalter und einen Abstand ein.

**Prompt (EN):**
> Create an event registration: a fieldset "Event" as a standard panel titled "Registration", an
> appointment finder "Preferred date", a time range "Start"/"End" (start is the minimum time) and a
> read-only computed field "Total price". Arrange three further content groups as an accordion with
> three panels. Add a navigation/progress bar (Formcycle navbar), a language switcher and a spacer.

**Verify:**
- [ ] XFieldSet with `legend="Anmeldung"` + class `CodBi_HTML_Panel_Standard` (NOT `data-cb-func="HTML.Panel"` on a container); accordion via `CodBi_Accordion_A/B/C/D` on the three groups.
- [ ] Time.Frame on the BEGIN time field only with `MaxField` → end field (no Date.Frame).
- [ ] XAppointment with `appointmentPlan`; XFormula read-only; XNavigationBar (NOT Form.Navigator); XLanguageSwich; XSpacer.
- [ ] Panel/accordion headers carry the requested German titles.

### FS05 — Data / research form (element-placeholder heavy)

**Elements covered:** EPs — AI.LLAMA.STD.QA, OpenPLZ.Localities, OpenPLZ.Streets, OpenPLZ.TextSearch,
OpenPLZ.OrganizationalUnits, Data.CSV, Data.Join, Date.FromString, Date.Holidays, DOM.Query, F, I,
JSON.Path, LDAP.Find, Net.URL, Sorted, Unique, V.

**Prompt (DE):**
> Baue ein Recherche-Formular: Ein Textfeld „Ortsvorschläge“, das alle Orte auflistet, die mit
> „An“ beginnen (DE), ein Feld „Straßen in 91522“, ein Feld „Volltextsuche 91522 Karolinen“, ein
> Feld „Kantone der Schweiz“, ein Feld „Wetter-KI“ mit der KI-Antwort zu „Wie wird das Wetter
> morgen?“, ein Feld „CSV → Array“, ein Feld „Zwei Objekte zusammenführen“, ein Feld „String in
> Datum“, ein Feld „Feiertage 2026“, ein Feld „DOM .p1 abfragen“, ein Feld „Filter postalCode ==
> 91522“, ein Feld „erstes Element des Arrays“, ein Feld „name extrahieren“, ein Feld „LDAP
> sn=Callari“, ein Feld „URL-Inhalt laden“, ein Feld „Ortsnamen sortieren und deduplizieren“ und
> ein Feld „globale Variable USGrade“. Logge alle Ergebnisse in die Konsole.

**Prompt (EN):**
> Build a research form: a "City suggestions" field listing all localities starting with "An" (DE),
> a "Streets in 91522" field, a "Full-text search 91522 Karolinen" field, a "Swiss cantons" field,
> an "AI weather" field with the AI answer to "How will the weather be tomorrow?", a "CSV → array"
> field, a "Merge two objects" field, a "String to date" field, a "Holidays 2026" field, a
> "Query DOM .p1" field, a "Filter postalCode == 91522" field, a "First array element" field, an
> "Extract name" field, a "LDAP sn=Callari" field, a "Load URL content" field, a "Sort and
> deduplicate city names" field and a "Global variable USGrade" field. Log all results to the
> console.

**Verify:**
- [ ] Every EP id verbatim, correct param order and trailing `;`: `{ OpenPLZ.Localities > de ; ^An }`, `{ OpenPLZ.Streets > de ; 91522 }`, `{ OpenPLZ.TextSearch > de ; 91522 Karolinen }`, `{ OpenPLZ > ch ; Cantons }`, `{ AI.LLAMA.STD.QA > Wie wird das Wetter morgen?; true;;;;;; }`, `{ Data.CSV > … }`, `{ Data.Join > … }`, `{ Date.FromString > … }`, `{ Date.Holidays > 2026 }`, `{ DOM.Query > .p1 }`, `{ F > postalCode ; 91522 ; … }` (F outermost), `{ I > 0 ; … }`, `{ JSON.Path > … ; name }`, `{ LDAP.Find > AND ; sn=Callari }`, `{ Net.URL > <url> }`, `{ Sorted > { JSON.Path > … ; name } }` + `Unique`, `{ V > USGrade }`.
- [ ] EPs placed via Sys.Log.Console data or field default values; no invented EP ids.
- [ ] Regex params are regexes (`^An`).

### FS06 — Payment / order form (XOrderItem + Cleave + REGEX)

**Elements covered:** XOrderItem, XOrderButton, HTML.Input.Cleave, HTML.Input.REGEX, HTML.SETAttribute,
CodBi_Currency, XFieldSet panel, XLine, XSpacer.

**Prompt (DE):**
> Baue ein Bezahlformular: Bestellartikel „Parkausweis“ (30 €, 19 % MwSt) und „Zweitausweis“
> (10 €) samt Bestell-Button, ein Euro-Geldbetragsfeld „Kaufpreis“, ein Kreditkartenfeld mit
> Maskierung, ein Sicherheitscode-Feld, das nur 3 Ziffern zulässt, und ein Feld „Kartennummer“,
> dessen Titel „Pflichtfeld“ ist. Ordne alles in einem Feldset „Zahlung“ mit einer Trennlinie und
> einem Abstand an.

**Prompt (EN):**
> Build a payment form: order items "Parking permit" (€30, 19% VAT) and "Second ID card" (€10)
> with an order button, a euro money field "Purchase price", a credit-card field with masking, a
> security-code field that only allows 3 digits, and a "Card number" field whose title is "Required
> field". Arrange everything in a "Payment" fieldset with a separator line and a spacer.

**Verify:**
- [ ] XOrderItem with `xorderitem_price`/`xorderitem_tax`/`xorderitem_description` + XOrderButton.
- [ ] `CodBi_Currency` (EUR) on the price field; HTML.Input.Cleave with the card mask; HTML.Input.REGEX (`^[0-9]{3}$` style) on the security code; HTML.SETAttribute (Name `title`, ToSet `Pflichtfeld`).
- [ ] XFieldSet "Zahlung" + `CodBi_HTML_Panel_Standard` (if panel requested), XLine, XSpacer.

### FS07 — Multi-language form with hidden container and console logging

**Elements covered:** XLanguageSwich, XNavigationBar, XContainerInvisible, JSON.SET, Sys.Log.Console,
HTML.Text.Injector, HTML.Text.Mapper, XCheckbox, XDatalistAdvanced, XTextfieldAdvanced.

**Prompt (DE):**
> Erstelle ein mehrsprachiges Formular: einen Sprachumschalter, eine Formcycle-Navbar, einen
> unsichtbaren Container mit zwei versteckten JSON-Feldern, ein filterbares Auswahlfeld „Stadt“
> (Datalist) und ein filterbares Textfeld „Kunde“. Injiziere den Text „hallo“ in die CSS-Klasse des
> Feldes `tfVorname` und mappe Objekt-Eigenschaften in ein Text-Template im Feld `tfNachricht`.
> Logge den Wert von `tfMail` in die Konsole.

**Prompt (EN):**
> Create a multi-language form: a language switcher, a Formcycle navbar, an invisible container
> with two hidden JSON fields, a filterable select field "City" (datalist) and a filterable text
> field "Customer". Inject the text "hello" into the CSS class of the `tfVorname` field and map
> object properties into a text template in the `tfNachricht` field. Log the value of `tfMail` to
> the console.

**Verify:**
- [ ] XLanguageSwich; XNavigationBar; XContainerInvisible holding the two JSON.SET hidden fields.
- [ ] XDatalistAdvanced + XTextfieldAdvanced (DS widgets).
- [ ] HTML.Text.Injector (Placeholder/Property/Replacement) on `tfVorname`; HTML.Text.Mapper (Property + Replacements) on `tfNachricht`.
- [ ] Invisible XSpan with `data-cb-Data="SYS.Log.Console > { V > tfMail }"` (or equivalent reference).

### FS08 — Autocomplete, cropper and print layout (CSS-class heavy)

**Elements covered:** CodBi_OpenPLZ_AC_SET_*, CodBi_LDAP_AC_*, CodBi_Fotocropper_*,
CodBi_Print_Remove_*, Media.Image.Cropper, CodBi_NoFutureDate, CodBi_DateFrame_1_Begin_End,
CodBi_TimeFrame_1_Begin_End, CodBi_People_*, Sys.Log.Console.

**Prompt (DE):**
> Richte die Adressfelder `tfPLZ`, `tfOrt`, `tfVorname`, `tfNachname` mit deutscher
> Autovervollständigung für PLZ/Ort/Straße/Hausnummer ein und ergänze eine LDAP-Autofill-Gruppe für
> die Personendaten. Füge ein Fotocropper-Board und einen Bild-Cropper vor dem Upload `fdDatei`
> hinzu. Blende `tfNachname` beim Drucken aus (nur beim Drucken). Für das Datumsfeld `tfDatum`:
> keine zukünftigen Daten; ein Datumsbereich 1 (Beginn/Ende) und ein Zeitbereich 1 (Beginn/Ende)
> mit den entsprechenden Klassen. Ein Feld für Vorname, eines für E-Mail und eines für PLZ (DE) als
> Personenklassen. Logge „Fertig“ in die Konsole.

**Prompt (EN):**
> Set up the address fields `tfPLZ`, `tfOrt`, `tfVorname`, `tfNachname` with German autocomplete
> for ZIP/city/street/house number and add an LDAP autofill group for the personal data. Add a
> photo-cropper board and an image cropper before the `fdDatei` upload. Hide `tfNachname` when
> printing (print-only). For the `tfDatum` date field: no future dates; a date frame 1
> (begin/end) and a time frame 1 (begin/end) with the corresponding classes. A first-name field,
> an e-mail field and a DE ZIP field as people classes. Log "Done" to the console.

**Verify:**
- [ ] `CodBi_OpenPLZ_AC_SET_PLZ/Locality/Street/BuildingNumber` classes on the correct fields (preferred over `data-cb-func`); `CodBi_LDAP_AC_*` on the person group.
- [ ] `CodBi_Fotocropper_*` classes; `Media.Image.Cropper` on `fdDatei`.
- [ ] `CodBi_Print_Remove_PrintOnly` (or the correct variant) on `tfNachname`.
- [ ] `CodBi_NoFutureDate` on `tfDatum`; `CodBi_DateFrame_1_Begin_End` and `CodBi_TimeFrame_1_Begin_End` (no `data-cb-func="date.frame"`).
- [ ] `CodBi_People_*` per field type (not on streets/localities).

### FS09 — Kitchen-sink form (every widget type at least once)

**Elements covered:** all 29 widget classes from §1 of
[`form-assistant-test-prompts.md`](form-assistant-test-prompts.md:11).

**Prompt (DE):**
> Erstelle ein Formular, das folgende Elemente enthält: ein einzeiliges Namensfeld, ein
> Datumsfeld „Geburtsdatum“ (deutsche Validierung), ein mehrzeiliges Textfeld, ein Upload-Feld für
> den Lebenslauf, ein Dropdown „Stadt“ mit Ansbach/Nürnberg/München, ein Kontrollkästchen
> „Newsletter“, die Buttons „Zurück“/„Senden“, einen statischen Text „Bitte ausfüllen“, ein
> Logo-Bild, eine Gruppe „Adresse“ als Feldset, einen Layout-Container mit zwei Textfeldern, einen
> unsichtbaren Container, ein Signaturfeld, einen Terminfinder „Beratungstermin“, eine Trennlinie,
> einen Abstand, zwei Seiten „Seite 1“/„Seite 2“ mit Fortschrittsanzeige, einen Kopfbereich
> „Anmeldung“ und einen Fußbereich, ein filterbares Auswahlfeld „Stadt“ (Datalist), ein filterbares
> Textfeld „Kunde“, ein berechnetes Feld „Summe“, eine 5-Sterne-Bewertung, einen Captcha-Schutz,
> ein HTML-Snippet, eine interaktive Karte, eine Formcycle-Navbar, einen Sprachumschalter und einen
> BundID-Login-Button.

**Prompt (EN):**
> Create a form containing the following elements: a single-line name field, a date field "Date of
> birth" (German validation), a multi-line text field, an upload field for the CV, a dropdown
> "City" with Ansbach/Nuremberg/Munich, a "Newsletter" checkbox, the "Back"/"Submit" buttons, a
> static text "Please fill in", a logo image, an "Address" group as a fieldset, a layout container
> with two text fields, an invisible container, a signature field, an appointment finder
> "Consultation", a separator line, a spacer, two pages "Page 1"/"Page 2" with a progress
> indicator, a header "Registration" and a footer, a filterable select field "City" (datalist), a
> filterable text field "Customer", a computed field "Total", a 5-star rating, CAPTCHA protection,
> an HTML snippet, an interactive map, a Formcycle navbar, a language switcher and a BundID login
> button.

**Verify:**
- [ ] All 29 widgets present with the correct `className` (XTextField, XTextArea, XUpload, XSelect, XCheckbox, XButtonList, XSpan, XImage, XFieldSet, XContainer, XContainerInvisible, XSignature, XAppointment, XLine, XSpacer, XPage ×2, Form.Navigator, XHeader, XFooter, XDatalistAdvanced, XTextfieldAdvanced, XFormula, XRating, XCaptcha, XHtmlWidget, XMap, XNavigationBar, XLanguageSwich, XBsLogin).
- [ ] Widget-required options (XSelect `options` text+value; XButtonList `buttons`; XUpload source; datatype `dateDE`; fullwidth on the textarea; `appointmentPlan` on the Terminfinder).
- [ ] 2 XPages + Form.Navigator in its own container; XNavigationBar as separate element (not Form.Navigator).

### FS10 — Global standard configurations (holistic)

**Elements covered:** Holistic.CSS.Standard, Holistic.Matomo.Tracking, Holistic.Media.Input.Speech,
Holistic.Media.Input.Speech.Whisper, CodBi_XCL_Speech, DQ.Table.View (already present).

**Prompt (DE):**
> Wende die Standard-CSS auf das Formular an, aktiviere Matomo-Tracking global, aktiviere
> Spracheingabe auf allen Textfeldern und zusätzlich die Whisper-Spracheingabe auf allen Feldern.

**Prompt (EN):**
> Apply the standard CSS to the form, enable Matomo tracking globally, enable speech input on all
> text fields and additionally Whisper speech input on all fields.

**Verify:**
- [ ] The returned `standards` CSV contains `Holistic.CSS.Standard`, `Holistic.Matomo.Tracking`, `Holistic.Media.Input.Speech` / `.Whisper` (config-level, not per-element attributes).
- [ ] `CodBi_XCL_Speech` / `CodBi_XCL_Speech_Whisper` present on the fields (or the config applied).
- [ ] No per-element `data-cb-func` invented for configs that belong in `standards`.

---

## B. Whole-workflow scenarios (Workflow Assistant)

### WS01 — Basic intake lane (submit → log → state → email → end)

**Triggers/nodes covered:** FC_FORM_SUBMIT_BUTTON, FC_LOG_ENTRY, FC_CHANGE_STATE, FC_EMAIL, FC_RETURN.

**Prompt (DE):**
> Beim Klick auf den Senden-Button: schreibe eine Info-Logmeldung „Vorgang gestartet“, setze den
> Status auf „Eingegangen“ und sende eine Bestätigungsmail an `[%tfMail%]` von
> office@ansbach.de mit dem Betreff „Eingang“. Danach den Prozess beenden, ohne den Status zu
> ändern.

**Prompt (EN):**
> On click of the submit button: write an info log message "Process started", set the state to
> "Received" and send a confirmation e-mail to `[%tfMail%]` from office@ansbach.de with the subject
> "Received". Then end the process without changing the state.

**Verify:**
- [ ] Trigger `FC_FORM_SUBMIT_BUTTON` with `triggerParams.buttonName`=`btnZwolf`; single JSON object.
- [ ] Node order: FC_LOG_ENTRY → FC_CHANGE_STATE → FC_EMAIL (from literal `office@ansbach.de`, to `[%tfMail%]`, subject `Eingang`) → FC_RETURN (`endpointType=FC_RETURN`, `endpointState=""`).
- [ ] `taskName` + `endpointState` in the prompt's language (`Empfangen`/`Eingegangen` for DE, `Received` for EN).

### WS02 — Double opt-in with welcome lane (two lanes)

**Triggers/nodes covered:** FC_FORM_SUBMIT_BUTTON, FC_DOI_INIT, FC_DOI_VERIFIED, FC_CHANGE_STATE,
FC_EMAIL, FC_INVITATION_SENT, FC_INVITATION_ERROR.

**Prompt (DE):**
> Lane 1: Beim Klick auf den Senden-Button eine Doppel-Opt-In-Einladung an den Absender senden
> (Erfolgs- und Fehlerseite angeben, Absender office@ansbach.de, Betreff „Bitte bestätigen“,
> Empfänger `[%tfMail%]`). Lane 2: Nach der DOI-Bestätigung den Status auf „Aktiv“ setzen und eine
> Willkommensmail senden. Wenn das Einladungsmail fehlschlägt, eine Fehlermeldung loggen.

**Prompt (EN):**
> Lane 1: On click of the submit button send a double opt-in invitation to the sender (provide
> success and failure completion pages, sender office@ansbach.de, subject "Please confirm",
> recipient `[%tfMail%]`). Lane 2: After DOI verification set the state to "Active" and send a
> welcome e-mail. If the invitation e-mail fails, log an error message.

**Verify:**
- [ ] Output is an **array of two** task objects (two independent lanes).
- [ ] Lane 1: FC_FORM_SUBMIT_BUTTON → FC_DOI_INIT with success+failure page, sender, subject, recipient.
- [ ] Lane 2: FC_DOI_VERIFIED → FC_CHANGE_STATE → FC_EMAIL welcome; optional third lane/branch for FC_INVITATION_ERROR (→ FC_LOG_ENTRY).
- [ ] No FC_EMAIL used for the DOI invitation itself.

### WS03 — Payment + postbox with authentication guard

**Triggers/nodes covered:** FC_FORM_SUBMIT_BUTTON, CheckTrustLevelPlugin, PaymentInitPlugin,
PostboxPlugin, FC_CHANGE_STATE.

**Prompt (DE):**
> Beim Absenden — nur wenn mit einem ELSTER-Zertifikat authentifiziert — eine Gebühr von 30 € über
> die AKDB bezahlen lassen (Kunden- und Zahlungsdaten aus dem Formular) und danach den erstellten
> Bescheid in den BayernID-Postkorb des Nutzers senden. Am Ende den Status auf „Bezahlt“ setzen.

**Prompt (EN):**
> On submit — only if authenticated with an ELSTER certificate — have a fee of €30 paid via AKDB
> (customer and payment data from the form) and afterwards send the created notice to the user's
> BayernID postbox. Finally set the state to "Paid".

**Verify:**
- [ ] Details request lists CheckTrustLevelPlugin + PaymentInitPlugin + PostboxPlugin (+ their exact sub-schemas).
- [ ] CheckTrustLevelPlugin (CERTIFICATE) as guard; `_childNodes` contain PaymentInitPlugin (orderItemDefs amount "30", paymentClient/customerData/address from form fields) + PostboxPlugin (message subject/body + id, **NOT** FC_EMAIL).
- [ ] FC_CHANGE_STATE `endpointState` in the prompt's language; chain nodes after the guard.

### WS04 — Repeatable rows as JSON into DB (loop + SQL)

**Triggers/nodes covered:** FC_FORM_SUBMIT_BUTTON, FC_WRITE_FORM_RECORD_ATTRIBUTES, FC_FOR_EACH_LOOP,
FC_SQL_STATEMENT.

**Prompt (DE):**
> Beim Klick auf den Senden-Button alle Zeilen der Wiederholgruppe `divRepeat` als JSON-Array in
> die Datenbank „Pointless“, Tabelle „Hulu“, Spalte „Narrative“ schreiben (INSERT `[%tfName%]`).
> Starte das Array mit `[`, iteriere die Zeilen, hänge jede Zeile an und schließe mit `]`, dann
> genau einen INSERT ausführen.

**Prompt (EN):**
> On click of the submit button write all rows of the repeatable container `divRepeat` as a JSON
> array into the database "Pointless", table "Hulu", column "Narrative" (INSERT `[%tfName%]`).
> Start the array with `[`, iterate the rows, append each row and close with `]`, then run exactly
> one INSERT.

**Verify:**
- [ ] Details request lists FC_WRITE_FORM_RECORD_ATTRIBUTES + FC_FOR_EACH_LOOP + FC_SQL_STATEMENT.
- [ ] Seed `[` FC_WRITE_FORM_RECORD_ATTRIBUTES **before** the loop (chain); per-row append FC_WRITE_FORM_RECORD_ATTRIBUTES **inside** `FC_FOR_EACH_LOOP.nodeParams._childNodes`; close `]` + the single FC_SQL_STATEMENT **after** the loop (chain nodes).
- [ ] `[%tfName%]` placeholders **unquoted** in the SQL; single INSERT (not one per row).
- [ ] Loop iteration type `FORM_FIELD_REPETITIONS`.

### WS05 — Branching: switch + conditions + context

**Triggers/nodes covered:** FC_FORM_SUBMIT_BUTTON, FC_SWITCH, FC_MULTIPLE_CONDITION, FC_EMAIL,
FC_WITH_FORM_ELEMENT_CONTEXT.

**Prompt (DE):**
> Beim Klick auf den Senden-Button: wenn `tfKlausel` = 'A' eine Mail an A@example.de senden, bei
> 'B' eine Mail an B@example.de. Zusätzlich: nur wenn das Feld `tfOption` == 'A' ist, eine weitere
> Mail senden. Führe die Aktion im Kontext von `tfVorname` = "Max" aus.

**Prompt (EN):**
> On click of the submit button: if `tfKlausel` = 'A' send a mail to A@example.de, if 'B' a mail to
> B@example.de. Additionally: only if the field `tfOption` == 'A', send another mail. Run the
> action in the context of `tfVorname` = "Max".

**Verify:**
- [ ] FC_SWITCH with `_cases` mapping `A`→mail A, `B`→mail B; FC_MULTIPLE_CONDITION with the child on YES; FC_WITH_FORM_ELEMENT_CONTEXT around the block.
- [ ] Children in `_childNodes`; conditions reference the field names correctly.
- [ ] All emails have sender/subject either provided or asked for (no invented values).

### WS06 — Loops: for-each, while, break/continue

**Triggers/nodes covered:** FC_FORM_SUBMIT_BUTTON, FC_FOR_EACH_LOOP, FC_WHILE_LOOP,
FC_DO_UNTIL_LOOP, FC_EMAIL, FC_BREAK, FC_CONTINUE, FC_LOG_ENTRY.

**Prompt (DE):**
> Beim Absenden: für jede Zeile der Wiederholgruppe `divRepeat` eine Zeile mit `tfName` und
> `tfData` loggen und bei Leerwert `tfName` mit „continue“ überspringen; solange `tfKlausel` == 1
> eine Mail senden und bei erreichtem Limit per „break“ ausbrechen; anschließend bis zur Bedingung
> `tfKlausel` == 0 wiederholen.

**Prompt (EN):**
> On submit: for each row of the repeatable container `divRepeat` log a row with `tfName` and
> `tfData` and skip empty `tfName` with "continue"; while `tfKlausel` == 1 send a mail and break
> out when the limit is reached; afterwards loop until the condition `tfKlausel` == 0.

**Verify:**
- [ ] FC_FOR_EACH_LOOP with per-row children in `_childNodes` (FC_LOG_ENTRY + FC_CONTINUE on the empty case).
- [ ] FC_WHILE_LOOP with FC_EMAIL in `_childNodes` and FC_BREAK child for the limit; FC_DO_UNTIL_LOOP for the trailing loop.
- [ ] No per-row append in `chainedNodes`; loops correctly nested/sequenced.

### WS07 — Error handling: experiment + catch + throw

**Triggers/nodes covered:** FC_FORM_SUBMIT_BUTTON, FC_EXPERIMENT, FC_EMAIL, FC_CATCH_ERROR,
FC_THROW_EXCEPTION, FC_LOG_ENTRY.

**Prompt (DE):**
> Beim Klick auf den Senden-Button eine Mail senden; bei Fehler eine separate Fehlermail an
> fehler@example.de senden und einen Fehler mit der Meldung „Senden fehlgeschlagen“ werfen. In
> einer zweiten Lane: wenn ein Fehler in einer Lane auftritt, den Fehler loggen und eine
> Benachrichtigungsmail senden.

**Prompt (EN):**
> On click of the submit button send a mail; on error send a separate error mail to
> error@example.de and throw an error with the message "Sending failed". In a second lane: when an
> error occurs in a lane, log the error and send a notification mail.

**Verify:**
- [ ] FC_EXPERIMENT with the main action in `_childNodes` and the error handler in `_handlerChildNodes`.
- [ ] FC_THROW_EXCEPTION with message "Senden fehlgeschlagen".
- [ ] Second lane: FC_CATCH_ERROR (with filters) → FC_LOG_ENTRY → FC_EMAIL; output is an array of two objects.

### WS08 — Document workflow (PDF/Word/ZIP/CMIS/WebDAV/file system)

**Triggers/nodes covered:** FC_FILL_PDF, RemotePrintService, FC_EMAIL, FC_FILL_WORD,
FC_COMPRESS_AS_ZIP, FC_SAVE_TO_WEBDAV, FC_SAVE_TO_FILE_SYSTEM, FC_RETURN_FILE,
FC_PROCESS_LOG_PDF, FC_EXPORT_FORM_RECORD_CHATS, CmisActionPlugin, CmisQueryActionPlugin,
UploadDocumentPlugin (RegiSafe), FC_DECODE_BASE64, FC_ENCODE_BASE64.

**Prompt (DE):**
> Beim qualifizierten Absenden: das ausgefüllte Formular als PDF rendern und per Mail an
> `[%tfMail%]` senden; die Vorlage `Vorlage.pdf` mit den Feldwerten befüllen; die Word-Vorlage mit
> den Werten befüllen; die Anhänge als ZIP `anhang.zip` komprimieren; die ZIP nach `/var/data`
> speichern und auf den WebDAV-Server; das erzeugte ZIP zum Download anbieten; das Prozesslog als
> PDF erzeugen und die Chats als PDF exportieren; das Dokument als CMIS-Dokument unter `/Antraege`
> ablegen und in RegiSafe archivieren (Metadatum „Aktenzeichen“).

**Prompt (EN):**
> On qualified submit: render the filled form as PDF and send it by mail to `[%tfMail%]`; fill the
> `Vorlage.pdf` template with the field values; fill the Word template with the values; compress
> the attachments as ZIP `anhang.zip`; save the ZIP to `/var/data` and to the WebDAV server; offer
> the generated ZIP for download; generate the process log as PDF and export the chats as PDF; store
> the document as a CMIS document under `/Antraege` and archive it in RegiSafe (metadata "reference
> number").

**Verify:**
- [ ] Trigger `FC_QUALIFIED_FORM_SUBMIT_BUTTON`.
- [ ] RemotePrintService (NOT FC_FILL_PDF) for the form-as-PDF, chained FC_EMAIL after it; FC_FILL_PDF with template+mapping for `Vorlage.pdf`; FC_FILL_WORD for the Word template.
- [ ] FC_COMPRESS_AS_ZIP → FC_SAVE_TO_FILE_SYSTEM + FC_SAVE_TO_WEBDAV + FC_RETURN_FILE; FC_PROCESS_LOG_PDF; FC_EXPORT_FORM_RECORD_CHATS.
- [ ] `de.xima.fc.fc_plugin_cmis.plugin.CmisActionPlugin` (objectName/objectType/folderPath) and `de.xima.regisafe.plugin.node.UploadDocumentPlugin` (files + metadata); no invented credentials.
- [ ] Details request lists every node type used.

### WS09 — Record management (state, inbox, counter, availability, SQL, message, chat)

**Triggers/nodes covered:** FC_MANUAL, FC_COUNTER, FC_CHANGE_FORM_AVAILABILITY,
FC_SET_FORM_RECORD_PASSWORD, FC_MOVE_FORM_RECORD_TO_INBOX, FC_SEND_FORM_RECORD_MESSAGE,
FC_CHANGE_FORM_RECORD_CHAT_ACTIVENESS, FC_SET_SAVED_FLAG, FC_DELETE_FORM_RECORD, FC_QUEUE_TASK,
FC_WRITE_FORM_RECORD_ATTRIBUTES, FC_SQL_STATEMENT, FC_CREATE_TEXT_FILE.

**Prompt (DE):**
> Wenn der Benutzer es manuell auslöst: Zähler `k1` um 1 erhöhen; das Formular offline schalten;
> den Vorgang mit dem Passwort „Geheim“ schützen; den Vorgang ins Postfach „Anträge“ verschieben;
> eine interne Nachricht „…“ an den Absender senden; den Chat zum Vorgang öffnen; den Vorgang als
> gespeichert markieren; die Datei `ausgabe.json` mit dem Inhalt `{}` erstellen; das
> Server-Attribut `narrativeJson` = `[` schreiben; und den Vorgang endgültig löschen.

**Prompt (EN):**
> When the user triggers it manually: increment counter `k1` by 1; take the form offline; protect
> the record with the password "Secret"; move the record to the inbox "Applications"; send an
> internal message "…" to the sender; open the record chat; mark the record as saved; create the
> file `ausgabe.json` with the content `{}`; write the server attribute `narrativeJson` = `[`; and
> finally delete the record permanently.

**Verify:**
- [ ] Trigger FC_MANUAL; node sequence as listed; FC_SEND_FORM_RECORD_MESSAGE with the message (and recipient service when `recipientType=INBOX_ID`).
- [ ] FC_CREATE_TEXT_FILE (name `ausgabe.json` + content); FC_WRITE_FORM_RECORD_ATTRIBUTES (`narrativeJson`), NOT FC_SQL_STATEMENT (no table involved).
- [ ] Terminal nodes FC_QUEUE_TASK / FC_DELETE_FORM_RECORD with `endpointState=""`.
- [ ] Single lane → single object (no multi-lane unless asked).

### WS10 — End-to-end complex process (kitchen-sink workflow)

**Triggers/nodes covered:** FC_FORM_SUBMIT_BUTTON, FC_LOG_ENTRY, FC_MULTIPLE_CONDITION,
FC_SWITCH, FC_EMAIL, FC_DOI_INIT, FC_DOI_VERIFIED, FC_FOR_EACH_LOOP, FC_SQL_STATEMENT,
FC_COMPRESS_AS_ZIP, FC_SAVE_TO_WEBDAV, FC_SHOW_TEMPLATE, FC_CHANGE_STATE, FC_CATCH_ERROR,
FC_THROW_EXCEPTION, FC_RETURN.

**Prompt (DE):**
> Beim Klick auf den Senden-Button: Logge „Start“, setze den Status auf „Eingegangen“ und führe
> dann eine Verzweigung aus: bei `tfKlausel` = 'A' eine Doppel-Opt-In-Einladung an `[%tfMail%]`
> senden; nach Bestätigung den Status auf „Aktiv“ setzen und eine Willkommensmail senden. Bei
> `tfKlausel` = 'B' alle Zeilen der Wiederholgruppe als JSON in die DB „Pointless“, Tabelle
> „Hulu“, Spalte „Narrative“ schreiben, danach die Anhänge als ZIP komprimieren und auf den
> WebDAV-Server speichern. Nach beiden Pfaden die Abschlussseite „Allgemeiner Fehler 2“ vermeiden
> und stattdessen den Status auf „Fertig“ setzen. Fehler in einer Lane abfangen, loggen und eine
> Fehlermail senden.

**Prompt (EN):**
> On click of the submit button: log "Start", set the state to "Received" and then branch: if
> `tfKlausel` = 'A' send a double opt-in invitation to `[%tfMail%]`; after confirmation set the
> state to "Active" and send a welcome mail. If `tfKlausel` = 'B' write all rows of the repeatable
> container as JSON into the DB "Pointless", table "Hulu", column "Narrative", then compress the
> attachments as ZIP and save to the WebDAV server. After both paths avoid the completion page
> "General error 2" and instead set the state to "Done". Catch errors in a lane, log them and send
> an error mail.

**Verify:**
- [ ] Single multi-step lane + a second FC_CATCH_ERROR lane (array of two objects).
- [ ] FC_SWITCH with two branches; branch A → FC_DOI_INIT … (and the FC_DOI_VERIFIED continuation, possibly its own lane); branch B → FC_FOR_EACH_LOOP + single unquoted FC_SQL_STATEMENT + FC_COMPRESS_AS_ZIP + FC_SAVE_TO_WEBDAV.
- [ ] Loop/condition children in `_childNodes`; chain nodes after loops; `endpointState` in the prompt's language; FC_THROW_EXCEPTION in the error lane.
- [ ] No `FC_SHOW_TEMPLATE` for a completion page that should be avoided.

---

## How to record results

Reuse the checklist from [`form-assistant-prompt-testing-plan.md`](form-assistant-prompt-testing-plan.md:49).
For each scenario record: prompt language, details-request present?, details list complete (all
widgets/triggers/nodes), final JSON valid?, required params present?, structure correct (nesting /
lanes / order)?, PASS/FAIL + snippet. Re-run after any prompt change (regression).
