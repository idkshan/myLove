/* The bouquet finale.

   A wrapped bouquet made of glowing dots grows and blooms one kind of flower
   at a time, slowly turning. Then a letter rises out of the flowers.

   Each petal is a cloud of dots along a curved line. Opening a flower bends
   those lines outward. points.js draws the dots. */
(function (Site) {
  var C = Site.content;

  /* ---- Settings ---- */
  // Pink tulips lead. The other flowers use colours that go with pink, so each kind is easy to spot.
  var TULIP_PINKS = ["#f06a9b", "#ff7fa8", "#f283a6", "#e8608f", "#f79abb", "#ff8fb5", "#ec5f93"];   // tulips: the main flower
  var ROSE_COLOURS = ["#ffbf99", "#fff2e2", "#ffcfa8", "#fff6ec"];   // peach and cream roses
  var DAISY_PETALS = ["#ffffff", "#fff8f0"];                          // white daisies with gold centres
  var LILY_PETAL = "#fff7f9", LILY_CENTRE = "#e2557f";                // white lilies with a pink centre
  var HYACINTH = ["#a678e8", "#bb92f0", "#9a6ee0"];                   // lilac hyacinths
  var WAXFLOWER = ["#ffc6da", "#ffffff", "#f7a3c2", "#ffe4ee"];      // tiny star blossoms that fill the gaps
  var WAXFLOWER_CENTRE = "#c23f70";
  var RIBBON = "#ffe3ec", STEM = "#4f9f6c";
  var PAPER = "#c98a9e";          // the wrapping paper cone
  var PAPER_FLAP = "#dca2b5";     // the three folded flaps over it
  var TISSUE = "#fbe3ea";         // tissue paper inside

  // The flowers sit in rings, from the top of the dome (r: 0) to its edge (r: 1).
  // Each list is one slice of its ring, and the same slice repeats REPEAT times
  // all the way round, so the bouquet looks just as good from every side as it turns.
  var REPEAT = 5;
  // turn: how far round the slice the ring starts (0 to 1), so neighbouring rings don't line up.
  var RINGS = [
    { r: 0,    turn: 0,     slice: ["tulip"], once: true },     // one tulip at the very top
    { r: 0.3,  turn: 0,     slice: ["tulip"] },
    { r: 0.57, turn: 0.25,  slice: ["rose", "tulip"] },
    { r: 0.8,  turn: 0,     slice: ["daisy", "tulip", "hyacinth"] },
    { r: 1,    turn: 0.167, slice: ["tulip", "lily", "tulip"] }
  ];
  var WAXFLOWERS = 6;             // little clusters in the gaps, per slice
  var BREATH_CLUSTERS = 3;        // clouds of baby's breath in the gaps, per slice

  var ROTATE_SPEED = 0.08;        // how fast it turns: a full turn in about 90 seconds (0 = no turning)

  // The small galaxy pool the bouquet stands over: a swirl of dots with spiral arms
  var POOL_COLOURS = ["#fff0f7", "#ff8fc4", "#b77cf2", "#6f7dff"];   // from the bright middle out to the edge
  var POOL_SIZE = 0.62;           // how far it reaches from the stems
  var POOL_SPIN = 0.12;           // how fast it swirls
  var POOL_ARMS = 3;

  // The dreamy sky behind the bouquet (the whole page)
  var SKY = {
    colours: ["#ffd6e8", "#f3b8ff", "#ffe6d2", "#ffffff", "#c8bcff"],   // pink, lilac, peach, white, periwinkle
    rain: 80,           // soft glowing stars falling slowly, like a gentle star rain
    rainSpeed: 1,       // 2 = twice as fast, 0.5 = half as fast
    orbs: 12,           // big, very soft blurry lights drifting by
    specks: 200,        // tiny twinkling specks floating upward
    shootingEvery: 5    // about how many seconds between shooting stars (0 = none)
  };

  // On phones and slower devices use fewer (slightly bigger) dots, so it stays smooth
  var LITE = window.innerWidth < 760 || (navigator.hardwareConcurrency || 8) <= 4;
  var DENSITY = LITE ? 0.68 : 1;
  var GLOW = 0.15;                // glow strength (0 = none)

  // Timeline, in seconds. Each kind of flower opens in its own wave.
  var STEM_DUR = 4.5, PAPER_START = 1.0, LEAF_START = 3.0, BUD_START = 5.0, BLUSH_START = 6.5;
  var OPEN = { tulip: 8, rose: 13.5, daisy: 16, hyacinth: 16.5, lily: 18.5 };
  var GAP = { tulip: 0.24, rose: 0.45, daisy: 0.4, hyacinth: 0.5, lily: 1.1 };
  var OPEN_DUR = 3.5, LILY_DUR = 5;
  var BOW_START = 5, BREATH_START = 18, FALL_START = 25;
  var LETTER_AT = 26.5;           // the envelope starts to rise
  var SETTLED_AT = 30;            // after this only the sway and the breeze move

  // The camera
  // The frame is wide enough to show the whole bouquet; the camera starts only
  // slightly closer, so nothing is cut off while it grows
  var VIEW = { cy: 0.58, halfW: 1.1, pitch: 0.34, dist: 5, aspect: 0.74 };
  var ZOOM_START = 1.2, ZOOM_FROM = 0.5, ZOOM_DUR = 18, YAW_START = -0.4, CY_START = 0.42;

  // The shape of the bunch
  var R_DOME = 0.68, Y_BASE = 0.86, DOME_H = 0.44, GROUND = -0.42;

  /* ---------------- small helpers ---------------- */
  var TAU = Math.PI * 2;
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function prog(t, start, dur) { return clamp((t - start) / dur, 0, 1); }
  function smooth(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function easeOut(t) { t = clamp(t, 0, 1); return 1 - Math.pow(1 - t, 3); }
  function easeInOut(t) { t = clamp(t, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function easeOutBack(t) { t = clamp(t, 0, 1); var c = 1.5; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }
  function rgb(hex) { var n = parseInt(hex.slice(1), 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; }
  function mixc(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }

  var seed = 11;
  function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
  function gauss() { return (rnd() + rnd() + rnd() - 1.5) * 1.15; }

  function bez(p, t, out) {                             // a point on a cubic curve through 4 control points
    var u = 1 - t, a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
    out[0] = a * p[0][0] + b * p[1][0] + c * p[2][0] + d * p[3][0];
    out[1] = a * p[0][1] + b * p[1][1] + c * p[2][1] + d * p[3][1];
    out[2] = a * p[0][2] + b * p[1][2] + c * p[2][2] + d * p[3][2];
    return out;
  }

  // Which way a flower faces: u = along its stem, r and f = across its face
  function basis(d) {
    var ul = Math.sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]) || 1;
    var ux = d[0] / ul, uy = d[1] / ul, uz = d[2] / ul;
    var ax = Math.abs(uz) < 0.9 ? 0 : 1, az = Math.abs(uz) < 0.9 ? 1 : 0;
    var rx = -az * uy, ry = az * ux - ax * uz, rz = ax * uy;
    var rl = Math.sqrt(rx * rx + ry * ry + rz * rz) || 1; rx /= rl; ry /= rl; rz /= rl;
    return { rx: rx, ry: ry, rz: rz, ux: ux, uy: uy, uz: uz,
             fx: ry * uz - rz * uy, fy: rz * ux - rx * uz, fz: rx * uy - ry * ux };
  }

  // A petal's centre line: starts at angle a0 and curls further towards the tip
  var K = 12, MR = new Float32Array(K + 1), MH = new Float32Array(K + 1);
  function midrib(L, a0, curl) {
    var ds = L / K, r = 0, h = 0;
    MR[0] = 0; MH[0] = 0;
    for (var i = 1; i <= K; i++) {
      var al = a0 + curl * Math.pow(i / K, 1.6);
      r += Math.sin(al) * ds; h += Math.cos(al) * ds;
      MR[i] = r; MH[i] = h;
    }
  }

  /* ---------------- the frame being drawn ---------------- */
  var T = 0, D = null, N = 0, CAP = 0;
  var VZ = [0, 0, 1];                                   // which way is "towards the viewer", for shading

  function put(x, y, z, r, g, b, s, a) {
    if (N >= CAP) return;
    var o = N * 8;
    D[o] = x; D[o + 1] = y; D[o + 2] = z;
    D[o + 3] = r > 1 ? 1 : r; D[o + 4] = g > 1 ? 1 : g; D[o + 5] = b > 1 ? 1 : b;
    D[o + 6] = s; D[o + 7] = a;
    N++;
  }

  // A light breeze: the higher a point is, the further it drifts
  var SW = [0, 0, 0];
  function sway(x, y, z) {
    var lift = Math.pow(clamp(y / 1.35, 0, 1), 1.5);
    SW[0] = x + lift * (0.012 * Math.sin(T * 0.8 + y * 2) + 0.006 * Math.sin(T * 0.37 + z * 3));
    SW[1] = y;
    SW[2] = z + lift * 0.008 * Math.cos(T * 0.6 + x * 3);
    return SW;
  }

  /* ---------------- building the bouquet (once) ---------------- */
  function buildScene() {
    var S = { stems: [], flowers: [], wax: [], breath: [], leaves: [], paper: null, ribbon: null, fall: null };
    var tulips = 0, roses = 0, daisies = 0, hyacinths = 0;

    function addStem(head, dir, upTo) {                 // from the cut end, through the tie, up to the flower
      var bx = gauss() * 0.03, bz = gauss() * 0.03;
      var pts = [[bx, GROUND, bz], [head[0] * 0.04, 0, head[2] * 0.04],
                 [head[0] * 0.35, head[1] * 0.55, head[2] * 0.35],
                 [head[0] - dir[0] * 0.015, head[1] - dir[1] * 0.015, head[2] - dir[2] * 0.015]];
      var s = [], jx = [], jz = [], tmp = [0, 0, 0];
      for (var i = 0; i < 110; i++) {
        var t = rnd() * (upTo || 1);
        bez(pts, t, tmp);
        if (tmp[1] > 0.03 && tmp[1] < 0.6) continue;   // hidden inside the paper: no need to draw it
        s.push(t); jx.push(gauss() * 0.0035); jz.push(gauss() * 0.0035);
      }
      var stem = { pts: pts, s: s, jx: jx, jz: jz, start: rnd() * 0.6 };
      S.stems.push(stem);
      return stem;
    }

    function petalCloud(count, colourAt, round) {        // dots spread over one petal
      count = Math.round(count * DENSITY);
      var p = { n: count, pu: new Float32Array(count), pv: new Float32Array(count), prof: new Float32Array(count),
                r: new Float32Array(count), g: new Float32Array(count), b: new Float32Array(count) };
      for (var i = 0; i < count; i++) {
        var u = Math.pow(rnd(), 0.85), v = rnd() * 2 - 1;
        p.pu[i] = u; p.pv[i] = v;
        // lily petals taper to a point; tulip petals are broad with a rounded tip
        p.prof[i] = round ? Math.pow(Math.sin(Math.PI * Math.pow(u, 0.5)), 0.55) : Math.pow(Math.sin(Math.PI * Math.pow(u, 0.7)), 0.9);
        var c = colourAt(u, v);
        p.r[i] = c[0]; p.g[i] = c[1]; p.b[i] = c[2];
      }
      return p;
    }

    /* the flowers on the dome, ring by ring (see RINGS at the top) */
    var SLICE = TAU / REPEAT, spots = [];
    RINGS.forEach(function (ring) {
      var n = ring.slice.length;
      for (var s0 = 0; s0 < (ring.once ? 1 : REPEAT); s0++) {
        for (var j0 = 0; j0 < n; j0++) {
          spots.push({ kind: ring.slice[j0], r: ring.r, a: (s0 + ring.turn + j0 / n) * SLICE + 0.3 });
        }
      }
    });

    for (var i = 0; i < spots.length; i++) {
      var kind = spots[i].kind, f0 = spots[i].r * spots[i].r, rad = R_DOME * spots[i].r, ang = spots[i].a;
      var head = [rad * Math.cos(ang), Y_BASE + DOME_H * (1 - f0) + (kind === "lily" ? 0.05 : 0), rad * Math.sin(ang)];
      var dl = Math.sqrt(head[0] * head[0] * 1.44 + 1 + head[2] * head[2] * 1.44);
      var dir = [head[0] * 1.2 / dl, 1 / dl, head[2] * 1.2 / dl];
      var sc = 0.92 + rnd() * 0.16;
      var f = { kind: kind, head: head, dir: dir, sc: sc, stem: addStem(head, dir), spin: rnd() * TAU,
                phase: rnd() * TAU, grow: BUD_START + rnd() * 1.1 };

      if (kind === "tulip") {
        var base = rgb(TULIP_PINKS[tulips++ % TULIP_PINKS.length]);
        var deep = mixc(base, [0.36, 0.06, 0.2], 0.5), light = mixc(base, [1, 1, 1], 0.18);
        f.petals = [];
        for (var k = 0; k < 6; k++) {
          var outer = k % 2 === 0;
          f.petals.push({
            phi: k * Math.PI / 3, L: (outer ? 0.24 : 0.224) * sc, Wm: (outer ? 0.095 : 0.1) * sc,
            ac: outer ? 0.04 : 0.02, ao: outer ? 0.27 : 0.17, cc: outer ? -0.02 : -0.03, co: outer ? 0.1 : 0.04, round: true,
            cloud: petalCloud(outer ? 235 : 200, function (u, v) {
              var c = u < 0.45 ? mixc(deep, base, u / 0.45) : mixc(base, light, (u - 0.45) / 0.55);
              var b = (0.84 + 0.18 * rnd()) * (Math.abs(v) > 0.84 ? 1.25 : Math.abs(v) < 0.1 ? 0.9 : 1) * (outer ? 1 : 1.04);   // bright edges
              return [c[0] * b, c[1] * b, c[2] * b];
            }, true)
          });
        }
      } else if (kind === "lily") {
        f.grow = BUD_START + 0.6 + rnd() * 0.6;
        f.petals = [];
        for (var q = 0; q < 6; q++) {
          var out2 = q % 2 === 0;
          f.petals.push({
            phi: q * Math.PI / 3 + 0.14, L: (out2 ? 0.29 : 0.27) * sc, Wm: (out2 ? 0.062 : 0.068) * sc,
            ac: out2 ? 0.1 : 0.05, ao: out2 ? 1.05 : 0.82, cc: (out2 ? 0.95 : 0.75) * 0.12, co: out2 ? 0.95 : 0.75,
            cloud: petalCloud(260, function (u, v) {     // white, pink towards the centre, with freckles
              var c = mixc(rgb(LILY_CENTRE), rgb(LILY_PETAL), smooth((u - 0.08) / 0.5));
              if (Math.abs(v) < 0.08 && u < 0.7) c = mixc(rgb(LILY_CENTRE), [1, 1, 1], u * 0.6);    // pink stripe down the middle
              else if (rnd() < 0.09 && u < 0.5 && Math.abs(v) < 0.7) c = [0.62, 0.1, 0.32];          // freckles
              var b = (0.86 + 0.2 * rnd()) * (Math.abs(v) > 0.86 ? 1.1 : 1);
              return [c[0] * b, c[1] * b, c[2] * b];
            })
          });
        }
        f.stamens = [];
        for (var m = 0; m < 6; m++) {
          var fu = [], ax2 = [], ay2 = [], ab = [];
          for (var j = 0; j < 22; j++) fu.push(rnd());
          for (var j2 = 0; j2 < 16; j2++) { ax2.push(gauss()); ay2.push(gauss()); ab.push(0.8 + 0.4 * rnd()); }
          f.stamens.push({ phi: m * Math.PI / 3 + 0.66, fu: fu, ax: ax2, ay: ay2, ab: ab });
        }
      } else if (kind === "rose") {
        var rc = rgb(ROSE_COLOURS[roses++ % ROSE_COLOURS.length]);
        f.size = 0.15 * sc;
        f.col = rc; f.deep = mixc(rc, [0.85, 0.42, 0.42], 0.45);   // soft coral shadows
        f.dots = { s: [], a: [], b: [] };
        for (var j3 = 0; j3 < 1500 * DENSITY; j3++) { f.dots.s.push(Math.sqrt(rnd())); f.dots.a.push(rnd() * TAU); f.dots.b.push(0.85 + 0.3 * rnd()); }
      } else if (kind === "hyacinth") {
        f.col = rgb(HYACINTH[hyacinths++ % HYACINTH.length]);
        f.dots = { u: [], a: [], b: [] };
        for (var j9 = 0; j9 < 420 * DENSITY; j9++) { f.dots.u.push(rnd()); f.dots.a.push(rnd() * TAU); f.dots.b.push(0.82 + 0.3 * rnd()); }
      } else {
        f.size = 0.14 * sc;
        f.col = rgb(DAISY_PETALS[daisies++ % DAISY_PETALS.length]);
        f.dots = { k: [], u: [], v: [], b: [] };
        for (var j4 = 0; j4 < 14 * Math.round(42 * DENSITY); j4++) { f.dots.k.push(j4 % 14); f.dots.u.push(rnd()); f.dots.v.push(rnd() * 2 - 1); f.dots.b.push(0.88 + 0.24 * rnd()); }
        f.centre = { r: [], a: [], b: [] };
        for (var j5 = 0; j5 < 200; j5++) { f.centre.r.push(Math.sqrt(rnd())); f.centre.a.push(rnd() * TAU); f.centre.b.push(0.85 + 0.3 * rnd()); }
      }
      S.flowers.push(f);
    }

    // Opening order: one wave per kind (tulips, roses, daisies, then lilies).
    // Within a wave the order is random.
    Object.keys(OPEN).forEach(function (kind) {
      var group = S.flowers.filter(function (f) { return f.kind === kind; });
      for (var a = group.length - 1; a > 0; a--) { var b2 = Math.floor(rnd() * (a + 1)), t2 = group[a]; group[a] = group[b2]; group[b2] = t2; }
      group.forEach(function (f, rank) {
        f.openAt = OPEN[kind] + rank * GAP[kind] + rnd() * 0.2;
        f.maxOpen = kind === "tulip" ? 0.82 + rnd() * 0.18 : 1;
        f.blush = 1;
      });
    });
    S.flowers.sort(function (p, q) { return p.head[1] - q.head[1]; });

    /* The gaps between the big flowers.
       Try many points across one slice and keep, one at a time, the point that is
       farthest from every flower and filler already placed; then copy it into
       every slice, so the fillers repeat all the way round like the flowers. */
    var taken = S.flowers.map(function (f) { return [f.head[0], f.head[2]]; });
    var tries = [];
    for (var c0 = 0; c0 < 160; c0++) {
      var cr0 = R_DOME * 1.02 * Math.sqrt((c0 + 0.5) / 160), ca0 = 0.3 + ((c0 * 0.618034) % 1) * SLICE;
      tries.push([cr0 * Math.cos(ca0), cr0 * Math.sin(ca0)]);
    }
    function roomAt(p) {
      var best = 1e9;
      for (var q = 0; q < taken.length; q++) {
        var dx = p[0] - taken[q][0], dz = p[1] - taken[q][1], d2 = dx * dx + dz * dz;
        if (d2 < best) best = d2;
      }
      return best;
    }
    function gapSpots(perSlice) {
      var out = [];
      for (var g = 0; g < perSlice; g++) {
        var pick = 0, most = -1;
        for (var c1 = 0; c1 < tries.length; c1++) { var room = roomAt(tries[c1]); if (room > most) { most = room; pick = c1; } }
        for (var sl = 0; sl < REPEAT; sl++) {
          var ra = sl * SLICE, x = tries[pick][0], z = tries[pick][1];
          var spot = [x * Math.cos(ra) - z * Math.sin(ra), x * Math.sin(ra) + z * Math.cos(ra)];
          taken.push(spot); out.push(spot);
        }
      }
      return out;
    }

    /* waxflowers: little clusters of star blossoms */
    var florets = LITE ? 6 : 8, waxSpots = gapSpots(WAXFLOWERS);
    for (var w = 0; w < waxSpots.length; w++) {
      var px0 = waxSpots[w][0], pz0 = waxSpots[w][1];
      var rr0 = Math.min(1, Math.sqrt(px0 * px0 + pz0 * pz0) / R_DOME);
      var wl = Math.sqrt(px0 * px0 * 1.44 + 1 + pz0 * pz0 * 1.44);
      var cluster = { x: px0, y: Y_BASE + DOME_H * (1 - rr0 * rr0) + 0.03, z: pz0,
                      B: basis([px0 * 1.2 / wl, 1 / wl, pz0 * 1.2 / wl]), start: OPEN.daisy - 1.5 + rnd() * 3, florets: [] };
      for (var fw = 0; fw < florets; fw++) {
        var dots = [], turn = rnd() * TAU;
        for (var pt = 0; pt < 5; pt++) {                   // five little petals
          var pa2 = turn + pt * TAU / 5;
          [0.007, 0.012, 0.017, 0.021].forEach(function (pr2) { dots.push([Math.cos(pa2) * pr2, Math.sin(pa2) * pr2, 0]); });
          dots.push([Math.cos(pa2 + 0.25) * 0.014, Math.sin(pa2 + 0.25) * 0.014, 0], [Math.cos(pa2 - 0.25) * 0.014, Math.sin(pa2 - 0.25) * 0.014, 0]);
        }
        dots.push([0, 0, 1], [0.002, 0.001, 1], [-0.002, -0.001, 1]);   // the dark centre
        cluster.florets.push({ ox: gauss() * 0.036, oz: gauss() * 0.036, oy: rnd() * 0.025,
                               col: rgb(WAXFLOWER[Math.floor(rnd() * WAXFLOWER.length)]), dots: dots });
      }
      S.wax.push(cluster);
    }

    /* baby's breath: little white clouds in the gaps that are left */
    var breathSpots = gapSpots(BREATH_CLUSTERS);
    for (var c2 = 0; c2 < breathSpots.length; c2++) {
      var bx2 = breathSpots[c2][0], bz2 = breathSpots[c2][1], cf = Math.min(1, (bx2 * bx2 + bz2 * bz2) / (R_DOME * R_DOME));
      var cl = { x: bx2, y: Y_BASE + DOME_H * (1 - cf) + 0.05, z: bz2, dots: [], start: BREATH_START + c2 * 0.15 };
      for (var fl = 0; fl < 14; fl++) {
        var ox = gauss() * 0.03, oy = gauss() * 0.022, oz = gauss() * 0.03;
        for (var dd = 0; dd < 5; dd++) cl.dots.push([ox + gauss() * 0.004, oy + gauss() * 0.004, oz + gauss() * 0.004]);
      }
      S.breath.push(cl);
    }
    for (var c3 = 0; c3 < REPEAT * 2; c3++) {            // a lower ring, tucked against the tissue
      var la3 = c3 * TAU / (REPEAT * 2) + 0.4, lr3 = 0.5 + rnd() * 0.06;
      var low = { x: lr3 * Math.cos(la3), y: 0.8 + rnd() * 0.05, z: lr3 * Math.sin(la3), dots: [], start: BREATH_START + 0.4 + c3 * 0.12 };
      for (var fl3 = 0; fl3 < 12; fl3++) {
        var ox3 = gauss() * 0.032, oy3 = gauss() * 0.02, oz3 = gauss() * 0.032;
        for (var d3 = 0; d3 < 5; d3++) low.dots.push([ox3 + gauss() * 0.004, oy3 + gauss() * 0.004, oz3 + gauss() * 0.004]);
      }
      S.breath.push(low);
    }

    /* leaves: an outer collar around the bunch, and an inner ring rising between the tissue and the flowers */
    for (var lv = 0; lv < 17; lv++) {
      var inner = lv >= 9, th = inner ? (lv - 9) * TAU / 8 + 0.55 : lv * TAU / 9 + 0.2;
      var el = inner ? 0.85 + rnd() * 0.25 : 0.35 + rnd() * 0.25;
      var leaf = { th: th, el: el, L: (inner ? 0.24 : 0.28) + rnd() * 0.06, W: 0.05 + rnd() * 0.01, start: LEAF_START + (lv % 9) * 0.1 + (inner ? 0.5 : 0),
                   br: inner ? 0.28 : 0.4, by: inner ? 0.7 : 0.76,
                   u: new Float32Array(340), v: new Float32Array(340), prof: new Float32Array(340), r: new Float32Array(340), g: new Float32Array(340), b: new Float32Array(340) };
      for (var j7 = 0; j7 < 340; j7++) {
        var u7 = Math.pow(rnd(), 0.9), v7 = rnd() * 2 - 1, br = 0.8 + 0.4 * rnd();
        leaf.u[j7] = u7; leaf.v[j7] = v7; leaf.prof[j7] = Math.pow(Math.sin(Math.PI * Math.pow(u7, 0.8)), 0.8);
        var lc = Math.abs(v7) < 0.08 ? [0.75, 0.94, 0.67] : [lerp(40, 140, u7) / 255, lerp(160, 235, u7) / 255, lerp(100, 140, u7) / 255];
        leaf.r[j7] = lc[0] * br; leaf.g[j7] = lc[1] * br; leaf.b[j7] = lc[2] * br;
      }
      S.leaves.push(leaf);
    }

    /* the wrapping, in three layers, drawn densely enough to read as paper:
       tissue paper ruffled up inside, the pleated paper cone, and three folded flaps over it */
    function wrapLayer(kind, n, colour, rOff, size, centre, half) {
      n = Math.round(n * DENSITY);
      var L = { kind: kind, n: n, c: rgb(colour), rOff: rOff, size: size, centre: centre || 0, half: half || Math.PI,
                u: new Float32Array(n), th: new Float32Array(n), b: new Float32Array(n) };
      for (var i2 = 0; i2 < n; i2++) {
        L.u[i2] = Math.sqrt(rnd());                      // more dots higher up, where the cone is wider
        L.th[i2] = half ? centre + (rnd() * 2 - 1) * half : rnd() * TAU;
        L.b[i2] = 0.86 + 0.24 * rnd();
      }
      return L;
    }
    S.paper = [wrapLayer("tissue", 5000, TISSUE, -0.03, 1.55), wrapLayer("cone", 9500, PAPER, 0, 2.05)];
    for (var fp2 = 0; fp2 < 3; fp2++) S.paper.push(wrapLayer("flap", 2100, PAPER_FLAP, 0.024, 2.1, fp2 * TAU / 3 + 0.5, 0.95));

    /* the ribbon: a band around the tie, a bow at the front and two tails */
    var rb = { band: [], bow: [], tails: [] };
    for (var r1 = 0; r1 < 520; r1++) rb.band.push([rnd() * TAU, rnd() * TAU, 0.85 + 0.3 * rnd()]);
    for (var r2 = 0; r2 < 440; r2++) rb.bow.push([r2 % 2 ? 1 : -1, rnd() * TAU, gauss() * 0.006, 0.85 + 0.3 * rnd()]);
    for (var r3 = 0; r3 < 180; r3++) rb.tails.push([r3 % 2 ? 1 : -1, rnd(), gauss() * 0.008, 0.85 + 0.3 * rnd()]);
    S.ribbon = rb;

    /* petals and sparks that drift down once it has bloomed */
    var fall = [];
    var openers = S.flowers.filter(function (f) { return f.kind === "tulip" || f.kind === "lily"; });
    for (var fp = 0; fp < 80; fp++) {
      fall.push({ from: openers[Math.floor(rnd() * openers.length)], off: rnd(), sp: 0.05 + rnd() * 0.06,
                  dx: gauss() * 0.25, dz: gauss() * 0.25, ph: rnd() * TAU, gold: rnd() < 0.35 });
    }
    S.fall = fall;

    /* the galaxy pool: a bright middle, spiral arms, and loose dust around them */
    var pool = { r: [], a: [], y: [], c: [], s: [], ph: [], star: [] };
    var poolCols = POOL_COLOURS.map(rgb);
    for (var pd = 0; pd < Math.round(3200 * DENSITY); pd++) {
      var kindP = rnd(), pr, pa;
      if (kindP < 0.15) { pr = Math.abs(gauss()) * 0.07; pa = rnd() * TAU; }                 // the bright middle
      else if (kindP < 0.8) {                                                                // the arms
        var tA = Math.pow(rnd(), 0.75);
        pr = 0.04 + tA * POOL_SIZE;
        pa = Math.floor(rnd() * POOL_ARMS) * TAU / POOL_ARMS + pr * 5.5 + gauss() * (0.12 + 0.25 * tA);
      } else { pr = POOL_SIZE * Math.sqrt(rnd()) * 1.05; pa = rnd() * TAU; }               // loose dust
      var pt2 = clamp(pr / POOL_SIZE, 0, 1) * (poolCols.length - 1), pi2 = Math.min(poolCols.length - 2, Math.floor(pt2));
      var star = rnd() < 0.05;
      pool.r.push(pr); pool.a.push(pa); pool.y.push(gauss() * 0.006);
      pool.c.push(star ? [1, 1, 1] : mixc(poolCols[pi2], poolCols[pi2 + 1], pt2 - pi2));
      pool.s.push(star ? 2.2 : 1.2 + rnd() * 0.7); pool.ph.push(rnd() * TAU); pool.star.push(star);
    }
    S.pool = pool;
    return S;
  }

  /* ---------------- drawing each part ---------------- */
  var green = [0.56, 0.75, 0.29], dusty = [0.85, 0.63, 0.68], stemCol = rgb(STEM);
  var tmp = [0, 0, 0];

  function stemProgress(stem) { return easeInOut(prog(T, stem.start, STEM_DUR)); }

  function drawStems(S) {
    for (var i = 0; i < S.stems.length; i++) {
      var st = S.stems[i], g = stemProgress(st), w = st.width || 1;
      for (var j = 0; j < st.s.length; j++) {
        var s = st.s[j];
        if (s > g) continue;
        bez(st.pts, s, tmp);
        var p = sway(tmp[0] + st.jx[j], tmp[1], tmp[2] + st.jz[j]);
        var b = 0.75 + 0.35 * s;
        put(p[0], p[1], p[2], stemCol[0] * b, stemCol[1] * b, stemCol[2] * b, 1.5 * w, 1);
      }
    }
  }

  // Where a flower is this frame, and how brightly lit it is
  function flowerFrame(f) {
    var p = sway(f.head[0], f.head[1], f.head[2]);
    f.hx = p[0]; f.hy = p[1]; f.hz = p[2];
    var tilt = Math.sin(T * 0.7 + f.phase) * 0.03;
    f.B = basis([f.dir[0] + tilt, f.dir[1], f.dir[2] - tilt * 0.6]);
    f.depth = 0.84 + 0.16 * clamp((VZ[0] * f.hx + VZ[1] * f.hy + VZ[2] * f.hz) / 0.6 * 0.5 + 0.5, 0, 1);
  }

  function stage(f) {
    if (stemProgress(f.stem) < 0.97) return null;
    var rev = smooth((T - f.grow) / 1.6);
    if (rev <= 0.01) return null;
    return {
      rev: rev,
      blush: smooth((T - BLUSH_START - (f.grow - BUD_START)) / 2.4) * f.blush,
      e: easeInOut(prog(T, f.openAt, f.kind === "lily" ? LILY_DUR : OPEN_DUR)) * f.maxOpen
    };
  }

  // Turn a dot's position on the flower into a position in the scene
  function placeLocal(f, X, Y, Z) {
    var B = f.B;
    tmp[0] = f.hx + B.rx * X + B.ux * Y + B.fx * Z;
    tmp[1] = f.hy + B.ry * X + B.uy * Y + B.fy * Z;
    tmp[2] = f.hz + B.rz * X + B.uz * Y + B.fz * Z;
    return tmp;
  }
  function facing(f, L) {                              // the part of the flower nearer the viewer is brighter
    var lz = VZ[0] * (tmp[0] - f.hx) + VZ[1] * (tmp[1] - f.hy) + VZ[2] * (tmp[2] - f.hz);
    return (0.74 + 0.26 * clamp(lz / L * 0.9 + 0.5, 0, 1)) * f.depth;
  }

  function drawPetals(f, s, lily) {
    for (var k = 0; k < f.petals.length; k++) {
      var P = f.petals[k], cl = P.cloud;
      var Ls = P.L * (0.35 + 0.65 * s.rev) * (lily ? 0.45 + 0.55 * s.e : 0.78 + 0.22 * s.e);
      midrib(Ls, lerp(P.ac, P.ao, s.e), lerp(P.cc, P.co, s.e));
      var cp = Math.cos(P.phi + f.spin * (lily ? 0 : 1)), sp = Math.sin(P.phi + f.spin * (lily ? 0 : 1));
      var widK = P.Wm * (lily ? 0.55 + 0.45 * s.e : 0.6 + 0.4 * s.e) * (0.35 + 0.65 * s.rev);
      var cup = lily ? 0.3 * (1 - s.e) - 0.25 * s.e : 0.32 * (1 - s.e) + 0.2 * s.e;
      var toPetal = smooth(s.e / 0.4);
      for (var i = 0; i < cl.n; i++) {
        var u = cl.pu[i];
        if (u > s.rev) continue;
        var x = u * K, i0 = x | 0, fr = x - i0;
        if (i0 >= K) { i0 = K - 1; fr = 1; }
        var rr = MR[i0] + (MR[i0 + 1] - MR[i0]) * fr, hh = MH[i0] + (MH[i0 + 1] - MH[i0]) * fr;
        var v = cl.pv[i], wid = widK * cl.prof[i];
        var X = rr * cp - v * wid * sp, Z = rr * sp + v * wid * cp, Y = hh + v * v * wid * cup;
        placeLocal(f, X, Y, Z);
        var sh = facing(f, P.L);
        var r, g, b;
        if (lily) {                                    // green bud, then the petal colours come through
          var tint = (1 - s.e) * clamp(u * 1.3, 0, 1) * 0.6;
          r = lerp(cl.r[i], 0.53, tint); g = lerp(cl.g[i], 0.8, tint); b = lerp(cl.b[i], 0.49, tint);
        } else {                                       // green, then dusty pink, then its own pink
          var bud0 = lerp(green[0], dusty[0], s.blush), bud1 = lerp(green[1], dusty[1], s.blush), bud2 = lerp(green[2], dusty[2], s.blush);
          var lift = 0.85 + 0.3 * u;
          r = lerp(bud0 * lift, cl.r[i], toPetal); g = lerp(bud1 * lift, cl.g[i], toPetal); b = lerp(bud2 * lift, cl.b[i], toPetal);
        }
        put(tmp[0], tmp[1], tmp[2], r * sh, g * sh, b * sh, 2.0, 1);
      }
    }
  }

  function drawStamens(f, s) {
    if (s.e <= 0.28) return;
    var sr = smooth((s.e - 0.28) / 0.4);
    var Ls = 0.17 * f.sc * (0.4 + 0.6 * s.e) * sr;
    midrib(Ls, lerp(0.15, 0.62, s.e), 0.55 * s.e);
    for (var k = 0; k < f.stamens.length; k++) {
      var st = f.stamens[k], cp = Math.cos(st.phi), sp = Math.sin(st.phi);
      for (var i = 0; i < st.fu.length; i++) {           // the filament
        var x = st.fu[i] * K, i0 = Math.min(K - 1, x | 0), fr = x - i0;
        var rr = MR[i0] + (MR[i0 + 1] - MR[i0]) * fr, hh = MH[i0] + (MH[i0 + 1] - MH[i0]) * fr;
        placeLocal(f, rr * cp, hh, rr * sp);
        put(tmp[0], tmp[1], tmp[2], 0.96 * f.depth, 0.92 * f.depth, 0.78 * f.depth, 1.2, 1);
      }
      for (var j = 0; j < st.ax.length; j++) {           // the orange anther at its tip
        placeLocal(f, MR[K] * cp + st.ax[j] * 0.006, MH[K] + st.ay[j] * 0.003, MR[K] * sp + st.ax[j] * 0.004);
        var ab = st.ab[j];
        put(tmp[0], tmp[1], tmp[2], 1 * ab, 0.59 * ab, 0.16 * ab, 1.6, 1);
      }
    }
  }

  function drawRose(f, s) {
    var R = f.size * (0.45 + 0.55 * s.e) * (0.3 + 0.7 * s.rev), d = f.dots;
    var toPetal = smooth(s.e / 0.35);
    var bud = [lerp(green[0], dusty[0], s.blush), lerp(green[1], dusty[1], s.blush), lerp(green[2], dusty[2], s.blush)];
    for (var i = 0; i < d.s.length; i++) {
      var sv = d.s[i];
      if (sv > 0.35 + 0.65 * s.rev) continue;
      var a = d.a[i] + f.spin;
      var Y = 0.06 * f.sc * Math.pow(1 - sv, 1.2) * (1 - 0.35 * s.e) + 0.05 * s.e * sv * sv;   // a cupped bowl, tight in the middle
      placeLocal(f, R * sv * Math.cos(a), Y, R * sv * Math.sin(a));
      // dark lines spiralling in where one petal tucks under the next
      var line = (d.a[i] * 5 / TAU + sv * 2.6) % 1, edge = Math.min(line, 1 - line);
      var bright = (0.52 + 0.48 * smooth(edge * 5)) * d.b[i] * (sv > 0.9 ? 1.12 : 1);
      var c = mixc(f.col, f.deep, 0.55 * (1 - sv));
      var sh = facing(f, f.size) * bright;
      put(tmp[0], tmp[1], tmp[2], lerp(bud[0], c[0], toPetal) * sh, lerp(bud[1], c[1], toPetal) * sh, lerp(bud[2], c[2], toPetal) * sh, 1.9, 1);
    }
  }

  function drawDaisy(f, s) {
    var R = f.size * (0.4 + 0.6 * s.rev), d = f.dots;
    var open = easeOutBack(s.e), el = lerp(1.35, 0.12, open);      // petals fold up in bud, then fan out flat
    var ce = Math.cos(el), se = Math.sin(el), toPetal = smooth(s.e / 0.5);
    for (var i = 0; i < d.k.length; i++) {
      var th = d.k[i] * TAU / 14 + f.spin, u = d.u[i], v = d.v[i];
      var rr = R * (0.3 + 0.7 * u), w = v * 0.12 * R * Math.pow(Math.sin(Math.PI * u), 0.6);
      var ct = Math.cos(th), st = Math.sin(th);
      placeLocal(f, ct * ce * rr - st * w, se * rr + 0.01 * u * u, st * ce * rr + ct * w);
      var c = mixc(f.col, [1, 0.9, 0.7], (1 - u) * 0.2);
      var sh = facing(f, f.size) * d.b[i];
      put(tmp[0], tmp[1], tmp[2], lerp(0.7, c[0], toPetal) * sh, lerp(0.85, c[1], toPetal) * sh, lerp(0.55, c[2], toPetal) * sh, 1.9, 1);
    }
    var cc = f.centre;
    for (var j = 0; j < cc.r.length; j++) {              // the golden centre
      var r = cc.r[j] * 0.3 * R, a = cc.a[j];
      placeLocal(f, r * Math.cos(a), 0.05 * R * (1 - cc.r[j] * cc.r[j]) + 0.01, r * Math.sin(a));
      var y = cc.r[j] > 0.62 ? [0.85, 0.59, 0.17] : [0.95, 0.76, 0.31];
      var g2 = toPetal, b2 = cc.b[j] * f.depth;
      put(tmp[0], tmp[1], tmp[2], lerp(0.56, y[0], g2) * b2, lerp(0.75, y[1], g2) * b2, lerp(0.29, y[2], g2) * b2, 2.0, 1);
    }
  }

  // A hyacinth: a chunky spike of little lilac florets
  function drawHyacinth(f, s) {
    var d = f.dots, len = 0.22 * f.sc * (0.35 + 0.65 * s.rev);
    var front = Math.atan2(VZ[2], VZ[0]);
    for (var i = 0; i < d.u.length; i++) {
      var u = d.u[i];
      if (u > s.rev) continue;
      var a = d.a[i];
      var r = (0.03 + 0.012 * Math.abs(Math.sin(a * 3 + u * 40))) * (1 - 0.45 * u) * (0.6 + 0.4 * s.e);   // bumpy florets
      placeLocal(f, r * Math.cos(a), 0.02 + u * len, r * Math.sin(a));
      var lit = (0.8 + 0.2 * Math.cos(a - front)) * d.b[i] * f.depth;
      put(tmp[0], tmp[1], tmp[2], lerp(0.5, f.col[0], s.e) * lit, lerp(0.7, f.col[1], s.e) * lit, lerp(0.35, f.col[2], s.e) * lit, 2.0, 1);
    }
  }

  // Waxflowers: clusters of tiny five-petal blossoms
  var waxCentre = rgb(WAXFLOWER_CENTRE);
  function drawWaxflowers(S) {
    for (var i = 0; i < S.wax.length; i++) {
      var c = S.wax[i], k = easeOut(prog(T, c.start, 1.8));
      if (!k) continue;
      var p = sway(c.x, c.y, c.z), px = p[0], py = p[1], pz = p[2], B = c.B;
      var lit = 0.82 + 0.18 * clamp((VZ[0] * px + VZ[1] * py + VZ[2] * pz) / 0.6 * 0.5 + 0.5, 0, 1);
      for (var j = 0; j < c.florets.length; j++) {
        var fl = c.florets[j];
        var bx = px + (B.rx * fl.ox + B.fx * fl.oz) * k + B.ux * fl.oy;
        var by = py + (B.ry * fl.ox + B.fy * fl.oz) * k + B.uy * fl.oy;
        var bz = pz + (B.rz * fl.ox + B.fz * fl.oz) * k + B.uz * fl.oy;
        for (var m = 0; m < fl.dots.length; m++) {
          var d = fl.dots[m], col = d[2] ? waxCentre : fl.col;
          put(bx + (B.rx * d[0] + B.fx * d[1]) * k, by + (B.ry * d[0] + B.fy * d[1]) * k, bz + (B.rz * d[0] + B.fz * d[1]) * k,
              col[0] * lit, col[1] * lit, col[2] * lit, 1.8, k);
        }
      }
    }
  }

  function drawBreath(S) {
    for (var i = 0; i < S.breath.length; i++) {
      var c = S.breath[i], k = easeOut(prog(T, c.start, 1.5));
      if (!k) continue;
      var p = sway(c.x, c.y, c.z), px = p[0], py = p[1], pz = p[2];
      for (var j = 0; j < c.dots.length; j++) {
        var o = c.dots[j], tw = 0.88 + 0.12 * Math.sin(T * 2.4 + j);
        put(px + o[0] * k, py + o[1] * k, pz + o[2] * k, 0.99 * tw, 0.96 * tw, 0.97 * tw, 1.25, k);
      }
    }
  }

  function drawLeaves(S) {
    for (var i = 0; i < S.leaves.length; i++) {
      var lf = S.leaves[i], lg = easeOut(prog(T, lf.start, 2.2));
      if (!lg) continue;
      var th = lf.th, ce = Math.cos(lf.el), se = Math.sin(lf.el);
      var dx = Math.cos(th) * ce, dy = se, dz = Math.sin(th) * ce, tx = -Math.sin(th), tz = Math.cos(th);
      var bx = lf.br * Math.cos(th), by = lf.by, bz = lf.br * Math.sin(th), L = lf.L * lg;
      for (var j = 0; j < lf.u.length; j++) {
        var along = L * lf.u[j], w = lf.v[j] * lf.W * lf.prof[j] * lg, droop = 0.35 * along * along / lf.L;
        var p = sway(bx + dx * along + tx * w, by + dy * along - droop + Math.abs(lf.v[j]) * 0.01, bz + dz * along + tz * w);
        var lz = VZ[0] * p[0] + VZ[1] * p[1] + VZ[2] * p[2], sh = 0.68 + 0.32 * clamp(lz / 0.6 * 0.5 + 0.5, 0, 1);
        put(p[0], p[1], p[2], lf.r[j] * sh, lf.g[j] * sh, lf.b[j] * sh, 1.45, 1);
      }
    }
  }

  function coneRadius(y) { return 0.055 + 0.47 * Math.pow(clamp(y / 0.85, 0, 1.25), 0.9); }

  function drawPaper(S) {
    var rev = easeOut(prog(T, PAPER_START, 2.6)), tissueRev = easeOut(prog(T, PAPER_START + 0.7, 2.6));
    if (!rev) return;
    // a soft band of light that sweeps slowly back and forth across the front of the paper
    var front = Math.atan2(VZ[2], VZ[0]), glint = front + 0.75 * Math.sin(T * 0.3);
    for (var l = 0; l < S.paper.length; l++) {
      var P = S.paper[l], tissue = P.kind === "tissue", flap = P.kind === "flap";
      var reveal = tissue ? tissueRev : rev;
      for (var i = 0; i < P.n; i++) {
        var u = P.u[i];
        if (u > reveal) continue;
        var th = P.th[i], top, edge = 1;
        if (tissue) {                                    // a soft ruffled edge, peeking above the paper
          top = 0.86 + 0.05 * Math.sin(th * 9 + 0.6 * Math.sin(th * 4));
        } else if (flap) {                               // a pointed flap, highest in its middle
          var d = Math.abs(th - P.centre) / P.half;
          top = 0.6 + 0.25 * (1 - d);
          if (d > 0.94) edge = 1.28;                     // light catching its folded sides
        } else {                                         // the cone: six softly pointed tips
          var f6 = (th * 6 / TAU) % 1;
          top = 0.66 + 0.15 * (1 - Math.abs(2 * f6 - 1));
        }
        var y = 0.03 + u * (top - 0.03);
        var r = coneRadius(y) + P.rOff * u + (tissue ? 0.022 * Math.pow(u, 4) * Math.sin(th * 9) : 0);
        var ct = Math.cos(th), st = Math.sin(th), x = r * ct, z = r * st;

        var facingV = VZ[0] * ct * 0.9 + VZ[2] * st * 0.9 - VZ[1] * 0.4;
        var sh = 0.4 + 0.6 * clamp(facingV * 0.7 + 0.45, 0, 1);
        var pleat = tissue ? 0.85 + 0.15 * Math.cos(th * 23) : 0.78 + 0.22 * Math.cos(th * 14);
        var depthGrad = 0.5 + 0.5 * u;                   // deeper in shadow down by the tie
        if (u > 0.965) edge *= tissue ? 1.15 : 1.32;     // a bright rim along the top edge
        var k = sh * pleat * depthGrad * edge * P.b[i];
        var gl = 0;
        if (!tissue) {
          var dth = Math.atan2(Math.sin(th - glint), Math.cos(th - glint));
          gl = 0.4 * Math.exp(-dth * dth / 0.025) * smooth(u / 0.35) * clamp(facingV + 0.2, 0, 1);
        }
        put(x, y, z, P.c[0] * k + gl, P.c[1] * k + gl * 0.9, P.c[2] * k + gl * 0.95, P.size, 1);
      }
    }
  }

  function drawRibbon(S) {
    var k = easeOutBack(prog(T, BOW_START, 1.6));
    if (k <= 0.01) return;
    var rb = S.ribbon, c = rgb(RIBBON), knot = [0.95, 0.55, 0.7], y0 = 0.06, R = 0.075;
    function dot(x, y, z, col, b) {
      var lz = VZ[0] * x + VZ[1] * y + VZ[2] * z, sh = (0.7 + 0.3 * clamp(lz / 0.15 * 0.5 + 0.5, 0, 1)) * b;
      put(x, y, z, col[0] * sh, col[1] * sh, col[2] * sh, 1.4, 1);
    }
    for (var i = 0; i < rb.band.length; i++) {          // the band around the stems
      var q = rb.band[i], tr = 0.016 * Math.cos(q[1]);
      dot((R + tr) * Math.cos(q[0]), y0 + 0.016 * Math.sin(q[1]) * 1.4, (R + tr) * Math.sin(q[0]), c, q[2]);
    }
    for (var j = 0; j < rb.bow.length; j++) {            // two loops at the front
      var b = rb.bow[j], side = b[0], a = b[1];
      var lx = side * (0.06 + 0.06 * Math.cos(a)) * k, ly = y0 + 0.012 + 0.035 * Math.sin(a) * k + side * 0.004;
      dot(lx, ly, R + 0.012 + b[2] + 0.01 * Math.cos(a), c, b[3]);
    }
    for (var m = 0; m < rb.tails.length; m++) {          // two tails hanging down
      var tl = rb.tails[m], u = tl[1] * k;
      dot(tl[0] * (0.01 + 0.07 * u) + tl[2], y0 - 0.2 * u, R + 0.02 + 0.015 * u, c, tl[3]);
    }
    for (var n = 0; n < 50; n++) {                       // the knot
      var ang = n * 2.39996;
      dot(0.012 * Math.cos(ang), y0 + 0.012 + 0.01 * Math.sin(ang), R + 0.022, knot, 1);
    }
  }

  function drawFall(S) {
    var fa = smooth(prog(T, FALL_START, 3));
    if (!fa) return;
    for (var i = 0; i < S.fall.length; i++) {
      var p = S.fall[i], q = (T * p.sp + p.off) % 1, from = p.from;
      var x = from.head[0] + p.dx * q + Math.sin(q * 7 + p.ph) * 0.035;
      var y = from.head[1] - q * 1.35;
      var z = from.head[2] + p.dz * q + Math.cos(q * 5 + p.ph) * 0.03;
      var fade = (1 - q) * fa;
      if (p.gold) put(x, y, z, 1, 0.75, 0.31, 2.1, fade);
      else put(x, y, z, 1, 0.59, 0.8, 2.4, fade);
    }
  }

  // The galaxy pool: spreads out first, then swirls slowly, with soft ripples running outward
  function drawPool(S) {
    var reveal = easeOut(prog(T, 0, 3.5));
    if (!reveal) return;
    var P = S.pool, reach = reveal * POOL_SIZE * 1.1, spin = T * POOL_SPIN, y0 = GROUND - 0.03;
    for (var i = 0; i < P.r.length; i++) {
      var r = P.r[i];
      if (r > reach) continue;
      var a = P.a[i] - spin * (1.4 - r);                // the middle turns a little faster than the edge
      var wave = Math.sin(r * 24 - T * 1.8);            // ripples
      var edge = 1 - smooth((r - POOL_SIZE * 0.75) / (POOL_SIZE * 0.35));
      var k = (0.55 + 0.45 * (1 - r / POOL_SIZE)) * (0.85 + 0.15 * wave) * edge;
      if (P.star[i]) k *= 0.6 + 0.4 * Math.sin(T * 2.5 + P.ph[i]);   // stars twinkle
      var c = P.c[i];
      put(r * Math.cos(a), y0 + P.y[i] + 0.006 * wave * (1 - r / POOL_SIZE), r * Math.sin(a),
          c[0] * k, c[1] * k, c[2] * k, P.s[i], clamp(k, 0, 1) * smooth((reach - r) / 0.1));
    }
  }

  var poolStart = 0;              // the pool's dots come last and get no dark shadow behind them

  function drawScene(S) {
    N = 0;
    drawPaper(S);
    drawStems(S);
    drawLeaves(S);
    drawRibbon(S);
    for (var i = 0; i < S.flowers.length; i++) {
      var f = S.flowers[i], s = stage(f);
      if (!s) continue;
      flowerFrame(f);
      if (f.kind === "tulip") drawPetals(f, s, false);
      else if (f.kind === "lily") { drawPetals(f, s, true); drawStamens(f, s); }
      else if (f.kind === "rose") drawRose(f, s);
      else if (f.kind === "hyacinth") drawHyacinth(f, s);
      else drawDaisy(f, s);
    }
    drawWaxflowers(S);
    drawBreath(S);
    drawFall(S);
    poolStart = N;
    drawPool(S);
  }

  /* ---------------- the dreamy sky behind the scene ----------------
     Four layers on one flat canvas: big soft blurry lights, tiny specks floating
     up, glowing stars falling slowly like rain, and now and then a shooting star.
     It fades in over the first few seconds. */
  function startDust(stageEl) {
    var canvas = document.getElementById("finale-dust");
    var ctx = canvas && canvas.getContext && canvas.getContext("2d");
    if (!ctx || Site.reducedMotion) { if (canvas) canvas.hidden = true; return function () {}; }
    var W = 0, H = 0, last = 0, born = -1, R = Math.random, fewer = LITE ? 0.6 : 1;

    // A soft round glow for each colour, drawn once and reused
    var glows = SKY.colours.map(function (hex) {
      var c = rgb(hex).map(function (v) { return Math.round(v * 255); }).join(",");
      var g = document.createElement("canvas"); g.width = g.height = 64;
      var gx = g.getContext("2d"), grad = gx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, "rgba(255,255,255,1)");
      grad.addColorStop(0.12, "rgba(" + c + ",0.95)");
      grad.addColorStop(0.35, "rgba(" + c + ",0.28)");
      grad.addColorStop(1, "rgba(" + c + ",0)");
      gx.fillStyle = grad; gx.fillRect(0, 0, 64, 64);
      return { img: g, rgb: c };
    });
    function pickGlow() { return Math.floor(R() * glows.length); }

    var specks = [], rain = [], orbs = [], shooting = [], nextShot = 3;
    for (var i = 0; i < SKY.specks * fewer; i++) specks.push({ x: R(), y: R(), sp: 0.004 + R() * 0.012, ph: R() * TAU, f: 1 + R() * 3, s: R() < 0.15 ? 2 : 1.2 });
    for (var j = 0; j < SKY.rain * fewer; j++) {
      rain.push({ x: R(), y: R(), sp: (0.025 + R() * 0.05) * SKY.rainSpeed, size: 6 + R() * 12, g: pickGlow(),
                  sway: 0.004 + R() * 0.012, ph: R() * TAU, f: 0.6 + R() * 1.6, trail: R() < 0.45 });
    }
    for (var k = 0; k < SKY.orbs * fewer; k++) {
      orbs.push({ x: R(), y: R(), sp: 0.004 + R() * 0.008, size: 50 + R() * 110, g: pickGlow(), ph: R() * TAU, a: 0.05 + R() * 0.07 });
    }

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = stageEl.clientWidth; H = stageEl.clientHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();

    function glowAt(gi, x, y, size, alpha) {
      if (alpha <= 0.01) return;
      ctx.globalAlpha = Math.min(1, alpha);
      ctx.drawImage(glows[gi].img, x - size / 2, y - size / 2, size, size);
    }

    return function draw(now, t) {
      if (now - last < 33) return;                        // about 30 frames a second
      var dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (born < 0) born = t;
      var fade = smooth((t - born) / 6);                  // fade in over 6 seconds
      if (W !== stageEl.clientWidth || H !== stageEl.clientHeight) resize();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";           // lights add up, like real glow

      // 1. big soft blurry lights, drifting down very slowly and breathing
      for (var o = 0; o < orbs.length; o++) {
        var ob = orbs[o], oy = ((ob.y + t * ob.sp) % 1.2) - 0.1;
        var ox = ob.x + Math.sin(t * 0.15 + ob.ph) * 0.04;
        glowAt(ob.g, ox * W, oy * H, ob.size, ob.a * (0.7 + 0.3 * Math.sin(t * 0.5 + ob.ph)) * fade);
      }

      // 2. tiny specks floating up, twinkling
      ctx.globalCompositeOperation = "source-over";
      for (var s = 0; s < specks.length; s++) {
        var d = specks[s], tw = Math.sin(t * d.f + d.ph) > 0.2 ? 1 : 0.35;
        var sy = ((d.y - t * d.sp) % 1 + 1) % 1;
        ctx.globalAlpha = 0.5 * tw * fade;
        ctx.fillStyle = "rgb(255, 200, 235)";
        ctx.fillRect(d.x * W, sy * H, d.s, d.s);
      }
      ctx.globalCompositeOperation = "lighter";

      // 3. the star rain: glowing dots falling slowly, swaying a little, some with a faint tail
      for (var r = 0; r < rain.length; r++) {
        var p = rain[r], ry = ((p.y + t * p.sp) % 1.1) - 0.05;
        var rx = (p.x + Math.sin(t * 0.35 + p.ph) * p.sway) * W, py = ry * H;
        var a = (0.55 + 0.45 * Math.sin(t * p.f + p.ph)) * fade * smooth(ry / 0.12) * (1 - smooth((ry - 0.85) / 0.2));
        if (p.trail && a > 0.05) {
          var len = p.size * 2.2;
          ctx.globalAlpha = a * 0.35;
          var grad = ctx.createLinearGradient(rx, py - len, rx, py);
          grad.addColorStop(0, "rgba(" + glows[p.g].rgb + ",0)");
          grad.addColorStop(1, "rgba(" + glows[p.g].rgb + ",1)");
          ctx.fillStyle = grad;
          ctx.fillRect(rx - 0.6, py - len, 1.2, len);
        }
        glowAt(p.g, rx, py, p.size, a);
      }

      // 4. now and then, a shooting star gliding down across the sky
      if (SKY.shootingEvery > 0) {
        nextShot -= dt;
        if (nextShot <= 0 && fade > 0.9) {
          nextShot = SKY.shootingEvery * (0.6 + R() * 0.8);
          var dir = R() < 0.5 ? -1 : 1, ang = 0.45 + R() * 0.35;
          shooting.push({ x: (dir < 0 ? 0.35 + R() * 0.6 : R() * 0.65) * W, y: R() * H * 0.45, vx: dir * Math.cos(ang), vy: Math.sin(ang),
                          speed: (0.35 + R() * 0.25) * Math.max(W, H), len: 70 + R() * 90, life: 0, dur: 1.1 + R() * 0.6, g: pickGlow() });
        }
        for (var h = shooting.length - 1; h >= 0; h--) {
          var st = shooting[h];
          st.life += dt;
          if (st.life > st.dur) { shooting.splice(h, 1); continue; }
          var q = st.life / st.dur, hx = st.x + st.vx * st.speed * st.life, hy = st.y + st.vy * st.speed * st.life;
          var sa = Math.sin(Math.PI * q);                 // fades in, then out
          var tx2 = hx - st.vx * st.len, ty2 = hy - st.vy * st.len;
          var g2 = ctx.createLinearGradient(tx2, ty2, hx, hy);
          g2.addColorStop(0, "rgba(" + glows[st.g].rgb + ",0)");
          g2.addColorStop(1, "rgba(255,255,255,0.9)");
          ctx.globalAlpha = sa;
          ctx.strokeStyle = g2; ctx.lineWidth = 1.4; ctx.lineCap = "round";
          ctx.beginPath(); ctx.moveTo(tx2, ty2); ctx.lineTo(hx, hy); ctx.stroke();
          glowAt(st.g, hx, hy, 16, sa);
        }
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    };
  }

  /* ---------------------------------------------------------------------- */
  Site.initFinale = function () {
    var K2 = C.closing || {};
    var stageEl = document.getElementById("closing");
    var wrap = document.getElementById("bouquet-wrap");
    var canvas = document.getElementById("bouquet");
    var envelope = document.getElementById("envelope");

    // The last message (shown once the letter has been read)
    var sign = ((K2.signoff ? K2.signoff + " " : "") + (C.from || "")).trim();
    var signEl = document.getElementById("finale-sign");
    var dateEl = document.getElementById("finale-date");
    if (sign) signEl.textContent = sign; else signEl.hidden = true;
    if (C.date) dateEl.textContent = C.date; else dateEl.hidden = true;

    function showLastMessage() {
      stageEl.classList.add("is-read");                  // the envelope fades away, the message fades in
      envelope.disabled = true;
    }
    Site.letter.onRead = showLastMessage;

    var letterOffered = false;
    function offerLetter() {
      if (letterOffered) return;
      letterOffered = true;
      if (!Site.letter.exists) return showLastMessage();
      stageEl.classList.add("has-letter");
      envelope.disabled = false;
    }

    // The small button that hides all the words, so only the flowers and the sky show.
    // Tap it again to bring the words back.
    var sceneBtn = document.getElementById("scene-only");
    var EYE = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">' +
              '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>';
    function showScene(only) {
      document.documentElement.classList.toggle("is-scene-only", only);
      sceneBtn.innerHTML = EYE + (only ? '<path d="M4 4l16 16"/>' : "") + "</svg>";
      sceneBtn.setAttribute("aria-pressed", String(only));
      sceneBtn.setAttribute("aria-label", only ? "Show the words" : "Hide the words");
    }
    showScene(false);
    sceneBtn.addEventListener("click", function () {
      showScene(!document.documentElement.classList.contains("is-scene-only"));
    });
    Site.showWords = function () { showScene(false); };   // main.js calls this when leaving the bouquet page

    var S = buildScene();
    var renderer = Site.points(canvas, { capacity: 130000, shadow: [0.129, 0.063, 0.102], onFallback: function () { if (started) render(); } });
    if (!renderer) { stageEl.classList.add("is-growing"); return offerLetter(); }
    D = renderer.data; CAP = renderer.capacity;
    Site.bouquetState = function () { return { dots: N, capacity: CAP, time: T }; };   // for checking
    var drawDust = startDust(stageEl);

    var started = false, visible = false, raf = 0, last = 0, cost = 14, W = 0, H = 0;

    function resize() {
      var maxH = window.innerHeight * (window.innerWidth >= 760 ? 0.78 : 0.7);   // a bigger box for the bouquet
      W = Math.floor(Math.min(stageEl.clientWidth, 660, maxH * VIEW.aspect));
      H = Math.round(W / VIEW.aspect);
      wrap.style.width = W + "px";
      renderer.resize(W, H);
    }

    function render() {
      var zk = easeInOut(prog(T, ZOOM_FROM, ZOOM_DUR));
      var zoom = lerp(ZOOM_START, 1, zk);
      var yaw = YAW_START + (Site.reducedMotion ? 0 : T * ROTATE_SPEED), pitch = VIEW.pitch;
      VZ[0] = -Math.cos(pitch) * Math.sin(yaw); VZ[1] = Math.sin(pitch); VZ[2] = Math.cos(pitch) * Math.cos(yaw);
      drawScene(S);
      var halfW = VIEW.halfW / zoom;
      renderer.draw(N, {
        yaw: yaw, pitch: pitch, cx: 0, cy: lerp(CY_START, VIEW.cy, zk),
        halfW: halfW, halfH: halfW * H / W, dist: VIEW.dist, shadowN: poolStart,
        px: (renderer.dpr || 1) * W / 430 * (LITE ? 1.18 : 1), glow: GLOW
      });
    }

    function frame(now) {
      raf = 0;
      if (!visible) return;                              // paused while off screen
      raf = requestAnimationFrame(frame);
      drawDust(now, now / 1000);
      // 60 frames a second when the device keeps up easily, 30 normally, 20 if it is struggling
      var gap = cost < 8 ? 15 : cost < 24 ? 31 : 48;
      if (now - last < gap) return;
      var dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (Site.letter.reading) return;                   // rest while she reads
      T += dt;
      var t0 = performance.now();
      render();
      cost = cost * 0.9 + (performance.now() - t0) * 0.1;
      if (T >= LETTER_AT) offerLetter();
    }

    function start() {
      started = true;
      stageEl.classList.add("is-growing");
      if (Site.playFinaleSong) Site.playFinaleSong();    // the last song starts with the flowers
      if (Site.player) Site.player.minimise();           // tuck the music panel away for the scene
      var jump = parseFloat(new URLSearchParams(location.search).get("t"));
      if (jump > 0) T = jump;                            // testing shortcut: ?t=18
      if (Site.reducedMotion) {                          // no animation: show it in full bloom
        T = SETTLED_AT + 4;
        render();
        offerLetter();
      }
    }

    function wake() {
      if (!visible || !started || raf || Site.reducedMotion) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }

    resize();

    // Start when the bouquet is on screen; pause when it isn't
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        var e = entries[entries.length - 1];
        visible = e.isIntersecting;
        if (!started && e.intersectionRatio >= 0.4) start();
        wake();
      }, { threshold: [0, 0.4] }).observe(wrap);
    } else {
      visible = true; start(); wake();
    }

    // Resize when the screen width changes (e.g. turning the phone)
    var lastWidth = window.innerWidth, timer = 0;
    window.addEventListener("resize", function () {
      if (window.innerWidth === lastWidth) return;       // ignore mobile address-bar resizes
      lastWidth = window.innerWidth;
      clearTimeout(timer);
      timer = setTimeout(function () { resize(); if (started) render(); }, 200);
    });
  };
})(window.Site);
