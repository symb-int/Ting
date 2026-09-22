# TING I02: Verfahren anlegen und Anliegen erkennen

## Ziel und verbindliche Oberfläche

Eine berechtigte Person kann ein Verfahren mit Titel und Beschreibung in der Werkstatt
anlegen, als Entwurf speichern und veröffentlichen. Bürgerinnen und Bürger können das
veröffentlichte Verfahren im Chat direkt auswählen oder ihr Anliegen frei beschreiben.
TING erkennt passende Verfahren, fragt bei Unklarheit gezielt nach und beginnt ein
eindeutig erkanntes Verfahren unmittelbar mit einer kurzen Nachricht.

Die verbindliche Gestaltung ist der TING-Entwurf Version 31 unter
<https://ting.raphaelfeikert.chatgpt.site>, Quellenstand
`20b3005a4fc63213122635a29f3b05550ad9bd5a`. Maßgeblich sind `dist/js/intake.js`,
`dist/css/intake.css`, `dist/css/workshop.css` und das dortige gemeinsame Designsystem.
Referenzansichten: `#/werkstatt/verzeichnis`, `#/werkstatt/new`, `#/anliegen/new`.
BundesSansWeb, Farben, Abstände, Buttons, Fokus und Hover folgen den gemeinsamen
TING-Komponenten. Die Werkstatt hat eine eigene Seitenstruktur.

Der Desktopchat erhält keine zusätzliche Überschrift „Neuer Vorgang / Ihr Gespräch
mit TING“. Es gibt keine Zuordnungskarte, Bestätigungsstufe oder allgemeinen
„Etwas anderes“- und Korrekturbuttons. Fachliche Ausführung, Dokumente, DAML und
Factgraph gehören nicht zu I02. Produktionsdaten enthalten keine vorangelegten
Beispielfälle und keine simulierten Modellantworten.

## Bedienablauf

1. Ein bereits existierendes Konto erhält die native Berechtigung `manage:procedures`.
2. Die Werkstatt unter `/werkstatt/verfahren` listet die gespeicherten Verfahren.
3. `/werkstatt/verfahren/neu` enthält Titel und Beschreibung. Speichern erfordert einen
   Titel; Veröffentlichung zusätzlich eine Beschreibung. Grenzen: 160 und 12.000 Zeichen.
4. Ein gespeichertes Verfahren hat eine stabile ID und eine Bearbeitungsrevision.
   Jede Veröffentlichung erstellt eine unveränderliche Fassung mit eigener ID und Versionsnummer.
5. Der Bürgerchat zeigt ausschließlich veröffentlichte Verfahren. Die Auswahl sendet
   Verfahren und Versionsreferenz an den Server. Der Server löst die Referenz erneut auf
   und speichert die Auswahl sowie die kurze Startnachricht im nativen Gespräch.
6. Freitext läuft durch den austauschbaren Matcher und danach den Gesprächsagenten.
   Unklarheiten führen zu einer gezielten Frage; sinnvolle Antwortmöglichkeiten können
   als Buttons erscheinen. Ein eindeutiges Ergebnis startet das Verfahren direkt.
7. Klickantworten stammen vom Server und werden anhand der aktuellen Assistentennachricht
   geprüft. Ein bereits getippter Nachrichtenentwurf bleibt beim Klicken erhalten.
8. Mehrere Anliegen bleiben getrennt erhalten. Der Agent klärt, womit begonnen werden soll.
   Korrekturen in Freitext können eine Zuordnung ändern. Unveränderte frühere Chats behalten
   die beim Start verwendete Verfahrensfassung.

## Technische Grenzen und Zuständigkeiten

- LibreChat stellt Anmeldung, Konten, Chatverzweigungen, Nachrichten, Generationen,
  Abbruch und Ereignisübertragung bereit. I02 verwendet diese vorhandenen Abläufe.
- `packages/data-provider/src/ting.ts` definiert die strikten gemeinsamen Laufzeitverträge.
  HTTP-Clients befinden sich in `ting-service.ts`.
- `packages/data-schemas` verwaltet Verfahren und Nachrichten. Entwurf und veröffentlichte
  Fassung liegen im selben Dokument; Aktualisierungen sind atomar auf einer normalen MongoDB.
- `packages/api/src/ting` enthält Routing, Matcher, Gesprächssteuerung und Providergrenze.
  Die Dateien unter `api` binden diese TypeScript-Module in die vorhandene API ein.
- Die Werkstatt nutzt die vorhandene Berechtigungsinfrastruktur. Sichtbarkeit eines Links
  ersetzt keine serverseitige Prüfung. Mandantenzugehörigkeit stammt aus dem authentifizierten
  Kontext; der Client kann sie nicht bestimmen.

