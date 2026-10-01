# Syksy 2026

Tämä repository kokoaa syksyn 2026 ohjelmointikurssin harjoitukset samaan paikkaan.

## Kansiorakenne

```text
syksy26/
├── .github/       Repositoryn automaattiset GitHub-työnkulut
├── CSS-26/        CSS-kurssin harjoitukset ja materiaalit
├── HTML-26/       HTML-kurssin harjoitukset ja niiden materiaalit
├── JavaScript-26/ Tulevan JavaScript-kurssin harjoitukset
├── main/          Etusivun tyylit, JavaScript, kuvat ja arkiston tiedot
├── index.html     Ohjelmointikurssien yhteinen etusivu
└── README.md      Repositoryn yleiskuvaus
```

## Kurssiselain

Repositoryn `index.html` on kaikkien ohjelmointikurssien yhteinen etusivu. Kurssiselain kokoaa automaattisesti `HTML-26`-, `CSS-26`- ja tulevan `JavaScript-26`-kansion HTML-harjoitukset kansiorakenteineen. Harjoitussivujen **Etusivulle**-linkit käyttävät suhteellisia polkuja, joten ne toimivat sekä paikallisesti että GitHub Pagesissa.

Kurssiarkisto muodostetaan automaattisesti HTML-tiedostoista. GitHub Actions päivittää tiedoston `main/pages.json`, kun `HTML-26`-, `CSS-26`- tai `JavaScript-26`-kansion HTML-harjoituksia lisätään, siirretään tai poistetaan. Generaattori lukee kansiorakenteen suoraan levyltä, joten ylimääräisiä `pages`-välikansioita ei tarvita.

## CSS-26

`CSS-26` sisältää CSS-kurssin tuntiharjoituksia ja FreeCodeCamp-tehtäviä. Jokainen harjoituskokonaisuus säilyttää omat HTML- ja CSS-tiedostonsa omassa kansiossaan.

```text
CSS-26/
├── CSS-freecodecamp/          FreeCodeCamp-harjoitukset luvuittain
└── tunti-harjoitukset/        Oppitunneilla tehdyt CSS-harjoitukset
    └── osio_XX/               Osion HTML sekä sen oma css-kansio
```

Kurssiselain tunnistaa myös uudet CSS-26:n alikansiot automaattisesti niiden sijainnista riippumatta.

## JavaScript-26

`JavaScript-26`-kansiota ei ole vielä luotu. Kun kansio ja ensimmäiset HTML-harjoitukset lisätään, ne ilmestyvät automaattisesti etusivun kurssiselaimeen.

## Paikallinen esikatselu

Käynnistä paikallinen palvelin repositoryn juuressa:

```powershell
py -m http.server 8000
```

Avaa selaimessa `http://localhost:8000/`.

## Linkit

- [Julkaistu HTML-kurssisivusto](https://zoncuu.github.io/HTML26/)
- [GitHub-repository](https://github.com/Zoncuu/HTML26)
