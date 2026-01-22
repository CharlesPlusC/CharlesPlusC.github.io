#!/usr/bin/env python3
"""
Bootstrap historical TLE density data for new debris objects.
Fetches from Space-Track API with CONSERVATIVE rate limiting to avoid bans.

IMPORTANT: This script uses batched queries and long delays to be API-friendly.
"""

import requests
import json
import numpy as np
from datetime import datetime, timedelta, timezone
import os
import time
import getpass
import sys

# Constants
MU = 398600.4418e9       # Earth's gravitational parameter in m³/s²
R_EARTH = 6378137.0      # Earth radius in m

# New debris satellites to bootstrap (25 objects)
SATELLITES = {
    # COSMOS 1408 debris (2021 Russian ASAT test)
    '50058': {'name': 'COSMOS 1408 DEB (50058)', 'cd': 2.2, 'area': 0.5, 'mass': 20.0},
    '50621': {'name': 'COSMOS 1408 DEB (50621)', 'cd': 2.2, 'area': 0.5, 'mass': 20.0},
    '50404': {'name': 'COSMOS 1408 DEB (50404)', 'cd': 2.2, 'area': 0.5, 'mass': 20.0},
    # COSMOS 2251 debris (2009 Iridium-Cosmos collision)
    '33815': {'name': 'COSMOS 2251 DEB (33815)', 'cd': 2.2, 'area': 0.5, 'mass': 20.0},
    '33821': {'name': 'COSMOS 2251 DEB (33821)', 'cd': 2.2, 'area': 0.5, 'mass': 20.0},
    '33818': {'name': 'COSMOS 2251 DEB (33818)', 'cd': 2.2, 'area': 0.5, 'mass': 20.0},
    '33799': {'name': 'COSMOS 2251 DEB (33799)', 'cd': 2.2, 'area': 0.5, 'mass': 20.0},
    # IRIDIUM 33 debris (2009 Iridium-Cosmos collision)
    '34488': {'name': 'IRIDIUM 33 DEB (34488)', 'cd': 2.2, 'area': 0.5, 'mass': 20.0},
    '34693': {'name': 'IRIDIUM 33 DEB (34693)', 'cd': 2.2, 'area': 0.5, 'mass': 20.0},
    '35622': {'name': 'IRIDIUM 33 DEB (35622)', 'cd': 2.2, 'area': 0.5, 'mass': 20.0},
    '40996': {'name': 'IRIDIUM 33 DEB (40996)', 'cd': 2.2, 'area': 0.5, 'mass': 20.0},
    '34088': {'name': 'IRIDIUM 33 DEB (34088)', 'cd': 2.2, 'area': 0.5, 'mass': 20.0},
    '33960': {'name': 'IRIDIUM 33 DEB (33960)', 'cd': 2.2, 'area': 0.5, 'mass': 20.0},
    '35744': {'name': 'IRIDIUM 33 DEB (35744)', 'cd': 2.2, 'area': 0.5, 'mass': 20.0},
    '33860': {'name': 'IRIDIUM 33 DEB (33860)', 'cd': 2.2, 'area': 0.5, 'mass': 20.0},
    '34077': {'name': 'IRIDIUM 33 DEB (34077)', 'cd': 2.2, 'area': 0.5, 'mass': 20.0},
    '34652': {'name': 'IRIDIUM 33 DEB (34652)', 'cd': 2.2, 'area': 0.5, 'mass': 20.0},
    '33881': {'name': 'IRIDIUM 33 DEB (33881)', 'cd': 2.2, 'area': 0.5, 'mass': 20.0},
    '34366': {'name': 'IRIDIUM 33 DEB (34366)', 'cd': 2.2, 'area': 0.5, 'mass': 20.0},
    '35051': {'name': 'IRIDIUM 33 DEB (35051)', 'cd': 2.2, 'area': 0.5, 'mass': 20.0},
    '33773': {'name': 'IRIDIUM 33 DEB (33773)', 'cd': 2.2, 'area': 0.5, 'mass': 20.0},
    '35620': {'name': 'IRIDIUM 33 DEB (35620)', 'cd': 2.2, 'area': 0.5, 'mass': 20.0},
    '33776': {'name': 'IRIDIUM 33 DEB (33776)', 'cd': 2.2, 'area': 0.5, 'mass': 20.0},
    '38228': {'name': 'IRIDIUM 33 DEB (38228)', 'cd': 2.2, 'area': 0.5, 'mass': 20.0},
    '35680': {'name': 'IRIDIUM 33 DEB (35680)', 'cd': 2.2, 'area': 0.5, 'mass': 20.0}
}

# Space-Track API
SPACETRACK_URL = "https://www.space-track.org"
LOGIN_URL = f"{SPACETRACK_URL}/ajaxauth/login"

