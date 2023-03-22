---
layout: single
title: "Positioning for Space Traffic Management: an Overview of Challenges and Solutions"
collection: posts 
author_profile: true
share: true
permalink: /posts/2023-03-22-STMandPositioning
---

# Positioning for Space Traffic Management: an Overview of Challenges and Solutions

## Navigating the Challenges of Space Traffic Management

The growing importance of space traffic management is underscored by the limitations of the Two-Line Element (TLE) format and the need for increased transparency in the measurement and generation process of TLEs. Accurate positioning of uncooperative assets is vital for the safety and sustainability of the space environment. As highlighted by Oltrogge et al. (2018), Space Situational Awareness (SSA) data must not only meet but significantly surpass operators' probability of collision thresholds. Positional error thresholds for Low Earth Orbit (LEO) objects, assuming a probability of collision threshold of 0.01%, typically range from 100-200 meters (Alfano, 2021; Oltrogge, 2018).


## Assessing Validation Using Geodetic Spheres
Some SSA systems claim to produce ephemerides with covariances of a few hundred meters for both cooperative (Abraham, 2018) and uncooperative (Nicolls, 2017; Conkey, 2022) tracked assets. However, caution must be exercised when interpreting these claims. For instance, Nicolls (2017) found an orbit determination error of a few hundred meters when validating against International Laser Ranging Service truth ephemeris for the Stella Geodetic Reference Sphere. The use of geodetic reference spheres for validating orbit determination (OD) solutions is not without its drawbacks. These spheres, by their very nature, perform unusually well in simplistic force models like SGP4, which assume the spacecraft to be a sphere when calculating many non-conservative forces (e.g., solar radiation pressure and aerodynamic drag). Consequently, errors resulting from mismodeling geometry and attitude are "hidden." Furthermore, geodetic spheres have small area-to-mass ratios, which reduce errors associated with calculating non-conservative forces.

It's important to note that mismodeling spacecraft geometry and attitude are some of the largest sources of error in computing non-conservative forces (Vallado, 2014). As a result, the accuracy and precision achieved using geodetic spheres as calibration tools should be considered a lower-bound or best-case scenario in orbit validation. Spacecraft with different geometries, attitudes, and orbital geometries will likely perform worse. Nevertheless, geodetic spheres offer valuable insight into the potential for uncooperative tracking.

<p align="center">
  <img width="550" height="600" src="https://raw.githubusercontent.com/CharlesPlusC/CharlesPlusC.github.io/master/images/Starlette-sphere.png" alt="A Starlette Geodetic Sphere (Image Credit:CNES)">
</p>

## Understanding the Impact of Positional Error
Defining "good" accuracy depends on the requirements we set for ourselves. To better grasp the consequences of positional error, consider this example:

Suppose a spacecraft operator believes their spacecraft is at an altitude of 1200 km (typical of OneWeb constellation satellites). Ignoring all other orbital perturbations except for the monopole gravity term, they calculate the acceleration onto their spacecraft using the formula:

${g_h} = g_0(\frac{R_e}{R_e + h})^2$

Where ${h}$ is the altitude, ${g_h}$ is gravitational acceleration at altitude ${h}$, ${g_0}$ is the standard gravitational acceleration (9.80665 m/s$^2$), and ${R_e}$ is the mean radius of the Earth (6731 km).

Using this formula, the gravitational acceleration at 1200 km is calculated as:

${g_{1200{Km}}} = 9.80665(\frac{6371}{6371 + 1200})^2 = 6.9443147 m/s^2$

Now, imagine the spacecraft is actually one meter higher than the operator thought. This would give the spacecraft a gravitational acceleration of:

${g_{1200+1m}} = 9.80665(\frac{6371}{6371 + 1200.001})^2 = 6.9443129 m/s^2$

The difference in acceleration between both states is:

$\Delta a = 6.9443129 - 6.9443147 = 1.8\times10^{-6}$

Calculating the overall distance between both states over a 24-hour period (86400 seconds), we find:

$\frac{1}{2}at^2 = \frac{1}{2}\times 1.8\times10^{-6}\times86400^2 = 6718.464m$

