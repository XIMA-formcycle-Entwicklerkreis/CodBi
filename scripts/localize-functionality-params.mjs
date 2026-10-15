/**
 * Injects `descriptionDe` / `descriptionIt` (German + Italian parameter descriptions) into every
 * `parameters[*]` entry of the functionality JSON definitions.
 *
 * The source of truth for the English text is `parameters[*].description`. The translations below
 * are keyed by file name -> parameter key and hold the German (`de`) and Italian (`it`) strings.
 *
 * Usage: node scripts/localize-functionality-params.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FUNC_DIR = join(__dirname, "..", "src", "main", "web", "packages", "form", "src", "js", "Functionalities");

/**
 * Translations keyed by file name -> parameter key -> { de, it }.
 * Only entries that need a translation are listed; entries not listed keep their English `description`.
 */
const TRANSLATIONS = {
  "ai.llama.chat.json": {
    MaxPages: {
      de: "Maximale Anzahl zu verarbeitender PDF-Seiten (Standard: 5). 0 deaktiviert das Limit.",
      it: "Numero massimo di pagine PDF da elaborare (predefinito: 5). 0 disabilita il limite.",
    },
    Rotation: {
      de: "Bilddrehung in Grad (90, 180 oder 270). 0 oder leer bedeutet, dass die Drehung unbekannt ist.",
      it: "Rotazione immagine in gradi (90, 180 o 270). 0 o vuoto indica rotazione sconosciuta.",
    },
    MaxPixelSize: {
      de: "Maximales Gesamtpixelbudget (Breite × Höhe). Größere Bilder werden clientseitig unter Beibehaltung des Seitenverhältnisses verkleinert. Standard: 3211264. 0 deaktiviert die Verkleinerung.",
      it: "Budget pixel totale massimo (larghezza × altezza). Le immagini più grandi vengono ridimensionate lato client mantenendo le proporzioni. Predefinito: 3211264. 0 disabilita il ridimensionamento.",
    },
    LLAMAbubble: {
      de: "Hintergrundfarbe für die Llama-(KI-)Chatblasen (Standard: #e5e5ea).",
      it: "Colore di sfondo per le bolle chat Llama (AI) (predefinito: #e5e5ea).",
    },
    UserBubble: {
      de: "Hintergrundfarbe für die Chatblasen des Benutzers (Standard: #0b93f6).",
      it: "Colore di sfondo per le bolle chat dell'utente (predefinito: #0b93f6).",
    },
    WelcomeText: {
      de: "Text nach dem/dem Modellnamen in der Bereitschaftsnachricht (Standard: 'Chat bereit. Datei(en) anhängen und Frage eingeben.').",
      it: "Testo mostrato dopo i nomi dei modelli nel messaggio di pronto (predefinito: 'Chat pronta. Allega file e digita la tua domanda.').",
    },
    WaitingText: {
      de: "Text, der angezeigt wird, während auf den KI-Server gewartet wird (Standard: 'Warte auf KI-Server...').",
      it: "Testo mostrato mentre si attende che il server AI sia disponibile (predefinito: 'Attendere il server AI...').",
    },
    LowConfidenceText: {
      de: "Warntext, der angezeigt wird, wenn die KI-Antwort eine geringe Sicherheit hat (Standard: 'Geringe Sicherheit').",
      it: "Testo di avviso mostrato quando la risposta AI ha bassa confidenza (predefinito: 'Confidenza bassa').",
    },
    RethinkButtonText: {
      de: "Button-Label, das anbietet, mit dem Denkmodell erneut zu antworten (Standard: 'Neu denken').",
      it: "Etichetta del pulsante per rispondere nuovamente con il modello di ragionamento (predefinito: 'Riprova').",
    },
    UncertainText: {
      de: "Tooltip-Text beim Überfahren unsicherer (niedrig-sicherer) Token (Standard: 'Geringe Sicherheit').",
      it: "Testo del tooltip al passaggio del mouse sui token incerti (bassa confidenza) (predefinito: 'Confidenza bassa').",
    },
    ShowUncertainTokens: {
      de: "Ob unsichere Token in KI-Antworten visuell hervorgehoben werden sollen. 'false' deaktiviert die Hervorhebung (Standard: 'true').",
      it: "Se evidenziare visivamente i token incerti nelle risposte AI. 'false' disabilita l'evidenziazione (predefinito: 'true').",
    },
    VoiceHotkey: {
      de: "Tastenkürzel zum Umschalten der Spracheingabe, z. B. 'Alt+A' (Standard: 'Alt+A'). Format: Modifikator(en) + Taste, getrennt durch '+'.",
      it: "Scorciatoia da tastiera per attivare l'input vocale, es. 'Alt+A' (predefinito: 'Alt+A'). Formato: modificatore/i + tasto separati da '+'.",
    },
    VoicePlaceholder: {
      de: "Platzhaltertext im Chat-Eingabefeld, wenn Spracheingabe verfügbar ist (Standard: 'Alt+A = Mikrofon an/aus | Alt+Q = Mikrofon aus + senden').",
      it: "Testo segnaposto mostrato nell'input chat quando l'input vocale è disponibile (predefinito: 'Alt+A = mic on/off | Alt+Q = mic off + invia').",
    },
    VoiceSendHotkey: {
      de: "Tastenkürzel zum Stoppen der Aufnahme und Senden, z. B. 'Alt+Q' (Standard: 'Alt+Q').",
      it: "Scorciatoia da tastiera per fermare la registrazione e inviare, es. 'Alt+Q' (predefinito: 'Alt+Q').",
    },
    Language: {
      de: "Sprachcode für Whisper-Sprach-zu-Text (z. B. 'de', 'en'). Leer bedeutet Auto-Erkennung.",
      it: "Codice lingua per Whisper speech-to-text (es. 'de', 'en'). Vuoto o non impostato indica rilevamento automatico.",
    },
    ResponseLanguage: {
      de: "Zweistelliger ISO-639-1-Code (z. B. 'de', 'fr'). Wenn gesetzt, wird die KI gezwungen, in dieser Sprache zu antworten.",
      it: "Codice ISO 639-1 di due lettere (es. 'de', 'fr'). Se impostato, l'AI è obbligata a rispondere in questa lingua.",
    },
    Specialist: {
      de: "Name eines Spezialistenmodells, das über eine AI_LLAMA_STD_SPECIALIST_XXX-Plugin-Eigenschaft registriert ist. Leitet Anfragen an den Server dieses Spezialisten weiter.",
      it: "Nome di un modello specialista registrato tramite una proprietà plugin AI_LLAMA_STD_SPECIALIST_XXX. Instrada le richieste al server di quello specialista.",
    },
    QueueBadge: {
      de: "Wenn auf 'true' gesetzt, wird während des Wartens auf die Inferenz ein Abzeichen mit der aktuellen Warteschlangenposition angezeigt.",
      it: "Se impostato su 'true', mostra un badge con la posizione corrente in coda mentre si attende l'inferenza.",
    },
    QueueText: {
      de: "Text, der nach der Warteschlangenpositionsnummer im Abzeichen angehängt wird (z. B. 'in Warteschlange' zeigt '3 in Warteschlange'). Standard: leer.",
      it: "Testo aggiunto dopo il numero di posizione in coda nel badge (es. 'in coda' mostra '3 in coda'). Predefinito: vuoto.",
    },
    AlertOnFinishText: {
      de: "Text, der in der Meldung angezeigt wird, wenn die Inferenz abgeschlossen ist (wenn die Option Meldung-bei-Fertigstellung aktiviert ist).",
      it: "Testo mostrato nell'avviso quando l'inferenza termina (quando l'opzione avviso-al-termine è abilitata).",
    },
    FilterResults: {
      de: "Wenn auf 'true' gesetzt, wird die PII-Filterung bei Brave-Search-Abfragen für diese Instanz aktiviert.",
      it: "Se impostato su 'true', abilita il filtraggio PII sulle query di Brave Search per questa istanza.",
    },
  },
  "ai.llama.standard.qa.json": {
    MaxPages: {
      de: "Optionale Zahl, die begrenzt, wie viele Seiten aus einer PDF verarbeitet und an die KI gesendet werden. 0 verarbeitet alle Seiten. Standard: 5.",
      it: "Numero opzionale che limita quante pagine di un PDF vengono elaborate e inviate all'AI. 0 elabora tutte le pagine. Predefinito: 5.",
    },
    Rotation: {
      de: "Optionale Bilddrehung, die auf alle Dateien angewendet wird: '90', '180' oder '270'. Nützlich für Multi-Datei-Uploads oder PDFs mit mehreren Bildern.",
      it: "Rotazione immagine opzionale applicata a tutti i file: '90', '180' o '270'. Utile per caricamenti multi-file o PDF con più immagini.",
    },
    MaxPixelSize: {
      de: "Maximales Gesamtpixelbudget (Breite × Höhe). Größere Bilder werden clientseitig unter Beibehaltung des Seitenverhältnisses verkleinert. Standard: 3211264. 0 deaktiviert die Verkleinerung.",
      it: "Budget pixel totale massimo (larghezza × altezza). Le immagini più grandi vengono ridimensionate lato client mantenendo le proporzioni. Predefinito: 3211264. 0 disabilita il ridimensionamento.",
    },
    AIHint: {
      de: "Text, der in KI-befüllten Feldern angezeigt wird, bis der Benutzer den Wert bearbeitet. Standard: '✨ KI-generiert'. Leer setzen zum Deaktivieren.",
      it: "Testo mostrato nei campi compilati dall'AI finché l'utente non modifica il valore. Predefinito: '✨ Generato da AI'. Vuoto per disabilitare.",
    },
    InternetAccess: {
      de: "Wenn auf true gesetzt, wird Brave-Search-Internetzugriff für diese Instanz aktiviert. Standard: false.",
      it: "Se impostato su true, abilita l'accesso internet di Brave Search per questa istanza. Predefinito: false.",
    },
    Thinking: {
      de: "Wenn auf true gesetzt, wird der Denkmodus mithilfe eines dedizierten Denkmodells für tiefere Argumentation aktiviert. Standard: false.",
      it: "Se impostato su true, abilita la modalità di ragionamento usando un modello dedicato per un'analisi più approfondita. Predefinito: false.",
    },
    MaxThinkingTokens: {
      de: "Maximales Tokenbudget für Denk-Inferenz. Im Verify-Modus Standard 512. Keine Wirkung, wenn Thinking false ist.",
      it: "Budget token massimo per l'inferenza di ragionamento. In modalità verify il valore predefinito è 512. Nessun effetto se Thinking è false.",
    },
    Mode: {
      de: "Wenn auf 'verify' gesetzt, kann das Upload-Feld ein data-cb-Question-Attribut haben; die KI-Antwort muss die positive Antwort sein, damit die Datei akzeptiert wird.",
      it: "Se impostato su 'verify', il campo di caricamento può avere un attributo data-cb-Question; la risposta AI deve essere quella positiva affinché il file venga accettato.",
    },
    PositiveResponse: {
      de: "Die erwartete positive Antwort der KI im Verify-Modus. Der Vergleich ist standardmäßig case-insensitiv. Standard: 'yes'.",
      it: "La risposta positiva attesa dall'AI in modalità verify. Il confronto è senza distinzione tra maiuscole e minuscole per impostazione predefinita. Predefinito: 'yes'.",
    },
    CaseInsensitive: {
      de: "Wenn true (Standard), wird die KI-Antwort vor dem Vergleich mit PositiveResponse in Kleinbuchstaben umgewandelt.",
      it: "Se true (predefinito), la risposta AI viene convertita in minuscolo prima del confronto con PositiveResponse.",
    },
    VerifyErrorText: {
      de: "Fehlermeldung, die angezeigt wird, wenn die Datei die Verifizierung nicht besteht. Standard: 'Die Datei erfüllt die Verifizierungskriterien nicht.'",
      it: "Messaggio di errore mostrato quando il file non supera la verifica. Predefinito: 'Il file non soddisfa i criteri di verifica.'",
    },
    VerifyCheckboxLabel: {
      de: "Label für das manuelle Verifizierungskontrollkästchen, das angezeigt wird, wenn die Verifizierung fehlschlägt.",
      it: "Etichetta per la casella di verifica manuale mostrata quando la verifica fallisce.",
    },
    Location: {
      de: "Wenn auf true gesetzt, wird der Geolokalisierungszugriff aktiviert, sodass die Koordinaten des Benutzers an die KI gesendet werden. Standard: false.",
      it: "Se impostato su true, abilita l'accesso alla geolocalizzazione così le coordinate dell'utente vengono inviate all'AI. Predefinito: false.",
    },
    ResponseLanguage: {
      de: "Zweistelliger ISO-639-1-Code (z. B. 'de', 'fr'). Erzwingt, dass die KI in dieser Sprache antwortet, und überspringt die Auto-Erkennung.",
      it: "Codice ISO 639-1 di due lettere (es. 'de', 'fr'). Obbliga l'AI a rispondere in questa lingua, saltando il rilevamento automatico.",
    },
    Specialist: {
      de: "Name eines Spezialistenmodells, das über eine AI_LLAMA_STD_SPECIALIST_XXX-Plugin-Eigenschaft registriert ist. Leitet Anfragen an den Server dieses Spezialisten weiter.",
      it: "Nome di un modello specialista registrato tramite una proprietà plugin AI_LLAMA_STD_SPECIALIST_XXX. Instrada le richieste al server di quello specialista.",
    },
    QueueBadge: {
      de: "Wenn auf 'true' gesetzt, wird während des Wartens auf die Inferenz ein Abzeichen mit der aktuellen Warteschlangenposition angezeigt.",
      it: "Se impostato su 'true', mostra un badge con la posizione corrente in coda mentre si attende l'inferenza.",
    },
    QueueText: {
      de: "Text, der nach der Warteschlangenpositionsnummer im Abzeichen angehängt wird (z. B. 'in Warteschlange' zeigt '3 in Warteschlange'). Standard: leer.",
      it: "Testo aggiunto dopo il numero di posizione in coda nel badge (es. 'in coda' mostra '3 in coda'). Predefinito: vuoto.",
    },
    FilterResults: {
      de: "Wenn auf 'true' gesetzt, wird die PII-Filterung bei Brave-Search-Abfragen für diese Instanz aktiviert.",
      it: "Se impostato su 'true', abilita il filtraggio PII sulle query di Brave Search per questa istanza.",
    },
    Question: {
      de: "Die Frage an die KI über das hochgeladene Dokument. Kann auf Felder/Symbole verweisen.",
      it: "La domanda da porre all'AI sul documento caricato. Può fare riferimento a campi/simboli.",
    },
    QuestionRoot: {
      de: "Optionaler CSS-Selektor, der ein alternatives Wurzelelement angibt, von dem aus nach Fragenelementen gesucht wird.",
      it: "Selettore CSS opzionale che specifica un elemento radice alternativo da cui cercare gli elementi della domanda.",
    },
  },
  "ai.llama.standard.txtqa.json": {
    AIHint: {
      de: "Text, der in KI-befüllten Feldern angezeigt wird, bis der Benutzer den Wert bearbeitet. Standard: '✨ KI-generiert'. Leer setzen zum Deaktivieren.",
      it: "Testo mostrato nei campi compilati dall'AI finché l'utente non modifica il valore. Predefinito: '✨ Generato da AI'. Vuoto per disabilitare.",
    },
    useinternet: {
      de: "Wenn auf true gesetzt, wird Brave-Search-Internetzugriff aktiviert. Standard: false.",
      it: "Se impostato su true, abilita l'accesso internet di Brave Search. Predefinito: false.",
    },
    debounce: {
      de: "Entprellverzögerung in Millisekunden vor dem Senden der Anfrage nach dem letzten Änderungsereignis. Standard: 500.",
      it: "Ritardo di debounce in millisecondi prima di inviare la richiesta dopo l'ultimo evento di modifica. Predefinito: 500.",
    },
    inferencedelay: {
      de: "Maximale Sekunden, die auf das Auffüllen aller Quellfelder gewartet wird, bevor die Inferenz trotzdem gestartet wird. Standard: 5.",
      it: "Secondi massimi di attesa per il riempimento di tutti i campi sorgente prima di iniziare comunque l'inferenza. Predefinito: 5.",
    },
    language: {
      de: "Sprache für die KI-Antwort (z. B. 'Deutsch', 'Englisch'). Hängt 'Antworte in {language}.' an jede Frage an.",
      it: "Lingua per la risposta AI (es. 'Tedesco', 'Italiano'). Aggiunge 'Rispondi in {language}.' a ogni domanda.",
    },
    Location: {
      de: "Wenn auf true gesetzt, wird der Geolokalisierungszugriff aktiviert. Die Koordinaten des Benutzers werden für ortsabhängige Antworten an die KI gesendet. Standard: false.",
      it: "Se impostato su true, abilita l'accesso alla geolocalizzazione. Le coordinate dell'utente vengono inviate all'AI per risposte basate sulla posizione. Predefinito: false.",
    },
    ResponseLanguage: {
      de: "Zweistelliger ISO-639-1-Code (z. B. 'de', 'fr'). Erzwingt, dass die KI in dieser Sprache antwortet, und überspringt die Auto-Erkennung.",
      it: "Codice ISO 639-1 di due lettere (es. 'de', 'fr'). Obbliga l'AI a rispondere in questa lingua, saltando il rilevamento automatico.",
    },
    Specialist: {
      de: "Name eines Spezialistenmodells, das über eine AI_LLAMA_STD_SPECIALIST_XXX-Plugin-Eigenschaft registriert ist. Leitet Anfragen an den Server dieses Spezialisten weiter.",
      it: "Nome di un modello specialista registrato tramite una proprietà plugin AI_LLAMA_STD_SPECIALIST_XXX. Instrada le richieste al server di quello specialista.",
    },
    QueueBadge: {
      de: "Wenn auf 'true' gesetzt, wird während des Wartens auf die Inferenz ein Abzeichen mit der aktuellen Warteschlangenposition angezeigt.",
      it: "Se impostato su 'true', mostra un badge con la posizione corrente in coda mentre si attende l'inferenza.",
    },
    QueueText: {
      de: "Text, der nach der Warteschlangenpositionsnummer im Abzeichen angehängt wird (z. B. 'in Warteschlange' zeigt '3 in Warteschlange'). Standard: leer.",
      it: "Testo aggiunto dopo il numero di posizione in coda nel badge (es. 'in coda' mostra '3 in coda'). Predefinito: vuoto.",
    },
    FilterResults: {
      de: "Wenn auf 'true' gesetzt, wird die PII-Filterung bei Brave-Search-Abfragen für diese Instanz aktiviert.",
      it: "Se impostato su 'true', abilita il filtraggio PII sulle query di Brave Search per questa istanza.",
    },
    QuestionRoot: {
      de: "Optionaler CSS-Selektor, der ein alternatives Wurzelelement angibt, von dem aus nach Frage- und Quellenelementen gesucht wird.",
      it: "Selettore CSS opzionale che specifica un elemento radice alternativo da cui cercare gli elementi di domanda e sorgente.",
    },
  },
  "ai.llama.standard.txtverify.json": {
    Question: {
      de: "Verifizierungsfrage. Unterstützt <[this]>- und <[CSSClass]>-Platzhalter. Wird durch das data-cb-Question-Attribut überschrieben, falls vorhanden.",
      it: "Domanda di verifica. Supporta i segnaposto <[this]> e <[CSSClass]>. Sovrascritta dall'attributo data-cb-Question se presente.",
    },
    PositiveResponse: {
      de: "Das einzelne Wort, mit dem die KI antworten muss, um Gültigkeit zu signalisieren. Der Vergleich ist standardmäßig case-insensitiv. Standard: 'yes'.",
      it: "L'unica parola con cui l'AI deve rispondere per segnalare la validità. Il confronto è senza distinzione tra maiuscole e minuscole per impostazione predefinita. Predefinito: 'yes'.",
    },
    CaseInsensitive: {
      de: "Wenn true (Standard), wird die KI-Antwort vor dem Vergleich in Kleinbuchstaben umgewandelt. Auf 'false' setzen für exaktes (case-sensitives) Matching.",
      it: "Se true (predefinito), la risposta AI viene convertita in minuscolo prima del confronto. Impostare su 'false' per un confronto esatto (case-sensitive).",
    },
    VerifyErrorText: {
      de: "Fallback-Fehlermeldung, die nur verwendet wird, wenn die KI eine leere Antwort zurückgibt. Standard: 'Der eingegebene Text erfüllt die Verifizierungskriterien nicht.'",
      it: "Messaggio di errore di fallback utilizzato solo quando l'AI restituisce una risposta vuota. Predefinito: 'Il testo inserito non soddisfa i criteri di verifica.'",
    },
    VerifyCheckboxLabel: {
      de: "Label für das manuelle Überschreibungskontrollkästchen, das bei einem Fehler angezeigt wird.",
      it: "Etichetta per la casella di override manuale mostrata in caso di errore.",
    },
    InternetAccess: {
      de: "Wenn 'true', wird der Brave-Search-Internetzugriff aktiviert. Standard: false.",
      it: "Se 'true', abilita l'accesso internet di Brave Search. Predefinito: false.",
    },
    Thinking: {
      de: "Wenn 'true', wird der Denkmodus aktiviert. Standard: false.",
      it: "Se 'true', abilita la modalità di ragionamento. Predefinito: false.",
    },
    MaxThinkingTokens: {
      de: "Tokenbudget für das Denken. Standard 512, wenn Thinking aktiviert ist.",
      it: "Budget token per il ragionamento. Il valore predefinito è 512 quando Thinking è abilitato.",
    },
    Language: {
      de: "Voller Sprachname (z. B. 'Deutsch', 'Deutsch') wird als 'Antworte in {Language}.' an die an die KI gesendete Antwortanweisung angehängt.",
      it: "Nome completo della lingua (es. 'Tedesco', 'Deutsch') aggiunto come 'Rispondi in {Language}.' all'istruzione di risposta inviata all'AI.",
    },
    ResponseLanguage: {
      de: "Zweistelliger ISO-639-1-Code (z. B. 'de', 'fr') zur Erzwingung der KI-Antwortsprache.",
      it: "Codice ISO 639-1 di due lettere (es. 'de', 'fr') per imporre la lingua di risposta dell'AI.",
    },
    Specialist: {
      de: "Name eines Spezialistenmodells, das über eine AI_LLAMA_STD_SPECIALIST_XXX-Plugin-Eigenschaft registriert ist.",
      it: "Nome di un modello specialista registrato tramite una proprietà plugin AI_LLAMA_STD_SPECIALIST_XXX.",
    },
    QueueBadge: {
      de: "Wenn auf 'true' gesetzt, wird während des Wartens auf die Inferenz ein Abzeichen mit der aktuellen Warteschlangenposition angezeigt.",
      it: "Se impostato su 'true', mostra un badge con la posizione corrente in coda mentre si attende l'inferenza.",
    },
    QueueText: {
      de: "Text, der nach der Warteschlangenpositionsnummer im Abzeichen angehängt wird (z. B. 'in Warteschlange' zeigt '3 in Warteschlange'). Standard: leer.",
      it: "Testo aggiunto dopo il numero di posizione in coda nel badge (es. 'in coda' mostra '3 in coda'). Predefinito: vuoto.",
    },
    FilterResults: {
      de: "Wenn auf 'true' gesetzt, wird die PII-Filterung bei Brave-Search-Abfragen für diese Instanz aktiviert.",
      it: "Se impostato su 'true', abilita il filtraggio PII sulle query di Brave Search per questa istanza.",
    },
    QuestionRoot: {
      de: "Optionaler CSS-Selektor, der ein alternatives Wurzelelement angibt, von dem aus nach Elementen gesucht wird, auf die <[CSSClass]>-Platzhalter verweisen.",
      it: "Selettore CSS opzionale che specifica un elemento radice alternativo da cui cercare gli elementi referenziati dai segnaposto <[CSSClass]>.",
    },
  },
  "ai.ocr.json": {
    Mode: {
      de: "Entweder Print, Verify oder Extract Fields.",
      it: "Una delle modalità: Print, Verify o Extract Fields.",
    },
    Pattern: {
      de: "Der reguläre Ausdruck zum Extrahieren von Teilzeichenfolgen aus dem gescannten Text oder zum Verifizieren, dass der gescannte Text dem Muster entspricht.",
      it: "L'espressione regolare usata per estrarre sottostringhe dal testo scansionato o per verificare che il testo scansionato corrisponda al pattern.",
    },
    Separator: {
      de: "Wenn Mode Extract Fields ist, definiert dies das Trennzeichen für die Ergebnisse mehrerer Dateien. Standard ist ein Komma.",
      it: "Se Mode è Extract Fields, definisce il separatore per i risultati di più file. Il valore predefinito è una virgola.",
    },
    MaxPages: {
      de: "Maximale Anzahl zu verarbeitender PDF-Seiten (Standard: 5). 0 deaktiviert das Limit. Gilt nur für PDFs.",
      it: "Numero massimo di pagine PDF da elaborare (predefinito: 5). 0 disabilita il limite. Si applica solo ai PDF.",
    },
    FieldPattern_: {
      de: "Für jedes Feld, das im Extract-Fields-Modus eine extrahierte Teilzeichenfolge erhält, definiert ein Pattern_<field>-Parameter den zu verwendenden regulären Ausdruck.",
      it: "Per ogni campo che riceve una sottostringa estratta in modalità Extract Fields, un parametro Pattern_<field> definisce l'espressione regolare da usare.",
    },
    RegExFlags: {
      de: "Optionale Regex-Flags, die auf alle Muster angewendet werden (z. B. 'i' case-insensitiv, 'm' multiline, 's' dotall). Mehrere Flags können kombiniert werden.",
      it: "Flag regex opzionali applicati a tutti i pattern (es. 'i' senza distinzione maiuscole/minuscole, 'm' multilinea, 's' dotall). Più flag possono essere combinati.",
    },
    Preprocess: {
      de: "Ob die Bildvorverarbeitung vor der OCR aktiviert werden soll (Graustufen, adaptive Binarisierung, Rauschunterdrückung). Standard: false.",
      it: "Se abilitare la pre-elaborazione delle immagini prima dell'OCR (scala di grigi, binarizzazione adattiva, riduzione del rumore). Predefinito: false.",
    },
    ProcessingImageText: {
      de: "Der Text, der dem Label des Eingabefelds angehängt wird, während die Bilder verarbeitet werden.",
      it: "Il testo aggiunto all'etichetta dell'input mentre le immagini vengono elaborate.",
    },
    InvalidImageText: {
      de: "Der Text, der angezeigt wird, wenn eines oder mehrere Bilder im Verify-Modus nicht dem angegebenen Muster entsprechen.",
      it: "Il testo visualizzato se una o più immagini non sono conformi al pattern specificato in modalità Verify.",
    },
    WrongFileMessage: {
      de: "Der Text, der für das Label des manuellen Verifizierungskontrollkästchens im Verify-Modus angezeigt wird.",
      it: "Il testo visualizzato per l'etichetta della casella di verifica manuale in modalità Verify.",
    },
    Maximum: {
      de: "Die Anzahl der Dateien, die hochgeladen werden dürfen. Wenn überschritten, wird die Verarbeitung abgebrochen und eine Warnung protokolliert.",
      it: "Il numero di file che possono essere caricati. Se superato, l'elaborazione si interrompe e viene registrato un avviso.",
    },
    Field: {
      de: "Der Feldname, der mit data-cb-Field abgeglichen wird, um extrahierten Text im Extract-Fields-/Print-Modus zu empfangen.",
      it: "Il nome del campo abbinato a data-cb-Field per ricevere il testo estratto in modalità Extract Fields / Print.",
    },
    QueueBadge: {
      de: "Wenn auf 'true' gesetzt, wird während des Wartens auf die Inferenz ein Abzeichen mit der aktuellen Warteschlangenposition angezeigt.",
      it: "Se impostato su 'true', mostra un badge con la posizione corrente in coda mentre si attende l'inferenza.",
    },
    QueueText: {
      de: "Text, der nach der Warteschlangenpositionsnummer im Abzeichen angehängt wird (z. B. 'in Warteschlange' zeigt '3 in Warteschlange'). Standard: leer.",
      it: "Testo aggiunto dopo il numero di posizione in coda nel badge (es. 'in coda' mostra '3 in coda'). Predefinito: vuoto.",
    },
  },
  "date.frame.json": {
    MaxField: {
      de: "CSS-Selektor, der das Eingabeelement auswählt, das das maximale Datum übernimmt.",
      it: "Selettore CSS che seleziona l'elemento di input che riceve la data massima.",
    },
    MsgMinInvalid: {
      de: "Die Fehlermeldung, die angezeigt wird, wenn der Wert des Mindestfelds nach dem des Höchstfelds liegt.",
      it: "Il messaggio di errore mostrato quando il valore del campo minimo è successivo a quello del campo massimo.",
    },
    MsgMaxInvalid: {
      de: "Die Fehlermeldung, die angezeigt wird, wenn der Wert des Höchstfelds vor dem des Mindestfelds liegt.",
      it: "Il messaggio di errore mostrato quando il valore del campo massimo è precedente a quello del campo minimo.",
    },
    EqualityPermitted: {
      de: "Ob Gleichheit zwischen Mindest- und Höchstdatum erlaubt ist.",
      it: "Se è consentita l'uguaglianza tra le date minima e massima.",
    },
  },
  "date.min.json": {
    Minimum: {
      de: "Der Betrag an Jahren/Monaten/Wochen (gemäß Unit-Parameter) in der Vergangenheit, den das eingegebene Datum mindestens liegen muss, um gültig zu sein.",
      it: "La quantità di anni/mesi/settimane (in base al parametro Unit) nel passato che la data inserita deve avere almeno per essere valida.",
    },
    MsgHigher: {
      de: "Die Fehlermeldung, die angezeigt wird, wenn das eingegebene Datum nicht weit genug in der Vergangenheit liegt (oder mit Reverse zu weit). [%ERROR_DATE%] wird durch das minimal gültige Datum ersetzt.",
      it: "Il messaggio di errore mostrato quando la data inserita non è abbastanza lontana nel passato (o, con Reverse, troppo lontana). [%ERROR_DATE%] viene sostituito con la data minima valida.",
    },
    Delimiter: {
      de: "Das Zeichen, das Tag, Monat und Jahr trennt. Standard ist '.'.",
      it: "La stringa che separa giorno, mese e anno. Il valore predefinito è '.'.",
    },
    Reverse: {
      de: "Ob die Logik umgekehrt werden soll und Daten bis zu einem bestimmten Zukunftslimit statt eines Vergangenheitsminimums erlaubt werden (Standard: false).",
      it: "Se invertire la logica e consentire date fino a un certo limite futuro invece di un minimo nel passato (predefinito: false).",
    },
    Unit: {
      de: "Die Einheit des Minimum-Betrags: d, w, m oder y (Standard: 'y').",
      it: "L'unità della quantità Minimum: d, w, m o y (predefinito: 'y').",
    },
  },
  "date.noweekends.json": {
    MsgNoWeekends: {
      de: "Die optionale Fehlermeldung, die angezeigt wird, wenn ein Wochenenddatum eingegeben wird.",
      it: "Il messaggio di errore opzionale mostrato quando viene inserita una data del fine settimana.",
    },
  },
  "date.time.join.json": {
    DateField: {
      de: "Optionaler CSS-Selektor, der das Eingabefeld auswählt, das das Datum bereitstellt. Hat Vorrang vor der CSS-Klasse CodBi_Date_Time_Join_Date.",
      it: "Selettore CSS opzionale che seleziona l'input che fornisce la data. Ha precedenza sulla classe CSS CodBi_Date_Time_Join_Date.",
    },
    TimeField: {
      de: "Optionaler CSS-Selektor, der das Eingabefeld auswählt, das die Uhrzeit bereitstellt. Hat Vorrang vor der CSS-Klasse CodBi_Date_Time_Join_Time.",
      it: "Selettore CSS opzionale che seleziona l'input che fornisce l'ora. Ha precedenza sulla classe CSS CodBi_Date_Time_Join_Time.",
    },
    ToMillis: {
      de: "Ob das markierte Eingabefeld die getTime()-Millisekunden des kombinierten Datums statt seiner Zeichenfolgendarstellung erhält (Standard: false).",
      it: "Se l'input marcato riceve i millisecondi getTime() della data combinata invece della sua rappresentazione stringa (predefinito: false).",
    },
    Divisor: {
      de: "Optionale Zahl, durch die die Millisekunden des kombinierten Datums geteilt werden (abgerundet), bevor sie in das markierte Eingabefeld geschrieben werden. Hat Vorrang vor ToMillis.",
      it: "Numero opzionale per cui vengono divisi (con arrotondamento per difetto) i millisecondi della data combinata prima di scriverli nell'input marcato. Ha precedenza su ToMillis.",
    },
  },
  "date.time.join.span.json": {
    Begin: {
      de: "Optionaler CSS-Selektor, der das Eingabefeld auswählt, das das Anfangsdatum bereitstellt. Hat Vorrang vor der CSS-Klasse CodBi_Date_Time_Join_Span_Begin.",
      it: "Selettore CSS opzionale che seleziona l'input che fornisce la data di inizio. Ha precedenza sulla classe CSS CodBi_Date_Time_Join_Span_Begin.",
    },
    BeginTime: {
      de: "Optionaler CSS-Selektor, der das Eingabefeld auswählt, das die Anfangszeit bereitstellt. Hat Vorrang vor der CSS-Klasse CodBi_Date_Time_Join_Span_Begin_Time.",
      it: "Selettore CSS opzionale che seleziona l'input che fornisce l'ora di inizio. Ha precedenza sulla classe CSS CodBi_Date_Time_Join_Span_Begin_Time.",
    },
    End: {
      de: "Optionaler CSS-Selektor, der das Eingabefeld auswählt, das das Enddatum bereitstellt. Hat Vorrang vor der CSS-Klasse CodBi_Date_Time_Join_Span_End.",
      it: "Selettore CSS opzionale che seleziona l'input che fornisce la data di fine. Ha precedenza sulla classe CSS CodBi_Date_Time_Join_Span_End.",
    },
    EndTime: {
      de: "Optionaler CSS-Selektor, der das Eingabefeld auswählt, das die Endzeit bereitstellt. Hat Vorrang vor der CSS-Klasse CodBi_Date_Time_Join_Span_End_Time.",
      it: "Selettore CSS opzionale che seleziona l'input che fornisce l'ora di fine. Ha precedenza sulla classe CSS CodBi_Date_Time_Join_Span_End_Time.",
    },
    MsgInvalid: {
      de: "Die optionale Fehlermeldung, die angezeigt wird, wenn das verbundene Enddatum/-zeit kleiner oder gleich dem verbundenen Anfangsdatum/-zeit ist (Standard: eine Standardmeldung).",
      it: "Il messaggio di errore opzionale mostrato quando la data/ora di fine combinata è inferiore o uguale alla data/ora di inizio combinata (predefinito: un messaggio standard).",
    },
  },
  "dq.table.view.json": {
    Columns: {
      de: "ERFORDERLICH - Eine CSV, die die anzuzeigenden Spalten definiert. Jede Spalte ist 'label;datacolumn;jsonFlag' mit einem optionalen vierten Eintrag ';width'.",
      it: "OBBLIGATORIO - Un CSV che definisce le colonne da mostrare. Ogni colonna è 'label;datacolumn;jsonFlag' con un quarto elemento opzionale ';width'.",
    },
    DataQuery: {
      de: "ERFORDERLICH - Der Name der Datasource-Abfrage auf dem Formcycle-Server, deren Ergebnis angezeigt werden soll.",
      it: "OBBLIGATORIO - Il nome della query Datasource sul server Formcycle di cui visualizzare il risultato.",
    },
    CSS: {
      de: "Optionale Zeichenfolge einer oder mehrerer (durch Leerzeichen getrennter) CSS-Klassen, die sowohl auf den markierten Container als auch auf die eingefügte Tabelle angewendet werden.",
      it: "Stringa opzionale di una o più classi CSS (separate da spazi) da applicare sia al contenitore marcato sia alla tabella iniettata.",
    },
    FileName: {
      de: "Der Name der exportierten Excel-Datei ohne Erweiterung (die Erweiterung ist immer .xlsx). Standard: 'Export'.",
      it: "Il nome del file Excel esportato senza estensione (l'estensione è sempre .xlsx). Predefinito: 'Export'.",
    },
    SheetName: {
      de: "Der Name des Arbeitsblatts innerhalb der exportierten Excel-Datei. Standard: 'sheet1'.",
      it: "Il nome del foglio di lavoro all'interno del file Excel esportato. Predefinito: 'sheet1'.",
    },
    ExportButton: {
      de: "Optionaler CSS-Selektor eines vorhandenen Buttons/Ankers, der den Export auslöst. Wenn weggelassen, ist der Excel-Export nicht verfügbar.",
      it: "Selettore CSS opzionale di un pulsante/ancora esistente che attiva l'esportazione. Se omesso, l'esportazione Excel non è disponibile.",
    },
    Centered: {
      de: "Ob der Inhalt der Tabellenzellen zentriert ist. Standard: true; auf false/0/no setzen, um die Zellen linksbündig zu lassen.",
      it: "Se il contenuto delle celle della tabella è centrato. Predefinito: true; impostare false/0/no per mantenere le celle allineate a sinistra.",
    },
    ExcludeColumns: {
      de: "Optionale CSV von Spaltennamen (abgeglichen gegen Label oder Datacolumn), die vom Excel-Export ausgeschlossen werden sollen (sie bleiben in der Tabelle sichtbar).",
      it: "CSV opzionale di nomi di colonne (abbinati a label o datacolumn) da escludere dall'esportazione Excel (restano visibili nella tabella).",
    },
  },
  "form.navigator.json": {
    Preview: {
      de: "Ob der Navigator das Wechseln zu jeder Seite erlaubt, auch wenn sie vorher nicht besucht wurde (WAHR) oder nicht (FALSCH). Standard: FALSCH.",
      it: "Se il navigatore consente di passare a ogni pagina anche se non è stata visitata prima (TRUE) o no (FALSE). Predefinito: FALSE.",
    },
    CSSNavButtons: {
      de: "Zusätzliches CSS, das auf die Navigationsbuttons des Navigators angewendet wird.",
      it: "CSS aggiuntivo applicato ai pulsanti di navigazione del navigatore.",
    },
    CSSHoverNavButtons: {
      de: "Zusätzliches CSS, das auf die Navigationsbuttons des Navigators beim Überfahren angewendet wird.",
      it: "CSS aggiuntivo applicato ai pulsanti di navigazione del navigatore al passaggio del mouse.",
    },
    CSSBlockedNavButton: {
      de: "Zusätzliches CSS, das auf die Navigationsbuttons des Navigators angewendet wird, die aus irgendeinem Grund blockiert sind.",
      it: "CSS aggiuntivo applicato ai pulsanti di navigazione del navigatore che sono bloccati per qualsiasi motivo.",
    },
  },
  "google.website.translator.json": {
    AutoLoad: {
      de: "Ob das Google-Übersetzungsskript sofort geladen werden soll (Standard: FALSCH, d. h. nur geladen, sobald das markierte Element sichtbar ist).",
      it: "Se lo script di traduzione di Google debba essere caricato immediatamente (predefinito: FALSE, cioè caricato solo quando l'elemento marcato è visibile).",
    },
    Lang: {
      de: "Der ISO-639-Sprachcode, der als Ausgangssprache der Dropdownliste verwendet wird (Standard: die Browsersprache bzw. bevorzugte Sprache oder 'en').",
      it: "Il codice lingua ISO-639 da usare come lingua iniziale del menu a tendina (predefinito: la lingua del browser/preferita o 'en').",
    },
    Inline: {
      de: "Ob das Widget inline innerhalb des markierten Elements angezeigt werden soll (Standard: WAHR). Bei FALSCH wird das Widget in einer eigenen Zeile angehängt.",
      it: "Se il widget debba essere mostrato inline all'interno dell'elemento marcato (predefinito: TRUE). Quando FALSE, il widget viene aggiunto su una riga separata.",
    },
  },
  "html.css.json": {
    CSS: {
      de: "Das zu injizierende CSS.",
      it: "Il CSS da iniettare.",
    },
    Replacements: {
      de: "Ein Array von zweiteiligen Zeichenfolgen, getrennt durch '|'. Der erste Teil ist der im CSS gefundene Platzhalter, der zweite die Zeichenfolge, durch die er ersetzt werden soll.",
      it: "Un array di stringhe a due elementi separate da '|'. La prima parte è il segnaposto trovato nel CSS, la seconda la stringa con cui deve essere sostituito.",
    },
    Darkmode: {
      de: "Die Darkmode-Ersetzungen, die alle Platzhalter ersetzen, die im bereitgestellten CSS mit '_DM' enden.",
      it: "Le sostituzioni Darkmode che sostituiscono tutti i segnaposto che terminano con '_DM' nel CSS fornito.",
    },
    Destination: {
      de: "Der Selektor, der auf das CSS-Ziel verweist.",
      it: "Il selettore che punta alla destinazione CSS.",
    },
  },
  "html.input.blacklist.json": {
    List: {
      de: "Eine CSV-Zeichenfolge verbotener Werte.",
      it: "Una stringa CSV di valori vietati.",
    },
    Prefix: {
      de: "Die Zeichenfolge, die vor der Auflistung aller Werte in List angezeigt wird, wenn eine Fehlermeldung angezeigt wird.",
      it: "La stringa da mostrare prima di elencare tutti i valori in List quando viene visualizzato un messaggio di errore.",
    },
    Postfix: {
      de: "Die Zeichenfolge, die nach List angezeigt wird, wenn eine Fehlermeldung angezeigt wird.",
      it: "La stringa da mostrare dopo List quando viene visualizzato un messaggio di errore.",
    },
    Separator: {
      de: "Die Zeichenfolge, die zwischen jedem Element der List angezeigt wird, wenn eine Fehlermeldung angezeigt wird. Standard: ', '.",
      it: "La stringa mostrata tra ogni elemento della List quando viene visualizzato un messaggio di errore. Predefinito: ', '.",
    },
    ShowBlacklist: {
      de: "Ob die List in der Fehlermeldung angezeigt werden soll oder nicht (true/false). Standard: false.",
      it: "Se mostrare la List nel messaggio di errore o no (true/false). Predefinito: false.",
    },
  },
  "html.input.cleave.json": {
    Config: {
      de: "Die Cleave-Optionen, die anstelle der anderen Kurzparameter gesetzt werden sollen.",
      it: "Le opzioni Cleave da impostare al posto degli altri parametri abbreviati.",
    },
    Date: {
      de: "Ob Cleaves Datumsmaskierung aktiviert werden soll.",
      it: "Se abilitare la mascheratura delle date di Cleave.",
    },
    DateMin: {
      de: "Das erlaubte Mindestdatum im amerikanischen Format mit Bindestrichen (YYYY-MM-DD).",
      it: "La data minima consentita, in formato americano con trattini (YYYY-MM-DD).",
    },
    DateMax: {
      de: "Das erlaubte Höchstdatum im amerikanischen Format mit Bindestrichen (YYYY-MM-DD).",
      it: "La data massima consentita, in formato americano con trattini (YYYY-MM-DD).",
    },
    Delimiter: {
      de: "Das Trennzeichen, das im formatierten Wert verwendet wird (z. B. '.', '/', '-').",
      it: "Il separatore usato nel valore formattato (es. '.', '/', '-').",
    },
    DatePattern: {
      de: "Das Datumsmuster (z. B. 'd-m-Y'), das von der Datumsmaske verwendet wird.",
      it: "Il pattern della data (es. 'd-m-Y') usato dalla maschera data.",
    },
  },
  "html.input.regex.json": {
    Expression: {
      de: "Der reguläre Ausdruck, dem der Wert des Felds entsprechen muss. Verwenden Sie '°' statt '^', um den Anfang der Eingabezeichenfolge oder eine Negation zu markieren.",
      it: "L'espressione regolare a cui il valore del campo deve conformarsi. Usa '°' invece di '^' per marcare l'inizio della stringa di input o una negazione.",
    },
    KeyExpression: {
      de: "Der reguläre Ausdruck, dem die einzelnen Tastenanschläge entsprechen müssen.",
      it: "L'espressione regolare a cui i singoli tasti devono conformarsi.",
    },
    Flags: {
      de: "Die regulären Ausdrucks-Flags, die zum Erstellen des Expression verwendet werden (Standard: 'g').",
      it: "I flag dell'espressione regolare usati per creare l'Expression (predefinito: 'g').",
    },
    KeyFlags: {
      de: "Die regulären Ausdrucks-Flags, die zum Erstellen des KeyExpression verwendet werden (Standard: 'g').",
      it: "I flag dell'espressione regolare usati per creare il KeyExpression (predefinito: 'g').",
    },
    ErrorPrefix: {
      de: "Der erste Teil der Fehlermeldung, der vor dem Expression angezeigt wird.",
      it: "La prima parte del messaggio di errore visualizzato prima dell'Expression.",
    },
    ErrorPostfix: {
      de: "Der letzte Teil der Fehlermeldung, der nach dem Expression angezeigt wird.",
      it: "La parte finale del messaggio di errore visualizzato dopo l'Expression.",
    },
    ExposeExpression: {
      de: "Zeigt den Expression innerhalb der Fehlermeldung an, wenn auf TRUE gesetzt (case-insensitiv).",
      it: "Espone l'Expression nel messaggio di errore se impostato su TRUE (senza distinzione tra maiuscole e minuscole).",
    },
  },
  "html.input.tinymce.json": {
    Plugins: {
      de: "Eine CSV der zu ladenden TinyMCE-Plugin-Namen (z. B. 'advlist, autolink, lists, link, image, table, code').",
      it: "Un CSV dei nomi dei plugin TinyMCE da caricare (es. 'advlist, autolink, lists, link, image, table, code').",
    },
    Toolbar: {
      de: "Die Toolbar-Konfigurationszeichenfolge, die definiert, welche Buttons und Gruppen angezeigt werden (z. B. 'undo redo | blocks | bold italic forecolor | bullist numlist | table | code').",
      it: "La stringa di configurazione della toolbar che definisce quali pulsanti e gruppi mostrare (es. 'undo redo | blocks | bold italic forecolor | bullist numlist | table | code').",
    },
    ResourceURL: {
      de: "Die Basis-URL, unter der die TinyMCE-Distribution bereitgestellt wird (muss tinymce.min.js, skins/, icons/, models/ und plugins/-Unterverzeichnisse enthalten).",
      it: "L'URL di base in cui viene servita la distribuzione TinyMCE (deve contenere tinymce.min.js e le sottodirectory skins/, icons/, models/ e plugins/).",
    },
    UploadURL: {
      de: "Die Server-Endpunkt-URL für Datei-Uploads (z. B. TTBoard_UPLOAD?uid=). Wird vom Toolbar-Button codbiuploadfile verwendet.",
      it: "L'URL dell'endpoint del server per i caricamenti di file (es. TTBoard_UPLOAD?uid=). Usata dal pulsante toolbar codbiuploadfile.",
    },
    UploadImageURL: {
      de: "Die Server-Endpunkt-URL für Bild-Uploads. Fällt auf UploadURL zurück, wenn nicht gesetzt.",
      it: "L'URL dell'endpoint del server per i caricamenti di immagini. Torna a UploadURL se non impostata.",
    },
    UploadFieldName: {
      de: "Der Name des Formularfelds für die hochgeladene Datei (Standard: fileToUpload).",
      it: "Il nome del campo del modulo per il file caricato (predefinito: fileToUpload).",
    },
    StripPort: {
      de: "Wenn auf 'true' gesetzt, wird die Portnummer (z. B. :444) aus der vom Upload-Server zurückgegebenen URL entfernt, bevor sie in den Editor eingefügt wird.",
      it: "Se impostato su 'true', il numero di porta (es. :444) viene rimosso dall'URL restituita dal server di upload prima di inserirla nell'editor.",
    },
    RenderToPdf: {
      de: "Wenn auf 'true' gesetzt, wird ein Druck-Listener registriert, der den Dokumentkörper beim Drucken/Exportieren in PDF durch den Klartextinhalt dieses Editors ersetzt.",
      it: "Se impostato su 'true', viene registrato un listener di stampa che sostituisce il corpo del documento con il contenuto di testo semplice di questo editor quando il modulo viene stampato/esportato in PDF.",
    },
  },
  "html.input.trans.ntw.json": {
    NumberWords: {
      de: "Das Array von Zeichenfolgen, die das Wort für jede Ziffer von 0 bis 9 darstellen. Der Index der Zeichenfolge im Array entspricht der Ziffer, die es darstellt.",
      it: "L'array di stringhe che rappresentano la parola per ogni cifra da 0 a 9. L'indice della stringa nell'array corrisponde alla cifra che rappresenta.",
    },
    PreFix: {
      de: "Die Zeichenfolge, die dem transformierten Ergebnis vorangestellt werden soll.",
      it: "La stringa che deve essere anteposta al risultato trasformato.",
    },
    PostFix: {
      de: "Die Zeichenfolge, die dem transformierten Ergebnis angehängt werden soll.",
      it: "La stringa che deve essere aggiunta al risultato trasformato.",
    },
  },
  "html.input.trans.regex.json": {
    Extractor: {
      de: "Die Zeichenfolge, die den regulären Ausdruck darstellt, um die zu ersetzenden Werte zu extrahieren.",
      it: "La stringa che rappresenta l'espressione regolare per estrarre i valori da sostituire.",
    },
    Replacements: {
      de: "Die Zeichenfolge, die den Ersatzwert darstellt.",
      it: "La stringa che rappresenta il valore di sostituzione.",
    },
  },
  "html.panel.accordion.json": {
    Accordion: {
      de: "Der Name des Sets, dem alle Panels innerhalb des markierten Elements angehören sollen. Wenn kein Name definiert ist, passiert nichts.",
      it: "Il nome del set a cui devono appartenere tutti i pannelli all'interno dell'elemento marcato. Se non viene definito alcun nome, non succede nulla.",
    },
  },
  "html.panel.json": {
    Folded: {
      de: "Gibt an, ob dieses Panel beim Laden eingeklappt (WAHR) oder aufgeklappt (alles andere) ist (Standard: WAHR).",
      it: "Indica se questo pannello è ripiegato (TRUE) o aperto (qualunque altro valore) quando viene caricato (predefinito: TRUE).",
    },
    CSSHeaderHover: {
      de: "Das optionale CSS:hover des Headers (Standard: { scale : 1.1 ;}).",
      it: "Il CSS:hover opzionale dell'header (predefinito: { scale : 1.1 ;}).",
    },
    CSSHeaderActive: {
      de: "Das optionale CSS:active des Headers (Standard: { scale : .9 ;}).",
      it: "Il CSS:active opzionale dell'header (predefinito: { scale : .9 ;}).",
    },
    CSSHeaderFolded: {
      de: "Das optionale CSS, das auf den Header angewendet wird, wenn das Panel EINGEKLAPPT ist. Ohne dieses würde ein eingeklapptes (oder startend eingeklapptes) Panel das über CSSHeaderUnfolded gesetzte Header-Look verlieren.",
      it: "Il CSS opzionale da applicare all'header quando il pannello è RIPIEGATO. Senza di esso, un pannello ripiegato (o che inizia ripiegato) perderebbe l'aspetto dell'header impostato tramite CSSHeaderUnfolded.",
    },
    CSSHeaderUnfolded: {
      de: "Das optionale CSS, das auf den Header angewendet wird, wenn das Panel aufgeklappt ist.",
      it: "Il CSS opzionale da applicare all'header quando il pannello è aperto.",
    },
    DCSSHeaderUnfolded: {
      de: "Das optionale Darkmode-CSS, das auf den Header angewendet wird, wenn das Panel aufgeklappt ist.",
      it: "Il CSS Darkmode opzionale da applicare all'header quando il pannello è aperto.",
    },
    CSSAnimFadeINPanel: {
      de: "Die optionale Animation, die auf das Panel angewendet wird, wenn das Panel aufgeklappt wird.",
      it: "L'animazione opzionale da applicare al pannello quando viene aperto.",
    },
    CSSAnimFadeINPanelDuration: {
      de: "Die optionale Dauer der Animation, die auf das Panel angewendet wird, wenn das Panel aufgeklappt wird (Standard: 0s).",
      it: "La durata opzionale dell'animazione applicata al pannello quando viene aperto (predefinito: 0s).",
    },
    CSSAnimFadeINPanelEasing: {
      de: "Die optionale Easing-Funktion der Animation, die auf das Panel angewendet wird, wenn das Panel aufgeklappt wird (Standard: \"ease-in-out\").",
      it: "La funzione di easing opzionale dell'animazione applicata al pannello quando viene aperto (predefinito: \"ease-in-out\").",
    },
    CSSAfterHeader: {
      de: "Das CSS:after, das auf den Header angewendet wird, wenn das Panel eingeklappt ist.",
      it: "Il CSS:after da applicare all'header quando il pannello è ripiegato.",
    },
    CSSBeforeHeader: {
      de: "Das CSS:before, das auf den Header angewendet wird, wenn das Panel eingeklappt ist (wird überschrieben, wenn Pflichtfelder im Panel enthalten sind).",
      it: "Il CSS:before da applicare all'header quando il pannello è ripiegato (verrà sovrascritto quando il pannello contiene campi obbligatori).",
    },
    CSSAfterHeaderContent: {
      de: "Der CSS:after-Inhalt, der auf den Header angewendet wird, wenn das Panel eingeklappt ist.",
      it: "Il contenuto CSS:after da applicare all'header quando il pannello è ripiegato.",
    },
    CSSBeforeHeaderContent: {
      de: "Der CSS:before-Inhalt, der auf den Header angewendet wird, wenn das Panel eingeklappt ist (wird überschrieben, wenn Pflichtfelder im Panel enthalten sind).",
      it: "Il contenuto CSS:before da applicare all'header quando il pannello è ripiegato (verrà sovrascritto quando il pannello contiene campi obbligatori).",
    },
    CSSAfterHeaderContentUnfolded: {
      de: "Der CSS:after-Inhalt, der auf den Header angewendet wird, wenn das Panel aufgeklappt ist.",
      it: "Il contenuto CSS:after da applicare all'header quando il pannello è aperto.",
    },
    CSSBeforeHeaderContentUnfolded: {
      de: "Der CSS:before-Inhalt, der auf den Header angewendet wird, wenn das Panel aufgeklappt ist (wird überschrieben, wenn Pflichtfelder im Panel enthalten sind).",
      it: "Il contenuto CSS:before da applicare all'header quando il pannello è aperto (verrà sovrascritto quando il pannello contiene campi obbligatori).",
    },
    CSSRequiredFieldsContent: {
      de: "Der CSS:before-Inhalt, der auf den Header angewendet wird, wenn er ein validierungssensitives Feld enthält.",
      it: "Il contenuto CSS:before da applicare all'header se contiene un campo sensibile alla validazione.",
    },
    CSSRequiredFields: {
      de: "Das CSS:before, das auf den Header angewendet wird, wenn er ein validierungssensitives Feld enthält.",
      it: "Il CSS:before da applicare all'header se contiene un campo sensibile alla validazione.",
    },
    AutoHeaderTitle: {
      de: "Die Zeichenfolge, die der automatisch generierte Header anzeigen soll.",
      it: "La stringa che l'header generato automaticamente deve visualizzare.",
    },
    AutoHeaderTitleSupplementsSpacer: {
      de: "Die Zeichenfolge, die den tatsächlichen Titel von den ergänzten Zeichenfolgen trennt (Werte von Eingaben mit der CSS-Klasse CodBi_HTML_Panel_AutoHeaderTitle_Supplement). Umgebende Leerzeichen als %20 oder \\s kodieren.",
      it: "La stringa che separa il titolo effettivo dalle stringhe supplementari (valori degli input marcati con la classe CSS CodBi_HTML_Panel_AutoHeaderTitle_Supplement). Codifica gli spazi circostanti come %20 o \\s.",
    },
    AutoHeaderLevel: {
      de: "Welche Ebene der umschließenden Überschrift der AutoHeaderTitle haben soll, z. B. muss der Wert 1 sein, um eine h1-Umhüllung zu erhalten.",
      it: "Quale livello di intestazione circostante deve avere l'AutoHeaderTitle, es. per ottenere un contenitore h1 il valore deve essere 1.",
    },
    ScrollBlock: {
      de: "Definiert die logische Position, zu der beim Aufklappen des Panels gescrollt wird (start, center, end, nearest). Standard: \"nearest\".",
      it: "Definisce la posizione logica a cui scorrere quando il pannello viene aperto (start, center, end, nearest). Predefinito: \"nearest\".",
    },
    GenerateHeader: {
      de: "Gibt an, ob automatisch ein Header generiert werden soll. Standard: FALSCH.",
      it: "Indica se un'header deve essere generato automaticamente. Predefinito: FALSE.",
    },
    Scroll: {
      de: "Gibt an, ob die Ansicht gescrollt werden soll, wenn sich das Panel aufklappt. Standard: FALSCH.",
      it: "Indica se la vista deve essere scorsa quando il pannello si apre. Predefinito: FALSE.",
    },
    ScrollToTop: {
      de: "Gibt an, ob eine runde Scroll-nach-oben-Schaltfläche unten rechts im aufgeklappten Panel angezeigt werden soll. Mögliche Werte: \"true\" (immer sichtbar), \"auto\" (nur sichtbar, wenn der Panelinhalt höher als das 1,5-fache der Viewport-Höhe ist) oder \"false\" (verborgen). Standard: AUTO.",
      it: "Indica se mostrare un pulsante circolare di scorrimento verso l'alto in basso a destra del pannello aperto. Valori possibili: \"true\" (sempre visibile), \"auto\" (visibile solo quando il contenuto del pannello è più alto di 1,5 volte l'altezza del viewport), o \"false\" (nascosto). Predefinito: AUTO.",
    },
    Accordion: {
      de: "Wenn gesetzt, wird dieses Panel Teil eines Akkordeons. Alle Panels mit demselben Akkordeonnamen werden eingeklappt, wenn eines davon aufgeklappt wird.",
      it: "Se impostato, questo pannello diventa parte di un accordion. Tutti i pannelli con lo stesso nome accordion verranno ripiegati quando uno di essi viene aperto.",
    },
  },
  "html.select.favorites.json": {
    DividerTarget: {
      de: "Gibt die Option an, die ausgewählt werden soll, wenn die Trennoption ausgewählt wird.",
      it: "Specifica l'opzione da selezionare quando viene selezionata l'opzione divisore.",
    },
    InitialElement: {
      de: "Gibt die Option an, die beim Laden des Formulars ausgewählt werden soll.",
      it: "Specifica l'opzione che deve essere selezionata quando il modulo viene caricato.",
    },
    Favorites: {
      de: "Gibt die Optionen an, die vor allen anderen angezeigt werden sollen.",
      it: "Specifica le opzioni che devono essere mostrate prima di tutte le altre.",
    },
    Divider: {
      de: "Gibt den Textinhalt des Trennzeichens an.",
      it: "Specifica il contenuto di testo del divisore.",
    },
  },
  "html.select.injection.json": {
    Titles: {
      de: "Die optionalen Titel-Attribute, die auf den generierten Option-Elementen gesetzt werden sollen.",
      it: "Gli attributi title opzionali che devono essere impostati sugli elementi option generati.",
    },
    Values: {
      de: "Die innerHTMLs, die die generierten Option-Elemente haben sollen.",
      it: "I innerHTML che devono avere gli elementi option generati.",
    },
    ReClean: {
      de: "Ein optionaler Boolescher Wert, der angibt, ob das Select-Element vor dem Befüllen bereinigt werden soll.",
      it: "Un booleano opzionale che specifica se pulire l'elemento select prima di popolarlo.",
    },
    TitleProperty: {
      de: "Die optionale Eigenschaft, die aus dem an Values übergebenen Array abgerufen werden soll, um sie als tatsächlichen Titel zu verwenden.",
      it: "La proprietà opzionale da recuperare dall'array passato a Values per usarla come titolo effettivo.",
    },
    ValueProperty: {
      de: "Die optionale Eigenschaft, die aus dem an Values übergebenen Array abgerufen werden soll, um sie als tatsächlichen Wert zu verwenden.",
      it: "La proprietà opzionale da recuperare dall'array passato a Values per usarla come valore effettivo.",
    },
    TextProperty: {
      de: "Die optionale Eigenschaft, die aus dem an Values übergebenen Array abgerufen werden soll, um sie als tatsächlich sichtbaren Text in der Auswahl zu verwenden (wenn nicht angegeben, aber ValueProperty angegeben, wird die ValueProperty für den Text verwendet).",
      it: "La proprietà opzionale da recuperare dall'array passato a Values per usarla come testo effettivamente visibile nella selezione (se non specificata ma ValueProperty lo è, per il testo verrà usata la ValueProperty).",
    },
  },
  "html.setattribute.json": {
    Name: {
      de: "Der Name des zu setzenden Attributs.",
      it: "Il nome dell'attributo da impostare.",
    },
    ToSet: {
      de: "Die Zeichenfolge, auf die das Attribut gesetzt werden soll.",
      it: "La stringa a cui impostare l'attributo.",
    },
  },
  "html.text.injector.json": {
    Placeholder: {
      de: "Gibt die Zeichenfolge an, die innerhalb der Property des markierten Elements ersetzt werden soll. Standardwert: \"[[INJECTOR_REPLACEMENT]]\".",
      it: "Specifica la stringa che deve essere sostituita all'interno della Property dell'elemento marcato. Valore standard: \"[[INJECTOR_REPLACEMENT]]\".",
    },
    Replacement: {
      de: "Die Zeichenfolge, mit der alle Vorkommen des angegebenen Platzhalters ersetzt werden sollen, oder die am Ende der im Element-Property enthaltenen Zeichenfolge angehängt werden soll.",
      it: "La stringa con cui sostituire tutte le occorrenze del segnaposto specificato, o da aggiungere alla fine della stringa contenuta nella Property dell'elemento marcato.",
    },
    Property: {
      de: "Gibt an, welche Eigenschaft des markierten Elements die Replacement erhalten soll.",
      it: "Specifica quale proprietà dell'elemento marcato deve ricevere la Replacement.",
    },
  },
  "html.text.mapper.json": {
    Replacements: {
      de: "Das Objekt mit den Eigenschaften, deren Werte verwendet werden, um die Platzhalter zu ersetzen. Wenn es ein Array ist, wird die die Platzhalter enthaltende Zeichenfolge für jeden Eintrag repliziert, sodass sie als Vorlage verwendet werden kann.",
      it: "L'oggetto contenente le proprietà i cui valori verranno usati per sostituire i segnaposto. Se è un array, la stringa contenente i segnaposto verrà replicata per ogni voce, permettendone l'uso come modello.",
    },
    Property: {
      de: "Die Eigenschaft des markierten Elements, die die Zeichenfolge enthält, in der die Platzhalter ersetzt werden sollen.",
      it: "La proprietà dell'elemento marcato che contiene la stringa in cui sostituire i segnaposto.",
    },
    CSS: {
      de: "Die CSS-Regeln, die auf das markierte Element angewendet werden sollen, wenn die Ersetzung abgeschlossen ist, z. B. um es zu verbergen, bis die Platzhalter ersetzt sind.",
      it: "Le regole CSS da applicare all'elemento marcato quando la sostituzione è completata, es. per nasconderlo finché i segnaposto non vengono sostituiti.",
    },
  },
  "json.set.json": {
    Path: {
      de: "Der gepunktete Pfad, der zum Objekt führt, beginnend beim markierten Element, dessen Property gesetzt werden soll.",
      it: "Il percorso punteggiato che porta all'oggetto, a partire dall'elemento marcato, la cui Property deve essere impostata.",
    },
    Property: {
      de: "Der Name der zu setzenden Eigenschaft.",
      it: "Il nome della proprietà da impostare.",
    },
    ToSet: {
      de: "Das Objekt, auf das die Property gesetzt werden soll.",
      it: "L'oggetto a cui impostare la Property.",
    },
  },
  "ldap.autocomplete.json": {
    Property: {
      de: "Die LDAP-Eigenschaft, die automatisch vervollständigt werden soll.",
      it: "La proprietà LDAP che deve essere completata automaticamente.",
    },
    CSSProposals: {
      de: "Der CSS-Stil für das Vorschlags-Select-Element, das erscheint, wenn es mehrere Übereinstimmungen gibt.",
      it: "Lo stile CSS per l'elemento Select dei suggerimenti che appare quando ci sono più corrispondenze.",
    },
    URL: {
      de: "Die URL der vordefinierten Formcycle-LDAP-Abfrage, die verwendet werden soll.",
      it: "L'URL della query LDAP predefinita di Formcycle da usare.",
    },
    MsgNotInLDAP: {
      de: "Die Meldung, die angezeigt wird, wenn der eingegebene Wert nicht im LDAP gefunden wird.",
      it: "Il messaggio da visualizzare quando il valore inserito non viene trovato nel LDAP.",
    },
  },
  "ldap.autocomplete.set.json": {
    Property: {
      de: "Die LDAP-Eigenschaft, die von den automatisch vervollständigenden Eingaben innerhalb des markierten Containers verwendet wird, um die Übereinstimmung zu suchen.",
      it: "La proprietà LDAP usata dagli input a completamento automatico all'interno del contenitore marcato per trovare la corrispondenza.",
    },
    CSSProposals: {
      de: "Der CSS-Stil für das Vorschlags-Select-Element, das erscheint, wenn es mehrere Übereinstimmungen gibt.",
      it: "Lo stile CSS per l'elemento Select dei suggerimenti che appare quando ci sono più corrispondenze.",
    },
    URL: {
      de: "Die URL der vordefinierten Formcycle-LDAP-Abfrage, die verwendet werden soll.",
      it: "L'URL della query LDAP predefinita di Formcycle da usare.",
    },
  },
  "matomo.tracking.json": {
    SiteID: {
      de: "Die ID der Matomo-Projekt-Site, die für das Tracking verwendet werden soll.",
      it: "L'ID del sito del progetto Matomo da usare per il tracciamento.",
    },
    URL: {
      de: "Die URL des Matomo-Servers, der das markierte Formular verfolgen soll.",
      it: "L'URL del server Matomo che deve tracciare il modulo marcato.",
    },
    ImageURL: {
      de: "Die URL des Matomo-Bilds, das für das Tracking verwendet werden soll.",
      it: "L'URL dell'immagine Matomo da usare per il tracciamento.",
    },
  },
  "media.image.cropper.json": {
    Container: {
      de: "Der CSS-Selektor des div, das die Cropper-Benutzeroberfläche enthalten soll.",
      it: "Il selettore CSS del div che deve contenere l'interfaccia Cropper.",
    },
    Target: {
      de: "Der CSS-Selektor des Bildelements, das das zugeschnittene Bild enthält, nachdem der Updater angeklickt wurde.",
      it: "Il selettore CSS dell'elemento immagine che conterrà l'immagine ritagliata dopo il clic su Updater.",
    },
    File: {
      de: "Der CSS-Selektor des Datei-Eingabefelds, in dem das zu zuschneidende Bild ausgewählt wird.",
      it: "Il selettore CSS dell'input file in cui selezionare l'immagine da ritagliare.",
    },
    Updater: {
      de: "Der CSS-Selektor, der den Button angibt, der beim Klick ein Update des Target bewirkt.",
      it: "Il selettore CSS che specifica il pulsante che, al clic, causa un aggiornamento del Target.",
    },
    AspectRatio: {
      de: "Das optionale Seitenverhältnis des Croppers, das beibehalten werden soll (z. B. 16 / 9 oder 4 / 3). Das Setzen dieses Werts macht den Cropper nicht veränderbar in der Größe.",
      it: "Il rapporto d'aspetto opzionale del cropper da mantenere (es. 16 / 9 o 4 / 3). L'impostazione di questo valore rende il cropper non ridimensionabile.",
    },
    OutputWidth: {
      de: "Die Breite in Pixeln für die Leinwand, auf der der zugeschnittene Bereich widergespiegelt werden soll. Als Zeichenfolge angegeben beträgt der Mindestwert 100. Standard: 1000px.",
      it: "La larghezza in pixel per la canvas in cui deve essere riflessa l'area ritagliata. Se fornita come stringa, il valore minimo è 100. Predefinito: 1000px.",
    },
    CSSCropperHandle: {
      de: "Das CSS, das auf jeden Cropper-Griff angewendet werden soll (Standard: background-color: darkorange).",
      it: "Il CSS da applicare su ciascuna maniglia del cropper (predefinito: background-color: darkorange).",
    },
  },
  "media.input.speech.json": {
    VoiceHotkey: {
      de: "Tastenkürzel zum Umschalten der Aufnahme. Standard: Alt+A.",
      it: "Scorciatoia da tastiera per attivare la registrazione. Predefinito: Alt+A.",
    },
    Language: {
      de: "BCP-47-Sprachkennzeichen für die Erkennung (z. B. de-DE, en-US). Wenn weggelassen, wird die Standardsprache des Browsers verwendet.",
      it: "Tag lingua BCP-47 per il riconoscimento (es. de-DE, en-US). Se omesso, viene usata la lingua predefinita del browser.",
    },
    Placeholder: {
      de: "Benutzerdefinierter Platzhaltertext für das Feld. Standard: die Tastenkombination mit einem Mikrofon-Emoji als Präfix. Wird nur angezeigt, wenn ShowHint true ist.",
      it: "Testo segnaposto personalizzato per il campo. Predefinito: la combinazione di hotkey con prefisso un'emoji microfono. Mostrato solo se ShowHint è true.",
    },
    ShowHint: {
      de: "Wenn auf true gesetzt, wird der Tastenkürzel-Hinweis als Platzhaltertext angezeigt. Standard: false.",
      it: "Se impostato su true, mostra il suggerimento dell'hotkey come testo segnaposto. Predefinito: false.",
    },
  },
  "media.input.speech.whisper.json": {
    VoiceHotkey: {
      de: "Tastenkürzel zum Umschalten der Aufnahme. Standard: Alt+A.",
      it: "Scorciatoia da tastiera per attivare la registrazione. Predefinito: Alt+A.",
    },
    Language: {
      de: "Zweistelliger Sprachcode für Whisper (z. B. de, en, fr). Wenn weggelassen, erkennt Whisper die Sprache automatisch.",
      it: "Codice lingua di due lettere per Whisper (es. de, en, fr). Se omesso, Whisper rileva automaticamente la lingua.",
    },
    Placeholder: {
      de: "Benutzerdefinierter Platzhaltertext für das Feld. Wird nur angezeigt, wenn ShowHint true ist.",
      it: "Testo segnaposto personalizzato per il campo. Mostrato solo se ShowHint è true.",
    },
    ShowHint: {
      de: "Wenn auf true gesetzt, wird der Tastenkürzel-Hinweis als Platzhaltertext angezeigt. Standard: false.",
      it: "Se impostato su true, mostra il suggerimento dell'hotkey come testo segnaposto. Predefinito: false.",
    },
  },
  "media.multipleupload.json": {
    Maximum: {
      de: "Die Anzahl der Dateien, die hochgeladen werden dürfen.",
      it: "Il numero di file che possono essere caricati.",
    },
    PrefixTooMany: {
      de: "Die Meldung, die vor dem Maximum angezeigt wird, wenn zu viele Dateien ausgewählt wurden.",
      it: "Il messaggio mostrato prima di Maximum se sono stati selezionati troppi file.",
    },
    PostfixTooMany: {
      de: "Die Meldung, die nach dem Maximum angezeigt wird, wenn zu viele Dateien ausgewählt wurden.",
      it: "Il messaggio mostrato dopo Maximum se sono stati selezionati troppi file.",
    },
  },
  "onchange.conditional.json": {
    Reference: {
      de: "Der Wert, mit dem der Wert des markierten Eingabefelds verglichen werden soll.",
      it: "Il valore con cui deve essere confrontato il valore dell'input marcato.",
    },
    Mode: {
      de: "Definiert den Vergleichsmodus, der auf den Wert des markierten Eingabefelds und den Referenzwert angewendet werden soll. Verfügbare Modi sind GTE (größer oder gleich), GT (größer), LTE (kleiner oder gleich), LT (kleiner), EQ (gleich) & NEQ (ungleich).",
      it: "Definisce la modalità di confronto da applicare al valore dell'input marcato e al valore di riferimento. Le modalità disponibili sono GTE (maggiore o uguale), GT (maggiore), LTE (minore o uguale), LT (minore), EQ (uguale) e NEQ (non uguale).",
    },
    Target: {
      de: "Das Element, auf das eine der angegebenen Funktionalitäten angewendet werden soll, je nachdem, ob die Bedingung erfüllt ist oder nicht, oder ein CSS-Selektor. Für die Arbeit in einem repetitiven Container ist ein CSS-Selektor zwingend erforderlich.",
      it: "L'elemento a cui applicare una delle funzionalità specificate a seconda che la condizione sia soddisfatta o no, oppure un selettore CSS. Per funzionare in un contenitore ripetitivo è obbligatorio un selettore CSS.",
    },
    DateFormat: {
      de: "Eine optionale Zeichenfolge, die das Format des Kandidaten angibt. Wenn nicht undefined, löst es die Umwandlung des Werts des markierten Felds in ein Datum aus, bevor er mit der Referenz verglichen wird. Wenn nicht angegeben, wird das Format als MM/DD/YYYY oder ein vom Date-Konstruktor parsebares Format angenommen.",
      it: "Una stringa opzionale che specifica il formato del candidato. Se non è undefined, attiva la trasformazione del valore del campo marcato in una Date prima di confrontarlo con il riferimento. Se non specificato, si presume il formato MM/DD/YYYY o un formato parsabile dal costruttore Date.",
    },
    Candidate: {
      de: "Das Element, aus dem der zu vergleichende Wert stammt, oder ein CSS-Selektor. Für die Arbeit in einem repetitiven Container ist ein CSS-Selektor zwingend erforderlich.",
      it: "L'elemento da cui ottenere il valore da confrontare, oppure un selettore CSS. Per funzionare in un contenitore ripetitivo è obbligatorio un selettore CSS.",
    },
  },
  "openplz.autocomplete.json": {
    TargetData: {
      de: "Welche Art von Daten vom Ziel empfangen werden soll (Localities, PostalCode oder Streets).",
      it: "Quale tipo di dati deve ricevere il target (Localities, PostalCode o Streets).",
    },
    Country: {
      de: "Das optionale Land, aus dem die Daten abgerufen werden sollen (wenn nicht angegeben, wird entweder das in der CodBi-Konfiguration OpenPLZ_Country angegebene Land verwendet oder, wenn nicht angegeben, de).",
      it: "Il paese opzionale da cui recuperare i dati (se non fornito, verrà usato il paese specificato nella configurazione OpenPLZ_Country di CodBi o, se non specificato, de).",
    },
    CSSProposals: {
      de: "Der CSS-Stil für das Vorschlags-Select-Element, das erscheint, wenn es mehrere Übereinstimmungen gibt.",
      it: "Lo stile CSS per l'elemento Select dei suggerimenti che appare quando ci sono più corrispondenze.",
    },
    MsgNotKnown: {
      de: "Die Meldung, die angezeigt wird, wenn versucht wird, einen Wert zu setzen, der in OpenPLZ nicht gefunden werden kann.",
      it: "Il messaggio da mostrare quando si tenta di impostare un valore che non può essere trovato in OpenPLZ.",
    },
    Dependent: {
      de: "Der CSS-Selektor des Felds, dessen Wert die Suchergebnisse einschränkt. Für Straßen DependentPLZ / DependentLocality bevorzugen.",
      it: "Il selettore CSS del campo il cui valore limita i risultati di ricerca. Preferire DependentPLZ / DependentLocality per le strade.",
    },
    DependentPLZ: {
      de: "Der CSS-Selektor des Felds, das die Suche nach Straßen anhand seines Werts, der einer Postleitzahl ähnelt, einschränkt, nur wenn DependentLocality undefined ist.",
      it: "Il selettore CSS del campo che limita la ricerca delle strade in base al suo valore simile a un codice postale, solo se DependentLocality è undefined.",
    },
    DependentLocality: {
      de: "Der CSS-Selektor des Felds, das die Suche nach Straßen anhand seines Werts, der einer Ortschaft ähnelt, einschränkt (überschreibt DependentPLZ).",
      it: "Il selettore CSS del campo che limita la ricerca delle strade in base al suo valore simile a una località (sovrascrive DependentPLZ).",
    },
    FocusOnAutocomplete: {
      de: "Der CSS-Selektor des Felds, das fokussiert werden soll, wenn eine automatische Vervollständigung stattgefunden hat.",
      it: "Il selettore CSS del campo su cui focalizzare quando si è verificato un autocomplete.",
    },
    AllowEmpty: {
      de: "Wenn auf true gesetzt, löst ein leerer Eingabewert keine Fehlermeldung aus.",
      it: "Se impostato su true, un valore di input vuoto non attiva un messaggio di errore.",
    },
    AllowedValues: {
      de: "Eine CSV zusätzlicher Werte, die ebenfalls ohne einen OpenPLZ-Abgleich akzeptiert werden (umgeht die 'nicht bekannt'-Validierung). Verwenden Sie Semikolons, um einen Wert optional auf eine bestimmte abhängige Ortschaft und/oder PLZ einzuschränken.",
      it: "Un CSV di valori aggiuntivi accettati anche senza una corrispondenza OpenPLZ (bypassa la validazione 'non noto'). Usa i punti e virgola per limitare facoltativamente un valore a una specifica località dipendente e/o PLZ.",
    },
  },
  "print.remove.json": {
    ParentalLevel: {
      de: "Die Anzahl der Elemente, die im parentElement-Baum nach oben gegangen werden, um zu dem zu entfernenden Element zu gelangen.",
      it: "Il numero di elementi da risalire nell'albero parentElement per raggiungere l'elemento da rimuovere.",
    },
    DocumentSelector: {
      de: "Der CSS-Selektor, der das zu entfernende Element angibt. Dieser Parameter hat Vorrang vor ParentalLevel.",
      it: "Il selettore CSS che specifica l'elemento da rimuovere. Questo parametro ha precedenza su ParentalLevel.",
    },
    Invert: {
      de: "Gibt an, ob diese Funktionalität invertiert werden soll, z. B. wird das Element im Formular entfernt, aber beim Drucken angezeigt (Standard: NICHT GESETZT). Wenn gesetzt, wird ParentalLevel auf \"1\" gesetzt, wenn es nicht gesetzt wurde.",
      it: "Specifica se questa funzionalità debba essere invertita, es. l'elemento verrà rimosso nel modulo ma mostrato in stampa (predefinito: NON IMPOSTATO). Se impostato, ParentalLevel verrà impostato su \"1\" se non è stato impostato.",
    },
  },
  "security.captcha.google.json": {
    SiteKey: {
      de: "Der Site-Key, der von https://developers.google.com/recaptcha empfangen wurde.",
      it: "La sitekey ricevuta da https://developers.google.com/recaptcha.",
    },
    DataCallback: {
      de: "Die optionale globale Callback-Methode, falls das Captcha ein Ergebnis liefert.",
      it: "Il metodo callback globale opzionale per quando il captcha fornisce un risultato.",
    },
    DataCallbackCode: {
      de: "Optionaler Code, der ausgeführt werden soll, wenn das Captcha ein Ergebnis liefert.",
      it: "Codice opzionale da eseguire quando il captcha fornisce un risultato.",
    },
    Script: {
      de: "Die Adresse des Google-ReCaptcha-Skripts.",
      it: "L'indirizzo dello script Google ReCaptcha.",
    },
  },
  "sv.json": {
    Destinations: {
      de: "Die Namen der globalen Variablen, die gesetzt werden sollen (eine einzelne Zeichenfolge oder ein Array von Zeichenfolgen).",
      it: "I nomi delle variabili globali da impostare (una singola stringa o un array di stringhe).",
    },
    Sources: {
      de: "Die Namen der URL-Parameter, die gelesen werden sollen (eine einzelne Zeichenfolge oder ein Array von Zeichenfolgen). Muss die gleiche Anzahl von Einträgen wie Destinations enthalten; das i-te Ziel wird auf den Wert der i-ten Quelle gesetzt.",
      it: "I nomi dei parametri URL da leggere (una singola stringa o un array di stringhe). Deve contenere lo stesso numero di voci di Destinations; la i-esima destinazione viene impostata sul valore della i-esima sorgente.",
    },
  },
  "sys.log.console.json": {
    DATA: {
      de: "Die Daten, die auf der Konsole protokolliert werden sollen.",
      it: "I dati da registrare sulla console.",
    },
  },
  "time.frame.json": {
    MaxField: {
      de: "CSS-Selektor, der das Eingabeelement auswählt, das die maximale Uhrzeit übernimmt.",
      it: "Selettore CSS che seleziona l'elemento di input che riceve l'ora massima.",
    },
    MsgMinInvalid: {
      de: "Die Fehlermeldung, die angezeigt wird, wenn der Wert des Mindestfelds nach dem des Höchstfelds liegt.",
      it: "Il messaggio di errore mostrato quando il valore del campo minimo è successivo a quello del campo massimo.",
    },
    MsgMaxInvalid: {
      de: "Die Fehlermeldung, die angezeigt wird, wenn der Wert des Höchstfelds vor dem des Mindestfelds liegt.",
      it: "Il messaggio di errore mostrato quando il valore del campo massimo è precedente a quello del campo minimo.",
    },
    EqualityPermitted: {
      de: "Ob dieselbe Start- und Endzeit erlaubt ist.",
      it: "Se sono consentiti gli stessi orari di inizio e fine.",
    },
  },
};

