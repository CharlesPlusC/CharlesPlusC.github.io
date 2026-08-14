#!/usr/bin/env python3
"""Build data/space-stats.json from the CelesTrak satellite catalogue.

Counts launches and reentries over a rolling 30-day window, plus the number of
objects currently on orbit. A rolling window rather than a same-day count
because launches are bursty (roughly half of all days see none at all) and the
catalogue lags reality by a few days: objects are added once tracking settles,
so "today" would read zero far more often than not.
"""

import csv
import datetime as dt
import io
import json
import os
import sys
import urllib.request

SATCAT_URL = "https://celestrak.org/pub/satcat.csv"
WINDOW_DAYS = 30
OUT_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "space-stats.json")


def fetch_satcat(url=SATCAT_URL):
    req = urllib.request.Request(url, headers={"User-Agent": "charlesplusc.github.io space-stats"})
    with urllib.request.urlopen(req, timeout=120) as resp:
        if resp.status != 200:
            raise RuntimeError(f"SATCAT fetch failed: HTTP {resp.status}")
        return resp.read().decode("utf-8", errors="replace")


def parse_date(value):
    if not value:
        return None
    try:
        return dt.date.fromisoformat(value)
    except ValueError:
        return None


def build_stats(csv_text, today=None):
    today = today or dt.datetime.now(dt.timezone.utc).date()
    cutoff = today - dt.timedelta(days=WINDOW_DAYS)

    launched = reentered = 0
    on_orbit = payloads = debris = 0
    latest_launch = latest_decay = None

    for row in csv.DictReader(io.StringIO(csv_text)):
        launch = parse_date(row.get("LAUNCH_DATE"))
        decay = parse_date(row.get("DECAY_DATE"))
        obj_type = (row.get("OBJECT_TYPE") or "").strip()

        if launch:
            if cutoff < launch <= today:
                launched += 1
            if latest_launch is None or launch > latest_launch:
                latest_launch = launch

        if decay:
            if cutoff < decay <= today:
                reentered += 1
            if latest_decay is None or decay > latest_decay:
                latest_decay = decay
        else:
            # No decay date means the object has not reentered.
            on_orbit += 1
            if obj_type == "PAY":
                payloads += 1
            elif obj_type == "DEB":
                debris += 1

    if on_orbit == 0:
        raise RuntimeError("parsed 0 on-orbit objects - SATCAT format may have changed")

    return {
        "window_days": WINDOW_DAYS,
        "launched": launched,
        "reentered": reentered,
        "on_orbit": on_orbit,
        "payloads": payloads,
        "debris": debris,
        "catalog_latest_launch": latest_launch.isoformat() if latest_launch else None,
        "catalog_latest_decay": latest_decay.isoformat() if latest_decay else None,
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "source": "CelesTrak SATCAT",
    }


def main():
    stats = build_stats(fetch_satcat())
    out = os.path.abspath(OUT_PATH)
    with open(out, "w", encoding="utf-8") as fh:
        json.dump(stats, fh, indent=2)
        fh.write("\n")
    print(json.dumps(stats, indent=2))
    print(f"\nwrote {out}", file=sys.stderr)


if __name__ == "__main__":
    main()
