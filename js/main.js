/* Starts everything. */
(function (Site) {
  var C = Site.content;
  var params = new URLSearchParams(location.search);

  // Put the words from content.js into the page
  document.querySelectorAll("[data-text]").forEach(function (el) {
    Site.fillText(el, Site.get(el.getAttribute("data-text")));
  });
  if (C.name) document.title = "For " + C.name;

  // Build the pages: one per chapter, then the bouquet
  var pages = Site.renderChapters();
  var finale = document.getElementById("page-finale");
  // The bouquet's song waits for the flowers: the 7th chapter's song fades out
  // quickly, and the last song starts from the beginning as the first stems grow.
  var FINALE_FADE_OUT = 1.2, FINALE_FADE_IN = 0.4;      // seconds
  var finaleSong = window.MEDIA && window.MEDIA.finaleSong, finaleTitle = (C.flowers || {}).song || "";
  var finaleSongOn = false;
  Site.playFinaleSong = function () {                   // called by bouquet.js when the flowers start growing
    finaleSongOn = true;
    Site.music.play(finaleSong, finaleTitle, FINALE_FADE_IN);
  };
  pages.push({ el: finale, song: null, title: "", fade: FINALE_FADE_OUT });
  Site.renderLetter();
  Site.stars.init();

  var finaleStarted = false;
  Site.pages.init(pages, function (i, page) {
    var isFinale = page.el === finale;
    Site.stars.setActive(!isFinale);                     // stars on the chapters; the bouquet has its own
    if (!isFinale && Site.showWords) Site.showWords();   // the "hide the words" button only applies to the bouquet
    if (isFinale && !finaleStarted) { finaleStarted = true; Site.initFinale(); }
    else if (isFinale && finaleSongOn) Site.playFinaleSong();   // coming back to the bouquet: its song again
  });

  // Click Me → heart → Open → the first page
  Site.initWelcome(function () {
    document.getElementById("site").hidden = false;
    Site.initReveal();
    Site.initMusic();
    Site.pages.show(params.has("page") ? Math.max(0, parseInt(params.get("page"), 10) - 1) : 0);
  });

  // For testing: ?skip jumps straight in; add &page=8 to open a page (8 = the bouquet)
  if (params.has("skip")) {
    document.getElementById("gate-btn").click();
    document.getElementById("welcome-open").click();
  }
})(window.Site);
