#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
export LAB_UID="$(id -u)" LAB_GID="$(id -g)"
docker compose build
docker compose run --rm init-deps
docker compose run --rm lab npm ci
docker compose up -d lab
printf '\nDashboard: http://localhost:5173/linear-algebra/\n'
