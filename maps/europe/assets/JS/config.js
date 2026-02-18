// ==================== CONFIGURATION ====================
const countries = [
    "Albanie",
    "Allemagne",
    "Autriche",
    "Azerbaïdjan",
    "Belgique",
    "Biélorussie",
    "Bosnie-Herzégovine",
    "Bulgarie",
    "Croatie",
    "Danemark",
    "Espagne",
    "Estonie",
    "Finlande",
    "France",
    "Grèce",
    "Hongrie",
    "Irlande",
    "Islande",
    "Italie",
    "Lettonie",
    "Lituanie",
    "Macédoine du Nord",
    "Moldavie",
    "Monténégro",
    "Norvège",
    "Pays-Bas",
    "Pologne",
    "Portugal",
    "Roumanie",
    "Royaume-Uni",
    "Serbie",
    "Slovaquie",
    "Slovénie",
    "Suède",
    "Suisse",
    "République Tchèque",
    "Turquie",
    "Ukraine"
];

const countryMap = {
    "AL": "Albanie",
    "AM": "Arménie",
    "AT": "Autriche",
    "AZ": "Azerbaïdjan",
    "BA": "Bosnie Herzégovine",
    "BE": "Belgique",
    "BG": "Bulgarie",
    "BY": "Biélorussie",
    "CH": "Suisse",
    "CY": "Chypre",
    "CZ": "République Tchèque",
    "DE": "Allemagne",
    "DK": "Danemark",
    "EE": "Estonie",
    "ES": "Espagne",
    "FI": "Finlande",
    "FR": "France",
    "GB": "Royaume-Uni",
    "GE": "Géorgie",
    "GR": "Grèce",
    "HR": "Croatie",
    "HU": "Hongrie",
    "IE": "Irlande",
    "IS": "Islande",
    "IT": "Italie",
    "KV": "Kosovo",
    "LT": "Lituanie",
    "LU": "Luxembourg",
    "LV": "Lettonie",
    "MD": "Moldavie",
    "ME": "Monténégro",
    "MK": "Macédoine du Nord",
    "NL": "Pays-Bas",
    "NO": "Norvège",
    "PL": "Pologne",
    "PT": "Portugal",
    "RO": "Roumanie",
    "RS": "Serbie",
    "RU": "Russie",
    "SE": "Suède",
    "SI": "Slovénie",
    "SK": "Slovaquie",
    "TR": "Turquie",
    "UA": "Ukraine"
};

