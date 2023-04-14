<!-- ---
layout: single
title: "Spacecraft Force Modelling Series: 1) 2-body gravity"
collection: posts 
author_profile: true
share: true
permalink: /posts/2023-04-01-ForceModelling1
---
---
layout: single
title: "Meet My Twitter Bot: Your Daily Dose of Satellite Mega-Constellation Insights"
date: 2023-04-14
categories: [space]
---

## Intro

Ever gazed up at the night sky, captivated by the twinkle of satellites, and wondered, "What's going on up there?". As it turns out, there's a whole celestial party taking place above our heads!

![Satellites in the night sky](/assets/images/satellites-night-sky.jpg)

Inspired by the incredible work of Jonathan McDowell (Jonathan's Space Report) and T.S. Kelso (CelesTrak), who tirelessly provide heaps of satellite data to the world, I decided to create a little project of my own. While my Twitter bot may not be on the same level as what Kelso and McDowell are doing, it's my humble attempt to contribute to the field and make satellite data more engaging for a wider audience.

Introducing the "Mega-Constellation Maestro," a Twitter bot that focuses on the current satellite constellations that hold more than 100 operational satellites as of today. This nifty bot posts twice a day, always up to date with the latest data, because let's face it, the world of mega-constellations is evolving at breakneck speed!

![Mega-Constellation Maestro Logo](/assets/images/mega-constellation-maestro-logo.png)

This rapid overview of the current state of the most important players in the field is immensely useful for keeping up with the latest developments. Personally, I find it very handy, so I thought I'd share it with the world. Plus, constellation geometry is easily visualized in this format, helping to convey valuable information about constellation operations such as orbit raising, deorbiting, anomalies, and changes in geographical coverage.

So strap on your space boots and join me as we explore the mesmerizing world of satellite constellations, guided by the Mega-Constellation Maestro. In the upcoming sections, we'll delve deeper into the three visualizations and learn how they were brought to life. Trust me, this daily dose of satellite insights will take your appreciation of the night sky to stellar new heights!

![Satellite Mega-Constellations](/assets/images/satellite-mega-constellations.jpg)

{% include figure image_path="/assets/images/sample-visualization-1.gif" alt="Sample Visualization 1" caption="Sample Visualization 1 - Replace this path with your own image" %}

{% include figure image_path="/assets/images/sample-visualization-2.gif" alt="Sample Visualization 2" caption="Sample Visualization 2 - Replace this path with your own image" %}

{% include figure image_path="/assets/images/sample-visualization-3.gif" alt="Sample Visualization 3" caption="Sample Visualization 3 - Replace this path with your own image" %}


Data Sources and Processing -->

<!-- #0: Into and data download -->

<!-- #1: GIF Visualizations -->
<!-- Fetch data from spacetrack
if only using for states then convert to cart
plot each frame using matplotlib
combine all frames into gif

if using for orbits, sgp4 prop, store ephemerides
then plot each frame using matplotlib
combine into gifs -->

<!-- #2: Automation
Github actions, OpenAI GPT-3, Cron, Posting Scheduler
 -->
Detail the data sources used, specifically mentioning Space-Track and any other relevant databases.
Describe the process of fetching, cleaning, and processing the data to make it suitable for generating the visualizations.
Visualization #1: Satellite Positions in 3D

Explain how this visualization is created, discussing the use of a sphere to represent Earth and dots to represent individual satellites.
Mention the color-coding system based on altitude, explaining why altitude is significant in satellite behavior and functionality.
Suggest potential applications and insights that can be gained from this visualization.
Visualization #2: Satellite Orbits in 3D

Explain the process of creating this visualization, focusing on the representation of orbits as colored rings.
Discuss the significance of understanding orbital geometry and how this visualization aids in that understanding.
Share possible uses and insights that can be derived from this visualization.
Visualization #3: Ground-Tracks Map

Detail the creation of the ground-tracks map, including the process of mapping satellite latitude and longitude coordinates.
Explain the color-coding by altitude and how this visualization can help users understand the satellite coverage.
Highlight potential applications and insights that this map can provide.
Future Developments and Extensions

Discuss possible improvements or additions to the Twitter bot and the visualizations, including incorporating more data or generating new types of visualizations.
Consider possible collaborations with other researchers or enthusiasts to expand the scope and reach of your work.
Conclusion

Recap the importance and benefits of the Twitter bot and visualizations.
Encourage readers to engage with the visualizations and provide feedback to help improve and refine the project.
Style and Content Tips:

Write in a conversational, accessible tone to make the content appealing to a wide range of readers.
Use clear, concise language and avoid jargon to ensure that the information is easily understood by those without a background in space flight dynamics and geodesy.
Incorporate relevant images, graphics, and examples of the visualizations to make the blog post more visually engaging.
Include real-world examples and applications to demonstrate the practical relevance of your work.
Invite readers to share their thoughts, feedback, and suggestions for improvement, fostering a sense of community and collaboration around your project.