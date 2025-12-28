# Satellite Pass Tracker - Deployment Guide

## Overview

The satellite pass tracker uses **Skyfield** (Python) for accurate predictions instead of client-side JavaScript. This requires deploying the backend API to a serverless platform.

## TLE Data Caching

To avoid overloading Celestrak's API, TLE data is **cached and updated automatically**:

- **GitHub Actions** workflow runs every 6 hours (`.github/workflows/update-tles.yml`)
- Fetches fresh TLE data from Celestrak (only 4 times per day)
- Commits updated data to `data/tles.json` in the repository
- API reads from this cached file instead of hitting Celestrak on every request

**Benefits:**
- Minimal load on Celestrak (4 requests/day vs. thousands)
- Faster API responses (no external HTTP calls during requests)
- TLE updates are tracked in version control
- Automatic updates with no manual intervention

**Note:** TLEs update slowly (orbit changes are gradual), so 6-hour refresh is more than sufficient for accurate predictions.

### Enable GitHub Actions (Required)

If this is the first time using GitHub Actions in your repository:

1. Go to your repository on GitHub
2. Click "Actions" tab
3. If prompted, click "I understand my workflows, go ahead and enable them"
4. The TLE update workflow will run automatically every 6 hours
5. You can also trigger it manually: Actions → "Update Satellite TLEs" → "Run workflow"

## Deployment to Vercel (Recommended)

### Step 1: Install Vercel CLI (Optional)

```bash
npm install -g vercel
```

### Step 2: Deploy to Vercel

You have two options:

#### Option A: Deploy via Vercel Dashboard (Easiest)

1. Go to [vercel.com](https://vercel.com) and sign in with your GitHub account
2. Click "Add New..." → "Project"
3. Import your `CharlesPlusC.github.io` repository
4. Vercel will automatically detect the serverless functions in the `api/` directory
5. Click "Deploy"
6. Once deployed, note your Vercel deployment URL (e.g., `your-site.vercel.app`)

#### Option B: Deploy via CLI

```bash
cd ~/CharlesPlusC.github.io
vercel
```

Follow the prompts. Vercel will automatically configure the project.

### Step 3: Update Frontend Configuration

The frontend is already configured to work with Vercel! It will automatically:
- Use `/api/satellite_passes` when deployed on Vercel
- Work with both GitHub Pages and Vercel seamlessly

### Step 4: Keep GitHub Pages for Frontend (Optional)

You can keep your main site on GitHub Pages and only use Vercel for the API:

1. Deploy to Vercel as above
2. Note your Vercel API URL (e.g., `https://your-site.vercel.app`)
3. Update the API base URL in `_pages/satellite-passes.md` if needed

## What Was Changed

### Backend (New)
- **`api/satellite_passes.py`**: Python serverless function using Skyfield
- **`api/requirements.txt`**: Python dependencies (Skyfield, NumPy)
- **`vercel.json`**: Vercel configuration for serverless functions
- **`.vercelignore`**: Files to ignore during Vercel deployment

### Frontend (Updated)
- **`_pages/satellite-passes.md`**: Now calls backend API instead of client-side calculations
- Removed satellite.js dependency
- Simplified code significantly

## Why Skyfield?

Skyfield provides:
- **Professional-grade accuracy**: Used by NASA and professional astronomers
- **Precise timing**: Accounts for light-time, aberration, observer motion
- **Better elevation calculations**: Uses proper astronomical frames (GCRS)
- **More reliable**: Battle-tested library maintained by Brandon Rhodes

The old satellite.js implementation had issues with:
- 60-second time steps causing timing errors
- Simple coordinate transforms
- Approximations in elevation calculations

## Testing the API

Once deployed, test the API:

```bash
curl "https://your-site.vercel.app/api/satellite_passes?lat=51.5074&lon=-0.1278&alt=0&days=7"
```

## Troubleshooting

### API not working?
- Check Vercel deployment logs
- Ensure Python 3.9 is specified in `vercel.json`
- Verify `requirements.txt` is in the `api/` directory

### CORS errors?
- The API includes CORS headers by default
- Check browser console for specific errors

### Slow response?
- First request may be slow (cold start)
- Subsequent requests should be faster
- Consider upgrading Vercel plan for better performance

## Cost

- **Vercel Free Tier**: 100GB bandwidth, 100 hours serverless execution/month
- More than enough for a personal satellite tracker
- Upgrade only if you get significant traffic

## Alternative: Self-Hosted

If you prefer self-hosting, you can run the Flask equivalent:

```python
# Install dependencies
pip install flask skyfield numpy

# Create app.py with similar logic to satellite_passes.py
# Run with: flask run
```

But Vercel is recommended for simplicity and reliability.
