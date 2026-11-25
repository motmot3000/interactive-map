/* Cartes interactives — accueil : l'année du pied de page et le record de chaque carte. */
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
})(window);
