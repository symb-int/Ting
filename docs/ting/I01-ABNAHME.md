# TING Inkrement 01: Abnahmeprotokoll

Stand: 18. September 2026

Aktueller Korrekturlauf: [Run 1 – Designabgleich](RUN1-DESIGNABGLEICH.md). Die folgenden
Ergebnisse beschreiben den dort genannten historischen Commit, nicht den aktuellen Branch.

Dieses Protokoll führt ausschließlich tatsächlich ausgeführte Prüfungen auf. Technische,
funktionale und visuelle Nachweise werden getrennt bewertet. Insbesondere ergibt sich aus einem
grünen Build, Typecheck oder Browserablauf noch keine vollständige visuelle Übereinstimmung mit der
TING-Referenz.

## Statusregeln

| Status | Bedeutung |
|---|---|
| `PASS` | Der beschriebene Prüffall wurde vollständig ausgeführt und das erwartete Ergebnis belegt. |
| `AUSSTEHEND` | Der vollständige Prüffall wurde nicht ausgeführt oder nur durch Teilnachweise abgedeckt. |
| `FAIL` | Der Prüffall wurde ausgeführt und mindestens ein Abnahmekriterium nicht erfüllt. |

## Übergabestand

| Feld | Wert |
|---|---|
| Repository | `/Users/raphaelfeikert/Desktop/Code/ting` |
| Branch | `ting/increment-01` |
| Festgeschriebener LibreChat-Ausgangscommit | `9e83b10545e70b2f3d69a19c0cbe5121aaa86e5e` |
| LibreChat-Version | `v0.8.8-rc3` |
| TING-Designcommit | `44ae881d1d29f5db14d5b0dcae211865687555f4` |
| Getesteter Implementierungscommit | `eb467cf58c1332050f177fdcfc0598380c4edbf8` |
| Projekt-Remote | Kein Remote konfiguriert; kein Push ausgeführt. |
| Gebaute App | <http://localhost:3080> |
| Vite-Entwicklungseinstieg | <http://localhost:3090> |

Die Provider-Zugangsdaten liegen ausschließlich in der lokal ignorierten `.env`. Weder dieses
Protokoll noch die versionierbaren Dateien enthalten den Schlüssel oder Testpasswörter.

## Prüfwerkzeuge und Laufzeit

| Bestandteil | Ermittelter Stand |
|---|---|
| Betriebssystem | macOS 26.4.1, Build 25E253, arm64 |
| Node.js | 24.16.0 |
| npm | 11.13.0 |
| Docker Compose | v5.1.4 |
| Playwright | 1.62.1 |
| Lighthouse-Browser | `HeadlessChrome/153.0.0.0` |
| Browserbuild der visuellen In-App-Aufnahmen | Nicht ermittelt; die Aufnahmen stammen aus derselben persistenten In-App-Chromium-Sitzung, besitzen aber kein vollständiges Capture-Manifest. |

Der abschließende Laufzeitaudit belegte:

- API, MongoDB und Meilisearch liefen gesund;
- nur die API war unter `127.0.0.1:3080` veröffentlicht;
- die Persistenz erfolgte über benannte Volumes, ohne Bind-Mounts;
- `/app/.env` hatte Modus `0600`, `/app/librechat.yaml` Modus `0644`;
- MongoDB lief als 8.0.20 und Meilisearch als 1.35.1;
- der normale Providerstand war nach den Störungs- und Konfigurationsfällen wiederhergestellt.

## Technische Prüfungen