Der Matcher erhält den autoritativen aktiven Gesprächszweig, bisherige Anliegen und einen
Snapshot des veröffentlichten Katalogs. Sein Vertrag heißt `ting.matcher.v1`. Ergebnisse
unterscheiden `matched`, `needs_information` und `unsupported`; technische Fehler sind eigene
Ergebnisse. Kandidaten referenzieren echte Verfahrensfassungen und zitieren tatsächliche
Bürgernachrichten. Modell, Promptversion und eingesetzte Komponenten bleiben intern nachvollziehbar.
Die erste Implementierung verwendet ein strukturiert antwortendes LLM. Es gibt keine erfundene
Prozentkonfidenz und keine Schlüsselwortregeln. Weitere Matcher implementieren denselben Vertrag.

Der Gesprächsagent darf Fragen und Formulierungen erzeugen, aber keine Kandidaten erfinden,
Matcherbewertungen ersetzen oder Anliegen entfernen. Serverseitige Validierung prüft IDs,
Versionen, Zitate, Fokus und Übergänge. Ein ungültiges oder abgebrochenes Ergebnis erzeugt
keinen erfolgreichen Verfahrensstart.

Der aktive Zustand wird aus den erfolgreichen Vorfahren des aktuellen Gesprächszweigs gelesen,
nicht aus einer globalen zuletzt gespeicherten Chatantwort. `tingIntake` wird zusammen mit der
Assistentennachricht gespeichert. Interne Prüfdaten gelangen nicht an den Browser. Importierte
oder clientseitig manipulierte Nachrichten können keine vertrauenswürdigen Zustände einschleusen.

## Gleichzeitigkeit und Fehler

Schreibzugriffe verwenden `requestId` und bei Änderungen `expectedEditRevision`. Derselbe
erneut gesendete Auftrag erzeugt keine zweite Veröffentlichung. Abweichende Wiederholungen und
veraltete Bearbeitungsrevisionen liefern HTTP 409. Eingaben bleiben im Formular erhalten.

Ein inzwischen neu veröffentlichtes Verfahren kann nicht über eine veraltete Auswahl gestartet
werden. Veraltete, fremde oder bereits abgelöste Antwortbuttons werden serverseitig abgelehnt.
Fehler liefern keinen erfundenen Erfolg. Datenbank-, Provider- und Netzwerkfehler bleiben
technische Fehler und werden nicht als „kein passendes Verfahren“ ausgegeben.

## Betrieb

Das vorhandene Compose-Setup bleibt bestehen. Es werden keine zusätzlichen Dienste benötigt.
Appstart, Anmeldung, Werkstatt und explizite Verfahrensauswahl funktionieren ohne Modellschlüssel.
Nur Freitext und modellbasierte Folgeantworten benötigen `OPENAI_API_KEY` und genau eine echte,
zugängliche Modell-ID in `OPENAI_MODELS`.

Die gemeinsame Konfiguration `ting` enthält den Matcher (`llm`), Modellzeitlimit, Eingabe- und
Ausgabelimits sowie die Seitengröße der Werkstatt. Die Defaults sind in `tingConfigSchema`
definiert. `TING_MATCHER_IMPLEMENTATION` wird vom vorhandenen Setup in die Konfiguration übertragen.
Ein unbekannter Matcher wird nicht stillschweigend durch eine andere Implementierung ersetzt.

Berechtigung für ein bestehendes Konto erteilen beziehungsweise entziehen:

```sh
docker compose -f compose.ting.yaml exec api node scripts/ting/procedures-access.mjs grant --user-id <konto-id>
docker compose -f compose.ting.yaml exec api node scripts/ting/procedures-access.mjs revoke --user-id <konto-id>
```

Die ID ist die native Konto-ID der Installation. Es werden keine Konten und keine besonderen
Passwörter erzeugt. Rollen- oder Gruppenberechtigungen bleiben beim Entzug einer direkten
Kontoberechtigung wirksam und werden vom Befehl ausdrücklich gemeldet.

Aktualisierung einer bestehenden Installation:

```sh
git pull --ff-only
docker compose -f compose.ting.yaml up -d --build
```

## Abnahme

Zu prüfen sind die reale Speicherung samt Wiederholung und Schreibkonflikten, Mandanten- und
Kontotrennung, die Verfahrensauswahl ohne Modell, Wiederherstellung nach Reload, Erhalt getippter
Entwürfe, Abbruch, Korrektur und die unveränderte Darstellung des freigegebenen Entwurfs.
Semantische Abnahme benötigt echte Modellaufrufe mit eindeutigen, unklaren, fachfremden,
widersprüchlichen und mehreren Anliegen. Ein Unit-Test mit eingespritztem Modell ersetzt diese
Abnahme nicht. Build und Typecheck ersetzen keinen visuellen Vergleich.
