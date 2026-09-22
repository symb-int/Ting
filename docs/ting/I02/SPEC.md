# TING · Inkrement 02

**Implementierungsauftrag: Verfahren pflegen und Anliegen im Gespräch zuordnen**  
Stand: 20. September 2026 · Design freigegeben · Umfang bis zur bestätigten Zuordnung

## 1. Was gebaut wird

TING ist eine Bürgerplattform für Anliegen, an denen später mehrere unabhängige Parteien beteiligt sein können. Der Bürger beschreibt sein Anliegen im privaten Gespräch. TING klärt, welche Unterstützung gesucht wird, und begleitet anschließend das passende Verfahren. LibreChat stellt Konten, Sitzungen, Chat, Nachrichten und deren Persistenz bereit. Die TING-Gestaltung ist verbindlich.

Dieses Inkrement liefert einen durchgängigen, echten Ablauf:

1. Ein berechtigter Betreiber öffnet die separate Werkstatt, hinterlegt **Titel und Beschreibung** eines Verfahrens und veröffentlicht es.
2. Ein Bürger beschreibt in einem normalen TING-Chat mit eigenen Worten sein Anliegen.
3. Der Agent berücksichtigt den veröffentlichten Verfahrenskatalog. Er schlägt ein passendes Verfahren vor oder stellt eine gezielte Rückfrage. Er kann auch feststellen, dass kein passendes Verfahren angeboten wird.
4. Der Bürger bestätigt oder korrigiert den Vorschlag. Die bestätigte Zuordnung bleibt zusammen mit dem Gespräch nach Neuladen und Neustart erhalten.

**Ein Verfahren ist eine wiederverwendbare Definition. Ein Vorgang bleibt der individuelle LibreChat-Chat mit seiner vorhandenen `conversationId`.** Es entsteht kein zweites Chat- oder Fallverwaltungssystem.

Die erste fachliche Definition ist „Finanzierung eines Pflegeheimplatzes“. Sie wird über die Werkstatt angelegt. Titel, Text, ID, Fragen und Zuordnung dieses Beispiels dürfen nicht als Sonderfall im Produktionscode stehen. Weitere Definitionen müssen allein durch Anlegen und Veröffentlichen hinzukommen können, ohne Codeänderung, Deployment oder Training.

### Umfangsgrenze

Enthalten: Werkstattzugang, Verfahrensliste, Anlegen/Bearbeiten, Entwurf/Veröffentlichung, semantische Anliegenklärung, Rückfragen, Vorschlag, Bestätigung, Korrektur, mehrere Anliegen, unbekannte Anliegen, Persistenz, Berechtigungen, Fehlerbehandlung und Abnahme.

Nicht implementieren: Dokument-Upload oder -auswertung als neue Funktion, Behördenkonten, Einladungen, Dateifreigaben, Anträge, Fristen, Rechtsprüfung, Spracheingabe/Transkription, zusätzliche Fachformulare, DAML-Laufzeit, Factgraph-Dienst, neue Such-/Vektordatenbank, Multi-Agenten-Orchestrierung, öffentliche Bereitstellung oder eine neue Anmeldung. Bestehende Funktionen werden nicht entfernt.

Die Produktionsanwendung enthält keine Gesprächsbeispiele, Prototyp-Werkzeugleiste, festgelegten Beispielantworten, Simulationsschalter oder Musterbürger. Testdaten und Testdoubles bleiben außerhalb der Produktionsauslieferung.

## 2. Ausgangspunkt und verbindliche Referenz

### Produktionscode

Repository: <https://github.com/symb-int/Ting>  
Bei Erstellung dieser Spec geprüfter Remote-Stand: `af78d115157acd982d2bc291b07e346ae234c3f5` auf `main`.

Auf dem aktuellen Repository aufbauen. Vorhandene Änderungen erhalten. Kein neuer LibreChat-Klon, Versionswechsel oder Austausch des Stacks. Falls `main` inzwischen weiter ist, dessen Änderungen lesen und die Erweiterung darauf aufsetzen; den genannten Commit nicht über einen neueren Stand zurücksetzen.

Der vorhandene Stack besteht aus React/TypeScript, Node/Express, den LibreChat-Paketen, MongoDB und Meilisearch. Toolchain und Dependencies werden aus `.nvmrc`, `package.json` und Lockfile übernommen. Der bestehende lokale Produktionsstart verwendet `compose.ting.yaml`.

### Design

Freigegebener Mock: <https://ting.raphaelfeikert.chatgpt.site>  
**Verbindliche eingefrorene Vorlage: Site-Version 29, Source-Commit `4b556d9a6a9e364c7d9534e1fd3528047c7cf500`.**

Das Paket `TING-I02-Handoff.zip` enthält diese Spec, die ausführbare Referenz unter `design-reference/`, die lokalen Originalschriften, CSS, Icons, Gesprächszustände, eine Prüffallliste und `design-manifest.json` mit Dateihashes. Die Vorlage ist ohne Zugriff auf die geschützte Site verwendbar. Eine spätere Änderung der Live-Site ersetzt diese Referenz nicht automatisch.

| Referenzroute | Verbindlicher Zweck | Produktionsroute |
|---|---|---|
| `#/werkstatt/verzeichnis` | Verfahrensliste | `/werkstatt/verfahren` |
| `#/werkstatt/new` | Neues Verfahren | `/werkstatt/verfahren/neu` |
| `#/werkstatt/pflegefinanzierung` | Bestehendes Verfahren bearbeiten | `/werkstatt/verfahren/:procedureId` |
| `#/werkstatt/leer` | Leerer Katalog | Gleiche Listenroute bei leerer DB |
| `#/anliegen/new` | Gesprächseinstieg | Bestehendes `/c/new` |
| `#/anliegen-beispiele/alle` | Einstieg in die sechs Designabläufe | Keine Produktionsroute |
| `#/anliegen/klar`, `unklar`, `mehrere`, `unbekannt`, `korrektur`, `weiss-nicht` | Gespräch und Interaktionszustände | Bestehendes `/c/:conversationId` |

Die Referenz enthält außerdem ältere Oberflächen. `#/werkstatt-erweitert/...`, historische Bilder und der umfangreiche Werkstattentwurf sind **keine Implementierungsvorgaben für I02**. Ausschließlich die oben genannten I02-Ansichten und ihre gemeinsam verwendeten Komponenten werden übernommen.

### Visuelle Verbindlichkeit

**Auch dieses Inkrement gestattet keine gestalterische Abweichung.** Keine frei erfundenen Panels, Navigationen, Buttons, Farben, Abstände oder Dialoge. Native LibreChat-Funktionalität ist keine Erlaubnis für native, abweichende LibreChat-Optik.

- BundesSansWeb Regular/Bold aus dem Paket verwenden; keine Ersatzschrift im abgenommenen Zustand.
- Vorhandene `TingButton`, `TingField`, `TingEmptyState`, `TingStatus` und gemeinsame TING-Tokens benutzen. Ein fehlender Baustein wird einmal im gemeinsamen TING-Komponentenbereich ergänzt.
- Sekundäre Buttons sind dauerhaft umrandet, auch ohne Hover. Primäre Aktionen folgen exakt der Vorlage.
- Sidebar: heller Hoverhintergrund mit grauem linken Marker; Auswahl mit blauem Marker. Kein blauer Hoverhintergrund.
- Leere Listen nutzen den zentralen Empty State mit gestricheltem Rahmen. Keine zusätzlichen Illustrationen oder Mindesthöhen.
- Öffnende Inhaltsflächen halten den vorhandenen gemeinsamen Abstand von 16 px zum vorherigen Container. Keine zusätzlichen Trennbalken in Formularen.
- Werkstatt ist eine eigenständige View mit eigener Navigation. Konto bleibt die bestehende eigenständige View. Keine Rückkehr zum Einstellungsmodal.
- Prototyp-Hinweise und technische Anweisungen werden nicht Teil der Produktoberfläche.
- Fachlich variable Agententexte dürfen entsprechend dem tatsächlichen Anliegen variieren. Ihre Darstellung, Typografie, Abstände und Aktionsanordnung bleiben identisch. Der Pflege-Beispieltext darf nicht allen Nutzern unterstellt werden.

Gleicher Browser, Viewport, Gerätepixelfaktor, Datenstand und geladene Schrift sind für Bildvergleiche erforderlich. Plattformbedingtes Font-Antialiasing begründet keine Änderung der Gestaltung. Fehlende visuelle Prüfbarkeit ist als offener Nachweis zu benennen, nicht als bestandene Abnahme.

## 3. Architekturentscheidung für dieses Inkrement

