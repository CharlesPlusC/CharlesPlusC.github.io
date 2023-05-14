---
layout: single
title: "Twitter Satellite Constellation Visualization Bot"
collection: posts 
author_profile: true
share: true
permalink: /posts/2023-05-14-ConstellationBot
---

## Intro

Inspired by the work of Jonathan McDowell [Jonathan's Space Report](www.planet4589.org)and T.S. Kelso [CelesTrak](https://celestrak.org/), who tirelessly provide heaps of satellite data to the world, I decided to create a little project of my own. Over the easter holidays I set out to create a Twitter bot that would post daily updates on the current state of satellite mega-constellations. While my Twitter bot may not be on the same level as what Kelso and McDowell are doing, it's my humble attempt to contribute to the field and make satellite data more engaging for a wider audience.

As I now have a working version "1.0" of this Twitter bot I thought I would share the rough outline of how I did it for anyone that might be interested in replicating it or even contributing to the code I have. 

The bot posts daily tweet-updates on the current state of the largest satellite mega-constellations (I have selected the 7 largest for now). The bot is written in Python and uses the Tweepy library to interact with the Twitter API. The bot is run through automatically Github Actions and runs on a cron job that executes the Python script once a day. The bot is currently in version 1.0 and I plan to add more features and visualizations in the future.

I thought this rapid overview of the current state of the most important players in the field would be useful for keeping up with the latest developments. Personally, I find it very handy, so I thought I'd share it with the world. Plus, visualizing constellation geometry is informative in this format. It conveys valuable information about constellation operations such as orbit raising, deorbiting, anomalies, and changes in geographical coverage. Recently, I have been working on integrating a statistics module, that will also provide some fresh statistics alongside each visualization.

### Method Overview

I will outline a broad overview and some key functions that used below. I will not go into too much detail about the code itself, as I will provide a link to the Github repo in the next post:

1. Select a list of constellations to track. In my case these are: Irirdium, Starlink, OneWeb, Planet, Spire, and Swarm. These were the largest 7 operational constellations at the time of writing.

2. Fetch the latest TLEs from Space-Track.org. I use the Python package `spacetrack` to do this. You will have to make a Space-Track account to use the API to fetch the latest TLEs for the selected constellations. Then you will manually have to do some digging around to find the constellation IDs for each constellation. For the ones I selected this ended up being:
```python
constellation_cat_names = {"starlink": "STARLINK", "oneweb": "ONEWEB", "planet": "FLOCK", "swarm": "SpaceBEE", "spire": "LEMUR", "iridium": "IRIDIUM"} 
```
3. Use the Python package `sgp4` to propagate the TLEs if required. Two of my visualizations (the constellation geometry and ground tracks), require the state to be propagated forward. I do this for one orbital revolution (or 2pi radians of argument of latitude). The SGP4 propagator will return Earth-Centred Inertial Coordinates in the TEME (True Equator, Mean Equinox) reference frame. 

```python
import logging
from typing import List, Union
from sgp4.api import Satrec

def sgp4_prop_TLE(TLE: str, jd_start: float, jd_end: float, dt: float) -> List[List[Union[float, tuple]]]:
    """
    Given a TLE, a start time, end time, and time step, propagate the TLE and return the time-series of Cartesian coordinates, 
    and accompanying time-stamps (Modified Julian Day). This is a wrapper for the SGP4 routine in the sgp4.api package (Brandon Rhodes).

    Args:
        TLE (str): TLE to be propagated.
        jd_start (float): Start time of propagation in Julian Date format.
        jd_end (float): End time of propagation in Julian Date format.
        dt (float): Time step of propagation in seconds.

    Returns:
        list: A list of lists containing the time-series of Cartesian coordinates, and accompanying time-stamps (MJD).
    
    Raises:
        ValueError: If jd_start is greater than jd_end.
    """
    if jd_start > jd_end:
        raise ValueError('jd_start must be less than jd_end')

    ephemeris = []
    dt_jd = dt/86400
    split_tle = TLE.split('\n')
    s = split_tle[0]
    r = split_tle[1]
    fr = 0.0
    satellite = Satrec.twoline2rv(s, r)

    time = jd_start
    while time < jd_end:
        error, position, velocity = satellite.sgp4(time, fr)
        if error != 0:
            logging.error('Satellite position could not be computed for the given date')
            break
        else:
            ephemeris.append([time,position, velocity])
        time += dt_jd

    return ephemeris
``` 

4. You will need to store the (/time series of) positions for each satellite after each TLE is propagated. Then you can use this data to plot the satellite positions in 3D. I use `matplotlib` to plot the satellite positions in 3D and I use the cartopy module for the map under the ground tracks.

5. To animate these plots I rotate the plots by 5 degrees about the z-axis and then save each frame as a png. I then use the `PIL` module to convert the pngs into a gif. For the large constellations these becomes pretty computationally intensive so I have included some use of the `multiprocessing` module to speed things up. This parallelizes the plotting of each frame- however for Starlink this still takes around 30 minutes... 

```python
import logging
import multiprocessing as mp
import os
from PIL import Image
import time
from typing import Any

def generate_geom_gif(const: str) -> None:
    """
    Generate a gif of the geometry of a constellation.

    Args:
        const (str): The name of the constellation.

    Raises:
        FileNotFoundError: If an image file does not exist.
        PermissionError: If the program does not have permission to delete an image file.
    """
    const_ephemerides, constellation_img_paths = process_geom_data(const)

    max_workers = 4

    gif_folder = os.path.join('images/constellation_anim/gifs/', const)
    images_folder = os.path.join('images/constellation_anim/current_geometry/', const)
    os.makedirs(gif_folder, exist_ok=True)

    with mp.Pool(processes=max_workers) as pool:
        pool.map(create_frame, [(az, const, const_ephemerides, constellation_img_paths) for az in range(0, 365, 5)])

    logging.info(f"Combining frames into gif for {const}...")

    images = sorted([img for img in os.listdir(images_folder) if img.endswith(".png")], key=lambda x: int(x.split('_')[-1].split('.')[0]))
    with Image.open(os.path.join(images_folder, images[0])) as first_image:
        image_list = [Image.open(os.path.join(images_folder, img)) for img in images[1:]]
        first_image.save(os.path.join(gif_folder, f'geom_{const}_{time.strftime("%y_%m_%d")}.gif'), save_all=True, append_images=image_list, duration=110, loop=0)

    logging.info(f"Finished creating .gif file for {const}")

    logging.info(f"Deleting frames for {const}...")
    for img in images:
        try:
            os.remove(os.path.join(images_folder, img))
        except FileNotFoundError:
            logging.error(f"File {img} not found.")
        except PermissionError:
            logging.error(f"Permission denied to delete file {img}.")
```

6. At this stage I also compute statistics for the constellation. For the time being this is somewhat rudimentary but it works: I have created a JSON file that contains the number of satellites in each constellation, the number of satellites in each altitude band (from 0-2000 in 100km bands), and the number of satellites in each inclination band (from 0-180 in 10 degree bands), and a timestamp to go with this data. 

7. Then I use the `json` module to compare the last two entries for a given constellation. I calculate the differences between all the bands and select the largest difference. I then manually generate a tweet that says something like "Starlink has added 10 satellites in the 1000-1100km altitude band since yesterday".

8. I pass the statistics along with the name of the constellation to the `openai` module's `Completion` class to generate the text. If there is no change in the statistics then I have a different prompt to generate a generic tweet about this constellation.

```python
import logging
import openai
from typing import List, str

def generate_tweet(constellation_name: str, viz_type: str, openai_api_key: str) -> str:
    """
    Generates a tweet for the given constellation using OpenAI's GPT-3 API.

    Args:
        constellation_name (str): The name of the constellation.
        viz_type (str): The type of visualization.
        openai_api_key (str): The API key for OpenAI.

    Returns:
        str: The generated tweet.

    Raises:
        ValueError: If viz_type is not valid.
    """
    possible_viz_types = ["latest_state", "current_geometry", "ground_tracks"]
    if viz_type not in possible_viz_types:
        raise ValueError(f"Invalid viz_type {viz_type}. Must be one of {possible_viz_types}")
    
    prompt = create_gpt3_prompt(constellation_name, viz_type)

    openai.api_key = openai_api_key
    response = openai.Completion.create(
      engine="text-davinci-002",
      prompt=prompt,
      temperature=0.72,
      max_tokens=200,
      top_p=1,
      frequency_penalty=0,
      presence_penalty=0
    )

    tweet_text = response.choices[0].text.strip()
    tweet_text = "Constellation-bot: " + tweet_text
    logging.info(f"gpt tweet: {tweet_text}")

    # If the generated tweet is too short or contains invalid characters, generate a default tweet
    if len(tweet_text) < 10 or not tweet_text.isascii():
        tweet_text = f"Check out the latest state of the {constellation_name} constellation! #spacex #megaconstellations #satellites"
    if len(tweet_text) > 280:
        tweet_text = f"Check out the latest state of the {constellation_name} constellation! #spacex #megaconstellations #satellites"
    return tweet_text
```

9. Finally, I use the `tweepy` module to post the text and the tweet. You will have to set up a Twitter developer account to generate the necessary API keys and tokens to post the tweets. In order to run this script automatically and not have my tokens exposed on Github I have also set up a Github Secret to store these keys and tokens in my repo environment variables. `tweepy` does not yet have a build in method to post GIFs so I had to repurpose the code used for posting PNG images. I will make this class available in my repo in the near future.

10. Finally I set up a Github Actions workflow `cron` job to run the script once a day. I have a cron job that runs the script at 09:00 UTC every day. If the script fails/succeeds I get a notification through the Github app on my phone.

```
name: Cron twice-daily tweet

on:
  schedule:
    - cron: '0 17 * * *'
  workflow_dispatch:

jobs:
  cron:
    runs-on: ubuntu-latest
    timeout-minutes: 60
    steps:
      - uses: actions/checkout@v3
      - name: Set up Python
        uses: actions/setup-python@v3
        with:
          python-version: '3.8'

      - name: Upgrade pip
        run: pip install --upgrade pip

      - name: Install system dependencies
        run: |
          sudo apt-get update
          sudo apt-get install -y libproj-dev proj-data proj-bin
          sudo apt-get install -y libgeos-dev

      - name: Install dependencies
        run: pip install -r requirements.txt

      - name: Run cron_tweet.py
        run: python source/twitterbot/cron_tweet.py
        env:
          PYTHONPATH: ${{ github.workspace }}
          TWIT_CONSUMER_KEY: ${{ secrets.TWIT_CONSUMER_KEY }}
          TWIT_CONSUMER_SECRET: ${{ secrets.TWIT_CONSUMER_SECRET }}
          TWIT_ACCESS_TOKEN: ${{ secrets.TWIT_ACCESS_TOKEN }}
          TWIT_ACCESS_TOKEN_SECRET: ${{ secrets.TWIT_ACCESS_TOKEN_SECRET }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          SLTRACK_PWD: ${{ secrets.SLTRACK_PWD }}
          SLTRACK_USR: ${{ secrets.SLTRACK_USR }} 
```

If you are curious to see it in action you can check out the Twitter bot here: [ConstellationBot](https://twitter.com/CharlesPlusC)