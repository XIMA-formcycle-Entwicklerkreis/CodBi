# Form Assistant Test Prompts

Copy-paste-ready test prompts for verifying that the AI assistants correctly build every Formcycle widget, CodBi element, and workflow trigger/node. Enter each prompt into the **Form Designer → AI Assistant** (widgets + CodBi) or **Workflow Editor → AI Assistant** (triggers + nodes), then verify against the `Expect` column (see also `plans/form-assistant-prompt-testing-plan.md` for the full methodology and checklists).

Run each card in **German and English** — label/endpoint language is part of the check.

> **Whole-form / whole-workflow scenarios** — prompts that build a *complete* form or workflow in
> one go (many widgets + CodBi functionalities + element placeholders, or multiple triggers/nodes
> with lanes/conditions/loops): see [`form-assistant-whole-form-test-prompts.md`](form-assistant-whole-form-test-prompts.md:1) (FS01–FS10, WS01–WS10).

---

## 1. Formcycle widgets (Form Assistant)

| # | Prompt | Expect |
|---|---|---|
| W01 | "Füge ein einzeiliges Eingabefeld für den Namen hinzu." | XTextField, label "Name". |
| W02 | "Ein Datumsfeld 'Geburtsdatum' mit deutscher Datumsvalidierung." | XTextField datatype=`dateDE`. |
| W03 | "Ein mehrzeiliges Textfeld für die Nachricht." | XTextArea, fullwidth=1. |
| W04 | "Ein Upload-Feld für den Lebenslauf." | XUpload + source. |
| W05 | "Ein Dropdown 'Stadt' mit Ansbach, Nürnberg, München." | XSelect; options with text+value. |
| W06 | "Ein Kontrollkästchen 'Newsletter abonnieren'." | XCheckbox. |
| W07 | "Zwei Buttons: 'Zurück' und 'Senden'." | XButtonList; action.page previous/submit. |
| W08 | "Einen statischen Text 'Bitte ausfüllen' einfügen." | XSpan; text in rtevalue. |
| W09 | "Ein Bild mit Logo einfügen." | XImage + source. |
| W10 | "Eine Gruppe 'Adresse' mit Feldset-Rahmen." | XFieldSet legend "Adresse". |
| W11 | "Einen Layout-Container mit zwei Textfeldern." | XContainer with children. |
| W12 | "Einen unsichtbaren Container für versteckte Felder." | XContainerInvisible. |
| W13 | "Ein Signaturfeld für die Unterschrift." | XSignature. |
| W14 | "Einen Terminfinder 'Beratungstermin'." | XAppointment (+appointmentPlan when named). |
| W15 | "Eine Trennlinie einfügen." | XLine. |
| W16 | "Einen Abstand/Spacer einfügen." | XSpacer. |
| W17 | "Formular mit 2 Seiten 'Seite 1','Seite 2' und Fortschrittsanzeige." | 2 XPages + Form.Navigator. |
| W18 | "Einen Formularkopf 'Anmeldung' und einen Fußbereich." | XHeader + XFooter. |
| W19 | "Ein filterbares Auswahlfeld 'Stadt' (Datalist)." | XDatalistAdvanced. |
| W20 | "Ein filterbares Textfeld 'Kunde'." | XTextfieldAdvanced. |
| W21 | "Ein berechnetes Feld 'Summe' (read-only)." | XFormula. |
| W22 | "Eine Bewertung mit 5 Sternen." | XRating. |
| W23 | "Einen Captcha-Schutz hinzufügen." | XCaptcha (XReCaptcha when requested). |
| W24 | "Ein HTML-Snippet einfügen." | XHtmlWidget. |
| W25 | "Eine interaktive Karte einfügen." | XMap. |
| W26 | "Eine Navigations-/Fortschrittsleiste (Formcycle-Navbar)." | XNavigationBar (not Form.Navigator). |
| W27 | "Einen Sprachumschalter." | XLanguageSwich. |
| W28 | "Einen BundID-Login-Button." | XBsLogin. |
| W29 | "Ein Bezahlformular mit den Bestellartikeln 'Parkausweis' (30 €, 19 % MwSt) und 'Zweitausweis' (10 €) samt Bestell-Button." | XOrderItem (xorderitem_price/tax/description) + XOrderButton. |

## 2. CodBi functionalities (Form Assistant)

