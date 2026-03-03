// Alle regler og fun facts til GIF Hold-Helte appen
const { v4: uuidv4 } = require('uuid');

const REGLER = [
  { title: 'Mødepligt',            sort_order:  1, body_text: 'Alle spillere møder op 15 minutter før kampstart. Vis respekt for holdkammeraterne ved at være til tiden — det er en del af holdånden!' },
  { title: 'Fair Play',            sort_order:  2, body_text: 'Vi spiller fair og respekterer modstandere, dommere og tilskuere. Grimme tacklinger og dårlig sportsånd accepteres ikke. Fodbold er en sport for alle!' },
  { title: 'Holdånd',              sort_order:  3, body_text: 'Vi hepper på hinanden, også når det er svært. Alle på holdet er lige vigtige — fra keeper til angriber. En kæde er ikke stærkere end sit svageste led!' },
  { title: 'Presfri Zone (U10)',   sort_order:  4, body_text: 'I U10 5v5 må modstanderne IKKE presse inden for den presfri zone ved målspark. Keeperen og forsvarerne skal have ro til at spille bolden ud.' },
  { title: 'Tilbagelægning',       sort_order:  5, body_text: 'Spilles bolden tilbage til keeperen med foden, MÅ keeperen IKKE tage den med hænderne — kun spille med fødderne. Ellers er det indirekte frispark!' },
  { title: 'Indkast',              sort_order:  6, body_text: 'Ved indkast skal begge fødder røre jorden, og bolden kastes med begge hænder bag hovedet. Løfter du en fod, er det modstanderens indkast!' },
  { title: 'Offside',              sort_order:  7, body_text: 'Du er offside hvis du er tættere på modstanderens mållinje end bolden OG den næstsidste modstander, når bolden spilles til dig. Gælder kun i modstanderens halvdel!' },
  { title: 'Straffespark',         sort_order:  8, body_text: 'Straffespark gives hvis en spiller begår en forseelse inden for eget straffesparksfelt. Bolden placeres på straffesparkspletten — kun keeperen må stå på mållinjen.' },
  { title: 'Gult og rødt kort',   sort_order:  9, body_text: 'Gult kort = advarsel. To gule kort = rødt kort og udvisning. Rødt kort direkte gives for grov tackling eller fornærmende opførsel. Udvist spiller må ikke erstattes!' },
  { title: 'Hjørnespark',          sort_order: 10, body_text: 'Hjørnespark gives når bolden går over baglinjen og en forsvarer rørte den sidst. Bolden placeres i hjørnefeltet og modstanderne skal stå mindst 9,15 m væk.' },
  { title: 'Direkte vs. indirekte frispark', sort_order: 11, body_text: 'Direkte frispark: du kan score direkte. Indirekte frispark: bolden skal røre en anden spiller først. Modstanderne skal stå mindst 9,15 m fra bolden.' },
  { title: 'Spilletid U10/U11',    sort_order: 12, body_text: 'U10 og U11 spiller typisk 2 x 20 minutter med 5 minutters pause. Holdet med flest mål vinder — ved uafgjort er det et fint resultat for begge hold!' },
  { title: 'Respekt for dommeren', sort_order: 13, body_text: 'Dommeren har altid det sidste ord. Diskuter ALDRIG dommerens beslutninger — det er usportslig opførsel og kan give gult kort. Accepter afgørelsen og spil videre!' },
  { title: 'Substitution',         sort_order: 14, body_text: 'I ungdomsfodbold kan der skiftes frit. Spilleren der forlader banen skal altid gå ud ved midterlinjen, og den nye spiller venter på dommerens signal.' },
  { title: 'Boldbesiddelse',       sort_order: 15, body_text: 'Når vi har bolden, bevæger alle sig — ikke kun den med bolden! Skab mellemrum, tilbyd dig som afleveringsmulighed og kommunikér med din holdkammerat.' },
  { title: 'Målvogterens regler',  sort_order: 16, body_text: 'Keeperen må kun holde bolden i 6 sekunder inden for eget felt. Herefter skal bolden spilles ud. Keeperen må heller ikke tage bolden med hænderne efter et bevidst spark fra holdkammerat.' },
  { title: 'Spillerens udstyr',    sort_order: 17, body_text: 'Alle spillere skal bære trøje, shorts, strømper, benskinner og fodboldstøvler. Smykker og ure er IKKE tilladt — det er en sikkerhedsregel for alle spillere!' },
];