Ein Feature innerhalb der vorhandenen Anwendung. Kein Microservice und kein neuer Agenten-Framework-Layer.

| Bestandteil | Zuständigkeit |
|---|---|
| LibreChat | Identität, Session, privater Chat, Nachrichtenbaum, Generierungszyklus, Abbruch, Fehler, Persistenz |
| Werkstatt in React | Zwei Felder, Verfahrensliste, Speichern und Veröffentlichen |
| TING-Verfahrensservice in der bestehenden API | Validierung, Betreiberberechtigung, Entwurf und veröffentlichte Fassung |
| TING-Anliegenservice in der bestehenden API | Authentifizierten Kontext und Katalog bereitstellen, Matcher aufrufen, Ergebnis prüfen und zulässigen Gesprächszustand ableiten |
| Austauschbarer Matcher | Anliegen gegen veröffentlichte Verfahren prüfen; Kandidaten, Belege und fehlende Informationen über den gemeinsamen Vertrag zurückgeben |
| Chat-Agent mit bereits konfiguriertem Sprachmodell | Gespräch führen, Fokus und Bürgerbestätigung verstehen sowie Rückfragen und Zusammenfassungen auf Grundlage des validierten Matcherergebnisses formulieren |
| Erste Matcherimplementierung `llm` | Das vorhandene Sprachmodell für semantischen Abgleich verwenden; intern durch Jev, andere Modelle oder Kombinationen ersetzbar |
| MongoDB | Verfahrensdefinitionen sowie die vorhandenen Nachrichten mit ihrer typisierten Anliegenmetadaten-Erweiterung |

„Agentisch“ heißt hier: Die nächste Frage ergibt sich aus dem Gespräch, den noch ungeklärten Unterschieden und den angebotenen Verfahren. Es gibt keinen fest programmierten Pflege-Fragenbaum. Zustandswechsel werden dagegen explizit, typisiert und serverseitig geprüft.

DAML bleibt später für verbindliche mehrseitige Vereinbarungen, Beteiligung, Berechtigungen und Vorgangsschritte zuständig. Factgraph ist eine Python-Bibliothek; eine spätere Dienstanbindung bleibt möglich. I02 baut weder Ersatzverträge in MongoDB noch einen leeren Python-Service. Eine Verfahrenszuordnung erteilt keinerlei Informationszugriff und beweist weder rechtliche Zuständigkeit noch Leistungsanspruch.

### Tatsächliche Erweiterungspunkte

- Routen: `client/src/routes/index.tsx`; bestehende Bürgeransichten `ChatRoute.tsx` und `components/Chat/ChatView.tsx`.
- TING-Komponenten: `client/src/ting/components/`; Gestaltung: `client/src/ting/styles/`.
- Modellkonfiguration: `scripts/ting/setup.mjs`, `scripts/ting/runtime-config.mjs`.
- Tatsächlicher Chatpfad: `api/server/routes/agents/chat.js` und `api/server/controllers/agents/request.js`.
- Agenteninitialisierung: `api/server/services/Endpoints/agents/initialize.js` und `packages/api/src/agents/`.
- Mongo-Schemata: `packages/data-schemas/src/schema/{convo,message}.ts` sowie das vorhandene Modell-/Methoden-Registrierungsmuster.
- Gemeinsame DTOs und Validierung: vorhandenes `librechat-data-provider`-Paket.
- Authentifizierung: `requireJwtAuth`; Rechte: bestehende Capability-Middleware und `packages/data-schemas/src/admin/capabilities.ts`.
- Providerfehler: `packages/api/src/ting/capability.ts` und `client/src/ting/hooks/useChatCapabilityGuard.ts`.

Eine strukturierte Anliegenausgabe ist im bestehenden TING-Chat noch nicht fertig verdrahtet. Ihre Integration einschließlich der Ausgabevalidierung und Nachrichtenpersistenz ist Implementierungsarbeit dieses Inkrements. Ein geänderter Systemprompt allein erfüllt den Auftrag nicht.

**Chat und Matcher sind getrennte Module mit dem versionierten Datenvertrag aus Abschnitt 5.** Der Chat importiert keine Matcher-Provider-SDKs und enthält keine Anbieter-, Modell- oder Score-spezifischen Verzweigungen. Der Anliegenservice erhält den Matcher als Abhängigkeit. Austauschbar ist die gesamte Matcherimplementierung; sie kann intern ein Modell oder mehrere Komponenten verwenden. Der Datenaustausch bleibt JSON-serialisierbar, ohne SDK-, Mongoose- oder UI-Typen. I02 verwendet diese Grenze innerhalb desselben Prozesses und baut dafür keinen Dienst und kein Pluginframework.

## 4. Werkstatt: Zugang und Verhalten

### Zugang

Normale Anmeldung und Session weiterverwenden. Neue Capability `manage:procedures` im bestehenden Capability-System ergänzen. Sie erlaubt Lesen, Anlegen, Bearbeiten und Veröffentlichen der Verfahren des eigenen Mandanten. Gewöhnliche Bürger erhalten sie nicht. Bestehende Admins erhalten sie entsprechend dem vorhandenen Admin-Berechtigungsmechanismus.

Die direkte URL `/werkstatt/verfahren` ist der Betreiberzugang. Es entsteht kein zusätzlicher Werkstattbutton in der Bürger-Sidebar. „Zur Bürgeransicht“ führt aus der Werkstatt nach `/c/new`.

Frontend-Routenschutz und jeder Werkstatt-API-Aufruf prüfen das Recht. `401` bei fehlender Sitzung, `403` bei fehlendem Recht. Die Werkstattberechtigung gewährt keinen Zugriff auf private Bürgerchats. Bestehende Mandantenisolation auf neue Modelle anwenden; den Mandanten ausschließlich aus dem authentifizierten Kontext ableiten.

Für eine vorhandene Installation einen dokumentierten idempotenten Betreiberbefehl bereitstellen, der genau einem ausdrücklich angegebenen bestehenden Konto diese Capability erteilt oder entzieht, unter Wiederverwendung der nativen Grant-Methoden. Keine Standardkennwörter, E-Mail-Whitelist, automatische Hochstufung aller Konten oder neue Benutzerverwaltung bauen. Der Befehl ist ein reguläres Betriebswerkzeug; er wird nicht bei jedem Appstart ausgeführt.

### Felder und Zustände

| Feld | Eingabe und Regeln |
|---|---|
| Titel | Einzeilig, außen trimmen; 1–160 Zeichen für Speichern und Veröffentlichung. Leer-/Whitespace-Eingaben mit Feldfehler zurückweisen. |
| Beschreibung | Mehrzeilig, außen trimmen; 0–12.000 Zeichen im Entwurf, 1–12.000 zur Veröffentlichung. Hinweise auf Zweck und Abgrenzung wie im Mock. Keine zusätzlichen strukturierten Pflichtfelder. |

IDs, Versionsnummern, Bearbeitungsrevision und Zeitstempel erzeugt der Server. Sie sind keine Texteingaben. Eine Veröffentlichung bestätigt nur die Verfügbarkeit **für die Anliegenklärung**. Sie ist keine fachliche oder rechtliche Freigabe eines vollständigen Behördenprozesses.

| Aktion | Verpflichtendes Ergebnis |
|---|---|
| Verfahren anlegen | Leeres Formular mit Titel und Beschreibung, keine vorausgefüllten Pflegeangaben |
| Entwurf speichern | Persistiert den Entwurf; veröffentlicht nichts; bestehende veröffentlichte Fassung bleibt aktiv |
| Veröffentlichen bei neuem Verfahren | Speichert beide Eingaben und veröffentlicht genau diese Fassung |
| Änderungen veröffentlichen | Speichert und veröffentlicht genau die sichtbaren validen Eingaben, erhöht die Versionsnummer einmal |
| Wiederholung ohne Inhaltsänderung | Erfolg ohne weitere Version; keine leeren Revisionen produzieren |
| Abbrechen | Verlässt den Editor ohne Übernahme der seit dem Öffnen/Speichern vorgenommenen Änderungen |
| Neuladen | Lädt gespeicherten Entwurf und veröffentlichte Fassung aus der DB |
| Zwei Bearbeiter | Veraltete Schreibrevision wird mit `409` abgelehnt; eigene Eingaben bleiben im Formular erhalten |
| Speicherfehler | Kein Erfolgshinweis, kein Verlust der Eingaben; bestehende Oberfläche und gemeinsamer Fehlerbaustein |

Listenstatus wird abgeleitet: „Entwurf“, „Veröffentlicht“ oder „Änderungen im Entwurf“. Die neue Liste beginnt in einer echten leeren Installation leer. Es gibt keinen automatischen Seed beim Start und keine Veröffentlichung von Musterdaten durch Migration.

