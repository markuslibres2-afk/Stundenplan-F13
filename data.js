/* Unterrichtsangaben aus der bestehenden Stundenplan-App, unverändert übernommen. */
window.STUNDENPLAN = Object.freeze({
  startDate: "2026-09-24",
  endDate: "2027-09-05",
  // Wiener Ferientermine 2026/27; BPT laut Angabe der Klasse.
  periods: Object.freeze([
    { start: "2026-10-26", end: "2026-10-26", title: "Nationalfeiertag", kind: "holiday", note: "Schulfrei" },
    { start: "2026-10-27", end: "2026-10-31", title: "Herbstferien", kind: "holiday", note: "Ferien in Wien" },
    { start: "2026-11-02", end: "2026-11-02", title: "Allerseelen", kind: "holiday", note: "Schulfrei" },
    { start: "2026-11-16", end: "2026-11-20", title: "Berufspraktische Tage", kind: "bpt", note: "BPT · 16.–20. November" },
    { start: "2026-12-08", end: "2026-12-08", title: "Mariä Empfängnis", kind: "holiday", note: "Schulfrei" },
    { start: "2026-12-24", end: "2027-01-06", title: "Weihnachtsferien", kind: "holiday", note: "Ferien in Wien" },
    { start: "2027-02-01", end: "2027-02-06", title: "Semesterferien", kind: "holiday", note: "Ferien in Wien" },
    { start: "2027-03-20", end: "2027-03-29", title: "Osterferien", kind: "holiday", note: "Ferien in Wien" },
    { start: "2027-05-06", end: "2027-05-06", title: "Christi Himmelfahrt", kind: "holiday", note: "Schulfrei" },
    { start: "2027-05-15", end: "2027-05-17", title: "Pfingstferien", kind: "holiday", note: "Ferien in Wien" },
    { start: "2027-05-27", end: "2027-05-27", title: "Fronleichnam", kind: "holiday", note: "Schulfrei" },
    { start: "2027-07-03", end: "2027-09-05", title: "Sommerferien", kind: "holiday", note: "Ferien in Wien" }
  ]),
  assessments: Object.freeze([
    { date: "2026-11-05", subject: "Englisch", title: "Schularbeit Englisch", icon: "english" },
    { date: "2026-11-12", subject: "Mathematik", title: "Schularbeit Mathematik", icon: "math" },
    { date: "2026-12-17", subject: "Englisch", title: "Schularbeit Englisch", icon: "english" },
    { date: "2027-01-14", subject: "Mathematik", title: "Schularbeit Mathematik", icon: "math" },
    { date: "2027-02-25", subject: "Englisch", title: "Schularbeit Englisch", icon: "english" },
    { date: "2027-05-20", subject: "Englisch", title: "Schularbeit Englisch", icon: "english" }
  ]),
  weekdays: Object.freeze({
    1: Object.freeze([
      ["08:00", "08:50", "M"],
      ["09:00", "09:50", "D"],
      ["10:05", "10:55", "PBW"],
      ["11:05", "11:55", "E"],
      ["12:05", "12:55", "IKF"],
      ["14:00", "14:50", "BUS"],
      ["14:55", "15:45", "BUS"]
    ]),
    2: Object.freeze([
      ["08:00", "17:35", "PRAXISTAG", "practice"]
    ]),
    3: Object.freeze([
      ["08:00", "08:50", "D"],
      ["09:00", "09:50", "M"],
      ["10:05", "10:55", "BOL"],
      ["11:05", "11:55", "PBW"],
      ["12:05", "12:55", "ISB"],
      ["13:00", "13:50", "BF – D, M, E"]
    ]),
    4: Object.freeze([
      ["08:00", "08:50", "IKF"],
      ["09:00", "09:50", "M"],
      ["10:05", "10:55", "E"],
      ["11:05", "11:55", "BOL"],
      ["12:05", "12:55", "D"]
    ]),
    5: Object.freeze([
      ["08:00", "08:50", "X"],
      ["09:00", "09:50", "ISB"],
      ["10:05", "10:55", "E"],
      ["11:05", "11:55", "DGB"],
      ["12:05", "12:55", "PBW"]
    ])
  })
});

