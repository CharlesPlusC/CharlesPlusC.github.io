---
layout: single
title: "Earth Radiation Pressure in LEO"
excerpt: CERES Flux Modeller.<br/><img src='images/combined_flux_animation_nipy.gif' width='350'>"
collection: research-areas
author_profile: true
share: true
---


Earth Radiation Pressure (ERP) is a significant non-conservative force acting on satellites in Low Earth Orbit (LEO). The force is caused by the reflection, absorption and emission of solar radiation by the Earth. Typically the magnitude of the force means that it tends to be outright ignored. Recent research of mine has been focused on assessing how valid this assumption is. In particular I have been looking at using high resoltuion Earth Radiation Budget Experiment (CERES) data to model the Earth's albedo and subsequently the Earth's radiation pressure on satellites, and comparing this to exisitng methods.

As part of this research I developped a plugin for the Orekit library to model the Earth's albedo using CERES data.

To get the highest possible resolution, I made use of the SYN1deg hourly data product from CERES. This provides a 1 degree resolution of the Earth's longwave and shortwave radiation at the top of the Earth's atmosphere. 

A couple of light transport equations later, and I had a model for the Earth's albedo. This model was then used to calculate the Earth's radiation pressure on a OneWeb satellite. My first instinct was to focus on OneWeb as the magnitude of the atmospheric drag acceleration they experience is lower than that of radiation forces and so in their case ERP is more significant than for, say, Starlink.

![OneWebFluxERP](https://github.com/CharlesPlusC/CharlesPlusC.github.io/blob/master/images/combined_flux_animation_nipy.gif?raw=true)

Using Freely available TLEs I computed the flux on the satellite for a number of trajectories.

One concept I wanted to explore was whether, over any relevant period of time, the distributon of the incoming radiation was biased towards some direction. Since the spacecraft is travelling in an out of eclipse I was wondering if there might be some resonant effect that would mean the sum of the forces would be biased in some direction. To explor this I came up with this "geiger counter" style plot of the flux on the satellite over time. Since the longwave is invariant to incoming radiation, this quickly smooths into a ciruclar shape. But for a short while, the shortwave is biased, however I did not find this to be hugely significant (still a cool plot though :D ).

![OneWebFluxgeiger](https://github.com/CharlesPlusC/CharlesPlusC.github.io/blob/master/images/cumulative_flux_anim_v3_ow.gif?raw=true)

Finally, looking at the magnitude of the forces from the CERES model when compared to the Knocke model, I found some interesting differences. The Knocke ERP model tended to overestimate the force, and the CERES model contained quite a bit of variance. Mainly however, it seems that the importance of high-fidelity ERP was higher for Starlink rather than OneWeb. Looking back, this makes sense. Since Starlink orbits at roughly half the altiude of OneWeb, the Earth covers a much greater surface area below it, meaning that variations in the radiation across the surface of the Earth are likely to induce stronger biases, whereas for OneWeb the Earth is much further and so the light is much more unidirectional.

![SL_RTN_ERP](https://github.com/CharlesPlusC/CharlesPlusC.github.io/blob/master/images/SL_RTN_48hr.jpeg?raw=true)