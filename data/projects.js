/* ==========================================================================
   Projecten
   Een project toevoegen = één object toevoegen aan deze lijst.
   Zie README.md voor de velden en hoe je foto's klaarzet.

   categories: één of meer van "projectontwikkeling", "domotica", "industrie-kantoor", "horeca"
   image.name: bestandsnaam zonder breedte en extensie in img/projecten/
               (bv. "iss-gevel" voor iss-gevel-480.avif, iss-gevel-800.webp ...)
   image.widths: de breedtes die in img/projecten/ bestaan
   featured: true toont het project breed bovenaan (gebruik dit voor één project)
   caseUrl: optioneel, link naar een uitgewerkte case
   ========================================================================== */

window.BOON_CATEGORIES = [
  { id: "projectontwikkeling", label: "Projectontwikkeling" },
  { id: "domotica", label: "Domotica" },
  { id: "industrie-kantoor", label: "Industrie & kantoor" },
  { id: "horeca", label: "Horeca" }
];

window.BOON_PROJECTS = [
  {
    id: "iss",
    title: "Hoofdkantoor ISS",
    location: "[TE BEVESTIGEN: locatie]",
    categories: ["industrie-kantoor", "domotica"],
    summary:
      "Kantoorproject van ca. 5000 m² met een volledig datanetwerk, centrale sturing en ledverlichting. Een complex project, snel aangepakt.",
    specs: ["ca. 5000 m²", "Data cat 6A", "994 gebruikers", "585 ledtegels"],
    image: {
      name: "iss-gevel",
      widths: [480, 800, 1056],
      w: 1056,
      h: 791,
      alt: "Glazen kantoorgebouw van ISS met logo op de gevel"
    },
    caseUrl: "projecten/iss.html",
    featured: true
  },
  {
    id: "hertsberge",
    title: "Woning Hertsberge",
    location: "Hertsberge",
    categories: ["projectontwikkeling"],
    summary:
      "Elektrische installatie en gevelverlichting voor een landhuis met bijgebouwen en serre.",
    specs: ["Woning", "Gevelverlichting"],
    image: {
      name: "hertsberge-avond",
      widths: [480, 800, 1056],
      w: 1056,
      h: 635,
      alt: "Landhuis in Hertsberge bij avond met verlichte gevel, arcade en vijver"
    }
  },
  {
    id: "turnhout",
    title: "Woning Turnhout",
    location: "Turnhout",
    categories: ["projectontwikkeling", "domotica"],
    summary:
      "Nieuwbouwwoning met domotica voor verlichting en video.",
    specs: ["Nieuwbouw", "Domotica", "Verlichting", "Video"],
    image: {
      name: "turnhout-woning",
      widths: [480, 800, 1000],
      w: 1000,
      h: 750,
      alt: "Moderne witte nieuwbouwwoning in Turnhout tussen de bomen"
    }
  },
  {
    id: "bonami",
    title: "Restaurant Bonami",
    location: "[TE BEVESTIGEN: locatie]",
    categories: ["horeca"],
    summary:
      "Elektrische installatie en verlichting voor een restaurant met lounge en eetzalen. [TE BEVESTIGEN: korte omschrijving van de werken]",
    specs: ["Horeca", "Verlichting"],
    image: {
      name: "bonami-lounge",
      widths: [480, 800, 1600],
      w: 1600,
      h: 1066,
      alt: "Lounge van restaurant Bonami met rode fauteuils, spots en een groot schilderij"
    },
    caseUrl: "projecten/bonami.html"
  },
  {
    id: "kantoorgebouw",
    title: "Kantoorgebouw",
    location: "[TE BEVESTIGEN: locatie]",
    categories: ["industrie-kantoor", "projectontwikkeling"],
    summary:
      "Elektrische installatie voor een nieuw kantoorgebouw. [TE BEVESTIGEN: naam van het project en uitgevoerde werken]",
    specs: ["Nieuwbouw", "Kantoor"],
    image: {
      name: "kantoorgebouw-hoek",
      widths: [480, 600],
      w: 600,
      h: 900,
      alt: "Nieuw kantoorgebouw met witte gevel, grote ramen en een aangelegde tuin"
    }
  }
];
