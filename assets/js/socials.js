/* Fremantle Rebels social generator – Step 1 (Fixture / Result / Info / Dinner)
   Live canvas preview + PNG export + state sync with Step 2. */
(function () {
  "use strict";

  var DATA = window.REBELS_DATA;
  var CLUB_RE = /Rebels|Mariners/;

  var $ = function (id) { return document.getElementById(id); };
  var el = {
    // Post type buttons
    typeFixture: $("typeFixture"), typeResult: $("typeResult"),
    typeInfo: $("typeInfo"), typeDinner: $("typeDinner"),

    // Control containers
    matchControls: $("matchControls"), infoControls: $("infoControls"), dinnerControls: $("dinnerControls"),

    // Fixture / Result controls
    category: $("category"), grade: $("grade"), team: $("team"), round: $("round"), fixture: $("fixture"),
    scoreBox: $("scoreBox"), homeScore: $("homeScore"), awayScore: $("awayScore"),
    homeLabel: $("homeLabel"), awayLabel: $("awayLabel"), nextGame: $("nextGame"),

    // Info controls
    infoTag: $("infoTag"), infoTitle: $("infoTitle"), infoSubtitle: $("infoSubtitle"),
    infoLine1: $("infoLine1"), infoLine2: $("infoLine2"), infoLine3: $("infoLine3"), infoLine4: $("infoLine4"),
    infoFooter: $("infoFooter"),
    btnPresetTraining: $("btnPresetTraining"), btnPresetNotice: $("btnPresetNotice"), btnPresetRain: $("btnPresetRain"),

    // Dinner controls
    dinnerTag: $("dinnerTag"), dinnerTitle: $("dinnerTitle"), dinnerSubtitle: $("dinnerSubtitle"),
    dinnerItem1: $("dinnerItem1"), dinnerItem2: $("dinnerItem2"), dinnerItem3: $("dinnerItem3"),
    dinnerDeadline: $("dinnerDeadline"), dinnerOrderInfo: $("dinnerOrderInfo"),

    // Workspace & actions
    summary: $("summary"), canvas: $("postCanvas"), download: $("download"),
    status: $("status"), saveDraft: $("saveDraft"), next: $("next")
  };

  var saved = RebelsPost.loadDraft();
  var state = { type: saved.type || "fixture" };

  // ---------- Helpers ----------
  function fill(select, items, selected) {
    select.innerHTML = "";
    items.forEach(function (it) {
      var o = document.createElement("option");
      o.value = it.value; o.textContent = it.label;
      select.appendChild(o);
    });
    if (selected != null && items.some(function (i) { return String(i.value) === String(selected); })) select.value = selected;
  }
  function uniq(arr) { return arr.filter(function (v, i) { return arr.indexOf(v) === i; }); }
  function parseDate(f) { return new Date(f.date + "T" + f.time + ":00"); }
  function fmtDay(f) {
    return parseDate(f).toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" }).toUpperCase();
  }
  function fmtShortDay(f) {
    return parseDate(f).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" });
  }
  function fmtTime(f) {
    var p = f.time.split(":"), h = +p[0];
    return (h % 12 || 12) + ":" + p[1] + " " + (h >= 12 ? "PM" : "AM");
  }
  function current() {
    var id = +el.fixture.value;
    return DATA.fixtures.filter(function (f) { return f.id === id; })[0] || null;
  }
  function comp() {
    return DATA.competitions.filter(function (c) { return c.category === el.category.value && c.grade === el.grade.value; })[0];
  }
  function setStatus(msg, bad) { el.status.textContent = msg || ""; el.status.style.color = bad ? "#ff8a8a" : ""; }

  // ---------- Cascading selects for Match mode ----------
  function loadCategories(sel) {
    fill(el.category, uniq(DATA.competitions.map(function (c) { return c.category; })).map(function (c) { return { value: c, label: c }; }), sel);
  }
  function loadGrades(sel) {
    var grades = DATA.competitions.filter(function (c) { return c.category === el.category.value; });
    fill(el.grade, grades.map(function (c) { return { value: c.grade, label: c.grade }; }), sel);
  }
  function loadTeams(sel) {
    var c = comp();
    fill(el.team, c.teams.slice().sort(function (a, b) { return (CLUB_RE.test(b) - CLUB_RE.test(a)) || a.localeCompare(b); })
      .map(function (t) { return { value: t, label: t + (CLUB_RE.test(t) ? " ★" : "") }; }), sel || c.clubTeams[0]);
  }
  function teamFixtures() {
    return DATA.fixtures.filter(function (f) {
      return f.category === el.category.value && f.grade === el.grade.value && (f.home === el.team.value || f.away === el.team.value);
    });
  }
  function loadRounds(sel) {
    var fx = teamFixtures();
    fill(el.round, fx.map(function (f) { return { value: f.round, label: "Round " + f.round + " · " + fmtShortDay(f) }; }), sel);
  }
  function loadFixtures(sel) {
    var fx = teamFixtures().filter(function (f) { return String(f.round) === el.round.value; });
    fill(el.fixture, fx.map(function (f) { return { value: f.id, label: f.home + " v " + f.away }; }), sel);
  }

  function cascade(from, s) {
    s = s || {};
    if (from <= 0) loadCategories(s.category);
    if (from <= 1) loadGrades(s.grade);
    if (from <= 2) loadTeams(s.team);
    if (from <= 3) loadRounds(s.round || nextRoundFor());
    if (from <= 4) loadFixtures(s.fixture);
    sync();
  }
  function nextRoundFor() {
    var now = new Date();
    var up = teamFixtures().filter(function (f) { return parseDate(f) >= now; })[0];
    return up ? up.round : null;
  }

  // ---------- Data Gathering for Info & Dinner ----------
  function getInfoData() {
    return {
      tag: el.infoTag.value,
      title: el.infoTitle.value,
      subtitle: el.infoSubtitle.value,
      line1: el.infoLine1.value,
      line2: el.infoLine2.value,
      line3: el.infoLine3.value,
      line4: el.infoLine4.value,
      footer: el.infoFooter.value
    };
  }
  function populateInfo(d) {
    el.infoTag.value = d.tag || "";
    el.infoTitle.value = d.title || "";
    el.infoSubtitle.value = d.subtitle || "";
    el.infoLine1.value = d.line1 || "";
    el.infoLine2.value = d.line2 || "";
    el.infoLine3.value = d.line3 || "";
    el.infoLine4.value = d.line4 || "";
    el.infoFooter.value = d.footer || "";
  }

  function getDinnerData() {
    return {
      tag: el.dinnerTag.value,
      title: el.dinnerTitle.value,
      subtitle: el.dinnerSubtitle.value,
      item1: el.dinnerItem1.value,
      item2: el.dinnerItem2.value,
      item3: el.dinnerItem3.value,
      deadline: el.dinnerDeadline.value,
      orderInfo: el.dinnerOrderInfo.value
    };
  }
  function populateDinner(d) {
    el.dinnerTag.value = d.tag || "";
    el.dinnerTitle.value = d.title || "";
    el.dinnerSubtitle.value = d.subtitle || "";
    el.dinnerItem1.value = d.item1 || "";
    el.dinnerItem2.value = d.item2 || "";
    el.dinnerItem3.value = d.item3 || "";
    el.dinnerDeadline.value = d.deadline || "";
    el.dinnerOrderInfo.value = d.orderInfo || "";
  }

  // ---------- State Sync & Rendering ----------
  function sync() {
    var t = state.type;
    var isMatch = t === "fixture" || t === "result";

    el.matchControls.hidden = !isMatch;
    el.infoControls.hidden = t !== "info";
    el.dinnerControls.hidden = t !== "dinner";
    el.scoreBox.hidden = t !== "result";

    var f = isMatch ? current() : null;
    el.download.disabled = isMatch ? !f : false;

    if (f && t === "result") {
      el.homeLabel.textContent = f.home; el.awayLabel.textContent = f.away;
      if (document.activeElement !== el.homeScore && document.activeElement !== el.awayScore) {
        el.homeScore.value = f.homeScore == null ? "" : f.homeScore;
        el.awayScore.value = f.awayScore == null ? "" : f.awayScore;
      }
    }

    renderSummary(f);
    draw();
  }

  function renderSummary(f) {
    var rows = [];
    if (state.type === "fixture") {
      rows.push(["Post", "Fixture"]);
      if (f) rows.push(["Competition", f.category + " · " + f.grade], ["Round", "Round " + f.round],
        ["Match", f.home + " v " + f.away], ["When", fmtShortDay(f) + " · " + fmtTime(f)], ["Venue", f.venue]);
    } else if (state.type === "result") {
      rows.push(["Post", "Result"]);
      if (f) {
        var sc = (f.homeScore != null && f.awayScore != null) ? " (" + f.homeScore + " – " + f.awayScore + ")" : "";
        rows.push(["Competition", f.category + " · " + f.grade], ["Round", "Round " + f.round],
          ["Match", f.home + " v " + f.away + sc], ["Venue", f.venue]);
      }
    } else if (state.type === "info") {
      rows.push(["Post", "Club Info Notice"]);
      rows.push(["Headline", el.infoTitle.value || "Announcement"]);
      rows.push(["Tag", el.infoTag.value || "Notice"]);
    } else if (state.type === "dinner") {
      rows.push(["Post", "Dinner Order"]);
      rows.push(["Event", el.dinnerTitle.value || "Club Dinner"]);
      rows.push(["Deadline", el.dinnerDeadline.value || "Wednesday"]);
    }

    el.summary.innerHTML = rows.map(function (r) {
      return "<dt>" + r[0] + "</dt><dd>" + r[1].replace(/</g, "&lt;") + "</dd>";
    }).join("");
  }

  function draw() {
    var f = (state.type === "fixture" || state.type === "result") ? current() : null;
    var opts = Object.assign({}, saved.design, {
      type: state.type,
      info: getInfoData(),
      dinner: getDinnerData()
    });
    RebelsPost.render(el.canvas, f, opts);
  }
  RebelsPost.onImages(draw);

  // ---------- Mode Switching ----------
  function setType(t) {
    state.type = t;
    el.typeFixture.classList.toggle("active", t === "fixture"); el.typeFixture.setAttribute("aria-pressed", t === "fixture");
    el.typeResult.classList.toggle("active", t === "result"); el.typeResult.setAttribute("aria-pressed", t === "result");
    el.typeInfo.classList.toggle("active", t === "info"); el.typeInfo.setAttribute("aria-pressed", t === "info");
    el.typeDinner.classList.toggle("active", t === "dinner"); el.typeDinner.setAttribute("aria-pressed", t === "dinner");
    var accentEl = $("step1Accent");
    if (accentEl) {
      accentEl.textContent = t === "fixture" ? "Fixture" : (t === "result" ? "Result" : (t === "info" ? "Notice" : "Dinner Order"));
    }
    sync();
  }
  el.typeFixture.addEventListener("click", function () { setType("fixture"); });
  el.typeResult.addEventListener("click", function () { setType("result"); });
  el.typeInfo.addEventListener("click", function () { setType("info"); });
  el.typeDinner.addEventListener("click", function () { setType("dinner"); });

  // ---------- Fixture Event Handlers ----------
  el.category.addEventListener("change", function () { cascade(1); });
  el.grade.addEventListener("change", function () { cascade(2); });
  el.team.addEventListener("change", function () { cascade(3); });
  el.round.addEventListener("change", function () { cascade(4); });
  el.fixture.addEventListener("change", sync);

  function onScore() {
    var f = current(); if (!f) return;
    f.homeScore = el.homeScore.value === "" ? null : +el.homeScore.value;
    f.awayScore = el.awayScore.value === "" ? null : +el.awayScore.value;
    renderSummary(f); draw();
  }
  el.homeScore.addEventListener("input", onScore);
  el.awayScore.addEventListener("input", onScore);

  el.nextGame.addEventListener("click", function () {
    var r = nextRoundFor();
    if (r == null) { setStatus("No upcoming games found for this team.", true); return; }
    loadRounds(r); loadFixtures(); sync(); setStatus("");
  });

  // ---------- Info & Dinner Live Inputs ----------
  [el.infoTag, el.infoTitle, el.infoSubtitle, el.infoLine1, el.infoLine2, el.infoLine3, el.infoLine4, el.infoFooter].forEach(function (inp) {
    inp.addEventListener("input", function () { renderSummary(); draw(); });
  });

  [el.dinnerTag, el.dinnerTitle, el.dinnerSubtitle, el.dinnerItem1, el.dinnerItem2, el.dinnerItem3, el.dinnerDeadline, el.dinnerOrderInfo].forEach(function (inp) {
    inp.addEventListener("input", function () { renderSummary(); draw(); });
  });

  // Info Presets
  el.btnPresetTraining.addEventListener("click", function () {
    populateInfo({
      tag: "TRAINING NOTICE",
      title: "PRE-SEASON TRAINING",
      subtitle: "ALL SENIORS & JUNIORS WELCOME",
      line1: "Tuesday & Thursday from 5:30 PM",
      line2: "Shirley Strickland Reserve, Ardross",
      line3: "Bring cleats, glove & full gear",
      line4: "New players arrive 15 mins early to register",
      footer: "FREMANTLEREBELS.COM.AU"
    });
    sync();
  });

  el.btnPresetNotice.addEventListener("click", function () {
    populateInfo({
      tag: "CLUB ANNOUNCEMENT",
      title: "PRESENTATION NIGHT",
      subtitle: "CELEBRATING OUR 2026 SEASON",
      line1: "Saturday 18 April from 6:30 PM",
      line2: "Fremantle Sailing Club, Marine Terrace",
      line3: "Tickets $65 per person (dinner included)",
      line4: "Dress code: Cocktail / Smart Casual",
      footer: "TICKETS: FREMANTLEREBELS.COM.AU/AWARDS"
    });
    sync();
  });

  el.btnPresetRain.addEventListener("click", function () {
    populateInfo({
      tag: "WEATHER UPDATE",
      title: "GAMES POSTPONED TODAY",
      subtitle: "WET WEATHER CANCELLATION NOTICE",
      line1: "Council ground closure due to heavy rain",
      line2: "All SEMSA junior and senior matches cancelled",
      line3: "Rescheduled fixture dates communicated via coaches",
      line4: "Clubrooms open from 4 PM for members",
      footer: "FREMANTLEREBELS.COM.AU"
    });
    sync();
  });

  // ---------- Persistence & Navigation ----------
  function persist() {
    var f = current();
    var d = RebelsPost.loadDraft();
    Object.assign(d, {
      type: state.type,
      category: el.category.value,
      grade: el.grade.value,
      team: el.team.value,
      round: el.round.value,
      fixture: el.fixture.value,
      fixtureId: f ? f.id : null,
      homeScore: f && f.homeScore,
      awayScore: f && f.awayScore,
      info: getInfoData(),
      dinner: getDinnerData()
    });
    return RebelsPost.saveDraft(d);
  }

  el.saveDraft.addEventListener("click", function () {
    var ok = persist();
    setStatus(ok ? "Draft saved." : "Could not save draft in this browser.", !ok);
  });

  el.next.addEventListener("click", function () {
    if (persist()) window.location.href = "socials-design.html";
    else setStatus("Could not save draft in this browser.", true);
  });

  el.download.addEventListener("click", function () {
    draw();
    try {
      el.canvas.toBlob(function (blob) {
        if (!blob) { setStatus("Export failed.", true); return; }
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        var f = current();
        var fname = "rebels-" + state.type;
        if (f && (state.type === "fixture" || state.type === "result")) {
          fname += "-" + f.grade + "-r" + f.round + "-" + f.home + "-v-" + f.away;
        } else if (state.type === "info") {
          fname += "-" + (el.infoTitle.value || "notice");
        } else if (state.type === "dinner") {
          fname += "-" + (el.dinnerTitle.value || "order");
        }
        a.download = fname.toLowerCase().replace(/[^a-z0-9]+/g, "-") + ".png";
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
        setStatus("Downloaded " + a.download);
      }, "image/png");
    } catch (e) {
      setStatus("Download blocked. Please run via localhost web server.", true);
    }
  });

  // ---------- Boot ----------
  function boot() {
    populateInfo(saved.info);
    populateDinner(saved.dinner);
    cascade(0, saved);
    var f = current();
    if (f && saved.homeScore != null) { f.homeScore = saved.homeScore; f.awayScore = saved.awayScore; }
    setType(saved.type || "fixture");
  }
  boot();
  RebelsPost.fontsReady().then(draw);
})();
