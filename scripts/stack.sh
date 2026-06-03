#!/usr/bin/env bash
# Bring up the full mage stack (mage-app + mage-api built from source + datastores)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

MAGE_API_SOURCE="${MAGE_API_SOURCE:-$PROJECT_ROOT/../mage-api}"
COMPOSE_FILES="-f $PROJECT_ROOT/docker-compose.yml -f $PROJECT_ROOT/docker-compose.stack.yml"
COMPOSE="docker compose $COMPOSE_FILES"

# UID must be exported so the mage-api Dockerfile can create the right user
# UID is readonly in bash, so just export the shell variable without reassigning
export UID

usage() {
  echo "Usage: $0 [command]"
  echo ""
  echo "Commands:"
  echo "  up [--build]   Start the full stack (default)"
  echo "  down           Stop and remove containers"
  echo "  restart        down + up"
  echo "  build          Build/rebuild images without starting"
  echo "  logs [svc]     Follow logs (optionally for one service)"
  echo "  ps             Show running containers"
  echo "  migrate        Run mage-api database migrations"
  echo "  shell          Open a shell in the mage-api container"
  echo ""
  echo "Env:"
  echo "  MAGE_API_SOURCE   Path to mage-api source (default: ../mage-api)"
}

check_prereqs() {
  if ! command -v docker &>/dev/null; then
    echo "ERROR: docker not found" >&2
    exit 1
  fi
  if ! docker compose version &>/dev/null; then
    echo "ERROR: docker compose plugin not found" >&2
    exit 1
  fi
  if [[ ! -d "$MAGE_API_SOURCE" ]]; then
    echo "ERROR: mage-api source not found at: $MAGE_API_SOURCE"
    echo "  Clone it or set MAGE_API_SOURCE=/path/to/mage-api"
    exit 1
  fi
  if [[ ! -f "$PROJECT_ROOT/.env.docker" ]]; then
    echo "WARNING: .env.docker not found, copying from .env.docker.example"
    cp "$PROJECT_ROOT/.env.docker.example" "$PROJECT_ROOT/.env.docker"
  fi
}

cmd="${1:-up}"

case "$cmd" in
  up)
    check_prereqs
    shift || true
    echo "Starting full stack (mage-api from: $MAGE_API_SOURCE)"
    $COMPOSE up -d "$@"
    echo ""
    echo "Stack is up. Services:"
    $COMPOSE ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || $COMPOSE ps
    echo ""
    echo "  Frontend:  http://localhost"
    echo "  mage-api:  http://localhost/mage-api/"
    echo "  helper:    http://localhost/api/"
    ;;
  down)
    check_prereqs
    shift || true
    $COMPOSE down "$@"
    ;;
  restart)
    check_prereqs
    $COMPOSE down
    $COMPOSE up -d
    ;;
  build)
    check_prereqs
    shift || true
    MAGE_API_SOURCE="$MAGE_API_SOURCE" $COMPOSE build "$@"
    ;;
  logs)
    check_prereqs
    shift || true
    $COMPOSE logs -f "$@"
    ;;
  ps)
    check_prereqs
    $COMPOSE ps
    ;;
  migrate)
    check_prereqs
    echo "Running mage-api migrations..."
    $COMPOSE exec mage-api php artisan migrate --force
    ;;
  shell)
    check_prereqs
    $COMPOSE exec mage-api bash
    ;;
  help|--help|-h)
    usage
    ;;
  *)
    echo "Unknown command: $cmd"
    usage
    exit 1
    ;;
esac
