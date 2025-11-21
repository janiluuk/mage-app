#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env.docker"
APP_ENV_FILE="$ROOT_DIR/.env"
ENV_TEMPLATE="$ROOT_DIR/.env.docker.example"

if [ ! -f "$ENV_TEMPLATE" ]; then
  echo "Missing .env.docker.example. Aborting." >&2
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  cp "$ENV_TEMPLATE" "$ENV_FILE"
  echo "Created $ENV_FILE from template."
fi

if [ ! -f "$APP_ENV_FILE" ]; then
  cp "$ENV_TEMPLATE" "$APP_ENV_FILE"
  echo "Created $APP_ENV_FILE for the frontend build." 
fi

docker compose -f "$ROOT_DIR/docker-compose.yml" up --build "$@"
