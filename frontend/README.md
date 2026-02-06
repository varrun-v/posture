# Frontend - Posture Monitor

## Features Implemented

✅ **Session Management**
- Start/stop monitoring sessions
- Real-time session duration tracking
- Automatic active session detection

✅ **Statistics Display**
- Live session statistics
- Posture breakdown visualization
- Auto-refresh every 5 seconds

✅ **API Integration**
- Full API client library
- TypeScript type definitions
- Error handling

## Components

### `SessionControl`
- Start/stop session buttons
- Session status display
- Duration counter

### `SessionStats`
- Real-time statistics
- Posture breakdown with progress bars
- Color-coded status indicators

## Running the Frontend

```bash
cd frontend
npm run dev
```

Visit: http://localhost:3000

## Environment Variables

Create `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Testing the Integration

1. **Start the backend**:
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```

2. **Start the frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test the flow**:
   - Click "Start Monitoring"
   - Session should start and show ID
   - Stats will show "No posture data yet" (MediaPipe coming next!)
   - Click "Stop Monitoring" to end session

## Next Steps

- [ ] Add MediaPipe camera integration
- [ ] Real-time posture detection
- [ ] Desktop notifications
- [ ] Historical data charts