| Prüfung | Ergebnis | Tatsächlicher Nachweis |
|---|---|---|
| Referenzintegrität | `PASS` | `python3 .ting-reference/TING-I01-Uebergabe/verify-reference.py`; Paketmanifest und Referenzbestand stimmen überein. |
| Setup und Compose | `PASS` | 7 von 7 Node-Tests bestanden. |
| API-Routen | `PASS` | 63 von 63 Jest-Tests bestanden. |
| TING-Capability in `packages/api` | `PASS` | 4 von 4 Jest-Tests bestanden. |
| Request-Interceptor in `packages/data-provider` | `PASS` | 22 von 22 Jest-Tests bestanden. |
| Client | `PASS` | Abschließender gemeinsamer Lauf aller 22 geänderten oder neuen Client-Suites: 153 von 153 Tests bestanden. |
| `packages/client` | `PASS` | DataTable-Lauf: 6 Suites, 130 Tests bestanden. |
| Weitere fokussierte Regressionen | `PASS` | Unter anderem Hover-/Conversation-Optionen 23 Tests, Tastaturpfade 87 Tests und DataTable 64 Tests. Diese Läufe überlappen mit den größeren Läufen und werden nicht zu einer Gesamtsumme addiert. |
| Source-Typechecks | `PASS` | `client`, `packages/client`, `packages/api` und `packages/data-provider` jeweils mit `tsc --noEmit`. |
| ESLint | `PASS` | Alle geänderten oder neuen JS-/JSX-/TS-/TSX-Dateien ohne Befund. |
| Produktionsbuild | `PASS` | Frontend- und Source-Containerbuild erfolgreich; die bekannten nicht blockierenden Upstream-Warnungen blieben unverändert. |
| Patch- und Referenzprüfung | `PASS` | `git diff --check` und Referenzprüfer ohne Befund. |
| Vertrauliche Daten und Emojis | `PASS` | Exakter und generischer Secret-Scan der versionierbaren Änderungen jeweils ohne Treffer; Emoji-Scan ohne Treffer. Die absichtlich lokale `.env` war ausgeschlossen und bleibt ignoriert. |

Die separaten Typechecks der von `tsdown` gebauten Pakete sind entscheidend: Der erfolgreiche Build
allein wurde nicht als Typnachweis gewertet. Fehler aus unveränderten, bereits bestehenden
Test-Typecheck-Konfigurationen werden nicht als Prüfung dieses Inkrements ausgegeben.

## Basisprüfung ohne Modellzugang

Die Basis-Suite lief seriell gegen den realen lokalen Docker-Stack. Vier von vier Browserfällen
bestanden. B06 wurde anschließend mit eigens erzeugten lokalen Zugangsdaten und einem tatsächlichen
Neustart von API und MongoDB separat ausgeführt und bestand mit 1 von 1 Test.

| ID | Status | Tatsächlicher Nachweis |
|---|---|---|
| B01 | `PASS` | Frisches lokales Setup, Source-Containerbuild, Start und Healthchecks bestanden. Auth-Screen und TING-Oberfläche waren über die ausschließlich lokale Portfreigabe erreichbar. |
| B02 | `PASS` | Native Pflichtfeld- und Passwortbestätigungsfehler, zwei echte Registrierungen, neutrale erneute Registrierung einer vorhandenen E-Mail sowie Weiterleitung zur Anmeldung wurden im Browser ausgeführt. |
| B03 | `PASS` | Ungültige und gültige Anmeldung, echte Sitzung, Abmeldung, Reload und Schutz von `/c/new` nach Logout wurden ausgeführt. |
| B04 | `PASS` | Ohne Modellkonfiguration blieb der eingegebene Text erhalten, der definierte Fehler wurde angezeigt, es erschien keine fingierte Antwort und die Route blieb `/c/new`. |
| B05 | `PASS` | Wechsel zwischen zwei real registrierten Konten, jeweils sichtbare eigene Identität und fehlende Identität des vorherigen Kontos wurden im Browser geprüft. |
| B06 | `PASS` | Bestehendes Konto blieb nach tatsächlichem Neustart von MongoDB und API mit den vorhandenen Volumes anmeldbar; 1 von 1 Persistenztest bestanden. |
| B07 | `PASS` | Leerer Verlauf und Suche nach einem nicht vorhandenen Vorgang zeigten die festgelegten Leerzustände ohne Beispielgespräche. |
| B08 | `AUSSTEHEND` | 13 direkte Vierersätze aus Referenz, Implementierung, Überlagerung und Differenz sowie ergänzende Implementierungsaufnahmen liegen vor. Wegen fehlender direkter Referenzen und Computed Styles für mehrere Zustände, des nicht ermittelten visuellen Browserbuilds, des nicht nativ ausführbaren 200-Prozent-Browserzooms und weiterer unten genannter Lücken ist die visuelle Gesamtabnahme nicht bestanden. |
| B09 | `PASS` | Der mobile Drawer wurde mit echter Tab-Navigation, Fokusbindung, Escape, Scrim und Fokus-Rückgabe geprüft. Formularfehler, Kontomenü sowie TING-gestaltete Menüs und Dialoge wurden zusätzlich im Browser kontrolliert. |
| B10 | `PASS` | Registrierung und Anmeldung wurden manuell über den Vite-Einstieg auf Port 3090 mit der echten API, funktionsfähigen Sessioncookies und TING-Gestaltung ausgeführt. |
| B11 | `PASS` | Wiederholtes Setup blieb byte-stabil; vorhandene Secrets, Providerwerte und Daten wurden erhalten. |
| B12 | `PASS` | Abhängigkeiten, ausgeliefertes Bundle und Quellen wurden geprüft. Es gibt keine Szenariosteuerung, Mock-Datenbank oder aus der Referenz übernommene Laufzeitsimulation; Paketmanifest und Lockdatei blieben unverändert. Projekt- und Zitatoberflächen sind nicht erreichbar, die Tastenkürzelhilfe enthält nur aktive Kürzel und temporäre Chats werden beim Start normalisiert. |

