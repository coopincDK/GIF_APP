
# Opgaveprompt: Udvikling af "GIF Hold-Helte" App

## 1. Vision og Formål

**Projektets vision:** At skabe en engagerende, gamificeret mobil-first web-app for Grenå IF's U10 og U11 fodboldhold. Appen skal simplificere koordineringen af praktiske opgaver (tøjvask, forfriskninger) og samtidig styrke det sociale fællesskab, holdånden og klubfølelsen. Løsningen skal være i fuld overensstemmelse med DBU's børneklub-principper, hvor fokus er på inklusion, udvikling og glæde frem for individuel præstation.

**Målgruppe:** Spillere (U10/U11) og deres forældre, samt trænere/holdledere i Grenå IF.

**Kernekoncept:** "GIF Hold-Helte & Cup-Stjerner". Appen er bygget op omkring en central idé: At alle bidrag til holdet og klubben, uanset størrelse, er en heltegerning. Dette visualiseres gennem indsamling af digitale badges for løste opgaver. Appen opererer i to tilstande: et **"Liga-Mode"** for den regulære sæson og et særligt **"Cup-Mode"** dedikeret til klubbens årlige højdepunkt, Kattegat Cup.

---


---
## 2. Funktionelle Krav: Bruger-Features

### 2.1 Gamification & Engagement

| Feature | Beskrivelse |
| :--- | :--- |
| **Opgave-Hjulet (Liga-Mode)** | En fair og sjov måde at fordele standardopgaver (tøjvask, frugt, kage). Hjulet animeres og "lander" på en bruger, som tildeles opgaven. Systemet skal sikre en ligelig fordeling over tid. |
| **Visuelle Badges** | Kernen i gamification. Brugere optjener badges for udførte opgaver. Der skal designes mindst tre kategorier af badges:<br> - **Hold-Helt:** For standardopgaver i Liga-Mode.<br> - **Cup-Stjerne:** For frivilligvagter under Kattegat Cup.<br> - **Jubilæums-Helt 2026:** Et særligt, gyldent badge for deltagelse i 40-års jubilæumsstævnet. |
| **Personlig Badge-Væg** | Hver brugerprofil har en sektion, der stolt fremviser de optjente badges. Dette fungerer som en personlig anerkendelse og en visuel historik over brugerens bidrag. |
| **Holdets Fælles Banner** | En central side i appen, der aggregerer og viser **alle** badges optjent af holdets medlemmer. Dette banner skal visuelt repræsentere holdets samlede styrke og fællesskab. |

### 2.2 Kattegat Cup-Mode

- **Automatisk Aktivering:** Fire uger før Kattegat Cup (startdato d. 23. juli 2026) skal appen automatisk skifte til "Cup-Mode". Dette indebærer et nyt visuelt tema (f.eks. med Kattegat Cup-logo og farver) og en fremtrædende nedtælling.
- **Vagt-Tilmeldingssystem:** En separat opgaveliste for stævnet, hvor specifikke, tidsbestemte frivilligvagter kan oprettes af en admin. Forældre kan browse listen og tilmelde sig vagter direkte i appen. Systemet skal forhindre dobbelt-booking og give et klart overblik over bemandingen.

### 2.3 Viden & Læring

- **Trænerens Hjørne:** En permanent sektion i appen, der indeholder pædagogisk og letfordøjeligt indhold.
  - **Regel-Galaksen:** Korte, illustrerede forklaringer af de vigtigste regler for 5-mands (U10) og 8-mands (U11) fodbold. Fokus på emner som presfri zone, tilbagelægningsregler, og forskellen på indspark/indkast.
  - **Viden-Stjernerne:** En samling af "Vidste du at..."-kort med sjove og overraskende fakta om fodbold. Indholdet skal være børnevenligt og inspirerende.

---


## 3. Backend & Administrative Krav

### 3.1 Bruger- og Adgangsstyring

- **Brugerprofiler:** Brugere skal kunne oprette en profil med navn, e-mail og et personligt, krypteret password. Profilen skal desuden indeholde felter til **kontaktoplysninger (telefonnummer)** og en funktion til at **uploade et profilbillede**. Det skal være muligt at tilknytte sin profil til et specifikt hold (f.eks. "U10 Drenge").
- **Rolle-baseret Adgangskontrol (RBAC):** Systemet skal understøtte minimum to roller:
  - **Admin (Træner/Holdleder):** Har fuld adgang til at administrere holdet, oprette opgaver, tildele badges manuelt (hvis nødvendigt), og administrere indholdet i "Trænerens Hjørne".
  - **Bruger (Forælder/Spiller):** Kan se og blive tildelt opgaver, se sin badge-væg, og interagere med indholdet.