### Datenvertrag

Neues Mongoose-Modell `TingProcedure` nach Repositorykonvention:

```ts
type ProcedureText = { title: string; description: string };
type PublishedProcedure = ProcedureText & {
  revisionId: string;       // serverseitige UUID dieser Veröffentlichung
  version: number;          // beginnt bei 1
  publishedAt: string;      // UTC, im DB-Modell Date
  publishedBy: string;      // authentifiziertes Betreiberkonto
};
type TingProcedure = {
  procedureId: string;      // serverseitige UUID, stabil über Änderungen
  draft: ProcedureText;
  published: PublishedProcedure | null;
  editRevision: number;     // optimistic concurrency; serverseitig erhöht
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  createRequestId: string;  // interne Deduplizierung der Erstellung
  createPayloadHash: string;
  lastMutation: null | {
    actorId: string; requestId: string; payloadHash: string;
    resultingEditRevision: number;
  };
  // Mandantenfelder stammen aus dem vorhandenen Isolation-Plugin.
};
```

Entwurf und aktuelle Veröffentlichung liegen in einem Dokument. Ihre Änderung ist damit auf dem vorhandenen MongoDB-Standalone atomar möglich; kein neuer Replica-Set-Zwang. Eine neue Veröffentlichung ersetzt den aktiven Snapshot, nicht den Inhalt einer bereits verwendeten `revisionId`.

Jeder im Gespräch erzeugte Vorschlag enthält den vollständigen Snapshot aus ID, revisionId, Version, Titel und Beschreibung. So bleiben historische Zuordnungen nach Änderungen nachvollziehbar. Eine zentrale Versionshistorien-UI und deren eigene Datenspeicherung sind nicht Teil von I02. Das spätere Ergänzen eines Veröffentlichungsarchivs darf diese vorhandenen Revisionsidentitäten nicht ändern.

### Werkstatt-API

Neue Feature-Routen unter `/api/ting/procedures`, durchgehend authentifiziert und capabilitygeschützt:

| Methode/Route | Vertrag |
|---|---|
| `GET /` | Liste des eigenen Mandanten; neueste Änderung zuerst, procedureId als stabiler Tie-Breaker; Cursor-Paginierung nach vorhandenem API-Muster |
| `GET /:procedureId` | Definition einschließlich Entwurf und aktiver Veröffentlichung; fremd/nicht vorhanden: `404` |
| `POST /` | `{title, description, intent: 'save' \| 'publish', requestId}`; ID und Version erzeugt der Server |
| `PUT /:procedureId` | `{title, description, intent, expectedEditRevision, requestId}`; Speichern oder Veröffentlichen mit atomarer Revisionsprüfung |

Unbekannte Felder werden zurückgewiesen. Der Client kann keine Owner-, Mandanten-, Versions- oder Veröffentlichungszeitwerte setzen. Antworten liefern den gespeicherten Datensatz. `422` für Eingabefehler, `409` für einen Bearbeitungskonflikt. Wiederholte gleiche Erstellung mit derselben `requestId` darf keine zweite Definition erzeugen; geänderter Inhalt unter derselben Request-ID wird abgelehnt. Updates dürfen durch Transportwiederholung weder doppelte Veröffentlichung noch stilles Überschreiben erzeugen. Die Deduplizierung ist eng auf diese Mutationen begrenzt:

- Ein eindeutiger Index auf Mandant, `createdBy` und `createRequestId` verhindert doppelte Erstellung. Der Hash umfasst die normalisierten fachlichen Eingaben und `intent`. Wiederholung mit gleichem Hash liefert dieselbe ID und ihren aktuellen gespeicherten Stand; anderer Hash ergibt `409`.
- Beim Update werden die fachliche Änderung, `editRevision` und `lastMutation` in einer atomaren Dokumentänderung gespeichert. Wiederholung der letzten Mutation desselben Betreibers mit gleichem Hash liefert den gespeicherten Stand ohne weitere Änderung. Derselbe Schlüssel mit anderem Hash ergibt `409`.
- Ist inzwischen eine andere Mutation erfolgt, ergibt der alte `expectedEditRevision` einen Konflikt. Eine beliebig alte Anfrage wird nicht neu angewendet. Replays dürfen niemals eine frühere Fassung zurückschreiben.
- Diese internen Felder gelangen nicht in den Modellkatalog oder die Bürgeransicht. Keine allgemeine Job- oder Idempotenzplattform bauen.

Die interne Kataloglesefunktion der Anliegenklärung liefert ausschließlich aktive veröffentlichte Snapshots. Sie verwendet keine Werkstatt-Draft-DTOs im Prompt. Es gibt keinen öffentlichen Draft-Endpunkt.

## 5. Echte Anliegenklärung

### Getrennte Erkennung und Gesprächsführung, ein konsistenter Turn

Die bestehende Chat-API, Nachrichtenvalidierung, Eigentümerprüfung, Rate Limits, Abbruch- und Wiederholungsmechanik bleiben der Einstieg. Kein paralleler `/chat`-Dienst. Der Chat-Agent ist für die sichtbare Antwort zuständig; der Matcher schreibt keine Nachrichten und führt keine Nutzeraktionen aus.

Für einen normalen freien Bürgertext baut der Server den `MatchRequest`, ruft den konfigurierten Matcher auf und validiert dessen `MatchResult`. Anschließend erhält der Chat-Agent dieses Ergebnis zusammen mit Gespräch, aktuellem Fokus und vorhandenen Vorschlagsaktionen. Er formuliert daraus den abschließenden `IntakeDecision`. Beide Grenzen werden strikt validiert. Die erste LLM-Implementierung verwendet dafür zwei aufeinanderfolgende echte Modellaufrufe mit dem bereits konfigurierten Modell: Abgleich, danach Gesprächsantwort. Andere Matcher dürfen intern anders arbeiten; die Anzahl interner Aufrufe ist kein Bestandteil des Vertrags. Modellfreie Bestätigungs-/Korrekturbuttons behalten den unten definierten direkten Serverpfad.

Matcher und Chat-Agent dürfen keine voneinander abweichenden Verfahren auswählen. Der Server bindet Vorschlag, Kandidaten und Belege an das Matcherergebnis. Der Chat-Agent darf sie erklären, eine fehlende Information erfragen oder bei mehreren Anliegen den Fokus klären. Er darf keinen anderen Treffer erfinden, einen ungeklärten Treffer als gesichert darstellen oder einen technischen Fehler als fehlendes Angebot ausgeben.

Strukturierte Rohantworten bleiben bis zur vollständigen Validierung serverseitig gepuffert. Weder JSON noch eine vorläufige Zuordnung darf in den Bürgerchat streamen. Danach werden ausschließlich validierter Antworttext und erlaubte UI-Aktionen über den vorhandenen Nachrichtenpfad ausgegeben. Antwort, Matchernachweis und Anliegenzustand werden gemeinsam an den fertigen Turn gebunden. Der existierende Lade-/Abbruchzustand bleibt während sämtlicher interner Aufrufe erreichbar; das Abbruchsignal wird an jeden Aufruf weitergegeben.

Konfiguration, Zugangsdaten und Modell-ID bleiben serverseitig. Keine neue Auswahl für den Bürger. Der erste Matcher verwendet die vorhandene Modellkonfiguration; Jev oder weitere Provider werden in I02 nicht implementiert. Ein nicht kompatibles konfiguriertes Modell führt zu einem verständlichen Anfragefehler; es wird nicht unbemerkt auf einen anderen Matcher oder freie, ungeprüfte Klassifikation umgeschaltet.

### Gemeinsamer Matchervertrag, Version 1

Ein gemeinsames striktes Runtime-Schema im bestehenden `librechat-data-provider`-Paket definiert Bedeutung und Validierung. TypeScript-Typen werden daraus abgeleitet; das für das LLM benötigte JSON-Schema wird daraus erzeugt. Keine unabhängig gepflegten Schemakopien im Chat oder in einzelnen Adaptern. Alle Felder sind verpflichtend vorhanden; unbekannte Felder werden zurückgewiesen. Die folgenden Typen beschreiben diesen verbindlichen Vertrag:

