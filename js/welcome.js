/* The start of the site.
   1. A "Click Me" button on a dark screen.
   2. The heart scene. It starts as a glowing pool. The pool erupts, and the
      heart forms out of the swirling spray. Then the words fade in, then the
      Open button. After that it loops:
        - the pool erupts again, swallows the heart and sinks back down with it,
        - then erupts once more and the heart forms out of the spray again. */
(function (Site) {
  var TAU = Math.PI * 2;

  /* ---- Settings ---- */
  var HEART_LIGHT = [1.0, 0.82, 0.9], HEART_MID = [0.96, 0.46, 0.66], HEART_DEEP = [0.7, 0.2, 0.44];
  var POOL_CORE = [1.0, 0.5, 0.76], POOL_EDGE = [0.78, 0.2, 0.5];
  var SPIN = 0.32;            // how fast the scene turns
  var TEXT_AT = 7;            // seconds before the words start to appear (once the heart has formed)
  var BUTTON_AT = 11;         // seconds before the Open button appears

  // One loop of the heart, in seconds
  var ERUPT = 4.5;            // eruption 1: the pool rises and swallows the heart
  var SINK = 8.8;             // it sinks back down and the heart falls apart
  var FORM = 11.8;            // eruption 2: the pool rises again and the heart forms out of it
  var FORM_FALL = FORM + 3.9; // the spray from eruption 2 falls back into the pool
  var CYCLE = 18.8;           // the loop starts again
  var START = FORM - 1.0;     // the scene begins here: a calm pool, just before eruption 2

  var HEART_DOTS = 2400, POOL_DOTS = 1500, SPRAY_DOTS = 1300, STREAKS = 30, TAIL = 22;
  var POOL_Y = -1.05, POOL_R = 1.15;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function smooth(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function easeOut(t) { t = clamp(t, 0, 1); return 1 - Math.pow(1 - t, 3); }
  function easeIn(t) { t = clamp(t, 0, 1); return t * t * t; }
  function bump(x, c, w) { var d = (x - c) / w; return Math.exp(-d * d); }
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }

  var seed = 5;
  function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }

  // The two eruptions: when each starts, and when its spray falls back
  var ERUPTIONS = [{ start: ERUPT, fall: SINK }, { start: FORM, fall: FORM_FALL }];

  /* ---- Build the scene once ---- */
  function build() {
    var S = { heart: [], pool: [], spray: [], streaks: [] };

    // Heart: a soft pillow shape traced from the classic heart curve
    for (var i = 0; i < HEART_DOTS; i++) {
      var t = rnd() * TAU, edge = rnd() < 0.45;
      var s = edge ? 0.97 + rnd() * 0.05 : Math.pow(rnd(), 0.45);
      var hx = Math.pow(Math.sin(t), 3);
      var hy = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16;
      var x = hx * s * 0.85, y = (hy + 0.18) * s * 0.85 + 0.12;
      var z = (rnd() < 0.5 ? -1 : 1) * 0.3 * Math.sqrt(Math.max(0, 1 - s * s)) * (edge ? 1 : 0.55 + 0.45 * rnd());
      var shade = clamp(0.5 + 0.45 * (y - x * 0.5), 0, 1);
      var c = shade > 0.5 ? mix(HEART_MID, HEART_LIGHT, (shade - 0.5) * 2) : mix(HEART_DEEP, HEART_MID, shade * 2);
      var b = 0.82 + 0.36 * rnd();
      if (rnd() < 0.06) { c = [1, 0.96, 0.98]; b = 1; }
      var height = clamp((y + 0.65) / 1.65, 0, 1);       // 0 at the tip, 1 at the top
      var pr = Math.sqrt(rnd()) * POOL_R * 0.9, pa = rnd() * TAU;
      S.heart.push({
        x: x, y: y, z: z, c: [c[0] * b, c[1] * b, c[2] * b], size: edge ? 1.7 : 1.4 + rnd() * 0.5,
        leave: ERUPT + 0.6 + height * 2.6 + rnd() * 0.3,   // eruption 1 swallows the bottom first
        sink: SINK + rnd() * 0.9 + height * 0.4,
        launch: FORM + 0.5 + rnd() * 1.4,                    // eruption 2 throws it up from the pool...
        settle: FORM + 2.4 + height * 1.5 + rnd() * 0.3,     // ...and it settles into place, bottom first
        th: rnd() * TAU, om: 1.4 + rnd() * 1.2, orbit: 0.55 + rnd() * 0.6,
        px: pr * Math.cos(pa), pz: pr * Math.sin(pa),        // its resting place in the pool
        bx: pr * Math.cos(pa), by: POOL_Y + 0.02, bz: pr * Math.sin(pa)   // where it was when the sinking began
      });
    }

    // Pool: a flat disc of dots, brightest in the middle
    for (var j = 0; j < POOL_DOTS; j++) {
      var r = Math.sqrt(rnd()), a = rnd() * TAU;
      var col = mix(POOL_CORE, POOL_EDGE, r);
      var pb = 0.75 + 0.4 * rnd();
      if (rnd() < 0.08) { col = [1, 0.9, 0.96]; pb = 1; }
      S.pool.push({ r: r, a: a, c: [col[0] * pb, col[1] * pb, col[2] * pb], size: 1.3 + rnd() * 0.8 });
    }

    // Spray: dots thrown up by each eruption, swirling around the heart (times are from the eruption's start)
    for (var k = 0; k < SPRAY_DOTS; k++) {
      S.spray.push({
        launch: rnd() * 2.6, rise: 1.4 + rnd() * 1.6, top: -0.6 + rnd() * 1.95,
        th: rnd() * TAU, om: 1.5 + rnd() * 1.5, wide: 0.45 + rnd() * 0.85,
        late: rnd() * 0.8, white: rnd() < 0.3, size: 1.2 + rnd() * 0.7
      });
    }

    // Streaks: bright comets with tails that circle up around the heart
    for (var m = 0; m < STREAKS; m++) {
      S.streaks.push({ start: 0.6 + rnd() * 2.4, th: rnd() * TAU, om: 2.4 + rnd() * 1.6,
                       radius: 0.7 + rnd() * 0.6, top: 0.2 + rnd() * 1.0, wob: rnd() * TAU });
    }
    return S;
  }

  function startHeart() {
    var box = document.getElementById("welcome-heart");
    var canvas = document.getElementById("welcome-heart-canvas");
    var cap = HEART_DOTS + POOL_DOTS + 2 * (SPRAY_DOTS + STREAKS * TAIL);
    var renderer = Site.points(canvas, { capacity: cap });
    if (!renderer) { box.hidden = true; return { stop: function () {}, burst: function () {}, time: function () { return 99; } }; }
    canvas = renderer.canvas;

    var S = build();
    var T = 0, last = 0, raf = 0, stopped = false, burstAt = -1, boxW = 0;
    var d = renderer.data, n = 0;

    function put(x, y, z, c, size, alpha) {
      var o = n * 8;
      d[o] = x; d[o + 1] = y; d[o + 2] = z;
      d[o + 3] = Math.min(1, c[0]); d[o + 4] = Math.min(1, c[1]); d[o + 5] = Math.min(1, c[2]);
      d[o + 6] = size; d[o + 7] = alpha;
      n++;
    }

    function resize() {
      boxW = Math.round(Math.max(140, Math.min(250, window.innerWidth * 0.5, window.innerHeight * 0.25)));
      box.style.width = boxW + "px";
      box.style.height = Math.round(boxW * 1.22) + "px";
      renderer.resize(boxW * 3, boxW * 3);               // extra room for the spray
    }

    // How high the pool has risen for one eruption (0 calm, 1 fully erupted)
    function surge(c, e) { return smooth((c - e.start + 0.3) / 1.4) * (1 - smooth((c - e.fall - 0.4) / 2.2)); }

    // Spray and streaks for one eruption
    function drawEruption(c, e, push, fade) {
      for (var s2 = 0; s2 < S.spray.length; s2++) {
        var sp = S.spray[s2], launch = e.start + sp.launch, fall = e.fall + sp.late;
        if (c < launch || c > fall + 2.4) continue;
        var age = c - launch, up = easeOut(age / sp.rise);
        var sy = POOL_Y + (sp.top - POOL_Y) * up;
        if (c > fall) sy += (POOL_Y - sy) * easeIn((c - fall) / 2.2);
        var sr = (0.1 + sp.wide * up) * (0.6 + 0.4 * clamp((sy + 1) / 2, 0, 1));
        var sa = sp.th + age * sp.om;
        var life = smooth(age / 0.4) * (1 - smooth((c - fall - 1.6) / 0.8));
        put(sr * Math.cos(sa) * push, sy * push, sr * Math.sin(sa) * push, sp.white ? [1, 0.9, 0.96] : [1, 0.55, 0.8], sp.size, life * fade);
      }
      for (var m = 0; m < S.streaks.length; m++) {
        var st = S.streaks[m], start = e.start + st.start;
        if (c < start || c > e.fall + 2.5) continue;
        var env = smooth((c - start) / 0.6) * (1 - smooth((c - e.fall - 1.6) / 0.9));
        for (var tl = 0; tl < TAIL; tl++) {
          var tt = c - start - tl * 0.022;
          if (tt < 0) break;
          var ty = POOL_Y + (st.top - POOL_Y) * easeOut(tt / 2.2);
          if (c > e.fall) ty += (POOL_Y - ty) * easeIn((c - e.fall) / 2.2);
          var ta = st.th + tt * st.om, trr = st.radius * (0.7 + 0.3 * Math.sin(tt * 2 + st.wob));
          var fadeTail = Math.pow(1 - tl / TAIL, 1.5);
          put(trr * Math.cos(ta) * push, (ty + 0.05 * Math.sin(tt * 5 + st.wob)) * push, trr * Math.sin(ta) * push,
              [1, 0.8 + 0.2 * fadeTail, 0.94], 2.8 - tl * 0.08, env * fadeTail * fade);
        }
      }
    }

    function render() {
      n = 0;
      var c = (T + START) % CYCLE;
      var first = T + START < CYCLE;                     // the very first time through: no eruption 1
      var rise = Math.max(first ? 0 : surge(c, ERUPTIONS[0]), surge(c, ERUPTIONS[1]));
      var p = c % 1.25;
      var whole = c < ERUPT || c > FORM + 6;             // the heart is whole and beating
      var beat = whole ? bump(p, 0.12, 0.07) + 0.55 * bump(p, 0.38, 0.08) : 0;
      var burst = burstAt < 0 ? 0 : easeOut((T - burstAt) / 1.7);
      var fade = 1 - burst, push = 1 + burst * 2.4;

      // The pool
      for (var j = 0; j < S.pool.length; j++) {
        var q = S.pool[j], r = q.r * POOL_R * (1 + 0.1 * rise);
        var x = r * Math.cos(q.a), z = r * Math.sin(q.a);
        var y = POOL_Y + 0.025 * Math.sin(q.r * 12 - T * 3) + rise * 0.32 * (1 - q.r * q.r) * (0.8 + 0.2 * Math.sin(T * 6 + q.a * 3));
        var glow = 0.8 + 0.5 * rise;
        put(x * push, y * push, z * push, [q.c[0] * glow, q.c[1] * glow, q.c[2] * glow], q.size, fade);
      }

      // The heart
      for (var i = 0; i < S.heart.length; i++) {
        var h = S.heart[i], sc = 1 + 0.06 * beat;
        var hx = h.x * sc, hy = h.y * sc, hz = h.z * sc, x2 = hx, y2 = hy, z2 = hz, bright = 1, alpha = 1;
        if (c >= h.leave && c < h.sink) {                // eruption 1: caught in the swirl
          var age = c - h.leave, k = smooth(age / 1.0);
          var ang = h.th + age * h.om, rr = 0.15 + h.orbit * easeOut(age / 1.2);
          x2 = hx + (rr * Math.cos(ang) - hx) * k;
          y2 = hy + 0.2 * easeOut(age / 2) * k;
          z2 = hz + (rr * Math.sin(ang) - hz) * k;
          h.bx = x2; h.by = y2; h.bz = z2;
          bright = 1 + 0.4 * k;
        } else if (c >= h.sink && c < h.launch) {        // falling apart, down into the pool
          var f = easeIn((c - h.sink) / 2.2);
          x2 = h.bx + (h.px - h.bx) * f;
          y2 = h.by + (POOL_Y + 0.02 - h.by) * f;
          z2 = h.bz + (h.pz - h.bz) * f;
          alpha = first ? 0.45 : 1 - 0.55 * f; bright = first ? 1 : 1.3 - 0.3 * f;
        } else if (c >= h.launch) {                      // eruption 2: thrown up in the swirl, then settling into the heart
          var age2 = c - h.launch, lift = smooth(age2 / 0.6);
          var ang2 = h.th + age2 * h.om, rr2 = 0.12 + h.orbit * easeOut(age2 / 1.2);
          var sx = rr2 * Math.cos(ang2), sz = rr2 * Math.sin(ang2);
          var sy2 = POOL_Y + (hy + 0.15 - POOL_Y) * easeOut(age2 / 1.6);
          var fx = h.px + (sx - h.px) * lift, fy = POOL_Y + (sy2 - POOL_Y) * lift, fz = h.pz + (sz - h.pz) * lift;
          var g = smooth((c - h.settle) / 1.5);
          x2 = fx + (hx - fx) * g; y2 = fy + (hy - fy) * g; z2 = fz + (hz - fz) * g;
          alpha = 0.45 + 0.55 * lift;
          bright = 1 + 0.4 * lift * (1 - g);
          h.bx = x2; h.by = y2; h.bz = z2;
        }
        if (c < h.leave && c < ERUPT) { h.bx = hx; h.by = hy; h.bz = hz; }
        var hb = bright * (1 + 0.25 * beat);
        put(x2 * push, y2 * push, z2 * push, [h.c[0] * hb, h.c[1] * hb, h.c[2] * hb], h.size, alpha * fade);
      }

      // The eruptions
      if (!first) drawEruption(c, ERUPTIONS[0], push, fade);
      drawEruption(c, ERUPTIONS[1], push, fade);

      renderer.draw(n, {
        yaw: Site.reducedMotion ? 0.3 : T * SPIN, pitch: 0.28,
        cx: 0, cy: -0.22, halfW: 3, halfH: 3, dist: 6,
        px: (renderer.dpr || 1) * boxW / 210, glow: 1.2
      });
    }

    function frame(now) {
      if (stopped) return;
      raf = requestAnimationFrame(frame);
      if (now - last < 15) return;
      T += Math.min(0.05, (now - last) / 1000);
      last = now;
      render();
    }

    resize();
    window.addEventListener("resize", resize);
    if (Site.reducedMotion) { T = CYCLE - START + 1; render(); }   // reduced motion: a still heart
    else { last = performance.now(); raf = requestAnimationFrame(frame); }

    return {
      time: function () { return Site.reducedMotion ? 99 : T; },
      stop: function () {
        stopped = true;
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", resize);
        if (canvas.classList.contains("is-bursting") && canvas.parentNode) canvas.parentNode.removeChild(canvas);
      },
      // Final burst when she taps Open: lifted over the page so it stays visible
      burst: function () {
        if (Site.reducedMotion) return;
        var rect = canvas.getBoundingClientRect();
        canvas.classList.add("is-bursting");
        canvas.style.left = rect.left + "px"; canvas.style.top = rect.top + "px";
        document.body.appendChild(canvas);
        burstAt = T;
      }
    };
  }

  /* ---- The three steps ---- */
  Site.initWelcome = function (onEnter) {
    var gate = document.getElementById("gate");
    var gateBtn = document.getElementById("gate-btn");
    var welcome = document.getElementById("welcome");
    var text = document.getElementById("welcome-text");
    var openBtn = document.getElementById("welcome-open");
    var heart = null, entered = false;

    // Step 1 → 2: the first tap also lets the music play later (browsers need a tap for sound)
    gateBtn.addEventListener("click", function () {
      if (Site.music) Site.music.unlock();
      gate.classList.add("is-leaving");
      welcome.hidden = false;
      setTimeout(function () { gate.hidden = true; }, 1400);
      heart = startHeart();

      // Words appear once the heart has formed, then the button
      var timer = setInterval(function () {
        var t = heart.time();
        if (t >= TEXT_AT) text.classList.add("is-ready");
        if (t >= BUTTON_AT) { openBtn.classList.add("is-ready"); clearInterval(timer); }
      }, 200);
    });

    // Step 2 → 3
    openBtn.addEventListener("click", function () {
      if (entered) return;
      entered = true;
      heart.burst();
      welcome.classList.add("is-leaving");
      document.body.classList.remove("is-locked");
      onEnter();
      setTimeout(function () { welcome.hidden = true; }, 2200);
      setTimeout(function () { heart.stop(); }, 2600);
    });
  };
})(window.Site);
