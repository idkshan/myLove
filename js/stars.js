/* A soft field of twinkling stars behind the chapter pages, with the odd
   shooting star. It drifts a little as she scrolls, for a dreamy feel.
   Only runs while a chapter page is showing. */
(function (Site) {
  var canvas, ctx, stars = [], W = 0, H = 0, dpr = 1, raf = 0, active = false, last = 0;
  var shooting = null, nextShoot = 4;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function frame(now) {
    raf = active ? requestAnimationFrame(frame) : 0;
    if (now - last < 33) return;                          // about 30 frames a second is plenty
    last = now;
    var t = now / 1000, scroll = window.scrollY;
    ctx.clearRect(0, 0, W, H);

    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var y = ((s.y * H - scroll * s.depth - t * s.drift) % H + H) % H;   // nearer stars drift more
      var tw = 0.45 + 0.55 * Math.max(0, Math.sin(t * s.speed + s.phase));
      ctx.globalAlpha = s.bright * tw;
      ctx.fillStyle = s.pink ? "#ffb3cf" : "#fff4f8";
      ctx.fillRect(s.x * W, y, s.size, s.size);
      if (s.size > 1.8) {                                 // the bigger ones get a soft halo
        ctx.globalAlpha = s.bright * tw * 0.18;
        ctx.fillRect(s.x * W - 2, y - 2, s.size + 4, s.size + 4);
      }
    }

    // A shooting star every few seconds
    if (!shooting && t > nextShoot) {
      shooting = { x: Math.random() * W * 0.8, y: Math.random() * H * 0.4, start: t, angle: 0.5 + Math.random() * 0.4 };
    }
    if (shooting) {
      var p = (t - shooting.start) / 0.9;
      if (p >= 1) { shooting = null; nextShoot = t + 5 + Math.random() * 6; }
      else {
        var len = 120, dist = p * 320;
        var x = shooting.x + Math.cos(shooting.angle) * dist, y2 = shooting.y + Math.sin(shooting.angle) * dist;
        var grad = ctx.createLinearGradient(x, y2, x - Math.cos(shooting.angle) * len, y2 - Math.sin(shooting.angle) * len);
        grad.addColorStop(0, "rgba(255, 230, 240, 0.9)");
        grad.addColorStop(1, "rgba(255, 180, 210, 0)");
        ctx.globalAlpha = Math.sin(p * Math.PI);
        ctx.strokeStyle = grad; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(x, y2); ctx.lineTo(x - Math.cos(shooting.angle) * len, y2 - Math.sin(shooting.angle) * len); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  Site.stars = {
    init: function () {
      canvas = document.getElementById("stars");
      ctx = canvas && canvas.getContext && canvas.getContext("2d");
      if (!ctx) return;
      var count = window.innerWidth < 760 ? 110 : 180;
      for (var i = 0; i < count; i++) {
        stars.push({ x: Math.random(), y: Math.random(), size: Math.random() < 0.12 ? 2.2 : 1 + Math.random() * 0.6,
                     depth: 0.02 + Math.random() * 0.08, drift: 2 + Math.random() * 6,
                     speed: 0.6 + Math.random() * 1.8, phase: Math.random() * 6.3,
                     bright: 0.35 + Math.random() * 0.55, pink: Math.random() < 0.25 });
      }
      resize();
      window.addEventListener("resize", resize);
    },
    // Turn the stars on (chapter pages) or off (the bouquet has its own)
    setActive: function (on) {
      if (!ctx) return;
      active = on && !Site.reducedMotion;
      canvas.classList.toggle("is-on", on);
      if (active && !raf) { last = 0; raf = requestAnimationFrame(frame); }
      if (on && Site.reducedMotion) frame(performance.now());   // a still starfield
    }
  };
})(window.Site);
