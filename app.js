(() => {
  "use strict";

  const DATA = window.STUNDENPLAN;
  if (!DATA) return;

  const WEEKDAYS = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
  const SHORT_DAYS = ["SO", "MO", "DI", "MI", "DO", "FR", "SA"];
  const MONTHS = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
  const TYPE_LABELS = { normal: "Unterricht", practice: "Praxistag", cancelled: "Entfallen", substitution: "Vertretung", changed: "Geändert", free: "Frei" };
  const STORAGE = { dark: "stundenplan-f13-dark", startToday: "stundenplan-f13-start-today" };
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const parseDate = (key) => {
    const [year, month, day] = key.split("-").map(Number);
    return new Date(year, month - 1, day);
  };
  const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const copyDate = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const sameDate = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const formatDate = (date) => `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()}`;
  const formatWeekDate = (date) => `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.`;
  const formatFullDate = (date) => `${WEEKDAYS[date.getDay()]}, ${date.getDate()}. ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
  const firstOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
  const inRange = (date) => dateKey(date) >= DATA.startDate && dateKey(date) <= DATA.endDate;
  const clampDate = (date) => {
    const key = dateKey(date);
    if (key < DATA.startDate) return parseDate(DATA.startDate);
    if (key > DATA.endDate) return parseDate(DATA.endDate);
    return copyDate(date);
  };
  const mondayOf = (date) => {
    const result = copyDate(date);
    const offset = (result.getDay() + 6) % 7;
    result.setDate(result.getDate() - offset);
    return result;
  };
  const minutesOf = (time) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  const readBoolean = (key, fallback) => {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : value === "true";
    } catch (_) { return fallback; }
  };
  const saveValue = (key, value) => {
    try { localStorage.setItem(key, String(value)); } catch (_) { /* Preferences are optional. */ }
  };

  let today = copyDate(new Date());
  const startOnToday = readBoolean(STORAGE.startToday, false);
  const state = {
    selectedDate: clampDate(today),
    calendarMonth: firstOfMonth(clampDate(today)),
    view: startOnToday ? "today" : "schedule",
    dark: readBoolean(STORAGE.dark, false),
    installPrompt: null,
    toastTimer: null
  };
  if (!["today", "schedule", "calendar", "more"].includes(state.view)) state.view = "schedule";

  function lessonsFor(date) {
    if (!inRange(date)) return [];
    const rows = DATA.weekdays[date.getDay()] || [];
    return rows.map(([start, end, subject, legacyType]) => {
      const type = legacyType === "practice" ? "practice" : "normal";
      return { start, end, subject, type, teacher: "", room: "", status: TYPE_LABELS[type] };
    });
  }

  function currentLessonIndex(lessons, date, now = new Date()) {
    if (!sameDate(date, now)) return -1;
    const minutes = now.getHours() * 60 + now.getMinutes();
    return lessons.findIndex((lesson) => minutes >= minutesOf(lesson.start) && minutes < minutesOf(lesson.end));
  }

  function renderLessonCard(lesson, date, index, now = new Date()) {
    const currentIndex = currentLessonIndex(lessonsFor(date), date, now);
    const isCurrent = currentIndex === index;
    const minutes = now.getHours() * 60 + now.getMinutes();
    const duration = Math.max(1, minutesOf(lesson.end) - minutesOf(lesson.start));
    const progress = isCurrent ? Math.max(0, Math.min(100, ((minutes - minutesOf(lesson.start)) / duration) * 100)) : 0;
    const remaining = isCurrent ? Math.max(0, minutesOf(lesson.end) - minutes) : 0;
    const durationText = duration === 1 ? "1 Minute" : `${duration} Minuten`;
    const meta = lesson.teacher || lesson.room ? `${lesson.teacher ? `Lehrkraft ${escapeHtml(lesson.teacher)}` : ""}${lesson.teacher && lesson.room ? " · " : ""}${lesson.room ? `Raum ${escapeHtml(lesson.room)}` : ""}` : lesson.type === "practice" ? "Praxistag" : `${TYPE_LABELS[lesson.type] || "Unterricht"} · ${durationText}`;
    const mark = lesson.type === "practice" ? "PR" : lesson.type === "cancelled" ? "—" : lesson.type === "free" ? "F" : escapeHtml(lesson.subject.slice(0, 2).toUpperCase());
    return `<div class="lesson-row" style="animation-delay:${Math.min(index * 24, 120)}ms">
      <div class="lesson-time"><strong>${escapeHtml(lesson.start)}</strong><span>${escapeHtml(lesson.end)}</span></div>
      <button class="lesson-card type-${escapeHtml(lesson.type)}${isCurrent ? " is-current" : ""}" type="button" data-lesson-index="${index}" aria-label="${escapeHtml(lesson.subject)}, ${escapeHtml(lesson.start)} bis ${escapeHtml(lesson.end)}${isCurrent ? ", gerade aktuell" : ""}">
        <span class="lesson-mark" aria-hidden="true">${mark}</span>
        <span class="lesson-copy"><span class="lesson-subject">${escapeHtml(lesson.subject)}</span><span class="lesson-meta">${meta}</span>${isCurrent ? `<span class="current-progress"><span>Noch ${remaining} Min.</span><span class="progress-track"><span class="progress-fill" style="width:${progress}%"></span></span></span>` : ""}</span>
        <svg class="icon lesson-arrow" aria-hidden="true"><use href="#i-chevron-right"/></svg>
      </button>
    </div>`;
  }

  function renderNowLine(now = new Date()) {
    return `<div class="now-row" aria-label="Aktuelle Uhrzeit"><span class="now-time">${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}</span><span class="now-line"></span></div>`;
  }

  function showEmpty(target, date, unavailable = false) {
    const inSchool = inRange(date);
    const heading = unavailable || !inSchool ? "Kein Stundenplan" : "Heute kein Unterricht";
    const message = unavailable || !inSchool ? "Der Stundenplan ist vom 24.09.2026 bis 02.07.2027 hinterlegt." : "Für diesen Tag ist kein Unterricht eingetragen.";
    target.innerHTML = `<div class="empty-state"><span class="empty-icon"><svg class="icon"><use href="#i-calendar"/></svg></span><div><strong>${heading}</strong><p>${message}</p></div></div>`;
  }

  function bindLessonButtons(root, date, lessons) {
    $$("[data-lesson-index]", root).forEach((button) => {
      button.addEventListener("click", () => openLesson(lessons[Number(button.dataset.lessonIndex)], date));
    });
  }

  function renderLessonList(target, date, { timeline = false } = {}) {
    const lessons = lessonsFor(date);
    if (!lessons.length) {
      showEmpty(target, date);
      return;
    }
    const now = new Date();
    const useTimeline = timeline && sameDate(date, now);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const lineIndex = useTimeline ? lessons.findIndex((lesson) => minutesOf(lesson.start) > nowMinutes) : -1;
    const currentIndex = currentLessonIndex(lessons, date, now);
    let markup = "";
    if (useTimeline && lineIndex === 0) markup += renderNowLine(now);
    lessons.forEach((lesson, index) => {
      markup += renderLessonCard(lesson, date, index, now);
      if (useTimeline && ((lineIndex === -1 && index === lessons.length - 1) || index === currentIndex)) markup += renderNowLine(now);
      else if (useTimeline && lineIndex === index + 1) markup += renderNowLine(now);
    });
    target.innerHTML = markup;
    bindLessonButtons(target, date, lessons);
  }

  function setView(view) {
    if (!["today", "schedule", "calendar", "more"].includes(view)) return;
    state.view = view;
    $$(".view").forEach((section) => { section.hidden = section.id !== `view-${view}`; });
    $$(".nav-item").forEach((button) => {
      const active = button.dataset.view === view;
      button.classList.toggle("active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderWeek() {
    const monday = mondayOf(state.selectedDate);
    const friday = new Date(monday);
    friday.setDate(friday.getDate() + 4);
    $("#weekLabel").textContent = `${formatWeekDate(monday)} – ${formatDate(friday)}`;
    $("#prevWeek").disabled = monday <= mondayOf(parseDate(DATA.startDate));
    $("#nextWeek").disabled = friday >= parseDate(DATA.endDate);
    const tabMarkup = [];
    for (let offset = 0; offset < 5; offset += 1) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + offset);
      const disabled = !inRange(date);
      const active = sameDate(date, state.selectedDate);
      const isToday = sameDate(date, today);
      tabMarkup.push(`<button class="day-tab${active ? " active" : ""}${isToday ? " today" : ""}" type="button" data-date="${dateKey(date)}"${disabled ? " disabled" : ""}${active ? ' aria-current="date"' : ""} aria-label="${formatFullDate(date)}${isToday ? ", heute" : ""}"><span class="day-name">${SHORT_DAYS[date.getDay()]}</span><span class="day-number">${date.getDate()}</span></button>`);
    }
    $("#dayTabs").innerHTML = tabMarkup.join("");
    $$(".day-tab", $("#dayTabs")).forEach((button) => button.addEventListener("click", () => selectDate(parseDate(button.dataset.date))));
    const lessons = lessonsFor(state.selectedDate);
    $("#selectedWeekday").textContent = WEEKDAYS[state.selectedDate.getDay()];
    $("#selectedDateLabel").textContent = `${state.selectedDate.getDate()}. ${MONTHS[state.selectedDate.getMonth()]}`;
    $("#selectedDateChip").textContent = formatDate(state.selectedDate);
    $("#daySummary").textContent = lessons.length ? `${lessons.length} ${lessons.length === 1 ? "Stunde" : "Stunden"} · ${lessons[0].start} – ${lessons[lessons.length - 1].end}` : "";
    renderLessonList($("#scheduleLessons"), state.selectedDate, { timeline: true });
  }

  function renderToday() {
    const current = new Date();
    const hour = current.getHours();
    const greeting = hour < 11 ? "Guten Morgen" : hour < 18 ? "Guten Tag" : "Guten Abend";
    $("#todayHeading").textContent = greeting;
    $("#greetingDate").textContent = new Intl.DateTimeFormat("de-AT", { weekday: "long", day: "numeric", month: "long" }).format(today);
    const lessons = lessonsFor(today);
    const minutes = current.getHours() * 60 + current.getMinutes();
    const activeIndex = currentLessonIndex(lessons, today, current);
    const nextIndex = activeIndex >= 0 ? activeIndex : lessons.findIndex((lesson) => minutes < minutesOf(lesson.start));
    const nextRoot = $("#nextLesson");
    if (!inRange(today)) {
      nextRoot.innerHTML = `<div class="empty-state"><span class="empty-icon"><svg class="icon"><use href="#i-calendar"/></svg></span><div><strong>Außerhalb des Stundenplans</strong><p>Die eingetragenen Daten reichen bis 02.07.2027.</p></div></div>`;
      $("#greetingSubtitle").textContent = "Der Stundenplanzeitraum ist noch nicht aktiv.";
    } else if (!lessons.length) {
      nextRoot.innerHTML = `<div class="empty-state"><span class="empty-icon"><svg class="icon"><use href="#i-check"/></svg></span><div><strong>Heute kein Unterricht</strong><p>Genieß den freien Tag.</p></div></div>`;
      $("#greetingSubtitle").textContent = "Heute steht kein Unterricht im Plan.";
    } else if (nextIndex < 0) {
      nextRoot.innerHTML = `<div class="empty-state"><span class="empty-icon"><svg class="icon"><use href="#i-check"/></svg></span><div><strong>Für heute geschafft</strong><p>Alle Stunden für heute sind vorbei.</p></div></div>`;
      $("#greetingSubtitle").textContent = "Du hast deinen Tag geschafft.";
    } else {
      const lesson = lessons[nextIndex];
      $("#greetingSubtitle").textContent = activeIndex >= 0 ? "Du bist gerade im Unterricht." : "Das steht als Nächstes an.";
      nextRoot.innerHTML = `<button class="next-card type-${lesson.type === "practice" ? "practice" : "normal"}" type="button" data-next-lesson="${nextIndex}"><span class="next-time"><strong>${lesson.start}</strong><span>${lesson.end}</span></span><span class="next-copy"><strong>${escapeHtml(lesson.subject)}</strong><small>${activeIndex >= 0 ? "Gerade jetzt" : "Heute"} · ${TYPE_LABELS[lesson.type] || "Unterricht"}</small></span><svg class="icon next-arrow"><use href="#i-chevron-right"/></svg></button>`;
      $("[data-next-lesson]", nextRoot).addEventListener("click", () => openLesson(lesson, today));
    }
    $("#todayCount").textContent = lessons.length;
    renderLessonList($("#todayLessons"), today, { timeline: true });
  }

  function renderCalendar() {
    const month = state.calendarMonth;
    $("#monthTitle").textContent = `${MONTHS[month.getMonth()]} ${month.getFullYear()}`;
    const first = firstOfMonth(month);
    const offset = (first.getDay() + 6) % 7;
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const slots = [];
    for (let i = 0; i < offset; i += 1) slots.push('<span class="calendar-blank" aria-hidden="true"></span>');
    for (let day = 1; day <= count; day += 1) {
      const date = new Date(month.getFullYear(), month.getMonth(), day);
      const hasLessons = lessonsFor(date).length > 0;
      const selected = sameDate(date, state.selectedDate);
      const isToday = sameDate(date, today);
      const disabled = !inRange(date);
      slots.push(`<button class="calendar-day${hasLessons ? " has-lessons" : ""}${selected ? " selected" : ""}${isToday ? " today" : ""}" type="button" role="gridcell" data-date="${dateKey(date)}"${disabled ? " disabled" : ""} aria-label="${formatFullDate(date)}${hasLessons ? ", Unterricht" : ""}${selected ? ", ausgewählt" : ""}">${day}</button>`);
    }
    $("#calendarGrid").innerHTML = slots.join("");
    $$(".calendar-day", $("#calendarGrid")).forEach((button) => {
      button.addEventListener("click", () => {
        selectDate(parseDate(button.dataset.date));
        setView("schedule");
      });
    });
    const monthIndex = month.getFullYear() * 12 + month.getMonth();
    const minMonth = parseDate(DATA.startDate).getFullYear() * 12 + parseDate(DATA.startDate).getMonth();
    const maxMonth = parseDate(DATA.endDate).getFullYear() * 12 + parseDate(DATA.endDate).getMonth();
    $("#prevMonth").disabled = monthIndex <= minMonth;
    $("#nextMonth").disabled = monthIndex >= maxMonth;
  }

  function renderSettings() {
    const darkSwitch = $("#darkModeSwitch");
    const startSwitch = $("#startTodaySwitch");
    darkSwitch.setAttribute("aria-checked", String(state.dark));
    startSwitch.setAttribute("aria-checked", String(readBoolean(STORAGE.startToday, false)));
    const status = $("#onlineStatus");
    const online = navigator.onLine;
    status.classList.toggle("is-offline", !online);
    $("span", status).textContent = online ? "Online" : "Offline";
  }

  function render() {
    document.documentElement.dataset.theme = state.dark ? "dark" : "light";
    $('meta[name="theme-color"]').setAttribute("content", state.dark ? "#101722" : "#f7f9fc");
    renderToday();
    renderWeek();
    renderCalendar();
    renderSettings();
  }

  function selectDate(date) {
    state.selectedDate = clampDate(date);
    state.calendarMonth = firstOfMonth(state.selectedDate);
    renderWeek();
    renderCalendar();
  }

  function changeSelectedDay(direction) {
    const next = copyDate(state.selectedDate);
    do { next.setDate(next.getDate() + direction); } while (next.getDay() === 0 || next.getDay() === 6);
    if (inRange(next)) selectDate(next);
  }

  function moveWeek(direction) {
    const next = copyDate(state.selectedDate);
    next.setDate(next.getDate() + direction * 7);
    selectDate(clampDate(next));
  }

  function openLesson(lesson, date) {
    if (!lesson) return;
    $("#dialogStatus").textContent = lesson.status || TYPE_LABELS[lesson.type] || "Unterricht";
    $("#dialogSubject").textContent = lesson.subject;
    $("#dialogDate").textContent = formatFullDate(date);
    $("#dialogStart").textContent = lesson.start;
    $("#dialogEnd").textContent = lesson.end;
    $("#dialogTeacher").textContent = lesson.teacher || "Nicht hinterlegt";
    $("#dialogRoom").textContent = lesson.room || "Nicht hinterlegt";
    $("#lessonDialog").showModal();
  }

  function openDatePicker() {
    const picker = $("#datePicker");
    picker.value = dateKey(state.selectedDate);
    try {
      if (typeof picker.showPicker === "function") picker.showPicker();
      else picker.click();
    } catch (_) { picker.click(); }
  }

  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("visible");
    window.clearTimeout(state.toastTimer);
    state.toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 2600);
  }

  function changeMonth(direction) {
    const next = new Date(state.calendarMonth.getFullYear(), state.calendarMonth.getMonth() + direction, 1);
    const min = firstOfMonth(parseDate(DATA.startDate));
    const max = firstOfMonth(parseDate(DATA.endDate));
    if (next < min || next > max) return;
    state.calendarMonth = next;
    renderCalendar();
  }

  function updateOnlineStatus() { renderSettings(); }

  $$(".nav-item").forEach((button) => button.addEventListener("click", () => setView(button.dataset.view)));
  $$('[data-go="schedule"]').forEach((button) => button.addEventListener("click", () => setView("schedule")));
  $("#prevWeek").addEventListener("click", () => moveWeek(-1));
  $("#nextWeek").addEventListener("click", () => moveWeek(1));
  $("#weekLabel").addEventListener("click", () => { selectDate(clampDate(today)); });
  $("#pickDate").addEventListener("click", openDatePicker);
  $("#quickCalendar").addEventListener("click", () => { setView("schedule"); openDatePicker(); });
  $("#quickToday").addEventListener("click", () => { selectDate(clampDate(today)); setView("today"); });
  $("#datePicker").addEventListener("change", (event) => {
    if (!event.target.value) return;
    selectDate(parseDate(event.target.value));
    if (state.view !== "schedule") setView("schedule");
  });
  $("#prevMonth").addEventListener("click", () => changeMonth(-1));
  $("#nextMonth").addEventListener("click", () => changeMonth(1));
  $("#calendarToday").addEventListener("click", () => { selectDate(clampDate(today)); state.calendarMonth = firstOfMonth(clampDate(today)); renderCalendar(); });
  $("#darkModeSwitch").addEventListener("click", () => {
    state.dark = !state.dark;
    saveValue(STORAGE.dark, state.dark);
    renderSettings();
    document.documentElement.dataset.theme = state.dark ? "dark" : "light";
    $('meta[name="theme-color"]').setAttribute("content", state.dark ? "#101722" : "#f7f9fc");
  });
  $("#startTodaySwitch").addEventListener("click", () => {
    const value = !readBoolean(STORAGE.startToday, false);
    saveValue(STORAGE.startToday, value);
    renderSettings();
    showToast(value ? "Beim nächsten Start öffnet sich Heute." : "Beim nächsten Start öffnet sich der Stundenplan.");
  });
  $("#closeDialog").addEventListener("click", () => $("#lessonDialog").close());
  $("#doneDialog").addEventListener("click", () => $("#lessonDialog").close());
  $("#lessonDialog").addEventListener("click", (event) => { if (event.target === $("#lessonDialog")) $("#lessonDialog").close(); });

  let swipeStart = null;
  const scheduleView = $("#view-schedule");
  scheduleView.addEventListener("touchstart", (event) => {
    if (event.touches.length === 1) swipeStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }, { passive: true });
  scheduleView.addEventListener("touchend", (event) => {
    if (!swipeStart || event.changedTouches.length !== 1) return;
    const dx = event.changedTouches[0].clientX - swipeStart.x;
    const dy = event.changedTouches[0].clientY - swipeStart.y;
    swipeStart = null;
    if (Math.abs(dx) > 62 && Math.abs(dx) > Math.abs(dy) * 1.3) changeSelectedDay(dx < 0 ? 1 : -1);
  }, { passive: true });

  window.addEventListener("online", updateOnlineStatus);
  window.addEventListener("offline", updateOnlineStatus);
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    state.installPrompt = event;
    $("#installCard").hidden = false;
  });
  $("#installButton").addEventListener("click", async () => {
    if (!state.installPrompt) return;
    state.installPrompt.prompt();
    try { await state.installPrompt.userChoice; } catch (_) { /* The prompt may be dismissed. */ }
    state.installPrompt = null;
    $("#installCard").hidden = true;
  });
  window.addEventListener("appinstalled", () => { $("#installCard").hidden = true; showToast("Stundenplan wurde installiert."); });

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register(new URL("./service-worker.js", document.baseURI)).catch(() => showToast("Offline-Speicherung konnte nicht gestartet werden."));
  }

  render();
  setView(state.view);
  window.setInterval(() => {
    const currentDate = copyDate(new Date());
    if (!sameDate(currentDate, today)) {
      today = currentDate;
      state.selectedDate = clampDate(today);
      state.calendarMonth = firstOfMonth(state.selectedDate);
      render();
      return;
    }
    if (state.view === "today") renderToday();
    else if (state.view === "schedule") renderWeek();
  }, 60_000);
})();

