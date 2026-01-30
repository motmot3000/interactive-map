// ==================== CONFIGURATION ====================
const cantons = [
    "Appenzell Rhodes-Extérieures",
    "Appenzell Rhodes-Intérieures",
    "Argovie",
    "Bâle-Campagne",
    "Bâle-Ville",
    "Berne",
    "Fribourg",
    "Genève",
    "Glaris",
    "Grisons",
    "Jura",
    "Lucerne",
    "Neuchâtel",
    "Nidwald",
    "Obwald",
    "Saint-Gall",
    "Schaffhouse",
    "Schwytz",
    "Soleure",
    "Tessin",
    "Thurgovie",
    "Uri",
    "Valais",
    "Vaud",
    "Zoug",
    "Zurich"
];

const cantonMap = {
    "CH-AG": "Argovie",
    "CH-AL": "Appenzell Rhodes-Intérieures",
    "CH-AR": "Appenzell Rhodes-Extérieures",
    "CH-BE": "Berne",
    "CH-BL": "Bâle-Campagne",
    "CH-BS": "Bâle-Ville",
    "CH-FR": "Fribourg",
    "CH-GE": "Genève",
    "CH-GL": "Glaris",
    "CH-GR": "Grisons",
    "CH-JU": "Jura",
    "CH-LU": "Lucerne",
    "CH-NE": "Neuchâtel",
    "CH-NW": "Nidwald",
    "CH-OW": "Obwald",
    "CH-SG": "Saint-Gall",
    "CH-SH": "Schaffhouse",
    "CH-SO": "Soleure",
    "CH-SZ": "Schwytz",
    "CH-TG": "Thurgovie",
    "CH-TI": "Tessin",
    "CH-UR": "Uri",
    "CH-VD": "Vaud",
    "CH-VS": "Valais",
    "CH-ZG": "Zoug",
    "CH-ZH": "Zurich"
};

