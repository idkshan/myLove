/* Things fade and drift into view as she scrolls to them. */
(function (Site) {
  Site.initReveal = function () {
    var items = document.querySelectorAll(".reveal");
    if (Site.reducedMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add("is-in");
        observer.unobserve(el);
        // Clear any delay afterwards
        setTimeout(function () { el.style.transitionDelay = ""; }, 2400);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    items.forEach(function (el) { observer.observe(el); });
  };
})(window.Site);
