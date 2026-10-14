/* Shared post renderer + draft storage for the Rebels social generator.
   Used by every step page so the preview is identical everywhere (and identical to the exported PNG). */
(function () {
  "use strict";

  var W = 1080;
  var CLUB_RE = /Rebels|Mariners/;
  var STORE = "rebels.social.draft";

  // ---------- registry ----------
  var TEMPLATES = [
    { id: "classic",    name: "Classic",    note: "Centred headline, stacked teams" },
    { id: "scoreboard", name: "Scoreboard", note: "Two crests, big score" },
    { id: "poster",     name: "Poster",     note: "Giant date, left aligned" },
    { id: "minimal",    name: "Minimal",    note: "Clean and quiet" }
  ];
  var VARIANTS = [
    { id: "green", name: "Rebels green" },
    { id: "gold",  name: "Gold" },
    { id: "cream", name: "Cream" }
  ];
  var FORMATS = [
    { id: "square",   name: "Square 1:1",    h: 1080 },
    { id: "portrait", name: "Portrait 4:5",  h: 1350 }
  ];
  var PALETTES = {
    green: { photo: true,  base: "#020c08", top: "rgba(2,12,8,.78)", mid: "rgba(2,28,18,.88)", bot: "rgba(2,12,8,.97)",
             glow: "rgba(253,205,0,.20)", text: "#ffffff", sub: "rgba(255,255,255,.75)", accent: "#ffcd00", club: "#ffcd00",
             rule: "#ffcd00", frame: "rgba(255,205,0,.55)", panel: "rgba(255,205,0,1)", panelText: "#04281b", shadow: true },
    gold:  { photo: false, base: "#ffcd00", top: "#ffd633", mid: "#ffcd00", bot: "#e0a800",
             glow: "rgba(255,255,255,.35)", text: "#04281b", sub: "rgba(4,40,27,.75)", accent: "#044229", club: "#044229",
             rule: "#044229", frame: "rgba(4,66,41,.6)", panel: "#044229", panelText: "#ffffff", shadow: false },
    cream: { photo: false, base: "#f5efe0", top: "#faf5e8", mid: "#f5efe0", bot: "#e8dfc8",
             glow: "rgba(29,106,79,.10)", text: "#0a3a2c", sub: "rgba(10,58,44,.7)", accent: "#1d6a4f", club: "#1d6a4f",
             rule: "#c8b47b", frame: "rgba(29,106,79,.45)", panel: "#0a3a2c", panelText: "#f5efe0", shadow: false }
  };

  // ---------- formatting ----------
  function parseDate(f) { return new Date(f.date + "T" + f.time + ":00"); }
  function fmtDay(f) { return parseDate(f).toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" }).toUpperCase(); }
  function fmtShortDay(f) { return parseDate(f).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" }); }
  function fmtTime(f) { var p = f.time.split(":"), h = +p[0]; return (h % 12 || 12) + ":" + p[1] + " " + (h >= 12 ? "PM" : "AM"); }
  function shortName(n) {
    var s = n.replace(/\([^)]*\)/g, "").trim().split(/\s+/);
    while (s.length > 1 && /^[A-C]\d?$/.test(s[s.length - 1])) s.pop();
    return s[s.length - 1];
  }
  function initials(n) {
    var s = n.replace(/\([^)]*\)/g, "").trim().split(/\s+/);
    while (s.length > 1 && /^[A-C]\d?$/.test(s[s.length - 1])) s.pop();
    return s.slice(-2).map(function (w) { return w[0]; }).join("").toUpperCase();
  }

  // ---------- images & media presets ----------
  var PRESET_IMAGES = [
    { id: "players3", name: "Match Action", note: "Team players on diamond", src: "assets/images/players3.jpg" },
    { id: "pitcher",  name: "Strikeout Pitcher", note: "Fastpitch pitcher motion", src: "assets/images/pitcher.jpg" },
    { id: "diamond",  name: "Ballpark Sunset", note: "Dusk diamond & gear", src: "assets/images/diamond.jpg" },
    { id: "none",     name: "No Photo", note: "Pure brand graphics", src: "" }
  ];

  var images = {}, listeners = [];
  function loadImg(key, src) {
    if (!src) return;
    var img = new Image();
    img.onload = function () { images[key] = img; listeners.forEach(function (fn) { fn(); }); };
    img.src = src;
  }
  loadImg("logo", "assets/images/rebels-logo.png");
  loadImg("bg_players3", "assets/images/players3.jpg");
  loadImg("bg_pitcher", "assets/images/pitcher.jpg");
  loadImg("bg_diamond", "assets/images/diamond.jpg");

  var customImage = null, customSrc = null;
  function setCustomBg(src, cb) {
    if (!src) { customImage = null; customSrc = null; if (cb) cb(); return; }
    var img = new Image();
    img.onload = function () {
      customImage = img;
      customSrc = src;
      if (cb) cb();
      listeners.forEach(function (fn) { fn(); });
    };
    img.src = src;
  }

  // ---------- drawing primitives ----------
  function Painter(ctx, o) {
    this.c = ctx; this.o = o; this.P = PALETTES[o.variant] || PALETTES.green;
    var fmt = FORMATS.filter(function (x) { return x.id === o.format; })[0] || FORMATS[0];
    this.H = fmt.h;
  }
  Painter.prototype.font = function (w, px, fam) { return w + " " + px + "px " + (fam || "Oswald") + ", sans-serif"; };
  Painter.prototype.text = function (t, x, y, px, o) {
    var c = this.c, P = this.P;
    o = o || {};
    var w = o.w || 700, maxW = o.max || W - 160;
    c.font = this.font(w, px, o.fam);
    if ("letterSpacing" in c) c.letterSpacing = (o.ls || 0) + "px";
    while (c.measureText(t).width > maxW && px > 18) { px -= 2; c.font = this.font(w, px, o.fam); }
    c.fillStyle = o.color || P.text;
    c.textAlign = o.align || "center";
    c.textBaseline = "alphabetic";
    if (o.shadow && P.shadow) { c.shadowColor = "rgba(0,0,0,.55)"; c.shadowBlur = 24; c.shadowOffsetY = 8; }
    c.fillText(t, x, y);
    c.shadowColor = "transparent"; c.shadowBlur = 0; c.shadowOffsetY = 0;
    return px;
  };
  Painter.prototype.rect = function (x, y, w, h, color) { this.c.fillStyle = color; this.c.fillRect(x, y, w, h); };
  Painter.prototype.logo = function (cx, y, size, alpha) {
    var img = images.logo; if (!img) return;
    var c = this.c, h = size * img.height / img.width;
    c.globalAlpha = alpha == null ? 1 : alpha;
    c.drawImage(img, cx - size / 2, y, size, h);
    c.globalAlpha = 1;
  };
  Painter.prototype.crest = function (name, cx, cy, r) {
    var c = this.c, P = this.P;
    if (CLUB_RE.test(name) && images.logo) {
      c.drawImage(images.logo, cx - r, cy - r * images.logo.height / images.logo.width, r * 2, r * 2 * images.logo.height / images.logo.width);
      return;
    }
    c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2);
    c.fillStyle = P.panel; c.fill();
    c.lineWidth = 6; c.strokeStyle = P.accent; c.stroke();
    this.text(initials(name), cx, cy + r * 0.28, r * 0.85, { color: P.panelText, max: r * 1.5 });
  };
  Painter.prototype.background = function () {
    var c = this.c, P = this.P, H = this.H, m = this.o.media || DEFAULT_MEDIA;
    c.fillStyle = P.base; c.fillRect(0, 0, W, H);

    // Resolve active background photo
    var activeImg = null;
    if (m.preset === "custom" && customImage) {
      activeImg = customImage;
    } else if (m.preset === "pitcher") {
      activeImg = images.bg_pitcher || images.bg_players3;
    } else if (m.preset === "diamond") {
      activeImg = images.bg_diamond || images.bg_players3;
    } else if (m.preset === "none") {
      activeImg = null;
    } else {
      activeImg = images.bg_players3;
    }

    if (P.photo && activeImg) {
      c.save();
      if (m.blur > 0 && "filter" in c) {
        c.filter = "blur(" + m.blur + "px)";
      }
      var zoom = Math.max(1, (m.zoom || 100) / 100);
      var baseScale = Math.max(W / activeImg.width, H / activeImg.height);
      var scale = baseScale * zoom;
      var iw = activeImg.width * scale;
      var ih = activeImg.height * scale;

      var posX = (m.posX != null ? m.posX : 50) / 100;
      var posY = (m.posY != null ? m.posY : 50) / 100;
      var extraX = iw - W;
      var extraY = ih - H;
      var ix = -extraX * posX;
      var iy = -extraY * posY;

      c.drawImage(activeImg, ix, iy, iw, ih);
      c.restore();
    } else if (!P.photo || !activeImg) {
      this.logo(W - 120, H - 560, 900, 0.07); // watermark crest
    }

    // Gradients and dark tint overlays
    var overlayAlpha = (m.overlay != null ? m.overlay : 75) / 100;
    var g = c.createLinearGradient(0, 0, 0, H);
    if (P.photo && activeImg) {
      g.addColorStop(0, "rgba(2,12,8," + Math.min(0.98, overlayAlpha * 0.90) + ")");
      g.addColorStop(0.5, "rgba(2,28,18," + Math.min(0.98, overlayAlpha) + ")");
      g.addColorStop(1, "rgba(2,12,8," + Math.min(0.99, overlayAlpha * 1.10) + ")");
      c.fillStyle = g; c.fillRect(0, 0, W, H);
    } else {
      g.addColorStop(0, P.top); g.addColorStop(.5, P.mid); g.addColorStop(1, P.bot);
      c.globalAlpha = .88; c.fillStyle = g; c.fillRect(0, 0, W, H); c.globalAlpha = 1;
    }

    var rg = c.createRadialGradient(W, 0, 0, W, 0, 700);
    rg.addColorStop(0, P.glow); rg.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = rg; c.fillRect(0, 0, W, H);
  };

  // ---------- templates (laid out in a 1080-tall box, centred vertically in the canvas) ----------
  function teamLabel(p, n) { return (p.o.nameFormat === "short" ? shortName(n) : n).toUpperCase(); }
  function kicker(f) { return f.category.toUpperCase() + " \u00b7 " + f.grade.toUpperCase() + " \u00b7 ROUND " + f.round; }

  var T = {};

  T.classic = function (p, f, st) {
    var P = p.P;
    p.c.strokeStyle = P.frame; p.c.lineWidth = 4; p.c.strokeRect(36, 36, W - 72, 1008);
    p.logo(W / 2, 70, 180);
    p.text(kicker(f), W / 2, 305, 32, { fam: "Roboto Slab", w: 500, color: P.accent, ls: 6 });

    if (st.result) {
      p.rect(W / 2 - 140, 345, 280, 48, P.panel);
      p.text("FULL TIME", W / 2, 380, 36, { color: P.panelText, ls: 6 });
    } else {
      p.rect(W / 2 - 60, 345, 120, 3, P.rule);
    }

    var y1 = st.score ? 490 : 475;
    var y2 = st.score ? 660 : 680;
    var club1 = CLUB_RE.test(f.home), club2 = CLUB_RE.test(f.away);
    var sc = st.score ? 200 : 0;
    p.text(teamLabel(p, f.home), st.score ? 100 : W / 2, y1, 80, {
      align: st.score ? "left" : "center", color: club1 ? P.club : P.text, max: W - 200 - sc, ls: 2, shadow: true });
    if (st.score) p.text(String(f.homeScore), W - 100, y1 + 8, 125, { align: "right", color: club1 ? P.club : P.text, max: 180, shadow: true });

    if (!st.score) {
      p.text("VS", W / 2, 575, 46, { fam: "Roboto Slab", w: 500, color: P.accent, ls: 8 });
    } else {
      p.rect(100, 565, W - 200, 2, "rgba(255,255,255,.15)");
    }

    p.text(teamLabel(p, f.away), st.score ? 100 : W / 2, y2, 80, {
      align: st.score ? "left" : "center", color: club2 ? P.club : P.text, max: W - 200 - sc, ls: 2, shadow: true });
    if (st.score) p.text(String(f.awayScore), W - 100, y2 + 8, 125, { align: "right", color: club2 ? P.club : P.text, max: 180, shadow: true });

    p.rect(100, 790, W - 200, 4, P.rule);
    p.text(fmtDay(f), W / 2, 870, 54, { ls: 3 });
    p.text(fmtTime(f) + "  \u00b7  " + f.field.toUpperCase(), W / 2, 930, 40, { color: P.accent, ls: 3 });
    p.text(f.venue.toUpperCase(), W / 2, 985, 30, { w: 500, color: P.sub, ls: 3 });
  };

  T.scoreboard = function (p, f, st) {
    var P = p.P, c = p.c;
    p.text("FREMANTLE REBELS", 90, 115, 28, { align: "left", ls: 5, color: P.accent, max: 380 });
    p.text(kicker(f), W - 90, 115, 22, { align: "right", fam: "Roboto Slab", w: 500, ls: 2, color: P.sub, max: 480 });
    p.rect(90, 140, W - 180, 3, P.rule);

    if (st.result) {
      p.rect(W / 2 - 120, 175, 240, 42, P.panel);
      p.text("FULL TIME", W / 2, 206, 32, { color: P.panelText, ls: 6 });
    }

    var cy = st.result ? 420 : 380, r = 135;
    p.crest(f.home, 240, cy, r); p.crest(f.away, W - 240, cy, r);
    if (st.score) {
      p.text(f.homeScore + " \u2013 " + f.awayScore, W / 2, cy + 45, 145, { max: 360, shadow: true });
    } else {
      p.text("VS", W / 2, cy + 28, 95, { color: P.accent, max: 200 });
    }
    p.text(teamLabel(p, f.home), 240, cy + r + 75, 46, { max: 420, color: CLUB_RE.test(f.home) ? P.club : P.text, ls: 1 });
    p.text(teamLabel(p, f.away), W - 240, cy + r + 75, 46, { max: 420, color: CLUB_RE.test(f.away) ? P.club : P.text, ls: 1 });

    // info panel
    c.fillStyle = P.panel; c.fillRect(0, 780, W, 300);
    p.text(fmtDay(f), W / 2, 860, 54, { color: P.panelText, ls: 3 });
    p.text(fmtTime(f) + "  \u00b7  " + f.field.toUpperCase(), W / 2, 925, 40, { color: P.panelText, ls: 3 });
    p.text(f.venue.toUpperCase(), W / 2, 980, 30, { w: 500, color: P.panelText, ls: 3 });
  };

  T.poster = function (p, f, st) {
    var P = p.P, d = parseDate(f), L = 110;
    p.rect(0, 0, 36, 1080, P.accent);
    p.logo(L + 70, 70, 140);
    p.text(kicker(f), L, 280, 30, { align: "left", fam: "Roboto Slab", w: 500, ls: 5, color: P.accent, max: W - L - 70 });
    var dayNum = String(d.getDate());
    p.text(dayNum, L - 6, 560, 330, { align: "left", shadow: true, max: 460 });
    p.text(d.toLocaleDateString("en-AU", { weekday: "long" }).toUpperCase(), L + 450, 440, 68, { align: "left", max: 420, ls: 3 });
    p.text(d.toLocaleDateString("en-AU", { month: "long" }).toUpperCase(), L + 450, 530, 68, { align: "left", color: P.accent, max: 420, ls: 3 });
    p.rect(L, 600, W - L - 70, 4, P.rule);
    [[f.home, f.homeScore], [f.away, f.awayScore]].forEach(function (r, i) {
      var y = 700 + i * 105, club = CLUB_RE.test(r[0]);
      p.text(teamLabel(p, r[0]), L, y, 68, { align: "left", color: club ? P.club : P.text, max: st.score ? 640 : W - L - 70, ls: 1 });
      if (st.score) p.text(String(r[1]), W - 70, y, 100, { align: "right", color: club ? P.club : P.text, max: 200 });
    });
    p.text(st.result ? "FULL TIME" : fmtTime(f) + "  \u00b7  " + f.field.toUpperCase(), L, 960, 44, { align: "left", color: P.accent, ls: 4 });
    p.text(f.venue.toUpperCase(), L, 1010, 28, { align: "left", w: 500, color: P.sub, ls: 3 });
  };

  T.minimal = function (p, f, st) {
    var P = p.P;
    p.logo(W / 2, 90, 130);
    p.text(kicker(f), W / 2, 300, 28, { fam: "Roboto Slab", w: 500, ls: 6, color: P.accent });
    p.rect(W / 2 - 40, 335, 80, 3, P.rule);
    var y = 470;
    [[f.home, f.homeScore], [f.away, f.awayScore]].forEach(function (r, i) {
      var club = CLUB_RE.test(r[0]);
      var label = teamLabel(p, r[0]) + (st.score ? "   " + r[1] : "");
      p.text(label, W / 2, y + i * 190 + (i ? 0 : 0), 84, { color: club ? P.club : P.text, ls: 2, max: W - 160 });
    });
    p.text(st.score ? "FULL TIME" : "V", W / 2, 565, st.score ? 30 : 56, { fam: "Roboto Slab", w: 500, color: P.accent, ls: 6 });
    p.text(fmtDay(f), W / 2, 830, 46, { ls: 3 });
    p.text(fmtTime(f) + "  \u00b7  " + f.field.toUpperCase(), W / 2, 890, 34, { color: P.accent, ls: 3 });
    p.text(f.venue.toUpperCase(), W / 2, 945, 26, { w: 500, color: P.sub, ls: 3 });
  };

  // ---------- CUSTOM POST RENDERERS (Info Notice & Dinner Orders) ----------
  function renderInfoPost(p, info) {
    var P = p.P;
    p.c.strokeStyle = P.frame; p.c.lineWidth = 4; p.c.strokeRect(36, 36, W - 72, 1008);
    p.logo(W / 2, 60, 150);

    // Tag / Kicker
    var tag = (info.tag || "CLUB NOTICE").toUpperCase();
    p.text(tag, W / 2, 260, 30, { fam: "Roboto Slab", w: 500, color: P.accent, ls: 6 });

    // Main Title
    var title = (info.title || "ANNOUNCEMENT").toUpperCase();
    p.text(title, W / 2, 360, 84, { shadow: true, ls: 3, max: W - 140 });

    // Subtitle
    if (info.subtitle) {
      p.text(info.subtitle.toUpperCase(), W / 2, 425, 34, { color: P.sub, ls: 3, max: W - 160 });
    }
    p.rect(W / 2 - 120, 460, 240, 4, P.rule);

    // Detail rows (lines 1 to 4)
    var lines = [info.line1, info.line2, info.line3, info.line4].filter(Boolean);
    var startY = lines.length <= 3 ? 550 : 520;
    var gap = lines.length <= 3 ? 88 : 74;

    lines.forEach(function (ln, i) {
      var y = startY + i * gap;
      // gold bullet pill
      p.c.beginPath();
      p.c.arc(140, y - 10, 10, 0, Math.PI * 2);
      p.c.fillStyle = P.accent;
      p.c.fill();
      p.text(ln, 175, y, lines.length <= 3 ? 42 : 36, { align: "left", max: W - 250, ls: 1, shadow: true });
    });

    // Footer info
    p.rect(100, 860, W - 200, 3, P.rule);
    var footer = (info.footer || "FREMANTLEREBELS.COM.AU").toUpperCase();
    p.text(footer, W / 2, 930, 36, { color: P.accent, ls: 5 });
    p.text("FREMANTLE REBELS SOFTBALL CLUB", W / 2, 980, 24, { w: 500, color: P.sub, ls: 4 });
  }

  function renderDinnerPost(p, dnr) {
    var P = p.P, c = p.c;
    p.c.strokeStyle = P.frame; p.c.lineWidth = 4; p.c.strokeRect(36, 36, W - 72, 1008);
    p.logo(W / 2, 55, 140);

    // Kicker
    var tag = (dnr.tag || "CLUB DINNER ORDER").toUpperCase();
    p.text(tag, W / 2, 240, 28, { fam: "Roboto Slab", w: 500, color: P.accent, ls: 6 });

    // Title
    var title = (dnr.title || "THURSDAY NIGHT DINNER").toUpperCase();
    p.text(title, W / 2, 335, 78, { shadow: true, ls: 3, max: W - 140 });

    // Subtitle / Venue
    if (dnr.subtitle) {
      p.text(dnr.subtitle.toUpperCase(), W / 2, 395, 30, { color: P.sub, ls: 2, max: W - 160 });
    }

    // Menu Card Panel
    var menuBoxY = 430;
    c.fillStyle = "rgba(0, 0, 0, .45)";
    c.fillRect(90, menuBoxY, W - 180, 300);
    c.strokeStyle = P.rule;
    c.lineWidth = 2;
    c.strokeRect(90, menuBoxY, W - 180, 300);

    // Menu Card Heading
    p.text("THIS WEEK'S MENU OPTIONS", W / 2, menuBoxY + 50, 30, { color: P.accent, ls: 4 });
    p.rect(W / 2 - 80, menuBoxY + 65, 160, 2, P.rule);

    var items = [dnr.item1, dnr.item2, dnr.item3].filter(Boolean);
    var itemStartY = menuBoxY + 125;
    items.forEach(function (it, i) {
      var y = itemStartY + i * 58;
      // Diamond icon
      p.c.fillStyle = P.accent;
      p.c.fillRect(130, y - 18, 12, 12);
      p.text(it, 165, y - 6, 36, { align: "left", max: W - 280, ls: 1 });
    });

    // Deadline banner
    var deadY = 760;
    c.fillStyle = P.panel;
    c.fillRect(90, deadY, W - 180, 68);
    var deadText = ("ORDERS CLOSE: " + (dnr.deadline || "WEDNESDAY 5:00 PM")).toUpperCase();
    p.text(deadText, W / 2, deadY + 46, 38, { color: P.panelText, ls: 4 });

    // Order instructions & footer
    var orderInfo = (dnr.orderInfo || "ORDER VIA TEAM APP OR AT THE CLUBROOMS").toUpperCase();
    p.text(orderInfo, W / 2, 885, 34, { color: P.accent, ls: 3, max: W - 140 });
    p.text("FREMANTLE REBELS SOFTBALL CLUB \u00b7 SHIRLEY STRICKLAND", W / 2, 940, 24, { w: 500, color: P.sub, ls: 3 });
  }

  // ---------- public render ----------
  function render(canvas, f, o) {
    o = o || {};
    var opts = { template: o.template || "classic", variant: o.variant || "green", format: o.format || "square",
                 nameFormat: o.nameFormat || "full", type: o.type || "fixture", media: o.media || DEFAULT_MEDIA };
    var p = new Painter(canvas.getContext("2d"), opts);
    canvas.width = W; canvas.height = p.H;
    p.c.clearRect(0, 0, W, p.H);
    p.background();

    p.c.save();
    p.c.translate(0, (p.H - 1080) / 2);

    if (opts.type === "info") {
      renderInfoPost(p, o.info || DEFAULT_INFO);
    } else if (opts.type === "dinner") {
      renderDinnerPost(p, o.dinner || DEFAULT_DINNER);
    } else {
      if (!f) {
        p.text("Choose a fixture", W / 2, 540, 80, { color: "rgba(255,255,255,.4)" });
      } else {
        var result = opts.type === "result";
        var st = { result: result, score: result && f.homeScore != null && f.awayScore != null };
        (T[opts.template] || T.classic)(p, f, st);
      }
    }

    p.c.restore();
  }

  function fontsReady() {
    return document.fonts && document.fonts.load
      ? Promise.all([document.fonts.load("700 100px Oswald"), document.fonts.load("500 30px 'Roboto Slab'")]).catch(function () {})
      : Promise.resolve();
  }

  // ---------- draft storage ----------
  var DEFAULT_DESIGN = { template: "classic", variant: "green", format: "square", nameFormat: "full" };

  var DEFAULT_MEDIA = {
    preset: "players3",
    customDataUrl: null,
    overlay: 75,
    posX: 50,
    posY: 50,
    zoom: 100,
    blur: 0
  };

  var DEFAULT_INFO = {
    tag: "CLUB ANNOUNCEMENT",
    title: "SEASON OPENING TRAINING",
    subtitle: "ALL GRADES \u00b7 SENIORS & JUNIORS",
    line1: "Tuesday & Thursday from 5:30 PM",
    line2: "Shirley Strickland Reserve, Ardross",
    line3: "Bring cleats, glove & water bottle",
    line4: "New & returning players welcome!",
    footer: "FREMANTLEREBELS.COM.AU"
  };

  var DEFAULT_DINNER = {
    tag: "CLUB DINNER ORDER",
    title: "THURSDAY NIGHT DINNER",
    subtitle: "POST-TRAINING MEALS AT SHIRLEY STRICKLAND",
    item1: "Chicken Parmigiana & Chips \u00b7 $18",
    item2: "Beef Lasagne & Fresh Salad \u00b7 $16",
    item3: "Vegetarian Pasta Bake \u00b7 $15",
    deadline: "Wednesday 5:00 PM",
    orderInfo: "Order via Team App or SMS 0412 345 678"
  };

  function loadDraft() {
    var d = null;
    try { d = JSON.parse(localStorage.getItem(STORE) || "null"); } catch (e) { /* ignore */ }
    d = d || {};
    d.type = d.type || "fixture";
    if (!d.fixtureId && !d.fixture && window.REBELS_DATA && window.REBELS_DATA.fixtures && window.REBELS_DATA.fixtures.length > 0) {
      var firstClub = window.REBELS_DATA.fixtures.filter(function (x) { return x.isClub; })[0] || window.REBELS_DATA.fixtures[0];
      d.fixtureId = firstClub.id;
    }
    d.design = Object.assign({}, DEFAULT_DESIGN, d.design || {});
    d.media = Object.assign({}, DEFAULT_MEDIA, d.media || {});
    d.info = Object.assign({}, DEFAULT_INFO, d.info || {});
    d.dinner = Object.assign({}, DEFAULT_DINNER, d.dinner || {});
    if (d.media.customDataUrl && !customImage) {
      setCustomBg(d.media.customDataUrl);
    }
    return d;
  }
  function saveDraft(d) { try { localStorage.setItem(STORE, JSON.stringify(d)); return true; } catch (e) { return false; } }
  function fixtureFromDraft(d) {
    var id = +d.fixtureId || +d.fixture;
    var f = window.REBELS_DATA.fixtures.filter(function (x) { return x.id === id; })[0] || null;
    if (f && d.homeScore != null) { f.homeScore = d.homeScore; f.awayScore = d.awayScore; }
    return f;
  }

  window.RebelsPost = {
    W: W, CLUB_RE: CLUB_RE, TEMPLATES: TEMPLATES, VARIANTS: VARIANTS, FORMATS: FORMATS,
    DEFAULT_DESIGN: DEFAULT_DESIGN, DEFAULT_MEDIA: DEFAULT_MEDIA, PRESET_IMAGES: PRESET_IMAGES,
    render: render, fontsReady: fontsReady, onImages: function (fn) { listeners.push(fn); },
    setCustomBg: setCustomBg,
    fmtDay: fmtDay, fmtShortDay: fmtShortDay, fmtTime: fmtTime, shortName: shortName,
    loadDraft: loadDraft, saveDraft: saveDraft, fixtureFromDraft: fixtureFromDraft
  };
})();
