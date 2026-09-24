/* Unterrichtsangaben aus der bestehenden Stundenplan-App, unverändert übernommen. */
window.STUNDENPLAN = Object.freeze({
  startDate: "2026-09-24",
  endDate: "2027-07-02",
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

