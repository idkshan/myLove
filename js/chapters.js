/* The chapters: one page for each time we met.

   Each page has:
   - an opening: the number, "The 1st time", the title, and the paragraph,
   - its photos, one after another as she scrolls (her photos first, then together),
   - a Next button at the end, which leads to the next page.

   Photos and songs come from media/manifest.js (made by tools/prepare_media.py).
   Words come from content.js. */
(function (Site) {
  var C = Site.content;
  var NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

  // The Next button (and a small Back link) at the end of a page
  function pageEnd(index, nextTo) {
    var P = C.pages || {};
    var end = Site.el("footer", { className: "page-end" });
    var next = Site.el("button", { className: "next-btn", type: "button" }, [
      Site.el("span", { className: "next-label" }, [P.next || "Next"]),
      Site.fillText(Site.el("span", { className: "next-to" }), nextTo)
    ]);
    next.addEventListener("click", function () { Site.pages.show(index + 1); });
    end.appendChild(next);
    if (index > 0) {
      var back = Site.el("button", { className: "back-link", type: "button" }, [P.back || "Back"]);
      back.addEventListener("click", function () { Site.pages.show(index - 1); });
      end.appendChild(back);
    }
    return end;
  }

  // Builds the chapter pages. Returns them as [{ el, song, title }]
  Site.renderChapters = function () {
    var root = document.getElementById("chapters");
    var media = (window.MEDIA && window.MEDIA.chapters) || [];
    var words = C.chapters || [];
    var pages = [];

    media.forEach(function (m, i) {
      var w = words[i] || {};
      var captions = w.captions || {};
      var page = Site.el("section", { className: "page chapter", id: "chapter-" + (i + 1) });
      page.hidden = true;

      // The opening
      var intro = Site.el("header", { className: "chapter-intro" });
      intro.appendChild(Site.el("span", { className: "chapter-num reveal", "aria-hidden": "true" }, [NUMERALS[i] || String(i + 1)]));
      intro.appendChild(Site.fillText(Site.el("p", { className: "chapter-label reveal" }), w.label || ""));
      intro.appendChild(Site.fillText(Site.el("h2", { className: "chapter-title reveal" }), w.title || ""));
      String(w.text || "").split(/\n\s*\n/).map(function (p) { return p.trim(); }).filter(Boolean).forEach(function (p) {
        intro.appendChild(Site.fillText(Site.el("p", { className: "chapter-text reveal" }), p));
      });
      page.appendChild(intro);

      // The photos, alternating left and right
      var photos = m.photos.map(function (p) {
        return { src: p.src, w: p.w, h: p.h, caption: captions[p.name] || "", alt: "" };
      });
      var strip = Site.el("div", { className: "strip" });
      photos.forEach(function (p, k) {
        var frame = Site.el("figure", { className: "frame reveal " + (k % 2 ? "is-right" : "is-left") });
        var button = Site.el("button", { className: "frame-photo", type: "button", "aria-label": "Open photo" });
        var pic = Site.createMedia(p);
        pic.style.aspectRatio = p.w + " / " + p.h;        // keeps its space while it loads
        button.appendChild(pic);
        button.addEventListener("click", function () { Site.lightbox.open(photos, k, button); });
        frame.appendChild(button);
        if (p.caption) frame.appendChild(Site.fillText(Site.el("figcaption", { className: "frame-caption" }), p.caption));
        strip.appendChild(frame);
      });
      page.appendChild(strip);

      // The Next button: to the next chapter, or to the bouquet after the last one
      var nextWords = words[i + 1] && i + 1 < media.length ? words[i + 1].label : ((C.pages || {}).finale || "");
      page.appendChild(pageEnd(i, nextWords || ""));
      root.appendChild(page);

      pages.push({ el: page, song: m.song, title: w.song || "" });
    });
    return pages;
  };
})(window.Site);
