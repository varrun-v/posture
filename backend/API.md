# API Quick Reference

## Base URL
```
http://localhost:8000/api/v1
```

## Users

> **Note**: This is a single-user application. A default user (ID: 1) is created automatically when you run `setup_db.py`.

### Get Default User
```bash
GET /users/1
```

## Sessions

### Start Session
```bash
POST /sessions/start
{
  "user_id": 1
}
```

### Stop Session
```bash
POST /sessions/{session_id}/stop
```

### Get Active Session
```bash
GET /sessions/user/{user_id}/active
```

### Get User Sessions
```bash
GET /sessions/user/{user_id}?status=active&limit=10
```

## Posture

### Log Posture
```bash
POST /posture/log
{
  "session_id": 1,
  "posture_status": "GOOD",
  "neck_angle": 10.5,
  "torso_angle": 5.2,
  "distance_score": 0.75,
  "confidence": 0.95
}
```

### Get Current Posture
```bash
GET /posture/session/{session_id}/current
```

### Get Session Stats
```bash
GET /posture/session/{session_id}/stats
```

### Get Posture History
```bash
GET /posture/session/{session_id}/history?limit=100
```

## Posture Status Values
- `GOOD` - Correct posture
- `SLOUCHING` - Poor posture detected
- `TOO_CLOSE` - Too close to screen
- `NO_PERSON` - No person detected

## Interactive Documentation
Visit http://localhost:8000/docs for full interactive API documentation.
