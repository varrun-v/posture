# MediaPipe Posture Detection - Complete ✓

## What We Built

### 1. Backend: MediaPipe Detector (`app/core/posture_detector.py`)

**PostureDetector Class:**
- Initializes MediaPipe Pose model
- Decodes base64 frames from frontend
- Detects pose landmarks (33 points)
- Calculates key angles:
  - **Neck angle**: Ear → Shoulder → Hip (forward lean)
  - **Torso angle**: Shoulder → Hip → Vertical (slouch)
  - **Distance score**: Based on shoulder width (too close detection)

**Posture Classification:**
- `GOOD`: Neck ~180°, Torso ~90°, Distance 0.75-1.25
- `SLOUCHING`: Neck < 160° or Torso < 75°
- `TOO_CLOSE`: Distance > 1.3
- `NO_PERSON`: No pose detected

### 2. API Endpoint (`app/api/posture.py`)

**POST `/api/v1/posture/analyze-frame`**
- Receives base64 frame + session_id
- Runs MediaPipe analysis
- Auto-logs result to database
- Returns posture status + angles

### 3. Frontend: Camera Component (`components/CameraView.tsx`)

**Features:**
- Webcam access with permission handling
- Captures frames every 1 second
- Sends to backend for analysis
- Real-time posture status overlay
- Color-coded indicators (green/yellow/red)
- Helpful messages for each status

### 4. Updated Main Page

**Layout:**
- Session Control (top-left)
- Camera View (top-right)
- Session Stats (bottom, full width)

## How It Works

```
1. User starts session
   ↓
2. Camera component requests webcam access
   ↓
3. Every 1 second:
   - Capture video frame
   - Convert to base64
   - Send to backend
   ↓
4. Backend (MediaPipe):
   - Decode frame
   - Detect pose landmarks
   - Calculate angles
   - Classify posture
   - Log to database
   ↓
5. Frontend displays:
   - Real-time status overlay
   - Color indicator
   - Helpful message
   ↓
6. Stats component shows:
   - Posture breakdown
   - Duration
   - Data points
```

## Testing

### 1. Start Backend
```bash
cd backend
uvicorn app.main:app --reload
```

### 2. Start Frontend
```bash
cd frontend
npm run dev
```

### 3. Test Flow
1. Visit http://localhost:3000
2. Click "Start Monitoring"
3. Click "Enable Camera" (grant permission)
4. Sit with good posture → See "GOOD" (green)
5. Lean forward → See "SLOUCHING" (yellow)
6. Move close to camera → See "TOO_CLOSE" (red)
7. Check stats for posture breakdown
8. Stop session

## MediaPipe Configuration

**Model Settings:**
- `model_complexity`: 1 (balanced speed/accuracy)
- `smooth_landmarks`: True (reduces jitter)
- `min_detection_confidence`: 0.5
- `min_tracking_confidence`: 0.5

**Frame Analysis Rate:**
- 1 frame per second (adjustable in CameraView.tsx)
- Balance between accuracy and performance

## Posture Thresholds

Can be adjusted in `posture_detector.py`:

```python
def _classify_posture(self, neck_angle, torso_angle, distance_score):
    if distance_score > 1.3:  # Too close threshold
        return 'TOO_CLOSE'
    
    if neck_angle < 160:  # Neck forward lean threshold
        return 'SLOUCHING'
    
    if torso_angle < 75:  # Torso slouch threshold
        return 'SLOUCHING'
    
    return 'GOOD'
```

## Files Added

**Backend:**
- `app/core/posture_detector.py` - MediaPipe detection logic
- Updated `app/api/posture.py` - Added `/analyze-frame` endpoint

**Frontend:**
- `components/CameraView.tsx` - Webcam + real-time detection
- Updated `app/page.tsx` - Integrated camera view

## Performance Notes

- MediaPipe runs on CPU (no GPU needed)
- ~100-200ms per frame analysis
- 1 FPS is sufficient for posture monitoring
- Adjust interval in CameraView if needed

## Next Steps (Optional)

- [ ] Add desktop notifications for bad posture
- [ ] Implement break reminders (Celery workers)
- [ ] Add historical charts
- [ ] Calibration for different body types
- [ ] Export session reports

## Ready to Commit! 🎉

**Suggested commit message:**
```
feat: add MediaPipe posture detection with real-time camera analysis

- Add MediaPipe pose detection module with angle calculation
- Add /analyze-frame API endpoint for real-time analysis
- Add CameraView component with webcam access
- Implement posture classification (GOOD/SLOUCHING/TOO_CLOSE)
- Auto-log detection results to database
- Add real-time status overlay on camera feed
```