function main() {
  const files = readdirSync(FUNC_DIR).filter((f) => f.endsWith(".json"));
  let totalParams = 0;
  let translated = 0;
  let missing = [];

  for (const file of files) {
    const path = join(FUNC_DIR, file);
    const raw = JSON.parse(readFileSync(path, "utf8"));
    const params = raw.parameters;
    if (!params || typeof params !== "object") {
      continue;
    }
    const fileTranslations = TRANSLATIONS[file] ?? {};
    for (const [paramKey, entry] of Object.entries(params)) {
      totalParams += 1;
      const tr = fileTranslations[paramKey];
      if (tr) {
        if (!("descriptionDe" in entry)) entry.descriptionDe = tr.de;
        if (!("descriptionIt" in entry)) entry.descriptionIt = tr.it;
        translated += 1;
      } else {
        missing.push(`${file}::${paramKey}`);
      }
    }
    writeFileSync(path, `${JSON.stringify(raw, null, 2)}\n`, "utf8");
  }

  console.log(`Processed ${files.length} files.`);
  console.log(`Total parameters: ${totalParams}, translated: ${translated}, missing: ${missing.length}`);
  if (missing.length) {
    console.log("Missing translations for:");
    for (const m of missing) console.log(`  ${m}`);
  }
}

main();
