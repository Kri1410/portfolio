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
  "gallery": [                       // bildene man blar gjennom
    { "type": "image", "src": "bilder/skjermbilde.webp", "caption": "Forsiden." }
  ],
  "live": {                          // valgfritt: den kjørende siden
    "src": "sider/dittprosjekt/",
    "label": "dittprosjekt.no",
    "heading": "Bla gjennom siden",
    "cta": "Åpne siden",
    "hint": "Kort forklaring på hva man kan gjøre.",
    "poster": "bilder/skjermbilde.webp"
  },
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

### Galleriet (`gallery`)

`gallery` er en liste med det man blar gjennom i detaljvisningen. **Det første
elementet er også bildet på kortet i rutenettet.** Hvert element er ett av to:

| | |
|---|---|
| `{ "type": "image", "src": "bilder/x.webp", "caption": "…" }` | Et ekte skjermbilde. |
| `{ "type": "demo", "id": "spire", "caption": "…" }` | En levende scene. Brukes for spillene. |

Har et prosjekt bare ett element, faller galleriet tilbake til et enkelt bilde
uten piler og prikker.

### Den kjørende siden (`live`)

`live` legger inn prosjektet som det faktisk er — i en nettleserramme nederst i
detaljvisningen, der man kan scrolle, klikke og bruke det. Siden lastes først
når man trykker på knappen, så en tung side ikke drar ned resten.

Slik legger du inn et nytt prosjekt som kjørende side:

1. Legg de ferdige filene i `sider/dittprosjekt/`. Siden **må bruke relative
   stier** (`css/style.css`, ikke `/css/style.css`), ellers brekker den når den
   ligger i en undermappe.
2. Legg til `live`-blokken over i prosjektet i `projects.json`.

Bygger du med Next.js må du sette `basePath` til stien siden skal ligge på,
og huske at filer fra `public/` ikke får `basePath` automatisk — se hvordan
`sider/cv/` er satt opp.

Ligger prosjektet allerede på nett kan `src` like gjerne være en full URL —
men mange sider nekter å bli vist i ramme (`X-Frame-Options`), så en lokal
kopi er som regel tryggere.

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
js/app.js           Datalasting, filtre, galleri, detaljvisning, tema, demoer
data/projects.json  Alt innhold
bilder/             Skjermbilder og grafikkressurser (webp)
sider/              Kjørende kopier av prosjektene, vist i ramme
robots.txt          Holder sider/ ute av søkemotorer
server.mjs          Statisk dev-server
```

> `sider/cv/` er bygget med `basePath: /portfolio/sider/cv`, så den ser riktig
> ut på GitHub Pages, men ustilt hvis du åpner porteføljen på en annen sti.
> For å teste den lokalt: kjør serveren fra mappa **over** porteføljen og gå
> til `http://localhost:4321/portfolio/`.

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
