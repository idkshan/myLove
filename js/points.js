/* Draws glowing dots in 3D. Used by the heart and the bouquet.

   - The scene gives a list of dots: position, colour, size, opacity.
   - Dots are turned and tilted by a "camera", so things can rotate in 3D.
   - Nearer dots hide the ones behind them.
   - A soft glow is added on top.

   Uses the graphics chip (WebGL). If that isn't available, it draws the dots
   one by one instead (slower). Add ?gpu=off to the address to try that.

   Each dot is 8 numbers in renderer.data: x, y, z, r, g, b (0-1), size, opacity (0-1). */
(function (Site) {
  var STRIDE = 8, BYTES = STRIDE * 4;

  var POINT_VS = [
    "attribute vec3 aPos;",
    "attribute vec3 aCol;",
    "attribute float aSize;",
    "attribute float aAlpha;",
    "uniform mat3 uRot;",        // the camera's turn and tilt
    "uniform vec2 uCenter;",     // what sits in the middle of the canvas
    "uniform vec2 uHalf;",       // how much of the world fits from the middle to the edge
    "uniform float uDist;",      // camera distance, for perspective
    "uniform float uPx;",        // dot size scale
    "varying vec3 vCol;",
    "varying float vAlpha;",
    "void main() {",
    "  vec3 p = uRot * aPos;",
    "  float f = uDist / max(0.5, uDist - p.z);",
    "  gl_Position = vec4((p.xy - uCenter) * f / uHalf, clamp(-p.z * 0.15, -0.99, 0.99), 1.0);",
    "  gl_PointSize = max(1.0, aSize * uPx * f);",
    "  vCol = aCol;",
    "  vAlpha = aAlpha;",
    "}"
  ].join("\n");

  var POINT_FS = [
    "precision mediump float;",
    "varying vec3 vCol;",
    "varying float vAlpha;",
    "uniform float uMode;",      // 0 = the dot itself, 1 = glow, 2 = dark shadow behind
    "uniform vec3 uBg;",
    "uniform float uGain;",
    "void main() {",
    "  vec2 d = gl_PointCoord - 0.5;",
    "  float r2 = dot(d, d) * 4.0;",
    "  if (r2 > 1.0) discard;",
    "  if (uMode < 0.5) {",
    "    float a = vAlpha * (1.0 - smoothstep(0.5, 1.0, r2));",
    "    gl_FragColor = vec4(vCol * a, a);",
    "  } else if (uMode < 1.5) {",
    "    float g = (1.0 - r2) * vAlpha * uGain;",
    "    gl_FragColor = vec4(vCol * g, g);",
    "  } else {",
    "    float a = (1.0 - r2) * vAlpha * uGain;",
    "    gl_FragColor = vec4(uBg * a, a);",
    "  }",
    "}"
  ].join("\n");

  var QUAD_VS = "attribute vec2 aQuad; varying vec2 vUv; void main() { vUv = aQuad * 0.5 + 0.5; gl_Position = vec4(aQuad, 0.0, 1.0); }";
  var QUAD_FS = [                // a small blur while scaling the glow buffer back up
    "precision mediump float;",
    "varying vec2 vUv;",
    "uniform sampler2D uTex;",
    "uniform vec2 uTexel;",
    "uniform float uStrength;",
    "void main() {",
    "  vec2 t = uTexel;",
    "  vec4 c = texture2D(uTex, vUv) * 0.2;",
    "  c += (texture2D(uTex, vUv + vec2(t.x, 0.0)) + texture2D(uTex, vUv - vec2(t.x, 0.0)) +",
    "        texture2D(uTex, vUv + vec2(0.0, t.y)) + texture2D(uTex, vUv - vec2(0.0, t.y))) * 0.12;",
    "  c += (texture2D(uTex, vUv + t) + texture2D(uTex, vUv - t) +",
    "        texture2D(uTex, vUv + vec2(t.x, -t.y)) + texture2D(uTex, vUv + vec2(-t.x, t.y))) * 0.08;",
    "  gl_FragColor = c * uStrength;",
    "}"
  ].join("\n");

  // How many of the dots get a dark shadow behind them (cam.shadowN: only the first ones)
  function shadowCount(n, cam) { return cam.shadowN != null ? Math.min(n, cam.shadowN) : n; }

  // The camera's turn (yaw, around the vertical) then tilt (pitch), as a 3×3 matrix (column order)
  function rotation(yaw, pitch) {
    var cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    return [cy, sp * sy, -cp * sy, 0, cp, sp, sy, -sp * cy, cp * cy];
  }

  /* ---- graphics chip ------------------------------------------------------ */
  function createGpu(canvas, capacity, opts) {
    var gl = null;
    try { gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, depth: true }); } catch (e) {}
    if (!gl) return null;

    function program(vsSrc, fsSrc) {
      function compile(type, src) {
        var s = gl.createShader(type);
        gl.shaderSource(s, src); gl.compileShader(s);
        return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
      }
      var vs = compile(gl.VERTEX_SHADER, vsSrc), fs = compile(gl.FRAGMENT_SHADER, fsSrc);
      if (!vs || !fs) return null;
      var p = gl.createProgram();
      gl.attachShader(p, vs); gl.attachShader(p, fs); gl.linkProgram(p);
      return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null;
    }
    var pp = program(POINT_VS, POINT_FS), qp = program(QUAD_VS, QUAD_FS);
    if (!pp || !qp) return null;

    var loc = {
      pos: gl.getAttribLocation(pp, "aPos"), col: gl.getAttribLocation(pp, "aCol"),
      size: gl.getAttribLocation(pp, "aSize"), alpha: gl.getAttribLocation(pp, "aAlpha"),
      quad: gl.getAttribLocation(qp, "aQuad")
    };
    var u = {};
    ["uRot", "uCenter", "uHalf", "uDist", "uPx", "uMode", "uBg", "uGain"].forEach(function (n) { u[n] = gl.getUniformLocation(pp, n); });
    var uq = { tex: gl.getUniformLocation(qp, "uTex"), texel: gl.getUniformLocation(qp, "uTexel"), strength: gl.getUniformLocation(qp, "uStrength") };

    var pointBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pointBuf);
    gl.bufferData(gl.ARRAY_BUFFER, capacity * BYTES, gl.DYNAMIC_DRAW);
    var quadBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    // the small buffer the glow is drawn into
    var glowTex = gl.createTexture(), fbo = gl.createFramebuffer(), gw = 1, gh = 1;
    gl.bindTexture(gl.TEXTURE_2D, glowTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    function bindPoints(every) {
      var stride = BYTES * every;
      gl.bindBuffer(gl.ARRAY_BUFFER, pointBuf);
      gl.enableVertexAttribArray(loc.pos); gl.vertexAttribPointer(loc.pos, 3, gl.FLOAT, false, stride, 0);
      gl.enableVertexAttribArray(loc.col); gl.vertexAttribPointer(loc.col, 3, gl.FLOAT, false, stride, 12);
      gl.enableVertexAttribArray(loc.size); gl.vertexAttribPointer(loc.size, 1, gl.FLOAT, false, stride, 24);
      gl.enableVertexAttribArray(loc.alpha); gl.vertexAttribPointer(loc.alpha, 1, gl.FLOAT, false, stride, 28);
    }
    function unbindPoints() {
      [loc.pos, loc.col, loc.size, loc.alpha].forEach(function (l) { gl.disableVertexAttribArray(l); });
    }

    var bg = opts.shadow || [0.129, 0.063, 0.102];

    return {
      resize: function () {
        gw = Math.max(1, Math.ceil(canvas.width / 4)); gh = Math.max(1, Math.ceil(canvas.height / 4));
        gl.bindTexture(gl.TEXTURE_2D, glowTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gw, gh, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, glowTex, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      },
      draw: function (data, n, cam) {
        gl.bindBuffer(gl.ARRAY_BUFFER, pointBuf);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, data.subarray(0, n * STRIDE));

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 0); gl.clearDepth(1);
        gl.depthMask(true);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        if (!n) return;

        gl.useProgram(pp);
        gl.uniformMatrix3fv(u.uRot, false, rotation(cam.yaw, cam.pitch));
        gl.uniform2f(u.uCenter, cam.cx, cam.cy);
        gl.uniform2f(u.uHalf, cam.halfW, cam.halfH);
        gl.uniform1f(u.uDist, cam.dist);
        gl.uniform3f(u.uBg, bg[0], bg[1], bg[2]);
        gl.enable(gl.BLEND);

        // 1. a soft dark shadow behind the dots, so whatever is behind the scene doesn't show between them
        if (opts.shadow) {
          gl.disable(gl.DEPTH_TEST);
          gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
          bindPoints(3);
          gl.uniform1f(u.uMode, 2); gl.uniform1f(u.uGain, 0.92); gl.uniform1f(u.uPx, cam.px * 4.5);
          gl.drawArrays(gl.POINTS, 0, Math.floor(shadowCount(n, cam) / 3));
        }

        // 2. the dots, nearer ones in front
        bindPoints(1);
        gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.uniform1f(u.uMode, 0); gl.uniform1f(u.uPx, cam.px);
        gl.drawArrays(gl.POINTS, 0, n);

        // 3. the glow: drawn small, then blurred and added on top
        if (cam.glow > 0) {
          gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
          gl.viewport(0, 0, gw, gh);
          gl.clear(gl.COLOR_BUFFER_BIT);
          gl.disable(gl.DEPTH_TEST);
          gl.blendFunc(gl.ONE, gl.ONE);
          gl.uniform1f(u.uMode, 1); gl.uniform1f(u.uGain, 0.5); gl.uniform1f(u.uPx, cam.px * 0.6);
          gl.drawArrays(gl.POINTS, 0, n);
          unbindPoints();

          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
          gl.viewport(0, 0, canvas.width, canvas.height);
          gl.useProgram(qp);
          gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
          gl.enableVertexAttribArray(loc.quad); gl.vertexAttribPointer(loc.quad, 2, gl.FLOAT, false, 0, 0);
          gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, glowTex);
          gl.uniform1i(uq.tex, 0);
          gl.uniform2f(uq.texel, 1.4 / gw, 1.4 / gh);
          gl.uniform1f(uq.strength, cam.glow);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
          gl.disableVertexAttribArray(loc.quad);
        } else {
          unbindPoints();
        }
      }
    };
  }

  /* ---- 2D fallback ------------------------------------------------------- */
  function create2D(canvas, opts) {
    var ctx = canvas.getContext && canvas.getContext("2d");
    if (!ctx) return null;
    var small = document.createElement("canvas"), sctx = small.getContext("2d");
    var styles = {}, W = 1, H = 1, dpr = 1;
    var bg = opts.shadow ? "rgba(" + opts.shadow.map(function (c) { return Math.round(c * 255); }).join(",") + ",0.9)" : null;

    return {
      resize: function (w, h, d) {
        W = w; H = h; dpr = d;
        small.width = Math.max(1, Math.ceil(w / 5)); small.height = Math.max(1, Math.ceil(h / 5));
      },
      draw: function (data, n, cam) {
        var m = rotation(cam.yaw, cam.pitch);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1;
        ctx.clearRect(0, 0, W, H);
        var kx = W / (2 * cam.halfW), ky = H / (2 * cam.halfH), sizeK = cam.px / dpr;

        function project(i, out) {
          var o = i * STRIDE, x = data[o], y = data[o + 1], z = data[o + 2];
          var px = m[0] * x + m[3] * y + m[6] * z, py = m[1] * x + m[4] * y + m[7] * z, pz = m[2] * x + m[5] * y + m[8] * z;
          var f = cam.dist / Math.max(0.5, cam.dist - pz);
          out[0] = W / 2 + (px - cam.cx) * f * kx;
          out[1] = H / 2 - (py - cam.cy) * f * ky;
          out[2] = Math.max(1, data[o + 6] * sizeK * f);
        }
        var p = [0, 0, 0], i, o;

        if (bg) {                                        // dark shadow behind, as on the GPU
          ctx.fillStyle = bg;
          for (i = 0; i < shadowCount(n, cam); i += 3) {
            project(i, p);
            var s = p[2] * 3.5;
            ctx.fillRect(p[0] - s / 2, p[1] - s / 2, s, s);
          }
        }
        var alpha = 1;
        for (i = 0; i < n; i++) {
          o = i * STRIDE;
          var a = data[o + 7];
          if (a < 0.02) continue;
          project(i, p);
          if (a !== alpha) { alpha = a; ctx.globalAlpha = a; }
          var key = ((Math.min(255, data[o + 3] * 255) & 0xf0) << 16) | ((Math.min(255, data[o + 4] * 255) & 0xf0) << 8) | (Math.min(255, data[o + 5] * 255) & 0xf0);
          ctx.fillStyle = styles[key] || (styles[key] = "rgb(" + (key >> 16) + "," + ((key >> 8) & 255) + "," + (key & 255) + ")");
          ctx.fillRect(p[0] - p[2] / 2, p[1] - p[2] / 2, p[2], p[2]);
        }
        ctx.globalAlpha = 1;

        if (cam.glow > 0) {                              // glow: shrink the picture, then add it back blurred
          sctx.clearRect(0, 0, small.width, small.height);
          sctx.drawImage(canvas, 0, 0, small.width, small.height);
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.globalCompositeOperation = "lighter";
          ctx.globalAlpha = Math.min(1, cam.glow * 0.8);
          ctx.imageSmoothingEnabled = true;
          ctx.drawImage(small, 0, 0, canvas.width, canvas.height);
          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = "source-over";
        }
      }
    };
  }

  /* Site.points(canvas, options) → a renderer, or null if the browser can't draw at all.
       options.capacity  the most points the scene will ever have
       options.shadow    [r, g, b] (0–1): draw a soft shadow of this colour behind the dots
     renderer.data            the point list to fill in (8 numbers per point)
     renderer.resize(w, h)    size on screen, in CSS pixels
     renderer.draw(n, cam)    draw the first n points.
       cam = { yaw, pitch, cx, cy, halfW, halfH, dist, px, glow, shadowN (optional) }   */
  Site.points = function (canvas, options) {
    var o = options || {};
    var capacity = o.capacity || 20000;
    var api = { data: new Float32Array(capacity * STRIDE), capacity: capacity, gpu: false, canvas: canvas };
    var impl = null, W = 0, H = 0, dpr = 1;

    function use2D() {
      if (api.gpu) {                                     // a canvas can't switch methods, so swap in a fresh one
        var fresh = canvas.cloneNode(false);
        canvas.parentNode.replaceChild(fresh, canvas);
        canvas = api.canvas = fresh;
      }
      impl = create2D(canvas, o);
      api.gpu = false;
      if (impl && W) api.resize(W, H);
    }

    if (new URLSearchParams(location.search).get("gpu") !== "off") impl = createGpu(canvas, capacity, o);
    if (impl) {
      api.gpu = true;
      canvas.addEventListener("webglcontextlost", function (e) {   // e.g. the phone reclaimed graphics memory
        e.preventDefault();
        use2D();
        if (o.onFallback) o.onFallback();
      });
    } else {
      use2D();
    }
    if (!impl) return null;

    api.resize = function (w, h) {
      W = w; H = h;
      dpr = Math.min(window.devicePixelRatio || 1, api.gpu ? 2 : 1.5);   // sharp enough, and lighter on phones
      canvas.style.width = W + "px"; canvas.style.height = H + "px";
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      impl.resize(W, H, dpr);
      api.dpr = dpr;
    };
    api.draw = function (n, cam) { impl.draw(api.data, Math.min(n, capacity), cam); };
    return api;
  };
})(window.Site);
