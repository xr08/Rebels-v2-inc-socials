(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var key = "rebels.player-card.v1", side = "front", photo = null, logo = new Image();
  var defaults = { design: "vintage", palette: "rebels", primary: "#044229", accent: "#ffcd00", name: "PLAYER NAME", team: "FREMANTLE REBELS", number: "07", position: "PITCHER", season: "2026", cardNumber: "01", zoom: 100, posX: 50, posY: 50, bio: "", stats: "", fact: "", coach: "", photo: null };
  var batting = [["battingAverage", "Batting Average"], ["ops", "OPS"], ["homeRuns", "Home Runs"], ["rbi", "RBI"], ["walks", "Walks"], ["battingStrikeouts", "Strikeouts"]];
  var pitching = [["wins", "Wins"], ["losses", "Losses"], ["era", "ERA"], ["pitchingStrikeouts", "Strikeouts"]];
  batting.concat(pitching).forEach(function (stat) { defaults[stat[0]] = ""; });
  defaults.showPitching = false;
  var state = Object.assign({}, defaults);
  try { Object.assign(state, JSON.parse(localStorage.getItem(key) || "null")); } catch (e) { /* Start fresh if storage is unavailable. */ }
  var palettes = { rebels: ["#044229", "#ffcd00"], navy: ["#152c50", "#dc493e"], teal: ["#086b70", "#ff846d"], purple: ["#4b286c", "#efc34e"] };
  var canvas = $("cardCanvas"), ctx = canvas.getContext("2d");
  function field(box, id, label, max, multiline) {
    var wrap = document.createElement("div"); wrap.className = box === "playerFields" ? (id === "name" || id === "team" ? "col-12" : "col-6") : "mb-3";
    var lab = document.createElement("label"); lab.htmlFor = id; lab.className = "form-label"; lab.textContent = label;
    var input = document.createElement(multiline ? "textarea" : "input"); input.id = id; input.className = "form-control"; input.maxLength = max;
    if (multiline) input.rows = 3; else input.type = "text";
    wrap.append(lab, input); $(box).appendChild(wrap);
  }
  [["name", "Player name", 48], ["team", "Team", 48], ["number", "Jersey number", 4], ["position", "Position", 30], ["season", "Season", 12], ["cardNumber", "Card number", 8]].forEach(function (f) { field("playerFields", f[0], f[1], f[2]); });
  var backBox = $("backFields");
  function statFields(title, list, id) {
    var group = document.createElement("fieldset"); group.id = id; group.className = "mb-3";
    var legend = document.createElement("legend"); legend.className = "fs-6"; legend.textContent = title; group.appendChild(legend); backBox.appendChild(group);
    list.forEach(function (stat) {
      field(id, stat[0], stat[1], 10);
      var input = $(stat[0]); input.type = "number"; input.min = "0"; input.step = stat[0] === "battingAverage" || stat[0] === "ops" || stat[0] === "era" ? "0.001" : "1"; input.placeholder = "___";
    });
  }
  statFields("Season stats", batting, "battingFields");
  var toggleLabel = document.createElement("label"); toggleLabel.className = "form-check-label mb-3";
  var toggle = document.createElement("input"); toggle.type = "checkbox"; toggle.id = "showPitching"; toggle.className = "form-check-input me-2"; toggle.checked = !!state.showPitching;
  toggleLabel.append(toggle, document.createTextNode("Include pitching stats")); backBox.appendChild(toggleLabel);
  statFields("Pitching stats", pitching, "pitchingFields"); $("pitchingFields").hidden = !state.showPitching;
  [["bio", "Player bio (optional)", 220], ["fact", "Fun fact / walk-up song (optional)", 140], ["coach", "Coach notes (optional)", 180]].forEach(function (f) { field("backFields", f[0], f[1], f[2], true); });
  [["zoom", "Photo zoom", 100, 250], ["posX", "Photo horizontal position", 0, 100], ["posY", "Photo vertical position", 0, 100]].forEach(function (f) {
    var label = document.createElement("label"); label.htmlFor = f[0]; label.className = "form-label d-block"; label.textContent = f[1];
    var range = document.createElement("input"); range.type = "range"; range.id = f[0]; range.min = f[2]; range.max = f[3]; $("cropControls").append(label, range);
  });
  Object.keys(defaults).forEach(function (id) { if (id !== "photo" && $(id)) $(id).value = state[id]; });
  function rect(x, y, w, h, colour) { ctx.fillStyle = colour; ctx.fillRect(x, y, w, h); }
  function text(value, x, y, size, colour, max, align, serif) {
    value = String(value || ""); ctx.textAlign = align || "left"; ctx.textBaseline = "alphabetic";
    do { ctx.font = "700 " + size + "px " + (serif ? "'Roboto Slab', Georgia, serif" : "Oswald, sans-serif"); if (ctx.measureText(value).width <= max || size <= 10) break; size--; } while (size > 10);
    ctx.fillStyle = colour; ctx.fillText(value, x, y);
  }
  function crest(x, y, size) {
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, size / 2 + 8, 0, Math.PI * 2); ctx.fillStyle = "#fffaf0"; ctx.fill();
    if (logo.complete && logo.naturalWidth) { var h = size * logo.height / logo.width; ctx.drawImage(logo, x - size / 2, y - h / 2, size, h); }
    ctx.restore();
  }
  function image(x, y, w, h) {
    rect(x, y, w, h, state.primary);
    if (!photo) { text("YOUR PLAYER HERE", x + w / 2, y + h / 2, 36, "#fffaf0", w - 60, "center"); text("UPLOAD A PHOTO TO BEGIN", x + w / 2, y + h / 2 + 42, 18, "#fffaf0", w - 60, "center"); return; }
    var scale = Math.max(w / photo.width, h / photo.height) * Number(state.zoom) / 100, iw = photo.width * scale, ih = photo.height * scale;
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.drawImage(photo, x - (iw - w) * state.posX / 100, y - (ih - h) * state.posY / 100, iw, ih); ctx.restore();
  }
  function paragraph(value, x, y, width, colour, limit) {
    ctx.font = "500 22px Inter, sans-serif"; ctx.fillStyle = colour; ctx.textAlign = "left";
    var lines = [], line = "";
    String(value).split(/\s+/).forEach(function (word) { if (ctx.measureText(line + word).width > width && line) { lines.push(line.trim()); line = ""; } line += word + " "; }); if (line.trim()) lines.push(line.trim());
    lines.slice(0, limit).forEach(function (l, i) { if (i === limit - 1 && lines.length > limit) l = l.slice(0, -3) + "…"; ctx.fillText(l, x, y + i * 31, width); });
    return y + Math.min(lines.length, limit) * 31;
  }
  function render(targetSide) {
    var back = (targetSide || side) === "back", vintage = state.design === "vintage", ink = state.primary, accent = state.accent, paper = "#fff5df";
    ctx.clearRect(0, 0, 750, 1050); rect(0, 0, 750, 1050, vintage ? paper : ink);
    ctx.strokeStyle = vintage ? ink : accent; ctx.lineWidth = 3; ctx.strokeRect(24, 24, 702, 1002);
    if (back) {
      rect(44, 44, 662, 962, paper); rect(44, 44, 662, 150, ink);
      text((state.name || "[PLAYER NAME]").toUpperCase(), 70, 112, 45, paper, 520); text(state.position.toUpperCase() + (state.number ? " / #" + state.number : ""), 70, 159, 25, paper, 510); crest(650, 113, 60);
      var y = 222;
      function statTable(title, list) {
        rect(72, y, 606, 34, ink); text(title, 86, y + 25, 23, paper, 560); y += 34;
        list.forEach(function (stat, index) {
          if (index % 2 === 0) rect(72, y, 606, 31, "rgba(0,0,0,0.045)");
          text(stat[1], 86, y + 23, 21, ink, 440);
          text(state[stat[0]] === "" ? "___" : state[stat[0]], 664, y + 23, 22, ink, 120, "right");
          y += 31;
        });
        ctx.strokeStyle = ink; ctx.lineWidth = 1; ctx.strokeRect(72, y - list.length * 31, 606, list.length * 31); y += 16;
      }
      statTable("SEASON STATS", batting);
      if (state.showPitching) statTable("PITCHING STATS", pitching);
      [["PLAYER PROFILE", state.bio], ["OFF THE DIAMOND", state.fact], ["COACH'S NOTES", state.coach]].forEach(function (section) {
        if (!section[1].trim()) return;
        text(section[0], 72, y + 20, 20, ink, 600); y += 46;
        y = paragraph(section[1], 72, y, 606, ink, state.showPitching ? 1 : 3); y += 15;
      });
      rect(72, 918, 606, 2, ink); text(state.team.toUpperCase(), 72, 957, 24, ink, 460); text(state.season + " · No. " + state.cardNumber, 678, 984, 18, ink, 590, "right");
    } else if (vintage) {
      text(state.team.toUpperCase(), 63, 91, 35, ink, 530, "left", true); text(state.season, 687, 90, 24, ink, 100, "right");
      rect(48, 118, 654, 718, ink); image(56, 126, 638, 702);
      ctx.save(); ctx.translate(375, 840); ctx.rotate(-0.045); rect(-329, -22, 658, 102, ink); rect(-329, 80, 658, 8, accent); text(state.name.toUpperCase(), 0, 48, 56, paper, 585, "center"); ctx.restore();
      crest(114, 969, 66); text(state.position.toUpperCase(), 177, 972, 30, ink, 400); text(state.number ? "#" + state.number : "", 675, 983, 46, ink, 100, "right");
    } else {
      image(44, 44, 662, 786);
      var gradient = ctx.createLinearGradient(0, 650, 0, 870); gradient.addColorStop(0, "transparent"); gradient.addColorStop(1, ink); ctx.fillStyle = gradient; ctx.fillRect(44, 650, 662, 220);
      ctx.save(); ctx.beginPath(); ctx.rect(44, 44, 662, 962); ctx.clip(); ctx.strokeStyle = accent; ctx.lineWidth = 18; [0, 33, 66].forEach(function (offset) { ctx.beginPath(); ctx.moveTo(550 + offset, 1050); ctx.lineTo(800 + offset, 800); ctx.stroke(); }); ctx.restore();
      rect(64, 65, 105, 40, accent); text(state.season, 116, 94, 24, "#151515", 93, "center"); crest(644, 106, 66);
      text(state.name.toUpperCase(), 67, 870, 64, "#ffffff", 614); rect(67, 898, 88, 7, accent); text(state.position.toUpperCase(), 67, 947, 28, "#ffffff", 500); text(state.team.toUpperCase(), 67, 987, 22, "#ffffff", 490); text(state.number ? "#" + state.number : "", 681, 980, 57, "#ffffff", 106, "right");
    }
    canvas.setAttribute("aria-label", state.name + " player card " + (back ? "back" : "front") + " preview");
  }
  $("cardForm").addEventListener("submit", function (e) { e.preventDefault(); });
  $("cardForm").addEventListener("input", function (e) {
    var id = e.target.id; if (id === "photo" || !(id in defaults)) return; state[id] = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    if (id === "showPitching") $("pitchingFields").hidden = !state.showPitching;
    if (id === "palette" && palettes[state.palette]) { state.primary = palettes[state.palette][0]; state.accent = palettes[state.palette][1]; $("primary").value = state.primary; $("accent").value = state.accent; }
    if (id === "primary" || id === "accent") { state.palette = "custom"; $("palette").value = "custom"; }
    render();
  });
  document.querySelectorAll("[data-side]").forEach(function (button) { button.addEventListener("click", function () { side = button.dataset.side; document.querySelectorAll("[data-side]").forEach(function (b) { b.classList.toggle("active", b === button); b.setAttribute("aria-pressed", b === button ? "true" : "false"); }); render(); }); });
  function status(message) { $("cardStatus").textContent = message; }
  var photoVersion = 0;
  function loadPhoto(src, version) { var img = new Image(); img.onload = function () { if (version !== photoVersion) return; photo = img; state.photo = src; render(); }; img.onerror = function () { if (version === photoVersion) status("Could not open that image. Try a JPEG, PNG or WebP photo."); }; img.src = src; }
  $("photo").addEventListener("change", function () {
    var file = this.files[0]; if (!file) return; var version = ++photoVersion;
    if (!file.type.startsWith("image/")) { status("Please choose an image file."); return; }
    if (file.size > 15 * 1024 * 1024) { status("Please choose a photo smaller than 15 MB."); return; }
    var reader = new FileReader(); reader.onerror = function () { status("Could not read that photo."); }; reader.onload = function () { if (version !== photoVersion) return; state.zoom = 100; state.posX = state.posY = 50; ["zoom", "posX", "posY"].forEach(function (id) { $(id).value = state[id]; }); loadPhoto(reader.result, version); }; reader.readAsDataURL(file);
  });
  $("removePhoto").addEventListener("click", function () { photoVersion++; photo = null; state.photo = null; $("photo").value = ""; render(); });
  $("saveCard").addEventListener("click", function () { try { localStorage.setItem(key, JSON.stringify(state)); status("Player card draft saved in this browser."); } catch (e) { status("Draft could not be saved. Try a smaller photo, or download your cards now."); } });
  async function download(which) {
    if (document.fonts) await document.fonts.ready;
    render(which); var output = document.createElement("canvas"); output.width = 750; output.height = 1050; output.getContext("2d").drawImage(canvas, 0, 0); render();
    output.toBlob(function (blob) { if (!blob) { status("Export failed. Please try again."); return; } var url = URL.createObjectURL(blob), a = document.createElement("a"); a.href = url; a.download = (state.name.replace(/[^a-z0-9]+/gi, "-") || "player") + "-" + state.design + "-" + which + ".png"; a.click(); setTimeout(function () { URL.revokeObjectURL(url); }, 1000); status("Downloaded " + which + " · 750 × 1050 px."); }, "image/png");
  }
  $("downloadFront").addEventListener("click", function () { download("front"); }); $("downloadBack").addEventListener("click", function () { download("back"); });
  logo.onload = function () { render(); }; logo.src = "assets/images/rebels-logo.png";
  if (state.photo) loadPhoto(state.photo, photoVersion);
  render(); if (document.fonts) document.fonts.ready.then(function () { render(); });
})();
