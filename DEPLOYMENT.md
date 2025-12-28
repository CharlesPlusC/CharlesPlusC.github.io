# Satellite Pass Tracker - Deployment Guide

## Overview

The satellite pass tracker is a **completely static** GitHub Pages site. No backend API, no Vercel, no serverless functions required!

## How It Works

**GitHub Actions** automatically:
1. Fetches fresh TLE data from Celestrak
2. Calculates satellite passes using Skyfield (Python)
3. Saves results to `data/passes.json`
4. Commits and pushes updates every 6 hours

**The website** simply displays the pre-calculated data from the JSON file. No dynamic calculations happen in the browser.

## Configuration

### Set Your Location

Edit `.github/workflows/update-tles.yml` and change these values (lines 34-38):

```python
OBSERVER_LAT = 51.5074  # Your latitude in degrees
OBSERVER_LON = -0.1278   # Your longitude in degrees
OBSERVER_ALT = 0         # Your altitude in meters
OBSERVER_NAME = "London, UK"  # Location name
```

### Enable GitHub Actions

1. Go to your repository on GitHub
2. Click the "Actions" tab
3. If prompted, click "I understand my workflows, go ahead and enable them"
4. The workflow will run automatically every 6 hours
5. Manual trigger: Actions → "Update Satellite Passes" → "Run workflow"

## Deployment

**That's it!** No additional deployment needed. GitHub Pages will automatically serve the site.

The workflow runs every 6 hours (00:00, 06:00, 12:00, 18:00 UTC) and keeps your satellite pass predictions fresh.

## Files

- **`.github/workflows/update-tles.yml`**: GitHub Actions workflow that calculates passes
- **`data/passes.json`**: Pre-calculated satellite pass predictions (updated automatically)
- **`_pages/satellite-passes.md`**: The webpage that displays the passes

## Benefits of This Approach

✅ **No backend required** - Everything runs on GitHub Pages
✅ **No API costs** - No Vercel, AWS, or other cloud services
✅ **Minimal Celestrak load** - Only 3 requests every 6 hours
✅ **Fast page loads** - No API calls, just static JSON
✅ **Accurate predictions** - Uses professional Skyfield library
✅ **Fully automated** - Updates happen in the background

## Customization

### Multiple Locations

To calculate passes for multiple locations, modify the workflow to loop through locations and save separate JSON files (e.g., `data/passes-london.json`, `data/passes-newyork.json`). Then create multiple pages or add a location selector to the frontend.

### Different Satellites

To add more satellites, edit the `satellites` array in the workflow (line 41):

```python
satellites = [
    {'name': 'NOAA 15', 'frequency': '137.620 MHz', 'noradId': 25338},
    {'name': 'NOAA 18', 'frequency': '137.9125 MHz', 'noradId': 28654},
    {'name': 'NOAA 19', 'frequency': '137.100 MHz', 'noradId': 33591},
    # Add more here
]
```

Find NORAD catalog numbers at [Celestrak](https://celestrak.org/satcat/search.php).

### Update Frequency

To change how often passes are recalculated, edit the cron schedule (line 5):

```yaml
- cron: '0 */6 * * *'  # Every 6 hours
# Examples:
# - cron: '0 */4 * * *'  # Every 4 hours
# - cron: '0 0,12 * * *' # Twice daily (00:00 and 12:00 UTC)
# - cron: '0 0 * * *'    # Once daily (00:00 UTC)
```

## Troubleshooting

### Passes not updating?

1. Check GitHub Actions tab for workflow runs
2. Click on latest run to see logs
3. Look for errors in the Python execution

### Wrong location?

Edit the coordinates in `.github/workflows/update-tles.yml` (lines 34-38) and manually trigger the workflow or wait for the next scheduled run.

### Page shows "Loading..." forever?

The `data/passes.json` file might be missing. Run the workflow manually to generate it.

## Why This Approach?

Previously, I implemented this with:
- Vercel serverless functions
- API that calculated passes on-demand
- Complex caching system

But that was overkill for a personal satellite tracker. This new approach is:
- **Simpler**: No backend infrastructure
- **Cheaper**: Completely free
- **Faster**: Pre-calculated data
- **More reliable**: No API dependencies
- **Easier to maintain**: Just edit one YAML file

The satellite pass predictions don't change that frequently (orbits are predictable), so pre-calculating them every 6 hours is more than sufficient for accuracy.
