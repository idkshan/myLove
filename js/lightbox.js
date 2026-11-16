/* Full-screen photo viewer. Arrows or swipe to move, Esc to close. */
(function (Site) {
  var dialog = document.getElementById("lightbox");
  var mediaBox = document.getElementById("lb-media");
  var caption = document.getElementById("lb-caption");
  var description = document.getElementById("lb-description");
  var count = document.getElementById("lb-count");

  var items = [];
  var index = 0;
  var opener = null;

  function buildMedia(item) {
    if (item.type === "video") {
      var v = Site.el("video", { controls: true, playsInline: true, preload: "metadata", src: item.src });
      if (item.poster) v.poster = item.poster;
      return v;
    }
    return Site.el("img", { src: item.src, alt: item.alt || "" });
  }

  function render() {
    var item = items[index];
    mediaBox.textContent = "";
    mediaBox.appendChild(buildMedia(item));
    Site.fillText(caption, item.caption || "");
    Site.fillText(description, item.description || item.line || "");
    count.textContent = items.length > 1 ? (index + 1) + " / " + items.length : "";

    // Warm up the next photo so swiping feels instant
    var next = items[(index + 1) % items.length];
    if (next && next.type !== "video") new Image().src = next.src;
  }

  function step(delta) {
    if (items.length < 2) return;
    index = (index + delta + items.length) % items.length;
    render();
  }

  function close() { dialog.close(); }

  Site.lightbox = {
    open: function (list, startIndex, fromEl) {
      items = list;
      index = startIndex || 0;
      opener = fromEl || null;
      dialog.classList.toggle("is-single", items.length < 2);
      render();
      dialog.showModal();
      document.documentElement.style.overflow = "hidden";
    }
  };

  dialog.addEventListener("close", function () {
    mediaBox.textContent = ""; // stops any video
    document.documentElement.style.overflow = "";
    if (opener) opener.focus({ preventScroll: true });
  });

  dialog.addEventListener("click", function (e) {
    var action = e.target.closest("[data-lb]");
    if (action) {
      var what = action.getAttribute("data-lb");
      if (what === "close") close();
      if (what === "prev") step(-1);
      if (what === "next") step(1);
      return;
    }
    // Clicking the dark background (not the photo itself) closes the viewer
    if (!e.target.closest("img, video, figcaption")) close();
  });

  dialog.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });

  // Swipe left/right on phones
  var startX = null, startY = null;
  dialog.addEventListener("touchstart", function (e) {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }, { passive: true });
  dialog.addEventListener("touchend", function (e) {
    if (startX === null) return;
    var dx = e.changedTouches[0].clientX - startX;
    var dy = e.changedTouches[0].clientY - startY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
    startX = startY = null;
  }, { passive: true });
})(window.Site);
