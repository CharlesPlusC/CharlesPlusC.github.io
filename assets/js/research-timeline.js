/**
 * Interactive Research Timeline
 * Displays academic publications and research milestones in a visual timeline format
 */

(function() {
  'use strict';

  // Research data - publications and presentations
  var researchData = [
    {
      year: 2025,
      type: 'journal',
      date: 'March 2025',
      title: 'MOCAT-pySSEM: An open-source Python library and user interface for orbital debris and source-sink environmental modeling',
      venue: 'SoftwareX',
      authors: 'Brownhall, I., Lifson, M., <strong>Constant, C.</strong>, Lavezzi, G., Harris, M. F., Linares, M., Ziebart, M., Bhattarai, S.',
      links: [
        { label: 'DOI', url: 'https://doi.org/10.1016/j.softx.2025.102062' }
      ]
    },
    {
      year: 2025,
      type: 'conference',
      date: 'April 2025',
      title: 'Investigating the Application of the Orbit Domain Calibration Method in Sun Synchronous Orbits',
      venue: '9th European Conference on Space Debris',
      authors: 'Peto-Madew, F., Bhattarai, S., <strong>Constant, C.</strong>, Brownhall, I.',
      links: [
        { label: 'PDF', url: 'https://conference.sdo.esoc.esa.int/proceedings/sdc9/paper/254/SDC9-paper254.pdf' }
      ]
    },
    {
      year: 2024,
      type: 'journal',
      date: 'August 2024',
      title: 'Evaluating Near-Real-Time Thermospheric Density Retrieval Methods from Precise Low Earth Orbit Spacecraft Ephemerides During Geomagnetic Storms',
      venue: 'arXiv preprint (submitted, under review)',
      authors: '<strong>Constant, C.</strong>, Bhattarai, S., Brownhall, I., Aruliah, A., Ziebart, M.',
      links: [
        { label: 'arXiv', url: 'https://arxiv.org/abs/2408.16805' }
      ]
    },
    {
      year: 2024,
      type: 'poster',
      date: 'November 2024',
      title: 'Thermospheric Response and Operational Impacts During the 2024 "Mother\'s Day" Geomagnetic Storm',
      venue: 'European Space Weather Week',
      authors: '<strong>Constant, C.</strong>, Brownhall, I., Aguilar, L., Dable, E., Ziebart, M., Aruliah, A., Bhattarai, S.',
      links: [
        { label: 'Poster', url: 'https://charlesplusc.github.io/assets/MothersDayStormPoster_v2.pdf' }
      ]
    },
    {
      year: 2024,
      type: 'talk',
      date: 'July 2024',
      title: 'An Evaluation of Physics-Based Force Model Performance in Low Earth Orbit: Implications for Next-Generation Space Traffic Management',
      venue: 'Committee on Space Research (COSPAR)',
      authors: '<strong>Constant, C.</strong>, Hanson, B., Bhattarai, S., Brownhall, I., Ziebart, M.',
      links: [
        { label: 'Interactive Presentation', url: 'https://charlesplusc.github.io/assets/cospar24_presentation/reveal.js-master/index.html' }
      ]
    },
    {
      year: 2024,
      type: 'conference',
      date: 'July 2024',
      title: 'Orbit Domain Calibration for Space Surveillance & Tracking (ODC4SST): Design Concept, Network Selection & Initial Validation Tests',
      venue: 'Committee on Space Research (COSPAR)',
      authors: 'Bhattarai, S., Brownhall, I., <strong>Constant, C.</strong>, Peto-Madew, F., Rotheram, E.',
      links: []
    },
    {
      year: 2024,
      type: 'conference',
      date: 'July 2024',
      title: 'MOCAT-PYSSEM: An Open-Source Python Library and User Interface for Orbital Debris and Source-Sink Environmental Modelling',
      venue: 'Committee on Space Research (COSPAR)',
      authors: 'Brownhall, I., Lifson, M., <strong>Constant, C.</strong>, Lavezzi, G., Harris, M. F., Linares, M., Ziebart, M., Bhattarai, S.',
      links: [
        { label: 'ResearchGate', url: 'https://www.researchgate.net/publication/382557433_MOCAT-PYSSEM_An_Open-Source_Python_Library_and_User_Interface_for_Orbital_Debris_and_Source_Sink_Environmental_Modelling' }
      ]
    },
    {
      year: 2023,
      type: 'conference',
      date: 'September 2023',
      title: 'Limitations of Current Practices in Uncooperative Space Surveillance: Analysis of Mega-Constellation Data Time-Series',
      venue: 'AMOS Conference',
      authors: '<strong>Constant, C.</strong>, Bhattarai, S., Brownhall, I., Ziebart, M.',
      links: [
        { label: 'Abstract', url: 'https://ui.adsabs.harvard.edu/abs/2023amos.conf...88C/abstract' },
        { label: 'Poster', url: 'https://github.com/CharlesPlusC/CharlesPlusC.github.io/raw/master/Figures/AMOS-Poster.pdf' },
        { label: 'Video', url: 'https://github.com/CharlesPlusC/CharlesPlusC.github.io/raw/master/assets/AMOS_Presentation_3min.mp4' }
      ]
    },
    {
      year: 2022,
      type: 'poster',
      date: 'November 2022',
      title: 'Astrodynamics and Space Geodesy for Space Domain Awareness and Sustainability',
      venue: 'Global Network on Sustainability in Space (GNOSIS)',
      authors: '<strong>Constant, C.</strong>, Bhattarai, S., Brownhall, I., Ziebart, M.',
      links: [
        { label: 'Poster', url: 'https://github.com/CharlesPlusC/CharlesPlusC.github.io/raw/master/assets/GNOSIS_Poster_28_11_22.pdf' }
      ]
    }
  ];

  var currentFilter = 'all';

  /**
   * Initialize the timeline
   */
  function initTimeline() {
    var container = document.getElementById('research-timeline');
    if (!container) return;

    renderStats(container);
    renderFilters(container);
    renderTimeline(container);
    setupScrollAnimation();
  }

  /**
   * Render statistics bar
   */
  function renderStats(container) {
    var journalCount = researchData.filter(function(d) { return d.type === 'journal'; }).length;
    var conferenceCount = researchData.filter(function(d) { return d.type === 'conference'; }).length;
    var posterCount = researchData.filter(function(d) { return d.type === 'poster'; }).length;
    var talkCount = researchData.filter(function(d) { return d.type === 'talk'; }).length;

    var statsHtml = '<div class="timeline-stats">' +
      '<div class="timeline-stat"><div class="timeline-stat-number">' + researchData.length + '</div><div class="timeline-stat-label">Publications</div></div>' +
      '<div class="timeline-stat"><div class="timeline-stat-number">' + journalCount + '</div><div class="timeline-stat-label">Journal Papers</div></div>' +
      '<div class="timeline-stat"><div class="timeline-stat-number">' + conferenceCount + '</div><div class="timeline-stat-label">Conference Papers</div></div>' +
      '<div class="timeline-stat"><div class="timeline-stat-number">' + (posterCount + talkCount) + '</div><div class="timeline-stat-label">Presentations</div></div>' +
    '</div>';

    var statsDiv = document.createElement('div');
    statsDiv.innerHTML = statsHtml;
    container.appendChild(statsDiv.firstChild);
  }

  /**
   * Render filter buttons
   */
  function renderFilters(container) {
    var filtersHtml = '<div class="timeline-filters">' +
      '<button class="timeline-filter-btn active" data-filter="all">All</button>' +
      '<button class="timeline-filter-btn" data-filter="journal">Journal Papers</button>' +
      '<button class="timeline-filter-btn" data-filter="conference">Conference Papers</button>' +
      '<button class="timeline-filter-btn" data-filter="poster">Posters</button>' +
      '<button class="timeline-filter-btn" data-filter="talk">Talks</button>' +
    '</div>';

    var filtersDiv = document.createElement('div');
    filtersDiv.innerHTML = filtersHtml;
    container.appendChild(filtersDiv.firstChild);

    // Add click handlers
    var buttons = container.querySelectorAll('.timeline-filter-btn');
    buttons.forEach(function(btn) {
      btn.addEventListener('click', function() {
        buttons.forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        updateTimelineVisibility();
      });
    });
  }

  /**
   * Render the timeline items
   */
  function renderTimeline(container) {
    var timelineDiv = document.createElement('div');
    timelineDiv.className = 'research-timeline';
    timelineDiv.id = 'timeline-content';

    // Group by year
    var years = {};
    researchData.forEach(function(item) {
      if (!years[item.year]) years[item.year] = [];
      years[item.year].push(item);
    });

    // Sort years descending
    var sortedYears = Object.keys(years).sort(function(a, b) { return b - a; });
    var isLeft = true;

    sortedYears.forEach(function(year) {
      // Year marker
      var yearDiv = document.createElement('div');
      yearDiv.className = 'timeline-year';
      yearDiv.innerHTML = '<span class="timeline-year-badge">' + year + '</span>';
      timelineDiv.appendChild(yearDiv);

      // Items for this year
      years[year].forEach(function(item, index) {
        var itemDiv = document.createElement('div');
        itemDiv.className = 'timeline-item ' + (isLeft ? 'left' : 'right');
        itemDiv.dataset.type = item.type;

        var linksHtml = '';
        if (item.links && item.links.length > 0) {
          linksHtml = '<div class="timeline-links">';
          item.links.forEach(function(link) {
            linksHtml += '<a href="' + link.url + '" class="timeline-link" target="_blank" rel="noopener">' +
              '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>' +
              link.label +
            '</a>';
          });
          linksHtml += '</div>';
        }

        var typeLabel = item.type.charAt(0).toUpperCase() + item.type.slice(1);
        if (item.type === 'journal') typeLabel = 'Journal Paper';
        if (item.type === 'conference') typeLabel = 'Conference Paper';

        itemDiv.innerHTML =
          '<span class="timeline-type ' + item.type + '">' + typeLabel + '</span>' +
          '<div class="timeline-date">' + item.date + '</div>' +
          '<div class="timeline-title">' + item.title + '</div>' +
          '<div class="timeline-venue">' + item.venue + '</div>' +
          '<div class="timeline-authors">' + item.authors + '</div>' +
          linksHtml;

        timelineDiv.appendChild(itemDiv);
        isLeft = !isLeft;
      });
    });

    container.appendChild(timelineDiv);
  }

  /**
   * Update timeline item visibility based on filter
   */
  function updateTimelineVisibility() {
    var items = document.querySelectorAll('.timeline-item');
    items.forEach(function(item) {
      if (currentFilter === 'all' || item.dataset.type === currentFilter) {
        item.style.display = '';
      } else {
        item.style.display = 'none';
      }
    });
  }

  /**
   * Setup scroll-triggered animations
   */
  function setupScrollAnimation() {
    var items = document.querySelectorAll('.timeline-item');

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    items.forEach(function(item) {
      observer.observe(item);
    });
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTimeline);
  } else {
    initTimeline();
  }
})();
