/**
 * Injects a localized `Summary` (a short, one-sentence description) into every functionality JSON
 * definition under `Functionalities/`.
 *
 * The `Summary` is stored as a per-language map (`{ en, de, it }`) — the same shape the EP definitions
 * already use — and is read by the designer's functionality config panel to show a tooltip on the
 * parameter group header (see `localizedFunctionalitySummary` in `i18n.ts`).
 *
 * Mirror of `localize-functionality-params.mjs` (which injects `descriptionDe` / `descriptionIt` into
 * the `parameters[*]` entries). The map below is keyed by file name and holds English / German /
 * Italian strings.
 *
 * Usage: node scripts/localize-functionality-summaries.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FUNC_DIR = join(__dirname, "..", "src", "main", "web", "packages", "form", "src", "js", "Functionalities");

/** Short functionality descriptions keyed by file name -> { en, de, it }. */
const SUMMARIES = {
  "ai.llama.chat.json": {
    en: "Embeds a local-AI chat widget into the tagged container (requires a configured LLAMA server).",
    de: "Bettet ein Chat-Widget der lokalen KI in den markierten Container ein (erfordert einen konfigurierten LLAMA-Server).",
    it: "Integra un widget di chat dell'IA locale nel contenitore contrassegnato (richiede un server LLAMA configurato).",
  },
  "ai.llama.standard.qa.json": {
    en: "Lets a local AI answer questions about the document (image/PDF) uploaded to an XUpload.",
    de: "Lässt eine lokale KI Fragen zum in einem XUpload hochgeladenen Dokument (Bild/PDF) beantworten.",
    it: "Consente a un'IA locale di rispondere a domande sul documento (immagine/PDF) caricato in un XUpload.",
  },
  "ai.llama.standard.txtqa.json": {
    en: "Lets a local AI answer questions from the values of tagged source text fields.",
    de: "Lässt eine lokale KI Fragen aus den Werten markierter Quell-Textfelder beantworten.",
    it: "Consente a un'IA locale di rispondere a domande dai valori dei campi di testo sorgente contrassegnati.",
  },
  "ai.llama.standard.txtverify.json": {
    en: "Verifies a text field's value against a question using a local AI.",
    de: "Prüft den Wert eines Textfelds anhand einer Frage mit einer lokalen KI.",
    it: "Verifica il valore di un campo di testo rispetto a una domanda tramite un'IA locale.",
  },
  "ai.ocr.json": {
    en: "Extracts text from uploaded images or PDFs of an XUpload via OCR.",
    de: "Extrahiert Text aus hochgeladenen Bildern oder PDFs eines XUpload per OCR.",
    it: "Estrae il testo da immagini o PDF caricati di un XUpload tramite OCR.",
  },
  "date.frame.json": {
    en: "Validates a date range so the minimum date cannot be after the maximum date.",
    de: "Validiert einen Datumsbereich, sodass das Mindestdatum nicht nach dem Höchstdatum liegt.",
    it: "Convalida un intervallo di date affinché la data minima non sia successiva a quella massima.",
  },
  "date.min.json": {
    en: "Forces a date field to accept only dates within the configured minimum distance in the past (or, reversed, in the future).",
    de: "Erzwingt, dass ein Datumsfeld nur Daten im konfigurierten Mindestabstand in der Vergangenheit akzeptiert (oder umgekehrt in der Zukunft).",
    it: "Impedisce a un campo data di accettare date al di fuori della distanza minima configurata nel passato (o, se invertito, nel futuro).",
  },
  "date.noweekends.json": {
    en: "Rejects weekend dates in a date field and shows an optional error message.",
    de: "Lehnt Wochenenddaten in einem Datumsfeld ab und zeigt eine optionale Fehlermeldung an.",
    it: "Rifiuta le date del fine settimana in un campo data e mostra un messaggio di errore opzionale.",
  },
  "date.time.join.json": {
    en: "Joins the date of a date field with the time of a time field into a single value.",
    de: "Verbindet das Datum eines Datumsfelds mit der Uhrzeit eines Zeitfelds zu einem Wert.",
    it: "Unisce la data di un campo data con l'ora di un campo ora in un unico valore.",
  },
  "date.time.join.span.json": {
    en: "Joins a begin date/time pair and an end date/time pair into a start and an end value.",
    de: "Verbindet ein Anfangs-Datum/-Zeit-Paar und ein End-Datum/-Zeit-Paar zu einem Start- und einem Endwert.",
    it: "Unisce una coppia data/ora iniziale e una finale in un valore di inizio e uno di fine.",
  },
  "dq.table.view.json": {
    en: "Renders the result of a Datasource query as an HTML table with an optional Excel export.",
    de: "Stellt das Ergebnis einer Datasource-Abfrage als HTML-Tabelle mit optionalem Excel-Export dar.",
    it: "Visualizza il risultato di una query Datasource come tabella HTML con esportazione Excel opzionale.",
  },
  "form.navigator.json": {
    en: "Adds a navigation bar (progress or breadcrumb) for multi-page forms.",
    de: "Fügt eine Navigationsleiste (Fortschritt oder Breadcrumb) für mehrseitige Formulare hinzu.",
    it: "Aggiunge una barra di navigazione (avanzamento o breadcrumb) per i moduli multipagina.",
  },
  "google.website.translator.json": {
    en: "Embeds Google's Website Translator language dropdown into the tagged element.",
    de: "Bettet das Sprach-Dropdown des Google-Website-Übersetzers in das markierte Element ein.",
    it: "Integra il menu a discesa delle lingue di Google Website Translator nell'elemento contrassegnato.",
  },
  "html.css.json": {
    en: "Injects custom CSS into the page, with optional placeholder and dark-mode replacements.",
    de: "Fügt benutzerdefiniertes CSS in die Seite ein, mit optionalen Platzhalter- und Darkmode-Ersetzungen.",
    it: "Inietta CSS personalizzato nella pagina, con sostituzioni opzionali di segnaposto e dark mode.",
  },
  "html.input.blacklist.json": {
    en: "Rejects input values that are on a configurable blacklist.",
    de: "Lehnt Eingabewerte ab, die auf einer konfigurierbaren Blacklist stehen.",
    it: "Rifiuta i valori di input presenti in una blacklist configurabile.",
  },
  "html.input.cleave.json": {
    en: "Applies input masking and formatting (dates, phone numbers, credit cards, …) via Cleave.js.",
    de: "Wendet Eingabemaskierung und -formatierung (Datum, Telefonnummern, Kreditkarten, …) über Cleave.js an.",
    it: "Applica mascheramento e formattazione dell'input (date, numeri di telefono, carte di credito, …) tramite Cleave.js.",
  },
  "html.input.noautocomplete.json": {
    en: "Disables the browser autocomplete for the tagged input.",
    de: "Deaktiviert die Browser-Autovervollständigung für das markierte Eingabefeld.",
    it: "Disattiva il completamento automatico del browser per l'input contrassegnato.",
  },
  "html.input.regex.json": {
    en: "Validates the field value and/or the individual keystrokes against regular expressions.",
    de: "Validiert den Feldwert und/oder die einzelnen Tastenanschläge anhand regulärer Ausdrücke.",
    it: "Convalida il valore del campo e/o i singoli tasti tramite espressioni regolari.",
  },
  "html.input.tinymce.json": {
    en: "Turns a textarea into a rich-text editor powered by TinyMCE.",
    de: "Verwandelt eine Textarea in einen Rich-Text-Editor auf Basis von TinyMCE.",
    it: "Trasforma una textarea in un editor di testo formattato basato su TinyMCE.",
  },
  "html.input.trans.capital.json": {
    en: "Transforms the typed input into capitalized words.",
    de: "Wandelt die eingegebene Eingabe in großgeschriebene Wörter um.",
    it: "Trasforma l'input digitato in parole con iniziali maiuscole.",
  },
  "html.input.trans.ntw.json": {
    en: "Turns a number into its word representation, digit by digit.",
    de: "Wandelt eine Zahl Ziffer für Ziffer in ihre Wortdarstellung um.",
    it: "Converte un numero nella sua rappresentazione a parole, cifra per cifra.",
  },
  "html.input.trans.regex.json": {
    en: "Replaces the parts of the input value matched by a regular expression.",
    de: "Ersetzt die Teile des Eingabewerts, die einem regulären Ausdruck entsprechen.",
    it: "Sostituisce le parti del valore di input corrispondenti a un'espressione regolare.",
  },
  "html.input.transformer.json": {
    en: "Base functionality that applies a value transformer to a text input (used by the transformer variants).",
    de: "Basisfunktionalität, die einen Wert-Transformer auf ein Textfeld anwendet (von den Transformer-Varianten genutzt).",
    it: "Funzionalità di base che applica un trasformatore di valore a un campo di testo (usata dalle varianti transformer).",
  },
  "html.panel.json": {
    en: "Turns the tagged container into a collapsible, optionally auto-titled panel.",
    de: "Verwandelt den markierten Container in ein einklappbares Panel mit optional automatischem Titel.",
    it: "Trasforma il contenitore contrassegnato in un pannello comprimibile con titolo automatico opzionale.",
  },
  "html.panel.accordion.json": {
    en: "Groups several HTML.Panel panels into an accordion where only one panel is open at a time.",
    de: "Gruppiert mehrere HTML.Panel-Panels zu einem Akkordeon, bei dem nur ein Panel gleichzeitig geöffnet ist.",
    it: "Raggruppa più pannelli HTML.Panel in una fisarmonica in cui è aperto un solo pannello alla volta.",
  },
  "html.select.favorites.json": {
    en: "Rearranges and pre-selects the options of a select element (favorites, divider, default).",
    de: "Ordnet die Optionen eines Select-Elements neu an und wählt sie vor (Favoriten, Trenner, Standard).",
    it: "Riordina e preseleziona le opzioni di un elemento select (preferiti, separatore, predefinito).",
  },
  "html.select.injection.json": {
    en: "Populates a select element with dynamically generated options.",
    de: "Befüllt ein Select-Element mit dynamisch erzeugten Optionen.",
    it: "Popola un elemento select con opzioni generate dinamicamente.",
  },
  "html.setattribute.json": {
    en: "Sets one or more HTML attributes on the tagged element.",
    de: "Setzt ein oder mehrere HTML-Attribute auf dem markierten Element.",
    it: "Imposta uno o più attributi HTML sull'elemento contrassegnato.",
  },
  "html.text.injector.json": {
    en: "Injects a dynamic value into a text field, textarea or span by replacing a placeholder.",
    de: "Fügt einen dynamischen Wert in ein Textfeld, eine Textarea oder ein Span ein, indem ein Platzhalter ersetzt wird.",
    it: "Inietta un valore dinamico in un campo di testo, una textarea o uno span sostituendo un segnaposto.",
  },
  "html.text.mapper.json": {
    en: "Fills [(property)] placeholders in a text template from an object or an array of objects.",
    de: "Füllt [(Eigenschaft)]-Platzhalter in einer Textvorlage aus einem Objekt oder einem Array von Objekten.",
    it: "Riempie i segnaposto [(proprietà)] in un modello di testo da un oggetto o un array di oggetti.",
  },
  "json.set.json": {
    en: "Stores a JSON-serialized value (from another element or object) into a hidden field.",
    de: "Speichert einen JSON-serialisierten Wert (aus einem anderen Element oder Objekt) in einem versteckten Feld.",
    it: "Memorizza un valore serializzato in JSON (da un altro elemento o oggetto) in un campo nascosto.",
  },
  "ldap.autocomplete.json": {
    en: "Autocompletes a text field with matches from an LDAP directory search.",
    de: "Vervollständigt ein Textfeld automatisch mit Treffern aus einer LDAP-Verzeichnissuche.",
    it: "Completa automaticamente un campo di testo con i risultati di una ricerca nella directory LDAP.",
  },
  "ldap.autocomplete.set.json": {
    en: "Fills several fields of a container from a selected LDAP directory match.",
    de: "Füllt mehrere Felder eines Containers aus einem ausgewählten LDAP-Verzeichnistreffer.",
    it: "Compila più campi di un contenitore da un risultato selezionato della directory LDAP.",
  },
  "matomo.tracking.json": {
    en: "Adds Matomo (Piwik) analytics tracking to the form.",
    de: "Fügt dem Formular Matomo-(Piwik-)Tracking hinzu.",
    it: "Aggiunge il tracciamento analitico Matomo (Piwik) al modulo.",
  },
  "media.image.cropper.json": {
    en: "Adds an interactive crop dialog for images before they are uploaded.",
    de: "Fügt vor dem Hochladen einen interaktiven Zuschneide-Dialog für Bilder hinzu.",
    it: "Aggiunge una finestra interattiva di ritaglio per le immagini prima del caricamento.",
  },
  "media.input.speech.json": {
    en: "Enables speech-to-text dictation in a text field via the Web Speech API.",
    de: "Aktiviert Sprache-zu-Text-Diktat in einem Textfeld über die Web-Speech-API.",
    it: "Abilita la dettatura vocale in un campo di testo tramite la Web Speech API.",
  },
  "media.input.speech.whisper.json": {
    en: "Enables speech-to-text dictation via a self-hosted Whisper model (GDPR-compliant).",
    de: "Aktiviert Sprache-zu-Text-Diktat über ein selbst gehostetes Whisper-Modell (DSGVO-konform).",
    it: "Abilita la dettatura vocale tramite un modello Whisper self-hosted (conforme al GDPR).",
  },
  "media.multipleupload.json": {
    en: "Allows an upload field to accept several files, with an optional maximum and messages.",
    de: "Ermöglicht einem Upload-Feld, mehrere Dateien zu akzeptieren, mit optionalem Maximum und Meldungen.",
    it: "Consente a un campo di upload di accettare più file, con un massimo opzionale e messaggi.",
  },
  "onchange.conditional.json": {
    en: "Applies a functionality to an element only while a comparison between two fields is satisfied.",
    de: "Wendet eine Funktionalität nur auf ein Element an, solange ein Vergleich zwischen zwei Feldern erfüllt ist.",
    it: "Applica una funzionalità a un elemento solo quando è soddisfatto un confronto tra due campi.",
  },
  "openplz.autocomplete.json": {
    en: "Autocompletes address fields (postal code, locality, street, house number) via the OpenPLZ API.",
    de: "Vervollständigt Adressfelder (PLZ, Ort, Straße, Hausnummer) automatisch über die OpenPLZ-API.",
    it: "Completa automaticamente i campi dell'indirizzo (CAP, località, via, civico) tramite l'API OpenPLZ.",
  },
  "print.remove.json": {
    en: "Hides the tagged element (or a selected ancestor) when the form is printed.",
    de: "Blendet das markierte Element (oder einen ausgewählten Vorfahren) beim Drucken des Formulars aus.",
    it: "Nasconde l'elemento contrassegnato (o un antenato selezionato) quando il modulo viene stampato.",
  },
  "security.captcha.google.json": {
    en: "Adds a Google reCAPTCHA check to protect the form from bots.",
    de: "Fügt eine Google-reCAPTCHA-Prüfung hinzu, um das Formular vor Bots zu schützen.",
    it: "Aggiunge una verifica Google reCAPTCHA per proteggere il modulo dai bot.",
  },
  "sv.json": {
    en: "Copies the values of URL parameters into CodBi global variables.",
    de: "Kopiert die Werte von URL-Parametern in CodBi-Globalvariablen.",
    it: "Copia i valori dei parametri URL nelle variabili globali CodBi.",
  },
  "sys.log.console.json": {
    en: "Logs values to the browser developer console (for debugging).",
    de: "Protokolliert Werte in der Browser-Entwicklerkonsole (zum Debuggen).",
    it: "Registra i valori nella console per sviluppatori del browser (per il debug).",
  },
  "time.frame.json": {
    en: "Validates a time range so the minimum time cannot be after the maximum time.",
    de: "Validiert einen Zeitbereich, sodass die Mindestzeit nicht nach der Höchstzeit liegt.",
    it: "Convalida un intervallo di orari affinché l'orario minimo non sia successivo a quello massimo.",
  },
};

function main() {
  const files = readdirSync(FUNC_DIR).filter((f) => f.endsWith(".json"));
  let written = 0;
  const missing = [];

  for (const file of files) {
    const summary = SUMMARIES[file];
    if (!summary) {
      missing.push(file);
      continue;
    }
    const path = join(FUNC_DIR, file);
    const raw = JSON.parse(readFileSync(path, "utf8"));

    // Rebuild the object so `Summary` sits directly after `Description` (readability), keeping every
    // other key in its original order.
    const out = {};
    for (const [key, value] of Object.entries(raw)) {
      out[key] = value;
      if (key === "Description") {
        out.Summary = { en: summary.en, de: summary.de, it: summary.it };
      }
    }
    if (!("Summary" in out)) {
      out.Summary = { en: summary.en, de: summary.de, it: summary.it };
    }

    writeFileSync(path, `${JSON.stringify(out, null, 2)}\n`, "utf8");
    written += 1;
  }

  console.log(`Processed ${files.length} functionality JSON file(s); wrote ${written}.`);
  if (missing.length) {
    console.log("No summary defined for:");
    for (const m of missing) console.log(`  ${m}`);
  }
}

main();
