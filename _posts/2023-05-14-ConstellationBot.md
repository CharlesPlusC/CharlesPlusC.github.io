---
layout: single
title: "Twitter Satellite Constellation Visualization Bot"
collection: posts 
author_profile: true
share: true
permalink: /posts/2023-05-14-ConstellationBot
---
---
layout: single
title: "Satellite Constellation Visualization Twitter Bot"
date: 2023-04-14
categories: [space]
---

## Intro

Inspired by the work of Jonathan McDowell [Jonathan's Space Report](www.planet4589.org)and T.S. Kelso [CelesTrak](https://celestrak.org/), who tirelessly provide heaps of satellite data to the world, I decided to create a little project of my own. Over the easter holidays I set out to create a Twitter bot that would post daily updates on the current state of satellite mega-constellations. While my Twitter bot may not be on the same level as what Kelso and McDowell are doing, it's my humble attempt to contribute to the field and make satellite data more engaging for a wider audience.

As I now have a working version "1.0" of this Twitter bot I thought I would share the rough outline of how I did it for anyone that might be interested in replicating it or even contributing to the code I have. 

The bot posts daily tweet-updates on the current state of the largest satellite mega-constellations (I have selected the 7 largest for now). The bot is written in Python and uses the Tweepy library to interact with the Twitter API. The bot is run through automatically Github Actions and runs on a cron job that executes the Python script once a day. The bot is currently in version 1.0 and I plan to add more features and visualizations in the future.

I thought this rapid overview of the current state of the most important players in the field would be useful for keeping up with the latest developments. Personally, I find it very handy, so I thought I'd share it with the world. Plus, visualizing constellation geometry is informative in this format. It conveys valuable information about constellation operations such as orbit raising, deorbiting, anomalies, and changes in geographical coverage. Recently, I have been working on integrating a statistics module, that will also provide some fresh statistics alongside each visualization.

### Method Overview

The broad overview of the method is as follows:

- 1. Select a list of constellations to track. In my case these are: Irirdium, Starlink, OneWeb, Planet, Spire, and Swarm. These were the largest 7 operational constellations at the time of writing.
- 2. Fetch the latest TLEs from Space-Track.org. I use the Python package `spacetrack` to do this. You will have to make a Space-Track account to use the API to fetch the latest TLEs for the selected constellations. Then you will manually have to do some digging around to find the constellation IDs for each constellation. For the ones I selected this ended up being:
```python
constellation_cat_names = {"starlink": "STARLINK", "oneweb": "ONEWEB", "planet": "FLOCK", "swarm": "SpaceBEE", "spire": "LEMUR", "iridium": "IRIDIUM"} 
```
- 3. Use the Python package `sgp4` to propagate the TLEs if required. Two of my visualizations (the constellation geometry and ground tracks), require the state to be propagated forward. I do this for one orbital revolution (or 2pi radians of argument of latitude). The SGP4 propagator will return Earth-Centred Inertial Coordinates in the TEME (True Equator, Mean Equinox) reference frame. 

- 4. You will need to store the (/time series of) positions for each satellite after each TLE is propagated. Then you can use this data to plot the satellite positions in 3D. I use `matplotlib` to plot the satellite positions in 3D and I use the cartopy module for the map under the ground tracks.

- 5. To animate these plots I rotate the plots by 5 degrees about the z-axis and then save each frame as a png. I then use the `PIL` module to convert the pngs into a gif. For the large constellations these becomes pretty computationally intensive so I have included some use of the `multiprocessing` module to speed things up. This parallelizes the plotting of each frame- however for Starlink this still takes around 30 minutes... 

- 6. At this stage I also compute statistics for the constellation. For the time being this is somewhat rudimentary but it works: I have created a JSON file that contains the number of satellites in each constellation, the number of satellites in each altitude band (from 0-2000 in 100km bands), and the number of satellites in each inclination band (from 0-180 in 10 degree bands), and a timestamp to go with this data. 

- 7. Then I use the `json` module to compare the last two entries for a given constellation. I calculate the differences between all the bands and select the largest difference. I then manually generate a tweet that says something like "Starlink has added 10 satellites in the 1000-1100km altitude band since yesterday".

- 8. I pass the statistics along with the name of the constellation to the `openai` module's `Completion` class to generate the text. If there is no change in the statistics then I have a different prompt to generate a generic tweet about this constellation.

- 9. Finally, I use the `tweepy` module to post the text and the tweet. You will have to set up a Twitter developer account to generate the necessary API keys and tokens to post the tweets. In order to run this script automatically and not have my tokens exposed on Github I have also set up a Github secret to store these keys and tokens in my repo environment variables. `tweepy` does not yet have a build in method to post GIFs so I had to repurpose the code used for posting PNG images. I will make this class available in my repo in the near future.

- 10. Finally I set up a Github Actions workflow `cron` job to run the script once a day. I have a cron job that runs the script at 09:00 UTC every day. If the script fails/succeeds I get a notification through the Github app on my phone.