| # | Prompt | Expect |
|---|---|---|
| F01 | "Bette einen KI-Chat in den Container ein." | AI.LLAMA.CHAT + all chat sub-elements/classes. |
| F02 | "OCR: Text aus dem Upload-Feld extrahieren." | AI.OCR on XUpload (Mode required). |
| F03 | "Datumsbereich 'Beginn' und 'Ende' (Beginn min)." | Date.Frame on BEGIN field only + maxfield. |
| F04 | "Im Datumsfeld keine Vergangenheitsdaten erlauben." | Date.Min (+ min date). |
| F05 | "In dem Datumsfeld keine Wochenenden erlauben." | Date.NoWeekends. |
| F06 | "Mehrseitiges Formular mit Fortschrittsanzeige." | Form.Navigator on 2+ pages (own container). |
| F07 | "Eigenes CSS einfügen: Überschriften rot." | HTML.CSS (+ CSS text). |
| F08 | "Kreditkartennummer mit Maskierung im Textfeld." | HTML.Input.Cleave (+ mask). |
| F09 | "Das Feld darf die Zeichen e$% nicht enthalten." | HTML.Input.REGEX: keyexpression `[^e$%]`, expression `^[^e$%]*$`. |
| F10 | "Das mehrzeilige Feld soll ein Rich-Text-Editor sein." | HTML.Input.TinyMCE on XTextArea. |
| F11 | "Container in ein aufklappbares Panel verwandeln." | HTML.Panel (+ generateheader/autoheadertitle). |
| F12 | "Dem Feld Titel 'Pflichtfeld' und Opacity 0.5 setzen." | HTML.SETAttribute name+toset. |
| F13 | "Text 'hallo' in das Element injizieren." | HTML.Text.Injector replacement/placeholder/property. |
| F14 | "Objekt-Eigenschaften in Text-Template mappen." | HTML.Text.Mapper (source + template). |
| F15 | "Verstecktes Feld mit JSON aus dem Element befüllen." | JSON.SET (+ expression). |
| F16 | "LDAP-Autovervollständigung auf die Adressfelder." | CodBi_LDAP_AC_* classes (set). |
| F17 | "Autovervollständigung aus dem LDAP-Verzeichnis." | LDAP.Autocomplete. |
| F18 | "Matomo-Tracking für das Formular aktivieren." | Matomo.Tracking (SiteID) or Holistic.Matomo.Tracking. |
| F19 | "Bild-Cropper vor dem Upload anbieten." | Media.Image.Cropper on XUpload. |
| F20 | "Spracheingabe (Diktieren) im Textfeld." | MEDIA.INPUT.SPEECH. |
| F21 | "Adressgruppe PLZ/Ort/Straße/Nummer mit Autovervollständigung." | CodBi_OpenPLZ_AC_SET_* classes. |
| F22 | "Beim Drucken das Feld ausblenden." | Print.Remove. |
| F23 | "Logge die Details des Planeten Pluto (Sättigung 0.5) in die Konsole." | Sys.Log.Console invisible XSpan + `SYS.Log.Console > …`. |
| F24 | "Zeige Spalten Alter, Name, Details der Abfrage HolaQuery als Tabelle; Details als JSON; Details nicht exportieren." | DQ.Table.View: columns CSV (jsonFlag), dataquery, excludecolumns. |
| F25 | "Zeitbereich 'Beginn' und 'Ende' (Beginn min)." | Time.Frame on BEGIN time field only + maxfield. |

## 3. Element placeholders (Form Assistant — via Sys.Log.Console or a field value)