```ts
type ProcedureRef = { procedureId: string; revisionId: string };
type Evidence = { messageId: string; quote: string };
type CatalogEntry = ProcedureRef & {
  version: number;
  title: string;
  description: string;
};
type MatchRequest = {
  contractVersion: 'ting.matcher.v1';
  requestId: string;                 // vom Server für diesen Abgleich erzeugt
  conversationId: string;
  parentMessageId: string | null;
  currentMessageId: string;
  locale: string;
  messages: Array<{
    messageId: string;
    role: 'user' | 'assistant';
    text: string;
  }>;
  priorConcerns: Array<{
    id: string;
    summary: string;
    evidence: Evidence[];
    procedure: ProcedureRef | null;  // bisherige Hypothese, keine feststehende Wahrheit
  }>;
  catalog: {
    snapshotId: string;
    entries: CatalogEntry[];
  };
};
type MatcherProvenance = {
  matcherId: string;
  implementationVersion: string;
  policyVersion: string;
  components: Array<{
    componentId: string;
    configuredModelId: string | null;
    reportedModelId: string | null;  // nur tatsächlich vom Provider gemeldete ID
    promptVersion: string | null;
  }>;
};
type MatchConcern = {
  key: string;
  existingId: string | null;
  summary: string;
  evidence: Evidence[];
  assessment: 'matched' | 'needs_information' | 'unsupported';
  candidates: Array<{
    procedure: ProcedureRef;
    evidence: Evidence[];
    scores: Array<{
      metricId: string;             // benannte, versionierte Metrik des Adapters
      value: number;
      calibrationId: string | null;
    }>;
  }>;
  selected: ProcedureRef | null;
  missingInformation: string[];     // fehlende Unterscheidung, keine fertige Chatantwort
};
type MatchResult = {
  contractVersion: 'ting.matcher.v1';
  requestId: string;
  catalogSnapshotId: string;
  provenance: MatcherProvenance;
} & (
  | { status: 'ok'; concerns: MatchConcern[] }
  | { status: 'error'; error: {
      code: 'configuration' | 'unsupported_contract' | 'context_limit'
          | 'timeout' | 'unavailable' | 'invalid_output' | 'cancelled';
      retryable: boolean;
    } }
);
interface Matcher {
  match(request: MatchRequest, options: { signal: AbortSignal }): Promise<MatchResult>;
}
```

Der Server liefert nur den berechtigten aktiven Nachrichtenast, einschließlich des aktuellen Bürgertexts. Nachrichten-IDs und Belegzitate verweisen auf Originalnachrichten. Frühere Zusammenfassungen sind Hilfskontext; Originalaussagen und ausdrückliche Korrekturen haben Vorrang. I02 verarbeitet Text. Anhänge werden weder als gelesen ausgegeben noch durch erfundene Auszüge ersetzt. `MatchRequest` und `MatchResult` sind Daten; `AbortSignal` gehört ausschließlich zur lokalen Aufrufsteuerung und wird bei einer späteren Dienstanbindung nicht als JSON übertragen.

Der Katalog enthält ausschließlich die veröffentlichten Definitionen des Mandanten. `snapshotId` ist der SHA-256-Hash der UTF-8-JSON-Darstellung von `entries`, aufsteigend nach `procedureId` sortiert, mit festgelegter Feldreihenfolge `procedureId`, `revisionId`, `version`, `title`, `description`. Eine gemeinsame Funktion erzeugt diesen Snapshot. Ein laufender Abgleich verwendet unveränderte Eingaben. Matcher dürfen intern Kandidaten suchen und bewerten, aber keine andere Katalogquelle, Entwürfe oder nicht übergebene Revisionen einführen.

Verbindliche Bedeutung der Ergebnisse:

- `concerns` beschreibt betroffene Anliegen, jeweils mit eigener Kandidatenliste. Lokale `key`-Werte sind eindeutig; `existingId` darf nur ein übergebenes Anliegen referenzieren. Nicht erwähnte Nebenanliegen werden nicht gelöscht. Für freie Bestätigungen oder Fortsetzungen wird das zugehörige bestehende Anliegen anhand der übergebenen Nachrichten erneut beurteilt. Eine leere Liste ist nur für Äußerungen ohne neue oder betroffene Anliegen zulässig, etwa eine Begrüßung; sie führt zu `respond`, niemals zu `unsupported` oder einem neuen Vorschlag. Ein erkennbares, aber unbestimmtes Hilfegesuch gehört zu `needs_information`.
- `matched`: Genau ein `selected`-Verfahren aus `candidates`, positive Belege aus Bürgernachrichten und keine offene entscheidende Unterscheidung. `missingInformation` ist leer. Ein Rang oder hoher relativer Score allein genügt nicht.
- `needs_information`: Das Anliegen oder die Abgrenzung ist noch offen. `selected` ist null. Kandidaten dürfen leer sein. `missingInformation` benennt mindestens eine zum Zuordnen fehlende Information; es verlangt weder eine fertige Frage noch ein zusätzliches Personenformular.
- `unsupported`: Das Anliegen ist hinreichend verstanden und passt zu keinem angebotenen Verfahren. `selected` ist null und `missingInformation` ist leer. Ein leerer Katalog kann dieses Ergebnis begründen; ein unklarer Bürgertext bleibt dagegen `needs_information`.
- Kandidaten werden in absteigender Präferenz geliefert; es gibt keinen impliziten Treffer an Index 0. Alle Verfahrens-/Revisionsreferenzen gehören zum übergebenen Snapshot. Ein außerhalb des Katalogs liegendes Anliegen muss auch bei genau einem Katalogeintrag abgelehnt werden können.
- Evidence verweist auf tatsächlich enthaltene Bürgeraussagen. Der Server prüft IDs, Rollen und exakte Zitate. Das prüft die Herkunft, nicht die allgemeine semantische Richtigkeit einer Schlussfolgerung. Widersprüchliche Aussagen werden im Kontext interpretiert; ein echtes älteres Zitat macht eine ausdrücklich korrigierte Annahme nicht wieder gültig.
- Technische Fehler liefern `status: 'error'`, keine Anliegenentscheidung. Eine technische Suchstörung, unvollständiger Kontext, Timeout oder kaputte Providerantwort dürfen nicht still in `unsupported` übersetzt werden. Ein leerer Suchtreffer allein beweist ebenfalls kein fehlendes Angebot. Unerwartete Adapterexceptions werden als technische Fehler behandelt.
- Request-ID, Vertragsversion und Snapshot-ID müssen zum laufenden Aufruf passen. Der Server prüft zusätzlich den weiterhin gültigen Turn vor dem Commit und verwirft verspätete/abgebrochene Ergebnisse.

`scores` darf leer sein. Jede verwendete `metricId` besitzt eine mit der Implementierung versionierte Definition: Quelle, Wertebereich, Richtung und Bedeutung. Nur dort definierte endliche Werte werden akzeptiert. Ein Rankingwert, eine Ähnlichkeit, Jevs Confidence und eine kalibrierte Wahrscheinlichkeit erhalten unterschiedliche Metrik-IDs. Eine `calibrationId` darf nur auf eine tatsächlich durchgeführte und dokumentierte Kalibrierung verweisen. Niemals fehlende Scores oder Kalibrierung erfinden.

Die versionierte `policyVersion` bezeichnet die tatsächlich verwendete Entscheidungsregel einschließlich konfigurierter Schwellen. Anbieterbezogene Schwellen werden innerhalb der Matcherimplementierung ausgewertet; der Chat konsumiert ausschließlich die vereinheitlichte Bewertung. Ein späterer Jev-Matcher kann damit etwa einen geprüften Confidence-Schwellenwert von 0,95 verwenden, ohne ihn anderen Matchern aufzuzwingen. Es gibt keine heimliche Normalisierung aller Anbieterwerte zu einer gemeinsamen „Sicherheit“.

Die erste LLM-Implementierung liefert keine selbst erfundenen numerischen Confidence-Scores. Ihre Policy sind die unten festgelegten semantischen Kriterien. Provenienz wird vom Adapter aus dem tatsächlichen Lauf erstellt, nicht vom Modell behauptet. Ein hybrider Matcher hält die tatsächlich beteiligten Komponenten fest. Externe Antworten werden explizit auf den Vertrag abgebildet und danach validiert; feste Zuordnungen zwischen Bürgerformulierungen und Verfahrens-IDs sind verboten.

Der Matcher hat keine Datenbank-Schreibrechte, keine Chataktionen und keine Behörden-/Freigabewerkzeuge. Er darf intern die zur Erkennung konfigurierten Modelle oder Suchkomponenten aufrufen. Austauschbar ist die gesamte Implementierung hinter `Matcher`, auch wenn sie aus mehreren Schritten besteht. Eine spätere Variante kann so Jev mit einer vorgeschalteten Anliegenzerlegung oder einer Kandidatensuche kombinieren, ohne den Chatvertrag zu verändern.

### Kontext des Agenten

Der Server stellt bereit:

- die tatsächlich gespeicherte aktive Nachrichtenkette dieses Bürgers bis zum aktuellen Turn;
- den zuletzt gültigen Anliegenstand genau dieses Zweigs;
- alle aktuell veröffentlichten Definitionen des eigenen Mandanten mit ID, revisionId, Titel und Beschreibung;
- die feste serverseitige Aufgabenbeschreibung und das Ausgabeschema.

