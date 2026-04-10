# Beoordeling Remote-Controller
Student: Levi-Elias
Project: Remote-Controller (Curve Fever)
Datum: 10-04-2026

---

## 1. Voorbereidende fase

**Score: 19 / 30**

PvA en TO zijn aanwezig als Word-bestanden, dat is goed. Het PvA beschrijft het doel en de doelgroep maar had wat dieper gemogen, denk aan risico's en concrete deliverables. Het TO beschrijft de keuze voor Node.js en WebSockets, prima.

Wat ik mis is een FO. De functionaliteiten staan nergens beschreven behalve in de code zelf. Dat maakt het lastig om te checken of je alles hebt gebouwd wat je van plan was.

De planning is een Trello-link in een tekstbestandje. Op zich goed dat je Trello hebt gebruikt, maar ik kan niet zien of je het ook daadwerkelijk hebt bijgehouden. Een screenshot of export was handig geweest.

Git gebruik is een aandachtspunt. Je hebt 8 commits in totaal, en de berichten zijn niet echt bruikbaar: "yes", "ja", "many things". Probeer in de toekomst te beschrijven WAT je hebt aangepast, bijv. "mobile controller buttons toegevoegd" ipv "yes". Dat is ook voor jezelf handig als je later iets terug moet zoeken.

GO/NOGO heb ik niks van terug kunnen vinden in je documenten. Als dit wel is geweest, leg het dan vast.

Er zit een wireframe in de design map, dat is mooi. Had wel meer mogen zijn (meerdere schermen oid).

---

## 2. Realiserende fase

**Score: 31 / 40**

De applicatie werkt en het concept is echt leuk. Een Curve Fever kloon waarbij je je telefoon als controller gebruikt, dat is een goede toepassing van WebSockets.

De WebSocket communicatie werkt. De server stuurt gamestate naar alle clients en handelt input af via message types (join, input, startGame, reset etc). De mobiele controller pakt touch events goed op en heeft zelfs landscape support, netjes.

Multi-device werkt: je opent de game op je laptop en je telefoon verbindt als controller via een gamecode. Precies wat de bedoeling is.

Qua extra's heb je power-ups (speed boost, score), gaten in de trails, een rondesysteem met 5 rondes, en kleuren bij spelers in het scoreboard. Dat gaat verder dan het minimum en dat is goed.

Paar dingen die beter kunnen:
- Er staat nog inline styling in je HTML (style="" attributen). Probeer alles in je CSS te zetten
- De gameLoop functie is best lang. De collision detection zou je bijv in een aparte functie kunnen zetten
- Als een speler halverwege disconnect kan dat voor problemen zorgen, daar zit geen goede afhandeling voor
- Je hebt maar 1 game tegelijk, rooms zouden het naar een hoger niveau brengen maar dat is een extra

De code is verder leesbaar en de structuur (server map + public map) is logisch.

---

## Totaal

| Fase | Score |
|---|---|
| Voorbereidend | 19/30 |
| Realiserend | 31/40 |
| **Totaal** | **50/70** |

Het product is goed, je snapt de techniek en je hebt een werkend en speelbaar spel neergezet met extra features. De documentatie en git gebruik trekken je score naar beneden. Besteed daar volgende keer meer aandacht aan, dat is in de praktijk net zo belangrijk als de code zelf.
