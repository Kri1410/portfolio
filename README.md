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
  "accent": ["#0A84FF", "#5E5CE6"],  // gradient som vises mens bildet laster
  "media": { "type": "image", "src": "bilder/skjermbilde.webp" },
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

Feltene `demo`, `repo` og `highlights` kan utelates.
Bruk `` `backticks` `` i `description` og `highlights` for å få kodeformatering.

### Forhåndsvisningen (`media`)

Hvert prosjekt har ett av to:

| | |
|---|---|
| `{ "type": "image", "src": "bilder/x.webp" }` | Et ekte skjermbilde. Brukes for web-prosjektene. |
| `{ "type": "demo", "id": "spire" }` | En levende scene. Brukes for spillene. |

Utelater du `media` faller kortet tilbake på gradienten fra `accent` med
tegnet fra `glyph` oppå.

**Demoene** er ikke videoer eller GIF-er, men HTML og CSS bygget av spillenes
egne grafikkressurser: bakgrunnen, sprite-stripene og de faktiske tallene fra
spilldataene. De ligger i `DEMOS`-objektet øverst i [`js/app.js`](js/app.js),
med tilhørende CSS under «Levende forhåndsvisninger» i
[`css/style.css`](css/style.css).

Sprite-animasjon skjer med `steps()`. En stripe med `n` rammer på rad
animeres ved å flytte `background-position-x` fra `0%` til `100%`:

```css
.spr {
  background-size: calc(var(--f) * 100%) 100%;
  animation: sprite-step var(--d) steps(var(--f)) infinite;
}
```

Alt inne i en demo måles i `cqh`/`cqmin` (container-enheter), så den samme
markupen skalerer riktig både i kortet (16:10) og i detaljvisningen (2:1).
Skal du legge til en ny demo: legg en funksjon i `DEMOS`, styl den, og pek på
den med `{ "type": "demo", "id": "dittnavn" }`.

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
css/style.css       Designsystem (fargetokens, komponenter, mørk modus, demoer)
js/app.js           Datalasting, filtre, detaljvisning, tema, demoer
data/projects.json  Alt innhold
bilder/             Skjermbilder og grafikkressurser (webp, ~640 kB totalt)
server.mjs          Statisk dev-server
```

### Om bildene

Skjermbildene er tatt av prosjektene som faktisk kjørte lokalt, ikke laget
for hånd. Grafikken til spilldemoene er hentet ut av spillenes egne
ressursmapper og skalert ned til webp:

| Fil | Kilde |
|---|---|
| `foliegutta.webp`, `mineiendom.webp`, `cv.webp`, `soulsking.webp` | Skjermbilder av prosjektene i drift |
| `spire-arena.webp` | SpireSlayer: `assets/art/revamp/combat_spire_arena.png` |
| `spire-ronin-idle.webp` | SpireSlayer: Ronins idle-stripe, 6 rammer |
| `spire-nightborne.webp` | SpireSlayer: bossens idle, hentet ut av et 23×5-rutenett |
| `mon-meadow.webp` | MonGame: `assets/battle/meadow.png` |
| `mon-bublet.webp`, `mon-embercat.webp` | MonGame: originale skapninger, 64×64 |

Pikselkunst lagres tapsfritt i native oppløsning og skaleres opp i CSS med
`image-rendering: pixelated`, slik at den holder seg skarp.

## Detaljer verdt å vite

- **Mørk modus** følger systemet som standard. Knappen oppe til høyre overstyrer, og
  valget huskes i `localStorage`.
- **Detaljvisningen** er et sentrert kort på desktop og et bunn-ark som glir opp på
  mobil. Den lukkes med `Esc`, klikk utenfor eller krysset.
- **Direktelenker**: `#prosjekt/<id>` åpner et prosjekt direkte, så du kan dele
  lenken til et enkelt prosjekt.
- **`prefers-reduced-motion`** slår av alle animasjoner.
