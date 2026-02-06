# Podman Quick Reference

## Start Services
```bash
podman-compose up -d
```

## Stop Services
```bash
podman-compose down
```

## View Logs
```bash
# All services
podman-compose logs -f

# Specific service
podman-compose logs -f postgres
podman-compose logs -f redis
```

## Check Status
```bash
podman-compose ps
```

## Access PostgreSQL
```bash
# Using podman exec
podman exec -it posture_postgres psql -U posture_user -d posture_db

# Using local psql (if installed)
psql -h localhost -U posture_user -d posture_db
# Password: posture_pass
```

## Access Redis CLI
```bash
podman exec -it posture_redis redis-cli
```

## Remove Volumes (Clean Start)
```bash
podman-compose down -v
```

## Troubleshooting

### Check if containers are running
```bash
podman ps
```

### Check container logs
```bash
podman logs posture_postgres
podman logs posture_redis
```

### Restart a specific service
```bash
podman-compose restart postgres
```

### Check health status
```bash
podman inspect posture_postgres | grep -A 10 Health
```
