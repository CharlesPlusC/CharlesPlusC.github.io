/**
 * Landing page space stats.
 * Reads data/space-stats.json, rebuilt daily by the update-space-stats workflow
 * from the CelesTrak catalogue. Counts are over a rolling 30-day window: same-day
 * counts would read zero on roughly half of all days, since launches are bursty
 * and the catalogue lags a few days behind reality.
 */

(function () {
  'use strict';

  // Do not wait on DOMContentLoaded unconditionally: this script sits behind
  // several CDN tags, so on a cached load it can execute after the document has
  // already parsed, and the listener would never fire.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadSpaceStats);
  } else {
    loadSpaceStats();
  }

  async function loadSpaceStats() {
    const strip = document.getElementById('space-stats');
    if (!strip) return;

    // The theme animates the opacity of #main, which both dims everything
    // inside it and makes it a stacking context - trapping this fixed bar in
    // it, behind the footer, whatever z-index it carries. Reparent to <body>
    // so the bar sits against the viewport. Do this before fetching, so it
    // still happens if the data call fails.
    if (strip.parentElement !== document.body) {
      document.body.appendChild(strip);
    }

    try {
      const response = await fetch('/data/space-stats.json', { cache: 'no-cache' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const stats = await response.json();

      setValue('stat-launched', stats.launched);
      setValue('stat-reentered', stats.reentered);
      setValue('stat-onorbit', stats.on_orbit);

      const sub = document.getElementById('stat-onorbit-sub');
      if (sub && Number.isFinite(stats.payloads)) {
        sub.textContent = `${fmt(stats.payloads)} payloads`;
      }

    } catch (err) {
      // Nothing to show is better than a row of dashes over the animation.
      console.error('Space stats unavailable:', err);
      strip.remove();
    }
  }

  function setValue(id, value) {
    const el = document.getElementById(id);
    if (el && Number.isFinite(value)) el.textContent = fmt(value);
  }

  function fmt(n) {
    return n.toLocaleString('en-GB');
  }
})();