- **Admin-panel:** En simpel web-baseret grænseflade, hvor Admins kan administrere brugere og indhold uden at skulle direkte i databasen.

### 3.2 Database Arkitektur (Eksempel)

Nedenfor er et forslag til, hvordan databasestrukturen kunne se ud for at understøtte de krævede funktioner.

| Tabel | Formål og Felter |
| :--- | :--- |
| **Users** | `user_id` (PK), `name`, `email`, `password_hash`, `role` (Admin/User), `team_id` (FK), `profile_picture_url`, `phone_number` |
| **Teams** | `team_id` (PK), `team_name` (f.eks. "U10 Drenge") |
| **Tasks** | `task_id` (PK), `title`, `description`, `type` (Liga/Cup), `due_date`, `status` (Open/Assigned/Completed) |
| **TaskAssignments** | `assignment_id` (PK), `task_id` (FK), `user_id` (FK), `completion_date` |
| **Badges** | `badge_id` (PK), `name` (f.eks. "Hold-Helt"), `description`, `image_url`, `type` (Liga/Cup/Jubilæum) |
| **UserBadges** | `user_badge_id` (PK), `user_id` (FK), `badge_id` (FK), `date_awarded` |
| **Content** | `content_id` (PK), `type` (Regel/Fact), `title`, `body_text`, `image_url` |

### 3.3 API Endpoints (RESTful Eksempel)

- `POST /api/users/register`: Opretter en ny bruger (inkl. navn, email, password, hold, telefonnummer).
- `POST /api/users/login`: Authentificerer en bruger og returnerer en token.
- `GET /api/teams/{team_id}/tasks`: Henter alle opgaver for et specifikt hold.
- `POST /api/tasks/{task_id}/complete`: Markerer en opgave som fuldført (trigger for badge-tildeling).
- `GET /api/users/{user_id}/badges`: Henter alle badges for en specifik bruger.
- `GET /api/content?type=regel`: Henter alt indhold af typen "Regel".
- `POST /api/admin/tasks` (Admin only): Opretter en ny opgave (f.eks. en Kattegat Cup-vagt).
- `PUT /api/users/{user_id}`: Opdaterer en brugers profil (navn, telefonnummer, profilbillede). Håndtering af billede-upload skal specificeres (f.eks. multipart/form-data).

---

## 4. Kilder og Inspiration

For at sikre at indholdet i appen er korrekt, relevant og i tråd med klubbens og DBU's værdier, skal følgende kilder anvendes som primær reference under udviklingen.

| Emne | Kilde | Beskrivelse |
| :--- | :--- | :--- |
| **DBU Børneklub Værdier** | [DBU Børneklub](https://www.dbu.dk/boern-og-unge/boernefodbold/strategi-for-dansk-boernefodbold/dbu-boerneklub/) | Officiel side for DBU Børneklub. Bruges til at sikre, at appens tone, gamification og formål er 100% i overensstemmelse med principperne om fællesskab, udvikling og inklusion. |
| **Regler for Børnefodbold** | [DBU Jylland - Tjekliste](https://www.dbujylland.dk/nyheder/2025/april/tjekliste-her-er-reglerne-i-boernefodbold/) | Detaljeret og pædagogisk gennemgang af reglerne for 3v3, 5v5 og 8v8. Dette er den primære kilde til alt indhold i "Regel-Galaksen". |
| **Kattegat Cup Information** | [Officiel Kattegat Cup Hjemmeside](https://kgcup.dk/) | Kilde til alle detaljer om stævnet, inklusiv datoer, jubilæumsinformation, logo og den generelle stemning, som skal afspejles i appens "Cup-Mode". |
| **Fun Facts om Fodbold** | [Illustreret Videnskab](https://illvid.dk/kultur/sport/11-forrykte-fodbold-facts-0) & [Fun Kids](https://www.funkidslive.com/learn/top-10-facts/top-10-facts-about-football/) | Gode udgangspunkter for at finde sjove, børnevenlige fakta til "Viden-Stjernerne". Indholdet skal verificeres og tilpasses målgruppen. |
| **Grenå IF's Værdier** | [Grenå IF Hjemmeside](https://www.grenaaif.dk/) | Klubbens officielle side. Bruges til at hente logo, farver og forstå den overordnede klubånd ("Fællesskab og oplevelser"), som skal gennemsyre hele appen. |

---

## 5. Aflevering

Det endelige produkt er en fuldt funktionel, testet og deployeret web-app, der opfylder alle ovenstående krav. Kildekoden skal leveres i et Git-repository, og der skal medfølge en kort vejledning til, hvordan Admins kan administrere systemet.
