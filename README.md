# Posture & Break Reminder System

A real-time posture monitoring system using computer vision to detect slouching and promote healthy sitting habits.

## Tech Stack

- **Frontend**: Next.js 14 (TypeScript, TailwindCSS)
- **Backend**: FastAPI (Python)
- **Database**: PostgreSQL
- **Cache/Queue**: Redis
- **Containerization**: Podman

## Project Structure

```
posture/
├── frontend/          # Next.js application
├── backend/           # FastAPI application
│   ├── app/
│   │   ├── main.py   # FastAPI entry point
│   │   ├── api/      # API routes
│   │   ├── models/   # Database models
│   │   ├── core/     # Core logic
│   │   └── workers/  # Celery workers
│   └── requirements.txt
└── .env              # Environment variables
```

## Getting Started

### Prerequisites

- Node.js 20+
- Python 3.11+
- Podman (or Docker)

### Setup

1. **Clone and install dependencies**

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. **Configure environment**

```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Run development servers**

```bash
# Terminal 1 - Backend
cd backend
uvicorn app.main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev
```

4. **Access the application**

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Development Roadmap

- [x] Phase 1: Basic project setup
- [ ] Phase 2: Database and models
- [ ] Phase 3: Posture detection with MediaPipe
- [ ] Phase 4: Real-time monitoring
- [ ] Phase 5: Analytics and reports
- [ ] Phase 6: Containerization

## License

MIT
