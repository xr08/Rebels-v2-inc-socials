/* Step 2 – choose template, colours, format and team-name style. Reads/writes the shared draft. */
(function () {
  "use strict";

  var R = window.RebelsPost;
  var draft = R.loadDraft();
  var fixture = R.fixtureFromDraft(draft);
  var d = draft.design;
  var $ = function (id) { return document.getElementById(id); };
  var canvas = $("postCanvas"), status = $("status");

  var isCustom = draft.type === "info" || draft.type === "dinner";
  if (!fixture && !isCustom) { window.location.replace("socials.html"); return; }

  function opts(over) {
    return Object.assign({}, d, {
      type: draft.type,
      info: draft.info,
      dinner: draft.dinner,
      media: draft.media
    }, over || {});
  }

  // ----- Template Cards -----
  var tplBox = $("templates");
  var thumbs = {};
  R.TEMPLATES.forEach(function (t) {
    var col = document.createElement("div"); col.className = "col-6";
    var b = document.createElement("button");
    b.type = "button"; b.className = "rb-card-pick"; b.dataset.id = t.id; b.setAttribute("role", "radio");
    b.innerHTML = '<canvas aria-hidden="true"></canvas><span class="t"></span><span class="n"></span>';
    b.querySelector(".t").textContent = t.name; b.querySelector(".n").textContent = t.note;
    b.addEventListener("click", function () { d.template = t.id; refresh(); });
    thumbs[t.id] = b.querySelector("canvas");
    col.appendChild(b); tplBox.appendChild(col);
  });

  // If info or dinner, hide fixture-only template selector or label appropriately
  if (isCustom) {
    $("tplLabel").textContent = "Layout (Fixed for " + (draft.type === "dinner" ? "Dinner Order" : "Notice") + ")";
    tplBox.style.opacity = ".45";
    tplBox.style.pointerEvents = "none";
    $("names").parentElement.style.display = "none";
  }

  function segment(box, items, key) {
    box.innerHTML = "";
    items.forEach(function (it) {
      var b = document.createElement("button");
      b.type = "button"; b.dataset.v = it.id; b.setAttribute("role", "radio"); b.textContent = it.name;
      b.addEventListener("click", function () { d[key] = it.id; refresh(); });
      box.appendChild(b);
    });
  }
  segment($("variants"), R.VARIANTS, "variant");
  segment($("formats"), R.FORMATS, "format");
  Array.prototype.forEach.call($("names").children, function (b) {
    b.setAttribute("role", "radio");
    b.addEventListener("click", function () { d.nameFormat = b.dataset.v; refresh(); });
  });

  function mark(container, selector, value) {
    Array.prototype.forEach.call(container.querySelectorAll(selector), function (b) {
      var on = (b.dataset.id || b.dataset.v) === value;
      b.classList.toggle("active", on); b.setAttribute("aria-checked", on);
    });
  }

  function summary() {
    function name(list, id) { var m = list.filter(function (x) { return x.id === id; })[0]; return m ? m.name : id; }
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
      rows.push(["Layout", "Official Announcement"]);
    } else if (draft.type === "dinner") {
      rows.push(["Post", "Dinner Order"]);
      rows.push(["Event", draft.dinner ? draft.dinner.title : "Club Dinner"]);
      rows.push(["Layout", "Menu & Orders Board"]);
    }

    rows.push(["Colours", name(R.VARIANTS, d.variant)]);
    rows.push(["Format", name(R.FORMATS, d.format)]);
    if (!isCustom) rows.push(["Team names", d.nameFormat === "short" ? "Short" : "Full"]);

    $("summary").innerHTML = rows.map(function (r) {
      return "<dt>" + r[0] + "</dt><dd>" + r[1].replace(/</g, "&lt;") + "</dd>";
    }).join("");
    var curFmt = R.FORMATS.filter(function (f) { return f.id === d.format; })[0] || R.FORMATS[0];
    $("sizeHint").textContent = "1080 \u00d7 " + curFmt.h + " \u00b7 updates live";
  }

  function refresh() {
    R.render(canvas, fixture, opts());
    if (!isCustom) {
      R.TEMPLATES.forEach(function (t) { R.render(thumbs[t.id], fixture, opts({ template: t.id, format: "square" })); });
      mark(tplBox, ".rb-card-pick", d.template);
      mark($("names"), "button", d.nameFormat);
    }
    mark($("variants"), "button", d.variant);
    mark($("formats"), "button", d.format);
    summary();
  }

  function persist() { draft.design = d; return R.saveDraft(draft); }
  $("saveDraft").addEventListener("click", function () {
    var ok = persist();
    status.textContent = ok ? "Draft saved." : "Could not save draft in this browser.";
  });
  $("next").addEventListener("click", function () {
    if (persist()) window.location.href = "socials-media.html";
  });
  $("back").addEventListener("click", persist);

  refresh();
  R.onImages(refresh);
  R.fontsReady().then(refresh);
})();
