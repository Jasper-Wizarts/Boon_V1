# elecboon.be

Statische site voor Elektriciteitswerken Boon (Boon bv, Lokeren). HTML, CSS en vanilla JS: geen framework, geen build-stap. Openen kan rechtstreeks (`index.html`) of via een lokale server, bv. `python3 -m http.server`.

## Structuur

```
index.html            One-pager: hero, diensten, waarom Boon, projecten, reviews, klanten/merken, over ons, contact
projecten/iss.html    Uitgewerkte case ISS
privacy.html          Privacyverklaring (ontwerptekst, laten nakijken)
css/style.css         Alle stijlen; kleuren, typografie en spacing als custom properties bovenaan
css/fonts-file.css    Dezelfde fonts ingebed, enkel geladen als een pagina lokaal (file://) geopend wordt. Online niet gebruikt. Opnieuw maken als de fonts wijzigen
js/main.js            Menu, schakelbord diensten, projectfilter, reviews, animaties, formulier. Configuratie bovenaan (SITE_CONFIG)
js/vendor/            GSAP 3.12.5 + ScrollTrigger (lokaal, geen CDN). Zonder JS of met 'beperk beweging' blijft alles zichtbaar
data/projects.js      Projecten en filtercategorieën
data/reviews.js       Reviews (nu voorbeeldteksten)
img/projecten/        Projectfoto's in AVIF, WebP en JPG, telkens in meerdere breedtes. De .json-bestanden ernaast noteren de herkomst van elke foto (intern, .htaccess houdt ze offline)
img/logo-boon.png     Logo (via <symbol id="boon-logo"> bovenaan elke HTML-pagina)
partners/             Logo's van klanten en merken (witte versies voor de donkere achtergrond)
fonts/                Archivo en Hanken Grotesk, zelf gehost (geen Google Fonts-verzoeken)
robots.txt, sitemap.xml, .htaccess (compressie en caching op Apache)
assets/               Aangeleverde bronbestanden. Niet nodig online, mag weg bij publicatie
```

Header en footer staan in elk van de drie HTML-bestanden. Pas een wijziging daar dus in alle drie toe.

Diensten staan rechtstreeks in `index.html` (sectie "Diensten: schakelbord"): per dienst een knop in de lijst en een paneel met foto, tekst en labels.

## Een project toevoegen

1. Zet de foto's klaar in `img/projecten/` als `<naam>-<breedte>.avif`, `.webp` en `.jpg`, bv. `woning-gent-480.avif`, `woning-gent-800.avif`, `woning-gent-1200.avif` (idem voor webp en jpg). Gebruik breedtes 480, 800 en de originele breedte (max. ca. 1600).
   Snel converteren kan bv. met [Squoosh](https://squoosh.app) of met `cwebp`/`avifenc`.
2. Voeg één object toe in `data/projects.js`:

```js
{
  id: "woning-gent",
  title: "Woning Gent",
  location: "Gent",
  categories: ["woningen", "domotica"],      // woningen | domotica | industrie-kantoor
  summary: "Korte tekst van één of twee zinnen.",
  specs: ["Nieuwbouw", "Domotica"],          // korte kerngegevens, optioneel
  image: { name: "woning-gent", widths: [480, 800, 1200], w: 1200, h: 900, alt: "Beschrijving van de foto" },
  caseUrl: "projecten/woning-gent.html",     // optioneel
  featured: false                            // true = breed bovenaan (één project)
}
```

De filterknoppen en tellers passen zich automatisch aan. Een nieuwe categorie toevoegen kan in `BOON_CATEGORIES` bovenaan hetzelfde bestand. Een tekst met `[TE BEVESTIGEN: ...]` wordt automatisch gemarkeerd.

## Een review toevoegen

In `data/reviews.js`, één object per review:

```js
{ placeholder: false, company: "ISS", role: "Facility manager", project: "Hoofdkantoor ISS", quote: "Goedgekeurde tekst." }
```

- Gebruik geen namen van personen zonder toestemming: bedrijf + functie volstaat.
- De huidige twee reviews zijn **voorbeeldteksten** (`placeholder: true`). Ze tonen een gele markering "Voorbeeldtekst".
- **Voor de livegang:** zet in `js/main.js` `SITE_CONFIG.showPlaceholderReviews` op `false`. Dan worden enkel echte reviews getoond. Zijn er geen echte, dan verdwijnt de sectie.

## Formulier

Bovenaan `js/main.js`:

```js
var SITE_CONFIG = {
  formEndpoint: "",   // bv. "https://formspree.io/f/abcdwxyz" of "/mail.php"
  ...
};
```

- Het formulier verstuurt `FormData` via POST met `Accept: application/json`. Formspree werkt zo meteen. Een eigen PHP-script moet een 2xx-status teruggeven bij succes.
- Velden: `naam`, `bedrijf`, `email`, `telefoon`, `type`, `locatie`, `timing`, `bericht`, `privacy`. `_gotcha` is een spam-val (Formspree herkent die naam).
- Zolang `formEndpoint` leeg is, toont het formulier een duidelijke foutmelding met telefoonnummer en e-mailadres.

## Logo

`img/logo-boon.png` is het oorspronkelijke BOON-logo van de klant: het embleem uit het logo van de oude site (elecboon.be), zonder de zijteksten. Het is een PNG van 325×174 px; vraag de klant het originele (vector)bestand voor een scherpere versie. Het wordt gebruikt via `<symbol id="boon-logo">` bovenaan elke pagina. Wordt het logo vervangen, pas dan het `<symbol>` in de drie HTML-bestanden aan, en de `aspect-ratio` in `css/style.css`.
`img/favicon.png` en `img/apple-touch-icon.png` zijn uit hetzelfde embleem gemaakt.

## Kleuren en contrast

Alle kleuren staan als custom properties in `:root` van `css/style.css`. Rood wordt enkel gebruikt voor de primaire actie, focus en actieve toestand. Alle tekstcombinaties halen WCAG AA (4,5:1). Randen van knoppen en velden halen 3:1.

## Checklist voor livegang

- [ ] Alle `[TE BEVESTIGEN: ...]` ingevuld (zoek in de bestanden op `TE BEVESTIGEN`)
- [ ] Echte, goedgekeurde reviews in `data/reviews.js`, en `showPlaceholderReviews: false`
- [ ] Formulier-endpoint ingevuld en getest
- [ ] Ontbrekende logo's toegevoegd (Volvo Truck Center, Bluebridge, ABS Bouwteam, ABB)
- [ ] Privacyverklaring nagekeken
- [ ] Map `assets/` en werkdocumenten niet mee online
# elecboon