# CONSERVATIVE rate limiting - 15 seconds between requests
REQUEST_DELAY = 15


def parse_mean_motion(line2):
    return float(line2[52:63])


def parse_mean_motion_derivative(line1):
    raw = line1[33:43].strip()
    return float(raw)


def parse_eccentricity(line2):
    return float("0." + line2[26:33])


def parse_norad_id(line1):
    """Extract NORAD ID from TLE line 1"""
    return line1[2:7].strip().lstrip('0')


def tle_epoch_to_datetime(line1):
    epoch = line1[18:32]
    year_2digit = int(epoch[:2])
    year = 2000 + year_2digit if year_2digit < 57 else 1900 + year_2digit
    day = float(epoch[2:])
    dt = datetime(year, 1, 1, tzinfo=timezone.utc) + timedelta(days=day - 1)
    return dt


def calculate_density_and_orbit(line1, line2, cd, area, mass):
    try:
        epoch = tle_epoch_to_datetime(line1)
        N = parse_mean_motion(line2)
        N_dot = parse_mean_motion_derivative(line1)

        n = N * 2 * np.pi / 86400.0
        n_dot = N_dot * 2 * np.pi / (86400.0**2)

        a = (MU / n**2)**(1/3)
        e = parse_eccentricity(line2)
        perigee_alt = (a * (1 - e) - R_EARTH) / 1000
        apogee_alt = (a * (1 + e) - R_EARTH) / 1000

        if perigee_alt < 100 or perigee_alt > 2000:
            return None

        v = np.sqrt(MU / a)
        rho = (2 * mass * n_dot) / (3 * cd * area * n * v)

        if rho < 0:
            return None

        return {
            'epoch': epoch.isoformat(),
            'density': float(rho),
            'perigee': float(perigee_alt),
            'apogee': float(apogee_alt),
            'sma': float(a / 1000)
        }
    except Exception:
        return None


def check_rate_limit(response):
    """Check if we're being rate limited and abort if so"""
    if response.status_code == 429:
        print("\n" + "!" * 60)
        print("RATE LIMITED! Stopping immediately to protect your account.")
        print("!" * 60)
        return True
    if 'rate limit' in response.text.lower() or 'too many requests' in response.text.lower():
        print("\n" + "!" * 60)
        print("RATE LIMIT WARNING detected! Stopping to protect your account.")
        print("!" * 60)
        return True
    return False


def fetch_batch_tles(session, norad_ids, start_date, end_date):
    """
    Fetch TLEs for MULTIPLE satellites in a SINGLE query.
    This is much more API-friendly than individual queries.
    """
    # Format dates
    start_str = start_date.strftime("%Y-%m-%d")
    end_str = end_date.strftime("%Y-%m-%d")

    # Join NORAD IDs with commas for batch query
    norad_str = ",".join(norad_ids)

    # Batch query for all satellites at once
    query_url = (
        f"{SPACETRACK_URL}/basicspacedata/query/class/gp_history"
        f"/NORAD_CAT_ID/{norad_str}"
        f"/EPOCH/{start_str}--{end_str}"
        f"/orderby/NORAD_CAT_ID,EPOCH%20asc/format/tle"
    )

    print(f"    Fetching batch of {len(norad_ids)} satellites...")
    print(f"    Date range: {start_str} to {end_str}")

    try:
        response = session.get(query_url, timeout=300)  # Long timeout for big query

        if check_rate_limit(response):
            return None  # Signal to abort

        if response.status_code == 200:
            # Parse TLEs and organize by NORAD ID
            tles_by_id = {nid: [] for nid in norad_ids}
            lines = response.text.strip().split('\n')

            i = 0
            while i < len(lines) - 1:
                line1 = lines[i].strip()
                line2 = lines[i + 1].strip()
                if line1.startswith('1 ') and line2.startswith('2 '):
                    norad_id = parse_norad_id(line1)
                    if norad_id in tles_by_id:
                        tles_by_id[norad_id].append((line1, line2))
                    i += 2
                else:
                    i += 1

            total_tles = sum(len(v) for v in tles_by_id.values())
            print(f"    Retrieved {total_tles} total TLEs")
            return tles_by_id
        else:
            print(f"    Space-Track returned status {response.status_code}")
            if response.status_code == 401:
                print("    Authentication failed")
            return {}

    except Exception as e:
        print(f"    Error: {e}")
        return {}