Für den kleinen Katalog wird zunächst der vollständige veröffentlichte Katalog verwendet. Das vermeidet einen zusätzlichen semantischen Suchdienst und Trefferverluste durch bloße Stichwortsuche. Die Katalogbeschaffung ist eine klar abgegrenzte Funktion, damit später Retrieval ergänzt werden kann. Keine hart codierte Zahl von Verfahren, kein stilles `slice(0, N)` und kein Rückfall auf den ersten Datensatz.

Die bestehende Token-/Kontextbudgetierung muss den Katalog mitberücksichtigen. Kann der benötigte Kontext nicht vollständig übergeben werden, darf nicht „kein passendes Verfahren“ behauptet werden. Es entsteht ein behandelbarer Kontextfehler mit erhaltenem Gespräch. Unbegrenzte Kataloggröße wird für I02 nicht versprochen.

Bürgertexte und Verfahrensbeschreibungen sind Eingabedaten, keine höher priorisierten Anweisungen. Ein darin stehendes „Ignoriere das Schema“ oder eine fremde procedureId kann weder Schema, Rechte noch Katalogauswahl ändern. Außer der Interpretation und Gesprächsfortsetzung erhält der Agent in I02 keine externen Aktionswerkzeuge.

### Semantische Entscheidungsregeln

1. Anliegen nach Bedeutung erkennen, einschließlich Tippfehlern, kurzen Sätzen, Alltagssprache und indirekten Beschreibungen. Keine Regex- oder Keyword-Klassifikation als Produktlogik.
2. Ein einzelner Katalogeintrag bedeutet niemals automatisch einen Treffer.
3. Ein Vorschlag benötigt positive Hinweise auf seinen Zweck. Widersprüche oder noch offene Unterschiede, die die Wahl verändern könnten, erfordern eine Rückfrage.
4. Eine Rückfrage klärt jeweils einen entscheidenden Unterschied. Bereits beantwortete Informationen nicht erneut verlangen.
5. Keine Erhebung von Adresse, Einkommen, Pflegegrad, Ausweisnummern oder vollständigen Personendaten allein für die grobe Zuordnung, wenn sie dazu nicht nötig sind. Im Konto vorhandene Identität nicht erneut abfragen.
6. „Weiß ich nicht“ führt zu einer verständlicheren Frage oder zu einem vorerst offenen Anliegen. Kein endloses Wiederholen derselben Frage.
7. Vorhandene Lebensumstände nicht mit dem Ziel verwechseln: „Meine Mutter lebt noch zu Hause, muss aber ins Heim“ ist kein Beleg dafür, dass nur häusliche Pflege gesucht wird.
8. Mehrere Anliegen verständlich unterscheiden. Den Bürger wählen lassen, womit er beginnen möchte. Weitere Anliegen im Gesprächsstand erhalten; keine zusätzlichen Chats automatisch eröffnen.
9. Klare Anliegen außerhalb des Katalogs als derzeit nicht angeboten behandeln. Das ist eine Grenze von TINGs Angebot, kein Urteil, dass keine Behörde helfen könne.
10. Korrekturen ersetzen die bisherige Einordnung. Keine alte Zuordnung gegen eine ausdrückliche Korrektur verteidigen.
11. Knappe, respektvolle Sprache. Keine Intelligenzbewertung, keine Wahrscheinlichkeitszahlen, kein Technikjargon.

**Konfidenz bleibt matcherbezogen.** Die erste LLM-Variante entscheidet anhand der genannten Kriterien. Spätere Matcher dürfen dokumentierte eigene Scores und Schwellen verwenden, einschließlich Jev. Ihre Bedeutung wird durch den Vertrag und die tatsächlich geprüfte Policy festgelegt. Bürgerbestätigung und Schema-Validierung ersetzen keine Messung der semantischen Qualität; die Abnahme belegt nur die tatsächlich geprüften Fälle.

### Nachgelagerter Gesprächsvertrag

`IntakeDecision` ist der nachgelagerte Gesprächsentscheid, nicht die Schnittstelle eines Matchers. Er enthält Antwort, Fokus und Aktionen. Sein einzelner `candidate` gehört ausschließlich zum fokussierten Anliegen; die Kandidatenlisten weiterer Anliegen bleiben im zugehörigen `MatchResult` erhalten. Keine beliebigen HTML-/Komponentenbeschreibungen aus dem Modell:

```ts
type IntakeDecision = {
  outcome: 'clarify' | 'propose' | 'unsupported' | 'multiple'
         | 'confirm' | 'continue' | 'respond';
  clarificationReason: 'classification' | 'confirmation' | null;
  reply: string;
  concerns: Array<{
    key: string;           // eindeutiger lokaler Schlüssel innerhalb dieses Ergebnisses
    existingId: string | null; // bereits bekannte Server-ID oder null für ein neues Anliegen
    summary: string;
  }>;
  focusKey: string | null;  // verweist auf concerns[].key, nicht auf eine neue Server-ID
  candidate: null | {
    procedureId: string;
    revisionId: string;
    evidence: Array<{messageId: string; quote: string}>;
    unresolvedQuestions: string[];
  };
  referencedProposalId: string | null;
  quickReplies: Array<{label: string; text: string}>; // höchstens drei
};
```

Alle Eigenschaften explizit vorhanden, keine zusätzlichen Eigenschaften. Neue Anliegen-IDs, proposalIds, Versionsdaten und Anzeigeaktion-IDs erzeugt der Server. `key` ist ausschließlich ein lokaler Verweis innerhalb eines Modellergebnisses. Der Server prüft seine Eindeutigkeit, übersetzt ihn beim Speichern in die bestehende oder neu erzeugte Anliegen-ID und löst `focusKey` über diese Zuordnung auf. `existingId` darf nur auf ein bekanntes Anliegen dieses aktiven Gesprächszweigs zeigen. Die Liste beschreibt betroffene Anliegen; nicht erwähnte Nebenanliegen bleiben erhalten und werden nicht durch Weglassen gelöscht. Bei Matcher-Turns müssen `concerns` mit ihren `key`, `existingId` und `summary` exakt dem validierten Matcherergebnis entsprechen. Der Server übernimmt diese Daten daraus; widersprüchliche Chat-Ausgaben werden abgelehnt. Der Chat-Agent darf Anliegen nicht umbenennen, zusammenlegen oder neu erfinden. Evidence sind kurze belegende Bürgeraussagen aus der übergebenen Nachrichtenkette, keine Gedankengänge des Modells. Zitate auf Nachrichtenbesitz und tatsächlichen Text prüfen; nicht ungeprüft in Logs ausgeben.

Servervalidierung zusätzlich zur Syntax:

- `propose`: Das fokussierte Matcher-Anliegen hat `assessment: 'matched'`. Candidate entspricht exakt dessen `selected`, Evidence wird aus diesem Ergebnis übernommen, `unresolvedQuestions` ist leer. Nur der serverseitige veröffentlichte Titel wird als Verfahrenstitel gerendert.
- `clarify`, `unsupported`, `multiple`: Keine bestätigte Zuordnung erzeugen. Kein Candidate wird still übernommen.
- `clarify` mit `clarificationReason: 'classification'` basiert auf `needs_information`; die Frage klärt eine der genannten fehlenden Informationen. `clarify` mit `clarificationReason: 'confirmation'` ist nur bei einem noch gültigen offenen Vorschlag und einem damit übereinstimmenden `matched`-Befund erlaubt; es klärt eine zweideutige Bürgerbestätigung und erhält den Vorschlag. Für andere Outcomes ist `clarificationReason` null. `unsupported` erfordert den entsprechenden Matcherbefund. Bei mehreren betroffenen Anliegen ohne schon ausdrücklich gewählten Fokus ist zuerst der Fokus zu klären.
- `confirm`: Nur ein bereits offener Vorschlag derselben aktiven Nachrichtenkette darf bestätigt werden. Die aktuelle Bürgernachricht muss die Bestätigung tragen; das Modell darf nicht seinen gerade erst selbst erzeugten Vorschlag bestätigen.
- `continue`: Darf eine vorhandene bestätigte Zuordnung erhalten, aber keine neue erzeugen. Bei Korrektur oder widersprechendem Ziel wird neu geklärt.
- Freie `confirm`-/`continue`-Entscheide setzen für dasselbe bestehende Anliegen einen aktuellen `matched`-Befund mit derselben Verfahrens-ID voraus. `confirm` verlangt zusätzlich dieselbe Revision wie der noch gültige offene Vorschlag. Eine bereits bestätigte historische Revision bleibt bei `continue` unverändert, auch wenn der Katalog inzwischen eine neuere Revision enthält. Widerspruch, `needs_information` oder `unsupported` erlauben keine Bestätigung/Fortsetzung der bisherigen Einordnung. Modellfreie Buttons folgen stattdessen der gespeicherten, revisionsgeprüften Aktion.
- `respond`: Nur bei leerem `MatchResult.concerns`; `focusKey`, `candidate` und `referencedProposalId` sind null, `concerns` und `quickReplies` leer. Eine gewöhnliche Gesprächsantwort wird gespeichert, ohne Anliegen, Fokus, Vorschlag oder bestätigte Zuordnung zu verändern. Das ist keine Umgehung eines widersprechenden Matcherbefunds.
- `referencedProposalId` muss zum aktuellen Bürger, Zweig und Anliegen gehören; IDs aus anderen Chats werden zurückgewiesen.
- Labels/Textvorschläge sind Plaintext, HTML wird nicht ausgeführt. Antworten enthalten keine erfundenen Versand-, Freigabe- oder Behördenaktionen.
- Verstöße gegen Schema, Referenzen, Belege oder Zustandsregeln werden nicht zu einem „besten Treffer“ repariert. Der normale wiederholbare Fehlerzustand erscheint; kein Zustand wird übernommen. Allgemeine semantische Richtigkeit kann dieser Validator nicht garantieren.

