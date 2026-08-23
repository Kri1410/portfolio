# Portefølje — Kristoffer Holmsen

En statisk porteføljeportal i Apple-/iOS-inspirert designspråk. Ingen rammeverk, ingen
byggesteg — bare HTML, CSS og JavaScript.

## Kjør lokalt

```powershell
node server.mjs
```

Åpne så <http://localhost:4321>.

> Siden henter prosjektene med `fetch()`, så den må serveres over HTTP.
> Å åpne `index.html` direkte fra filsystemet vil ikke fungere.

## Legge til eller endre prosjekter

Alt innhold ligger i [`data/projects.json`](data/projects.json). Du trenger aldri å
røre HTML-en for å legge til et prosjekt — bare legg til et nytt objekt i
`projects`-lista:

```jsonc
{
  "id": "unik-id",              // brukes i direktelenken #prosjekt/unik-id
  "title": "Prosjektnavn",
  "tagline": "Kort undertekst",
  "category": "web",            // må matche en id i "categories"
  "featured": true,             // true = kortet tar dobbel bredde på desktop
  "year": "2026",
  "role": "Design og utvikling",
  "glyph": "◈",                 // vises stort på kortet når "image" mangler
  "accent": ["#0A84FF", "#5E5CE6"],  // gradienten bak glyfen
  "image": "bilder/skjermbilde.jpg", // valgfritt — overstyrer glyfen
  "tech": ["Next.js", "TypeScript"],
  "private": false,             // true gir "Privat repo"-merke og skjuler lenken
  "links": {
    "repo": "https://github.com/...",
    "demo": "https://..."
  },
  "summary": "Én setning som vises på kortet.",
  "description": ["Avsnitt 1.", "Avsnitt 2."],
  "highlights": ["Punkt 1", "Punkt 2"]
}
```

Feltene `image`, `demo`, `repo` og `highlights` kan utelates.
Bruk `` `backticks` `` i `description` og `highlights` for å få kodeformatering.

Profiltekst, e-post og GitHub-lenke ligger under `profile` øverst i samme fil.
Kategoriene i filtermenyen ligger under `categories`.

## Publisere på GitHub Pages

1. Opprett et nytt, offentlig repo på GitHub (f.eks. `portfolio`).
2. Push innholdet i denne mappa til `main`.
3. **Settings → Pages → Source: Deploy from a branch → `main` / `(root)`**.
4. Siden blir liggende på `https://<brukernavn>.github.io/portfolio/`.

Filen `.nojekyll` er med for å hindre at GitHub Pages kjører innholdet gjennom Jekyll.

## Struktur

```
index.html          Markup og seksjoner
css/style.css       Designsystem (fargetokens, komponenter, mørk modus)
js/app.js           Datalasting, filtre, detaljvisning, tema
data/projects.json  Alt innhold
server.mjs          Statisk dev-server
```

## Detaljer verdt å vite

- **Mørk modus** følger systemet som standard. Knappen oppe til høyre overstyrer, og
  valget huskes i `localStorage`.
- **Detaljvisningen** er et sentrert kort på desktop og et bunn-ark som glir opp på
  mobil. Den lukkes med `Esc`, klikk utenfor eller krysset.
- **Direktelenker**: `#prosjekt/<id>` åpner et prosjekt direkte, så du kan dele
  lenken til et enkelt prosjekt.
- **`prefers-reduced-motion`** slår av alle animasjoner.
