# Podman Setup - Complete ✓

## What We Built

### 1. Podman Compose Configuration (`podman-compose.yml`)
- **PostgreSQL 15** container with:
  - User: `posture_user`
  - Password: `posture_pass`
  - Database: `posture_db`
  - Port: 5432
  - Persistent volume for data
  - Health checks

- **Redis 7** container with:
  - Port: 6379
  - Persistent volume for data
  - Health checks

### 2. Documentation
- **PODMAN.md**: Complete reference for Podman commands
  - Starting/stopping services
  - Viewing logs
  - Accessing databases
  - Troubleshooting

### 3. Quick Start Script (`start-services.sh`)
- Automated script to start both containers
- Checks if podman-compose is installed
- Shows container status
- Displays connection information

### 4. Updated README
- Added Podman setup instructions
- Added database initialization steps
- Updated development roadmap

## How to Use

### Start Services
```bash
# Option 1: Use the quick start script
./start-services.sh

# Option 2: Manual start
podman-compose up -d
```

### Check Status
```bash
podman-compose ps
```

### View Logs
```bash
podman-compose logs -f
```

### Stop Services
```bash
podman-compose down
```

### Access PostgreSQL
```bash
# Using podman
podman exec -it posture_postgres psql -U posture_user -d posture_db

# Using local psql
psql -h localhost -U posture_user -d posture_db
```

### Access Redis
```bash
podman exec -it posture_redis redis-cli
```

## Next Steps

1. **Start the containers**:
   ```bash
   ./start-services.sh
   ```

2. **Initialize the database**:
   ```bash
   cd backend
   source venv/bin/activate
   python setup_db.py
   ```

3. **Run the backend**:
   ```bash
   uvicorn app.main:app --reload
   ```

4. **Test the connection**:
   - Visit http://localhost:8000
   - You should see: `{"message": "Posture Monitor API", "status": "running"}`
   - Check http://localhost:8000/docs for API documentation

## Files Added

- `podman-compose.yml` - Container orchestration
- `PODMAN.md` - Command reference
- `start-services.sh` - Quick start script
- Updated `README.md` - Setup instructions

## Ready to Commit! 🎉

**Suggested commit message:**
```
feat: add Podman configuration for PostgreSQL and Redis

- Add podman-compose.yml with PostgreSQL 15 and Redis 7
- Add health checks and persistent volumes
- Add PODMAN.md with command reference
- Add start-services.sh quick start script
- Update README with Podman setup instructions
```