const cantonData = {
    AG: {
        fullName: "Canton d'Argovie",
        chefLieu: "Aarau",
        population: "689 697",
        area: "1 404 km²",
        languages: "Allemand",
        flag: "./assets/flags/ag.png"
    },
    AL: {
        fullName: "Canton d'Appenzell Rhodes-Intérieures",
        chefLieu: "Appenzell",
        population: "16 187",
        area: "173 km²",
        languages: "Allemand",
        flag: "./assets/flags/al.png"
    },
    AR: {
        fullName: "Canton d'Appenzell Rhodes-Extérieures",
        chefLieu: "Herisau",
        population: "78 570",
        area: "796 km²",
        languages: "Allemand",
        flag: "./assets/flags/ar.png"
    },
    BE: {
        fullName: "Canton de Berne",
        chefLieu: "Berne",
        population: "1 025 959",
        area: "5 959 km²",
        languages: "Allemand, Français",
        flag: "./assets/flags/be.png"
    },
    BL: {
        fullName: "Canton de Bâle-Campagne",
        chefLieu: "Liestal",
        population: "195 714",
        area: "518 km²",
        languages: "Allemand",
        flag: "./assets/flags/bl.png"
    },
    BS: {
        fullName: "Canton de Bâle-Ville",
        chefLieu: "Bâle",
        population: "195 715",
        area: "172 km²",
        languages: "Allemand",
        flag: "./assets/flags/bs.png"
    },
    FR: {
        fullName: "Canton de Fribourg",
        chefLieu: "Fribourg",
        population: "319 014",
        area: "1 671 km²",
        languages: "Français, Allemand",
        flag: "./assets/flags/fr.png"
    },
    GE: {
        fullName: "Canton de Genève",
        chefLieu: "Genève",
        population: "507 697",
        area: "282 km²",
        languages: "Français",
        flag: "./assets/flags/ge.png"
    },
    GL: {
        fullName: "Canton de Glaris",
        chefLieu: "Glaris",
        population: "40 403",
        area: "685 km²",
        languages: "Allemand",
        flag: "./assets/flags/gl.png"
    },
    GR: {
        fullName: "Canton des Grisons",
        chefLieu: "Coire",
        population: "200 714",
        area: "7 105 km²",
        languages: "Allemand, Romanche, Italien",
        flag: "./assets/flags/gr.png"
    },
    JU: {
        fullName: "Canton du Jura",
        chefLieu: "Delémont",
        population: "73 749",
        area: "838 km²",
        languages: "Français",
        flag: "./assets/flags/ju.png"
    },
    LU: {
        fullName: "Canton de Lucerne",
        chefLieu: "Lucerne",
        population: "429 017",
        area: "1 493 km²",
        languages: "Allemand",
        flag: "./assets/flags/lu.png"
    },
    NE: {
        fullName: "Canton de Neuchâtel",
        chefLieu: "Neuchâtel",
        population: "182 860",
        area: "803 km²",
        languages: "Français",
        flag: "./assets/flags/ne.png"
    },
    NW: {
        fullName: "Canton de Nidwald",
        chefLieu: "Stans",
        population: "43 286",
        area: "276 km²",
        languages: "Allemand",
        flag: "./assets/flags/nw.png"
    },
    OW: {
        fullName: "Canton d'Obwald",
        chefLieu: "Sarnen",
        population: "37 841",
        area: "491 km²",
        languages: "Allemand",
        flag: "./assets/flags/ow.png"
    },
    SG: {
        fullName: "Canton de Saint-Gall",
        chefLieu: "Saint-Gall",
        population: "528 234",
        area: "2 026 km²",
        languages: "Allemand",
        flag: "./assets/flags/sg.png"
    },
    SH: {
        fullName: "Canton de Schaffhouse",
        chefLieu: "Schaffhouse",
        population: "81 595",
        area: "298 km²",
        languages: "Allemand",
        flag: "./assets/flags/sh.png"
    },
    SO: {
        fullName: "Canton de Soleure",
        chefLieu: "Soleure",
        population: "177 077",
        area: "791 km²",
        languages: "Allemand",
        flag: "./assets/flags/so.png"
    },
    SZ: {
        fullName: "Canton de Schwytz",
        chefLieu: "Schwytz",
        population: "164 171",
        area: "908 km²",
        languages: "Allemand",
        flag: "./assets/flags/sz.png"
    },
    TG: {
        fullName: "Canton de Thurgovie",
        chefLieu: "Frauenfeld",
        population: "280 305",
        area: "991 km²",
        languages: "Allemand",
        flag: "./assets/flags/tg.png"
    },
    TI: {
        fullName: "Canton du Tessin",
        chefLieu: "Bellinzona",
        population: "352 539",
        area: "2 812 km²",
        languages: "Italien",
        flag: "./assets/flags/ti.png"
    },
    UR: {
        fullName: "Canton d'Uri",
        chefLieu: "Altdorf",
        population: "36 649",
        area: "1 077 km²",
        languages: "Allemand",
        flag: "./assets/flags/ur.png"
    },
    VD: {
        fullName: "Canton de Vaud",
        chefLieu: "Lausanne",
        population: "859 557",
        area: "3 212 km²",
        languages: "Français",
        flag: "./assets/flags/vd.png"
    },
    VS: {
        fullName: "Canton du Valais",
        chefLieu: "Sion",
        population: "353 041",
        area: "5 224 km²",
        languages: "Français, Allemand",
        flag: "./assets/flags/vs.png"
    },
    ZG: {
        fullName: "Canton de Zoug",
        chefLieu: "Zoug",
        population: "129 899",
        area: "239 km²",
        languages: "Allemand",
        flag: "./assets/flags/zg.png"
    },
    ZH: {
        fullName: "Canton de Zurich",
        chefLieu: "Zurich",
        population: "1 569 604",
        area: "1 729 km²",
        languages: "Allemand",
        flag: "./assets/flags/zh.png"
    }
};