### Bestätigen und Antwortoptionen

Die Vorschlagskarte zeigt wie im Entwurf eine kurze Zusammenfassung und den veröffentlichten Verfahrenstitel. „Ja, das stimmt“ bestätigt **diesen konkreten Vorschlag**; „Nein, anders“ öffnet die Korrektur im gleichen Chat.

Für Aktionsbuttons sendet der Client innerhalb des nativen Chat-Requests nur serverseitig ausgegebene `actionId`, zugehörige `proposalId`/Nachrichten-ID und eine Request-ID. Der Server löst die gespeicherte Aktion auf. Keine vom Browser gelieferten Verfahrenstexte oder Zielzustände akzeptieren. Die Bestätigung per Button benötigt keinen weiteren Modellaufruf.

Dafür bleibt `POST /api/agents/chat` der einzige Gesprächseinstieg. Sein normaler Request erhält optional `tingAction: {actionId, proposalId, requestId}`. Bei Aktionen ohne Vorschlag ist `proposalId` null. Die vorhandene `parentMessageId` bestimmt den angefragten Nachrichtenast. Nach Authentifizierung und Conversation-Access-Prüfung löst der Server die gespeicherte Aktion auf und ersetzt den Bürgertext durch deren gespeicherten Plaintext; clientseitige Texte und Aktionsarten sind keine Autorität.

Es gibt genau drei Aktionsarten: `reply` sendet die gespeicherte Antwort in den normalen Modell-Turn; `confirm_proposal` bestätigt den aktuellen Vorschlag; `correct_intake` deaktiviert die aktuelle Einordnung und fragt „Was habe ich falsch verstanden?“. Die letzten beiden schreiben über den bestehenden Nachrichtenzyklus eine Bürgernachricht und eine deterministische Assistant-Nachricht mit passendem `tingIntake`, ohne Providerinitialisierung. Nur eine serverseitig erfolgreich aufgelöste modellfreie Aktion darf die Modellzugangsprüfung überspringen. Ein vom Client gesetztes Flag darf das nicht bewirken.

Vor dem Schreiben werden Eigentümer, aktiver Elternzweig, noch gültige Aktion, Vorschlagsrevision und Generierungszustand geprüft. Der bestätigte Snapshot stammt aus dem gespeicherten Vorschlag, niemals aus dem Request. Veraltete Aktionen ergeben `409` und den aktuellen lesbaren Gesprächsstand; sie eröffnen nicht unbemerkt einen neuen Zweig. Die Request-ID wird an die native Bürger-/Assistant-Nachrichtenoperation gebunden. Ein Transport-Retry liest deren vorhandenes Ergebnis, statt zwei weitere Nachrichten zu erzeugen. Bei einem Teilfehler muss dieselbe Operation wiederaufnehmbar sein; eine Bestätigung gilt erst mit der fertig gespeicherten Assistant-Nachricht als erfolgt.

Freie Antworten bleiben möglich: „Ja, genau“ kann durch den strukturierten `confirm`-Entscheid auf den offenen Vorschlag bezogen werden; zweideutige Antworten dürfen nicht als Zustimmung ausgelegt werden. Quick Replies stellen dieselbe Bürgerantwort wie eine Texteingabe dar und werden im normalen Nachrichtenverlauf gespeichert.

Aktionsbuttons werden nur beim aktuellen relevanten Beitrag aktiviert. Historische Vorschläge bleiben als Gesprächsinhalt lesbar. Ein alter Klick darf keine neuere Zuordnung überschreiben.

### Zustandswirkung eines validierten Ergebnisses

Pro Anliegen werden Zustand, offener Vorschlag und bestätigter Snapshot geführt. Die folgende Tabelle ist verbindlich; der Server entscheidet die Mutation, nicht frei formulierte Modelltexte:

| Outcome | Wirkung auf das fokussierte Anliegen |
|---|---|
| `clarify`, Grund `classification` | Zustand `clarifying`; früheren offenen Vorschlag und aktuelle bestätigte Zuordnung deaktivieren |
| `clarify`, Grund `confirmation` | Offenen gültigen Vorschlag im Zustand `proposed` erhalten; noch keine Bestätigung |
| `propose` | Zustand `proposed`; genau einen neuen Vorschlag setzen, frühere aktive Einordnung ersetzen |
| `unsupported` | Zustand `unsupported`; kein aktiver Vorschlag und keine bestätigte Zuordnung |
| `multiple` | Betroffene Anliegen ohne stillen Fokus speichern; bei neu aufgeteilten/inhaltlich korrigierten Anliegen keine alte Zuordnung übernehmen; als nächstes Fokus erfragen |
| `confirm` | Nur offenen, gültigen Vorschlag des fokussierten Anliegens in `confirmed` überführen; Vorschlagsaktion verbrauchen |
| `continue` | Nur eine unveränderte bereits bestätigte Einordnung erhalten; keine geänderte Beschreibung, neue Candidate-ID oder neue Zuordnung zulassen |
| `respond` | Bestehenden Anliegenstand einschließlich Fokus und Vorschlag unverändert erhalten |

`clarify`, `propose`, `unsupported`, `confirm` und `continue` benötigen einen gültigen Fokus. `multiple` benötigt mindestens zwei betroffene Anliegen und hat zunächst keinen Fokus. `respond` erzeugt keinen neuen Fokus. Nicht betroffene Nebenanliegen bleiben unverändert. Ein früherer Snapshot bleibt in seiner historischen Nachricht erhalten, auch wenn er nicht mehr die aktuelle Einordnung ist. Ein Ergebnis, das diese Bedingungen nicht erfüllt, wird als ungültig behandelt.

## 6. Zustände, Persistenz und Nebenläufigkeit

Die Anliegenzustände sind `unresolved`, `clarifying`, `multiple`, `unsupported`, `proposed`, `confirmed`. Lade- und Providerfehler sind zusätzliche Anfragezustände; sie sind kein fachlicher „unsupported“-Befund.

| Ausgang | Ereignis | Ergebnis |
|---|---|---|
| Neuer oder ungeklärter Chat | Bürger beschreibt Anliegen | Validierter Agentenentscheid: Rückfrage, mehrere Anliegen, kein Angebot oder Vorschlag |
| Rückfrage | Bürger antwortet | Kontext ergänzt; erneut entscheiden, nicht bei null beginnen |
| Mehrere Anliegen | Bürger wählt Fokus | Ein Anliegen aktiv, weitere bleiben offen |
| Vorschlag | Explizite Bestätigung | Exakten veröffentlichten Snapshot dem Anliegen zuordnen |
| Vorschlag/bestätigt | Korrektur | Bisherige Zuordnung nicht mehr als aktuell behandeln; neu klären |
| Kein Angebot | Bürger ergänzt/korrigiert | Erneute Prüfung gegen den aktuellen veröffentlichten Katalog |
| Beliebig | Abbruch/Provider-/Schemafehler | Kein neuer fachlicher Zustand; gespeicherte Nachricht und Wiederholen bleiben verfügbar |
| Beliebig | Neuladen/anderer Nachrichtenzweig | Den zu diesem Zweig gehörenden persistierten Stand darstellen |

