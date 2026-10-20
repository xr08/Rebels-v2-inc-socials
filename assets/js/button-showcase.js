(function () {
  "use strict";
  var count = 0;
  var finishes = [
    ["Brushed gold", "rb-metal-gold", "Warm highlights, a softly polished face and dark green lettering.", "Download card"],
    ["Smoked glass", "rb-smoked-glass", "Translucent green, a fine bright edge and a soft background blur.", "Save draft"],
    ["Silver chrome", "rb-metal-chrome", "Cool silver bands and crisp reflections for a collectible finish.", "Open collection"]
  ];
  finishes.forEach(function (finish) {
    var article = document.createElement("article"); article.className = "finish-card";
    var meta = document.createElement("div"); meta.className = "finish-meta";
    var title = document.createElement("h2"); title.textContent = finish[0];
    var note = document.createElement("p"); note.textContent = finish[2]; meta.append(title, note);
    var stage = document.createElement("div"); stage.className = "finish-stage";
    [["Live · try me", ""], ["Hover preview", "is-hover"], ["Pressed preview", "is-pressed"], ["Disabled", "disabled"]].forEach(function (example, index) {
      var row = document.createElement("div"); row.className = "finish-example";
      var label = document.createElement("span"); label.textContent = example[0];
      var button = document.createElement("button"); button.type = "button"; button.className = "rb-special " + finish[1] + " " + (example[1] === "disabled" ? "" : example[1]);
      button.textContent = finish[3]; button.disabled = index === 3;
      button.setAttribute("aria-label", finish[0] + ": " + example[0] + ", " + finish[3]);
      if (index === 0) button.dataset.live = "true";
      button.addEventListener("click", function () {
        count++;
        document.getElementById("testStatus").textContent = finish[0] + " · " + finish[3] + " tested. " + count + " activation" + (count === 1 ? "" : "s") + ". This is a preview action.";
      });
      row.append(label, button); stage.appendChild(row);
    });
    article.append(meta, stage); document.getElementById("finishes").appendChild(article);
  });
  document.getElementById("photoBackground").addEventListener("change", function () { document.getElementById("finishes").classList.toggle("photo-surface", this.checked); });
  document.getElementById("disableLive").addEventListener("change", function () {
    var disabled = this.checked;
    document.querySelectorAll("[data-live]").forEach(function (button) { button.disabled = disabled; });
    document.getElementById("testStatus").textContent = disabled ? "Live buttons disabled. Uncheck to test them again." : "Live buttons enabled. Ready to test.";
  });
})();
