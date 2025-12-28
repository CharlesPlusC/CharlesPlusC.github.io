from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import json
from datetime import datetime, timedelta, timezone
from skyfield.api import load, wgs84, EarthSatellite
from skyfield import almanac
import numpy as np

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

            # NOAA satellites
            satellites = [
                {'name': 'NOAA 15', 'frequency': '137.620 MHz', 'noradId': 25338},
                {'name': 'NOAA 18', 'frequency': '137.9125 MHz', 'noradId': 28654},
                {'name': 'NOAA 19', 'frequency': '137.100 MHz', 'noradId': 33591}
            ]

            # Load timescale
            ts = load.timescale()

            # Create observer location
            observer = wgs84.latlon(lat, lon, elevation_m=alt)

            # Calculate passes for all satellites
            result = {}

            for sat_info in satellites:
                try:
                    # Fetch TLE data from Celestrak
                    url = f'https://celestrak.org/NORAD/elements/gp.php?CATNR={sat_info["noradId"]}&FORMAT=TLE'
                    satellites_data = load.tle_file(url)

                    if not satellites_data:
                        continue

                    satellite = satellites_data[0]

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

                    result[sat_info['noradId']] = {
                        'name': sat_info['name'],
                        'frequency': sat_info['frequency'],
                        'passes': passes
                    }

                except Exception as e:
                    print(f"Error processing {sat_info['name']}: {e}")
                    result[sat_info['noradId']] = {
                        'name': sat_info['name'],
                        'frequency': sat_info['frequency'],
                        'passes': [],
                        'error': str(e)
                    }

            response = {
                'success': True,
                'location': {'lat': lat, 'lon': lon, 'alt': alt},
                'satellites': result,
                'generated_at': datetime.now(timezone.utc).isoformat()
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