| # | Prompt | Expect |
|---|---|---|
| E01 | "Logge die KI-Antwort zu 'Wie wird das Wetter morgen?'." | `{ AI.LLAMA.STD.QA > Wie wird das Wetter morgen?; true;;;;;; }`. |
| E02 | "Zeige die Kontaktdetails des Amts für Digitales (BayVIS)." | correct BayVIS EP. |
| E03 | "CSV-String in ein Array umwandeln." | `{ Data.CSV > … }`. |
| E04 | "Zwei Objekte zusammenführen." | `{ Data.Join > … }`. |
| E05 | "String in Datum umwandeln." | `{ Date.FromString > … }`. |
| E06 | "Feiertage des Jahres 2026 abrufen." | `{ Date.Holidays > … }`. |
| E07 | "Das Element .p1 abfragen." | `{ DOM.Query > .p1 }`. |
| E08 | "Filtere Objekte mit postalCode == 91522." | `{ F > postalCode ; 91522 ; … }` (F outermost). |
| E09 | "Nimm das erste Element aus dem Array." | `{ I > 0 ; … }`. |
| E10 | "Extrahiere 'name' aus dem Ergebnis." | `{ JSON.Path > … ; name }`. |
| E11 | "Suche 'sn=Callari' im LDAP." | `{ LDAP.Find > AND ; sn=Callari }`. |
| E12 | "Lade den Inhalt der URL." | `{ Net.URL > <url> }`. |
| E13 | "Suche Orte, die mit 'An' beginnen (DE)." | `{ OpenPLZ.Localities > de ; ^An }`. |
| E14 | "Suche Straßen in 91522." | `{ OpenPLZ.Streets > de ; … }`. |
| E15 | "Alle Kantone der Schweiz." | `{ OpenPLZ > ch ; Cantons }`. |
| E16 | "Volltextsuche '91522 Karolinen'." | `{ OpenPLZ.TextSearch > de ; 91522 Karolinen }`. |
| E17 | "Sortiere / dedupliziere die Ortsnamen." | `{ Sorted > … }` / `{ Unique > … }`. |
| E18 | "Wert der globalen Variable 'USGrade' verwenden." | `{ V > USGrade }`. |

## 4. Workflow triggers (Workflow Assistant)

| # | Prompt | Expect |
|---|---|---|
| T01 | "Beim Klick auf den Senden-Button…" | FC_FORM_SUBMIT_BUTTON (+buttonName). |
| T02 | "Beim qualifizierten Absenden (Signatur)…" | FC_QUALIFIED_FORM_SUBMIT_BUTTON. |
| T03 | "Wenn der Benutzer es manuell auslöst…" | FC_MANUAL. |
| T04 | "2 Tage nach Eintritt in Status 'Eingegangen'…" | FC_STATE_TIMER (+applicableStateNames). |
| T05 | "Am 02.07.2026 um 08:48 Uhr…" | FC_TIME_POINT FIXED (ISO-8601+offset). |
| T06 | "Wenn eine interne Nachricht eingeht…" | FC_FORM_RECORD_MESSAGE_POSTED. |
| T07 | "Wenn ein Upload-Wunsch erfüllt wurde…" | FC_FORM_RECORD_MESSAGE_UPLOAD_REQUEST_FULFILLED. |
| T08 | "Wenn ein Fehler in einer Lane auftritt…" | FC_CATCH_ERROR. |
| T09 | "Nach Bestätigung der DOI-E-Mail…" | FC_DOI_VERIFIED. |
| T10 | "Wenn die Einladungsmail gesendet wurde / fehlschlägt…" | FC_INVITATION_SENT / FC_INVITATION_ERROR. |
| T11 | "Wenn der Benutzer es aus der Detailansicht auslöst…" | FC_USER_INVOCATION. |

## 5. Workflow nodes (Workflow Assistant)

