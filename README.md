# Odlingskalender

Odlingskalender är en fristående webbaserad odlingsapp för planering, uppföljning och dokumentation av odlingsåret. Appen körs helt på klientsidan i webbläsaren och sparar data lokalt i browserns lagring.

## Hur appen fungerar

Appen består av en HTML-baserad användargränssnitt (`index.html`), all logik i `app.js`, layout och visuell design i `styles.css`, en inbyggd frökatalog i `seed_catalog_full.js` och externa XLSX-biblioteket i `vendor/xlsx.full.min.js`.

Vid första start fylls appen med:

- en standardiserad frödatabas från den inbyggda katalogen
- exempelgrödor, händelser, skiften och bäddar
- lokal lagring för aktivt odlingsår, väderplats och frostrisk

Allt användardata sparas lokalt i webbläsaren via IndexedDB och `localStorage`.

## Huvudfunktioner

### 1. Idag

Startsidan visar det som är mest relevant just nu i odlingen.

- lista över aktuella och kommande arbetsuppgifter
- filtrering mellan ej utförda och alla uppgifter
- filtrering per bädd eller yta
- snabböversikt med statistik för året
- topprad med vecka, antal öppna uppgifter, antal grödor i försådd, planterade grödor och skördade grödor

### 2. Tidslinje

Tidslinjen används för att planera och jämföra odlingsomgångar vecka för vecka.

- vy för försådd
- vy för grödor
- vy för bäddutnyttjande
- färgkodade block för försådd, direktsådd, utplantering och skörd
- markering av aktuell vecka
- hjälpdialog som förklarar tidslinjen
- filtrering per bädd, skifte, växtfamilj, status och gruppering
- dragbar planering direkt i tidslinjen
- visning av frostrisk och frostfönster baserat på historiska data

### 3. Frödatabas

Frödatabasen samlar grödor och odlingsdata som används i planeringen.

- lägga till och redigera grödor
- söka i frödatabasen
- lagra familj, latinsk familj, gröda, metod, plant- och radavstånd samt veckor för försådd, direktsådd, utplantering och skörd
- lagra kulturtid och frömängd per kvadratmeter
- använda frö per kvadratmeter som underlag i planeringen
- importera frödatabas från `json`, `csv`, `xlsx` och `xlsm`
- exportera frödatabas till Excel-format

### 4. Skörd

Skördsidan sammanfattar årets registrerade skörd.

- summering per gröda
- total skörd i kilo
- summerad odlad yta
- sortering på gröda, skörd och area
- detaljdialog med skörd per vecka
- redigera eller radera enskilda skördeposter
- radera all skörd för en vald gröda under aktivt år

### 5. Bäddar

Sidan för bäddar och skiften används för att organisera odlingsytan.

- skapa och redigera skiften
- skapa och redigera odlingsytor som bädd, växthus, gång, träd, hus, staket, mur eller häck
- koppla bäddar till skiften
- visa odlingskarta med zoom och panorering
- dra och flytta bäddar på kartan
- ändra storlek på bäddar direkt i kartan
- rotera bäddar
- se beläggning och status för ytor vid vald vecka
- stöd för växtföljd och rotationsordning per skifte

## Planering av grödor

När en gröda läggs till i tidslinjen skapas en odlingsomgång med koppling till fröpost, bäddar, area och schema.

Appen stödjer:

- automatisk eller manuell såmetod
- rekommenderade veckor utifrån frödata
- länkade planeringssteg mellan försådd, utplantering och skörd
- kapacitetsvisning för valda bäddar
- rekommendationer för växtföljd
- uppgiftshantering för varje odlingsomgång

## Väder och frost

Appen hämtar väderdata och platsbaserad information automatiskt när webbläsaren tillåter det.

- geolokalisering för aktuell plats
- prognosdata från SMHI
- veckovy för kommande väder
- råd baserat på närmaste väderdagar
- historiskt frostfönster från SMHI-stationer
- visning av hög frostrisk och 50-procentig frostzon i tidslinjen

## Lagring

Appen använder två IndexedDB-databaser:

- `frodatabas-db` för fröposter
- `egen-odling-db` för grödor, händelser, skiften, bäddar och skörd

Dessutom används `localStorage` för:

- aktivt odlingsår
- om standarddata redan har laddats in
- sparad väderplats
- markering att platsåtkomst redan har efterfrågats
- cache för frostfönster

## Import och export

Appen har två separata import/export-flöden:

- frödatabasen kan importeras och exporteras separat
- odlingsplanen kan importeras och exporteras som Excel-arbetsbok med blad för grödor och händelser

Det gör att fröbiblioteket och den aktiva odlingsplanen kan hanteras var för sig.

## Starta appen

Eftersom appen nu är renodlad som webbapp behövs ingen Electron-wrapper.

För att köra appen lokalt räcker det att öppna `index.html` i en webbläsare. Om webbläsaren begränsar vissa filanrop kan appen i stället köras via en enkel lokal statisk server.

## Projektstruktur

- `index.html` - appens struktur och dialoger
- `app.js` - all applikationslogik, lagring, planering, väder och import/export
- `styles.css` - layout, komponenter och responsiv styling
- `seed_catalog_full.js` - inbyggd standardkatalog för frödata
- `vendor/xlsx.full.min.js` - bibliotek för Excel-import och export
- `assets/` - bilder och visuella resurser

## Rensning som är gjord

Följande gamla filer har tagits bort eftersom de inte längre användes i den nya appen:

- tidigare Electron-paketering i `package.json`
- låsfilen `package-lock.json`
- oanvänd JSON-kopia av frökatalogen i `seed_catalog_full.json`
