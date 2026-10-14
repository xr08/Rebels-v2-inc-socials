/* Step 4 – Caption generation and high-res image export. */
(function () {
  "use strict";

  var R = window.RebelsPost;
  var draft = R.loadDraft();
  var fixture = R.fixtureFromDraft(draft);
  var d = draft.design;
  var m = draft.media;

  var $ = function (id) { return document.getElementById(id); };
  var canvas = $("postCanvas"), status = $("status");
  var captionBox = $("captionBox");
  var copyNotice = $("copyNotice");

  var isCustom = draft.type === "info" || draft.type === "dinner";
  if (!fixture && !isCustom) { window.location.replace("socials.html"); return; }

  var currentStyle = "social";
  var includeTags = true;

  function opts(over) {
    return Object.assign({}, d, {
      type: draft.type,
      info: draft.info,
      dinner: draft.dinner,
      media: m
    }, over || {});
  }

  // ----- Caption Generation -----
  function generateCaption(style, withTags) {
    var lines = [];

    if (draft.type === "fixture" && fixture) {
      var dateStr = R.fmtDay(fixture);
      var timeStr = R.fmtTime(fixture);
      var venueStr = (fixture.venue || "Shirley Strickland Reserve") + (fixture.diamond ? " · " + fixture.diamond : "");

      if (style === "short") {
        return "⚾ MATCH DAY: " + fixture.home + " v " + fixture.away + " (" + fixture.grade + ", Rd " + fixture.round + ") — " + timeStr + " at " + venueStr;
      }

      if (style === "chat") {
        lines.push("⚾ GAME DAY REMINDER — ROUND " + fixture.round);
        lines.push(fixture.category + " (" + fixture.grade + ")");
        lines.push("⚔️ " + fixture.home + " vs " + fixture.away);
        lines.push("📅 " + dateStr);
        lines.push("⏰ " + timeStr);
        lines.push("📍 " + venueStr);
        lines.push("");
        lines.push("Please arrive 45 mins prior for warm-up. Up the Rebels! 🖤💛");
        return lines.join("\n");
      }

      // Default: Instagram / Facebook
      lines.push("MATCH DAY AT THE REBELS! ⚾🔥");
      lines.push("");
      lines.push("Our " + fixture.category + " (" + fixture.grade + ") squad take the diamond this week for Round " + fixture.round + "!");
      lines.push("");
      lines.push("⚔️ " + fixture.home + " vs " + fixture.away);
      lines.push("📅 " + dateStr);
      lines.push("⏰ " + timeStr);
      lines.push("📍 " + venueStr);
      lines.push("");
      lines.push("Come down, grab a coffee or cold drink, and support the black & gold! 🖤💛");

      if (withTags) {
        lines.push("");
        lines.push("#FremantleRebels #RebelsSoftball #SEMSASoftball #MatchDay #WAClubs #PerthSoftball #GameDay #Fastpitch #SoftballWA");
      }
      return lines.join("\n");
    }

    if (draft.type === "result" && fixture) {
      var homeSc = fixture.homeScore != null ? fixture.homeScore : 0;
      var awaySc = fixture.awayScore != null ? fixture.awayScore : 0;
      var isRebelsHome = R.CLUB_RE.test(fixture.home);
      var isRebelsAway = R.CLUB_RE.test(fixture.away);
      var rebelsScore = isRebelsHome ? homeSc : (isRebelsAway ? awaySc : homeSc);
      var oppScore = isRebelsHome ? awaySc : (isRebelsAway ? homeSc : awaySc);

      var outcomeTitle = "FINAL RESULT ⚾";
      var verdict = "Proud of the effort today! Onto the next round.";
      if (rebelsScore > oppScore) {
        outcomeTitle = "REBELS WIN! ⚾🔥";
        verdict = "Outstanding performance by our team to secure the win! Well played to both sides.";
      } else if (rebelsScore === oppScore) {
        outcomeTitle = "THRILLING DRAW! ⚾⚖️";
        verdict = "A hard-fought battle right down to the final inning!";
      }

      if (style === "short") {
        return "⚾ FINAL SCORE: " + fixture.home + " " + homeSc + " — " + awaySc + " " + fixture.away + " (" + fixture.grade + ", Rd " + fixture.round + ")";
      }

      if (style === "chat") {
        lines.push(outcomeTitle);
        lines.push(fixture.category + " (" + fixture.grade + ") · Round " + fixture.round);
        lines.push("Score: " + fixture.home + " " + homeSc + " — " + awaySc + " " + fixture.away);
        lines.push(verdict);
        return lines.join("\n");
      }

      lines.push(outcomeTitle);
      lines.push("");
      lines.push(fixture.category + " (" + fixture.grade + ") · Round " + fixture.round);
      lines.push("");
      lines.push("FINAL SCORE:");
      lines.push(fixture.home + " " + homeSc);
      lines.push(fixture.away + " " + awaySc);
      lines.push("");
      lines.push(verdict);

      if (withTags) {
        lines.push("");
        lines.push("#FremantleRebels #RebelsSoftball #MatchResults #SoftballWA #PerthSports #Fastpitch #SEMSASoftball");
      }
      return lines.join("\n");
    }

    if (draft.type === "info") {
      var inf = draft.info || {};
      if (style === "short") {
        return "📢 " + inf.tag + ": " + inf.title + " — " + inf.subtitle + ". See fremantlerebels.com.au for details.";
      }
      lines.push("📢 " + (inf.tag || "CLUB ANNOUNCEMENT"));
      lines.push("");
      lines.push((inf.title || "NOTICE").toUpperCase());
      if (inf.subtitle) lines.push(inf.subtitle);
      lines.push("");
      [inf.line1, inf.line2, inf.line3, inf.line4].filter(Boolean).forEach(function (l) {
        lines.push("• " + l);
      });
      lines.push("");
      lines.push("Visit fremantlerebels.com.au for full details and club updates! ⚾");
      if (withTags) {
        lines.push("");
        lines.push("#FremantleRebels #ClubUpdate #SoftballWA #RebelsFamily #PerthClubs");
      }
      return lines.join("\n");
    }

    if (draft.type === "dinner") {
      var dnr = draft.dinner || {};
      if (style === "short") {
        return "🍽️ " + dnr.title + " orders close " + (dnr.deadline || "Wednesday 5PM") + ". " + (dnr.orderInfo || "Order via Team App");
      }
      lines.push("🍽️ " + (dnr.tag || "CLUB DINNER"));
      lines.push("");
      lines.push((dnr.title || "THURSDAY NIGHT DINNER").toUpperCase());
      if (dnr.subtitle) lines.push(dnr.subtitle);
      lines.push("");
      lines.push("THIS WEEK'S MENU:");
      [dnr.item1, dnr.item2, dnr.item3].filter(Boolean).forEach(function (it) {
        lines.push("🍴 " + it);
      });
      lines.push("");
      lines.push("⏳ ORDERS CLOSE: " + (dnr.deadline || "Wednesday 5:00 PM"));
      lines.push("👉 " + (dnr.orderInfo || "Order via Team App or SMS"));
      lines.push("");
      lines.push("Enjoy great food and catch up with teammates at the clubrooms!");
      if (withTags) {
        lines.push("");
        lines.push("#FremantleRebels #ClubDinner #RebelsFamily #ShirleyStrickland #PerthSoftball");
      }
      return lines.join("\n");
    }

    return "";
  }

  function updateCaption() {
    captionBox.value = generateCaption(currentStyle, includeTags);
  }

  // ----- Platform Chips -----
  var chips = $("platformChips");
  Array.prototype.forEach.call(chips.querySelectorAll(".rb-chip"), function (chip) {
    chip.addEventListener("click", function () {
      Array.prototype.forEach.call(chips.querySelectorAll(".rb-chip"), function (c) { c.classList.remove("active"); });
      chip.classList.add("active");
      currentStyle = chip.dataset.style;
      updateCaption();
    });
  });

  // ----- Hashtags Toggle -----
  var btnToggleTags = $("btnToggleTags");
  btnToggleTags.addEventListener("click", function () {
    includeTags = !includeTags;
    btnToggleTags.textContent = "Hashtags: " + (includeTags ? "ON" : "OFF");
    btnToggleTags.classList.toggle("text-gold", includeTags);
    btnToggleTags.classList.toggle("text-secondary", !includeTags);
    updateCaption();
  });

  // ----- Copy to Clipboard -----
  function copyText(txt) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(showCopiedNotice);
    } else {
      captionBox.select();
      document.execCommand("copy");
      showCopiedNotice();
    }
  }

  function showCopiedNotice() {
    copyNotice.classList.add("show");
    setTimeout(function () {
      copyNotice.classList.remove("show");
    }, 2500);
  }

  $("copyCaptionBtn").addEventListener("click", function () {
    copyText(captionBox.value);
  });

  $("copyShortBtn").addEventListener("click", function () {
    var shortTxt = generateCaption("short", false);
    copyText(shortTxt);
  });

  // ----- Quick Format Switcher -----
  var qFormat = $("quickFormat");
  Array.prototype.forEach.call(qFormat.querySelectorAll("button"), function (b) {
    b.addEventListener("click", function () {
      d.format = b.dataset.v;
      refresh();
    });
  });

  // ----- Download High-Res PNG -----
  function getDownloadFilename() {
    var base = "rebels";
    if (draft.type === "fixture" && fixture) {
      base += "-fixture-rd" + fixture.round + "-" + (fixture.grade || "match").replace(/[^a-z0-9]/gi, "").toLowerCase();
    } else if (draft.type === "result" && fixture) {
      base += "-result-rd" + fixture.round + "-" + (fixture.grade || "match").replace(/[^a-z0-9]/gi, "").toLowerCase();
    } else if (draft.type === "info") {
      base += "-announcement";
    } else if (draft.type === "dinner") {
      base += "-dinner-menu";
    }
    return base + "-" + (d.format === "portrait" ? "portrait" : "square") + ".png";
  }

  $("downloadBtn").addEventListener("click", function () {
    var filename = getDownloadFilename();
    if (canvas.toBlob) {
      canvas.toBlob(function (blob) {
        if (!blob) return;
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
        status.textContent = "Downloaded " + filename;
      }, "image/png");
    } else {
      var a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      status.textContent = "Downloaded " + filename;
    }
  });

  // ----- Selections Summary -----
  function summary() {
    function name(list, id) { var match = list.filter(function (x) { return x.id === id; })[0]; return match ? match.name : id; }
    var rows = [];
    if (draft.type === "fixture" || draft.type === "result") {
      rows.push(["Post", draft.type === "result" ? "Result" : "Fixture"]);
      if (fixture) {
        rows.push(["Match", fixture.home + " v " + fixture.away]);
        rows.push(["When", R.fmtShortDay(fixture) + " \u00b7 " + R.fmtTime(fixture)]);
      }
      rows.push(["Template", name(R.TEMPLATES, d.template)]);
    } else if (draft.type === "info") {
      rows.push(["Post", "Club Info Notice"]);
      rows.push(["Headline", draft.info ? draft.info.title : "Notice"]);
    } else if (draft.type === "dinner") {
      rows.push(["Post", "Dinner Order"]);
      rows.push(["Event", draft.dinner ? draft.dinner.title : "Club Dinner"]);
    }

    rows.push(["Colours", name(R.VARIANTS, d.variant)]);
    rows.push(["Format", name(R.FORMATS, d.format)]);

    var mediaLabel = "Match Action";
    if (m.preset === "custom") mediaLabel = "Custom Photo";
    else if (m.preset === "none") mediaLabel = "No Photo (Graphic)";
    else {
      var foundPreset = R.PRESET_IMAGES.filter(function (p) { return p.id === m.preset; })[0];
      if (foundPreset) mediaLabel = foundPreset.name;
    }
    rows.push(["Background", mediaLabel]);

    $("summary").innerHTML = rows.map(function (r) {
      return "<dt>" + r[0] + "</dt><dd>" + r[1].replace(/</g, "&lt;") + "</dd>";
    }).join("");

    var curFmt = R.FORMATS.filter(function (f) { return f.id === d.format; })[0] || R.FORMATS[0];
    $("sizeHint").textContent = "1080 \u00d7 " + curFmt.h + " · High Resolution PNG";
    $("downloadBtnText").textContent = "Download " + (d.format === "portrait" ? "Portrait (1080×1350)" : "Square (1080×1080)") + " PNG";

    Array.prototype.forEach.call(qFormat.querySelectorAll("button"), function (b) {
      b.classList.toggle("active", b.dataset.v === d.format);
    });
  }

  function refresh() {
    summary();
    R.render(canvas, fixture, opts());
  }

  function persist() {
    draft.design = d;
    draft.media = m;
    return R.saveDraft(draft);
  }

  $("saveDraft").addEventListener("click", function () {
    var ok = persist();
    status.textContent = ok ? "Draft saved." : "Could not save draft in this browser.";
  });

  $("back").addEventListener("click", function () {
    persist();
  });

  // Pre-load custom image if present
  if (m.customDataUrl) {
    R.setCustomBg(m.customDataUrl, function () {
      refresh();
    });
  } else {
    refresh();
  }

  updateCaption();
  R.onImages(refresh);
  R.fontsReady().then(refresh);
})();
