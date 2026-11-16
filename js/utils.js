/* Shared helpers used by every component. */
window.Site = window.Site || {};

(function (Site) {
  var C = window.SITE || {};
  Site.content = C;
  Site.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Read a value like "welcome.greeting" from content.js */
  Site.get = function (path) {
    return path.split(".").reduce(function (obj, key) {
      return obj == null ? obj : obj[key];
    }, C);
  };

  /* Put text into an element. {name} becomes her nickname in italics. */
  Site.fillText = function (el, text) {
    el.textContent = "";
    String(text == null ? "" : text).split("{name}").forEach(function (part, i) {
      if (i > 0) {
        var em = document.createElement("em");
        em.textContent = C.name || "";
        el.appendChild(em);
      }
      if (part) el.appendChild(document.createTextNode(part));
    });
    return el;
  };

  /* Tiny element builder: Site.el("p", { className: "x" }, [child, "text"]) */
  Site.el = function (tag, props, children) {
    var node = document.createElement(tag);
    Object.keys(props || {}).forEach(function (key) {
      if (key in node && key !== "type") node[key] = props[key];
      else node.setAttribute(key, props[key]);
    });
    (children || []).forEach(function (child) {
      node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    });
    return node;
  };

  /* A photo (or, later, a video) with a soft loading shimmer.
     Items come straight from content.js: { src, alt, type?, poster? } */
  Site.createMedia = function (item, opts) {
    opts = opts || {};
    var wrap = Site.el("span", { className: "photo" });
    var media;
    var done = function () { wrap.classList.add("is-loaded"); };

    if (item.type === "video") {
      media = Site.el("video", { preload: "metadata", playsInline: true, muted: true });
      if (item.poster) media.poster = item.poster;
      media.addEventListener("loadeddata", done);
      media.addEventListener("error", done);
      media.src = item.src;
      if (item.alt) media.setAttribute("aria-label", item.alt);
    } else {
      media = new Image();
      media.alt = item.alt || "";
      media.decoding = "async";
      if (!opts.eager) media.loading = "lazy";
      media.addEventListener("load", done);
      media.addEventListener("error", done);
      media.src = item.src;
      if (media.complete && media.naturalWidth) done();
    }

    wrap.appendChild(media);
    return wrap;
  };

  /* Hide a whole section (and its menu link) when it has no content */
  Site.hideSection = function (id) {
    var section = document.getElementById(id);
    if (section) section.hidden = true;
    var link = document.querySelector('.topbar-links a[href="#' + id + '"]');
    if (link) link.hidden = true;
  };
})(window.Site);
