---
layout: single
title: "Near-Real Time Thermospheric Density Retrieval from Precise Low Earth Orbit Spacecraft Ephemerides During Geomagnetic Storms"
excerpt: <br/><img src='https://github.com/CharlesPlusC/CharlesPlusC.github.io/blob/master/images/select_storms_figure.png?raw=true' width='450'>
collection: research-areas
author_profile: true
share: true
---

I recently submitted a paper to the journal Spaceweather titled Near-Real-Time Thermospheric Density Retrieval from Precise Low-Earth-Orbit Spacecraft Ephemerides During Geomagnetic Storms. In this work, I developed a method for generating near-real-time thermospheric density estimates using precise ephemerides of low-Earth-orbiting (LEO) spacecraft, with a particular focus on geomagnetic storms.

This method was designed in response to two calls raised during the latest International Space Weather Action Team (ISWAT) meeting. First, there is a pressing need for higher-quality density data, which has become a limiting factor in the development of improved atmospheric density models. Secondly, there is a need for new approaches to achieve high-resolution monitoring of geomagnetic storms, as existing databases tend to be quite limited in spatiotemporal detail.

The method I’ve developed offers density estimates with high temporal resolution compared to many Two-Line Element-based approaches, which generally provide density estimates per-orbital-revolution. In contrast, this method can offer one estimate every 5 to 15 minutes, depending on the signal-to-noise ratio of the spacecraft data. This method is widely applicable to any POD data stream where drag is detectable, as long as the POD data has sub-10 cm precision—something that is routinely achievable according to several meta-analyses.

In this study, I analyzed data from approximately 80 storms, comparing the densities retrieved using my POD method with results from several density models: the Jacchia-Bowman 2008 model, DTM2000, and NRLMSISE-00, as well as with densities derived from the energy dissipation rate method. I also compared post-processed POD data with near-real-time POD data, which tends to be slightly less accurate.

The POD density inversion process essentially involves numerically differentiating the spacecraft ephemeris velocities to generate a time series of accelerations. By calculating and subtracting the modeled accelerations (excluding drag), we are left with the acceleration due to drag. While this residual signal contains some noise and minor inaccuracies from force model deficiencies, drag contributes to the majority of the signal. By projecting this residual into the direction of the oncoming particle flux, we can rearrange the drag equation to solve for atmospheric density, assuming reasonable estimates for drag coefficient and spacecraft area.

We applied this method to several spacecraft, including GRACE Follow-On, TerraSAR, and CHAMP. The POD-derived densities outperformed other methods when compared to accelerometer-derived densities, which served as our “gold standard” for truth data. For instance, when testing on GRACE Follow-On A during a relatively low-intensity storm, the POD method exhibited a mean absolute percentage error (MAPE) of about 15%. The worst-performing method was the EDR approach, with a 45% error, while JB08 yielded 36%, MSISE00 around 17%, and DTM2000 slightly better.

![DensityMAPE](https://github.com/CharlesPlusC/CharlesPlusC.github.io/blob/master/images/ACT_EDR_POD_NRT_MAPE.png?raw=true)


The difference between the near-real-time POD densities and the post-processed POD densities was only about 1 percentage point. This suggests that even near-real-time POD data, despite its slightly lower precision, still provides highly accurate density estimates in storm-time conditions. When comparing model estimates with our method’s results over the course of a storm, JB08 showed the best agreement at lower altitudes (such as those observed by GRACE Follow-On A), while DTM performed better at higher altitudes, and MSISE00 lagged behind, particularly due to its less frequent updates. JB08, with its hourly Dst index updates, had an R-squared value of 0.82 in our best comparison case.

![DensityScatter](https://github.com/CharlesPlusC/CharlesPlusC.github.io/blob/master/images/density_scatter.png?raw=true)

Additionally, we visualized the density as a function of argument of latitude and time during the storm, revealing that our method can resolve thermospheric features with a much higher resolution than previous methods. We observed phenomena such as the diurnal bulge, sharp density increases, and the storm’s weakening at various points in time and altitude. These features are not typically visible in traditional methods, which tend to provide only one density value per orbital revolution.

![SelectStormsArglat](https://github.com/CharlesPlusC/CharlesPlusC.github.io/blob/master/images/select_storms_figure.png?raw=true)

Finally, we demonstrated the scalability of this method by running over 1.5 million density estimates in under 24 hours using 100 cores. For spacecraft operators, this means that with a suitable setup—such as a high-performance laptop linked to incoming POD data streams—real-time density estimates could be generated in just a few minutes, allowing operators to continuously monitor the thermospheric environment their spacecraft are flying through.