const countriesData = {
  FR: {
  fullName: "République française",
    capital: "Paris",
    population: "67 millions",
    area: "551 695 km²",
    languages: "Français",
    flag: "fr.png"
  },
  CH: {
    fullName: "Confédération suisse",
    capital: "Berne",
    population: "8,8 millions",
    area: "41 285 km²",
    languages: "Allemand, Français, Italien, Romanche",
    flag: "ch.png"
  },
  GB: {
  fullName: "Royaume-Uni de Grande-Bretagne et d’Irlande du Nord",
  capital: "Londres",
  population: "67,7 millions",
  area: "242 495 km²",
  languages: "Anglais",
  flag: "gb.png"
},

    DE: {
    fullName: "République fédérale d’Allemagne",
    capital: "Berlin",
    population: "83,3 millions",
    area: "357 592 km²",
    languages: "Allemand",
    flag: "de.png"
  },
  IT: {
    fullName: "République italienne",
    capital: "Rome",
    population: "58,9 millions",
    area: "301 340 km²",
    languages: "Italien",
    flag: "it.png"
  },
  ES: {
    fullName: "Royaume d’Espagne",
    capital: "Madrid",
    population: "48,6 millions",
    area: "505 990 km²",
    languages: "Espagnol",
    flag: "es.png"
  },
  BE: {
    fullName: "Royaume de Belgique",
    capital: "Bruxelles",
    population: "11,8 millions",
    area: "30 689 km²",
    languages: "Français, Néerlandais, Allemand",
    flag: "be.png"
  },
  NL: {
    fullName: "Royaume des Pays-Bas",
    capital: "Amsterdam",
    population: "17,9 millions",
    area: "41 850 km²",
    languages: "Néerlandais",
    flag: "nl.png"
  },
  AT: {
    fullName: "République d’Autriche",
    capital: "Vienne",
    population: "9,1 millions",
    area: "83 879 km²",
    languages: "Allemand",
    flag: "at.png"
  },
  PT: {
    fullName: "République portugaise",
    capital: "Lisbonne",
    population: "10,4 millions",
    area: "92 212 km²",
    languages: "Portugais",
    flag: "pt.png"
  },
  SE: {
    fullName: "Royaume de Suède",
    capital: "Stockholm",
    population: "10,6 millions",
    area: "450 295 km²",
    languages: "Suédois",
    flag: "se.png"
  },
  NO: {
    fullName: "Royaume de Norvège",
    capital: "Oslo",
    population: "5,5 millions",
    area: "385 207 km²",
    languages: "Norvégien",
    flag: "no.png"
  },
  FI: {
    fullName: "République de Finlande",
    capital: "Helsinki",
    population: "5,6 millions",
    area: "338 455 km²",
    languages: "Finnois, Suédois",
    flag: "fi.png"
  },
  DK: {
    fullName: "Royaume du Danemark",
    capital: "Copenhague",
    population: "5,9 millions",
    area: "42 933 km²",
    languages: "Danois",
    flag: "dk.png"
  },
  AL: {
    fullName: "République d’Albanie",
    capital: "Tirana",
    population: "2,8 millions",
    area: "28 748 km²",
    languages: "Albanais",
    flag: "al.png"
  },
  AM: {
    fullName: "République d’Arménie",
    capital: "Erevan",
    population: "2,8 millions",
    area: "29 743 km²",
    languages: "Arménien",
    flag: "am.png"
  },
  AZ: {
    fullName: "République d’Azerbaïdjan",
    capital: "Bakou",
    population: "10,2 millions",
    area: "86 600 km²",
    languages: "Azéri",
    flag: "az.png"
  },
  BA: {
    fullName: "Bosnie-Herzégovine",
    capital: "Sarajevo",
    population: "3,2 millions",
    area: "51 197 km²",
    languages: "Bosnien, Croate, Serbe",
    flag: "ba.png"
  },
  BG: {
    fullName: "République de Bulgarie",
    capital: "Sofia",
    population: "6,4 millions",
    area: "110 879 km²",
    languages: "Bulgare",
    flag: "bg.png"
  },
  BY: {
    fullName: "République de Biélorussie",
    capital: "Minsk",
    population: "9,2 millions",
    area: "207 600 km²",
    languages: "Biélorusse, Russe",
    flag: "by.png"
  },
  CY: {
    fullName: "République de Chypre",
    capital: "Nicosie",
    population: "1,3 million",
    area: "9 251 km²",
    languages: "Grec, Turc",
    flag: "cy.png"
  },
  CZ: {
    fullName: "République tchèque",
    capital: "Prague",
    population: "10,9 millions",
    area: "78 866 km²",
    languages: "Tchèque",
    flag: "cz.png"
  },
  EE: {
    fullName: "République d’Estonie",
    capital: "Tallinn",
    population: "1,4 million",
    area: "45 227 km²",
    languages: "Estonien",
    flag: "ee.png"
  },
  GE: {
    fullName: "Géorgie",
    capital: "Tbilissi",
    population: "3,7 millions",
    area: "69 700 km²",
    languages: "Géorgien",
    flag: "ge.png"
  },
  GR: {
    fullName: "République hellénique",
    capital: "Athènes",
    population: "10,3 millions",
    area: "131 957 km²",
    languages: "Grec",
    flag: "gr.png"
  },
  HR: {
    fullName: "République de Croatie",
    capital: "Zagreb",
    population: "3,9 millions",
    area: "56 594 km²",
    languages: "Croate",
    flag: "hr.png"
  },
  HU: {
    fullName: "Hongrie",
    capital: "Budapest",
    population: "9,6 millions",
    area: "93 028 km²",
    languages: "Hongrois",
    flag: "hu.png"
  },
  IE: {
    fullName: "Irlande",
    capital: "Dublin",
    population: "5,3 millions",
    area: "70 273 km²",
    languages: "Irlandais, Anglais",
    flag: "ie.png"
  },
  IS: {
    fullName: "Islande",
    capital: "Reykjavik",
    population: "0,39 million",
    area: "103 000 km²",
    languages: "Islandais",
    flag: "is.png"
  },
  KV: {
    fullName: "République du Kosovo",
    capital: "Pristina",
    population: "1,8 million",
    area: "10 887 km²",
    languages: "Albanais, Serbe",
    flag: "xk.png"
  },
  LV: {
    fullName: "République de Lettonie",
    capital: "Riga",
    population: "1,9 million",
    area: "64 589 km²",
    languages: "Letton",
    flag: "lv.png"
  },
  LI: {
    fullName: "Principauté du Liechtenstein",
    capital: "Vaduz",
    population: "0,039 million",
    area: "160 km²",
    languages: "Allemand",
    flag: "li.png"
  },
  LT: {
    fullName: "République de Lituanie",
    capital: "Vilnius",
    population: "2,8 millions",
    area: "65 300 km²",
    languages: "Lituanien",
    flag: "lt.png"
  },
  LU: {
    fullName: "Grand-Duché de Luxembourg",
    capital: "Luxembourg",
    population: "0,67 million",
    area: "2 586 km²",
    languages: "Luxembourgeois, Français, Allemand",
    flag: "lu.png"
  },
  MD: {
    fullName: "République de Moldavie",
    capital: "Chișinău",
    population: "2,5 millions",
    area: "33 846 km²",
    languages: "Roumain",
    flag: "md.png"
  },
  ME: {
    fullName: "Monténégro",
    capital: "Podgorica",
    population: "0,62 million",
    area: "13 812 km²",
    languages: "Monténégrin",
    flag: "me.png"
  },
  MK: {
    fullName: "Macédoine du Nord",
    capital: "Skopje",
    population: "1,8 million",
    area: "25 713 km²",
    languages: "Macédonien",
    flag: "mk.png"
  },
  PL: {
    fullName: "République de Pologne",
    capital: "Varsovie",
    population: "37,6 millions",
    area: "312 696 km²",
    languages: "Polonais",
    flag: "pl.png"
  },
  RO: {
    fullName: "Roumanie",
    capital: "Bucarest",
    population: "19,1 millions",
    area: "238 397 km²",
    languages: "Roumain",
    flag: "ro.png"
  },
  RS: {
    fullName: "République de Serbie",
    capital: "Belgrade",
    population: "6,6 millions",
    area: "88 361 km²",
    languages: "Serbe",
    flag: "rs.png"
  },
  RU: {
    fullName: "Fédération de Russie",
    capital: "Moscou",
    population: "146 millions",
    area: "17 098 246 km²",
    languages: "Russe",
    flag: "ru.png"
  },
  SK: {
    fullName: "République slovaque",
    capital: "Bratislava",
    population: "5,4 millions",
    area: "49 035 km²",
    languages: "Slovaque",
    flag: "sk.png"
  },
  SI: {
    fullName: "République de Slovénie",
    capital: "Ljubljana",
    population: "2,1 millions",
    area: "20 273 km²",
    languages: "Slovène",
    flag: "si.png"
  },
  TR: {
    fullName: "République de Turquie",
    capital: "Ankara",
    population: "85 millions",
    area: "783 356 km²",
    languages: "Turc",
    flag: "tr.png"
  },
  UA: {
    fullName: "Ukraine",
    capital: "Kyiv",
    population: "36 millions",
    area: "603 628 km²",
    languages: "Ukrainien",
    flag: "ua.png"
  }


};
