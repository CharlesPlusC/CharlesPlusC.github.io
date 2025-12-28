from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import json
import os
from datetime import datetime, timedelta, timezone
from skyfield.api import load, wgs84, EarthSatellite
from skyfield import almanac
import numpy as np

def load_cached_tles():
    """Load TLE data from cached file"""
    # Try to find the data file in different possible locations
    possible_paths = [
        'data/tles.json',
        '../data/tles.json',
        os.path.join(os.path.dirname(__file__), '../data/tles.json'),
    ]

    for path in possible_paths:
        try:
            if os.path.exists(path):
                with open(path, 'r') as f:
                    data = json.load(f)
                    return data.get('satellites', {})
        except Exception as e:
            print(f"Error loading TLE cache from {path}: {e}")
            continue

    raise FileNotFoundError("TLE cache file not found. Please run the GitHub Action to generate it.")

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Parse query parameters
        parsed_path = urlparse(self.path)
        params = parse_qs(parsed_path.query)

        # Enable CORS
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

        try:
            # Get parameters
            lat = float(params.get('lat', ['51.5074'])[0])
            lon = float(params.get('lon', ['-0.1278'])[0])
            alt = float(params.get('alt', ['0'])[0])
            days = int(params.get('days', ['7'])[0])

            # Load cached TLE data
            tle_cache = load_cached_tles()

            # Load timescale
            ts = load.timescale()

            # Create observer location
            observer = wgs84.latlon(lat, lon, elevation_m=alt)

            # Calculate passes for all satellites
            result = {}

            for norad_id, sat_data in tle_cache.items():
                try:
                    # Create EarthSatellite from cached TLE
                    satellite = EarthSatellite(
                        sat_data['tle_line1'],
                        sat_data['tle_line2'],
                        sat_data['name'],
                        ts
                    )

                    # Time range for pass predictions
                    t0 = ts.now()
                    t1 = ts.utc(t0.utc_datetime() + timedelta(days=days))

                    # Find events (rise, culminate, set)
                    t, events = satellite.find_events(observer, t0, t1, altitude_degrees=10.0)

                    passes = []
                    current_pass = {}

                    for ti, event in zip(t, events):
                        if event == 0:  # Rise
                            current_pass = {
                                'start': ti.utc_iso(),
                                'start_timestamp': ti.utc_datetime().timestamp()
                            }
                        elif event == 1:  # Culminate (max elevation)
                            if current_pass:
                                # Calculate elevation at culmination
                                difference = satellite - observer
                                topocentric = difference.at(ti)
                                alt_deg, az_deg, distance = topocentric.altaz()

                                current_pass['max_elevation'] = round(alt_deg.degrees, 1)
                                current_pass['max_elevation_time'] = ti.utc_iso()
                        elif event == 2:  # Set
                            if current_pass:
                                current_pass['end'] = ti.utc_iso()
                                current_pass['end_timestamp'] = ti.utc_datetime().timestamp()

                                # Calculate duration
                                duration = (current_pass['end_timestamp'] - current_pass['start_timestamp']) / 60
                                current_pass['duration'] = round(duration)

                                # Only add if we have max elevation
                                if 'max_elevation' in current_pass:
                                    passes.append(current_pass)

                                current_pass = {}

                    result[norad_id] = {
                        'name': sat_data['name'],
                        'frequency': sat_data['frequency'],
                        'passes': passes,
                        'tle_age': sat_data.get('fetched_at', 'unknown')
                    }

                except Exception as e:
                    print(f"Error processing {sat_data['name']}: {e}")
                    result[norad_id] = {
                        'name': sat_data['name'],
                        'frequency': sat_data['frequency'],
                        'passes': [],
                        'error': str(e)
                    }

            response = {
                'success': True,
                'location': {'lat': lat, 'lon': lon, 'alt': alt},
                'satellites': result,
                'generated_at': datetime.now(timezone.utc).isoformat(),
                'note': 'TLE data cached and updated periodically via GitHub Actions'
            }

            self.wfile.write(json.dumps(response).encode())

        except Exception as e:
            error_response = {
                'success': False,
                'error': str(e)
            }
            self.wfile.write(json.dumps(error_response).encode())

    def do_OPTIONS(self):
        # Handle CORS preflight
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