This difference greatly exceeds the 100-200 meter positional error threshold we are shooting for in LEO.
This example demonstrates how small errors in initial conditions can lead to disproportionate errors in position over time. Furthermore, this effect is accentuated in LEO due to the increasingly strong impact of monopole gravity wtih decreasing altitude. Gravity is roughly 1000 times greater than any other acceleration in LEO (Montenbruck, 2000), making not only the calculation of gravitational force of paramount importance, but also highlighting the importance that the inputs to the equations of motion be precise and accurate.

## Tackling Positional Degradation in Space Situational Awareness Data
The decline of positional accuracy of orbits over time poses a significant challenge for SSA systems. In this section, we discuss three primary solutions for mitigating positional degradation in SSA data:

- _Increasing Measurement Frequency_: By increasing the frequency of spacecraft position measurements, the growth of positional error can be constrained. For instance, if the spacecraft's position is re-measured with a 1-meter error every 24 hours, the observer will theoretically never be off by more than approximately 6700 meters. However, if the period is reduced to 12 hours, the error will never exceed roughly 1700 meters.

- _Improving Initial Conditions Accuracy_: Enhancing the accuracy and precision of a spacecraft's initial position measurement can also reduce positional error. For example, in the previous section, if the initial error is reduced from 1 meter to 0.5 meters, the error after 24 hours will be around 3300 meters. Beyond hardware improvements, this can also be achieved through data fusion techniques that combine measurements from different sensors.

- _Improving Orbit_ Propagation: Even with perfect initial conditions and frequent measurements, a propagated orbit will still degrade due to force model and numerical integrator errors. Utilizing a higher-fidelity orbit propagator, which models the spacecraft's interaction with the physical environment more accurately, will result in fewer errors.

Real-time positioning in Low Earth Orbits (LEO) has reached centimeter-level accuracy (Li, 2019). However this level of accuracy necessitates a "cooperative" approach to space traffic management, where two-way communication occurs between the ground station and the satellite in question.

<p align="center">
  <img width="550" height="600" src="https://raw.githubusercontent.com/CharlesPlusC/CharlesPlusC.github.io/master/images/radar-leolabs.png" alt="LEOLabs' Australian Radars for Uncooperative Space Surveillance">
</p>

In contrast, the United States Space Surveillance Network (USSSN) aims to disseminate information about a wide range of Resident Space Objects (RSOs) to various operators (Wilson, 2019). Most RSOs, however, either lack Global Navigation Satellite Systems (GNSS) receivers or are unable or unwilling to share information with the USSSN. This "uncooperative" approach presents significant challenges, as there is no telemetry to aid the tracking process for most RSOs. Consequently, the USSSN must make cost-benefit trade-offs concerning measurement frequency, initial conditions accuracy, and force model complexity. For instance, high-fidelity atmospheric density models like the TIE-GCM (Qian, 2013) are readily available but are not widely used in orbit propagators due to their high computational cost (Licata, 2021).

In summary, mitigating positional degradation in SSA catalogs requires a combination of increasing measurement frequency, improving initial conditions accuracy, and using high-fidelity orbit propagators. However, the uncooperative nature of tracking RSOs poses significant challenges for SSA systems and necessitates cost-benefit trade-offs in terms of resource allocation and computational complexity.

As the number of satellites and space debris in orbit continues to grow, ensuring the safety and sustainability of the space environment becomes increasingly crucial. The limitations of the TLE format and the lack of transparency in the measurement and generation process of TLEs are critical factors to consider in space traffic management. The quest for precise positioning of uncooperative assets is a key component in addressing these challenges.

Moving forward, it is essential to invest in research and development that seeks to improve SSA systems and develop new tracking technologies. This may include advancements in sensor technology, data fusion techniques, and high-fidelity orbit propagators. Additionally, fostering international collaboration and data sharing among different countries and organizations can help address the challenges associated with uncooperative tracking and enable more accurate and reliable space traffic management.

In conclusion, the future of space traffic management hinges on our ability to enhance the accuracy and reliability of positional information for satellites and other space objects. By tackling the challenges associated with uncooperative tracking and positional degradation, we can help ensure the long-term sustainability of the space environment and enable safe and efficient space operations for all stakeholders involved.