Die vorhandenen Nachrichten bleiben die einzige Gesprächshistorie. Die fertig gespeicherte Assistant-Nachricht erhält ein typisiertes `tingIntake`-Feld mit Schema-Version, Ergebniszustand, Anliegenstand, Fokus, gegebenenfalls Vorschlag/bestätigtem Snapshot sowie serverseitigen Aktionen. Der aktuelle Zustand wird aus dem letzten erfolgreich abgeschlossenen einschlägigen Beitrag der aktiven Elternkette abgeleitet. Keine unabhängig fortgeschriebene zweite Transcript-Sammlung.

Für jeden abgeschlossenen Matcher-Turn enthält `tingIntake` zusätzlich den validierten `MatchResult`, den zugehörigen unveränderlichen Katalogsnapshot, die verwendeten Nachrichten-IDs und die Versionskennung der Chat-Instruktionen. Originalnachrichten werden über diese IDs referenziert und nicht als zweites Transcript kopiert. Provider-, Matcher-, Policy- und Vertragsversion bleiben damit dem wirklichen Ergebnis zugeordnet. Interne Prompts, Scores, Zugangsdaten und technische Provenienz erscheinen nicht im Bürgerdialog. Modellfreie Aktionen referenzieren den gespeicherten Vorschlag und erzeugen keinen erfundenen Matcher-Lauf. Ein späterer Matcherwechsel verändert keine historischen Ergebnisse.

Native User-/Assistant-Nachrichten werden weiterhin durch den existierenden Generierungszyklus geschrieben. Sichtbarer Antworttext und dazugehöriges `tingIntake` müssen im selben fertigen Assistant-Dokument übereinstimmen. Abgebrochene oder fehlerhafte Nachrichten begründen keine neue Zuordnung. Der Client darf `tingIntake` weder durch Import noch durch Nachrichtenbearbeitung als vertrauenswürdige Serverdaten einschleusen.

Pro Turn gelten bestehende Owner-/Mandanten- und Generierungsprüfungen. Wiederholte Requests erzeugen keine zweite Bestätigung. Ein später fertig werdender alter Modelllauf darf keinen neueren Turn ersetzen. Bearbeiten oder Regenerieren einer früheren Nachricht macht spätere Metadaten nicht zum Zustand eines neuen Zweigs; nur dessen tatsächliche Elternkette zählt.

Wird ein Verfahren zwischen Vorschlag und Bestätigung neu veröffentlicht, ist der alte Vorschlag für eine neue Bestätigung veraltet. Statt stiller Umbindung wird anhand des aktuellen veröffentlichten Stands neu vorgeschlagen. Eine bereits erfolgte Bestätigung bleibt historisch an ihren Snapshot gebunden. Es gibt in I02 noch keinen automatischen Wechsel eines laufenden Fachverfahrens.

Beim Löschen eines Chats werden dessen Anliegenmetadaten mit den vorhandenen Nachrichten entfernt. Bei Archivierung bleiben sie erhalten. Werkstattentwürfe werden niemals Bürgerchat-Metadaten.

## 7. Konfiguration, Fehler und Entwicklung

**Die App startet und funktioniert ohne OpenAI-Key.** Ohne Key bleiben Registrierung, Anmeldung, Navigation, Werkstatt, Speichern/Veröffentlichen und Lesen gespeicherter Chats nutzbar. Nur die tatsächliche Modellanfrage scheitert mit dem bestehenden verständlichen Providerfehler. Keine Demoantwort und kein Startverbot.

`OPENAI_API_KEY` und die eine zugängliche Modell-ID in `OPENAI_MODELS` bleiben die bestehende Konfiguration. Keine Secrets versionieren, an den Browser senden oder in die Abnahme kopieren. Ein fehlender Schlüssel ist kein Grund, Entwicklung, DB-Tests oder Designumsetzung anzuhalten. Nur der echte Modellnachweis bleibt dann ausdrücklich offen.

Die bestehende serverseitige `librechat.yaml`-Konfiguration erhält `ting.matcher.implementation`, Standard `llm`, im vorhandenen `configSchema`. Die erste Version akzeptiert nur tatsächlich implementierte Varianten. Unbekannte Werte ergeben einen klaren Matcher-Konfigurationsfehler beim Aufruf; kein stiller Ersatz und kein Startverbot für Konto, Werkstatt oder gespeicherte Chats. Der Composition Root erzeugt den konfigurierten Adapter und übergibt ihn an den Anliegenservice. Spätere Implementierungen werden dort registriert und über dieselbe Konfiguration gewählt; dafür müssen Chat-Komponenten, API-Nachrichtenformat und gespeicherte Zustände nicht geändert werden. Ein Wechsel gilt für neue Turns; laufende Turns behalten die beim Start gebundene Implementierung. Kein Auswahlmenü und kein Experimentierschalter für Bürger.

Providerabhängige Optionen gehören zum jeweiligen Adapter und werden dort strikt geprüft. I02 ergänzt weder unbenutzte Jev-Zugangsdaten noch leere Jev-/Hybridadapter. Gemeinsame Vertragserweiterungen werden versioniert; eine inkompatible Version wird ausdrücklich abgelehnt, niemals durch Weglassen unbekannter Bedeutung akzeptiert.

Vorhandene Konten, Chats, private Konfiguration und Docker-Volumes bleiben erhalten. Neue DB-Felder sind optional für Bestandsnachrichten. Bestehende Chats werden lesbar bleiben; die erste neue Bürgernachricht kann ihre Anliegenklärung auf Grundlage des vorhandenen aktiven Gesprächs beginnen. Keine nachträglichen Modellaufrufe für sämtliche Bestandschats.

Normales Update muss weiterhin genügen:

```sh
git pull --ff-only
docker compose -f compose.ting.yaml up -d --build
```

Neue Indizes/Schema-Ergänzungen idempotent im vorhandenen Migrations-/Startmuster berücksichtigen. Kein `down -v`, keine DB-Neuanlage und keine manuelle Manipulation von Mongo-Dokumenten verlangen. Einmalige Capability-Vergabe und vorhandene Modellkonfiguration werden in `docs/ting/ENTWICKLUNG.md` knapp ergänzt.

Keine zusätzlichen Laufzeitcontainer. Vorhandene Meilisearch-Chatsuche bleibt erhalten; Verfahren müssen für diesen kleinen Umfang nicht über einen neuen Suchindex laufen.

## 8. Umsetzung in kleinen überprüfbaren Schritten

1. **Baseline sichern.** Aktuelles `main` lesen; Spec/Designquellen im Repo unter `docs/ting/I02/` referenzieren bzw. ablegen, außerhalb des ausgelieferten Clients. Lockfile und vorhandene Run-1-Korrekturen erhalten.
2. **Verfahrensdaten und Rechte.** DTOs, Modell, Indizes, Capability, CRUD/Publikation und konkurrierendes Speichern implementieren. Noch kein LLM nötig.
3. **Werkstatt.** Die drei Routen mit den freigegebenen Komponenten bauen. Leere Liste, Entwurf, Veröffentlichung und Bearbeitung funktionieren gegen die echte DB.
4. **Anliegenservice und Matcher.** Gemeinsamen versionierten Runtime-Vertrag und daraus abgeleitete Typen anlegen. Einen echten LLM-Matcher per Dependency Injection und serverseitiger Auswahl anbinden. Aktive Chatkette und vollständigen veröffentlichten Snapshot übergeben; danach den getrennten Chat-Agenten mit dem validierten Ergebnis aufrufen. Gesamten Turn über den bestehenden Nachrichtenpfad validieren und speichern. Keine fest programmierten Beispielantworten und keine leeren Zukunftsadapter.
5. **Chatdarstellung.** Vorschlag, kurze Antwortoptionen, Bestätigung und Korrektur mit den bestehenden TING-Nachrichtenkomponenten rendern. Reload, Retry, Abbruch und Zweige berücksichtigen.
6. **Gezielt abnehmen.** Die unten definierten Fälle und visuellen Vergleiche durchführen; Fehler beheben, keine sachfremden Umbauten anschließen.
7. **Ausliefern.** Nachvollziehbare Commits ins vorhandene Repository pushen. Remote-SHA prüfen. Benutzer erhält knapp den Commit, Updatebefehl und drei Einstiege zum Testen. Bei fehlgeschlagenem Push niemals „gepusht“ behaupten.

## 9. Verbindliche Abnahme

### Funktion und Berechtigungen