| # | Prompt | Expect |
|---|---|---|
| N01 | "Beim Absenden eine Bestätigungsmail an [%tfMail%] von office@ansbach.de, Betreff 'Eingang'." | FC_EMAIL (to/subject/body/from literal). |
| N02 | "Doppel-Opt-In-Einladung an den Absender." | FC_DOI_INIT (success+failure page, sender, subject, recipient). |
| N03 | "Status auf 'Bearbeitet' setzen." | FC_CHANGE_STATE / endpointState. |
| N04 | "POST an https://api.example.com mit JSON senden." | FC_POST_REQUEST (url+method REQUIRED). |
| N05 | "Feld tfOrt auf 'Ansbach' setzen." | FC_CHANGE_FORM_VALUE. |
| N06 | "Eine Info-Logmeldung 'Vorgang gestartet' schreiben." | FC_LOG_ENTRY. |
| N07 | "Auf https://example.de weiterleiten." | FC_REDIRECT. |
| N08 | "Prozess beenden (ohne Statuswechsel)." | FC_RETURN (endpointType FC_RETURN, endpointState ""). |
| N09 | "Vorgang als gespeichert markieren." | FC_SET_SAVED_FLAG. |
| N10 | "Vorgang endgültig löschen." | FC_DELETE_FORM_RECORD (endpointState ""). |
| N11 | "Ereignis in die Warteschlange stellen." | FC_QUEUE_TASK (terminal). |
| N12 | "Interne Nachricht '…' an den Absender." | FC_SEND_FORM_RECORD_MESSAGE. |
| N13 | "Chat zum Vorgang öffnen." | FC_CHANGE_FORM_RECORD_CHAT_ACTIVENESS (OPEN). |
| N14 | "Datei 'ausgabe.json' mit Inhalt erstellen." | FC_CREATE_TEXT_FILE. |
| N15 | "Server-Attribut 'narrativeJson' = '[' schreiben." | FC_WRITE_FORM_RECORD_ATTRIBUTES. |
| N16 | "Daten in DB 'Pointless', Tabelle 'Hulu', Spalte 'Narrative' schreiben (INSERT [%tfName%])." | FC_SQL_STATEMENT; placeholders UNQUOTED in VALUES. |
| N17 | "Datei 'xoxo.txt' zum Download anbieten." | FC_RETURN_FILE. |
| N18 | "Upload-Feld base64-encodieren / decodieren." | FC_ENCODE_BASE64 / FC_DECODE_BASE64. |
| N19 | "Prozesslog als PDF erzeugen." | FC_PROCESS_LOG_PDF. |
| N20 | "Chats als PDF exportieren." | FC_EXPORT_FORM_RECORD_CHATS. |
| N21 | "Das ausgefüllte Formular als PDF versenden." | RemotePrintService (NOT FC_FILL_PDF). |
| N22 | "Vorlage.pdf mit Feldwerten befüllen." | FC_FILL_PDF (template + mapping). |
| N23 | "Word-Vorlage mit Werten befüllen." | FC_FILL_WORD. |
| N24 | "Dateien als ZIP 'anhang.zip' komprimieren." | FC_COMPRESS_AS_ZIP. |
| N25 | "Datei nach /var/data speichern." | FC_SAVE_TO_FILE_SYSTEM. |
| N26 | "Datei auf den WebDAV-Server speichern." | FC_SAVE_TO_WEBDAV. |
| N27 | "Zähler 'k1' um 1 erhöhen." | FC_COUNTER. |
| N28 | "Formular offline schalten." | FC_CHANGE_FORM_AVAILABILITY. |
| N29 | "Neuen Vorgang in Form 'Antrag' anlegen (Feld-Mapping)." | CreateRecordNodePlugin. |
| N30 | "Abschlussseite 'Allgemeiner Fehler 2' anzeigen." | FC_SHOW_TEMPLATE (htmlTemplate). |
| N31 | "Anhänge des Upload-Felds fdDatei löschen." | FC_DELETE_ATTACHMENT. |
| N32 | "Vorgang ins Postfach 'Anträge' verschieben." | FC_MOVE_FORM_RECORD_TO_INBOX. |
| N33 | "Fehler mit Meldung 'X' werfen." | FC_THROW_EXCEPTION. |
| N34 | "…und dann aus der Schleife ausbrechen / fortfahren." | FC_BREAK / FC_CONTINUE (loop child). |
| N35 | "Vorgang mit Passwort 'Geheim' schützen." | FC_SET_FORM_RECORD_PASSWORD. |
| N36 | "Nur wenn mit ELSTER-Zertifikat authentifiziert…" | CheckTrustLevelPlugin (CERTIFICATE). |
| N37 | "Nur wenn Feld tfOption == 'A'…" | FC_MULTIPLE_CONDITION (+child on YES). |
| N38 | "Wenn tfKlausel='A' → Mail1, bei 'B' → Mail2." | FC_SWITCH (+_cases). |
| N39 | "Mail senden; bei Fehler eine Fehlermail." | FC_EXPERIMENT (+_childNodes/_handlerChildNodes). |
| N40 | "Für jede Zeile der Wiederholgruppe 'Name/Data'…" | FC_FOR_EACH_LOOP (FORM_FIELD_REPETITIONS; per-row child in _childNodes). |
| N41 | "Solange tfKlausel==1 … Mail senden." | FC_WHILE_LOOP / FC_DO_UNTIL_LOOP. |
| N42 | "Im Kontext von tfVorname=Max …" | FC_WITH_FORM_ELEMENT_CONTEXT. |
| N43 | "Beim Absenden eine Gebühr von 30 € über die AKDB bezahlen lassen (Kunden-/Zahlungsdaten aus dem Formular)." | `de.xima.akdb.epay.logic.plugin.node.PaymentInitPlugin`; nodeParams with paymentClient, customerData, address, orderConfig.orderItemDefs (amount "30"); details requested first. |
| N44 | "Den erstellten Bescheid nach dem Absenden in den BayernID Postkorb des Nutzers senden." | `de.xima.akdb.postbox.plugin.node.PostboxPlugin`; nodeParams with message.subject/body + id (Postbox placeholder); NOT FC_EMAIL. |
| N45 | "Nach dem Absenden das ausgefüllte Formular als Dokument im CMIS unter /Antraege ablegen." | `de.xima.fc.fc_plugin_cmis.plugin.CmisActionPlugin`; nodeParams objectName/objectType/folderPath/multiFile. |
| N46 | "Im CMIS nach Dokumenten mit dem Aktenzeichen '[%tfAktenzeichen%]' suchen." | `de.xima.fc.fc_plugin_cmis.plugin.CmisQueryActionPlugin`; nodeParams query (CMISQL) + maxHits. |
| N47 | "Die Anhänge nach dem Absenden in RegiSafe archivieren (Metadatum 'Aktenzeichen')." | `de.xima.regisafe.plugin.node.UploadDocumentPlugin`; nodeParams files + metadata; no invented service credentials. |

