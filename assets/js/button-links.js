/* Hold the pressed finish briefly before following an ordinary link. */
(function () {
  "use strict";
  var pending = null;
  document.addEventListener("click", function (event) {
    var link = event.target.closest("a.rb-special[href]");
    if (
      !link ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey ||
      link.hasAttribute("download") ||
      (link.target && link.target !== "_self")
    )
      return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    event.preventDefault();
    if (pending) return;
    link.classList.add("is-pressed");
    pending = window.setTimeout(function () {
      window.location.assign(link.href);
    }, 380);
  });
  window.addEventListener("pageshow", function () {
    window.clearTimeout(pending);
    pending = null;
    document
      .querySelectorAll("a.rb-special.is-pressed")
      .forEach(function (link) {
        link.classList.remove("is-pressed");
      });
  });
})();
