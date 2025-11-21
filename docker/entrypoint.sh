#!/bin/sh
set -e

cd /app

if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

exec npm run dev
