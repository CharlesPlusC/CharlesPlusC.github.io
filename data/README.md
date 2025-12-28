# Satellite Pass Predictions

This directory contains pre-calculated satellite pass predictions.

## File: `passes.json`

Contains upcoming satellite passes for the next 7 days for:
- NOAA 15 (137.620 MHz)
- NOAA 18 (137.9125 MHz)
- NOAA 19 (137.100 MHz)

## Update Schedule

- **Automatically updated every 6 hours** via GitHub Actions
- Workflow: `.github/workflows/update-tles.yml`
- Updates at: 00:00, 06:00, 12:00, 18:00 UTC

## Purpose

This file contains pre-calculated satellite pass predictions using Skyfield (professional astronomy library). By pre-calculating passes via GitHub Actions, we:
- Avoid hitting Celestrak on every page load
- Provide instant page loads (no API calls)
- Use accurate Skyfield calculations
- Keep everything on GitHub Pages (no backend needed)

## Configuration

To change the observer location, edit `.github/workflows/update-tles.yml`:

```python
OBSERVER_LAT = 51.5074  # Your latitude
OBSERVER_LON = -0.1278   # Your longitude
OBSERVER_ALT = 0         # Your altitude in meters
OBSERVER_NAME = "Your Location"
```

Then manually trigger the workflow or wait for the next scheduled run.
