// data.js
// This file contains the start and end dates for modern Japanese eras.
// All dates are in the Gregorian calendar.
// The 'eras' array is sorted in reverse chronological order (newest first).
// This order is important for the conversion logic in script.js, which iterates
// through this array to find the most recent matching era for a given Western year.

const eras = [
  {
    name: "Reiwa",
    kanji: "令和",
    // Started on the accession of Emperor Naruhito.
    start: { year: 2019, month: 5, day: 1 },
    end: null // ongoing
  },
  {
    name: "Heisei",
    kanji: "平成",
    // Started the day after Emperor Showa's death, ended on Emperor Akihito's abdication.
    start: { year: 1989, month: 1, day: 8 },
    end: { year: 2019, month: 4, day: 30 }
  },
  {
    name: "Showa",
    kanji: "昭和",
    // Started on the accession of Emperor Showa (Hirohito), ended on his death.
    start: { year: 1926, month: 12, day: 25 },
    end: { year: 1989, month: 1, day: 7 }
  },
  {
    name: "Taisho",
    kanji: "大正",
    // Started on the accession of Emperor Taisho, ended on his death.
    start: { year: 1912, month: 7, day: 30 },
    end: { year: 1926, month: 12, day: 24 }
  },
  {
    name: "Meiji",
    kanji: "明治",
    // Started with the Meiji Restoration, ended on Emperor Meiji's death.
    start: { year: 1868, month: 1, day: 25 },
    end: { year: 1912, month: 7, day: 29 }
  }
];