const FACTS = [
  { title: '10-12 km per kamp! 🏃',         sort_order:  1, body_text: 'En professionel fodboldspiller løber i gennemsnit 10-12 km per kamp. Det svarer til at løbe fra Grenå centrum til Gjerrild og tilbage!' },
  { title: 'Verdens ældste klub 🏛️',         sort_order:  2, body_text: 'Sheffield FC i England er verdens ældste fodboldklub — grundlagt i 1857! Det er næsten 170 år siden. Grenå IF er unge i sammenligning med sine 40 år!' },
  { title: 'Boldens rejse ⚽',               sort_order:  3, body_text: 'I en enkelt kamp tilbagelægger bolden i gennemsnit over 100 km! Det er fordi den flyver frem og tilbage mellem spillerne hele kampen.' },
  { title: 'Pelés rekord 🌟',                sort_order:  4, body_text: 'Pelé scorede 1.281 mål i sin karriere! Han er den eneste spiller der har vundet VM tre gange (1958, 1962, 1970) — alle med Brasilien.' },
  { title: 'Den hurtigste scoring ⚡',       sort_order:  5, body_text: 'Det hurtigste mål i fodboldhistorien blev scoret efter blot 2,4 sekunder! Det er hurtigere end du kan sige "Grenå IF er de bedste!"' },
  { title: 'Keeper = 5-6 km 🧤',            sort_order:  6, body_text: 'En keeper løber kun 5-6 km per kamp — men til gengæld er de konstant fokuserede og laver lynhurtige reaktioner. Keeperjobbet er hårdt mentalt!' },
  { title: 'VM 2022 rekord 📺',              sort_order:  7, body_text: 'VM 2022 i Qatar blev set af over 5 milliarder mennesker! Det er mere end halvdelen af hele jordens befolkning der fulgte med.' },
  { title: 'Hjernens rolle 🧠',              sort_order:  8, body_text: 'Når du modtager en bold, træffer din hjerne over 100 beslutninger på under ét sekund: fart, retning, kraft, hvilken fod... Fodbold er faktisk et hjernesport!' },
  { title: 'Græssets hemmelighed 🌿',        sort_order:  9, body_text: 'En professionel fodboldbane har ca. 8 millioner græsstrå! Banen klippes op til 3 gange om ugen og vandes dagligt for at holde den perfekt.' },
  { title: 'Verdens dyreste spiller 💰',     sort_order: 10, body_text: 'Neymar Jr. er den dyreste spiller nogensinde — solgt for 222 millioner euro i 2017! Det er nok til at købe over 44 millioner fodboldstøvler.' },
  { title: 'Messi og VM-trofæet 🐐',        sort_order: 11, body_text: 'Lionel Messi vandt endelig VM i 2022 med Argentina efter tre tidligere forsøg. Han har vundet Ballon d\'Or 8 gange — flest nogensinde!' },
  { title: 'Fodbold og matematik 📐',        sort_order: 12, body_text: 'En fodbold er lavet af 32 paneler — 20 hvide sekskanter og 12 sorte femkanter. Denne form kaldes en trunkeret ikosaeder og er faktisk en matematisk figur!' },
  { title: 'Fodboldstøvlernes evolution 👟', sort_order: 13, body_text: 'De første fodboldstøvler i 1800-tallet vejede over 500 gram og var lavet af læder der blev tungt af vand! Moderne støvler vejer kun 150-200 gram.' },
  { title: 'Hjemmebane-fordel 🏟️',           sort_order: 14, body_text: 'Statistisk vinder hjemmeholdet 46% af kampene, udehold vinder 27% og 27% ender uafgjort. Hjemmebane-fordelen er reel — publikum giver energi!' },
  { title: 'Verdens største stadion 🌍',     sort_order: 15, body_text: 'Rungrado 1st of May Stadium i Nordkorea kan rumme 114.000 tilskuere! Det er som om hele Grenå by og alle nabobyerne sad på lægterne på én gang.' },
  { title: 'Boldens rotation 🌀',            sort_order: 16, body_text: 'En professionel frispark-bold kan rotere op til 600 gange i minuttet! Det er denne rotation der skaber den berømte "banan-effekt" som Roberto Carlos var mester i.' },
  { title: 'Fodbold og venskab 🤝',          sort_order: 17, body_text: 'Studier viser at børn der spiller holdsport som fodbold har 40% bedre sociale færdigheder end børn der ikke dyrker holdsport. Fodbold gør dig bedre til at samarbejde!' },
  { title: 'Danmarks VM-debut 🇩🇰',           sort_order: 18, body_text: 'Danmark debuterede ved VM i 1986 i Mexico og vandt 6-1 over Uruguay! Det var en historisk kamp. Michael Laudrup og Preben Elkjær var stjernerne.' },
  { title: 'EM-guld 1992 🏆',                sort_order: 19, body_text: 'Danmark vandt EM i 1992 i Sverige — og vi var ikke engang kvalificeret! Vi kom ind som erstatning for Jugoslavien 10 dage før turneringen. Og så vandt vi det hele!' },
  { title: 'Fodbold og kalorier 🔥',         sort_order: 20, body_text: 'En fodboldspiller forbrænder 600-900 kalorier per kamp! Det svarer til at spise 3-4 store pizzastykker. Derfor er det vigtigt at spise godt efter kampen.' },
  { title: 'Boldtryk-hemmeligheden 🎈',      sort_order: 21, body_text: 'En fodbold skal have et tryk på 0,6-1,1 atmosfære. For lidt luft = bolden hopper ikke. For meget = bolden er hård og svær at kontrollere. Præcis tryk er vigtigt!' },
  { title: 'Verdens hurtigste skud 💨',      sort_order: 22, body_text: 'Det hurtigste skud nogensinde blev målt til 211 km/t af Ronny Heberson i 2006! Det er hurtigere end de fleste biler på motorvejen.' },
  { title: 'Fodbold i Antarktis 🐧',         sort_order: 23, body_text: 'Der er faktisk spillet fodbold i Antarktis! Forskere ved McMurdo Station spillede en kamp i -20 grader. Bolden var næsten frossen og støvlerne var ekstra tykke.' },
  { title: 'Kattegat Cup 2026 ⭐',           sort_order: 24, body_text: 'Kattegat Cup er Grenå IFs store jubilæumsstævne i 2026! Hundredvis af spillere fra hele regionen samles for at fejre 40 år med fodbold, fællesskab og sjov.' },
  { title: 'Frispark-muren springer for sent 🧱', sort_order: 25, body_text: 'Spillere i en frispark-mur springer i gennemsnit 0,3 sekunder for sent! Forskning viser at de fleste springer EFTER bolden er sparket — ikke før.' },
  { title: 'Søvn og præstation 😴',          sort_order: 26, body_text: 'Fodboldspillere der sover 9 timer om natten løber 3% hurtigere og laver 10% færre fejl end dem der sover 7 timer. Søvn er faktisk træning!' },
  { title: 'Vandforbrug under kamp 💧',      sort_order: 27, body_text: 'En fodboldspiller sveder op til 2-3 liter væske under en kamp! Derfor er det super vigtigt at drikke vand FØR, UNDER og EFTER kampen.' },
  { title: 'Fodbold opfundet i Kina? 🇨🇳',  sort_order: 28, body_text: 'Den tidligste form for fodbold — kaldet "Cuju" — blev spillet i Kina for over 2.000 år siden! FIFA anerkender Kina som fodboldets fødested.' },
  { title: 'Hattrick-historien 🎩',          sort_order: 29, body_text: 'Ordet "hattrick" kommer fra cricket! En bowler der tog 3 wickets i træk fik en ny hat som præmie. Fodbold lånte udtrykket for 3 mål i én kamp.' },
  { title: 'Verdens mindste fodboldland ⚽',  sort_order: 30, body_text: 'San Marino er et af verdens mindste fodboldlande med kun 34.000 indbyggere — men de har et nationalt fodboldhold og spiller i UEFA-kvalifikation!' },
];

async function seedContent(db) {
  let added = 0;
  for (const item of REGLER) {
    const exists = (await db.execute({ sql: 'SELECT 1 FROM content WHERE title = ? AND type = ?', args: [item.title, 'regel'] })).rows[0];
    if (!exists) {
      await db.execute({ sql: 'INSERT INTO content (content_id, type, title, body_text, sort_order) VALUES (?, ?, ?, ?, ?)', args: [uuidv4(), 'regel', item.title, item.body_text, item.sort_order] });
      added++;
    }
  }
  for (const item of FACTS) {
    const exists = (await db.execute({ sql: 'SELECT 1 FROM content WHERE title = ? AND type = ?', args: [item.title, 'fact'] })).rows[0];
    if (!exists) {
      await db.execute({ sql: 'INSERT INTO content (content_id, type, title, body_text, sort_order) VALUES (?, ?, ?, ?, ?)', args: [uuidv4(), 'fact', item.title, item.body_text, item.sort_order] });
      added++;
    }
  }
  console.log(`✅ Content seedet: ${added} nye poster (${REGLER.length} regler + ${FACTS.length} facts)`);
}

module.exports = { seedContent, FACTS };
