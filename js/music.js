/* Music that follows the pages.

   Each chapter page has its own song, and the bouquet has one too. When she
   goes to another page, its song fades in while the old one fades out.

   Two audio players ("decks") take turns, so one song can fade into the next.
   On computers the volume is set directly; iPhones ignore that, so the sound
   is sent through a volume control (Web Audio) instead.

   A small panel shows the song's name, play/pause and a volume slider. */
(function (Site) {
  var C = Site.content;

  var ICON = {
    note: '<path fill="currentColor" d="M19 3.5v11.2a3.3 3.3 0 1 1-1.8-2.9V7.6l-8 1.9v7.7a3.3 3.3 0 1 1-1.8-2.9V6.2a1 1 0 0 1 .8-1l9.6-2.3a1 1 0 0 1 1.2.6z"/>',
    play: '<path fill="currentColor" d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/>',
    pause: '<rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor"/><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor"/>',
    volume: '<path fill="currentColor" d="M4 9.5v5a1 1 0 0 0 1 1h3l4.3 3.6a.6.6 0 0 0 1-.5V5.4a.6.6 0 0 0-1-.5L8 8.5H5a1 1 0 0 0-1 1z"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M16.5 9a4 4 0 0 1 0 6"/>'
  };
  function svg(name) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICON[name] + "</svg>"; }

  var M = C.music || {};
  var volume = M.volume == null ? 0.5 : M.volume;
  var FADE = M.fade || 3;
  var fadeTime = FADE;            // the fade in use right now (the bouquet uses a quicker one)

  var decks = [], levels = [0, 0], targets = [0, 0], gains = [];
  var ctx = null, active = -1, lastDeck = -1, currentSrc = null, paused = false, duck = 1, unlocked = false;
  var titleEl = null, playBtn = null, toggle = null, panel = null;

  // A tiny silent sound, used to unlock the players on the first tap
  function silence() {
    var bytes = [82,73,70,70,38,0,0,0,87,65,86,69,102,109,116,32,16,0,0,0,1,0,1,0,64,31,0,0,128,62,0,0,2,0,16,0,100,97,116,97,2,0,0,0,0,0];
    return "data:audio/wav;base64," + btoa(String.fromCharCode.apply(null, bytes));
  }

  function apply(i) {
    var v = levels[i] * volume * duck;
    if (gains[i]) gains[i].gain.value = v;
    else decks[i].volume = Math.max(0, Math.min(1, v));
  }

  // Moves each deck's volume a little towards its target, every frame
  var fading = false, lastTick = 0;
  function tick(now) {
    var dt = Math.min(0.1, (now - lastTick) / 1000);
    lastTick = now;
    var moving = false;
    for (var i = 0; i < decks.length; i++) {
      if (levels[i] !== targets[i]) {
        var step = dt / fadeTime;
        levels[i] = levels[i] < targets[i] ? Math.min(targets[i], levels[i] + step) : Math.max(targets[i], levels[i] - step);
        moving = true;
      }
      apply(i);
      if (levels[i] === 0 && targets[i] === 0 && !decks[i].paused) decks[i].pause();
    }
    fading = moving;
    if (moving) requestAnimationFrame(tick);
  }
  function startFade() {
    if (fading) return;
    fading = true; lastTick = performance.now();
    requestAnimationFrame(tick);
  }

  function playDeck(i) {
    if (ctx && ctx.state === "suspended") ctx.resume();
    var p = decks[i].play();
    if (p && p.catch) p.catch(function () {});
  }

  function showState() {
    if (!playBtn) return;
    var playing = active >= 0 && !paused && currentSrc;
    playBtn.innerHTML = svg(playing ? "pause" : "play");
    playBtn.setAttribute("aria-label", playing ? "Pause" : "Play");
    toggle.classList.toggle("is-playing", !!playing);
  }

  Site.music = {
    // Called from the first tap ("Click Me"), so the browser allows sound later
    unlock: function () {
      if (unlocked) return;
      unlocked = true;
      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      var useGain = !!AudioCtx && location.protocol !== "file:";
      if (useGain) { try { ctx = new AudioCtx(); } catch (e) { ctx = null; } }
      for (var i = 0; i < 2; i++) {
        var a = new Audio();
        a.loop = true; a.preload = "auto"; a.playsInline = true;
        a.src = silence();
        decks.push(a);
        if (ctx) {
          try {
            var g = ctx.createGain(); g.gain.value = 0;
            ctx.createMediaElementSource(a).connect(g);
            g.connect(ctx.destination);
            gains.push(g);
          } catch (e) { gains.push(null); }
        } else gains.push(null);
        apply(i);
        var p = a.play();
        if (p && p.then) p.then((function (deck) { return function () { deck.pause(); }; })(a)).catch(function () {});
      }
      if (navigator.audioSession) { try { navigator.audioSession.type = "playback"; } catch (e) {} }
    },

    // Fade to this section's song (or to silence if src is empty).
    // fade: seconds for this change (leave out to use music.fade from content.js)
    play: function (src, title, fade) {
      if (!unlocked || (src || null) === currentSrc) return;
      fadeTime = fade || FADE;
      currentSrc = src || null;
      if (titleEl) titleEl.textContent = title || "";
      if (active >= 0) targets[active] = 0;               // fade the old song out
      if (src) {
        var next = lastDeck === 0 ? 1 : 0;                // the other player, so the old song can still fade out
        lastDeck = next;
        decks[next].src = src;
        decks[next].currentTime = 0;
        levels[next] = 0; targets[next] = 1; apply(next);
        active = next;
        if (!paused) playDeck(next);
        if ("mediaSession" in navigator && window.MediaMetadata && title) {
          navigator.mediaSession.metadata = new MediaMetadata({ title: title });
        }
      } else active = -1;
      startFade();
      showState();
    },

    // For checking: which song each deck has, how loud it is, and whether it's playing
    state: function () {
      return decks.map(function (a, i) {
        return { song: a.src.split("/").slice(-2).join("/").slice(0, 40), level: Math.round(levels[i] * 100) / 100, playing: !a.paused };
      });
    },

    // Quieter while something else (like a video) is playing
    duck: function (on) {
      duck = on ? 0.15 : 1;
      for (var i = 0; i < decks.length; i++) apply(i);
    }
  };

  // Other parts of the site can tuck the panel away (the finale does)
  Site.player = { minimise: function () {} };

  /* Show the music panel. Called when she taps Open. */
  Site.initMusic = function () {
    toggle = document.getElementById("music");
    panel = document.getElementById("player");
    panel.innerHTML =
      '<p class="player-label">Now playing</p>' +
      '<p class="player-title"></p>' +
      '<div class="player-controls">' +
        '<button type="button" class="player-play" aria-label="Play"></button>' +
        '<label class="player-volume">' + svg("volume") +
          '<input type="range" min="0" max="100" step="1" aria-label="Volume"></label>' +
      "</div>";
    titleEl = panel.querySelector(".player-title");
    playBtn = panel.querySelector(".player-play");
    var slider = panel.querySelector("input");

    slider.value = Math.round(volume * 100);
    slider.addEventListener("input", function () {
      volume = slider.value / 100;
      for (var i = 0; i < decks.length; i++) apply(i);
    });
    // Nothing can change the volume here (opened as a file on an iPhone): use the phone's buttons
    if (!ctx && decks[0] && (function () { var a = new Audio(); a.volume = 0.5; return a.volume !== 0.5; })()) {
      panel.querySelector(".player-volume").hidden = true;
    }

    playBtn.addEventListener("click", function () {
      if (active < 0) return;
      paused = !paused;
      if (paused) decks[active].pause(); else playDeck(active);
      showState();
    });

    // Show/hide the panel
    var open = false;
    function setOpen(next) {
      open = next;
      panel.classList.toggle("is-min", !open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Hide the music panel" : "Show the music panel");
    }
    toggle.innerHTML = svg("note");
    toggle.addEventListener("click", function () { setOpen(!open); });
    Site.player.minimise = function () { setOpen(false); };
    toggle.hidden = false;
    panel.hidden = false;
    setOpen(false);
    setTimeout(function () {
      setOpen(true);
      if (window.innerWidth < 760) setTimeout(function () { if (open) setOpen(false); }, 6000);   // on phones, tuck it away after a moment
    }, 1800);

    showState();
  };
})(window.Site);
