# TING lokal entwickeln

## Voraussetzungen

TING I01 verwendet die im Repository festgeschriebenen Versionen:

- Git
- Node.js 24.16.0 (`.nvmrc`)
- npm 11.13.0 (`packageManager` in `package.json`)
- Docker mit Docker Compose v2

Die aktiven Versionen vor dem Setup prüfen:

```sh
node --version
npm --version
docker compose version
```

## Ersteinrichtung und Produktionsbuild

Im Repositoryroot ausführen:

```sh
npm ci
npm run build:packages
node scripts/ting/setup.mjs
npm run build:client
docker compose -f compose.ting.yaml up -d --build
```

Das Setup legt die ignorierte private `.env` und die daraus abgeleitete, ebenfalls ignorierte
`librechat.yaml` an. Es erzeugt die benötigten App- und Such-Secrets kryptografisch und nur einmal.
Ein erneuter Aufruf erhält vorhandene Werte. Ein OpenAI-Zugang ist für Einrichtung, Start,
Registrierung und Anmeldung nicht erforderlich.

Compose liest die private `.env` als Laufzeitumgebung ein. Beim Containerstart schreibt der
API-Container daraus mit demselben geprüften Serializer `/app/.env` und
`/app/librechat.yaml`. Dadurch benötigt der Stack keine Host-Bind-Mounts und funktioniert auch,
wenn Docker Desktop den Projektordner nicht als Dateifreigabe bereitstellt. Die privaten Dateien
gelangen weder ins Image noch ins Browserbundle.

Die gebaute App ist unter <http://localhost:3080> erreichbar. Der Zustand der drei benötigten
Dienste lässt sich so prüfen:

```sh
docker compose -f compose.ting.yaml ps
curl --fail http://localhost:3080/health
```

MongoDB und Meilisearch werden nicht auf Hostports veröffentlicht. Ihre Daten, `/app/data` und
lokale Profilbilder liegen in benannten Docker-Volumes und bleiben bei Neustarts und `compose down`
erhalten.

## Frontend mit Hot Reload

Der Compose-Stack stellt weiterhin API, MongoDB und Meilisearch bereit. In einem zweiten Terminal
den Vite-Prozess ohne die API-Containerwerte `HOST` und `PORT` starten:

```sh
env -u HOST -u PORT BACKEND_PORT=3080 npm run frontend:dev
```

Vite ist unter <http://localhost:3090> erreichbar und leitet `/api` an
<http://localhost:3080> weiter. Für beide Einstiege `localhost` verwenden, damit die nativen
Origin- und Sessioncookie-Prüfungen denselben dokumentierten Hostnamen sehen.

Bei Änderungen unter `packages/client` zuerst das gemeinsame Clientpaket neu bauen und den
Vite-Prozess danach bei Bedarf neu starten:

```sh
npm run build:client-package
```

Änderungen an API-Code oder gemeinsamen Backendpaketen gelangen durch einen neuen Source-Build
in den Container:

```sh
docker compose -f compose.ting.yaml up -d --build api
```

Den Produktions-Client lokal erneut prüfen und anschließend in das API-Image bauen:

```sh
npm run build:client
docker compose -f compose.ting.yaml up -d --build api
```

## Modellzugang später konfigurieren

In `.env` genau einen echten OpenAI-Schlüssel und genau eine tatsächlich zugängliche Modell-ID
eintragen:

```dotenv
OPENAI_API_KEY=<privater-schluessel>
OPENAI_MODELS=<eine-modell-id>
```

Danach die abgeleitete Konfiguration aktualisieren und nur den API-Container neu erstellen:

```sh
node scripts/ting/setup.mjs
docker compose -f compose.ting.yaml up -d --force-recreate api
```

Ein UI-Neubau ist dafür nicht erforderlich. Fehlt einer der beiden Werte oder enthält
`OPENAI_MODELS` mehr als eine kommagetrennte ID, bleibt `modelSpecs` aus der Konfiguration weg;
die App startet weiterhin ohne Modellzugang. `.env` niemals versionieren oder in Nachweise
kopieren.

## Betrieb, Logs und Stoppen

```sh
docker compose -f compose.ting.yaml logs -f api
docker compose -f compose.ting.yaml restart
docker compose -f compose.ting.yaml stop
docker compose -f compose.ting.yaml down
```

`stop`, `restart` und `down` erhalten die benannten Volumes. Beim normalen Entwickeln und
Aktualisieren keine Volumenlöschung verwenden.

Die fokussierten Setup- und Compose-Tests laufen nach `npm ci` und `npm run build:packages` mit:

```sh
node --test scripts/ting/setup.test.mjs scripts/ting/compose.test.mjs
```

## Abnahmeprüfungen

Alle Projektbefehle mit Node.js 24.16.0 und npm 11.13.0 ausführen. Falls die aktive Shell eine
andere Node-Version verwendet, kann die für TING installierte Toolchain explizit vorangestellt
werden:

```sh
export PATH="$HOME/.local/share/ting-toolchains/node-v24.16.0-darwin-arm64/bin:$PATH"
```

Die Browser-Basisprüfung und der Persistenzfall laufen gegen den lokalen Produktionsstack:

```sh
npx playwright test --config=e2e/playwright.config.ting.ts e2e/specs/ting/basis.spec.ts
npx playwright test --config=e2e/playwright.config.ting.ts e2e/specs/ting/persistence.spec.ts
```

Der echte Providerlauf verwendet ausschließlich die bereits in der ignorierten `.env`
eingetragenen Werte. Der Test entfernt Werte nur vorübergehend und stellt Inhalt und Dateimodus
anschließend wieder her:

```sh
TING_PROVIDER_E2E=1 npx playwright test \
  --config=e2e/playwright.config.ting.ts \
  e2e/specs/ting/provider.spec.ts
```

Der verpflichtende Performance-Gate benötigt einen eigenen Port, solange TING auf 3080 läuft:

```sh
E2E_BASE_URL=http://localhost:3098 npm run lighthouse
```

Die visuellen 50/50-Überlagerungen, verstärkten Differenzbilder und Pixelmetriken lassen sich aus
den vorhandenen Referenz- und Implementierungsaufnahmen reproduzieren:

```sh
node scripts/ting/generate-visual-evidence.mjs
```

Die Bildartefakte und ihre dokumentierten Grenzen liegen unter
`docs/ting/I01-NACHWEISE/`. Ein Implementierungsscreenshot ersetzt keine fehlende Sollkomposition.
