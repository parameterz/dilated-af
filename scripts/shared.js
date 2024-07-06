// shared.js

const data = {
    NORRE: {
        SOV: { female: 22.1, male: 23.2 },
        STJ: { female: 19.4, male: 19.8 },
        AAO: { female: 21.1, male: 21.4 }
    },
    WASE: {
        SOV: {
            "18-40": { female: 22, male: 21.8 },
            "41-65": { female: 22.6, male: 23.2 },
            ">65": { female: 23.9, male: 24.3 }
        },
        STJ: {
            "18-40": { female: 19.2, male: 19 },
            "41-65": { female: 20.2, male: 20.7 },
            ">65": { female: 21, male: 21.7 }
        }
    }
};

function convertHeightToCm(feet, inches) {
    return (feet * 30.48) + (inches * 2.54);
}

function calculateULN(heightCm, study, site, gender, ageGroup) {
    if (study === "NORRE") {
        return ((heightCm / 100) * data[study][site][gender]).toFixed(1);
    } else if (study === "WASE" && site !== "AAO") {
        return ((heightCm / 100) * data[study][site][ageGroup][gender]).toFixed(1);
    }
    return "n/a";
}
