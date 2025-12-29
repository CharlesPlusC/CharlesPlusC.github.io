/**
 * Satellite Passes - Meteor-M Weather Satellite Pass Predictions
 *
 * This module provides real-time satellite pass predictions using either:
 * 1. Pre-calculated data from JSON files (updated via GitHub Actions)
 * 2. Client-side computation using satellite.js for custom locations
 *
 * Satellites tracked:
 * - Meteor-M N2-3 (NORAD ID: 57166) - 137.9 MHz LRPT
 * - Meteor-M N2-4 (NORAD ID: 59051) - 137.1 MHz LRPT
 */

(function() {
  'use strict';

  // State variables
  var allData = null;
  var expandedSats = {};
  var currentView = 'grouped';
  var countdownInterval = null;
  var customLocation = null;

  // Satellite definitions
  var SATELLITES = [
    { name: 'Meteor-M N2-3', frequency: '137.9 MHz LRPT', noradId: 57166 },
    { name: 'Meteor-M N2-4', frequency: '137.1 MHz LRPT', noradId: 59051 }
  ];

  /**
   * Fetch Two-Line Element (TLE) data from Celestrak
   * @param {number} noradId - NORAD catalog ID of the satellite
   * @returns {Promise<{line1: string, line2: string}|null>} TLE data or null on failure
   */
  async function fetchTLE(noradId) {
    var urls = [
      'https://celestrak.org/NORAD/elements/gp.php?CATNR=' + noradId + '&FORMAT=TLE',
      'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://celestrak.org/NORAD/elements/gp.php?CATNR=' + noradId + '&FORMAT=TLE')
    ];

    for (var i = 0; i < urls.length; i++) {
      try {
        var response = await fetch(urls[i], { timeout: 10000 });
        if (response.ok) {
          var text = await response.text();
          var lines = text.trim().split('\n');
          if (lines.length >= 3) {
            return { line1: lines[1].trim(), line2: lines[2].trim() };
          }
        }
      } catch (e) { /* try next URL */ }
    }
    return null;
  }

  /**
   * Compute satellite passes using satellite.js library
   * @param {Object} tle - TLE data with line1 and line2
   * @param {number} lat - Observer latitude in degrees
   * @param {number} lon - Observer longitude in degrees
   * @param {number} alt - Observer altitude in meters
   * @param {Date} startDate - Start date for pass computation
   * @param {number} days - Number of days to compute
   * @returns {Array} Array of pass objects
   */
  function computePasses(tle, lat, lon, alt, startDate, days) {
    var satrec = satellite.twoline2satrec(tle.line1, tle.line2);
    var passes = [];
    var stepMinutes = 1;
    var endDate = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);
    var observerGd = {
      longitude: satellite.degreesToRadians(lon),
      latitude: satellite.degreesToRadians(lat),
      height: alt / 1000
    };

    var inPass = false;
    var currentPass = null;
    var track = [];

    for (var t = new Date(startDate); t < endDate; t = new Date(t.getTime() + stepMinutes * 60 * 1000)) {
      var positionAndVelocity = satellite.propagate(satrec, t);
      if (!positionAndVelocity.position) continue;

      var gmst = satellite.gstime(t);
      var positionEcf = satellite.eciToEcf(positionAndVelocity.position, gmst);
      var lookAngles = satellite.ecfToLookAngles(observerGd, positionEcf);

      var elevation = satellite.radiansToDegrees(lookAngles.elevation);
      var azimuth = satellite.radiansToDegrees(lookAngles.azimuth);
      if (azimuth < 0) azimuth += 360;

      if (elevation > 0) {
        if (!inPass) {
          inPass = true;
          currentPass = { start: new Date(t), maxEl: elevation, maxElTime: new Date(t), track: [] };
          track = [];
        }
        if (elevation > currentPass.maxEl) {
          currentPass.maxEl = elevation;
          currentPass.maxElTime = new Date(t);
        }
        track.push([Math.round(azimuth * 10) / 10, Math.round(elevation * 10) / 10]);
      } else if (inPass) {
        inPass = false;
        currentPass.end = new Date(t);
        currentPass.duration = Math.round((currentPass.end - currentPass.start) / 60000);
        // Sample track to max 30 points for performance
        if (track.length > 30) {
          var sampled = [];
          for (var i = 0; i < 30; i++) {
            sampled.push(track[Math.floor(i * track.length / 30)]);
          }
          track = sampled;
        }
        currentPass.track = track;
        passes.push(currentPass);
        currentPass = null;
      }
    }

    return passes;
  }

  /**
   * Convert computed passes to the standard data format
   * @param {Array} passes - Array of computed pass objects
   * @returns {Array} Formatted pass objects
   */
  function formatComputedPasses(passes) {
    return passes.map(function(p) {
      return {
        start: p.start.toISOString(),
        end: p.end.toISOString(),
        max_elevation: Math.round(p.maxEl * 10) / 10,
        max_elevation_time: p.maxElTime.toISOString(),
        duration: p.duration,
        track: p.track
      };
    });
  }

  /**
   * Use browser geolocation to get user's position and compute passes
   */
  async function useMyLocation() {
    var btn = document.getElementById('geolocate-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="icon">&#x23F3;</span> Getting location...';

    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      btn.disabled = false;
      btn.innerHTML = '<span class="icon">&#x1F4CD;</span> Use my location';
      return;
    }

    try {
      var position = await new Promise(function(resolve, reject) {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000
        });
      });

      customLocation = {
        lat: position.coords.latitude,
        lon: position.coords.longitude,
        alt: position.coords.altitude || 0
      };

      btn.innerHTML = '<span class="icon">&#x23F3;</span> Computing passes...';
      showStatus('Computing passes for your location...');

      // Fetch TLEs and compute passes for each satellite
      var satellites = {};
      for (var i = 0; i < SATELLITES.length; i++) {
        var sat = SATELLITES[i];
        var tle = await fetchTLE(sat.noradId);
        if (tle) {
          var passes = computePasses(tle, customLocation.lat, customLocation.lon, customLocation.alt, new Date(), 7);
          satellites[sat.noradId] = {
            name: sat.name,
            frequency: sat.frequency,
            passes: formatComputedPasses(passes)
          };
        }
      }

      allData = {
        success: true,
        location: {
          name: 'My Location',
          lat: customLocation.lat,
          lon: customLocation.lon,
          alt: customLocation.alt
        },
        satellites: satellites,
        generated_at: new Date().toISOString()
      };

      // Update UI to show custom location
      var select = document.getElementById('location-select');
      var customOpt = select.querySelector('option[value="custom"]');
      customOpt.style.display = '';
      customOpt.disabled = false;
      customOpt.textContent = 'My Location (' + customLocation.lat.toFixed(2) + ', ' + customLocation.lon.toFixed(2) + ')';
      select.value = 'custom';

      document.getElementById('location-coords').textContent =
        customLocation.lat.toFixed(4) + '\u00B0' + (customLocation.lat >= 0 ? 'N' : 'S') + ', ' +
        Math.abs(customLocation.lon).toFixed(4) + '\u00B0' + (customLocation.lon >= 0 ? 'E' : 'W');

      var entries = Object.entries(allData.satellites);
      for (var j = 0; j < entries.length; j++) {
        expandedSats[entries[j][0]] = true;
      }

      updateFilters();
      updateNextPassBanner();
      if (countdownInterval) clearInterval(countdownInterval);
      countdownInterval = setInterval(updateNextPassBanner, 1000);

      showStatus('Computed passes for your exact location');
      btn.innerHTML = '<span class="icon">&#x2714;</span> Location set';

    } catch (error) {
      var msg = error.code === 1 ? 'Location permission denied' : 'Could not get location';
      alert(msg);
      btn.disabled = false;
      btn.innerHTML = '<span class="icon">&#x1F4CD;</span> Use my location';
    }
  }

  /**
   * Calculate solar elevation angle for day/night determination
   * @param {Date} date - Date/time to calculate for
   * @param {number} lat - Observer latitude
   * @param {number} lon - Observer longitude
   * @returns {number} Solar elevation in degrees
   */
  function getSunElevation(date, lat, lon) {
    var rad = Math.PI / 180;
    var dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
    var declination = -23.45 * Math.cos(rad * 360 / 365 * (dayOfYear + 10));
    var hourAngle = (date.getUTCHours() + date.getUTCMinutes() / 60 - 12) * 15 + lon;
    var sinElev = Math.sin(lat * rad) * Math.sin(declination * rad) +
                  Math.cos(lat * rad) * Math.cos(declination * rad) * Math.cos(hourAngle * rad);
    return Math.asin(sinElev) / rad;
  }

  /**
   * Get day/night classification for a given time and location
   * @param {Date} date - Date/time to check
   * @param {number} lat - Observer latitude
   * @param {number} lon - Observer longitude
   * @returns {Object} Object with type ('day'|'twilight'|'night') and icon
   */
  function getDayNight(date, lat, lon) {
    var elev = getSunElevation(date, lat, lon);
    if (elev > 0) return { type: 'day', icon: '\u2600' };
    if (elev > -6) return { type: 'twilight', icon: '\u25D1' };
    return { type: 'night', icon: '\u263D' };
  }

  /**
   * Format milliseconds as a human-readable countdown string
   * @param {number} ms - Milliseconds until event
   * @returns {string} Formatted countdown (e.g., "2h 15m" or "45s")
   */
  function formatCountdown(ms) {
    if (ms < 0) return 'now';
    var totalSecs = Math.floor(ms / 1000);
    var hours = Math.floor(totalSecs / 3600);
    var mins = Math.floor((totalSecs % 3600) / 60);
    var secs = totalSecs % 60;
    if (hours > 0) return hours + 'h ' + mins + 'm';
    if (mins > 0) return mins + 'm ' + secs + 's';
    return secs + 's';
  }

  /**
   * Update the "next pass" countdown banner
   */
  function updateNextPassBanner() {
    if (!allData) return;
    var now = new Date();
    var nextPass = null;
    var nextSatName = '';

    var entries = Object.entries(allData.satellites);
    for (var i = 0; i < entries.length; i++) {
      var noradId = entries[i][0], satData = entries[i][1];
      var passes = satData.passes || [];
      for (var j = 0; j < passes.length; j++) {
        var passTime = new Date(passes[j].start);
        if (passTime > now && (!nextPass || passTime < new Date(nextPass.start))) {
          nextPass = passes[j];
          nextSatName = satData.name;
        }
      }
    }

    var banner = document.getElementById('next-pass-banner');
    if (!nextPass) {
      banner.style.display = 'none';
      return;
    }

    banner.style.display = 'flex';
    var passTime = new Date(nextPass.start);
    var timeUntil = passTime - now;
    var quality = nextPass.max_elevation >= 45 ? 'Excellent' : (nextPass.max_elevation >= 25 ? 'Good' : 'Fair');

    banner.innerHTML =
      '<div><div class="next-pass-label">Next Pass</div><div class="next-pass-sat">' + nextSatName + '</div></div>' +
      '<div class="next-pass-info">' +
        '<div class="next-pass-countdown">' + formatCountdown(timeUntil) + '</div>' +
        '<div class="next-pass-time">' + formatTime(nextPass.start) + ' \u2022 ' + formatDate(nextPass.start) + '</div>' +
        '<div class="next-pass-elev">' + nextPass.max_elevation.toFixed(0) + '\u00B0 ' + quality + '</div>' +
      '</div>';
  }

  /**
   * Switch between grouped and chronological view modes
   * @param {string} view - 'grouped' or 'chrono'
   */
  function setView(view) {
    currentView = view;
    document.getElementById('view-grouped').className = 'view-btn' + (view === 'grouped' ? ' active' : '');
    document.getElementById('view-chrono').className = 'view-btn' + (view === 'chrono' ? ' active' : '');
    updateFilters();
  }

  /**
   * Load satellite pass data from pre-calculated JSON files
   */
  async function loadSatellitePasses() {
    var locationSlug = document.getElementById('location-select').value;
    if (locationSlug === 'custom' && customLocation && allData) {
      // Already have custom location data
      updateFilters();
      return;
    }

    try {
      showStatus('Loading pass predictions...');
      var response = await fetch('/data/passes-' + locationSlug + '.json');
      if (!response.ok) throw new Error('Failed to load (HTTP ' + response.status + ')');
      var data = await response.json();
      if (!data.success) throw new Error(data.error || 'Unknown error');

      allData = data;
      var entries = Object.entries(data.satellites);
      for (var i = 0; i < entries.length; i++) {
        expandedSats[entries[i][0]] = true;
      }

      document.getElementById('location-coords').textContent =
        data.location.lat.toFixed(2) + '\u00B0N, ' + Math.abs(data.location.lon).toFixed(2) + '\u00B0' + (data.location.lon < 0 ? 'W' : 'E');

      updateFilters();
      updateNextPassBanner();
      if (countdownInterval) clearInterval(countdownInterval);
      countdownInterval = setInterval(updateNextPassBanner, 1000);

      var genTime = new Date(data.generated_at);
      showStatus('Updated ' + genTime.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' \u2022 Refreshes every 6 hours');
    } catch (error) {
      showStatus('Error: ' + error.message, true);
    }
  }

  /**
   * Toggle satellite group expansion
   * @param {string} noradId - NORAD ID of the satellite to toggle
   */
  function toggleSatellite(noradId) {
    expandedSats[noradId] = !expandedSats[noradId];
    var header = document.querySelector('[data-sat="' + noradId + '"]');
    var container = document.querySelector('[data-passes="' + noradId + '"]');
    if (header && container) {
      if (expandedSats[noradId]) {
        header.classList.remove('collapsed');
        container.classList.remove('collapsed');
      } else {
        header.classList.add('collapsed');
        container.classList.add('collapsed');
      }
    }
  }

  /**
   * Apply filters and update the display
   */
  function updateFilters() {
    if (!allData) return;
    var daysFilter = parseInt(document.getElementById('days-filter').value);
    var elevFilter = parseInt(document.getElementById('elevation-filter').value);
    var satFilter = document.getElementById('satellite-filter').value;
    document.getElementById('days-value').textContent = daysFilter;

    var now = new Date();
    var cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + daysFilter);

    var filteredData = {};
    var totalPasses = 0, excellentPasses = 0;

    var entries = Object.entries(allData.satellites);
    for (var i = 0; i < entries.length; i++) {
      var noradId = entries[i][0], satData = entries[i][1];
      if (satFilter !== 'all' && satFilter !== noradId) continue;
      var filteredPasses = [];
      var passes = satData.passes || [];
      for (var j = 0; j < passes.length; j++) {
        var pass = passes[j];
        var passEnd = new Date(pass.end);
        var passStart = new Date(pass.start);
        if (passEnd > now && passStart <= cutoffDate && pass.max_elevation >= elevFilter) {
          filteredPasses.push(pass);
          totalPasses++;
          if (pass.max_elevation >= 45) excellentPasses++;
        }
      }
      filteredData[noradId] = { name: satData.name, frequency: satData.frequency, passes: filteredPasses };
    }

    document.getElementById('stats-bar').innerHTML =
      '<div class="stat-item"><span class="stat-number">' + totalPasses + '</span><span class="stat-label">passes</span></div>' +
      '<div class="stat-item"><span class="stat-number" style="color:#1e40af">' + excellentPasses + '</span><span class="stat-label">excellent</span></div>' +
      '<div class="stat-item"><span class="stat-number">' + daysFilter + '</span><span class="stat-label">days</span></div>';

    if (currentView === 'chrono') {
      displayPassesChronological(filteredData);
    } else {
      displayPasses(filteredData);
    }
  }

  /**
   * Create a small SVG sky chart showing the satellite pass track
   * @param {Object} pass - Pass object with track data
   * @param {string} satColor - Color for the track line
   * @returns {string} SVG markup
   */
  function createSkyChartSmall(pass, satColor) {
    var size = 60, cx = size/2, cy = size/2, r = size/2 - 4;
    var svg = '<svg viewBox="0 0 ' + size + ' ' + size + '" xmlns="http://www.w3.org/2000/svg">';
    svg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>';
    svg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r/2) + '" fill="none" stroke="#e2e8f0" stroke-width="0.5" stroke-dasharray="2,2"/>';

    if (pass.track && pass.track.length > 1) {
      var pathData = '';
      for (var i = 0; i < pass.track.length; i++) {
        var az = pass.track[i][0], el = pass.track[i][1];
        var azRad = (az - 90) * Math.PI / 180;
        var dist = r * (90 - el) / 90;
        var x = cx + dist * Math.cos(azRad);
        var y = cy + dist * Math.sin(azRad);
        pathData += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1);
      }
      svg += '<path d="' + pathData + '" fill="none" stroke="' + satColor + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';

      // Start point (filled circle)
      var startAz = pass.track[0][0], startEl = pass.track[0][1];
      var startRad = (startAz - 90) * Math.PI / 180;
      var startDist = r * (90 - startEl) / 90;
      var startX = cx + startDist * Math.cos(startRad);
      var startY = cy + startDist * Math.sin(startRad);
      svg += '<circle cx="' + startX.toFixed(1) + '" cy="' + startY.toFixed(1) + '" r="3" fill="' + satColor + '"/>';

      // End point (hollow circle)
      var endAz = pass.track[pass.track.length-1][0], endEl = pass.track[pass.track.length-1][1];
      var endRad = (endAz - 90) * Math.PI / 180;
      var endDist = r * (90 - endEl) / 90;
      var endX = cx + endDist * Math.cos(endRad);
      var endY = cy + endDist * Math.sin(endRad);
      svg += '<circle cx="' + endX.toFixed(1) + '" cy="' + endY.toFixed(1) + '" r="2.5" fill="white" stroke="' + satColor + '" stroke-width="1.5"/>';
    }
    svg += '</svg>';
    return svg;
  }

  /**
   * Get quality classification based on max elevation
   * @param {number} el - Maximum elevation in degrees
   * @returns {string} Quality class ('excellent', 'good', or 'fair')
   */
  function getQuality(el) {
    return el >= 45 ? 'excellent' : (el >= 25 ? 'good' : 'fair');
  }

  /**
   * Format ISO date string as human-readable date
   * @param {string} iso - ISO date string
   * @returns {string} Formatted date (e.g., "Today", "Tomorrow", "Mon, Jan 15")
   */
  function formatDate(iso) {
    var d = new Date(iso), today = new Date(), tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  /**
   * Format ISO date string as time
   * @param {string} iso - ISO date string
   * @returns {string} Formatted time (e.g., "14:30")
   */
  function formatTime(iso) {
    return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  /**
   * Get a unique key for grouping passes by day
   * @param {string} iso - ISO date string
   * @returns {string} Date string for grouping
   */
  function getDayKey(iso) {
    return new Date(iso).toDateString();
  }

  /**
   * Display passes in chronological order
   * @param {Object} satellitesData - Filtered satellite data
   */
  function displayPassesChronological(satellitesData) {
    var container = document.getElementById('passes-container');
    container.innerHTML = '';
    var colors = { '57166': '#3b82f6', '59051': '#8b5cf6' };
    var lat = allData.location.lat, lon = allData.location.lon;

    var allPasses = [];
    var entries = Object.entries(satellitesData);
    for (var i = 0; i < entries.length; i++) {
      var noradId = entries[i][0], satData = entries[i][1];
      var passes = satData.passes || [];
      for (var j = 0; j < passes.length; j++) {
        allPasses.push({
          pass: passes[j],
          noradId: noradId,
          satName: satData.name,
          satColor: colors[noradId] || '#6b7280'
        });
      }
    }

    allPasses.sort(function(a, b) {
      return new Date(a.pass.start) - new Date(b.pass.start);
    });

    if (allPasses.length === 0) {
      container.innerHTML = '<div class="no-passes">No passes match current filters</div>';
      return;
    }

    var list = document.createElement('div');
    list.className = 'chrono-list';
    var currentDay = '';

    for (var k = 0; k < allPasses.length; k++) {
      var item = allPasses[k];
      var pass = item.pass;
      var dayKey = getDayKey(pass.start);
      var quality = getQuality(pass.max_elevation);
      var passDate = new Date(pass.start);
      var dn = getDayNight(passDate, lat, lon);
      var satClass = item.noradId === '57166' ? 'meteor-n2-3' : 'meteor-n2-4';

      if (dayKey !== currentDay) {
        currentDay = dayKey;
        var divider = document.createElement('div');
        divider.className = 'day-divider';
        divider.textContent = formatDate(pass.start);
        list.appendChild(divider);
      }

      var row = document.createElement('div');
      row.className = 'pass-row';
      var qualityLabel = quality === 'excellent' ? 'Excellent' : (quality === 'good' ? 'Good' : 'Fair');

      row.innerHTML =
        '<div class="pass-datetime"><div class="pass-date">' + formatDate(pass.start) + '</div><div class="pass-time">' + formatTime(pass.start) + '<span class="daynight ' + dn.type + '" title="' + dn.type + '">' + dn.icon + '</span></div></div>' +
        '<span class="sat-badge ' + satClass + '">' + item.satName.replace('Meteor-M ', '') + '</span>' +
        '<div class="sky-chart-small">' + createSkyChartSmall(pass, item.satColor) + '</div>' +
        '<div class="pass-details">' +
          '<div class="pass-stat"><div class="pass-stat-label">Max</div><div class="pass-stat-value">' + pass.max_elevation.toFixed(0) + '\u00B0</div></div>' +
          '<div class="pass-stat"><div class="pass-stat-label">Dur</div><div class="pass-stat-value">' + pass.duration + 'm</div></div>' +
          '<div class="pass-stat"><div class="pass-stat-label">End</div><div class="pass-stat-value">' + formatTime(pass.end) + '</div></div>' +
        '</div>' +
        '<span class="quality-badge ' + quality + '">' + qualityLabel + '</span>';

      list.appendChild(row);
    }
    container.appendChild(list);
  }

  /**
   * Display passes grouped by satellite
   * @param {Object} satellitesData - Filtered satellite data
   */
  function displayPasses(satellitesData) {
    var container = document.getElementById('passes-container');
    container.innerHTML = '';
    var colors = { '57166': '#3b82f6', '59051': '#8b5cf6' };
    var lat = allData.location.lat, lon = allData.location.lon;

    var sortedSats = Object.entries(satellitesData).sort(function(a, b) {
      return parseInt(a[0]) - parseInt(b[0]);
    });

    for (var i = 0; i < sortedSats.length; i++) {
      var noradId = sortedSats[i][0], satData = sortedSats[i][1];
      var passes = satData.passes || [];
      var satClass = noradId === '57166' ? 'meteor-n2-3' : 'meteor-n2-4';
      var satColor = colors[noradId] || '#6b7280';
      var isExpanded = expandedSats[noradId] !== false;

      var group = document.createElement('div');
      group.className = 'satellite-group';

      var header = document.createElement('div');
      header.className = 'satellite-header ' + satClass + (isExpanded ? '' : ' collapsed');
      header.setAttribute('data-sat', noradId);
      header.onclick = function(id) {
        return function() { toggleSatellite(id); };
      }(noradId);
      header.innerHTML = '<span class="toggle-icon">\u25BC</span>' + satData.name + '<span class="freq">' + satData.frequency + '</span><span class="pass-count">' + passes.length + ' passes</span>';
      group.appendChild(header);

      var passesDiv = document.createElement('div');
      passesDiv.className = 'passes-container' + (isExpanded ? '' : ' collapsed');
      passesDiv.setAttribute('data-passes', noradId);

      if (passes.length === 0) {
        passesDiv.innerHTML = '<div class="no-passes">No passes match current filters</div>';
      } else {
        var list = document.createElement('div');
        list.className = 'passes-list';
        var currentDay = '';

        for (var j = 0; j < passes.length; j++) {
          var pass = passes[j];
          var dayKey = getDayKey(pass.start);
          var quality = getQuality(pass.max_elevation);
          var passDate = new Date(pass.start);
          var dn = getDayNight(passDate, lat, lon);

          if (dayKey !== currentDay) {
            currentDay = dayKey;
            var divider = document.createElement('div');
            divider.className = 'day-divider';
            divider.textContent = formatDate(pass.start);
            list.appendChild(divider);
          }

          var row = document.createElement('div');
          row.className = 'pass-row';
          var qualityLabel = quality === 'excellent' ? 'Excellent' : (quality === 'good' ? 'Good' : 'Fair');

          row.innerHTML =
            '<div class="pass-datetime"><div class="pass-date">' + formatDate(pass.start) + '</div><div class="pass-time">' + formatTime(pass.start) + '<span class="daynight ' + dn.type + '" title="' + dn.type + '">' + dn.icon + '</span></div></div>' +
            '<div class="sky-chart-small">' + createSkyChartSmall(pass, satColor) + '</div>' +
            '<div class="pass-details">' +
              '<div class="pass-stat"><div class="pass-stat-label">Max</div><div class="pass-stat-value">' + pass.max_elevation.toFixed(0) + '\u00B0</div></div>' +
              '<div class="pass-stat"><div class="pass-stat-label">Dur</div><div class="pass-stat-value">' + pass.duration + 'm</div></div>' +
              '<div class="pass-stat"><div class="pass-stat-label">End</div><div class="pass-stat-value">' + formatTime(pass.end) + '</div></div>' +
            '</div>' +
            '<span class="quality-badge ' + quality + '">' + qualityLabel + '</span>';

          list.appendChild(row);
        }
        passesDiv.appendChild(list);
      }
      group.appendChild(passesDiv);
      container.appendChild(group);
    }
  }

  /**
   * Show a status message
   * @param {string} msg - Message to display
   * @param {boolean} isError - Whether this is an error message
   */
  function showStatus(msg, isError) {
    var s = document.getElementById('status');
    s.textContent = msg;
    s.className = isError ? 'status error' : 'status';
  }

  // Expose functions to global scope for HTML event handlers
  window.loadSatellitePasses = loadSatellitePasses;
  window.useMyLocation = useMyLocation;
  window.updateFilters = updateFilters;
  window.setView = setView;

  // Initialize on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadSatellitePasses);
  } else {
    loadSatellitePasses();
  }
})();