Damit sind B01 bis B07 sowie B09 bis B12 bestanden. B08 bleibt als eigenständige visuelle
Gesamtabnahme `AUSSTEHEND`.

## Providerprüfung

Die Provider-Suite lief seriell mit echtem Modellzugang gegen den lokalen Stack. Alle 9 Tests
bestanden; die neun Tests bilden P01 bis P08 sowie den separaten Aktionsfall zu P03 ab. Die lokale
Providerkonfiguration wurde nach den Teilkonfigurationen und Störungsfällen bytegetreu
wiederhergestellt.

| ID | Status | Tatsächlicher Nachweis |
|---|---|---|
| P01 | `PASS` | Vollständige, Key-only- und Modell-only-Konfiguration wurden jeweils mit API-Neuerstellung geprüft. Start und Anmeldung blieben verfügbar; nur die vollständige Konfiguration meldete Chatbereitschaft. Danach wurde der vollständige Stand wiederhergestellt. |
| P02 | `PASS` | Eine freie Nachricht erzeugte einen echten Providerrequest, eine sichtbare Modellantwort, eine native Conversation-ID und einen gespeicherten Verlauf. |
| P03 | `PASS` | Zwei echte Gespräche blieben nach Reload sowie Neustart von MongoDB und API vollständig erreichbar. Ein separater Test belegte Umbenennen, Anpinnen, Lösen, Archivieren, Wiederherstellen und Löschen über die nativen Datenpfade. |
| P04 | `PASS` | Ein eindeutiger Nachrichtentext wurde über den realen Meilisearch-Index gefunden und zum richtigen Gespräch geöffnet. |
| P05 | `PASS` | Das zweite Konto erhielt weder über die URL noch über die Suche Zugriff auf Gespräch, Nachricht oder Titel des ersten Kontos. |
| P06 | `PASS` | Eine lange tatsächliche Antwort wurde nativ gestoppt; echtes Mausrad-Hochscrollen während einer weiteren Antwort deaktivierte das automatische Folgen. |
| P07 | `PASS` | Eine reale Provider-Netzwerkstörung erzeugte einen sichtbaren Fehler. Nach Wiederherstellung gelang der Retry im selben Vorgang ohne doppeltes Gespräch. |
| P08 | `PASS` | Nach Entfernen der Providerwerte blieben Anmeldung, gespeicherter Verlauf und Entwurf verfügbar; nur neue Modellantworten waren nicht möglich. |

Aktueller Gesamtstatus Provider-End-to-End: `PASS`, 9 von 9 Tests.

## Lighthouse

Der verpflichtende Lauf wurde mit
`E2E_BASE_URL=http://localhost:3098 npm run lighthouse` ausgeführt und bestand mit 1 von 1 Test.
Der verwendete Browser meldete `HeadlessChrome/153.0.0.0`.

| Lauf | LCP in ms | CLS | TBT in ms |
|---:|---:|---:|---:|
| 1 | 3280.718 | 0.00022602574205411084 | 35.100 |
| 2 | 3079.706 | 0.0002796392610104193 | 28.119 |
| 3 | 3342.966 | 0.00024519653124361555 | 111.903 |
| Median | 3280.718 | 0.00024519653124361555 | 35.100 |
| Budget | < 4500 | < 0.1 | < 500 |

Alle drei Medianbudgets wurden eingehalten.

