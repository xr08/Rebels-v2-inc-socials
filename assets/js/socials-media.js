/* Step 3 – choose background photo, upload custom images and adjust framing. Reads/writes shared draft. */
(function () {
  "use strict";

  var R = window.RebelsPost;
  var draft = R.loadDraft();
  var fixture = R.fixtureFromDraft(draft);
  var d = draft.design;
  var m = draft.media;

  var $ = function (id) { return document.getElementById(id); };
  var canvas = $("postCanvas"), status = $("status");

  var isCustom = draft.type === "info" || draft.type === "dinner";
  if (!fixture && !isCustom) { window.location.replace("socials.html"); return; }

  function opts(over) {
    return Object.assign({}, d, {
      type: draft.type,
      info: draft.info,
      dinner: draft.dinner,
      media: m
    }, over || {});
  }

  // ----- Presets Grid -----
  var presetBox = $("presets");
  R.PRESET_IMAGES.forEach(function (p) {
    var card = document.createElement("button");
    card.type = "button";
    card.className = "rb-media-card";
    card.dataset.id = p.id;
    card.setAttribute("role", "radio");

    if (p.id === "none") {
      card.innerHTML = '<div class="rb-media-thumb thumb-none">NO PHOTO</div>' +
                       '<span class="title">' + p.name + '</span>' +
                       '<span class="sub">' + p.note + '</span>';
    } else {
      card.innerHTML = '<img class="rb-media-thumb" src="' + p.src + '" alt="' + p.name + '">' +
                       '<span class="title">' + p.name + '</span>' +
                       '<span class="sub">' + p.note + '</span>';
    }

    card.addEventListener("click", function () {
      m.preset = p.id;
      refresh();
    });
    presetBox.appendChild(card);
  });

  // ----- Custom Photo Upload & Dropzone -----
  var dropzone = $("dropzone");
  var photoFile = $("photoFile");
  var clearPhoto = $("clearPhoto");
  var dropTitle = $("dropTitle");
  var dropHint = $("dropHint");

  dropzone.addEventListener("click", function (e) {
    if (e.target === clearPhoto) return;
    photoFile.click();
  });

  dropzone.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      photoFile.click();
    }
  });

  dropzone.addEventListener("dragover", function (e) {
    e.preventDefault();
    dropzone.classList.add("dragover");
  });

  dropzone.addEventListener("dragleave", function () {
    dropzone.classList.remove("dragover");
  });

  dropzone.addEventListener("drop", function (e) {
    e.preventDefault();
    dropzone.classList.remove("dragover");
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  photoFile.addEventListener("change", function () {
    if (photoFile.files && photoFile.files[0]) {
      handleFile(photoFile.files[0]);
    }
  });

  function handleFile(file) {
    if (!file.type.match(/^image\//)) {
      status.textContent = "Please select a valid image file (PNG, JPG, WebP).";
      return;
    }
    var reader = new FileReader();
    reader.onload = function (evt) {
      var dataUrl = evt.target.result;
      m.customDataUrl = dataUrl;
      m.preset = "custom";
      R.setCustomBg(dataUrl, function () {
        refresh();
      });
    };
    reader.readAsDataURL(file);
  }

  clearPhoto.addEventListener("click", function (e) {
    e.stopPropagation();
    m.customDataUrl = null;
    m.preset = "players3";
    R.setCustomBg(null, function () {
      refresh();
    });
  });

  // ----- Sliders & Framing Controls -----
  var rangeOverlay = $("rangeOverlay");
  var rangeZoom = $("rangeZoom");
  var rangePosX = $("rangePosX");
  var rangePosY = $("rangePosY");
  var resetFraming = $("resetFraming");

  function syncSliderInputs() {
    rangeOverlay.value = m.overlay != null ? m.overlay : 75;
    $("valOverlay").textContent = rangeOverlay.value + "%";

    rangeZoom.value = m.zoom != null ? m.zoom : 100;
    $("valZoom").textContent = rangeZoom.value + "%";

    rangePosX.value = m.posX != null ? m.posX : 50;
    $("valPosX").textContent = rangePosX.value + "%";

    rangePosY.value = m.posY != null ? m.posY : 50;
    $("valPosY").textContent = rangePosY.value + "%";
  }

  rangeOverlay.addEventListener("input", function () {
    m.overlay = +rangeOverlay.value;
    $("valOverlay").textContent = m.overlay + "%";
    R.render(canvas, fixture, opts());
  });

  rangeZoom.addEventListener("input", function () {
    m.zoom = +rangeZoom.value;
    $("valZoom").textContent = m.zoom + "%";
    R.render(canvas, fixture, opts());
  });

  rangePosX.addEventListener("input", function () {
    m.posX = +rangePosX.value;
    $("valPosX").textContent = m.posX + "%";
    R.render(canvas, fixture, opts());
  });

  rangePosY.addEventListener("input", function () {
    m.posY = +rangePosY.value;
    $("valPosY").textContent = m.posY + "%";
    R.render(canvas, fixture, opts());
  });

  resetFraming.addEventListener("click", function () {
    m.overlay = 75;
    m.zoom = 100;
    m.posX = 50;
    m.posY = 50;
    syncSliderInputs();
    refresh();
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
    $("sizeHint").textContent = "1080 \u00d7 " + curFmt.h + " \u00b7 updates live";
  }

  // ----- Refresh UI -----
  function refresh() {
    syncSliderInputs();

    // Preset cards active state
    Array.prototype.forEach.call(presetBox.querySelectorAll(".rb-media-card"), function (card) {
      var active = card.dataset.id === m.preset;
      card.classList.toggle("active", active);
      card.setAttribute("aria-checked", active);
    });

    // Custom upload dropzone state
    if (m.customDataUrl) {
      dropTitle.textContent = "Custom Photo Active";
      dropHint.textContent = "Click or drag another image to replace";
      clearPhoto.classList.remove("d-none");
      if (m.preset === "custom") {
        dropzone.style.borderColor = "var(--rb-primary)";
        dropzone.style.background = "rgba(255, 205, 0, .08)";
      } else {
        dropzone.style.borderColor = "";
        dropzone.style.background = "";
      }
    } else {
      dropTitle.textContent = "Upload Match Photo";
      dropHint.textContent = "Drag & drop PNG, JPG or WebP (or click to browse)";
      clearPhoto.classList.add("d-none");
      dropzone.style.borderColor = "";
      dropzone.style.background = "";
    }

    // Framing controls dimming if no photo
    var photoControls = $("photoControls");
    if (m.preset === "none") {
      photoControls.style.opacity = ".35";
      photoControls.style.pointerEvents = "none";
    } else {
      photoControls.style.opacity = "1";
      photoControls.style.pointerEvents = "auto";
    }

    summary();
    R.render(canvas, fixture, opts());
  }

  function persist() {
    draft.media = m;
    return R.saveDraft(draft);
  }

  $("saveDraft").addEventListener("click", function () {
    var ok = persist();
    status.textContent = ok ? "Draft saved." : "Could not save draft in this browser.";
  });

  $("next").addEventListener("click", function () {
    if (persist()) window.location.href = "socials-export.html";
  });

  $("back").addEventListener("click", function () {
    persist();
  });

  // Pre-load custom image into memory if already present in draft
  if (m.customDataUrl) {
    R.setCustomBg(m.customDataUrl, function () {
      refresh();
    });
  } else {
    refresh();
  }

  R.onImages(refresh);
  R.fontsReady().then(refresh);
})();
