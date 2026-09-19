# Run 1: Designabgleich und Korrekturen

Referenz: [freigegebener TING-Entwurf](https://ting.raphaelfeikert.chatgpt.site/),
Version 28, Quellcommit `44ae881d1d29f5db14d5b0dcae211865687555f4`.
Implementierungsbasis: `8835ace875c678bb4f4f7477ba737b7e8e8af0bb` in `symb-int/Ting`.

## Sichtbare Flächen und Zustände

| Fläche | Prüfung und Ergebnis |
| --- | --- |
| Anmeldung | TING-Formular, echte Fehlerantwort, Feldvalidierung, Passwortanzeige, laufende Anfrage und Abmeldung. Eingaben verschwinden bei einer Konfigurationsaktualisierung nicht mehr; Mehrfachsubmit ist während der Anfrage gesperrt. |
| Registrierung | Echte Konten, Pflichtfelder, abweichende Passwörter, neutrale Doppelregistrierung und Rückkehr zur Anmeldung. |
| Neue Unterhaltung | Begrüßung und Beschreibung aus dem Entwurf, Composer, „Privat mit TING“, gemeinsamer Fehlerstatus nach einem tatsächlichen Sendeversuch ohne Modellzugang. Der Text bleibt erhalten. |
| Navigation | Gemeinsame Abstände, Suchfeld mit 36 px Mindesthöhe, Sammlungsleerzustand, Suchleerzustand und mobile Navigation. |
| Vorgangszeilen | Weiße Fläche und grauer, durchgehender linker Rand bei inaktivem Hover; aktive Zeile weiß mit blauem Rand. Der Rand reserviert seinen Platz; die Zeile verschiebt sich nicht. Im echten Browser anhand gespeicherter Test-Fixtures geprüft. |
| Nachrichten | Rechts angeordnete Nutzerbubble und linke Agentenbubble, Originalfarben und native Nachrichtenfunktionen. Renderprüfung mit gespeicherten Test-Fixtures; keine Modellantwort dafür simuliert. |
| Kontomenü | Das bestehende, akzeptierte Menü bleibt erhalten. „Einstellungen“ navigiert auf `/settings`. |
| Konto | Eigenständige authentifizierte Seite mit Sidebar beziehungsweise mobilem Drawer. Native Kontofunktionen und Chatpräferenzen bleiben erhalten. Browsernavigation, Neuladen und Logout geprüft. Kein äußeres Einstellungsmodal, keine zusätzliche Such-/Tabnavigation. |
| Profilbild | Native Bildfunktion verwendet dieselben Kontozeilen und den gemeinsamen Dialograhmen. Öffnen, Schließen und mobiler Dialog visuell geprüft; kein neuer Bildspeicher. |
| Zwei-Faktor-Authentifizierung | Echte Einrichtung, OTP-Verifikation, Backup-Download, Schließen nach Bestätigung, Neuladen, erneute Anmeldung und Deaktivierung mittels Backup-Code geprüft. Der Kontostatus wird nach Änderungen vom Server aktualisiert. |
| Archiv | Bestehender Datenpfad, gemeinsame Iconbuttons und gestrichelter Sammlungsleerzustand. Ein leerer Bestand erzeugt keine große leere Tabellenfläche. |
| Folge- und Bestätigungsdialoge | Gemeinsamer Rahmen, Schrift, Abstände, Backdrop und Controls. Der native schwarze Backdrop überschreibt die TING-Fläche nicht mehr. Kleine QR- und Backup-Ansichten laufen bei 320 px nicht horizontal über. |

Die ursprünglichen BundesSansWeb-Dateien sind unverändert und bytegleich mit den Referenzassets.
Abstände verwenden die Wertnamen der Referenz (`--ting-space-4` bedeutet 4 px usw.).
Die vorhandenen gemeinsamen TING-Komponenten bleiben die Quelle für Buttons, Inputs,
Status- und Leerzustände. Es gibt keine parallele Kontodatenhaltung.

## Ausgeführte Prüfungen

Die App wurde als Produktionsbuild mit realem Express-Backend, MongoDB 8.0.20 und
Meilisearch 1.35.1 gestartet. Registrierung, Login, Einstellungen und 2FA verwenden die
echten APIs. Es war kein Modellschlüssel eingerichtet.

- `npm run frontend`: erfolgreich.
- TypeScript-Prüfungen für `client` und `packages/client`: erfolgreich.
- ESLint für die geänderten Quelldateien: erfolgreich.
- `Settings/Page.spec.tsx`: zwei bestandene Tests für die Seitenstruktur.
- `scripts/ting/setup.test.mjs` und `compose.test.mjs`: sieben bestandene Setup-/Konfigurationstests.
- `e2e/specs/ting/basis.spec.ts`: sieben bestandene Browsertests mit echten Konten.
- `e2e/lighthouse/design.spec.ts`: bestandene Browserprüfung für Vorgangs-Hover,
  stabile Zeilengeometrie, Bubblefarben und Nachrichtenausrichtung.
- Bestehende Lighthouse-Prüfung mit 250 ms zusätzlicher Mongo-Abfragelatenz:
  LCP-Median 3.000 ms (Budget 4.500 ms), CLS 0,00023 (Budget 0,1),
  TBT 78 ms (Budget 500 ms). Drei Messläufe, Budgets unverändert.
- 34 Browseraufnahmen von Implementierung und Referenz: Breiten 1440, 1024, 800,
  799, 390 und 320 px. Keine Seitenfehler oder horizontalen Seitenüberläufe in den
  aufgenommenen Zuständen. Schriftdateien vor Aufnahmen vollständig geladen.

Die Render- und Lighthouse-Prüfungen verwenden den vorhandenen isolierten Testdatenbank-
Aufbau. Deren gespeicherte Nachrichten belegen Darstellung und Ladeverhalten, keine
erfolgreiche Modellinferenz. Die echte Providerprüfung in `e2e/specs/ting/provider.spec.ts`
ist in diesem Lauf mangels Modellzugang nicht ausgeführt. Damit ist eine vollständige
End-to-End-Abnahme des produktiven Chats noch offen. Docker selbst steht in dieser
Arbeitsumgebung nicht zur Verfügung; der vorhandene Compose-Start wurde hier nicht erneut
ausgeführt. Das bisherige Abnahmeprotokoll gilt nur für seinen genannten Commit.

## Aktualisieren

Nach Übertragung der Änderungen genügt für einen bereits eingerichteten Stack:

```sh
git pull --ff-only
docker compose -f compose.ting.yaml up -d --build
```

Die App bleibt unter `http://localhost:3080` erreichbar. Vorhandene Konten, Chats und
Konfiguration benötigen für diese Änderungen keine Migration.
