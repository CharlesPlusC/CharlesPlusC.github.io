# Satellite Pass Prediction API

This API provides accurate satellite pass predictions using the Skyfield Python library.

## Endpoint

`GET /api/satellite_passes`

## Parameters

- `lat` (float): Observer latitude in degrees (-90 to 90)
- `lon` (float): Observer longitude in degrees (-180 to 180)
- `alt` (float): Observer altitude in meters
- `days` (int, optional): Number of days to predict (default: 7)

## Example Request

```
GET /api/satellite_passes?lat=51.5074&lon=-0.1278&alt=0&days=7
```

## Response Format

```json
{
  "success": true,
  "location": {
    "lat": 51.5074,
    "lon": -0.1278,
    "alt": 0
  },
  "satellites": {
    "25338": {
      "name": "NOAA 15",
      "frequency": "137.620 MHz",
      "passes": [
        {
          "start": "2025-12-28T12:34:56Z",
          "end": "2025-12-28T12:45:12Z",
          "max_elevation": 45.2,
          "duration": 10,
          "max_elevation_time": "2025-12-28T12:40:05Z"
        }
      ]
    }
  },
  "generated_at": "2025-12-28T11:30:00Z"
}
```

## Deployment

This API is designed to run as a Vercel serverless function. It will automatically:
- Fetch fresh TLE data from Celestrak
- Calculate pass predictions using Skyfield
- Return accurate timing and elevation data

## Dependencies

- `skyfield`: Professional astronomy library for accurate satellite tracking
- `numpy`: Required by Skyfield for numerical calculations