## 6. Composite scenarios

| # | Prompt | Expect |
|---|---|---|
| C01 | "Zeige Spalten Alter, Name, Details der Abfrage HolaQuery als Tabelle; Details als JSON; Excel-Export; Details nicht exportieren." | DQ.Table.View + jsonFlag + export + excludecolumns. |
| C02 | "Adressgruppe mit PLZ, Ort, Straße, Hausnummer und Autovervollständigung (Deutschland)." | CodBi_OpenPLZ_AC_SET_* on correct fields. |
| C03 | "Alle Zeilen der Wiederholgruppe als JSON-Array in DB 'Pointless', Tabelle 'Hulu', Spalte 'Narrative' schreiben." | Seed `[` → loop (append in _childNodes) → `]` → ONE FC_SQL_STATEMENT (unquoted). |
| C04 | "Beim Absenden Bestätigungsmail; nach DOI-Bestätigung Willkommensmail." | Two lanes (array), different triggers. |
| C05 | "Beim Absenden Status auf 'Eingegangen' setzen." | endpointState German; EN prompt → 'Received'. |
| C06 | "E-Mail beim Absenden senden." (no sender/subject) | AI asks (clarification), does not invent. |
| C07 | "Formular mit Vorname, Nachname, Geburtsdatum, Geburtsort, PLZ, Ort, E-Mail, Telefon in einem Feldset fsBKDaten." (with the **Bürgerservice** switch ON) | fields use the plugin's exact IDs: `tfAntragstellerVorname`, `tfAntragstellerName`, `tfAntragstellerGeburtsdatum`, `tfAntragstellerGeburtsort`, `tfAntragstellerPLZ`, `tfAntragstellerOrt`, `tfAntragstellerEmail`, `tfAntragstellerTelefon`, fieldset `fsBKDaten`. |
| C08 | Same prompt as C07 with the **Bürgerservice** switch OFF | fields use the free `tf…`/`sel…` naming; no canonical IDs enforced. |
| C09 | "Login per ELSTER (Organisation) in ein Feldset fsBKOrgDaten mit den nötigen Stammdaten." (Bürgerservice switch ON) | ELSTER-only fields included with exact IDs: `tfOrgName`, `tfOrgRechtsform`, `tfOrgRechtsformText`, `tfTaetigkeit`, `tfTaetigkeitText`, `tfDatenkranzTyp`, `tfOrgRegisterart`, `tfPersTyp`, `selOrgPersTyp`, `BPK2`, `TrustLevel`, `tfAuthentifizierungsLevel`, `tfAuthentifizierungsName`, `IdentitaetsPruefer`; no `data-cb-func` on autofill fields. |
| C10 | "Beim Absenden — nur wenn mit eID authentifiziert — die Gebühr von 30 € über die AKDB bezahlen lassen und den Bescheid an den BayernID Postkorb senden." | CheckTrustLevelPlugin (EPA) as guard; `_childNodes`: PaymentInitPlugin (orderItemDefs amount "30") + PostboxPlugin (message); endpoint FC_CHANGE_STATE. |
| C11 | "Alle Zeilen der Wiederholgruppe als JSON-Array als CMIS-Dokument 'narrative.json' im Ordner /Antraege ablegen." | COLLECT-ROWS-TO-JSON (seed `[` → FC_FOR_EACH_LOOP append in `_childNodes` → `]`) then ONE `de.xima.fc.fc_plugin_cmis.plugin.CmisActionPlugin` storing `[%\$RECORD_ATTR.narrativeJson%]` as content/property. |