- Leere Installation zeigt Empty State; neues Verfahren kann ohne API-Key als Entwurf gespeichert und mit vollständiger Beschreibung veröffentlicht werden.
- Bürger kann weder Werkstatt aufrufen noch ihre APIs durch direkte Requests benutzen; ein berechtigter Betreiber kann seine Mandantendefinitionen pflegen.
- Fremde Bürgerchats, Nachrichten-IDs, Aktionen und tenantIds werden serverseitig zurückgewiesen.
- Nicht veröffentlichter Entwurf wird dem Modell niemals angeboten. Editierter Entwurf verändert bestehendes Routing nicht. Neue Veröffentlichung wird bei der nächsten Anfrage berücksichtigt, ohne Neustart.
- Zweimaliger Klick/Retry erzeugt keine doppelte Definition oder Version. Konkurrierende Bearbeitung überschreibt nicht unbemerkt.
- Vorschlag/Bestätigung einschließlich Versionssnapshot bleiben nach Reload und Containerneustart gleich.
- Korrektur, Abbruch, veraltete Vorschlagsaktion und verspätete Modellantwort erzeugen keine falsche aktuelle Zuordnung.
- Fehlender Key, Providerfehler, ungültiges JSON, nicht gelieferte procedureId und Kontextüberlauf sind Fehler, niemals angebliche Treffer oder „kein Verfahren“.
- Keine neue Funktion beeinträchtigt Anmeldung, eigenständige Kontoview, Sidebarhover, normale Chatpersistenz oder Suche.

### Austauschbarkeit und Vertrag

- Chat-Agent, UI und Zustandsübergänge kennen nur den gemeinsamen Matchervertrag. Im Chat gibt es keine Verzweigung auf `llm`, `jev`, konkrete Modellnamen oder Score-Grenzen.
- Der echte `llm`-Adapter durchläuft denselben Vertrag wie jede spätere Variante. Ein schmaler isolierter Vertragstest darf eine zweite kontrollierte Implementierung injizieren, um die Entkopplung, Abbruchweitergabe und Ergebnisvalidierung zu prüfen. Sie bleibt ausschließlich im Unit-Test und ist kein produktiver zweiter Matcher und keine fachliche Abnahme.
- Prüfen: mehrere Anliegen mit getrennten Kandidaten, fehlende Scores, ungültige Score-Definition, gefälschte Evidence, fremde Katalog-/Revisionsreferenz, veraltete Request-ID, Kontextfehler und abgebrochener Lauf. Kein Fehler darf zum Treffer oder `unsupported` werden.
- Der nachgelagerte Chat-Agent darf ein `needs_information` nicht in `propose` umdeuten und kein anderes Verfahren auswählen. Der Server weist widersprüchliche strukturierte Ausgaben zurück.
- Freie Bestätigung mit gleichzeitiger fachlicher Korrektur darf die alte Zuordnung nicht bestätigen. Eine unklare Bestätigung erhält den passenden offenen Vorschlag bis zur Klärung. Eine reine Begrüßung erzeugt weder eine künstliche Anliegenzuordnung noch einen fachlichen Fehler.
- Gespeicherte Ergebnisse lassen Matcherimplementierung, Modell-/Promptversion, Policy und tatsächlich verwendeten Katalog erkennen. Ein Konfigurationswechsel verändert keine historischen Zuordnungen.
- Ein kompletter Lauf über echten Login, Werkstatt, DB, konfigurierten LLM-Matcher, Chat-Agent und Persistenz bleibt zwingend. Kein Testdouble, handgebautes Providerereignis oder geskripteter Dialog ersetzt diesen Nachweis.

### Fachliche Routingprüfung

`routing-acceptance.json` im Paket legt Eingaben und zulässige Ergebnisse fest. Prüfen gegen ein tatsächlich konfiguriertes Modell, mit dokumentierter Modell-ID und Prompt-/Schema-Version. Keine echte personenbezogene Daten verwenden.

Zwei getrennte Prüfungen:

1. Pflegefinanzierung als einziger veröffentlichter Eintrag: klare positive Anliegen, unklare Anliegen, Ausschlüsse, mehrere Anliegen und Korrekturen prüfen. Kein einziges klares Negativbeispiel darf als Pflegefinanzierung vorgeschlagen oder bestätigt werden. Explizit unklare Fälle müssen zunächst nachfragen. Klare positive Fälle sollen unmittelbar vorschlagen; unnötige Rückfragen als Fehler dokumentieren.
2. In einer isolierten Test-DB zwei zusätzliche, rein synthetische Verfahren über dieselbe API anlegen/veröffentlichen. Nachweisen, dass das Modell diese erkennt, dass unbekannte Anliegen dennoch unbekannt bleiben und dass Beschreibung/Veröffentlichung statt Titel-Keyword oder Codekonstante die Auswahl bestimmen. Testdaten nicht in die ausgelieferte Installation einspielen.

Zusätzlich mindestens fünf neue, nicht aus dem Mock übernommene Formulierungen prüfen. Ergebnis pro Fall mit Status und Zahl der Rückfragen dokumentieren; ein Durchschnitt verdeckt keine falsche Zuordnung eines Negativfalls. Diese Prüfung belegt die geprüften Fälle, keine garantierte allgemeine Erfolgsquote.

Deterministische Tests decken Berechtigungsprüfung/Isolation, Schema, Revisionswechsel, Idempotenz, Abbruch und Zweigkonsistenz ab. Ein erfolgreich gemockter Provider-Test ersetzt den echten Modelllauf nicht. Die Prompt-/Schema-Grenzen werden mit manipulierten Bürger- und Beschreibungstexten getestet.

### Gestaltung und Bedienung

Referenz und Implementierung bei **1440 × 900** und **390 × 844 CSS-Pixeln**, zusätzlich die vorhandene mobile/Desktop-Umschaltgrenze prüfen. Schrift vollständig laden. Pflichtzustände:

- Werkstattliste leer und gefüllt;
- Anlegen, Feldfehler, gespeicherter Entwurf;
- veröffentlichtes Verfahren und bearbeiteter unveröffentlichter Entwurf;
- Chateinstieg, Rückfrage, Vorschlag, Bestätigung;
- Korrektur, kein Angebot und mehrere Anliegen;
- Hover und Fokus der verwendeten Aktionen sowie Sidebar;
- Fehler mit erhaltenem Composer; lange Verfahrensbezeichnung; Tastaturbedienung und Mobilscrollen.

Screenshots und Überlagerungen aus der mitgelieferten Referenz selbst erzeugen. Der Benutzer muss keine Screenshots liefern. Keine Implementierungsaufnahme als ihre eigene Referenz verwenden, keine Baseline zur Kaschierung einer Abweichung austauschen. Fachlich variable Texte für Bildvergleiche durch testseitig kontrollierte Antworten angleichen; diese Fixtures gelangen nicht ins Produktionsbundle.

Vorhandene passende Tests weiterverwenden. Neue Tests dort ergänzen, wo sie einen konkreten Fehler verhindern. Kein globaler Test-/CI-Umbau für dieses Inkrement.

### Abschlussstatus

„I02 erfüllt“ ist nur zulässig, wenn echte DB-/Berechtigungs-/Persistenzprüfungen, die Modellfälle und die visuelle Prüfung nachvollziehbar abgeschlossen sind. Offene Nachweise präzise nennen. Eine fehlende Modellkonfiguration verhindert die Behauptung einer vollständigen Modellabnahme, aber weder den Appstart noch die Fertigstellung des übrigen Umfangs.

## 10. Erste reale Katalogdefinition

Über die Werkstatt eingeben; kein automatisch angelegter Produktdatensatz:

**Titel:** Finanzierung eines Pflegeheimplatzes

**Beschreibung:** Für Menschen, die die Kosten eines dauerhaften Pflegeheimplatzes nicht vollständig tragen können. Das Verfahren klärt, welche Unterstützung zur Finanzierung infrage kommt, auch wenn Angehörige das Anliegen vorbringen. Nicht umfasst sind die Suche nach einem freien Heimplatz und die Organisation von Pflege zu Hause.

Diese Beschreibung dient ausschließlich der Themenzuordnung. Rechtliche Voraussetzungen, konkrete Leistungsträger und Fachschritte sind damit noch nicht modelliert.

## 11. Quellen und Einordnung

Die konkreten Erweiterungspunkte wurden im TING-Repository untersucht; dieser Auftrag verlangt keine Anpassung an einen inzwischen neueren LibreChat-Upstream. Die offizielle [LibreChat-Agentendokumentation](https://www.librechat.ai/docs/features/agents) beschreibt Agenteninstruktionen, Modellkonfiguration und Werkzeuge als vorhandene Grundbausteine. Die hier festgelegte Anliegenlogik, Typisierung und Persistenz müssen zusätzlich implementiert werden.

Die verbindliche visuelle Quelle ist der eingefrorene TING-Entwurf im Paket, nicht die LibreChat-Dokumentation. Die Zustandsfälle sind Designreferenzen, keine produktive Klassifikationslogik.
