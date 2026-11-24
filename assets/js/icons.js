/* Cartes interactives 2.0 — pictogrammes (grille 24 px, trait 1,75, extrémités arrondies). */
(function (global) {
  'use strict';

  var PATHS = {
    back: '<path d="M19 12H5"/><path d="M11 18l-6-6 6-6"/>',
    next: '<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>',
    chevron: '<path d="M9 6l6 6-6 6"/>',
    plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    fit: '<path d="M4 9V5h4"/><path d="M20 9V5h-4"/><path d="M4 15v4h4"/><path d="M20 15v4h-4"/><path d="M9.5 12h5"/>',
    expand: '<path d="M8 3H3v5"/><path d="M16 3h5v5"/><path d="M21 16v5h-5"/><path d="M3 16v5h5"/>',
    shrink: '<path d="M8 3v5H3"/><path d="M16 3v5h5"/><path d="M21 16h-5v5"/><path d="M3 16h5v5"/>',
    soundOn: '<path d="M11 5L6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9.2 9.2 0 0 1 0 13"/>',
    soundOff: '<path d="M11 5L6 9H3v6h3l5 4z"/><path d="M16 9.5l5 5"/><path d="M21 9.5l-5 5"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.4-4.4"/>',
    close: '<path d="M6 6l12 12"/><path d="M18 6L6 18"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    cross: '<path d="M7 7l10 10"/><path d="M17 7L7 17"/>',
    replay: '<path d="M20 12a8 8 0 1 1-2.34-5.66"/><path d="M20 4.5v4.2h-4.2"/>',
    locate: '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7.5"/><path d="M12 2v2.5"/><path d="M12 19.5V22"/><path d="M2 12h2.5"/><path d="M19.5 12H22"/>',
    question: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.2a2.5 2.5 0 1 1 3.6 2.3c-.8.4-1.2 1-1.2 1.8"/><path d="M12 16.8h.01"/>',
    map: '<path d="M9 4.5L3.5 6.5v13L9 17.5l6 2 5.5-2v-13L15 6.5z"/><path d="M9 4.5v13"/><path d="M15 6.5v13"/>',
    quiz: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>',
    list: '<path d="M9 6h11"/><path d="M9 12h11"/><path d="M9 18h11"/><path d="M4.5 6h.01"/><path d="M4.5 12h.01"/><path d="M4.5 18h.01"/>',
    award: '<circle cx="12" cy="9" r="5.5"/><path d="M8.6 13.4L7.5 21l4.5-2.6 4.5 2.6-1.1-7.6"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
    keyboard: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h.01"/><path d="M11 10h.01"/><path d="M15 10h.01"/><path d="M8 14h8"/>',
    touch: '<path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11"/><path d="M12 10.5V9a1.5 1.5 0 0 1 3 0v2"/><path d="M15 11v-.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-.6a6 6 0 0 1-4.6-2.2L4 15.2a1.5 1.5 0 0 1 2.2-2L9 15.5"/>',
    board: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 20l4-4 4 4"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  };

  function icon(name, extraClass) {
    var body = PATHS[name] || '';
    return '<svg class="icon' + (extraClass ? ' ' + extraClass : '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + body + '</svg>';
  }

  function hydrate(scope) {
    Array.prototype.forEach.call((scope || document).querySelectorAll('[data-icon]'), function (el) {
      if (el.querySelector('svg.icon')) return;
      el.insertAdjacentHTML('afterbegin', icon(el.getAttribute('data-icon')));
    });
  }

  global.Atlas = global.Atlas || {};
  global.Atlas.icon = icon;
  global.Atlas.hydrateIcons = hydrate;
  if (document.readyState !== 'loading') hydrate();
  else document.addEventListener('DOMContentLoaded', function () { hydrate(); });
})(window);
