#!/bin/bash

set -euo pipefail

cd /opt/collix
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d --remove-orphans
"$(dirname "$0")/cleanup.sh"
