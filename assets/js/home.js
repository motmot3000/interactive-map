/* Cartes interactives — accueil : une planche jouable en trois questions, et les records de chaque carte. */
(function (global) {
  'use strict';

  var year = document.querySelector('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());

  // Étoiles du meilleur quiz de chaque carte (records gardés dans le navigateur par atlas-game.js).
  var starsOf = function (hits, total) {
    var pct = total ? hits / total : 0;
    return pct >= 1 ? 3 : pct >= 0.8 ? 2 : pct >= 0.5 ? 1 : 0;
  };
  var starIcons = function (n) {
    var out = '';
    for (var i = 0; i < 3; i++) out += global.Atlas.icon('star', i < n ? 'is-on' : '');
    return '<span class="stars" role="img" aria-label="' + n + ' étoile' + (n > 1 ? 's' : '') + ' sur 3">' + out + '</span>';
  };
  Array.prototype.forEach.call(document.querySelectorAll('[data-record]'), function (el) {
    var map = el.getAttribute('data-record');
    var best = -1;
    try {
      for (var i = 0; i < global.localStorage.length; i++) {
        var key = global.localStorage.key(i);
        if (key.indexOf('cartes:record:' + map + ':') !== 0) continue;
        var r = JSON.parse(global.localStorage.getItem(key));
        if (r && r.total) best = Math.max(best, starsOf(r.hits, r.total));
      }
    } catch (e) { /* navigation privée */ }
    if (best < 0 || !global.Atlas || !global.Atlas.icon) return;
    el.innerHTML = '<span>Ton record</span>' + starIcons(best);
    el.hidden = false;
  });

  var root = document.querySelector('.teaser');
  var data = global.ATLAS_MAP;
  if (!root || !data) return;

  var svg = root.querySelector('svg');
  var targetEl = root.querySelector('[data-teaser-target]');
  var countEl = root.querySelector('[data-teaser-count]');
  var foot = root.querySelector('[data-teaser-foot]');
  var pin = root.querySelector('.teaser__pin');
  var mapBox = root.querySelector('.teaser__map');
  if (!svg) return;

  var CANDIDATES = ['FR', 'ES', 'IT', 'DE', 'PL', 'SE', 'NO', 'FI', 'UA', 'GB', 'RO', 'GR', 'PT', 'IE', 'IS', 'TR', 'BY', 'CZ', 'AT', 'HU', 'BG', 'CH', 'NL', 'DK'];
  var ROUNDS = 3;
  var queue = [];
  var index = 0;
  var tries = 0;
  var found = 0;
  var locked = false;
  var pinTimer = 0;

  var regions = Array.prototype.slice.call(svg.querySelectorAll('[data-code]'));
  regions.forEach(function (el) {
    var code = el.getAttribute('data-code');
    if (!data.regions[code]) return;
    el.setAttribute('tabindex', '-1');
  });

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function el(code) {
    return svg.querySelector('[data-code="' + code + '"]');
  }

  function showPin(code, text, miss) {
    var path = el(code);
    if (!path) return;
    var box = path.getBoundingClientRect();
    var host = mapBox.getBoundingClientRect();
    pin.textContent = text;
    pin.className = 'teaser__pin' + (miss ? ' teaser__pin--miss' : '');
    pin.style.left = (box.left + box.width / 2 - host.left) + 'px';
    pin.style.top = (box.top + Math.min(box.height * 0.4, 36) - host.top) + 'px';
    pin.hidden = false;
    clearTimeout(pinTimer);
    pinTimer = setTimeout(function () { pin.hidden = true; }, 1600);
  }

  function ask() {
    tries = 0;
    locked = false;
    var code = queue[index];
    targetEl.textContent = data.regions[code].name;
    countEl.textContent = index + ' / ' + ROUNDS;
    foot.textContent = index === 0 ? 'Clique sur la carte.' : 'Suivant : clique sur la carte.';
  }

  function start() {
    regions.forEach(function (r) { r.classList.remove('is-hit', 'is-wrong', 'is-show'); });
    queue = shuffle(CANDIDATES.slice()).slice(0, ROUNDS);
    index = 0;
    found = 0;
    ask();
  }

  function finish() {
    countEl.textContent = ROUNDS + ' / ' + ROUNDS;
    targetEl.textContent = found + ' sur ' + ROUNDS;
    root.querySelector('.teaser__ask').textContent = found === ROUNDS ? 'Bravo !' : 'Trouvés :';
    foot.innerHTML = '<span>Encore ' + (Object.keys(data.regions).length - ROUNDS) + ' pays à découvrir.</span>'
      + '<span class="teaser__more"><button type="button" class="btn" data-teaser-again>Rejouer</button> '
      + '<a class="btn btn--primary" href="maps/europe/index.html#quiz">Carte d’Europe</a></span>';
    foot.querySelector('[data-teaser-again]').addEventListener('click', function () {
      root.querySelector('.teaser__ask').textContent = 'Trouve :';
      start();
    });
  }

  svg.addEventListener('click', function (e) {
    var path = e.target.closest('[data-code]');
    if (!path || locked) return;
    var code = path.getAttribute('data-code');
    if (!data.regions[code]) return;
    var goal = queue[index];
    if (code === goal) {
      locked = true;
      if (tries === 0) found += 1;
      path.classList.add(tries === 0 ? 'is-hit' : 'is-show');
      showPin(code, data.regions[code].name, false);
      foot.textContent = tries === 0 ? 'Bien vu !' : 'Trouvé !';
      index += 1;
      setTimeout(function () {
        if (index >= ROUNDS) finish(); else ask();
      }, 900);
      return;
    }
    tries += 1;
    path.classList.add('is-wrong');
    setTimeout(function () { path.classList.remove('is-wrong'); }, 700);
    if (tries >= 2) {
      locked = true;
      var right = el(goal);
      if (right) right.classList.add('is-show');
      showPin(goal, 'Ici : ' + data.regions[goal].name, false);
      foot.textContent = 'Raté : la bonne réponse est indiquée sur la carte.';
      index += 1;
      setTimeout(function () {
        if (index >= ROUNDS) finish(); else ask();
      }, 1800);
    } else {
      showPin(code, 'Ça, c’est : ' + data.regions[code].name, true);
      foot.textContent = 'Non. Encore un essai.';
    }
  });

  start();
})(window);