def main():
    # Get credentials
    spacetrack_user = os.environ.get('SPACETRACK_USER', '')
    spacetrack_pass = os.environ.get('SPACETRACK_PASS', '')

    if not spacetrack_user:
        print("Space-Track credentials required.")
        spacetrack_user = input("Enter Space-Track username (email): ").strip()
        spacetrack_pass = getpass.getpass("Enter Space-Track password: ")

    print("=" * 60)
    print("TLE DENSITY BOOTSTRAP - CONSERVATIVE MODE")
    print("=" * 60)
    print(f"Processing {len(SATELLITES)} satellites")
    print(f"Using {REQUEST_DELAY}s delay between requests")
    print("Will abort immediately if rate limited")
    print("=" * 60)

    # Data directory
    data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
    os.makedirs(data_dir, exist_ok=True)

    # Create session and login
    session = requests.Session()
    print("\nLogging in to Space-Track...")

    login_response = session.post(
        LOGIN_URL,
        data={'identity': spacetrack_user, 'password': spacetrack_pass}
    )

    if login_response.status_code != 200 or 'Failed' in login_response.text:
        print(f"Login failed: {login_response.text}")
        return 1

    print("Login successful!")

    # Date range - last 12 months
    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=365)

    # Split into 2 queries of 6 months each to keep response size manageable
    mid_date = end_date - timedelta(days=182)

    norad_ids = list(SATELLITES.keys())
    all_tles = {nid: [] for nid in norad_ids}

    # First batch: older 6 months
    print(f"\n[Query 1/2] Fetching older 6 months...")
    result = fetch_batch_tles(session, norad_ids, start_date, mid_date)
    if result is None:
        print("Aborting due to rate limit!")
        session.get(f"{SPACETRACK_URL}/ajaxauth/logout")
        return 1
    for nid, tles in result.items():
        all_tles[nid].extend(tles)

    # Wait between queries
    print(f"\n    Waiting {REQUEST_DELAY} seconds before next query...")
    time.sleep(REQUEST_DELAY)

    # Second batch: recent 6 months
    print(f"\n[Query 2/2] Fetching recent 6 months...")
    result = fetch_batch_tles(session, norad_ids, mid_date, end_date)
    if result is None:
        print("Aborting due to rate limit!")
        session.get(f"{SPACETRACK_URL}/ajaxauth/logout")
        return 1
    for nid, tles in result.items():
        all_tles[nid].extend(tles)

    # Logout
    session.get(f"{SPACETRACK_URL}/ajaxauth/logout")
    print("\nLogged out from Space-Track")

    # Process and save data for each satellite
    print("\n" + "=" * 60)
    print("Processing TLEs and calculating densities...")
    print("=" * 60)

    successful = 0
    failed = 0

    for norad_id, sat_config in SATELLITES.items():
        tles = all_tles.get(norad_id, [])
        print(f"\n{sat_config['name']}: {len(tles)} TLEs")

        if not tles:
            print(f"    No data - skipping")
            failed += 1
            continue

        # Process TLEs
        data = {
            'times': [],
            'densities': [],
            'perigees': [],
            'apogees': [],
            'smas': []
        }

        seen_epochs = set()
        for line1, line2 in tles:
            result = calculate_density_and_orbit(
                line1, line2,
                sat_config['cd'],
                sat_config['area'],
                sat_config['mass']
            )

            if result and result['epoch'] not in seen_epochs:
                seen_epochs.add(result['epoch'])
                data['times'].append(result['epoch'])
                data['densities'].append(result['density'])
                data['perigees'].append(result['perigee'])
                data['apogees'].append(result['apogee'])
                data['smas'].append(result['sma'])

        print(f"    {len(data['times'])} valid density points")

        if not data['times']:
            failed += 1
            continue

        # Sort by time
        combined = list(zip(
            data['times'],
            data['densities'],
            data['perigees'],
            data['apogees'],
            data['smas']
        ))
        combined.sort(key=lambda x: x[0])

        data['times'] = [x[0] for x in combined]
        data['densities'] = [x[1] for x in combined]
        data['perigees'] = [x[2] for x in combined]
        data['apogees'] = [x[3] for x in combined]
        data['smas'] = [x[4] for x in combined]

        # Add metadata
        data['norad_id'] = norad_id
        data['name'] = sat_config['name']
        data['cd'] = sat_config['cd']
        data['area'] = sat_config['area']
        data['mass'] = sat_config['mass']
        data['generated_at'] = datetime.now(timezone.utc).isoformat()

        # Store latest TLE
        if tles:
            data['tle_line1'] = tles[-1][0]
            data['tle_line2'] = tles[-1][1]

        # Save
        output_file = os.path.join(data_dir, f"density-{norad_id}.json")
        with open(output_file, 'w') as f:
            json.dump(data, f)
        print(f"    Saved to density-{norad_id}.json")
        successful += 1

    print("\n" + "=" * 60)
    print("BOOTSTRAP COMPLETE")
    print(f"Successful: {successful}/{len(SATELLITES)}")
    print(f"Failed: {failed}/{len(SATELLITES)}")
    print("Total API queries made: 2 (batched)")
    print("=" * 60)

    return 0


if __name__ == "__main__":
    exit(main())
