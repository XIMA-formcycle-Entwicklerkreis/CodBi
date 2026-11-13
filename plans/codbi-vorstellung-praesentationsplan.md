# CodBi vorstellen – Präsentationsplan (Stichpunkte mit Details & Begründungen)

> Ziel: **CodBi** (formcycle-Plug-in: Low-Code-Logik + lokale KI) so präsentieren, dass die
> Zuhörer den Nutzen von **Funktionalitäten**, **Elementplatzhaltern (EPs)** und
> **Standardkonfigurationen** verstehen und sich sofort vorstellen können, wofür sie es einsetzen.
> Jeder Unterpunkt ist mit einer konkreten Erklärung/Begründung („Weil …“) hinterlegt, damit du
> sie sofort mündlich verwenden kannst.

---

## 0. Vorbereitung
- **Demo-Umgebung aufsetzen**
  - CodBi-Plug-in installieren (formcycle Admin → System → Plugins) – *Weil ohne installiertes Plug-in keine Bausteine im Designer erscheinen.*
  - Onboarding-Formular bereitstellen: [CodBi OnBoarding](https://forms.ansbach.de/frontend-server/form/alias/1/CodBi_OnBoarding/) – *Weil es die Zuhörer nach dem Vortrag selbst ausprobieren können sollen.*
  - Beispiel-Formular im Form Designer öffnen, Live-Betrieb sicherstellen – *Weil tote Screenshots keine Überzeugungskraft haben; eine laufende Demo wirkt stärker.*
- **Zielgruppe klären**
  - Entwickler → technische Details (Attribute, Klassen, TypeScript-Template) – *Weil Entwickler die Wiederverwendbarkeit und Erweiterbarkeit verstehen müssen.*
  - Formularverantwortliche/Fachebene → Anwendungsfälle, Bedienbarkeit, Low-Code – *Weil sie entscheiden, welche Formulare damit gebaut werden.*
  - Management/DSGVO → Kosten, Sicherheit, Konformität, ROI – *Weil diese Aspekte die Freigabe/den Budgetentscheid treffen.*
- **Rahmen**
  - Dauer festlegen (30/45/60 min) – *Weil zu lange Vorträge die Aufmerksamkeit verlieren; Planung hilft, Fokus zu halten.*
  - Agenda ausgeben – *Weil die Zuhörer den roten Faden erkennen und wissen, was sie erwartet.*
  - Pro Baustein kurz live zeigen – *Weil „3x kurz zeigen“ mehr bleibt als „1x lang erklären“.*

---

## 1. Einstieg & Einordnung (Warum CodBi?)
- **Was ist CodBi?**
  - „Code Library“ – ein XIMA-formcycle-Plug-in (Kotlin + TypeScript). *Weil die Technologiebasis (Kotlin serverseitig, TypeScript clientseitig) für Entwickler und Betrieb relevant ist.*
  - Low-Code-Logik-Engine: vorgefertigte, wiederverwendbare Bausteine für Web-Formulare. *Weil das Kernangebot „fertige Logik statt eigener Code“ ist.*
  - Enthält zusätzlich einen vollständig lokalen KI-Stack. *Weil dies das entscheidende Unterscheidungsmerkmal gegenüber Cloud-Diensten ist.*
- **Kernversprechen / Wert**
  - Komplexe Formular-Logik **ohne eigenes Programmieren** zusammenstellen. *Weil dadurch auch Fachpersonen ohne Entwickler-Know-how smarte Formulare bauen können.*
  - Bausteine frei kombinieren statt individuellen JavaScript pro Formular. *Weil das Wartung, Konsistenz und Qualität deutlich verbessert (eine geprüfte Funktion statt vieler Sonderlösungen).*
  - KI-Fähigkeiten (OCR, Sprache, Chat) ohne Cloud-Zwang – DSGVO-konform lokal. *Weil viele öffentliche Stellen keine Daten an externe Cloud-Anbieter senden dürfen.*
- **Konkrete Problemstellung, die CodBi löst**
  - Vorherigen Aufwand zeigen (lange Client-Skripte, Duplikate über Formulare). *Weil der „Schmerz“ die Motivation für Veränderung schafft.*
  - „Einmal bauen, überall nutzen“ statt jedes Formular neu zu implementieren. *Weil dies der zentrale Zeit-/Kostenvorteil gegenüber Klassik-Code ist.*
- **Die drei Baustein-Arten im Überblick**
  - **Funktionalitäten** → Verhalten (transformieren/validieren/erweitern). *Weil sie das „Was soll das Element tun?“ beantworten.*
  - **Elementplatzhalter (EPs)** → Daten (Werte dynamisch abrufen). *Weil sie das „Woher kommen die Werte?“ beantworten.*
  - **Standardkonfigurationen** → fertige Komplettpakete (Funktionen + EPs kombiniert). *Weil sie das „Was ist vorgefertigt?“ beantworten und den Start erleichtern.*
- **Was CodBi besonders macht (Differenzierung)**
  - Lokale KI (LLaMA, Whisper, Tesseract) läuft auf dem eigenen Server. *Weil dies einzigartig für DSGVO-/Öffentlichkeitsumfelder ist, in denen Cloud-KI oft unzulässig ist.*
  - Daten verlassen die Infrastruktur nicht (DSGVO/GDPR, EU-KI-Verordnung/AI Act). *Weil dies die Hauptsorge von Datenschutzbeauftragten adressiert.*
  - Local API-Documentation Manager für eigenes Code-Sharing. *Weil dadurch auch Teams ohne Kernel-Zugriff eigene Bausteine erstellen und teilen können.*

---

## 2. Funktionalitäten (Functionalities) – „Verhalten“
### 2.1 Was ist eine Funktionalität?
- Wird per `data-cb-func`-Attribut an ein HTML-Element „gehängt“. *Weil dieses Attribut der Einstiegspunkt ist, über den CodBi das Element in der Laufzeit erkennt und die Logik bindet.*
- Transformiert, validiert oder erweitert Formular-Elemente zur Laufzeit. *Weil sie die „verhaltensbezogene“ Ebene der Formular-Logik darstellen.*
- Beispiele kurz nennen: Eingabe umwandeln, prüfen, maskieren, anreichern. *Weil konkrete Beispiele das abstrakte Konzept sofort greifbar machen.*

### 2.2 Vorteile von Funktionalitäten
- **Kein eigenes JavaScript nötig** → Funktionalität per Attribut aktivieren. *Weil dadurch die Einstiegshürde sinkt und Fehler durch selbstgeschriebenen Code reduziert werden.*
- **Wiederverwendbar** → gleiche Funktion in vielen Formularen einsetzen. *Weil einmal gebaute, getestete Logik überall konsistent wirkt statt pro Formular neu implementiert zu werden.*
- **Parametrisierbar** → verhalten sich je nach Kontext/Feld aktuell. *Weil ein einzelner Baustein viele Szenarien abdeckt und flexibel bleibt, statt für jeden Fall eine neue Funktion zu schreiben.*
- **Effizient laden** → Code nur geladen, wenn das Element wirklich genutzt wird. *Weil so das Seiten-Gewicht klein bleibt und die Formular-Performance stimmt.*

### 2.3 Beispiel-Kategorien (mit konkreten Elementen)
- **AI / ML**
  - `AI.Llama.Chat` – mehrschrittiger Chat mit lokalem LLaMA (Bild/PDF-Anhänge, Websuche, Spracheingabe, Reasoning). *Weil er eine vollständige, lokale Chat-Erfahrung ohne Cloud bietet und ideal als „Wow“-Demo dient.*
  - `AI.Llama.Standard.QA` – Bild-/PDF-Frage-Antwort, startet beim Upload, mit Verifikationsmodus. *Weil er gescannte Dokumente automatisch auswertet und typische Behörden-Workflows abbildet.*
  - `AI.Llama.Standard.TxtQA` – Text-Q&A bei Feldänderung, mit optionaler Websuche. *Weil er bei Eingaben live antwortet und mit der Websuche den Kontext erweitern kann.*
  - `AI.OCR` – Tesseract-Texterkennung (Druck/Extrahieren/Verifizieren). *Weil er gedruckten Text aus Bildern/PDFs strukturiert extrahiert – ein häufiges Behörden-Thema.*
- **Eingabe-Validierung / Transformation**
  - `HTML.Input.Regex` – Eingabe gegen Regex-Muster prüfen. *Weil formale Validierung (z. B. feste Formate) ohne eigenen Code abgesichert wird.*
  - `HTML.Input.Cleave` – erweiterte Eingabe-Maskierung (Cleave.js, z. B. IBAN/Telefon). *Weil korrekte, vorformatierte Eingaben die Datenqualität sofort erhöhen.*
  - `HTML.Input.Trans.Capital` – Text großschreiben. *Weil Standardisierungen wie Groß-/Kleinschreibung ohne manuellen Eingriff erfolgen.*
  - `HTML.Input.Blacklist` – unerlaubte Werte sperren. *Weil unerwünschte Eingaben zur Laufzeit verhindert werden.*
  - `HTML.Input.NoAutocomplete` – Autovervollständigung deaktivieren. *Weil datenschutzrelevante Felder nicht vom Browser vorausgefüllt werden sollen.*
- **Datum / Zeit**
  - `Date.Min` – Mindestdatum erzwingen. *Weil so z. B. keine Rückdatierungen in Anträgen möglich sind.*
  - `Date.NoWeekends` – Wochenenden bei Datumsfeldern verhindern. *Weil nur gültige (Arbeits-)Tage zugelassen werden.*
  - `Date.Frame` / `Time.Frame` – zwei Datums-/Zeitfelder (min/max) koppeln. *Weil Anfangs-/Endwerte logisch zusammengehören und konsistent validiert werden.*
- **Layout / HTML**
  - `HTML.Panel` – Panel-Strukturen mit fortgeschrittenem Layout. *Weil komplexe Formulare strukturiert und optisch klar aufgebaut werden.*
  - `HTML.Panel.Accordion` – Panels zu Akkordeons bündeln. *Weil lange Formulare platzsparend und ablenkungsarm dargestellt werden.*
  - `HTML.CSS` – CSS mit Platzhaltern injizieren. *Weil Styling dynamisch und kontextabhängig (z. B. je Feldwert) angewendet wird.*
  - `HTML.Text.Injector` – Text mit Platzhaltern einsetzen. *Weil dynamische Texte ohne Code in das Formular eingefügt werden.*
  - `HTML.SetAttribute` – HTML-Attribute dynamisch setzen. *Weil Attribute (z. B. readonly, required) je nach Zustand gesetzt werden.*
- **Integrationen**
  - `LDAP.Autocomplete` – LDAP-basierte Autovervollständigung. *Weil Benutzerdaten aus dem Verzeichnis direkt nachgeschlagen werden.*
  - `OpenPLZ.Autocomplete` – Deutsche PLZ-Autovervollständigung. *Weil Adresstypo durch Vorausfüllen vermieden wird.*
  - `Matomo.Tracking` – Webanalytik-Anbindung. *Weil Nutzungsdaten DSGVO-konform (ohne Cloud-Tracking) erfasst werden.*
  - `Media.Input.Speech.Whisper` – lokale Spracheingabe (DSGVO-konform). *Weil Diktat/Spracheingabe datenschutzkonform lokal verarbeitet wird.*

### 2.4 Demo-Idee
- Kleines Feld anlegen und per Drag & Drop eine Funktionalität belegen. *Weil das den Low-Code-Charakter und die geringe Einstiegshürde unmittelbar zeigt.*
- Wirkung live zeigen (z. B. Großschreibung oder Eingabe-Maskierung beim Tippen). *Weil der direkte, sichtbare Effekt am überzeugendsten ist.*

---

## 3. Elementplatzhalter (EPs) – „Dynamischer Datenzugriff“
### 3.1 Was ist ein EP?
- Platzhalter, der in **jedem Funktionalitäts-Parameter** Werte zur Laufzeit abruft. *Weil Parameter dadurch nicht statisch sind, sondern sich zur Laufzeit füllen.*
- Quellen: DOM, globale Variablen, externe Dienste, berechnete Werte. *Weil dies alle Datenquellen abdeckt, die Formulare benötigen.*
- Einsetzbar in: Funktionalitäten, Standardkonfigurationen und eigener Logik. *Weil dieselbe Technik durchgängig angewendet wird → ein Prinzip überall.*

### 3.2 Vorteile von EPs
- **Keine hartcodierten Werte** → Logik bleibt flexibel. *Weil Änderungen ohne Code-Änderung erfolgen, nur durch Anpassen der Referenz.*
- **Kontextabhängig** → gleiche Funktionalität passt sich verschiedenen Formularen/Nutzer-Eingaben an. *Weil ein Baustein viele Fälle abdeckt und dadurch Wiederverwendung erst möglich wird.*
- **Nur der EP-Referenzwert ändert sich, nicht der Code.** *Weil dies Wartung und Anpassung radikal vereinfacht.*
- **Lokal definierbar** → eigene Platzhalter für spezifische Logik. *Weil so auch hausinterne, individuelle Datenflüsse abgebildet werden.*
- **Wiederverwendbare Muster** → Parameter referenzieren EPs statt feste Daten. *Weil sich wiederverwendbare Code-Muster ergeben, die über Formulare übertragbar sind.*

### 3.3 Beispiel-Kategorien (mit konkreten Elementen)
- **Kern**
  - `F` – Objekte in Arrays nach Eigenschaft/Wert suchen. *Weil das gezielte Nachschlagen in Datensätzen eine Grundoperation ist.*
  - `I` – Element an bestimmtem Array-Index holen. *Weil auf Einzelpositionen innerhalb einer Liste zugegriffen wird.*
  - `V` – Globale Variablen zugreifen. *Weil formularübergreifende Werte zentral bereitgestellt werden.*
  - `Unique` / `Sorted` – Duplikate entfernen / Arrays sortieren. *Weil Daten vor Verarbeitung bereinigt/geordnet werden.*
- **Daten**
  - `Data.CSV` – CSV-Strings in Arrays umwandeln. *Weil importierte Listen direkt verarbeitbar werden.*
  - `Data.Join` – mehrere Objekte zu einem zusammenführen. *Weil Daten aus verschiedenen Quellen kombiniert werden.*
  - `JSON.Path` – Objekte an bestimmten JSON-Pfaden holen. *Weil tief verschachtelte Strukturen gezielt abgefragt werden.*
  - `DOM.Query` – DOM-Elemente per CSS-Selektor abfragen. *Weil Werte aus beliebigen Elementen gelesen werden.*
  - `Net.URL` – Inhalte von URLs abrufen. *Weil externe Quellen zur Laufzeit eingebunden werden.*
- **Datum / Zeit**
  - `Date.Today` – aktuelles Datum (mit +/− d/m/y-Arithmetik). *Weil zeitabhängige Logik (z. B. „in 14 Tagen“) automatisch korrekt bleibt.*
  - `Date.Holidays` – deutsche Feiertage je Bundesland. *Weil Fristen/Termine um Feiertage berücksichtigt werden können.*
  - `Date.Weekends` – Wochenend-Datumsbereiche erzeugen. *Weil zeitliche Lücken leicht berechnet werden.*
- **Externe Dienste**
  - `OpenPLZ` (+ `.Localities`, `.Streets`, `.TextSearch` …) – PLZ-/Adressdaten. *Weil amtliche Strukturdaten zur Adressvalidierung genutzt werden.*
  - `LDAP.Find` – Verzeichnisabfragen. *Weil Benutzer-/Organisationsdaten direkt eingebunden werden.*
  - `AI.Llama.Std.QA` – KI-Antwort als Promise (mit Internet/Geolokalisation/JSON-Parsing). *Weil KI-Ergebnisse programmatisch in die Logik eingebunden werden können.*
- **BayVIS (Bayerisches Behördenverzeichnis)**
  - `BayVIS.Ansprechpartner` / `.Details` – Kontakte. *Weil Ansprechpartner-Daten ohne eigene Schnittstelle bereitgestellt werden.*
  - `BayVIS.Behoerden` / `.Details` / `.Gebaeude` – Behörden und Gebäude. *Weil Behörden-Strukturen direkt abfragbar sind.*
  - `BayVIS.Leistungen` / `.Details` – Leistungen. *Weil Leistungsdaten direkt in Formulare einfließen.*
  - `BayVIS.Dienststellen` / `.Formulare` / `.Onlineverfahren` – Dienststellen/Formulare/Verfahren. *Weil amtliche Zuständigkeiten und Verfahren abgebildet werden.*

### 3.4 Feldreferenzen in Parametern (`<[...]>`-Notation)
- `<[this]>` → Wert des Elements, dem der Parameter gehört. *Weil dies das aktuelle Feld als Kontext nutzt.*
- `<[.FieldName]>`, `<[#id]>`, `<[input[name=x]]>` → Wert des ersten passenden Felds per CSS-Selektor. *Weil beliebige Felder gezielt referenziert werden.*
- `<[FieldName.path]>`, `<[Base::path]>` → DOM-Eigenschaft (innerHTML, value, dataset.x …) oder JSON-Pfad. *Weil auch Eigenschaften und verschachtelte JSON-Werte erreichbar sind.*
- **Timing:** Auflösung einmalig beim Initialisieren (nach Ready-Ereignis). *Weil die Werte dann stabil vorliegen.*
- **Escape:** `°<[` zeigt referenzartigen Token wörtlich (wird zu `<[`). *Weil so eine „Referenz, die wie Text wirken soll“ möglich ist.*
- Kombination mit `[%field%]` in einem Durchlauf möglich. *Weil beide Notationen aufeinander abgestimmt funktionieren.*

### 3.5 Demo-Idee
- PLZ eingeben → Ort automatisch füllen (OpenPLZ). *Weil der dynamische Datenabruf eindrucksvoll und sofort verständlich ist.*
- Oder: Summe aus zwei Feldern live prüfen. *Weil eine typische, nachvollziehbare Querrechnung demonstriert wird.*

---

## 4. Standardkonfigurationen – „Fertige Komplettpakete“
### 4.1 Was ist eine Standardkonfiguration?
- **Vorgebaute Pakete**, die Funktionalitäten *und* EPs für typische Anwendungsfälle zusammen verdrahten. *Weil sie die mühsame Einzel-Verdrahtung abnehmen und erprobte Logik bündeln.*
- Zwei Anwendungsarten:
  - **Elementbezogen:** verdrahten Funktionen für ein einzelnes Element. *Weil gezielte Verbesserungen an einem Element rasch aktiviert werden.*
  - **Ganzheitlich (holistisch):** gelten für das gesamte Formular → **ein Klick**. *Weil formularübergreifende Standards (CSS, Masken, Tracking) ohne Einzelaufwand wirken.*

### 4.2 Vorteile
- **Keine manuelle Einzel-Verdrahtung** → spart Zeit und vermeidet Fehler. *Weil Verdrahtungsfehler mit viel Aufwand verbunden und schwer zu finden sind.*
- **Best-Practice-Logik out of the box** (erprobt, sauber verdrahtet). *Weil man auf getestete Lösungen setzt statt selbst Fehler einzubringen.*
- **Lokal erweiterbar/anpassbar** über den Local API-Documentation Manager. *Weil Standards auf eigene Bedürfnisse zugeschnitten werden können.*
- **Geringe Einstiegshürde** für die Fachebene (kein technisches Wissen nötig). *Weil Fachpersonen selbstständig beginnen können.*

### 4.3 Beispiel-Kategorien (mit konkreten Paketen)
- **AI**
  - `AI` – bündelt Chat, Q&A, Extraktion, Validierung (ein Klick). *Weil die gesamte KI-Ausstattung eines Formulars in einem Schritt aktiviert wird.*
- **Adress-/Verzeichnisdaten**
  - `OpenPLZ Autocomplete Sets` – PLZ/Adress-Autovervollständigung. *Weil Adressen schnell und fehlerarm erfasst werden.*
  - `LDAP Autofill` – Felder automatisch aus LDAP füllen. *Weil Benutzerstammdaten automatisch eingetragen werden.*
  - `BayVIS` – bayerische Behörden-Daten integrieren. *Weil amtliche Strukturdaten direkt verfügbar werden.*
- **Fachlogik**
  - `Financial` – Finanzdaten-Erfassung/Validierung/Berechnung. *Weil finanzbezogene Formulare eine durchgängige Logik erhalten.*
  - `People` – personenbezogene Daten/Validierung/Lookups. *Weil personenbezogene Workflows abgedeckt werden.*
  - `Appointments` – Terminbuchung, Validierung und Workflows. *Weil Termin-Prozesse komplett abgebildet werden.*
- **UI / Layout**
  - `UI Panels` – vordefinierte Panel-Layouts und Gruppierung. *Weil Struktur/Layout ohne manuelle Arbeit entsteht.*
- **Holistisch (ganzes Formular)**
  - `Holistic CSS Standards` – organisationseinheitliches CSS. *Weil ein einheitliches Erscheinungsbild über alle Formulare gilt.*
  - `Holistic Cleave input masks` – Input-Masken für Datum/Telefon/PLZ/Uhrzeit. *Weil durchgängig formatierte Eingaben die Datenqualität heben.*
  - `Holistic Fieldsets-to-Panel` – Fieldsets in Panel-Layouts umwandeln. *Weil bestehende Formulare optisch aufgewertet werden.*
  - `Holistic Matomo Tracking` – Matomo-Analyse je Formular. *Weil Nutzungsdaten DSGVO-konform in allen Formularen erfasst werden.*
  - `Holistic Speech Input` – Sprach-Eingabe (Standard + Whisper). *Weil Spracheingabe formularweit verfügbar gemacht wird.*

### 4.4 Demo-Idee
- Ganzes Formular mit einer Standardkonfiguration aktivieren, z. B. holistisches Input-Masking. *Weil „vorher/nachher“ den größten visuellen Effekt hat.*
- Vorher/Nachher-Vergleich zeigen (wenig Konfiguration, sofort wirksam). *Weil der Einstiegsklick-Komfort direkt spürbar wird.*

---

## 5. Zusammenführung & der „Local API-Documentation Manager“
### 5.1 Warum die Kombination stark ist
- **Weil** Funktionen (Verhalten) + EPs (Daten) + Standardkonfigurationen (Pakete) **frei mischbar** sind.
- **Weil** ein komplexer Workflow = Kombination weniger Bausteine statt viel Code ist → kürzere Build-Zeit, weniger Fehler.
- **Weil** jede Ebene (Verhalten/Daten/Paket) genau einen klar abgegrenzten Zweck erfüllt und dadurch die Logik verständlich bleibt.
- **Weil** man mit Standardkonfigurationen startet und bei Bedarf einzelne Funktionen/EPs fein justiert → sanfter Einstieg mit Ausbaupotenzial.

### 5.2 Local API-Documentation Manager (Herz des Code-Sharings)
- **Eigene Elemente erstellen** direkt im Form Designer (Code + Parameter + Variablen + CSS). *Weil kein Plugin-Quellcode geändert werden muss.*
- **Point-and-click / Autocomplete** statt manuellem Vertippen. *Weil Tippfehler in technischen Namen eine häufige Fehlerquelle sind und dies sie eliminiert.*
- **JSON-Export/-Import** für Austausch über Abteilungen/Instanzen oder Community. *Weil einmal validierte Logik wiederverwendet wird statt neu entwickelt zu werden.*
- **Synchronisation** mit dem Backend (definierbar, wer synchronisieren darf). *Weil zentrale Verwaltung und kontrollierte Berechtigungen gewährleistet sind.*
- **TypeScript-Template** [`codbi-elements-template`](https://github.com/XIMA-formcycle-Entwicklerkreis/CodBi-Elements-Template) → erzeugt automatisch importierbares JSON. *Weil Entwickler in TypeScript schreiben können und das Serialisieren automatisch erfolgt.*

### 5.3 Demo-Idee
- Ein kleines eigenes Element im Manager anlegen und im Formular nutzen. *Weil die „eigene Logik ohne Kernel-Zugriff“-Idee greifbar wird.*
- Export → Import auf zweites Formular zeigen (Wiederverwendung). *Weil der Wiederverwendungs-Workflow das zentrale Versprechen sichtbar macht.*

---

## 6. Kurz: KI-Aspekte (sofern relevant fürs Publikum)
- **Voller lokaler KI-Stack auf dem Server** – kein Cloud-Zwang, keine Daten-Auslagerung. *Weil dies der entscheidende DSGVO-/Sicherheitsvorteil ist.*
- **Komponenten**
  - LLaMA (llama.cpp/GGUF) → Chat, Frage-Antwort, Dokumentenanalyse. *Weil es das zentrale Sprachmodell der lokalen KI ist.*
  - Whisper (whisper.cpp) → Spracherkennung/Diktat. *Weil Spracheingabe lokal verarbeitet wird.*
  - Tesseract (tess4j/JNI) → OCR aus Bildern/PDFs. *Weil Scans lokal entziffert werden.*
  - AI-Proxy → gesicherter, authentifizierter Zugang zu lokalen KI-Diensten. *Weil externe Systeme kontrolliert angebunden werden können.*
- **Automatische Einrichtung** beim ersten Einsatz (Download von Binaries/Modellen). *Weil „Zero-Config“ den Aufwand massiv senkt.*
- **Crash-Isolation:** separate OS-Prozesse; Modell-Absturz lässt die JVM stabil. *Weil Robustheit im Produktivbetrieb entscheidend ist.*
- **Hardware:** Vulkan/CUDA 12 mit automatischem CPU-Fallback. *Weil auch ohne GPU ein Betrieb möglich bleibt.*
- **Konformität:** DSGVO/GDPR und EU-KI-Verordnung (AI Act) – Daten bleiben im Haus. *Weil dies das ausschlaggebende Argument für öffentliche Stellen ist.*
- **Nur bei Bedarf vertiefen** – Details in [`AI-COMPONENTS-README-DE.md`](../../AI-COMPONENTS-README-DE.md). *Weil der Vortrag sonst vom Baustein-Fokus abweicht.*

---

## 7. Abschluss
- **Kurze Zusammenfassung der Kern-Vorteile**
  1. Weniger Eigen-Code → fertige, wiederverwendbare Bausteine. *Weil dies Zeit und Wartungsaufwand spart.*
  2. Wiederverwendung & Austausch über Instanzen/Teams (per JSON). *Weil getestete Logik überall genutzt werden kann.*
  3. Schnelle, fehlerarme Einrichtung (Point-and-click + Standardkonfigurationen). *Weil die Einstiegshürde sehr niedrig ist.*
  4. Lokale KI mit DSGVO-Konformität als optionales Highlight. *Weil es ein Alleinstellungsmerkmal gegenüber Cloud-Lösungen ist.*
- **Live-Demo „Wow-Moment“**
  - KI-Dokumentenanalyse in einem echten Formular zeigen (OCR + Q&A). *Weil der emotionale Höhepunkt am Ende wirkungsvoll ist.*
  - Beispiel-Dokument hochladen und Auswertung zeigen. *Weil die unmittelbare Reaktion überzeugt.*
- **Offene Punkte ansprechen**
  - Hardware-/Systemvoraussetzungen (RAM, GPU optional). *Weil der Betrieb im Vorfeld geklärt werden muss.*
  - Betrieb & Deployment (Details in [`OPERATIONS.md`](../../OPERATIONS.md)). *Weil die Verantwortlichen den Aufwand kennen müssen.*
  - KI-Compliance-Prozesse, Netzwerkfreigaben, AVV bei optionalen Web-Diensten. *Weil rechtliche Rahmenbedingungen abgesichert werden müssen.*
- **Nächste Schritte vorschlagen**
  - Onboarding-Formular durchspielen. *Weil ein erster eigener Erfolg schnell entsteht.*
  - Pilot-Formular gemeinsam bauen. *Weil der Nutzen an einem echten Anwendungsfall verifiziert wird.*
  - Fachliche Ansprechpartner/Projektteam benennen. *Weil klare Verantwortlichkeiten die Umsetzung vorantreiben.*

---

## Empfohlene Reihenfolge für ~30–45 min Vortrag

> **Hinweis:** Die Spalte „Details & Leitfragen“ erläutert jede Zeitfenster-Zeile genauer und führt die
> Kern-Aussagen/Fragen in Anführungszeichen auf, die in diesem Abschnitt beantwortet werden sollen.

| Zeit | Abschnitt | Schwerpunkt | Details & Leitfragen (Aussagen/Fragen mit Erläuterung) |
|------|-----------|-------------|---------------------------------------------------------|
| 5 min | 1. Einstieg & Warum | Einordnung, Problem, 3 Bausteine | **„Warum CodBi?“** – Einordnung des Plug-ins (Low-Code-Logik-Engine für formcycle). Leitfragen: *„Was ist CodBi?“* (vorgefertigte, wiederverwendbare Bausteine + lokale KI), *„Welches Problem löst es?“* (Weg vom individuellen Code zur wiederverwendbaren Logik), *„Was sind die 3 Bausteine?“* (Funktionalitäten = Verhalten, EPs = Daten, Standardkonfigurationen = Pakete). Differenzierung: „Daten bleiben im Haus“ (lokale KI, DSGVO/GDPR). |
| 10 min | 2. Funktionalitäten | Live-Demo (Verhalten) | **„Verhalten“** – wie Funktionalitäten Elemente transformieren/validieren/erweitern. Kern-Aussagen: *„Kein eigenes JavaScript nötig“* (per `data-cb-func`-Attribut), *„Wiederverwendbar und parametrisierbar“* (gleiche Funktion, viele Kontexte), *„Nur bei Bedarf geladen“* (Performance). Leitfragen: „Welche Kategorien gibt es?“ (AI/ML, Validierung/Transformation, Datum/Zeit, Layout/HTML, Integrationen). Live-Demo: Feld per Drag & Drop belegen und Wirkung zeigen. |
| 10 min | 3. Elementplatzhalter | Live-Demo (Datenzugriff, Feldreferenzen) | **„Dynamischer Datenzugriff“** – EPs holen Werte zur Laufzeit aus DOM, Variablen, externen Diensten. Kern-Aussagen: *„Keine hartcodierten Werte“* (Logik bleibt flexibel), *„Nur der EP-Referenzwert ändert sich, nicht der Code“*, *„EPs lassen sich lokal definieren“*. Leitfragen: „Wie greife ich auf Feldwerte zu?“ (über `<[...]>`-Notation: `<[this]>`, `<[.FieldName]>`, `<[FieldName.path]>`). Live-Demo: PLZ → Ort füllen (OpenPLZ) oder Summen-Prüfung zweier Felder. |
| 8 min | 4. Standardkonfigurationen | Live-Demo (ein Klick) | **„Fertige Komplettpakete“** – Funktionalitäten + EPs für typische Fälle verdrahtet. Kern-Aussagen: *„Ein einziger Aktivierungsklick“* (besonders bei holistischen/ganzheitlichen Paketen), *„Best-Practice-Logik out of the box“*, *„Keine manuelle Einzel-Verdrahtung“*. Leitfragen: „Was ist elementbezogen?“ (je Element), „Was ist ganzheitlich?“ (ganzes Formular, z. B. CSS-Standards, Cleave-Masken, Matomo, Speech). Live-Demo: holistisches Input-Masking mit Vorher/Nachher-Vergleich. |
| 5 min | 5. Local API-Doc Manager | Code-Sharing, Import/Export | **„Herz des Code-Sharings“** – eigene Elemente direkt im Designer erstellen. Kern-Aussagen: *„Point-and-click statt Vertippen“* (weniger Fehler), *„Eigene Logik ohne Kernel-Zugriff“*, *„JSON-Export/-Import für Wiederverwendung“*. Leitfragen: „Wie teile ich Logik über Instanzen/Teams?“ (Export/Import), „Wie erzeuge ich eigene Bausteine?“ (browserbasiert oder via TypeScript-Template `codbi-elements-template`). Live-Demo: eigenes Element anlegen + auf zweites Formular importieren. |
| Rest | 6. + 7. KI & Abschluss | nur falls relevant, Zusammenfassung, Fragen | **„Lokale KI & Abschluss“** – nur vertiefen, wenn relevant (Datenschutz-/Management-Publikum). Kern-Aussage: *„Daten bleiben im Haus – DSGVO/GDPR und EU-KI-Verordnung (AI Act)“* (LLaMA, Whisper, Tesseract lokal). „Wow-Moment“: KI-Dokumentenanalyse (OCR + Q&A). Abschluss-Fragen: *„Was sind die 4 Kern-Vorteile?“* (weniger Eigen-Code, Wiederverwendung, schnelle Einrichtung, lokale KI), *„Welche offenen Punkte/Hardware?“*, *„Was sind die nächsten Schritte?“* (Onboarding durchspielen, Pilot-Formular). |
