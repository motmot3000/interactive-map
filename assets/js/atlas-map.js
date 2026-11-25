/*
 * Cartes interactives 2.0 — moteur de carte.
 * Caméra fluide (molette, pincement, glisser avec inertie, double-clic, clavier),
 * écritures qui apparaissent selon le zoom, repères des micro-territoires, mini-carte.
 * Script classique (sans module) pour fonctionner aussi en ouvrant le fichier en local.
 */
(function (global) {
  'use strict';

  var clamp = function (v, lo, hi) { return Math.max(lo, Math.min(hi, v)); };
  var reducedMotion = function () {
    return !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches);
  };
  var easeInOut = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var SVG_NS = 'http://www.w3.org/2000/svg';

  function MapView(root, options) {
    this.root = root;
    this.svg = root.querySelector('svg.map-svg');
    this.cam = this.svg.querySelector('.map-camera');
    this.content = this.svg.querySelector('.map-content');
    this.W = Number(this.svg.getAttribute('data-width'));
    this.H = Number(this.svg.getAttribute('data-height'));
    var homeAttr = (this.svg.getAttribute('data-home') || '').split(' ').map(Number);
    this.homeUnits = homeAttr.length === 4 && homeAttr.every(isFinite) ? homeAttr : null;
    this.kmPerUnit = Number(this.svg.getAttribute('data-km')) || 0;
    this.opts = Object.assign({
      maxZoom: 12,
      names: {},
      shortLabels: null,
      capsLabels: false,
      home: null,
      small: [],
    }, options || {});
    this.insets = { top: 0, right: 0, bottom: 0, left: 0 };
    this.hiddenBottom = 0;
    this.k = 1;
    this.x = 0;
    this.y = 0;
    this.k0 = 1;
    this.labelMode = 'names';
    this.dblZoom = true;
    this.tooltipFormatter = null;
    this.handlers = {};
    this.regions = new Map();
    this.order = [];
    this.pointers = new Map();
    this.drag = null;
    this.pinch = null;
    this.motion = null;
    this.raf = 0;
    this.dirty = false;
    this.hoverCode = null;
    this.focusCode = null;
    this.keyNav = false;
    this.lastTap = null;
    this.pins = [];
    this._init();
  }

  MapView.prototype.on = function (name, fn) {
    (this.handlers[name] = this.handlers[name] || []).push(fn);
    return this;
  };

  MapView.prototype._emit = function (name) {
    var args = Array.prototype.slice.call(arguments, 1);
    (this.handlers[name] || []).forEach(function (fn) { fn.apply(null, args); });
  };

  MapView.prototype._init = function () {
    var self = this;
    this.svg.removeAttribute('viewBox');
    this.patterns = Array.prototype.slice.call(this.svg.querySelectorAll('pattern'));

    Array.prototype.forEach.call(this.svg.querySelectorAll('.region'), function (el) {
      var code = el.getAttribute('data-code');
      var box = el.getBBox();
      var lx = Number(el.getAttribute('data-lx'));
      var ly = Number(el.getAttribute('data-ly'));
      self.regions.set(code, {
        code: code,
        el: el,
        box: box,
        lx: isFinite(lx) && el.hasAttribute('data-lx') ? lx : box.x + box.width / 2,
        ly: isFinite(ly) && el.hasAttribute('data-ly') ? ly : box.y + box.height / 2,
        neighbors: (el.getAttribute('data-neighbors') || '').split(' ').filter(Boolean),
        neighborsOutside: (el.getAttribute('data-neighbors-ctx') || '').split('|').filter(Boolean),
        states: new Set(),
        area: box.width * box.height,
      });
    });
    this.order = Array.from(this.regions.values()).sort(function (a, b) { return b.area - a.area; });

    var notes = this.root.querySelector('script.map-annotations');
    this.annotations = notes ? JSON.parse(notes.textContent) : [];

    this._buildOverlay();
    this._buildMinimap();
    this._bind();
    this._measure();
    this.home(false);

    if (global.ResizeObserver) {
      new ResizeObserver(function () { self._onResize(); }).observe(this.root);
    } else {
      global.addEventListener('resize', function () { self._onResize(); });
    }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { self._measureLabels(); self._schedule(); });
    }
  };

  /* ------------------------------------------------------------------ Couches HTML */
  MapView.prototype._buildOverlay = function () {
    var self = this;
    this.labelsLayer = document.createElement('div');
    this.labelsLayer.className = 'map-labels';
    this.labelsLayer.setAttribute('aria-hidden', 'true');
    this.root.appendChild(this.labelsLayer);

    this.regions.forEach(function (r) {
      var span = document.createElement('span');
      span.className = 'map-label' + (self.opts.capsLabels ? ' map-label--caps' : '');
      self.labelsLayer.appendChild(span);
      r.label = span;
      r.labelText = null;
      if (self.opts.small.indexOf(r.code) !== -1 || r.area < 40) {
        var marker = document.createElement('button');
        marker.type = 'button';
        marker.className = 'map-marker';
        marker.tabIndex = -1;
        marker.setAttribute('aria-hidden', 'true');
        marker.setAttribute('data-code', r.code);
        self.labelsLayer.appendChild(marker);
        r.marker = marker;
      }
    });

    this.annotations.forEach(function (a) {
      var span = document.createElement('span');
      span.className = 'map-label map-label--' + a.kind + ' rank-' + a.rank;
      span.textContent = a.text;
      self.labelsLayer.appendChild(span);
      a.el = span;
    });

    this.tooltip = document.createElement('div');
    this.tooltip.className = 'map-tooltip';
    this.tooltip.setAttribute('aria-hidden', 'true');
    this.root.appendChild(this.tooltip);

    if (this.kmPerUnit) {
      this.scaleBar = document.createElement('div');
      this.scaleBar.className = 'scalebar';
      this.scaleBar.setAttribute('aria-hidden', 'true');
      this.scaleBar.innerHTML = '<span class="scalebar__label mono"></span><span class="scalebar__bar"><i></i></span>';
      this.root.appendChild(this.scaleBar);
    }
    this._measureLabels();
  };

  MapView.prototype._measureLabels = function () {
    var ctx = document.createElement('canvas').getContext('2d');
    var family = getComputedStyle(document.body).fontFamily;
    var caps = this.opts.capsLabels;
    var self = this;
    var measure = function (text, font, spacing) {
      ctx.font = font;
      return ctx.measureText(text).width + spacing * text.length + 8;
    };
    this.regions.forEach(function (r) {
      var name = self.opts.names[r.code] || r.code;
      var shown = caps ? name.toUpperCase() : name;
      r.nameW = measure(shown, (caps ? '700 11.5px ' : '650 12.5px ') + family, caps ? 0.92 : 0.12);
      var short = self.opts.shortLabels ? self.opts.shortLabels[r.code] : null;
      r.short = short;
      r.shortW = short ? measure(short, '650 11.5px ' + getComputedStyle(document.documentElement).getPropertyValue('--mono'), 0) : 0;
    });
    this.annotations.forEach(function (a) {
      a.w = a.el.offsetWidth || measure(a.text, '600 13px ' + family, 1);
      a.h = a.el.offsetHeight || 16;
    });
  };

  MapView.prototype._buildMinimap = function () {
    var self = this;
    var box = document.createElement('div');
    box.className = 'minimap';
    box.setAttribute('aria-hidden', 'true');
    var svg = document.createElementNS(SVG_NS, 'svg');
    var hb = this._homeBox();
    var mx0 = hb.x - hb.w * 0.12;
    var my0 = hb.y - hb.h * 0.12;
    var mw = hb.w * 1.24;
    var mh = hb.h * 1.24;
    svg.setAttribute('viewBox', mx0 + ' ' + my0 + ' ' + mw + ' ' + mh);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    var use = document.createElementNS(SVG_NS, 'use');
    use.setAttribute('href', '#' + this.content.id);
    svg.appendChild(use);
    var view = document.createElementNS(SVG_NS, 'rect');
    view.setAttribute('class', 'minimap__view');
    view.setAttribute('rx', String(this.W / 120));
    svg.appendChild(view);
    box.appendChild(svg);
    this.root.appendChild(box);
    this.minimap = box;
    this.minimapView = view;

    var moveTo = function (e, animate) {
      var r = svg.getBoundingClientRect();
      var mx = mx0 + (e.clientX - r.left) / r.width * mw;
      var my = my0 + (e.clientY - r.top) / r.height * mh;
      self.centerOn(mx, my, self.k, animate);
    };
    var dragging = false;
    box.addEventListener('pointerdown', function (e) {
      e.stopPropagation();
      dragging = true;
      box.setPointerCapture(e.pointerId);
      moveTo(e, true);
    });
    box.addEventListener('pointermove', function (e) {
      if (dragging) { e.stopPropagation(); moveTo(e, false); }
    });
    box.addEventListener('pointerup', function (e) { dragging = false; e.stopPropagation(); });
    box.addEventListener('pointercancel', function () { dragging = false; });
  };

  /* ------------------------------------------------------------------ Mesures et cadrage */
  MapView.prototype._measure = function () {
    this.vw = this.root.clientWidth || 1;
    this.vh = this.root.clientHeight || 1;
    this.svg.setAttribute('viewBox', '0 0 ' + this.vw + ' ' + this.vh);
    var c = this._content();
    var home = this._homeBox();
    // Vue de départ : le pays entier dans la zone libre. Le fond dessiné, bien plus grand, couvre toujours
    // tout l'écran : on ne voit jamais le bord de la carte, ni au départ ni en dézoomant.
    var fit = Math.min(c.w / home.w, c.h / home.h) * 0.94;
    var cover = Math.max(this.vw / this.W, (this.vh - this.hiddenBottom) / this.H);
    this.k0 = Math.max(fit, cover);
    this.minK = Math.max(cover, this.k0 * 0.45);
    this.maxK = this.k0 * this.opts.maxZoom;
  };

  MapView.prototype._content = function () {
    var i = this.insets;
    var L = i.left;
    var T = i.top;
    var R = Math.max(L + 80, this.vw - i.right);
    var B = Math.max(T + 80, this.vh - i.bottom);
    return { L: L, T: T, R: R, B: B, w: R - L, h: B - T, cx: (L + R) / 2, cy: (T + B) / 2 };
  };

  MapView.prototype._homeBox = function () {
    var h = this.opts.home;
    if (h) return { x: h[0] * this.W, y: h[1] * this.H, w: (h[2] - h[0]) * this.W, h: (h[3] - h[1]) * this.H };
    if (this.homeUnits) return { x: this.homeUnits[0], y: this.homeUnits[1], w: this.homeUnits[2], h: this.homeUnits[3] };
    return { x: 0, y: 0, w: this.W, h: this.H };
  };

  MapView.prototype._onResize = function () {
    var c = this._content();
    var mx = (c.cx - this.x) / this.k;
    var my = (c.cy - this.y) / this.k;
    var rel = this.k / this.k0;
    this._measure();
    this._measureLabels();
    var k = clamp(this.k0 * rel, this.minK, this.maxK);
    c = this._content();
    this._set(k, c.cx - mx * k, c.cy - my * k);
  };

  // Marges occupées par les panneaux. mode : 'animate' (garder la vue, en douceur),
  // 'jump' (garder la vue, sans animation) ou 'measure' (recalculer sans bouger la caméra).
  MapView.prototype.setInsets = function (insets, mode) {
    var before = this._content();
    var base = this.motion && this.motion.type === 'tween' ? this.motion.to : this;
    var mx = (before.cx - base.x) / base.k;
    var my = (before.cy - base.y) / base.k;
    var rel = base.k / this.k0;
    this.insets = Object.assign({ top: 0, right: 0, bottom: 0, left: 0 }, insets);
    // Bas d'écran couvert par un panneau opaque (téléphone) : le fond n'a pas besoin d'y être dessiné.
    this.hiddenBottom = Math.max(0, this.insets.hidden || 0);
    this._measure();
    if (mode === 'measure') {
      this._schedule();
      return;
    }
    var k = clamp(this.k0 * rel, this.minK, this.maxK);
    var c = this._content();
    this._goto(k, c.cx - mx * k, c.cy - my * k, mode === 'jump' ? 0 : 420);
  };

  MapView.prototype._clamp = function (k, x, y) {
    var mw = this.W * k;
    var mh = this.H * k;
    var minX = this.vw - mw;
    var maxX = 0;
    var minY = this.vh - this.hiddenBottom - mh;
    var maxY = 0;
    if (minX > maxX) { minX = maxX = minX / 2; }
    if (minY > maxY) { minY = maxY = minY / 2; }
    return { k: k, x: clamp(x, minX, maxX), y: clamp(y, minY, maxY) };
  };

  MapView.prototype._set = function (k, x, y) {
    var p = this._clamp(clamp(k, this.minK, this.maxK), x, y);
    this.k = p.k;
    this.x = p.x;
    this.y = p.y;
    this._schedule();
  };

  MapView.prototype._schedule = function () {
    if (this.dirty) return;
    this.dirty = true;
    var self = this;
    if (!this.raf) this.raf = requestAnimationFrame(function (t) { self._frame(t); });
  };

  MapView.prototype._frame = function (t) {
    this.raf = 0;
    var keepGoing = this.motion ? this._step(t) : false;
    if (this.dirty) {
      this.dirty = false;
      this._apply();
    }
    if (keepGoing && !this.raf) {
      var self = this;
      this.raf = requestAnimationFrame(function (tt) { self._frame(tt); });
    }
  };

  MapView.prototype._apply = function () {
    if (this.motion || this.drag || this.pinch) this._hideTooltip();
    this.cam.setAttribute('transform', 'matrix(' + this.k + ' 0 0 ' + this.k + ' ' + this.x + ' ' + this.y + ')');
    var s = 1 / this.k;
    for (var i = 0; i < this.patterns.length; i++) {
      var p = this.patterns[i];
      p.setAttribute('patternTransform', 'scale(' + s + ')' + (p.id.indexOf('hatch') === 0 ? ' rotate(45)' : ''));
    }
    this._placeLabels();
    this._placePins();
    this._updateMinimap();
    this._updateScale();
    this._emit('camera', { zoom: this.k / this.k0, atMin: this.k <= this.minK * 1.001, atMax: this.k >= this.maxK * 0.999 });
  };

  /* ------------------------------------------------------------------ Mouvements */
  MapView.prototype._stopMotion = function () {
    this.motion = null;
  };

  MapView.prototype._goto = function (k, x, y, duration) {
    var to = this._clamp(clamp(k, this.minK, this.maxK), x, y);
    if (!duration || reducedMotion()) {
      this.motion = null;
      this._set(to.k, to.x, to.y);
      return;
    }
    this.motion = {
      type: 'tween',
      from: { k: this.k, x: this.x, y: this.y },
      to: to,
      start: performance.now(),
      dur: duration,
    };
    this._kick();
  };

  MapView.prototype._kick = function () {
    var self = this;
    this.dirty = true;
    if (!this.raf) this.raf = requestAnimationFrame(function (t) { self._frame(t); });
  };

  MapView.prototype._step = function (t) {
    var m = this.motion;
    if (!m) return false;
    if (m.type === 'tween') {
      var p = clamp((t - m.start) / m.dur, 0, 1);
      var e = easeInOut(p);
      // Interpolation en échelle logarithmique : le zoom paraît régulier.
      var k = Math.exp(Math.log(m.from.k) + (Math.log(m.to.k) - Math.log(m.from.k)) * e);
      var c = this._content();
      var fromCx = (c.cx - m.from.x) / m.from.k;
      var fromCy = (c.cy - m.from.y) / m.from.k;
      var toCx = (c.cx - m.to.x) / m.to.k;
      var toCy = (c.cy - m.to.y) / m.to.k;
      var mx = fromCx + (toCx - fromCx) * e;
      var my = fromCy + (toCy - fromCy) * e;
      this.k = k;
      this.x = c.cx - mx * k;
      this.y = c.cy - my * k;
      this.dirty = true;
      if (p >= 1) {
        this.k = m.to.k;
        this.x = m.to.x;
        this.y = m.to.y;
        this.motion = null;
        return false;
      }
      return true;
    }
    if (m.type === 'follow') {
      var dt = m.last ? Math.min(64, t - m.last) : 16.7;
      if (dt <= 0) return true;
      m.last = t;
      var a = 1 - Math.pow(1 - 0.24, dt / 16.7);
      var nk = this.k + (m.k - this.k) * a;
      if (Math.abs(m.k - nk) / m.k < 0.0015) nk = m.k;
      var q = this._clamp(nk, m.sx - m.mx * nk, m.sy - m.my * nk);
      this.k = q.k;
      this.x = q.x;
      this.y = q.y;
      this.dirty = true;
      if (nk === m.k) { this.motion = null; return false; }
      return true;
    }
    if (m.type === 'inertia') {
      var dt2 = Math.min(64, t - m.last);
      if (dt2 <= 0) return true;
      m.last = t;
      var decay = Math.pow(0.0035, dt2 / 1000);
      m.vx *= decay;
      m.vy *= decay;
      var r = this._clamp(this.k, this.x + m.vx * dt2, this.y + m.vy * dt2);
      if (r.x === this.x && r.y === this.y) { this.motion = null; return false; }
      this.x = r.x;
      this.y = r.y;
      this.dirty = true;
      if (Math.hypot(m.vx, m.vy) < 0.02) { this.motion = null; return false; }
      return true;
    }
    return false;
  };

  MapView.prototype.home = function (animate) {
    var c = this._content();
    var b = this._homeBox();
    var k = this.k0;
    this._goto(k, c.cx - (b.x + b.w / 2) * k, c.cy - (b.y + b.h / 2) * k, animate === false ? 0 : 600);
  };

  MapView.prototype.zoomBy = function (factor, sx, sy, duration) {
    var c = this._content();
    if (sx === undefined) { sx = c.cx; sy = c.cy; }
    var base = this.motion && this.motion.type === 'tween' ? this.motion.to : this;
    var k = clamp(base.k * factor, this.minK, this.maxK);
    var mx = (sx - base.x) / base.k;
    var my = (sy - base.y) / base.k;
    this._goto(k, sx - mx * k, sy - my * k, duration === undefined ? 340 : duration);
  };

  MapView.prototype.zoomIn = function () { this.zoomBy(1.8); };
  MapView.prototype.zoomOut = function () { this.zoomBy(1 / 1.8); };

  MapView.prototype.panBy = function (dx, dy, duration) {
    this._goto(this.k, this.x + dx, this.y + dy, duration === undefined ? 260 : duration);
  };

  MapView.prototype.centerOn = function (mx, my, k, animate) {
    var c = this._content();
    k = k || this.k;
    this._goto(k, c.cx - mx * k, c.cy - my * k, animate ? 420 : 0);
  };

  MapView.prototype._boxOf = function (codes) {
    var x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
    var self = this;
    codes.forEach(function (code) {
      var r = self.regions.get(code);
      if (!r) return;
      x1 = Math.min(x1, r.box.x);
      y1 = Math.min(y1, r.box.y);
      x2 = Math.max(x2, r.box.x + r.box.width);
      y2 = Math.max(y2, r.box.y + r.box.height);
    });
    return isFinite(x1) ? { x: x1, y: y1, w: x2 - x1, h: y2 - y1 } : null;
  };

  // Cadre une ou plusieurs régions. options : { minZoom, maxZoom, padding, ifNeeded, duration }
  MapView.prototype.flyTo = function (codes, options) {
    codes = [].concat(codes);
    var o = Object.assign({ padding: 0.35, ifNeeded: false, minSize: 26, minZoom: 1, maxZoom: 6, duration: null }, options);
    var b = this._boxOf(codes);
    if (!b) return;
    var c = this._content();
    if (o.ifNeeded) {
      var sx1 = b.x * this.k + this.x;
      var sy1 = b.y * this.k + this.y;
      var sx2 = (b.x + b.w) * this.k + this.x;
      var sy2 = (b.y + b.h) * this.k + this.y;
      var inside = sx1 >= c.L + 12 && sy1 >= c.T + 12 && sx2 <= c.R - 12 && sy2 <= c.B - 12;
      var bigEnough = Math.max(sx2 - sx1, sy2 - sy1) >= o.minSize;
      if (inside && bigEnough) return;
    }
    var pad = 1 + o.padding * 2;
    var k = Math.min(c.w / (Math.max(b.w, 1) * pad), c.h / (Math.max(b.h, 1) * pad));
    k = clamp(k, this.k0 * o.minZoom, Math.min(this.maxK, this.k0 * o.maxZoom));
    if (o.ifNeeded) k = Math.max(k, Math.min(this.k, this.k0 * o.maxZoom));
    var cx = b.x + b.w / 2;
    var cy = b.y + b.h / 2;
    var dist = Math.hypot((c.cx - this.x) / this.k - cx, (c.cy - this.y) / this.k - cy) * this.k;
    var ratio = Math.abs(Math.log(k / this.k));
    var duration = o.duration || clamp(380 + dist * 0.35 + ratio * 160, 420, 1100);
    this._goto(k, c.cx - cx * k, c.cy - cy * k, duration);
  };

  /* ------------------------------------------------------------------ Gestes */
  MapView.prototype._bind = function () {
    var self = this;
    var root = this.root;

    root.addEventListener('wheel', function (e) { self._onWheel(e); }, { passive: false });
    root.addEventListener('pointerdown', function (e) { self._onDown(e); });
    root.addEventListener('pointermove', function (e) { self._onMove(e); });
    root.addEventListener('pointerup', function (e) { self._onUp(e); });
    root.addEventListener('pointercancel', function (e) { self._onCancel(e); });
    root.addEventListener('pointerleave', function (e) {
      if (e.pointerType === 'mouse' && !self.pointers.size) {
        self._setHover(null);
        self._hideTooltip();
      }
    });
    root.addEventListener('keydown', function (e) { self._onKey(e); });
    root.addEventListener('blur', function () { self._endKeyNav(); });
    root.addEventListener('dblclick', function (e) { e.preventDefault(); });
    root.addEventListener('contextmenu', function (e) { if (self.pointers.size > 1) e.preventDefault(); });
    // Safari : neutraliser le zoom natif de la page pendant un pincement sur la carte.
    root.addEventListener('gesturestart', function (e) { e.preventDefault(); });
  };

  MapView.prototype._local = function (e) {
    var r = this.root.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  MapView.prototype._onWheel = function (e) {
    e.preventDefault();
    var p = this._local(e);
    var delta = e.deltaY;
    if (e.deltaMode === 1) delta *= 32;
    else if (e.deltaMode === 2) delta *= this.vh;
    var intensity = e.ctrlKey ? 0.012 : 0.0021;
    var factor = Math.exp(-clamp(delta, -260, 260) * intensity);
    var m = this.motion && this.motion.type === 'follow' ? this.motion : null;
    var baseK = m ? m.k : this.k;
    var k = clamp(baseK * factor, this.minK, this.maxK);
    var mx = (p.x - this.x) / this.k;
    var my = (p.y - this.y) / this.k;
    if (reducedMotion()) {
      this.motion = null;
      this._set(k, p.x - mx * k, p.y - my * k);
      return;
    }
    this.motion = { type: 'follow', k: k, sx: p.x, sy: p.y, mx: mx, my: my, last: 0 };
    this._kick();
    this._hideTooltip();
  };

  MapView.prototype._regionAt = function (target) {
    if (!target || !target.closest) return null;
    var el = target.closest('.region, .map-marker');
    return el ? el.getAttribute('data-code') : null;
  };

  MapView.prototype._onDown = function (e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (e.target.closest && e.target.closest('.minimap')) return;
    var p = this._local(e);
    this.pointers.set(e.pointerId, p);
    try { this.root.setPointerCapture(e.pointerId); } catch (err) { /* pointeur déjà relâché */ }
    if (this.motion && this.motion.type !== 'tween') this.motion = null;
    if (this.pointers.size === 1) {
      this.drag = {
        id: e.pointerId,
        sx: p.x,
        sy: p.y,
        x0: this.x,
        y0: this.y,
        moved: false,
        code: this._regionAt(e.target),
        ctx: e.target.closest ? e.target.closest('.ctx') : null,
        type: e.pointerType,
        samples: [{ x: p.x, y: p.y, t: performance.now() }],
      };
    } else if (this.pointers.size === 2) {
      var pts = Array.from(this.pointers.values());
      this.drag = null;
      this.motion = null;
      var mid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
      this.pinch = {
        d0: Math.max(1, Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)),
        k0: this.k,
        mx: (mid.x - this.x) / this.k,
        my: (mid.y - this.y) / this.k,
      };
      this._hideTooltip();
    }
  };

  MapView.prototype._onMove = function (e) {
    var p = this._local(e);
    if (!this.pointers.has(e.pointerId)) {
      if (e.pointerType === 'mouse') this._hoverAt(e, p);
      return;
    }
    this.pointers.set(e.pointerId, p);
    if (this.pinch && this.pointers.size >= 2) {
      var pts = Array.from(this.pointers.values());
      var d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      var mid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
      var k = clamp(this.pinch.k0 * d / this.pinch.d0, this.minK, this.maxK);
      this._set(k, mid.x - this.pinch.mx * k, mid.y - this.pinch.my * k);
      return;
    }
    var dr = this.drag;
    if (!dr || dr.id !== e.pointerId) return;
    var dx = p.x - dr.sx;
    var dy = p.y - dr.sy;
    if (!dr.moved) {
      var limit = dr.type === 'mouse' ? 5 : 10;
      if (Math.hypot(dx, dy) < limit) return;
      dr.moved = true;
      this.root.classList.add('is-dragging');
      this._hideTooltip();
      this._setHover(null);
    }
    this._set(this.k, dr.x0 + dx, dr.y0 + dy);
    var now = performance.now();
    dr.samples.push({ x: p.x, y: p.y, t: now });
    while (dr.samples.length > 2 && now - dr.samples[0].t > 90) dr.samples.shift();
  };

  MapView.prototype._onUp = function (e) {
    if (!this.pointers.has(e.pointerId)) return;
    this.pointers.delete(e.pointerId);
    if (this.pinch) {
      if (this.pointers.size < 2) {
        this.pinch = null;
        var rest = Array.from(this.pointers.entries())[0];
        if (rest) {
          this.drag = { id: rest[0], sx: rest[1].x, sy: rest[1].y, x0: this.x, y0: this.y, moved: true, type: 'touch', samples: [] };
        }
      }
      return;
    }
    var dr = this.drag;
    this.drag = null;
    this.root.classList.remove('is-dragging');
    if (!dr || dr.id !== e.pointerId) return;
    var p = this._local(e);
    if (!dr.moved) {
      var tap = { x: p.x, y: p.y, t: performance.now() };
      var last = this.lastTap;
      if (this.dblZoom && last && tap.t - last.t < 320 && Math.hypot(tap.x - last.x, tap.y - last.y) < 26) {
        this.lastTap = null;
        this.zoomBy(e.shiftKey ? 0.5 : 2, p.x, p.y, 360);
        return;
      }
      this.lastTap = tap;
      if (dr.code) this._emit('activate', dr.code, { clientX: e.clientX, clientY: e.clientY, pointer: dr.type });
      else if (dr.ctx) this._emit('context', dr.ctx.getAttribute('data-name'));
      else this._emit('background');
      return;
    }
    var s = dr.samples;
    if (s.length >= 2 && !reducedMotion()) {
      var a = s[0];
      var b = s[s.length - 1];
      var dt = Math.max(1, b.t - a.t);
      var vx = (b.x - a.x) / dt;
      var vy = (b.y - a.y) / dt;
      if (performance.now() - b.t < 60 && Math.hypot(vx, vy) > 0.08) {
        this.motion = { type: 'inertia', vx: vx, vy: vy, last: performance.now() };
        this._kick();
      }
    }
  };

  MapView.prototype._onCancel = function (e) {
    this.pointers.delete(e.pointerId);
    this.pinch = null;
    this.drag = null;
    this.root.classList.remove('is-dragging');
  };

  /* ------------------------------------------------------------------ Survol */
  MapView.prototype._hoverAt = function (e, p) {
    var code = this._regionAt(e.target);
    this._setHover(code);
    if (code && this.tooltipFormatter) {
      var html = this.tooltipFormatter(code);
      if (html) { this._showTooltip(html, p, false); return; }
    } else if (!code && e.target.closest && e.target.closest('.ctx') && this.tooltipFormatter) {
      var name = e.target.closest('.ctx').getAttribute('data-name');
      var ctxHtml = name ? this.tooltipFormatter(null, name) : null;
      if (ctxHtml) { this._showTooltip(ctxHtml, p, true); return; }
    }
    this._hideTooltip();
  };

  MapView.prototype._setHover = function (code) {
    if (code === this.hoverCode) return;
    if (this.hoverCode) this.setState(this.hoverCode, 'hover', false);
    this.hoverCode = code;
    if (code) this.setState(code, 'hover', true);
    this._emit('hover', code);
  };

  MapView.prototype._showTooltip = function (html, p, muted) {
    var t = this.tooltip;
    if (t._html !== html) { t.innerHTML = html; t._html = html; }
    t.classList.toggle('map-tooltip--muted', !!muted);
    var w = t.offsetWidth;
    var x = p.x + 14;
    var y = p.y + 16;
    if (x + w > this.vw - 8) x = p.x - w - 12;
    if (y + 34 > this.vh - 8) y = p.y - 40;
    t.style.transform = 'translate(' + Math.round(x) + 'px,' + Math.round(y) + 'px)';
    t.classList.add('is-on');
  };

  MapView.prototype._hideTooltip = function () {
    this.tooltip.classList.remove('is-on');
  };

  /* ------------------------------------------------------------------ Clavier */
  MapView.prototype._onKey = function (e) {
    if (e.target !== this.root) return;
    var key = e.key;
    var dirs = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (dirs[key]) {
      e.preventDefault();
      if (this.keyNav) this._moveFocus(dirs[key]);
      else this.panBy(-dirs[key][0] * 90, -dirs[key][1] * 90, 220);
      return;
    }
    if (key === '+' || key === '=') { e.preventDefault(); this.zoomIn(); return; }
    if (key === '-' || key === '_') { e.preventDefault(); this.zoomOut(); return; }
    if (key === '0') { e.preventDefault(); this.home(true); return; }
    if (key === 'Enter' || key === ' ') {
      e.preventDefault();
      if (this.keyNav && this.focusCode) this._emit('activate', this.focusCode, { keyboard: true });
      else this._startKeyNav();
      return;
    }
    if (key === 'Escape' && this.keyNav) { e.preventDefault(); this._endKeyNav(); }
  };

  MapView.prototype._screenOf = function (r) {
    return { x: r.lx * this.k + this.x, y: r.ly * this.k + this.y };
  };

  MapView.prototype._startKeyNav = function () {
    var c = this._content();
    var best = null;
    var bestD = Infinity;
    var self = this;
    this.regions.forEach(function (r) {
      var s = self._screenOf(r);
      var d = Math.hypot(s.x - c.cx, s.y - c.cy);
      if (d < bestD) { bestD = d; best = r; }
    });
    if (best) {
      this.keyNav = true;
      this._setFocus(best.code);
    }
  };

  MapView.prototype._endKeyNav = function () {
    this.keyNav = false;
    this._setFocus(null);
  };

  MapView.prototype._setFocus = function (code) {
    if (this.focusCode) this.setState(this.focusCode, 'focus', false);
    this.focusCode = code;
    if (code) {
      this.setState(code, 'focus', true);
      this.flyTo(code, { ifNeeded: true, maxZoom: this.opts.maxZoom, padding: 0.6 });
      this._emit('focus', code);
    }
  };

  MapView.prototype._moveFocus = function (dir) {
    var cur = this.regions.get(this.focusCode);
    if (!cur) return;
    var o = { x: cur.lx, y: cur.ly };
    var best = null;
    var bestScore = Infinity;
    this.regions.forEach(function (r) {
      if (r === cur) return;
      var vx = r.lx - o.x;
      var vy = r.ly - o.y;
      var d = Math.hypot(vx, vy);
      if (!d) return;
      var along = (vx * dir[0] + vy * dir[1]) / d;
      if (along < 0.35) return;
      var score = d * (2.2 - along * 1.2) + (cur.neighbors.indexOf(r.code) !== -1 ? -d * 0.25 : 0);
      if (score < bestScore) { bestScore = score; best = r; }
    });
    if (best) this._setFocus(best.code);
  };

  /* ------------------------------------------------------------------ États des régions */
  var STATE_CLASSES = ['hover', 'selected', 'focus', 'hit', 'retry', 'miss', 'wrong', 'target', 'dim', 'neighbor', 'flash'];

  MapView.prototype.setState = function (code, state, on) {
    var r = this.regions.get(code);
    if (!r) return;
    if (on === undefined) on = true;
    if (on) r.states.add(state); else r.states.delete(state);
    r.el.classList.toggle('is-' + state, on);
    if (r.marker) r.marker.setAttribute('data-state', Array.from(r.states).join(' '));
    if (state === 'selected' && on) r.el.parentNode.appendChild(r.el);
    if (state !== 'hover' && state !== 'focus') this._schedule();
  };

  MapView.prototype.clearStates = function (states) {
    var self = this;
    states = states || STATE_CLASSES;
    this.regions.forEach(function (r) {
      states.forEach(function (s) {
        if (r.states.has(s)) self.setState(r.code, s, false);
      });
    });
  };

  MapView.prototype.flash = function (code) {
    var r = this.regions.get(code);
    if (!r || reducedMotion()) return;
    r.el.classList.remove('is-flash');
    void r.el.getBBox();
    r.el.classList.add('is-flash');
    setTimeout(function () { r.el.classList.remove('is-flash'); }, 950);
  };

  MapView.prototype.setLabelMode = function (mode) {
    this.labelMode = mode;
    this._schedule();
  };

  /* ------------------------------------------------------------------ Écritures */
  MapView.prototype._placeLabels = function () {
    var k = this.k;
    var x = this.x;
    var y = this.y;
    var vw = this.vw;
    var vh = this.vh;
    var zoom = k / this.k0;
    var placed = [];
    var mode = this.labelMode;
    var hits = function (rx, ry, rw, rh) {
      for (var i = 0; i < placed.length; i++) {
        var q = placed[i];
        if (rx < q[0] + q[2] && rx + rw > q[0] && ry < q[1] + q[3] && ry + rh > q[1]) return true;
      }
      return false;
    };
    var show = function (el, on) {
      if (el._on !== on) { el.classList.toggle('is-on', on); el._on = on; }
    };
    var self = this;
    var list = this.order;

    // Les régions sélectionnées ou désignées passent en premier.
    var first = [];
    var rest = [];
    for (var i = 0; i < list.length; i++) {
      var st = list[i].states;
      if (st.has('selected') || st.has('target')) first.push(list[i]); else rest.push(list[i]);
    }

    // Les repères des micro-territoires réservent leur place avant les écritures.
    list.forEach(function (r) {
      if (!r.marker) return;
      var mx = r.lx * k + x;
      var my = r.ly * k + y;
      r._tiny = Math.max(r.box.width * k, r.box.height * k) < 12;
      var markerOn = r._tiny && mx > -20 && mx < vw + 20 && my > -20 && my < vh + 20;
      if (markerOn) {
        r.marker.style.transform = 'translate(' + mx + 'px,' + my + 'px)';
        placed.push([mx - 9, my - 9, 18, 18]);
      }
      show(r.marker, markerOn);
    });

    first.concat(rest).forEach(function (r) {
      var sx = r.lx * k + x;
      var sy = r.ly * k + y;
      var bw = r.box.width * k;
      var bh = r.box.height * k;
      var answered = r.states.has('hit') || r.states.has('retry') || r.states.has('miss');
      var forced = r.states.has('selected') || r.states.has('target');
      var allowed = mode === 'names' || forced || (mode === 'answered' && answered);
      var text = null;
      var w = 0;
      var short = false;
      if (allowed && sx > -60 && sx < vw + 60 && sy > -30 && sy < vh + 30) {
        if (forced || (r.nameW <= bw * 0.92 && bh >= 15)) {
          text = self.opts.names[r.code] || r.code;
          w = r.nameW;
        } else if (r.short && r.shortW <= bw * 0.95 && bh >= 13) {
          text = r.short;
          w = r.shortW;
          short = true;
        }
      }
      var h = 16;
      // À côté du repère quand la région est trop petite pour porter son nom.
      var lx0 = r.marker && r._tiny ? sx + 12 : sx - w / 2;
      if (text && !forced && hits(lx0, sy - h / 2, w, h)) text = null;
      if (text) {
        placed.push([lx0 - 2, sy - h / 2 - 1, w + 4, h + 2]);
        if (r.labelText !== text) {
          r.label.textContent = text;
          r.labelText = text;
        }
        var dark = r.states.has('hit');
        var onDark = dark && !r._tiny && (short ? r.shortW <= bw * 0.95 : r.nameW <= bw * 0.92);
        if (r._short !== short) { r.label.classList.toggle('map-label--short', short); r._short = short; }
        if (r._dark !== onDark) { r.label.classList.toggle('is-on-dark', onDark); r._dark = onDark; }
        r.label.style.transform = 'translate(' + lx0 + 'px,' + (sy - h / 2) + 'px)';
      }
      show(r.label, !!text);
    });

    var plateR = x + self.W * k;
    var plateB = y + self.H * k;
    this.annotations.forEach(function (a) {
      var minZoom = a.rank === 1 ? 0 : a.rank === 2 ? 1.7 : 3;
      // Les écritures restent dans le cadre de la planche.
      var sx = clamp(a.x * k + x, x + a.w / 2 + 6, plateR - a.w / 2 - 6);
      var sy = clamp(a.y * k + y, y + a.h / 2 + 4, plateB - a.h / 2 - 4);
      var on = zoom >= minZoom && sx - a.w / 2 > 2 && sx + a.w / 2 < vw - 2 && sy > 8 && sy < vh - 8;
      if (on && hits(sx - a.w / 2, sy - a.h / 2, a.w, a.h)) on = false;
      if (on) {
        placed.push([sx - a.w / 2, sy - a.h / 2, a.w, a.h]);
        a.el.style.transform = 'translate(' + (sx - a.w / 2) + 'px,' + (sy - a.h / 2) + 'px)';
      }
      show(a.el, on);
    });
  };

  /* ------------------------------------------------------------------ Épingles */
  MapView.prototype.pin = function (code, html, variant, pulse) {
    var r = this.regions.get(code);
    if (!r) return null;
    var el = document.createElement('div');
    el.className = 'map-pin' + (variant ? ' map-pin--' + variant : '') + (pulse ? ' is-pulse' : '');
    el.innerHTML = html;
    this.labelsLayer.appendChild(el);
    var pin = { code: code, el: el };
    this.pins.push(pin);
    this._placePins();
    return pin;
  };

  MapView.prototype.clearPins = function () {
    this.pins.forEach(function (p) { p.el.remove(); });
    this.pins = [];
  };

  MapView.prototype._placePins = function () {
    var self = this;
    this.pins.forEach(function (p) {
      var r = self.regions.get(p.code);
      var s = self._screenOf(r);
      var w = p.el.offsetWidth;
      var h = p.el.offsetHeight;
      var top = r.box.y * self.k + self.y;
      // Près du haut de la région, mais jamais loin de son point d'étiquette (îles lointaines : Svalbard, Corse…).
      var anchorY = Math.max(s.y - 64, Math.min(s.y - 6, top + Math.min(r.box.height * self.k * 0.35, 40)));
      p.el.style.transform = 'translate(' + Math.round(s.x - w / 2) + 'px,' + Math.round(anchorY - h - 8) + 'px)';
    });
  };

  MapView.prototype.screenPointOf = function (code) {
    var r = this.regions.get(code);
    return r ? this._screenOf(r) : null;
  };

  MapView.prototype.isVisible = function (code) {
    var r = this.regions.get(code);
    if (!r) return false;
    var s = this._screenOf(r);
    var c = this._content();
    return s.x > c.L && s.x < c.R && s.y > c.T && s.y < c.B;
  };

  MapView.prototype.region = function (code) {
    return this.regions.get(code) || null;
  };

  /* ------------------------------------------------------------------ Mini-carte */
  // Échelle graphique : une longueur ronde en km, entre 70 et 140 px environ.
  var SCALE_STEPS = [0.5, 1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000];
  MapView.prototype._updateScale = function () {
    if (!this.scaleBar) return;
    var pxPerKm = this.k / this.kmPerUnit;
    var target = 120 / pxPerKm;
    var pick = SCALE_STEPS[0];
    for (var i = 0; i < SCALE_STEPS.length; i++) if (SCALE_STEPS[i] <= target) pick = SCALE_STEPS[i];
    var len = Math.round(pick * pxPerKm);
    if (this._scaleLen !== len) {
      this._scaleLen = len;
      this.scaleBar.lastChild.style.width = len + 'px';
      this.scaleBar.firstChild.textContent = pick.toLocaleString('fr-FR') + ' km';
    }
    var lift = this.insets.bottom ? this.insets.bottom + 4 : 0;
    if (this._scaleLift !== lift) {
      // Première pose sans glissement ; ensuite l'échelle suit le panneau en douceur.
      var first = this._scaleLift === undefined;
      if (first) this.scaleBar.style.transition = 'none';
      this._scaleLift = lift;
      this.scaleBar.style.transform = lift ? 'translateY(' + -lift + 'px)' : '';
      if (first) {
        void this.scaleBar.offsetWidth;
        this.scaleBar.style.transition = '';
      }
    }
  };

  MapView.prototype._updateMinimap = function () {
    var c = this._content();
    var vx = (c.L - this.x) / this.k;
    var vy = (c.T - this.y) / this.k;
    var vw = c.w / this.k;
    var vh = c.h / this.k;
    this.minimapView.setAttribute('x', vx);
    this.minimapView.setAttribute('y', vy);
    this.minimapView.setAttribute('width', vw);
    this.minimapView.setAttribute('height', vh);
    var on = this.k > this.k0 * 1.35 && this.minimapEnabled !== false;
    if (this._miniOn !== on) {
      this.minimap.classList.toggle('is-on', on);
      this._miniOn = on;
    }
  };

  global.Atlas = global.Atlas || {};
  global.Atlas.MapView = MapView;
})(window);
