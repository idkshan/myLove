/* The letter.
   Tap the envelope in the bouquet → the letter opens full-screen.
   Close it → the last message appears. */
(function (Site) {
  var C = Site.content;

  // Shared with bouquet.js
  Site.letter = { exists: false, reading: false, onRead: null };

  Site.renderLetter = function () {
    var L = C.letter || {};
    var stage = document.getElementById("closing");
    var dialog = document.getElementById("letter-dialog");
    var scroller = document.getElementById("letter-scroll");
    var paper = document.getElementById("letter-paper");
    var closeBtn = document.getElementById("letter-close");
    var envelope = document.getElementById("envelope");
    var card = document.getElementById("env-card");

    var paragraphs = String(L.body || "")
      .split(/\n\s*\n/)
      .map(function (p) { return p.trim(); })
      .filter(Boolean);

    var again = document.getElementById("letter-again");
    if (!paragraphs.length) { again.hidden = true; return; }   // no letter: the finale goes straight to the last message
    Site.letter.exists = true;

    /* Build the letter */
    var line = 0;
    function add(node) {
      node.style.setProperty("--i", Math.min(line++, 10)); // stagger, capped for long letters
      paper.appendChild(node);
    }
    if (L.greeting) add(Site.fillText(Site.el("p", { className: "letter-greeting" }), L.greeting));
    paragraphs.forEach(function (text) { add(Site.fillText(Site.el("p", {}), text)); });
    var sign = Site.fillText(Site.el("p", { className: "letter-sign" }), L.signoff || "");
    sign.appendChild(Site.el("span", { className: "letter-name" }, [C.from || ""]));
    add(sign);

    closeBtn.textContent = L.close || "Close the letter";
    card.appendChild(Site.fillText(Site.el("span", { className: "env-message" }), L.greeting || ""));

    function openLetter() {
      Site.letter.reading = true;
      dialog.showModal();
      scroller.scrollTop = 0;
      document.documentElement.style.overflow = "hidden";
      paper.focus({ preventScroll: true });
    }

    /* Envelope → letter */
    var busy = false, opener = envelope;
    envelope.addEventListener("click", function () {
      if (busy) return;
      busy = true;
      opener = envelope;
      envelope.classList.add("is-open");
      stage.classList.add("is-reading");
      setTimeout(openLetter, Site.reducedMotion ? 0 : 1500);
    });

    /* After the envelope has faded, this link under the last message reopens the letter */
    again.addEventListener("click", function () { opener = again; openLetter(); });

    dialog.addEventListener("click", function (e) {
      if (e.target.closest("[data-close]")) dialog.close();
    });

    dialog.addEventListener("close", function () {
      Site.letter.reading = false;
      document.documentElement.style.overflow = "";
      envelope.classList.remove("is-open");
      stage.classList.remove("is-reading");
      busy = false;
      if (Site.letter.onRead) Site.letter.onRead();
      (opener === again ? again : document.body).focus({ preventScroll: true });
    });
  };
})(window.Site);
