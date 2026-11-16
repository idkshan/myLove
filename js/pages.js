/* Shows one page at a time: the chapters, then the bouquet.

   Going to another page: the screen fades to dark, the new page appears at
   the top, its song fades in, and the screen fades back up.
   The phone's back gesture goes to the previous page. */
(function (Site) {
  var list = [], current = -1, busy = false, onShow = null;

  function swap(i) {
    if (current >= 0) list[current].el.hidden = true;
    current = i;
    list[i].el.hidden = false;
    var root = document.documentElement, before = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";                   // jump to the top instantly
    window.scrollTo(0, 0);
    root.style.scrollBehavior = before;
    if (Site.music) Site.music.play(list[i].song, list[i].title, list[i].fade);
    if (onShow) onShow(i, list[i]);
  }

  Site.pages = {
    // pages: [{ el, song, title, fade }]; whenShown(i, page) runs every time a page appears
    init: function (pages, whenShown) {
      list = pages;
      onShow = whenShown;
      window.addEventListener("popstate", function (e) {
        if (e.state && typeof e.state.page === "number") Site.pages.show(e.state.page, { fromHistory: true });
      });
    },

    show: function (i, opts) {
      opts = opts || {};
      if (i < 0 || i >= list.length || i === current || busy) return;
      if (!opts.fromHistory) {
        if (current < 0) history.replaceState({ page: i }, "");
        else history.pushState({ page: i }, "");
      }
      // First page, or "reduce motion": no fade
      if (current < 0 || opts.instant || Site.reducedMotion) { swap(i); return; }

      var curtain = document.getElementById("curtain");
      busy = true;
      curtain.classList.add("is-on");
      setTimeout(function () {
        swap(i);
        setTimeout(function () { curtain.classList.remove("is-on"); busy = false; }, 250);
      }, 900);
    },

    current: function () { return current; }
  };
})(window.Site);