## Visuelle Nachweise

Der Katalog `docs/ting/I01-NACHWEISE/` enthält 74 Artefakte ohne seine README:

- 13 Referenzbilder;
- 32 Implementierungsbilder;
- 13 Überlagerungen;
- 13 Differenzbilder;
- drei JSON-Dateien mit Geometrie-, Style- und Differenzmetriken.

Es liegen 13 direkte Vierersätze vor. Weitere 19 Aufnahmen dokumentieren ausschließlich
Implementierungszustände. Der neue Vorgang wurde zusätzlich bei 320×844 in normaler Darstellung
geprüft. Der Aufnahmeversuch für 200 Prozent Browserzoom ist kein Abnahmenachweis: Das verwendete
Browserwerkzeug stellte keinen nativen Seitenzoom bereit und klemmte den ersatzweise angeforderten
Viewport auf 240×422 Pixel. Lange Kontonamen und lange Gesprächstittel wurden nicht separat geprüft.

Für den abschließend aufgenommenen realen Gesprächszustand wurden zusätzlich die berechneten
Kernwerte kontrolliert: Nachrichtentext 15 Pixel bei 1,45 Zeilenhöhe, Nachrichtenspalte maximal
800 Pixel sowie deaktivierte Sendeaktion in Aktionsblau mit weißem Symbol und 50 Prozent Deckkraft.

Der visuelle Gesamtstatus bleibt `AUSSTEHEND`. Insbesondere fehlen weiterhin:

- direkte Referenzpaare und vollständige Computed-Style-Protokolle für Registrierung,
  Sicherheitsfolgeansichten, Kontomenü, Einstellungen, Tastenkürzel, Archiv, Drawer, Suche,
  Gesprächsaktionen, Löschdialog und den unkonfigurierten Modellfehler;
- ein reproduzierbares Capture-Manifest mit dem exakten visuellen Browserbuild sowie Locale,
  Farbschema, Zoom, Scrollposition, Fokuszustand und Animationsende je Serie;
- eine echte Prüfung mit nativem Browserzoom bei 200 Prozent;
- vollständige Zustandsabdeckung für Hover, Fokus, Auswahl, Laden, Erfolg, Fehler, geöffnete Menüs
  und Dialoge;
- separate reale Prüfungen langer Namen und Titel, von IME, Passwort-Autofill und einer echten
  mobilen Bildschirmtastatur;
- Font- und Geometrieprotokolle für Anmeldung und Gespräch; die vorhandenen Fontmetriken betreffen
  nur die sieben vermessenen Breiten des neuen Vorgangs.

Die vorhandenen JPEG-Vergleiche und numerischen Differenzwerte sind Diagnosehilfen. Die Spec legt
keinen pauschalen Pixel- oder Prozenttoleranzwert fest; daher wird aus ihnen kein visueller `PASS`
abgeleitet.

## Ausgeführte Abschlussbefehle

Zu den abschließend ausgeführten Befehlen gehörten:

```sh
docker compose -f compose.ting.yaml up -d --build
docker compose -f compose.ting.yaml ps
curl --fail http://localhost:3080/health
npx playwright test --config=e2e/playwright.config.ting.ts basis.spec.ts --workers=1
npx playwright test --config=e2e/playwright.config.ting.ts persistence.spec.ts --workers=1
TING_PROVIDER_E2E=1 npx playwright test --config=e2e/playwright.config.ting.ts provider.spec.ts --workers=1
E2E_BASE_URL=http://localhost:3098 npm run lighthouse
npm exec --workspace=client -- tsc --noEmit
npm exec --workspace=packages/client -- tsc --noEmit
npm exec --workspace=packages/api -- tsc --noEmit
npm exec --workspace=packages/data-provider -- tsc --noEmit
python3 .ting-reference/TING-I01-Uebergabe/verify-reference.py
git diff --check
```

Für den Persistenztest waren eigens erzeugte lokale Variablen gesetzt; ihre Werte werden nicht
protokolliert. CI- und Remote-Review-Angaben entfallen bei dieser ausdrücklich rein lokalen
Übergabe.

## Noch offen

- B08 erst nach Schließen der dokumentierten visuellen Lücken als bestanden bewerten.
- Bei späteren UI-Änderungen die jeweils betroffenen Bild- und Browsernachweise erneut erstellen.
