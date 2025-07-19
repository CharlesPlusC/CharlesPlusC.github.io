---
layout: single
title: "May 2024 Geomagnetic Storm Case Study"
excerpt: <br/><img src='https://github.com/CharlesPlusC/CharlesPlusC.github.io/blob/master/images/circulaplots-tsx_gfo.png?raw=true' width='350'>
collection: research-areas
author_profile: true
share: true
---

In this work, we have been investigating the response of the thermosphere during the significant Mother’s Day geomagnetic storm in May 2024. By leveraging precise orbits, I focused on inverting for thermospheric densities in near real-time.

One of the key challenges that remains in POD-density inversion is accessing precise orbits with sufficent latency, and accuracy to provide relevant densities. A standout provider is GFZ Potsdam, which makes near real-time orbits (~35mins after overhead pass) available for several LEO satellites. During the May 2024 storm, I utilized their near real-time orbit data to generate thermospheric density profiles in near real-time. The magnitude of this geomagnetic storm made this analysis especially compelling.

![tsx_gfo_orbitderiveddensities](https://github.com/CharlesPlusC/CharlesPlusC.github.io/blob/master/images/tsx_gfo_storm_plots.png?raw=true)

Expanding on this work, I incorporated additional POD data from the European Space Agency, accessed via their Copernicus data portal. This allowed me to analyze thermospheric densities at altitudes reaching up to 786 kilometers, including those for Sentinel-1 and Sentinel-2. Collaborating with other PhD students in my group and from the Atmospheric Physics Lab, we expanded our investigation beyond thermospheric profiles to include ground-based density measurements, and other kinds of indirect observations of the thermosphere.

![s1as2a_ciruclardensities](https://github.com/CharlesPlusC/CharlesPlusC.github.io/blob/master/images/s1as2a_circulardensity.png?raw=true)

The students of the Applied Physics Laboratory (Eliot Dable and Laura Aguilar), who have expertise with Fabry-Perot interferometers, contributed ground-based density measurements, along with temperature and wind observations. These measurements allowed for some cross-validation of the thermospheric response captured by the orbit-derived densities during the storm.

Moreover, we tried to make this an operationally-relevant paper by turning our attention to the decay of uncooperatively tracked objects cataloged by the Space Force. This system, though relatively coarse, still allowed us to observe the decay in semi-major axis for objects over time. One key question for both the thermosphere and space operations communities is determining the altitude at which the thermosphere stops having a significant impact during storms. By analyzing catalog-wide changes in semi-major axis, we aimed to pinpoint the altitude up to which drag effects were observable, providing valuable insights for operational models.

In a further extension of my previous work on uncooperative tracking, we compared these coarse orbits with the highly precise orbits, known to have centimeter-level accuracy. This comparison revealed a degradation in tracking accuracy during the storm’s onset, with errors reaching multi-kilometer levels. This analysis has important operational implications, as it highlights the limitations of current uncooperative tracking systems during geomagnetic storms.

Overall, this study underscores the need for improved models and tracking methods in response to geomagnetic events, which have significant operational impacts on satellite navigation, space traffic management, and atmospheric density estimation.

We will be presenting this work at the European Space Weather Week in November 2024 and submitting it to the Journal Space Weather.
