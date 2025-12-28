# TLE Data Cache

This directory contains cached Two-Line Element (TLE) data for NOAA weather satellites.

## File: `tles.json`

Contains current orbital elements for:
- NOAA 15 (137.620 MHz)
- NOAA 18 (137.9125 MHz)
- NOAA 19 (137.100 MHz)

## Update Schedule

- **Automatically updated every 6 hours** via GitHub Actions
- Workflow: `.github/workflows/update-tles.yml`
- Source: [Celestrak](https://celestrak.org)

## Purpose

This caching system prevents overloading Celestrak's API by:
- Limiting requests to 4 times per day (instead of per user request)
- Providing faster API responses (no external HTTP calls)
- Tracking TLE updates in version control

## Manual Update

To manually update the TLE data:

```bash
python3 << 'EOF'
import requests
import json
from datetime import datetime, timezone

satellites = [
    {'name': 'NOAA 15', 'frequency': '137.620 MHz', 'noradId': 25338},
    {'name': 'NOAA 18', 'frequency': '137.9125 MHz', 'noradId': 28654},
    {'name': 'NOAA 19', 'frequency': '137.100 MHz', 'noradId': 33591}
]

tle_data = {}

for sat in satellites:
    url = f"https://celestrak.org/NORAD/elements/gp.php?CATNR={sat['noradId']}&FORMAT=TLE"
    response = requests.get(url, timeout=10)
    lines = response.text.strip().split('\n')

    if len(lines) >= 3:
        tle_data[str(sat['noradId'])] = {
            'name': sat['name'],
            'frequency': sat['frequency'],
            'tle_line1': lines[1].strip(),
            'tle_line2': lines[2].strip(),
            'fetched_at': datetime.now(timezone.utc).isoformat()
        }

output = {
    'satellites': tle_data,
    'updated_at': datetime.now(timezone.utc).isoformat(),
    'source': 'Celestrak'
}

with open('data/tles.json', 'w') as f:
    json.dump(output, f, indent=2)

print(f"Updated TLE data for {len(tle_data)} satellites")
EOF
```

Then commit and push the changes.

## Format

```json
{
  "satellites": {
    "25338": {
      "name": "NOAA 15",
      "frequency": "137.620 MHz",
      "tle_line1": "1 25338U 98030A   ...",
      "tle_line2": "2 25338  98.5210 ...",
      "fetched_at": "2025-12-28T11:55:42+00:00"
    },
    ...
  },
  "updated_at": "2025-12-28T11:55:42+00:00",
  "source": "Celestrak"
}
```

## Important Notes

- TLEs are updated regularly by space tracking organizations
- 6-hour refresh is sufficient (orbits change slowly)
- The API (`api/satellite_passes.py`) reads from this file
- Do not manually edit TLE values unless you know what you're doing
