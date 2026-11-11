// Reference data: height-indexed aortic dimensions (mm/m), mean and SD.
// Normal range = mean ± 2 SD.

// NORRE: Saura D, et al. Eur Heart J Cardiovasc Imaging 2017;18:167-179.
// Indexed to height (mm/m); by sex, timing and edge convention.
const NORRE = {
  diastole: {
    leading: {
      SOV: { male: { mean: 19.0, sd: 2.1 }, female: { mean: 18.1, sd: 2.0 } },
      STJ: { male: { mean: 16.2, sd: 1.8 }, female: { mean: 15.8, sd: 1.8 } },
      AAO: { male: { mean: 17.0, sd: 2.2 }, female: { mean: 16.7, sd: 2.2 } },
    },
    inside: {
      SOV: { male: { mean: 17.8, sd: 2.0 }, female: { mean: 16.9, sd: 1.9 } },
      STJ: { male: { mean: 15.0, sd: 1.8 }, female: { mean: 14.4, sd: 1.7 } },
      AAO: { male: { mean: 15.7, sd: 2.1 }, female: { mean: 15.6, sd: 2.1 } },
      RCOR: { male: { mean: 16.8, sd: 2.0 }, female: { mean: 16.1, sd: 1.7 } },
      LCOR: { male: { mean: 16.8, sd: 2.0 }, female: { mean: 16.4, sd: 1.9 } },
      NONCOR: { male: { mean: 16.8, sd: 2.0 }, female: { mean: 16.5, sd: 1.9 } },
    },
  },
  systole: {
    leading: {
      SOV: { male: { mean: 19.6, sd: 2.1 }, female: { mean: 18.9, sd: 1.9 } },
      STJ: { male: { mean: 16.8, sd: 1.8 }, female: { mean: 16.4, sd: 1.8 } },
      AAO: { male: { mean: 17.8, sd: 2.1 }, female: { mean: 17.6, sd: 2.1 } },
    },
    inside: {
      SOV: { male: { mean: 18.3, sd: 2.0 }, female: { mean: 17.6, sd: 1.9 } },
      STJ: { male: { mean: 15.4, sd: 1.8 }, female: { mean: 15.1, sd: 1.7 } },
      AAO: { male: { mean: 16.5, sd: 2.1 }, female: { mean: 16.4, sd: 2.0 } },
    },
  },
};

// WASE: Patel HN, et al. J Am Soc Echocardiogr 2022;35:267-274 (Table 3).
// End-diastole, leading edge-to-leading edge only. SOV and STJ only.
const WASE = {
  SOV: {
    "18-40": { male: { mean: 17.8, sd: 2.0 }, female: { mean: 17.4, sd: 2.3 } },
    "41-65": { male: { mean: 19.0, sd: 2.1 }, female: { mean: 18.6, sd: 2.0 } },
    ">65": { male: { mean: 19.5, sd: 2.4 }, female: { mean: 19.7, sd: 2.1 } },
  },
  STJ: {
    "18-40": { male: { mean: 15.2, sd: 1.9 }, female: { mean: 15.2, sd: 2.0 } },
    "41-65": { male: { mean: 16.5, sd: 2.1 }, female: { mean: 16.2, sd: 2.0 } },
    ">65": { male: { mean: 16.9, sd: 2.4 }, female: { mean: 17.0, sd: 2.0 } },
  },
};

// Display names and report wording for each segment.
const SEGMENTS = {
  SOV: { label: "SOV", noun: "sinuses of Valsalva", verb: "are" },
  STJ: { label: "STJ", noun: "sinotubular junction", verb: "is" },
  AAO: { label: "AAO", noun: "proximal ascending aorta", verb: "is" },
  RCOR: { label: "RCOR", noun: "right coronary sinus (sinus-to-commissure)", verb: "is" },
  LCOR: { label: "LCOR", noun: "left coronary sinus (sinus-to-commissure)", verb: "is" },
  NONCOR: { label: "NONCOR", noun: "non-coronary sinus (sinus-to-commissure)", verb: "is" },
};
